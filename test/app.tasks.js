'use strict';

require('mocha');
const assert = require('assert');
const util = require('util');
const Generator = require('..');
let app;

describe('.tasks', () => {
  beforeEach(() => {
    app = new Generator();
  });

  it('should throw an error when a name is not given for a task', () => {
    assert.throws(() => app.task(), /expected/);
  });

  it('should register a task', () => {
    app.task('default', () => {});
    assert(app.tasks.get('default'));
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(typeof app.tasks.get('default').callback, 'function');
  });

  it('should register a noop task when only name is given', () => {
    app.task('default');
    assert(app.tasks.get('default'));
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(typeof app.tasks.get('default').callback, 'function');
  });

  it('should register a noop task when a name and an empty dependencies array is given', () => {
    app.task('default', []);
    assert(app.tasks.get('default'));
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(typeof app.tasks.get('default').callback, 'function');
  });

  it('should register a task with an array of named dependencies', () => {
    app.task('default', ['foo', 'bar'], cb => cb());
    assert(app.tasks.get('default'));
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.deepEqual(app.tasks.get('default').deps, ['foo', 'bar']);
  });

  it('should register a task with an array of function dependencies', () => {
    const bar = cb => cb();
    const Baz = cb => cb();

    const deps = ['foo', bar, Baz, cb => cb()];
    app.task('default', deps, cb => cb());

    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.deepEqual(app.tasks.get('default').deps.length, 4);
  });

  it('should register a task with a list of strings as dependencies', () => {
    app.task('default', 'foo', 'bar', cb => cb());
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.deepEqual(app.tasks.get('default').deps.length, 2);
    assert.deepEqual(app.tasks.get('default').deps, ['foo', 'bar']);
  });

  it('should register a task as a noop function when only dependencies are given', () => {
    app.task('default', ['foo', 'bar']);
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(typeof app.tasks.get('default').callback, 'function');
  });

  it('should register a task with options as the second argument', () => {
    app.task('default', { one: 'two' }, ['foo', 'bar']);
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(typeof app.tasks.get('default').callback, 'function');
    assert.equal(app.tasks.get('default').options.one, 'two');
  });

  it('should run a task', cb => {
    let count = 0;
    app.task('default', cb => {
      count++;
      cb();
    });

    app.build('default', err => {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should run a task and return a promise', () => {
    let count = 0;
    app.task('default', cb => {
      count++;
      cb();
    });

    return app.build('default')
      .then(() => {
        assert.equal(count, 1);
      });
  });

  it('should run a task with options', cb => {
    let count = 0;
    app.task('default', { silent: false }, function(next) {
      assert.equal(this.options.silent, false);
      count++;
      next();
    });

    app.build('default', err => {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should run a task with options defined on .build', cb => {
    let count = 0;
    app.task('default', { silent: false }, function(next) {
      assert.equal(this.options.silent, true);
      assert.equal(this.options.foo, 'bar');
      count++;
      next();
    });

    app.build('default', { silent: true, foo: 'bar' }, err => {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should run the `default` task when no task is given', cb => {
    let count = 0;

    app.task('default', next => {
      count++;
      next();
    });

    app.build(err => {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should skip tasks when `run === false`', cb => {
    const expected = [];
    function callback() {
      return function(next) {
        expected.push(this.name);
        next();
      };
    }

    app.task('foo', callback());
    app.task('bar', {run: false}, callback());
    app.task('baz', callback());
    app.task('bang', {run: false}, callback());
    app.task('beep', callback());
    app.task('boop', callback());

    app.task('default', ['foo', 'bar', 'baz', 'bang', 'beep', 'boop']);
    app.build(err => {
      if (err) return cb(err);
      assert.deepEqual(expected, ['foo', 'baz', 'beep', 'boop']);
      cb();
    });
  });

  it('should skip tasks when `run === false` (with deps skipped)', cb => {
    const expected = [];
    function callback() {
      return function(next) {
        expected.push(this.name);
        next();
      };
    }

    app.task('foo', callback());
    app.task('bar', { run: false }, ['foo'], callback());
    app.task('baz', ['bar'], callback());
    app.task('bang', { run: false }, ['baz'], callback());
    app.task('beep', ['bang'], callback());
    app.task('boop', ['beep'], callback());

    app.task('default', ['boop']);
    app.build(err => {
      if (err) return cb(err);
      assert.deepEqual(expected, ['beep', 'boop']);
      cb();
    });
  });

  it('should skip tasks when `run === false` (complex flow)', cb => {
    const expected = [];

    app.task('foo', function(next) {
      expected.push(this.name);
      // disable running the "bar" task
      app.tasks.get('bar').options.run = false;
      next();
    });

    app.task('bar', function(next) {
      expected.push(this.name);
      next();
    });

    app.task('baz', function(next) {
      expected.push(this.name);
      // enable running the "bang" task
      app.tasks.get('bang').options.run = true;
      next();
    });

    app.task('bang', {run: false}, function(next) {
      expected.push(this.name);
      next();
    });

    app.task('beep', function(next) {
      expected.push(this.name);
      next();
    });

    app.task('boop', function(next) {
      expected.push(this.name);
      next();
    });

    app.task('default', ['foo', 'bar', 'baz', 'bang', 'beep', 'boop']);
    app.build(err => {
      if (err) return cb(err);
      assert.deepEqual(expected, ['foo', 'baz', 'bang', 'beep', 'boop']);
      cb();
    });
  });

  it('should throw an error when a task with unregistered dependencies is built', cb => {
    let count = 0;
    app.task('default', ['foo', 'bar'], cb => {
      count++;
      cb();
    });

    app.build('default', err => {
      if (!err) return cb(new Error('Expected an error to be thrown.'));
      assert.equal(count, 0);
      cb();
    });
  });

  it('should throw an error when a task with globbed dependencies cannot be found', cb => {
    let count = 0;
    app.task('default', ['a-*'], cb => {
      count++;
      cb();
    });

    app.build('default', err => {
      if (!err) return cb(new Error('Expected an error to be thrown.'));
      assert.equal(count, 0);
      cb();
    });
  });

  it('should emit task events', cb => {
    const events = [];
    const push = task => events.push(task.status + '.' + task.name);

    app.on('task', push);
    app.on('task-registered', push);
    app.on('task-preparing', push);

    app.on('error', err => {
      if (!err.build) {
        events.push('error.' + err.task.name);
      }
    });

    app.task('foo', cb => cb());
    app.task('bar', ['foo'], cb => cb());

    app.task('default', ['bar']);
    app.build('default', err => {
      if (err) return cb(err);
      assert.deepEqual(events, [
        'registered.foo',
        'registered.bar',
        'registered.default',
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

  it('should emit an error event when an error is returned in a callback', cb => {
    let count = 0;
    app.on('error', err => {
      assert(err);
      count++;
    });

    app.task('default', cb => {
      cb(new Error('This is an error'));
    });

    app.build('default', err => {
      assert(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should emit an error event when an error is thrown in a task', cb => {
    let count = 0;
    app.on('error', err => {
      assert(err);
      count++;
    });

    app.task('default', () => {
      throw new Error('This is an error');
    });

    app.build('default', err => {
      assert(err);
      assert(/This is an error/.test(err.message));
      assert.equal(count, 1);
      cb();
    });
  });

  it('should emit build events', () => {
    const events = [];
    const errors = [];

    app.on('build', function(build) {
      events.push(build.status);
    });

    app.on('error', err => {
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

  it('should emit a build error event when an error is passed back in a task', cb => {
    let count = 0;

    app.on('error', err => {
      assert(err);
      count++;
    });

    app.task('default', cb => {
      cb(new Error('This is an error'));
    });

    app.build('default', err => {
      assert(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should emit a build error event when an error is passed back in a task (with promise)', () => {
    let count = 0;

    app.on('error', err => {
      assert(err);
      count++;
    });

    app.task('default', next => {
      next(new Error('This is an error'));
    });

    return app.build('default')
      .catch(err => {
        assert(err);
        assert.equal(count, 1);
      });
  });

  it('should emit a build error event when an error is thrown in a task', cb => {
    let count = 0;

    app.on('error', err => {
      assert(err);
      assert(/This is an error/.test(err.message));
      count++;
    });

    app.task('default', () => {
      throw new Error('This is an error');
    });

    app.build('default', err => {
      assert(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should run dependencies before running the dependent task.', cb => {
    const seq = [];
    app.task('foo', cb => {
      seq.push('foo');
      cb();
    });

    app.task('bar', cb => {
      seq.push('bar');
      cb();
    });

    app.task('default', ['foo', 'bar'], cb => {
      seq.push('default');
      cb();
    });

    app.build('default', err => {
      if (err) return cb(err);
      assert.deepEqual(seq, ['foo', 'bar', 'default']);
      cb();
    });
  });

  it('should add inspect function to tasks.', () => {
    app.task('foo', cb => {
      cb();
    });

    app.task('bar', cb => {
      cb();
    });

    app.task('default', ['foo', 'bar'], cb => {
      cb();
    });
    assert.equal(app.tasks.get('foo')[util.inspect.custom](), '<Task "foo" deps: []>');
    assert.equal(app.tasks.get('bar')[util.inspect.custom](), '<Task "bar" deps: []>');
    assert.equal(app.tasks.get('default')[util.inspect.custom](), '<Task "default" deps: [foo, bar]>');
  });

  it('should add custom inspect function to tasks.', () => {
    app.on('task-registered', task => {
      task[util.inspect.custom] = function(task) {
        return '<Task "' + this.name + '"'
          + (this.deps.length ? ' [' + this.deps.join(', ') + ']' : '')
          + '>';
      };
    });

    app.task('foo', cb => {
      cb();
    });

    app.task('bar', cb => {
      cb();
    });

    app.task('default', ['foo', 'bar'], cb => {
      cb();
    });

    assert.equal(app.tasks.get('foo')[util.inspect.custom](), '<Task "foo">');
    assert.equal(app.tasks.get('bar')[util.inspect.custom](), '<Task "bar">');
    assert.equal(app.tasks.get('default')[util.inspect.custom](), '<Task "default" [foo, bar]>');
  });

  it('should run globbed dependencies before running the dependent task.', cb => {
    const actual = [];
    app.task('a-foo', cb => {
      actual.push('a-foo');
      cb();
    });

    app.task('a-bar', cb => {
      actual.push('a-bar');
      cb();
    });

    app.task('b-foo', cb => {
      actual.push('b-foo');
      cb();
    });

    app.task('b-bar', cb => {
      actual.push('b-bar');
      cb();
    });

    app.task('default', ['a-*'], cb => {
      actual.push('default');
      cb();
    });

    app.build(err => {
      if (err) return cb(err);
      assert.deepEqual(actual, ['a-foo', 'a-bar', 'default']);
      cb();
    });
  });

  it('should get the current task name from `this`', cb => {
    const actual = [];
    const tasks = [];

    const callback = function(next) {
      actual.push(this.name);
      next();
    };

    for (let i = 0; i < 10; i++) {
      tasks.push(String(i));
      app.task(String(i), callback);
    }

    app.build(tasks, err => {
      if (err) return cb(err);
      assert.equal(actual.length, 10);
      assert.deepEqual(actual, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
      cb();
    });
  });
});
