var Any, LazyProperty, LazyVar, NamedFunction, Property, ProxyProperty, ReactiveProperty, ReactiveVar, SimpleProperty, Void, assert, configTypes, define, emptyFunction, internalPrototype, isProto, key, prototype, ref, setType, validateTypes, value;

require("isDev");

ref = require("type-utils"), Any = ref.Any, Void = ref.Void, setType = ref.setType, assert = ref.assert, validateTypes = ref.validateTypes;

NamedFunction = require("NamedFunction");

emptyFunction = require("emptyFunction");

ReactiveVar = require("reactive-var");

LazyVar = require("lazy-var");

isProto = require("isProto");

ReactiveProperty = require("./ReactiveProperty");

SimpleProperty = require("./SimpleProperty");

ProxyProperty = require("./ProxyProperty");

LazyProperty = require("./LazyProperty");

define = Object.defineProperty;

configTypes = {
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
};

module.exports = Property = NamedFunction("Property", function(config) {
  var self;
  if (!config) {
    config = {};
  }
  validateTypes(config, configTypes);
  if (config.needsValue && (config.value === void 0)) {
    return null;
  }
  self = {
    simple: true,
    writable: true,
    configurable: true
  };
  setType(self, Property);
  self._parseConfig(config);
  return self;
});

prototype = {
  define: function(target, key) {
    var enumerable, get, set, simple, value;
    simple = this.simple, enumerable = this.enumerable;
    if (isDev) {
      if (enumerable === void 0) {
        enumerable = key[0] !== "_";
      }
      if (!enumerable) {
        simple = false;
      }
    } else {
      enumerable = true;
    }
    if (simple) {
      target[key] = this.value;
      return;
    }
    if (isProto(target)) {
      define(target, key, {
        value: this.value,
        enumerable: enumerable,
        writable: this.writable,
        configurable: this.configurable
      });
      return;
    }
    value = this.allocate();
    get = this.type.createGetter(value);
    if (this.writable) {
      set = this.type.createSetter(value);
      set = this._wrapSetter(get, set, this.willSet, this.didSet);
    } else {
      set = this._createEmptySetter(key);
    }
    define(target, key, {
      get: get,
      set: set,
      enumerable: enumerable,
      configurable: this.configurable
    });
  }
};

internalPrototype = {
  _parseConfig: function(config) {
    if (isDev) {
      this._parseAttributes(config);
    }
    this.type = this._parseType(config);
    this.allocate = this.type.createAllocator(config);
  },
  _parseAttributes: function(config) {
    if (isDev) {
      this.enumerable = config.enumerable;
    }
    if (config.frozen) {
      this.simple = false;
      this.writable = false;
      return this.configurable = false;
    } else {
      if (config.writable === false) {
        this.simple = false;
        this.writable = false;
      }
      if (config.configurable === false) {
        this.simple = false;
        return this.configurable = false;
      }
    }
  },
  _parseType: function(config) {
    if (this.writable) {
      if (config.willSet) {
        this.simple = false;
        this.willSet = config.willSet;
      }
      if (config.didSet) {
        this.simple = false;
        this.didSet = config.didSet;
      }
    }
    if (config.get) {
      this.simple = false;
      return ProxyProperty;
    }
    assert(!config.set, {
      reason: "Cannot define 'set' without 'get'!"
    });
    if (config.lazy) {
      this.simple = false;
      return LazyProperty;
    }
    if (config.reactive) {
      this.simple = false;
      return ReactiveProperty;
    }
    this.value = config.value;
    return SimpleProperty;
  },
  _wrapSetter: function(get, set, willSet, didSet) {
    var getter, needsGetter, setter;
    setter = set;
    needsGetter = set.length > 1;
    if (willSet) {
      if (!needsGetter) {
        needsGetter = willSet.length > 1;
      }
      if (didSet) {
        if (!needsGetter) {
          needsGetter = didSet.length > 1;
        }
        if (needsGetter) {
          setter = function(newValue, oldValue) {
            newValue = willSet.call(this, newValue, oldValue);
            set.call(this, newValue, oldValue);
            return didSet.call(this, newValue, oldValue);
          };
        } else {
          setter = function(newValue) {
            newValue = willSet.call(this, newValue);
            set.call(this, newValue);
            return didSet.call(this, newValue);
          };
        }
      } else if (needsGetter) {
        setter = function(newValue, oldValue) {
          newValue = willSet.call(this, newValue, oldValue);
          return set.call(this, newValue, oldValue);
        };
      } else {
        setter = function(newValue) {
          newValue = willSet.call(this, newValue);
          return set.call(this, newValue);
        };
      }
    } else if (didSet) {
      if (!needsGetter) {
        needsGetter = didSet.length > 1;
      }
      if (needsGetter) {
        setter = function(newValue, oldValue) {
          set.call(this, newValue, oldValue);
          return didSet.call(this, newValue, oldValue);
        };
      } else {
        setter = function(newValue) {
          set.call(this, newValue);
          return didSet.call(this, newValue);
        };
      }
    }
    if (!needsGetter) {
      return setter;
    }
    getter = get.safely || get;
    return function(newValue) {
      return setter.call(this, newValue, getter.call(this));
    };
  },
  _createEmptySetter: function(key) {
    if (!isDev) {
      return emptyFunction;
    }
    return function() {
      throw Error("'" + key + "' is not writable.");
    };
  }
};

for (key in prototype) {
  value = prototype[key];
  define(Property.prototype, key, {
    value: value,
    enumerable: true
  });
}

for (key in internalPrototype) {
  value = internalPrototype[key];
  define(Property.prototype, key, {
    value: value
  });
}

module.exports = Property;

//# sourceMappingURL=../../map/src/Property.map
