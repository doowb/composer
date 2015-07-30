'use strict';

var Emitter = require('component-emitter');
var flatten = require('arr-flatten');
var isObject = require('isobject');
var bach = require('bach');

var Task = require('./lib/task');
var noop = require('./lib/noop');

function Composer (config) {
  Emitter.call(this);
  this.config = config || {}
  this.tasks = {};
}

require('util').inherits(Composer, Emitter);

var annonyomousCount = 0;

/*
 * Tasks
 */

Composer.prototype.register = function(name, options/*, dependencies and task */) {
  var deps = [].concat.apply([], [].slice.call(arguments, 1));
  var fn = noop;
  if (typeof deps[deps.length-1] === 'function') {
    fn = deps.pop();
  }

  if (deps.length && isObject(deps[0])) {
    // remove `options` from deps
    deps.shift();
  }

  options = options || {};

  deps = deps.concat(options.deps || []);

  deps = deps.map(function (dep) {
    if (typeof dep === 'function') {
      var depName = dep.name || dep.taskName || '[annonyomous (' + (++annonyomousCount) + ')]';
      this.register(depName, dep);
      return depName;
    }
    return dep;
  }.bind(this));

  var task = new Task({
    name: name,
    options: options,
    deps: deps,
    fn: fn
  });
  this.tasks[name] = task;
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

Composer.prototype.task = function(name) {
  var task = this.tasks[name];
  if (!task) return noop;
  var flow = bach[task.options.flow || 'series'];
  var deps = task.deps.map(this.task.bind(this));
  return flow.apply(bach, deps.concat([task.fn]));
};

Composer.prototype.run = function(/* list of tasks/functions to run */) {
  var args = [].concat.apply([], [].slice.call(arguments));
  var len = args.length, i = 0;
  var fns = new Array(len);
  while (len--) {
    var fn = args[i];
    if (typeof fn === 'string') {
      fn = this.task(fn);
    }
    fns[i++] = fn;
  }
  var last = fns.pop();

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
