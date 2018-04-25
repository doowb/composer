'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('.generator', function() {
  beforeEach(function() {
    base = new Generator();
  });

  describe('generator naming', function() {
    it('should cache a generator by alias when alias is given', function() {
      base.generator('foo', function() {});
      assert(base.generators.has('foo'));
    });

    it('should cache a generator by alias when by full name is given', function() {
      base.generator('generate-abc', function() {});
      assert(base.generators.has('abc'));
    });

    it('should get a generator by alias, when registered with full name', function() {
      base.register('generate-foo', require('generate-foo'));
      const app = base.getGenerator('foo');
      assert.equal(app.name, 'generate-foo');
      assert.equal(app.alias, 'foo');
    });

    it('should get a generator by alias, when registered with alias', function() {
      base.register('foo', require('generate-foo'));
      const app = base.getGenerator('foo');
      assert.equal(app.name, 'foo');
    });

    it('should get a generator by full name, when registered with full name', function() {
      base.register('generate-foo', require('generate-foo'));
      const app = base.getGenerator('generate-foo');
      assert.equal(app.name, 'generate-foo');
      assert.equal(app.alias, 'foo');
    });

    it('should get a generator by full name, when registered with alias', function() {
      base.register('foo', require('generate-foo'));
      const app = base.getGenerator('generate-foo');
      assert.equal(app.name, 'foo');
    });
  });

  describe('generators', function() {
    it('should invoke a registered generator when `getGenerator` is called', function(cb) {
      base.register('foo', function(app) {
        app.task('default', function() {});
        cb();
      });

      base.getGenerator('foo');
    });

    it('should expose the generator instance on `app`', function(cb) {
      base.register('foo', function(app) {
        app.task('default', function(next) {
          assert.equal(app.a, 'b');
          next();
        });
      });

      const foo = base.getGenerator('foo');
      foo.a = 'b';
      foo.build('default', function(err) {
        if (err) return cb(err);
        cb();
      });
    });

    it('should expose the "base" instance on `app.base`', function(cb) {
      base.x = 'z';
      base.register('foo', function(app) {
        app.task('default', function(next) {
          assert.equal(app.base.x, 'z');
          next();
        });
      });

      const foo = base.getGenerator('foo');
      foo.build('default', function(err) {
        if (err) return cb(err);
        cb();
      });
    });

    it('should expose an app\'s generators on app.generators', function(cb) {
      base.register('foo', function(app) {
        app.register('a', function() {});
        app.register('b', function() {});

        app.generators.has('a');
        app.generators.has('b');
        cb();
      });

      base.getGenerator('foo');
    });

    it('should expose all root generators on base.generators', function(cb) {
      base.register('foo', function(app) {
        app.base.generators.has('foo');
        app.base.generators.has('bar');
        app.base.generators.has('baz');
        cb();
      });

      base.register('bar', function(app, base) {});
      base.register('baz', function(app, base) {});
      base.getGenerator('foo');
    });
  });

  describe('cross-generators', function() {
    it('should get a generator from another generator', function(cb) {
      base.register('foo', function(app) {
        const bar = app.base.getGenerator('bar');
        assert(bar);
        cb();
      });

      base.register('bar', function(app, base) {});
      base.register('baz', function(app, base) {});
      base.getGenerator('foo');
    });

    it('should set options on another generator instance', function(cb) {
      base.generator('foo', function(app) {
        app.task('default', function(next) {
          assert.equal(app.options.abc, 'xyz');
          next();
        });
      });

      base.generator('bar', function(app) {
        const foo = app.base.getGenerator('foo');
        foo.options.abc = 'xyz';
        foo.build(function(err) {
          if (err) return cb(err);
          cb();
        });
      });
    });
  });

  describe('tasks', function() {
    it('should expose a generator\'s tasks on app.tasks', function(cb) {
      base.register('foo', function(app) {
        app.task('a', function() {});
        app.task('b', function() {});
        assert(app.tasks.has('a'));
        assert(app.tasks.has('b'));
        cb();
      });

      base.getGenerator('foo');
    });

    it('should get tasks from another generator', function(cb) {
      base.register('foo', function(app) {
        const baz = app.base.getGenerator('baz');
        const task = baz.tasks.get('aaa');
        assert(task);
        cb();
      });

      base.register('bar', function(app, base) {});
      base.register('baz', function(app, base) {
        app.task('aaa', function() {});
      });

      base.getGenerator('foo');
    });
  });

  describe('namespace', function() {
    it('should expose `app.namespace`', function(cb) {
      base.generator('foo', function(app) {
        assert(typeof app.namespace, 'string');
        cb();
      });
    });

    it('should create namespace from generator alias', function(cb) {
      base.generator('generate-foo', function(app) {
        assert.equal(app.namespace, 'generate.foo');
        cb();
      });
    });

    it('should create sub-generator namespace from parent namespace and alias', function(cb) {
      const name = base.name;

      base.generator('generate-foo', function(app) {
        assert.equal(app.namespace, name + '.foo');

        app.generator('generate-bar', function(bar) {
          assert.equal(bar.namespace, name + '.foo.bar');

          bar.generator('generate-baz', function(baz) {
            assert.equal(baz.namespace, name + '.foo.bar.baz');

            baz.generator('generate-qux', function(qux) {
              assert.equal(qux.namespace, name + '.foo.bar.baz.qux');
              cb();
            });
          });
        });
      });
    });

    it('should expose namespace on `this`', function(cb) {
      base.generator('generate-foo', function(app) {
        assert.equal(this.namespace, 'generate.foo');

        this.generator('generate-bar', function() {
          assert.equal(this.namespace, 'generate.foo.bar');

          this.generator('generate-baz', function() {
            assert.equal(this.namespace, 'generate.foo.bar.baz');

            this.generator('generate-qux', function() {
              assert.equal(this.namespace, 'generate.foo.bar.baz.qux');
              assert.equal(app.namespace, 'generate.foo');
              assert.equal(this.base.namespace, 'generate');
              assert.equal(app.base.namespace, 'generate');
              cb();
            });
          });
        });
      });
    });
  });
});
