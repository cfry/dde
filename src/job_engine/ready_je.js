console.log("top of ready_je.js")

import grpc from '@grpc/grpc-js'
globalThis.grpc = grpc
import protoLoader from '@grpc/proto-loader'
globalThis.protoLoader = protoLoader

import StripsManager from "strips" //can't load into browser since it needs "fs".
globalThis.StripsManager = StripsManager


//import fetch from 'node-fetch' //not part of node 16, but in 18 so need this
//to let job_engine call fetch used in DDEFile
//globalThis.fetch = fetch
//see https://stackabuse.com/making-http-requests-in-node-js-with-node-fetch/

import { WebSocketServer } from 'ws'; //websocket server
globalThis.WebSocketServer = WebSocketServer

import {init_job_engine, init_units, package_json} from "../job_engine/load_job_engine.js" //imports je files
import "../job_engine/core/stdio.js"   //ONLY in Job Engine so can't go in load_job_engine.js
         //makes global: close_readline, set_keep_alive_value, write_to_stdout
import "../job_engine/core/grpc_server.js" //only in Job Engine







function run_node_command(args){
    console.log("top of run_node_command with args:\n" + args)
    debugger;

    let cmd_name = args[2]
    //let fn = eval(cmd_name)
    let the_args = args.slice(3)
    //console.log("cmd_name: " + cmd_name + " args: " + the_args)
    //fn.apply(null, the_args)

    let cmd = cmd_name + "(\"" + the_args.join(", ") + "\");"
    console.log("Evaling: " + cmd)
    globalThis.eval(cmd)

}

function start_job(job_name){
    console.log("now starting Job: " + job_name)
    console.log(Job)
    let a_job = Job[job_name]
    if(a_job) { a_job.start() }
    else { console.log("can't find Job named: " + job_name) }
}

function define_and_start_job(job_file_path){
    debugger;
    if(job_file_path.endsWith("/keep_alive")) {
        globalThis.keep_alive_value = true //set to false by stdio readline evaling "globalThis.set_keep_alive_value(false)" made in httpd.mjs
        //and sent to job engine process stdin.
    }
    else {
        Job.define_and_start_job(job_file_path)
    }
}

globalThis.define_and_start_job = define_and_start_job //shouldn't be necessary for the eval in
   //run_node_command but apparently it is.

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



//beware, different def than in dde IDE
//see https://stackoverflow.com/questions/8683895/how-do-i-determine-the-current-operating-system-with-node-js
function set_operating_system() {
    console.log("top of set_operating_system with process: " + process)
    console.log("in set_operating_system with process.platform: " + process.platform)
    if      (process.platform === "win32")   { globalThis.operating_system="win"} //even 64 bit winos is called win32
    else if (process.platform === "darwin")  { console.log("found darwin"); globalThis.operating_system="mac"}
    else if (process.platform === "linux")   { globalThis.operating_system="linux"}
    else                                     { globalThis.operating_system=process.platform}
    console.log("bottom of set_operating_system globalThis.operating_system: " + globalThis.operating_system)
}

async function on_ready_je(){
    console.log("top of on_ready_je")
    console.log("Using node version: " + process.versions.node)
    set_operating_system()
    console.log("globalThis.operating_system is now: " + globalThis.operating_system)
    globalThis.platform = "node"
    console.log("init_job_engine: " + init_job_engine)
    await init_job_engine()

    //below 3 are same as on_ready. This must be after loading series, which is only for dde IDE,
    //so can't stick the below in the shared
    init_units() //In dde, has to be after init_series call.
    FPGA.init()  //does not depend on Series.
    Gcode.init() //must be after init_series which calls init_units()
    GrpcServer.init()
}
on_ready_je()

run_node_command(process.argv)

/* example runnning of Job engine to run a job:
node bundleje.mjs Job.define_and_start_job "/Users/Fry/Documents/dde_apps/just_prints.dde"

 */