'use strict';

var path = require('path');
var assert = require('assert');
var should = require('should');
var rimraf = require('rimraf');
var app;

var application = require('..');
var actual = __dirname + '/render-actual';

describe('app render', function () {

  describe('app.render()', function () {
    beforeEach(function (done) {
      app = new application.App();
      rimraf(actual, done);
    });

    afterEach(function(done) {
      rimraf(actual, done);
    });

    it('should render a file', function (done) {
      app.option('layout', 'default');
      app.option('renameKey', function (key) {
        return path.basename(key, path.extname(key));
      });

      app.partials(['test/fixtures/includes/*.hbs']);
      app.layouts(['test/fixtures/layouts/*.hbs']);
      app.data({
        posts: [
          { author: 'Brian Woodward', 
            timestamp: '2014-11-01', 
            summary: 'This is just a summary. First', 
            content: 'Here\'s the real content. One' },
          { author: 'Brian Woodward', 
            timestamp: '2014-11-02', 
            summary: 'This is just a summary. Second', 
            content: 'Here\'s the real content. Two' },
          { author: 'Jon Schlinkert', 
            timestamp: '2014-11-03', 
            summary: 'This is just a summary. Third', 
            content: 'Here\'s the real content. Three' },
          { author: 'Jon Schlinkert', 
            timestamp: '2014-11-04', 
            summary: 'This is just a summary. Fourth', 
            content: 'Here\'s the real content. Four' },
          { author: 'Brian Woodward', 
            timestamp: '2014-11-05', 
            summary: 'This is just a summary. Fifth', 
            content: 'Here\'s the real content. Five' },
        ]
      });

      var i = 0;
      app.src('test/fixtures/pages/*.hbs')
        .pipe(app.renderFile())
        .pipe(app.dest(actual))
        .on('data', function (file) {
          i++;
          file.options.layoutApplied.should.be.true;
        })
        .on('error', done)
        .on('end', function () {
          assert.equal(i >= 3, true);
          done();
        });
    });
  });
});
