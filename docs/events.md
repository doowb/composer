[composer][] is an event emitter that may emit the following events:

### build

This event is emitted when the build is starting and when it's finished. The event emits an object containing the build runtime information.

```js
app.on('build', build => {});
```

#### `build` properties

* `.app` (object) - instance of Composer
* `.status` (string) - current build status[^1], either `register`, `starting` or `finished`.
* `.date` (object) - with a `.start` property indicating start time as a `Date` object.
* `.hr` (object) - with a `.start` property indicating the start time as an `hrtime` array.
* `.duration` (string) - that will provide the duration in a human readable format.
* `.diff` (string) - diff between the start and end times.
* `.offset` (string) offset between the start date and the start `hr` time

[^1]: When `build.status` is `finished`, the `.hr` object also has `.duration` and `.diff` properties containing timing information calculated using `process.hrtime`.

### task

This event is emitted when the task is registered, starting, and when it's finished. The event emits 2 arguments, the current instance of the task object and an object containing the task runtime information.

```js
app.on('task', (task, run) => {});
```

#### `task` properties

* `.status` (string) - current status[^2] of the task. May be `register`, `starting`, or `finished`.

#### `run` properties

* `.date` (object) - has a `.start` property indicating the start time as a `Date` object.
* `.hr` (object) - has a `.start` property indicating the start time as an `hrtime` array.
* `.duration` (string) that will provide the duration in a human readable format.
* `.diff` (string) that will provide the diff between the start and end times.
* `.offset` (string) offset between the start date and the start hr time

[^2]: When `task.status` is `finished`, the `.hr` object also has `.duration` and `.diff` properties containing timing information calculated using `process.hrtime`.


### error

This event is emitted when an error occurrs during a `build`. The event emits an `Error` object with extra properties for debugging the _build and task_ that were running when the error occurred.

```js
app.on('error', err => {});
```

#### err properties

* `app`: current composer instance running the build
* `build`: current build runtime information
* `task`: current task instance running when the error occurred
* `run`: current task runtime information
