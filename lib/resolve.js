'use strict';

var utils = require('./utils');

/**
 * Resolve the arguments by looking up tasks and their dependencies.
 * This creates an array of composed functions to be run together.
 *
 * ```js
 * // bind the composer to the resolve call
 * var tasks = resolve.call(this, arr);
 * ```
 *
 * @param  {Array} `arr` flattened array of strings and functions to resolve.
 * @return {Array} Return array of composed functions to run.
 */

module.exports = function(arr) {
  var len = arr.length, i = 0;
  var fns = [];
  while (len--) {
    var str = arr[i++];
    if (utils.isGlob(str)) {
      var obj = utils.mm.matchKeys(this.tasks, str);
      var keys = Object.keys(obj);
      if (!keys.length) {
        throw new Error('glob pattern "' + str + '" did not match any tasks');
      }
      for (var j = 0; j < keys.length; j++) {
        var task = this.tasks[keys[j]];
        fns.push(task.run.bind(task));
      }
      continue;
    }
    if (typeof str === 'string') {
      var task = this.tasks[str];
      if (!task) {
        throw new Error('task "' + str + '" is not registered');
      }
      str = task.run.bind(task);
    }
    fns.push(str);
  }
  return fns;
};
