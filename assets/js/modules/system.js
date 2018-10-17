$(function() {

  $('table#material-shipping input').on('keypress',function(){
    $(this).parents('tr').css('color','#337ab7');
    $(this).parents('tr').find('i.change').removeClass('fa-hashtag').addClass('fa-pencil');
    if($(this).parents('tr').hasClass('materialEdit')){
      //do not anything
    } else {
      $(this).parents('tr').addClass('materialEdit')
    }
  });
  //chỉ lấy những tr có edit để submit
  $('button.save-shipping-fee').on('click',function(){
    console.log('save shipping fee');
    $('table#material-shipping tbody tr.materialEdit').each(function(){

      let postData = {
        material: $(this).find('input[name=material]').val(),
        us_shipping: $(this).find('input[name=us_shipping]').val(),
        us_extra: $(this).find('input[name=us_extra]').val(),
        international_ship: $(this).find('input[name=international_ship]').val(),
        international_extra: $(this).find('input[name=international_extra]').val()
      };
      $('tr#material-id-'+postData.material+' i.change').removeClass('fa-pencil').addClass('fa-spinner fa-spin')
      socket.post('/acp/save_shipping',postData);
      console.log(postData);
    })

  });

  socket.on('save/shippingfee',function(data){
    console.log(data.msg);
    $('tr#material-id-'+data.msg).css('color','#3c763d');
    $('tr#material-id-'+data.msg).removeClass('materialEdit');
    $('tr#material-id-'+data.msg+' i.change').removeClass('fa-spinner fa-spin').addClass('fa-check');
    setTimeout(function(){
      $('tr#material-id-'+data.msg).css('color','#000000');
      $('tr#material-id-'+data.msg+' i.change').removeClass('fa-check').addClass('fa-hashtag')
    }, 3000);
  })

})


