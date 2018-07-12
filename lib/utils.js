define(exports, 'time', () => require('pretty-time'));

function define(obj, key, fn) {
  Reflect.defineProperty(obj, key, { get: fn });
}

/**
 * Get hr time in nanoseconds
 */

exports.nano = time => +time[0] * 1e9 + +time[1];

/**
 * Flatten the given array
 */

exports.flatten = arr => [].concat.apply([], arr);

/**
 * Return true if `val` is an object
 */

exports.isObject = val => val && typeof val === 'object' && !Array.isArray(val);

/**
 * Create an options object from the given arguments.
 * @param {object} `app`
 * @param {...[function|string|object]} `rest`
 * @return {object}
 */

exports.createOptions = (app, expand, ...rest) => {
  const args = exports.flatten(rest);
  const config = args.find(val => exports.isObject(val) && !val.isTask) || {};
  const options = Object.assign({}, app.options, config);
  const tasks = expand
    ? app.expandTasks(args.filter(val => val && val !== config))
    : args.filter(val => val && val !== config);
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
