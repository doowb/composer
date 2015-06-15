'use strict';

require('mocha');
var fs = require('fs');
var path = require('path');
var should = require('should');
var rimraf = require('rimraf');

var application = require('..');
var dest = path.join(__dirname, 'expected');
var app;

describe('app output stream', function() {
  describe('minimal config - enabled', function () {
    beforeEach(function (done) {
      app = new application.Composer();
      app.enable('minimal config');
      rimraf(dest, done);
    });

    afterEach(function (done) {
      app.disable('minimal config');
      rimraf(dest, done);
    });

    it('should return a stream', function (done) {
      var stream = app.dest(path.join(__dirname, 'fixtures/'));
      should.exist(stream);
      should.exist(stream.on);
      done();
    });

    it('should return an output stream that writes files', function (done) {
      var instream = app.src(path.join(__dirname, 'fixtures/copy/*.txt'));
      var outstream = app.dest(dest);
      instream.pipe(outstream);

      outstream.on('error', done);
      outstream.on('data', function (file) {
        should.exist(file);
        should.exist(file.path);
        should.exist(file.contents);
        path.join(file.path, '').should.equal(path.join(dest, 'example.txt'));
        String(file.contents).should.equal('this is a test');
      });

      outstream.on('end', function () {
        fs.readFile(path.join(dest, 'example.txt'), function (err, contents) {
          should.not.exist(err);
          should.exist(contents);
          String(contents).should.equal('this is a test');
          done();
        });
      });
    });

    it('should return an output stream that does not write non-read files', function (done) {
      var instream = app.src(path.join(__dirname, 'fixtures/copy/*.txt'), {read: false});
      var outstream = app.dest(dest);
      instream.pipe(outstream);

      outstream.on('error', done);
      outstream.on('data', function (file) {
        should.exist(file);
        should.exist(file.path);
        should.not.exist(file.contents);
        path.join(file.path, '').should.equal(path.join(dest, 'example.txt'));
      });

      outstream.on('end', function () {
        fs.readFile(path.join(dest, 'example.txt'), function (err, contents) {
          should.exist(err);
          should.not.exist(contents);
          done();
        });
      });
    });

    it('should return an output stream that writes streaming files', function (done) {
      var instream = app.src(path.join(__dirname, 'fixtures/copy/*.txt'), {buffer: false});
      var outstream = instream.pipe(app.dest(dest));

      outstream.on('error', done);
      outstream.on('data', function (file) {
        should.exist(file);
        should.exist(file.path);
        should.exist(file.contents);
        path.join(file.path, '').should.equal(path.join(dest, 'example.txt'));
      });

      outstream.on('end', function () {
        fs.readFile(path.join(dest, 'example.txt'), function (err, contents) {
          should.not.exist(err);
          should.exist(contents);
          String(contents).should.equal('this is a test');
          done();
        });
      });
    });

    it('should return an output stream that doesn\'t curropt file contents', function (done) {
      var instream = app.src(path.join(__dirname, 'fixtures/copy/*.png'));
      var outstream = app.dest(dest);
      instream.pipe(outstream);

      outstream.on('error', done);
      outstream.on('data', function (file) {
        should.exist(file);
        should.exist(file.path);
        should.exist(file.contents);
        path.join(file.path, '').should.equal(path.join(dest, 'app.png'));
      });

      outstream.on('end', function () {
        fs.readFile(path.join(__dirname, 'fixtures/copy/app.png'), function (err, srcContents) {
          if (err) return done(err);
          fs.readFile(path.join(dest, 'app.png'), function (err, destContents) {
            should.not.exist(err);
            should.exist(destContents);
            srcContents.should.eql(destContents);
            done();
          });
        });
      });
    });


    it('should return an output stream that writes streaming files to new directories', function (done) {
      testWriteDir({}, done);
    });

    it('should return an output stream that writes streaming files to new directories (buffer: false)', function (done) {
      testWriteDir({buffer: false}, done);
    });

    it('should return an output stream that writes streaming files to new directories (read: false)', function (done) {
      testWriteDir({read: false}, done);
    });

    it('should return an output stream that writes streaming files to new directories (read: false, buffer: false)', function (done) {
      testWriteDir({buffer: false, read: false}, done);
    });

  });

  describe('minimal config - disabled', function () {
    beforeEach(function (done) {
      app = new application.Composer();
      app.option('ext', '.txt');
      rimraf(dest, done);
    });

    afterEach(function () {
      app.option('ext', '.html');
    });

    it('should return a stream', function (done) {
      var stream = app.dest(path.join(__dirname, 'fixtures/'));
      should.exist(stream);
      should.exist(stream.on);
      done();
    });

    it('should return an output stream that writes files', function (done) {
      app.disable('dest:render plugin');

      var instream = app.src(path.join(__dirname, 'fixtures/copy/*.txt'));
      var outstream = app.dest(dest, {ext: '.txt'});
      instream.pipe(outstream);

      outstream.on('error', done);
      outstream.on('data', function (file) {

        should.exist(file);
        should.exist(file.path);
        should.exist(file.contents);
        path.join(file.path, '').should.equal(path.join(dest, 'example.txt'));
        String(file.contents).should.equal('this is a test');
      });

      outstream.on('end', function () {
        fs.readFile(path.join(dest, 'example.txt'), function (err, contents) {
          should.not.exist(err);
          should.exist(contents);
          String(contents).should.equal('this is a test');
          done();
        });
      });
    });

    it('should return an output stream that does not write non-read files', function (done) {
      app.option({read: false});
      var instream = app.src(path.join(__dirname, 'fixtures/copy/*.txt'), {read: false});
      var outstream = app.dest(dest);
      instream.pipe(outstream);

      outstream.on('error', done);
      outstream.on('data', function (file) {

        should.exist(file);
        should.exist(file.path);
        should.not.exist(file.contents);
        path.join(file.path, '').should.equal(path.join(dest, 'example.txt'));
      });

      outstream.on('end', function () {
        fs.readFile(path.join(dest, 'example.txt'), function (err, contents) {
          should.exist(err);
          should.not.exist(contents);
          done();
        });
      });
    });

    it.skip('should throw an error when trying to write streaming files', function (done) {
      var instream = app.src(path.join(__dirname, 'fixtures/copy/*.txt'), {buffer: false});
      var outstream = app.dest(dest);
      var output = instream.pipe(outstream);

      instream.on('error', function (err) {
        console.log('error in instream', err);


      });
      instream.on('data', function () {


      });

      outstream.on('error', function (err) {
        console.log('error in outstream', err);


      });
      outstream.on('data', function () {


      });

      output.on('error', function (err) {
        console.log('error in output', err);


      });
      output.on('data', function () {


      });
      output.on('end', done);
    });

    it.skip('should return an output stream that doesn\'t curropt file contents', function (done) {
      var instream = app.src(path.join(__dirname, 'fixtures/copy/*.png'));
      var outstream = app.dest(dest);
      instream.pipe(outstream);

      outstream.on('error', done);
      outstream.on('data', function (file) {

        should.exist(file);
        should.exist(file.path);
        should.exist(file.contents);
        path.join(file.path, '').should.equal(path.join(dest, 'app.png'));
      });

      outstream.on('end', function () {
        fs.readFile(path.join(__dirname, 'fixtures/copy/app.png'), function (err, srcContents) {
          if (err) return done(err);
          fs.readFile(path.join(dest, 'app.png'), function (err, destContents) {
            should.not.exist(err);
            should.exist(destContents);
            srcContents.should.eql(destContents);
            done();
          });
        });
      });
    });

    it.skip('should return an output stream that writes streaming files to new directories', function (done) {
      testWriteDir({}, done);
    });

    it.skip('should return an output stream that writes streaming files to new directories (buffer: false)', function (done) {
      testWriteDir({buffer: false}, done);
    });

    it.skip('should return an output stream that writes streaming files to new directories (read: false)', function (done) {
      testWriteDir({read: false}, done);
    });

    it.skip('should return an output stream that writes streaming files to new directories (read: false, buffer: false)', function (done) {
      testWriteDir({buffer: false, read: false}, done);
    });

  });

  function testWriteDir(srcOptions, done) {
    var instream = app.src(path.join(__dirname, 'fixtures/generic'), srcOptions);
    var outstream = instream.pipe(app.dest(dest));
    outstream.on('error', done);
    outstream.on('data', function(file) {
      should.exist(file);
      should.exist(file.path);
      path.join(file.path,'').should.equal(path.join(dest, './generic'));
    });

    outstream.on('end', function() {
      fs.exists(path.join(dest, 'generic'), function(exists) {
        should(exists).be.ok;
        done();
      });
    });
  }
});