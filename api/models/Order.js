/**
 * Order.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
    orderid: {
      type: 'string',
      // index: true,
      unique: true,
    },
    order_name: {
      type: 'string'
    },
    note: {
      type: 'longtext'
    },
    email: {
      type: 'string'
    },
    token: {
      type: 'string'
    },
    total_price: {
      type: 'float'
    },
    subtotal_price: {
      type: 'float'
    },
    total_tax: {
      type: 'float'
    },
    total_item_basecost: {
      type: 'float'
    },
    total_item_price: {
      type: 'float'
    },
    hight_price: {
      type: 'float'
    },
    hight_extra: {
      type: 'float'
    },
    total_item: {
      type: 'integer'
    },
    shipping_fee: {
      type: 'float',
    },
    shipping_cost: {
      type: 'float'
    },
    revenue: {
      type: 'float'
    },
    profit: {
      type: 'float'
    },
    report_analyzed: {
      type: 'boolean',
      defaultsTo: 0
    },
    // if true the report must be revalidated, use for basecost missing, shipping fee changes or user ranking
    report_warning: {
      type: 'boolean',
      defaultsTo: 0
    },
    total_discounts: {
      type: 'float'
    },
    currency: {
      type: 'string'
    },
    financial_status: {
      type: 'string'
    },
    confirmed: {
      type: 'string'
    },
    name: {
      type: 'string',
      index: true
    },
    referring_site: {
      type: 'string'
    },
    customer: {
      type: 'json'
    },
    shop: {
      type: 'string',
      index: true
    },
    line_items: {
      type: 'json'
    },
    tradegecko_id: {
      type: 'integer',
      index: true
    },
    billing_address: {
      type: 'json'
    },
    shipping_address: {
      type: 'json'
    },
    sync: {
      type: 'integer'
    },
    internal_notes: {
      type: 'string',
    },
    tag: {
      type: 'string',
      index: true,
    },
    tracking: {
      type: 'string',
      index: true,
      defaultsTo: 'pending'
    },
    // pending, paid, cancelled
    payment_status: {
      type: 'string',
      index: true
    },
    label: {
      type: 'string',
      defaultsTo: 'no-label'
    },
    owner: {
      model: 'user',
      required: true,
      index: true,
      integer: true
    },

  },

  get: async function(id,data){
    let foundOrder = await Order.findOne({ id });
    if(foundOrder){
      cb('found order');
    } else {
      cb();
    }
  },

  updateLineItem: async function(id,data) {
    let foundOrder = await Order.findOne({ id });
    if(foundOrder){
      cb('found order');
    } else {
      cb();
    }
  },

  updateAddress: async function(id,data){
    let foundOrder = await Order.findOne({ id });
    if(foundOrder){
      cb('found order');
    } else {
      cb();
    }
  },

  updateEmail: async function(id,data){
    let foundOrder = await Order.findOne({ id });
    if(foundOrder){
      cb('found order');
    } else {
      cb();
    }
  },

  collect: async function(id,data){
    bluebird.promisifyAll(Order);
    // order create, order
    const TRANSACTION = {
      collect: {
        method: 'Wire Transfer',
        status: 'Pending',
        order_status: 'Awaiting-Fulfillment'
      }
    }

    let { order_status } = TRANSACTION.collect;
    let query = `SELECT owner,sum(total_item_price) as amount, array_agg(id) as orders
                  FROM public.order 
                  WHERE "tracking" = '${order_status}' 
                  GROUP BY owner`;

    let result = await Order.queryAsync(query);
    let transactions = result.rows;

    transactions.map((transaction)=>{
      let { owner, amount, orders } = transaction;
      let { method, status } = TRANSACTION.collect;
      amount = parseFloat(amount).toFixed(2);

      let createData = { owner, amount, order:orders, method, status }
      Transaction.create(createData)
                 .then(createResult => createResult)
                 .catch((err)=>{
                   console.log('error',err );
                 })
    });
  },

};

