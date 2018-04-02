'use strict';

const typeOf = require('kind-of');
const Emitter = require('events');
const utils = require('./utils');
const Timer = require('./timer');

class Task extends Emitter {
  constructor(task = {}) {
    if (typeof task.name !== 'string') {
      throw new TypeError('expected task name to be a string');
    }
    super();
    utils.define(this, 'isTask', true);
    utils.define(this, 'app', task.app);
    this.name = task.name;
    this.options = Object.assign({}, task.options);
    this.callback = task.callback || (cb => cb());
    this.deps = (task.deps || []).concat(this.options.deps || []);
    this.time = new Timer(this);
    this.times = [];
    this.runs = [];
  }

  run(options) {
    let finished = false;
    const orig = Object.assign({}, this.options);
    this.options = Object.assign({}, this.options, options);

    if (this.skip(options)) {
      return () => Promise.resolve(null);
    }

    this.time = new Timer(this);
    this.times.push(this.time);

    if (this.time.status !== 'starting') {
      this.time.start();
      this.emit('starting', this);
    }

    return () => {
      return new Promise((resolve, reject) => {
        if (typeof this.callback !== 'function') {
          resolve();
          return;
        }

        try {
          const res = this.callback.call(this, (err, val) => {
            this.options = orig;
            this.time.end();
            this.emit('finished', this);

            if (err) {
              utils.define(err, 'task', this);
              this.emit('error', err);
              reject(err);
            } else {
              resolve(val);
            }
          });

          const finish = () => {
            if (finished) return;
            finished = true;
            resolve();
          };

          if (isEmitter(res)) {
            res.once('error', reject);
            res.once('finish', finish);
            res.once('end', finish);
            return;
          }

          if (this.callback.length === 0) {
            return resolve(res);
          }

        } catch (err) {
          this.emit('error', err);
          reject(err);
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

    switch (typeOf(opts.skip)) {
      case 'undefined':
        return false;
      case 'boolean':
        return opts.skip === false;
      case 'string':
        return opts.skip === this.name;
      case 'array':
        return opts.skip.indexOf(this.name) >= 0;
      default: {
        return false;
      }
    }
  }

  get status() {
    return this.time.status;
  }
}

function isEmitter(val) {
  return val && typeof val.on === 'function';
}

module.exports = Task;
