let orderTable;
let acpOrderTable;
let orderTableShopFilter;
let acpOrderTableShopFilter;
let scpOrderTableShopFilter;
let orderTableUserFilter;
let orderTableStatusFilter;
let SELECTED_USER = '';
let SELECTED_SHOP = '';
let SELECTED_FROM_DATE = '';
let SELECTED_TO_DATE = '';
let ACP_ORDER_TABLE_DATA = '';
let SCP_ORDER_TABLE_DATA = '';
let IN_ACP = true;
let ACP_SORT_BY = 'desc';
if(location.pathname == '/scp/order'){
  IN_ACP = false
}
console.log('IN_ACP', IN_ACP);
$(function() {

  ////// sau nay co the bo cai js nay di
  let creditDetailTable = $('#credit-detail-table').DataTable({
    "bSort" : true,
    "bLengthChange": false,
    "pageLength": 200,
    "bPaginate": false,
    "bInfo": false,
    "columnDefs": [
      {
        "width": "250px",
        "targets": 0
      }
    ]
  });


  let creditTable = $('#credit-table').DataTable({
    "bLengthChange": false,
    "columnDefs": [
      {
        "width": "250px",
        "targets": 1
      }
    ]
  });
  let creditTableShopFilter = $("#shop-filter").select2();
  creditTableShopFilter.on("change", function (e) {
    console.log('select2:change', e);

  });
  creditTableShopFilter.on("select2:select", function (e) {
    if(e.params.data.text == 'All Stores'){
      var shopName = '';
    } else {
      var shopName = e.params.data.text;
    }
    creditTable.columns( 1 ).search( shopName ).draw();
    creditDetailTable.columns( 0 ).search( shopName ).draw();

    let totalItem = 0;
    let totalBaseCost = 0;
    let totalShippingFee = 0;
    let totalAmount = 0;
    $('#credit-detail-table tbody tr').each(function(){
      totalItem += parseInt($(this).find('span.total-item').text());
      totalBaseCost += parseFloat($(this).find('span.total-basecost').text());
      totalShippingFee += parseFloat($(this).find('span.shipping-fee').text());
      totalAmount += parseFloat($(this).find('span.total-item-price').text());
    });

    $('#credit-detail-table span.totalQuantity').text(totalItem);
    $('#credit-detail-table span.totalBaseCost').text(parseFloat(totalBaseCost).toFixed(2));
    $('#credit-detail-table span.totalShippingFee').text(parseFloat(totalShippingFee).toFixed(2));
    $('#credit-detail-table span.totalAmount').text(parseFloat(totalAmount).toFixed(2));

  });




  // if(window.location.pathname !== '/scp/order' || window.location.pathname !== '/acp/order') return false;
  if(['/scp/order','/acp/order'].includes(window.location.pathname) == false) return false;
  console.log('In /scp/order');
  if($('.item-weight').text() !== 'null'){
    $('input[name=fulfillment-method]').attr('disabled',false);
  }
  socket.on('order/getWeight',function(result){
    console.log('result',result);
    $('input[name=fulfillment-method]').attr('disabled',false);
    let { id, weight } = result;
    $(`.item-weight.item-${id}`).text(weight);

  });

  socket.on('order/imageFetched',function(result){
    let { src, variant_id } = result;
    let element = $(`.variant-image.not-fetched[data-variant_id=${variant_id}]`);
    if(src && src != 0){
      element.attr('src', src);
      element.removeClass('not-fetched').addClass('fetching');
      element.removeClass('fetching').addClass('fetched');
    }
    console.log('order/imageFetched result', src, variant_id);
    $('button.pay-to-print').removeAttr('disabled');
  });



  function updateOrderStats(){
    let owner = SELECTED_USER;
    let shop = SELECTED_SHOP;
    console.log('owner', SELECTED_USER);
    console.log('shop', SELECTED_SHOP);
    let urlStats = '/scp/scp_order_stats';
    if(IN_ACP){
      urlStats = '/acp/order_stats'
    }

    socket.get(urlStats,{  owner, shop, from: SELECTED_FROM_DATE, to: SELECTED_TO_DATE }, function(orders) {
      $('#status-filter span').text(0);
      Object.keys(orders).map(function(order){

        //        orders[order]
        $('#'+order+ ' span').text(orders[order]);
        console.log('order', order, orders[order]);

      })
    })
  }


  $('a.zoom-in').on('click',function(){
    let variantImg = $(this).find('img.variant-image').attr('src');
    $('#zoomImageModal img').attr('src',variantImg);
  });


  $.fn.dataTable.Buttons.defaults.dom.button.className = 'btn btn-default';
  // For update time :D
  // function updateCallTimeByMoment() {
  //   $('.time-update').text(moment().format('DD/MM/YY, h:mm:ss a'));
  // }
  //
  // updateCallTimeByMoment()
  // setInterval(function() {
  //   updateCallTimeByMoment()
  // }, 1000);
  // user_phone = $(".user-info [static-userdata=phone]").text();

  orderTableUserFilter = $("#user-filter").select2({
      ajax: {
        url: "/acp/order_user_filter",
        dataType: 'json',
        delay: 250,
        data: function(params) {
          console.log('orderTableUserFilter data', params);
          return {
            q: params.term, // search term
            page: params.page
          };
        },
        processResults: function(data, params) {
          // parse the results into the format expected by Select2
          // since we are using custom formatting functions we do not need to
          // alter the remote JSON data, except to indicate that infinite
          // scrolling can be used
          console.log('orderTableUserFilter params.page', params.page);
          params.page = params.page || 1;

          let newResult = [{ username: '', id: 'alluser',text: 'All Users' }]

          return {
            results: newResult.concat(data),

            pagination: {
              more: (params.page*30) < data.total_count
            }
          };
        },
        cache: true
      },

      escapeMarkup: function(markup) {
        return markup;
      }, // let our custom formatter work
//      minimumInputLength: 1,
      templateResult: function(data) {
        console.log('orderTableUserFilter templateResult data', data);
        var text = data.value || data.text || data.username
        return text;
      },
      templateSelection: function(data, container) {
        console.log('orderTableUserFilter templateSelection data', data);
        var text = data.value || data.text || data.username
        var selected = data.selected
        var justAddedClassName = (selected) ? null : 'just-added'
        return `<span class="${justAddedClassName}">${text}</span>`;
      },
      dropdownAutoWidth: true,
      width: 'auto',
    });

  orderTableShopFilter = $("#shop-filter").select2();
  acpOrderTableShopFilter = $("#admin-page #shop-filter").select2({
    ajax: {
      url: "/acp/order_shop_filter",
      dataType: 'json',
      delay: 250,
      data: function(params) {
        console.log('orderTableShopFilter data', params);
        return {
          user: SELECTED_USER,
          q: params.term, // search term
          page: params.page
        };
      },
      processResults: function(data, params) {
        // parse the results into the format expected by Select2
        // since we are using custom formatting functions we do not need to
        // alter the remote JSON data, except to indicate that infinite
        // scrolling can be used
        console.log('orderTableShopFilter params.page', params.page);
        params.page = params.page || 1;

        let newResult = [{ name: '', id: 'allstore',text: 'All Stores' }]

        return {
          results: newResult.concat(data),
          pagination: {
            more: (params.page*30) < data.total_count
          }
        };
      },
      cache: true
    },

    escapeMarkup: function(markup) {
      return markup;
    }, // let our custom formatter work
//      minimumInputLength: 1,
    templateResult: function(data) {
      console.log('orderTableShopFilter templateResult data', data);
      var text = data.value || data.text || data.name
      return text;
    },
    templateSelection: function(data, container) {
      console.log('orderTableShopFilter templateSelection data', data);
      var text = data.value || data.text || data.name
      var selected = data.selected
      var justAddedClassName = (selected) ? null : 'just-added'
      return `<span class="${justAddedClassName}">${text}</span>`;
    },
    dropdownAutoWidth: true,
    width: 'auto',
  });
  scpOrderTableShopFilter = $("#seller-page #shop-filter").select2({
    ajax: {
      url: "/scp/order_shop_filter",
      dataType: 'json',
      delay: 250,
      data: function(params) {
        console.log('orderTableShopFilter data', params);
        return {
          q: params.term, // search term
          page: params.page
        };
      },
      processResults: function(data, params) {
        // parse the results into the format expected by Select2
        // since we are using custom formatting functions we do not need to
        // alter the remote JSON data, except to indicate that infinite
        // scrolling can be used
        console.log('orderTableShopFilter params.page', params.page);
        params.page = params.page || 1;

        let newResult = [{ name: '', id: 'allstore',text: 'All Stores' }]

        return {
          results: newResult.concat(data),
          pagination: {
            more: (params.page*30) < data.total_count
          }
        };
      },
      cache: true
    },

    escapeMarkup: function(markup) {
      return markup;
    }, // let our custom formatter work
//      minimumInputLength: 1,
    templateResult: function(data) {
      console.log('orderTableShopFilter templateResult data', data);
      var text = data.value || data.text || data.name
      return text;
    },
    templateSelection: function(data, container) {
      console.log('orderTableShopFilter templateSelection data', data);
      var text = data.value || data.text || data.name
      var selected = data.selected
      var justAddedClassName = (selected) ? null : 'just-added'
      return `<span class="${justAddedClassName}">${text}</span>`;
    },
    dropdownAutoWidth: true,
    width: 'auto',
  });

  orderTableStatusFilter = $('#status-filter a')
  orderTableShopFilter.on("change", function (e) {
    console.log('select2:change', e);
  });
  orderTableUserFilter.on("select2:select", function (e) {
    SELECTED_SHOP = '';
    orderTableShopFilter.val('All Stores').trigger('change');
    var userName = e.params.data.username;

    let { id } = e.params.data


    acpOrderTable.columns( 3 ).search( userName ).draw();
    acpOrderTable.columns( 5 ).search( SELECTED_SHOP ).draw();

    if(id &&  id != 'alluser'){
      SELECTED_USER = id
    }
    if(id == 'alluser'){
      SELECTED_USER = '';
    }
    console.log('orderTableUserFilter e.params.data',  e.params.data);
    // console.log("select2:select", e.params.data);
  });

  orderTableShopFilter.on("select2:select", function (e) {
    if(e.params.data.name == 'All Stores'){
      var shopName = '';
    } else {
      var shopName = e.params.data.name;
    }
    orderTable.columns( 1 ).search( shopName ).draw();
    acpOrderTable.columns( 5 ).search( shopName ).draw();
    SELECTED_SHOP = shopName
    console.log("select2:select", e.params.data);
  });

  orderTableStatusFilter.each(function(){
    if($(this).attr('href')==location.hash){
      $(this).addClass('active')
    }
  })

  orderTableStatusFilter.on('click',function(){
    console.log($(this).text());
    orderTableStatusFilter.removeClass('active');
    $(this).addClass('active');
    let statusName = $(this).attr('href').replace('#','');
    let workorder = '';
    if($(this).attr('href') == '#All'){
      statusName = '';
    }

    if($(this).attr('href') == '#Picked'){
      statusName = '';
      workorder = 'picked'
    }
    if($(this).attr('href') == '#Printed'){
      statusName = '';
      workorder = 'print'
    }
    if($(this).attr('href') == '#CS'){
      statusName = '';
      workorder = 'cs-order'
    }
    if($(this).attr('href') == '#In-Production'){
      statusName = 'In-Production';
      workorder = 'no-pick'
    }

    console.log('statusName', statusName);
    orderTable.columns( 6 ).search( statusName ).draw();
    acpOrderTable.columns( 8 ).search( statusName ).draw();
    acpOrderTable.columns( 1 ).search( workorder ).draw();

  })

  orderTable = $('#order-table').DataTable({
    "bSort" : true,
    "language": datatablesLang,
    "ajax": {
      url: '/scp/order_datatable',
      data: function(data){
        // console.log('datadata', data);
        let newOrderData = _.clone(data);
        newOrderData = _.assign(newOrderData, {
          from: SELECTED_FROM_DATE,
          to: SELECTED_TO_DATE
        })
        SCP_ORDER_TABLE_DATA = _.clone(newOrderData);
        SCP_ORDER_TABLE_DATA.length = 10000; // reset length for export
        SCP_ORDER_TABLE_DATA.export_csv = '1'; // add export param to export data

        //http://localhost:3000/acp/order_datatable?draw=1&columns%5B0%5D%5Bdata%5D=id&columns%5B0%5D%5Bname%5D=id&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=id&columns%5B1%5D%5Bname%5D=id&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=username&columns%5B2%5D%5Bname%5D=username&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=shop&columns%5B3%5D%5Bname%5D=shop&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=order_name&columns%5B4%5D%5Bname%5D=order_name&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=createdAt&columns%5B5%5D%5Bname%5D=createdAt&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=name&columns%5B6%5D%5Bname%5D=name&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=tracking&columns%5B7%5D%5Bname%5D=tracking&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=total_item_price&columns%5B8%5D%5Bname%5D=total_item_price&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=1&order%5B0%5D%5Bdir%5D=desc&start=0&search%5Bvalue%5D=&search%5Bregex%5D=false&from=&to=&_=1502773193033
        return newOrderData
      }
    },
    "processing": true,
    // stateSave: true,
    "serverSide": true,
    "columnDefs": [
      // {
      //   "type": "MM/DD/YYYY",
      //   "target": 0
      // },
      {
        "width": "50px",
        "targets": 0
      },
      {
        "width": "200px",
        "targets": 3
      }
    ],
    "columns": [
      // {
      //   "render": function(data){
      //     return '<input type="checkbox" class="choose-order-id">';
      //   }
      // },

      {
        "name": "created_at",
        "data": "created_at",
        "orderable": true,
        "searchable": true,
        // "type": "datetime",
        // "format":"MM-DD-YYYY"
        // "render":function(data){
        //   return moment(data).format('MM/DD');
        // }
      },
      {
        "name": "shop",
        // hide this cols because we use the combo box filter
        "visible": true,
        "data": "shop",
        "searchable": true
      },
      {
        // "className": 'details-control',
        "orderable": true,
        // "data": null,
        "name": 'productionid',
        "data": 'productionid',
        "searchable": true,
        "defaultContent": '',
        "render":function(data, type, full, meta){
          let orderName = full.order_id;
          if(orderName){
            orderName = orderName.replace('sup', '');
          }
          return `<a href="/scp/order?id=${data}">${orderName}</a>`;
        }
      },
      {
        "name": "customer",
        "data": "customer",
        "searchable": true
      },
      {
        "name": "total_item_basecost",
        "data": "total_item_basecost",
        "searchable": false,
        "className": "text_price",
        "render":function(data, type, full, meta){
          let orderStatus = full.tracking;
          if(orderStatus=='Cancelled'){
            return `-`;
          } else {
            return `$${data}`;
          }
        }
      },
      {
        "name": "shipping_fee",
        "data": "shipping_fee",
        "searchable": false,
        "className": "text_price",
        "render":function(data, type, full, meta){
          let orderStatus = full.tracking;
          if(orderStatus=='Cancelled'){
            return `-`;
          } else {
            return `$${data}`;
          }
        }
      },
      {
        "name": "tracking",
        "data": "order_status",
        "searchable": true,
        "render":function(data, type, full, meta){
          let orderStatus = data;
          if(orderStatus=='Fulfilled'){
            //@TODO lấy tracking url bỏ vào đây để seller có thể xem tracking
            return `<span class="badge label-${data}"><a style="color:white" target="_blank" href="/tracking/get?id=${full.productionid}">${data}</a></span>`;
          } else {
            return `<span class="badge label-${data}">${data}</span>`;
          }
        }
      },
      // {
      //   "name": "total_price",
      //   "data": "total_price",
      //   "searchable": false,
      //   "render":function(data){
      //     return `$${data}`;
      //   }
      // },
      // {
      //   "name": "createdAt",
      //   "data": "createdAt",
      //   "searchable": true
      // },
    ],
    order:  [[ 2, 'desc' ]] , //desc ID
    // stateLoadCallback: function(settings, data) {
    //   console.log('stateLoadCallback settings', settings);
    //   console.log('stateLoadCallback data', data());
    //   console.log('stateLoadCallback item', localStorage.getItem( 'DataTables_' + settings.sInstance));
    //   return JSON.parse( localStorage.getItem( 'DataTables_' + settings.sInstance ) )
    // },
    stateLoadParams: function (settings, data) {
      let shopFilterData = data.columns[1].search.search;
      console.log('stateLoadParams', shopFilterData);
      if(shopFilterData)
        orderTableShopFilter.val(shopFilterData).trigger("change");
      // data.search.search = "";
    },
    searchCols: [{}, { /*search: ''*/ }, {}, {}, {}, {}, {}], // match with collums on html
    lengthMenu: [
      [25, 50, 100, -1], ['25 rows', '50 rows','100 rows', 'All' ]
    ],
    dom: 'Bfrtip',
    // select: {
    //   style: 'multi'
    // },
    buttons: ['pageLength',
      // {
      //   text: 'Select all',
      //   action: function () {
      //     orderTable.rows().select();
      //   }
      // },
      // {
      //   text: 'Select none',
      //   action: function () {
      //     orderTable.rows().deselect();
      //   }
      // }
    ]
  });

  acpOrderTable = $('#acp-order-table').DataTable({
    "bSort" : false,
    "language": datatablesLang,
    "ajax": {
      url: '/acp/order_datatable',
      data: function(data){
        // console.log('datadata', data);
        let newOrderData = _.clone(data);
        newOrderData = _.assign(newOrderData, {
          from: SELECTED_FROM_DATE,
          to: SELECTED_TO_DATE
        })
        ACP_ORDER_TABLE_DATA = _.clone(newOrderData);
        ACP_ORDER_TABLE_DATA.length = ''; // reset length for export
        ACP_ORDER_TABLE_DATA.export_csv = '1'; // add export param to export data

        //http://localhost:3000/acp/order_datatable?draw=1&columns%5B0%5D%5Bdata%5D=id&columns%5B0%5D%5Bname%5D=id&columns%5B0%5D%5Bsearchable%5D=true&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=id&columns%5B1%5D%5Bname%5D=id&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=true&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=username&columns%5B2%5D%5Bname%5D=username&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=true&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=shop&columns%5B3%5D%5Bname%5D=shop&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=true&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=order_name&columns%5B4%5D%5Bname%5D=order_name&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=true&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=createdAt&columns%5B5%5D%5Bname%5D=createdAt&columns%5B5%5D%5Bsearchable%5D=true&columns%5B5%5D%5Borderable%5D=true&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=name&columns%5B6%5D%5Bname%5D=name&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=true&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B7%5D%5Bdata%5D=tracking&columns%5B7%5D%5Bname%5D=tracking&columns%5B7%5D%5Bsearchable%5D=true&columns%5B7%5D%5Borderable%5D=true&columns%5B7%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B7%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B8%5D%5Bdata%5D=total_item_price&columns%5B8%5D%5Bname%5D=total_item_price&columns%5B8%5D%5Bsearchable%5D=true&columns%5B8%5D%5Borderable%5D=true&columns%5B8%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B8%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=1&order%5B0%5D%5Bdir%5D=desc&start=0&search%5Bvalue%5D=&search%5Bregex%5D=false&from=&to=&_=1502773193033
        return newOrderData
      }
    },
    "processing": true,
    "stateSave": true,
    "serverSide": true,
    // ordering: true,
    bSort:true,
    "columnDefs": [
      // { orderable: true, className: 'reorder', targets: 0 },
      {
        "width": "50px",
        "targets": 0
      },
      {
        "width": "200px",
        "targets": 3
      },
      {
        "targets": [ 4 ],
        "visible": false,
        "searchable": true
      },
    ],
    "columns": [
      // {
      //   "render": function(data){
      //     return '<input type="checkbox" class="choose-order-id">';
      //   }
      // },
      {
        "name": 'id',
        "data": 'id',
        "className": '',
        "orderable": false,
        "render":function(data){
          return `<input type="checkbox" data-order-id="${data}" class="choose-order-id">`;
        }
      },
      {
        "name": "tag",
        "data": "tag",
        "searchable": true,
        "visible": true,
        "render":function(data){
          if(data && data == 'picked'){
            return `<span class="label label-primary ${data}">${data}</span>`
          }  else if(data && data == 'print'){
            return `<span class="label label-success">${data}</span>`
          } else if(data && data == 'cs-order'){
            return `<span class="label label-success">CS</span>`
          } else {
            return ``
          }

        }
      },
      {
        // "className": 'details-control',
        // "orderable": true,
        // "data": null,
        "name": 'id',
        "data": 'id',
        "className": 'id2',
        "searchable": true,
        "defaultContent": '',
        "render":function(data, type, full, meta){
          return `<a href="/acp/order?id=${data}">${data}</a>`;
        }
      },
      {
        "name": "created_at",
        "data": "created_at",
        "searchable": true,
        // "orderable": true,
        // "type": "datetime",
        // "format":"MM-DD-YYYY"
        // "render":function(data){
        //   return moment(data).format('MM/DD/YYYY');
        // }
      },
      {
        "name": "username",
        "data": "username",
        "searchable": true
      },
      {
        "name": "shop",
        // hide this cols because we use the combo box filter
        "visible": true,
        "className": '',
        "data": "shop",
        "searchable": true,
        // "render":function(data){
        //   return `${data.replace('.myshopify.com','')}`;
        // }
      },
      {
        "name": "order_name",
        "data": "order_name",
        "searchable": true,
        "render":function(data){
          return data;
        }
      },

      {
        "name": "name",
        "data": "name",
        // "visible":false,
        "searchable": true,
        "render":function(data){
          return data;
        }
      },
      {
        "name": "tracking",
        "data": "tracking",
        "searchable": true,
        "render":function(data, type, full, meta){
          let orderStatus = full.tracking;
          if(orderStatus=='Fulfilled'){
            //@TODO lấy tracking url bỏ vào đây để seller có thể xem tracking
            return `<span class="badge label-${data}"><a style="color:white" target="_blank" href="/tracking/get?id=${full.orderid}">${data}</a></span>`;
          } else {
            return `<span class="badge label-${data}">${data}</span>`;
          }
        }
      },
      {
        "name": "total_item_basecost",
        "data": "total_item_basecost",
        "searchable": true,
        "className": "text_price",
        "render":function(data){
          return `$${parseFloat(data).toFixed(2)}`;
        }
      },
      {
        "name": "shipping_fee",
        "data": "shipping_fee",
        "searchable": true,
        "className": "text_price",
        "render":function(data){
          return `$${parseFloat(data).toFixed(2)}`;
        }
      },
      {
        "name": "total_item_price",
        "data": "total_item_price",
        "searchable": true,
        "className": "text_price",
        "render":function(data){
          return `$${parseFloat(data).toFixed(2)}`;
        }
      },

      // {
      //   "name": "total_price",
      //   "data": "total_price",
      //   "searchable": false,
      //   "render":function(data){
      //     return `$${data}`;
      //   }
      // },
      // {
      //   "name": "createdAt",
      //   "data": "createdAt",
      //   "searchable": true
      // },
    ],
    "order":  [[ 2, ACP_SORT_BY ]] , //desc ID
    // stateLoadCallback: function(settings, data) {
    //   console.log('stateLoadCallback settings', settings);
    //   console.log('stateLoadCallback data', data());
    //   console.log('stateLoadCallback item', localStorage.getItem( 'DataTables_' + settings.sInstance));
    //   return JSON.parse( localStorage.getItem( 'DataTables_' + settings.sInstance ) )
    // },
    stateLoadParams: function (settings, data) {
      let shopFilterData = data.columns[1].search.search;
      console.log('stateLoadParams', shopFilterData);
      if(shopFilterData)
        orderTableShopFilter.val(shopFilterData).trigger("change");
      // data.search.search = "";
    },
    searchCols: [{}, { /*search: ''*/ }, {}, {}, {}, {}, {}, {}], // match with collums on html
    lengthMenu: [
      [50, 100 , 200, 500], ['50 rows', '100 rows', '200 rows', '500 rows' ]
    ],
    dom: 'Bfrtip',
    // select: {
    //   style: 'multi'
    // },
    buttons: ['pageLength',
      // {
      //   text: 'Select all',
      //   action: function () {
      //     orderTable.rows().select();
      //   }
      // },
      // {
      //   text: 'Select none',
      //   action: function () {
      //     orderTable.rows().deselect();
      //   }
      // }
    ]
  });

  $('select#sort-by').on('change',function(){
    let sortBy = $(this).val();
    ACP_SORT_BY = sortBy;
    acpOrderTable.order([ 2, sortBy ]).draw();
  })

  orderTable.on( 'draw', function () {
    updateOrderStats();
  } );

  acpOrderTable.on( 'draw', function () {
    updateOrderStats();
    if(location.hash == '#In-Production'){
      $('span.picked').each(function(){
        $(this).parents('tr').css('display','none');
        $(this).parents('tr').find(':checkbox').removeClass('choose-order-id')
      });
    }
    // else if(location.hash == '#Picked'){
    //   $('span.label-Fulfilled').each(function(){
    //     $(this).parents('tr').css('display','none')
    //   });
    // }
  } );

  $('#order-table tbody').on('click', 'tr', function () {
    var data = orderTable.row( this ).data();
    // console.log('Click on data', data);
  } );
  $( document ).ready(function() {
    //
    $('table#acp-order-table tbody td.order-financial_status span').each(function(){
      if($(this).text() == 'Awaiting-Fulfillment') {
        $(this).parents('tr').find('input.choose-order-id').attr('disabled',false)
      }
    })
    $('input[name=country]').val($('select[name=country_code] option:selected').text())
  });
  $('select[name=country_code]').on('change',function(){
    $('input[name=country]').val($(this).find('option:selected').text())
  });
  $('form#editShippingAddress').on('submit',function(e){
    e.preventDefault();
    $('input.updateInfobutton').val('Updating ...')
    let editAddressData = $(this).serializeObject();
    console.log(editAddressData);
    socket.post('/shopify/update_address',editAddressData,function(data){
      if(data.result == 'true' ){
        location.reload()
      } else {
        $('input.updateInfobutton').val('Apply changes')
        alert(data.msg)
      }
    });
  });
  $('form#editEmailAddress').on('submit',function(e){
    e.preventDefault();
    $('input.updateInfobutton').val('Updating ...')
    let editEmailData = $(this).serializeObject();
    console.log(editEmailData);
    socket.post('/shopify/update_email',editEmailData,function(data){
      if(data.result == 'false'){
        $('input.updateInfobutton').val('Aplly changes')
        $('div.updateInfoNotify').html('<strong>Failed!</strong> '+data.msg)
        $('div.updateInfoNotify').removeClass('hide').addClass('in')
      } else {
        location.reload();
      }
    });
  });

  $('button.mark_status').click(function(){
    let status = $(this).data('status');
    let orderId = $('span.order-internal-id').text();
    console.log('orderId', orderId);
    console.log('status', status);
    swal({
      // className: 'remove-store-confirm',
      title: "Are you sure?",
      text: `Once changed, this order's status will change to ${status}!`,
      icon: "warning",
      dangerMode: false,
      button: {
        text: "Confirm",
        closeModal: false,
      },
    })
      .then((willChange) => {
        if (willChange) {
          socket.get(`/acp/change_status?status=${status}&id=${orderId}`,function(data){
            if(data.msg == 'success'){
              // location.reload()

              swal("Change status successfully!", {
                icon: "success",
                button: {
                  text: "OK",
                  closeModal: false,
                },
              }).then(result => {
                location.reload()
              })
            } else {
              swal(`Change status error, ${data.content}!`, {
                icon: "error",
                button: {
                  text: "OK",
                  closeModal: false,
                },
              }).then(result => {
                swal.close();
              });
            }

          })
        } else {
          swal.stopLoading();
          swal.close();
        }
      });
  })
  //pickup order & export to excel
  $('.picklist').click(function(){
    console.log('.pickup-orders clicked');
    let by = $(this).attr('data-text');
    let selectedOrders = $('.choose-order-id:checked').map(function() {
      return $(this).data('order-id');
    }).get();
    // let params = $.param( { selectedOrders } );

    // console.log('paramsCompressed', paramsCompressed);
    // paramsCompressed = btoa(paramsCompressed);
    // paramsCompressed= encodeURI(paramsCompressed);
    // console.log('paramsCompressed', paramsCompressed);
    // redirect to download
    let url = window.location.origin;
    // console.log('params', params);
    if(by == 'mark'){
      let byStatus = $(this).attr('data-status');
      socket.get(`/acp/mark_status`,{selectedOrders,byStatus},function(){
        location.reload();
      });
    } else {
      selectedOrders = selectedOrders.join();
      let paramsCompressed = LZMA_WORKER.compress(selectedOrders);
      paramsCompressed = paramsCompressed.join();
      window.open(`${url}/acp/picklist?by=${by}&paramsCompressed=${paramsCompressed}`,'_blank')
    }

  });

  $('.download_design').click(function(){
    console.log('.pickup-orders clicked');

    let selectedOrders = $('.choose-order-id:checked').map(function() {
      return $(this).data('order-id');
    }).get();
    //
    // let url = window.location.origin;

    socket.get(`/acp/download_design`,{selectedOrders},function(data){
      console.log('data', data);
    });


  });

  $('.export-order-csv').click(function(){
    console.log('.export-orders-csv clicked');

    let selectedOrders = $('.choose-order-id:checked').map(function() {
      return $(this).data('order-id');
    }).get();
    let url = window.location.origin;

      selectedOrders = selectedOrders.join();
      let paramsCompressed = LZMA_WORKER.compress(selectedOrders);
      paramsCompressed = paramsCompressed.join();
      window.open(`${url}/acp/export_order_csv?paramsCompressed=${paramsCompressed}`,'_blank')


  });

  $('.mark-as-production').click(function(){
    console.log('.mark-as-production');

    let selectedOrders = $('.choose-order-id:checked').map(function() {
      return $(this).data('order-id');
    }).get();
    console.log('selectedOrders', selectedOrders);
    socket.get(`/acp/mark_as_production`,selectedOrders,function(){
      location.reload();
    });

  })

  $('.mark-as-pickup').click(function(){
    console.log('.pickup-orders');

    let selectedOrders = $('.choose-order-id:checked').map(function() {
      return $(this).data('order-id');
    }).get();
    console.log('selectedOrders', selectedOrders);
      socket.get(`/acp/mark_as_pickup`,selectedOrders,function(){
        location.reload();
      });

  })

  $('.mark-as-print').click(function(){
    console.log('.pickup-orders');

    let selectedOrders = $('.choose-order-id:checked').map(function() {
      return $(this).data('order-id');
    }).get();
    console.log('selectedOrders', selectedOrders);
    socket.get(`/acp/mark_as_print`,selectedOrders,function(){
      location.reload();
    });

  })

  $('.mark-as-cs').click(function(){
    console.log('.pickup-orders');

    let selectedOrders = $('.choose-order-id:checked').map(function() {
      return $(this).data('order-id');
    }).get();
    console.log('selectedOrders', selectedOrders);
    socket.get(`/acp/mark_as_cs`,selectedOrders,function(){
      location.reload();
    });

  })

  $('.remove-tag').click(function(){
    console.log('.pickup-orders');

    let selectedOrders = $('.choose-order-id:checked').map(function() {
      return $(this).data('order-id');
    }).get();
    console.log('selectedOrders', selectedOrders);
    socket.get(`/acp/remove_tag`,selectedOrders,function(){
      location.reload();
    });

  })


  var start = moment('01/01/2017');
  var end = moment();


  function cb(start, end) {
    if($('#orderreportrange').length === 0){
      return;
    }
    $('#orderreportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));

    let from = start.format('MM/DD/YYYY')
    let to = end.format('MM/DD/YYYY')

    SELECTED_FROM_DATE = from;
    SELECTED_TO_DATE = to;
    console.log('from', from);
    console.log('to', to);
    // console.log('dashboard-range', query);
    $('.order-report-content').html('loading...');

    orderTable.ajax.reload(null, false);

    let postURL = '/scp/scp_order_stats';
    if(IN_ACP){
      acpOrderTable.ajax.reload(null, false);
      console.log('IN ACP TRUE');
      postURL = '/acp/order_stats'
    }
    socket.get( postURL, { from, to }, function( data ) {
      console.log(postURL, data);
    } )
  }

  $('#orderreportrange').daterangepicker({
    minDate: '01/01/2017',
    maxDate: moment().format('MM/DD/YYYY'),
//      autoApply: true,
//      "dateLimit": {
//        "months": 12
//      },
//      showDropdowns: true,
//      timePicker: true,
//      ranges: {
//        'Today': [moment(), moment()],
//        'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
//        'Last 7 Days': [moment().subtract(6, 'days'), moment()],
//        'Last 30 Days': [moment().subtract(29, 'days'), moment()],
//        'This Month': [moment().startOf('month'), moment().endOf('month')],
//        'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
//      },
//      showCustomRangeLabel: true,
    locale: {
      format: 'MM/DD/YYYY'
    }
  }, cb);

  cb(start, end);

  $('#export-order-csv').click(function(){
    console.log('export csv');
    let downloadOrderCsvParams = $.param( SCP_ORDER_TABLE_DATA, false );
    console.log('downloadOrderCsvParams', downloadOrderCsvParams);
    // URI('/acp/order_datatable').addQuery(downloadOrderCsvUrl).build().toString()
    window.location = `/scp/order_datatable?${downloadOrderCsvParams}`;
  })

  // $('.mark-as-production').click(function(){
  //   let selectedOrders = $('.choose-order-id:checked').map(function() {
  //     return $(this).data('order-id');
  //   }).get();
  //   let params = $.param( { selectedOrders } );
  //
  //   //
  // })
  $('#internal-notes').editable({
    ajaxOptions: {
      type: 'post',
      dataType: 'json'
    },
    params: function(params) {
      //originally params contain pk, name and value

      params[params.name] = params.value;
      params.order = getParam('id');
      console.log('params', params);
      return params;
    },
    success: function(response, newValue) {
      noty({
        text: `<b>Updated!</b> 
        <div>Your Note has been updated!</div>`,
        type: 'success',
      });
      // console.log('response', response);
      // console.log('newValue', newValue);
      // return 'Updated';
    },
    type: 'textarea',
    pk: 1,
    // mode: 'inline',
    url: '/acp/update_order',
    title: 'Enter note'
  });

  $('#tag').editable({
    ajaxOptions: {
      type: 'post',
      dataType: 'json'
    },
    params: function(params) {
      //originally params contain pk, name and value

      params[params.name] = params.value;
      params.order = getParam('id');
      console.log('params', params);
      return params;
    },
    success: function(response, newValue) {
      noty({
        text: `<b>Updated!</b> 
        <div>Your Tags has been updated!</div>`,
        type: 'success',
      });
      // console.log('response', response);
      // console.log('newValue', newValue);
      // return 'Updated';
    },
    type: 'text',
    pk: 1,
    mode: 'inline',
    url: '/acp/update_order',
    title: 'Enter tags'
  });

  $('.dataTables_filter input[type=search]').keypress(function(e) {
    let searchKey = $(this).val();
    if(e.which == 13 && searchKey.match(/^\d+$/) && searchKey.length > 3 && $('#acp-order-table tbody tr td').length > 1) {
      // window.open(`/acp/order?id=${searchKey}`, '_blank');
      location.href = `/acp/order?id=${searchKey}`;
    }
  });



})

