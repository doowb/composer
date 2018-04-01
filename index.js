'use strict';

const Tasks = require('./lib/tasks');
module.exports = Tasks(require('@sellside/emitter'));
module.exports.create = Tasks;
