'use strict';

var path = require('path');
var should = require('should');
var rimraf = require('rimraf');
var application = require('..');

var app = null;
var actual = __dirname + '/drafts-actual';

describe('app drafts plugin', function() {
  before (function () {
    app = new application.Composer();
  });

  describe('drafts()', function() {
    beforeEach(function (done) {
      rimraf(actual, done);
    });
    afterEach(function (done) {
      rimraf(actual, done);
    });

    describe('when `draft: true` is defined in front matter:', function () {
      it('should not generate pages.', function (done) {
        var instream = app.src(path.join(__dirname, 'fixtures/drafts/*.hbs'));
        var outstream = app.dest(actual);
        instream.pipe(outstream);

        var i = 0;
        outstream.on('error', done);
        outstream.on('data', function (file) {
          i++;
          should.exist(file);
          should.exist(file.path);
          should.exist(file.contents);
          if (i === 0) {
            String(file.path).should.match(/[cd]\.hbs$/);
            String(file.contents).should.match(/[baz]/i);
          }
          if (i === 1) {
            String(file.path).should.match(/[ab]\.hbs$/);
            String(file.contents).should.match(/[foo]/i);
          }
          Object.keys(app.views.pages).length.should.equal(3);
        });

        outstream.on('end', function () {
          i.should.equal(2);
          done();
        });
      });
    });
  });
});
