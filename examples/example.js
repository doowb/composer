'use strict';

// require('time-require');
var lazy = require('lazy-cache')(require);
var bluebird = lazy('bluebird');
var through = lazy('through2');

var composer = require('../');
require('./lib/runtimes')(composer);

composer.task('foo-sync', function (done) {
  console.log('foo-sync');
  done(null, 'foo-sync');
});

composer.task('foo-async', function (done) {
  logAfter('foo-async', 3500, done.bind(null, null));
});

composer.task('foo-promise', function () {
  var Promise = bluebird();
  var promise = new Promise(function (resolve, reject) {
    logAfter('foo-promise', 1000, resolve);
  });
  return promise;
});

composer.task('foo-stream', function () {
  var stream = through().obj();
  logAfter('foo-stream', 500, function (msg) {
    stream.write(msg);
    stream.end();
  });
  return stream;
});

composer.task('beep', [
    function (done) { console.log(this.name); done(null, this.name); },
    'foo-async',
    function inline (done) { console.log(this.name); done(null, this.name); }
  ], function (done) {
    logAfter('beep', 2000, done.bind(null, null));
  });

composer.task('baz-with-deps', {flow: 'series'}, ['foo-sync', 'foo-async', 'foo-promise', 'foo-stream'], function (done) {
  console.log('baz-with-deps\' dependencies finished');
  logAfter('baz-with-deps', 3000, done.bind(null, null));
});

composer.task('default', 'beep', 'baz-with-deps');

composer.run('default', function (err, results) {
  console.log('done');
  console.log(JSON.stringify(results, null, 2));
});

function logAfter(msg, ms, done) {
  setTimeout(function () {
    console.log(msg);
    done(msg);
  }, 0);
}
