var through = require('through2');
var app = require('./');

app.engine('tmpl', require('engine-lodash'));
app.data({name: 'Composer'});

// app.task('default', function () {
//   app.src('*.tmpl')
//     .pipe(app.dest('foo/'))
// });

// app.run();

var opts = { loaderType: 'stream' };

app.loader('file', opts, through.obj(function(file, enc, cb) {
  var str = file.contents.toString();
  file.contents = new Buffer(str.toLowerCase());
  this.push(file);
  return cb();
}));

// create a app collection
app.create('doc', { viewType: 'renderable', loaderType: 'stream' });

// load apps with the collection-loader
app.docs('*.tmpl', ['toVinyl', 'file'])
  .on('error', console.error)
  .pipe(through.obj(function(file, enc, cb) {
    console.log(file)
    this.push(file);
    return cb();
  }))
  .on('error', console.error)
  .on('data', function () {
    // console.log(app.views.docs)
  });

