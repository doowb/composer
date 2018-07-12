'use strict';

require('mocha');
const assert = require('assert');
const through = require('through2');
const Task = require('../lib/task');

describe('task', () => {
  it('should throw an error when Task is not instantiated', () => {
    assert.throws(() => Task(), /cannot be invoked without 'new'/);
  });

  it('should throw an error when nothing is passed to new Task', () => {
    assert.throws(() => new Task(), /expected/i);
  });

  it('should throw an error when `name` is not passed on `task`.', () => {
    assert.throws(() => new Task({}), /expected/i);
  });

  it('should create a new task with a given `name`', () => {
    const task = new Task({ name: 'default' });
    assert.equal(task.name, 'default');
  });

  it('should create a new task with a given task function', () => {
    const callback = cb => cb();
    const task = new Task({ name: 'default', callback });
    assert.equal(task.callback, callback);
  });

  it('should create a new task with the given dependencies', () => {
    const task = new Task({ name: 'default', deps: ['foo', 'bar'] });
    assert.deepEqual(task.deps, ['foo', 'bar']);
  });

  it('should create a new task with deps from the `options` property', () => {
    const task = new Task({ name: 'default', options: { deps: ['foo', 'bar'] } });
    assert.deepEqual(task.deps, ['foo', 'bar']);
  });

  it('should run a task function when `.run` is called', () => {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({ name: 'default', callback });
    const run = task.run();
    return run()
      .then(() => {
        assert.equal(count, 1);
      });
  });

  it('should run a task function that returns a promise when `.run` is called', () => {
    let count = 0;
    const callback = function() {
      return new Promise(function(resolve) {
        setImmediate(() => {
          count++;
          resolve();
        });
      });
    };

    const task = new Task({ name: 'default', callback });
    const run = task.run();
    return run()
      .then(() => {
        assert.equal(count, 1);
      });
  });

  it('should skip a task function when `.options.run === false`', () => {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({ name: 'default', callback, options: { run: false } });
    const run = task.run();

    return run()
      .then(() => {
        assert.equal(count, 0);
      });
  });
  it('should skip a task function when `.options.skip` is the task name', () => {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({
      name: 'foo',
      callback,
      options: { skip: 'foo' }
    });

    const run = task.run();
    return run().then(() => {
      assert.equal(count, 0);
    });
  });

  it('should skip a task function when `.options.skip` is an array with the task name', () => {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({
      name: 'foo',
      callback,
      options: { skip: ['bar', 'baz', 'foo'] }
    });

    const run = task.run();
    return run().then(() => {
      assert.equal(count, 0);
    });
  });

  it('should not skip a task function when `.options.skip` is an array without the task name', () => {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({name: 'foo', callback, options: { skip: ['bar', 'baz'] } });
    const run = task.run();

    return run()
      .then(() => {
        assert.equal(count, 1);
      });
  });

  it('should run a task function that returns a stream when `.run` is called', () => {
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

    const task = new Task({ name: 'default', callback });
    const run = task.run();

    return run()
      .then(() => {
        assert.equal(count, 1);
      });
  });

  it('should run a task that returns a non-stream when `.run` is called', () => {
    let count = 0;
    const callback = function(cb) {
      setImmediate(function() {
        count++;
        cb();
      });
      return count;
    };

    const task = new Task({ name: 'default', callback });
    const run = task.run();

    return run()
      .then(() => {
        assert.equal(count, 1);
      });
  });

  it('should emit a `starting` event when the task starts running', () => {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };

    const task = new Task({ name: 'default', callback });
    task.on('starting', () => {
      count++;
    });

    const run = task.run();
    return run()
      .then(() => {
        assert.equal(count, 2);
      });
  });

  it('should emit a `finished` event when the task finishes running', () => {
    let count = 0;
    const callback = function(cb) {
      count++;
      cb();
    };
    const task = new Task({ name: 'default', callback });
    task.on('finished', () => {
      count++;
    });
    const run = task.run();
    return run()
      .then(() => {
        assert.equal(count, 2);
      });
  });

  it('should emit an `error` event when there is an error during task execution', () => {
    let count = 0;

    const callback = cb => cb(new Error('expected an error'));
    const task = new Task({ name: 'default', callback });

    task.on('error', () => {
      count++;
    });

    const run = task.run();
    return run()
      .catch(err => {
        assert.equal(count, 1);
        assert.equal(err.message, 'expected an error');
      });
  });

  it('should have the current task set as `this` inside the function', () => {
    const results = [];
    const tasks = [];

    const callback = function(next) {
      results.push(this.name);
      next();
    };

    for (let i = 0; i < 10; i++) {
      tasks.push(new Task({ name: 'task-' + i, callback }));
    }

    const series = async() => {
      for (const task of tasks) {
        await task.run()();
      }
    };

    return series().then(() => {
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
    });
  });
});
