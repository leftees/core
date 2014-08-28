'use strict';
/*

 ljve.io - Live Javascript Virtualized Environment
 Copyright (C) 2010-2014  Marco Minetti <marco.minetti@novetica.org>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.

 */

//N: Contains all methods and variables for mail management.
platform.messaging = platform.messaging || {};
platform.messaging.mail = platform.messaging.mail || {};

platform.messaging.mail._transport = null;
platform.messaging.mail.count  = 0;

platform.messaging.mail.send = {};

platform.messaging.mail.send.message = function(message, callback){
  if (platform.configuration.engine.messaging.mail.enable === false) {
    var err = new Exception('mail system disabled');
    if (typeof callback !== 'function') {
      throw err;
    } else {
      callback(err);
      return;
    }
  }
  if (platform.messaging.mail.count === Number.MAX_VALUE) {
    platform.messaging.mail.count = 0;
  }
  var count = ++platform.messaging.mail.count;
  var time_start = Date.now();

  platform.messaging.mail._transport.sendMail(message,function(err, info){
    if(platform.configuration.server.debugging.messaging.mail === true) {
      var time_stop = Date.now();
      var time_elapsed = Number.toHumanTime(time_stop-time_start);
      if (err) {
        console.warn('error occurred for message #%s (%s) in %s: %s',count,time_elapsed,info.messageId,err.stack || err.message);
      } else {
        info.accepted.forEach(function(recipient){
          console.debug('mail message #%s (%s) sent to %s in %s',count,info.messageId,recipient,time_elapsed);
        });
        info.rejected.forEach(function(recipient){
          console.warn('mail message #%s (%s) rejected for %s in %s',count,info.messageId,recipient,time_elapsed);
        });
      }
    }
    if (typeof callback === 'function') {
      callback(err, info);
    }
  });

  if(platform.configuration.server.debugging.messaging.mail === true) {
    console.debug('new mail message #%s queued',count);
  }

  return count;
};

platform.messaging.mail.send.template = function(message_templated, callback){
  var template = null;
  if (platform.messaging.mail.template.exist(message_templated.template) === true) {
    template = platform.messaging.mail.template._store[message_templated.template];
  } else {
    var err = new Exception('mail template %s does not exist',message_templated.template);
    if (typeof callback !== 'function') {
      throw err;
    } else {
      callback(err);
      return;
    }
  }

  var compiled_text = template.text;
  var compiled_html = template.html;

  Object.keys(template.fields).forEach(function(field){
    var replace_regexp = new RegExp('\<\@[\s]*' + field + '[\s]*\@\>', 'gi');
    if (compiled_text != null){
      compiled_text = compiled_text.replace(replace_regexp,template.fields[field]);
    }
    if (compiled_html != null){
      compiled_html = compiled_html.replace(replace_regexp,template.fields[field]);
    }
  });

  message_templated.text = compiled_text;
  message_templated.html = compiled_html;
  delete message_templated['template'];
  delete message_templated['fields'];

  return platform.messaging.mail.send.message(message_templated,callback);
};

platform.classes.register('core.messaging.mail.message',function(){
  this.from = undefined;
  this.to = undefined;
  this.cc = undefined;
  this.bcc = undefined;
  this.replyTo = undefined;
  this.inReplyTo = undefined;
  this.references = undefined;
  this.subject = undefined;
  this.text = undefined;
  this.html = undefined;
  this.headers = undefined;
  this.attachments = undefined;
  this.alternatives = undefined;
  this.envelope = undefined;
  this.messageId = undefined;
  this.date = undefined;
  this.encoding = undefined;
});

platform.classes.register('core.messaging.mail.attachment',function(){
  this.filename = undefined;
  this.cid = undefined;
  this.content = undefined;
  this.encoding = undefined;
  this.path = undefined;
  this.contentType = undefined;
  this.contentDisposition = undefined;
});

platform.classes.register('core.messaging.mail.message.templated',function(){
  this.from = undefined;
  this.to = undefined;
  this.cc = undefined;
  this.bcc = undefined;
  this.replyTo = undefined;
  this.inReplyTo = undefined;
  this.references = undefined;
  this.subject = undefined;
  //this.text = undefined;
  //this.html = undefined;
  this.headers = undefined;
  this.attachments = undefined;
  this.alternatives = undefined;
  this.envelope = undefined;
  this.messageId = undefined;
  this.date = undefined;
  this.encoding = undefined;

  this.template = undefined;
  this.fields = undefined;
});

platform.messaging.mail._init = function() {
  if (platform.configuration.engine.messaging.mail.enable === true) {
    platform.messaging.mail._transport = native.mail.createTransport(require('nodemailer-smtp-pool')(platform.configuration.engine.messaging.mail.account));
  }
};

platform.messaging.mail.template = {};

platform.messaging.mail.template._store = {};

platform.messaging.mail.template.register = function(name, text, html){
  //T: add support for buffer and streams
  if (platform.messaging.mail.template.exist(name) === false) {
    if (text != null || html != null) {
      platform.messaging.mail.template._store[name] = {
        'text': text,
        'html': html
      };
      return true;
    } else {
      throw new Exception('text or html body is at least required for %s template', name);
    }
  } else {
    throw new Exception('mail template %s already exists',name);
  }
};

platform.messaging.mail.template.unregister = function(name){
  if (platform.messaging.mail.template.exist(name) === true) {
    return delete platform.messaging.mail.template._store[name];
  } else {
    throw new Exception('mail template %s does not exist',name);
  }
};

platform.messaging.mail.template.list = function(){
  return Object.keys(platform.messaging.mail.template._store);
};

platform.messaging.mail.template.exist = function(name){
  return (platform.messaging.mail.template._store.hasOwnProperty(name));
};

platform.messaging.mail.template.get = function(name){
  if (platform.messaging.mail.template.exist(name) === true) {
    return platform.messaging.mail.template._store[name];
  } else {
    throw new Exception('mail template %s not found',name);
  }
};

platform.messaging.mail._init();