
require "isDev"

{ Any, Void, setType, assert, validateTypes } = require "type-utils"

NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
ReactiveVar = require "reactive-var"
LazyVar = require "lazy-var"
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

  if config.needsValue and (config.value is undefined)
    return null

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

  define: (target, key) ->

    { simple, enumerable } = this

    if isDev

      if enumerable is undefined
        enumerable = key[0] isnt "_"

      unless enumerable
        simple = no

    else
      enumerable = yes

    if simple
      target[key] = @value
      return

    if isProto target
      define target, key, { @value, enumerable, @writable, @configurable }
      return

    value = @allocate()

    get = @type.createGetter value

    if @writable
      set = @type.createSetter value
      set = @_wrapSetter get, set, @willSet, @didSet
    else
      set = @_createEmptySetter key

    define target, key, { get, set, enumerable, @configurable }
    return

internalPrototype =

  _parseConfig: (config) ->
    @_parseAttributes config if isDev
    @type = @_parseType config
    @allocate = @type.createAllocator config # TODO: Possibly avoid this for simple properties; which might only be possible when out of __DEV__ mode.
    return

  _parseAttributes: (config) ->

    if isDev
      @enumerable = config.enumerable

    if config.frozen
      @simple = no
      @writable = no
      @configurable = no

    else

      if config.writable is no
        @simple = no
        @writable = no

      if config.configurable is no
        @simple = no
        @configurable = no

  _parseType: (config) ->

    if @writable

      if config.willSet
        @simple = no
        @willSet = config.willSet

      if config.didSet
        @simple = no
        @didSet = config.didSet

    if config.get
      @simple = no
      return ProxyProperty

    assert not config.set,
      reason: "Cannot define 'set' without 'get'!"

    if config.lazy
      @simple = no
      return LazyProperty

    if config.reactive
      @simple = no
      return ReactiveProperty

    @value = config.value
    return SimpleProperty

  _wrapSetter: (get, set, willSet, didSet) ->

    setter = set
    needsGetter = set.length > 1

    if willSet

      unless needsGetter
        needsGetter = willSet.length > 1

      if didSet

        unless needsGetter
          needsGetter = didSet.length > 1

        if needsGetter
          setter = (newValue, oldValue) ->
            newValue = willSet.call this, newValue, oldValue
            set.call this, newValue, oldValue
            didSet.call this, newValue, oldValue

        else
          setter = (newValue) ->
            newValue = willSet.call this, newValue
            set.call this, newValue
            didSet.call this, newValue

      else if needsGetter
        setter = (newValue, oldValue) ->
          newValue = willSet.call this, newValue, oldValue
          set.call this, newValue, oldValue

      else
        setter = (newValue) ->
          newValue = willSet.call this, newValue
          set.call this, newValue

    else if didSet

      unless needsGetter
        needsGetter = didSet.length > 1

      if needsGetter
        setter = (newValue, oldValue) ->
          set.call this, newValue, oldValue
          didSet.call this, newValue, oldValue

      else
        setter = (newValue) ->
          set.call this, newValue
          didSet.call this, newValue

    unless needsGetter
      return setter

    getter = get.safely or get

    return (newValue) ->
      setter.call this, newValue, getter.call this

  _createEmptySetter: (key) ->
    return emptyFunction unless isDev
    return -> throw Error "'#{key}' is not writable."

for key, value of prototype
  define Property.prototype, key, { value, enumerable: yes }

for key, value of internalPrototype
  define Property.prototype, key, { value }

module.exports = Property
