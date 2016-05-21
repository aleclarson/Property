
require "isDev"

{ throwFailure } = require "failure"

NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
assertTypes = require "assertTypes"
assertType = require "assertType"
PureObject = require "PureObject"
setType = require "setType"
isProto = require "isProto"
Tracer = require "tracer"
isType = require "isType"
assert = require "assert"
guard = require "guard"
Void = require "Void"
Kind = require "Kind"
Any = require "Any"

ReactiveProperty = require "./ReactiveProperty"
SimpleProperty = require "./SimpleProperty"
ProxyProperty = require "./ProxyProperty"
LazyProperty = require "./LazyProperty"
LazyVar = require "./inject/LazyVar"

define = Object.defineProperty

if isDev
  TargetType = [ Kind(Object), PureObject ]
  KeyType = [ String ]
  KeyType.push Symbol if Symbol
  configTypes =
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

module.exports =
Property = NamedFunction "Property", (config) ->

  config = {} unless config

  assertTypes config, configTypes if isDev

  self =
    simple: yes
    writable: yes
    configurable: yes

  if isDev
    define self, "_tracer",
      value: Tracer "Property()"

  setType self, Property

  self._parseConfig config

  return self

prototype =

  define: (target, key, value) ->

    if isDev
      assertType target, TargetType
      assertType key, KeyType

    if arguments.length is 2
      value = @value

    if @needsValue
      return if value is undefined

    enumerable = if isDev then @_isEnumerable key else yes

    if @simple and enumerable
      target[key] = value
    else @_define target, key, value, enumerable
    return

internalPrototype =

  _isEnumerable: (key) ->
    return yes if isType key, Symbol
    return @enumerable if @enumerable isnt undefined
    return key[0] isnt "_"

  _define: (target, key, value, enumerable) ->

    if isProto target

      if @get
        descriptor = {
          @get
          @set
          enumerable
          @configurable
        }

      else if @lazy
        descriptor = {
          get: LazyVar(@lazy).get
          enumerable
          @configurable
        }

      else
        descriptor = {
          value
          enumerable
          @writable
          @configurable
        }

    else
      value = @transformValue value
      get = @createGetter value
      descriptor = {
        get
        set: @createSetter key, value, get
        enumerable
        @configurable
      }

    prop = this
    guard -> define target, key, descriptor
    .fail (error) -> throwFailure error, {
      target, key, value, descriptor, prop
      stack: prop._tracer() if isDev
    }

  _parseConfig: (config) ->

    # We force 'enumerable', 'configurable', and 'writable'
    # to be true when not in __DEV__ mode so we can avoid
    # any unnecessary calls to 'Object.defineProperty'.
    @_parseAttributes config if isDev

    type = @_parseType config

    # When not in __DEV__ mode, we can be absolutely certain
    # that 'enumerable' equals true. With that in mind, we can avoid the
    # cost of creating 'transformValue', 'createGetter', and 'createSetter'!
    return if @simple and not isDev

    @get = config.get
    @set = config.set
    @lazy = config.lazy

    @transformValue = type.transformValue config
    @createGetter = type.createGetter
    @createSetter = @_createSetterType type, config

  _parseAttributes: (config) ->

    @enumerable = config.enumerable

    if config.frozen
      @simple = no
      @writable = no
      @configurable = no
      return

    if config.writable is no
      @simple = no
      @writable = no

    if config.configurable is no
      @simple = no
      @configurable = no

  _parseType: (config) ->

    if config.get
      @simple = no
      @writable = no unless config.set
      return ProxyProperty

    assert not config.set,
      reason: "Cannot define 'set' without 'get'!"

    if config.lazy
      @simple = no
      return LazyProperty

    @value = config.value

    if config.needsValue is yes
      @needsValue = yes

    if config.reactive
      @simple = no
      return ReactiveProperty

    return SimpleProperty

  _createSetterType: (type, config) ->

    if @writable
      return @_wrapSetterType type.createSetter, config.willSet, config.didSet

    unless isDev
      return -> emptyFunction

    return (key) ->
      return -> throw Error "'" + key.toString() + "' is not writable."

  _wrapSetterType: (createSetter, willSet, didSet) ->

    wrapSetter = emptyFunction.thatReturnsArgument

    if willSet

      if didSet
        @simple = no
        wrapSetter = (setter) ->
          return (newValue, oldValue) ->
            newValue = willSet.call this, newValue, oldValue
            setter.call this, newValue, oldValue
            didSet.call this, newValue, oldValue

      else
        @simple = no
        wrapSetter = (setter) ->
          return (newValue, oldValue) ->
            newValue = willSet.call this, newValue, oldValue
            setter.call this, newValue, oldValue

    else if didSet
      @simple = no
      wrapSetter = (setter) ->
        return (newValue, oldValue) ->
          setter.call this, newValue, oldValue
          didSet.call this, newValue, oldValue

    return (key, value, get) ->

      setter = wrapSetter createSetter value
      if setter.length < 2
        return (newValue) ->
          setter.call this, newValue

      getter = get.safely or get
      return (newValue) ->
        setter.call this, newValue, getter.call this

for key, value of prototype
  define Property.prototype, key, { value, enumerable: yes }

for key, value of internalPrototype
  define Property.prototype, key, { value }
