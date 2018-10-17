$(function(){

  $('.click-test-button').click(function(){
    swal ( "Success" ,  "You are success!" ,  "success" )
  })

  $( document ).ready(function() {
    console.log( "ready!" );
    $('body').append(`
  <div class="product-notification" style="position:fixed;
    width:340px;
    height:70px;
    left:5px;
    opacity:0;
    bottom:5px;
    z-index:99999;
    background:rgba(39, 39, 39, 0.72);
    transition: all 0.6s;">
  </div>`);
  });


  setInterval(function(){
    $('div.product-notification').css({opacity:"1",bottom:"5px"});
    setTimeout(function(){
      $('div.product-notification').css({opacity:"0",bottom:"-75px"});
    }, 5000);
  }, 20000);

})
