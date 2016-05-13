'use strict';

var async = require('async');
var assert = require('assert');
var through = require('through2');
var Task = require('../lib/task');

describe('task', function() {
  it('should throw an error when nothing is passed to Task', function() {
    try {
      Task();
      throw new Error('Expected `new Task()` to throw an error.');
    } catch (err) {}
  });

  it('should throw an error when `name` is not passed on `task`.', function() {
    try {
      Task({});
      throw new Error('Expected `new Task({})` to throw an error when `name` is not passed.');
    } catch (err) {}
  });

  it('should create a new task with a given `name`', function() {
    var task = new Task({name: 'default'});
    assert.equal(task.name, 'default');
  });

  it('should create a new task with a given task function', function() {
    var fn = function(done) {
      return done();
    };
    var task = new Task({name: 'default', fn: fn});
    assert.equal(task.fn, fn);
  });

  it('should create a new task with the given dependencies', function() {
    var task = new Task({name: 'default', deps: ['foo', 'bar']});
    assert.deepEqual(task.deps, ['foo', 'bar']);
  });

  it('should create a new task with deps from the `options` property', function() {
    var opts = {deps: ['foo', 'bar']};
    var task = new Task({name: 'default', options: opts});
    assert.deepEqual(task.deps, ['foo', 'bar']);
  });

  it('should run a task function when `.run` is called', function(done) {
    var count = 0;
    var fn = function(cb) {
      count++;
      cb();
    };

    var task = new Task({name: 'default', fn: fn});
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should skip a task function when `.options.run === false`', function(done) {
    var count = 0;
    var fn = function(cb) {
      count++;
      cb();
    };

    var task = new Task({name: 'default', fn: fn, options: {run: false}});
    task.run(function(err) {
      if(err) return done(err);
      assert.equal(count, 0);
      done();
    });
  });

  it('should run a task function that returns a promise when `.run` is called', function(done) {
    var count = 0;
    var fn = function() {
      return new Promise(function(resolve) {
        setImmediate(function() {
          count++;
          resolve();
        });
      });
    };

    var task = new Task({name: 'default', fn: fn});
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should run a task function that returns a stream when `.run` is called', function(done) {
    var count = 0;
    var fn = function() {
      var stream = through.obj(function(data, enc, next) {
        count++;
        next(null);
      });
      setImmediate(function() {
        stream.write(count);
        stream.end();
      });
      return stream;
    };

    var task = new Task({name: 'default', fn: fn});
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should run a task given a generator function when `.run` is called', function(done) {
    var count = 0;
    var fn = function* () {
      count++;
    };

    var task = new Task({name: 'default', fn: fn});
    task.run(function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should emit a `starting` event when the task starts running', function(done) {
    var count = 0;
    var fn = function(cb) {
      count++;
      cb();
    };
    var task = new Task({name: 'default', fn: fn});
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
    var count = 0;
    var fn = function(cb) {
      count++;
      cb();
    };
    var task = new Task({name: 'default', fn: fn});
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
    var count = 0;
    var fn = function(cb) {
      count++;
      cb(new Error('Expected error'));
    };
    var task = new Task({name: 'default', fn: fn});
    task.on('error', function(err) {
      if (err) count++;
    });
    task.run(function(err) {
      if (!err) return done(new Error('Expected an error to be thrown.'));
      assert.equal(count, 2);
      done();
    });
  });

  it('should have the current task set as `this` inside the function', function(done) {
    var results = [];
    var fn = function(cb) {
      results.push(this.name);
      cb();
    };
    var tasks = [];
    for (var i = 0; i < 10; i++) {
      tasks.push(new Task({name: 'task-' + i, fn: fn}));
    }
    async.eachSeries(tasks, function(task, next) {
      task.run(next);
    }, function(err) {
      if (err) return done(err);
      assert.equal(results.length, 10);
      assert.deepEqual(results, ['task-0', 'task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6', 'task-7', 'task-8', 'task-9']);
      done();
    });
  });
});
