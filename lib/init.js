'use strict';

var init = require('./transforms/');

/**
 * Load baseline transforms
 *  | config
 *  | middleware
 *  | plugins
 */

module.exports = function(app) {
  app.transform('plugins', init.plugins);

  app.once('loaded', function () {
    app.transform('argv', init.argv);
    app.transform('config', init.config);
    app.transform('middleware', init.middleware);
  });
};
