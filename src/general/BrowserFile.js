/*
Beware: showfilePicker and shwoDirectoryPicker error
when stepping through them.
*/


globalThis.BrowserFile = class BrowserFile{

    static is_local_path(path) {
        return path.startsWith("/local/")
    }

    //returns file name and extension in path
    static path_to_file_name(path){
        let last_slash_pos = path.lastIndexOf("/")
        if(last_slash_pos === -1){
            return path
        }
        else {
            return path.substring(last_slash_pos + 1)
        }
    }

    static local_path_to_open_file_handle = {}
    static local_path_to_dir_handle = {}





    //high level fn:
    //pops up a file picker, lets user choose a file or cancel.
    //if they choose a file, the callback is called with:
    //the path chosen and the content of the file
    //else if user canceled from the file dialog, the callback is called with null, null.
    //BUT if NOT passed a callback, we just return the content
    //to some call that is await-ing it.
    static async pick_and_process_content(callback=null) {
        let path = await Editor.pick_local_file()
        //out("back in pick_and_process_content with path: " + path)
        if (path) {
            let content = await Editor.get_content_at_local_path(path)
            //out("back in pick_and_process_content with content: " + content)
            if(callback) {
                callback(path, content)
            }
            else {
                return content
            }
        }
        else {
            if(callback) {
                callback(null, null)
            }
            else {
                return null //meaning no path
            }
        }
    }

    //returns a path of a dir to start the dialog box off.
    // passing "path" is optional
    //used in DDE_video.js and elsewhere
    static async pick_local_file(path){
        let options = ((typeof(path) === "string") ? {suggestedName: Editor.path_to_file_name(path)} : undefined)
        try {
            let [fileHandle] = await window.showOpenFilePicker(options)
            //out("in pick_local_file with fileHandle: " + fileHandle)
            if (fileHandle) {
                let local_path = "/local/" + fileHandle.name
                BrowserFile.local_path_to_open_file_handle[local_path] = fileHandle
                return local_path
            } else {
                return null
            }
        }
        catch(err) { //probably because the user clicked cancel in the file dialog
            return null
        }
    }

    static path_to_top_dir() {


    }

    //If path is NOT in Editor.local_path_to_open_file_handle, returns null
    //else returns the content in the path
    //used in DDE_video.js and elsewhere
    static async get_content_at_local_path(path){
        let fileHandle = BrowserFile.local_path_to_open_file_handle[path]
        if(!fileHandle){
            return null
        }
        else {
            const file = await fileHandle.getFile();  // file is an object that knows about the file
            //why do we need both a fileHandle and a file object? Bad design as far as I can tell.
            const content = await file.text()
            return content
        }
    }

    static current_buffer_needs_saving(){
        return Editor.current_buffer_needs_saving &&
            (Editor.get_javascript(false).trim().length > 0)
    }


    ////called when user picks a file from dde's "file names" select menu,
    //(not from the menu bar/File/Open)
    static async open_local_file_from_menu(event){
        let menu_item_label       = event.target.value //could be "new buffer" or an actual file
        if (BrowserFile.current_buffer_needs_saving()) {
            let confirm_message = "The editor buffer has unsaved changes.\n" +
                "Click OK if you want to save before editing the other file.\n" +
                "Click Cancel to not save it before editing the other file."
            if (confirm(confirm_message)) {
                alert('Please choose "Save" from the file menu\n' +
                    "(Sorry, browser security restrictions make this cumbersome.)"
                )
            }
            else {
                Editor.unmark_as_changed()
                out('Now choose "Open" from the file menu.')
            }
            //since we got here by changing the files menu to something new,\
            //we have to set it BACK to what it was, then let the user save it.
            Editor.set_files_menu_to_path (Editor.current_file_path)
        }
        else {
            let path = Editor.files_menu_path_to_path(menu_item_label)
            //let file_name  = Editor.path_to_file_name(menu_item_label)
            let file_handle = BrowserFile.local_path_to_open_file_handle[path]
            if (file_handle) {
                const file = await file_handle.getFile();
                let content = await file.text()
                //await file_handle.close() //there is no close method on this. perhaps only get a close method for WRITING to a file
                Editor.edit_file(path, content)
            }
            else {
                let file_name_start_pos = path.lastIndexOf("/") + 1  //ie "/local"
                let dir_path = path.substring(0, file_name_start_pos) //ends with a slash. The full dir in path.
                let file_name = path.substring(file_name_start_pos)
                let dir_handle = BrowserFile.local_path_to_dir_handle[dir_path]
                if (!dir_handle) {
                    if (dir_path === "/local/") {
                        alert('Please select the "dde_apps" folder in the "Documents" folder.')
                    } else {
                        alert('Please select the "' + dir_path + '" folder.')
                    }
                    dir_handle = await window.showDirectoryPicker({mode: "readwrite", startIn: "documents"})
                    if (!dir_handle) {
                        return
                    } //user canceled
                    else {
                        BrowserFile.local_path_to_dir_handle[dir_path] = dir_handle
                    }
                }
                //now we have a dir_handle

                file_handle = await dir_handle.getFileHandle(file_name, {create: true});
                const file = await file_handle.getFile();
                let content = await file.text()
                //await file_handle.close() //there is no close method on this. perhaps only get a close method for WRITING to a file
                Editor.edit_file(path, content)
            }
        }
    }

    //"this" needs to be user event
    static async open_local_file(path = null) {
        if (BrowserFile.current_buffer_needs_saving()) {
            let confirm_message = "The editor buffer has unsaved changes.\n" +
                "Click OK if you want to save before editing the other file.\n" +
                "Click Cancel to not save it before editing the other file."
            if (confirm(confirm_message)) {
                alert('Please choose "Save" from the file menu\n' +
                    "(Sorry, browser security restrictions make this cumbersome.)"
                )
                return
            } else {
                Editor.unmark_as_changed()
                out('Now choose "Open" from the file menu.')
            }
        }
        else if (path) {
            let file_handle = BrowserFile.local_path_to_open_file_handle[path]
            if(file_handle) {
                const file  = await file_handle.getFile();
                let content = await file.text()
                //await file_handle.close() //there is no close method on this. perhaps only get a close method for WRITING to a file
                Editor.edit_file(path, content)
            }
            else {
                let file_name_start_pos = path.lastIndexOf("/") + 1  //ie "/local"
                let dir_path = path.substring(0, file_name_start_pos) //ends with a slash. The full dir in path.
                let file_name = path.substring(file_name_start_pos)
                let dir_handle = BrowserFile.local_path_to_dir_handle[dir_path]
                if(!dir_handle) {
                    if(dir_path === "/local/"){
                        alert('Please select the "dde_apps" folder in the "Documents" folder.')
                    }
                    else {
                        alert('Please select the "' + dir_path + '" folder.')
                    }
                    dir_handle = await window.showDirectoryPicker({mode: "readwrite", startIn: "documents"})
                    if (!dir_handle) {
                        return
                    } //user canceled
                    else {
                        BrowserFile.local_path_to_dir_handle[dir_path] = dir_handle
                    }
                }
                //now we have a dir_handle

                file_handle = await dir_handle.getFileHandle(file_name, { create: true });
                const file  = await file_handle.getFile();
                let content = await file.text()
                out(content)
                //await file_handle.close() //there is no close method on this. perhaps only get a close method for WRITING to a file
                Editor.edit_file(path, content)
            }
        }
        else { //no file needs saving, no path, so ask user to pick the file
            let options = ((typeof (path) === "string") ? {suggestedName: Editor.path_to_file_name(path)} : undefined)
            try {
                let [file_handle2] = await window.showOpenFilePicker(options)
                console.log("open_local_file got new file file_handle: " + file_handle2)
                let local_path = "/local/" + file_handle2.name
                BrowserFile.local_path_to_open_file_handle[local_path] = file_handle2
                await BrowserFile.open_local_file_at_path(local_path)
            }
            catch (err) {}//happens when user cancel's the openin of the file, in which case, do nothing.
        }
    }

    //doesn't require user to click a dialog box. Expects path to already
    //have a file handle, and if not. errors.
    static async open_local_file_at_path(path){
        let fileHandle = BrowserFile.local_path_to_open_file_handle[path]
        if(!fileHandle){
            shouldnt("open_local_file_at_path passed path: " + path + " that isn't in BrowserFile.local_path_to_open_file_handle")
        }
        const file = await fileHandle.getFile();  // file is an object that knows about the file
        //why do we need both a fileHandle and a file object? Bad design as far as I can tell.
        const content = await file.text()
        if(globalThis.HCA && (Editor.view === "HCA")){
            ipg_to_json.parse(path, content)
        }
        else {
            Editor.edit_file(path, content, null) //null means IFF cur buff needs saving, ask the user if they want to or just throw out changes.
        }
    }

    //VERY similar to open_local_file
    static async load_local_file() {
        let [file_handle] = await window.showOpenFilePicker()
        let path = "/local/" + file_handle.name
        BrowserFile.local_path_to_open_file_handle[path] = file_handle
        await BrowserFile.load_local_file_at_path_aux(path)
    }

    //doesn't require user to click a dialog box.
    static async load_local_file_at_path_aux(path){
        let file_handle = BrowserFile.local_path_to_open_file_handle[path]
        if(!file_handle){
            shouldnt("open_local_file_at_path passed path: " + path + " that isn't in BrowserFile.local_path_to_open_file_handle")
        }
        const file = await file_handle.getFile();  // file is an object that knows about the file
        //why do we need both a file_handle and a file object? Bad design as far as I can tell.
        out("file: " + file)
        const content = await file.text()
        if(path.endsWith(".py")) {
            await Py.init()
            let result = Py.eval(content)
            out(result)
        }
        else {
            globalThis.eval_js_part2(content)
        } //calls eval_js_part3
    }

    static async load_local_and_start_job(){
        let [file_handle] = await window.showOpenFilePicker()
        if(file_handle) {
            let path = "/local/" + file_handle.name
            BrowserFile.local_path_to_open_file_handle[path] = file_handle
            const file = await file_handle.getFile();
            const content = await file.text()
            Job.define_and_start_job(content)
        }
    }

    static async insert_local_file(){
        let [file_handle] = await window.showOpenFilePicker()
        if(file_handle) {
            let path = "/local/" + file_handle.name
            BrowserFile.local_path_to_open_file_handle[path] = file_handle
            const file = await file_handle.getFile();
            const content = await file.text()
            Editor.insert(content)
        }
    }

    static insert_local_file_path_into_editor(){
        Editor.insert(Editor.current_file_path)
    }

    static insert_local_file_path_into_cmd_input(){
        cmd_input_id.value = Editor.current_file_path
        cmd_input_id.focus()
    }



    // see https://stackoverflow.com/questions/34870711/download-a-file-at-different-location-using-html5
    //for saving files
    static async get_handle() {
        // set some options, like the suggested file name and the file type.
        let file_name
        if(Editor.current_file_path) {
            let last_slash_pos = Editor.current_file_path.lastIndexOf("/")
            file_name = Editor.current_file_path.substring(last_slash_pos + 1)
        }
        else { file_name = "rename_me.dde" }
        const options = {
            suggestedName: file_name,
            types: [
                {
                    description: 'Text Files',
                    accept: {'text/plain': ['.txt', '.js', '.dde'],},
                },
            ],
        };
        // prompt the user for the location to save the file.
        const handle = await window.showSaveFilePicker(options);
        return handle
    }

    static local_path_to_save_file_handle = {} //must be distinct from local_path_to_open_file_handle as they have different permissions

    //if file doesn't need saving, does nothing.
    //else tries to save file without a dialog box, but if it can't,
    //ask user if they want to save it, and if so, it brings up a dialog box
    //called from menu item "save local" and maybe elsewhere
    //if confirm_message is null, don't confirm with user, just save.
    //open_local_file passes a real confirm message to check if user wants to save the file
    static async save_local_file(path = Editor.current_file_path,
                                 confirm_message="Choose the folder to save the file in.\nDocuments/dde_apps is used for normal user files.",
                                 content=Editor.get_javascript()) {
        let file_handle = BrowserFile.local_path_to_save_file_handle[path]
        if (file_handle) {
            BrowserFile.save_local_file_handle(file_handle, content)
            Editor.after_successful_save(path)
        }
        else {
            let file_name_start_pos = path.lastIndexOf("/") + 1
            let dir_path   = path.substring(0, file_name_start_pos) //ie "/local"
            console.log("1 in save_local_file, got dir_path: " + dir_path)
            let file_name  = path.substring(file_name_start_pos)
            let dir_handle = this.local_path_to_dir_handle[dir_path]
            console.log("2 in save_local_file, got dir_path: " + dir_path)
            if(dir_handle){
                console.log("in save_local_file, got dir_handle: " + dir_handle)
                let file_handle = await dir_handle.getFileHandle(file_name, { create: true });
                await BrowserFile.save_local_file_handle(file_handle, content)
                Editor.after_successful_save(path)
            }
            else if (confirm_message) {
                console.log("3 in save_local_file, got dir_path: " + dir_path)
                if (confirm(confirm_message)) { //there's no file_handle and no dir_handle so get a new dir_handle from user
                    console.log("4 in save_local_file, got dir_path: " + dir_path)
                    let dir_handle = await window.showDirectoryPicker({mode: "readwrite", startIn: "documents"})
                    if (dir_handle) {
                        console.log("5 in save_local_file, got dir_path: " + dir_path)
                        BrowserFile.local_path_to_dir_handle[dir_path] = dir_handle
                        let file_handle = await dir_handle.getFileHandle(file_name, { create: true })
                        BrowserFile.save_local_file_handle(file_handle, content)
                        let dir_name = dir_handle.name
                        dir_path = ((dir_name === "dde_apps") ? "/local/" :  ("/local/" + dir_path + "/"))
                        let local_path = dir_path + file_name
                        Editor.after_successful_save(local_path)
                    }
                }
                //else user back out, do nothing
            }
            else { //no confirm message. exactly the same as 10 or so lines above.
                let dir_handle = await window.showDirectoryPicker({mode: "readwrite", startIn: "documents"})
                if (dir_handle) {
                    BrowserFile.local_path_to_dir_handle[dir_path] = dir_handle
                    let file_handle = await dir_handle.getFileHandle(file_name, { create: true })
                    BrowserFile.save_local_file_handle(file_handle, content)
                    let dir_name = dir_handle.name
                    dir_path = ((dir_name === "dde_apps") ? "/local/" :  ("/local/" + dir_path + "/"))
                    let local_path = dir_path + file_name
                    Editor.after_successful_save(local_path)
                }
            }
            //else user canceled the save meaning they didn't want to after all.
        }
    }

    /* doesnt work and bad algorithm
    static async save_local_file_as(confirm_message=null,
                                    content=Editor.get_javascript(false)){
        if (confirm_message) {
            if (confirm(confirm_message)) {
                let file_handle = await BrowserFile.get_handle() //calls showSaveFilePicker
                if (file_handle) { //user might have canceled in the file picker
                    let local_path = "/local/" + file_handle.name
                    BrowserFile.save_local_file_handle(file_handle, content)
                    Editor.after_successful_save_as(local_path)
                }
            }
            //else user back out, do nothing
        }
        else { //no confirm message
            let file_handle = await BrowserFile.get_handle() //calls showSaveFilePicker
            if (handle) { //user might have canceled in the file picker
                let local_path = "/local/" + file_handle.name
                BrowserFile.save_local_file_handle(file_handle, content)
                Editor.after_successful_save_as(local_path)
            }
        }
    }
     */

    static async save_local_file_as(confirm_message="Choose the folder to save the file in.\nDocuments/dde_apps is used for normal user files.",
                                    content=Editor.get_javascript(false)){
        if (confirm_message && !confirm(confirm_message)) {
            return
        }
        let dir_handle = await window.showDirectoryPicker({mode: "readwrite", startIn: "documents"})
        if (!dir_handle) { ////user canceled, do nothing
            return
        }
        let dir_name = dir_handle.name
        let dir_path
        if(dir_name === "dde_apps"){
            dir_path = "/local/"
        }
        else {
            dir_path = "/local/" + dir_name + "/"
        }
        BrowserFile.local_path_to_dir_handle[dir_path] = dir_handle

        //now we have a dir_handle
        let old_file_path = Editor.current_file_path
        let start_pos_of_file_name = old_file_path.lastIndexOf("/") + 1
        let old_file_name = old_file_path.substring(start_pos_of_file_name)
        let file_name = prompt("Enter the name of the file to be saved. ", old_file_name)
        let file_handle = await dir_handle.getFileHandle(file_name, { create: true });
        BrowserFile.save_local_file_handle(file_handle, content)
        let local_path = dir_path + file_name
        Editor.after_successful_save_as(local_path)
    }

    static async save_local_file_handle(file_handle, content=Editor.get_javascript(false)){
        // creates a writable, used to write data to the file.
        const writable = await file_handle.createWritable();
        // write a string to the writable.
        await writable.write(content);

        // close the writable and save all changes to disk. this will prompt the user for write permission to the file, if it's the first time.
        await writable.close();
        let path = "/local/" + file_handle.name  //can't get the directory, only the name
        out("Saved: " + path, "green")
    }

    //still gives user a way to edit file name and choose folder
    static save_local_file_without_showSaveFilePicker(){
        let file_path = Editor.current_file_path
        let last_slash_pos = file_path.lastIndexOf("/")
        let orig_file_name = file_path.substring(last_slash_pos + 1)
        let prompt_instructions = "If you want to change the file's name, do so in the first dialog, not the second."
        let file_name = prompt(prompt_instructions, orig_file_name)
        if (file_name) {
            let content = Editor.get_javascript(false)
            this.download(file_name, content)
            if(file_name  !== orig_file_name) {
                //change name in editor filename dropdown, just in case the user changed it
                let options_dom_elt = file_name_id.options[file_name_id.selectedIndex]
                options_dom_elt.innerHTML = file_name //we lose the directory, but
                //maybe better than nothing. ///hmm, changes vidual name but not
                //the file name we get when we choose save local
            }
            this.rename_files_menu_selected_file(file_name)
        }
        //else user canceled from the above call to prompt
    }

    // from https://www.geeksforgeeks.org/how-to-trigger-a-file-download-when-clicking-an-html-button-or-javascript/
    //file is just the file name, can't have a folder and no picker,
    //always goes to the download folder
    static download(file, text) {
        //creating an invisible element
        let element = document.createElement('a');
        element.setAttribute('href',
            'data:text/plain;charset=utf-8, '
            + encodeURIComponent(text));
        element.setAttribute('download', file);

        // Above code is equivalent to
        // <a href="path of file" download="file name">

        document.body.appendChild(element);

        //onClick property
        let click_result = element.click(); //apparently, returned val is always undefined
        //if user cancels from the dialog box, the below will not be called.
        out("click_result: " + click_result)
        document.body.removeChild(element);
    }
}