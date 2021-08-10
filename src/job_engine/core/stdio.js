//see doc: https://nodejs.org/api/readline.html
import {Job} from "./job.js"

import readline from '/readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

export function set_keep_alive_value(new_val){
    global.keep_alive_value = new_val //true or false
    let active_job_count = Job.active_jobs().length
    console.log("in set_keep_alive_value with active_job_count: " + active_job_count +
                " and new_val: " + new_val)
    if((!new_val) && (active_job_count === 0)){
        close_readline() //but this doesn't end the process so call:
        process.exit(0)  //https://stackabuse.com/how-to-exit-in-node-js/
    }
}


//examples of input:
// 'Job.myJob.stop_for_reason("interrupted", "user stopped the job")'
// 'Job.define_and_start_job("/srv/samba/share/dde_apps/myjob.js")'
// 'Job.myjob.color_job_button()'
// 'Job.myjob.server_job_button_click()'
rl.on('line', function(input) {
    //onsole.log("<br/>stdin got line: " + input)
    out("(out call) stdin got line: " + input + "\n")
    eval(input)
})

//https://stackoverflow.com/questions/4976466/difference-between-process-stdout-write-and-console-log-in-node-js
export function write_to_stdout(str){
    if(str.trim() == "") {} //do nothing
    else {
        //if(str.startsWith("<for_server>")){
          //console.log("write_to_stdout got: " + str)
        //}
        process.stdout.write(str) //"<br/>" + str) //same as console.log ???
    }
}


export function close_readline(){
    rl.close()
}
