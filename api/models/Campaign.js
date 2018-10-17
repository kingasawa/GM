/**
 * Campaign.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    title: {
      type: 'string'
    },
    materialID: {
      type: 'string'
    },
    designID: {
      type: 'string'
    },
    numbericDesignId: {
      type: 'integer'
    },
    color: {
      type: 'json'
    },
    size: {
      type: 'json'
    },
    image: {
      type: 'json'
    },
    defaultImage: {
      type: 'longtext'
    },
    shopname: {
      type: 'string'
    },
    shoptype: {
      type: 'string'
    }
  }
};

