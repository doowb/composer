'use strict';

require('mocha');
const assert = require('assert');
const util = require('util');
const Generator = require('..');
let app;

describe('.tasks', function() {
  beforeEach(function() {
    app = new Generator();
  });

  it('should throw an error when a name is not given for a task', function() {
    assert.throws(() => app.task(), /expected/);
  });

  it('should register a task', function() {
    app.task('default', () => {});
    assert(app.tasks.get('default'));
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(typeof app.tasks.get('default').callback, 'function');
  });

  it('should register a noop task when only name is given', function() {
    app.task('default');
    assert(app.tasks.get('default'));
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(typeof app.tasks.get('default').callback, 'function');
  });

  it('should register a noop task when a name and an empty dependencies array is given', function() {
    app.task('default', []);
    assert(app.tasks.get('default'));
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(typeof app.tasks.get('default').callback, 'function');
  });

  it('should register a task with an array of named dependencies', function() {
    app.task('default', ['foo', 'bar'], cb => cb());
    assert(app.tasks.get('default'));
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.deepEqual(app.tasks.get('default').deps, ['foo', 'bar']);
  });

  it('should register a task with an array of function dependencies', function() {
    const bar = cb => cb();
    const Baz = cb => cb();

    const deps = ['foo', bar, Baz, cb => cb()];
    app.task('default', deps, cb => cb());

    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.deepEqual(app.tasks.get('default').deps.length, 4);
  });

  it('should register a task with a list of strings as dependencies', function() {
    app.task('default', 'foo', 'bar', cb => cb());
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.deepEqual(app.tasks.get('default').deps.length, 2);
    assert.deepEqual(app.tasks.get('default').deps, ['foo', 'bar']);
  });

  it('should register a task as a noop function when only dependencies are given', function() {
    app.task('default', ['foo', 'bar']);
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(typeof app.tasks.get('default').callback, 'function');
  });

  it('should register a task with options as the second argument', function() {
    app.task('default', {flow: 'parallel'}, ['foo', 'bar']);
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(typeof app.tasks.get('default').callback, 'function');
    assert.equal(app.tasks.get('default').options.flow, 'parallel');
  });

  it('should run a task', function(cb) {
    let count = 0;
    app.task('default', function(cb) {
      count++;
      cb();
    });

    app.build('default', function(err) {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should run a task and return a promise', function() {
    let count = 0;
    app.task('default', function(cb) {
      count++;
      cb();
    });

    return app.build('default')
      .then(function() {
        assert.equal(count, 1);
      });
  });

  it('should run a task with options', function(cb) {
    let count = 0;
    app.task('default', { silent: false }, function(cb) {
      assert.equal(this.options.silent, false);
      count++;
      cb();
    });

    app.build('default', function(err) {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should run a task with options defined on .build', function(cb) {
    let count = 0;
    app.task('default', { silent: false }, function(cb) {
      assert.equal(this.options.silent, true);
      assert.equal(this.options.foo, 'bar');
      count++;
      cb();
    });

    app.build('default', { silent: true, foo: 'bar' }, function(err) {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should run the `default` task when no task is given', function(cb) {
    let count = 0;
    app.task('default', function(cb) {
      count++;
      cb();
    });

    app.build(function(err) {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should skip tasks when `run === false`', function(cb) {
    const expected = [];
    function callback() {
      return function(cb) {
        expected.push(this.name);
        cb();
      };
    }

    app.task('foo', callback());
    app.task('bar', {run: false}, callback());
    app.task('baz', callback());
    app.task('bang', {run: false}, callback());
    app.task('beep', callback());
    app.task('boop', callback());

    app.task('default', ['foo', 'bar', 'baz', 'bang', 'beep', 'boop']);
    app.build(function(err) {
      if (err) return cb(err);
      assert.deepEqual(expected, ['foo', 'baz', 'beep', 'boop']);
      cb();
    });
  });

  it('should skip tasks when `run === false` (with deps skipped)', function(cb) {
    const expected = [];
    function callback() {
      return function(cb) {
        expected.push(this.name);
        cb();
      };
    }

    app.task('foo', callback());
    app.task('bar', { run: false }, ['foo'], callback());
    app.task('baz', ['bar'], callback());
    app.task('bang', { run: false }, ['baz'], callback());
    app.task('beep', ['bang'], callback());
    app.task('boop', ['beep'], callback());

    app.task('default', ['boop']);
    app.build(function(err) {
      if (err) return cb(err);
      assert.deepEqual(expected, ['beep', 'boop']);
      cb();
    });
  });

  it('should skip tasks when `run === false` (complex flow)', function(cb) {
    const expected = [];

    app.task('foo', function(cb) {
      expected.push(this.name);
      // disable running the "bar" task
      app.tasks.get('bar').options.run = false;
      cb();
    });

    app.task('bar', function(cb) {
      expected.push(this.name);
      cb();
    });

    app.task('baz', function(cb) {
      expected.push(this.name);
      // enable running the "bang" task
      app.tasks.get('bang').options.run = true;
      cb();
    });

    app.task('bang', {run: false}, function(cb) {
      expected.push(this.name);
      cb();
    });

    app.task('beep', function(cb) {
      expected.push(this.name);
      cb();
    });

    app.task('boop', function(cb) {
      expected.push(this.name);
      cb();
    });

    app.task('default', ['foo', 'bar', 'baz', 'bang', 'beep', 'boop']);
    app.build(function(err) {
      if (err) return cb(err);
      assert.deepEqual(expected, ['foo', 'baz', 'bang', 'beep', 'boop']);
      cb();
    });
  });

  it('should throw an error when a task with unregistered dependencies is built', function(cb) {
    let count = 0;
    app.task('default', ['foo', 'bar'], function(cb) {
      count++;
      cb();
    });

    app.build('default', function(err) {
      if (!err) return cb(new Error('Expected an error to be thrown.'));
      assert.equal(count, 0);
      cb();
    });
  });

  it('should throw an error when a task with globbed dependencies cannot be found', function(cb) {
    let count = 0;
    app.task('default', ['a-*'], function(cb) {
      count++;
      cb();
    });

    app.build('default', function(err) {
      if (!err) return cb(new Error('Expected an error to be thrown.'));
      assert.equal(count, 0);
      cb();
    });
  });

  it('should emit task events', function(cb) {
    const events = [];
    app.on('task', function(task) {
      events.push(task.status + '.' + task.name);
    });

    app.on('error', function(err) {
      if (!err.build) {
        events.push('error.' + err.task.name);
      }
    });

    app.task('foo', cb => cb());
    app.task('bar', ['foo'], cb => cb());

    app.task('default', ['bar']);
    app.build('default', function(err) {
      if (err) return cb(err);
      assert.deepEqual(events, [
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
      cb();
    });
  });

  it('should emit an error event when an error is returned in a callback', function(cb) {
    let count = 0;
    app.on('error', function(err) {
      assert(err);
      count++;
    });

    app.task('default', function(cb) {
      cb(new Error('This is an error'));
    });

    app.build('default', function(err) {
      assert(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should emit an error event when an error is thrown in a task', function(cb) {
    let count = 0;
    app.on('error', function(err) {
      assert(err);
      count++;
    });

    app.task('default', function() {
      throw new Error('This is an error');
    });

    app.build('default', function(err) {
      assert(err);
      assert(/This is an error/.test(err.message));
      assert.equal(count, 1);
      cb();
    });
  });

  it('should emit build events', function() {
    const events = [];
    const errors = [];

    app.on('build', function(build) {
      events.push(build.status);
    });

    app.on('error', function(err) {
      errors.push(err);
    });

    app.task('foo', cb => cb());
    app.task('bar', ['foo'], cb => cb());

    app.task('default', ['bar']);
    return app.build('default')
      .then(() => {
        assert.equal(errors.length, 0);
        assert.deepEqual(events, ['starting', 'finished']);
      });
  });

  it('should emit a build error event when an error is passed back in a task', function(cb) {
    let count = 0;

    app.on('error', function(err) {
      assert(err);
      count++;
    });

    app.task('default', function(cb) {
      cb(new Error('This is an error'));
    });

    app.build('default', function(err) {
      assert(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should emit a build error event when an error is passed back in a task (with promise)', function() {
    let count = 0;

    app.on('error', function(err) {
      assert(err);
      count++;
    });

    app.task('default', function(next) {
      next(new Error('This is an error'));
    });

    return app.build('default')
      .catch(err => {
        assert(err);
        assert.equal(count, 1);
      });
  });

  it('should emit a build error event when an error is thrown in a task', function(cb) {
    let count = 0;

    app.on('error', function(err) {
      assert(err);
      assert(/This is an error/.test(err.message));
      count++;
    });

    app.task('default', function() {
      throw new Error('This is an error');
    });

    app.build('default', function(err) {
      assert(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should run dependencies before running the dependent task.', function(cb) {
    const seq = [];
    app.task('foo', function(cb) {
      seq.push('foo');
      cb();
    });

    app.task('bar', function(cb) {
      seq.push('bar');
      cb();
    });

    app.task('default', ['foo', 'bar'], function(cb) {
      seq.push('default');
      cb();
    });

    app.build('default', function(err) {
      if (err) return cb(err);
      assert.deepEqual(seq, ['foo', 'bar', 'default']);
      cb();
    });
  });

  it('should add inspect function to tasks.', function() {
    app.task('foo', function(cb) {
      cb();
    });

    app.task('bar', function(cb) {
      cb();
    });

    app.task('default', ['foo', 'bar'], function(cb) {
      cb();
    });
    assert.equal(app.tasks.get('foo')[util.inspect.custom](), '<Task "foo" deps: []>');
    assert.equal(app.tasks.get('bar')[util.inspect.custom](), '<Task "bar" deps: []>');
    assert.equal(app.tasks.get('default')[util.inspect.custom](), '<Task "default" deps: [foo, bar]>');
  });

  it('should run globbed dependencies before running the dependent task.', function(cb) {
    const actual = [];
    app.task('a-foo', function(cb) {
      actual.push('a-foo');
      cb();
    });

    app.task('a-bar', function(cb) {
      actual.push('a-bar');
      cb();
    });

    app.task('b-foo', function(cb) {
      actual.push('b-foo');
      cb();
    });

    app.task('b-bar', function(cb) {
      actual.push('b-bar');
      cb();
    });

    app.task('default', ['a-*'], function(cb) {
      actual.push('default');
      cb();
    });

    app.build(function(err) {
      if (err) return cb(err);
      assert.deepEqual(actual, ['a-foo', 'a-bar', 'default']);
      cb();
    });
  });

  it('should get the current task name from `this`', function(cb) {
    const actual = [];
    const tasks = [];

    const callback = function(cb) {
      actual.push(this.name);
      cb();
    };

    for (let i = 0; i < 10; i++) {
      tasks.push(String(i));
      app.task(String(i), callback);
    }

    app.build(tasks, function(err) {
      if (err) return cb(err);
      assert.equal(actual.length, 10);
      assert.deepEqual(actual, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
      cb();
    });
  });
});
