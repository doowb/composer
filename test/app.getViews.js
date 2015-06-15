'use strict';

var path = require('path');
var assert = require('assert');
var toTemplate = require('to-template');
var through = require('through2');
var should = require('should');
var composer = require('..');
var app;

describe('.getViews', function () {
  beforeEach(function () {
    app = new composer.Composer();
  });

  describe('when a collection name is specified.', function () {
    it('should get the specified collection:', function () {
      app.page('foo', 'this is foo...');
      app.page('bar', 'this is bar...');
      app.page('baz', 'this is baz...');

      var pages = app.getViews('pages');
      pages.should.have.properties(['foo', 'bar', 'baz']);
    });
  });

  describe('when a task is running.', function () {
    it.only('should get files from the specified task collection', function (done) {
      app.task('test_one', function () {
        var stream = app.src('test/fixtures/templates/partials/*.hbs');
        stream.on('error', function (err) {
          console.log(err);
          done();
        });
        stream.on('data', function () {
          // var collection = app.getViews('files');
          // console.log(collection)
          // assert(Object.keys(collection).length === 3);
          // assert(Object.keys(app.files).length === 3);
          // collection.should.have.properties(['a', 'b', 'c']);
          // app.files.should.have.properties(['a', 'b', 'c']);
          // app.files.should.equal(collection);
          done()
        });
        return stream;

      }); 
      app.task('default', ['test_one'], function () { done(); });
      app.run('default');
    });

    it('should get files from another task:', function (cb) {
      app.task('test_one', function () {
        var stream = app.src('test/fixtures/templates/partials/*.hbs');
        stream.on('end', function () {
          var collection = app.getViews();
          assert(Object.keys(collection).length === 3);
          assert(Object.keys(app.files).length === 3);
          collection.should.have.properties(['a', 'b', 'c']);
          app.files.should.have.properties(['a', 'b', 'c']);
          app.files.should.equal(collection);
        });
        return stream;
      });

      app.task('test_two', function () {
        var stream = app.src('test/fixtures/templates/partials/*.hbs');
        stream.on('end', function () {
          var collection = app.getViews();
          assert(Object.keys(collection).length === 3);
          assert(Object.keys(app.files).length === 3);
          collection.should.have.properties(['a', 'b', 'c']);
          app.files.should.have.properties(['a', 'b', 'c']);
          app.files.should.equal(collection);
        });
        return stream;
      });

      app.task('default', ['test_one', 'test_two'], function () { cb(); });
      app.run('default');
    });
  });
});
