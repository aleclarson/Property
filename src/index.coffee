
Property = require "./Property"

Property.Map = require "./PropertyMap"

Property.mutable = Property()

Property.frozen = Property {frozen: yes}

Property.hidden = Property {enumerable: no}

Property.reactive = Property {reactive: yes}

module.exports = Property
