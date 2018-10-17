/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

module.exports = {

  hookTimeout: 400000,
  /***************************************************************************
   * Set the default database connection for models in the development       *
   * environment (see config/connections.js and config/models.js )           *
   ***************************************************************************/

  // models: {
  //   connection: 'someMongodbServer'
  // },
  globals: {
    baseUrl: 'http://localhost:3000'
  },
  connections: {
    nodeshopisPostgres: {
      adapter: 'sails-postgresql',
      host: 'localhost',
      port: '5434',
      user: 'postgres', // optional
      password: '', // optional
      database: 'nodeshopis' //optional
    },
    nodeshopisPostgresProd: {
      adapter: 'sails-postgresql',
      host: 'app-dbm',
      user: 'postgres', // optional
      password: 'nodeshopisX2017', // optional
      database: 'nodeshopis' //optional
    }

    // nodeshopisPostgresStaging: {
    //   adapter: 'sails-postgresql',
    //   // Database Production IP changed
    //   host: '104.198.236.57', // host: 'app-dbm',
    //   //host: '104.155.136.50', // this is another DB copy from production use this for safety
    //   port: '5432',
    //   password: 'nodeshopisX2017', // optional
    //   // host: 'localhost',
    //   user: 'postgres', // optional
    //   database: 'nodeshopis' //optional
    // },
    // nodeshopisMongo:{ //arbitrary name
    //   adapter: 'sails-mongo',
    //   host: 'localhost', // defaults to `localhost` if omitted
    //   port: 27017, // defaults to 27017 if omitted
    //   user: '', // or omit if not relevant
    //   password: '', // or omit if not relevant
    //   database: 'nodeshopis' // or omit if not relevant
    // }
  },

  models: {
    migrate: 'safe',
    // Pro
    // connection: 'nodeshopisPostgresProd',
    // Stage
    // connection: 'nodeshopisPostgresStaging',

    // LOCAL
    // migrate: 'alter', // migrate: 'drop',
    connection: 'nodeshopisPostgres',

  },

  port: process.env.PORT || 3000,

  shopify: {
    apiKey: '5be0da665e61116428d9fc135b5d452a',
    apiSecret: '061120df23906afe20fd899e78147857',
  },
  // policies: {
  //   '*': true
  // },

  // Dev Shipping Key
  easypost: {
    easypostapi: '0qSy6pqLZyeXoXajMpcwBg'
  },

  session: {
    adapter: 'connect-redis',
    host: '127.0.0.1',
    port: 6379,
    ttl: 60*60*24*7,
    db: 4,
    pass:  '',
    prefix: 'sess:',
  },
  kue_subscriber: {
    redis: {
      port: 6379,
      host: '127.0.0.1'
    },
  },
  kue_publisher: {
    redis: {
      port: 6379,
      host: '127.0.0.1'
    },
  },
  cache: {
    host: 'localhost',
    port: 6379,
    db: 1
  },
  sockets: {
    adapter: 'socket.io-redis',
    host: 'localhost',
    port: 6379,
    db: 3
  },
  // bootstrap: (cb) => {
  //   sails.log.debug('bootstrap');
  //   cb('ORM loaded!');//dont start app
  //   process.exit();
  // }
  log: {
    // level: "silent"
    level: "verbose"
  },
};
