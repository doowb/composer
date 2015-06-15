'use strict';

var assert = require('assert');
var should = require('should');
var application = require('..');


describe('app omit', function () {
  var app = null;
  beforeEach(function () {
    app = new application.App();
  });

  describe('.omit()', function () {

    it('should omit a value from the cache', function () {
      app.set('a', 'b');
      app.set('b', 'c');

      
      app.get('a').should.equal('b');
      app.get('b').should.equal('c');
      app.omit('a');

      
      assert.equal(typeof app.get('a'), 'undefined');
      assert.equal(app.get('b'), 'c');
    });

    it('should omit an array of values from the cache', function () {
      app
      	.set('a', 'a')
      	.set('b', 'b')
      	.set('c', 'c')
      	.set('d', 'd')
        .set('e', 'e');

      
      app.get('a').should.equal('a');
      app.get('b').should.equal('b');
      app.get('c').should.equal('c');
      app.get('d').should.equal('d');
      app.get('e').should.equal('e');

      app.omit(['a', 'b', 'c', 'd']);

      
      assert(app.get('a') == undefined);
      assert(app.get('b') == undefined);
      assert(app.get('c') == undefined);
      assert(app.get('d') == undefined);
      assert(app.get('e') != undefined);
    });

  });
});
