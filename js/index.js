var Property;

Property = require("./Property");

Property.Map = require("./PropertyMap");

Property.mutable = Property();

Property.frozen = Property({
  frozen: true
});

Property.hidden = Property({
  enumerable: false
});

Property.reactive = Property({
  reactive: true
});

module.exports = Property;

//# sourceMappingURL=map/index.map
