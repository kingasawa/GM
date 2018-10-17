const json2csv = require('json2csv');

import QueryBuilder from 'node-datatable';
import bluebird from 'bluebird';
import validate from 'validate.js';
import sortBy from 'lodash.sortby';
import moment from 'moment';

const { DEFAULT_SHIPPING_FEE, DEFAULT_BASE_COST } = sails.config.report;

module.exports = {
  inventory_data: async (req, res) => {

    let selectSql = `p.id, m.brand, m.name, sku, color, size, shippingWeight, base_price, gtin, stock, p.createdAt, p.material`

    bluebird.promisifyAll(Product);
    let tableDefinition = {
      dbType: 'postgres',
      sSelectSql: selectSql,
      sTableName: 'public.product p LEFT JOIN public.material m on p.material = m.id',
      aSearchColumns: [
        'p.id',
        'm.name',
        'p.createdAt',
        'm.brand_code',
        'color',
        'size',
        'shippingWeight',
        'base_price',
        'gtin',
        'stock'
      ]
    };

    let queryParams = req.allParams();
    let queryBuilder = new QueryBuilder(tableDefinition);
    let queries = queryBuilder.buildQuery(queryParams);

    /** fix "createdAt" search issue **/
    let newQueries = {};
    _.each(queries, (value, key) => {
      newQueries[key] = value.replace(/([a-z]{1,})([A-Z][a-z]{1,})\b/g, '"$1$2"');
    })
    queries = newQueries;
    /** fix "createdAt" search issue **/

    console.log('queries', queries);
    // sails.log.debug("SCP:Order:Datatables", queries);
    let recordsFiltered;
    if (queries.recordsFiltered) {
      recordsFiltered = await (Product.queryAsync(queries.recordsFiltered));
      recordsFiltered = recordsFiltered.rows;
    }

    let recordsTotal = await (Product.queryAsync(queries.recordsTotal));
    recordsTotal = recordsTotal.rows;

    let select = await (Product.queryAsync(queries.select));
    select = select.rows;

    let results = {
      recordsTotal,
      select
    };
    if (recordsFiltered) {
      results.recordsFiltered = recordsFiltered;
    }
    // console.log('results', results);
    res.json(queryBuilder.parseResponse(results));
  },

  index: (req, res) => {
    res.view('inventory/index')
  },

  itemView: async (req, res) => {
    let { id } = req.allParams();
    let materialData = await Material.findOne(id)
                                     .populate('image')
                                     .populate('size')
                                     .populate('cost')
                                     .populate('color')
    // let productData = await Product.find({ material: id }).sort('size asc');
    // console.log('productData', productData);
    // console.log('materialData.cost', materialData.cost)
    // console.log('materialData.size', materialData.size)
    // console.log('materialData.color', materialData.color)

    let materialDataColorSorted = sortBy(materialData.color[0].color, ['name'])
    let materialDataSizeSorted = sortBy(materialData.size[0].size, ['size'])
    // console.log('itemView materialData', materialData);

    console.log('materialDataColorSorted', materialDataColorSorted);
    res.view('inventory/item-view', {
      materialData,
      materialDataColorSorted,
      materialDataSizeSorted,
      id
    })
  },

  import: async (req, res) => {
    res.view('inventory/import');
  },

  /**
   * @TODO Dont destroy product table, update data instead
   * @param req
   * @param res
   * @returns {Promise.<void>}
   */
  upload: async (req, res) => {
    let { destroy } = req.allParams();
    let columns = [];
    let data = [];
    let materialDataKey = await Material.keyBy('brand_code');
    console.log('materialDataKey', materialDataKey);

    console.log('destroy', destroy);
    // @NOTE dont support destroy prod
    if (destroy) {
      // await Promise.resolve(Product.destroy());
    }

    req.file('files').upload({
      adapter: require('skipper-csv'),
      csvOptions: {
        delimiter: ',',
        columns: true
      },
      rowHandler: async (row, fd) => {
        if (_.size(columns) === 0) {
          columns = Object.keys(row).map(item => ({ title: item }));

        }

        let id = _.get(row, 'Variant ID') || _.get(row, 'id')

        if (id) {
          /* Start Normalize all data */

          // let brand = _.get(row, 'brand')
          let brand_code = _.get(row, 'brand_code', null)  || null
          // let type = _.get(row, 'Type')
          let color = _.get(row, 'color', null) || null
          if(color !== null){
            color = color.trim();
          }

          let size = _.get(row, 'size', null) || null
          if(size !== null){
            size = size.trim();
          }

          let sku = _.get(row, 'sku', null) || null
          if(sku !== null){
            sku = sku.toUpperCase().trim();
          }

          let shippingWeight = parseFloat(_.get(row, 'shippingWeight', 0)) || 0
          let gtin = _.get(row, 'gtin', null)|| null
          if(gtin !== null){
            sku = sku.trim();
          }

          let stock = _.get(row, 'stock', 0) || null
          if(stock !== null){
            stock = parseInt(stock, 10)
          }

          let item_id = _.get(row, 'item_id', null) || null
          let base_price = parseFloat(_.get(row, 'base_price')) || 0
          // let displayName = _.get(row, 'Display Name')
          /* End Normalize all data */

          console.log('stock', stock);

          console.log('Process variant id', id);
          let productData = await Product.findOne(id);
          if (productData) {
            let updateData = {}

            if (_.get(row, 'sku') !== undefined) {
              updateData.sku = sku
            }
            if (_.get(row, 'shippingWeight') !== undefined) {
              updateData.shippingWeight = shippingWeight
            }
            if (_.get(row, 'base_price') !== undefined) {
              updateData.base_price = base_price
            }
            if (_.get(row, 'stock') !== undefined) {
              updateData.stock = stock
            }
            if (_.get(row, 'gtin') !== undefined) {
              updateData.gtin = gtin
            }
            if (_.get(row, 'item_id') !== undefined) {
              updateData.item_id = item_id
            }
            let productData = await Product.update(id, updateData)
                                           .then(data => {
                                             console.log('Product updated', data);
                                           })
                                           .catch((err) => {
                                             console.log('Product update err', err);
                                           })

            console.log('found updateData', id, updateData);
            // console.log('found productData', id, productData);
          } else {
            let materialData = materialDataKey[brand_code];
            let { id: material } = materialData;
            if (material) {
              let insertData = {
                // id,
                // brandCode,
                // displayName,
                //type,
                color,
                gtin,
                sku,
                size,
                shippingWeight,
                base_price,
                material,
                stock,
                item_id
              }

              if(id){
                insertData.id = id;
              }

              await Promise.resolve(Product.create(insertData))
                           .then(data => {
                             console.log('product created', data)
                           })
                           .catch((err) => {
                             console.log('Product create err', err);
                           })

              console.log('not found insertData', id, insertData);


            } else {
              console.log('material not found please check brand_code', brand_code);
            }

            // @NOTE dont support destroy prod
            // if (destroy) {
            //   await Promise.resolve(Product.create(insertData))
            //   console.log('insertData', insertData);
            //   data.push(Object.values(row));
            // }
          }
        }
        // console.log('row', row);
        // console.log(fd, row);
      }
    }, function(err, files) {
      if (err)
        return res.serverError(err);

      // console.log('columns', columns);
      // console.log('data', data);

      // Show datatable
      // res.view('inventory/upload-result', {
      //   columns,
      //   data
      // })

      return res.redirect('/inventory');



      // return res.json({
      //   message: "Uploaded " + files.length + " CSV files!",
      //   files,
      //   result
      // });

    });
  },
  export_all_product: async (req, res) => {
    bluebird.promisifyAll(Product);

    let productData = await Product.queryAsync(`
    SELECT p.id, m.brand, m.brand_code, m.name, p.color, p.size, p."shippingWeight", p.base_price, p.gtin, p.stock
    , p.sku
    FROM product p LEFT JOIN material m on p.material = m.id
    ORDER BY m.id, p.color, p.size
    `);

    productData = productData.rows;

    let currentDate = moment().format('YYYYMMDD');

    let fields = Object.keys(_.get(productData, '[0]', {}));

    res.csv({
      filename: `gearment_all_product_${currentDate}`,
      data: productData,
      fields
    });
  },

  /*API*/
  getProductData: async (req, res) => {
    let { id } = req.allParams();
    let productData = await Product.find({
      select: [
        'id', 'color', 'size', 'base_price', 'gtin', 'stock'
      ],
      material: id,
      sort: {
        color: 1,
        size: 1
      }
    });
    res.json(productData)
  },

  getColorOption: async (req, res) => {
    let { id, q } = req.allParams();
    let query = { type: 'color' };
    if (q) {
      query.name = { 'like': `%${q}%` };
    }
    let optionData = await Option.find(query)
                                 .sort('name ASC')
    res.json({ items: optionData });
  },
  getSizeOption: async (req, res) => {
    let { id, q } = req.allParams();
    let query = { type: 'size' };
    if (q) {
      query.name = { 'like': `%${q}%` };
    }

    let optionData = await Option.find(query)
                                 .sort('name ASC')

    res.json(({ items: optionData }));
  },

  postProduct: async (req, res) => {
    let params = req.allParams();
    let {
      id, name, description, brand, brand_code, product_type, color, size, updateMaterialImage, minPay, cost
    } = params;

    console.log('params', params);
    let data = {};
    let updateData = {
      name,
      description,
      brand,
      brand_code,
      product_type, // color: { color: ['x'], material: id  }
    }

    let optionData = await Option.getData();

    // get current color & size
    let currentMaterialData = await Material.findOne(id)
                                            .populate('color')
                                            .populate('size')

    let currentMaterialColor = _.get(currentMaterialData, 'color[0].color', [])
    let currentMaterialSize = _.get(currentMaterialData, 'size[0].size', [])

    let currentMaterialColorId = currentMaterialColor.map(c => c.id)
    let currentMaterialSizeId = currentMaterialSize.map(s => s.id)

    let addColor = color.filter(c => currentMaterialColorId.indexOf(parseInt(c)) === -1)
    let addSize = size.filter(s => currentMaterialSizeId.indexOf(parseInt(s)) === -1)
    // console.log('currentMaterialData', currentMaterialData);
    // console.log('currentMaterialColor', currentMaterialColor);
    // console.log('currentMaterialSize', currentMaterialSize);

    console.log('current currentMaterialColorId', currentMaterialColorId);
    console.log('current currentMaterialSizeId', currentMaterialSizeId);

    console.log('user update color', color);
    console.log('user update size', size);

    console.log('addColor', addColor);
    console.log('addSize', addSize);

    // Add new color with allsize
    // This will await the loop
    // console.log('1');
    let addedVariants = 0;
    await Promise.all(addColor.map(async colorId => {
      // console.log('2');
      await Promise.all(size.map(async sizeId => {
        // console.log('3');
        let { value: productSize } = optionData['sizeId'][sizeId];
        let { name: productColor } = optionData['colorId'][colorId];

        // console.log('new color + size product', productColor, productSize);

        let addProductResult = await Product.addProduct({
          // id, // auto increase
          material: id,
          color: productColor,
          size: productSize, // clone material data for product not join
          // brandCode: brand_code,
          // displayName: name,
          // type: product_type,
          // @todo alert admin to update base_price + shippingWeight in frontend
          base_price: 0,
          shippingWeight: 0,
        });
        if (addProductResult) {
          addedVariants++
        }
      }))
    }))

    // console.log('4');
    // add new size
    // This will await the loop
    await Promise.all(currentMaterialColorId.map(async colorId => {
      // console.log('5');
      await Promise.all(addSize.map(async sizeId => {
        // console.log('6');
        let { value: productSize } = optionData['sizeId'][sizeId];
        let { name: productColor } = optionData['colorId'][colorId];

        // console.log('new size all current product', productColor, productSize);

        let addProductResult = await Product.addProduct({
          // id, // auto increase
          material: id,
          color: productColor,
          size: productSize, // clone material data for product not join
          // brandCode: brand_code,
          // displayName: name,
          // type: product_type,
          // @todo alert admin to update base_price + shippingWeight in frontend
          base_price: 0,
          shippingWeight: 0,
        });

        if (addProductResult) {
          addedVariants++
        }
      }))
    }))

    let newColorOrSizeAdded = false;

    if (addSize.length > 0 || addColor.length > 0) {
      newColorOrSizeAdded = true;
    }
    // console.log('7');
    // @todo check done before and sync
    let syncOptionsResult = await Product.syncOptions({ id });
    // await Product.syncTradeGecko({ id });


    // console.log('syncOptionsResult', syncOptionsResult);

    // console.log('8');

    // let updateMaterialImage = { frontimg, backimg };

    let imageUpdateResult = await Promise.resolve(await MaterialImage.update({ material: id },
      { image: updateMaterialImage }).catch(e => e));
    let costUpdateResult = await Promise.resolve(MaterialCost.update({ material: id },
      {
        cost,
        minPay
      }).catch(e => e));
    // let data = { color,size,image,cost };
    // sails.sockets.broadcast(session_id,'mockup/updated',{msg:data});
    // console.log(data);

    // Update material infomation
    await Material.update({ id }, updateData).then(result => {
      // console.log('result', result);
      // console.log('9 done');
      res.json({
        material: result,
        newColorOrSizeAdded,
        addedVariants
      });
    }).catch(err => {
      // console.log('err', err);
      // console.log('10 error');
      res.json(500, { error: err });
    });
  },

  updateVariant: async (req, res) => {
    let params = req.allParams();
    let { pk: id, name, value } = params;

    let all_color = 0;
    let all_size = 0;

    if(value && typeof value === 'string')
      value = value.trim();

    // console.log('params', params);
    let validateSchema = {
      pk: {
        presence: true,
        numericality: true,
      },
      name: {
        presence: true, // numericality: true,
      },
      value: {
        presence: true, // numericality: true,
      },
    };

    if (name === 'base_price' || name === 'stock') {
      validateSchema.value.numericality = true;
    } else if (name === 'gtin') {
      validateSchema.value.numericality = true;
      validateSchema.value.format = {}
      validateSchema.value.format.pattern = /^8[0-9]{11}([0-9]{2})?$/;
      validateSchema.value.format.flags = 'i';
      validateSchema.value.format.message = "GTIN not correct"
    } else if (name === 'sku') {
      // validateSchema.value.numericality = true;
      // validateSchema.value.format = {}
      // validateSchema.value.format.pattern = /^8[0-9]{11}([0-9]{2})?$/;
      // validateSchema.value.format.flags = 'i';
      // validateSchema.value.format.message = "GTIN not correct"
    }

    // update data for stock before validate
    if (name === 'stock'){
      all_color = value.all_color || 0;
      all_size = value.all_size || 0;
      if(value && value.stock){
        value = value.stock
        params.value = value
      }
    }

    console.log('params', params);
    let validateData = validate(params, validateSchema, { format: "flat" });


    if (validateData) {
      return res.json(500, validateData);
    }

    let foundProduct = await Product.findOne({ id });

    let { material, size, color } = foundProduct;

    // console.log('foundProduct', foundProduct);
    if (name === 'gtin') {
      // @TODO use foundProduct
      let foundGtin = await Product.findOne({ gtin: value });
      if (foundGtin) {
        let { id: duplicateGtinId } = foundGtin;
        return res.json(500,
          `Duplicate gtin with productId: ${duplicateGtinId}, mockupId: ${material}`);
      }
    } else if (name === 'sku') {
      // @TODO use foundProduct
      let foundSku = await Product.findOne({ sku: value });
      if (foundSku) {
        let { id: duplicateSkuId } = foundSku;
        return res.json(500,
          `Duplicate SKU with productId: ${duplicateSkuId}, mockupId: ${material}`);
      }
    }

    let updateData = {};
    console.log('value', value);
    updateData[name] = value;

    let findQuery = { id };

    // Update 'shippingWeight', 'base_price' for all size within material
    let updateForAllSize = [
      'shippingWeight', 'base_price'
    ];
    // handle stock to disable variant when push
    if (name === 'stock' && value === '0') {
      console.log('stock value is 0');
      if(all_size){
        findQuery = {
          or: [
            {
              size,
              material
            }
          ]
        }
      }
      if(all_color){
        //color
        if(typeof findQuery.or === 'object'){
        findQuery.or.push({
            color,
            material
        })}else{
          findQuery = {
            color,
            material
          }
        }
      }
      // findQuery =
      //   {
      //     size,
      //     material
      //   };
    } else if ((updateForAllSize.includes(name))) {
      findQuery =
        {
          size,
          material
        };
    }
    console.log('findQuery', findQuery);
    // return res.json({});

    let productData = await Product.update(findQuery, updateData)
                                   .catch((err) => {
                                     return res.negotiate('Can not update, please check value')
                                   })

    let syncOptionsResult = await Product.syncOptions({ id: material });
    // await Product.syncTradeGecko({ id: material });

    res.json(productData)
  },
  getVariantWarning: async (req, res) => {
    let { id } = req.allParams();
    let priceWarningData = await Product.count({
      material: id,
      base_price: 0
    });
    let gtinWarningData = await Product.count({
      material: id,
      gtin: null
    });
    let stockWarningData = await Product.count({
      material: id,
      stock: null
    });
    let lowStockWarningData = await Product.count({
      material: id,
      stock: { '<': 10 }
    });
    res.json({
      priceWarningData,
      gtinWarningData,
      stockWarningData,
      lowStockWarningData
    });
  },
};

