'use strict';

var should = require('should');
var application = require('..');
var app;

describe('assets', function () {
  beforeEach(function () {
    app = new application.Composer();
  });

  describe('assets path', function () {
    it('should add an assets property to the data object.', function () {
      app.page({path: 'bbb', content: '---\ntitle: BBB\n---\nThis is content'});
      app.views.pages.should.have.property('bbb');
      app.views.pages.bbb.should.have.property('data');
      app.views.pages.bbb.data.should.have.property('assets', './assets');
    });

    it('should calculate the assets path relative to dest.path.', function () {
      app.page('c.hbs', {
        path: 'a/b/c.hbs',
        content: '---\ntitle: BBB\n---\nThis is content',
        data: {dest: {path: 'a/b/c.html'}}
      });
      app.views.pages.should.have.property('c');
      app.views.pages.c.should.have.property('data');
      app.views.pages.c.data.should.have.property('assets', './assets');
    });
  });

  describe('public path', function () {
    it('should add a public property to the data object.', function () {
      app.page({path: 'bbb', content: '---\ntitle: BBB\n---\nThis is content'});
      app.views.pages.should.have.property('bbb');
      app.views.pages.bbb.should.have.property('data');
      app.views.pages.bbb.data.should.have.property('public', './public');
    });

    it('should calculate the public path relative to dest.path.', function () {
      app.page('c.hbs', {
        path: 'a/b/c.hbs',
        content: '---\ntitle: BBB\n---\nThis is content',
        data: {dest: {path: 'a/b/c.html'}}
      });
      app.views.pages.should.have.property('c');
      app.views.pages.c.should.have.property('data');
      app.views.pages.c.data.should.have.property('public', './public');
    });
  });
});
