// requeue
$.get('https://dashboard.gearment.com/kue/jobs/failed/0..200/asc', function(e){
  e.map(function(item){
    console.log('item', item, item.id);
    // item.id
    $.get('https://dashboard.gearment.com/kue/inactive/'+item.id, function(r) {
      console.log('r', r);
    })
  })
})
