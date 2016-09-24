
emptyFunction = require "emptyFunction"
isProto = require "isProto"
isDev = require "isDev"

injected = require "./injectable"
Setter = require "./Setter"

define = Object.defineProperty

Proxy = exports

Proxy.define = (target, key, config) ->

  proxy = Proxy.create config, key, target

  if isDev
    try define target, key, proxy
    catch error then console.error error
    return

  define target, key, proxy
  return

Proxy.create = (config, key, target) ->

  type =
    if config.get then "stateless"
    else if config.lazy then "lazy"
    else if config.reactive then "reactive"
    else "stateful"

  proxy = Proxy.types[type] config, key, target
  proxy.set and proxy.set = Setter.create key, proxy, config
  proxy.enumerable = config.enumerable
  proxy.configurable = config.configurable
  return proxy

Proxy.types =

  stateless: (config) ->
    get: config.get or @get
    set: config.set or @set or emptyFunction

  lazy: (config, key, target) ->

    targetIsProto = isProto target

    if config.reactive and targetIsProto
      throw Error "Cannot define a reactive Property on a prototype!"

    if injected.has "LazyVar"
      LazyVar = injected.get "LazyVar"
    else throw Error "Must inject 'LazyVar' into 'Property' before defining a lazy property!"

    value = LazyVar
      createValue: config.lazy
      reactive: config.reactive

    get = value.get
    get.safely = -> value._value

    if targetIsProto
      set = -> throw Error "'#{key.toString()}' is not writable."
    else set = value.set

    return { get, set }

  reactive: (config, key, target) ->

    if isProto target
      throw Error "Cannot define reactive Property on a prototype!"

    if injected.has "ReactiveVar"
      ReactiveVar = injected.get "ReactiveVar"
    else throw Error "Must inject 'ReactiveVar' into 'Property' before defining a reactive property!"

    value = ReactiveVar config.value
    get = -> value.get()
    get.safely = -> value._value
    set = (newValue) -> value.set newValue
    return { get, set }

  stateful: (config, key, target) ->
    value = config.value
    if isProto target
      value: value
      writable: config.writable
    else
      get: -> value
      set: (newValue) ->
        value = newValue
