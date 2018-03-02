'use strict';

const typeOf = require('kind-of');
const isGlob = require('is-glob');
const mm = require('micromatch');

/**
 * Resolve the arguments by looking up tasks and their dependencies.
 * This creates an array of composed functions to be run together.
 *
 * ```js
 * // bind the composer to the resolve call
 * const tasks = resolve.call(this, arr);
 * ```
 *
 * @param  {Array} `arr` flattened array of strings and functions to resolve.
 * @return {Array} Return array of composed functions to run.
 */

module.exports = function(args) {
  const names = Object.keys(this.tasks);
  const options = args.find(arg => typeOf(arg) === 'object') || {};
  const tasks = [];

  for (const val of args) {
    if (val === options) {
      continue;
    }

    const type = typeOf(val);
    switch (type) {
      case 'function':
        tasks.push(val);
        continue;
      case 'string':
        if (isGlob(val) && !/\[anonymous \(\d*\)\]/.test(val)) {
          const matches = mm.match(names, val);

          if (!matches.length) {
            throw new Error('glob pattern "' + val + '" does not match any registered tasks');
          }

          for (const name of matches) {
            tasks.push(resolveTask(this.tasks, name, options));
          }
        } else {
          tasks.push(resolveTask(this.tasks, val, options));
        }
        break;
      default: {
        throw new TypeError(`task argument type "${type}" is not supported`);
      }
    }
  }

  return tasks;
};

function resolveTask(tasks, name, options) {
  if (!tasks.hasOwnProperty(name)) {
    throw new Error('task "' + name + '" is not registered');
  }
  const task = tasks[name];
  task.options = Object.assign({}, task.options, options);
  return task.run.bind(task);
}
