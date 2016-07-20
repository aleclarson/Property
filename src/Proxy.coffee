
require "isDev"

emptyFunction = require "emptyFunction"
isProto = require "isProto"
assert = require "assert"

ReactiveVar = require "./inject/ReactiveVar"
LazyVar = require "./inject/LazyVar"
Setter = require "./Setter"

define = Object.defineProperty

Proxy = exports

Proxy.define = (config) ->

  if isDev
    try define config.target, config.key, Proxy.create config
    catch error then console.error error
    return

  define config.target, config.key, Proxy.create config
  return

Proxy.create = (config) ->

  type =
    if config.get then "stateless"
    else if config.lazy then "lazy"
    else if config.reactive then "reactive"
    else "stateful"

  proxy = Proxy.types[type] config
  proxy.set and proxy.set = Setter.create config, proxy
  proxy.enumerable = config.enumerable
  proxy.configurable = config.configurable
  return proxy

Proxy.types =

  stateless: (config) ->
    get: config.get or @get
    set: config.set or @set or emptyFunction

  lazy: (config) ->
    targetIsProto = isProto config.target
    if config.reactive and targetIsProto
      throw Error "Cannot define a reactive Property on a prototype!"
    value = LazyVar
      createValue: config.lazy
      reactive: config.reactive
    get = value.get
    get.safely = -> value._value
    if targetIsProto
      set = -> throw Error "'#{config.key.toString()}' is not writable."
    else set = value.set
    return { get, set }

  reactive: (config) ->
    assert not isProto(config.target), "Cannot define reactive Property on a prototype!"
    value = ReactiveVar config.value ? defaults.value
    get = -> value.get()
    get.safely = -> value._value
    set = (newValue) -> value.set newValue
    return { get, set }

  stateful: (config) ->
    value = config.value
    if isProto config.target
      value: value
      writable: config.writable
    else
      get: -> value
      set: (newValue) -> value = newValue
