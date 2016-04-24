
require "isDev"

{ Any, Void, setType, assert, assertType, validateTypes } = require "type-utils"

NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
isProto = require "isProto"

ReactiveProperty = require "./ReactiveProperty"
SimpleProperty = require "./SimpleProperty"
ProxyProperty = require "./ProxyProperty"
LazyProperty = require "./LazyProperty"

# Injectable = require "Injectable"
# ReactiveVar = Injectable.Type()
# LazyVar = Injectable.Type()

define = Object.defineProperty

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

  validateTypes config, configTypes

  self =
    simple: yes
    writable: yes
    configurable: yes

  setType self, Property

  self._parseConfig config

  return self

# Property.inject =
#   LazyVar: LazyVar.inject
#   ReactiveVar: ReactiveVar.inject

prototype =

  define: (target, key, value) ->

    assertType key, String

    if arguments.length is 2
      value = @value

    if @needsValue
      return if value is undefined

    enumerable = if isDev then @_isEnumerable key else yes

    if @simple and enumerable
      target[key] = value
      return

    if isProto target
      define target, key, { value, enumerable, @writable, @configurable }
      return

    define target, key, @_createDescriptor value, key, enumerable
    return

internalPrototype =

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
      return ProxyProperty

    assert not config.set,
      reason: "Cannot define 'set' without 'get'!"

    if config.lazy
      @simple = no
      return LazyProperty

    @value = config.value
    @needsValue = config.needsValue is yes

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
      return -> throw Error "'#{key}' is not writable."

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

  _isEnumerable: (key) ->
    return @enumerable if @enumerable isnt undefined
    return key[0] isnt "_"

  _createDescriptor: (value, key, enumerable) ->
    value = @transformValue value
    get = @createGetter value
    set = @createSetter key, value, get
    return { get, set, enumerable, @configurable }

for key, value of prototype
  define Property.prototype, key, { value, enumerable: yes }

for key, value of internalPrototype
  define Property.prototype, key, { value }
