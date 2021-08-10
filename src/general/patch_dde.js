export var PatchDDE = class PatchDDE {
    /*won't work in LTS due to old JS.
     static dde_2_to_3_loaded = false
    static latest_patch_loaded = null
    static dde_2_to_3_path = null
    static dde_patch_folder = null //parallel to dde_apps.
    */
    static init(){
        this.dde_2_to_3_path  = __dirname + "/user_tools/dde_2_to_3.dde"
        let the_apps_folder = (window.dde_apps_folder ? dde_apps_folder : dde_apps_dir) // so this can run in LTS
        let index = the_apps_folder.lastIndexOf("/")
        this.dde_patch_folder = dde_apps_folder.substring(0, index) + "/dde_patches/patches_for_" + dde_version
        try{
            make_folder(this.dde_patch_folder)
        }
        catch(err){
            warning("PatchDDE could not make the folder:  " + this.dde_patch_folder +
                    "<br/>because: " + err.message +
                    "<br/>This will prevent using the patch system to update DDE.")
        }
        this.git_dde_patch_folder = "https://raw.githubusercontent.com/cfry/dde/master/dde_patches/patches_for_" + dde_version
        this.dde_2_to_3_loaded = false
        this.latest_patch_file_loaded = null
        this.deprecate_db = [
            {old: "close_window",            new: "SW.close_window"},
            {old: "dde_apps_dir",            new: "dde_apps_folder"},
            {old: "Dexter.get_robot_status_immediately", new: "Dexter.get_robot_status", doc: "Dexter.get_robot_status_immediately was never properly implemented."},
            {old: "Dexter.prototype.get_robot_status_immediately", new: "Dexter.prototype.get_robot_status", doc: "Dexter.prototype.get_robot_status_immediately was never properly implemented."},
            {old: "Dexter.prototype.prop",   new: undefined, doc: "Use properties of a Dexter instance directly to get info on the Dexter."},
            {old: "Dexter.RECORD_BLOCK_SIZE", new: "Dexter.STATUS_MODE", doc: "RECORD_BLOCK_SIZE was unused. Now STATUS_MODE indicates the kind of data in the robot_status array."},
            {old: "file_content",            new: "read_file"},
            {old: "Human.recognize_speech",  new: undefined, doc: "no longer supported."},
            {old: "recognize_speech",        new: undefined, doc: "no longer supported."},
            {old: "patch_until",             new: "PatchDDE.patch_until"},
            {old: "serial_path_to_info_map", new: "serial_port_path_to_info_map"}
        ]
    }
    //___________deprecate___________
    //deprecate obj has keys:
    //   old (required), a string
    //   new (if none, no replacement for old), undefined or a string
    //   doc (optional)  undefined or a string.
    static add_to_deprecate_db(obj) {
        let keys = Object.getOwnPropertyNames(obj)
        if(obj.old){
            this.deprecate_db.push(obj)
        }
        else { dde_error("add_to_deprecate_db passed object: " + JSON.stringify(obj) +
                         "<br/>that doesn't have only properties: " + "old, new, doc")
        }
    }

    static old_to_deprecate_object(old){
        for(let obj of this.deprecate_db){
            if(obj.old === old) { return obj }
        }
        return null
    }

    static old_to_deprecate_html(old){
        let obj = this.old_to_deprecate_object(old)
        if(!obj) { return null }
        else {
            if(!this.dde_2_to_3_source){
                this.dde_2_to_3_source=read_file(this.dde_2_to_3_path)
            }
            let old_src = ' ' + old + ' ' //usually old will be in dde_2_to_3 as "var old = foo"
            let in_2_to_3 = this.dde_2_to_3_source.includes(old_src) //warning, not guarenteed to work but probably will.
                 //If problems, consider a flag in deprecate_object of "defined_in_2_to_3: true"
            let html = ""
            if(!obj.new) {
                html += old + " is not supported in DDE version: " + dde_version
                if(doc) {
                    html += "<br/>" + obj.doc
                }
            }
            else {
                let val_of_old = value_of_path(old)
                html += "<code>&nbsp;" + old + " </code> has been deprecated.<br/>"
                html +=  "It is recommended that you replace it with: " +
                         "<code>&nbsp;" + obj.new + " </code><br/>"
                if(in_2_to_3){
                    if(val_of_old === undefined) {
                        html += "You can define it, along with other DDE v2 constructs not in v3,<br/>" +
                                "by evaling: <code>&nbsp;PatchDDE.load_dde_2_to_3() </code><br/>"
                    }
                    else if (this.dde_2_to_3_loaded){
                        html += "It has been defined by evaling: <code>&nbsp;PatchDDE.load_dde_2_to_3() </code><br/>"
                    }
                    else {
                        html += "It is now defined but not by evaling: <code>&nbsp;PatchDDE.load_dde_2_to_3() </code><br/>"
                    }
                }
                if(obj.doc){
                   html += obj.doc
                }
            }
            return html
        }
    }

    //_______dde version 2 to 3 compatibility___________
    static load_dde_2_to_3(){
        load_files(PatchDDE.dde_2_to_3_path)
        PatchDDE.dde_2_to_3_loaded = true
    }
    static show_dde_2_to_3(){
        let read_fn = (window.read_file ? read_file : file_ccontent)
        let src = read_fn(__dirname + "/user_tools/dde_2_to_3.dde")
        out("<pre><code>" + src + "</code></pre>")
    }

    // Patch system_____________
    static path_to_patch_number(path){
        let last_underscore_pos = path.lastIndexOf("_")
        let num_str = path.substring(last_underscore_pos + 1)
        let dot_pos = num_str.indexOf(".")
        num_str.substring(0, dot_pos) //cut off the .dde extenstion
        let patch_number = parseInt(num_str)
        return patch_number
    }

    static git_patch_number_to_path(patch_number){
        return this.git_dde_patch_folder + "/patch_" + dde_version + "_" + patch_number + ".dde"
    }
    //for local paths
    static patch_number_to_path(patch_number){
        return this.dde_patch_folder + "/patch_" + dde_version + "_" + patch_number + ".dde"
    }

    //filters out junk files whose name doens't start with "patch_",
    //puts them in patch_number order
    static patch_paths_lowest_first(){
        let orig_files = folder_listing(this.dde_patch_folder)
        let files = []
        for(let orig_file of orig_files){
            let last_slash = orig_file.lastIndexOf("/")
            let file_name = orig_file.substring(last_slash + 1)
            if(file_name.startsWith("patch_")) {
                files.push(orig_file)
            }
        }
        files.sort(function(f1, f2){
            let f1_patch_num = PatchDDE.path_to_patch_number(f1)
            let f2_patch_num = PatchDDE.path_to_patch_number(f2)
            if(f1_patch_num < f2_patch_num)        { return -1 }
            else if(f1_patch_num === f2_patch_num) { return  0 }
            else                                   { return  1 }
        })
        return files
    }

    //returns null or a string of the path of the latest patch file downloaded.
    /*static latest_patch_file_downloaded(){
        let highest_number_seen = null
        let latest_file = null
        for(let file of folder_listing(this.dde_patch_folder)){ //not sure of the sorting number so go thru all files
            if(file.startsWith("patch_")) { //filter out garbage like ".DS_store" on mac.
                if(!file) { break }
                else {
                    let file_number = this.path_to_patch_number(file)
                    if(highest_number_seen === null) {
                        highest_number_seen = file_number
                        latest_file = file
                    }
                    else if(file_number > highest_number_seen) {
                        highest_number_seen = file_number
                        latest_file = file
                    }
                }
            }
        }
        return latest_file
    }*/

    static latest_patch_file_downloaded(){
       let paths = this.patch_paths_lowest_first()
       if(paths.length === 0) { return null }
       else {
            return paths[paths.length - 1]
       }
    }

    //returns a positive integer or null if no downloaded files for this release.
    static latest_patch_number_downloaded(){
        let file = this.latest_patch_file_downloaded()
        if(file === null) { return  null }
        else { return this.path_to_patch_number(file) }
    }

    static download_all(){
        let patch_number = this.latest_patch_number_downloaded()
        if(patch_number === null) {
            patch_number = 0
        }
        let patch_number_to_download = patch_number + 1
        this.download(patch_number_to_download, true, patch_number_to_download)
    }

    static download(patch_number, get_next=false, initial_patch_number){
        let git_path = this.git_patch_number_to_path(patch_number)
        let dde_path = this.patch_number_to_path(patch_number)
        let cb
        if(get_next) {
            cb = function(err) {
                if(err){ //the error is presumably we asked for a patch file so high that it doesn't yet exist, so we're done
                    //if(err.message.includes("no such file")){ //unfortunately this message happens wnen no net connection OR when no actual new patches found.
                        if(patch_number === initial_patch_number) {
                            out("No new patch files found.")
                        }
                        else { //normal done downloading all patch files for this release
                            let replace_str = "_" + patch_number + ".dde"
                            let with_str    = "_" + (patch_number - 1) + ".dde"
                            let prev_git_path = git_path.replace(replace_str, with_str)
                            out("No patches after: " + prev_git_path + " found.", "green")
                        }
                }
                else { //download successful, try to get the next one
                    out("Downloaded: " + dde_path, "green")
                    PatchDDE.download(patch_number + 1, true, initial_patch_number)
                }
            }
        }
        else {
            cb = function(err){
                if(err) {
                    dde_error("Could not download: " + git_path + "<br/>" +
                               err.message)
                }
                else {
                    out("Downloaded: " + dde_path, "green")
                }
            }
        }
        copy_file_async(git_path, dde_path, cb)
    }



    //load all the files under this.dde_patch_folder + "/" + dde_version)
    //patches can be:
    //  "all" the default
    // a positive integer: load all patches through that patch number.
    // an array of positive integers: load just those patches. Note
    //  this is discouraged because patches *should* be loaded
    // from 1, sequentially, but special circumstances may require something different.
    // Passing an array permits skipping patches, loading the mout of order.
    // If a patch file doesn't exist locally, there is a warning but
    // proceeds on to load the next patch in the array.
    static load(patches="all"){
        if(Array.isArray(patches)){
            for(let patch_number of patches){
                let path = this.patch_number_to_path(patch_number)
                try{
                    load_files(path)
                }
                catch(err){
                    warning("While calling PatchDDE.load, there was an error loading: " + path +
                            "<br/>" + err.message)
                }
            }
        }
        else { //handles patches of "all" and a positive integer
            let files = this.patch_paths_lowest_first()
            for(let file of files) {
                let patch_number = this.path_to_patch_number(file)
                if((typeof(patches) == "number") && (patch_number > patches)){} //don't load this file
                else {
                    load_files(file)
                    this.latest_patch_loaded = file
                }
            }
        }
    }

    static patch_until(before_source=null, version, equal_and_after_source=null){
        if (version_less_than(dde_version, version)) { return eval(before_source) }
        else { //if version is more than or equal to the current dde_version, do this clause
            if (equal_and_after_source) { return eval(equal_and_after_source) }
        }
    }
}

/*
 dde_patch_folder/3.6.5/patch_3.5.6_1.dde might contain
 if(PatchDDE.dde_2_to_3_loaded) {
    foo = bar
 }

 User might add to top of their dde_init.js
 if(window.PatchDDE) {
    PatchDDE.load_dde_2_to_3()
 }

 add to default dde_init.js, under  load_dde_2_to_3 if its there:
 if(window.PatchDDE) {
   PatchDDE.download()
   PatchDDE.load()
}

 */