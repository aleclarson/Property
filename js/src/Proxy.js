var LazyVar, Proxy, ReactiveVar, Setter, assert, define, emptyFunction, isProto;

require("isDev");

emptyFunction = require("emptyFunction");

isProto = require("isProto");

assert = require("assert");

ReactiveVar = require("./inject/ReactiveVar");

LazyVar = require("./inject/LazyVar");

Setter = require("./Setter");

define = Object.defineProperty;

Proxy = exports;

Proxy.define = function(config) {
  var error;
  if (isDev) {
    try {
      define(config.target, config.key, Proxy.create(config));
    } catch (error1) {
      error = error1;
      console.error(error);
    }
    return;
  }
  define(config.target, config.key, Proxy.create(config));
};

Proxy.create = function(config) {
  var proxy, type;
  type = config.get ? "stateless" : config.lazy ? "lazy" : config.reactive ? "reactive" : "stateful";
  proxy = Proxy.types[type](config);
  proxy.set && (proxy.set = Setter.create(config, proxy));
  proxy.enumerable = config.enumerable;
  proxy.configurable = config.configurable;
  return proxy;
};

Proxy.types = {
  stateless: function(config) {
    return {
      get: config.get || this.get,
      set: config.set || this.set || emptyFunction
    };
  },
  lazy: function(config) {
    var get, set, targetIsProto, value;
    targetIsProto = isProto(config.target);
    if (config.reactive && targetIsProto) {
      throw Error("Cannot define a reactive Property on a prototype!");
    }
    value = LazyVar({
      createValue: config.lazy,
      reactive: config.reactive
    });
    get = value.get;
    get.safely = function() {
      return value._value;
    };
    if (targetIsProto) {
      set = function() {
        throw Error("'" + (config.key.toString()) + "' is not writable.");
      };
    } else {
      set = value.set;
    }
    return {
      get: get,
      set: set
    };
  },
  reactive: function(config) {
    var get, ref, set, value;
    assert(!isProto(config.target), "Cannot define reactive Property on a prototype!");
    value = ReactiveVar((ref = config.value) != null ? ref : defaults.value);
    get = function() {
      return value.get();
    };
    get.safely = function() {
      return value._value;
    };
    set = function(newValue) {
      return value.set(newValue);
    };
    return {
      get: get,
      set: set
    };
  },
  stateful: function(config) {
    var value;
    value = config.value;
    if (isProto(config.target)) {
      return {
        value: value,
        writable: config.writable
      };
    } else {
      return {
        get: function() {
          return value;
        },
        set: function(newValue) {
          return value = newValue;
        }
      };
    }
  }
};

//# sourceMappingURL=map/Proxy.map
