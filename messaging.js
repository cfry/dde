var https = require('https')
var querystring = require('querystring')
var {time_in_us} = require("./core/utils.js")

var Messaging = class Messaging{}
Messaging.hostname      = "api-project-5431220072.appspot.com"
Messaging.base_url      = "https://api-project-5431220072.appspot.com"
Messaging.login_path    = "/login.html"
Messaging.auth_path     = "/auth"
Messaging.send_path     = "/BOSCin"
Messaging.receive_path  = "/BOSCout"
Messaging.tenative_user = null
Messaging.user          = null
Messaging.tentative_password = null
Messaging.password      = null
Messaging.test_user     = "kb"
Messaging.test_user_password = "Argh666"
Messaging.is_logged_in  = false
Messaging.cookie        = null
Messaging.tentative_last_send_to  = null
Messaging.successful_last_send_to = null
Messaging.print_debug_info = false

Messaging.unconfirmed_send_mess_obj_fifo = [] //first in, first out. oldest elt is elt 0.
Messaging.initial_send_delay_seconds = 0.25 //constant
Messaging.current_send_delay_seconds = 0
Messaging.max_send_delay_seconds = 70 //constant Ie before sending something this long, just give up,
                                      //and print an error message. by doubling from 0.25.
                                      //we top out at 64 seconds.
Messaging.last_send_time_us = time_in_us()
//Messaging.time_in_us = function(){
//    return Date.now() * 1000
//}

Messaging.debug = function(string){
    if(Messaging.print_debug_info){
        out(string, "#92483e")
    }
}

//the defaults for this post are set up to do login to the appspot server.
Messaging.post =   function({hostname= Messaging.hostname,
                             port= 443,
                             path= Messaging.auth_path,
                             method= "POST",
                             post_data= {//user: "cfry",  //kb
                                         //pass: "abc123" //"Argh666"
                                        },
                             data_callback= Messaging.login_data_callback,
                             error_callback= Messaging.login_error_callback
                 }={}){
    let post_data_string = querystring.stringify(post_data)
    let req = https.request({hostname: hostname,
                             port: port,
                             path: path,
                             method: method,
                             headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Content-Length': Buffer.byteLength(post_data_string)
                             }
                            },
                            Messaging.login_data_callback)
    req.on('error', (err) => {
            this.login_error_callback.call(null, err)
    })
    req.write(post_data_string)
    req.end()
    Messaging.tenative_user = post_data.user //becuase we aren't really logged in yet and the fully loggin in code doesn't have acesss to the user name
}

//________login_______
Messaging.login = function({user=Messaging.test_user, pass=Messaging.test_user_password}) {
        if(Messaging.is_logged_in) {
              if(user === Messaging.user){
                    warning("Messaging user: " + Messaging.user + " is already logged in.<br/>" +
                            "Call <code>Messaging.logout()</code> to log out.")
                    return
              }
              else {
                    warning("Messaging user: " + Messaging.user + " is already logged in.<br/>" +
                      "You have attempted to login as a diffrent user: " + user +
                      "<br/>Only one user can be logged in from DDE at a time." +
                       "<br/>Call <code>Messaging.logout()</code> to log out.")
              }
        }

        Messaging.tentative_last_send_to = user
        Messaging.tentative_password = pass
        let passed_in_args = arguments[0]
        let args_to_pass_on={post_data:{}}
        for(let key in passed_in_args){
            if      (key == "user") { args_to_pass_on.post_data.user = passed_in_args[key] }
            else if (key == "pass") { args_to_pass_on.post_data.pass = passed_in_args[key] }
            else { args_to_pass_on[key] = passed_in_args[key] }
        }
         Messaging.post(args_to_pass_on)
}

Messaging.login_data_callback  = function(res){
    Messaging.debug(`Messaging.login_data_callback statusCode: ${res.statusCode} body: `)
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        Messaging.debug(`BODY: ${chunk}`);
    });
    res.on('end', () => {
        Messaging.debug('Messaging.login_data_callback end: No more data in response.');
        if(res.statusCode !== 200){
            warning("Messaging.login_data_callback login failed for: " + Messaging.tentative_last_send_to +
                    " password: " + Messaging.tentative_password)
        }
        else {
        let multi_attribute_string_cookie = res.headers["set-cookie"][0]
        let pairs = multi_attribute_string_cookie.split(" ")
        let new_cookie_array = []
        for(let pair of pairs) {
            if(pair.includes("=")){
                if(!pair.startsWith("Path=")) {
                    pair = pair.substring(0, pair.length - 1) //trim off trailing semicolon
                    new_cookie_array.push(pair)
                }
            }
        }
        //Messaging.cookie = res.headers["set-cookie"] //not supported: res.getHeader('Cookie') // 'cookie' is of type string[]
        Messaging.cookie = new_cookie_array
        Messaging.user = Messaging.tenative_user
        Messaging.password = Messaging.tentative_password
        Messaging.successful_last_send_to = Messaging.tentative_last_send_to
        Messaging.is_logged_in = true
        out("Messaging.login successful for: " + Messaging.user)
        Messaging.receive()
        }
    })

}

Messaging.login_error_callback = function(err){
    Messaging.is_logged_in = false
    dde_error("Messaging.login_error_callback: " + err.message +
              "<br/>Please check your internet connection.")
}

Messaging.logout = function(){
    Messaging.is_logged_in = false
    out("Messaging is logging out: " +  Messaging.user + ". It may take 30 seconds or so.")
}


//_________send__________
/* Messaging.unconfirmed_send_mess_obj_fifo = [] //first in, first out. oldest elt is elt 0.
   Messaging.initial_send_delay_seconds = 0.25
   Messaging.current_send_delay_seconds = 0
   Messaging.max_send_delay_seconds = 70
*/
Messaging.send = function(mess_obj){
        if(!Messaging.is_logged_in) { dde_error("Messaging.send attempt but your are not logged in.")}
        else if (typeof(mess_obj) === "string"){
            Messaging.out(mess_obj) //this will call Messaging.send again with a proper mess_obj
            return
        }
        //else {
        //    delete mess_obj.pass
        //    let msg_obj = {}
        //    for(let exclude_prop of ["pass", "user"]){
        //        delete msg_obj[exclude_prop]
        //    }
        //}
        if(!mess_obj.to)        { dde_error("Messaging.send doesn't have a 'to' property.<br/>" + JSON.stringify(mess_obj))   }
        else if(!mess_obj.type) { dde_error("Messaging.send doesn't have a 'type' property.<br/>" + JSON.stringify(mess_obj)) }

        //we're going to do send an actual request, either the passed in mess_obj or the first in the fifo
        if ((Messaging.unconfirmed_send_mess_obj_fifo.length == 0)  ||
            (mess_obj != Messaging.unconfirmed_send_mess_obj_fifo[0])){
                 Messaging.unconfirmed_send_mess_obj_fifo.push(mess_obj)
        }
       mess_obj = Messaging.unconfirmed_send_mess_obj_fifo[0] //might or might not be the same as the passed in mess_obj
       Messaging.tentative_last_send_to = mess_obj.to
       //delete mess_obj.to //needed in case this send fails and we have to resend
       mess_obj.from = Messaging.user //todo there should be a more secure way to get this in the server, but for now...
       if(!mess_obj.send_time_us) { //only add sent_time_us once to mess_obj, ie the first time its used
            Messaging.last_send_time_us = time_in_us() //microseconds  //Date.now()  miilliseconds
            mess_obj.send_time_us = Messaging.last_send_time_us
       }
       let mess_obj_str = (mess_obj.msg ? mess_obj.msg : JSON.stringify(mess_obj))
       let outer_mess_obj = {to: Messaging.tentative_last_send_to,
                             msg: mess_obj_str }
       let query_string = querystring.stringify(outer_mess_obj) //does url_encode
       //query params go on end of path: https://stackoverflow.com/questions/37566716/https-request-with-query-strings-in-nodejs
       //how primitive can you get? 800 args to request and one of them isn't the query args?
       //See who's logged in? https://api-project-5431220072.appspot.com/BOSConline
       let path_and_query = Messaging.send_path + "?" + query_string
       let req = https.request({hostname: Messaging.hostname,
                                port: 443,
                                path: path_and_query,
                                method: "GET"
                                },
                               this.send_callback
                              )
        // should result in the url a la:
        // https://api-project-5431220072.appspot.com/BOSCin?msg=hi&to=cfry
        req.setHeader('Cookie', Messaging.cookie) //['type=ninja', 'language=javascript'])
        req.end()

        req.on('error', function(err) {
            warning("Messaging.send error for: " + JSON.stringify(mess_obj) + "<br/>of: " + err.message)
            //todo resend
            // if(mess_obj.resend == true)
        })
}

Messaging.send_callback = function(res){
        Messaging.debug("top of Messaging.send_callback statusCode: " + res.statusCode)
        if(Messaging.unconfirmed_send_mess_obj_fifo.length == 0){
            shouldnt("In Messaging.send_callback, got empty Messaging.unconfirmed_send_mess_obj_fifo.")
        }
        res.on('data', function(data) {
           let the_res = res
           let data_string = data.toString() //the url encoding is automatically decoded
            //example of data_string when the user is an unknown user:
            //  BOSCin to:cfryx. Status:unknown
            let pending_mess_obj = Messaging.unconfirmed_send_mess_obj_fifo[0]
            if(data_string.endsWith("Status:unknown")){
                if (!pending_mess_obj.resend){
                    Messaging.debug("Messaging.send_callback got unknown user and no resend so never completed send for:<br/>" +
                                     JSON.stringify(pending_mess_obj))
                    Messaging.unconfirmed_send_mess_obj_fifo.shift()
                    Messaging.current_send_delay_seconds = 0
                }
                else if (Messaging.current_send_delay_seconds >  (Messaging.max_send_delay_seconds / 2)){
                    warning("Messaging.send_callback tried repeatedly to send message but failed: " +
                             JSON.stringify(pending_mess_obj))
                    Messaging.unconfirmed_send_mess_obj_fifo.shift()
                    Messaging.current_send_delay_seconds = 0
                }
                else if(pending_mess_obj.resend){ //resend, do not change fifo
                    let user_name = data_string.substring(data_string.indexOf(":") + 1, data_string.indexOf("."))
                    let extra_message = "Attempt to send to user: " + user_name + ",<br/>who is not known by the server. Now resending..."
                    warning("Messaging.send_callback: " + extra_message)
                    if(Messaging.current_send_delay_seconds == 0) {
                        Messaging.current_send_delay_seconds = Messaging.initial_send_delay_seconds
                    }
                    else {
                        Messaging.current_send_delay_seconds = Messaging.current_send_delay_seconds * 2
                    }
                    Messaging.debug("Messaging.send_callback resending with timeout of: " + Messaging.current_send_delay_seconds +
                                    "<br/>" + JSON.stringify(pending_mess_obj))
                    setTimeout(function(){
                        Messaging.send(pending_mess_obj)
                    }, Messaging.current_send_delay_seconds)
                }
            }
            else { //A OK
                Messaging.debug("Messaging.send_callback success with data: " + data_string)
                Messaging.unconfirmed_send_mess_obj_fifo.shift()
                Messaging.current_send_delay_seconds = 0
            }
        })
}

//Called by DDE grabbing selected text and making it a mess_obj to send
Messaging.send_text = function(text, define_job=true){
    let message_type = null
    let result
    let mess_obj
    try{ result = eval(text) }
    catch(err){ type = "out" }
    if(type === null){
        if(result instanceof Job){
            mess_obj = {type: "start_job",
                source: text} //must be before calling
            //Instruction.is_do_list_item because a Job is a do_list_item.
        }
        else if(Instruction.is_do_list_item(result)){
            mess_obj = {type: "job_instruction",
                source: text,
                define_job: define_job
            }
        }
        else { mess_obj = {type: "out",
            val: text }
        }
    }
    this.send(mess_obj)
}

//_______High level sends_______
Messaging.out = function({val="test message", color="black", temp=false, code=false, //todo should be null but query string screw up with null?
                          to=Messaging.successful_last_send_to, resend=false}={}){
    let mess_obj = arguments[0]
    if (mess_obj === undefined) { mess_obj = {} }
    else if((typeof(mess_obj) == "object") && mess_obj.hasOwnProperty("val")) {} //leave it alone for now
    else { mess_obj = {val: mess_obj} }//even if mess_obj isn't a string this is ok. We fix that below

    //fill in defaults. Careful: Smarter ways to do this generate garbage.
    if(!mess_obj.val)   { mess_obj.val   = val }
    if (typeof(mess_obj.val) != "string"){ //if its not a string, its some data structure so make it fixed width to demonstrate code. Plus the json pretty printing doesn't work unless if its not fixed width.
        if(window["stringify_value"]) { mess_obj.val = stringify_value(mess_obj.val) }
        else { mess_obj.val = stringify_value_cheap(mess_obj.val) } //hits in browser
    }
    if(!mess_obj.color) { mess_obj.color = color }
    if(!mess_obj.temp)  { mess_obj.temp  = temp }
    if(!mess_obj.code)  { mess_obj.code  = code }
    mess_obj.type = "out"
    //end type-specific
    if(!mess_obj.to)     { mess_obj.to = to }
    if(!mess_obj.resend) { mess_obj.resend = resend }
    Messaging.send(mess_obj)
}

Messaging.out_receive = function(mess_obj){
    out(mess_obj.val, mess_obj.color, mess_obj.temp, mess_obj.code)
}

Messaging.speak = function({speak_data = "hello", volume = 1.0, rate = 1.0, pitch = 1.0,
                            lang = "en_US", voice = 0,
                            to=Messaging.successful_last_send_to, resend=false}={}){
    let mess_obj = arguments[0]
    if (mess_obj === undefined) { mess_obj = {} }
    if(typeof(mess_obj) == "string"){ mess_obj = {speak_data: mess_obj} }
    //type-specific set-up
    if(!mess_obj.speak_data) { mess_obj.speak_data = stringify_for_speak(speak_data) }
    if(!mess_obj.volume)     { mess_obj.volume     =  volume}
    if(!mess_obj.rate)       { mess_obj.rate       =  rate}
    if(!mess_obj.pitch)      { mess_obj.pitch      =  pitch}
    if(!mess_obj.lang)       { mess_obj.lang       =  lang}
    if(!mess_obj.voice)      { mess_obj.voice      =  voice}
    mess_obj.type = "speak"
    mess_obj.speak_data = stringify_for_speak(mess_obj.speak_data)
    //end type-specific
    if(!mess_obj.to)         { mess_obj.to = to }
    if(!mess_obj.resend) { mess_obj.resend = resend }
    Messaging.send(mess_obj)
}

Messaging.speak_receive = function(mess_obj){
    speak({speak_data: mess_obj.speak_data, volume: mess_obj.volume,
          rate: mess_obj.rate , pitch: mess_obj.pitch,
          lang: mess_obj.lang, voice: mess_obj.voice})
}
Messaging.start_job = function({job_name=null, start_options={}, callback=null,
                                to=Messaging.successful_last_send_to, resend=false}={}){
    let mess_obj = arguments[0]
    if (mess_obj === undefined) { mess_obj = {} }
    if(typeof(mess_obj) == "string"){ mess_obj = {job_name: mess_obj} }

    //type-specific set-up
    if(!mess_obj.job_name) {mess_obj.job_name == job_name}
    if(!mess_obj.job_name) { //required.
      dde_error("Attempt to send Messaging.start_job but no job_name provided for the Job.")
    }
    else if (mess_obj.job_name instanceof Job){
        mess_obj.job_name = to_source_code({value: mess_obj.job_name})
    }
    else if(mess_obj.job_name.startsWith("new Job(")){} //ok
    else if(mess_obj.job_name.startsWith("Job.")) {} //ok
    else if(is_string_an_identifier(mess_obj.job_name)){ mess_obj.job_name = "Job." + job_name }
    else {
        dde_error("Messaging.start_job called with job_name: <br/>" + mess_obj.job_name +
            "<br/>but the job_name does not define a Job.<br/>" +
            'It should start with: "Job.foo", or "new Job({...})".' +
            "<br/> so no action taken.")
    }
    if(!mess_obj.start_options) { mess_obj.start_options = start_options}
    if(typeof(mess_obj.start_options) == "string") {} //ok
    else if (typeof(mess_obj.start_options) == "object"){
        mess_obj.start_options = to_source_code({value: mess_obj.start_options})
    }
    else {
        dde_error("Messaging.start_job called with job_name: <br/>" + mess_obj.job_name +
                  "<br/>but the start_options are not a JS literal object like they should be:<br/>" +
                   JSON.stringify(mess_obj.start_options))
    }
    if(callback == null) {} //ok || (typeof(callback) == "string"))) {
    else if (typeof(callback == "string")) {
        let val_of_cb = value_of_path(callback)
        if(typeof(val_of_cb) != "function") {
            dde_error('Messaging.start_job, the callback: "' + callback + '" is a string (good), but its not the name or path to a function(bad):<br/>' +
                       val_of_cb)
        }
        //else OK
    }
    else {
        dde_error("Messaging.start_job, the callback must be null or a string name of a method<br/>" +
                  "but its: " + callback)
    }
    //allow no callback
    //end type-specific
    mess_obj.type = "start_job"
    if(!mess_obj.to)     { mess_obj.to = to }
    if(!mess_obj.resend) { mess_obj.resend = resend }
    Messaging.send(mess_obj)
}


Messaging.start_job_receive = function(mess_obj){
    let job_name = mess_obj.job_name
    if     (job_name.startsWith("new Job(")) {} //ok
    else if(job_name.startsWith("Job.")) {} //ok
    else if(is_string_an_identifier(job_name)) {}
    else {
        warning("Messaging.user_receive_callback passed:<br/>" + job_name +
            "<br/>but the job_name does not define a Job.<br/>" +
            'It should start with: "Job.foo", or "new Job({...})".' +
            "<br/> so no action taken.")
        mess_obj.to = mess_obj.from
        mess_obj.result = "Error: " + job_name + '<br/> was supposed to start with "Job." or "new Job(" <br/>'
        Messaging.send(mess_obj)
    }
    let start_options
    try { eval("start_options = " + mess_obj.start_options) }
    catch(err){
        let err_mess = "Error: Messaging.start_job_receive error when evaling start_options of:<br/>" +
                        mess_obj.start_options +
                        err.message
        warning(err_mess)
        mess_obj.to = mess_obj.from
        mess_obj.result = err_mess
        Messaging.send(mess_obj)
    }
    let job_instance
    try { job_instance = eval(job_name)
          if(job_instance instanceof Job) {
            job_instance.start(start_options)
            mess_obj.to = mess_obj.from
            mess_obj.result = "Job." + job_instance.name + " started in the DDE of: " + Messaging.user
            Messaging.send(mess_obj)
            return
          }
          else if (Array.isArray(job_instance) &&
                (job_instance.length == 1) &&
                typeof(job_instance[0]) == "string"){ //there was an active job of this name,
                //so that is being stopped and the new Job will be called again on
                //the job name BUT that new job won't be started as usual with start job.
                let path
                if(job_name.startsWith("Job.")) { path = job_name }
                else if (job_name.startsWith("new Job(")) {
                    let name_pos = job_name.indexOf("name:")
                    if(name_pos > 0) {
                        let start_name_pos = name_pos + 5
                        let end_name_pos = job_name.indexOf(",", start_name_pos)
                        if(end_name_pos > 0) {
                            let name = job_name.substring(start_name_pos, end_name_pos).trim()
                            name = name.substring(1, name.length - 1) //strip off quotes around name
                            path = "Job." + name
                        }
                    }
                }
                if(path) {
                    mess_obj.to = mess_obj.from
                    mess_obj.result = path + " started in the DDE of: " + Messaging.user
                    Messaging.send(mess_obj)
                    setTimeout(function() {
                        let job_instance = value_of_path(path)
                        job_instance.start(start_options)
                    }, 500)
                    return
                }
                else {
                    let result_str = "Could not restart Job: " + job_name + " because could not find its name."
                    warning(result_str)
                    mess_obj.to = mess_obj.from
                    mess_obj.result = result_str
                    Messaging.send(mess_obj)
                    return
                }
          }
          else {
              let err_mess = "Error: Messaging.user_receive_callback could not define or start job: " + job_name
              warning(err_mess)
              mess_obj.to = mess_obj.from
              mess_obj.result = err_mess
              Messaging.send(mess_obj)
              return
          }
    }
    catch(err) {
            let err_mess = "Error: Messaging.user_receive_callback: " + err.message
            warning(err_mess)
            mess_obj.to = mess_obj.from
            mess_obj.result = err_mess
            Messaging.send(mess_obj)
            return
    }
}

//returns an array of active jobs that are waiting, could be length 0, 1, or more than one.
//only if 1 is returned is that really the valid default job.
//but return the list so we can give user a good error message.
Messaging.default_jobs = function(){
    let result = []
    for(let job_instance of Job.active_jobs()){
         if(job_instance.when_stopped === "wait") {
             result.push(job_instance)
         }
    }
    return result
}

Messaging.valid_instruction_or_error_string = function(do_list_item) {
    try{
        instr = eval(do_list_item) //pretty sure this is going to work as it was evaled and verified before send
        if(!Instruction.is_do_list_item(instr)){
            return "Messaging.job_instruction passed do_list_item of: " + do_list_item +
                   "<br/>which is not a valid instruction."
        }
        else { return instr }
    }
    catch(err){
        return "Messaging.job_instruction passed do_list_item of: " + do_list_item +
               "<br/>which is not a valid instruction: " + err.message
    }
}


//job_name: can be:
//  "myjob", etc. or
// "default" Where if > 1 default exists, error with a message of the names of
// the two or more active jobs so the user could kill some.
// If exactly one default exists, use it.
// If none exists, see "if_no_job" for the behavior.
// The default value for job_name is "wait_for_message"
//
// if_no_job: can be
// "define_start" which defines new Job({name: mess_obj.job_name , when_stopped: "wait"}
// and starts it before inserting the instruction.
// "error" which errors.
// the default is "define_start"
// If a job of job_name is defined but doesn't have when_stopped="wait", error.
// otherwise start it and insert the instruction
// If the job name is "default" but no such default exists,
// check for a job named "wait_for_message".
// if its active, insert the job there.
// else if its not active, start it then insert,
// else if it doesn't exist. create it then insert.
//
// Resulting behavior: if both default, then the right thing happens.
// ie use wait_for_message if its defined, and if not, create it and use it.
// as will subsequent default calls.
Messaging.job_instruction = function({do_list_item,
                                      job_name="wait_for_message", //also can be "default"
                                      if_no_job="define_start", //also can be "error"
                                      to=Messaging.successful_last_send_to,
                                      resend=false}={}){
    let mess_obj = arguments[0]
    if (mess_obj === undefined) { mess_obj = {} }
    //type-specific set-up
    if(!mess_obj.do_list_item) { //required.
        dde_error("Messaging.job_instruction, attempt to send, but no do_list_item provided.")
    }
    else if(typeof(mess_obj.do_list_item) == "string"){
        //test if its good before sending it over. Not *always* the right thing  but maybe still worth it.
        //because then *much* less likely it will error on the other side.
        let instr_obj
        try{ instr_obj = eval(mess_obj.do_list_item) }
        catch(err){
            dde_error("Messaging.job_instruction passed do_list_item string of: " + mess_obj.do_list_item +
                      "<br/>that errors when evaled with: " + err.message)
        }
        if(!Instruction.is_do_list_item(instr)) {
            dde_error("Messaging.job_instruction, attempt to send instruction do_list_item <br/>" +
                       "that that does not eval to a valid do_list item.<br/>" + mess_obj.do_list_item)
        }
        //else {} //ok
    }
    else if (typeof(mess_obj.do_list_item) !== "string") {
        if(Instruction.is_do_list_item(mess_obj.do_list_item)){
            mess_obj.do_list_item = to_source_code({value: mess_obj.do_list_item})
        }
        else {
            dde_error("Messaging.job_instruction, attempt to send instruction<br/>" +
                      "that is not a valid do_list item.<br/>" + mess_obj.do_list_item)
        }
    }
    //now mess_obj.do_list_item is good to go.
    if(mess_obj.job_name == undefined) { mess_obj.job_name = job_name }
    if (typeof(mess_obj.job_name) !== "string"){
        dde_error("Messaging.job_instruction, has invalid job_name of: " + mess_obj.job_name +
                  "<br/>It must be a string.")
    }

    if(mess_obj.if_no_job == undefined) { mess_obj.if_no_job = if_no_job }
    if(!["define_start", "error"].includes(mess_obj.if_no_job)){
        dde_error("Messaging.job_instruction, has invalid if_no_job of: " + mess_obj.if_no_job +
                  "<br>Valid values are: " + ["define_start", "error"])
    }
     //end type specific
    mess_obj.type = "job_instruction"
    if(!mess_obj.to)     { mess_obj.to = to }
    if(!mess_obj.resend) { mess_obj.resend = resend }
    Messaging.send(mess_obj)
}

//only send a message back to the sender if there's an error
Messaging.job_instruction_receive = function(mess_obj){
    let instr = Messaging.valid_instruction_or_error_string(mess_obj.do_list_item)
    if(typeof(instr) == "string") {
        warning(instr)
        Messaging.out({val: instr, color: "red", to: mess_obj.from})
    }
    else { //instr is good, but is job_name?
        let job_name = mess_obj.job_name
        let job_instance
        if(job_name == "default") {
            let job_instances = Messaging.default_jobs()
            if(job_instances.length === 1) {
                job_instance = job_instances[0]
                Job.insert_instruction(instr, {job: job_instance, offset: "end"}) //success!
            }
            else if(job_instances.length > 1) {
                let active_job_names = []
                for(let j of job_instances) { active_job_names.push(j.name) }
                let err_mess = 'Error: Messaging.job_instruction_receive passed job_name: "default",<br/>' +
                               'but there are ' + job_instances.length + ' active, waiting Jobs: ' +
                                active_job_names.join(", ") +
                               '<br/>There must be only one for "default" to be unambiguous.<br/>' +
                               "No instruction added."
                warning(err_mess)
                Messaging.out({val: err_mess, color: "red", to: mess_obj.from})
            }
            else if(job_instances.length == 0){
                if(mess_obj.if_no_job == "error") {
                    let err_mess = 'Error: Messaging.job_instruction_receive passed job_name: "default",<br/>' +
                                    'but there are no active, waiting Jobs at: ' + mess_obj.to +
                                    '<br/> and the if_no_job value is "error".<br/>' +
                                    'No instruction added.'
                    warning(err_mess)
                    Messaging.out({val: err_mess, color: "red", to: mess_obj.from})
                }
                else if(mess_obj.if_no_job == "define_start"){
                    new Job({name: "wait_for_message",
                             when_stopped: "wait",
                             do_list: [instr]})
                    setTimeout(function(){  //because new Job might run into an existing Job.wait_for_message
                                             //that it has to shut down
                                  Job.wait_for_message.start() //success!
                               }, 200)
                }
                else {  //unlikely since this is verified before send.
                   let err_mess = 'Messaging.job_instruction_receive passed if_no_job of: "' + mess_obj.if_no_job +
                                  '<br/>Valid values are: "define_start" and "error".'
                    shouldnt(err_mess)
                    Messaging.out({val: err_mess, color: "red", to: mess_obj.from})
                }
            }
        }
        //the job_name is not "default"
        else if(Job[job_name]) { // the job is defined
            job_instance = Job[job_name]
            if(job_instance.is_active()) {
                if(job_instance.when_stopped == "wait") {
                    Job.insert_instruction(instr, {job: job_instance, offset: "end"}) //success!
                }
                else if(mess_obj.if_no_job == "define_start"){ //stop existing job, redefine it with a "wait" and start it off
                    new Job({name: job_name,
                             when_stopped: "wait",
                             do_list: [instr]})
                    setTimeout(function(){  //because new Job might run into an existing Job.wait_for_message
                        //that it has to shut down
                        Job[job_name].start() //success!
                    }, 200)
                }
                else {
                   let err_mess = "Error: Messaging.job_instruction_receive passed job_name of " + job_name +
                                  "<br/>but that job is active yet is not waiting for an instruction<br/>" +
                                  'and if_no_job is "error" so the instruction was not added to the Job.'
                    warning(err_mess)
                    Messaging.out({val: err_mess, color: "red", to: mess_obj.from})
                }
            }
            else if(mess_obj.if_no_job == "define_start"){
                new Job({name: job_name, //note that job is already defined so we *could* use the
                                                   //old def provided it has when_stopped: "wait".
                                                   //so we generate additional garbage here and don't
                                                   //run any instructions in the existing job
                                                   //maybe not the right behavior, we'll see.
                                                   //one advantage of this approach is, if the existing
                                                   //job def has a lot of instr, then by redefiing it,
                                                   //we get rid of those and our passed-in instr starts
                                                   //right away. So our sender has more control over
                                                   //the job running on the receiving computer
                         when_stopped: "wait",
                         do_list: [instr]})
                setTimeout(function(){  //because new Job might run into an existing Job.wait_for_message
                    //that it has to shut down
                    Job[job_name].start() //success!
                }, 200)
            }
            else {
                let err_mess = "Error: Messaging.job_instruction_receive passed job_name of " + job_name +
                               '<br/>That job is not active and if_no_job is "error".<br/>'
                               'so the job was not started.'
                warning(err_mess)
                Messaging.out({val: err_mess, color: "red", to: mess_obj.from})
            }
        }
        //job_name is not already defined
        else if(mess_obj.if_no_job == "define_start"){ //stop existing job, redefine it with a "wait" and start it off
                new Job({name: job_name,
                    when_stopped: "wait",
                    do_list: [instr]})
                setTimeout(function(){  //because new Job might run into an existing Job.wait_for_message
                    //that it has to shut down
                    Job[job_name].start() //success!
                }, 200)
         }
        else { //job_name is not default, is not defined, and  mess_obj.if_no_job is "error"
            let err_mess = "Error: Messaging.job_instruction_receive passed job_name of " + job_name +
                '<br/>That job is not active and if_no_job is "error".<br/>'
                'so the job was not started.'
            warning(err_mess)
            Messaging.out({val: err_mess, color: "red", to: mess_obj.from})
        }
    }
}

//______receive____________
//call receive right after login succeeds
Messaging.receive = function() {
    let req = https.request({hostname: Messaging.hostname,
            port: 443,
            path: Messaging.receive_path,
            method: "GET"
        },
        this.receive_callback)
    req.setHeader('Cookie', Messaging.cookie) //['type=ninja', 'language=javascript'])
    req.end()
    req.on('error', (err) => {
        Messaging.receive_error_callback.call(null, err)
    })
}

Messaging.receive_callback = function(res){
    Messaging.debug("Messaging.receive_callback statusCode: " + res.statusCode)
    let data_string = "" //closed over in on_data and on_end
    res.on('data', function(data) {
        data_string += data.toString()
    })
    res.on("end", function(){
        let dur = time_in_us() - //parseInt(nano_time.micro())
                  Messaging.last_send_time_us
        if(Messaging.is_logged_in) {
            Messaging.debug("Messaging is auto_refreshing for: " + Messaging.user)
            Messaging.receive()
        }
        //else  allow to logout
        if(res.statusCode === 408) { //timeout
            if(!Messaging.is_logged_in) {
                out("Messaging user: " + Messaging.user + " is logged out.")
            }
        }
        else if(res.statusCode === 403){ //logged out
            if(Messaging.is_logged_in) {
                Messaging.debug("Messaging.received_callback: server has logged out: " + Messaging.user +
                              " now auto_logging in.")
                Messaging.is_logged_in = false
                Messaging.login({user: Messaging.user, pass: Messaging.password})
            }
            else {
                out("Messaging user: " + Messaging.user + " is now logged out.")
            }
        }
        else if(res.statusCode === 200){
            Messaging.debug("dur between send and receive: " + dur + "us")
            let prefix_length = "BOSCin message:".length //shouldn't this be BOSCout???
            let content_data_string = data_string.substring(prefix_length)
            Messaging.user_receive_callback(content_data_string)
        }
        else {
            warning("Messaging.receive_callback got bad statusCode: " + res.statusCode +
                " with data" + data_string)
        }
    })
}

Messaging.is_error_a_timeout_error = function(err){
    return err.statusCode == 408
}

Messaging.receive_error_callback = function(err){
    out("receive_error_callback called with: " + err.message)
    if(Messaging.is_error_a_timeout_error(err)){
        Messaging.debug("Messaging.receive_error_callback got timeout error." + "Now re-receiving.")
        Messaging.receive()
    }
    else {
        dde_error("Messaging.receive_error_callback got non-timeout error: " + err.message)
    }
}

//user customizes this fn to run robot instructions, etc.
Messaging.user_receive_callback = function(data_string){
    Messaging.debug("Messaging.user_recieve_callback passed data_string: " + data_string)
    Messaging.successful_last_send_to = Messaging.tentative_last_send_to
    if(data_string.length === 0 ) {
        warning("Messaging.user_receive_callback passed an empty data_string")
    }
    else if (data_string[0] !== "{") {
        warning("Messaging.user_receive_callback passed data that doesn't start with { : " + data_string)
    }
    else { //got an object
        let mess_obj  //have to do this due to broken JS eval in order to get the actual object.
        eval("mess_obj = " + data_string) //JSON.parse(data_string) can't use JSON.parse at least due to embedding single AND double quotes for strings
        let type = mess_obj.type
        if(mess_obj.result) {
            if(mess_obj.callback) {
                let callback_fn = value_of_path(mess_obj.callback)
                if(typeof(callback_fn) == "function"){
                        callback_fn.call(undefined, mess_obj)
                }
                else {
                    warning("In Messaging.user_receive_callback, the callback of: " + mess_obj.callback +
                        "<br/> is not a function, but rather: "  + JSON.stringify(callback_fn))
                }
            }
            else {
                warning("Messaging.receive_callback got: " + JSON.stringify(mess_obj) +
                        "<br/> but there's no callback to call.")
            }
        }
        else { //not a result mess_obj.
            let meth_name = type + "_receive"
            if(!Messaging[meth_name]) {
                warning("Messaging.user_receive_callback passed unhandled message type: " + type +
                        "<br/> in mess_obj: " + to_source_code({value: mess_obj}))
            }
            Messaging[meth_name].call(undefined, mess_obj)
        }
    }
}
var {speak, stringify_for_speak} = require("./core/out.js")




