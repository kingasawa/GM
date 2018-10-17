/*
 * Must the *Task name for schedule task
 * Document here : https://github.com/node-schedule/node-schedule#cron-style-scheduling.
 * */

module.exports = {

  schedule: '* 59 * * * *',
  task: async function() {
    // Order.update({tracking:'pending',sync:1},{tracking:'Awaiting-Fulfillment'}).exec((err,result)=>{
    //   console.log('update ok',result)
    // })
    let queryOrder = `SELECT id FROM public.order 
    WHERE "tracking" = 'pending' AND "payment_status" is null 
    AND ("financial_status" = 'paid' OR "financial_status" = 'authorized' OR "financial_status" = 'partially_refunded' ) 
    AND "createdAt" between now() - INTERVAL '26 hour' AND  now() - INTERVAL '24 hour'
    GROUP BY date_trunc('hour', "createdAt"), id`;

    let query = `UPDATE public.order SET "tracking" = 'In-Production', 
                  "payment_status" = 'pending', "tag" = 'no-pick' 
                WHERE id in (${queryOrder})`;

    Order.query(query, (err, result) => {
      if(err) return sails.log.error('Task:Update:Order update tracking error',err)
      sails.log.debug('Task:Update:Order Update tracking every hour',result)
    })

    // let queryAllOrderData = `SELECT * FROM public.order WHERE id in (${queryOrder})`;

    // Order.query(queryAllOrderData, async (err, orderData) => {
    //   if(err) return sails.log.error('Task:Update:Order sync TradeGecko error', err )
    //   if(!orderData){
    //     sails.log.debug('Task:Update:Order Sync TradeGecko every hour null orderData')
    //   }
    //   sails.log.debug('Task:Update:Order Sync TradeGecko every hour', orderData)
    //   if(orderData){
    //     orderData.map(async order => {
    //       let { id, createdAt, line_items } = order;
    //       let issued_at = moment(createdAt).format('DD-MM-YYYY');
    //       let order_line_items = []
    //
    //       if(line_items){
    //
    //         await Promise.all(line_items.map(item => {
    //           let { quantity, tradegecko_id: variant_id  } = item;
    //           order_line_items.push({
    //             variant_id,
    //             quantity
    //           });
    //         }))
    //
    //         let createOrder = await TradeGecko.createOrder({
    //           issued_at,
    //           "status": "active",
    //           payment_status: "paid",
    //           order_line_items,
    //           "company_id": 15890479,
    //           "billing_address_id": 19294849,
    //           "shipping_address_id": 19294849,
    //         });
    //
    //         if(createOrder && createOrder.id){
    //           await Order.update({ id }, { tradegecko_id: createOrder.id })
    //           console.log('Sync TradeGecko Order done', id, createOrder.id );
    //         }
    //
    //         // tradegecko_id = createOrder.id
    //       }
    //
    //     })
    //   }
    // })
    // 1. create order "payment_status": "paid"
  }
};
