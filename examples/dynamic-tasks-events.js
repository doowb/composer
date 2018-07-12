const Composer = require('..');
const app = new Composer({ skip: [] });
const task = cb => cb();

app.on('build', function(build) {
  console.log('build', build.status, build.time.duration);
});

app.on('task', function(task) {
  if (task.status === 'finished' || task.status === 'starting') {
    console.log(task.status, 'task', task.name, task.time.duration);

    if (task.status === 'finished') {
      app.options.skip.push(task.name);
    }
  }
});

app.task('foo', ['qux', 'fez'], task);
app.task('bar', ['qux', 'fez'], task);
app.task('baz', ['qux', 'fez'], task);
app.task('qux', task);
app.task('fez', task);

app.task('default', ['foo', 'bar', 'baz']);
app.build('default')
  .then(() => console.log('done'))
  .catch(console.error);
