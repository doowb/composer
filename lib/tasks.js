'use strict';

const typeOf = require('kind-of');
const Task = require('./task');
const flatten = arr => [].concat.apply([], arr);

module.exports = Emitter => {

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

    setTask(name, options, deps, callback) {
      const task = new this.Task({name, options, deps, callback, app: this});
      if (this.options.inspectFn !== false) task.inspect = inspect(this);
      task.on('error', this.emit.bind(this, 'error'));
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
     * @param {String} name
     * @param {Object|Array|String|Function} `deps`
     * @param {Function} `callback` (optional)
     * @return {undefined}
     * @api public
     */

    task(name, ...rest) {
      if (typeof name !== 'string') {
        throw new TypeError('expected task "name" to be a string');
      }

      rest = flatten(rest);
      const options = rest.find(val => typeOf(val) === 'object') || {};
      const tasks = rest.filter(val => val !== options);
      const callback = typeof last(tasks) === 'function' ? tasks.pop() : cb => cb();

      const deps = flatten(tasks.concat(options.deps || []));
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
      args = flatten(args).filter(Boolean);
      const keys = Object.keys(this.tasks);
      const tasks = [];

      for (let task of arrayify(args)) {
        if (typeof task === 'function') {
          const name = !this.hasTask('default') ? ('task-' + this.ids++) : 'default';
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
      this.emit('build', { status: 'starting', app: this });

      const { options, tasks } = createOptions(this, ...args);
      const cb = typeof last(tasks) === 'function' ? tasks.pop() : null;
      const each = options.parallel ? this.parallel : this.series;

      if (!tasks.length) {
        tasks = ['default'];
      }

      const build = each.call(this, options, ...tasks);
      const promise = build()
        .then(res => {
          this.emit('build', { status: 'finished', app: this });
          return res;
        });

      if (typeof cb === 'function') {
        promise.then(() => cb(null, this.payload)).catch(cb);
        return;
      }

      return promise.then(() => this.payload);
    }

    // async build(...buildArgs) {
    //   this.emit('build', { status: 'starting', app: this });

    //   const build = (...args) => {
    //     args = flatten(args);
    //     const options = args.find(val => typeOf(val) === 'object' && !val.isTask) || {};
    //     const rest = args.filter(val => val !== options);
    //     let callback = null;

    //     if (typeof rest[rest.length - 1] === 'function') {
    //       callback = rest.pop();
    //     }

    //     const promise = new Promise((resolve, reject) => {
    //       const name = rest.shift() || 'default';
    //       const task = this.getTask(name);
    //       const opts = Object.assign({}, task.options, options);
    //       const tasks = this.expandTasks(task.deps, opts.deps);

    //       if (task.skip(options)) {
    //         resolve(this.payload);
    //         return;
    //       }

    //       const each = opts.parallel ? parallel : series;
    //       const run = task.run(options);

    //       each(tasks, dep => build(dep, options))
    //         .then(() => run())
    //         .then(() => {
    //           if (rest.length) {
    //             return build(rest, options);
    //           }
    //         })
    //         .then(res => (this.payload[name] = res))
    //         .then(resolve, reject);
    //     });

    //     if (typeof callback === 'function') {
    //       return promise.then(() => callback(null, this.payload)).catch(callback);
    //     }

    //     return promise.then(() => this.payload);
    //   }

    //   const result = build(...buildArgs);
    //   this.emit('build', { status: 'finished', app: this });
    //   return result;
    // }

    series(...args) {
      const { options, tasks } = createOptions(this, ...args);

      return cb => {
        const promise = new Promise(async (resolve, reject) => {
          if (tasks.length === 0) {
            resolve();
            return;
          }

          try {
            for (const ele of tasks) {
              const task = this.getTask(ele);
              const run = task.run(options);

              if (task.deps.length) {
                const build = this.series(...task.deps);
                await build().then(() => run());
              } else {
                await run();
              }
            }

            resolve();
          } catch (err) {
            reject(err);
          }
        });

        if (typeof cb === 'function') {
          promise.then(() => cb(null, this.payload)).catch(cb);
          return;
        }
        return promise;
      }
    }

    parallel(...args) {
      const { options, tasks } = createOptions(this, ...args);

      return cb => {
        const promise = new Promise(async (resolve, reject) => {
          if (tasks.length === 0) {
            resolve();
            return;
          }

          try {
            const pending = [];
            for (const ele of tasks) {
              const task = this.getTask(ele);
              const run = task.run(options);

              if (task.deps.length) {
                const build = this.parallel(...task.deps);
                pending.push(build().then(() => run()));
              } else {
                pending.push(run());
              }
            }

            await Promise.all(pending);
            resolve();

          } catch (err) {
            reject(err);
          }
        });

        if (typeof cb === 'function') {
          promise.then(() => cb(null, this.payload)).catch(cb);
          return;
        }
        return promise;
      }
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

   /**
     * Disable the task inspect method.
     * @name .disableInspect
     * @return {function} Returns a function that restores the inspect method when called.
     * @api public
     */

    disableInspect() {
      const fn = this.Task.prototype.inspect;
      delete this.Task.prototype.inspect;
      return () => {
        this.Task.prototype.inspect = fn;
      };
    }

    get Task() {
      return this.constructor.Task;
    }

    static get Task() {
      return Task;
    }
  }
  return Tasks;
};

async function series(arr, next) {
  for (const ele of arr) await next(ele);
}

async function parallel(arr, next) {
  const acc = [];
  for (const ele of arr) {
    acc.push(next(ele));
  }
  return Promise.all(acc);
}

function createOptions(app, ...rest) {
  const args = flatten(rest);
  const config = {};
  const options = args.find(val => typeOf(val) === 'object' && !val.isTask) || {};
  config.tasks = app.expandTasks(args.filter(val => val !== options));
  config.options = Object.assign({}, app.options, options);
  return config;
}

function last(arr) {
  return arr[arr.length - 1];
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

function arrayify(val) {
  return val ? Array.isArray(val) ? val : [val] : [];
}
