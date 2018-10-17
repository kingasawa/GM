$(function() {

  var socket = io.socket;

  let oneCmtoPx = 37.795275590551;
  let printWidth = 14;
  let printHeight = 16;

  let aspect = Math.floor(printWidth*oneCmtoPx) + 'x' + Math.floor(printHeight*oneCmtoPx)
  let minWidth = 1200;
  let minHeight = 1200;

  console.log('Printer frame aspect', aspect);

  function imageValidation(file, done) {
    file.acceptDimensions = (...a) => {
      noty({
        text: `<b>Uploading, please wait...</b> 
        <div>Your design will be chosen automatically</div>`,
        type: 'success',
      });
      done(...a)
    };
    file.rejectDimensions = function() {
      let rejectMsg = `Minimun width and minimun height must be ${minWidth}px at least, please re-upload`;
      noty({
        text: rejectMsg,
        type: 'error',
      });
      done(rejectMsg);
    };
  }

  function imageValidationCb(file) {
    // Do the dimension checks you want to do
    console.log('imageValidationCb file', file, minWidth, minHeight);
    if (file.width < minWidth || file.height < minHeight) {
      file.rejectDimensions()
    }
    else {
      file.acceptDimensions();
    }
  }


  Dropzone.options.logoUploader = {
    paramName: "image",
    init: function () {
      this.on("success", function (file, response) {
        let {id} = response;
        if ($('.uploaded-logo').length) {
          $('.uploaded-logo').append(`<img class="img-logo" src="http://img.gearment.com/unsafe/fit-in/100x100/${id}" data-id="${id}"/>`)
          alert('this is sample data map will not be stored, please update Model');
        }
        console.log(response);
      });
    }
  };

  // For test demo uploader
  Dropzone.options.imageUploader = {
    paramName: "image",
    accept: imageValidation,
    init: function () {
      this.on("thumbnail", imageValidationCb);
      this.on("success", function (file, response) {
        //Upload xong lam gi
        console.log('imageUploader',response);
      });
    }
  };

  Dropzone.options.frontImage = {
    paramName: "image",
    maxFiles: 1,
    dictDefaultMessage: 'drop your front images here to upload',
    init: function () {
      this.on("success", function (file, response) {
        console.log(response);
        $('input[name=front-img]').val(response.fitlUrl);
        $('input[name=front-img-id]').val(response.id)
      });
    }
  };

  Dropzone.options.backImage = {
    paramName: "image",
    maxFiles: 1,
    dictDefaultMessage: 'drop your back images here to upload',
    init: function () {
      this.on("success", function (file, response) {
        console.log(response);
        $('input[name=back-img]').val(response.fitlUrl);
        $('input[name=back-img-id]').val(response.id)
      });
    }
  };

  /* Design image uploader */
  Dropzone.options.designUploader = {
    maxThumbnailFilesize: 50,
    maxFilesize: 50,
    paramName: "image",
    dictDefaultMessage: `
      <img style="width: 100%;max-width: 400px" src="/images/drag-drop-upload.gif">
      <div><b>Drop</b> your design images or <b>Click</b> here to upload</div> (minWidth: ${minWidth}px and minHeight ${minWidth}px)
    `,
    accept: imageValidation,
    acceptedFiles: 'image/*',
    init: function () {
      this.on("thumbnail", imageValidationCb);
      this.on("success", function (file, response) {
        console.log(response);
        let designData = {
          id:response.id,
          thumbUrl:response.thumbUrl,
        };
        socket.post('/scp/design',designData)
      });
    }
  };
  // Real design upload on product page
  socket.on('design/added',function(data){
    $('#design-gallery').append(`
    <div class="design-icon" id="${data.msg.id}"><img class="img-logo img-thumbnail" data-design_id="${data.msg.design_id}" data-id="${data.msg.id}" src="${data.msg.thumbUrl}">
    <div class="bulk-upload-item" style="display: none">   
      <input type="checkbox" name="designImages" value="${data.msg.id}" class="img-logo-checkbox">
    </div>
    <div class="removeable-design"><a class="remove-design-button" data-id="${data.msg.id}" href="#"><i class="fa fa-close"></i></a></div>
    </div>`);
    $('#design-gallery').justifiedGallery();
    $(`.img-logo[data-id=${data.msg.id}]`).click();
  });
});
