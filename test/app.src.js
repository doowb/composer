'use strict';

var path = require('path');
var should = require('should');
var application = require('..');

describe('app input stream', function() {
  var app = null;

  describe('src()', function() {
    describe('minimal config - enabled', function () {
      beforeEach(function () {
        app = new application.App();
        app.enable('minimal config');
      });

      it('should return a stream', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/*.coffee'));
        should.exist(stream);
        should.exist(stream.on);
        done();
      });
      it('should return an input stream from a flat glob', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/*.coffee'));
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          should.exist(file.contents);
          path.join(file.path, '').should.equal(path.join(__dirname, './fixtures/test.coffee'));
          String(file.contents).should.equal('this is a test');
        });
        stream.on('end', function () {
          done();
        });
      });

      it('should return an input stream for multiple globs', function (done) {
        var globArray = [
          path.join(__dirname, './fixtures/generic/run.dmc'),
          path.join(__dirname, './fixtures/generic/test.dmc')
        ];
        var stream = app.src(globArray);

        var files = [];
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          files.push(file);
        });
        stream.on('end', function () {
          files.length.should.equal(2);
          files[0].path.should.equal(globArray[0]);
          files[1].path.should.equal(globArray[1]);
          done();
        });
      });

      it('should return an input stream for multiple globs, with negation', function (done) {
        var expectedPath = path.join(__dirname, './fixtures/generic/run.dmc');
        var globArray = [
          path.join(__dirname, './fixtures/generic/*.dmc'),
          '!' + path.join(__dirname, './fixtures/generic/test.dmc'),
        ];
        var stream = app.src(globArray);

        var files = [];
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          files.push(file);
        });
        stream.on('end', function () {
          files.length.should.equal(1);
          files[0].path.should.equal(expectedPath);
          done();
        });
      });

      it('should return an input stream with no contents when read is false', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/*.coffee'), {read: false});
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          should.not.exist(file.contents);
          path.join(file.path, '').should.equal(path.join(__dirname, './fixtures/test.coffee'));
        });
        stream.on('end', function () {
          done();
        });
      });
      it('should return an input stream with contents as stream when buffer is false', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/*.coffee'), {buffer: false});
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          should.exist(file.contents);
          var buf = '';
          file.contents.on('data', function (d) {
            buf += d;
          });
          file.contents.on('end', function () {
            buf.should.equal('this is a test');
            done();
          });
          path.join(file.path, '').should.equal(path.join(__dirname, './fixtures/test.coffee'));
        });
      });
      it('should return an input stream from a deep glob', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/**/*.jade'));
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          should.exist(file.contents);
          path.join(file.path, '').should.equal('test/fixtures/test/run.jade');
          String(file.contents).should.equal('test template');
        });
        stream.on('end', function () {
          done();
        });
      });
      it('should return an input stream from a deeper glob', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/**/*.dmc'));
        var a = 0;
        stream.on('error', done);
        stream.on('data', function () {
          ++a;
        });
        stream.on('end', function () {
          a.should.equal(2);
          done();
        });
      });

      it('should return a file stream from a flat path', function (done) {
        var a = 0;
        var stream = app.src(path.join(__dirname, './fixtures/test.coffee'));
        stream.on('error', done);
        stream.on('data', function (file) {
          ++a;
          should.exist(file);
          should.exist(file.path);
          should.exist(file.contents);
          path.join(file.path, '').should.equal(path.resolve(__dirname, './fixtures/test.coffee'));
          String(file.contents).should.equal('this is a test');
        });
        stream.on('end', function () {
          a.should.equal(1);
          done();
        });
      });
    });

    describe('minimal config - disabled', function () {
      beforeEach(function () {
        app = new application.App();
      });

      it('should return a stream', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/*.coffee'));
        should.exist(stream);
        should.exist(stream.on);
        done();
      });
      it('should return an input stream from a flat glob', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/*.coffee'));
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          should.exist(file.contents);
          path.join(file.path, '').should.equal(path.resolve('test/fixtures/test.coffee'));
          String(file.contents).should.equal('this is a test');
        });
        stream.on('end', function () {
          done();
        });
      });

      it('should return an input stream for multiple globs', function (done) {
        var globArray = [
          path.join(__dirname, './fixtures/generic/run.dmc'),
          path.join(__dirname, './fixtures/generic/test.dmc')
        ];
        var stream = app.src(globArray);

        var files = [];
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          files.push(file);
        });
        stream.on('end', function () {
          files.length.should.equal(2);
          files[0].path.should.equal(path.resolve('test/fixtures/generic/run.dmc'));
          files[1].path.should.equal(path.resolve('test/fixtures/generic/test.dmc'));
          done();
        });
      });

      it('should return an input stream for multiple globs, with negation', function (done) {
        var globArray = [
          path.join(__dirname, './fixtures/generic/*.dmc'),
          '!' + path.join(__dirname, './fixtures/generic/test.dmc'),
        ];
        var stream = app.src(globArray);

        var files = [];
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          files.push(file);
        });
        stream.on('end', function () {
          files.length.should.equal(1);
          files[0].path.should.equal(path.resolve('test/fixtures/generic/run.dmc'));
          done();
        });
      });

      it('should return an input stream with no contents when read is false', function (done) {
        app.option({read: false});

        var stream = app.src(path.join(__dirname, './fixtures/*.coffee'), {read: false});
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          should.not.exist(file.contents);
          path.join(file.path, '').should.equal(path.resolve('test/fixtures/test.coffee'));
        });
        stream.on('end', function () {
          done();
        });
      });

      it.skip('should return a throw an error when buffer is false', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/*.coffee'), {buffer: false});
        stream.on('error', function () {
          done();
        });
        stream.on('data', function () {
          done(new Error('should have thrown an error'));
        });
      });

      it('should return an input stream from a deep glob', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/**/*.jade'));
        stream.on('error', done);
        stream.on('data', function (file) {
          should.exist(file);
          should.exist(file.path);
          should.exist(file.contents);
          path.join(file.path, '').should.equal('test/fixtures/test/run.jade');
          String(file.contents).should.equal('test template');
        });
        stream.on('end', function () {
          done();
        });
      });
      it('should return an input stream from a deeper glob', function (done) {
        var stream = app.src(path.join(__dirname, './fixtures/**/*.dmc'));
        var a = 0;
        stream.on('error', done);
        stream.on('data', function () {
          ++a;
        });
        stream.on('end', function () {
          a.should.equal(2);
          done();
        });
      });

      it('should return a file stream from a flat path', function (done) {
        var a = 0;
        var stream = app.src(path.join(__dirname, './fixtures/test.coffee'));
        stream.on('error', done);
        stream.on('data', function (file) {
          ++a;
          should.exist(file);
          should.exist(file.path);
          should.exist(file.contents);
          path.join(file.path, '').should.equal(path.resolve('test/fixtures/test.coffee'));
          String(file.contents).should.equal('this is a test');
        });
        stream.on('end', function () {
          a.should.equal(1);
          done();
        });
      });
    });

  });
});
