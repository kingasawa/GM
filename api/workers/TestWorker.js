// var sleep = require('sleep');
module.exports = {
  //job concurrency
  concurrency: 2, // * with scale instance
  perform: function(job, context, done) {
    // Domain wrapper to fix stuck active jobs
    const domain = require('domain').create();
    domain.on('error', function(err) { // help dont stuck as active job
      done(err);
    });

    // Main process function
    domain.run(async () => {
      const { type, data } = job;
      sails.log.debug('Worker OK:', type, data);
      const testAwait = await User.find(1);
      sails.log.debug('testAwait', testAwait);
      const user = {
        house: [
          { location: 'hcm' }
        ]
      }
      //Lodash usage
      sails.log.debug('_ lodash test', _.get(user, 'house[0].location', false));
      const result = {
        msg: 'ok'
      }

      setTimeout(() => {
        done(null, result);
      }, 2000);
    });

  }

};
