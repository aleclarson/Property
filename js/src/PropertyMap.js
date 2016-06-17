var NamedFunction, Property, PropertyMap, define, isType, key, prototype, setType, value;

NamedFunction = require("NamedFunction");

setType = require("setType");

isType = require("isType");

Property = require("./Property");

define = Object.defineProperty;

module.exports = PropertyMap = NamedFunction("PropertyMap", function(props) {
  var key, options, self;
  self = setType({}, PropertyMap);
  define(self, "_props", {
    value: {}
  });
  define(self, "_creators", {
    value: {}
  });
  for (key in props) {
    options = props[key];
    if (isType(options, Function)) {
      self._creators[key] = options;
      options = null;
    } else if (!isType(options, Object)) {
      options = {
        value: options
      };
    }
    self._props[key] = Property(options);
  }
  return self;
});

prototype = {
  keys: function() {
    return Object.keys(this._props);
  },
  define: function(target, args) {
    var createValue, key, prop, ref;
    ref = this._props;
    for (key in ref) {
      prop = ref[key];
      createValue = this._creators[key];
      if (createValue) {
        if (createValue.length) {
          prop.define(target, key, createValue.apply(target, args));
        } else {
          prop.define(target, key, createValue.call(target));
        }
      } else {
        prop.define(target, key);
      }
    }
  }
};

for (key in prototype) {
  value = prototype[key];
  define(PropertyMap.prototype, key, {
    value: value,
    enumerable: true
  });
}

//# sourceMappingURL=../../map/src/PropertyMap.map
