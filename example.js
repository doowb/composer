var extend = require('extend-shallow');
var through = require('through2');
var render = app.plugin('render');
var dest = require('dest');
var app = require('./');


app.engine('tmpl', require('engine-lodash'));
app.data({name: 'Composer'});

app.task('default', function () {
  app.src('*.tmpl')
    .pipe(app.dest('foo/'))
});

// app.run();

// create some custom template collections
var opts = { viewType: 'renderable', loaderType: 'stream' }
app.create('post', opts);
app.create('page', opts);


// app.posts('test/fixtures/*.tmpl', ['toVinyl'])
//   .on('error', console.error)
//   .pipe(render())
//   .pipe(dest('foo/'))


app.task('posts', function () {
  app.posts('test/fixtures/*.tmpl', ['toVinyl'])
    .on('error', console.error)
    .pipe(render())
    .pipe(dest('foo/'))
});

app.task('copy', function () {
  app.copy('*.json', 'foo/');
});

app.task('pages', function () {
  app.pages('test/fixtures/*.tmpl', ['toVinyl'])
    .pipe(through.obj(function(file, enc, cb) {
      this.push(file);
      return cb();
    }))
});

