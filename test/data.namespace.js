'use strict';

var should = require('should');
var application = require('..');


describe('app data', function () {
  var app = null;
  describe('.namespace()', function() {
    beforeEach(function () {
      app = new application.Composer();
    });

    it('should namespace data using the `:basename` of the file.', function() {
      app.data('test/fixtures/data/alert.json');
      app.get('data').should.have.property('alert');
    });

    it('should namespace the data using the `:basename` of each file in a glob.', function() {
      app.data('test/fixtures/data/*.json');
      app.get('data').should.have.property('alert');
      app.get('data').should.have.property('test');


      app.get('data').should.not.have.property('data');
    });

    it('should namespace the data using the `:basename` of each file in an array of globs.', function() {
      app.data(['test/fixtures/data/*.json']);
      app.get('data').should.have.property('alert');
      app.get('data').should.have.property('test');


      app.get('data').should.not.have.property('data');
    });

    it('should namespace the data using the `:propstring`.', function() {
      app.data('test/fixtures/data/data.json');
      app.get('data').should.have.property('root');
      app.get('data').should.not.have.property('data');
    });

    it('should namespace the data using the `:propstring`.', function() {
      app.data('test/fixtures/data/data.json', { namespace: function () { return 'bar'; } });
      app.get('data').should.have.property('bar');
    });

    it('should namespace the data using the specified value.', function() {
      app.data('test/fixtures/data/data.json', { namespace: function () { return 'app'; } });
      app.get('data').should.have.property('app');
    });
  });
});
