
NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
mergeDefaults = require "mergeDefaults"
isDev = require "isDev"

Proxy = require "./Proxy"

Property = NamedFunction "Property", (config = {}) ->
  isDev and validateConfig config
  self = Object.create Property.prototype
  self.defaults = self._parseDefaults config
  return self

module.exports = Property

Property::define = (target, key, config = {}) ->

  if isDev and typeof key isnt "string"
    throw TypeError "'key' must be a String!"

  if config.value is undefined
    config.value = @value

  if config.value is undefined
    return if config.needsValue or @needsValue

  if config.enumerable is undefined
    config.enumerable = not isHiddenProperty this, key

  mergeDefaults config, @defaults

  if needsProxy config
    Proxy.define target, key, config
  else
    target[key] = config.value
  return

Property::_parseDefaults = (config) ->

  defaults = {}

  if isDev

    if config.enumerable is no
      @hidden = yes

    defaults.writable = not (config.frozen or config.writable is no)
    defaults.configurable = not (config.frozen or config.configurable is no)

  else
    defaults.writable = config.writable isnt no
    defaults.configurable = config.configurable isnt no

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

  else if config.lazy
    defaults.lazy = config.lazy

  else
    @value = config.value

    if config.needsValue
      @needsValue = yes

    if config.reactive
      defaults.reactive = yes

  return defaults

#
# Helpers
#

needsProxy = (config) ->
  return yes unless config.enumerable and config.writable and config.configurable
  return yes if config.get or config.lazy or config.reactive
  return yes if config.didSet or config.willSet
  return no

isHiddenProperty =
  if isDev
  then (prop, key) -> prop.hidden or key.startsWith "_"
  else emptyFunction.thatReturnsFalse

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
