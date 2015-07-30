'use strict';

var noop = require('./noop');

function Task (task) {
  this.name = task.name;
  this.options = task.options || {};
  this.deps = task.deps || this.options.deps || [];
  this.fn = (task.fn || noop).bind(this);
}

module.exports = Task;
