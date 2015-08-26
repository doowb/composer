'use strict';

var util = require('util');
var Composer = require('../');

function App () {
  Composer.call(this);
}

util.inherits(App, Composer);

module.exports = new App();
