'use strict';

var flatten = require('arr-flatten');
var Emitter = require('component-emitter');
var Task = require('./lib/task');
var bach = require('bach');
// var Scheduler = require('./lib/scheduler');

function Composer (config) {
  Emitter.call(this);
  this.config = config || {}
  this.tasks = {};
  // this.scheduler = new Scheduler(this);
}

require('util').inherits(Composer, Emitter);

var annonyomousCount = 0;

/*
 * Tasks
 */

Composer.prototype.register = function(name/*, dependencies and task */) {
  var deps = [].concat.apply([], [].slice.call(arguments, 1));
  var fn = function () {};
  var len = deps.length;
  if (typeof deps[len-1] === 'function') {
    fn = deps.pop();
  }

  deps = deps.map(function (dep) {
    if (typeof dep === 'function') {
      var depName = dep.name || dep.taskName || '[annonyomous (' + (++annonyomousCount) + ')]';
      this.register(depName, dep);
      dep = depName;
    }
    return this.lookup([dep]);
  }.bind(this));

  var arr = deps.concat([fn]);
  if (arr.length === 1) {
    this.tasks[name] = arr.pop();
    return this;
  }

  this.tasks[name] = bach.series.apply(bach, arr);
  return this;
};

Composer.prototype.lookup = function(tasks) {
  var self = this;
  return Object.keys(this.tasks)
    .filter(function (key) {
      return tasks.indexOf(key) !== -1;
    })
    .map(function (key) {
      return self.tasks[key];
    });
};

// Composer.prototype.schedule = function(/* list of tasks/functions to schedule */) {
//   return this.scheduler.schedule.apply(this.scheduler, arguments);
// };

Composer.prototype.run = function(/* list of tasks/functions to run */) {
  var args = [].concat.apply([], [].slice.call(arguments));
  var len = args.length, i = 0;
  var fns = new Array(len);
  while (len--) {
    var fn = args[i];
    if (typeof fn === 'string') {
      fn = this.tasks[fn];
    }
    fns[i] = fn;
    i++;
  }
  var last = fns.pop();

  console.log(fns, last);
  if (fns.length === 1) {
    return fns[0](last);
  }
  var batch =  bach.series.apply(bach, fns);
  return batch(last);

  // var done = args.pop();
  // var self = this;
  // var schedule = this.schedule.apply(this, args);
  // schedule.on('task.error', function (err, task) {
  //   self.emit('error', err, task);
  // });
  // schedule.on('task.starting', function (task) {
  //   self.emit('task.starting', task);
  // });
  // schedule.on('task.finished', function (task) {
  //   self.emit('task.finished', task);
  // });
  // schedule.on('finished', function () {
  //   self.emit('finished');
  //   done();
  // });
  // schedule.start();
};

module.exports = new Composer();
module.exports.Composer = Composer;
