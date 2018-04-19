'use strict';

const utils = require('./utils');

class Timer {
  constructor() {
    this.date = {};
    this.hr = {};
  }

  start() {
    this.date.start = new Date();
    this.hr.start = process.hrtime();
    return this;
  }

  end() {
    this.date.end = new Date();
    this.hr.end = process.hrtime();
    this.hr.duration = process.hrtime(this.hr.start);
    return this;
  }

  get diff() {
    return utils.nano(this.hr.end) - utils.nano(this.hr.start);
  }

  get duration() {
    return this.hr.duration ? utils.time(this.hr.duration) : '';
  }
}

/**
 * Expose `Timer`
 */

module.exports = Timer;
