'use strict';

const Emitter = require('@sellside/emitter');
const Composer = require('./lib/tasks');

module.exports = Composer(Emitter);
module.exports.Task = require('./lib/task');
module.exports.create = Composer;
