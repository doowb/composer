'use strict';

function Composer (config) {
  this.config = config || {}
  this.tasks = {};
}

/*
 * Tasks
 */

Composer.prototype.register = function(name, fn) {
  if (typeof name !== 'string') {
    throw new Error('Expected a string for `name` but got ' + typeof name);
  }
  if (typeof fn !== 'function') {
    throw new Error('Expected a function for `fn` but got ' + typeof fn);
  }
  this.tasks[name] = fn;
  return this;
};

Composer.prototype.compose = function(name/* list of tasks/functions */) {
  var args = [].slice.call(arguments, 1);
  return this.register(name, function () {
    return this.run.apply(this, args);
  });
};

Composer.prototype.run = function(/* list of tasks/functions to run */) {
  var args = [].slice.call(arguments);
  var len = args.length, i = 0;
  var results;
  while (len--) {
    var name;
    var task = args[i++];
    if (typeof task === 'string') {
      name = task;
      task = this.tasks[task];
    }
    if (typeof task === 'undefined') {
      throw new Error('Cannot run task "' + name + '". Make sure it was registered before calling `.run`.');
    }
    if (typeof task === 'function') {
      results = task.call(this, results);
    }
    if (Array.isArray(task)) {
      results = this.run.apply(this, task);
    }
  }
  return results;
};

module.exports = new Composer();
module.exports.Composer = Composer;
