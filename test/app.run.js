'use strict';

var should = require('should');
var application = require('..');

describe('app run', function () {
  var app = null;
  beforeEach(function() {
    app = new application.App();
  });

  describe('app.run()', function () {
    it('should run a task', function (done) {
      app.task('foo', function () {
        done();
      });
      app.run(['foo']);
    });
  });
});
