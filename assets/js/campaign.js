let ENABLE_BULK_UPLOAD;
let AUTO_RESIZE = true;
let PRODUCT_VIEW_URL;
let DISABLE_AUTO_RESIZE = true;
let lazyDesign;
let MATERIAL_FRONT_SIDE = 1; //true
let findTop;
let findLeft;
let findBackTop;
let findBackLeft;
let SMALL_FRAME = { width:224,height:298 }
let BIG_FRAME = { width:245,height:326 }


$(function() {
  var socket = io.socket;
  ENABLE_BULK_UPLOAD = $('[name=enable-bulk-upload]').prop('checked');
  PRODUCT_VIEW_URL = `${baseUrl}/${PRODUCT_VIEW_CONTROLLER}`;

  console.log('ENABLE_BULK_UPLOAD', ENABLE_BULK_UPLOAD);

  $(document).ready(function() {


    //COUNT VARIANT IN SELECT STYLE
    if(window.location.pathname == '/product/design') {
      $('#chooseProductModal').modal('show');
      // auto load the first material icon
      if($('.define-front-img .material-icon'))
        $('.define-front-img .material-icon')[0].click();

      let totalVariantCount = 0;
      $('.choose-variant-detail .choose-product-mockup').each(function(){
        let mockupId = $(this).find('span.define-mockup-id').text();
        let mockupSizeLength = $('#mockup-id-'+mockupId+' span.size-range').text().split('-').length - 1;
        let countColor = $('.selected-mockup-id-'+mockupId+' .select-color-mockup').length;
        let countVariants = mockupSizeLength*countColor;
        totalVariantCount += countVariants;
        // console.log(countVariants)
        $('.selected-mockup-id-'+mockupId+' p.selected-variants-count strong').text(countVariants);
        $('span.total-variants-count strong').text(totalVariantCount);
      })


      // $('span.total-variants-count strong').text(defaultMockupSizeLength);
    }
  });

  //PRODUCT SELECT PAGE
  $('body').on('click', '.mockup-sample-section li.js-preview-color a', function() {
    console.log('click mockup-sample-section li.js-preview-color');
    let checkLimitOne = $('.choose-variant-detail span.select-color-mockup').length;
    var selectColor = $(this).find('span').css('background-color');
    var colorId = $(this).parent('.js-preview-color').find('span.define-color-id').text();
    var colorName = $(this).parent('.js-preview-color').find('span.define-color-name').text();
    var minPay = $(this).parents('.mockup-sample-section').find('span.define-minPay').text();
    var findMockupId = $(this)
      .closest('.mockup-sample-section')
      .find('span.define-mockup-id')
      .text();
    var sizeLength = $('#mockup-id-'+findMockupId+' span.size-range').text().split('-').length - 1;
    findTop = $(this).closest('.mockup-sample-section').find('span.define-top').text();
    findLeft = $(this).closest('.mockup-sample-section').find('span.define-left').text();
    findBackTop = $(this).closest('.mockup-sample-section').find('span.define-back-top').text();
    findBackLeft = $(this).closest('.mockup-sample-section').find('span.define-back-left').text();
    var mockupName = $(this).closest('.mockup-sample-section').find('h5').text();
    var mockupImg = $(this)
      .closest('.mockup-sample-section')
      .find('img.material-front-img')
      .attr('src');
    var mockupBackImg = $(this)
      .closest('.mockup-sample-section')
      .find('img.material-back-img')
      .attr('src');


    if ($(this).find('span').hasClass('select-color-mockup')) {
      let currentTotalVariant = parseInt($('span.total-variants-count strong').text());
      let newTotalVariant = sizeLength+currentTotalVariant;
      $('span.total-variants-count strong').text(newTotalVariant);
      console.log('add is-selected 1');
      $(this)
        .find('span.select-color-mockup')
        .removeClass('select-color-mockup')
        .addClass('is-selected');
      $('ul.define-front-img')
        .append(`<li style="margin-right:5px" class="js-preview-product" id="preview-color-id-${findMockupId}_${colorId}">
          <a href="#">
          <span class="sr-only mockup-name">${mockupName}</span>
          <span class="sr-only mockup-id">${findMockupId}</span>
          <img class="material-icon material-front-side" data-id="${mockupImg.match(/[a-z0-9]{30,}/)[0]}" style="background-color:${selectColor}" src="${mockupImg}"></a></li>`);

      $('ul.define-back-img')
        .append(`<li style="margin-right:5px" class="js-preview-product" id="preview-color-id-${findMockupId}_${colorId}">
          <a href="#">
          <span class="sr-only mockup-name">${mockupName}</span>
          <span class="sr-only mockup-id">${findMockupId}</span>
          <img class="material-icon material-back-side" data-id="${mockupBackImg.match(/[a-z0-9]{30,}/)[0]}" style="background-color:${selectColor}" src="${mockupBackImg}"></a></li>`);

      if ($('.choose-variant-detail .choose-product-mockup')
          .hasClass('selected-mockup-id-' + findMockupId)) {
        $('.selected-mockup-id-' + findMockupId + ' ul')
          .append('<li class="js-preview-color" id="color-id-' +
                  colorId +
                  '">' +
                  '<span class="define-color-id sr-only">' +
                  colorId +
                  '</span><a href="#" >' +
                  '<span class="select-color-mockup" style="background-color:' +
                  selectColor +
                  '"></span>' +
                  '</a></li>');

        let currentVariantCount = parseInt($('.selected-mockup-id-'+findMockupId+' p.selected-variants-count strong').text());
        let newVariantCount = currentVariantCount + sizeLength;
        $('.selected-mockup-id-'+findMockupId+' p.selected-variants-count strong').text(newVariantCount);

        $('.render-product-id-' + findMockupId + ' ul')
          .append('<li class="js-preview-color" id="color-id-' +
                  colorId +
                  '">' +
                  '<span class="sr-only render-color-id">' +
                  colorId +
                  '</span>' +
                  '<span class="render-color-name sr-only">' +
                  colorName +
                  '</span><a href="#" >' +
                  '<span class="select-color-mockup no-default" style="background-color:' +
                  selectColor +
                  '"></span>' +
                  '</a></li>')
      } else {
        $('.choose-variant-detail')
          .append('<div class="media choose-product-mockup selected-mockup-id-' +
                  findMockupId +
                  '"><span></span>' +
                  '<span class="define-mockup-id sr-only">' +
                  findMockupId +
                  '</span><div class="media-left"><img src="' +
                  mockupImg +
                  '" class="media-object" style="width:90px"></div>' +
                  '<div class="media-body">' +
                  '<button style="color:#a94442;opacity:0.6" data-toggle="tooltip" title="Remove this style" type="button" class="close remove-one-style">&times;</button>' +
                  '<h5 class="media-heading">' +
                  mockupName +
                  '</h5>' +
                  '<p class="selected-variants-count">Variants: ' +
                  '<strong style="color:#5cb85c">'+sizeLength+'</strong></p>' +
                  '<ul class="style-color-selector">' +
                  '<li class="js-preview-color" id="color-id-' +
                  colorId +
                  '"><span class="define-color-id sr-only">' +
                  colorId +
                  '</span>' +
                  '<a href="#"><span class="select-color-mockup" style="background-color:' +
                  selectColor +
                  '"></span></a></li>' +
                  '</ul></div></div>');

        let showfront = 'sr-only';
        let showback = 'image-is-selected';
        let activefront = '';
        let activeback = 'active-image';
        if($('.select-side-toggle span').text() == 'Show back'){
          showfront = 'image-is-selected';
          showback = 'sr-only';
          activefront = 'active-image';
          activeback = '';
        }

        console.log('showfront',showfront);
        console.log('showback',showback);
        console.log('activefront',activefront);
        console.log('activeback',activeback);
        $('#details-section #accordion').append(`
          <div class="ready-to-post panel panel-default render-product-id-${findMockupId}">
          <span class="sr-only materialId">${findMockupId}</span>
          <span class="sr-only frontImg ${activefront}">${mockupImg}</span>
          <span class="sr-only backImg ${activeback}">${mockupBackImg}</span>
          <span class="sr-only hideTop">${findTop}</span>
          <span class="sr-only hideLeft">${findLeft}</span>
          <span class="sr-only hideBackTop">${findBackTop}</span>
          <span class="sr-only hideBackLeft">${findBackLeft}</span>
          
          <div class="panel-heading"><div class="media"><div class="media-left">
          <img class="front-image ${showfront}" src="" class="media-object">
          <img class="back-image ${showback}" src="" class="media-object" style="max-width:160px;width:160px"><p class="variant-count"><strong></strong> variant(s)</p>
          </div><div class="media-body"><h4 class="media-heading"><a data-toggle="" data-parent="#accordion" href="#mockup${findMockupId}">${mockupName}</a></h4>
          <p><ul class="style-color-selector"><li class="js-preview-color" id="color-id-${colorId}">
          <span class="sr-only render-color-id">${colorId}</span>
          <span class="render-color-name sr-only">${colorName}</span>
          <a href="#"><span class="select-color-mockup is-default-color" style="background-color:${selectColor}"></span></a></li></ul></p>
          <div class="set-price form-group"><label class="control-label" for="price">SELL FOR</label><input type="text" class="allprice form-control" value="${minPay}"></div>
          <div class="min-price"><span>MINIMUM PRICE: </span><span class="find-min"></span></div>
          <div class="sr-only profit"><span>PROFIT <i data-toggle="tooltip" title="INCLUDES ALL PROCESSING FEES. ADDITIONAL FEES MAY APPLY WHEN PAYING OUT YOUR PROFITS OUTSIDE US." class="fa fa-info-circle"></i></span><p class="estimate-profit"></p></div>
          <p class="check-min-price"></p></div></div></div>
          <div id="mockup${findMockupId}" class="panel-collapse collapse">
          <div class="panel-body"><form class="post-product-shopify"><div class="range-size-price">
          <table class="table"><tbody><tr class="size-all-checked"><td><input id="select-all" type="checkbox" checked></td><td>Size</td><td>Base Cost</td><td>Price</td><td>Profit</td></tr></tbody></table></div>
          </form></div></div></div>`);

        $('#tags').tagsinput();
        $('[data-toggle="tooltip"]').tooltip();
        // CKEDITOR.replace('richText'+findMockupId);
        socket.get('/scp/getsize?id=' + findMockupId);

      }

    } else {
      if(checkLimitOne == 1) {
        noty({
          text: `<b>Warning!</b> 
        <div>Cannot remove the last variant!</div>`,
          type: 'warning',
        });
        return false;
      }

      let currentTotalVariant = parseInt($('span.total-variants-count strong').text());
      let currentVariantCount = parseInt($('.selected-mockup-id-'+findMockupId+' p.selected-variants-count strong').text());
      let newTotalVariant = currentTotalVariant - sizeLength;
      let newVariantCount = currentVariantCount - sizeLength;
      $('.selected-mockup-id-'+findMockupId+' p.selected-variants-count strong').text(newVariantCount);
      $('span.total-variants-count strong').text(newTotalVariant);
      $(this).find('span').removeClass('is-selected').addClass('select-color-mockup');
      $('.define-front-img #preview-color-id-' + findMockupId + '_' + colorId).remove();
      $('.define-back-img #preview-color-id-' + findMockupId + '_' + colorId).remove();

      if ($('.render-product-id-' +
            findMockupId +
            ' li#color-id-' +
            colorId +
            ' span.select-color-mockup').hasClass('is-default-color')) {
        $('.render-product-id-' + findMockupId + ' span.no-default:first')
          .addClass('is-default-color')
          .removeClass('no-default')
      }

      if ($('.selected-mockup-id-' + findMockupId + ' ul li').length > 1) {

        $('.choose-variant-detail li#color-id-' + colorId).remove();
        $('#accordion li#color-id-' + colorId).remove();
      } else {
        $('.selected-mockup-id-' + findMockupId).remove();
        $('.render-product-id-' + findMockupId).remove();
        console.log('remove ' + findMockupId + '_' + colorId);

      }
    };
    let checkTotalVariant = parseInt($('span.total-variants-count strong').text());
    if(checkTotalVariant>100){
      $('span.total-variants-count').css('color','#a94442');
      noty({
        text: `<b>Warning!</b> 
        <div>You choose more than 100 variants!</div>`,
        type: 'warning',
      });

    } else {
      $('span.total-variants-count').css('color','#000');
    }
  });

  //click to remove color
  $('body').on('click', '.choose-product-mockup .select-color-mockup', function() {
    console.log('remove 1');
    let checkLimitOne = $('.choose-variant-detail span.select-color-mockup').length;
    if(checkLimitOne == 1) {
      noty({
        text: `<b>Warning!</b> 
        <div>Cannot remove the last variant!</div>`,
        type: 'warning',
      });
      return false;
    }
    let findMockupID = $(this).parents('.choose-product-mockup').find('.define-mockup-id').text();
    let findColorID = $(this).parents('li.js-preview-color').find('span.define-color-id').text();
    let sizeLength = $('#mockup-id-'+findMockupID+' span.size-range').text().split('-').length - 1;

    let currentTotalVariant = parseInt($('span.total-variants-count strong').text());
    let currentVariantCount = parseInt($('.selected-mockup-id-'+findMockupID+' p.selected-variants-count strong').text());
    let newTotalVariant = currentTotalVariant - sizeLength;
    let newVariantCount = currentVariantCount - sizeLength;
    $('.selected-mockup-id-'+findMockupID+' p.selected-variants-count strong').text(newVariantCount)
    $('span.total-variants-count strong').text(newTotalVariant);

    if ($('li#color-id-' + findColorID + ' span.select-color-mockup')
        .hasClass('is-default-color')) {
      console.log('remove default');
      // $('.selected-mockup-id-'+findMockupID).remove();
      $('.render-product-id-' + findMockupID + ' span.no-default:first')
        .addClass('is-default-color')
        .removeClass('no-default')
    }
    if ($('.selected-mockup-id-' + findMockupID + ' ul li').length > 1) {

      $('.choose-variant-detail li#color-id-' + findColorID).remove();
      $('#accordion li#color-id-' + findColorID).remove();

    } else {
      $('.selected-mockup-id-' + findMockupID).remove();
      $('.render-product-id-' + findMockupID).remove();
      console.log('remove ' + findMockupID + '_' + findColorID);
    }

    $(this).parents('li#color-id-' + findColorID).remove();
    $('li#color-id-' + findColorID + ' span.is-selected')
      .addClass('select-color-mockup')
      .removeClass('is-selected');

    $('#user-design-section li#preview-color-id-' + findMockupID + '_' + findColorID).remove();
    $('#details-section li#color-id-' + findColorID).remove();

  });

  socket.on('load/allsize', function(get) {
    let getSize = get.msg.size;
    for (var i = 0; i < getSize.length; i++) {
      $('.render-product-id-' + get.msg.material + ' .range-size-price table tbody').append(`<tr class="size-price-checked checked-or-not"><td><input class="select-one" type="checkbox" checked></td>
      <td class="each-size-name" style="font-weight:bold;">${getSize[i].size}</td>
      <td class="basecost">$${getSize[i].price}</td>
      <td>$ <input style="height:30px" class="each-size-value same-price" type="text" class="form-control" name="size${getSize[i].size}"></td><td class="profit"></td></tr>`)
    }

  });


  window.validateCanvasDesign = function() {
    if (
      (ENABLE_BULK_UPLOAD === false && canvas && canvas.getObjects().length === 0)
      || ENABLE_BULK_UPLOAD === true && totalBulkDesignImages === ''
    ) {
      if (canvas && canvas.getObjects().length === 0) {
        let errorMsg = 'You are not choose a design image';
        $('#designMissingModal p.error-content').html(errorMsg);
        $('#designMissingModal').modal();
        throw errorMsg;
        // return false;
      }
    }
  }
  // Step 2
  window.showStep2 = function({ createSettings = false }) {
    // Auto check create settings
    if (getParam('show') === 'settings') {
      createSettings = true;
    }

    if(ENABLE_BULK_UPLOAD === false &&
       createSettings === false &&
       canvas.getObjects().length === 0
    ){
      noty({
        text: 'Please choose your design!', type:'error'
      });
      return false;
    }

    prepareStep2Data();
    showStep2UI();

    return true;
  }
  window.prepareStep2Data = function() {

    let dataUrl = $('#details-section .url-render').text();
    let findUrl;
    let findDesignWidth;
    let findDesignHeight;
    let findDesignTop;
    let findDesignLeft;

    console.log('dataUrl step 2', dataUrl);
    // console.log('findUrl', findUrl);

    if (dataUrl !== "") {
      findUrl = dataUrl.split('&');
      console.log('findUrl', findUrl);
    }

    let allVariant = 0;
    $('.ready-to-post').each(function() {
      // count variant

      let chooseWhich = $('span.choose-which').text();
      let countColor = $(this).find('.js-preview-color').length;
      let countSize = $(this).find('table tr.size-price-checked').length;
      let countVariant = parseInt(countColor*countSize);
      $(this).find('p.variant-count strong').text(countVariant);
      allVariant = allVariant + countVariant;

      let readyToPost = this;
      // Get materialId
      let materialId = $(this).find('span.materialId').text();

      console.log('materialId', materialId);
      // build image
      let defaultColor = $(this).find('span.is-default-color').css('background-color');
      console.log('defaultColor', defaultColor);
      if (!defaultColor) {
        //select-color-mockup
        let firstBg = $(this).find('span.select-color-mockup')[0];
        defaultColor = $(firstBg).css('background-color');
      }
      let defaultImg = $(this).find('span.active-image').text().match(/[a-z0-9]{30,}/)[0];
      console.log('defaultImg', defaultImg);
      // edit the logo design
      let rebuildUrl;
      // @TODO remove all when bulk
      if ( ENABLE_BULK_UPLOAD === false && dataUrl) {
        let findLogoX = parseInt(findUrl[1].replace('logoWidth=', '')-2) || 0;
        let findLogoY = parseInt(findUrl[2].replace('logoHeight=', '')-2) || 0;
        let wh = findLogoX/findLogoY;

        let findY = parseInt(findUrl[3].replace('topY=', '')) +2 || 0;
        let findX = parseInt(findUrl[4].replace('leftX=', '')) +2 || 0;
        let frameType = $(`#mockup-id-${materialId} span.define-frame-type`).text();
        // let mockupHeight = parseInt($(`#mockup-id-${materialId} span.define-height`).text());
        let mockupWidth = BIG_FRAME.width;
        let mockupHeight = BIG_FRAME.height;
        let mockupScale = 1;
        if(frameType !== '1' && chooseWhich == 'choose-back'){
          mockupWidth = SMALL_FRAME.width;
          mockupHeight = SMALL_FRAME.height;
          mockupScale = 1.09375;
        }
        if (materialId == 18 && chooseWhich == 'choose-back'){
          mockupWidth = 216;
          mockupHeight = 288;
          mockupScale = 1.13425;
        }
        if (materialId == 4 && chooseWhich == 'choose-front'){
          mockupWidth = 200;
          mockupHeight = 266;
          mockupScale = 1.12;
        }
        //
        // console.log('findLogoX', findLogoX);
        // console.log('findLogoY', findLogoY);
        // console.log('wh', wh);
        console.log('mockupScale', mockupScale);
        let findLogo = findUrl[5].replace('logo=', '');
        let hideTop = parseInt($(this).find('span.hideTop').text());
        let hideLeft = parseInt($(this).find('span.hideLeft').text());
        let hideBackTop = parseInt($(this).find('span.hideBackTop').text());
        let hideBackLeft = parseInt($(this).find('span.hideBackLeft').text());

        let findScaleX = findUrl[6].replace('scaleX=', '') || 0;
        let findScaleY = findUrl[7].replace('scaleY=', '') || 0;
        let findLeft = parseInt(findUrl[8].replace('designLeft=', '')) || 0;
        let findTop = parseInt(findUrl[9].replace('designTop=', '')) || 0;

        // findLeft *= findScaleX;
        // findTop *= findScaleY;

        let leftX = hideLeft;
        let topY = hideTop;
        if(chooseWhich == 'choose-back'){
          leftX = hideBackLeft;
          topY = hideBackTop;
        }

        // Get the image size auto in the frame
        // @TODO tmr working
        //

        //
        findDesignWidth = findLogoX / mockupScale;
        findDesignHeight = findLogoY / mockupScale;
        findDesignTop = parseInt(topY + findY);
        findDesignLeft = parseInt(leftX + findX);

        //Auto get the size in the material

        if(DISABLE_AUTO_RESIZE === false && AUTO_RESIZE) {
          socket.get('/product/calculate', {
            material: materialId,
            design: findLogo
          }, function(data) {
            let { material, design, top, left, width, height } = data;
            console.log('calculated data', data);
            rebuildUrl =
              `${findUrl[0]}&logoWidth=${width}&logoHeight=${height}&topY=${top}&leftX=${left}&${findUrl[5]}`;
            findUrl[0] +

            '&topY=' + top + '&leftX=' + left + '&' + findUrl[5];

            let defaultImage = rebuildUrl + '&material=' + defaultImg + '&color=' + defaultColor;

            $(readyToPost).find('img.image-is-selected').attr('src', defaultImage);
          });
        }else{
          //@TODO This is very buggy, prompt user to use automatic resize instead
          rebuildUrl =
            findUrl[0] +
            '&logoWidth=' +findDesignWidth+
            '&logoHeight=' +findDesignHeight+
            '&topY=' +findDesignTop+
            '&leftX=' +findDesignLeft+
            '&' +findUrl[5];

          let defaultImage = rebuildUrl + '&material=' + defaultImg + '&color=' + defaultColor;

          $(readyToPost).find('img.image-is-selected').attr('src', defaultImage);
        }
      } else {
        rebuildUrl = `${PRODUCT_VIEW_URL}?1=1`;

        let defaultImage = rebuildUrl + '&material=' + defaultImg + '&color=' + defaultColor;
        $(this).find('img.image-is-selected').attr('src', defaultImage);
      }


      // set all price - profit
      let price = parseFloat($(this).find('input.allprice').val());
      let mincost = parseFloat($(this)
        .find('tr.size-price-checked:first td.basecost')
        .text()
        .replace('$', ''));
      let profitCalc = parseFloat(price - mincost);
      $(this).find('div.min-price .find-min').text('$' + mincost);
      $(this).find('td.profit').text('$' + parseFloat(profitCalc).toFixed(2));
      $(this).find('p.estimate-profit').text('$' + parseFloat(profitCalc).toFixed(2));

      $(this).find('tr.size-price-checked').each(function() {
        let baseCost = parseFloat($(this).find('td.basecost').text().replace('$', ''));
        let sizePrice = parseFloat(profitCalc + baseCost);
        $(this).find('input.same-price').val(parseFloat(sizePrice).toFixed(2));
      })
    });

    let togglebutton = $('#toggle_event_editing button.btn-info').text();
    $('.count-all-variant strong').text(allVariant);

    if (togglebutton == 'ON' && allVariant > 100) {
      $('.count-all-variant').css('color', '#a94442');
      $('.ready-post-button').attr('disabled', true)
    } else if (togglebutton == 'ON' && allVariant <= 100) {
      $('.count-all-variant').css('color', '#3c763d');
      $('.ready-post-button').removeAttr('disabled');
      $('p.count-all-variant').fadeIn('slow');
    } else if (togglebutton == 'OFF' && allVariant > 100) {
      $('.count-all-variant').css('color', '#a94442');
    } else {
      $('.count-all-variant').css('color', '#3c763d');
    }
  }
  window.showStep2UI = function() {
    $('li.design-step-1 a').removeClass('active');
    $('li.design-step-2 a').addClass('active');

    $('#user-design-section').hide();
    $('#details-section').show();
    $('.next-step-2').text('Post product');
    $('button.next-step-2').addClass('ready-post-button').removeClass('next-step-2')
    if($('input[name=title]').val().length == 0){
      $('button.ready-post-button').addClass('disabled');
      $('a.ready-post-button').addClass('disabled');
    }
    $('input[name=title]').on('keyup paste',function(){
      if($(this).val() !== ''){
        $('button.ready-post-button').removeClass('disabled');
        $('a.ready-post-button').removeClass('disabled');
        $(this).css('border','1px solid #ccc')
      } else {
        $('button.ready-post-button').addClass('disabled');
        $('a.ready-post-button').addClass('disabled');
        $(this).css('border','1px solid #a94442')
      }
    })
  }
  // Step 1
  window.backStep1UI = function() {
    $('div.reload-remove-default input[name=mockup-default]').remove();
    $('li.design-step-1 a').addClass('active');
    $('li.design-step-2 a').removeClass('active');
    $('#user-design-section').show();
    $('#details-section').hide();
    $('button.ready-post-button').text('Next Step');
    $('button.ready-post-button').removeClass('ready-post-button').addClass('next-step-2')
    if(canvas.getObjects().length !== 0){
      $('.next-step-2').removeClass('disabled')
    }
  }

  //Click button to back/next step
  $('button.next-step-2').click(function(){
    let currentActive = $('.process-arrow').find('.active').data('step');
    if(currentActive == 1){
      showStep2({});
    }
    else{
      $('a.ready-post-button').click();
    }
  });
  $('a.to-step-2').click(function(){
    if($('.next-step-2 ').hasClass('disabled') == false){
      showStep2({});
    }
  });
  $('a.back-step-1').click(backStep1UI);

  //click one to choose default color
  $('body').on('click', '#details-section span.select-color-mockup', function() {
    $(this).parents('.ready-to-post').find('.select-color-mockup').removeClass('is-default-color');
    $(this).addClass('is-default-color');
    let colorDefault = $(this).css('background-color');
    let resetDefault = $(this)
      .parents('.ready-to-post')
      .find('img.image-is-selected')
      .attr('src')
      .split('&color=')[0];
    $(this)
      .parents('.ready-to-post')
      .find('img.image-is-selected')
      .attr('src', resetDefault + '&color=' + colorDefault)
  });


  //Toggle on/off group product
  $('#toggle_event_editing button').click(function() {
    if ($(this).hasClass('locked_active') || $(this).hasClass('unlocked_inactive')) {
      /* code to do when unlocking */
      $('#switch_status span').html('Each one style is a product.');
      $('.ready-post-button').removeAttr('disabled');
      $('p.count-all-variant').fadeOut('slow');
    } else {
      /* code to do when locking */
      $('#switch_status span').html('Group all style as a single product.');
      $('p.count-all-variant').fadeIn('slow');
      if (parseInt($('p.count-all-variant strong').text()) > 100) {
        $('.ready-post-button').attr('disabled', true)
      } else {
        $('.ready-post-button').removeAttr('disabled')
      }
    }

    /* reverse locking status */
    $('#toggle_event_editing button')
      .eq(0)
      .toggleClass('locked_inactive locked_active btn-default btn-info');
    $('#toggle_event_editing button')
      .eq(1)
      .toggleClass('unlocked_inactive unlocked_active btn-info btn-default');
  });

  //select all size

  $('body').on('click', '#select-all', function() {

    let countColor = $(this).parents('.ready-to-post').find('.js-preview-color').length;

    let togglebutton = $('#toggle_event_editing button.btn-info').text();
    let currentCount = parseInt($(this)
      .parents('.ready-to-post')
      .find('p.variant-count strong')
      .text());
    let currentAllCount = parseInt($('p.count-all-variant strong').text());

    if (this.checked) {
      let countSize = $(this).parents('.ready-to-post').find('tr.size-not-checked').length;
      let countVariant = parseInt(countSize*countColor);

      $('p.count-all-variant strong').text(currentAllCount + countVariant);
      $(this)
        .parents('.ready-to-post')
        .find('p.variant-count strong')
        .text(currentCount + countVariant);
      // Iterate each checkbox
      $(this)
        .parents('tbody')
        .find('tr.checked-or-not')
        .addClass('size-price-checked')
        .removeClass('size-not-checked');
      $(this).parents('tbody').find(':checkbox').each(function() {
        this.checked = true;
      });
    } else {
      let countSize = $(this).parents('.ready-to-post').find('tr.size-price-checked').length;
      let countVariant = parseInt(countSize*countColor);

      $('p.count-all-variant strong').text(currentAllCount - countVariant);
      $(this)
        .parents('.ready-to-post')
        .find('p.variant-count strong')
        .text(currentCount - countVariant);

      $(this)
        .parents('tbody')
        .find('tr.checked-or-not')
        .removeClass('size-price-checked')
        .addClass('size-not-checked');
      $(this).parents('tbody').find(':checkbox').each(function() {
        this.checked = false;
      });
    }
    let newAllCount = parseInt($('p.count-all-variant strong').text());
    if (togglebutton == 'ON' && newAllCount > 100) {
      $('.count-all-variant').css('color', '#a94442');
      $('.ready-post-button').attr('disabled', true)
    } else {
      $('.count-all-variant').css('color', '#3c763d');
      $('.ready-post-button').removeAttr('disabled')
    }
  });

  $('.define-mockup-description').text().replace(/&lt;/g, '<').replace(/&lt;/g, '>');

  $('body').on('click', '.select-one', function() {
    var countColor = $(this).parents('.ready-to-post').find('.js-preview-color').length;

    let togglebutton = $('#toggle_event_editing button.btn-info').text();
    let currentCount = parseInt($(this)
      .parents('.ready-to-post')
      .find('p.variant-count strong')
      .text());
    let currentAllCount = parseInt($('p.count-all-variant strong').text());
    if (this.checked) {
      // Iterate each checkbox

      $('p.count-all-variant strong').text(currentAllCount + countColor);
      $(this)
        .parents('.ready-to-post')
        .find('p.variant-count strong')
        .text(currentCount + countColor);
      $(this)
        .parents('tr.checked-or-not')
        .addClass('size-price-checked')
        .removeClass('size-not-checked');
    } else {

      $('p.count-all-variant strong').text(currentAllCount - countColor);
      $(this)
        .parents('.ready-to-post')
        .find('p.variant-count strong')
        .text(currentCount - countColor);
      $(this)
        .parents('tr.checked-or-not')
        .removeClass('size-price-checked')
        .addClass('size-not-checked');
    }
    let newAllCount = parseInt($('p.count-all-variant strong').text());
    if (togglebutton == 'ON' && newAllCount > 100) {
      $('.count-all-variant').css('color', '#a94442');
      $('.ready-post-button').attr('disabled', true)
    } else {
      $('.count-all-variant').css('color', '#3c763d');
      $('.ready-post-button').removeAttr('disabled')
    }
  });

  //get size from click id
  // $('.ready-to-post a').click(function(){
  //   let getId = $(this).find('span.get-mockup-id').text();
  //   console.log(getId);
  // });

  //Remove all variant in this style
  $('body').on('click','button.remove-one-style',function(){
    let countStyle = $('.choose-product-mockup').length;
    if(countStyle == 1){
      noty({
        text: `<b>Warning!</b> 
        <div>Cannot remove the last Style!</div>`,
        type: 'warning',
      });
      return false;
    } else {
      $(this).parents('div.choose-product-mockup').find('ul.style-color-selector li').each(function(){
        let findColorID = $(this).attr('id');
        $('li#'+findColorID+' a').click()
      });
    }
  })
  //show back/front image
  $('body').on('click', '.show-back-toggle', function(e) {
    // $('canvas#tcanvas').attr({'width':230,'height':300}).css({'width':230,'height':300});
    // $('canvas.upper-canvas').attr({'width':230,'height':300}).css({'width':230,'height':300});
    $('button#remove-selected').click();
    e.preventDefault();
    MATERIAL_FRONT_SIDE=0;
    $('#details-section span.choose-which').text('choose-back');
    $(this).find('span').text('Show front');
    $(this).addClass('show-front-toggle').toggleClass('show-back-toggle');
    $('ul.define-front-img').addClass('sr-only');
    $('ul.define-back-img').removeClass('sr-only');
    $('.define-back-img .material-icon')[0].click();
    $('#details-section img.front-image').addClass('sr-only').removeClass('image-is-selected');
    $('#details-section img.back-image').removeClass('sr-only').addClass('image-is-selected');
    $('.frontImg').removeClass('active-image');
    $('.backImg').addClass('active-image');

    return false;
  });

  $('body').on('click', '.show-front-toggle', function(e) {

    // $('canvas#tcanvas').attr({'width':210,'height':260}).css({'width':210,'height':260});
    // $('canvas.upper-canvas').attr({'width':210,'height':260}).css({'width':210,'height':260})
    $('button#remove-selected').click();
    e.preventDefault();
    MATERIAL_FRONT_SIDE=1;
    $('#details-section span.choose-which').text('choose-front');
    $(this).find('span').text('Show back');
    $(this).addClass('show-back-toggle').toggleClass('show-front-toggle');
    $('ul.define-back-img').addClass('sr-only');
    $('ul.define-front-img').removeClass('sr-only');
    $('.define-front-img .material-icon')[0].click();
    $('#details-section img.back-image').addClass('sr-only').removeClass('image-is-selected');
    $('#details-section img.front-image').removeClass('sr-only').addClass('image-is-selected');
    $('.backImg').removeClass('active-image');
    $('.frontImg').addClass('active-image');

    return false;
  });

  $('select[name=shop]').on('change', function() {
    if ($(this).val() == 'choose-shop') {
      $(this).css('border', '2px solid #a94442');
    } else {
      $(this).css('border', '2px solid #5cb85c')
    }
  });

  $('body').on('focus', 'input[name=collection]', function() {

    let shopName = $('select[name=shop]');
    let materialId = $(this).parents('.ready-to-post').find('span.materialId').text();
    if (shopName.val() == 'choose-shop') {
      shopName.css('border', '2px solid #a94442');
      shopName.focus();
    } else {
      $(this).val('loading collection...');
      socket.get('/shopify/custom?pid=' + materialId + '&shop=' + shopName.val())
    }

  });

  socket.on('load/collection', function(recieve) {

    $('input[name=collection]').val('');
    $('div.load-collection-here')
      .html('<select name="collection" class="selectcollection" multiple id="collection"></select>');
    for (var i = 0; i < recieve.msg.custom_collections.length; i++) {
      $('div.load-collection-here select[name=collection]')
        .append('' +
                '<option value="' +
                recieve.msg.custom_collections[i].id +
                '">' +
                recieve.msg.custom_collections[i].title +
                '</option>')
    }
    $('.selectcollection').selectpicker({
      style: 'btn-info',
      size: 4
    });
    $('.bootstrap-select').addClass('open');
  });

  $('body').on('click', 'a.remove-design-button', function() {
    socket.post('/scp/remove?item=design&id=' + $(this).data('id'));
    $('div#' + $(this).data('id')).parents('div.col-sm-3').fadeOut('slow', function() {
      $(this).remove()
    });

  });

  //end button

  $(this).hover(function() {
    var previewColor = $(this).find('span').css('background-color');
    $(this).closest('.mockup-sample-section').find('img').css('background-color', previewColor)
  }, function() {
    $(this).closest('.mockup-sample-section').find('img').css('background-color', '#fff')
  })

  $('body').on('change', 'input.allprice', function() {
    let setPrice = $(this).val();
    // console.log('setprice',setPrice)
    // let minPrice = parseFloat($(this).parents('.ready-to-post').find('div.min-price p').text().replace('$',''));
    // if (setPrice <= minPrice) {
    //   $(this).parents('.ready-to-post').find('p.check-min-price').text('Please enter an amount greater than the base price of $'+minPrice+' to make profit from the first sale.')
    // } else {
    //   $(this).parents('.ready-to-post').find('p.check-min-price').text('')
    // }
    let minBaseCost = $(this)
      .parents('.ready-to-post')
      .find('td.basecost:first')
      .text()
      .replace('$', '');
    // console.log(minBaseCost)
    let profitCalc = parseFloat(setPrice - minBaseCost);
    // console.log(profitCalc)
    $(this)
      .parents('.ready-to-post')
      .find('p.estimate-profit')
      .text('$' + parseFloat(profitCalc).toFixed(2));

    $(this).parents('.ready-to-post').find('tr.size-price-checked').each(function() {
      let baseCost = parseFloat($(this).find('td.basecost').text().replace('$', ''));
      // console.log(baseCost)
      let sizePrice = parseFloat(profitCalc + baseCost);

      $(this).find('input.same-price').val(parseFloat(sizePrice).toFixed(2));
      $(this).find('td.profit').text('$' + parseFloat(profitCalc).toFixed(2));
    })
  });

  $('body').on('keyup', 'input.same-price', function() {
    let baseCost = parseFloat($(this).parents('tr').find('td.basecost').text().replace('$', ''));
    let sizePrice = parseFloat($(this).val());
    let profitCalc = parseFloat(sizePrice - baseCost);
    $(this).parents('tr').find('td.profit').text('$' + profitCalc)
  });



  //hover to change color preview

  $('body').on('mouseover', 'a.color-hover-preview', function() {
    let color = $(this).find('span').css('background-color');
    if (color == '#d8d8d6') {
      $('img#tshirtFacing')
        .css({
          'background-color': color,
          'background-image': '/images/heather.png'
        });
    } else {
      $('img#tshirtFacing')
        .css({
          'background-color': color,
          'background-image': 'none'
        });
    }

  }).on('mouseout', 'a.color-hover-preview', function() {
    let originColor = $(this)
      .parents('ul#getcolor')
      .find('span.is-selected')
      .css('background-color');
    $('img#tshirtFacing').css('background-color', originColor);
  });

  //click to change color preview
  $('body').on('click', 'a.color-hover-preview', function() {
    $(this).parents('ul#getcolor').find('li.js-preview-color span').removeClass('is-selected');
    $(this).find('span').addClass('is-selected');
  });

  // @Notes: Tam moved to tshirt design callback
  // $('body').on('click', 'img.img-logo', function(){
  //   $("#chooseDesignModal").modal('hide')
  // });

  $('body').on('click', '#upload-new-design', function() {
    $("#uploadDesignModal").modal('show');
  });

  $('body').on('click', '#open-product-gallery', function() {
    $("#chooseDesignModal").modal('show');
  });

  $('ul.style-product-selector').on('click', 'a', function() {
    $('li.selected-product').removeClass('selected-product');
    $(this).parent().addClass('selected-product');
    let id = $(this).find('img.material-icon').data('id');
    $('img#tshirtFacing').attr('data-id', id);

    let findImg = $(this).find('img').attr('src');
    let findImgColor = $(this).find('img').css('background-color');
    let findMockupName = $(this).find('span.mockup-name').text();
    if (findImgColor == 'rgb(216, 216, 214)') {
      $('.preview-product-section img')
        .css({
          'background-color': findImgColor,
          'background-image': 'url("/images/heather.png")',
          'background-repeat': 'repeat'
        });
    } else {
      $('.preview-product-section img')
        .css({
          'background-color': findImgColor,
          'background-image': 'none'
        });
    }

    $('.preview-product-section img').attr('src', findImg);
    $('.material-name h3').text(findMockupName);
  });

  $('input[name=title]').on('change',function(){
    let title = $(this).val();
    let aTitle = title.replace(/\s+/g, '-').toLowerCase();

    // console.log(title)
    if($('input[name=metafields_global_title_tag]').val() == '') {
      $('input[name=metafields_global_title_tag]').val(title)
    }

    if($('input[name=handle]').val() == '') {
      $('input[name=handle]').val(aTitle)
    }

  });

  // @TODO input productDescription -> SEO Desc
  if($('#productDescription').length === 1){
    let productDescriptionCKEDITOR =  CKEDITOR.replace('productDescription');
    productDescriptionCKEDITOR.on("instanceReady",function() {
      console.log('productDescription instanceReady');
      // Load sample data
      let defaultProductDesc = $('#default-product-description').html()
      CKEDITOR.instances['productDescription'].setData(defaultProductDesc);
      function syncProductDescriptionWithSEO(){
        let productDescriptionData = CKEDITOR.instances.productDescription.getData();
        let productDescriptionDataStripped = $(productDescriptionData).text();
        // Only for null data
        if($('[name=metafields_global_description_tag]').val() == ""){
          $('[name=metafields_global_description_tag]').val(productDescriptionDataStripped);
        }
        $('[name=body_html]').val(productDescriptionData);
      }
      // need to sync init data to SEO description
      syncProductDescriptionWithSEO();
      // Auto insert SEO
      CKEDITOR.instances['productDescription'].document.on('keyup', function(event) {
        syncProductDescriptionWithSEO();
      });
    });
  }

  //Button ready to push product
  $('.ready-post-button').click(function() {
    console.log('Post product called');

    try {
      // Check logo here
      validateCanvasDesign();
    } catch (e) {
      console.log('err', e);
      return false;
    }



    /** get data when recieve button click event */
    let urlData = $('#details-section .url-render').text();
    let designID = urlData.match(/[a-z0-9]{30,}/)[0];
    let productTitle = $('input[name=title]').val();
    let productHandle = $('input[name=handle]').val();
    let productMetaTitle = $('input[name=metafields_global_title_tag]').val();
    let productMetaDesc = $('textarea[name=metafields_global_description_tag]').val();
    let productDescription = CKEDITOR.instances['productDescription'].getData();
    let productVendor = $('input[name=vendor]').val();
    let productCollection = $('select[name=collection]').val();
    let productTags = $('input[name=tags]').tagsinput('items');
    let productPublish = $('input[name=publish]').is(':checked');
    let chooseShop = $('select#shop').val();

    //
    // let findUrl = dataUrl.split('&');
    // let findY = parseInt(findUrl[3].replace('topY=',''));
    // let findX = parseInt(findUrl[4].replace('leftX=',''));
    // let hideTop = parseInt($(this).find('span.hideTop').text());
    // let hideLeft = parseInt($(this).find('span.hideLeft').text());
    // let rebuildUrl = findUrl[0]+'&'+findUrl[1]+'&'+findUrl[2]+'&topY='+Math.floor(hideTop+findY)+'&leftX='+Math.floor(hideLeft+findX)+'&'+findUrl[5];
    //
    // let defaultImage = rebuildUrl+'&material='+defaultImg+'&color='+defaultColor;

    // @todo bulk upload check
    // if (ENABLE_BULK_UPLOAD) {
    //   console.log('trying to post', totalBulkDesignImages);
    //
    //   $('.bulk-upload-design-item .upload-progress').html(''); //reset data
    //   //@TODO this is demo
    //   var bar = new ProgressBar.Line($('.bulk-upload-design-item .upload-progress')[0], {
    //     strokeWidth: 4,
    //     easing: 'easeInOut',
    //     duration: 1400,
    //     // color: '#FFEA82',
    //     color: '#5cb85c',
    //     trailColor: '#eee',
    //     trailWidth: 1,
    //     svgStyle: {width: '99%', height: '100%'},
    //     text: {
    //       style: {
    //         // Text color.
    //         // Default: same as stroke color (options.color)
    //         color: '#999',
    //         position: 'absolute',
    //         right: '50%',
    //         top: '0',
    //         padding: 0,
    //         margin: 0,
    //         transform: null
    //       },
    //       autoStyleContainer: false
    //     },
    //     from: {color: '#FFEA82'},
    //     to: {color: '#5cb85c'},
    //     step: (state, bar) => {
    //       bar.setText(Math.round(bar.value() * 100) + ' %');
    //     }
    //   });
    //
    //   bar.animate(0.1);  // Number from 0.0 to 1.0
    //
    //   noty({ text: 'Bulk upload is not support now', type:'error' });
    //   return;
    // }

    /** check button on or off */
    if ($('button.locked_active').text() == 'ON') {
      var postData = {
        dataUrl:urlData,
        designID,
        productTitle,
        productDescription,
        productVendor,
        productCollection,
        productTags,
        chooseShop,
        productHandle,
        productMetaTitle,
        productMetaDesc,
        productPublish
      };
      let variantData = [];
      let productImg = [];
      let rebuildUrl = null;
      console.log('GROUP ON');

      if(ENABLE_BULK_UPLOAD === true){
        postData.bulkUpload = true;
      }

      $('div.ready-to-post').each(function() {
        let dataUrl = $(this).find('img.image-is-selected').attr('src');
        let findUrl = dataUrl.split('&');

        let readyToPost = this;
        console.log('dataUrl', dataUrl);

        let productName = $(this).find('h4 a').text();
        let materialId = $(this).find('span.materialId').text();
        let dataMaterial = $(this).find('span.active-image').text().match(/[a-z0-9]{30,}/)[0];

        let productColor = [];
        $(this).find('li.js-preview-color').each(function() {
          let dataColor = $(this).find('span.select-color-mockup').css('background-color');
          let eachColor = {
            name: $(this).find('span.render-color-name').text(),
            value: $(this).find('span.select-color-mockup').css('background-color')
          };
          console.log('dataColor, eachColor', dataColor, eachColor);

          // console.log('rebuildUrl', rebuildUrl);
          //@TODO adjust auto the rebuild url here
          // productImg.push(rebuildUrl + '&material=' + dataMaterial + '&color=' + dataColor);

          // //@TODO This is very buggy, prompt user to use automatic resize instead
          // let topY = parseInt(findUrl[3].replace('topY=', ''));
          // let leftX = parseInt(findUrl[4].replace('leftX=', ''));
          //
          // let hideTop = parseInt($(readyToPost).find('span.hideTop').text());
          // let hideLeft = parseInt($(readyToPost).find('span.hideLeft').text());

          rebuildUrl =
            findUrl[0] +
            '&' +
            findUrl[1] +
            '&' +
            findUrl[2] +
            '&' +
            findUrl[3] +
            '&' +
            findUrl[4] +
            '&' +
            findUrl[5];

          productImg.push(rebuildUrl + '&material=' + dataMaterial + '&color=' + dataColor);
          productColor.push(eachColor)
        });

        var productSize = [];
        $(this).find('div.range-size-price tbody tr.size-price-checked').each(function() {
          if ($(this).find('input.each-size-value').val() !== '') {
            var eachSize = {
              name: $(this).find('td.each-size-name').text(),
              value: $(this).find('input.each-size-value').val(),
              basecost: $(this).find('td.basecost').text(),
            };
            productSize.push(eachSize)
          }
        });
        if (productSize.length == 0) {
          alert('please set price');
          return false;
        }

        for (var i = 0; i < productColor.length; i++) {
          for (var y = 0; y < productSize.length; y++) {
            let variantItem = {
              option1: productName,
              option2: productColor[i].name,
              option3: productSize[y].name,
              price: productSize[y].value,
              materialId: materialId
            };
            variantData.push(variantItem);
          }
        }
      });

      postData.productImg = productImg;
      postData.variantData = variantData;
      console.log('postData', postData);
      /** check required */

      let imageLength = $('ul.style-product-selector.define-front-img li.js-preview-product').length;

      console.log('selected imageLength',imageLength);
      console.log('generate productImg.length',productImg.length);

      if(productImg.length < imageLength){
        alert('error image can not generate');
        return false;
      }


      if ($('select[name=shop]').val() == 'choose-shop') {
        alert('please choose a shop')
      } else {
        /** start push to Controller */
        $('.se-pre-con').css('display', 'block');
        postData.frontSide = MATERIAL_FRONT_SIDE;
        postData.numbericDesignId = CURRENT_DESIGN_ID;

        console.log('POST: /campaign/group', postData);

        socket.post('/campaign/group', postData);

      }
    } else {
      console.log('GROUP OFF - logic in create()');
      console.log('posting...');

      // @TODO Can not support now - may be disable in multiple upload
      if(ENABLE_BULK_UPLOAD === true){
        noty({ text: 'Bulk upload is not support when turn off GROUPING', type:'error' });
        return;
      }
      $('div.ready-to-post').each(function() {

        let dataUrl = $(this).find('img.image-is-selected').attr('src');
        let findUrl = dataUrl.split('&');

        // let findY = parseInt(findUrl[3].replace('topY=', ''));
        // let findX = parseInt(findUrl[4].replace('leftX=', ''));
        // let hideTop = parseInt($(this).find('span.hideTop').text());
        // let hideLeft = parseInt($(this).find('span.hideLeft').text());
        let rebuildUrl = findUrl[0] +
                         '&' +
                         findUrl[1] +
                         '&' +
                         findUrl[2] +
                         '&' +
                         findUrl[3] +
                         '&' +
                         findUrl[4] +
                         '&' +
                         findUrl[5];

        /** get data each one of style */
        /** find if seller choose default image */
        let pDefaultImg = $(this).find('img.image-is-selected').attr('src');
        let materialId = $(this).find('span.materialId').text();
        let productName = $(this).find('h4 a').text();
        var dataMaterial = $(this).find('span.active-image').text().match(/[a-z0-9]{30,}/)[0];

        let productColor = [];
        let productImg = [];
        $(this).find('li.js-preview-color').each(function() {
          let dataColor = $(this).find('span.select-color-mockup').css('background-color');
          let eachColor = {
            name: $(this).find('span.render-color-name').text(),
            value: $(this).find('span.select-color-mockup').css('background-color')
          };
          console.log('dataColor, eachColor', dataColor, eachColor);

          //@TODO adjust auto the rebuild url here
          productImg.push(rebuildUrl + '&material=' + dataMaterial + '&color=' + dataColor);
          productColor.push(eachColor);
        });

        var productSize = [];
        $(this).find('div.range-size-price tbody tr.size-price-checked').each(function() {
          if ($(this).find('input.each-size-value').val() !== '') {
            var eachSize = {
              name: $(this).find('td.each-size-name').text(),
              value: $(this).find('input.each-size-value').val(),
              basecost: $(this).find('td.basecost').text(),
            };
            productSize.push(eachSize)
          }
        });

        /** Push to CampaignController(action:create) with this data */
        let postData = {
          shop: chooseShop,
          designID: designID,
          materialId: materialId,
          pName: productName,
          pTitle: productTitle + ' ' + materialId,
          pDesc: productDescription,
          pVendor: productVendor,
          pCollection: productCollection,
          pTags: productTags.toString(),
          pColor: productColor,
          pSize: productSize,
          pImg: productImg,
          pDefaultImg,
          pHandle: productHandle,
          pMetaTitle: productMetaTitle,
          pMetaDesc: productMetaDesc,
          pPublish: productPublish
        };

        if(ENABLE_BULK_UPLOAD === true){
          postData.bulkUpload = true;
        }

        /** check required */

        if (productSize.length == 0) {
          noty({ text: 'Please set price', type:'error' });
        } else if ($('select[name=shop]').val() == 'choose-shop' || $('.check-have-store').text()=='no-store') {
          noty({
            text: `<b>Warning!</b> 
            <div>Please <a href="/scp/store"><strong>connect a store</strong></a> to push products to</div>`,
            type: 'error',
          });
        } else {
          /** start push to Controller */
          $('.se-pre-con').css('display', 'block');
          // $.blockUI({ message: '<h5>Uploading...</h5>' });
          postData.frontSide = MATERIAL_FRONT_SIDE;
          postData.numbericDesignId = CURRENT_DESIGN_ID;
          socket.post('/campaign/create', postData);
          // console.log(postData);

        }

      })
    }

  });

  // socket.on('pushto/shopify',function(data){
  //   console.log('pushto/shopify', data);
  //   location.reload();
  // });
  socket.on('push/success', function(data) {
    if(location.pathname == '/product/design'){
      console.log(data.p + ' ' + data.shop)
      window.location = '/campaign/success?p=' + data.p + '&shop=' + data.shop
    }

  })

  $('#loadSettingModal .delete-setting').on('click', function() {
    let settingID = $(this).parents('tr.save-tr').find('td.save-id').text();
    $('#save-id-' + settingID).fadeOut('slow')
    socket.get('/save/delete?id=' + settingID);
  })

  $('[name=show-all-colors]').change(function() {
    let showAllColors = $(this).prop('checked');
    // console.log('changed', $(this).prop('checked'));
    if (showAllColors) {
      $('.select-color').css('bottom', 0);
    } else {
      $('.select-color').css('bottom', '-200px');
    }

  })
  $('[name=enable-bulk-upload]').change(function() {
    ENABLE_BULK_UPLOAD = $(this).prop('checked');

    if (ENABLE_BULK_UPLOAD) {
      AUTO_RESIZE = true
      // $('[name=designImages]').css('visibility', 'visible');
      $('#drawingArea .canvas-container').hide();
      prepareStep2Data();
      // $('#drawingArea .multiple-image-bulk-upload').show();
      // total bulk upload item
      $('.bulk-upload-item').show();

    } else {
      // @TODO may be check again
      // AUTO_RESIZE = true;
      // $('[name=designImages]').css('visibility', 'hidden');
      $('#drawingArea .canvas-container').show();
      // $('#drawingArea .multiple-image-bulk-upload').hide();
      //total bulk upload item
      $('.bulk-upload-item').hide();
      prepareStep2Data();
    }

  })

  // Auto select the first material (fix ejs issue when load save settings item)
  if ($('.style-product-selector .material-icon').length > 0) $(
    '.style-product-selector .material-icon')[0].click();

  if (getParam('showStep2') === 'true') {
    showStep2({ createSettings: true })
  }

  // Bulk upload demo
  // ANIMATEDLY DISPLAY THE NOTIFICATION COUNTER.
  $('#noti_Counter')
    .css({ opacity: 0 })
    .text('7')              // ADD DYNAMIC VALUE (YOU CAN EXTRACT DATA FROM DATABASE OR XML).
    .css({ top: '-10px' })
    .animate({ top: '-2px', opacity: 1 }, 500);

  $('#noti_Button').click(function () {

    // TOGGLE (SHOW OR HIDE) NOTIFICATION WINDOW.
    $('#notifications').fadeToggle('fast', 'linear', function () {
      if ($('#notifications').is(':hidden')) {
        $('#noti_Button').css('background-color', '#2E467C');
      }
      else $('#noti_Button').css('background-color', '#FFF');        // CHANGE BACKGROUND COLOR OF THE BUTTON.
    });

    $('#noti_Counter').fadeOut('slow');                 // HIDE THE COUNTER.

    return false;
  });

  // HIDE NOTIFICATIONS WHEN CLICKED ANYWHERE ON THE PAGE.
  $(document).click(function () {
    $('#notifications').hide();

    // CHECK IF NOTIFICATION COUNTER IS HIDDEN.
    if ($('#noti_Counter').is(':hidden')) {
      // CHANGE BACKGROUND COLOR OF THE BUTTON.
      $('#noti_Button').css('background-color', '#2E467C');
    }
  });

  $('#notifications').click(function () {
    return false;       // DO NOTHING WHEN CONTAINER IS CLICKED.
  });




});
