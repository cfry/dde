import {dui_tour}      from "../tutorials/dexter_ui_tutorial.js"
import {learn_js_tour} from "../tutorials/learn_js_tour.js"

class SplashScreen {
    static the_checkmark_char = "\u2713" //unicode check

    static splash_screen_tutorial_label_to_name(label){
        if(label.startsWith(this.the_checkmark_char)) { return label.substring(1) }
        else { return label.substring(3) }
    }

    static show_splash_screen_cb(vals){
        if(vals.clicked_button_value == "splash_screen_dont_show_checkbox"){
            let boolean_to_save = vals.splash_screen_dont_show_checkbox
            DDE_DB.persistent_set("dont_show_splash_screen_on_launch", boolean_to_save)
            if(vals["splash_screen_dont_show_checkbox"]) {
                out("The Welcome Dialog box will not come up when you launch DDE.<br/>" +
                    "You can still see the Welcome Dialog box by clicking<br/>" +
                    "the help button at the end of the Editor pane menu bar.")
            }
        }
        else if(vals.clicked_button_value == "splash_screen_which_tutorial_id") {
            let the_tut_label = vals.splash_screen_which_tutorial_id //includes checkmark or whitespace before actual name
            let the_tut_name = SplashScreen.splash_screen_tutorial_label_to_name(the_tut_label)
            let the_option_elt
            for(let an_option_elt of splash_screen_which_tutorial_id.children){
                if(an_option_elt.innerText.includes(the_tut_name)){ //beware, race condition on WinOS can cause a problem here
                    the_option_elt = an_option_elt
                    break;
                }
            }
            splash_screen_which_tutorial_id.value = undefined //this "unselects the option, Now a user can click on the same option again
                                         //and the event will make it to show_splash_screen_cb and
                                         //we can operate on it. Otherwise, can't get an event though.
            SplashScreen.handle_checking_of_tutorial(the_tut_label, the_tut_name, the_option_elt)
            SplashScreen.perform_tutorial_action(the_tut_name)
        }
        else if(vals.clicked_button_value == "close_button"){
            out("You can pop up the Welcome Dialog box by<br/>" +
                "clicking the Help button<br/>" +
                 "at the end of the Editor pane menu bar.")
        }
    }

    //this ensures that the label is checked,
    //and if not, checks it and saves out the new vals.
    //we now don't let the user uncheck a checkbox.
    static handle_checking_of_tutorial(the_tut_label, the_tut_name, the_option_elt){
        let is_already_checked = the_tut_label.startsWith(SplashScreen.the_checkmark_char)
        if(!is_already_checked){
            the_option_elt.innerHTML = "&check;" + the_tut_name //check it
            let all_options = []
            for(let an_option_elt of splash_screen_which_tutorial_id.children){
                let text = an_option_elt.innerHTML
                all_options.push(text)
            }
            DDE_DB.persistent_set("splash_screen_tutorial_labels", all_options)
        }
    }

    static show(){
        show_window({title: 'Welcome to DDE', //The title is used to find the window to auto_close it when user chooses certain tutorials.
            // putting this in a span tag and making a smaller font means you can't drag the title bar to reposition the dialog
            x: 320, //same as dexter ui on purpose so that dui will "cover up" the splash screen.
            y: 100,
            width: 310, //380 is splash screen width 480,
            height: 375,
            background_color: "#bae5fe", // pastel green: "#e7ffef",
            callback: "SplashScreen.show_splash_screen_cb",
            content:
    `<div style="font-size:18px;margin-left:15px;">
         <div style="font-size:30px;">Tutorials</div> 
         Please start with the first tutorial.<br/>     
        <select id="splash_screen_which_tutorial_id" size="9" data-oninput="true" style="font-size:16px;">` +
        this.splash_screen_tutorial_options_html() +
       `</select>
        <div style="margin-top:5px;">
        <input name="splash_screen_dont_show_checkbox" type="checkbox" data-onchange="true"/><span style="font-size:14px;">
            Don't show this dialog on DDE launch.<br/>
            (You can get it back by clicking 
            <button>Help</button><br/>
            in the Editor pane menu bar.)</span></div>
    </div>`})
    }

    /*
    <!--<div style="font-family: 'Creepster';font-size: 60px;color:#7600f5">D o n't &nbsp; P a n i c !</div>
        <i>The</i> answer is 42, but for other answers,<br/> -->

    &bull; Click <b style='color:blue;font-size:24px;'>?</b> in the upper right of the outer window <b style='font-size:24px;'>&#x279A;</b> <i>or</i>,<br/>
        <!--&bull; <button onclick="DocCode.open_doc(help_system_doc_id)">Show Tutorial List</button> <i>or</i><br/>-->
         <span style="vertical-align:top;">&bull; Select a tutorial from: </span><br/>*/

    static show_maybe(){
        if(!DDE_DB.persistent_get("dont_show_splash_screen_on_launch")
           ){
            this.show()
        }
    }

    static close_window_with_help(){
        SW.close_windows_of_title("Welcome to DDE")
        out("You can pop up the Welcome Dialog box by<br/>" +
            "clicking the Help button<br/>" +
            "at the end of the Editor pane menu bar.")
    }

//complication: what if I change the tutorials in a new release,
//what with some staying the same and wanting to preserve their checkmarks
    static splash_screen_tutorial_options_html(){
        let result = ""
        let labels = DDE_DB.persistent_get("splash_screen_tutorial_labels")
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
           result += "<option class='splash_screen_item' " +
                      "title='" + name_and_tooltip[1] +
                      "' style='cursor:pointer;'>" +
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
        //don't have to have an action for the first step. It could just show a tooltip.
        // shouldnt("in SplashScreen.perform_tutorial_action, couldn't find action for: " + name)
    }

    static start_dui_tutorial(){
        //Job.define_and_start_job(__dirname + '/user_tools/dexter_user_interface2.js') //now done after
        //user selects simulate or real so that the robt/job picks up the radio button value.
        //setTimeout(function() {
        //            load_files(__dirname + "/tutorials/dexter_ui_tutorial.js")},
        //            500)
        //doc: https://shepherdjs.dev/docs/tutorial-02-usage.html  orig tan color: #ffcdb0
        //set_css_properties(".shepherd_step {background-color:#ffdfc0; width:300px;}")
        //set_css_properties(".shepherd-modal-overlay-container.shepherd-modal-is-visible{opacity:0.4}")
        //set_css_properties(".shepherd_step_dui_wide {width:400px}")
        dui_tour.start()
    }

    static start_learn_js_tutorial(){
        learn_js_tour.start()
    }

    static splash_screen_tutorial_names_and_tooltips = [
        ["Move Dexter",               "Control Dexter or a simulation&#013;via an interactive dialog&#013;and learn Kinematics in the process.&#013;Also at: Jobs menu/Dexter UI",
                                      "SplashScreen.start_dui_tutorial()"],
        ["Configure Dexter",          "How to connect your Dexter robot,&#013;to your computer.",
                                      "DocCode.open_doc(configure_dexter_id)"],
        //["Learning JavaScript",       "Learn JS by stepping through code.",
        //    "DocCode.open_doc(learning_js_doc_id)"],
        ["Learn JavaScript",           "The basics of entering, running and debugging JavaScript.",
                                       "SplashScreen.close_window_with_help(); DocCode.open_doc(learning_js_doc_id); SplashScreen.start_learn_js_tutorial()"],
       // ["Tooltips",                  "Hover the mouse on a widget to learn about it.",
        //                              "DocCode.open_doc(tooltips_doc_id)"] ,
        //["Run JavaScript",            "Use the Eval button to evaluate JavaScript.",
        //                              "DocCode.open_doc(eval_button_doc_id)"],
        ["Code Examples",             "Insert code into the editor via menus.",
                                      "DocCode.open_doc(code_examples_doc_id)"],

       // ["Test Suite examples",       "The DDE diagnostic system doubles as code exammples.",
       //                               "DocCode.open_doc(TestSuite_for_help_doc_id)"],
        ["Doc Pane",                  "DDE documentation is contained in the right-hand documentation pane.",
                                      "DocCode.close_all_details()"],
        ["Find Button",               "Search the documentation.",
                                      "DocCode.open_doc(find_button_doc_id)"],
       // ["Click Help",                "Clicking anywhere in the editor shows help in the output pane.",
       //                               "DocCode.open_doc(click_help_doc_id)"],

        ["Make Instruction",          "Create instructions for a Job via a dialog box.",
                                      "DocCode.open_doc(make_instruction_pane_doc_id)"],
        ["Adding JavaScript",         "Extend DDE and create applications.",
                                      "DocCode.open_doc(adding_javascript_doc_id)"],
        ["Help System",               "How DDE helps you learn DDE.",
                                      "DocCode.open_doc(help_system_doc_id)"]
       /* ["Dexter Features",           "Videos demonstrating Dexter capabilities&#013;plus an early look at DDE.",
                                      "window.open('https://www.hdrobotic.com/features')"],
        ["Haddington Videos",         "Haddington mission and hardware.",
                                      "window.open('http://hdrobotic.com/videos/')"],
        ["Webinar Videos",            "DDE in depth. 45 to 60 minute videos of the core concepts and syntax.",
                                      "window.open('https://www.hdrobotic.com/blog/programming-in-dexter-development-environment-archive')"],
        ["JS for Python Programmers", "Instructions for DDE Jobs&#013;look a lot like Python.",
                                      "DocCode.open_doc(js_for_python_programmers_doc_id)"],
        ["On-line Documentation",     "Full on-line doc, including&#013;release notes of the latest version.",
                                      "window.open('https://www.hdrobotic.com/software')"],
        ["DDE Source Code",           "DDE is open source software that is stored on GitHub.",
                                      "window.open('https://github.com/cfry/dde')"]
        */
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

globalThis.SplashScreen = SplashScreen //I use to export this, but
//has problems because the callback to the show_window is "SplashScreen.show_splash_screen_cb"
//so SplashScreen gets looked up in a global context in the show Window submit code.
//so easier to make it global