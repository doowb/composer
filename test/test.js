'use strict';

/* deps: mocha */
var assert = require('assert');
var bddStdin = require('bdd-stdin');

var Composer = require('../');
var noop = require('../lib/noop');
var composer;

describe('composer', function() {
  beforeEach(function() {
    composer = new Composer();
  });

  it('should throw an error when a name is not given for a task', function(done) {
    try {
      composer.task();
      done(new Error('Expected an error to be thrown'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'expected `name` to be a string');
      done();
    }
  });

  it('should register a task', function() {
    var fn = function(done) {
      done();
    };
    composer.task('default', fn);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.fn, fn);
  });

  it('should register a noop task when only name is given', function() {
    composer.task('default');
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.fn, noop);
  });

  it('should register a noop task when a name and an empty dependencies array is given', function() {
    composer.task('default', []);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.fn, noop);
  });

  it('should register a task with an array of named dependencies', function() {
    composer.task('default', ['foo', 'bar'], function(done) {
      done();
    });
    assert.equal(typeof composer.tasks.default, 'object');
    assert.deepEqual(composer.tasks.default.deps, ['foo', 'bar']);
  });

  it('should register a task with an array of function dependencies', function() {
    function baz(cb) { cb(); };
    baz.taskName = 'Baz';

    var deps = [
      'foo',
      function bar(cb) { cb(); },
      baz,
      function(cb) { cb(); }
    ];
    composer.task('default', deps, function(done) {
      done();
    });
    assert.equal(typeof composer.tasks.default, 'object');
    assert.deepEqual(composer.tasks.default.deps, ['foo', 'bar', 'Baz', '[anonymous (1)]']);
  });

  it('should register a task with a list of strings as dependencies', function() {
    composer.task('default', 'foo', 'bar', function(done) {
      done();
    });
    assert.equal(typeof composer.tasks.default, 'object');
    assert.deepEqual(composer.tasks.default.deps, ['foo', 'bar']);
  });

  it('should register a task as a noop function when only dependencies are given', function() {
    composer.task('default', ['foo', 'bar']);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.fn, noop);
  });

  it('should register a task with options as the second argument', function() {
    composer.task('default', {flow: 'parallel'}, ['foo', 'bar']);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.fn, noop);
    assert.equal(composer.tasks.default.options.flow, 'parallel');
  });

  it('should register a task as a prompt task', function() {
    composer.task('default', 'Run task?', 'foo');
    assert.equal(typeof composer.tasks.default, 'object');
  });

  it('should register a prompt task with options as the third argument', function() {
    composer.task('default', 'Run task?', {flow: 'parallel'}, ['foo', 'bar']);
    assert.equal(typeof composer.tasks.default, 'object');
    assert.equal(composer.tasks.default.options.flow, 'parallel');
  });

  it('should throw an error when a prompt task does not have a task specified to run', function(done) {
    try {
      composer.task('default', 'Run task?');
      done(new Error('Expected an error to be thrown'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'expected a task to be specified that will run when the confirmation is true');
      done();
    }
  });

  it('should throw an error when a prompt task as options but does not have a task specified to run', function(done) {
    try {
      composer.task('default', 'Run task?', {flow: 'parallel'});
      done(new Error('Expected an error to be thrown'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'expected a task to be specified that will run when the confirmation is true');
      done();
    }
  });

  it('should throw an error when a prompt task has too many arguments specified', function(done) {
    try {
      composer.task('default', 'Run task?', 'foo', 'bar', 'baz');
      done(new Error('Expected an error to be thrown'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'too many arguments passed to `.task`');
      done();
    }
  });

  it('should throw an error when a prompt task with options has too many arguments specified', function(done) {
    try {
      composer.task('default', 'Run task?', {flow: 'parallel'}, 'foo', 'bar', 'baz');
      done(new Error('Expected an error to be thrown'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'too many arguments passed to `.task`');
      done();
    }
  });

  it('should run a task', function(done) {
    var count = 0;
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

  it('should run a prompt task', function(done) {
    var results = [];

    // testing both yes and no in one test because `bddStdin` is causing some
    // weird issue when run in different tests
    composer.task('setup', function(cb) {
      bddStdin(['\n', 'n', '\n']);
      cb();
    });

    composer.task('confirm', 'Run task 1?', function(cb) {
      results.push('yes');
      cb();
    });

    composer.task('no-confirm', 'Run task 2?', function(cb) {
      results.push('yes');
      cb();
    }, function(cb) {
      results.push('no');
      cb();
    });

    composer.task('default', ['confirm', 'no-confirm']);

    composer.build(['setup', 'default'], function(err) {
      if (err) return done(err);
      assert.deepEqual(results, ['yes', 'no']);
      done();
    });
  });

  it('should run a task with options', function(done) {
    var count = 0;
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
    var count = 0;
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
    var count = 0;
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
    var output = [];
    function fn() {
      return function(cb) {
        output.push(`${this.name}`);
        cb();
      };
    }

    composer.task('foo', fn());
    composer.task('bar', {run: false}, fn());
    composer.task('baz', fn());
    composer.task('bang', {run: false}, fn());
    composer.task('beep', fn());
    composer.task('boop', fn());

    composer.task('default', ['foo', 'bar', 'baz', 'bang', 'beep', 'boop']);
    composer.build(function(err) {
      if (err) return done(err);
      assert.deepEqual(output, ['foo', 'baz', 'beep', 'boop']);
      done();
    });
  });

  it('should skip tasks when `run === false` (with deps skipped)', function(done) {
    var output = [];
    function fn() {
      return function(cb) {
        output.push(`${this.name}`);
        cb();
      };
    }

    composer.task('foo', fn());
    composer.task('bar', {run: false}, ['foo'], fn());
    composer.task('baz', ['bar'], fn());
    composer.task('bang', {run: false}, ['baz'], fn());
    composer.task('beep', ['bang'], fn());
    composer.task('boop', ['beep'], fn());

    composer.task('default', ['boop']);
    composer.build(function(err) {
      if (err) return done(err);
      assert.deepEqual(output, ['beep', 'boop']);
      done();
    });
  });

  it('should skip tasks when `run === false` (complex flow)', function(done) {
    var output = [];
    composer.task('foo', function(cb) {
      output.push(`${this.name}`);
      // disable running the "bar" task
      composer.tasks['bar'].options.run = false;
      cb();
    });
    composer.task('bar', function(cb) {
      output.push(`${this.name}`);
      cb();
    });
    composer.task('baz', function(cb) {
      output.push(`${this.name}`);
      // enable running the "bang" task
      composer.tasks['bang'].options.run = true;
      cb();
    });
    composer.task('bang', {run: false}, function(cb) {
      output.push(`${this.name}`);
      cb();
    });
    composer.task('beep', function(cb) {
      output.push(`${this.name}`);
      cb();
    });
    composer.task('boop', function(cb) {
      output.push(`${this.name}`);
      cb();
    });

    composer.task('default', ['foo', 'bar', 'baz', 'bang', 'beep', 'boop']);
    composer.build(function(err) {
      if (err) return done(err);
      assert.deepEqual(output, ['foo', 'baz', 'bang', 'beep', 'boop']);
      done();
    });
  });

  it('should throw an error when a task with unregistered dependencies is built', function(done) {
    var count = 0;
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
    var count = 0;
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

  it('should throw an error when `.build` is called without a callback function.', function() {
    try {
      composer.build('default');
      throw new Error('Expected an error to be thrown.');
    } catch (err) {
    }
  });

  it('should emit task events', function(done) {
    var events = [];
    composer.on('task:starting', function(task, run) {
      events.push('starting.' + task.name);
    });
    composer.on('task:finished', function(task, run) {
      events.push('finished.' + task.name);
    });
    composer.on('task:error', function(err) {
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
      assert.deepEqual(events, ['starting.default', 'starting.bar', 'starting.foo', 'finished.foo', 'finished.bar', 'finished.default']);
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
    var errors = 0;
    composer.on('task:error', function(err) {
      errors++;
      assert(err);
      assert.equal(err.message, 'in task "default": This is an error');
    });
    composer.task('default', function() {
      throw new Error('This is an error');
    });
    composer.build('default', function(err) {
      assert.equal(errors, 1);
      if (err) return done();
      done(new Error('Expected an error'));
    });
  });

  it('should emit build events', function(done) {
    var events = [];
    composer.on('starting', function(app, run) {
      events.push('starting.' + app._appname);
    });
    composer.on('finished', function(app, run) {
      events.push('finished.' + app._appname);
    });
    composer.on('error', function(err) {
      events.push('error.' + err.app._appname);
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
      assert.deepEqual(events, ['starting.composer', 'finished.composer']);
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

  it('should emit a build error event when an error is thrown in a task', function(done) {
    var errors = 0;
    composer.on('error', function(err) {
      errors++;
      assert(err);
      assert.equal(err.message, 'in task "default": This is an error');
    });
    composer.task('default', function() {
      throw new Error('This is an error');
    });
    composer.build('default', function(err) {
      assert.equal(errors, 1);
      if (err) return done();
      done(new Error('Expected an error'));
    });
  });

  it('should run dependencies before running the dependent task.', function(done) {
    var seq = [];
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
    composer.options = {
      inspectFn: false
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
    assert.equal(typeof composer.tasks.foo.inspect, 'undefined');
    assert.equal(typeof composer.tasks.bar.inspect, 'undefined');
    assert.equal(typeof composer.tasks.default.inspect, 'undefined');
  });

  it('should run globbed dependencies before running the dependent task.', function(done) {
    var seq = [];
    composer.task('a-foo', function(cb) {
      seq.push('a-foo');
      cb();
    });
    composer.task('a-bar', function(cb) {
      seq.push('a-bar');
      cb();
    });
    composer.task('b-foo', function(cb) {
      seq.push('b-foo');
      cb();
    });
    composer.task('b-bar', function(cb) {
      seq.push('b-bar');
      cb();
    });
    composer.task('default', ['a-*'], function(cb) {
      seq.push('default');
      cb();
    });

    composer.build(function(err) {
      if (err) return done(err);
      assert.deepEqual(seq, ['a-foo', 'a-bar', 'default']);
      done();
    });
  });

  it('should get the current task name from `this`', function(done) {
    var results = [];
    var fn = function(cb) {
      results.push(this.name);
      cb();
    };
    var tasks = [];
    for (var i = 0; i < 10; i++) {
      tasks.push('task-' + i);
      composer.task('task-' + i, fn);
    }
    composer.build(tasks, function(err) {
      if (err) return done(err);
      assert.equal(results.length, 10);
      assert.deepEqual(results, ['task-0', 'task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6', 'task-7', 'task-8', 'task-9']);
      done();
    });
  });

  it('should get the build history after a build', function(done) {
    var results = [];
    var fn = function(cb) {
      results.push(this.name);
      cb();
    };
    var tasks = [];
    for (var i = 0; i < 10; i++) {
      tasks.push('task-' + i);
      composer.task('task-' + i, fn);
    }
    composer.build(tasks, function(err) {
      if (err) return done(err);
      assert(composer.buildHistory.length > 0);
      assert.equal(results.length, 10);
      assert.deepEqual(results, ['task-0', 'task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6', 'task-7', 'task-8', 'task-9']);
      done();
    });
  });
});
