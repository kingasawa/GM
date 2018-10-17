$(function(){

  let orderLength = parseInt($('.order-length span').text());
  let validSubTotal = 0;
  let validOrder = 0;
  let failOrder = 0;
  let validShippingTotal = 0;
  let orderCount = 0;
  let errorNumber = 0;

  if(getParam('sid')){
    $('.validate-data').attr('disabled',false)
    // console.log('co sid');
  }
  function validateData(){
      $('.display-noty .alert').fadeOut();
      $('.display-noty .alert').remove();
      failOrder = 0;
      validSubTotal = 0;
      errorNumber = 0;
      let sid = getParam('sid');
      console.log('on click validate function',failOrder);
      socket.get('/order/getDataCsv',{sid});
    }

    $('.validate-data').click(function(){
      $(this).find('i').removeClass('fa-close fa-check');
      $(this).find('i').addClass('fa-spin');
        validateData();
    });

  socket.on('check/csv_data',function(data){
    console.log('check data', data);
    // let sid = getParam('sid');
    // console.log('sid', sid);
    $('.validate-data i').removeClass('fa-spin');
    $(`#${data.sid} tr#tr-${data.id} i`).removeClass('fa-close fa-check').addClass('fa-circle-o-notch');
    $(`#${data.sid} tr#tr-${data.id} i`).addClass('fa-spin').css('background','#fff');

  })
  socket.on('send/csv_data',function(data){
    $('.display-noty .alert-success').fadeOut('slow');
    orderCount = orderCount+1;
    if(orderLength == orderCount){
      $('.validate-data i').removeClass('fa-spin');
      // $('a.validate-data').attr('disabled',true);
    }

    if(data.success == 'false') {
      failOrder = failOrder+1;
      console.log('failOrder', failOrder);
      errorNumber = data.number;

      if(data.error == '101'){
        $('.display-noty').append(`<div id="warning-order-${data.orderid}" class="error-${errorNumber} alert alert-warning"><a href="#" class="close editAddress" data-toggle="modal" data-target="#editAddress" data-orderid="${data.orderid}"><i class="fa fa-pencil"></i></a><strong>Order ${data.orderid}!</strong> ${data.msg}.</div>`)
      } else {
        console.log('data.error', data.error);
        $('.display-noty').append(`<div id="warning-order-${data.orderid}" class="error-${errorNumber} alert alert-warning">
        <a href="#" class="close editProduct" data-number="${errorNumber}"
          data-toggle="modal" data-target="#editProduct${data.error}" 
          data-orderid="${data.orderid}" data-error="${data.error}" data-style="${data.data.style}" 
          data-color="${data.data.color}" data-size="${data.data.size}">
          <i class="fa fa-pencil"></i></a>
          <strong>Order ${data.orderid}!</strong> ${data.msg}.</div>`)
      }

      $(`#${data.sid} tr#tr-${data.orderid}`).css({'background':'#fff','color':'#ccc'});
      $(`#${data.sid} tr#tr-${data.orderid} i`).removeClass('fa-circle-o-notch fa-spin').addClass('fa-close');
    } else {

      $('.valid-order-count span').text(validOrder);
      validSubTotal = validSubTotal+data.subtotal;
      validShippingTotal = validShippingTotal+data.shipping;
      $('.valid-sub-total span').text('$'+parseFloat(validSubTotal).toFixed(2));
      $('.valid-shipping-total span').text('$'+parseFloat(validShippingTotal).toFixed(2));

      // let sid = getParam('sid');
      $(`#${data.sid} tr#tr-${data.orderid} i`).removeClass('fa-circle-o-notch fa-spin').addClass('fa-check');
      $(`#${data.sid} tr#tr-${data.orderid} td.subtotal`).text(`$${data.subtotal}`);
      $(`#${data.sid} tr#tr-${data.orderid} td.quantity`).text(data.quantity);
      $(`#${data.sid} tr#tr-${data.orderid} td.shippingcost`).text(data.shipping);
      $(`#${data.sid} tr#tr-${data.orderid}`).css({'background':'#fff','color':'#666'});
    }
      $('.fail-order-count span').text(failOrder);
      if(failOrder == 0){
        $('.validate-data').attr('disabled',true);
        $('.import-orders').attr('disabled',false);
      }

  });

  $('body').on('click','.editAddress', function(){
    let sid = getParam('sid');
    let orderid = $(this).data('orderid');
    console.log('sid', sid);
    console.log('orderid', orderid);
    socket.get(`/order/getAddressCache?sid=${sid}&orderid=${orderid}`,function(result){
      $('#editAddress input#address1').val(result.address1);
      $('#editAddress input#address2').val(result.address2);
      $('#editAddress input#city').val(result.city);
      $('#editAddress input#state').val(result.state);
      $('#editAddress input#zipcode').val(result.zipcode);
      $('#editAddress input#country').val(result.country);
      $('#editAddress input#orderid').val(orderid);
      $('#editAddress input#sid').val(sid);
    })
  });

  $('body').on('click','a.editProduct', function(){
    $('form#updateProductCache').trigger("reset");
    $('#editProduct201 form#updateProductCache select#updateProductStyle option').remove();
    $('.updateProductError').addClass('hidden');
    let errorCode = $(this).data('error');
    let errorNumber = $(this).data('number');
    console.log('errorNumber', errorNumber);

    let getData = {
      sid: getParam('sid'),
      orderid: $(this).data('orderid'),
      error:errorCode,
      style: $(this).data('style'),
      color: $(this).data('color'),
      size: $(this).data('size')
    }


    $(`#editProduct${errorCode} form input#oldstyle`).val(getData.style);
    $(`#editProduct${errorCode} form input#orderid`).val(getData.orderid);
    $(`#editProduct${errorCode} form input#sid`).val(getData.sid);
    $(`#editProduct${errorCode} form input#errornumber`).val(errorNumber);
    // $(`#editProduct${errorCode} form button`).attr('data-number',errorNumber);
    // $(`#editProduct${errorCode} .updateProductError`).addClass(`updateErrorNumber${errorNumber}`)

    if(errorCode == '201') {
      socket.get(`/order/getProductCache`, getData, function(result) {
        console.log('get product data', result);
        _.each(result.material, function(material) {
          $('#editProduct201 form#updateProductCache select#updateProductStyle').append(`
            <option value="${material.name}">${material.name}</option>
          `)
        })
      })
    } else {
      $(`#editProduct${errorCode} form input#color`).val(getData.color);
      $(`#editProduct${errorCode} form input#size`).val(getData.size);
      $(`#editProduct${errorCode} form input#oldcolor`).val(getData.color);
      $(`#editProduct${errorCode} form input#oldsize`).val(getData.size);
    }
    // $('.editProduct').attr('id',`editProduct${errorNumber}`)
  });

  $('form#updateAddressCache').submit(function(e){
    e.preventDefault();
    // $('#editAddress').modal('hide');
    $(this).find('.fa-refresh').addClass('fa-spin');
    $(this).find('button').attr('disabled',true);

    let updateAddressData = $(this).serializeObject();
    socket.get('/validatedata/address',updateAddressData,function(data){

      if(data.msg == 'false'){
        $('form#updateAddressCache button').attr('disabled',false);
        $('form#updateAddressCache i').removeClass('fa-spin')
        $('.updateAddressError').removeClass('hidden')
      } else {
        validateData();
        $('#editAddress').modal('hide');
      }
    })
  })

  $('form#updateProductCache').submit(function(e){
    e.preventDefault();
    // $('#editAddress').modal('hide');
    $(this).find('.fa-refresh').addClass('fa-spin');
    $(this).find('button').attr('disabled',true);


    let updateProductCache = $(this).serializeObject();
    socket.get('/validatedata/product',updateProductCache,function(data){

      if(data.msg == 'true'){

        validateData();
        $('.editProduct').modal('hide');
        // $(`.error-${data.errornumber}`).fadeOut('slow');
      } else {
        $(`.updateProductError`).removeClass('alert-success').addClass('alert-danger');
        $(`.updateProductError`).html(`<strong>Failed!</strong> Product not found..`)

      }
      $('form#updateProductCache button').attr('disabled',false);
      $('form#updateProductCache i').removeClass('fa-spin')
      $('.updateProductError').removeClass('hidden')
    })
  });

  $('input[type=file]').change(function () {
    $('.import-csv-submit').attr('disabled',false);
    $('.validate-data').attr('disabled',true);
  });

  $('.import-orders').click(function(){
    let sid = getParam('sid');
    $('a.import-orders i').addClass('fa-spin');
    socket.get(`/order/import_orders?sid=${sid}`,function(data){

    })
  })

  let trCount = parseInt($('table#import-order-table tbody tr').length);
  socket.on('notification/order',function(data){
    // console.log('data', data);
    socket.get('/notification/order',data,function(result){

      console.log('result', data);
      trCount = trCount-1;
      console.log('trCount', trCount);
      if(trCount===0){
        console.log('xong');
        $('a.import-orders i').removeClass('fa-spin');
        window.location = '/order/import'
      }
    })
  })
  // }

})
