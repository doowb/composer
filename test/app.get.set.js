'use strict';

var assert = require('assert');
var should = require('should');
var application = require('..');

describe('app cache', function () {
  var app = null;
  beforeEach(function() {
    app = new application.App();
  });

  describe('.set()', function () {
    it('should set a value', function () {
      app.set('a', 'b');
      app.get('a').should.equal('b');
    });

    it('should set properties on the `cache` object.', function () {
      app.set('a', 'b');
      app.cache.a.should.equal('b');
    });

    it('should allow an object to be set directly.', function () {
      app.set({x: 'y'});
      app.cache.x.should.equal('y');
      app.get('x').should.equal('y');
    });

    it('should set nested properties on the `cache` object.', function () {
      app.set('c', {d: 'e'});
      app.get('c').d.should.equal('e');
    });

    it('should use dot notation to `set` values.', function () {
      app.set('h.i', 'j');
      app.get('h').should.eql({i: 'j'});
    });

    it('should use dot notation to `get` values.', function () {
      app.set('h', {i: 'j'});
      app.get('h.i').should.equal('j');
    });

    it('should return `this` for chaining', function () {
      app.set('a', 'b').should.equal(app);
      app
        .set('aa', 'bb')
        .set('bb', 'cc')
        .set('cc', 'dd');
      app.get('aa').should.equal('bb');
      app.get('bb').should.equal('cc');
      app.get('cc').should.equal('dd');
    });

    it('should expand template strings in the config.', function () {
      app
        .set('l', 'm')
        .set('j', {k: '${l}'}, true);
      app.cache.j.k.should.eql('m');
      app.get('j.k').should.eql('m');
    });

    it('should return undefined when not set', function () {
      app.set('a', undefined).should.equal(app);
    });
  });

  describe('.get()', function () {
    it('should return undefined when no set', function () {
      assert(app.option('a') === undefined);
    });

    it('should otherwise return the value', function () {
      app.set('a', 'b');
      app.get('a').should.equal('b');
    });
  });


  describe('.exists()', function () {
    it('should return `false` when not set', function () {
      app.exists('alsjls').should.be.false;
    });

    it('should return `true` when set.', function () {
      app.set('baba', 'zz');
      app.exists('baba').should.be.ok;
    });
  });

  describe('.enable()', function () {
    it('should set the value to true', function () {
      app.enable('foo').should.equal(app);
      app.option('foo').should.be.ok;
    });
  });

  describe('.disable()', function () {
    it('should set the value to false', function () {
      app.disable('foo').should.equal(app);
      app.option('foo').should.be.false;
    });
  });

  describe('.enabled()', function () {
    it('should default to false', function () {
      app.enabled('xyz').should.be.false;
    });

    it('should return true when set', function () {
      app.option('a', 'b');
      app.enabled('a').should.be.ok;
    });
  });

  describe('.disabled()', function () {
    it('should default to true', function () {
      app.disabled('xyz').should.be.ok;
    });

    it('should return false when set', function () {
      app.option('abc', 'xyz');
      app.disabled('abc').should.be.false;
    });
  });
});
