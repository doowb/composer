'use strict';

require('mocha');
const assert = require('assert');
const Composer = require('../');
let composer;

describe('series', function() {
  beforeEach(function() {
    composer = new Composer();
  });

  it('should compose tasks into a function that runs in series', function(done) {
    const expected = [];

    composer.task('foo', function(cb) {
      expected.push('this is foo');
      cb();
    });

    const build = composer.series('foo', function bar(cb) {
      expected.push('this is bar');
      cb();
    });

    build(function(err) {
      if (err) return done(err);
      assert.deepEqual(expected, ['this is foo', 'this is bar']);
      done();
    });
  });

  it('should compose tasks with options into a function that runs in series', function(done) {
    const expected = [];

    composer.task('foo', { silent: false }, function(cb) {
      assert.equal(this.options.silent, false);
      expected.push('this is foo');
      cb();
    });

    const build = composer.series('foo', function bar(cb) {
      expected.push('this is bar');
      cb();
    });

    build(function(err) {
      if (err) return done(err);
      assert.deepEqual(expected, ['this is foo', 'this is bar']);
      done();
    });
  });

  it('should return an error when no functions are passed to series', function(done) {
    const build = composer.series();

    build(function(err) {
      assert(err);
      assert.equal(err.message, 'A set of functions to combine is required');
      done();
    });
  });

  it('should compose tasks with additional options into a function that runs in series', function(done) {
    const expected = [];

    composer.task('foo', { silent: false }, function(cb) {
      assert.equal(this.options.silent, true);
      assert.equal(this.options.foo, 'bar');
      expected.push('this is foo');
      cb();
    });

    const options = { silent: true, foo: 'bar' };
    const build = composer.series('foo', function bar(cb) {
      expected.push('this is bar');
      cb();
    }, options);

    build(function(err) {
      if (err) {
        done(err);
        return;
      }
      assert.deepEqual(expected, ['this is foo', 'this is bar']);
      done();
    });
  });

  it('should not throw an error when `build` is called without a callback function.', function(done) {
    const expected = [];

    composer.task('foo', function(cb) {
      expected.push('this is foo');
      cb();
    });

    const build = composer.series('foo', function bar(cb) {
      expected.push('this is bar');
      cb();
    });

    build();

    setTimeout(function() {
      assert.deepEqual(expected, ['this is foo', 'this is bar']);
      done();
    }, 10);
  });

  it('should emit an error when a task returns an error and when `build` is called without a callback function.', function(done) {
    const expected = [];
    let finished = false;

    composer.on('error', function(err) {
      assert.deepEqual(expected, ['this is foo']);
      assert.equal(err.message, 'bar error');
      finished = true;
    });

    composer.task('foo', function(cb) {
      expected.push('this is foo');
      cb();
    });

    const build = composer.series('foo', function bar(cb) {
      cb(new Error('bar error'));
    });

    build();

    setTimeout(function() {
      assert(finished);
      done();
    }, 10);
  });
});
