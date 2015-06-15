'use strict';

var path = require('path');
var tap = require('gulp-tap');
var should = require('should');
var rimraf = require('rimraf');
var application = require('..');

var app = null;
var actual = __dirname + '/assets-actual';

describe('app assets plugin', function() {
  before (function () {
    app = new application.Composer();
  });

  describe('assets()', function() {
    beforeEach(function (done) {
      rimraf(actual, done);
    });
    afterEach(function (done) {
      rimraf(actual, done);
    });

    describe('when `assets` is defined on options:', function () {
      it('should calculate the correct `assets` property on the file.', function (done) {
        app.set('assets', actual + '/assets');
        var instream = app.src(path.join(__dirname, 'fixtures/assets/*.hbs'));
        var outstream = app.dest(actual);

        instream
          .pipe(tap(function (file) {
            should.exist(file);
            should.exist(file.path);
            should.exist(file.contents);
            should.exist(file.data.assets);
            file.data.assets.should.equal('../../assets-actual/assets');
          }))
          .pipe(outstream);

        outstream.on('error', done);
        outstream.on('end', function () {
          done();
        });

      });

      it('should calculate the correct `assets` property on the file when the dest changes.', function (done) {
        app.set('assets', actual + '/assets');
        var instream = app.src(path.join(__dirname, 'fixtures/assets/*.hbs'));
        var outstream = app.dest(actual);
        instream.pipe(outstream);

        outstream.on('error', done);
        outstream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          should.exist(file.contents);
          should.exist(file.data.assets);
          file.data.assets.should.equal('assets');
          String(file.contents).should.match(/assets/);
        });

        outstream.on('end', function () {
          done();
        });
      });
    });
  });
});
