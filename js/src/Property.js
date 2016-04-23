var Any, Injectable, LazyVar, NamedFunction, Property, ReactiveVar, Void, assert, configTypes, define, emptyFunction, internalPrototype, key, prototype, ref, setType, throwFailure, validateTypes, value;

require("isDev");

ref = require("type-utils"), Any = ref.Any, Void = ref.Void, setType = ref.setType, assert = ref.assert, validateTypes = ref.validateTypes;

throwFailure = require("failure").throwFailure;

NamedFunction = require("NamedFunction");

emptyFunction = require("emptyFunction");

ReactiveVar = require("reactive-var");

Injectable = require("Injectable");

LazyVar = require("lazy-var");

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

Property = NamedFunction("Property", function(config) {
  var self;
  if (!config) {
    config = {};
  }
  validateTypes(config, configTypes);
  if (config.needsValue && (config.value === void 0)) {
    return null;
  }
  if (isDev) {
    self = {
      simple: true,
      writable: config.writable != null ? config.writable : config.writable = true,
      enumerable: config.enumerable,
      configurable: config.configurable != null ? config.configurable : config.configurable = true
    };
  } else {
    self = {
      simple: true,
      writable: true,
      enumerable: true,
      configurable: true
    };
  }
  setType(self, Property);
  self._parseConfig(config);
  return self;
});

prototype = {
  define: function(target, key) {
    var enumerable, get, set, simple;
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
    get = this.createGetter(key);
    set = this.createSetter(key, get);
    set = this._wrapSetter(set, get);
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
      if (config.frozen) {
        this.simple = false;
        this.writable = false;
        this.configurable = false;
      } else if (config.enumerable === false) {
        this.simple = false;
      } else if (config.configurable === false) {
        this.simple = false;
      } else if (config.writable === false) {
        this.simple = false;
      }
    }
    this.createSetter = this._parseSetter(config);
    return this.createGetter = this._parseGetter(config);
  },
  _parseGetter: function(config) {
    if (config.get) {
      this.simple = false;
      return emptyFunction.thatReturns(config.get);
    }
    assert(!config.set, {
      reason: "Cannot define 'set' without 'get'!"
    });
    if (config.lazy) {
      this.simple = false;
      return this._createLazyGetter(config.lazy, this.reactive);
    }
    if (config.reactive) {
      this.simple = false;
      return this._createReactiveGetter(config.value);
    }
    if (this.simple) {
      this.value = config.value;
    }
    return this._createSimpleGetter(config.value);
  },
  _parseSetter: function(config) {
    if (this.writable) {
      if (config.willSet) {
        this.simple = false;
        this.willSet = config.willSet;
      }
      if (config.didSet) {
        this.simple = false;
        this.didSet = config.didSet;
      }
      if (config.get) {
        this.simple = false;
        if (config.set) {
          return emptyFunction.thatReturns(config.set);
        }
        return this._createEmptySetter();
      }
      if (config.lazy) {
        return this._createLazySetter();
      }
      if (config.reactive) {
        return this._createReactiveSetter();
      }
      return this._createSimpleSetter();
    }
    if (isDev) {
      assert(!config.set, {
        reason: "Cannot define 'set' when 'writable' is false!"
      });
      assert(!config.willSet, {
        reason: "Cannot define 'willSet' when 'writable' is false!"
      });
      assert(!config.didSet, {
        reason: "Cannot define 'didSet' when 'writable' is false!"
      });
    }
    return this._createEmptySetter();
  },
  _wrapSetter: function(set, get) {
    var didSet, getter, needsGetter, setter, willSet;
    willSet = this.willSet, didSet = this.didSet;
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
  _createSimpleGetter: function(value) {
    return function() {
      var get;
      get = function() {
        return get.value;
      };
      get.value = value;
      return get;
    };
  },
  _createLazyGetter: function(createValue, reactive) {
    return function() {
      var get, lazyValue;
      lazyValue = LazyVar({
        createValue: createValue,
        reactive: reactive
      });
      get = function() {
        return lazyValue.get.call(this);
      };
      get.safely = function() {
        return lazyValue._value;
      };
      get.value = lazyValue;
      return get;
    };
  },
  _createReactiveGetter: function(value) {
    return function() {
      var get, reactiveValue;
      reactiveValue = ReactiveVar(value);
      get = function() {
        return reactiveValue.get();
      };
      get.safely = function() {
        return reactiveValue._value;
      };
      get.value = reactiveValue;
      return get;
    };
  },
  _createSimpleSetter: function() {
    return function(_, get) {
      return function(newValue) {
        return get.value = newValue;
      };
    };
  },
  _createLazySetter: function() {
    return function(_, get) {
      return function(newValue) {
        return get.value.set.call(this, newValue);
      };
    };
  },
  _createReactiveSetter: function() {
    return function(_, get) {
      return function(newValue) {
        return get.value.set(newValue);
      };
    };
  },
  _createEmptySetter: function() {
    return function(key) {
      if (!isDev) {
        return emptyFunction;
      }
      return function() {
        throw Error("'" + key + "' is not writable.");
      };
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
