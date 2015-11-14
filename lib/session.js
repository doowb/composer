'use strict';

var utils = require('./utils');

module.exports = function(name) {
  return utils.session(name);
};
