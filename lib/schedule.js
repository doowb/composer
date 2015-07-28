'use strict';

var Emitter = require('component-emitter');

function Schedule (runner, tasks) {
  Emitter.call(this);
  this.running = false;
  this.define('_callbacks', this._callbacks || {});
  this.define('runner', runner);
  this.define('tasks', tasks);
  this.define('history', []);
  this.define('_handlers', {});
}

require('util').inherits(Schedule, Emitter);

Schedule.prototype.start = function() {
  var self = this;
  if (this.running) {
    return this;
  }
  this.define('currentRun', {
    start: new Date(),
    pending: this.tasks.length,
    finished: {},
    running: {},
    errors: []
  });
  this.history.push(this.currentRun);
  this.running = true;
  this.emit('starting', this);
  var len = this.tasks.length, i = 0;
  while (len--) {
    self.startTask(this.tasks[i++]);
  }
};

Schedule.prototype.stop = function() {
  var self = this;
  if (this.running === false) {
    return this;
  }
  this.running = false;
  this.currentRun.finish = new Date();
  this.cleanHandlers();
  setImmediate(function () {
    self.emit('finished', self);
  });
};

Schedule.prototype.cleanHandlers = function() {
  Object.keys(this._handlers).forEach(function (key) {
    var handler = this._handlers[key];
    if (typeof handler === 'function') {
      if (key.indexOf(':') !== -1) {
        var parts = key.split(':');
        this.runner.tasks[parts[1]].off(parts[0], handler);
      } else {
        this.off(key, handler);
      }
    } else {
      handler.forEach(function (h) {
        this.off(key, h);
      }.bind(this));
    }
  }.bind(this));
};

Schedule.prototype.startTask = function(task) {
  var self = this;
  if (!this.running) return this;
  if (task.running) return this;
  if (this.isRunning(task.name) || this.isFinished(task.name)) {
    return;
  }

  if (this.isFinished(task.deps) === false) {
    var waitHandler = function (t) {
      if (task.deps.indexOf(t.name) !== -1 && self.isFinished(task.deps)) {
        self.off('task.finished', waitHandler);
        self.startTask(task);
      }
    };
    this.on('task.finished', waitHandler);
    this._handlers['task.finished'] = this._handlers['task.finished'] || [];
    this._handlers['task.finished'].push(waitHandler);
    return;
  }


  this.currentRun.running[task.name] = task;
  this.addHandler('starting', task, this.taskStarting.bind(this));
  this.addHandler('finished', task, this.taskFinished.bind(this));
  this.addHandler('error', task, this.taskErrored.bind(this));

  setImmediate(function () {
    task.run(self.runner);
  });
};

Schedule.prototype.addHandler = function(name, task, fn) {
  var key = name + ':' + task.name;
  task.on(name, fn);
  this._handlers[key] = fn;
};

Schedule.prototype.removeHandler = function(name, task) {
  var key = name + ':' + task.name;
  if (this._handlers.hasOwnProperty(key)) {
    task.off(name, this._handlers[key]);
  }
};

Schedule.prototype.taskStarting = function(task) {
  this.removeHandler('starting', task);
  this.emit('task.starting', task);
};

Schedule.prototype.finishTask = function(task) {
  var self = this;
  this.currentRun.finished[task.name] = task;
  delete this.currentRun.running[task.name];
  this.currentRun.pending -= 1;
  if (this.currentRun.pending === 0) {
    setImmediate(function () {
      self.stop();
    });
    return;
  }
};

Schedule.prototype.taskFinished = function(task) {
  this.removeHandler('finished', task);
  this.finishTask(task);
  this.emit('task.finished', task);
};

Schedule.prototype.taskErrored = function(err, task) {
  this.removeHandler('error', task);
  this.currentRun.errors.push({task: task, error: err});
  this.finishTask(task);
  this.emit('task.error', err, task);
};

Schedule.prototype.isRunning = function(tasks) {
  tasks = tasks || [];
  tasks = Array.isArray(tasks) ? tasks : [tasks];
  var running = false;
  tasks.forEach(function (task) {
    if (typeof this.currentRun.running[task] !== 'undefined') {
      running = true;
    }
  }.bind(this));
  return running;
};

Schedule.prototype.isFinished = function(tasks) {
  tasks = tasks || [];
  tasks = Array.isArray(tasks) ? tasks : [tasks];
  var finished = true;
  tasks.forEach(function (task) {
    if (typeof this.currentRun.finished[task] === 'undefined') {
      finished = false;
    }
  }.bind(this));
  return finished;
};

Schedule.prototype.define = function(prop, value) {
  Object.defineProperty(this, prop, {
    enumerable: false,
    configurable: true,
    value: value
  });
  return this;
};

module.exports = Schedule;
