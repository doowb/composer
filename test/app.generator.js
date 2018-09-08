'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('.generator', () => {
  beforeEach(() => {
    base = new Generator();
  });

  describe('generator naming', () => {
    it('should cache a generator by alias when alias is given', () => {
      base.generator('foo', () => {});
      assert(base.generators.has('foo'));
    });

    it('should cache a generator by alias when by full name is given', () => {
      base.generator('generate-abc', () => {});
      assert(base.generators.has('abc'));
    });

    it('should get a generator by alias, when registered with full name', () => {
      base.register('generate-foo', () => {});
      const app = base.getGenerator('foo');
      assert.equal(app.name, 'generate-foo');
      assert.equal(app.alias, 'foo');
    });

    it('should get a generator by alias, when registered with alias', () => {
      base.register('foo', () => {});
      const app = base.getGenerator('foo');
      assert.equal(app.name, 'foo');
    });

    it('should get a generator by full name, when registered with full name', () => {
      base.register('generate-foo', () => {});
      const app = base.getGenerator('generate-foo');
      assert.equal(app.name, 'generate-foo');
      assert.equal(app.alias, 'foo');
    });

    it('should get a generator by full name, when registered with alias', () => {
      base.register('foo', () => {});
      const app = base.getGenerator('generate-foo');
      assert.equal(app.name, 'foo');
    });
  });

  describe('generators', () => {
    it('should invoke a registered generator when `getGenerator` is called', cb => {
      base.register('foo', app => {
        app.task('default', () => {});
        cb();
      });

      base.getGenerator('foo');
    });

    it('should expose the generator instance on `app`', cb => {
      base.register('foo', app => {
        app.task('default', next => {
          assert.equal(app.a, 'b');
          next();
        });
      });

      const foo = base.getGenerator('foo');
      foo.a = 'b';
      foo.build('default', err => {
        if (err) return cb(err);
        cb();
      });
    });

    it('should expose the "base" instance on `app.base`', cb => {
      base.x = 'z';
      base.register('foo', app => {
        app.task('default', next => {
          assert.equal(app.base.x, 'z');
          next();
        });
      });

      const foo = base.getGenerator('foo');
      foo.build('default', err => {
        if (err) return cb(err);
        cb();
      });
    });

    it('should expose an app\'s generators on app.generators', cb => {
      base.register('foo', app => {
        app.register('a', () => {});
        app.register('b', () => {});

        app.generators.has('a');
        app.generators.has('b');
        cb();
      });

      base.getGenerator('foo');
    });

    it('should expose all root generators on base.generators', cb => {
      base.register('foo', app => {
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

  describe('cross-generators', () => {
    it('should get a generator from another generator', cb => {
      base.register('foo', app => {
        const bar = app.base.getGenerator('bar');
        assert(bar);
        cb();
      });

      base.register('bar', function(app, base) {});
      base.register('baz', function(app, base) {});
      base.getGenerator('foo');
    });

    it('should set options on another generator instance', cb => {
      base.generator('foo', app => {
        app.task('default', next => {
          assert.equal(app.options.abc, 'xyz');
          next();
        });
      });

      base.generator('bar', app => {
        const foo = app.base.getGenerator('foo');
        foo.options.abc = 'xyz';
        foo.build(err => {
          if (err) return cb(err);
          cb();
        });
      });
    });
  });

  describe('tasks', () => {
    it('should expose a generator\'s tasks on app.tasks', cb => {
      base.register('foo', app => {
        app.task('a', () => {});
        app.task('b', () => {});
        assert(app.tasks.has('a'));
        assert(app.tasks.has('b'));
        cb();
      });

      base.getGenerator('foo');
    });

    it('should get tasks from another generator', cb => {
      base.register('foo', app => {
        const baz = app.base.getGenerator('baz');
        const task = baz.tasks.get('aaa');
        assert(task);
        cb();
      });

      base.register('bar', function(app, base) {});
      base.register('baz', function(app, base) {
        app.task('aaa', () => {});
      });

      base.getGenerator('foo');
    });
  });

  describe('namespace', () => {
    it('should expose `app.namespace`', cb => {
      base.generator('foo', app => {
        assert(typeof app.namespace, 'string');
        cb();
      });
    });

    it('should create namespace from generator alias', cb => {
      base.generator('generate-foo', app => {
        assert.equal(app.namespace, 'generate.foo');
        cb();
      });
    });

    it('should create sub-generator namespace from parent namespace and alias', cb => {
      base.generator('generate-foo', app => {
        assert(app !== base);
        assert(app.base === base);
        assert.equal(app.namespace, `${base.name}.foo`);

        app.generator('generate-bar', bar => {
          assert(bar !== app);
          assert(bar !== base);
          assert(bar.base === base);
          assert.equal(bar.namespace, `${base.name}.foo.bar`);

          bar.generator('generate-baz', baz => {
            assert(baz !== bar);
            assert(baz !== app);
            assert(baz !== base);
            assert(baz.base === base);
            assert.equal(baz.namespace, `${base.name}.foo.bar.baz`);

            baz.generator('generate-qux', qux => {
              assert(qux !== baz);
              assert(qux !== bar);
              assert(qux !== app);
              assert(qux !== base);
              assert(qux.base === base);
              assert.equal(qux.namespace, `${base.name}.foo.bar.baz.qux`);
              cb();
            });
          });
        });
      });
    });

    it('should expose namespace on `this`', cb => {
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
