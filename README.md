# ljve.io

Currently the project is still under development.

[![Package Status](http://img.shields.io/npm/v/ljve.io.svg?style=flat)](https://www.npmjs.org/package/ljve.io) 
[![Build Status](http://img.shields.io/travis/ljveio/core.png?style=flat)](https://travis-ci.org/ljveio/core)  


## Usage

You can get it to through npm with:

```bash
# Windows
npm install ljve.io -g

# Linux/Mac
sudo npm install ljve.io -g
```

Node.js 4.0 is our runtime for project development. The project targets 0.10.x (to support old ARM without VFP4) and 0.12.x branches too.

To list the supported commands and start ljve.io with:

```bash
# print available commands
ljve help

# launch environment without development tools (production) 
ljve run

# launch environment with development tools (web terminal, console and ide)
ljve develop

# launch environment with both development tools (see above) and debugger enabled
ljve debug
```

To get started, create a new application boilerplate with:

```bash
# create a folder that will contain app files on Linux/Mac
mkdir -p ~/ljve/hello
cd ~/ljve/hello
# initialiaze boilerplate using default template (in current folder)
ljve create
```

```bash
# create a folder that will contain app files on Windows
mkdir -p %HOMEPATH%\Desktop\ljve\hello
cd %HOMEPATH%\Desktop\ljve\hello
# initialiaze boilerplate using default template (in current folder)
ljve create
```

Start the environment and empty application with:

```bash
# launch environment and application with all development tools enabled
ljve debug
```

You can now have fun visiting ports 9090 (web console), 9091 (web debugger), 9092 (web ide) and 9093 (web terminal).



## Contribute

If you want to contribute to the ljve.io project development, please carefully read and mind the following guidelines.

Project management tools (Atlassian JIRA and more) are available at https://epm.novetica.org/ (public sign-up is enabled).



### Documentation

Work in progress. The project web site will be available at http://ljve.io/.



#### Tools

The following tools have been used to develop the ljve.io project:

  * [Brackets](http://www.brackets.io/)  
  Brackets.io is a modern, open source text editor that understands web design.
  
  * [WebStorm](http://www.jetbrains.com/webstorm/)  
  JetBrains WebStorm is one of the smartest and most complete IDE for JavaScript development with Node.js support.



## License ![AGPLv3](https://raw.githubusercontent.com/ljveio/core/master/LICENSE.AGPL.PNG)

ljve.io - Live Javascript Virtualized Environment  
Copyright (C) 2010-2015 Marco Minetti <marco.minetti@novetica.org>

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
