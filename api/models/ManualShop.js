/**
 * Shop.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    shop: {
      type: 'string',
      index: true,
      required: true,
      notNull: true
    },
    name: {
      type: 'string',
      index: true,
      required: true,
      notNull: true
    },

    address: {
      type: 'json'
    },

    owner: {
      model: 'user',
      required: true,
      index: true,
      integer: true
    }
  }
};

