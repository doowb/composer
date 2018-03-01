'use strict';

/**
 * Module dependencies
 */

const typeOf = require('kind-of');
const flatten = require('arr-flatten');
const unique = require('array-unique');

exports.union = (a, b) => unique(flatten([a || []].concat(b || [])));

/**
 * Format a task error message to include the task name at the beginning.
 *
 * ```js
 * err = exports.formatError(err);
 * //=> 'Error: in task "foo": ...'
 * ```
 *
 * @param  {Error} `err` Error object with a `.task` property
 * @return {Error} Error object with formatted error message.
 */

exports.formatError = function(err) {
  if (typeOf(err) === 'error' && err.task) {
    err.message = 'in task "' + err.task.name + '": ' + err.message;
  }
  return err;
};

/**
 * Customizable inspect function for displaying the instance and tasks during debugging.
 * @param  {Object} `app`
 * @param  {Object} `task`
 * @return {undefined}
 */

exports.inspectFn = function(app, task) {
  if (app.options && app.options.inspectFn === false) {
    return;
  }

  if (app.options && typeof app.options.inspectFn === 'function') {
    task.inspect = () => app.options.inspectFn.call(app, task);
    return;
  }

  task.inspect = function() {
    var list = '[' + task.options.deps.join(', ') + ']';
    return '<Task "' + task.name + '" deps: ' + list + '>';
  };
};

/**
 * Get the last value from an array.
 * @param  {Array} `arr`
 * @return {any}
 */

exports.last = function(arr) {
  return Array.isArray(arr) ? arr[arr.length - 1] : undefined;
};

/**
 * Arrayify the value to ensure a valid array is returned.
 *
 * ```js
 * var arr = exports.arrayify('foo');
 * //=> ['foo']
 * ```
 * @param  {Mixed} `val` value to arrayify
 * @return {Array} Always an array.
 */

exports.arrayify = function(val) {
  return val ? Array.isArray(val) ? val : [val] : [];
};

/**
 * Returns true if `val` is an object.
 * @param {any} `val`
 * @return {Boolean}
 */

exports.isObject = function(val) {
  return typeOf(val) === 'object';
};

/**
 * Returns true if `val` is a generator function.
 * @param {any} `val`
 * @return {Boolean}
 */

exports.isGenerator = function(val) {
  return typeOf(val) === 'generatorfunction';
};
