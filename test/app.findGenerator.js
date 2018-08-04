'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('.findGenerator', () => {
  beforeEach(() => {
    base = new Generator();
  });

  it('should not throw an error when a generator is not found', () => {
    assert.doesNotThrow(() => base.findGenerator('whatever'), /cannot find/);
  });

  it('should not throw an error when a generator is not found on a nested instance', () => {
    base.register('foo', () => {});
    assert.doesNotThrow(() => base.findGenerator('foo.whatever'), /cannot find/);
  });

  it('should get a generator function from the base instance', () => {
    base.register('abc', () => {});
    const generator = base.findGenerator('abc');
    assert.equal(typeof generator, 'function');
  });

  it('should not invoke nested generators', () => {
    let count = 0;

    base.register('abc', () => {});
    base.register('xyz', app => {
      app.register('one', () => {
        const generator = this.base.findGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'function');
        assert.equal(generator.name, 'abc');
        count++;
      });

      app.register('two', () => {
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

  it('should get a generator from the base instance using `this`', () => {
    base.register('abc', () => {});
    base.register('xyz', app => {
      app.register('sub', function(sub) {
        const generator = this.findGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
      });
    });
    base.findGenerator('xyz');
  });

  it('should get a base generator from "app" from a nested generator', () => {
    base.register('abc', () => {});
    base.register('xyz', app => {
      app.register('sub', function(sub) {
        const generator = app.findGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
      });
    });
    base.findGenerator('xyz');
  });

  it('should get a nested generator', () => {
    base.register('abc', function(abc) {
      abc.register('def', function(def) {});
    });

    const generator = base.findGenerator('abc.def');
    assert(generator);
    assert.equal(typeof generator, 'function');
    assert.equal(generator.name, 'def');
  });

  it('should get a deeply nested generator', () => {
    base.register('abc', function(abc) {
      abc.register('def', function(def) {
        def.register('ghi', function(ghi) {
          ghi.register('jkl', function(jkl) {
            jkl.register('mno', () => {});
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
