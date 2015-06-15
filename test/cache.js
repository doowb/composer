'use strict';

var assert = require('assert');
var should = require('should');
var application = require('..');
var app;

describe('app cache', function () {

  describe('exists():', function () {
    beforeEach(function () {
      app = new application.App();
      console.log(app)
    });
    var obj = {a: {b: {c: 1, d: '', e: null, f: undefined, 'g.h.i': 2}}};
    app.extend(obj);

    it('immediate property should exist.', function() {
      assert.equal(app.exists('a'), true);
    });
    
    // it('nested property should exist.', function() {
    //   assert.equal(app.exists('a.b'), true);
    // });
    // it('nested property should exist.', function() {
    //   assert.equal(app.exists('a.b.c'), true);
    // });
    // it('nested property should exist.', function() {
    //   assert.equal(app.exists('a.b.d'), true);
    // });
    // it('nested property should exist.', function() {
    //   assert.equal(app.exists('a.b.e'), true);
    // });
    // it('nested property should exist.', function() {
    //   assert.equal(app.exists('a.b.f'), true);
    // });
    // it('nonexistent property should not exist.', function() {
    //   assert.equal(app.exists('x'), false);
    // });
    // it('nonexistent property should not exist.', function() {
    //   assert.equal(app.exists('a.x'), false);
    // });
    // it('nonexistent property should not exist.', function() {
    //   assert.equal(app.exists('a.b.x'), false);
    // });
  });
});

//   describe('set() - add:', function () {
//     it('when an object is passed to set:', function () {
//       app.set({one: 1, two: 2});
//       app.get('one').should.eql(1);
//       app.get('two').should.eql(2);
//     });

//     it('should set a new property with the given value', function () {
//       app.set('one', 1);
//       app.get('one').should.eql(1);
//     });
//   });

//   describe('set() - update:', function () {
//     it('should update an existing property with the given value', function () {
//       app.set('one', 2);
//       app.get('one').should.eql(2);
//     });
//   });

//   describe('get():', function () {
//     var obj = {a: {b: {c: 1, d: '', e: null, f: undefined, 'g.h.i': 2}}};
//     app.set(obj);

//     it('should get immediate properties.', function() {
//       app.get('a').should.eql(obj.a);
//     });
//     it('should get nested properties.', function() {
//       app.get('a.b').should.eql(obj.a.b);
//     });
//     it('should return undefined for nonexistent properties.', function() {
//       assert.equal(typeof app.get('a.x'), 'undefined');
//     });
//     it('should return values.', function() {
//       app.get('a.b.c').should.eql(1);
//     });
//     it('should return values.', function() {
//       app.get('a.b.d').should.eql('');
//     });
//     it('should return values.', function() {
//       assert.equal(typeof app.get('a.b.e'), 'object');
//     });
//     it('should return values.', function() {
//       assert.equal(typeof app.get('a.b.f'), 'undefined');
//     });
//     it('literal backslash should escape period in property name.', function() {
//       app.get('a.b.g\\.h\\.i', true).should.equal(2);
//     });
//     it('should just return existing properties.', function() {
//       app.get('a', true).should.eql(app.cache.a);
//     });
//   });

//   describe('all:', function () {
//     it('should list the entire cache', function () {
//       app.get().should.eql(app.cache);
//     });
//   });

//   describe('set()/get():', function () {
//     it('should return immediate property value.', function() {
//       app.set('a', 1);
//       app.get('a').should.equal(1);
//     });
//     it('should set property value.', function() {
//       app.cache.a.should.equal(1);
//     });
//     it('should return nested property value.', function() {
//       app.set('b.c.d', 1);
//       app.get('b.c.d').should.equal(1);
//     });
//     it('should set property value.', function() {
//       app.cache.b.c.d.should.equal(1);
//     });
//     it('literal backslash should escape period in property name.', function() {
//       app.set('e\\.f\\.g', 1, true);
//       app.get('e\\.f\\.g', true).should.equal(1);
//       app.cache['e.f.g'].should.equal(1);
//     });
//   });
// });

// describe('cache events:', function () {
//   describe('when a listener is removed', function () {
//     it('should remove listener', function () {
//       var type = 'foo', listeners;
//       var fn = function () {};

      
//       app.on(type, fn);
//       listeners = app.listeners(type);
//       listeners.length.should.equal(1);

      
//       app.removeListener(type, fn);
//       listeners = app.listeners(type);
//       listeners.length.should.equal(0);
//     });
//   });

//   describe('when listeners are added', function () {
//     it('should add the listeners', function () {
//       var called = false;
//       app.on('foo', function () {
//         called = 'a';
//       });
//       app.emit('foo');
//       called.should.equal('a');
//       app.on('foo', function () {
//         called = 'b';
//       });
//       app.emit('foo');
//       called.should.equal('b');
//       app.on('foo', function () {
//         called = true;
//       });
//       app.emit('foo');
//       called.should.equal(true);
//       app.listeners('foo').length.should.equal(3);
//     });

//     it('should emit `set` when a value is set', function () {
//       var called = false;
//       var value = '';
//       app.on('set', function (key, val) {
//         called = key;
//         value = val;
//       });
//       app.set('foo', 'bar');
//       called.should.equal('foo');
//       value.should.equal('bar');
//     });

//     it('should emit `set` when items are set on the app.', function () {
//       var called = false;

//       app.on('set', function (key) {
//         called = true;
//         app.has(key).should.be.true;
//       });

//       app.set('one', 'a');
//       app.set('two', 'c');
//       app.set('one', 'b');
//       app.set('two', 'd');
//       called.should.be.true;
//     });
//   });
// });
