let designTable;

$(function(){

  designTable = $('#design-table').DataTable({
    "bSort" : false,
    "language": datatablesLang,
    "ajax": "/design/datatable",
    "processing": true,
    stateSave: true,
    "serverSide": true,


    "columnDefs": [

      // {
      //   "width": "50px",
      //   "targets": 0
      // },
    ],

    "columns": [

      {
        "name": "thumbUrl",
        "data": "thumbUrl",
        "searchable": false,
        "className": "click-to-download",
        "defaultContent": '',
        "render":function(data, type, full, meta){
          return `<a data-toggle="tooltip" title="Click to download origin!" href="https://img.gearment.com/unsafe/${full.id}" download><img style="max-width:150px;" src="${data}"></a>`;
        }
      },

      {
        // "className": 'details-control',
        // "orderable": false,
        // "data": null,
        "name": 'design_id',
        "data": 'design_id',
        "searchable": true,
        "defaultContent": '',
        "render":function(data, type, full, meta){
          return data;
        }
      },

      {
        "name": "username",
        "data": "username",
        "searchable": true,
        "defaultContent": '',
        "searchable": true,
        "render":function(data){
          return data;
        }
      },
      //
      {
        "name": "createdAt",
        "data": "createdAt",
        "searchable": false,
        // "type": "datetime",
        // "format":"MM-DD-YYYY"
        "render":function(data){
          return moment(data).format('MM/DD/YYYY');
        }
      },

      {
        // "className": 'details-control',
        "name": 'id',
        "data": 'id',
        "searchable": true,
        "defaultContent": '',
        "render":function(data){
          return `<a href="/design/search_order?design=${data}"><i class="fa fa-search"></i></a>`;
        }
      }

    ],
    order:  [[ 0, 'desc' ]] , //desc ID
    // stateLoadCallback: function(settings, data) {
    //   console.log('stateLoadCallback settings', settings);
    //   console.log('stateLoadCallback data', data());
    //   console.log('stateLoadCallback item', localStorage.getItem( 'DataTables_' + settings.sInstance));
    //   return JSON.parse( localStorage.getItem( 'DataTables_' + settings.sInstance ) )
    // },
    // stateLoadParams: function (settings, data) {
    //   let shopFilterData = data.columns[1].search.search;
    //   console.log('stateLoadParams', shopFilterData);
    //   if(shopFilterData)
    //     orderTableShopFilter.val(shopFilterData).trigger("change");
    //   // data.search.search = "";
    // },
    searchCols: [{}, { /*search: ''*/ }, {}, {}, {}, {}, {}], // match with collums on html
    lengthMenu: [
      [25, 50, 100], ['25 rows', '50 rows','100 rows' ]
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
})
