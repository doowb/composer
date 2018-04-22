'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('.generate', function() {
  beforeEach(function() {
    base = new Generator();
  });

  describe('generators', function() {
    it('should throw an error when a generator is not found', function() {
      return base.generate('fdsslsllsfjssl')
        .catch(err => {
          assert(err);
          assert(/is not registered/i.test(err.message));
        });
    });

    it('should throw an error when the default task is not found', function() {
      base.register('foo', function() {});
      return base.generate('foo', ['default'])
        .catch(err => {
          assert(err);
          assert(/is not registered/i.test(err.message));
        });
    });

    it('should throw an error when a task is not found (task array)', function() {
      base.register('fdsslsllsfjssl', function() {});
      return base.generate('fdsslsllsfjssl', ['foo'])
        .catch(err => {
          assert(err);
          assert(/task/i.test(err.message));
          assert(/is not registered/i.test(err.message));
        });
    });

    it('should throw an error when a task is not found (task string)', function() {
      base.register('fdsslsllsfjssl', function() {});
      return base.generate('fdsslsllsfjssl', 'foo')
        .catch(err => {
          assert(err);
          assert(/task/i.test(err.message));
          assert(/is not registered/i.test(err.message));
        });
    });

    it('should handle task errors', function() {
      base.task('default', function(next) {
        next(new Error('whatever'));
      });

      return base.generate('default')
        .catch(err => {
          assert(err);
          assert.equal(err.message, 'whatever');
        });
    });

    it('should run a task on the instance', function() {
      base.task('abc123', next => next());
      return base.generate('abc123');
    });

    it('should run a task on the instance', function() {
      base.task('abc123', next => next());
      return base.generate('abc123');
    });

    it('should run same-named task instead of a generator', function() {
      base.register('123xyz', function(app) {
        throw new Error('expected the task to run first');
      });

      base.task('123xyz', cb => cb());
      return base.generate('123xyz');
    });

    it('should run a task instead of a generator with a default task', function() {
      base.register('123xyz', function(app) {
        app.task('default', function() {
          return Promise.resolve(new Error('expected the task to run first'));
        });
      });
      base.task('123xyz', cb => cb());
      return base.generate('123xyz');
    });

    it('should run a task on a same-named generator when the task is specified', function() {
      let count = 0;
      base.register('foo', function(app) {
        app.task('default', function(next) {
          count++;
          next();
        });
      });

      base.task('foo', function() {
        throw new Error('expected the generator to run');
      });

      return base.generate('foo', ['default'])
        .then(function() {
          assert.equal(count, 1);
        });
    });

    it('should run a generator from a task with the same name', function() {
      base.register('foo', function(app) {
        app.task('default', function(next) {
          next();
        });
      });

      base.task('foo', () => base.generate('foo'));
      return base.build('foo');
    });

    it('should run the default task on a generator', function(cb) {
      base.register('foo', function(app) {
        app.task('default', function(next) {
          next();
        });
      });

      base.generate('foo', function(err) {
        assert(!err);
        cb();
      });
    });

    it('should run a list of tasks on the instance', function() {
      let count = 0;
      base.task('a', function(next) {
        count++;
        next();
      });
      base.task('b', function(next) {
        count++;
        next();
      });
      base.task('c', function(next) {
        count++;
        next();
      });

      return base.generate('a', 'b', 'c')
        .then(function() {
          assert.equal(count, 3);
        });
    });

    it('should run an array of tasks on the instance', function() {
      let count = 0;
      base.task('a', function(next) {
        count++;
        next();
      });
      base.task('b', function(next) {
        count++;
        next();
      });
      base.task('c', function(next) {
        count++;
        next();
      });

      return base.generate(['a', 'b', 'c'])
        .then(() => {
          assert.equal(count, 3);
        });
    });

    it('should run the default task on a registered generator', function() {
      let count = 0;

      base.register('foo', function(app) {
        app.task('default', function(next) {
          count++;
          next();
        });
      });

      return base.generate('foo')
        .then(() => {
          assert.equal(count, 1);
        });
    });

    it('should run an array of generators', function() {
      let count = 0;
      base.register('foo', function(app) {
        app.task('default', function(next) {
          count++;
          next();
        });
      });

      base.register('bar', function(app) {
        app.task('default', function(next) {
          count++;
          next();
        });
      });

      return base.generate(['foo', 'bar'])
        .then(() => {
          assert.equal(count, 2);
        });
    });

    it('should run the default tasks on an array of generators', function() {
      let count = 0;
      base.register('a', function(app) {
        this.task('default', function(cb) {
          count++;
          cb();
        });
      });

      base.register('b', function(app) {
        this.task('default', function(cb) {
          count++;
          cb();
        });
      });

      base.register('c', function(app) {
        this.task('default', function(cb) {
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

  describe('options', function(cb) {
    it('should pass options to generator.options', function() {
      let count = 0;
      base.register('default', function(app, options) {
        app.task('default', function(next) {
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

    it('should expose options on generator options', function() {
      let count = 0;
      base.register('default', function(app, options) {
        app.task('default', function(next) {
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

    it('should not mutate options on parent instance', function() {
      let count = 0;
      base.register('default', function(app, options) {
        app.task('default', function(next) {
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

  describe('default tasks', function(cb) {
    it('should run the default task on the _default_ generator', function() {
      let count = 0;
      base.register('default', function(app) {
        app.task('default', function(next) {
          count++;
          next();
        });
      });

      return base.generate()
        .then(() => {
          assert.equal(count, 1);
        });
    });

    it('should run the default task on the _specified_ generator', function() {
      let count = 0;

      base.register('foo', function(app) {
        app.task('default', function(next) {
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

  describe('specified tasks', function(cb) {
    it('should run the specified task on a registered generator', function() {
      let count = 0;
      base.register('foo', function(app) {
        app.task('default', function(next) {
          count++;
          next();
        });

        app.task('abc', function(next) {
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

  describe('sub-generators', function(cb) {
    it('should run the default task on a registered sub-generator', function() {
      let count = 0;
      base.register('foo', function(app) {
        app.register('sub', function(sub) {
          sub.task('default', function(next) {
            count++;
            next();
          });

          sub.task('abc', function(next) {
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

    it('should run the specified task array on a registered sub-generator', function() {
      let count = 0;
      base.register('foo', function(app) {
        app.register('sub', function(sub) {
          sub.task('default', function(next) {
            count++;
            next();
          });

          sub.task('abc', function(next) {
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

    it('should run default tasks on an array of nested sub-generators', function() {
      let count = 0;
      base.register('foo', function(app) {
        app.register('one', function(one) {
          one.task('default', function(next) {
            count++;
            next();
          });
        });

        app.register('two', function(two) {
          two.task('default', function(next) {
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

    it('should run an array of nested sub-generators', function() {
      let count = 0;
      base.register('foo', function(app) {
        app.register('one', function(one) {
          one.task('default', function(next) {
            count++;
            next();
          });
        });

        app.register('two', function(two) {
          two.task('default', function(next) {
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

    it('should run an array of tasks on a registered sub-generator', function() {
      let count = 0;
      base.register('foo', function(app) {
        app.register('bar', function(bar) {
          bar.task('default', function(next) {
            count++;
            next();
          });

          bar.task('a', function(next) {
            count++;
            next();
          });

          bar.task('b', function(next) {
            count++;
            next();
          });

          bar.task('c', function(next) {
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

  describe('cross-generator', function(cb) {
    it('should run a generator from another generator', function() {
      var res = '';

      base.register('foo', function(app, two) {
        app.register('sub', function(sub) {
          sub.task('default', function(next) {
            res += 'foo > sub > default ';
            base.generate('bar.sub')
              .then(() => next())
              .catch(next);
          });
        });
      });

      base.register('bar', function(app) {
        app.register('sub', function(sub) {
          sub.task('default', function(next) {
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

    it('should run the specified task on a registered sub-generator', function() {
      let count = 0;
      base.register('foo', function(app) {
        app.register('sub', function(sub) {
          sub.task('default', function(next) {
            count++;
            next();
          });

          sub.task('abc', function(next) {
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
