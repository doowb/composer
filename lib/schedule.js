'use strict';

var Emitter = require('component-emitter');

function Schedule (runner, tasks) {
  Emitter.call(this);
  this.runner = runner;
  this.tasks = tasks;
  this.running = false;
  this.history = [];
}

require('util').inherits(Schedule, Emitter);

Schedule.prototype.start = function() {
  var self = this;
  if (this.running) {
    return this;
  }
  this.running = true;
  this.history.push(this.currentRun = {
    pending: this.tasks.length,
    finished: {},
    running: {},
    errors: []
  });

  var len = this.tasks.length, i = 0;
  while (len--) {
    self.startTask(this.tasks[i++]);
  }
  this.emit('starting', this);
};

Schedule.prototype.stop = function() {
  if (this.running === false) {
    return this;
  }
  this.running = false;
  this.emit('finished', this);
};

Schedule.prototype.startTask = function(task) {
  var self = this;
  if (!this.running)
    return this;
  if (task.running)
    return this;

  if (task.deps.length && this.tasksFinished(task.deps) === false) {
    this.runner
      .lookup(task.deps)
      .forEach(function (dep) {
        dep.on('finished', function () {
          self.startTask(task);
        });
      });
    return;
  }
  if (typeof this.currentRun.running[task.name] !== 'undefined') {
    return;
  }

  this.currentRun.running[task.name] = task;
  task.on('starting', this.taskStarting.bind(this));
  task.on('finished', this.taskFinished.bind(this));
  task.on('error', this.taskErrored.bind(this));
  process.nextTick(function () {
    task.run(self.runner);
  });
};

Schedule.prototype.taskStarting = function(task) {
  this.emit('task.starting', task);
};

Schedule.prototype.finishTask = function(task) {
  var self = this;
  delete this.currentRun.running[task.name];
  this.currentRun.finished[task.name] = task;
  this.currentRun.pending -= 1;
  if (this.currentRun.pending === 0) {
    return this.stop();
  }
  return this;
};

Schedule.prototype.taskFinished = function(task) {
  this.emit('task.finished', task);
  this.finishTask(task);
};

Schedule.prototype.taskErrored = function(err, task) {
  this.currentRun.errors.push({task: task, error: err});
  this.emit('task.error', err, task);
  this.finishTask(task);
};

Schedule.prototype.tasksFinished = function(tasks) {
  var finished = true;
  tasks.forEach(function (task) {
    if (typeof this.currentRun.finished[task] === 'undefined') {
      finished = false;
    }
  }.bind(this));
  return finished;
};

module.exports = Schedule;
