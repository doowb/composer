'use strict';

var should = require('should');
var application = require('..');
var app;

describe('app.template', function () {
  describe('.init()', function () {
    beforeEach(function () {
      app = new application.App();
    });

    it('should create new template type methods on Assemble.prototype.', function () {
      app.create('monkey', 'monkeys');
      should.exist(app.monkey);
      should.exist(app.monkeys);
      should.exist(app.views.monkeys);
    });

    it('should create new template type methods on Assemble.prototype for layout types.', function () {
      app.create('lion', {isLayout: true});
      should.exist(app.lion);
      should.exist(app.lions);
      should.exist(app.views.lions);
    });

    it('should load new templates add store them on the cache for the custom template type.', function () {
      app.create('doowb', 'doowbs');
      app.doowb({path: 'brian', data: {first: 'Brian'}, content: '---\nlast: Woodward\n---\nHi this is {{first}} {{last}}'});

      should.exist(app.views.doowbs.brian);
      app.views.doowbs.brian.content.should.equal('Hi this is {{first}} {{last}}');
      app.views.doowbs.brian.orig.should.equal('---\nlast: Woodward\n---\nHi this is {{first}} {{last}}');
      should.exist(app.views.doowbs.brian.data.first);
      should.exist(app.views.doowbs.brian.data.last);
    });

    it('should load new templates add store them on the cache for the custom template type as layouts.', function () {
      app.create('jon', {isLayout: true, ext: '.hbs'});
      app.jon({path: 'jon', data: {first: 'Jon'}, options: {ext: '.hbs'}, content: '---\nlast: Schlinkert\n---\nHi this is {{first}} {{last}}'});

      should.exist(app.views.jons.jon);
      app.views.jons.jon.content.should.equal('Hi this is {{first}} {{last}}');
      app.views.jons.jon.orig.should.equal('---\nlast: Schlinkert\n---\nHi this is {{first}} {{last}}');
      should.exist(app.views.jons.jon.data.first);
      should.exist(app.views.jons.jon.data.last);
    });
  });
});
