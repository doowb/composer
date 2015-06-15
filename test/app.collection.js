'use strict';

/**/
var should = require('should');
var Assemble = require('..');
var app;


describe.skip('app collection', function () {
  beforeEach(function () {
    app = Assemble.init();
  });

  describe('.collection()', function () {
    it.skip('should return a stream', function (done) {
      
      should.exist(stream);
      should.exist(stream.on);
      done();
    });

    it.skip('should generate index pages', function () {});
    it.skip('should generate related pages', function () {});
  });
});
