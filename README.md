# composer [![NPM version](https://img.shields.io/npm/v/composer.svg)](https://www.npmjs.com/package/composer) [![Build Status](https://img.shields.io/travis/jonschlinkert/composer.svg)](https://travis-ci.org/jonschlinkert/composer)

> API-first task runner with three methods: task, run and watch.

## Install

Install with [npm](https://www.npmjs.com/):

```sh
$ npm i composer --save
```

## Usage

```js
var Composer = require('composer');
```

## API

### [.task](index.js#L68)

Register a new task with it's options and dependencies. To return the task object of an already registered task, pass the name of the task without any additional parameters.

**Params**

* `name` **{String}**: Name of the task to register
* `options` **{Object}**: Options to set dependencies or control flow.
* `options.deps` **{Object}**: array of dependencies
* `options.flow` **{Object}**: How this task will be executed with it's dependencies (`series`, `parallel`, `settleSeries`, `settleParallel`)
* `deps` **{String|Array|Function}**: Additional dependencies for this task.
* `fn` **{Function}**: Final function is the task to register.
* `returns` **{Object}**: Return the instance for chaining

**Example**

```js
// register task "site" with composer
app.task('site', ['styles'], function() {
  return app.src('templates/pages/*.hbs')
    .pipe(app.dest('_gh_pages'));
});

// get the "site" task object
var task = app.task('site');
```

### [.build](index.js#L125)

Build a task or array of tasks.

**Params**

* `tasks` **{String|Array|Function}**: List of tasks by name, function, or array of names/functions. (Defaults to `[default]`).
* `cb` **{Function}**: Callback function to be called when all tasks are finished building.

**Example**

```js
app.build('default', function(err, results) {
  if (err) return console.error(err);
  console.log(results);
});
```

### [.series](index.js#L185)

Compose task or list of tasks into a single function that runs the tasks in series.

**Params**

* `tasks` **{String|Array|Function}**: List of tasks by name, function, or array of names/functions.
* `returns` **{Function}**: Composed function that may take a callback function.

**Example**

```js
app.task('foo', function(done) {
  console.log('this is foo');
  done();
});

var fn = app.series('foo', function bar(done) {
  console.log('this is bar');
  done();
});

fn(function(err) {
  if (err) return console.error(err);
  console.log('done');
});
//=> this is foo
//=> this is bar
//=> done
```

### [.parallel](index.js#L217)

Compose task or list of tasks into a single function that runs the tasks in parallel.

**Params**

* `tasks` **{String|Array|Function}**: List of tasks by name, function, or array of names/functions.
* `returns` **{Function}**: Composed function that may take a callback function.

**Example**

```js
app.task('foo', function(done) {
  setTimeout(function() {
    console.log('this is foo');
    done();
  }, 500);
});

var fn = app.parallel('foo', function bar(done) {
  console.log('this is bar');
  done();
});

fn(function(err) {
  if (err) return console.error(err);
  console.log('done');
});
//=> this is bar
//=> this is foo
//=> done
```

### [.watch](index.js#L234)

Watch a file, directory, or glob pattern for changes and build a task or list of tasks when changes are made. Watch is powered by [chokidar](https://github.com/paulmillr/chokidar) so arguments can be anything supported by [chokidar.watch](https://github.com/paulmillr/chokidar#api).

**Params**

* `glob` **{String|Array}**: Filename, Directory name, or glob pattern to watch
* `options` **{Object}**: Additional options to be passed to [chokidar](https://github.com/paulmillr/chokidar)
* `tasks` **{String|Array|Function}**: Tasks that are passed to `.build` when files in the glob are changed.
* `returns` **{Object}**: Returns an instance of `FSWatcher` from [chokidar](https://github.com/paulmillr/chokidar)

**Example**

```js
var watcher = app.watch('templates/pages/*.hbs', ['site']);
```

## Events

[composer](https://github.com/jonschlinkert/composer) is an event emitter that may emit the following events:

### starting

This event is emitted when a `build` is starting.

The event emits 2 arguments, the current instance of [composer](https://github.com/jonschlinkert/composer) as the `app` and an object containing the build runtime information.

```js
app.on('starting', function(app, build) {});
```

* `build` exposes a `.date` object that has a `.start` property containing the start time as a `Date` object.
* `build` exposes a `.hr` object that has a `.start` property containing the start time as an `hrtime` array.

### finished

This event is emitted when a `build` has finished.

The event emits 2 arguments, the current instance of [composer](https://github.com/jonschlinkert/composer) as the `app` and an object containing the build runtime information.

```js
app.on('finished', function(app, build) {});
```

* `build` exposes a `.date` object that has `.start` and `.end` properties containing start and end times of the build as `Date` objects.
* `build` exposes a `.hr` object that has `.start`, `.end`, `.duration`, and `.diff` properties containing timing information calculated using `process.hrtime`

### error

This event is emitted when an error occurrs during a `build`.
The event emits 1 argument as an `Error` object containing additional information about the build and the task running when the error occurred.

```js
app.on('error', function(err) {});
```

Additional properties:

* `app`: current composer instance running the build
* `build`: current build runtime information
* `task`: current task instance running when the error occurred
* `run`: current task runtime information

### task:starting

This event is emitted when a task is starting.
The event emits 2 arguments, the current instance of the task object and an object containing the task runtime information.

```js
app.on('task:starting', function(task, run) {});
```

The `run` parameter exposes:

* `.date` **{Object}**: has a `.start` property containing the start time as a `Date` object.
* `.hr` **{Object}**: has a `.start` property containing the start time as an `hrtime` array.

### task:finished

This event is emitted when a task has finished.

The event emits 2 arguments, the current instance of the task object and an object containing the task runtime information.

```js
app.on('task:finished', function(task, run) {});
```

The `run` parameter exposes:

* `.date` **{Object}**: has a `.date` object that has `.start` and `.end` properties containing start and end times of the task as `Date` objects.
* `run` **{Object}**: has an `.hr` object that has `.start`, `.end`, `.duration`, and `.diff` properties containing timing information calculated using `process.hrtime`

### task:error

This event is emitted when an error occurrs while running a task.
The event emits 1 argument as an `Error` object containing additional information about the task running when the error occurred.

```js
app.on('task:error', function(err) {});
```

**Additional properties**

* `task`: current task instance running when the error occurred
* `run`: current task runtime information

## Related projects

* [assemble](https://www.npmjs.com/package/assemble): Assemble is a powerful, extendable and easy to use static site generator for node.js. Used… [more](https://www.npmjs.com/package/assemble) | [homepage](https://github.com/assemble/assemble)
* [generate](https://www.npmjs.com/package/generate): Fast, composable, highly extendable project generator with a user-friendly and expressive API. | [homepage](https://github.com/generate/generate)
* [templates](https://www.npmjs.com/package/templates): System for creating and managing template collections, and rendering templates with any node.js template engine.… [more](https://www.npmjs.com/package/templates) | [homepage](https://github.com/jonschlinkert/templates)
* [update](https://www.npmjs.com/package/update): Easily keep anything in your project up-to-date by installing the updaters you want to use… [more](https://www.npmjs.com/package/update) | [homepage](https://github.com/update/update)
* [verb](https://www.npmjs.com/package/verb): Documentation generator for GitHub projects. Verb is extremely powerful, easy to use, and is used… [more](https://www.npmjs.com/package/verb) | [homepage](https://github.com/verbose/verb)

## Running tests

Install dev dependencies:

```sh
$ npm i -d && npm test
```

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/jonschlinkert/composer/issues/new).

## Author

**Jon Schlinkert**

* [github/jonschlinkert](https://github.com/jonschlinkert)
* [twitter/jonschlinkert](http://twitter.com/jonschlinkert)

## License

Copyright © 2016 [Jon Schlinkert](https://github.com/jonschlinkert)
Released under the MIT license.

***

_This file was generated by [verb](https://github.com/verbose/verb) on January 26, 2016._