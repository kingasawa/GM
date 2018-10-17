/**
 * ShopifyController
 *
 * @description :: Server-side logic for managing Shopifies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const { apiKey, apiSecret } = sails.config.shopify;
// var apiKey = 'ae22432ff4d89ca146649cc782f385f1';
// var apiSecret =  '3573364f9e3da3faa1ee8cb02d1ee017';

  //shopify app dev
// var apiKey = '5be0da665e61116428d9fc135b5d452a';
// var apiSecret =  '061120df23906afe20fd899e78147857';

module.exports = {
	index: (req,res) => {

	  let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    // sails.sockets.join(req,session_id);
    Shop.findOne({name:params.shopifyname+'.myshopify.com'}).exec(function(err,foundShop){
      if (!foundShop) {
        var Shopify = new ShopifyApi({
          shop: params.shopifyname,
          shopify_api_key: apiKey,
          shopify_shared_secret: apiSecret,
          shopify_scope: 'write_products,read_orders,read_customers,write_customers,read_orders,write_orders,read_shipping,write_shipping,read_analytics',
          redirect_uri: 'https://beta.gearment.com/shopify/sync_callback',
          nonce: params.uid // you must provide a randomly selected value unique for each authorization request
        });
        res.redirect(Shopify.buildAuthURL());
      } else {
        sails.sockets.broadcast(session_id,'shop/exist',{msg:'shop exist'});
        res.json('exist');
      }
    });
  },

  sync_callback: (req,res) => {
    let params = req.allParams();
    let sessionId = req.signedCookies['sails.sid'];

    var Shopify = new ShopifyApi({
      shop: params.shop,
      shopify_api_key: apiKey,
      shopify_shared_secret: apiSecret,
    });
    var postData = {
      client_id:apiKey,
      client_secret:apiSecret,
      code:params.code
    };


    Shopify.post('/admin/oauth/access_token', postData, (err,data) => {
      if(err) {
        return sails.log.error({
          controller: 'shopify',
          action: 'sync_callback',
          error: err,
          sessionId
        })
      }

      let createShopParams = {name:params.shop,owner:params.state};

      sails.log.debug({
        controller: 'shopify',
        action: 'sync_callback',
        params: postData,
        data: data,
        createShopParams,
        sessionId
      })

      Shop.create(createShopParams).exec((err,createShop) => {

        let createData = {
          accessToken:data.access_token,
          scope:data.scope,
          shop:createShop.id
        }

        ShopifyToken.create(createData).exec((err,result)=> {
          if(err) {
            return sails.log.error({
              controller:'shopify',
              action:'ShopifyToken.create',
              error: err,
              params: createData,
              sessionId
            })
          }
          var Shopify = new ShopifyApi({
            shop: params.shop,
            shopify_api_key: apiKey,
            access_token: data.access_token
          });

          var orderCreateHook = {
            webhook: {
              "topic": "orders\/create",
              "address": "https:\/\/beta.gearment.com\/notification\/order?act=create&shop="+params.shop, // Update new address when public
              "format": "json"
            }
          };
          Shopify.post('/admin/webhooks.json',orderCreateHook, (err,orderCreate) => {
            if(err){
              return sails.log.error({
                controller:'shopify',
                action:'/admin/webhooks.json',
                error: err,
                params: orderCreateHook,
                sessionId
              })
            }

          });


          var orderUpdateHook = {
            webhook: {
              "topic": "orders\/updated",
              "address": "https:\/\/beta.gearment.com\/notification\/order?act=updated&shop="+params.shop, // Update new address when public
              "format": "json"
            }
          };
          Shopify.post('/admin/webhooks.json',orderUpdateHook, (err,orderUpdate) => {
            if(err){
              return sails.log.error({
                controller:'shopify',
                action:'/admin/webhooks.json',
                error: err,
                params: orderUpdateHook,
                sessionId
              })
            }
          });

          var appUninstallHook = {
            webhook: {
              "topic": "app\/uninstalled",
              "address": "https:\/\/beta.gearment.com\/notification\/app?act=uninstalled&shop="+params.shop, // Update new address when public
              "format": "json"
            }
          };
          Shopify.post('/admin/webhooks.json',appUninstallHook, (err,appUninstall) => {
            if(err){
              return sails.log.error({
                controller:'shopify',
                action:'/admin/webhooks.json',
                error: err,
                params: orderUpdateHook,
                sessionId
              })
            }
          });

          sails.log.debug({
            controller: 'shopify',
            action:'create_webhook',
            message: 'success',
            data: result,
            sessionId
          })

          res.redirect('/scp/store');
        });
      });
    });
  },

  product: async (req,res) => {
	  let params = req.allParams();
	  let findToken = await Promise.resolve(Shop.findOne({name:params.name}).populate('shopifytoken'));

    var Shopify = new ShopifyApi({
      shop: params.name,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });

    if (params.action == 'edit') {
      Shopify.get('/admin/products/'+params.id+'.json?fields=id,images,title,body_html,vendor,handle,tags', function(err, data){
        if(err) {
          return res.json(err);
        }
        // res.json(data);
        data.name = params.name;
        return res.view('scp/store/edit-product',{data});
        // res.json(data);
      });
    }
    else if (params.action == 'update') {
      let updateData = {
        "product": {
          "id": params.id,
          "title": params.title,
          "body_html": params.body_html,
          "vendor": params.vendor,
          "handle": params.handle,
          "tags": params.tags,
        }
      };
      Shopify.put('/admin/products/'+params.id+'.json',updateData, function(err, data){
        if(err) {
          return res.json(err);
        }
        data.name = params.name;
        return res.redirect('/scp/store?name='+params.name+'&id='+params.id);
        // res.json(data);
      });
    }

  },

  view: async (req,res) => {
    let shop = 'superbowltee.myshopify.com';
    let findToken = await Promise.resolve(Shop.findOne({name:shop}).populate('shopifytoken'));
    var Shopify = new ShopifyApi({
      shop:shop ,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });

    Shopify.get('/admin/products/9004323410.json',function(err,data){
      if(err) return res.json(err);

      return res.json(data);
    });
  },

  aloha: (req,res) => {
    let params = req.allParams();
    console.log(params);
  },

  custom:async(req,res)=> {
    let session_id = req.signedCookies['sails.sid'];
    // sails.sockets.join(req,session_id);
	  let params = req.allParams();
	  console.log(params);
    let findToken = await Promise.resolve(Shop.findOne({name: params.shop}).populate('shopifytoken'));
    var Shopify = new ShopifyApi({
      shop: params.shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    });
    Shopify.get('/admin/custom_collections.json',function(err,data){
      sails.sockets.broadcast(session_id,'load/collection',{msg:data,pid:params.pid})
    })
  },
  update_address: (req,res)=>{
    let session_id = req.signedCookies['sails.sid'];
    let params = req.allParams();
    console.log('params update address')
    let updateData = {
      "order": {
        "id": params.orderid,
        "shipping_address": {
          "name": params.first_name+' '+params.last_name,
          "address1": params.address1,
          "address2": params.address2,
          "city": params.city,
          "zip": params.zip,
          "province": params.province,
          "country": params.country,
          "phone": params.phone
        }
      }
    }

    let shop = params.shop;
    Shop.findOne({name: shop}).populate('shopifytoken').exec((err,findToken)=>{
      const Shopify = new ShopifyApi({
        shop: shop,
        shopify_api_key: apiKey,
        access_token: findToken.shopifytoken[0].accessToken,
      });
      Shopify.put('/admin/orders/'+params.orderid+'.json',updateData,(err,data)=>{
        if(err) {
          res.json({result:'false',msg:err.error.shipping_address[0]})
          return false
        }
        // return res.json(data);
        Order.update({orderid:params.orderid},{shipping_address:data.order.shipping_address}).exec((err,resultUpdate)=>{
          if(err) console.log(err);
          let createData = {
            orderid:params.id,
            type: 'edit_address',
            data: {newValue:updateData.order.shipping_address,msg:'Shipping address updated'},
            owner: req.user.id
          }
          OrderAction.create(createData).exec((err,result)=>{
            if(err) return false;
            return res.json({result:'true'});
          })

        })
      })
    });

  },

  update_email: (req,res)=>{
    let { currentEmail, id, orderid, newEmail, shop } = req.allParams();
    let updateData = {
      "order": {
        "id": orderid,
        "email": newEmail
      }
    }
    Shop.findOne({name: shop}).populate('shopifytoken').exec((err,findToken)=>{
      const Shopify = new ShopifyApi({
        shop: shop,
        shopify_api_key: apiKey,
        access_token: findToken.shopifytoken[0].accessToken,
      });
      Shopify.put(`/admin/orders/${orderid}.json`,updateData, (err,data)=>{
        if(err) {
          console.log('err',err);
          return res.json({result:'false'})
        }
        Order.update({orderid:orderid},{email:data.order.email}).then((resultUpdate)=>{
          let createData = {
            orderid: id,
            type: 'edit_email',
            data: {currentEmail,newEmail,msg:'Email updated'},
            owner: req.user.id
          };
          OrderAction.create(createData).then((result)=>{
            return res.json({result:'true'})
          })
        }).catch((err)=>{
          console.log(err);
          return false;
        })
      })
    });

  },

};

