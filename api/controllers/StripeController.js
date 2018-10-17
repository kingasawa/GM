var stripe = require("stripe")(
  "sk_test_dJQeTUQCUca6RfghBYMnzaAA"
);

// amount: 400,
//   currency: "usd",
//   card: {
//   number: '4242424242424242',
//     exp_month: 12,
//     exp_year: 2018,
//     cvc: '123'
// },
// description: "Charge for test@example.com"

module.exports = {
  balance: (req,res) => {
    let {amount,number,exp_month,exp_year,cvc} = req.allParams();
    let session_id = req.signedCookies['sails.sid'];
    console.log('add balance');
    stripe.charges.create({
      amount: amount*100, currency: "usd",
      card: {number, exp_month, exp_year, cvc},
      description: `Charge for ${req.session.user.email}`
    }).then(async (charge) => {
      console.log("Charge created");
      let foundUser = await Promise.resolve(User.findOne({id:req.session.user.id}));
      let newBalance = parseFloat(foundUser.balance + parseFloat(amount));
      await Promise.resolve(User.update({id:req.session.user.id},{balance:newBalance}));
      Payment.create({type:'add-balance',
        description:'add '+amount+' to balance',
        owner: req.session.user.id,
        detail: charge,
        status: 'stripe'
      }).exec(function(err){
        if(err) return res.negotiate(err);
        sails.sockets.broadcast(session_id,'stripe/balance')
      });
    }, function(err) {
      console.log(err);
    });
  }
}
