When an individual task is run, a new [Run](lib/run.js) instance is created with start, end, and duration information. This `run` object is emitted with [some events](#taskstarting) and also exposed on the `task` instance as the `.runInfo` property.

### properties

The `run` instance has the the following properties

**.date**

The `.date` property is an object containing the `.start` and `.end` date timestamps created with `new Date()`.

**.hr**

The `.hr` property is an object containing the `.start`, `.end` and `.duration` properties that are created by using `process.hrtime()`. These properties are the actual arrays returned from `process.hrtime()`.
There is also `.diff` and `.offset` computed properties that use the other properties to calculate the difference between `.start` and `.end` times (`.diff`) and the offset (error for time calculations) between the `.duration` and the `.diff` (this is usually very small).

**.duration**

The `.duration` property is a computed property that uses [pretty-time][] to format the `.hr.duration` value into a human readable format.
