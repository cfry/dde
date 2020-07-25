global.dde_version = "3.6.1"
global.dde_release_date = "Jul 24, 2020"

console.log("dde_version: " + global.dde_version + " dde_release_date: " + global.dde_release_date +
            "\nRead electron_dde/core/job_engine_doc.txt for how to use the Job Engine.\n")

console.log("in file: " + module.filename)
function node_on_ready() {
    console.log("top of node_on_ready\n")
    const os = require('os');
    global.operating_system = os.platform().toLowerCase() //for Ubuntu, ths returns "linux"

    if      (operating_system == "darwin")       { operating_system = "mac" }
    else if (operating_system.startsWith("win")) { operating_system = "win" }
    try{dde_apps_folder}
    catch(err){
        global.dde_apps_folder = "/srv/samba/share/dde_apps" //process.env.HOME //ie  /Users/Fry
                                                             //+ "/Documents/dde_apps"
    }
    //not needed for node version
    //var pckg         = require('../package.json');
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

    persistent_initialize()
    dde_init_dot_js_initialize()
    Job.class_init()
    Dexter.class_init()
    serial_port_init()
}

function run_node_command(args){
    console.log("top of run_node_command with: " + args)
    node_on_ready()

    let cmd_name = args[2]
    let fn = eval(cmd_name)
    let the_args = args.slice(3)
    console.log("cmd_name: " + cmd_name + " args: " + the_args)
    fn.apply(null, the_args)

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
const {exec} = require('child_process')

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

var {load_files, persistent_initialize, read_file, file_content, write_file, dde_init_dot_js_initialize} = require('./storage.js')
      //file_content is deprecated
var {Root} = require("./object_system.js")
var Coor   = require("../math/Coor.js")
var Kin    = require("../math/Kin.js")
var Vector = require("../math/Vector.js")
var {sind, cosd, tand, asind, acosd, atand, atan2d} = require("../math/Trig_in_Degrees.js")
var Job    = require("./job.js")

var {Robot, Brain, Dexter, Human, Serial}  = require("./robot.js")
var {RobotStatus} = require("./robot_status.js")
var {Instruction, make_ins, human_task_handler, human_enter_choice_handler,
    human_enter_filepath_handler, human_enter_number_handler, human_enter_position_handler,
    human_enter_instruction_handler,
    human_enter_text_handler,
    human_notify_handler,
    human_show_window_handler,
    } = require("./instruction.js")
var {Control} = require("./instruction_control.js")
var {IO}      = require("./instruction_io.js")
require("./je_and_browser_code.js") // must be before loading out.js as it defines SW used by out.js
var {beep, beeps, format_text_for_code, speak, show_window}  = require("./out.js")
var calibrate_build_tables = require("../low_level_dexter/calibrate_build_tables.js")
var DXF    = require("../math/DXF.js")
var {init_units} = require("./units.js")
var {FPGA} = require("./fpga.js")
var {SerialPort, serial_connect, serial_connect_low_level,
     serial_devices, serial_devices_async,
     serial_disconnect, serial_disconnect_all,  serial_flush,
     serial_get_or_make_port, serial_path_to_port_map,
     serial_path_to_info_map, serial_port_init, serial_send, serial_send_low_level} = require("./serial.js")

var {close_readline, set_keep_alive_value, write_to_stdout} = require("./stdio.js")

var {Messaging, MessStat} =  require("./messaging.js")
global.keep_alive_value = false
global.Brain    = Brain
global.Dexter   = Dexter
global.Human    = Human
global.Robot    = Robot
global.RobotStatus = RobotStatus
global.Serial   = Serial

global.make_ins = Dexter.make_ins

global.beep     = beep
global.beeps    = beeps
global.format_text_for_code = format_text_for_code
global.speak    = speak
global.show_window = show_window

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

global.read_file = read_file
global.file_content = file_content
global.write_file = write_file


global.close_readline = close_readline
global.set_keep_alive_value = set_keep_alive_value
global.write_to_stdout = write_to_stdout

global.SerialPort = SerialPort
global.serial_connect = serial_connect
global.serial_connect_low_level = serial_connect_low_level
global.serial_devices = serial_devices
global.serial_devices_async = serial_devices_async
global.serial_disconnect = serial_disconnect
global.serial_disconnect_all = serial_disconnect_all
global.serial_flush = serial_flush
global.serial_get_or_make_port = serial_get_or_make_port
global.serial_path_to_port_map = serial_path_to_port_map
global.serial_path_to_info_map = serial_path_to_info_map
global.serial_port_init = serial_port_init
global.serial_send = serial_send
global.serial_send_low_level = serial_send_low_level

run_node_command(process.argv)
/*
node core start_job myjob
node core define_and_start_job /Users/Fry/Documents/dde_apps/node_test_job.js
 */