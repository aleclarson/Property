var Setter;

Setter = exports;

Setter.create = function(key, proxy, config) {
  var getter, setter;
  if (!(proxy.set && config.writable)) {
    if (isDev) {
      return function() {
        throw Error("'" + (key.toString()) + "' is not writable.");
      };
    } else {
      return emptyFunction;
    }
  }
  setter = Setter.build(proxy.set, config.willSet, config.didSet);
  if (setter.length < 2) {
    return function(newValue) {
      return setter.call(this, newValue);
    };
  }
  getter = proxy.get.safely || proxy.get;
  return function(newValue) {
    return setter.call(this, newValue, getter.call(this));
  };
};

Setter.build = function(set, willSet, didSet) {
  if (willSet) {
    if (didSet) {
      return function(newValue, oldValue) {
        newValue = willSet.call(this, newValue, oldValue);
        set.call(this, newValue, oldValue);
        return didSet.call(this, newValue, oldValue);
      };
    }
    return function(newValue, oldValue) {
      newValue = willSet.call(this, newValue, oldValue);
      return set.call(this, newValue, oldValue);
    };
  }
  if (didSet) {
    return function(newValue, oldValue) {
      set.call(this, newValue, oldValue);
      return didSet.call(this, newValue, oldValue);
    };
  }
  return set;
};

//# sourceMappingURL=map/Setter.map
