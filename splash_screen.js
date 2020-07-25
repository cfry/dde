var SplashScreen = class SplashScreen {
    static the_checkmark_char = "\u2713" //unicode check

    static splash_screen_tutorial_label_to_name(label){
        if(label.startsWith(this.the_checkmark_char)) { return label.substring(1) }
        else { return label.substring(3) }
    }

    static show_splash_screen_cb(vals){
        if(vals.clicked_button_value == "splash_screen_dont_show_checkbox"){
            let boolean_to_save = vals.splash_screen_dont_show_checkbox
            persistent_set("dont_show_splash_screen_on_launch", boolean_to_save)
            if(vals["splash_screen_dont_show_checkbox"]) {
                out("The splash screen will not come up when you launch DDE.<br/>" +
                    "You can still see the splash screen by:<br/>" +
                    "1. Click the big blue question mark in the upper right.<br/>" +
                    "2. In the Doc pane, click: <button>show splash screen</button>")
            }
        }
        else if(vals.clicked_button_value == "splash_screen_which_tutorial_id") {
            let the_tut_label = vals.splash_screen_which_tutorial_id //includes checkmark or whitespace before actual name
            let is_already_checked = the_tut_label.startsWith(SplashScreen.the_checkmark_char)
            let the_tut_name = SplashScreen.splash_screen_tutorial_label_to_name(the_tut_label)
            let the_option_elt
            for(let an_option_elt of splash_screen_which_tutorial_id.children){
                if(an_option_elt.innerText === the_tut_label){
                    the_option_elt = an_option_elt
                    break;
                }
            }
            splash_screen_which_tutorial_id.value = undefined //this "unselects the option, Now a user can click on the same option again
                                         //and the event will make it to show_splash_screen_cb and
                                         //we can operate on it. Otherwise, can't get an event though.
            if(is_already_checked) {
                the_option_elt.innerHTML = "&nbsp;&nbsp;&nbsp;" + the_tut_name //uncheck it
                out("To view <b>" + the_tut_name + "</b>, please click it again and check it.")
            }
            else { // not already checked
                the_option_elt.innerHTML = "&check;" + the_tut_name //check it
                SplashScreen.perform_tutorial_action(the_tut_name)
            }
            let all_options = []
            for(let an_option_elt of splash_screen_which_tutorial_id.children){
                let text = an_option_elt.innerHTML
                all_options.push(text)
            }
            persistent_set("splash_screen_tutorial_labels", all_options)
        }
    }

    static show(){
        show_window({title: "Welcome to Dexter Development Environment",
            y: 100,
            width: 480,
            height: 390,
            background_color: "#bae5fe", // pastel green: "#e7ffef",
            callback: "SplashScreen.show_splash_screen_cb",
            content:
    `<div style="font-size:18px;margin-left:15px;">
        <!--<div style="font-family: 'Creepster';font-size: 60px;color:#7600f5">D o n't &nbsp; P a n i c !</div>
        <i>The</i> answer is 42, but for other answers,<br/> -->
        <div style="font-size:50px;">Tutorials</div>
        &bull; Click <b style='color:blue;font-size:24px;'>?</b> in the upper right of the outer window <b style='font-size:24px;'>&#x279A;</b> <i>or</i>,<br/>
        <!--&bull; <button onclick="open_doc(help_system_doc_id)">Show Tutorial List</button> <i>or</i><br/>-->
         <span style="vertical-align:top;">&bull; Select a tutorial from: </span><br/>
        <select id="splash_screen_which_tutorial_id" size="9" data-oninput="true" style="font-size:16px;">` +
        this.splash_screen_tutorial_options_html() +
       `</select><p></p>
        <input name="splash_screen_dont_show_checkbox" type="checkbox" data-onchange="true"/><span style="font-size:14px;">
            Don't show this dialog on DDE launch.</span>
    </div>`})
    }

    static show_maybe(){
        if(!persistent_get("dont_show_splash_screen_on_launch")){
            this.show()
        }
    }

//complication: what if I change the tutorials in a new release,
//what with some staying the same and wanting to preserve their checkmarks
    static splash_screen_tutorial_options_html(){
        let result = ""
        let labels = persistent_get("splash_screen_tutorial_labels") //might have checkmarks in them.
        for(let name_and_tooltip of this.splash_screen_tutorial_names_and_tooltips){
           let name = name_and_tooltip[0]
           let label = null
           for(let a_label of labels) {
               if(a_label.endsWith(name)){
                   label = a_label //might have a checkmark
                   break;
               }
           }
           if(!label) { label = "&nbsp;&nbsp;&nbsp;" + name } //default is no checkmark
           result += "<option " +
                      "title='" + name_and_tooltip[1] +
                      "'>" +
                      label + "</option>\n"
        }
        return result
    }

    static perform_tutorial_action(name) {
        for(let name_and_tooltip of this.splash_screen_tutorial_names_and_tooltips){
            if(name_and_tooltip[0] == name){
                let action = name_and_tooltip[2]
                eval(action)
                return
            }
        }
        shouldnt("in SplashScreen.perform_tutorial_action, couldn't find action for: " + name)
    }

    static splash_screen_tutorial_names_and_tooltips = [
        ["Dexter User Interface",     "Control Dexter or a simulation&#013;via an interactive dialog&#013;and learn Kinematics in the process.&#013;Also at: Jobs menu/Dexter Tools/Dexter UI",
                                      "Job.define_and_start_job(__dirname + '/user_tools/dexter_user_interface2.js')"],
        ["Configure Dexter",          "How to connect your Dexter robot,&#013;to your computer.",
                                      "open_doc(configure_dexter_id)"],
        ["Tooltips",                  "Hover the mouse on a widget to learn about it.",
                                      "open_doc(tooltips_doc_id)"] ,
        ["Code Examples",             "Insert code into the editor via menus.",
                                      "open_doc(code_examples_doc_id)"],
        ["Learning JavaScript",       "Learn JS by stepping through code.",
                                      "open_doc(learning_js_doc_id)"],
        ["Test Suite examples",       "The DDE diagnostic system doubles as code exammples.",
                                      "open_doc(TestSuite_for_help_doc_id)"],
        ["Doc Pane",                  "DDE documentation is contained in the right-hand documentation pane.",
                                      "close_all_details()"],
        ["Find Button",               "Search the documentation.",
                                      "open_doc(find_button_doc_id)"],
        ["Click Help",                "Clicking anywhere in the editor shows help in the output pane.",
                                      "open_doc(click_help_doc_id)"],
        ["Eval Button",               "Evaluate selected JavaScript.",
                                      "open_doc(eval_button_doc_id)"],
        ["Make Instruction",          "Create instructions for a Job via a dialog box.",
                                      "open_doc(make_instruction_pane_doc_id)"],
        ["Dexter Features",           "Videos demonstrating Dexter capabilities&#013;plus an early look at DDE.",
                                      "window.open('https://www.hdrobotic.com/features')"],
        ["Haddington Videos",         "Haddington mission and hardware.",
                                      "window.open('http://hdrobotic.com/videos/')"],
        ["Webinar Videos",            "DDE in depth. 45 to 60 minute videos of the core concepts and syntax.",
                                      "window.open('https://www.hdrobotic.com/blog/programming-in-dexter-development-environment-archive')"],
        ["JS for Python Programmers", "Instructions for DDE Jobs&#013;look a lot like Python.",
                                      "open_doc(js_for_pythond_programmers_doc_id)"],
        ["On-line Documentation",     "Full on-line doc, including&#013;release notes of the latest version.",
                                      "window.open('https://www.hdrobotic.com/software')"],
        ["DDE Source Code",           "DDE is open source software that is stored on GitHub.",
                                      "window.open('https://github.com/cfry/dde')"]
     ]

    //called by get_persistent_values_defaults
    static splash_screen_tutorial_labels(){
        let result = []
        for(let name_and_tooltip of this.splash_screen_tutorial_names_and_tooltips){
            result.push("&nbsp;&nbsp;&nbsp;" + name_and_tooltip[0])
        }
        return result
    }
}