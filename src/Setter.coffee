
Setter = exports

Setter.create = (config, proxy) ->

  unless proxy.set and config.writable
    if isDev then return ->
      throw Error "'" + config.key.toString() + "' is not writable."
    return emptyFunction

  setter = Setter.build proxy.set, config.willSet, config.didSet

  if setter.length < 2
    return (newValue) ->
      setter.call this, newValue

  getter = proxy.get.safely or proxy.get
  return (newValue) ->
    setter.call this, newValue, getter.call this

Setter.build = (set, willSet, didSet) ->

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
