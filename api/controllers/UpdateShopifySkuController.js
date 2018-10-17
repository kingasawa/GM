const { apiKey, apiSecret } = sails.config.shopify;
const { shopifyVendor } = sails.config.shopify;

const UNKNOWN_FRONT_SIDE_CODE = 2;
module.exports = {
  /**
   * @Step 1
   *
   * Bước lấy dữ liệu tất cả variant của các shop hiện hữu trên
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
            if (sku && sku.match('unit') !== null && sku.split('-').length == 5) {
              Variant.create({
                shop: shop,
                variantID: variant.id,
                sku: sku,
                item: mockup,
                vendor: product.vendor
              }).exec((err, result) => {
                if (err) return console.log(err);
              })
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
  editOldSkuToDb: async (req, res) => {
    let findVariant = await Promise.resolve(Variant.find()); // .limit(5)
    // Get predefine cached data
    let materialDataKeyByType = await Material.keyBy('type');
    let optionData = await Option.getData();

    console.log('findVariant', findVariant);
    _.each(findVariant, (variant, index) => {
      // console.log('variant', variant);
      let id = variant.id;

      let shop = variant.shop;
      Shop.findOne({ name: shop }).populate('shopifytoken').exec(async function(err, findToken) {
        const publisher = sails.hooks.kue_publisher;

        let sku = variant.sku.split('-');
        let shop = variant.shop;
        let campaignID = sku[1];
        let materialType = sku[2];
        let colorNameSnakeCase = sku[3];
        let sizeValue = sku[4];

        // UNKNOWN_FRONT_SIDE_CODE: 2
        let frontSide = UNKNOWN_FRONT_SIDE_CODE;

        let colorName = _.startCase(colorNameSnakeCase);

        // Load Material from Cached Data
        let material = materialDataKeyByType[materialType];
        let materialId = material.id;


        console.log('campaignID', campaignID);
        console.log('materialType', materialType);
        console.log('colorNameSnakeCase', colorNameSnakeCase);
        console.log('sizeValue', sizeValue);
        console.log('colorName', colorName);
        console.log('==========================================');

        // Load From Option Cached Data
        let colorId = optionData['color'][colorName]['id'];
        let sizeId = optionData['size'][sizeValue]['id'];

        // get design numeric Id from long string id
        let design = await Promise.resolve(Campaign.findOne({
          select: ['designID'],
          id: sku[1]
        }));
        let designLongStringId = design.designID;

        let designNumericId = await Promise.resolve(Design.findOne({
          select: ['design_id'],
          id: designLongStringId
        }));
        let designId = designNumericId.design_id;

        // Current SKU: will dont have productId, wait for next step
        let newSku = `unit-${campaignID}-${frontSide}-${materialId}-${colorId}-${sizeId}-${designId}`;

        let updateData = { newSku };// update to newSku collumn // no need to update vendor here to DB

        console.log('newSku', newSku);


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
    let materialDataKeyByName = Material.keyBy('name');

    let optionData = await Option.getData();
    _.each(findVariant, (variant, index) => {
      // console.log('variant', variant);
      let shop = variant.shop;
      Shop.findOne({ name: shop }).populate('shopifytoken').exec(async function(err, findToken) {
        const publisher = sails.hooks.kue_publisher;

        let sku = variant.newSku.split('-'); // use newSku to backup sku data

        let campaignID = sku[1];
        let frontSide = sku[2];
        let materialId = sku[3];
        let colorId = sku[4];
        let sizeId = sku[5];
        let designId = sku[6];

        let material = materialDataKeyByName[variant.item];

        console.log('test optionData colorId', colorId);

        let color = optionData['colorId'][colorId]['name'];
        let size = optionData['sizeId'][sizeId]['value'];

        let productData = await Product.findOne({
          material: materialId,
          size,
          color
        });

        let { id: productId } = productData;

        let newSku = `${frontSide}-${productId}-${designId}`

        console.log(`test productId: ${productId} | color: ${color} | size: ${size} `);
        // console.log('newSku', newSku);
        let putData = {
          "variant": {
            "sku": newSku,
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

