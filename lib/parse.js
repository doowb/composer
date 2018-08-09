'use strict';

const { isObject } = require('./utils');

/**
 * Parse task expressions from the argv._ (splat) array
 */

module.exports = function parse(app, ...rest) {
  if (!app) return [];
  if (rest.length === 1 && Array.isArray(rest[0])) rest = rest[0];
  let options = rest.find(val => isObject(val) && val.isTask !== true);
  rest = rest.filter(val => val !== options);

  let callback = rest.find(val => typeof val === 'function');
  let args = rest.filter(val => val !== options && val !== callback);
  let opts = { ...app.options, ...options };

  if (typeof args[0] === 'string' && Array.isArray(args[1])) {
    args = [args[0] + ':' + args[1].join(',')];
  }

  args = args.join(' ').split(' ');
  let result = [];

  for (const arg of args) {
    let segs = arg.split(':');
    if (segs.length > 2) {
      throw new SyntaxError('spaces must be used to separate multiple generator names');
    }

    let tasks = segs[1] ? segs[1].split(',') : segs[0].split(',');
    let name = segs[1] ? segs[0] : null;
    let task = { name: null, tasks: [] };

    tasks.forEach(val => {
      if (!app.tasks.has(val) && app.hasGenerator(name + '.' + val)) {
        result.push({ name: [name, val].join('.'), tasks: ['default'] });
        tasks = tasks.filter(v => v !== val);
      }
    });

    if (segs.length === 2 && tasks.length) {
      task.name = name;
      task.tasks = tasks;
      result.push(task);
      continue;
    }

    for (let key of tasks) {
      if ((!app.tasks.has(key) || app.taskStack.has(key)) && app.hasGenerator(key)) {
        if (app.name === 'default' && !key.startsWith('default.')) {
          key = `default.${key}`;
        }
        result.push({ name: key, tasks: ['default' ]});
      } else if (app.tasks.has(key)) {
        task.name = 'default';
        task.tasks.push(key);
      }
    }

    if (task.name) {
      result.push(task);
    }
  }

  if (rest.length && !result.length && app.name !== 'default') {
    return parse(app.getGenerator('default'), ...rest);
  }

  if (!rest.length && !result.length) {
    result = [{ name: 'default', tasks: ['default'] }];
  }

  return { options: opts, callback, tasks: result };
};
