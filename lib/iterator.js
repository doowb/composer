'use strict';

const bach = require('bach');
const resolve = require('./resolve');
const utils = require('./utils');

module.exports = function(type) {
  return function(...args) {
    const tasks = utils.union(args);

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
        batch = bach[type](...fns);
      } catch (err) {
        callback(err);
        return;
      }

      return batch(callback);
    };
  };
};
