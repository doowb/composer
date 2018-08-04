'use strict';

const symbol = Symbol.for('COMPOSER_TASK_LISTENERS');
const key = name => `$${name}`;

/**
 * Create a new Emitter
 */

class Emitter {

  /**
   * Return the array of registered listeners for `event`.
   *
   * ```js
   * // all listeners for event "status"
   * console.log(emitter.listeners('status'));
   * // all listeners
   * console.log(emitter.listeners());
   * ```
   * @name .listeners
   * @param {String} `event` Event name
   * @return {Array}
   * @api public
   */

  listeners(name) {
    if (!this[symbol]) this[symbol] = {};
    if (!name) return this[symbol];
    return this[symbol][key(name)] || (this[symbol][key(name)] = []);
  }

  /**
   * Listen on the given `event` with `fn`.
   *
   * ```js
   * emitter.on('foo', () => 'do stuff');
   * ```
   * @name .on
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  on(event, fn) {
    this.listeners(event).push(fn);
    return this;
  }

  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * ```js
   * emitter.once('once', () => 'do stuff');
   * ```
   * @name .once
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  once(event, fn) {
    let on = (...args) => {
      this.off(event, on);
      fn.call(this, ...args);
    };
    on.fn = fn;
    this.on(event, on);
    return this;
  }

  /**
   * Remove the given listener for `event`, or remove all
   * registered listeners if `event` is undefined.
   *
   * ```js
   * emitter.off();
   * emitter.off('foo');
   * emitter.off('foo', fn);
   * ```
   * @name .off
   * @param {String} `event`
   * @param {Function} `fn`
   * @return {Emitter}
   * @api public
   */

  off(name, fn) {
    if (!this[symbol]) return this;

    // remove all listeners
    if (!name) {
      this[symbol] = {};
      return this;
    }

    // remove all listeners for event "name"
    if (!fn) {
      this[symbol][key(name)] = [];
      return this;
    }

    // remove all instances of "fn" from event "name"
    removeListeners(fn, this.listeners(name));
    return this;
  }

  /**
   * Emit event `name` with the given args.
   *
   * ```js
   * emitter.emit('state',  { some: 'useful info' });
   * ```
   * @name .emit
   * @param {String} `name` Event name.
   * @param {...*} [rest] Any number of additional arguments.
   * @return {Object} Returns the instance for chaining.
   * @api public
   */

  emit(name, ...rest) {
    for (let fn of [...this.listeners(name)]) fn.call(this, ...rest);
    return this;
  }

  /**
   * Returns true if the emitter has listeners registered for event `name`.
   *
   * ```js
   * console.log(emitter.has('foo')); // false
   * emitter.on('foo', 'do stuff');
   * console.log(emitter.has('foo')); // true
   * ```
   * @name .hasListeners
   * @param {String} `name` Event name
   * @return {Boolean}
   * @api public
   */

  hasListeners(name) {
    return this.listeners(name).length > 0;
  }
}

/**
 * Remove all instances of the given `fn` from listeners.
 */

function removeListeners(fn, listeners) {
  for (let i = 0; i < listeners.length; i++) {
    let listener = listeners[i];
    if (listener === fn || listener.fn === fn) {
      listeners.splice(i, 1);
      return removeListeners(fn, listeners);
    }
  }
}

/**
 * Expose `Emitter`
 */

module.exports = Emitter;
