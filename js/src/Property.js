var Any, Kind, NamedFunction, Property, PropertyInternal, PureObject, Tracer, Void, assertType, assertTypes, configTypes, define, isProto, isType, setType;

require("isDev");

NamedFunction = require("NamedFunction");

assertTypes = require("assertTypes");

assertType = require("assertType");

PureObject = require("PureObject");

setType = require("setType");

isProto = require("isProto");

Tracer = require("tracer");

isType = require("isType");

Void = require("Void");

Kind = require("Kind");

Any = require("Any");

PropertyInternal = require("./PropertyInternal");

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
  self = {
    simple: true,
    writable: true,
    configurable: true
  };
  isDev && define(self, "_tracer", {
    value: Tracer("Property()")
  });
  setType(self, Property);
  self._parseConfig(config);
  return self;
});

PropertyInternal.define(Property.prototype);

module.exports = Property;

Property.targetType = [Kind(Object), PureObject];

Property.keyType = global.Symbol ? [String, Symbol] : String;

Property.mutable = Property();

Property.frozen = Property({
  frozen: true
});

Property.hidden = Property({
  enumerable: false
});

Property.prototype.define = function(target, key) {
  var enumerable, value;
  assertType(target, Property.targetType);
  assertType(key, Property.keyType);
  if (arguments.length > 2) {
    value = arguments[2];
  } else {
    value = this.value;
  }
  if (this.needsValue && (value === void 0)) {
    return;
  }
  enumerable = isDev ? this._isEnumerable(key) : true;
  if (this.simple && enumerable) {
    target[key] = value;
    return;
  }
  this._define(target, key, value, enumerable);
};

//# sourceMappingURL=../../map/src/Property.map
