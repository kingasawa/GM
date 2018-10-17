/**
 * Setting.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    shopifyKey: {
      type: 'string'
    },
    shopifySecret: {
      type: 'string'
    },
    paypalClient: {
      type: 'string'
    },
    paypalSecret: {
      type: 'string'
    },
    taxFee: {
      type: 'float'
    },
    shippingFee: {
      type: 'float'
    },
    printFee: {
      type: 'float'
    },
    owner: {
      model: 'user',
      index: true,
      integer: true
    },
  }
};

