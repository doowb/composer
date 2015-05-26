'use strict';

var init = require('./transforms/');

/**
 * Load initialization transforms
 *
 *  | config
 *  | loaders
 *  | templates
 *  | defaults
 *  | middleware
 *  | plugins
 *  | load
 *  | engines
 *  | helpers
 */

module.exports = function(app) {
  app.transform('plugins', init.plugins);

  app.once('loaded', function () {
    app.transform('argv', init.argv);
    app.transform('config', init.config);
    app.transform('middleware', init.middleware);
  });
};
