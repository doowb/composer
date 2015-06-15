'use strict';

// require('time-require');
var extend = require('extend-shallow');
var merge = require('mixin-deep');
var es = require('event-stream');
var Task = require('orchestrator');
var pretty = require('pretty-hrtime');
var Template = require('template');
var through = require('through2');
var vfs = require('vinyl-fs');
var init = require('./lib/init');
var sessionify = require('sessionify');
var session = require('./lib/session');

/**
 * Create an instance of `Composer`
 */

function Composer() {
  Template.apply(this, arguments);
  Task.apply(this, arguments);
  this.session = session;
  this.plugins = {};
  init(this);
}

extend(Composer.prototype, Task.prototype);
Template.mixin(Composer.prototype);

/**
 * Register a plugin by `name`
 *
 * @param  {String} `name`
 * @param  {Function} `fn`
 * @api public
 */

Composer.prototype.plugin = function(name, fn) {
  if (arguments.length === 1) {
    return this.plugins[name];
  }
  if (typeof fn === 'function') {
    fn = fn.bind(this);
  }
  this.plugins[name] = fn;
  return this;
};

/**
 * Create a plugin pipeline from an array of plugins.
 *
 * @param  {Array} `plugins` Functions or names of registered plugins.
 * @param  {Object} `options`
 * @return {Stream}
 * @api public
 */

Composer.prototype.pipeline = function(pipeline) {
  var stream = through.obj();
  if (!pipeline.length) {
    pipeline = [through.obj()];
  }
  var res = es.pipe.apply(es, pipeline);
  sessionify(res, session, this);
  return stream.pipe(res);
};

/**
 * Glob patterns or filepaths to source files.
 *
 * ```js
 * app.src('*.js')
 * ```
 *
 * @param {String|Array} `glob` Glob patterns or file paths to source files.
 * @param {Object} `options` Options or locals to merge into the context and/or pass to `src` plugins
 * @api public
 */

Composer.prototype.src = function(glob, options) {
  var opts = merge({}, this.options, options);
  this.session.set('src', options || {});

  if (opts.minimal || this.enabled('minimal config')) {
    return this.plugin('src')(glob, opts);
  }

  return this.pipeline([
    this.plugin('src')(glob, opts),
    this.plugin('file')(this)
  ], opts)
};

/**
 * Specify a destination for processed files.
 *
 * ```js
 * app.dest('dist', {ext: '.xml'})
 * ```
 *
 * @param {String|Function} `dest` File path or rename function.
 * @param {Object} `options` Options or locals to pass to `dest` plugins
 * @api public
 */

Composer.prototype.dest = function(dest, opts) {
  opts = merge({}, this.options, opts);

  if (opts.minimal || this.enabled('minimal config')) {
    return this.plugin('dest')(dest, opts);
  }

  return this.pipeline([
    this.plugin('paths')(opts),
    this.plugin('render')(opts),
    this.plugin('dest')(dest, opts),
  ], opts);
};

/**
 * Copy a `glob` of files to the specified `dest`.
 *
 * ```js
 * app.copy('assets/**', 'dist');
 * ```
 *
 * @param  {String|Array} `glob`
 * @param  {String|Function} `dest`
 * @return {Stream} Stream, to continue processing if necessary.
 * @api public
 */

Composer.prototype.copy = function(glob, dest, opts) {
  return vfs.src(glob, opts).pipe(vfs.dest(dest, opts));
};

/**
 * Define a task.
 *
 * ```js
 * app.task('docs', function() {
 *   app.src(['foo.js', 'bar/*.js'])
 *     .pipe(app.dest('./'));
 * });
 * ```
 *
 * @param {String} `name`
 * @param {Function} `fn`
 * @api public
 */

Composer.prototype.task = Composer.prototype.add;

/**
 * Run an array of tasks.
 *
 * ```js
 * app.run(['foo', 'bar']);
 * ```
 *
 * @param {Array} `tasks`
 * @api private
 */

Composer.prototype.run = function() {
  var tasks = arguments.length ? arguments : ['default'];
  this.on('err', console.log);

  if (this.enabled('verbose')) {
    this.on('task_start', function (data) {
      console.log('Starting', '\'' + data.task + '\'...');
    });

    this.on('task_stop', function (data) {
      var time = pretty(data.hrDuration);
      console.log('Finished', '\'' + data.task + '\'', 'after', time);
    });
  }

  process.nextTick(function () {
    this.start.apply(this, tasks);
  }.bind(this));
};

/**
 * Wrapper around Task._runTask to enable `sessions`
 *
 * @param  {Object} `task` Task to run
 * @api private
 */

Composer.prototype._runTask = function(task) {
  var composer = this;
  composer.session.run(function () {
    composer.session.set('task', task.name);
    Task.prototype._runTask.call(composer, task);
  });
};

/**
 * Re-run the specified task(s) when a file changes.
 *
 * ```js
 * app.task('watch', function() {
 *   app.watch('docs/*.md', ['docs']);
 * });
 * ```
 *
 * @param  {String|Array} `glob` Filepaths or glob patterns.
 * @param  {Function} `fn` Task(s) to watch.
 * @api public
 */

Composer.prototype.watch = function(glob, opts, fn) {
  if (Array.isArray(opts) || typeof opts === 'function') {
    fn = opts; opts = null;
  }
  if (!Array.isArray(fn)) {
    return vfs.watch(glob, opts, fn);
  }
  return vfs.watch(glob, opts, function () {
    this.start.apply(this, fn);
  }.bind(this));
};

/**
 * Expose the `Composer` class on `app.Composer`
 */

Composer.prototype.Composer = Composer;

/**
 * Expose our instance of `app`
 */

module.exports = new Composer();
