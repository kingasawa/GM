// No offline
// $(function() {
//   let offlineActionTimeout;
//
//   Offline.options = {
//     // Should we check the connection status immediatly on page load.
//     checkOnLoad: false,
//
//     // Should we monitor AJAX requests to help decide if we have a connection.
//     interceptRequests: false,
//
//     // Should we automatically retest periodically when the connection is down (set to false to disable).
//     reconnect: {
//       // How many seconds should we wait before rechecking.
//       initialDelay: 5,
//
//       // How long should we wait between retries.
//       delay: (3)
//     },
//
//     // Should we store and attempt to remake requests which fail while the connection is down.
//     requests: false,
//
//     // Should we show a snake game while the connection is down to keep the user entertained?
//     // It's not included in the normal build, you should bring in js/snake.js in addition to
//     // offline.min.js.
//     game: false
//   };
//
//   Offline.on('down', function() {
//     offlineActionTimeout = setTimeout(function() {
//       $.blockUI({ message: '<h5>Connection issue, please check your connection!</h5>' });
//     }, 40000);
//   });
//
//   Offline.on('up', function() {
//     clearTimeout(offlineActionTimeout);
//     $.unblockUI();
//   });
// });
