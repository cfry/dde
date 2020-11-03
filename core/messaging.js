var https = require('https')
var querystring = require('querystring')
var {function_param_names, replace_substrings, time_in_us} = require("./utils.js")

var Messaging = class Messaging{}
Messaging.hostname      = "not yet available in DDE"
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

//_______ get_result_fifo
Messaging.get_result_fifo = [] //first in, first out. oldest elt is elt 0. Only on orig_sender side.
Messaging.initial_send_delay_seconds = 0.25 //constant
Messaging.current_send_delay_seconds = 0
Messaging.max_send_delay_seconds = 70 //constant Ie before sending something this long, just give up,
                                      //and print an error by doubling from 0.25.
                                      //we top out at 64 seconds.


Messaging.get_from_fifo = function(mess_obj_or_time){
    let time
    if(typeof(mess_obj_or_time) == "number"){ time = mess_obj_or_time }
    else { time = mess_obj_or_time.send_time_us }
    for(let mess_obj of Messaging.get_result_fifo) {
       if(mess_obj.send_time_us === time) { return mess_obj }
    }
    return null //not in cache
}

//returns true if found and removed, false if not found in fifo
Messaging.remove_from_fifo = function(mess_obj_or_time){
    let time
    if(typeof(mess_obj_or_time) == "number"){ time = mess_obj_or_time }
    else { time = mess_obj_or_time.send_time_us }
    for(let i = 0; i < Messaging.get_result_fifo.length; i++) {
        let mess_obj = Messaging.get_result_fifo[i]
        if(mess_obj.send_time_us === time) {
            //delete puts an undefined in the array, doesn't remove the whole element. delete Messaging.get_result_fifo[i]
            Messaging.get_result_fifo.splice(i, 1)
            return true
        }
    }
    return false
}

//________get_result caches (not the fifo)
Messaging.mess_objs_that_made_round_trip = [] //get_result mess_objs on orig sender side. only stores mess_objs and only ones with get_result == true
Messaging.mess_objs_that_were_received   = [] //get_result mess_objs on receiver    side. and had their received processing done.
Messaging.delete_cached_mess_objs_older_than_us = 180 * 1000000

/* Always use Messaging.get_from_cache instead.
Messaging.already_in_cache = function(mess_obj, cache_array) {
    let this_send_time_us = mess_obj.send_time_us
    let result = false
    for(let mo of cache_array){
        if(mo.send_time_us === this_send_time_us) {
            result = true
        }
    }
    Messaging.clean_out_cached_mess_objs(cache_array)
    return result
}*/

//returns the mess_obj in cache_array that has the same send_time_us as the passed in mess_obj
//or null if none.
Messaging.get_from_cache = function(mess_obj, cache_array){
    let this_send_time_us = mess_obj.send_time_us
    let result = null
    for(let mo of cache_array){
        if(mo.send_time_us === this_send_time_us) {
            result = mo
            break;
        }
    }
    Messaging.clean_out_cached_mess_objs(cache_array)
    return result
}

//only add if not already present
Messaging.add_to_cache_maybe = function(mess_obj, cache_array){
    if(!Messaging.get_from_cache(mess_obj, cache_array)){
        cache_array.push(mess_obj)
    }
}

//depends on Messaging.mess_objs_that_made_round_trip ordered oldest first.
//deletes all the elements at the beginning of the array that are too old.
Messaging.clean_out_cached_mess_objs = function(cache_array){
    let now_us = time_in_us()
    let times_less_than_to_delete = now_us - Messaging.delete_cached_mess_objs_older_than_us //mess_obj that are over 3 minutes old  will be deleted
    for(let i = 0; i < cache_array.length; i++){
        let mess_obj = cache_array[i]
        let i_send_time_us = mess_obj.send_time_us
        if(i_send_time_us > times_less_than_to_delete) { //this one's a keeper but delete all older ones, and stop looping, exit fn
           if(i == 0) {} //no items before this one to delete.
           else {
                cache_array.splice(0, i) //delete the items up to but not including the ith item.
                Messaging.debug("Messaging.clean_out_cached_mess_objs just deleted " + i +
                                " from " +
                                ((cache_array == Messaging.mess_objs_that_made_round_trip) ?
                                 "mess_objs_that_made_round_trip" : "mess_objs_that_were_received"))
           }
           return
        }
    }
    //if we've gotten to here it means (i_send_time_us > times_less_than_to_delete)
    //was never true (for any items)
    //that means none should be kept, ie all are too old
    cache_array.splice(0, cache_array.length) //delete them all.
}

Messaging.time_to_callback_map = {}
Messaging.add_time_to_callback_maybe = function(mess_obj){
    let cb = mess_obj.callback
    if(cb){ //if cb is null or undefined, that's ok, but don't cache it.
        if (typeof(cb) == "string") {
            if(cb.startsWith("function")) { cb = "(" + cb + ")" }//fix JS's broken eval
            let val_of_cb
            try{ val_of_cb = eval(cb) } //might as well convert the string now before sending message,
               //as we'll need it if message goes through, and this way we can verify its good
               //before sending message.
            catch(err){
                dde_error("In Messaging." + mess_obj.type + ", the callback source of: " + mess_obj.callback +
                    "<br/>is not valid JS. " + err.message)
            }
            if(typeof(val_of_cb) !== "function") {
                dde_error('Messaging.eval, the callback: "' + callback + '" is a string (good), but its not the name or path to a function(bad):<br/>' +
                    val_of_cb)
            }
            //else { cb = val_of_cb } //keep it as a string so that we can display it as the string in
            //smart_append_to_messages

        }
        else if(typeof(cb) !== "function") {
            dde_error("In Messaging." + mess_obj.type + ", the callback does not represent a function.<br/>" +
                        mess_obj.callback)
        }
        //A OK
        Messaging.time_to_callback_map[mess_obj.send_time_us] = cb
        delete mess_obj.callback
    }
}

//if the cb is stored as a string, it is returned as a string without converting to a fn.
Messaging.get_time_to_callback = function(mess_obj){
    return Messaging.time_to_callback_map[mess_obj.send_time_us]
}

//returns a fn even if this is stored as a string.
Messaging.get_and_remove_time_to_callback = function(mess_obj){
    let cb = Messaging.time_to_callback_map[mess_obj.send_time_us]
    if(cb) { Messaging.remove_time_to_callback(mess_obj) }
    if(typeof(cb) == "string") {
        try {
            eval("cb = " + cb)
        }
        catch(err){
            shouldnt("Error: Messaging.get_and_remove_time_to_callback got string of the callback of:<br/>" +
                     cb +
                     "<br/> but that errored when evaling with:<br/>" + err.message)
        }
    }
    return cb
}
Messaging.remove_time_to_callback = function(mess_obj){
    delete Messaging.time_to_callback_map[mess_obj.send_time_us]
}


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
    Messaging.tenative_user = post_data.user //because we aren't really logged in yet and the fully loggin in code doesn't have acesss to the user name
}

//________login_______
Messaging.login = function({user=Messaging.test_user,
                            pass=Messaging.test_user_password,
                            callback=null}) {
       /* Just always go thru login because if the Messaging.is_logged_in gets out of sync,
          logging in will fix it.
         if(Messaging.is_logged_in) {
              if(user === Messaging.user){
                    warning("Messaging user: " + Messaging.user + " is already logged in.<br/>" +
                            "Eval <code>Messaging.logout()</code> to log out.")
                    return
              }
              else {
                    warning("Messaging user: " + Messaging.user + " is already logged in.<br/>" +
                      "You have attempted to login as a diffrent user: " + user +
                      "<br/>Only one user can be logged in from DDE at a time." +
                       "<br/>Call <code>Messaging.logout()</code> to log out.")
              }
        }*/

        Messaging.tentative_last_send_to = user
        Messaging.tentative_password = pass
        let passed_in_args = arguments[0]
        let args_to_pass_on={post_data:{}}
        for(let key in passed_in_args){
            if      (key == "user") { args_to_pass_on.post_data.user = passed_in_args[key] }
            else if (key == "pass") { args_to_pass_on.post_data.pass = passed_in_args[key] }
            else { args_to_pass_on[key] = passed_in_args[key] }
        }
         Messaging.login_user_callback = callback
         Messaging.post(args_to_pass_on)
}

Messaging.login_user_callback = null //user can set if they want a callback. used in testing.

Messaging.login_data_callback  = function(res){
    Messaging.debug(`Messaging.login_data_callback statusCode: ${res.statusCode} body: `)
    res.setEncoding('utf8');
    let data_string = "" //closed over in on_data and on_end
    res.on('data', (data) => {
        Messaging.debug(`BODY: ${data}`);
        data_string += data.toString()
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
        let data_items = data_string.split(":")
        Messaging.user = data_items[1] // res.headers.from_user //Messaging.tenative_user
        Messaging.password = Messaging.tentative_password
        Messaging.successful_last_send_to = Messaging.tentative_last_send_to
        Messaging.is_logged_in = true
        out("Messaging.login successful for: " + Messaging.user)
        Messaging.dialog_login_success()
        Messaging.receive()
        }
        if(Messaging.login_user_callback) {
            Messaging.login_user_callback.call(null, res)
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


Messaging.is_user_logged_in_user_cb = null

Messaging.is_user_logged_in_cb = function(res){
    Messaging.debug("top of Messaging.send_callback statusCode: " + res.statusCode)
    let data_string = ""
    res.on('data', function(data){
        data_string += data.toString() //the url encoding is automatically decoded
    })
    res.on('end', function() {
        let get_result = ((data_string[0] == "t") ? true : false)
        Messaging.is_user_logged_in_user_cb.call(Messaging, get_result)
    })
}

Messaging.is_user_logged_in = function(user_name, callback=out){
    Messaging.is_user_logged_in_user_cb = callback
    let path_and_query =  "/BOSConline?to=" + user_name
    let req = https.request({hostname: Messaging.hostname,
                             port: 443,
                             path: path_and_query,
                             method: "GET"
        },
        this.is_user_logged_in_cb
    )
    // should result in the url a la:
    // https://api-project-5431220072.appspot.com/BOSCin?msg=hi&to=cfry
    req.setHeader('Cookie', Messaging.cookie) //['type=ninja', 'language=javascript'])
    //Messaging.smart_append_to_sent_messages(mess_obj, true)
    req.end()
    req.on('error', function(err) {
        let error_message = "Error: Messaging.is_user_logged_in error for: " + user_name + "<br/>of: " + err.message
        //if(mess_obj.get_result) { Messaging.send_done_for_get_result(mess_obj, error_message) }
        warning(error_message)
    })
}

//_________send__________

Messaging.send = function(mess_obj){
       if(!Messaging.is_logged_in) { dde_error("Messaging.send attempt but your are not logged in.")}
       else if (typeof(mess_obj) === "string"){
            Messaging.out(mess_obj) //this will call Messaging.send again with a proper mess_obj
            return
       }
       if(!mess_obj.to)        { dde_error("Messaging.send doesn't have a 'to' property.<br/>" + JSON.stringify(mess_obj))   }
       else if(!mess_obj.type) { dde_error("Messaging.send doesn't have a 'type' property.<br/>" + JSON.stringify(mess_obj)) }
       Messaging.tentative_last_send_to = mess_obj.to

       if(!mess_obj.send_time_us) { //only add sent_time_us once to mess_obj, ie the first time its used
          Messaging.last_send_time_us = time_in_us() //in microseconds  //Note: Date.now() is in miilliseconds
          mess_obj.send_time_us = Messaging.last_send_time_us
       }
       if(mess_obj.get_result && !mess_obj.hasOwnProperty("result")) { //if it has a result, tht means
        // we're on the receiver's side sending back a result. So don't put it on the fifo.
            //so don't shove it on the fifo again. Includes does not work for a copy of mess_obj.
            if(!Messaging.get_result_fifo.includes(mess_obj)){
                Messaging.get_result_fifo.push(mess_obj)
                Messaging.add_time_to_callback_maybe(mess_obj)
                //imagine that all the rest of the communications after this fail. The below will "give up"
                //on this message. So it won't get through to the receiver and certainly won't come back to
                //the orig sender. So we "pretend" that we got back an error message.
                setTimeout(function() {
                               if(mess_obj.hasOwnProperty("result")) { //we're on the sender's side receiving the results of a requested result
                                      //very similar to key section of Messaging.user_receive_callback_permit
                                    let error_message = "Error: Messaging.send failed to send message to: " + mess_obj.to +
                                                        "<br/>after: " + Messaging.max_send_delay_seconds + " seconds, so giving up."
                                    Messaging.send_done_for_get_result(mess_obj, error_message)
                               }
                            },
                            Messaging.max_send_delay_seconds * 1000)
            }
            mess_obj = Messaging.get_result_fifo[0] //might or might not be the same as the passed in mess_obj
       }
       //non_get_result mess_obj's are sent once and forgotten, No further action taken on them
       //BUT if there's any pending get_result messages in the fifo or
       //it hasn't been enough time since the last send, then don't send the non-get_result message
       else if (!mess_obj.get_result && Messaging.get_result_fifo.length > 0) {
            MessStat.non_get_report_messages_not_used += 1
            Messaging.debug("Messaging.send, mess_obj type: " + mess_obj.type +
                             "<br/>has get_result: false and get_result_fifo has length: " +
                             Messaging.get_result_fifo.length +
                             "<br/> so the mess_obj not sent as per policy.")
            return
       }
       else if (!MessStat.should_send_non_get_result_message(mess_obj.send_time_us)){
           MessStat.non_get_report_messages_not_used += 1
           Messaging.debug("Send rejected sending message of type: " + mess_obj.type +
                           "because its too soon to send another non_get_result message.")
           return
       }
       //OK we're going to send the message be it get_result or non-get_result.
       if(!mess_obj.get_result) { MessStat.record_send_time(mess_obj) } //must be after MessStat.should_send_non_get_result_message()
       let mess_obj_str = (mess_obj.msg ? mess_obj.msg : JSON.stringify(mess_obj))
       let outer_mess_obj = {to: mess_obj.to,
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
        Messaging.smart_append_to_sent_messages(mess_obj, true)
        req.end()
        req.on('error', function(err) {
            let error_message = "Error: Messaging.send error for: " + JSON.stringify(mess_obj) + "<br/>of: " + err.message
            if(mess_obj.get_result) { Messaging.send_done_for_get_result(mess_obj, error_message) }
            else { warning(error_message) }
        })
}

//mess_obj is a get_result. We are on the orign sender's side.
//called both by send and send_callback
//if pass in result, it will be an error message, If result is null (default) don't change mess_obj resutl
Messaging.send_done_for_get_result = function(mess_obj, result_error_message=null){
    if(Messaging.get_from_cache(mess_obj, Messaging.mess_objs_that_made_round_trip)){
        //since the mess_obj is in the cache, we've already gotten this mess back
        //from the receiver before so we DON't want to call the callback again,
        //just ignore this
    }
    else { //first time we're getting this mess back from the sender so call the callback
        //display it and cache it so if there is a next time that we get this mess_obj
        //we will ignore it.
        let mess_obj_copy    = JSON.parse(JSON.stringify(mess_obj))
        mess_obj_copy.from   = mess_obj.to
        mess_obj_copy.to     = mess_obj.from //ie "me", the orig sender"
        if(result_error_message) {
            warning(result_error_message)
            mess_obj_copy.result = result_error_message
        }
        Messaging.smart_append_to_sent_messages(mess_obj_copy, false)
        Messaging.call_callback(mess_obj_copy) //might call dde_error so call smart_append_to_sent_messages first
        Messaging.mess_objs_that_made_round_trip.push(mess_obj_copy)
        Messaging.remove_from_fifo(mess_obj)
        Messaging.current_send_delay_seconds = 0
    }
}

Messaging.is_error = function(mess_obj){
    return mess_obj.hasOwnProperty("result") &&
           (typeof(mess_obj.result) === "string") &&
           mess_obj.result.startsWith("Error:")
}

Messaging.send_callback = function(res){
        Messaging.debug("top of Messaging.send_callback statusCode: " + res.statusCode)
        let data_string = ""
        res.on('data', function(data){
                data_string += data.toString() //the url encoding is automatically decoded
        })
        res.on('end', function() {
            let get_result = MessStat.extract_property_value(res, "get_result")
            //example of data_string when the user is an unknown user:
            //  BOSCin to:cfryx. Status:unknown
            let send_cb_good = !data_string.endsWith("Status:unknown")
            if(!get_result) {
                MessStat.record_send_cb_time(res, send_cb_good)
                if(!send_cb_good) {
                    let to = MessStat.extract_property_value(res, "to")
                    Messaging.debug("Messaging.send_callback got non-get_result message with unknown 'to' of: " + to)
                }
            }
            else { //res is a get_result message
                if(Messaging.get_result_fifo.length === 0) {
                    //unusual because if its a get_result mess, it should be in the fifo
                    //nothing to do.
                    //In "send" if there's something in the fifo and we are about to send a
                    //get_result==false message, we don't send it, we just throw it away.
                    //If there IS something in the fifo, we send that.
                    //so here, if fifo is empty then this send_callback must be called
                    //with a get_result==false message and therefore we can ignore it.
                    //BUT if there IS something in the fifo, then resend
                     Messaging.debug("In Messaging.send_callback, the fifo is empty so nothing to do.")
                     return
                }
                else { //message is get_result and fifo non-empty, so the mess must be first in the fifo
                    let pending_mess_obj = Messaging.get_result_fifo[0]
                    let send_time_us = MessStat.extract_property_value(res, "send_time_us")
                    if(pending_mess_obj.send_time_us !== send_time_us){
                        shouldnt("Messaging.send_callback got res send_time_us not the same as first_in_fifo send_time_us")
                    }
                    else if (Messaging.get_from_cache(pending_mess_obj, Messaging.mess_objs_that_made_round_trip)){
                        Messaging.debug("Messaging.send_callback got mess_obj that already made round trip, so doing nothing.")
                        return
                    }
                    else if(!send_cb_good){
                        if (Messaging.current_send_delay_seconds > (Messaging.max_send_delay_seconds / 2)){
                            let error_message = ("Error: Messaging.send_callback tried repeatedly to send message but failed: " +
                                                  JSON.stringify(pending_mess_obj))
                            Messaging.send_done_for_get_result(pending_mess_obj, error_message)
                        }
                        else { //resend, do not change fifo
                            let user_name = data_string.substring(data_string.indexOf(":") + 1, data_string.indexOf("."))
                            let extra_message = "Attempt to send to user: " + user_name + ",<br/>who is not known by the server. Now resending..."
                            if(Messaging.current_send_delay_seconds == 0) {
                                Messaging.current_send_delay_seconds = Messaging.initial_send_delay_seconds
                            }
                            else {
                                Messaging.current_send_delay_seconds = Messaging.current_send_delay_seconds * 2
                            }
                            Messaging.debug("Messaging.send_callback resending with timeout of: " + Messaging.current_send_delay_seconds +
                                            " seconds, fifo length: " + Messaging.get_result_fifo.length +
                                            " " + JSON.stringify(pending_mess_obj))
                            setTimeout(function(){
                                Messaging.send(pending_mess_obj)
                            }, Messaging.current_send_delay_seconds * 1000)
                        }
                    }
                    else { //A OK. mess is a get_result=true, to: user is known by server, mess hasn't made round trip, just let it go and hope it makes it
                        Messaging.debug("Messaging.send_callback with get_result=true message, success with data: " + data_string)
                        //Messaging.get_result_fifo.shift()
                        //Messaging.current_send_delay_seconds = 0
                    }
                }
            } //end /res is a get_result message
        } //res on end
        )
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

//Normally called from the bottom of type_receive methods
//If mess_obj.get_result is false, doesn't send back result.
//if there is no mess_obj.result, it is set to "OK"
Messaging.send_back_result_maybe = function(mess_obj){
    if(Messaging.is_error(mess_obj)) {
        Messaging.debug("In Messaging.send_back_result_maybe, passed result of:<br/>" +
                         mess_obj.result)
    }
    if(mess_obj.get_result) {
        if(!mess_obj.hasOwnProperty("result")) { mess_obj.result = "OK" }
        let orig_to = mess_obj.to
        mess_obj.to = mess_obj.from
        mess_obj.from = orig_to
        Messaging.send(mess_obj)
    }
}

//_______High level sends_______
Messaging.chat = function({message="test message", //color="black", code=null,
                           to=Messaging.successful_last_send_to, get_result=false}={}){
    let mess_obj = arguments[0]
    if (mess_obj === undefined) { mess_obj = {} }
    else if((typeof(mess_obj) == "object") && mess_obj.hasOwnProperty("message")) {} //leave it alone for now
    else { mess_obj = {val: mess_obj} }//even if mess_obj isn't a string this is ok. We fix that below

    //fill in defaults. Careful: Smarter ways to do this generate garbage.
    if(!mess_obj.message)   { mess_obj.message   = message }
    if (typeof(mess_obj.message) != "string"){ //if its not a string, its some data structure so make it fixed width to demonstrate code. Plus the json pretty printing doesn't work unless if its not fixed width.
        if(window["stringify_value"]) { mess_obj.message = stringify_value(mess_obj.message) }
        else { mess_obj.message = stringify_value_cheap(mess_obj.message) } //hits in browser
    }
    //if(!mess_obj.color) { mess_obj.color = color }
    //if(!mess_obj.code)  { mess_obj.code  = code }
    mess_obj.type = "chat"
    //end type-specific
    if(!mess_obj.to)     { mess_obj.to = to }
    if(!mess_obj.get_result) { mess_obj.get_result = get_result }
    Messaging.send(mess_obj)
}

Messaging.chat_receive = function(mess_obj){
   if(!Messaging.dialog_showing()) { //messaging dialog is down}
        Messaging.show_dialog()
        setTimeout(function(){ //give show_dialog a chance to come up, then add the new message.
           Messaging.chat_receive_aux(mess_obj)
        }, 300)
    }
    else { Messaging.chat_receive_aux(mess_obj) }
}

Messaging.chat_receive_aux = function(mess_obj){
    messaging_dialog_to_id.value = mess_obj.from
}

Messaging.eval = function({source=null, callback=out, pass_to_callback="evaled_result",
                           to=Messaging.successful_last_send_to, get_result=true}={}){
    let mess_obj = arguments[0]
    if (mess_obj === undefined) { mess_obj = {} }
    if(typeof(mess_obj) == "string"){ mess_obj = {source: mess_obj} }

    //type-specific set-up
    if(!mess_obj.source) {mess_obj.source == source}
    if(!mess_obj.source) { //required.
        dde_error("Attempt to send Messaging.eval but no source provided to run.")
    }
    if(!mess_obj.callback) {mess_obj.callback = callback}
    //all callback checking done in Messaging.add_time_to_callback_maybe
    if(!mess_obj.pass_to_callback) { mess_obj.pass_to_callback = pass_to_callback }
    if(!["evaled_result", "unevaled_result", "mess_obj", "source", "callback", "pass_to_callback", "to", "from", "get_result"].includes(mess_obj.pass_to_callback)) {
        dde_error("Messaging.eval, pass_to_callback is: " + mess_obj.pass_to_callback +
                  "<br/>which is not one of the valid: " + ["evaled_result", "unevaled_result", "mess_obj"])
    }
    //end type-specific
    mess_obj.type = "eval"
    if(!mess_obj.to)     { mess_obj.to = to }
    if(!mess_obj.get_result) { mess_obj.get_result = get_result }
    Messaging.send(mess_obj)
}

Messaging.eval_receive = function(mess_obj){
    let source = mess_obj.source
    let result
    try { result = eval(source) }
    catch(err) {
        result = "Error: in Messaging.eval_receive with source: " + source +
            "<br/>" + err.message
    }
    mess_obj.result = to_source_code({value: result})
}

//job_instruction
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
                                         if_no_job="define_start",    //also can be "error"
                                         to=Messaging.successful_last_send_to,
                                         get_result=false}={}){
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
        try{ instr_obj = eval(mess_obj.do_list_item) } //todo questionable due to potential side effects.
            //user *could* eval on their own to do this test.
        catch(err){
            dde_error("Messaging.job_instruction passed do_list_item string of: " + mess_obj.do_list_item +
                "<br/>that errors when evaled with: " + err.message)
        }
        if(!Instruction.is_do_list_item(instr_obj)) {
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
    else if (mess_obj.job_name.startsWith("Job.")) {
        mess_obj.job_name = mess_obj.job_name.substring(0, 4)
    }

    if(mess_obj.if_no_job == undefined) { mess_obj.if_no_job = if_no_job }
    if(!["define_start", "error"].includes(mess_obj.if_no_job)){
        dde_error("Messaging.job_instruction, has invalid if_no_job of: " + mess_obj.if_no_job +
            "<br>Valid values are: " + ["define_start", "error"])
    }
    //end type specific
    mess_obj.type = "job_instruction"
    if(!mess_obj.to)     { mess_obj.to = to }
    if(!mess_obj.get_result) { mess_obj.get_result = get_result }
    Messaging.send(mess_obj)
}

//only send a message back to the sender if there's an error
Messaging.job_instruction_receive = function(mess_obj){
    let instr = Messaging.valid_instruction_or_error_string(mess_obj.do_list_item)
    if(typeof(instr) == "string") { //got an error
        mess_obj.result = instr
    }
    else { //instr is good, but is job_name?
        let job_name = mess_obj.job_name
        //the job_name is not "default"
        if(Job[job_name]) { // the job is defined
            //even if job_instance does not have when_stopped = "wait"
            //then still do this. Job might have initial stuff to run,
            //job might be in a loop, and we just want this instr run after the loop is done.
            let job_instance = Job[job_name]
            if(job_instance.is_active()) {
                Job.insert_instruction(instr, {job: job_instance, offset: "end"})
            }
            else { //job is defined but not active. We want to, for this job starting only, stick the
                //instr on the end of the do_list and start it, so use start.
                var new_do_list = job_instance.orig_args.do_list.slice(0)
                new_do_list.push(instr)
                job_instance.start({do_list: new_do_list})
            }
        }
        //job_name is not already defined
        else if(mess_obj.if_no_job == "define_start"){ //stop existing job, redefine it with a "wait" and start it off
            new Job({name: job_name,
                when_stopped: "wait",
                do_list: []}) //do not put instr in here because we'll define this job, then if we stop it,
            // then call job_instructing again. we don't want to re-run that orig instr that came in
            //when we defined the job. So stick the instr in the start options for do_list,
            //and it won't become a permient part of the job.
            setTimeout(function(){  //because new Job might run into an existing Job.wait_for_message
                //that it has to shut down
                Job[job_name].start({do_list: [instr]}) //success!
            }, 200)
        }
        else { //job_name is not defined, and  mess_obj.if_no_job is "error"
            let result = "Error: Messaging.job_instruction_receive passed job_name of " + job_name +
                         '<br/>That job is not defined and if_no_job is "error".<br/>'
                         'so the job was not started.'
            mess_obj.result = result
        }
    }
}

Messaging.out = function({val="test message", color="black", temp=false, code=null,
                          to=Messaging.successful_last_send_to, get_result=false}={}){
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
    if(!mess_obj.get_result) { mess_obj.get_result = get_result }
    Messaging.send(mess_obj)
}

Messaging.out_receive = function(mess_obj){
    out(mess_obj.val,
        mess_obj.color,
        mess_obj.temp,
        mess_obj.code)
}

Messaging.ping_callback = function(mess_obj){
    let now_us = time_in_us()
    let start_time_us = mess_obj.send_time_us
    let send_to_receive_dur = mess_obj.result - start_time_us
    let receive_to_send_dur = now_us - mess_obj.result
    let round_trip_dur = now_us - start_time_us
    let round_trip_from_sum = send_to_receive_dur + receive_to_send_dur
    let clock_skew_dur = round_trip_dur - round_trip_from_sum
    out("<table>" +
        "<tr><td><b>Ping</b> to</td><td>"                           + mess_obj.from       + "</td></tr>" +
        "<tr><td>left at</td><td style='text-align:right;'>"        + start_time_us       + "</td></tr>" +
        "<tr><td>arrived at</td><td style='text-align:right;'>"     + mess_obj.result     + "</td></tr>" +
        "<tr><td>arrival dur</td><td style='text-align:right;'>"    + send_to_receive_dur + "</td></tr>" +
        "<tr style='background-color:black;'><td> </td><td> </td></tr>" +
        "<tr><td>returned at</td><td style='text-align:right;'>"    + now_us              + "</td></tr>" +
        "<tr><td>return dur</td><td style='text-align:right;'>"   + receive_to_send_dur + "</td></tr>" +
        "<tr><td>round trip dur</td><td style='text-align:right;'>" + round_trip_dur      + "</td></tr>" +
        "<tr><td>clock skew dur</td><td style='text-align:right;'>" + clock_skew_dur      + "</td></tr>" +
        "</table>")
}

//keep callback as a string so that it will display as such in the Messages pane.
Messaging.ping = function({callback="Messaging.ping_callback",
                           to=Messaging.successful_last_send_to, get_result=true}={}){
    let mess_obj = arguments[0]
    if(!mess_obj.callback) {mess_obj.callback = callback}
    //all callback checking done in Messaging.add_time_to_callback_maybe
    mess_obj.type = "ping"
    Messaging.send(mess_obj)
}

Messaging.ping_receive = function(mess_obj){
    mess_obj.result = time_in_us()
}

Messaging.speak = function({speak_data = "hello", volume = 1.0, rate = 1.0, pitch = 1.0,
                            lang = "en_US", voice = 0,
                            to=Messaging.successful_last_send_to, get_result=false}={}){
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
    if(!mess_obj.get_result) { mess_obj.get_result = get_result }
    Messaging.send(mess_obj)
}

Messaging.speak_receive = function(mess_obj){
    speak({speak_data: mess_obj.speak_data, volume: mess_obj.volume,
          rate: mess_obj.rate , pitch: mess_obj.pitch,
          lang: mess_obj.lang, voice: mess_obj.voice})
}




Messaging.start_job = function({job_name=null, start_options={}, if_started="ignore",
                                callback=null,
                                to=Messaging.successful_last_send_to, get_result=true}={}){
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
    else if(mess_obj.job_name.startsWith("new Job(")){} //ok job def is on sender
    else if(file_exists(mess_obj.job_name)) { //job def is on sender
        let jobs_in_file = Job.instances_in_file(mess_obj.job_name)
        if(jobs_in_file.length > 0) { mess_obj.job_name = to_source_code({value: jobs_in_file[0]}) }
        else {
            dde_error("Messaging.start_job has a job_name that's a path to an existing file: " + mess_obj.job_name + "<br/>" +
                "but that file doesn't define any jobs.")
        }
    }
    else if(is_string_an_identifier(mess_obj.job_name)){  //job def is on receiver
         mess_obj.job_name = job_name
    }
    else {
        dde_error("Messaging.start_job called with job_name: <br/>" + mess_obj.job_name +
                  "<br/>but the job_name does not define a Job.<br/>" +
                  'It should "new Job({...})" or a Job name like "my_job".' +
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
    if(!mess_obj.if_started) {  mess_obj.if_started = if_started }
    if(!["ignore", "error", "restart"].includes(mess_obj.if_started)) {
        dde_error('Messaging.start_job passed if_started of: "' + mess_obj.if_started +
                  '" which is not one of the valid values of: ' +
                  '<br/>' + '"ignore", "error", "restart" .')
    }
    if(!mess_obj.callback) {mess_obj.callback = callback}
    //all callback checking done in Messaging.add_time_to_callback_maybe
    //end type-specific
    mess_obj.type = "start_job"
    if(!mess_obj.to)     { mess_obj.to = to }
    if(!mess_obj.get_result) { mess_obj.get_result = get_result }
    Messaging.send(mess_obj)
}


Messaging.start_job_receive = function(mess_obj){
    let job_name = mess_obj.job_name
    let job_instance
    if     (job_name.startsWith("new Job(")) {
        try { job_instance = eval(job_name) }
        catch(err){
            mess_obj.result = "Error: Messaging.start_job_receive has job_name of: " + job_name +
                          "<br/>but evaling that got error: " + err.message
            return
        }
    }
    else if(is_string_an_identifier(job_name)) {
        job_instance = Job[job_name]
    }
    else {
        mess_obj.result = "Error: Messaging.start_job_receive has a job_name of: " + job_name +
                          "<br/>that isn't Job source code or a Job name."
        return
    }
    if(!(job_instance instanceof Job)) {
        mess_obj.result = "Error: Messaging.start_job_receive has a job_name of: " + job_name +
                          "<br/>but that doesn't refer to a job, rather: " + job_instance
        return
    }

    let start_options
    try { eval("start_options = " + mess_obj.start_options) }
    catch(err){
        mess_obj.result = "Error: Messaging.start_job_receive error when evaling start_options of:<br/>" +
            mess_obj.start_options +
            err.message
        return
    }
    //below here all the clauses set result
    let status_code = job_instance.status_code
    if      (status_code == "starting")  { mess_obj.result = "The Job was already starting."} //just let continue starting
    else if (status_code == "suspended") {
        job_instance.unsuspend()
        mess_obj.result = "The Job was unsuspended."
    }
    else if (["running", "waiting", "running_when_stopped"].includes(status_code)){
        if     (mess_obj.if_started == "ignore") { mess_obj.result = "The Job is already running."} //just let keep running
        else if(mess_obj.if_started == "error")  {
            let error_message = "Messaging.start_job_receive tried to start job: " +
                                 job_instance.name + " but it was already started." +
                                 '<br/>Because if_started == "error", the job was stopped with an error.'
            job_instance.stop_for_reason("errored", error_message)
            mess_obj.result = "Error: " + error_message
        }
        else if (mess_obj.if_started == "restart"){
            job_instance.stop_for_reason("interrupted",
                "interrupted by start_job instruction in " + job_instance.name)
            mess_obj.dont_send_back_result = true //unusual. Read by user_receive_callback_permit to supress normal calling of send_back_result
            mess_obj.result = "The Job was stopped and restarted."
            setTimeout(function(){
                         job_instance.start(start_options)
                         Messaging.send_back_result_maybe(mess_obj)
                       },
                       Math.max(200, mess_obj.start_options.inter_do_item_dur * 2))
            return
        }
        else { //if_started is tested for validity in the constructor, but just in case...
            mess_obj.result = "Error: Messaging.start_job_receive for Job." + job_instance.name +
                              " has an invalid " +
                              "<br/> if_started value of: " + mess_obj.if_started +
                              '<br/> use "ignore", "error" or "restart" instead.'
        }
    }
    else if (["not_started", "completed", "errored", "interrupted"].includes(status_code)) {
        job_instance.start(start_options)
        mess_obj.result = "The stopped job is being started."
    }
    else {
        mess_obj.result = "Error: Messaging.start_job_receive got a status_code from Job." +
                           job_instance.name + " that it doesn't understand."
    }
}

Messaging.stop_job = function({job_name,
                               reason=null,
                               perform_when_stopped=true,
                               callback=null,
                               to=Messaging.successful_last_send_to,
                               get_result=true}={}){
    let mess_obj = arguments[0]
    if (mess_obj === undefined) { mess_obj = {} }
    if(typeof(mess_obj) == "string"){ mess_obj = {job_name: mess_obj} }

    //type-specific set-up
    if(!mess_obj.job_name) {mess_obj.job_name == job_name}
    if(!mess_obj.job_name) { //required.
        dde_error("Attempt to send Messaging.start_job but no job_name provided for the Job.")
    }
    else if (!is_string_an_identifier(mess_obj.job_name)) {
        dde_error("In Messaging.stop_job, " + mess_obj.job_name +
                  "<br/>is not the right syntax for a Job name.")
    }
    if(!mess_obj.reason) { mess_obj.reason = reason }
    if(!(mess_obj.reason === null) && !(typeof(mess_obj.reason) === "string")){
        dde_error("Messaging.stop_job, reason is: " + mess_obj.reason +
                  "<br/> but should be a string or null.")
    }
    if(!mess_obj.perform_when_stopped) { mess_obj.perform_when_stopped = perform_when_stopped }
    if(typeof(mess_obj.perform_when_stopped) !== "boolean"){
        dde_error("Messaging.stop_job, perform_when_stopped is: " + mess_obj.perform_when_stopped +
            "<br/> but should be true or false.")
    }
    if(!mess_obj.callback) {mess_obj.callback = callback}
    //all callback checking done in Messaging.add_time_to_callback_maybe
    //allow no callback
    //end type-specific
    mess_obj.type = "stop_job"
    if(!mess_obj.to)         { mess_obj.to = to }
    if(!mess_obj.get_result) { mess_obj.get_result = get_result }
    Messaging.send(mess_obj)
}

Messaging.stop_job_receive = function(mess_obj){
    let job_name = mess_obj.job_name
    let job_instance
    if(is_string_an_identifier(job_name)){
        job_instance = Job[job_name]
        if(!(job_instance instanceof Job)) {
            mess_obj.result  = "Error: Messaging.stop_job_receive passed job_name of: " + mess_obj.job_name +
                "<br/>but that isn't the name of a Job."
            return
        }
    }
    else {
        mess_obj.result  = "Error: Messaging.stop_job_receive passed job_name of: " + mess_obj.job_name +
                           "<br/>but that isn't valid syntax for the name of a Job."
        return
    }
    let instr = Control.stop_job(undefined,
                                 "Stopped by Messaging.stop_job_receive from: " + mess_obj.from,
                                 mess_obj.perform_when_stopped)
    if (["starting", "running", "waiting", "running_when_stopped"].includes(job_instance.status_code)){
        job_instance.insert_single_instruction(instr, false) //not a sub-instruction
        mess_obj.result = "Stopping Job."
    }
    else {mess_obj.result = "The Job is already stopped."}
}

Messaging.get_variable = function({variable_name,
                                    job_name=null,
                                    eval_kind="JSON", //other options "null", "eval"
                                    callback="out",
                                    pass_to_callback="evaled_result",
                                    to=Messaging.successful_last_send_to,
                                    get_result=true}) {
     let mess_obj = arguments[0]
     if (mess_obj === undefined) { mess_obj = {} }
     if((variable_name === undefined) ||
         (typeof(variable_name) !== "string") ||
         (variable_name.length === 0)) {
         dde_error("Messaging.get_variable passed an invalid variable_name of: " + variable_name +
             ".<br/>This must be a non-empty string<br/> " +
             "of a variable name or variable names separated by dots.")
     }

     if(job_name === null) { } //ok, means we are setting  a global variable or path.
     else if(!Job[job_name]){
        Messaging.debug("Messaging.get_variable called with a job_name of: " + job_name +
            "<br/> No such job on the sending DDE. " +
            "<br/>This is actually OK, but beware, the job must be defined in the receiving DDE.")
     }

     if(["null", "JSON", "eval"].includes(eval_kind)) {} //OK as is
     else if (eval_kind === null) { eval_kind = "null" }
     else if (eval_kind === JSON) { eval_kind = "JSON" }
     else if (eval_kind === eval) { eval_kind = "eval" }
     else { dde_error("Messaging.get_variable passed eval_kind of: " + eval_kind +
         '<br/>but the only valid values are: "null", "JSON" and "eval".')
     }
    if(!mess_obj.callback) {mess_obj.callback = callback}
    //all callback checking done in Messaging.add_time_to_callback_maybe
    if(!mess_obj.pass_to_callback) { mess_obj.pass_to_callback = pass_to_callback }
    if(!mess_obj.to)               { mess_obj.to = to }
    if(!mess_obj.get_result)       { mess_obj.get_result = get_result }
    mess_obj.type = "get_variable"
    Messaging.send(mess_obj)
}

Messaging.get_variable_receive = function(mess_obj){
    let path_prefix
    if(mess_obj.job_name) { path_prefix = "Job." + mess_obj.job_name + ".user_data." }
    else { path_prefix = "global."   }
    let full_path = path_prefix + mess_obj.variable_name
    let result_val = value_of_path(full_path)
    let result_str
    //Allow undefined to be the value received on the other end. Handle special case is if it was JSON because broken JSON can't handle undefined
    if(result_val === undefined) { result_str = "undefined" } //"Error: Messaging.get_variable_receive attempted to get value of: " + full_path +
                                                              // "<br/>but that is undefined."
    else if(mess_obj.eval_kind === "JSON") { result_str = JSON.stringify(result_val) }
    else                                   { result_str = to_source_code({value: result_val}) }
    mess_obj.result = result_str
}

/*
new_value can be undefined, and if so, it uses undefined as the new value for the var
regardless of eval_kind.
I decided NOT to support "deleting a variable" with set_variable
via some new_vlaue like "_delete_" because its rarely used,
denies the capability to use the string as the actua lnew value,
and is rarely needed. You can use "Messaging.eval" to delete a var.
Most of the time using undefined as the new vale has the same effect as deleting the var,
but note: {foo: undefined}.hasOwnProperty("foo") will return true.
 */
Messaging.set_variable = function({variable_name,
                                   new_value,
                                   job_name=null,
                                   eval_kind="JSON", //other options "null", "eval"
                                   to=Messaging.successful_last_send_to,
                                   get_result=false
                                  }){
    if((variable_name === undefined) ||
       (typeof(variable_name) !== "string") ||
       (variable_name.length === 0)) {
        dde_error("Messaging.set_variable passed an invalid variable_name of: " + variable_name +
                  ".<br/>This must be a non-empty string<br/> " +
                  "of a variable name or variable names separated by dots.")
    }
    if(["null", "JSON", "eval"].includes(eval_kind)) {} //OK as is
    else if (eval_kind === null) { eval_kind = "null" }
    else if (eval_kind === JSON) { eval_kind = "JSON" }
    else if (eval_kind === eval) { eval_kind = "eval" }
    else { dde_error("Messaging.set_variable passed eval_kind of: " + eval_kind +
                     '<br/>but the only valid values are: "null", "JSON" and "eval".')
    }
    if((new_value === undefined) || (new_value === "undefined")) {
        new_value = "undefined"
       // eval_kind = "eval" semantically correct, as eval("undefined") => undefined
       // but a user's permit might want to restrict using set_variable with eval_kind of "eval",
       //and this is a harmless use of eval so just have the convention that
       //if the new_value is undefined or "undefined", it doesn't matter what the
       //eval_kind is, the actual new value set is undefined.
    }
    //else if (typeof(new_value) === "string") { } //just leave it. NO DON'T wrap extra set of quotes so it decodes properly
    else if (eval_kind === null)   { new_value = "" + new_value }
    else if (eval_kind === "JSON") { new_value = JSON.stringify(new_value) }
    else if (eval_kind === "eval") { new_value = to_source_code({value: new_value}) }
    else { shouldnt("Messaging.set_variable passed in eval_kind is: " + eval_kind +
                    "<br/>but that invalid eval_kind should have been caught eariler.") }
    if(job_name === null) { } //ok, means we are setting  a global variable or path.
    else if(!Job[job_name]){
        Messaging.debug("Messaging.set_variable called with a job_name of: " + job_name +
                        "<br/> No such job on the sending DDE. " +
                        "<br/>This is actually OK, but beware, the job must be defined in the receiving DDE.")
    }
    let mess_obj = {type: "set_variable",
                    variable_name: variable_name,
                    new_value: new_value,
                    job_name: job_name,
                    eval_kind: eval_kind,
                    to: to,
                    get_result: get_result }
    Messaging.send(mess_obj)
}

Messaging.set_variable_receive = function(mess_obj){
    let new_val_src = mess_obj.new_value
    let new_val
    if     (new_val_src === "undefined") { new_val = undefined }
    else if(mess_obj.eval_kind === null) { new_val == new_val_src }
    else if(mess_obj.eval_kind === "JSON") {
          try{new_val = JSON.parse(new_val_src)}
          catch(err){
              mess_obj.result = "Error: Messaging.set_variable_receive attempted to JSON.parse new_value of: " + new_val_src +
                           "<br/>but that errored with: " + err.message
              return
          }
    }
    else if(mess_obj.eval_kind === "eval") {
        try{ eval("new_val = " + new_val_src)}
        catch(err) {
            mess_obj.result = "Error: Messaging.set_variable_receive attempted to eval new_value of: " + new_val_src +
                         "<br/>but that errored with: " + err.message
            return
        }
    }
    let var_name_array = mess_obj.variable_name.split(".")
    let obj_to_set
    if(mess_obj.job_name) {
        obj_to_set = Job[mess_obj.job_name]
        if(!obj_to_set) {
            mess_obj.result = "Error: In Messaging.set_variable_receive, Job." + mess_obj.job_name + " isn't defined."
            warning(mess_obj.result)
            return
        }
        else { obj_to_set = obj_to_set.user_data }
    }
    else { obj_to_set = global }
    //set obj_to_set to the path parts except for the last one.
    // If path-parts don't exist, create them. as js lit objs when necessary
    for(let i = 0; i < (var_name_array.length - 1); i++){
        let var_path_part = var_name_array[i]
        if(obj_to_set.hasOwnProperty(var_path_part)) {
            obj_to_set = obj_to_set[var_path_part]
        }
        else {
            obj_to_set[var_path_part] = {}
            obj_to_set = obj_to_set[var_path_part]
        }
    }
    let final_path_part = var_name_array[var_name_array.length - 1]
    obj_to_set[final_path_part] = new_val //do the real work
}

//returns an array of active jobs that are waiting, could be length 0, 1, or more than one.
//only if 1 is returned is that really the valid default job.
//but return the list so we can give user a good error message.
/* deemed too confusing. No longer called.
Messaging.default_jobs = function(){
    let result = []
    for(let job_instance of Job.active_jobs()){
         if(job_instance.when_stopped === "wait") {
             result.push(job_instance)
         }
    }
    return result
}
*/

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




//______receive____________
//call receive right after login succeeds
Messaging.receive = function(){
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
    if(window.mess_stat_request_indicator_id){
        mess_stat_request_indicator_id.style["background-color"] = "#0F0"
        setTimeout(function(){ //turns off the green light after half  a sec.
                    if(window.mess_stat_request_indicator_id) {
                        mess_stat_request_indicator_id.style["background-color"] = "#DDD"
                    }
                  }, 500)
    }
}

Messaging.receive_callback = function(res){
    Messaging.debug("Messaging.receive_callback statusCode: " + res.statusCode)
    let data_string = "" //closed over in on_data and on_end
    res.on('data', function(data) {
        data_string += data.toString()
    })
    res.on("end", function(){
        let dur = time_in_us() - Messaging.last_send_time_us //only used in debugging
        if(Messaging.is_logged_in) {
            Messaging.debug("Messaging is auto_refreshing for: " + Messaging.user)
            Messaging.receive()
        }
        //else allow to logout
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
        else if((res.statusCode === 200) || (res.statusCode === 304)){
            Messaging.debug("dur between send and receive: " + dur + "us")
            let prefix_length = "BOSCin message:".length //shouldn't this be BOSCout???
            let content_data_string = data_string.substring(prefix_length)
            let from = res.headers.from_user
            Messaging.user_receive_callback(content_data_string, from)
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
//permit a received message to run
Messaging.permit_default = function(mess_obj){
    if(mess_obj.result !== undefined) { return true } //when you've requested a result, this prop will be bound, so permit it because you asked for it.
    else if (mess_obj.from === Messaging.user) { return true } //run anything you send to yourself
    else if (mess_obj.type == "eval") { return "manual" } //the receiving user gets a "run" button that they can click on if they like, to run it
    else if (["chat", "job_instruction", "out", "ping", "speak", "start_job", "stop_job"].includes(mess_obj.type)) {
            return true }
    else if ((mess_obj.type == "get_variable") && mess_obj.job_name) { return true }
    else if ((mess_obj.type == "set_variable") &&
              mess_obj.job_name &&
            ((mess_obj.eval_kind == "null") || (mess_obj.eval_kind == "JSON"))) { return true }
    else { return "manual" }
}
Messaging.permit = Messaging.permit_default
//else if(["eval", "set_variable"].includes(mess_obj.type)) { return false }
// set_variable takes new_value_source that is evaled.


Messaging.user_receive_callback = function(data_string, from){
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
        //eval("mess_obj = " + data_string) //JSON.parse(data_string) can't use JSON.parse at least due to embedding single AND double quotes for strings
        mess_obj = JSON.parse(data_string) //does JSON.parse handle all fields of all messages?
        mess_obj.from = from
        let do_permit = Messaging.permit(mess_obj)
        if      (do_permit === true)     { Messaging.user_receive_callback_permit(mess_obj, false) }
        else if (do_permit === "manual") { Messaging.smart_append_to_sent_messages(mess_obj, false, "manual")}
        else if (do_permit === false)    {
            mess_obj.result = "Error: Message of type: " + mess_obj.type +" from: " + mess_obj.from +
                              "<br/>not permitted to run by receiver."
            Messaging.send_back_result_maybe(mess_obj)
        }
    }
}
//______end receive________
Messaging.dialog_insert_action = function(){
    let src = Messaging.new_message_to_source()
    src = "\n" + src + "\n"
    Editor.insert(src, "selection_start")
}

Messaging.new_message_to_source = function(){
    let type = messaging_dialog_type_id.value
    let result = "Messaging." + type + "("
    let body = messaging_dialog_message_id.value.trim()
    let to = messaging_dialog_to_id.value
    let get_result = get_result_id.checked
    if(body.startsWith("{")) {
        body = body.substring(1) //cut off the "{"
        body = body.substring(0, body.length - 1).trim() //cut off final "}" and possibly newline or space before it
        body += ',\n  to: "' + to +
                '",\n  get_result: ' + get_result
        result += "{\n  " + body + "}"
    }
    else {
        let mess_obj = Messaging.mess_type_to_mess_obj(type, body)
        mess_obj.to = to
        mess_obj.get_result = get_result
        let mess_obj_src = to_source_code({value: mess_obj})
        mess_obj_src = mess_obj_src.substring(1) // cut off the opening curly
        mess_obj_src = "{\n " + mess_obj_src
        mess_obj_src = replace_substrings(mess_obj_src, "\n ", "\n        ")
        result += mess_obj_src
    }
    result += ")"
    return result
}

Messaging.mess_type_to_mess_obj = function(mess_type, main_arg_string=null, include_type=false){
    let fn = Messaging[mess_type]
    let mess_obj = function_param_names_and_defaults_lit_obj(fn)
    let params = Object.keys(mess_obj)
    for(let param of params) {
        eval("mess_obj[param] = " + mess_obj[param]) //reduces "null" to null, ""foo"" to "foo"
         //we need to set inside of the eval due to JS broken eval wherein if the
         //mess_obj[param] evals to "{}"}, as it does in start_job for the start_options,
         //eval would just return undefined, UNLESS we bind it to a var.
         //this only ever evals built-in Messaging code, never user code.
    }
    if(main_arg_string && (main_arg_string != "")) {
        let main_arg_name = params[0]
        mess_obj[main_arg_name] = main_arg_string
    }
    if(include_type) { mess_obj.type = mess_type }
    return mess_obj
}

Messaging.mess_type_to_main_arg_name = function(mess_type){
    let fn = Messaging[mess_type]
    let mess_obj = function_param_names_and_defaults_lit_obj(fn)
    let params = Object.keys(mess_obj)
    return params[0]
}

//returns true or false
Messaging.mess_type_to_get_result_default = function (type){
    return Messaging[type].toString().includes("get_result=true")
}

Messaging.mess_obj_to_main_arg_name = function (mess_obj){
    return Object.keys(mess_obj)[0]
}



//content for the new message text area  when a mess_type is chosen
Messaging.template_for_mess_type = function(mess_type){
    let result = ""
    let fn = Messaging[mess_type]
    let lit_obj = function_param_names_and_defaults_lit_obj(fn)
    let param_names = Messaging.params_for_mess_obj_to_source(mess_type)
    if(param_names.length > 1){ //takes more than just one main_arg
        result = "{"
        let i = -1
        for(let param_name of  param_names) {
            i += 1
            let default_value = lit_obj[param_name]
            let trailing_comma = ((i == (param_names.length - 1)) ? "" : ",")
            result += param_name + ": " + default_value + trailing_comma + "\n"
        }
        return result += "}"
    }
    return result
}

//called from mess_obj_to_source and from Dialg box handler for "Send" at least.
Messaging.params_for_mess_obj_to_source = function(mess_obj_type,
                                                   skip_properties=["to", "from", "type", "get_result", "send_time_us"]){
    let param_names = function_param_names(Messaging[mess_obj_type])
    let result = []
    for(let param_name of param_names) {
        if(!skip_properties.includes(param_name)) { result.push(param_name) }
    }
    return result
}

Messaging.mess_obj_to_source = function(mess_obj,
                                        skip_properties=["to", "from", "type", "get_result", "send_time_us"],
                                        separator="<br/>",
                                        space="&nbsp;"){
    let all_param_names = Object.keys(mess_obj)
    let param_names =  [] //Messaging.params_for_mess_obj_to_source(mess_obj.type, skip_properties)
    //must do this before the NEXT for loop as we want to know when we get to the first and last that we're going to use
    for(let param_name of all_param_names) {
         if(!skip_properties.includes(param_name)){ param_names.push(param_name) }
    }
    //if(mess_obj.hasOwnProperty("result") && !param_names.includes("result")) { param_names.push("result") } // we really want this when returning a result of, say, eval
    let used_params_count = 0
    let result = "{"
    for(let i = 0; i < param_names.length; i++) {
            let param_name = param_names[i]
            let param_val = mess_obj[param_name]
            if((typeof(param_val) == "function") && (param_val.name.length > 0)){
                param_val = param_val.name
            }
            else {
                param_val = to_source_code({value: param_val}) //good for converting strings to lead with single or double quote, fine for false, null, etc
            }
            let sep = "," + separator
            let prefix
            if(i == 0) { prefix = "" }
            else       { prefix = space + space}
            if(i == (param_names.length - 1)) { sep = "" } //on last
            result += prefix + param_name + ': ' + param_val +
                      ((i == (param_names.length - 1)) ? "" : sep)
    }
    if(!mess_obj.callback && Messaging.get_time_to_callback(mess_obj)){ //add in callback
        let cb = Messaging.get_time_to_callback(mess_obj)
        if(typeof(cb) == "string") { cb = '"' + cb + '"' }
        else if(cb.name && (cb.name.length > 0)){
            cb = cb.name
        }
        else { cb = '`' + cb.toString() + '`' }
        result += "," +  separator + space + space + "callback: " + cb
    }
    result += "}"
    return result
}


Messaging.run_receive_mess_obj_history = []
//called internally for "manual" permit
Messaging.run_receive_button_action = function(mess_obj_index){
    let the_but = event.srcElement
    let already_clicked_on_button_color = "rgb(230, 179, 255)"
    if(the_but.style["background-color"] == already_clicked_on_button_color){
        warning("You've already run this message.<br/>It can only be run once.")
    }
    else {
        let mess_obj = Messaging.run_receive_mess_obj_history[mess_obj_index]
        delete mess_obj.result //just in case this is the 2nd time the user clicked the button.
                               //we want to get a new result, and we don't want user_receive_callback_permit
                               //to think there already IS a result.
        Messaging.user_receive_callback_permit(mess_obj, true)

        the_but.style["background-color"] = already_clicked_on_button_color //ie color it like a job button that's already completed.
        the_but.title = "This message has already been run.\nYou can only run it once."
        //let message_total_html = "<b>result: </b> <code>" + to_source_code({value: mess_obj.result}) + "</code><br/>"
        //Messaging.append_to_sent_messages(message_total_html)
        messaging_dialog_message_id.focus()
    }
}

// Called in the orig sender's DDE after getting the result mess_obj.
// Most of the work below is for the eval mess type, but any mess with a result will have this called.
// Contains a result field.
Messaging.call_callback = function(mess_obj){
    let callback_fn = Messaging.get_and_remove_time_to_callback(mess_obj)
    if(callback_fn) {
        if(typeof(callback_fn) === "function"){
            let arg_processing = mess_obj.pass_to_callback
            let arg = mess_obj
            if      (arg_processing === undefined)            { arg = mess_obj }
            else if (arg_processing === "mess_obj")           { arg = mess_obj }
            else if (arg_processing === "unevaled_result")    { arg = mess_obj.result }
            else if (arg_processing === "evaled_result")      {
                let eval_kind = mess_obj.eval_kind //only used by get_variable
                if(eval_kind === undefined) { eval_kind = "eval" }
                if      (eval_kind == "null") { arg = mess_obj.result }
                else if (eval_kind == "JSON") { arg = (mess_obj.result == "undefined") ? undefined : JSON.parse(mess_obj.result) }
                else if (eval_kind == "eval") {
                    if(Messaging.is_error(mess_obj)) { arg = mess_obj.result }
                    else {
                        try{ eval("arg = " + mess_obj.result) }
                        catch(err) {
                            dde_error("Messaging.call_callback, evaling the result of: " + mess_obj.result +
                                      "<br/>errored with: " + err.message)
                        }
                    }
                }
            }
            else if (mess_obj.hasOwnProperty(arg_processing)) { arg = mess_obj[arg_processing] }
            else {
                   let props = ""
                   for(let prop of Object.keys(mess_obj)){
                       props += '"' + prop + '", '
                   }
                   dde_error("Messaging.call_callback, the mess_obj.pass_to_callback of:<br/>" +
                             mess_obj.pass_to_callback + " is not valid.<br/>" +
                             "Use one of: " +  '"mess_obj", "unevaled_result", "evaled_result", "evaled_result"' +
                             "or a mess_obj property name such as: <br/>" + props)
            }
            callback_fn.call(undefined, arg) //the normal OK case
        }
        else {
            dde_error("In Messaging.user_receive_callback, the callback of: " + mess_obj.callback +
                "<br/> is not a function, but rather: "  + mess_obj.callback)
        }
    }
    else {
        warning("Messaging.receive_callback got: " + JSON.stringify(mess_obj) +
            "<br/> but there's no callback to call.")
    }
}

//mess_obj is permitted.
Messaging.user_receive_callback_permit = function(mess_obj, from_run_receive=false){
    if(from_run_receive) { //we're on the receiver's side and user just clicked run button
    //so we need to call again type_receive just as if a message came in that WAS permitted.
    //let this fall through to the end
    }
    else if(mess_obj.hasOwnProperty("result")) { //we're on the sender's side receiving the results of a requested result
        Messaging.send_done_for_get_result(mess_obj)
        return
    }
    else { //we're on the receiver side.
        let mess_obj_from_receive_cache = Messaging.get_from_cache(mess_obj, Messaging.mess_objs_that_were_received)
        if(mess_obj_from_receive_cache !== null){ //don't re-call the type_receive method, use mess_obj_from_receive_cache
              //with its result to send back. Beware that our mess_obj_from_receive_cache is
              //in the cache meaning it has already been sent back at least once,
              //but maybe it didn't make it all the way back to the sender yet, so this will be the
              //2nd thru nth sending
            if(mess_obj_from_receive_cache.hasOwnProperty("result")){
                Messaging.send_back_result_maybe(mess_obj_from_receive_cache)
            }
            else {
                shouldnt("In Messaging.user_receive_callback_permit, got mess_obj_from_receive_cache<br/>" +
                         "that doesn't have a result in it.")

            }
            return
        }
        //else {} //the normal case, message is not in the receive cache so first time, so do the work
    }
    //This is the main work.
    //We're on the receiver side. Either this is the first time we're getting this mess obj
    //from the sender, or user clicked the run button.
    //in either case we want to call type_receive, display result and,
    // if get_result==true, send back the result
    let type = mess_obj.type
    let meth_name = type + "_receive"
    if(!Messaging[meth_name]) {
        warning("Messaging.user_receive_callback passed unhandled message type: " + type +
                "<br/> in mess_obj: " + to_source_code({value: mess_obj}))
    }
    else {
        Messaging[meth_name].call(undefined, mess_obj) //do the real work
        if(mess_obj.get_result) {
            Messaging.mess_objs_that_were_received.push(mess_obj)
            if(!mess_obj.dont_send_back_result) {
                Messaging.send_back_result_maybe(mess_obj) //calls send which calls smart_append_to_sent_messages
                //this is the main call to send_back_result_maybe
            }
        }
        else { Messaging.smart_append_to_sent_messages(mess_obj, false ) }
    }
}


Messaging.show_dialog = function(){
    show_window({title: "DDE Messaging",
                 x: 400, y: 20, width: 400, height: 500,
                 background_color: "#ffecdc",
                 callback: "Messaging.show_dialog_cb",
                 content:
`<input id="messaging_login_button_id" type="button" id="messaging_dialog_login_button_id" value="` +
(Messaging.is_logged_in ? "logout" : "login")  +
 `" autofocus title="Log in (or out) to the Messaging server.&#13;Requires registration with Haddington."> 
  <b><span id="messaging_dialog_user_id">` +
((Messaging.is_logged_in && Messaging.user) ? Messaging.user : "") +
`</span></b>
<input name="print_debug_info" type="checkbox" data-onchange="true" style="margin-left:5px;"
            title="Cause process messages&#13;to be printed&#13;in the Output pane."/>print_debug_info
<input name="login_insert_js" type="button" value="insert JS" style="margin-left:5px;"
       title="Insert into DDE's editor buffer&#13;code to programmatically log in."/> 
<input name="stats" type="button" value="stats" style="margin-left:5px;"
       title="Show a dialog of statistics&#13;about Messaging network traffic."/>
<br/>
<i>Sent &amp; Received Messages:</i> 
<input name="clear" type="button" value="clear" style="float:right;"
       title="Remove the content&#13;of the Sent &amp; Received Messages pane."/><br/>
<div id="messaging_dialog_sent_messages_id" contentEditable="false" 
     onclick="onclick_for_click_help(event)"
     style="margin:5px; width:calc(100% - 20px); height:270px;background-color:white; padding:5px;overflow:auto;"></div>
<i>New Message:</i><br/>
type: <select id="messaging_dialog_type_id" style="font-size:14px;" data-onchange="true"
              title="The type of the message to send.">
              <option selected="true" value="chat" title='Make a message&#13;intended to be read&#13;by the person in the "to:" field.'>chat</option>
              <option value="eval" title="Make a message&#13;which contains JS Source&#13;that will be evaled&#13;in the 'to:' person's DDE.">eval</option>
              <option value="get_variable" title="Get the value of a variable&#13;in a Job's user data&#13;or a global variable&#13;in the 'to:' person's DDE.">get_variable</option>
              <option value="out"  title="Make a message&#13;which will render HTML&#13;into the 'to:' person's DDE Output pane.">out</option>
              <option value="job_instruction" title="Make an instruction&#13;which will run in a Job&#13;running on the 'to:' person's DDE.">job_instruction</option>
              <option value="ping" title="Measure the time to send a message.">ping</option>
              <option value="set_variable" title="Set a JS variable&#13;in the 'to:' person's DDE.">set_variable</option>
              <option value="speak" title="Cause provided text&#13;to be spoken&#13;in the 'to:' person's DDE.">speak</option>
              <option value="start_job" title="Start a Job&#13;in the 'to:' person's DDE.">start_job</option>
              <option value="stop_job" title="Stop a Job&#13;in the 'to:' person's DDE.">stop_job</option>
      </select> 
to: <input id="messaging_dialog_to_id" type="text" style="width:100px; margin-bottom:5px; font-size:14px;"
           title="The person to send this message to."/>
    <span title="If sending the message fails, checking this&#13;will automatically resend several times.&#13;The sender will also get back a result.">
          <input id="get_result_id" type="checkbox" data-onchange="true"/>get_result</span><br/>
  <div style="display:inline-block;">
    <input type="button" id="messaging_dialog_main_arg_name_id" style="margin-top:0px;max-width:60px;font-size:12px;padding:2px;" value="message"
           title='Toggle the new message representation between&#13;"All args" (show all message arguments) and &#13;"Main argument name" (show first arg only).'/> :<br/>
    <input type="button" style="margin:3px 0px 3px 1px; padding:2px; font-size:12px;" value="Insert"
           title="Insert the source code&#13;of this new message&#13;into the editor buffer."/><br/>
    <input type="button" value="Send" style="font-size:12px;padding:2px;"
           title="Send this message&#13;to the person in the 'to:' field."/>
  </div>
    <textarea id="messaging_dialog_message_id" style="width:290px;height:63px;font-size:14px;background-color:#ECC"
               placeholder="Enter a message to send."
               onclick="onclick_for_click_help(event)"
               ></textarea>
</div>
`
})
}

Messaging.dialog_showing = function(){
     return (global.messaging_dialog_sent_messages_id ? true : false)
}

Messaging.show_dialog_cb = function(vals){
    //out(vals)
    if(vals.clicked_button_value == "messaging_login_button_id") {
        if(messaging_login_button_id.value == "login"){
            Messaging.show_login_dialog()
        }
        else {
            Messaging.logout()
            Messaging.dialog_login_success(false)
        }
    }
    else if(vals.clicked_button_value == "print_debug_info"){
        if(vals.print_debug_info){ Messaging.print_debug_info = "true" }
        else                     { Messaging.print_debug_info = "false" }
        messaging_dialog_message_id.focus()
    }
    else if(vals.clicked_button_value == "login_insert_js") {
        let pass = (Messaging.show_password ? Messaging.password : "xxx")
        let result = (Messaging.print_debug_info ? "Messaging.print_debug_info = true\n" : "")
        result += 'Messaging.login({user: "' + Messaging.user + '", pass: "' + pass + '"})\n'
        Editor.insert(result)
        messaging_dialog_message_id.focus()
    }
    else if(vals.clicked_button_value == "stats") {
        MessStat.show_report()
    }
    else if(vals.clicked_button_value == "clear") {
        messaging_dialog_sent_messages_id.innerHTML = ""
        messaging_dialog_message_id.focus()
    }
    else if (vals.clicked_button_value == "messaging_dialog_type_id"){
        //we dopn't want to change whether the message is showing
        //all args, or the main arg value.
        //but if we are showing the main arg, we're
        //goiogn to have to change the NAME of the main arg.
        let type = vals.messaging_dialog_type_id
        open_doc("Messaging." + type + "_doc_id")
        let message = messaging_dialog_message_id.value.trim()
        if(!message.startsWith("{"))  { //just leave the message alone,
           //maybe it will be useful as is in the new type
           let main_arg_name = Messaging.mess_type_to_main_arg_name(type)
           messaging_dialog_main_arg_name_id.value = main_arg_name
        }
        else { //message starts with "{"
               // main_arg_name button label *should* be "All args"
            let new_main_arg_name = Messaging.mess_type_to_main_arg_name(type)
            messaging_dialog_main_arg_name_id.value = "All args" //just insurance
            let colon_pos = message.indexOf(":")
            if(colon_pos == -1) { return } //give up, bad syntax
            let comma_pos = message.indexOf(",", colon_pos)
            if(comma_pos == -1) {
                comma_pos = message.indexOf("}", colon_pos)
                if(comma_pos == -1) { return } //give up, bad syntax
            }
            let old_main_arg_value = message.substring(colon_pos + 1, comma_pos).trim()
            if(starts_with_one_of(old_main_arg_value, '"', "'", "`")) { //strip off quotes or we get too many off them when calling mess_obj_to_source
                old_main_arg_value = old_main_arg_value.substring(1, old_main_arg_value.length - 1)
            }
            let new_mess_obj = Messaging.mess_type_to_mess_obj(type, old_main_arg_value)
            let new_message = Messaging.mess_obj_to_source(new_mess_obj, undefined, "\n", " ")
            messaging_dialog_message_id.value = new_message
            messaging_dialog_message_id.focus()
        }
        let get_result_new_val = Messaging.mess_type_to_get_result_default(type)
        get_result_id.checked = get_result_new_val //this isn't ALWAYS what you want,
         //and changing a user checkbox val automatically will be unexpected by a user,.
         //but the greater danger is they choose a type that nearly always should
         //have one val or the other for get_result and they forget to change it
         //when they change the type
    }
    else if (vals.clicked_button_value == "get_result_id"){
        open_doc("Messaging.get_result_doc_id")
    }
    else if (vals.clicked_button_value == "messaging_dialog_main_arg_name_id") {
        let main_arg_name = messaging_dialog_main_arg_name_id.value
        let type = vals.messaging_dialog_type_id
        let message = vals.messaging_dialog_message_id.trim() //main arg val
        if(main_arg_name == "All args"){
            let mess_obj
            if(message.startsWith("{")) {
                try{ eval("mess_obj = " + message) }
                catch(err){
                    warning("The message source is not valid syntactically.<br/>" +
                            "Fix it or delete it to cbange to representing the main argument.<br/>"  + err.message)
                }
                let new_main_arg_name = Messaging.mess_obj_to_main_arg_name(mess_obj)
                messaging_dialog_main_arg_name_id.value = new_main_arg_name
                messaging_dialog_message_id.value = mess_obj[new_main_arg_name]
            }
            else if(message.length == 0){
                let new_main_arg_name = Messaging.mess_type_to_main_arg_name(type)
                messaging_dialog_main_arg_name_id.value = new_main_arg_name
                //just leave the message textarea empty.
            }
            else {
                warning("The message source is not valid syntactically.<br/>" +
                        "Fix it or delete it to cbange to representing the main argument.<br/>")
            }
        }
        else {//switching from a main_arg_name format to the full "All" format
           let mess_obj = Messaging.mess_type_to_mess_obj(type, message, false) //don't include type
           let mess_obj_src = Messaging.mess_obj_to_source(mess_obj, undefined, "\n", " ")
           messaging_dialog_main_arg_name_id.value = "All args"
           messaging_dialog_message_id.value = mess_obj_src
        }
    }
    else if (vals.clicked_button_value == "Send") {
        let to = vals.messaging_dialog_to_id
        if(!to || to.length == 0) {
            warning("In Messaging dialog, there is no 'to' person<br/>to send the message to.")
        }
        else {
            let type = vals.messaging_dialog_type_id
            let get_result = vals.get_result_id
            let message = vals.messaging_dialog_message_id.trim() //main arg val or { args... }
            let mess_obj
            if(message.startsWith("{")) {
                try{ eval("mess_obj = " + message) }
                catch(err){
                    dde_error("The message source is not valid syntactically. "  + err.message)
                }
                if((type === "chat") && !mess_obj.hasOwnProperty("message")){
                   //this is screwed up. we're trying to send a chat message that
                   //starts with "{" but it doesn't have a "message" field in it.
                   //so its not really a chat arg set. SOOO treat this message
                   //as just the text of the message, even though it starts with a curley brace.
                   //this lets us send a chat message with some JS src that happens to start with "{"
                   //which we might want to do to get help debugging some chat message.
                   mess_obj = Messaging.mess_type_to_mess_obj(type, message, true)
                }
            }
            else { //message is just the main_arg val
                mess_obj = Messaging.mess_type_to_mess_obj(type, message, true)
            }
            mess_obj.to = to
            mess_obj.get_result = get_result
            Messaging[type].call(null, mess_obj)
        }
        messaging_dialog_message_id.focus()
    }
    else if (vals.clicked_button_value == "Insert") { Messaging.dialog_insert_action() }
}

Messaging.make_run_button = function(mess_obj){
    Messaging.run_receive_mess_obj_history.push(mess_obj)
    let mess_obj_index = Messaging.run_receive_mess_obj_history.length - 1
    let onclick_call = 'event.stopPropogation(); "Messaging.run_receive_button_action(' + mess_obj_index + ')"'
    let label = '<input type="button" value="run" title="Click to run this message." style="background-color:rgb(204, 204, 204); border-style:outset;border-width:2px;border-radius: 5px;"' +
        'onclick=' + onclick_call + '/>'
    return label
}

Messaging.smart_append_to_sent_messages = function(mess_obj,
                                                   sending=true,
                                                   permit=true //or "manual"
    ) {
    if(Messaging.dialog_showing()){
        let to_from =          (sending? "to" : "from")
        let background_color = (sending? "#ECC" : "#FFF")
        let user =             (sending? mess_obj.to : mess_obj.from)
        let type =             mess_obj.type
        let type_string =      ((type == "chat") ? "" : "Messaging." + type)
        let has_result         = mess_obj.hasOwnProperty("result")
        let label
        if(type == "chat") { label = ""}
        else if(!mess_obj.get_result) {
            if(permit == "manual") {
                if      (sending)    { shouldnt("Messaging.smart_append_to_sent_messages has permit=manual but sending=true.") }
                else if (has_result) { shouldnt("Messaging.smart_append_to_sent_messages has permit=manual but has result.") }
                else                 { label = Messaging.make_run_button(mess_obj) }
            }
            else { label = ""}
        }
        else { //get_result==true
            if(permit == "manual") {
                if      (sending)    { shouldnt("Messaging.smart_append_to_sent_messages has permit=manual but sending=true.") }
                else if (has_result) { shouldnt("Messaging.smart_append_to_sent_messages has permit=manual but has result.")  }
                else                 { label = Messaging.make_run_button(mess_obj) }
             }
            else if (sending) {
               if(has_result) { label = "<i>sent result</i>" }
               else           { label = "<i>get result</i>" }
            }
            else {
                if(has_result) { label = "<i>got result</i>" }
                else           { label = "<i>computing result</i>" } //or just don't even append the message
            }
        }
        if(Messaging.is_error(mess_obj)) {
            label += " <span style='color:red'>Error</span>"
        }
        let details_open
        let code_tag_begin
        let code_tag_end
        let summary_prefix = "<summary style='background-color:" + background_color + "'><b>" + to_from + ": " + user + "</b> " + type_string + " "
        let summary_suffix //excludes </summary>
        let body_prefix    = "<div style='background-color:" + background_color + ";margin-left:70px;'>"
        let body_suffix   //excludes the closing </div> of body_prefix
        if(type == "chat") {
            details_open = " open "
            code_tag_begin = ""
            code_tag_end = ""
            let first_newline_pos = mess_obj.message.indexOf("\n")
            if(first_newline_pos == -1) {
                summary_suffix = mess_obj.message
                body_suffix = ""
            }
            else {
                summary_suffix = mess_obj.message.substring(0, first_newline_pos)
                body_suffix    = mess_obj.message.substring(first_newline_pos + 1)
                body_suffix    = replace_substrings(body_suffix, "\n", "<br/>")
            }
        }
        else {
            details_open   = ""
            code_tag_begin = "<code>"
            code_tag_end   = "</code>"
            summary_suffix = "&nbsp;&nbsp;" + label
            body_suffix    =  "<div>(" + Messaging.mess_obj_to_source(mess_obj) + ")</div>"
        }
        let edit_but = `<input type="button" value="Edit" style="font-size:12px;padding:2px;"
                       title="Insert this message&#13;into the New Message area&#13;to edit and resend."
                       onclick="event.stopPropagation(); Messaging.edit_button_action('` + type + `', ` + mess_obj.get_result + `)"/>`
        let message_total_html = "<details" + details_open + ">" +
                                 summary_prefix + summary_suffix + "</summary>" +
                                 body_prefix + body_suffix + edit_but +
                                 "</details>"
        Messaging.append_to_sent_messages(message_total_html)
    }
}

Messaging.append_to_sent_messages = function(html){
    //text += "\n"
    if(window["messaging_dialog_sent_messages_id"]) { //DDE and browser
        messaging_dialog_sent_messages_id.insertAdjacentHTML('beforeend', html) //output_div_id is defined in DDE and browser
        let out_height = messaging_dialog_sent_messages_id.scrollHeight
        messaging_dialog_sent_messages_id.scrollTop = out_height
    }
}

Messaging.edit_button_action = function(type, get_result){
    let src
    let main_arg_name = messaging_dialog_main_arg_name_id.value
    let is_all = main_arg_name == "All args"
    if(type === "chat"){
        src = event.srcElement.parentNode.parentNode.firstElementChild.innerText //grabs innerText of <summary>...</summary>
        let space_pos = src.indexOf(" ")
        src = src.substring(space_pos + 1) //cuts off the "to: "
        space_pos = src.indexOf(" ")
        src = src.substring(space_pos + 1) //cuts off the user name
        //now src has in it the message part of the <summary> tag.
        //then we need to get the 2nd thru nth lines of the message
        let end_of_message = event.srcElement.parentNode.parentNode.lastElementChild.innerText
        if(end_of_message.length > 0) {
            src += "\n" + end_of_message
        }
        if(is_all) {
            let mess_obj = Messaging.mess_type_to_mess_obj(type, src, false) //don't include type
            src = "(" + Messaging.mess_obj_to_source(mess_obj, undefined, "\n", " ") + ")"
        }
    }
    else { src = event.srcElement.parentNode.firstElementChild.innerText }
    src = replace_substrings(src, "<br/>", "\n")

    let result_pos = src.indexOf("result:")
    if(result_pos !== -1) {
        //possibilities
        // #1 {result: 2}  //result is only prop, cut no commas
        // #2 {result: 3,   //cut this post comma
        //     callback: "out"
        //    }
        // #3 {foo: 2,  //cut this pre_comma
        //     result: 3}
        // #4 {foo: 1,
        //     result: 2,
        //     bar: 3}
        //strategy:
        let start_pos = result_pos
        //let result_is_first = (src[start_pos - 1] == "{") //no initial comma to remove, leave start_pos as is
        let pre_comma_pos = src.lastIndexOf(",", result_pos)
        let post_comma_pos = src.indexOf(",", start_pos)
        let end_pos
        if(pre_comma_pos == -1) { //result is first prop. leave start pos where it is
           if(post_comma_pos == -1) { //#1  result is only prop.
               end_pos = src.indexOf("}", start_pos)
           }
           else { //#2 result is first and has following prop, cut post_comma
               end_pos = post_comma_pos + 1
           }
        }
        else { //result is not first prop
           start_pos = pre_comma_pos //cut the pre_comma
           if(post_comma_pos == -1) { //#3 result is not first but is the last prop
               end_pos = src.indexOf("}", start_pos)
           }
           else { //#4 result is not the first and not last prop (a middle prop
               end_pos = post_comma_pos //leave in the post_comma, because we cut the pre_comma
           }
        }
        src = src.substring(0, start_pos) + src.substring(end_pos) //chop out ", result: foo"
    }
    if(src.startsWith("(")){
        src = src.substring(1, src.length - 1) //take off surrounding parens
    }
    messaging_dialog_message_id.value = src
    messaging_dialog_type_id.value = type
    get_result_id.checked = get_result
    if((type !== "chat") && !is_all) { //if we don't have chat, always edit the full message lit obj
        messaging_dialog_main_arg_name_id.value = "All args"
    }
}




Messaging.dialog_login_success = function(success=true){
    if(window.messaging_login_button_id) { //messaging dialog is up
        if(success){
            messaging_login_button_id.value = "logout"
            messaging_dialog_user_id.innerHTML = Messaging.user
            messaging_dialog_message_id.focus()
        }
        else {
            messaging_login_button_id.value = "login"
            messaging_dialog_user_id.innerHTML = ""
        }
    }
}

Messaging.show_password = false //used when login_insert_js

Messaging.show_login_dialog = function(){
    show_window({title: "DDE Messaging Login",
        x: 400, y: 20, width: 285, height: 160,
        background_color: "#ffecdc",
        callback: "Messaging.show_login_cb",
        content:
`User name: <input type="text"     name="messaging_login_user"  style="font-size:14px;margin:5px;" autofocus/><br/>
Password:   <input type="password" id="messaging_login_pass_id" style="font-size:14px;margin:5px 5px 5px 10px;"/><br/>
Show Password: <input type="checkbox" name="show_password"      style="font-size:14px;margin:5px;" data-onchange="true" Xtabindex="-1"/><br/>
<input type="submit" name="login" value="login"/>
`
})
}

Messaging.show_login_cb = function(vals){
    if(vals.clicked_button_value == "show_password") {
        if(vals.show_password){
            messaging_login_pass_id.type = "text"
            Messaging.show_password = true
        }
        else {
            messaging_login_pass_id.type = "password"
            Messaging.show_password = true
        }
    }
    else if(vals.clicked_button_value == "login") {
        Messaging.login({user: vals.messaging_login_user, pass: vals.messaging_login_pass_id})
        messaging_dialog_to_id.value = vals.messaging_login_user
    }
}
module.exports.Messaging = Messaging
//________stats_________
//uses microseconds throughout

var MessStat = class MessStat{}
/* Use MessStat.extract_property_value instead as its more general. Same algorithm though.
MessStat.extract_send_time = function(res){
    let path = decodeURIComponent(res.req.path)
    let start_pos = path.indexOf("send_time_us")
    start_pos = start_pos + 'send_time_us":'.length
    let end_pos   = path.indexOf(",", start_pos)
    if(end_pos == -1) { end_pos = path.indexOf("}", start_pos) }
    let start_time_us = path.substring(start_pos, end_pos)
    start_time_us = parseInt(start_time_us)
    return start_time_us
    //let dur_in_us = time_in_us() - start_time_us
    //return dur_in_us
}*/
MessStat.extract_property_value = function(res, property_name){
    let path = decodeURIComponent(res.req.path)
    let start_pos = path.indexOf(property_name + '":')
    start_pos = start_pos + property_name.length + 2 // the + 2 gets the ending double quote and colon before the start of the value
    let end_pos   = path.indexOf(",", start_pos)
    if(end_pos == -1) { end_pos = path.indexOf("}", start_pos) }
    let val_src = path.substring(start_pos, end_pos)
    val = JSON.parse(val_src)
    return val
}

//non_get_result messages
MessStat.time_array = [] //an array of lit objs. the inner array has
                         //send_time_us
                         //send_cb_time //corrsponding send_callback time associated with that send_time
                         //is_send_good   boolean
                         //latest first order.
                         //Note all inner arrays will have a send time, but not all
                         //will have an send_cb time or "is_send_good" boolean
                         //such time_pairs are either length 1 or 3.
                         //They are only recorded for get_result=false messages.
MessStat.time_array_max_length = 20
MessStat.record_send_time = function(mess_obj){
    if(!mess_obj.get_result){
        if(MessStat.time_array.length == MessStat.time_array_max_length) {
              MessStat.time_array.splice(MessStat.time_array_max_length - 1, 1)
        } //don't let array get to be more than 20 long
        let mess_data = {send_time_us: mess_obj.send_time_us}
        MessStat.time_array.unshift(mess_data) //push onto front new send_time_pair
    }
}
MessStat.find_array_for_time = function(time) {
  for(let mess_data of MessStat.time_array) {
      if(mess_data.send_time_us === time) { return mess_data }
  }
  return null
}

//only called for non_get_result messages
MessStat.record_send_cb_time = function(res, is_send_good){
    //let get_result = MessStat.extract_property_value(res, "get_result")
    //if(!get_result){ //we're only recording non-get_result messages in the DB.
        let send_time_us = MessStat.extract_property_value(res, "send_time_us")
        let mess_data = MessStat.find_array_for_time(send_time_us)
        if(mess_data) {
            mess_data.send_cb_time = time_in_us()
            mess_data.is_send_good = is_send_good
        }
        else {
            shouldnt("MessStat.record_send_cb_time called with no corresponding time_pair in MessStat.time_array.")
        }
    //}
}

//if there are ANY complete time_pairs, use them to compute the avg dur, but
//don't use more than the first 5 complete time_pairs
//if there are 0 complete time_pairs, return MessStat.default_avg_dur
MessStat.default_avg_dur = 300000 //300ms
MessStat.avg_dur = function(window_size = 5){
    let number_of_mess_data_found = 0
    let accum_dur = 0
    for(let mess_data of MessStat.time_array){
        if(mess_data.send_cb_time) {
            accum_dur += (mess_data.send_cb_time - mess_data.send_time_us)
            number_of_mess_data_found += 1
            if(number_of_mess_data_found == window_size) {break;}
        }
    }
    if(number_of_mess_data_found == 0) { return MessStat.default_avg_dur }
    else { return accum_dur / number_of_mess_data_found }
}

MessStat.avg_dur_fill_in_send_cb_time = function(now_in_us=time_in_us(), window_size = 5){
    if(Math.min(MessStat.time_array.length == 0)) { return MessStat.default_avg_dur }
    else {
        let accum_dur = 0
        let item_count = Math.min(MessStat.time_array.length, window_size)
        for(let i = 0; i < item_count; i++) {
           let mess_data = MessStat.time_array[i]
           let send_cb_time = mess_data.send_cb_time
           if(!send_cb_time) { send_cb_time = now_in_us }
           let dur = send_cb_time - mess_data.send_time_us
            accum_dur += dur
        }
        return accum_dur / item_count
    }
}


//Stat Database access
//a mess_data will not have a is_send_good unless it also has a send_cb_time
//is_send_good is ignored if has_send_cb_time is false
//time_pairs either are of length 1, with just the send time (in us)
//or are of length 3 with also the send_cb time and true or false  for is_send_good.

MessStat.index_of_latest_complete_mess_data = function(has_send_cb_time=true, is_send_good=true){
    for(let i; i < MessStat.time_array.length; i++){
        let mess_data = MessStat.time_array[i]
        if(!has_send_cb_time && (!mess_data.send_cb_time)) {return i}
        else if (has_send_cb_time && (mess_data.send_cb_time)) {
            if(is_send_good === mess_data.is_send_good) { return i }
        }
    }
    return null
}
MessStat.latest_complete_time_pair = function(has_send_cb_time=true, is_send_good=true){
    let index = MessStat.index_of_latest_complete_mess_data(has_send_cb_time, is_send_good)
    if(index === null) {return null}
    else { return MessStat.time_array[index] }
}
MessStat.no_send_cb_messages_count = function(){
    let count = 0
    for(let mess_data of MessStat.time_array){
        if(!mess_data.send_cb_time) { count += 1 }
    }
    return count
}
MessStat.to_receiver_unknown = function(){
    let count = 0
    for(let mess_data of MessStat.time_array){
        if((mess_data.send_cb_time) && !mess_data.is_send_good) {
            count += 1
        }
    }
    return count
}
//called by Messaging.send to see if we should send out a non_get_result or not
/*MessStat.should_send_non_get_result_message = function(now_in_us){
    let avg_dur = MessStat.avg_dur()
    let index_lctp = MessStat.index_of_latest_complete_mess_data()
    if(index_lctp === null) {//happens on first message sent, at least
        return true //give the net the benefit of the doubt
    }
    let lctp = MessStat.time_array[index_lctp]
    let now_to_lctp_dur = now_in_us = lctp[1]
    if(now_to_lctp_dur >= avg_dur) { return true }
    let exp = Math.min(index_lctp, 4)
    let time_factor = Math.pow(1.2, exp)
    let lapsed_time_dur = avg_dur * time_factor
    if(now_to_lctp_dur >= lapsed_time_dur) { return true }
    else { return false }
}*/

MessStat.should_send_non_get_result_message = function(now_in_us){
   if(MessStat.time_array.length === 0) { return true }
   else {
       let avg_dur = MessStat.avg_dur_fill_in_send_cb_time(now_in_us)
       let latest_send_time_us = MessStat.time_array[0].send_time_us
       if((now_in_us - latest_send_time_us) >= avg_dur) { return true }
       else { return false }
   }
}

MessStat.non_get_report_messages_not_used = 0

MessStat.non_get_result_report_object = function(){
    let result = {
          max_database_entries: MessStat.time_array_max_length,
          entries_in_database:  MessStat.time_array.length,
          no_send_cb_messages:  MessStat.no_send_cb_messages_count(),
          to_receiver_unknown:  MessStat.to_receiver_unknown(),
          average_duration:     Math.round(MessStat.avg_dur(MessStat.time_array.length)),
          avg_dur_latest_5:     Math.round(MessStat.avg_dur_fill_in_send_cb_time()),
          messages_not_used:    MessStat.non_get_report_messages_not_used
    }
    return result
}
MessStat.non_get_result_report_inner_data = function(){
    let report_object_str = to_source_code({value: MessStat.non_get_result_report_object()})
    report_object_str = replace_substrings(report_object_str, "\n", "<br/>")
    report_object_str = report_object_str.substring(1, report_object_str.length - 1)  //cut off { ... }
    return report_object_str + "<input name='non_get_result_inspect' type='button' value='inspect'/>"
}

MessStat.fill_in_non_get_result_durs = function(now_in_us=time_in_us()){
    for(let mess_data of MessStat.time_array){
        let send_cb_time = mess_data.send_cb_time
        if(!send_cb_time) { send_db_time = now_in_us }
        mess_data.duration = send_cb_time - mess_data.send_time_us
    }
}


//______get_result report_________
MessStat.get_result_report_inner_data = function(){
    let result_html  = "<b><i>get_result messages.</i></b><br/>" +
                       "get_result_fifo: " + Messaging.get_result_fifo.length +
                       " &nbsp;<input name='get_result_fifo_inspect' type='button' value='inspect'/>" +
                       "<br/>mess_objs_that_made_round_trip: " + Messaging.mess_objs_that_made_round_trip.length
    return result_html
}

//_______Overall report
MessStat.clear_db = function(){
    Messaging.get_result_fifo = [] //first in, first out. oldest elt is elt 0.
    Messaging.current_send_delay_seconds = 0
    MessStat.time_array = []
    MessStat.non_get_report_messages_not_used = 0
    Messaging.successful_last_send_to = null
    Messaging.mess_objs_that_made_round_trip = [] //only stores mess_objs and only ones with get_result == true
    Messaging.mess_objs_that_were_received = []
}

MessStat.report_inner_data = function(){
    let report_object_html = MessStat.non_get_result_report_inner_data() +
                           "<hr/>" +
                           MessStat.get_result_report_inner_data()


    return report_object_html
}

MessStat.report_refresh = function(){
    //mess_stat_data_id.innerHTML = MessStat.report_inner_data()
    MessStat.show_report()
}

MessStat.show_report = function(){
    let refresh_but = "<input type='button' name='refresh' value='refresh'/>"
    let clear_but   = "<input type='button' name='mess_stat_clear_db' value='clear db' style='margin-left:15px;' " +
                              "title='Clear Messaging caches and Statistics database.' />"
    let request_indicator = "<span id='mess_stat_request_indicator_id' style='background-color:#DDD;margin-left:15px;padding:3px;' " +
                                   "title='Blinks green when a request is send to the server.'>request_made</span>"
    let help = "Times in microseconds."
    let non_get_head = "<i><b>non_get_result messages</b></i>"
    let report_object_str = MessStat.report_inner_data()
    let content = refresh_but + " " + clear_but + request_indicator +  "<br/>" + help + "<hr/>" + non_get_head +
                 "<div id='mess_stat_data_id'>" + report_object_str + "</div>"
    show_window({title: "DDE Messaging Statistics",
                 x: 20, y: 20, width: 315, height: 360,
                 background_color: "#ffecdc",
                 content: content,
                 callback: "MessStat.show_report_cb"
    })
}

MessStat.show_report_cb = function(vals){
    if(vals.clicked_button_value == "refresh") {
        MessStat.report_refresh()
    }
    else if(vals.clicked_button_value == "mess_stat_clear_db"){
        MessStat.clear_db()
        MessStat.report_refresh()
    }
    else if (vals.clicked_button_value == "non_get_result_inspect"){
        MessStat.fill_in_non_get_result_durs(time_in_us())
        inspect(MessStat.time_array)
    }
    else if (vals.clicked_button_value == "get_result_fifo_inspect"){
        inspect(Messaging.get_result_fifo)
    }
    else {
       shouldnt("In MessStat.show_report_cb got unhandled clicked_button_value of: " + vals.clicked_button_value)
    }
}
var {stringify_value} = require("./utils.js")
var {speak, stringify_for_speak} = require("./out.js")

module.exports.MessStat = MessStat


