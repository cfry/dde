//import {eval_js_part2} from "../../general/eval.js" //now this is global

class DDEFile {
    //utilities
    static convert_backslashes_to_slashes(a_string){
        return a_string.replace(/\\/g, "/")
    }

    static is_root_path(path){
        if(path.startsWith("/")) { return true }
        else if ((path.length > 1) && (path[1] == ":")){ //WinOS junk. Maybe unnecessary in dde4
            let first_char = path[0]
            return ((first_char >= "A") && (first_char <= "Z"))
        }
        else { return false }
    }

    static add_default_file_prefix_maybe(path){
        path = DDEFile.convert_backslashes_to_slashes(path)
        if (this.is_root_path(path)) { return path }
        else if ((path === "dde_apps") || path.startsWith("dde_apps/")) { return path }
        else if (path == "new buffer") { return path } //needed by Editor.edit_file
        else { return "dde_apps/" + path }
    }
    /*    else if (path.includes(":")) { return path }
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
    }*/

    static make_url(path, query=""){
        //if (adjust_to_os) { path = adjust_path_to_os(path) }
        let url
        let colon_pos = path.indexOf(":")
        let extracted_path
        if(path.startsWith("Dexter.")){
            if(colon_pos === -1) {
                dde_error("The path of: " + path + " is invalid. If it starts with 'Dexter.'" +
                          "It must contain a colon and that colon must be after the name" +
                          "of the Dexter.")
            }
            else {
                let [full_dex_name, extracted_path] = path.split(":")
                let dex = Utils.value_of_path(full_dex_name)
                if(!dex) {
                    dde_error("The path of: " + path + " is invalid because<br/>" +
                        full_dex_name + " is not defined as a Dexter instance.<br/>" +
                        "You need to define a Dexter instance with that name and<br/>" +
                        "an ip_address to use that path.")
                }
                let ip_address = dex.ip_address
                extracted_path = this.add_default_file_prefix_maybe(extracted_path)
                url = "http://" + ip_address + query + extracted_path
            }
        }
        else if(path.startsWith("host:")){
            let [full_dex_name, extracted_path] = path.split(":")
            let ip_address = this.host //might return "localhost"
            extracted_path = this.add_default_file_prefix_maybe(extracted_path)
            url = "http://" + ip_address + query + extracted_path
        }
        else if (path.includes(":")) {
            if(query !== "") {
                let [protocol, host, extracted_path] = path.split(":")
                if((protocol === "http") || (protocol === "https")){
                    extracted_path = this.add_default_file_prefix_maybe(extracted_path)
                    url = protocol + ":" + host + query + path
                }
                else { //only 1 colon, assume its NOT the suffix to host but the separataor between host and path
                    extracted_path = host
                    host = protocol
                    extracted_path = this.add_default_file_prefix_maybe(extracted_path)
                    url = "http" + "://" + host + //":" +  //don't insert this colon. causes fetch to break
                        query + extracted_path
                }
            }
            else { url = path }
        }
        else {
            path = this.add_default_file_prefix_maybe(path)
            url = "http://" + this.host() + //":" +
                   query + path
        }
        return url
    }

    static host(){
        if(globalThis.platform === "node") {
            return "localhost" //localhost:50000"
        }
        else {
            return globalThis.location.host //ex: "192.168.1.142:5000", "localhost:80"
        }
    }
    /*
    static is_server_on_dexter(){ //dde4 todo compare this.host to each one of the defined dexters,
        //and if ONE of them matches host, then return true lese return false.
        return this.host().startsWith("192.168.")

    }*/

    //returns something like "http://localhost:80" or
    //                       "http://192.168.1.142"
    static protocol_and_host(){ //includes port
        return globalThis.location.protocol +  // "http:" or "https:"
               "//" +
               this.host()
    }

    static extract_domain_from_url(url){
        let [protocol, empty, domain] = url.split("/")
        return domain
    }



    //static dde_apps_folder_url
    static init(){
        /*if(this.is_server_on_dexter()){
            dde_apps_folder = "/srv/samba/share/dde_apps"
        }
        else {
            dde_apps_folder = "/Users/Fry/Documents/dde_apps" //todo should come from persisitent_db
        }
        this.dde_apps_folder_url = this.protocol_and_host() + "//" +
                                   dde_apps_folder
        */
    }
    static ensure_ending_slash(str){
        str = str.trim()
        if(str.endsWith("/")) { return str }
        else { return str+ "/" }
    }

    static ensure_no_ending_slash(str){
        str = str.trim()
        if(str.endsWith("/")) { return str.substring(0, str.length - 1) }
        else { return str }
    }

    static callback_or_error(callback, error_message="got error"){
        if (callback) {
            callback(error_message)
        }
        else {
            dde_error(error_message)
        }
    }

    static callback_or_return(callback, value="got error"){
        if (callback) {
            callback(null, value)
        }
        else {
            return value
        }
    }

    //______end Utilites______
    //Core file manipulation methods

    static async file_exists(path, callback){
        //if(!path.startsWith("/")) {path = dde_apps_folder + "/" + path}
        //path = this.add_default_file_prefix_maybe(path)
        let full_url =  this.make_url(path, "/edit?edit=")
        //full_url = full_url.substring(1) //cut off the leading slash makes the server code
        //think that this url is a root url for some strange reason.
        //see httpd.mjs, serve_file()
        let file_info_response = await fetch(full_url)
        return this.callback_or_return(callback, file_info_response.ok)
    }

    /*static async get_page_async(url_or_options, callback){
        //https://www.npmjs.com/package/request documents request
        //as taking args of (options, cb) but the actual
        //fn itself has params(uri, options, cb
        //request(url_or_options, callback)
        let url, options, response, err, body
        if(typeof(url_or_options) === "string") {
            url = url_or_options
            options = { credentials: 'include',
                mode: 'cors'} // no-cors, *cors, same-origin } //attempt to get cross domain urls. might not work
                              // see https://developer.mozilla.org/en-US/docs/Web/API/Request/mode
            response = await fetch(url, options)
        }
        else {
            response = await fetch(url_or_options)
        }
        if(response.ok){
            return this.callback_or_return(callback, body)
        }
        else {
            let err = ("get_page_async didn't work.")
            return this.callback_or_error(callback, err)
        }
    }*/
    static async get_page_async(url_or_options, callback){
        //https://www.npmjs.com/package/request documents request
        let full_url = "http://" + this.host() + "/get_page?path=" + url_or_options
        //let full_url =  this.make_url(url_or_options, "/get_page?path=")
        let response = await fetch(full_url)
        if(response.ok){
            let content = await response.text()
            return this.callback_or_return(callback, content)
        }
        else {
            let err = ("get_page_async didn't work.")
            return this.callback_or_error(callback, err)
        }
    }

    //path can be a file, a folder, or a non-existant path.
    //returns null, if non-existant, else
    //a JSON object with the fields documented in
    static async path_info(path = "dde_apps", callback){
        ///if(!path.startsWith("/")) {    path = dde_apps_folder + "/" + path
        //path = this.add_default_file_prefix_maybe(path)
        //let full_url = this.protocol_and_host() + "/edit?info=" + path
        let full_url = this.make_url(path, "/edit?info=")
        //full_url = full_url.substring(1) //cut off the leading slash makes the server code
        //think that this url is a root url for some strange reason.
        //see httpd.mjs, serve_file()
        // see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
        let file_info_response = await fetch(full_url) //, {mode: 'no-cors'}) // no-cors)
        if(file_info_response.ok) {
            let content = await file_info_response.text()
            if(content === "null") {
                return this.callback_or_return(callback, null)
            }
            else {
                let json_obj = JSON.parse(content)
                let is_dir = json_obj.kind === "folder"
                let perm_str = Utils.permissions_integer_string_to_letter_string(json_obj.permissions, is_dir)
                json_obj.permissions_letters = perm_str
                return this.callback_or_return(callback, json_obj)
            }
        }
        else {
            this.callback_or_error(callback, "DDEFile.path_info for: " + path + " got error: " + file_info_response.status)
        }
    }

    static async is_folder(path, callback){
        let info_obj = await this.path_info(path)
        if(info_obj === null) {
            return this.callback_or_return(callback, false)
        }
        else {
            let is_fold = info_obj.kind === "folder"
            return this.callback_or_return(callback, is_fold)
        }
    }



    //callback is optional. If not passed, return a promise
    static async read_file_async(path, callback){
        if (path === undefined) {
            if (Editor.current_file_path == "new buffer"){
                this.callback_or_error(callback, "Attempt to read_file_async but no path given.")
            }
            else { path = Editor.current_file_path }
        }
        let full_url = this.make_url(path, "/edit?edit=")
        //path = this.add_default_file_prefix_maybe(path)
        //let full_url = this.protocol_and_host() +  "/edit?edit=" + path
        let file_info_response = await fetch(full_url,  {mode: 'no-cors'}) // unnecessary to specify the no-cors, but it doesnt' hurt, {mode: 'no-cors'})
        if(file_info_response.ok) {
            let content = await file_info_response.text()
            return this.callback_or_return(callback, content)
        }
        else {
            this.callback_or_error(callback, "DDEFile.read_file_async of: " + path + " got error: " + file_info_response.status)
        }
    }

    static async read_file_part(path, start=0, length=80, callback){
        if (path === undefined) {
            if (Editor.current_file_path == "new buffer"){
                this.callback_or_error(callback, "Attempt to read_file_async but no path given.")
            }
            else { path = Editor.current_file_path }
        }
        let full_url = this.make_url(path,
                                    "/edit?start=" + start +
                                    "&length=" + length + "&read_part=")
        //path = this.add_default_file_prefix_maybe(path)
        //let full_url = this.protocol_and_host() +  "/edit?edit=" + path
        let file_info_response = await fetch(full_url) // unnecessary to specify the no-cors, but it doesnt' hurt, {mode: 'no-cors'})
        if(file_info_response.ok) {
            let content = await file_info_response.text()
            return this.callback_or_return(callback, content)
        }
        else {
            this.callback_or_error(callback, "DDEFile.read_file_part of: " + path + " got error: " + file_info_response.status)
        }
    }


    //content can be a string or a blob, and a "file" object is a blob.
    static async write_file_async(path, content, encoding= null, callback){ //default was "utf8" in dde3
        if (path === undefined){
            if (Editor.current_file_path == "new buffer"){
                this.callback_or_error(callback, "Attempt to write file but no filepath given.")
            }
            else { path = Editor.current_file_path }
        }
        //path = this.add_default_file_prefix_maybe(path)
        if (content === undefined) {
            content = Editor.get_javascript()
        }
        let orig_content = content
        if(encoding === null) {
            if(Utils.typed_array_name(content) === "Uint8Array") {} //good!
            else if (typeof(content) === "string") {
                content = Utils.string_to_unit8array(content)
            }
            else {
                warning("DDEFile.write_file_async passed content of type: " +
                    typeof (content) + " and encoding of null.<br/>" +
                    "write probably won't write the content correctly.")
            } //todo  good luck! probably need some conversion here.
        }

        let full_url = this.make_url(path, "/edit?")
        //let full_url = this.protocol_and_host() + "/edit" //"/edit?path=path" //"/edit"
        //let res = await fetch(full_url, {method: 'POST', //'PUT', //'POST', //using PUT fails
        //                                 //path: path, //fails
        //                                 body: content})
        let [url_sans_query, path_to_store_content_in] = full_url.split("?")
        let formData = new FormData();
        let blob
        if(typeof(content) === "string"){
            blob = new Blob([content]) //, { type: "text/plain"}); //turns out at least for text files, no tyoe necessary
        }
        else if(Utils.typed_array_name(content) === "Uint8Array") {  //if I atttempt to use the uin9Arry as a blob. I get wrror "content is not of type Blob"
            blob = new Blob([content.buffer])
        }
        else { blob = content } //probably a "file" object from upload
        formData.append("data", blob, path_to_store_content_in);
        //formData.append("name", path)
        let res = await fetch(url_sans_query, {method: 'POST', //'PUT', //'POST', //using PUT fails
                                             body: formData,
                                             mode: 'no-cors'})
        if(res.ok) {
            out("write_file_async wrote file to: " + full_url)
            return this.callback_or_return(callback, orig_content)
        }
        else {
            this.callback_or_error(callback, "DDEFile.write_file_async of: " + path + " got error: " + res.status)
        }
    }

    static async append_to_file(path, content, encoding= null, callback){ //default was "utf8" in dde3
        if (path === undefined){
            if (Editor.current_file_path == "new buffer"){
                this.callback_or_error(callback, "Attempt to write file but no filepath given.")
            }
            else { path = Editor.current_file_path }
        }
        //path = this.add_default_file_prefix_maybe(path)
        if (content === undefined) {
            content = Editor.get_javascript()
        }
        let orig_content = content
        if(encoding === null) {
            if(Utils.typed_array_name(content) === "Uint8Array") {} //good!
            else if (typeof(content) === "string") {
                content = Utils.string_to_unit8array(content)
            }
            else {
                warning("DDEFile.append_to_file passed content of type: " +
                    typeof (content) + " and encoding of null.<br/>" +
                    "write probably won't write the content correctly.")
            } //todo  good luck! probably need some conversion here.
        }

        let full_url = this.make_url(path, "/edit?")
        //let full_url = this.protocol_and_host() + "/edit" //"/edit?path=path" //"/edit"
        //let res = await fetch(full_url, {method: 'POST', //'PUT', //'POST', //using PUT fails
        //                                 //path: path, //fails
        //                                 body: content})
        let [url_sans_query, path_to_store_content_in] = full_url.split("?")
        let formData = new FormData();
        let blob
        if(typeof(content) === "string"){
            blob = new Blob([content]) //, { type: "text/plain"}); //turns out at least for text files, no tyoe necessary
        }
        else if(Utils.typed_array_name(content) === "Uint8Array") {  //if I atttempt to use the uin9Arry as a blob. I get wrror "content is not of type Blob"
            blob = new Blob([content.buffer])
        }
        else { blob = content } //probably a "file" object from upload
        formData.append("data", blob, path_to_store_content_in);
        //formData.append("name", path)
        url_sans_query += "?append=true"
        let res = await fetch(url_sans_query, {method: 'POST', //'PUT', //'POST', //using PUT fails
                                                    body: formData,
                                                    mode: 'no-cors'})
        if(res.ok) {
            out("DDEFile.append_to_file to: " + this.add_default_file_prefix_maybe(path))
            return this.callback_or_return(callback, orig_content)
        }
        else {
            this.callback_or_error(callback,
                                   "DDEFile.append_to_file to: " +
                                   this.add_default_file_prefix_maybe(path) + " got error: " + res.status)
        }
    }

    static async delete(path, callback){
        if (path === undefined){
            if (Editor.current_file_path == "new buffer"){
                this.callback_or_error(callback, "Attempt to write file but no filepath given.")
            }
            else { path = Editor.current_file_path }
        }
        let full_url = this.make_url(path, "/edit?path=") //but the "?path=path" part of the returned URL
        // is not actually used by the server
        // it uses the formData.append("path" ...
        let [url_sans_query, path_to_store_content_in] = full_url.split("?")
        let formData = new FormData();
        let defaulted_path = this.add_default_file_prefix_maybe(path)
        formData.append("path", defaulted_path)
        let res = await fetch(url_sans_query, {method: 'DELETE',
                                                    body: formData})
        if(res.ok) {
            out("DDEFile.delete deleted: " + defaulted_path)
            return this.callback_or_return(callback, true)
        }
        else {
            this.callback_or_error(callback, "DDEFile.delete_file of: " + path + " got error: " + res.status)
        }
    }

    static async make_folder(path, callback){
        let exists = await this.file_exists(path)
        if(exists) {
            out("DDEFile.make_folder tried to create: " + path + " but it already exists.")
        }
        else {
            let sep = ((Utils.last(path) === "/") ? "" : "/'")
            let temp_file_path = path + sep + "temp_file"
            let write_result = await this.write_file_async(temp_file_path, "the content")
            //out("write_result: " + write_result)
            if(write_result === "the content"){
                this.delete(temp_file_path, callback)
            }
            else {
                this.callback_or_error(callback, "Error calling DDEFile.make_folder(" + path + ")")
            }
        }
    }

    static async copy_file_async(source_path, destination_path, callback){
        let content = await DDEFile.read_file_async(source_path)
        DDEFile.write_file_async(destination_path, content, null, callback)
    }

    static async edit_file(path, dont_save_cur_buff_even_if_its_changed=false, callback){
        let full_url = this.make_url(path, "/edit?edit=")

        let file_info_response = await fetch(full_url)
        if(file_info_response.ok) {
            let content = await file_info_response.text()
            Editor.edit_file(path, content, dont_save_cur_buff_even_if_its_changed) //true means: dont_save_cur_buff_even_if_its_changed
            this.callback_or_return(callback, content)
        }
        else {
            this.callback_or_error(callback, "DDEFile.edit_file of: " + path + " got error: " + file_info_response.status)
        }
    }

    static async insert_file_content(path, callback){
        let full_url = this.make_url(path, "/edit?edit=")
        let file_info_response = await fetch(full_url)
        if(file_info_response.ok) {
            let content = await file_info_response.text()
            Editor.insert(content)
            this.callback_or_return(callback, content)
        }
        else {
            this.callback_or_error(callback, "DDEFile.insert_file_content of: " + path + " got error: " + file_info_response.status)
        }
    }

    static loading_file

    static load_file_callback_default(err, result){
        if(err) {
            dde_error("DDEFile.load_file errored with: " + err.message)
        }
        else {
            out("DDEFile.load_file result: " + result)
        }
    }

    static async load_file(path, callback=DDEFile.load_file_callback_default){
        //if(!path.startsWith("/")) {path = dde_apps_folder + "/" + path}
        //path = this.add_default_file_prefix_maybe(path)
        //let full_url = this.protocol_and_host() + "/edit?edit=" + path
        //full_url = full_url.substring(1) //cut off the leading slash makes the server code
        //think that this url is a root url for some strange reason.
        //see httpd.mjs, serve_file()
        let defaulted_path = this.add_default_file_prefix_maybe(path)
        console.log("load_file passed path: " + path)
        let full_url = this.make_url(defaulted_path, "/edit?edit=")
        console.log("load_file made url: " + full_url)
        //console.log("about to call fetch that has value: " + fetch)
        let file_info_response = await fetch(full_url)
        console.log("load_file after 1st fetch with response: " + file_info_response.ok)
        if(file_info_response.ok) {
            console.log("load_file got response that is OK")
            let content = await file_info_response.text()
            console.log("load_file got content: " + content)
            let result
            try {
                this.loading_file = defaulted_path

                //let result = eval_js_part2(content)
                //this.loading_file = undefined
                //this.callback_or_return(callback, result.value)

                if(path.endsWith(".py")){
                    await Py.init()
                    result = Py.eval(content)
                    console.log("load_file got result: " + result)
                    this.loading_file = undefined
                    this.callback_or_return(callback, result)
                    return
                }
                else if(globalThis.eval_js_part2) { //we're in IDE
                    console.log("load_file in clause globalThis.eval_js_part2")
                    let result_obj = globalThis.eval_js_part2(content).value
                    if(result_obj.err){
                        this.loading_file = undefined
                        this.callback_or_error(callback, err)
                        return
                    }
                    else {
                        result = result_obj.result
                    }
                }
                else { //we're in node
                    console.log("load_file in clause node")
                    //console.log("Dexter.dexter0: " + Dexter.dexter0)
                    result = globalThis.eval(content)
                }
                console.log("load_file got result: " + result)
                this.loading_file = undefined
                this.callback_or_return(callback, result)
            }
            catch(err){
                this.loading_file = undefined
                this.callback_or_error(callback, err)
            }
        }
        else {
            this.loading_file = undefined
            this.callback_or_error(callback,"DDEFile.load_file of: " + defaulted_path + " got error: " + file_info_response.status)
        }
    }

    static async folder_listing(path="dde_apps", callback){
       //if(!path.startsWith("/")) { path = dde_apps_folder + "/" + path }
       //if(!path.endsWith("/")) { path = path + "/" } //httpd.js requires ending slash
        //path = this.add_default_file_prefix_maybe(path)
        path = this.ensure_ending_slash(path)
        let full_url = this.make_url(path, "/edit?list=")
        //path = this.ensure_ending_slash(path) //httpd.js requires ending slash
        //let url = this.protocol_and_host() + "/edit?list=" + path
        let fold_info = await fetch(full_url)
        if(fold_info.ok) {
            let content = await fold_info.text()
            let obj = JSON.parse(content)
            return this.callback_or_return(callback, obj)
        }
        else {
            this.callback_or_error(callback, "DDEFile.folder_listing for: " + path + " got error: " + fold_info.status)
        }
    }

    //______choose methods

    static choose_file_to_edit_handler(vals){
        //out("top of choose_file_handler with: " + vals.clicked_button_value)
        if(vals.clicked_button_value === "close_button") {} //just let window close
        else {
            let window_index = vals.window_index
            SW.close_window(vals.window_index)
            let is_folder = vals.clicked_button_value.endsWith("/")
            if(is_folder){
                DDEFile.choose_file({folder:   vals.clicked_button_value,
                                     title:    "Choose a file from:",
                                     callback: "DDEFile.choose_file_to_edit_handler"})
            }
            else{
                let dont_save_cur_buff_even_if_its_changed = false
                DDEFile.edit_file(vals.clicked_button_value, undefined, dont_save_cur_buff_even_if_its_changed)
            }
        }
    }

    static download_file_handler(vals){
        //out("top of choose_file_handler with: " + vals.clicked_button_value)
        if(vals.clicked_button_value === "close_button") {} //just let window close
        else {
            let window_index = vals.window_index
            SW.close_window(vals.window_index)
            let is_folder = vals.clicked_button_value.endsWith("/")
            if(is_folder){
                DDEFile.choose_file({folder:   vals.clicked_button_value,
                    title:    "Choose a file from:",
                    callback: "DDEFile.download_file_handler"})
            }
            else{
                let dont_save_cur_buff_even_if_its_changed = false
                DDEFile.download_file(vals.clicked_button_value)
            }
        }
    }

    //from https://attacomsian.com/blog/javascript-download-file
    static download (path, filename){
        // Create a new link
        const anchor = document.createElement('a');
        anchor.href = path;
        anchor.download = filename;

        // Append to the DOM
        document.body.appendChild(anchor);

        // Trigger `click` event
        anchor.click();

        // Remove element from DOM
        document.body.removeChild(anchor);
    }


    static async download_file(path, callback){
        let full_url = this.make_url(path, "/edit?edit=")
        let file_info_response = await fetch(full_url)
        if(file_info_response.ok) {
            let type = file_info_response.type //not so good. Returns "basic"
            //let data = await file_info_response.text()
            //see https://attacomsian.com/blog/javascript-download-file
            //const blob = new Blob([data], { type: "text/plain" });
            //from https://developer.mozilla.org/en-US/docs/Web/API/Response
            const blob = await file_info_response.blob() //tested to work with both text files and JPG files.
            const url = URL.createObjectURL(blob);  // Create an object URL
            let last_slash = path.lastIndexOf("/")
            let file_name = path.substring(last_slash + 1)
            this.download(url, file_name);  // Download file
            URL.revokeObjectURL(url) // Release the object URL
            return this.callback_or_return(callback, true)
            }
        else {
            this.callback_or_error(callback,"DDEFile.download_file of: " + path + " got error: " + file_info_response.status)
        }
    }

    static choose_file_to_load_handler(vals){
        //out("top of choose_file_load_handler with: " + vals.clicked_button_value)
        if(vals.clicked_button_value === "close_button") {} //just let window close
        else {
            let window_index = vals.window_index
            SW.close_window(vals.window_index)
            let is_folder = vals.clicked_button_value.endsWith("/")
            if(is_folder){
                DDEFile.choose_file({folder:   vals.clicked_button_value,
                                     title:    "Choose a file from:",
                                     callback: "DDEFile.choose_file_to_load_handler"})
            }
            else{
                let result = DDEFile.load_file(vals.clicked_button_value)
                out(vals.clicked_button_value + " loaded.")
            }
        }
    }

    static async load_and_start_job_handler(vals){
        //out("top of choose_file_load_handler with: " + vals.clicked_button_value)
        if(vals.clicked_button_value === "close_button") {} //just let window close
        else {
            let window_index = vals.window_index
            SW.close_window(vals.window_index)
            let is_folder = vals.clicked_button_value.endsWith("/")
            if(is_folder){
                DDEFile.choose_file({folder:   vals.clicked_button_value,
                    title:    "Choose a file from:",
                    callback: "DDEFile.choose_file_to_load_handler"})
            }
            else{
                let path   = (vals.clicked_button_value)
                await Job.define_and_start_job(path)
                out(vals.clicked_button_value + " loaded.")
            }
        }
    }

    static insert_file_content_handler(vals){
        if(vals.clicked_button_value === "close_button") {} //just let window close
        else {
            let window_index = vals.window_index
            SW.close_window(vals.window_index)
            let is_folder = vals.clicked_button_value.endsWith("/")
            if(is_folder){
                DDEFile.choose_file({folder:   vals.clicked_button_value,
                    title:    "Insert file content:",
                    callback: "DDEFile.insert_file_content_handler"})
            }
            else{
                DDEFile.insert_file_content(vals.clicked_button_value)
            }
        }
    }

    //folder is a string like "/foo/bar" or "/foo/bar/"
    //choose file to edit, etc depending on callback
    static async choose_file({folder="dde_apps",
                              title="Choose file:",
                              x=50, y=50, width=700, height=450,
                              callback=DDEFile.choose_file_to_edit_handler}){
        //if(!folder.startsWith("/")) { folder = dde_apps_folder + "/" + path }
        //if(!folder.endsWith("/")) { folder = folder + "/" }
        folder = this.add_default_file_prefix_maybe(folder)
        folder = this.ensure_ending_slash(folder)
        let full_folder_info_obj = await DDEFile.path_info(folder)
        let full_folder = full_folder_info_obj.full_path
        let fold_info = await this.folder_listing(folder)
        let array_of_objs = fold_info
        let html = "<table><tr><th>Name</th><th>Size(bytes)</th><th>Last Modified Date</th><th>Permissions</th></tr>\n"
        for(let obj of array_of_objs) {
            let name = obj.name
            if(name !== "..") {
                let is_dir = false
                if((obj.type === "dir") && (!(name.endsWith("/")))){
                    name = name + "/"
                    is_dir = true
                }
                let path = full_folder + name
                let name_html = "<a href='#' name='" + path + "'>" + name + "</a>"
                let date_ms = obj.date //might be a float, possibly undefined.
                let date_str = Utils.date_or_number_to_ymdhms(date_ms)

                let perm_str = Utils.permissions_integer_string_to_letter_string(obj.permissions, is_dir)
                let row = "<tr>" +
                          "<td>" + name_html + "</td>" +
                          "<td>" + obj.size + "</td>" +
                          "<td>" + date_str + "</td>" +
                          "<td>" + perm_str + "</td>" +
                          "</tr>\n"
                html += row
            }
        }
        html += "</table>"
        let breadcrumbs_html = "/"
        let folds = full_folder.split("/")
        let building_fold = "/"
        for(let fold of folds){
            if(fold !== "") { //first and last elts of folds are empty strings
                building_fold += fold + "/"
                let the_html = "<a href='#'  name='" + building_fold + "'>" + fold + "</a>"
                breadcrumbs_html += the_html + "/"
            }
        }
        let device_menu = this.device_menu()

        //html = "<div style='overflow:scroll; height:400px);'>" + html + "</div>"
        show_window({title: "<span style='font-size:17px;'> " + title + " " + device_menu + " " + breadcrumbs_html + "</span>",
                     content: html,
                     x: x, y: y, width: width, height: height,
                     callback: callback})
    }

    static device_menu(){
        let html = "<select name='device_name'> <option>host</option>\n"
        for(let a_dex_name of Dexter.all_names){
            let opt_html = "<option>" + a_dex_name + "</option>\n"
            html += opt_html
        }
        html += "</select>"
        return html
    }

//______save_as
    static choose_file_save_as_handler(vals){
        //out("top of choose_file_handler with: " + vals.clicked_button_value)
        let filename_to_save_to = vals.filename_to_save_to_id
        if(vals.clicked_button_value === "close_button") {} //just let window close
        else if (vals.clicked_button_value === "filename_to_save_to_id") {
            filename_to_save_to_id.focus() //doesn't work
        }
        else if (vals.clicked_button_value === "save_as"){
            let window_index = vals.window_index
            SW.close_window(window_index)
            let slash_maybe = (DDEFile.current_folder_to_save_to.endsWith("/") ? "" : "/")
            let path_to_save_to = DDEFile.current_folder_to_save_to + slash_maybe + filename_to_save_to //DDEFile.this.current_folder_to_save_to ends with slash
            let content = Editor.get_javascript()
            DDEFile.write_file_async(path_to_save_to, content)
            Editor.after_successful_save_as(path_to_save_to)

        }
        else {
           let window_index = vals.window_index
           SW.close_window(window_index)
           let is_folder = vals.clicked_button_value.endsWith("/")
           if(is_folder){
               let path_to_save_to = vals.clicked_button_value + filename_to_save_to
               let save_button_label = vals.save_button_label.value
               DDEFile.choose_file_save_as({path:     path_to_save_to,
                                            title:    "Save file as:",
                                            save_button_label: save_button_label,
                                            callback: "DDEFile.choose_file_save_as_handler"})
           }
           else {
             warning("Click on a folder to change the folder to save to.")
           }
        }
    }

    static async insert_file_path_handler(vals){
        //out("top of insert_file_path with: " + vals.clicked_button_value)
        let filename_to_save_to = vals.filename_to_save_to_id
        if(vals.clicked_button_value === "close_button") {} //just let window close
        else if (vals.clicked_button_value === "filename_to_save_to_id") {
            filename_to_save_to_id.focus() //doesn't work
        }
        else if (vals.clicked_button_value === "save_as"){
            let window_index = vals.window_index
            SW.close_window(window_index)
            let slash_maybe = (DDEFile.current_folder_to_save_to.endsWith("/") ? "" : "/")
            let path_to_save_to = DDEFile.current_folder_to_save_to + slash_maybe + filename_to_save_to //DDEFile.this.current_folder_to_save_to ends with slash
            Editor.insert(path_to_save_to)
        }
        else {
            let is_folder = vals.clicked_button_value.endsWith("/")
            if(is_folder){
                let window_index = vals.window_index
                SW.close_window(window_index)
                let path_to_save_to = vals.clicked_button_value + filename_to_save_to
                DDEFile.choose_file_save_as({path: path_to_save_to,
                    title:    "Insert file path:",
                    callback: "DDEFile.insert_file_path_handler"})
            }
            else { //leave window up until user clicks on "save"
                let path = vals.clicked_button_value
                let last_slash = path.lastIndexOf("/")
                let filename = path.substring(last_slash + 1)
                filename_to_save_to_id.value = filename
            }
        }
    }

    static async insert_file_path_into_cmd_handler(vals){
        //out("top of insert_file_path with: " + vals.clicked_button_value)
        let filename_to_save_to = vals.filename_to_save_to_id
        if(vals.clicked_button_value === "close_button") {} //just let window close
        else if (vals.clicked_button_value === "filename_to_save_to_id") {
            filename_to_save_to_id.focus() //doesn't work
        }
        else if (vals.clicked_button_value === "save_as"){
            let window_index = vals.window_index
            SW.close_window(window_index)
            let slash_maybe = (DDEFile.current_folder_to_save_to.endsWith("/") ? "" : "/")
            let path_to_save_to = DDEFile.current_folder_to_save_to + slash_maybe + filename_to_save_to //DDEFile.this.current_folder_to_save_to ends with slash
            cmd_input_id.value = path_to_save_to
            cmd_input_id.focus()
        }
        else {
            let is_folder = vals.clicked_button_value.endsWith("/")
            if(is_folder){
                let window_index = vals.window_index
                SW.close_window(window_index)
                let path_to_save_to = vals.clicked_button_value + filename_to_save_to
                DDEFile.choose_file_save_as({path: path_to_save_to,
                    title:    "Insert file path:",
                    callback: "DDEFile.insert_file_path_into_cmd_handler"})
            }
            else { //leave window up until user clicks on "save"
                let path = vals.clicked_button_value
                let last_slash = path.lastIndexOf("/")
                let filename = path.substring(last_slash + 1)
                filename_to_save_to_id.value = filename
            }
        }
    }

    static current_path_to_save_to = null

    //folder is a string like "/foo/bar" or "/foo/bar/"
    static async choose_file_save_as({path="dde_apps" + "/junk.js",
                                      save_button_label = "Save",
                                      title="Save file as:",
                                      x=50, y=50, width=700, height=450,
                                      callback="DDEFile.choose_file_save_as_handler"} = {}){
        //if(!path.startsWith("/")) { path = dde_apps_folder + "/" + path }
        path = this.add_default_file_prefix_maybe(path)
        let last_slash = path.lastIndexOf("/")
        let folder     = path.substring(0, last_slash + 1) //we want folder to end in a slash
        let filename   = path.substring(last_slash + 1)
        let full_folder_info_obj = await DDEFile.path_info(folder)
        let full_folder = full_folder_info_obj.full_path

        let fold_info     = await this.folder_listing(folder)
        let array_of_objs = fold_info
        let html = "<table><tr><th>Name</th><th>Size(bytes)</th><th>Last Modified Date</th><th>Permissions</th></tr>\n"
        for(let obj of array_of_objs) {
            let name = obj.name
            if(name !== "..") {
                let is_dir = false
                if((obj.type === "dir") && (!(name.endsWith("/")))){
                    name = name + "/"
                    is_dir = true
                }
                let path = full_folder + name
                let name_html = "<a href='#' name='" + path + "'>" + name + "</a>"
                let date_ms = obj.date //might be a float, possibly undefined.
                let date_str = Utils.date_or_number_to_ymdhms(date_ms)

                let perm_str = Utils.permissions_integer_string_to_letter_string(obj.permissions, is_dir)
                let row = "<tr>" +
                    "<td>" + name_html + "</td>" +
                    "<td>" + obj.size + "</td>" +
                    "<td>" + date_str + "</td>" +
                    "<td>" + perm_str + "</td>" +
                    "</tr>\n"
                html += row
            }
        }
        html += "</table>"

        this.current_folder_to_save_to = full_folder
        let breadcrumbs_html = "/"
        let folds = full_folder.split("/")
        let building_fold = "/"
        for(let fold of folds){
            if(fold !== "") { //first and last elts of folds are empty strings
                building_fold += fold + "/"
                let the_html = "<a href='#'  name='" + building_fold + "'>" + fold + "</a>"
                breadcrumbs_html += the_html + "/"
            }
        }
        html = "<input style='margin-left:10px' id='filename_to_save_to_id' value='" + filename + "'/>" +
               "<input type='submit' style='margin-left:10px' name='save_as' value='" + save_button_label + "' autofocus/>" +
               "<input type='hidden' style='margin-left:10px' name='save_button_label' value='" + save_button_label + "'/>" +
                html
        show_window({title: "<span style='font-size:17px;'> " + title + " " + breadcrumbs_html + "</span>",
                     content: html,
                     x: x, y: y, width: width, height: height,
                     callback: callback,
                     init_elt_id: "filename_to_save_to_id"})
    }

    //_______OVERALL Upload File code below here_________
    static choose_file_to_upload(){
        show_window({title: "Choose file to upload",
            content: "<input id='dde_upload_file_id' type='file'/>" +
            "<p/><input name='upload_file' type='button' value='Upload'/>",
            x:100, y:100, width:300, height:120,
            callback: "DDEFile.choose_file_to_upload_handler"
        })
    }

    static choose_file_to_upload_handler(vals){
        if(vals.clicked_button_value === "close_button") {}
        else if (vals.clicked_button_value === "upload_file"){
            let first_file = dde_upload_file_id.files[0]
            let path = "dde_apps" + "/" + first_file.name
            DDEFile.choose_file_save_as({path: path,
                                         title: "Upload file to:",
                                         callback: "DDEFile.file_upload_handler"})
        }
    }

    //now choose the place to upload to and do it.

    static file_upload_handler(vals){
        //out("top of file_upload_handler with: " + vals.clicked_button_value)
        let filename_to_save_to = vals.filename_to_save_to_id
        if(vals.clicked_button_value === "close_button") {} //just let window close
        else if (vals.clicked_button_value === "filename_to_save_to_id") {
            filename_to_save_to_id.focus() //doesn't work
        }
        else if (vals.clicked_button_value === "save_as"){
            //let window_index = vals.window_index
            //SW.close_window(window_index) //ita already closed by submit button
            let slash_maybe = (DDEFile.current_folder_to_save_to.endsWith("/") ? "" : "/")
            let path_to_save_to = DDEFile.current_folder_to_save_to + slash_maybe + filename_to_save_to //DDEFile.this.current_folder_to_save_to ends with slash
            //let content = Editor.get_javascript()
            let file = dde_upload_file_id.files[0] //a file is a blob
            DDEFile.write_file_async(path_to_save_to, file)
            Editor.after_successful_save_as(path_to_save_to)

        }
        else {
            let window_index = vals.window_index
            SW.close_window(window_index)
            let is_folder = vals.clicked_button_value.endsWith("/")
            if(is_folder){
                let path_to_save_to = vals.clicked_button_value + filename_to_save_to
                DDEFile.choose_file_save_as({path: path_to_save_to,
                                             title:    "Upload file to:",
                                             callback: "DDEFile.file_upload_handler"})
            }
            else {
                warning("Click on a folder to change the folder to save to.")
            }
        }
    }




    //________Overall Folder Upload___________

    //choose folder to upload_______

    static choose_folder_to_upload(){
        show_window({
            title: "Choose a folder to upload",
            content: "First click the <b>Choose File</b> button and select a source folder.<p/>" +
                     "<input id='dde_upload_folder_id' type='file' webkitdirectory value='Choose folder'/><p/>" +
                     "Then click <b>Upload Folder</b> and select the destination folder.<p/>" +
                     "<input name='upload_folder' type='button' value='Upload Folder'/>",
            x:100, y:100, width:450, height:190,
            callback: "DDEFile.choose_folder_to_upload_handler"
        })
    }

    static choose_folder_to_upload_handler(vals){
        if(vals.clicked_button_value === "close_button") {}
        else if (vals.clicked_button_value === "upload_folder"){
            let files = dde_upload_folder_id.files
            let title = "Upload the files of folder to:"
            let last_folder_name
            for(let fi of files) {  //wierdly files[0] won't work here.
                let webkit_rel_path = fi.webkitRelativePath
                last_folder_name = webkit_rel_path.substring(0, webkit_rel_path.indexOf("/"))
                title = "Upload the files of folder <b>" + last_folder_name + "</b> to:"
                break;
            }
            let path = "dde_apps" + "/" + last_folder_name
            DDEFile.choose_folder_to_upload_to({path: path,
                title:    title,
                callback: "DDEFile.choose_folder_to_upload_to_handler"})
        }
    }


    //_____choose folder to upload to_____

    static async choose_folder_to_upload_to_handler(vals){
        if(vals.clicked_button_value === "close_button") {}
        else if(vals.clicked_button_value === "upload") { //does the real work
            let files = dde_upload_folder_id.files //a file is a blob
            let suffix = ((files.length === 1 ? "" : "s"))
            out("Uploading " + files.length + " file" + suffix + " from " + vals.orig_folder_name + "/ to " + vals.full_folder_to_present +  vals.last_folder_name + "/")
            for(let file of files){
                let path_to_save_to = vals.full_folder_to_present + vals.last_folder_name + "/" + file.name
                await DDEFile.write_file_async(path_to_save_to, file)
                out("File uploaded to: " + path_to_save_to)
            }
            out(vals.orig_folder_name + "/ folder upload complete.")
        }
        else if (!vals.clicked_button_value.endsWith("/")){
            warning("You must choose a folder, not a file.\nFolder names end in slash.")
        }
        else { //navigate to new folder to upload to
            //user clicked on either a breadcrumb in the title or a folder name in the table.
            let window_index = vals.window_index
            SW.close_window(window_index)
            let title = "Upload the files of folder to:"
            let files = dde_upload_folder_id.files
            for(let fi of files) {  //wierdly files[0] won't work here.
                //let webkit_rel_path = fi.webkitRelativePath
                //let orig_folder_name = webkit_rel_path.substring(0, webkit_rel_path.indexOf("/"))
                let orig_folder_name = vals.orig_folder_name
                title = "Upload files of folder " + orig_folder_name + " to:"
                break;
            }
            let last_folder_name = vals.last_folder_name
            let path_to_save_to = DDEFile.ensure_ending_slash(vals.clicked_button_value)
                                  + last_folder_name
            DDEFile.choose_folder_to_upload_to({
                                    path:     vals.clicked_button_value + vals.last_folder_name,
                                    title:    title,
                                    callback: "DDEFile.choose_folder_to_upload_to_handler",
                                    orig_folder_name: vals.orig_folder_name})
        }
    }

    static async choose_folder_to_upload_to({path="dde_apps/",
                                             title=null,
                                             x=50, y=50, width=700, height=450,
                                             callback="DDEFile.choose_folder_to_upload_to_handler",
                                             orig_folder_name = null}){

        //if(!path.startsWith("/")) { path = dde_apps_folder + "/" + path }
        //if (!path.endsWith("/")) { path = path + "/" } //ensure last slash, needed on path below
        path = this.add_default_file_prefix_maybe(path)
        /*let last_slash = path.lastIndexOf("/")
        let first_path = path.substring(0, last_slash + 1) //inclusive trailing slash
        let last_path  = path.substring(last_slash + 1)
        let filename = path.substring(last_slash + 1)
        */

        let path_sans_last_slash = (path.endsWith("/") ? path.substring(0, (path.length - 1)) : path)
        let last_slash = path_sans_last_slash.lastIndexOf("/")
        let path_sans_last_folder_name_with_last_slash = path_sans_last_slash.substring(0, last_slash + 1)
        let last_folder_name =  path_sans_last_slash.substring(last_slash + 1)
        //this.current_folder_to_save_to = path
        if (orig_folder_name === null) { orig_folder_name = last_folder_name}
        title = "Upload files from <b>" + orig_folder_name + "</b> to:"
        let full_folder_to_present_info_obj = await DDEFile.path_info(path_sans_last_folder_name_with_last_slash)
        let full_folder_to_present = full_folder_to_present_info_obj.full_path
        let fold_info = await this.folder_listing(path_sans_last_folder_name_with_last_slash)
        let array_of_objs = fold_info
        let html = "<table><tr><th>Name</th><th>Size(bytes)</th><th>Last Modified Date</th><th>Permissions</th></tr>\n"
        for(let obj of array_of_objs) {
            let name = obj.name
            if(name !== "..") {
                let is_dir = false
                if((obj.type === "dir") && (!(name.endsWith("/")))){
                    name = name + "/"
                    is_dir = true
                }
                let new_path = path + name
                let name_html = "<a href='#' name='" + path_sans_last_folder_name_with_last_slash + name + "'>" + name + "</a>"
                let date_ms = obj.date //might be a float, possibly undefined.
                let date_str = Utils.date_or_number_to_ymdhms(date_ms)

                let perm_str = Utils.permissions_integer_string_to_letter_string(obj.permissions, is_dir)
                let row = "<tr>" +
                    "<td>" + name_html + "</td>" +
                    "<td>" + obj.size + "</td>" +
                    "<td>" + date_str + "</td>" +
                    "<td>" + perm_str + "</td>" +
                    "</tr>\n"
                html += row
            }
        }
        html += "</table>"
        let breadcrumbs_html = "/"
        let folds = full_folder_to_present.split("/")  //full_folder_to_present has slahses on front and end
        let building_fold = "/"
        for(let fold of folds){
            if(fold !== "") { //first and last elts of folds are empty strings
                building_fold += fold + "/"
                let the_html = "<a href='#'  name='" + building_fold + "'>" + fold + "</a>"
                breadcrumbs_html += the_html + "/"
            }
        }
        let path_to_save_to = full_folder_to_present + last_folder_name
        let upload_tooltip = "Click to upload the files to\n" + path_sans_last_folder_name_with_last_slash +
                              "\nwith a last_folder of the folder in the type-in to the left."

        html = "<input style='margin-left:10px' name='last_folder_name' value='" + last_folder_name + "'/>" +
               "<input type='submit' title='" + upload_tooltip + "' style='margin-left:10px; margin-bottom:5px;' name='upload' value='upload'/>" +
               "<input type='hidden' name='full_folder_to_present' value='" + full_folder_to_present + "'/>" +
               "<input type='hidden' name='orig_folder_name' value='" + orig_folder_name + "'/>" +
            html
        show_window({title: "<span style='font-size:17px;'> " + title + " " + breadcrumbs_html + "</span>",
            content: html,
            x: x, y: y, width: width, height: height,
            callback: callback})
    }
    //end overall Upload______
    static async dynamic_import(package_name, global_var_name){
        let url = 'https://cdn.skypack.dev/' + package_name
        let result = await import(url)
        if(global_var_name) {
            if(global_var_name.includes("-")) {
                dde_error("dynamic_import passed a global_var_name of: " + global_var_name +
                    "<br/>that contains a hyphen which is invalid in JS.<br/>" +
                    "We recommend replacing hyphens with underscores.")
            }
            else {
                globalThis[global_var_name] = result
            }
        }
        return result
    }
}
globalThis.DDEFile = DDEFile