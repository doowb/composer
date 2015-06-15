'use strict';

var path = require('path');
var tap = require('gulp-tap');
var should = require('should');
var rimraf = require('rimraf');
var Assemble = require('..');

var app = null;
var actual = __dirname + '/actual/dest-path-actual';

describe('dest-paths plugin', function() {
  before (function () {
    app = Assemble.init();
  });

  beforeEach(function (done) {
    rimraf(actual, done);
  });
  afterEach(function (done) {
    rimraf(actual, done);
  });

  describe('when files are run through the pipe', function () {
    it('should keep dest the same before the dest path plugin is run.', function (done) {
      app.option('assets', actual + '/assets');
      var instream = app.src(path.join(__dirname, 'fixtures/paths/*.txt'));
      var outstream = app.dest(actual);

      var i = 0;
      instream
        .pipe(tap(function (file) {
          i++;
          should.exist(file);
          should.exist(file.path);
          should.exist(file.contents);
          file.data.src.path.should.match(/fixtures\/paths\/[a-c]\.txt/);
        }))
        .pipe(outstream)
        .pipe(tap(function (file) {
          file.data.dest.extname.should.equal('.txt');
          file.data.dest.path.should.match(/dest-path-actual\/[a-z]+\.txt/);
        }))

      outstream.on('error', done);
      outstream.on('end', function () {
        i.should.equal(3);
        done();
      });

    });

    it('should calculate the correct `assets` property on the file when the dest changes.', function (done) {
      app.option('assets', actual + '/assets');
      var instream = app.src(path.join(__dirname, 'fixtures/paths/*.txt'));
      var outstream = app.dest(actual);
      instream.pipe(outstream);

      outstream.on('error', done);
      outstream.on('data', function (file) {
        should.exist(file);
        should.exist(file.path);
        should.exist(file.contents);
        file.data.dest.extname.should.equal('.txt');
        file.data.dest.path.should.match(/dest-path-actual\/[a-z]+\.txt/);
      });

      outstream.on('end', function () {
        done();
      });
    });
  });
});
