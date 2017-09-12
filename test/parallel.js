'use strict';

var assert = require('assert');

var Composer = require('../');
var composer;

describe('parallel', function() {
  beforeEach(function() {
    composer = new Composer();
  });

  it('should compose tasks into a function that runs in parallel', function(done) {
    var output = [];
    composer.task('foo', function(cb) {
      setTimeout(function() {
        output.push('this is foo');
        cb();
      }, 10);
    });
    var fn = composer.parallel('foo', function bar(cb) {
      output.push('this is bar');
      cb();
    });

    fn(function(err) {
      if (err) return done(err);
      assert.deepEqual(output, ['this is bar', 'this is foo']);
      done();
    });
  });

  it('should return an error when no functions are passed to parallel', function(done) {
    var fn = composer.parallel();
    fn(function(err) {
      if (!err) {
        done(new Error('expected an error'));
        return;
      }
      assert.equal(err.message, 'A set of functions to combine is required');
      done();
    });
  });

  it('should compose tasks with options into a function that runs in parallel', function(done) {
    var output = [];
    composer.task('foo', {silent: false}, function(cb) {
      assert.equal(this.options.silent, false);
      setTimeout(function() {
        output.push('this is foo');
        cb();
      });
    });
    var fn = composer.parallel('foo', function bar(cb) {
      output.push('this is bar');
      cb();
    });

    fn(function(err) {
      if (err) return done(err);
      assert.deepEqual(output, ['this is bar', 'this is foo']);
      done();
    });
  });

  it('should compose tasks with additional options into a function that runs in parallel', function(done) {
    var output = [];
    composer.task('foo', {silent: false}, function(cb) {
      assert.equal(this.options.silent, true);
      assert.equal(this.options.foo, 'bar');
      setTimeout(function() {
        output.push('this is foo');
        cb();
      });
    });
    var fn = composer.parallel('foo', function bar(cb) {
      output.push('this is bar');
      cb();
    }, {silent: true, foo: 'bar'});

    fn(function(err) {
      if (err) return done(err);
      assert.deepEqual(output, ['this is bar', 'this is foo']);
      done();
    });
  });

  it('should not throw an error when `fn` is called without a callback function.', function(done) {
    var output = [];
    composer.task('foo', function(cb) {
      setTimeout(function() {
        output.push('this is foo');
        cb();
      }, 10);
    });
    var fn = composer.parallel('foo', function bar(cb) {
      output.push('this is bar');
      cb();
    });

    fn();

    setTimeout(function() {
      assert.deepEqual(output, ['this is bar', 'this is foo']);
      done();
    }, 20);
  });

  it('should emit an error when a task returns an error and when `fn` is called without a callback function.', function(done) {
    var output = [];
    var finished = false;
    composer.on('error', function(err) {
      finished = true;
      assert.deepEqual(output, []);
      assert.equal(err.message, 'bar error');
      done();
    });

    composer.task('foo', function(cb) {
      setTimeout(function() {
        output.push('this is foo');
        cb();
      }, 10);
    });
    var fn = composer.parallel('foo', function bar(cb) {
      cb(new Error('bar error'));
    });

    fn();

    setTimeout(function() {
      if (!finished) {
        done(new Error('Expected an error'));
      }
    }, 20);
  });
});
