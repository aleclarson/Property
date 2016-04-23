
Property = require "../src/Property"

describe "Property", ->

  describe "options.value", ->

    it "defines the initial value of the property", ->

      prop = Property { value: 1 }
      prop.define obj = {}, "key"

      expect obj.key
        .toBe 1

    it "defaults to undefined", ->

      prop = Property()
      prop.define obj = {}, "key"

      expect obj.hasOwnProperty "key"
        .toBe yes

      expect obj.key
        .toBe undefined

    it "cannot be used with 'options.get'", ->

      prop = Property { value: 1, get: -> 2 }
      prop.define obj = {}, "key"

      expect obj.key
        .toBe 2

    it "cannot be used with 'options.lazy'", ->

      prop = Property { value: 1, lazy: -> 2 }
      prop.define obj = {}, "key"

      expect obj.key
        .toBe 2

  describe "options.needsValue", ->

    it "returns null if 'options.value' is undefined", ->

      expect Property { needsValue: yes }
        .toBe null

  describe "options.frozen", ->

    it "sets 'writable' and 'configurable' to false", ->

      prop = Property { frozen: yes }

      expect prop.writable
        .toBe no

      expect prop.configurable
        .toBe no

  describe "options.writable", ->

    it "defaults to true", ->

      prop = Property()

      expect prop.writable
        .toBe yes

  describe "options.configurable", ->

    it "defaults to true", ->

      prop = Property()

      expect prop.configurable
        .toBe yes

    it "throws an error when attempting to redefine the property", ->

      prop = Property { configurable: no }
      prop.define obj = {}, "key"

      expect -> prop.define obj, "key"
        .toThrowError "Cannot redefine property: key"

  describe "options.enumerable", ->

    it "defaults to undefined", ->

      prop = Property()

      expect prop.hasOwnProperty "enumerable"
        .toBe yes

      expect prop.enumerable
        .toBe undefined

    it "has its value determined by the key if equal to undefined", ->

      prop = Property()
      prop.define obj = {}, "key"
      prop.define obj, "_key"

      expect Object.keys obj
        .toEqual [ "key" ]

  describe "options.get", ->

    it "allows the use of a custom getter", ->

      prop = Property get: -> {}
      prop.define obj = {}, "key"

      expect obj.key
        .not.toBe undefined

      expect obj.key
        .not.toBe obj.key

  describe "options.set", ->

    it "allows the use of a custom setter", ->

      prop = Property
        get: emptyFunction
        set: spy = jasmine.createSpy()

      prop.define obj = {}, "key"

      obj.key = 1

      expect spy.calls.argsFor 0
        .toEqual [ 1 ]

    it "cannot be used without 'options.get'", ->

      expect -> Property { set: emptyFunction }
        .toThrowError "Cannot define 'set' without 'get'!"

  describe "options.didSet", ->

    it "allows you to react to the value after it is set", ->

      prop = Property
        value: 0
        didSet: (newValue) ->
          expect newValue
            .toBe 1

      prop.define obj = {}, "key"

      obj.key = 1

    it "does not care if 'newValue' and 'oldValue' are equal", ->

      spy = jasmine.createSpy()
      prop = Property
        value: 0
        didSet: (newValue, oldValue) ->
          spy newValue, oldValue

      prop.define obj = {}, "key"

      obj.key = 1

      expect spy.calls.argsFor 0
        .toEqual [ 1, 0 ]

      obj.key = 1

      expect spy.calls.argsFor 1
        .toEqual [ 1, 1 ]

    it "does not pass the 'oldValue' if you dont use it", ->

      spy = jasmine.createSpy()
      prop = Property
        value: 0
        didSet: (newValue) ->
          spy newValue

      prop.define obj = {}, "key"

      obj.key = 1

      expect spy.calls.argsFor 0
        .toEqual [ 1 ]

  describe "options.willSet", ->

    it "allows you to change the value before it is set", ->

      prop = Property
        value: 0
        willSet: (newValue) ->
          newValue + 1

      prop.define obj = {}, "key"

      obj.key = 1

      expect obj.key
        .toBe 2

  describe "options.lazy", ->

    it "creates a value that is backed by a LazyVar", ->

      spy = jasmine.createSpy()
      prop = Property lazy: -> spy() or {}
      prop.define obj = {}, "key"

      expect spy.calls.count()
        .toBe 0

      expect obj.key
        .toBe obj.key

      expect spy.calls.count()
        .toBe 1

  describe "options.reactive", ->

    Tracker = require "tracker"

    it "creates a value that is backed by a ReactiveVar", ->

      prop = Property { value: 1, reactive: yes }
      prop.define obj = {}, "key"

      spy = jasmine.createSpy()
      computation = Tracker.autorun => spy obj.key
      computation._sync = yes

      expect spy.calls.argsFor 0
        .toEqual [ 1 ]

      obj.key = 2

      expect spy.calls.argsFor 1
        .toEqual [ 2 ]
