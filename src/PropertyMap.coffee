
{ isType, setType } = require "type-utils"

NamedFunction = require "NamedFunction"

Property = require "./Property"

define = Object.defineProperty

module.exports =
PropertyMap = NamedFunction "PropertyMap", (props) ->

  self = setType {}, PropertyMap

  define self, "_props", value: {}
  define self, "_creators", value: {}

  for key, options of props

    if isType options, Function
      self._creators[key] = options
      options = null

    else unless isType options, Object
      options = { value: options }

    self._props[key] = Property options

  return self

prototype =

  define: (target, args) ->
    for key, prop of @_props
      createValue = @_creators[key]
      if createValue
        prop.define target, key, createValue.apply target, args
      else prop.define target, key
    return

for key, value of prototype
  define PropertyMap.prototype, key, { value, enumerable: yes }
