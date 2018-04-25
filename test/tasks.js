'use strict';

require('mocha');
const assert = require('assert');
const through = require('through2');
const Tasks = require('..');

describe('tasks', function() {
  it('should run a task using a noop when `.run` is called', function() {
    const tasks = [];

    const app = new Tasks();
    app.on('task', task => tasks.push(`${task.name}:${task.status}`));

    app.task('foo');
    app.task('default', ['foo']);

    return app.build('default').then(() => {
      assert.deepEqual(tasks, [
        'foo:pending',
        'default:pending',
        'default:preparing',
        'default:starting',
        'foo:preparing',
        'foo:starting',
        'foo:finished',
        'default:finished'
      ]);
    });
  });

  it('should cause an error if invalid deps are resolved `.run` is called', function() {
    const tasks = [];
    const app = new Tasks();
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

  it('should signal that a task is complete when a stream is returned', function() {
    const app = new Tasks();
    const events = [];
    let count = 0;

    app.on('task', task => events.push(task.status));
    app.task('default', function() {
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
        assert.deepEqual(events, [ 'pending', 'preparing', 'starting', 'finished' ]);
        assert.equal(count, 1);
      });
  });
});
