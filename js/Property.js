var NamedFunction, Property, Proxy, define, mergeDefaults, validateConfig;

require("isDev");

NamedFunction = require("NamedFunction");

mergeDefaults = require("mergeDefaults");

Proxy = require("./Proxy");

define = Object.defineProperty;

Property = NamedFunction("Property", function(config) {
  var self;
  if (config == null) {
    config = {};
  }
  isDev && validateConfig(config);
  self = Object.create(Property.prototype);
  define(self, "_defaults", {
    value: self._parseDefaults(config)
  });
  return self;
});

module.exports = Property;

Property.prototype.define = function(target, key, config) {
  if (config == null) {
    config = {};
  }
  if (isDev && typeof key !== "string") {
    throw TypeError("'key' must be a String!");
  }
  if (config.value === void 0) {
    config.value = this._value;
  }
  if (config.needsValue != null ? config.needsValue : config.needsValue = this._needsValue) {
    if (config.value === void 0) {
      return;
    }
  }
  if (config.enumerable == null) {
    config.enumerable = isDev ? this._isEnumerable(key) : true;
  }
  mergeDefaults(config, this._defaults);
  if (this._needsProxy(config)) {
    Proxy.define(target, key, config);
  } else {
    target[key] = config.value;
  }
};

Property.prototype._isEnumerable = function(key) {
  if (typeof key === "symbol") {
    return true;
  }
  if (this._enumerable === false) {
    return false;
  }
  return key[0] !== "_";
};

Property.prototype._needsProxy = function(config) {
  if (!(config.enumerable && config.writable && config.configurable)) {
    return true;
  }
  if (config.get || config.lazy || config.reactive) {
    return true;
  }
  if (config.didSet || config.willSet) {
    return true;
  }
  return false;
};

Property.prototype._parseDefaults = function(config) {
  var defaults;
  defaults = {};
  if (isDev && (config.enumerable === false)) {
    define(this, "_enumerable", {
      value: false
    });
  }
  if (config.frozen) {
    defaults.writable = !isDev;
    defaults.configurable = !isDev;
  } else {
    defaults.writable = (!isDev) || (config.writable !== false);
    defaults.configurable = (!isDev) || (config.configurable !== false);
  }
  if (config.willSet) {
    defaults.willSet = config.willSet;
  }
  if (config.didSet) {
    defaults.didSet = config.didSet;
  }
  if (config.get) {
    defaults.get = config.get;
    if (config.set) {
      defaults.set = config.set;
    } else {
      defaults.writable = false;
    }
  } else if (config.set) {
    throw Error("Cannot define 'set' without 'get'!");
  } else {
    defaults.reactive = config.reactive === true;
    if (config.lazy) {
      defaults.lazy = config.lazy;
    } else {
      define(this, "_value", {
        value: config.value
      });
      define(this, "_needsValue", {
        value: config.needsValue === true
      });
    }
  }
  return defaults;
};

isDev && (validateConfig = (function() {
  var isType, types, wrongType;
  types = {
    needsValue: Boolean,
    frozen: Boolean,
    writable: Boolean,
    configurable: Boolean,
    enumerable: Boolean,
    get: Function,
    set: Function,
    didSet: Function,
    willSet: Function,
    lazy: Function,
    reactive: Boolean
  };
  wrongType = require("wrongType");
  isType = require("isType");
  return function(config) {
    var key, type, value;
    for (key in types) {
      type = types[key];
      value = config[key];
      if (value === void 0) {
        continue;
      }
      if (isType(value, type)) {
        continue;
      }
      throw wrongType(type, key);
    }
  };
})());

//# sourceMappingURL=map/Property.map
