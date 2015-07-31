'use strict';

var lookup = require('./lookup');
module.exports = function (args) {
  var len = args.length, i = 0;
  var fns = new Array(len);
  while (len--) {
    var fn = args[i];
    if (typeof fn === 'string') {
      fn = lookup.call(this, fn);
    }
    fns[i++] = fn;
  }
  return fns;
}
