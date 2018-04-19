'use strict';

const Emitter = require('./lib/events');
const Tasks = require('./lib/tasks');
const Task = require('./lib/task');

module.exports = Tasks(Emitter);
module.exports.create = Tasks;
module.exports.Task = Task;
