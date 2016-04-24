var ReactiveVar;

ReactiveVar = require("reactive-var");

module.exports = {
  transformValue: function() {
    return function(value) {
      return new ReactiveVar(value);
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
