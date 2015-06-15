'use strict';

var assert = require('assert');
var should = require('should');
var through = require('through2');
var isStream = require('is-stream');
var File = require('vinyl');
var application = require('..');
var app;

describe('.renderFile', function () {
  beforeEach(function() {
    app = new application.App();
  });

  it('should return a stream:', function () {
    assert.equal(isStream(app.renderFile()), true);
  });

  it('should render a vinyl file:', function (done) {
    var stream = through.obj();
    var buffer = [];

    stream.write(new File({
      base: __dirname,
      path: __dirname + '/fixtures/templates/partials/a.hbs',
      contents: new Buffer('abc')
    }));

    stream
      .pipe(app.renderFile())
      .on('data', function (file) {
        buffer.push(file);
      })

    stream.on('end', function () {
      assert.equal(buffer[0].contents.toString(), 'abc');
      done();
    });
    stream.end();
  });

  it('should render templates in a vinyl file:', function (done) {
    var i = -1;
    app.src('test/fixtures/templates/*.hbs')
      .pipe(app.renderFile())
      .on('data', function (file) {
        i++;
        if (i === 0) file.contents.toString().should.equal('Page: AAA');
        if (i === 1) file.contents.toString().should.equal('Page: BBB');
        if (i === 2) file.contents.toString().should.equal('Page: CCC');
      })
      .on('end', function () {
        done();
      });
  });
});
