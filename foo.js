'use strict';

var bach = require('bach');
function sync () {
  console.log('sync function');
}

function async (done) {
  console.log('async function');
  // setTimeout(function () {
    done(null, 'async done');
  // }, 500);
}

var fn = bach.series(sync, async);
fn(function (err, msg) {
  console.log(msg);
});
