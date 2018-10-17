$(function(){

  let serviceRate = [
    'ParcelsGroundDomestic',
    'ParcelPlusGroundDomestic',
    'ParcelsExpeditedDomestic',
    'ParcelPlusExpeditedDomestic',

    'DHLPacketInternationalStandard',
    'DHLPacketInternationalPriority',
    'DHLPacketISAL',
    'DHLParcelInternationalPriority',
    'DHLParcelInternationalStandard',
    'DHLParcelDirectInternationalPriority',

    'parcelConnectPriorityDDU'
  ]
  let errorCount = 0;
  $('.dhl-service').each(function(){
    let serive = $(this).text();
    if(serviceRate.includes(serive) === true) {
      $(this).css('color','#4CAF50')
    } else {
      errorCount += 1;
      // $(this).parents('tr').css('background','rgba(244, 67, 54, 0.19)');
      // $(this).parents('tr').find('td').css('color','#F44336')
      $(this).css('color','#F44336')
    }
  });
  $('p.error_count strong').text(errorCount);


  $('button.GenerateManifest').click(function(){
    $(this).attr('disabled',true);
    $(this).find('i.fa').addClass('fa-spinner fa-spin');
    $('div.progress-bar').css('width','10%').text('10%');
    socket.get('/order/create_scan_form?type=GroundDomestic',function(result1){
      console.log('result1', result1);
      $('div.progress-bar').css('width','33%').text('33%');
      socket.get('/order/create_scan_form?type=PacketInternational',function(result2){
        console.log('result2', result2);
        $('div.progress-bar').css('width','66%').text('66%');
        socket.get('/order/create_scan_form?type=DDU',function(result3){
          console.log('result3', result3);
          $('div.progress-bar').css('width','99%').text('99%');
          $(this).find('i.fa').removeClass('fa-spinner fa-spin').addClass('fa-check');
          $('div.progress-bar').css('width','100%').text('100%');
          setTimeout(function(){
            location.reload();
          }, 2000);
        });
      });
    });
  });


  $('a.create_manifest').click(function(){
    let batchId = $(this).data('id');
    console.log('text 1', $(this).text());
    $(this).html(`<i class="fa fa-spinner fa-pulse"></i> Creating...`);
    $(this).attr('disabled',true)

    socket.get(`/order/easypost_manifest?id=${batchId}`,function(result){
      if(result.error){ return false }
      console.log('result 1', result);
      $(`a[data-id=${batchId}]`).html(`<i class="fa fa-check"></i> Created`);
      console.log('text 2', $(`a[data-id=${batchId}]`).text());
    })
  })
})
