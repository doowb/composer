'use strict';

var should = require('should');
var rimraf = require('rimraf');
var application = require('..');
var app = null;

var actual = __dirname + '/layouts-actual';

describe('app partials-layouts', function () {
  beforeEach(function (done) {
    app = new application.Composer();
    rimraf(actual, done);
  });
  afterEach(function (done) {
    rimraf(actual, done);
  });


  it('should use layouts defined in partials', function (done) {
    app.layouts({
      'default': {
        path: 'default',
        locals: {title: 'Default Layout'},
        content: 'LAYOUT A {{body}} LAYOUT A'
      },
      'slide': {
        path: 'slide',
        locals: {title: 'Slide Layout', layout: 'default'},
        content: 'SLIDE A {{body}} SLIDE A'
      },
      'LAAA': {
        path: 'LAAA',
        locals: {title: 'Layout AAA', layout: 'LAAA'},
        content: 'LAYOUT A {{body}} LAYOUT A'
      },
      'LBBB': {
        path: 'LBBB',
        locals: {title: 'Layout BBB', layout: 'LBBB'},
        content: 'LAYOUT B {{body}} LAYOUT B'
      },
      'LCCC': {
        path: 'LCCC',
        locals: {title: 'Layout CCC', layout: 'default'},
        content: 'LAYOUT C {{body}} LAYOUT C'
      }
    });

    var layouts = app.views.layouts;
    layouts.should.have.property('LAAA');
    layouts.should.have.property('LBBB');
    layouts.should.have.property('LCCC');

    app.partials({
      'P111': {
        path: 'P111',
        locals: {title: 'P111', layout: 'slide'},
        content: 'Partial 111 content'
      },
      'P222': {
        path: 'P222',
        locals: {title: 'P222', layout: 'slide'},
        content: 'Partial 222 content'
      },
      'P333': {
        path: 'P333',
        locals: {title: 'P333', layout: 'slide'},
        content: 'Partial 333 content'
      }
    });

    var partials = app.views.partials;
    partials.should.have.property('P111');
    partials.should.have.property('P222');
    partials.should.have.property('P333');

    app.pages({
      'PAGE111': {
        path: 'PAGE111',
        locals: {title: 'PAGE111', layout: 'LAAA'},
        content: 'Partial 111 content'
      },
      'PAGE222': {
        path: 'PAGE222',
        locals: {title: 'PAGE222', layout: 'LAAA'},
        content: 'Partial 222 content'
      },
      'PAGE333': {
        path: 'PAGE333',
        locals: {title: 'PAGE333', layout: 'LAAA'},
        content: 'Partial 333 content'
      }
    });

    var pages = app.views.pages;
    pages.should.have.property('PAGE111');
    pages.should.have.property('PAGE222');
    pages.should.have.property('PAGE333');

    done();


















  });
});
