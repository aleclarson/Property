
ReactiveVar = require "reactive-var"

module.exports =

  transformValue: ->
    return (value) ->
      new ReactiveVar value

  createGetter: (reactiveValue) ->
    get = -> reactiveValue.get()
    get.safely = -> reactiveValue._value
    return get

  createSetter: (reactiveValue) ->
    return (newValue) ->
      reactiveValue.set newValue
