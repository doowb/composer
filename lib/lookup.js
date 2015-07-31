'use strict';
var lazy = require('lazy-cache')(require);
var bach = lazy('bach');

module.exports = function lookup (name) {
  var task = this.tasks[name];
  if (!task) return noop;
  var flow = bach()[task.options.flow || 'series'];
  var deps = task.deps.map(lookup.bind(this));
  return flow.apply(bach(), deps.concat([task.fn]));
};
