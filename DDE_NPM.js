var {exec} = require('child_process');

//https://www.npmjs.com/package/npm-programmatic
var npm_p = require("npm-programmatic")

var DDE_NPM = class DDE_NPM {
    static folder
    static wrapper_folder
    static init(){
        this.wrapper_folder = dde_apps_folder + "/npm_packages"
        this.folder =  this.wrapper_folder + "/node_modules/" //used in require(DDE_NPM.folder + "existy")
             //so need to end in slash.
    }
    static uninstall(pkg_name){
        if(this.is_installed(pkg_name, "add_on")){
            npm_p.uninstall([pkg_name],
                {cwd: dde_apps_folder + "/npm_packages/node_modules",
                 global: false,
                 save: true
                })
                .then(function(){
                    out("npm package: " + pkg_name + " successfully uninstalled.")
                })
                .catch(function(err){
                    warning("npm package: " + pkg_name + " could not be uninstalled.<br/>" + err)
                })
        }
        else if (this.is_installed(pkg_name, "built_in")){
            warning("You can't uninstall DDE built_in packages such as <b>" + pkg_name + "</b>.")
        }
        else {
            warning("<b>" + pkg_name + "</b> isn't installed, so it can't be uninstalled.")
        }
    }
    static install(pkg_name){
        out("Installing npm package: " + pkg_name + " .....", "green", true)
        if(!file_exists(this.wrapper_folder)){
            make_folder(this.wrapper_folder)
        }
        npm_p.install([pkg_name],
                      {cwd: dde_apps_folder + "/npm_packages",
                       save: true
                      })
            .then(function(){
                let pkg_name_underscores = replace_substrings(pkg_name, "-", "_")
                out("npm package: " + pkg_name + " successfully installed. To use it, eval: <br/>" +
                    '<code>var ' + pkg_name_underscores + ' = require(DDE_NPM.folder + "' + pkg_name + '") </code>')
            })
            .catch(function(err){
                warning("npm package: " + pkg_name + " could not be installed.<br/>" + err)
            })
       /* if(!file_exists(this.folder + "/package.json")){
            exec("npm init -y", {cwd: this.wrapper_folder}, this.actual_install) //creates package.json
        }
        else {
            this.actual_install()
        }
        */
    }
    /* no longer used. Works but if npm insn't installed on the user's computer
     this will fail unlike using  npm-programmatic
     static actual_install(err, stdout, stderr){
         let pkg_name = this.pkg_now_being_installed
         if(err) {
            this.pkg_now_being_installed = null
            dde_error("installing npm package: " + pkg_name +
                      " errored with: " + err.message)
         }
         else if(stderr) {
             this.pkg_now_being_installed = null
             dde_error("installing npm package: " + pkg_name +
                 " errored with: " + stderr)
         }
         else {
            exec("npm install " + pkg_name, {cwd: this.wrapper_folder},
                (err, stdout, stderr) => {
                    let pkg_name = DDE_NPM.pkg_now_being_installed
                    DDE_NPM.pkg_now_being_installed = null
                    if(err) {
                        dde_error("installing npm package: " + pkg_name +
                                        " errored with: " + err.message) }
                    else { out("npm package: " + pkg_name + " installed.<br/>" +
                               'To require it: <code>require(DDE_NPM.folder + "'+
                        pkg_name + '")</code>') }
                }
            )
        }
    } */

    static is_installed(pkg_name, which="all"){
       if(which === "add_on") {
           return file_exists(dde_apps_folder + "/npm_packages/node_modules/" + pkg_name)
       }
       else if(which === "built_in") {
            return file_exists(__dirname + "/node_modules/" + pkg_name)
        }
       else if(which === "all") {
            if(this.is_installed(pkg_name, "add_on") ||
               this.is_installed(pkg_name, "built_in")) {
                return true
            }
            else { return false }
       }
       else { shouldnt('DDE_NPM.is_installed got invalid <b>which</b> of: "' + which +
                       '".<br/> Use one of: "all", "built_in", "add_on".') }
    }

    static package_json_obj_for_pkg(pkg_name){
        if(this.is_installed(pkg_name, "add_on")){
            let package_json_path = dde_apps_folder + "/npm_packages/node_modules/" + pkg_name + "/package.json"
            let package_json_obj = require(package_json_path)
            return [package_json_obj, "add_on"]
        }
        else if (this.is_installed(pkg_name, "built_in")){
            let package_json_path = __dirname + "/node_modules/" + pkg_name + "/package.json"
            let package_json_obj = require(package_json_path)
            return [package_json_obj, "built_in"]
        }
        else { return [null, null] }
    }

    static info_html(pkg_name){
        pkg_name = pkg_name.trim()
        if(pkg_name.length === 0) {
           return "There is no npm package name to get info on."
        }
        let [package_json_obj, which] = this.package_json_obj_for_pkg(pkg_name)
        if(!package_json_obj){
            return "<b>" + pkg_name + "</b> is not installed."
        }
        else {
            return "<b>" + pkg_name + "</b> version: " + package_json_obj.version +
                   ' is installed as a "' + which + '" package.' +
                   '<br/>Description: ' + package_json_obj.description +
                   `<br/><a href="#" onclick="inspect(DDE_NPM.package_json_obj_for_pkg('` +
                      pkg_name + `')[0])">details</a>`
        }
    }


    static list_default_success_callback(arr){
        inspect(arr)
    }
    static list_default_error_callback(err){
        dde_error("DDE_NPM.list errored with: " + err)
    }

    /* obsoleted by new "list from folders" algorithm.
    static filter_list_array(arr) {
        let result = []
        for(let elt of arr){
            if(elt.startsWith("UNMET DEPENDENCY ")) {
                elt = elt.substring(17)
                result.push(elt)
            }
            else if (elt === "(empty)") { } //don't add to result
            else {
                result.push(elt)
            }
        }
        return result
    }*/

    /* npm+programmatic doesn't get all the packages for "built-in" so go after the node_module folders instead
      static list(which="all",

                success_callback=DDE_NPM.list_default_success_callback,
                error_callback=DDE_NPM.list_default_error_callback){
        if(which === "add_on"){
            npm_p.list(dde_apps_folder + "/npm_packages")
                .then(function (arr) {
                     success_callback(DDE_NPM.filter_list_array(arr))
                })
                .catch(error_callback)
        }
        else if(which === "built_in"){
            npm_p.list(__dirname)
                .then(function (arr) {
                    warning('Not all packages installed in DDE are shown.<br/> Eval <code>require("pkg_name") to determine if a package is installed.')
                    success_callback(DDE_NPM.filter_list_array(arr))
                    })
                .catch(error_callback)
        }
        else if(which="all"){
            npm_p.list(__dirname)
                .then(function (arr) {
                    let built_in_arr = arr
                    npm_p.list(dde_apps_folder + "/npm_packages")
                        .then(function (arr) {
                            let all_arr = built_in_arr.concat(arr)
                            all_arr = DDE_NPM.filter_list_array(all_arr)
                            success_callback(all_arr)
                        })
                        .catch(error_callback)
                })
                .catch(error_callback)
        }
        else {
            dde_error('DDE_NPM.list passed invalid <b>which</b> of: ' + which +
                      '<br/>which is not one of: ' +
                      '<code>"add_on"</code>, <code>"built_in"</code> or <code>"all"</code>.')
        }
    }*/
    static list(which="all",
                success_callback=DDE_NPM.list_default_success_callback,
                error_callback=DDE_NPM.list_default_error_callback){
        if(which === "add_on"){
            let path_to_nm = dde_apps_folder + "/npm_packages/node_modules"
            if(file_exists(path_to_nm)){
                return folder_listing(path_to_nm, false, true, false)
            }
            else { return [] }
        }
        else if(which === "built_in"){
            return folder_listing(__dirname + "/node_modules", false, true, false)
        }
        else if(which="all"){
            let add_on_names = this.list("add_on")
            let built_in_names = this.list("built_in")
            let all_names = add_on_names.concat(built_in_names)
            return all_names //If I don't sort, you can sort of tell that the top names are add_ons
        }
        else {
            dde_error('DDE_NPM.list passed invalid <b>which</b> of: ' + which +
                '<br/>but that is not one of the valid: ' +
                '<code>"add_on"</code>, <code>"built_in"</code> or <code>"all"</code>.')
        }
    }

    //called by Manage NPM dialog's "Insert require()" button
    static insert_require_for(pkg_name){
       let path_prefix = ""
       if(this.is_installed(pkg_name, "add_on")){
           path_prefix = "DDE_NPM.folder + "
       }
       let full_arg = path_prefix + '"' + pkg_name + '"'
       let var_name = replace_substrings(pkg_name, "-", "_")
       let insertion = 'var ' + var_name + ' = require(' + full_arg + ")\n"
       Editor.insert(insertion)
       /*this.list("add_on", function(arr){
           let pkg_name_at = pkg_name + "@" //because an elt in the array looks like "foo@1.2.3" with ist verison nubmer on the end.
           let pkg_name_prefix = ""
           for(let str of arr){
               if(str.startsWith(pkg_name_at)){
                   pkg_name_prefix = "DDE_NPM.folder + "
                   break;
               }
           }
           let insertion = 'var ' + pkg_name + ' = require(' + pkg_name_prefix + '"' + pkg_name + '")\n'
           Editor.insert(insertion)
       })*/
    }
    static wrap_in_show_ui_calls(array_of_pkg_names){
        let result = []
        for(let pkg_name of array_of_pkg_names){
           //let html = `<a href='#' onclick="DDE_NPM.show_ui_really('` + pkg_name + `')">` + pkg_name + `</a>`
            let html = "<a href='#' title='Insert this package name into the \"Manage NPM packages\" dialog.' onclick='DDE_NPM.show_ui_really(" +
                       '"' + pkg_name + '"' + ")'>" + pkg_name + "</a>"
           result.push(html)
        }
        return result
    }
    //called from File menu item "npm install"
    static ui_handler(vals){
        let pkg_name = vals.pkg_name_id
        pkg_name = pkg_name.trim()
        if (vals.clicked_button_value === "install_button"){
            if(pkg_name.length === 0) {
                warning("No NPM package name given to install.")
            }
            else { DDE_NPM.install(pkg_name) }
        }
        else if (vals.clicked_button_value === "uninstall_button"){
            if(pkg_name.length === 0) {
                warning("No NPM package name given to uninstall.")
            }
            else { DDE_NPM.uninstall(pkg_name) }
        }
        else if (vals.clicked_button_value === "insert_require_button"){
            DDE_NPM.insert_require_for(pkg_name)
        }
        else if (vals.clicked_button_value === "list_add_on_button"){
            inspect(DDE_NPM.wrap_in_show_ui_calls(DDE_NPM.list("add_on")))
        }
        else if (vals.clicked_button_value === "list_built_in_button"){
            inspect(DDE_NPM.list("built_in"))
        }
        else if (vals.clicked_button_value === "list_all_button"){
            inspect(DDE_NPM.list("all"))
        }
        else if(vals.clicked_button_value === "info_button"){
            out(DDE_NPM.info_html(pkg_name))
        }
        else if(vals.clicked_button_value === "doc_button"){
            browse_page("https://www.npmjs.com/package/" + pkg_name)
        }
        else if(vals.clicked_button_value === "search_button"){
            browse_page("https://www.npmjs.com/search?q=" + encodeURIComponent(pkg_name)) //warning: search term might have spaces in it so do the encoding
        }
    }

    static show_ui(){
        open_doc(DDE_NPM_doc_id)
        exec("npm list", {cwd: dde_apps_folder}, function(err, stdout, stderr){ //stderr will be a string. It is an empty string if our bash cmd succeeded.
            if(err || (stderr.length > 0)) {
                     warning("It appears that npm is not installed on your computer.<br/>" +
                             `Please browse <a href='#' onclick='browse_page("https://nodejs.org/en/download")'>the node website</a> to install it.` +
                             `<br/>You must install node to get npm.`)
            }
            else{ DDE_NPM.show_ui_really() }
        })
    }

    static show_ui_really(pkg_name = ""){
        if(window.pkg_name_id) {
            pkg_name_id.value = pkg_name
        }
        else {
          show_window({
            title: "Manage npm packages",
            width: 350,
            height: 270,
            content: `List existing top-level packages:<p/>
                      <input type="button" name="list_add_on_button"   value="List add_on"   style='margin-left:20px;'
                        title="List the top level npm packages that you have installed on this computer for use in DDE."/>
                      <input type="button" name="list_built_in_button" value="List built_in" style='margin-left:20px;' 
                        title="List the npm packages built into this release of DDE."/>                 
                      <input type="button" name="list_all_button"      value="List all"      style='margin-left:20px;'
                        title="List the built_in and add_on npm packages for use in DDE."/>
                      <hr/>
                      Enter npm package name or search string:<br/>
                      <p></p>
                      <input id="pkg_name_id" autofocus style="margin-left:20px;width:200px;font-size:16px;" value="` + pkg_name + `"/>
                      <p></p>  
                      <input type="button" name="info_button"           value="Info"             style='margin-left:20px;' title="Prints some information about the named package that is availible in this computer."/>
                      <input type="button" name="doc_button"            value="Doc"              style='margin-left:20px;' title="Browses the npm web page for the named package, if it exists."/>
                      <input type="button" name="search_button"         value="Search"           style='margin-left:20px;' title="Searches the npm website for packages related to the text in the type-in field."/>
                      <p></p>
                      <input type="button" name="install_button"        value="Install"          style='margin-left:20px;' title="Installs the named package as an 'add_on'."/>
                      <input type="button" name="uninstall_button"      value="Uninstall"        style='margin-left:20px;' title="Uninstalls the named package if it is installed as an 'add_on'."/>
                      <input type="button" name="insert_require_button" value="Insert require()" style='margin-left:20px;' title="Inserts a call to 'require' for the named package, into the editor."/>`,

            callback: "DDE_NPM.ui_handler"
            })
        }
    }
}