'use strict';

var should = require('should');
var rimraf = require('rimraf');
var application = require('..');

var actual = __dirname + '/layouts-actual';
var app;

describe('app layouts', function () {
  beforeEach(function (done) {
    app = new application.Composer();
    rimraf(actual, done);
  });
  afterEach(function (done) {
    rimraf(actual, done);
  });

  describe('caching', function () {
    it('should be a method on app.', function () {
      app.layouts.should.be.a.function;
    });

    it('should return an empty array..', function () {
      app.views.layouts.should.be.empty;
    });

    it('should cache a layout defined as an object.', function () {
      app.layout({
        path: 'a',
        data: {title: 'a'},
        content: 'Test layout A content',
        ext: '.hbs'
      });

      var layouts = app.views.layouts;
      layouts.should.have.property('a');
    });

    it('should cache an object of layouts defined as objects.', function () {
      app.layouts({
        a: {
          data: {title: 'a'},
          content: 'Test layout A content',
          ext: '.hbs'
        },
        b: {
          data: {title: 'b'},
          content: 'Test layout B content',
          ext: '.hbs'
        },
        c: {
          data: {title: 'c'},
          content: 'Test layout C content',
          ext: '.hbs'
        }
      });

      var layouts = app.views.layouts;
      layouts.should.have.property('a');
      layouts.should.have.property('b');
      layouts.should.have.property('c');
    });

    it('should cache an object of layouts defined as a string of glob patterns.', function () {
      app.layouts('test/fixtures/templates/layouts/*.hbs');

      var layouts = app.views.layouts;
      layouts.should.have.property('a');
      layouts.should.have.property('b');
      layouts.should.have.property('c');
    });
  });

  describe.skip('.layout()', function () {
    it('should apply a layout defined on src.', function (done) {
      app.layout('foo', '<a>{% body %}<c>');

      app.src('test/fixtures/templates/a.hbs', {layout: 'foo'})
        .pipe(app.renderFile())
        .on('data', function (file) {
          file.contents.toString().should.equal('<a>Page: AAA<c>');
        })
        .on('end', function () {
          done();
        });
    });

    it('should apply a layout defined on src.', function (done) {
      app.layout('foo', '<a>{% body %}<c>', {layout: 'bar'});
      app.layout('bar', '<a>{% body %}<c>', {layout: 'baz'});
      app.layout('baz', '<a>{% body %}<c>');

      app.src('test/fixtures/templates/a.hbs', {layout: 'foo'})
        .pipe(app.renderFile())
        .on('data', function (file) {
          file.contents.toString().should.equal('<a>Page: AAA<c>');
        })
        .on('end', function () {
          done();
        });
    });
  });
});
