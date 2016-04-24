
LazyVar = require "lazy-var"

module.exports =

  transformValue: (config) ->

    options =
      createValue: config.lazy
      reactive: config.reactive

    return ->
      LazyVar options

  createGetter: (lazyValue) ->
    get = -> lazyValue.get.call this
    get.safely = -> lazyValue._value
    return get

  createSetter: (lazyValue) ->
    return (newValue) ->
      lazyValue.set.call this, newValue
