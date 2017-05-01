// Generated by CoffeeScript 1.12.4
var NamedFunction, Property, Proxy, emptyFunction, isDev, isHiddenProperty, mergeDefaults, validateConfig;

NamedFunction = require("NamedFunction");

emptyFunction = require("emptyFunction");

mergeDefaults = require("mergeDefaults");

isDev = require("isDev");

Proxy = require("./Proxy");

Property = NamedFunction("Property", function(config) {
  var self;
  if (config == null) {
    config = {};
  }
  isDev && validateConfig(config);
  self = Object.create(Property.prototype);
  self.defaults = self._parseDefaults(config);
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
    config.value = this.value;
  }
  if (config.value === void 0) {
    if (config.needsValue || this.needsValue) {
      return;
    }
  }
  if (config.enumerable === void 0) {
    config.enumerable = !isHiddenProperty(this, key);
  }
  mergeDefaults(config, this.defaults);
  Proxy.define(target, key, config);
};

Property.prototype._parseDefaults = function(config) {
  var defaults;
  defaults = {};
  if (isDev) {
    if (config.enumerable === false) {
      this.hidden = true;
    }
    defaults.writable = !(config.frozen || config.writable === false);
    defaults.configurable = !(config.frozen || config.configurable === false);
  } else {
    defaults.writable = config.writable !== false;
    defaults.configurable = config.configurable !== false;
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
  } else if (config.lazy) {
    defaults.lazy = config.lazy;
  } else {
    this.value = config.value;
    if (config.needsValue) {
      this.needsValue = true;
    }
    if (config.reactive) {
      defaults.reactive = true;
    }
  }
  return defaults;
};

isHiddenProperty = isDev ? function(prop, key) {
  return prop.hidden || key.startsWith("_");
} : emptyFunction.thatReturnsFalse;

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
