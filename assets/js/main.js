$(function() {
  //PRODUCT OPTION PAGE

  $('.selectpicker').selectpicker({
    style: 'btn-info',
    size: 4
  });

  $('[data-toggle="popover"]').popover();


  $('select.selectpicker').on('change', function(){
    var selected = $('.selectpicker').val();
    console.log(selected);
  });

  $('.selectoption').selectpicker({
    style: 'btn-primary',
    size: 10,
    actionsBox:true,
  });


  $('div.data-size').each(function(){
    $(this).find('input[name=size]').click(function(){
      if($(this).is(':checked')){
        $(this).closest('div.data-size').addClass('check-size')
      } else {
        $(this).closest('div.data-size').removeClass('check-size')
      }
    })
  });

  $('a.pop').on('click', function() {
    let designId = $(this).find('img').attr('src').split('320x320/')[1];
    $('.imagepreview').attr('src', $(this).find('img').attr('src'));
    $('a.download-origin').attr('href','http://img.gearment.com/unsafe/'+designId );
    $('#imagemodal').modal('show');
  });

  $('form#add-new-mockup').submit(function(){
    console.log('on submit');
    var mockupSize = [];
    $('div.check-size').each(function(){

      if($(this).find('input[name=pricesize]').val() == 0){
        var pricesize = $('#add-new-mockup input[name=cost]').val();
      } else {
        var pricesize = $(this).find('input[name=pricesize]').val()
      }

      var eachSize = {
        size: $(this).find('input[name=size]').val(),
        price: pricesize
      };
      mockupSize.push(eachSize)
    });

    let colorName = [];
    $('#add-new-mockup li.selected').each(function(){
      let colorname = $(this).find('span.text').text();
      colorName.push(colorname);
    });
    let mockupColor = [];
    for (var c = 0; c < colorName.length ; c++) {
      let eachColor = {
        name: colorName[c],
        value: $('#add-new-mockup select[name=color]').val()[c]
      };
      mockupColor.push(eachColor)
    }

    let dataMockup = {
      brand: $('#add-new-mockup input[name=brand]').val(),
      name: $('#add-new-mockup input[name=name]').val(),
      type: $('#add-new-mockup input[name=name]').val().toLowerCase().replace(/ |-/g,"_"),
      cost: $('#add-new-mockup input[name=cost]').val(),
      cost: $('#add-new-mockup input[name=minPay]').val(),
      description: CKEDITOR.instances.richText.getData(),
      frontImg: $('#add-new-mockup input[name=front-img]').val(),
      backImg: $('#add-new-mockup input[name=back-img]').val(),
      minPay: $('#add-new-mockup input[name=minPay]').val(),
      color: mockupColor,
      size: mockupSize
    };
    if (colorName.length == 0 || mockupSize.length == 0) {
      alert('color or size required')
    } else {
      socket.post('/acp/add/',dataMockup)
    }

  });

  socket.on('mockup/added',function(){
    window.location = "/acp/mockup?p=sample";
  });


  ///// Edit mockup
  $('form.updateOrder').submit(function(){
    // $(this).parents('tbody').fadeOut('slow')
    $('#view-mockup table tbody').fadeOut('slow')
  });

  $('button.update-mockup').click(function(){
    $('form#edit-old-mockup').submit();
  });

  $('button.add-mockup').click(function(){
    $('form#add-new-mockup').submit();
  });


  $('div.data-size').each(function(){
    $(this).find('input[name=size]').click(function(){
      if($(this).is(':checked')){
        $(this).closest('div.data-size').addClass('check-size')
      } else {
        $(this).closest('div.data-size').removeClass('check-size')
      }
    })
  });


  $('form#edit-old-mockup').submit(function(){
    console.log('on submit');
    var mockupSize = [];
    $('div.data-size').each(function(){
      if($(this).find('input[name=pricesize]').val() !== '' && $(this).find('input[name=pricesize]').val() > 0 ){
        let eachSize = {
          size: $(this).find('input[name=size]').val(),
          price: $(this).find('input[name=pricesize]').val(),
          shipfee: $(this).find('input[name=shipfee]').val()
        };
        mockupSize.push(eachSize)
      }

    });

    let colorName = [];
    $('#edit-old-mockup li.selected').each(function(){
      let colorname = $(this).find('span.text').text();
      colorName.push(colorname);
    });
    let mockupColor = [];
    for (var c = 0; c < colorName.length ; c++) {
      let eachColor = {
        name: colorName[c],
        value: $('#edit-old-mockup select[name=color]').val()[c]
      };
      mockupColor.push(eachColor)
    }

    let dataMockup = {
      id: $('#edit-old-mockup input[name=id]').val(),
      brand: $('#edit-old-mockup input[name=brand]').val(),
      name: $('#edit-old-mockup input[name=name]').val(),
      type: $('#edit-old-mockup input[name=name]').val().toLowerCase().replace(/ |-/g,"_"),
      cost: $('#edit-old-mockup input[name=cost]').val(),
      minPay: $('#edit-old-mockup input[name=minPay]').val(),
      description:CKEDITOR.instances.richText.getData(),
      frontImg: $('#edit-old-mockup input[name=front-img]').val(),
      backImg: $('#edit-old-mockup input[name=back-img]').val(),
      color: mockupColor,
      size: mockupSize
    };
    // console.log(dataMockup);
    socket.post('/acp/edit/',dataMockup)
  });

  socket.on('mockup/updated',function(){
    window.location = "/acp/mockup?p=sample";
  });
  ///// end

  //Update setting
  $('form#update-shopify-form').on('submit',function(e){
    e.preventDefault();
    let updateData = {
      shopifyKey: $('input[name=shopifyKey]').val(),
      shopifySecret: $('input[name=shopifySecret]').val()
    };
    socket.post('/setting/newset',updateData);
  });

  $('form#update-paypal-form').on('submit',function(e){
    e.preventDefault();
    let updateData = {
      paypalClient: $('input[name=paypalClient]').val(),
      paypalSecret: $('input[name=paypalSecret]').val()
    };
    socket.post('/setting/newset',updateData);
  });

  $('form#update-fee-form').on('submit',function(e){
    e.preventDefault();
    let updateData = {
      taxFee: $('input[name=taxFee]').val(),
      shippingFee: $('input[name=shippingFee]').val(),
      printFee: $('input[name=printFee]').val(),
    };
    socket.post('/setting/newset',updateData);
  });
  //end

  // $('a.del-mockup').click(function(){
  //   let mockupId = $(this).closest('tr.each-mockup').find('td.mockup-id').text();
  //   socket.get('/acp/del?id='+mockupId)
  // });
  // socket.on('mockup/del',function(){
  //   window.location = "/acp/mockup?p=sample";
  // });

  $('#choose-option').on('changed.bs.select', function (e) {
    if ($('select').val() == 'color') {
      $('input#value').addClass('sr-only');
      $('#add-option #cp2').removeClass('sr-only');
      $('#add-new-option input[name=value-size]').val('')
    } else if ($('select').val() == 'size') {
      $('#add-option #cp2').addClass('sr-only');
      $('input#value').removeClass('sr-only');
      $('#add-new-option input[name=value-color]').val('')
    } else {
      $('#add-option #cp2').addClass('sr-only');
      $('input#value').removeClass('sr-only');
      $('#add-new-option input[name=value-color]').val('');
      $('#add-new-option input[name=value-size]').val('')
    }
  });


  if (window.location.pathname.match(/shopify\/product/gi) || window.location.search.match(/p=sample/gi) ) {
    CKEDITOR.replace('richText');
  }

  $('.editor').each(function(e){
    console.log('Auto replace richtext editor', this.id);
    CKEDITOR.replace(this.id);
  });

  $(document).ready(function(){
    $('.detail-content').fadeIn('slow');
    $('.detail-content').css('margin-left','0');

    $('#cp2').colorpicker();

    $('#cp3').colorpicker();

    $('[data-toggle="tooltip"]').tooltip();
    // $('#cp2').colorpicker().on('changeColor', function(e) {
    //   $('.live-change-color')[0].style.backgroundColor = e.color.toString(
    //     'rgba');
    // });

  });

  $('#option-page table tbody tr').each(function(){
    $(this).find('a.edit-option').click(function(){
      $('#edit-option').css({'height':'auto','opacity':'1','margin-bottom':'20px'});
      let findOptionId = $(this).closest('tr').find('td.option-id').text();
      let findOptionName = $(this).closest('tr').find('td.option-name').text();
      let findOptionValue = $(this).closest('tr').find('td.option-value').text();
      let findOptionType = $(this).closest('tr').find('td.option-type').text();
      if (findOptionType == 'size') {
        $('#edit-option input[name=value-size]').val(findOptionValue);
        $('#edit-option #cp3').addClass('sr-only');
        $('#edit-option input[name=value-size]').removeClass('sr-only');
        $('#edit-option input[name=type]').val('Size')
      } else {
        $('#edit-option input[name=value-color]').val(findOptionValue);
        $('#edit-option input[name=value-size]').addClass('sr-only');
        $('#edit-option #cp3').removeClass('sr-only');
        $('#edit-option input[name=type]').val('Color');
        $('#edit-option #cp3 span.live-change-color').css('background',findOptionValue)
      }
      $('#edit-option input[name=id]').val(findOptionId);
      $('#edit-option input[name=name]').val(findOptionName);
      $('#edit-option .panel-heading strong').text(findOptionId)
    });

    $(this).find('a.delete-option').click(function(){
      let findOptionId = $(this).closest('tr').find('td.option-id').text();
      let findOptionName = $(this).closest('tr').find('td.option-name').text();
      let findOptionType = $(this).closest('tr').find('td.option-type').text();
      $('#delOptionModal strong.option-type').text(findOptionType);
      $('#delOptionModal strong.option-name').text(findOptionName);
      $('#delOptionModal input[name=id]').val(findOptionId);
      $('#delOptionModal').modal();
    });
  });

  $('#delOptionModal a.delete-option').click(function(){
    let delOptionData = {
      id:$('#delOptionModal input[name=id]').val(),
      action:'del'
    };
    socket.post('/acp/mockup/',delOptionData);
    $('#delOptionModal').modal('hide')
  });
  socket.on('option/del',function(recieve){
    $('#opt-id-'+recieve.msg).fadeOut('slow');
  });

  $('.close-edit-option').click(function(){
    $('#edit-option').css({'height':'0','opacity':'0','margin-bottom':'-2px'});
  });

  $('#edit-value-option').submit(function(e){
    e.preventDefault();
    if ($(this).find('input#type').val() == 'Size') {
      var optionValue = $(this).find('input[name=value-size]').val()
    } else {
      var optionValue = $(this).find('input[name=value-color]').val()
    }
    let updateOption = {
      p:'option',
      action:'edit',
      id: $(this).find('input#id').val(),
      name: $(this).find('input#name').val(),
      value: optionValue
    };
    socket.post('/acp/mockup/',updateOption)
  });
  socket.on('option/update',function(recieve){
    $('#option-page div.alert').html('<strong>Success!</strong> An option has changed.');
    $("#option-page div.alert").fadeTo(2000, 500).slideUp(500, function(){
      $("#option-page div.alert").slideUp(500);
    });
    // $('#edit-option').css({'height':'0','opacity':'0','margin-bottom':'-2px'});
    $('tr#opt-id-'+recieve.msg[0].id).fadeOut('slow',function(){
      $('tr#opt-id-'+recieve.msg[0].id).find('td.option-name').text(recieve.msg[0].name);
      $('tr#opt-id-'+recieve.msg[0].id).find('td.option-value').text(recieve.msg[0].value);
      $('tr#opt-id-'+recieve.msg[0].id).find('td.option-status').text(recieve.msg[0].status);
    });
    $('tr#opt-id-'+recieve.msg[0].id).fadeIn('slow');
  });
  //END

  let url = window.location.pathname;
  let activePage = url.substring(url.lastIndexOf('/')+1);
  $('aside a').each(function(){
    var currentPage = this.href.substring(this.href.lastIndexOf('/')+1);
    if (activePage == currentPage) {
      $(this).find('li.list-group-item').addClass('item-active');
    }
  });
  $('#filter-by-date a').each(function(){
    let currentUrl = location.search;
    let activeSearch = $(this).attr('href');
    if (currentUrl == activeSearch) {
      $(this).addClass('active');
    }
  });


  $('.aright').click(function(){
    $('ul.nav-tabs li').css('z-index','-1');
    $('.menu-arrow.aleft').removeClass('sr-only');
    $('.menu-arrow.aright').addClass('sr-only');
    $('.sidenav').addClass('sidenav-active');
    $('.head-content .menu-arrow').addClass('move-head');

  });
  $('.aleft').click(function(){
    $('.menu-arrow.aright').removeClass('sr-only');
    $('.menu-arrow.aleft').addClass('sr-only');
    $('.sidenav').removeClass('sidenav-active');
    $('.head-content .menu-arrow').removeClass('move-head');
    $('ul.nav-tabs li').css('z-index','0');

  });


  //ADD NEW OPTION
  $('form#add-new-option').submit(function(a) {
    a.preventDefault();
    console.log('add new option');
    if ($('#add-new-option input[name=value-size]').val() == '') {
      var optionValue = $('#add-new-option input[name=value-color]').val();
    } else {
      var optionValue = $('#add-new-option input[name=value-size]').val();
    }
    let dataOption = {
      p: 'option',
      action:'add',
      name: $('#add-new-option input[name=name]').val(),
      type: $('#add-new-option select[name=type]').val(),
      value: optionValue,
      status: 'show'
    };
    socket.post('/acp/mockup/',dataOption)
  });

  //ADD NEW SIZE
  $('#show-add-size a.btn-add-size').click(function(){
    console.log('add new size');
    let dataSize = {
      p: 'option',
      action:'add',
      name: $('#show-add-size input[name=size-name]').val(),
      type: 'size',
      value: $('#show-add-size input[name=size-value]').val(),
      price: $('#show-add-size input[name=size-price]').val(),
      status: 'show'
    };
    socket.post('/acp/mockup/',dataSize)
  });

  socket.on('option/added',function(recieve){
    $('#option-page div.alert').addClass('alert-success').removeClass('sr-only');
    $('#option-page div.alert').html('<strong>Success!</strong> You added a new option.');
    $("#option-page div.alert").fadeTo(2000, 500).slideUp(500, function(){
      $("#option-page div.alert").slideUp(500);
    });

    socket.on('size/added',function(recieve){
      location.reload();
      // $('.live-add-size').prepend('<div class="data-size checkbox">' +
      //   '<label><input type="checkbox" name="size" value="'+recieve.msg.value+'">'+recieve.msg.name+'</label>' +
      //   '<input type="text" class="pull-right" name="pricesize" value="'+recieve.sizePrice+'"></div>')
    });
  $('input').val('');
    if (recieve.msg.type == 'color') {
      $('table#option-color-table tbody').append('<tr id="opt-id-'+recieve.msg.id+'">' +
        '<td class="option-id">'+recieve.msg.id+'</td>' +
        '<td class="option-name">'+recieve.msg.name+'</td>' +
        '<td class="option-type sr-only">'+recieve.msg.type+'</td>' +
        '<td class="option-value value-color"><div style="background:'+recieve.msg.value+'">'+recieve.msg.value+'</div></td>' +
        '<td class="option-status">'+recieve.msg.status+'</td>' +
        '<td><div class="btn-group"><a class="fa-button-edit edit-option btn btn-default" href="#"><i class="fa fa-pencil"></i></a>' +
        '<a class="fa-button-delete btn btn-default" href="#"><i class="fa fa-trash"></i></a>' +
        '</div></td></tr>')
    } else {
      $('table#option-size-table tbody').append('<tr id="opt-id-'+recieve.msg.id+'">' +
        '<td class="option-id">'+recieve.msg.id+'</td>' +
        '<td class="option-name">'+recieve.msg.name+'</td>' +
        '<td class="option-type sr-only">'+recieve.msg.type+'</td>' +
        '<td class="option-value value-size">'+recieve.msg.value+'</td>' +
        '<td class="option-status">'+recieve.msg.status+'</td>' +
        '<td><div class="btn-group"><a class="fa-button-edit edit-option btn btn-default" href="#"><i class="fa fa-pencil"></i></a>' +
        '<a class="fa-button-delete btn btn-default" href="#"><i class="fa fa-trash"></i></a>' +
        '</div></td></tr>')
    }
  });

  //Sync Store Callback
  socket.on('shop/sync',function(data){
    $('#shop-userid-'+data.msg.user).append('<div class="new-shop-sync media"><div class="media-left">' +
      '<img src="../images/shopify.png" class="media-object" style="width:60px"></div>' +
      '<div class="media-body"><h4 class="media-heading">'+data.msg.name+'</h4></div>' +
      '<div class="media-right"><p><a type="button" class="btn btn-primary">Manager</a></p>' +
      '<p><a type="button" class="btn btn-warning">Remove</a></p></div>')
  });

  //New Order Hook
  socket.on('create/order',function(recieve){
    if(recieve.data.sync == 1) {
      console.log('event create/order');
      $('table.new-order-hook tbody').prepend('<tr class="show-order-fade" id="order-id-'+recieve.data.id+'">' +
        '<td><input type="checkbox" class="choose-order-id"></td>' +
        '<td class="order-id"><a href="'+window.location.href+'?view='+recieve.data.orderid+'&name='+recieve.data.shop+'">#'+recieve.data.id+'</a></td>' +
        '<td class="order-shop">'+recieve.data.shop.replace('.myshopify.com','')+'</td>' +
        '<td class="order-date">'+recieve.data.createdAt+'</td>' +
        '<td class="order-name">'+recieve.data.name+'</td>' +
        '<td class="sr-only"></td><td class="sr-only"></td>' +
        '<td class="order-financial_status">pending</td>' +
        '<td class="order-total_price">'+recieve.data.total_price+' '+recieve.data.currency+'</td>' +
        '</tr>');
      $('tr.show-order-fade').css('opacity','1');
    }

  });
  socket.on('update/order',function(recieve) {
    console.log('event update/order');
    $('table.new-order-hook tbody tr#order-id-'+recieve.data.id+' td.order-financial_status').fadeOut('slow');
    $('table.new-order-hook tbody tr#order-id-'+recieve.data.id+' td.order-financial_status').text(recieve.data.financial_status);
    $('table.new-order-hook tbody tr#order-id-'+recieve.data.id+' td.order-financial_status').fadeIn('slow');
  });

  $('#feedback-form-submit').submit(function(e){
    e.preventDefault();
    let data = $(this).serializeObject();
    socket.post('/demo/feedback',data, function(result){
      swal("Thank you!", "Your feedback has been received, we will contact you shortly!", "success")
        .then(function(){
          window.location = "/"
        })
    })
  });

  $('#create-label-page form#get-service').submit(function(e){
    e.preventDefault();
    let data = $(this).serializeObject();
    $('form#get-service i').addClass('fa-spinner fa-spin').removeClass('fa-check');
    socket.post('/acp/label',data, function(data){
      $('form#get-service i').removeClass('fa-spinner fa-spin').addClass('fa-check');
      $('form#buy-label button').addClass('in').removeClass('out');
      console.log('data', data);
      for(let value of data.rates) {
        $('#create-label-page .shipping-rates').prepend(`<div class="panel-body">
        <div class="radio"><label><input type="radio" name="rateid" value="${value.id}" checked>
        <span>${value.carrier} ${value.service}</span></label>
        <span class="pull-right">$${value.list_rate}</span></div></div>`);
      }
      $('input[name=shipmentid]').val(data.id)
    })
  })

  $('#create-label-page form#buy-label').submit(function(e){
    e.preventDefault();
    let data = $(this).serializeObject();
    $('form#buy-label i').addClass('fa-spinner fa-spin').removeClass('fa-check');
    socket.post('/acp/label',data, function(data){

      $('form#buy-label i').removeClass('fa-spinner fa-spin');
      if(data.error){
        swal ( data.error.error.code ,  data.error.error.message ,  "error" )
        console.log('error',data.error.error.code );
      } else {
        $('form#buy-label i').addClass('fa-check');
        $('.show-result-url').html(`<div class="panel panel-default">
                            <div class="panel-heading">RESULT HERE</div>
                            <div class="panel-body"><a href="${data.postage_label.label_url}" target="_blank">
                            <i class="fa fa-file-text-o"></i> SHIPPING LABEL</a></div></div>`)

        console.log('postage_label', data.postage_label.label_url);
      }

    })
  })

});
