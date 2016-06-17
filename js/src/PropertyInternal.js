var LazyProperty, LazyVar, ProxyProperty, ReactiveProperty, SimpleProperty, assert, createMethods, define, emptyFunction, guard, isProto, isType;

require("isDev");

emptyFunction = require("emptyFunction");

isProto = require("isProto");

isType = require("isType");

assert = require("assert");

guard = require("guard");

ReactiveProperty = require("./ReactiveProperty");

SimpleProperty = require("./SimpleProperty");

ProxyProperty = require("./ProxyProperty");

LazyProperty = require("./LazyProperty");

LazyVar = require("./inject/LazyVar");

define = Object.defineProperty;

exports.define = function(prototype) {
  var key, ref, value;
  ref = createMethods();
  for (key in ref) {
    value = ref[key];
    define(prototype, key, {
      value: value
    });
  }
};

createMethods = function() {
  return {
    _isEnumerable: function(key) {
      if (isType(key, Symbol)) {
        return true;
      }
      if (this.enumerable !== void 0) {
        return this.enumerable;
      }
      return key[0] !== "_";
    },
    _define: function(target, key, value, enumerable) {
      var descriptor, error, get;
      if (isProto(target)) {
        if (this.get) {
          descriptor = {
            get: this.get,
            set: this.set,
            enumerable: enumerable,
            configurable: this.configurable
          };
        } else if (this.lazy) {
          descriptor = {
            get: LazyVar(this.lazy).get,
            set: function() {
              throw Error("'" + key.toString() + "' is not writable.");
            },
            enumerable: enumerable,
            configurable: this.configurable
          };
        } else {
          descriptor = {
            value: value,
            enumerable: enumerable,
            writable: this.writable,
            configurable: this.configurable
          };
        }
      } else {
        value = this.transformValue(value);
        get = this.createGetter(value);
        descriptor = {
          get: get,
          set: this.createSetter(key, value, get),
          enumerable: enumerable,
          configurable: this.configurable
        };
      }
      if (isDev) {
        try {
          define(target, key, descriptor);
        } catch (error1) {
          error = error1;
          throw error;
        }
        return;
      }
      define(target, key, descriptor);
    },
    _parseConfig: function(config) {
      var type;
      if (isDev) {
        this._parseAttributes(config);
      }
      type = this._parseType(config);
      if (this.simple && !isDev) {
        return;
      }
      this.get = config.get;
      this.set = config.set;
      this.lazy = config.lazy;
      this.transformValue = type.transformValue(config);
      this.createGetter = type.createGetter;
      return this.createSetter = this._createSetterType(type, config);
    },
    _parseAttributes: function(config) {
      this.enumerable = config.enumerable;
      if (config.frozen) {
        this.simple = false;
        this.writable = false;
        this.configurable = false;
        return;
      }
      if (config.writable === false) {
        this.simple = false;
        this.writable = false;
      }
      if (config.configurable === false) {
        this.simple = false;
        return this.configurable = false;
      }
    },
    _parseType: function(config) {
      if (config.get) {
        this.simple = false;
        if (!config.set) {
          this.writable = false;
        }
        return ProxyProperty;
      }
      assert(!config.set, {
        reason: "Cannot define 'set' without 'get'!"
      });
      if (config.lazy) {
        this.simple = false;
        return LazyProperty;
      }
      this.value = config.value;
      if (config.needsValue === true) {
        this.needsValue = true;
      }
      if (config.reactive) {
        this.simple = false;
        return ReactiveProperty;
      }
      return SimpleProperty;
    },
    _createSetterType: function(type, config) {
      if (this.writable) {
        return this._wrapSetterType(type.createSetter, config.willSet, config.didSet);
      }
      if (!isDev) {
        return function() {
          return emptyFunction;
        };
      }
      return function(key) {
        return function() {
          throw Error("'" + key.toString() + "' is not writable.");
        };
      };
    },
    _wrapSetterType: function(createSetter, willSet, didSet) {
      var wrapSetter;
      wrapSetter = emptyFunction.thatReturnsArgument;
      if (willSet) {
        if (didSet) {
          this.simple = false;
          wrapSetter = function(setter) {
            return function(newValue, oldValue) {
              newValue = willSet.call(this, newValue, oldValue);
              setter.call(this, newValue, oldValue);
              return didSet.call(this, newValue, oldValue);
            };
          };
        } else {
          this.simple = false;
          wrapSetter = function(setter) {
            return function(newValue, oldValue) {
              newValue = willSet.call(this, newValue, oldValue);
              return setter.call(this, newValue, oldValue);
            };
          };
        }
      } else if (didSet) {
        this.simple = false;
        wrapSetter = function(setter) {
          return function(newValue, oldValue) {
            setter.call(this, newValue, oldValue);
            return didSet.call(this, newValue, oldValue);
          };
        };
      }
      return function(key, value, get) {
        var getter, setter;
        setter = wrapSetter(createSetter(value));
        if (setter.length < 2) {
          return function(newValue) {
            return setter.call(this, newValue);
          };
        }
        getter = get.safely || get;
        return function(newValue) {
          return setter.call(this, newValue, getter.call(this));
        };
      };
    }
  };
};

//# sourceMappingURL=../../map/src/PropertyInternal.map
