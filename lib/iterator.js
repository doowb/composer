'use strict';

const bach = require('bach');
const flatten = require('arr-flatten');
const resolve = require('./resolve');

module.exports = function(type) {
  const iterator = bach[type].bind(bach);

  return function(...args) {
    const tasks = flatten(args);

    return callback => {
      let batch;
      let fns;

      if (typeof callback !== 'function') {
        callback = err => {
          if (err) {
            this.emit('error', err);
          }
        };
      }

      try {
        fns = resolve.call(this, tasks);
      } catch (err) {
        callback(err);
        return;
      }

      if (fns.length === 1) {
        return fns[0](callback);
      }

      try {
        batch = iterator(...fns);
      } catch (err) {
        callback(err);
        return;
      }

      return batch(callback);
    };
  };
};
