var forEach = require('async-foreach').forEach;
const { shopifyVendor } = sails.config.shopify;
const { apiKey, apiSecret } = sails.config.shopify;
import bluebird from 'bluebird';

const { DEFAULT_SHIPPING_FEE, DEFAULT_BASE_COST } = sails.config.report;

/*

 update product set color =  TRIM(BOTH FROM color)
 update product set color = 'White' where color = 'Whtie'

 */
module.exports = {

  order_status: async (req,res)=> {
    // let user_id = req.user.id;
    let totalOrders = await Order.find({}); // get all orders

    let orderNewItems = {}; // main data obj

    forEach(totalOrders, (order, index) => {
      let { line_items, id, order_id } = order;
      orderNewItems[id] = [];
      forEach(line_items, (item) => {
        let { sku, vendor,  } = item;
        let refactorItem = item;
        if(sku.match(/^unit/) !== null){
          refactorItem.vendor = shopifyVendor;
        }else if(sku === '' && vendor === ''){
          refactorItem.vendor = shopifyVendor;
        }else if(sku === '' && vendor.indexOf('gearment') > -1){
          refactorItem.vendor = shopifyVendor;
        }

        orderNewItems[id].push(refactorItem);
      })
    })

    _.each(orderNewItems, (orderNewItem, key) => {
        console.log('orderNewItem key', key);
        console.log('orderNewItem', orderNewItem);
      Promise.resolve(Order.update({id: key}, { line_items:  orderNewItem}))
    })

    res.json({msg: 'Update all order items to Gearment vendor'});
  },

  // update_order:async(req,res)=>{
  //   //find all order sync = 1 of seller
  //   let params = req.allParams();
  //   let shop = params.shop;
  //   let orderArray = await Promise.resolve(Order.find({select:['orderid'],shop:shop,sync:1}));
  //   let findToken = await Promise.resolve(Shop.findOne({name: shop}).populate('shopifytoken'));
  //   let Shopify = new ShopifyApi({
  //     shop: shop,
  //     shopify_api_key: apiKey,
  //     access_token: findToken.shopifytoken[0].accessToken,
  //   });
  //
  //   _.each(orderArray,(order)=>{
  //     let id = order.orderid;
  //     // console.log('id',id);
  //     Shopify.get('/admin/orders/'+id+'.json', (err,data)=>{
  //       if(!err){
  //         Order.update({orderid:id},{order_name:data.order.name}).exec((err,result)=>{
  //           if(err) console.log(err)
  //         })
  //       }
  //     })
  //   })
  // },

  //update material type to snakeCase
  updateMaterialType: async(req,res)=>{
    let findMaterial = await Promise.resolve(Material.find());
    _.each(findMaterial,(material)=>{
      let materialType = _.snakeCase(material.name);
      Material.update({name:material.name},{type:materialType}).exec((err)=>{
        if(err) return console.log(err)
      })
    })
  },

  updateNumbericDesign: async(req,res)=>{
    let CampaignData = await Promise.resolve(Campaign.find({select:['designID']}));
    _.each(CampaignData,async(design)=>{
      let designID = design.designID;
      let findDesign = await Promise.resolve(Design.findOne({select:['design_id'],id:designID}));
      // console.log(findDesign);
      Campaign.update({designID:designID},{numbericDesignId:findDesign.design_id}).exec((err)=>{
        if(err) return console.log(err);
      })
      // Material.update({name:material.name},{type:materialType}).exec((err)=>{
      //   if(err) return console.log(err)
      // })
    })
  },

  /*
  * Sync Product item color + size with options + update id to material populate size & color
  * */
  syncColor: async(req,res)=>{
    let { id } = req.allParams();
    let result = Product.syncOptions({});
    res.json(result);
  },

  /* update product tradegecko_id to each line_items */
  updateOrderTradeGecko: async(req,res) => {
    bluebird.promisifyAll(Order);
    const productDataKeyById = await Product.getProductKey();
    let query = `select * from public.order`;
    let queryResult = await Order.queryAsync(query);
    let result = queryResult.rows;

    result.map((order)=> {
      let { line_items, id } = order;
      let new_line_items = []
      line_items.map(item => {
        let gearmentSKU = Report.getGearmentSKU(item.sku, item.vendor);
        let new_item = {};
        if(gearmentSKU){
          let {
            skuType, // new, old, veryOld
            campaignId, variantColor, variantSize, variantNameType, materialId, designId, mockupId, sizeId, frontSide, //New Sku with Vendor
            productId, data
          } = gearmentSKU;

          let productData = _.get(productDataKeyById, productId, null)
          if(productData){
            console.log('productData', productData);
            let { tradegecko_id } = productData;
            if(tradegecko_id){
              new_item.tradegecko_id = tradegecko_id;
              console.log('tradegecko_id', tradegecko_id);
              console.log('--------------');
            }
          }
        }

        new_line_items.push({
          ...new_item,
          ...item
        })
      })

      // console.log('line_items', line_items);
      Order.update(id, {
        line_items: new_line_items
      }).exec((err, ok) => {
        if(err){
          return console.log('Order update err', err);
        }
        console.log('Order update ok');
      })

    })
  },


};
