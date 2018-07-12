'use strict';

const util = require('util');
const Emitter = require('./events');
const utils = require('./utils');
const Timer = require('./timer');
const noop = cb => cb();

class Task extends Emitter {
  constructor(task = {}) {
    if (typeof task.name !== 'string') {
      throw new TypeError('expected task name to be a string');
    }
    super();
    utils.define(this, 'isTask', true);
    utils.define(this, 'app', task.app);
    this.name = task.name;
    this.status = 'pending';
    this.options = Object.assign({ deps: [] }, task.options);
    this.callback = task.callback || noop;
    this.deps = [...task.deps || [], ...this.options.deps];
    this.time = new Timer();
  }

  [util.inspect.custom]() {
    return `<Task "${this.name}" deps: [${this.deps.join(', ')}]>`;
  }

  run(options) {
    let finished = false;
    const orig = Object.assign({}, this.options);
    this.options = Object.assign({}, this.options, options);
    this.status = 'preparing';
    this.emit('preparing', this);

    if (this.skip(options)) {
      return () => Promise.resolve(null);
    }

    this.time = new Timer();
    this.time.start();
    this.status = 'starting';
    this.emit('starting', this);

    return () => {
      return new Promise((resolve, reject) => {
        const finish = (err, val) => {
          if (finished) return;
          finished = true;
          this.options = orig;
          this.time.end();
          this.status = 'finished';
          this.emit('finished', this);
          if (err) {
            utils.define(err, 'task', this);
            this.emit('error', err);
            reject(err);
          } else {
            resolve(val);
          }
        };

        if (typeof this.callback !== 'function') {
          finish();
          return;
        }

        try {
          const res = this.callback.call(this, (err, val) => {
            if (err) {
              finish(err);
            } else {
              finish(null, val);
            }
          });

          if (isEmitter(res)) {
            res.once('error', finish);
            res.once('finish', finish);
            res.once('end', finish);
            return;
          }

          if (this.callback.length === 0) {
            if (res.then) {
              res.then(() => finish());
            } else {
              finish(null, res);
            }
          }

        } catch (err) {
          finish(err);
        }
      });
    };
  }

  skip(options) {
    const app = this.app || {};
    const opts = Object.assign({}, app.options, this.options, options);

    if (opts.run === false) {
      return true;
    }

    if (Array.isArray(opts.skip)) {
      return opts.skip.includes(this.name);
    }

    switch (typeof opts.skip) {
      case 'boolean':
        return opts.skip === true;
      case 'function':
        return opts.skip(this) === true;
      case 'string':
        return opts.skip === this.name;
      default: {
        return false;
      }
    }
  }
}

function isEmitter(val) {
  return val && (typeof val.on === 'function' || typeof val.pipe === 'function');
}

module.exports = Task;
