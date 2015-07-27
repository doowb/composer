var extend = require('extend-shallow');
var through = require('through2');
var dest = require('dest');
var app = require('./');


app.engine('tmpl', require('engine-lodash'));
app.data({name: 'Composer'});

app.task('default', function () {
  app.src('test/fixtures/*.tmpl')
    .pipe(app.dest('test/actual/'))
});

// app.run();

// create some custom template collections
var opts = { viewType: 'renderable', loaderType: 'stream' }
app.create('post', opts);
app.create('page', opts);

var render = app.plugin('render');

// app.posts('test/fixtures/*.tmpl', ['toVinyl'])
//   .on('error', console.error)
//   .pipe(render())
//   .pipe(dest('test/actual/'))


app.task('posts', function () {
  app.posts('test/fixtures/*.tmpl', ['toVinyl'])
    .on('error', console.error)
    .pipe(render())
    .pipe(dest('test/actual/'))
});

app.task('copy', function () {
  app.copy('*.json', 'test/actual/');
});

app.task('pages', function () {
  app.pages('test/fixtures/*.tmpl', ['toVinyl'])
    .pipe(through.obj(function(file, enc, cb) {
      this.push(file);
      return cb();
    }))
});

