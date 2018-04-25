'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('.task', function() {
  beforeEach(function() {
    base = new Generator();
  });

  it('should register a task', function() {
    const fn = cb => cb();
    base.task('default', fn);
    assert.equal(typeof base.tasks.get('default'), 'object');
    assert.equal(base.tasks.get('default').callback, fn);
  });

  it('should register a task with an array of dependencies', function(cb) {
    let count = 0;
    base.task('foo', function(next) {
      count++;
      next();
    });
    base.task('bar', function(next) {
      count++;
      next();
    });
    base.task('default', ['foo', 'bar'], function(next) {
      count++;
      next();
    });
    assert.equal(typeof base.tasks.get('default'), 'object');
    assert.deepEqual(base.tasks.get('default').deps, ['foo', 'bar']);
    base.build('default', function(err) {
      if (err) return cb(err);
      assert.equal(count, 3);
      cb();
    });
  });

  it('should run a glob of tasks', function(cb) {
    let count = 0;
    base.task('foo', function(next) {
      count++;
      next();
    });
    base.task('bar', function(next) {
      count++;
      next();
    });
    base.task('baz', function(next) {
      count++;
      next();
    });
    base.task('qux', function(next) {
      count++;
      next();
    });
    base.task('default', ['b*']);
    assert.equal(typeof base.tasks.get('default'), 'object');
    base.build('default', function(err) {
      if (err) return cb(err);
      assert.equal(count, 2);
      cb();
    });
  });

  it('should register a task with a list of strings as dependencies', function() {
    base.task('default', 'foo', 'bar', function(cb) {
      cb();
    });
    assert.equal(typeof base.tasks.get('default'), 'object');
    assert.deepEqual(base.tasks.get('default').deps, ['foo', 'bar']);
  });

  it('should run a task', function(cb) {
    let count = 0;
    base.task('default', function(cb) {
      count++;
      cb();
    });

    base.build('default', function(err) {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should throw an error when a task with unregistered dependencies is run', function(cb) {
    base.task('default', ['foo', 'bar']);
    base.build('default', function(err) {
      assert(err);
      cb();
    });
  });

  it('should throw an error when a task does not exist', function() {
    return base.build('default')
      .then(() => {
        throw new Error('expected an error');
      })
      .catch(err => {
        assert(/registered/.test(err.message));
      });
  });

  it('should emit task events', function() {
    const expected = [];

    base.on('task', function(task) {
      expected.push(task.status + '.' + task.name);
    });

    base.task('foo', cb => cb());
    base.task('bar', ['foo'], cb => cb());
    base.task('default', ['bar']);

    return base.build('default')
      .then(function() {
        assert.deepEqual(expected, [
          'pending.foo',
          'pending.bar',
          'pending.default',
          'preparing.default',
          'starting.default',
          'preparing.bar',
          'starting.bar',
          'preparing.foo',
          'starting.foo',
          'finished.foo',
          'finished.bar',
          'finished.default'
        ]);
      });
  });

  it('should emit an error event when an error is returned in a task callback', function(cb) {
    base.on('error', function(err) {
      assert(err);
      assert.equal(err.message, 'This is an error');
    });
    base.task('default', function(cb) {
      return cb(new Error('This is an error'));
    });
    base.build('default', function(err) {
      if (err) return cb();
      cb(new Error('Expected an error'));
    });
  });

  it('should emit an error event when an error is thrown in a task', function(cb) {
    base.on('error', function(err) {
      assert(err);
      assert.equal(err.message, 'This is an error');
    });
    base.task('default', function(cb) {
      cb(new Error('This is an error'));
    });
    base.build('default', function(err) {
      assert(err);
      cb();
    });
  });

  it('should run dependencies before running the dependent task', function(cb) {
    const expected = [];

    base.task('foo', function(cb) {
      expected.push('foo');
      cb();
    });
    base.task('bar', function(cb) {
      expected.push('bar');
      cb();
    });
    base.task('default', ['foo', 'bar'], function(cb) {
      expected.push('default');
      cb();
    });

    base.build('default', function(err) {
      if (err) return cb(err);
      assert.deepEqual(expected, ['foo', 'bar', 'default']);
      cb();
    });
  });
});
