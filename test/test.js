'use strict';

/* deps: mocha */
var assert = require('assert');

var Composer = require('../');
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

  it('should register a task with an array of named dependencies', function () {
    composer.task('default', ['foo', 'bar'], function (done) {
      done();
    });
    assert.equal(typeof composer.tasks.default, 'object');
    assert.deepEqual(composer.tasks.default.deps, ['foo', 'bar']);
  });

  it('should register a task with an array of function dependencies', function () {
    function baz(cb) { cb(); };
    baz.taskName = 'Baz';

    var deps = [
      'foo',
      function bar(cb) { cb(); },
      baz,
      function (cb) { cb(); }
    ];
    composer.task('default', deps, function (done) {
      done();
    });
    assert.equal(typeof composer.tasks.default, 'object');
    assert.deepEqual(composer.tasks.default.deps, ['foo', 'bar', 'Baz', '[anonymous (1)]']);
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

    composer.build('default', function (err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should throw an error when a task with unregistered dependencies is built', function (done) {
    var count = 0;
    composer.task('default', ['foo', 'bar'], function (cb) {
      count++;
      cb();
    });

    composer.build('default', function (err) {
      if (!err) return done(new Error('Expected an error to be thrown.'));
      assert.equal(count, 0);
      done();
    });
  });

  it('should throw an error when `.build` is called without a callback function.', function () {
    try {
      composer.build('default');
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
    composer.build('default', function (err) {
      if (err) return done(err);
      assert.deepEqual(events, ['starting.default','starting.bar','starting.foo','finished.foo','finished.bar','finished.default']);
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
    composer.build('default', function (err) {
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
    composer.build('default', function (err) {
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

    composer.build('default', function (err) {
      if (err) return done(err);
      assert.deepEqual(seq, ['foo', 'bar', 'default']);
      done();
    });
  });

  it('should have a session with the current task value set', function (done) {
    var results = [];
    var fn = function (cb) {
      results.push(this.session.get('task').name);
      cb();
    };
    var tasks = [];
    for (var i = 0; i < 10; i++) {
      tasks.push('task-' + i);
      composer.task('task-' + i, fn);
    }

    composer.build(tasks, function (err) {
      if (err) return done(err);
      assert.equal(results.length, 10);
      assert.deepEqual(results,['task-0', 'task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6', 'task-7', 'task-8', 'task-9']);
      done();
    });
  });

  it('should get the current task from the app session', function (done) {
    var results = [];
    var fn = function (cb) {
      results.push(composer.task().name);
      cb();
    };
    var tasks = [];
    for (var i = 0; i < 10; i++) {
      tasks.push('task-' + i);
      composer.task('task-' + i, fn);
    }
    composer.build(tasks, function (err) {
      if (err) return done(err);
      assert.equal(results.length, 10);
      assert.deepEqual(results,['task-0', 'task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6', 'task-7', 'task-8', 'task-9']);
      done();
    });
  });

  it('should create a session with a custom name', function (done) {
    var composer = new Composer('custom-name');
    var session = require('../lib/session')('custom-name');

    var results = [];

    var dep = function (cb) {
      var name = this.session.get('task').name;
      session.set('secret', 'Shhhh... ' + name);
      cb();
    }

    var task = function (cb) {
      results.push(this.session.get('secret'));
      cb();
    }

    var tasks = [];
    for (var i = 0; i < 10; i++) {
      tasks.push('task-' + i);
      composer.task('dep-' + i, dep);
      composer.task('task-' + i, ['dep-' + i], task);
    }

    composer.build(tasks, function (err) {
      if (err) return done(err);
      assert.equal(results.length, 10);
      assert.deepEqual(results,['Shhhh... dep-0', 'Shhhh... dep-1', 'Shhhh... dep-2', 'Shhhh... dep-3', 'Shhhh... dep-4', 'Shhhh... dep-5', 'Shhhh... dep-6', 'Shhhh... dep-7', 'Shhhh... dep-8', 'Shhhh... dep-9']);
      done();
    })
  });
});
