'use strict';

const typeOf = require('kind-of');
const utils = require('./utils');
const Timer = require('./timer');

module.exports = function(Emitter) {
  return class Task extends Emitter {
    constructor(task = {}) {
      if (typeof task.name !== 'string') {
        throw new TypeError('expected task name to be a string');
      }
      super();
      utils.define(this, 'isTask', true);
      utils.define(this, 'app', task.app);
      this.name = task.name;
      this.status = 'pending';
      this.options = Object.assign({}, task.options);
      this.callback = task.callback || (cb => cb());
      this.deps = (task.deps || []).concat(this.options.deps || []);
      this.time = new Timer();
      this.times = [];
      this.runs = [];
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
          if (typeof this.callback !== 'function') {
            resolve();
            return;
          }

          try {
            const res = this.callback.call(this, (err, val) => {
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
            });

            if (isEmitter(res)) {
              const finish = () => {
                if (finished) return;
                finished = true;
                resolve();
              };
              res.once('error', reject);
              res.once('finish', finish);
              res.once('end', finish);
              return;
            }

            if (this.callback.length === 0) {
              resolve(res);
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
        case 'array':
          return opts.skip.indexOf(this.name) >= 0;
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
  };
};

function isEmitter(val) {
  return val && typeof val.on === 'function';
}
