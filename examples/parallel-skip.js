const Composer = require('..');
const app = new Composer({ skip: ['bar', 'baz'] });
let names = [];

app.task('foo', function(cb) {
  setTimeout(function() {
    names.push('foo');
    cb();
  }, 20);
});

app.task('bar', function(cb) {
  names.push('bar');
  cb();
});

app.task('baz', function(cb) {
  setTimeout(function() {
    names.push('baz');
    cb();
  }, 10);
});

app.task('names', function(cb) {
  setTimeout(function() {
    console.log(names);
    names = [];
    cb();
  }, 30);
});

app.task('one', app.parallel(['foo', 'bar', 'baz', 'names']));
app.task('two', app.parallel(['foo', 'bar', 'baz', 'names']));
app.task('default', ['one', 'two']);
app.build(err => err && console.error(err));
