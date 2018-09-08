'use strict';

require('mocha');
const assert = require('assert');
const parseTasks = require('../lib/parse');
const Generate = require('..');
let parse;
let app;

describe('parse-tasks', () => {
  beforeEach(() => {
    app = new Generate();
    app.task('foo', () => {});
    app.task('bar', () => {});

    app.register('foo', foo => {
      foo.task('default', () => {});
      foo.register('one', one => {
        one.task('default', () => {});
      });
    });

    app.register('bar', bar => {
      bar.task('default', () => {});
      bar.register('two', two => {
        two.task('default', () => {});
      });
    });

    app.register('baz', () => {});
    app.register('qux', () => {});
    parse = (...tasks) => parseTasks()(app, ...tasks);
  });

  it('should parse task arguments', () => {
    assert.deepEqual(parse('foo').tasks, [{ name: 'default', tasks: ['foo'] }]);

    assert.deepEqual(parse('foo:default').tasks, [{ name: 'foo', tasks: ['default'] }]);

    assert.deepEqual(parse('foo:bar').tasks, [{ name: 'foo', tasks: ['bar'] }]);
    assert.deepEqual(parse('foo', ['bar']).tasks, [{ name: 'foo', tasks: ['bar'] }]);

    assert.deepEqual(parse('foo,bar').tasks, [{ name: 'default', tasks: ['foo', 'bar'] }]);

    assert.deepEqual(parse('baz,qux').tasks, [
      { name: 'baz', tasks: ['default'] },
      { name: 'qux', tasks: ['default'] }
    ]);


    assert.deepEqual(parse('foo,bar baz').tasks, [
      { name: 'default', tasks: ['foo', 'bar'] },
      { name: 'baz', tasks: ['default'] }
    ]);

    assert.deepEqual(parse('foo bar baz').tasks, [
      { name: 'default', tasks: ['foo'] },
      { name: 'default', tasks: ['bar'] },
      { name: 'baz', tasks: ['default'] }
    ]);

    assert.deepEqual(parse('foo:default bar:default baz').tasks, [
      { name: 'foo', tasks: ['default'] },
      { name: 'bar', tasks: ['default'] },
      { name: 'baz', tasks: ['default'] }
    ]);

    assert.deepEqual(parse('foo:default,bar baz').tasks, [
      { name: 'foo', tasks: ['default', 'bar'] },
      { name: 'baz', tasks: ['default'] }
    ]);

    assert.deepEqual(parse('foo:default,bar,baz baz').tasks, [
      { name: 'foo', tasks: ['default', 'bar', 'baz'] },
      { name: 'baz', tasks: ['default'] }
    ]);

    assert.deepEqual(parse('foo:default bar:default baz').tasks, [
      { name: 'foo', tasks: ['default'] },
      { name: 'bar', tasks: ['default'] },
      { name: 'baz', tasks: ['default'] }
    ]);

    assert.deepEqual(parse('foo:default bar:default baz,qux').tasks, [
      { name: 'foo', tasks: ['default'] },
      { name: 'bar', tasks: ['default'] },
      { name: 'baz', tasks: ['default'] },
      { name: 'qux', tasks: ['default'] }
    ]);

    assert.deepEqual(parse('foo,bar baz,qux').tasks, [
      { name: 'default', tasks: ['foo', 'bar'] },
      { name: 'baz', tasks: ['default'] },
      { name: 'qux', tasks: ['default'] }
    ]);

    assert.deepEqual(parse(['foo,bar', 'baz,qux']).tasks, [
      { name: 'default', tasks: ['foo', 'bar'] },
      { name: 'baz', tasks: ['default'] },
      { name: 'qux', tasks: ['default'] }
    ]);

    assert.deepEqual(parse('foo.one bar.two').tasks, [
      { name: 'foo.one', tasks: ['default'] },
      { name: 'bar.two', tasks: ['default'] }
    ]);

    assert.deepEqual(parse('foo.one:default bar.two:default').tasks, [
      { name: 'foo.one', tasks: ['default'] },
      { name: 'bar.two', tasks: ['default'] }
    ]);

    assert.deepEqual(parse('foo.one:abc bar.two:xyz').tasks, [
      { name: 'foo.one', tasks: ['abc'] },
      { name: 'bar.two', tasks: ['xyz'] }
    ]);

    assert.deepEqual(parse('foo.one:abc bar.two:xyz'), {
      callback: void 0,
      options: {},
      tasks: [{ name: 'foo.one', tasks: ['abc'] }, { name: 'bar.two', tasks: ['xyz'] }],
      missing: []
    });

    assert.deepEqual(parse(['foo.one:abc', { foo: 'bar' }, 'bar.two:xyz']), {
      callback: void 0,
      options: { foo: 'bar' },
      tasks: [{ name: 'foo.one', tasks: ['abc'] }, { name: 'bar.two', tasks: ['xyz'] }],
      missing: []
    });
  });
});
