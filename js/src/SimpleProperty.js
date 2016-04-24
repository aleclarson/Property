module.exports = {
  transformValue: function() {
    return function(value) {
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
