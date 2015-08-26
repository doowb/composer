'use strict';

module.exports = function (name) {
  return require('session-cache')(name);
};
