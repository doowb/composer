'use strict';
var Promise = require('bluebird');
var through = require('through2');
var composer = require('./');

// composer.on('task.starting', function (task) {
//   console.log('starting', task.name);
// });
// composer.on('task.finished', function (task) {
//   console.log('finished', task.name);
// });

composer.on('error', function (err, task) {
  console.log('error', task.name, err);
});
var i = 0;

composer.register('foo-sync', function () {
  console.log('foo-sync');
});

composer.register('foo-async', function (done) {
  setTimeout(function () {
    console.log('foo-async');
    done();
  }, 3500);
});

composer.register('foo-promise', function () {
  var promise = new Promise(function (resolve, reject) {
    setTimeout(function () {
      console.log('foo-promise');
      resolve();
    }, 1000);
  });
  return promise;
});

composer.register('foo-stream', function () {
  var stream = through.obj();
  setTimeout(function () {
    console.log('foo-stream');
    stream.end();
  }, 500);
  return stream;
});

composer.compose('beep', ['foo-async'], function (done) {
  setTimeout(function () {
    console.log('beep');
    done();
  }, 2000);
});

composer.register('baz-with-deps', ['foo-sync', 'foo-async', 'foo-promise', 'foo-stream'], function (done) {
  console.log('baz-with-deps dependencies finished');
  var self = this;
  setTimeout(function () {
    console.log('baz-with-deps');
    // console.log(self);
    done();
  }, 3000);
});


composer.compose('default', 'beep', 'baz-with-deps');

composer.run(['default'], function () {
  console.log('done');
  // process.exit();
});
