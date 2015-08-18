'use strict';
var lazy = require('lazy-cache')(require);
lazy('bach');

/**
 * Lookup a task and it's dependencies and compose
 * the final task function.
 *
 * ```js
 * // bind the composer to the lookup call
 * var fn = lookup.call(this, 'default');
 * ```
 *
 * @param  {String} `name` Name of the task to lookup
 * @return {Function} Composed function comprising the task and it's dependenices
 */

module.exports = function lookup (name) {
  var task = this.tasks[name];
  if (!task) {
    throw new Error('Invalid task `' + name + '`. Register `' + name + '` before calling run.');
  }
  var flow = lazy.bach[task.options.flow || 'series'];
  var deps = task.deps.map(lookup.bind(this));
  return flow.apply(lazy.bach, deps.concat([task.run.bind(task)]));
};
