var emptyFunction;

emptyFunction = require("emptyFunction");

module.exports = {
  createAllocator: function(arg) {
    var get, set, value;
    get = arg.get, set = arg.set;
    value = {
      get: get,
      set: set
    };
    return function() {
      return value;
    };
  },
  createGetter: function(value) {
    return value.get;
  },
  createSetter: function(value) {
    return value.set || emptyFunction;
  }
};

//# sourceMappingURL=../../map/src/ProxyProperty.map
