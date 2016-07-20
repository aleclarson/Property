var injectable;

injectable = {
  LazyVar: require("./LazyVar"),
  ReactiveVar: require("./ReactiveVar")
};

module.exports = function(key, value) {
  return injectable[key].inject(value);
};

//# sourceMappingURL=map/index.map
