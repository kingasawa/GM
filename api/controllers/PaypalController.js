/**
 * PaypalController
 *
 * @description :: Server-side logic for managing aboutuses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

//paypal-adaptive
const PaypalAP = require('paypal-adaptive');
// //
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
  sandbox:   false,
  appId:     'APP-7B926018AK193452B'
});


let paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'live', //sandbox or live
  'client_id': 'AX3heXxYc4YhOjm8_55a_0iuj3VuEIC7XmidVd483WlIkDdy5igK9IqKy151c0AE6FYYKII5kgP_6HzL',
  'client_secret': 'EAZiKAKPGpzfjPnzZ7J_thpDR6KSPsnEU8Ku_Ny2z-NtNHTNGVVXaTLvMeQMhISVMTWL3cv3qZt_y0a0',
});

// paypal.configure({
//   'mode': 'sandbox', //sandbox or live
//   'client_id': 'ATyTjOEXX-Hagf9aE1wpeHgTZI92xIRIpUtj1wazEkM24hrkv3XGTxJ3hXkcGo4cDz7aPl26imF7IBXl',
//   'client_secret': 'ECEHhrXk8nukf2vp1x_oRPQYskT0fxCryzJ4Uqw1rsWbLFMw2OcMOTzMbyTOQOTjh08pJzgScW4f21iN',
// });

module.exports = {
  balance: (req, res) => {
    let {value} = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    console.log(value);

      let create_payment_json = {
        "intent": "sale",
        "payer": {
          "payment_method": "paypal"
        },
        "redirect_urls": {
          "return_url": "https://dev.gearment.com/paypal/return?sellerID="+req.session.user.id,
          "cancel_url": "https://dev.gearment.com/paypal/cancel"
        },
        "transactions": [{
          "item_list": {
            "items": [{
              "name": "add balance",
              "sku": "balance"+value,
              "price": value,
              "currency": "USD",
              "quantity": 1
            }]
          },
          "amount": {
            "currency": "USD",
            "total": value
          },
          "description": "seller "+req.session.user.name+' add '+value+' to balance'
        }]
      };
      paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
          throw error;
        } else {
          console.log("Create Payment Response");
          sails.sockets.broadcast(session_id,'add/balance',{msg:payment.links[1].href});
        }
      });

  },

  return: (req,res) => {
    let params = req.allParams();
    let execute_payment_json = {
      "payer_id": params.PayerID,
    };

    let paymentId = params.paymentId;

    paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
      if (error) {
        console.log(error.response);
        throw error;
      } else {
        let foundUser = await Promise.resolve(User.findOne({id:params.sellerID}));
        let newBalance = parseFloat(foundUser.balance + parseFloat(payment.transactions[0].amount.total));
        await Promise.resolve(User.update({id:params.sellerID},{balance:newBalance}));
        Payment.create({type:'add-balance',
          description:'add '+payment.transactions[0].amount.total+' to balance',
          owner: params.sellerID,
          detail: payment,
          status: 'paypal'
        }).exec(function(err){
          if(err) return res.negotiate(err);
        res.redirect('/scp/billing')
        });
      }
    });
  },

  preapproval:(req,res)=>{
    let payload = {
      currencyCode:                   'USD',
      startingDate:                   new Date().toISOString(),
      endingDate:                     '2018-06-23T04:08:45.986Z',
      returnUrl:                      'https://dev.gearment.com/paypal/pre_return?owner='+req.user.id,
      cancelUrl:                      'https://dev.gearment.com/paypal/pre_cancel?owner='+req.user.id,
      ipnNotificationUrl:             'https://dev.gearment.com/paypal/pre_notify?owner='+req.user.id,
      requestEnvelope: {
        errorLanguage:  'en_US'
      },
      maxTotalAmountOfAllPayments:    1000,
    }
    paypalSdk.preapproval(payload, function (err, response) {
      // console.log('preapproval payload', payload);
      if (err) {
        console.log('preapproval err', err);
        console.log('response',response)
      } else {

        console.log('preapproval res', response);
        sails.sockets.join(req,response.preapprovalKey);
        res.redirect(response.preapprovalUrl);

      }
    });
  },

  removePreapproval: async(req,res)=> {
    let foundPaypal = await Promise.resolve(Paypal.findOne({owner:req.user.id}))
    let payload = {
      requestEnvelope: {
        errorLanguage:  'en_US'
      },
      preapprovalKey: foundPaypal.preapprovalKey,
    };

    paypalSdk.cancelPreapproval(payload, function(err,response){
      if(err) console.log(err);
      console.log('remove',response);

    });
  },


  pre_notify: async(req,res)=> {
    console.log('pre_notify params',req.allParams())
    let params = req.allParams();
    let foundOwner = await Promise.resolve(Paypal.findOne({owner:params.owner}));

    if (!foundOwner && params.transaction_type == 'Adaptive Payment PREAPPROVAL' && params.status == 'ACTIVE') {
      Paypal.create({
        preapprovalKey:params.preapproval_key,
        senderEmail:params.sender_email,
        // accountId:params.sender.accountId,
        status: params.status,
        owner: params.owner
      }).exec((err,createAccount)=>{
        console.log('create',createAccount);
        sails.sockets.broadcast(params.owner,'notify/preapproval',{msg:'approve-preapproval'})
      })
    } else if (params.transaction_type == 'Adaptive Payment PREAPPROVAL' && params.status == 'CANCELED') {
      Paypal.destroy({preapprovalKey:params.preapproval_key}).exec((err,deleteAccount)=>{
        console.log('destroy',deleteAccount);
        sails.sockets.broadcast(params.owner,'notify/preapproval',{msg:'cancel-preapproval'})
      })
    } else {console.log('duplicate notify')}

    res.send(200);
  },

  pre_return: (req,res)=> {
    let params = req.allParams();
    console.log(params);
    res.view('close');
  },

  pre_cancel: (req,res)=> {
    let params = req.allParams();
    sails.sockets.broadcast(params.owner,'notify/preapproval',{msg:'cancel-preapproval'});
    res.view('close')
  }

};

