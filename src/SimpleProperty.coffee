
module.exports =

  createAllocator: (config) ->
    initialValue = config.value
    return ->
      value = initialValue
      get: -> value
      set: (newValue) -> value = newValue

  createGetter: (value) ->
    return value.get

  createSetter: (value) ->
    return value.set
