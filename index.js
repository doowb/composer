'use strict';

var Emitter = require('component-emitter');
var flatten = require('arr-flatten');
var isObject = require('isobject');
var bach = require('bach');

var Task = require('./lib/task');
var noop = require('./lib/noop');
var map = require('./lib/map-deps');
var lookup = require('./lib/lookup');
var resolve = require('./lib/resolve');

function Composer (config) {
  Emitter.call(this);
  this.config = config || {}
  this.tasks = {};
}

require('util').inherits(Composer, Emitter);

Composer.prototype.register = function(name/*, options, dependencies and task */) {
  var deps = [].concat.apply([], [].slice.call(arguments, 1));
  var options = {};
  var fn = noop;
  if (typeof deps[deps.length-1] === 'function') {
    fn = deps.pop();
  }

  if (deps.length && isObject(deps[0])) {
    options = deps.shift();
  }

  options.deps = deps
    .concat(options.deps || [])
    .map(map.bind(this));

  var task = new Task({
    name: name,
    options: options,
    fn: fn
  });

  this.tasks[name] = task;
  return this;
};

Composer.prototype.run = function(/* list of tasks/functions to run */) {
  var args = [].concat.apply([], [].slice.call(arguments));
  var fns = resolve.call(this, args);
  var last = fns.pop();

  if (fns.length === 1) {
    return fns[0](last);
  }
  var batch =  bach.parallel.apply(bach, fns);
  return batch(last);
};

module.exports = new Composer();
module.exports.Composer = Composer;
