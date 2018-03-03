'use strict';

const co = require('co');
const typeOf = require('kind-of');
const Emitter = require('@sellside/emitter');
const define = require('define-property');
const iterator = require('./iterator');
const utils = require('./utils');
const Run = require('./run');

/**
 * Task constructor function. Create new tasks.
 *
 * ```
 * const task = new Task({
 *   name: 'site',
 *   deps: ['styles'],
 *   fn: buildSite // defined someplace else
 * });
 * ```
 *
 * @param {Object} `task` Task object used to configure properties on the new Task
 */

class Task extends Emitter {
  constructor(task) {
    super();
    if (typeOf(task) !== 'object') {
      throw new TypeError('Expected "task" to be an object, not "' + typeOf(task) + '"');
    }
    if (typeof task.name !== 'string') {
      throw new TypeError('Expected "task.name" to be a string, not "' + typeOf(task.name) + '"');
    }

    define(this, 'app', task.app);
    this.name = task.name;
    this.callback = task.callback || (cb => cb());
    this.options = Object.assign({ flow: 'series' }, task.options);
    this.deps = utils.union(task.deps, this.options.deps);
    this.runs = [];
  }

  /**
   * Setup run meta data to store start and end times and
   * emit starting, finished, and error events.
   *
   * @param  {Function} `cb` Callback function called when task is finished.
   * @return {Function} Function to be used as a `done` function when running a task.
   */

  wrapCallback(cb) {
    const run = new Run(this.runs.length);
    define(this, 'runInfo', run);
    this.status = 'starting';
    this.runs.push(run);
    run.start();
    this.emit('starting', this, run);

    return err => {
      run.end();
      this.status = 'finished';
      if (err) {
        define(err, 'task', this);
        define(err, 'run', run);
        this.emit('error', utils.formatError(err));
      } else {
        this.emit('finished', this, run);
      }
      cb(err);
    };
  }

  /**
   * Resolve and execute this task's dependencies.
   *
   * @param  {Function} `cb` Callback function to be called when dependenices are finished running.
   */

  runDeps(cb) {
    if (this.deps.length) {
      const flow = iterator(this.options.flow);
      const dep = flow.call(this.app, this.deps);
      dep(cb);
    } else {
      cb();
    }
  }

  /**
   * Run a task, capture it's start and end times
   * and emitting 3 possible events:
   *
   *  - starting: just before the task starts with `task` and `run` objects passed
   *  - finished: just after the task finishes with `task` and `run` objects passed
   *  - error: when an error occurs with `err`, `task`, and `run` objects passed.
   *
   * @param  {Function} `cb` Callback function to be called when task finishes running.
   * @return {*} undefined, `Promise` or `Stream` to be used to determine when task finishes running.
   */

  run(next) {
    // exit early when task set not to run.
    if (skip(this)) {
      next();
      return;
    }

    const cb = this.wrapCallback(next);
    this.runDeps(err => {
      if (err) {
        next(err);
        return;
      }

      try {
        const callback = this.callback;
        const results = utils.isGenerator(callback)
          ? co(callback, cb)
          : callback.call(this, cb);

        // needed to capture when the actual task is finished running
        if (typeOf(results) === 'object' && typeof results.on === 'function') {
          results.on('error', cb);
          results.on('end', cb);
          results.resume();
          return;
        }

        if (typeOf(results) === 'promise') {
          results.then(res => cb(null, res)).catch(cb);
        }

      } catch (err) {
        cb(err);
      }
    });
  }
}

function skip(task) {
  if (typeof task.options.run === 'undefined' && typeof task.options.skip === 'undefined') {
    return false;
  }
  if (typeof task.options.run === 'boolean') {
    return task.options.run === false;
  }
  return utils.arrayify(task.options.skip).indexOf(task.name) >= 0;
}

/**
 * Export Task
 * @type {Task}
 */

module.exports = Task;
