'use strict';

function Composer (config) {
  this.config = config || {}
}

module.exports = new Composer();
module.exports.Composer = Composer;
