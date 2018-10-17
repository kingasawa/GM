let inventoryTable;
let inventoryTableShopFilter;
let inventoryTableStatusFilter;

$(function() {

  // if(['/inventory'].includes(window.location.pathname) == false) return false;

  $.fn.dataTable.Buttons.defaults.dom.button.className = 'btn btn-default';

  // inventoryTableShopFilter = $("#shop-filter").select2();
  // inventoryTableStatusFilter = $('#status-filter a')
  //
  // inventoryTableShopFilter.on("change", function (e) {
  //   console.log('select2:change', e);
  // });
  // inventoryTableShopFilter.on("select2:select", function (e) {
    // if(e.params.data.text == 'All Stores'){
    //   var shopName = '';
    // } else {
    //   var shopName = e.params.data.text;
    // }
    // inventoryTable.columns( 1 ).search( shopName ).draw();
    // console.log("select2:select", e.params.data);
  // });

  // inventoryTableStatusFilter.on('click',function(){
  //   console.log($(this).text());
  //   inventoryTableStatusFilter.removeClass('active');
  //   $(this).addClass('active');
  //   if($(this).attr('href') == '#All'){
  //     var statusName = '';
  //   } else {
  //     var statusName = $(this).attr('href').replace('#','');
  //   }
  //
  //   inventoryTable.columns( 6 ).search( statusName ).draw();
  // })


  $.fn.editable.defaults.mode = 'popup';
  // $('.skuInput').editable();

  // inventoryTable.ajax.reload( null, false );

  inventoryTable = $('#inventory-table').DataTable({
    // responsive: true,

    // For fixed header no scroller
    "fixedHeader": true,

    // For Scroller please set fixedheader false
    // deferRender:    false,
    // scrollY:        500,
    // scrollCollapse: true,
    // scroller:       true,

    "language": datatablesLang,
    "ajax": "/inventory/inventory_data",
    "processing": true,
    // stateSave: true,
    "serverSide": true,

    "columnDefs": [
      {
        "width": "50px",
        "targets": [0,1,3,4,6]
      },
    ],

    "columns": [

      {
        "name": "id",
        "data": "id",
        "searchable": true,
        "render": function(data, type, full, meta){
          let { material } =  full
          // console.log('id data', data, full);
          return `<a href="/inventory/itemView?id=${material}&productId=${data}" >${data}<a>`;
        }
      },
      {
        "name": "material",
        "data": "material",
        "searchable": true,
      },
      {
        "name": "brand",
        "data": "brand",
        "searchable": true,
      },

      {
        "name": "color",
        "data": "color",
        "searchable": true,

      },
      {
        "name": "size",
        "data": "size",
        "searchable": true,
      },
      {
        "name": "shippingWeight",
        "data": "shippingWeight",
        "searchable": true,
        "render": function(data, type, full, meta){
          let { id } =  full
          // console.log('full', full);
          // console.log('id data', data, full);
          return `<span data-pk="${id}" data-name="shippingWeight" class="editable-field">${data || ''}</span>`;
        }
      },

      {
        "name": "base_price",
        "data": "base_price",
        "searchable": true,
        "render": function(data, type, full, meta){
          let { id } =  full
          // console.log('full', full);
          // console.log('id data', data, full);
          return `<span data-pk="${id}" data-name="base_price" class="editable-field">${data || ''}</span>`;
        }
      },
      {
        "name": "gtin",
        "data": "gtin",
        "searchable": true,
        "render": function(data, type, full, meta){
          let { id } =  full
          // console.log('full', full);
          // console.log('id data', data, full);
          return `<span data-pk="${id}" data-name="gtin" class="editable-field">${data || ''}</span>`;
        }
      },
      {
        "name": "stock",
        "data": "stock",
        "searchable": true,
        "render": function(data, type, full, meta){
          let { id } =  full

          if(data === null){
            data = ''
          }

          // console.log('full', full);
          // console.log('id data', data, full);
          return `<span data-pk="${id}" data-name="stock" data-type="stock" class="editable-field">${data}</span>`;
        }
      },
      {
        "name": "sku",
        "data": "sku",
        "searchable": true,
        "render": function(data, type, full, meta){
          let { id } =  full
          if(data === null){
            data = ''
          }
          // console.log('full', full);
          // console.log('id data', data, full);
          return `<span data-pk="${id}" data-name="sku" class="editable-field">${data}</span>`;
        }
      },

      // {
      //   "name": "createdAt",
      //   "data": "createdAt",
      //   "searchable": true,
      // }

    ],
    order:  [[ 1, 'asc' ], [3, 'asc'], [4, 'asc']] , //desc ID
// "bSort" : true,
//     stateLoadParams: function (settings, data) {
      // let shopFilterData = data.columns[1].search.search;
      // console.log('stateLoadParams', shopFilterData);
      // if(shopFilterData)
      //   inventoryTableShopFilter.val(shopFilterData).trigger("change");
      // data.search.search = "";
    // },
    searchCols: [{}, { /*search: ''*/ }, {}, {}, {}, {}, {}], // match with collums on html
    lengthMenu: [
      [100, 200, 500, 1000], ['100 rows', '200 rows','500 rows','1000 rows' ]
    ],
    dom: 'Bfrtip',

    buttons: ['pageLength'],
    "drawCallback": function( settings ) {
      console.log('done');
      $('.editable-field').editable({
        ajaxOptions: {
          type: 'post',
          dataType: 'json'
        },
        // params: function(params) {
        //   //originally params contain pk, name and value
        //   console.log('params', params);
        //   params[params.name] = params.value;
        //   // params.a = 1;
        //   return params;
        // },
        success: function(response, newValue) {
          noty({
            text: `<b>Updated!</b> 
            <div>Your variant has been updated!</div>`,
            type: 'success',
          });
          // console.log('response', JSON.stringify(response));
          // console.log('newValue', newValue);
        },
        type: 'text',
        // pk: 1,
        url: '/inventory/updateVariant',
        title: 'Enter value'
      });

      $('.editable-field').on('shown', function(e, editable) {
        console.log('editable', editable);
        let { options: { name } } = editable;
        let updateForAllSize = [
          'shippingWeight', 'base_price'
        ];

        if ((updateForAllSize.includes(name))){
          noty({
            text: `Warning! ${name} will be updated for all Color within this Size!`,
            type: 'warning'
          })
        }
        // console.log('name', name);
        // editable.input.$input.val('overwriting value of input..');
      });

      $('.editable-field').on('save', function(e, params) {
        inventoryTable.ajax.reload( null, false );
      });

      // var api = this.api();

      // Output the data for the visible rows to the browser's console
      // console.log( api.rows( {page:'current'} ).data() );
    }

  });



})
