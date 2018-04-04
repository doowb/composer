'use strict';

const Emitter = require('@sellside/emitter');
const Composer = require('./lib/tasks');
const Task = require('./lib/task');

module.exports = Composer(Emitter);
module.exports.Task = Task(Emitter);
module.exports.create = Composer;
