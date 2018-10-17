/**
 * MaterialConfig.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

import keyBy from 'lodash.keyby';

module.exports = {

  attributes: {
    material: {
      model: 'material',
      required: true,
      unique: true,
    },
    top: {
      type: 'integer'
    },
    left: {
      type: 'integer'
    },
    width: {
      type: 'integer'
    },
    height: {
      type: 'integer'
    },
    scale: {
      type: 'float'
    }
  },

  keyBy: async (key = 'material') => {
    let data = await MaterialBackConfig.find();
    return keyBy(data, key);
  },
};

