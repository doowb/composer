'use strict';

var should = require('should');
var application = require('..');

describe('app process', function () {
  var app = null;
  beforeEach(function() {
    app = new application.App();
  });

  describe('.process()', function () {
    it('should resolve template strings in config values', function () {
      var store = app.process({a: '<%= b %>', b: 'c'});
      store.a.should.equal('c');
    });

    it('should resolve es6 template strings in config values', function () {
      var store = app.process({a: '${b}', b: 'c'});
      store.a.should.equal('c');
    });

    it('should recursively resolve template strings.', function () {
      var store = app.process({
        a: '${b}',
        b: '${c}',
        c: '${d}',
        d: '${e.f.g}',
        e: {f:{g:'h'}}});
      store.a.should.equal('h');
    });

    describe('when functions are defined on the config', function() {
      it('should used them on config templates', function() {
        app.data({
          upper: function (str) {
            return str.toUpperCase();
          }
        });

        app.data({fez: 'bang', pop: 'boom-pow!'});
        app.data({whistle: '<%= upper(fez) %>-<%= upper(pop) %>'});
        app.get('data.whistle').should.equal('<%= upper(fez) %>-<%= upper(pop) %>');

        var a = app.process(app.get('data.whistle'), app.get('data'));
        a.should.equal('BANG-BOOM-POW!');

        var b = app.process(app.get('data'), app.get('data'));
        b.whistle.should.equal('BANG-BOOM-POW!');
      });
    });
  });
});
