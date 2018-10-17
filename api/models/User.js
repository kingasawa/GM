var _ = require('lodash');
var _super = require('sails-authen/api/models/User');

_.merge(exports, _super);
_.merge(exports, {
  attributes: {
    shops: {
      collection: 'shop',
      via: 'owner'
    },
    design: {
      collection: 'design',
      via: 'owner'
    },
    billingaddress: {
      collection: 'billingaddress',
      via: 'owner'
    },
    payment: {
      collection: 'payment',
      via: 'owner'
    },
    saves: {
      collection: 'savecampaign',
      via: 'owner'
    },
    tracking: {
      collection: 'tracking',
      via: 'owner'
    },
    image: {
      collection: 'image',
      via: 'owner'
    },
    invoice: {
      collection: 'invoice',
      via: 'owner'
    },
    balance: {
      type: 'float',
      defaultsTo: 0
    },
    paypal: {
      collection: 'paypal',
      via: 'owner'
    },
    group: {
      type: 'integer',
      defaultsTo: 3,
      enum: [1, 2, 3], // 1: admin, 2: manager, 3: seller
      index: true
    },
    auto_pay: {
      type: 'integer',
      defaultsTo: 1
    },
    last_login: {
      type: 'datetime'
    },
    payment_method: {
      type: 'string'
    },
    status: {
      type: 'string'
    },

    getGroupName: function () {
      const groupMap = {
        1: 'admin',
        2: 'manager',
        3: 'seller'
      }
      return groupMap[this.group];
    },
  }
});
