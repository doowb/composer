'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('generator.events', () => {
  beforeEach(() => {
    base = new Generator();
  });

  it('should emit generator when a generator is registered', cb => {
    base.on('generator', generator => {
      assert.equal(generator.name, 'foo');
      cb();
    });

    base.generator('foo', () => {});
  });

  it('should emit generator when base.generators.get is called', cb => {
    base.on('generator', generator => {
      assert.equal(generator.name, 'foo');
      cb();
    });

    base.register('foo', () => {});
    base.getGenerator('foo');
  });

  it('should emit generator.get when base.generators.get is called', cb => {
    base.on('generator', generator => {
      assert.equal(generator.name, 'foo');
      cb();
    });

    base.register('foo', () => {});
    base.getGenerator('foo');
  });

  it('should emit error on base when a base generator emits an error', cb => {
    let called = 0;

    base.on('error', err => {
      assert.equal(err.message, 'whatever');
      called++;
    });

    base.register('foo', app => {
      app.emit('error', new Error('whatever'));
    });

    base.getGenerator('foo');
    assert.equal(called, 1);
    cb();
  });

  it('should emit error on base when a base generator throws an error', () => {
    let called = 0;

    base.on('error', err => {
      assert.equal(err.message, 'whatever');
      called++;
    });

    base.register('foo', app => {
      app.task('default', cb => {
        cb(new Error('whatever'));
      });
    });

    return base.getGenerator('foo')
      .build(err => {
        assert(err);
        assert.equal(called, 1);
      });
  });

  it('should emit errors on base from deeply nested generators', cb => {
    let called = 0;

    base.on('error', err => {
      assert.equal(err.message, 'whatever');
      called++;
    });

    base.register('a', function() {
      this.register('b', function() {
        this.register('c', function() {
          this.register('d', function() {
            this.task('default', function(next) {
              next(new Error('whatever'));
            });
          });
        });
      });
    });

    base.getGenerator('a.b.c.d')
      .build(err => {
        assert(err);
        assert.equal(called, 1);
        cb();
      });
  });

  it('should bubble up errors to all parent generators', cb => {
    const names = [];
    let called = 0;

    function count() {
      names.push(this.namespace);
      called++;
    }

    base.name = 'root';
    base.on('error', err => {
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

            this.task('default', function(next) {
              next(new Error('whatever'));
            });
          });
        });
      });
    });

    base.getGenerator('a.b.c.d')
      .build(err => {
        assert(err);
        assert.deepEqual(names, [ 'root.a.b.c.d', 'root.a.b.c', 'root.a.b', 'root.a' ]);
        assert.equal(called, 5);
        assert.equal(err.message, 'whatever');
        cb();
      })
      .catch(cb);
  });
});
