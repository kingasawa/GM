/**
 * Design.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    id: {
      type: 'string',
      primaryKey: true,
      unique: true
    },
    design_id: {
      type: 'integer',
      index: true,
      autoIncrement: true
    },
    thumbUrl: {
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

