'use strict';

var should = require('should');
var rimraf = require('rimraf');
var Assemble = require('..');

var actual = __dirname + '/partials-actual';

describe('app partials', function () {
  var app = null;
  beforeEach(function (done) {
    app = Assemble.init();
    rimraf(actual, done);
  });
  afterEach(function (done) {
    rimraf(actual, done);
  });

  describe('.partial()', function () {
    it('should be a method on app.', function () {
      app.partial.should.be.a.function;
    });

    it('should cache a partial defined as an object.', function () {
      app.partial({
        path: 'test-partial-a',
        data: {title: 'test-partial-a'},
        content: 'Test partial A content'
      });

      var partials = app.views.partials;
      partials.should.have.property('test-partial-a');
    });
  });

  describe('.partials()', function () {
    it('should be a method on app.', function () {
      app.partials.should.be.a.function;
    });

    it('should cache an object of partials defined as objects.', function () {
      app.partials({
        'test-partial-a': {
          data: {title: 'test-partial-a'},
          content: 'Test partial A content'
        },
        'test-partial-b': {
          data: {title: 'test-partial-b'},
          content: 'Test partial B content'
        },
        'test-partial-c': {
          data: {title: 'test-partial-c'},
          content: 'Test partial C content'
        }
      });

      var partials = app.views.partials;
      partials.should.have.property('test-partial-a');
      partials.should.have.property('test-partial-b');
      partials.should.have.property('test-partial-c');
    });

    it('should cache an object of partials defined as a string of glob patterns.', function () {
      app.partials('test/fixtures/templates/partials/*.hbs');
      var partials = app.views.partials;
      partials.should.have.property('a');
      partials.should.have.property('b');
      partials.should.have.property('c');
    });

    it('should use a renaming function on the partial names.', function () {
      app.partials('test/fixtures/templates/partials/*.hbs');
      app.option({
        name: function (fp) {
          return fp;
        }
      });
      var partials = app.views.partials;
      partials.should.have.property('a');
      partials.should.have.property('b');
      partials.should.have.property('c');
    });
  });
});
