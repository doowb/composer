define(exports, 'typeOf', () => require('kind-of'));
define(exports, 'nano', () => require('nanoseconds'));
define(exports, 'time', () => require('pretty-time'));

function define(obj, key, fn) {
  Reflect.defineProperty(obj, key, { get: fn });
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
 * Create a non-enumerable property on `obj`
 */

exports.define = function(obj, key, val) {
  Reflect.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: val
  });
};
