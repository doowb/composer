'use strict';

var through = require('through2');
var PluginError = require('plugin-error');

module.exports = function(options) {
  options = options || {};
  var app = this;

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    file.content = file.contents.toString();
    try {
      var stream = this;
      app.render(file, options.locals, function (err, res) {
        if (err) {
          stream.emit('error', new PluginError('render-plugin', err));
          return cb(err);
        }
        file.contents = new Buffer(res);
        stream.push(file);
        return cb();
      });
    } catch (err) {
      this.emit('error', new PluginError('render plugin', err));
      return cb();
    }
  });
};
