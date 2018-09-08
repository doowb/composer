'use strict';

console.time('total');
const fs = require('fs');
const path = require('path');
const util = require('util');
const Composer = require('..');
const composer = new Composer();
const writeFile = util.promisify(fs.writeFile);
const argv = require('minimist')(process.argv.slice(2));

composer.register('git', git => {
  git.task('ignore', () => {
    return writeFile('.gitignore', '*.sublime-*');
  });

  git.task('attributes', () => {
    return writeFile('.gitattributes', '* text eol=lf');
  });

  git.task('default', ['ignore', 'attributes']);
});

composer.register('npm', npm => {
  npm.task('default', () => {
    return writeFile('.npmrc', 'package-lock=false');
  });
});

composer.register('foo', foo => {
  foo.register('dotfiles', dotfiles => {
    dotfiles.task('git', () => composer.generate('git'));
    dotfiles.task('npm', () => composer.generate('npm'));
    dotfiles.task('default', ['git', 'npm']);
  });
});

composer.generate(argv._.length ? argv._ : 'git')
  .then(() => console.timeEnd('total'))
  .catch(console.log)

// class App {
//   constructor(alias) {
//     this.alias = alias;
//     this.cache = {};
//   }

//   register(alias, fn) {
//     this.cache[alias] = fn;
//     return this;
//   }

//   generate(alias) {
//     const fn = this.cache[alias];
//     const app = new App(alias);
//     fn(app);
//     return app;
//   }
// }

// const app = new App('base');

// app.register('foo', function(foo) {
//   console.log('GENERATOR ALIAS:', foo);
// });

// app.register('bar', function(bar) {
//   console.log('GENERATOR ALIAS:', bar);
// });

// app.register('baz', function(baz) {
//   console.log('GENERATOR ALIAS:', baz);
// });

// app.generate('foo');
// app.generate('bar');
// app.generate('baz');

// console.log(app)
