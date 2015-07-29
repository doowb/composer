'use strict';

var uuid = require('node-uuid');
var flatten = require('arr-flatten');
var Emitter = require('component-emitter');
var Task = require('./lib/task');
var Scheduler = require('./lib/scheduler');

function Composer (config) {
  Emitter.call(this);
  this.config = config || {}
  this.tasks = {};
  this.scheduler = new Scheduler(this);
}

require('util').inherits(Composer, Emitter);

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

  var task = {};
  task.name = name;
  task.deps = deps;
  task.deps = task.deps.map(function (dep) {
    if (typeof dep === 'function') {
      var depName = dep.name || dep.taskName || uuid.v1();
      this.register(depName, dep);
      return depName;
    }
    return dep;
  }.bind(this));

  task.fn = fn;
  this.tasks[name] = new Task(task);
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

Composer.prototype.schedule = function(/* list of tasks/functions to schedule */) {
  return this.scheduler.schedule.apply(this.scheduler, arguments);
};

Composer.prototype.run = function(/* list of tasks/functions to run */) {
  var args = [].slice.call(arguments);
  var done = args.pop();
  var self = this;
  var schedule = this.schedule.apply(this, args);
  schedule.on('task.error', function (err, task) {
    self.emit('error', err, task);
  });
  schedule.on('task.starting', function (task) {
    self.emit('task.starting', task);
  });
  schedule.on('task.finished', function (task) {
    self.emit('task.finished', task);
  });
  schedule.on('finished', function () {
    self.emit('finished');
    done();
  });
  schedule.start();
};

module.exports = new Composer();
module.exports.Composer = Composer;
