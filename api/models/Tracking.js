/**
 * Tracking.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    shop_order_id: {
      type: 'string',
      index: true,
    },
    orderid: {
      type: 'string',
      index: true,
    },
    items: {
      type: 'json'
    },
    subtotal: {
      type: 'float'
    },
    shippingfee: {
      type: 'float'
    },
    total: {
      type: 'float'
    },
    shipping_address: {
      type: 'json'
    },
    seller_address: {
      type: 'json'
    },
    owner: {
      model: 'user',
      required: true,
      index: true,
      integer: true
    },
    shop: {
      type: 'string',
      index: true,
    },
    orderdate: {
      type: 'date',
      index: true,
    },
    status: {
      type: 'string',
      defaultsTo: 'picked',
      index: true,
    },
    shipment_id: {
      type: 'string',
      index: true,
    }
  }
};

