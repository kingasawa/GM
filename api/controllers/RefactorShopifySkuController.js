const { apiKey, apiSecret } = sails.config.shopify;
const { shopifyVendor } = sails.config.shopify;
const { sideInfo: { na: UNKNOWN_FRONT_SIDE_CODE } } = sails.config.sku;

module.exports = {
  /**
   * @Step 1
   *
   * updatenewshopifysku/getProduct
   *
   * Bước lấy dữ liệu tất cả variant của các shop có sku loại current trên shopify
   * Gearment về DB.
   *
   * @note do không có worker nên cần làm khi không có người dùng
   *
   * @param req
   * @param res
   * @returns {Promise.<void>}
   */
  getProduct: async (req, res) => {
    let { fromPage, toPage, shop , destroy } = req.allParams();
    // let defaultShops = ['pirda.myshopify.com','minion-things.myshopify.com','morningshirts.myshopify.com',
    //   'whovian.myshopify.com','iteefun.myshopify.com','9shirt.myshopify.com','geartanker.myshopify.com',
    //   'teedoozi.myshopify.com','delighteecom.myshopify.com','tee4teams.myshopify.com'];
    // let shopArray = shop ? [shop] : defaultShops;

    if(destroy){
      await Promise.resolve(Variant.destroy());
      await Promise.resolve(UnknownVariant.destroy());
    }
    // let foundShopData = await Shop.find({ select: ['name'] });
    let foundShopData; //dev test
    if(shop) {
      foundShopData = [{ name: shop }]; //dev test
    }


    _.each(foundShopData, async (shopData) => {
      let { name: shop } = shopData;
      const publisher = sails.hooks.kue_publisher;

      sails.log.debug('shop data', shop);
      let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));

      let shopifyAuth = {
        shop: shop,
        shopify_api_key: apiKey,
        access_token: findToken.shopifytoken[0].accessToken,
      };
      const Shopify = new ShopifyApi(shopifyAuth);

      await Shopify.get('/admin/products/count.json',(error,productCount)=>{
        if(error) {
          console.log(error);
          return false;
        }
        let limit = 250;
        // let pageCount = Math.ceil(parseInt(productCount.count)/limit);
        // let pageCount = 2;

        for (let i=fromPage; i<= toPage; i++){

          Shopify.get(`/admin/products.json?page=${i}&limit=${limit}`, (error, productData) => {
            if (error) {
              sails.log.info('GetVariantShopifyWorker PUT ERROR:', error);
              return false;
            }

            sails.log.debug('GetVariantShopifyWorker productData', productData);

            _.each(productData.products, (product, index) => {
              if (!product.variants) {
                sails.log.error({
                  controller: 'RefactorShopifySku',
                  message: 'can not get variant',
                  product
                });
              }
              // @TODO get all userProduct to db
              _.each(product.variants, (variant) => {
                // "variant_title":"Gildan Long Sleeve T-Shirt / Black / M"
                let mockup = variant.title.split(' / ')[0];
                // sails.log.debug(mockup);
                let sku = _.get(variant, 'sku', '');
                let vendor = _.get(product, 'vendor', '');
                let barcode = _.get(variant, 'barcode', '');

                let gearmentSKU = Report.getGearmentSKU(sku, vendor);

                if (gearmentSKU) {
                  let { skuType } = gearmentSKU;
                  // if (skuType === 'current') {
                  Variant.create({
                    skuType,
                    shop: shop,
                    variantID: variant.id,
                    sku,
                    item: mockup,
                    vendor: vendor,
                    barcode: barcode,
                    deleted:0,
                    data: variant
                  }).exec((err, result) => {
                    if (err) return sails.log.error({
                      controller: 'RefactorShopifySku',
                      message: 'Can not insert Variant',
                      error: err
                    });
                  })
                  // }
                } else {
                  // UnknownVariant.create({
                  //   skuType: 'unknow',
                  //   shop: shop,
                  //   variantID: variant.id,
                  //   sku,
                  //   item: mockup,
                  //   vendor: vendor
                  // }).exec((err, result) => {
                  //   if (err) return sails.log.error({
                  //     controller: 'RefactorShopifySku',
                  //     message: 'Can not insert UnknownVariant',
                  //     error: err
                  //   });
                  // })
                }

                // if(product.variants.length - 1 === index){
                // res.json({ msg: `done ${product.variants.length} variants` })
                // }
              })

            })
          })
        }


      });






    });

    res.json({ msg: 'ok please wait' });
  },
  /**
   *
   * @Step 2
   *
   * updatenewshopifysku/editCurrentSkuToDb
   *
   * Lấy hết dữ liệu trong variant mới cập nhật từ shopify getProduct() ở trên
   * chuyển sku từ dạng cũ qua dạng số mà chưa có productId và update lên vào DB
   * chuẩn bị data cho bước 3 update SKU mới nhất (có productId) lên Shopify.
   *
   * Dữ liệu color, size, material chuyển qua thành ID
   * Riêng frontSide do không có dữ liệu nên default là 2
   *
   * @SKUFrom unit-846-ultra_cotton_short_sleeve_tee-black-XL
   * @SKUTo  unit-1799-1-3-35-32-1673
   *
   * @param req
   * @param res
   * @returns {Promise.<void>}
   */
  editCurrentSkuToDb: async (req, res) => {

    let limit = 10000;
    let { update = 0, shop } = req.allParams();

    let variantFindParams = { newSku: null };
    if (update == 1) {
      variantFindParams = {};
    }

    if (shop) {
      variantFindParams = { shop };
    }

    let findVariant = await Promise.resolve(Variant.find(variantFindParams).limit(limit)); // .limit(5)

    if (!findVariant) {
      return res.json({ msg: 'shop not found' })
    }

    // Get predefine cached data
    let materialDataKeyByType = await Material.keyBy('type');
    let optionData = await Option.getData();

    let materialDataKeyByName = Material.keyBy('name');

    // sails.log.debug('findVariant', findVariant);
    _.each(findVariant, async (variant, index) => {
      // sails.log.debug('variant', variant);
      let id = variant.id;

      let { skuType } = variant;

      let shop = variant.shop;
      // Shop.findOne({ name: shop }).populate('shopifytoken').exec(async function(err, findToken) {

      let sku = variant.sku.split('-');
      // let shop = variant.shop;

      sails.log.debug(`detect skuType ${skuType}`, {
        shop
      });

      if (skuType === 'current') {
        let campaignID = sku[1];
        let frontSide = sku[2];
        let materialId = sku[3];
        let colorId = sku[4];
        let sizeId = sku[5];
        let designId = sku[6];

        // Hack to update old SideID from 2 to 3 for unknown sideId
        if (frontSide == 2) {
          frontSide = 3;
        }

        let material = materialDataKeyByName[variant.item];

        if (!_.get(optionData, `['colorId'][${colorId}]['name']`) ||
            (!_.get(optionData, `['sizeId'][${sizeId}]['value']`))) {
          if (!_.get(optionData, `['colorId'][${colorId}]['name']`)) {
            sails.log.error('ERROR colorId', {
              skuType,
              error: {
                colorId,
                materialId,
                shop
              }
            });
          }
          if (!_.get(optionData, `['sizeId'][${sizeId}]['value']`)) {
            sails.log.error('ERROR sizeId', {
              skuType,
              error: {
                sizeId,
                materialId,
                shop
              }
            });
          }
          return false;
        }

        // sails.log.debug('colorId', colorId);
        // sails.log.debug('sizeId', sizeId);
        // sails.log.debug('materialId', materialId);

        let color = optionData['colorId'][colorId]['name'];
        let size = optionData['sizeId'][sizeId]['value'];

        // sails.log.debug('=====FIND PRODUCT ID==========================');
        // sails.log.debug('color', color);
        // sails.log.debug('size', size);
        // sails.log.debug('materialId', materialId);
        // sails.log.debug('=====END FIND PRODUCT ID==========================');

        let searchProductParam = {
          material: materialId,
          size,
          color
        };
        let productData = await Product.findOne(searchProductParam);

        if (!productData) {
          let updateData = {
            material: materialId,
            size: size,
            color: color
          };
          Variant.update({ id }, updateData).exec(function(err, result) {
            if (err) {
              sails.log.error('update error', err);
              return false;
            }
            // sails.log.debug(`Variant Update debug result`, result);
          })

          return sails.log.warn("productData not found", {
            ...searchProductParam,
            skuType,
            shop
          });
        }
        // sails.log.debug('productData', productData);

        let { id: productId } = productData;

        let skuGenerateParam = {
          sideId: frontSide,
          productId,
          designId
        }

        let newSku = Sku.generate({
          sideId: frontSide,
          productId,
          designId
        });

        let updateData = { newSku };// update to newSku collumn // no need to update vendor here to DB

        if (newSku) {
          Variant.update({ id }, updateData).exec(function(err, result) {
            if (err) {
              sails.log.debug('update error', err);
              return false;
            }
            // sails.log.info(`Variant SKU Updated to ${newSku}`);
            // sails.log.info(`Variant SKU Updated result`, result);
          })
        } else {

          // Update why lost sku
          let updateData = {
            material: materialId,
            size,
            color,
            shop,

          };
          Variant.update({ id }, updateData).exec(function(err, result) {
            if (err) {
              sails.log.error('update error', err);
              return false;
            }
            // sails.log.debug(`Variant SKU Debug Updated result`, result);

          })
          sails.log.debug('newSku not found', skuGenerateParam);
        }
        // });
      }
      else if (skuType === 'old') {

        let sku = variant.sku.split('-');
        let shop = variant.shop;
        let campaignID = sku[1];
        let materialType = sku[2];
        let colorNameSnakeCase = sku[3];
        let sizeValue = sku[4];

        let frontSide = 3; // Unknown side ID = 3

        let colorName = _.startCase(colorNameSnakeCase);

        // Load Material from Cached Data
        // let material = materialDataKeyByType[materialType];

        let material = await Material.findOne({
          select: ['id'],
          or: [{ type: materialType }, { oldType: materialType }]
        });

        if (!material) {
          return sails.log.warn("Material not found", {
            skuType,
            materialType,
            campaignID,
            shop
          });
        }

        let materialId = material.id;

        let design = await Promise.resolve(Campaign.findOne({
          select: ['designID'],
          id: campaignID
        }));

        if (!design) {
          return sails.log.warn("Design not found", {
            skuType,
            materialType,
            campaignID,
            shop
          });
        }

        let designLongStringId = design.designID;
        //
        let designNumericId = await Promise.resolve(Design.findOne({
          select: ['design_id'],
          id: designLongStringId
        }));

        if (!designNumericId) {
          return sails.log.warn("designNumericId not found", {
            skuType,
            materialType,
            campaignID,
            designLongStringId,
            shop
          });
        }

        let designId = designNumericId.design_id;

        //--
        let searchProductParam = {
          material: materialId,
          size: sizeValue,
          color: colorName
        };
        let productData = await Product.findOne(searchProductParam);
        if (!productData) { // Update why lost sku
          let updateData = {
            material: materialId,
            size: sizeValue,
            color: colorName
          };
          Variant.update({ id }, updateData).exec(function(err, result) {
            if (err) {
              sails.log.error('update error', err);
              return false;
            }
            // sails.log.debug(`Variant Update debug`, result);
          })

          return sails.log.warn("productData not found", {
            ...searchProductParam,
            skuType,
            shop
          });
        }

        let { id: productId } = productData;

        let skuGenerateParam = {
          sideId: frontSide,
          productId,
          designId
        };
        let newSku = Sku.generate(skuGenerateParam);

        if (newSku) {
          let updateData = { newSku };// update to newSku collumn // no need to update vendor here to DB

          sails.log.debug('newSku found', newSku);

          Variant.update({ id }, updateData).exec(function(err, result) {
            if (err) {
              sails.log.error('update error', err);
              return false;
            }
            // sails.log.debug(`Variant SKU Updated to ${newSku}`);
            // sails.log.debug(`Variant SKU Updated result`, result);
          })

        } else {
          let updateData = {
            material: materialId,
            size: sizeValue,
            color: colorName,
            shop,

          };
          Variant.update({ id }, updateData).exec(function(err, result) {
            if (err) {
              sails.log.error('update error', err);
              return false;
            }
            // sails.log.debug(`Variant SKU Debug Updated result`, result);
          })

          sails.log.debug('newSku not found', skuGenerateParam);
        }

        //--
        // Current SKU: will dont have productId, wait for next step
        // let newSku = `unit-${campaignID}-${frontSide}-${materialId}-${colorId}-${sizeId}-${designId}`;
        //
        // let updateData = { newSku };// update to newSku collumn // no need to update vendor here to DB
        //
        // sails.log.debug('newSku', newSku);

      }

      else if (skuType === 'new') {
        let sku = variant.sku.split('-');
        let gearmentSku = Report.getGearmentSKU(variant.sku, 'Gearment');
        console.log('get gearmentSku',gearmentSku);
        // productId: isGearmentVendorSKU[1],
        //   designId: isGearmentVendorSKU[2],
        //   frontSide: isGearmentVendorSKU[3],
        let { productId,designId,frontSide : sideId } = gearmentSku;

        // let sideId = sku[0];
        // let productId = sku[1];
        // let designId = sku[2];

        let skuGenerateParam = {
          sideId,
          productId,
          designId
        };
        let newSku = `${productId}-${designId}-${sideId}`

        if (newSku) {
          let updateData = { newSku };// update to newSku collumn // no need to update vendor here to DB

          sails.log.debug('newSku found', newSku , variant.sku);

          Variant.update({ id }, updateData).exec(function(err, result) {
            if (err) {
              sails.log.error('update error', err);
              return false;
            }
            // sails.log.debug(`Variant SKU Updated to ${newSku}`);
            // sails.log.debug(`Variant SKU Updated result`, result);
          })
        }
      } else {
        sails.log.debug('skuType skipped', skuType);
      }
    })
    res.json({ msg: `update SKU to DB done with ${findVariant.length} variant(s)` });
  },

  /**
   * @Step 3
   *
   * updatenewshopifysku/editSkuShopify
   *
   * Lấy SKU mới chuẩn hoá dạng gần đây, nhưng chưa có productId
   * để chuyển sang dạng có productId để gọn hơn, không có unit và
   * dùng vendor để phân biệt sản phẩm của Gearment.
   *
   * @SKUFrom unit-1799-1-3-35-32-1673
   * @SKUTo  1-13-222
   *
   * @param req
   * @param res
   * @returns {Promise.<void>}
   */
  editSkuShopifyRisk: async (req, res) => {

    let { type,skip } = req.allParams();

    let findVariant = await Promise.resolve(Variant.find({deleted:0}).limit(10000)); // {id: [8298, 8300]} .limit(5)

    _.each(findVariant, (variant, index) => {

      // sails.log.debug('variant count', variant.length);
      let shop = variant.shop;
      Shop.findOne({ name: shop }).populate('shopifytoken').exec(async function(err, findToken) {
        const publisher = sails.hooks.kue_publisher;

        let sku = variant.newSku; // use newSku to backup sku data

        if (!sku) { // skip variant dont have new SKU, maybe wrong color or size
          return false;
        }
        let putData = {
          "variant": {
            "sku": sku,
            "vendor": shopifyVendor,
            "barcode": ''
          }
        }

        let shopifyAuth = {
          shop: shop,
          shopify_api_key: apiKey,
          access_token: findToken.shopifytoken[0].accessToken,
        };

        let apiConfig = {
          rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
          backoff: 5, // limit X of 40 API calls => default is 35 of 40 API calls
          backoff_delay: 2000 // 1 second (in ms) => wait 1 second if backoff option is exceeded
        };

        shopifyAuth = Object.assign(apiConfig, shopifyAuth);

        const publishData = {
          shopifyPutUrl: `/admin/variants/${variant.variantID}.json`,
          putData,
          shopifyAuth
        };

        sails.log.debug('updateshopify push publishData', publishData);

        publisher.create('updateshopify', publishData)
                 .priority('high')
                 .attempts(60)
                 .backoff({
                   delay: 3*1000,
                   type: 'fixed'
                 })
                 .on('complete', function(result) {
                   sails.log.debug('updateshopify SKU job completed with result', result);
                 })
                 .removeOnComplete(true)
                 .ttl(300000) //1h
                 .save();

        Variant.update({id:variant.id}, { deleted: 2 }).exec(function(err, result) {
          if (err) {
            sails.log.error('Variant updated error', err);
            return false;
          }
          sails.log.debug(`Variant updated result`, result);
        })

      });

      if (index === findVariant.length - 1) {
        res.json({ msg: `update new SKU to Shopify done with ${findVariant.length} variant(s)` });
      }
    })
  },

  deleteSkuShopifyRisk: async (req, res) => {

    console.log('deleteSkuShopifyRisk');
    let variantFindParams = {
      newSku: null,
      // skuType: ['old', 'current']
    }
    let findVariant = await Promise.resolve(Variant.find(variantFindParams)); // {id: [8298, 8300]} .limit(5)

    _.each(findVariant, (variant, index) => {
      // sails.log.debug('variant', variant);

      let { variantID, shop, id } = variant;

      let { product_id } = variant.data;
      Shop.findOne({ name: shop }).populate('shopifytoken').exec(async function(err, findToken) {
        console.log('shop', shop);
        const publisher = sails.hooks.kue_publisher;

        let sku = variant.newSku; // use newSku to backup sku data

        if (sku) { // skip variant dont have new SKU, maybe wrong color or size
          return false;
        }

        let shopifyAuth = {
          shop: shop,
          shopify_api_key: apiKey,
          access_token: findToken.shopifytoken[0].accessToken,
        };

        let apiConfig = {
          rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
          backoff: 5, // limit X of 40 API calls => default is 35 of 40 API calls
          backoff_delay: 2000 // 1 second (in ms) => wait 1 second if backoff option is exceeded
        };

        shopifyAuth = Object.assign(apiConfig, shopifyAuth);

        // /admin/products/#{id}/variants/#{id}.json
        const publishData = {
          shopifyPutUrl: `/admin/products/${product_id}/variants/${variantID}.json`,
          shopifyAuth
        };

        sails.log.debug('delete variantID in shopify', publishData);

        publisher.create('deleteshopify', publishData)
                 .priority('high')
                 .attempts(60)
                 .backoff({
                   delay: 3*1000,
                   type: 'fixed'
                 })
                 .on('complete', function(result) {
                   sails.log.debug('deletehopify SKU job completed with result', result);
                 })
                 .removeOnComplete(true)
                 .ttl(300000) //1h
                 .save();

        Variant.update({ id }, { deleted: 1 }).exec(function(err, result) {
          if (err) {
            sails.log.error('Variant deleted error', err);
            return false;
          }
          sails.log.debug(`Variant deleted result`, result);
        })

      });

      if (index === findVariant.length - 1) {
        res.json({ msg: `delete SKU to Shopify done with ${findVariant.length} variant(s)` });
      }
    })
  },

};

