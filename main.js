"use strict";

/* To see the below console.log printouts, you must launch DDE from
a cmd line. IN windows run a terminal window, CD to your
Program Files folder and find a file dde_dev_env.exe
then that's the right folder so
in hte terminal window, cd to that folder and
enter dde_dev_env  to launch.
Then the below console.log prinouts appear in that terminal window.
 */

var electron = require('electron')
const SerialPort = require("serialport")

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

const fs = require('fs');
// Module to create native browser window.
//Because MS screwed up the relationhip between OneDrive and Documents in Windows 10,
//we do a lot of work to work around their bug.
let documents_dir = app.getPath("documents")
if (!documents_dir.endsWith("Documents")) { documents_dir += "/Documents" } //needed on Unbuntu OS for Dexter running DDE, all of whcih have a Documents dir
console.log("First try getting 'documents' yielded: " + documents_dir)
let the_dde_apps_folder = documents_dir + "/dde_apps"
let exists = fs.existsSync(the_dde_apps_folder)
console.log(the_dde_apps_folder + " exists=" + exists)
if(!exists) { //probably on windows
    let last_backslash_index = documents_dir.lastIndexOf("\\")
    let before_docs_path = documents_dir.substring(0, last_backslash_index)
    the_dde_apps_folder = before_docs_path + "\\OneDrive\\Documents\\dde_apps"
    exists = fs.existsSync(the_dde_apps_folder)
    console.log(the_dde_apps_folder + " exists=" + exists)
    if (!exists) {
        console.log('DDE cannot find the folder "Documents/apps_dir/" . You must create it.')
        the_dde_apps_folder = documents_dir + "/dde_apps" //user will need to create it
    }
}
//let init_file_one_drive = app.getPath("OneDrive/documents") + "/dde_apps"
//exists = fs.existsSync(init_file_one_drive)
//console.log(init_file_one_drive + " exists 2: " + exists)
//console.log("documents_dir = " + documents_dir)
global.dde_apps_folder = the_dde_apps_folder //documents_dir + "/dde_apps"
console.log("in main.js with dde_apps_folder: " + global.dde_apps_folder)
const BrowserWindow = electron.BrowserWindow

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow

function get_persistent_values_from_file() {
  let persistent_values = null
  let init_path = the_dde_apps_folder + "/dde_persistent.json"
  if(fs.existsSync(init_path)){
      let content = fs.readFileSync(init_path, "utf8")
      if(typeof(content) == "string"){
          const start_of_content = content.indexOf("{")
          if (start_of_content != -1) { content = content.substring(start_of_content) } //get rid of comment at top of file that isn't official JSON.
          try {
                persistent_values = JSON.parse(content)
                let obj_str = JSON.stringify(persistent_values)
                obj_str = obj_str.replace(new RegExp("," , 'g'), ",\n")
                console.log("\nPersistent values: \n" + obj_str + "\n")
                if(persistent_values.kiosk){
                    console.log("\nDDE set to kiosk mode. Quit by typing:\n" +
                                 "WinOS: Alt+F4\n" +
                                 "MacOS: Cmd+Q\n" +
                                 "Linux: Ctrl+Alt+Esc\n")
                }
                else {
                    console.log("DDE is not in kiosk mode.")
                }
          }
          catch(err) {
              console.log(init_path + " does not have valid JSON.")
          }
      }
      else {
        console.log(init_path + " exists but could not be read.")
      }
  }
  else {console.log("There is no file: " + init_path)}
  return persistent_values
}

function createWindow() {
  //defaults from storage.js get_persistent_values_defaults()
  let kiosk = false
  let x = 100
  let y = 100
  let width  = 1000
  let height = 600
  let perisistent_values = get_persistent_values_from_file() //lit obj or null if file not found
  if(perisistent_values) {
      kiosk = perisistent_values.kiosk,
      x = perisistent_values.dde_window_x
      y = perisistent_values.dde_window_y
      width  = perisistent_values.dde_window_width
      height = perisistent_values.dde_window_height
  }
  // Create the browser window.
  console.log("\ncreateWindow using:" +
               "\nkiosk: "  + kiosk +
               "\nx: "      + x +
               "\ny: "      + y +
               "\nwidth: "  + width +
               "\nheight: " + height +
               "\n")
  mainWindow = new BrowserWindow({
                   kiosk: kiosk,  //makes DDE window be FULL SCREEN, ie no os title bar, etc. locks down app.
                   x: x, y: y, width: width, height: height, show: false,
                   title: "Dexter Development Environment" //not obvious that this actually shows up anywhere.
                   })
  //mainWindow.focus() //doesn't do anything.

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
 //mainWindow.webContents.openDevTools() //shows chrome dev tools. nice.

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
    console.log("top of app.on 'ready'")
    createWindow();
    //mainWindow.webContents.send("main_is_ready") //looks like this does nothing
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OSX it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    //console.log("top of on window-all-closed")
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OSX it's common to re-create a window in the app when the
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

//const MenuItem = require('menu-item') //fails

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
        /* //fails because I cant find how to load/require MenuItem
          append: function(){
            return [new MenuItem({label: "Select Call",
                           click: function(){console.log("clicked select call")}
                           })
                   ] } */
});




ipc.on('synchronous-message', function (event, arg) {
  event.returnValue = 'pong'
})

ipc.on("open_dev_tools", function(event){
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

ipc.on("open_dev_tools", function(event){
    console.log("top of open_dev_tools2")
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

ipc.on("close_dev_tools", function(event){
    if (mainWindow.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools({mode:"undocked"}) //if devtools window is closed this opens it
    }
    event.returnValue = true //needed just to get the open_dev_tools button to not be highlighted
})

//called from serial.js serial_devices to get sychronous return value
ipc.on('serial_devices', function(event){
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
    console.log("in show_page in main.js with url:  " + url + " options: " + JSON.stringify(options))

    try{
        let win = new BrowserWindow(options)
        win.loadURL(url)
        //win.loadUrl("data:text/html;charset=utf-8," + encodeURI("<body><i>hillo</i></body>"));

        win.show()

        event.returnValue = null

    }
    catch(err) { event.return_value = "Error: " + err }
})

// see https://github.com/konsumer/electron-prompt/blob/master/main.js
// prompt normally not supported by Electron, but this clever implementation works
var promptResponse
ipc.on('prompt', function(eventRet, arg) {
    console.log("top of main on prompt")
    console.log(arg)
    promptResponse = null
    var promptWindow = new BrowserWindow({
         x: arg.x,
         y: arg.y,
         width:  arg.width,
         height: arg.height,
        show: false,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        frame: false
    })
    const title_html = '<div style="margin:3px;padding:0px;background-color:' + arg.window_frame_background_color +
                       ';font-size:21px;">' + arg.title + '</div><div style="padding:10px;">' +
                       arg.description +
                       '</div>'
     const body_html =  ' <input style="background-color:white;margin:10px;width:360px;font-size:14px;" id="val_id" value="' + arg.default_value + '" autofocus /> ' +
                        `<button onclick="require(\'electron\').ipcRenderer.send('prompt-response', val_id.value); window.close();">Ok</button>` +
                        '<button onclick="window.close();">Cancel</button>'
    const style_html  = ' <style>body {font-family: sans-serif; background-color:' + arg.background_color + '; margin:0px; padding:0px; border:8px solid }' +
                        '\nbutton {float:right; margin-left: 10px; margin-right: 10px; background-color:' +
                         arg.button_background_color +
                         '} ' +
                       '\nlabel,input {margin-bottom: 10px; width: 100%; display:block;}' +
                       '</style>'
    console.log("\ntitle_html")
    console.log(title_html)
    console.log("\nbody_html")

    console.log(body_html)
    console.log("\nstyle_html")
    console.log(style_html)
    promptWindow.on('closed', function(some_arg) {
        console.log("promptWindow.on closed called.")
        console.log(some_arg)
        console.log("Got val_id: " + val_id)
        promptWindow = null
    })
    const prompt_html =  title_html + body_html + style_html
    promptWindow.loadURL('data:text/html,' + prompt_html)
    promptWindow.show()
    //console.log("the typein val: " + document.getElementById('val').value) errors document not defined

})
ipc.on('prompt-response', function(event, arg) {
    console.log("on prompt-reponse called with event: " + event + " arg: " + arg)
    if (arg === ''){ arg = null }
    promptResponse = arg
})

ipc.on('set_dde_window_size', function(event,  x, y, width, height){
    mainWindow.setPosition(x, y)
    mainWindow.setSize(width, height)
})
