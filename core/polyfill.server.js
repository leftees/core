//T: MISSING CODE DOCUMENTATION
//C: [backporting functionalities that may not exist in some Javascript versions]

//T: MISSING CODE DOCUMENTATION
//C: [extending String class with repeat]
if (!String.prototype.repeat) {
  String.prototype.repeat = function (count) {
    "use strict";
    if (this == null)
      throw new TypeError("can't convert " + this + " to object");
    var str = "" + this;
    count = +count;
    if (count != count)
      count = 0;
    if (count < 0)
      throw new RangeError("repeat count must be non-negative");
    if (count == Infinity)
      throw new RangeError("repeat count must be less than infinity");
    count = Math.floor(count);
    if (str.length == 0 || count == 0)
      return "";
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (august 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so :
    if (str.length * count >= 1 << 28)
      throw new RangeError("repeat count must not overflow maximum string size");
    var rpt = "";
    for (;;) {
      if ((count & 1) == 1)
        rpt += str;
      count >>>= 1;
      if (count == 0)
        break;
      str += str;
    }
    return rpt;
  }
}

//T: MISSING CODE DOCUMENTATION
//C: [extending String class with trim]
if (!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g, '');
  };
}

//T: MISSING CODE DOCUMENTATION
//C: [extending String class with startsWidth]
if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function (searchString, position) {
      position = position || 0;
      return this.lastIndexOf(searchString, position) === position;
    }
  });
}

//T: MISSING CODE DOCUMENTATION
//C: [extending String class with endsWith]
if (!String.prototype.endsWith) {
  Object.defineProperty(String.prototype, 'endsWith', {
    value: function (searchString, position) {
      var subjectString = this.toString();
      if (position === undefined || position > subjectString.length) {
        position = subjectString.length;
      }
      position -= searchString.length;
      var lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position;
    }
  });
}

//T: MISSING CODE DOCUMENTATION
//C: [extending String class with contains
if (!String.prototype.contains) {
  String.prototype.contains = function() {
    return String.prototype.indexOf.apply( this, arguments ) !== -1;
  };
}

//T: MISSING CODE DOCUMENTATION
//C: [defining binding]
if (Function.prototype.bind == null) {
  Function.prototype.bind = function(scope) {
    if (arguments.length == 0 || (arguments.length == 1 && arguments[0] == null))
      return this;
    var FunctionToBind = this;
    var ArgumentsToBind = null;
    if (arguments.length > 1) {
      ArgumentsToBind = Array.prototype.slice.call(arguments);
      ArgumentsToBind.shift();
    } else {
      ArgumentsToBind = [];
    }
    return (function() {
      return FunctionToBind.apply(scope,ArgumentsToBind.concat(Array.prototype.slice.call(arguments)));
    });
  };
}

//T: MISSING CODE DOCUMENTATION
//C: [defining indexOf]
if (Array.prototype.indexOf == null) {
  Array.prototype.indexOf = function(obj,start) {
    for (var Index = (start || 0); Index < this.length; Index++) {
      if (this[Index] === obj) { return Index; }
    }
    return -1;
  };
}