
require "isDev"

NamedFunction = require "NamedFunction"
assertTypes = require "assertTypes"
assertType = require "assertType"
PureObject = require "PureObject"
setType = require "setType"
isProto = require "isProto"
Tracer = require "tracer"
isType = require "isType"
Void = require "Void"
Kind = require "Kind"
Any = require "Any"

PropertyInternal = require "./PropertyInternal"

define = Object.defineProperty

isDev and configTypes =
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

Property = NamedFunction "Property", (config = {}) ->

  isDev and assertTypes config, configTypes

  self =
    simple: yes
    writable: yes
    configurable: yes

  isDev and define self, "_tracer",
    value: Tracer "Property()"

  setType self, Property

  self._parseConfig config

  return self

PropertyInternal.define Property.prototype

module.exports = Property

#
# Class properties
#

Property.targetType = [
  Kind Object
  PureObject
]

Property.keyType =
  if global.Symbol
    [ String, Symbol ]
  else String

Property.mutable = Property()

Property.frozen = Property { frozen: yes }

Property.hidden = Property { enumerable: no }

#
# Public methods
#

Property.prototype.define = (target, key) ->

  assertType target, Property.targetType
  assertType key, Property.keyType

  if arguments.length > 2
    value = arguments[2]
  else value = @value

  return if @needsValue and (value is undefined)

  enumerable = if isDev then @_isEnumerable key else yes

  if @simple and enumerable
    target[key] = value
    return

  @_define target, key, value, enumerable
  return
