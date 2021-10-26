console.log("top of ready.js")

//import os from 'os' //todo causes Failed to resolve module specifier "os". bug  //probably only useful in server code,  not browser code.

//import $  from "jquery" //jqxwdigets tech suppport sez this is no longer necessary
//and not having it still makes $ available.
import "jqwidgets-scripts/jqwidgets/styles/jqx.base.css"
import "jqwidgets-scripts/jqwidgets/jqxcore.js"
import "jqwidgets-scripts/jqwidgets/jqxmenu.js"
import "jqwidgets-scripts/jqwidgets/jqxsplitter.js"
import "jqwidgets-scripts/jqwidgets/jqxcombobox.js"
import "jqwidgets-scripts/jqwidgets/jqxlistbox.js"   //needed by combobox
import "jqwidgets-scripts/jqwidgets/jqxbuttons.js"   //needed by listbox
import "jqwidgets-scripts/jqwidgets/jqxscrollbar.js" //needed by listbox
import "jqwidgets-scripts/jqwidgets/jqxcheckbox.js"



//see https://github.com/codemirror/CodeMirror/issues/5484
import CodeMirror from "codemirror/lib/codemirror.js"
globalThis.CodeMirror = CodeMirror

import "codemirror/lib/codemirror.css"
import "codemirror/mode/javascript/javascript.js"
import "codemirror/addon/lint/lint.css"
import "codemirror/addon/lint/lint.js"

//see https://github.com/angelozerr/codemirror-lint-eslint/blob/master/index.html
//import "./eslint-lint.js"  //todo errors even with module "fs" is installed
//import eslint from "eslint"
//which is required by eslint, which is required by eslint-lint
//but with fs installed, it still errors. GRRRR.
// Define CodeMirror first.

import "codemirror/addon/dialog/dialog.css"
import "codemirror/addon/dialog/dialog.js"
import "codemirror/addon/search/searchcursor.js"
import "codemirror/addon/search/search.js"
import "codemirror/addon/edit/matchbrackets.js"

//see https://codemirror.net/demo/folding.html
import "codemirror/addon/fold/foldgutter.css"
import "codemirror/addon/fold/foldcode.js"
import "codemirror/addon/fold/foldgutter.js"
import "codemirror/addon/fold/brace-fold.js"
import "codemirror/addon/fold/comment-fold.js"

import "shepherd.js/dist/css/shepherd.css"

import "../job_engine/core/utils.js" //defines as global class Utils, and a few of its methods such as  dde_error, rgb
import "../job_engine/core/duration.js"

import {init_units} from "../job_engine/core/units.js"
import "../job_engine/core/je_and_browser_code.js" //defines SW and out globally

import "./dde_db.js" //defines class DDE_DB globally
import "../job_engine/math/Coor.js"    //now sets global Coor
import "../job_engine/math/Vector.js"  //now global
import "../job_engine/math/Convert.js" //now global
import "../job_engine/math/Kin.js"     //now global
import "../job_engine/math/DXF.js"     //now global

import {calibrate_build_tables} from "../job_engine/low_level_dexter/calibrate_build_tables.js"

import {convert_backslashes_to_slashes} from "../job_engine/core/storage.js"
import "../job_engine/core/out.js" //makes get_output, show_window, beep, etc global
import "../job_engine/core/job.js" //globally defines Job
import {job_examples} from "./job_examples.js" //just an array of strings of Job defs used for Job menu/insert menu item
import "../job_engine/core/gcode.js" //Gcode now global
import "../job_engine/core/fpga.js" //globally defines FPGA

//robots!
import "../job_engine/core/instruction.js"          //globally defines Instruction, make_ins
import "../job_engine/core/instruction_dexter.js"   //sets Instruction.Dexter to the dexter instruction class
import "../job_engine/core/instruction_io.js"       //makes class IO global
import("../job_engine/core/instruction_control.js") //makes  class Control global
import "../job_engine/core/robot.js" //now global Robot, Brain, Serial, Human, Dexter

import "../job_engine/core/socket.js"       //defines class Socket as global
import "../job_engine/core/dextersim.js"    //defines class DexterSim as global
import "../job_engine/core/simqueue.js"     //defines class Simqueue as global
import "../job_engine/core/robot_status.js" //defines class RobotStatus as global

import "./doc_code.js" //makes DocCode global

import {eval_js_part2} from "./eval.js" //needed for the cmd type in evaluation
import "./svg.js" //defines svg_svg & friends as globals.

//in the general folder, as is ready.js
import "./editor.js" //Editor now global

//import {DDE_NPM}    from "./DDE_NPM.js"   //todo big changes due to import???
//import {SSH}        from "./ssh.js"       //todo
import "./series.js"    //now Series is global
//import {PatchDDE}   from "./patch_dde.js" //todo still needed?

import "./dde_video"  //makes DDEVideo global
import "../simulator/simulate.js" //makes class Simulate global
import "../simulator/simutils.js" //makes class SimUtils global
import "../simulator/simbuild.js" //makes class SimBuild global

import "../job_engine/core/html_db.js" //makes: html_db, make_html, make_dom_elt global
import "./inspect.js" //defines inspect & inspect_out globally
import "../job_engine/core/to_source_code.js" //defined to_source_code globally
//const {google} = require('googleapis'); //todo  do I use this?

import {insert_color}  from "./output.js" //todo sets lots of things in window. Should change to globalThis
                                 //dde4: now globally defines set_css_properties

//import "./picture1.js" //todo dde4, has problems loading opencv.js

import "../test_suite/math_testsuite.js" //imports test_suite.js which globally defines class TestSuite
import "../test_suite/utils_testsuite.js"
import "../test_suite/move_all_joints_testsuite.js"
import "../test_suite/RobotStatus_testsuite.js"

import "../test_suite/dexter_testsuite.js"
import "../music/note_testsuite.js"
import "../music/phrase_testsuite.js"
import "../test_suite/picture_testsuite.js"
import "../test_suite/make_html_testsuite.js"
//import "../test_suite/file_system_testsuite.js" //todo dde4 comment in when file system works
import "../test_suite/fpga_testsuite.js"
import "../test_suite/loop_testsuite.js"
import "../test_suite/when_stopped_testsuite.js"


import "./robot_status_dialog.js" //defines class RobotStatusDialog as global
import {run_instruction}   from "./run_instruction.js"
import "./dexter_utils.js" //makes global var for class: DexterUtils
import "./metrics.js" //globally defines class Metrics //todo can't really work until file save and read.

import "./dexter_user_interface2.js" //define class dui2 globally.
import "./splash_screen.js" //makes SplashScreen global

import "../make_instruction/make_instruction.js" //defines class MakeInstruction globally
import "../make_instruction/miins.js"            //defines class MiIns globally
import "../make_instruction/miparser.js"         //defines class MiParser globally
import "../make_instruction/mistate.js"          //defines class MiState globally
import "../make_instruction/mirecord.js"         //defines class MiRecord globally

import "./plot.js" //globally defines class Plot

//Music
import Midi from "webmidi";
import "../music/note.js"   //defines global Note
import "../music/phrase.js" //defines global Phrase

import "./lesson.js" //defines global Lesson

import package_json        from "../../package.json"

globalThis.dde_version      = "not inited"
globalThis.dde_release_date = "not inited"

globalThis.operating_system = "not inited" //"mac", "win" or "linux"(for Ubuntu)  bound in both ui and sandbox by ready
var dde_apps_folder  = null

globalThis.platform = "not inited"

var js_cmds_array = []
var js_cmds_index = -1




function open_dev_tools(){
    //let dde_ipc
    //dde_ipc.sendSync('open_dev_tools') //can't work from dde4 browser.
    warning("To open Chrome's dev tools (debugger),<br/>click-right on DDE and choose <b>Inspect</b>.")
}

function close_dev_tools(){
    //let dde_ipc    //todo  = require('electron').ipcRenderer
    //dde_ipc.sendSync('close_dev_tools')
    warning("To close Chrome's dev tools (debugger)<br/>close its window from its title bar,<br/>" +
            "or, if its a pane attached to DDE,<br/>click the X in the upper right of that pane.")
}

function undebug_job() {
    js_debugger_checkbox_id.checked = false
}

function play_simulation_demo(){
    Simulate.sim.enable_rendering = true;
    //out("Demo just moves Dexter randomly.")
}

//call this on startup after peristent loaded AND after user clicks the menu item checkbox
function adjust_animation(){
    let animate_dur = (DDE_DB.persistent_get("animate_ui") ? 300 : 0)
    $('#js_menubar_id').jqxMenu({ animationShowDuration: animate_dur })
    $('#js_menubar_id').jqxMenu({ animationHideDuration: animate_dur })
}

//from https://stackoverflow.com/questions/6562727/is-there-a-function-to-deselect-all-text-using-javascript
//pretty useless as doesn't clear selection in cmd input.
function clearSelection(){
    if (window.getSelection) {window.getSelection().removeAllRanges();}
    else if (document.selection) {document.selection.empty();}
}

// document.body.addEventListener('onload', on_ready)
globalThis.operating_system = "not initialized"
//from https://www.geeksforgeeks.org/how-to-detect-operating-system-on-the-client-machine-using-javascript/
function set_operating_system() {
    if      (!globalThis["navigator"])                  globalThis.operating_system="unknown"
    else if (navigator.appVersion.indexOf("Win")!=-1)   globalThis.operating_system="win"
    else if (navigator.appVersion.indexOf("Mac")!=-1)   globalThis.operating_system="mac"
    else if (navigator.appVersion.indexOf("X11")!=-1)   globalThis.operating_system="unix"
    else if (navigator.appVersion.indexOf("Linux")!=-1) globalThis.operating_system="linux"
    else globalThis.operating_system="unknown"
}

export function on_ready() {

        //const os = require('os');
        console.log("top of on_ready")
        //console.log("__dirname:"  + __dirname) //todo dde4 causes error

        /*operating_system = os.platform().toLowerCase() //for Ubuntu, ths returns "linux"
        if      (operating_system == "darwin")       { operating_system = "mac" }
        else if (operating_system.startsWith("win")) { operating_system = "win" }
        */
        set_operating_system()
        //const remote = require("electron").remote
        window.dde_apps_folder //todo = convert_backslashes_to_slashes(remote.getGlobal("dde_apps_folder"))
        //console.log("In renderer dde_apps_folder: " + window.dde_apps_folder)
        //console.log("In renderer appPath: "      + remote.app.getAppPath())//probably not in dde4
        //console.log("In renderer __dirname: "    + __dirname)//dde4 todo
        //require('fs-lock')({
         //   'file_accessdir': [__dirname, dde_apps_folder], //for readFile, etc. but must include __dirname since Electron needs it.
        //    'open_basedir':   [__dirname ] //__direname is the folder this app is installed in. //valid folders to get require's from. /usr/local/share/node_modules',
         //}) //restrict file access
        //window.fs = require('fs')

        dde_version = package_json.version
        dde_release_date = package_json.release_date
        console.log(dde_version)
        platform         = "dde" //"node" is the other possibility, which happens when we're in the job_engine
        //serial_port_init() //now does nothing, No longer necessary to use serial port.
        //window.Root      = Root //should work but doesn't jan 13, 2019

        Coor.init()
        //see also ./core/index.js that has this same code
        Dexter.make_ins = make_ins
        Dexter.calibrate_build_tables = calibrate_build_tables
        window.calibrate_build_tables = undefined
        Dexter.prototype.calibrate_build_tables = function() {
            let result = Dexter.calibrate_build_tables()
            for(let oplet_array of result){
                if(Array.isArray(oplet_array)){
                    oplet_array.push(this)
                }
            }
            return result
        }

        Job.class_init()
        Dexter.class_init()
        new Dexter({name: "dexter0"}) //normally in dde_init.js but that file can over-ride this bare-bones def when its loaded
          //the only thing dde_init.js really MUST do is define dexter0, so just stick
          //it here and now user can screw up dde_init.js and still win.
        setTimeout(function(){
            window.document.title = "Dexter Development Environment " + dde_version
            //dde_version_id.innerHTML      = dde_version //do this by hand because these matic values are NOT getting display in this doc's version on hdrobotic.com/software
            //dde_release_date_id.innerHTML = dde_release_date
        }, 1000)

    Dexter.draw_dxf = DXF.dxf_to_instructions //see Robot.js
    Dexter.prototype.draw_dxf = function({robot = null}={}) {
            let obj_args
            if (arguments.length == 0) { obj_args = {} } //when no args are passed, I must do this
            else { obj_args = arguments[0] }
            obj_args.robot = this
            return Dexter.draw_dxf(obj_args)
    }

    $('#outer_splitter_id').jqxSplitter({
        width: '98%', height: '97%', //was 93%
        orientation: 'vertical',
        panels: [ { size: "70%", collapsible: false}, //, min: "0%"}, //collapsible: false }, //collapsible: false fails in DDE v 3, so see below for setTimeout on a fn to do this
                  { size: '30%', collapsible: true}] //, min: "0%"}] //, collapsible: true}]
    })

    $('#outer_splitter_id').on('resize',
        function (event) {
            let new_size = event.args.panels[0].size
            DDE_DB.persistent_set("left_panel_width", new_size)
            event.stopPropagation()
        })

    DocCode.init_outer_splitter_expand_event()

    $('#left_splitter_id').jqxSplitter({orientation: 'horizontal', width: "100%", height: "100%",
        panels: [{ size: "60%", min: "5%", collapsible: false },
                 { size: '40%', min: "5%", collapsible: true}]
    })

    $('#left_splitter_id').on('resize',
        function (event) {
            let new_size = event.args.panels[0].size
            DDE_DB.persistent_set("top_left_panel_height", new_size)
            event.stopPropagation() //must have or outer_splitter_id on resize is called
        })


    $('#right_splitter_id').jqxSplitter({ orientation: 'horizontal', width: "100%", height: "100%",
        panels: [{ size: "50%"}, { size: "50%"}]
    })

    $('#right_splitter_id').on('resize',
        function (event) {
            let new_size = event.args.panels[0].size
            DDE_DB.persistent_set("top_right_panel_height", new_size)
            event.stopPropagation() //must have or outer_splitter_id on resize is called
        })

    setTimeout(function(){
                $('#outer_splitter_id').jqxSplitter('panels')[0].collapsible = false
                $('#left_splitter_id').jqxSplitter('panels')[0].collapsible = false
                $('#right_splitter_id').jqxSplitter('panels')[0].collapsible = false
            }, 100)
        //TestSuite.make_suites_menu_items() //doesn't work

        //see near bottom for animation.
    $("#js_menubar_id").jqxMenu({autoOpen: false, clickToOpen: false, height: '25px' }) //autoOpen: false, clickToOpen: true,

        //to open a menu, click. Once it is open, if you slide to another menu, it DOESN'T open it. oh well.
    //$("#js_edit_menu").jqxMenu(    { width: '50px', height: '25px' });
    //$("#js_learn_js_menu").jqxMenu({ width: '90px', height: '25px' });
    //$("#js_insert_menu").jqxMenu(  { width: '65px', height: '25px' });
    //$("#js_jobs_menu").jqxMenu(    { width: '55px', height: '25px' });

   // $("#ros_menu_id").jqxMenu({ width: '50px', height: '25px', animationHideDelay: 1000, animationShowDelay: 1000, autoCloseInterval: 1000  });
   $("#cmd_menu_id").jqxMenu({ width: '50px', height: '25px', animationHideDelay: 1000, animationShowDelay: 1000, autoCloseInterval: 1000  });

        //$("#jqxwindow").jqxWindow({ height:400, width:400, showCloseButton: true});
    //$('#jqxwindow').jqxWindow('hide');
    $("#cmd_input_id").keyup(function(event){ //output pane  type in
        if(event.keyCode == 13){ //ENTER key
            let src = Editor.get_cmd_selection() //will return "" if no selection
            if(src.length == 0) { src = cmd_input_id.value} //get full src if no selection
            src = src.trim()
            if (src.length == 0) { warning("no code to eval.")}
            else if(cmd_lang_id.value == "JS"){
                js_cmds_array.push(src)
                js_cmds_index = js_cmds_array.length - 1
                eval_js_part2(src)
            }
            else if(cmd_lang_id.value == "Python"){
                Py.eval(src)
            }
            else if (cmd_lang_id.value == "SSH"){
                cmd_input_id.placeholder = "Type in a shell 'bash' command & hit the Enter key to run."
                //but the above probably never get's seen because the src of the actual default cmd gets shown instead
                SSH.run_command({command: src})  //use defaults which makes formatted dir listing
               //call_cmd_service_custom(src) /ROS selected
            }
            //else if (cmd_lang_id.value == "ROS"){
            //    /call_cmd_service_custom(src) /ROS selected
            //}
        }
        else if(event.keyCode == 38){ //up arrow
           if      (js_cmds_index == -1 ) { out("No JavaScript commands in history") }
           else if (js_cmds_index == 0 )  { out("No more JavaScript command history.") }
           else {
               js_cmds_index = js_cmds_index - 1
               var new_src = js_cmds_array[js_cmds_index]
               cmd_input_id.value = new_src
           }

        }
        else if(event.keyCode == 40){ //down arrow
            if      (js_cmds_index == -1 ) { out("No JavaScript commands in history") }
            else if (js_cmds_index == js_cmds_array.length - 1) {
                if(cmd_input_id.value == "") {
                    out("No more JavaScript command history.")
                }
                else { cmd_input_id.value = "" }
            }
            else {
                js_cmds_index = js_cmds_index + 1
                var new_src = js_cmds_array[js_cmds_index]
                cmd_input_id.value = new_src
            }
        }
        cmd_input_id.focus()
    })
    //cmd_input_id.onblur = function(){
    //        window.getSelection().collapse(cmd_input_id)
    //}

    ////cmd_input_clicked_on_last = false //todo probably remove as not read anywhere global var. Also set below and by Editor.init_editor

    cmd_input_id.onclick = function(event) {
        var full_src = event.target.value
        if (full_src) {
            if(full_src.length > 0){
                let pos = event.target.selectionStart
                if(pos < (full_src.length - 1)){
                    if(cmd_lang_id.value == "JS"){
                        DocCode.onclick_for_click_help(event)
                    }
                    else if(cmd_lang_id.value == "SSH"){
                        let space_pos = full_src.indexOf(" ")
                        if((space_pos == -1) || (pos < space_pos)){
                            DocCode.onclick_for_click_help(event)
                        }
                        //else don't do click help because clicking on the args of a bash cmd
                        //doesn't yield meaningful man help
                    }
                    else if (cmd_lang_id.value == "Python"){
                        out(`<a href='#' onclick='browse_page("https://docs.python.org/3/reference/index.html")' >Python doc</a>`,
                            undefined, true)
                    }
                    else {
                        shouldnt("cmd_input_id got menu item: " + cmd_lang_id.value +
                                 " that has no help.")
                    }
                }
                //else don't give help if clicking at very end.
                //because often that is to edit the cmd and if
                //we're in SSH, printout out a long man page is
                //disruptive
            }
        }
    }

    //js_radio_button_id.onclick  = function() { ros_menu_id.style.display = "none"}
    //ros_radio_button_id.onclick = function() { ros_menu_id.style.display = "inline-block"}

    cmd_lang_id.onchange = function(){
            if(cmd_lang_id.value === "JS"){
                SSH.close_connection()  //if no connection. that's ok
                cmd_menu_id.style.display = "none"
                cmd_input_id.placeholder = "Type in JS & hit the Enter key to eval"
                DocCode.open_doc(JavaScript_guide_id)
            }
            else if(cmd_lang_id.value === "Python"){
                DocCode.open_doc(python_doc_id)
                cmd_input_id.placeholder = "Type in Python3 & hit the Enter key to eval"
            }
            else if(cmd_lang_id.value === "SSH"){
                DocCode.open_doc(ssh_doc_id)
                cmd_input_id.placeholder = "Type in Bash & hit the Enter key to eval"
                SSH.show_config_dialog()
                //cmd_menu_id.style.display = "inline-block"
                //cmd_input_id.value = SSH.show_dir_cmd
                //SSH.init_maybe_and_write("cd /srv/samba/share;" + SSH.show_dir_cmd, false)
            }
    }

    //init_simulation() now in video.js show_in_misc_pane

    //dde_version_id.innerHTML      = dde_version //todo comment back in once doc is loaded
    //dde_release_date_id.innerHTML = dde_release_date //todo comment back in once doc is loaded

    Series.init_series()
    init_units() //has to be after init_series call.
    FPGA.init() //does not depend on Series.

    Gcode.init() //must be after init_series which calls init_units()

    $('#js_textarea_id').focus() //same as Editor.myCodeMirror.focus()  but  myCodeMerror not inited yet

    doc_prev_id.onclick = function() {
        DocCode.open_doc_prev()
    }
    doc_next_id.onclick = function() {
        DocCode.open_doc_next()
    }
    find_doc_button_id.onmousedown = function() {
        DocCode.previous_active_element = document.activeElement
        DocCode.selected_text_when_eval_button_clicked = Editor.get_any_selection()
    };
    find_doc_button_id.onclick = function(event) {
            DocCode.find_doc()
            event.target.blur()
    }
    find_doc_input_id.onclick = function(event) {
        DocCode.onclick_for_click_help(event)
    }
    find_doc_input_id.onchange = function() {
        DocCode.find_doc()
    }
    $("#find_doc_input_id").jqxComboBox({ source: [], width: '150px', height: '25px',}); //create


    //click help for all text inside the code tag (white).
    $('code').click(function(event) {
                         const full_src = window.getSelection().focusNode.data
                         const pos      = window.getSelection().focusOffset
                         Editor.show_identifier_info(full_src, pos)
                    })
        //for results of code examples.
    $('samp').click(function(event) {
                        const full_src = window.getSelection().focusNode.data
                        const pos      = window.getSelection().focusOffset
                        Editor.show_identifier_info(full_src, pos)
    })

    output_div_id.onclick = function(event) {
        DocCode.onclick_for_click_help(event)
    }

   //handles the button clicks and menu selects that chrome Apps prevent in HTML where they belong

   eval_id.onmousedown = function() {
           DocCode.previous_active_element = document.activeElement
           DocCode.selected_text_when_eval_button_clicked = Editor.get_any_selection()
    };

   eval_id.onclick = function(event){
                       event.stopPropagation()
                       Editor.eval_button_action()
                     }

   step_button_id.onclick = function(event){
                               event.stopPropagation()
                               //open_dev_tools() //can't work in dde4 from browser.
                               warning('If the Chrome dev tools window is not open,<br/>click right in the editor pane and choose "Inspect",<br/>then click "Step" again.')
                               setTimeout(function(){
                                              Editor.eval_button_action(true) //cause stepping
                                          }, 500)
                               step_button_id.blur()
                            }

   step_button_id.onmousedown = function() {
       DocCode.previous_active_element = document.activeElement
       DocCode.selected_text_when_eval_button_clicked = Editor.get_any_selection()
   };

   js_debugger_checkbox_id.onclick = function(event) {
       event.stopPropagation()
       if(event.target.checked) {
           open_dev_tools() //todo dde4 test
       }
       else {
           close_dev_tools() //todo dde4 test
       }
   }

  easter_egg_joke_id.onclick = Metrics.easter_egg_joke

  misc_pane_expand_checkbox_id.onclick = DDEVideo.toggle_misc_pane_size

  //email_bug_report_id.onclick=email_bug_report //todo comment back in when doc is loaded
  Editor.init_editor()

 //File Menu

 new_id.onclick = function() {
     if (window.HCA && (Editor.view === "HCA")){
         HCA.clear()
         Editor.add_path_to_files_menu("new buffer")
     }
     else {
         Editor.edit_new_file()
     }
 }
 Editor.set_menu_string(new_id, "New", "n")

 file_name_id.onchange = function(e){ //similar to open
     let orig_path = Editor.current_file_path
     const inner_path = e.target.value //could be "new buffer" or an actual file
     const path = Editor.files_menu_path_to_path(inner_path)
     if (window.HCA && (Editor.view === "HCA")){
         try{
             HCA.edit_file(path)
         }
         catch(err){
             Editor.add_path_to_files_menu(orig_path)
             dde_error(path + " doesn't contain vaild HCA object(s).<br/>" + err.message)
         }
     }
     else { //presume JS
         Editor.edit_file(path)
     }
 }

 open_id.onclick = function(){
     if (window.HCA && (Editor.view === "HCA")){
         const path = choose_file({title: "Choose a file to edit", properties: ['openFile']})
         if (path){
             try{
                 HCA.edit_file(path)
             }
             catch(err){
                 dde_error(path + " doesn't contain vaild HCA object(s).<br/>" + err.message)
             }
             //Editor.add_path_to_files_menu(path) //now down in edit_file because edit_file is called
             //from more places than ready.
         }
     }
     else {
         Editor.open_on_dde_computer() //Editor.open
     }
 }
 Editor.set_menu_string(open_id, "Open...", "o")

 open_from_dexter_id.onclick = Editor.open_from_dexter_computer

 open_system_file_id.onclick = Editor.open_system_file

 load_file_id.onclick=function(e) {
     if (window.HCA && (Editor.view === "HCA")){
         HCA.load_node_definition()
     }
     else { //presume JS
         const path = choose_file({title: "Choose a file to load"})
         if (path){
             if(path.endsWith(".py")){
                Py.load_file_ask_for_as_name(path)
             }
             else {
                 out(load_files(path))
             }
         }
     }
 }

 load_and_start_job_id.onclick = function(){
     const path = choose_file({title: "Choose a file to load"})
     if (path){
         Job.define_and_start_job(path)
     }
 }

 //DDE_NPM.init() //todo big changes due to import???
 //install_npm_pkg_id.onclick = DDE_NPM.show_ui

 insert_file_content_id.onclick=function(e) {
     const path = choose_file({title: "Choose a file to insert into DDE's editor"})
     if (path){
         const content = read_file(path)
         Editor.insert(content)
     }
 }
 insert_file_path_into_editor_id.onclick=function(e){
     const path = choose_file({title: "Choose a file to insert into DDE's editor"})
     if (path){
         Editor.insert('"' + path + '"')
     }
 }
 insert_file_path_into_cmd_input_id.onclick=function(e){
     const path = choose_file({title: "Choose a file to insert into DDE's editor"})
     if (path){
         Editor.insert_into_cmd_input('"' + path + '"')
     }
 }

 save_id.onclick = function() {
     if (window.HCA && (Editor.view === "HCA")){
         if (Editor.current_file_path == "new buffer"){
             HCA.save_as()
         }
         else {
             HCA.save_current_file()
         }
     }
     else {
         Editor.save()
     }
 }
 Editor.set_menu_string(save_id, "Save", "s")

 save_as_id.onclick = function(){
     if (window.HCA && (Editor.view === "HCA")){
         HCA.save_as()
     }
     else {
         Editor.save_as()
     }
 } //was: Editor.save_on_dde_computer //only for saving on dde computer

 save_to_dexter_as_id.onclick = Editor.save_to_dexter_as

 remove_id.onclick = function(){ Editor.remove() } //don't simply use Editor.remove as ther value  for onclick because we want to default its arg as the Editor.remove method does
 update_id.onclick = function(){ check_for_latest_release() }

 //Edit menu  (see editor.js for the Edit menu items
 //Editor.init_editor() I moved this up

//Insert menu
    js_example_1_id.onclick=function(){
        Editor.insert(
`//Click the Eval button to define and call the function 'foo'.
function foo(a, b){ //define function foo with 2 args
    out("foo called with a=" + a) //print 1st arg to Output pane.
    for(var item of b){ //loop over items in array b
        if (item > 9.9){
            out("got a big one: " + item)
        }
    }
    return b.length //foo returns the length of its 2nd arg.
                    //After calling, observe '4' in the Output pane.
}

foo("hello", [7, 10, 20, -3.2]) //call function foo with 2 args
                                //a string and an array of numbers.
`)}

alert_id.onclick   = function(){Editor.wrap_around_selection(  "alert(", ')', '"Hi."')}
confirm_id.onclick = function(){Editor.wrap_around_selection("confirm(", ')', '"Do it?"')}
prompt_id.onclick  = function(){Editor.wrap_around_selection( "prompt(", ')', '"Price?"')}

 out_black_id.onclick =function(){Editor.wrap_around_selection("out(", ')', '"Hello"')}
 out_purple_id.onclick=function(){Editor.wrap_around_selection("out(", ', "blue")', '"Hello"')}
 out_brown_id.onclick =function(){Editor.wrap_around_selection("out(", ', "rgb(255, 100, 0)")', '"Hello"')}

 editor_insert_id.onclick = function(){Editor.insert(
`Editor.insert("text to insert",
"replace_selection", //insertion_pos.   "replace_selection" is the default. Other options: "start", "end", "selection_start", "selection_end", "whole", an integer
false)              //select_new_text. false is the default.
`)}


show_window_help_id.onclick = function(){DocCode.open_doc(show_window_doc_id)}

 window_simple_message_id.onclick=function(){Editor.insert(
`//show_window simple message
//Pop up a window with content of the given HTML.
show_window("hi <i style='font-size:100px;'>wizard</i>")
` )}
insert_color_id.onclick = insert_color
 window_options_id.onclick=function(){Editor.insert('//show_window  Window Options\n' +
                                                      'show_window({\n' +
                                                               '    content: "hi",      // Any HTML OK here.\n' +
                                                               '    title: "Greetings", // Appears above the content. Any HTML OK.\n' +
                                                               '    width: 180, // 100 to window.outerWidth\n' +
                                                               '    height: 70, //  50 to window.outerHeight\n' +
                                                               "    x: 0,       // Distance from left of DDE window to this window's left\n" +
                                                               "    y: 100,     // Distance from top  of DDE window to this window's top\n" +
                                                               '    is_modal: false, // If true, prevents you from interacting with other windows. Default false.\n' +
                                                               '    show_close_button: true,    // Default true.\n' +
                                                               '    show_collapse_button: true, // Allow quick shrink of window. Default true.\n' +
                                                               '    resizable: true,            // Drag lower right corner to change dialog size.\n' +
                                                               '    draggable: true,            // Mouse down and drag on title bar to move dialog.\n' +
                                                               '    trim_strings: true,         // Remove whitespace from beginning and end of values from inputs of type text and texareas. Default true.\n' +
                                                               '    background_color: "ivory"   // Default is "rgb(238, 238, 238)" (light gray). White is "rgb(255, 255, 255)"\n' +
                                                               '})\n')}
     window_buttons_id.onclick=function(){Editor.insert(
`//show_window  Buttons  Example
//The below function is called when a button is clicked in the shown window.
function count_up(vals){ //vals contains name-value pairs for each
                      //html elt in show_window's content with a name.
 if(vals.clicked_button_value == "Count"){ // Clicked button value holds the name of the clicked button.
     if(window.demo_counter == undefined) {
         window.demo_counter = 10           // Initialize the demo_counter global variable.
     }
     window.demo_counter = window.demo_counter + 1 // Increment demo_counter upon each button click.
     count_id.innerHTML = window.demo_counter
     count_id.style["font-size"] = demo_counter + "px"
 }
 else if (vals.clicked_button_value == "Done"){   // When a 'submit' button is clicked, its 'value' can be used as its name.
     out("outta here at: " + window.demo_counter) // Last thing printed to the Output pane.
 }
}\n` +
'show_window({\n' +
'    content:\n' +
'`<input type="button" value="Count"/> <!-- Regular button. Does not close window.-->\n' +
' <span  name="count_display" id="count_id">10</span><br/><br/>\n' +
' <input type="submit" value="Done"/>`, // submit button closes window\n' +
'    callback: count_up})      // This function called when either button is clicked.\n'
)} //done with window buttons

                 window_sliders_id.onclick=function(){Editor.insert(
 `function handle_cb(vals){
     if(vals.clicked_button_value === "slide_fast"){
         out("slide_fast: " + vals.slide_fast, "green", true)
     }
     else if(vals.clicked_button_value === "slide_medium"){
         out("slide_medium: " + vals.slide_medium, "green", true)
     }
     else if(vals.clicked_button_value === "submit_slow") {
         out("slide_slow: " + vals.slide_slow)
     }
 }

 show_window({title: "show_window sliders demo",
              content: "Fast:   0<input name='slide_fast'   type='range' min='0', max='100' data-oninput='true'/>100<br/>" +
                       "Medium: 0<input name='slide_medium' type='range' min='0', max='100' data-onchange='true'/>100<br/>" +
                       "Slow:   0<input name='slide_slow'   type='range' min='0', max='10'  step='0.1' />10<br/>" +
                      "<input type='button' value='submit_slow'> </input>",
              height: 130,
              callback: handle_cb})`
 )}


 let show_window_menu_body =
 `Choose:
 <div class="menu" style="display:inline-block;">
    <ul>
       <li>TopMenu&#9660;
         <ul>
           <li title="this is a tooltip">item1</li>
           <li data-name="ITEM two">item2</li> <!-- if there's a data-name, use it, otherwise use the innerHTML-->
           <li>SubMenu
             <ul>
               <li>sub1</li>
               <li>sub2</li>
             </ul>
           </li>
         </ul>
       </li>
     </ul>
 </div>
 <span  name="menu_choice">pick menu item</span><br/><br/>
 <input type="submit" value="Done"/>`

    window_menu_id.onclick=function(){Editor.insert(
 `//show_window   Menu example
 //Called whenever user chooses a menu item or clicks a button.
 function menu_choice_cb(vals){
         if (vals.clicked_button_value != "Done"){ // True when menu item chosen.
             var clicked_item = vals.clicked_button_value
             out("You picked: " + clicked_item)
         }
 }

 show_window({content: ` + "`" + show_window_menu_body + "`," +
 ` // submit closes window
         callback: menu_choice_cb // Called when menu item or button is clicked
         })
 `)}

 window_many_inputs_id.onclick=function(){Editor.insert(
 `//show_window   Many Inputs Example.
 //show_vals called only when a button is clicked.
 function show_vals(vals){ inspect(vals) }

 show_window(
     {content:\n` +
 "`" +
 `text: <input type="text" name="my_text" value="Dexter"><br/><br/>
 textarea: <textarea name="my_textarea">Hi Rez</textarea><br/><br/>
 checkbox: <input name="my_checkbox" type="checkbox" checked="checked"/>heated bed?<br/><br/>
 <!-- you can add the checked="checked" attribute to make it initially checked. -->
 radio:
 <input type="radio" name="my_radio_group" value="abs" />ABS
 <input type="radio" name="my_radio_group" value="carbon"/>Carbon Fiber
 <input type="radio" name="my_radio_group" value="pla" checked="checked"/>PLA<br/><br/>
     <!-- At most, only 1 radio button can be checked. If none are checked,
          the return value for the group will be undefined . -->
 number: <input type="number" name="my_number" value="0.4" min="0" max="1" step="0.2"/><br/>
 range:  <input type="range"  name="my_range"  value="33"  min="0" max="100"/><br/>
 color:  <input type="color"  name="my_color"  value="#00FF88"/><br/>
 date:   <input type="date"   name="my_date"   value="2017-01-20"/><br/>
 select: <select name="size">
     <option>Gihugeic</option>
     <option selected="selected">Ginormace</option> <!--the inital value-->
     <option>Gilossal</option>
 </select><br/>
 combo_box: <div id="my_combo_box" class="combo_box" style="display:inline-block;vertical-align:middle;"> <!-- Can't use 'name' attribute. Must use 'id'. -->
         <option>one</option>
         <option selected="selected">two</option>
 </div><br/>
 file:   <input type="file" name="my_file"/><br/><br/>
 button: <input type="button" value="Show settings"/><br/><br/>
 submit: <input type="submit" value="OK"/>` + "`" +
 ',\n     width:380, height:450, title:"Printer Config", x:100, y:100,\n     callback: show_vals})\n')}

//______window_onchange_____________________
    var window_onchange_top_comments =
`/* show_window   onchange calls
    In most uses of show_window, its callback is called only
    when an input of type 'submit' or 'button' is clicked. 
    But you CAN have the callback called whenever the value
    of an input element changes. 
   
    An HTML property of data-onchange='true' will cause the 
    callback method to be called for an element when
    you change its value and select another elememt.
   
    An HTML property of data-oninput='true' causes the
    callback to be called as soon as a new value is entered.
    For input type="text" this is upon each character entered.
    For input type="radio" this is when any radio button in
    the group is clicked on.
    For select menus, this is when the value is changed.
    For input type="range" (sliders) this is upon every
    little move of the slider.
   
    The value of the "clicked_button_value" property of the
    object passed to the callback will be the 'name' of the
    changed input element, even though "clicked_button_value" 
    implies the 'value' of a 'button'.
   
    To see all this behavior, click the Eval button and play 
    with the controls in the window that pops up.
    Carefully observe the values printed in the output pane.
 */
`
var window_onchange_content =
`Text input with <samp>data-onchange='true'</samp> calls the callback<br/>
    when user clicks on another input.<br/>
    <input type="text"  name="my_onchange_text"  value="33"  min="0" max="100"
    data-onchange='true'/>
        <hr/>
        Text input with <samp>data-oninput='true'</samp> calls the callback<br/>
        after each keystroke entering text.<br/>
    <input type="text" name="my_oninput_text" value="33"  min="0" max="100"
    data-oninput='true'/>
        <hr/>

        Range "slider" with <samp>data-onchange='true'</samp> calls the callback<br/>
        after user stops moving the slider.<br/>
    <input type="range"  name="my_onchange_range"  value="33"  min="0" max="100"
    data-onchange='true'/><br/>
        <hr/>
        Range "slider" with <samp>data-oninput='true'</samp> calls the callback<br/>
        often as user moves the slider.<br/>
    <input type="range"  name="my_oninput_range"  value="33"  min="0" max="100"
    data-oninput='true'/>
        <hr/>      
        Radio button group input with each input having<br/>
        <samp>data-onchange='true'</samp> calls the callback<br/>
        whenever a radio button is clicked.<br/>
    <input type="radio" name="my_radio_group" value="abs"    data-onchange="true"/>ABS
        <input type="radio" name="my_radio_group" value="carbon" data-onchange="true"/>Carbon Fiber
    <input type="radio" name="my_radio_group" value="pla"    data-onchange="true" checked="checked"/>PLA
`

    window_onchange_id.onclick = function(){Editor.insert(
            window_onchange_top_comments +
`function the_cb(vals){ //vals contains name-value pairs for each input
     out(vals.clicked_button_value + " = " +
         vals[vals.clicked_button_value])
}
show_window({content:
    `       + "`" +
            window_onchange_content + "`" +
`,           title: "show_window onchange & oninput",
             width: 440, height: 440, x: 500, y: 100,
             callback: the_cb})
    ` )}

    window_svg_id.onclick=function(){Editor.insert(
`//SVG Example 1: lots of shapes
function handle1(arg) {
    if((arg.clicked_button_value === "background_id") ||
       (arg.clicked_button_value === "svg_id")) {
        SW.append_in_ui("svg_id", svg_circle({cx: arg.offsetX, cy: arg.offsetY, r: 7}))
    }
    else if (arg.clicked_button_value === "circ_id") {
        out("clicked on circ_id")
    }
    else if (arg.clicked_button_value === "ellip_id") {
        out("The user clicked on ellip_id")
    }
}

show_window({
    title: "SVG Example 1: Lots of shapes. Click to interact",
    content: svg_svg({id: "svg_id", height: 300, width: 500, html_class: "clickable", child_elements:
       [//svg_rect({id: "background_id", html_class: "clickable", style:"position: relative; top: 0; right: 0; x: 0, y: 0, width: 500, height: 500, color: "white", border_width: 3, border_color: "yellow"}),
        svg_circle({id: "circ_id", html_class: "clickable", cx: 20, cy: 20, r: 30, color: "purple"}),
        svg_ellipse({id: "ellip_id", html_class: "clickable", cx: 270, cy: 50, rx: 60, ry: 30, color: "orange"}),
        svg_line({x1: 30, y1: 30, x2: 100, y2: 200, color: "blue", width: 5}),
        svg_rect({x: 50, y: 50, width: 40, height: 100, color: "green", border_width: 3, border_color: "yellow", rx: 20, ry: 5}),
        svg_polygon({points: [[400, 10], [500, 10], [450, 100]], color: "lime", border_width: 3, border_color: "yellow"}),
        svg_polyline({points: [[400, 100], [480, 100], [450, 200], [480, 250]], color: "brown", width: 10}),
        svg_text({text: "this is a really long string", x: 50, y: 50, size: 30, color: "red", border_width: 2, border_color: "black", style: 'font-weight:bold;'}),
        svg_html({html: "<i style='font-size:30px;'>yikes</i>", x: 60, y: 100})
                      ]}),
    width: 610,  // window width
    height: 200, // window height
    x: 0,        // Distance from left of DDE window to this window's left
    y: 100,      // Distance from top  of DDE window to this window's top
    callback: handle1
})

//SVG Example 2: draw circle then move it to clicked position.
function handle2 (vals){
    if(window.c_id) {
        set_in_ui("c_id.cx", vals.offsetX)
        set_in_ui("c_id.cy", vals.offsetY)
    }
    else {
        SW.append_in_ui(
            "s2_id",
            svg_circle({id: "c_id", cx: vals.offsetX, cy: vals.offsetY,
                        r: 15, color: "blue"}))
  }
}

show_window({
    title: "SVG Example 2: Click to draw and move circle",
    content: svg_svg({id: "s2_id", width: 600, height: 200, html_class: "clickable"}),
    x: 0,
    y: 330,
    width: 600,
    height: 200,
    callback: handle2
})

//SVG Example 3: draw line segments
var linex = null
var liney = null
function handle3 (vals){
    if(linex) {
        SW.append_in_ui(
            "s3_id",
            svg_line({x1: linex, y1: liney, x2: vals.offsetX, y2: vals.offsetY}))
    }
   else {
       SW.append_in_ui(
           "s3_id",
           svg_circle({cx: vals.offsetX, cy: vals.offsetY,
                       r: 5, color: "blue"}))
   }
   linex = vals.offsetX
   liney = vals.offsetY
}

show_window({
    title: "SVG Example 3: Click to draw lines",
    content: svg_svg({id: "s3_id", width: 400, height: 350, html_class: "clickable",
                      child_elements: [
                          svg_rect({x: 100, y: 100, width: 200, height: 50, color: "yellow"})
           ]}),
    width: 470, x: 620, y: 100,
    callback: handle3
})
`)}

window_modify_id.onclick=function(){Editor.insert(
    `function modify_window_cb(vals){
       let color = "rgb(" + Math.round(Math.random() * 255) + "," +
                            Math.round(Math.random() * 255) + "," +
                            Math.round(Math.random() * 255) + ")"
       SW.selector_set_in_ui("#" + vals.show_window_elt_id + " [name=the_in] [style] [background]",
                          color
                          )
       SW.selector_set_in_ui("#" + vals.show_window_elt_id + " [name=the_in] [afterend]",
                          "<br/>" + color)
    }

    show_window({title: "Modify Window",
                 x:300, y:20, width:300, height:200,
                 callback: modify_window_cb,
                 content: '<input type="button" name="the_in" value="click to colorize"/>'
      })
    `
        )}

   // build_window_id.onclick=ab.launch //todo dde4 revive this?

    opencv_gray_id.onclick=function(){
        const code = read_file(__dirname + "/examples/opencv_gray.js")
        Editor.insert(code)
    }
    opencv_blur_id.onclick=function(){
        const code = read_file(__dirname + "/examples/opencv_blur.js")
        Editor.insert(code)
    }

    opencv_in_range_id.onclick=function(){
        const code = read_file(__dirname + "/examples/opencv_in_range.js")
        Editor.insert(code)
    }

    opencv_blob_detector_id.onclick=function(){
        const code = read_file(__dirname + "/examples/opencv_blob_detector.js")
        Editor.insert(code)
        DocCode.open_doc("Picture.detect_blobs_doc_id")
    }

    opencv_process_webcam_id.onclick=function(){
        const code = read_file(__dirname + "/examples/opencv_process_webcam.js")
        Editor.insert(code)
    }

    opencv_face_reco_id.onclick=function(){
        const code = read_file(__dirname + "/examples/opencv_face_reco.js")
        Editor.insert(code)
    }

    opencv_locate_object_id.onclick=function(){
        const code = read_file(__dirname + "/examples/opencv_locate_object.js")
        Editor.insert(code)
        DocCode.open_doc("Picture.locate_object_doc_id")
    }

    opencv_picture_similarity_id.onclick=function(){
        const code = read_file(__dirname + "/examples/opencv_picture_similarity.js")
        Editor.insert(code)
        DocCode.open_doc("Picture.mats_similarity_by_color_doc_id")
    }

    window_close_all_id.onclick=function(){ SW.close_all_show_windows() }

    machine_vision_help_id.onclick = function(){DocCode.open_doc(machine_vision_doc_id)}

        show_page_id.onclick=function(){
            Editor.wrap_around_selection('show_page(', ')\n', '"hdrobotic.com"')
            DocCode.open_doc(show_page_doc_id)}

        get_page_id.onclick=function(){
                 DocCode.open_doc(get_page_doc_id)
                 Editor.insert('get_page("http://www.ibm.com")')
        }

        beep_id.onclick = function(){
              Editor.insert("beep()\n")
              DocCode.open_doc(beep_doc_id)}
        beep_options_id.onclick = function(){Editor.insert(
    `beep({
        dur: 0.5,  //the default,,
        frequency: 440, //the default, in Hertz. This is A above middle C.
        volume: 1,      //the default, 0 to 1
        waveform: "triangle", //the default, other choices: "sine", "square", "sawtooth"
        callback: function(){beep({frequency: 493.88})} //default=null, run at end of the beep
        })
    `
        )}
        beeps_id.onclick = function(){
            DocCode.open_doc(beeps_doc_id)
           Editor.insert(
    `beeps(3, //default=1. number of times to beep using the default beep.
          function(){speak({speak_data: "Third Floor, home robots"})}) //default=null. callback when done
    `)}
        speak_id.onclick=function(){
            DocCode.open_doc(speak_doc_id)
            Editor.wrap_around_selection(
            "speak({speak_data: ", "})\n", '"Hello Dexter"')}

        speak_options_id.onclick=function(){Editor.wrap_around_selection(
    `speak({
        speak_data: ` , //default="hello"  can be a string, number, boolean, date, array, etc.
    `,\n    volume: 1.0,   //default=1.0   0 to 1.0,
        rate: 1.0,     //default=1.0   0.1 to 10,
        pitch: 1.0,    //default=1.0   0 to 2,
        lang: "en-US", //default="en-US"
        voice: 0,      //default=0     0, 1, 2, or 3
        callback: function(event) {out('Dur in nsecs: ' + event.elapsedTime)}  //default=null  called when speech is done.
    })\n`, '[true, "It is", new Date()]'
            )
            DocCode.open_doc(speak_doc_id)}
        //recognize_speech_id.onclick = function(){Editor.insert(
    //`recognize_speech(
    //    {prompt: "Say something funny.", //Instructions shown to the speaker. Default "".
    //     click_to_talk: false,           //If false, speech recognition starts immediately. Default true.
    //     only_once: false,               //If false, more than one phrase (after pauses) can be recognized. Default true.
    //     phrase_callback: undefined,     //Passed text and confidence score when user pauses. Default (undefined) prints text and confidence. If only_once=true, only this callback is called.
    //     finish_phrase: "finish",        //Say this to end speech reco when only_once=false.
    //     finish_callback: out})          //Passed array of arrays of text and confidence when user says "finish". Default null.
    //`)}

       music_help_id.onclick=function(){ DocCode.open_doc(music_with_midi_doc_id) }
       phrase_examples_id.onclick=function(){
           const code = read_file(__dirname + "/music/phrase_examples.js")
           Editor.insert(code)
       }
       midi_init_id.onclick = Midi.init

      //eval_and_start_button_id.onclick = eval_and_start

       make_dictionary_id.onclick=function(){
           const code = read_file(__dirname + "/examples/make_dictionary.js")
           Editor.insert(code)
       }
       nat_lang_reasoning_id.onclick=function(){
           const code = read_file(__dirname + "/examples/nat_lang_reasoning.js")
           Editor.insert(code)
       }


       ez_teach_id.onclick=function(){
           Editor.edit_new_file()
           Editor.insert(read_file(__dirname + "/user_tools/ezTeach_template.js"))
           DocCode.open_doc(ez_teach_doc_id)
       }

       jobs_help_id.onclick          = function(){ DocCode.open_doc(Job_doc_id) }
       //start_job_id.onclick        = Job.start_job_menu_item_action
       //start_job_help_id.onclick = function(){ DocCode.open_doc(start_job_help_doc_id) } //nw help is simply under theh Output pane help, and users see it by clicking on the "Output" pane title.

       test_suites_help_id.onclick = function(){ DocCode.open_doc(TestSuite_doc_id) }

       insert_all_test_suites_id.onclick  = function(){TestSuite.insert_all()}

        run_all_test_suites_id.onclick     = function(){TestSuite.run_all()}
       // show_all_test_suites_id.onclick  = function(){TestSuite.show_all()}  //functionality obtained with Find and no selection
        run_test_suite_file_id.onclick     =  TestSuite.run_ts_in_file_ui

       //obsoleted by increased functionality in doc pane Find button. find_test_suites_id.onclick        = function(){TestSuite.find_test_suites(Editor.get_any_selection())}
       selection_to_test_id.onclick=function(){
          TestSuite.selection_to_test(Editor.get_javascript(true), Editor.get_javascript(), Editor.selection_start())
          }
       show_suite_statistics_id.onclick=TestSuite.statistics
       insert_test_suite_example_id.onclick=function(){
                       Editor.insert( //below the same as the first test suite in the main test suites except that
                                              //its name is different so that the "summary" doesn't subtract the
                                              //usual 2 unknown failures and thus the summary of runnign this
                                              //will be consistent with the errors it shows.
           `new TestSuite(
               "example_test_suite",
               ["2 + 3", "5", "1st elt (source) evals to same as 2nd elt (expected) and the test passes."],
               ['similar(2.05, 2, 0.1)', "true", "tolerance of 0.1 permits 2.05 and 2 to be similar"],
               ["var foo = 4 + 1"],
               ["foo", "5", "The side effect of the above 'set up' test, sets foo. Foo's value is tested here."],
               ['"hi" + " dexter"', '"hi dex"', "known failures are declared with this description string starting with 'known'."],
               ['foo961', '123', "This is an 'unknown failure' for demo purposes"],
               ['foo723', 'TestSuite.error', 'Tests with expected of TestSuite.error pass if the source errors.'],
               ['out(TestSuite.run("similarX"))', 'TestSuite.dont_care', "Run another test suite. This one errors because its not defined."]
           )
           `, null, true)}
               //TestSuite.make_suites_menu_items() //because the ones that are defined from TestSuite.js can't make their menu items until dom is ready

               //Learn Javascript menu
               learn_js_help_id.onclick = function (){DocCode.open_doc(learning_js_doc_id)}
                 // Debugging menu
    dev_tools_id.onclick      = function(){show_window({content:
                    "To see the output of <code>console.log</code> calls,<br/>" +
                    "and for using the <code>debugger</code> breakpoint,<br/>" +
                    "you must first open <i>Chrome Dev Tools</i> by:<br/>" +
                    "clicking right anywhere and choosing <b>Inspect</b>.<p/>" +
                    "Note: The <b>out</b> call is more useful in most cases than <code>console.log</code>. " +
                    "It doesn't require <i>Chrome Dev Tools</i>.<br/>See <button>Insert&#9660;</button> <i>Print to output</i>.<br/><br/>" +
                    "There's more help in the Documentation pane under <b>Debugging</b>.",
                    title: "Debugging Help", width:430, height:270});
                    DocCode.open_doc(debugging_id)
                    //WORKS! 800 is milliseconds for the animation to take.
                    //$('#doc_contents_id').animate({scrollTop: $('#d ebugging_id').offset().top}, 800); //jquery solution that fails.
                    //d ebugging_id.scrollIntoView(true) //does so instantaneously but it at least works.
                    //However, it causes the DDE header to scroll off the top of the window
                    //and a user can't get it back. If the user has not expanded any triangles
                    //in the doc pane, then NOT calling scrollIntoView is fine, but if they have.
                    //they likely won't see the Debugging content. Probably an interaction between
                    //this new HTML5 stuff and jqwidgets
                    // the below fail.
                                                 //poitions the top of the elt at the top of the pane, which is good.
                   //d ebugging_id.scrollIntoView({behavior:"smooth"});//doesn't  smooth scroll in chrome
                   //$("#d ebugging_id").parent().animate({scrollTop: $("#debugging_id").offset().top}, 1000) //doesn't work
                    } //fails: window.open("chrome://inspect/#apps")
    console_log_id.onclick     = function(){Editor.wrap_around_selection("console.log(", ")", '"Hello"')}

    step_instructions_id.onclick = function(){
                   DocCode.open_doc("Control.step_instructions_doc_id")
                   let cursor_pos = Editor.selection_start()
                   let src = Editor.get_javascript()
                   let prev_char = ((cursor_pos == 0) ? null : src[cursor_pos - 1])
                   let prefix
                   if (Editor.selection_start() == 0)     {prefix = ""}
                   else if ("[, \n]".includes(prev_char)) {prefix = ""}
                   else                                   {prefix = ","}
                   Editor.insert(prefix + 'Control.step_instructions(),nnll') //ok if have comma after last list item in new JS.
               }

    debugger_id.onclick        = function(){Editor.insert("debugger;nnll")} ////LEAVE THIS IN RELEASED CODE

    debugger_instruction_id.onclick = function(){
            DocCode.open_doc("Control.debugger_doc_id")
            let cursor_pos = Editor.selection_start()
            let src = Editor.get_javascript()
            let prev_char = ((cursor_pos == 0) ? null : src[cursor_pos - 1])
            let prefix
            if (Editor.selection_start() == 0)     {prefix = ""}
            else if ("[, \n]".includes(prev_char)) {prefix = ""}
            else                                   {prefix = ","}
            Editor.insert(prefix + 'Control.debugger(),nnll') //ok if have comma after last list item in new JS.
       }

       comment_out_id.onclick     = function(){Editor.wrap_around_selection("/*", "*/")}
       comment_eol_id.onclick     = function(){Editor.insert("//")}
         //true & false menu
       true_id.onclick          = function(){Editor.insert(" true ")}
       false_id.onclick         = function(){Editor.insert(" false ")}
       and_id.onclick           = function(){Editor.insert(" && ")}
       or_id.onclick            = function(){Editor.insert(" || ")}
       not_id.onclick           = function(){Editor.insert("!")}

         //Math menu
       math_example_id.onclick = function(){Editor.insert("(-1.75 + 3) * 2\n")}
       plus_id.onclick         = function(){Editor.insert("+")}
       minus_id.onclick        = function(){Editor.insert("-")}
       times_id.onclick        = function(){Editor.insert("*")}
       divide_id.onclick       = function(){Editor.insert("/")}
       pi_id.onclick           = function(){Editor.insert("Math.PI")}
       parens_id.onclick       = function(){Editor.wrap_around_selection("(", ")")}

          //Compare Numbers menu
       compare_example_id.onclick = function(){Editor.insert("Math.PI >= 3\n")}
       less_id.onclick            = function(){Editor.insert("<")}
       less_or_equal_id.onclick   = function(){Editor.insert("<=")}
       equal_id.onclick           = function(){Editor.insert("==")}
       more_or_equal_id.onclick   = function(){Editor.insert(">=")}
       more_id.onclick            = function(){Editor.insert(">")}
       not_equal_id.onclick       = function(){Editor.insert("!=")}

          //Strings menu
       double_quote_id.onclick   = function(){Editor.wrap_around_selection('"', '"')}
       single_quote_id.onclick   = function(){Editor.wrap_around_selection("'", "'")}
       back_quote_id.onclick     = function(){Editor.wrap_around_selection('`', '`')}
       add_strings_id.onclick    = function(){Editor.insert("+")}

       string_length_id.onclick  = function(){Editor.insert(".length")}
       get_char_id.onclick       = function(){Editor.insert("[0]")}
       slice_id.onclick          = function(){Editor.insert(".slice(0, 3)")}
       split_id.onclick          = function(){Editor.insert('.split(" ")')}
       string_equal_id.onclick   = function(){Editor.insert('==')}
       starts_with_id.onclick    = function(){Editor.insert('.startsWith("ab")')}
       ends_with_id.onclick      = function(){Editor.insert('.endsWith("yz")')}
       replace_string_id.onclick = function(){Editor.insert('.replace(/ab/g, "AB")')}

          //Arrays menu
       make_array_id.onclick         = function(){Editor.insert('[5, "ab", 2 + 2]')}
       array_length_id.onclick       = function(){Editor.insert('.length')}
       get_array_element_id.onclick  = function(){Editor.insert('[0]')}
       set_array_element_id.onclick  = function(){Editor.insert('[0] = 42')}
       push_array_element_id.onclick = function(){Editor.insert('.push(9)')}

       //DATE
       new_date_day_id.onclick       = function(){Editor.insert('new Date("' + new Date().toString().slice(4, 15) + '")')}
       new_date_time_id.onclick      = function(){Editor.insert('new Date("' + new Date().toString().slice(4, 24) + '")')}
       new_date_ms_id.onclick        = function(){Editor.insert('new Date(3000)')}
       date_now_id.onclick           = function(){Editor.insert('Date.now()')}
       date_valueOf_id.onclick       = function(){Editor.insert('new Date().valueOf()')}
       date_toString_id.onclick      = function(){Editor.insert('new Date().toString()')}
       duration_hms_id.onclick       = function(){Editor.insert('new Duration("01:14:05")')}
       duration_hmsms_id.onclick     = function(){Editor.insert('new Duration(1, 2, 5, 10)')}
       duration_get_ms_id.onclick    = function(){Editor.insert('new Duration(0, 0, 1, 500).milliseconds')}
         //Variables menu
       variable_examples_id.onclick = function(){Editor.insert('var foo = 5 //initialize variable\nfoo //evals to 5\nfoo = "2nd" + " " + "val" ///set existing variable to new value\nfoo //now evals to "2nd val"\n')}
       init_variable_id.onclick     = function(){Editor.insert('var foo = ')}
       set_variable_id.onclick      = function(){Editor.insert('=')}

           //JS Objects menu
       js_object_example_id.onclick = function(){
            Editor.insert(
              `var foo = {sam: 2, joe: 5 + 1} //make a JS object
              foo      //evals to the new object
              foo.sam  //evals to 2
              foo.joe  //evals to 6
              foo.joe = 99 //within foo, sets the value of joe to 99
              foo.joe  //now evals to 99
              foo["jo" + "e"] //compute the name to lookup. evals to 99
              foo["jo" + "e"] = "jones" //set computed name to new value
              foo.joe  //NOW evals to "jones"
              foo.ted = 3 / 2  //adds a new name:value pair to foo.
              foo //eval to see the latest values\n`)}
                      js_object_cheat_sheet_id.onclick = function(){show_window({content:
              `<pre>var foo = {sam: 2, joe: 5 + 1} //make a JS object
              foo      //evals to the new object
              foo.sam  //evals to 2
              foo.joe  //evals to 6
              foo.joe = 99    //within foo, sets the value of joe to 99
              foo.joe  //now evals to 99
              foo["jo" + "e"] //compute the name to lookup. evals to 99
              foo["jo" + "e"] = "jones" //set computed name to new value
              foo.joe         //NOW evals to "jones"
              foo.ted = 3 / 2 //adds a new name:value pair to foo.
              foo      //eval to see the latest values</pre>`,
                          title: "JavaScript Object Cheat Sheet",
                          width:  550,
                          height: 280,
                          x:      440,
                          y:      370})}

      // Control Flow menu
      if_single_armed_id.onclick = function(){Editor.wrap_around_selection('if (1 + 1 == 2) {\n    ', '\n}')}
      if_multi_armed_id.onclick  = function(){Editor.wrap_around_selection('if (1 + 1 == 2) {\n    ', '\n}\nelse if (2 + 2 == 4){\n    \n}\nelse {\n    \n}\n')}
      for_number_of_times_id.onclick    = function(){Editor.wrap_around_selection('for(let i = 0; i < 10; i++){\n', '\n}\n')}
      for_through_array_elts_id.onclick = function(){Editor.wrap_around_selection('for(let x of [7, 4, 6]){\n', '\n}\n')}
      try_id.onclick             = function(){Editor.wrap_around_selection('try{\n', '\n} catch(err){handle errors here}')}
      dde_error_id.onclick       = function(){Editor.wrap_around_selection('dde_error(', ')', '"busted!"')}
      setTimeout_id.onclick=function(){Editor.insert('setTimeout(function(){console.log("waited 3 seconds")}, 3000)nnll')}

      // Function menu
      function_example_id.onclick   = function(){Editor.insert("function my_add(a, b){ // define the function 'my_add'\n    var sum = a + b\n    return sum\n}\nmy_add(2, 3) // run my_add's code with a=2 and b=3\n")}
      named_function_id.onclick     = function(){Editor.wrap_around_selection('function foo(x, y) {\n', '\n}\n')}
      anonymous_function_id.onclick = function(){Editor.wrap_around_selection('function(x, y) {\n', '\n}\n')}
      return_id.onclick             = function(){Editor.insert("return ")}
      //End of Learn JS menu

      //series Menu
       units_system_help_id.onclick = function(){ DocCode.open_doc(units_system_help_doc_id) }

       //jobs menu
      show_robot_status_id.onclick   = RobotStatusDialog.show
      jobs_report_id.onclick         = function(){Job.report() }
      stop_all_jobs_id.onclick       = function(){
                                           Job.stop_all_jobs()
                                           if(!TestSuite.status) {
                                               TestSuite.immediate_stop = true
                                           }
                                       }
      undefine_jobs_id.onclick       = function(event){
          Job.clear_stopped_jobs()
          event.target.blur()
      } //use individual X (close) marks instead

      insert_new_job_id.onclick = Editor.insert_new_job
      Editor.set_menu_string(insert_new_job_id, "New Job", "j")

      eval_and_start_job_id.onclick = function(){
             DocCode.open_doc(eval_and_start_job_doc_id)
             Job.start_job_menu_item_action()
      }


      insert_job_example0_id.onclick = function(){Editor.insert(job_examples[0])}
      insert_job_example1_id.onclick = function(){Editor.insert(job_examples[1])}
      insert_job_example2_id.onclick = function(){Editor.insert(job_examples[2])}
      insert_job_example3_id.onclick = function(){Editor.insert(job_examples[3])}
      insert_job_example4_id.onclick = function(){Editor.insert(job_examples[4])}
      insert_job_example5_id.onclick = function(){Editor.insert(job_examples[5])}
      insert_job_example6_id.onclick = function(){Editor.insert(job_examples[6])}
      insert_job_example7_id.onclick = function(){Editor.insert(job_examples[7])}
      insert_job_example8_id.onclick = function(){Editor.insert(job_examples[8])}
      insert_job_example9_id.onclick = function(){Editor.insert(job_examples[9])}
      insert_job_example10_id.onclick = function(){Editor.insert(job_examples[10])}
      insert_job_example11_id.onclick = function(){Editor.insert(job_examples[11])}
      insert_job_example12_id.onclick = function(){Editor.insert(job_examples[12])}
      insert_job_example13_id.onclick = function(){Editor.insert(job_examples[13])
                                                   DocCode.open_doc("Control.loop_doc_id")}
      insert_job_example14_id.onclick = function(){Editor.insert(job_examples[14])}

          //RUN INSTRUCTION
      move_to_home_id.onclick    = function(){ Robot.dexter0.move_all_joints_fn() }
      move_to_neutral_id.onclick = function(){ Robot.dexter0.move_all_joints_fn(Dexter.NEUTRAL_ANGLES) }
      //move_to_parked_id.onclick  = function(){ Robot.dexter0.move_all_joints_fn(Dexter.PARKED_ANGLES) }  //not useful, sometimes Dexter runs into itself
      move_to_selection_id.onclick = Editor.move_to_instruction

      Editor.set_menu_string(move_to_selection_id, "selection", "r")

      run_instruction_dialog_id.onclick = run_instruction

      init_dxf_drawing_id.onclick = function(){
                          var content =
                  `DXF.init_drawing({
                      dxf_filepath: "choose_file",    //image to draw
                      three_points:
                          [[0,  .55, 0.05],  //Point1 locates the drawing plane
                           [0,   .4, 0.05],  //Point2
                           [.15, .4, 0.05]], //Point3
                      plane_normal_guess: [0, 0, 1],
                      calc_plane_normal: false,
                      tool_height: 5.08 * _cm,
                      tool_length: 8.255 * _cm,
                      DXF_units: undefined, //0.001 means each DXF distance unit is worth 1mm
                                            //undefined means scale drawing to fit the three_points
                      draw_speed:  1 * _cm/_s,
                      draw_res:  0.5 * _mm, //Max step size of straight line
                      lift_height: 1 * _cm, //distance above surface when pen is not drawing
                      tool_action: false,
                      tool_action_on_function:
                          function(){
                              return [make_ins("w", 64, 2),
                                      Dexter.dummy_move()]
                          },
                          tool_action_off_function:
                              function(){
                                  return [make_ins("w", 64, 0),
                                          Dexter.dummy_move()]
                          }})
                  `
          Editor.insert(content)
          DocCode.open_doc("DXF.init_drawing_doc_id")
      }

      //Jobs/Dexter Tools menu.
      browse_dexter_id.onclick     = function() {
          let url = "http://" + Dexter.default.ip_address
          browse_page(url)
      }
      calibrate_id.onclick         = function() { init_calibrate() }//defines 2 jobs and brings up calibrate dialog box

      dui2_id.onclick              = function() {
          //Job.define_and_start_job(__dirname + "/user_tools/dexter_user_interface2.js")
          dui2.make_job()
      }
      ping_dexter_id.onclick       = function() { ping_a_dexter(); DocCode.open_doc(ping_doc_id) }

      reboot_joints_id.onclick  = function(){
          DocCode.open_doc("Dexter.reboot_joints_doc_id")
          Dexter.default.reboot_joints_fn() //not an instruction, a function that creates a job and starts it
      }

      show_errors_log_id.onclick = function(){
          let path = "Dexter." + Dexter.default.name + ":/srv/samba/share/errors.log"
          read_file_async(path, undefined, function(err, data){
              if(err){
                  dde_error("While attempting to get the content of " + path + "<br>" + err.message)
              }
              else {
                  let content = data.toString()
                  out("The content of " + path + " is:<pre>" + content + "</pre>")
              }
          })
      }

   dexter_start_options_id.onclick = DexterUtils.show_dexter_start_options

      //update_firmware_id.onclick = FileTransfer.show_dialog //todo dde4 functionality needs to move to server

  run_job_on_dexter_id.onclick = function() {
      let job_src = Editor.get_any_selection() //we want to be able to select a Job def in
          //the doc pane and send it to Dexter.
      if(job_src == "") {
          job_src = Editor.get_javascript("auto") //the normal case, get the whole editor buffer
      }
      Job.start_and_monitor_dexter_job(job_src)
  }

  show_messaging_dialog_id.onclick = function(){
      Messaging.show_dialog()
      DocCode.open_doc("Messaging_id")
  }

  //cmd menu
  cd_up_id.onclick = function(){
      cmd_input_id.value = "cd .."
      SSH.run_command({command:"cd ..;echo 'The new current directory is: ';pwd"})
  }
  date_id.onclick = function(){
      cmd_input_id.value = "date"
      SSH.run_command({command:"date"})
  }
  ssh_find_id.onclick = function(){
      out("<i>SSH <b>find</b> from / takes about 10 seconds.<br/>" +
          "The <b>-iname</b> option makes <b>find</b> case-insensitive,<br/>" +
          "whereas <b>-name</b> makes it case-sensitive.</i>")
      cmd_input_id.value = 'find / -iname "*partial_file_name_here*" -print'
      cmd_input_id.focus()
  }
  make_directory_id.onclick = function(){
      cmd_input_id.value = "mkdir " + SSH.dir_for_ls + "/[new dir name]"
      cmd_input_id.focus()
  }
  make_file_id.onclick = function(){
          cmd_input_id.value = "touch " + SSH.dir_for_ls + "/[new file name]"
      cmd_input_id.focus()
  }
  man_id.onclick = function(){
      cmd_input_id.value = "man -P cat [cmd name]"
      cmd_input_id.focus()
  }
  pwd_id.onclick = function(){
      cmd_input_id.value = "pwd"
      SSH.run_command({command:"pwd"})
  }
  show_directory_id.onclick = function(){
      cmd_input_id.value = SSH.show_dir_cmd
      SSH.run_command({command:SSH.show_dir_cmd})
  }
  reboot_id.onclick = function() {
      cmd_input_id.value = "shutdown -r now"
      cmd_input_id.focus()
  }
  run_selected_cmd_id.onclick = function(){
      let cmds = Editor.get_javascript("auto").trim()
      if(cmds == ""){
          warning("There are no commands selected.")
      }
      else {
          let end_pos = cmds.indexOf(";")
          if (end_pos == -1) { end_pos = cmds.indexOf("\n") }
          else { end_pos = cmds.length }
          let cmd_to_show = cmds.substring(0, end_pos)
          cmd_input_id.value = cmd_to_show
          SSH.run_command({command:cmds})
      }
  }
  whoami_id.onclick = function(){
      cmd_input_id.value = "whoami"
      SSH.run_command({command:"whoami"})
  }

      //ping_id.onclick          = function(){ rde.ping()}
      //cat_etc_hosts_id.onclick = function(){ rde.shell('cat /etc/hosts')}
      //rosversion_id.onclick    = function(){ rde.shell('rosversion -d')}
      //roswtf_id.onclick        = function(){ rde.shell('roswtf')}
      //printenv_id.onclick      = function(){ rde.shell('printenv | grep ROS')}
      //rqt_graph_id.onclick     = function(){ rde.shell('rqt_graph')}

      //rosmsg_id.onclick        = function(){rde.shell('rosmsg list')}
      //rosnode_id.onclick       = function(){rde.shell('rosnode list')}
      //rospack_id.onclick       = function(){rde.shell('rospack list')}
      //rosparam_id.onclick      = function(){rde.shell('rosparam list')}
      //rosservice_is.onclick    = function(){rde.shell('rosservice list')}
      //rostopic_id.onclick      = function(){rde.shell('rostopic list')}

      clear_output_id.onclick  = function(){SW.clear_output(); Editor.myCodeMirror.focus()}

      javascript_pane_help_id.onclick    = function(){ DocCode.open_doc(javascript_pane_doc_id)  }
      output_pane_help_id.onclick        = function(){ DocCode.open_doc(output_pane_doc_id)  }
      documentation_pane_help_id.onclick = function(){ DocCode.open_doc(documentation_pane_doc_id)  }
      misc_pane_help_id.onclick          = function(){ DocCode.open_doc(misc_pane_doc_id)  }

      //simulate pane
      demo_id.onclick          = function() {
                                      if (demo_id.innerHTML == "Demo") {
                                          demo_id.innerHTML = "Stop"
                                          DDEVideo.show_in_misc_pane("Simulate Dexter")
                                          play_simulation_demo()
                                      }
                                      else {
                                          Simulate.sim.enable_rendering = false;
                                            demo_id.innerHTML = "Demo"
                                      }
                                 }
      inspect_dexter_details_id.onclick = function() { inspect(Dexter.default) }

      pause_id.onclick         = function (){
                                      if (pause_id.checked) { //it just got checked
                                             Job.go_button_state = false
                                      }
                                      else { Job.go_button_state = true }
                                   }
      go_id.onclick                 = Job.go

      show_queue_id.onclick = function() { Simqueue.show_queue_for_default_dexter() } //dde4 without the fn wrapper, errors when loading on Simqueue not defined, maybe due to the above import didn't complete before loading this code ???

       //misc_pane_menu_id.oninput            = DDEVideo.show_in_misc_pane
       let misc_items = ['Simulate Dexter',
                         'Make Instruction',
                         'Dexter Photo',
                         'Haddington Website',
                         'Dexter Architecture',
                         'Reference Manual',
                         'Choose File',
                         'Reward Board']
       $("#misc_pane_menu_id").jqxComboBox({ source: misc_items, width: '85%', height: '20px', dropDownHeight: '235px'});
       $('#misc_pane_menu_id').on('keypress', function (event) {
           if(event.code == "Enter"){
               var val = event.target.value
               DDEVideo.show_in_misc_pane(val)
           }
       })
       $('#misc_pane_menu_id').on('select', function (event) { //fired when user types a char, or chooses a menu item
           let args = event.args;
           if(args) {
               let item = $('#misc_pane_menu_id').jqxComboBox('getItem', args.index)
               if(item) {
                   let val = item.value
                   if(val && (val !== DDEVideo.misc_pane_menu_selection)) {
                       setTimeout(function() {
                           DDEVideo.show_in_misc_pane(val)
                       }, 100)
                   }
               }
           }
       })

      DDE_DB.init(on_ready_after_db_init)
         //persistent_initialize() //now performed by DDE_DB.init
         //called before loading dde_init.js by design.
         //Metrics.init() //now performed by DDE_DB.init

} //end of on_ready definition.
   function on_ready_after_db_init(){
         //set_dde_window_size_to_persistent_values() //todd dde4 (can work now) obsolete now that main.js does this

        let val = DDE_DB.persistent_get("save_on_eval")
        $("#save_on_eval_id").jqxCheckBox({ checked: val})

         //if(val) { //have to do this because, unlike the DOM doc, chrome/electron checks the box if you set it to false.
         //    save_on_eval_id.setAttribute("checked", val)
         //}
         //similar to animate ui
         save_on_eval_id.onclick = function(event){ //todo dde4 broken because when you click, get error due to css and image file for checkbox
             let val = $("#save_on_eval_id").val()
             DDE_DB.persistent_set("save_on_eval", val)
             event.stopPropagation() //causes menu to not shrink up, so you can see the effect of your click
         }

         save_on_eval_wrapper_id.onclick = function(event){
             let old_val = $("#save_on_eval_id").val()
             let new_val = !old_val
             $("#save_on_eval_id").val(new_val)
             DDE_DB.persistent_set("save_on_eval", new_val)
             event.stopPropagation()
         }

         val = DDE_DB.persistent_get("default_out_code")
         if(val) { //have to do this because, unlike the DOM doc, chrome/electron checks the box if you set it to false.
             format_as_code_id.setAttribute("checked", val)
         }
         format_as_code_id.onclick = function(event) {
                                         let val = format_as_code_id.checked
                                         DDE_DB.persistent_set("default_out_code", val)
         }

         //this must be before dde_init_dot_js_initialize() so that when a robot is defined, it can go on the menu
         default_robot_name_menu_container_id.innerHTML = DexterUtils.make_dexter_default_menu_html()

         //PatchDDE.init()  //todo dde4 needs file system


         //dde_init_dot_js_initialize()//todo dde4 needs file system  //must occcur after persistent_initialize
         // copy_file_async(__dirname + "/core/main_eval.py", "main_eval.py")//todo dde4 needs file system and python eval //because using __dirname + "/core/main_eval.py"
             // in 2nd arg to spawn fails because spawn can't get a file out of the asar "folder".
             //So I need to call spawn with a normal path when the Python process is launched.
             //do this here so it will be ready by the time Py.init needs it.
         Dexter.default = (Dexter.dexter0 ?  Dexter.dexter0 : null )
         //initialize the checkbox state
         $("#animate_ui_checkbox_id").jqxCheckBox({ checked: DDE_DB.persistent_get("animate_ui")})

         animate_ui_checkbox_id.onclick = function(event) {
             let val = $("#animate_ui_checkbox_id").val()
             DDE_DB.persistent_set("animate_ui", val)
             event.stopPropagation() //causes menu to not shrink up, so you can see the effect of your click
             //AND causes the onclick for simulate_id to NOT be run.
             adjust_animation()
         }
         //so that you don't have to hit the checkbox, just anywhere in the menu item to check/uncheck it
         animate_ui_checkbox_wrapper_id.onclick = function(event){
             let old_val = $("#animate_ui_checkbox_id").val()
             let new_val = !old_val
             $("#animate_ui_checkbox_id").val(new_val)
             DDE_DB.persistent_set("animate_ui", new_val)

             event.stopPropagation() //causes menu to not shrink up, so you can see the effect of your click
             //AND causes the onclick for simulate_id to NOT be run.
             adjust_animation()
         }
         adjust_animation()


         const editor_font_size = DDE_DB.persistent_get("editor_font_size") //17
         $(".CodeMirror").css("font-size", editor_font_size + "px")
         font_size_id.value = editor_font_size

         //font_size_id.onclick = function(){
         //  $(".CodeMirror").css("font-size", this.value + "px")
         //  DDE_DB.persistent_set("editor_font_size", this.value)
         //}
         font_size_id.onchange = function(){
              $(".CodeMirror").css("font-size", this.value + "px")
              DDE_DB.persistent_set("editor_font_size", this.value)
         }
         // $("#font_size_id").keyup(function(event){ //in dde3
         font_size_id.onkeyup = (function(event){ //for dde4 todo: dde4 test
           if(event.keyCode == 13){
               $(".CodeMirror").css("font-size", this.value + "px")
               DDE_DB.persistent_set("editor_font_size", this.value)
           }
         })


         //init_ros_id.onclick = function(){
         //         init_ros_service_if_url_changed()
         //} //must occur after dde_init_doc_js_initialize  init_ros_service($("#dexter_url").val())
         // rde.ping() //rde.shell("date") //will show an error message
         //Editor.restore_files_menu_paths_and_last_file() //todo dde4 needs file system
          //simulate_help_id.onclick=function(){ DocCode.open_doc(simulate_doc_id) }



         simulate_radio_true_id.onclick  = function(){ //todo dde4 needs file system
               DDE_DB.persistent_set("default_dexter_simulate", true);   event.stopPropagation()
          }
          simulate_radio_false_id.onclick = function(){ DDE_DB.persistent_set("default_dexter_simulate", false);  event.stopPropagation()}
          simulate_radio_both_id.onclick  = function(){ DDE_DB.persistent_set("default_dexter_simulate", "both"); event.stopPropagation()}

          const sim_val = DDE_DB.persistent_get("default_dexter_simulate")
          if      (sim_val === true)   { simulate_radio_true_id.checked  = true }
          else if (sim_val === false)  { simulate_radio_false_id.checked = true }
          else if (sim_val === "both") { simulate_radio_both_id.checked  = true }

          set_left_panel_width(DDE_DB.persistent_get("left_panel_width"))
          set_top_left_panel_height(DDE_DB.persistent_get("top_left_panel_height"))
          set_top_right_panel_height(DDE_DB.persistent_get("top_right_panel_height"))



          help_system_id.onclick = function(){
             //DocCode.open_doc(help_system_doc_id)
              SplashScreen.show()
          }
          //setTimeout(check_for_latest_release, 200) //todo dde4 this can *almost* work. but needs get_page_async, defined in storage, and nearly everything in that file needs the file system

          setTimeout(function() { SplashScreen.show_maybe() }, 400)
          DocCode.close_all_details() //doc pane just show top level items.
          setTimeout(function(){ //dde4 todo needs file system
              DDEVideo.show_in_misc_pane(DDE_DB.persistent_get("misc_pane_content"))
          }, 200)

} //end of on_ready

function set_left_panel_width(width=700){
    $('#outer_splitter_id').jqxSplitter({ panels: [{ size: width }], splitBarSize: 8 }) //default splitbarsize is 5
}

function set_top_left_panel_height(height=600){
    $('#left_splitter_id').jqxSplitter({ panels: [{ size: height }], splitBarSize: 8 })
}

function set_top_right_panel_height(height=600){
    //out("set top right:" + height)
    $('#right_splitter_id').jqxSplitter({ panels: [{ size: height }], splitBarSize: 8  })
}

function check_for_latest_release(){
    let dde_version_html = "<a href='#' title='Click to scroll the doc pane to the release notes.' onclick='DocCode.open_doc(release_notes_doc_id)'>" +
                            dde_version +
                            "</a>"
    latest_release_version_and_date(function(err, response, body){
        if(err){
            out("You're running DDE version: " + dde_version_html +
                " released: " + dde_release_date +
                "<br/>DDE can't reach the web to check for the latest release.")
        }
        else {
            const the_obj = JSON.parse(body)
            let ver       = the_obj.name
            if (ver.startsWith("v")) { ver = ver.substring(1) }
            var ver_date  = the_obj.published_at
            if (ver != dde_version){
                ver_date       = Utils.date_to_mmm_dd_yyyy(ver_date) //ver_date.substring(0, ver_date.indexOf("T"))
                out("The latest public beta version of DDE is: " + ver +
                        " released: " + ver_date +
                        "<div style='margin-left:135px;'>You're running version: " + dde_version_html +
                        " released: " + dde_release_date +
                        "</div><a href='#' onclick='DocCode.open_doc(update_doc_id)'>How to update.</a>",
                        "#900dff")
                //DocCode.open_doc(update_doc_id) //no real need to do this. user can already get to it
                //by clicking on the a tag in the above printout.
            }
            else { out("DDE is up to date with version: " + dde_version_html +
                        " released: " + dde_release_date)
            }
        }
    })
}

function make_dde_status_report(){
    let top = "Please describe your issue with DDE here:\n\n\n" +
              "__________________________________________________\n" +
              "Below are the contents of your Editor and Output panes\n"+
              "to help us with the context of your comment.\n" +
              "We won't use any software you send us without your permission,\n" +
              "but delete below whatever you want to protect or\n" +
              "what you think is not relevant to the issue."
    let jobs_report = Job.active_jobs_report() //ends with blank line
    let latest_eval_src = latest_eval_button_click_source
    if(!latest_eval_src) { latest_eval_src = "The Eval button hasn't been clicked since DDE was launched." }

    let editor_pane_content = Editor.get_javascript()

    let output = get_output()
    output = output.replace(/<br>/g, "\n")
    output = output.replace(/<p>/g,  "\n\n")
    output = output.replace(/<hr>/g, "_____________________________________\n")


    let result =
        "Dexter Development Environment Status Report\n" +
        "Date: " + Utils.date_to_human_string() + "\n" +
        "DDE Version: " + dde_version + "\n" +
        top +
        "\n\n________Active Jobs______________________________\n" +
        jobs_report +
        "\n\n________Latest Eval Button Click Source______________\n" +
        latest_eval_src +
        "\n\n________Editor Pane______________________________\n" +
        editor_pane_content +
        "\n\n________Output Pane_______________________________\n" +
        output
    return result
}

/* never called
function quit_dde(){
    require('electron').remote.getCurrentWindow().close()
} */

//misc fns called in ready.js
function email_bug_report(){
    subj = "DDE Suggestion " + Utils.date_to_human_string()
    bod = encodeURIComponent(make_dde_status_report())
    window.open("mailto:cfry@hdrobotic.com?subject=" + subj + "&body=" + bod)
}
console.log("bottom of ready.js")
on_ready()

/*
var {get_output} = require("./core/out.js")
//var {Root} = require("./core/object_system.js") //should work but doesn't jan 13, 2019
var {convert_backslashes_to_slashes} = require("./core/storage.js")
var Coor  = require("./math/Coor.js")
var calibrate_build_tables = require("./low_level_dexter/calibrate_build_tables.js")
var Job   = require("./core/job.js")
var Gcode = require("./core/gcode.js")
var DXF   = require("./math/DXF.js")
var {date_to_human_string, date_to_mmm_dd_yyyy, is_digit} = require("./core/utils.js")
var {FPGA} = require("./core/fpga.js")
var {Simqueue} = require("./core/simqueue.js")
*/

//packages for package sake.
//pkg names that contain hyphens or dots have those chars converted to underscore

//var fs = require("fs_path")  //already declared
//the below boosts DDE memory usage on startup from 88MB to 237MB
//mac activity monitor with this installed:
// electron         49 +
// electron helper  36 +
// electron helper 315
/*
var fs_path = require("fs-path")
var is_base64 = require("is-base64")
var js_beautify = require("js-beautify")
var mathjs = require("mathjs")
var modbus_serial = require("modbus-serial")
var multicast_dns = require("multicast-dns")
var nano_time = require("nano-time")
var opencv_js = require("opencv.js")
// var ping = require("ping")  //already declared
var plotly_js_dist = require("plotly.js-dist")
//var pump = require("pump")  //already declared
//var request = require("request")  //already declared
var scp2 = require("scp2")
var semver = require("semver")
var serialport = require("serialport")
var simple_get = require("simple-get")
var ssh2_promise = require("ssh2-promise")
*/
//var three = require("three") doesn't increase mem usable, is UI