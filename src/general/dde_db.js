//this is ONLY for DDE IDE.
//See job_engine/core/index.js for a few more global variables
//that in dde3 were stored in persistent

class DDE_DB{
   static persistent_values_initial_object =
       {
       "animate_ui": true,
       "dde_init": "",
       "dde_window_x":        50,
       "dde_window_y":        50,
       "dde_window_width":  1000,
       "dde_window_height":  700,

       "default_dexter_port": 3000,
       "default_dexter_simulate": true,
       "default_out_code": false,
       "default_dexter_ip_address": "192.168.1.142",  // was dexter_default_ip_address bad change to default_dexter_ip_address
       "dexter0_ip_address": "auto",
       "dont_show_splash_screen_on_launch": false,
       "editor_font_size": 17,
       "files_menu_paths": ["/local/dde_init.js"],
       "kiosk": false,
       "last_open_dexter_file_path": "", //doesn't have a dexter: prefix,not robot specific.
       "left_panel_width":   700,
       "misc_pane_content": "Simulate Dexter",
       "misc_pane_choose_file_path": "", //only used on dde init, and only if misc_pane_content is "choose_file"
       "save_on_eval":     false,
       "splash_screen_tutorial_labels": (globalThis.SplashScreen ? SplashScreen.splash_screen_tutorial_labels() : []),
       "ssh_show_password": false,
       "top_left_panel_height": 350,
       "top_right_panel_height": 200
       }

   static metrics_initial_object =
       {"Eval button clicks": 0,
        "Step button clicks": 0,
        "Job button clicks": 0,
        "Make Instruction inserts": 0
        }

   static persistent_values = {}
   static metrics = {}

   static db = null

   static init(db_init_cb){
       DDE_DB.db_init_cb = db_init_cb //called after persistent_values is grabbed from DB.
       DDE_DB.persistent_values = DDE_DB.persistent_values_initial_object //very temporary until real db values grabbed
       DDE_DB.metrics = DDE_DB.metrics_initial_object                    //very temporary until real db values grabbed
       let request = globalThis.indexedDB.open("dde_db", 1);
       request.onerror = function(event) {
           dde_error("DDE's database could not be opened. Error code: " +
                     event.target.errorCode)
       }
       //onupgradeneeded  will be called before onsuccess IFF its needed, ie in the globalThis.indexedDB.open has a new higher db version as its 2nd arg.
       request.onupgradeneeded = function(event) {
           DDE_DB.db = event.target.result;
           // Create an objectStore for this database
           let objStore = DDE_DB.db.createObjectStore("dde_object_store")
           objStore.add(DDE_DB.persistent_values, "persistent_values")
           objStore.add(DDE_DB.metrics, "metrics")
       }
       request.onsuccess = function(event) {
           console.log("dde_db successfully opened")
           DDE_DB.db = event.target.result;
           let transaction = DDE_DB.db.transaction(['dde_object_store'], "readwrite")
           const objectStore = transaction.objectStore('dde_object_store');

           //grab data from db and populate
           const dos_metrics_request = objectStore.get("metrics")
           dos_metrics_request.onsuccess = () => {
               let data = dos_metrics_request.result;
               DDE_DB.metrics = data
           }
           const dos_request = objectStore.get("persistent_values")
           dos_request.onsuccess = () => {
               let is_modified = false
               let data = dos_request.result
               if(!data){ //happens the first time DDE is used
                   data = DDE_DB.persistent_values_initial_object
                   is_modified = true
               }
               else {
                   //just in case new version of dde adds some persistent_values...
                   for (let key in DDE_DB.persistent_values_initial_object) {
                       if (data[key] === undefined) {
                           data[key] = DDE_DB.persistent_values_initial_object[key]
                           is_modified = true
                       }
                   }
               }
               data.files_menu_paths = Utils.de_duplicate(data.files_menu_paths)
               DDE_DB.persistent_values = data
               if(is_modified) { objectStore.put(data, "persistent_values") }
               DDE_DB.db_init_cb.call()
           }
       }
   }

   static persistent_get(key) {
       //onsole.log("this.persistent_values: " + this.persistent_values)
       return this.persistent_values[key]
   }

   static metrics_get(key){
       return this.metrics[key]
   }

   // from https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put
   static persistent_set(key, value){
        this.persistent_values[key] = value
        const dde_object_store = DDE_DB.db.transaction(['dde_object_store'], "readwrite").objectStore('dde_object_store');
        const dos_request = dde_object_store.get("persistent_values");
        dos_request.onsuccess = function(event) {
           // Get the old value that we want to update
           let data = event.target.result;
           // Update the value
           data[key]= value
           // Create another request that inserts the item back into the database
           const dos_put_request = dde_object_store.put(data, "persistent_values");
           // When this new request succeeds, run the displayData() function again to update the display
           dos_put_request.onsuccess = function(event) {
               //onsole.log("DDE_DB successfully stored persistent_value: " + key + " of " + value)
           }
           dos_put_request.onerror = function(event) {
                console.log("ERROR: DDE_DB could not store persistent_value: " + key + " of " + value)
           }
        }
   }

    static persistent_remove(key){
        delete this.persistent_values[key]
        const dde_object_store = DDE_DB.db.transaction(['dde_object_store'], "readwrite").objectStore('dde_object_store');
        const dos_request = dde_object_store.get("persistent_values");
        dos_request.onsuccess = function(event) {
            // Get the old value that we want to update
            let data = event.target.result;
            // Update the value
            delete data[key]
            // Create another request that inserts the item back into the database
            const dos_put_request = dde_object_store.put(data, "persistent_values");
            // When this new request succeeds, run the displayData() function again to update the display
            dos_put_request.onsuccess = function(event) {
                console.log("DDE_DB successfully removed persistent_value: " + key)
            }
            dos_put_request.onerror = function(event) {
                console.log("ERROR: DDE_DB could not remove persistent_value: " + key)
            }
        }
    }

    static show_dialog(){
       let content = "<table><tr><th>Name</th><th>Value</th></tr>\n"
        let keys = Object.keys(DDE_DB.persistent_values).sort()
        for(let key of keys){
            let val = DDE_DB.persistent_values[key]
            let val_html
            if (key === "dde_init") {
                val_html = "<textarea name='" + key + "'  rows='3' cols='60'>" + val + "</textarea>"
            }
            else if(Array.isArray(val)) {
                let val_processed = ("" + val).replaceAll(",", "\n")
                val_html = "<textarea name='" + key + "'  rows='3' cols='60'>" + val_processed + "</textarea>"
            }
            else if(val === true) {
                val_html = "<input name='" + key + "' type='checkbox' checked/>"
            }
            else if(val === false) {
                val_html = "<input name='" + key + "'  type='checkbox'/>"
            }
            else if (typeof(val) === "number") {
                val_html = "<input name='" + key + "'  type='number' step='1' value='" + val + "'/>"
            }
            else if (typeof(val) === "string") {
                val_html = "<input name='" + key + "'  type='text' value='" + val + "'/>"
            }
            else { shouldnt("in DDE_DB.show_dialog got unknown type: " + val) }
            content += "<tr><td>" + key + "</td><td>" + val_html + "</td></tr>\n"
        }
        content += "</table>\n"
        content += "<input type='submit' value='Save' style='margin-top:10px; margin-left:200px;'/>"
       show_window({
               title: "Edit Preferences",
               content: content,
               x:100, y:50, width:800, height: 500,
               callback: "DDE_DB.show_dialog_handler"
           },
       )
    }

    static show_dialog_handler(vals) {
        if      (vals.clicked_button_value === "close_button") {} //don't save. this is "cancel"
        else if (vals.clicked_button_value === "Save") {
            for (let key of Object.keys(DDE_DB.persistent_values)) {
                let val = vals[key]
                if ((key === "files_menu_paths") ||
                    (key === "splash_screen_tutorial_labels")) {
                    let arr = []
                    let val_split = val.split("\n")
                    for (let val_item of val_split) {
                        arr.push(val_item.trim())
                    }
                    val = arr
                    //out("got files menu path: ")
                    //inspect(val)
                }
                else if (Utils.is_string_a_integer(val)) {
                    val = parseInt(val)
                }
                DDE_DB.persistent_set(key, val)
            }
        }
    }

    //if dde_apps/dde_init.js exists, this loads it.
    //if it doesn't exist, it creates it.
    //no longer called due to browser security
    static async dde_init_dot_js_initialize() {
        let does_dde_apps_folder_exist = await DDEFile.file_exists("")
        if(!does_dde_apps_folder_exist){
            dde_error("dde_init_dot_js_initialize called but there is no Documents/dde_apps/ folder.")
        }
        let does_dde_init_file_exist = await DDEFile.file_exists("dde_init.js")
        if (does_dde_init_file_exist){ //we don't want to error if the file doesn't exist.
            if (globalThis.platform === "node") {
                globalThis.persistent_set = this.persistent_set //todo seems weird. Was in DDE3 but ...
            }
            try{
                await DDEFile.load_file("dde_init.js")
            }
            catch(err0){
                if(globalThis.Editor) { //will not hit in node platform
                    Editor.edit_file(DDEFile.add_default_file_prefix_maybe("dde_init.js"))
                }
                dde_error("The file: Documents/dde_apps/dde_init.js has invalid JavaScript in it.<br/>" +
                    "Please fix this and relaunch DDE.")
                return
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
                '\n'

            //eval(initial_dde_init_content) //nothing in the initial contents to eval so don't bother
            DDEFile.write_file_async("dde_init.js", initial_dde_init_content)
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


    static metrics_set(key, value){
        this.metrics[key] = value
        const dde_object_store = DDE_DB.db.transaction(['dde_object_store'], "readwrite").objectStore('dde_object_store');
        const dos_request = dde_object_store.get("metrics");
        dos_request.onsuccess = function(event) {
            // Get the old value that we want to update
            let data = event.target.result;
            // Update the value
            data[key]= value
            // Create another request that inserts the item back into the database
            const dos_put_request = dde_object_store.put(data, "metrics");
            // When this new request succeeds, run the displayData() function again to update the display
            dos_put_request.onsuccess = function(event) {
                //onsole.log("DDE_DB successfully stored metrics: " + key + " of " + value)
            }
            dos_put_request.onerror = function(event) {
                console.log("ERROR: DDE_DB could not store metrics: " + key + " of " + value)
            }
        }
    }
    static metrics_set_all(metrics_state_obj){
        for(let key in metrics_state_obj){
            this.metrics[key] = metrics_state_obj[key]
        }
        const dde_object_store = DDE_DB.db.transaction(['dde_object_store'], "readwrite").objectStore('dde_object_store');
        const dos_request = dde_object_store.get("metrics");
        dos_request.onsuccess = function(event) {
            const dos_put_request = dde_object_store.put(metrics_state_obj, "metrics");
            // When this new request succeeds, run the displayData() function again to update the display
            dos_put_request.onsuccess = function(event) {
                //onsole.log("DDE_DB successfully stored all metrics: " + metrics_state_obj)
            }
            dos_put_request.onerror = function(event) {
                console.log("ERROR: DDE_DB could not store metrics: " + metrics_state_obj)
            }
        }
    }
}

globalThis.DDE_DB = DDE_DB

//this is a deprication warning and automatic converter to the new style
//to help backwards compatibility with DDE3, esp in older dde_init.js files
globalThis.persistent_set = function(key, value){
    if(key === "ROS_URL"){
        warning('You have attempted to call: persistent_set with a key of: ' + key + '<br/>' +
                'That key is no longer valid, and persistent_set has been depricated.<br/>' +
                'Please change your code to:  default_default_ros_url = ' + value)
    }
    else if(key === "default_default_dexter_ip_address") {
        globalThis.default_default_dexter_ip_address = value
        warning('You have attempted to call: persistent_set with a key of: ' + key + '<br/>' +
                'That functionality is now handled by: ' + key + " = " + value + "<br/>" +
                'which has automatically been done for you.')
    }
    else if(key === "default_default_dexter_port") {
        globalThis.default_default_dexter_port = value
        warning('You have attempted to call: persistent_set with a key of: ' + key + '<br/>' +
                'That functionality is now handled by: ' + key + " = " + value + "<br/>" +
                'which has automatically been done for you.')
    }
    else {
        DDE_DB.persistent_set(key, value)
        warning('You have attempted to call: persistent_set with a key of: ' + key + '<br/>' +
                'That functionality is now handled by: DDE_DB.persistent_set ' + key + " = " + value + "<br/>" +
                'which has automatically been done for you.')
    }
}