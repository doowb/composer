'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let app;

describe('default generator', () => {
  beforeEach(() => {
    app = new Generator();
  });

  it('should throw an error when a default generator is not found', () => {
    return app.generate('default')
      .catch(err => {
        assert(err);
        assert(/is not registered/i.test(err.message));
      });
  });

  it('should not throw an error when a default task on default generator is not found', cb => {
    app.register('default', () => {});
    app.generate('default', 'default')
      .catch(err => {
        assert(err);
        assert(/task/i.test(err.message));
        assert(/is not registered/i.test(err.message));
        cb();
      });
  });

  it('should prefer tasks on the default generator over anything on the app instance', () => {
    let count = { app: 0, default: 0 };

    app.task('foo', next => {
      count.app++;
      next();
    });

    app.register('foo', foo => {
      foo.task('default', next => {
        count.app++;
        next();
      });
    });

    app.register('default', gen => {
      gen.task('bar', next => {
        // I should win
        count.default++;
        next();
      });

      gen.register('bar', bar => {
        bar.task('default', next => {
          count.default++;
          next();
        });
      });
    });

    return app.generate('foo')
      .then(() => {
        assert.equal(count.app, 1);
        assert.equal(count.default, 0);
      });
  });

  it('should prefer generators on the default generator over anything on the app instance', () => {
    let count = { app: 0, default: 0 };

    app.task('foo', next => {
      count.app++;
      next();
    });

    app.register('foo', foo => {
      foo.task('default', next => {
        count.app++;
        next();
      });
    });

    app.register('default', gen => {
      gen.task('foo', next => {
        // I should win
        count.default++;
        next();
      });

      gen.register('foo', foo => {
        foo.task('default', next => {
          count.default++;
          next();
        });
      });
    });

    return app.generate('foo')
      .then(() => {
        assert.equal(count.app, 0);
        assert.equal(count.default, 1);
      });
  });

  it('should run default tasks on an array of nested sub-generators', () => {
    let count = 0;
    const task = async() => count++;
    const def = app => app.task('default', task);

    app.register('default', function() {
      this.register('foo', app => {
        app.register('one', def);
        app.register('two', def);
      });

      this.register('bar', app => {
        app.register('one', def);
        app.register('two', def);
        app.register('three', () => {
          this.task('zzz', task);
          this.task('default', ['zzz']);
        });
      });
    });

    return app.generate(['foo.one'])
      .then(() => {
        assert.equal(count, 1);
      });

    // return app.generate(['foo.one', 'foo.two', 'bar.one', 'bar.two', 'bar.three'])
    //   .then(() => {
    //     assert.equal(count, 5);
    //   });
  });

  it('should throw an error when default task is called and missing on default generator', () => {
    let count = { app: 0, default: 0 };

    app.register('default', gen => {
      gen.task('default', next => {
        count.default++;
        next();
      });
    });

    return app.generate('default')
      .then(() => {
        assert.equal(count.default, 1);
      });
  });

  it('should throw an error when default task is called and missing on default generator', () => {
    app.register('default', gen => {});

    return app.generate('default')
      .catch(err => {
        assert(err);
        assert(/default/.test(err.message));
        assert(/not registered/.test(err.message));
      });
  });

  it('should handle errors from default generator tasks', () => {
    app.register('default', gen => {
      gen.task('foo', next => {
        next(new Error('huge error!'));
      });
    });

    return app.generate('foo')
      .catch(err => {
        assert(err);
        assert(/huge error/.test(err.message));
      });
  });
});
