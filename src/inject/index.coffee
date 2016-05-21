
injectable =
  LazyVar: require "./LazyVar"
  ReactiveVar: require "./ReactiveVar"

module.exports = (key, value) ->
  injectable[key].inject value
