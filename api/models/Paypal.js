/**
 * Paypal.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    preapprovalKey: {
      type: 'string',
      required: true
    },
    senderEmail: {
      type: 'string'
    },
    accountId: {
      type: 'string'
    },
    status: {
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

