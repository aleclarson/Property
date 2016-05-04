
Injectable = require "Injectable"

ReactiveVar = Injectable.Type()

module.exports =

  inject: ReactiveVar.inject

  transformValue: ->
    return (value) ->
      ReactiveVar value

  createGetter: (reactiveValue) ->
    get = -> reactiveValue.get()
    get.safely = -> reactiveValue._value
    return get

  createSetter: (reactiveValue) ->
    return (newValue) ->
      reactiveValue.set newValue
