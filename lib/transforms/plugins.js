'use strict';

var paths = require('gulp-dest-paths');
var vfs = require('vinyl-fs');
var plugins = require('../plugins');

/**
 * Register default plugins.
 */

module.exports = function(app) {
  app.plugin('init', plugins.init(app));
  app.plugin('render', plugins.render(app));
  app.plugin('paths', paths);

  // vinyl
  app.plugin('src', vfs.src);
  app.plugin('dest', vfs.dest);
};
