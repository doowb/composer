'use strict';

// require('time-require');

var matter = require('parser-front-matter');
var extname = require('gulp-extname');
var Template = require('template');
var through = require('through2');
var path = require('path');

var composer = require('../');
require('composer-runtimes')(composer);

var template = new Template();

template.engine('hbs', require('engine-handlebars'));
template.option('renameKey', function (fp) {
  return path.basename(fp, path.extname(fp));
});

template.onLoad(/\.hbs$/, function (file, next) {
  matter.parse(file, next);
});

var paths = {
  pages: ['./templates/pages/**/*.hbs'],
  layouts: ['./templates/layouts/*.hbs'],
  includes: ['./templates/includes/*.hbs']
};

template.create('pages');
template.create('layouts', {viewType: 'layout'});
template.create('includes', {viewType: 'partial'});

composer.task('layouts', function (done) {
  template.layouts(paths.layouts);
  done();
});

composer.task('includes', function (done) {
  template.includes(paths.includes);
  done();
});

composer.task('pages', function (done) {
  template.pages(paths.pages);
  done();
});

composer.task('site', function () {
  return loadCollection('pages')
    .pipe(render())
    .pipe(extname())
    .pipe(dest('dist'));
});

composer.task('watch', function () {
  composer.watch(paths.layouts, ['layouts', 'pages', 'site']);
  composer.watch(paths.includes, ['includes', 'pages', 'site']);
  composer.watch(paths.pages, ['pages', 'site']);
});

composer.task('default', ['layouts', 'includes', 'pages', 'site']);
composer.task('dev', ['default', 'watch']);

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
