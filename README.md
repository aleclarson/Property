
# Property v1.2.0 ![stable](https://img.shields.io/badge/stability-stable-4EBA0F.svg?style=flat)

- The `config` argument is never stored or mutated by the `Property` constructor. Feel free to reuse it. You can even mutate the `config` before each `Property(config)` without affecting existing properties created with the same `config`.

- You can optionally override `prop.value` when calling `prop.define()` by providing a third argument. This is useful for using just one `Property` to define values for many keys.

- When in `__DEV__` mode, the value of `prop.enumerable` is computed on every call to `prop.define()`; unless you define `options.enumerable`. If a key begins with an underscore (eg: `_foo`), its `enumerable` attribute will be set to `false`.

### Property.optionTypes

All keys are optional.

```coffee
value: Any
needsValue: Boolean # <- Avoid setting if no value is defined
frozen: Boolean # <- Mark both 'writable' and 'configurable' as false
writable: Boolean
configurable: Boolean
enumerable: Boolean
reactive: Boolean # <- Use a ReactiveVar as the backing value
lazy: Function # <- Use a LazyVar as the backing value
get: Function
set: Function
didSet: Function # <- Perform an action after the value is updated
willSet: Function # <- Inspect/replace the new value before it's updated
```
