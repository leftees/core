var global =  this;
var self = this;
var bootstrap = function() {
  //C: loading bootloader
  var xhr = undefined;

  //C: create object supporting IE and other browsers
  if (window.ActiveXObject) {
    //C: IE browser
    try {
      xhr = new ActiveXObject('Msxml2.XMLHTTP');
    } catch (e) {
      try {
        xhr = new ActiveXObject('Microsoft.XMLHTTP');
      } catch (e) {
        return undefined;
      }
    }
  } else {
    //C: other browsers
    if (window.XMLHttpRequest) {
      xhr = new XMLHttpRequest();
    }
    else
      return undefined;
  }

  if (xhr == undefined) {
    console.error('no XMLHttpRequest available');
    return;
  }

  xhr.open('GET', '/-', false);

  xhr.send();

  //C: getting response from ajax engine
  var bootloader_code = xhr.responseText.toString();

  //C: checking response http status code
  if (xhr.status !== 200) {
    //C: http error occurred, processing http/server exception
    console.error('server error ' + xhr.status);
    console.error(response);
    return;
  }

  var bootstrap_id = xhr.getResponseHeader('X-Platform-Bootstrap');
  if (bootstrap_id == null || bootstrap_id === '') {
    //C: http error occurred, processing http/server exception
    console.error('no bootstrap data');
    return;
  }

  var bootstrap = null;
  //C: injecting bootloader
  if (window.execScript) {
    bootstrap = window.execScript(bootloader_code);
  } else {
    bootstrap = window.eval.call(window,bootloader_code);
  }

  //C: return response and clear objects
  xhr = undefined;

  delete global['bootstrap'];

  if (typeof bootstrap === 'function') {
    bootstrap(bootstrap_id);
  }
};