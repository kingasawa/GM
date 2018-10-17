/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    shopName: {
      type: 'string'
    },
    order: {
      type: 'json'
    },
    transactionID: {
      type: 'string'
    },
    owner: {
      model: 'user',
      required: true,
      index: true,
      integer: true
    },
  }
};

