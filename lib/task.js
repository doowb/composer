'use strict';

const Emitter = require('events');
const typeOf = require('kind-of');
const define = require('./define');
const Timer = require('./timer');

class Task extends Emitter {
  constructor(task = {}) {
    if (typeof task.name !== 'string') {
      throw new TypeError('expected task name to be a string');
    }
    super();
    define(this, 'isTask', true);
    define(this, 'app', task.app);
    this.name = task.name;
    this.options = Object.assign({}, task.options);
    this.deps = task.deps || this.options.deps || [];
    this.callback = task.callback || (cb => cb());
    this.time = new Timer(this);
    this.times = [];
    this.runs = [];
  }

  run(options) {
    const orig = Object.assign({}, this.options);
    this.options = Object.assign({}, this.options, options);

    if (this.skip(options)) {
      return () => Promise.resolve(null);
    }

    let finished = false;
    const callback = this.callback.bind(this);
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
              define(err, 'task', this);
              this.emit('error', err);
              reject(err);
            } else {
              resolve(val);
            }
          });

          if (isEmitter(res)) {
            res.once('error', reject);
            res.once('finish', () => {
              if (finished) return;
              finished = true;
              resolve();
            });
            res.once('end', () => {
              if (finished) return;
              finished = true;
              resolve();
            });
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
    const opts = Object.assign({}, this.app && this.app.options, this.options, options);

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

  start() {
    return this.time.start();
  }

  end() {
    return this.time.end();
  }

  get status() {
    return this.time.status;
  }
}

function isEmitter(val) {
  return val && typeof val.on === 'function';
}

module.exports = Task;
