var ReactiveVar;

ReactiveVar = require("reactive-var");

module.exports = {
  createAllocator: function(arg) {
    var value;
    value = arg.value;
    return function() {
      return ReactiveVar(value);
    };
  },
  createGetter: function(reactiveValue) {
    var get;
    get = function() {
      return reactiveValue.get();
    };
    get.safely = function() {
      return reactiveValue._value;
    };
    return get;
  },
  createSetter: function(reactiveValue) {
    return function(newValue) {
      return reactiveValue.set(newValue);
    };
  }
};

//# sourceMappingURL=../../map/src/ReactiveProperty.map
