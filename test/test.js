'use strict';

require('mocha');
const assert = require('assert');
const util = require('util');
const Composer = require('..');
let app;

describe('composer', () => {
  beforeEach(() => {
    app = new Composer();
  });

  it('should throw an error when a name is not given for a task', () => {
    assert.throws(() => app.task(), /expected/);
  });

  it('should expose static methods', () => {
    assert(Composer.create);
    assert(Composer.isGenerator);
  });

  it('should register a task', () => {
    app.task('default', () => {});
    assert(app.tasks.get('default'));
    assert.equal(typeof app.tasks.get('default'), 'object');
    assert.equal(app.tasks.get('default').callback.name, '');
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

  it('should register a task with a list of strings as dependencies', () => {
    app.task('default', 'foo', 'bar', cb => cb());
    assert.equal(typeof app.tasks.get('default'), 'object');
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

  it('should register a task as a prompt task', () => {
    app.task('default', 'Run task?', 'foo');
    assert.equal(typeof app.tasks.get('default'), 'object');
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

    return app.build('default').then(() => {
      assert.equal(count, 1);
    });
  });

  it('should run a task with options', cb => {
    let count = 0;
    app.task('default', { silent: false }, function(cb) {
      assert.equal(this.options.silent, false);
      count++;
      cb();
    });

    app.build('default', err => {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should run a task with additional options', cb => {
    let count = 0;
    app.task('default', { silent: false }, function(cb) {
      assert.equal(this.options.silent, true);
      assert.equal(this.options.foo, 'bar');
      count++;
      cb();
    });

    app.build('default', { silent: true, foo: 'bar' }, err => {
      if (err) return cb(err);
      assert.equal(count, 1);
      cb();
    });
  });

  it('should run the `default` task when no task is given', cb => {
    let count = 0;
    app.task('default', cb => {
      count++;
      cb();
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
      return function(cb) {
        expected.push(this.name);
        cb();
      };
    }

    app.task('foo', callback());
    app.task('bar', { run: false }, callback());
    app.task('baz', callback());
    app.task('bang', { run: false }, callback());
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

    app.task('bang', { run: false }, function(next) {
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

  it('should throw an error when a task with unregistered dependencies is run', cb => {
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
    app.on('task', function(task) {
      events.push(task.status + '.' + task.name);
    });

    app.on('error', err => {
      if (err.build) {
        return;
      }
      events.push('error.' + err.task.name);
    });

    app.task('foo', cb => cb());

    app.task('bar', ['foo'], cb => cb());

    app.task('default', ['bar']);
    app.build('default', err => {
      if (err) return cb(err);
      assert.deepEqual(events, [
        'starting.default',
        'starting.bar',
        'starting.foo',
        'finished.foo',
        'finished.bar',
        'finished.default'
      ]);
      cb();
    });
  });

  it('-should emit an error event when an error is passed back in a task', cb => {
    const errors = [];
    app.on('error', err => {
      errors.push(err);
    });

    app.task('default', next => {
      next(new Error('This is an error'));
    });

    app.build('default', err => {
      assert(err);
      assert.equal(errors.length, 1);
      cb();
    });
  });

  it('should emit build events', () => {
    const events = [];

    app.on('build', function(build) {
      events.push(build.status);
    });

    app.on('error', () => {
      events.push('error');
    });

    app.task('foo', cb => cb());
    app.task('bar', ['foo'], cb => cb());
    app.task('default', ['bar']);

    return app.build('default').then(() => {
      assert.deepEqual(events, ['starting', 'finished']);
    });
  });

  it('should emit a build error event when an error is passed back in a task', () => {
    let count = 0;

    app.on('error', () => {
      count++;
    });

    app.task('default', cb => {
      cb(new Error('This is an error'));
    });

    return app
      .build('default')
      .then(() => {
        throw new Error('exected an error');
      })
      .catch(() => {
        assert.equal(count, 1);
      });
  });

  it('should stop build and return errors when thrown in a task', () => {
    let count = 0;

    app.task('foo', () => {
      throw new Error('This is an error');
    });

    app.task('bar', () => {
      count++;
    });

    return app.build(['foo', 'bar']).catch(err => {
      assert(err);
      assert.equal(count, 0);
    });
  });

  it('should emit an error event when an error is thrown in a task', () => {
    let count = 0;

    app.on('error', () => {
      count++;
    });

    app.task('default', () => {
      throw new Error('This is an error');
    });

    return app
      .build('default')
      .then(() => {
        throw new Error('exected an error');
      })
      .catch(() => {
        assert.equal(count, 1);
      });
  });

  it('should run dependencies before running the dependent task.', () => {
    const events = [];

    app.task('foo', cb => {
      events.push('foo');
      cb();
    });

    app.task('bar', cb => {
      events.push('bar');
      cb();
    });

    app.task('default', ['foo', 'bar'], cb => {
      events.push('default');
      cb();
    });

    return app.build('default').then(() => {
      assert.deepEqual(events, ['foo', 'bar', 'default']);
    });
  });

  it('should add inspect function to tasks.', () => {
    app.task('foo', cb => cb());
    app.task('bar', cb => cb());
    app.task('default', ['foo', 'bar'], cb => cb());

    assert.equal(app.tasks.get('foo')[util.inspect.custom](), '<Task "foo" deps: []>');
    assert.equal(app.tasks.get('bar')[util.inspect.custom](), '<Task "bar" deps: []>');
    assert.equal(app.tasks.get('default')[util.inspect.custom](), '<Task "default" deps: [foo, bar]>');
  });

  it('should disable inspect function on tasks.', () => {
    app.options = { inspectFn: false };

    app.task('foo', cb => cb());
    app.task('bar', cb => cb());
    app.task('default', ['foo', 'bar'], cb => cb());

    assert.equal(typeof app.tasks.get('foo').inspect, 'undefined');
    assert.equal(typeof app.tasks.get('bar').inspect, 'undefined');
    assert.equal(typeof app.tasks.get('default').inspect, 'undefined');
  });

  it('should run globbed dependencies before running the dependent task.', () => {
    const events = [];
    const task = function(cb) {
      events.push(this.name);
      cb();
    };

    app.task('foo', task);
    app.task('bar', task);
    app.task('baz', task);
    app.task('qux', task);
    app.task('default', ['b*'], task);

    return app.build('default').then(() => {
      assert.deepEqual(events, ['bar', 'baz', 'default']);
    });
  });

  it('should get the current task name from `this`', () => {
    const names = [];
    const tasks = [];

    const callback = function(cb) {
      names.push(this.name);
      cb();
    };

    for (let i = 0; i < 10; i++) {
      tasks.push(String(i));
      app.task(String(i), callback);
    }

    return app.build(tasks).then(() => {
      assert.deepEqual(names, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
    });
  });
});
