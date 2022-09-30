/*Created by Fry on 7/4/16.*/

var request = require('request'); //needed by write_file_async for node server
var fsPath  = require('fs-path')

//_______PERSISTENT: store name-value pairs in a file. Keep a copy of hte file in JS env, persistent_values
//and write it out every time its changed.

persistent_values = {}

//used by both persistent_initialize and dde_init_dot_js_initialize
function get_persistent_values_defaults() {
    return {"save_on_eval":     false,
            "default_out_code": false,
            "files_menu_paths": [add_default_file_prefix_maybe("dde_init.js")],
            "misc_pane_content": "Simulate Dexter",
            "misc_pane_choose_file_path": "", //only used on dde init, and only if misc_pane_content is "choose_file"
            "default_dexter_simulate": true,
            "editor_font_size":    17,

            "dde_window_x":       50,
            "dde_window_y":       50,
            "dde_window_width":   1024, //outerWidth, bug fix
            "dde_window_height":  720,  //outerHeight, bug fix
            "left_panel_width":   700,
            "top_left_panel_height": 350,
            "top_right_panel_height": 200,

            "animate_ui": true,
            "last_open_dexter_file_path": "", //doesn't have a dexter: prefix,not robot specific.
            "kiosk": false,
            "ssh_show_password": false,
            "dont_show_splash_screen_on_launch": false,
            "splash_screen_tutorial_labels": (window.SplashScreen ? SplashScreen.splash_screen_tutorial_labels() : [])
           }
}
//ensures that dde_apps folder exists, that dde_persistent.json, and
//loads in values from dde_persistent.json
function persistent_initialize() {
    if(!file_exists("")){
        make_folder("") //make dde_apps folder, synchronous
    }
    const dp_path = add_default_file_prefix_maybe("dde_persistent.json")
    if(!file_exists(dp_path)){
        persistent_values = get_persistent_values_defaults()
        persistent_save() //synchronous .creates "dde_persistent.json"
    }
    else { persistent_load() } //synchronous
}
    /*
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
}*/

module.exports.persistent_initialize = persistent_initialize

function persistent_save(){
    //we need this because on windows 10, if you minimize the DDE window, then
    //quit DDE, the below saved values will be 0, then launching dde
    //makes the window invisible. So this protects against that.
    let the_defaults = get_persistent_values_defaults()
    persistent_values.dde_window_x      = Math.max(persistent_values.dde_window_x, 0) //on WinOS, when minimizing, sometimes the x & y vals are negative, hiding the window.
    persistent_values.dde_window_y      = Math.max(persistent_values.dde_window_y, 0)
    if(persistent_values.dde_window_width  <= 60)  { persistent_values.dde_window_width  = the_defaults.dde_window_width  }
    if(persistent_values.dde_window_height <= 20)  { persistent_values.dde_window_height = the_defaults.dde_window_height }
    const path = add_default_file_prefix_maybe("dde_persistent.json")
    var content = JSON.stringify(persistent_values)
    content = replace_substrings(content, ",", ",\n") //easier to read & edit
    content = content.replace('"files_menu_paths":[', '"files_menu_paths":[\n') //just insert newline to improve formatting of the file
    content = "//This file content must live in Documents/dde_apps/dde_persistent.json\n" +
              "//Upon DDE launch, this file is loaded before Documents/dde_apps/dde_init.js\n" +
              "//Because this file is automatically saved while running DDE, only edit it with DDE closed.\n" +
              "//It must be syntactically perfect, so edit it with care.\n" +
              "//Within DDE, use persistent_get(key) and persistent_set(key, new_value)\n" +
              "//to access each of the below variables.\n\n"
              + content
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
        if(files){
            let slashified_files = []
            for(let file of files){
                file = convert_backslashes_to_slashes(file)
                slashified_files.push(file)
            }
            persistent_values.files_menu_paths = slashified_files
        }
        //protect against the tiny window bug.
        let the_defaults = get_persistent_values_defaults()
        if(persistent_values.dde_window_width  <= 60)  { persistent_values.dde_window_width  = the_defaults.dde_window_width  }
        if(persistent_values.dde_window_height <= 20)  { persistent_values.dde_window_height = the_defaults.dde_window_height }
    }
    persistent_load_fill_in_defaults() //this is needed when a new persistent var is added accross a release,
                                       //or the user deletes a var in the .json file
}

function persistent_load_fill_in_defaults(){
    let defaults = get_persistent_values_defaults()
    let needs_saving = false
    for(let key in defaults){
       if(!persistent_values.hasOwnProperty(key)){
           persistent_values[key] = defaults[key]
           needs_saving = true
       }
    }
    if(needs_saving){
        persistent_save()
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
    if(!file_exists("")){
        dde_error("dde_init_dot_js_initialize called but there is no Documents/dde_apps/ folder.")
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
        if(!Brain.brain0) {
            add_to_dde_init_js += '\nnew Brain({name: "brain0"})\n'
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
                  '//This file content must live in Documents/dde_apps/dde_init.js\n' +
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
                  'new Brain({name: "brain0"})\n' +
                  'new Dexter({name: "dexter0"}) //dexter0 must be defined.\n'

        eval(initial_dde_init_content)
        write_file("dde_init.js", initial_dde_init_content)
        if(!Editor.files_menu_paths_empty_or_contains_only_dde_init()){ // we don't want to
            //print out this message on first DDE launch or if they haven't even
            //saved a file yet, so as not to scare new users.
            out("DDE uses the file: Documents/dde_apps/dde_init.js<br/>" +
                "to store JavaScript to be evaluated when DDE is Launched.<br/>" +
                "DDE didn't find the file so a default one was created.<br/>" +
                "If this is your first launch of DDE, this is normal.",
                "green")
        }
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
//for referencing a file on dexter, path example 'Dexter.dexter0:/srv/samba/share/errors
function read_file_async(path, encoding="utf8", callback){
    let dex_instance = path_to_dexter_instance(path)
    if(dex_instance){
           if(node_server_supports_editor(dex_instance)) {
               read_file_async_from_dexter_using_node_server(dex_instance, path, callback)
           }
           else {
               read_file_async_from_dexter_using_job(dex_instance, path, callback)
           }
    }
    else if (is_dexter_path(path)){
        dde_error("In read_file_async of path: " + path +
                  "<br/>there is no Dexter instance defined of that Dexter name.")
    }
    else if(path.startsWith("http://") || path.startsWith("https://")){
        get_page_async(path, function(err, response_object, data){
            if((err === null) && (data === "404: Not Found")){
                err = new Error("get_page_async could not find file: " + path)
            }
            callback(err, data)
        })
    }
    else {
        path = make_full_path(path)
        fs.readFile(path, encoding, callback)
    }
}
module.exports.read_file_async = read_file_async

//this really isn't an async fn but since we want it to behavir like
//read_file_async, it has to call the callback, so we do it.
function read_file_async_from_dexter_using_node_server(dex_instance, path, callback){
    let colon_pos = path.indexOf(":")
    path = path.substring(colon_pos + 1) // path comes in as, for example,  "Dexter.dexter0:foo.txt
    if(path.startsWith("/")) {
        //path = path.substring(1) //because of crazy node server editor's code
    }
    else { //doesn't start with slash, meaning relative to server default
        path = "dde_apps/" + path //  on the node webserver, starting with / means ?srv/samba/share/
                                    // so we add the dde_apps to be consistent with dde's default dir.
    }
    let url = "http://" + dex_instance.ip_address + "/edit?edit=" + path //example: "http://192.168.1.142/edit?edit=root/dde_apps/dde_init.js" whereby no beiginning slas actually means going from the server's top level of file system
    let req = {
        uri: url,
        encoding: null
    }
    let content_array = get_page(req) //does not error if file doens't exist so ...
    let content = content_array.toString("binary"); //Strings can contain binary file content
    let the_err = null
    if(content.startsWith("Error:")){
       the_err = content
       content = undefined
    }
    //if(content.startsWith("Error:")){
    //    the_err = new Error()
    //    the_err.message = content
    //    content = null
    //}
    callback(the_err, content)
}

function read_file_async_from_dexter_using_job(dex_instance, path, callback){
    console.log("top of read_file_async_from_dexter_using_job passed path: " + path)
    let colon_pos = path.indexOf(":")
    let dex_file_path = path.substring(colon_pos + 1)
    new Job({name: "dex_read_file",
        robot: dex_instance,
        do_list: [
            Dexter.read_file(dex_file_path, "file_content"),
            function(){
                let cont = this.user_data.file_content
                if(typeof(cont) == "string"){
                    callback(null, cont)
                }
                else {
                    let err = new Error("Error getting file content for: " + the_path + " with error number: " + cont, the_path)
                    callback(err, cont)
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
    else { return null }
}

module.exports.choose_file = choose_file

function choose_folder(show_dialog_options={}) {
    let props = show_dialog_options.properties
    if(!props) {
        props = ["openDirectory"]
    }
    else {
        if (!props.includes("openDirectory")){
            props.push("openDirectory")
        }
    }
    show_dialog_options.properties = props
    return choose_file(show_dialog_options)
}
module.exports.choose_folder = choose_folder

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
    if((encoding === null) && (typeof(content) === "string")){
         content = new Buffer(content, null)
    }

    try{ fs.writeFileSync(path, content, {encoding: encoding}) }
    catch(err){
        if(err.message.startsWith("Access denied")){
            dde_error("You are not permitted to access files<br/>" +
                " outside of Documents/dde_apps such as<br/>" +
                path)
        }
        else {
            dde_error("Error writing file: " + path + "<br/>" + err.message)
        }
    }
}

module.exports.write_file = write_file

//path example: "Dexter.dexter0:junk.js"
//callback takes one arg, err. If it is null, there's no error
//from https://www.npmjs.com/package/request#requestoptions-callback,
//encoding: at least in the http case, "if you expect binary data, you should set encoding: null",

function write_file_async(path, content, encoding="utf8", callback=write_file_async_default_callback){
    if (path === undefined){
        if (Editor.current_file_path == "new buffer"){
            dde_error("Attempt to write file but no filepath given.")
        }
        else { path = Editor.current_file_path }
    }
    if (content === undefined) {
        content = Editor.get_javascript()
    }
    //console.log("path: " + path + " " + content)
    let dex_instance = path_to_dexter_instance(path)
    if(dex_instance){
        if(node_server_supports_editor(dex_instance)) {
            write_file_async_to_dexter_using_node_server(dex_instance, path, content, callback)
        }
        else {
            write_file_async_to_dexter_using_job(dex_instance, path, content, callback)
        }
    }
    else if (is_dexter_path(path)){
        dde_error("In write_file_async of path: " + path +
            "<br/>there is no Dexter instance defined of that Dexter name.")
    }
    else { //the usual case, Just writing a file to the local file system
        path = make_full_path(path)
        //fs.writeFile(path, content, encoding, callback)   //doesn't auto create folders
        fsPath.writeFile(path, content, encoding, callback) //does auto create folders, just like
        //the node-server does.
    }
}

module.exports.write_file_async = write_file_async

function write_file_async_default_callback(err){
    if(err){
        dde_error("write_file_async error: " + err.message)
    }
    else {
        out("saved: file", undefined, true)
    }
}


function write_file_async_to_dexter_using_node_server(dex_instance, path, content, callback){
    //console.log("write_file_async_to_dexter_using_node_server with path: " + path + "  " + content)
    let colon_pos = path.indexOf(":")
    path = path.substring(colon_pos + 1) // path comes in as, for example,  "Dexter.dexter0:foo.txt
    if(path.startsWith("/")) {} //leave path alone
    else { //path doesn't start with slash, meaning relative to server default
        path = "/srv/samba/share/dde_apps/" + path
    }

//do not single step the below code. Must be done in one fell swoop.
    let ip = dex_instance.ip_address
    let r = request.post('http://' + ip + '/edit', callback)
    let form = r.form(); //tack on a form before the POST is done... Don't step through
    form.append("data", content, {filepath: path}); //path could be "foo.txt" in which case the folder
       //defaults to /srv/samba/share,  OR path can be /srv/samba/share/foo.txt
}

function write_file_async_to_dexter_using_job(dex_instance, path, content, callback){
    let colon_pos = path.indexOf(":") //will not return -1
    let dex_file_path = path.substring(colon_pos + 1)
    let the_job = new Job({name: "dex_write_file",
        robot: dex_instance,
        do_list: [
            Dexter.write_file(dex_file_path, content),
            callback //but never passes an error object. not good, but robot_status should contain an error, and error if there is one, else callback should be called with no error so it does what it should do when no error
        ]
    })
    the_job.start()
}

//https://stackoverflow.com/questions/3459476/how-to-append-to-a-file-in-node
//https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
function append_to_file(path, content, encoding="utf8"){
    path = make_full_path(path)
    let stream = fs.createWriteStream(path, {flags:'as', encoding: encoding});
    stream.write(content)
    stream.end();
}
module.exports.append_to_file = append_to_file

//the callback takes 1 arg, err. IF it is passed non-null, there's an error.
// copy_file_async("foo/bar.js", "Dexter.dexter0:bar_copy.js"
function copy_file_async(source_path, destination_path, callback=null){
    if(!callback) {
        callback = function(err){
            if(err){
                dde_error("In call to: copy_file_async<br/>from: " +  source_path + "<br/> &nbsp;&nbsp;&nbsp;&nbsp;to: " +
                    destination_path + "<br/>error: " + err.message)
            }
            else {
                out("copy_file_async<br/>from: " +  source_path + "<br/> &nbsp;&nbsp;&nbsp;&nbsp;to: " +
                    destination_path + "<br/>succeeded.", "green")
            }
        }
    }
   read_file_async(source_path, null, //"ascii" was used up thru dde3.8.3, but doesn't copy binary files properly
                                               // "binary" *should* faithfully read and write content without modification but doesn't
                                               // "ascii" fails on jpg files.

      function(err, data){
        if(err) { //only call the callback for the read IF there's a read error.
            callback(err)
        }
        else {
            write_file_async(destination_path, data, "ascii", callback)
        }
      })
}
/*
function copy_file_async_default_callback(err){
    if(err){
        dde_error("copy_file_async error: " + err.message)
    }
    else {
        out("copy_file_async succeeded.")
    }
}
*/

function copy_folder_async_default_callback(err){
    if(err){
        dde_error("copy_folder_async error: " + err.message)
    }
    else {
        out("copy_folder_async completed successfully")
    }
}
module.exports.copy_file_async = copy_file_async

//example: copy_folder(foo/bar, Dexter
//beware, can't yet handle copying folders FROM dexter to dde.
/*function copy_folder_async(source_folder, destination_folder, callback=copy_folder_async_default_callback){
    let paths = folder_listing(source_folder, true, true, true) //include files, folders, and returned string has full path
    for(let path of paths) {
       let last_slash_pos = path.lastIndexOf("/")
       let name = path.substring(last_slash_pos + 1)
       let dest_path_last_char = destination_folder[destination_folder.length - 1]
       let dest_path = ((dest_path_last_char === "/") ? destination_folder + name
                                                      : destination_folder + "/" + name)
        if(is_folder(path)) { //is_folder only works on DDE paths, not on Dexter paths.
           copy_folder_async(path, dest_path, callback)
       }
       else {
           copy_file_async(path, dest_path, callback)
       }
    }
}*/

/*function copy_folder_async(source_folder, destination_folder, callback=copy_folder_async_default_callback){
    let paths = folder_listing(source_folder, true, true, true) //include files, folders, and returned string has full path
    copy_files_async(paths, destination_folder, callback, null, true)
}*/

//callback is the doneCb
function copy_folder_async(source_folder, destination_folder, callback=copy_folder_async_default_callback){
    source_folder = make_full_path(source_folder)   //todo change due to Dexter,dexter0: type paths
    if(last(destination_folder) === "/") {
        destination_folder = destination_folder.substring(0, destination_folder.length - 1)
    } //but don't make destination folder be a full path. Just leave it so that copy_file_async can worry about that.
    let fileCb = function(file, next){
                    out("fileCb called with file: " + file + " next: " + next);
                    let file_name_start_pos = file.lastIndexOf("/")
                    let file_name = file.substring(file_name_start_pos + 1) //excludes beginning slash
                    let source_folder_len = source_folder.length
                    let file_minus_source_folder = file.substring(source_folder_len)
                    let destination_file = destination_folder + file_minus_source_folder
                    //let destination_file = destination_folder + "/" + file_name
                    copy_file_async(file, destination_file,
                                     function(err){
                                         if(err) {
                                           dde_error("copy_file_async failed to copy: " + file +
                                                     " to: " + destination_folder +
                                                     "<br/>" + err.message)
                                         }
                                         else {
                                             next(false)
                                         }
                                     })
                 }
    forAllFiles(source_folder, fileCb, callback)
}

module.exports.copy_folder_async = copy_folder_async

/*function copy_files_async(source_files, destination_folder, all_done_callback, file_done_callback, top_level=false){
    if(source_files.length == 0) {
        if(top_level) {
            all_done_callback.call(null, null)
        }
        else {
            callback.call(null)
        }
    }
    else {
        let path = source_files.shift() //removes first file from source_files
        let last_slash_pos = path.lastIndexOf("/")
        let name = path.substring(last_slash_pos + 1)
        let dest_path_last_char = destination_folder[destination_folder.length - 1]
        let dest_path = ((dest_path_last_char === "/") ? destination_folder + name
            : destination_folder + "/" + name)
        if(is_folder(path)) { //is_folder only works on DDE paths, not on Dexter paths.
            let cb = function(){ copy_files_async(source_files) }
            copy_folder_async(path, dest_path, cb)
        }
        else {
            let cb = function(){ copy_files_async(source_files, destination_folder) }
            copy_file_async(path, dest_path, cb)
        }
    }
}*/

//from http://grammerjack.blogspot.com/2010/12/asynchronous-directory-tree-walk-in.html
// asynchronous tree walk
// root - root path
// fileCb - callback function (file, next) called for each file
// -- the callback must call next(falsey) to continue the iteration,
//    or next(truthy) to abort the iteration.
// doneCb - callback function (err) called when iteration is finished
// or an error occurs.
//
// example:
//
// forAllFiles('~/',
//     function (file, next) { sys.log(file); next(); },
//     function (err) { sys.log("done: " + err); });
function forAllFiles(root, fileCb, doneCb) {
    fs.readdir(root, function processDir(err, files) {
        if (err) {
            doneCb(err) //fry changed this from: fileCb(err);
        } else {
            if (files.length > 0) {
                var file = root + '/' + files.shift();
                fs.stat(file, function processStat(err, stat) {
                    if (err) {
                        doneCb(err);
                    } else {
                        if (stat.isFile()) {
                            fileCb(file, function(err) {
                                if (err) {
                                    doneCb(err);
                                } else {
                                    processDir(false, files);
                                }
                            });
                        } else {
                            forAllFiles(file, fileCb, function(err) {
                                if (err) {
                                    doneCb(err);
                                } else {
                                    processDir(false, files);
                                }
                            });
                        }
                    }
                });
            } else {
                doneCb(false);
            }
        }
    });
}


//for paths starting with "dexter0:" and other dexters, this will always return false.
//you have to use read_file_async for that and pass it a callback that
//handles the err when the file doesn't exist.
function file_exists(path){
    path = make_full_path(path)
    return fs.existsSync(path)
}
module.exports.file_exists = file_exists



//only works for dde computer, not dexter computer paths.
//is syncrhonous
function make_folder(path){
    path = make_full_path(path) //now parh is os_specific
    let path_array = path.split(folder_separator())
    let path_being_built = ""
    for(let path_part of path_array){
        if(path_part != ""){ //often the first and last path_part will be ""
            path_being_built += (folder_separator() + path_part)
            path_being_built = adjust_path_to_os(path_being_built)

            if(!file_exists(path_being_built)){
               try{
                    fs.mkdirSync(path_being_built)
               }
               catch(err){
                   dde_error("In make_folder, could not make: " + path_being_built + "<br/>" +
                             err.message)
               }
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

module.exports.folder_separator = folder_separator

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
    else if(path.startsWith("./")) {  //return "dde_apps/" + path.substring(2)
        return dde_apps_folder + path.substring(1)
    }
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
        let result = path.replace(/\//g, folder_separator())
        //we might have  a path like \C:\foo.txt in which case, take off the initial backslash
        if(result.startsWith("\\") && //looks like we've got WindowsOS path
            //(result.length == 3) && //unnecessarily restrictive
            (result[2] == ":")) {
            result = result.substring(1)
        }
        return result
    }
}

module.exports.adjust_path_to_os = adjust_path_to_os

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

//returns instance of Dexter or null if path is not a dexter path or if no defined dexter at that path
function path_to_dexter_instance(path){
    let dot_pos = path.indexOf(".")
    let colon_pos = path.indexOf(":")
    if(dot_pos == -1) { return false }
    else if (colon_pos == -1) { return false }
    else if (colon_pos < dot_pos) { return false }
    let path_computer_string = path.substring(0, colon_pos)
    let rob = value_of_path( path_computer_string)
    if(rob && rob instanceof Dexter) { return rob }
    else { return null }
}
//returns true if its a path that isn't a top level, has a colon and the
//substring between the beginning of the path and the colon names a defined dexter.
//Beware that if the dexter is not defined YET, then this will return false.
/*function is_dexter_path(path){
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
}*/
//new version: path looks like "Dexter.dexter0:more_text"
//the dexter does not have to be defined for the path to
//be a dexter path.
function is_dexter_path(path){
    if(!path.startsWith("Dexter.")) { return false }
    else {
        let dot_pos = path.indexOf(".")
        let colon_pos = path.indexOf(":")
        if(dot_pos == -1) { return false }
        else if (colon_pos == -1) { return false }
        else if (colon_pos < dot_pos) { return false }
        else { return true }
    }
}

//returns boolean
//this can be called many times a session, but
//the first time its called, it actually does the work
//to figure out if the dexter really supports sending files or not,
//and that result is cached and used on all subsequent calls,
//until dde is booted.
function node_server_supports_editor(dexter_instance){
    if(dexter_instance.supports_editor !== undefined) {
        return dexter_instance.supports_editor
    }
    else {
        let url = "http://" + dexter_instance.ip_address + "/edit/folder.png"
        let content
        try{
            content = get_page({url: url,
                                method: "GET",
                                timeout: 500 //no need for a long timeout here since should
                             //be a local wired connection.
            })
        }
        catch(err) { //could be timeout or just no node server on Dexter.
            dexter_instance.supports_editor = false
            return false
        }
        if(content.startsWith("Error:")){
            dexter_instance.supports_editor = false
            return false
        }
        else {
            dexter_instance.supports_editor = true
            return true
        }
    }
}
module.exports.node_server_supports_editor = node_server_supports_editor


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
        let content
        if(path.endsWith(".py") || path.endsWith(".pyc")){
            content = [path]
        }
        else {
            content = read_file(path) //might error
        }
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
            if(Array.isArray(content)){
                Py.load_file(content[0])
                result = "Loading Python files doesn't return a result."
            }
            else {
                result = window.eval(content)
            }
            window["loading_file"] = prev_loading_file
        }
        catch(err){
            let file_mess = prepend_file_message_maybe(err.message) //do before undefining loading_file
            window["loading_file"] = undefined //must do before calling dde_error or
                                               //it won't get done BUT need dde_error to print out the loading file message.
            dde_error(file_mess)
        }
        out("Done loading file: " + resolved_path, "green")
    }
    return result
}
module.exports.load_files = load_files


//returns true or false. Path is a full path.
function is_folder(path=dde_apps_folder){
    return fs.statSync(path).isDirectory()
}
module.exports.is_folder = is_folder

//could have been called list_folder
function folder_listing(folder=dde_apps_folder, include_files=true, include_folders=true, include_folder_name=true){
    folder = make_full_path(folder)
    let result = []
    let raw_paths = fs.readdirSync(folder);
    for (let name of raw_paths){
        let full_path  = folder + '/' + name
        if(is_folder(full_path)) {
            if(include_folders) {
                if(include_folder_name) { result.push(full_path) }
                else                    { result.push(name) }
            }
        }
        else { //got a file not a folder
             if(include_files) {
                if(include_folder_name) { result.push(full_path) }
                else                    { result.push(name) }
             }
        }
    }
    return result
}
module.exports.folder_listing = folder_listing

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

/*
folder_name_version_extension("foo") =>  ["foo", null, null]
folder_name_version_extension("foo_002") => ["foo", 2, null]
folder_name_version_extension("foo_002.txt") => ["foo", 2, "txt"]
*/

function folder_name_version_extension(path){
    path = make_full_path(path)
    path = adjust_path_to_os(path)
    let folder_parts = path.split("/")
    //folder_parts.shift() //takes off the initial ""
    let names_ver_ext = folder_parts.pop()
    let folder = folder_parts.join("/")
    let names_ver, ext
    if(names_ver_ext.startsWith(".")) { //its a special dot file. This first dot does not signify beginning of the extension
       let last_dot_pos = names_ver_ext.lastIndexOf(".")
       if(last_dot_pos === 0) { //there is no ext.
           ext = null
           names_ver = names_ver_ext
       }
       else { //name does not start with a dot, ie its normal there are 2 dots after the folder
            ext = names_ver_ext.substring(last_dot_pos + 1)
            names_ver = names_ver_ext.substring(0, last_dot_pos)
       }
    }
    else {
        [names_ver, ext] = names_ver_ext.split(".")
        ext = (ext? ext : null)
    }
    let last_underscore_pos = names_ver.indexOf("_")
    let name, ver
    if(last_underscore_pos === -1){
        name = names_ver
        ver = null
    }
    else {
        let ver_maybe = names_ver.substring(last_underscore_pos + 1)
        if(is_string_a_integer(ver_maybe)) {
            ver = parseInt(ver_maybe)
            if(ver >= 0) {
                name = names_ver.substring(0, last_underscore_pos)
            }
            else {
                ver = null
                name = names_var
            }
        }
        else {
            ver = null
            name = names_ver
        }
    }
    return [folder, name, ver, ext]
}
module.exports.folder_name_version_extension = folder_name_version_extension

function get_latest_path(path){
    let [orig_folder, orig_name, orig_ver, orig_ext] = folder_name_version_extension(path)
    let max_ver = -1
    let latest_path = null
    for(let a_path of folder_listing(orig_folder, true, false, true)){
        let [folder, name, ver, ext] =
            folder_name_version_extension(a_path)
        if((name === orig_name) && (ext === orig_ext) && (ver || (ver === 0)) && (ver > max_ver)){
            max_ver = ver
            latest_path = a_path
        }
    }
    //let new_path = orig_folder + orig_name + "_" + max_num + "." + orig_ext
    return latest_path
}
module.exports.get_latest_path = get_latest_path

function make_unique_path(path){
    let latest_path = get_latest_path(path)
    let new_path
    if(latest_path === null){
        let [folder, name, ver, ext] = folder_name_version_extension(path)
        //expect ver to be null since there is no latest_path.
        ext = ((ext === null) ? "" : "." + ext)
        new_path = folder + "/" + name + "_" + 0 + ext
        return new_path
    }
    else {
        let [folder, name, ver, ext] = folder_name_version_extension(latest_path)
        if(ver == null) { ver = 0 }
        else {
            ver = ver + 1
        }
        ext = (ext ? "." + ext : "")
        new_path = folder + "/" + name + "_" + ver + ext
    }
    return new_path
}
module.exports.make_unique_path = make_unique_path

function get_page_async(url_or_options, callback){
    //https://www.npmjs.com/package/request documents request
    //as taking args of (options, cb) but the actual
    //fn itself has params(uri, options, cb
    request(url_or_options, callback)
}
module.exports.get_page_async = get_page_async

var fs        = require('fs'); //errors because require is undefined.
var app       = require('electron').remote;  //in the electron book, "app" is spelled "remote"
var {Robot, Brain, Dexter, Human, Serial}  = require("./robot.js")
var {shouldnt, starts_with_one_of, replace_substrings} = require("./utils")
var Job       = require("./job.js") //because loading a file with new Job in it needs this.




