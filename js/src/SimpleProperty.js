module.exports = {
  createAllocator: function(config) {
    var initialValue;
    initialValue = config.value;
    return function() {
      var value;
      value = initialValue;
      return {
        get: function() {
          return value;
        },
        set: function(newValue) {
          return value = newValue;
        }
      };
    };
  },
  createGetter: function(value) {
    return value.get;
  },
  createSetter: function(value) {
    return value.set;
  }
};

//# sourceMappingURL=../../map/src/SimpleProperty.map
