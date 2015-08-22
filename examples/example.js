'use strict';

// require('time-require');
var lazy = require('lazy-cache')(require);
lazy('bluebird');
lazy('through2');

var app = require('../');
require('composer-runtimes')(app);

app.task('foo-sync', function (done) {
  console.log('foo-sync');
  done(null, 'foo-sync');
});

app.task('foo-async', function (done) {
  logAfter('foo-async', 3500, done.bind(null, null));
});

app.task('foo-promise', function () {
  var Promise = lazy.bluebird;
  var promise = new Promise(function (resolve, reject) {
    logAfter('foo-promise', 1000, resolve);
  });
  return promise;
});

app.task('foo-stream', function () {
  var stream = lazy.through.obj();
  logAfter('foo-stream', 500, function (msg) {
    stream.write(msg);
    stream.end();
  });
  return stream;
});

app.task('beep', [
    function (done) { console.log(this.name); done(null, this.name); },
    'foo-async',
    function inline (done) { console.log(this.name); done(null, this.name); }
  ], function (done) {
    logAfter('beep', 2000, done.bind(null, null));
  });

app.task('baz-with-deps', {flow: 'series'}, ['foo-sync', 'foo-async', 'foo-promise', 'foo-stream'], function (done) {
  console.log('baz-with-deps\' dependencies finished');
  logAfter('baz-with-deps', 3000, done.bind(null, null));
});

app.task('default', 'beep', 'baz-with-deps');

app.run('default', function (err, results) {
  console.log('done');
  console.log(JSON.stringify(results, null, 2));
});

function logAfter(msg, ms, done) {
  setTimeout(function () {
    console.log(msg);
    done(msg);
  }, 0);
}
