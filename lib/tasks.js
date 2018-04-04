'use strict';

const typeOf = require('kind-of');
const utils = require('./utils');
const Timer = require('./timer');

/**
 * Create a Tasks class with the given Emitter.
 */

module.exports = Emitter => {
  const Task = require('./task')(Emitter);

  /**
   * Create an instance of Tasks with the given Options.
   */

  class Tasks extends Emitter {
    constructor(options = {}) {
      super(Emitter.name !== 'Emitter' ? options : null);
      this.options = options;
      this.stack = new Map();
      this.payload = {};
      this.tasks = {};
      this.ids = 0;
    }

    /**
     * Set a task on `app.tasks`
     * @name .setTask
     * @param {string} name Task name
     * @param {object} name Task options
     * @param {object|array|string|function} `deps` Task dependencies
     * @param {Function} `callback` (optional) Final callback function to call after all task dependencies have been run.
     * @return {object} Returns the instance.
     * @api public
     */

    setTask(name, options = {}, deps = [], callback) {
      const task = new Task({name, options, deps, callback, app: this});
      if (this.options.inspectFn !== false) task.inspect = inspect(this);
      task.on('error', this.emit.bind(this, 'error'));
      task.on('preparing', this.emit.bind(this, 'task'));
      task.once('starting', () => {
        this.stack.set(task.name, task);
        this.emit('task', task);
      });
      task.once('finished', () => {
        this.stack.delete(task.name);
        this.emit('task', task);
      });
      this.tasks[name] = task;
      this.emit('task', task);
      return this;
    }

    /**
     * Get a task from `app.tasks`.
     * @name .getTask
     * @param {string} name
     * @return {object} Returns the task object.
     * @api public
     */

    getTask(name) {
      if (!this.hasTask(name)) {
        throw this.formatError(name, 'task');
      }
      return this.tasks[name];
    }

    /**
     * Returns true if the given task exists.
     * @name .hasTask
     * @param {string} name
     * @return {boolean}
     * @api public
     */

    hasTask(name) {
      return this.tasks.hasOwnProperty(name);
    }

    /**
     * Returns true if all values in the array are registered tasks.
     * @name .isTasks
     * @param {array} tasks
     * @return {boolean}
     * @api public
     */

    isTasks(arr) {
      return Array.isArray(arr) && arr.every(val => this.hasTask(val));
    }

    /**
     * Define a task.
     * @name .task
     * @param {String} name
     * @param {Object|Array|String|Function} `deps`
     * @param {Function} `callback` (optional)
     * @return {undefined}
     * @api public
     */

    task(name, ...tasks) {
      if (typeof name !== 'string') {
        throw new TypeError('expected task "name" to be a string');
      }
      tasks = utils.flatten(tasks);
      const options = tasks.find(val => typeOf(val) === 'object' && !val.isTask) || {};
      const deps = tasks.filter(val => val && val !== options);
      const callback = typeof utils.last(deps) === 'function' ? deps.pop() : cb => cb();
      return this.setTask(name, options, deps, callback);
    }

    /**
     * Expand globs or resolve names in an array of tasks.
     * @name .expandTasks
     * @param {...[string|function|glob]} tasks
     * @return {array}
     * @api public
     */

    expandTasks(...args) {
      args = utils.flatten(args).filter(Boolean);
      const keys = Object.keys(this.tasks);
      const tasks = [];

      for (let task of args) {
        if (typeof task === 'function') {
          const name = (this.hasTask('default') || args.indexOf('default') > -1)
            ? ('task-' + this.ids++)
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

        throw new TypeError('expected task dependency to be a string or function');
      }
      return tasks;
    }

    /**
     * Run one or more tasks.
     *
     * @name .build
     * @param {object|array|string|function} `tasks` One or more tasks to run, options, or callback function. If no tasks are defined, the default task is automatically run.
     * @param {function} `callback` (optional)
     * @return {undefined}
     * @api public
     */

    async build(...args) {
      const stats = { status: 'starting', time: new Timer(), app: this };
      stats.time.start();
      this.emit('build', stats);

      args = utils.flatten(args);
      const cb = typeof utils.last(args) === 'function' ? args.pop() : null;

      if (!args.length) {
        args = ['default'];
      }

      const { options, tasks } = createOptions(this, ...args);
      const each = options.parallel ? this.parallel : this.series;

      const build = each.call(this, options, ...tasks);
      const promise = build()
        .then(() => {
          stats.time.end();
          stats.status = 'finished';
          this.emit('build', stats);
        });

      return resolve(this, promise, cb);
    }

    /**
     * Compose a function to run the given tasks in series.
     *
     * @name .series
     * @param {object|array|string|function} `tasks` Tasks to run, options, or callback function. If no tasks are defined, the `default` task is automatically run, if one exists.
     * @param {function} `callback` (optional)
     * @return {promise|undefined} Returns a promise if no callback is passed.
     * @api public
     */

    series(...args) {
      const compose = this.iterator(async(tasks, options, resolve) => {
        for (const ele of tasks) {
          const task = this.getTask(ele);

          if (task.skip(options)) {
            continue;
          }

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
     * @name .parallel
     * @param {object|array|string|function} `tasks` Tasks to run, options, or callback function. If no tasks are defined, the `default` task is automatically run, if one exists.
     * @param {function} `callback` (optional)
     * @return {promise|undefined} Returns a promise if no callback is passed.
     * @api public
     */

    parallel(...args) {
      const compose = this.iterator((tasks, options, resolve) => {
        const pending = [];

        for (const ele of tasks) {
          const task = this.getTask(ele);
          if (task.skip(options)) {
            continue;
          }

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
        const { options, tasks } = createOptions(this, ...args);

        return cb => {
          const promise = new Promise(async(resolve, reject) => {
            if (tasks.length === 0) {
              resolve();
              return;
            }

            try {
              await fn(tasks, options, resolve);
            } catch (err) {
              reject(err);
            }
          });

          return resolve(this, promise, cb);
        };
      };
    }

    /**
     * Format task and generator errors.
     * @name .formatError
     * @param {String} `name`
     * @return {Error}
     * @api public
     */

    formatError(name) {
      return new Error(`task "${name}" is not registered`);
    }
  }
  return Tasks;
};

function resolve(app, promise, cb) {
  if (typeof cb === 'function') {
    promise.then(() => cb(null, app.payload)).catch(cb);
    return;
  }
  return promise.then(() => app.payload);
}

function createOptions(app, ...rest) {
  const args = utils.flatten(rest);
  const config = {};
  const options = args.find(val => typeOf(val) === 'object' && !val.isTask) || {};
  config.tasks = app.expandTasks(args.filter(val => val && val !== options));
  config.options = Object.assign({}, app.options, options);
  return config;
}

function inspect(app) {
  return function() {
    const opts = Object.assign({}, app.options, this.options);
    if (typeof opts.inspectFn === 'function') return opts.inspectFn(this);
    return `<Task "${this.name}" deps: [${this.deps.join(', ')}]>`;
  };
}

function match(keys, pattern) {
  const arr = [...pattern].map(ch => ({ '*': '.*?', '.': '\\.' })[ch] || ch);
  const re = new RegExp(arr.join(''));
  return keys.filter(key => re.test(key));
}
