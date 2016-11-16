
emptyFunction = require "emptyFunction"
isProto = require "isProto"
isDev = require "isDev"

injected = require "./injectable"
Setter = require "./Setter"

define = Object.defineProperty

Proxy = exports

Proxy.define = (target, key, config) ->

  proxy =
    enumerable: config.enumerable
    configurable: config.configurable

  type =
    if config.get then "stateless"
    else if config.lazy then "lazy"
    else if config.reactive then "reactive"
    else "stateful"

  Proxy[type].call proxy, config, key, target

  if isDev
    try define target, key, proxy
    catch error then console.error error
    return

  define target, key, proxy
  return

Proxy.stateless = (config, key) ->
  @get = config.get
  if @set = config.set
    Setter.define this, config
  else @set = Setter.frozen key
  return

Proxy.lazy = (config, key) ->

  if not injected.has "LazyVar"
    throw Error "Must inject 'LazyVar' into 'Property' before defining a lazy property!"

  LazyVar = injected.get "LazyVar"
  value = LazyVar config.lazy

  @get = value.get
  @set = Setter.frozen key
  return

Proxy.reactive = (config, key, target) ->

  if isProto target
    throw Error "Cannot define reactive Property on a prototype!"

  if not injected.has "ReactiveVar"
    throw Error "Must inject 'ReactiveVar' into 'Property' before defining a reactive property!"

  ReactiveVar = injected.get "ReactiveVar"
  value = ReactiveVar config.value, target.constructor.name + "." + key

  @get = -> value.get()

  if not config.writable
    @set = Setter.frozen key
    return

  @get.safely = -> value._value
  @set = (newValue) -> value.set newValue
  Setter.define this, config
  return

Proxy.stateful = (config, key, target) ->
  {value} = config

  if not isProto target

    if config.willSet or config.didSet
      @get = -> value
      @set = (newValue) -> value = newValue
      Setter.define this, config
      return

    # When not writable, throw an error (instead of silence)
    if not config.writable
      @get = -> value
      @set = Setter.frozen key
      return

  @value = value
  @writable = config.writable
  return
