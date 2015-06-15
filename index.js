'use strict';

// require('time-require');
var _ = require('lodash');
var extend = require('extend-shallow');
var merge = require('mixin-deep');
var es = require('event-stream');
var Task = require('orchestrator');
var Template = require('template');
var through = require('through2');
var typeOf = require('kind-of');
var vfs = require('vinyl-fs');
var init = require('./lib/init');

/**
 * Create an instance of `Composer`
 */

function Composer() {
  Template.apply(this, arguments);
  Task.apply(this, arguments);
  this.plugins = {};
  init(this);
}

extend(Composer.prototype, Task.prototype);
extend(Composer.prototype, Template.prototype);

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
  var results = es.pipe.apply(es, pipeline);
  return stream.pipe(results);
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

Composer.prototype.src = function(glob, opts) {
  opts = merge({}, this.options, opts);
  var app = this;

  return this.pipeline([
    app.plugin('src')(glob, opts),
    app.plugin('init')(app)
  ], opts);
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
  var app = this;

  return this.pipeline([
    app.plugin('paths')(opts),
    app.plugin('render')(opts),
    app.plugin('dest')(dest, opts),
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
  process.nextTick(function () {
    this.start.apply(this, tasks);
  }.bind(this));
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
