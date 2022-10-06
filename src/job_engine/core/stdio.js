//see doc: https://nodejs.org/api/readline.html
//import {Job} from "./job.js" //now Job is global

import * as readline from "readline" // "../../../node_modules/readline/readline.js" //todo but readline.js does require("fs") and require is undefined.
globalThis.readline = readline //but since this file can ONLY be loaded in Job Engine, globalThis not accessible from DDE IDE

function set_keep_alive_value(new_val){
    globalThis.keep_alive_value = new_val //true or false
    let active_job_count = Job.active_jobs().length
    console.log("in set_keep_alive_value with active_job_count: " + active_job_count +
                " and new_val: " + new_val)
    if((!new_val) && (active_job_count === 0)){
        globalThis.close_readline() //but this doesn't end the process so call:
        process.exit(0)  //https://stackabuse.com/how-to-exit-in-node-js/
    }
}

globalThis.set_keep_alive_value = set_keep_alive_value

//https://stackoverflow.com/questions/4976466/difference-between-process-stdout-write-and-console-log-in-node-js
function write_to_stdout(str){
    if(!str) {}
    else if(str.trim() == "") {} //do nothing
    else {
        //if(str.startsWith("<for_server>")){
          //console.log("write_to_stdout got: " + str)
        //}
        //console.log("write_to_stdout writing: " + str)
        process.stdout.write(str) //"<br/>" + str) //same as console.log ???
    }
}

globalThis.write_to_stdout = write_to_stdout

function close_readline(){
    console.log("top of job engine node stdio.js close_readline") //even wit the setTimeout,
    //I still don't see this print statement come to the JE browser interface Out pane.
    setTimeout( function() {
        rl.close()
    }, 1000)
}

globalThis.close_readline = close_readline

var rl
function init_readline() {
    console.log("top of init_readline")
    if (rl) {
        console.log("init_readline: already open")
    } else {
        console.log("init_readline: now opening")
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })
        //examples of input:
        // 'Job.myJob.stop_for_reason("interrupted", "user stopped the job")'
        // 'Job.define_and_start_job("/srv/samba/share/dde_apps/myjob.js")'
        // 'Job.myjob.color_job_button()'
        // 'Job.myjob.server_job_button_click()'
        rl.on('line', function (input) {
            console.log("<br/>stdin got line: " + input)
            out("(out call) stdin got line: " + input + "\n")
            console.log("eval returns: ", eval(input))
        })
        rl.on('close', function () { // can't find a rl.is_open() method or prop so this will have to do
            rl = null
        })
    }
}

globalThis.init_readline = init_readline
