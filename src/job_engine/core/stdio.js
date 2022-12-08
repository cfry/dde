//see doc: https://nodejs.org/api/readline.html
//import {Job} from "./job.js" //now Job is global


//no examples on web of import readline, all use require.
//import * as readline from "readline" // "../../../node_modules/readline/readline.js" //todo but readline.js does require("fs") and require is undefined.
//import readline from "readline"
//globalThis.readline = readline //but since this file can ONLY be loaded in Job Engine, globalThis not accessible from DDE IDE


function set_keep_alive_value(new_val){
    globalThis.keep_alive_value = new_val //true or false
    let active_job_count = Job.active_jobs().length
    console.log("in set_keep_alive_value with active_job_count: " + active_job_count +
                " and new_val: " + new_val)
    //if((!new_val) && (active_job_count === 0)){//todo needs to be commented back in probably
    ///    globalThis.close_readline() //but this doesn't end the process so call:
    //    process.exit(0)  //https://stackabuse.com/how-to-exit-in-node-js/
    //}
}

function format_for_eval(src, result){
    let result_str = "" + result
    let text = format_text_for_code(result_str, true).trim() //defined in out.js
    //below mostly copied from out.js
    let src_formatted = ""
    let src_formatted_suffix = "" //but could be "..."
        src_formatted = src.trim()
        let src_first_newline = src_formatted.indexOf("\n")
        if (src_first_newline != -1) {
            src_formatted = src_formatted.substring(0, src_first_newline)
            src_formatted_suffix = "..."
        }
        if (src_formatted.length > 55) {
            src_formatted = src_formatted.substring(0, 55)
            src_formatted_suffix = "..."
        }
        src_formatted = Utils.replace_substrings(src_formatted, "<", "&lt;")
        src = Utils.replace_substrings(src, "'", "&apos;")
        src_formatted = " <code style='background-color:white;' title='" + src + "'>" + src_formatted + src_formatted_suffix + "</code>"

    let src_label = "The result of evaling JS "
    let the_html = "<div style='font-size:16px;display:inline-block'><i>" + src_label  + " </i>" + src_formatted + " <i>is...</i>" +  text + "</div>"
    return the_html
}

/*
process.stdin.on("data", data => {
    data = data.toString()
    console.log("stdin on data passed: " + data)
    data = data.trim()
    if(data.startsWith("{")){ //got a JSON object
        let json_obj = JSON.parse(data)
        globalThis.keep_alive_value = json_obj.keep_alive_value
        if(json_obj.kind === "eval") {
            let src = json_obj.code
            let result = globalThis.eval(src)
            let the_html = format_for_eval(src, result)
            process.send(the_html) //write_to_stdout(the_html)
            if (!globalThis.keep_alive_value) {
                let json_obj = {
                    kind: "job_process_button",
                    button_tooltip: "There is no job process.",
                    button_color: rgb(200, 200, 200)
                }
                write_to_stdout(JSON.stringify(json_obj))
            }
        }
    }
    else {
        console.log("eval returns: ", globalThis.eval(input))
    }
    //process.stdout.write(data + "\n")
})

 */

process.on("message", data_obj => {
        globalThis.keep_alive_value = data_obj.keep_alive_value
        console.log("stdio.kjs top of on message with keep_alive_value: " + keep_alive_value)
        if(data_obj.kind === "get_dde_version") {
            data_obj.dde_version      = globalThis.dde_version
            data_obj.dde_release_date = globalThis.dde_release_date
            process.send(data_obj)
        }
        else if(data_obj.kind === "eval") {
            let src = data_obj.code
            let result = globalThis.eval(src)
            let the_html = format_for_eval(src, result)
            console.log("stdio on message the_html: " + the_html)
            //write_to_stdout(the_html)
            let the_eval_result_obj = {
                                    kind: "eval_result",
                                    val_html:  the_html
                                   }
            process.send(the_eval_result_obj)
            /* no need for this when job_process button goes away.
             if (!globalThis.keep_alive_value) {
                let json_obj = {
                    kind: "job_process_button",
                    button_tooltip: "There is no job process.",
                    button_color: rgb(200, 200, 200)
                }
                process.send(json_obj)
            }*/
        }
        else if((data_obj.kind === "job_button_click")){
            let code = 'Job.maybe_define_and_server_job_button_click("' + data_obj.job_name_with_extension + '")'
            console.log(" stdio on message job_button_click evaling: " + code)
            out(" stdio on message job_button_click evaling: " + code)
            globalThis.eval(code)
        }
        else {
            console.log("eval returns: ", globalThis.eval(data_obj.code))
        }
    //process.stdout.write(data + "\n")
})



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

/*
//CAN"T GET readline to work so using simpler process.stdin.on("data" ...")
//no examples on web of import readline, all use require.


function close_readline(){
    console.log("top of job engine node stdio.js close_readline") //even wit the setTimeout,
    //I still don't see this print statement come to the JE browser interface Out pane.
    setTimeout( function() {
       // rl.close() //todo comment back in when debugged
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
            input:  process.stdin,
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
            input = input.trim()
            if(input.startsWith("eval(")){
                let code = input.substring(5, input.length - 1)
                let result =  globalThis.eval(code)
                let result_str = "" + result
                out("the result of evaling: " + code + " is: <br/>" +
                     result_str)
            }
            else {
                console.log("eval returns: ", globalThis.eval(input))
            }
        })
        rl.on('close', function () { // can't find a rl.is_open() method or prop so this will have to do
            rl = null
        })
    }
}

globalThis.init_readline = init_readline
*/
