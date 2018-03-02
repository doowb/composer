'use strict';

const define = require('define-property');
const nano = require('nanoseconds');
const time = require('pretty-time');

/**
 * `Run` represents a single execution of a `Task`.
 *
 * @param {Number} `id` identifier of this run.
 * @api public
 */

class Run {
  constructor(id) {
    this.runId = id;
    this.date = {};
    this.hr = {};

    /**
     * Calculate the difference between the `start` and `end` hr times in nanoseconds.
     *
     * @api public
     * @name hr.diff
     */

    define(this.hr, 'diff', {
      enumerable: true,
      configurable: true,
      get: function() {
        return nano(this.end) - nano(this.start);
      }
    });

    /**
     * Calculate the offset between the hr `duration` and hr `diff` properties in nanoseconds.
     * This may be needed because `duration` is called with `process.hrtime(hr.start)` after `hr.end`
     * is calculated using `process.hrtime()`.
     *
     * @api public
     * @name hr.offset
     */

    define(this.hr, 'offset', {
      enumerable: true,
      configurable: true,
      get: function() {
        return nano(this.duration) - this.diff;
      }
    });
  }

  /**
   * Start recording the run times. This will save the start date on `run.date.start` and the start hr time on `run.hr.start`
   */

  start() {
    this.status = 'starting';
    this.date.start = new Date();
    this.hr.start = process.hrtime();
  }

  /**
   * Stop recording the run times. This will save the end hr time on `run.hr.end`,
   * calculate the duration using `process.hrtime(run.hr.start)`,
   * and save the end date on `run.date.end`
   *
   * `end` is calculated before `duration` causing `duration` to be approximately 10,000 nanoseconds off.
   * See `offset` for actual `offset`
   */

  end() {
    this.hr.end = process.hrtime();
    this.duration = process.hrtime(this.hr.start);
    this.date.end = new Date();
    this.status = 'finished';
  }

  /**
   * Formatted duration using [pretty-time][]. This is the duration from
   * [hr.duration](#hrduration) formatted into a nicer string. If `hr.duration`
   * is undefined, then an empty string is returned.
   *
   * @api public
   * @name duration
   */

  set duration(val) {
    this.hr.duration = val;
  }
  get duration() {
    if (this.hr.duration) {
      return time(this.hr.duration);
    }
    if (this.hr.start) {
      return time(process.hrtime(this.hr.start));
    }
    return '';
  }
}

/**
 * Expose `Run`
 */

module.exports = Run;
