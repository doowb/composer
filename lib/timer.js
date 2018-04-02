'use strict';

const nano = require('nanoseconds');
const time = require('pretty-time');
const utils = require('./utils');

class Timer {
  constructor(task) {
    utils.define(this, 'task', task);
    this.status = 'pending';
    this.date = {};
    this.hr = {
      get duration() {
        return process.hrtime(this.start);
      },
      get diff() {
        return nano(this.end) - nano(this.start);
      },
      get offset() {
        return nano(this.duration) - this.diff;
      }
    };
  }

  start() {
    this.status = 'starting';
    this.date.start = new Date();
    this.hr.start = process.hrtime();
    return this;
  }

  end() {
    this.status = 'finished';
    this.date.end = new Date();
    this.hr.end = process.hrtime();
    return this;
  }

  set duration(val) {
    this.hr.duration = val;
  }
  get duration() {
    return this.hr.duration ? time(this.hr.duration) : '';
  }
}

/**
 * Expose `Timer`
 */

module.exports = Timer;
