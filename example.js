'use strict';

// require('time-require');

var matter = require('parser-front-matter');
var extname = require('gulp-extname');
var through = require('through2');
var path = require('path');

var composer = require('./');
var Template = require('template');
var template = new Template();

template.engine('hbs', require('engine-handlebars'));
template.option('renameKey', function (fp) {
  return path.basename(fp, path.extname(fp));
});

template.onLoad(/\.hbs$/, function (file, next) {
  matter.parse(file, next);
});

var paths = {
  pages: ['examples/templates/pages/**/*.hbs'],
  layouts: ['examples/templates/layouts/*.hbs'],
  includes: ['examples/templates/includes/*.hbs']
};

template.create('pages');
template.create('layouts', {viewType: 'layout'});
template.create('includes', {viewType: 'partial'});

composer.register('layouts', function (done) {
  template.layouts(paths.layouts);
  done();
});

composer.register('includes', function (done) {
  template.includes(paths.includes);
  done();
});

composer.register('pages', function (done) {
  template.pages(paths.pages);
  done();
});

composer.register('site', function () {
  return loadCollection('pages')
    .pipe(render())
    .pipe(extname())
    .pipe(dest('examples/dist'));
});

composer.register('watch', function () {
  composer.watch(paths.layouts, ['layouts', 'pages', 'site']);
  composer.watch(paths.includes, ['includes', 'pages', 'site']);
  composer.watch(paths.pages, ['pages', 'site']);
});

composer.register('default', ['layouts', 'includes', 'pages', 'site']);
composer.register('dev', ['default', 'watch']);

composer.run('default', function (err, results) {
  if (err) return console.error(err);
  console.log('Finshed');
});


function loadCollection (collection) {
  var stream = through.obj();
  function write () {
    template[collection].forOwn(function (view) {
      stream.write(view);
    });
    stream.end();
  }
  process.nextTick(write);
  return stream;
}

function render (locals) {
  locals = locals || {};
  return through.obj(function (file, enc, next) {
    file.render(locals, next);
  });
}

function dest (dir) {
  return through.obj(function (file, enc, next) {
    file.write(path.join(dir, path.basename(file.path)), next);
  });
}
