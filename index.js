'use strict';

/**
 * Module dependencies
 */

const Emitter = require('@sellside/emitter');
const define = require('define-property');
const flatten = require('arr-flatten');

/**
 * Local dependencies
 */

const iterator = require('./lib/iterator');
const utils = require('./lib/utils');
const Task = require('./lib/task');
const Run = require('./lib/run');
let runId = 0;

/**
 * Create an instance of `Composer`.
 *
 * ```js
 * const composer = new Composer();
 * ```
 * @api public
 */

class Composer extends Emitter {
  constructor() {
    super();
    this.tasks = {};
  }

  /**
   * Register a new task with it's options and dependencies.
   *
   * Dependencies may also be specified as a glob pattern. Be aware that
   * the order cannot be guarenteed when using a glob pattern.
   *
   * ```js
   * // register task "site" with composer
   * app.task('site', ['styles'], function() {
   *   return app.src('templates/pages/*.hbs')
   *     .pipe(app.dest('_gh_pages'));
   * });
   * ```
   * @param {String} `name` Name of the task to register
   * @param {Object} `options` Options to set dependencies or control flow.
   * @param {Object} `options.deps` array of dependencies
   * @param {Object} `options.flow` How this task will be executed with it's dependencies (`series`, `parallel`, `settleSeries`, `settleParallel`)
   * @param {String|Array|Function} `deps` Additional dependencies for this task.
   * @param {Function} `fn` Final function is the task to register.
   * @return {Object} Return the instance for chaining
   * @api public
   */

  task(name, ...rest) {
    if (typeof name !== 'string') {
      throw new TypeError('expected `name` to be a string');
    }

    let options = {};
    let callback = cb => cb();
    const arr = flatten(rest);
    const args = arr.filter((val, i) => {
      if (utils.isObject(val)) {
        options = val;
        return false;
      }
      if (typeof val === 'function' && i === arr.length - 1) {
        callback = val;
        return false;
      }
      return true;
    });

    options.deps = this.mapDeps(utils.union(args, options.deps));
    const task = new Task({
      name: name,
      options: options,
      callback: callback,
      app: this
    });

    utils.inspectFn(this, task);

    // bubble up events from tasks
    task.on('starting', this.emit.bind(this, 'task'));
    task.on('finished', this.emit.bind(this, 'task'));
    task.on('error', this.emit.bind(this, 'error'));

    this.tasks[name] = task;
    task.status = 'register';
    this.emit('task', task);
    return this;
  }

  /**
   * Use in a map function to register anonymous functions
   * when not registered already.
   *
   * ```js
   * // bind the composer to the mapDeps call
   * deps = deps.map(mapDeps.bind(this));
   * ```
   *
   * @param  {String|Function} `dep` Dependency name or anonymous function to be registered.
   * @return {String} Returns the dependency name
   */

  mapDeps(deps) {
    const res = [];
    for (const dep of utils.union(deps)) {
      if (typeof dep === 'function') {
        const name = dep.name || '[anonymous (' + (++runId) + ')]';
        this.task(name, dep);
        res.push(name);
        continue;
      }
      res.push(dep);
    }
    return res;
  }

  /**
   * Build a task or array of tasks.
   *
   * ```js
   * app.build('default', function(err, results) {
   *   if (err) return console.error(err);
   *   console.log(results);
   * });
   * ```
   *
   * @param {String|Array} `tasks` Array of task names to build. (Defaults to `[default]`).
   * @param {Object} `options` Optional options object to merge onto each task's options when building.
   * @param {Function} `cb` Optional callback function to be called when all tasks are finished building. If omitted, a Promise is returned.
   * @return {Promise} When `cb` is omitted, a Promise is returned that will resolve when the tasks are finished building.
   * @api public
   */

  build(tasks, options, callback) {
    if (typeof options === 'function') {
      return this.build(tasks, null, options);
    }

    if (typeof tasks === 'function') {
      return this.build([], null, tasks);
    }

    tasks = utils.arrayify(tasks);
    if (tasks.length === 0) {
      tasks = ['default'];
    }

    tasks.push(Object.assign({}, options));

    // gather total build time information
    const build = new Run(runId++);
    define(build, 'app', this);
    build.start();

    this.emit('build', build);
    const run = this.series.apply(this, tasks);

    const promise = new Promise((resolve, reject) => {
      run((err, result) => {
        build.end();
        if (err) {
          define(err, 'app', this);
          define(err, 'build', build);
          this.emit('error', err);
          reject(err);
        } else {
          this.emit('build', build);
          resolve(result);
        }
      });
    });

    if (typeof callback === 'function') {
      return promise.then(result => callback(null, result)).catch(callback);
    }

    return promise;
  }

  /**
   * Compose task or list of tasks into a single function that runs the tasks in series.
   *
   * ```js
   * app.task('foo', function(done) {
   *   console.log('this is foo');
   *   done();
   * });
   *
   * const fn = app.series('foo', function bar(done) {
   *   console.log('this is bar');
   *   done();
   * });
   *
   * fn(function(err) {
   *   if (err) return console.error(err);
   *   console.log('done');
   * });
   * //=> this is foo
   * //=> this is bar
   * //=> done
   * ```
   * @param {String|Array|Function} `tasks` List of tasks by name, function, or array of names/functions.
   * @return {Function} Composed function that may take a callback function.
   * @api public
   */

  get series() {
    return iterator('series');
  }

  /**
   * Compose task or list of tasks into a single function that runs the tasks in parallel.
   *
   * ```js
   * app.task('foo', function(done) {
   *   setTimeout(function() {
   *     console.log('this is foo');
   *     done();
   *   }, 500);
   * });
   *
   * const fn = app.parallel('foo', function bar(done) {
   *   console.log('this is bar');
   *   done();
   * });
   *
   * fn(function(err) {
   *   if (err) return console.error(err);
   *   console.log('done');
   * });
   * //=> this is bar
   * //=> this is foo
   * //=> done
   * ```
   *
   * @param {String|Array|Function} `tasks` List of tasks by name, function, or array of names/functions.
   * @return {Function} Composed function that may take a callback function.
   * @api public
   */

  get parallel() {
    return iterator('parallel');
  }
}

/**
 * Expose Composer
 */

module.exports = Composer;
