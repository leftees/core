// registering body parser for multipart/form-data (uses multiparty node module)
platform.server.http.context.parsers.register('multipart/form-data',function(request,callback) {
  // instancing multipart parser with content size limit and temporary directory for uploaded files
  (new native.body.multipart({
    maxFilesSize: request.limit,
    autoFields: true,
    autoFiles: true,
    uploadDir: platform.io.resolveSync('/tmp/').fullpath
  })).parse(request, function (err, fields, files) {
      if (err) {
        callback(err);
        return;
      }
      // creating result object
      var result = {};
      // extracting fields from content data
      Object.keys(fields).forEach(function(name) {
        result[name] = fields[name];
      });
      // extracting files from content data
      Object.keys(files).forEach(function(name) {
        // replacing each file info with read stream for each file
        files[name].forEach(function(file,index,collection){
          collection[index] = platform.io.backends.system.get.streamSync(file.path);
          collection[index].fieldName = file.fieldName;
          collection[index].originalFilename = file.originalFilename;
          collection[index].path = file.path;
          collection[index].headers = file.headers;
          collection[index].size = file.size;
        });
        // extending fields with files preserving data through arrays (consistent with multiparty internals)
        if (result.hasOwnProperty(name) === true) {
          result[name] = result[name].concat(files[name]);
        } else {
          result[name] = files[name];
        }
      });
      // flattening single item arrays
      Object.keys(result).forEach(function(name) {
        if (result[name].length === 1) {
          result[name] = result[name][0];
        }
      });
      callback(null,result);
    });
});