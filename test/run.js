'use strict';

require('mocha');
const assert = require('assert');
const Run = require('../lib/run');
let run;

describe('run', function() {
  beforeEach(function() {
    run = new Run(1);
  });

  it('should create a new run with a given `id`', function() {
    assert.equal(run.runId, 1);
  });

  it('should set run information when starting a run', function() {
    assert.equal(typeof run.date.start, 'undefined');
    assert.equal(typeof run.hr.start, 'undefined');
    assert.equal(run.duration, '');

    run.start();
    assert.notEqual(typeof run.date.start, 'undefined');
    assert.notEqual(typeof run.hr.start, 'undefined');
    assert.equal(typeof run.date.end, 'undefined');
    assert.equal(typeof run.hr.end, 'undefined');
    assert.equal(typeof run.hr.duration, 'undefined');
    assert.notEqual(run.duration, '');
  });

  it('should set run information when ending a run', function() {
    run.start();
    run.end();
    assert.notEqual(typeof run.date.start, 'undefined');
    assert.notEqual(typeof run.hr.start, 'undefined');
    assert.notEqual(typeof run.date.end, 'undefined');
    assert.notEqual(typeof run.hr.end, 'undefined');
    assert.notEqual(typeof run.hr.duration, 'undefined');
    assert.notEqual(typeof run.hr.diff, 'undefined');
    assert.notEqual(typeof run.hr.offset, 'undefined');
    assert.notEqual(run.duration, '');
  });
});
