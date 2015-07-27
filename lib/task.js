'use strict';

var Emitter = require('component-emitter');

function Task (task) {
  Emitter.call(this);
  this.name = task.name || 'annonyomous';
  this.options = task.options || {};
  this.deps = task.deps || this.options.deps || [];
  this.fn = task.fn || function () {};
}

require('util').inherits(Task, Emitter);

Task.prototype.run = function(runner) {
  this.running = false;
  var self = this;
  var done = function (err) {
    self.running = false;
    if (err) {
      return self.emit('error', err, self);
    }
    self.emit('finished', self);
  };

  var cb = function (err) {
    done(err);
  };

  Object.defineProperty(this, 'runner', {
    enumerable: false,
    configurable: true,
    value: runner
  });

  var result;
  try {
    this.emit('starting', this);
    this.running = true;
    result = this.fn.call(this, cb);
  } catch (err) {
    return done(err);
  }

  if (result && typeof result.then === 'function') {
    result.then(function () {
      done();
    }, done);
  } else if (result && typeof result.pipe === 'function') {
    result.on('data', function () {});
    result.on('error', done);
    result.on('end', done);
    result.resume();
  } else if (this.fn.length === 0) {
    done();
  }
};

module.exports = Task;
