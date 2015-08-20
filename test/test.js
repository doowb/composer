'use strict';

var assert = require('assert');
var Composer = require('../').Composer;
var noop = require('../lib/noop');
var composer;

describe('composer', function () {
  beforeEach(function () {
    composer = new Composer();
  });

  it('should register a task', function () {
    var fn = function (done) {
      done();
    };
    composer.task('default', fn);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.fn, fn);
  });

  it('should register a task with an array of dependencies', function () {
    composer.task('default', ['foo', 'bar'], function (done) {
      done();
    });
    assert.equal(typeof composer.tasks.default, 'object');
    assert.deepEqual(composer.tasks.default.deps, ['foo', 'bar']);
  });

  it('should register a task with a list of strings as dependencies', function () {
    composer.task('default', 'foo', 'bar', function (done) {
      done();
    });
    assert.equal(typeof composer.tasks.default, 'object');
    assert.deepEqual(composer.tasks.default.deps, ['foo', 'bar']);
  });

  it('should register a task as a noop function when only dependencies are given', function () {
    composer.task('default', ['foo', 'bar']);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.fn, noop);
  });

  it('should run a task', function (done) {
    var count = 0;
    composer.task('default', function (cb) {
      count++;
      cb();
    });

    composer.run('default', function (err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should throw an error when a task with unregistered dependencies is run', function (done) {
    var count = 0;
    composer.task('default', ['foo', 'bar'], function (cb) {
      count++;
      cb();
    });

    composer.run('default', function (err) {
      if (!err) return done(new Error('Expected an error to be thrown.'));
      assert.equal(count, 0);
      done();
    });
  });

  it('should throw an error when `.run` is called without a callback function.', function () {
    try {
      composer.run('default');
      throw new Error('Expected an error to be thrown.');
    } catch (err) {
    }
  });

  it('should emit task events', function (done) {
    var events = [];
    composer.on('starting', function (task, run) {
      events.push('starting.' + task.name);
    });
    composer.on('finished', function (task, run) {
      events.push('finished.' + task.name);
    });
    composer.on('error', function (err, task, run) {
      events.push('error.' + task.name);
    });

    composer.task('foo', function (cb) {
      cb();
    });
    composer.task('bar', ['foo'], function (cb) {
      cb();
    });
    composer.task('default', ['bar']);
    composer.run('default', function (err) {
      if (err) return done(err);
      assert.deepEqual(events, ['starting.foo','finished.foo','starting.bar','finished.bar','starting.default','finished.default']);
      done();
    });
  });

  it('should emit an error event when an error is passed back in a task', function (done) {
    composer.on('error', function (err, task, run) {
      assert(err);
      assert.equal(err.message, 'This is an error');
    });
    composer.task('default', function (cb) {
      return cb(new Error('This is an error'));
    });
    composer.run('default', function (err) {
      if (err) return done();
      done(new Error('Expected an error'));
    });
  });

  it('should emit an error event when an error is thrown in a task', function (done) {
    var errors = 0;
    composer.on('error', function (err, task, run) {
      errors++;
      assert(err);
      assert.equal(err.message, 'This is an error');
    });
    composer.task('default', function (cb) {
      throw new Error('This is an error');
      cb();
    });
    composer.run('default', function (err) {
      assert.equal(errors, 1);
      if (err) return done();
      done(new Error('Expected an error'));
    });
  });

  it('should run dependencies before running the dependent task.', function (done) {
    var seq = [];
    composer.task('foo', function (cb) {
      seq.push('foo');
      cb();
    });
    composer.task('bar', function (cb) {
      seq.push('bar');
      cb();
    });
    composer.task('default', ['foo', 'bar'], function (cb) {
      seq.push('default');
      cb();
    });

    composer.run('default', function (err) {
      if (err) return done(err);
      assert.deepEqual(seq, ['foo', 'bar', 'default']);
      done();
    });
  });

});
