'use strict';

var bold = require('ansi-bold');

/**
 * Delete a value from the config store.
 *
 * ```sh
 * $ --del foo
 * ```
 */

module.exports = function(app) {
  var config = app.config;
  var del = app.get('argv.del');
  if (del) {
    if (del.indexOf(',') !== -1) {
      del.split(',').forEach(function (val) {
        config.omit(val);
      });
    } else {
      config.omit(del);
    }
    console.log('deleted:', bold(del));
  }
};
