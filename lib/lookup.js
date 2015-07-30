'use strict';

var bach = require('bach');

module.exports = function lookup (name) {
  var task = this.tasks[name];
  if (!task) return noop;
  var flow = bach[task.options.flow || 'series'];
  var deps = task.deps.map(lookup.bind(this));
  return flow.apply(bach, deps.concat([task.fn]));
};
