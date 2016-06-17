
emptyFunction = require "emptyFunction"

module.exports =

  transformValue: ({ get, set }) ->
    value = { get, set }
    return -> value

  createGetter: (value) ->
    return value.get

  createSetter: (value) ->
    return value.set or emptyFunction
