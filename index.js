'use strict';

var Emitter = require('component-emitter');

var Run = require('./lib/run');
var Task = require('./lib/task');
var noop = require('./lib/noop');
var utils = require('./lib/utils');
var map = require('./lib/map-deps');
var session = require('./lib/session');
var flowFactory = require('./lib/flow');
var builds = [];

/**
 * Composer constructor. Create a new Composer
 *
 * ```js
 * var composer = new Composer();
 * ```
 *
 * @api public
 */

function Composer(name) {
  Emitter.call(this);
  this.tasks = {};
  utils.define(this, '_appname', name || 'composer');
  utils.define(this, 'currentTask', {
    get: function() {
      return session(this._appname).get('task');
    }
  });
  utils.define(this, 'buildHistory', {
    get: function() {
      return builds;
    }
  });
}

/**
 * Mix in `Emitter` methods
 */

Emitter(Composer.prototype);

/**
 * Register a new task with it's options and dependencies.
 *
 * Options:
 *
 *  - `deps`: array of dependencies
 *  - `flow`: How this task will be executed with it's dependencies (`series`, `parallel`, `settleSeries`, `settleParallel`)
 *
 * To return the task object of an already registered task, pass the name of the task without any additional parameters.
 *
 * ```js
 * // register task "site" with composer
 * composer.task('site', ['styles'], function() {
 *   return app.src('templates/pages/*.hbs')
 *     .pipe(app.dest('_gh_pages'));
 * });
 *
 * // get the "site" task object
 * var task = composer.task('site');
 * ```
 *
 * @param {String} `name` Name of the task to register
 * @param {Object} `options` Options to set dependencies or control flow.
 * @param {String|Array|Function} `deps` Additional dependencies for this task.
 * @param {Function} `fn` Final function is the task to register.
 * @return {Object} Return `this` for chaining
 * @api public
 */

Composer.prototype.task = function(name/*, options, dependencies and task */) {
  if (typeof name !== 'string') {
    throw new TypeError('expected `name` to be a string');
  }

  var deps = [].concat.apply([], [].slice.call(arguments, 1));
  if (!deps.length) {
    return this.tasks[name];
  }

  var options = {};
  var fn = noop;
  if (typeof deps[deps.length - 1] === 'function') {
    fn = deps.pop();
  }

  if (deps.length && utils.isobject(deps[0])) {
    options = deps.shift();
  }

  options.deps = deps
    .concat(options.deps || [])
    .map(map.bind(this));

  var task = new Task({
    name: name,
    options: options,
    fn: fn,
    session: session(this._appname),
    app: this
  });

  // bubble up events from tasks
  task.on('starting', this.emit.bind(this, 'task:starting'));
  task.on('finished', this.emit.bind(this, 'task:finished'));
  task.on('error', this.emit.bind(this, 'task:error'));

  this.tasks[name] = task;
  this.emit('task', this.name, task);
  return this;
};

/**
 * Build a task or list of tasks.
 *
 * ```js
 * composer.build('default', function(err, results) {
 *   if (err) return console.error(err);
 *   console.log(results);
 * });
 * ```
 *
 * @param {String|Array|Function} `tasks` List of tasks by name, function, or array of names/functions.
 * @param {Function} `cb` Callback function to be called when all tasks are finished building.
 * @api public
 */

Composer.prototype.build = function(/* list of tasks/functions to build */) {
  var args = [].concat.apply([], [].slice.call(arguments));
  var done = args.pop();
  if (typeof done !== 'function') {
    throw new TypeError('Expected the last argument to be a callback function, but got `' + typeof done + '`.');
  }

  // gather total build time information
  var self = this;
  var build = new Run(builds.length);
  builds.push(build);
  build.start();
  this.emit('starting', this, build);
  function finishBuild(err) {
    build.end();
    if (err) {
      err.app = self;
      err.build = build;
      self.emit('error', err);
    } else {
      self.emit('finished', self, build);
    }
    return done.apply(null, arguments);
  };

  var fn = this.series.apply(this, args);
  return fn(finishBuild);
};

/**
 * Compose task or list of tasks into a single function that runs the tasks in series.
 *
 * ```js
 * composer.task('foo', function(done) {
 *   console.log('this is foo');
 *   done();
 * });
 *
 * var fn = composer.series('foo', function bar(done) {
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
 *
 * @param {String|Array|Function} `tasks` List of tasks by name, function, or array of names/functions.
 * @return {Function} Composed function that may take a callback function.
 * @api public
 */

Composer.prototype.series = flowFactory('series');

/**
 * Compose task or list of tasks into a single function that runs the tasks in parallel.
 *
 * ```js
 * composer.task('foo', function(done) {
 *   setTimeout(function() {
 *     console.log('this is foo');
 *     done();
 *   }, 500);
 * });
 *
 * var fn = composer.parallel('foo', function bar(done) {
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
 * Watch a file, directory, or glob pattern for changes and build a task or list of tasks
 * when changes are made. Watch is powered by [chokidar][] so the glob pattern may be
 * anything that [chokidar.watch](https://github.com/paulmillr/chokidar#api) accepts.
 *
 * ```js
 * var watcher = composer.watch('templates/pages/*.hbs', ['site']);
 * ```
 *
 * @param  {String|Array} `glob` Filename, Directory name, or glob pattern to watch
 * @param  {Object} `options` Additional options to be passed to [chokidar][]
 * @param  {String|Array|Function} `tasks` Tasks that are passed to `.build` when files in the glob are changed.
 * @return {Object} Returns an instance of `FSWatcher` from [chokidar][]
 * @api public
 */

Composer.prototype.watch = function(glob, options/*, fns/tasks */) {
  var self = this;
  var len = arguments.length - 1, i = 0;
  var args = new Array(len + 1);
  while (len--) args[i] = arguments[++i];
  args[i] = done;

  var opts = {};
  if (typeof options === 'object' && !Array.isArray(options)) {
    args.shift();
    opts = utils.extend(opts, options);
  }

  var building = true;
  function done(err) {
    building = false;
    if (err) console.error(err);
  }

  var watch = utils.chokidar.watch(glob, opts);

  // only contains our `done` function
  if (args.length === 1) {
    return watch;
  }

  watch
    .on('ready', function() {
      building = false;
    })
    .on('all', function() {
      if (building) return;
      building = true;
      self.build.apply(self, args);
    });

  return watch;
};

/**
 * Expose Composer
 */

module.exports = Composer;
