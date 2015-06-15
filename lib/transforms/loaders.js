'use strict';

var fs = require('fs');
var through = require('through2');
var glob = require('glob');
var File = require('vinyl');

/**
 * Register default loaders
 */

module.exports = function(app) {
  var opts = { loaderType: 'stream' };

  app.loader('glob', opts, function() {
    return through.obj(function (pattern, enc, cb) {
      var stream = this;
      glob(pattern, function (err, files) {
        if (err) return cb(err);
        stream.push(files);
        return cb();
      });
    });
  });

  app.loader('toVinyl', opts, ['glob'], through.obj(function (files, enc, cb) {
    files.forEach(function (fp) {
      this.push(new File({path: fp, contents: fs.readFileSync(fp)}));
    }.bind(this));
    return cb();
  }));
};
