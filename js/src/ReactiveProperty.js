var Injectable, ReactiveVar;

Injectable = require("Injectable");

ReactiveVar = Injectable.Type();

module.exports = {
  inject: ReactiveVar.inject,
  transformValue: function() {
    return function(value) {
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
