'use strict';
var Promise = require('bluebird');
var through = require('through2');
var green = require('ansi-green');
var yellow = require('ansi-yellow');
var red = require('ansi-red');

var composer = require('./');

composer.on('task.starting', function (task) {
  var start = new Date();
  console.log(green('starting [' + task.name + ']'), start.toTimeString());
});
composer.on('task.finished', function (task) {
  var end = new Date();
  console.log(yellow('finished [' + task.name + ']'), end.toTimeString());
});

composer.on('error', function (err, task) {
  console.log(red('[' + task.name + '] ERROR:'), err);
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

// runSchedule(1);

function runSchedule (max) {
  max = typeof max === 'undefined' ? 2 : max;
  var count = 0;
  var schedule = composer.schedule('default');
  schedule.on('task.error', function (err, task) {
    console.log('error', err, task.name);
    console.log();
  });
  schedule.on('task.starting', function (task) {
    console.log('task.starting', task.name);
  });
  schedule.on('task.finished', function (task) {
    console.log('task.finished', task.name);
    console.log();
  });
  schedule.on('finished', function () {
    console.log('finished', count++);
    console.log(schedule.history);
    console.log();
    if (count < max) {
      setTimeout(function () {
        schedule.start();
      }, 1000);
    }
  });

  if (count < max) {
    schedule.start();
  }
};
