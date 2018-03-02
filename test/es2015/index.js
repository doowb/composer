'use strict';

/**
 * Additional tests than can only be run on newer versions of Node.js
 */

const assert = require('assert');
const Task = require('../../lib/task');

describe('es2015', function() {
  it('should run a task function that returns a promise when `.run` is called', function(done) {
    let count = 0;
    const callback = function() {
      return new Promise(function(resolve) {
        setImmediate(() => {
          count++;
          resolve();
        });
      });
    };

    const task = new Task({ name: 'default', callback: callback });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should run a task given a generator function when `.run` is called', function(done) {
    let count = 0;

    const callback = function*() {
      count++;
    };

    const task = new Task({ name: 'default', callback: callback });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });
});
