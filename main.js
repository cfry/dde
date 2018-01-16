"use strict";

const electron = require('electron')
// Module to control application life.
const app = electron.app
const globalShortcut = electron.globalShortcut
const os = require('os')
const user_homedir = os.homedir()

const ipc = require('electron').ipcMain
const request = require("request");

global.app_path = app.getAppPath()
console.log("in main.js with __dirname:    " + __dirname)
console.log("in main.js with  app_path:    " + global.app_path)

// Module to create native browser window.
var documents_dir
try { documents_dir = app.getPath("documents")
    console.log("First try getting 'documents' yielded: " + documents_dir)
}
catch(err) {
    console.log("Error evaling: " + 'app.getPath("documents")')
    documents_dir = app.getPath("OneDrive/documents")
    console.log("Second try getting 'documents' yielded: " + documents_dir)
}
if (!documents_dir) {
    documents_dir = app.getPath("OneDrive/documents")
    console.log("Third try getting 'documents' yielded: " + documents_dir)
}
//console.log("documents_dir = " + documents_dir)
global.dde_apps_dir = documents_dir + "/dde_apps"
console.log("in main.js with dde_apps_dir: " + global.dde_apps_dir)
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1000, height: 600, show: false,
                   title: "Dexter Development Environment" //not obvious that this actually shows up anywhere.
                   })
  //mainWindow.focus() //doesn't do anything.

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
 /// mainWindow.webContents.openDevTools() //shows chrome dev tools. nice.

  // Emitted when the main window is closed. (ie click the "red circle" in Mac window bar
  //as well as chose "Quit" from the Top window bar on Mac
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
        console.log("top of on.closed")
        //mainWindow.webContents.send('save_current_file') //doesn't work now using window.onbeforeunload in reneder process (editor.js)
        mainWindow = null

  })
  mainWindow.once('ready-to-show', () => { mainWindow.show()})
  var mainWindow_for_closure = mainWindow
  mainWindow.on("resize", function(){
        mainWindow_for_closure.webContents.send('record_dde_window_size')
  })
  mainWindow.on("move", function(){
        mainWindow_for_closure.webContents.send('record_dde_window_size')
  })
}

// win.setSize(width, height)
// win.getSize() //retruns an array of 2 ints, width and height.


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() { 
     createWindow();
    //console.log("hi fry")
    mainWindow.webContents.send("main_is_ready")
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    //console.log("top of on window-all-closed")
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

function register_shortcuts(){
     globalShortcut.register('CommandOrControl+X', () => {
     mainWindow.webContents.cut()
 })
     globalShortcut.register('CommandOrControl+C', () => {
     mainWindow.webContents.copy()
 })
     globalShortcut.register('CommandOrControl+V', () => {
     mainWindow.webContents.paste()
 })
}

app.on("browser-window-focus", register_shortcuts)
app.on("browser-window-blur",  function(){ globalShortcut.unregisterAll() })


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
const accel_key = ((os.platform() == "darwin")? "cmd" : "ctrl")

require('electron-context-menu')({
        //prepend: (params, browserWindow) => [{
        // only show it when right-clicking images
        // visible: params.mediaType === 'image'
        //}],
        showInspectElement: true,
        labels:  {cut:   'Cut   ' + accel_key + ' x',
                  copy:  'Copy  ' + accel_key + ' c',
                  paste: 'Paste ' + accel_key + ' v'
        }
});




ipc.on('synchronous-message', function (event, arg) {
  event.returnValue = 'pong'
})

ipc.on("open_dev_tools", function(event){
   console.log("top of open_dev_tools2")
   //debugger; //doesn't work.
    if (mainWindow.isDevToolsOpened()) {
        mainWindow.devToolsWebContents.focus()
    }
   else { mainWindow.webContents.openDevTools({mode:"undocked"})} //if devtools window is closed this opens it
     //and focuses on it. If Not it does nothing but i need  to focus on the window.
   //mainWindow.webContents.devToolsWebContents.focus() //errors
   //mainWindow.blur() //causes step button to remain "down".
    //mainWindow.webContents.toggleDevTools()
    //mainWindow.webContents.toggleDevTools()
    //console.log(mainWindow.webContents)

   event.returnValue = true //needed just to get the open_dev_tools button to not be highlighted
})


//called from serial.js serial_devices to get sychronous return value
ipc.on('serial_devices', function(event){
    const SerialPort = require("serialport")
    //console.log("in main sd")
    SerialPort.list(function(err, ports) {
        //console.log("in main sd ports: " + ports)
           event.returnValue = ports
    })
})


//used by render process get_page for synchronous call
//beware, if the url is non-existent, this might not return an error.
ipc.on('get_page', function(event, url_or_options){
  console.log("in get_page in main.js with:  " + url_or_options)
  try{
      request(url_or_options,
              function(err, response, body) {
                //when the computer isn't connected to the web, response
                //is undefined.
                var stat = (response ? response.statusCode : null)
                console.log("main get page with err: " + err +
                            "\n statusCode: " + stat +
                            "\nbody: " + body)

                if (err) { event.returnValue = "Error: " + err }
                else if(stat !== 200){
                    event.returnValue = "Error: got status code: " + stat
                }
                else     { event.returnValue = body }
              })
  }
  catch(err) { event.returnValue = "Error: " + err}
})

ipc.on('show_page', function(event, url, options={width: 800, height: 600}){
    //onsole.log("in show_page in main.js with url:  " + url + " options: " + JSON.stringify(options))

    try{
        let win = new BrowserWindow(options)
        win.loadURL(url)
        win.show()
        event.returnValue = null
    }
    catch(err) { evnt.return_value = "Error: " + err }
})

// see https://github.com/konsumer/electron-prompt/blob/master/main.js
// prompt normally not supported by Electron, but this clever implementation works
var promptResponse
ipc.on('prompt', function(eventRet, arg) {
    promptResponse = null
    var promptWindow = new BrowserWindow({
        width:  400,
        height: 200,
        show: false,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        frame: false
    })
    //coral #ff8c96, orange #ffbe3c
    arg.val   = arg.val   || ''
    arg.title = arg.title || ''
    const promptHtml = '<div margin:0px;padding:0px; style="background-color:' + arg.window_frame_background_color +
                       ';font-size:21px;">DDE Prompt</div><div style="padding:10px;">' +
                       arg.title +
                       '</div>\
    <input style="backgound-color:white;margin:10px;width:360px;font-size:14px;" id="val" value="' + arg.val + '" autofocus />\
    <button onclick="require(\'electron\').ipcRenderer.send(\'prompt-response\', document.getElementById(\'val\').value);window.close()">Ok</button>\
    <button onclick="window.close()">Cancel</button>\
    <style>body        {font-family: sans-serif; background-color:#DDD; margin:0px; padding:0px; border:8px solid ' +
                       arg.window_frame_background_color + '} \
           button      {float:right; margin-left: 10px; margin-right: 10px; background-color:' +
                       arg.button_background_color +
                       '} \
           label,input {margin-bottom: 10px; width: 100%; display:block;}\
    </style>'
    promptWindow.loadURL('data:text/html,' + promptHtml)
    promptWindow.show()
    promptWindow.on('closed', function() {
        eventRet.returnValue = promptResponse
        promptWindow = null
    })
})
ipc.on('prompt-response', function(event, arg) {
    if (arg === ''){ arg = null }
    promptResponse = arg
})

ipc.on('set_dde_window_size', function(event,  x, y, width, height){
    mainWindow.setPosition(x, y)
    mainWindow.setSize(width, height)
})
