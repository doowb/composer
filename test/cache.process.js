'use strict';

var should = require('should');
var application = require('..');

describe('config process', function () {
  beforeEach(function() {
    app.del();
    app.omit('abcdefghijklmnopqrstuvwxyz'.split(''));
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
        app.set({
          upper: function (str) {
            return str.toUpperCase();
          }
        });

        app.set({fez: 'bang', pop: 'boom-pow!'});
        app.set({whistle: '<%= upper(fez) %>-<%= upper(pop) %>'});
        app.get('whistle').should.equal('<%= upper(fez) %>-<%= upper(pop) %>');

        var a = app.process(app.get('whistle'), app.get());
        a.should.equal('BANG-BOOM-POW!');

        var b = app.process(app.get(), app.get());
        b.whistle.should.equal('BANG-BOOM-POW!');
      });
    });
  });
});
