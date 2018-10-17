/**
 * Transaction.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    transactionID: {
      type: 'string'
    },
    order: {
      type: 'json'
    },
    method: {
      type: 'string'
    },
    amount: {
      type: 'float'
    },
    status: {
      type: 'string'
    },
    shop: {
      type: 'string'
    },
    time: {
      type: 'string'
    },
    total_order:{
      type: 'integer'
    },
    owner: {
      model: 'user',
      required: true,
      index: true,
      integer: true
    },
  }
};

