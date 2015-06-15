'use strict';

var init = require('./transforms/');

/**
 * Load baseline transforms
 *  | config
 *  | loaders
 *  | plugins
 *  | middleware
 */

module.exports = function(app) {
  app.transform('loaders', init.loaders);
  app.transform('plugins', init.plugins);

  app.once('loaded', function () {
    app.transform('argv', init.argv);
    app.transform('config', init.config);
    app.transform('middleware', init.middleware);
  });
};
