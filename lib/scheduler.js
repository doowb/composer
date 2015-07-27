'use strict';

var Schedule = require('./schedule');
var Task = require('./task');

function Scheduler (runner) {
  this.runner = runner;
}

Scheduler.prototype.resolve = function(task) {
  var self = this;
  var tasks = [];
  var name;
  if (typeof task === 'string') {
    name = task;
    task = this.runner.tasks[name];
  }
  if (typeof task === 'undefined') {
    throw new Error('Cannot schedule task "' + name + '". Make sure it was registered before calling `.run`.');
  }
  if (typeof task === 'function') {
    task = new Task({name: task.name || task.displayName, fn: task});
  }
  if (Array.isArray(task)) {
    tasks = task.reduce(function (acc, t) {
      acc = acc.concat(self.resolve(t));
      return acc;
    }, tasks);
    return tasks;
  }

  // this is starting to be more complicated with .compose
  if (typeof task === 'object' && !(task instanceof Task)) {
    tasks = task.args.reduce(function (acc, t) {
      if (typeof t === 'function' && typeof t.displayName === 'undefined') {
        t.displayName = task.name;
      }
      acc = acc.concat(self.resolve(t));
      return acc;
    }, tasks);
    return tasks;
  }

  return tasks.concat([task]);
};

Scheduler.prototype.schedule = function(/* list of tasks/functions to run */) {
  var args = [].slice.call(arguments);
  var runner = this.runner;
  var self = this;
  var tasks = args
    .reduce(function (order, arg) {
      self.resolve(arg)
        .forEach(function (task) {
          if (task.deps.length) {
            var deps = runner.lookup(task.deps);
            order = order.concat(deps);
          }
          order.push(task);
        });
      return order;
    }, [])
    .reduce(function (tasks, task) {
      if (tasks.indexOf(task) === -1) {
        tasks.push(task);
      }
      return tasks;
    }, []);
  return new Schedule(runner, tasks);
};

module.exports = Scheduler;
