'use strict';

var Emitter = require('component-emitter');
var session = require('./session');
var noop = require('./noop');

/**
 * Task constructor function. Create new tasks.
 *
 * ```
 * var task = new Task({
 *   name: 'site',
 *   deps: ['styles'],
 *   fn: buildSite // defined someplace else
 * });
 * ```
 *
 * @param {Object} `task` Task object used to configure properties on the new Task
 */

function Task (task) {
  Emitter.call(this);
  if (typeof task === 'undefined') {
    throw new Error('Expected `task` to be an `object` but got `' + typeof task + '`.');
  }
  if (typeof task.name === 'undefined') {
    throw new Error('Expected `task.name` to be a `string` but got `' + typeof task.name + '`.');
  }
  this.name = task.name;
  this.session = task.session || session(this.name);
  this.options = task.options || {};
  this.deps = task.deps || this.options.deps || [];
  this.fn = task.fn || noop;
  this._runs = [];
}

require('util').inherits(Task, Emitter);

/**
 * Setup run meta data to store start and end times and
 * emit starting, finished, and error events.
 *
 * @param  {Function} `cb` Callback function called when task is finished.
 * @return {Function} Function to be used as a `done` function when running a task.
 */

Task.prototype.setupRun = function(cb) {
  var self = this;
  var run = {};
  this._runs.push(run);
  run.runId = this._runs.length - 1;
  run.start = new Date();
  this.emit('starting', this, run);
  return function finishRun (err) {
    run.end = new Date();
    if (err) {
      self.emit('error', err, self, run);
    } else {
      self.emit('finished', self, run);
    }
    return cb.apply(null, arguments);
  };
};

/**
 * Run a task, capture it's start and end times
 * and emitting 3 possible events:
 *
 *  - starting: just before the task starts with `task` and `run` objects passed
 *  - finished: just after the task finishes with `task` and `run` objects passed
 *  - error: when an error occurs with `err`, `task`, and `run` objects passed.
 *
 * @param  {Function} `cb` Callback function to be called when task finishes running.
 * @return {*} undefined, `Promise` or `Stream` to be used to determine when task finishes running.
 */

Task.prototype.run = function(cb) {
  var self = this;
  var done = this.setupRun(cb);
  var results;
  this.session.run(function () {
    self.session.set('task', self);
    try {
      results = self.fn.call(self, done);
    } catch (err) {
      return done(err);
    }

    // needed to capture when the actual task is finished running
    if (typeof results !== 'undefined') {
      if (typeof results.on === 'function') {
        results.on('error', done);
        results.on('end', done);
        results.resume();
        return;
      }
      if (typeof results.then === 'function') {
        results.then(function (result) {
          return done(null, result);
        }, done);
        return;
      }
    }
  });
};

/**
 * Export Task
 * @type {Task}
 */

module.exports = Task;
