var Any, Kind, NamedFunction, Property, Proxy, PureObject, Void, assert, assertType, assertTypes, configTypes, define, isProto, isType, mergeDefaults, prototype;

require("isDev");

NamedFunction = require("NamedFunction");

mergeDefaults = require("mergeDefaults");

assertTypes = require("assertTypes");

assertType = require("assertType");

PureObject = require("PureObject");

isProto = require("isProto");

isType = require("isType");

assert = require("assert");

Void = require("Void");

Kind = require("Kind");

Any = require("Any");

Proxy = require("./Proxy");

define = Object.defineProperty;

isDev && (configTypes = {
  value: Any,
  needsValue: [Boolean, Void],
  frozen: [Boolean, Void],
  writable: [Boolean, Void],
  configurable: [Boolean, Void],
  enumerable: [Boolean, Void],
  get: [Function, Void],
  set: [Function, Void],
  didSet: [Function, Void],
  willSet: [Function, Void],
  lazy: [Function, Void],
  reactive: [Boolean, Void]
});

Property = NamedFunction("Property", function(config) {
  var self;
  if (config == null) {
    config = {};
  }
  isDev && assertTypes(config, configTypes);
  self = Object.create(Property.prototype);
  define(self, "_defaults", {
    value: self._parseDefaults(config)
  });
  return self;
});

Property.targetType = [Kind(Object), PureObject];

Property.keyType = global.Symbol ? [String, Symbol] : String;

prototype = {
  define: function(target, key, config) {
    if (config == null) {
      config = {};
    }
    assertType(target, Property.targetType);
    assertType(key, Property.keyType);
    assertType(config, Object);
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
  },
  _isEnumerable: function(key) {
    if (isType(key, Symbol)) {
      return true;
    }
    if (this._enumerable === false) {
      return false;
    }
    return key[0] !== "_";
  },
  _needsProxy: function(config) {
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
  },
  _parseDefaults: function(config) {
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
    } else {
      assert(!config.set, "Cannot define 'set' without 'get'!");
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
  }
};

Object.keys(prototype).forEach(function(key) {
  return define(Property.prototype, key, {
    value: prototype[key]
  });
});

Property.mutable = Property();

Property.frozen = Property({
  frozen: true
});

Property.hidden = Property({
  enumerable: false
});

module.exports = Property;

//# sourceMappingURL=map/Property.map
