var LazyVar, Proxy, ReactiveVar, Setter, define, emptyFunction, isProto;

require("isDev");

emptyFunction = require("emptyFunction");

isProto = require("isProto");

ReactiveVar = require("./inject/ReactiveVar");

LazyVar = require("./inject/LazyVar");

Setter = require("./Setter");

define = Object.defineProperty;

Proxy = exports;

Proxy.define = function(target, key, config) {
  var error, proxy;
  proxy = Proxy.create(config, key, target);
  if (isDev) {
    try {
      define(target, key, proxy);
    } catch (error1) {
      error = error1;
      console.error(error);
    }
    return;
  }
  define(target, key, proxy);
};

Proxy.create = function(config, key, target) {
  var proxy, type;
  type = config.get ? "stateless" : config.lazy ? "lazy" : config.reactive ? "reactive" : "stateful";
  proxy = Proxy.types[type](config, key, target);
  proxy.set && (proxy.set = Setter.create(key, proxy, config));
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
  lazy: function(config, key, target) {
    var get, set, targetIsProto, value;
    targetIsProto = isProto(target);
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
        throw Error("'" + (key.toString()) + "' is not writable.");
      };
    } else {
      set = value.set;
    }
    return {
      get: get,
      set: set
    };
  },
  reactive: function(config, key, target) {
    var get, set, value;
    if (isProto(target)) {
      throw Error("Cannot define reactive Property on a prototype!");
    }
    value = ReactiveVar(config.value);
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
  stateful: function(config, key, target) {
    var value;
    value = config.value;
    if (isProto(target)) {
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
