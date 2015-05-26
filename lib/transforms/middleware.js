'use strict';

var middleware = require('../middleware');

/**
 * Initialize default middleware
 */

module.exports = function(app) {
  app.onLoad(/./, middleware.props);
};
