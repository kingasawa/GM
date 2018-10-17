/**
 * Invoice.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {

    product: {
      type: 'string'
    },
    vendor: {
      type: 'string'
    },
    old_type: {
      type: 'string'
    },
    new_type: {
      type: 'string'
    }

  }
};

