var LazyVar;

LazyVar = require("./inject/LazyVar");

module.exports = {
  transformValue: function(config) {
    var options;
    options = {
      createValue: config.lazy,
      reactive: config.reactive
    };
    return function() {
      return LazyVar(options);
    };
  },
  createGetter: function(lazyValue) {
    var get;
    get = function() {
      return lazyValue.get.call(this);
    };
    get.safely = function() {
      return lazyValue._value;
    };
    return get;
  },
  createSetter: function(lazyValue) {
    return function(newValue) {
      return lazyValue.set.call(this, newValue);
    };
  }
};

//# sourceMappingURL=../../map/src/LazyProperty.map
