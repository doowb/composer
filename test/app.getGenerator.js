'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('.getGenerator', () => {
  beforeEach(() => {
    base = new Generator();
  });

  it('should get a generator from the base instance', () => {
    base.register('abc', () => {});
    const generator = base.getGenerator('abc');
    assert(Generator.isGenerator(generator));
    assert.equal(generator.name, 'abc');
  });

  it('should throw an error when a generator is not found', () => {
    base.register('foo', () => {});
    assert.throws(() => base.getGenerator('whatever'), /is not registered/);
    assert.throws(() => base.getGenerator('foo.whatever'), /is not registered/);
  });

  it('should get a generator from the base instance from a nested generator', () => {
    let count = 0;

    base.register('abc', () => {});
    base.register('xyz', app => {
      app.register('one', function() {
        const generator = this.base.getGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
        count++;
      });

      app.register('two', () => {
        const generator = base.getGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
        count++;
      });

      app.register('three', function(three) {
        const generator = three.base.getGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
        count++;
      });
    });

    base.getGenerator('xyz.one');
    base.getGenerator('xyz.two');
    base.getGenerator('xyz.three');
    assert.equal(count, 3);
  });

  it('should get a generator from the base instance using `this`', () => {
    base.register('abc', () => {});
    base.register('xyz', app => {
      app.register('sub', function(sub) {
        const generator = this.getGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
      });
    });
    base.getGenerator('xyz');
  });

  it('should get a base generator from "app" from a nested generator', () => {
    base.register('abc', () => {});
    base.register('xyz', app => {
      app.register('sub', function(sub) {
        const generator = app.getGenerator('abc');
        assert(generator);
        assert.equal(typeof generator, 'object');
        assert.equal(generator.name, 'abc');
      });
    });
    base.getGenerator('xyz');
  });

  it('should get a nested generator', () => {
    base.register('abc', function(abc) {
      abc.register('def', function(def) {});
    });

    const generator = base.getGenerator('abc.def');
    assert(generator);
    assert.equal(typeof generator, 'object');
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

    const generator = base.getGenerator('abc.def.ghi.jkl.mno');
    assert(generator);
    assert.equal(typeof generator, 'object');
    assert.equal(generator.name, 'mno');
  });

  it('should set deeply nested generators on the base instance cache', () => {
    base.disableInspect();

    base.register('abc', function(abc) {
      this.register('def', function(def) {
        this.register('ghi', function(ghi) {
          this.register('jkl', function(jkl) {
            this.register('mno', () => {});
          });
        });
      });
    });

    base.getGenerator('abc.def.ghi.jkl.mno');

    assert(base.namespaces.has('generate.abc'));
    assert(base.namespaces.has('generate.abc.def'));
    assert(base.namespaces.has('generate.abc.def.ghi'));
    assert(base.namespaces.has('generate.abc.def.ghi.jkl'));
    assert(base.namespaces.has('generate.abc.def.ghi.jkl.mno'));
  });

  it('should allow a generator to be called on multiple instances', () => {
    const parents = [];

    function generator() {
      parents.push(this.parent.name);
    }

    base.register('one', function() {
      this.register('sub', generator);
    });

    base.register('two', function() {
      this.register('sub', generator);
    });

    assert.equal(typeof base.getGenerator('one.sub'), 'object');
    assert.equal(typeof base.getGenerator('two.sub'), 'object');
    assert.equal(base.findGenerator('one.sub').called, 1);
    assert.equal(base.findGenerator('two.sub').called, 1);
  });

  it('should only invoke generators once by default', () => {
    let called = 0;

    base.register('one', function() {
      this.register('child', function() {
        called++;
      });
    });

    // _shouldn't_ be called by ".findGenerator"
    const wrappedFn = base.findGenerator('one.child');

    assert.equal(called, 0);
    assert.equal(base.findGenerator('one.child').called, 0);

    // _should_ be called by ".getGenerator"
    base.getGenerator('one.child');
    assert.equal(called, 1);
    assert.equal(base.findGenerator('one.child').called, called);

    wrappedFn.call(base, base);
    assert.equal(called, 1);
    assert.equal(base.findGenerator('one.child').called, called);

    wrappedFn.call(base, base);
    assert.equal(called, 1);
    assert.equal(base.findGenerator('one.child').called, called);
  });

  it('should invoke generator functions multiple times when options.once is false', () => {
    let called = 0;

    base.register('one', function() {
      this.register('child', { once: false }, function() {
        called++;
      });
    });

    // _shouldn't_ be called by ".findGenerator"
    const wrappedFn = base.findGenerator('one.child');

    assert.equal(called, 0);
    assert.equal(base.findGenerator('one.child').called, 0);

    // _should_ be called by ".getGenerator"
    base.getGenerator('one.child');
    assert.equal(called, 1);
    assert.equal(base.findGenerator('one.child').called, called);

    wrappedFn.call(base, base);
    assert.equal(called, 2);
    assert.equal(base.findGenerator('one.child').called, called);

    wrappedFn.call(base, base);
    assert.equal(called, 3);
    assert.equal(base.findGenerator('one.child').called, called);
  });

  it('should keep the original (unwrapped) function on generator.fn', () => {
    let called = 0;

    base.register('one', function() {
      this.register('child', function() {
        called++;
      });
    });

    // the wrapped generator function should not be called, but the
    // original function will be invoked each time
    const originalFn = base.findGenerator('one.child').fn;
    assert.equal(called, 0);
    assert.equal(base.findGenerator('one.child').called, 0);

    originalFn.call(base, base);
    assert.equal(called, 1);
    assert.equal(base.findGenerator('one.child').called, 0);

    originalFn.call(base, base);
    assert.equal(called, 2);
    assert.equal(base.findGenerator('one.child').called, 0);

    originalFn.call(base, base);
    assert.equal(called, 3);
    assert.equal(base.findGenerator('one.child').called, 0);
  });
});
