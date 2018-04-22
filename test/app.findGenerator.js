'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('.findGenerator', function() {
  beforeEach(function() {
    base = new Generator();
  });

  it('should not throw an error when a generator is not found', function() {
    assert.doesNotThrow(() => base.findGenerator('whatever'), /cannot find/);
  });

  it('should not throw an error when a generator is not found on a nested instance', function() {
    base.register('foo', function() {});
    assert.doesNotThrow(() => base.findGenerator('foo.whatever'), /cannot find/);
  });

  it('should get a generator function from the base instance', function() {
    base.register('abc', function() {});
    const generator = base.findGenerator('abc');
    assert.equal(typeof generator, 'function');
  });

  it('should not invoke nested generators', function() {
    let count = 0;

    base.register('abc', function() {});
    base.register('xyz', function(app) {
      app.register('one', function() {
        const generator = this.base.findGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'function');
        assert.equal(generator.name, 'abc');
        count++;
      });

      app.register('two', function() {
        const generator = base.findGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
        count++;
      });

      app.register('three', function(three) {
        const generator = three.base.findGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
        count++;
      });
    });

    assert.equal(typeof base.findGenerator('xyz.one'), 'function');
    assert.equal(typeof base.findGenerator('xyz.two'), 'function');
    assert.equal(typeof base.findGenerator('xyz.three'), 'function');
    assert.equal(count, 0);
  });

  it('should get a generator from the base instance using `this`', function() {
    base.register('abc', function() {});
    base.register('xyz', function(app) {
      app.register('sub', function(sub) {
        const generator = this.findGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
      });
    });
    base.findGenerator('xyz');
  });

  it('should get a base generator from "app" from a nested generator', function() {
    base.register('abc', function() {});
    base.register('xyz', function(app) {
      app.register('sub', function(sub) {
        const generator = app.findGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
      });
    });
    base.findGenerator('xyz');
  });

  it('should get a nested generator', function() {
    base.register('abc', function(abc) {
      abc.register('def', function(def) {});
    });

    const generator = base.findGenerator('abc.def');
    assert(generator);
    assert.equal(typeof generator, 'function');
    assert.equal(generator.name, 'def');
  });

  it('should get a deeply nested generator', function() {
    base.register('abc', function(abc) {
      abc.register('def', function(def) {
        def.register('ghi', function(ghi) {
          ghi.register('jkl', function(jkl) {
            jkl.register('mno', function() {});
          });
        });
      });
    });

    const generator = base.findGenerator('abc.def.ghi.jkl.mno');
    assert(generator);
    assert.equal(typeof generator, 'function');
    assert.equal(generator.name, 'mno');
  });
});
