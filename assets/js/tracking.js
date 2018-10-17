$(function(){
  //pick up - all orders
  $('#order-page input.choose-all-order').on('click',function(){
    if(this.checked) {
      console.log('select all')

      $(this).parents('table#acp-order-table').find('input.choose-order-id:checkbox').each(function(){
        $(this).parents('tr.each-tr-order').addClass('order-picked');
        this.checked = true
      })
    } else {
      console.log('select none')

      $(this).parents('table#acp-order-table').find(':checkbox').each(function(){
        $(this).parents('tr.each-tr-order').removeClass('order-picked');
        this.checked = false
      })
    }
    let countChecked = $('#order-page input.choose-order-id:checked').length;
    $('button.count-pickup span.update-val').text(countChecked);
    if(countChecked < 1) {$('.show-count-pickup').fadeOut('slow')}
    else {$('.show-count-pickup').fadeIn('slow') }
  });

  let data = [
    {
      shop: 'superbowl',
      order: ['1','2','3']
    },

    {
      shop: 'pirda',
      order: ['1']
    }
  ];

  //pick up - 1 order
  $('body').on('click','#order-page input.choose-order-id',function(){
    let checked = parseInt($('button.count-pickup span.update-val').text());
    if (this.checked) {
      $('button.count-pickup span.update-val').text(checked+1)
      $(this).parents('tr.each-tr-order').addClass('order-picked');
    } else {
      $(this).parents('tr.each-tr-order').removeClass('order-picked');
      $('button.count-pickup span.update-val').text(checked-1)
    }
    let countChecked = $('#order-page input.choose-order-id:checked').length;
    if(countChecked < 1) {$('.show-count-pickup').fadeOut('slow');}
    else {$('.show-count-pickup').fadeIn('slow') }
  });

  //click to charge-money button
  $('body').on('click','a.charge-money',function(){
    // $('div.se-pre-con').css('display','block');
    let dataPost = [];
    $('table#acp-order-table tbody tr.order-picked').each(function(){
      let shop = $(this).find('td.order-shop').text();
      let orderid = $(this).find('td.order-id').text().slice('1');
      let orderowner = $(this).find('td.order-owner').text();
      let orderpaid = parseFloat($(this).find('td.order-paid').text());
      let post = {
        shopName:shop,
        order:orderid,
        owner:orderowner,
        total_paid:orderpaid
      }
      dataPost.push(post)
    });
    console.log('data post',dataPost);
    socket.post('/payment/create_transaction',dataPost);

  });

  //Fulfilment
  $('form#submit-tracking').on('submit',function(e){
    $('div.se-pre-con').css('display','block');
    e.preventDefault();

    let postData = {
      shop: $(this).find('input[name=tracking-shop]').val(),
      orderId: $(this).find('input[name=tracking-order]').val(),
      trackingId: $(this).find('input[name=tracking-id]').val(),
      company: $(this).find('select[name=tracking-company]').val()
    };
    let items = [];
    $(this).parents('#order-items').find('div.trackingItem').each(function(){
      let itemId = {
        id: $(this).find('span.itemID').text()
      };
      items.push(itemId)
    });
    postData.items = items;
    // console.log(postData);
    socket.post('/tracking/fulfill',postData)
  });

  //Fulfill items button
  $('button.fulfill-items').on('click',function(){
    $('div.se-pre-con').css('display','block');

    let postData = {
      shop: $(this).parents('#order-detail-section').find('span.order-shop-name').text(),
      orderId: $(this).parents('#order-detail-section').find('span.order-id').text(),
      trackingId: $(this).parents('#order-detail-section').find('input[name=tracking-number]').val(),
      company: $(this).parents('#order-detail-section').find('select[name=tracking-company]').val()
    };
    let items = [];
    $(this).parents('#order-detail-section').find('div.trackingItem').each(function(){
      let itemId = {
        id: $(this).find('span.itemID').text()
      };
      items.push(itemId)
    });
    postData.items = items;
    // console.log(postData);
    socket.post('/tracking/fulfill',postData)
  });

  socket.on('order/shipped',function(recieve){
    console.log(recieve.data);
    if(recieve.data == $('#order-detail-section span.order-id').text()){
      location.reload();
    }

  });

  //choose a fulfillment method
  $('body').on('change','input[name=fulfillment-method]',function(){
    //get shipping weight
    let productArr = [];
    let totalWeight = 0;
    $('.orderItem').each(function(){
      let weight = parseFloat($(this).find('span.item-weight').text());
      let productid = $(this).find('.itemSku').text().match(/^([0-9]+)/)[0];
      let quantity = parseInt($(this).find('.item-quantity').text());
      let product = { productid, quantity};
      totalWeight += weight*quantity;
      productArr.push(product);
    });
    $('input[name=box-weight]').val(parseFloat(totalWeight).toFixed(2));
    $('span.package-weight').text(parseFloat(totalWeight).toFixed(2));
    //
    if($(this).val()=='shipping-label') {
      $('.section-buy-label').css('display','block');
      $('.section-tracking-enter').css('display','none');
      $('.summary-fulfill').addClass('sr-only');
      $('.summary-label').removeClass('sr-only');

      let postData = {
        shop: $('#order-detail-section span.order-shop-name').text(),
        order: $('span.order-internal-id').text(),
        orderID: $('span.order-id').text()
      };
      postData.address = {
        name: $('address.to-address span.shipping-name').text(),
        street1: $('address.to-address span.shipping-address').text(),
        street2: $('address.to-address span.shipping-address2').text(),
        city: $('address.to-address span.shipping-city').text(),
        state: $('address.to-address span.shipping-state').text(),
        zip: $('address.to-address span.shipping-zip').text(),
        country: $('address.to-address span.shipping-country_code').text(),
      };
      postData.parcel = {
        length: $('input#box-length').val(),
        width: $('input#box-width').val(),
        height: $('input#box-height').val(),
        weight: $('input#box-weight').val()
      };
      if ($('.shipment-service').hasClass('got-shipment-id')){
        return false;
      }
      socket.post('/tracking/create_shipment',postData)
    } else {
      $('.section-buy-label').css('display','none');
      $('.section-tracking-enter').css('display','block');
      $('.summary-label').addClass('sr-only');
      $('.summary-fulfill').removeClass('sr-only');
    }
  });

  //change box value
  $('button.change-box-value').on('click',function(){
    // let orderID = $('span.order-id').text();
    $('#editPackageModal').modal('hide');
    $('.shipment-rates').html('<i class="fa fa-spinner fa-pulse fa-fw"></i>');
    $('.summary-label .service-rate-price').html('<i class="fa fa-spinner fa-pulse fa-fw"></i>');

    let postData = {
      orderID: $('span.order-id').text(),
      order: $('span.order-internal-id').text(),
      shop: $('#order-detail-section span.order-shop-name').text()
    };
    postData.address = {
      name: $('address.to-address span.shipping-name').text(),
      street1: $('address.to-address span.shipping-address').text(),
      street2: $('address.to-address span.shipping-address2').text(),
      city: $('address.to-address span.shipping-city').text(),
      state: $('address.to-address span.shipping-state').text(),
      zip: $('address.to-address span.shipping-zip').text(),
      country: $('address.to-address span.shipping-country_code').text(),
    };
    postData.parcel = {
      length: $('input#box-length').val(),
      width: $('input#box-width').val(),
      height: $('input#box-height').val(),
    };
    if($('select[name=weight-type]').val()=='oz') {
      postData.parcel.weight = $('input#box-weight').val()
    } else if ($('select[name=weight-type]').val()=='lb') {
      postData.parcel.weight = parseFloat($('input#box-weight').val()*16).toFixed(2)
    }
    $('.section-buy-label span.package-length').text(postData.parcel.length);
    $('.section-buy-label span.package-width').text(postData.parcel.width);
    $('.section-buy-label span.package-height').text(postData.parcel.height);
    $('.section-buy-label span.package-weight').text($('input#box-weight').val());
    $('.section-buy-label span.package-weight-type').text($('select[name=weight-type]').val());
    socket.post('/tracking/create_shipment',postData,function(result){
      console.log(postData);
    });

  });

  $('button.get-shipping-address').click(function(){
    console.log('click');
    let id = $('input[name=order]').val();
    console.log('id', id);
    $(this).html(`<i class="fa fa-spin fa-spinner"></i> Get Shipping Information`);
    socket.get(`/acp/label?id=${id}&action=get_order`,function(data){
      if(!data.err){
        let address = data.shippingAddress;
        let weight = data.shippingWeight
        $('button.get-shipping-address').html(`Get Shipping Information`);
        $('input[name=weight]').val(weight);

        $('input[name=first_name]').val(address.first_name);
        $('input[name=last_name]').val(address.last_name);
        $('input[name=address1]').val(address.address1);
        $('input[name=address2]').val(address.address2);
        $('input[name=city]').val(address.city);
        $(`select#countryList option[value=${address.country_code}]`).attr('selected', 'selected');
        $('input[name=province]').val(address.province);
        $('input[name=zip]').val(address.zip);
        $('input[name=phone]').val(address.phone);

      }
      console.log('data', data);
    })
  })

  //socket on create shipment success
  socket.on('create/shipment',function(recieve){
    $('.order-'+recieve.id+' .shipment-rates').html('');
    $('.order-'+recieve.id+' .shipment-service').addClass('got-shipment-id');
    $('.order-'+recieve.id+' .shipment-service span.to-address-id').text(recieve.data.to_address.id);
    $('.order-'+recieve.id+' .shipment-service span.from-address-id').text(recieve.data.from_address.id);
    $('.order-'+recieve.id+' .get-shipment-id').text(recieve.data.id);

    for(let value of recieve.data.rates) {
      if(value.service == 'First') {
        $('.order-'+recieve.id+' .shipment-service .shipment-rates').prepend(`<div class="panel-body">
        <div class="radio"><label><input type="radio" name="shipment-rate-choose" value="${value.id}" checked>
        ${value.carrier} ${value.service}</label>
        <span class="pull-right">$${value.list_rate}</span>
        <p style="margin-left:20px;color:#757575;font-weight:200">estimate ${value.est_delivery_days} bussiness days</p></div></div>`);
      } else if(value.service == 'parcelConnectPriorityDDU') {
        $('.order-'+recieve.id+' .shipment-service .shipment-rates').prepend(`<div class="panel-body">
        <div class="radio"><label><input type="radio" name="shipment-rate-choose" value="${value.id}" checked>
        ${value.carrier} ${value.service}</label>
        <span class="pull-right">$${value.rate}</span>
        <p style="margin-left:20px;color:#757575;font-weight:200">estimate ${value.est_delivery_days} bussiness days</p></div></div>`);
      } else if(value.service == 'ParcelsGroundDomestic') {
        $('.order-'+recieve.id+' .shipment-service .shipment-rates').prepend(`<div class="hidden panel-body">
        <div class="radio"><label><input type="radio" name="shipment-rate-choose" value="${value.id}">
        ${value.carrier} ${value.service}</label>
        <span class="pull-right">$${value.rate}</span>
        <p style="margin-left:20px;color:#757575;font-weight:200">estimate ${value.est_delivery_days} bussiness days</p></div></div>`);
      } else {
        $('.order-'+recieve.id+' .shipment-service .shipment-rates').append(`<div class="panel-body">
        <div class="radio"><label><input type="radio" name="shipment-rate-choose" value="${value.id}">
        ${value.carrier} ${value.service}</label>
        <span class="pull-right">$${value.rate}</span>
        <p style="margin-left:20px;color:#757575;font-weight:200">estimate ${value.est_delivery_days} bussiness days</p></div></div>`);
      }
    }
    let chooseServiceCost = $('input[name=shipment-rate-choose]:checked').parents('div.radio').find('span.pull-right').text();
    $('.summary-label .service-rate-price').text(chooseServiceCost);
    let updateNameService = $('input[name=shipment-rate-choose]:checked').parents('div.radio').find('label').text();
    $('.summary-label .service-rate-name').html(updateNameService);

    if(recieve.data.messages.length > 0){
      console.log('co loi');
      $('.order-'+recieve.id+' .buy-label-notice').html('');
      $('.order-'+recieve.id+' .buy-label-notice').removeClass('hidden');
      for(let message of recieve.data.messages){
        $('.order-'+recieve.id+' .buy-label-notice').append(`<p><strong>${message.carrier}</strong> ${message.message}</p>`)
      }

    }
    console.log('recieve shipment',recieve.data);
    console.log('recieve order id',recieve.id);
  });

  //update cost label when choose service
  $('body').on('change','input[name=shipment-rate-choose]',function(){
    let updateNameService = $(this).parents('div.radio').find('label').text();
    let updateCost = $(this).parents('div.radio').find('span.pull-right').text();
    $('.summary-label .service-rate-price').text(updateCost);
    $('.summary-label .service-rate-name').html(updateNameService)
  });

  // click button buy label
  $('button.buy-label-shipping').on('click',function(){
    $('div.se-pre-con').css('display','block');
    let postData = {
      shop : $('span.order-shop-name').text(),
      orderId : $('span.order-id').text(),
      shipmentId : $('span.get-shipment-id').text(),
      rateId : $('input[name=shipment-rate-choose]:checked').val(),
      order:$('span.order-internal-id').text()
    };

    postData.address = {
      name: $('address.to-address span.shipping-name').text(),
      street1: $('address.to-address span.shipping-address').text(),
      street2: $('address.to-address span.shipping-address2').text(),
      city: $('address.to-address span.shipping-city').text(),
      state: $('address.to-address span.shipping-state').text(),
      zip: $('address.to-address span.shipping-zip').text(),
      country: $('address.to-address span.shipping-country_code').text(),
    };

    let items = [];
    $(this).parents('#order-detail-section').find('div.trackingItem').each(function(){
      let itemId = {
        id: $(this).find('span.itemID').text()
      };
      items.push(itemId)
    });
    postData.items = items;

    // console.log(postData);
    socket.post('/tracking/buy_shipment',postData,function(result){
      location.reload();
    });
  });

  // Edit tracking number
  $('button.edit-tracking-button').on('click',function(){
    $('div.se-pre-con').css('display','block');
    let postData = {
      shop: $('#order-detail-section span.order-shop-name').text(),
      orderId: $('#order-detail-section span.order-id').text(),
      fulfillmentId: $('#order-detail-section .fulfillment-detail .fulfillmentId').text(),
      trackingNumber: $('form#edit-tracking input[name=tracking-number]').val(),
      trackingCompany: $('form#edit-tracking select[name=tracking-company]').val(),
    };
    socket.post('/tracking/edit_tracking',postData)
  });

  socket.on('tracking/edit',function(recieve){
    if(recieve.data == $('#order-detail-section span.order-id').text()){
      location.reload();
    }
  });

  //Void shipping label
  $('button.void-label-button').on('click',function(){
    $('div.se-pre-con').css('display','block');
    let postData = {
      fulfillmentId: $('#order-detail-section .fulfillment-detail .fulfillmentId').text(),
      shop : $('span.order-shop-name').text(),
      orderId : $('span.order-id').text(),
      shipmentId : $(this).find('span.shipmentId').text()
    };
    socket.post('/tracking/void_shipment',postData);
    // console.log(postData)
  });

  socket.on('void/label',function(recieve){
    if(recieve.data == $('#order-detail-section span.order-id').text()){
      location.reload();
    }
  });

  //edit shipment
  $('button.edit-shipment-button').on('click',function(){
    $('#label-shipping-section').removeClass('sr-only');
  });
  $('button.buy-new-label').on('click',function(){
    $('div.se-pre-con').css('display','block');
    let postData = {
      shop : $('span.order-shop-name').text(),
      fulfillmentId: $('#order-detail-section .fulfillment-detail .fulfillmentId').text(),
      orderId : $('span.order-id').text(),
      shipmentId : $('span.get-shipment-id').text(),
      rateId : $('input[name=shipment-rate-choose]:checked').val()
    };

    postData.address = {
      name: $('address.to-address span.shipping-name').text(),
      street1: $('address.to-address span.shipping-address').text(),
      street2: $('address.to-address span.shipping-address2').text(),
      city: $('address.to-address span.shipping-city').text(),
      state: $('address.to-address span.shipping-state').text(),
      zip: $('address.to-address span.shipping-zip').text(),
      country: $('address.to-address span.shipping-country_code').text(),
    };

    let items = [];
    $(this).parents('#order-detail-section').find('div.trackingItem').each(function(){
      let itemId = {
        id: $(this).find('span.itemID').text()
      };
      items.push(itemId)
    });
    postData.items = items;

    // console.log(postData);
    socket.post('/tracking/edit_shipment',postData);
  });
  socket.on('new/label',function(recieve){
    if(recieve.data == $('#order-detail-section span.order-id').text()){
      location.reload();
    }
  });

  // Check valid address
  $('a.check-address').on('click',function(){
    let orderID = $('span.order-id').text();
    $('.order-'+orderID+' p.check-address-title').html('<i class="fa fa-spinner fa-pulse fa-fw"></i> verifying...');
    let postData = {
      orderID,
      address: {
        verify: ['delivery'],
        street1: $('address.to-address span.shipping-address').text(),
        city: $('address.to-address span.shipping-city').text(),
        state: $('address.to-address span.shipping-state').text(),
        zip: $('address.to-address span.shipping-zip').text(),
        country: $('address.to-address span.shipping-country_code').text(),
      }
    }

    socket.post('/tracking/check_address',postData)

  });

  socket.on('check/address',function(data){
    console.log(data.msg);
    if(data.msg==true){
      $('.order-'+data.id+' p.check-address-title').html(`<i class="fa fa-check"></i> ${data.msg}`)
    } else {
      $('.order-'+data.id+' p.check-address-title').html(`<i class="fa fa-close"></i> ${data.msg}`)
    }
  })

  //auto buy label and fulfill order
  $('button.auto-fulfill').on('click',function(){
    $(this).attr('disabled',true);
    $('.autobuy-background').removeClass('hidden');
    swal("Success!", "Auto buy is running in background!", "info");
    let postData = {
      shop: $('#order-detail-section span.order-shop-name').text(),
      order: $('span.order-internal-id').text(),
      orderID: $('span.order-id').text()
    };
    postData.address = {
      name: $('address.to-address span.shipping-name').text(),
      street1: $('address.to-address span.shipping-address').text(),
      street2: $('address.to-address span.shipping-address2').text(),
      city: $('address.to-address span.shipping-city').text(),
      state: $('address.to-address span.shipping-state').text(),
      zip: $('address.to-address span.shipping-zip').text(),
      country: $('address.to-address span.shipping-country_code').text(),
    };
    postData.parcel = {
      length: $('input#box-length').val(),
      width: $('input#box-width').val(),
      height: $('input#box-height').val(),
      weight: $('input#box-weight').val()
    };
    if ($('.shipment-service').hasClass('got-shipment-id')){
      return false;
    }
    socket.post('/tracking/auto_buy_label',postData,function(data){
      location.reload();
      console.log('data', data);
    })

  });

  // socket.on('fulfilled/success',function(data){
  //   console.log('data', data);
  // })


});
