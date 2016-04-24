
module.exports =

  transformValue: ->
    return (value) ->
      get: -> value
      set: (newValue) -> value = newValue

  createGetter: (value) ->
    return value.get

  createSetter: (value) ->
    return value.set
