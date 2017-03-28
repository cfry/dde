# DDE

Dexter Development Environment allows user to develop and run software on the Dexter 5 axis robot arm.
http://hdrobotic.com
Most users will simply want to download the appropriate application file for their operation system.
click on the "releases" button above.
________________________________________________
## For System Developers only
Below are instructions for building the DDE executables.

travis (for Mac & linux) [![Build Status](https://travis-ci.org/cfry/dde.svg?branch=master)](https://travis-ci.org/cfry/dde)

appveyor (for Windows) [![Build status](https://ci.appveyor.com/api/projects/status/sv6eh2bu7qsem04y?svg=true)](https://ci.appveyor.com/project/cfry/dde)


## Commands

```bash
$ npm install             # install dependencies
$ npm start               # start the application
$ npm run build           # compile the app but don't package it
$ npm run dist            # compile the app into an ASAR file to release
$ npm run clean           # delete the dist folder
$ npm run rebuild         # rebuild native modules
```

