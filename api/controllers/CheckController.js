/**
 * CheckController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

const { apiKey, apiSecret } = sails.config.shopify;

module.exports = {
  index:(req,res)=>{
    res.view('check/index')
  },

  getOrder: async(req,res)=>{
    let { id = '4204416203', shop = 'iteefun.myshopify.com', vendor = 'Gearment' } = req.allParams()
    let findToken = await Promise.resolve(Shop.findOne({ name: shop }).populate('shopifytoken'));

    let shopifyAuth = {
      shop: shop,
      shopify_api_key: apiKey,
      access_token: findToken.shopifytoken[0].accessToken,
    };
    const Shopify = new ShopifyApi(shopifyAuth);

    await Shopify.get(`/admin/orders.json?since_id=${id}`, (error, data) => {
      _.each(data.orders, (item) => {
        item.line_items = item.line_items.map((line_item) => {
          if(vendor){
            line_item.vendor = vendor;
          }
          return line_item;
        })
        // Order must have a shop data
        item.shop = shop;
        WebHook.pushOrder(item);
      })
      res.json(data);
    });
  },


  orderId: async (req, res) => {
    let { id, shop } = req.allParams();

    Shop.findOne({name: shop}).populate('shopifytoken').exec(async(err,findToken)=>{
      const Shopify = new ShopifyApi({
        shop: shop,
        shopify_api_key: apiKey,
        access_token: findToken.shopifytoken[0].accessToken,
      });
      let findOrderId = await Order.findOne({select:['orderid'],order_name:'#'+id,shop:shop})
      Shopify.get(`/admin/orders/${findOrderId}.json`, function(err,orderData){
        res.json(orderData);
      })
    });
  },
};

