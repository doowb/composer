'use strict';

var path = require('path');
var toTemplate = require('to-template');
var PluginError = require('plugin-error');
var through = require('through2');

module.exports = function (app) {
  // app.on('task_start', function (task) {
  //   console.log(task)
  // })

  if (!app.views.files) {
    app.create('files');
  }
  return through.obj(function (file, enc, cb) {
    try {
      app.files(path.basename(file.path), toTemplate(file));
      this.push(file);
      return cb();
    } catch (err) {
      this.emit('error', new PluginError('files plugin', err));
      return cb();
    }
  });
};
