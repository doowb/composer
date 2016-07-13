'use strict';

// require('time-require');

var Composer = require('..');
var runtimes = require('composer-runtimes')();
var matter = require('parser-front-matter');
var extname = require('gulp-extname');
var Templates = require('templates');
var through = require('through2');
var writeFile = require('write');
var path = require('path');

// plugins
var loader = require('assemble-loader');
var streams = require('assemble-streams');
var renderFile = require('assemble-render-file');

var composer = new Composer();
runtimes(composer);

var app = new Templates()
  .use(loader())
  .use(streams())
  .use(renderFile());

app.engine('hbs', require('engine-handlebars'));
app.option('renameKey', function(fp) {
  return path.basename(fp, path.extname(fp));
});

app.onLoad(/\.hbs$/, function(file, next) {
  matter.parse(file, next);
});

var paths = {
  pages: ['./examples/templates/pages/**/*.hbs'],
  layouts: ['./examples/templates/layouts/*.hbs'],
  includes: ['./examples/templates/includes/*.hbs']
};

app.create('pages');
app.create('layouts', {viewType: 'layout'});
app.create('includes', {viewType: 'partial'});

composer.task('layouts', function(done) {
  console.log('loading layouts');
  app.layouts(paths.layouts);
  done();
});

composer.task('includes', function(done) {
  console.log('loading includes');
  app.includes(paths.includes);
  done();
});

composer.task('pages', function(done) {
  console.log('loading pages');
  app.pages(paths.pages);
  done();
});

composer.task('site', function() {
  console.log('building site');
  return app.toStream('pages')
    .pipe(app.renderFile())
    .pipe(extname())
    .pipe(dest(__dirname + '/dist'))
});

composer.task('watch', function() {
  composer.watch(paths.layouts, ['layouts', 'pages', 'site']);
  composer.watch(paths.includes, ['includes', 'pages', 'site']);
  composer.watch(paths.pages, ['pages', 'site']);
});

composer.task('default', ['layouts', 'includes', 'pages', 'site']);
composer.task('dev', ['default', 'watch']);

composer.build('default', function(err) {
  if (err) return console.error(err);
  console.log('Finshed');
});

function dest(dir) {
  console.log('writing files to: "%s"', path.relative(process.cwd(), dir));
  return through.obj(function(file, enc, next) {
    writeFile(path.join(dir, path.basename(file.path)), file.content, next);
  });
}
