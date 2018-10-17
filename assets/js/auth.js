$(function() {
  /* LOGIN FORM */
  $('#login-form-submit').submit(function (e) {
    e.preventDefault();
    let data = $(this).serializeObject();
    socket.post('/auth/local',data, function(result){
      // console.log('/auth/local', result);
      let { error, location, user } = result;

      // Authenticated
      if(user && location) {
        window.location = location;
      }

      // Show errors
      if(Array.isArray(error) && error.length > 0) {
        error.map(item => noty({ text: item, type: 'error' }));
      }
    });
  });

  /* REGISTER FORM */
  $('#register-form-submit').submit(function (e) {
    e.preventDefault();
    let data = $(this).serializeObject();
    socket.post('/user/register',data, function(result){
      let { error, location, user } = result;
      console.log('register result', result);

      if(user && location) {
        window.location = location;
      }

      if(error){
        return noty({
          text: error,
          type: 'error',
        });
      }
    });
  });

  /* DELETE SELLER */
  $('#seller-page a.del-seller-button').click(function(){
    let sellerId = $(this).parents('tr').find('td.sellerId').text();
    $(this).parents('tr').fadeOut('slow');
    $('#seller-page-notice').html('<div class="alert alert-success"><strong>Success!</strong> Delete a user.</div>');
    console.log('del seller '+sellerId)
    $.get('/')
  })

})
