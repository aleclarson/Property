
emptyFunction = require "emptyFunction"
isDev = require "isDev"

Setter = exports

Setter.frozen = (key) ->
  if isDev
  then -> throw Error "'#{key.toString()}' is not writable."
  else emptyFunction

Setter.define = (proxy, {willSet, didSet}) ->

  setter = Setter.wrap proxy.set, willSet, didSet

  needsGetter =
    (proxy.set.length > 1) or
    (didSet and didSet.length > 1) or
    (willSet and willSet.length > 1)

  if needsGetter
    getter = proxy.get.safely or proxy.get
    proxy.set = (newValue) ->
      setter.call this, newValue, getter.call this

  else
    proxy.set = setter
  return

Setter.wrap = (set, willSet, didSet) ->

  if willSet

    if didSet
      return (newValue, oldValue) ->
        newValue = willSet.call this, newValue, oldValue
        set.call this, newValue, oldValue
        didSet.call this, newValue, oldValue

    return (newValue, oldValue) ->
      newValue = willSet.call this, newValue, oldValue
      set.call this, newValue, oldValue

  if didSet
    return (newValue, oldValue) ->
      set.call this, newValue, oldValue
      didSet.call this, newValue, oldValue

  return set
