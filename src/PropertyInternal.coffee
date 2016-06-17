
require "isDev"

emptyFunction = require "emptyFunction"
isProto = require "isProto"
isType = require "isType"
assert = require "assert"
guard = require "guard"

ReactiveProperty = require "./ReactiveProperty"
SimpleProperty = require "./SimpleProperty"
ProxyProperty = require "./ProxyProperty"
LazyProperty = require "./LazyProperty"
LazyVar = require "./inject/LazyVar"

define = Object.defineProperty

exports.define = (prototype) ->
  for key, value of createMethods()
    define prototype, key, { value }
  return

createMethods = ->

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
          set: -> throw Error "'" + key.toString() + "' is not writable."
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

    if isDev
      try define target, key, descriptor
      catch error then throw error # Place breakpoint here.
      return

    define target, key, descriptor
    return

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
