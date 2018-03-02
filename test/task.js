'use strict';

require('mocha');
const async = require('async');
const assert = require('assert');
const through = require('through2');
const Task = require('../lib/task');

describe('task', function() {
  it('should throw an error when Task is not instantiated', function() {
    assert.throws(() => Task(), /cannot be invoked without 'new'/);
  });

  it('should throw an error when nothing is passed to new Task', function() {
    assert.throws(() => new Task(), /expected/i);
  });

  it('should throw an error when `name` is not passed on `task`.', function() {
    assert.throws(() => new Task({}), /expected/i);
  });

  it('should create a new task with a given `name`', function() {
    const task = new Task({ name: 'default' });
    assert.equal(task.name, 'default');
  });

  it('should create a new task with a given task function', function() {
    const callback = cb => cb();
    const task = new Task({ name: 'default', callback: callback });
    assert.equal(task.callback, callback);
  });

  it('should create a new task with the given dependencies', function() {
    const task = new Task({ name: 'default', deps: ['foo', 'bar'] });
    assert.deepEqual(task.deps, ['foo', 'bar']);
  });

  it('should create a new task with deps from the `options` property', function() {
    const task = new Task({ name: 'default', options: { deps: ['foo', 'bar'] } });
    assert.deepEqual(task.deps, ['foo', 'bar']);
  });

  it('should run a task function when `.run` is called', function(done) {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({ name: 'default', callback: callback });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should skip a task function when `.options.run === false`', function(done) {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({ name: 'default', callback: callback, options: { run: false } });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 0);
      done();
    });
  });

  it('should skip a task function when `.options.skip` is the task name', function(done) {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({ name: 'foo', callback: callback, options: { skip: 'foo' } });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 0);
      done();
    });
  });

  it('should skip a task function when `.options.skip` is an array with the task name', function(done) {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({ name: 'foo', callback: callback, options: { skip: ['bar', 'baz', 'foo'] } });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 0);
      done();
    });
  });

  it('should not skip a task function when `.options.skip` is an array without the task name', function(done) {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({ name: 'foo', callback: callback, options: { skip: ['bar', 'baz'] } });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should run a task function that returns a stream when `.run` is called', function(done) {
    let count = 0;
    const callback = function() {
      const stream = through.obj(function(data, enc, next) {
        count++;
        next(null);
      });
      setImmediate(function() {
        stream.write(count);
        stream.end();
      });
      return stream;
    };

    const task = new Task({ name: 'default', callback: callback });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should run a task that returns a non stream when `.run` is called', function(done) {
    let count = 0;
    const callback = function(cb) {
      setImmediate(function() {
        count++;
        cb();
      });
      return count;
    };

    const task = new Task({ name: 'default', callback: callback });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should run a task using a noop when `.run` is called', function(done) {
    let count = 0;
    const callback = function(cb) {
      setImmediate(function() {
        count++;
        cb();
      });
      return count;
    };

    const app = {};
    app.tasks = {
      foo: new Task({ name: 'foo', callback: callback, app: app}),
      default: new Task({ name: 'default', deps: ['foo'], app: app})
    };

    app.tasks.default.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should cause an error if invalid deps are resolved `.run` is called', function(done) {
    let count = 0;
    const callback = function(cb) {
      setImmediate(function() {
        count++;
        cb();
      });
      return count;
    };

    const app = {};
    app.tasks = {
      foo: new Task({ name: 'foo', callback: callback, app: app}),
      default: new Task({ name: 'default', deps: ['foo', {foo: 'bar'}, {bang: 'baz'}], app: app})
    };

    app.tasks.default.run(function(err) {
      if (!err) return done(new Error('Expected an error'));
      assert.equal(count, 0);
      done();
    });
  });

  it('should emit a `starting` event when the task starts running', function(done) {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };
    const task = new Task({ name: 'default', callback: callback });
    task.on('starting', function(t, run) {
      count++;
    });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 2);
      done();
    });
  });

  it('should emit a `finished` event when the task finishes running', function(done) {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };
    const task = new Task({ name: 'default', callback: callback });
    task.on('finished', function(t, run) {
      count++;
    });
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 2);
      done();
    });
  });

  it('should emit an `error` event when there is an error during task execution', function(done) {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb(new Error('Expected error'));
    };
    const task = new Task({ name: 'default', callback: callback });
    task.on('error', function(err) {
      if (err) count++;
    });
    task.run(function(err) {
      if (!err) return done(new Error('Expected an error to be thrown.'));
      assert.equal(count, 2);
      done();
    });
  });

  it('should have the current task set as `this` inside the function', function(cb) {
    const results = [];
    const tasks = [];

    const callback = function(next) {
      results.push(this.name);
      next();
    };

    for (let i = 0; i < 10; i++) {
      tasks.push(new Task({ name: 'task-' + i, callback: callback }));
    }

    async.eachSeries(tasks, function(task, next) {
      task.run(next);
    }, function(err) {
      if (err) return cb(err);
      assert.equal(results.length, 10);
      assert.deepEqual(results, [
        'task-0',
        'task-1',
        'task-2',
        'task-3',
        'task-4',
        'task-5',
        'task-6',
        'task-7',
        'task-8',
        'task-9'
      ]);
      cb();
    });
  });
});
