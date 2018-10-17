$(function() {

  function createSaveData(){
    let saveData = {
      savingName: $('input[name=save-name]').val().trim(),
      shopName: $('#details-section select[name=shop]').val().trim(),
      savingToggle: $('#toggle_event_editing .btn-info').text().trim(),
      savingTitle: $('#details-section input[name=title]').val().trim(),
      savingTags: $('#details-section input[name=tags]').val().trim(),
      // This is all data
      data: $('input, textarea, select').serializeObject(),
    };
    let items = [];
    $('#details-section .ready-to-post').each(function(){
      // This is fix the itemDefault when user delete
      let itemDefault = $(this).find('span.is-default-color').css('background-color');

      if(!itemDefault){
        //select-color-mockup
        let firstBg = $(this).find('span.select-color-mockup')[0];
        itemDefault = $(firstBg).css('background-color');
        console.log('user delete the default color auto get the default when save', itemDefault);
      }

      let item = {
        itemID: $(this).find('span.materialId').text().trim(),
        itemFrontImg: $(this).find('span.frontImg').text().trim(),
        itemBackImg: $(this).find('span.backImg').text().trim(),
        itemMin: $(this).find('div.min-price .find-min').text().replace('$',''),
        itemName: $(this).find('h4.media-heading').text().trim(),
        itemPrice: $(this).find('input.allprice').val().trim(),
        itemDefault,
        itemTop: $(this).find('span.hideTop').text().trim(),
        itemLeft: $(this).find('span.hideLeft').text().trim(),
        itemWidth: $(this).find('span.hideWidth').text().trim(),
        itemHeight: $(this).find('span.hideHeight').text().trim()
      };
      let itemColor = [];
      $(this).find('ul.style-color-selector .js-preview-color').each(function(){
        let color = {
          id: $(this).find('span.render-color-id').text().trim(),
          name: $(this).find('span.render-color-name').text().trim(),
          value: $(this).find('span.select-color-mockup').css('background-color')
        };
        itemColor.push(color)
      });
      item.itemColor = itemColor;
      items.push(item);
    });
    saveData.savingItems = items;
    console.log(saveData);
    return saveData;
  }

  $('form#save-campaign').on('submit',function(e){
    e.preventDefault();
    console.log('saving new settings');
    $('#mySavingModal').modal('hide');
    let saveData = createSaveData();
    console.log('saveData', saveData);
    socket.post('/save/campaign',saveData, function() {
      noty({ text: 'Settings created', type:'success' })
    });
  });

  // socket.on('save/setting',function(recieve){
  //   $('#mySavingModal').modal('hide');
  //   $('#details-section .section-notification').prepend('<div class="alert alert-success"><strong>Success!</strong> ' +
  //     'Saving this setting for later.</div>')
  // });

  $('#loadSettingModal .delete-setting').on('click', function() {
    var r = confirm("You are delete a setting!");
    if (r == true) {
      let settingID = $(this).parents('tr.save-tr').find('td.save-id').text().trim();
      $('#save-id-' + settingID).fadeOut('slow')
      socket.get('/save/delete?id=' + settingID, function() {
        noty({ text: 'Settings deleted', type:'success' })
      });
    }
  })

  $('#update-current-settings').on('click', function() {
    var r = confirm("You are update a setting!");
    if (r == true) {
      let saveData = createSaveData();
      let id = $(this).data('id');
      console.log('id', $(this).data('id'));
      console.log('saveData', saveData);
      socket.post('/save/update?id=' + id, saveData, function(){
        noty({ text: 'Settings updated', type:'success' })
      });
    }
  })


  if(
    window.location.pathname == '/save/get'
    // @todo will remove save/get
    || (window.location.pathname == '/product/design'  &&  getParam('saveId'))
  ) {
    console.log('inside ready to post');
    $('.ready-to-post').each(function(){
      let price = parseFloat($(this).find('input.allprice').val());
      let mincost = parseFloat($(this).find('tr.size-price-checked:first td.basecost').text().replace('$',''))
      let profitCalc = parseFloat(price - mincost);

      $(this).find('td.profit').text('$'+profitCalc);
      $(this).find('p.estimate-profit').text('$'+profitCalc);

      $(this).find('tr.size-price-checked').each(function() {
        let baseCost = parseFloat($(this).find('td.basecost').text().replace('$',''));
        let sizePrice = parseFloat(profitCalc + baseCost).toFixed(2);
        $(this).find('input.same-price').val(sizePrice);
      })
    });

    $('.choose-variant-detail .choose-product-mockup .js-preview-color').each(function(){
      let findColorID = $(this).find('span.define-color-id').text();
      $('li#color-id-'+findColorID+' .add-check').removeClass('select-color-mockup').addClass('is-selected');
    })
  }

});
