'use strict';

const Composer = require('..');
const composer = new Composer();

/**
 * Listen for tasks
 */

composer.on('task', task => console.log(task.status.padStart(9), task.name));

/**
 * Example of a noop task with a callback.
 */

composer.task('noop-callback', cb => cb());

/**
 * Example of a noop task that returns a promise
 */

composer.task('noop-promise', () => Promise.resolve(null));

/**
 * Example of how to run them
 */

composer.build(['noop-promise', 'noop-callback'])
  .then(() => console.log('Done!'))
  .catch(console.error);
