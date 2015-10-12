'use strict';

var util = require('util');
var Emitter = require('component-emitter');

var utils = require('./lib/utils');
var Task = require('./lib/task');
var noop = require('./lib/noop');
var map = require('./lib/map-deps');
var resolve = require('./lib/resolve');
var session = require('./lib/session');

/**
 * Composer constructor. Create a new Composer
 *
 * ```js
 * var composer = new Composer();
 * ```
 *
 * @api public
 */

function Composer (name) {
  Emitter.call(this);
  this.session = session(name || 'composer');
  this.tasks = {};
}

util.inherits(Composer, Emitter);

/**
 * Register a new task with it's options and dependencies.
 *
 * Options:
 *
 *  - `deps`: array of dependencies
 *  - `flow`: How this task will be executed with it's dependencies (`series`, `parallel`, `settleSeries`, `settleParallel`)
 *
 * ```js
 * composer.task('site', ['styles'], function () {
 *   return app.src('templates/pages/*.hbs')
 *     .pipe(app.dest('_gh_pages'));
 * });
 * ```
 *
 * @param  {String} `name` Name of the task to register
 * @param {Object} `options` Options to set dependencies or control flow.
 * @param {String|Array|Function} `deps` Additional dependencies for this task.
 * @param {Function} `fn` Final function is the task to register.
 * @return {Object} Return `this` for chaining
 * @api public
 */

Composer.prototype.task = function(name/*, options, dependencies and task */) {
  // return the currently running task
  // when no name is given
  if (arguments.length === 0) {
    return this.session.get('task');
  }

  var deps = [].concat.apply([], [].slice.call(arguments, 1));
  var options = {};
  var fn = noop;
  if (typeof deps[deps.length-1] === 'function') {
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
    session: this.session,
    app: this
  });

  // bubble up events from tasks
  task.on('starting', this.emit.bind(this, 'starting'));
  task.on('finished', this.emit.bind(this, 'finished'));
  task.on('error', this.emit.bind(this, 'error'));

  this.tasks[name] = task;
  return this;
};

/**
 * Build a task or list of tasks.
 *
 * ```js
 * composer.build('default', function (err, results) {
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
  var fn = this.series.apply(this, args);
  return fn(done);
};

Composer.prototype.series = flowMaker('series');
Composer.prototype.parallel = flowMaker('parallel');

function flowMaker(flow) {
  return function(/* list of tasks/functions to compose */) {
    var args = [].concat.apply([], [].slice.call(arguments));
    var self = this;
    return function (done) {
      var fns;
      try {
        fns = resolve.call(self, args);
      } catch (err) {
        return done(err);
      }
      if (fns.length === 1) {
        return fns[0](done);
      }

      var batch;
      try {
        batch = utils.bach[flow].apply(utils.bach, fns);
      } catch (err) {
        return done(err);
      }
      return batch(done);
    };
  };
};

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
  function done (err) {
    building = false;
    if (err) console.error(err);
  }

  var watch = utils.chokidar.watch(glob, opts);

  // only contains our `done` function
  if (args.length === 1) {
    return watch;
  }

  watch
    .on('ready', function () {
      building = false;
    })
    .on('all', function () {
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
