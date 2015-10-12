'use strict';

/* deps: mocha */
var assert = require('assert');
var fs = require('fs');

var Composer = require('../');
var composer, watch;

describe('composer', function () {
  beforeEach(function () {
    composer = new Composer();
    composer.on('error', console.log);
  });

  afterEach(function () {
    if (watch && watch.close) {
      watch.close();
    }
  });

  it('should watch files and run a task when files change', function (done) {
    var count = 0;
    composer.task('default', function (cb) {
      count++;
      cb();
    });

    composer.task('close', function (cb) {
      cb();
      composer.emit('close');
    });

    composer.task('watch', function (cb) {
      composer.on('close', cb);
      watch = composer.watch('test/fixtures/foo.txt', ['default', 'close']);
      fs.writeFileSync('test/fixtures/foo.txt', 'bar');
    });

    composer.build(['watch'], function (err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should watch files with given options and run a task when files change', function (done) {
    var count = 0;
    composer.task('default', function (cb) {
      count++;
      cb();
    });

    composer.task('close', function (cb) {
      cb();
      composer.emit('close');
    });

    composer.task('watch', function (cb) {
      composer.on('close', cb);
      watch = composer.watch('foo.txt', {cwd: 'test/fixtures'}, ['default', 'close']);
      fs.writeFileSync('test/fixtures/foo.txt', 'bar');
    });

    composer.build(['watch'], function (err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should watch files without given tasks', function (done) {
    var count = 0;
    composer.task('default', function (cb) {
      count++;
      cb();
    });

    composer.task('watch', function (cb) {
      watch = composer.watch('test/fixtures/foo.txt');
      watch.on('change', function () {
        composer.build(['default'], cb);
      });
      fs.writeFileSync('test/fixtures/foo.txt', 'bar');
    });

    composer.build(['watch'], function (err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });

  it('should watch files without given tasks and with given options', function (done) {
    var count = 0;
    composer.task('default', function (cb) {
      count++;
      cb();
    });

    composer.task('watch', function (cb) {
      watch = composer.watch('foo.txt', {cwd: 'test/fixtures', ignoreInitial: true});
      watch.on('all', function () {
        composer.build(['default'], cb);
      });
      fs.writeFileSync('test/fixtures/foo.txt', 'bar');
    });

    composer.build(['watch'], function (err) {
      if (err) return done(err);
      assert.equal(count, 1);
      done();
    });
  });
});
