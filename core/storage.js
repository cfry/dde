/*Created by Fry on 7/4/16.*/

//_______PERSISTENT: store name-value pairs in a file. Keep a copy of hte file in JS env, persistent_values
//and write it out every time its changed.

persistent_values = {}

//used by both persistent_initialize and dde_init_dot_js_initialize
function get_persistent_values_defaults() {
    return {"save_on_eval":     false,
            "default_out_code": false,
            "files_menu_paths": [add_default_file_prefix_maybe("dde_init.js")],
            "default_dexter_simulate": false,
            "editor_font_size":    17,
            "dde_window_width":  1000,
            "dde_window_height":  600,
            "dde_window_x":       100,
            "dde_window_y":       100,
            "left_panel_width":   750,
            "top_left_panel_height": 500,
            "top_right_panel_height": 500,
            "animate_ui": true,
            "last_open_dexter_file_path": "" //doesn't have a dexter: prefix,not robot specific.
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
                   dde_apps_folder.substring(0, dde_apps_folder.length - 8) + "</code> folder<br/>" +
                  "named: <code>dde_apps</code> to hold the code that you will write,<br/>" +
                  "then relaunch DDE."
                  )
    }
}

module.exports.persistent_initialize = persistent_initialize

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
module.exports.persistent_save = persistent_save


function persistent_load(){
    const path = add_default_file_prefix_maybe("dde_persistent.json")
    if(file_exists(path)){
        var content = read_file(path)
        const start_of_content = content.indexOf("{")
        if (start_of_content != -1) { content = content.substring(start_of_content) } //get rid of comment at top of file
        persistent_values = JSON.parse(content)
        //just in case files got saved out with backslashes, change to only slashes.
        let files = persistent_values.files_menu_paths
        let slashified_files = []
        for(let file of files){
            file = convert_backslashes_to_slashes(file)
            slashified_files.push(file)
        }
        persistent_values.files_menu_paths = slashified_files
    }
}

function persistent_set(key, value){
    persistent_values[key] = value
    persistent_save()
 }
module.exports.persistent_set = persistent_set

//returns undefined if key doesn't exist
function persistent_get(key="get_all"){
    if (key == "get_all") { return persistent_values }
    else { return persistent_values[key] }
}

module.exports.persistent_get = persistent_get

function persistent_remove(key) {
    delete persistent_values[key]
    persistent_save()
}
module.exports.persistent_remove = persistent_remove


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
        if (global.platform == "node") {
            global.persistent_set = persistent_set
        }
        try{
            load_files("dde_init.js")
        }
        catch(err0){
            if(window.Editor) { //will not hit in node platform
                Editor.edit_file(add_default_file_prefix_maybe("dde_init.js"))
            }
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
            var di_content = read_file("dde_init.js")
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
                  '// set_pane_header_background_color("#bae5fe")\n' +
                  '// set_menu_background_color("#93dfff")\n' +
                  '// set_button_background_color("#93dfff")\n' +
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

module.exports.dde_init_dot_js_initialize = dde_init_dot_js_initialize


//FILE SYSTEM

function read_file(path, encoding="utf8"){
    path = make_full_path(path)
    try{ return fs.readFileSync(path, encoding) }
    catch(err){
        if(err.message.startsWith("Access denied")){
            dde_error("You are not permitted to access files<br/>" +
                      " outside of Documents/dde_apps such as<br/>" +
                      path)
        }
        else {
            dde_error("read_file could not get the content of:<br/><code title='unEVALable'>" + path + "</code>")
        }
    }
}
module.exports.read_file = read_file

var file_content = read_file

module.exports.file_content = file_content //depricated

//callback passed err, and data.
//If error is non-null, its an error object or a string error message.
//if it is null, data is a string of the file content.
//but beware, sometimes data is a BUFFER not a string.
// data.toString() will convert a buffer to a string,
//and just returns the string if data happens to be a string
function read_file_async(path, encoding="utf8", callback){
    if(is_dexter_path(path)){
       let colon_pos = path.indexOf(":")
       let dex_name = path.substring(0, colon_pos)
       let dex_instance = Dexter[dex_name]
       if (!dex_instance) {
           dde_error("In read_file_async of path: " + path +
                     "<br/>there is no Dexter instance defined named: " + dex_name)
       }
       else {
           let dex_file_path = path.substring(colon_pos + 1)
           let the_callback = callback
           let the_path = path
           new Job({name: "dex_read_file",
                    robot: dex_instance,
                    do_list: [
                        Dexter.read_file(dex_file_path, "file_content"),
                        function(){
                           let cont = this.user_data.file_content
                           if(typeof(cont) == "string"){
                               the_callback(null, cont)
                           }
                           else {
                               let err = new Error("Error getting file content for: " + the_path + " with error number: " + cont, the_path)
                               the_callback(err, cont)
                           }
                        }
                    ],
                    when_stopped: function(){ //this code OUGHT to be called but as of apr 2019, if we error due to dexter not connected, then Job,.finish is never called so we don't call this method. Handle it in Job.stop_for_reason
                        if(this.status_code == "errored"){
                            if(window.Editor) { //won't hit in node, bu won't error either
                                Editor.set_files_menu_to_path() //restore files menu to what it was before we tried to get the file off of dexter.
                            }
                        }
                    }
            }).start()
       }
    }
    else {
        path = make_full_path(path)
        fs.readFile(path, callback)
    }
}

module.exports.read_file_async = read_file_async

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
module.exports.choose_file = choose_file


function choose_file_and_get_content(show_dialog_options={}, encoding="utf8") {
    var path = choose_file(show_dialog_options)
    if (path){
        if (Array.isArray(path)) { path = path[0] }
        return read_file(path, encoding)
    }
}
module.exports.choose_file_and_get_content = choose_file_and_get_content


function choose_save_file(show_dialog_options={}) { //todo document
    const dialog    = app.dialog;  //use {defaultPath: '~/foo.xml'} to set default file name
    let result =  dialog.showSaveDialog(app.getCurrentWindow(), show_dialog_options)
    return convert_backslashes_to_slashes(result)
}
module.exports.choose_save_file = choose_save_file

function write_file(path, content, encoding="utf8"){
    if (path === undefined){
        if (Editor.current_file_path == "new buffer"){
            dde_error("Attempt to write file but no filepath given.")
        }
        else { path = Editor.current_file_path }
    }
    path = make_full_path(path)
    if (content === undefined) {
        content = Editor.get_javascript()
    }

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

module.exports.write_file = write_file

//callback takes one are, err. If it is null, there's no error
function write_file_async(path, content, encoding="utf8", callback){
    if (path === undefined){
        if (Editor.current_file_path == "new buffer"){
            dde_error("Attempt to write file but no filepath given.")
        }
        else { path = Editor.current_file_path }
    }
    if (content === undefined) {
        content = Editor.get_javascript()
    }
    if(!callback) {
        let the_path = path
        callback = function(err){
            if(err){
                dde_error("write_file_async passed: " + the_path +
                    "<br/>Got error: " + err.message)
            }
            else { out("saved: " + the_path, undefined, true) }
        }
    }
    if(is_dexter_path(path)){
        let colon_pos = path.indexOf(":") //will not return -1
        let dex_name = path.substring(0, colon_pos)
        let dex_instance = Dexter[dex_name] // will be a real robot
        if (!dex_instance) {
            dde_error("In write_file_async of path: " + path +
                "<br/>there is no Dexter instance defined named: " + dex_name)
        }
        else {
            let dex_file_path = path.substring(colon_pos + 1)
            let the_callback = callback
            let the_path = path
            new Job({name: "dex_write_file",
                     robot: dex_instance,
                     do_list: [
                        Dexter.write_file(dex_file_path, content),
                        callback //but never passes an error object. not good, but robot_status should contain an error, and error if there is one, else callback should be called with no error so it does what it should do when no error
                     ]
            }).start()
        }
    }
    else {
        path = make_full_path(path)
        fs.writeFile(path, content, encoding, callback)
    }
}

module.exports.write_file_async = write_file_async

//for paths starting with "dexter0:" and other dexters, this will always return false.
//you have to use read_file_async for that and pass it a callback that
//handles the err when the file doesn't exist.
function file_exists(path){
    path = make_full_path(path)
    return fs.existsSync(path)
}
module.exports.file_exists = file_exists

//only works for dde computer, not dexter computer paths.
function make_folder(path){
    path = make_full_path(path)
    let path_array = path.split("/")
    let path_being_built = ""
    for(let path_part of path_array){
        path_being_built += ("/" + path_part)
        let path_to_use = adjust_path_to_os(path_being_built)

        if(!file_exists(path_to_use)){
           try{
                fs.mkdirSync(path_to_use)
           }
           catch(err){
               dde_error("In make_folder, could not make: " + path_to_use + "<br/>" +
                         err.message)
           }
        }
    }
    return true
}
module.exports.make_folder = make_folder

//fs-lock does not error on this. file_exists will return true for
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

module.exports.convert_backslashes_to_slashes = convert_backslashes_to_slashes

function add_default_file_prefix_maybe(path){
    if (is_root_path(path)) { return path }
    //else if (path.startsWith(dde_apps_folder)) { return path } //redundant with the above
    else if (path.includes(":")) { return path }
    else if (path.startsWith("dde_apps/")) {
        path = path.substring(8)
        return dde_apps_folder + path
    }
    else if(path.startsWith("./")) { return "dde_apps/" + path.substring(2) }
    else if (path.startsWith("../")) {
        let core_path = path.substring(3)
        let last_slash_pos = dde_apps_folder.lastIndexOf("/")

        let up_from_dde_apps = dde_apps_folder.substring(0, last_slash_pos + 1)
        new_path = up_from_dde_apps + core_path
        return new_path
    }
    else { return dde_apps_folder + "/" + path }
}


function adjust_path_to_os(path){
    if (path.includes("://")) { //looks like a url so leave it alone
       return path
    }
    else {//dde standard is to use / between separators and that's what users should use
          // But for windows compatibility we need backslash,. This fn called by dde utils like
          //read_file. Note if user passes in a path with backslashes,
          //this will do nothing. So on a windows machine, that's ok,
          //but on a mac or linux, that's bad. But this is unlikely to
          //happen on a mac or linus, esp since dde standard is slash.
        const result = path.replace(/\//g, folder_separator())
        return result
    }
}

function make_full_path(path, adjust_to_os=true){
    path = add_default_file_prefix_maybe(path)
    if (adjust_to_os) { path = adjust_path_to_os(path) }
    return path
}
module.exports.make_full_path = make_full_path

function is_root_path(path){
    if(path.startsWith("/")) { return true }
    else if ((path.length > 1) && (path[1] == ":")){
        let first_char = path[0]
        return ((first_char >= "A") && (first_char <= "Z"))
    }
    else { return false }
    //return starts_with_one_of(path, ["/", "C:", "D:", "E:", "F:", "G:"]) //C: etc. is for Windows OS.
}
//returns true if its a path that isn't a top level, has a colon and the
//substring between the beginning of the path and the colon names a defined dexter.
//Beware that if the dexter is not defined YET, then this will return false.
function is_dexter_path(path){
    if(is_root_path(path)) { return false }
    else {
        let colon_pos = path.indexOf(":")
        if(colon_pos == -1) { return false }
        else {
            let dex_name_maybe = path.substring(0, colon_pos)
            if(Dexter[dex_name_maybe]) { return true }
            else { return false}
        }
    }
}

//______new load_files synchronous______
//verify all paths first before loading any of them because we want to error early.
/*function load_files(...paths) {
   let prefix = dde_apps_folder + "/"
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
        let content = read_file(path) //might error
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
    console.log("load_files called with: " + paths)
    let prefix = dde_apps_folder + "/" //prefix always starts with slash and ends with slash
    let resolved_paths = []
    for (let path of paths){
        //console.log("working on " + path)
        path = convert_backslashes_to_slashes(path) //use slashes throughout.
        if (path === "/"){ //just reset prefix to the default
            prefix = dde_apps_folder + "/"
        }
        else if (is_root_path(path)){  //path.startsWith("/")
            if (path.endsWith("/")) { prefix = path }
            else { resolved_paths.push(path) }
        }
        else if (path.endsWith("/")) { //path does not start with slash.
            prefix = dde_apps_folder + "/" + path //assumes path is intended to be under dde_apps/
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
        //console.log("getting content for: " + path)
        let content = read_file(path) //might error
        //onsole.log("got content: " + content)
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
          //the commented out code below uses window.eval(content), which returns the value of the
          // last epxression in the file much less often than eval_js_part2, so use eval_js_part2 instead.
          //I must use eval and not eval_js_part2 because the later is not in core/job engine s
          //so that prevents loadiing files in job engine, which is a show stopper.
        try{let prev_loading_file =  window["loading_file"]
            window["loading_file"] = resolved_path
            window.Job = Job //needed if content has "Job" in it.
            result = window.eval(content)
            window["loading_file"] = prev_loading_file
        }
        catch(err){
            let file_mess = prepend_file_message_maybe(err.message) //do before undefining loading_file
            window["loading_file"] = undefined //must do before calling dde_error or
                                               //it won't get done BUT need dde_error to print out the loading file message.
            dde_error(file_mess)
        }
        /*
        let prev_loading_file  =  window["loading_file"]
        window["loading_file"] = resolved_path
        let result_obj = eval_js_part2 is not part of core/job engine so
                          // we can't use it here.
                          // eval_js_part2(content, false) // warning: calling straight eval often
                          //doesn't return the value of the last expr in the src, but my eval_js_part2 usually does.
                          //window.eval(content)
        window["loading_file"] = prev_loading_file //when nested file loading, we need to "pop the stack"
        if(result_obj.error_message){
            dde_error("While loading the file: " + resolved_pathresolved_path +
                "<br/>the file exists, but contains the JavaScript error of:<br/>" +
                err.message)
        }
        else { result = result_obj.value
               out("Done loading file: " + resolved_path, "green")
        }*/
        out("Done loading file: " + resolved_path, "green")
    }
    return result
}
module.exports.load_files = load_files
var fs        = require('fs'); //errors because require is undefined.
var app       = require('electron').remote;  //in the electron book, "app" is spelled "remote"
var {Robot, Brain, Dexter, Human, Serial}  = require("./robot.js")
var {shouldnt, warning, dde_error, starts_with_one_of, prepend_file_message_maybe, replace_substrings} = require("./utils")
var {out}     = require("./out.js")
var Job     = require("./job.js") //because loading a file with new Job in it needs this.

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



