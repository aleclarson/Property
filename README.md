
# Property v1.0.0 ![stable](https://img.shields.io/badge/stability-stable-4EBA0F.svg?style=flat)

```coffee
Property = require "Property"

p = Property { value: 1, frozen: yes }

o = {}

p.define o, "_key"

o._key         # => 1

o._key = 2     # Throws an Error in __DEV__ mode!

Object.keys o  # => []
```

Plus **much more**! Documentation coming soon.
