'use strict';

var should = require('should');
var application = require('..');
var consolidate = require('consolidate');
var app;

describe('.engine()', function () {
  beforeEach(function () {
    app = new application.App();
  });

  it('should register an engine to the given extension', function () {
    app.engine('hbs', consolidate.handlebars);
    app.engines['.hbs'].should.exist;
    should.exist(app.engines['.hbs'].renderSync);
    should.exist(app.engines['.hbs'].render);
  });
});