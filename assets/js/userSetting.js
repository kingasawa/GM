$(function() {
  $('button.save-user-setting').on('click',function(){
    let checkValue = $('input[name=auto-pay]:checked').length;
    console.log(checkValue);
    socket.get('/user/setting?autopay='+checkValue)
  })

  socket.on('update/setting',function(){
    $('.update-setting-notification').html('Your update setting successfull');
    $('.update-setting-notification').removeClass('sr-only');

    setTimeout(function(){
      $('.update-setting-notification').fadeOut('slow')
    }, 10000);

  })

  $('form#billingAddress').on('submit',function(e){
    e.preventDefault();
    let billingAddressData = $(this).serializeObject();

    // console.log(billingAddressData)
    socket.post('/user/address',billingAddressData);

  })

  socket.on('new/address',function(data){

    if(data.msg == 'update'){
      var msgcontent = 'You updated billing address successfull'
    } else {
      var msgcontent = 'You created billing address successfull'
    }

    $('.update-setting-notification').html(msgcontent);
    $('.update-setting-notification').removeClass('sr-only');

    setTimeout(function(){
      $('.update-setting-notification').fadeOut('slow')
    }, 10000);
  })
})
