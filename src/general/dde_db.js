class Dde_db{
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

   static init(){
       let request = window.indexedDB.open("dde_db", 0);
       request.onerror = function(event) {
           dde_error("DDE's database could not be opened. Error code: " +
                     event.target.errorCode)
       }
       request.onsuccess = function(event) {
           console.log("dde_db successfully opened")
           this.db = event.target.result;
       }
       request.onupgradeneeded = function(event) {
           db = event.target.result;
           // Create an objectStore for this database
           let objectStore = db.createObjectStore("dde_object_store")
           objectStore.transaction.oncomplete = function(event) {
               // Store values in the newly created objectStore.
               let the_dde_object_store = db.transaction("dde_object_store", "readwrite")
               the_dde_object_store.add(persisent_values_initial_object, "persistent_values")
               Dde_db.persistent_values = persisent_values_initial_object
               the_dde_object_store.add(metrics_initial_object, "metrics")
               Dde_db.metrics = metrics_initial_object
           }
       }
       //grab data from db and populate
       const dos_request = objectStore.get(persistent_values);
       dos_request.onsuccess = () => {
           const data = dos_request.result;const dos_request = objectStore.get("persistent_values");
           dos_request.onsuccess = () => {
               Dde_db.persistent_values = dos_request.result;
           }
       }
       const dos_metrics_request = objectStore.get(persistent_values);
       dos_metrics_request.onsuccess = () => {
           const data = dos_request.result;const dos_request = objectStore.get("metrics");
           dos_request.onsuccess = () => {
               Dde_db.metrics = dos_request.result;
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
        const dde_object_store = this.db.transaction(['dde_object_store'], "readwrite").objectStore('dde_object_store');
        const dos_request = objectStore.get(persistent_values);
       dos_request.onsuccess = () => {
           // Grab the data object returned as the result
           const data = dos_request.result;
           // Update the notified value in the object to "yes"
           data[key]= value
           // Create another request that inserts the item back into the database
           const dos_put_request = dde_object_store.put(data);
           // When this new request succeeds, run the displayData() function again to update the display
           dos_put_request.onsuccess = () => {
               console.log("dde_db successfully stored persisten_value: " + key + " of " + value)
           }
        }
   }
}

globalThis.DDE_DB = Dde_db