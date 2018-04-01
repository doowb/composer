'use strict';

const Composer = require('./lib/tasks');
module.exports = Composer(require('@sellside/emitter'));
module.exports.create = Composer;
