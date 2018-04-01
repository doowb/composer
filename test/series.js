'use strict';

require('mocha');
const assert = require('assert');
const Composer = require('../');
let app;

describe('series', function() {
  beforeEach(function() {
    app = new Composer();
  });

  describe('callback', function() {
    it('should compose tasks into a function that runs in series', function(cb) {
      const actual = [];

      app.task('foo', function(cb) {
        setTimeout(function() {
          actual.push('foo');
          cb();
        }, 20);
      });

      app.task('bar', function(cb) {
        setTimeout(function() {
          actual.push('bar');
          cb();
        }, 10);
      });

      app.task('baz', function(cb) {
        actual.push('baz');
        cb();
      });

      const build = app.series(['foo', 'bar', 'baz']);

      build(function(err) {
        if (err) return cb(err);
        assert.deepEqual(actual, ['foo', 'bar', 'baz']);
        cb();
      });
    });

    it('should compose tasks with options into a function that runs in series', function(cb) {
      const actual = [];

      app.task('foo', { silent: false }, function(cb) {
        assert.equal(this.options.silent, false);
        actual.push('foo');
        cb();
      });

      const build = app.series('foo', function bar(cb) {
        actual.push('bar');
        cb();
      });

      build(function(err) {
        if (err) return cb(err);
        assert.deepEqual(actual, ['foo', 'bar']);
        cb();
      });
    });

    it('should return an error when no functions are passed to series', function(cb) {
      const build = app.series();

      build(function(err) {
        assert(/actual/, err.message);
        assert(/tasks/, err.message);
        cb();
      });
    });

    it('should compose tasks with additional options into a function that runs in series', function(cb) {
      const actual = [];

      app.task('foo', { silent: false }, function(cb) {
        assert.equal(this.options.silent, true);
        assert.equal(this.options.foo, 'bar');
        actual.push('foo');
        cb();
      });

      const options = { silent: true, foo: 'bar' };
      const build = app.series('foo', function bar(cb) {
        actual.push('bar');
        cb();
      }, options);

      build(function(err) {
        if (err) {
          cb(err);
          return;
        }
        assert.deepEqual(actual, ['foo', 'bar']);
        cb();
      });
    });

    it('should not throw an error when `build` is called without a callback function.', function(cb) {
      const actual = [];

      app.task('foo', function(next) {
        actual.push('foo');
        next();
      });

      const build = app.series('foo', function(next) {
        actual.push('bar');
        next();
      });

      build();

      setTimeout(function() {
        assert.deepEqual(actual, ['foo', 'bar']);
        cb();
      }, 10);
    });

    it('should handle errors', function() {
      const actual = [];
      let count = 0;

      app.on('error', function(err) {
        actual.push(err.message);
        count++;
      });

      app.task('foo', function(cb) {
        actual.push('foo');
        count++;
        cb();
      });

      const build = app.series('foo', function(cb) {
        count++;
        cb(new Error('an error'));
      });

      return build()
        .then(() => {
          throw new Error('actual an error');
        })
        .catch(err => {
          assert.equal(count, 3);
          assert.deepEqual(actual, ['foo', 'an error']);
        });
    });
  });

  describe('promise', function() {
    it('should compose tasks into a function that runs in series', function() {
      const actual = [];

      app.task('foo', function(cb) {
        actual.push('foo');
        cb();
      });

      const build = app.series('foo', function bar(cb) {
        actual.push('bar');
        cb();
      });

      return build()
        .then(() => {
          assert.deepEqual(actual, ['foo', 'bar']);
        });
    });

    it('should compose tasks with options into a function that runs in series', function() {
      const actual = [];

      app.task('foo', { silent: false }, function(cb) {
        assert.equal(this.options.silent, false);
        actual.push('foo');
        cb();
      });

      const build = app.series('foo', function bar(cb) {
        actual.push('bar');
        cb();
      });

      return build()
        .then(() => {
          assert.deepEqual(actual, ['foo', 'bar']);
        });
    });

    it('should return an error when no functions are passed to series', function(cb) {
      const build = app.series();

      return build(function(err) {
        assert(err);
        cb();
      });
    });

    it('should compose tasks with additional options into a function that runs in series', function() {
      const actual = [];

      app.task('foo', { silent: false }, function(cb) {
        assert.equal(this.options.silent, true);
        assert.equal(this.options.foo, 'bar');
        actual.push('foo');
        cb();
      });

      const options = { silent: true, foo: 'bar' };
      const build = app.series('foo', function(cb) {
        actual.push('bar');
        cb();
      }, options);

      return build()
        .then(() => {
          assert.deepEqual(actual, ['foo', 'bar']);
        });
    });
  });
});
