/*Created by Fry on 7/4/16.*/
//const fs = require('fs'); //errors because require is undefined.
const app       = require('electron').remote;  //in the electon book, "app" is spelled "remote"

function add_default_file_prefix_maybe(path){
    if (is_root_path(path)) { return path }
    else return dde_apps_dir + "/" + path
}

//_______PERSISTENT: store name-value pairs in a file. Keep a copy of hte file in JS env, persistent_values
//and write it out every time its changed.
//require("url")
//const path_pkg = require('path')
persistent_values = {}

//used by both persistent_initialize and dde_init_dot_js_initialize
function get_persistent_values_defaults() {
    return {"save_on_eval":     false,
            "files_menu_paths": [add_default_file_prefix_maybe("dde_init.js")],
            "default_dexter_simulate": true,
            "editor_font_size":    17,
            "dde_window_width":  1000,
            "dde_window_height":  600,
            "dde_window_x":       100,
            "dde_window_y":       100
           }
}
//if keep_existing is true, don't delete any existing values.
//but if its false, wipe out everything and set to only the initial values.
function persistent_initialize(keep_existing=true) {
    if(file_exists("")){ //Documents/dde_apps
        const dp_path = add_default_file_prefix_maybe("dde_persistent.json")
        if(!keep_existing){ //unusual
            persistent_values = get_persistent_values_defaults()
            persistent_save()
            out("persistent values have been initialized to their defaults.", "green")
        }
        else {
            if (file_exists(dp_path)){ //normal
                out("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;loading persistent values from " + dp_path, "green")
                persistent_load()
                out("Done loading persistent values.", "green")
            }
            let made_change = false
            for(let key in get_persistent_values_defaults()){
                if (!persistent_values.hasOwnProperty(key)) {
                    made_change = true
                    persistent_values[key] = get_persistent_values_defaults()[key]
                }
            }
            if (file_exists(dp_path)){
                if (made_change) { persistent_save() }
            }
            else { //first launch of dde by user
                persistent_save()
                out("The file dde_persistent.json doesn't exist so<br/>" +
                     "persistent values have been initialized to their defaults and<br/>" +
                     "Documents.dde_apps/dde_persistent.json has been created.",
                     "green")
            }
        }
    }
    else {
        dde_error("Please create a folder in your <code>" +
                   dde_apps_dir.substring(0, dde_apps_dir.length - 8) + "</code> folder<br/>" +
                  "named: <code>dde_apps</code> to hold the code that you will write,<br/>" +
                  "then relaunch DDE."
                  )
    }
}

function persistent_save(){
    //we need this because on windows 10, if you minimize the DDE window, then
    //quit DDE, the below saved values will be0, then launching dde
    //makes the window invisible. So this protects against that.
    persistent_values.dde_window_x      = Math.max(persistent_values.dde_window_x, 0) //on WinOS, when minimizing, sometimes the x & y vals are negative, hiding the window.
    persistent_values.dde_window_y      = Math.max(persistent_values.dde_window_y, 0)
    persistent_values.dde_window_width  = Math.max(persistent_values.dde_window_width, 60)
    persistent_values.dde_window_height = Math.max(persistent_values.dde_window_height, 20)
    const path = add_default_file_prefix_maybe("dde_persistent.json")
    var content = JSON.stringify(persistent_values)
    content = replace_substrings(content, ",", ",\n") //easier to read & edit
    content = "//Upon DDE launch, this file is loaded before dde_apps/dde_init.js\n//Use persistent_get(key) and persistent_set(key, new_value)\n//to access each of the below variables.\n\n" + content
    write_file(path, content)
}

function persistent_load(){
    const path = add_default_file_prefix_maybe("dde_persistent.json")
    if(file_exists(path)){
        var content = file_content(path)
        const start_of_content = content.indexOf("{")
        if (start_of_content != -1) { content = content.substring(start_of_content) } //get rid of comment at top of file
        persistent_values = JSON.parse(content)
    }
}

function persistent_set(key, value){
    persistent_values[key] = value
    persistent_save()
 }

//returns undefined if key doesn't exist
function persistent_get(key="get_all", callback=out){
    if (key == "get_all") { return persistent_values }
    else { return persistent_values[key] }
}

function persistent_remove(key, callback=function() { out("Removed " + key + " from persistent db.")}) {
    delete persistent_values[key]
    persistent_save()
}

var default_default_ROS_URL           = "localhost:9090"
var default_default_dexter_ip_address = "192.168.1.142"
var default_default_dexter_port       = 50000

//gaurentees that dde_init.js exists and that it has certain content in it,
//and that that certain content is evaled and present in the js env.
function dde_init_dot_js_initialize() {
    if(!file_exists("")){ //does the folder: Documents/dde_apps not exist?
       //reported to user in persistent_initialize
    }
    else if (file_exists("dde_init.js")){ //we don't want to error if the file doesn't exist.
        try{
            load_files("dde_init.js")
        }
        catch(err0){
            Editor.edit_file(add_default_file_prefix_maybe("dde_init.js"))
            dde_error("The file: Documents/dde_apps/dde_init.js has invalid JavaScript in it.<br/>" +
                      "Please fix this and relaunch DDE.")
            return
        }
        var add_to_dde_init_js = ""
        if (!persistent_get("ROS_URL")){
            add_to_dde_init_js += 'persistent_set("ROS_URL", "' + default_default_ROS_URL + '") //required property, but you can edit the value.\n'
        }
        if (!persistent_get("default_dexter_ip_address")){
            add_to_dde_init_js += 'persistent_set("default_dexter_ip_address", "' + default_default_dexter_ip_address + '") //required property, but you can edit the value.\n'
        }
        if (!persistent_get("default_dexter_port")){
            add_to_dde_init_js += 'persistent_set("default_dexter_port", "' + default_default_dexter_port + '") //required property, but you can edit the value.\n'
        }
        if(!Robot.dexter0){
            add_to_dde_init_js += '\nnew Dexter({name: "dexter0"}) //dexter0 must be defined.\n'
        } //note, in the weird case that the user has defined the ip_address and/or port
          //but not dexter0, then dexter0 gets at the front of the init file, not
          //after the address and that's bad because it needs the ip_address
          //but a fancier scheme of putting dextero always at the end of the file
          //is bad too since all the "system" code is not at the beginning, before user code.
          //So in our "weird case" laoding dde_init will error. Not so terrimbe
        if (add_to_dde_init_js != ""){
            var di_content = file_content("dde_init.js")
            di_content = add_to_dde_init_js + di_content
            write_file("dde_init.js", di_content)
            eval(add_to_dde_init_js)
        }
    }
    else { //the folder exists, but no dde_init.js file
        const initial_dde_init_content =
                  '//This file is loaded when you launch DDE.\n'     +
                  '//Add whatever JavaScript you like to the end.\n' +
                  '\n' +
                  '//To change DDE colors,\n' +
                  '// 1. Uncomment the below line(s).\n' +
                  '// 2. Select the first arg.\n' +
                  '// 3. Choose the "Insert" menu, "Color" item.\n' +
                  '// 4. After inserting the new color, eval the "set_" call.\n' +
                  '// 5. To get the default color, just comment out the line and relaunch DDE.\n' +
                  '// set_window_frame_background_color("#b8bbff")\n' +
                  '// set_pane_header_background_color("#93dfff")\n' +
                  '// set_menu_background_color("#4cc9fd")\n' +
                  '// set_button_background_color("#4cc9fd")\n' +
                  '\n' +
                  'persistent_set("ROS_URL", "' + default_default_ROS_URL + '") //required property, but you can edit the value.\n' +
                  'persistent_set("default_dexter_ip_address", "'    +
                  default_default_dexter_ip_address + '") //required property but you can edit the value.\n' +
                  'persistent_set("default_dexter_port", "'          +
                  default_default_dexter_port + '") //required property, but you can edit the value.\n' +
                 'new Dexter({name: "dexter0"}) //dexter0 must be defined.\n'

        eval(initial_dde_init_content)
        write_file("dde_init.js", initial_dde_init_content)
        out("Your dde_init.js file did not exist<br/>" +
            "so a fresh one was created in Documents/dde_apps/<br/>" +
            "Extend it with whatever JavaScript you want<br/>" +
            "to be evaled when DDE is launched.", "green")
    }
}


//FILE SYSTEM

function file_content(path, encoding="utf8"){
    path = add_default_file_prefix_maybe(path)
    path = adjust_path_to_os(path)
    //console.log("file_content ultimately using path: " + path)
    try{ return fs.readFileSync(path, encoding) }
    catch(err){
        if(err.message.startsWith("Access denied")){
            dde_error("You are not permitted to access files<br/>" +
                      " outside of Documents/dde_apps such as<br/>" +
                      path)
        }
        else {
            dde_error("Error getting content for:<br/><code title='unEVALable'>" + path + "</code>")
        }
    }
}

function choose_file(show_dialog_options={}) {
    const dialog    = app.dialog;
    const paths = dialog.showOpenDialog(app.getCurrentWindow(),
        //passing this first arg of the window
        // makes the dialog "modal" ie can't do anything but choose a file or cancel
        //you can't even click outside the window ahd have it do anything.
        //This prevents certain error states you can get into with
        //the file dialog and DDE. Not *always* what you want but
        //on average, mostly what you want, particulary on WindowsOS which is worse
        //than MacOS when we DON'T pass this.
        //Note that "title" option doesn't show up on Mac.
            show_dialog_options)
    if (paths) {
        if (Array.isArray(paths) && (paths.length == 1)) {
            return convert_backslashes_to_slashes(paths[0]) }
        else {
            let slashed_paths = []
            for (let p of paths){
                slashed_paths.push(convert_backslashes_to_slashes(p))
            }
            return slashed_paths

        }
    }
    else { return paths }
}

function choose_file_and_get_content(show_dialog_options={}, encoding="utf8") {
    var path = choose_file(show_dialog_options)
    if (path){
        if (Array.isArray(path)) { path = path[0] }
        return file_content(path, encoding)
    }
}

function choose_save_file(show_dialog_options={}) { //todo document
    const dialog    = app.dialog;  //use {defaultPath: '~/foo.xml'} to set default file name
    return dialog.showSaveDialog(app.getCurrentWindow(), show_dialog_options)
}

function write_file(path, content, encoding="utf8"){
    if (path === undefined){
        if (Editor.current_file_path == "new file"){
            dde_error("Attempt to write file but no filepath given.")
        }
        else { path = Editor.current_file_path }
    }
    path = add_default_file_prefix_maybe(path)
    if (content === undefined) {
        content = Editor.get_javascript()
    }
    path = adjust_path_to_os(path)
    try{ fs.writeFileSync(path, content, {encoding: encoding}) }
    catch(err){
        if(err.message.startsWith("Access denied")){
            dde_error("You are not permitted to access files<br/>" +
                " outside of Documents/dde_apps such as<br/>" +
                path)
        }
        else {
            dde_error("Error writing file: " + path)
        }
    }
}

function file_exists(path){
    path = add_default_file_prefix_maybe(path)
    path = adjust_path_to_os(path)
    return fs.existsSync(path)
} //fs-lock does not error on this. file_exists will return true for
  //files that exist, but would get access denied if you tried to
  //read or write them. That's bad. should return false if
  //you can't read or write them. I could read it, and if error,
  //catch it and return false. A bit expensive but maybe worth it.

//but maybe never call this as I use slash throughout.
//since web server files want slash, and my other files,
//I'm just getting an entry and looking them up,
//I should be good with slash everywhere.

//returns true or false. JS experts don't like fs.existsSync
//due to the problem that the below method solves.
function can_read_and_write_file(path){
    try {fs.accessSync(path, fs.R_OK) //can read
        fs.accessSync(path, fs.W_OK) //can write
        return true
    }
    catch(err) {
        if(fs.existsSync(path)){
            warning(path + " exists but you can't read or write it.<br/>" +
                "If you want to read or write this file,<br/>" +
                "use your operating system to change its permissions.")
        }
        return false
    }
}

function folder_separator(){
    if (operating_system == "win") { return "\\" }
    else                           { return "/"  }
}

function add_folder_separator_prefix_maybe(filepath){
    if (filepath.startsWith("/")) {//|| filepath.startsWith("\\"))
        return filepath
    }
    else { return "/" + filepath }
}
//within dde, paths should have slashes.
//I convert "incomming paths to have slashes.
//but when we have to access the OS, the
//files have to be convered to be OS specific, ie for windows, have backslashes.
//for that we call adjust_path_to_os
function convert_backslashes_to_slashes(a_string){
    return a_string.replace(/\\/g, "/")
}

function adjust_path_to_os(path){
    if (path.includes("://")) { //looks like a url so leave it alone
       return path
    }
    else {//dde standard is to use / between separators and that's what users should use
          // But for windows compatibility we need backslash,. This fn called by dde utils like
          //file_content. Note if user passes in a path with backslashes,
          //this will do nothing. So on a windows machine, that's ok,
          //but on a mac or linux, that's bad. But this is unlikely to
          //happen on a mac or linus, esp since dde standard is slash.
        const result = path.replace(/\//g, folder_separator())
        return result
    }
}

function is_root_path(path){
    return starts_with_one_of(path, ["/", "C:", "D:", "E:", "F:", "G:"]) //C: etc. is for Windows OS.
}

//______new load_files syncchronous______
//verify all paths first before loading any of them because we want to error early.
/*function load_files(...paths) {
   let prefix = dde_apps_dir + "/"
   let resolved_paths = []
   for (let path of paths){
       path = convert_backslashes_to_slashes(path) //use slashes throughout.
       if (is_root_path(path)){  //path.startsWith("/")
           let last_slash_pos = path.lastIndexOf("/")
           prefix = path.substring(0, last_slash_pos + 1) // prefix always starts and ends with a slash
       }
       else { path = prefix + path }
       if (path.endsWith(".js")){resolved_paths.push(path)}
       else if (path.endsWith("/")){ //this path is not loadable, its just to setup prefix for the next path
           if (is_root_path(path)) { //we've got a new prefix
               prefix = path
           }
           else {
               out("load_files passed a file path: " + path + " that ended in slash<br/>" +
                   "indicating that it should be a new  prefix for subsequent file names<br/>" +
                   "but it did not start with / <br/>" +
                   "so the prefix is incomplete.<br/>" +
                   "None of the files have been loaded.",
                   "red")
               dde_error("load_files could not resolve path: " + path + " into a proper file path.")
           }
       }
       else {
           out("load_files passed a file: " + path + "<br/>" +
               "that did not end in slash indicating a new url prefix<br/>" +
               "nor did it end with '.js' indicating a file to load.<br/>" +
               "None of the files have been loaded.",
               "red")
           dde_error("load_files could not resolve path: " + path + " into a proper file patn.")
       }
   }
   //now make sure we can get all the contents before actually loading any
   let contents = []
   for (let path of resolved_paths){
        let content = file_content(path) //might error
        contents.push(content)
   }
   //finally if we get to this point, we've got all the contents so time to load
    let result
    for (let resolved_paths_index = 0;
             resolved_paths_index < resolved_paths.length;
             resolved_paths_index ++){
        let resolved_path = resolved_paths[resolved_paths_index]
        let content = contents[resolved_paths_index]
        out("loading file: " + resolved_path, "green")
        result = window.eval(content)
    }
    return result
}*/
//simplied from above. ending in slash resets the default "prefix".
function load_files(...paths) {
    let prefix = dde_apps_dir + "/" //prefix always starts with slash and ends with slash
    let resolved_paths = []
    for (let path of paths){
        path = convert_backslashes_to_slashes(path) //use slashes throughout.
        if (path === "/"){ //just reset prefix to the default
            prefix = dde_apps_dir + "/"
        }
        else if (is_root_path(path)){  //path.startsWith("/")
            if (path.endsWith("/")) { prefix = path }
            else { resolved_paths.push(path) }
        }
        else if (path.endsWith("/")) { //path does not start with slash.
            prefix = dde_apps_dir + "/" + path //assumes path is intended to be under dde_apps/
        }
        /*kent doesn't like restriction. Sending filesin email need not tto have the .js extension
               and some pure data files maybe shouldn't have .js extnsions.
        else if (!path.endsWith(".js")){
            dde_error("loading_file got path: " + path + ' which does not end in ".js"'  +
                        "<br/>No files were loaded.")
        }*/
        else { //path does not start or end with slash.
            path = prefix + path
            resolved_paths.push(path)
        }
    }
    //now make sure we can get all the contents before actually loading any
    let contents = []
    for (let path of resolved_paths){
        let content = file_content(path) //might error
        contents.push(content)
    }
    //finally if we get to this point, we've got all the contents so time to eval
    let result
    for (let resolved_paths_index = 0;
         resolved_paths_index < resolved_paths.length;
         resolved_paths_index ++){
        let resolved_path = resolved_paths[resolved_paths_index]
        let content = contents[resolved_paths_index]
        out("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;loading file: " + resolved_path, "green")
        try{let prev_loading_file =  window["loading_file"]
            window["loading_file"] = resolved_path
            result = window.eval(content)
            window["loading_file"] = prev_loading_file
        }
        catch(err){
            let file_mess = prepend_file_message_maybe(err.message) //do before undefining loading_file
            window["loading_file"] = undefined //must do before calling dde_error or
                                               //it won't get done BUT need dde_error to print out the loading file message.
            dde_error(file_mess)
           // window["loading_file"] = undefined //never gets called. must to after calling dde_error
            //let  out_string = "<details><summary><span style='color:red;'>\n" +
            //                  "loading file: " + resolved_path +
            //                  "<br/>\n&nbsp;&nbsp;&nbsp;&nbsp;got error: " + err.message + "</span></summary>" +
            //                   replace_substrings(err.stack, "\n", "<br/>") + "</details>"
            //out(out_string)
            //throw new Error("dde_error: " + err.message)
        }
        out("Done loading file: " + resolved_path, "green")
    }
    return result
}
/*
function folder_listing(folder="/", include_folders=true, include_files=true, callback=out){
    if (!folder.startsWith("/")) { folder = "/" + folder }
    if (!folder.endsWith("/"))   { folder = folder + "/" }
    let url = WEB_SERVER_FOR_CHROME_URL + folder + "?static=1"
    get_page(url, function(str) {
        let files = folder_listing_aux(str, include_folders, include_files)
        callback.call(null, files)
    })
}

function folder_listing_aux(str, include_folders=true, include_files=true){
    let arr = str.split("href=")
    let result = []
    for (let line of arr){
        if (line.startsWith('"')) {
            let qmark_pos = line.indexOf("?")
            if (qmark_pos != -1) {
                filename = line.substring(1, qmark_pos)
                if (filename.startsWith(".")) {}
                else if (filename.endsWith("/")){
                    if (include_folders) { result.push(filename) }
                }
                else if (include_files) { result.push(filename) }
            }
        }
    }
    return result
}
*/



