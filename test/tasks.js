'use strict';

require('mocha');
const assert = require('assert');
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
        'default:starting',
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
});
