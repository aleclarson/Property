// Generated by CoffeeScript 1.11.1
var InjectableMap, Kind;

InjectableMap = require("InjectableMap");

Kind = require("Kind");

if (Function.Kind == null) {
  Function.Kind = Kind(Function);
}

module.exports = InjectableMap({
  LazyVar: Function.Kind,
  ReactiveVar: Function.Kind
});
