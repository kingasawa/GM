$(function() {
  // $('#product-pricing a.view-products-button').click(function(){
  //   $(this).addClass('active');
  //   $('#product-pricing a.view-pricing-button').removeClass('active')
  // })
  //
  // $('#product-pricing a.view-pricing-button').click(function(){
  //   $(this).addClass('active');
  //   $('#product-pricing a.view-products-button').removeClass('active')
  // })

  //About Gearment
  $.get( "https://dashboard.gearment.com/wp-json/wp/v2/pages?slug=about-gearment&fields=title,content", function( data ) {
    let title = data[0].title.rendered
    let content = data[0].content.rendered;
    $('.about-title').html(title)
    $('.about-content').html(content)
  });

  //FAQs
  $.get( "https://dashboard.gearment.com/wp-json/wp/v2/pages?slug=faqs&fields=content", function( data ) {
    let content = data[0].content.rendered;
    $('.faq-section .faq-content').html(content)
  });

  //TOS
  $.get( "https://dashboard.gearment.com/wp-json/wp/v2/pages?slug=terms-of-service&fields=content", function( data ) {
    let content = data[0].content.rendered;
    $('.terms-section .tos-content').html(content)
  });

  //PRIVACY POLICY
  $.get( "https://dashboard.gearment.com/wp-json/wp/v2/pages?slug=privacy-policy&fields=content", function( data ) {
    let content = data[0].content.rendered;
    $('.privacy-section .privacy-content').html(content)
  });

})
