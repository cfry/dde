console.log("Read electron_dde/core/job_engine_doc.txt for how to use the Job Engine.")

console.log("in file: " + module.filename)
function node_on_ready() {
    console.log("top of node_on_ready")
    const os = require('os');
    global.operating_system = os.platform().toLowerCase() //for Ubuntu, ths returns "linux"

    if      (operating_system == "darwin")       { operating_system = "mac" }
    else if (operating_system.startsWith("win")) { operating_system = "win" }
    try{dde_apps_dir}
    catch(err){
        global.dde_apps_dir = process.env.HOME //ie  /Users/Fry
            + "/Documents/dde_apps"
    }
    //not needed for node version
    //var pckg         = require('../package.json');
    //global.dde_version      = pckg.version
    //global.dde_release_date = pckg.release_date
    global.platform  = "node"
    global.Root      = Root
    global.window = global //window is needed in storage.js and elsewhere
    console.log("operating_system: " + operating_system + "\ndde_apps_dir: " + dde_apps_dir)
    Coor.init()
    //new Dexter({name: "dexter0"})

    persistent_initialize()
    dde_init_dot_js_initialize()
    Job.init()
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
    Job.define_and_start_job(job_file_path)
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
var {load_files, persistent_initialize, dde_init_dot_js_initialize} = require('./storage.js')
var {Root} = require("./object_system.js")
var Coor = require("../math/Coor.js")
var Job = require('./job.js')


run_node_command(process.argv)
/*
node core start_job myjob
node core define_and_start_job /Users/Fry/Documents/dde_apps/node_test_job.js


 */