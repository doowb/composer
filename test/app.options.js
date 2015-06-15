'use strict';

var should = require('should');
var application = require('..');

describe('app options', function () {
  var app = null;
  beforeEach(function() {
    app = new application.App();
  });

  describe('.option()', function () {
    describe('.set()', function () {
      it('should set options on `app.options`', function () {
        app.option('a', 'b');
        app.options.a.should.equal('b');
      });

      it('should set options objects on `app.options`', function () {
        app.option({d: 'e', f: 'g'});
        app.options.d.should.equal('e');
        app.options.f.should.equal('g');
      });
    });

    describe('.get()', function () {
      it('should get options', function () {
        app.option({d: 'e', f: 'g'});
        app.option('d').should.equal('e');
        app.option('f').should.equal('g');
      });
    });

    describe('.extend()', function () {
      it('should extend the options', function () {
        app.option({d: 'e', f: 'g'});
        app.option('d').should.equal('e');
        app.option('f').should.equal('g');
      });
    });
  });
});
