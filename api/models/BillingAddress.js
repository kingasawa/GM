/**
 * BillingAddress.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    firstname: {
      type: 'string'
    },
    lastname: {
      type: 'string'
    },
    street1: {
      type: 'string'
    },
    street2: {
      type: 'string'
    },
    city: {
      type: 'string'
    },
    state: {
      type: 'string'
    },
    zip: {
      type: 'string'
    },
    country: {
      type: 'string'
    },
    phone: {
      type: 'string'
    },
    fax: {
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

