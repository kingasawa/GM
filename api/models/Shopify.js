/**
 * Shopify.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    appPassword: {
      type: 'string',
      // required: true,
    },
    apiKey: {
      type: 'string',
      // required: true,
    },
    sharedSecret: {
      type: 'string',
      // required: true,
    },
    // accessToken: {
    //   type: 'string',
    //   // required: true,
    // },
    // scope: {
    //   type: 'json',
    //   // required: true,
    // },
    // No Ref
    // shop: {
    //   collection: 'shop',
    //   via: 'shopify'
    // }
  }
};

