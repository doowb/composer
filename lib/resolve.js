'use strict';

var lookup = require('./lookup');

/**
 * Resolve the arguments by looking up tasks and their dependencies.
 * This creates an array of composed functions to be run together.
 *
 * ```js
 * // bind the composer to the resolve call
 * var tasks = resolve.call(this, args);
 * ```
 *
 * @param  {Array} `args` flattened array of strings and functions to resolve.
 * @return {Array} Return array of composed functions to run.
 */

module.exports = function (args) {
  var len = args.length, i = 0;
  var fns = new Array(len);
  while (len--) {
    var fn = args[i];
    if (typeof fn === 'string') {
      fn = lookup.call(this, fn);
    }
    fns[i++] = fn;
  }
  return fns;
}
