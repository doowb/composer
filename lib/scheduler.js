'use strict';

var clone = require('clone-deep');
var uuid = require('node-uuid');
var Schedule = require('./schedule');
var Task = require('./task');

function Scheduler (runner) {
  this.runner = runner;
}

Scheduler.prototype.resolve = function(arg) {
  var self = this;
  var tasks = [];
  var name;
  if (typeof arg === 'string') {
    name = arg;
    arg = this.runner.tasks[name];
  }
  if (typeof arg === 'undefined') {
    throw new Error('Cannot schedule task "' + name + '". Make sure it was registered before calling `.run`.');
  }
  if (typeof arg === 'function') {
    if (!arg.name) {
      arg.taskName = arg.taskName || uuid.v1();
    }
    arg = new Task({
      name: arg.name || arg.taskName,
      fn: arg
    });
  }
  if (Array.isArray(arg)) {
    var deps = [];
    tasks = arg.reduce(function (acc, task) {
      task = self.resolve(task)
        .map(function (task) {
          task.deps = deps.reduce(function (acc, dep) {
            if (dep === task.name) return acc;
            if (acc.indexOf(dep) !== -1) return acc;
            acc.push(dep);
            return acc;
          }, task.deps);

          if (deps.indexOf(task.name) === -1) {
            deps.push(task.name);
          }
          return task;
        });
      acc = acc.concat(task);
      return acc;
    }, tasks);
    return tasks;
  }
  // return tasks.concat([clone(arg)]);
  return tasks.concat([arg]);
};

Scheduler.prototype.schedule = function(/* list of tasks/functions to run */) {
  var args = [].slice.call(arguments);
  var runner = this.runner;
  var self = this;

  // var tree = {};
  // var tasks = args.map(function (arg) {
  //   return self.resolve(arg);
  // });
  // console.log(tasks);

  var tasks = args
    .reduce(function (tasks, arg) {
      var resolved = [];

      function resolveDeps (task) {
        if (resolved.indexOf(task.name) !== -1) {
          return;
        }
        if (task.deps.length) {
          var deps = self.resolve(task.deps);
          deps.forEach(resolveDeps);
        }
        tasks.push(task);
        resolved.push(task.name);
      }

      self.resolve(arg)
          .forEach(resolveDeps);

      return tasks;
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
