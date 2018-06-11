'use strict';

const use = require('use');
const util = require('util');
const Task = require('./task');
const Tasks = require('./tasks');
const utils = require('./utils');
const Events = require('./events');
const flatten = arr => [].concat.apply([], arr);

/**
 * Static factory method for creating a custom `Composer` class that
 * extends the given `Emitter`.
 *
 * ```js
 * const Emitter = require('events');
 * const Composer = require('composer').create(Emitter);
 * const composer = new Composer();
 * ```
 * @name .create
 * @param {function} `Emitter` Event emitter.
 * @return {Class} Returns a custom `Composer` class.
 * @api public
 */

const factory = (Emitter = Events) => {
  class Generator extends Tasks(Emitter) {
    constructor(name, options = {}) {
      if (name && typeof name !== 'string') {
        options = name;
        name = void 0;
      }
      super(!/(Event)?Emitter/.test(Emitter.name) ? options : null);
      this.name = name;
      this.options = options;
      this.namespaces = new Map();
      this.generators = new Map();
      if (!this.use) use(this);
    }

    /**
     * Create a wrapped generator function with the given `name`, `config`, and `fn`.
     *
     * @param {string} `name`
     * @param {object} `config` (optional)
     * @param {function} `fn`
     * @return {function}
     * @api public
     */

    toGenerator(name, config, fn) {
      if (typeof config === 'function' || this.isGenerator(config)) {
        fn = config;
        config = fn || {};
      }

      const alias = this.toAlias(name);
      const generator = options => {
        if (generator.instance && generator.once !== false) {
          return generator.instance;
        }

        const opts = Object.assign({}, config, options);
        const app = this.isGenerator(fn) ? fn : new this.constructor(opts);
        this.run(app);

        generator.instance = app;
        generator.called++;
        fn.called = generator.called;

        app.alias = alias;
        app.name = name;

        define(app, 'parent', this);
        this.emit('generator', app);

        // emit errors that happen on initialization
        const listeners = {};
        const bubble = (events) => {
          for (const name of events) {
            const fn = listeners[name] || (listeners[name] = this.emit.bind(this, name));
            app.off(name, fn);
            app.on(name, fn);
          }
        };

        bubble(['error', 'task', 'build']);

        if (typeof fn === 'function') {
          fn.call(app, app, opts);
          // re-register emitters that we just registered a few lines ago,
          // to ensure that errors are bubbled up in the correct order
          bubble(['error', 'task', 'build']);
        }

        if (opts && opts.once === false) {
          generator.once = false;
        }

        return app;
      };

      define(generator, 'name', alias);
      define(generator, 'parent', this);
      define(generator, 'instance', null);
      define(generator, 'called', 0);
      generator.isGenerator = true;
      generator.alias = alias;
      generator.fn = fn;
      return generator;
    }

    /**
     * Returns true if the given value is a Composer generator object.
     *
     * @param {object} `val`
     * @return {boolean}
     * @api public
     */

    isGenerator(val) {
      return this.constructor.isGenerator(val);
    }

    /**
     * Alias to `.setGenerator`.
     *
     * ```js
     * app.register('foo', function(app, base) {
     *   // "app" is a private instance created for the generator
     *   // "base" is a shared instance
     * });
     * ```
     * @name .register
     * @param {string} `name` The generator's name
     * @param {object|Function|String} `options` or generator
     * @param {object|Function|String} `generator` Generator function, instance or filepath.
     * @return {object} Returns the generator instance.
     * @api public
     */

    register(...args) {
      return this.setGenerator(...args);
    }

    /**
     * Get and invoke generator `name`, or register generator `name` with
     * the given `val` and `options`, then invoke and return the generator
     * instance. This method differs from `.register`, which lazily invokes
     * generator functions when `.generate` is called.
     *
     * ```js
     * app.generator('foo', function(app, options) {
     *   // "app" - private instance created for generator "foo"
     *   // "options" - options passed to the generator
     * });
     * ```
     * @name .generator
     * @param {string} `name`
     * @param {function|Object} `fn` Generator function, instance or filepath.
     * @return {object} Returns the generator instance or undefined if not resolved.
     * @api public
     */

    generator(name, options, fn) {
      if (typeof options === 'function') {
        fn = options;
        options = {};
      }

      if (typeof fn !== 'function') {
        return this.getGenerator(name, options);
      }

      this.setGenerator(name, options, fn);
      return this.getGenerator(name);
    }

    /**
     * Store a generator by file path or instance with the given
     * `name` and `options`.
     *
     * ```js
     * app.setGenerator('foo', function(app, options) {
     *   // "app" - new instance of Generator created for generator "foo"
     *   // "options" - options passed to the generator
     * });
     * ```
     * @name .setGenerator
     * @param {string} `name` The generator's name
     * @param {object|Function|String} `options` or generator
     * @param {object|Function|String} `generator` Generator function, instance or filepath.
     * @return {object} Returns the generator instance.
     * @api public
     */

    setGenerator(name, options, fn) {
      const generator = this.toGenerator(name, options, fn);
      const alias = generator.alias;
      this.base.namespaces.set(`${this.namespace}.${alias}`, generator);
      this.generators.set(alias, generator);
      return this;
    }

    /**
     * Get generator `name` from `app.generators`, same as [findGenerator], but also invokes
     * the returned generator with the current instance. Dot-notation may be used for getting
     * sub-generators.
     *
     * ```js
     * const foo = app.getGenerator('foo');
     *
     * // get a sub-generator
     * const baz = app.getGenerator('foo.bar.baz');
     * ```
     * @name .getGenerator
     * @param {string} `name` Generator name.
     * @return {object|undefined} Returns the generator instance or undefined.
     * @api public
     */

    getGenerator(name, options) {
      const fn = this.findGenerator(name);

      if (!this.isGenerator(fn)) {
        throw this.formatError(name);
      }

      if (typeof fn === 'function') {
        // return the generator instance if one has already created,
        // otherwise call the generator function with the parent instance
        return fn.instance || fn.call(fn.parent, options);
      }
      return fn;
    }

    /**
     * Find generator `name`, by first searching the cache, then searching the
     * cache of the `base` generator. Use this to get a generator without invoking it.
     *
     * ```js
     * // search by "alias"
     * const foo = app.findGenerator('foo');
     *
     * // search by "full name"
     * const foo = app.findGenerator('generate-foo');
     * ```
     * @name .findGenerator
     * @param {string} `name`
     * @param {function} `options` Optionally supply a rename function on `options.toAlias`
     * @return {object|undefined} Returns the generator instance if found, or undefined.
     * @api public
     */

    findGenerator(name) {
      if (!name) return null;
      const cached = this.base.namespaces.get(name);
      let names = [];
      let app = this;

      if (this.isGenerator(cached)) {
        return cached;
      }

      names = typeof name === 'string'
        ? name.split('.').map(n => this.toAlias(n))
        : name;

      const key = names.join('.');

      if (names.length === 1) {
        app = this.generators.get(key);

      } else {
        do {
          const alias = names.shift();
          const gen = app.generators.get(alias);

          if (!this.isGenerator(gen)) {
            return null;
          }

          // only invoke the generator if it's not the last one
          if (names.length) {
            app = gen.instance || app.getGenerator(alias);
          } else {
            app = gen;
          }

        } while (app && names.length);
      }

      return this.isGenerator(app) ? app : null;
    }

    /**
     * Returns true if the given name is a registered generator. Dot-notation may be
     * used to check for sub-generators.
     *
     * ```js
     * console.log(app.hasGenerator('foo'));
     * console.log(app.hasGenerator('foo.bar'));
     * ```
     * @param {string} `name`
     * @return {boolean}
     * @api public
     */

    hasGenerator(name) {
      return this.findGenerator(name) != null;
    }

    /**
     * Run one or more tasks or sub-generators and returns a promise.
     *
     * ```js
     * // run tasks `bar` and `baz` on generator `foo`
     * app.generate('foo', ['bar', 'baz']);
     *
     * // or use shorthand
     * app.generate('foo:bar,baz');
     *
     * // run the `default` task on generator `foo`
     * app.generate('foo');
     *
     * // run the `default` task on the `default` generator, if defined
     * app.generate();
     * ```
     * @name .generate
     * @emits `generate` with the generator `name` and the array of `tasks` that are queued to run.
     * @param {string} `name`
     * @param {string|Array} `tasks`
     * @return {promise}
     * @api public
     */

    async generate(...tasks) {
      const options = tasks.find(val => utils.isObject(val) && !val.isTask);
      const rest = options ? tasks.filter(val => val && val !== options) : tasks.slice();
      const name = rest.shift() || 'default';
      const flat = flatten(rest);
      const opts = Object.assign({}, this.options, options);

      if (isDefault(this, name)) {
        return await this.generate('default', ...tasks);
      }

      if (Array.isArray(name) && this.isGenerators(name)) {
        for (const key of name) {
          await this.getGenerator(key).generate('default', ...rest);
        }
        return Promise.resolve(null);
      }

      // either an array of tasks, or a string task with task dependencies
      if (flat[0] !== 'default') {
        const task = this.tasks.get(name);
        if (this.isTasks(name) || (task && !this.taskStack.has(task) && this.isTasks(flat))) {
          return await this.build(name, ...rest);
        }
      }

      // "name" is a generator
      const app = this.getGenerator(name, opts);
      if (Array.isArray(rest[0]) && app.isGenerators(rest[0])) {
        return await app.generate(...rest);
      }

      return await app.build(...rest);
    }

    /**
     * Create a generator alias from the given `name`. By default, `generate-`
     * is stripped from beginning of the generator name.
     *
     * ```js
     * // customize the alias
     * const app = new Generate({ toAlias: require('camel-case') });
     * ```
     * @name .toAlias
     * @param {string} `name`
     * @param {object} `options`
     * @return {string} Returns the alias.
     * @api public
     */

    toAlias(name, options) {
      if (typeof options === 'function') {
        return options(name);
      }
      if (options && typeof options.toAlias === 'function') {
        return options.toAlias(name);
      }
      if (typeof this.options.toAlias === 'function') {
        return this.options.toAlias(name);
      }
      return name ? name.replace(/^generate-/, '') : '';
    }

    /**
     * Returns true if every name in the given array is a registered generator.
     * @name .isGenerators
     * @param {array} `names`
     * @return {boolean}
     * @api public
     */

    isGenerators(names) {
      return names.every(name => this.hasGenerator(name));
    }

    /**
     * Custom inspect function
     */

    [util.inspect.custom]() {
      if (typeof this.options.inspectFn === 'function') {
        return this.options.inspectFn(this);
      }
      const names = [...this.generators.keys()].join(', ');
      const tasks = [...this.tasks.keys()].join(', ');
      return `<Generator "${this.namespace}" tasks: [${tasks}], generators: [${names}]>`;
    }

    /**
     * Disable inspect. Returns a function to re-enable inspect. Useful for debugging.
     */

    disableInspect() {
      const inspect = this.inspect;
      this.inspect = null;
      return () => {
        define(this, 'inspect', inspect);
      };
    }

    /**
     * Format task and generator errors.
     * @name .formatError
     * @param {string} `name`
     * @return {error}
     * @api public
     */

    formatError(name, type = 'generator') {
      let key = this.namespace || 'default';
      if (this !== this.base) {
        key = key.replace(/^[^.]+\.?/, '');
      }

      let msg = `${type} "${name}" is not registered on `;
      if (this.namespaces) {
        msg += `generator "${key}"`;
      } else {
        msg += 'the root generator';
      }
      return new Error(msg);
    }

    /**
     * Get the first ancestor instance when `generator.parent` is defined on nested instances.
     * @name .base
     * @api public
     */

    get base() {
      return this.parent ? this.parent.base : this;
    }

    /**
     * Get or set the generator name.
     * @param {string} [name="root"]
     * @return {string}
     * @api public
     */

    set name(val) {
      define(this, '_name', val);
    }
    get name() {
      return this._name || 'generate';
    }

    /**
     * Get or set the generator `alias`. By default, the generator alias is created
     * by passing the generator name to the [.toAlias](#toAlias) method.
     * @param {string} [alias="generate"]
     * @return {string}
     * @api public
     */

    set alias(val) {
      define(this, '_alias', val);
    }
    get alias() {
      return this._alias || this.toAlias(this.name, this.options);
    }

    /**
     * Get the generator namespace. The namespace is created by joining the generator's `alias`
     * to the alias of each ancestor generator.
     * @param {string} [namespace="root"]
     * @return {string}
     * @api public
     */

    get namespace() {
      return this.parent ? this.parent.namespace + '.' + this.alias : this.alias;
    }

    /**
     * Get the depth of a generator - useful for debugging. The root generator
     * has a depth of `0`, sub-generators add `1` for each level of nesting.
     * @return {number}
     * @api public
     */

    get depth() {
      return this.parent ? this.parent.depth + 1 : 0;
    }

    /**
     * Static method that returns true if the given `val` is an instance of Generate.
     * @param {object} `val`
     * @return {boolean}
     * @api public
     * @static
     */

    static isGenerator(val) {
      return val instanceof this || (typeof val === 'function' && val.isGenerator === true);
    }

    static create(Emitter) {
      return factory(Emitter);
    }

    static Tasks(Emitter) {
      return Tasks(Emitter);
    }

    static Task(Emitter) {
      return Task(Emitter);
    }
  }

  return Generator;
};

function isDefault(app, name) {
  if (name === 'default' || !app.hasGenerator('default')) {
    return false;
  }
  name = [].concat(name);
  const gen = app.getGenerator('default');
  const key = name[0].split('.').shift();
  return gen.tasks.has(key) || gen.hasGenerator(key);
}

function define(obj, key, val) {
  Reflect.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: val
  });
}

module.exports = factory;
