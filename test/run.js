'use strict';

var async = require('async');
var assert = require('assert');
var Run = require('../lib/run');

describe('run', function() {
  it('should create a new run with a given `id`', function() {
    var run = new Run(1);
    assert.equal(run.runId, 1);
  });

  it('should create a new run with a given `id` without using new', function() {
    var run = Run(1);
    assert.equal(run.runId, 1);
  });

  it('should set run information when starting a run', function() {
    var run = new Run(1);
    run.start();
    assert(typeof run.date.start !== 'undefined');
    assert(typeof run.hr.start !== 'undefined');
    assert(typeof run.date.end === 'undefined');
    assert(typeof run.hr.end === 'undefined');
    assert(typeof run.hr.duration === 'undefined');
  });

  it('should set run information when ending a run', function() {
    var run = new Run(1);
    run.start();
    run.end();
    assert(typeof run.date.start !== 'undefined');
    assert(typeof run.hr.start !== 'undefined');
    assert(typeof run.date.end !== 'undefined');
    assert(typeof run.hr.end !== 'undefined');
    assert(typeof run.hr.duration !== 'undefined');
    assert(typeof run.hr.diff !== 'undefined');
    assert(typeof run.hr.offset !== 'undefined');
  });
});
