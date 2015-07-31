'use strict';

// require('time-require');
var lazy = require('lazy-cache')(require);
var bluebird = lazy('bluebird');
var through = lazy('through2');
var green = lazy('ansi-green');
var yellow = lazy('ansi-yellow');
var red = lazy('ansi-red');

var composer = require('./');

// setup some listeners
composer.on('task.starting', function (task) {
  var start = new Date();
  console.log(green()('starting [' + task.name + ']'), start.toTimeString());
});
composer.on('task.finished', function (task) {
  var end = new Date();
  console.log(yellow()('finished [' + task.name + ']'), end.toTimeString());
});

composer.on('error', function (err, task) {
  console.log(red()('[' + task.name + '] ERROR:'), err);
});


// register some tasks
// var i = 0;
composer.register('foo-sync', function (done) {
  console.log('foo-sync');
  done(null, 'foo-sync');
});

composer.register('foo-async', function (done) {
  logAfter('foo-async', 3500, done.bind(null, null));
});

composer.register('foo-promise', function () {
  var Promise = bluebird();
  var promise = new Promise(function (resolve, reject) {
    logAfter('foo-promise', 1000, resolve);
  });
  return promise;
});

composer.register('foo-stream', function () {
  var stream = through().obj();
  logAfter('foo-stream', 500, function (msg) {
    stream.write(msg);
    stream.end();
  });
  return stream;
});

composer.register('beep', [
    function (done) { console.log(this.name); done(null, this.name); },
    'foo-async',
    function inline (done) { console.log(this.name); done(null, this.name); }
  ], function (done) {
    logAfter('beep', 2000, done.bind(null, null));
  });

composer.register('baz-with-deps', {flow: 'series'}, ['foo-sync', 'foo-async', 'foo-promise', 'foo-stream'], function (done) {
  console.log('baz-with-deps\' dependencies finished');
  logAfter('baz-with-deps', 3000, done.bind(null, null));
});

// composer.register('website', ['styles', 'scripts', 'templates'], function (done) {
//   // async.series([
//   //   composer.register('foo', [''])
//   //   composer.run('styles');
//   //   composer.run('scripts');
//   //   composer.run('templates')
//   // ]);
// });


// composers.register('foo', ['a', 'b', 'c'], function () {

// })

// composers.register('bar', ['a', 'b', 'c'], function () {

// })

// composer.register('watcher', function () {
//   composer.watch(['**/*.js'], ['foo']);
// });

// composer.run('watcher');

// composer.register('baz', ['foo', 'bar']);

// var queue = [];

// {
//   'foo': ['a', 'b', 'c'],
//   'bar': ['a', 'b', 'c'],
//   'baz': ['foo', 'bar']
// }


// composer.register('blog', {site: 'This is my blog'}, require('website-boilerplate')());


// composer.register('default', {flow: 'parallel'}, 'beep', 'baz-with-deps');
composer.register('default', 'beep', 'baz-with-deps');

// composer.run('beep', function () {
//   console.log('done');
// });

// console.log(composer.tasks);

// composer.run(['foo-sync', 'foo-async'], function () {
//   console.log('done');
//   // process.exit();
// });

composer.run('default', function (err, results) {
  console.log('done');
  console.log(JSON.stringify(results, null, 2));
  // process.exit();
});

// composer.register('js', function (done) {
//   console.log('javascript files changed');
//   done();
// });

// composer.register('md', function (done) {
//   console.log('markdown files changed');
//   process.exit();
//   done();
// });

// composer.watch('*.js', 'js');
// composer.watch('*.md', 'md');
// process.exit();
// runSchedule(2);

function runSchedule (max) {
  max = typeof max === 'undefined' ? 2 : max;
  var count = 0;
  var schedule = composer.schedule('default');
  // schedule.on('task.error', function (err, task) {
  //   console.log('error', err, task.name);
  //   console.log();
  // });
  // schedule.on('task.starting', function (task) {
  //   console.log('task.starting', task.name);
  // });
  // schedule.on('task.finished', function (task) {
  //   console.log('task.finished', task.name);
  //   console.log();
  // });
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

function logAfter(msg, ms, done) {
  setTimeout(function () {
    console.log(msg);
    done(msg);
  }, 0);
}
