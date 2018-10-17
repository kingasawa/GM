// var sleep = require('sleep');
module.exports = {
  //job concurrency
  concurrency: 10, // * with scale instance
  perform: function(job, context, done) {
    // Domain wrapper to fix stuck active jobs
    const domain = require('domain').create();
    domain.on('error', function(err) { // help dont stuck as active job
      done(err);
    });

    // Main process function
    domain.run(function() {
      const { type, data } = job;
      const { shopifyAuth, shopifyPutUrl, putData } = data;

      sails.log.info('UpdateShopifyWorker', type, data);

      const Shopify = new ShopifyApi(shopifyAuth);

      Shopify.put(shopifyPutUrl, putData, (error, result) => {
        if (error) {
          sails.log.info('UpdateShopifyWorker PUT ERROR:', putData, error);
          throw new Error(error);
        }
        if (result) {
          sails.log.info('UpdateShopifyWorker PUT RESULT:', result);
          done(null, result);
        }
      })
    });

  }

};
