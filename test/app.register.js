'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('.register', () => {
  beforeEach(() => {
    base = new Generator('base');
  });

  describe('function', () => {
    it('should register a generator a function', () => {
      base.register('foo', () => {});
      const foo = base.getGenerator('foo');
      assert(foo);
      assert.equal(foo.name, 'foo');
    });

    it('should get a task from a generator registered as a function', () => {
      base.register('foo', function(foo) {
        foo.task('default', () => {});
      });
      const generator = base.getGenerator('foo');
      assert(generator);
      assert(generator.tasks);
      assert(generator.tasks.has('default'));
    });

    it('should get a generator from a generator registered as a function', () => {
      base.register('foo', function(foo) {
        foo.register('bar', () => {});
      });

      const generator = base.getGenerator('foo.bar');
      assert(generator);
      assert.equal(generator.name, 'bar');
    });

    it('should get a sub-generator from a generator registered as a function', () => {
      base.register('foo', function(foo) {
        foo.register('bar', function(bar) {
          bar.task('something', () => {});
        });
      });
      const bar = base.getGenerator('foo.bar');
      assert(bar);
      assert(bar.tasks);
      assert(bar.tasks.has('something'));
    });

    it('should get a deeply-nested sub-generator registered as a function', () => {
      base.register('foo', function(foo) {
        foo.register('bar', function(bar) {
          bar.register('baz', function(baz) {
            baz.register('qux', function(qux) {
              qux.task('qux-one', () => {});
            });
          });
        });
      });

      const qux = base.getGenerator('foo.bar.baz.qux');
      assert(qux);
      assert(qux.tasks);
      assert(qux.tasks.has('qux-one'));
    });

    it('should expose the instance from each generator', () => {
      base.register('foo', function(foo) {
        foo.register('bar', function(bar) {
          bar.register('baz', function(baz) {
            baz.register('qux', function(qux) {
              qux.task('qux-one', () => {});
            });
          });
        });
      });

      const qux = base
        .getGenerator('foo')
        .getGenerator('bar')
        .getGenerator('baz')
        .getGenerator('qux');

      assert(qux);
      assert(qux.tasks);
      assert(qux.tasks.has('qux-one'));
    });

    it('should throw an error when getting a generator that does not exist', () => {
      base.register('foo', function(foo) {
        foo.register('bar', function(bar) {
          bar.register('baz', function(baz) {
            baz.register('qux', function(qux) {
            });
          });
        });
      });

      assert.throws(() => base.getGenerator('foo.bar.fez'), /is not registered/);
    });

    it('should expose the `base` instance as the second param', cb => {
      base.register('foo', function(foo) {
        assert(foo.base.generators.has('foo'));
        cb();
      });
      base.getGenerator('foo');
    });

    it('should expose sibling generators on the `base` instance', cb => {
      base.register('foo', function(foo) {
        foo.task('abc', () => {});
      });
      base.register('bar', function(bar) {
        assert(this.base.generators.has('foo'));
        assert(this.base.generators.has('bar'));
        cb();
      });

      base.getGenerator('foo');
      base.getGenerator('bar');
    });
  });

  describe('name', () => {
    it('should use a custom function to create the name', () => {
      base.options.toAlias = function(name) {
        return name.slice(name.lastIndexOf('-') + 1);
      };

      base.register('base-abc-xyz', () => {});
      const xyz = base.getGenerator('xyz');
      assert(xyz);
      assert.equal(xyz.name, 'base-abc-xyz');
      assert.equal(xyz.alias, 'xyz');
    });
  });

  describe('instance', () => {
    it('should register an instance', () => {
      base.register('base-inst', new Generator());
      assert(base.generators.has('base-inst'));
    });

    it('should get a generator that was registered as an instance', () => {
      const foo = new Generator('foo');
      foo.task('default', () => {});
      base.register('foo', foo);
      assert(base.getGenerator('foo'));
    });

    it('should register multiple instances', () => {
      const foo = new Generator('foo');
      const bar = new Generator('bar');
      const baz = new Generator('baz');
      base.register('foo', foo);
      base.register('bar', bar);
      base.register('baz', baz);
      assert(base.getGenerator('foo'));
      assert(base.getGenerator('bar'));
      assert(base.getGenerator('baz'));
    });

    it('should get tasks from a generator that was registered as an instance', () => {
      const foo = new Generator();
      foo.task('default', () => {});
      base.register('foo', foo);
      const generator = base.getGenerator('foo');
      assert(generator);
      assert(generator.tasks.has('default'));
    });

    it('should get sub-generators from a generator registered as an instance', () => {
      const foo = new Generator();
      foo.register('bar', () => {});
      base.register('foo', foo);
      const generator = base.getGenerator('foo.bar');
      assert(generator);
    });

    it('should get tasks from sub-generators registered as an instance', () => {
      const foo = new Generator();

      foo.options.isFoo = true;
      foo.register('bar', function(bar) {
        bar.task('whatever', () => {});
      });

      base.register('foo', foo);
      const generator = base.getGenerator('foo.bar');
      assert(generator.tasks);
      assert(generator.tasks.has('whatever'));
    });
  });
});
