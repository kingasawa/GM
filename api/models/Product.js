/**
 * Product.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
import keyBy from 'lodash.keyby';
const CACHE_KEY = 10;
import bluebird from 'bluebird';
import striptags from 'striptags';

const { DEFAULT_SHIPPING_FEE, DEFAULT_BASE_COST } = sails.config.report;

const { designLimit } = sails.config.globals;
module.exports = {

  attributes: {
    id: {
      type: 'integer',
      primaryKey: true,
      // unique: true,
      autoIncrement: true
    },
    /*@TODO start remove*/
    // brandCode: {
    //   type: 'string',
      // unique: true,
      // required: true,
      // index: true,
      // notNull: true
    // },
    // displayName: {
    //   type: 'string',
      // unique: true,
      // required: true,
      // notNull: true
    // },
    // type: {
    //   type: 'string',
      // required: true,
      // notNull: true
    // },
    /*@TODO end remove*/
    color: {
      type: 'string',
      required: true,
      notNull: true,
      index: true,
    },
    size: {
      type: 'string',
      required: true,
      notNull: true,
      index: true,
    },
    shippingWeight: {
      type: 'float',
      defaultsTo: 0,
      index: true,
      // required: true,
      // notNull: true
    },
    // grams: {
    //   type: 'integer',
    //   index: true,
    //   // defaultsTo: 0,
    //   // required: true,
    //   // notNull: true
    // },
    base_price: {
      type: 'float',
      required: true,
      defaultsTo: 0,
    },
    compare_at_price: {
      type: 'float',
      // required: true,
      // defaultsTo: 0,
    },
    gtin: {
      type: 'string',
      unique: true
    },
    sku: {
      type: 'string',
      unique: true
    },
    stock: {
      type: 'integer',
      index: 'true',
      defaultsTo: 0
    },
    // ref with tradegecko variant
    tradegecko_id: {
      type: 'integer',
      index: true,
    },
    // Ref
    material: {
      model: 'material',
      required: true,
      index: true,
    },
    // type: {
    //   collection: 'Type',
    //   type: 'string',
    // },
    // material: {
    //   collection: 'material',
    //   via: 'product',
    //   required: true,
    //   dominant: true
    // },
    // Ref
    // shop: {
    //   model: 'shop',
    //   required: true,
    // },
  },
  /**
   *
   * For product/add page
   *
   * @param shop
   * @param owner
   * @returns {Promise.<{}>}
   */
  getTotalDesignData: async ({ shop, owner }) => {
    let data = {};
    let ENABLE_DESIGN_CACHE = false; // @TODO RISK: enable will make issue on large cache

    // designData, shopData, saveCampaignData, settingData, materialData
    // sails.log.debug("getTotalDesignData", ENABLE_DESIGN_CACHE);

    // data.material
    let cachePrefix = 'material';
    let cacheKey = `${cachePrefix}:materialTotalDesignData:${CACHE_KEY}`;
    let materialDataCached = await Cache.getAsync(cacheKey);

    if(ENABLE_DESIGN_CACHE && materialDataCached){
      sails.log.debug("load material from cache");
      data = JSON.parse(materialDataCached);
    }else{
      let materialData = await Material.find({ sort: 'id ASC' })
                                       .populate('size')
                                       .populate('color')
                                       .populate('image')
                                       .populate('cost')
                                       .populate('config')
                                       .populate('backconfig');

      let designData = await Design.find({
        select: ['id', 'thumbUrl' , 'design_id'],
        owner
      }).paginate({page: 1, limit: designLimit});

      data.materialData = materialData;
      data.designData = designData;

      data.materialConfigKey = await MaterialConfig.keyBy('material');
      data.materialBackConfigKey = await MaterialBackConfig.keyBy('material');
      data.materialImageKey = await MaterialImage.keyBy('material');

      Cache.set(cacheKey, JSON.stringify(data), 'EX', 600);
    }

    // Select 1 shop only
    if (shop) {
      data.shopData = [{ name: shop }];
    } else {
      data.shopData = await Shop.find({ owner });
    }

    data.saveCampaignData = await SaveCampaign.find({ owner });

    // data.settingData = await Setting.findOne({
    //   select: ['taxFee', 'shippingFee'],
    //   id: 1
    // });

    // console.log('Design data', data);
    return data;
  },
  /**
   *
   * This is for auto calculate design
   *
   * @param id
   * @returns {Promise.<{}>}
   */
  getDesignData: async ({ id = 3 }) => {
    let data = {};
    let ENABLE_DESIGN_CACHE = true;

    let cachePrefix = `material:materialData:${CACHE_KEY}:${id}`;//update cache
    let materialDataCached = await Cache.getAsync(cachePrefix);

    if(ENABLE_DESIGN_CACHE && materialDataCached){
      sails.log.debug("load material from cache");
      data = JSON.parse(materialDataCached);
    }else{
      let materialData = await Material.find({ id, sort: 'id ASC' })
                                       .populate('size')
                                       .populate('color')
                                       .populate('image')
                                       .populate('cost')
                                       .populate('config');

      let materialDataString = JSON.stringify(materialData);
      Cache.set(cachePrefix, materialDataString, 'EX', 600);
      data = materialData;
    }

    return data;
  },
  getProductKey: async (key = 'id') => {
    let ENABLE_PRODUCT_KEY_CACHE = true;
    let PRODUCT_KEY_CACHE_TTL = 600;

    let data = {};

    let cachePrefix = `product:productKey:${key}:${CACHE_KEY}`;//update cache
    let productDataCached = await Cache.getAsync(cachePrefix);

    if(ENABLE_PRODUCT_KEY_CACHE && productDataCached){
      sails.log.debug("load getProductKey from cache");
      data = JSON.parse(productDataCached);
    }else{
      let resultData = await Product.find();
      let resultDataIndex = keyBy(resultData, key);

      let cacheDataString = JSON.stringify(resultDataIndex);

      Cache.set(cachePrefix, cacheDataString, 'EX', PRODUCT_KEY_CACHE_TTL);

      data = resultDataIndex;
    }

    return data
  },

  addProduct: async ({
                       id,
                       color,
                       size,
                       material,
                       base_price,
                       shippingWeight,
                       // Mirror data
                       brandCode,
                       displayName,
                       type,

                // colorId, // support id
                // sizeId, // support id
                 }) => {

    shippingWeight = shippingWeight || 0
    base_price = parseFloat(base_price) || 0

    // material = 4;
    // id = 103;
    // size = '2XL';
    // color = 'Navy';

    let findQuery = { material, size, color };

    // support old style import google spreadsheet using id
    if(id)
      findQuery.id = id;

    let findProduct = await Product.findOne(findQuery);

    if(findProduct){
      console.log('findProduct', findProduct);
      return { error: 'Product existed' }
    }

    // console.log('findProduct', findProduct);
    // return {};

    let insertData = {
      brandCode,
      displayName,
      type,
      color,
      size,
      shippingWeight,
      base_price,
      material
    }

    // support old style import google spreadsheet using id
    if(id)
      insertData.id = id;

    console.log('insertData', insertData);
    let result = await Promise.resolve(Product.create(insertData))
    console.log('product added result', result);
    return result;
  },

  syncOptions: async ({ id }) => {
    let query = {}
    if (id) {
      query.id = id;
    }

    let materialData = await Material.find(query);

    // console.log('syncOptions materialData', materialData);

    bluebird.promisifyAll(Product);

    let optionData = await Option.getData();

    let syncData = {}

    // let pinkVar = 'Light Pink';
    // console.log('Options', optionData);

    // This will await the loop
    await Promise.all(materialData.map(async materialItem => {
      // console.log('=========');
      let { id: material } = materialItem;
      // console.log('material', material);
      // let productData = await Product.find({ select: ['color'], material }).distinct('color');
      // Get data from product table to sync
      let productColorData = await Product.queryAsync(`select distinct(color) from product where material=${material} AND (stock != 0 OR stock IS NULL)`);
      productColorData = productColorData.rows;
      let productSizeData = await Product.queryAsync(`select distinct(size) from product where material=${material} AND (stock != 0 OR stock IS NULL)`);
      productSizeData = productSizeData.rows;
      // Data to insert to options
      let colorOptionData = []
      let sizeOptionData = []
      // console.log('000');
      productColorData.map(productColorItem => {
        let itemColor = productColorItem.color;
        console.log('itemColor', `|${itemColor}|`);
        // console.log('productColorItem.id', productColorItem.id);
        // console.log('itemColor Op', itemColor, _.get(optionData['color'], itemColor));
        // get color value hex type

        let colorValue = optionData['color'][itemColor]['value'];
        let colorOptionId = optionData['color'][itemColor]['id'];
        console.log('colorOptionId', colorOptionId);
        let colorOptionItem = {
          name: productColorItem.color,
          value: colorValue,
          id: colorOptionId,
        }
        colorOptionData.push(colorOptionItem);
        // console.log('111');
      })

      await Promise.all(productSizeData.map(async productSizeItem => {
        // console.log('productSizeItem', productSizeItem);
        // let sizeValue = optionData['size'][productSizeItem.size]['value'];
        // let sizeId = optionData['size'][sizeValue]['id'];

        console.log('findSize Price', {
          material,
          size: productSizeItem.size
        });
        let productItemPrice = await Product.findOne({
          material,
          size: productSizeItem.size
        });

        console.log('productItemPrice', productItemPrice);
        // console.log('productItemPrice', productItemPrice, material, productSizeItem.size);

        let productSizeItemPrice = productItemPrice.base_price || DEFAULT_BASE_COST;

        let sizeOptionId = optionData['size'][productSizeItem.size]['id'];

        console.log('itemSize', `|${productSizeItem.size}|`);
        console.log('sizeOptionId', sizeOptionId);
        // console.log('productSizeItem.id', productSizeItem.id);
        let sizeOptionItem = {
          size: productSizeItem.size,
          price: productSizeItemPrice,
          id: sizeOptionId,
        }
        sizeOptionData.push(sizeOptionItem);
      }))

      syncData[material] = {
        color: colorOptionData,
        size: sizeOptionData
      };

      // console.log('=================', );
      // console.log('productColorData', productColorData);
      // console.log('productSizeData', productSizeData);
    }));

    // console.log('-END-', JSON.stringify(syncData, null, 4));

    _.each(syncData, async (syncItem, materialId) => {
      let updateColorData = {
        color: syncItem.color
      };
      let updateSizeData = {
        size: syncItem.size
      };

      // console.log('materialId', materialId);
      MaterialColor.update({ material: materialId }, updateColorData).exec((err, result) => {
        if (err) {
          console.log('updateColorData err', err);
        } else {
          console.log('updateColorData result', result);
        }

      })

      MaterialSize.update({ material: materialId }, updateSizeData).exec((err, result) => {
        if (err) {
          console.log('updateSizeData err', err);
        } else {
          console.log('updateSizeData result', result);
        }

      })

      // let updateColorResult = await Promise.resolve(MaterialColor.update({ material: materialId }, updateColorData));
      // let updateSizeResult = await Promise.resolve(MaterialSize.update({ material: materialId }, updateSizeData));
    })

    return syncData;
  },

  syncTradeGecko: async ({ id }) => {
    let query = {
    }
    if (id) {
      query.id = id;
    }

    bluebird.promisifyAll(Material);
    bluebird.promisifyAll(Product);

    let materialData = await Material.find(query);
    let syncData = {}
    // This will await the loop
    await Promise.all(materialData.map(async materialItem => {
      let {
        id: material, tradegecko_id, description, brand_code, name,
        product_type
      } = materialItem;
      product_type = (product_type && product_type != 'null') ? product_type : ""
      let getProduct;
      let newProduct;
      if(!tradegecko_id){
        newProduct = await TradeGecko.createProduct({
          "name": name,
          "opt1": "Color",
          "opt2": "Size",
          "brand": brand_code,
          "barcode": "",
          "description": striptags(description) || "",
          "product_type": product_type || "",
          "supplier": ""
        });
        tradegecko_id = newProduct.id;
        let findMaterial = { id: material };
        let updateMaterialData = { tradegecko_id };

        await Material.update(findMaterial, updateMaterialData)
      }

      // Get data from product table to sync
      let productDatas = await Product.queryAsync(`select * from product where material=${material} AND tradegecko_id IS NULL`);
      productDatas = productDatas.rows


      await Promise.all(productDatas.map(async productData => {
        let { id, base_price, shippingWeight, sku, color, size } = productData;

        let createVariant = await TradeGecko.createVariant(tradegecko_id, {
          "name": name,
          "opt1": color,
          "opt2": size,
          "sku": sku || "",
          "keep_selling": true,
          "weight_value": shippingWeight || '',
          "weight_unit": "oz",
          // "buy_price": base_price,
          "retail_price": base_price,
          // "wholesale_price": "15.0",
        });

        let findProduct = { id };
        let variant_tradegecko_id = createVariant.id;
        let updateProductData = { tradegecko_id: variant_tradegecko_id };
        await Product.update(findProduct, updateProductData)

      }))
    }));

    console.log('ENDING... syncData');
    return syncData;
  },
};

