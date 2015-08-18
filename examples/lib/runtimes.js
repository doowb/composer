'use strict';
var lazy = require('lazy-cache')(require);
var yellow = lazy('ansi-yellow');
var green = lazy('ansi-green');
var cyan = lazy('ansi-cyan');
var red = lazy('ansi-red');

module.exports = function (composer) {
  // setup some listeners
  composer.on('task.starting', function (info) {
    var task = info.task;
    var start = new Date();
    console.log(green()('starting'), cyan()('[' + task.name + ']'), start.toTimeString());
  });
  composer.on('task.finished', function (info) {
    var task = info.task;
    var end = new Date();
    console.log(yellow()('finished'), cyan()('[' + task.name + ']'), end.toTimeString());
  });

  composer.on('error', function (err, info) {
    var task = info.task;
    console.log(red()('ERROR'), cyan()('[' + task.name + ']'), err);
  });
};
