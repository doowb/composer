'use strict';

require('mocha');
const assert = require('assert');
const Composer = require('..');
let app;

describe('composer', function() {
  beforeEach(function() {
    app = new Composer();
  });

  it('should throw an error when a name is not given for a task', function() {
    assert.throws(() => app.task(), /expected/);
  });

  it('should disable inspect function on tasks.', function() {
    const enable = app.disableInspect();

    app.task('foo', cb => cb());
    app.task('bar', cb => cb());
    app.task('default', ['foo', 'bar'], cb => cb());

    assert.equal(typeof app.tasks.foo.inspect, 'undefined');
    assert.equal(typeof app.tasks.bar.inspect, 'undefined');
    assert.equal(typeof app.tasks.default.inspect, 'undefined');
    enable();
  });

  it('should register a task', function() {
    app.task('default', () => {});
    assert(app.tasks.default);
    assert.equal(typeof app.tasks.default, 'object');
    assert.equal(app.tasks.default.callback.name, '');
  });

  it('should register a noop task when only name is given', function() {
    app.task('default');
    assert(app.tasks.default);
    assert.equal(typeof app.tasks.default, 'object');
    assert.equal(typeof app.tasks.default.callback, 'function');
  });

  it('should register a noop task when a name and an empty dependencies array is given', function() {
    app.task('default', []);
    assert(app.tasks.default);
    assert.equal(typeof app.tasks.default, 'object');
    assert.equal(typeof app.tasks.default.callback, 'function');
  });

  it('should register a task with an array of named dependencies', function() {
    app.task('default', ['foo', 'bar'], cb => cb());
    assert(app.tasks.default);
    assert.equal(typeof app.tasks.default, 'object');
    assert.deepEqual(app.tasks.default.deps, ['foo', 'bar']);
  });

  it('should register a task with a list of strings as dependencies', function() {
    app.task('default', 'foo', 'bar', cb => cb());
    assert.equal(typeof app.tasks.default, 'object');
    assert.deepEqual(app.tasks.default.deps, ['foo', 'bar']);
  });

  it('should register a task as a noop function when only dependencies are given', function() {
    app.task('default', ['foo', 'bar']);
    assert.equal(typeof app.tasks.default, 'object');
    assert.equal(typeof app.tasks.default.callback, 'function');
  });

  it('should register a task with options as the second argument', function() {
    app.task('default', {flow: 'parallel'}, ['foo', 'bar']);
    assert.equal(typeof app.tasks.default, 'object');
    assert.equal(typeof app.tasks.default.callback, 'function');
    assert.equal(app.tasks.default.options.flow, 'parallel');
  });

  it('should register a task as a prompt task', function() {
    app.task('default', 'Run task?', 'foo');
    assert.equal(typeof app.tasks.default, 'object');
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
    app.task('default', {silent: false}, function(cb) {
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

  it('should run a task with additional options', function(cb) {
    let count = 0;
    app.task('default', {silent: false}, function(cb) {
      assert.equal(this.options.silent, true);
      assert.equal(this.options.foo, 'bar');
      count++;
      cb();
    });

    app.build('default', {silent: true, foo: 'bar'}, function(err) {
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
      app.tasks['bar'].options.run = false;
      cb();
    });

    app.task('bar', function(cb) {
      expected.push(this.name);
      cb();
    });

    app.task('baz', function(cb) {
      expected.push(this.name);
      // enable running the "bang" task
      app.tasks['bang'].options.run = true;
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

  it('should throw an error when a task with unregistered dependencies is run', function(cb) {
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
      if (err.build) {
        return;
      }
      events.push('error.' + err.task.name);
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

  it('should emit an error event when an error is passed back in a task', function(cb) {
    app.on('task:error', function(err) {
      assert(err);
      assert.equal(err.message, 'in task "default": This is an error');
    });

    app.task('default', function(cb) {
      return cb(new Error('This is an error'));
    });

    app.build('default', function(err) {
      if (err) return cb();
      cb(new Error('Expected an error'));
    });
  });

  it('should emit build events', function() {
    const events = [];

    app.on('build', function(build) {
      events.push(build.status);
    });

    app.on('error', function() {
      events.push('error');
    });

    app.task('foo', cb => cb());
    app.task('bar', ['foo'], cb => cb());
    app.task('default', ['bar']);

    return app.build('default')
      .then(() => {
        assert.deepEqual(events, ['starting', 'finished']);
      });
  });

  it('should emit a build error event when an error is passed back in a task', function() {
    let count = 0;

    app.on('error', function() {
      count++;
    });

    app.task('default', function(cb) {
      cb(new Error('This is an error'));
    });

    return app.build('default')
      .then(() => {
        throw new Error('exected an error');
      })
      .catch(() => {
        assert.equal(count, 1);
      });
  });

  it('should emit an error event when an error is thrown in a task', function() {
    let count = 0;

    app.on('error', function() {
      count++;
    });

    app.task('default', function() {
      throw new Error('This is an error');
    });

    return app.build('default')
      .then(() => {
        throw new Error('exected an error');
      })
      .catch(() => {
        assert.equal(count, 1);
      });
  });

  it('should run dependencies before running the dependent task.', function() {
    const events = [];

    app.task('foo', function(cb) {
      events.push('foo');
      cb();
    });

    app.task('bar', function(cb) {
      events.push('bar');
      cb();
    });

    app.task('default', ['foo', 'bar'], function(cb) {
      events.push('default');
      cb();
    });

    return app.build('default')
      .then(() => {
        assert.deepEqual(events, ['foo', 'bar', 'default']);
      });
  });

  it('should add inspect function to tasks.', function() {
    app.task('foo', cb => cb());
    app.task('bar', cb => cb());
    app.task('default', ['foo', 'bar'], cb => cb());

    assert.equal(app.tasks.foo.inspect(), '<Task "foo" deps: []>');
    assert.equal(app.tasks.bar.inspect(), '<Task "bar" deps: []>');
    assert.equal(app.tasks.default.inspect(), '<Task "default" deps: [foo, bar]>');
  });

  it('should add custom inspect function to tasks.', function() {
    app.options = {
      inspectFn: function(task) {
        return '<Task "'
          + task.name + '"'
          + (task.deps.length ? ' [' + task.deps.join(', ') + ']' : '')
          + '>';
      }
    };

    app.task('foo', cb => cb());
    app.task('bar', cb => cb());
    app.task('default', ['foo', 'bar'], cb => cb());

    assert.equal(app.tasks.foo.inspect(), '<Task "foo">');
    assert.equal(app.tasks.bar.inspect(), '<Task "bar">');
    assert.equal(app.tasks.default.inspect(), '<Task "default" [foo, bar]>');
  });

  it('should disable inspect function on tasks.', function() {
    app.options = { inspectFn: false };

    app.task('foo', cb => cb());
    app.task('bar', cb => cb());
    app.task('default', ['foo', 'bar'], cb => cb());

    assert.equal(typeof app.tasks.foo.inspect, 'undefined');
    assert.equal(typeof app.tasks.bar.inspect, 'undefined');
    assert.equal(typeof app.tasks.default.inspect, 'undefined');
  });

  it('should run globbed dependencies before running the dependent task.', function() {
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

    return app.build('default')
      .then(() => {
        assert.deepEqual(events, ['bar', 'baz', 'default']);
      });
  });

  it('should get the current task name from `this`', function() {
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

    return app.build(tasks)
      .then(() => {
        assert.deepEqual(names, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
      });
  });
});
