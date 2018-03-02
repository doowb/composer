'use strict';

require('mocha');
const assert = require('assert');
const Composer = require('../');
let composer;

describe('composer', function() {
  beforeEach(function() {
    composer = new Composer();
  });

  it('should throw an error when a name is not given for a task', function() {
    assert.throws(() => composer.task(), /expected/);
  });

  it('should register a task', function() {
    composer.task('default', () => {});
    assert(composer.tasks.default);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.callback.name, '');
  });

  it('should register a noop task when only name is given', function() {
    composer.task('default');
    assert(composer.tasks.default);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.callback.name, 'callback');
  });

  it('should register a noop task when a name and an empty dependencies array is given', function() {
    composer.task('default', []);
    assert(composer.tasks.default);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.callback.name, 'callback');
  });

  it('should register a task with an array of named dependencies', function() {
    composer.task('default', ['foo', 'bar'], done => done());
    assert(composer.tasks.default);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.deepEqual(composer.tasks.default.deps, ['foo', 'bar']);
  });

  it('should register a task with an array of function dependencies', function() {
    const bar = cb => cb();
    const Baz = cb => cb();
    Baz.taskName = 'Baz';

    const deps = ['foo', bar, Baz, cb => cb()];
    composer.task('default', deps, cb => cb());

    assert.equal(typeof composer.tasks.default, 'object');
    assert.deepEqual(composer.tasks.default.deps, ['foo', 'bar', 'Baz', '[anonymous (1)]']);
  });

  it('should register a task with a list of strings as dependencies', function() {
    composer.task('default', 'foo', 'bar', cb => cb());
    assert.equal(typeof composer.tasks.default, 'object');
    assert.deepEqual(composer.tasks.default.deps, ['foo', 'bar']);
  });

  it('should register a task as a noop function when only dependencies are given', function() {
    composer.task('default', ['foo', 'bar']);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.callback.name, 'callback');
  });

  it('should register a task with options as the second argument', function() {
    composer.task('default', {flow: 'parallel'}, ['foo', 'bar']);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.callback.name, 'callback');
    assert.equal(composer.tasks.default.options.flow, 'parallel');
  });

  it('should register a task as a prompt task', function() {
    composer.task('default', 'Run task?', 'foo');
    assert.equal(typeof composer.tasks.default, 'object');
  });

  it('should run a task', function(done) {
    let count = 0;
    composer.task('default', function(cb) {
      count++;
      cb();
    });

    composer.build('default', function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should run a task and return a promise', function() {
    let count = 0;
    composer.task('default', function(cb) {
      count++;
      cb();
    });

    return composer.build('default')
      .then(function() {
        assert.equal(count, 1);
      });
  });

  it('should run a task with options', function(done) {
    let count = 0;
    composer.task('default', {silent: false}, function(cb) {
      assert.equal(this.options.silent, false);
      count++;
      cb();
    });

    composer.build('default', function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should run a task with additional options', function(done) {
    let count = 0;
    composer.task('default', {silent: false}, function(cb) {
      assert.equal(this.options.silent, true);
      assert.equal(this.options.foo, 'bar');
      count++;
      cb();
    });

    composer.build('default', {silent: true, foo: 'bar'}, function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should run the `default` task when no task is given', function(done) {
    let count = 0;
    composer.task('default', function(cb) {
      count++;
      cb();
    });

    composer.build(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should skip tasks when `run === false`', function(done) {
    const expected = [];
    function callback() {
      return function(cb) {
        expected.push(this.name);
        cb();
      };
    }

    composer.task('foo', callback());
    composer.task('bar', {run: false}, callback());
    composer.task('baz', callback());
    composer.task('bang', {run: false}, callback());
    composer.task('beep', callback());
    composer.task('boop', callback());

    composer.task('default', ['foo', 'bar', 'baz', 'bang', 'beep', 'boop']);
    composer.build(function(err) {
      if (err) return done(err);
      assert.deepEqual(expected, ['foo', 'baz', 'beep', 'boop']);
      done();
    });
  });

  it('should skip tasks when `run === false` (with deps skipped)', function(done) {
    const expected = [];
    function callback() {
      return function(cb) {
        expected.push(this.name);
        cb();
      };
    }

    composer.task('foo', callback());
    composer.task('bar', {run: false}, ['foo'], callback());
    composer.task('baz', ['bar'], callback());
    composer.task('bang', {run: false}, ['baz'], callback());
    composer.task('beep', ['bang'], callback());
    composer.task('boop', ['beep'], callback());

    composer.task('default', ['boop']);
    composer.build(function(err) {
      if (err) return done(err);
      assert.deepEqual(expected, ['beep', 'boop']);
      done();
    });
  });

  it('should skip tasks when `run === false` (complex flow)', function(done) {
    const expected = [];

    composer.task('foo', function(cb) {
      expected.push(this.name);
      // disable running the "bar" task
      composer.tasks['bar'].options.run = false;
      cb();
    });

    composer.task('bar', function(cb) {
      expected.push(this.name);
      cb();
    });

    composer.task('baz', function(cb) {
      expected.push(this.name);
      // enable running the "bang" task
      composer.tasks['bang'].options.run = true;
      cb();
    });

    composer.task('bang', {run: false}, function(cb) {
      expected.push(this.name);
      cb();
    });

    composer.task('beep', function(cb) {
      expected.push(this.name);
      cb();
    });

    composer.task('boop', function(cb) {
      expected.push(this.name);
      cb();
    });

    composer.task('default', ['foo', 'bar', 'baz', 'bang', 'beep', 'boop']);
    composer.build(function(err) {
      if (err) return done(err);
      assert.deepEqual(expected, ['foo', 'baz', 'bang', 'beep', 'boop']);
      done();
    });
  });

  it('should throw an error when a task with unregistered dependencies is built', function(done) {
    let count = 0;
    composer.task('default', ['foo', 'bar'], function(cb) {
      count++;
      cb();
    });

    composer.build('default', function(err) {
      if (!err) return done(new Error('Expected an error to be thrown.'));
      assert.equal(count, 0);
      done();
    });
  });

  it('should throw an error when a task with globbed dependencies cannot be found', function(done) {
    let count = 0;
    composer.task('default', ['a-*'], function(cb) {
      count++;
      cb();
    });

    composer.build('default', function(err) {
      if (!err) return done(new Error('Expected an error to be thrown.'));
      assert.equal(count, 0);
      done();
    });
  });

  it('should emit task events', function(done) {
    const events = [];
    composer.on('task', function(task) {
      events.push(task.status + '.' + task.name);
    });

    composer.on('error', function(err) {
      if (err.build) {
        return;
      }
      events.push('error.' + err.task.name);
    });

    composer.task('foo', function(cb) {
      cb();
    });

    composer.task('bar', ['foo'], function(cb) {
      cb();
    });

    composer.task('default', ['bar']);
    composer.build('default', function(err) {
      if (err) return done(err);
      assert.deepEqual(events, [
        'register.foo',
        'register.bar',
        'register.default',
        'starting.default',
        'starting.bar',
        'starting.foo',
        'finished.foo',
        'finished.bar',
        'finished.default'
      ]);
      done();
    });
  });

  it('should emit an error event when an error is passed back in a task', function(done) {
    composer.on('task:error', function(err) {
      assert(err);
      assert.equal(err.message, 'in task "default": This is an error');
    });

    composer.task('default', function(cb) {
      return cb(new Error('This is an error'));
    });

    composer.build('default', function(err) {
      if (err) return done();
      done(new Error('Expected an error'));
    });
  });

  it('should emit an error event when an error is thrown in a task', function(done) {
    let count = 0;
    composer.on('error', function(err) {
      assert(err);
      if (err.build) {
        return;
      }
      count++;
      assert.equal(err.message, 'in task "default": This is an error');
    });

    composer.task('default', function() {
      throw new Error('This is an error');
    });

    composer.build('default', function(err) {
      assert.equal(count, 1);
      if (err) return done();
      done(new Error('Expected an error'));
    });
  });

  it('should emit build events', function(done) {
    const events = [];
    composer.on('build', function(build) {
      events.push('build:' + build.status);
    });

    composer.on('error', function(err) {
      if (err.build) {
        events.push('error');
      }
    });

    composer.task('foo', cb => cb());
    composer.task('bar', ['foo'], cb => cb());

    composer.task('default', ['bar']);
    composer.build('default', function(err) {
      if (err) return done(err);
      assert.deepEqual(events, ['build:starting', 'build:finished']);
      done();
    });
  });

  it('should emit a build error event when an error is passed back in a task', function(done) {
    composer.on('error', function(err) {
      assert(err);
      assert.equal(err.message, 'in task "default": This is an error');
    });

    composer.task('default', function(cb) {
      return cb(new Error('This is an error'));
    });

    composer.build('default', function(err) {
      if (err) return done();
      done(new Error('Expected an error'));
    });
  });

  it('should emit a build error event when an error is passed back in a task (with promise)', function(done) {
    composer.on('error', function(err) {
      assert(err);
      assert.equal(err.message, 'in task "default": This is an error');
    });

    composer.task('default', function(cb) {
      cb(new Error('This is an error'));
    });

    composer.build('default')
      .then(() => done(new Error('Expected an error')))
      .catch(() => done());
  });

  it('should emit a build error event when an error is thrown in a task', function(done) {
    let count = 0;

    composer.on('error', function(err) {
      assert(err);
      if (!err.build) {
        return;
      }
      count++;
      assert.equal(err.message, 'in task "default": This is an error');
    });

    composer.task('default', function() {
      throw new Error('This is an error');
    });

    composer.build('default', function(err) {
      assert.equal(count, 1);
      if (err) return done();
      done(new Error('Expected an error'));
    });
  });

  it('should run dependencies before running the dependent task.', function(done) {
    const seq = [];
    composer.task('foo', function(cb) {
      seq.push('foo');
      cb();
    });

    composer.task('bar', function(cb) {
      seq.push('bar');
      cb();
    });

    composer.task('default', ['foo', 'bar'], function(cb) {
      seq.push('default');
      cb();
    });

    composer.build('default', function(err) {
      if (err) return done(err);
      assert.deepEqual(seq, ['foo', 'bar', 'default']);
      done();
    });
  });

  it('should add inspect function to tasks.', function() {
    composer.task('foo', function(cb) {
      cb();
    });

    composer.task('bar', function(cb) {
      cb();
    });

    composer.task('default', ['foo', 'bar'], function(cb) {
      cb();
    });
    assert.equal(composer.tasks.foo.inspect(), '<Task "foo" deps: []>');
    assert.equal(composer.tasks.bar.inspect(), '<Task "bar" deps: []>');
    assert.equal(composer.tasks.default.inspect(), '<Task "default" deps: [foo, bar]>');
  });

  it('should add custom inspect function to tasks.', function() {
    composer.options = {
      inspectFn: function(task) {
        return '<Task "' + task.name + '"' + (task.options.deps.length ? ' [' + task.options.deps.join(', ') + ']' : '') + '>';
      }
    };
    composer.task('foo', function(cb) {
      cb();
    });

    composer.task('bar', function(cb) {
      cb();
    });

    composer.task('default', ['foo', 'bar'], function(cb) {
      cb();
    });
    assert.equal(composer.tasks.foo.inspect(), '<Task "foo">');
    assert.equal(composer.tasks.bar.inspect(), '<Task "bar">');
    assert.equal(composer.tasks.default.inspect(), '<Task "default" [foo, bar]>');
  });

  it('should disable inspect function on tasks.', function() {
    composer.options = { inspectFn: false };

    composer.task('foo', function(cb) {
      cb();
    });

    composer.task('bar', function(cb) {
      cb();
    });

    composer.task('default', ['foo', 'bar'], function(cb) {
      cb();
    });

    assert.equal(typeof composer.tasks.foo.inspect, 'undefined');
    assert.equal(typeof composer.tasks.bar.inspect, 'undefined');
    assert.equal(typeof composer.tasks.default.inspect, 'undefined');
  });

  it('should run globbed dependencies before running the dependent task.', function(done) {
    const tasks = [];
    composer.task('a-foo', function(cb) {
      tasks.push('a-foo');
      cb();
    });

    composer.task('a-bar', function(cb) {
      tasks.push('a-bar');
      cb();
    });

    composer.task('b-foo', function(cb) {
      tasks.push('b-foo');
      cb();
    });

    composer.task('b-bar', function(cb) {
      tasks.push('b-bar');
      cb();
    });

    composer.task('default', ['a-*'], function(cb) {
      tasks.push('default');
      cb();
    });

    composer.build(function(err) {
      if (err) return done(err);
      assert.deepEqual(tasks, ['a-foo', 'a-bar', 'default']);
      done();
    });
  });

  it('should get the current task name from `this`', function(done) {
    const results = [];
    const tasks = [];

    const callback = function(cb) {
      results.push(this.name);
      cb();
    };

    for (let i = 0; i < 10; i++) {
      tasks.push('task-' + i);
      composer.task('task-' + i, callback);
    }

    composer.build(tasks, function(err) {
      if (err) return done(err);
      assert.equal(results.length, 10);
      assert.deepEqual(results, ['task-0', 'task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6', 'task-7', 'task-8', 'task-9']);
      done();
    });
  });
});

// version regex from kind-of tests
// https://github.com/jonschlinkert/kind-of/blob/19fa8aba91e84ed7da93ebabb3164b00cea9a954/test/test.js#L7
const version = process.version.match(/^v(\d+)\.(\d+)\.(\d+)/);
if (version[1] >= 4) {
  require('./es2015');
}
