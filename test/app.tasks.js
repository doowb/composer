'use strict';

var session = require('../lib/session');
var should = require('should');
var application = require('..');
var Q = require('q');
require('mocha');

describe('app tasks', function() {
  describe('task()', function() {
    it('should define a task', function(done) {
      var fn;
      fn = function() {};
      app.task('test', fn);
      should.exist(app.tasks.test);
      app.tasks.test.fn.should.equal(fn);
      app.reset();
      done();
    });
  });

  describe('run()', function() {
    it('should run multiple tasks', function(done) {
      var a, fn, fn2;
      a = 0;
      fn = function() {
        this.should.equal(app);
        ++a;
      };
      fn2 = function() {
        this.should.equal(app);
        ++a;
      };
      app.task('test', fn);
      app.task('test2', fn2);
      app.run('test', 'test2');
      a.should.equal(2);
      app.reset();
      done();
    });
    it('should run all tasks when call run() multiple times', function(done) {
      var a, fn, fn2;
      a = 0;
      fn = function() {
        this.should.equal(app);
        ++a;
      };
      fn2 = function() {
        this.should.equal(app);
        ++a;
      };
      app.task('test', fn);
      app.task('test2', fn2);
      app.run('test');
      app.run('test2');
      a.should.equal(2);
      app.reset();
      done();
    });
    it('should run all async promise tasks', function(done) {
      var a, fn, fn2;
      a = 0;
      fn = function() {
        var deferred = Q.defer();
        setTimeout(function() {
          ++a;
          deferred.resolve();
        },1);
        return deferred.promise;
      };
      fn2 = function() {
        var deferred = Q.defer();
        setTimeout(function() {
          ++a;
          deferred.resolve();
        },1);
        return deferred.promise;
      };
      app.task('test', fn);
      app.task('test2', fn2);
      app.run('test');
      app.run('test2', function() {
        app.isRunning.should.equal(false);
        a.should.equal(2);
        app.reset();
        done();
      });
      app.isRunning.should.equal(true);
    });
    it('should run all async callback tasks', function(done) {
      var a, fn, fn2;
      a = 0;
      fn = function(cb) {
        setTimeout(function() {
          ++a;
          cb(null);
        },1);
      };
      fn2 = function(cb) {
        setTimeout(function() {
          ++a;
          cb(null);
        },1);
      };
      app.task('test', fn);
      app.task('test2', fn2);
      app.run('test');
      app.run('test2', function() {
        app.isRunning.should.equal(false);
        a.should.equal(2);
        app.reset();
        done();
      });
      app.isRunning.should.equal(true);
    });
    it('should emit task_not_found and throw an error when task is not defined', function(done) {
      app.on('task_not_found', function(err) {
        should.exist(err);
        should.exist(err.task);
        err.task.should.equal('test');
        app.reset();
        done();
      });
      try {
        app.run('test');
      } catch (err) {
        should.exist(err);
      }
    });
    it('should run task scoped to app', function(done) {
      var a, fn;
      a = 0;
      fn = function() {
        this.should.equal(app);
        ++a;
      };
      app.task('test', fn);
      app.run('test');
      a.should.equal(1);
      app.isRunning.should.equal(false);
      app.reset();
      done();
    });
    it('should run default task scoped to app', function(done) {
      var a, fn;
      a = 0;
      fn = function() {
        this.should.equal(app);
        ++a;
      };
      app.task('default', fn);
      app.run();
      a.should.equal(1);
      app.isRunning.should.equal(false);
      app.reset();
      done();
    });
    it('should set the task name on the session', function (done) {
      var a, fn, fn2;
      a = 0;
      fn = function() {
        ++a;
        this.should.equal(app);
        session.get('task').should.equal('test');
      };
      fn2 = function() {
        ++a;
        this.should.equal(app);
        session.get('task').should.equal('test2');
      };
      app.task('test', fn);
      app.task('test2', fn2);
      app.run('test', 'test2');
      a.should.equal(2);
      app.reset();
      done();
    });
  });
});
