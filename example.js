var through = require('through2');
var app = require('./');

app.engine('tmpl', require('engine-lodash'));
app.data({name: 'Composer'});

app.task('default', function () {
  app.src('*.tmpl')
    .pipe(app.dest('foo/'))
});

// app.run();

var render = app.plugin('render');
var dest = require('dest');

// create some custom template collections
var opts = { viewType: 'renderable', loaderType: 'stream' }
app.create('post', opts);
app.create('page', opts);

var extend = require('extend-shallow');

app.task('posts', function () {
  var pipe = app.posts('*.tmpl', ['toVinyl'])
    .on('error', console.error)
    .pipe(render())
    .pipe(dest('foo/'))
    .pipe(through.obj(function(file, enc, cb) {
      this.push(file);
      return cb();
    }))

    .pages('*.tmpl', ['toVinyl'])
});

app.task('copy', function () {
  app.copy('*.json', 'foo/');
});

app.task('pages', function () {
  app.pages('*.tmpl', ['toVinyl'])
    .pipe(through.obj(function(file, enc, cb) {
      this.push(file);
      return cb();
    }))
});

