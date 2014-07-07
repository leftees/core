# Node Webkit Agent

This folder contains code from node-webkit-agent module by Camilo Aguilar.
Full source code and support is available on [GitHub](https://github.com/c4milo/node-webkit-agent)


## Fork

Official node-webkit-agent module does not allow to programmatically start 
multiple agents. This fork slightly modifies the code to enable agent start/stop
passing ports as parameters. This fork also disable console logging for agent 
socket server.


## Example
```javascript
var agentConsole = new (global.require('./external/devtools/agent/main'))();
agentConsole.start(9999, '0.0.0.0', 3333);
```


## License
(The MIT License)

Copyright 2014 Camilo Aguilar. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
