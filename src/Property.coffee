
require "isDev"

NamedFunction = require "NamedFunction"
mergeDefaults = require "mergeDefaults"

Proxy = require "./Proxy"

define = Object.defineProperty

Property = NamedFunction "Property", (config = {}) ->
  isDev and validateConfig config
  self = Object.create Property.prototype
  define self, "_defaults",
    value: self._parseDefaults config
  return self

module.exports = Property

Property::define = (target, key, config = {}) ->

  if isDev and typeof key isnt "string"
    throw TypeError "'key' must be a String!"

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

Property::_isEnumerable = (key) ->
  return yes if typeof key is "symbol"
  return no if @_enumerable is no
  return key[0] isnt "_"

Property::_needsProxy = (config) ->
  return yes unless config.enumerable and config.writable and config.configurable
  return yes if config.get or config.lazy or config.reactive
  return yes if config.didSet or config.willSet
  return no

Property::_parseDefaults = (config) ->

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

  else if config.set
    throw Error "Cannot define 'set' without 'get'!"

  else
    defaults.reactive = config.reactive is yes
    if config.lazy
      defaults.lazy = config.lazy
    else
      define this, "_value", { value: config.value }
      define this, "_needsValue", { value: config.needsValue is yes }

  return defaults

#
# Helpers
#

isDev and
validateConfig = do ->

  types =
    needsValue: Boolean
    frozen: Boolean
    writable: Boolean
    configurable: Boolean
    enumerable: Boolean
    get: Function
    set: Function
    didSet: Function
    willSet: Function
    lazy: Function
    reactive: Boolean

  wrongType = require "wrongType"
  isType = require "isType"
  return (config) ->
    for key, type of types
      value = config[key]
      continue if value is undefined
      continue if isType value, type
      throw wrongType type, key
    return
