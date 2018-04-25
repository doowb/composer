'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('generator.events', function() {
  beforeEach(function() {
    base = new Generator();
  });

  it('should emit generator when a generator is registered', function(cb) {
    base.on('generator', function(generator) {
      assert.equal(generator.name, 'foo');
      cb();
    });

    base.generator('foo', function() {});
  });

  it('should emit generator when base.generators.get is called', function(cb) {
    base.on('generator', function(generator) {
      assert.equal(generator.name, 'foo');
      cb();
    });

    base.register('foo', function() {});
    base.getGenerator('foo');
  });

  it('should emit generator.get when base.generators.get is called', function(cb) {
    base.on('generator', function(generator) {
      assert.equal(generator.name, 'foo');
      cb();
    });

    base.register('foo', function() {});
    base.getGenerator('foo');
  });

  it('should emit error on base when a base generator emits an error', function(cb) {
    let called = 0;

    base.on('error', function(err) {
      assert.equal(err.message, 'whatever');
      called++;
    });

    base.register('foo', function(app) {
      app.emit('error', new Error('whatever'));
    });

    base.getGenerator('foo');
    assert.equal(called, 1);
    cb();
  });

  it('should emit error on base when a base generator throws an error', function() {
    let called = 0;

    base.on('error', function(err) {
      assert.equal(err.message, 'whatever');
      called++;
    });

    base.register('foo', function(app) {
      app.task('default', function(cb) {
        cb(new Error('whatever'));
      });
    });

    return base.getGenerator('foo')
      .build(function(err) {
        assert(err);
        assert.equal(called, 1);
      });
  });

  it('should emit errors on base from deeply nested generators', function(cb) {
    let called = 0;

    base.on('error', function(err) {
      assert.equal(err.message, 'whatever');
      called++;
    });

    base.register('a', function() {
      this.register('b', function() {
        this.register('c', function() {
          this.register('d', function() {
            this.task('default', function(cb) {
              cb(new Error('whatever'));
            });
          });
        });
      });
    });

    base.getGenerator('a.b.c.d')
      .build(function(err) {
        assert(err);
        assert.equal(called, 1);
        cb();
      });
  });

  it('should bubble up errors to all parent generators', function(cb) {
    const names = [];
    let called = 0;

    function count() {
      names.push(this.namespace);
      called++;
    }

    base.name = 'root';
    base.on('error', function(err) {
      assert.equal(err.message, 'whatever');
      called++;
    });

    base.register('a', function() {
      this.on('error', count);

      this.register('b', function() {
        this.on('error', count);

        this.register('c', function() {
          this.on('error', count);

          this.register('d', function() {
            this.on('error', count);

            this.task('default', function(cb) {
              cb(new Error('whatever'));
            });
          });
        });
      });
    });

    base.getGenerator('a.b.c.d')
      .build(function(err) {
        assert(err);
        assert.deepEqual(names, [ 'root.a.b.c.d', 'root.a.b.c', 'root.a.b', 'root.a' ]);
        assert.equal(called, 5);
        assert.equal(err.message, 'whatever');
        cb();
      })
      .catch(cb);
  });
});
