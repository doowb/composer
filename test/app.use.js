'use strict';

var should = require('should');
var application = require('..');
var tap = require('gulp-tap');
var path = require('path');
var rimraf = require('rimraf');

var outpath = path.join(__dirname, './out-fixtures');

describe('app use', function () {
  describe('app.use()', function () {
    var app = null;
    beforeEach(function (done) {
      app = new application.Composer();
      rimraf(outpath, done);
    });
    afterEach(function (done) {
      rimraf(outpath, done);
    });

    it('should use a middleware', function (done) {
      var actualCounter = 1;
      app.use(function (file, next) {
        file.data.counter = actualCounter++;
        next();
      });

      var expectedCounter = 1;
      app.src(path.join(__dirname, 'fixtures/templates/no-helpers/*.hbs'))
        .pipe(tap(function (file) {
          file.data.counter.should.equal(expectedCounter++);
        }))
        .pipe(app.dest(outpath))
        .on('end', done);
    });
  });
});
