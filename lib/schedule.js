'use strict';

var Emitter = require('component-emitter');

function Schedule (runner, tasks) {
  Emitter.call(this);
  this.running = false;
  this.define('_callbacks', this._callbacks || {});
  this.define('runner', runner);
  this.define('tasks', tasks);
  this.define('history', []);
}

require('util').inherits(Schedule, Emitter);

Schedule.prototype.start = function() {
  var self = this;
  if (this.running) {
    return this;
  }
  this.define('currentRun', {
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
  setImmediate(function () {
    self.emit('finished', self);
  });
};

Schedule.prototype.startTask = function(task) {
  var self = this;
  if (!this.running) return this;
  if (task.running) return this;
  if (this.isRunning(task.name) || this.isFinished(task.name)) {
    return;
  }

  if (this.isFinished(task.deps) === false) {
    this.on('task.finished', function (t) {
      if (task.deps.indexOf(t.name) !== -1) {
        self.startTask(task);
      }
    });
    return;
  }


  this.currentRun.running[task.name] = task;
  task.on('starting', this.taskStarting.bind(this));
  task.on('finished', this.taskFinished.bind(this));
  task.on('error', this.taskErrored.bind(this));

  setImmediate(function () {
    task.run(self.runner);
  });
};

Schedule.prototype.taskStarting = function(task) {
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
  this.finishTask(task);
  this.emit('task.finished', task);
};

Schedule.prototype.taskErrored = function(err, task) {
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
