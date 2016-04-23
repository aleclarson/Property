
require "isDev"

{ Any, Void, setType, assert, validateTypes } = require "type-utils"
{ throwFailure } = require "failure"

NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
ReactiveVar = require "reactive-var"
Injectable = require "Injectable"
LazyVar = require "lazy-var"

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

Property = NamedFunction "Property", (config) ->

  config = {} unless config

  validateTypes config, configTypes

  if config.needsValue and (config.value is undefined)
    return null

  if isDev
    self =
      simple: yes
      writable: config.writable ?= yes
      enumerable: config.enumerable
      configurable: config.configurable ?= yes

  else
    self =
      simple: yes
      writable: yes
      enumerable: yes
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

    get = @createGetter key
    set = @createSetter key, get
    set = @_wrapSetter set, get

    define target, key, { get, set, enumerable, @configurable }
    return

internalPrototype =

  _parseConfig: (config) ->

    if isDev

      if config.frozen
        @simple = no
        @writable = no
        @configurable = no

      else if config.enumerable is no
        @simple = no

      else if config.configurable is no
        @simple = no

      else if config.writable is no
        @simple = no

    @createSetter = @_parseSetter config
    @createGetter = @_parseGetter config

  _parseGetter: (config) ->

    if config.get
      @simple = no
      return emptyFunction.thatReturns config.get

    assert not config.set,
      reason: "Cannot define 'set' without 'get'!"

    if config.lazy
      @simple = no
      return @_createLazyGetter config.lazy, @reactive

    if config.reactive
      @simple = no
      return @_createReactiveGetter config.value

    @value = config.value if @simple
    return @_createSimpleGetter config.value

  _parseSetter: (config) ->

    if @writable

      if config.willSet
        @simple = no
        @willSet = config.willSet

      if config.didSet
        @simple = no
        @didSet = config.didSet

      if config.get
        @simple = no
        if config.set
          return emptyFunction.thatReturns config.set
        return @_createEmptySetter()

      if config.lazy
        return @_createLazySetter()

      if config.reactive
        return @_createReactiveSetter()

      return @_createSimpleSetter()

    if isDev

      assert not config.set,
        reason: "Cannot define 'set' when 'writable' is false!"

      assert not config.willSet,
        reason: "Cannot define 'willSet' when 'writable' is false!"

      assert not config.didSet,
        reason: "Cannot define 'didSet' when 'writable' is false!"

    return @_createEmptySetter()

  _wrapSetter: (set, get) ->

    { willSet, didSet } = this

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

  _createSimpleGetter: (value) -> () ->
    get = -> get.value
    get.value = value
    return get

  _createLazyGetter: (createValue, reactive) -> () ->
    lazyValue = LazyVar { createValue, reactive }
    get = -> lazyValue.get.call this
    get.safely = -> lazyValue._value
    get.value = lazyValue
    return get

  _createReactiveGetter: (value) -> () ->
    reactiveValue = ReactiveVar value
    get = -> reactiveValue.get()
    get.safely = -> reactiveValue._value
    get.value = reactiveValue
    return get

  _createSimpleSetter: () -> (_, get) ->
    return (newValue) ->
      get.value = newValue

  _createLazySetter: () -> (_, get) ->
    return (newValue) ->
      get.value.set.call this, newValue

  _createReactiveSetter: () -> (_, get) ->
    return (newValue) ->
      get.value.set newValue

  _createEmptySetter: () -> (key) ->
    return emptyFunction unless isDev
    return -> throw Error "'#{key}' is not writable."

for key, value of prototype
  define Property.prototype, key, { value, enumerable: yes }

for key, value of internalPrototype
  define Property.prototype, key, { value }

module.exports = Property
