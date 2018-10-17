// // @TODO Preparing to move all hardcode to config like this
// // const { apiKey, apiConfig } = sails.config.shopify;
// // const { easypostApiKey } = sails.config.easypost;
// import bluebird from 'bluebird';
// // var forEach = require('async-foreach').forEach;
//
// const { apiKey, apiSecret } = sails.config.shopify;
// // const { easypostapi } = sails.config.easypost;
//
// // var apiKey = 'ae22432ff4d89ca146649cc782f385f1';
// // var apiSecret =  '3573364f9e3da3faa1ee8cb02d1ee017';
// // var JSZip = require("jszip");
// // var FileSaver = require('file-saver');
// //o day thi dung test api thoi
// const easypostapi = '0qSy6pqLZyeXoXajMpcwBg';
// const EasyPost = require('node-easypost');
//
// const api = new EasyPost(easypostapi);
//
// var paypal = require('paypal-rest-sdk');
// paypal.configure({
//   'mode': 'sandbox', //sandbox or live
//   'client_id': 'AX3heXxYc4YhOjm8_55a_0iuj3VuEIC7XmidVd483WlIkDdy5igK9IqKy151c0AE6FYYKII5kgP_6HzL',
//   'client_secret': 'EAZiKAKPGpzfjPnzZ7J_thpDR6KSPsnEU8Ku_Ny2z-NtNHTNGVVXaTLvMeQMhISVMTWL3cv3qZt_y0a0',
// });
//
// //paypal-adaptive
// var Paypal = require('paypal-adaptive');
//
// var paypalSdk = new Paypal({
//   userId:    'trancatkhanh-facilitator_api1.gmail.com',
//   password:  'RM36ZR9Y8U4F26CU',
//   signature: 'AFcWxV21C7fd0v3bYYYRCpSSRl31AFnTl-Bo2ILpGym1mvz9McrgkOm7',
//   sandbox:   true //defaults to false
// });
//
// module.exports = {
//
//   collection:async(req,res)=> {
//     let shop = 'superbowltee.myshopify.com';
//     let findToken = await Promise.resolve(Shop.findOne({name: shop}).populate('shopifytoken'));
//     var Shopify = new ShopifyApi({
//       shop: shop,
//       shopify_api_key: apiKey,
//       access_token: findToken.shopifytoken[0].accessToken,
//     });
//     Shopify.get('/admin/custom_collections.json',function(err,data){
//       return res.json(data);
//     })
//   },
//
//   product:async(req,res)=> {
//     let shop = 'minion-things.myshopify.com';
//     let findToken = await Promise.resolve(Shop.findOne({name: shop}).populate('shopifytoken'));
//     var Shopify = new ShopifyApi({
//       shop: shop,
//       shopify_api_key: apiKey,
//       access_token: findToken.shopifytoken[0].accessToken,
//     });
//     // var pushData = {
//     //   "product": {
//     //     "id": 632910392,
//     //     "published": true
//     //   },
//     //   "custom_collection": [
//     //
//     //   ]
//     // };
//     // /admin/products/${product_id}/images/${image_id}.json
//     Shopify.get('/admin/products/9676372749/images/23626316749.json', function(err,data){
//       return res.json(data);
//     })
//   },
//
//   collect:async(req,res)=> {
//     let shop = 'superbowltee.myshopify.com';
//     let findToken = await Promise.resolve(Shop.findOne({name: shop}).populate('shopifytoken'));
//     var Shopify = new ShopifyApi({
//       shop: shop,
//       shopify_api_key: apiKey,
//       access_token: findToken.shopifytoken[0].accessToken,
//     });
//     // var pushData = {
//     //   "product": {
//     //     "id": 632910392,
//     //     "published": true
//     //   },
//     //   "custom_collection": [
//     //
//     //   ]
//     // };
//     Shopify.get('/admin/collects.json', function(err,data){
//       return res.json(data);
//     })
//   },
//
//   addcollect:async(req,res)=> {
//     let shop = 'superbowltee.myshopify.com';
//     let findToken = await Promise.resolve(Shop.findOne({name: shop}).populate('shopifytoken'));
//     var Shopify = new ShopifyApi({
//       shop: shop,
//       shopify_api_key: apiKey,
//       access_token: findToken.shopifytoken[0].accessToken,
//     });
//
//     var postData = {
//       "collect": {
//         "product_id": 9045485778,
//         "collection_id": 367360082
//       }
//     };
//
//     Shopify.post('/admin/collects.json',postData , function(err,data){
//       return res.json(data);
//     })
//   },
//
//   tracking: async(req,res) => {
//     let shop = 'superbowltee.myshopify.com';
//     let findToken = await Promise.resolve(Shop.findOne({name: shop}).populate('shopifytoken'));
//     var Shopify = new ShopifyApi({
//       shop: shop,
//       shopify_api_key: apiKey,
//       access_token: findToken.shopifytoken[0].accessToken,
//     });
//
//     var postData = {
//       "fulfillment": {
//         "tracking_number": "123456789",
//         "tracking_company": "4PX",
//         "line_items": [
//           {
//             "id": 9163800594
//           },
//           {
//             "id": 9163800658
//           }
//         ]
//       }
//     };
//
//     Shopify.post('/admin/orders/4766111506/fulfillments.json',postData , function(err,data){
//       return res.json(data);
//     })
//
//   },
//
//
//   easypost : async (req,res) => {
//     // const shipment = new api.Shipment({
//     //   to_address: {
//     //     "street1": "C/. Zaragoza, 3",
//     //     "city": "Puertollano",
//     //     "state": "CR",
//     //     "zip": "13500",
//     //     "country": "ES",
//     //     "name": "Esteban José Morales Ramirez"
//     //   },
//     //   from_address: {
//     //     'company': 'Heather Sears',
//     //     'street1': '7 Goddeau rd',
//     //     'city': 'Cadyville',
//     //     'state': 'NY',
//     //     'zip': '12918',
//     //     'phone': ''
//     //   },
//     //   parcel: {
//     //     'length': 20,
//     //     'width': 11,
//     //     'height': 5,
//     //     'weight': 65,
//     //     // 'predefined_package': 'FlatRateEnvelope'
//     //   },
//     //   customs_info: {
//     //     eel_pfc: 'NOEEI 30.37(a)',
//     //     customs_certify: true,
//     //     customs_signer: 'Ton Le',
//     //     contents_type: 'tshirt',
//     //     contents_explanation: '',
//     //     restriction_type: 'none',
//     //     restriction_comments: '',
//     //     non_delivery_option: 'abandon'
//     //   }
//     //
//     // });
//     //
//     // shipment.save().then(() => {
//     //   console.log('shipment done',shipment)
//     //   res.json(shipment)
//     //
//     // })
//     //   for (let value of shipment.rates) {
//     //     if(value.service == 'First') {
//     //       shipment.selectId = value.id
//     //     }
//     //   }
//     //   shipment.buy(shipment.selectId)
//     //     .catch((err) => {
//     //     console.log('ger error',err)
//     //     })
//     //     .then((result)=>{
//     //     res.json(result);
//     //   });
//     // });
//     const carrier_accounts = ['ca_ea071efec62745338c114859c9977e44','ca_82adc9da5fe74337bc36fcaf9d895e5e']
//
//     const toAddress = new api.Address({
//       name: 'Esteban José Morales Ramirez',
//       street1: 'C/. Zaragoza, 3',
//       street2: 'FLOOR 5',
//       city: 'Puertollano',
//       state: 'CR',
//       zip: '13500',
//       country: 'ES',
//       company: 'EasyPost',
//       phone: '415-123-4567',
//     });
//
//     const fromAddress = new api.Address({
//       street1: '417 MONTGOMERY ST',
//       street2: 'FLOOR 5',
//       city: 'SAN FRANCISCO',
//       state: 'CA',
//       zip: '94104',
//       country: 'US',
//       company: 'EasyPost',
//       phone: '415-123-4567',
//     });
//
//     const parcel = new api.Parcel({
//       length: 20.2,
//       width: 10.9,
//       height: 5,
//       weight: 65.9,
//       // predefined_package: 'FlatRateEnvelope'
//     });
//
//     const customsInfo = new api.CustomsInfo({
//       // eel_pfc: 'NOEEI 30.37(a)',
//       // customs_certify: true,
//       customs_signer: 'Ton Le',
//       // contents_type: 'merchandise',
//       // contents_explanation: '',
//       // restriction_type: 'none',
//       // restriction_comments: '',
//       // non_delivery_option: 'abandon',
//
//       /* customs_items can be passed in as instances or ids.
//        *  if the item does not have an id, it will be created. */
//       customs_items: [
//       new api.CustomsItem({
//         'description': 'Sweet shirts',
//         'quantity': 2,
//         'weight': 11,
//         'value': 23,
//       }
//       )],
//     });
//
//
//     const shipment = new api.Shipment({
//       carrier_accounts,
//       to_address: toAddress,
//       from_address: fromAddress,
//       parcel: parcel,
//       customs_info: customsInfo
//     });
//
//     shipment.save().then(result => res.json(result));
//
//
//   },
//   /** EasyPost
//    * Account : tonle@gearment.com
//    * Password : Abcd1234@
//    * API Key : 0qSy6pqLZyeXoXajMpcwBg
//    * Secret Key : VOlV03Gkzwt03ENcMBnbDQ
//    * */
//
//   easypost_custom:(req,res)=>{
//     const item = new api.CustomsItem({
//       'description': 'Sweet shirts',
//       'quantity': 2,
//       'weight': 11,
//       'value': 23,
//       'hs_tariff_number': '654321',
//       'origin_country': 'US'
//     });
//
//     // let customsInfo;
//     item.save().then(() => {
//       const customsInfo = new api.CustomsInfo({
//         eel_pfc: 'NOEEI 30.37(a)',
//         customs_certify: true,
//         customs_signer: 'Steve Brule',
//         contents_type: 'merchandise',
//         contents_explanation: '',
//         restriction_type: 'none',
//         restriction_comments: '',
//         non_delivery_option: 'abandon',
//
//         /* customs_items can be passed in as instances or ids.
//          *  if the item does not have an id, it will be created. */
//         customs_items: [
//           item,
//           new api.CustomsItem({
//             'description': 'Sweet shirts',
//             'quantity': 2,
//             'weight': 11,
//             'value': 23,
//             'hs_tariff_number': '654321',
//             'origin_country': 'US'
//           })],
//       });
//
//       customsInfo.save().then((result)=>{
//         res.json(result)
//       }).catch((err)=>{
//         res.json(err)
//       })
//     });
//   },
//
//   getOrder: (req,res) => {
//
//     let shop = 'gm1001.myshopify.com';
//     Shop.findOne({name: shop}).populate('shopifytoken').exec(function(err,findToken){
//       const Shopify = new ShopifyApi({
//         shop: shop,
//         shopify_api_key: apiKey,
//         access_token: 'b0a745c68edd5057fd85dd59a3249369',
//       });
//       Shopify.get('/admin/orders/5987704979.json', function(err,data){
//         return res.json(data);
//       })
//     });
//
//   },
//
//   shop: (req,res) => {
//
//     let shop = '9shirt.myshopify.com';
//     Shop.findOne({name: shop}).populate('shopifytoken').exec(function(err,findToken){
//       const Shopify = new ShopifyApi({
//         shop: shop,
//         shopify_api_key: apiKey,
//         access_token: findToken.shopifytoken[0].accessToken,
//       });
//       Shopify.get('/admin/shop.json', function(err,data){
//         return res.json(data);
//       })
//     });
//
//   },
//
//   update_address: (req,res)=>{
//     // PUT /admin/orders/#{id}.json
//     // {
//     //   "order": {
//     //   "id": 450789469,
//     //     "shipping_address": {
//     //     "address1": "123 Ship Street",
//     //       "city": "Shipsville"
//     //   }
//     // }
//     // }
//     let updateData = {
//       "order": {
//         "id": 4883225938,
//         "shipping_address": {
//           "name": "Khanh Tran",
//           "address1": "123 Ship Street",
//           "city": "Shipsville",
//           "zip": "73301",
//           "province": "Texas",
//           "province_code": "TX",
//           "country": "United State",
//           "country_code": "US"
//         }
//       }
//     }
//     let shop = 'superbowltee.myshopify.com';
//     Shop.findOne({name: shop}).populate('shopifytoken').exec(function(err,findToken){
//       const Shopify = new ShopifyApi({
//         shop: shop,
//         shopify_api_key: apiKey,
//         access_token: findToken.shopifytoken[0].accessToken,
//       });
//       Shopify.put('/admin/orders/4883225938.json',updateData, function(err,data){
//         return res.json(data);
//         console.log('data',data)
//       })
//     });
//
//   },
//
//   check_address: (req,res) => {
//         // street1: '6182 Winslow Dr',
//         // city: 'Huntington Beach',
//         // state: 'CA',
//         // zip: '92647',
//         // country: 'US',
//         // phone: '310-808-5243'
//     // 6222 Skyline Dr. Unit 5
//     // Houston, TX 77057
//     // United StatesUS
//     // (281) 799-8363
//
//     const verifiableAddress = new api.Address({
//       verify: ['delivery'],
//       street1: '6222 Skyline Dr. Unit 5',
//       city: 'Houston',
//       state: 'TX',
//       zip: '77057',
//       country: 'US',
//       phone: '(281) 799-8363'
//     });
//
//     verifiableAddress.save().then((addr) => {
//       res.json(addr);
//       // verifiableAddress is updated, and also passed into
//       // the promise resolve.
//       // console.log(addr.street1);
//       // 417 Montgomery Street
//
//       // console.log(addr.verifications);
//       /*
//        { delivery:
//        { success: true,
//        errors: [],
//        } }
//        */
//     });
//
//   },
//
//   easypost_callback: (req,res) => {
//     let params = req.allParams();
//     console.log('webhook callback',params);
//     res.json(params)
//   },
//
//   webhook_check:(req,res)=> {
//     api.Webhook.all().then(console.log);
//
//   },
//
//   preapproval:(req,res)=>{
//     var payload = {
//       currencyCode:                   'USD',
//       startingDate:                   new Date().toISOString(),
//       // endingDate:                     new Date('2020-01-01').toISOString(),
//       returnUrl:                      'https://dev.gearment.com/test/pre_return?owner='+req.user.id,
//       cancelUrl:                      'https://dev.gearment.com/test/pre_cancel?owner='+req.user.id,
//       ipnNotificationUrl:             'https://dev.gearment.com/test/pre_notify?owner='+req.user.id,
//       // maxNumberOfPayments:            1,
//       // displayMaxTotalAmount:          true,
//       // maxTotalAmountOfAllPayments:    '100.00',
//       requestEnvelope: {
//         errorLanguage:  'en_US'
//       }
//     }
//
//     paypalSdk.preapproval(payload, function (err, response) {
//       if (err) {
//         console.log(err);
//       } else {
//         // Response will have the original Paypal API response
//         // console.log('response',response);
//         return res.json(response);
//         // res.redirect(response.preapprovalUrl);
//         // But also a preapprovalUrl, so you can redirect the sender to approve the payment easily
//         // console.log('Redirect to %s', response.preapprovalUrl);
//       }
//     });
//   },
//
//   pre_return: (req,res)=> {
//     let params = req.allParams();
//     res.json(params)
//   },
//
//   pre_cancel: (req,res)=> {
//     let payload = {
//       requestEnvelope: {
//         errorLanguage:  'en_US'
//       },
//       preapprovalKey: 'PA-3MA93209U9191105C',
//     };
//
//     paypalSdk.cancelPreapproval(payload, function(err,response){
//       res.json(response)
//     });
// },
//
//   pre_notify: (req,res) => {
//     // If user cancel preappoval , it will response
//     /**
//      * { max_number_of_payments: 'null',
// 1|app      |   starting_date: '2017-05-22T01:59:25.000Z',
// 1|app      |   pin_type: 'NOT_REQUIRED',
// 1|app      |   currency_code: 'USD',
// 1|app      |   sender_email: 'trancatkhanh-buyer@gmail.com',
// 1|app      |   verify_sign: 'AFcWxV21C7fd0v3bYYYRCpSSRl31A2DoReFX-oGzwE8C5wL9U8O3W-VZ',
// 1|app      |   test_ipn: '1',
// 1|app      |   date_of_month: '0',
// 1|app      |   current_number_of_payments: '0',
// 1|app      |   preapproval_key: 'PA-39383417VY799922N',
// 1|app      |   approved: 'true',
// 1|app      |   day_of_week: 'NO_DAY_SPECIFIED',
// 1|app      |   transaction_type: 'Adaptive Payment PREAPPROVAL',
// 1|app      |   status: 'CANCELED',
// 1|app      |   current_total_amount_of_all_payments: '0.00',
// 1|app      |   current_period_attempts: '0',
// 1|app      |   charset: 'windows-1252',
// 1|app      |   payment_period: '0',
// 1|app      |   notify_version: 'UNVERSIONED' }
//      *
//      */
//     let params = req.allParams();
//     console.log(params)
//   },
//
//   pre_data: (req,res)=> {
//     let payload = {
//       requestEnvelope: {
//         errorLanguage:  'en_US'
//       },
//       preapprovalKey: 'PA-3MA93209U9191105C',
//     };
//
//     paypalSdk.preapprovalDetails(payload, (err,response) => {
//       res.json(response)
//     });
//   },
//
//   pre_pay:(req,res)=> {
//     let payload = {
//       requestEnvelope: {
//         errorLanguage:  'en_US'
//       },
//       actionType:     'PAY',
//       currencyCode:   'USD',
//       feesPayer:      'EACHRECEIVER',
//       memo:           'Chained payment example',
//       preapprovalKey: 'PA-3MA93209U9191105C',
//       cancelUrl:      'http://test.com/cancel',
//       returnUrl:      'http://test.com/success',
//       receiverList: {
//         receiver: [
//           {
//             email:  'trancatkhanh-facilitator@gmail.com',
//             amount: '9999.00'
//           }
//         ]
//       },
//       senderEmail: 'trancatkhanh-buyer@gmail.com'
//     };
//
//     paypalSdk.pay(payload, function (err, response) {
//       if (err) {
//         console.log(err);
//       } else {
//         // Response will have the original Paypal API response
//         // console.log(response);
//         // But also a paymentApprovalUrl, so you can redirect the sender to checkout easily
//         // console.log('Redirect to %s', response.paymentApprovalUrl);
//         res.json(response)
//       }
//     });
//   },
//
//   pickup:async(req,res)=>{
//     // bluebird.promisifyAll(Order);
//     let { selectedOrders } = req.allParams();
//     // Selected Pickup Order <array>:string.split(',')
//     // let orders = [2261, 2264, 2266, 2268];
//
//     sails.log.debug("selectedOrders", selectedOrders);
//
//     let pickupOrders = await Order.find({ select: ['line_items', 'id'] }).where({ id: selectedOrders })
//
//     let filename = `pickup-order-items`;
//
//     let orderItems = [];
//
//     _.each(pickupOrders, (order) => {
//
//       sails.log.debug("order", order);
//
//       let { line_items } = order;
//       _.each(line_items, (line_item) => {
//         const { variant_title,  brand, quantity ,design} = line_item
//         sails.log.debug("line_item", line_item);
//         let color = variant_title.split(' / ')[1];
//         let size = variant_title.split(' / ')[2];
//         let designID = Design.findOne({select:['design_id'],id:design});
//         let csvLineItem = {
//           id: order.id,
//           brand,
//           color,
//           size,
//           design: designID.design_id,
//           quantity
//         };
//
//         // Each line item from order
//         orderItems.push(csvLineItem);
//       })
//
//     })
//
//     sails.log.debug("orderItems", orderItems);
//
//     let fields = Object.keys(_.get(orderItems, '[0]',{}));
//
//     res.csv({
//       filename,
//       data: orderItems,
//       fields
//     });
//   },
//
//   get_product:(req,res)=>{
//     let shop = 'iteefun.myshopify.com';
//     // let token = 'e5c7e7ea368528a86a8f1a06cd47adbe';
//     Shop.findOne({name: shop}).populate('shopifytoken').exec(function(err,findToken){
//       const Shopify = new ShopifyApi({
//         shop: shop,
//         shopify_api_key: apiKey,
//         access_token: findToken.shopifytoken[0].accessToken,
//       });
//       Shopify.get('/admin/products/9155067723.json', function(err,data){
//         res.json(data);
//         // return res.json(data);
//         // _.each(data.products,(product)=> {
//           _.each(data.product.variants,(variant)=>{
//               Variant.create({shop:shop,deleted:0,variantID:variant.id,sku:variant.sku,newSku:variant.sku}).exec((err,result)=>{
//                 if(err) return console.log('err roi ne',err);
//                 console.log('done')
//               })
//           })
//
//         // })
//       })
//     });
//   },
//
//   update_sku: (req,res)=>{
//     let shop = 'superbowltee.myshopify.com';
//     Shop.findOne({name: shop}).populate('shopifytoken').exec(function(err,findToken){
//       const Shopify = new ShopifyApi({
//         shop: shop,
//         shopify_api_key: apiKey,
//         access_token: 'e5c7e7ea368528a86a8f1a06cd47adbe',
//       });
//       let putData = {
//         "variant": {
//           "sku": "unit-827-ultra_cotton_short_sleeve_tee-black-S",
//         }
//       }
//       Shopify.put('/admin/variants/36187446354.json',putData, function(err,data){
//         return res.json(data);
//       })
//     });
//   },
//
//   get_shipment_id:(req,res)=>{
//     let { id } = req.allParams();
//     console.log(id);
//     api.Shipment.retrieve(id).then((result)=>{
//       res.json(result)
//     });
//
//   },
//   get_address_id:(req,res)=>{
//
//     console.log('get shipment');
//     let { id } = req.allParams();
//     console.log(id);
//     api.Address.retrieve(id).then((result)=>{
//       res.json(result)
//     });
//   },
//
//   getProduct:async(req,res)=>{
//     let foundShop = await Shop.find();
//     return res.view('test/get_product',{foundShop})
//   },
//
//   shopifyGet:async(req,res)=>{
//
//     let {get,shop,productid,variantid,imageid,detail} = req.allParams();
//     console.log('params', req.allParams());
//     // detail: variants,images
//
//     let getAllProduct = '/admin/products.json';
//     let getProduct = `/admin/products/${productid}.json`;
//     let getDetail = `/admin/products/${productid}/${detail}.json`;
//     let getVariant = `/admin/variants/${variantid}.json`;
//     let getImage = `/admin/products/${productid}/images/${imageid}.json`
//
//     Shop.findOne({name: shop}).populate('shopifytoken').exec(function(err,findToken){
//       const Shopify = new ShopifyApi({
//         shop: shop,
//         shopify_api_key: apiKey,
//         access_token: findToken.shopifytoken[0].accessToken,
//       });
//
//       Shopify.get(getProduct, function(err,data){
//         if(err) return res.json(err);
//         return res.json(data);
//       })
//     });
//   },
//
//   putImage:(req,res)=>{
//     let shop = 'iteefun.myshopify.com';
//     Shop.findOne({name: shop}).populate('shopifytoken').exec(function(err,findToken){
//       const Shopify = new ShopifyApi({
//         shop: shop,
//         shopify_api_key: apiKey,
//         access_token: findToken.shopifytoken[0].accessToken,
//       });
//
//       let updateImage = {
//         "image": {
//           "id": 19768992267,
//           "variant_ids": [
//             32887875403,
//             32887875467,
//             32887875531,
//             32887875595,
//             32887875659,
//             32887875723,
//             32887875787,
//             32887875851
//           ]
//         }
//       }
//       Shopify.put(`/admin/products/9188804747/images/19768992267.json`, updateImage, function(err,data){
//         if(err) return res.json(err);
//         return res.json(data);
//       })
//     });
//
//
//   },
//   postImg:(req,res)=>{
//     let shop = 'iteefun.myshopify.com';
//     Shop.findOne({name: shop}).populate('shopifytoken').exec(function(err,findToken){
//       const Shopify = new ShopifyApi({
//         shop: shop,
//         shopify_api_key: apiKey,
//         access_token: findToken.shopifytoken[0].accessToken,
//       });
//
//       let postImage = {
//         "image": {
//           "src": "https://cdn.shopify.com/s/files/1/1764/3031/products/product_dac78639-f6e3-40a8-b634-f16ac78891a1_1400x1400.png"
//         }
//       }
//       Shopify.post(`/admin/products/9188804747/images.json`, postImage, function(err,data){
//         if(err) return res.json(err);
//         return res.json(data);
//       })
//     });
//
//
//   },
//
//   // download:(req,res)=>{
//   //
//   //   console.log('go here');
//   //   let zip = new JSZip();
//   //
//   //   zip.file("Hello.txt", "Hello Khanh\n");
//   //   let img = zip.folder("images");
//   //
//   //   console.log('zip', zip);
//   //   zip.generateAsync({type:"nodebuffer"})
//   //      .then(function(content) {
//   //        // see FileSaver.js
//   //        FileSaver.saveAs(content, "example.zip");
//   //      });
//   //
//   // },
//
//   view: async(req,res) => {
//       res.view('test/view')
//   },
//
//
//
//
// };
