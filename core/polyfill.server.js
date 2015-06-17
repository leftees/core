/**
 * Returns a human readable timespan.
*/
Number.toHumanTime = function (elapsed) {
  var labels = ['ms', 's', 'm', 'h', 'd'];
  var sizes = [1000, 60, 60, 24 ];
  var data = [];
  sizes.forEach(function(value){
    data.push(elapsed % value);
    elapsed = parseInt(elapsed/value);
  });
  var pos = 0;
  data.forEach(function(value,index){
    if(value > 0){
      pos = index;
    }
  });
  var result = data[pos];
  if (pos > 0) {
    result += '.' + parseInt(data[pos-1]/sizes[pos-1]*10);
  }
  result += labels[pos];
  return result;
};

/**
 * Returns human readable byte size.
*/
Number.toHumanSize = function (bytes) {
  var labels = ['Bytes', 'kB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return 'n/a';
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + labels[i];
};

Array.prototype.shift = function(){
  return this.splice(0,1)[0];
};

Array.prototype.pop = function(){
  return this.splice(this.length-1,1)[0];
};

Date.prototype.toCompactString = function() {
  var pad = function(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  };
  return this.getUTCFullYear() +
    pad(this.getUTCMonth() + 1) +
    pad(this.getUTCDate()) +
    pad(this.getUTCHours()) +
    pad(this.getUTCMinutes()) +
    pad(this.getUTCSeconds()) +
    (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
};

String.getLines = function(haystack, from, toIncluding) {
  var i = 0, j = 0;
  haystack = '\n' + haystack;
  --from;
  while (from-->0 && i !== -1)
    --toIncluding, i = haystack.indexOf('\n', i + 1);
  if (i === -1) return '';
  j = i;
  while (toIncluding-->0 && j !== -1)
    j = haystack.indexOf('\n', j + 1);
  if (j === -1) j = haystack.length;
  return haystack.slice(i + 1, j);
};

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, position) {
    var subjectString = this.toString();
    if (position === undefined || position > subjectString.length) {
      position = subjectString.length;
    }
    position -= searchString.length;
    var lastIndex = subjectString.indexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
  };
}

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}