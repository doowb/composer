'use strict';

const Task = require('./task');
const Timer = require('./timer');
const utils = require('./utils');
const Events = require('./events');
const noop = cb => cb();

/**
 * Factory for creating a custom `Tasks` class that extends the
 * given `Emitter`. Or, simply call the factory function to use
 * the built-in emitter.
 *
 * ```js
 * // custom emitter
 * const Emitter = require('events');
 * const Tasks = require('composer/lib/tasks')(Emitter);
 * // built-in emitter
 * const Tasks = require('composer/lib/tasks')();
 * const composer = new Tasks();
 * ```
 * @name .create
 * @param {function} `Emitter` Event emitter.
 * @return {Class} Returns a custom `Tasks` class.
 * @api public
 */

module.exports = (Emitter = Events) => {

  /**
   * Create an instance of `Tasks` with the given `options`.
   *
   * ```js
   * const Tasks = require('composer').Tasks;
   * const composer = new Tasks();
   * ```
   * @class
   * @name Tasks
   * @param {object} `options`
   * @api public
   */

  class Tasks extends Emitter {
    constructor(options = {}) {
      super(!/(Event)?Emitter/.test(Emitter.name) ? options : null);
      this.options = options;
      this.taskStack = new Set();
      this.tasks = new Map();
      this.taskId = 0;
    }

    /**
     * Define a task. Tasks run asynchronously, either in series (by default) or parallel
     * (when `options.parallel` is true). In order for the build to determine when a task is
     * complete, _one of the following_ things must happen: 1) the callback must be called, 2) a
     * promise must be returned, or 3) a stream must be returned.
     *
     * ```js
     * // 1. callback
     * app.task('default', cb => {
     *   // do stuff
     *   cb();
     * });
     * // 2. promise
     * app.task('default', () => {
     *   return Promise.resolve(null);
     * });
     * // 3. stream (using vinyl-fs or your stream of choice)
     * app.task('default', function() {
     *   return vfs.src('foo/*.js');
     * });
     * ```
     * @name .task
     * @param {String} `name` The task name.
     * @param {Object|Array|String|Function} `deps` Any of the following: task dependencies, callback(s), or options object, defined in any order.
     * @param {Function} `callback` (optional) If the last argument is a function, it will be called after all of the task's dependencies have been run.
     * @return {undefined}
     * @api public
     */

    task(name, ...rest) {
      if (typeof name !== 'string') {
        throw new TypeError('expected task "name" to be a string');
      }
      const { options, tasks } = utils.createOptions(this, false, ...rest);
      const callback = typeof tasks[tasks.length - 1] === 'function' ? tasks.pop() : noop;
      return this.setTask(name, options, tasks, callback);
    }

    /**
     * Set a task on `app.tasks`
     * @name .setTask
     * @param {string} name Task name
     * @param {object} name Task options
     * @param {object|array|string|function} `deps` Task dependencies
     * @param {Function} `callback` (optional) Final callback function to call after all task dependencies have been run.
     * @return {object} Returns the instance.
     */

    setTask(name, options = {}, deps = [], callback) {
      const task = new Task({name, options, deps, callback, app: this});
      const emit = () => this.emit('task', task);
      task.on('error', this.emit.bind(this, 'error'));
      task.on('preparing', emit);
      task.on('starting', task => {
        this.taskStack.add(task);
        emit();
      });
      task.on('finished', task => {
        this.taskStack.delete(task);
        emit();
      });
      this.tasks.set(name, task);
      emit();
      return this;
    }

    /**
     * Get a task from `app.tasks`.
     * @name .getTask
     * @param {string} name
     * @return {object} Returns the task object.
     */

    getTask(name) {
      if (!this.tasks.has(name)) {
        throw this.formatError(name, 'task');
      }
      return this.tasks.get(name);
    }

    /**
     * Returns true if all values in the array are registered tasks.
     * @name .isTasks
     * @param {array} tasks
     * @return {boolean}
     */

    isTasks(arr) {
      return Array.isArray(arr) && arr.every(name => this.tasks.has(name));
    }

    /**
     * Create an array of tasks to run by resolving registered tasks from the values
     * in the given array.
     * @name .expandTasks
     * @param {...[string|function|glob]} tasks
     * @return {array}
     */

    expandTasks(...args) {
      const vals = utils.flatten(args).filter(Boolean);
      const keys = [...this.tasks.keys()];
      const tasks = [];

      for (const task of vals) {
        if (typeof task === 'function') {
          const name = (this.tasks.has('default') || vals.indexOf('default') > -1)
            ? ('task-' + this.taskId++)
            : 'default';

          this.task(name, task);
          tasks.push(name);
          continue;
        }

        if (typeof task === 'string') {
          if (/\*/.test(task)) {
            const matches = match(keys, task);
            if (matches.length === 0) {
              throw new Error(`glob "${task}" does not match any registered tasks`);
            }
            tasks.push.apply(tasks, matches);
            continue;
          }

          tasks.push(task);
          continue;
        }

        const msg = 'expected task dependency to be a string or function, but got: ';
        throw new TypeError(msg + typeof task);
      }
      return tasks;
    }

    /**
     * Run one or more tasks.
     *
     * ```js
     * const build = app.series(['foo', 'bar', 'baz']);
     * // promise
     * build().then(console.log).catch(console.error);
     * // or callback
     * build(function() {
     *   if (err) return console.error(err);
     * });
     * ```
     * @name .build
     * @param {object|array|string|function} `tasks` One or more tasks to run, options, or callback function. If no tasks are defined, the default task is automatically run.
     * @param {function} `callback` (optional)
     * @return {undefined}
     * @api public
     */

    async build(...args) {
      const state = { status: 'starting', time: new Timer(), app: this };
      state.time.start();
      this.emit('build', state);

      args = utils.flatten(args);
      const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;

      let { options, tasks } = utils.createOptions(this, true, ...args);
      if (!tasks.length) tasks = ['default'];

      const each = options.parallel ? this.parallel : this.series;
      const build = each.call(this, options, ...tasks);
      const promise = build()
        .then(() => {
          state.time.end();
          state.status = 'finished';
          this.emit('build', state);
        });

      return resolveBuild(promise, cb);
    }

    /**
     * Compose a function to run the given tasks in series.
     *
     * ```js
     * const build = app.series(['foo', 'bar', 'baz']);
     * // promise
     * build().then(console.log).catch(console.error);
     * // or callback
     * build(function() {
     *   if (err) return console.error(err);
     * });
     * ```
     * @name .series
     * @param {object|array|string|function} `tasks` Tasks to run, options, or callback function. If no tasks are defined, the `default` task is automatically run, if one exists.
     * @param {function} `callback` (optional)
     * @return {promise|undefined} Returns a promise if no callback is passed.
     * @api public
     */

    series(...args) {
      const stack = new Set();
      const compose = this.iterator(async(tasks, options, resolve) => {
        for (const ele of tasks) {
          const task = this.getTask(ele);
          task.series = true;

          if (task.skip(options) || stack.has(task)) {
            continue;
          }

          task.once('finished', () => stack.delete(task));
          task.once('starting', () => stack.add(task));
          const run = task.run(options);

          if (task.deps.length) {
            const opts = Object.assign({}, options, task.options);
            const each = opts.parallel ? this.parallel : this.series;
            const build = each.call(this, ...task.deps);
            await build().then(() => run());
          } else {
            await run();
          }
        }

        resolve();
      });

      return compose(...args);
    }

    /**
     * Compose a function to run the given tasks in parallel.
     *
     * ```js
     * // call the returned function to start the build
     * const build = app.parallel(['foo', 'bar', 'baz']);
     * // promise
     * build().then(console.log).catch(console.error);
     * // callback
     * build(function() {
     *   if (err) return console.error(err);
     * });
     * // example task usage
     * app.task('default', build);
     * ```
     * @name .parallel
     * @param {object|array|string|function} `tasks` Tasks to run, options, or callback function. If no tasks are defined, the `default` task is automatically run, if one exists.
     * @param {function} `callback` (optional)
     * @return {promise|undefined} Returns a promise if no callback is passed.
     * @api public
     */

    parallel(...args) {
      const stack = new Set();
      const compose = this.iterator((tasks, options, resolve) => {
        const pending = [];

        for (const ele of tasks) {
          const task = this.getTask(ele);

          if (task.skip(options) || stack.has(task)) {
            continue;
          }

          task.once('finished', () => stack.delete(task));
          task.once('starting', () => stack.add(task));
          const run = task.run(options);

          if (task.deps.length) {
            const opts = Object.assign({}, options, task.options);
            const each = opts.parallel ? this.parallel : this.series;
            const build = each.call(this, ...task.deps);
            pending.push(build().then(() => run()));
          } else {
            pending.push(run());
          }
        }

        resolve(Promise.all(pending));
      });

      return compose(...args);
    }

    /**
     * Create an async iterator function that ensures that either a promise is
     * returned or the user-provided callback is called.
     * @param {function} `fn` Function to invoke inside the promise.
     * @return {function}
     */

    iterator(fn) {
      return (...args) => {
        const { options, tasks } = utils.createOptions(this, true, ...args);

        return cb => {
          const promise = new Promise(async(resolve, reject) => {
            if (tasks.length === 0) {
              resolve();
              return;
            }

            try {
              await fn(tasks, options, resolve, reject);
            } catch (err) {
              reject(err);
            }
          });

          return resolveBuild(promise, cb);
        };
      };
    }

    /**
     * Format task and generator errors.
     * @name .formatError
     * @param {String} `name`
     * @return {Error}
     */

    formatError(name) {
      return new Error(`task "${name}" is not registered`);
    }
  }
  return Tasks;
};

function resolveBuild(promise, cb) {
  if (typeof cb === 'function') {
    promise.then(val => cb(null, val)).catch(cb);
  } else {
    return promise;
  }
}

function match(keys, pattern) {
  const chars = [...pattern].map(ch => ({ '*': '.*?', '.': '\\.' }[ch] || ch));
  const regex = new RegExp(chars.join(''));
  return keys.filter(key => regex.test(key));
}
