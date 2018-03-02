'use strict';

require('mocha');
const assert = require('assert');
const Composer = require('../');
let composer;

describe('parallel', function() {
  beforeEach(function() {
    composer = new Composer();
  });

  it('should compose tasks into a function that runs in parallel', function(done) {
    const expected = [];

    composer.task('foo', function(cb) {
      setTimeout(function() {
        expected.push('this is foo');
        cb();
      }, 10);
    });

    const build = composer.parallel('foo', function bar(cb) {
      expected.push('this is bar');
      cb();
    });

    build(function(err) {
      if (err) return done(err);
      assert.deepEqual(expected, ['this is bar', 'this is foo']);
      done();
    });
  });

  it('should return an error when no functions are passed to parallel', function(done) {
    const build = composer.parallel();

    build(function(err) {
      assert(err);
      assert.equal(err.message, 'A set of functions to combine is required');
      done();
    });
  });

  it('should compose tasks with options into a function that runs in parallel', function(done) {
    const expected = [];

    composer.task('foo', {silent: false}, function(cb) {
      assert.equal(this.options.silent, false);
      setTimeout(function() {
        expected.push('this is foo');
        cb();
      });
    });

    const build = composer.parallel('foo', function bar(cb) {
      expected.push('this is bar');
      cb();
    });

    build(function(err) {
      if (err) return done(err);
      assert.deepEqual(expected, ['this is bar', 'this is foo']);
      done();
    });
  });

  it('should compose tasks with additional options into a function that runs in parallel', function(done) {
    const expected = [];
    composer.task('foo', {silent: false}, function(cb) {
      assert.equal(this.options.silent, true);
      assert.equal(this.options.foo, 'bar');
      setTimeout(function() {
        expected.push('this is foo');
        cb();
      });
    });

    const options = { silent: true, foo: 'bar' };
    function bar(cb) {
      expected.push('this is bar');
      cb();
    }

    const build = composer.parallel('foo', bar, options);

    build(function(err) {
      if (err) {
        done(err);
        return;
      }
      assert.deepEqual(expected, ['this is bar', 'this is foo']);
      done();
    });
  });

  it('should not throw an error when `fn` is called without a callback function.', function(done) {
    const expected = [];

    composer.task('foo', function(cb) {
      setTimeout(function() {
        expected.push('this is foo');
        cb();
      }, 10);
    });

    const build = composer.parallel('foo', function bar(cb) {
      expected.push('this is bar');
      cb();
    });

    build();

    setTimeout(function() {
      assert.deepEqual(expected, ['this is bar', 'this is foo']);
      done();
    }, 20);
  });

  it('should emit an error when a task returns an error and when `fn` is called without a callback function.', function(done) {
    const expected = [];
    let finished = false;

    composer.on('error', function(err) {
      finished = true;
      assert.deepEqual(expected, []);
      assert.equal(err.message, 'bar error');
      done();
    });

    composer.task('foo', function(cb) {
      setTimeout(function() {
        expected.push('this is foo');
        cb();
      }, 10);
    });

    const build = composer.parallel('foo', function bar(cb) {
      cb(new Error('bar error'));
    });

    build();

    setTimeout(() => assert(finished), 20);
  });
});
