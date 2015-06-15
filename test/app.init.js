'use strict';

var should = require('should');
var application = require('..');

describe('app init', function () {
  var app = null;
  beforeEach(function() {
    app = new application.App();
  });

  describe('.init()', function () {
    it('should re-initialize all values', function () {
      app.views.pages.should.be.empty;
      app.views.partials.should.be.empty;
      app.views.layouts.should.be.empty;
    });

    it('should prepopulate default engines.', function () {
      app.engines.should.have.property('.hbs');
    });
  });
});
