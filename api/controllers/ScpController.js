/**
 * ScpController
 *
 * @description :: Server-side logic for managing scps
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const { apiKey, apiSecret } = sails.config.shopify;
// var apiKey = 'ae22432ff4d89ca146649cc782f385f1';
// var apiSecret =  '3573364f9e3da3faa1ee8cb02d1ee017';

import QueryBuilder from 'node-datatable';
import bluebird from 'bluebird';
import replace from 'lodash.replace';
import uuidv4 from 'uuid/v4';
import keyby from 'lodash.keyby';
const knex = require('knex')({client: 'pg'});


import sumby from 'lodash.sumby';
import sanitizer from 'sanitizer';
import concat from 'lodash.concat';
import fill from 'lodash.fill';
import moment from 'moment';



const CACHE_KEY = 7;
module.exports = {

	index: async (req,res) => {
	  let user_id = req.user.id;

    // const thisMonthReport = await Report.Order({ user_id, reportBy: 'month' });
    // const todayReport = await Report.Order({ user_id, reportBy: 'day' });
    // const thisWeekReport = await Report.Order({ user_id, reportBy: 'week' });
    // const thisYearReport = await Report.Order({ user_id, reportBy: 'year' });
    const userInfo = await User.findOne({id:user_id}).populate('design');

    let stats = {
      // thisMonthReport,
      // todayReport,
      // thisYearReport,
      // thisWeekReport,
      userInfo,
    };

    let categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let series = [{
      name: 'Shopify',
      data: [7.0, 6.9, 9.5, 14.5, 18.4, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
    }, {
      name: 'Alibama',
      data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
    }];

    // console.log(stats); // result = { rows:   [  {   } ]  }
    res.view('scp/dashboard', { stats, series, categories });
  },
  /*when change the analyze logic*/
	resetOrderAnalyzed: async (req,res) => {
	  let user_id = req.user.id;
	  await Order.update({}, {report_analyzed: false});
	  // sails.log.debug("updatedOrders", updatedOrders);
    res.json({msg: 'reset report_analyzed=false on all order'});
  },
  /*
  product: async(req,res) => {
    let params = req.allParams();
    let { shop, hmac } = req.allParams();
    let foundShop;

    if (params.a == 'add') {
      let foundSave = await Promise.resolve(SaveCampaign.find({owner:req.session.user.id}));
      let getFee = await Promise.resolve(Setting.findOne({ select: ['taxFee','shippingFee'], id: 1 }));
      let allDesign = await Promise.resolve(Design.find({owner:req.session.user.id}));

      if(shop && hmac){
        foundShop = [ { name: shop  } ];
      }else{
        foundShop = await Promise.resolve(Shop.find({owner:req.session.user.id}));
      }

      Material.find({sort:'id ASC'})
        .populate('size')
        .populate('color')
        .populate('image')
        .populate('cost')
        .populate('config')
        .exec(function(err,foundMaterial){
          if (err) return res.negotiate(err);
          return res.view('scp/add-product',{foundSave,foundMaterial,allDesign,foundShop,getFee});
        });
    } else {
      return res.view('scp/product');

    }
  },
  */

  store: async (req,res) => {
    bluebird.promisifyAll(Shop);
    let params = req.allParams();
	  let {id} = req.user;
	  if (!params.name && !params.action) {
      let query = `SELECT s.name ,COALESCE(sum(total_item_price), 0) total
      FROM public.shop s
      LEFT JOIN public.order o on s.name = o.shop 
      WHERE s."owner" = '${id}' 
      AND ("tracking" <> 'Cancelled' OR "tracking" is null)
      GROUP BY s.name`;
      let queryReuslt = await Shop.queryAsync(query);
      let foundShop = queryReuslt.rows;
      let getSum = sumby(foundShop,'total');

      // let getSum = sumResult.rows[0].sum;

      console.log('foundShop', foundShop);
      console.log('getSum', getSum);
      // return res.ok();
      return res.view('scp/store',{foundShop,getSum})
      // Shop.find({owner:req.session.user.id}).exec(function(err,foundShop){
      //   if (!err) {
      //     return res.view('scp/store',{foundShop,getSum})
      //   }
      // });
    }
    // else if (params.name && !params.id) {
    //   Shop.findOne({name:params.name}).populate('shopifytoken').exec(function(err,foundToken){
	   //    console.log('token',foundToken.shopifytoken[0].accessToken);
    //     var Shopify = new ShopifyApi({
    //       rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
    //       backoff: 20,
    //       backoff_delay: 2000,
    //       shop: params.name,
    //       shopify_api_key: apiKey,
    //       access_token: foundToken.shopifytoken[0].accessToken,
    //     });
    //     Shopify.get('/admin/products.json?fields=id,image,title,updated_at', function(err, data){
    //       if(err) {
    //         return res.json(err);
    //       }
    //       data.name = params.name;
    //       return res.view('scp/store/view',{data})
    //     });
    //   });
    // }
    // else if (params.name && params.id && !params.action) {
    //   Shop.findOne({name:params.name}).populate('shopifytoken').exec(function(err,foundToken){
    //     console.log('token',foundToken.shopifytoken[0].accessToken);
    //     var Shopify = new ShopifyApi({
    //       shop: params.name,
    //       shopify_api_key: apiKey,
    //       access_token: foundToken.shopifytoken[0].accessToken,
    //     });
    //     Shopify.get('/admin/products/'+params.id+'.json', function(err, data){
    //       if(err) {
    //         return res.json(err);
    //       }
    //       // res.json(data);
    //       data.name = params.name;
    //       function findWhere(array, criteria) {
    //         return array.find(function(obj){
    //           var criteriaProp = Object.keys( criteria )[ 0 ];
    //           return obj[criteriaProp] === criteria[criteriaProp]
    //         });
    //       }
    //       for (let value of data.product.variants) {
    //         if (typeof value.image_id != 'undefined' && value.image_id) {
    //           let imgSrc = findWhere(data.product.images, {id:value.image_id});
    //           value.img = imgSrc.src;
    //         } else {
    //           value.img= 'no-images'
    //         }
    //       }
    //       return res.view('scp/store/products',{data});
    //       // res.json(data);
    //     });
    //   });
    // }
    // else if (params.name && params.id && params.action == 'delete') {
	   //  Shop.destroy({id:params.id}).exec(function(){
	   //    ShopifyToken.findOne({select:['accessToken'],shop:params.id}).exec((err,foundToken) => {
	   //      console.log('found token',foundToken);
	   //      if(!err) {
    //         var Shopify = new ShopifyApi({
    //           shop: params.name,
    //           shopify_api_key: apiKey,
    //           access_token: foundToken.accessToken,
    //         });
    //
    //         Shopify.get('/admin/webhooks.json', (err,foundWebhooks) => {
    //           console.log(foundWebhooks);
    //           for (let value of foundWebhooks.webhooks) {
    //              Shopify.delete('/admin/webhooks/'+value.id+'.json')
    //           }
    //         });
    //
    //         ShopifyToken.destroy({shop:params.id}).exec(function(){
    //           return res.redirect('/scp/store');
    //         })
    //       }
    //     });
    //
    //   });
    // }
  },

  order_datatable: async(req, res) => {
    const { id } = req.user; // get ID from passport sesion -> req, not raw session
    bluebird.promisifyAll(Order);
    let queryParams = req.allParams();
    let { from, to, export_csv } = queryParams

    console.log('queryParams', queryParams);
    let fromToQuery = ''

    if(from && to){
      fromToQuery = `AND to_char(createdAt::timestamp AT TIME ZONE '-8', 'MM/DD/YYYY')::timestamp between '${from}' and date '${to}' + interval '1 day' - interval '1 second'`
    }



    var tableDefinition = {
      dbType: 'postgres',
      sSelectSql: `to_char(createdAt::timestamp AT TIME ZONE '-8', 'MM/DD/YYYY') as "created_at", 
                    id as productionid, 
                    order_name as order_id, 
                    shop,name as customer,
                    tracking as order_status, 
                    total_item_basecost, 
                    shipping_fee, 
                    total_item_price as total_cost`,
      sTableName: 'public.order',
      sWhereAndSql: `owner=${id} AND sync=1 ${fromToQuery}`,
      aSearchColumns: ['id', 'shop','createdAt', 'name','tracking','total_item_basecost','shipping_fee', 'order_name']
    };


    var queryBuilder = new QueryBuilder(tableDefinition);
    var queries = queryBuilder.buildQuery(queryParams);


    /** fix "createdAt" search issue **/
    let newQueries = {};
    // _.each(queries, (value, key) => {newQueries[key] = replace(value, /\\/g,'');})
    // console.log('queries 1', queries);
    _.each(queries, (value, key) => {newQueries[key] = value.replace( /([a-z]{1,})([A-Z][a-z]{1,})\b/g, '"$1$2"' );})
    queries = newQueries;
    // console.log('queries 2', queries);
    /** fix "createdAt" search issue **/

    console.log('queries', queries);
    // sails.log.debug("SCP:Order:Datatables", queries);
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
      console.log('export_csv', export_csv);
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
  order: async (req,res) => {
	  let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    let user_id = _.get(req, 'user.id', null);
    let owner = user_id;

    let data = {};

    if (params.id) {
      let foundOrder = await Order.findOne({ id: params.id, owner: user_id});
      if(_.isUndefined(foundOrder)){
        return res.notFound();
      }
      const foundToken = await Shop.findOne({name: foundOrder.shop}).populate('shopifytoken');

      let foundHistory = await OrderAction.find({orderid:params.id}).sort('createdAt DESC');
      let foundFulfill = await Fulfillment.find({order_id:foundOrder.orderid});
      // let foundSetting = await Setting.findOne({id:1});
      res.view('scp/order/view',{foundOrder,foundFulfill,foundHistory});
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
              console.log('Job completed imageFetched with data ', result);
              sails.sockets.broadcast(session_id, 'order/imageFetched', result )
            })
            .ttl(120000)
                   .removeOnComplete( true )
            .save();
        })
      }, 3000)
    } else {
      data.shopData = await Shop.find({ owner });
      data.totalOrder = await Order.count({owner,sync:1})
      data.totalPending = await Order.count({owner,sync:1,tracking:'pending'})
      data.totalAwaiting = await Order.count({owner,sync:1,tracking:'Awaiting-Fulfillment'})
      data.totalProduction = await Order.count({owner,sync:1,tracking:'In-Production'})
      data.totalFulfilled = await Order.count({owner,sync:1,tracking:'Fulfilled'});
      data.totalCancelled = await Order.count({owner,sync:1,tracking:'Cancelled'})
      res.view('scp/order/order_datatable', data);
    }


  },

  //@TODO remove it because we use datatable instead
  old_order: async (req,res) => {
	  let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    if (!params.view) {
      Shop.find({owner:req.session.user.id}).populate('shopifytoken').exec(function(err,foundShop){
        if (!err) {
          Order.find({owner:req.session.user.id,sync:1},{sort:'id DESC'}).exec(function(err,foundOrder){
            return res.view('scp/order',{foundShop,foundOrder})
          });
        }
      });
    }
    if (params.view && params.name) {
      const foundToken = await Shop.findOne({name: params.name}).populate('shopifytoken');
      let foundOrder = await Order.findOne({orderid:params.view});

      res.view('scp/order/view',{foundOrder});

      let shopifyAuth = {
        rate_limit_delay: 10000, // 10 seconds (in ms) => if Shopify returns 429 response code
        backoff: 20,
        backoff_delay: 2000,
        shop: params.name,
        shopify_api_key: apiKey,
        access_token: foundToken.shopifytoken[0].accessToken,
      };

      // Better with: run after view & delay pushing 1s
      setTimeout(() => {
        const { line_items = [] } = foundOrder;
        const publisher = sails.hooks.kue_publisher;
        line_items.map(async (item, index) => {
          let { id, variant_id, product_id } = item;
          let publishData = {
            title: shopifyAuth.shop,// show shop name
            variant_id,
            shopifyAuth
          };
          publisher.create('getshopifyimage', publishData)
                   .priority('normal')
                   // .searchKeys( ['title'] )
                   .attempts(20)
                   .backoff( { delay: 3 * 1000, type: 'fixed'} )
                   .on('complete', function(result){
                     console.log('Job completed imageFetched with data ', result);
                     sails.sockets.broadcast(session_id, 'order/imageFetched', result )
                   })
                   .removeOnComplete( true )
                   .ttl(120000)
                   .save();

        })
      }, 3000)
    }
    if (params.action == 'print') {
      let params = req.allParams();
      console.log(params);

      let paymentDetail = {
        shippingTo: params.shippingAddress,
        items: params.orderItems
      };
      Payment.findOne({orderID:params.orderID}).exec(function(err,foundPayment){
        if(foundPayment) {
          sails.sockets.broadcast(session_id,'view/payment',{data:foundPayment.id});
          console.log('exist')
        } else {
          Payment.create({
            orderID : params.orderID,
            type:'pay-to-print',
            description: 'seller pay to print with Gearment',
            detail: paymentDetail,
            owner: params.ownerID
          }).exec((err,createPayment) => {
            console.log(createPayment);
            sails.sockets.broadcast(session_id,'add/payment',{data:createPayment})
          })
        }
      });

    }
  },

  scp_order_stats: async (req, res) => {
    bluebird.promisifyAll(Order);
    const { id } = req.user;
    let { from, to, shop } = req.allParams();
    console.log('params sss', req.allParams());

    let addQuery = {}

    if(shop){
      console.log('co shop', shop);
      addQuery.shop = shop
    }
    addQuery.owner = id;


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

    // console.log('testData', testData);

    // data['all-order'] = await (Order.queryAsync(query.toString())).then(e=>e.rows[0].count) // {sync:1, ...addQuery}
    // data['pending-order'] = await Order.queryAsync(query.where({tracking:'pending'}).toString()).then(e=>e.rows[0].count)
    // data['back-order'] = await Order.queryAsync(query.where({tracking:'Back-Order'}).toString()).then(e=>e.rows[0].count)
    // data['awaiting-fulfillment-order'] = await Order.queryAsync(query.where({tracking:'Awaiting-Fulfillment'}).toString()).then(e=>e.rows[0].count)
    // console.log('inprod query', query.where({tracking:'In-Production'}).toString());
    // data['in-production-order'] = await Order.queryAsync(query.where({tracking:'In-Production'}).toString()).then(e=>e.rows[0].count)
    // data['fulfilled-order'] = await Order.queryAsync(query.where({tracking:'Fulfilled'}).toString()).then(e=>e.rows[0].count)
    // data['cancelled-order'] = await Order.queryAsync(query.where({tracking:'Cancelled'}).toString()).then(e=>e.rows[0].count)

    // console.log('aq', {sync:1, ...addQuery});

    console.log('stats query', query.toString());
    console.log('stats data', data);
    res.json(data)
  },


  order_shop_filter: async (req, res) => {
    let query = {}
    query.owner = req.user.id;
    let data = await Shop.find(query);

    res.json(data)
  },

  // Order stats
  order_stats: async (req, res) => {
	  const { id } = req.user;
    bluebird.promisifyAll(Order);
    let stats = {};
	  let result = await Order.queryAsync(`SELECT count(orderid) AS number_order, date_trunc('week', "createdAt")
	   FROM public.order WHERE owner=${id} AND "createdAt" > now() - INTERVAL '1 months' GROUP BY date_trunc('week', "createdAt")`); // cai nay no in ra ket qua la gi array[] hả

    stats = {
      ...stats, //may cai ... la sao
      ..._.get(result, 'rows') // cai cuc shit nay la sao
    };


    let categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let series = [{
      name: 'Shopify',
      data: [7.0, 6.9, 9.5, 14.5, 18.4, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
    }, {
      name: 'Alibama',
      data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
    }];

    console.log(result); // result = { rows:   [  {   } ]  }
	  res.view('scp/dashboard', { stats, series, categories });
  },

  //FEATURE NÀY ĐÃ LÀM XONG , NHƯNG KHÔNG XÀI
  // orderRefund: async(req,res)=>{
  //   // 4204416203
  //   let { id, orderid, shop, notify, shipping, refund_line_items } = req.allParams();
  //
  //   let findToken = await Shop.findOne({name: shop}).populate('shopifytoken');
  //   let shopifyAuth = {
  //     shop: shop,
  //     shopify_api_key: apiKey,
  //     access_token: findToken.shopifytoken[0].accessToken,
  //   }
  //     const Shopify = new ShopifyApi(shopifyAuth);
  //   //
  //   let calculateData = {
  //     "refund": {
  //       shipping, refund_line_items
  //     }
  //   }
  //   Shopify.post(`/admin/orders/${orderid}/refunds/calculate.json`, calculateData, (err,resultData)=>{
  //     if(err) return false;
  //
  //     resultData.restock = true;
  //     resultData.notify = notify;
  //     resultData.note = 'refund item';
  //     resultData.refund.transactions[0].kind = 'refund';
  //     console.log('resultData',resultData.refund.transactions[0]);
  //
  //     Shopify.post(`/admin/orders/${orderid}/refunds.json`,resultData,(err,result)=>{
  //       if(err) console.log('loi roi',err);
  //       // console.log('result',result)
  //
  //       let createLogData = {
  //         orderid: id,
  //         type: 'refund',
  //         data: {refund_line_items,msg:'You manually marked this order as refunded.'},
  //         owner: req.user.id
  //       }
  //
  //       OrderAction.create(createLogData).catch((err)=>{
  //         sails.log.debug('OrderAction:refund:failed',err)
  //       }).then((result)=>{
  //         sails.log.debug('OrderAction:refund:success',result)
  //       })
  //       res.json({msg:'ok'});
  //
  //     })
  //   });
  // },

  editQuantity: async(req,res)=>{
    let { orderid, id, lineItem } = req.allParams();
    let foundOrder = await Order.findOne({id});
    _.each(foundOrder.line_items,(item)=>{
      _.each(lineItem,(newItem)=>{
        if(item.sku == newItem.sku){
          item.quantity = newItem.quantity
        }
      })
    });
    // console.log('updte to',foundOrder.line_items);
    Order.update({id},{line_items:foundOrder.line_items}).then((result)=>{
      let createData = {
        orderid:id,
        type: 'change_quantity',
        data: {line_items:lineItem,msg:'Product quantity updated'},
        owner: req.user.id
      }
      OrderAction.create(createData).then((result)=>{
        Report.Order({orderid,export_report: false,REVALIDATE:true});
        res.json({msg:'ok'})
      })
    }).catch((err)=>{
      console.log(err)
    })
  },

  notification: (req,res) => {
	  let params = req.allParams();
    Shop.findOne({name:params.name}).populate('shopifytoken').exec(function(err,foundShop){
      var Shopify = new ShopifyApi({
        shop: foundShop.name,
        shopify_api_key: apiKey,
        access_token: foundShop.shopifytoken[0].accessToken,
      });
      console.log(foundShop.shopifytoken);

      Shopify.get('/admin/webhooks.json', (err,foundWebhooks) => {
          // res.view('scp/notification',{foundWebhooks});
          res.json({foundWebhooks});
      });
    });
  },

  get_design: (req,res) => {
    let user_id = req.user.id;
	  Design.find({owner:user_id}).exec((err,foundDesign)=>{
	    res.view('scp/design',{foundDesign})
    })
  },

  design: (req,res) => {
	  let params = req.allParams();

	  params.owner = req.user.id;
	  let broadCastchannel = params.broadCastchannel || 'design/added';

    let session_id = req.signedCookies['sails.sid'];
    // sails.sockets.join(req,session_id);
    Design.create(params).exec(function(err,addDesign){
      sails.sockets.broadcast(session_id, broadCastchannel, { msg:addDesign })
      res.send(addDesign);
    })
  },

  getsize: (req,res) => {
    let session_id = req.signedCookies['sails.sid'];
    // sails.sockets.join(req,session_id);
    let params = req.allParams();
    MaterialSize.findOne({material:params.id}).exec(function(err,foundAllSize){
      console.log(foundAllSize);
      sails.sockets.broadcast(session_id,'load/allsize',{msg:foundAllSize});
    })
  },

  sync: (req,res) => {
    return res.view('scp/sync-store')
  },

  success: (req,res) => {
    let params = req.allParams();
    if(params.t && params.do == 'sync') {
      var data = {
        msg:'Success',
        content: params.t,
        url:'/scp/store'
      }
    }
    return res.view('scp/notice',data)
  },

  remove: (req,res) => {
	  let params = req.allParams();
	  console.log(params);
	  if (params.item == 'design') {
	    Design.destroy({id:params.id}).exec(function(err,result){
	      console.log('delete design',result)
      })
    }
  },

  get: async(req,res) => {
	  let { id,side } = req.allParams();
	  console.log('side', side);

    let session_id = req.signedCookies['sails.sid'];

    let data = {};
    let ENABLE_CACHE = false;
    let cachePrefix = `scp:get:config:${id}:${CACHE_KEY}`;

    let getConfigCached = await Cache.getAsync(`${cachePrefix}`);

    if(ENABLE_CACHE && getConfigCached){
      data = JSON.parse(getConfigCached);
    }else{
      data.color = await Promise.resolve(MaterialColor.findOne({material:id}));

      if(side == 'front'){
        data.config = await Promise.resolve(MaterialConfig.findOne({material:id}));
      } else {
        data.config = await Promise.resolve(MaterialBackConfig.findOne({material:id}));
      }

      data.basecost = await Promise.resolve(MaterialSize.findOne({material:id}));

      let cacheConfigString = JSON.stringify(data);
      Cache.set(`${cachePrefix}`, cacheConfigString, 'EX', 600);
    }
    console.log('data', data);
    res.json(data);
  },

  // bulk_upload: (req,res) => {
  //   SaveCampaign.find({owner:req.user.id}).exec((err,foundSave) => {
  //     res.view('scp/bulk_upload',{foundSave});
  //   })
  // },

  old_billing: async (req,res) => {
    let foundUser = await Promise.resolve(User.findOne({id:req.session.user.id}));
    let foundPayment = await Promise.resolve(Payment.find({owner:foundUser.id},{sort:'id DESC'})
      .where({type:'add-balance'})
      .limit(10));
      return res.view('scp/old_billing',{foundUser,foundPayment})
  },

  billing:(req,res)=> {
	  // sails.sockets.join(req,req.user.id);
	  let params = req.allParams();
	  Paypal.findOne({owner:req.user.id}).exec((err,foundPaypal)=>{
	    res.view('scp/billing',{foundPaypal});
    })
  },

  profile: async(req, res) => {
    let foundPaypal = await Paypal.findOne({owner:req.user.id});
    let foundApiToken = await ApiToken.findOne({owner:req.user.id});
    let foundAddress = await BillingAddress.findOne({owner:req.user.id});

    console.log('foundApiToken', foundApiToken);
    res.view('scp/profile',{
      foundAddress,
      foundPaypal,
      foundApiToken
    });
  },


  generateToken: async(req, res) => {
    let owner  = req.user.id;
    let token;
    let msg;

    console.log('owner', owner);
    let findToken = await ApiToken.findOne({ owner });
    if(findToken) {
      token = uuidv4();
      await Promise.resolve(ApiToken.update({ owner }, { token }))
      msg = 'API Token updated';
    }else{
      token = uuidv4();
      await Promise.resolve(ApiToken.create({ token, owner }))
      msg = 'API Token created';
    }

    res.json({ token, owner, msg });
  },

  order_dashboard: async (req, res) => {
    let params = req.allParams();
    let { from, to } = params;
    let user_id = req.user.id;

    let dashboard = await Report.orderDashboard({from, to, owner: user_id});
    res.json(dashboard);
  },

  transactions: async (req,res)=>{
    bluebird.promisifyAll(Transaction);
    let { batchid } = req.allParams();
    let {id} = req.user;
    if(batchid){
      let query = `select "transactionID",shop,total_order, amount
      from transaction as t left join public.user u on t.owner = u.id
      where "owner" = '${id}' and "time" = '${batchid}'`;
      let queryDetail = await Transaction.queryAsync(query);
      let resultData = queryDetail.rows;
      console.log('resultData', resultData);
      return res.json(resultData);
    }

    res.view('scp/transactions');
  },

  transaction:async(req,res)=> {
    let { getCsv,id } = req.allParams();
    bluebird.promisifyAll(Transaction);

    if(getCsv){
      let query = `select array_agg("order") as orders from transaction WHERE time = '${getCsv}' and "owner" = '${req.user.id}'`;
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
      console.log('queryExport', queryExport);
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


    let foundTransaction = await Transaction.findOne(id).populate('owner');

    let { order, owner } = foundTransaction;

    if(req.user.id !== owner.id){
      return res.forbidden(`You dont't have permission to access this transaction`);
    }

    let orderDetails = await Order.find({ id: order, select: ["id","shop","name","order_name","orderid","total_item_price", "total_item_basecost", "shipping_fee","createdAt","tracking"] })
    // await
    let shopArray = [];
    _.each(orderDetails,(order)=>{
      if (!shopArray.includes(order.shop)) {
        shopArray.push(order.shop)
      }
    })

    // res.json({foundTransaction, orderDetails});
    res.view('scp/transactions/view',{foundTransaction, orderDetails, shopArray})

  }

};
