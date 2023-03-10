//BEWARE not now used. Use dde_db.js instead.

globalThis.Persistent = class Persistent{

    static persistent_values = {}

//used by both persistent_initialize and dde_init_dot_js_initialize
    static get_persistent_values_defaults() {
        return {"save_on_eval": false,
            "default_out_code": false,
            "files_menu_paths": [DDEFile.add_default_file_prefix_maybe("dde_init.js")],
            "misc_pane_content": "Simulate Dexter",
            "misc_pane_choose_file_path": "", //only used on dde init, and only if misc_pane_content is "choose_file"
            "default_dexter_simulate": ((globalThis.platform === "node") ? false : true),
            "default_dexter_ip_address": default_default_dexter_ip_address,
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
    }
//ensures that dde_apps folder exists, that dde_persistent.json, and
//loads in values from dde_persistent.json
    static async persistent_initialize() {
        if(!globalThis.default_default_dexter_ip_address) {
            globalThis.default_default_dexter_ip_address = ((globalThis.platform === "node") ? "localhost" : "192.168.1.142")
        }
        let does_dde_apps_file_exist = await DDEFile.file_exists("")
        if(!does_dde_apps_file_exist){
            await DDEFile.make_folder("") //make dde_apps folder, synchronous
        }
        const dp_path = DDEFile.add_default_file_prefix_maybe("dde_persistent.json")
        let does_dp_file_exist = await DDEFile.file_exists(dp_path)
        if(!does_dp_file_exist){
            this.persistent_values = this.get_persistent_values_defaults()
            this.persistent_save() //synchronous .creates "dde_persistent.json"
        }
        else { this.persistent_load() } //synchronous
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

    static persistent_save(){
        //we need this because on windows 10, if you minimize the DDE window, then
        //quit DDE, the below saved values will be 0, then launching dde
        //makes the window invisible. So this protects against that.
        let the_defaults = this.get_persistent_values_defaults()
        this.persistent_values.dde_window_x      = Math.max(this.persistent_values.dde_window_x, 0) //on WinOS, when minimizing, sometimes the x & y vals are negative, hiding the window.
        this.persistent_values.dde_window_y      = Math.max(this.persistent_values.dde_window_y, 0)
        if(this.persistent_values.dde_window_width  <= 60)  { this.persistent_values.dde_window_width  = the_defaults.dde_window_width  }
        if(this.persistent_values.dde_window_height <= 20)  { this.persistent_values.dde_window_height = the_defaults.dde_window_height }
        const path = DDEFile.add_default_file_prefix_maybe("dde_persistent.json")
        let content = JSON.stringify(this.persistent_values)
        content = Utils.replace_substrings(content, ",", ",\n") //easier to read & edit
        content = content.replace('"files_menu_paths":[', '"files_menu_paths":[\n') //just insert newline to improve formatting of the file
        content = "//This file content must live in Documents/dde_apps/dde_persistent.json\n" +
            "//Upon DDE launch, this file is loaded before Documents/dde_apps/dde_init.js\n" +
            "//Because this file is automatically saved while running DDE, only edit it with DDE closed.\n" +
            "//It must be syntactically perfect, so edit it with care.\n" +
            "//Within DDE, use persistent_get(key) and persistent_set(key, new_value)\n" +
            "//to access each of the below variables.\n\n"
            + content
        DDEFile.write_file_async(path, content)
    }


    static async persistent_load(){
        const path = DDEFile.add_default_file_prefix_maybe("dde_persistent.json")
        let does_file_exist = await DDEFile.file_exist(path)
        if(does_file_exist){
            var content = await DDEFile.read_file_async(path)
            const start_of_content = content.indexOf("{")
            if (start_of_content != -1) { content = content.substring(start_of_content) } //get rid of comment at top of file
            this.persistent_values = JSON.parse(content)
            //just in case files got saved out with backslashes, change to only slashes.
            let files = this.persistent_values.files_menu_paths
            if(files){
                let slashified_files = []
                for(let file of files){
                    file = DDEFile.convert_backslashes_to_slashes(file)
                    slashified_files.push(file)
                }
                this.persistent_values.files_menu_paths = slashified_files
            }
            //protect against the tiny window bug.
            let the_defaults = this.get_persistent_values_defaults()
            if(this.persistent_values.dde_window_width  <= 60)  { this.persistent_values.dde_window_width  = the_defaults.dde_window_width  }
            if(this.persistent_values.dde_window_height <= 20)  { this.persistent_values.dde_window_height = the_defaults.dde_window_height }
        }
        this.persistent_load_fill_in_defaults() //this is needed when a new persistent var is added accross a release,
                                           //or the user deletes a var in the .json file
    }

    static persistent_load_fill_in_defaults(){
        let defaults = this.get_persistent_values_defaults()
        let needs_saving = false
        for(let key in defaults){
            if(!this.persistent_values.hasOwnProperty(key)){
                this.persistent_values[key] = defaults[key]
                needs_saving = true
            }
        }
        if(needs_saving){
            this.persistent_save()
        }
    }

    static persistent_set(key, value){
        this.persistent_values[key] = value
        this.persistent_save()
    }

//returns undefined if key doesn't exist
    static persistent_get(key="get_all"){
        if (key == "get_all") { return this.persistent_values }
        else { return this.persistent_values[key] }
    }


    static persistent_remove(key) {
        delete this.persistent_values[key]
        this.persistent_save()
    }

    static default_default_ROS_URL           = "localhost:9090"
    static default_default_dexter_ip_address = "192.168.1.142"
    static default_default_dexter_port       = 50000

//gaurentees that dde_init.js exists and that it has certain content in it,
//and that that certain content is evaled and present in the js env.
    static async dde_init_dot_js_initialize() {
        let does_file_exist = await DDEFile.file_exists("")
        if(!does_file_exist){
            dde_error("dde_init_dot_js_initialize called but there is no Documents/dde_apps/ folder.")
        }
        else if (await DDEFile.file_exists("dde_init.js")){ //we don't want to error if the file doesn't exist.
            if (globalThis.platform == "node") {
                globalThis.persistent_set = this.persistent_set //todo seems weird. Was in DDE3 but ...
            }
            try{
                await DDEFile.load_file("dde_init.js")
            }
            catch(err0){
                if(globalThis.Editor) { //will not hit in node platform
                    Editor.edit_file(add_default_file_prefix_maybe("dde_init.js"))
                }
                dde_error("The file: Documents/dde_apps/dde_init.js has invalid JavaScript in it.<br/>" +
                    "Please fix this and relaunch DDE.")
                return
            }
            var add_to_dde_init_js = ""
            if (!this.persistent_get("ROS_URL")){
                add_to_dde_init_js += 'Persistent.persistent_set("ROS_URL", "' + Persistent.default_default_ROS_URL + '") //required property, but you can edit the value.\n'
            }
            if (!this.persistent_get("default_dexter_ip_address")){
                add_to_dde_init_js += 'Persistent.persistent_set("default_dexter_ip_address", "' + Persistent.default_default_dexter_ip_address + '") //required property, but you can edit the value.\n'
            }
            if (!this.persistent_get("default_dexter_port")){
                add_to_dde_init_js += 'Persistent.persistent_set("default_dexter_port", "' + Persistent.default_default_dexter_port + '") //required property, but you can edit the value.\n'
            }
            if(!Brain.brain0) {
                add_to_dde_init_js += '\nnew Brain({name: "brain0"})\n'
            }
            if(!Dexter.dexter0){
                add_to_dde_init_js += '\nnew Dexter({name: "dexter0"}) //dexter0 must be defined.\n'
            } //note, in the weird case that the user has defined the ip_address and/or port
              //but not dexter0, then dexter0 gets at the front of the init file, not
              //after the address and that's bad because it needs the ip_address
              //but a fancier scheme of putting dextero always at the end of the file
              //is bad too since all the "system" code is not at the beginning, before user code.
              //So in our "weird case" loading dde_init will error. Not so terrible
            if (add_to_dde_init_js != ""){
                var di_content = await DDEFile.read_file_async("dde_init.js")
                di_content = add_to_dde_init_js + di_content
                DDEFile.write_file_async("dde_init.js", di_content)
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
                'Persistent.persistent_set("ROS_URL", "' + default_default_ROS_URL + '") //required property, but you can edit the value.\n' +
                'Persistent.persistent_set("default_dexter_ip_address", "'    +
                Persistent.default_default_dexter_ip_address + '") //required property but you can edit the value.\n' +
                'Persistent.persistent_set("default_dexter_port", "'          +
                Persistent.default_default_dexter_port + '") //required property, but you can edit the value.\n' +
                'new Brain({name: "brain0"})\n' +
                'new Dexter({name: "dexter0"}) //dexter0 must be defined.\n'

            eval(initial_dde_init_content)
            DDEFile.write_file_async("dde_init.js", initial_dde_init_content)
            if(globalThis.Editor && !Editor.files_menu_paths_empty_or_contains_only_dde_init()){ // we don't want to
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
}