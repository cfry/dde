class DDE_DB{
   static persistent_values_initial_object =
       {
       "animate_ui": true,
       "dde_init": "",
       "dde_window_x":        50,
       "dde_window_y":        50,
       "dde_window_width":  1000,
       "dde_window_height":  700,
       "default_dexter_simulate": true,
       "default_out_code": false,
       "dexter0_ip_address": "auto",
       "dont_show_splash_screen_on_launch": false,
       "editor_font_size": 17,
       "files_menu_paths": [], //todo [add_default_file_prefix_maybe("dde_init.js")],
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
       //onupgradeneeded  will be called before onsuccess IFF its needed, ie in the window.indexedDB.open has a new higher db version as its 2nd arg.
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
               let data = dos_request.result
               //just in case new version of dde adds some persistent_values...
               let is_modified = false
               for(let key in DDE_DB.persistent_values_initial_object){
                   if(data[key] === undefined){
                       data[key] = DDE_DB.persistent_values_initial_object[key]
                       is_modified = true
                   }
               }
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
                out(key + ": " + val)
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