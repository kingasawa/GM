/**
 * PaymentController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

//paypal-adaptive
const PaypalAP = require('paypal-adaptive');
//
// var paypalSdk = new PaypalAP({
//   userId:    'payment-facilitator_api1.gearment.com',
//   password:  'DN627Q6WFGEGH2UG',
//   signature: 'AFcWxV21C7fd0v3bYYYRCpSSRl31A3M5lcsdkFiTXwP7BGDo2wtkWRVq',
//   sandbox:   true, //defaults to false
//   appId: 'APP-80W284485P519543T'
// });

let paypalSdk = new PaypalAP({
  userId:    'payment_api1.gearment.com',
  password:  'NE8Q3RWWA6BL4D5S',
  signature: 'AFcWxV21C7fd0v3bYYYRCpSSRl31AENI5J7avTk.3ALRUTVfpI2VpUdA',
  appId:     'APP-7B926018AK193452B'
});

// var paypalSdk = new PaypalAP({
//   userId:    'trancatkhanh-facilitator_api1.gmail.com',
//   password:  'RM36ZR9Y8U4F26CU',
//   signature: 'AFcWxV21C7fd0v3bYYYRCpSSRl31AFnTl-Bo2ILpGym1mvz9McrgkOm7',
//   sandbox:   true //defaults to false
// });

module.exports = {
  view: async(req, res) => {
    let params = req.allParams();

    let foundPayment = await Promise.resolve(Payment.findOne({id: params.id}));
    if (!foundPayment) {
      return res.negotiate(err)
    }

    if (foundPayment.type == 'pay-to-print') {

      /** Kieu nay la` cho` - await - khi do user fai doi. xu ly het roi moi thay cai response view */

      for (let value of foundPayment.detail.items) {
        if (value.sku.match('unit') !== null) {
          let materialData  = await Promise.resolve(Material.findOne({name:value.mockup}).populate('size').populate('image'));
          let sizeArray = materialData.size[0].size;
          let result = sizeArray.find(item => item.size === value.size);
          let { price } = result;
          value.basecost = price;

          let foundDesign = await Promise.resolve(Campaign.findOne({ select: ['designID'], where: { id: value.campaignID } }));
          value.design = foundDesign;
        }

      }
      // res.json(foundPayment);
      return res.view('scp/payment/view',{foundPayment});
      /** -------------------------- */
    } else {
      res.json({foundPayment});
    }
  },

  // pay_to_print: async(req,res) => {
  //   let params = req.allParams();
  //   let session_id = req.signedCookies['sails.sid'];
  //   let foundBalance = await Promise.resolve(User.findOne({select:['balance'],id:params.ownerID}));
  //   //check balance
  //   if(foundBalance.balance < parseFloat(params.totalPaid)){
  //     sails.sockets.broadcast(session_id,'check/balance/false',{balance:foundBalance.balance})
  //   } else {
  //     let newBalance = foundBalance.balance - parseFloat(params.totalPaid);
  //     await Promise.resolve(Order.update({id:params.orderID},{tracking:'In-Production'}));
  //     await Promise.resolve(User.update({id:params.ownerID},{balance:newBalance}));
  //
  //     sails.sockets.broadcast(session_id,'check/balance/true',{balance:newBalance})
  //   }
  //
  // },

  create_transaction:  (req,res)=>{
    let params = req.allParams();
    let session_id = req.signedCookies['sails.sid'];

    let result = _.groupBy(params,(item) => item.shopName);

    _.each(result,async(order)=>{
      order = _.reduce(order,(result,value,key)=>{
        result.push(value);
        return result;
      },[]);
      // console.log('result',order)
      let dataOrder = [];
      let totalPaid = 0;
      for(let i=0;i<order.length;i++){
        let orderDetails = {
          id:order[i].order,
          amount:order[i].total_paid
        }
        dataOrder.push(orderDetails);
        totalPaid += order[i].total_paid
      }
      let data = {
        shopName: order[0].shopName,
        order:dataOrder,
        owner:order[0].owner,
        totalPaid:totalPaid
      };

      let approvalKey = await Promise.resolve(Paypal.findOne({owner:data.owner}));

      console.log(data);

      let payload = {
        requestEnvelope: {
          errorLanguage:  'en_US'
        },
        actionType:     'PAY',
        currencyCode:   'USD',
        feesPayer:      'EACHRECEIVER',
        memo:           'Receipt for Your Payment to Gearment',
        preapprovalKey: approvalKey.preapprovalKey,
        cancelUrl:      'http://test.com/cancel',
        returnUrl:      'http://test.com/success',
        receiverList: {
          receiver: [
            {
              email:  'payment@gearment.com',
              // data.totalPaid
              amount: data.totalPaid
            }
          ]
        },
        senderEmail: approvalKey.senderEmail
      };

      paypalSdk.pay(payload, function (err, response) {
        if (err) {
          console.log('response',response);
          sails.sockets.broadcast(session_id,'paypal/charge',{msg:'false',data:response.error[0].message})
        } else {
          _.each(data.order,async(each_order)=>{
            Order.update({id:each_order},{tracking:'In-Production'}).exec((err)=>{
              if(err) console.log(err);
            })
          })
          console.log('done',response);
          let transactionID = response.paymentInfoList.paymentInfo[0].transactionId;
          Transaction.create({shopName:data.shopName,order:data.order,owner:data.owner,transactionID:transactionID,total:data.totalPaid}).exec((err,resultTransaction)=>{
            if(err) return console.log(err);
            sails.sockets.broadcast(session_id,'paypal/charge',{msg:'true',data:transactionID})
            console.log('create transaction',resultTransaction);
          })
        }
      });

    })

  },

};
