'use strict';

var cyan = require('ansi-cyan');
var bold = require('ansi-bold');

/**
 * Get a value from the config store.
 *
 * ```sh
 * $ --get one
 * # or
 * $ --get one,two,three
 * ```
 */

module.exports = function(app) {
  var config = app.config;
  var get = app.get('argv.get');

  if (get) {
    if (get === true || get === 'true') {
      console.log(cyan('config config:'), bold(JSON.stringify(config.data)));
    } else if (get.indexOf(',') !== -1) {
      get.split(',').forEach(function (val) {
        console.log(val, '=', bold(JSON.stringify(config.get(val))));
      });
    } else {
      console.log(get, '=', bold(JSON.stringify(config.get(get))));
    }
  }
};
