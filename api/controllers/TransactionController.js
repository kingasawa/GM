/**
 * TransactionController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
import QueryBuilder from 'node-datatable';
import bluebird from 'bluebird';
import replace from 'lodash.replace';
import uuidv4 from 'uuid/v4';
import sumBy from 'lodash.sumby';
import concat from 'lodash.concat';
import moment from 'moment';
const knex = require('knex')({client: 'pg'});

module.exports = {
  // acpDatatable: async(req, res) => {
  //
  //   let { by = '' } = req.allParams();
  //
  //   let ALLOWED_BY = ['today','yesterday','month','lastmonth']
  //
  //   let DATE_DEFAULT_KEY = (ALLOWED_BY.includes(by)) ? by : ''
  //   let DATE_TRUNC = {
  //     today: 'day',
  //     yesterday: 'day',
  //     month: 'month',
  //     lastmonth: 'month'
  //   }[DATE_DEFAULT_KEY]
  //
  //   let DATETIME_QUERY = {
  //     today: 'today',
  //     yesterday: 'yesterday',
  //     month: 'today',
  //     lastmonth: 'today'
  //   }[DATE_DEFAULT_KEY]
  //
  //   let DATETIME_INTERVAL = {
  //     today: '',
  //     yesterday: '',
  //     month: '',
  //     lastmonth: `- interval '1 month'`,
  //   }[DATE_DEFAULT_KEY]
  //
  //   console.log('DATETIME_QUERY', DATETIME_QUERY);
  //   bluebird.promisifyAll(Transaction);
  //   let tableDefinition = {
  //     dbType: 'postgres',
  //     sSelectSql: 't.transactionID ,time,shop,method, amount, t.status, u.username, u.email, t.id, t.createdAt',
  //     sTableName: 'public.transaction t LEFT JOIN public.user u on t.owner = u.id',
  //     sWhereAndSql: DATE_DEFAULT_KEY &&
  //                   `date_trunc('${DATE_TRUNC}', t.createdAt) =
  //                   date_trunc('${DATE_TRUNC}', TIMESTAMP '${DATETIME_QUERY}' ${DATETIME_INTERVAL})`,
  //     aSearchColumns: [
  //       't.transactionID',
  //       'shop',
  //       'method',
  //       'amount',
  //       't.status',
  //       'u.username',
  //       'u.email',
  //       'owner',
  //       't.id',
  //       'time',
  //       't.createdAt'
  //     ]
  //   };
  //
  //   let queryParams = req.allParams();
  //   let queryBuilder = new QueryBuilder(tableDefinition);
  //   let queries = queryBuilder.buildQuery(queryParams);
  //
  //   // console.log('queries', queries);
  //   /** fix "createdAt" search issue **/
  //   let newQueries = {};
  //   _.each(queries, (value, key) => {
  //     newQueries[key] = value.replace(/([a-z]{1,})([A-Z][a-zA-Z]{1,})\b/g, '"$1$2"');
  //   })
  //   queries = newQueries;
  //   /** fix "createdAt" search issue **/
  //
  //     // sails.log.debug("SCP:Order:Datatables", queries);
  //   let recordsFiltered;
  //   if (queries.recordsFiltered) {
  //     recordsFiltered = await (Transaction.queryAsync(queries.recordsFiltered));
  //     recordsFiltered = recordsFiltered.rows;
  //   }
  //
  //   let recordsTotal = await (Transaction.queryAsync(queries.recordsTotal));
  //   recordsTotal = recordsTotal.rows;
  //
  //   let select = await (Transaction.queryAsync(queries.select));
  //   select = select.rows;
  //
  //   let results = {
  //     recordsTotal,
  //     select
  //   };
  //   if (recordsFiltered) {
  //     results.recordsFiltered = recordsFiltered;
  //   }
  //
  //   // console.log('query',queries)
  //   res.json(queryBuilder.parseResponse(results));
  // },

  acp_datatable: async(req, res) => {

    let { by = '' } = req.allParams();

    let ALLOWED_BY = ['today','yesterday','month','lastmonth']

    let DATE_DEFAULT_KEY = (ALLOWED_BY.includes(by)) ? by : ''
    let DATE_TRUNC = {
      today: 'day',
      yesterday: 'day',
      month: 'month',
      lastmonth: 'month'
    }[DATE_DEFAULT_KEY]

    let DATETIME_QUERY = {
      today: 'today',
      yesterday: 'yesterday',
      month: 'today',
      lastmonth: 'today'
    }[DATE_DEFAULT_KEY]

    let DATETIME_INTERVAL = {
      today: '',
      yesterday: '',
      month: '',
      lastmonth: `- interval '1 month'`,
    }[DATE_DEFAULT_KEY]
// t."createdAt",owner, time, sum(amount) as total_amount , sum(total_order) as total_order,
    // u.username, u.email
    console.log('DATETIME_QUERY', DATETIME_QUERY);
    bluebird.promisifyAll(Transaction);
    let tableDefinition = {
      dbType: 'postgres',
      sSelectSql: 't.createdAt ,owner,time,sum(amount) as total_amount, sum(total_order) as total_order, u.username, u.email',
      sTableName: 'public.transaction t LEFT JOIN public.user u on t.owner = u.id',
      sWhereAndSql: DATE_DEFAULT_KEY &&
                    `date_trunc('${DATE_TRUNC}', t.createdAt) = 
                    date_trunc('${DATE_TRUNC}', TIMESTAMP '${DATETIME_QUERY}' ${DATETIME_INTERVAL})`,
      sGroupBySql: `group by owner, time, t.createdAt,u.username,u.email`,
      aSearchColumns: [
        'u.username',
        'u.email',
        'time'
      ]
    };

    let queryParams = req.allParams();
    let queryBuilder = new QueryBuilder(tableDefinition);
    let queries = queryBuilder.buildQuery(queryParams);

    // console.log('queries', queries);
    /** fix "createdAt" search issue **/
    let newQueries = {};
    _.each(queries, (value, key) => {
      newQueries[key] = value.replace(/([a-z]{1,})([A-Z][a-zA-Z]{1,})\b/g, '"$1$2"');
    })
    queries = newQueries;
    /** fix "createdAt" search issue **/

      // sails.log.debug("SCP:Order:Datatables", queries);
    let recordsFiltered;
    if (queries.recordsFiltered) {
      recordsFiltered = await (Transaction.queryAsync(queries.recordsFiltered));
      recordsFiltered = recordsFiltered.rows;
    }

    queries.recordsTotal = queries.recordsTotal.replace("COUNT(*)", "owner")

    let newRecordsTotal = knex.with('transaction', knex.raw(`${queries.recordsTotal} group by "owner"`)).count('*').from('transaction')

    queries.recordsTotal = newRecordsTotal.toString();

    let recordsTotal = await (Transaction.queryAsync(queries.recordsTotal));
    recordsTotal = recordsTotal.rows;

    let select = await (Transaction.queryAsync(queries.select));
    select = select.rows;

    let results = {
      recordsTotal,
      select
    };
    if (recordsFiltered) {
      results.recordsFiltered = recordsFiltered;
    }

    // console.log('query',queries)
    res.json(queryBuilder.parseResponse(results));
  },
  scp_datatable: async(req, res) => {

    let { by = '' } = req.allParams();
    let { id } = req.user;

    let ALLOWED_BY = ['today','yesterday','month','lastmonth']

    let DATE_DEFAULT_KEY = (ALLOWED_BY.includes(by)) ? by : ''
    let DATE_TRUNC = {
      today: 'day',
      yesterday: 'day',
      month: 'month',
      lastmonth: 'month'
    }[DATE_DEFAULT_KEY]

    let DATETIME_QUERY = {
      today: 'today',
      yesterday: 'yesterday',
      month: 'today',
      lastmonth: 'today'
    }[DATE_DEFAULT_KEY]

    let DATETIME_INTERVAL = {
      today: '',
      yesterday: '',
      month: '',
      lastmonth: `- interval '1 month'`,
    }[DATE_DEFAULT_KEY]

    let ownerQuery = `"owner"='${id}' AND `

    ownerQuery += DATE_DEFAULT_KEY &&
                  `date_trunc('${DATE_TRUNC}', t.createdAt) = 
                    date_trunc('${DATE_TRUNC}', TIMESTAMP '${DATETIME_QUERY}' ${DATETIME_INTERVAL}) AND `
    ownerQuery += '1=1'
// t."createdAt",owner, time, sum(amount) as total_amount , sum(total_order) as total_order,
    // u.username, u.email
    console.log('DATETIME_QUERY', DATETIME_QUERY);
    bluebird.promisifyAll(Transaction);
    let tableDefinition = {
      dbType: 'postgres',
      sSelectSql: 't.createdAt ,owner,time,sum(amount) as total_amount, sum(total_order) as total_order, u.username, u.email',
      sTableName: 'public.transaction t LEFT JOIN public.user u on t.owner = u.id',
      sWhereAndSql: ownerQuery,
      sGroupBySql: `group by owner, time, t.createdAt,u.username,u.email`,
      aSearchColumns: [
        'time'
      ]
    };

    let queryParams = req.allParams();
    let queryBuilder = new QueryBuilder(tableDefinition);
    let queries = queryBuilder.buildQuery(queryParams);

    // console.log('queries', queries);
    /** fix "createdAt" search issue **/
    let newQueries = {};
    _.each(queries, (value, key) => {
      newQueries[key] = value.replace(/([a-z]{1,})([A-Z][a-zA-Z]{1,})\b/g, '"$1$2"');
    })
    queries = newQueries;
    /** fix "createdAt" search issue **/

      // sails.log.debug("SCP:Order:Datatables", queries);
    let recordsFiltered;
    if (queries.recordsFiltered) {
      recordsFiltered = await (Transaction.queryAsync(queries.recordsFiltered));
      recordsFiltered = recordsFiltered.rows;
    }

    queries.recordsTotal = queries.recordsTotal.replace("COUNT(*)", "owner")

    let newRecordsTotal = knex.with('transaction', knex.raw(`${queries.recordsTotal} group by "owner"`)).count('*').from('transaction')

    queries.recordsTotal = newRecordsTotal.toString();

    let recordsTotal = await (Transaction.queryAsync(queries.recordsTotal));
    recordsTotal = recordsTotal.rows;

    let select = await (Transaction.queryAsync(queries.select));
    select = select.rows;

    let results = {
      recordsTotal,
      select
    };
    if (recordsFiltered) {
      results.recordsFiltered = recordsFiltered;
    }

    console.log('queryBuilder.parseResponse(results)', queryBuilder.parseResponse(results));
    console.log('query',queries)
    res.json(queryBuilder.parseResponse(results));
  },

  // scpDatatable: async(req, res) => {
  //   let { by = '' } = req.allParams();
  //   let { id } = req.user;
  //   // let userQuery = `"AND owner"='${id}'`;
  //
  //   let ALLOWED_BY = ['today','yesterday','month','lastmonth']
  //
  //   let DATE_DEFAULT_KEY = (ALLOWED_BY.includes(by)) ? by : ''
  //   let DATE_TRUNC = {
  //     today: 'day',
  //     yesterday: 'day',
  //     month: 'month',
  //     lastmonth: 'month'
  //   }[DATE_DEFAULT_KEY]
  //
  //   let DATETIME_QUERY = {
  //     today: 'today',
  //     yesterday: 'yesterday',
  //     month: 'today',
  //     lastmonth: 'today'
  //   }[DATE_DEFAULT_KEY]
  //
  //   let DATETIME_INTERVAL = {
  //     today: '',
  //     yesterday: '',
  //     month: '',
  //     lastmonth: `- interval '1 month'`,
  //   }[DATE_DEFAULT_KEY]
  //
  //   let ownerQuery = `"owner"='${id}' AND `
  //
  //   ownerQuery += DATE_DEFAULT_KEY &&
  //                     `date_trunc('${DATE_TRUNC}', t.createdAt) =
  //                   date_trunc('${DATE_TRUNC}', TIMESTAMP '${DATETIME_QUERY}' ${DATETIME_INTERVAL}) AND `
  //   ownerQuery += '1=1'
  //
  //   console.log('DATETIME_QUERY', DATETIME_QUERY);
  //   bluebird.promisifyAll(Transaction);
  //   let tableDefinition = {
  //     dbType: 'postgres',
  //     sSelectSql: 't.transactionID, method, amount, t.status, u.username, u.email, t.id, t.createdAt',
  //     sTableName: 'public.transaction t LEFT JOIN public.user u on t.owner = u.id',
  //     sWhereAndSql: ownerQuery,
  //     aSearchColumns: [
  //       't.transactionID',
  //       'method',
  //       'amount',
  //       't.status',
  //       'u.username',
  //       'u.email',
  //       'owner',
  //       't.id',
  //       't.createdAt'
  //     ]
  //   };
  //
  //   let queryParams = req.allParams();
  //   let queryBuilder = new QueryBuilder(tableDefinition);
  //   let queries = queryBuilder.buildQuery(queryParams);
  //
  //   // console.log('queries',queries );
  //
  //   /** fix "createdAt" search issue **/
  //   let newQueries = {};
  //   _.each(queries, (value, key) => {
  //     newQueries[key] = value.replace(/([a-z]{1,})([A-Z][a-zA-Z]{1,})\b/g, '"$1$2"');
  //   })
  //   queries = newQueries;
  //   /** fix "createdAt" search issue **/
  //
  //     // sails.log.debug("SCP:Order:Datatables", queries);
  //   let recordsFiltered;
  //   if (queries.recordsFiltered) {
  //     recordsFiltered = await (Transaction.queryAsync(queries.recordsFiltered));
  //     recordsFiltered = recordsFiltered.rows;
  //   }
  //
  //   let recordsTotal = await (Transaction.queryAsync(queries.recordsTotal));
  //   recordsTotal = recordsTotal.rows;
  //
  //   let select = await (Transaction.queryAsync(queries.select));
  //   select = select.rows;
  //
  //   let results = {
  //     recordsTotal,
  //     select
  //   };
  //   if (recordsFiltered) {
  //     results.recordsFiltered = recordsFiltered;
  //   }
  //
  //   res.json(queryBuilder.parseResponse(results));
  // },

  create: async(req,res) => {
    bluebird.promisifyAll(Order);
    // order create, order
    const TRANSACTION = {
      collect: {
        method: 'Wire Transfer',
        status: 'paid',
        payment_status: 'pending',
        order_status: 'Cancelled'
      }
    }

    let { payment_status,order_status,status } = TRANSACTION.collect;
    let query = `SELECT owner,shop,sum(total_item_price) as amount, array_agg(id) as orders
                  FROM public.order 
                  WHERE "tracking" <> '${order_status}' 
                  AND "payment_status" = '${payment_status}'
                  GROUP BY owner,shop
                  ORDER BY owner`;

    let result = await Order.queryAsync(query);
    let transactions = result.rows;

    console.log('transactions.length', transactions.length);
    if(transactions.length < 1) return false;
    // result = concat(result, itemArr);

    let orderArr = [];
    _.each(transactions,(item)=>{
      orderArr = concat(orderArr,item.orders);
    })
    orderArr = orderArr.join();
    console.log('orderArr', orderArr);

    let updateQuery = `UPDATE public.order as o 
                        SET "payment_status" = '${status}'
                        WHERE o.id in (${orderArr});`
    let updateResult = await Order.queryAsync(updateQuery);
    let time = moment().format('MMDDYY');

    transactions.map((transaction)=>{
      let { shop, owner, amount, orders } = transaction;
      let { method, status } = TRANSACTION.collect;
      let batchId = time+'_'+owner;
      amount = parseFloat(amount).toFixed(2);
      let shortShop = shop.match(/^[-_0-9a-z]+/);
      console.log('shortShop',shortShop );
      let transactionID = shortShop+'_'+time

      //deo hieu sao de shop thi no ko chiu create, doi thanh transactionID thi duoc , vkl
      let createData = { owner, transactionID,shop, amount, order:orders, method, status,time:batchId,total_order:orders.length };
      console.log('createData', createData);
      Transaction.create(createData)
                 .then(createResult => console.log('createResult', createResult))
                 .catch((err)=>{
                   console.log('error',err );
                 })
    });

    return res.send(200)

  }

};

