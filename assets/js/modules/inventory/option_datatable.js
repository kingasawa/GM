// let optionDatatable;
// let optionDatatableShopFilter;
// let optionDatatableStatusFilter;
//
// $(function() {
//
//   // if(['/inventory'].includes(window.location.pathname) == false) return false;
//
//   $.fn.dataTable.Buttons.defaults.dom.button.className = 'btn btn-default';
//
//   // optionDatatableShopFilter = $("#shop-filter").select2();
//   // optionDatatableStatusFilter = $('#status-filter a')
//   //
//   // optionDatatableShopFilter.on("change", function (e) {
//   //   console.log('select2:change', e);
//   // });
//   // optionDatatableShopFilter.on("select2:select", function (e) {
//     // if(e.params.data.text == 'All Stores'){
//     //   var shopName = '';
//     // } else {
//     //   var shopName = e.params.data.text;
//     // }
//     // optionDatatable.columns( 1 ).search( shopName ).draw();
//     // console.log("select2:select", e.params.data);
//   // });
//
//   // optionDatatableStatusFilter.on('click',function(){
//   //   console.log($(this).text());
//   //   optionDatatableStatusFilter.removeClass('active');
//   //   $(this).addClass('active');
//   //   if($(this).attr('href') == '#All'){
//   //     var statusName = '';
//   //   } else {
//   //     var statusName = $(this).attr('href').replace('#','');
//   //   }
//   //
//   //   optionDatatable.columns( 6 ).search( statusName ).draw();
//   // })
//
//   optionDatatable = $('#inventory-table').DataTable({
//     "bSort" : false,
//     "language": datatablesLang,
//     "ajax": "/inventory/inventory_data",
//     "processing": true,
//     stateSave: true,
//     "serverSide": true,
//
//     "columnDefs": [
//       {
//         "width": "50px",
//         "targets": 0
//       },
//       {
//         "width": "200px",
//         "targets": 3
//       }
//     ],
//
//     "columns": [
//
//       {
//         "name": "item",
//         "data": "item",
//         "searchable": true,
//
//       },
//       {
//         "name": "displayName",
//         "data": "displayName",
//         "searchable": true,
//
//       },
//       {
//         "name": "type",
//         "data": "type",
//         "searchable": true
//       },
//       {
//         "name": "color",
//         "data": "color",
//         "searchable": true,
//
//       },
//       {
//         "name": "sku",
//         "data": "sku",
//         "searchable": true,
//       },
//       {
//         "name": "shippingWeight",
//         "data": "shippingWeight",
//         "searchable": true,
//
//       },
//       {
//         "name": "base_price",
//         "data": "base_price",
//         "searchable": true,
//       },
//
//       // {
//       //   "name": "createdAt",
//       //   "data": "createdAt",
//       //   "searchable": true,
//       // }
//
//     ],
//     order:  [[ 0, 'desc' ]] , //desc ID
//
//     stateLoadParams: function (settings, data) {
//       let shopFilterData = data.columns[1].search.search;
//       console.log('stateLoadParams', shopFilterData);
//       if(shopFilterData)
//         optionDatatableShopFilter.val(shopFilterData).trigger("change");
//       // data.search.search = "";
//     },
//     searchCols: [{}, { /*search: ''*/ }, {}, {}, {}, {}, {}], // match with collums on html
//     lengthMenu: [
//       [25, 50, 100], ['25 rows', '50 rows','100 rows' ]
//     ],
//     dom: 'Bfrtip',
//
//     buttons: ['pageLength',
//
//       // }
//     ]
//   });
//
//
//
// })
