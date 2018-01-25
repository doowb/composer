'use strict';

var Run = require('./lib/run');
var Task = require('./lib/task');
var noop = require('./lib/noop');
var utils = require('./lib/utils');
var map = require('./lib/map-deps');
var inspect = require('./lib/inspect');
var flowFactory = require('./lib/flow');
var Emitter = require('component-emitter');
var runId = 0;

/**
 * Composer constructor. Create an instance of `Composer`
 *
 * ```js
 * var composer = new Composer();
 * ```
 */

function Composer(name) {
  Emitter.call(this);
  this.tasks = {};
}

/**
 * Mix in `Emitter` methods
 */

Emitter(Composer.prototype);

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

Composer.prototype.task = function(name/*, options, deps, task */) {
  if (typeof name !== 'string') {
    throw new TypeError('expected `name` to be a string');
  }

  var options = {};
  var fn = noop;
  var args = [].concat.apply([], [].slice.call(arguments, 1));

  // get the actual task function
  if (args.length && typeof args[args.length - 1] === 'function') {
    fn = args.pop();
  }

  if (utils.hasOptions(args)) {
    options = args.shift();
  }

  options.deps = utils.unique(args
    .concat(options.deps || [])
    .map(map.bind(this)));

  var task = new Task({
    name: name,
    options: options,
    fn: fn,
    app: this
  });

  inspect(this, task);

  // bubble up events from tasks
  task.on('starting', this.emit.bind(this, 'task'));
  task.on('finished', this.emit.bind(this, 'task'));
  task.on('error', this.emit.bind(this, 'error'));

  this.tasks[name] = task;
  task.status = 'register';
  this.emit('task', task);
  return this;
};

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

Composer.prototype.build = function(tasks, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = null;
  }

  if (typeof tasks === 'function') {
    cb = tasks;
    tasks = [];
  }

  tasks = utils.arrayify(tasks);
  if (tasks.length === 0) {
    tasks = ['default'];
  }

  var opts = utils.extend({}, options);
  tasks.push(opts);

  // gather total build time information
  var self = this;
  var build = new Run(runId++);
  utils.define(build, 'app', this);
  build.start();
  this.emit('build', build);
  var fn = this.series.apply(this, tasks);

  return new Promise(function(resolve, reject) {
    fn(function(err, result) {
      build.end();
      if (err) {
        utils.define(err, 'app', self);
        utils.define(err, 'build', build);
        self.emit('error', err);
        reject(err);
      } else {
        self.emit('build', build);
        resolve(result);
      }
    });
  })
  .then(function(result) {
    if (typeof cb === 'function') {
      cb(null, result);
    }
    return result;
  })
  .catch(function(err) {
    if (typeof cb === 'function') {
      cb(err);
      return;
    }
    throw err;
  });
};

/**
 * Compose task or list of tasks into a single function that runs the tasks in series.
 *
 * ```js
 * app.task('foo', function(done) {
 *   console.log('this is foo');
 *   done();
 * });
 *
 * var fn = app.series('foo', function bar(done) {
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

Composer.prototype.series = flowFactory('series');

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
 * var fn = app.parallel('foo', function bar(done) {
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

Composer.prototype.parallel = flowFactory('parallel');

/**
 * Expose Composer
 */

module.exports = Composer;
