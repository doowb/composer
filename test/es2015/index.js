'use strict';

/**
 * Additional tests than can only be run on newer versions of Node.js
 */

var assert = require('assert');
var Task = require('../../lib/task');

describe('es2015', function() {
  it('should run a task given a generator function when `.run` is called', function(done) {
    var count = 0;
    var fn = function*() {
      count++;
    };

    var task = new Task({name: 'default', fn: fn});
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });
});
