$(function() {
  if($('#chooseDesignModal').length === 0) return false;

  var socket = io.socket;

  let page = 1;

  function getDesignGalleryPage(page=1){
    socket.get('/design/get', { page }, (designs) => {
    console.log('/design/get', designs);
    let { totalPage, designData } = designs;

    $('#design-gallery').html('');

      $('#pagination-design-gallery').twbsPagination({
        totalPages: totalPage,
        visiblePages: 10,
        onPageClick: function (event, page) {
          console.log('onPageClick', page);
          getDesignGalleryPage(page);
        }
      });

    _.each(designData, (design) => {
      // console.log('design', design);
      // console.log('design.thumbUrl', design.thumbUrl);
      $('#design-gallery').append(`
        <div class="design-icon" id="${design.id}">
          <img
            data-id="${design.id}"
            class="img-logo lazyxxx"
            data-design_id="${design.design_id}"
            src="${design.thumbUrl}"
          />
        </div>
      `);
    })
    $('#design-gallery').justifiedGallery();
  })
  }
  getDesignGalleryPage(1);
  $('#design-gallery').justifiedGallery({
    rowHeight: 120,
    lastRow: 'nojustify',
    margins: 10,
    // border: -10
  });
});
