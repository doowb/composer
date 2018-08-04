'use strict';

require('mocha');
const assert = require('assert');
const Generator = require('..');
let base;

describe('.toAlias', () => {
  beforeEach(() => {
    base = new Generator('base');
  });

  it('should not create an alias when no prefix is given', () => {
    assert.equal(base.toAlias('foo-bar'), 'foo-bar');
  });

  it('should create an alias using the `options.toAlias` function', () => {
    const alias = base.toAlias('one-two-three', {
      toAlias: function(name) {
        return name.slice(name.indexOf('-') + 1);
      }
    });
    assert.equal(alias, 'two-three');
  });

  it('should create an alias using the given function', () => {
    const alias = base.toAlias('one-two-three', function(name) {
      return name.slice(name.lastIndexOf('-') + 1);
    });
    assert.equal(alias, 'three');
  });

  it('should create an alias using base.options.toAlias function', () => {
    base.options.toAlias = function(name) {
      return name.slice(name.lastIndexOf('-') + 1);
    };

    const alias = base.toAlias('one-two-three');
    assert.equal(alias, 'three');
  });
});
