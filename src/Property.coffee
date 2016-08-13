
require "isDev"

NamedFunction = require "NamedFunction"
mergeDefaults = require "mergeDefaults"
assertTypes = require "assertTypes"
isProto = require "isProto"
isType = require "isType"
assert = require "assert"
Void = require "Void"
Any = require "Any"

Proxy = require "./Proxy"

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
  self = Object.create Property.prototype
  define self, "_defaults",
    value: self._parseDefaults config
  return self

prototype =

  define: (target, key, config = {}) ->

    if config.value is undefined
      config.value = @_value

    if config.needsValue ?= @_needsValue
      return if config.value is undefined

    config.enumerable ?= if isDev then @_isEnumerable key else yes
    mergeDefaults config, @_defaults

    if @_needsProxy config
      Proxy.define target, key, config
    else
      target[key] = config.value
    return

  _isEnumerable: (key) ->
    return yes if isType key, Symbol
    return no if @_enumerable is no
    return key[0] isnt "_"

  _needsProxy: (config) ->
    return yes unless config.enumerable and config.writable and config.configurable
    return yes if config.get or config.lazy or config.reactive
    return yes if config.didSet or config.willSet
    return no

  _parseDefaults: (config) ->

    defaults = {}

    if isDev and (config.enumerable is no)
      define this, "_enumerable", { value: no }

    if config.frozen
      defaults.writable = not isDev
      defaults.configurable = not isDev
    else
      defaults.writable = (not isDev) or (config.writable isnt no)
      defaults.configurable = (not isDev) or (config.configurable isnt no)

    if config.willSet
      defaults.willSet = config.willSet

    if config.didSet
      defaults.didSet = config.didSet

    if config.get
      defaults.get = config.get
      if config.set
        defaults.set = config.set
      else defaults.writable = no

    else
      assert not config.set, "Cannot define 'set' without 'get'!"
      defaults.reactive = config.reactive is yes
      if config.lazy
        defaults.lazy = config.lazy
      else
        define this, "_value", { value: config.value }
        define this, "_needsValue", { value: config.needsValue is yes }

    return defaults

Object.keys(prototype).forEach (key) ->
  define Property.prototype, key, { value: prototype[key] }

Property.mutable = Property()

Property.frozen = Property { frozen: yes }

Property.hidden = Property { enumerable: no }

Property.reactive = Property { reactive: yes }

module.exports = Property
