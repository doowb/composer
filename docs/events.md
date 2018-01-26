[composer][] is an event emitter that may emit the following events:

### build

This event is emitted when the build is starting and when it's finished. The event emits an object containing the build runtime information.

```js
app.on('build', function(build) {});
```
* `build` exposes a `.app` object that is the instance of composer.
* `build` exposes a `.status` property that is either `starting` or `finished`.
* `build` exposes a `.date` object that has a `.start` property containing the start time as a `Date` object.
* `build` exposes a `.hr` object that has a `.start` property containing the start time as an `hrtime` array.
* `build` exposes a `.duration` getter that will provide the duration in a human readable format.
* `build` exposes a `.diff` getter that will provide the diff between the start and end times.
* `build` exposes a `.offset` getter that will provide the offset between the start date and the start hr time in case it's necessary for timing calculations.
* when `build.status` is `finished`, the `.hr` object also has `.duration` and `.diff` properties containing timing information calculated using `process.hrtime`.

### task

This event is emitted when the task is registered, starting, and when it's finished. The event emits 2 arguments, the current instance of the task object and an object containing the task runtime information.

```js
app.on('task', function(task, run) {});
```
The `task` parameter exposes:

* `.status` **{String}**: current status of the task. May be `register`, `starting`, or `finished`.

The `run` parameter exposes:

* `.date` **{Object}**: has a `.start` property containing the start time as a `Date` object.
* `.hr` **{Object}**: has a `.start` property containing the start time as an `hrtime` array.
* `.duration` getter that will provide the duration in a human readable format.
* `.diff` getter that will provide the diff between the start and end times.
* `.offset` getter that will provide the offset between the start date and the start hr time in case it's necessary for timing calculations.
* when `task.status` is `finished`, the `.hr` object also has `.duration` and `.diff` properties containing timing information calculated using `process.hrtime`.

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
