const names = [];
const Composer = require('..');
const app = new Composer({skip: names});

const task = function(cb) {
  console.log('running', this.name);
  names.push(this.name);
  cb();
};

app.task('foo', ['qux', 'fez'], task);
app.task('bar', ['qux', 'fez'], task);
app.task('baz', ['qux', 'fez'], task);
app.task('qux', task);
app.task('fez', task);

app.task('default', ['foo', 'bar', 'baz']);
app.build('default')
  .then(() => console.log('done'))
  .catch(console.error);
