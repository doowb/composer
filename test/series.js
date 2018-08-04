'use strict';

require('mocha');
const assert = require('assert');
const Composer = require('..');
let app;

describe('series', () => {
  beforeEach(() => {
    app = new Composer();
  });

  describe('callback', () => {
    it('should compose tasks into a function that runs in series', cb => {
      const actual = [];

      app.task('foo', cb => {
        setTimeout(() => {
          actual.push('foo');
          cb();
        }, 20);
      });

      app.task('bar', cb => {
        setTimeout(() => {
          actual.push('bar');
          cb();
        }, 10);
      });

      app.task('baz', cb => {
        actual.push('baz');
        cb();
      });

      const build = app.series(['foo', 'bar', 'baz']);

      build(err => {
        if (err) return cb(err);
        assert.deepEqual(actual, ['foo', 'bar', 'baz']);
        cb();
      });
    });

    it('should compose tasks with options into a function that runs in series', cb => {
      const actual = [];

      app.task('foo', { silent: false }, function(next) {
        assert.equal(this.options.silent, false);
        actual.push('foo');
        next();
      });

      const build = app.series('foo', function bar(next) {
        actual.push('bar');
        next();
      });

      build(err => {
        if (err) return cb(err);
        assert.deepEqual(actual, ['foo', 'bar']);
        cb();
      });
    });

    it('should return an error when no functions are passed to series', cb => {
      const build = app.series();

      build(err => {
        assert(/actual/, err.message);
        assert(/tasks/, err.message);
        cb();
      });
    });

    it('should compose tasks with additional options into a function that runs in series', cb => {
      const actual = [];

      app.task('foo', { silent: false }, function(next) {
        assert.equal(this.options.silent, true);
        assert.equal(this.options.foo, 'bar');
        actual.push('foo');
        next();
      });

      const options = { silent: true, foo: 'bar' };
      const build = app.series('foo', function(next) {
        actual.push('bar');
        next();
      }, options);

      build(err => {
        if (err) {
          cb(err);
          return;
        }
        assert.deepEqual(actual, ['foo', 'bar']);
        cb();
      });
    });

    it('should not throw an error when `build` is called without a callback function.', cb => {
      const actual = [];

      app.task('foo', next => {
        actual.push('foo');
        next();
      });

      const build = app.series('foo', next => {
        actual.push('bar');
        next();
      });

      build();

      setTimeout(() => {
        assert.deepEqual(actual, ['foo', 'bar']);
        cb();
      }, 10);
    });

    it('should handle errors', () => {
      const actual = [];
      let count = 0;

      app.on('error', err => {
        actual.push(err.message);
        count++;
      });

      app.task('foo', cb => {
        actual.push('foo');
        count++;
        cb();
      });

      const build = app.series('foo', cb => {
        count++;
        cb(new Error('an error'));
      });

      return build()
        .then(() => {
          throw new Error('actual an error');
        })
        .catch(() => {
          assert.equal(count, 3);
          assert.deepEqual(actual, ['foo', 'an error']);
        });
    });
  });

  describe('promise', () => {
    it('should compose tasks into a function that runs in series', () => {
      const actual = [];

      app.task('foo', cb => {
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

    it('should compose tasks with options into a function that runs in series', () => {
      const actual = [];

      app.task('foo', { silent: false }, function(next) {
        assert.equal(this.options.silent, false);
        actual.push('foo');
        next();
      });

      const build = app.series('foo', function(next) {
        actual.push('bar');
        next();
      });

      return build()
        .then(() => {
          assert.deepEqual(actual, ['foo', 'bar']);
        });
    });

    it('should return an error when no functions are passed to series', cb => {
      const build = app.series();

      return build(err => {
        assert(err);
        cb();
      });
    });

    it('should compose tasks with additional options into a function that runs in series', () => {
      const actual = [];

      app.task('foo', { silent: false }, function(next) {
        assert.equal(this.options.silent, true);
        assert.equal(this.options.foo, 'bar');
        actual.push('foo');
        next();
      });

      const options = { silent: true, foo: 'bar' };
      const build = app.series('foo', function(next) {
        actual.push('bar');
        next();
      }, options);

      return build()
        .then(() => {
          assert.deepEqual(actual, ['foo', 'bar']);
        });
    });
  });
});
