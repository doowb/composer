'use strict';

var assert = require('assert');

var Composer = require('../');
var composer;

describe('series', function() {
  beforeEach(function() {
    composer = new Composer();
  });

  it('should compose tasks into a function that runs in series', function(done) {
    var output = [];
    composer.task('foo', function(cb) {
      output.push('this is foo');
      cb();
    });
    var fn = composer.series('foo', function bar(cb) {
      output.push('this is bar');
      cb();
    });

    fn(function(err) {
      if (err) return done(err);
      assert.deepEqual(output, ['this is foo', 'this is bar']);
      done();
    });
  });

  it('should compose tasks with options into a function that runs in series', function(done) {
    var output = [];
    composer.task('foo', {silent: false}, function(cb) {
      assert.equal(this.options.silent, false);
      output.push('this is foo');
      cb();
    });
    var fn = composer.series('foo', function bar(cb) {
      output.push('this is bar');
      cb();
    });

    fn(function(err) {
      if (err) return done(err);
      assert.deepEqual(output, ['this is foo', 'this is bar']);
      done();
    });
  });

  it('should return an error when no functions are passed to series', function(done) {
    var fn = composer.series();
    fn(function(err) {
      if (!err) {
        done(new Error('expected an error'));
        return;
      }
      assert.equal(err.message, 'A set of functions to combine is required');
      done();
    });
  });

  it('should compose tasks with additional options into a function that runs in series', function(done) {
    var output = [];
    composer.task('foo', {silent: false}, function(cb) {
      assert.equal(this.options.silent, true);
      assert.equal(this.options.foo, 'bar');
      output.push('this is foo');
      cb();
    });
    var fn = composer.series('foo', function bar(cb) {
      output.push('this is bar');
      cb();
    }, {silent: true, foo: 'bar'});

    fn(function(err) {
      if (err) return done(err);
      assert.deepEqual(output, ['this is foo', 'this is bar']);
      done();
    });
  });

  it('should not throw an error when `fn` is called without a callback function.', function(done) {
    var output = [];
    composer.task('foo', function(cb) {
      output.push('this is foo');
      cb();
    });
    var fn = composer.series('foo', function bar(cb) {
      output.push('this is bar');
      cb();
    });

    fn();

    setTimeout(function() {
      assert.deepEqual(output, ['this is foo', 'this is bar']);
      done();
    }, 10);
  });

  it('should emit an error when a task returns an error and when `fn` is called without a callback function.', function(done) {
    var output = [];
    var finished = false;
    composer.on('error', function(err) {
      finished = true;
      assert.deepEqual(output, ['this is foo']);
      assert.equal(err.message, 'bar error');
      done();
    });

    composer.task('foo', function(cb) {
      output.push('this is foo');
      cb();
    });
    var fn = composer.series('foo', function bar(cb) {
      cb(new Error('bar error'));
    });

    fn();

    setTimeout(function() {
      if (!finished) {
        done(new Error('Expected an error'));
      }
    }, 10);
  });
});
