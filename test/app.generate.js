'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('.generate', () => {
  beforeEach(() => {
    base = new Generator();
  });

  describe('generators', () => {
    it('should throw an error when a generator is not found', () => {
      return base.generate('fdsslsllsfjssl')
        .catch(err => {
          assert(err);
          assert(/is not registered/i.test(err.message));
        });
    });

    it('should throw an error when the default task is not found', () => {
      base.register('foo', () => {});
      return base.generate('foo', ['default'])
        .catch(err => {
          assert(err);
          assert(/is not registered/i.test(err.message));
        });
    });

    it('should throw an error when a task is not found (task array)', () => {
      base.register('fdsslsllsfjssl', () => {});
      return base.generate('fdsslsllsfjssl', ['foo'])
        .catch(err => {
          assert(err);
          assert(/task/i.test(err.message));
          assert(/is not registered/i.test(err.message));
        });
    });

    it('should throw an error when a task is not found (task string)', () => {
      base.register('fdsslsllsfjssl', () => {});
      return base.generate('fdsslsllsfjssl', 'foo')
        .catch(err => {
          assert(err);
          assert(/task/i.test(err.message));
          assert(/is not registered/i.test(err.message));
        });
    });

    it('should handle task errors', () => {
      base.task('default', next => {
        next(new Error('whatever'));
      });

      return base.generate('default')
        .catch(err => {
          assert(err);
          assert.equal(err.message, 'whatever');
        });
    });

    it('should run a task on the instance', () => {
      base.task('abc123', next => next());
      return base.generate('abc123');
    });

    it('should run a task on the instance', () => {
      base.task('abc123', next => next());
      return base.generate('abc123');
    });

    it('should run same-named task instead of a generator', () => {
      base.register('123xyz', app => {
        throw new Error('expected the task to run first');
      });

      base.task('123xyz', cb => cb());
      return base.generate('123xyz');
    });

    it('should run a task instead of a generator with a default task', () => {
      base.register('123xyz', app => {
        app.task('default', () => {
          return Promise.resolve(new Error('expected the task to run first'));
        });
      });
      base.task('123xyz', cb => cb());
      return base.generate('123xyz');
    });

    it('should run a task on a same-named generator when the task is specified', () => {
      let count = 0;
      base.register('foo', app => {
        app.task('default', next => {
          count++;
          next();
        });
      });

      base.task('foo', () => {
        throw new Error('expected the generator to run');
      });

      return base.generate('foo', ['default'])
        .then(() => {
          assert.equal(count, 1);
        });
    });

    it('should run a generator from a task with the same name', () => {
      base.register('foo', app => {
        app.task('default', next => {
          next();
        });
      });

      base.task('foo', () => base.generate('foo'));
      return base.build('foo');
    });

    it('should run the default task on a generator', cb => {
      base.register('foo', app => {
        app.task('default', next => {
          next();
        });
      });

      base.generate('foo', err => {
        assert(!err);
        cb();
      });
    });

    it('should run a list of tasks on the instance', () => {
      let count = 0;
      base.task('a', next => {
        count++;
        next();
      });
      base.task('b', next => {
        count++;
        next();
      });
      base.task('c', next => {
        count++;
        next();
      });

      return base.generate('a', 'b', 'c')
        .then(() => {
          assert.equal(count, 3);
        });
    });

    it('should run an array of tasks on the instance', () => {
      let count = 0;
      base.task('a', next => {
        count++;
        next();
      });
      base.task('b', next => {
        count++;
        next();
      });
      base.task('c', next => {
        count++;
        next();
      });

      return base.generate(['a', 'b', 'c'])
        .then(() => {
          assert.equal(count, 3);
        });
    });

    it('should run the default task on a registered generator', () => {
      let count = 0;

      base.register('foo', app => {
        app.task('default', next => {
          count++;
          next();
        });
      });

      return base.generate('foo')
        .then(() => {
          assert.equal(count, 1);
        });
    });

    it('should run an array of generators', () => {
      let count = 0;
      base.register('foo', app => {
        app.task('default', next => {
          count++;
          next();
        });
      });

      base.register('bar', app => {
        app.task('default', next => {
          count++;
          next();
        });
      });

      return base.generate(['foo', 'bar'])
        .then(() => {
          assert.equal(count, 2);
        });
    });

    it('should run the default tasks on an array of generators', () => {
      let count = 0;
      base.register('a', function(app) {
        this.task('default', cb => {
          count++;
          cb();
        });
      });

      base.register('b', function(app) {
        this.task('default', cb => {
          count++;
          cb();
        });
      });

      base.register('c', function(app) {
        this.task('default', cb => {
          count++;
          cb();
        });
      });

      return base.generate(['a', 'b', 'c'])
        .then(() => {
          assert.equal(count, 3);
        });
    });
  });

  describe('options', cb => {
    it('should pass options to generator.options', () => {
      let count = 0;
      base.register('default', function(app, options) {
        app.task('default', next => {
          count++;
          assert.equal(options.foo, 'bar');
          next();
        });
      });

      return base.generate({foo: 'bar'})
        .then(() => {
          assert.equal(count, 1);
        });
    });

    it('should expose options on generator options', () => {
      let count = 0;
      base.register('default', function(app, options) {
        app.task('default', next => {
          count++;
          assert.equal(options.foo, 'bar');
          next();
        });
      });

      return base.generate({foo: 'bar'})
        .then(() => {
          assert.equal(count, 1);
        });
    });

    it('should not mutate options on parent instance', () => {
      let count = 0;
      base.register('default', function(app, options) {
        app.task('default', next => {
          count++;
          assert.equal(options.foo, 'bar');
          assert(!base.options.foo);
          next();
        });
      });

      return base.generate({foo: 'bar'})
        .then(() => {
          assert.equal(count, 1);
        });
    });
  });

  describe('default tasks', cb => {
    it('should run the default task on the _default_ generator', () => {
      let count = 0;
      base.register('default', function(app) {
        app.task('default', next => {
          count++;
          next();
        });
      });

      return base.generate()
        .then(() => {
          assert.equal(count, 1);
        });
    });

    it('should run the default task on the _specified_ generator', () => {
      let count = 0;

      base.register('foo', app => {
        app.task('default', next => {
          count++;
          next();
        });
      });

      return base.generate('foo')
        .then(() => {
          assert.equal(count, 1);
        });
    });
  });

  describe('specified tasks', cb => {
    it('should run the specified task on a registered generator', () => {
      let count = 0;
      base.register('foo', app => {
        app.task('default', next => {
          count++;
          next();
        });

        app.task('abc', next => {
          count++;
          next();
        });
      });

      return base.generate('foo', ['abc'])
        .then(() => {
          assert.equal(count, 1);
        });
    });
  });

  describe('sub-generators', cb => {
    it('should run the default task on a registered sub-generator', () => {
      let count = 0;
      base.register('foo', app => {
        app.register('sub', function(sub) {
          sub.task('default', next => {
            count++;
            next();
          });

          sub.task('abc', next => {
            count++;
            next();
          });
        });
      });

      return base.generate('foo.sub')
        .then(() => {
          assert.equal(count, 1);
        });
    });

    it('should run the specified task array on a registered sub-generator', () => {
      let count = 0;
      base.register('foo', app => {
        app.register('sub', function(sub) {
          sub.task('default', next => {
            count++;
            next();
          });

          sub.task('abc', next => {
            count++;
            next();
          });
        });
      });

      return base.generate('foo.sub', ['abc'])
        .then(() => {
          assert.equal(count, 1);
        });
    });

    it('should run default tasks on an array of nested sub-generators', () => {
      let count = 0;
      base.register('foo', app => {
        app.register('one', function(one) {
          one.task('default', next => {
            count++;
            next();
          });
        });

        app.register('two', function(two) {
          two.task('default', next => {
            count++;
            next();
          });
        });
      });

      return base.generate(['foo.one', 'foo.two'])
        .then(() => {
          assert.equal(count, 2);
        });
    });

    it('should run an array of nested sub-generators', () => {
      let count = 0;
      base.register('foo', app => {
        app.register('one', function(one) {
          one.task('default', next => {
            count++;
            next();
          });
        });

        app.register('two', function(two) {
          two.task('default', next => {
            count++;
            next();
          });
        });
      });

      return base.generate('foo', ['one', 'two'])
        .then(() => {
          assert.equal(count, 2);
        });
    });

    it('should run an array of tasks on a registered sub-generator', () => {
      let count = 0;
      base.register('foo', app => {
        app.register('bar', function(bar) {
          bar.task('default', next => {
            count++;
            next();
          });

          bar.task('a', next => {
            count++;
            next();
          });

          bar.task('b', next => {
            count++;
            next();
          });

          bar.task('c', next => {
            count++;
            next();
          });
        });
      });

      return base.generate('foo.bar', ['a', 'b', 'c'])
        .then(() => {
          assert.equal(count, 3);
        });
    });
  });

  describe('cross-generator', cb => {
    it('should run a generator from another generator', () => {
      var res = '';

      base.register('foo', function(app, two) {
        app.register('sub', function(sub) {
          sub.task('default', next => {
            res += 'foo > sub > default ';
            base.generate('bar.sub')
              .then(() => next())
              .catch(next);
          });
        });
      });

      base.register('bar', app => {
        app.register('sub', function(sub) {
          sub.task('default', next => {
            res += 'bar > sub > default ';
            next();
          });
        });
      });

      return base.generate('foo.sub')
        .then(() => {
          assert.equal(res, 'foo > sub > default bar > sub > default ');
        });
    });

    it('should run the specified task on a registered sub-generator', () => {
      let count = 0;
      base.register('foo', app => {
        app.register('sub', function(sub) {
          sub.task('default', next => {
            count++;
            next();
          });

          sub.task('abc', next => {
            count++;
            next();
          });
        });
      });

      return base.generate('foo.sub', ['abc'])
        .then(() => {
          assert.equal(count, 1);
        });
    });
  });
});
