
# Property v1.0.0 ![stable](https://img.shields.io/badge/stability-stable-4EBA0F.svg?style=flat)

- The `config` argument is never stored or mutated by the `Property` constructor. Feel free to reuse it. You can even mutate the `config` before each `Property(config)` without affecting existing properties created with the same `config`.

- You can optionally override `prop.value` when calling `prop.define()` by providing a third argument. This is useful for using just one `Property` to define values for many keys.

- When in `__DEV__` mode, the value of `prop.enumerable` is computed on every call to `prop.define()`; unless you define `options.enumerable`. If a key begins with an underscore (eg: `_foo`), its `enumerable` attribute will be set to `false`.

### Property.optionTypes

```coffee
value: Any
needsValue: [ Boolean, Void ]
frozen: [ Boolean, Void ]
writable: [ Boolean, Void ]
configurable: [ Boolean, Void ]
enumerable: [ Boolean, Void ]
get: [ Function, Void ]
set: [ Function, Void ]
didSet: [ Function, Void ]
willSet: [ Function, Void ]
lazy: [ Function, Void ]
reactive: [ Boolean, Void ]
```

### Property.Map

A `PropertyMap` combines a map of static behavior and dynamic values.

```coffee
#
# Before the constructor is defined.
#

props = Property.Map

  foo: { get: -> 1 }

  bar: (arg) -> 2 + @foo + arg

#
# Create the constructor.
#

MyType = ->
  props.define this, arguments

#
# Using the constructor.
#

obj = new MyType 3

obj.foo # => 1

obj.bar # => 6
```
