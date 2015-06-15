'use strict';

var should = require('should');
var application = require('..');
var app;

describe('app data', function() {
  beforeEach(function () {
    app = new application.App();
  });

  describe('.data()', function() {
    it('should set properties on the `data` object.', function() {
      app.set('data.foo', 'bar');
      app.get('data').foo.should.equal('bar');
      app.get('data.foo').should.equal('bar');
    });

    it('should read files and merge data onto `cache.data`', function() {
      app.data('package.json', { namespace: false });
      app.get('data.name').should.equal('app-boilerplate');
    });

    it('should read files and merge data onto `cache.data.package`', function() {
      app.data('package.json', { namespace: true });
      app.get('data.package.name').should.equal('app-boilerplate');
    });

    it('should read files and merge data onto `cache.data`', function() {
      app.data({xyz: 'abc'});
      app.get('data.xyz').should.equal('abc');
    });

    it('should read files and merge data onto `cache.data`', function() {
      app.data([{aaa: 'bbb', ccc: 'ddd'}]);
      app.get('data.aaa').should.equal('bbb');
      app.get('data.ccc').should.equal('ddd');
    });
  });

  describe('.extendData()', function() {
    it('should extend the `data` object.', function() {
      app.extendData({x: 'x', y: 'y', z: 'z'});
      app.get('data').should.have.property('x');
      app.get('data').should.have.property('y');
      app.get('data').should.have.property('z');
    });
  });

  describe('.flattenData()', function() {
    it('should merge the value of a nested `data` property onto the root of the given object.', function() {
      var root = app.flattenData({data: {x: 'x'}, y: 'y', z: 'z'});
      root.should.have.property('x');
      root.should.have.property('y');
      root.should.have.property('z');
      root.should.not.have.property('data');
    });
  });

  describe('.plasma()', function() {
    it('should read JSON files and return an object.', function() {
      var pkg = app.plasma('package.json', { namespace: false });
      pkg.name.should.equal('app-boilerplate');
    });

    it('should expand a glob pattern, read JSON/YAML files and return an object.', function() {
      var pkg = app.plasma('p*.json', { namespace: false });
      pkg.name.should.equal('app-boilerplate');
    });

    it('should accept and object and return an object.', function() {
      var foo = app.plasma({a: 'b'});
      foo.a.should.equal('b');
    });
  });
});
