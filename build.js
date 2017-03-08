#!/usr/bin/env node
const electronPackager = require('electron-packager');
var options = { dir: './', // current directory is the source directory
                out: './dist', //output folder
                platform: 'darwin,win32', //,linux,win32', //OSes that we're making builds for. win32 just means "win", not 32 bit arch
                arch: 'all', //hardware to produce builds for, darwin(mac) has just 1. wind32 has a 32 & a 64 bit. linux has 3
                name: 'dexter_development_environment', //the name of the .app file produced
                asar: true,
                overwrite: true,   //replace the prev created build files
                prune: true  //get rid of excess files
                 };
electronPackager(options, (error, appPath) => {
    if(error){ // something went wrong
      throw error;
    }
    console.log(' Success! See ' + appPath);
    });