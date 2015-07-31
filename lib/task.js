'use strict';

var Emitter = require('component-emitter');
var noop = require('./noop');

function Task (task) {
  Emitter.call(this);
  this.name = task.name;
  this.options = task.options || {};
  this.deps = task.deps || this.options.deps || [];
  this.fn = task.fn || noop;
  this._runs = [];
}

require('util').inherits(Task, Emitter);

Task.prototype.setupRun = function(cb) {
  var self = this;
  var run = {};
  this._runs.push(run);
  run.runId = this._runs.length - 1;
  run.start = new Date();
  this.emit('starting', this, run);
  // console.log('STARTING', this.name, run.runId);
  return function finishRun (err) {
    run.end = new Date();
    if (err) {
      self.emit('error', err, self, run);
    } else {
      self.emit('finished', self, run);
    }
    // console.log('FINISHED', self.name, run.runId);
    return cb.apply(null, arguments);
  };
};

Task.prototype.run = function(cb) {
  var self = this;
  var done = this.setupRun(cb);
  var results = this.fn.call(this, done);

  // needed to capture when the actual task is finished running
  if (typeof results !== 'undefined') {
    if (typeof results.on === 'function') {
      results.on('error', done);
      results.on('end', done);
      results.resume();
      return;
    }
    if (typeof results.subscribe === 'function') {
      results.subscribe(noop, done, function (result) {
        return done(null, result);
      });
      return;
    }
    if (typeof results.then === 'function') {
      results.then(function (result) {
        return done(null, result);
      }, done);
      return;
    }
  }
};

module.exports = Task;
