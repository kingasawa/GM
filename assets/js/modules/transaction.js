let scpTransactionTable;
let acpTransactionTable;
let tableStatusFilter;
let tableShopFilter;

$(function() {

  let checkUrl = ['/scp/transactions','/acp/transactions','/acp/transaction','/scp/transaction'];
  if(checkUrl.includes(window.location.pathname) == false) return false;


  let totalAmount = 0;
  $('table#transaction-details-table tbody tr').each(function(){
    let itemCost = $(this).find('td.transaction_item_cost').text();
    console.log('cost',itemCost)
    totalAmount += parseFloat(itemCost);
  });

  $('.total_amount span').text(parseFloat(totalAmount).toFixed(2))

  let detailsShopFilter = $("#details-shop-filter").select2();
  detailsShopFilter.on("select2:select", function (e) {
    // let redirectTo;
    // if(e.params.data.text == 'All Stores'){
    //   redirectTo = e.params.data.element.baseURI;
    // } else {
    //   redirectTo = `${location.href}&filter=${e.params.data.text}`
    // }
    //
    // location.href = redirectTo
  });
  tableShopFilter = $("#shop-filter").select2();
  tableShopFilter.on("change", function (e) {
    console.log('select2:change', e);
  });
  tableShopFilter.on("select2:select", function (e) {
    if(e.params.data.text == 'All Stores'){
      var shopName = '';
    } else {
      var shopName = e.params.data.text;
    }
    acpTransactionTable.columns( 2 ).search( shopName ).draw();
    console.log("select2:select", e.params.data);
  });
  tableStatusFilter = $('#status-filter a')
  // $(document).ready(function(){
  //   tableStatusFilter.each(function(){
  //     if($(this).attr('href')==location.hash){
  //       $(this).addClass('active')
  //     }
  //   })
  // })
  let statusName;
  tableStatusFilter.on('click',function(){
    // console.log($(this).text());
    tableStatusFilter.removeClass('active');
    statusName = $(this).data('status')
    $(this).addClass('active');
    console.log(statusName);
    scpTransactionTable.columns( 5 ).search( statusName ).draw();
    acpTransactionTable.columns( 7 ).search( statusName ).draw();
  })

  // let transactionTable = $('#transaction-table').dataTable({});
  acpTransactionTable = $('#acp-transaction-table').DataTable({
    "bSort" : true,
    "language": datatablesLang,
    "ajax": {
      url: `/transaction/acp_datatable`,
      data: { by: getParam('by') }
    },
    "processing": true,
    // stateSave: true,
    "serverSide": true,
    "columnDefs": [
      // {
      //   "width": "150px",
      //   "targets": 0
      // },
      {
        "width": "200px",
        "targets": [1,3]
      }
    ],
    "columns": [
      {
        "className":'details-control',
        "defaultContent": '',
        "data": "owner",
        "name": "owner",
        "render":function(data, type, full, meta){
          return `<div class="hidden"><span class="owner-id">${data}</span><span class="batch-id">${full.time}</span></div>`;
        }

      },
      {
        "name": "createdAt",
        "data": "createdAt",
        "orderable": true,
        "searchable": true,
        "render":function(data){
          return moment(data).format('MM/DD/YYYY h:mm a');
        }
      },
      // {
      //   // "className": 'details-control',
      //   "orderable": true,
      //   // "data": null,
      //   "name": 'id',
      //   "data": 'id',
      //   "searchable": true,
      //   "defaultContent": '',
      //   "render":function(data, type, full, meta){
      //
      //     return `<a href="/acp/transaction?id=${data}">${full.method.slice('0',4).toUpperCase()}${data}</a>`;
      //   }
      // },
      {
        "name": "time",
        "data": "time",
        // hide this cols because we use the combo box filter
        // "visible": false,
        "searchable": true
      },

      {
        "name": "username",
        "data": "username",
        "searchable": true
      },
      {
        "name": "email",
        "data": "email",
        "searchable": true
      },
      // {
      //   "name": "method",
      //   "data": "method",
      //   "searchable": true
      // },
      {
        // "className": 'text_price',
        "name": "total_order",
        "data": "total_order",
        "searchable": true,

      },
      {
        "className": 'text_price',
        "name": "total_amount",
        "data": "total_amount",
        "searchable": true,
        "render":function(data){
          return `$${numeral(data).format('0,0.00')}`;
        }
      },
      {
        // "className": 'text_price',
        "name": "time",
        "data": "time",
        "searchable": true,
        "render":function(data){
          return `<a class="btn btn-info btn-sm" href="/acp/transaction?getCsv=${data}">
            <i class="fa fa-download"></i> Download</a>`;
        }

      },


    ],
    order:  [[ 1, 'desc' ]] , //desc ID
    stateLoadParams: function (settings, data) {
      let shopFilterData = data.columns[1].search.search;
      console.log('stateLoadParams', shopFilterData);
      if(shopFilterData)
        tableShopFilter.val(shopFilterData).trigger("change");
      // data.search.search = "";
    },
    searchCols: [{}, { /*search: ''*/ }, {}, {}, {}, {}, {}], // match with collums on html
    lengthMenu: [
      [100, 200, 500], ['100 rows', '200 rows','500 rows' ]
    ],
    dom: 'Bfrtip',
    buttons: ['pageLength']
  });

  scpTransactionTable = $('#scp-transaction-table').DataTable({
    "bSort" : true,
    "language": datatablesLang,
    "ajax": {
      url: `/transaction/scp_datatable`,
      data: { by: getParam('by') }
    },
    "processing": true,
    // stateSave: true,
    "serverSide": true,
    "columnDefs": [
      // {
      //   "width": "150px",
      //   "targets": 0
      // },
      {
        "width": "200px",
        "targets": [1,3]
      }
    ],
    "columns": [
      {
        "className":'details-control',
        "defaultContent": '',
        "data": "owner",
        "name": "owner",
        "render":function(data, type, full, meta){
          return `<div class="hidden"><span class="owner-id">${data}</span><span class="batch-id">${full.time}</span></div>`;
        }

      },
      {
        "name": "createdAt",
        "data": "createdAt",
        "orderable": true,
        "searchable": true,
        "render":function(data){
          return moment(data).format('MM/DD/YYYY h:mm a');
        }
      },
      {
        "name": "time",
        "data": "time",
        // hide this cols because we use the combo box filter
        // "visible": false,
        "searchable": true
      },
      {
        // "className": 'text_price',
        "name": "total_order",
        "data": "total_order",
        "searchable": true,

      },
      {
        "className": 'text_price',
        "name": "total_amount",
        "data": "total_amount",
        "searchable": true,
        "render":function(data){
          return `$${numeral(data).format('0,0.00')}`;
        }
      },
      {
        // "className": 'text_price',
        "name": "time",
        "data": "time",
        "searchable": true,
        "render":function(data){
          return `<a class="btn btn-info btn-sm" href="/scp/transaction?getCsv=${data}">
            <i class="fa fa-download"></i> Download</a>`;
        }

      },


    ],
    order:  [[ 0, 'desc' ]] , //desc ID
    stateLoadParams: function (settings, data) {
      let shopFilterData = data.columns[1].search.search;
      console.log('stateLoadParams', shopFilterData);
      if(shopFilterData)
        tableShopFilter.val(shopFilterData).trigger("change");
      // data.search.search = "";
    },
    searchCols: [{}, { /*search: ''*/ }, {}, {}, {}, {}, {}], // match with collums on html
    lengthMenu: [
      [100, 200, 500], ['100 rows', '200 rows','500 rows' ]
    ],
    dom: 'Bfrtip',
    buttons: ['pageLength']
  });

  function format ( d ) {
    console.log('d', d);
    // `d` is the original data object for the row
    return `<table border="0" class="table-data-info-${d.time}">
              <thead>
              <th>TransactionID</th>
              <th>Store</th>
              <th>Orders</th>
              <th>Amount</th>
              </thead>
              <tbody class="transaction-details-body"></tbody></table>`;
  }

  $('#acp-transaction-table tbody').on('click', 'td.details-control', function () {
    let owner = $(this).find('span.owner-id').text();
    let batchid = $(this).find('span.batch-id').text();
    console.log('owner', owner);
    console.log('batchid', batchid);
    socket.get(`/acp/transactions?owner=${owner}&batchid=${batchid}`,function(data){
      $(`table.table-data-info-${owner} tbody`).html("");
      _.each(data,function(detail){
        let appendData = `<tr>
        <td><a href="/acp/transaction?id=${detail.transactionID}">${detail.transactionID}</a></td>
        <td>${detail.shop}</td>
        <td>${detail.total_order}</td>
        <td>$${numeral(detail.amount).format('0,0.00')}</td></tr>`;
        $(`table.table-data-info-${batchid} tbody.transaction-details-body`).append(appendData);
      })

    });
    let tr = $(this).closest('tr');
    let row = acpTransactionTable.row( tr );

    if ( row.child.isShown() ) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass('shown');
    }
    else {
      // Open this row
      row.child( format(row.data()) ).show();
      tr.addClass('shown');
    }
  } );

  $('#scp-transaction-table tbody').on('click', 'td.details-control', function () {
    let owner = $(this).find('span.owner-id').text();
    let batchid = $(this).find('span.batch-id').text();
    console.log('owner', owner);
    console.log('batchid', batchid);
    socket.get(`/scp/transactions?owner=${owner}&batchid=${batchid}`,function(data){
      $(`table.table-data-info-${owner} tbody`).html("");
      _.each(data,function(detail){
        let appendData = `<tr>
        <td><a href="/acp/transaction?id=${detail.transactionID}">${detail.transactionID}</a></td>
        <td>${detail.shop}</td>
        <td>${detail.total_order}</td>
        <td>$${numeral(detail.amount).format('0,0.00')}</td></tr>`;
        $(`table.table-data-info-${batchid} tbody.transaction-details-body`).append(appendData);
      })

    });
    let tr = $(this).closest('tr');

    let row = scpTransactionTable.row( tr );

    if ( row.child.isShown() ) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass('shown');
    }
    else {
      // Open this row
      row.child( format(row.data()) ).show();
      tr.addClass('shown');
    }
  } );

  // console.log('acpTransactionTable', acpTransactionTable.state.loaded().columns[6].search.search);
  //
  // var filterStatusState = _.get(acpTransactionTable.state.loaded(), 'columns[6].search.search', '');
  // // console.log('acpTransactionTable.state.loaded()', acpTransactionTable.state.loaded().columns[6]);
  // console.log('filterStatusState', filterStatusState);
  // if(filterStatusState)
  //   $(`#status-filter a[data-status=${filterStatusState}]`).addClass('active');



  let transactionStatus = $('.transaction_status span').text();
  if(transactionStatus == 'Paid'){
    $('button.mark-as-paid').attr('disabled',true);
  }
  $('.mark-as-paid').on('click',function(){
    let status =  $('.transaction_status span');

    status.html(`<i class="fa fa-spinner fa-spin"></i>`)
    let id = getParam('id');
    socket.post(`/acp/mark_as_paid?id=${id}`,function(result){
      status.html(`Paid`).css('color','#4CAF50');
      $('button.mark-as-paid').attr('disabled',true);
    })
  })


  // $('table#acp-transaction-table td.details-control').click(function(){
  //   let owner = $(this).find('span.owner-id');
  //   let batchid = $(this).find('span.batch-id');
  //   console.log('owner', owner);
  //   console.log('batchid', batchid);
  //   $('tr#owner-'+owner).toggleClass('hidden');
  //   $(this).toggleClass('hide-detail')
  //   socket.get(`/acp/transactions?owner=${owner}&batchid=${batchid}`,function(data){
  //     $('tr#owner-'+owner+' tbody.transaction-details-body').html("");
  //     _.each(data,function(detail){
  //       let appendData = `<tr>
  //       <td><a href="/acp/transaction?id=${detail.transactionID}">${detail.transactionID}</a></td>
  //       <td>${detail.shop}</td>
  //       <td>${detail.total_order}</td>
  //       <td>$${detail.amount}</td></tr>`;
  //       $('tr#owner-'+owner+' tbody.transaction-details-body').append(appendData);
  //     })
  //
  //   });
  //
  // })
  // $('a.hide-detail').click(function(){
  //   let owner = $(this).data('id');
  //   console.log('owner', owner);
  //   $('tr#owner-'+owner).addClass('hidden');
  // })
  $('.numer-format').each(function(){
    let formatNumber = $(this).text();
    $(this).text(numeral(formatNumber).format('0,0.00'));
  })

  $('button.transaction-create').click(function(){
    // console.log('create transaction');
    socket.get('/transaction/create',function(result){
      console.log('result', result);
      location.reload();
    })
  })

})


