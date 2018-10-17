const { apiKey, apiSecret } = sails.config.shopify;
const { shopifyVendor } = sails.config.shopify;

const UNKNOWN_FRONT_SIDE_CODE = 2;
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
    // let { shop } = req.allParams();
    // let defaultShops = ['pirda.myshopify.com','minion-things.myshopify.com','morningshirts.myshopify.com',
    //   'whovian.myshopify.com','iteefun.myshopify.com','9shirt.myshopify.com','geartanker.myshopify.com',
    //   'teedoozi.myshopify.com','delighteecom.myshopify.com','tee4teams.myshopify.com'];
    // let shopArray = shop ? [shop] : defaultShops;

    let foundShopData = await Shop.find({ select: ['name']});
    // let foundShopData = [{ name: 'superbowltee.myshopify.com' }]

    _.each(foundShopData, async (shopData) => {
      let { name: shop } = shopData;
      const publisher = sails.hooks.kue_publisher;

      console.log('shop data', shop);
      let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));

      let shopifyAuth = {
        shop: shop,
        shopify_api_key: apiKey,
        access_token: findToken.shopifytoken[0].accessToken,
      };
      const Shopify = new ShopifyApi(shopifyAuth);
      Shopify.get('/admin/products.json', (error, productData) => {
        if (error) {
          sails.log.info('GetVariantShopifyWorker PUT ERROR:', error);
          return false;
        }

        console.log('GetVariantShopifyWorker productData', productData);

        _.each(productData.products, (product, index) => {
          // @TODO get all userProduct to db
          _.each(product.variants, (variant) => {
            // "variant_title":"Gildan Long Sleeve T-Shirt / Black / M"
            let mockup = variant.title.split(' / ')[0];
            // console.log(mockup);
            let sku = _.get(variant, '.sku', '');

            let gearmentSKU = Report.getGearmentSKU(sku);

            if(gearmentSKU){
              let { skuType } = gearmentSKU;
              if (skuType === 'current') {
                Variant.create({
                  shop: shop,
                  variantID: variant.id,
                  sku,
                  item: mockup,
                  vendor: product.vendor
                }).exec((err, result) => {
                  if (err) return console.log(err);
                })
              }
            }

            // if(product.variants.length - 1 === index){
            // res.json({ msg: `done ${product.variants.length} variants` })
            // }
          })

        })
      })
    });

    res.json({msg: 'ok please wait'});
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
    let findVariant = await Promise.resolve(Variant.find()); // .limit(5)
    // Get predefine cached data
    let materialDataKeyByType = await Material.keyBy('type');
    let optionData = await Option.getData();

    let materialDataKeyByName = Material.keyBy('name');

    console.log('findVariant', findVariant);
    _.each(findVariant, (variant, index) => {
      // console.log('variant', variant);
      let id = variant.id;

      let shop = variant.shop;
      Shop.findOne({ name: shop }).populate('shopifytoken').exec(async function(err, findToken) {

        let sku = variant.sku.split('-');
        let shop = variant.shop;

        let campaignID = sku[1];
        let frontSide = sku[2];
        let materialId = sku[3];
        let colorId = sku[4];
        let sizeId = sku[5];
        let designId = sku[6];

        let material = materialDataKeyByName[variant.item];

        console.log('===============================');
        console.log('===============================');
        console.log('===============================');

        if(!_.get(optionData, `['colorId'][${colorId}]['name']`)){
          console.log('ERROR colorId', colorId);
          console.log('ERROR colorId materialId', materialId);
        }
        if(!_.get(optionData, `['sizeId'][${sizeId}]['value']`)){
          console.log('ERROR sizeId', sizeId);
          console.log('ERROR sizeId materialId', materialId);
        }

        console.log('colorId', colorId);
        console.log('sizeId', sizeId);
        console.log('materialId', materialId);

        let color = optionData['colorId'][colorId]['name'];
        let size = optionData['sizeId'][sizeId]['value'];

        console.log('=====FIND PRODUCT ID==========================');
        console.log('color', color);
        console.log('size', size);
        console.log('materialId', materialId);
        console.log('=====END FIND PRODUCT ID==========================');

        let productData = await Product.findOne({
          material: materialId,
          size,
          color
        });
        console.log('productData', productData);

        let { id: productId } = productData;

        let newSku = `${frontSide}-${productId}-${designId}`

        let updateData = { newSku };// update to newSku collumn // no need to update vendor here to DB

        Variant.update({ id }, updateData).exec(function(err, result){
          if(err) {
            console.log('update error', err);
            return false;
          }
          console.log(`Variant SKU Updated to ${newSku}`);
          console.log(`Variant SKU Updated result`, result);
        })
      });

      if (index === findVariant.length - 1) {
        res.json({ msg: `update SKU to DB done with ${findVariant.length} variant(s)` });
      }
    })
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
  editSkuShopify: async (req, res) => {

    let findVariant = await Promise.resolve(Variant.find()); // {id: [8298, 8300]} .limit(5)

    _.each(findVariant, (variant, index) => {
      // console.log('variant', variant);
      let shop = variant.shop;
      Shop.findOne({ name: shop }).populate('shopifytoken').exec(async function(err, findToken) {
        const publisher = sails.hooks.kue_publisher;

        let sku = variant.newSku; // use newSku to backup sku data

        if(!sku){ // skip variant dont have new SKU, maybe wrong color or size
          return false;
        }
        let putData = {
          "variant": {
            "sku": sku,
            "vendor": shopifyVendor,
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

        console.log('updateshopify push publishData', publishData);


        publisher.create('updateshopify', publishData)
                 .priority('high')
                 .attempts(60)
                 .backoff({
                   delay: 3 * 1000,
                   type: 'fixed'
                 })
                 .on('complete', function(result) {
                   sails.log.debug('updateshopify SKU job completed with result', result);
                 })
                 .removeOnComplete(true)
                 .ttl(300000) //1h
                 .save();

      });

      if (index === findVariant.length - 1) {
        res.json({ msg: `update new SKU to Shopify done with ${findVariant.length} variant(s)` });
      }
    })
  },
};

