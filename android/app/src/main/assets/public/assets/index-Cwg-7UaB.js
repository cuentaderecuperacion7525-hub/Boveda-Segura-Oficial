import { X as getAugmentedNamespace, Y as commonjsRequire, Z as commonjsGlobal, _ as getDefaultExportFromCjs } from "./index-DTeIpnWK.js";
function _mergeNamespaces(n, m) {
  for (var i = 0; i < m.length; i++) {
    const e = m[i];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k in e) {
        if (k !== "default" && !(k in n)) {
          const d = Object.getOwnPropertyDescriptor(e, k);
          if (d) {
            Object.defineProperty(n, k, d.get ? d : {
              enumerable: true,
              get: () => e[k]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }));
}
var lib$2 = {};
var VERSION = "1.13.8";
var root = typeof self == "object" && self.self === self && self || typeof global == "object" && global.global === global && global || Function("return this")() || {};
var ArrayProto = Array.prototype, ObjProto = Object.prototype;
var SymbolProto = typeof Symbol !== "undefined" ? Symbol.prototype : null;
var push = ArrayProto.push, slice = ArrayProto.slice, toString = ObjProto.toString, hasOwnProperty = ObjProto.hasOwnProperty;
var supportsArrayBuffer = typeof ArrayBuffer !== "undefined", supportsDataView = typeof DataView !== "undefined";
var nativeIsArray = Array.isArray, nativeKeys = Object.keys, nativeCreate = Object.create, nativeIsView = supportsArrayBuffer && ArrayBuffer.isView;
var _isNaN = isNaN, _isFinite = isFinite;
var hasEnumBug = !{ toString: null }.propertyIsEnumerable("toString");
var nonEnumerableProps = [
  "valueOf",
  "isPrototypeOf",
  "toString",
  "propertyIsEnumerable",
  "hasOwnProperty",
  "toLocaleString"
];
var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
function restArguments(func, startIndex) {
  startIndex = startIndex == null ? func.length - 1 : +startIndex;
  return function() {
    var length = Math.max(arguments.length - startIndex, 0), rest2 = Array(length), index2 = 0;
    for (; index2 < length; index2++) {
      rest2[index2] = arguments[index2 + startIndex];
    }
    switch (startIndex) {
      case 0:
        return func.call(this, rest2);
      case 1:
        return func.call(this, arguments[0], rest2);
      case 2:
        return func.call(this, arguments[0], arguments[1], rest2);
    }
    var args = Array(startIndex + 1);
    for (index2 = 0; index2 < startIndex; index2++) {
      args[index2] = arguments[index2];
    }
    args[startIndex] = rest2;
    return func.apply(this, args);
  };
}
function isObject(obj) {
  var type = typeof obj;
  return type === "function" || type === "object" && !!obj;
}
function isNull(obj) {
  return obj === null;
}
function isUndefined(obj) {
  return obj === void 0;
}
function isBoolean(obj) {
  return obj === true || obj === false || toString.call(obj) === "[object Boolean]";
}
function isElement(obj) {
  return !!(obj && obj.nodeType === 1);
}
function tagTester(name) {
  var tag = "[object " + name + "]";
  return function(obj) {
    return toString.call(obj) === tag;
  };
}
const isString = tagTester("String");
const isNumber = tagTester("Number");
const isDate = tagTester("Date");
const isRegExp = tagTester("RegExp");
const isError = tagTester("Error");
const isSymbol = tagTester("Symbol");
const isArrayBuffer = tagTester("ArrayBuffer");
var isFunction = tagTester("Function");
var nodelist = root.document && root.document.childNodes;
if (typeof /./ != "function" && typeof Int8Array != "object" && typeof nodelist != "function") {
  isFunction = function(obj) {
    return typeof obj == "function" || false;
  };
}
const hasObjectTag = tagTester("Object");
var hasDataViewBug = supportsDataView && (!/\[native code\]/.test(String(DataView)) || hasObjectTag(new DataView(new ArrayBuffer(8)))), isIE11 = typeof Map !== "undefined" && hasObjectTag(/* @__PURE__ */ new Map());
var isDataView = tagTester("DataView");
function alternateIsDataView(obj) {
  return obj != null && isFunction(obj.getInt8) && isArrayBuffer(obj.buffer);
}
const isDataView$1 = hasDataViewBug ? alternateIsDataView : isDataView;
const isArray = nativeIsArray || tagTester("Array");
function has$1(obj, key) {
  return obj != null && hasOwnProperty.call(obj, key);
}
var isArguments = tagTester("Arguments");
(function() {
  if (!isArguments(arguments)) {
    isArguments = function(obj) {
      return has$1(obj, "callee");
    };
  }
})();
function isFinite$1(obj) {
  return !isSymbol(obj) && _isFinite(obj) && !isNaN(parseFloat(obj));
}
function isNaN$1(obj) {
  return isNumber(obj) && _isNaN(obj);
}
function constant(value) {
  return function() {
    return value;
  };
}
function createSizePropertyCheck(getSizeProperty) {
  return function(collection) {
    var sizeProperty = getSizeProperty(collection);
    return typeof sizeProperty == "number" && sizeProperty >= 0 && sizeProperty <= MAX_ARRAY_INDEX;
  };
}
function shallowProperty(key) {
  return function(obj) {
    return obj == null ? void 0 : obj[key];
  };
}
const getByteLength = shallowProperty("byteLength");
const isBufferLike = createSizePropertyCheck(getByteLength);
var typedArrayPattern = /\[object ((I|Ui)nt(8|16|32)|Float(32|64)|Uint8Clamped|Big(I|Ui)nt64)Array\]/;
function isTypedArray(obj) {
  return nativeIsView ? nativeIsView(obj) && !isDataView$1(obj) : isBufferLike(obj) && typedArrayPattern.test(toString.call(obj));
}
const isTypedArray$1 = supportsArrayBuffer ? isTypedArray : constant(false);
const getLength = shallowProperty("length");
function emulatedSet(keys2) {
  var hash = {};
  for (var l = keys2.length, i = 0; i < l; ++i) hash[keys2[i]] = true;
  return {
    contains: function(key) {
      return hash[key] === true;
    },
    push: function(key) {
      hash[key] = true;
      return keys2.push(key);
    }
  };
}
function collectNonEnumProps(obj, keys2) {
  keys2 = emulatedSet(keys2);
  var nonEnumIdx = nonEnumerableProps.length;
  var constructor = obj.constructor;
  var proto = isFunction(constructor) && constructor.prototype || ObjProto;
  var prop = "constructor";
  if (has$1(obj, prop) && !keys2.contains(prop)) keys2.push(prop);
  while (nonEnumIdx--) {
    prop = nonEnumerableProps[nonEnumIdx];
    if (prop in obj && obj[prop] !== proto[prop] && !keys2.contains(prop)) {
      keys2.push(prop);
    }
  }
}
function keys(obj) {
  if (!isObject(obj)) return [];
  if (nativeKeys) return nativeKeys(obj);
  var keys2 = [];
  for (var key in obj) if (has$1(obj, key)) keys2.push(key);
  if (hasEnumBug) collectNonEnumProps(obj, keys2);
  return keys2;
}
function isEmpty(obj) {
  if (obj == null) return true;
  var length = getLength(obj);
  if (typeof length == "number" && (isArray(obj) || isString(obj) || isArguments(obj))) return length === 0;
  return getLength(keys(obj)) === 0;
}
function isMatch(object2, attrs) {
  var _keys = keys(attrs), length = _keys.length;
  if (object2 == null) return !length;
  var obj = Object(object2);
  for (var i = 0; i < length; i++) {
    var key = _keys[i];
    if (attrs[key] !== obj[key] || !(key in obj)) return false;
  }
  return true;
}
function _$1(obj) {
  if (obj instanceof _$1) return obj;
  if (!(this instanceof _$1)) return new _$1(obj);
  this._wrapped = obj;
}
_$1.VERSION = VERSION;
_$1.prototype.value = function() {
  return this._wrapped;
};
_$1.prototype.valueOf = _$1.prototype.toJSON = _$1.prototype.value;
_$1.prototype.toString = function() {
  return String(this._wrapped);
};
function toBufferView(bufferSource) {
  return new Uint8Array(
    bufferSource.buffer || bufferSource,
    bufferSource.byteOffset || 0,
    getByteLength(bufferSource)
  );
}
var tagDataView = "[object DataView]";
function isEqual(a, b) {
  var todo = [{ a, b }];
  var aStack = [], bStack = [];
  while (todo.length) {
    var frame = todo.pop();
    if (frame === true) {
      aStack.pop();
      bStack.pop();
      continue;
    }
    a = frame.a;
    b = frame.b;
    if (a === b) {
      if (a !== 0 || 1 / a === 1 / b) continue;
      return false;
    }
    if (a == null || b == null) return false;
    if (a !== a) {
      if (b !== b) continue;
      return false;
    }
    var type = typeof a;
    if (type !== "function" && type !== "object" && typeof b != "object") return false;
    if (a instanceof _$1) a = a._wrapped;
    if (b instanceof _$1) b = b._wrapped;
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    if (hasDataViewBug && className == "[object Object]" && isDataView$1(a)) {
      if (!isDataView$1(b)) return false;
      className = tagDataView;
    }
    switch (className) {
      // These types are compared by value.
      case "[object RegExp]":
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case "[object String]":
        if ("" + a === "" + b) continue;
        return false;
      case "[object Number]":
        todo.push({ a: +a, b: +b });
        continue;
      case "[object Date]":
      case "[object Boolean]":
        if (+a === +b) continue;
        return false;
      case "[object Symbol]":
        if (SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b)) continue;
        return false;
      case "[object ArrayBuffer]":
      case tagDataView:
        todo.push({ a: toBufferView(a), b: toBufferView(b) });
        continue;
    }
    var areArrays = className === "[object Array]";
    if (!areArrays && isTypedArray$1(a)) {
      var byteLength = getByteLength(a);
      if (byteLength !== getByteLength(b)) return false;
      if (a.buffer === b.buffer && a.byteOffset === b.byteOffset) continue;
      areArrays = true;
    }
    if (!areArrays) {
      if (typeof a != "object" || typeof b != "object") return false;
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor && isFunction(bCtor) && bCtor instanceof bCtor) && ("constructor" in a && "constructor" in b)) {
        return false;
      }
    }
    var length = aStack.length;
    while (length--) {
      if (aStack[length] === a) {
        if (bStack[length] === b) break;
        return false;
      }
    }
    if (length >= 0) continue;
    aStack.push(a);
    bStack.push(b);
    todo.push(true);
    if (areArrays) {
      length = a.length;
      if (length !== b.length) return false;
      while (length--) {
        todo.push({ a: a[length], b: b[length] });
      }
    } else {
      var _keys = keys(a), key;
      length = _keys.length;
      if (keys(b).length !== length) return false;
      while (length--) {
        key = _keys[length];
        if (!has$1(b, key)) return false;
        todo.push({ a: a[key], b: b[key] });
      }
    }
  }
  return true;
}
function allKeys(obj) {
  if (!isObject(obj)) return [];
  var keys2 = [];
  for (var key in obj) keys2.push(key);
  if (hasEnumBug) collectNonEnumProps(obj, keys2);
  return keys2;
}
function ie11fingerprint(methods) {
  var length = getLength(methods);
  return function(obj) {
    if (obj == null) return false;
    var keys2 = allKeys(obj);
    if (getLength(keys2)) return false;
    for (var i = 0; i < length; i++) {
      if (!isFunction(obj[methods[i]])) return false;
    }
    return methods !== weakMapMethods || !isFunction(obj[forEachName]);
  };
}
var forEachName = "forEach", hasName = "has", commonInit = ["clear", "delete"], mapTail = ["get", hasName, "set"];
var mapMethods = commonInit.concat(forEachName, mapTail), weakMapMethods = commonInit.concat(mapTail), setMethods = ["add"].concat(commonInit, forEachName, hasName);
const isMap = isIE11 ? ie11fingerprint(mapMethods) : tagTester("Map");
const isWeakMap = isIE11 ? ie11fingerprint(weakMapMethods) : tagTester("WeakMap");
const isSet = isIE11 ? ie11fingerprint(setMethods) : tagTester("Set");
const isWeakSet = tagTester("WeakSet");
function values(obj) {
  var _keys = keys(obj);
  var length = _keys.length;
  var values2 = Array(length);
  for (var i = 0; i < length; i++) {
    values2[i] = obj[_keys[i]];
  }
  return values2;
}
function pairs(obj) {
  var _keys = keys(obj);
  var length = _keys.length;
  var pairs2 = Array(length);
  for (var i = 0; i < length; i++) {
    pairs2[i] = [_keys[i], obj[_keys[i]]];
  }
  return pairs2;
}
function invert(obj) {
  var result2 = {};
  var _keys = keys(obj);
  for (var i = 0, length = _keys.length; i < length; i++) {
    result2[obj[_keys[i]]] = _keys[i];
  }
  return result2;
}
function functions(obj) {
  var names = [];
  for (var key in obj) {
    if (isFunction(obj[key])) names.push(key);
  }
  return names.sort();
}
function createAssigner(keysFunc, defaults2) {
  return function(obj) {
    var length = arguments.length;
    if (defaults2) obj = Object(obj);
    if (length < 2 || obj == null) return obj;
    for (var index2 = 1; index2 < length; index2++) {
      var source = arguments[index2], keys2 = keysFunc(source), l = keys2.length;
      for (var i = 0; i < l; i++) {
        var key = keys2[i];
        if (!defaults2 || obj[key] === void 0) obj[key] = source[key];
      }
    }
    return obj;
  };
}
const extend = createAssigner(allKeys);
const extendOwn = createAssigner(keys);
const defaults = createAssigner(allKeys, true);
function ctor() {
  return function() {
  };
}
function baseCreate(prototype) {
  if (!isObject(prototype)) return {};
  if (nativeCreate) return nativeCreate(prototype);
  var Ctor = ctor();
  Ctor.prototype = prototype;
  var result2 = new Ctor();
  Ctor.prototype = null;
  return result2;
}
function create(prototype, props) {
  var result2 = baseCreate(prototype);
  if (props) extendOwn(result2, props);
  return result2;
}
function clone(obj) {
  if (!isObject(obj)) return obj;
  return isArray(obj) ? obj.slice() : extend({}, obj);
}
function tap(obj, interceptor) {
  interceptor(obj);
  return obj;
}
function toPath$1(path) {
  return isArray(path) ? path : [path];
}
_$1.toPath = toPath$1;
function toPath(path) {
  return _$1.toPath(path);
}
function deepGet(obj, path) {
  var length = path.length;
  for (var i = 0; i < length; i++) {
    if (obj == null) return void 0;
    obj = obj[path[i]];
  }
  return length ? obj : void 0;
}
function get(object2, path, defaultValue) {
  var value = deepGet(object2, toPath(path));
  return isUndefined(value) ? defaultValue : value;
}
function has(obj, path) {
  path = toPath(path);
  var length = path.length;
  for (var i = 0; i < length; i++) {
    var key = path[i];
    if (!has$1(obj, key)) return false;
    obj = obj[key];
  }
  return !!length;
}
function identity(value) {
  return value;
}
function matcher(attrs) {
  attrs = extendOwn({}, attrs);
  return function(obj) {
    return isMatch(obj, attrs);
  };
}
function property(path) {
  path = toPath(path);
  return function(obj) {
    return deepGet(obj, path);
  };
}
function optimizeCb(func, context, argCount) {
  if (context === void 0) return func;
  switch (argCount == null ? 3 : argCount) {
    case 1:
      return function(value) {
        return func.call(context, value);
      };
    // The 2-argument case is omitted because we’re not using it.
    case 3:
      return function(value, index2, collection) {
        return func.call(context, value, index2, collection);
      };
    case 4:
      return function(accumulator, value, index2, collection) {
        return func.call(context, accumulator, value, index2, collection);
      };
  }
  return function() {
    return func.apply(context, arguments);
  };
}
function baseIteratee(value, context, argCount) {
  if (value == null) return identity;
  if (isFunction(value)) return optimizeCb(value, context, argCount);
  if (isObject(value) && !isArray(value)) return matcher(value);
  return property(value);
}
function iteratee(value, context) {
  return baseIteratee(value, context, Infinity);
}
_$1.iteratee = iteratee;
function cb(value, context, argCount) {
  if (_$1.iteratee !== iteratee) return _$1.iteratee(value, context);
  return baseIteratee(value, context, argCount);
}
function mapObject(obj, iteratee2, context) {
  iteratee2 = cb(iteratee2, context);
  var _keys = keys(obj), length = _keys.length, results2 = {};
  for (var index2 = 0; index2 < length; index2++) {
    var currentKey = _keys[index2];
    results2[currentKey] = iteratee2(obj[currentKey], currentKey, obj);
  }
  return results2;
}
function noop() {
}
function propertyOf(obj) {
  if (obj == null) return noop;
  return function(path) {
    return get(obj, path);
  };
}
function times(n, iteratee2, context) {
  var accum = Array(Math.max(0, n));
  iteratee2 = optimizeCb(iteratee2, context, 1);
  for (var i = 0; i < n; i++) accum[i] = iteratee2(i);
  return accum;
}
function random(min2, max2) {
  if (max2 == null) {
    max2 = min2;
    min2 = 0;
  }
  return min2 + Math.floor(Math.random() * (max2 - min2 + 1));
}
const now = Date.now || function() {
  return (/* @__PURE__ */ new Date()).getTime();
};
function createEscaper(map2) {
  var escaper = function(match) {
    return map2[match];
  };
  var source = "(?:" + keys(map2).join("|") + ")";
  var testRegexp = RegExp(source);
  var replaceRegexp = RegExp(source, "g");
  return function(string) {
    string = string == null ? "" : "" + string;
    return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
  };
}
const escapeMap = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;"
};
const escape = createEscaper(escapeMap);
const unescapeMap = invert(escapeMap);
const unescape = createEscaper(unescapeMap);
const templateSettings = _$1.templateSettings = {
  evaluate: /<%([\s\S]+?)%>/g,
  interpolate: /<%=([\s\S]+?)%>/g,
  escape: /<%-([\s\S]+?)%>/g
};
var noMatch = /(.)^/;
var escapes = {
  "'": "'",
  "\\": "\\",
  "\r": "r",
  "\n": "n",
  "\u2028": "u2028",
  "\u2029": "u2029"
};
var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;
function escapeChar(match) {
  return "\\" + escapes[match];
}
var bareIdentifier = /^\s*(\w|\$)+\s*$/;
function template(text, settings, oldSettings) {
  if (!settings && oldSettings) settings = oldSettings;
  settings = defaults({}, settings, _$1.templateSettings);
  var matcher2 = RegExp([
    (settings.escape || noMatch).source,
    (settings.interpolate || noMatch).source,
    (settings.evaluate || noMatch).source
  ].join("|") + "|$", "g");
  var index2 = 0;
  var source = "__p+='";
  text.replace(matcher2, function(match, escape2, interpolate, evaluate, offset) {
    source += text.slice(index2, offset).replace(escapeRegExp, escapeChar);
    index2 = offset + match.length;
    if (escape2) {
      source += "'+\n((__t=(" + escape2 + "))==null?'':_.escape(__t))+\n'";
    } else if (interpolate) {
      source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
    } else if (evaluate) {
      source += "';\n" + evaluate + "\n__p+='";
    }
    return match;
  });
  source += "';\n";
  var argument = settings.variable;
  if (argument) {
    if (!bareIdentifier.test(argument)) throw new Error(
      "variable is not a bare identifier: " + argument
    );
  } else {
    source = "with(obj||{}){\n" + source + "}\n";
    argument = "obj";
  }
  source = "var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n" + source + "return __p;\n";
  var render;
  try {
    render = new Function(argument, "_", source);
  } catch (e) {
    e.source = source;
    throw e;
  }
  var template2 = function(data) {
    return render.call(this, data, _$1);
  };
  template2.source = "function(" + argument + "){\n" + source + "}";
  return template2;
}
function result(obj, path, fallback) {
  path = toPath(path);
  var length = path.length;
  if (!length) {
    return isFunction(fallback) ? fallback.call(obj) : fallback;
  }
  for (var i = 0; i < length; i++) {
    var prop = obj == null ? void 0 : obj[path[i]];
    if (prop === void 0) {
      prop = fallback;
      i = length;
    }
    obj = isFunction(prop) ? prop.call(obj) : prop;
  }
  return obj;
}
var idCounter = 0;
function uniqueId(prefix) {
  var id = ++idCounter + "";
  return prefix ? prefix + id : id;
}
function chain(obj) {
  var instance = _$1(obj);
  instance._chain = true;
  return instance;
}
function executeBound(sourceFunc, boundFunc, context, callingContext, args) {
  if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
  var self2 = baseCreate(sourceFunc.prototype);
  var result2 = sourceFunc.apply(self2, args);
  if (isObject(result2)) return result2;
  return self2;
}
var partial = restArguments(function(func, boundArgs) {
  var placeholder = partial.placeholder;
  var bound = function() {
    var position = 0, length = boundArgs.length;
    var args = Array(length);
    for (var i = 0; i < length; i++) {
      args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
    }
    while (position < arguments.length) args.push(arguments[position++]);
    return executeBound(func, bound, this, this, args);
  };
  return bound;
});
partial.placeholder = _$1;
const bind = restArguments(function(func, context, args) {
  if (!isFunction(func)) throw new TypeError("Bind must be called on a function");
  var bound = restArguments(function(callArgs) {
    return executeBound(func, bound, context, this, args.concat(callArgs));
  });
  return bound;
});
const isArrayLike = createSizePropertyCheck(getLength);
function flatten$1(input, depth, strict) {
  if (!depth && depth !== 0) depth = Infinity;
  var output = [], idx = 0, i = 0, length = getLength(input) || 0, stack = [];
  while (true) {
    if (i >= length) {
      if (!stack.length) break;
      var frame = stack.pop();
      i = frame.i;
      input = frame.v;
      length = getLength(input);
      continue;
    }
    var value = input[i++];
    if (stack.length >= depth) {
      output[idx++] = value;
    } else if (isArrayLike(value) && (isArray(value) || isArguments(value))) {
      stack.push({ i, v: input });
      i = 0;
      input = value;
      length = getLength(input);
    } else if (!strict) {
      output[idx++] = value;
    }
  }
  return output;
}
const bindAll = restArguments(function(obj, keys2) {
  keys2 = flatten$1(keys2, false, false);
  var index2 = keys2.length;
  if (index2 < 1) throw new Error("bindAll must be passed function names");
  while (index2--) {
    var key = keys2[index2];
    obj[key] = bind(obj[key], obj);
  }
  return obj;
});
function memoize(func, hasher) {
  var memoize2 = function(key) {
    var cache = memoize2.cache;
    var address = "" + (hasher ? hasher.apply(this, arguments) : key);
    if (!has$1(cache, address)) cache[address] = func.apply(this, arguments);
    return cache[address];
  };
  memoize2.cache = {};
  return memoize2;
}
const delay = restArguments(function(func, wait, args) {
  return setTimeout(function() {
    return func.apply(null, args);
  }, wait);
});
const defer = partial(delay, _$1, 1);
function throttle(func, wait, options) {
  var timeout, context, args, result2;
  var previous = 0;
  if (!options) options = {};
  var later = function() {
    previous = options.leading === false ? 0 : now();
    timeout = null;
    result2 = func.apply(context, args);
    if (!timeout) context = args = null;
  };
  var throttled = function() {
    var _now = now();
    if (!previous && options.leading === false) previous = _now;
    var remaining = wait - (_now - previous);
    context = this;
    args = arguments;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = _now;
      result2 = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result2;
  };
  throttled.cancel = function() {
    clearTimeout(timeout);
    previous = 0;
    timeout = context = args = null;
  };
  return throttled;
}
function debounce(func, wait, immediate) {
  var timeout, previous, args, result2, context;
  var later = function() {
    var passed = now() - previous;
    if (wait > passed) {
      timeout = setTimeout(later, wait - passed);
    } else {
      timeout = null;
      if (!immediate) result2 = func.apply(context, args);
      if (!timeout) args = context = null;
    }
  };
  var debounced = restArguments(function(_args) {
    context = this;
    args = _args;
    previous = now();
    if (!timeout) {
      timeout = setTimeout(later, wait);
      if (immediate) result2 = func.apply(context, args);
    }
    return result2;
  });
  debounced.cancel = function() {
    clearTimeout(timeout);
    timeout = args = context = null;
  };
  return debounced;
}
function wrap(func, wrapper) {
  return partial(wrapper, func);
}
function negate(predicate) {
  return function() {
    return !predicate.apply(this, arguments);
  };
}
function compose() {
  var args = arguments;
  var start = args.length - 1;
  return function() {
    var i = start;
    var result2 = args[start].apply(this, arguments);
    while (i--) result2 = args[i].call(this, result2);
    return result2;
  };
}
function after(times2, func) {
  return function() {
    if (--times2 < 1) {
      return func.apply(this, arguments);
    }
  };
}
function before(times2, func) {
  var memo;
  return function() {
    if (--times2 > 0) {
      memo = func.apply(this, arguments);
    }
    if (times2 <= 1) func = null;
    return memo;
  };
}
const once = partial(before, 2);
function findKey(obj, predicate, context) {
  predicate = cb(predicate, context);
  var _keys = keys(obj), key;
  for (var i = 0, length = _keys.length; i < length; i++) {
    key = _keys[i];
    if (predicate(obj[key], key, obj)) return key;
  }
}
function createPredicateIndexFinder(dir) {
  return function(array, predicate, context) {
    predicate = cb(predicate, context);
    var length = getLength(array);
    var index2 = dir > 0 ? 0 : length - 1;
    for (; index2 >= 0 && index2 < length; index2 += dir) {
      if (predicate(array[index2], index2, array)) return index2;
    }
    return -1;
  };
}
const findIndex = createPredicateIndexFinder(1);
const findLastIndex = createPredicateIndexFinder(-1);
function sortedIndex(array, obj, iteratee2, context) {
  iteratee2 = cb(iteratee2, context, 1);
  var value = iteratee2(obj);
  var low = 0, high = getLength(array);
  while (low < high) {
    var mid = Math.floor((low + high) / 2);
    if (iteratee2(array[mid]) < value) low = mid + 1;
    else high = mid;
  }
  return low;
}
function createIndexFinder(dir, predicateFind, sortedIndex2) {
  return function(array, item, idx) {
    var i = 0, length = getLength(array);
    if (typeof idx == "number") {
      if (dir > 0) {
        i = idx >= 0 ? idx : Math.max(idx + length, i);
      } else {
        length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
      }
    } else if (sortedIndex2 && idx && length) {
      idx = sortedIndex2(array, item);
      return array[idx] === item ? idx : -1;
    }
    if (item !== item) {
      idx = predicateFind(slice.call(array, i, length), isNaN$1);
      return idx >= 0 ? idx + i : -1;
    }
    for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
      if (array[idx] === item) return idx;
    }
    return -1;
  };
}
const indexOf = createIndexFinder(1, findIndex, sortedIndex);
const lastIndexOf = createIndexFinder(-1, findLastIndex);
function find(obj, predicate, context) {
  var keyFinder = isArrayLike(obj) ? findIndex : findKey;
  var key = keyFinder(obj, predicate, context);
  if (key !== void 0 && key !== -1) return obj[key];
}
function findWhere(obj, attrs) {
  return find(obj, matcher(attrs));
}
function each(obj, iteratee2, context) {
  iteratee2 = optimizeCb(iteratee2, context);
  var i, length;
  if (isArrayLike(obj)) {
    for (i = 0, length = obj.length; i < length; i++) {
      iteratee2(obj[i], i, obj);
    }
  } else {
    var _keys = keys(obj);
    for (i = 0, length = _keys.length; i < length; i++) {
      iteratee2(obj[_keys[i]], _keys[i], obj);
    }
  }
  return obj;
}
function map(obj, iteratee2, context) {
  iteratee2 = cb(iteratee2, context);
  var _keys = !isArrayLike(obj) && keys(obj), length = (_keys || obj).length, results2 = Array(length);
  for (var index2 = 0; index2 < length; index2++) {
    var currentKey = _keys ? _keys[index2] : index2;
    results2[index2] = iteratee2(obj[currentKey], currentKey, obj);
  }
  return results2;
}
function createReduce(dir) {
  var reducer = function(obj, iteratee2, memo, initial2) {
    var _keys = !isArrayLike(obj) && keys(obj), length = (_keys || obj).length, index2 = dir > 0 ? 0 : length - 1;
    if (!initial2) {
      memo = obj[_keys ? _keys[index2] : index2];
      index2 += dir;
    }
    for (; index2 >= 0 && index2 < length; index2 += dir) {
      var currentKey = _keys ? _keys[index2] : index2;
      memo = iteratee2(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };
  return function(obj, iteratee2, memo, context) {
    var initial2 = arguments.length >= 3;
    return reducer(obj, optimizeCb(iteratee2, context, 4), memo, initial2);
  };
}
const reduce = createReduce(1);
const reduceRight = createReduce(-1);
function filter(obj, predicate, context) {
  var results2 = [];
  predicate = cb(predicate, context);
  each(obj, function(value, index2, list) {
    if (predicate(value, index2, list)) results2.push(value);
  });
  return results2;
}
function reject(obj, predicate, context) {
  return filter(obj, negate(cb(predicate)), context);
}
function every(obj, predicate, context) {
  predicate = cb(predicate, context);
  var _keys = !isArrayLike(obj) && keys(obj), length = (_keys || obj).length;
  for (var index2 = 0; index2 < length; index2++) {
    var currentKey = _keys ? _keys[index2] : index2;
    if (!predicate(obj[currentKey], currentKey, obj)) return false;
  }
  return true;
}
function some(obj, predicate, context) {
  predicate = cb(predicate, context);
  var _keys = !isArrayLike(obj) && keys(obj), length = (_keys || obj).length;
  for (var index2 = 0; index2 < length; index2++) {
    var currentKey = _keys ? _keys[index2] : index2;
    if (predicate(obj[currentKey], currentKey, obj)) return true;
  }
  return false;
}
function contains(obj, item, fromIndex, guard) {
  if (!isArrayLike(obj)) obj = values(obj);
  if (typeof fromIndex != "number" || guard) fromIndex = 0;
  return indexOf(obj, item, fromIndex) >= 0;
}
const invoke = restArguments(function(obj, path, args) {
  var contextPath, func;
  if (isFunction(path)) {
    func = path;
  } else {
    path = toPath(path);
    contextPath = path.slice(0, -1);
    path = path[path.length - 1];
  }
  return map(obj, function(context) {
    var method = func;
    if (!method) {
      if (contextPath && contextPath.length) {
        context = deepGet(context, contextPath);
      }
      if (context == null) return void 0;
      method = context[path];
    }
    return method == null ? method : method.apply(context, args);
  });
});
function pluck(obj, key) {
  return map(obj, property(key));
}
function where(obj, attrs) {
  return filter(obj, matcher(attrs));
}
function max(obj, iteratee2, context) {
  var result2 = -Infinity, lastComputed = -Infinity, value, computed;
  if (iteratee2 == null || typeof iteratee2 == "number" && typeof obj[0] != "object" && obj != null) {
    obj = isArrayLike(obj) ? obj : values(obj);
    for (var i = 0, length = obj.length; i < length; i++) {
      value = obj[i];
      if (value != null && value > result2) {
        result2 = value;
      }
    }
  } else {
    iteratee2 = cb(iteratee2, context);
    each(obj, function(v, index2, list) {
      computed = iteratee2(v, index2, list);
      if (computed > lastComputed || computed === -Infinity && result2 === -Infinity) {
        result2 = v;
        lastComputed = computed;
      }
    });
  }
  return result2;
}
function min(obj, iteratee2, context) {
  var result2 = Infinity, lastComputed = Infinity, value, computed;
  if (iteratee2 == null || typeof iteratee2 == "number" && typeof obj[0] != "object" && obj != null) {
    obj = isArrayLike(obj) ? obj : values(obj);
    for (var i = 0, length = obj.length; i < length; i++) {
      value = obj[i];
      if (value != null && value < result2) {
        result2 = value;
      }
    }
  } else {
    iteratee2 = cb(iteratee2, context);
    each(obj, function(v, index2, list) {
      computed = iteratee2(v, index2, list);
      if (computed < lastComputed || computed === Infinity && result2 === Infinity) {
        result2 = v;
        lastComputed = computed;
      }
    });
  }
  return result2;
}
var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
function toArray(obj) {
  if (!obj) return [];
  if (isArray(obj)) return slice.call(obj);
  if (isString(obj)) {
    return obj.match(reStrSymbol);
  }
  if (isArrayLike(obj)) return map(obj, identity);
  return values(obj);
}
function sample(obj, n, guard) {
  if (n == null || guard) {
    if (!isArrayLike(obj)) obj = values(obj);
    return obj[random(obj.length - 1)];
  }
  var sample2 = toArray(obj);
  var length = getLength(sample2);
  n = Math.max(Math.min(n, length), 0);
  var last2 = length - 1;
  for (var index2 = 0; index2 < n; index2++) {
    var rand = random(index2, last2);
    var temp = sample2[index2];
    sample2[index2] = sample2[rand];
    sample2[rand] = temp;
  }
  return sample2.slice(0, n);
}
function shuffle(obj) {
  return sample(obj, Infinity);
}
function sortBy(obj, iteratee2, context) {
  var index2 = 0;
  iteratee2 = cb(iteratee2, context);
  return pluck(map(obj, function(value, key, list) {
    return {
      value,
      index: index2++,
      criteria: iteratee2(value, key, list)
    };
  }).sort(function(left, right) {
    var a = left.criteria;
    var b = right.criteria;
    if (a !== b) {
      if (a > b || a === void 0) return 1;
      if (a < b || b === void 0) return -1;
    }
    return left.index - right.index;
  }), "value");
}
function group(behavior, partition2) {
  return function(obj, iteratee2, context) {
    var result2 = partition2 ? [[], []] : {};
    iteratee2 = cb(iteratee2, context);
    each(obj, function(value, index2) {
      var key = iteratee2(value, index2, obj);
      behavior(result2, value, key);
    });
    return result2;
  };
}
const groupBy = group(function(result2, value, key) {
  if (has$1(result2, key)) result2[key].push(value);
  else result2[key] = [value];
});
const indexBy = group(function(result2, value, key) {
  result2[key] = value;
});
const countBy = group(function(result2, value, key) {
  if (has$1(result2, key)) result2[key]++;
  else result2[key] = 1;
});
const partition = group(function(result2, value, pass) {
  result2[pass ? 0 : 1].push(value);
}, true);
function size(obj) {
  if (obj == null) return 0;
  return isArrayLike(obj) ? obj.length : keys(obj).length;
}
function keyInObj(value, key, obj) {
  return key in obj;
}
const pick = restArguments(function(obj, keys2) {
  var result2 = {}, iteratee2 = keys2[0];
  if (obj == null) return result2;
  if (isFunction(iteratee2)) {
    if (keys2.length > 1) iteratee2 = optimizeCb(iteratee2, keys2[1]);
    keys2 = allKeys(obj);
  } else {
    iteratee2 = keyInObj;
    keys2 = flatten$1(keys2, false, false);
    obj = Object(obj);
  }
  for (var i = 0, length = keys2.length; i < length; i++) {
    var key = keys2[i];
    var value = obj[key];
    if (iteratee2(value, key, obj)) result2[key] = value;
  }
  return result2;
});
const omit = restArguments(function(obj, keys2) {
  var iteratee2 = keys2[0], context;
  if (isFunction(iteratee2)) {
    iteratee2 = negate(iteratee2);
    if (keys2.length > 1) context = keys2[1];
  } else {
    keys2 = map(flatten$1(keys2, false, false), String);
    iteratee2 = function(value, key) {
      return !contains(keys2, key);
    };
  }
  return pick(obj, iteratee2, context);
});
function initial(array, n, guard) {
  return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
}
function first(array, n, guard) {
  if (array == null || array.length < 1) return n == null || guard ? void 0 : [];
  if (n == null || guard) return array[0];
  return initial(array, array.length - n);
}
function rest(array, n, guard) {
  return slice.call(array, n == null || guard ? 1 : n);
}
function last(array, n, guard) {
  if (array == null || array.length < 1) return n == null || guard ? void 0 : [];
  if (n == null || guard) return array[array.length - 1];
  return rest(array, Math.max(0, array.length - n));
}
function compact(array) {
  return filter(array, Boolean);
}
function flatten(array, depth) {
  return flatten$1(array, depth, false);
}
const difference = restArguments(function(array, rest2) {
  rest2 = flatten$1(rest2, true, true);
  return filter(array, function(value) {
    return !contains(rest2, value);
  });
});
const without = restArguments(function(array, otherArrays) {
  return difference(array, otherArrays);
});
function uniq(array, isSorted, iteratee2, context) {
  if (!isBoolean(isSorted)) {
    context = iteratee2;
    iteratee2 = isSorted;
    isSorted = false;
  }
  if (iteratee2 != null) iteratee2 = cb(iteratee2, context);
  var result2 = [];
  var seen = [];
  for (var i = 0, length = getLength(array); i < length; i++) {
    var value = array[i], computed = iteratee2 ? iteratee2(value, i, array) : value;
    if (isSorted && !iteratee2) {
      if (!i || seen !== computed) result2.push(value);
      seen = computed;
    } else if (iteratee2) {
      if (!contains(seen, computed)) {
        seen.push(computed);
        result2.push(value);
      }
    } else if (!contains(result2, value)) {
      result2.push(value);
    }
  }
  return result2;
}
const union = restArguments(function(arrays) {
  return uniq(flatten$1(arrays, true, true));
});
function intersection(array) {
  var result2 = [];
  var argsLength = arguments.length;
  for (var i = 0, length = getLength(array); i < length; i++) {
    var item = array[i];
    if (contains(result2, item)) continue;
    var j;
    for (j = 1; j < argsLength; j++) {
      if (!contains(arguments[j], item)) break;
    }
    if (j === argsLength) result2.push(item);
  }
  return result2;
}
function unzip$1(array) {
  var length = array && max(array, getLength).length || 0;
  var result2 = Array(length);
  for (var index2 = 0; index2 < length; index2++) {
    result2[index2] = pluck(array, index2);
  }
  return result2;
}
const zip = restArguments(unzip$1);
function object(list, values2) {
  var result2 = {};
  for (var i = 0, length = getLength(list); i < length; i++) {
    if (values2) {
      result2[list[i]] = values2[i];
    } else {
      result2[list[i][0]] = list[i][1];
    }
  }
  return result2;
}
function range(start, stop, step) {
  if (stop == null) {
    stop = start || 0;
    start = 0;
  }
  if (!step) {
    step = stop < start ? -1 : 1;
  }
  var length = Math.max(Math.ceil((stop - start) / step), 0);
  var range2 = Array(length);
  for (var idx = 0; idx < length; idx++, start += step) {
    range2[idx] = start;
  }
  return range2;
}
function chunk(array, count) {
  if (count == null || count < 1) return [];
  var result2 = [];
  var i = 0, length = array.length;
  while (i < length) {
    result2.push(slice.call(array, i, i += count));
  }
  return result2;
}
function chainResult(instance, obj) {
  return instance._chain ? _$1(obj).chain() : obj;
}
function mixin(obj) {
  each(functions(obj), function(name) {
    var func = _$1[name] = obj[name];
    _$1.prototype[name] = function() {
      var args = [this._wrapped];
      push.apply(args, arguments);
      return chainResult(this, func.apply(_$1, args));
    };
  });
  return _$1;
}
each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(name) {
  var method = ArrayProto[name];
  _$1.prototype[name] = function() {
    var obj = this._wrapped;
    if (obj != null) {
      method.apply(obj, arguments);
      if ((name === "shift" || name === "splice") && obj.length === 0) {
        delete obj[0];
      }
    }
    return chainResult(this, obj);
  };
});
each(["concat", "join", "slice"], function(name) {
  var method = ArrayProto[name];
  _$1.prototype[name] = function() {
    var obj = this._wrapped;
    if (obj != null) obj = method.apply(obj, arguments);
    return chainResult(this, obj);
  };
});
const allExports = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VERSION,
  after,
  all: every,
  allKeys,
  any: some,
  assign: extendOwn,
  before,
  bind,
  bindAll,
  chain,
  chunk,
  clone,
  collect: map,
  compact,
  compose,
  constant,
  contains,
  countBy,
  create,
  debounce,
  default: _$1,
  defaults,
  defer,
  delay,
  detect: find,
  difference,
  drop: rest,
  each,
  escape,
  every,
  extend,
  extendOwn,
  filter,
  find,
  findIndex,
  findKey,
  findLastIndex,
  findWhere,
  first,
  flatten,
  foldl: reduce,
  foldr: reduceRight,
  forEach: each,
  functions,
  get,
  groupBy,
  has,
  head: first,
  identity,
  include: contains,
  includes: contains,
  indexBy,
  indexOf,
  initial,
  inject: reduce,
  intersection,
  invert,
  invoke,
  isArguments,
  isArray,
  isArrayBuffer,
  isBoolean,
  isDataView: isDataView$1,
  isDate,
  isElement,
  isEmpty,
  isEqual,
  isError,
  isFinite: isFinite$1,
  isFunction,
  isMap,
  isMatch,
  isNaN: isNaN$1,
  isNull,
  isNumber,
  isObject,
  isRegExp,
  isSet,
  isString,
  isSymbol,
  isTypedArray: isTypedArray$1,
  isUndefined,
  isWeakMap,
  isWeakSet,
  iteratee,
  keys,
  last,
  lastIndexOf,
  map,
  mapObject,
  matcher,
  matches: matcher,
  max,
  memoize,
  methods: functions,
  min,
  mixin,
  negate,
  noop,
  now,
  object,
  omit,
  once,
  pairs,
  partial,
  partition,
  pick,
  pluck,
  property,
  propertyOf,
  random,
  range,
  reduce,
  reduceRight,
  reject,
  rest,
  restArguments,
  result,
  sample,
  select: filter,
  shuffle,
  size,
  some,
  sortBy,
  sortedIndex,
  tail: rest,
  take: first,
  tap,
  template,
  templateSettings,
  throttle,
  times,
  toArray,
  toPath: toPath$1,
  transpose: unzip$1,
  unescape,
  union,
  uniq,
  unique: uniq,
  uniqueId,
  unzip: unzip$1,
  values,
  where,
  without,
  wrap,
  zip
}, Symbol.toStringTag, { value: "Module" }));
var _ = mixin(allExports);
_._ = _;
const indexAll = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  VERSION,
  after,
  all: every,
  allKeys,
  any: some,
  assign: extendOwn,
  before,
  bind,
  bindAll,
  chain,
  chunk,
  clone,
  collect: map,
  compact,
  compose,
  constant,
  contains,
  countBy,
  create,
  debounce,
  default: _,
  defaults,
  defer,
  delay,
  detect: find,
  difference,
  drop: rest,
  each,
  escape,
  every,
  extend,
  extendOwn,
  filter,
  find,
  findIndex,
  findKey,
  findLastIndex,
  findWhere,
  first,
  flatten,
  foldl: reduce,
  foldr: reduceRight,
  forEach: each,
  functions,
  get,
  groupBy,
  has,
  head: first,
  identity,
  include: contains,
  includes: contains,
  indexBy,
  indexOf,
  initial,
  inject: reduce,
  intersection,
  invert,
  invoke,
  isArguments,
  isArray,
  isArrayBuffer,
  isBoolean,
  isDataView: isDataView$1,
  isDate,
  isElement,
  isEmpty,
  isEqual,
  isError,
  isFinite: isFinite$1,
  isFunction,
  isMap,
  isMatch,
  isNaN: isNaN$1,
  isNull,
  isNumber,
  isObject,
  isRegExp,
  isSet,
  isString,
  isSymbol,
  isTypedArray: isTypedArray$1,
  isUndefined,
  isWeakMap,
  isWeakSet,
  iteratee,
  keys,
  last,
  lastIndexOf,
  map,
  mapObject,
  matcher,
  matches: matcher,
  max,
  memoize,
  methods: functions,
  min,
  mixin,
  negate,
  noop,
  now,
  object,
  omit,
  once,
  pairs,
  partial,
  partition,
  pick,
  pluck,
  property,
  propertyOf,
  random,
  range,
  reduce,
  reduceRight,
  reject,
  rest,
  restArguments,
  result,
  sample,
  select: filter,
  shuffle,
  size,
  some,
  sortBy,
  sortedIndex,
  tail: rest,
  take: first,
  tap,
  template,
  templateSettings,
  throttle,
  times,
  toArray,
  toPath: toPath$1,
  transpose: unzip$1,
  unescape,
  union,
  uniq,
  unique: uniq,
  uniqueId,
  unzip: unzip$1,
  values,
  where,
  without,
  wrap,
  zip
}, Symbol.toStringTag, { value: "Module" }));
const require$$0 = /* @__PURE__ */ getAugmentedNamespace(indexAll);
var docxReader = {};
var promises = {};
var hasRequiredPromises;
function requirePromises() {
  if (hasRequiredPromises) return promises;
  hasRequiredPromises = 1;
  var _2 = require$$0;
  promises.defer = defer2;
  promises.Promise = Promise;
  promises.resolve = Promise.resolve.bind(Promise);
  promises.reject = Promise.reject.bind(Promise);
  promises.forEachSeries = function(array, func) {
    var arrayIndex = 0;
    var deferred = defer2();
    var next = function() {
      if (arrayIndex < array.length) {
        var element = array[arrayIndex];
        arrayIndex++;
        func(element).then(next, deferred.reject);
      } else {
        deferred.resolve();
      }
    };
    next();
    return deferred.promise;
  };
  var props = promises.props = function(obj) {
    var keys2 = Object.keys(obj);
    var values2 = Object.values(obj);
    var result2 = Promise.all(values2).then(function(resolvedValues) {
      var resolvedObj = {};
      for (var index2 = 0; index2 < keys2.length; index2++) {
        resolvedObj[keys2[index2]] = resolvedValues[index2];
      }
      return resolvedObj;
    });
    return addAlsoToPromise(result2);
  };
  var alsoMethod = function(func) {
    var result2 = this.then(function(value) {
      var returnValue = _2.extend({}, value, func(value));
      return props(returnValue);
    });
    return addAlsoToPromise(result2);
  };
  function addAlsoToPromise(promise) {
    promise.also = alsoMethod;
    return promise;
  }
  promises.try = function(func) {
    try {
      return Promise.resolve(func());
    } catch (error) {
      return Promise.reject(error);
    }
  };
  function defer2() {
    var resolve;
    var reject2;
    var promise = new Promise(function(resolveArg, rejectArg) {
      resolve = resolveArg;
      reject2 = rejectArg;
    });
    return {
      resolve,
      reject: reject2,
      promise
    };
  }
  function ExternalPromise(executor) {
    var promise = new Promise(executor);
    promise.__proto__ = ExternalPromise.prototype;
    return promise;
  }
  ExternalPromise.__proto__ = Promise;
  ExternalPromise.prototype.__proto__ = Promise.prototype;
  ExternalPromise.prototype.done = function(resolve, reject2) {
    return this.then(resolve, reject2).catch(function(error) {
      if (isNode()) {
        var stack = error instanceof Error ? error.stack : error;
        process.stderr.write("Fatal " + stack + "\n");
        process.exit(2);
      } else {
        setTimeout(function() {
          throw error;
        }, 0);
      }
    });
  };
  function toExternalPromise(promise) {
    return ExternalPromise.resolve(promise);
  }
  promises.toExternalPromise = toExternalPromise;
  function isNode() {
    if (typeof process === "undefined") {
      return false;
    }
    return {}.toString.call(process).toLowerCase() === "[object process]";
  }
  return promises;
}
var documents = {};
var hasRequiredDocuments;
function requireDocuments() {
  if (hasRequiredDocuments) return documents;
  hasRequiredDocuments = 1;
  var _2 = require$$0;
  var types = documents.types = {
    document: "document",
    paragraph: "paragraph",
    run: "run",
    text: "text",
    tab: "tab",
    checkbox: "checkbox",
    hyperlink: "hyperlink",
    noteReference: "noteReference",
    image: "image",
    note: "note",
    commentReference: "commentReference",
    comment: "comment",
    table: "table",
    tableRow: "tableRow",
    tableCell: "tableCell",
    "break": "break",
    bookmarkStart: "bookmarkStart"
  };
  function Document(children, options) {
    options = options || {};
    return {
      type: types.document,
      children,
      notes: options.notes || new Notes({}),
      comments: options.comments || []
    };
  }
  function Paragraph(children, properties) {
    properties = properties || {};
    var indent = properties.indent || {};
    return {
      type: types.paragraph,
      children,
      styleId: properties.styleId || null,
      styleName: properties.styleName || null,
      numbering: properties.numbering || null,
      alignment: properties.alignment || null,
      indent: {
        start: indent.start || null,
        end: indent.end || null,
        firstLine: indent.firstLine || null,
        hanging: indent.hanging || null
      }
    };
  }
  function Run(children, properties) {
    properties = properties || {};
    return {
      type: types.run,
      children,
      styleId: properties.styleId || null,
      styleName: properties.styleName || null,
      isBold: !!properties.isBold,
      isUnderline: !!properties.isUnderline,
      isItalic: !!properties.isItalic,
      isStrikethrough: !!properties.isStrikethrough,
      isAllCaps: !!properties.isAllCaps,
      isSmallCaps: !!properties.isSmallCaps,
      verticalAlignment: properties.verticalAlignment || verticalAlignment.baseline,
      font: properties.font || null,
      fontSize: properties.fontSize || null,
      highlight: properties.highlight || null
    };
  }
  var verticalAlignment = {
    baseline: "baseline",
    superscript: "superscript",
    subscript: "subscript"
  };
  function Text(value) {
    return {
      type: types.text,
      value
    };
  }
  function Tab() {
    return {
      type: types.tab
    };
  }
  function Checkbox(options) {
    return {
      type: types.checkbox,
      checked: options.checked
    };
  }
  function Hyperlink(children, options) {
    return {
      type: types.hyperlink,
      children,
      href: options.href,
      anchor: options.anchor,
      targetFrame: options.targetFrame
    };
  }
  function NoteReference(options) {
    return {
      type: types.noteReference,
      noteType: options.noteType,
      noteId: options.noteId
    };
  }
  function Notes(notes) {
    this._notes = _2.indexBy(notes, function(note) {
      return noteKey(note.noteType, note.noteId);
    });
  }
  Notes.prototype.resolve = function(reference) {
    return this.findNoteByKey(noteKey(reference.noteType, reference.noteId));
  };
  Notes.prototype.findNoteByKey = function(key) {
    return this._notes[key] || null;
  };
  function Note(options) {
    return {
      type: types.note,
      noteType: options.noteType,
      noteId: options.noteId,
      body: options.body
    };
  }
  function commentReference(options) {
    return {
      type: types.commentReference,
      commentId: options.commentId
    };
  }
  function comment(options) {
    return {
      type: types.comment,
      commentId: options.commentId,
      body: options.body,
      authorName: options.authorName,
      authorInitials: options.authorInitials
    };
  }
  function noteKey(noteType, id) {
    return noteType + "-" + id;
  }
  function Image(options) {
    return {
      type: types.image,
      // `read` is retained for backwards compatibility, but other read
      // methods should be preferred.
      read: function(encoding) {
        if (encoding) {
          return options.readImage(encoding);
        } else {
          return options.readImage().then(function(arrayBuffer) {
            return Buffer.from(arrayBuffer);
          });
        }
      },
      readAsArrayBuffer: function() {
        return options.readImage();
      },
      readAsBase64String: function() {
        return options.readImage("base64");
      },
      readAsBuffer: function() {
        return options.readImage().then(function(arrayBuffer) {
          return Buffer.from(arrayBuffer);
        });
      },
      altText: options.altText,
      contentType: options.contentType
    };
  }
  function Table(children, properties) {
    properties = properties || {};
    return {
      type: types.table,
      children,
      styleId: properties.styleId || null,
      styleName: properties.styleName || null
    };
  }
  function TableRow(children, options) {
    options = options || {};
    return {
      type: types.tableRow,
      children,
      isHeader: options.isHeader || false
    };
  }
  function TableCell(children, options) {
    options = options || {};
    return {
      type: types.tableCell,
      children,
      colSpan: options.colSpan == null ? 1 : options.colSpan,
      rowSpan: options.rowSpan == null ? 1 : options.rowSpan
    };
  }
  function Break(breakType) {
    return {
      type: types["break"],
      breakType
    };
  }
  function BookmarkStart(options) {
    return {
      type: types.bookmarkStart,
      name: options.name
    };
  }
  documents.document = documents.Document = Document;
  documents.paragraph = documents.Paragraph = Paragraph;
  documents.run = documents.Run = Run;
  documents.text = documents.Text = Text;
  documents.tab = documents.Tab = Tab;
  documents.checkbox = documents.Checkbox = Checkbox;
  documents.Hyperlink = Hyperlink;
  documents.noteReference = documents.NoteReference = NoteReference;
  documents.Notes = Notes;
  documents.Note = Note;
  documents.commentReference = commentReference;
  documents.comment = comment;
  documents.Image = Image;
  documents.Table = Table;
  documents.TableRow = TableRow;
  documents.TableCell = TableCell;
  documents.lineBreak = Break("line");
  documents.pageBreak = Break("page");
  documents.columnBreak = Break("column");
  documents.BookmarkStart = BookmarkStart;
  documents.verticalAlignment = verticalAlignment;
  return documents;
}
var results = {};
var hasRequiredResults;
function requireResults() {
  if (hasRequiredResults) return results;
  hasRequiredResults = 1;
  var _2 = require$$0;
  results.Result = Result;
  results.success = success;
  results.warning = warning;
  results.error = error;
  function Result(value, messages) {
    this.value = value;
    this.messages = messages || [];
  }
  Result.prototype.map = function(func) {
    return new Result(func(this.value), this.messages);
  };
  Result.prototype.flatMap = function(func) {
    var funcResult = func(this.value);
    return new Result(funcResult.value, combineMessages([this, funcResult]));
  };
  Result.prototype.flatMapThen = function(func) {
    var that = this;
    return func(this.value).then(function(otherResult) {
      return new Result(otherResult.value, combineMessages([that, otherResult]));
    });
  };
  Result.combine = function(results2) {
    var values2 = _2.flatten(_2.pluck(results2, "value"));
    var messages = combineMessages(results2);
    return new Result(values2, messages);
  };
  function success(value) {
    return new Result(value, []);
  }
  function warning(message) {
    return {
      type: "warning",
      message
    };
  }
  function error(exception) {
    return {
      type: "error",
      message: exception.message,
      error: exception
    };
  }
  function combineMessages(results2) {
    var messages = [];
    _2.flatten(_2.pluck(results2, "messages"), true).forEach(function(message) {
      if (!containsMessage(messages, message)) {
        messages.push(message);
      }
    });
    return messages;
  }
  function containsMessage(messages, message) {
    return _2.find(messages, isSameMessage.bind(null, message)) !== void 0;
  }
  function isSameMessage(first2, second) {
    return first2.type === second.type && first2.message === second.message;
  }
  return results;
}
var zipfile = {};
var base64Js = {};
var hasRequiredBase64Js;
function requireBase64Js() {
  if (hasRequiredBase64Js) return base64Js;
  hasRequiredBase64Js = 1;
  base64Js.byteLength = byteLength;
  base64Js.toByteArray = toByteArray;
  base64Js.fromByteArray = fromByteArray;
  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
  var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }
  revLookup["-".charCodeAt(0)] = 62;
  revLookup["_".charCodeAt(0)] = 63;
  function getLens(b64) {
    var len2 = b64.length;
    if (len2 % 4 > 0) {
      throw new Error("Invalid string. Length must be a multiple of 4");
    }
    var validLen = b64.indexOf("=");
    if (validLen === -1) validLen = len2;
    var placeHoldersLen = validLen === len2 ? 0 : 4 - validLen % 4;
    return [validLen, placeHoldersLen];
  }
  function byteLength(b64) {
    var lens = getLens(b64);
    var validLen = lens[0];
    var placeHoldersLen = lens[1];
    return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
  }
  function _byteLength(b64, validLen, placeHoldersLen) {
    return (validLen + placeHoldersLen) * 3 / 4 - placeHoldersLen;
  }
  function toByteArray(b64) {
    var tmp;
    var lens = getLens(b64);
    var validLen = lens[0];
    var placeHoldersLen = lens[1];
    var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen));
    var curByte = 0;
    var len2 = placeHoldersLen > 0 ? validLen - 4 : validLen;
    var i2;
    for (i2 = 0; i2 < len2; i2 += 4) {
      tmp = revLookup[b64.charCodeAt(i2)] << 18 | revLookup[b64.charCodeAt(i2 + 1)] << 12 | revLookup[b64.charCodeAt(i2 + 2)] << 6 | revLookup[b64.charCodeAt(i2 + 3)];
      arr[curByte++] = tmp >> 16 & 255;
      arr[curByte++] = tmp >> 8 & 255;
      arr[curByte++] = tmp & 255;
    }
    if (placeHoldersLen === 2) {
      tmp = revLookup[b64.charCodeAt(i2)] << 2 | revLookup[b64.charCodeAt(i2 + 1)] >> 4;
      arr[curByte++] = tmp & 255;
    }
    if (placeHoldersLen === 1) {
      tmp = revLookup[b64.charCodeAt(i2)] << 10 | revLookup[b64.charCodeAt(i2 + 1)] << 4 | revLookup[b64.charCodeAt(i2 + 2)] >> 2;
      arr[curByte++] = tmp >> 8 & 255;
      arr[curByte++] = tmp & 255;
    }
    return arr;
  }
  function tripletToBase64(num) {
    return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
  }
  function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];
    for (var i2 = start; i2 < end; i2 += 3) {
      tmp = (uint8[i2] << 16 & 16711680) + (uint8[i2 + 1] << 8 & 65280) + (uint8[i2 + 2] & 255);
      output.push(tripletToBase64(tmp));
    }
    return output.join("");
  }
  function fromByteArray(uint8) {
    var tmp;
    var len2 = uint8.length;
    var extraBytes = len2 % 3;
    var parts = [];
    var maxChunkLength = 16383;
    for (var i2 = 0, len22 = len2 - extraBytes; i2 < len22; i2 += maxChunkLength) {
      parts.push(encodeChunk(uint8, i2, i2 + maxChunkLength > len22 ? len22 : i2 + maxChunkLength));
    }
    if (extraBytes === 1) {
      tmp = uint8[len2 - 1];
      parts.push(
        lookup[tmp >> 2] + lookup[tmp << 4 & 63] + "=="
      );
    } else if (extraBytes === 2) {
      tmp = (uint8[len2 - 2] << 8) + uint8[len2 - 1];
      parts.push(
        lookup[tmp >> 10] + lookup[tmp >> 4 & 63] + lookup[tmp << 2 & 63] + "="
      );
    }
    return parts.join("");
  }
  return base64Js;
}
var jszip_min = { exports: {} };
/*!

JSZip v3.10.2 - A JavaScript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2016 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See https://raw.github.com/Stuk/jszip/main/LICENSE.markdown.

JSZip uses the library pako released under the MIT license :
https://github.com/nodeca/pako/blob/main/LICENSE
*/
var hasRequiredJszip_min;
function requireJszip_min() {
  if (hasRequiredJszip_min) return jszip_min.exports;
  hasRequiredJszip_min = 1;
  (function(module, exports) {
    !(function(e) {
      module.exports = e();
    })(function() {
      return (function s(a, o, h) {
        function u(r, e2) {
          if (!o[r]) {
            if (!a[r]) {
              var t = "function" == typeof commonjsRequire && commonjsRequire;
              if (!e2 && t) return t(r, true);
              if (l) return l(r, true);
              var n = new Error("Cannot find module '" + r + "'");
              throw n.code = "MODULE_NOT_FOUND", n;
            }
            var i = o[r] = { exports: {} };
            a[r][0].call(i.exports, function(e3) {
              var t2 = a[r][1][e3];
              return u(t2 || e3);
            }, i, i.exports, s, a, o, h);
          }
          return o[r].exports;
        }
        for (var l = "function" == typeof commonjsRequire && commonjsRequire, e = 0; e < h.length; e++) u(h[e]);
        return u;
      })({ 1: [function(e, t, r) {
        var d = e("./utils"), c = e("./support"), p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        r.encode = function(e2) {
          for (var t2, r2, n, i, s, a, o, h = [], u = 0, l = e2.length, f = l, c2 = "string" !== d.getTypeOf(e2); u < e2.length; ) f = l - u, n = c2 ? (t2 = e2[u++], r2 = u < l ? e2[u++] : 0, u < l ? e2[u++] : 0) : (t2 = e2.charCodeAt(u++), r2 = u < l ? e2.charCodeAt(u++) : 0, u < l ? e2.charCodeAt(u++) : 0), i = t2 >> 2, s = (3 & t2) << 4 | r2 >> 4, a = 1 < f ? (15 & r2) << 2 | n >> 6 : 64, o = 2 < f ? 63 & n : 64, h.push(p.charAt(i) + p.charAt(s) + p.charAt(a) + p.charAt(o));
          return h.join("");
        }, r.decode = function(e2) {
          var t2, r2, n, i, s, a, o = 0, h = 0, u = "data:";
          if (e2.substr(0, u.length) === u) throw new Error("Invalid base64 input, it looks like a data url.");
          var l, f = 3 * (e2 = e2.replace(/[^A-Za-z0-9+/=]/g, "")).length / 4;
          if (e2.charAt(e2.length - 1) === p.charAt(64) && f--, e2.charAt(e2.length - 2) === p.charAt(64) && f--, f % 1 != 0) throw new Error("Invalid base64 input, bad content length.");
          for (l = c.uint8array ? new Uint8Array(0 | f) : new Array(0 | f); o < e2.length; ) t2 = p.indexOf(e2.charAt(o++)) << 2 | (i = p.indexOf(e2.charAt(o++))) >> 4, r2 = (15 & i) << 4 | (s = p.indexOf(e2.charAt(o++))) >> 2, n = (3 & s) << 6 | (a = p.indexOf(e2.charAt(o++))), l[h++] = t2, 64 !== s && (l[h++] = r2), 64 !== a && (l[h++] = n);
          return l;
        };
      }, { "./support": 30, "./utils": 32 }], 2: [function(e, t, r) {
        var n = e("./external"), i = e("./stream/DataWorker"), s = e("./stream/Crc32Probe"), a = e("./stream/DataLengthProbe");
        function o(e2, t2, r2, n2, i2) {
          this.compressedSize = e2, this.uncompressedSize = t2, this.crc32 = r2, this.compression = n2, this.compressedContent = i2;
        }
        o.prototype = { getContentWorker: function() {
          var e2 = new i(n.Promise.resolve(this.compressedContent)).pipe(this.compression.uncompressWorker()).pipe(new a("data_length")), t2 = this;
          return e2.on("end", function() {
            if (this.streamInfo.data_length !== t2.uncompressedSize) throw new Error("Bug : uncompressed data size mismatch");
          }), e2;
        }, getCompressedWorker: function() {
          return new i(n.Promise.resolve(this.compressedContent)).withStreamInfo("compressedSize", this.compressedSize).withStreamInfo("uncompressedSize", this.uncompressedSize).withStreamInfo("crc32", this.crc32).withStreamInfo("compression", this.compression);
        } }, o.createWorkerFrom = function(e2, t2, r2) {
          return e2.pipe(new s()).pipe(new a("uncompressedSize")).pipe(t2.compressWorker(r2)).pipe(new a("compressedSize")).withStreamInfo("compression", t2);
        }, t.exports = o;
      }, { "./external": 6, "./stream/Crc32Probe": 25, "./stream/DataLengthProbe": 26, "./stream/DataWorker": 27 }], 3: [function(e, t, r) {
        var n = e("./stream/GenericWorker");
        r.STORE = { magic: "\0\0", compressWorker: function() {
          return new n("STORE compression");
        }, uncompressWorker: function() {
          return new n("STORE decompression");
        } }, r.DEFLATE = e("./flate");
      }, { "./flate": 7, "./stream/GenericWorker": 28 }], 4: [function(e, t, r) {
        var n = e("./utils");
        var o = (function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n2 = 0; n2 < 8; n2++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        })();
        t.exports = function(e2, t2) {
          return void 0 !== e2 && e2.length ? "string" !== n.getTypeOf(e2) ? (function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3[a])];
            return -1 ^ e3;
          })(0 | t2, e2, e2.length, 0) : (function(e3, t3, r2, n2) {
            var i = o, s = n2 + r2;
            e3 ^= -1;
            for (var a = n2; a < s; a++) e3 = e3 >>> 8 ^ i[255 & (e3 ^ t3.charCodeAt(a))];
            return -1 ^ e3;
          })(0 | t2, e2, e2.length, 0) : 0;
        };
      }, { "./utils": 32 }], 5: [function(e, t, r) {
        r.base64 = false, r.binary = false, r.dir = false, r.createFolders = true, r.date = null, r.compression = null, r.compressionOptions = null, r.comment = null, r.unixPermissions = null, r.dosPermissions = null;
      }, {}], 6: [function(e, t, r) {
        var n = null;
        n = "undefined" != typeof Promise ? Promise : e("lie"), t.exports = { Promise: n };
      }, { lie: 37 }], 7: [function(e, t, r) {
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Uint32Array, i = e("pako"), s = e("./utils"), a = e("./stream/GenericWorker"), o = n ? "uint8array" : "array";
        function h(e2, t2) {
          a.call(this, "FlateWorker/" + e2), this._pako = null, this._pakoAction = e2, this._pakoOptions = t2, this.meta = {};
        }
        r.magic = "\b\0", s.inherits(h, a), h.prototype.processChunk = function(e2) {
          this.meta = e2.meta, null === this._pako && this._createPako(), this._pako.push(s.transformTo(o, e2.data), false);
        }, h.prototype.flush = function() {
          a.prototype.flush.call(this), null === this._pako && this._createPako(), this._pako.push([], true);
        }, h.prototype.cleanUp = function() {
          a.prototype.cleanUp.call(this), this._pako = null;
        }, h.prototype._createPako = function() {
          this._pako = new i[this._pakoAction]({ raw: true, level: this._pakoOptions.level || -1 });
          var t2 = this;
          this._pako.onData = function(e2) {
            t2.push({ data: e2, meta: t2.meta });
          };
        }, r.compressWorker = function(e2) {
          return new h("Deflate", e2);
        }, r.uncompressWorker = function() {
          return new h("Inflate", {});
        };
      }, { "./stream/GenericWorker": 28, "./utils": 32, pako: 38 }], 8: [function(e, t, r) {
        function A(e2, t2) {
          var r2, n2 = "";
          for (r2 = 0; r2 < t2; r2++) n2 += String.fromCharCode(255 & e2), e2 >>>= 8;
          return n2;
        }
        function n(e2, t2, r2, n2, i2, s2) {
          var a, o, h = e2.file, u = e2.compression, l = s2 !== O.utf8encode, f = I.transformTo("string", s2(h.name)), c = I.transformTo("string", O.utf8encode(h.name)), d = h.comment, p = I.transformTo("string", s2(d)), m = I.transformTo("string", O.utf8encode(d)), _2 = c.length !== h.name.length, g = m.length !== d.length, b = "", v = "", y = "", w = h.dir, k = h.date, x = { crc32: 0, compressedSize: 0, uncompressedSize: 0 };
          t2 && !r2 || (x.crc32 = e2.crc32, x.compressedSize = e2.compressedSize, x.uncompressedSize = e2.uncompressedSize);
          var S = 0;
          t2 && (S |= 8), l || !_2 && !g || (S |= 2048);
          var z = 0, C = 0;
          w && (z |= 16), "UNIX" === i2 ? (C = 798, z |= (function(e3, t3) {
            var r3 = e3;
            return e3 || (r3 = t3 ? 16893 : 33204), (65535 & r3) << 16;
          })(h.unixPermissions, w)) : (C = 20, z |= (function(e3) {
            return 63 & (e3 || 0);
          })(h.dosPermissions)), a = k.getUTCHours(), a <<= 6, a |= k.getUTCMinutes(), a <<= 5, a |= k.getUTCSeconds() / 2, o = k.getUTCFullYear() - 1980, o <<= 4, o |= k.getUTCMonth() + 1, o <<= 5, o |= k.getUTCDate(), _2 && (v = A(1, 1) + A(B(f), 4) + c, b += "up" + A(v.length, 2) + v), g && (y = A(1, 1) + A(B(p), 4) + m, b += "uc" + A(y.length, 2) + y);
          var E = "";
          return E += "\n\0", E += A(S, 2), E += u.magic, E += A(a, 2), E += A(o, 2), E += A(x.crc32, 4), E += A(x.compressedSize, 4), E += A(x.uncompressedSize, 4), E += A(f.length, 2), E += A(b.length, 2), { fileRecord: R.LOCAL_FILE_HEADER + E + f + b, dirRecord: R.CENTRAL_FILE_HEADER + A(C, 2) + E + A(p.length, 2) + "\0\0\0\0" + A(z, 4) + A(n2, 4) + f + b + p };
        }
        var I = e("../utils"), i = e("../stream/GenericWorker"), O = e("../utf8"), B = e("../crc32"), R = e("../signature");
        function s(e2, t2, r2, n2) {
          i.call(this, "ZipFileWorker"), this.bytesWritten = 0, this.zipComment = t2, this.zipPlatform = r2, this.encodeFileName = n2, this.streamFiles = e2, this.accumulate = false, this.contentBuffer = [], this.dirRecords = [], this.currentSourceOffset = 0, this.entriesCount = 0, this.currentFile = null, this._sources = [];
        }
        I.inherits(s, i), s.prototype.push = function(e2) {
          var t2 = e2.meta.percent || 0, r2 = this.entriesCount, n2 = this._sources.length;
          this.accumulate ? this.contentBuffer.push(e2) : (this.bytesWritten += e2.data.length, i.prototype.push.call(this, { data: e2.data, meta: { currentFile: this.currentFile, percent: r2 ? (t2 + 100 * (r2 - n2 - 1)) / r2 : 100 } }));
        }, s.prototype.openedSource = function(e2) {
          this.currentSourceOffset = this.bytesWritten, this.currentFile = e2.file.name;
          var t2 = this.streamFiles && !e2.file.dir;
          if (t2) {
            var r2 = n(e2, t2, false, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
            this.push({ data: r2.fileRecord, meta: { percent: 0 } });
          } else this.accumulate = true;
        }, s.prototype.closedSource = function(e2) {
          this.accumulate = false;
          var t2 = this.streamFiles && !e2.file.dir, r2 = n(e2, t2, true, this.currentSourceOffset, this.zipPlatform, this.encodeFileName);
          if (this.dirRecords.push(r2.dirRecord), t2) this.push({ data: (function(e3) {
            return R.DATA_DESCRIPTOR + A(e3.crc32, 4) + A(e3.compressedSize, 4) + A(e3.uncompressedSize, 4);
          })(e2), meta: { percent: 100 } });
          else for (this.push({ data: r2.fileRecord, meta: { percent: 0 } }); this.contentBuffer.length; ) this.push(this.contentBuffer.shift());
          this.currentFile = null;
        }, s.prototype.flush = function() {
          for (var e2 = this.bytesWritten, t2 = 0; t2 < this.dirRecords.length; t2++) this.push({ data: this.dirRecords[t2], meta: { percent: 100 } });
          var r2 = this.bytesWritten - e2, n2 = (function(e3, t3, r3, n3, i2) {
            var s2 = I.transformTo("string", i2(n3));
            return R.CENTRAL_DIRECTORY_END + "\0\0\0\0" + A(e3, 2) + A(e3, 2) + A(t3, 4) + A(r3, 4) + A(s2.length, 2) + s2;
          })(this.dirRecords.length, r2, e2, this.zipComment, this.encodeFileName);
          this.push({ data: n2, meta: { percent: 100 } });
        }, s.prototype.prepareNextSource = function() {
          this.previous = this._sources.shift(), this.openedSource(this.previous.streamInfo), this.isPaused ? this.previous.pause() : this.previous.resume();
        }, s.prototype.registerPrevious = function(e2) {
          this._sources.push(e2);
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.closedSource(t2.previous.streamInfo), t2._sources.length ? t2.prepareNextSource() : t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this.previous && this._sources.length ? (this.prepareNextSource(), true) : this.previous || this._sources.length || this.generatedError ? void 0 : (this.end(), true));
        }, s.prototype.error = function(e2) {
          var t2 = this._sources;
          if (!i.prototype.error.call(this, e2)) return false;
          for (var r2 = 0; r2 < t2.length; r2++) try {
            t2[r2].error(e2);
          } catch (e3) {
          }
          return true;
        }, s.prototype.lock = function() {
          i.prototype.lock.call(this);
          for (var e2 = this._sources, t2 = 0; t2 < e2.length; t2++) e2[t2].lock();
        }, t.exports = s;
      }, { "../crc32": 4, "../signature": 23, "../stream/GenericWorker": 28, "../utf8": 31, "../utils": 32 }], 9: [function(e, t, r) {
        var u = e("../compressions"), n = e("./ZipFileWorker");
        r.generateWorker = function(e2, a, t2) {
          var o = new n(a.streamFiles, t2, a.platform, a.encodeFileName), h = 0;
          try {
            e2.forEach(function(e3, t3) {
              h++;
              var r2 = (function(e4, t4) {
                var r3 = e4 || t4, n3 = u[r3];
                if (!n3) throw new Error(r3 + " is not a valid compression method !");
                return n3;
              })(t3.options.compression, a.compression), n2 = t3.options.compressionOptions || a.compressionOptions || {}, i = t3.dir, s = t3.date;
              t3._compressWorker(r2, n2).withStreamInfo("file", { name: e3, dir: i, date: s, comment: t3.comment || "", unixPermissions: t3.unixPermissions, dosPermissions: t3.dosPermissions }).pipe(o);
            }), o.entriesCount = h;
          } catch (e3) {
            o.error(e3);
          }
          return o;
        };
      }, { "../compressions": 3, "./ZipFileWorker": 8 }], 10: [function(e, t, r) {
        function n() {
          if (!(this instanceof n)) return new n();
          if (arguments.length) throw new Error("The constructor with parameters has been removed in JSZip 3.0, please check the upgrade guide.");
          this.files = /* @__PURE__ */ Object.create(null), this.comment = null, this.root = "", this.clone = function() {
            var e2 = new n();
            for (var t2 in this) "function" != typeof this[t2] && (e2[t2] = this[t2]);
            return e2;
          };
        }
        (n.prototype = e("./object")).loadAsync = e("./load"), n.support = e("./support"), n.defaults = e("./defaults"), n.version = "3.10.2", n.loadAsync = function(e2, t2) {
          return new n().loadAsync(e2, t2);
        }, n.external = e("./external"), t.exports = n;
      }, { "./defaults": 5, "./external": 6, "./load": 11, "./object": 15, "./support": 30 }], 11: [function(e, t, r) {
        var u = e("./utils"), i = e("./external"), n = e("./utf8"), s = e("./zipEntries"), a = e("./stream/Crc32Probe"), l = e("./nodejsUtils");
        function f(n2) {
          return new i.Promise(function(e2, t2) {
            var r2 = n2.decompressed.getContentWorker().pipe(new a());
            r2.on("error", function(e3) {
              t2(e3);
            }).on("end", function() {
              r2.streamInfo.crc32 !== n2.decompressed.crc32 ? t2(new Error("Corrupted zip : CRC32 mismatch")) : e2();
            }).resume();
          });
        }
        t.exports = function(e2, o) {
          var h = this;
          return o = u.extend(o || {}, { base64: false, checkCRC32: false, optimizedBinaryString: false, createFolders: false, decodeFileName: n.utf8decode }), l.isNode && l.isStream(e2) ? i.Promise.reject(new Error("JSZip can't accept a stream when loading a zip file.")) : u.prepareContent("the loaded zip file", e2, true, o.optimizedBinaryString, o.base64).then(function(e3) {
            var t2 = new s(o);
            return t2.load(e3), t2;
          }).then(function(e3) {
            var t2 = [i.Promise.resolve(e3)], r2 = e3.files;
            if (o.checkCRC32) for (var n2 = 0; n2 < r2.length; n2++) t2.push(f(r2[n2]));
            return i.Promise.all(t2);
          }).then(function(e3) {
            for (var t2 = e3.shift(), r2 = t2.files, n2 = 0; n2 < r2.length; n2++) {
              var i2 = r2[n2], s2 = i2.fileNameStr, a2 = u.resolve(i2.fileNameStr);
              h.file(a2, i2.decompressed, { binary: true, optimizedBinaryString: true, date: i2.date, dir: i2.dir, comment: i2.fileCommentStr.length ? i2.fileCommentStr : null, unixPermissions: i2.unixPermissions, dosPermissions: i2.dosPermissions, createFolders: o.createFolders }), i2.dir || (h.file(a2).unsafeOriginalName = s2);
            }
            return t2.zipComment.length && (h.comment = t2.zipComment), h;
          });
        };
      }, { "./external": 6, "./nodejsUtils": 14, "./stream/Crc32Probe": 25, "./utf8": 31, "./utils": 32, "./zipEntries": 33 }], 12: [function(e, t, r) {
        var n = e("../utils"), i = e("../stream/GenericWorker");
        function s(e2, t2) {
          i.call(this, "Nodejs stream input adapter for " + e2), this._upstreamEnded = false, this._bindStream(t2);
        }
        n.inherits(s, i), s.prototype._bindStream = function(e2) {
          var t2 = this;
          (this._stream = e2).pause(), e2.on("data", function(e3) {
            t2.push({ data: e3, meta: { percent: 0 } });
          }).on("error", function(e3) {
            t2.isPaused ? this.generatedError = e3 : t2.error(e3);
          }).on("end", function() {
            t2.isPaused ? t2._upstreamEnded = true : t2.end();
          });
        }, s.prototype.pause = function() {
          return !!i.prototype.pause.call(this) && (this._stream.pause(), true);
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (this._upstreamEnded ? this.end() : this._stream.resume(), true);
        }, t.exports = s;
      }, { "../stream/GenericWorker": 28, "../utils": 32 }], 13: [function(e, t, r) {
        var i = e("readable-stream").Readable;
        function n(e2, t2, r2) {
          i.call(this, t2), this._helper = e2;
          var n2 = this;
          e2.on("data", function(e3, t3) {
            n2.push(e3) || n2._helper.pause(), r2 && r2(t3);
          }).on("error", function(e3) {
            n2.emit("error", e3);
          }).on("end", function() {
            n2.push(null);
          });
        }
        e("../utils").inherits(n, i), n.prototype._read = function() {
          this._helper.resume();
        }, t.exports = n;
      }, { "../utils": 32, "readable-stream": 16 }], 14: [function(e, t, r) {
        t.exports = { isNode: "undefined" != typeof Buffer, newBufferFrom: function(e2, t2) {
          if (Buffer.from && Buffer.from !== Uint8Array.from) return Buffer.from(e2, t2);
          if ("number" == typeof e2) throw new Error('The "data" argument must not be a number');
          return new Buffer(e2, t2);
        }, allocBuffer: function(e2) {
          if (Buffer.alloc) return Buffer.alloc(e2);
          var t2 = new Buffer(e2);
          return t2.fill(0), t2;
        }, isBuffer: function(e2) {
          return Buffer.isBuffer(e2);
        }, isStream: function(e2) {
          return e2 && "function" == typeof e2.on && "function" == typeof e2.pause && "function" == typeof e2.resume;
        } };
      }, {}], 15: [function(e, t, r) {
        function s(e2, t2, r2) {
          var n2, i2 = u.getTypeOf(t2), s2 = u.extend(r2 || {}, f);
          s2.date = s2.date || /* @__PURE__ */ new Date(), null !== s2.compression && (s2.compression = s2.compression.toUpperCase()), "string" == typeof s2.unixPermissions && (s2.unixPermissions = parseInt(s2.unixPermissions, 8)), s2.unixPermissions && 16384 & s2.unixPermissions && (s2.dir = true), s2.dosPermissions && 16 & s2.dosPermissions && (s2.dir = true), s2.dir && (e2 = g(e2)), s2.createFolders && (n2 = _2(e2)) && b.call(this, n2, true);
          var a2 = "string" === i2 && false === s2.binary && false === s2.base64;
          r2 && void 0 !== r2.binary || (s2.binary = !a2), (t2 instanceof c && 0 === t2.uncompressedSize || s2.dir || !t2 || 0 === t2.length) && (s2.base64 = false, s2.binary = true, t2 = "", s2.compression = "STORE", i2 = "string");
          var o2 = null;
          o2 = t2 instanceof c || t2 instanceof l ? t2 : p.isNode && p.isStream(t2) ? new m(e2, t2) : u.prepareContent(e2, t2, s2.binary, s2.optimizedBinaryString, s2.base64);
          var h2 = new d(e2, o2, s2);
          this.files[e2] = h2;
        }
        var i = e("./utf8"), u = e("./utils"), l = e("./stream/GenericWorker"), a = e("./stream/StreamHelper"), f = e("./defaults"), c = e("./compressedObject"), d = e("./zipObject"), o = e("./generate"), p = e("./nodejsUtils"), m = e("./nodejs/NodejsStreamInputAdapter"), _2 = function(e2) {
          "/" === e2.slice(-1) && (e2 = e2.substring(0, e2.length - 1));
          var t2 = e2.lastIndexOf("/");
          return 0 < t2 ? e2.substring(0, t2) : "";
        }, g = function(e2) {
          return "/" !== e2.slice(-1) && (e2 += "/"), e2;
        }, b = function(e2, t2) {
          return t2 = void 0 !== t2 ? t2 : f.createFolders, e2 = g(e2), this.files[e2] || s.call(this, e2, null, { dir: true, createFolders: t2 }), this.files[e2];
        };
        function h(e2) {
          return "[object RegExp]" === Object.prototype.toString.call(e2);
        }
        var n = { load: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, forEach: function(e2) {
          var t2, r2, n2;
          for (t2 in this.files) n2 = this.files[t2], (r2 = t2.slice(this.root.length, t2.length)) && t2.slice(0, this.root.length) === this.root && e2(r2, n2);
        }, filter: function(r2) {
          var n2 = [];
          return this.forEach(function(e2, t2) {
            r2(e2, t2) && n2.push(t2);
          }), n2;
        }, file: function(e2, t2, r2) {
          if (1 !== arguments.length) return e2 = this.root + e2, s.call(this, e2, t2, r2), this;
          if (h(e2)) {
            var n2 = e2;
            return this.filter(function(e3, t3) {
              return !t3.dir && n2.test(e3);
            });
          }
          var i2 = this.files[this.root + e2];
          return i2 && !i2.dir ? i2 : null;
        }, folder: function(r2) {
          if (!r2) return this;
          if (h(r2)) return this.filter(function(e3, t3) {
            return t3.dir && r2.test(e3);
          });
          var e2 = this.root + r2, t2 = b.call(this, e2), n2 = this.clone();
          return n2.root = t2.name, n2;
        }, remove: function(r2) {
          r2 = this.root + r2;
          var e2 = this.files[r2];
          if (e2 || ("/" !== r2.slice(-1) && (r2 += "/"), e2 = this.files[r2]), e2 && !e2.dir) delete this.files[r2];
          else for (var t2 = this.filter(function(e3, t3) {
            return t3.name.slice(0, r2.length) === r2;
          }), n2 = 0; n2 < t2.length; n2++) delete this.files[t2[n2].name];
          return this;
        }, generate: function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, generateInternalStream: function(e2) {
          var t2, r2 = {};
          try {
            if ((r2 = u.extend(e2 || {}, { streamFiles: false, compression: "STORE", compressionOptions: null, type: "", platform: "DOS", comment: null, mimeType: "application/zip", encodeFileName: i.utf8encode })).type = r2.type.toLowerCase(), r2.compression = r2.compression.toUpperCase(), "binarystring" === r2.type && (r2.type = "string"), !r2.type) throw new Error("No output type specified.");
            u.checkSupport(r2.type), "darwin" !== r2.platform && "freebsd" !== r2.platform && "linux" !== r2.platform && "sunos" !== r2.platform || (r2.platform = "UNIX"), "win32" === r2.platform && (r2.platform = "DOS");
            var n2 = r2.comment || this.comment || "";
            t2 = o.generateWorker(this, r2, n2);
          } catch (e3) {
            (t2 = new l("error")).error(e3);
          }
          return new a(t2, r2.type || "string", r2.mimeType);
        }, generateAsync: function(e2, t2) {
          return this.generateInternalStream(e2).accumulate(t2);
        }, generateNodeStream: function(e2, t2) {
          return (e2 = e2 || {}).type || (e2.type = "nodebuffer"), this.generateInternalStream(e2).toNodejsStream(t2);
        } };
        t.exports = n;
      }, { "./compressedObject": 2, "./defaults": 5, "./generate": 9, "./nodejs/NodejsStreamInputAdapter": 12, "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31, "./utils": 32, "./zipObject": 35 }], 16: [function(e, t, r) {
        t.exports = e("stream");
      }, { stream: void 0 }], 17: [function(e, t, r) {
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
          for (var t2 = 0; t2 < this.data.length; t2++) e2[t2] = 255 & e2[t2];
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data[this.zero + e2];
        }, i.prototype.lastIndexOfSignature = function(e2) {
          for (var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.length - 4; 0 <= s; --s) if (this.data[s] === t2 && this.data[s + 1] === r2 && this.data[s + 2] === n2 && this.data[s + 3] === i2) return s - this.zero;
          return -1;
        }, i.prototype.readAndCheckSignature = function(e2) {
          var t2 = e2.charCodeAt(0), r2 = e2.charCodeAt(1), n2 = e2.charCodeAt(2), i2 = e2.charCodeAt(3), s = this.readData(4);
          return t2 === s[0] && r2 === s[1] && n2 === s[2] && i2 === s[3];
        }, i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2) return [];
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 18: [function(e, t, r) {
        var n = e("../utils");
        function i(e2) {
          this.data = e2, this.length = e2.length, this.index = 0, this.zero = 0;
        }
        i.prototype = { checkOffset: function(e2) {
          this.checkIndex(this.index + e2);
        }, checkIndex: function(e2) {
          if (this.length < this.zero + e2 || e2 < 0) throw new Error("End of data reached (data length = " + this.length + ", asked index = " + e2 + "). Corrupted zip ?");
        }, setIndex: function(e2) {
          this.checkIndex(e2), this.index = e2;
        }, skip: function(e2) {
          this.setIndex(this.index + e2);
        }, byteAt: function() {
        }, readInt: function(e2) {
          var t2, r2 = 0;
          for (this.checkOffset(e2), t2 = this.index + e2 - 1; t2 >= this.index; t2--) r2 = (r2 << 8) + this.byteAt(t2);
          return this.index += e2, r2;
        }, readString: function(e2) {
          return n.transformTo("string", this.readData(e2));
        }, readData: function() {
        }, lastIndexOfSignature: function() {
        }, readAndCheckSignature: function() {
        }, readDate: function() {
          var e2 = this.readInt(4);
          return new Date(Date.UTC(1980 + (e2 >> 25 & 127), (e2 >> 21 & 15) - 1, e2 >> 16 & 31, e2 >> 11 & 31, e2 >> 5 & 63, (31 & e2) << 1));
        } }, t.exports = i;
      }, { "../utils": 32 }], 19: [function(e, t, r) {
        var n = e("./Uint8ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./Uint8ArrayReader": 21 }], 20: [function(e, t, r) {
        var n = e("./DataReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.byteAt = function(e2) {
          return this.data.charCodeAt(this.zero + e2);
        }, i.prototype.lastIndexOfSignature = function(e2) {
          return this.data.lastIndexOf(e2) - this.zero;
        }, i.prototype.readAndCheckSignature = function(e2) {
          return e2 === this.readData(4);
        }, i.prototype.readData = function(e2) {
          this.checkOffset(e2);
          var t2 = this.data.slice(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./DataReader": 18 }], 21: [function(e, t, r) {
        var n = e("./ArrayReader");
        function i(e2) {
          n.call(this, e2);
        }
        e("../utils").inherits(i, n), i.prototype.readData = function(e2) {
          if (this.checkOffset(e2), 0 === e2) return new Uint8Array(0);
          var t2 = this.data.subarray(this.zero + this.index, this.zero + this.index + e2);
          return this.index += e2, t2;
        }, t.exports = i;
      }, { "../utils": 32, "./ArrayReader": 17 }], 22: [function(e, t, r) {
        var n = e("../utils"), i = e("../support"), s = e("./ArrayReader"), a = e("./StringReader"), o = e("./NodeBufferReader"), h = e("./Uint8ArrayReader");
        t.exports = function(e2) {
          var t2 = n.getTypeOf(e2);
          return n.checkSupport(t2), "string" !== t2 || i.uint8array ? "nodebuffer" === t2 ? new o(e2) : i.uint8array ? new h(n.transformTo("uint8array", e2)) : new s(n.transformTo("array", e2)) : new a(e2);
        };
      }, { "../support": 30, "../utils": 32, "./ArrayReader": 17, "./NodeBufferReader": 19, "./StringReader": 20, "./Uint8ArrayReader": 21 }], 23: [function(e, t, r) {
        r.LOCAL_FILE_HEADER = "PK", r.CENTRAL_FILE_HEADER = "PK", r.CENTRAL_DIRECTORY_END = "PK", r.ZIP64_CENTRAL_DIRECTORY_LOCATOR = "PK\x07", r.ZIP64_CENTRAL_DIRECTORY_END = "PK", r.DATA_DESCRIPTOR = "PK\x07\b";
      }, {}], 24: [function(e, t, r) {
        var n = e("./GenericWorker"), i = e("../utils");
        function s(e2) {
          n.call(this, "ConvertWorker to " + e2), this.destType = e2;
        }
        i.inherits(s, n), s.prototype.processChunk = function(e2) {
          this.push({ data: i.transformTo(this.destType, e2.data), meta: e2.meta });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 25: [function(e, t, r) {
        var n = e("./GenericWorker"), i = e("../crc32");
        function s() {
          n.call(this, "Crc32Probe"), this.withStreamInfo("crc32", 0);
        }
        e("../utils").inherits(s, n), s.prototype.processChunk = function(e2) {
          this.streamInfo.crc32 = i(e2.data, this.streamInfo.crc32 || 0), this.push(e2);
        }, t.exports = s;
      }, { "../crc32": 4, "../utils": 32, "./GenericWorker": 28 }], 26: [function(e, t, r) {
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataLengthProbe for " + e2), this.propName = e2, this.withStreamInfo(e2, 0);
        }
        n.inherits(s, i), s.prototype.processChunk = function(e2) {
          if (e2) {
            var t2 = this.streamInfo[this.propName] || 0;
            this.streamInfo[this.propName] = t2 + e2.data.length;
          }
          i.prototype.processChunk.call(this, e2);
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 27: [function(e, t, r) {
        var n = e("../utils"), i = e("./GenericWorker");
        function s(e2) {
          i.call(this, "DataWorker");
          var t2 = this;
          this.dataIsReady = false, this.index = 0, this.max = 0, this.data = null, this.type = "", this._tickScheduled = false, e2.then(function(e3) {
            t2.dataIsReady = true, t2.data = e3, t2.max = e3 && e3.length || 0, t2.type = n.getTypeOf(e3), t2.isPaused || t2._tickAndRepeat();
          }, function(e3) {
            t2.error(e3);
          });
        }
        n.inherits(s, i), s.prototype.cleanUp = function() {
          i.prototype.cleanUp.call(this), this.data = null;
        }, s.prototype.resume = function() {
          return !!i.prototype.resume.call(this) && (!this._tickScheduled && this.dataIsReady && (this._tickScheduled = true, n.delay(this._tickAndRepeat, [], this)), true);
        }, s.prototype._tickAndRepeat = function() {
          this._tickScheduled = false, this.isPaused || this.isFinished || (this._tick(), this.isFinished || (n.delay(this._tickAndRepeat, [], this), this._tickScheduled = true));
        }, s.prototype._tick = function() {
          if (this.isPaused || this.isFinished) return false;
          var e2 = null, t2 = Math.min(this.max, this.index + 16384);
          if (this.index >= this.max) return this.end();
          switch (this.type) {
            case "string":
              e2 = this.data.substring(this.index, t2);
              break;
            case "uint8array":
              e2 = this.data.subarray(this.index, t2);
              break;
            case "array":
            case "nodebuffer":
              e2 = this.data.slice(this.index, t2);
          }
          return this.index = t2, this.push({ data: e2, meta: { percent: this.max ? this.index / this.max * 100 : 0 } });
        }, t.exports = s;
      }, { "../utils": 32, "./GenericWorker": 28 }], 28: [function(e, t, r) {
        function n(e2) {
          this.name = e2 || "default", this.streamInfo = {}, this.generatedError = null, this.extraStreamInfo = {}, this.isPaused = true, this.isFinished = false, this.isLocked = false, this._listeners = { data: [], end: [], error: [] }, this.previous = null;
        }
        n.prototype = { push: function(e2) {
          this.emit("data", e2);
        }, end: function() {
          if (this.isFinished) return false;
          this.flush();
          try {
            this.emit("end"), this.cleanUp(), this.isFinished = true;
          } catch (e2) {
            this.emit("error", e2);
          }
          return true;
        }, error: function(e2) {
          return !this.isFinished && (this.isPaused ? this.generatedError = e2 : (this.isFinished = true, this.emit("error", e2), this.previous && this.previous.error(e2), this.cleanUp()), true);
        }, on: function(e2, t2) {
          return this._listeners[e2].push(t2), this;
        }, cleanUp: function() {
          this.streamInfo = this.generatedError = this.extraStreamInfo = null, this._listeners = [];
        }, emit: function(e2, t2) {
          if (this._listeners[e2]) for (var r2 = 0; r2 < this._listeners[e2].length; r2++) this._listeners[e2][r2].call(this, t2);
        }, pipe: function(e2) {
          return e2.registerPrevious(this);
        }, registerPrevious: function(e2) {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.streamInfo = e2.streamInfo, this.mergeStreamInfo(), this.previous = e2;
          var t2 = this;
          return e2.on("data", function(e3) {
            t2.processChunk(e3);
          }), e2.on("end", function() {
            t2.end();
          }), e2.on("error", function(e3) {
            t2.error(e3);
          }), this;
        }, pause: function() {
          return !this.isPaused && !this.isFinished && (this.isPaused = true, this.previous && this.previous.pause(), true);
        }, resume: function() {
          if (!this.isPaused || this.isFinished) return false;
          var e2 = this.isPaused = false;
          return this.generatedError && (this.error(this.generatedError), e2 = true), this.previous && this.previous.resume(), !e2;
        }, flush: function() {
        }, processChunk: function(e2) {
          this.push(e2);
        }, withStreamInfo: function(e2, t2) {
          return this.extraStreamInfo[e2] = t2, this.mergeStreamInfo(), this;
        }, mergeStreamInfo: function() {
          for (var e2 in this.extraStreamInfo) Object.prototype.hasOwnProperty.call(this.extraStreamInfo, e2) && (this.streamInfo[e2] = this.extraStreamInfo[e2]);
        }, lock: function() {
          if (this.isLocked) throw new Error("The stream '" + this + "' has already been used.");
          this.isLocked = true, this.previous && this.previous.lock();
        }, toString: function() {
          var e2 = "Worker " + this.name;
          return this.previous ? this.previous + " -> " + e2 : e2;
        } }, t.exports = n;
      }, {}], 29: [function(e, t, r) {
        var h = e("../utils"), i = e("./ConvertWorker"), s = e("./GenericWorker"), u = e("../base64"), n = e("../support"), a = e("../external"), o = null;
        if (n.nodestream) try {
          o = e("../nodejs/NodejsStreamOutputAdapter");
        } catch (e2) {
        }
        function l(e2, o2) {
          return new a.Promise(function(t2, r2) {
            var n2 = [], i2 = e2._internalType, s2 = e2._outputType, a2 = e2._mimeType;
            e2.on("data", function(e3, t3) {
              n2.push(e3), o2 && o2(t3);
            }).on("error", function(e3) {
              n2 = [], r2(e3);
            }).on("end", function() {
              try {
                var e3 = (function(e4, t3, r3) {
                  switch (e4) {
                    case "blob":
                      return h.newBlob(h.transformTo("arraybuffer", t3), r3);
                    case "base64":
                      return u.encode(t3);
                    default:
                      return h.transformTo(e4, t3);
                  }
                })(s2, (function(e4, t3) {
                  var r3, n3 = 0, i3 = null, s3 = 0;
                  for (r3 = 0; r3 < t3.length; r3++) s3 += t3[r3].length;
                  switch (e4) {
                    case "string":
                      return t3.join("");
                    case "array":
                      return Array.prototype.concat.apply([], t3);
                    case "uint8array":
                      for (i3 = new Uint8Array(s3), r3 = 0; r3 < t3.length; r3++) i3.set(t3[r3], n3), n3 += t3[r3].length;
                      return i3;
                    case "nodebuffer":
                      return Buffer.concat(t3);
                    default:
                      throw new Error("concat : unsupported type '" + e4 + "'");
                  }
                })(i2, n2), a2);
                t2(e3);
              } catch (e4) {
                r2(e4);
              }
              n2 = [];
            }).resume();
          });
        }
        function f(e2, t2, r2) {
          var n2 = t2;
          switch (t2) {
            case "blob":
            case "arraybuffer":
              n2 = "uint8array";
              break;
            case "base64":
              n2 = "string";
          }
          try {
            this._internalType = n2, this._outputType = t2, this._mimeType = r2, h.checkSupport(n2), this._worker = e2.pipe(new i(n2)), e2.lock();
          } catch (e3) {
            this._worker = new s("error"), this._worker.error(e3);
          }
        }
        f.prototype = { accumulate: function(e2) {
          return l(this, e2);
        }, on: function(e2, t2) {
          var r2 = this;
          return "data" === e2 ? this._worker.on(e2, function(e3) {
            t2.call(r2, e3.data, e3.meta);
          }) : this._worker.on(e2, function() {
            h.delay(t2, arguments, r2);
          }), this;
        }, resume: function() {
          return h.delay(this._worker.resume, [], this._worker), this;
        }, pause: function() {
          return this._worker.pause(), this;
        }, toNodejsStream: function(e2) {
          if (h.checkSupport("nodestream"), "nodebuffer" !== this._outputType) throw new Error(this._outputType + " is not supported by this method");
          return new o(this, { objectMode: "nodebuffer" !== this._outputType }, e2);
        } }, t.exports = f;
      }, { "../base64": 1, "../external": 6, "../nodejs/NodejsStreamOutputAdapter": 13, "../support": 30, "../utils": 32, "./ConvertWorker": 24, "./GenericWorker": 28 }], 30: [function(e, t, r) {
        if (r.base64 = true, r.array = true, r.string = true, r.arraybuffer = "undefined" != typeof ArrayBuffer && "undefined" != typeof Uint8Array, r.nodebuffer = "undefined" != typeof Buffer, r.uint8array = "undefined" != typeof Uint8Array, "undefined" == typeof ArrayBuffer) r.blob = false;
        else {
          var n = new ArrayBuffer(0);
          try {
            r.blob = 0 === new Blob([n], { type: "application/zip" }).size;
          } catch (e2) {
            try {
              var i = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              i.append(n), r.blob = 0 === i.getBlob("application/zip").size;
            } catch (e3) {
              r.blob = false;
            }
          }
        }
        try {
          r.nodestream = !!e("readable-stream").Readable;
        } catch (e2) {
          r.nodestream = false;
        }
      }, { "readable-stream": 16 }], 31: [function(e, t, s) {
        for (var o = e("./utils"), h = e("./support"), r = e("./nodejsUtils"), n = e("./stream/GenericWorker"), u = new Array(256), i = 0; i < 256; i++) u[i] = 252 <= i ? 6 : 248 <= i ? 5 : 240 <= i ? 4 : 224 <= i ? 3 : 192 <= i ? 2 : 1;
        u[254] = u[254] = 1;
        function a() {
          n.call(this, "utf-8 decode"), this.leftOver = null;
        }
        function l() {
          n.call(this, "utf-8 encode");
        }
        s.utf8encode = function(e2) {
          return h.nodebuffer ? r.newBufferFrom(e2, "utf-8") : (function(e3) {
            var t2, r2, n2, i2, s2, a2 = e3.length, o2 = 0;
            for (i2 = 0; i2 < a2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o2 += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
            for (t2 = h.uint8array ? new Uint8Array(o2) : new Array(o2), i2 = s2 = 0; s2 < o2; i2++) 55296 == (64512 & (r2 = e3.charCodeAt(i2))) && i2 + 1 < a2 && 56320 == (64512 & (n2 = e3.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
            return t2;
          })(e2);
        }, s.utf8decode = function(e2) {
          return h.nodebuffer ? o.transformTo("nodebuffer", e2).toString("utf-8") : (function(e3) {
            var t2, r2, n2, i2, s2 = e3.length, a2 = new Array(2 * s2);
            for (t2 = r2 = 0; t2 < s2; ) if ((n2 = e3[t2++]) < 128) a2[r2++] = n2;
            else if (4 < (i2 = u[n2])) a2[r2++] = 65533, t2 += i2 - 1;
            else {
              for (n2 &= 2 === i2 ? 31 : 3 === i2 ? 15 : 7; 1 < i2 && t2 < s2; ) n2 = n2 << 6 | 63 & e3[t2++], i2--;
              1 < i2 ? a2[r2++] = 65533 : n2 < 65536 ? a2[r2++] = n2 : (n2 -= 65536, a2[r2++] = 55296 | n2 >> 10 & 1023, a2[r2++] = 56320 | 1023 & n2);
            }
            return a2.length !== r2 && (a2.subarray ? a2 = a2.subarray(0, r2) : a2.length = r2), o.applyFromCharCode(a2);
          })(e2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2));
        }, o.inherits(a, n), a.prototype.processChunk = function(e2) {
          var t2 = o.transformTo(h.uint8array ? "uint8array" : "array", e2.data);
          if (this.leftOver && this.leftOver.length) {
            if (h.uint8array) {
              var r2 = t2;
              (t2 = new Uint8Array(r2.length + this.leftOver.length)).set(this.leftOver, 0), t2.set(r2, this.leftOver.length);
            } else t2 = this.leftOver.concat(t2);
            this.leftOver = null;
          }
          var n2 = (function(e3, t3) {
            var r3;
            for ((t3 = t3 || e3.length) > e3.length && (t3 = e3.length), r3 = t3 - 1; 0 <= r3 && 128 == (192 & e3[r3]); ) r3--;
            return r3 < 0 ? t3 : 0 === r3 ? t3 : r3 + u[e3[r3]] > t3 ? r3 : t3;
          })(t2), i2 = t2;
          n2 !== t2.length && (h.uint8array ? (i2 = t2.subarray(0, n2), this.leftOver = t2.subarray(n2, t2.length)) : (i2 = t2.slice(0, n2), this.leftOver = t2.slice(n2, t2.length))), this.push({ data: s.utf8decode(i2), meta: e2.meta });
        }, a.prototype.flush = function() {
          this.leftOver && this.leftOver.length && (this.push({ data: s.utf8decode(this.leftOver), meta: {} }), this.leftOver = null);
        }, s.Utf8DecodeWorker = a, o.inherits(l, n), l.prototype.processChunk = function(e2) {
          this.push({ data: s.utf8encode(e2.data), meta: e2.meta });
        }, s.Utf8EncodeWorker = l;
      }, { "./nodejsUtils": 14, "./stream/GenericWorker": 28, "./support": 30, "./utils": 32 }], 32: [function(e, t, a) {
        var o = e("./support"), h = e("./base64"), r = e("./nodejsUtils"), u = e("./external");
        function n(e2) {
          return e2;
        }
        function l(e2, t2) {
          for (var r2 = 0; r2 < e2.length; ++r2) t2[r2] = 255 & e2.charCodeAt(r2);
          return t2;
        }
        e("setimmediate"), a.newBlob = function(t2, r2) {
          a.checkSupport("blob");
          try {
            return new Blob([t2], { type: r2 });
          } catch (e2) {
            try {
              var n2 = new (self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder)();
              return n2.append(t2), n2.getBlob(r2);
            } catch (e3) {
              throw new Error("Bug : can't construct the Blob.");
            }
          }
        };
        var i = { stringifyByChunk: function(e2, t2, r2) {
          var n2 = [], i2 = 0, s2 = e2.length;
          if (s2 <= r2) return String.fromCharCode.apply(null, e2);
          for (; i2 < s2; ) "array" === t2 || "nodebuffer" === t2 ? n2.push(String.fromCharCode.apply(null, e2.slice(i2, Math.min(i2 + r2, s2)))) : n2.push(String.fromCharCode.apply(null, e2.subarray(i2, Math.min(i2 + r2, s2)))), i2 += r2;
          return n2.join("");
        }, stringifyByChar: function(e2) {
          for (var t2 = "", r2 = 0; r2 < e2.length; r2++) t2 += String.fromCharCode(e2[r2]);
          return t2;
        }, applyCanBeUsed: { uint8array: (function() {
          try {
            return o.uint8array && 1 === String.fromCharCode.apply(null, new Uint8Array(1)).length;
          } catch (e2) {
            return false;
          }
        })(), nodebuffer: (function() {
          try {
            return o.nodebuffer && 1 === String.fromCharCode.apply(null, r.allocBuffer(1)).length;
          } catch (e2) {
            return false;
          }
        })() } };
        function s(e2) {
          var t2 = 65536, r2 = a.getTypeOf(e2), n2 = true;
          if ("uint8array" === r2 ? n2 = i.applyCanBeUsed.uint8array : "nodebuffer" === r2 && (n2 = i.applyCanBeUsed.nodebuffer), n2) for (; 1 < t2; ) try {
            return i.stringifyByChunk(e2, r2, t2);
          } catch (e3) {
            t2 = Math.floor(t2 / 2);
          }
          return i.stringifyByChar(e2);
        }
        function f(e2, t2) {
          for (var r2 = 0; r2 < e2.length; r2++) t2[r2] = e2[r2];
          return t2;
        }
        a.applyFromCharCode = s;
        var c = {};
        c.string = { string: n, array: function(e2) {
          return l(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.string.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return l(e2, new Uint8Array(e2.length));
        }, nodebuffer: function(e2) {
          return l(e2, r.allocBuffer(e2.length));
        } }, c.array = { string: s, array: n, arraybuffer: function(e2) {
          return new Uint8Array(e2).buffer;
        }, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.arraybuffer = { string: function(e2) {
          return s(new Uint8Array(e2));
        }, array: function(e2) {
          return f(new Uint8Array(e2), new Array(e2.byteLength));
        }, arraybuffer: n, uint8array: function(e2) {
          return new Uint8Array(e2);
        }, nodebuffer: function(e2) {
          return r.newBufferFrom(new Uint8Array(e2));
        } }, c.uint8array = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return e2.buffer;
        }, uint8array: n, nodebuffer: function(e2) {
          return r.newBufferFrom(e2);
        } }, c.nodebuffer = { string: s, array: function(e2) {
          return f(e2, new Array(e2.length));
        }, arraybuffer: function(e2) {
          return c.nodebuffer.uint8array(e2).buffer;
        }, uint8array: function(e2) {
          return f(e2, new Uint8Array(e2.length));
        }, nodebuffer: n }, a.transformTo = function(e2, t2) {
          if (t2 = t2 || "", !e2) return t2;
          a.checkSupport(e2);
          var r2 = a.getTypeOf(t2);
          return c[r2][e2](t2);
        }, a.resolve = function(e2) {
          for (var t2 = e2.split("/"), r2 = [], n2 = 0; n2 < t2.length; n2++) {
            var i2 = t2[n2];
            "." === i2 || "" === i2 && 0 !== n2 && n2 !== t2.length - 1 || (".." === i2 ? r2.pop() : r2.push(i2));
          }
          return r2.join("/");
        }, a.getTypeOf = function(e2) {
          if ("string" == typeof e2) return "string";
          var t2 = Object.prototype.toString.call(e2);
          return "[object Array]" === t2 ? "array" : o.nodebuffer && r.isBuffer(e2) ? "nodebuffer" : o.uint8array && "[object Uint8Array]" === t2 ? "uint8array" : o.arraybuffer && "[object ArrayBuffer]" === t2 ? "arraybuffer" : void 0;
        }, a.checkSupport = function(e2) {
          if (!o[e2.toLowerCase()]) throw new Error(e2 + " is not supported by this platform");
        }, a.MAX_VALUE_16BITS = 65535, a.MAX_VALUE_32BITS = -1, a.pretty = function(e2) {
          var t2, r2, n2 = "";
          for (r2 = 0; r2 < (e2 || "").length; r2++) n2 += "\\x" + ((t2 = e2.charCodeAt(r2)) < 16 ? "0" : "") + t2.toString(16).toUpperCase();
          return n2;
        }, a.delay = function(e2, t2, r2) {
          setImmediate(function() {
            e2.apply(r2 || null, t2 || []);
          });
        }, a.inherits = function(e2, t2) {
          function r2() {
          }
          r2.prototype = t2.prototype, e2.prototype = new r2();
        }, a.extend = function() {
          var e2, t2, r2 = {};
          for (e2 = 0; e2 < arguments.length; e2++) for (t2 in arguments[e2]) Object.prototype.hasOwnProperty.call(arguments[e2], t2) && void 0 === r2[t2] && (r2[t2] = arguments[e2][t2]);
          return r2;
        }, a.prepareContent = function(r2, e2, n2, i2, s2) {
          return u.Promise.resolve(e2).then(function(n3) {
            return o.blob && (n3 instanceof Blob || -1 !== ["[object File]", "[object Blob]"].indexOf(Object.prototype.toString.call(n3))) ? void 0 !== Blob.prototype.arrayBuffer ? n3.arrayBuffer() : "undefined" != typeof FileReader ? new u.Promise(function(t2, r3) {
              var e3 = new FileReader();
              e3.onload = function(e4) {
                t2(e4.target.result);
              }, e3.onerror = function(e4) {
                r3(e4.target.error);
              }, e3.readAsArrayBuffer(n3);
            }) : u.Promise.reject(new Error(r2 + " is a Blob, but we have no way of reading it.")) : n3;
          }).then(function(e3) {
            var t2 = a.getTypeOf(e3);
            return t2 ? ("arraybuffer" === t2 ? e3 = a.transformTo("uint8array", e3) : "string" === t2 && (s2 ? e3 = h.decode(e3) : n2 && true !== i2 && (e3 = (function(e4) {
              return l(e4, o.uint8array ? new Uint8Array(e4.length) : new Array(e4.length));
            })(e3))), e3) : u.Promise.reject(new Error("Can't read the data of '" + r2 + "'. Is it in a supported JavaScript type (String, Blob, ArrayBuffer, etc) ?"));
          });
        };
      }, { "./base64": 1, "./external": 6, "./nodejsUtils": 14, "./support": 30, setimmediate: 54 }], 33: [function(e, t, r) {
        var n = e("./reader/readerFor"), i = e("./utils"), s = e("./signature"), a = e("./zipEntry"), o = e("./support");
        function h(e2) {
          this.files = [], this.loadOptions = e2;
        }
        h.prototype = { checkSignature: function(e2) {
          if (!this.reader.readAndCheckSignature(e2)) {
            this.reader.index -= 4;
            var t2 = this.reader.readString(4);
            throw new Error("Corrupted zip or bug: unexpected signature (" + i.pretty(t2) + ", expected " + i.pretty(e2) + ")");
          }
        }, isSignature: function(e2, t2) {
          var r2 = this.reader.index;
          this.reader.setIndex(e2);
          var n2 = this.reader.readString(4) === t2;
          return this.reader.setIndex(r2), n2;
        }, readBlockEndOfCentral: function() {
          this.diskNumber = this.reader.readInt(2), this.diskWithCentralDirStart = this.reader.readInt(2), this.centralDirRecordsOnThisDisk = this.reader.readInt(2), this.centralDirRecords = this.reader.readInt(2), this.centralDirSize = this.reader.readInt(4), this.centralDirOffset = this.reader.readInt(4), this.zipCommentLength = this.reader.readInt(2);
          var e2 = this.reader.readData(this.zipCommentLength), t2 = o.uint8array ? "uint8array" : "array", r2 = i.transformTo(t2, e2);
          this.zipComment = this.loadOptions.decodeFileName(r2);
        }, readBlockZip64EndOfCentral: function() {
          this.zip64EndOfCentralSize = this.reader.readInt(8), this.reader.skip(4), this.diskNumber = this.reader.readInt(4), this.diskWithCentralDirStart = this.reader.readInt(4), this.centralDirRecordsOnThisDisk = this.reader.readInt(8), this.centralDirRecords = this.reader.readInt(8), this.centralDirSize = this.reader.readInt(8), this.centralDirOffset = this.reader.readInt(8), this.zip64ExtensibleData = {};
          for (var e2, t2, r2, n2 = this.zip64EndOfCentralSize - 44; 0 < n2; ) e2 = this.reader.readInt(2), t2 = this.reader.readInt(4), r2 = this.reader.readData(t2), this.zip64ExtensibleData[e2] = { id: e2, length: t2, value: r2 };
        }, readBlockZip64EndOfCentralLocator: function() {
          if (this.diskWithZip64CentralDirStart = this.reader.readInt(4), this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8), this.disksCount = this.reader.readInt(4), 1 < this.disksCount) throw new Error("Multi-volumes zip are not supported");
        }, readLocalFiles: function() {
          var e2, t2;
          for (e2 = 0; e2 < this.files.length; e2++) t2 = this.files[e2], this.reader.setIndex(t2.localHeaderOffset), this.checkSignature(s.LOCAL_FILE_HEADER), t2.readLocalPart(this.reader), t2.handleUTF8(), t2.processAttributes();
        }, readCentralDir: function() {
          var e2;
          for (this.reader.setIndex(this.centralDirOffset); this.reader.readAndCheckSignature(s.CENTRAL_FILE_HEADER); ) (e2 = new a({ zip64: this.zip64 }, this.loadOptions)).readCentralPart(this.reader), this.files.push(e2);
          if (this.centralDirRecords !== this.files.length && 0 !== this.centralDirRecords && 0 === this.files.length) throw new Error("Corrupted zip or bug: expected " + this.centralDirRecords + " records in central dir, got " + this.files.length);
        }, readEndOfCentral: function() {
          var e2 = this.reader.lastIndexOfSignature(s.CENTRAL_DIRECTORY_END);
          if (e2 < 0) throw !this.isSignature(0, s.LOCAL_FILE_HEADER) ? new Error("Can't find end of central directory : is this a zip file ? If it is, see https://stuk.github.io/jszip/documentation/howto/read_zip.html") : new Error("Corrupted zip: can't find end of central directory");
          this.reader.setIndex(e2);
          var t2 = e2;
          if (this.checkSignature(s.CENTRAL_DIRECTORY_END), this.readBlockEndOfCentral(), this.diskNumber === i.MAX_VALUE_16BITS || this.diskWithCentralDirStart === i.MAX_VALUE_16BITS || this.centralDirRecordsOnThisDisk === i.MAX_VALUE_16BITS || this.centralDirRecords === i.MAX_VALUE_16BITS || this.centralDirSize === i.MAX_VALUE_32BITS || this.centralDirOffset === i.MAX_VALUE_32BITS) {
            if (this.zip64 = true, (e2 = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR)) < 0) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory locator");
            if (this.reader.setIndex(e2), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_LOCATOR), this.readBlockZip64EndOfCentralLocator(), !this.isSignature(this.relativeOffsetEndOfZip64CentralDir, s.ZIP64_CENTRAL_DIRECTORY_END) && (this.relativeOffsetEndOfZip64CentralDir = this.reader.lastIndexOfSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.relativeOffsetEndOfZip64CentralDir < 0)) throw new Error("Corrupted zip: can't find the ZIP64 end of central directory");
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir), this.checkSignature(s.ZIP64_CENTRAL_DIRECTORY_END), this.readBlockZip64EndOfCentral();
          }
          var r2 = this.centralDirOffset + this.centralDirSize;
          this.zip64 && (r2 += 20, r2 += 12 + this.zip64EndOfCentralSize);
          var n2 = t2 - r2;
          if (0 < n2) this.isSignature(t2, s.CENTRAL_FILE_HEADER) || (this.reader.zero = n2);
          else if (n2 < 0) throw new Error("Corrupted zip: missing " + Math.abs(n2) + " bytes.");
        }, prepareReader: function(e2) {
          this.reader = n(e2);
        }, load: function(e2) {
          this.prepareReader(e2), this.readEndOfCentral(), this.readCentralDir(), this.readLocalFiles();
        } }, t.exports = h;
      }, { "./reader/readerFor": 22, "./signature": 23, "./support": 30, "./utils": 32, "./zipEntry": 34 }], 34: [function(e, t, r) {
        var n = e("./reader/readerFor"), s = e("./utils"), i = e("./compressedObject"), a = e("./crc32"), o = e("./utf8"), h = e("./compressions"), u = e("./support");
        function l(e2, t2) {
          this.options = e2, this.loadOptions = t2;
        }
        l.prototype = { isEncrypted: function() {
          return 1 == (1 & this.bitFlag);
        }, useUTF8: function() {
          return 2048 == (2048 & this.bitFlag);
        }, readLocalPart: function(e2) {
          var t2, r2;
          if (e2.skip(22), this.fileNameLength = e2.readInt(2), r2 = e2.readInt(2), this.fileName = e2.readData(this.fileNameLength), e2.skip(r2), -1 === this.compressedSize || -1 === this.uncompressedSize) throw new Error("Bug or corrupted zip : didn't get enough information from the central directory (compressedSize === -1 || uncompressedSize === -1)");
          if (null === (t2 = (function(e3) {
            for (var t3 in h) if (Object.prototype.hasOwnProperty.call(h, t3) && h[t3].magic === e3) return h[t3];
            return null;
          })(this.compressionMethod))) throw new Error("Corrupted zip : compression " + s.pretty(this.compressionMethod) + " unknown (inner file : " + s.transformTo("string", this.fileName) + ")");
          this.decompressed = new i(this.compressedSize, this.uncompressedSize, this.crc32, t2, e2.readData(this.compressedSize));
        }, readCentralPart: function(e2) {
          this.versionMadeBy = e2.readInt(2), e2.skip(2), this.bitFlag = e2.readInt(2), this.compressionMethod = e2.readString(2), this.date = e2.readDate(), this.crc32 = e2.readInt(4), this.compressedSize = e2.readInt(4), this.uncompressedSize = e2.readInt(4);
          var t2 = e2.readInt(2);
          if (this.extraFieldsLength = e2.readInt(2), this.fileCommentLength = e2.readInt(2), this.diskNumberStart = e2.readInt(2), this.internalFileAttributes = e2.readInt(2), this.externalFileAttributes = e2.readInt(4), this.localHeaderOffset = e2.readInt(4), this.isEncrypted()) throw new Error("Encrypted zip are not supported");
          e2.skip(t2), this.readExtraFields(e2), this.parseZIP64ExtraField(e2), this.fileComment = e2.readData(this.fileCommentLength);
        }, processAttributes: function() {
          this.unixPermissions = null, this.dosPermissions = null;
          var e2 = this.versionMadeBy >> 8;
          this.dir = !!(16 & this.externalFileAttributes), 0 == e2 && (this.dosPermissions = 63 & this.externalFileAttributes), 3 == e2 && (this.unixPermissions = this.externalFileAttributes >> 16 & 65535), this.dir || "/" !== this.fileNameStr.slice(-1) || (this.dir = true);
        }, parseZIP64ExtraField: function() {
          if (this.extraFields[1]) {
            var e2 = n(this.extraFields[1].value);
            this.uncompressedSize === s.MAX_VALUE_32BITS && (this.uncompressedSize = e2.readInt(8)), this.compressedSize === s.MAX_VALUE_32BITS && (this.compressedSize = e2.readInt(8)), this.localHeaderOffset === s.MAX_VALUE_32BITS && (this.localHeaderOffset = e2.readInt(8)), this.diskNumberStart === s.MAX_VALUE_32BITS && (this.diskNumberStart = e2.readInt(4));
          }
        }, readExtraFields: function(e2) {
          var t2, r2, n2, i2 = e2.index + this.extraFieldsLength;
          for (this.extraFields || (this.extraFields = {}); e2.index + 4 < i2; ) t2 = e2.readInt(2), r2 = e2.readInt(2), n2 = e2.readData(r2), this.extraFields[t2] = { id: t2, length: r2, value: n2 };
          e2.setIndex(i2);
        }, handleUTF8: function() {
          var e2 = u.uint8array ? "uint8array" : "array";
          if (this.useUTF8()) this.fileNameStr = o.utf8decode(this.fileName), this.fileCommentStr = o.utf8decode(this.fileComment);
          else {
            var t2 = this.findExtraFieldUnicodePath();
            if (null !== t2) this.fileNameStr = t2;
            else {
              var r2 = s.transformTo(e2, this.fileName);
              this.fileNameStr = this.loadOptions.decodeFileName(r2);
            }
            var n2 = this.findExtraFieldUnicodeComment();
            if (null !== n2) this.fileCommentStr = n2;
            else {
              var i2 = s.transformTo(e2, this.fileComment);
              this.fileCommentStr = this.loadOptions.decodeFileName(i2);
            }
          }
        }, findExtraFieldUnicodePath: function() {
          var e2 = this.extraFields[28789];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileName) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        }, findExtraFieldUnicodeComment: function() {
          var e2 = this.extraFields[25461];
          if (e2) {
            var t2 = n(e2.value);
            return 1 !== t2.readInt(1) ? null : a(this.fileComment) !== t2.readInt(4) ? null : o.utf8decode(t2.readData(e2.length - 5));
          }
          return null;
        } }, t.exports = l;
      }, { "./compressedObject": 2, "./compressions": 3, "./crc32": 4, "./reader/readerFor": 22, "./support": 30, "./utf8": 31, "./utils": 32 }], 35: [function(e, t, r) {
        function n(e2, t2, r2) {
          this.name = e2, this.dir = r2.dir, this.date = r2.date, this.comment = r2.comment, this.unixPermissions = r2.unixPermissions, this.dosPermissions = r2.dosPermissions, this._data = t2, this._dataBinary = r2.binary, this.options = { compression: r2.compression, compressionOptions: r2.compressionOptions };
        }
        var s = e("./stream/StreamHelper"), i = e("./stream/DataWorker"), a = e("./utf8"), o = e("./compressedObject"), h = e("./stream/GenericWorker");
        n.prototype = { internalStream: function(e2) {
          var t2 = null, r2 = "string";
          try {
            if (!e2) throw new Error("No output type specified.");
            var n2 = "string" === (r2 = e2.toLowerCase()) || "text" === r2;
            "binarystring" !== r2 && "text" !== r2 || (r2 = "string"), t2 = this._decompressWorker();
            var i2 = !this._dataBinary;
            i2 && !n2 && (t2 = t2.pipe(new a.Utf8EncodeWorker())), !i2 && n2 && (t2 = t2.pipe(new a.Utf8DecodeWorker()));
          } catch (e3) {
            (t2 = new h("error")).error(e3);
          }
          return new s(t2, r2, "");
        }, async: function(e2, t2) {
          return this.internalStream(e2).accumulate(t2);
        }, nodeStream: function(e2, t2) {
          return this.internalStream(e2 || "nodebuffer").toNodejsStream(t2);
        }, _compressWorker: function(e2, t2) {
          if (this._data instanceof o && this._data.compression.magic === e2.magic) return this._data.getCompressedWorker();
          var r2 = this._decompressWorker();
          return this._dataBinary || (r2 = r2.pipe(new a.Utf8EncodeWorker())), o.createWorkerFrom(r2, e2, t2);
        }, _decompressWorker: function() {
          return this._data instanceof o ? this._data.getContentWorker() : this._data instanceof h ? this._data : new i(this._data);
        } };
        for (var u = ["asText", "asBinary", "asNodeBuffer", "asUint8Array", "asArrayBuffer"], l = function() {
          throw new Error("This method has been removed in JSZip 3.0, please check the upgrade guide.");
        }, f = 0; f < u.length; f++) n.prototype[u[f]] = l;
        t.exports = n;
      }, { "./compressedObject": 2, "./stream/DataWorker": 27, "./stream/GenericWorker": 28, "./stream/StreamHelper": 29, "./utf8": 31 }], 36: [function(e, l, t) {
        (function(t2) {
          var r, n, e2 = t2.MutationObserver || t2.WebKitMutationObserver;
          if (e2) {
            var i = 0, s = new e2(u), a = t2.document.createTextNode("");
            s.observe(a, { characterData: true }), r = function() {
              a.data = i = ++i % 2;
            };
          } else if (t2.setImmediate || void 0 === t2.MessageChannel) r = "document" in t2 && "onreadystatechange" in t2.document.createElement("script") ? function() {
            var e3 = t2.document.createElement("script");
            e3.onreadystatechange = function() {
              u(), e3.onreadystatechange = null, e3.parentNode.removeChild(e3), e3 = null;
            }, t2.document.documentElement.appendChild(e3);
          } : function() {
            setTimeout(u, 0);
          };
          else {
            var o = new t2.MessageChannel();
            o.port1.onmessage = u, r = function() {
              o.port2.postMessage(0);
            };
          }
          var h = [];
          function u() {
            var e3, t3;
            n = true;
            for (var r2 = h.length; r2; ) {
              for (t3 = h, h = [], e3 = -1; ++e3 < r2; ) t3[e3]();
              r2 = h.length;
            }
            n = false;
          }
          l.exports = function(e3) {
            1 !== h.push(e3) || n || r();
          };
        }).call(this, "undefined" != typeof commonjsGlobal ? commonjsGlobal : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}], 37: [function(e, t, r) {
        var i = e("immediate");
        function u() {
        }
        var l = {}, s = ["REJECTED"], a = ["FULFILLED"], n = ["PENDING"];
        function o(e2) {
          if ("function" != typeof e2) throw new TypeError("resolver must be a function");
          this.state = n, this.queue = [], this.outcome = void 0, e2 !== u && d(this, e2);
        }
        function h(e2, t2, r2) {
          this.promise = e2, "function" == typeof t2 && (this.onFulfilled = t2, this.callFulfilled = this.otherCallFulfilled), "function" == typeof r2 && (this.onRejected = r2, this.callRejected = this.otherCallRejected);
        }
        function f(t2, r2, n2) {
          i(function() {
            var e2;
            try {
              e2 = r2(n2);
            } catch (e3) {
              return l.reject(t2, e3);
            }
            e2 === t2 ? l.reject(t2, new TypeError("Cannot resolve promise with itself")) : l.resolve(t2, e2);
          });
        }
        function c(e2) {
          var t2 = e2 && e2.then;
          if (e2 && ("object" == typeof e2 || "function" == typeof e2) && "function" == typeof t2) return function() {
            t2.apply(e2, arguments);
          };
        }
        function d(t2, e2) {
          var r2 = false;
          function n2(e3) {
            r2 || (r2 = true, l.reject(t2, e3));
          }
          function i2(e3) {
            r2 || (r2 = true, l.resolve(t2, e3));
          }
          var s2 = p(function() {
            e2(i2, n2);
          });
          "error" === s2.status && n2(s2.value);
        }
        function p(e2, t2) {
          var r2 = {};
          try {
            r2.value = e2(t2), r2.status = "success";
          } catch (e3) {
            r2.status = "error", r2.value = e3;
          }
          return r2;
        }
        (t.exports = o).prototype.finally = function(t2) {
          if ("function" != typeof t2) return this;
          var r2 = this.constructor;
          return this.then(function(e2) {
            return r2.resolve(t2()).then(function() {
              return e2;
            });
          }, function(e2) {
            return r2.resolve(t2()).then(function() {
              throw e2;
            });
          });
        }, o.prototype.catch = function(e2) {
          return this.then(null, e2);
        }, o.prototype.then = function(e2, t2) {
          if ("function" != typeof e2 && this.state === a || "function" != typeof t2 && this.state === s) return this;
          var r2 = new this.constructor(u);
          this.state !== n ? f(r2, this.state === a ? e2 : t2, this.outcome) : this.queue.push(new h(r2, e2, t2));
          return r2;
        }, h.prototype.callFulfilled = function(e2) {
          l.resolve(this.promise, e2);
        }, h.prototype.otherCallFulfilled = function(e2) {
          f(this.promise, this.onFulfilled, e2);
        }, h.prototype.callRejected = function(e2) {
          l.reject(this.promise, e2);
        }, h.prototype.otherCallRejected = function(e2) {
          f(this.promise, this.onRejected, e2);
        }, l.resolve = function(e2, t2) {
          var r2 = p(c, t2);
          if ("error" === r2.status) return l.reject(e2, r2.value);
          var n2 = r2.value;
          if (n2) d(e2, n2);
          else {
            e2.state = a, e2.outcome = t2;
            for (var i2 = -1, s2 = e2.queue.length; ++i2 < s2; ) e2.queue[i2].callFulfilled(t2);
          }
          return e2;
        }, l.reject = function(e2, t2) {
          e2.state = s, e2.outcome = t2;
          for (var r2 = -1, n2 = e2.queue.length; ++r2 < n2; ) e2.queue[r2].callRejected(t2);
          return e2;
        }, o.resolve = function(e2) {
          if (e2 instanceof this) return e2;
          return l.resolve(new this(u), e2);
        }, o.reject = function(e2) {
          var t2 = new this(u);
          return l.reject(t2, e2);
        }, o.all = function(e2) {
          var r2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
          var n2 = e2.length, i2 = false;
          if (!n2) return this.resolve([]);
          var s2 = new Array(n2), a2 = 0, t2 = -1, o2 = new this(u);
          for (; ++t2 < n2; ) h2(e2[t2], t2);
          return o2;
          function h2(e3, t3) {
            r2.resolve(e3).then(function(e4) {
              s2[t3] = e4, ++a2 !== n2 || i2 || (i2 = true, l.resolve(o2, s2));
            }, function(e4) {
              i2 || (i2 = true, l.reject(o2, e4));
            });
          }
        }, o.race = function(e2) {
          var t2 = this;
          if ("[object Array]" !== Object.prototype.toString.call(e2)) return this.reject(new TypeError("must be an array"));
          var r2 = e2.length, n2 = false;
          if (!r2) return this.resolve([]);
          var i2 = -1, s2 = new this(u);
          for (; ++i2 < r2; ) a2 = e2[i2], t2.resolve(a2).then(function(e3) {
            n2 || (n2 = true, l.resolve(s2, e3));
          }, function(e3) {
            n2 || (n2 = true, l.reject(s2, e3));
          });
          var a2;
          return s2;
        };
      }, { immediate: 36 }], 38: [function(e, t, r) {
        var n = {};
        (0, e("./lib/utils/common").assign)(n, e("./lib/deflate"), e("./lib/inflate"), e("./lib/zlib/constants")), t.exports = n;
      }, { "./lib/deflate": 39, "./lib/inflate": 40, "./lib/utils/common": 41, "./lib/zlib/constants": 44 }], 39: [function(e, t, r) {
        var a = e("./zlib/deflate"), o = e("./utils/common"), h = e("./utils/strings"), i = e("./zlib/messages"), s = e("./zlib/zstream"), u = Object.prototype.toString, l = 0, f = -1, c = 0, d = 8;
        function p(e2) {
          if (!(this instanceof p)) return new p(e2);
          this.options = o.assign({ level: f, method: d, chunkSize: 16384, windowBits: 15, memLevel: 8, strategy: c, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 < t2.windowBits ? t2.windowBits = -t2.windowBits : t2.gzip && 0 < t2.windowBits && t2.windowBits < 16 && (t2.windowBits += 16), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new s(), this.strm.avail_out = 0;
          var r2 = a.deflateInit2(this.strm, t2.level, t2.method, t2.windowBits, t2.memLevel, t2.strategy);
          if (r2 !== l) throw new Error(i[r2]);
          if (t2.header && a.deflateSetHeader(this.strm, t2.header), t2.dictionary) {
            var n2;
            if (n2 = "string" == typeof t2.dictionary ? h.string2buf(t2.dictionary) : "[object ArrayBuffer]" === u.call(t2.dictionary) ? new Uint8Array(t2.dictionary) : t2.dictionary, (r2 = a.deflateSetDictionary(this.strm, n2)) !== l) throw new Error(i[r2]);
            this._dict_set = true;
          }
        }
        function n(e2, t2) {
          var r2 = new p(t2);
          if (r2.push(e2, true), r2.err) throw r2.msg || i[r2.err];
          return r2.result;
        }
        p.prototype.push = function(e2, t2) {
          var r2, n2, i2 = this.strm, s2 = this.options.chunkSize;
          if (this.ended) return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? 4 : 0, "string" == typeof e2 ? i2.input = h.string2buf(e2) : "[object ArrayBuffer]" === u.call(e2) ? i2.input = new Uint8Array(e2) : i2.input = e2, i2.next_in = 0, i2.avail_in = i2.input.length;
          do {
            if (0 === i2.avail_out && (i2.output = new o.Buf8(s2), i2.next_out = 0, i2.avail_out = s2), 1 !== (r2 = a.deflate(i2, n2)) && r2 !== l) return this.onEnd(r2), !(this.ended = true);
            0 !== i2.avail_out && (0 !== i2.avail_in || 4 !== n2 && 2 !== n2) || ("string" === this.options.to ? this.onData(h.buf2binstring(o.shrinkBuf(i2.output, i2.next_out))) : this.onData(o.shrinkBuf(i2.output, i2.next_out)));
          } while ((0 < i2.avail_in || 0 === i2.avail_out) && 1 !== r2);
          return 4 === n2 ? (r2 = a.deflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === l) : 2 !== n2 || (this.onEnd(l), !(i2.avail_out = 0));
        }, p.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, p.prototype.onEnd = function(e2) {
          e2 === l && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = o.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Deflate = p, r.deflate = n, r.deflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, n(e2, t2);
        }, r.gzip = function(e2, t2) {
          return (t2 = t2 || {}).gzip = true, n(e2, t2);
        };
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/deflate": 46, "./zlib/messages": 51, "./zlib/zstream": 53 }], 40: [function(e, t, r) {
        var c = e("./zlib/inflate"), d = e("./utils/common"), p = e("./utils/strings"), m = e("./zlib/constants"), n = e("./zlib/messages"), i = e("./zlib/zstream"), s = e("./zlib/gzheader"), _2 = Object.prototype.toString;
        function a(e2) {
          if (!(this instanceof a)) return new a(e2);
          this.options = d.assign({ chunkSize: 16384, windowBits: 0, to: "" }, e2 || {});
          var t2 = this.options;
          t2.raw && 0 <= t2.windowBits && t2.windowBits < 16 && (t2.windowBits = -t2.windowBits, 0 === t2.windowBits && (t2.windowBits = -15)), !(0 <= t2.windowBits && t2.windowBits < 16) || e2 && e2.windowBits || (t2.windowBits += 32), 15 < t2.windowBits && t2.windowBits < 48 && 0 == (15 & t2.windowBits) && (t2.windowBits |= 15), this.err = 0, this.msg = "", this.ended = false, this.chunks = [], this.strm = new i(), this.strm.avail_out = 0;
          var r2 = c.inflateInit2(this.strm, t2.windowBits);
          if (r2 !== m.Z_OK) throw new Error(n[r2]);
          this.header = new s(), c.inflateGetHeader(this.strm, this.header);
        }
        function o(e2, t2) {
          var r2 = new a(t2);
          if (r2.push(e2, true), r2.err) throw r2.msg || n[r2.err];
          return r2.result;
        }
        a.prototype.push = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h = this.strm, u = this.options.chunkSize, l = this.options.dictionary, f = false;
          if (this.ended) return false;
          n2 = t2 === ~~t2 ? t2 : true === t2 ? m.Z_FINISH : m.Z_NO_FLUSH, "string" == typeof e2 ? h.input = p.binstring2buf(e2) : "[object ArrayBuffer]" === _2.call(e2) ? h.input = new Uint8Array(e2) : h.input = e2, h.next_in = 0, h.avail_in = h.input.length;
          do {
            if (0 === h.avail_out && (h.output = new d.Buf8(u), h.next_out = 0, h.avail_out = u), (r2 = c.inflate(h, m.Z_NO_FLUSH)) === m.Z_NEED_DICT && l && (o2 = "string" == typeof l ? p.string2buf(l) : "[object ArrayBuffer]" === _2.call(l) ? new Uint8Array(l) : l, r2 = c.inflateSetDictionary(this.strm, o2)), r2 === m.Z_BUF_ERROR && true === f && (r2 = m.Z_OK, f = false), r2 !== m.Z_STREAM_END && r2 !== m.Z_OK) return this.onEnd(r2), !(this.ended = true);
            h.next_out && (0 !== h.avail_out && r2 !== m.Z_STREAM_END && (0 !== h.avail_in || n2 !== m.Z_FINISH && n2 !== m.Z_SYNC_FLUSH) || ("string" === this.options.to ? (i2 = p.utf8border(h.output, h.next_out), s2 = h.next_out - i2, a2 = p.buf2string(h.output, i2), h.next_out = s2, h.avail_out = u - s2, s2 && d.arraySet(h.output, h.output, i2, s2, 0), this.onData(a2)) : this.onData(d.shrinkBuf(h.output, h.next_out)))), 0 === h.avail_in && 0 === h.avail_out && (f = true);
          } while ((0 < h.avail_in || 0 === h.avail_out) && r2 !== m.Z_STREAM_END);
          return r2 === m.Z_STREAM_END && (n2 = m.Z_FINISH), n2 === m.Z_FINISH ? (r2 = c.inflateEnd(this.strm), this.onEnd(r2), this.ended = true, r2 === m.Z_OK) : n2 !== m.Z_SYNC_FLUSH || (this.onEnd(m.Z_OK), !(h.avail_out = 0));
        }, a.prototype.onData = function(e2) {
          this.chunks.push(e2);
        }, a.prototype.onEnd = function(e2) {
          e2 === m.Z_OK && ("string" === this.options.to ? this.result = this.chunks.join("") : this.result = d.flattenChunks(this.chunks)), this.chunks = [], this.err = e2, this.msg = this.strm.msg;
        }, r.Inflate = a, r.inflate = o, r.inflateRaw = function(e2, t2) {
          return (t2 = t2 || {}).raw = true, o(e2, t2);
        }, r.ungzip = o;
      }, { "./utils/common": 41, "./utils/strings": 42, "./zlib/constants": 44, "./zlib/gzheader": 47, "./zlib/inflate": 49, "./zlib/messages": 51, "./zlib/zstream": 53 }], 41: [function(e, t, r) {
        var n = "undefined" != typeof Uint8Array && "undefined" != typeof Uint16Array && "undefined" != typeof Int32Array;
        r.assign = function(e2) {
          for (var t2 = Array.prototype.slice.call(arguments, 1); t2.length; ) {
            var r2 = t2.shift();
            if (r2) {
              if ("object" != typeof r2) throw new TypeError(r2 + "must be non-object");
              for (var n2 in r2) r2.hasOwnProperty(n2) && (e2[n2] = r2[n2]);
            }
          }
          return e2;
        }, r.shrinkBuf = function(e2, t2) {
          return e2.length === t2 ? e2 : e2.subarray ? e2.subarray(0, t2) : (e2.length = t2, e2);
        };
        var i = { arraySet: function(e2, t2, r2, n2, i2) {
          if (t2.subarray && e2.subarray) e2.set(t2.subarray(r2, r2 + n2), i2);
          else for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          var t2, r2, n2, i2, s2, a;
          for (t2 = n2 = 0, r2 = e2.length; t2 < r2; t2++) n2 += e2[t2].length;
          for (a = new Uint8Array(n2), t2 = i2 = 0, r2 = e2.length; t2 < r2; t2++) s2 = e2[t2], a.set(s2, i2), i2 += s2.length;
          return a;
        } }, s = { arraySet: function(e2, t2, r2, n2, i2) {
          for (var s2 = 0; s2 < n2; s2++) e2[i2 + s2] = t2[r2 + s2];
        }, flattenChunks: function(e2) {
          return [].concat.apply([], e2);
        } };
        r.setTyped = function(e2) {
          e2 ? (r.Buf8 = Uint8Array, r.Buf16 = Uint16Array, r.Buf32 = Int32Array, r.assign(r, i)) : (r.Buf8 = Array, r.Buf16 = Array, r.Buf32 = Array, r.assign(r, s));
        }, r.setTyped(n);
      }, {}], 42: [function(e, t, r) {
        var h = e("./common"), i = true, s = true;
        try {
          String.fromCharCode.apply(null, [0]);
        } catch (e2) {
          i = false;
        }
        try {
          String.fromCharCode.apply(null, new Uint8Array(1));
        } catch (e2) {
          s = false;
        }
        for (var u = new h.Buf8(256), n = 0; n < 256; n++) u[n] = 252 <= n ? 6 : 248 <= n ? 5 : 240 <= n ? 4 : 224 <= n ? 3 : 192 <= n ? 2 : 1;
        function l(e2, t2) {
          if (t2 < 65537 && (e2.subarray && s || !e2.subarray && i)) return String.fromCharCode.apply(null, h.shrinkBuf(e2, t2));
          for (var r2 = "", n2 = 0; n2 < t2; n2++) r2 += String.fromCharCode(e2[n2]);
          return r2;
        }
        u[254] = u[254] = 1, r.string2buf = function(e2) {
          var t2, r2, n2, i2, s2, a = e2.length, o = 0;
          for (i2 = 0; i2 < a; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), o += r2 < 128 ? 1 : r2 < 2048 ? 2 : r2 < 65536 ? 3 : 4;
          for (t2 = new h.Buf8(o), i2 = s2 = 0; s2 < o; i2++) 55296 == (64512 & (r2 = e2.charCodeAt(i2))) && i2 + 1 < a && 56320 == (64512 & (n2 = e2.charCodeAt(i2 + 1))) && (r2 = 65536 + (r2 - 55296 << 10) + (n2 - 56320), i2++), r2 < 128 ? t2[s2++] = r2 : (r2 < 2048 ? t2[s2++] = 192 | r2 >>> 6 : (r2 < 65536 ? t2[s2++] = 224 | r2 >>> 12 : (t2[s2++] = 240 | r2 >>> 18, t2[s2++] = 128 | r2 >>> 12 & 63), t2[s2++] = 128 | r2 >>> 6 & 63), t2[s2++] = 128 | 63 & r2);
          return t2;
        }, r.buf2binstring = function(e2) {
          return l(e2, e2.length);
        }, r.binstring2buf = function(e2) {
          for (var t2 = new h.Buf8(e2.length), r2 = 0, n2 = t2.length; r2 < n2; r2++) t2[r2] = e2.charCodeAt(r2);
          return t2;
        }, r.buf2string = function(e2, t2) {
          var r2, n2, i2, s2, a = t2 || e2.length, o = new Array(2 * a);
          for (r2 = n2 = 0; r2 < a; ) if ((i2 = e2[r2++]) < 128) o[n2++] = i2;
          else if (4 < (s2 = u[i2])) o[n2++] = 65533, r2 += s2 - 1;
          else {
            for (i2 &= 2 === s2 ? 31 : 3 === s2 ? 15 : 7; 1 < s2 && r2 < a; ) i2 = i2 << 6 | 63 & e2[r2++], s2--;
            1 < s2 ? o[n2++] = 65533 : i2 < 65536 ? o[n2++] = i2 : (i2 -= 65536, o[n2++] = 55296 | i2 >> 10 & 1023, o[n2++] = 56320 | 1023 & i2);
          }
          return l(o, n2);
        }, r.utf8border = function(e2, t2) {
          var r2;
          for ((t2 = t2 || e2.length) > e2.length && (t2 = e2.length), r2 = t2 - 1; 0 <= r2 && 128 == (192 & e2[r2]); ) r2--;
          return r2 < 0 ? t2 : 0 === r2 ? t2 : r2 + u[e2[r2]] > t2 ? r2 : t2;
        };
      }, { "./common": 41 }], 43: [function(e, t, r) {
        t.exports = function(e2, t2, r2, n) {
          for (var i = 65535 & e2 | 0, s = e2 >>> 16 & 65535 | 0, a = 0; 0 !== r2; ) {
            for (r2 -= a = 2e3 < r2 ? 2e3 : r2; s = s + (i = i + t2[n++] | 0) | 0, --a; ) ;
            i %= 65521, s %= 65521;
          }
          return i | s << 16 | 0;
        };
      }, {}], 44: [function(e, t, r) {
        t.exports = { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_TREES: 6, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_BUF_ERROR: -5, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, Z_BINARY: 0, Z_TEXT: 1, Z_UNKNOWN: 2, Z_DEFLATED: 8 };
      }, {}], 45: [function(e, t, r) {
        var o = (function() {
          for (var e2, t2 = [], r2 = 0; r2 < 256; r2++) {
            e2 = r2;
            for (var n = 0; n < 8; n++) e2 = 1 & e2 ? 3988292384 ^ e2 >>> 1 : e2 >>> 1;
            t2[r2] = e2;
          }
          return t2;
        })();
        t.exports = function(e2, t2, r2, n) {
          var i = o, s = n + r2;
          e2 ^= -1;
          for (var a = n; a < s; a++) e2 = e2 >>> 8 ^ i[255 & (e2 ^ t2[a])];
          return -1 ^ e2;
        };
      }, {}], 46: [function(e, t, r) {
        var h, c = e("../utils/common"), u = e("./trees"), d = e("./adler32"), p = e("./crc32"), n = e("./messages"), l = 0, f = 4, m = 0, _2 = -2, g = -1, b = 4, i = 2, v = 8, y = 9, s = 286, a = 30, o = 19, w = 2 * s + 1, k = 15, x = 3, S = 258, z = S + x + 1, C = 42, E = 113, A = 1, I = 2, O = 3, B = 4;
        function R(e2, t2) {
          return e2.msg = n[t2], t2;
        }
        function T(e2) {
          return (e2 << 1) - (4 < e2 ? 9 : 0);
        }
        function D(e2) {
          for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
        }
        function F(e2) {
          var t2 = e2.state, r2 = t2.pending;
          r2 > e2.avail_out && (r2 = e2.avail_out), 0 !== r2 && (c.arraySet(e2.output, t2.pending_buf, t2.pending_out, r2, e2.next_out), e2.next_out += r2, t2.pending_out += r2, e2.total_out += r2, e2.avail_out -= r2, t2.pending -= r2, 0 === t2.pending && (t2.pending_out = 0));
        }
        function N(e2, t2) {
          u._tr_flush_block(e2, 0 <= e2.block_start ? e2.block_start : -1, e2.strstart - e2.block_start, t2), e2.block_start = e2.strstart, F(e2.strm);
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = t2;
        }
        function P(e2, t2) {
          e2.pending_buf[e2.pending++] = t2 >>> 8 & 255, e2.pending_buf[e2.pending++] = 255 & t2;
        }
        function L(e2, t2) {
          var r2, n2, i2 = e2.max_chain_length, s2 = e2.strstart, a2 = e2.prev_length, o2 = e2.nice_match, h2 = e2.strstart > e2.w_size - z ? e2.strstart - (e2.w_size - z) : 0, u2 = e2.window, l2 = e2.w_mask, f2 = e2.prev, c2 = e2.strstart + S, d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
          e2.prev_length >= e2.good_match && (i2 >>= 2), o2 > e2.lookahead && (o2 = e2.lookahead);
          do {
            if (u2[(r2 = t2) + a2] === p2 && u2[r2 + a2 - 1] === d2 && u2[r2] === u2[s2] && u2[++r2] === u2[s2 + 1]) {
              s2 += 2, r2++;
              do {
              } while (u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && u2[++s2] === u2[++r2] && s2 < c2);
              if (n2 = S - (c2 - s2), s2 = c2 - S, a2 < n2) {
                if (e2.match_start = t2, o2 <= (a2 = n2)) break;
                d2 = u2[s2 + a2 - 1], p2 = u2[s2 + a2];
              }
            }
          } while ((t2 = f2[t2 & l2]) > h2 && 0 != --i2);
          return a2 <= e2.lookahead ? a2 : e2.lookahead;
        }
        function j(e2) {
          var t2, r2, n2, i2, s2, a2, o2, h2, u2, l2, f2 = e2.w_size;
          do {
            if (i2 = e2.window_size - e2.lookahead - e2.strstart, e2.strstart >= f2 + (f2 - z)) {
              for (c.arraySet(e2.window, e2.window, f2, f2, 0), e2.match_start -= f2, e2.strstart -= f2, e2.block_start -= f2, t2 = r2 = e2.hash_size; n2 = e2.head[--t2], e2.head[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
              for (t2 = r2 = f2; n2 = e2.prev[--t2], e2.prev[t2] = f2 <= n2 ? n2 - f2 : 0, --r2; ) ;
              i2 += f2;
            }
            if (0 === e2.strm.avail_in) break;
            if (a2 = e2.strm, o2 = e2.window, h2 = e2.strstart + e2.lookahead, u2 = i2, l2 = void 0, l2 = a2.avail_in, u2 < l2 && (l2 = u2), r2 = 0 === l2 ? 0 : (a2.avail_in -= l2, c.arraySet(o2, a2.input, a2.next_in, l2, h2), 1 === a2.state.wrap ? a2.adler = d(a2.adler, o2, l2, h2) : 2 === a2.state.wrap && (a2.adler = p(a2.adler, o2, l2, h2)), a2.next_in += l2, a2.total_in += l2, l2), e2.lookahead += r2, e2.lookahead + e2.insert >= x) for (s2 = e2.strstart - e2.insert, e2.ins_h = e2.window[s2], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + 1]) & e2.hash_mask; e2.insert && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[s2 + x - 1]) & e2.hash_mask, e2.prev[s2 & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = s2, s2++, e2.insert--, !(e2.lookahead + e2.insert < x)); ) ;
          } while (e2.lookahead < z && 0 !== e2.strm.avail_in);
        }
        function Z(e2, t2) {
          for (var r2, n2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 !== r2 && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2)), e2.match_length >= x) if (n2 = u._tr_tally(e2, e2.strstart - e2.match_start, e2.match_length - x), e2.lookahead -= e2.match_length, e2.match_length <= e2.max_lazy_match && e2.lookahead >= x) {
              for (e2.match_length--; e2.strstart++, e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart, 0 != --e2.match_length; ) ;
              e2.strstart++;
            } else e2.strstart += e2.match_length, e2.match_length = 0, e2.ins_h = e2.window[e2.strstart], e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + 1]) & e2.hash_mask;
            else n2 = u._tr_tally(e2, 0, e2.window[e2.strstart]), e2.lookahead--, e2.strstart++;
            if (n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
          }
          return e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function W(e2, t2) {
          for (var r2, n2, i2; ; ) {
            if (e2.lookahead < z) {
              if (j(e2), e2.lookahead < z && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            if (r2 = 0, e2.lookahead >= x && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), e2.prev_length = e2.match_length, e2.prev_match = e2.match_start, e2.match_length = x - 1, 0 !== r2 && e2.prev_length < e2.max_lazy_match && e2.strstart - r2 <= e2.w_size - z && (e2.match_length = L(e2, r2), e2.match_length <= 5 && (1 === e2.strategy || e2.match_length === x && 4096 < e2.strstart - e2.match_start) && (e2.match_length = x - 1)), e2.prev_length >= x && e2.match_length <= e2.prev_length) {
              for (i2 = e2.strstart + e2.lookahead - x, n2 = u._tr_tally(e2, e2.strstart - 1 - e2.prev_match, e2.prev_length - x), e2.lookahead -= e2.prev_length - 1, e2.prev_length -= 2; ++e2.strstart <= i2 && (e2.ins_h = (e2.ins_h << e2.hash_shift ^ e2.window[e2.strstart + x - 1]) & e2.hash_mask, r2 = e2.prev[e2.strstart & e2.w_mask] = e2.head[e2.ins_h], e2.head[e2.ins_h] = e2.strstart), 0 != --e2.prev_length; ) ;
              if (e2.match_available = 0, e2.match_length = x - 1, e2.strstart++, n2 && (N(e2, false), 0 === e2.strm.avail_out)) return A;
            } else if (e2.match_available) {
              if ((n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1])) && N(e2, false), e2.strstart++, e2.lookahead--, 0 === e2.strm.avail_out) return A;
            } else e2.match_available = 1, e2.strstart++, e2.lookahead--;
          }
          return e2.match_available && (n2 = u._tr_tally(e2, 0, e2.window[e2.strstart - 1]), e2.match_available = 0), e2.insert = e2.strstart < x - 1 ? e2.strstart : x - 1, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : e2.last_lit && (N(e2, false), 0 === e2.strm.avail_out) ? A : I;
        }
        function M(e2, t2, r2, n2, i2) {
          this.good_length = e2, this.max_lazy = t2, this.nice_length = r2, this.max_chain = n2, this.func = i2;
        }
        function H() {
          this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = v, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new c.Buf16(2 * w), this.dyn_dtree = new c.Buf16(2 * (2 * a + 1)), this.bl_tree = new c.Buf16(2 * (2 * o + 1)), D(this.dyn_ltree), D(this.dyn_dtree), D(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new c.Buf16(k + 1), this.heap = new c.Buf16(2 * s + 1), D(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new c.Buf16(2 * s + 1), D(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
        }
        function G(e2) {
          var t2;
          return e2 && e2.state ? (e2.total_in = e2.total_out = 0, e2.data_type = i, (t2 = e2.state).pending = 0, t2.pending_out = 0, t2.wrap < 0 && (t2.wrap = -t2.wrap), t2.status = t2.wrap ? C : E, e2.adler = 2 === t2.wrap ? 0 : 1, t2.last_flush = l, u._tr_init(t2), m) : R(e2, _2);
        }
        function K(e2) {
          var t2 = G(e2);
          return t2 === m && (function(e3) {
            e3.window_size = 2 * e3.w_size, D(e3.head), e3.max_lazy_match = h[e3.level].max_lazy, e3.good_match = h[e3.level].good_length, e3.nice_match = h[e3.level].nice_length, e3.max_chain_length = h[e3.level].max_chain, e3.strstart = 0, e3.block_start = 0, e3.lookahead = 0, e3.insert = 0, e3.match_length = e3.prev_length = x - 1, e3.match_available = 0, e3.ins_h = 0;
          })(e2.state), t2;
        }
        function Y(e2, t2, r2, n2, i2, s2) {
          if (!e2) return _2;
          var a2 = 1;
          if (t2 === g && (t2 = 6), n2 < 0 ? (a2 = 0, n2 = -n2) : 15 < n2 && (a2 = 2, n2 -= 16), i2 < 1 || y < i2 || r2 !== v || n2 < 8 || 15 < n2 || t2 < 0 || 9 < t2 || s2 < 0 || b < s2) return R(e2, _2);
          8 === n2 && (n2 = 9);
          var o2 = new H();
          return (e2.state = o2).strm = e2, o2.wrap = a2, o2.gzhead = null, o2.w_bits = n2, o2.w_size = 1 << o2.w_bits, o2.w_mask = o2.w_size - 1, o2.hash_bits = i2 + 7, o2.hash_size = 1 << o2.hash_bits, o2.hash_mask = o2.hash_size - 1, o2.hash_shift = ~~((o2.hash_bits + x - 1) / x), o2.window = new c.Buf8(2 * o2.w_size), o2.head = new c.Buf16(o2.hash_size), o2.prev = new c.Buf16(o2.w_size), o2.lit_bufsize = 1 << i2 + 6, o2.pending_buf_size = 4 * o2.lit_bufsize, o2.pending_buf = new c.Buf8(o2.pending_buf_size), o2.d_buf = 1 * o2.lit_bufsize, o2.l_buf = 3 * o2.lit_bufsize, o2.level = t2, o2.strategy = s2, o2.method = r2, K(e2);
        }
        h = [new M(0, 0, 0, 0, function(e2, t2) {
          var r2 = 65535;
          for (r2 > e2.pending_buf_size - 5 && (r2 = e2.pending_buf_size - 5); ; ) {
            if (e2.lookahead <= 1) {
              if (j(e2), 0 === e2.lookahead && t2 === l) return A;
              if (0 === e2.lookahead) break;
            }
            e2.strstart += e2.lookahead, e2.lookahead = 0;
            var n2 = e2.block_start + r2;
            if ((0 === e2.strstart || e2.strstart >= n2) && (e2.lookahead = e2.strstart - n2, e2.strstart = n2, N(e2, false), 0 === e2.strm.avail_out)) return A;
            if (e2.strstart - e2.block_start >= e2.w_size - z && (N(e2, false), 0 === e2.strm.avail_out)) return A;
          }
          return e2.insert = 0, t2 === f ? (N(e2, true), 0 === e2.strm.avail_out ? O : B) : (e2.strstart > e2.block_start && (N(e2, false), e2.strm.avail_out), A);
        }), new M(4, 4, 8, 4, Z), new M(4, 5, 16, 8, Z), new M(4, 6, 32, 32, Z), new M(4, 4, 16, 16, W), new M(8, 16, 32, 32, W), new M(8, 16, 128, 128, W), new M(8, 32, 128, 256, W), new M(32, 128, 258, 1024, W), new M(32, 258, 258, 4096, W)], r.deflateInit = function(e2, t2) {
          return Y(e2, t2, v, 15, 8, 0);
        }, r.deflateInit2 = Y, r.deflateReset = K, r.deflateResetKeep = G, r.deflateSetHeader = function(e2, t2) {
          return e2 && e2.state ? 2 !== e2.state.wrap ? _2 : (e2.state.gzhead = t2, m) : _2;
        }, r.deflate = function(e2, t2) {
          var r2, n2, i2, s2;
          if (!e2 || !e2.state || 5 < t2 || t2 < 0) return e2 ? R(e2, _2) : _2;
          if (n2 = e2.state, !e2.output || !e2.input && 0 !== e2.avail_in || 666 === n2.status && t2 !== f) return R(e2, 0 === e2.avail_out ? -5 : _2);
          if (n2.strm = e2, r2 = n2.last_flush, n2.last_flush = t2, n2.status === C) if (2 === n2.wrap) e2.adler = 0, U(n2, 31), U(n2, 139), U(n2, 8), n2.gzhead ? (U(n2, (n2.gzhead.text ? 1 : 0) + (n2.gzhead.hcrc ? 2 : 0) + (n2.gzhead.extra ? 4 : 0) + (n2.gzhead.name ? 8 : 0) + (n2.gzhead.comment ? 16 : 0)), U(n2, 255 & n2.gzhead.time), U(n2, n2.gzhead.time >> 8 & 255), U(n2, n2.gzhead.time >> 16 & 255), U(n2, n2.gzhead.time >> 24 & 255), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 255 & n2.gzhead.os), n2.gzhead.extra && n2.gzhead.extra.length && (U(n2, 255 & n2.gzhead.extra.length), U(n2, n2.gzhead.extra.length >> 8 & 255)), n2.gzhead.hcrc && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending, 0)), n2.gzindex = 0, n2.status = 69) : (U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 0), U(n2, 9 === n2.level ? 2 : 2 <= n2.strategy || n2.level < 2 ? 4 : 0), U(n2, 3), n2.status = E);
          else {
            var a2 = v + (n2.w_bits - 8 << 4) << 8;
            a2 |= (2 <= n2.strategy || n2.level < 2 ? 0 : n2.level < 6 ? 1 : 6 === n2.level ? 2 : 3) << 6, 0 !== n2.strstart && (a2 |= 32), a2 += 31 - a2 % 31, n2.status = E, P(n2, a2), 0 !== n2.strstart && (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), e2.adler = 1;
          }
          if (69 === n2.status) if (n2.gzhead.extra) {
            for (i2 = n2.pending; n2.gzindex < (65535 & n2.gzhead.extra.length) && (n2.pending !== n2.pending_buf_size || (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending !== n2.pending_buf_size)); ) U(n2, 255 & n2.gzhead.extra[n2.gzindex]), n2.gzindex++;
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), n2.gzindex === n2.gzhead.extra.length && (n2.gzindex = 0, n2.status = 73);
          } else n2.status = 73;
          if (73 === n2.status) if (n2.gzhead.name) {
            i2 = n2.pending;
            do {
              if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                s2 = 1;
                break;
              }
              s2 = n2.gzindex < n2.gzhead.name.length ? 255 & n2.gzhead.name.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
            } while (0 !== s2);
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.gzindex = 0, n2.status = 91);
          } else n2.status = 91;
          if (91 === n2.status) if (n2.gzhead.comment) {
            i2 = n2.pending;
            do {
              if (n2.pending === n2.pending_buf_size && (n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), F(e2), i2 = n2.pending, n2.pending === n2.pending_buf_size)) {
                s2 = 1;
                break;
              }
              s2 = n2.gzindex < n2.gzhead.comment.length ? 255 & n2.gzhead.comment.charCodeAt(n2.gzindex++) : 0, U(n2, s2);
            } while (0 !== s2);
            n2.gzhead.hcrc && n2.pending > i2 && (e2.adler = p(e2.adler, n2.pending_buf, n2.pending - i2, i2)), 0 === s2 && (n2.status = 103);
          } else n2.status = 103;
          if (103 === n2.status && (n2.gzhead.hcrc ? (n2.pending + 2 > n2.pending_buf_size && F(e2), n2.pending + 2 <= n2.pending_buf_size && (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), e2.adler = 0, n2.status = E)) : n2.status = E), 0 !== n2.pending) {
            if (F(e2), 0 === e2.avail_out) return n2.last_flush = -1, m;
          } else if (0 === e2.avail_in && T(t2) <= T(r2) && t2 !== f) return R(e2, -5);
          if (666 === n2.status && 0 !== e2.avail_in) return R(e2, -5);
          if (0 !== e2.avail_in || 0 !== n2.lookahead || t2 !== l && 666 !== n2.status) {
            var o2 = 2 === n2.strategy ? (function(e3, t3) {
              for (var r3; ; ) {
                if (0 === e3.lookahead && (j(e3), 0 === e3.lookahead)) {
                  if (t3 === l) return A;
                  break;
                }
                if (e3.match_length = 0, r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++, r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            })(n2, t2) : 3 === n2.strategy ? (function(e3, t3) {
              for (var r3, n3, i3, s3, a3 = e3.window; ; ) {
                if (e3.lookahead <= S) {
                  if (j(e3), e3.lookahead <= S && t3 === l) return A;
                  if (0 === e3.lookahead) break;
                }
                if (e3.match_length = 0, e3.lookahead >= x && 0 < e3.strstart && (n3 = a3[i3 = e3.strstart - 1]) === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3]) {
                  s3 = e3.strstart + S;
                  do {
                  } while (n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && n3 === a3[++i3] && i3 < s3);
                  e3.match_length = S - (s3 - i3), e3.match_length > e3.lookahead && (e3.match_length = e3.lookahead);
                }
                if (e3.match_length >= x ? (r3 = u._tr_tally(e3, 1, e3.match_length - x), e3.lookahead -= e3.match_length, e3.strstart += e3.match_length, e3.match_length = 0) : (r3 = u._tr_tally(e3, 0, e3.window[e3.strstart]), e3.lookahead--, e3.strstart++), r3 && (N(e3, false), 0 === e3.strm.avail_out)) return A;
              }
              return e3.insert = 0, t3 === f ? (N(e3, true), 0 === e3.strm.avail_out ? O : B) : e3.last_lit && (N(e3, false), 0 === e3.strm.avail_out) ? A : I;
            })(n2, t2) : h[n2.level].func(n2, t2);
            if (o2 !== O && o2 !== B || (n2.status = 666), o2 === A || o2 === O) return 0 === e2.avail_out && (n2.last_flush = -1), m;
            if (o2 === I && (1 === t2 ? u._tr_align(n2) : 5 !== t2 && (u._tr_stored_block(n2, 0, 0, false), 3 === t2 && (D(n2.head), 0 === n2.lookahead && (n2.strstart = 0, n2.block_start = 0, n2.insert = 0))), F(e2), 0 === e2.avail_out)) return n2.last_flush = -1, m;
          }
          return t2 !== f ? m : n2.wrap <= 0 ? 1 : (2 === n2.wrap ? (U(n2, 255 & e2.adler), U(n2, e2.adler >> 8 & 255), U(n2, e2.adler >> 16 & 255), U(n2, e2.adler >> 24 & 255), U(n2, 255 & e2.total_in), U(n2, e2.total_in >> 8 & 255), U(n2, e2.total_in >> 16 & 255), U(n2, e2.total_in >> 24 & 255)) : (P(n2, e2.adler >>> 16), P(n2, 65535 & e2.adler)), F(e2), 0 < n2.wrap && (n2.wrap = -n2.wrap), 0 !== n2.pending ? m : 1);
        }, r.deflateEnd = function(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state.status) !== C && 69 !== t2 && 73 !== t2 && 91 !== t2 && 103 !== t2 && t2 !== E && 666 !== t2 ? R(e2, _2) : (e2.state = null, t2 === E ? R(e2, -3) : m) : _2;
        }, r.deflateSetDictionary = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2 = t2.length;
          if (!e2 || !e2.state) return _2;
          if (2 === (s2 = (r2 = e2.state).wrap) || 1 === s2 && r2.status !== C || r2.lookahead) return _2;
          for (1 === s2 && (e2.adler = d(e2.adler, t2, l2, 0)), r2.wrap = 0, l2 >= r2.w_size && (0 === s2 && (D(r2.head), r2.strstart = 0, r2.block_start = 0, r2.insert = 0), u2 = new c.Buf8(r2.w_size), c.arraySet(u2, t2, l2 - r2.w_size, r2.w_size, 0), t2 = u2, l2 = r2.w_size), a2 = e2.avail_in, o2 = e2.next_in, h2 = e2.input, e2.avail_in = l2, e2.next_in = 0, e2.input = t2, j(r2); r2.lookahead >= x; ) {
            for (n2 = r2.strstart, i2 = r2.lookahead - (x - 1); r2.ins_h = (r2.ins_h << r2.hash_shift ^ r2.window[n2 + x - 1]) & r2.hash_mask, r2.prev[n2 & r2.w_mask] = r2.head[r2.ins_h], r2.head[r2.ins_h] = n2, n2++, --i2; ) ;
            r2.strstart = n2, r2.lookahead = x - 1, j(r2);
          }
          return r2.strstart += r2.lookahead, r2.block_start = r2.strstart, r2.insert = r2.lookahead, r2.lookahead = 0, r2.match_length = r2.prev_length = x - 1, r2.match_available = 0, e2.next_in = o2, e2.input = h2, e2.avail_in = a2, r2.wrap = s2, m;
        }, r.deflateInfo = "pako deflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./messages": 51, "./trees": 52 }], 47: [function(e, t, r) {
        t.exports = function() {
          this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = false;
        };
      }, {}], 48: [function(e, t, r) {
        t.exports = function(e2, t2) {
          var r2, n, i, s, a, o, h, u, l, f, c, d, p, m, _2, g, b, v, y, w, k, x, S, z, C;
          r2 = e2.state, n = e2.next_in, z = e2.input, i = n + (e2.avail_in - 5), s = e2.next_out, C = e2.output, a = s - (t2 - e2.avail_out), o = s + (e2.avail_out - 257), h = r2.dmax, u = r2.wsize, l = r2.whave, f = r2.wnext, c = r2.window, d = r2.hold, p = r2.bits, m = r2.lencode, _2 = r2.distcode, g = (1 << r2.lenbits) - 1, b = (1 << r2.distbits) - 1;
          e: do {
            p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = m[d & g];
            t: for (; ; ) {
              if (d >>>= y = v >>> 24, p -= y, 0 === (y = v >>> 16 & 255)) C[s++] = 65535 & v;
              else {
                if (!(16 & y)) {
                  if (0 == (64 & y)) {
                    v = m[(65535 & v) + (d & (1 << y) - 1)];
                    continue t;
                  }
                  if (32 & y) {
                    r2.mode = 12;
                    break e;
                  }
                  e2.msg = "invalid literal/length code", r2.mode = 30;
                  break e;
                }
                w = 65535 & v, (y &= 15) && (p < y && (d += z[n++] << p, p += 8), w += d & (1 << y) - 1, d >>>= y, p -= y), p < 15 && (d += z[n++] << p, p += 8, d += z[n++] << p, p += 8), v = _2[d & b];
                r: for (; ; ) {
                  if (d >>>= y = v >>> 24, p -= y, !(16 & (y = v >>> 16 & 255))) {
                    if (0 == (64 & y)) {
                      v = _2[(65535 & v) + (d & (1 << y) - 1)];
                      continue r;
                    }
                    e2.msg = "invalid distance code", r2.mode = 30;
                    break e;
                  }
                  if (k = 65535 & v, p < (y &= 15) && (d += z[n++] << p, (p += 8) < y && (d += z[n++] << p, p += 8)), h < (k += d & (1 << y) - 1)) {
                    e2.msg = "invalid distance too far back", r2.mode = 30;
                    break e;
                  }
                  if (d >>>= y, p -= y, (y = s - a) < k) {
                    if (l < (y = k - y) && r2.sane) {
                      e2.msg = "invalid distance too far back", r2.mode = 30;
                      break e;
                    }
                    if (S = c, (x = 0) === f) {
                      if (x += u - y, y < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        x = s - k, S = C;
                      }
                    } else if (f < y) {
                      if (x += u + f - y, (y -= f) < w) {
                        for (w -= y; C[s++] = c[x++], --y; ) ;
                        if (x = 0, f < w) {
                          for (w -= y = f; C[s++] = c[x++], --y; ) ;
                          x = s - k, S = C;
                        }
                      }
                    } else if (x += f - y, y < w) {
                      for (w -= y; C[s++] = c[x++], --y; ) ;
                      x = s - k, S = C;
                    }
                    for (; 2 < w; ) C[s++] = S[x++], C[s++] = S[x++], C[s++] = S[x++], w -= 3;
                    w && (C[s++] = S[x++], 1 < w && (C[s++] = S[x++]));
                  } else {
                    for (x = s - k; C[s++] = C[x++], C[s++] = C[x++], C[s++] = C[x++], 2 < (w -= 3); ) ;
                    w && (C[s++] = C[x++], 1 < w && (C[s++] = C[x++]));
                  }
                  break;
                }
              }
              break;
            }
          } while (n < i && s < o);
          n -= w = p >> 3, d &= (1 << (p -= w << 3)) - 1, e2.next_in = n, e2.next_out = s, e2.avail_in = n < i ? i - n + 5 : 5 - (n - i), e2.avail_out = s < o ? o - s + 257 : 257 - (s - o), r2.hold = d, r2.bits = p;
        };
      }, {}], 49: [function(e, t, r) {
        var I = e("../utils/common"), O = e("./adler32"), B = e("./crc32"), R = e("./inffast"), T = e("./inftrees"), D = 1, F = 2, N = 0, U = -2, P = 1, n = 852, i = 592;
        function L(e2) {
          return (e2 >>> 24 & 255) + (e2 >>> 8 & 65280) + ((65280 & e2) << 8) + ((255 & e2) << 24);
        }
        function s() {
          this.mode = 0, this.last = false, this.wrap = 0, this.havedict = false, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new I.Buf16(320), this.work = new I.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
        }
        function a(e2) {
          var t2;
          return e2 && e2.state ? (t2 = e2.state, e2.total_in = e2.total_out = t2.total = 0, e2.msg = "", t2.wrap && (e2.adler = 1 & t2.wrap), t2.mode = P, t2.last = 0, t2.havedict = 0, t2.dmax = 32768, t2.head = null, t2.hold = 0, t2.bits = 0, t2.lencode = t2.lendyn = new I.Buf32(n), t2.distcode = t2.distdyn = new I.Buf32(i), t2.sane = 1, t2.back = -1, N) : U;
        }
        function o(e2) {
          var t2;
          return e2 && e2.state ? ((t2 = e2.state).wsize = 0, t2.whave = 0, t2.wnext = 0, a(e2)) : U;
        }
        function h(e2, t2) {
          var r2, n2;
          return e2 && e2.state ? (n2 = e2.state, t2 < 0 ? (r2 = 0, t2 = -t2) : (r2 = 1 + (t2 >> 4), t2 < 48 && (t2 &= 15)), t2 && (t2 < 8 || 15 < t2) ? U : (null !== n2.window && n2.wbits !== t2 && (n2.window = null), n2.wrap = r2, n2.wbits = t2, o(e2))) : U;
        }
        function u(e2, t2) {
          var r2, n2;
          return e2 ? (n2 = new s(), (e2.state = n2).window = null, (r2 = h(e2, t2)) !== N && (e2.state = null), r2) : U;
        }
        var l, f, c = true;
        function j(e2) {
          if (c) {
            var t2;
            for (l = new I.Buf32(512), f = new I.Buf32(32), t2 = 0; t2 < 144; ) e2.lens[t2++] = 8;
            for (; t2 < 256; ) e2.lens[t2++] = 9;
            for (; t2 < 280; ) e2.lens[t2++] = 7;
            for (; t2 < 288; ) e2.lens[t2++] = 8;
            for (T(D, e2.lens, 0, 288, l, 0, e2.work, { bits: 9 }), t2 = 0; t2 < 32; ) e2.lens[t2++] = 5;
            T(F, e2.lens, 0, 32, f, 0, e2.work, { bits: 5 }), c = false;
          }
          e2.lencode = l, e2.lenbits = 9, e2.distcode = f, e2.distbits = 5;
        }
        function Z(e2, t2, r2, n2) {
          var i2, s2 = e2.state;
          return null === s2.window && (s2.wsize = 1 << s2.wbits, s2.wnext = 0, s2.whave = 0, s2.window = new I.Buf8(s2.wsize)), n2 >= s2.wsize ? (I.arraySet(s2.window, t2, r2 - s2.wsize, s2.wsize, 0), s2.wnext = 0, s2.whave = s2.wsize) : (n2 < (i2 = s2.wsize - s2.wnext) && (i2 = n2), I.arraySet(s2.window, t2, r2 - n2, i2, s2.wnext), (n2 -= i2) ? (I.arraySet(s2.window, t2, r2 - n2, n2, 0), s2.wnext = n2, s2.whave = s2.wsize) : (s2.wnext += i2, s2.wnext === s2.wsize && (s2.wnext = 0), s2.whave < s2.wsize && (s2.whave += i2))), 0;
        }
        r.inflateReset = o, r.inflateReset2 = h, r.inflateResetKeep = a, r.inflateInit = function(e2) {
          return u(e2, 15);
        }, r.inflateInit2 = u, r.inflate = function(e2, t2) {
          var r2, n2, i2, s2, a2, o2, h2, u2, l2, f2, c2, d, p, m, _2, g, b, v, y, w, k, x, S, z, C = 0, E = new I.Buf8(4), A = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
          if (!e2 || !e2.state || !e2.output || !e2.input && 0 !== e2.avail_in) return U;
          12 === (r2 = e2.state).mode && (r2.mode = 13), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, f2 = o2, c2 = h2, x = N;
          e: for (; ; ) switch (r2.mode) {
            case P:
              if (0 === r2.wrap) {
                r2.mode = 13;
                break;
              }
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (2 & r2.wrap && 35615 === u2) {
                E[r2.check = 0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0), l2 = u2 = 0, r2.mode = 2;
                break;
              }
              if (r2.flags = 0, r2.head && (r2.head.done = false), !(1 & r2.wrap) || (((255 & u2) << 8) + (u2 >> 8)) % 31) {
                e2.msg = "incorrect header check", r2.mode = 30;
                break;
              }
              if (8 != (15 & u2)) {
                e2.msg = "unknown compression method", r2.mode = 30;
                break;
              }
              if (l2 -= 4, k = 8 + (15 & (u2 >>>= 4)), 0 === r2.wbits) r2.wbits = k;
              else if (k > r2.wbits) {
                e2.msg = "invalid window size", r2.mode = 30;
                break;
              }
              r2.dmax = 1 << k, e2.adler = r2.check = 1, r2.mode = 512 & u2 ? 10 : 12, l2 = u2 = 0;
              break;
            case 2:
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (r2.flags = u2, 8 != (255 & r2.flags)) {
                e2.msg = "unknown compression method", r2.mode = 30;
                break;
              }
              if (57344 & r2.flags) {
                e2.msg = "unknown header flags set", r2.mode = 30;
                break;
              }
              r2.head && (r2.head.text = u2 >> 8 & 1), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 3;
            case 3:
              for (; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              r2.head && (r2.head.time = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, E[2] = u2 >>> 16 & 255, E[3] = u2 >>> 24 & 255, r2.check = B(r2.check, E, 4, 0)), l2 = u2 = 0, r2.mode = 4;
            case 4:
              for (; l2 < 16; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              r2.head && (r2.head.xflags = 255 & u2, r2.head.os = u2 >> 8), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0, r2.mode = 5;
            case 5:
              if (1024 & r2.flags) {
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.length = u2, r2.head && (r2.head.extra_len = u2), 512 & r2.flags && (E[0] = 255 & u2, E[1] = u2 >>> 8 & 255, r2.check = B(r2.check, E, 2, 0)), l2 = u2 = 0;
              } else r2.head && (r2.head.extra = null);
              r2.mode = 6;
            case 6:
              if (1024 & r2.flags && (o2 < (d = r2.length) && (d = o2), d && (r2.head && (k = r2.head.extra_len - r2.length, r2.head.extra || (r2.head.extra = new Array(r2.head.extra_len)), I.arraySet(r2.head.extra, n2, s2, d, k)), 512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, r2.length -= d), r2.length)) break e;
              r2.length = 0, r2.mode = 7;
            case 7:
              if (2048 & r2.flags) {
                if (0 === o2) break e;
                for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.name += String.fromCharCode(k)), k && d < o2; ) ;
                if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
              } else r2.head && (r2.head.name = null);
              r2.length = 0, r2.mode = 8;
            case 8:
              if (4096 & r2.flags) {
                if (0 === o2) break e;
                for (d = 0; k = n2[s2 + d++], r2.head && k && r2.length < 65536 && (r2.head.comment += String.fromCharCode(k)), k && d < o2; ) ;
                if (512 & r2.flags && (r2.check = B(r2.check, n2, d, s2)), o2 -= d, s2 += d, k) break e;
              } else r2.head && (r2.head.comment = null);
              r2.mode = 9;
            case 9:
              if (512 & r2.flags) {
                for (; l2 < 16; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (u2 !== (65535 & r2.check)) {
                  e2.msg = "header crc mismatch", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.head && (r2.head.hcrc = r2.flags >> 9 & 1, r2.head.done = true), e2.adler = r2.check = 0, r2.mode = 12;
              break;
            case 10:
              for (; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              e2.adler = r2.check = L(u2), l2 = u2 = 0, r2.mode = 11;
            case 11:
              if (0 === r2.havedict) return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, 2;
              e2.adler = r2.check = 1, r2.mode = 12;
            case 12:
              if (5 === t2 || 6 === t2) break e;
            case 13:
              if (r2.last) {
                u2 >>>= 7 & l2, l2 -= 7 & l2, r2.mode = 27;
                break;
              }
              for (; l2 < 3; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              switch (r2.last = 1 & u2, l2 -= 1, 3 & (u2 >>>= 1)) {
                case 0:
                  r2.mode = 14;
                  break;
                case 1:
                  if (j(r2), r2.mode = 20, 6 !== t2) break;
                  u2 >>>= 2, l2 -= 2;
                  break e;
                case 2:
                  r2.mode = 17;
                  break;
                case 3:
                  e2.msg = "invalid block type", r2.mode = 30;
              }
              u2 >>>= 2, l2 -= 2;
              break;
            case 14:
              for (u2 >>>= 7 & l2, l2 -= 7 & l2; l2 < 32; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if ((65535 & u2) != (u2 >>> 16 ^ 65535)) {
                e2.msg = "invalid stored block lengths", r2.mode = 30;
                break;
              }
              if (r2.length = 65535 & u2, l2 = u2 = 0, r2.mode = 15, 6 === t2) break e;
            case 15:
              r2.mode = 16;
            case 16:
              if (d = r2.length) {
                if (o2 < d && (d = o2), h2 < d && (d = h2), 0 === d) break e;
                I.arraySet(i2, n2, s2, d, a2), o2 -= d, s2 += d, h2 -= d, a2 += d, r2.length -= d;
                break;
              }
              r2.mode = 12;
              break;
            case 17:
              for (; l2 < 14; ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (r2.nlen = 257 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ndist = 1 + (31 & u2), u2 >>>= 5, l2 -= 5, r2.ncode = 4 + (15 & u2), u2 >>>= 4, l2 -= 4, 286 < r2.nlen || 30 < r2.ndist) {
                e2.msg = "too many length or distance symbols", r2.mode = 30;
                break;
              }
              r2.have = 0, r2.mode = 18;
            case 18:
              for (; r2.have < r2.ncode; ) {
                for (; l2 < 3; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.lens[A[r2.have++]] = 7 & u2, u2 >>>= 3, l2 -= 3;
              }
              for (; r2.have < 19; ) r2.lens[A[r2.have++]] = 0;
              if (r2.lencode = r2.lendyn, r2.lenbits = 7, S = { bits: r2.lenbits }, x = T(0, r2.lens, 0, 19, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                e2.msg = "invalid code lengths set", r2.mode = 30;
                break;
              }
              r2.have = 0, r2.mode = 19;
            case 19:
              for (; r2.have < r2.nlen + r2.ndist; ) {
                for (; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_2 = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (b < 16) u2 >>>= _2, l2 -= _2, r2.lens[r2.have++] = b;
                else {
                  if (16 === b) {
                    for (z = _2 + 2; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    if (u2 >>>= _2, l2 -= _2, 0 === r2.have) {
                      e2.msg = "invalid bit length repeat", r2.mode = 30;
                      break;
                    }
                    k = r2.lens[r2.have - 1], d = 3 + (3 & u2), u2 >>>= 2, l2 -= 2;
                  } else if (17 === b) {
                    for (z = _2 + 3; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    l2 -= _2, k = 0, d = 3 + (7 & (u2 >>>= _2)), u2 >>>= 3, l2 -= 3;
                  } else {
                    for (z = _2 + 7; l2 < z; ) {
                      if (0 === o2) break e;
                      o2--, u2 += n2[s2++] << l2, l2 += 8;
                    }
                    l2 -= _2, k = 0, d = 11 + (127 & (u2 >>>= _2)), u2 >>>= 7, l2 -= 7;
                  }
                  if (r2.have + d > r2.nlen + r2.ndist) {
                    e2.msg = "invalid bit length repeat", r2.mode = 30;
                    break;
                  }
                  for (; d--; ) r2.lens[r2.have++] = k;
                }
              }
              if (30 === r2.mode) break;
              if (0 === r2.lens[256]) {
                e2.msg = "invalid code -- missing end-of-block", r2.mode = 30;
                break;
              }
              if (r2.lenbits = 9, S = { bits: r2.lenbits }, x = T(D, r2.lens, 0, r2.nlen, r2.lencode, 0, r2.work, S), r2.lenbits = S.bits, x) {
                e2.msg = "invalid literal/lengths set", r2.mode = 30;
                break;
              }
              if (r2.distbits = 6, r2.distcode = r2.distdyn, S = { bits: r2.distbits }, x = T(F, r2.lens, r2.nlen, r2.ndist, r2.distcode, 0, r2.work, S), r2.distbits = S.bits, x) {
                e2.msg = "invalid distances set", r2.mode = 30;
                break;
              }
              if (r2.mode = 20, 6 === t2) break e;
            case 20:
              r2.mode = 21;
            case 21:
              if (6 <= o2 && 258 <= h2) {
                e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, R(e2, c2), a2 = e2.next_out, i2 = e2.output, h2 = e2.avail_out, s2 = e2.next_in, n2 = e2.input, o2 = e2.avail_in, u2 = r2.hold, l2 = r2.bits, 12 === r2.mode && (r2.back = -1);
                break;
              }
              for (r2.back = 0; g = (C = r2.lencode[u2 & (1 << r2.lenbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_2 = C >>> 24) <= l2); ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (g && 0 == (240 & g)) {
                for (v = _2, y = g, w = b; g = (C = r2.lencode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_2 = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                u2 >>>= v, l2 -= v, r2.back += v;
              }
              if (u2 >>>= _2, l2 -= _2, r2.back += _2, r2.length = b, 0 === g) {
                r2.mode = 26;
                break;
              }
              if (32 & g) {
                r2.back = -1, r2.mode = 12;
                break;
              }
              if (64 & g) {
                e2.msg = "invalid literal/length code", r2.mode = 30;
                break;
              }
              r2.extra = 15 & g, r2.mode = 22;
            case 22:
              if (r2.extra) {
                for (z = r2.extra; l2 < z; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.length += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
              }
              r2.was = r2.length, r2.mode = 23;
            case 23:
              for (; g = (C = r2.distcode[u2 & (1 << r2.distbits) - 1]) >>> 16 & 255, b = 65535 & C, !((_2 = C >>> 24) <= l2); ) {
                if (0 === o2) break e;
                o2--, u2 += n2[s2++] << l2, l2 += 8;
              }
              if (0 == (240 & g)) {
                for (v = _2, y = g, w = b; g = (C = r2.distcode[w + ((u2 & (1 << v + y) - 1) >> v)]) >>> 16 & 255, b = 65535 & C, !(v + (_2 = C >>> 24) <= l2); ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                u2 >>>= v, l2 -= v, r2.back += v;
              }
              if (u2 >>>= _2, l2 -= _2, r2.back += _2, 64 & g) {
                e2.msg = "invalid distance code", r2.mode = 30;
                break;
              }
              r2.offset = b, r2.extra = 15 & g, r2.mode = 24;
            case 24:
              if (r2.extra) {
                for (z = r2.extra; l2 < z; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                r2.offset += u2 & (1 << r2.extra) - 1, u2 >>>= r2.extra, l2 -= r2.extra, r2.back += r2.extra;
              }
              if (r2.offset > r2.dmax) {
                e2.msg = "invalid distance too far back", r2.mode = 30;
                break;
              }
              r2.mode = 25;
            case 25:
              if (0 === h2) break e;
              if (d = c2 - h2, r2.offset > d) {
                if ((d = r2.offset - d) > r2.whave && r2.sane) {
                  e2.msg = "invalid distance too far back", r2.mode = 30;
                  break;
                }
                p = d > r2.wnext ? (d -= r2.wnext, r2.wsize - d) : r2.wnext - d, d > r2.length && (d = r2.length), m = r2.window;
              } else m = i2, p = a2 - r2.offset, d = r2.length;
              for (h2 < d && (d = h2), h2 -= d, r2.length -= d; i2[a2++] = m[p++], --d; ) ;
              0 === r2.length && (r2.mode = 21);
              break;
            case 26:
              if (0 === h2) break e;
              i2[a2++] = r2.length, h2--, r2.mode = 21;
              break;
            case 27:
              if (r2.wrap) {
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 |= n2[s2++] << l2, l2 += 8;
                }
                if (c2 -= h2, e2.total_out += c2, r2.total += c2, c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, a2 - c2) : O(r2.check, i2, c2, a2 - c2)), c2 = h2, (r2.flags ? u2 : L(u2)) !== r2.check) {
                  e2.msg = "incorrect data check", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.mode = 28;
            case 28:
              if (r2.wrap && r2.flags) {
                for (; l2 < 32; ) {
                  if (0 === o2) break e;
                  o2--, u2 += n2[s2++] << l2, l2 += 8;
                }
                if (u2 !== (4294967295 & r2.total)) {
                  e2.msg = "incorrect length check", r2.mode = 30;
                  break;
                }
                l2 = u2 = 0;
              }
              r2.mode = 29;
            case 29:
              x = 1;
              break e;
            case 30:
              x = -3;
              break e;
            case 31:
              return -4;
            case 32:
            default:
              return U;
          }
          return e2.next_out = a2, e2.avail_out = h2, e2.next_in = s2, e2.avail_in = o2, r2.hold = u2, r2.bits = l2, (r2.wsize || c2 !== e2.avail_out && r2.mode < 30 && (r2.mode < 27 || 4 !== t2)) && Z(e2, e2.output, e2.next_out, c2 - e2.avail_out) ? (r2.mode = 31, -4) : (f2 -= e2.avail_in, c2 -= e2.avail_out, e2.total_in += f2, e2.total_out += c2, r2.total += c2, r2.wrap && c2 && (e2.adler = r2.check = r2.flags ? B(r2.check, i2, c2, e2.next_out - c2) : O(r2.check, i2, c2, e2.next_out - c2)), e2.data_type = r2.bits + (r2.last ? 64 : 0) + (12 === r2.mode ? 128 : 0) + (20 === r2.mode || 15 === r2.mode ? 256 : 0), (0 == f2 && 0 === c2 || 4 === t2) && x === N && (x = -5), x);
        }, r.inflateEnd = function(e2) {
          if (!e2 || !e2.state) return U;
          var t2 = e2.state;
          return t2.window && (t2.window = null), e2.state = null, N;
        }, r.inflateGetHeader = function(e2, t2) {
          var r2;
          return e2 && e2.state ? 0 == (2 & (r2 = e2.state).wrap) ? U : ((r2.head = t2).done = false, N) : U;
        }, r.inflateSetDictionary = function(e2, t2) {
          var r2, n2 = t2.length;
          return e2 && e2.state ? 0 !== (r2 = e2.state).wrap && 11 !== r2.mode ? U : 11 === r2.mode && O(1, t2, n2, 0) !== r2.check ? -3 : Z(e2, t2, n2, n2) ? (r2.mode = 31, -4) : (r2.havedict = 1, N) : U;
        }, r.inflateInfo = "pako inflate (from Nodeca project)";
      }, { "../utils/common": 41, "./adler32": 43, "./crc32": 45, "./inffast": 48, "./inftrees": 50 }], 50: [function(e, t, r) {
        var D = e("../utils/common"), F = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0], N = [16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78], U = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 0, 0], P = [16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29, 64, 64];
        t.exports = function(e2, t2, r2, n, i, s, a, o) {
          var h, u, l, f, c, d, p, m, _2, g = o.bits, b = 0, v = 0, y = 0, w = 0, k = 0, x = 0, S = 0, z = 0, C = 0, E = 0, A = null, I = 0, O = new D.Buf16(16), B = new D.Buf16(16), R = null, T = 0;
          for (b = 0; b <= 15; b++) O[b] = 0;
          for (v = 0; v < n; v++) O[t2[r2 + v]]++;
          for (k = g, w = 15; 1 <= w && 0 === O[w]; w--) ;
          if (w < k && (k = w), 0 === w) return i[s++] = 20971520, i[s++] = 20971520, o.bits = 1, 0;
          for (y = 1; y < w && 0 === O[y]; y++) ;
          for (k < y && (k = y), b = z = 1; b <= 15; b++) if (z <<= 1, (z -= O[b]) < 0) return -1;
          if (0 < z && (0 === e2 || 1 !== w)) return -1;
          for (B[1] = 0, b = 1; b < 15; b++) B[b + 1] = B[b] + O[b];
          for (v = 0; v < n; v++) 0 !== t2[r2 + v] && (a[B[t2[r2 + v]]++] = v);
          if (d = 0 === e2 ? (A = R = a, 19) : 1 === e2 ? (A = F, I -= 257, R = N, T -= 257, 256) : (A = U, R = P, -1), b = y, c = s, S = v = E = 0, l = -1, f = (C = 1 << (x = k)) - 1, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
          for (; ; ) {
            for (p = b - S, _2 = a[v] < d ? (m = 0, a[v]) : a[v] > d ? (m = R[T + a[v]], A[I + a[v]]) : (m = 96, 0), h = 1 << b - S, y = u = 1 << x; i[c + (E >> S) + (u -= h)] = p << 24 | m << 16 | _2 | 0, 0 !== u; ) ;
            for (h = 1 << b - 1; E & h; ) h >>= 1;
            if (0 !== h ? (E &= h - 1, E += h) : E = 0, v++, 0 == --O[b]) {
              if (b === w) break;
              b = t2[r2 + a[v]];
            }
            if (k < b && (E & f) !== l) {
              for (0 === S && (S = k), c += y, z = 1 << (x = b - S); x + S < w && !((z -= O[x + S]) <= 0); ) x++, z <<= 1;
              if (C += 1 << x, 1 === e2 && 852 < C || 2 === e2 && 592 < C) return 1;
              i[l = E & f] = k << 24 | x << 16 | c - s | 0;
            }
          }
          return 0 !== E && (i[c + E] = b - S << 24 | 64 << 16 | 0), o.bits = k, 0;
        };
      }, { "../utils/common": 41 }], 51: [function(e, t, r) {
        t.exports = { 2: "need dictionary", 1: "stream end", 0: "", "-1": "file error", "-2": "stream error", "-3": "data error", "-4": "insufficient memory", "-5": "buffer error", "-6": "incompatible version" };
      }, {}], 52: [function(e, t, r) {
        var i = e("../utils/common"), o = 0, h = 1;
        function n(e2) {
          for (var t2 = e2.length; 0 <= --t2; ) e2[t2] = 0;
        }
        var s = 0, a = 29, u = 256, l = u + 1 + a, f = 30, c = 19, _2 = 2 * l + 1, g = 15, d = 16, p = 7, m = 256, b = 16, v = 17, y = 18, w = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0], k = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13], x = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7], S = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], z = new Array(2 * (l + 2));
        n(z);
        var C = new Array(2 * f);
        n(C);
        var E = new Array(512);
        n(E);
        var A = new Array(256);
        n(A);
        var I = new Array(a);
        n(I);
        var O, B, R, T = new Array(f);
        function D(e2, t2, r2, n2, i2) {
          this.static_tree = e2, this.extra_bits = t2, this.extra_base = r2, this.elems = n2, this.max_length = i2, this.has_stree = e2 && e2.length;
        }
        function F(e2, t2) {
          this.dyn_tree = e2, this.max_code = 0, this.stat_desc = t2;
        }
        function N(e2) {
          return e2 < 256 ? E[e2] : E[256 + (e2 >>> 7)];
        }
        function U(e2, t2) {
          e2.pending_buf[e2.pending++] = 255 & t2, e2.pending_buf[e2.pending++] = t2 >>> 8 & 255;
        }
        function P(e2, t2, r2) {
          e2.bi_valid > d - r2 ? (e2.bi_buf |= t2 << e2.bi_valid & 65535, U(e2, e2.bi_buf), e2.bi_buf = t2 >> d - e2.bi_valid, e2.bi_valid += r2 - d) : (e2.bi_buf |= t2 << e2.bi_valid & 65535, e2.bi_valid += r2);
        }
        function L(e2, t2, r2) {
          P(e2, r2[2 * t2], r2[2 * t2 + 1]);
        }
        function j(e2, t2) {
          for (var r2 = 0; r2 |= 1 & e2, e2 >>>= 1, r2 <<= 1, 0 < --t2; ) ;
          return r2 >>> 1;
        }
        function Z(e2, t2, r2) {
          var n2, i2, s2 = new Array(g + 1), a2 = 0;
          for (n2 = 1; n2 <= g; n2++) s2[n2] = a2 = a2 + r2[n2 - 1] << 1;
          for (i2 = 0; i2 <= t2; i2++) {
            var o2 = e2[2 * i2 + 1];
            0 !== o2 && (e2[2 * i2] = j(s2[o2]++, o2));
          }
        }
        function W(e2) {
          var t2;
          for (t2 = 0; t2 < l; t2++) e2.dyn_ltree[2 * t2] = 0;
          for (t2 = 0; t2 < f; t2++) e2.dyn_dtree[2 * t2] = 0;
          for (t2 = 0; t2 < c; t2++) e2.bl_tree[2 * t2] = 0;
          e2.dyn_ltree[2 * m] = 1, e2.opt_len = e2.static_len = 0, e2.last_lit = e2.matches = 0;
        }
        function M(e2) {
          8 < e2.bi_valid ? U(e2, e2.bi_buf) : 0 < e2.bi_valid && (e2.pending_buf[e2.pending++] = e2.bi_buf), e2.bi_buf = 0, e2.bi_valid = 0;
        }
        function H(e2, t2, r2, n2) {
          var i2 = 2 * t2, s2 = 2 * r2;
          return e2[i2] < e2[s2] || e2[i2] === e2[s2] && n2[t2] <= n2[r2];
        }
        function G(e2, t2, r2) {
          for (var n2 = e2.heap[r2], i2 = r2 << 1; i2 <= e2.heap_len && (i2 < e2.heap_len && H(t2, e2.heap[i2 + 1], e2.heap[i2], e2.depth) && i2++, !H(t2, n2, e2.heap[i2], e2.depth)); ) e2.heap[r2] = e2.heap[i2], r2 = i2, i2 <<= 1;
          e2.heap[r2] = n2;
        }
        function K(e2, t2, r2) {
          var n2, i2, s2, a2, o2 = 0;
          if (0 !== e2.last_lit) for (; n2 = e2.pending_buf[e2.d_buf + 2 * o2] << 8 | e2.pending_buf[e2.d_buf + 2 * o2 + 1], i2 = e2.pending_buf[e2.l_buf + o2], o2++, 0 === n2 ? L(e2, i2, t2) : (L(e2, (s2 = A[i2]) + u + 1, t2), 0 !== (a2 = w[s2]) && P(e2, i2 -= I[s2], a2), L(e2, s2 = N(--n2), r2), 0 !== (a2 = k[s2]) && P(e2, n2 -= T[s2], a2)), o2 < e2.last_lit; ) ;
          L(e2, m, t2);
        }
        function Y(e2, t2) {
          var r2, n2, i2, s2 = t2.dyn_tree, a2 = t2.stat_desc.static_tree, o2 = t2.stat_desc.has_stree, h2 = t2.stat_desc.elems, u2 = -1;
          for (e2.heap_len = 0, e2.heap_max = _2, r2 = 0; r2 < h2; r2++) 0 !== s2[2 * r2] ? (e2.heap[++e2.heap_len] = u2 = r2, e2.depth[r2] = 0) : s2[2 * r2 + 1] = 0;
          for (; e2.heap_len < 2; ) s2[2 * (i2 = e2.heap[++e2.heap_len] = u2 < 2 ? ++u2 : 0)] = 1, e2.depth[i2] = 0, e2.opt_len--, o2 && (e2.static_len -= a2[2 * i2 + 1]);
          for (t2.max_code = u2, r2 = e2.heap_len >> 1; 1 <= r2; r2--) G(e2, s2, r2);
          for (i2 = h2; r2 = e2.heap[1], e2.heap[1] = e2.heap[e2.heap_len--], G(e2, s2, 1), n2 = e2.heap[1], e2.heap[--e2.heap_max] = r2, e2.heap[--e2.heap_max] = n2, s2[2 * i2] = s2[2 * r2] + s2[2 * n2], e2.depth[i2] = (e2.depth[r2] >= e2.depth[n2] ? e2.depth[r2] : e2.depth[n2]) + 1, s2[2 * r2 + 1] = s2[2 * n2 + 1] = i2, e2.heap[1] = i2++, G(e2, s2, 1), 2 <= e2.heap_len; ) ;
          e2.heap[--e2.heap_max] = e2.heap[1], (function(e3, t3) {
            var r3, n3, i3, s3, a3, o3, h3 = t3.dyn_tree, u3 = t3.max_code, l2 = t3.stat_desc.static_tree, f2 = t3.stat_desc.has_stree, c2 = t3.stat_desc.extra_bits, d2 = t3.stat_desc.extra_base, p2 = t3.stat_desc.max_length, m2 = 0;
            for (s3 = 0; s3 <= g; s3++) e3.bl_count[s3] = 0;
            for (h3[2 * e3.heap[e3.heap_max] + 1] = 0, r3 = e3.heap_max + 1; r3 < _2; r3++) p2 < (s3 = h3[2 * h3[2 * (n3 = e3.heap[r3]) + 1] + 1] + 1) && (s3 = p2, m2++), h3[2 * n3 + 1] = s3, u3 < n3 || (e3.bl_count[s3]++, a3 = 0, d2 <= n3 && (a3 = c2[n3 - d2]), o3 = h3[2 * n3], e3.opt_len += o3 * (s3 + a3), f2 && (e3.static_len += o3 * (l2[2 * n3 + 1] + a3)));
            if (0 !== m2) {
              do {
                for (s3 = p2 - 1; 0 === e3.bl_count[s3]; ) s3--;
                e3.bl_count[s3]--, e3.bl_count[s3 + 1] += 2, e3.bl_count[p2]--, m2 -= 2;
              } while (0 < m2);
              for (s3 = p2; 0 !== s3; s3--) for (n3 = e3.bl_count[s3]; 0 !== n3; ) u3 < (i3 = e3.heap[--r3]) || (h3[2 * i3 + 1] !== s3 && (e3.opt_len += (s3 - h3[2 * i3 + 1]) * h3[2 * i3], h3[2 * i3 + 1] = s3), n3--);
            }
          })(e2, t2), Z(s2, u2, e2.bl_count);
        }
        function X(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), t2[2 * (r2 + 1) + 1] = 65535, n2 = 0; n2 <= r2; n2++) i2 = a2, a2 = t2[2 * (n2 + 1) + 1], ++o2 < h2 && i2 === a2 || (o2 < u2 ? e2.bl_tree[2 * i2] += o2 : 0 !== i2 ? (i2 !== s2 && e2.bl_tree[2 * i2]++, e2.bl_tree[2 * b]++) : o2 <= 10 ? e2.bl_tree[2 * v]++ : e2.bl_tree[2 * y]++, s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4));
        }
        function V(e2, t2, r2) {
          var n2, i2, s2 = -1, a2 = t2[1], o2 = 0, h2 = 7, u2 = 4;
          for (0 === a2 && (h2 = 138, u2 = 3), n2 = 0; n2 <= r2; n2++) if (i2 = a2, a2 = t2[2 * (n2 + 1) + 1], !(++o2 < h2 && i2 === a2)) {
            if (o2 < u2) for (; L(e2, i2, e2.bl_tree), 0 != --o2; ) ;
            else 0 !== i2 ? (i2 !== s2 && (L(e2, i2, e2.bl_tree), o2--), L(e2, b, e2.bl_tree), P(e2, o2 - 3, 2)) : o2 <= 10 ? (L(e2, v, e2.bl_tree), P(e2, o2 - 3, 3)) : (L(e2, y, e2.bl_tree), P(e2, o2 - 11, 7));
            s2 = i2, u2 = (o2 = 0) === a2 ? (h2 = 138, 3) : i2 === a2 ? (h2 = 6, 3) : (h2 = 7, 4);
          }
        }
        n(T);
        var q = false;
        function J(e2, t2, r2, n2) {
          P(e2, (s << 1) + (n2 ? 1 : 0), 3), (function(e3, t3, r3, n3) {
            M(e3), U(e3, r3), U(e3, ~r3), i.arraySet(e3.pending_buf, e3.window, t3, r3, e3.pending), e3.pending += r3;
          })(e2, t2, r2);
        }
        r._tr_init = function(e2) {
          q || ((function() {
            var e3, t2, r2, n2, i2, s2 = new Array(g + 1);
            for (n2 = r2 = 0; n2 < a - 1; n2++) for (I[n2] = r2, e3 = 0; e3 < 1 << w[n2]; e3++) A[r2++] = n2;
            for (A[r2 - 1] = n2, n2 = i2 = 0; n2 < 16; n2++) for (T[n2] = i2, e3 = 0; e3 < 1 << k[n2]; e3++) E[i2++] = n2;
            for (i2 >>= 7; n2 < f; n2++) for (T[n2] = i2 << 7, e3 = 0; e3 < 1 << k[n2] - 7; e3++) E[256 + i2++] = n2;
            for (t2 = 0; t2 <= g; t2++) s2[t2] = 0;
            for (e3 = 0; e3 <= 143; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (; e3 <= 255; ) z[2 * e3 + 1] = 9, e3++, s2[9]++;
            for (; e3 <= 279; ) z[2 * e3 + 1] = 7, e3++, s2[7]++;
            for (; e3 <= 287; ) z[2 * e3 + 1] = 8, e3++, s2[8]++;
            for (Z(z, l + 1, s2), e3 = 0; e3 < f; e3++) C[2 * e3 + 1] = 5, C[2 * e3] = j(e3, 5);
            O = new D(z, w, u + 1, l, g), B = new D(C, k, 0, f, g), R = new D(new Array(0), x, 0, c, p);
          })(), q = true), e2.l_desc = new F(e2.dyn_ltree, O), e2.d_desc = new F(e2.dyn_dtree, B), e2.bl_desc = new F(e2.bl_tree, R), e2.bi_buf = 0, e2.bi_valid = 0, W(e2);
        }, r._tr_stored_block = J, r._tr_flush_block = function(e2, t2, r2, n2) {
          var i2, s2, a2 = 0;
          0 < e2.level ? (2 === e2.strm.data_type && (e2.strm.data_type = (function(e3) {
            var t3, r3 = 4093624447;
            for (t3 = 0; t3 <= 31; t3++, r3 >>>= 1) if (1 & r3 && 0 !== e3.dyn_ltree[2 * t3]) return o;
            if (0 !== e3.dyn_ltree[18] || 0 !== e3.dyn_ltree[20] || 0 !== e3.dyn_ltree[26]) return h;
            for (t3 = 32; t3 < u; t3++) if (0 !== e3.dyn_ltree[2 * t3]) return h;
            return o;
          })(e2)), Y(e2, e2.l_desc), Y(e2, e2.d_desc), a2 = (function(e3) {
            var t3;
            for (X(e3, e3.dyn_ltree, e3.l_desc.max_code), X(e3, e3.dyn_dtree, e3.d_desc.max_code), Y(e3, e3.bl_desc), t3 = c - 1; 3 <= t3 && 0 === e3.bl_tree[2 * S[t3] + 1]; t3--) ;
            return e3.opt_len += 3 * (t3 + 1) + 5 + 5 + 4, t3;
          })(e2), i2 = e2.opt_len + 3 + 7 >>> 3, (s2 = e2.static_len + 3 + 7 >>> 3) <= i2 && (i2 = s2)) : i2 = s2 = r2 + 5, r2 + 4 <= i2 && -1 !== t2 ? J(e2, t2, r2, n2) : 4 === e2.strategy || s2 === i2 ? (P(e2, 2 + (n2 ? 1 : 0), 3), K(e2, z, C)) : (P(e2, 4 + (n2 ? 1 : 0), 3), (function(e3, t3, r3, n3) {
            var i3;
            for (P(e3, t3 - 257, 5), P(e3, r3 - 1, 5), P(e3, n3 - 4, 4), i3 = 0; i3 < n3; i3++) P(e3, e3.bl_tree[2 * S[i3] + 1], 3);
            V(e3, e3.dyn_ltree, t3 - 1), V(e3, e3.dyn_dtree, r3 - 1);
          })(e2, e2.l_desc.max_code + 1, e2.d_desc.max_code + 1, a2 + 1), K(e2, e2.dyn_ltree, e2.dyn_dtree)), W(e2), n2 && M(e2);
        }, r._tr_tally = function(e2, t2, r2) {
          return e2.pending_buf[e2.d_buf + 2 * e2.last_lit] = t2 >>> 8 & 255, e2.pending_buf[e2.d_buf + 2 * e2.last_lit + 1] = 255 & t2, e2.pending_buf[e2.l_buf + e2.last_lit] = 255 & r2, e2.last_lit++, 0 === t2 ? e2.dyn_ltree[2 * r2]++ : (e2.matches++, t2--, e2.dyn_ltree[2 * (A[r2] + u + 1)]++, e2.dyn_dtree[2 * N(t2)]++), e2.last_lit === e2.lit_bufsize - 1;
        }, r._tr_align = function(e2) {
          P(e2, 2, 3), L(e2, m, z), (function(e3) {
            16 === e3.bi_valid ? (U(e3, e3.bi_buf), e3.bi_buf = 0, e3.bi_valid = 0) : 8 <= e3.bi_valid && (e3.pending_buf[e3.pending++] = 255 & e3.bi_buf, e3.bi_buf >>= 8, e3.bi_valid -= 8);
          })(e2);
        };
      }, { "../utils/common": 41 }], 53: [function(e, t, r) {
        t.exports = function() {
          this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
        };
      }, {}], 54: [function(e, t, r) {
        (function(e2) {
          !(function(r2, n) {
            if (!r2.setImmediate) {
              var i, s, t2, a, o = 1, h = {}, u = false, l = r2.document, e3 = Object.getPrototypeOf && Object.getPrototypeOf(r2);
              e3 = e3 && e3.setTimeout ? e3 : r2, i = "[object process]" === {}.toString.call(r2.process) ? function(e4) {
                process.nextTick(function() {
                  c(e4);
                });
              } : (function() {
                if (r2.postMessage && !r2.importScripts) {
                  var e4 = true, t3 = r2.onmessage;
                  return r2.onmessage = function() {
                    e4 = false;
                  }, r2.postMessage("", "*"), r2.onmessage = t3, e4;
                }
              })() ? (a = "setImmediate$" + Math.random() + "$", r2.addEventListener ? r2.addEventListener("message", d, false) : r2.attachEvent("onmessage", d), function(e4) {
                r2.postMessage(a + e4, "*");
              }) : r2.MessageChannel ? ((t2 = new MessageChannel()).port1.onmessage = function(e4) {
                c(e4.data);
              }, function(e4) {
                t2.port2.postMessage(e4);
              }) : l && "onreadystatechange" in l.createElement("script") ? (s = l.documentElement, function(e4) {
                var t3 = l.createElement("script");
                t3.onreadystatechange = function() {
                  c(e4), t3.onreadystatechange = null, s.removeChild(t3), t3 = null;
                }, s.appendChild(t3);
              }) : function(e4) {
                setTimeout(c, 0, e4);
              }, e3.setImmediate = function(e4) {
                "function" != typeof e4 && (e4 = new Function("" + e4));
                for (var t3 = new Array(arguments.length - 1), r3 = 0; r3 < t3.length; r3++) t3[r3] = arguments[r3 + 1];
                var n2 = { callback: e4, args: t3 };
                return h[o] = n2, i(o), o++;
              }, e3.clearImmediate = f;
            }
            function f(e4) {
              delete h[e4];
            }
            function c(e4) {
              if (u) setTimeout(c, 0, e4);
              else {
                var t3 = h[e4];
                if (t3) {
                  u = true;
                  try {
                    !(function(e5) {
                      var t4 = e5.callback, r3 = e5.args;
                      switch (r3.length) {
                        case 0:
                          t4();
                          break;
                        case 1:
                          t4(r3[0]);
                          break;
                        case 2:
                          t4(r3[0], r3[1]);
                          break;
                        case 3:
                          t4(r3[0], r3[1], r3[2]);
                          break;
                        default:
                          t4.apply(n, r3);
                      }
                    })(t3);
                  } finally {
                    f(e4), u = false;
                  }
                }
              }
            }
            function d(e4) {
              e4.source === r2 && "string" == typeof e4.data && 0 === e4.data.indexOf(a) && c(+e4.data.slice(a.length));
            }
          })("undefined" == typeof self ? void 0 === e2 ? this : e2 : self);
        }).call(this, "undefined" != typeof commonjsGlobal ? commonjsGlobal : "undefined" != typeof self ? self : "undefined" != typeof window ? window : {});
      }, {}] }, {}, [10])(10);
    });
  })(jszip_min);
  return jszip_min.exports;
}
var hasRequiredZipfile;
function requireZipfile() {
  if (hasRequiredZipfile) return zipfile;
  hasRequiredZipfile = 1;
  var base64js = requireBase64Js();
  var JSZip = requireJszip_min();
  zipfile.openArrayBuffer = openArrayBuffer;
  zipfile.splitPath = splitPath;
  zipfile.joinPath = joinPath;
  function openArrayBuffer(arrayBuffer) {
    return JSZip.loadAsync(arrayBuffer).then(function(zipFile) {
      function exists(name) {
        return zipFile.file(name) !== null;
      }
      function read(name, encoding) {
        return zipFile.file(name).async("uint8array").then(function(array) {
          if (encoding === "base64") {
            return base64js.fromByteArray(array);
          } else if (encoding) {
            var decoder = new TextDecoder(encoding);
            return decoder.decode(array);
          } else {
            return array;
          }
        });
      }
      function write(name, contents) {
        zipFile.file(name, contents);
      }
      function toArrayBuffer() {
        return zipFile.generateAsync({ type: "arraybuffer" });
      }
      return {
        exists,
        read,
        write,
        toArrayBuffer
      };
    });
  }
  function splitPath(path) {
    var lastIndex = path.lastIndexOf("/");
    if (lastIndex === -1) {
      return { dirname: "", basename: path };
    } else {
      return {
        dirname: path.substring(0, lastIndex),
        basename: path.substring(lastIndex + 1)
      };
    }
  }
  function joinPath() {
    var nonEmptyPaths = Array.prototype.filter.call(arguments, function(path) {
      return path;
    });
    var relevantPaths = [];
    nonEmptyPaths.forEach(function(path) {
      if (/^\//.test(path)) {
        relevantPaths = [path];
      } else {
        relevantPaths.push(path);
      }
    });
    return relevantPaths.join("/");
  }
  return zipfile;
}
var officeXmlReader = {};
var xml = {};
var nodes = {};
var hasRequiredNodes;
function requireNodes() {
  if (hasRequiredNodes) return nodes;
  hasRequiredNodes = 1;
  var _2 = require$$0;
  nodes.Element = Element;
  nodes.element = function(name, attributes, children) {
    return new Element(name, attributes, children);
  };
  nodes.text = function(value) {
    return {
      type: "text",
      value
    };
  };
  var emptyElement = nodes.emptyElement = {
    first: function() {
      return null;
    },
    firstOrEmpty: function() {
      return emptyElement;
    },
    attributes: {},
    children: []
  };
  function Element(name, attributes, children) {
    this.type = "element";
    this.name = name;
    this.attributes = attributes || {};
    this.children = children || [];
  }
  Element.prototype.first = function(name) {
    return _2.find(this.children, function(child) {
      return child.name === name;
    });
  };
  Element.prototype.firstOrEmpty = function(name) {
    return this.first(name) || emptyElement;
  };
  Element.prototype.getElementsByTagName = function(name) {
    var elements = _2.filter(this.children, function(child) {
      return child.name === name;
    });
    return toElementList(elements);
  };
  Element.prototype.text = function() {
    if (this.children.length === 0) {
      return "";
    } else if (this.children.length !== 1 || this.children[0].type !== "text") {
      throw new Error("Not implemented");
    }
    return this.children[0].value;
  };
  var elementListPrototype = {
    getElementsByTagName: function(name) {
      return toElementList(_2.flatten(this.map(function(element) {
        return element.getElementsByTagName(name);
      }, true)));
    }
  };
  function toElementList(array) {
    return _2.extend(array, elementListPrototype);
  }
  return nodes;
}
var reader = {};
var xmldom = {};
var lib$1 = {};
var dom = {};
var conventions = {};
var hasRequiredConventions;
function requireConventions() {
  if (hasRequiredConventions) return conventions;
  hasRequiredConventions = 1;
  function find2(list, predicate, ac) {
    if (ac === void 0) {
      ac = Array.prototype;
    }
    if (list && typeof ac.find === "function") {
      return ac.find.call(list, predicate);
    }
    for (var i = 0; i < list.length; i++) {
      if (Object.prototype.hasOwnProperty.call(list, i)) {
        var item = list[i];
        if (predicate.call(void 0, item, i, list)) {
          return item;
        }
      }
    }
  }
  function freeze(object2, oc) {
    if (oc === void 0) {
      oc = Object;
    }
    return oc && typeof oc.freeze === "function" ? oc.freeze(object2) : object2;
  }
  function assign(target, source) {
    if (target === null || typeof target !== "object") {
      throw new TypeError("target is not an object");
    }
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
    return target;
  }
  var MIME_TYPE = freeze({
    /**
     * `text/html`, the only mime type that triggers treating an XML document as HTML.
     *
     * @see DOMParser.SupportedType.isHTML
     * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
     * @see https://en.wikipedia.org/wiki/HTML Wikipedia
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
     * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring WHATWG HTML Spec
     */
    HTML: "text/html",
    /**
     * Helper method to check a mime type if it indicates an HTML document
     *
     * @param {string} [value]
     * @returns {boolean}
     *
     * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
     * @see https://en.wikipedia.org/wiki/HTML Wikipedia
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
     * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring 	 */
    isHTML: function(value) {
      return value === MIME_TYPE.HTML;
    },
    /**
     * `application/xml`, the standard mime type for XML documents.
     *
     * @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType registration
     * @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
     * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
     */
    XML_APPLICATION: "application/xml",
    /**
     * `text/html`, an alias for `application/xml`.
     *
     * @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
     * @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
     * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
     */
    XML_TEXT: "text/xml",
    /**
     * `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
     * but is parsed as an XML document.
     *
     * @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType registration
     * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
     * @see https://en.wikipedia.org/wiki/XHTML Wikipedia
     */
    XML_XHTML_APPLICATION: "application/xhtml+xml",
    /**
     * `image/svg+xml`,
     *
     * @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
     * @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
     * @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
     */
    XML_SVG_IMAGE: "image/svg+xml"
  });
  var NAMESPACE = freeze({
    /**
     * The XHTML namespace.
     *
     * @see http://www.w3.org/1999/xhtml
     */
    HTML: "http://www.w3.org/1999/xhtml",
    /**
     * Checks if `uri` equals `NAMESPACE.HTML`.
     *
     * @param {string} [uri]
     *
     * @see NAMESPACE.HTML
     */
    isHTML: function(uri) {
      return uri === NAMESPACE.HTML;
    },
    /**
     * The SVG namespace.
     *
     * @see http://www.w3.org/2000/svg
     */
    SVG: "http://www.w3.org/2000/svg",
    /**
     * The `xml:` namespace.
     *
     * @see http://www.w3.org/XML/1998/namespace
     */
    XML: "http://www.w3.org/XML/1998/namespace",
    /**
     * The `xmlns:` namespace
     *
     * @see https://www.w3.org/2000/xmlns/
     */
    XMLNS: "http://www.w3.org/2000/xmlns/"
  });
  var nameStartChar = /[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
  var nameChar = new RegExp("[\\-\\.0-9" + nameStartChar.source.slice(1, -1) + "\\u00B7\\u0300-\\u036F\\u203F-\\u2040]");
  var tagNamePattern = new RegExp("^" + nameStartChar.source + nameChar.source + "*(?::" + nameStartChar.source + nameChar.source + "*)?$");
  conventions.assign = assign;
  conventions.find = find2;
  conventions.freeze = freeze;
  conventions.MIME_TYPE = MIME_TYPE;
  conventions.NAMESPACE = NAMESPACE;
  conventions.nameStartChar = nameStartChar;
  conventions.nameChar = nameChar;
  conventions.tagNamePattern = tagNamePattern;
  return conventions;
}
var hasRequiredDom;
function requireDom() {
  if (hasRequiredDom) return dom;
  hasRequiredDom = 1;
  var conventions2 = requireConventions();
  var find2 = conventions2.find;
  var NAMESPACE = conventions2.NAMESPACE;
  var tagNamePattern = conventions2.tagNamePattern;
  function notEmptyString(input) {
    return input !== "";
  }
  function splitOnASCIIWhitespace(input) {
    return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
  }
  function orderedSetReducer(current, element) {
    if (!current.hasOwnProperty(element)) {
      current[element] = true;
    }
    return current;
  }
  function toOrderedSet(input) {
    if (!input) return [];
    var list = splitOnASCIIWhitespace(input);
    return Object.keys(list.reduce(orderedSetReducer, {}));
  }
  function arrayIncludes(list) {
    return function(element) {
      return list && list.indexOf(element) !== -1;
    };
  }
  function copy(src, dest) {
    for (var p in src) {
      if (Object.prototype.hasOwnProperty.call(src, p)) {
        dest[p] = src[p];
      }
    }
  }
  function _extends(Class, Super) {
    var pt = Class.prototype;
    if (!(pt instanceof Super)) {
      let t = function() {
      };
      t.prototype = Super.prototype;
      t = new t();
      copy(pt, t);
      Class.prototype = pt = t;
    }
    if (pt.constructor != Class) {
      if (typeof Class != "function") {
        console.error("unknown Class:" + Class);
      }
      pt.constructor = Class;
    }
  }
  var NodeType = {};
  var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
  var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
  var TEXT_NODE = NodeType.TEXT_NODE = 3;
  var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
  var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
  var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
  var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
  var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
  var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
  var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
  var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
  var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
  var ExceptionCode = {};
  var ExceptionMessage = {};
  ExceptionCode.INDEX_SIZE_ERR = (ExceptionMessage[1] = "Index size error", 1);
  ExceptionCode.DOMSTRING_SIZE_ERR = (ExceptionMessage[2] = "DOMString size error", 2);
  var HIERARCHY_REQUEST_ERR = ExceptionCode.HIERARCHY_REQUEST_ERR = (ExceptionMessage[3] = "Hierarchy request error", 3);
  ExceptionCode.WRONG_DOCUMENT_ERR = (ExceptionMessage[4] = "Wrong document", 4);
  var INVALID_CHARACTER_ERR = ExceptionCode.INVALID_CHARACTER_ERR = (ExceptionMessage[5] = "Invalid character", 5);
  ExceptionCode.NO_DATA_ALLOWED_ERR = (ExceptionMessage[6] = "No data allowed", 6);
  ExceptionCode.NO_MODIFICATION_ALLOWED_ERR = (ExceptionMessage[7] = "No modification allowed", 7);
  var NOT_FOUND_ERR = ExceptionCode.NOT_FOUND_ERR = (ExceptionMessage[8] = "Not found", 8);
  ExceptionCode.NOT_SUPPORTED_ERR = (ExceptionMessage[9] = "Not supported", 9);
  var INUSE_ATTRIBUTE_ERR = ExceptionCode.INUSE_ATTRIBUTE_ERR = (ExceptionMessage[10] = "Attribute in use", 10);
  var INVALID_STATE_ERR = ExceptionCode.INVALID_STATE_ERR = (ExceptionMessage[11] = "Invalid state", 11);
  ExceptionCode.SYNTAX_ERR = (ExceptionMessage[12] = "Syntax error", 12);
  ExceptionCode.INVALID_MODIFICATION_ERR = (ExceptionMessage[13] = "Invalid modification", 13);
  ExceptionCode.NAMESPACE_ERR = (ExceptionMessage[14] = "Invalid namespace", 14);
  ExceptionCode.INVALID_ACCESS_ERR = (ExceptionMessage[15] = "Invalid access", 15);
  function DOMException(code, message) {
    if (message instanceof Error) {
      var error = message;
    } else {
      error = this;
      Error.call(this, ExceptionMessage[code]);
      this.message = ExceptionMessage[code];
      if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
    }
    error.code = code;
    if (message) this.message = this.message + ": " + message;
    return error;
  }
  DOMException.prototype = Error.prototype;
  copy(ExceptionCode, DOMException);
  function NodeList() {
  }
  NodeList.prototype = {
    /**
     * The number of nodes in the list. The range of valid child node indices is 0 to length-1 inclusive.
     * @standard level1
     */
    length: 0,
    /**
     * Returns the indexth item in the collection. If index is greater than or equal to the number of nodes in the list, this returns null.
     * @standard level1
     * @param index  unsigned long
     *   Index into the collection.
     * @return Node
     * 	The node at the indexth position in the NodeList, or null if that is not a valid index.
     */
    item: function(index2) {
      return index2 >= 0 && index2 < this.length ? this[index2] : null;
    },
    toString: function(isHTML, nodeFilter, options) {
      var requireWellFormed = !!options && !!options.requireWellFormed;
      for (var buf = [], i = 0; i < this.length; i++) {
        serializeToString(this[i], buf, isHTML, nodeFilter, null, requireWellFormed);
      }
      return buf.join("");
    },
    /**
     * @private
     * @param {function (Node):boolean} predicate
     * @returns {Node[]}
     */
    filter: function(predicate) {
      return Array.prototype.filter.call(this, predicate);
    },
    /**
     * @private
     * @param {Node} item
     * @returns {number}
     */
    indexOf: function(item) {
      return Array.prototype.indexOf.call(this, item);
    }
  };
  function LiveNodeList(node, refresh) {
    this._node = node;
    this._refresh = refresh;
    _updateLiveList(this);
  }
  function _updateLiveList(list) {
    var inc = list._node._inc || list._node.ownerDocument._inc;
    if (list._inc !== inc) {
      var ls = list._refresh(list._node);
      __set__(list, "length", ls.length);
      if (!list.$$length || ls.length < list.$$length) {
        for (var i = ls.length; i in list; i++) {
          if (Object.prototype.hasOwnProperty.call(list, i)) {
            delete list[i];
          }
        }
      }
      copy(ls, list);
      list._inc = inc;
    }
  }
  LiveNodeList.prototype.item = function(i) {
    _updateLiveList(this);
    return this[i] || null;
  };
  _extends(LiveNodeList, NodeList);
  function NamedNodeMap() {
    this._nameIndex = /* @__PURE__ */ Object.create(null);
  }
  function _findNodeIndex(list, node) {
    var i = list.length;
    while (i--) {
      if (list[i] === node) {
        return i;
      }
    }
  }
  function _nnmIndexAdd(list, attr) {
    list._nameIndex[attr.nodeName] = attr;
  }
  function _nnmIndexRemove(list, attr) {
    if (list._nameIndex[attr.nodeName] === attr) {
      delete list._nameIndex[attr.nodeName];
    }
  }
  function _addNamedNode(el, list, newAttr, oldAttr) {
    if (oldAttr) {
      list[_findNodeIndex(list, oldAttr)] = newAttr;
      _nnmIndexRemove(list, oldAttr);
    } else {
      list[list.length++] = newAttr;
    }
    _nnmIndexAdd(list, newAttr);
    if (el) {
      newAttr.ownerElement = el;
      var doc = el.ownerDocument;
      if (doc) {
        oldAttr && _onRemoveAttribute(doc, el, oldAttr);
        _onAddAttribute(doc, el, newAttr);
      }
    }
  }
  function _removeNamedNode(el, list, attr) {
    var i = _findNodeIndex(list, attr);
    if (i >= 0) {
      var lastIndex = list.length - 1;
      while (i < lastIndex) {
        list[i] = list[++i];
      }
      list.length = lastIndex;
      _nnmIndexRemove(list, attr);
      if (el) {
        var doc = el.ownerDocument;
        if (doc) {
          _onRemoveAttribute(doc, el, attr);
          attr.ownerElement = null;
        }
      }
    } else {
      throw new DOMException(NOT_FOUND_ERR, new Error(el.tagName + "@" + attr));
    }
  }
  NamedNodeMap.prototype = {
    length: 0,
    item: NodeList.prototype.item,
    getNamedItem: function(key) {
      var i = this.length;
      while (i--) {
        var attr = this[i];
        if (attr.nodeName == key) {
          return attr;
        }
      }
    },
    setNamedItem: function(attr) {
      var el = attr.ownerElement;
      if (el && el != this._ownerElement) {
        throw new DOMException(INUSE_ATTRIBUTE_ERR);
      }
      var oldAttr = this._nameIndex[attr.nodeName];
      _addNamedNode(this._ownerElement, this, attr, oldAttr);
      return oldAttr;
    },
    /* returns Node */
    setNamedItemNS: function(attr) {
      var el = attr.ownerElement, oldAttr;
      if (el && el != this._ownerElement) {
        throw new DOMException(INUSE_ATTRIBUTE_ERR);
      }
      oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);
      _addNamedNode(this._ownerElement, this, attr, oldAttr);
      return oldAttr;
    },
    /* returns Node */
    removeNamedItem: function(key) {
      var attr = this.getNamedItem(key);
      _removeNamedNode(this._ownerElement, this, attr);
      return attr;
    },
    // raises: NOT_FOUND_ERR,NO_MODIFICATION_ALLOWED_ERR
    //for level2
    removeNamedItemNS: function(namespaceURI, localName) {
      var attr = this.getNamedItemNS(namespaceURI, localName);
      _removeNamedNode(this._ownerElement, this, attr);
      return attr;
    },
    getNamedItemNS: function(namespaceURI, localName) {
      var i = this.length;
      while (i--) {
        var node = this[i];
        if (node.localName == localName && node.namespaceURI == namespaceURI) {
          return node;
        }
      }
      return null;
    }
  };
  function DOMImplementation() {
  }
  DOMImplementation.prototype = {
    /**
     * The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given feature is supported.
     * The different implementations fairly diverged in what kind of features were reported.
     * The latest version of the spec settled to force this method to always return true, where the functionality was accurate and in use.
     *
     * @deprecated It is deprecated and modern browsers return true in all cases.
     *
     * @param {string} feature
     * @param {string} [version]
     * @returns {boolean} always true
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
     * @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
     * @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
     */
    hasFeature: function(feature, version) {
      return true;
    },
    /**
     * Creates an XML Document object of the specified type with its document element.
     *
     * __It behaves slightly different from the description in the living standard__:
     * - There is no interface/class `XMLDocument`, it returns a `Document` instance.
     * - `contentType`, `encoding`, `mode`, `origin`, `url` fields are currently not declared.
     * - this implementation is not validating names or qualified names
     *   (when parsing XML strings, the SAX parser takes care of that)
     *
     * @param {string|null} namespaceURI
     * @param {string} qualifiedName
     * @param {DocumentType=null} doctype
     * @returns {Document}
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
     * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM Level 2 Core (initial)
     * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument  DOM Level 2 Core
     *
     * @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
     * @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
     * @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
     */
    createDocument: function(namespaceURI, qualifiedName, doctype) {
      var doc = new Document();
      doc.implementation = this;
      doc.childNodes = new NodeList();
      doc.doctype = doctype || null;
      if (doctype) {
        doc.appendChild(doctype);
      }
      if (qualifiedName) {
        var root2 = doc.createElementNS(namespaceURI, qualifiedName);
        doc.appendChild(root2);
      }
      return doc;
    },
    /**
     * Returns a doctype, with the given `qualifiedName`, `publicId`, and `systemId`.
     *
     * __This implementation differs from the specification:__
     * - this implementation is not validating names or qualified names
     *   (when parsing XML strings, the SAX parser takes care of that)
     *
     * Note: `internalSubset` can only be introduced via a direct property write to `node.internalSubset` after creation.
     * Creation-time validation of `publicId`, `systemId` is not enforced.
     * The serializer-level check covers all mutation vectors, including direct property writes.
     * `internalSubset` is only serialized as `[ ... ]` when both `publicId` and `systemId` are
     * absent (empty or `'.'`) — if either external identifier is present, `internalSubset` is
     * silently omitted from the serialized output.
     *
     * @param {string} qualifiedName
     * @param {string} [publicId]
     * The external subset public identifier. Stored verbatim including surrounding quotes.
     * When serialized with `requireWellFormed: true` (via the 4th-parameter options object),
     * throws `DOMException` with code `INVALID_STATE_ERR` if the value is non-empty and does
     * not match the XML `PubidLiteral` production (W3C DOM Parsing §3.2.1.3; XML 1.0 [12]).
     * @param {string} [systemId]
     * The external subset system identifier. Stored verbatim including surrounding quotes.
     * When serialized with `requireWellFormed: true`, throws `DOMException` with code
     * `INVALID_STATE_ERR` if the value is non-empty and does not match the XML `SystemLiteral`
     * production (W3C DOM Parsing §3.2.1.3; XML 1.0 [11]).
     * @returns {DocumentType} which can either be used with `DOMImplementation.createDocument` upon document creation
     * 				  or can be put into the document via methods like `Node.insertBefore()` or `Node.replaceChild()`
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType MDN
     * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM Level 2 Core
     * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living Standard
     *
     * @see https://dom.spec.whatwg.org/#validate-and-extract DOM: Validate and extract
     * @see https://www.w3.org/TR/xml/#NT-NameStartChar XML Spec: Names
     * @see https://www.w3.org/TR/xml-names/#ns-qualnames XML Namespaces: Qualified names
     */
    createDocumentType: function(qualifiedName, publicId, systemId) {
      var node = new DocumentType();
      node.name = qualifiedName;
      node.nodeName = qualifiedName;
      node.publicId = publicId || "";
      node.systemId = systemId || "";
      return node;
    }
  };
  function Node() {
  }
  Node.prototype = {
    firstChild: null,
    lastChild: null,
    previousSibling: null,
    nextSibling: null,
    attributes: null,
    parentNode: null,
    childNodes: null,
    ownerDocument: null,
    nodeValue: null,
    namespaceURI: null,
    prefix: null,
    localName: null,
    // Modified in DOM Level 2:
    insertBefore: function(newChild, refChild) {
      return _insertBefore(this, newChild, refChild);
    },
    replaceChild: function(newChild, oldChild) {
      _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
      if (oldChild) {
        this.removeChild(oldChild);
      }
    },
    removeChild: function(oldChild) {
      return _removeChild(this, oldChild);
    },
    appendChild: function(newChild) {
      return this.insertBefore(newChild, null);
    },
    hasChildNodes: function() {
      return this.firstChild != null;
    },
    cloneNode: function(deep) {
      return cloneNode(this.ownerDocument || this, this, deep);
    },
    // Modified in DOM Level 2:
    /**
     * Puts the specified node and all of its subtree into a "normalized" form. In a normalized
     * subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
     *
     * Specifically, this method merges any adjacent text nodes (i.e., nodes for which `nodeType`
     * is `TEXT_NODE`) into a single node with the combined data. It also removes any empty text
     * nodes.
     *
     * This method iteratively traverses all child nodes to normalize all descendant nodes within
     * the subtree.
     *
     * @throws {DOMException}
     * May throw a DOMException if operations within removeChild or appendData (which are
     * potentially invoked in this method) do not meet their specific constraints.
     * @see {@link Node.removeChild}
     * @see {@link CharacterData.appendData}
     * @see ../docs/walk-dom.md.
     */
    normalize: function() {
      walkDOM(this, null, {
        enter: function(node) {
          var child = node.firstChild;
          while (child) {
            var next = child.nextSibling;
            if (next !== null && next.nodeType === TEXT_NODE && child.nodeType === TEXT_NODE) {
              var tail = [];
              var sibling = next;
              while (sibling !== null && sibling.nodeType === TEXT_NODE) {
                tail.push(sibling.data);
                sibling = sibling.nextSibling;
              }
              var removed = child.nextSibling;
              while (removed !== sibling) {
                var following = removed.nextSibling;
                removed.parentNode = null;
                removed.previousSibling = null;
                removed.nextSibling = null;
                removed = following;
              }
              child.nextSibling = sibling;
              if (sibling !== null) {
                sibling.previousSibling = child;
              } else {
                node.lastChild = child;
              }
              child.appendData(tail.join(""));
              _onUpdateChild(node.ownerDocument, node);
              child = sibling;
            } else {
              child = next;
            }
          }
          return true;
        }
      });
    },
    // Introduced in DOM Level 2:
    isSupported: function(feature, version) {
      return this.ownerDocument.implementation.hasFeature(feature, version);
    },
    // Introduced in DOM Level 2:
    hasAttributes: function() {
      return this.attributes.length > 0;
    },
    /**
     * Look up the prefix associated to the given namespace URI, starting from this node.
     * **The default namespace declarations are ignored by this method.**
     * See Namespace Prefix Lookup for details on the algorithm used by this method.
     *
     * _Note: The implementation seems to be incomplete when compared to the algorithm described in the specs._
     *
     * @param {string | null} namespaceURI
     * @returns {string | null}
     * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
     * @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
     * @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
     * @see https://github.com/xmldom/xmldom/issues/322
     */
    lookupPrefix: function(namespaceURI) {
      var el = this;
      while (el) {
        var map2 = el._nsMap;
        if (map2) {
          for (var n in map2) {
            if (Object.prototype.hasOwnProperty.call(map2, n) && map2[n] === namespaceURI) {
              return n;
            }
          }
        }
        el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
      }
      return null;
    },
    // Introduced in DOM Level 3:
    lookupNamespaceURI: function(prefix) {
      var el = this;
      while (el) {
        var map2 = el._nsMap;
        if (map2) {
          if (Object.prototype.hasOwnProperty.call(map2, prefix)) {
            return map2[prefix];
          }
        }
        el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
      }
      return null;
    },
    // Introduced in DOM Level 3:
    isDefaultNamespace: function(namespaceURI) {
      var prefix = this.lookupPrefix(namespaceURI);
      return prefix == null;
    }
  };
  function _xmlEncoder(c) {
    return c == "<" && "&lt;" || c == ">" && "&gt;" || c == "&" && "&amp;" || c == '"' && "&quot;" || "&#" + c.charCodeAt() + ";";
  }
  copy(NodeType, Node);
  copy(NodeType, Node.prototype);
  function _visitNode(node, callback) {
    return walkDOM(node, null, { enter: function(n) {
      return callback(n) ? walkDOM.STOP : true;
    } }) === walkDOM.STOP;
  }
  function walkDOM(node, context, callbacks) {
    var stack = [{ node, context, phase: walkDOM.ENTER }];
    while (stack.length > 0) {
      var frame = stack.pop();
      if (frame.phase === walkDOM.ENTER) {
        var childContext = callbacks.enter(frame.node, frame.context);
        if (childContext === walkDOM.STOP) {
          return walkDOM.STOP;
        }
        stack.push({ node: frame.node, context: childContext, phase: walkDOM.EXIT });
        if (childContext === null || childContext === void 0) {
          continue;
        }
        var child = frame.node.lastChild;
        while (child) {
          stack.push({ node: child, context: childContext, phase: walkDOM.ENTER });
          child = child.previousSibling;
        }
      } else {
        if (callbacks.exit) {
          callbacks.exit(frame.node, frame.context);
        }
      }
    }
  }
  walkDOM.STOP = Symbol("walkDOM.STOP");
  walkDOM.ENTER = 0;
  walkDOM.EXIT = 1;
  function Document() {
    this.ownerDocument = this;
  }
  function _onAddAttribute(doc, el, newAttr) {
    doc && doc._inc++;
    var ns = newAttr.namespaceURI;
    if (ns === NAMESPACE.XMLNS) {
      el._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
    }
  }
  function _onRemoveAttribute(doc, el, newAttr, remove) {
    doc && doc._inc++;
    var ns = newAttr.namespaceURI;
    if (ns === NAMESPACE.XMLNS) {
      delete el._nsMap[newAttr.prefix ? newAttr.localName : ""];
    }
  }
  function _onUpdateChild(doc, el, newChild) {
    if (doc && doc._inc) {
      doc._inc++;
      var cs = el.childNodes;
      if (newChild) {
        cs[cs.length++] = newChild;
      } else {
        var child = el.firstChild;
        var i = 0;
        while (child) {
          cs[i++] = child;
          child = child.nextSibling;
        }
        cs.length = i;
        delete cs[cs.length];
      }
    }
  }
  function _removeChild(parentNode, child) {
    var previous = child.previousSibling;
    var next = child.nextSibling;
    if (previous) {
      previous.nextSibling = next;
    } else {
      parentNode.firstChild = next;
    }
    if (next) {
      next.previousSibling = previous;
    } else {
      parentNode.lastChild = previous;
    }
    child.parentNode = null;
    child.previousSibling = null;
    child.nextSibling = null;
    _onUpdateChild(parentNode.ownerDocument, parentNode);
    return child;
  }
  function hasValidParentNodeType(node) {
    return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
  }
  function hasInsertableNodeType(node) {
    return node && (isElementNode(node) || isTextNode(node) || isDocTypeNode(node) || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE);
  }
  function isDocTypeNode(node) {
    return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
  }
  function isElementNode(node) {
    return node && node.nodeType === Node.ELEMENT_NODE;
  }
  function isTextNode(node) {
    return node && node.nodeType === Node.TEXT_NODE;
  }
  function isElementInsertionPossible(doc, child) {
    var parentChildNodes = doc.childNodes || [];
    if (find2(parentChildNodes, isElementNode) || isDocTypeNode(child)) {
      return false;
    }
    var docTypeNode = find2(parentChildNodes, isDocTypeNode);
    return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
  }
  function isElementReplacementPossible(doc, child) {
    var parentChildNodes = doc.childNodes || [];
    function hasElementChildThatIsNotChild(node) {
      return isElementNode(node) && node !== child;
    }
    if (find2(parentChildNodes, hasElementChildThatIsNotChild)) {
      return false;
    }
    var docTypeNode = find2(parentChildNodes, isDocTypeNode);
    return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
  }
  function assertPreInsertionValidity1to5(parent, node, child) {
    if (!hasValidParentNodeType(parent)) {
      throw new DOMException(HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + parent.nodeType);
    }
    if (child && child.parentNode !== parent) {
      throw new DOMException(NOT_FOUND_ERR, "child not in parent");
    }
    if (
      // 4. If `node` is not a DocumentFragment, DocumentType, Element, or CharacterData node, then throw a "HierarchyRequestError" DOMException.
      !hasInsertableNodeType(node) || // 5. If either `node` is a Text node and `parent` is a document,
      // the sax parser currently adds top level text nodes, this will be fixed in 0.9.0
      // || (node.nodeType === Node.TEXT_NODE && parent.nodeType === Node.DOCUMENT_NODE)
      // or `node` is a doctype and `parent` is not a document, then throw a "HierarchyRequestError" DOMException.
      isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE
    ) {
      throw new DOMException(
        HIERARCHY_REQUEST_ERR,
        "Unexpected node type " + node.nodeType + " for parent node type " + parent.nodeType
      );
    }
  }
  function assertPreInsertionValidityInDocument(parent, node, child) {
    var parentChildNodes = parent.childNodes || [];
    var nodeChildNodes = node.childNodes || [];
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      var nodeChildElements = nodeChildNodes.filter(isElementNode);
      if (nodeChildElements.length > 1 || find2(nodeChildNodes, isTextNode)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
      }
      if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
      }
    }
    if (isElementNode(node)) {
      if (!isElementInsertionPossible(parent, child)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
      }
    }
    if (isDocTypeNode(node)) {
      if (find2(parentChildNodes, isDocTypeNode)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
      }
      var parentElementChild = find2(parentChildNodes, isElementNode);
      if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
      }
      if (!child && parentElementChild) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
      }
    }
  }
  function assertPreReplacementValidityInDocument(parent, node, child) {
    var parentChildNodes = parent.childNodes || [];
    var nodeChildNodes = node.childNodes || [];
    if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      var nodeChildElements = nodeChildNodes.filter(isElementNode);
      if (nodeChildElements.length > 1 || find2(nodeChildNodes, isTextNode)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
      }
      if (nodeChildElements.length === 1 && !isElementReplacementPossible(parent, child)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
      }
    }
    if (isElementNode(node)) {
      if (!isElementReplacementPossible(parent, child)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
      }
    }
    if (isDocTypeNode(node)) {
      let hasDoctypeChildThatIsNotChild = function(node2) {
        return isDocTypeNode(node2) && node2 !== child;
      };
      if (find2(parentChildNodes, hasDoctypeChildThatIsNotChild)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
      }
      var parentElementChild = find2(parentChildNodes, isElementNode);
      if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
        throw new DOMException(HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
      }
    }
  }
  function _insertBefore(parent, node, child, _inDocumentAssertion) {
    assertPreInsertionValidity1to5(parent, node, child);
    if (parent.nodeType === Node.DOCUMENT_NODE) {
      (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
    }
    var cp = node.parentNode;
    if (cp) {
      cp.removeChild(node);
    }
    if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
      var newFirst = node.firstChild;
      if (newFirst == null) {
        return node;
      }
      var newLast = node.lastChild;
    } else {
      newFirst = newLast = node;
    }
    var pre = child ? child.previousSibling : parent.lastChild;
    newFirst.previousSibling = pre;
    newLast.nextSibling = child;
    if (pre) {
      pre.nextSibling = newFirst;
    } else {
      parent.firstChild = newFirst;
    }
    if (child == null) {
      parent.lastChild = newLast;
    } else {
      child.previousSibling = newLast;
    }
    do {
      newFirst.parentNode = parent;
      var targetDoc = parent.ownerDocument || parent;
      _updateOwnerDocument(newFirst, targetDoc);
    } while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
    _onUpdateChild(parent.ownerDocument || parent, parent);
    if (node.nodeType == DOCUMENT_FRAGMENT_NODE) {
      node.firstChild = node.lastChild = null;
    }
    return node;
  }
  function _updateOwnerDocument(node, newOwnerDocument) {
    if (node.ownerDocument === newOwnerDocument) {
      return;
    }
    node.ownerDocument = newOwnerDocument;
    if (node.nodeType === ELEMENT_NODE && node.attributes) {
      for (var i = 0; i < node.attributes.length; i++) {
        var attr = node.attributes.item(i);
        if (attr) {
          attr.ownerDocument = newOwnerDocument;
        }
      }
    }
    var child = node.firstChild;
    while (child) {
      _updateOwnerDocument(child, newOwnerDocument);
      child = child.nextSibling;
    }
  }
  function _appendSingleChild(parentNode, newChild) {
    if (newChild.parentNode) {
      newChild.parentNode.removeChild(newChild);
    }
    newChild.parentNode = parentNode;
    newChild.previousSibling = parentNode.lastChild;
    newChild.nextSibling = null;
    if (newChild.previousSibling) {
      newChild.previousSibling.nextSibling = newChild;
    } else {
      parentNode.firstChild = newChild;
    }
    parentNode.lastChild = newChild;
    _onUpdateChild(parentNode.ownerDocument, parentNode, newChild);
    var targetDoc = parentNode.ownerDocument || parentNode;
    _updateOwnerDocument(newChild, targetDoc);
    return newChild;
  }
  Document.prototype = {
    //implementation : null,
    nodeName: "#document",
    nodeType: DOCUMENT_NODE,
    /**
     * The DocumentType node of the document.
     *
     * @readonly
     * @type DocumentType
     */
    doctype: null,
    documentElement: null,
    _inc: 1,
    insertBefore: function(newChild, refChild) {
      if (newChild.nodeType == DOCUMENT_FRAGMENT_NODE) {
        var child = newChild.firstChild;
        while (child) {
          var next = child.nextSibling;
          this.insertBefore(child, refChild);
          child = next;
        }
        return newChild;
      }
      _insertBefore(this, newChild, refChild);
      _updateOwnerDocument(newChild, this);
      if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) {
        this.documentElement = newChild;
      }
      return newChild;
    },
    removeChild: function(oldChild) {
      if (this.documentElement == oldChild) {
        this.documentElement = null;
      }
      return _removeChild(this, oldChild);
    },
    replaceChild: function(newChild, oldChild) {
      _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
      _updateOwnerDocument(newChild, this);
      if (oldChild) {
        this.removeChild(oldChild);
      }
      if (isElementNode(newChild)) {
        this.documentElement = newChild;
      }
    },
    // Introduced in DOM Level 2:
    importNode: function(importedNode, deep) {
      return importNode(this, importedNode, deep);
    },
    // Introduced in DOM Level 2:
    getElementById: function(id) {
      var rtv = null;
      _visitNode(this.documentElement, function(node) {
        if (node.nodeType == ELEMENT_NODE) {
          if (node.getAttribute("id") == id) {
            rtv = node;
            return true;
          }
        }
      });
      return rtv;
    },
    /**
     * The `getElementsByClassName` method of `Document` interface returns an array-like object
     * of all child elements which have **all** of the given class name(s).
     *
     * Returns an empty list if `classeNames` is an empty string or only contains HTML white space characters.
     *
     *
     * Warning: This is a live LiveNodeList.
     * Changes in the DOM will reflect in the array as the changes occur.
     * If an element selected by this array no longer qualifies for the selector,
     * it will automatically be removed. Be aware of this for iteration purposes.
     *
     * @param {string} classNames is a string representing the class name(s) to match; multiple class names are separated by (ASCII-)whitespace
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
     * @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
     */
    getElementsByClassName: function(classNames) {
      var classNamesSet = toOrderedSet(classNames);
      return new LiveNodeList(this, function(base) {
        var ls = [];
        if (classNamesSet.length > 0) {
          _visitNode(base.documentElement, function(node) {
            if (node !== base && node.nodeType === ELEMENT_NODE) {
              var nodeClassNames = node.getAttribute("class");
              if (nodeClassNames) {
                var matches = classNames === nodeClassNames;
                if (!matches) {
                  var nodeClassNamesSet = toOrderedSet(nodeClassNames);
                  matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
                }
                if (matches) {
                  ls.push(node);
                }
              }
            }
          });
        }
        return ls;
      });
    },
    //document factory method:
    createElement: function(tagName) {
      var node = new Element();
      node.ownerDocument = this;
      node.nodeName = tagName;
      node.tagName = tagName;
      node.localName = tagName;
      node.childNodes = new NodeList();
      var attrs = node.attributes = new NamedNodeMap();
      attrs._ownerElement = node;
      return node;
    },
    createDocumentFragment: function() {
      var node = new DocumentFragment();
      node.ownerDocument = this;
      node.childNodes = new NodeList();
      return node;
    },
    createTextNode: function(data) {
      var node = new Text();
      node.ownerDocument = this;
      node.appendData(data);
      return node;
    },
    createComment: function(data) {
      var node = new Comment();
      node.ownerDocument = this;
      node.appendData(data);
      return node;
    },
    /**
     * Returns a new CDATASection node whose data is `data`.
     *
     * __This implementation differs from the specification:__
     * - calling this method on an HTML document does not throw `NotSupportedError`.
     *
     * @param {string} data
     * @returns {CDATASection}
     * @throws DOMException with code `INVALID_CHARACTER_ERR` if `data` contains `"]]>"`.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createCDATASection
     * @see https://dom.spec.whatwg.org/#dom-document-createcdatasection
     */
    createCDATASection: function(data) {
      if (data.indexOf("]]>") !== -1) {
        throw new DOMException(INVALID_CHARACTER_ERR, 'data contains "]]>"');
      }
      var node = new CDATASection();
      node.ownerDocument = this;
      node.appendData(data);
      return node;
    },
    /**
     * Returns a ProcessingInstruction node whose target is target and data is data.
     *
     * __This implementation differs from the specification:__
     * - it does not do any input validation on the arguments and doesn't throw "InvalidCharacterError".
     *
     * Note: When the resulting document is serialized with `requireWellFormed: true`, the
     * serializer throws with code `INVALID_STATE_ERR` if `.target` is not a valid XML `NCName`
     * (a `Name` with no colon) or is an ASCII case-insensitive match for `"xml"`, or if `.data`
     * contains `?>` (W3C DOM Parsing §3.2.1.7). Without that option the target and data are
     * emitted verbatim.
     *
     * @param {string} target
     * @param {string} data
     * @returns {ProcessingInstruction}
     * @see https://developer.mozilla.org/docs/Web/API/Document/createProcessingInstruction
     * @see https://dom.spec.whatwg.org/#dom-document-createprocessinginstruction
     * @see https://www.w3.org/TR/DOM-Parsing/#dfn-concept-serialize-xml §3.2.1.7
     */
    createProcessingInstruction: function(target, data) {
      var node = new ProcessingInstruction();
      node.ownerDocument = this;
      node.tagName = node.nodeName = node.target = target;
      node.nodeValue = node.data = data;
      return node;
    },
    createAttribute: function(name) {
      var node = new Attr();
      node.ownerDocument = this;
      node.name = name;
      node.nodeName = name;
      node.localName = name;
      node.specified = true;
      return node;
    },
    /**
     * Creates an EntityReference object, serialized as `&name;`.
     *
     * The `name` is validated against the XML `Name` production at creation time; an invalid name
     * throws a `DOMException` with code `INVALID_CHARACTER_ERR`. When the resulting node is
     * serialized with `requireWellFormed: true`, the serializer re-validates `nodeName` and throws
     * a `DOMException` with code `INVALID_STATE_ERR` if a later `nodeName` mutation made it invalid;
     * without that option the name is emitted verbatim.
     *
     * Note: xmldom does not expand entities — the parser resolves entity references inline and never
     * constructs `EntityReference` nodes, so this method is the only producer.
     *
     * @param {string} name The name of the entity to reference.
     * @returns {EntityReference}
     * @throws {DOMException} With code `INVALID_CHARACTER_ERR` when `name` is not a valid XML `Name`.
     * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-392B75AE
     */
    createEntityReference: function(name) {
      if (!tagNamePattern.test(name)) {
        throw new DOMException(INVALID_CHARACTER_ERR, 'not a valid xml name "' + name + '"');
      }
      var node = new EntityReference();
      node.ownerDocument = this;
      node.nodeName = name;
      return node;
    },
    // Introduced in DOM Level 2:
    createElementNS: function(namespaceURI, qualifiedName) {
      var node = new Element();
      var pl = qualifiedName.split(":");
      var attrs = node.attributes = new NamedNodeMap();
      node.childNodes = new NodeList();
      node.ownerDocument = this;
      node.nodeName = qualifiedName;
      node.tagName = qualifiedName;
      node.namespaceURI = namespaceURI;
      if (pl.length == 2) {
        node.prefix = pl[0];
        node.localName = pl[1];
      } else {
        node.localName = qualifiedName;
      }
      attrs._ownerElement = node;
      return node;
    },
    // Introduced in DOM Level 2:
    createAttributeNS: function(namespaceURI, qualifiedName) {
      var node = new Attr();
      var pl = qualifiedName.split(":");
      node.ownerDocument = this;
      node.nodeName = qualifiedName;
      node.name = qualifiedName;
      node.namespaceURI = namespaceURI;
      node.specified = true;
      if (pl.length == 2) {
        node.prefix = pl[0];
        node.localName = pl[1];
      } else {
        node.localName = qualifiedName;
      }
      return node;
    }
  };
  _extends(Document, Node);
  function Element() {
    this._nsMap = {};
  }
  Element.prototype = {
    nodeType: ELEMENT_NODE,
    hasAttribute: function(name) {
      return this.getAttributeNode(name) != null;
    },
    getAttribute: function(name) {
      var attr = this.getAttributeNode(name);
      return attr && attr.value || "";
    },
    getAttributeNode: function(name) {
      return this.attributes.getNamedItem(name);
    },
    setAttribute: function(name, value) {
      var attr = this.ownerDocument.createAttribute(name);
      attr.value = attr.nodeValue = "" + value;
      this.setAttributeNode(attr);
    },
    removeAttribute: function(name) {
      var attr = this.getAttributeNode(name);
      attr && this.removeAttributeNode(attr);
    },
    //four real opeartion method
    appendChild: function(newChild) {
      if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
        return this.insertBefore(newChild, null);
      } else {
        return _appendSingleChild(this, newChild);
      }
    },
    setAttributeNode: function(newAttr) {
      return this.attributes.setNamedItem(newAttr);
    },
    setAttributeNodeNS: function(newAttr) {
      return this.attributes.setNamedItemNS(newAttr);
    },
    removeAttributeNode: function(oldAttr) {
      return this.attributes.removeNamedItem(oldAttr.nodeName);
    },
    //get real attribute name,and remove it by removeAttributeNode
    removeAttributeNS: function(namespaceURI, localName) {
      var old = this.getAttributeNodeNS(namespaceURI, localName);
      old && this.removeAttributeNode(old);
    },
    hasAttributeNS: function(namespaceURI, localName) {
      return this.getAttributeNodeNS(namespaceURI, localName) != null;
    },
    getAttributeNS: function(namespaceURI, localName) {
      var attr = this.getAttributeNodeNS(namespaceURI, localName);
      return attr && attr.value || "";
    },
    setAttributeNS: function(namespaceURI, qualifiedName, value) {
      var attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
      attr.value = attr.nodeValue = "" + value;
      this.setAttributeNode(attr);
    },
    getAttributeNodeNS: function(namespaceURI, localName) {
      return this.attributes.getNamedItemNS(namespaceURI, localName);
    },
    getElementsByTagName: function(tagName) {
      return new LiveNodeList(this, function(base) {
        var ls = [];
        _visitNode(base, function(node) {
          if (node !== base && node.nodeType == ELEMENT_NODE && (tagName === "*" || node.tagName == tagName)) {
            ls.push(node);
          }
        });
        return ls;
      });
    },
    getElementsByTagNameNS: function(namespaceURI, localName) {
      return new LiveNodeList(this, function(base) {
        var ls = [];
        _visitNode(base, function(node) {
          if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) {
            ls.push(node);
          }
        });
        return ls;
      });
    }
  };
  Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
  Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
  _extends(Element, Node);
  function Attr() {
  }
  Attr.prototype.nodeType = ATTRIBUTE_NODE;
  _extends(Attr, Node);
  function CharacterData() {
  }
  CharacterData.prototype = {
    data: "",
    substringData: function(offset, count) {
      return this.data.substring(offset, offset + count);
    },
    appendData: function(text) {
      text = this.data + text;
      this.nodeValue = this.data = text;
      this.length = text.length;
    },
    insertData: function(offset, text) {
      this.replaceData(offset, 0, text);
    },
    appendChild: function(newChild) {
      throw new Error(ExceptionMessage[HIERARCHY_REQUEST_ERR]);
    },
    deleteData: function(offset, count) {
      this.replaceData(offset, count, "");
    },
    replaceData: function(offset, count, text) {
      var start = this.data.substring(0, offset);
      var end = this.data.substring(offset + count);
      text = start + text + end;
      this.nodeValue = this.data = text;
      this.length = text.length;
    }
  };
  _extends(CharacterData, Node);
  function Text() {
  }
  Text.prototype = {
    nodeName: "#text",
    nodeType: TEXT_NODE,
    splitText: function(offset) {
      var text = this.data;
      var newText = text.substring(offset);
      text = text.substring(0, offset);
      this.data = this.nodeValue = text;
      this.length = text.length;
      var newNode = this.ownerDocument.createTextNode(newText);
      if (this.parentNode) {
        this.parentNode.insertBefore(newNode, this.nextSibling);
      }
      return newNode;
    }
  };
  _extends(Text, CharacterData);
  function Comment() {
  }
  Comment.prototype = {
    nodeName: "#comment",
    nodeType: COMMENT_NODE
  };
  _extends(Comment, CharacterData);
  function CDATASection() {
  }
  CDATASection.prototype = {
    nodeName: "#cdata-section",
    nodeType: CDATA_SECTION_NODE
  };
  _extends(CDATASection, CharacterData);
  function DocumentType() {
  }
  DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
  _extends(DocumentType, Node);
  function Notation() {
  }
  Notation.prototype.nodeType = NOTATION_NODE;
  _extends(Notation, Node);
  function Entity() {
  }
  Entity.prototype.nodeType = ENTITY_NODE;
  _extends(Entity, Node);
  function EntityReference() {
  }
  EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
  _extends(EntityReference, Node);
  function DocumentFragment() {
  }
  DocumentFragment.prototype.nodeName = "#document-fragment";
  DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
  _extends(DocumentFragment, Node);
  function ProcessingInstruction() {
  }
  ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
  _extends(ProcessingInstruction, Node);
  function XMLSerializer() {
  }
  XMLSerializer.prototype.serializeToString = function(node, isHtml, nodeFilter, options) {
    return nodeSerializeToString.call(node, isHtml, nodeFilter, options);
  };
  Node.prototype.toString = nodeSerializeToString;
  function nodeSerializeToString(isHtml, nodeFilter, options) {
    var requireWellFormed = !!options && !!options.requireWellFormed;
    var buf = [];
    var refNode = this.nodeType == 9 && this.documentElement || this;
    var prefix = refNode.prefix;
    var uri = refNode.namespaceURI;
    if (uri && prefix == null) {
      var prefix = refNode.lookupPrefix(uri);
      if (prefix == null) {
        var visibleNamespaces = [
          { namespace: uri, prefix: null }
          //{namespace:uri,prefix:''}
        ];
      }
    }
    serializeToString(this, buf, isHtml, nodeFilter, visibleNamespaces, requireWellFormed);
    return buf.join("");
  }
  function needNamespaceDefine(node, isHTML, visibleNamespaces) {
    var prefix = node.prefix || "";
    var uri = node.namespaceURI;
    if (!uri) {
      return false;
    }
    if (prefix === "xml" && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) {
      return false;
    }
    var i = visibleNamespaces.length;
    while (i--) {
      var ns = visibleNamespaces[i];
      if (ns.prefix === prefix) {
        return ns.namespace !== uri;
      }
    }
    return true;
  }
  function addSerializedAttribute(buf, qualifiedName, value, requireWellFormed) {
    if (requireWellFormed && !tagNamePattern.test(qualifiedName)) {
      throw new DOMException(INVALID_STATE_ERR, 'The attribute name "' + qualifiedName + '" is not a valid XML QName');
    }
    buf.push(" ", qualifiedName, '="', value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), '"');
  }
  function serializeToString(node, buf, isHTML, nodeFilter, visibleNamespaces, requireWellFormed) {
    if (!visibleNamespaces) {
      visibleNamespaces = [];
    }
    walkDOM(node, { ns: visibleNamespaces, isHTML }, {
      enter: function(n, ctx) {
        var ns = ctx.ns;
        var html2 = ctx.isHTML;
        if (nodeFilter) {
          n = nodeFilter(n);
          if (n) {
            if (typeof n == "string") {
              buf.push(n);
              return null;
            }
          } else {
            return null;
          }
        }
        switch (n.nodeType) {
          case ELEMENT_NODE:
            var attrs = n.attributes;
            var len = attrs.length;
            var nodeName = n.tagName;
            html2 = NAMESPACE.isHTML(n.namespaceURI) || html2;
            var prefixedNodeName = nodeName;
            if (!html2 && !n.prefix && n.namespaceURI) {
              var defaultNS;
              for (var ai = 0; ai < attrs.length; ai++) {
                if (attrs.item(ai).name === "xmlns") {
                  defaultNS = attrs.item(ai).value;
                  break;
                }
              }
              if (!defaultNS) {
                for (var nsi = ns.length - 1; nsi >= 0; nsi--) {
                  var nsEntry = ns[nsi];
                  if (nsEntry.prefix === "" && nsEntry.namespace === n.namespaceURI) {
                    defaultNS = nsEntry.namespace;
                    break;
                  }
                }
              }
              if (defaultNS !== n.namespaceURI) {
                for (var nsi = ns.length - 1; nsi >= 0; nsi--) {
                  var nsEntry = ns[nsi];
                  if (nsEntry.namespace === n.namespaceURI) {
                    if (nsEntry.prefix) {
                      prefixedNodeName = nsEntry.prefix + ":" + nodeName;
                    }
                    break;
                  }
                }
              }
            }
            if (requireWellFormed && !tagNamePattern.test(prefixedNodeName)) {
              throw new DOMException(INVALID_STATE_ERR, 'The element name "' + prefixedNodeName + '" is not a valid XML QName');
            }
            buf.push("<", prefixedNodeName);
            var childNs = ns.slice();
            for (var i = 0; i < len; i++) {
              var attr = attrs.item(i);
              if (attr.prefix == "xmlns") {
                childNs.push({ prefix: attr.localName, namespace: attr.value });
              } else if (attr.nodeName == "xmlns") {
                childNs.push({ prefix: "", namespace: attr.value });
              }
            }
            for (var i = 0; i < len; i++) {
              var attr = attrs.item(i);
              if (needNamespaceDefine(attr, html2, childNs)) {
                var attrPrefix = attr.prefix || "";
                var uri = attr.namespaceURI;
                addSerializedAttribute(buf, attrPrefix ? "xmlns:" + attrPrefix : "xmlns", uri, requireWellFormed);
                childNs.push({ prefix: attrPrefix, namespace: uri });
              }
              var filteredAttr = nodeFilter ? nodeFilter(attr) : attr;
              if (filteredAttr) {
                if (typeof filteredAttr === "string") {
                  buf.push(filteredAttr);
                } else {
                  addSerializedAttribute(buf, filteredAttr.name, filteredAttr.value, requireWellFormed);
                }
              }
            }
            if (nodeName === prefixedNodeName && needNamespaceDefine(n, html2, childNs)) {
              var nodePrefix = n.prefix || "";
              var uri = n.namespaceURI;
              addSerializedAttribute(buf, nodePrefix ? "xmlns:" + nodePrefix : "xmlns", uri, requireWellFormed);
              childNs.push({ prefix: nodePrefix, namespace: uri });
            }
            var child = n.firstChild;
            if (child || html2 && !/^(?:meta|link|img|br|hr|input)$/i.test(nodeName)) {
              buf.push(">");
              if (html2 && /^script$/i.test(nodeName)) {
                while (child) {
                  if (child.data) {
                    buf.push(child.data);
                  } else {
                    serializeToString(child, buf, html2, nodeFilter, childNs.slice(), requireWellFormed);
                  }
                  child = child.nextSibling;
                }
                buf.push("</", nodeName, ">");
                return null;
              }
              return { ns: childNs, isHTML: html2, tag: prefixedNodeName };
            } else {
              buf.push("/>");
              return null;
            }
          case DOCUMENT_NODE:
          case DOCUMENT_FRAGMENT_NODE:
            return { ns: ns.slice(), isHTML: html2, tag: null };
          case ATTRIBUTE_NODE:
            addSerializedAttribute(buf, n.name, n.value, requireWellFormed);
            return null;
          case TEXT_NODE:
            buf.push(n.data.replace(/[<&>]/g, _xmlEncoder));
            return null;
          case CDATA_SECTION_NODE:
            if (requireWellFormed && n.data.indexOf("]]>") !== -1) {
              throw new DOMException(INVALID_STATE_ERR, 'The CDATASection data contains "]]>"');
            }
            buf.push("<![CDATA[", n.data.replace(/]]>/g, "]]]]><![CDATA[>"), "]]>");
            return null;
          case COMMENT_NODE:
            if (requireWellFormed && n.data.indexOf("-->") !== -1) {
              throw new DOMException(INVALID_STATE_ERR, 'The comment node data contains "-->"');
            }
            buf.push("<!--", n.data, "-->");
            return null;
          case DOCUMENT_TYPE_NODE:
            if (requireWellFormed) {
              if (!tagNamePattern.test(n.name)) {
                throw new DOMException(INVALID_STATE_ERR, 'The doctype name "' + n.name + '" is not a valid XML Name');
              }
              if (n.publicId && !/^("[\x20\r\na-zA-Z0-9\-()+,.\/:=?;!*#@$_%']*"|'[\x20\r\na-zA-Z0-9\-()+,.\/:=?;!*#@$_%'"]*')$/.test(n.publicId)) {
                throw new DOMException(INVALID_STATE_ERR, "DocumentType publicId is not a valid PubidLiteral");
              }
              if (n.systemId && !/^("[^"]*"|'[^']*')$/.test(n.systemId)) {
                throw new DOMException(INVALID_STATE_ERR, "DocumentType systemId is not a valid SystemLiteral");
              }
              if (n.internalSubset && n.internalSubset.indexOf("]>") !== -1) {
                throw new DOMException(INVALID_STATE_ERR, 'DocumentType internalSubset contains "]>"');
              }
            }
            var pubid = n.publicId;
            var sysid = n.systemId;
            buf.push("<!DOCTYPE ", n.name);
            if (pubid) {
              buf.push(" PUBLIC ", pubid);
              if (sysid && sysid != ".") {
                buf.push(" ", sysid);
              }
              buf.push(">");
            } else if (sysid && sysid != ".") {
              buf.push(" SYSTEM ", sysid, ">");
            } else {
              var sub = n.internalSubset;
              if (sub) {
                buf.push(" [", sub, "]");
              }
              buf.push(">");
            }
            return null;
          case PROCESSING_INSTRUCTION_NODE:
            if (requireWellFormed) {
              if (!tagNamePattern.test(n.target) || n.target.indexOf(":") !== -1 || n.target.toLowerCase() === "xml") {
                throw new DOMException(
                  INVALID_STATE_ERR,
                  'The processing instruction target "' + n.target + '" is not a valid XML NCName or is reserved'
                );
              }
              if (n.data.indexOf("?>") !== -1) {
                throw new DOMException(INVALID_STATE_ERR, 'The ProcessingInstruction data contains "?>"');
              }
            }
            buf.push("<?", n.target, " ", n.data, "?>");
            return null;
          case ENTITY_REFERENCE_NODE:
            if (requireWellFormed && !tagNamePattern.test(n.nodeName)) {
              throw new DOMException(
                INVALID_STATE_ERR,
                'The entity reference name "' + n.nodeName + '" is not a valid XML Name'
              );
            }
            buf.push("&", n.nodeName, ";");
            return null;
          //case ENTITY_NODE:
          //case NOTATION_NODE:
          default:
            buf.push("??", n.nodeName);
            return null;
        }
      },
      exit: function(n, childCtx) {
        if (childCtx && childCtx.tag) {
          buf.push("</", childCtx.tag, ">");
        }
      }
    });
  }
  function importNode(doc, node, deep) {
    var destRoot;
    walkDOM(node, null, {
      enter: function(srcNode, destParent) {
        var destNode = srcNode.cloneNode(false);
        destNode.ownerDocument = doc;
        destNode.parentNode = null;
        if (destParent === null) {
          destRoot = destNode;
        } else {
          destParent.appendChild(destNode);
        }
        var shouldDeep = srcNode.nodeType === ATTRIBUTE_NODE || deep;
        return shouldDeep ? destNode : null;
      }
    });
    return destRoot;
  }
  function cloneNode(doc, node, deep) {
    var destRoot;
    walkDOM(node, null, {
      enter: function(srcNode, destParent) {
        var destNode = new srcNode.constructor();
        for (var n in srcNode) {
          if (Object.prototype.hasOwnProperty.call(srcNode, n)) {
            var v = srcNode[n];
            if (typeof v != "object") {
              if (v != destNode[n]) {
                destNode[n] = v;
              }
            }
          }
        }
        if (srcNode.childNodes) {
          destNode.childNodes = new NodeList();
        }
        destNode.ownerDocument = doc;
        var shouldDeep = deep;
        switch (destNode.nodeType) {
          case ELEMENT_NODE:
            var attrs = srcNode.attributes;
            var attrs2 = destNode.attributes = new NamedNodeMap();
            var len = attrs.length;
            attrs2._ownerElement = destNode;
            for (var i = 0; i < len; i++) {
              destNode.setAttributeNode(cloneNode(doc, attrs.item(i), true));
            }
            break;
          case ATTRIBUTE_NODE:
            shouldDeep = true;
        }
        if (destParent !== null) {
          destParent.appendChild(destNode);
        } else {
          destRoot = destNode;
        }
        return shouldDeep ? destNode : null;
      }
    });
    return destRoot;
  }
  function __set__(object2, key, value) {
    object2[key] = value;
  }
  try {
    if (Object.defineProperty) {
      Object.defineProperty(LiveNodeList.prototype, "length", {
        get: function() {
          _updateLiveList(this);
          return this.$$length;
        }
      });
      Object.defineProperty(Node.prototype, "textContent", {
        get: function() {
          if (this.nodeType === ELEMENT_NODE || this.nodeType === DOCUMENT_FRAGMENT_NODE) {
            var buf = [];
            walkDOM(this, null, {
              enter: function(n) {
                if (n.nodeType === ELEMENT_NODE || n.nodeType === DOCUMENT_FRAGMENT_NODE) {
                  return true;
                }
                if (n.nodeType === PROCESSING_INSTRUCTION_NODE || n.nodeType === COMMENT_NODE) {
                  return null;
                }
                buf.push(n.nodeValue);
              }
            });
            return buf.join("");
          }
          return this.nodeValue;
        },
        set: function(data) {
          switch (this.nodeType) {
            case ELEMENT_NODE:
            case DOCUMENT_FRAGMENT_NODE:
              while (this.firstChild) {
                this.removeChild(this.firstChild);
              }
              if (data || String(data)) {
                this.appendChild(this.ownerDocument.createTextNode(data));
              }
              break;
            default:
              this.data = data;
              this.value = data;
              this.nodeValue = data;
          }
        }
      });
      __set__ = function(object2, key, value) {
        object2["$$" + key] = value;
      };
    }
  } catch (e) {
  }
  dom.DocumentType = DocumentType;
  dom.DOMException = DOMException;
  dom.DOMImplementation = DOMImplementation;
  dom.Element = Element;
  dom.Node = Node;
  dom.NodeList = NodeList;
  dom.walkDOM = walkDOM;
  dom.XMLSerializer = XMLSerializer;
  return dom;
}
var domParser = {};
var entities = {};
var hasRequiredEntities;
function requireEntities() {
  if (hasRequiredEntities) return entities;
  hasRequiredEntities = 1;
  (function(exports) {
    var freeze = requireConventions().freeze;
    exports.XML_ENTITIES = freeze({
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      quot: '"'
    });
    exports.HTML_ENTITIES = freeze({
      Aacute: "Á",
      aacute: "á",
      Abreve: "Ă",
      abreve: "ă",
      ac: "∾",
      acd: "∿",
      acE: "∾̳",
      Acirc: "Â",
      acirc: "â",
      acute: "´",
      Acy: "А",
      acy: "а",
      AElig: "Æ",
      aelig: "æ",
      af: "⁡",
      Afr: "𝔄",
      afr: "𝔞",
      Agrave: "À",
      agrave: "à",
      alefsym: "ℵ",
      aleph: "ℵ",
      Alpha: "Α",
      alpha: "α",
      Amacr: "Ā",
      amacr: "ā",
      amalg: "⨿",
      AMP: "&",
      amp: "&",
      And: "⩓",
      and: "∧",
      andand: "⩕",
      andd: "⩜",
      andslope: "⩘",
      andv: "⩚",
      ang: "∠",
      ange: "⦤",
      angle: "∠",
      angmsd: "∡",
      angmsdaa: "⦨",
      angmsdab: "⦩",
      angmsdac: "⦪",
      angmsdad: "⦫",
      angmsdae: "⦬",
      angmsdaf: "⦭",
      angmsdag: "⦮",
      angmsdah: "⦯",
      angrt: "∟",
      angrtvb: "⊾",
      angrtvbd: "⦝",
      angsph: "∢",
      angst: "Å",
      angzarr: "⍼",
      Aogon: "Ą",
      aogon: "ą",
      Aopf: "𝔸",
      aopf: "𝕒",
      ap: "≈",
      apacir: "⩯",
      apE: "⩰",
      ape: "≊",
      apid: "≋",
      apos: "'",
      ApplyFunction: "⁡",
      approx: "≈",
      approxeq: "≊",
      Aring: "Å",
      aring: "å",
      Ascr: "𝒜",
      ascr: "𝒶",
      Assign: "≔",
      ast: "*",
      asymp: "≈",
      asympeq: "≍",
      Atilde: "Ã",
      atilde: "ã",
      Auml: "Ä",
      auml: "ä",
      awconint: "∳",
      awint: "⨑",
      backcong: "≌",
      backepsilon: "϶",
      backprime: "‵",
      backsim: "∽",
      backsimeq: "⋍",
      Backslash: "∖",
      Barv: "⫧",
      barvee: "⊽",
      Barwed: "⌆",
      barwed: "⌅",
      barwedge: "⌅",
      bbrk: "⎵",
      bbrktbrk: "⎶",
      bcong: "≌",
      Bcy: "Б",
      bcy: "б",
      bdquo: "„",
      becaus: "∵",
      Because: "∵",
      because: "∵",
      bemptyv: "⦰",
      bepsi: "϶",
      bernou: "ℬ",
      Bernoullis: "ℬ",
      Beta: "Β",
      beta: "β",
      beth: "ℶ",
      between: "≬",
      Bfr: "𝔅",
      bfr: "𝔟",
      bigcap: "⋂",
      bigcirc: "◯",
      bigcup: "⋃",
      bigodot: "⨀",
      bigoplus: "⨁",
      bigotimes: "⨂",
      bigsqcup: "⨆",
      bigstar: "★",
      bigtriangledown: "▽",
      bigtriangleup: "△",
      biguplus: "⨄",
      bigvee: "⋁",
      bigwedge: "⋀",
      bkarow: "⤍",
      blacklozenge: "⧫",
      blacksquare: "▪",
      blacktriangle: "▴",
      blacktriangledown: "▾",
      blacktriangleleft: "◂",
      blacktriangleright: "▸",
      blank: "␣",
      blk12: "▒",
      blk14: "░",
      blk34: "▓",
      block: "█",
      bne: "=⃥",
      bnequiv: "≡⃥",
      bNot: "⫭",
      bnot: "⌐",
      Bopf: "𝔹",
      bopf: "𝕓",
      bot: "⊥",
      bottom: "⊥",
      bowtie: "⋈",
      boxbox: "⧉",
      boxDL: "╗",
      boxDl: "╖",
      boxdL: "╕",
      boxdl: "┐",
      boxDR: "╔",
      boxDr: "╓",
      boxdR: "╒",
      boxdr: "┌",
      boxH: "═",
      boxh: "─",
      boxHD: "╦",
      boxHd: "╤",
      boxhD: "╥",
      boxhd: "┬",
      boxHU: "╩",
      boxHu: "╧",
      boxhU: "╨",
      boxhu: "┴",
      boxminus: "⊟",
      boxplus: "⊞",
      boxtimes: "⊠",
      boxUL: "╝",
      boxUl: "╜",
      boxuL: "╛",
      boxul: "┘",
      boxUR: "╚",
      boxUr: "╙",
      boxuR: "╘",
      boxur: "└",
      boxV: "║",
      boxv: "│",
      boxVH: "╬",
      boxVh: "╫",
      boxvH: "╪",
      boxvh: "┼",
      boxVL: "╣",
      boxVl: "╢",
      boxvL: "╡",
      boxvl: "┤",
      boxVR: "╠",
      boxVr: "╟",
      boxvR: "╞",
      boxvr: "├",
      bprime: "‵",
      Breve: "˘",
      breve: "˘",
      brvbar: "¦",
      Bscr: "ℬ",
      bscr: "𝒷",
      bsemi: "⁏",
      bsim: "∽",
      bsime: "⋍",
      bsol: "\\",
      bsolb: "⧅",
      bsolhsub: "⟈",
      bull: "•",
      bullet: "•",
      bump: "≎",
      bumpE: "⪮",
      bumpe: "≏",
      Bumpeq: "≎",
      bumpeq: "≏",
      Cacute: "Ć",
      cacute: "ć",
      Cap: "⋒",
      cap: "∩",
      capand: "⩄",
      capbrcup: "⩉",
      capcap: "⩋",
      capcup: "⩇",
      capdot: "⩀",
      CapitalDifferentialD: "ⅅ",
      caps: "∩︀",
      caret: "⁁",
      caron: "ˇ",
      Cayleys: "ℭ",
      ccaps: "⩍",
      Ccaron: "Č",
      ccaron: "č",
      Ccedil: "Ç",
      ccedil: "ç",
      Ccirc: "Ĉ",
      ccirc: "ĉ",
      Cconint: "∰",
      ccups: "⩌",
      ccupssm: "⩐",
      Cdot: "Ċ",
      cdot: "ċ",
      cedil: "¸",
      Cedilla: "¸",
      cemptyv: "⦲",
      cent: "¢",
      CenterDot: "·",
      centerdot: "·",
      Cfr: "ℭ",
      cfr: "𝔠",
      CHcy: "Ч",
      chcy: "ч",
      check: "✓",
      checkmark: "✓",
      Chi: "Χ",
      chi: "χ",
      cir: "○",
      circ: "ˆ",
      circeq: "≗",
      circlearrowleft: "↺",
      circlearrowright: "↻",
      circledast: "⊛",
      circledcirc: "⊚",
      circleddash: "⊝",
      CircleDot: "⊙",
      circledR: "®",
      circledS: "Ⓢ",
      CircleMinus: "⊖",
      CirclePlus: "⊕",
      CircleTimes: "⊗",
      cirE: "⧃",
      cire: "≗",
      cirfnint: "⨐",
      cirmid: "⫯",
      cirscir: "⧂",
      ClockwiseContourIntegral: "∲",
      CloseCurlyDoubleQuote: "”",
      CloseCurlyQuote: "’",
      clubs: "♣",
      clubsuit: "♣",
      Colon: "∷",
      colon: ":",
      Colone: "⩴",
      colone: "≔",
      coloneq: "≔",
      comma: ",",
      commat: "@",
      comp: "∁",
      compfn: "∘",
      complement: "∁",
      complexes: "ℂ",
      cong: "≅",
      congdot: "⩭",
      Congruent: "≡",
      Conint: "∯",
      conint: "∮",
      ContourIntegral: "∮",
      Copf: "ℂ",
      copf: "𝕔",
      coprod: "∐",
      Coproduct: "∐",
      COPY: "©",
      copy: "©",
      copysr: "℗",
      CounterClockwiseContourIntegral: "∳",
      crarr: "↵",
      Cross: "⨯",
      cross: "✗",
      Cscr: "𝒞",
      cscr: "𝒸",
      csub: "⫏",
      csube: "⫑",
      csup: "⫐",
      csupe: "⫒",
      ctdot: "⋯",
      cudarrl: "⤸",
      cudarrr: "⤵",
      cuepr: "⋞",
      cuesc: "⋟",
      cularr: "↶",
      cularrp: "⤽",
      Cup: "⋓",
      cup: "∪",
      cupbrcap: "⩈",
      CupCap: "≍",
      cupcap: "⩆",
      cupcup: "⩊",
      cupdot: "⊍",
      cupor: "⩅",
      cups: "∪︀",
      curarr: "↷",
      curarrm: "⤼",
      curlyeqprec: "⋞",
      curlyeqsucc: "⋟",
      curlyvee: "⋎",
      curlywedge: "⋏",
      curren: "¤",
      curvearrowleft: "↶",
      curvearrowright: "↷",
      cuvee: "⋎",
      cuwed: "⋏",
      cwconint: "∲",
      cwint: "∱",
      cylcty: "⌭",
      Dagger: "‡",
      dagger: "†",
      daleth: "ℸ",
      Darr: "↡",
      dArr: "⇓",
      darr: "↓",
      dash: "‐",
      Dashv: "⫤",
      dashv: "⊣",
      dbkarow: "⤏",
      dblac: "˝",
      Dcaron: "Ď",
      dcaron: "ď",
      Dcy: "Д",
      dcy: "д",
      DD: "ⅅ",
      dd: "ⅆ",
      ddagger: "‡",
      ddarr: "⇊",
      DDotrahd: "⤑",
      ddotseq: "⩷",
      deg: "°",
      Del: "∇",
      Delta: "Δ",
      delta: "δ",
      demptyv: "⦱",
      dfisht: "⥿",
      Dfr: "𝔇",
      dfr: "𝔡",
      dHar: "⥥",
      dharl: "⇃",
      dharr: "⇂",
      DiacriticalAcute: "´",
      DiacriticalDot: "˙",
      DiacriticalDoubleAcute: "˝",
      DiacriticalGrave: "`",
      DiacriticalTilde: "˜",
      diam: "⋄",
      Diamond: "⋄",
      diamond: "⋄",
      diamondsuit: "♦",
      diams: "♦",
      die: "¨",
      DifferentialD: "ⅆ",
      digamma: "ϝ",
      disin: "⋲",
      div: "÷",
      divide: "÷",
      divideontimes: "⋇",
      divonx: "⋇",
      DJcy: "Ђ",
      djcy: "ђ",
      dlcorn: "⌞",
      dlcrop: "⌍",
      dollar: "$",
      Dopf: "𝔻",
      dopf: "𝕕",
      Dot: "¨",
      dot: "˙",
      DotDot: "⃜",
      doteq: "≐",
      doteqdot: "≑",
      DotEqual: "≐",
      dotminus: "∸",
      dotplus: "∔",
      dotsquare: "⊡",
      doublebarwedge: "⌆",
      DoubleContourIntegral: "∯",
      DoubleDot: "¨",
      DoubleDownArrow: "⇓",
      DoubleLeftArrow: "⇐",
      DoubleLeftRightArrow: "⇔",
      DoubleLeftTee: "⫤",
      DoubleLongLeftArrow: "⟸",
      DoubleLongLeftRightArrow: "⟺",
      DoubleLongRightArrow: "⟹",
      DoubleRightArrow: "⇒",
      DoubleRightTee: "⊨",
      DoubleUpArrow: "⇑",
      DoubleUpDownArrow: "⇕",
      DoubleVerticalBar: "∥",
      DownArrow: "↓",
      Downarrow: "⇓",
      downarrow: "↓",
      DownArrowBar: "⤓",
      DownArrowUpArrow: "⇵",
      DownBreve: "̑",
      downdownarrows: "⇊",
      downharpoonleft: "⇃",
      downharpoonright: "⇂",
      DownLeftRightVector: "⥐",
      DownLeftTeeVector: "⥞",
      DownLeftVector: "↽",
      DownLeftVectorBar: "⥖",
      DownRightTeeVector: "⥟",
      DownRightVector: "⇁",
      DownRightVectorBar: "⥗",
      DownTee: "⊤",
      DownTeeArrow: "↧",
      drbkarow: "⤐",
      drcorn: "⌟",
      drcrop: "⌌",
      Dscr: "𝒟",
      dscr: "𝒹",
      DScy: "Ѕ",
      dscy: "ѕ",
      dsol: "⧶",
      Dstrok: "Đ",
      dstrok: "đ",
      dtdot: "⋱",
      dtri: "▿",
      dtrif: "▾",
      duarr: "⇵",
      duhar: "⥯",
      dwangle: "⦦",
      DZcy: "Џ",
      dzcy: "џ",
      dzigrarr: "⟿",
      Eacute: "É",
      eacute: "é",
      easter: "⩮",
      Ecaron: "Ě",
      ecaron: "ě",
      ecir: "≖",
      Ecirc: "Ê",
      ecirc: "ê",
      ecolon: "≕",
      Ecy: "Э",
      ecy: "э",
      eDDot: "⩷",
      Edot: "Ė",
      eDot: "≑",
      edot: "ė",
      ee: "ⅇ",
      efDot: "≒",
      Efr: "𝔈",
      efr: "𝔢",
      eg: "⪚",
      Egrave: "È",
      egrave: "è",
      egs: "⪖",
      egsdot: "⪘",
      el: "⪙",
      Element: "∈",
      elinters: "⏧",
      ell: "ℓ",
      els: "⪕",
      elsdot: "⪗",
      Emacr: "Ē",
      emacr: "ē",
      empty: "∅",
      emptyset: "∅",
      EmptySmallSquare: "◻",
      emptyv: "∅",
      EmptyVerySmallSquare: "▫",
      emsp: " ",
      emsp13: " ",
      emsp14: " ",
      ENG: "Ŋ",
      eng: "ŋ",
      ensp: " ",
      Eogon: "Ę",
      eogon: "ę",
      Eopf: "𝔼",
      eopf: "𝕖",
      epar: "⋕",
      eparsl: "⧣",
      eplus: "⩱",
      epsi: "ε",
      Epsilon: "Ε",
      epsilon: "ε",
      epsiv: "ϵ",
      eqcirc: "≖",
      eqcolon: "≕",
      eqsim: "≂",
      eqslantgtr: "⪖",
      eqslantless: "⪕",
      Equal: "⩵",
      equals: "=",
      EqualTilde: "≂",
      equest: "≟",
      Equilibrium: "⇌",
      equiv: "≡",
      equivDD: "⩸",
      eqvparsl: "⧥",
      erarr: "⥱",
      erDot: "≓",
      Escr: "ℰ",
      escr: "ℯ",
      esdot: "≐",
      Esim: "⩳",
      esim: "≂",
      Eta: "Η",
      eta: "η",
      ETH: "Ð",
      eth: "ð",
      Euml: "Ë",
      euml: "ë",
      euro: "€",
      excl: "!",
      exist: "∃",
      Exists: "∃",
      expectation: "ℰ",
      ExponentialE: "ⅇ",
      exponentiale: "ⅇ",
      fallingdotseq: "≒",
      Fcy: "Ф",
      fcy: "ф",
      female: "♀",
      ffilig: "ﬃ",
      fflig: "ﬀ",
      ffllig: "ﬄ",
      Ffr: "𝔉",
      ffr: "𝔣",
      filig: "ﬁ",
      FilledSmallSquare: "◼",
      FilledVerySmallSquare: "▪",
      fjlig: "fj",
      flat: "♭",
      fllig: "ﬂ",
      fltns: "▱",
      fnof: "ƒ",
      Fopf: "𝔽",
      fopf: "𝕗",
      ForAll: "∀",
      forall: "∀",
      fork: "⋔",
      forkv: "⫙",
      Fouriertrf: "ℱ",
      fpartint: "⨍",
      frac12: "½",
      frac13: "⅓",
      frac14: "¼",
      frac15: "⅕",
      frac16: "⅙",
      frac18: "⅛",
      frac23: "⅔",
      frac25: "⅖",
      frac34: "¾",
      frac35: "⅗",
      frac38: "⅜",
      frac45: "⅘",
      frac56: "⅚",
      frac58: "⅝",
      frac78: "⅞",
      frasl: "⁄",
      frown: "⌢",
      Fscr: "ℱ",
      fscr: "𝒻",
      gacute: "ǵ",
      Gamma: "Γ",
      gamma: "γ",
      Gammad: "Ϝ",
      gammad: "ϝ",
      gap: "⪆",
      Gbreve: "Ğ",
      gbreve: "ğ",
      Gcedil: "Ģ",
      Gcirc: "Ĝ",
      gcirc: "ĝ",
      Gcy: "Г",
      gcy: "г",
      Gdot: "Ġ",
      gdot: "ġ",
      gE: "≧",
      ge: "≥",
      gEl: "⪌",
      gel: "⋛",
      geq: "≥",
      geqq: "≧",
      geqslant: "⩾",
      ges: "⩾",
      gescc: "⪩",
      gesdot: "⪀",
      gesdoto: "⪂",
      gesdotol: "⪄",
      gesl: "⋛︀",
      gesles: "⪔",
      Gfr: "𝔊",
      gfr: "𝔤",
      Gg: "⋙",
      gg: "≫",
      ggg: "⋙",
      gimel: "ℷ",
      GJcy: "Ѓ",
      gjcy: "ѓ",
      gl: "≷",
      gla: "⪥",
      glE: "⪒",
      glj: "⪤",
      gnap: "⪊",
      gnapprox: "⪊",
      gnE: "≩",
      gne: "⪈",
      gneq: "⪈",
      gneqq: "≩",
      gnsim: "⋧",
      Gopf: "𝔾",
      gopf: "𝕘",
      grave: "`",
      GreaterEqual: "≥",
      GreaterEqualLess: "⋛",
      GreaterFullEqual: "≧",
      GreaterGreater: "⪢",
      GreaterLess: "≷",
      GreaterSlantEqual: "⩾",
      GreaterTilde: "≳",
      Gscr: "𝒢",
      gscr: "ℊ",
      gsim: "≳",
      gsime: "⪎",
      gsiml: "⪐",
      Gt: "≫",
      GT: ">",
      gt: ">",
      gtcc: "⪧",
      gtcir: "⩺",
      gtdot: "⋗",
      gtlPar: "⦕",
      gtquest: "⩼",
      gtrapprox: "⪆",
      gtrarr: "⥸",
      gtrdot: "⋗",
      gtreqless: "⋛",
      gtreqqless: "⪌",
      gtrless: "≷",
      gtrsim: "≳",
      gvertneqq: "≩︀",
      gvnE: "≩︀",
      Hacek: "ˇ",
      hairsp: " ",
      half: "½",
      hamilt: "ℋ",
      HARDcy: "Ъ",
      hardcy: "ъ",
      hArr: "⇔",
      harr: "↔",
      harrcir: "⥈",
      harrw: "↭",
      Hat: "^",
      hbar: "ℏ",
      Hcirc: "Ĥ",
      hcirc: "ĥ",
      hearts: "♥",
      heartsuit: "♥",
      hellip: "…",
      hercon: "⊹",
      Hfr: "ℌ",
      hfr: "𝔥",
      HilbertSpace: "ℋ",
      hksearow: "⤥",
      hkswarow: "⤦",
      hoarr: "⇿",
      homtht: "∻",
      hookleftarrow: "↩",
      hookrightarrow: "↪",
      Hopf: "ℍ",
      hopf: "𝕙",
      horbar: "―",
      HorizontalLine: "─",
      Hscr: "ℋ",
      hscr: "𝒽",
      hslash: "ℏ",
      Hstrok: "Ħ",
      hstrok: "ħ",
      HumpDownHump: "≎",
      HumpEqual: "≏",
      hybull: "⁃",
      hyphen: "‐",
      Iacute: "Í",
      iacute: "í",
      ic: "⁣",
      Icirc: "Î",
      icirc: "î",
      Icy: "И",
      icy: "и",
      Idot: "İ",
      IEcy: "Е",
      iecy: "е",
      iexcl: "¡",
      iff: "⇔",
      Ifr: "ℑ",
      ifr: "𝔦",
      Igrave: "Ì",
      igrave: "ì",
      ii: "ⅈ",
      iiiint: "⨌",
      iiint: "∭",
      iinfin: "⧜",
      iiota: "℩",
      IJlig: "Ĳ",
      ijlig: "ĳ",
      Im: "ℑ",
      Imacr: "Ī",
      imacr: "ī",
      image: "ℑ",
      ImaginaryI: "ⅈ",
      imagline: "ℐ",
      imagpart: "ℑ",
      imath: "ı",
      imof: "⊷",
      imped: "Ƶ",
      Implies: "⇒",
      in: "∈",
      incare: "℅",
      infin: "∞",
      infintie: "⧝",
      inodot: "ı",
      Int: "∬",
      int: "∫",
      intcal: "⊺",
      integers: "ℤ",
      Integral: "∫",
      intercal: "⊺",
      Intersection: "⋂",
      intlarhk: "⨗",
      intprod: "⨼",
      InvisibleComma: "⁣",
      InvisibleTimes: "⁢",
      IOcy: "Ё",
      iocy: "ё",
      Iogon: "Į",
      iogon: "į",
      Iopf: "𝕀",
      iopf: "𝕚",
      Iota: "Ι",
      iota: "ι",
      iprod: "⨼",
      iquest: "¿",
      Iscr: "ℐ",
      iscr: "𝒾",
      isin: "∈",
      isindot: "⋵",
      isinE: "⋹",
      isins: "⋴",
      isinsv: "⋳",
      isinv: "∈",
      it: "⁢",
      Itilde: "Ĩ",
      itilde: "ĩ",
      Iukcy: "І",
      iukcy: "і",
      Iuml: "Ï",
      iuml: "ï",
      Jcirc: "Ĵ",
      jcirc: "ĵ",
      Jcy: "Й",
      jcy: "й",
      Jfr: "𝔍",
      jfr: "𝔧",
      jmath: "ȷ",
      Jopf: "𝕁",
      jopf: "𝕛",
      Jscr: "𝒥",
      jscr: "𝒿",
      Jsercy: "Ј",
      jsercy: "ј",
      Jukcy: "Є",
      jukcy: "є",
      Kappa: "Κ",
      kappa: "κ",
      kappav: "ϰ",
      Kcedil: "Ķ",
      kcedil: "ķ",
      Kcy: "К",
      kcy: "к",
      Kfr: "𝔎",
      kfr: "𝔨",
      kgreen: "ĸ",
      KHcy: "Х",
      khcy: "х",
      KJcy: "Ќ",
      kjcy: "ќ",
      Kopf: "𝕂",
      kopf: "𝕜",
      Kscr: "𝒦",
      kscr: "𝓀",
      lAarr: "⇚",
      Lacute: "Ĺ",
      lacute: "ĺ",
      laemptyv: "⦴",
      lagran: "ℒ",
      Lambda: "Λ",
      lambda: "λ",
      Lang: "⟪",
      lang: "⟨",
      langd: "⦑",
      langle: "⟨",
      lap: "⪅",
      Laplacetrf: "ℒ",
      laquo: "«",
      Larr: "↞",
      lArr: "⇐",
      larr: "←",
      larrb: "⇤",
      larrbfs: "⤟",
      larrfs: "⤝",
      larrhk: "↩",
      larrlp: "↫",
      larrpl: "⤹",
      larrsim: "⥳",
      larrtl: "↢",
      lat: "⪫",
      lAtail: "⤛",
      latail: "⤙",
      late: "⪭",
      lates: "⪭︀",
      lBarr: "⤎",
      lbarr: "⤌",
      lbbrk: "❲",
      lbrace: "{",
      lbrack: "[",
      lbrke: "⦋",
      lbrksld: "⦏",
      lbrkslu: "⦍",
      Lcaron: "Ľ",
      lcaron: "ľ",
      Lcedil: "Ļ",
      lcedil: "ļ",
      lceil: "⌈",
      lcub: "{",
      Lcy: "Л",
      lcy: "л",
      ldca: "⤶",
      ldquo: "“",
      ldquor: "„",
      ldrdhar: "⥧",
      ldrushar: "⥋",
      ldsh: "↲",
      lE: "≦",
      le: "≤",
      LeftAngleBracket: "⟨",
      LeftArrow: "←",
      Leftarrow: "⇐",
      leftarrow: "←",
      LeftArrowBar: "⇤",
      LeftArrowRightArrow: "⇆",
      leftarrowtail: "↢",
      LeftCeiling: "⌈",
      LeftDoubleBracket: "⟦",
      LeftDownTeeVector: "⥡",
      LeftDownVector: "⇃",
      LeftDownVectorBar: "⥙",
      LeftFloor: "⌊",
      leftharpoondown: "↽",
      leftharpoonup: "↼",
      leftleftarrows: "⇇",
      LeftRightArrow: "↔",
      Leftrightarrow: "⇔",
      leftrightarrow: "↔",
      leftrightarrows: "⇆",
      leftrightharpoons: "⇋",
      leftrightsquigarrow: "↭",
      LeftRightVector: "⥎",
      LeftTee: "⊣",
      LeftTeeArrow: "↤",
      LeftTeeVector: "⥚",
      leftthreetimes: "⋋",
      LeftTriangle: "⊲",
      LeftTriangleBar: "⧏",
      LeftTriangleEqual: "⊴",
      LeftUpDownVector: "⥑",
      LeftUpTeeVector: "⥠",
      LeftUpVector: "↿",
      LeftUpVectorBar: "⥘",
      LeftVector: "↼",
      LeftVectorBar: "⥒",
      lEg: "⪋",
      leg: "⋚",
      leq: "≤",
      leqq: "≦",
      leqslant: "⩽",
      les: "⩽",
      lescc: "⪨",
      lesdot: "⩿",
      lesdoto: "⪁",
      lesdotor: "⪃",
      lesg: "⋚︀",
      lesges: "⪓",
      lessapprox: "⪅",
      lessdot: "⋖",
      lesseqgtr: "⋚",
      lesseqqgtr: "⪋",
      LessEqualGreater: "⋚",
      LessFullEqual: "≦",
      LessGreater: "≶",
      lessgtr: "≶",
      LessLess: "⪡",
      lesssim: "≲",
      LessSlantEqual: "⩽",
      LessTilde: "≲",
      lfisht: "⥼",
      lfloor: "⌊",
      Lfr: "𝔏",
      lfr: "𝔩",
      lg: "≶",
      lgE: "⪑",
      lHar: "⥢",
      lhard: "↽",
      lharu: "↼",
      lharul: "⥪",
      lhblk: "▄",
      LJcy: "Љ",
      ljcy: "љ",
      Ll: "⋘",
      ll: "≪",
      llarr: "⇇",
      llcorner: "⌞",
      Lleftarrow: "⇚",
      llhard: "⥫",
      lltri: "◺",
      Lmidot: "Ŀ",
      lmidot: "ŀ",
      lmoust: "⎰",
      lmoustache: "⎰",
      lnap: "⪉",
      lnapprox: "⪉",
      lnE: "≨",
      lne: "⪇",
      lneq: "⪇",
      lneqq: "≨",
      lnsim: "⋦",
      loang: "⟬",
      loarr: "⇽",
      lobrk: "⟦",
      LongLeftArrow: "⟵",
      Longleftarrow: "⟸",
      longleftarrow: "⟵",
      LongLeftRightArrow: "⟷",
      Longleftrightarrow: "⟺",
      longleftrightarrow: "⟷",
      longmapsto: "⟼",
      LongRightArrow: "⟶",
      Longrightarrow: "⟹",
      longrightarrow: "⟶",
      looparrowleft: "↫",
      looparrowright: "↬",
      lopar: "⦅",
      Lopf: "𝕃",
      lopf: "𝕝",
      loplus: "⨭",
      lotimes: "⨴",
      lowast: "∗",
      lowbar: "_",
      LowerLeftArrow: "↙",
      LowerRightArrow: "↘",
      loz: "◊",
      lozenge: "◊",
      lozf: "⧫",
      lpar: "(",
      lparlt: "⦓",
      lrarr: "⇆",
      lrcorner: "⌟",
      lrhar: "⇋",
      lrhard: "⥭",
      lrm: "‎",
      lrtri: "⊿",
      lsaquo: "‹",
      Lscr: "ℒ",
      lscr: "𝓁",
      Lsh: "↰",
      lsh: "↰",
      lsim: "≲",
      lsime: "⪍",
      lsimg: "⪏",
      lsqb: "[",
      lsquo: "‘",
      lsquor: "‚",
      Lstrok: "Ł",
      lstrok: "ł",
      Lt: "≪",
      LT: "<",
      lt: "<",
      ltcc: "⪦",
      ltcir: "⩹",
      ltdot: "⋖",
      lthree: "⋋",
      ltimes: "⋉",
      ltlarr: "⥶",
      ltquest: "⩻",
      ltri: "◃",
      ltrie: "⊴",
      ltrif: "◂",
      ltrPar: "⦖",
      lurdshar: "⥊",
      luruhar: "⥦",
      lvertneqq: "≨︀",
      lvnE: "≨︀",
      macr: "¯",
      male: "♂",
      malt: "✠",
      maltese: "✠",
      Map: "⤅",
      map: "↦",
      mapsto: "↦",
      mapstodown: "↧",
      mapstoleft: "↤",
      mapstoup: "↥",
      marker: "▮",
      mcomma: "⨩",
      Mcy: "М",
      mcy: "м",
      mdash: "—",
      mDDot: "∺",
      measuredangle: "∡",
      MediumSpace: " ",
      Mellintrf: "ℳ",
      Mfr: "𝔐",
      mfr: "𝔪",
      mho: "℧",
      micro: "µ",
      mid: "∣",
      midast: "*",
      midcir: "⫰",
      middot: "·",
      minus: "−",
      minusb: "⊟",
      minusd: "∸",
      minusdu: "⨪",
      MinusPlus: "∓",
      mlcp: "⫛",
      mldr: "…",
      mnplus: "∓",
      models: "⊧",
      Mopf: "𝕄",
      mopf: "𝕞",
      mp: "∓",
      Mscr: "ℳ",
      mscr: "𝓂",
      mstpos: "∾",
      Mu: "Μ",
      mu: "μ",
      multimap: "⊸",
      mumap: "⊸",
      nabla: "∇",
      Nacute: "Ń",
      nacute: "ń",
      nang: "∠⃒",
      nap: "≉",
      napE: "⩰̸",
      napid: "≋̸",
      napos: "ŉ",
      napprox: "≉",
      natur: "♮",
      natural: "♮",
      naturals: "ℕ",
      nbsp: " ",
      nbump: "≎̸",
      nbumpe: "≏̸",
      ncap: "⩃",
      Ncaron: "Ň",
      ncaron: "ň",
      Ncedil: "Ņ",
      ncedil: "ņ",
      ncong: "≇",
      ncongdot: "⩭̸",
      ncup: "⩂",
      Ncy: "Н",
      ncy: "н",
      ndash: "–",
      ne: "≠",
      nearhk: "⤤",
      neArr: "⇗",
      nearr: "↗",
      nearrow: "↗",
      nedot: "≐̸",
      NegativeMediumSpace: "​",
      NegativeThickSpace: "​",
      NegativeThinSpace: "​",
      NegativeVeryThinSpace: "​",
      nequiv: "≢",
      nesear: "⤨",
      nesim: "≂̸",
      NestedGreaterGreater: "≫",
      NestedLessLess: "≪",
      NewLine: "\n",
      nexist: "∄",
      nexists: "∄",
      Nfr: "𝔑",
      nfr: "𝔫",
      ngE: "≧̸",
      nge: "≱",
      ngeq: "≱",
      ngeqq: "≧̸",
      ngeqslant: "⩾̸",
      nges: "⩾̸",
      nGg: "⋙̸",
      ngsim: "≵",
      nGt: "≫⃒",
      ngt: "≯",
      ngtr: "≯",
      nGtv: "≫̸",
      nhArr: "⇎",
      nharr: "↮",
      nhpar: "⫲",
      ni: "∋",
      nis: "⋼",
      nisd: "⋺",
      niv: "∋",
      NJcy: "Њ",
      njcy: "њ",
      nlArr: "⇍",
      nlarr: "↚",
      nldr: "‥",
      nlE: "≦̸",
      nle: "≰",
      nLeftarrow: "⇍",
      nleftarrow: "↚",
      nLeftrightarrow: "⇎",
      nleftrightarrow: "↮",
      nleq: "≰",
      nleqq: "≦̸",
      nleqslant: "⩽̸",
      nles: "⩽̸",
      nless: "≮",
      nLl: "⋘̸",
      nlsim: "≴",
      nLt: "≪⃒",
      nlt: "≮",
      nltri: "⋪",
      nltrie: "⋬",
      nLtv: "≪̸",
      nmid: "∤",
      NoBreak: "⁠",
      NonBreakingSpace: " ",
      Nopf: "ℕ",
      nopf: "𝕟",
      Not: "⫬",
      not: "¬",
      NotCongruent: "≢",
      NotCupCap: "≭",
      NotDoubleVerticalBar: "∦",
      NotElement: "∉",
      NotEqual: "≠",
      NotEqualTilde: "≂̸",
      NotExists: "∄",
      NotGreater: "≯",
      NotGreaterEqual: "≱",
      NotGreaterFullEqual: "≧̸",
      NotGreaterGreater: "≫̸",
      NotGreaterLess: "≹",
      NotGreaterSlantEqual: "⩾̸",
      NotGreaterTilde: "≵",
      NotHumpDownHump: "≎̸",
      NotHumpEqual: "≏̸",
      notin: "∉",
      notindot: "⋵̸",
      notinE: "⋹̸",
      notinva: "∉",
      notinvb: "⋷",
      notinvc: "⋶",
      NotLeftTriangle: "⋪",
      NotLeftTriangleBar: "⧏̸",
      NotLeftTriangleEqual: "⋬",
      NotLess: "≮",
      NotLessEqual: "≰",
      NotLessGreater: "≸",
      NotLessLess: "≪̸",
      NotLessSlantEqual: "⩽̸",
      NotLessTilde: "≴",
      NotNestedGreaterGreater: "⪢̸",
      NotNestedLessLess: "⪡̸",
      notni: "∌",
      notniva: "∌",
      notnivb: "⋾",
      notnivc: "⋽",
      NotPrecedes: "⊀",
      NotPrecedesEqual: "⪯̸",
      NotPrecedesSlantEqual: "⋠",
      NotReverseElement: "∌",
      NotRightTriangle: "⋫",
      NotRightTriangleBar: "⧐̸",
      NotRightTriangleEqual: "⋭",
      NotSquareSubset: "⊏̸",
      NotSquareSubsetEqual: "⋢",
      NotSquareSuperset: "⊐̸",
      NotSquareSupersetEqual: "⋣",
      NotSubset: "⊂⃒",
      NotSubsetEqual: "⊈",
      NotSucceeds: "⊁",
      NotSucceedsEqual: "⪰̸",
      NotSucceedsSlantEqual: "⋡",
      NotSucceedsTilde: "≿̸",
      NotSuperset: "⊃⃒",
      NotSupersetEqual: "⊉",
      NotTilde: "≁",
      NotTildeEqual: "≄",
      NotTildeFullEqual: "≇",
      NotTildeTilde: "≉",
      NotVerticalBar: "∤",
      npar: "∦",
      nparallel: "∦",
      nparsl: "⫽⃥",
      npart: "∂̸",
      npolint: "⨔",
      npr: "⊀",
      nprcue: "⋠",
      npre: "⪯̸",
      nprec: "⊀",
      npreceq: "⪯̸",
      nrArr: "⇏",
      nrarr: "↛",
      nrarrc: "⤳̸",
      nrarrw: "↝̸",
      nRightarrow: "⇏",
      nrightarrow: "↛",
      nrtri: "⋫",
      nrtrie: "⋭",
      nsc: "⊁",
      nsccue: "⋡",
      nsce: "⪰̸",
      Nscr: "𝒩",
      nscr: "𝓃",
      nshortmid: "∤",
      nshortparallel: "∦",
      nsim: "≁",
      nsime: "≄",
      nsimeq: "≄",
      nsmid: "∤",
      nspar: "∦",
      nsqsube: "⋢",
      nsqsupe: "⋣",
      nsub: "⊄",
      nsubE: "⫅̸",
      nsube: "⊈",
      nsubset: "⊂⃒",
      nsubseteq: "⊈",
      nsubseteqq: "⫅̸",
      nsucc: "⊁",
      nsucceq: "⪰̸",
      nsup: "⊅",
      nsupE: "⫆̸",
      nsupe: "⊉",
      nsupset: "⊃⃒",
      nsupseteq: "⊉",
      nsupseteqq: "⫆̸",
      ntgl: "≹",
      Ntilde: "Ñ",
      ntilde: "ñ",
      ntlg: "≸",
      ntriangleleft: "⋪",
      ntrianglelefteq: "⋬",
      ntriangleright: "⋫",
      ntrianglerighteq: "⋭",
      Nu: "Ν",
      nu: "ν",
      num: "#",
      numero: "№",
      numsp: " ",
      nvap: "≍⃒",
      nVDash: "⊯",
      nVdash: "⊮",
      nvDash: "⊭",
      nvdash: "⊬",
      nvge: "≥⃒",
      nvgt: ">⃒",
      nvHarr: "⤄",
      nvinfin: "⧞",
      nvlArr: "⤂",
      nvle: "≤⃒",
      nvlt: "<⃒",
      nvltrie: "⊴⃒",
      nvrArr: "⤃",
      nvrtrie: "⊵⃒",
      nvsim: "∼⃒",
      nwarhk: "⤣",
      nwArr: "⇖",
      nwarr: "↖",
      nwarrow: "↖",
      nwnear: "⤧",
      Oacute: "Ó",
      oacute: "ó",
      oast: "⊛",
      ocir: "⊚",
      Ocirc: "Ô",
      ocirc: "ô",
      Ocy: "О",
      ocy: "о",
      odash: "⊝",
      Odblac: "Ő",
      odblac: "ő",
      odiv: "⨸",
      odot: "⊙",
      odsold: "⦼",
      OElig: "Œ",
      oelig: "œ",
      ofcir: "⦿",
      Ofr: "𝔒",
      ofr: "𝔬",
      ogon: "˛",
      Ograve: "Ò",
      ograve: "ò",
      ogt: "⧁",
      ohbar: "⦵",
      ohm: "Ω",
      oint: "∮",
      olarr: "↺",
      olcir: "⦾",
      olcross: "⦻",
      oline: "‾",
      olt: "⧀",
      Omacr: "Ō",
      omacr: "ō",
      Omega: "Ω",
      omega: "ω",
      Omicron: "Ο",
      omicron: "ο",
      omid: "⦶",
      ominus: "⊖",
      Oopf: "𝕆",
      oopf: "𝕠",
      opar: "⦷",
      OpenCurlyDoubleQuote: "“",
      OpenCurlyQuote: "‘",
      operp: "⦹",
      oplus: "⊕",
      Or: "⩔",
      or: "∨",
      orarr: "↻",
      ord: "⩝",
      order: "ℴ",
      orderof: "ℴ",
      ordf: "ª",
      ordm: "º",
      origof: "⊶",
      oror: "⩖",
      orslope: "⩗",
      orv: "⩛",
      oS: "Ⓢ",
      Oscr: "𝒪",
      oscr: "ℴ",
      Oslash: "Ø",
      oslash: "ø",
      osol: "⊘",
      Otilde: "Õ",
      otilde: "õ",
      Otimes: "⨷",
      otimes: "⊗",
      otimesas: "⨶",
      Ouml: "Ö",
      ouml: "ö",
      ovbar: "⌽",
      OverBar: "‾",
      OverBrace: "⏞",
      OverBracket: "⎴",
      OverParenthesis: "⏜",
      par: "∥",
      para: "¶",
      parallel: "∥",
      parsim: "⫳",
      parsl: "⫽",
      part: "∂",
      PartialD: "∂",
      Pcy: "П",
      pcy: "п",
      percnt: "%",
      period: ".",
      permil: "‰",
      perp: "⊥",
      pertenk: "‱",
      Pfr: "𝔓",
      pfr: "𝔭",
      Phi: "Φ",
      phi: "φ",
      phiv: "ϕ",
      phmmat: "ℳ",
      phone: "☎",
      Pi: "Π",
      pi: "π",
      pitchfork: "⋔",
      piv: "ϖ",
      planck: "ℏ",
      planckh: "ℎ",
      plankv: "ℏ",
      plus: "+",
      plusacir: "⨣",
      plusb: "⊞",
      pluscir: "⨢",
      plusdo: "∔",
      plusdu: "⨥",
      pluse: "⩲",
      PlusMinus: "±",
      plusmn: "±",
      plussim: "⨦",
      plustwo: "⨧",
      pm: "±",
      Poincareplane: "ℌ",
      pointint: "⨕",
      Popf: "ℙ",
      popf: "𝕡",
      pound: "£",
      Pr: "⪻",
      pr: "≺",
      prap: "⪷",
      prcue: "≼",
      prE: "⪳",
      pre: "⪯",
      prec: "≺",
      precapprox: "⪷",
      preccurlyeq: "≼",
      Precedes: "≺",
      PrecedesEqual: "⪯",
      PrecedesSlantEqual: "≼",
      PrecedesTilde: "≾",
      preceq: "⪯",
      precnapprox: "⪹",
      precneqq: "⪵",
      precnsim: "⋨",
      precsim: "≾",
      Prime: "″",
      prime: "′",
      primes: "ℙ",
      prnap: "⪹",
      prnE: "⪵",
      prnsim: "⋨",
      prod: "∏",
      Product: "∏",
      profalar: "⌮",
      profline: "⌒",
      profsurf: "⌓",
      prop: "∝",
      Proportion: "∷",
      Proportional: "∝",
      propto: "∝",
      prsim: "≾",
      prurel: "⊰",
      Pscr: "𝒫",
      pscr: "𝓅",
      Psi: "Ψ",
      psi: "ψ",
      puncsp: " ",
      Qfr: "𝔔",
      qfr: "𝔮",
      qint: "⨌",
      Qopf: "ℚ",
      qopf: "𝕢",
      qprime: "⁗",
      Qscr: "𝒬",
      qscr: "𝓆",
      quaternions: "ℍ",
      quatint: "⨖",
      quest: "?",
      questeq: "≟",
      QUOT: '"',
      quot: '"',
      rAarr: "⇛",
      race: "∽̱",
      Racute: "Ŕ",
      racute: "ŕ",
      radic: "√",
      raemptyv: "⦳",
      Rang: "⟫",
      rang: "⟩",
      rangd: "⦒",
      range: "⦥",
      rangle: "⟩",
      raquo: "»",
      Rarr: "↠",
      rArr: "⇒",
      rarr: "→",
      rarrap: "⥵",
      rarrb: "⇥",
      rarrbfs: "⤠",
      rarrc: "⤳",
      rarrfs: "⤞",
      rarrhk: "↪",
      rarrlp: "↬",
      rarrpl: "⥅",
      rarrsim: "⥴",
      Rarrtl: "⤖",
      rarrtl: "↣",
      rarrw: "↝",
      rAtail: "⤜",
      ratail: "⤚",
      ratio: "∶",
      rationals: "ℚ",
      RBarr: "⤐",
      rBarr: "⤏",
      rbarr: "⤍",
      rbbrk: "❳",
      rbrace: "}",
      rbrack: "]",
      rbrke: "⦌",
      rbrksld: "⦎",
      rbrkslu: "⦐",
      Rcaron: "Ř",
      rcaron: "ř",
      Rcedil: "Ŗ",
      rcedil: "ŗ",
      rceil: "⌉",
      rcub: "}",
      Rcy: "Р",
      rcy: "р",
      rdca: "⤷",
      rdldhar: "⥩",
      rdquo: "”",
      rdquor: "”",
      rdsh: "↳",
      Re: "ℜ",
      real: "ℜ",
      realine: "ℛ",
      realpart: "ℜ",
      reals: "ℝ",
      rect: "▭",
      REG: "®",
      reg: "®",
      ReverseElement: "∋",
      ReverseEquilibrium: "⇋",
      ReverseUpEquilibrium: "⥯",
      rfisht: "⥽",
      rfloor: "⌋",
      Rfr: "ℜ",
      rfr: "𝔯",
      rHar: "⥤",
      rhard: "⇁",
      rharu: "⇀",
      rharul: "⥬",
      Rho: "Ρ",
      rho: "ρ",
      rhov: "ϱ",
      RightAngleBracket: "⟩",
      RightArrow: "→",
      Rightarrow: "⇒",
      rightarrow: "→",
      RightArrowBar: "⇥",
      RightArrowLeftArrow: "⇄",
      rightarrowtail: "↣",
      RightCeiling: "⌉",
      RightDoubleBracket: "⟧",
      RightDownTeeVector: "⥝",
      RightDownVector: "⇂",
      RightDownVectorBar: "⥕",
      RightFloor: "⌋",
      rightharpoondown: "⇁",
      rightharpoonup: "⇀",
      rightleftarrows: "⇄",
      rightleftharpoons: "⇌",
      rightrightarrows: "⇉",
      rightsquigarrow: "↝",
      RightTee: "⊢",
      RightTeeArrow: "↦",
      RightTeeVector: "⥛",
      rightthreetimes: "⋌",
      RightTriangle: "⊳",
      RightTriangleBar: "⧐",
      RightTriangleEqual: "⊵",
      RightUpDownVector: "⥏",
      RightUpTeeVector: "⥜",
      RightUpVector: "↾",
      RightUpVectorBar: "⥔",
      RightVector: "⇀",
      RightVectorBar: "⥓",
      ring: "˚",
      risingdotseq: "≓",
      rlarr: "⇄",
      rlhar: "⇌",
      rlm: "‏",
      rmoust: "⎱",
      rmoustache: "⎱",
      rnmid: "⫮",
      roang: "⟭",
      roarr: "⇾",
      robrk: "⟧",
      ropar: "⦆",
      Ropf: "ℝ",
      ropf: "𝕣",
      roplus: "⨮",
      rotimes: "⨵",
      RoundImplies: "⥰",
      rpar: ")",
      rpargt: "⦔",
      rppolint: "⨒",
      rrarr: "⇉",
      Rrightarrow: "⇛",
      rsaquo: "›",
      Rscr: "ℛ",
      rscr: "𝓇",
      Rsh: "↱",
      rsh: "↱",
      rsqb: "]",
      rsquo: "’",
      rsquor: "’",
      rthree: "⋌",
      rtimes: "⋊",
      rtri: "▹",
      rtrie: "⊵",
      rtrif: "▸",
      rtriltri: "⧎",
      RuleDelayed: "⧴",
      ruluhar: "⥨",
      rx: "℞",
      Sacute: "Ś",
      sacute: "ś",
      sbquo: "‚",
      Sc: "⪼",
      sc: "≻",
      scap: "⪸",
      Scaron: "Š",
      scaron: "š",
      sccue: "≽",
      scE: "⪴",
      sce: "⪰",
      Scedil: "Ş",
      scedil: "ş",
      Scirc: "Ŝ",
      scirc: "ŝ",
      scnap: "⪺",
      scnE: "⪶",
      scnsim: "⋩",
      scpolint: "⨓",
      scsim: "≿",
      Scy: "С",
      scy: "с",
      sdot: "⋅",
      sdotb: "⊡",
      sdote: "⩦",
      searhk: "⤥",
      seArr: "⇘",
      searr: "↘",
      searrow: "↘",
      sect: "§",
      semi: ";",
      seswar: "⤩",
      setminus: "∖",
      setmn: "∖",
      sext: "✶",
      Sfr: "𝔖",
      sfr: "𝔰",
      sfrown: "⌢",
      sharp: "♯",
      SHCHcy: "Щ",
      shchcy: "щ",
      SHcy: "Ш",
      shcy: "ш",
      ShortDownArrow: "↓",
      ShortLeftArrow: "←",
      shortmid: "∣",
      shortparallel: "∥",
      ShortRightArrow: "→",
      ShortUpArrow: "↑",
      shy: "­",
      Sigma: "Σ",
      sigma: "σ",
      sigmaf: "ς",
      sigmav: "ς",
      sim: "∼",
      simdot: "⩪",
      sime: "≃",
      simeq: "≃",
      simg: "⪞",
      simgE: "⪠",
      siml: "⪝",
      simlE: "⪟",
      simne: "≆",
      simplus: "⨤",
      simrarr: "⥲",
      slarr: "←",
      SmallCircle: "∘",
      smallsetminus: "∖",
      smashp: "⨳",
      smeparsl: "⧤",
      smid: "∣",
      smile: "⌣",
      smt: "⪪",
      smte: "⪬",
      smtes: "⪬︀",
      SOFTcy: "Ь",
      softcy: "ь",
      sol: "/",
      solb: "⧄",
      solbar: "⌿",
      Sopf: "𝕊",
      sopf: "𝕤",
      spades: "♠",
      spadesuit: "♠",
      spar: "∥",
      sqcap: "⊓",
      sqcaps: "⊓︀",
      sqcup: "⊔",
      sqcups: "⊔︀",
      Sqrt: "√",
      sqsub: "⊏",
      sqsube: "⊑",
      sqsubset: "⊏",
      sqsubseteq: "⊑",
      sqsup: "⊐",
      sqsupe: "⊒",
      sqsupset: "⊐",
      sqsupseteq: "⊒",
      squ: "□",
      Square: "□",
      square: "□",
      SquareIntersection: "⊓",
      SquareSubset: "⊏",
      SquareSubsetEqual: "⊑",
      SquareSuperset: "⊐",
      SquareSupersetEqual: "⊒",
      SquareUnion: "⊔",
      squarf: "▪",
      squf: "▪",
      srarr: "→",
      Sscr: "𝒮",
      sscr: "𝓈",
      ssetmn: "∖",
      ssmile: "⌣",
      sstarf: "⋆",
      Star: "⋆",
      star: "☆",
      starf: "★",
      straightepsilon: "ϵ",
      straightphi: "ϕ",
      strns: "¯",
      Sub: "⋐",
      sub: "⊂",
      subdot: "⪽",
      subE: "⫅",
      sube: "⊆",
      subedot: "⫃",
      submult: "⫁",
      subnE: "⫋",
      subne: "⊊",
      subplus: "⪿",
      subrarr: "⥹",
      Subset: "⋐",
      subset: "⊂",
      subseteq: "⊆",
      subseteqq: "⫅",
      SubsetEqual: "⊆",
      subsetneq: "⊊",
      subsetneqq: "⫋",
      subsim: "⫇",
      subsub: "⫕",
      subsup: "⫓",
      succ: "≻",
      succapprox: "⪸",
      succcurlyeq: "≽",
      Succeeds: "≻",
      SucceedsEqual: "⪰",
      SucceedsSlantEqual: "≽",
      SucceedsTilde: "≿",
      succeq: "⪰",
      succnapprox: "⪺",
      succneqq: "⪶",
      succnsim: "⋩",
      succsim: "≿",
      SuchThat: "∋",
      Sum: "∑",
      sum: "∑",
      sung: "♪",
      Sup: "⋑",
      sup: "⊃",
      sup1: "¹",
      sup2: "²",
      sup3: "³",
      supdot: "⪾",
      supdsub: "⫘",
      supE: "⫆",
      supe: "⊇",
      supedot: "⫄",
      Superset: "⊃",
      SupersetEqual: "⊇",
      suphsol: "⟉",
      suphsub: "⫗",
      suplarr: "⥻",
      supmult: "⫂",
      supnE: "⫌",
      supne: "⊋",
      supplus: "⫀",
      Supset: "⋑",
      supset: "⊃",
      supseteq: "⊇",
      supseteqq: "⫆",
      supsetneq: "⊋",
      supsetneqq: "⫌",
      supsim: "⫈",
      supsub: "⫔",
      supsup: "⫖",
      swarhk: "⤦",
      swArr: "⇙",
      swarr: "↙",
      swarrow: "↙",
      swnwar: "⤪",
      szlig: "ß",
      Tab: "	",
      target: "⌖",
      Tau: "Τ",
      tau: "τ",
      tbrk: "⎴",
      Tcaron: "Ť",
      tcaron: "ť",
      Tcedil: "Ţ",
      tcedil: "ţ",
      Tcy: "Т",
      tcy: "т",
      tdot: "⃛",
      telrec: "⌕",
      Tfr: "𝔗",
      tfr: "𝔱",
      there4: "∴",
      Therefore: "∴",
      therefore: "∴",
      Theta: "Θ",
      theta: "θ",
      thetasym: "ϑ",
      thetav: "ϑ",
      thickapprox: "≈",
      thicksim: "∼",
      ThickSpace: "  ",
      thinsp: " ",
      ThinSpace: " ",
      thkap: "≈",
      thksim: "∼",
      THORN: "Þ",
      thorn: "þ",
      Tilde: "∼",
      tilde: "˜",
      TildeEqual: "≃",
      TildeFullEqual: "≅",
      TildeTilde: "≈",
      times: "×",
      timesb: "⊠",
      timesbar: "⨱",
      timesd: "⨰",
      tint: "∭",
      toea: "⤨",
      top: "⊤",
      topbot: "⌶",
      topcir: "⫱",
      Topf: "𝕋",
      topf: "𝕥",
      topfork: "⫚",
      tosa: "⤩",
      tprime: "‴",
      TRADE: "™",
      trade: "™",
      triangle: "▵",
      triangledown: "▿",
      triangleleft: "◃",
      trianglelefteq: "⊴",
      triangleq: "≜",
      triangleright: "▹",
      trianglerighteq: "⊵",
      tridot: "◬",
      trie: "≜",
      triminus: "⨺",
      TripleDot: "⃛",
      triplus: "⨹",
      trisb: "⧍",
      tritime: "⨻",
      trpezium: "⏢",
      Tscr: "𝒯",
      tscr: "𝓉",
      TScy: "Ц",
      tscy: "ц",
      TSHcy: "Ћ",
      tshcy: "ћ",
      Tstrok: "Ŧ",
      tstrok: "ŧ",
      twixt: "≬",
      twoheadleftarrow: "↞",
      twoheadrightarrow: "↠",
      Uacute: "Ú",
      uacute: "ú",
      Uarr: "↟",
      uArr: "⇑",
      uarr: "↑",
      Uarrocir: "⥉",
      Ubrcy: "Ў",
      ubrcy: "ў",
      Ubreve: "Ŭ",
      ubreve: "ŭ",
      Ucirc: "Û",
      ucirc: "û",
      Ucy: "У",
      ucy: "у",
      udarr: "⇅",
      Udblac: "Ű",
      udblac: "ű",
      udhar: "⥮",
      ufisht: "⥾",
      Ufr: "𝔘",
      ufr: "𝔲",
      Ugrave: "Ù",
      ugrave: "ù",
      uHar: "⥣",
      uharl: "↿",
      uharr: "↾",
      uhblk: "▀",
      ulcorn: "⌜",
      ulcorner: "⌜",
      ulcrop: "⌏",
      ultri: "◸",
      Umacr: "Ū",
      umacr: "ū",
      uml: "¨",
      UnderBar: "_",
      UnderBrace: "⏟",
      UnderBracket: "⎵",
      UnderParenthesis: "⏝",
      Union: "⋃",
      UnionPlus: "⊎",
      Uogon: "Ų",
      uogon: "ų",
      Uopf: "𝕌",
      uopf: "𝕦",
      UpArrow: "↑",
      Uparrow: "⇑",
      uparrow: "↑",
      UpArrowBar: "⤒",
      UpArrowDownArrow: "⇅",
      UpDownArrow: "↕",
      Updownarrow: "⇕",
      updownarrow: "↕",
      UpEquilibrium: "⥮",
      upharpoonleft: "↿",
      upharpoonright: "↾",
      uplus: "⊎",
      UpperLeftArrow: "↖",
      UpperRightArrow: "↗",
      Upsi: "ϒ",
      upsi: "υ",
      upsih: "ϒ",
      Upsilon: "Υ",
      upsilon: "υ",
      UpTee: "⊥",
      UpTeeArrow: "↥",
      upuparrows: "⇈",
      urcorn: "⌝",
      urcorner: "⌝",
      urcrop: "⌎",
      Uring: "Ů",
      uring: "ů",
      urtri: "◹",
      Uscr: "𝒰",
      uscr: "𝓊",
      utdot: "⋰",
      Utilde: "Ũ",
      utilde: "ũ",
      utri: "▵",
      utrif: "▴",
      uuarr: "⇈",
      Uuml: "Ü",
      uuml: "ü",
      uwangle: "⦧",
      vangrt: "⦜",
      varepsilon: "ϵ",
      varkappa: "ϰ",
      varnothing: "∅",
      varphi: "ϕ",
      varpi: "ϖ",
      varpropto: "∝",
      vArr: "⇕",
      varr: "↕",
      varrho: "ϱ",
      varsigma: "ς",
      varsubsetneq: "⊊︀",
      varsubsetneqq: "⫋︀",
      varsupsetneq: "⊋︀",
      varsupsetneqq: "⫌︀",
      vartheta: "ϑ",
      vartriangleleft: "⊲",
      vartriangleright: "⊳",
      Vbar: "⫫",
      vBar: "⫨",
      vBarv: "⫩",
      Vcy: "В",
      vcy: "в",
      VDash: "⊫",
      Vdash: "⊩",
      vDash: "⊨",
      vdash: "⊢",
      Vdashl: "⫦",
      Vee: "⋁",
      vee: "∨",
      veebar: "⊻",
      veeeq: "≚",
      vellip: "⋮",
      Verbar: "‖",
      verbar: "|",
      Vert: "‖",
      vert: "|",
      VerticalBar: "∣",
      VerticalLine: "|",
      VerticalSeparator: "❘",
      VerticalTilde: "≀",
      VeryThinSpace: " ",
      Vfr: "𝔙",
      vfr: "𝔳",
      vltri: "⊲",
      vnsub: "⊂⃒",
      vnsup: "⊃⃒",
      Vopf: "𝕍",
      vopf: "𝕧",
      vprop: "∝",
      vrtri: "⊳",
      Vscr: "𝒱",
      vscr: "𝓋",
      vsubnE: "⫋︀",
      vsubne: "⊊︀",
      vsupnE: "⫌︀",
      vsupne: "⊋︀",
      Vvdash: "⊪",
      vzigzag: "⦚",
      Wcirc: "Ŵ",
      wcirc: "ŵ",
      wedbar: "⩟",
      Wedge: "⋀",
      wedge: "∧",
      wedgeq: "≙",
      weierp: "℘",
      Wfr: "𝔚",
      wfr: "𝔴",
      Wopf: "𝕎",
      wopf: "𝕨",
      wp: "℘",
      wr: "≀",
      wreath: "≀",
      Wscr: "𝒲",
      wscr: "𝓌",
      xcap: "⋂",
      xcirc: "◯",
      xcup: "⋃",
      xdtri: "▽",
      Xfr: "𝔛",
      xfr: "𝔵",
      xhArr: "⟺",
      xharr: "⟷",
      Xi: "Ξ",
      xi: "ξ",
      xlArr: "⟸",
      xlarr: "⟵",
      xmap: "⟼",
      xnis: "⋻",
      xodot: "⨀",
      Xopf: "𝕏",
      xopf: "𝕩",
      xoplus: "⨁",
      xotime: "⨂",
      xrArr: "⟹",
      xrarr: "⟶",
      Xscr: "𝒳",
      xscr: "𝓍",
      xsqcup: "⨆",
      xuplus: "⨄",
      xutri: "△",
      xvee: "⋁",
      xwedge: "⋀",
      Yacute: "Ý",
      yacute: "ý",
      YAcy: "Я",
      yacy: "я",
      Ycirc: "Ŷ",
      ycirc: "ŷ",
      Ycy: "Ы",
      ycy: "ы",
      yen: "¥",
      Yfr: "𝔜",
      yfr: "𝔶",
      YIcy: "Ї",
      yicy: "ї",
      Yopf: "𝕐",
      yopf: "𝕪",
      Yscr: "𝒴",
      yscr: "𝓎",
      YUcy: "Ю",
      yucy: "ю",
      Yuml: "Ÿ",
      yuml: "ÿ",
      Zacute: "Ź",
      zacute: "ź",
      Zcaron: "Ž",
      zcaron: "ž",
      Zcy: "З",
      zcy: "з",
      Zdot: "Ż",
      zdot: "ż",
      zeetrf: "ℨ",
      ZeroWidthSpace: "​",
      Zeta: "Ζ",
      zeta: "ζ",
      Zfr: "ℨ",
      zfr: "𝔷",
      ZHcy: "Ж",
      zhcy: "ж",
      zigrarr: "⇝",
      Zopf: "ℤ",
      zopf: "𝕫",
      Zscr: "𝒵",
      zscr: "𝓏",
      zwj: "‍",
      zwnj: "‌"
    });
    exports.entityMap = exports.HTML_ENTITIES;
  })(entities);
  return entities;
}
var sax = {};
var hasRequiredSax;
function requireSax() {
  if (hasRequiredSax) return sax;
  hasRequiredSax = 1;
  var NAMESPACE = requireConventions().NAMESPACE;
  var tagNamePattern = requireConventions().tagNamePattern;
  var S_TAG = 0;
  var S_ATTR = 1;
  var S_ATTR_SPACE = 2;
  var S_EQ = 3;
  var S_ATTR_NOQUOT_VALUE = 4;
  var S_ATTR_END = 5;
  var S_TAG_SPACE = 6;
  var S_TAG_CLOSE = 7;
  function ParseError(message, locator) {
    this.message = message;
    this.locator = locator;
    if (Error.captureStackTrace) Error.captureStackTrace(this, ParseError);
  }
  ParseError.prototype = new Error();
  ParseError.prototype.name = ParseError.name;
  function XMLReader() {
  }
  XMLReader.prototype = {
    parse: function(source, defaultNSMap, entityMap) {
      var domBuilder = this.domBuilder;
      domBuilder.startDocument();
      _copy(defaultNSMap, defaultNSMap = {});
      parse(
        source,
        defaultNSMap,
        entityMap,
        domBuilder,
        this.errorHandler
      );
      domBuilder.endDocument();
    }
  };
  function parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
    function fixedFromCharCode(code) {
      if (code > 65535) {
        code -= 65536;
        var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
        return String.fromCharCode(surrogate1, surrogate2);
      } else {
        return String.fromCharCode(code);
      }
    }
    function entityReplacer(a2) {
      var k = a2.slice(1, -1);
      if (Object.hasOwnProperty.call(entityMap, k)) {
        return entityMap[k];
      } else if (k.charAt(0) === "#") {
        return fixedFromCharCode(parseInt(k.substr(1).replace("x", "0x")));
      } else {
        errorHandler.error("entity not found:" + a2);
        return a2;
      }
    }
    function appendText(end2) {
      if (end2 > start) {
        var xt = source.substring(start, end2).replace(/&#?\w+;/g, entityReplacer);
        locator && position(start);
        domBuilder.characters(xt, 0, end2 - start);
        start = end2;
      }
    }
    function position(p, m) {
      while (p >= lineEnd && (m = linePattern.exec(source))) {
        lineStart = m.index;
        lineEnd = lineStart + m[0].length;
        locator.lineNumber++;
      }
      locator.columnNumber = p - lineStart + 1;
    }
    var lineStart = 0;
    var lineEnd = 0;
    var linePattern = /.*(?:\r\n?|\n)|.*$/g;
    var locator = domBuilder.locator;
    var parseStack = [{ currentNSMap: defaultNSMapCopy }];
    var closeMap = {};
    var start = 0;
    while (true) {
      try {
        var tagStart = source.indexOf("<", start);
        if (tagStart < 0) {
          if (!source.substr(start).match(/^\s*$/)) {
            var doc = domBuilder.doc;
            var text = doc.createTextNode(source.substr(start));
            doc.appendChild(text);
            domBuilder.currentElement = text;
          }
          return;
        }
        if (tagStart > start) {
          appendText(tagStart);
        }
        switch (source.charAt(tagStart + 1)) {
          case "/":
            var end = source.indexOf(">", tagStart + 3);
            var tagName = source.substring(tagStart + 2, end).replace(/^([\s\S]*?[^ \t\n\r])?[ \t\n\r]*$/, "$1");
            var config = parseStack.pop();
            if (end < 0) {
              tagName = source.substring(tagStart + 2).replace(/[\s<].*/, "");
              errorHandler.error("end tag name: " + tagName + " is not complete:" + config.tagName);
              end = tagStart + 1 + tagName.length;
            } else if (tagName.match(/\s</)) {
              tagName = tagName.replace(/[\s<].*/, "");
              errorHandler.error("end tag name: " + tagName + " maybe not complete");
              end = tagStart + 1 + tagName.length;
            } else if (/[ \t\n\r]/.test(tagName) && tagNamePattern.test(tagName.split(/[ \t\n\r]/)[0])) {
              errorHandler.error('end tag name is followed by whitespace and trailing content: "' + tagName + '"');
            }
            var localNSMap = config.localNSMap;
            var endMatch = config.tagName == tagName;
            var endIgnoreCaseMach = endMatch || config.tagName && config.tagName.toLowerCase() == tagName.toLowerCase();
            if (endIgnoreCaseMach) {
              domBuilder.endElement(config.uri, config.localName, tagName);
              if (localNSMap) {
                for (var prefix in localNSMap) {
                  if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) {
                    domBuilder.endPrefixMapping(prefix);
                  }
                }
              }
              if (!endMatch) {
                errorHandler.fatalError("end tag name: " + tagName + " is not match the current start tagName:" + config.tagName);
              }
            } else {
              parseStack.push(config);
            }
            end++;
            break;
          // end elment
          case "?":
            locator && position(tagStart);
            end = parseInstruction(source, tagStart, domBuilder);
            break;
          case "!":
            locator && position(tagStart);
            end = parseDCC(source, tagStart, domBuilder, errorHandler);
            break;
          default:
            locator && position(tagStart);
            var el = new ElementAttributes();
            var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
            var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler);
            var len = el.length;
            if (!el.closed && fixSelfClosed(source, end, el.tagName, closeMap)) {
              el.closed = true;
              if (!entityMap.nbsp) {
                errorHandler.warning("unclosed xml attribute");
              }
            }
            if (locator && len) {
              var locator2 = copyLocator(locator, {});
              for (var i = 0; i < len; i++) {
                var a = el[i];
                position(a.offset);
                a.locator = copyLocator(locator, {});
              }
              domBuilder.locator = locator2;
              if (appendElement(el, domBuilder, currentNSMap)) {
                parseStack.push(el);
              }
              domBuilder.locator = locator;
            } else {
              if (appendElement(el, domBuilder, currentNSMap)) {
                parseStack.push(el);
              }
            }
            if (NAMESPACE.isHTML(el.uri) && !el.closed) {
              end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
            } else {
              end++;
            }
        }
      } catch (e) {
        if (e instanceof ParseError) {
          throw e;
        }
        errorHandler.error("element parse error: " + e);
        end = -1;
      }
      if (end > start) {
        start = end;
      } else {
        appendText(Math.max(tagStart, start) + 1);
      }
    }
  }
  function copyLocator(f, t) {
    t.lineNumber = f.lineNumber;
    t.columnNumber = f.columnNumber;
    return t;
  }
  function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler) {
    function addAttribute(qname, value2, startIndex) {
      if (el.attributeNames.hasOwnProperty(qname)) {
        errorHandler.fatalError("Attribute " + qname + " redefined");
      }
      el.addValue(
        qname,
        // @see https://www.w3.org/TR/xml/#AVNormalize
        // since the xmldom sax parser does not "interpret" DTD the following is not implemented:
        // - recursive replacement of (DTD) entity references
        // - trimming and collapsing multiple spaces into a single one for attributes that are not of type CDATA
        value2.replace(/[\t\n\r]/g, " ").replace(/&#?\w+;/g, entityReplacer),
        startIndex
      );
    }
    var attrName;
    var value;
    var p = ++start;
    var s = S_TAG;
    while (true) {
      var c = source.charAt(p);
      if (s === S_TAG && c === "<") {
        throw new Error("unexpected < in tag name: " + source.slice(start, p));
      }
      switch (c) {
        case "=":
          if (s === S_ATTR) {
            attrName = source.slice(start, p);
            s = S_EQ;
          } else if (s === S_ATTR_SPACE) {
            s = S_EQ;
          } else {
            throw new Error("attribute equal must after attrName");
          }
          break;
        case "'":
        case '"':
          if (s === S_EQ || s === S_ATTR) {
            if (s === S_ATTR) {
              errorHandler.warning('attribute value must after "="');
              attrName = source.slice(start, p);
            }
            start = p + 1;
            p = source.indexOf(c, start);
            if (p > 0) {
              value = source.slice(start, p);
              addAttribute(attrName, value, start - 1);
              s = S_ATTR_END;
            } else {
              throw new Error("attribute value no end '" + c + "' match");
            }
          } else if (s == S_ATTR_NOQUOT_VALUE) {
            value = source.slice(start, p);
            addAttribute(attrName, value, start);
            errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c + ")!!");
            start = p + 1;
            s = S_ATTR_END;
          } else {
            throw new Error('attribute value must after "="');
          }
          break;
        case "/":
          switch (s) {
            case S_TAG:
              el.setTagName(source.slice(start, p));
            case S_ATTR_END:
            case S_TAG_SPACE:
            case S_TAG_CLOSE:
              s = S_TAG_CLOSE;
              el.closed = true;
            case S_ATTR_NOQUOT_VALUE:
            case S_ATTR:
              break;
            case S_ATTR_SPACE:
              el.closed = true;
              break;
            //case S_EQ:
            default:
              throw new Error("attribute invalid close char('/')");
          }
          break;
        case "":
          errorHandler.error("unexpected end of input");
          if (s == S_TAG) {
            el.setTagName(source.slice(start, p));
          }
          return p;
        case ">":
          switch (s) {
            case S_TAG:
              el.setTagName(source.slice(start, p));
            case S_ATTR_END:
            case S_TAG_SPACE:
            case S_TAG_CLOSE:
              break;
            //normal
            case S_ATTR_NOQUOT_VALUE:
            //Compatible state
            case S_ATTR:
              value = source.slice(start, p);
              if (value.slice(-1) === "/") {
                el.closed = true;
                value = value.slice(0, -1);
              }
            case S_ATTR_SPACE:
              if (s === S_ATTR_SPACE) {
                value = attrName;
              }
              if (s == S_ATTR_NOQUOT_VALUE) {
                errorHandler.warning('attribute "' + value + '" missed quot(")!');
                addAttribute(attrName, value, start);
              } else {
                if (!NAMESPACE.isHTML(currentNSMap[""]) || !value.match(/^(?:disabled|checked|selected)$/i)) {
                  errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
                }
                addAttribute(value, value, start);
              }
              break;
            case S_EQ:
              throw new Error("attribute value missed!!");
          }
          return p;
        /*xml space '\x20' | #x9 | #xD | #xA; */
        case "":
          c = " ";
        default:
          if (c <= " ") {
            switch (s) {
              case S_TAG:
                el.setTagName(source.slice(start, p));
                s = S_TAG_SPACE;
                break;
              case S_ATTR:
                attrName = source.slice(start, p);
                s = S_ATTR_SPACE;
                break;
              case S_ATTR_NOQUOT_VALUE:
                var value = source.slice(start, p);
                errorHandler.warning('attribute "' + value + '" missed quot(")!!');
                addAttribute(attrName, value, start);
              case S_ATTR_END:
                s = S_TAG_SPACE;
                break;
            }
          } else {
            switch (s) {
              //case S_TAG:void();break;
              //case S_ATTR:void();break;
              //case S_ATTR_NOQUOT_VALUE:void();break;
              case S_ATTR_SPACE:
                el.tagName;
                if (!NAMESPACE.isHTML(currentNSMap[""]) || !attrName.match(/^(?:disabled|checked|selected)$/i)) {
                  errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
                }
                addAttribute(attrName, attrName, start);
                start = p;
                s = S_ATTR;
                break;
              case S_ATTR_END:
                errorHandler.warning('attribute space is required"' + attrName + '"!!');
              case S_TAG_SPACE:
                s = S_ATTR;
                start = p;
                break;
              case S_EQ:
                s = S_ATTR_NOQUOT_VALUE;
                start = p;
                break;
              case S_TAG_CLOSE:
                throw new Error("elements closed character '/' and '>' must be connected to");
            }
          }
      }
      p++;
    }
  }
  function appendElement(el, domBuilder, currentNSMap) {
    var tagName = el.tagName;
    var localNSMap = null;
    var i = el.length;
    while (i--) {
      var a = el[i];
      var qName = a.qName;
      var value = a.value;
      var nsp = qName.indexOf(":");
      if (nsp > 0) {
        var prefix = a.prefix = qName.slice(0, nsp);
        var localName = qName.slice(nsp + 1);
        var nsPrefix = prefix === "xmlns" && localName;
      } else {
        localName = qName;
        prefix = null;
        nsPrefix = qName === "xmlns" && "";
      }
      a.localName = localName;
      if (nsPrefix !== false) {
        if (localNSMap == null) {
          localNSMap = {};
          currentNSMap = Object.create(currentNSMap);
        }
        currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
        a.uri = NAMESPACE.XMLNS;
        domBuilder.startPrefixMapping(nsPrefix, value);
      }
    }
    var i = el.length;
    while (i--) {
      a = el[i];
      var prefix = a.prefix;
      if (prefix) {
        if (prefix === "xml") {
          a.uri = NAMESPACE.XML;
        }
        if (prefix !== "xmlns") {
          a.uri = currentNSMap[prefix || ""];
        }
      }
    }
    var nsp = tagName.indexOf(":");
    if (nsp > 0) {
      prefix = el.prefix = tagName.slice(0, nsp);
      localName = el.localName = tagName.slice(nsp + 1);
    } else {
      prefix = null;
      localName = el.localName = tagName;
    }
    var ns = el.uri = currentNSMap[prefix || ""];
    domBuilder.startElement(ns, localName, tagName, el);
    if (el.closed) {
      domBuilder.endElement(ns, localName, tagName);
      if (localNSMap) {
        for (prefix in localNSMap) {
          if (Object.prototype.hasOwnProperty.call(localNSMap, prefix)) {
            domBuilder.endPrefixMapping(prefix);
          }
        }
      }
    } else {
      el.currentNSMap = currentNSMap;
      el.localNSMap = localNSMap;
      return true;
    }
  }
  function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
    if (/^(?:script|textarea)$/i.test(tagName)) {
      var elEndStart = source.indexOf("</" + tagName + ">", elStartEnd);
      var text = source.substring(elStartEnd + 1, elEndStart);
      if (/[&<]/.test(text)) {
        if (/^script$/i.test(tagName)) {
          domBuilder.characters(text, 0, text.length);
          return elEndStart;
        }
        text = text.replace(/&#?\w+;/g, entityReplacer);
        domBuilder.characters(text, 0, text.length);
        return elEndStart;
      }
    }
    return elStartEnd + 1;
  }
  function fixSelfClosed(source, elStartEnd, tagName, closeMap) {
    var pos = closeMap[tagName];
    if (pos == null) {
      pos = source.lastIndexOf("</" + tagName + ">");
      if (pos < elStartEnd) {
        pos = source.lastIndexOf("</" + tagName);
      }
      closeMap[tagName] = pos;
    }
    return pos < elStartEnd;
  }
  function _copy(source, target) {
    for (var n in source) {
      if (Object.prototype.hasOwnProperty.call(source, n)) {
        target[n] = source[n];
      }
    }
  }
  function parseDCC(source, start, domBuilder, errorHandler) {
    var next = source.charAt(start + 2);
    switch (next) {
      case "-":
        if (source.charAt(start + 3) === "-") {
          var end = source.indexOf("-->", start + 4);
          if (end > start) {
            domBuilder.comment(source, start + 4, end - start - 4);
            return end + 3;
          } else {
            errorHandler.error("Unclosed comment");
            return -1;
          }
        } else {
          return -1;
        }
      default:
        if (source.substr(start + 3, 6) == "CDATA[") {
          var end = source.indexOf("]]>", start + 9);
          domBuilder.startCDATA();
          domBuilder.characters(source, start + 9, end - start - 9);
          domBuilder.endCDATA();
          return end + 3;
        }
        var matchs = split(source, start);
        var len = matchs.length;
        if (len > 1 && /!doctype/i.test(matchs[0][0])) {
          var name = matchs[1][0];
          var pubid = false;
          var sysid = false;
          if (len > 3) {
            if (/^public$/i.test(matchs[2][0])) {
              pubid = matchs[3][0];
              sysid = len > 4 && matchs[4][0];
            } else if (/^system$/i.test(matchs[2][0])) {
              sysid = matchs[3][0];
            }
          }
          var lastMatch = matchs[len - 1];
          domBuilder.startDTD(name, pubid, sysid);
          domBuilder.endDTD();
          return lastMatch.index + lastMatch[0].length;
        }
    }
    return -1;
  }
  function parseInstruction(source, start, domBuilder) {
    var end = source.indexOf("?>", start);
    if (end) {
      var match = source.substring(start, end).match(/^<\?(\S*)\s*([\s\S]*?)$/);
      if (match) {
        match[0].length;
        domBuilder.processingInstruction(match[1], match[2]);
        return end + 2;
      } else {
        return -1;
      }
    }
    return -1;
  }
  function ElementAttributes() {
    this.attributeNames = {};
  }
  ElementAttributes.prototype = {
    setTagName: function(tagName) {
      if (!tagNamePattern.test(tagName)) {
        throw new Error("invalid tagName:" + tagName);
      }
      this.tagName = tagName;
    },
    addValue: function(qName, value, offset) {
      if (!tagNamePattern.test(qName)) {
        throw new Error("invalid attribute:" + qName);
      }
      this.attributeNames[qName] = this.length;
      this[this.length++] = { qName, value, offset };
    },
    length: 0,
    getLocalName: function(i) {
      return this[i].localName;
    },
    getLocator: function(i) {
      return this[i].locator;
    },
    getQName: function(i) {
      return this[i].qName;
    },
    getURI: function(i) {
      return this[i].uri;
    },
    getValue: function(i) {
      return this[i].value;
    }
    //	,getIndex:function(uri, localName)){
    //		if(localName){
    //
    //		}else{
    //			var qName = uri
    //		}
    //	},
    //	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
    //	getType:function(uri,localName){}
    //	getType:function(i){},
  };
  function split(source, start) {
    var match;
    var buf = [];
    var reg = /'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;
    reg.lastIndex = start;
    reg.exec(source);
    while (match = reg.exec(source)) {
      buf.push(match);
      if (match[1]) return buf;
    }
  }
  sax.XMLReader = XMLReader;
  sax.ParseError = ParseError;
  return sax;
}
var hasRequiredDomParser;
function requireDomParser() {
  if (hasRequiredDomParser) return domParser;
  hasRequiredDomParser = 1;
  var conventions2 = requireConventions();
  var dom2 = requireDom();
  var entities2 = requireEntities();
  var sax2 = requireSax();
  var DOMImplementation = dom2.DOMImplementation;
  var NAMESPACE = conventions2.NAMESPACE;
  var ParseError = sax2.ParseError;
  var XMLReader = sax2.XMLReader;
  function normalizeLineEndings(input) {
    return input.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028]/g, "\n");
  }
  function DOMParser(options) {
    this.options = options || { locator: {} };
  }
  DOMParser.prototype.parseFromString = function(source, mimeType) {
    var options = this.options;
    var sax3 = new XMLReader();
    var domBuilder = options.domBuilder || new DOMHandler();
    var errorHandler = options.errorHandler;
    var locator = options.locator;
    var defaultNSMap = options.xmlns || {};
    var isHTML = /\/x?html?$/.test(mimeType);
    var entityMap = isHTML ? entities2.HTML_ENTITIES : entities2.XML_ENTITIES;
    if (locator) {
      domBuilder.setDocumentLocator(locator);
    }
    sax3.errorHandler = buildErrorHandler(errorHandler, domBuilder, locator);
    sax3.domBuilder = options.domBuilder || domBuilder;
    if (isHTML) {
      defaultNSMap[""] = NAMESPACE.HTML;
    }
    defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
    var normalize = options.normalizeLineEndings || normalizeLineEndings;
    if (source && typeof source === "string") {
      sax3.parse(
        normalize(source),
        defaultNSMap,
        entityMap
      );
    } else {
      sax3.errorHandler.error("invalid doc source");
    }
    return domBuilder.doc;
  };
  function buildErrorHandler(errorImpl, domBuilder, locator) {
    if (!errorImpl) {
      if (domBuilder instanceof DOMHandler) {
        return domBuilder;
      }
      errorImpl = domBuilder;
    }
    var errorHandler = {};
    var isCallback = errorImpl instanceof Function;
    locator = locator || {};
    function build(key) {
      var fn = errorImpl[key];
      if (!fn && isCallback) {
        fn = errorImpl.length == 2 ? function(msg) {
          errorImpl(key, msg);
        } : errorImpl;
      }
      errorHandler[key] = fn && function(msg) {
        fn("[xmldom " + key + "]	" + msg + _locator(locator));
      } || function() {
      };
    }
    build("warning");
    build("error");
    build("fatalError");
    return errorHandler;
  }
  function DOMHandler() {
    this.cdata = false;
  }
  function position(locator, node) {
    node.lineNumber = locator.lineNumber;
    node.columnNumber = locator.columnNumber;
  }
  DOMHandler.prototype = {
    startDocument: function() {
      this.doc = new DOMImplementation().createDocument(null, null, null);
      if (this.locator) {
        this.doc.documentURI = this.locator.systemId;
      }
    },
    startElement: function(namespaceURI, localName, qName, attrs) {
      var doc = this.doc;
      var el = doc.createElementNS(namespaceURI, qName || localName);
      var len = attrs.length;
      appendElement(this, el);
      this.currentElement = el;
      this.locator && position(this.locator, el);
      for (var i = 0; i < len; i++) {
        var namespaceURI = attrs.getURI(i);
        var value = attrs.getValue(i);
        var qName = attrs.getQName(i);
        var attr = doc.createAttributeNS(namespaceURI, qName);
        this.locator && position(attrs.getLocator(i), attr);
        attr.value = attr.nodeValue = value;
        el.setAttributeNode(attr);
      }
    },
    endElement: function(namespaceURI, localName, qName) {
      var current = this.currentElement;
      current.tagName;
      this.currentElement = current.parentNode;
    },
    startPrefixMapping: function(prefix, uri) {
    },
    endPrefixMapping: function(prefix) {
    },
    processingInstruction: function(target, data) {
      var ins = this.doc.createProcessingInstruction(target, data);
      this.locator && position(this.locator, ins);
      appendElement(this, ins);
    },
    ignorableWhitespace: function(ch, start, length) {
    },
    characters: function(chars, start, length) {
      chars = _toString.apply(this, arguments);
      if (chars) {
        if (this.cdata) {
          var charNode = this.doc.createCDATASection(chars);
        } else {
          var charNode = this.doc.createTextNode(chars);
        }
        if (this.currentElement) {
          this.currentElement.appendChild(charNode);
        } else if (/^\s*$/.test(chars)) {
          this.doc.appendChild(charNode);
        }
        this.locator && position(this.locator, charNode);
      }
    },
    skippedEntity: function(name) {
    },
    endDocument: function() {
      this.doc.normalize();
    },
    setDocumentLocator: function(locator) {
      if (this.locator = locator) {
        locator.lineNumber = 0;
      }
    },
    //LexicalHandler
    comment: function(chars, start, length) {
      chars = _toString.apply(this, arguments);
      var comm = this.doc.createComment(chars);
      this.locator && position(this.locator, comm);
      appendElement(this, comm);
    },
    startCDATA: function() {
      this.cdata = true;
    },
    endCDATA: function() {
      this.cdata = false;
    },
    startDTD: function(name, publicId, systemId) {
      var impl = this.doc.implementation;
      if (impl && impl.createDocumentType) {
        var dt = impl.createDocumentType(name, publicId, systemId);
        this.locator && position(this.locator, dt);
        appendElement(this, dt);
        this.doc.doctype = dt;
      }
    },
    /**
     * @see org.xml.sax.ErrorHandler
     * @link http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
     */
    warning: function(error) {
      console.warn("[xmldom warning]	" + error, _locator(this.locator));
    },
    error: function(error) {
      console.error("[xmldom error]	" + error, _locator(this.locator));
    },
    fatalError: function(error) {
      throw new ParseError(error, this.locator);
    }
  };
  function _locator(l) {
    if (l) {
      return "\n@" + (l.systemId || "") + "#[line:" + l.lineNumber + ",col:" + l.columnNumber + "]";
    }
  }
  function _toString(chars, start, length) {
    if (typeof chars == "string") {
      return chars.substr(start, length);
    } else {
      if (chars.length >= start + length || start) {
        return new java.lang.String(chars, start, length) + "";
      }
      return chars;
    }
  }
  "endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g, function(key) {
    DOMHandler.prototype[key] = function() {
      return null;
    };
  });
  function appendElement(hander, node) {
    if (!hander.currentElement) {
      hander.doc.appendChild(node);
    } else {
      hander.currentElement.appendChild(node);
    }
  }
  domParser.__DOMHandler = DOMHandler;
  domParser.normalizeLineEndings = normalizeLineEndings;
  domParser.DOMParser = DOMParser;
  return domParser;
}
var hasRequiredLib$2;
function requireLib$2() {
  if (hasRequiredLib$2) return lib$1;
  hasRequiredLib$2 = 1;
  var dom2 = requireDom();
  lib$1.DOMImplementation = dom2.DOMImplementation;
  lib$1.XMLSerializer = dom2.XMLSerializer;
  lib$1.DOMParser = requireDomParser().DOMParser;
  return lib$1;
}
var hasRequiredXmldom;
function requireXmldom() {
  if (hasRequiredXmldom) return xmldom;
  hasRequiredXmldom = 1;
  var xmldom$1 = requireLib$2();
  var dom2 = requireDom();
  function parseFromString(string) {
    var error = null;
    var domParser2 = new xmldom$1.DOMParser({
      errorHandler: function(level, message) {
        error = { level, message };
      }
    });
    var document = domParser2.parseFromString(string);
    if (error === null) {
      return document;
    } else {
      throw new Error(error.level + ": " + error.message);
    }
  }
  xmldom.parseFromString = parseFromString;
  xmldom.Node = dom2.Node;
  return xmldom;
}
var hasRequiredReader;
function requireReader() {
  if (hasRequiredReader) return reader;
  hasRequiredReader = 1;
  var promises2 = requirePromises();
  var _2 = require$$0;
  var xmldom2 = requireXmldom();
  var nodes2 = requireNodes();
  var Element = nodes2.Element;
  reader.readString = readString;
  var Node = xmldom2.Node;
  function readString(xmlString, namespaceMap) {
    namespaceMap = namespaceMap || {};
    try {
      var document = xmldom2.parseFromString(xmlString, "text/xml");
    } catch (error) {
      return promises2.reject(error);
    }
    if (document.documentElement.tagName === "parsererror") {
      return promises2.resolve(new Error(document.documentElement.textContent));
    }
    function convertNode(node) {
      switch (node.nodeType) {
        case Node.ELEMENT_NODE:
          return convertElement(node);
        case Node.TEXT_NODE:
          return nodes2.text(node.nodeValue);
      }
    }
    function convertElement(element) {
      var convertedName = convertName(element);
      var convertedChildren = [];
      _2.forEach(element.childNodes, function(childNode) {
        var convertedNode = convertNode(childNode);
        if (convertedNode) {
          convertedChildren.push(convertedNode);
        }
      });
      var convertedAttributes = /* @__PURE__ */ Object.create(null);
      _2.forEach(element.attributes, function(attribute) {
        convertedAttributes[convertName(attribute)] = attribute.value;
      });
      return new Element(convertedName, convertedAttributes, convertedChildren);
    }
    function convertName(node) {
      if (node.namespaceURI) {
        var mappedPrefix = namespaceMap[node.namespaceURI];
        var prefix;
        if (mappedPrefix) {
          prefix = mappedPrefix + ":";
        } else {
          prefix = "{" + node.namespaceURI + "}";
        }
        return prefix + node.localName;
      } else {
        return node.localName;
      }
    }
    return promises2.resolve(convertNode(document.documentElement));
  }
  return reader;
}
var writer = {};
var lib = {};
var Utility = {};
var hasRequiredUtility;
function requireUtility() {
  if (hasRequiredUtility) return Utility;
  hasRequiredUtility = 1;
  (function() {
    var assign, getValue, isArray2, isEmpty2, isFunction2, isObject2, isPlainObject, slice2 = [].slice, hasProp = {}.hasOwnProperty;
    assign = function() {
      var i, key, len, source, sources, target;
      target = arguments[0], sources = 2 <= arguments.length ? slice2.call(arguments, 1) : [];
      if (isFunction2(Object.assign)) {
        Object.assign.apply(null, arguments);
      } else {
        for (i = 0, len = sources.length; i < len; i++) {
          source = sources[i];
          if (source != null) {
            for (key in source) {
              if (!hasProp.call(source, key)) continue;
              target[key] = source[key];
            }
          }
        }
      }
      return target;
    };
    isFunction2 = function(val) {
      return !!val && Object.prototype.toString.call(val) === "[object Function]";
    };
    isObject2 = function(val) {
      var ref;
      return !!val && ((ref = typeof val) === "function" || ref === "object");
    };
    isArray2 = function(val) {
      if (isFunction2(Array.isArray)) {
        return Array.isArray(val);
      } else {
        return Object.prototype.toString.call(val) === "[object Array]";
      }
    };
    isEmpty2 = function(val) {
      var key;
      if (isArray2(val)) {
        return !val.length;
      } else {
        for (key in val) {
          if (!hasProp.call(val, key)) continue;
          return false;
        }
        return true;
      }
    };
    isPlainObject = function(val) {
      var ctor2, proto;
      return isObject2(val) && (proto = Object.getPrototypeOf(val)) && (ctor2 = proto.constructor) && typeof ctor2 === "function" && ctor2 instanceof ctor2 && Function.prototype.toString.call(ctor2) === Function.prototype.toString.call(Object);
    };
    getValue = function(obj) {
      if (isFunction2(obj.valueOf)) {
        return obj.valueOf();
      } else {
        return obj;
      }
    };
    Utility.assign = assign;
    Utility.isFunction = isFunction2;
    Utility.isObject = isObject2;
    Utility.isArray = isArray2;
    Utility.isEmpty = isEmpty2;
    Utility.isPlainObject = isPlainObject;
    Utility.getValue = getValue;
  }).call(Utility);
  return Utility;
}
var XMLDocument$1 = { exports: {} };
var XMLNode$1 = { exports: {} };
var XMLElement$1 = { exports: {} };
var XMLAttribute$1 = { exports: {} };
var XMLAttribute = XMLAttribute$1.exports;
var hasRequiredXMLAttribute;
function requireXMLAttribute() {
  if (hasRequiredXMLAttribute) return XMLAttribute$1.exports;
  hasRequiredXMLAttribute = 1;
  (function() {
    XMLAttribute$1.exports = (function() {
      function XMLAttribute2(parent, name, value) {
        this.options = parent.options;
        this.stringify = parent.stringify;
        this.parent = parent;
        if (name == null) {
          throw new Error("Missing attribute name. " + this.debugInfo(name));
        }
        if (value == null) {
          throw new Error("Missing attribute value. " + this.debugInfo(name));
        }
        this.name = this.stringify.attName(name);
        this.value = this.stringify.attValue(value);
      }
      XMLAttribute2.prototype.clone = function() {
        return Object.create(this);
      };
      XMLAttribute2.prototype.toString = function(options) {
        return this.options.writer.set(options).attribute(this);
      };
      XMLAttribute2.prototype.debugInfo = function(name) {
        name = name || this.name;
        if (name == null) {
          return "parent: <" + this.parent.name + ">";
        } else {
          return "attribute: {" + name + "}, parent: <" + this.parent.name + ">";
        }
      };
      return XMLAttribute2;
    })();
  }).call(XMLAttribute);
  return XMLAttribute$1.exports;
}
var XMLElement = XMLElement$1.exports;
var hasRequiredXMLElement;
function requireXMLElement() {
  if (hasRequiredXMLElement) return XMLElement$1.exports;
  hasRequiredXMLElement = 1;
  (function() {
    var XMLAttribute2, XMLNode2, getValue, isFunction2, isObject2, ref, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    ref = requireUtility(), isObject2 = ref.isObject, isFunction2 = ref.isFunction, getValue = ref.getValue;
    XMLNode2 = requireXMLNode();
    XMLAttribute2 = requireXMLAttribute();
    XMLElement$1.exports = (function(superClass) {
      extend2(XMLElement2, superClass);
      function XMLElement2(parent, name, attributes) {
        XMLElement2.__super__.constructor.call(this, parent);
        if (name == null) {
          throw new Error("Missing element name. " + this.debugInfo());
        }
        this.name = this.stringify.eleName(name);
        this.attributes = {};
        if (attributes != null) {
          this.attribute(attributes);
        }
        if (parent.isDocument) {
          this.isRoot = true;
          this.documentObject = parent;
          parent.rootObject = this;
        }
      }
      XMLElement2.prototype.clone = function() {
        var att, attName, clonedSelf, ref1;
        clonedSelf = Object.create(this);
        if (clonedSelf.isRoot) {
          clonedSelf.documentObject = null;
        }
        clonedSelf.attributes = {};
        ref1 = this.attributes;
        for (attName in ref1) {
          if (!hasProp.call(ref1, attName)) continue;
          att = ref1[attName];
          clonedSelf.attributes[attName] = att.clone();
        }
        clonedSelf.children = [];
        this.children.forEach(function(child) {
          var clonedChild;
          clonedChild = child.clone();
          clonedChild.parent = clonedSelf;
          return clonedSelf.children.push(clonedChild);
        });
        return clonedSelf;
      };
      XMLElement2.prototype.attribute = function(name, value) {
        var attName, attValue;
        if (name != null) {
          name = getValue(name);
        }
        if (isObject2(name)) {
          for (attName in name) {
            if (!hasProp.call(name, attName)) continue;
            attValue = name[attName];
            this.attribute(attName, attValue);
          }
        } else {
          if (isFunction2(value)) {
            value = value.apply();
          }
          if (!this.options.skipNullAttributes || value != null) {
            this.attributes[name] = new XMLAttribute2(this, name, value);
          }
        }
        return this;
      };
      XMLElement2.prototype.removeAttribute = function(name) {
        var attName, i, len;
        if (name == null) {
          throw new Error("Missing attribute name. " + this.debugInfo());
        }
        name = getValue(name);
        if (Array.isArray(name)) {
          for (i = 0, len = name.length; i < len; i++) {
            attName = name[i];
            delete this.attributes[attName];
          }
        } else {
          delete this.attributes[name];
        }
        return this;
      };
      XMLElement2.prototype.toString = function(options) {
        return this.options.writer.set(options).element(this);
      };
      XMLElement2.prototype.att = function(name, value) {
        return this.attribute(name, value);
      };
      XMLElement2.prototype.a = function(name, value) {
        return this.attribute(name, value);
      };
      return XMLElement2;
    })(XMLNode2);
  }).call(XMLElement);
  return XMLElement$1.exports;
}
var XMLCData$1 = { exports: {} };
var XMLCData = XMLCData$1.exports;
var hasRequiredXMLCData;
function requireXMLCData() {
  if (hasRequiredXMLCData) return XMLCData$1.exports;
  hasRequiredXMLCData = 1;
  (function() {
    var XMLNode2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLNode2 = requireXMLNode();
    XMLCData$1.exports = (function(superClass) {
      extend2(XMLCData2, superClass);
      function XMLCData2(parent, text) {
        XMLCData2.__super__.constructor.call(this, parent);
        if (text == null) {
          throw new Error("Missing CDATA text. " + this.debugInfo());
        }
        this.text = this.stringify.cdata(text);
      }
      XMLCData2.prototype.clone = function() {
        return Object.create(this);
      };
      XMLCData2.prototype.toString = function(options) {
        return this.options.writer.set(options).cdata(this);
      };
      return XMLCData2;
    })(XMLNode2);
  }).call(XMLCData);
  return XMLCData$1.exports;
}
var XMLComment$1 = { exports: {} };
var XMLComment = XMLComment$1.exports;
var hasRequiredXMLComment;
function requireXMLComment() {
  if (hasRequiredXMLComment) return XMLComment$1.exports;
  hasRequiredXMLComment = 1;
  (function() {
    var XMLNode2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLNode2 = requireXMLNode();
    XMLComment$1.exports = (function(superClass) {
      extend2(XMLComment2, superClass);
      function XMLComment2(parent, text) {
        XMLComment2.__super__.constructor.call(this, parent);
        if (text == null) {
          throw new Error("Missing comment text. " + this.debugInfo());
        }
        this.text = this.stringify.comment(text);
      }
      XMLComment2.prototype.clone = function() {
        return Object.create(this);
      };
      XMLComment2.prototype.toString = function(options) {
        return this.options.writer.set(options).comment(this);
      };
      return XMLComment2;
    })(XMLNode2);
  }).call(XMLComment);
  return XMLComment$1.exports;
}
var XMLDeclaration$1 = { exports: {} };
var XMLDeclaration = XMLDeclaration$1.exports;
var hasRequiredXMLDeclaration;
function requireXMLDeclaration() {
  if (hasRequiredXMLDeclaration) return XMLDeclaration$1.exports;
  hasRequiredXMLDeclaration = 1;
  (function() {
    var XMLNode2, isObject2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    isObject2 = requireUtility().isObject;
    XMLNode2 = requireXMLNode();
    XMLDeclaration$1.exports = (function(superClass) {
      extend2(XMLDeclaration2, superClass);
      function XMLDeclaration2(parent, version, encoding, standalone) {
        var ref;
        XMLDeclaration2.__super__.constructor.call(this, parent);
        if (isObject2(version)) {
          ref = version, version = ref.version, encoding = ref.encoding, standalone = ref.standalone;
        }
        if (!version) {
          version = "1.0";
        }
        this.version = this.stringify.xmlVersion(version);
        if (encoding != null) {
          this.encoding = this.stringify.xmlEncoding(encoding);
        }
        if (standalone != null) {
          this.standalone = this.stringify.xmlStandalone(standalone);
        }
      }
      XMLDeclaration2.prototype.toString = function(options) {
        return this.options.writer.set(options).declaration(this);
      };
      return XMLDeclaration2;
    })(XMLNode2);
  }).call(XMLDeclaration);
  return XMLDeclaration$1.exports;
}
var XMLDocType$1 = { exports: {} };
var XMLDTDAttList$1 = { exports: {} };
var XMLDTDAttList = XMLDTDAttList$1.exports;
var hasRequiredXMLDTDAttList;
function requireXMLDTDAttList() {
  if (hasRequiredXMLDTDAttList) return XMLDTDAttList$1.exports;
  hasRequiredXMLDTDAttList = 1;
  (function() {
    var XMLNode2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLNode2 = requireXMLNode();
    XMLDTDAttList$1.exports = (function(superClass) {
      extend2(XMLDTDAttList2, superClass);
      function XMLDTDAttList2(parent, elementName, attributeName, attributeType, defaultValueType, defaultValue) {
        XMLDTDAttList2.__super__.constructor.call(this, parent);
        if (elementName == null) {
          throw new Error("Missing DTD element name. " + this.debugInfo());
        }
        if (attributeName == null) {
          throw new Error("Missing DTD attribute name. " + this.debugInfo(elementName));
        }
        if (!attributeType) {
          throw new Error("Missing DTD attribute type. " + this.debugInfo(elementName));
        }
        if (!defaultValueType) {
          throw new Error("Missing DTD attribute default. " + this.debugInfo(elementName));
        }
        if (defaultValueType.indexOf("#") !== 0) {
          defaultValueType = "#" + defaultValueType;
        }
        if (!defaultValueType.match(/^(#REQUIRED|#IMPLIED|#FIXED|#DEFAULT)$/)) {
          throw new Error("Invalid default value type; expected: #REQUIRED, #IMPLIED, #FIXED or #DEFAULT. " + this.debugInfo(elementName));
        }
        if (defaultValue && !defaultValueType.match(/^(#FIXED|#DEFAULT)$/)) {
          throw new Error("Default value only applies to #FIXED or #DEFAULT. " + this.debugInfo(elementName));
        }
        this.elementName = this.stringify.eleName(elementName);
        this.attributeName = this.stringify.attName(attributeName);
        this.attributeType = this.stringify.dtdAttType(attributeType);
        this.defaultValue = this.stringify.dtdAttDefault(defaultValue);
        this.defaultValueType = defaultValueType;
      }
      XMLDTDAttList2.prototype.toString = function(options) {
        return this.options.writer.set(options).dtdAttList(this);
      };
      return XMLDTDAttList2;
    })(XMLNode2);
  }).call(XMLDTDAttList);
  return XMLDTDAttList$1.exports;
}
var XMLDTDEntity$1 = { exports: {} };
var XMLDTDEntity = XMLDTDEntity$1.exports;
var hasRequiredXMLDTDEntity;
function requireXMLDTDEntity() {
  if (hasRequiredXMLDTDEntity) return XMLDTDEntity$1.exports;
  hasRequiredXMLDTDEntity = 1;
  (function() {
    var XMLNode2, isObject2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    isObject2 = requireUtility().isObject;
    XMLNode2 = requireXMLNode();
    XMLDTDEntity$1.exports = (function(superClass) {
      extend2(XMLDTDEntity2, superClass);
      function XMLDTDEntity2(parent, pe, name, value) {
        XMLDTDEntity2.__super__.constructor.call(this, parent);
        if (name == null) {
          throw new Error("Missing DTD entity name. " + this.debugInfo(name));
        }
        if (value == null) {
          throw new Error("Missing DTD entity value. " + this.debugInfo(name));
        }
        this.pe = !!pe;
        this.name = this.stringify.eleName(name);
        if (!isObject2(value)) {
          this.value = this.stringify.dtdEntityValue(value);
        } else {
          if (!value.pubID && !value.sysID) {
            throw new Error("Public and/or system identifiers are required for an external entity. " + this.debugInfo(name));
          }
          if (value.pubID && !value.sysID) {
            throw new Error("System identifier is required for a public external entity. " + this.debugInfo(name));
          }
          if (value.pubID != null) {
            this.pubID = this.stringify.dtdPubID(value.pubID);
          }
          if (value.sysID != null) {
            this.sysID = this.stringify.dtdSysID(value.sysID);
          }
          if (value.nData != null) {
            this.nData = this.stringify.dtdNData(value.nData);
          }
          if (this.pe && this.nData) {
            throw new Error("Notation declaration is not allowed in a parameter entity. " + this.debugInfo(name));
          }
        }
      }
      XMLDTDEntity2.prototype.toString = function(options) {
        return this.options.writer.set(options).dtdEntity(this);
      };
      return XMLDTDEntity2;
    })(XMLNode2);
  }).call(XMLDTDEntity);
  return XMLDTDEntity$1.exports;
}
var XMLDTDElement$1 = { exports: {} };
var XMLDTDElement = XMLDTDElement$1.exports;
var hasRequiredXMLDTDElement;
function requireXMLDTDElement() {
  if (hasRequiredXMLDTDElement) return XMLDTDElement$1.exports;
  hasRequiredXMLDTDElement = 1;
  (function() {
    var XMLNode2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLNode2 = requireXMLNode();
    XMLDTDElement$1.exports = (function(superClass) {
      extend2(XMLDTDElement2, superClass);
      function XMLDTDElement2(parent, name, value) {
        XMLDTDElement2.__super__.constructor.call(this, parent);
        if (name == null) {
          throw new Error("Missing DTD element name. " + this.debugInfo());
        }
        if (!value) {
          value = "(#PCDATA)";
        }
        if (Array.isArray(value)) {
          value = "(" + value.join(",") + ")";
        }
        this.name = this.stringify.eleName(name);
        this.value = this.stringify.dtdElementValue(value);
      }
      XMLDTDElement2.prototype.toString = function(options) {
        return this.options.writer.set(options).dtdElement(this);
      };
      return XMLDTDElement2;
    })(XMLNode2);
  }).call(XMLDTDElement);
  return XMLDTDElement$1.exports;
}
var XMLDTDNotation$1 = { exports: {} };
var XMLDTDNotation = XMLDTDNotation$1.exports;
var hasRequiredXMLDTDNotation;
function requireXMLDTDNotation() {
  if (hasRequiredXMLDTDNotation) return XMLDTDNotation$1.exports;
  hasRequiredXMLDTDNotation = 1;
  (function() {
    var XMLNode2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLNode2 = requireXMLNode();
    XMLDTDNotation$1.exports = (function(superClass) {
      extend2(XMLDTDNotation2, superClass);
      function XMLDTDNotation2(parent, name, value) {
        XMLDTDNotation2.__super__.constructor.call(this, parent);
        if (name == null) {
          throw new Error("Missing DTD notation name. " + this.debugInfo(name));
        }
        if (!value.pubID && !value.sysID) {
          throw new Error("Public or system identifiers are required for an external entity. " + this.debugInfo(name));
        }
        this.name = this.stringify.eleName(name);
        if (value.pubID != null) {
          this.pubID = this.stringify.dtdPubID(value.pubID);
        }
        if (value.sysID != null) {
          this.sysID = this.stringify.dtdSysID(value.sysID);
        }
      }
      XMLDTDNotation2.prototype.toString = function(options) {
        return this.options.writer.set(options).dtdNotation(this);
      };
      return XMLDTDNotation2;
    })(XMLNode2);
  }).call(XMLDTDNotation);
  return XMLDTDNotation$1.exports;
}
var XMLDocType = XMLDocType$1.exports;
var hasRequiredXMLDocType;
function requireXMLDocType() {
  if (hasRequiredXMLDocType) return XMLDocType$1.exports;
  hasRequiredXMLDocType = 1;
  (function() {
    var XMLDTDAttList2, XMLDTDElement2, XMLDTDEntity2, XMLDTDNotation2, XMLNode2, isObject2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    isObject2 = requireUtility().isObject;
    XMLNode2 = requireXMLNode();
    XMLDTDAttList2 = requireXMLDTDAttList();
    XMLDTDEntity2 = requireXMLDTDEntity();
    XMLDTDElement2 = requireXMLDTDElement();
    XMLDTDNotation2 = requireXMLDTDNotation();
    XMLDocType$1.exports = (function(superClass) {
      extend2(XMLDocType2, superClass);
      function XMLDocType2(parent, pubID, sysID) {
        var ref, ref1;
        XMLDocType2.__super__.constructor.call(this, parent);
        this.name = "!DOCTYPE";
        this.documentObject = parent;
        if (isObject2(pubID)) {
          ref = pubID, pubID = ref.pubID, sysID = ref.sysID;
        }
        if (sysID == null) {
          ref1 = [pubID, sysID], sysID = ref1[0], pubID = ref1[1];
        }
        if (pubID != null) {
          this.pubID = this.stringify.dtdPubID(pubID);
        }
        if (sysID != null) {
          this.sysID = this.stringify.dtdSysID(sysID);
        }
      }
      XMLDocType2.prototype.element = function(name, value) {
        var child;
        child = new XMLDTDElement2(this, name, value);
        this.children.push(child);
        return this;
      };
      XMLDocType2.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
        var child;
        child = new XMLDTDAttList2(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
        this.children.push(child);
        return this;
      };
      XMLDocType2.prototype.entity = function(name, value) {
        var child;
        child = new XMLDTDEntity2(this, false, name, value);
        this.children.push(child);
        return this;
      };
      XMLDocType2.prototype.pEntity = function(name, value) {
        var child;
        child = new XMLDTDEntity2(this, true, name, value);
        this.children.push(child);
        return this;
      };
      XMLDocType2.prototype.notation = function(name, value) {
        var child;
        child = new XMLDTDNotation2(this, name, value);
        this.children.push(child);
        return this;
      };
      XMLDocType2.prototype.toString = function(options) {
        return this.options.writer.set(options).docType(this);
      };
      XMLDocType2.prototype.ele = function(name, value) {
        return this.element(name, value);
      };
      XMLDocType2.prototype.att = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
        return this.attList(elementName, attributeName, attributeType, defaultValueType, defaultValue);
      };
      XMLDocType2.prototype.ent = function(name, value) {
        return this.entity(name, value);
      };
      XMLDocType2.prototype.pent = function(name, value) {
        return this.pEntity(name, value);
      };
      XMLDocType2.prototype.not = function(name, value) {
        return this.notation(name, value);
      };
      XMLDocType2.prototype.up = function() {
        return this.root() || this.documentObject;
      };
      return XMLDocType2;
    })(XMLNode2);
  }).call(XMLDocType);
  return XMLDocType$1.exports;
}
var XMLRaw$1 = { exports: {} };
var XMLRaw = XMLRaw$1.exports;
var hasRequiredXMLRaw;
function requireXMLRaw() {
  if (hasRequiredXMLRaw) return XMLRaw$1.exports;
  hasRequiredXMLRaw = 1;
  (function() {
    var XMLNode2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLNode2 = requireXMLNode();
    XMLRaw$1.exports = (function(superClass) {
      extend2(XMLRaw2, superClass);
      function XMLRaw2(parent, text) {
        XMLRaw2.__super__.constructor.call(this, parent);
        if (text == null) {
          throw new Error("Missing raw text. " + this.debugInfo());
        }
        this.value = this.stringify.raw(text);
      }
      XMLRaw2.prototype.clone = function() {
        return Object.create(this);
      };
      XMLRaw2.prototype.toString = function(options) {
        return this.options.writer.set(options).raw(this);
      };
      return XMLRaw2;
    })(XMLNode2);
  }).call(XMLRaw);
  return XMLRaw$1.exports;
}
var XMLText$1 = { exports: {} };
var XMLText = XMLText$1.exports;
var hasRequiredXMLText;
function requireXMLText() {
  if (hasRequiredXMLText) return XMLText$1.exports;
  hasRequiredXMLText = 1;
  (function() {
    var XMLNode2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLNode2 = requireXMLNode();
    XMLText$1.exports = (function(superClass) {
      extend2(XMLText2, superClass);
      function XMLText2(parent, text) {
        XMLText2.__super__.constructor.call(this, parent);
        if (text == null) {
          throw new Error("Missing element text. " + this.debugInfo());
        }
        this.value = this.stringify.eleText(text);
      }
      XMLText2.prototype.clone = function() {
        return Object.create(this);
      };
      XMLText2.prototype.toString = function(options) {
        return this.options.writer.set(options).text(this);
      };
      return XMLText2;
    })(XMLNode2);
  }).call(XMLText);
  return XMLText$1.exports;
}
var XMLProcessingInstruction$1 = { exports: {} };
var XMLProcessingInstruction = XMLProcessingInstruction$1.exports;
var hasRequiredXMLProcessingInstruction;
function requireXMLProcessingInstruction() {
  if (hasRequiredXMLProcessingInstruction) return XMLProcessingInstruction$1.exports;
  hasRequiredXMLProcessingInstruction = 1;
  (function() {
    var XMLNode2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLNode2 = requireXMLNode();
    XMLProcessingInstruction$1.exports = (function(superClass) {
      extend2(XMLProcessingInstruction2, superClass);
      function XMLProcessingInstruction2(parent, target, value) {
        XMLProcessingInstruction2.__super__.constructor.call(this, parent);
        if (target == null) {
          throw new Error("Missing instruction target. " + this.debugInfo());
        }
        this.target = this.stringify.insTarget(target);
        if (value) {
          this.value = this.stringify.insValue(value);
        }
      }
      XMLProcessingInstruction2.prototype.clone = function() {
        return Object.create(this);
      };
      XMLProcessingInstruction2.prototype.toString = function(options) {
        return this.options.writer.set(options).processingInstruction(this);
      };
      return XMLProcessingInstruction2;
    })(XMLNode2);
  }).call(XMLProcessingInstruction);
  return XMLProcessingInstruction$1.exports;
}
var XMLDummy$1 = { exports: {} };
var XMLDummy = XMLDummy$1.exports;
var hasRequiredXMLDummy;
function requireXMLDummy() {
  if (hasRequiredXMLDummy) return XMLDummy$1.exports;
  hasRequiredXMLDummy = 1;
  (function() {
    var XMLNode2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLNode2 = requireXMLNode();
    XMLDummy$1.exports = (function(superClass) {
      extend2(XMLDummy2, superClass);
      function XMLDummy2(parent) {
        XMLDummy2.__super__.constructor.call(this, parent);
        this.isDummy = true;
      }
      XMLDummy2.prototype.clone = function() {
        return Object.create(this);
      };
      XMLDummy2.prototype.toString = function(options) {
        return "";
      };
      return XMLDummy2;
    })(XMLNode2);
  }).call(XMLDummy);
  return XMLDummy$1.exports;
}
var XMLNode = XMLNode$1.exports;
var hasRequiredXMLNode;
function requireXMLNode() {
  if (hasRequiredXMLNode) return XMLNode$1.exports;
  hasRequiredXMLNode = 1;
  (function() {
    var XMLCData2, XMLComment2, XMLDeclaration2, XMLDocType2, XMLDummy2, XMLElement2, XMLProcessingInstruction2, XMLRaw2, XMLText2, getValue, isEmpty2, isFunction2, isObject2, ref, hasProp = {}.hasOwnProperty;
    ref = requireUtility(), isObject2 = ref.isObject, isFunction2 = ref.isFunction, isEmpty2 = ref.isEmpty, getValue = ref.getValue;
    XMLElement2 = null;
    XMLCData2 = null;
    XMLComment2 = null;
    XMLDeclaration2 = null;
    XMLDocType2 = null;
    XMLRaw2 = null;
    XMLText2 = null;
    XMLProcessingInstruction2 = null;
    XMLDummy2 = null;
    XMLNode$1.exports = (function() {
      function XMLNode2(parent) {
        this.parent = parent;
        if (this.parent) {
          this.options = this.parent.options;
          this.stringify = this.parent.stringify;
        }
        this.children = [];
        if (!XMLElement2) {
          XMLElement2 = requireXMLElement();
          XMLCData2 = requireXMLCData();
          XMLComment2 = requireXMLComment();
          XMLDeclaration2 = requireXMLDeclaration();
          XMLDocType2 = requireXMLDocType();
          XMLRaw2 = requireXMLRaw();
          XMLText2 = requireXMLText();
          XMLProcessingInstruction2 = requireXMLProcessingInstruction();
          XMLDummy2 = requireXMLDummy();
        }
      }
      XMLNode2.prototype.element = function(name, attributes, text) {
        var childNode, item, j, k, key, lastChild, len, len1, ref1, ref2, val;
        lastChild = null;
        if (attributes === null && text == null) {
          ref1 = [{}, null], attributes = ref1[0], text = ref1[1];
        }
        if (attributes == null) {
          attributes = {};
        }
        attributes = getValue(attributes);
        if (!isObject2(attributes)) {
          ref2 = [attributes, text], text = ref2[0], attributes = ref2[1];
        }
        if (name != null) {
          name = getValue(name);
        }
        if (Array.isArray(name)) {
          for (j = 0, len = name.length; j < len; j++) {
            item = name[j];
            lastChild = this.element(item);
          }
        } else if (isFunction2(name)) {
          lastChild = this.element(name.apply());
        } else if (isObject2(name)) {
          for (key in name) {
            if (!hasProp.call(name, key)) continue;
            val = name[key];
            if (isFunction2(val)) {
              val = val.apply();
            }
            if (isObject2(val) && isEmpty2(val)) {
              val = null;
            }
            if (!this.options.ignoreDecorators && this.stringify.convertAttKey && key.indexOf(this.stringify.convertAttKey) === 0) {
              lastChild = this.attribute(key.substr(this.stringify.convertAttKey.length), val);
            } else if (!this.options.separateArrayItems && Array.isArray(val)) {
              for (k = 0, len1 = val.length; k < len1; k++) {
                item = val[k];
                childNode = {};
                childNode[key] = item;
                lastChild = this.element(childNode);
              }
            } else if (isObject2(val)) {
              lastChild = this.element(key);
              lastChild.element(val);
            } else {
              lastChild = this.element(key, val);
            }
          }
        } else if (this.options.skipNullNodes && text === null) {
          lastChild = this.dummy();
        } else {
          if (!this.options.ignoreDecorators && this.stringify.convertTextKey && name.indexOf(this.stringify.convertTextKey) === 0) {
            lastChild = this.text(text);
          } else if (!this.options.ignoreDecorators && this.stringify.convertCDataKey && name.indexOf(this.stringify.convertCDataKey) === 0) {
            lastChild = this.cdata(text);
          } else if (!this.options.ignoreDecorators && this.stringify.convertCommentKey && name.indexOf(this.stringify.convertCommentKey) === 0) {
            lastChild = this.comment(text);
          } else if (!this.options.ignoreDecorators && this.stringify.convertRawKey && name.indexOf(this.stringify.convertRawKey) === 0) {
            lastChild = this.raw(text);
          } else if (!this.options.ignoreDecorators && this.stringify.convertPIKey && name.indexOf(this.stringify.convertPIKey) === 0) {
            lastChild = this.instruction(name.substr(this.stringify.convertPIKey.length), text);
          } else {
            lastChild = this.node(name, attributes, text);
          }
        }
        if (lastChild == null) {
          throw new Error("Could not create any elements with: " + name + ". " + this.debugInfo());
        }
        return lastChild;
      };
      XMLNode2.prototype.insertBefore = function(name, attributes, text) {
        var child, i, removed;
        if (this.isRoot) {
          throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
        }
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i);
        child = this.parent.element(name, attributes, text);
        Array.prototype.push.apply(this.parent.children, removed);
        return child;
      };
      XMLNode2.prototype.insertAfter = function(name, attributes, text) {
        var child, i, removed;
        if (this.isRoot) {
          throw new Error("Cannot insert elements at root level. " + this.debugInfo(name));
        }
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i + 1);
        child = this.parent.element(name, attributes, text);
        Array.prototype.push.apply(this.parent.children, removed);
        return child;
      };
      XMLNode2.prototype.remove = function() {
        var i;
        if (this.isRoot) {
          throw new Error("Cannot remove the root element. " + this.debugInfo());
        }
        i = this.parent.children.indexOf(this);
        [].splice.apply(this.parent.children, [i, i - i + 1].concat([]));
        return this.parent;
      };
      XMLNode2.prototype.node = function(name, attributes, text) {
        var child, ref1;
        if (name != null) {
          name = getValue(name);
        }
        attributes || (attributes = {});
        attributes = getValue(attributes);
        if (!isObject2(attributes)) {
          ref1 = [attributes, text], text = ref1[0], attributes = ref1[1];
        }
        child = new XMLElement2(this, name, attributes);
        if (text != null) {
          child.text(text);
        }
        this.children.push(child);
        return child;
      };
      XMLNode2.prototype.text = function(value) {
        var child;
        child = new XMLText2(this, value);
        this.children.push(child);
        return this;
      };
      XMLNode2.prototype.cdata = function(value) {
        var child;
        child = new XMLCData2(this, value);
        this.children.push(child);
        return this;
      };
      XMLNode2.prototype.comment = function(value) {
        var child;
        child = new XMLComment2(this, value);
        this.children.push(child);
        return this;
      };
      XMLNode2.prototype.commentBefore = function(value) {
        var i, removed;
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i);
        this.parent.comment(value);
        Array.prototype.push.apply(this.parent.children, removed);
        return this;
      };
      XMLNode2.prototype.commentAfter = function(value) {
        var i, removed;
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i + 1);
        this.parent.comment(value);
        Array.prototype.push.apply(this.parent.children, removed);
        return this;
      };
      XMLNode2.prototype.raw = function(value) {
        var child;
        child = new XMLRaw2(this, value);
        this.children.push(child);
        return this;
      };
      XMLNode2.prototype.dummy = function() {
        var child;
        child = new XMLDummy2(this);
        this.children.push(child);
        return child;
      };
      XMLNode2.prototype.instruction = function(target, value) {
        var insTarget, insValue, instruction, j, len;
        if (target != null) {
          target = getValue(target);
        }
        if (value != null) {
          value = getValue(value);
        }
        if (Array.isArray(target)) {
          for (j = 0, len = target.length; j < len; j++) {
            insTarget = target[j];
            this.instruction(insTarget);
          }
        } else if (isObject2(target)) {
          for (insTarget in target) {
            if (!hasProp.call(target, insTarget)) continue;
            insValue = target[insTarget];
            this.instruction(insTarget, insValue);
          }
        } else {
          if (isFunction2(value)) {
            value = value.apply();
          }
          instruction = new XMLProcessingInstruction2(this, target, value);
          this.children.push(instruction);
        }
        return this;
      };
      XMLNode2.prototype.instructionBefore = function(target, value) {
        var i, removed;
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i);
        this.parent.instruction(target, value);
        Array.prototype.push.apply(this.parent.children, removed);
        return this;
      };
      XMLNode2.prototype.instructionAfter = function(target, value) {
        var i, removed;
        i = this.parent.children.indexOf(this);
        removed = this.parent.children.splice(i + 1);
        this.parent.instruction(target, value);
        Array.prototype.push.apply(this.parent.children, removed);
        return this;
      };
      XMLNode2.prototype.declaration = function(version, encoding, standalone) {
        var doc, xmldec;
        doc = this.document();
        xmldec = new XMLDeclaration2(doc, version, encoding, standalone);
        if (doc.children[0] instanceof XMLDeclaration2) {
          doc.children[0] = xmldec;
        } else {
          doc.children.unshift(xmldec);
        }
        return doc.root() || doc;
      };
      XMLNode2.prototype.doctype = function(pubID, sysID) {
        var child, doc, doctype, i, j, k, len, len1, ref1, ref2;
        doc = this.document();
        doctype = new XMLDocType2(doc, pubID, sysID);
        ref1 = doc.children;
        for (i = j = 0, len = ref1.length; j < len; i = ++j) {
          child = ref1[i];
          if (child instanceof XMLDocType2) {
            doc.children[i] = doctype;
            return doctype;
          }
        }
        ref2 = doc.children;
        for (i = k = 0, len1 = ref2.length; k < len1; i = ++k) {
          child = ref2[i];
          if (child.isRoot) {
            doc.children.splice(i, 0, doctype);
            return doctype;
          }
        }
        doc.children.push(doctype);
        return doctype;
      };
      XMLNode2.prototype.up = function() {
        if (this.isRoot) {
          throw new Error("The root node has no parent. Use doc() if you need to get the document object.");
        }
        return this.parent;
      };
      XMLNode2.prototype.root = function() {
        var node;
        node = this;
        while (node) {
          if (node.isDocument) {
            return node.rootObject;
          } else if (node.isRoot) {
            return node;
          } else {
            node = node.parent;
          }
        }
      };
      XMLNode2.prototype.document = function() {
        var node;
        node = this;
        while (node) {
          if (node.isDocument) {
            return node;
          } else {
            node = node.parent;
          }
        }
      };
      XMLNode2.prototype.end = function(options) {
        return this.document().end(options);
      };
      XMLNode2.prototype.prev = function() {
        var i;
        i = this.parent.children.indexOf(this);
        while (i > 0 && this.parent.children[i - 1].isDummy) {
          i = i - 1;
        }
        if (i < 1) {
          throw new Error("Already at the first node. " + this.debugInfo());
        }
        return this.parent.children[i - 1];
      };
      XMLNode2.prototype.next = function() {
        var i;
        i = this.parent.children.indexOf(this);
        while (i < this.parent.children.length - 1 && this.parent.children[i + 1].isDummy) {
          i = i + 1;
        }
        if (i === -1 || i === this.parent.children.length - 1) {
          throw new Error("Already at the last node. " + this.debugInfo());
        }
        return this.parent.children[i + 1];
      };
      XMLNode2.prototype.importDocument = function(doc) {
        var clonedRoot;
        clonedRoot = doc.root().clone();
        clonedRoot.parent = this;
        clonedRoot.isRoot = false;
        this.children.push(clonedRoot);
        return this;
      };
      XMLNode2.prototype.debugInfo = function(name) {
        var ref1, ref2;
        name = name || this.name;
        if (name == null && !((ref1 = this.parent) != null ? ref1.name : void 0)) {
          return "";
        } else if (name == null) {
          return "parent: <" + this.parent.name + ">";
        } else if (!((ref2 = this.parent) != null ? ref2.name : void 0)) {
          return "node: <" + name + ">";
        } else {
          return "node: <" + name + ">, parent: <" + this.parent.name + ">";
        }
      };
      XMLNode2.prototype.ele = function(name, attributes, text) {
        return this.element(name, attributes, text);
      };
      XMLNode2.prototype.nod = function(name, attributes, text) {
        return this.node(name, attributes, text);
      };
      XMLNode2.prototype.txt = function(value) {
        return this.text(value);
      };
      XMLNode2.prototype.dat = function(value) {
        return this.cdata(value);
      };
      XMLNode2.prototype.com = function(value) {
        return this.comment(value);
      };
      XMLNode2.prototype.ins = function(target, value) {
        return this.instruction(target, value);
      };
      XMLNode2.prototype.doc = function() {
        return this.document();
      };
      XMLNode2.prototype.dec = function(version, encoding, standalone) {
        return this.declaration(version, encoding, standalone);
      };
      XMLNode2.prototype.dtd = function(pubID, sysID) {
        return this.doctype(pubID, sysID);
      };
      XMLNode2.prototype.e = function(name, attributes, text) {
        return this.element(name, attributes, text);
      };
      XMLNode2.prototype.n = function(name, attributes, text) {
        return this.node(name, attributes, text);
      };
      XMLNode2.prototype.t = function(value) {
        return this.text(value);
      };
      XMLNode2.prototype.d = function(value) {
        return this.cdata(value);
      };
      XMLNode2.prototype.c = function(value) {
        return this.comment(value);
      };
      XMLNode2.prototype.r = function(value) {
        return this.raw(value);
      };
      XMLNode2.prototype.i = function(target, value) {
        return this.instruction(target, value);
      };
      XMLNode2.prototype.u = function() {
        return this.up();
      };
      XMLNode2.prototype.importXMLBuilder = function(doc) {
        return this.importDocument(doc);
      };
      return XMLNode2;
    })();
  }).call(XMLNode);
  return XMLNode$1.exports;
}
var XMLStringifier$1 = { exports: {} };
var XMLStringifier = XMLStringifier$1.exports;
var hasRequiredXMLStringifier;
function requireXMLStringifier() {
  if (hasRequiredXMLStringifier) return XMLStringifier$1.exports;
  hasRequiredXMLStringifier = 1;
  (function() {
    var bind2 = function(fn, me) {
      return function() {
        return fn.apply(me, arguments);
      };
    }, hasProp = {}.hasOwnProperty;
    XMLStringifier$1.exports = (function() {
      function XMLStringifier2(options) {
        this.assertLegalChar = bind2(this.assertLegalChar, this);
        var key, ref, value;
        options || (options = {});
        this.noDoubleEncoding = options.noDoubleEncoding;
        ref = options.stringify || {};
        for (key in ref) {
          if (!hasProp.call(ref, key)) continue;
          value = ref[key];
          this[key] = value;
        }
      }
      XMLStringifier2.prototype.eleName = function(val) {
        val = "" + val || "";
        return this.assertLegalChar(val);
      };
      XMLStringifier2.prototype.eleText = function(val) {
        val = "" + val || "";
        return this.assertLegalChar(this.elEscape(val));
      };
      XMLStringifier2.prototype.cdata = function(val) {
        val = "" + val || "";
        val = val.replace("]]>", "]]]]><![CDATA[>");
        return this.assertLegalChar(val);
      };
      XMLStringifier2.prototype.comment = function(val) {
        val = "" + val || "";
        if (val.match(/--/)) {
          throw new Error("Comment text cannot contain double-hypen: " + val);
        }
        return this.assertLegalChar(val);
      };
      XMLStringifier2.prototype.raw = function(val) {
        return "" + val || "";
      };
      XMLStringifier2.prototype.attName = function(val) {
        return val = "" + val || "";
      };
      XMLStringifier2.prototype.attValue = function(val) {
        val = "" + val || "";
        return this.attEscape(val);
      };
      XMLStringifier2.prototype.insTarget = function(val) {
        return "" + val || "";
      };
      XMLStringifier2.prototype.insValue = function(val) {
        val = "" + val || "";
        if (val.match(/\?>/)) {
          throw new Error("Invalid processing instruction value: " + val);
        }
        return val;
      };
      XMLStringifier2.prototype.xmlVersion = function(val) {
        val = "" + val || "";
        if (!val.match(/1\.[0-9]+/)) {
          throw new Error("Invalid version number: " + val);
        }
        return val;
      };
      XMLStringifier2.prototype.xmlEncoding = function(val) {
        val = "" + val || "";
        if (!val.match(/^[A-Za-z](?:[A-Za-z0-9._-])*$/)) {
          throw new Error("Invalid encoding: " + val);
        }
        return val;
      };
      XMLStringifier2.prototype.xmlStandalone = function(val) {
        if (val) {
          return "yes";
        } else {
          return "no";
        }
      };
      XMLStringifier2.prototype.dtdPubID = function(val) {
        return "" + val || "";
      };
      XMLStringifier2.prototype.dtdSysID = function(val) {
        return "" + val || "";
      };
      XMLStringifier2.prototype.dtdElementValue = function(val) {
        return "" + val || "";
      };
      XMLStringifier2.prototype.dtdAttType = function(val) {
        return "" + val || "";
      };
      XMLStringifier2.prototype.dtdAttDefault = function(val) {
        if (val != null) {
          return "" + val || "";
        } else {
          return val;
        }
      };
      XMLStringifier2.prototype.dtdEntityValue = function(val) {
        return "" + val || "";
      };
      XMLStringifier2.prototype.dtdNData = function(val) {
        return "" + val || "";
      };
      XMLStringifier2.prototype.convertAttKey = "@";
      XMLStringifier2.prototype.convertPIKey = "?";
      XMLStringifier2.prototype.convertTextKey = "#text";
      XMLStringifier2.prototype.convertCDataKey = "#cdata";
      XMLStringifier2.prototype.convertCommentKey = "#comment";
      XMLStringifier2.prototype.convertRawKey = "#raw";
      XMLStringifier2.prototype.assertLegalChar = function(str) {
        var res;
        res = str.match(/[\0\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/);
        if (res) {
          throw new Error("Invalid character in string: " + str + " at index " + res.index);
        }
        return str;
      };
      XMLStringifier2.prototype.elEscape = function(str) {
        var ampregex;
        ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
        return str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r/g, "&#xD;");
      };
      XMLStringifier2.prototype.attEscape = function(str) {
        var ampregex;
        ampregex = this.noDoubleEncoding ? /(?!&\S+;)&/g : /&/g;
        return str.replace(ampregex, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/\t/g, "&#x9;").replace(/\n/g, "&#xA;").replace(/\r/g, "&#xD;");
      };
      return XMLStringifier2;
    })();
  }).call(XMLStringifier);
  return XMLStringifier$1.exports;
}
var XMLStringWriter$1 = { exports: {} };
var XMLWriterBase$1 = { exports: {} };
var XMLWriterBase = XMLWriterBase$1.exports;
var hasRequiredXMLWriterBase;
function requireXMLWriterBase() {
  if (hasRequiredXMLWriterBase) return XMLWriterBase$1.exports;
  hasRequiredXMLWriterBase = 1;
  (function() {
    var hasProp = {}.hasOwnProperty;
    XMLWriterBase$1.exports = (function() {
      function XMLWriterBase2(options) {
        var key, ref, ref1, ref2, ref3, ref4, ref5, ref6, value;
        options || (options = {});
        this.pretty = options.pretty || false;
        this.allowEmpty = (ref = options.allowEmpty) != null ? ref : false;
        if (this.pretty) {
          this.indent = (ref1 = options.indent) != null ? ref1 : "  ";
          this.newline = (ref2 = options.newline) != null ? ref2 : "\n";
          this.offset = (ref3 = options.offset) != null ? ref3 : 0;
          this.dontprettytextnodes = (ref4 = options.dontprettytextnodes) != null ? ref4 : 0;
        } else {
          this.indent = "";
          this.newline = "";
          this.offset = 0;
          this.dontprettytextnodes = 0;
        }
        this.spacebeforeslash = (ref5 = options.spacebeforeslash) != null ? ref5 : "";
        if (this.spacebeforeslash === true) {
          this.spacebeforeslash = " ";
        }
        this.newlinedefault = this.newline;
        this.prettydefault = this.pretty;
        ref6 = options.writer || {};
        for (key in ref6) {
          if (!hasProp.call(ref6, key)) continue;
          value = ref6[key];
          this[key] = value;
        }
      }
      XMLWriterBase2.prototype.set = function(options) {
        var key, ref, value;
        options || (options = {});
        if ("pretty" in options) {
          this.pretty = options.pretty;
        }
        if ("allowEmpty" in options) {
          this.allowEmpty = options.allowEmpty;
        }
        if (this.pretty) {
          this.indent = "indent" in options ? options.indent : "  ";
          this.newline = "newline" in options ? options.newline : "\n";
          this.offset = "offset" in options ? options.offset : 0;
          this.dontprettytextnodes = "dontprettytextnodes" in options ? options.dontprettytextnodes : 0;
        } else {
          this.indent = "";
          this.newline = "";
          this.offset = 0;
          this.dontprettytextnodes = 0;
        }
        this.spacebeforeslash = "spacebeforeslash" in options ? options.spacebeforeslash : "";
        if (this.spacebeforeslash === true) {
          this.spacebeforeslash = " ";
        }
        this.newlinedefault = this.newline;
        this.prettydefault = this.pretty;
        ref = options.writer || {};
        for (key in ref) {
          if (!hasProp.call(ref, key)) continue;
          value = ref[key];
          this[key] = value;
        }
        return this;
      };
      XMLWriterBase2.prototype.space = function(level) {
        var indent;
        if (this.pretty) {
          indent = (level || 0) + this.offset + 1;
          if (indent > 0) {
            return new Array(indent).join(this.indent);
          } else {
            return "";
          }
        } else {
          return "";
        }
      };
      return XMLWriterBase2;
    })();
  }).call(XMLWriterBase);
  return XMLWriterBase$1.exports;
}
var XMLStringWriter = XMLStringWriter$1.exports;
var hasRequiredXMLStringWriter;
function requireXMLStringWriter() {
  if (hasRequiredXMLStringWriter) return XMLStringWriter$1.exports;
  hasRequiredXMLStringWriter = 1;
  (function() {
    var XMLCData2, XMLComment2, XMLDTDAttList2, XMLDTDElement2, XMLDTDEntity2, XMLDTDNotation2, XMLDeclaration2, XMLDocType2, XMLDummy2, XMLElement2, XMLProcessingInstruction2, XMLRaw2, XMLText2, XMLWriterBase2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLDeclaration2 = requireXMLDeclaration();
    XMLDocType2 = requireXMLDocType();
    XMLCData2 = requireXMLCData();
    XMLComment2 = requireXMLComment();
    XMLElement2 = requireXMLElement();
    XMLRaw2 = requireXMLRaw();
    XMLText2 = requireXMLText();
    XMLProcessingInstruction2 = requireXMLProcessingInstruction();
    XMLDummy2 = requireXMLDummy();
    XMLDTDAttList2 = requireXMLDTDAttList();
    XMLDTDElement2 = requireXMLDTDElement();
    XMLDTDEntity2 = requireXMLDTDEntity();
    XMLDTDNotation2 = requireXMLDTDNotation();
    XMLWriterBase2 = requireXMLWriterBase();
    XMLStringWriter$1.exports = (function(superClass) {
      extend2(XMLStringWriter2, superClass);
      function XMLStringWriter2(options) {
        XMLStringWriter2.__super__.constructor.call(this, options);
      }
      XMLStringWriter2.prototype.document = function(doc) {
        var child, i, len, r, ref;
        this.textispresent = false;
        r = "";
        ref = doc.children;
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          if (child instanceof XMLDummy2) {
            continue;
          }
          r += (function() {
            switch (false) {
              case !(child instanceof XMLDeclaration2):
                return this.declaration(child);
              case !(child instanceof XMLDocType2):
                return this.docType(child);
              case !(child instanceof XMLComment2):
                return this.comment(child);
              case !(child instanceof XMLProcessingInstruction2):
                return this.processingInstruction(child);
              default:
                return this.element(child, 0);
            }
          }).call(this);
        }
        if (this.pretty && r.slice(-this.newline.length) === this.newline) {
          r = r.slice(0, -this.newline.length);
        }
        return r;
      };
      XMLStringWriter2.prototype.attribute = function(att) {
        return " " + att.name + '="' + att.value + '"';
      };
      XMLStringWriter2.prototype.cdata = function(node, level) {
        return this.space(level) + "<![CDATA[" + node.text + "]]>" + this.newline;
      };
      XMLStringWriter2.prototype.comment = function(node, level) {
        return this.space(level) + "<!-- " + node.text + " -->" + this.newline;
      };
      XMLStringWriter2.prototype.declaration = function(node, level) {
        var r;
        r = this.space(level);
        r += '<?xml version="' + node.version + '"';
        if (node.encoding != null) {
          r += ' encoding="' + node.encoding + '"';
        }
        if (node.standalone != null) {
          r += ' standalone="' + node.standalone + '"';
        }
        r += this.spacebeforeslash + "?>";
        r += this.newline;
        return r;
      };
      XMLStringWriter2.prototype.docType = function(node, level) {
        var child, i, len, r, ref;
        level || (level = 0);
        r = this.space(level);
        r += "<!DOCTYPE " + node.root().name;
        if (node.pubID && node.sysID) {
          r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
        } else if (node.sysID) {
          r += ' SYSTEM "' + node.sysID + '"';
        }
        if (node.children.length > 0) {
          r += " [";
          r += this.newline;
          ref = node.children;
          for (i = 0, len = ref.length; i < len; i++) {
            child = ref[i];
            r += (function() {
              switch (false) {
                case !(child instanceof XMLDTDAttList2):
                  return this.dtdAttList(child, level + 1);
                case !(child instanceof XMLDTDElement2):
                  return this.dtdElement(child, level + 1);
                case !(child instanceof XMLDTDEntity2):
                  return this.dtdEntity(child, level + 1);
                case !(child instanceof XMLDTDNotation2):
                  return this.dtdNotation(child, level + 1);
                case !(child instanceof XMLCData2):
                  return this.cdata(child, level + 1);
                case !(child instanceof XMLComment2):
                  return this.comment(child, level + 1);
                case !(child instanceof XMLProcessingInstruction2):
                  return this.processingInstruction(child, level + 1);
                default:
                  throw new Error("Unknown DTD node type: " + child.constructor.name);
              }
            }).call(this);
          }
          r += "]";
        }
        r += this.spacebeforeslash + ">";
        r += this.newline;
        return r;
      };
      XMLStringWriter2.prototype.element = function(node, level) {
        var att, child, i, j, len, len1, name, r, ref, ref1, ref2, space, textispresentwasset;
        level || (level = 0);
        textispresentwasset = false;
        if (this.textispresent) {
          this.newline = "";
          this.pretty = false;
        } else {
          this.newline = this.newlinedefault;
          this.pretty = this.prettydefault;
        }
        space = this.space(level);
        r = "";
        r += space + "<" + node.name;
        ref = node.attributes;
        for (name in ref) {
          if (!hasProp.call(ref, name)) continue;
          att = ref[name];
          r += this.attribute(att);
        }
        if (node.children.length === 0 || node.children.every(function(e) {
          return e.value === "";
        })) {
          if (this.allowEmpty) {
            r += "></" + node.name + ">" + this.newline;
          } else {
            r += this.spacebeforeslash + "/>" + this.newline;
          }
        } else if (this.pretty && node.children.length === 1 && node.children[0].value != null) {
          r += ">";
          r += node.children[0].value;
          r += "</" + node.name + ">" + this.newline;
        } else {
          if (this.dontprettytextnodes) {
            ref1 = node.children;
            for (i = 0, len = ref1.length; i < len; i++) {
              child = ref1[i];
              if (child.value != null) {
                this.textispresent++;
                textispresentwasset = true;
                break;
              }
            }
          }
          if (this.textispresent) {
            this.newline = "";
            this.pretty = false;
            space = this.space(level);
          }
          r += ">" + this.newline;
          ref2 = node.children;
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            child = ref2[j];
            r += (function() {
              switch (false) {
                case !(child instanceof XMLCData2):
                  return this.cdata(child, level + 1);
                case !(child instanceof XMLComment2):
                  return this.comment(child, level + 1);
                case !(child instanceof XMLElement2):
                  return this.element(child, level + 1);
                case !(child instanceof XMLRaw2):
                  return this.raw(child, level + 1);
                case !(child instanceof XMLText2):
                  return this.text(child, level + 1);
                case !(child instanceof XMLProcessingInstruction2):
                  return this.processingInstruction(child, level + 1);
                case !(child instanceof XMLDummy2):
                  return "";
                default:
                  throw new Error("Unknown XML node type: " + child.constructor.name);
              }
            }).call(this);
          }
          if (textispresentwasset) {
            this.textispresent--;
          }
          if (!this.textispresent) {
            this.newline = this.newlinedefault;
            this.pretty = this.prettydefault;
          }
          r += space + "</" + node.name + ">" + this.newline;
        }
        return r;
      };
      XMLStringWriter2.prototype.processingInstruction = function(node, level) {
        var r;
        r = this.space(level) + "<?" + node.target;
        if (node.value) {
          r += " " + node.value;
        }
        r += this.spacebeforeslash + "?>" + this.newline;
        return r;
      };
      XMLStringWriter2.prototype.raw = function(node, level) {
        return this.space(level) + node.value + this.newline;
      };
      XMLStringWriter2.prototype.text = function(node, level) {
        return this.space(level) + node.value + this.newline;
      };
      XMLStringWriter2.prototype.dtdAttList = function(node, level) {
        var r;
        r = this.space(level) + "<!ATTLIST " + node.elementName + " " + node.attributeName + " " + node.attributeType;
        if (node.defaultValueType !== "#DEFAULT") {
          r += " " + node.defaultValueType;
        }
        if (node.defaultValue) {
          r += ' "' + node.defaultValue + '"';
        }
        r += this.spacebeforeslash + ">" + this.newline;
        return r;
      };
      XMLStringWriter2.prototype.dtdElement = function(node, level) {
        return this.space(level) + "<!ELEMENT " + node.name + " " + node.value + this.spacebeforeslash + ">" + this.newline;
      };
      XMLStringWriter2.prototype.dtdEntity = function(node, level) {
        var r;
        r = this.space(level) + "<!ENTITY";
        if (node.pe) {
          r += " %";
        }
        r += " " + node.name;
        if (node.value) {
          r += ' "' + node.value + '"';
        } else {
          if (node.pubID && node.sysID) {
            r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
          } else if (node.sysID) {
            r += ' SYSTEM "' + node.sysID + '"';
          }
          if (node.nData) {
            r += " NDATA " + node.nData;
          }
        }
        r += this.spacebeforeslash + ">" + this.newline;
        return r;
      };
      XMLStringWriter2.prototype.dtdNotation = function(node, level) {
        var r;
        r = this.space(level) + "<!NOTATION " + node.name;
        if (node.pubID && node.sysID) {
          r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
        } else if (node.pubID) {
          r += ' PUBLIC "' + node.pubID + '"';
        } else if (node.sysID) {
          r += ' SYSTEM "' + node.sysID + '"';
        }
        r += this.spacebeforeslash + ">" + this.newline;
        return r;
      };
      XMLStringWriter2.prototype.openNode = function(node, level) {
        var att, name, r, ref;
        level || (level = 0);
        if (node instanceof XMLElement2) {
          r = this.space(level) + "<" + node.name;
          ref = node.attributes;
          for (name in ref) {
            if (!hasProp.call(ref, name)) continue;
            att = ref[name];
            r += this.attribute(att);
          }
          r += (node.children ? ">" : "/>") + this.newline;
          return r;
        } else {
          r = this.space(level) + "<!DOCTYPE " + node.rootNodeName;
          if (node.pubID && node.sysID) {
            r += ' PUBLIC "' + node.pubID + '" "' + node.sysID + '"';
          } else if (node.sysID) {
            r += ' SYSTEM "' + node.sysID + '"';
          }
          r += (node.children ? " [" : ">") + this.newline;
          return r;
        }
      };
      XMLStringWriter2.prototype.closeNode = function(node, level) {
        level || (level = 0);
        switch (false) {
          case !(node instanceof XMLElement2):
            return this.space(level) + "</" + node.name + ">" + this.newline;
          case !(node instanceof XMLDocType2):
            return this.space(level) + "]>" + this.newline;
        }
      };
      return XMLStringWriter2;
    })(XMLWriterBase2);
  }).call(XMLStringWriter);
  return XMLStringWriter$1.exports;
}
var XMLDocument = XMLDocument$1.exports;
var hasRequiredXMLDocument;
function requireXMLDocument() {
  if (hasRequiredXMLDocument) return XMLDocument$1.exports;
  hasRequiredXMLDocument = 1;
  (function() {
    var XMLNode2, XMLStringWriter2, XMLStringifier2, isPlainObject, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    isPlainObject = requireUtility().isPlainObject;
    XMLNode2 = requireXMLNode();
    XMLStringifier2 = requireXMLStringifier();
    XMLStringWriter2 = requireXMLStringWriter();
    XMLDocument$1.exports = (function(superClass) {
      extend2(XMLDocument2, superClass);
      function XMLDocument2(options) {
        XMLDocument2.__super__.constructor.call(this, null);
        this.name = "?xml";
        options || (options = {});
        if (!options.writer) {
          options.writer = new XMLStringWriter2();
        }
        this.options = options;
        this.stringify = new XMLStringifier2(options);
        this.isDocument = true;
      }
      XMLDocument2.prototype.end = function(writer2) {
        var writerOptions;
        if (!writer2) {
          writer2 = this.options.writer;
        } else if (isPlainObject(writer2)) {
          writerOptions = writer2;
          writer2 = this.options.writer.set(writerOptions);
        }
        return writer2.document(this);
      };
      XMLDocument2.prototype.toString = function(options) {
        return this.options.writer.set(options).document(this);
      };
      return XMLDocument2;
    })(XMLNode2);
  }).call(XMLDocument);
  return XMLDocument$1.exports;
}
var XMLDocumentCB$1 = { exports: {} };
var XMLDocumentCB = XMLDocumentCB$1.exports;
var hasRequiredXMLDocumentCB;
function requireXMLDocumentCB() {
  if (hasRequiredXMLDocumentCB) return XMLDocumentCB$1.exports;
  hasRequiredXMLDocumentCB = 1;
  (function() {
    var XMLAttribute2, XMLCData2, XMLComment2, XMLDTDAttList2, XMLDTDElement2, XMLDTDEntity2, XMLDTDNotation2, XMLDeclaration2, XMLDocType2, XMLElement2, XMLProcessingInstruction2, XMLRaw2, XMLStringWriter2, XMLStringifier2, XMLText2, getValue, isFunction2, isObject2, isPlainObject, ref, hasProp = {}.hasOwnProperty;
    ref = requireUtility(), isObject2 = ref.isObject, isFunction2 = ref.isFunction, isPlainObject = ref.isPlainObject, getValue = ref.getValue;
    XMLElement2 = requireXMLElement();
    XMLCData2 = requireXMLCData();
    XMLComment2 = requireXMLComment();
    XMLRaw2 = requireXMLRaw();
    XMLText2 = requireXMLText();
    XMLProcessingInstruction2 = requireXMLProcessingInstruction();
    XMLDeclaration2 = requireXMLDeclaration();
    XMLDocType2 = requireXMLDocType();
    XMLDTDAttList2 = requireXMLDTDAttList();
    XMLDTDEntity2 = requireXMLDTDEntity();
    XMLDTDElement2 = requireXMLDTDElement();
    XMLDTDNotation2 = requireXMLDTDNotation();
    XMLAttribute2 = requireXMLAttribute();
    XMLStringifier2 = requireXMLStringifier();
    XMLStringWriter2 = requireXMLStringWriter();
    XMLDocumentCB$1.exports = (function() {
      function XMLDocumentCB2(options, onData, onEnd) {
        var writerOptions;
        this.name = "?xml";
        options || (options = {});
        if (!options.writer) {
          options.writer = new XMLStringWriter2(options);
        } else if (isPlainObject(options.writer)) {
          writerOptions = options.writer;
          options.writer = new XMLStringWriter2(writerOptions);
        }
        this.options = options;
        this.writer = options.writer;
        this.stringify = new XMLStringifier2(options);
        this.onDataCallback = onData || function() {
        };
        this.onEndCallback = onEnd || function() {
        };
        this.currentNode = null;
        this.currentLevel = -1;
        this.openTags = {};
        this.documentStarted = false;
        this.documentCompleted = false;
        this.root = null;
      }
      XMLDocumentCB2.prototype.node = function(name, attributes, text) {
        var ref1, ref2;
        if (name == null) {
          throw new Error("Missing node name.");
        }
        if (this.root && this.currentLevel === -1) {
          throw new Error("Document can only have one root node. " + this.debugInfo(name));
        }
        this.openCurrent();
        name = getValue(name);
        if (attributes === null && text == null) {
          ref1 = [{}, null], attributes = ref1[0], text = ref1[1];
        }
        if (attributes == null) {
          attributes = {};
        }
        attributes = getValue(attributes);
        if (!isObject2(attributes)) {
          ref2 = [attributes, text], text = ref2[0], attributes = ref2[1];
        }
        this.currentNode = new XMLElement2(this, name, attributes);
        this.currentNode.children = false;
        this.currentLevel++;
        this.openTags[this.currentLevel] = this.currentNode;
        if (text != null) {
          this.text(text);
        }
        return this;
      };
      XMLDocumentCB2.prototype.element = function(name, attributes, text) {
        if (this.currentNode && this.currentNode instanceof XMLDocType2) {
          return this.dtdElement.apply(this, arguments);
        } else {
          return this.node(name, attributes, text);
        }
      };
      XMLDocumentCB2.prototype.attribute = function(name, value) {
        var attName, attValue;
        if (!this.currentNode || this.currentNode.children) {
          throw new Error("att() can only be used immediately after an ele() call in callback mode. " + this.debugInfo(name));
        }
        if (name != null) {
          name = getValue(name);
        }
        if (isObject2(name)) {
          for (attName in name) {
            if (!hasProp.call(name, attName)) continue;
            attValue = name[attName];
            this.attribute(attName, attValue);
          }
        } else {
          if (isFunction2(value)) {
            value = value.apply();
          }
          if (!this.options.skipNullAttributes || value != null) {
            this.currentNode.attributes[name] = new XMLAttribute2(this, name, value);
          }
        }
        return this;
      };
      XMLDocumentCB2.prototype.text = function(value) {
        var node;
        this.openCurrent();
        node = new XMLText2(this, value);
        this.onData(this.writer.text(node, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      };
      XMLDocumentCB2.prototype.cdata = function(value) {
        var node;
        this.openCurrent();
        node = new XMLCData2(this, value);
        this.onData(this.writer.cdata(node, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      };
      XMLDocumentCB2.prototype.comment = function(value) {
        var node;
        this.openCurrent();
        node = new XMLComment2(this, value);
        this.onData(this.writer.comment(node, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      };
      XMLDocumentCB2.prototype.raw = function(value) {
        var node;
        this.openCurrent();
        node = new XMLRaw2(this, value);
        this.onData(this.writer.raw(node, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      };
      XMLDocumentCB2.prototype.instruction = function(target, value) {
        var i, insTarget, insValue, len, node;
        this.openCurrent();
        if (target != null) {
          target = getValue(target);
        }
        if (value != null) {
          value = getValue(value);
        }
        if (Array.isArray(target)) {
          for (i = 0, len = target.length; i < len; i++) {
            insTarget = target[i];
            this.instruction(insTarget);
          }
        } else if (isObject2(target)) {
          for (insTarget in target) {
            if (!hasProp.call(target, insTarget)) continue;
            insValue = target[insTarget];
            this.instruction(insTarget, insValue);
          }
        } else {
          if (isFunction2(value)) {
            value = value.apply();
          }
          node = new XMLProcessingInstruction2(this, target, value);
          this.onData(this.writer.processingInstruction(node, this.currentLevel + 1), this.currentLevel + 1);
        }
        return this;
      };
      XMLDocumentCB2.prototype.declaration = function(version, encoding, standalone) {
        var node;
        this.openCurrent();
        if (this.documentStarted) {
          throw new Error("declaration() must be the first node.");
        }
        node = new XMLDeclaration2(this, version, encoding, standalone);
        this.onData(this.writer.declaration(node, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      };
      XMLDocumentCB2.prototype.doctype = function(root2, pubID, sysID) {
        this.openCurrent();
        if (root2 == null) {
          throw new Error("Missing root node name.");
        }
        if (this.root) {
          throw new Error("dtd() must come before the root node.");
        }
        this.currentNode = new XMLDocType2(this, pubID, sysID);
        this.currentNode.rootNodeName = root2;
        this.currentNode.children = false;
        this.currentLevel++;
        this.openTags[this.currentLevel] = this.currentNode;
        return this;
      };
      XMLDocumentCB2.prototype.dtdElement = function(name, value) {
        var node;
        this.openCurrent();
        node = new XMLDTDElement2(this, name, value);
        this.onData(this.writer.dtdElement(node, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      };
      XMLDocumentCB2.prototype.attList = function(elementName, attributeName, attributeType, defaultValueType, defaultValue) {
        var node;
        this.openCurrent();
        node = new XMLDTDAttList2(this, elementName, attributeName, attributeType, defaultValueType, defaultValue);
        this.onData(this.writer.dtdAttList(node, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      };
      XMLDocumentCB2.prototype.entity = function(name, value) {
        var node;
        this.openCurrent();
        node = new XMLDTDEntity2(this, false, name, value);
        this.onData(this.writer.dtdEntity(node, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      };
      XMLDocumentCB2.prototype.pEntity = function(name, value) {
        var node;
        this.openCurrent();
        node = new XMLDTDEntity2(this, true, name, value);
        this.onData(this.writer.dtdEntity(node, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      };
      XMLDocumentCB2.prototype.notation = function(name, value) {
        var node;
        this.openCurrent();
        node = new XMLDTDNotation2(this, name, value);
        this.onData(this.writer.dtdNotation(node, this.currentLevel + 1), this.currentLevel + 1);
        return this;
      };
      XMLDocumentCB2.prototype.up = function() {
        if (this.currentLevel < 0) {
          throw new Error("The document node has no parent.");
        }
        if (this.currentNode) {
          if (this.currentNode.children) {
            this.closeNode(this.currentNode);
          } else {
            this.openNode(this.currentNode);
          }
          this.currentNode = null;
        } else {
          this.closeNode(this.openTags[this.currentLevel]);
        }
        delete this.openTags[this.currentLevel];
        this.currentLevel--;
        return this;
      };
      XMLDocumentCB2.prototype.end = function() {
        while (this.currentLevel >= 0) {
          this.up();
        }
        return this.onEnd();
      };
      XMLDocumentCB2.prototype.openCurrent = function() {
        if (this.currentNode) {
          this.currentNode.children = true;
          return this.openNode(this.currentNode);
        }
      };
      XMLDocumentCB2.prototype.openNode = function(node) {
        if (!node.isOpen) {
          if (!this.root && this.currentLevel === 0 && node instanceof XMLElement2) {
            this.root = node;
          }
          this.onData(this.writer.openNode(node, this.currentLevel), this.currentLevel);
          return node.isOpen = true;
        }
      };
      XMLDocumentCB2.prototype.closeNode = function(node) {
        if (!node.isClosed) {
          this.onData(this.writer.closeNode(node, this.currentLevel), this.currentLevel);
          return node.isClosed = true;
        }
      };
      XMLDocumentCB2.prototype.onData = function(chunk2, level) {
        this.documentStarted = true;
        return this.onDataCallback(chunk2, level + 1);
      };
      XMLDocumentCB2.prototype.onEnd = function() {
        this.documentCompleted = true;
        return this.onEndCallback();
      };
      XMLDocumentCB2.prototype.debugInfo = function(name) {
        if (name == null) {
          return "";
        } else {
          return "node: <" + name + ">";
        }
      };
      XMLDocumentCB2.prototype.ele = function() {
        return this.element.apply(this, arguments);
      };
      XMLDocumentCB2.prototype.nod = function(name, attributes, text) {
        return this.node(name, attributes, text);
      };
      XMLDocumentCB2.prototype.txt = function(value) {
        return this.text(value);
      };
      XMLDocumentCB2.prototype.dat = function(value) {
        return this.cdata(value);
      };
      XMLDocumentCB2.prototype.com = function(value) {
        return this.comment(value);
      };
      XMLDocumentCB2.prototype.ins = function(target, value) {
        return this.instruction(target, value);
      };
      XMLDocumentCB2.prototype.dec = function(version, encoding, standalone) {
        return this.declaration(version, encoding, standalone);
      };
      XMLDocumentCB2.prototype.dtd = function(root2, pubID, sysID) {
        return this.doctype(root2, pubID, sysID);
      };
      XMLDocumentCB2.prototype.e = function(name, attributes, text) {
        return this.element(name, attributes, text);
      };
      XMLDocumentCB2.prototype.n = function(name, attributes, text) {
        return this.node(name, attributes, text);
      };
      XMLDocumentCB2.prototype.t = function(value) {
        return this.text(value);
      };
      XMLDocumentCB2.prototype.d = function(value) {
        return this.cdata(value);
      };
      XMLDocumentCB2.prototype.c = function(value) {
        return this.comment(value);
      };
      XMLDocumentCB2.prototype.r = function(value) {
        return this.raw(value);
      };
      XMLDocumentCB2.prototype.i = function(target, value) {
        return this.instruction(target, value);
      };
      XMLDocumentCB2.prototype.att = function() {
        if (this.currentNode && this.currentNode instanceof XMLDocType2) {
          return this.attList.apply(this, arguments);
        } else {
          return this.attribute.apply(this, arguments);
        }
      };
      XMLDocumentCB2.prototype.a = function() {
        if (this.currentNode && this.currentNode instanceof XMLDocType2) {
          return this.attList.apply(this, arguments);
        } else {
          return this.attribute.apply(this, arguments);
        }
      };
      XMLDocumentCB2.prototype.ent = function(name, value) {
        return this.entity(name, value);
      };
      XMLDocumentCB2.prototype.pent = function(name, value) {
        return this.pEntity(name, value);
      };
      XMLDocumentCB2.prototype.not = function(name, value) {
        return this.notation(name, value);
      };
      return XMLDocumentCB2;
    })();
  }).call(XMLDocumentCB);
  return XMLDocumentCB$1.exports;
}
var XMLStreamWriter$1 = { exports: {} };
var XMLStreamWriter = XMLStreamWriter$1.exports;
var hasRequiredXMLStreamWriter;
function requireXMLStreamWriter() {
  if (hasRequiredXMLStreamWriter) return XMLStreamWriter$1.exports;
  hasRequiredXMLStreamWriter = 1;
  (function() {
    var XMLCData2, XMLComment2, XMLDTDAttList2, XMLDTDElement2, XMLDTDEntity2, XMLDTDNotation2, XMLDeclaration2, XMLDocType2, XMLDummy2, XMLElement2, XMLProcessingInstruction2, XMLRaw2, XMLText2, XMLWriterBase2, extend2 = function(child, parent) {
      for (var key in parent) {
        if (hasProp.call(parent, key)) child[key] = parent[key];
      }
      function ctor2() {
        this.constructor = child;
      }
      ctor2.prototype = parent.prototype;
      child.prototype = new ctor2();
      child.__super__ = parent.prototype;
      return child;
    }, hasProp = {}.hasOwnProperty;
    XMLDeclaration2 = requireXMLDeclaration();
    XMLDocType2 = requireXMLDocType();
    XMLCData2 = requireXMLCData();
    XMLComment2 = requireXMLComment();
    XMLElement2 = requireXMLElement();
    XMLRaw2 = requireXMLRaw();
    XMLText2 = requireXMLText();
    XMLProcessingInstruction2 = requireXMLProcessingInstruction();
    XMLDummy2 = requireXMLDummy();
    XMLDTDAttList2 = requireXMLDTDAttList();
    XMLDTDElement2 = requireXMLDTDElement();
    XMLDTDEntity2 = requireXMLDTDEntity();
    XMLDTDNotation2 = requireXMLDTDNotation();
    XMLWriterBase2 = requireXMLWriterBase();
    XMLStreamWriter$1.exports = (function(superClass) {
      extend2(XMLStreamWriter2, superClass);
      function XMLStreamWriter2(stream, options) {
        XMLStreamWriter2.__super__.constructor.call(this, options);
        this.stream = stream;
      }
      XMLStreamWriter2.prototype.document = function(doc) {
        var child, i, j, len, len1, ref, ref1, results2;
        ref = doc.children;
        for (i = 0, len = ref.length; i < len; i++) {
          child = ref[i];
          child.isLastRootNode = false;
        }
        doc.children[doc.children.length - 1].isLastRootNode = true;
        ref1 = doc.children;
        results2 = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          child = ref1[j];
          if (child instanceof XMLDummy2) {
            continue;
          }
          switch (false) {
            case !(child instanceof XMLDeclaration2):
              results2.push(this.declaration(child));
              break;
            case !(child instanceof XMLDocType2):
              results2.push(this.docType(child));
              break;
            case !(child instanceof XMLComment2):
              results2.push(this.comment(child));
              break;
            case !(child instanceof XMLProcessingInstruction2):
              results2.push(this.processingInstruction(child));
              break;
            default:
              results2.push(this.element(child));
          }
        }
        return results2;
      };
      XMLStreamWriter2.prototype.attribute = function(att) {
        return this.stream.write(" " + att.name + '="' + att.value + '"');
      };
      XMLStreamWriter2.prototype.cdata = function(node, level) {
        return this.stream.write(this.space(level) + "<![CDATA[" + node.text + "]]>" + this.endline(node));
      };
      XMLStreamWriter2.prototype.comment = function(node, level) {
        return this.stream.write(this.space(level) + "<!-- " + node.text + " -->" + this.endline(node));
      };
      XMLStreamWriter2.prototype.declaration = function(node, level) {
        this.stream.write(this.space(level));
        this.stream.write('<?xml version="' + node.version + '"');
        if (node.encoding != null) {
          this.stream.write(' encoding="' + node.encoding + '"');
        }
        if (node.standalone != null) {
          this.stream.write(' standalone="' + node.standalone + '"');
        }
        this.stream.write(this.spacebeforeslash + "?>");
        return this.stream.write(this.endline(node));
      };
      XMLStreamWriter2.prototype.docType = function(node, level) {
        var child, i, len, ref;
        level || (level = 0);
        this.stream.write(this.space(level));
        this.stream.write("<!DOCTYPE " + node.root().name);
        if (node.pubID && node.sysID) {
          this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
        } else if (node.sysID) {
          this.stream.write(' SYSTEM "' + node.sysID + '"');
        }
        if (node.children.length > 0) {
          this.stream.write(" [");
          this.stream.write(this.endline(node));
          ref = node.children;
          for (i = 0, len = ref.length; i < len; i++) {
            child = ref[i];
            switch (false) {
              case !(child instanceof XMLDTDAttList2):
                this.dtdAttList(child, level + 1);
                break;
              case !(child instanceof XMLDTDElement2):
                this.dtdElement(child, level + 1);
                break;
              case !(child instanceof XMLDTDEntity2):
                this.dtdEntity(child, level + 1);
                break;
              case !(child instanceof XMLDTDNotation2):
                this.dtdNotation(child, level + 1);
                break;
              case !(child instanceof XMLCData2):
                this.cdata(child, level + 1);
                break;
              case !(child instanceof XMLComment2):
                this.comment(child, level + 1);
                break;
              case !(child instanceof XMLProcessingInstruction2):
                this.processingInstruction(child, level + 1);
                break;
              default:
                throw new Error("Unknown DTD node type: " + child.constructor.name);
            }
          }
          this.stream.write("]");
        }
        this.stream.write(this.spacebeforeslash + ">");
        return this.stream.write(this.endline(node));
      };
      XMLStreamWriter2.prototype.element = function(node, level) {
        var att, child, i, len, name, ref, ref1, space;
        level || (level = 0);
        space = this.space(level);
        this.stream.write(space + "<" + node.name);
        ref = node.attributes;
        for (name in ref) {
          if (!hasProp.call(ref, name)) continue;
          att = ref[name];
          this.attribute(att);
        }
        if (node.children.length === 0 || node.children.every(function(e) {
          return e.value === "";
        })) {
          if (this.allowEmpty) {
            this.stream.write("></" + node.name + ">");
          } else {
            this.stream.write(this.spacebeforeslash + "/>");
          }
        } else if (this.pretty && node.children.length === 1 && node.children[0].value != null) {
          this.stream.write(">");
          this.stream.write(node.children[0].value);
          this.stream.write("</" + node.name + ">");
        } else {
          this.stream.write(">" + this.newline);
          ref1 = node.children;
          for (i = 0, len = ref1.length; i < len; i++) {
            child = ref1[i];
            switch (false) {
              case !(child instanceof XMLCData2):
                this.cdata(child, level + 1);
                break;
              case !(child instanceof XMLComment2):
                this.comment(child, level + 1);
                break;
              case !(child instanceof XMLElement2):
                this.element(child, level + 1);
                break;
              case !(child instanceof XMLRaw2):
                this.raw(child, level + 1);
                break;
              case !(child instanceof XMLText2):
                this.text(child, level + 1);
                break;
              case !(child instanceof XMLProcessingInstruction2):
                this.processingInstruction(child, level + 1);
                break;
              case !(child instanceof XMLDummy2):
                break;
              default:
                throw new Error("Unknown XML node type: " + child.constructor.name);
            }
          }
          this.stream.write(space + "</" + node.name + ">");
        }
        return this.stream.write(this.endline(node));
      };
      XMLStreamWriter2.prototype.processingInstruction = function(node, level) {
        this.stream.write(this.space(level) + "<?" + node.target);
        if (node.value) {
          this.stream.write(" " + node.value);
        }
        return this.stream.write(this.spacebeforeslash + "?>" + this.endline(node));
      };
      XMLStreamWriter2.prototype.raw = function(node, level) {
        return this.stream.write(this.space(level) + node.value + this.endline(node));
      };
      XMLStreamWriter2.prototype.text = function(node, level) {
        return this.stream.write(this.space(level) + node.value + this.endline(node));
      };
      XMLStreamWriter2.prototype.dtdAttList = function(node, level) {
        this.stream.write(this.space(level) + "<!ATTLIST " + node.elementName + " " + node.attributeName + " " + node.attributeType);
        if (node.defaultValueType !== "#DEFAULT") {
          this.stream.write(" " + node.defaultValueType);
        }
        if (node.defaultValue) {
          this.stream.write(' "' + node.defaultValue + '"');
        }
        return this.stream.write(this.spacebeforeslash + ">" + this.endline(node));
      };
      XMLStreamWriter2.prototype.dtdElement = function(node, level) {
        this.stream.write(this.space(level) + "<!ELEMENT " + node.name + " " + node.value);
        return this.stream.write(this.spacebeforeslash + ">" + this.endline(node));
      };
      XMLStreamWriter2.prototype.dtdEntity = function(node, level) {
        this.stream.write(this.space(level) + "<!ENTITY");
        if (node.pe) {
          this.stream.write(" %");
        }
        this.stream.write(" " + node.name);
        if (node.value) {
          this.stream.write(' "' + node.value + '"');
        } else {
          if (node.pubID && node.sysID) {
            this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
          } else if (node.sysID) {
            this.stream.write(' SYSTEM "' + node.sysID + '"');
          }
          if (node.nData) {
            this.stream.write(" NDATA " + node.nData);
          }
        }
        return this.stream.write(this.spacebeforeslash + ">" + this.endline(node));
      };
      XMLStreamWriter2.prototype.dtdNotation = function(node, level) {
        this.stream.write(this.space(level) + "<!NOTATION " + node.name);
        if (node.pubID && node.sysID) {
          this.stream.write(' PUBLIC "' + node.pubID + '" "' + node.sysID + '"');
        } else if (node.pubID) {
          this.stream.write(' PUBLIC "' + node.pubID + '"');
        } else if (node.sysID) {
          this.stream.write(' SYSTEM "' + node.sysID + '"');
        }
        return this.stream.write(this.spacebeforeslash + ">" + this.endline(node));
      };
      XMLStreamWriter2.prototype.endline = function(node) {
        if (!node.isLastRootNode) {
          return this.newline;
        } else {
          return "";
        }
      };
      return XMLStreamWriter2;
    })(XMLWriterBase2);
  }).call(XMLStreamWriter);
  return XMLStreamWriter$1.exports;
}
var hasRequiredLib$1;
function requireLib$1() {
  if (hasRequiredLib$1) return lib;
  hasRequiredLib$1 = 1;
  (function() {
    var XMLDocument2, XMLDocumentCB2, XMLStreamWriter2, XMLStringWriter2, assign, isFunction2, ref;
    ref = requireUtility(), assign = ref.assign, isFunction2 = ref.isFunction;
    XMLDocument2 = requireXMLDocument();
    XMLDocumentCB2 = requireXMLDocumentCB();
    XMLStringWriter2 = requireXMLStringWriter();
    XMLStreamWriter2 = requireXMLStreamWriter();
    lib.create = function(name, xmldec, doctype, options) {
      var doc, root2;
      if (name == null) {
        throw new Error("Root element needs a name.");
      }
      options = assign({}, xmldec, doctype, options);
      doc = new XMLDocument2(options);
      root2 = doc.element(name);
      if (!options.headless) {
        doc.declaration(options);
        if (options.pubID != null || options.sysID != null) {
          doc.doctype(options);
        }
      }
      return root2;
    };
    lib.begin = function(options, onData, onEnd) {
      var ref1;
      if (isFunction2(options)) {
        ref1 = [options, onData], onData = ref1[0], onEnd = ref1[1];
        options = {};
      }
      if (onData) {
        return new XMLDocumentCB2(options, onData, onEnd);
      } else {
        return new XMLDocument2(options);
      }
    };
    lib.stringWriter = function(options) {
      return new XMLStringWriter2(options);
    };
    lib.streamWriter = function(stream, options) {
      return new XMLStreamWriter2(stream, options);
    };
  }).call(lib);
  return lib;
}
var hasRequiredWriter;
function requireWriter() {
  if (hasRequiredWriter) return writer;
  hasRequiredWriter = 1;
  var _2 = require$$0;
  var xmlbuilder = requireLib$1();
  writer.writeString = writeString;
  function writeString(root2, namespaces) {
    var uriToPrefix = _2.invert(namespaces);
    var nodeWriters = {
      element: writeElement,
      text: writeTextNode
    };
    function writeNode(builder, node) {
      return nodeWriters[node.type](builder, node);
    }
    function writeElement(builder, element) {
      var elementBuilder = builder.element(mapElementName(element.name), element.attributes);
      element.children.forEach(function(child) {
        writeNode(elementBuilder, child);
      });
    }
    function mapElementName(name) {
      var longFormMatch = /^\{(.*)\}(.*)$/.exec(name);
      if (longFormMatch) {
        var prefix = uriToPrefix[longFormMatch[1]];
        return prefix + (prefix === "" ? "" : ":") + longFormMatch[2];
      } else {
        return name;
      }
    }
    function writeDocument(root3) {
      var builder = xmlbuilder.create(mapElementName(root3.name), {
        version: "1.0",
        encoding: "UTF-8",
        standalone: true
      });
      _2.forEach(namespaces, function(uri, prefix) {
        var key = "xmlns" + (prefix === "" ? "" : ":" + prefix);
        builder.attribute(key, uri);
      });
      root3.children.forEach(function(child) {
        writeNode(builder, child);
      });
      return builder.end();
    }
    return writeDocument(root2);
  }
  function writeTextNode(builder, node) {
    builder.text(node.value);
  }
  return writer;
}
var hasRequiredXml;
function requireXml() {
  if (hasRequiredXml) return xml;
  hasRequiredXml = 1;
  var nodes2 = requireNodes();
  xml.Element = nodes2.Element;
  xml.element = nodes2.element;
  xml.emptyElement = nodes2.emptyElement;
  xml.text = nodes2.text;
  xml.readString = requireReader().readString;
  xml.writeString = requireWriter().writeString;
  return xml;
}
var hasRequiredOfficeXmlReader;
function requireOfficeXmlReader() {
  if (hasRequiredOfficeXmlReader) return officeXmlReader;
  hasRequiredOfficeXmlReader = 1;
  var _2 = require$$0;
  var promises2 = requirePromises();
  var xml2 = requireXml();
  officeXmlReader.read = read;
  officeXmlReader.readXmlFromZipFile = readXmlFromZipFile;
  var xmlNamespaceMap = {
    // Transitional format
    "http://schemas.openxmlformats.org/wordprocessingml/2006/main": "w",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships": "r",
    "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing": "wp",
    "http://schemas.openxmlformats.org/drawingml/2006/main": "a",
    "http://schemas.openxmlformats.org/drawingml/2006/picture": "pic",
    // Strict format
    "http://purl.oclc.org/ooxml/wordprocessingml/main": "w",
    "http://purl.oclc.org/ooxml/officeDocument/relationships": "r",
    "http://purl.oclc.org/ooxml/drawingml/wordprocessingDrawing": "wp",
    "http://purl.oclc.org/ooxml/drawingml/main": "a",
    "http://purl.oclc.org/ooxml/drawingml/picture": "pic",
    // Common
    "http://schemas.openxmlformats.org/package/2006/content-types": "content-types",
    "http://schemas.openxmlformats.org/package/2006/relationships": "relationships",
    "http://schemas.openxmlformats.org/markup-compatibility/2006": "mc",
    "urn:schemas-microsoft-com:vml": "v",
    "urn:schemas-microsoft-com:office:word": "office-word",
    // [MS-DOCX]: Word Extensions to the Office Open XML (.docx) File Format
    // https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx/b839fe1f-e1ca-4fa6-8c26-5954d0abbccd
    "http://schemas.microsoft.com/office/word/2010/wordml": "wordml"
  };
  function read(xmlString) {
    return xml2.readString(xmlString, xmlNamespaceMap).then(function(document) {
      return collapseAlternateContent(document)[0];
    });
  }
  function readXmlFromZipFile(docxFile, path) {
    if (docxFile.exists(path)) {
      return docxFile.read(path, "utf-8").then(stripUtf8Bom).then(read);
    } else {
      return promises2.resolve(null);
    }
  }
  function stripUtf8Bom(xmlString) {
    return xmlString.replace(/^\uFEFF/g, "");
  }
  function collapseAlternateContent(node) {
    if (node.type === "element") {
      if (node.name === "mc:AlternateContent") {
        return node.firstOrEmpty("mc:Fallback").children;
      } else {
        node.children = _2.flatten(node.children.map(collapseAlternateContent, true));
        return [node];
      }
    } else {
      return [node];
    }
  }
  return officeXmlReader;
}
var bodyReader = {};
var dist = {};
var dingbats = {};
var hasRequiredDingbats;
function requireDingbats() {
  if (hasRequiredDingbats) return dingbats;
  hasRequiredDingbats = 1;
  Object.defineProperty(dingbats, "__esModule", { value: true });
  var dingbats$1 = {
    "SYMBOL": {
      32: 32,
      33: 33,
      34: 8704,
      35: 35,
      36: 8707,
      37: 37,
      38: 38,
      39: 8717,
      40: 40,
      41: 41,
      42: 42,
      43: 43,
      44: 44,
      45: 8722,
      46: 46,
      47: 47,
      48: 48,
      49: 49,
      50: 50,
      51: 51,
      52: 52,
      53: 53,
      54: 54,
      55: 55,
      56: 56,
      57: 57,
      58: 58,
      59: 59,
      60: 60,
      61: 61,
      62: 62,
      63: 63,
      64: 8773,
      65: 913,
      66: 914,
      67: 935,
      68: 916,
      69: 917,
      70: 934,
      71: 915,
      72: 919,
      73: 921,
      74: 977,
      75: 922,
      76: 923,
      77: 924,
      78: 925,
      79: 927,
      80: 928,
      81: 920,
      82: 929,
      83: 931,
      84: 932,
      85: 933,
      86: 962,
      87: 937,
      88: 926,
      89: 936,
      90: 918,
      91: 91,
      92: 8756,
      93: 93,
      94: 8869,
      95: 95,
      96: 8254,
      97: 945,
      98: 946,
      99: 967,
      100: 948,
      101: 949,
      102: 966,
      103: 947,
      104: 951,
      105: 953,
      106: 981,
      107: 954,
      108: 955,
      109: 956,
      110: 957,
      111: 959,
      112: 960,
      113: 952,
      114: 961,
      115: 963,
      116: 964,
      117: 965,
      118: 982,
      119: 969,
      120: 958,
      121: 968,
      122: 950,
      123: 123,
      124: 124,
      125: 125,
      126: 126,
      160: 8364,
      161: 978,
      162: 8242,
      163: 8804,
      164: 8260,
      165: 8734,
      166: 402,
      167: 9827,
      168: 9830,
      169: 9829,
      170: 9824,
      171: 8596,
      172: 8592,
      173: 8593,
      174: 8594,
      175: 8595,
      176: 176,
      177: 177,
      178: 8243,
      179: 8805,
      180: 215,
      181: 8733,
      182: 8706,
      183: 8226,
      184: 247,
      185: 8800,
      186: 8801,
      187: 8776,
      188: 8230,
      189: 9168,
      190: 9135,
      191: 8629,
      192: 8501,
      193: 8465,
      194: 8476,
      195: 8472,
      196: 8855,
      197: 8853,
      198: 8709,
      199: 8745,
      200: 8746,
      201: 8835,
      202: 8839,
      203: 8836,
      204: 8834,
      205: 8838,
      206: 8712,
      207: 8713,
      208: 8736,
      209: 8711,
      210: 174,
      211: 169,
      212: 8482,
      213: 8719,
      214: 8730,
      215: 8901,
      216: 172,
      217: 8743,
      218: 8744,
      219: 8660,
      220: 8656,
      221: 8657,
      222: 8658,
      223: 8659,
      224: 9674,
      225: 12296,
      226: 174,
      227: 169,
      228: 8482,
      229: 8721,
      230: 9115,
      231: 9116,
      232: 9117,
      233: 9121,
      234: 9122,
      235: 9123,
      236: 9127,
      237: 9128,
      238: 9129,
      239: 9130,
      240: 63743,
      241: 12297,
      242: 8747,
      243: 8992,
      244: 9134,
      245: 8993,
      246: 9118,
      247: 9119,
      248: 9120,
      249: 9124,
      250: 9125,
      251: 9126,
      252: 9131,
      253: 9132,
      254: 9133
    },
    "WEBDINGS": {
      32: 32,
      33: 128375,
      34: 128376,
      35: 128370,
      36: 128374,
      37: 127942,
      38: 127894,
      39: 128391,
      40: 128488,
      41: 128489,
      42: 128496,
      43: 128497,
      44: 127798,
      45: 127895,
      46: 128638,
      47: 128636,
      48: 128469,
      49: 128470,
      50: 128471,
      51: 9204,
      52: 9205,
      53: 9206,
      54: 9207,
      55: 9194,
      56: 9193,
      57: 9198,
      58: 9197,
      59: 9208,
      60: 9209,
      61: 9210,
      62: 128474,
      63: 128499,
      64: 128736,
      65: 127959,
      66: 127960,
      67: 127961,
      68: 127962,
      69: 127964,
      70: 127981,
      71: 127963,
      72: 127968,
      73: 127958,
      74: 127965,
      75: 128739,
      76: 128269,
      77: 127956,
      78: 128065,
      79: 128066,
      80: 127966,
      81: 127957,
      82: 128740,
      83: 127967,
      84: 128755,
      85: 128364,
      86: 128363,
      87: 128360,
      88: 128264,
      89: 127892,
      90: 127893,
      91: 128492,
      92: 128637,
      93: 128493,
      94: 128490,
      95: 128491,
      96: 11156,
      97: 10004,
      98: 128690,
      99: 11036,
      100: 128737,
      101: 128230,
      102: 128753,
      103: 11035,
      104: 128657,
      105: 128712,
      106: 128745,
      107: 128752,
      108: 128968,
      109: 128372,
      110: 11044,
      111: 128741,
      112: 128660,
      113: 128472,
      114: 128473,
      115: 10067,
      116: 128754,
      117: 128647,
      118: 128653,
      119: 9971,
      120: 10680,
      121: 8854,
      122: 128685,
      123: 128494,
      124: 9168,
      125: 128495,
      126: 128498,
      128: 128697,
      129: 128698,
      130: 128713,
      131: 128714,
      132: 128700,
      133: 128125,
      134: 127947,
      135: 9975,
      136: 127938,
      137: 127948,
      138: 127946,
      139: 127940,
      140: 127949,
      141: 127950,
      142: 128664,
      143: 128480,
      144: 128738,
      145: 128176,
      146: 127991,
      147: 128179,
      148: 128106,
      149: 128481,
      150: 128482,
      151: 128483,
      152: 10031,
      153: 128388,
      154: 128389,
      155: 128387,
      156: 128390,
      157: 128441,
      158: 128442,
      159: 128443,
      160: 128373,
      161: 128368,
      162: 128445,
      163: 128446,
      164: 128203,
      165: 128466,
      166: 128467,
      167: 128366,
      168: 128218,
      169: 128478,
      170: 128479,
      171: 128451,
      172: 128450,
      173: 128444,
      174: 127917,
      175: 127900,
      176: 127896,
      177: 127897,
      178: 127911,
      179: 128191,
      180: 127902,
      181: 128247,
      182: 127903,
      183: 127916,
      184: 128253,
      185: 128249,
      186: 128254,
      187: 128251,
      188: 127898,
      189: 127899,
      190: 128250,
      191: 128187,
      192: 128421,
      193: 128422,
      194: 128423,
      195: 128377,
      196: 127918,
      197: 128379,
      198: 128380,
      199: 128223,
      200: 128385,
      201: 128384,
      202: 128424,
      203: 128425,
      204: 128447,
      205: 128426,
      206: 128476,
      207: 128274,
      208: 128275,
      209: 128477,
      210: 128229,
      211: 128228,
      212: 128371,
      213: 127779,
      214: 127780,
      215: 127781,
      216: 127782,
      217: 9729,
      218: 127784,
      219: 127783,
      220: 127785,
      221: 127786,
      222: 127788,
      223: 127787,
      224: 127772,
      225: 127777,
      226: 128715,
      227: 128719,
      228: 127869,
      229: 127864,
      230: 128718,
      231: 128717,
      232: 9413,
      233: 9855,
      234: 128710,
      235: 128392,
      236: 127891,
      237: 128484,
      238: 128485,
      239: 128486,
      240: 128487,
      241: 128746,
      242: 128063,
      243: 128038,
      244: 128031,
      245: 128021,
      246: 128008,
      247: 128620,
      248: 128622,
      249: 128621,
      250: 128623,
      251: 128506,
      252: 127757,
      253: 127759,
      254: 127758,
      255: 128330
    },
    "WINGDINGS": {
      32: 32,
      33: 128393,
      34: 9986,
      35: 9985,
      36: 128083,
      37: 128365,
      38: 128366,
      39: 128367,
      40: 128383,
      41: 9990,
      42: 128386,
      43: 128387,
      44: 128234,
      45: 128235,
      46: 128236,
      47: 128237,
      48: 128448,
      49: 128449,
      50: 128462,
      51: 128463,
      52: 128464,
      53: 128452,
      54: 8987,
      55: 128430,
      56: 128432,
      57: 128434,
      58: 128435,
      59: 128436,
      60: 128427,
      61: 128428,
      62: 9991,
      63: 9997,
      64: 128398,
      65: 9996,
      66: 128399,
      67: 128077,
      68: 128078,
      69: 9756,
      70: 9758,
      71: 9757,
      72: 9759,
      73: 128400,
      74: 9786,
      75: 128528,
      76: 9785,
      77: 128163,
      78: 128369,
      79: 127987,
      80: 127985,
      81: 9992,
      82: 9788,
      83: 127778,
      84: 10052,
      85: 128326,
      86: 10014,
      87: 128328,
      88: 10016,
      89: 10017,
      90: 9770,
      91: 9775,
      92: 128329,
      93: 9784,
      94: 9800,
      95: 9801,
      96: 9802,
      97: 9803,
      98: 9804,
      99: 9805,
      100: 9806,
      101: 9807,
      102: 9808,
      103: 9809,
      104: 9810,
      105: 9811,
      106: 128624,
      107: 128629,
      108: 9899,
      109: 128318,
      110: 9724,
      111: 128911,
      112: 128912,
      113: 10065,
      114: 10066,
      115: 128927,
      116: 10731,
      117: 9670,
      118: 10070,
      119: 11049,
      120: 8999,
      121: 11193,
      122: 8984,
      123: 127989,
      124: 127990,
      125: 128630,
      126: 128631,
      127: 9647,
      128: 127243,
      129: 10112,
      130: 10113,
      131: 10114,
      132: 10115,
      133: 10116,
      134: 10117,
      135: 10118,
      136: 10119,
      137: 10120,
      138: 10121,
      139: 127244,
      140: 10122,
      141: 10123,
      142: 10124,
      143: 10125,
      144: 10126,
      145: 10127,
      146: 10128,
      147: 10129,
      148: 10130,
      149: 10131,
      150: 128610,
      151: 128608,
      152: 128609,
      153: 128611,
      154: 128606,
      155: 128604,
      156: 128605,
      157: 128607,
      158: 8729,
      159: 8226,
      160: 11037,
      161: 11096,
      162: 128902,
      163: 128904,
      164: 128906,
      165: 128907,
      166: 128319,
      167: 9642,
      168: 128910,
      169: 128961,
      170: 128965,
      171: 9733,
      172: 128971,
      173: 128975,
      174: 128979,
      175: 128977,
      176: 11216,
      177: 8982,
      178: 11214,
      179: 11215,
      180: 11217,
      181: 10026,
      182: 10032,
      183: 128336,
      184: 128337,
      185: 128338,
      186: 128339,
      187: 128340,
      188: 128341,
      189: 128342,
      190: 128343,
      191: 128344,
      192: 128345,
      193: 128346,
      194: 128347,
      195: 11184,
      196: 11185,
      197: 11186,
      198: 11187,
      199: 11188,
      200: 11189,
      201: 11190,
      202: 11191,
      203: 128618,
      204: 128619,
      205: 128597,
      206: 128596,
      207: 128599,
      208: 128598,
      209: 128592,
      210: 128593,
      211: 128594,
      212: 128595,
      213: 9003,
      214: 8998,
      215: 11160,
      216: 11162,
      217: 11161,
      218: 11163,
      219: 11144,
      220: 11146,
      221: 11145,
      222: 11147,
      223: 129128,
      224: 129130,
      225: 129129,
      226: 129131,
      227: 129132,
      228: 129133,
      229: 129135,
      230: 129134,
      231: 129144,
      232: 129146,
      233: 129145,
      234: 129147,
      235: 129148,
      236: 129149,
      237: 129151,
      238: 129150,
      239: 8678,
      240: 8680,
      241: 8679,
      242: 8681,
      243: 11012,
      244: 8691,
      245: 11009,
      246: 11008,
      247: 11011,
      248: 11010,
      249: 129196,
      250: 129197,
      251: 128502,
      252: 10003,
      253: 128503,
      254: 128505
    },
    "WINGDINGS 2": {
      32: 32,
      33: 128394,
      34: 128395,
      35: 128396,
      36: 128397,
      37: 9988,
      38: 9984,
      39: 128382,
      40: 128381,
      41: 128453,
      42: 128454,
      43: 128455,
      44: 128456,
      45: 128457,
      46: 128458,
      47: 128459,
      48: 128460,
      49: 128461,
      50: 128203,
      51: 128465,
      52: 128468,
      53: 128437,
      54: 128438,
      55: 128439,
      56: 128440,
      57: 128429,
      58: 128431,
      59: 128433,
      60: 128402,
      61: 128403,
      62: 128408,
      63: 128409,
      64: 128410,
      65: 128411,
      66: 128072,
      67: 128073,
      68: 128412,
      69: 128413,
      70: 128414,
      71: 128415,
      72: 128416,
      73: 128417,
      74: 128070,
      75: 128071,
      76: 128418,
      77: 128419,
      78: 128401,
      79: 128500,
      80: 128504,
      81: 128501,
      82: 9745,
      83: 11197,
      84: 9746,
      85: 11198,
      86: 11199,
      87: 128711,
      88: 10680,
      89: 128625,
      90: 128628,
      91: 128626,
      92: 128627,
      93: 8253,
      94: 128633,
      95: 128634,
      96: 128635,
      97: 128614,
      98: 128612,
      99: 128613,
      100: 128615,
      101: 128602,
      102: 128600,
      103: 128601,
      104: 128603,
      105: 9450,
      106: 9312,
      107: 9313,
      108: 9314,
      109: 9315,
      110: 9316,
      111: 9317,
      112: 9318,
      113: 9319,
      114: 9320,
      115: 9321,
      116: 9471,
      117: 10102,
      118: 10103,
      119: 10104,
      120: 10105,
      121: 10106,
      122: 10107,
      123: 10108,
      124: 10109,
      125: 10110,
      126: 10111,
      128: 9737,
      129: 127765,
      130: 9789,
      131: 9790,
      132: 11839,
      133: 10013,
      134: 128327,
      135: 128348,
      136: 128349,
      137: 128350,
      138: 128351,
      139: 128352,
      140: 128353,
      141: 128354,
      142: 128355,
      143: 128356,
      144: 128357,
      145: 128358,
      146: 128359,
      147: 128616,
      148: 128617,
      149: 8901,
      150: 128900,
      151: 10625,
      152: 9679,
      153: 9675,
      154: 128901,
      155: 128903,
      156: 128905,
      157: 8857,
      158: 10687,
      159: 128908,
      160: 128909,
      161: 9726,
      162: 9632,
      163: 9633,
      164: 128913,
      165: 128914,
      166: 128915,
      167: 128916,
      168: 9635,
      169: 128917,
      170: 128918,
      171: 128919,
      172: 128920,
      173: 11049,
      174: 11045,
      175: 9671,
      176: 128922,
      177: 9672,
      178: 128923,
      179: 128924,
      180: 128925,
      181: 128926,
      182: 11050,
      183: 11047,
      184: 9674,
      185: 128928,
      186: 9686,
      187: 9687,
      188: 11210,
      189: 11211,
      190: 11200,
      191: 11201,
      192: 11039,
      193: 11202,
      194: 11043,
      195: 11042,
      196: 11203,
      197: 11204,
      198: 128929,
      199: 128930,
      200: 128931,
      201: 128932,
      202: 128933,
      203: 128934,
      204: 128935,
      205: 128936,
      206: 128937,
      207: 128938,
      208: 128939,
      209: 128940,
      210: 128941,
      211: 128942,
      212: 128943,
      213: 128944,
      214: 128945,
      215: 128946,
      216: 128947,
      217: 128948,
      218: 128949,
      219: 128950,
      220: 128951,
      221: 128952,
      222: 128953,
      223: 128954,
      224: 128955,
      225: 128956,
      226: 128957,
      227: 128958,
      228: 128959,
      229: 128960,
      230: 128962,
      231: 128964,
      232: 128966,
      233: 128969,
      234: 128970,
      235: 10038,
      236: 128972,
      237: 128974,
      238: 128976,
      239: 128978,
      240: 10041,
      241: 128963,
      242: 128967,
      243: 10031,
      244: 128973,
      245: 128980,
      246: 11212,
      247: 11213,
      248: 8251,
      249: 8258
    },
    "WINGDINGS 3": {
      32: 32,
      33: 11104,
      34: 11106,
      35: 11105,
      36: 11107,
      37: 11110,
      38: 11111,
      39: 11113,
      40: 11112,
      41: 11120,
      42: 11122,
      43: 11121,
      44: 11123,
      45: 11126,
      46: 11128,
      47: 11131,
      48: 11133,
      49: 11108,
      50: 11109,
      51: 11114,
      52: 11116,
      53: 11115,
      54: 11117,
      55: 11085,
      56: 11168,
      57: 11169,
      58: 11170,
      59: 11171,
      60: 11172,
      61: 11173,
      62: 11174,
      63: 11175,
      64: 11152,
      65: 11153,
      66: 11154,
      67: 11155,
      68: 11136,
      69: 11139,
      70: 11134,
      71: 11135,
      72: 11140,
      73: 11142,
      74: 11141,
      75: 11143,
      76: 11151,
      77: 11149,
      78: 11150,
      79: 11148,
      80: 11118,
      81: 11119,
      82: 9099,
      83: 8996,
      84: 8963,
      85: 8997,
      86: 9251,
      87: 9085,
      88: 8682,
      89: 11192,
      90: 129184,
      91: 129185,
      92: 129186,
      93: 129187,
      94: 129188,
      95: 129189,
      96: 129190,
      97: 129191,
      98: 129192,
      99: 129193,
      100: 129194,
      101: 129195,
      102: 129104,
      103: 129106,
      104: 129105,
      105: 129107,
      106: 129108,
      107: 129109,
      108: 129111,
      109: 129110,
      110: 129112,
      111: 129113,
      112: 9650,
      113: 9660,
      114: 9651,
      115: 9661,
      116: 9664,
      117: 9654,
      118: 9665,
      119: 9655,
      120: 9699,
      121: 9698,
      122: 9700,
      123: 9701,
      124: 128896,
      125: 128898,
      126: 128897,
      128: 128899,
      129: 11205,
      130: 11206,
      131: 11207,
      132: 11208,
      133: 11164,
      134: 11166,
      135: 11165,
      136: 11167,
      137: 129040,
      138: 129042,
      139: 129041,
      140: 129043,
      141: 129044,
      142: 129046,
      143: 129045,
      144: 129047,
      145: 129048,
      146: 129050,
      147: 129049,
      148: 129051,
      149: 129052,
      150: 129054,
      151: 129053,
      152: 129055,
      153: 129024,
      154: 129026,
      155: 129025,
      156: 129027,
      157: 129028,
      158: 129030,
      159: 129029,
      160: 129031,
      161: 129032,
      162: 129034,
      163: 129033,
      164: 129035,
      165: 129056,
      166: 129058,
      167: 129060,
      168: 129062,
      169: 129064,
      170: 129066,
      171: 129068,
      172: 129180,
      173: 129181,
      174: 129182,
      175: 129183,
      176: 129070,
      177: 129072,
      178: 129074,
      179: 129076,
      180: 129078,
      181: 129080,
      182: 129082,
      183: 129081,
      184: 129083,
      185: 129176,
      186: 129178,
      187: 129177,
      188: 129179,
      189: 129084,
      190: 129086,
      191: 129085,
      192: 129087,
      193: 129088,
      194: 129090,
      195: 129089,
      196: 129091,
      197: 129092,
      198: 129094,
      199: 129093,
      200: 129095,
      201: 11176,
      202: 11177,
      203: 11178,
      204: 11179,
      205: 11180,
      206: 11181,
      207: 11182,
      208: 11183,
      209: 129120,
      210: 129122,
      211: 129121,
      212: 129123,
      213: 129124,
      214: 129125,
      215: 129127,
      216: 129126,
      217: 129136,
      218: 129138,
      219: 129137,
      220: 129139,
      221: 129140,
      222: 129141,
      223: 129143,
      224: 129142,
      225: 129152,
      226: 129154,
      227: 129153,
      228: 129155,
      229: 129156,
      230: 129157,
      231: 129159,
      232: 129158,
      233: 129168,
      234: 129170,
      235: 129169,
      236: 129171,
      237: 129172,
      238: 129174,
      239: 129173,
      240: 129175
    }
  };
  dingbats.default = dingbats$1;
  return dingbats;
}
var hasRequiredDist;
function requireDist() {
  if (hasRequiredDist) return dist;
  hasRequiredDist = 1;
  var __importDefault = dist && dist.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
  };
  Object.defineProperty(dist, "__esModule", { value: true });
  dist.hex = dist.dec = dist.codePoint = void 0;
  var dingbats_1 = __importDefault(requireDingbats());
  var fromCodePoint = String.fromCodePoint ? String.fromCodePoint : fromCodePointPolyfill;
  function codePoint(typeface, codePoint2) {
    var codePointMap = dingbats_1.default[typeface.toUpperCase()];
    if (codePointMap === void 0) {
      return void 0;
    }
    var unicodeCodePoint = codePointMap[codePoint2];
    if (unicodeCodePoint === void 0) {
      return void 0;
    }
    return {
      codePoint: unicodeCodePoint,
      string: fromCodePoint(unicodeCodePoint)
    };
  }
  dist.codePoint = codePoint;
  function dec(typeface, dec2) {
    return codePoint(typeface, parseInt(dec2, 10));
  }
  dist.dec = dec;
  function hex(typeface, hex2) {
    return codePoint(typeface, parseInt(hex2, 16));
  }
  dist.hex = hex;
  function fromCodePointPolyfill(codePoint2) {
    if (codePoint2 <= 65535) {
      return String.fromCharCode(codePoint2);
    } else {
      var highSurrogate = Math.floor((codePoint2 - 65536) / 1024) + 55296;
      var lowSurrogate = (codePoint2 - 65536) % 1024 + 56320;
      return String.fromCharCode(highSurrogate, lowSurrogate);
    }
  }
  return dist;
}
var transforms = {};
var hasRequiredTransforms;
function requireTransforms() {
  if (hasRequiredTransforms) return transforms;
  hasRequiredTransforms = 1;
  var _2 = require$$0;
  transforms.paragraph = paragraph;
  transforms.run = run;
  transforms._elements = elements;
  transforms._elementsOfType = elementsOfType;
  transforms.getDescendantsOfType = getDescendantsOfType;
  transforms.getDescendants = getDescendants;
  function paragraph(transform) {
    return elementsOfType("paragraph", transform);
  }
  function run(transform) {
    return elementsOfType("run", transform);
  }
  function elementsOfType(elementType, transform) {
    return elements(function(element) {
      if (element.type === elementType) {
        return transform(element);
      } else {
        return element;
      }
    });
  }
  function elements(transform) {
    return function transformElement(element) {
      if (element.children) {
        var children = _2.map(element.children, transformElement);
        element = _2.extend(element, { children });
      }
      return transform(element);
    };
  }
  function getDescendantsOfType(element, type) {
    return getDescendants(element).filter(function(descendant) {
      return descendant.type === type;
    });
  }
  function getDescendants(element) {
    var descendants = [];
    visitDescendants(element, function(descendant) {
      descendants.push(descendant);
    });
    return descendants;
  }
  function visitDescendants(element, visit) {
    if (element.children) {
      element.children.forEach(function(child) {
        visitDescendants(child, visit);
        visit(child);
      });
    }
  }
  return transforms;
}
var uris = {};
var hasRequiredUris;
function requireUris() {
  if (hasRequiredUris) return uris;
  hasRequiredUris = 1;
  uris.uriToZipEntryName = uriToZipEntryName;
  uris.replaceFragment = replaceFragment;
  function uriToZipEntryName(base, uri) {
    if (uri.charAt(0) === "/") {
      return uri.substr(1);
    } else {
      return base + "/" + uri;
    }
  }
  function replaceFragment(uri, fragment) {
    var hashIndex = uri.indexOf("#");
    if (hashIndex !== -1) {
      uri = uri.substring(0, hashIndex);
    }
    return uri + "#" + fragment;
  }
  return uris;
}
var hasRequiredBodyReader;
function requireBodyReader() {
  if (hasRequiredBodyReader) return bodyReader;
  hasRequiredBodyReader = 1;
  bodyReader.createBodyReader = createBodyReader;
  bodyReader._readNumberingProperties = readNumberingProperties;
  var dingbatToUnicode = requireDist();
  var _2 = require$$0;
  var documents2 = requireDocuments();
  var Result = requireResults().Result;
  var warning = requireResults().warning;
  var xml2 = requireXml();
  var transforms2 = requireTransforms();
  var uris2 = requireUris();
  function createBodyReader(options) {
    return {
      readXmlElement: function(element) {
        return new BodyReader(options).readXmlElement(element);
      },
      readXmlElements: function(elements) {
        return new BodyReader(options).readXmlElements(elements);
      }
    };
  }
  function BodyReader(options) {
    var complexFieldStack = [];
    var currentInstrText = [];
    var deletedParagraphContents = [];
    var relationships = options.relationships;
    var contentTypes = options.contentTypes;
    var docxFile = options.docxFile;
    var files2 = options.files;
    var numbering = options.numbering;
    var styles = options.styles;
    function readXmlElements(elements) {
      var results2 = elements.map(readXmlElement);
      return combineResults(results2);
    }
    function readXmlElement(element) {
      if (element.type === "element") {
        var handler = xmlElementReaders[element.name];
        if (handler) {
          return handler(element);
        } else if (!Object.prototype.hasOwnProperty.call(ignoreElements, element.name)) {
          var message = warning("An unrecognised element was ignored: " + element.name);
          return emptyResultWithMessages([message]);
        }
      }
      return emptyResult();
    }
    function readParagraphProperties(element) {
      return readParagraphStyle(element).map(function(style) {
        return {
          type: "paragraphProperties",
          styleId: style.styleId,
          styleName: style.name,
          alignment: element.firstOrEmpty("w:jc").attributes["w:val"],
          numbering: readNumberingProperties(style.styleId, element.firstOrEmpty("w:numPr"), numbering),
          indent: readParagraphIndent(element.firstOrEmpty("w:ind"))
        };
      });
    }
    function readParagraphIndent(element) {
      return {
        start: element.attributes["w:start"] || element.attributes["w:left"],
        end: element.attributes["w:end"] || element.attributes["w:right"],
        firstLine: element.attributes["w:firstLine"],
        hanging: element.attributes["w:hanging"]
      };
    }
    function readRunProperties(element) {
      return readRunStyle(element).map(function(style) {
        var fontSizeString = element.firstOrEmpty("w:sz").attributes["w:val"];
        var fontSize = /^[0-9]+$/.test(fontSizeString) ? parseInt(fontSizeString, 10) / 2 : null;
        return {
          type: "runProperties",
          styleId: style.styleId,
          styleName: style.name,
          verticalAlignment: element.firstOrEmpty("w:vertAlign").attributes["w:val"],
          font: element.firstOrEmpty("w:rFonts").attributes["w:ascii"],
          fontSize,
          isBold: readBooleanElement(element.first("w:b")),
          isUnderline: readUnderline(element.first("w:u")),
          isItalic: readBooleanElement(element.first("w:i")),
          isStrikethrough: readBooleanElement(element.first("w:strike")),
          isAllCaps: readBooleanElement(element.first("w:caps")),
          isSmallCaps: readBooleanElement(element.first("w:smallCaps")),
          highlight: readHighlightValue(element.firstOrEmpty("w:highlight").attributes["w:val"])
        };
      });
    }
    function readUnderline(element) {
      if (element) {
        var value = element.attributes["w:val"];
        return value !== void 0 && value !== "false" && value !== "0" && value !== "none";
      } else {
        return false;
      }
    }
    function readBooleanElement(element) {
      if (element) {
        var value = element.attributes["w:val"];
        return value !== "false" && value !== "0";
      } else {
        return false;
      }
    }
    function readBooleanAttributeValue(value) {
      return value !== "false" && value !== "0";
    }
    function readHighlightValue(value) {
      if (!value || value === "none") {
        return null;
      } else {
        return value;
      }
    }
    function readParagraphStyle(element) {
      return readStyle(element, "w:pStyle", "Paragraph", styles.findParagraphStyleById);
    }
    function readRunStyle(element) {
      return readStyle(element, "w:rStyle", "Run", styles.findCharacterStyleById);
    }
    function readTableStyle(element) {
      return readStyle(element, "w:tblStyle", "Table", styles.findTableStyleById);
    }
    function readStyle(element, styleTagName, styleType, findStyleById) {
      var messages = [];
      var styleElement = element.first(styleTagName);
      var styleId = null;
      var name = null;
      if (styleElement) {
        styleId = styleElement.attributes["w:val"];
        if (styleId) {
          var style = findStyleById(styleId);
          if (style) {
            name = style.name;
          } else {
            messages.push(undefinedStyleWarning(styleType, styleId));
          }
        }
      }
      return elementResultWithMessages({ styleId, name }, messages);
    }
    function readFldChar(element) {
      var type = element.attributes["w:fldCharType"];
      if (type === "begin") {
        complexFieldStack.push({ type: "begin", fldChar: element });
        currentInstrText = [];
      } else if (type === "end") {
        if (complexFieldStack.length === 0) {
          return emptyResultWithMessages([warning(
            "Ignoring complex field end character without corresponding start character"
          )]);
        }
        var complexFieldEnd = complexFieldStack.pop();
        if (complexFieldEnd.type === "begin") {
          complexFieldEnd = parseCurrentInstrText(complexFieldEnd);
        }
        if (complexFieldEnd.type === "checkbox") {
          return elementResult(documents2.checkbox({
            checked: complexFieldEnd.checked
          }));
        }
      } else if (type === "separate") {
        if (complexFieldStack.length === 0) {
          return emptyResultWithMessages([warning(
            "Ignoring complex field separator character without corresponding start character"
          )]);
        }
        var complexFieldSeparate = complexFieldStack.pop();
        var complexField = parseCurrentInstrText(complexFieldSeparate);
        complexFieldStack.push(complexField);
      }
      return emptyResult();
    }
    function currentHyperlinkOptions() {
      var topHyperlink = _2.last(complexFieldStack.filter(function(complexField) {
        return complexField.type === "hyperlink";
      }));
      return topHyperlink ? topHyperlink.options : null;
    }
    function parseCurrentInstrText(complexField) {
      return parseInstrText(
        currentInstrText.join(""),
        complexField.type === "begin" ? complexField.fldChar : xml2.emptyElement
      );
    }
    function parseInstrText(instrText, fldChar) {
      var linkResult = /^\s*HYPERLINK\s+(\\l\s+)?(?:"(.*)"|([^\\]\S*))/.exec(instrText);
      if (linkResult) {
        var location = linkResult[2] === void 0 ? linkResult[3] : linkResult[2];
        var options2 = linkResult[1] === void 0 ? { href: location } : { anchor: location };
        return { type: "hyperlink", options: options2 };
      }
      var checkboxResult = /\s*FORMCHECKBOX\s*/.exec(instrText);
      if (checkboxResult) {
        var checkboxElement = fldChar.firstOrEmpty("w:ffData").firstOrEmpty("w:checkBox");
        var checkedElement = checkboxElement.first("w:checked");
        var checked = checkedElement == null ? readBooleanElement(checkboxElement.first("w:default")) : readBooleanElement(checkedElement);
        return { type: "checkbox", checked };
      }
      return { type: "unknown" };
    }
    function readInstrText(element) {
      currentInstrText.push(element.text());
      return emptyResult();
    }
    function readSymbol(element) {
      var font = element.attributes["w:font"];
      var char = element.attributes["w:char"];
      var unicodeCharacter = dingbatToUnicode.hex(font, char);
      if (unicodeCharacter == null && /^F0..$/.test(char)) {
        unicodeCharacter = dingbatToUnicode.hex(font, char.substring(2));
      }
      if (unicodeCharacter == null) {
        return emptyResultWithMessages([warning(
          "A w:sym element with an unsupported character was ignored: char " + char + " in font " + font
        )]);
      } else {
        return elementResult(new documents2.Text(unicodeCharacter.string));
      }
    }
    function noteReferenceReader(noteType) {
      return function(element) {
        var noteId = element.attributes["w:id"];
        return elementResult(new documents2.NoteReference({
          noteType,
          noteId
        }));
      };
    }
    function readCommentReference(element) {
      return elementResult(documents2.commentReference({
        commentId: element.attributes["w:id"]
      }));
    }
    function readChildElements(element) {
      return readXmlElements(element.children);
    }
    var xmlElementReaders = {
      "w:p": function(element) {
        var paragraphPropertiesElement = element.firstOrEmpty("w:pPr");
        var isDeleted = !!paragraphPropertiesElement.firstOrEmpty("w:rPr").first("w:del");
        if (isDeleted) {
          element.children.forEach(function(child) {
            deletedParagraphContents.push(child);
          });
          return emptyResult();
        } else {
          var childrenXml = element.children;
          if (deletedParagraphContents.length > 0) {
            childrenXml = deletedParagraphContents.concat(childrenXml);
            deletedParagraphContents = [];
          }
          return ReadResult.map(
            readParagraphProperties(paragraphPropertiesElement),
            readXmlElements(childrenXml),
            function(properties, children) {
              return new documents2.Paragraph(children, properties);
            }
          ).insertExtra();
        }
      },
      "w:r": function(element) {
        return ReadResult.map(
          readRunProperties(element.firstOrEmpty("w:rPr")),
          readXmlElements(element.children),
          function(properties, children) {
            var hyperlinkOptions = currentHyperlinkOptions();
            if (hyperlinkOptions !== null) {
              children = [new documents2.Hyperlink(children, hyperlinkOptions)];
            }
            return new documents2.Run(children, properties);
          }
        );
      },
      "w:fldChar": readFldChar,
      "w:instrText": readInstrText,
      "w:t": function(element) {
        return elementResult(new documents2.Text(element.text()));
      },
      "w:tab": function(element) {
        return elementResult(new documents2.Tab());
      },
      "w:noBreakHyphen": function() {
        return elementResult(new documents2.Text("‑"));
      },
      "w:softHyphen": function(element) {
        return elementResult(new documents2.Text("­"));
      },
      "w:sym": readSymbol,
      "w:hyperlink": function(element) {
        var relationshipId = element.attributes["r:id"];
        var anchor = element.attributes["w:anchor"];
        return readXmlElements(element.children).map(function(children) {
          function create2(options2) {
            var targetFrame = element.attributes["w:tgtFrame"] || null;
            return new documents2.Hyperlink(
              children,
              _2.extend({ targetFrame }, options2)
            );
          }
          if (relationshipId) {
            var href = relationships.findTargetByRelationshipId(relationshipId);
            if (anchor) {
              href = uris2.replaceFragment(href, anchor);
            }
            return create2({ href });
          } else if (anchor) {
            return create2({ anchor });
          } else {
            return children;
          }
        });
      },
      "w:tbl": readTable,
      "w:tr": readTableRow,
      "w:tc": readTableCell,
      "w:footnoteReference": noteReferenceReader("footnote"),
      "w:endnoteReference": noteReferenceReader("endnote"),
      "w:commentReference": readCommentReference,
      "w:br": function(element) {
        var breakType = element.attributes["w:type"];
        if (breakType == null || breakType === "textWrapping") {
          return elementResult(documents2.lineBreak);
        } else if (breakType === "page") {
          return elementResult(documents2.pageBreak);
        } else if (breakType === "column") {
          return elementResult(documents2.columnBreak);
        } else {
          return emptyResultWithMessages([warning("Unsupported break type: " + breakType)]);
        }
      },
      "w:bookmarkStart": function(element) {
        var name = element.attributes["w:name"];
        if (name === "_GoBack") {
          return emptyResult();
        } else {
          return elementResult(new documents2.BookmarkStart({ name }));
        }
      },
      "mc:AlternateContent": function(element) {
        return readChildElements(element.firstOrEmpty("mc:Fallback"));
      },
      "w:sdt": function(element) {
        var contentResult = readXmlElements(element.firstOrEmpty("w:sdtContent").children);
        return contentResult.map(function(content) {
          var checkbox = element.firstOrEmpty("w:sdtPr").first("wordml:checkbox");
          if (checkbox) {
            var checkedElement = checkbox.first("wordml:checked");
            var isChecked = !!checkedElement && readBooleanAttributeValue(
              checkedElement.attributes["wordml:val"]
            );
            var documentCheckbox = documents2.checkbox({
              checked: isChecked
            });
            var hasCheckbox = false;
            var replacedContent = content.map(transforms2._elementsOfType(
              documents2.types.text,
              function(text) {
                if (text.value.length > 0 && !hasCheckbox) {
                  hasCheckbox = true;
                  return documentCheckbox;
                } else {
                  return text;
                }
              }
            ));
            if (hasCheckbox) {
              return replacedContent;
            } else {
              return documentCheckbox;
            }
          } else {
            return content;
          }
        });
      },
      "w:customXml": readChildElements,
      "w:ins": readChildElements,
      "w:moveFromRangeEnd": readChildElements,
      "w:moveFromRangeStart": readChildElements,
      "w:moveTo": readChildElements,
      "w:moveToRangeEnd": readChildElements,
      "w:moveToRangeStart": readChildElements,
      "w:object": readChildElements,
      "w:smartTag": readChildElements,
      "w:drawing": readChildElements,
      "w:pict": function(element) {
        return readChildElements(element).toExtra();
      },
      "v:roundrect": readChildElements,
      "v:shape": readChildElements,
      "v:textbox": readChildElements,
      "w:txbxContent": readChildElements,
      "wp:inline": readDrawingElement,
      "wp:anchor": readDrawingElement,
      "v:imagedata": readImageData,
      "v:group": readChildElements,
      "v:rect": readChildElements
    };
    return {
      readXmlElement,
      readXmlElements
    };
    function readTable(element) {
      var propertiesResult = readTableProperties(element.firstOrEmpty("w:tblPr"));
      return readXmlElements(element.children).flatMap(calculateRowSpans).flatMap(function(children) {
        return propertiesResult.map(function(properties) {
          return documents2.Table(children, properties);
        });
      });
    }
    function readTableProperties(element) {
      return readTableStyle(element).map(function(style) {
        return {
          styleId: style.styleId,
          styleName: style.name
        };
      });
    }
    function readTableRow(element) {
      var properties = element.firstOrEmpty("w:trPr");
      var isDeleted = !!properties.first("w:del");
      if (isDeleted) {
        return emptyResult();
      }
      var isHeader = !!properties.first("w:tblHeader");
      return readXmlElements(element.children).map(function(children) {
        return documents2.TableRow(children, { isHeader });
      });
    }
    function readTableCell(element) {
      return readXmlElements(element.children).map(function(children) {
        var properties = element.firstOrEmpty("w:tcPr");
        var gridSpan = properties.firstOrEmpty("w:gridSpan").attributes["w:val"];
        var colSpan = gridSpan ? parseInt(gridSpan, 10) : 1;
        var cell = documents2.TableCell(children, { colSpan });
        cell._vMerge = readVMerge(properties);
        return cell;
      });
    }
    function readVMerge(properties) {
      var element = properties.first("w:vMerge");
      if (element) {
        var val = element.attributes["w:val"];
        return val === "continue" || !val;
      } else {
        return null;
      }
    }
    function calculateRowSpans(rows) {
      var unexpectedNonRows = _2.any(rows, function(row) {
        return row.type !== documents2.types.tableRow;
      });
      if (unexpectedNonRows) {
        removeVMergeProperties(rows);
        return elementResultWithMessages(rows, [warning(
          "unexpected non-row element in table, cell merging may be incorrect"
        )]);
      }
      var unexpectedNonCells = _2.any(rows, function(row) {
        return _2.any(row.children, function(cell) {
          return cell.type !== documents2.types.tableCell;
        });
      });
      if (unexpectedNonCells) {
        removeVMergeProperties(rows);
        return elementResultWithMessages(rows, [warning(
          "unexpected non-cell element in table row, cell merging may be incorrect"
        )]);
      }
      var columns = {};
      rows.forEach(function(row) {
        var cellIndex = 0;
        row.children.forEach(function(cell) {
          if (cell._vMerge && columns[cellIndex]) {
            columns[cellIndex].rowSpan++;
          } else {
            columns[cellIndex] = cell;
            cell._vMerge = false;
          }
          cellIndex += cell.colSpan;
        });
      });
      rows.forEach(function(row) {
        row.children = row.children.filter(function(cell) {
          return !cell._vMerge;
        });
        row.children.forEach(function(cell) {
          delete cell._vMerge;
        });
      });
      return elementResult(rows);
    }
    function removeVMergeProperties(rows) {
      rows.forEach(function(row) {
        var cells = transforms2.getDescendantsOfType(row, documents2.types.tableCell);
        cells.forEach(function(cell) {
          delete cell._vMerge;
        });
      });
    }
    function readDrawingElement(element) {
      var blips = element.getElementsByTagName("a:graphic").getElementsByTagName("a:graphicData").getElementsByTagName("pic:pic").getElementsByTagName("pic:blipFill").getElementsByTagName("a:blip");
      return combineResults(blips.map(readBlip.bind(null, element)));
    }
    function readBlip(element, blip) {
      var propertiesElement = element.firstOrEmpty("wp:docPr");
      var properties = propertiesElement.attributes;
      var altText = isBlank(properties.descr) ? properties.title : properties.descr;
      var blipImageFile = findBlipImageFile(blip);
      if (blipImageFile === null) {
        return emptyResultWithMessages([warning("Could not find image file for a:blip element")]);
      }
      return readImage(blipImageFile, altText).map(function(imageElement) {
        var hlinkClickElement = propertiesElement.firstOrEmpty("a:hlinkClick");
        var relationshipId = hlinkClickElement.attributes["r:id"];
        if (relationshipId) {
          var href = relationships.findTargetByRelationshipId(relationshipId);
          return new documents2.Hyperlink([imageElement], { href });
        } else {
          return imageElement;
        }
      });
    }
    function isBlank(value) {
      return value == null || /^\s*$/.test(value);
    }
    function findBlipImageFile(blip) {
      var embedRelationshipId = blip.attributes["r:embed"];
      var linkRelationshipId = blip.attributes["r:link"];
      if (embedRelationshipId) {
        return findEmbeddedImageFile(embedRelationshipId);
      } else if (linkRelationshipId) {
        var imagePath = relationships.findTargetByRelationshipId(linkRelationshipId);
        return {
          path: imagePath,
          read: files2.read.bind(files2, imagePath)
        };
      } else {
        return null;
      }
    }
    function readImageData(element) {
      var relationshipId = element.attributes["r:id"];
      if (relationshipId) {
        return readImage(
          findEmbeddedImageFile(relationshipId),
          element.attributes["o:title"]
        );
      } else {
        return emptyResultWithMessages([warning("A v:imagedata element without a relationship ID was ignored")]);
      }
    }
    function findEmbeddedImageFile(relationshipId) {
      var path = uris2.uriToZipEntryName("word", relationships.findTargetByRelationshipId(relationshipId));
      return {
        path,
        read: docxFile.read.bind(docxFile, path)
      };
    }
    function readImage(imageFile, altText) {
      var contentType = contentTypes.findContentType(imageFile.path);
      var image = documents2.Image({
        readImage: imageFile.read,
        altText,
        contentType
      });
      var warnings = supportedImageTypes[contentType] ? [] : warning("Image of type " + contentType + " is unlikely to display in web browsers");
      return elementResultWithMessages(image, warnings);
    }
    function undefinedStyleWarning(type, styleId) {
      return warning(
        type + " style with ID " + styleId + " was referenced but not defined in the document"
      );
    }
  }
  function readNumberingProperties(styleId, element, numbering) {
    var level = element.firstOrEmpty("w:ilvl").attributes["w:val"];
    var numId = element.firstOrEmpty("w:numId").attributes["w:val"];
    if (level !== void 0 && numId !== void 0) {
      return numbering.findLevel(numId, level);
    }
    if (styleId != null) {
      var levelByStyleId = numbering.findLevelByParagraphStyleId(styleId);
      if (levelByStyleId != null) {
        return levelByStyleId;
      }
    }
    if (numId !== void 0) {
      return numbering.findLevel(numId, "0");
    }
    return null;
  }
  var supportedImageTypes = {
    "image/png": true,
    "image/gif": true,
    "image/jpeg": true,
    "image/svg+xml": true,
    "image/tiff": true
  };
  var ignoreElements = {
    "office-word:wrap": true,
    "v:shadow": true,
    "v:shapetype": true,
    "w:annotationRef": true,
    "w:bookmarkEnd": true,
    "w:sectPr": true,
    "w:proofErr": true,
    "w:lastRenderedPageBreak": true,
    "w:commentRangeStart": true,
    "w:commentRangeEnd": true,
    "w:del": true,
    "w:footnoteRef": true,
    "w:endnoteRef": true,
    "w:moveFrom": true,
    "w:pPr": true,
    "w:rPr": true,
    "w:tblPr": true,
    "w:tblGrid": true,
    "w:trPr": true,
    "w:tcPr": true
  };
  function emptyResultWithMessages(messages) {
    return new ReadResult(null, null, messages);
  }
  function emptyResult() {
    return new ReadResult(null);
  }
  function elementResult(element) {
    return new ReadResult(element);
  }
  function elementResultWithMessages(element, messages) {
    return new ReadResult(element, null, messages);
  }
  function ReadResult(element, extra, messages) {
    this.value = element || [];
    this.extra = extra || [];
    this._result = new Result({
      element: this.value,
      extra
    }, messages);
    this.messages = this._result.messages;
  }
  ReadResult.prototype.toExtra = function() {
    return new ReadResult(null, joinElements(this.extra, this.value), this.messages);
  };
  ReadResult.prototype.insertExtra = function() {
    var extra = this.extra;
    if (extra && extra.length) {
      return new ReadResult(joinElements(this.value, extra), null, this.messages);
    } else {
      return this;
    }
  };
  ReadResult.prototype.map = function(func) {
    var result2 = this._result.map(function(value) {
      return func(value.element);
    });
    return new ReadResult(result2.value, this.extra, result2.messages);
  };
  ReadResult.prototype.flatMap = function(func) {
    var result2 = this._result.flatMap(function(value) {
      return func(value.element)._result;
    });
    return new ReadResult(result2.value.element, joinElements(this.extra, result2.value.extra), result2.messages);
  };
  ReadResult.map = function(first2, second, func) {
    return new ReadResult(
      func(first2.value, second.value),
      joinElements(first2.extra, second.extra),
      first2.messages.concat(second.messages)
    );
  };
  function combineResults(results2) {
    var result2 = Result.combine(_2.pluck(results2, "_result"));
    return new ReadResult(
      _2.flatten(_2.pluck(result2.value, "element")),
      _2.filter(_2.flatten(_2.pluck(result2.value, "extra")), identity2),
      result2.messages
    );
  }
  function joinElements(first2, second) {
    return _2.flatten([first2, second]);
  }
  function identity2(value) {
    return value;
  }
  return bodyReader;
}
var documentXmlReader = {};
var hasRequiredDocumentXmlReader;
function requireDocumentXmlReader() {
  if (hasRequiredDocumentXmlReader) return documentXmlReader;
  hasRequiredDocumentXmlReader = 1;
  documentXmlReader.DocumentXmlReader = DocumentXmlReader;
  var documents2 = requireDocuments();
  var Result = requireResults().Result;
  function DocumentXmlReader(options) {
    var bodyReader2 = options.bodyReader;
    function convertXmlToDocument(element) {
      var body = element.first("w:body");
      if (body == null) {
        throw new Error("Could not find the body element: are you sure this is a docx file?");
      }
      var result2 = bodyReader2.readXmlElements(body.children).map(function(children) {
        return new documents2.Document(children, {
          notes: options.notes,
          comments: options.comments
        });
      });
      return new Result(result2.value, result2.messages);
    }
    return {
      convertXmlToDocument
    };
  }
  return documentXmlReader;
}
var relationshipsReader = {};
var hasRequiredRelationshipsReader;
function requireRelationshipsReader() {
  if (hasRequiredRelationshipsReader) return relationshipsReader;
  hasRequiredRelationshipsReader = 1;
  relationshipsReader.readRelationships = readRelationships;
  relationshipsReader.defaultValue = new Relationships([]);
  relationshipsReader.Relationships = Relationships;
  function readRelationships(element) {
    var relationships = [];
    element.children.forEach(function(child) {
      if (child.name === "relationships:Relationship") {
        var relationship = {
          relationshipId: child.attributes.Id,
          target: child.attributes.Target,
          type: child.attributes.Type
        };
        relationships.push(relationship);
      }
    });
    return new Relationships(relationships);
  }
  function Relationships(relationships) {
    var targetsByRelationshipId = /* @__PURE__ */ Object.create(null);
    relationships.forEach(function(relationship) {
      targetsByRelationshipId[relationship.relationshipId] = relationship.target;
    });
    var targetsByType = /* @__PURE__ */ Object.create(null);
    relationships.forEach(function(relationship) {
      if (!targetsByType[relationship.type]) {
        targetsByType[relationship.type] = [];
      }
      targetsByType[relationship.type].push(relationship.target);
    });
    return {
      findTargetByRelationshipId: function(relationshipId) {
        return targetsByRelationshipId[relationshipId];
      },
      findTargetsByType: function(type) {
        return targetsByType[type] || [];
      }
    };
  }
  return relationshipsReader;
}
var contentTypesReader = {};
var hasRequiredContentTypesReader;
function requireContentTypesReader() {
  if (hasRequiredContentTypesReader) return contentTypesReader;
  hasRequiredContentTypesReader = 1;
  contentTypesReader.readContentTypesFromXml = readContentTypesFromXml;
  var fallbackContentTypes = {
    "png": "png",
    "gif": "gif",
    "jpeg": "jpeg",
    "jpg": "jpeg",
    "tif": "tiff",
    "tiff": "tiff",
    "bmp": "bmp"
  };
  contentTypesReader.defaultContentTypes = contentTypes({}, {});
  function readContentTypesFromXml(element) {
    var extensionDefaults = /* @__PURE__ */ Object.create(null);
    var overrides = /* @__PURE__ */ Object.create(null);
    element.children.forEach(function(child) {
      if (child.name === "content-types:Default") {
        extensionDefaults[child.attributes.Extension] = child.attributes.ContentType;
      }
      if (child.name === "content-types:Override") {
        var name = child.attributes.PartName;
        if (name.charAt(0) === "/") {
          name = name.substring(1);
        }
        overrides[name] = child.attributes.ContentType;
      }
    });
    return contentTypes(overrides, extensionDefaults);
  }
  function contentTypes(overrides, extensionDefaults) {
    return {
      findContentType: function(path) {
        var overrideContentType = overrides[path];
        if (overrideContentType) {
          return overrideContentType;
        } else {
          var pathParts = path.split(".");
          var extension = pathParts[pathParts.length - 1];
          if (Object.prototype.hasOwnProperty.call(extensionDefaults, extension)) {
            return extensionDefaults[extension];
          } else {
            var fallback = fallbackContentTypes[extension.toLowerCase()];
            if (fallback) {
              return "image/" + fallback;
            } else {
              return null;
            }
          }
        }
      }
    };
  }
  return contentTypesReader;
}
var numberingXml = {};
var hasRequiredNumberingXml;
function requireNumberingXml() {
  if (hasRequiredNumberingXml) return numberingXml;
  hasRequiredNumberingXml = 1;
  var _2 = require$$0;
  numberingXml.readNumberingXml = readNumberingXml;
  numberingXml.Numbering = Numbering;
  numberingXml.defaultNumbering = new Numbering({}, {});
  function Numbering(nums, abstractNums, styles) {
    var allLevels = _2.flatten(_2.values(abstractNums).map(function(abstractNum) {
      return _2.values(abstractNum.levels);
    }));
    var levelsByParagraphStyleId = _2.indexBy(
      allLevels.filter(function(level) {
        return level.paragraphStyleId != null;
      }),
      "paragraphStyleId"
    );
    function findLevel(numId, level) {
      return findLevelWithSeenNumIds(numId, level, /* @__PURE__ */ Object.create(null));
    }
    function findLevelWithSeenNumIds(numId, level, seenNumIds) {
      if (seenNumIds[numId]) {
        return null;
      }
      seenNumIds[numId] = true;
      var num = nums[numId];
      if (!num) {
        return null;
      }
      var abstractNum = abstractNums[num.abstractNumId];
      if (!abstractNum) {
        return null;
      } else if (abstractNum.numStyleLink == null) {
        return abstractNums[num.abstractNumId].levels[level];
      } else {
        var style = styles.findNumberingStyleById(abstractNum.numStyleLink);
        return findLevelWithSeenNumIds(style.numId, level, seenNumIds);
      }
    }
    function findLevelByParagraphStyleId(styleId) {
      return levelsByParagraphStyleId[styleId] || null;
    }
    return {
      findLevel,
      findLevelByParagraphStyleId
    };
  }
  function readNumberingXml(root2, options) {
    if (!options || !options.styles) {
      throw new Error("styles is missing");
    }
    var abstractNums = readAbstractNums(root2);
    var nums = readNums(root2);
    return new Numbering(nums, abstractNums, options.styles);
  }
  function readAbstractNums(root2) {
    var abstractNums = /* @__PURE__ */ Object.create(null);
    root2.getElementsByTagName("w:abstractNum").forEach(function(element) {
      var id = element.attributes["w:abstractNumId"];
      abstractNums[id] = readAbstractNum(element);
    });
    return abstractNums;
  }
  function readAbstractNum(element) {
    var levels = /* @__PURE__ */ Object.create(null);
    var levelWithoutIndex = null;
    element.getElementsByTagName("w:lvl").forEach(function(levelElement) {
      var levelIndex = levelElement.attributes["w:ilvl"];
      var numFmt = levelElement.firstOrEmpty("w:numFmt").attributes["w:val"];
      var isOrdered = numFmt !== "bullet";
      var paragraphStyleId = levelElement.firstOrEmpty("w:pStyle").attributes["w:val"];
      if (levelIndex === void 0) {
        levelWithoutIndex = {
          isOrdered,
          level: "0",
          paragraphStyleId
        };
      } else {
        levels[levelIndex] = {
          isOrdered,
          level: levelIndex,
          paragraphStyleId
        };
      }
    });
    if (levelWithoutIndex !== null && levels[levelWithoutIndex.level] === void 0) {
      levels[levelWithoutIndex.level] = levelWithoutIndex;
    }
    var numStyleLink = element.firstOrEmpty("w:numStyleLink").attributes["w:val"];
    return { levels, numStyleLink };
  }
  function readNums(root2) {
    var nums = /* @__PURE__ */ Object.create(null);
    root2.getElementsByTagName("w:num").forEach(function(element) {
      var numId = element.attributes["w:numId"];
      var abstractNumId = element.first("w:abstractNumId").attributes["w:val"];
      nums[numId] = { abstractNumId };
    });
    return nums;
  }
  return numberingXml;
}
var stylesReader = {};
var hasRequiredStylesReader;
function requireStylesReader() {
  if (hasRequiredStylesReader) return stylesReader;
  hasRequiredStylesReader = 1;
  stylesReader.readStylesXml = readStylesXml;
  stylesReader.Styles = Styles;
  stylesReader.defaultStyles = new Styles({}, {});
  function Styles(paragraphStyles, characterStyles, tableStyles, numberingStyles) {
    return {
      findParagraphStyleById: function(styleId) {
        return paragraphStyles[styleId];
      },
      findCharacterStyleById: function(styleId) {
        return characterStyles[styleId];
      },
      findTableStyleById: function(styleId) {
        return tableStyles[styleId];
      },
      findNumberingStyleById: function(styleId) {
        return numberingStyles[styleId];
      }
    };
  }
  Styles.EMPTY = new Styles({}, {}, {}, {});
  function readStylesXml(root2) {
    var paragraphStyles = /* @__PURE__ */ Object.create(null);
    var characterStyles = /* @__PURE__ */ Object.create(null);
    var tableStyles = /* @__PURE__ */ Object.create(null);
    var numberingStyles = /* @__PURE__ */ Object.create(null);
    root2.getElementsByTagName("w:style").forEach(function(styleElement) {
      var style = readStyleElement(styleElement);
      var styleSet;
      switch (style.type) {
        case "paragraph":
          styleSet = paragraphStyles;
          break;
        case "character":
          styleSet = characterStyles;
          break;
        case "table":
          styleSet = tableStyles;
          break;
        case "numbering":
          styleSet = numberingStyles;
          break;
      }
      if (styleSet && styleSet[style.styleId] === void 0) {
        styleSet[style.styleId] = style;
      }
    });
    return new Styles(paragraphStyles, characterStyles, tableStyles, numberingStyles);
  }
  function readStyleElement(styleElement) {
    var type = styleElement.attributes["w:type"];
    if (type === "numbering") {
      return readNumberingStyleElement(type, styleElement);
    } else {
      var styleId = readStyleId(styleElement);
      var name = styleName(styleElement);
      return { type, styleId, name };
    }
  }
  function styleName(styleElement) {
    var nameElement = styleElement.first("w:name");
    return nameElement ? nameElement.attributes["w:val"] : null;
  }
  function readNumberingStyleElement(type, styleElement) {
    var styleId = readStyleId(styleElement);
    var numId = styleElement.firstOrEmpty("w:pPr").firstOrEmpty("w:numPr").firstOrEmpty("w:numId").attributes["w:val"];
    return { type, numId, styleId };
  }
  function readStyleId(styleElement) {
    return styleElement.attributes["w:styleId"];
  }
  return stylesReader;
}
var notesReader = {};
var hasRequiredNotesReader;
function requireNotesReader() {
  if (hasRequiredNotesReader) return notesReader;
  hasRequiredNotesReader = 1;
  var documents2 = requireDocuments();
  var Result = requireResults().Result;
  notesReader.createFootnotesReader = createReader.bind(notesReader, "footnote");
  notesReader.createEndnotesReader = createReader.bind(notesReader, "endnote");
  function createReader(noteType, bodyReader2) {
    function readNotesXml(element) {
      return Result.combine(element.getElementsByTagName("w:" + noteType).filter(isFootnoteElement).map(readFootnoteElement));
    }
    function isFootnoteElement(element) {
      var type = element.attributes["w:type"];
      return type !== "continuationSeparator" && type !== "separator";
    }
    function readFootnoteElement(footnoteElement) {
      var id = footnoteElement.attributes["w:id"];
      return bodyReader2.readXmlElements(footnoteElement.children).map(function(body) {
        return documents2.Note({ noteType, noteId: id, body });
      });
    }
    return readNotesXml;
  }
  return notesReader;
}
var commentsReader = {};
var hasRequiredCommentsReader;
function requireCommentsReader() {
  if (hasRequiredCommentsReader) return commentsReader;
  hasRequiredCommentsReader = 1;
  var documents2 = requireDocuments();
  var Result = requireResults().Result;
  function createCommentsReader(bodyReader2) {
    function readCommentsXml(element) {
      return Result.combine(element.getElementsByTagName("w:comment").map(readCommentElement));
    }
    function readCommentElement(element) {
      var id = element.attributes["w:id"];
      function readOptionalAttribute(name) {
        return (element.attributes[name] || "").trim() || null;
      }
      return bodyReader2.readXmlElements(element.children).map(function(body) {
        return documents2.comment({
          commentId: id,
          body,
          authorName: readOptionalAttribute("w:author"),
          authorInitials: readOptionalAttribute("w:initials")
        });
      });
    }
    return readCommentsXml;
  }
  commentsReader.createCommentsReader = createCommentsReader;
  return commentsReader;
}
var files = {};
var hasRequiredFiles;
function requireFiles() {
  if (hasRequiredFiles) return files;
  hasRequiredFiles = 1;
  var promises2 = requirePromises();
  files.Files = Files;
  function Files() {
    function read(uri) {
      return promises2.reject(new Error("could not open external image: '" + uri + "'\ncannot open linked files from a web browser"));
    }
    return {
      read
    };
  }
  return files;
}
var hasRequiredDocxReader;
function requireDocxReader() {
  if (hasRequiredDocxReader) return docxReader;
  hasRequiredDocxReader = 1;
  docxReader.read = read;
  docxReader._findPartPaths = findPartPaths;
  var promises2 = requirePromises();
  var documents2 = requireDocuments();
  var Result = requireResults().Result;
  var zipfile2 = requireZipfile();
  var readXmlFromZipFile = requireOfficeXmlReader().readXmlFromZipFile;
  var createBodyReader = requireBodyReader().createBodyReader;
  var DocumentXmlReader = requireDocumentXmlReader().DocumentXmlReader;
  var relationshipsReader2 = requireRelationshipsReader();
  var contentTypesReader2 = requireContentTypesReader();
  var numberingXml2 = requireNumberingXml();
  var stylesReader2 = requireStylesReader();
  var notesReader2 = requireNotesReader();
  var commentsReader2 = requireCommentsReader();
  var Files = requireFiles().Files;
  function read(docxFile, input, options) {
    input = input || {};
    options = options || {};
    var files2 = new Files({
      externalFileAccess: options.externalFileAccess,
      relativeToFile: input.path
    });
    return promises2.props({
      contentTypes: readContentTypesFromZipFile(docxFile),
      partPaths: findPartPaths(docxFile),
      docxFile,
      files: files2
    }).also(function(result2) {
      return {
        styles: readStylesFromZipFile(docxFile, result2.partPaths.styles)
      };
    }).also(function(result2) {
      return {
        numbering: readNumberingFromZipFile(docxFile, result2.partPaths.numbering, result2.styles)
      };
    }).also(function(result2) {
      return {
        footnotes: readXmlFileWithBody(result2.partPaths.footnotes, result2, function(bodyReader2, xml2) {
          if (xml2) {
            return notesReader2.createFootnotesReader(bodyReader2)(xml2);
          } else {
            return new Result([]);
          }
        }),
        endnotes: readXmlFileWithBody(result2.partPaths.endnotes, result2, function(bodyReader2, xml2) {
          if (xml2) {
            return notesReader2.createEndnotesReader(bodyReader2)(xml2);
          } else {
            return new Result([]);
          }
        }),
        comments: readXmlFileWithBody(result2.partPaths.comments, result2, function(bodyReader2, xml2) {
          if (xml2) {
            return commentsReader2.createCommentsReader(bodyReader2)(xml2);
          } else {
            return new Result([]);
          }
        })
      };
    }).also(function(result2) {
      return {
        notes: result2.footnotes.flatMap(function(footnotes) {
          return result2.endnotes.map(function(endnotes) {
            return new documents2.Notes(footnotes.concat(endnotes));
          });
        })
      };
    }).then(function(result2) {
      return readXmlFileWithBody(result2.partPaths.mainDocument, result2, function(bodyReader2, xml2) {
        return result2.notes.flatMap(function(notes) {
          return result2.comments.flatMap(function(comments) {
            var reader2 = new DocumentXmlReader({
              bodyReader: bodyReader2,
              notes,
              comments
            });
            return reader2.convertXmlToDocument(xml2);
          });
        });
      });
    });
  }
  function findPartPaths(docxFile) {
    return readPackageRelationships(docxFile).then(function(packageRelationships) {
      var mainDocumentPath = findPartPath({
        docxFile,
        relationships: packageRelationships,
        relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument",
        basePath: "",
        fallbackPath: "word/document.xml"
      });
      if (!docxFile.exists(mainDocumentPath)) {
        throw new Error("Could not find main document part. Are you sure this is a valid .docx file?");
      }
      return xmlFileReader({
        filename: relationshipsFilename(mainDocumentPath),
        readElement: relationshipsReader2.readRelationships,
        defaultValue: relationshipsReader2.defaultValue
      })(docxFile).then(function(documentRelationships) {
        function findPartRelatedToMainDocument(name) {
          return findPartPath({
            docxFile,
            relationships: documentRelationships,
            relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/" + name,
            basePath: zipfile2.splitPath(mainDocumentPath).dirname,
            fallbackPath: "word/" + name + ".xml"
          });
        }
        return {
          mainDocument: mainDocumentPath,
          comments: findPartRelatedToMainDocument("comments"),
          endnotes: findPartRelatedToMainDocument("endnotes"),
          footnotes: findPartRelatedToMainDocument("footnotes"),
          numbering: findPartRelatedToMainDocument("numbering"),
          styles: findPartRelatedToMainDocument("styles")
        };
      });
    });
  }
  function findPartPath(options) {
    var docxFile = options.docxFile;
    var relationships = options.relationships;
    var relationshipType = options.relationshipType;
    var basePath = options.basePath;
    var fallbackPath = options.fallbackPath;
    var targets = relationships.findTargetsByType(relationshipType);
    var normalisedTargets = targets.map(function(target) {
      return stripPrefix(zipfile2.joinPath(basePath, target), "/");
    });
    var validTargets = normalisedTargets.filter(function(target) {
      return docxFile.exists(target);
    });
    if (validTargets.length === 0) {
      return fallbackPath;
    } else {
      return validTargets[0];
    }
  }
  function stripPrefix(value, prefix) {
    if (value.substring(0, prefix.length) === prefix) {
      return value.substring(prefix.length);
    } else {
      return value;
    }
  }
  function xmlFileReader(options) {
    return function(zipFile) {
      return readXmlFromZipFile(zipFile, options.filename).then(function(element) {
        return element ? options.readElement(element) : options.defaultValue;
      });
    };
  }
  function readXmlFileWithBody(filename, options, func) {
    var readRelationshipsFromZipFile = xmlFileReader({
      filename: relationshipsFilename(filename),
      readElement: relationshipsReader2.readRelationships,
      defaultValue: relationshipsReader2.defaultValue
    });
    return readRelationshipsFromZipFile(options.docxFile).then(function(relationships) {
      var bodyReader2 = new createBodyReader({
        relationships,
        contentTypes: options.contentTypes,
        docxFile: options.docxFile,
        numbering: options.numbering,
        styles: options.styles,
        files: options.files
      });
      return readXmlFromZipFile(options.docxFile, filename).then(function(xml2) {
        return func(bodyReader2, xml2);
      });
    });
  }
  function relationshipsFilename(filename) {
    var split = zipfile2.splitPath(filename);
    return zipfile2.joinPath(split.dirname, "_rels", split.basename + ".rels");
  }
  var readContentTypesFromZipFile = xmlFileReader({
    filename: "[Content_Types].xml",
    readElement: contentTypesReader2.readContentTypesFromXml,
    defaultValue: contentTypesReader2.defaultContentTypes
  });
  function readNumberingFromZipFile(zipFile, path, styles) {
    return xmlFileReader({
      filename: path,
      readElement: function(element) {
        return numberingXml2.readNumberingXml(element, { styles });
      },
      defaultValue: numberingXml2.defaultNumbering
    })(zipFile);
  }
  function readStylesFromZipFile(zipFile, path) {
    return xmlFileReader({
      filename: path,
      readElement: stylesReader2.readStylesXml,
      defaultValue: stylesReader2.defaultStyles
    })(zipFile);
  }
  var readPackageRelationships = xmlFileReader({
    filename: "_rels/.rels",
    readElement: relationshipsReader2.readRelationships,
    defaultValue: relationshipsReader2.defaultValue
  });
  return docxReader;
}
var styleMap = {};
var hasRequiredStyleMap;
function requireStyleMap() {
  if (hasRequiredStyleMap) return styleMap;
  hasRequiredStyleMap = 1;
  var _2 = require$$0;
  var promises2 = requirePromises();
  var xml2 = requireXml();
  styleMap.writeStyleMap = writeStyleMap;
  styleMap.readStyleMap = readStyleMap;
  var schema = "http://schemas.zwobble.org/mammoth/style-map";
  var styleMapPath = "mammoth/style-map";
  var styleMapAbsolutePath = "/" + styleMapPath;
  function writeStyleMap(docxFile, styleMap2) {
    docxFile.write(styleMapPath, styleMap2);
    return updateRelationships(docxFile).then(function() {
      return updateContentTypes(docxFile);
    });
  }
  function updateRelationships(docxFile) {
    var path = "word/_rels/document.xml.rels";
    var relationshipsUri = "http://schemas.openxmlformats.org/package/2006/relationships";
    var relationshipElementName = "{" + relationshipsUri + "}Relationship";
    return docxFile.read(path, "utf8").then(xml2.readString).then(function(relationshipsContainer) {
      var relationships = relationshipsContainer.children;
      addOrUpdateElement(relationships, relationshipElementName, "Id", {
        "Id": "rMammothStyleMap",
        "Type": schema,
        "Target": styleMapAbsolutePath
      });
      var namespaces = { "": relationshipsUri };
      return docxFile.write(path, xml2.writeString(relationshipsContainer, namespaces));
    });
  }
  function updateContentTypes(docxFile) {
    var path = "[Content_Types].xml";
    var contentTypesUri = "http://schemas.openxmlformats.org/package/2006/content-types";
    var overrideName = "{" + contentTypesUri + "}Override";
    return docxFile.read(path, "utf8").then(xml2.readString).then(function(typesElement) {
      var children = typesElement.children;
      addOrUpdateElement(children, overrideName, "PartName", {
        "PartName": styleMapAbsolutePath,
        "ContentType": "text/prs.mammoth.style-map"
      });
      var namespaces = { "": contentTypesUri };
      return docxFile.write(path, xml2.writeString(typesElement, namespaces));
    });
  }
  function addOrUpdateElement(elements, name, identifyingAttribute, attributes) {
    var existingElement = _2.find(elements, function(element) {
      return element.name === name && element.attributes[identifyingAttribute] === attributes[identifyingAttribute];
    });
    if (existingElement) {
      existingElement.attributes = attributes;
    } else {
      elements.push(xml2.element(name, attributes));
    }
  }
  function readStyleMap(docxFile) {
    if (docxFile.exists(styleMapPath)) {
      return docxFile.read(styleMapPath, "utf8");
    } else {
      return promises2.resolve(null);
    }
  }
  return styleMap;
}
var documentToHtml = {};
var htmlPaths = {};
var html = {};
var ast = {};
var hasRequiredAst;
function requireAst() {
  if (hasRequiredAst) return ast;
  hasRequiredAst = 1;
  var htmlPaths2 = requireHtmlPaths();
  function nonFreshElement(tagName, attributes, children) {
    return elementWithTag(
      htmlPaths2.element(tagName, attributes, { fresh: false }),
      children
    );
  }
  function freshElement(tagName, attributes, children) {
    var tag = htmlPaths2.element(tagName, attributes, { fresh: true });
    return elementWithTag(tag, children);
  }
  function elementWithTag(tag, children) {
    return {
      type: "element",
      tag,
      children: children || []
    };
  }
  function text(value) {
    return {
      type: "text",
      value
    };
  }
  var forceWrite = {
    type: "forceWrite"
  };
  ast.freshElement = freshElement;
  ast.nonFreshElement = nonFreshElement;
  ast.elementWithTag = elementWithTag;
  ast.text = text;
  ast.forceWrite = forceWrite;
  var voidTagNames = {
    "br": true,
    "hr": true,
    "img": true,
    "input": true
  };
  function isVoidElement(node) {
    return node.children.length === 0 && voidTagNames[node.tag.tagName];
  }
  ast.isVoidElement = isVoidElement;
  return ast;
}
var simplify_1;
var hasRequiredSimplify;
function requireSimplify() {
  if (hasRequiredSimplify) return simplify_1;
  hasRequiredSimplify = 1;
  var _2 = require$$0;
  var ast2 = requireAst();
  function simplify(nodes2) {
    return collapse(removeEmpty(nodes2));
  }
  function collapse(nodes2) {
    var children = [];
    nodes2.map(collapseNode).forEach(function(child) {
      appendChild(children, child);
    });
    return children;
  }
  function collapseNode(node) {
    return collapsers[node.type](node);
  }
  var collapsers = {
    element: collapseElement,
    text: identity2,
    forceWrite: identity2
  };
  function collapseElement(node) {
    return ast2.elementWithTag(node.tag, collapse(node.children));
  }
  function identity2(value) {
    return value;
  }
  function appendChild(children, child) {
    var lastChild = children[children.length - 1];
    if (child.type === "element" && !child.tag.fresh && lastChild && lastChild.type === "element" && child.tag.matchesElement(lastChild.tag)) {
      if (child.tag.separator) {
        appendChild(lastChild.children, ast2.text(child.tag.separator));
      }
      child.children.forEach(function(grandChild) {
        appendChild(lastChild.children, grandChild);
      });
    } else {
      children.push(child);
    }
  }
  function removeEmpty(nodes2) {
    return flatMap(nodes2, function(node) {
      return emptiers[node.type](node);
    });
  }
  function flatMap(values2, func) {
    return _2.flatten(_2.map(values2, func), true);
  }
  var emptiers = {
    element: elementEmptier,
    text: textEmptier,
    forceWrite: neverEmpty
  };
  function neverEmpty(node) {
    return [node];
  }
  function elementEmptier(element) {
    var children = removeEmpty(element.children);
    if (children.length === 0 && !ast2.isVoidElement(element)) {
      return [];
    } else {
      return [ast2.elementWithTag(element.tag, children)];
    }
  }
  function textEmptier(node) {
    if (node.value.length === 0) {
      return [];
    } else {
      return [node];
    }
  }
  simplify_1 = simplify;
  return simplify_1;
}
var hasRequiredHtml;
function requireHtml() {
  if (hasRequiredHtml) return html;
  hasRequiredHtml = 1;
  var ast2 = requireAst();
  html.freshElement = ast2.freshElement;
  html.nonFreshElement = ast2.nonFreshElement;
  html.elementWithTag = ast2.elementWithTag;
  html.text = ast2.text;
  html.forceWrite = ast2.forceWrite;
  html.simplify = requireSimplify();
  function write(writer2, nodes2) {
    nodes2.forEach(function(node) {
      writeNode(writer2, node);
    });
  }
  function writeNode(writer2, node) {
    toStrings[node.type](writer2, node);
  }
  var toStrings = {
    element: generateElementString,
    text: generateTextString,
    forceWrite: function() {
    }
  };
  function generateElementString(writer2, node) {
    if (ast2.isVoidElement(node)) {
      writer2.selfClosing(node.tag.tagName, node.tag.attributes);
    } else {
      writer2.open(node.tag.tagName, node.tag.attributes);
      write(writer2, node.children);
      writer2.close(node.tag.tagName);
    }
  }
  function generateTextString(writer2, node) {
    writer2.text(node.value);
  }
  html.write = write;
  return html;
}
var hasRequiredHtmlPaths;
function requireHtmlPaths() {
  if (hasRequiredHtmlPaths) return htmlPaths;
  hasRequiredHtmlPaths = 1;
  var _2 = require$$0;
  var html2 = requireHtml();
  htmlPaths.topLevelElement = topLevelElement;
  htmlPaths.elements = elements;
  htmlPaths.element = element;
  function topLevelElement(tagName, attributes) {
    return elements([element(tagName, attributes, { fresh: true })]);
  }
  function elements(elementStyles) {
    return new HtmlPath(elementStyles.map(function(elementStyle) {
      if (_2.isString(elementStyle)) {
        return element(elementStyle);
      } else {
        return elementStyle;
      }
    }));
  }
  function HtmlPath(elements2) {
    this._elements = elements2;
  }
  HtmlPath.prototype.wrap = function wrap2(children) {
    var result2 = children();
    for (var index2 = this._elements.length - 1; index2 >= 0; index2--) {
      result2 = this._elements[index2].wrapNodes(result2);
    }
    return result2;
  };
  function element(tagName, attributes, options) {
    options = options || {};
    return new Element(tagName, attributes, options);
  }
  function Element(tagName, attributes, options) {
    var tagNames = /* @__PURE__ */ Object.create(null);
    if (_2.isArray(tagName)) {
      tagName.forEach(function(tagName2) {
        tagNames[tagName2] = true;
      });
      tagName = tagName[0];
    } else {
      tagNames[tagName] = true;
    }
    this.tagName = tagName;
    this.tagNames = tagNames;
    this.attributes = attributes || {};
    this.fresh = options.fresh;
    this.separator = options.separator;
  }
  Element.prototype.matchesElement = function(element2) {
    return this.tagNames[element2.tagName] && _2.isEqual(this.attributes || {}, element2.attributes || {});
  };
  Element.prototype.wrap = function wrap2(generateNodes) {
    return this.wrapNodes(generateNodes());
  };
  Element.prototype.wrapNodes = function wrapNodes(nodes2) {
    return [html2.elementWithTag(this, nodes2)];
  };
  htmlPaths.empty = elements([]);
  htmlPaths.ignore = {
    wrap: function() {
      return [];
    }
  };
  return htmlPaths;
}
var images = {};
var hasRequiredImages;
function requireImages() {
  if (hasRequiredImages) return images;
  hasRequiredImages = 1;
  (function(exports) {
    var _2 = require$$0;
    var promises2 = requirePromises();
    var Html = requireHtml();
    exports.imgElement = imgElement;
    function imgElement(func) {
      return function(element, messages) {
        return promises2.resolve(func(element)).then(function(result2) {
          var attributes = {};
          if (element.altText) {
            attributes.alt = element.altText;
          }
          _2.extend(attributes, result2);
          return [Html.freshElement("img", attributes)];
        });
      };
    }
    exports.inline = exports.imgElement;
    exports.dataUri = imgElement(function(element) {
      return element.readAsBase64String().then(function(imageBuffer) {
        return {
          src: "data:" + element.contentType + ";base64," + imageBuffer
        };
      });
    });
    function imageFilenameExtension(image) {
      return image.contentType.split(/\/|\\/)[1];
    }
    exports.imageFilenameExtension = imageFilenameExtension;
  })(images);
  return images;
}
var writers = {};
var htmlWriter = {};
var hasRequiredHtmlWriter;
function requireHtmlWriter() {
  if (hasRequiredHtmlWriter) return htmlWriter;
  hasRequiredHtmlWriter = 1;
  var _2 = require$$0;
  htmlWriter.writer = writer2;
  function writer2(options) {
    options = options || {};
    if (options.prettyPrint) {
      return prettyWriter();
    } else {
      return simpleWriter();
    }
  }
  var indentedElements = {
    div: true,
    p: true,
    ul: true,
    li: true
  };
  function prettyWriter() {
    var indentationLevel = 0;
    var indentation = "  ";
    var stack = [];
    var start = true;
    var inText = false;
    var writer3 = simpleWriter();
    function open(tagName, attributes) {
      if (indentedElements[tagName]) {
        indent();
      }
      stack.push(tagName);
      writer3.open(tagName, attributes);
      if (indentedElements[tagName]) {
        indentationLevel++;
      }
      start = false;
    }
    function close(tagName) {
      if (indentedElements[tagName]) {
        indentationLevel--;
        indent();
      }
      stack.pop();
      writer3.close(tagName);
    }
    function text(value) {
      startText();
      var text2 = isInPre() ? value : value.replace("\n", "\n" + indentation);
      writer3.text(text2);
    }
    function selfClosing(tagName, attributes) {
      indent();
      writer3.selfClosing(tagName, attributes);
    }
    function insideIndentedElement() {
      return stack.length === 0 || indentedElements[stack[stack.length - 1]];
    }
    function startText() {
      if (!inText) {
        indent();
        inText = true;
      }
    }
    function indent() {
      inText = false;
      if (!start && insideIndentedElement() && !isInPre()) {
        writer3._append("\n");
        for (var i = 0; i < indentationLevel; i++) {
          writer3._append(indentation);
        }
      }
    }
    function isInPre() {
      return _2.some(stack, function(tagName) {
        return tagName === "pre";
      });
    }
    return {
      asString: writer3.asString,
      open,
      close,
      text,
      selfClosing
    };
  }
  function simpleWriter() {
    var fragments = [];
    function open(tagName, attributes) {
      var attributeString = generateAttributeString(attributes);
      fragments.push("<" + tagName + attributeString + ">");
    }
    function close(tagName) {
      fragments.push("</" + tagName + ">");
    }
    function selfClosing(tagName, attributes) {
      var attributeString = generateAttributeString(attributes);
      fragments.push("<" + tagName + attributeString + " />");
    }
    function generateAttributeString(attributes) {
      return _2.map(attributes, function(value, key) {
        return " " + key + '="' + escapeHtmlAttribute(value) + '"';
      }).join("");
    }
    function text(value) {
      fragments.push(escapeHtmlText(value));
    }
    function append(html2) {
      fragments.push(html2);
    }
    function asString() {
      return fragments.join("");
    }
    return {
      asString,
      open,
      close,
      text,
      selfClosing,
      _append: append
    };
  }
  function escapeHtmlText(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function escapeHtmlAttribute(value) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  return htmlWriter;
}
var markdownWriter = {};
var hasRequiredMarkdownWriter;
function requireMarkdownWriter() {
  if (hasRequiredMarkdownWriter) return markdownWriter;
  hasRequiredMarkdownWriter = 1;
  var _2 = require$$0;
  var htmlWriter2 = requireHtmlWriter();
  function symmetricMarkdownElement(end) {
    return markdownElement(end, end);
  }
  function markdownElement(start, end) {
    return function() {
      return { start, end };
    };
  }
  function markdownLink(attributes) {
    var href = attributes.href || "";
    if (href) {
      return {
        start: "[",
        end: "](" + escapeMarkdown(href) + ")",
        anchorPosition: "before"
      };
    } else {
      return {};
    }
  }
  function markdownImage(attributes) {
    var src = attributes.src || "";
    var altText = attributes.alt || "";
    if (src || altText) {
      return { start: "![" + escapeMarkdown(altText) + "](" + escapeMarkdown(src) + ")" };
    } else {
      return {};
    }
  }
  function markdownList(options) {
    return function(attributes, list) {
      return {
        start: list ? "\n" : "",
        end: list ? "" : "\n",
        list: {
          isOrdered: options.isOrdered,
          indent: list ? list.indent + 1 : 0,
          count: 0
        }
      };
    };
  }
  function markdownListItem(attributes, list, listItem) {
    list = list || { indent: 0, isOrdered: false, count: 0 };
    list.count++;
    listItem.hasClosed = false;
    var bullet = list.isOrdered ? list.count + "." : "-";
    var start = repeatString("	", list.indent) + bullet + " ";
    return {
      start,
      end: function() {
        if (!listItem.hasClosed) {
          listItem.hasClosed = true;
          return "\n";
        }
      }
    };
  }
  var htmlToMarkdown = {
    "p": markdownElement("", "\n\n"),
    "br": markdownElement("", "  \n"),
    "ul": markdownList({ isOrdered: false }),
    "ol": markdownList({ isOrdered: true }),
    "li": markdownListItem,
    "strong": symmetricMarkdownElement("__"),
    "em": symmetricMarkdownElement("*"),
    "a": markdownLink,
    "img": markdownImage
  };
  (function() {
    for (var i = 1; i <= 6; i++) {
      htmlToMarkdown["h" + i] = markdownElement(repeatString("#", i) + " ", "\n\n");
    }
  })();
  function repeatString(value, count) {
    return new Array(count + 1).join(value);
  }
  function markdownWriter$1() {
    var fragments = [];
    var elementStack = [];
    var list = null;
    var listItem = {};
    function open(tagName, attributes) {
      attributes = attributes || {};
      var createElement = htmlToMarkdown[tagName] || function() {
        return {};
      };
      var element = createElement(attributes, list, listItem);
      elementStack.push({ end: element.end, list });
      if (element.list) {
        list = element.list;
      }
      var anchorBeforeStart = element.anchorPosition === "before";
      if (anchorBeforeStart) {
        writeAnchor(attributes);
      }
      fragments.push(element.start || "");
      if (!anchorBeforeStart) {
        writeAnchor(attributes);
      }
    }
    function writeAnchor(attributes) {
      if (attributes.id) {
        var writer2 = htmlWriter2.writer();
        writer2.open("a", { id: attributes.id });
        writer2.close("a");
        fragments.push(writer2.asString());
      }
    }
    function close(tagName) {
      var element = elementStack.pop();
      list = element.list;
      var end = _2.isFunction(element.end) ? element.end() : element.end;
      fragments.push(end || "");
    }
    function selfClosing(tagName, attributes) {
      open(tagName, attributes);
      close();
    }
    function text(value) {
      fragments.push(escapeMarkdown(value));
    }
    function asString() {
      return fragments.join("");
    }
    return {
      asString,
      open,
      close,
      text,
      selfClosing
    };
  }
  markdownWriter.writer = markdownWriter$1;
  function escapeMarkdown(value) {
    return value.replace(/\\/g, "\\\\").replace(/([\`\*_\{\}\[\]\(\)\#\+\-\.\!])/g, "\\$1");
  }
  return markdownWriter;
}
var hasRequiredWriters;
function requireWriters() {
  if (hasRequiredWriters) return writers;
  hasRequiredWriters = 1;
  var htmlWriter2 = requireHtmlWriter();
  var markdownWriter2 = requireMarkdownWriter();
  writers.writer = writer2;
  function writer2(options) {
    options = options || {};
    if (options.outputFormat === "markdown") {
      return markdownWriter2.writer();
    } else {
      return htmlWriter2.writer(options);
    }
  }
  return writers;
}
var hasRequiredDocumentToHtml;
function requireDocumentToHtml() {
  if (hasRequiredDocumentToHtml) return documentToHtml;
  hasRequiredDocumentToHtml = 1;
  var _2 = require$$0;
  var promises2 = requirePromises();
  var documents2 = requireDocuments();
  var htmlPaths2 = requireHtmlPaths();
  var results2 = requireResults();
  var images2 = requireImages();
  var Html = requireHtml();
  var writers2 = requireWriters();
  documentToHtml.DocumentConverter = DocumentConverter;
  function DocumentConverter(options) {
    return {
      convertToHtml: function(element) {
        var comments = _2.indexBy(
          element.type === documents2.types.document ? element.comments : [],
          "commentId"
        );
        var conversion = new DocumentConversion(options, comments);
        return conversion.convertToHtml(element);
      }
    };
  }
  function DocumentConversion(options, comments) {
    var noteNumber = 1;
    var noteReferences = [];
    var referencedComments = [];
    options = _2.extend({ ignoreEmptyParagraphs: true }, options);
    var idPrefix = options.idPrefix === void 0 ? "" : options.idPrefix;
    var ignoreEmptyParagraphs = options.ignoreEmptyParagraphs;
    var defaultParagraphStyle = htmlPaths2.topLevelElement("p");
    var styleMap2 = options.styleMap || [];
    function convertToHtml(document) {
      var messages = [];
      var html2 = elementToHtml(document, messages, /* @__PURE__ */ Object.create(null));
      var deferredNodes = [];
      walkHtml(html2, function(node) {
        if (node.type === "deferred") {
          deferredNodes.push(node);
        }
      });
      var deferredValues = /* @__PURE__ */ Object.create(null);
      return promises2.forEachSeries(deferredNodes, function(deferred) {
        return deferred.value().then(function(value) {
          deferredValues[deferred.id] = value;
        });
      }).then(function() {
        function replaceDeferred(nodes2) {
          return flatMap(nodes2, function(node) {
            if (node.type === "deferred") {
              return deferredValues[node.id];
            } else if (node.children) {
              return [
                _2.extend({}, node, {
                  children: replaceDeferred(node.children)
                })
              ];
            } else {
              return [node];
            }
          });
        }
        var writer2 = writers2.writer({
          prettyPrint: options.prettyPrint,
          outputFormat: options.outputFormat
        });
        Html.write(writer2, Html.simplify(replaceDeferred(html2)));
        return new results2.Result(writer2.asString(), messages);
      });
    }
    function convertElements(elements, messages, context) {
      return flatMap(elements, function(element) {
        return elementToHtml(element, messages, context);
      });
    }
    function elementToHtml(element, messages, context) {
      if (!context) {
        throw new Error("context not set");
      }
      var handler = elementConverters[element.type];
      if (handler) {
        return handler(element, messages, context);
      } else {
        return [];
      }
    }
    function convertParagraph(element, messages, context) {
      return htmlPathForParagraph(element, messages).wrap(function() {
        var content = convertElements(element.children, messages, context);
        if (ignoreEmptyParagraphs) {
          return content;
        } else {
          return [Html.forceWrite].concat(content);
        }
      });
    }
    function htmlPathForParagraph(element, messages) {
      var style = findStyle(element);
      if (style) {
        return style.to;
      } else {
        if (element.styleId) {
          messages.push(unrecognisedStyleWarning("paragraph", element));
        }
        return defaultParagraphStyle;
      }
    }
    function convertRun(run, messages, context) {
      var nodes2 = function() {
        return convertElements(run.children, messages, context);
      };
      var paths = [];
      if (run.highlight !== null) {
        var path = findHtmlPath({ type: "highlight", color: run.highlight });
        if (path) {
          paths.push(path);
        }
      }
      if (run.isSmallCaps) {
        paths.push(findHtmlPathForRunProperty("smallCaps"));
      }
      if (run.isAllCaps) {
        paths.push(findHtmlPathForRunProperty("allCaps"));
      }
      if (run.isStrikethrough) {
        paths.push(findHtmlPathForRunProperty("strikethrough", "s"));
      }
      if (run.isUnderline) {
        paths.push(findHtmlPathForRunProperty("underline"));
      }
      if (run.verticalAlignment === documents2.verticalAlignment.subscript) {
        paths.push(htmlPaths2.element("sub", {}, { fresh: false }));
      }
      if (run.verticalAlignment === documents2.verticalAlignment.superscript) {
        paths.push(htmlPaths2.element("sup", {}, { fresh: false }));
      }
      if (run.isItalic) {
        paths.push(findHtmlPathForRunProperty("italic", "em"));
      }
      if (run.isBold) {
        paths.push(findHtmlPathForRunProperty("bold", "strong"));
      }
      var stylePath = htmlPaths2.empty;
      var style = findStyle(run);
      if (style) {
        stylePath = style.to;
      } else if (run.styleId) {
        messages.push(unrecognisedStyleWarning("run", run));
      }
      paths.push(stylePath);
      paths.forEach(function(path2) {
        nodes2 = path2.wrap.bind(path2, nodes2);
      });
      return nodes2();
    }
    function findHtmlPathForRunProperty(elementType, defaultTagName) {
      var path = findHtmlPath({ type: elementType });
      if (path) {
        return path;
      } else if (defaultTagName) {
        return htmlPaths2.element(defaultTagName, {}, { fresh: false });
      } else {
        return htmlPaths2.empty;
      }
    }
    function findHtmlPath(element, defaultPath) {
      var style = findStyle(element);
      return style ? style.to : defaultPath;
    }
    function findStyle(element) {
      for (var i = 0; i < styleMap2.length; i++) {
        if (styleMap2[i].from.matches(element)) {
          return styleMap2[i];
        }
      }
    }
    function recoveringConvertImage(convertImage) {
      return function(image, messages) {
        return promises2.try(function() {
          return convertImage(image, messages);
        }).catch(function(error) {
          messages.push(results2.error(error));
          return [];
        });
      };
    }
    function noteHtmlId(note) {
      return referentHtmlId(note.noteType, note.noteId);
    }
    function noteRefHtmlId(note) {
      return referenceHtmlId(note.noteType, note.noteId);
    }
    function referentHtmlId(referenceType, referenceId) {
      return htmlId(referenceType + "-" + referenceId);
    }
    function referenceHtmlId(referenceType, referenceId) {
      return htmlId(referenceType + "-ref-" + referenceId);
    }
    function htmlId(suffix) {
      return idPrefix + suffix;
    }
    var defaultTablePath = htmlPaths2.elements([
      htmlPaths2.element("table", {}, { fresh: true })
    ]);
    function convertTable(element, messages, context) {
      return findHtmlPath(element, defaultTablePath).wrap(function() {
        return convertTableChildren(element, messages, context);
      });
    }
    function convertTableChildren(element, messages, context) {
      var bodyIndex = _2.findIndex(element.children, function(child) {
        return !child.type === documents2.types.tableRow || !child.isHeader;
      });
      if (bodyIndex === -1) {
        bodyIndex = element.children.length;
      }
      var children;
      if (bodyIndex === 0) {
        children = convertElements(
          element.children,
          messages,
          _2.extend({}, context, { isTableHeader: false })
        );
      } else {
        var headRows = convertElements(
          element.children.slice(0, bodyIndex),
          messages,
          _2.extend({}, context, { isTableHeader: true })
        );
        var bodyRows = convertElements(
          element.children.slice(bodyIndex),
          messages,
          _2.extend({}, context, { isTableHeader: false })
        );
        children = [
          Html.freshElement("thead", {}, headRows),
          Html.freshElement("tbody", {}, bodyRows)
        ];
      }
      return [Html.forceWrite].concat(children);
    }
    function convertTableRow(element, messages, context) {
      var children = convertElements(element.children, messages, context);
      return [
        Html.freshElement("tr", {}, [Html.forceWrite].concat(children))
      ];
    }
    function convertTableCell(element, messages, context) {
      var tagName = context.isTableHeader ? "th" : "td";
      var children = convertElements(element.children, messages, context);
      var attributes = {};
      if (element.colSpan !== 1) {
        attributes.colspan = element.colSpan.toString();
      }
      if (element.rowSpan !== 1) {
        attributes.rowspan = element.rowSpan.toString();
      }
      return [
        Html.freshElement(tagName, attributes, [Html.forceWrite].concat(children))
      ];
    }
    function convertCommentReference(reference, messages, context) {
      return findHtmlPath(reference, htmlPaths2.ignore).wrap(function() {
        var comment = comments[reference.commentId];
        var count = referencedComments.length + 1;
        var label = "[" + commentAuthorLabel(comment) + count + "]";
        referencedComments.push({ label, comment });
        return [
          Html.freshElement("a", {
            href: "#" + referentHtmlId("comment", reference.commentId),
            id: referenceHtmlId("comment", reference.commentId)
          }, [Html.text(label)])
        ];
      });
    }
    function convertComment(referencedComment, messages, context) {
      var label = referencedComment.label;
      var comment = referencedComment.comment;
      var body = convertElements(comment.body, messages, context).concat([
        Html.nonFreshElement("p", {}, [
          Html.text(" "),
          Html.freshElement("a", { "href": "#" + referenceHtmlId("comment", comment.commentId) }, [
            Html.text("↑")
          ])
        ])
      ]);
      return [
        Html.freshElement(
          "dt",
          { "id": referentHtmlId("comment", comment.commentId) },
          [Html.text("Comment " + label)]
        ),
        Html.freshElement("dd", {}, body)
      ];
    }
    function convertBreak(element, messages, context) {
      return htmlPathForBreak(element).wrap(function() {
        return [];
      });
    }
    function htmlPathForBreak(element) {
      var style = findStyle(element);
      if (style) {
        return style.to;
      } else if (element.breakType === "line") {
        return htmlPaths2.topLevelElement("br");
      } else {
        return htmlPaths2.empty;
      }
    }
    var elementConverters = {
      "document": function(document, messages, context) {
        var children = convertElements(document.children, messages, context);
        var notes = noteReferences.map(function(noteReference) {
          return document.notes.resolve(noteReference);
        });
        var notesNodes = convertElements(notes, messages, context);
        return children.concat([
          Html.freshElement("ol", {}, notesNodes),
          Html.freshElement("dl", {}, flatMap(referencedComments, function(referencedComment) {
            return convertComment(referencedComment, messages, context);
          }))
        ]);
      },
      "paragraph": convertParagraph,
      "run": convertRun,
      "text": function(element, messages, context) {
        return [Html.text(element.value)];
      },
      "tab": function(element, messages, context) {
        return [Html.text("	")];
      },
      "hyperlink": function(element, messages, context) {
        var href = element.anchor ? "#" + htmlId(element.anchor) : element.href;
        var attributes = { href };
        if (element.targetFrame != null) {
          attributes.target = element.targetFrame;
        }
        var children = convertElements(element.children, messages, context);
        return [Html.nonFreshElement("a", attributes, children)];
      },
      "checkbox": function(element) {
        var attributes = { type: "checkbox" };
        if (element.checked) {
          attributes["checked"] = "checked";
        }
        return [Html.freshElement("input", attributes)];
      },
      "bookmarkStart": function(element, messages, context) {
        var anchor = Html.freshElement("a", {
          id: htmlId(element.name)
        }, [Html.forceWrite]);
        return [anchor];
      },
      "noteReference": function(element, messages, context) {
        noteReferences.push(element);
        var anchor = Html.freshElement("a", {
          href: "#" + noteHtmlId(element),
          id: noteRefHtmlId(element)
        }, [Html.text("[" + noteNumber++ + "]")]);
        return [Html.freshElement("sup", {}, [anchor])];
      },
      "note": function(element, messages, context) {
        var children = convertElements(element.body, messages, context);
        var backLink = Html.elementWithTag(htmlPaths2.element("p", {}, { fresh: false }), [
          Html.text(" "),
          Html.freshElement("a", { href: "#" + noteRefHtmlId(element) }, [Html.text("↑")])
        ]);
        var body = children.concat([backLink]);
        return Html.freshElement("li", { id: noteHtmlId(element) }, body);
      },
      "commentReference": convertCommentReference,
      "comment": convertComment,
      "image": deferredConversion(recoveringConvertImage(options.convertImage || images2.dataUri)),
      "table": convertTable,
      "tableRow": convertTableRow,
      "tableCell": convertTableCell,
      "break": convertBreak
    };
    return {
      convertToHtml
    };
  }
  var deferredId = 1;
  function deferredConversion(func) {
    return function(element, messages, context) {
      return [
        {
          type: "deferred",
          id: deferredId++,
          value: function() {
            return func(element, messages, context);
          }
        }
      ];
    };
  }
  function unrecognisedStyleWarning(type, element) {
    return results2.warning(
      "Unrecognised " + type + " style: '" + element.styleName + "' (Style ID: " + element.styleId + ")"
    );
  }
  function flatMap(values2, func) {
    return _2.flatten(values2.map(func), true);
  }
  function walkHtml(nodes2, callback) {
    nodes2.forEach(function(node) {
      callback(node);
      if (node.children) {
        walkHtml(node.children, callback);
      }
    });
  }
  var commentAuthorLabel = documentToHtml.commentAuthorLabel = function commentAuthorLabel2(comment) {
    return comment.authorInitials || "";
  };
  return documentToHtml;
}
var rawText = {};
var hasRequiredRawText;
function requireRawText() {
  if (hasRequiredRawText) return rawText;
  hasRequiredRawText = 1;
  var documents2 = requireDocuments();
  function convertElementToRawText(element) {
    if (element.type === "text") {
      return element.value;
    } else if (element.type === documents2.types.tab) {
      return "	";
    } else {
      var tail = element.type === "paragraph" ? "\n\n" : "";
      return (element.children || []).map(convertElementToRawText).join("") + tail;
    }
  }
  rawText.convertElementToRawText = convertElementToRawText;
  return rawText;
}
var styleReader = {};
var lop = {};
var parser = {};
var TokenIterator = { exports: {} };
var hasRequiredTokenIterator;
function requireTokenIterator() {
  if (hasRequiredTokenIterator) return TokenIterator.exports;
  hasRequiredTokenIterator = 1;
  var TokenIterator$1 = TokenIterator.exports = function(tokens, startIndex) {
    this._tokens = tokens;
    this._startIndex = startIndex || 0;
  };
  TokenIterator$1.prototype.head = function() {
    return this._tokens[this._startIndex];
  };
  TokenIterator$1.prototype.tail = function(startIndex) {
    return new TokenIterator$1(this._tokens, this._startIndex + 1);
  };
  TokenIterator$1.prototype.toArray = function() {
    return this._tokens.slice(this._startIndex);
  };
  TokenIterator$1.prototype.end = function() {
    return this._tokens[this._tokens.length - 1];
  };
  TokenIterator$1.prototype.to = function(end) {
    var start = this.head().source;
    var endToken = end.head() || end.end();
    return start.to(endToken.source);
  };
  return TokenIterator.exports;
}
var hasRequiredParser;
function requireParser() {
  if (hasRequiredParser) return parser;
  hasRequiredParser = 1;
  var TokenIterator2 = requireTokenIterator();
  parser.Parser = function(options) {
    var parseTokens = function(parser2, tokens) {
      return parser2(new TokenIterator2(tokens));
    };
    return {
      parseTokens
    };
  };
  return parser;
}
var rules = {};
var option = {};
var hasRequiredOption;
function requireOption() {
  if (hasRequiredOption) return option;
  hasRequiredOption = 1;
  (function(exports) {
    exports.none = /* @__PURE__ */ Object.create({
      value: function() {
        throw new Error("Called value on none");
      },
      isNone: function() {
        return true;
      },
      isSome: function() {
        return false;
      },
      map: function() {
        return exports.none;
      },
      flatMap: function() {
        return exports.none;
      },
      filter: function() {
        return exports.none;
      },
      toArray: function() {
        return [];
      },
      orElse: callOrReturn,
      valueOrElse: callOrReturn
    });
    function callOrReturn(value) {
      if (typeof value == "function") {
        return value();
      } else {
        return value;
      }
    }
    exports.some = function(value) {
      return new Some(value);
    };
    var Some = function(value) {
      this._value = value;
    };
    Some.prototype.value = function() {
      return this._value;
    };
    Some.prototype.isNone = function() {
      return false;
    };
    Some.prototype.isSome = function() {
      return true;
    };
    Some.prototype.map = function(func) {
      return new Some(func(this._value));
    };
    Some.prototype.flatMap = function(func) {
      return func(this._value);
    };
    Some.prototype.filter = function(predicate) {
      return predicate(this._value) ? this : exports.none;
    };
    Some.prototype.toArray = function() {
      return [this._value];
    };
    Some.prototype.orElse = function(value) {
      return this;
    };
    Some.prototype.valueOrElse = function(value) {
      return this._value;
    };
    exports.isOption = function(value) {
      return value === exports.none || value instanceof Some;
    };
    exports.fromNullable = function(value) {
      if (value == null) {
        return exports.none;
      }
      return new Some(value);
    };
  })(option);
  return option;
}
var parsingResults;
var hasRequiredParsingResults;
function requireParsingResults() {
  if (hasRequiredParsingResults) return parsingResults;
  hasRequiredParsingResults = 1;
  parsingResults = {
    failure: function(errors2, remaining) {
      if (errors2.length < 1) {
        throw new Error("Failure must have errors");
      }
      return new Result({
        status: "failure",
        remaining,
        errors: errors2
      });
    },
    error: function(errors2, remaining) {
      if (errors2.length < 1) {
        throw new Error("Failure must have errors");
      }
      return new Result({
        status: "error",
        remaining,
        errors: errors2
      });
    },
    success: function(value, remaining, source) {
      return new Result({
        status: "success",
        value,
        source,
        remaining,
        errors: []
      });
    },
    cut: function(remaining) {
      return new Result({
        status: "cut",
        remaining,
        errors: []
      });
    }
  };
  var Result = function(options) {
    this._value = options.value;
    this._status = options.status;
    this._hasValue = options.value !== void 0;
    this._remaining = options.remaining;
    this._source = options.source;
    this._errors = options.errors;
  };
  Result.prototype.map = function(func) {
    if (this._hasValue) {
      return new Result({
        value: func(this._value, this._source),
        status: this._status,
        remaining: this._remaining,
        source: this._source,
        errors: this._errors
      });
    } else {
      return this;
    }
  };
  Result.prototype.changeRemaining = function(remaining) {
    return new Result({
      value: this._value,
      status: this._status,
      remaining,
      source: this._source,
      errors: this._errors
    });
  };
  Result.prototype.isSuccess = function() {
    return this._status === "success" || this._status === "cut";
  };
  Result.prototype.isFailure = function() {
    return this._status === "failure";
  };
  Result.prototype.isError = function() {
    return this._status === "error";
  };
  Result.prototype.isCut = function() {
    return this._status === "cut";
  };
  Result.prototype.value = function() {
    return this._value;
  };
  Result.prototype.remaining = function() {
    return this._remaining;
  };
  Result.prototype.source = function() {
    return this._source;
  };
  Result.prototype.errors = function() {
    return this._errors;
  };
  return parsingResults;
}
var errors = {};
var hasRequiredErrors;
function requireErrors() {
  if (hasRequiredErrors) return errors;
  hasRequiredErrors = 1;
  errors.error = function(options) {
    return new Error2(options);
  };
  var Error2 = function(options) {
    this.expected = options.expected;
    this.actual = options.actual;
    this._location = options.location;
  };
  Error2.prototype.describe = function() {
    var locationDescription = this._location ? this._location.describe() + ":\n" : "";
    return locationDescription + "Expected " + this.expected + "\nbut got " + this.actual;
  };
  Error2.prototype.lineNumber = function() {
    return this._location.lineNumber();
  };
  Error2.prototype.characterNumber = function() {
    return this._location.characterNumber();
  };
  return errors;
}
var lazyIterators = {};
var hasRequiredLazyIterators;
function requireLazyIterators() {
  if (hasRequiredLazyIterators) return lazyIterators;
  hasRequiredLazyIterators = 1;
  lazyIterators.fromArray = function(array) {
    var index2 = 0;
    var hasNext = function() {
      return index2 < array.length;
    };
    return new LazyIterator({
      hasNext,
      next: function() {
        if (!hasNext()) {
          throw new Error("No more elements");
        } else {
          return array[index2++];
        }
      }
    });
  };
  var LazyIterator = function(iterator) {
    this._iterator = iterator;
  };
  LazyIterator.prototype.map = function(func) {
    var iterator = this._iterator;
    return new LazyIterator({
      hasNext: function() {
        return iterator.hasNext();
      },
      next: function() {
        return func(iterator.next());
      }
    });
  };
  LazyIterator.prototype.filter = function(condition) {
    var iterator = this._iterator;
    var moved = false;
    var hasNext = false;
    var next;
    var moveIfNecessary = function() {
      if (moved) {
        return;
      }
      moved = true;
      hasNext = false;
      while (iterator.hasNext() && !hasNext) {
        next = iterator.next();
        hasNext = condition(next);
      }
    };
    return new LazyIterator({
      hasNext: function() {
        moveIfNecessary();
        return hasNext;
      },
      next: function() {
        moveIfNecessary();
        var toReturn = next;
        moved = false;
        return toReturn;
      }
    });
  };
  LazyIterator.prototype.first = function() {
    var iterator = this._iterator;
    if (this._iterator.hasNext()) {
      return iterator.next();
    } else {
      return null;
    }
  };
  LazyIterator.prototype.toArray = function() {
    var result2 = [];
    while (this._iterator.hasNext()) {
      result2.push(this._iterator.next());
    }
    return result2;
  };
  return lazyIterators;
}
var hasRequiredRules;
function requireRules() {
  if (hasRequiredRules) return rules;
  hasRequiredRules = 1;
  (function(exports) {
    var _2 = require$$0;
    var options = requireOption();
    var results2 = requireParsingResults();
    var errors2 = requireErrors();
    var lazyIterators2 = requireLazyIterators();
    exports.token = function(tokenType, value) {
      var matchValue = value !== void 0;
      return function(input) {
        var token = input.head();
        if (token && token.name === tokenType && (!matchValue || token.value === value)) {
          return results2.success(token.value, input.tail(), token.source);
        } else {
          var expected = describeToken({ name: tokenType, value });
          return describeTokenMismatch(input, expected);
        }
      };
    };
    exports.tokenOfType = function(tokenType) {
      return exports.token(tokenType);
    };
    exports.firstOf = function(name, parsers) {
      if (!_2.isArray(parsers)) {
        parsers = Array.prototype.slice.call(arguments, 1);
      }
      return function(input) {
        return lazyIterators2.fromArray(parsers).map(function(parser2) {
          return parser2(input);
        }).filter(function(result2) {
          return result2.isSuccess() || result2.isError();
        }).first() || describeTokenMismatch(input, name);
      };
    };
    exports.then = function(parser2, func) {
      return function(input) {
        var result2 = parser2(input);
        if (!result2.map) {
          console.log(result2);
        }
        return result2.map(func);
      };
    };
    exports.sequence = function() {
      var parsers = Array.prototype.slice.call(arguments, 0);
      var rule = function(input) {
        var result2 = _2.foldl(parsers, function(memo, parser2) {
          var result3 = memo.result;
          var hasCut = memo.hasCut;
          if (!result3.isSuccess()) {
            return { result: result3, hasCut };
          }
          var subResult = parser2(result3.remaining());
          if (subResult.isCut()) {
            return { result: result3, hasCut: true };
          } else if (subResult.isSuccess()) {
            var values2;
            if (parser2.isCaptured) {
              values2 = result3.value().withValue(parser2, subResult.value());
            } else {
              values2 = result3.value();
            }
            var remaining = subResult.remaining();
            var source2 = input.to(remaining);
            return {
              result: results2.success(values2, remaining, source2),
              hasCut
            };
          } else if (hasCut) {
            return { result: results2.error(subResult.errors(), subResult.remaining()), hasCut };
          } else {
            return { result: subResult, hasCut };
          }
        }, { result: results2.success(new SequenceValues(), input), hasCut: false }).result;
        var source = input.to(result2.remaining());
        return result2.map(function(values2) {
          return values2.withValue(exports.sequence.source, source);
        });
      };
      rule.head = function() {
        var firstCapture = _2.find(parsers, isCapturedRule);
        return exports.then(
          rule,
          exports.sequence.extract(firstCapture)
        );
      };
      rule.map = function(func) {
        return exports.then(
          rule,
          function(result2) {
            return func.apply(this, result2.toArray());
          }
        );
      };
      function isCapturedRule(subRule) {
        return subRule.isCaptured;
      }
      return rule;
    };
    var SequenceValues = function(values2, valuesArray) {
      this._values = values2 || {};
      this._valuesArray = valuesArray || [];
    };
    SequenceValues.prototype.withValue = function(rule, value) {
      if (rule.captureName && rule.captureName in this._values) {
        throw new Error('Cannot add second value for capture "' + rule.captureName + '"');
      } else {
        var newValues = _2.clone(this._values);
        newValues[rule.captureName] = value;
        var newValuesArray = this._valuesArray.concat([value]);
        return new SequenceValues(newValues, newValuesArray);
      }
    };
    SequenceValues.prototype.get = function(rule) {
      if (rule.captureName in this._values) {
        return this._values[rule.captureName];
      } else {
        throw new Error('No value for capture "' + rule.captureName + '"');
      }
    };
    SequenceValues.prototype.toArray = function() {
      return this._valuesArray;
    };
    exports.sequence.capture = function(rule, name) {
      var captureRule = function() {
        return rule.apply(this, arguments);
      };
      captureRule.captureName = name;
      captureRule.isCaptured = true;
      return captureRule;
    };
    exports.sequence.extract = function(rule) {
      return function(result2) {
        return result2.get(rule);
      };
    };
    exports.sequence.applyValues = function(func) {
      var rules2 = Array.prototype.slice.call(arguments, 1);
      return function(result2) {
        var values2 = rules2.map(function(rule) {
          return result2.get(rule);
        });
        return func.apply(this, values2);
      };
    };
    exports.sequence.source = {
      captureName: "☃source☃"
    };
    exports.sequence.cut = function() {
      return function(input) {
        return results2.cut(input);
      };
    };
    exports.optional = function(rule) {
      return function(input) {
        var result2 = rule(input);
        if (result2.isSuccess()) {
          return result2.map(options.some);
        } else if (result2.isFailure()) {
          return results2.success(options.none, input);
        } else {
          return result2;
        }
      };
    };
    exports.zeroOrMoreWithSeparator = function(rule, separator) {
      return repeatedWithSeparator(rule, separator, false);
    };
    exports.oneOrMoreWithSeparator = function(rule, separator) {
      return repeatedWithSeparator(rule, separator, true);
    };
    var zeroOrMore = exports.zeroOrMore = function(rule) {
      return function(input) {
        var values2 = [];
        var result2;
        while ((result2 = rule(input)) && result2.isSuccess()) {
          input = result2.remaining();
          values2.push(result2.value());
        }
        if (result2.isError()) {
          return result2;
        } else {
          return results2.success(values2, input);
        }
      };
    };
    exports.oneOrMore = function(rule) {
      return exports.oneOrMoreWithSeparator(rule, noOpRule);
    };
    function noOpRule(input) {
      return results2.success(null, input);
    }
    var repeatedWithSeparator = function(rule, separator, isOneOrMore) {
      return function(input) {
        var result2 = rule(input);
        if (result2.isSuccess()) {
          var mainRule = exports.sequence.capture(rule, "main");
          var remainingRule = zeroOrMore(exports.then(
            exports.sequence(separator, mainRule),
            exports.sequence.extract(mainRule)
          ));
          var remainingResult = remainingRule(result2.remaining());
          return results2.success([result2.value()].concat(remainingResult.value()), remainingResult.remaining());
        } else if (isOneOrMore || result2.isError()) {
          return result2;
        } else {
          return results2.success([], input);
        }
      };
    };
    exports.leftAssociative = function(leftRule, rightRule, func) {
      var rights;
      if (func) {
        rights = [{ func, rule: rightRule }];
      } else {
        rights = rightRule;
      }
      rights = rights.map(function(right) {
        return exports.then(right.rule, function(rightValue) {
          return function(leftValue, source) {
            return right.func(leftValue, rightValue, source);
          };
        });
      });
      var repeatedRule = exports.firstOf.apply(null, ["rules"].concat(rights));
      return function(input) {
        var start = input;
        var leftResult = leftRule(input);
        if (!leftResult.isSuccess()) {
          return leftResult;
        }
        var repeatedResult = repeatedRule(leftResult.remaining());
        while (repeatedResult.isSuccess()) {
          var remaining = repeatedResult.remaining();
          var source = start.to(repeatedResult.remaining());
          var right = repeatedResult.value();
          leftResult = results2.success(
            right(leftResult.value(), source),
            remaining,
            source
          );
          repeatedResult = repeatedRule(leftResult.remaining());
        }
        if (repeatedResult.isError()) {
          return repeatedResult;
        }
        return leftResult;
      };
    };
    exports.leftAssociative.firstOf = function() {
      return Array.prototype.slice.call(arguments, 0);
    };
    exports.nonConsuming = function(rule) {
      return function(input) {
        return rule(input).changeRemaining(input);
      };
    };
    var describeToken = function(token) {
      if (token.value) {
        return token.name + ' "' + token.value + '"';
      } else {
        return token.name;
      }
    };
    function describeTokenMismatch(input, expected) {
      var error;
      var token = input.head();
      if (token) {
        error = errors2.error({
          expected,
          actual: describeToken(token),
          location: token.source
        });
      } else {
        error = errors2.error({
          expected,
          actual: "end of tokens"
        });
      }
      return results2.failure([error], input);
    }
  })(rules);
  return rules;
}
var StringSource = { exports: {} };
var hasRequiredStringSource;
function requireStringSource() {
  if (hasRequiredStringSource) return StringSource.exports;
  hasRequiredStringSource = 1;
  StringSource.exports = function(string, description) {
    var self2 = {
      asString: function() {
        return string;
      },
      range: function(startIndex, endIndex) {
        return new StringSourceRange(string, description, startIndex, endIndex);
      }
    };
    return self2;
  };
  var StringSourceRange = function(string, description, startIndex, endIndex) {
    this._string = string;
    this._description = description;
    this._startIndex = startIndex;
    this._endIndex = endIndex;
  };
  StringSourceRange.prototype.to = function(otherRange) {
    return new StringSourceRange(this._string, this._description, this._startIndex, otherRange._endIndex);
  };
  StringSourceRange.prototype.describe = function() {
    var position = this._position();
    var description = this._description ? this._description + "\n" : "";
    return description + "Line number: " + position.lineNumber + "\nCharacter number: " + position.characterNumber;
  };
  StringSourceRange.prototype.lineNumber = function() {
    return this._position().lineNumber;
  };
  StringSourceRange.prototype.characterNumber = function() {
    return this._position().characterNumber;
  };
  StringSourceRange.prototype._position = function() {
    var self2 = this;
    var index2 = 0;
    var nextNewLine = function() {
      return self2._string.indexOf("\n", index2);
    };
    var lineNumber = 1;
    while (nextNewLine() !== -1 && nextNewLine() < this._startIndex) {
      index2 = nextNewLine() + 1;
      lineNumber += 1;
    }
    var characterNumber = this._startIndex - index2 + 1;
    return { lineNumber, characterNumber };
  };
  return StringSource.exports;
}
var Token;
var hasRequiredToken;
function requireToken() {
  if (hasRequiredToken) return Token;
  hasRequiredToken = 1;
  Token = function(name, value, source) {
    this.name = name;
    this.value = value;
    if (source) {
      this.source = source;
    }
  };
  return Token;
}
var bottomUp = {};
var hasRequiredBottomUp;
function requireBottomUp() {
  if (hasRequiredBottomUp) return bottomUp;
  hasRequiredBottomUp = 1;
  (function(exports) {
    var rules2 = requireRules();
    var results2 = requireParsingResults();
    exports.parser = function(name, prefixRules, infixRuleBuilders) {
      var self2 = {
        rule,
        leftAssociative,
        rightAssociative
      };
      var infixRules = new InfixRules(infixRuleBuilders.map(createInfixRule));
      var prefixRule = rules2.firstOf(name, prefixRules);
      function createInfixRule(infixRuleBuilder) {
        return {
          name: infixRuleBuilder.name,
          rule: lazyRule(infixRuleBuilder.ruleBuilder.bind(null, self2))
        };
      }
      function rule() {
        return createRule(infixRules);
      }
      function leftAssociative(name2) {
        return createRule(infixRules.untilExclusive(name2));
      }
      function rightAssociative(name2) {
        return createRule(infixRules.untilInclusive(name2));
      }
      function createRule(infixRules2) {
        return apply.bind(null, infixRules2);
      }
      function apply(infixRules2, tokens) {
        var leftResult = prefixRule(tokens);
        if (leftResult.isSuccess()) {
          return infixRules2.apply(leftResult);
        } else {
          return leftResult;
        }
      }
      return self2;
    };
    function InfixRules(infixRules) {
      function untilExclusive(name) {
        return new InfixRules(infixRules.slice(0, ruleNames().indexOf(name)));
      }
      function untilInclusive(name) {
        return new InfixRules(infixRules.slice(0, ruleNames().indexOf(name) + 1));
      }
      function ruleNames() {
        return infixRules.map(function(rule) {
          return rule.name;
        });
      }
      function apply(leftResult) {
        var currentResult;
        var source;
        while (true) {
          currentResult = applyToTokens(leftResult.remaining());
          if (currentResult.isSuccess()) {
            source = leftResult.source().to(currentResult.source());
            leftResult = results2.success(
              currentResult.value()(leftResult.value(), source),
              currentResult.remaining(),
              source
            );
          } else if (currentResult.isFailure()) {
            return leftResult;
          } else {
            return currentResult;
          }
        }
      }
      function applyToTokens(tokens) {
        return rules2.firstOf("infix", infixRules.map(function(infix) {
          return infix.rule;
        }))(tokens);
      }
      return {
        apply,
        untilExclusive,
        untilInclusive
      };
    }
    exports.infix = function(name, ruleBuilder) {
      function map2(func) {
        return exports.infix(name, function(parser2) {
          var rule = ruleBuilder(parser2);
          return function(tokens) {
            var result2 = rule(tokens);
            return result2.map(function(right) {
              return function(left, source) {
                return func(left, right, source);
              };
            });
          };
        });
      }
      return {
        name,
        ruleBuilder,
        map: map2
      };
    };
    var lazyRule = function(ruleBuilder) {
      var rule;
      return function(input) {
        if (!rule) {
          rule = ruleBuilder();
        }
        return rule(input);
      };
    };
  })(bottomUp);
  return bottomUp;
}
var regexTokeniser = {};
var hasRequiredRegexTokeniser;
function requireRegexTokeniser() {
  if (hasRequiredRegexTokeniser) return regexTokeniser;
  hasRequiredRegexTokeniser = 1;
  var Token2 = requireToken();
  var StringSource2 = requireStringSource();
  regexTokeniser.RegexTokeniser = RegexTokeniser;
  function RegexTokeniser(rules2) {
    rules2 = rules2.map(function(rule) {
      return {
        name: rule.name,
        regex: new RegExp(rule.regex.source, "g")
      };
    });
    function tokenise(input, description) {
      var source = new StringSource2(input, description);
      var index2 = 0;
      var tokens = [];
      while (index2 < input.length) {
        var result2 = readNextToken(input, index2, source);
        index2 = result2.endIndex;
        tokens.push(result2.token);
      }
      tokens.push(endToken(input, source));
      return tokens;
    }
    function readNextToken(string, startIndex, source) {
      for (var i = 0; i < rules2.length; i++) {
        var regex = rules2[i].regex;
        regex.lastIndex = startIndex;
        var result2 = regex.exec(string);
        if (result2) {
          var endIndex = startIndex + result2[0].length;
          if (result2.index === startIndex && endIndex > startIndex) {
            var value = result2[1];
            var token = new Token2(
              rules2[i].name,
              value,
              source.range(startIndex, endIndex)
            );
            return { token, endIndex };
          }
        }
      }
      var endIndex = startIndex + 1;
      var token = new Token2(
        "unrecognisedCharacter",
        string.substring(startIndex, endIndex),
        source.range(startIndex, endIndex)
      );
      return { token, endIndex };
    }
    function endToken(input, source) {
      return new Token2(
        "end",
        null,
        source.range(input.length, input.length)
      );
    }
    return {
      tokenise
    };
  }
  return regexTokeniser;
}
var hasRequiredLop;
function requireLop() {
  if (hasRequiredLop) return lop;
  hasRequiredLop = 1;
  lop.Parser = requireParser().Parser;
  lop.rules = requireRules();
  lop.errors = requireErrors();
  lop.results = requireParsingResults();
  lop.StringSource = requireStringSource();
  lop.Token = requireToken();
  lop.bottomUp = requireBottomUp();
  lop.RegexTokeniser = requireRegexTokeniser().RegexTokeniser;
  lop.rule = function(ruleBuilder) {
    var rule;
    return function(input) {
      if (!rule) {
        rule = ruleBuilder();
      }
      return rule(input);
    };
  };
  return lop;
}
var documentMatchers = {};
var hasRequiredDocumentMatchers;
function requireDocumentMatchers() {
  if (hasRequiredDocumentMatchers) return documentMatchers;
  hasRequiredDocumentMatchers = 1;
  documentMatchers.paragraph = paragraph;
  documentMatchers.run = run;
  documentMatchers.table = table;
  documentMatchers.bold = new Matcher("bold");
  documentMatchers.italic = new Matcher("italic");
  documentMatchers.underline = new Matcher("underline");
  documentMatchers.strikethrough = new Matcher("strikethrough");
  documentMatchers.allCaps = new Matcher("allCaps");
  documentMatchers.smallCaps = new Matcher("smallCaps");
  documentMatchers.highlight = highlight;
  documentMatchers.commentReference = new Matcher("commentReference");
  documentMatchers.lineBreak = new BreakMatcher({ breakType: "line" });
  documentMatchers.pageBreak = new BreakMatcher({ breakType: "page" });
  documentMatchers.columnBreak = new BreakMatcher({ breakType: "column" });
  documentMatchers.equalTo = equalTo;
  documentMatchers.startsWith = startsWith;
  function paragraph(options) {
    return new Matcher("paragraph", options);
  }
  function run(options) {
    return new Matcher("run", options);
  }
  function table(options) {
    return new Matcher("table", options);
  }
  function highlight(options) {
    return new HighlightMatcher(options);
  }
  function Matcher(elementType, options) {
    options = options || {};
    this._elementType = elementType;
    this._styleId = options.styleId;
    this._styleName = options.styleName;
    if (options.list) {
      this._listIndex = options.list.levelIndex;
      this._listIsOrdered = options.list.isOrdered;
    }
  }
  Matcher.prototype.matches = function(element) {
    return element.type === this._elementType && (this._styleId === void 0 || element.styleId === this._styleId) && (this._styleName === void 0 || element.styleName && this._styleName.operator(this._styleName.operand, element.styleName)) && (this._listIndex === void 0 || isList(element, this._listIndex, this._listIsOrdered)) && (this._breakType === void 0 || this._breakType === element.breakType);
  };
  function HighlightMatcher(options) {
    options = options || {};
    this._color = options.color;
  }
  HighlightMatcher.prototype.matches = function(element) {
    return element.type === "highlight" && (this._color === void 0 || element.color === this._color);
  };
  function BreakMatcher(options) {
    options = options || {};
    this._breakType = options.breakType;
  }
  BreakMatcher.prototype.matches = function(element) {
    return element.type === "break" && (this._breakType === void 0 || element.breakType === this._breakType);
  };
  function isList(element, levelIndex, isOrdered) {
    return element.numbering && element.numbering.level == levelIndex && element.numbering.isOrdered == isOrdered;
  }
  function equalTo(value) {
    return {
      operator: operatorEqualTo,
      operand: value
    };
  }
  function startsWith(value) {
    return {
      operator: operatorStartsWith,
      operand: value
    };
  }
  function operatorEqualTo(first2, second) {
    return first2.toUpperCase() === second.toUpperCase();
  }
  function operatorStartsWith(first2, second) {
    return second.toUpperCase().indexOf(first2.toUpperCase()) === 0;
  }
  return documentMatchers;
}
var tokeniser = {};
var hasRequiredTokeniser;
function requireTokeniser() {
  if (hasRequiredTokeniser) return tokeniser;
  hasRequiredTokeniser = 1;
  var lop2 = requireLop();
  var RegexTokeniser = lop2.RegexTokeniser;
  tokeniser.tokenise = tokenise;
  var stringPrefix = "'((?:\\\\(?:.|$)|[^'\\\\])*)";
  function tokenise(string) {
    var identifierCharacter = "(?:[a-zA-Z\\-_]|\\\\.)";
    var tokeniser2 = new RegexTokeniser([
      { name: "identifier", regex: new RegExp("(" + identifierCharacter + "(?:" + identifierCharacter + "|[0-9])*)") },
      { name: "dot", regex: /\./ },
      { name: "colon", regex: /:/ },
      { name: "gt", regex: />/ },
      { name: "whitespace", regex: /\s+/ },
      { name: "arrow", regex: /=>/ },
      { name: "equals", regex: /=/ },
      { name: "startsWith", regex: /\^=/ },
      { name: "open-paren", regex: /\(/ },
      { name: "close-paren", regex: /\)/ },
      { name: "open-square-bracket", regex: /\[/ },
      { name: "close-square-bracket", regex: /\]/ },
      { name: "string", regex: new RegExp(stringPrefix + "'") },
      { name: "unterminated-string", regex: new RegExp(stringPrefix) },
      { name: "integer", regex: /([0-9]+)/ },
      { name: "choice", regex: /\|/ },
      { name: "bang", regex: /(!)/ }
    ]);
    return tokeniser2.tokenise(string);
  }
  return tokeniser;
}
var hasRequiredStyleReader;
function requireStyleReader() {
  if (hasRequiredStyleReader) return styleReader;
  hasRequiredStyleReader = 1;
  var _2 = require$$0;
  var lop2 = requireLop();
  var documentMatchers2 = requireDocumentMatchers();
  var htmlPaths2 = requireHtmlPaths();
  var tokenise = requireTokeniser().tokenise;
  var results2 = requireResults();
  styleReader.readHtmlPath = readHtmlPath;
  styleReader.readDocumentMatcher = readDocumentMatcher;
  styleReader.readStyle = readStyle;
  function readStyle(string) {
    return parseString(styleRule, string);
  }
  function createStyleRule() {
    return lop2.rules.sequence(
      lop2.rules.sequence.capture(documentMatcherRule()),
      lop2.rules.tokenOfType("whitespace"),
      lop2.rules.tokenOfType("arrow"),
      lop2.rules.sequence.capture(lop2.rules.optional(lop2.rules.sequence(
        lop2.rules.tokenOfType("whitespace"),
        lop2.rules.sequence.capture(htmlPathRule())
      ).head())),
      lop2.rules.tokenOfType("end")
    ).map(function(documentMatcher, htmlPath) {
      return {
        from: documentMatcher,
        to: htmlPath.valueOrElse(htmlPaths2.empty)
      };
    });
  }
  function readDocumentMatcher(string) {
    return parseString(documentMatcherRule(), string);
  }
  function documentMatcherRule() {
    var sequence = lop2.rules.sequence;
    var identifierToConstant = function(identifier, constant2) {
      return lop2.rules.then(
        lop2.rules.token("identifier", identifier),
        function() {
          return constant2;
        }
      );
    };
    var paragraphRule = identifierToConstant("p", documentMatchers2.paragraph);
    var runRule = identifierToConstant("r", documentMatchers2.run);
    var elementTypeRule = lop2.rules.firstOf(
      "p or r or table",
      paragraphRule,
      runRule
    );
    var styleIdRule = lop2.rules.sequence(
      lop2.rules.tokenOfType("dot"),
      lop2.rules.sequence.cut(),
      lop2.rules.sequence.capture(identifierRule)
    ).map(function(styleId) {
      return { styleId };
    });
    var styleNameMatcherRule = lop2.rules.firstOf(
      "style name matcher",
      lop2.rules.then(
        lop2.rules.sequence(
          lop2.rules.tokenOfType("equals"),
          lop2.rules.sequence.cut(),
          lop2.rules.sequence.capture(stringRule)
        ).head(),
        function(styleName) {
          return { styleName: documentMatchers2.equalTo(styleName) };
        }
      ),
      lop2.rules.then(
        lop2.rules.sequence(
          lop2.rules.tokenOfType("startsWith"),
          lop2.rules.sequence.cut(),
          lop2.rules.sequence.capture(stringRule)
        ).head(),
        function(styleName) {
          return { styleName: documentMatchers2.startsWith(styleName) };
        }
      )
    );
    var styleNameRule = lop2.rules.sequence(
      lop2.rules.tokenOfType("open-square-bracket"),
      lop2.rules.sequence.cut(),
      lop2.rules.token("identifier", "style-name"),
      lop2.rules.sequence.capture(styleNameMatcherRule),
      lop2.rules.tokenOfType("close-square-bracket")
    ).head();
    var listTypeRule = lop2.rules.firstOf(
      "list type",
      identifierToConstant("ordered-list", { isOrdered: true }),
      identifierToConstant("unordered-list", { isOrdered: false })
    );
    var listRule = sequence(
      lop2.rules.tokenOfType("colon"),
      sequence.capture(listTypeRule),
      sequence.cut(),
      lop2.rules.tokenOfType("open-paren"),
      sequence.capture(integerRule),
      lop2.rules.tokenOfType("close-paren")
    ).map(function(listType, levelNumber) {
      return {
        list: {
          isOrdered: listType.isOrdered,
          levelIndex: levelNumber - 1
        }
      };
    });
    function createMatcherSuffixesRule(rules2) {
      var matcherSuffix = lop2.rules.firstOf.apply(
        lop2.rules.firstOf,
        ["matcher suffix"].concat(rules2)
      );
      var matcherSuffixes = lop2.rules.zeroOrMore(matcherSuffix);
      return lop2.rules.then(matcherSuffixes, function(suffixes) {
        var matcherOptions = {};
        suffixes.forEach(function(suffix) {
          _2.extend(matcherOptions, suffix);
        });
        return matcherOptions;
      });
    }
    var paragraphOrRun = sequence(
      sequence.capture(elementTypeRule),
      sequence.capture(createMatcherSuffixesRule([
        styleIdRule,
        styleNameRule,
        listRule
      ]))
    ).map(function(createMatcher, matcherOptions) {
      return createMatcher(matcherOptions);
    });
    var table = sequence(
      lop2.rules.token("identifier", "table"),
      sequence.capture(createMatcherSuffixesRule([
        styleIdRule,
        styleNameRule
      ]))
    ).map(function(options) {
      return documentMatchers2.table(options);
    });
    var bold = identifierToConstant("b", documentMatchers2.bold);
    var italic = identifierToConstant("i", documentMatchers2.italic);
    var underline2 = identifierToConstant("u", documentMatchers2.underline);
    var strikethrough = identifierToConstant("strike", documentMatchers2.strikethrough);
    var allCaps = identifierToConstant("all-caps", documentMatchers2.allCaps);
    var smallCaps = identifierToConstant("small-caps", documentMatchers2.smallCaps);
    var highlight = sequence(
      lop2.rules.token("identifier", "highlight"),
      lop2.rules.sequence.capture(lop2.rules.optional(lop2.rules.sequence(
        lop2.rules.tokenOfType("open-square-bracket"),
        lop2.rules.sequence.cut(),
        lop2.rules.token("identifier", "color"),
        lop2.rules.tokenOfType("equals"),
        lop2.rules.sequence.capture(stringRule),
        lop2.rules.tokenOfType("close-square-bracket")
      ).head()))
    ).map(function(color) {
      return documentMatchers2.highlight({
        color: color.valueOrElse(void 0)
      });
    });
    var commentReference = identifierToConstant("comment-reference", documentMatchers2.commentReference);
    var breakMatcher = sequence(
      lop2.rules.token("identifier", "br"),
      sequence.cut(),
      lop2.rules.tokenOfType("open-square-bracket"),
      lop2.rules.token("identifier", "type"),
      lop2.rules.tokenOfType("equals"),
      sequence.capture(stringRule),
      lop2.rules.tokenOfType("close-square-bracket")
    ).map(function(breakType) {
      switch (breakType) {
        case "line":
          return documentMatchers2.lineBreak;
        case "page":
          return documentMatchers2.pageBreak;
        case "column":
          return documentMatchers2.columnBreak;
      }
    });
    return lop2.rules.firstOf(
      "element type",
      paragraphOrRun,
      table,
      bold,
      italic,
      underline2,
      strikethrough,
      allCaps,
      smallCaps,
      highlight,
      commentReference,
      breakMatcher
    );
  }
  function readHtmlPath(string) {
    return parseString(htmlPathRule(), string);
  }
  function htmlPathRule() {
    var capture = lop2.rules.sequence.capture;
    var whitespaceRule = lop2.rules.tokenOfType("whitespace");
    var freshRule = lop2.rules.then(
      lop2.rules.optional(lop2.rules.sequence(
        lop2.rules.tokenOfType("colon"),
        lop2.rules.token("identifier", "fresh")
      )),
      function(option2) {
        return option2.map(function() {
          return true;
        }).valueOrElse(false);
      }
    );
    var separatorRule = lop2.rules.then(
      lop2.rules.optional(lop2.rules.sequence(
        lop2.rules.tokenOfType("colon"),
        lop2.rules.token("identifier", "separator"),
        lop2.rules.tokenOfType("open-paren"),
        capture(stringRule),
        lop2.rules.tokenOfType("close-paren")
      ).head()),
      function(option2) {
        return option2.valueOrElse("");
      }
    );
    var tagNamesRule = lop2.rules.oneOrMoreWithSeparator(
      identifierRule,
      lop2.rules.tokenOfType("choice")
    );
    var styleElementRule = lop2.rules.sequence(
      capture(tagNamesRule),
      capture(lop2.rules.zeroOrMore(attributeOrClassRule)),
      capture(freshRule),
      capture(separatorRule)
    ).map(function(tagName, attributesList, fresh, separator) {
      var attributes = /* @__PURE__ */ Object.create(null);
      var options = {};
      attributesList.forEach(function(attribute) {
        if (attribute.append && attributes[attribute.name]) {
          attributes[attribute.name] += " " + attribute.value;
        } else {
          attributes[attribute.name] = attribute.value;
        }
      });
      if (fresh) {
        options.fresh = true;
      }
      if (separator) {
        options.separator = separator;
      }
      return htmlPaths2.element(tagName, attributes, options);
    });
    return lop2.rules.firstOf(
      "html path",
      lop2.rules.then(lop2.rules.tokenOfType("bang"), function() {
        return htmlPaths2.ignore;
      }),
      lop2.rules.then(
        lop2.rules.zeroOrMoreWithSeparator(
          styleElementRule,
          lop2.rules.sequence(
            whitespaceRule,
            lop2.rules.tokenOfType("gt"),
            whitespaceRule
          )
        ),
        htmlPaths2.elements
      )
    );
  }
  var identifierRule = lop2.rules.then(
    lop2.rules.tokenOfType("identifier"),
    decodeEscapeSequences
  );
  var integerRule = lop2.rules.tokenOfType("integer");
  var stringRule = lop2.rules.then(
    lop2.rules.tokenOfType("string"),
    decodeEscapeSequences
  );
  var escapeSequences = {
    "n": "\n",
    "r": "\r",
    "t": "	"
  };
  function decodeEscapeSequences(value) {
    return value.replace(/\\(.)/g, function(match, code) {
      return escapeSequences[code] || code;
    });
  }
  var attributeRule = lop2.rules.sequence(
    lop2.rules.tokenOfType("open-square-bracket"),
    lop2.rules.sequence.cut(),
    lop2.rules.sequence.capture(identifierRule),
    lop2.rules.tokenOfType("equals"),
    lop2.rules.sequence.capture(stringRule),
    lop2.rules.tokenOfType("close-square-bracket")
  ).map(function(name, value) {
    return { name, value, append: false };
  });
  var classRule = lop2.rules.sequence(
    lop2.rules.tokenOfType("dot"),
    lop2.rules.sequence.cut(),
    lop2.rules.sequence.capture(identifierRule)
  ).map(function(className) {
    return { name: "class", value: className, append: true };
  });
  var attributeOrClassRule = lop2.rules.firstOf(
    "attribute or class",
    attributeRule,
    classRule
  );
  function parseString(rule, string) {
    var tokens = tokenise(string);
    var parser2 = lop2.Parser();
    var parseResult = parser2.parseTokens(rule, tokens);
    if (parseResult.isSuccess()) {
      return results2.success(parseResult.value());
    } else {
      return new results2.Result(null, [results2.warning(describeFailure(string, parseResult))]);
    }
  }
  function describeFailure(input, parseResult) {
    return "Did not understand this style mapping, so ignored it: " + input + "\n" + parseResult.errors().map(describeError).join("\n");
  }
  function describeError(error) {
    return "Error was at character number " + error.characterNumber() + ": Expected " + error.expected + " but got " + error.actual;
  }
  var styleRule = createStyleRule();
  return styleReader;
}
var optionsReader = {};
var hasRequiredOptionsReader;
function requireOptionsReader() {
  if (hasRequiredOptionsReader) return optionsReader;
  hasRequiredOptionsReader = 1;
  optionsReader.readOptions = readOptions;
  var _2 = require$$0;
  var defaultStyleMap = optionsReader._defaultStyleMap = [
    "p.Heading1 => h1:fresh",
    "p.Heading2 => h2:fresh",
    "p.Heading3 => h3:fresh",
    "p.Heading4 => h4:fresh",
    "p.Heading5 => h5:fresh",
    "p.Heading6 => h6:fresh",
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh",
    "p[style-name='Heading 3'] => h3:fresh",
    "p[style-name='Heading 4'] => h4:fresh",
    "p[style-name='Heading 5'] => h5:fresh",
    "p[style-name='Heading 6'] => h6:fresh",
    "p[style-name='heading 1'] => h1:fresh",
    "p[style-name='heading 2'] => h2:fresh",
    "p[style-name='heading 3'] => h3:fresh",
    "p[style-name='heading 4'] => h4:fresh",
    "p[style-name='heading 5'] => h5:fresh",
    "p[style-name='heading 6'] => h6:fresh",
    // Apple Pages
    "p.Heading => h1:fresh",
    "p[style-name='Heading'] => h1:fresh",
    "r[style-name='Strong'] => strong",
    "p[style-name='footnote text'] => p:fresh",
    "r[style-name='footnote reference'] =>",
    "p[style-name='endnote text'] => p:fresh",
    "r[style-name='endnote reference'] =>",
    "p[style-name='annotation text'] => p:fresh",
    "r[style-name='annotation reference'] =>",
    // LibreOffice
    "p[style-name='Footnote'] => p:fresh",
    "r[style-name='Footnote anchor'] =>",
    "p[style-name='Endnote'] => p:fresh",
    "r[style-name='Endnote anchor'] =>",
    "p:unordered-list(1) => ul > li:fresh",
    "p:unordered-list(2) => ul|ol > li > ul > li:fresh",
    "p:unordered-list(3) => ul|ol > li > ul|ol > li > ul > li:fresh",
    "p:unordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh",
    "p:unordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ul > li:fresh",
    "p:ordered-list(1) => ol > li:fresh",
    "p:ordered-list(2) => ul|ol > li > ol > li:fresh",
    "p:ordered-list(3) => ul|ol > li > ul|ol > li > ol > li:fresh",
    "p:ordered-list(4) => ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh",
    "p:ordered-list(5) => ul|ol > li > ul|ol > li > ul|ol > li > ul|ol > li > ol > li:fresh",
    "r[style-name='Hyperlink'] =>",
    "p[style-name='Normal'] => p:fresh",
    // Apple Pages
    "p.Body => p:fresh",
    "p[style-name='Body'] => p:fresh"
  ];
  var standardOptions = optionsReader._standardOptions = {
    externalFileAccess: false,
    transformDocument: identity2,
    includeDefaultStyleMap: true,
    includeEmbeddedStyleMap: true
  };
  function readOptions(options) {
    options = options || {};
    return _2.extend({}, standardOptions, options, {
      customStyleMap: readStyleMap(options.styleMap),
      readStyleMap: function() {
        var styleMap2 = this.customStyleMap;
        if (this.includeEmbeddedStyleMap) {
          styleMap2 = styleMap2.concat(readStyleMap(this.embeddedStyleMap));
        }
        if (this.includeDefaultStyleMap) {
          styleMap2 = styleMap2.concat(defaultStyleMap);
        }
        return styleMap2;
      }
    });
  }
  function readStyleMap(styleMap2) {
    if (!styleMap2) {
      return [];
    } else if (_2.isString(styleMap2)) {
      return styleMap2.split("\n").map(function(line) {
        return line.trim();
      }).filter(function(line) {
        return line !== "" && line.charAt(0) !== "#";
      });
    } else {
      return styleMap2;
    }
  }
  function identity2(value) {
    return value;
  }
  return optionsReader;
}
var unzip = {};
var hasRequiredUnzip;
function requireUnzip() {
  if (hasRequiredUnzip) return unzip;
  hasRequiredUnzip = 1;
  var promises2 = requirePromises();
  var zipfile2 = requireZipfile();
  unzip.openZip = openZip;
  function openZip(options) {
    if (options.arrayBuffer) {
      return promises2.resolve(zipfile2.openArrayBuffer(options.arrayBuffer));
    } else {
      return promises2.reject(new Error("Could not find file in options"));
    }
  }
  return unzip;
}
var underline = {};
var hasRequiredUnderline;
function requireUnderline() {
  if (hasRequiredUnderline) return underline;
  hasRequiredUnderline = 1;
  var htmlPaths2 = requireHtmlPaths();
  var Html = requireHtml();
  underline.element = element;
  function element(name) {
    return function(html2) {
      return Html.elementWithTag(htmlPaths2.element(name), [html2]);
    };
  }
  return underline;
}
var hasRequiredLib;
function requireLib() {
  if (hasRequiredLib) return lib$2;
  hasRequiredLib = 1;
  var _2 = require$$0;
  var docxReader2 = requireDocxReader();
  var docxStyleMap = requireStyleMap();
  var DocumentConverter = requireDocumentToHtml().DocumentConverter;
  var convertElementToRawText = requireRawText().convertElementToRawText;
  var readStyle = requireStyleReader().readStyle;
  var readOptions = requireOptionsReader().readOptions;
  var promises2 = requirePromises();
  var unzip2 = requireUnzip();
  var Result = requireResults().Result;
  lib$2.convertToHtml = convertToHtml;
  lib$2.convertToMarkdown = convertToMarkdown;
  lib$2.convert = convert;
  lib$2.extractRawText = extractRawText;
  lib$2.images = requireImages();
  lib$2.transforms = requireTransforms();
  lib$2.underline = requireUnderline();
  lib$2.embedStyleMap = embedStyleMap;
  lib$2.readEmbeddedStyleMap = readEmbeddedStyleMap;
  function convertToHtml(input, options) {
    return convert(input, options);
  }
  function convertToMarkdown(input, options) {
    var markdownOptions = Object.create(options || {});
    markdownOptions.outputFormat = "markdown";
    return convert(input, markdownOptions);
  }
  function convert(input, options) {
    options = readOptions(options);
    var result2 = unzip2.openZip(input).then(function(docxFile) {
      return docxStyleMap.readStyleMap(docxFile).then(function(styleMap2) {
        options.embeddedStyleMap = styleMap2;
        return docxFile;
      });
    }).then(function(docxFile) {
      return docxReader2.read(docxFile, input, options).then(function(documentResult) {
        return documentResult.map(options.transformDocument);
      }).then(function(documentResult) {
        return convertDocumentToHtml(documentResult, options);
      });
    });
    return promises2.toExternalPromise(result2);
  }
  function readEmbeddedStyleMap(input) {
    var result2 = unzip2.openZip(input).then(docxStyleMap.readStyleMap);
    return promises2.toExternalPromise(result2);
  }
  function convertDocumentToHtml(documentResult, options) {
    var styleMapResult = parseStyleMap(options.readStyleMap());
    var parsedOptions = _2.extend({}, options, {
      styleMap: styleMapResult.value
    });
    var documentConverter = new DocumentConverter(parsedOptions);
    return documentResult.flatMapThen(function(document) {
      return styleMapResult.flatMapThen(function(styleMap2) {
        return documentConverter.convertToHtml(document);
      });
    });
  }
  function parseStyleMap(styleMap2) {
    return Result.combine((styleMap2 || []).map(readStyle)).map(function(styleMap3) {
      return styleMap3.filter(function(styleMapping) {
        return !!styleMapping;
      });
    });
  }
  function extractRawText(input) {
    var result2 = unzip2.openZip(input).then(docxReader2.read).then(function(documentResult) {
      return documentResult.map(convertElementToRawText);
    });
    return promises2.toExternalPromise(result2);
  }
  function embedStyleMap(input, styleMap2) {
    var result2 = unzip2.openZip(input).then(function(docxFile) {
      return docxStyleMap.writeStyleMap(docxFile, styleMap2).then(function() {
        return docxFile;
      });
    }).then(function(docxFile) {
      return docxFile.toArrayBuffer();
    }).then(function(arrayBuffer) {
      return {
        toArrayBuffer: function() {
          return arrayBuffer;
        },
        toBuffer: function() {
          return Buffer.from(arrayBuffer);
        }
      };
    });
    return promises2.toExternalPromise(result2);
  }
  lib$2.styleMapping = function() {
    throw new Error(`Use a raw string instead of mammoth.styleMapping e.g. "p[style-name='Title'] => h1" instead of mammoth.styleMapping("p[style-name='Title'] => h1")`);
  };
  return lib$2;
}
var libExports = requireLib();
const index = /* @__PURE__ */ getDefaultExportFromCjs(libExports);
const index$1 = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null,
  default: index
}, [libExports]);
export {
  index$1 as i
};
