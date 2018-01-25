'use strict';

var assert = require('assert');
var utils = require('../lib/utils');

describe('utils', function() {
  describe('arrayify', function() {
    it('should return an empty array when falsey', function() {
      assert.deepEqual(utils.arrayify(false), []);
    });

    it('should return an array when given a non array', function() {
      assert.deepEqual(utils.arrayify('foo'), ['foo']);
    });

    it('should return an array when given an array', function() {
      assert.deepEqual(utils.arrayify(['foo']), ['foo']);
    });
  });

  describe('formatError', function() {
    it('should return the error when task is undefined', function() {
      var error = new Error('some error');
      assert.equal(utils.formatError(error), error);
    });

    it('should format the error message when a task property is on the error', function() {
      var error = new Error('some error');
      error.task = {name: 'foo'};
      assert.equal(utils.formatError(error).message, 'in task "foo": some error');
    });
  });
});
