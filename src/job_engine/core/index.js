global.dde_version = "3.8.0" //require("../package.json").version
global.dde_release_date = "Jul 23, 2021" //require("../package.json").release_date

// import os from 'os' //todo
//const {exec} = require('child_process') //todo //not an npm module.


console.log("dde_version: " + global.dde_version + " dde_release_date: " + global.dde_release_date +
            "\nRead electron_dde/core/job_engine_doc.txt for how to use the Job Engine.\n")

console.log("in file: " + module.filename)
function node_on_ready() {
    console.log("top of node_on_ready\n")
    global.operating_system = os.platform().toLowerCase() //for Ubuntu, ths returns "linux"

    if      (operating_system == "darwin")       { operating_system = "mac" }
    else if (operating_system.startsWith("win")) { operating_system = "win" }
    try{dde_apps_folder}
    catch(err){
        global.dde_apps_folder = "/srv/samba/share/dde_apps" //process.env.HOME //ie  /Users/Fry
                                                             //+ "/Documents/dde_apps"
    }
    //not needed for node version
    //global.dde_version      = pckg.version
    //global.dde_release_date = pckg.release_date
    global.platform  = "node" //"node" means we're in the job_engine, "dde" would mean we're not.
    global.Root      = Root
    global.window = global //window is needed in storage.js and elsewhere
    console.log("operating_system: " + operating_system + "\ndde_apps_folder: " + dde_apps_folder)
    FPGA.init() //does not depend on Series.
    Coor.init()
    init_units()
    //see also ready.js that has this same code
    Dexter.calibrate_build_tables  = calibrate_build_tables
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
    //new Dexter({name: "dexter0"})

    DDE_DB.init()
    dde_init_dot_js_initialize()
    Job.class_init()
    Dexter.class_init()
    serial_port_init()
}

function run_node_command(args){
    console.log("top of run_node_command with: " + args)
    node_on_ready()

    let cmd_name = args[2]
    //let fn = eval(cmd_name)
    let the_args = args.slice(3)
    //console.log("cmd_name: " + cmd_name + " args: " + the_args)
    //fn.apply(null, the_args)

    let cmd = cmd_name + "(\"" + the_args.join(", ") + "\");"
    console.log(cmd)
    eval(cmd)

}

function start_job(job_name){
    console.log("now starting Job: " + job_name)
    console.log(Job)
    let a_job = Job[job_name]
    if(a_job) { a_job.start() }
    else { console.log("can't find Job named: " + job_name) }
}

/*function define_and_start_job(job_file_path){
    console.log("top of define_and_start_job with: " + job_file_path)
    console.log("top of define_and_start_job with Job.job_id_base: " + Job.job_id_base)

    let starting_job_id_base = Job.job_id_base
    try { load_files(job_file_path)}
    catch(err){
       console.log("Could not find Job file: " + job_file_path + "  " + err.message)
       return
    }
    console.log("middle of define_and_start_job with new Job.job_id_base: " + Job.job_id_base)
    if(starting_job_id_base == Job.job_id_base){
       console.log("apparently there is no job definition in " + job_file_path)
    }
    else {
       let latest_job = Job.job_id_to_job_instance(Job.job_id_base)
       start_job(latest_job.name)
    }
}
*/
function define_and_start_job(job_file_path){
    if(job_file_path.endsWith("/keep_alive")) {
        global.keep_alive_value = true //set to false by stdio readline evaling "set_keep_alive_value(false)" made in httpd.js
                                       //and sent to job engine process stdin.
    }
    else {
        Job.define_and_start_job(job_file_path)
    }
}

//____________

function run_shell_cmd_default_cb (error, stdout, stderr){
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
}
//one useful option is cwd: dir_path_string
function run_shell_cmd(cmd_string, options={}, cb=run_shell_cmd_default_cb){
    exec(cmd_string, options, cb)
}

import {adjust_path_to_os, append_to_file,
    choose_file, choose_save_file, choose_file_and_get_content, choose_folder,
    copy_file_async, copy_folder_async,
    dde_init_dot_js_initialize, file_content, //file_content is deprecated
    file_exists, folder_listing, folder_separator, folder_name_version_extension,
    get_latest_path, get_page_async,
    is_folder, load_files,
    make_folder, make_full_path, make_unique_path,
    read_file, read_file_async, write_file, write_file_async} from './storage.js'

import {Root} from "./object_system.js"
import Coor   from "../math/Coor.js"
import Kin    from "../math/Kin.js"
import Vector from "../math/Vector.js"
import {sind, cosd, tand, asind, acosd, atand, atan2d} from "../math/Trig_in_Degrees.js"
import Job    from "./job.js"

import {Robot, Brain, Dexter, Human, Serial} from "./robot.js"
import {RobotStatus} from "./robot_status.js"
import "./instruction.js" /* makes global:
    Instruction,
    make_ins,
    human_task_handler,
    human_enter_choice_handler,
    human_enter_filepath_handler,
    human_enter_number_handler,
    human_enter_position_handler,
    human_enter_instruction_handler,
    human_enter_text_handler,
    human_notify_handler,
    human_show_window_handler
    */


import {Control} from "./instruction_control.js"
import {IO}      from "./instruction_io.js"
import "./je_and_browser_code.js" // must be before loading out.js as it defines SW used by out.js
// import {beep, beeps, format_text_for_code, speak, show_window}  from "./out.js" //all these are made global in dde4 inside out.js
import "./out.js"
import calibrate_build_tables from "../low_level_dexter/calibrate_build_tables.js"
import DXF    from "../math/DXF.js"
import {init_units} from "./units.js"
import {FPGA} from "./fpga.js"
import {convertArrayBufferToString, convertStringToArrayBuffer,
     SerialPort, serial_connect, serial_connect_low_level,
     serial_devices, serial_devices_async,
     serial_disconnect, serial_disconnect_all,  serial_flush,
     serial_get_or_make_port, serial_path_to_port_map,
     serial_port_path_to_info_map, serial_port_init, serial_send,
     serial_send_low_level} from "./serial.js"

//import {close_readline, set_keep_alive_value, write_to_stdout} from "./stdio.js" //todo imports readline which requires fs which errors

//import {html_db, is_dom_elt, make_dom_elt, make_html} from "./html_db.js" //now all global

import {Messaging, MessStat} from "./messaging.js"

import {Py} from "./py.js"

// see also je_and_browser_code.js for global vars.
global.keep_alive_value = false
global.Brain    = Brain
global.Dexter   = Dexter
global.Human    = Human
global.Robot    = Robot
global.RobotStatus = RobotStatus
global.Serial   = Serial

global.make_ins = Dexter.make_ins

global.Instruction = Instruction
global.human_task_handler = human_task_handler
global.human_enter_choice_handler = human_enter_choice_handler
global.human_enter_filepath_handler = human_enter_filepath_handler
global.human_enter_number_handler = human_enter_number_handler
global.human_enter_position_handler = human_enter_position_handler
global.human_enter_instruction_handler = human_enter_instruction_handler
global.human_enter_text_handler = human_enter_text_handler
global.human_notify_handler = human_notify_handler

global.human_show_window_handler = human_show_window_handler

global.Control  = Control
global.IO       = IO
global.Job      = Job
global.Vector   = Vector
global.Kin      = Kin
global.FPGA     = FPGA

global.sind     = sind
global.cosd     = cosd
global.tand     = tand
global.asind    = asind
global.acosd    = acosd
global.atand    = atand
global.atan2d   = atan2d

global.adjust_path_to_os = adjust_path_to_os
global.append_to_file = append_to_file
global.copy_file_async = copy_file_async
global.copy_folder_async = copy_folder_async
global.file_content = file_content //deprecated
global.file_exists = file_exists
global.folder_listing = folder_listing
global.folder_separator = folder_separator
global.folder_name_version_extension = folder_name_version_extension
global.get_latest_path = get_latest_path
global.get_page_async = get_page_async
global.is_folder = is_folder
global.load_files = load_files
global.make_unique_path = make_unique_path
global.make_folder = make_folder
global.read_file = read_file
global.write_file = write_file


/* had to not import stdio.js see above.
global.close_readline = close_readline
global.set_keep_alive_value = set_keep_alive_value
global.write_to_stdout = write_to_stdout
*/

global.convertArrayBufferToString = convertArrayBufferToString
global.convertStringToArrayBuffer = convertStringToArrayBuffer
global.SerialPort = SerialPort
global.serial_connect = serial_connect
global.serial_connect_low_level = serial_connect_low_level
global.serial_devices = serial_devices
global.serial_devices_async = serial_devices_async
global.serial_disconnect = serial_disconnect
global.serial_disconnect_all = serial_disconnect_all
global.serial_flush = serial_flush
global.serial_get_or_make_port = serial_get_or_make_port
global.serial_path_to_port_map = serial_path_to_port_map //depricated
global.serial_port_path_to_info_map = serial_port_path_to_info_map
global.serial_port_init = serial_port_init
global.serial_send = serial_send
global.serial_send_low_level = serial_send_low_level


global.Py = Py


run_node_command(process.argv)
/*
node core start_job myjob
node core define_and_start_job /Users/Fry/Documents/dde_apps/node_test_job.js
 */