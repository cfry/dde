class DDE_DB{
   static persisent_values_initial_object =
       {"save_on_eval":     false,
       "default_out_code": false,
       "files_menu_paths": [], //todo [add_default_file_prefix_maybe("dde_init.js")],
       "misc_pane_content": "Simulate Dexter",
       "misc_pane_choose_file_path": "", //only used on dde init, and only if misc_pane_content is "choose_file"
       "default_dexter_simulate": true,
       "editor_font_size":    17,

       "dde_window_x":       50,
       "dde_window_y":       50,
       "dde_window_width":  1000,
       "dde_window_height":  700,
       "left_panel_width":   700,
       "top_left_panel_height": 350,
       "top_right_panel_height": 200,

       "animate_ui": true,
       "last_open_dexter_file_path": "", //doesn't have a dexter: prefix,not robot specific.
       "kiosk": false,
       "ssh_show_password": false,
       "dont_show_splash_screen_on_launch": false,
       "splash_screen_tutorial_labels": (globalThis.SplashScreen ? SplashScreen.splash_screen_tutorial_labels() : [])
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
       DDE_DB.persistent_values = DDE_DB.persisent_values_initial_object //very temporary until real db values grabbed
       DDE_DB.metrics = DDE_DB.metrics_initial_object                    //very temporary until real db values grabbed
       let request = window.indexedDB.open("dde_db", 1);
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
               const data = dos_metrics_request.result;
               DDE_DB.metrics = data
           }
           const dos_request = objectStore.get("persistent_values")
           dos_request.onsuccess = () => {
               const data = dos_request.result
               DDE_DB.persistent_values = data
               DDE_DB.db_init_cb.call()
           }
       }
   }

   static persistent_get(key) {
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
               console.log("DDE_DB successfully stored persistent_value: " + key + " of " + value)
           }
           dos_put_request.onerror = function(event) {
                console.log("ERROR: DDE_DB could not store persistent_value: " + key + " of " + value)
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
                console.log("DDE_DB successfully stored metrics: " + key + " of " + value)
            }
            dos_put_request.onerror = function(event) {
                console.log("ERROR: DDE_DB could not store metrics: " + key + " of " + value)
            }
        }
    }
}

globalThis.DDE_DB = DDE_DB