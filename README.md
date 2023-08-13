# Dexter Development Environment
DDE allows user to develop and run software on the Dexter 5 axis robot arm made by: http://hdrobotic.com \
DDE is fundamentally a JavaScript development environment with lots of extensions.\
This branch is for DDE 3.x which is an Electron App which installs on your PC. DDE 4 has been ported to a cloud application on the DDE4 branch and is available at \
https://cfry.github.io/dde4/dde/
To install DDE3, most users will simply want to download the appropriate application file for their operating system.\
Start by clicking on the **releases** word near the top of this window (github main DDE) page\
or browse https://github.com/cfry/dde/releases .\
The "doc" folder above contains a lot of documenation on DDE.\
This documentation is part of DDE and is easily readable within DDE.
________________________________________________
## For System Developers Only
Below are instructions for building the DDE executables.

travis (for Mac & linux) [![Build Status](https://travis-ci.org/cfry/dde.svg?branch=master)](https://travis-ci.org/cfry/dde)

appveyor (for Windows) [![Build status](https://ci.appveyor.com/api/projects/status/sv6eh2bu7qsem04y?svg=true)](https://ci.appveyor.com/project/cfry/dde)

### Commands
```bash
$ npm install             # install dependencies
$ npm start               # start the application
$ npm run build           # compile the app but don't package it
$ npm run dist            # compile the app into an ASAR file to release
$ npm run clean           # delete the dist folder
$ npm run rebuild         # rebuild native modules
