var Any, Kind, LazyProperty, LazyVar, NamedFunction, Property, ProxyProperty, PureObject, ReactiveProperty, SimpleProperty, Tracer, Void, assert, assertType, assertTypes, configTypes, define, emptyFunction, guard, internalPrototype, isProto, isType, key, prototype, setType, throwFailure, value;

require("isDev");

throwFailure = require("failure").throwFailure;

NamedFunction = require("NamedFunction");

emptyFunction = require("emptyFunction");

assertTypes = require("assertTypes");

assertType = require("assertType");

PureObject = require("PureObject");

setType = require("setType");

isProto = require("isProto");

Tracer = require("tracer");

isType = require("isType");

assert = require("assert");

guard = require("guard");

Void = require("Void");

Kind = require("Kind");

Any = require("Any");

ReactiveProperty = require("./ReactiveProperty");

SimpleProperty = require("./SimpleProperty");

ProxyProperty = require("./ProxyProperty");

LazyProperty = require("./LazyProperty");

LazyVar = require("./inject/LazyVar");

define = Object.defineProperty;

if (isDev) {
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
}

module.exports = Property = NamedFunction("Property", function(config) {
  var self;
  if (!config) {
    config = {};
  }
  if (isDev) {
    assertTypes(config, configTypes);
  }
  self = {
    simple: true,
    writable: true,
    configurable: true
  };
  if (isDev) {
    define(self, "_tracer", {
      value: Tracer("Property()")
    });
  }
  setType(self, Property);
  self._parseConfig(config);
  return self;
});

Property.targetType = [Kind(Object), PureObject];

Property.keyType = global.Symbol ? [String, Symbol] : [String];

prototype = {
  define: function(target, key, value) {
    var enumerable;
    assertType(target, Property.targetType);
    assertType(key, Property.keyType);
    if (arguments.length === 2) {
      value = this.value;
    }
    if (this.needsValue) {
      if (value === void 0) {
        return;
      }
    }
    enumerable = isDev ? this._isEnumerable(key) : true;
    if (this.simple && enumerable) {
      target[key] = value;
    } else {
      this._define(target, key, value, enumerable);
    }
  }
};

internalPrototype = {
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
    var descriptor, get, prop;
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
    prop = this;
    return guard(function() {
      return define(target, key, descriptor);
    }).fail(function(error) {
      return throwFailure(error, {
        target: target,
        key: key,
        value: value,
        descriptor: descriptor,
        prop: prop,
        stack: isDev ? prop._tracer() : void 0
      });
    });
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

//# sourceMappingURL=../../map/src/Property.map
