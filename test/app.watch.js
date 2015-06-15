'use strict';

var application = require('..');
var fs = require('graceful-fs');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');
var path = require('path');

var should = require('should');
require('mocha');

var outpath = path.join(__dirname, './out-fixtures');

describe('app', function () {
  describe('watch()', function () {
    beforeEach(rimraf.bind(null, outpath));
    beforeEach(mkdirp.bind(null, outpath));
    afterEach(rimraf.bind(null, outpath));

    var tempFileContent = 'A test generated this file and it is safe to delete';

    var writeTimeout = 125; 
    var writeFileWait = function (name, content, cb) {
      if (!cb) {
        cb = function () {};
      }
      setTimeout(function () {
        fs.writeFile(name, content, cb);
      }, writeTimeout);
    };

    it.skip('should call the function when file changes: no options', function (done) {

      
      var tempFile = path.join(outpath, 'watch-func.txt');
      fs.writeFile(tempFile, tempFileContent, function () {

        
        var watcher = app.watch(tempFile, function (evt) {
          should.exist(evt);
          should.exist(evt.path);
          should.exist(evt.type);
          evt.type.should.equal('changed');
          evt.path.should.equal(path.resolve(tempFile));
          watcher.end();
          done();
        });

        
        writeFileWait(tempFile, tempFileContent + ' changed');
      });
    });

    it.skip('should call the function when file changes: w/ options', function (done) {
      
      var tempFile = path.join(outpath, 'watch-func-options.txt');
      fs.writeFile(tempFile, tempFileContent, function () {

        
        var watcher = app.watch(tempFile, {
          debounceDelay: 5
        }, function (evt) {
          should.exist(evt);
          should.exist(evt.path);
          should.exist(evt.type);
          evt.type.should.equal('changed');
          evt.path.should.equal(path.resolve(tempFile));
          watcher.end();
          done();
        });

        
        writeFileWait(tempFile, tempFileContent + ' changed');
      });
    });

    it.skip('should not drop options when no callback specified', function (done) {
      
      var tempFile = path.join(outpath, 'watch-func-nodrop-options.txt');
      
      var relFile = '../watch-func-nodrop-options.txt';
      var cwd = outpath + '/subdir';
      fs.writeFile(tempFile, tempFileContent, function () {

        
        var watcher = app.watch(relFile, {
            debounceDelay: 5,
            cwd: cwd
          })
          .on('change', function (evt) {
            should.exist(evt);
            should.exist(evt.path);
            should.exist(evt.type);
            evt.type.should.equal('changed');
            evt.path.should.equal(path.resolve(tempFile));
            watcher.end();
            done();
          });

        
        writeFileWait(tempFile, tempFileContent + ' changed');
      });
    });

    it.skip('should run many tasks: w/ options', function (done) {
      
      var tempFile = path.join(outpath, 'watch-task-options.txt');
      var task1 = 'task1';
      var task2 = 'task2';
      var task3 = 'task3';
      var a = 0;
      var timeout = writeTimeout * 2.5;

      fs.writeFile(tempFile, tempFileContent, function () {

        app.task(task1, function () {
          a++;
        });
        app.task(task2, function () {
          a += 10;
        });
        app.task(task3, function () {
          throw new Error('task3 called!');
        });

        
        setTimeout(function () {
          a.should.equal(11); 

          app.reset();
          watcher.end();
          done();
        }, timeout);

        
        var watcher = app.watch(tempFile, {
          debounceDelay: timeout / 2
        }, [task1, task2]);

        
        writeFileWait(tempFile, tempFileContent + ' changed');
      });
    });

    it.skip('should run many tasks: no options', function (done) {
      
      var tempFile = path.join(outpath, 'watch-many-tasks-no-options.txt');
      var task1 = 'task1';
      var task2 = 'task2';
      var task3 = 'task3';
      var a = 0;
      var timeout = writeTimeout * 2.5;

      fs.writeFile(tempFile, tempFileContent, function () {

        app.task(task1, function () {
          a++;
        });
        app.task(task2, function () {
          a += 10;
        });
        app.task(task3, function () {
          throw new Error('task3 called!');
        });

        
        setTimeout(function () {
          a.should.equal(11); 

          app.reset();
          watcher.end();
          done();
        }, timeout);

        
        var watcher = app.watch(tempFile, [task1, task2]);

        
        writeFileWait(tempFile, tempFileContent + ' changed');
      });
    });

  });
});
