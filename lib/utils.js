const util = require('util');

define(exports, 'typeOf', () => require('kind-of'));
define(exports, 'nano', () => require('nanoseconds'));
define(exports, 'time', () => require('pretty-time'));

function define(obj, key, fn) {
  Reflect.defineProperty(obj, key, { enumerable: false, get: fn });
}

/**
 * Flatten the given array
 */

exports.flatten = arr => [].concat.apply([], arr);

/**
 * Get the last value from the given array
 */

exports.last = arr => arr[arr.length - 1];

/**
 * Return true if `val` is an object
 */

exports.isObject = val => exports.typeOf(val) === 'object';

/**
 * Create an options object from the given arguments.
 * @param {object} `app`
 * @param {...[function|string|object]} `rest`
 * @return {object}
 */

exports.createOptions = (app, ...rest) => {
  const args = exports.flatten(rest);
  const config = args.find(val => exports.isObject(val) && !val.isTask) || {};
  const tasks = app.expandTasks(args.filter(val => val && val !== config));
  const options = Object.assign({}, app.options, config);
  return { tasks, options };
};

/**
 * Create a non-enumerable property on `obj`
 */

exports.define = (obj, key, val) => {
  Reflect.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: val
  });
};
