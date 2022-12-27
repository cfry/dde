console.log("top of file: " + "core.index.mjs")
import "/Users/Fry/WebstormProjects/dde4/dde/build/bundle.mjs"
//global.dde_version = "4.0.0" //require("../package.json").version
//global.dde_release_date = "Mar 8, 2022" //require("../package.json").release_date

import os from 'os'
//const {exec} = require('child_process') //todo //not an npm module.


//console.log("dde_version: " + global.dde_version + " dde_release_date: " + global.dde_release_date +
//            "\nRead electron_dde/core/job_engine_doc.txt for how to use the Job Engine.\n")

import pckg from 'package.json'

function node_on_ready() {
    console.log("top of node_on_ready 3\n")
    console.log("os: " + os)
    //global.operating_system = os.platform().toLowerCase() //for Ubuntu, ths returns "linux"

    //if      (operating_system == "darwin")       { operating_system = "mac" }
    //else if (operating_system.startsWith("win")) { operating_system = "win" }
    try{dde_apps_folder}
    catch(err){
        global.dde_apps_folder = "/srv/samba/share/dde_apps" //process.env.HOME //ie  /Users/Fry
                                                             //+ "/Documents/dde_apps"
    }
    //not needed for node version
    //global.dde_version      = pckg.version //now in load_job_engine.js
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
    globalThis.calibrate_build_tables = undefined
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
    DDE_DB.dde_init_dot_js_initialize()
    Job.class_init()
    Dexter.class_init()
    //serial_port_init()
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
        globalThis.keep_alive_value = true //set to false by stdio readline evaling "globalThis.set_keep_alive_value(false)" made in httpd.mjs
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


run_node_command(process.argv)
/*
node core start_job myjob
node core define_and_start_job /Users/Fry/Documents/dde_apps/node_test_job.js
 */