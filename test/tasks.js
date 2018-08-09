'use strict';

require('mocha');
const assert = require('assert');
const through = require('through2');
const { Tasks } = require('..');
let app;

describe('tasks', () => {
  beforeEach(() => {
    app = new Tasks();
  });

  it('should run a task using a noop when `.run` is called', () => {
    const events = [];
    const push = task => events.push(task.name + ':' + task.status);

    app.on('task', push);
    app.on('task-registered', push);
    app.on('task-preparing', push);

    app.task('foo');
    app.task('default', ['foo']);

    return app.build('default').then(() => {
      assert.deepEqual(events, [
        'foo:registered',
        'default:registered',
        'default:preparing',
        'default:starting',
        'foo:preparing',
        'foo:starting',
        'foo:finished',
        'default:finished'
      ]);
    });
  });

  it('should cause an error if invalid deps are resolved `.run` is called', () => {
    const tasks = [];
    app = new Tasks();
    app.on('task', task => tasks.push(`${task.name}:${task.status}`));

    app.task('foo');
    app.task('default', { deps: ['foo', { foo: 'bar' }, { bang: 'baz' }] });

    return app.build('default')
      .then(() => {
        throw new Error('exected an error');
      })
      .catch(err => {
        assert(/expected/.test(err.message));
      });
  });

  it('should signal that a task is complete when a stream is returned', () => {
    app = new Tasks();
    const events = [];
    let count = 0;

    app.on('task-registered', task => events.push(task.status));
    app.on('task-preparing', task => events.push(task.status));
    app.on('task', task => events.push(task.status));
    app.task('default', () => {
      const stream = through.obj(function(data, enc, next) {
        count++;
        next();
      });
      stream.write(count);
      stream.end();
      return stream;
    });

    return app.build('default')
      .then(() => {
        assert.deepEqual(events, [ 'registered', 'preparing', 'starting', 'finished' ]);
        assert.equal(count, 1);
      });
  });
});
