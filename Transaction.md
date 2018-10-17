Order action type: [
  'create',
  'cancel', // status: pending

  'update', // status: pending

  //'order_action': 32323,
  //
  'collect' //status: pending
  'pay', // status: awaiting-fulfillment

  'refund' // status: paid

  // bat dau status dua vao fullfil



  'fulfill', // status: paid ,production, print... ship

]

// status
Order.status = {
  create: 'pending',//Pending
  cancel: 'cancelled', //Cancelled
  collect: 'awaiting-fulfillment' //Awaiting-Fulfillment
  pay: 'paid', //In-Production
  fulfill: 'fulfilled',//Fulfilled
  refund: 'refunded'//Refunded

}

Transaction.status = {
  // create: 'Created',//Pending
  create: 'Pending' //Awaiting-Fulfillment
  cancel: 'Cancelled', //Cancelled
  pay: 'Paid', //In-Production
  // fulfill: 'Paid',//Fulfilled
  refund: 'Refunded'//Refunded
}

TransactionAction = {
  id: 'integer',
  type: 'string',
  data: 'json',
  owner: 'model user',
  transactionId: 'integer'
}
