/*Created by Fry on 7/4/16.*/
//const fs = require('fs'); //errors because require is undefined.

//_______PERSISTENT: store name-value pairs in a file. Keep a copy of hte file in JS env, persistent_values
//and write it out even time its changed.
require("url")
persistent_values = {}

function persistent_load(){
    const path = add_default_file_prefix_maybe("dde_persistent.json")
    if(file_exists(path)){
        const content = file_content(path)
        persistent_values = JSON.parse(content)
    }
    persistent_initialize()
}
function persistent_save(){
    const path = add_default_file_prefix_maybe("dde_persistent.json")
    const content = JSON.stringify(persistent_values)
    write_file(path, content)
}

//if keep_existing is true, don't delete any existing values.
//but if its false, wipe out everything and set to only the initial values.
function persistent_initialize(keep_existing=true) { //was persistent_clear todo update doc
    const defaults = {
        "save_on_eval":     false,
        "files_menu_paths": []
    }
    if (keep_existing){
        for(let key in defaults){
            if (!persistent_values.hasOwnProperty(key)) {
                persistent_values[key] = defaults[key]
            }
        }
    }
    else { persistent_values = defaults }
    persistent_save()
}


function persistent_set(key, value){
    persistent_values[key] = value
    persistent_save()
 }

function persistent_get(key="get_all", callback=out){
    if (key == "get_all") { return persistent_values }
    else { return persistent_values[key] }
}

function persistent_remove(key, callback=function() { out("Removed " + key + " from persistent db.")}) {
    delete persistent_values[key]
    peristent_save()
}


//FILE SYSTEM
function add_default_file_prefix_maybe(path){
    if (path.startsWith("/")) { return path }
    else return dde_apps_dir + "/" + path
}

function file_content(path, encoding="utf8"){
    path = add_default_file_prefix_maybe(path)
    return fs.readFileSync(path, encoding);
}

function choose_file(show_dialog_options={}) { //todo document
    const app       = require('electron').remote;  //in the electon book, "app" is spelled "remote"
    const dialog    = app.dialog;
    const paths = dialog.showOpenDialog(show_dialog_options)
    if (paths) {
        if (Array.isArray(paths) && (paths.length == 1)) { return paths[0] }
        else return paths
    }
    else { return paths }
}

function choose_file_and_get_content(show_dialog_options={}, encoding="utf8") { //todo document
    const path = choose_file(show_dialog_options)
    if (path){
        if (Array.isArray(path)) { path = path[0] }
        return file_content(path, encoding)
    }
}

function choose_save_file(show_dialog_options={}) { //todo document
    const app       = require('electron').remote;  //in the electon book, "app" is spelled "remote"
    const dialog    = app.dialog;
    return dialog.showSaveDialog(show_dialog_options)
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
    fs.writeFileSync(path, content, {encoding: encoding})
}

function file_exists(path){
    path = add_default_file_prefix_maybe(path)
    return fs.existsSync(path)
} //don't document this as not that useful for normal users and would help bad actors

//but maybe never call this as I use slash throughout.
//since web server files want slash, and my other files,
//I'm just getting an entry and looking them up,
//I should be good with slash everywhere.
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

function convert_backslashes_to_slashes(a_string){
    return a_string.replace(/\\/g, "/")
}

//______new load_files syncchronous______
//verify all paths first before loading any of them because we want to error early.
function load_files(...paths) {
   let prefix = dde_apps_dir + "/"
   let resolved_paths = []
   for (let path of paths){
       path = convert_backslashes_to_slashes(path) //use slashes throughout.
       if (path.startsWith("/")){
           let last_slash_pos = path.lastIndexOf("/")
           prefix = path.substring(0, last_slash_pos + 1) // prefix always starts and ends with a slash
       }
       else { path = prefix + path }
       if (path.endsWith(".js")){resolved_paths.push(path)}
       else if (path.endsWith("/")){ //this path is not loadable, its just to setup prefix for the next path
           if (path.startsWith("/")) { //we've got a new prefix
               prefix = path
           }
           else {
               out("load_files passed a file path: " + path + " that ended in slash<br/>" +
                   "indicating that it should be a new  prefix for subsequent file names<br/>" +
                   "but it did not start with / <br/>" +
                   "so the prefix is incomplete.<br/>" +
                   "None of the files have been loaded.",
                   "red")
               dde_error("load_files could not resolve path: " + path + " into a proper file patn.")
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



