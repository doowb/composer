'use strict';

/* deps: mocha */
var assert = require('assert');
var path = require('path');
var fs = require('fs');

var Composer = require('../');
var composer, watch;

describe('composer', function() {
  beforeEach(function() {
    composer = new Composer();
    composer.on('error', console.log);
  });

  afterEach(function() {
    if (watch && watch.close) {
      watch.close();
    }
  });

  it('should watch files and run a task when files change', function(done) {
    if (process.env.CI) return done();
    var count = 0;
    composer.task('default', function(cb) {
      count++;
      cb();
    });

    composer.task('close', function(cb) {
      cb();
      composer.emit('close');
    });

    composer.task('watch', function(cb) {
      composer.on('close', cb);
      watch = composer.watch(path.join(__dirname, 'fixtures/foo.txt'), ['default', 'close']);
      fs.writeFileSync(path.join(__dirname, 'fixtures/foo.txt'), 'bar');
    });

    composer.build(['watch'], function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should watch files with given options and run a task when files change', function(done) {
    if (process.env.CI) return done();
    var count = 0;
    composer.task('default', function(cb) {
      count++;
      cb();
    });

    composer.task('close', function(cb) {
      cb();
      composer.emit('close');
    });

    composer.task('watch', function(cb) {
      composer.on('close', cb);
      watch = composer.watch('foo.txt', {cwd: path.join(__dirname, 'fixtures')}, ['default', 'close']);
      fs.writeFileSync(path.join(__dirname, 'fixtures/foo.txt'), 'bar');
    });

    composer.build(['watch'], function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should watch files without given tasks', function(done) {
    if (process.env.CI) return done();
    var count = 0;
    composer.task('default', function(cb) {
      count++;
      cb();
    });

    composer.task('watch', function(cb) {
      watch = composer.watch(path.join(__dirname, 'fixtures/foo.txt'));
      watch.on('change', function() {
        composer.build(['default'], cb);
      });
      fs.writeFileSync(path.join(__dirname, 'fixtures/foo.txt'), 'bar');
    });

    composer.build(['watch'], function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should watch files without given tasks and with given options', function(done) {
    if (process.env.CI) return done();
    var count = 0;
    composer.task('default', function(cb) {
      count++;
      cb();
    });

    composer.task('watch', function(cb) {
      watch = composer.watch('foo.txt', {cwd: path.join(__dirname, 'fixtures'), ignoreInitial: true});
      watch.on('all', function() {
        composer.build(['default'], cb);
      });
      fs.writeFileSync(path.join(__dirname, 'fixtures/foo.txt'), 'bar');
    });

    composer.build(['watch'], function(err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });
});
