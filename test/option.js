'use strict';

var should = require('should');
var Assemble = require('..');


describe('options', function () {
  describe('.options()', function () {
    var app = null;
    beforeEach(function () {
      app = Assemble.init();
    });
    it('should set an option', function () {
      app.option('foo', 'bar');
      app.options.foo.should.exist;
      app.options.foo.should.equal('bar');
    });
    it('should get an option', function () {
      app.option('foo', 'bar');
      app.option('foo').should.exist;
      app.option('foo').should.equal('bar');
    });
  });
});
