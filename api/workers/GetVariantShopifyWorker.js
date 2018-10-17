module.exports = {
  //job concurrency
  concurrency: 50, // * with scale instance
  perform: function(job, context, done) {
    // Domain wrapper to fix stuck active jobs
    const domain = require('domain').create();
    domain.on('error', function(err) { // help dont stuck as active job
      done(err);
    });

    // Main process function
    domain.run(function() {
      const { type, data } = job;
      const { shopifyAuth, shop } = data;

      sails.log.info('GetVariantShopifyWorker', type, data);

      const Shopify = new ShopifyApi(shopifyAuth);

      Shopify.get('/admin/products.json', (error, productData) => {
        if (error) {
          sails.log.info('GetVariantShopifyWorker PUT ERROR:', error);
          throw new Error(error);
        }

        console.log('GetVariantShopifyWorker productData', productData);

        _.each(productData.products,(product) => {
          // @TODO get all userProduct to db
          _.each(product.variants,(variant) => {
            // "variant_title":"Gildan Long Sleeve T-Shirt / Black / M"
            let mockup = variant.title.split(' / ')[0];
            // console.log(mockup);
            let sku = _.get(variant,'.sku','');
            if(sku && sku.match('unit') !== null && sku.split('-').length == 5){
              Variant.create({shop:shop,
                variantID:variant.id,
                sku:sku,
                item:mockup,
                vendor:product.vendor
              }).exec((err,result) => {
                if(err) return console.log(err);
              })
            }

          })

        })
      })
    });

  }

};
