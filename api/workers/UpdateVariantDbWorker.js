// var sleep = require('sleep');
module.exports = {
  //job concurrency
  concurrency: 100, // * with scale instance
  perform: function(job, context, done) {
    // Domain wrapper to fix stuck active jobs
    const domain = require('domain').create();
    domain.on('error', function(err) { // help dont stuck as active job
      done(err);
    });

    // Main process function
    domain.run(function() {
      const { type, data } = job;
      const { updateData,id } = data;

      sails.log.info('UpdateVariantWorker', type, data);

      Variant.update({ id }, updateData).exec(function(err, result) {
        if (err) {
          sails.log.error('update error', err);
          return false;
        }
        // sails.log.debug(`Variant SKU Updated to ${newSku}`);
        // sails.log.debug(`Variant SKU Updated result`, result);
      })

    });

  }

};
