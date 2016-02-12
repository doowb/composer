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
    if (isGlob(str)) {
      var obj = utils.mm.matchKeys(this.tasks, str);
      var keys = Object.keys(obj);
      if (!keys.length) {
        throw new Error('glob pattern "' + str + '" did not match any tasks');
      }
      for (var j = 0; j < keys.length; j++) {
        fns.push(getTaskFn(this.tasks, keys[j]));
      }
      continue;
    }
    if (typeof str === 'string') {
      str = getTaskFn(this.tasks, str);
    }
    fns.push(str);
  }
  return fns;
};

var re = /\[anonymous \(\d*\)\]/;
function isGlob(str) {
  return utils.isGlob(str) && (!re.test(str));
}

function getTaskFn(tasks, key) {
  var task = tasks[key];
  if (!task) {
    throw new Error('task "' + key + '" is not registered');
  }
  return task.run.bind(task);
}
