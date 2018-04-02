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
    enumerable: false,
    configurable: true,
    writable: true,
    value: val
  });
};
