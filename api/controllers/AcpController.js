/**
 * AcpController
 *
 * @description :: Server-side logic for managing acps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
// var apiKey = 'ae22432ff4d89ca146649cc782f385f1';
const { apiKey, apiSecret } = sails.config.shopify;

import QueryBuilder from 'node-datatable';
import bluebird from 'bluebird';
import replace from 'lodash.replace';
import uuidv4 from 'uuid/v4';
import keyby from 'lodash.keyby';
import sumby from 'lodash.sumby';
import sanitizer from 'sanitizer';
import concat from 'lodash.concat';
import fill from 'lodash.fill';
import moment from 'moment';
import lzma from 'lzma';
const zipFolder = require('zip-folder');


const knex = require('knex')({client: 'pg'});

const { easypostapi } = sails.config.easypost;
// const easypostapi = '0qSy6pqLZyeXoXajMpcwBg';

const EasyPost = require('node-easypost');
const api = new EasyPost(easypostapi);


module.exports = {
  index: (req,res) => {
    res.view('acp/index')
  },
  order: async(req,res) => {
    let { tracking, view, name, id } = req.allParams();
    let session_id = req.signedCookies['sails.sid'];

    if (id) {
      let foundOrder = await Order.findOne({id}).populate('owner');
      let foundToken = await Shop.findOne({name: foundOrder.shop}).populate('shopifytoken');
      let foundFulfill = await Fulfillment.find({order_id:foundOrder.orderid});


      res.view('acp/order/view',{foundOrder,foundFulfill});

      let shopifyAuth = {
        rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
        backoff: 20,
        backoff_delay: 2000,
        shop: foundOrder.shop,
        shopify_api_key: apiKey,
        access_token: foundToken.shopifytoken[0].accessToken,
      };
      // Better with: run after view & delay pushing 1s
      setTimeout(() => {
        const { line_items = [] } = foundOrder;
        const publisher = sails.hooks.kue_publisher;
        line_items.map(async (item, index) => {
          if(!item.shippingWeight){
            let productid = item.sku.match(/(^[0-9]+)/)[0];
            let foundProduct = await Product.findOne({select:['shippingWeight'],id:productid});
            let productWeight = {
              id:item.sku,
              weight:foundProduct.shippingWeight
            }
            sails.sockets.broadcast(session_id,'order/getWeight',productWeight);
          }
          if(!item.variant_img){
            let { id, variant_id, product_id } = item;
            let publishData = {
              title: shopifyAuth.shop,
              variant_id,
              shopifyAuth
            };
            publisher.create('getshopifyimage', publishData)
                     .priority('normal')
                     .attempts(20)
                     .backoff( { delay: 3 * 1000, type: 'fixed'} )
                     .on('complete', function(result){

                       sails.sockets.broadcast(session_id, 'order/imageFetched', result )
                     })
                     .removeOnComplete( true )
                     .ttl(120000)
                     .save();
          }

        })
      }, 3000)
    } else {
      // Order.find({sync:1},{sort:'id DESC'}).exec(function(err,foundOrder){
      //   return res.view('acp/order',{foundOrder})
      // });
      let data = {};

      return res.view('acp/order',data);
    }
  },

  order_stats: async (req, res) => {
    bluebird.promisifyAll(Order);
    let { from, to, shop, owner } = req.allParams();

    let addQuery = {}

    if(shop){
      addQuery.shop = shop
    }
    if(owner){
      addQuery.owner = owner
    }

    let data = {}
    let query = knex('order').select(knex.raw(`
          count(id) as "all-order",
      		sum((tracking='pending')::int) as "pending-order",
      		sum((tracking='Back-Order')::int) as "back-order",
            sum((tracking='Awaiting-Fulfillment')::int) as "awaiting-fulfillment-order",
			    sum((tracking='In-Production')::int) as "in-production-order",
            sum((tracking='Fulfilled')::int) as "fulfilled-order",
            sum((tracking='Cancelled')::int) as "cancelled-order"
`))
                             .where('sync', 1)
                             .where({...addQuery})


    if(from && to){
      query.whereRaw(`"createdAt" between '${from}' and date '${to}' + interval '1 day' - interval '1 second'`)
    }


    data = await (Order.queryAsync(query.toString())).then(e=>e.rows[0]) // {sync:1, ...addQuery}


    res.json(data)
  },


  order_shop_filter: async (req, res) => {
    let { shop, q, user } = req.allParams();


    let data = {}

    let query = {}

    if(q){
      query.name = { 'like': `%${q}%` }
    }
    if(user){
      query.owner = user;
    }

    data = await Shop.find(query);

    res.json(data)
  },

  order_user_filter: async (req, res) => {
    bluebird.promisifyAll(Order);

    let { q } = req.allParams();

    let data = {}
    let owner = '1=1';

    q = sanitizer.escape(q)

    if(q){
      owner = `u.username ILIKE '%${q}%'`
      // query.owner = { 'like': `%${q}%` }
    }

    let query = `SELECT distinct(o.owner), u.username, u.id FROM public.order o 
      left join public.user u on o.owner = u.id 
      where o.sync=1
      and ${owner}`



    data = await Order.queryAsync(query)
    data = data.rows
    res.json(data)
  },



  order_datatable: async(req, res) => {
    bluebird.promisifyAll(Order);
    var queryParams = req.allParams();

    let { from, to, export_csv } = queryParams

    let fromToQuery = ''

    if(from && to){
      fromToQuery = `AND to_char(o.createdAt::timestamp AT TIME ZONE '-8', 'YYYY/MM/DD')::timestamp between '${from}' and date '${to}' + interval '1 day' - interval '1 second'`
    }
    /*
     SELECT u.username, o.id, shop, o."createdAt", to_char(o."createdAt"::timestamp AT TIME ZONE '-8', 'YYYY/MM/DD') , o.name, tracking, total_item_price, order_name, orderid FROM public.order o left join public.user u on o.owner = u.id WHERE (sync=1 AND to_char(o."createdAt"::timestamp AT TIME ZONE '-8', 'YYYY/MM/DD')::timestamp between '05/19/2017' and date '05/19/2017' + interval '1 day' - interval '1 second')  ORDER BY id desc OFFSET 0 LIMIT 25
     */

    var tableDefinition = {
      dbType: 'postgres',
      sSelectSql: `tag,u.username, o.id, shop, to_char(o.createdAt::timestamp AT TIME ZONE '-8', 'YYYY/MM/DD') as "created_at", o.name, tracking, total_item_basecost, shipping_fee, total_item_price, order_name, orderid`,
      sTableName: 'public.order o left join public.user u on o.owner = u.id',
      sWhereAndSql: `sync=1 ${fromToQuery}`,
      aSearchColumns: ['tag','u.username','o.id', 'shop', 'o.name','tracking', 'order_name', 'orderid']
    };


    var queryBuilder = new QueryBuilder(tableDefinition);
    var queries = queryBuilder.buildQuery(queryParams);

    /** fix "createdAt" search issue **/
    let newQueries = {};
    // _.each(queries, (value, key) => {newQueries[key] = replace(value, /\\/g,'');})
    _.each(queries, (value, key) => {newQueries[key] = value.replace( /([a-z]{1,})([A-Z][a-z]{1,})\b/g, '"$1$2"' );})
    queries = newQueries;
    /** fix "createdAt" search issue **/


    var recordsFiltered;
    if (queries.recordsFiltered) {
      recordsFiltered = await (Order.queryAsync(queries.recordsFiltered));
      recordsFiltered = recordsFiltered.rows;
    }

    let recordsTotal = await (Order.queryAsync(queries.recordsTotal));
    recordsTotal = recordsTotal.rows;

    let select = await (Order.queryAsync(queries.select));
    select = select.rows;

    let results = {
      recordsTotal,
      select
    };
    if (recordsFiltered) {
      results.recordsFiltered = recordsFiltered;
    }

    if(export_csv){

      let result = queryBuilder.parseResponse(results);

      // Auto generate field name from data key
      let fields = Object.keys(_.get(result, 'data[0]',{}));

      return res.csv({
        prefix: 'orders-',
        filename: `${moment(from).format('YYYYMMDD')}_${moment(to).format('YYYYMMDD')}`,
        data: result['data'],
        fields
      });
    }

    res.json(queryBuilder.parseResponse(results));
  },

  user_order: async(req,res) => {
      let { id } = req.allParams();
      let foundUser = await User.findOne({id});
      res.view('acp/user/view_report',{foundUser})
  },
  export_user_order: async(req,res) => {
    bluebird.promisifyAll(Order);
      let {user, fromDate, toDate} = req.allParams();

      let query = `
        SELECT  to_char(o."createdAt"::timestamp AT TIME ZONE '-8', 'MM/DD/YYYY') as "created_at", 
        o.id as productionId,
        order_name as orderId, shop, 
        o.name as customer, 
        tracking as order_status, 
        total_item_basecost as total_basecost, shipping_fee, 
        total_item_price as total_cost
        FROM public.order o 
        WHERE (o.owner=${user} AND sync=1 AND o."createdAt" between '${fromDate}' and date '${toDate}' + interval '1 day' - interval '1 second')  
        ORDER BY id desc`;

    let result = await Order.queryAsync(query);
    let exportOrder = result.rows;
    // res.json(reportOrder);

    let fields = Object.keys(_.get(exportOrder, '[0]',{}));

    res.csv({
      filename: 'user_orders',
      data: exportOrder,
      fields
    });
  },

  pickup:async(req,res)=>{
    // bluebird.promisifyAll(Order);
    let { selectedOrders } = req.allParams();
    // Selected Pickup Order <array>:string.split(',')
    // let orders = [2261, 2264, 2266, 2268];

    sails.log.debug("selectedOrders", selectedOrders);

    let pickupOrders = await Order.find({ select: ['line_items', 'id'] }).where({ id: selectedOrders })

    let filename = `pickup-order-items`;

    let orderItems = [];

    _.each(pickupOrders, (order) => {

      sails.log.debug("order", order);

      let { line_items } = order;
      _.each(line_items, (line_item) => {
        const { variant_title,  brand, quantity, sku} = line_item
        sails.log.debug("line_item", line_item);
        let color = variant_title.split(' / ')[1];
        let size = variant_title.split(' / ')[2];
        let design = sku.split('-')[1];
        let csvLineItem = {
          id: order.id,
          brand,
          color,
          size,
          design,
          quantity
        };

        // Each line item from order
        orderItems.push(csvLineItem);
      })

    })

    sails.log.debug("orderItems", orderItems);

    let fields = Object.keys(_.get(orderItems, '[0]',{}));

    res.csv({
      filename,
      data: orderItems,
      fields
    });
  },

  mockup: (req,res) => {
    let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    // sails.sockets.join(req,session_id);
    if (params.p == 'sample' && !params.action) {
      Option.find({type:'color'}).exec(function(err,optionColor){
        Option.find({type:'size'}).exec(function(err,optionSize) {
          Material.find({sort:'orderid ASC'}).populate('image').populate('size').populate('cost').exec(function(err,foundMockup){
            res.view('acp/mockup',{optionColor,optionSize,foundMockup});
          });
        });
      })
    }
    else if (params.p == 'sample' && params.action == 'view') {
      Option.find({type:'color'}).exec(function(err,optionColor){
        Option.find({type:'size'}).exec(function(err,optionSize) {
          Material.findOne({type:params.type})
            .populate('color')
            .populate('size')
            .populate('image')
            .populate('cost')
            .exec(function(err,foundMockup){
              if(!foundMockup) {
                return res.negotiate(err);
              }
              return res.view('acp/view-mockup',{optionColor,optionSize,foundMockup})
            });
        })
      });
    }
    else if  (params.p == 'option' && !params.action) {
      Option.find({type:'color'}).exec(function(err,optionColor){
        Option.find({type:'size'}).exec(function(err,optionSize) {
          res.view('acp/mockup-option',{optionColor,optionSize})
        });
      })
    }
    else if (params.p == 'option' && params.action == 'add') {
      Option.create(params).exec(function(err,addOption){
        if(err) {
          console.log(err)
        } else {
          console.log(addOption)
        }
        sails.sockets.blast('option/added',{msg:addOption});
        if (params.price) {
          sails.sockets.blast('size/added',{msg:addOption,sizePrice:params.price});
        }
      })
    }
    else if (params.p == 'option' && params.action == 'edit') {
      Option.update({id:params.id},params).exec(function(err,updateOption){
        sails.sockets.blast('option/update',{msg:updateOption})
      })
    }
    else if (params.action == 'del') {
      Option.destroy(params.id).exec(function(err){
        if(!err) {
          sails.sockets.broadcast(session_id,'option/del',{msg:params.id})
        }
      })
    }
  },
  add: (req,res) => {
    let session_id = req.signedCookies['sails.sid'];
    // sails.sockets.join(req,session_id);
    let params = req.allParams();
    console.log(params);
    var materialType = _.snakeCase(params.name);
    let materialImg = { frontimg:params.frontImg,backimg:params.backImg };
    Material.create({brand:params.brand,name:params.name,type:materialType,description:params.description}).exec(async (err,addMaterial) => {
      if (!err) {
        let color = await Promise.resolve(
          MaterialColor.create({material:addMaterial.id,color:params.color})
        );
        let size = await Promise.resolve(
          MaterialSize.create({material:addMaterial.id,size:params.size})
        );
        let image = await Promise.resolve(
          MaterialImage.create({material:addMaterial.id,image:materialImg})
        );
        let cost = await Promise.resolve(
          MaterialCost.create({material:addMaterial.id,cost:params.cost,minPay:params.minPay})
        );
        let data = { color,size,image,cost };
        sails.sockets.broadcast(session_id,'mockup/added',{msg:data});

      }
    })
  },
  // del: (req,res) => {
  //   let params = req.allParams();
  //   let session_id = req.signedCookies['sails.sid'];
  //   // sails.sockets.join(req,session_id);
  //   MaterialSize.destroy({material:params.id});
  //   MaterialColor.destroy({material:params.id});
  //   MaterialImage.destroy({material:params.id});
  //   MaterialCost.destroy({material:params.id});
  //   Material.destroy({id:params.id}).exec(function(err){
  //     if (err) return res.negotiate(err);
  //     sails.sockets.broadcast(session_id,'mockup/del',{msg:'deleted'});
  //   })
  // },
  edit:(req,res) => {
    let session_id = req.signedCookies['sails.sid'];
    // sails.sockets.join(req,session_id);
    let params = req.allParams();
    console.log(params);
    var materialType = _.snakeCase(params.name);
    let materialImg = { frontimg:params.frontImg,backimg:params.backImg };
    Material.update({id:params.id},{brand:params.brand,name:params.name,type:materialType,description:params.description}).exec(async (err,addMaterial) => {
      console.log('maaterial update',addMaterial);
      if (!err) {
        let color = await Promise.resolve(
          MaterialColor.update({material:addMaterial[0].id},{color:params.color})
        );
        let size = await Promise.resolve(
          MaterialSize.update({material:addMaterial[0].id},{size:params.size})
        );
        let image = await Promise.resolve(
          MaterialImage.update({material:addMaterial[0].id},{image:materialImg})
        );
        let cost = await Promise.resolve(
          MaterialCost.update({material:addMaterial[0].id},{cost:params.cost,minPay:params.minPay})
        );
        let data = { color,size,image,cost };
        sails.sockets.broadcast(session_id,'mockup/updated',{msg:data});
        console.log(data);
      }
    })
  },
  user: async(req,res) => {
    let result = await Report.user();

    let userTotal = sumby(result,(r) => parseInt(r.count));
    let userStatusIndex = ['Active', 'Inactive', 'Payment Failed'];

    let userStatus = keyby(result, 'status');

    res.view('acp/user',{
      userTotal, userStatusIndex, userStatus
    });
  },
  design: (req,res) => {
    // @TODO implement datatable
    res.view('acp/design')
  },
  tracking: (req,res) => {
    Tracking.find({status:'picked'}).populate('owner').exec((err,foundTracking) => {
      if(err) return res.negotiate(err);
      res.view('acp/tracking',{foundTracking});
    });

  },
  manager: (req,res) => {
    User.find({group:sails.config.globals.group.ADMIN}).exec(function(err,foundManager){
      res.view('acp/manager',{foundManager})
    })
  },

  shipment: (req,res) => {
    Fulfillment.find().exec((err,fulfillment)=>{
      // res.view('scp/shipment',{fulfillment});
      res.json(fulfillment)
    })
  },

  system: async(req,res) => {
    let foundMaterial = await Promise.resolve(Material.find().populate('shipfee'));
    Setting.findOne({id:1}).exec(function(err,foundSetting){
      if(err) return res.negotiate(err);
      return res.view('acp/system',{foundSetting,foundMaterial});
    });
  },
  save_shipping: async(req,res)=> {
    let session_id = req.signedCookies['sails.sid'];
    let params = req.allParams();
    console.log(params);
    let foundMaterial = await Promise.resolve(MaterialShip.findOne({material:params.material}));
    if(!foundMaterial){
      MaterialShip.create(params).exec((err,addMaterialShip)=>{
        sails.sockets.broadcast(session_id,'save/shippingfee',{msg:params.material})
      })
    } else {
      MaterialShip.update({material:params.material},params).exec((err,updateMaterialShip)=>{
        sails.sockets.broadcast(session_id,'save/shippingfee',{msg:params.material})
      })
    }
  },

  transactions: async (req,res)=>{
    bluebird.promisifyAll(Transaction);
    let { owner,batchid } = req.allParams();
    if(owner && batchid){
      let query = `select "transactionID",shop,total_order, amount
      from transaction as t left join public.user u on t.owner = u.id
      where "owner" = '${owner}' and "time" = '${batchid}'`;
      let queryDetail = await Transaction.queryAsync(query);
      let resultData = queryDetail.rows;
      console.log('resultData', resultData);
      return res.json(resultData);
    }

    let report = {};
    let queryPendingAmount = `select COALESCE(sum(total_item_price),0) as total_amount 
                          ,count(id) as count_order
                           from public.order where "tracking" <> 'Cancelled' and "payment_status" is null`;
    let pendingAmount = await Transaction.queryAsync(queryPendingAmount);
    report.pendingAmount = pendingAmount.rows;

    let queryAvailableAmount = `select COALESCE(sum(total_item_price),0) as total_amount 
                          ,count(id) as count_order
                           from public.order where "tracking" <> 'Cancelled' and "payment_status" = 'pending'`;
    let availableAmount = await Transaction.queryAsync(queryAvailableAmount);
    report.availableAmount = availableAmount.rows;


    res.view('acp/transactions',{report});
  },

  transaction:async(req,res)=> {
    bluebird.promisifyAll(Transaction);
    let { getCsv, id, filter } = req.allParams();


    if(getCsv){
      let query = `select array_agg("order") as orders from transaction WHERE time = '${getCsv}'`;
      let queryResult = await Transaction.queryAsync(query);

      let orderArray = queryResult.rows[0].orders.join();
      let queryExport = `SELECT  to_char(o."createdAt"::timestamp AT TIME ZONE '-8', 'MM/DD/YYYY') as "created_at", 
        o.id as productionId,
        order_name as orderId, shop as store, 
        o.name as customer, 
        tracking as order_status, 
        total_item_basecost as total_basecost, shipping_fee, 
        total_item_price as total_cost
        FROM public.order o 
        WHERE o.id in (${orderArray})  
        ORDER BY id desc`;
      let queryExportResult = await Transaction.queryAsync(queryExport);

      let exportResult = queryExportResult.rows;
      // return res.json(exportResult);

      let filename = `transaction_${getCsv}`;
      let fields = Object.keys(_.get(exportResult, '[0]',{}));

      // res.json({query});
      return res.csv({
        filename,
        data: exportResult,
        fields
      });
      // return res.send(200);
    }

    let foundTransaction = await Transaction.findOne({transactionID:id}).populate('owner');

    let { order } = foundTransaction;
    let queryParams = { id: order };
    queryParams.select = ["id","shop","name","order_name","orderid","total_item_price", "total_item_basecost", "shipping_fee","createdAt","tracking"];
    if(filter){
      console.log('co filter')
    } else {
      console.log('ko co filter')
    }

    let orderDetails = await Order.find(queryParams);
    // await

    let shopArray = [];
    _.each(orderDetails,(order)=>{
      if (!shopArray.includes(order.shop)) {
        shopArray.push(order.shop)
      }
    })
    // res.json({foundTransaction, orderDetails});
    res.view('acp/transactions/view',{foundTransaction, orderDetails, shopArray})

  },

  mark_as_paid: async(req,res)=>{
    bluebird.promisifyAll(Order);
    let { id } = req.allParams();
    let foundTransaction = await Transaction.findOne({id});
    // console.log('foundTransaction',foundTransaction);
    let orders = foundTransaction.order.join();

    let updateQuery = `UPDATE public.order as o 
                        SET "payment_status" = 'Paid' 
                        WHERE o.id in (${orders})`;
    let updateResult = await Order.queryAsync(updateQuery);

    Transaction.update({id},{status:'Paid'}).then((updateTransaction)=>{
      res.json(updateTransaction);
    }).catch(err => err)
  },

  product:async(req,res)=>{
    let foundProduct = await Product.find();
    // res.json(foundProduct)
    res.view('acp/product',{foundProduct})
  },

  report: (req,res) => {
    res.view('acp/report')
  },

  sortby: (req,res) => {
    let params = req.allParams();
    console.log(params);
    Material.update({id:params.id},{orderid:params.orderid}).exec(function(err){
      if(!err) return res.redirect('/acp/mockup?p=sample')
    })
  },

  picklist:async(req,res)=>{
    console.log('params', req.allParams());
    bluebird.promisifyAll(Order);
    let filename = `picklist`;
    let { by, paramsCompressed } = req.allParams();
    paramsCompressed = paramsCompressed.split(',')
    let selectedOrders = lzma.decompress(paramsCompressed);
    console.log('selectedOrders', selectedOrders);
    // return res.ok();
    let selectedId = sanitizer.escape(selectedOrders);
    let query;
    switch (by){
      case 'item':
        query = `SELECT productid,concat_ws(' / ',brand, color, size) as productName,sku,quantity from (SELECT substring(j.sku FROM '^([0-9]+)-') as productid, sum(quantity) as quantity
    FROM "order" as o, json_to_recordset(line_items) as j(id varchar,variant_title text,sku text, quantity int) 
    WHERE o.id in (${selectedId})
    GROUP BY productId) as productitem
    LEFT JOIN product p on (productid::int) = p.id
    LEFT JOIN material m on material = m.id`;
        break;
      case 'order':
        query = `SELECT o.id,j.brand,
    substring(j.variant_title FROM '\/ ([A-z0-9 ]+) \/') as color,
    substring(j.variant_title FROM '(([A-Z0-9])+)$') as size,
    substring(j.sku FROM '(([0-9])+)$') as side,
    j.quantity,total_item as total_quantity,
    substring(j.sku FROM '-([0-9]+)-') as designid
    FROM "order" as o, json_to_recordset(line_items) as j(id varchar,brand text,variant_title text,sku text, quantity int,design varchar) 
    WHERE o.id in (${selectedId})
    ORDER BY o.id asc`;
        break;
      default:
        query = `SELECT 
          designid::int,
          concat_ws(' / ',brand, color, size) as productName,
          quantity
          from 
            (SELECT
            substring(j.sku FROM '^([0-9]+)-') as productid,
            substring(j.sku FROM '-([0-9]+)-') as designid,
            sum(quantity) as quantity 
            FROM "order" as o, json_to_recordset(line_items) as j(id varchar,variant_title text,sku text, quantity int) 
            WHERE o.id in (${selectedId})
            GROUP BY productId, designid,quantity
            ) as productitem
          LEFT JOIN product p on (productid::int) = p.id
          LEFT JOIN material m on material = m.id
          GROUP BY designid
          , m.brand, p.color, p.size
          ,quantity
          ORDER BY designid, productname
          
`
    }

    let resultQuery = await Order.queryAsync(query);
    let result = resultQuery.rows;

    if(by == 'order'){
      let itemArr = [];
      _.each(result,function(item,index,array){
        let side = '';
        if (item.side == 1){
          side = 'F'
        }
        if (item.side == 0) {
          side = 'B'
        }
        item.side = side;
        if(item.quantity > 1){
          console.log(item,index);
          for(let i=1; i<=item.quantity; i++){
            let product = {
              id: item.id,
              brand: item.brand,
              color: item.color,
              size: item.size,
              side: item.side,
              quantity: 1,
              total_quantity: item.total_quantity,
              designid: item.designid,
            };
            itemArr.push(product);
          };
        }
      });

      result = concat(result, itemArr);

      let getItem = [];
      _.each(result,function(item,index,array){
        if(item.quantity == 1){
          console.log(item,index);
          getItem.push(index);
        }
      });

      result = _.pullAt(result, getItem);
      result = _.sortBy(result, 'id');

      _.each(result,function(item){
        delete item.quantity;
      })
    }


    let totalProduct = sumby(result,'quantity');
    let fields = Object.keys(_.get(result, '[0]',{}));


    // res.json({query});
    res.csv({
      filename,
      data: result,
      fields
    });

  },
  export_order_csv: async(req,res) => {
    console.log('params', req.allParams());
    bluebird.promisifyAll(Order);
    let filename = `export_csv`;
    let { paramsCompressed } = req.allParams();
    paramsCompressed = paramsCompressed.split(',')
    let selectedOrders = lzma.decompress(paramsCompressed);
    console.log('selectedOrders', selectedOrders);
    // return res.ok();
    let selectedId = sanitizer.escape(selectedOrders);
    let query = `SELECT order_number,order_created,order_status,f.service_rate as shipping_service,shipping_fee,first_name, last_name, phone, address1,address2,city,province,country,zip,company,buyer_email,concat_ws(' / ',brand, color, size) as productName,sku,item_price,quantity 
                  FROM (
                    SELECT o.id as order_number,to_char(o."createdAt"::timestamp AT TIME ZONE '-8', 'MM/DD/YYYY') as "order_created",o.tracking as order_status,orderid,shipping_fee,j.basecost as item_price,email as buyer_email,b.first_name,b.last_name,b.phone,b.address1,b.address2,b.city,b.province,b.country,b.zip,b.company,substring(j.sku FROM '^([0-9]+)-') as productid, sum(quantity) as quantity
                        FROM "order" as o, json_to_recordset(line_items) as j(id varchar,variant_title text,sku text, basecost float, quantity int),json_to_record(billing_address) as b(first_name text, last_name text, phone text, address1 text, address2 text, city text, province text, country text, zip text, company text)  
                        WHERE o.id in (${selectedId})
                        GROUP BY productid,o.id, j.basecost, b.first_name, b.last_name, b.phone, b.address1,b.address2,b.city,b.province,b.country,b.zip,b.company	    
                        ORDER BY order_number
                     ) as productitem
                        LEFT JOIN product p on (productid::int) = p.id
                        LEFT JOIN material m on material = m.id
                        LEFT JOIN fulfillment f on order_id = productitem.orderid`;
    let resultQuery = await Order.queryAsync(query);
    let result = resultQuery.rows;

    let fields = Object.keys(_.get(result, '[0]',{}));


    // res.json({query});
    res.csv({
      filename,
      data: result,
      fields
    });
  },

  mark_as_production: async(req,res) => {
    let params = req.allParams();
    console.log('selectedOrders',params);
    // console.log('byStatus', byStatus);
    bluebird.promisifyAll(Order);
    let selectId = Object.values(params).join();
    let selectedId = sanitizer.escape(selectId);

    let query = `UPDATE public.order SET "tracking" = 'In-Production', 
                  "payment_status" = 'pending', "tag" = 'no-pick' 
                WHERE id in (${selectedId}) AND "tracking" = 'pending'`;
    let resultQuery = await Order.queryAsync(query);
    let result = resultQuery.rows;
    res.send(200);
  },

  change_status: async(req,res) => {
    bluebird.promisifyAll(Order);
    let { status, id } = req.allParams();
    console.log('params', req.allParams());
    let currentStatus = await Order.findOne({id});
    // console.log('currentStatus', currentStatus.tracking);
    let query;
    if(status == 'Back-Order'){
      query = `update public.order set "tracking" = 'Back-Order' where id = '${id}'`;
    } else if (status == 'In-Production'){
      if(currentStatus.tracking == 'In-Production'){
        res.json({msg:'error',content:'This current status is In-Production'});
        return false;
      }
      query = `UPDATE public.order SET "tracking" = 'In-Production', 
                  "payment_status" = 'pending', "tag" = 'no-pick' 
                  WHERE id = '${id}'`;
    }
    await Order.queryAsync(query);
    res.json({msg:'success'});
  },

  mark_status: async(req,res)=>{

    let {selectedOrders,byStatus} = req.allParams();
    console.log('selectedOrders',selectedOrders);
    console.log('byStatus', byStatus);
    bluebird.promisifyAll(Order);
    let selectId = Object.values(selectedOrders).join();
    let selectedId = sanitizer.escape(selectId);

    let query = `update public.order set "tracking" = '${byStatus}' where id in(${selectedId})`;

    await Order.queryAsync(query);
    return res.json({update:'success'});
  },

  mark_as_pickup: async(req,res) => {
    bluebird.promisifyAll(Order);
    let params = req.allParams();
    console.log('params', params);
    let selectId = Object.values(params).join();
    let selectedId = sanitizer.escape(selectId);
    console.log('selectId', selectId);

    let query = `update public.order set "tag" = 'picked' where id in(${selectedId})`;
    await Order.queryAsync(query);
    res.send(200)
  },

  remove_tag: async(req,res) => {
    bluebird.promisifyAll(Order);
    let params = req.allParams();
    console.log('params', params);
    let selectId = Object.values(params).join();
    let selectedId = sanitizer.escape(selectId);
    console.log('selectId', selectId);

    let query = `update public.order set "tag" = '' where id in(${selectedId})`;
    await Order.queryAsync(query);
    res.send(200)
  },

  mark_as_print: async(req,res) => {
    bluebird.promisifyAll(Order);
    let params = req.allParams();
    console.log('params', params);
    let selectId = Object.values(params).join();
    let selectedId = sanitizer.escape(selectId);
    console.log('selectId', selectId);

    let query = `update public.order set "tag" = 'print' where id in(${selectedId})`;
    await Order.queryAsync(query);
    res.send(200)
  },

  mark_as_cs: async(req,res) => {
    bluebird.promisifyAll(Order);
    let params = req.allParams();
    let selectId = Object.values(params).join();
    let selectedId = sanitizer.escape(selectId);


    let query = `update public.order set "tag" = 'cs-order' where id in(${selectedId})`;
    await Order.queryAsync(query);
    res.send(200)
  },

  download_design: async(req,res) => {
    let {selectedOrders} = req.allParams();
    console.log('selectedOrders', selectedOrders);
    let designArr = 0;
    // selectedOrders.map(async(order)=>{
    //   let foundOrder = await Order.findOne({id:order})
    //   foundOrder.line_items.map((item)=>{
    //     Download.url(item.design)
    //   })
    // })

    await Promise.all(
        selectedOrders.map(async(order)=>{
        let foundOrder = await Order.findOne({id:order})
        foundOrder.line_items.map((item)=>{
          Download.url(item.design);
          designArr += 1;
        })
      })
    )

    console.log('designArr', designArr);
    setTimeout(() => {
      return zipFolder('assets/images/download/', 'assets/images/zip/archive.zip', function(err) {
        if(err) {
          console.log('oh no!', err);
        } else {
          console.log('EXCELLENT');

          res.json(designArr)
        }
      });
    },10000)

  },

  update_order: async(req,res) => {
      let {order,name,value} = req.allParams();

      if(name=='tag'){
        let result = await Promise.resolve(Order.update({id:order},{tag:value}));
        console.log('update result', result);
        return res.json(result)
      }


      let result = await Promise.resolve(Order.update({id:order},{internal_notes:value}));
      console.log('update result', result);
      return res.json(result)
  },


  label: async(req,res) => {
    let params = req.allParams();
    let {id,action,first_name,last_name,address1,address2,city,country_code,province,zip,rateid,
      phone,length,width,height,weight,order,company,quantity,shippingWeight,basecost,shipmentid} = params;

    if(action == 'create_shipment'){
      console.log('params', params);
      // let print_custom_1 = `#${order}`;
      // const customsInfo = new api.CustomsInfo({
      //   customs_signer: 'Ton Le',
      //   contents_type: 'gift',
      //   contents_explanation : 'gift',
      //   customs_items: [
      //     new api.CustomsItem({
      //       'description': 'T-shirt',
      //       'quantity': quantity,
      //       'code': 'GM',
      //       'weight': shippingWeight,
      //       'value': basecost,
      //       'hs_tariff_number': '610910'
      //     })
      //   ],
      // });



      let from_address = {
        street1: '6182 Winslow Dr',
        city: 'Huntington Beach',
        state: 'CA',
        zip: '92647',
        country: 'US',
        phone: '310-808-5243',
        company: company,
      }

      let to_address = {
        name: `${first_name} ${last_name}`,
        street1: address1,
        street2: address2,
        city: city,
        state: province,
        zip: zip,
        country: country_code,
        phone: phone
      }

      const fromAddress = new api.Address(from_address);
      const toAddress = new api.Address(to_address);


      const parcel = new api.Parcel({
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        weight: parseFloat(weight)
        // predefined_package: 'FlatRateEnvelope'
      });

      const shipment = new api.Shipment({
        to_address: toAddress,
        from_address: fromAddress,
        // customs_info: customsInfo,
        parcel,
        options: {
          endorsement: 'RETURN_SERVICE_REQUESTED',
          invoice_number: `#${order}`,
          // print_custom_1
        }
      });

      shipment.save().then((result) => {
        console.log('result', result);
        return res.json(result)
      }).catch((err)=>{
        console.log('err',err );
      });
    } else if(action == 'buy_label') {
      api.Shipment.retrieve(shipmentid).then(s => {
        s.buy(rateid).then((data)=>{
          console.log('data', data);
          return res.json(data);
        }).catch((err)=>{
          console.log('err', err);
          return res.json(err)
        });
      });
    } else if(id && action == 'get_order') {
      let foundOrder = await Order.findOne({id})

      let shippingWeight = 0
      await Promise.all(
        foundOrder.line_items.map(async (item, index) => {
          shippingWeight += item.shippingWeight
          // if(!item.shippingWeight){
          //   let productid = item.sku.match(/(^[0-9]+)/)[0];
          //   let foundProduct = await Product.findOne({select:['shippingWeight'],id:productid});
          //   let productWeight = {
          //     id:item.sku,
          //     weight:foundProduct.shippingWeight
          //   }
          //   sails.sockets.broadcast(session_id,'order/getWeight',productWeight);
          // }
        })
      )

      let result = {
        shippingWeight,
        shippingAddress:foundOrder.shipping_address
      }


      return res.json(result)
    } else {
        return res.view('acp/create_label')
      }

  },

};
