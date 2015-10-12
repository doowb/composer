'use strict';

// require('time-require');

var matter = require('parser-front-matter');
var extname = require('gulp-extname');
var Templates = require('templates');
var through = require('through2');
var path = require('path');

// plugins
var loader = require('assemble-loader');
var streams = require('assemble-streams');
var renderFile = require('assemble-render-file');

var app = require('./app');
require('composer-runtimes')()(app);

var templates = new Templates();
templates.use(loader());
templates.use(streams);
templates.use(renderFile());

templates.engine('hbs', require('engine-handlebars'));
templates.option('renameKey', function (fp) {
  return path.basename(fp, path.extname(fp));
});

templates.onLoad(/\.hbs$/, function (file, next) {
  matter.parse(file, next);
});

var paths = {
  pages: ['./templates/pages/**/*.hbs'],
  layouts: ['./templates/layouts/*.hbs'],
  includes: ['./templates/includes/*.hbs']
};

templates.create('pages');
templates.create('layouts', {viewType: 'layout'});
templates.create('includes', {viewType: 'partial'});

app.task('layouts', function (done) {
  templates.layouts.load(paths.layouts);
  done();
});

app.task('includes', function (done) {
  templates.includes.load(paths.includes);
  done();
});

app.task('pages', function (done) {
  templates.pages.load(paths.pages);
  done();
});

app.task('site', function () {
  return templates.pages.toStream()
    .pipe(templates.renderFile())
    .pipe(extname)
    .pipe(dest('dist'));
});

app.task('watch', function () {
  app.watch(paths.layouts, ['layouts', 'pages', 'site']);
  app.watch(paths.includes, ['includes', 'pages', 'site']);
  app.watch(paths.pages, ['pages', 'site']);
});

app.task('default', ['layouts', 'includes', 'pages', 'site']);
app.task('dev', ['default', 'watch']);

app.build('default', function (err, results) {
  if (err) return console.error(err);
  console.log('Finshed');
});

function dest (dir) {
  return through.obj(function (file, enc, next) {
    file.write(path.join(dir, path.basename(file.path)), next);
  });
}
