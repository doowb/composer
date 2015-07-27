'use strict';

var composer = require('./');
var i = 0;

composer.register('writeln', function (obj) {
  console.log(obj);
  return obj;
});

composer.register('newline', function () {
  console.log();
});

composer.compose('foo', function () {
  return 'FOO ' + (i++);
}, 'writeln');

composer.compose('bar', function () {
  return 'BAR ' + (i++);
}, 'writeln');

composer.compose('baz', ['foo', 'bar']);

composer.run('baz', function () {
  return 'INLINE ' + (i++);
}, 'writeln', 'newline');

composer.run(['foo', 'bar', ['newline', 'foo', 'bar', ['newline', 'baz']]], 'newline');
