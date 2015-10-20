'use strict';

var utils = require('lazy-cache')(require);

var fn = require;
require = utils;
require('extend-shallow', 'extend');
require('session-cache', 'session');
require('nanoseconds', 'nano');
require('isobject');
require('chokidar');
require('bach');
require = fn;


module.exports = utils;
