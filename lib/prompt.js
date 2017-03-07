'use strict';

var Confirm = require('prompt-confirm');

module.exports = function(app, options) {
  var opts = Object.assign({}, options);
  return function(cb) {
    var confirm = new Confirm({name: opts.name, message: opts.message});
    confirm.ask(function(answer) {
      if (answer === true) {
        app.build(opts.fn, cb);
      } else {
        app.build(opts.inverse, cb);
      }
    });
  };
};
