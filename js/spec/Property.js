var Property;

Property = require("../src/Property");

describe("Property", function() {
  describe("options.value", function() {
    it("defines the initial value of the property", function() {
      var obj, prop;
      prop = Property({
        value: 1
      });
      prop.define(obj = {}, "key");
      return expect(obj.key).toBe(1);
    });
    it("defaults to undefined", function() {
      var obj, prop;
      prop = Property();
      prop.define(obj = {}, "key");
      expect(obj.hasOwnProperty("key")).toBe(true);
      return expect(obj.key).toBe(void 0);
    });
    it("cannot be used with 'options.get'", function() {
      var obj, prop;
      prop = Property({
        value: 1,
        get: function() {
          return 2;
        }
      });
      prop.define(obj = {}, "key");
      return expect(obj.key).toBe(2);
    });
    return it("cannot be used with 'options.lazy'", function() {
      var obj, prop;
      prop = Property({
        value: 1,
        lazy: function() {
          return 2;
        }
      });
      prop.define(obj = {}, "key");
      return expect(obj.key).toBe(2);
    });
  });
  describe("options.needsValue", function() {
    it("skips defining a property if the value would be undefined", function() {
      var obj, prop;
      prop = Property({
        needsValue: true
      });
      prop.define(obj = {}, "key");
      return expect(Object.hasOwnProperty("key")).toBe(false);
    });
    return it("works as expected if the value is not undefined", function() {
      var obj, prop;
      prop = Property({
        needsValue: true
      });
      prop.define(obj = {}, "key", 1);
      return expect(obj.key).toBe(1);
    });
  });
  describe("options.frozen", function() {
    return it("sets 'writable' and 'configurable' to false", function() {
      var prop;
      prop = Property({
        frozen: true
      });
      expect(prop.writable).toBe(false);
      return expect(prop.configurable).toBe(false);
    });
  });
  describe("options.writable", function() {
    return it("defaults to true", function() {
      var prop;
      prop = Property();
      return expect(prop.writable).toBe(true);
    });
  });
  describe("options.configurable", function() {
    it("defaults to true", function() {
      var prop;
      prop = Property();
      return expect(prop.configurable).toBe(true);
    });
    return it("throws an error when attempting to redefine the property", function() {
      var obj, prop;
      prop = Property({
        configurable: false
      });
      prop.define(obj = {}, "key");
      return expect(function() {
        return prop.define(obj, "key");
      }).toThrowError("Cannot redefine property: key");
    });
  });
  describe("options.enumerable", function() {
    it("defaults to undefined", function() {
      var prop;
      prop = Property();
      expect(prop.hasOwnProperty("enumerable")).toBe(true);
      return expect(prop.enumerable).toBe(void 0);
    });
    return it("has its value determined by the key if equal to undefined", function() {
      var obj, prop;
      prop = Property();
      prop.define(obj = {}, "key");
      prop.define(obj, "_key");
      return expect(Object.keys(obj)).toEqual(["key"]);
    });
  });
  describe("options.get", function() {
    it("allows the use of a custom getter", function() {
      var obj, prop;
      prop = Property({
        get: function() {
          return {};
        }
      });
      prop.define(obj = {}, "key");
      expect(obj.key).not.toBe(void 0);
      return expect(obj.key).not.toBe(obj.key);
    });
    return it("can be defined on a prototype", function() {
      var MyType, prop, self;
      MyType = function() {};
      prop = Property({
        get: function() {
          return 1;
        }
      });
      prop.define(MyType.prototype, "test");
      self = new MyType;
      return expect(self.test).toBe(1);
    });
  });
  describe("options.set", function() {
    it("allows the use of a custom setter", function() {
      var obj, prop, spy;
      prop = Property({
        get: emptyFunction,
        set: spy = jasmine.createSpy()
      });
      prop.define(obj = {}, "key");
      obj.key = 1;
      return expect(spy.calls.argsFor(0)).toEqual([1]);
    });
    it("cannot be used without 'options.get'", function() {
      return expect(function() {
        return Property({
          set: emptyFunction
        });
      }).toThrowError("Cannot define 'set' without 'get'!");
    });
    return it("cannot be defined on a prototype", function() {
      var MyType, prop, self, spy;
      MyType = function() {};
      spy = jasmine.createSpy();
      prop = Property({
        get: function() {
          return 1;
        },
        set: spy
      });
      prop.define(MyType.prototype, "test");
      self = new MyType;
      expect(function() {
        return self.test = 0;
      }).not.toThrow();
      return expect(spy.calls.count()).toBe(0);
    });
  });
  describe("options.didSet", function() {
    it("allows you to react to the value after it is set", function() {
      var obj, prop;
      prop = Property({
        value: 0,
        didSet: function(newValue) {
          return expect(newValue).toBe(1);
        }
      });
      prop.define(obj = {}, "key");
      return obj.key = 1;
    });
    it("does not care if 'newValue' and 'oldValue' are equal", function() {
      var obj, prop, spy;
      spy = jasmine.createSpy();
      prop = Property({
        value: 0,
        didSet: function(newValue, oldValue) {
          return spy(newValue, oldValue);
        }
      });
      prop.define(obj = {}, "key");
      obj.key = 1;
      expect(spy.calls.argsFor(0)).toEqual([1, 0]);
      obj.key = 1;
      return expect(spy.calls.argsFor(1)).toEqual([1, 1]);
    });
    return it("does not pass the 'oldValue' if you dont use it", function() {
      var obj, prop, spy;
      spy = jasmine.createSpy();
      prop = Property({
        value: 0,
        didSet: function(newValue) {
          return spy(newValue);
        }
      });
      prop.define(obj = {}, "key");
      obj.key = 1;
      return expect(spy.calls.argsFor(0)).toEqual([1]);
    });
  });
  describe("options.willSet", function() {
    return it("allows you to change the value before it is set", function() {
      var obj, prop;
      prop = Property({
        value: 0,
        willSet: function(newValue) {
          return newValue + 1;
        }
      });
      prop.define(obj = {}, "key");
      obj.key = 1;
      return expect(obj.key).toBe(2);
    });
  });
  describe("options.lazy", function() {
    return it("creates a value that is backed by a LazyVar", function() {
      var obj, prop, spy;
      spy = jasmine.createSpy();
      prop = Property({
        lazy: function() {
          return spy() || {};
        }
      });
      prop.define(obj = {}, "key");
      expect(spy.calls.count()).toBe(0);
      expect(obj.key).toBe(obj.key);
      return expect(spy.calls.count()).toBe(1);
    });
  });
  return describe("options.reactive", function() {
    var Tracker;
    Tracker = require("tracker");
    it("creates a value that is backed by a ReactiveVar", function() {
      var computation, obj, prop, spy;
      prop = Property({
        value: 1,
        reactive: true
      });
      prop.define(obj = {}, "key");
      spy = jasmine.createSpy();
      computation = Tracker.autorun((function(_this) {
        return function() {
          return spy(obj.key);
        };
      })(this));
      computation._sync = true;
      expect(spy.calls.argsFor(0)).toEqual([1]);
      obj.key = 2;
      return expect(spy.calls.argsFor(1)).toEqual([2]);
    });
    return it("cannot be used with prototypes", function() {
      var MyType, computation, obj, prop, spy;
      prop = Property({
        value: 1,
        reactive: true
      });
      MyType = function() {};
      prop.define(MyType.prototype, "key");
      obj = new MyType;
      spy = jasmine.createSpy();
      computation = Tracker.autorun((function(_this) {
        return function() {
          return spy(obj.key);
        };
      })(this));
      computation._sync = true;
      expect(spy.calls.argsFor(0)).toEqual([1]);
      obj.key = 2;
      return expect(spy.calls.argsFor(1)).toEqual([]);
    });
  });
});

//# sourceMappingURL=../../map/spec/Property.map
