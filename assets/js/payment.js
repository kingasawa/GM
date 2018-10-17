$(function() {
  $('body').on('click','button.pay-to-print',function(){
    // <div class="se-pre-con"></div>
    $('.se-pre-con').css('display','block');
    let orderID = $(this).parents('div#order-view-page').find('span.orderID').text();
    let ownerID = $(this).parents('div#order-view-page').find('span.userId').text();
    let totalPaid = $(this).parents('div#order-view-page').find('span.total').text();
    // let shippingAddress = $(this).parents('div#order-view-page').find('p.shipping-address').text();
    // let orderItems = [];
    // $(this).parents('div#order-view-page').find('div.orderItem').each(function(){
    //   let itemString = $(this).find('.item-title').text().split(' / ');
    //   let item = {
    //     name: $(this).find('h4.media-heading').text(),
    //     mockup: itemString[0],
    //     color: itemString[1],
    //     size: itemString[2],
    //     image: $(this).find('img').attr('src'),
    //     campaignID: $(this).find('.item-sku').text().split('-')[1],
    //     sku: $(this).find('.item-sku').text().replace('SKU: ','')
    //   };
    //   orderItems.push(item)
    // });
    let postData = {ownerID,orderID,totalPaid};
    socket.post('/payment/pay_to_print',postData);
    console.log('pay to print',postData)
  });

  socket.on('check/balance/false',function(data){
    $('#paytoprintNoticeModal .modal-title').text('False');
    $('#paytoprintNoticeModal .modal-body').text('Your balance: $'+data.balance+', can not pay to print');

    $('.se-pre-con').css('display','none');
    $('#paytoprintNoticeModal').modal();

  })

  socket.on('check/balance/true',function(data) {
    // $('#paytoprintNoticeModal .modal-title').text('Successfull');
    // $('#paytoprintNoticeModal .modal-body').text('This order is now Printing, your current balance is '+data.balance);
    // $('.se-pre-con').css('display','none');
    // $('#paytoprintNoticeModal').modal();
    // $('button.pay-to-print').attr('disabled',true);
    location.reload();
  })

  socket.on('add/payment',function(recieve){
    if(['/scp/order'].includes(window.location.pathname) == false) return false;
    window.location = '/payment/view?id='+recieve.data.id;
  });

  socket.on('view/payment',function(recieve){
    if(['/scp/order'].includes(window.location.pathname) == false) return false;
    window.location = '/payment/view?id='+recieve.data;
  });

  // pay to gearment
  $(document).ready(function(){
    if (['/scp/order','/acp/order'].includes(window.location.pathname) == true && window.location.search.match('id')) {
      let subtotal = 0;
      $('.orderItem').each(function(){
        let basecost = parseFloat($(this).find('span.item-basecost').text());
        let quantity = parseFloat($(this).find('span.item-quantity').text());
        let itemcost = parseFloat(basecost*quantity);
        subtotal = parseFloat(subtotal + itemcost);
        $(this).find('span.item-price').text(parseFloat(itemcost).toFixed(2))
      });
      $('.total-paid span.subtotal').text(parseFloat(subtotal).toFixed(2));
      let shippingfee = parseFloat($('.total-paid span.shippingfee').text());
      let total = parseFloat(subtotal+shippingfee);
      $('.total-paid span.total').text(parseFloat(total).toFixed(2));
      console.log('subtotal',subtotal);
      console.log('shippingfee', shippingfee);
      console.log('total', total);
    }
  });

  $('body').on('click','button.pay-to-gearment',function(){
    let items = [];
    $(this).parents('#payment-view-page').find('.orderItem').each(function(){
      let item = {
        name: $(this).find('h4.media-heading').text(),
        mockup: $(this).find('span.item-mockup').text(),
        color: $(this).find('span.item-color').text().replace('Color: ',''),
        size: $(this).find('span.item-size').text().replace('Size: ',''),
        image: $(this).find('img').attr('src'),
        basecost: $(this).find('span.item-basecost').text().replace('Base cost: $',''),
        design: $(this).find('span.item-design').text(),
      };
      items.push(item);
    });
    let paymentId = window.location.search.replace('?id=','');
    let subtotal = $(this).parents('#payment-view-page').find('p.subtotal span').text();
    let shippingfee = $(this).parents('#payment-view-page').find('p.payment-shipping span').text();
    let total = $(this).parents('#payment-view-page').find('p.payment-total span').text();
    let address = $(this).parents('#payment-view-page').find('address p').text();
    let postData = {items,subtotal,shippingfee,total,address};
    socket.get('/tracking/create?paymentid='+paymentId,postData);
    // console.log(postData);
  });

  socket.on('tracking/balance-no',function(recieve){
    console.log('pay error');
    $('#payErrorModal .error-content').text(recieve.msg);
    $('#payErrorModal').modal();
  });

  socket.on('tracking/create',function(recieve){
    console.log('pay success');
    $('button.pay-to-gearment').attr('disabled',true);
    $('#paySuccessModal .success-content').text(recieve.msg);
    $('#paySuccessModal').modal();
  });

  //lam cho Ton xai do thoi , mot xoa di
  $('#tracking-order-page select#status').on('change',function(){
    let updateData = {
      status: $(this).val(),
      sku: $(this).parents('#order-item').find('span.item-sku').text(),
      order: $(this).parents('#order-item').find('span.orderid').text(),
      variant: $(this).parents('#order-item').find('span.item-id').text().replace('ID: ','')
    };
    // console.log(updateData);
    socket.get('/tracking/update_order',updateData);
  });

  /** Add Balance */
  $('form#add-balance').on('submit',function(e){

    e.preventDefault();
    let type = $(this).find('label.radio-inline input:checked').val();
    let value = $(this).find('select[name=balance]').val();
    let addData = { value };
    if (type=='paypal') {
      $('div.se-pre-con').css('display','block');
      socket.get('/paypal/balance',addData)
    } else if(type=='creditcard'){
      // socket.get('/stripe/balance',addData)
      $('#enterCreditcardModal').modal();
      $('#enterCreditcardModal form #amount').val(value)
    }

  });

  $('#enterCreditcardModal form').on('submit',function(a){

    a.preventDefault();
    let postData = $('#enterCreditcardModal form').serialize();
    console.log(postData);
    socket.post('/stripe/balance?'+postData);
    $('#enterCreditcardModal').modal('hide');
    $('div.se-pre-con').css('display','block');
  });

  socket.on('stripe/balance',function(){
    location.reload();
  });

  socket.on('add/balance',function(data){
    window.location = data.msg;
  });

  socket.on('paypal/charge',function(recieve){
    console.log("recieve notify");
    if(recieve.msg == "true"){
      $('div.auto-charge-notify').append(`<strong>Success!</strong> Create Transaction ID : <a href="/payment/transaction?id=${recieve.data}">${recieve.data}</a>`)
      $('div.auto-charge-notify').addClass('in alert-success').removeClass('hide');
      $('tr.order-picked').find('input').prop('checked',false).attr('disabled',true);
      $('tr.order-picked').find('td.order-financial_status span').text('In-Production')
    } else {
      $('div.auto-charge-notify').append(`<strong>False!</strong> ${recieve.data}`)
      $('div.auto-charge-notify').addClass('in alert-warning').removeClass('hide')
    }
  })

});
