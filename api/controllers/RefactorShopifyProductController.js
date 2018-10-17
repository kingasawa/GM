const { apiKey, apiSecret } = sails.config.shopify;

module.exports = {
  getProduct:async(req,res)=>{
    let { shop , destroy } = req.allParams();

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
        let pageCount = Math.ceil(parseInt(productCount.count)/limit);
        // let pageCount = 2;

        for (let i=1; i<=pageCount; i++){

          Shopify.get(`/admin/products.json?page=${i}&limit=${limit}`, (error, productData) => {
            if (error) {
              sails.log.info('GetVariantShopifyWorker PUT ERROR:', error);
              return false;
            }

            sails.log.debug('GetVariantShopifyWorker productData', productData);

            _.each(productData.products, (product, index) => {
              let { id, vendor, type } = product;
              ProductType.create({id,vendor,type}).exec((err,result)=>{
                if(err) {
                  sails.log.error(err);
                  return false;
                }
                sails.log.debug(result);
              })
            })
          })
        }


      });
    });

    res.json({ msg: 'ok please wait' });
  }
}
