// $(function() {
//
//   var socket = io.socket;
//
//   let oneCmtoPx = 37.795275590551;
//   let printWidth = 14;
//   let printHeight = 16;
//
//   let aspect = Math.floor(printWidth*oneCmtoPx) + 'x' + Math.floor(printHeight*oneCmtoPx)
//   let minWidth = 0;
//   let minHeight = 0;
//
//
//   function imageValidation(file, done) {
//     file.acceptDimensions = (...a) => {
//       noty({
//         text: `<b>Uploading, please wait...</b>
//         <div>Your design will be chosen automatically</div>`,
//         type: 'success',
//       });
//       done(...a)
//     };
//     file.rejectDimensions = function() {
//       let rejectMsg = `Minimun width and minimun height must be ${minWidth}px at least, please re-upload`;
//       noty({
//         text: rejectMsg,
//         type: 'error',
//       });
//       done(rejectMsg);
//     };
//   }
//
//   function imageValidationCb(file) {
//     // Do the dimension checks you want to do
//     console.log('imageValidationCb file', file, minWidth, minHeight);
//     if (file.width < minWidth || file.height < minHeight) {
//       file.rejectDimensions()
//     }
//     else {
//       file.acceptDimensions();
//     }
//   }
//
//
//
//
//   // For test demo uploader
//   Dropzone.options.apiImageUploader = {
//     paramName: "image",
//     accept: imageValidation,
//     init: function () {
//       this.on("thumbnail", imageValidationCb);
//       this.on("success", function (file, response) {
//         //Upload xong lam gi
//         console.log('imageUploader',response);
//       });
//     }
//   };
//
// });
