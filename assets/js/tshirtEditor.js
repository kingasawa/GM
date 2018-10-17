let canvas;
let bgImage;
let designScaleX = 1;
let designScaleY = 1;
let clickMaterial = 0;
console.log('v:20');
//@TODO object for multiple logo

let dataRender = {}; //Global render object @todo: multiple logo allowed

let INCREASE_CANVAS_DESIGN = 1; // dont update this number by @tamdu
const PRODUCT_VIEW_CONTROLLER = 'uploader/product';
const DESIGN_WIDTH = 135;
const DESIGN_HEIGHT = 220;
const LOGO_WIDTH = 100;
const NUMBER_LOGO_ADD_ALLOWED = 1;
const DEFAULT_MATERIAL_COLOR = 'white';
//@TODO move to config
const IMAGE_MATERIAL_DESIGN_URL = 'http://img.gearment.com/unsafe/0x600';

let totalBulkDesignImages = '';
let bulkDesignImagesObject = {};

// Design object
let designSize = {};
// let designOrigin = {};
// let designCachedData = {};
let CURRENT_DESIGN_SRC;
let CURRENT_DESIGN_ID;
let IMAGE_SOURCE;


function setUploadBackground() {
  console.log('setUploadBackground add img', canvas.getObjects().length);
  if (canvas.getObjects().length == 0) {
    setCanvasBackgroundImageUrl('/images/add_image_design.png')
    // canvas.setBackgroundImage('/images/add_image_design.png', canvas.renderAll.bind(canvas), {
    //   backgroundImageOpacity: 1,
    //   backgroundImageStretch: false
    // })
  } else {
    setCanvasBackgroundImageUrl();
  }
}
function setCanvasBackgroundImageUrl(url) {
  if (url && url.length > 0) {
    fabric.Image.fromURL(url, function(img) {
      bgImage = img;
      scaleAndPositionImage();
    });
  } else {
    canvas.backgroundImage = 0;
    canvas.setBackgroundImage('', canvas.renderAll.bind(canvas));

    canvas.renderAll();
  }
}
function scaleAndPositionImage() {
  canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas), {
    top: parseInt(($('#drawingArea').height() - 120) / 2.5),
    left: parseInt(($('#drawingArea').width() - 130) / 2.5),
    originX: 'left',
    originY: 'top',
    scaleX: 0.5,
    scaleY: 0.5,
    opacity:0.3
  });
  canvas.renderAll();

}

$(document).ready(() => {
  // Condition loader
  if (!$("#tcanvas").length) return false;

  // hide toolbar
  $("#imageeditor").hide();

  $('body').on('click', '.material-icon', function() {
    clickMaterial = 1;
    let currentUrl = $('#details-section .url-render').text();
    console.log('renderUrl', currentUrl);
    let id = $(this).data('id');
    let selectedSide = 'back';
    if($(this).hasClass('material-front-side')){
      selectedSide = 'front';
    }

    // let designScaleX = $('#drawingArea').width() / dataRender.logoWidth
    // let designScaleY = $('#drawingArea').height() / dataRender.logoHeight

    let materialId = $(this).parents('a').find('span.mockup-id').text();
    $('#tshirtFacing').attr('src', `${IMAGE_MATERIAL_DESIGN_URL}/${id}`).data('id', id);

    $('div.right-side span.material-basecost').html('<i class="fa fa-spinner fa-spin"></i>')
    socket.get(`/scp/get?id=${materialId}&side=${selectedSide}`, function(data) {
      $('div.right-side span.material-basecost').text(data.basecost.size[0].price);


      $('ul#getcolor').html('');
      for (var i = 0; i < data.color.color.length; i++) {
        $('ul#getcolor')
          .append(`<li style="margin-right:4px" class="js-preview-color" data-toggle="tooltip" title="${data.color.color[i].name}"><a class="color-hover-preview" href="#">
      <span style="background-color:${data.color.color[i].value}"></span></a></li>`)
      }
      $('[data-toggle="tooltip"]').tooltip();

      $('div#drawingArea').css({
        'top': data.config.top + 'px',
        'left': data.config.left + 'px',
        'width': data.config.width + 'px',
        'height': data.config.height + 'px'
      });
      $('div.canvas-container')
        .css({
          'width': data.config.width + 'px',
          'height': data.config.height + 'px'
        });

      $('canvas#tcanvas')
        .attr({
          'width':data.config.width,
          'height':data.config.height})
        .css({
          'width':data.config.width,
          'height':data.config.height});

      $('canvas.upper-canvas')
        .attr({
          'width':data.config.width,
          'height':data.config.height })
        .css({
          'width':data.config.width,
          'height':data.config.height});

      // Start hacking
      console.log('1 param(dataRender)', $.param(dataRender));

      canvas.clear();
      //reset renderdata
      initDataRender();
      setUploadBackground();

      console.log('2 param(dataRender)', $.param(dataRender));
      //prepareStep2 data, maybe us
      // er is now on step 2 upload
      // prepareStep2Data();

      $('.next-step-2').removeClass('disabled');
      $('a.to-step-2').removeClass('disabled')
      // End hacking

      /* Start create canvas add logo to design canvas */
      if (CURRENT_DESIGN_SRC) {
        // console.log('designSize', designSize);
        fabric.Image.fromURL(IMAGE_SOURCE, function(image) {
          window.imagee = image;
          image.set({
            width: designSize.width,
            height: designSize.height,
            left: designSize.left,
            top: designSize.top,
            currentScaleX: designSize.scaleX,
            currentScaleY: designSize.scaleY,
            scaleX:1,
            scaleY:1,
            angle: 0,
            padding: 0,
            cornersize: 0,
            centerTransform: true,
            hasRotatingPoint: false,
            lockRotation: true,
            lockSkewingX: true,
            lockSkewingY: true,
            borderColor: '#21B0DF',
            cornerColor: '#0F5F9A',
          });

          /* Hide unused control */
          //mtr: rotate
          ['ml', 'mb', 'mr', 'mt', 'mtr'].map(item => {
            image.setControlVisible(item, false)
          })
          canvas.add(image);

          // console.log('sau add image', dataRender.scaleX);
          // Some preparing upload data
          // prepareStep2Data();
          canvas.renderAll();

          //@TODO add image to canvas

          // @TODO canvas issue here
          let objectsInGroup = canvas.getObjects();

          let designObj = objectsInGroup[0];

          // console.log('resize data.config', data.config);
          // check frame size with design size to make sure it's inside the frame
          let designScaleHeight = parseInt(designSize.height / data.config.scale);
          let designScaleWidth = parseInt(designSize.width / data.config.scale);

          let redundantHeight = (designScaleHeight + designObj.top) - data.config.height;
          let newTop = designObj.top;

          if (redundantHeight > 0) {
            newTop = newTop - redundantHeight;
            if(newTop >= 0){
              designObj.setTop(newTop);
              console.log('resize setTop newTop', newTop);
            }else{
              console.log('resize top error newTop', newTop);
            }

          }

          designObj.setHeight(designScaleHeight);
          designObj.setWidth(designScaleWidth);


          canvas.renderAll();
          // prepareStep2Data();
        });
      }
      // Resize canvas frame to fit each material
      canvas.setHeight(data.config.height);
      canvas.setWidth(data.config.width);
    })
  });

  //setup canvas
  canvas = new fabric.Canvas('tcanvas', {
    hoverCursor: 'pointer',
    selection: true,
    selectionBorderColor: 'blue',
  });


  // Prepare for backend render
  const prepareRenderData = (e, added) => {

    if (added) {
      dataRender.totalLogo++;
      if (dataRender.totalLogo > NUMBER_LOGO_ADD_ALLOWED) {
        dataRender.totalLogo = NUMBER_LOGO_ADD_ALLOWED;
        canvas.remove(e.target);
        return false;
      }

    }

    e.target.opacity = 1;

    let { click,currentScaleX, currentScaleY, width, height, scaleX, scaleY, top, left } = e.target;

    if(currentScaleX && currentScaleY){
      console.log('CO CURRENT SCALE');
      scaleX = currentScaleX;
      scaleY = currentScaleY;
    }

    console.log('chay qua day lam gi');
    console.log('click Material', clickMaterial);
    if(clickMaterial == 1){
      scaleX = 1;
      scaleY = 1;
    }
    dataRender.logoWidth = Math.floor((width*scaleX));
    dataRender.logoHeight = Math.floor((height*scaleY));
    dataRender.topY = Math.floor(top);
    dataRender.leftX = Math.floor(left);

    //@TODO Please update ID by JS here KHANH TRAN


    dataRender.logo = $(".img-logo.selected").data('id');
    dataRender.scaleX = scaleX;
    dataRender.scaleY = scaleY;
    dataRender.designLeft = left;
    dataRender.designTop = top;
    if(scaleX == 1){
      dataRender.designLeft = 0;
      dataRender.designTop = 0;
    }

    // Convert obj to qs

    $('#details-section .url-render').text(generateImageUrlResult());
    setUploadBackground();
    prepareStep2Data();
  };

  window.initDataRender = () => {
    // console.log('initDataRender');
    // Setup default material color
    dataRender = {
      totalLogo: 0, // color: DEFAULT_MATERIAL_COLOR
    }
    // Reset url-render
    $('#details-section .url-render').text('');
    $('.next-step-2').addClass('disabled');
    $('a.to-step-2').addClass('disabled');

  };

  const generateImageUrlResult = () => {
    let imageUrlParams = $.param(dataRender);
    let urlResult = `${baseUrl}/${PRODUCT_VIEW_CONTROLLER}?${imageUrlParams}`;

    // Update show result to div
    // @TODO remove this in production
    $('#renderImageUrl img').attr('src', urlResult);
    $('#urlResult').html(urlResult);

    return urlResult;
  };

  initDataRender();

  setUploadBackground();

  canvas.on({
    'object:moving': function(e) {
      // console.log('object moving on');
      e.target.opacity = 0.5;
    },
    'object:added': (e) => prepareRenderData(e, 'added'),
    'object:modified': prepareRenderData,
    'object:selected': onObjectSelected,
    'selection:cleared': onSelectedCleared,
    'mouse:down': function(e) {
      if (canvas.getObjects().length == 0) {
        $("#chooseDesignModal").modal('show');
      }
    }
  });

  $('body').on('click', '.img-logo', function(e) {
    AUTO_RESIZE = true;
    let id = $(this).data('id');
    let design_id = $(this).data('design_id');

    let parentWrapper = $(this).parents('.user-design');

    let el = e.target;
    IMAGE_SOURCE = el.src;


    function deleteDesign() {
      canvas.clear();

      dataRender.totalLogo - 1;
      //reset renderdata
      initDataRender();
      //prepareStep2 data, maybe user is now on step 2 upload
      prepareStep2Data();

      setUploadBackground();

      CURRENT_DESIGN_SRC = null;
      CURRENT_DESIGN_ID = null;
    }

    if (canvas.getObjects().length > 0) {
      // Support user change design
      deleteDesign();
    }

    $(".img-logo").removeClass('selected');

    dataRender.logoWidth = Math.floor(e.target.width);
    /** canvas moving limit
     * **/
    canvas.observe('object:moving', function(e) {
      clickMaterial = 0;
      // let currentFrameWidth = $('#drawingArea').width();
      // let currentFrameHeight = $('#drawingArea').height();
      AUTO_RESIZE = false;
      var obj = e.target;

      if (obj.getHeight() > obj.canvas.height || obj.getWidth() > obj.canvas.width) {
        obj.setScaleY(1);
        obj.setScaleX(1);
      }
      obj.setCoords();

      if (obj.getBoundingRect().top -
          (obj.cornerSize/2) <
          0 ||
          obj.getBoundingRect().left -
          (obj.cornerSize/2) <
          0) {
        obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top + (obj.cornerSize/2));
        obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left + (obj.cornerSize/2));
      }
      if (obj.getBoundingRect().top +
          obj.getBoundingRect().height +
          obj.cornerSize >
          obj.canvas.height ||
          obj.getBoundingRect().left +
          obj.getBoundingRect().width +
          obj.cornerSize >
          obj.canvas.width) {
        obj.top =
          Math.min(obj.top,
            obj.canvas.height -
            obj.getBoundingRect().height +
            obj.top -
            obj.getBoundingRect().top -
            obj.cornerSize/
            2);
        obj.left =
          Math.min(obj.left,
            obj.canvas.width -
            obj.getBoundingRect().width +
            obj.left -
            obj.getBoundingRect().left -
            obj.cornerSize/
            2);
      }

      designSize = {
        width: parseInt(obj.getWidth()),
        height: parseInt(obj.getHeight()),
        top: obj.top,
        left: obj.left,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY
      };
      dataRender.scaleX = obj.scaleX;
      dataRender.scaleY = obj.scaleY;
      // prepareStep2Data();
    });
    canvas.observe('object:scaling', function(e) {
      clickMaterial = 0;
      AUTO_RESIZE = false;
      var obj = e.target;
      if (obj.getHeight() > obj.canvas.height || obj.getWidth() > obj.canvas.width) {
        obj.setScaleY(1);
        obj.setScaleX(1);
      }
      obj.setCoords();
      if (obj.getBoundingRect().top -
          (obj.cornerSize/2) <
          0 ||
          obj.getBoundingRect().left -
          (obj.cornerSize/2) <
          0) {
        obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top + (obj.cornerSize/2));
        obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left + (obj.cornerSize/2));
      }
      if (obj.getBoundingRect().top +
          obj.getBoundingRect().height +
          obj.cornerSize >
          obj.canvas.height ||
          obj.getBoundingRect().left +
          obj.getBoundingRect().width +
          obj.cornerSize >
          obj.canvas.width) {

        obj.top =
          Math.min(obj.top,
            obj.canvas.height -
            obj.getBoundingRect().height +
            obj.top -
            obj.getBoundingRect().top -
            obj.cornerSize/
            2);
        obj.left =
          Math.min(obj.left,
            obj.canvas.width -
            obj.getBoundingRect().width +
            obj.left -
            obj.getBoundingRect().left -
            obj.cornerSize/
            2);
      }

      // console.log('obj.canvas.height', obj.canvas.height);
      designSize = {
        width: parseInt(obj.getWidth()),
        height: parseInt(obj.getHeight()),
        top: obj.top,
        left: obj.left,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY
      };
      dataRender.scaleX = obj.scaleX;
      dataRender.scaleY = obj.scaleY;

      // $('#details-section .url-render').text(generateImageUrlResult());
      // prepareStep2Data();
    });

    /** Validate current design widh height before push new campaign
     Avoid low quality image **/
    socket.get(`/uploader/imageSize`, { id }, function(data) {

      if (data.width < 1200 || data.height < 1200) {
        noty({
          text: `Minimun width and minimun height must be 600px at least, please re-upload & delete current image`,
          type: 'error',
        });

        return false;
      }


      $.blockUI({
        message: '<h1><img src="/images/loader.gif" /></h1>',
        baseZ: 1041,
        timeout: 5000 });
      // console.log('logo click imageSize data', data);

      let drawingAreaWidth = $('#drawingArea').width();
      let drawingAreaHeight = $('#drawingArea').height();
      let newLogoSize = resizeFit(data.width, data.height, drawingAreaWidth, drawingAreaHeight);

      console.log('newLogoSize', newLogoSize);
      let width = newLogoSize.width;
      let height = newLogoSize.height;
      let top = 0;
      let left = 0;

      /* Start auto scale logo to fix design area */
      if (width < drawingAreaWidth) {
        // console.log('auto center align');
        left = (drawingAreaWidth - width)/2;
      }

      designSize = {
        width: parseInt(width),
        height: parseInt(height),
        top,
        left,
      };

      let intWidth = parseInt(width);
      let intHeight = parseInt(height);

      IMAGE_SOURCE = IMAGE_SOURCE.replace('/load/', '/best-load/');
      IMAGE_SOURCE =
        IMAGE_SOURCE.replace(/(\d{3})x(\d{3})/,
          `${Math.ceil(intWidth*INCREASE_CANVAS_DESIGN)}x${Math.ceil(intHeight*INCREASE_CANVAS_DESIGN)}`)
      CURRENT_DESIGN_SRC = IMAGE_SOURCE;

      CURRENT_DESIGN_ID = design_id;
      // designOrigin.width = intWidth;
      // designOrigin.height = intHeight;

      // @TODO temporary middle align
      // if(newLogoSize.height < drawingAreaHeight){
      // console.log('auto middle align');
      // top = (canvas.getHeight() - newLogoSize.height) / 2;
      // }

      /* Start create canvas add logo to design canvas */
      fabric.Image.fromURL(IMAGE_SOURCE, function(image) {
        window.imagee = image;
        image.set({
          width: width,
          height: height,
          left: left,
          top: top,
          click:0,
          angle: 0,
          padding: 0,
          cornersize: 0,
          centerTransform: true,
          hasRotatingPoint: false,
          lockRotation: true,
          lockSkewingX: true,
          lockSkewingY: true,
          borderColor: '#21B0DF',
          cornerColor: '#0F5F9A',
        });

        /* Hide unused control */
        //mtr: rotate
        ['ml', 'mb', 'mr', 'mt', 'mtr'].map(item => {
          image.setControlVisible(item, false)
        })

        canvas.add(image);

        // Hide design modal
        $("div.modal").modal('hide')

        // Some preparing upload data
        // prepareStep2Data();

        noty({
          text: `Your design has been updated`,
          type: 'warning',
        });
        AUTO_RESIZE = true;
        $('.next-step-2').removeClass('disabled');
        $('a.to-step-2').removeClass('disabled')
        $.unblockUI();
      });

    });
    $(this).addClass('selected');
  });

  $('body')
    .on('click',
      '#remove-selected, ' +
      '#align-justify-selected, ' +
      '#align-left-selected, ' +
      '#align-center-selected, ' +
      '#align-right-selected',
      function(e) {

        AUTO_RESIZE = false;

        let id = $(this).attr('id');
        let activeObject = canvas.getActiveObject(), activeGroup = canvas.getActiveGroup();

        switch (id) {
          case 'remove-selected':
            if (activeObject) {
              canvas.remove(activeObject);
            } else if (activeGroup) {
              // delete all
              let objectsInGroup = activeGroup.getObjects();
              canvas.discardActiveGroup();
              objectsInGroup.forEach(function(object) {
                canvas.remove(object);
              });
            }
            CURRENT_DESIGN_SRC = null;
            CURRENT_DESIGN_ID = null;
            //reset renderdata
            initDataRender();
            //prepareStep2 data, maybe user is now on step 2 upload
            prepareStep2Data();
            break;
          case 'align-justify-selected':
          case 'align-left-selected':
          case 'align-center-selected':
          case 'align-right-selected':
            if (activeObject) {
              let left = 0;
              let tryFitLogoSize = {};

              tryFitLogoSize.width = activeObject.getWidth();
              tryFitLogoSize.height = activeObject.getHeight();

              if (id === 'align-right-selected') {
                left = canvas.getWidth() - activeObject.getWidth();
                console.log('align-right-selected', left);
              } else if (id === 'align-center-selected') {
                console.log('align-center-selected', left);
                left = (canvas.getWidth() - activeObject.getWidth())/2;
              } else if (id === 'align-justify-selected') {
                // @TODO set width height instead of set scale
                // Check frame size
                activeObject.top = 0;
                activeObject.left = 0;

                activeObject.setScaleX(1);
                activeObject.setScaleY(1);

                tryFitLogoSize =
                  resizeFit(activeObject.getWidth(),
                    activeObject.getHeight(),
                    $('#drawingArea').width(),
                    $('#drawingArea').height());

                activeObject.setWidth(tryFitLogoSize.width);
                activeObject.setHeight(tryFitLogoSize.height);
                left = (canvas.getWidth() - activeObject.getWidth())/2;
                // console.log('align-justify-selected', left);
              }

              activeObject.set({ left });
              activeObject.setCoords();
              canvas.renderAll();
              canvas.calcOffset();
              if (activeObject) {
                prepareRenderData({ target: activeObject });
              }

              designSize = {
                width: parseInt(tryFitLogoSize.width),
                height: parseInt(tryFitLogoSize.height),
                top: activeObject.top,
                left: activeObject.left
              };
            }
            break;

        }
        prepareStep2Data();
      })
});

function onObjectSelected(e) {
  let selectedObject = e.target;
  selectedObject.hasRotatingPoint = true
  if (selectedObject && selectedObject.type === 'image') {
    $("#imageeditor").css('display', 'block');
  }
}
function onSelectedCleared(e) {
  setUploadBackground()
  $("#imageeditor").css('display', 'none');
}
