// the client
class Monitor {
     static port = 3002 //the monitor port for a Dexter. also used by MonitorServer

    //static default_domain = "192.168.1.142"  //not now used but *could( be used in
    //resolve_domain a la else if (domain_maybe === undefined) { return default_domain }

     static resolve_domain(domain_maybe){
        if     (typeof(domain_maybe) === "string") { return domain_maybe }
        else if(domain_maybe instanceof Dexter)    { return domain_maybe.ip_address }
        else if(domain_maybe instanceof WebSocket) {
            let the_url = domain_maybe.url //something like "ws://localhost:3002/"
            let colon_pos = the_url.indexOf(":", 5)
            let domain = the_url.substring(5, colon_pos)
            return domain
        }
        else { dde_error("resolve_domain passsed: " + domain_maybe +
            " which is not a domain, Dexter instance or Websocket instance.")
        }
     }

     static domain_to_websocket_map = {} //contains only OPEN websockets

     //domain is the domain of the Job Engine you want to  monitor.
     //It can be "localhost", "102.168.1.142" (and friends), Dexter.dexter0 (or any Dexter instance) or a websocket thats in domain_to_websocket_map
     static domain_to_websocket(domain=Dexter.default){
         domain = this.resolve_domain(domain)
         return this.domain_to_websocket_map[domain]
     }


     static set_domain_to_websocket(domain=Dexter.default, websocket){
         domain = this.resolve_domain(domain)
         this.domain_to_websocket_map[domain] = websocket
     }

    static delete_domain(domain=Dexter.default){
        domain = this.resolve_domain(domain)
        delete this.domain_to_websocket_map[domain]
    }

     //domain can be a string:  use "localhost" for the simulator running on your pc,
     //or something like "192.168.1.142"
     static ws_url(domain=Dexter.default){
         domain = this.resolve_domain(domain)
         return  "ws://" + domain + ":" + this.port
     }
     
	//browser side code (uses server, doesn't create it)
    //if source is passed, we're going to do a SEND after the init opens the websocket
     static init(domain="localhost", source, callback, period){
         domain = this.resolve_domain(domain)
         let the_state = this.state(domain) //returns one of "CONNECTING", "OPEN", "CLOSING", "CLOSED", "UNKOWN STATE"
         if(["CONNECTING", "OPEN"].includes(the_state)) {
             let warning_mess = "Monitor.init got state of: " + the_state + " so doesn't try to open the websocket again."
             console.log(warning_mess)
             out(warning_mess)
         }
         else {
             let the_url        = this.ws_url(domain)
             this.send_source   = source    //ok if undefined
             this.send_callback = callback  //ok if undefined
             this.send_period   = period    //ok if undefined
             let status_mess    = "Monitor.init opening websocket for url: " + the_url
             console.log(status_mess)
             out(status_mess)
             let websocket = new WebSocket(the_url) //WebSocket defined in chrome browser

             websocket.onopen = function (evt) {
                 out("Monitor for: " + websocket.url + " websocket opened.") //onOpen(evt)
                 Monitor.set_domain_to_websocket(domain, websocket)
                 if (Monitor.send_source) {
                     let source = Monitor.send_source
                     let callback = Monitor.send_callback
                     let period = Monitor.send_period
                     Monitor.send_source = undefined
                     Monitor.send_callback = undefined
                     Monitor.send_period = undefined
                     Monitor.send_aux(websocket, source, callback, period)
                 }
             }
         }
		
         websocket.onclose = function(evt) {
             Monitor.delete_domain(websocket)
             out("Monitor for: " + websocket.url + " websocket closed.") //onClose(evt)
         }
		
         websocket.onmessage = function(evt) {
             let data_str = evt.data
             out("Monitor for: " + websocket.url + " onmessage got: " + data_str, undefined, true)
             try {
                 let json_data = JSON.parse(data_str)
                 let callback_src = json_data.callback
                 if(callback_src) {
                     if(callback_src.startsWith("function(")){
                         callback_src = "(" + callback_src + ")"
                     }
                     let callback_fn = globalThis.eval(callback_src)
                     let value       = globalThis.eval(json_data.value)
                     //out("Monitor for: " + websocket.url + " got value of: " + value)
                     let result = callback_fn.call(null, value, websocket, json_data) //usually done for side effect.
                 }
                 //delete the below?
                /*
                 if (json_data.type === "show_measured_angles") {
                     SimUtils.render_joints(json_data.value)
                 } else if (json_data.type === "evaled") {
                     let new_val
                     if (json_data.callback) {
                         let response_str_to_eval = json_data.callback + "(" + json_data.value + ")"
                         try {
                             new_val = globalThis.eval(response_str_to_eval)
                         } catch (err) {
                             dde_err("Monitor evaled callback errored with: " + err.message)
                         }
                     } else {
                         new_val = globalThis.eval(json_data.value)
                     }
                     out("Monitor got evaled of: " + new_val)
                 } else if (json_data.type === "out") {
                     out(json_data.value)
                 } */
             }
             catch(err){
                 dde_error("Monitor for: " + websocket.url +
                           " got error message back from MonitorServer of: " + err.message)
             }
         }
		
         websocket.onerror = function(evt) {
            dde_error("Monitor for: " + websocket.url + " errored probably because no Job Engine running at that url.")
         }
      } //end of init

      static close(domain){
            let websocket = this.domain_to_websocket(domain)
            websocket.close()
            this.delete_domain(domain)
      }

      static readyStateInt_to_string(int){
            let states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"]
            if(int >= states.length) { return "UNKNOWN STATE" }
            else                     { return states[int] }
      }

      //returns one of //returns one of "CONNECTING", "OPEN", "CLOSING", "CLOSED", "UNKOWN STATE",
      // or "websocket for {the domain} has not been created"
      static state(domain){
          let websocket = this.domain_to_websocket(domain)
          if(!websocket) { return "websocket for " + domain + " has not been created."}
          else {
             let state_str = this.readyStateInt_to_string(websocket.readyState)
             return state_str
          }
      }

      // source is JS source code to eval in the job engine at domain.
      //   If source has multiple expressions, ie "foo(); bar()",
      //   both will be evaled but only the value of the last expression will
      //   be the returned value. The value is converted to a string with to_source_code
      //   in the MonitorServer and sent back to the Monitor computer as that string,
      //   then converted back to an object via globalThis.eval(value_str) before its
      //   passed to the callback.
      // callback is a function that takes one argument, the result
      //   of evaling source (value). It is called on the Monitor computer with the
      //   value. If callback is null, the job engine will not
      //   send a message back to the Monitor computer.
      //   The callback should be a string that evals to a fn, or
      //   a function whose toString() method gives us the src.
      // period indicates when source is evaled.
      //   "once" means just once the job engine recieves this message.
      //   A number means the number of seconds between evals of the source.
      //   the source continue to be evaled until it is stopped.
      // examples: Monitor.send("localhost", "Job.active_job_names()",  "out", "once")
      //           Monitor.send("localhost", "Job.defined_job_names()", "out", "once")
	
     static send(domain, source, callback="Monitor.out", period="run_once" //can also be a positive number of seconds to repeatedly eval message
          ){
         if(typeof(callback) === "function") {
             let fn_name = Utils.function_name(callback)
             if(fn_name !== "") { callback = fn_name}
             else               { callback = callback.toString()}
         }
         let websocket = this.domain_to_websocket(domain)
         if(websocket) { this.send_aux(websocket, source, callback, period) }
         else {
             this.init(domain, source, callback, period)
         }
     }

     static send_aux(websocket, source, callback, period) {
          let state = Monitor.state(websocket)
          if (!(state === "OPEN")) {
              //dde_error("The websocket for: " + websocket.url + " is not open, its: " + state )
              websocket = new WebSocket(websocket.url) //try one more time.
              setTimeout(function () {
                  let state = Monitor.state(websocket)
                  if(state !== "OPEN"){
                      Monitor.delete_domain(websocket) //start afresh next time we try to send
                      dde_error("websocket for: " + websocket.url + " is not OPEN, its: " + state)
                  }
                  else {
                      Monitor.send_aux_aux(websocket, source, callback, period)
                  }
              }, 1000)
          }
          else {
              this.send_aux_aux(websocket, source, callback, period)
          }
     }

     static send_aux_aux(websocket, source, callback, period) {
              let message_object = {
                  source: source,
                  callback: callback,
                  period: period
              }
              let message_str = JSON.stringify(message_object)
              out("Monitor for: " + websocket.url + " sending: " + message_str)
              websocket.send(message_str)
     }

      //used as the default callback in a send.
     static out(value, websocket=null, json_data){
         Monitor.last_out_value = value
         let url_message = ""
         if(websocket) {
             url_message = "for websocket: " + websocket.url + " "
         }
         let result = {value: value,
                       command: json_data.source,
                       value_string: json_data.value,
                       error_type: json_data.error_type,
                       error_message: json_data.error_message,
                       full_error_message: json_data.full_error_message}
         let src_label = "Monitor " + url_message + " <i>the result of evaling:</i> "
         eval_js_part3(result, src_label)
         /*let src_truncated = ((json_data.source.length > 22) ?
                               json_data.source.substring(0, 20) + "..." :
                               json_data.source)
         out("<fieldset><legend>Monitor " + url_message + " <i>the result of evaling:</i> " +
              `<code title='` + json_data.source + `'>` + src_truncated + "</code> is...</legend>" +
             value + "</fieldset>")*/
      }



     static show_dialog(){
         let localhost_checked = ""
         let dexter_default_checked = ""
         if(simulate_radio_true_id.checked) {localhost_checked      = "checked" }
         else                               {dexter_default_checked = "checked" }
         show_window({
             title: "Monitor Dexter <i>in the Job Engine</i>",
             x: 300, y: 50, width: 430, height: 550,
             content: `
<fieldset><legend>Domain: <i>what Dexter to monitor</i></legend> 
<input name="domain_kind" type="radio" value="localhost"      style="margin-left:10px;" ` + localhost_checked      + `/> Use DDE4 installed on Local PC (localhost)<br/>
<input name="domain_kind" type="radio" value="Dexter.default" style="margin-left:10px;" ` + dexter_default_checked + `/> Use Dexter.default (see Misc Pane header menu)<br/>
<input name="domain_kind" type="radio" value="type_in"        style="margin-left:10px;"/> Type in ip_address: 
     <input name="domain_type_in" value="192.168.1.142"/>
</fieldset>
<div style="margin:10px;">
    <a href="#" id="job_engine_user_interface_id" onclick="Monitor.browse_job_engine()">
        Browse Job Engine User Interface
    </a>
</div>
<input type="button" name="copy_job_to_job_engine" value="Copy Job to Job Engine" style="margin: 5px 0px 10px 10px;"
       title="Copy the selection, or if no selection,&#013;the whole file in the Editor&#013;to a Job Engine file&#013;named by the contained Job definition."/>


<!--<input name="job_engine_user_interface" type="button" style="margin: 4px;" value="Job Engine User Interface"/><br/>
<input name="show_defined_jobs"       type="button" style="margin: 4px;" value="Show Defined Jobs"/><br/>
-->


<fieldset style="margin-top:10px;"><legend>Operations: <i>to be performed in the Job Engine</i></legend> 
<input name="show_active_jobs"        type="button" style="margin: 4px;" value="Show Active Jobs"/>
<input name="run_job"                 type="button" style="margin: 4px 4px 4px 95px;" value="Run Job"
   title="If there is a selection in the Editor,&#013;treat it as a Job definition.&#013;Otherwise grab the whole buffer.&#013;Send it to the Job Engine.&#013;Define and start it.&#013;Always runs just once."/> <br/>

<input name="show_active_monitors"    type="button" style="margin: 4px;" value="Show Active Monitors"/>
<input name="stop_active_monitors"    type="button" style="margin: 4px 4px 4px 70px;" value="Stop Active Monitors"
       title='Stops all periodic operations.&#013;Always runs just once,&#013;ignoring the "once" ckeckbox.'/><br/>

<input name="render_measured_angles"  type="button" style="margin: 4px;" value="Render Measured Angles"/> 
    <input style="margin:0px;padding:0px;" name="render_measured_angles_many" type="checkbox" data-onchange="true"
           title="Run render_measured_angles continuously,&#013;i.e. more than once, every 'period'."/>
    <span style="font-size:14px;margin:0px;padding:0px;">&gt;1</span>
<input name="show_robot_status"       type="button" style="margin: 4px 4px 4px 10px;" value="Show Robot Status"/>
    <input style="margin:0px;padding:0px;" name="show_robot_status_many" type="checkbox" data-onchange="true"
       title="Refresh robot status continuously,&#013;i.e. more than once, every 'period'."/>
    <span style="font-size:14px;margin:0px;padding:0px;">&gt;1</span>
 <br/>
<input name="send"                    type="button" style="margin: 4px;" value="Send"/> 
    <input style="margin:0px;padding:0px;" name="send_many" type="checkbox" data-onchange="true"
    title="Send the below code continuously,&#013;i.e. more than once, every 'period'."/>
    <span style="font-size:14px;margin:0px 20px 0px 0px;padding:0px;">&gt;1</span>
code to run in Job Engine:<br/>
<textarea name="source" rows="2" cols="80">Job.active_job_names() //returns array of strings</textarea>
<div style="margin-left:120px;"> callback to run in DDE:</div>
<textarea name="callback" rows="3" cols="80">function(val){\n    out("Job count: " + val.length, "green")\n}</textarea>
</fieldset>
<fieldset><legend>Period: <i>how often to run the &gt;1 checkbox operations</i></legend> 
<!--<input name="run_once" type="checkbox" style="margin-left:10px;" checked/>
     once
     &nbsp; <i>OR</i> &nbsp; every -->
     <input name="period_duration" type="number" value="0.1" step="0.05" min="0" style="width:60px;"/> seconds
</fieldset>
`,
             callback: "Monitor.handle_show_dialog"
         })
      }

      static handle_show_dialog(vals){
          //ebugger;
          let domain_kind = vals.domain_kind
          let domain
          if      (domain_kind === "localhost")      { domain = "localhost"}
          else if (domain_kind === "Dexter.default") { domain = Dexter.default.ip_address}
          else if (domain_kind === "type_in")        { domain = val.domain_type_in}
          Monitor.domain = domain //used by  Monitor.show_robot_status_cb
          let the_period
          /*if(vals.run_once){
              the_period = "run_once"
          }
          else { the_period = vals.period_duration }
          */
          if(vals.clicked_button_value === "close_button") {}

          else if (vals.clicked_button_value === "job_engine_user_interface_id") {
              let url = "http://" + domain + "/dde/jobs.html"
              try { browse_page(url) }
              catch(err) {
                  dde_error("Could not browse: " + url  + "<br/>Verify that the domain of: " + domain +
                            " is correct<br/>and that a server is running on Dexter or the server is simulated.")
              }
          }
          else if (vals.clicked_button_value === "copy_job_to_job_engine") {
              Monitor.copy_job_to_job_engine(domain)
          }
          else if(vals.clicked_button_value === "show_defined_jobs"){
              Monitor.send(domain, "Job.defined_job_names()",  "Monitor.out",  "run_once")
          }
          else if(vals.clicked_button_value === "show_active_jobs"){
             Monitor.send(domain, "Job.active_job_names()",  "Monitor.out",  "run_once")
          }
          else if(vals.clicked_button_value === "run_job"){
              Monitor.run_job(domain) //always run_once
          }
          else if(vals.clicked_button_value === "show_active_monitors"){
              Monitor.send(domain, "MonitorServer.active_monitor_sources()", "Monitor.out",  "run_once")
          }
          else if(vals.clicked_button_value === "stop_active_monitors"){
              Monitor.stop_active_monitors(domain) //don't run periodically.
              document.querySelector('[name="render_measured_angles_many"]').checked = false
              document.querySelector('[name="show_robot_status_many"]').checked = false
              document.querySelector('[name="send_many"]').checked = false

          }
          else if(vals.clicked_button_value === "render_measured_angles"){
              Monitor.render_measured_angles(domain, "run_once")
          }
          else if(vals.clicked_button_value === "render_measured_angles_many"){
              if(vals.render_measured_angles_many){ //this is true if user clicked on unchecked box to make it checked
                  Monitor.render_measured_angles(domain, vals.period_duration)
              }
              else {
                  Monitor.stop_active_monitor(domain,
                               "Dexter.dexter0.rs.measured_angles()") //must be the same code as in hte status method: render_measured_angles
              }
          }
          else if(vals.clicked_button_value === "show_robot_status"){
              Monitor.show_robot_status(domain, "run_once")
          }
          else if(vals.clicked_button_value === "show_robot_status_many"){
              if(vals.show_robot_status_many){
                  Monitor.show_robot_status(domain, vals.period_duration)
              }
              else {
                  Monitor.stop_active_monitor(domain,
                               "Dexter.default.robot_status")
              }
          }
          else if(vals.clicked_button_value === "send"){
              Monitor.send(domain, vals.source, vals.callback, "run_once" )
          }
          else if(vals.clicked_button_value === "send_many"){
              if(vals.send_many) {
                  Monitor.send(domain, vals.source, vals.callback, vals.period_duration)
              }
              else {
                  Monitor.stop_active_monitor(domain, vals.source)
              }
          }
          else {shouldnt("got unhandled click button value of: " + vals.clicked_button_value)}
      }
    //higher levels sends:
    static copy_job_to_job_engine(domain) {
        let src = Editor.get_javascript()
        let job_name = Job.source_to_job_name(src)
        if(job_name === null){
            dde_error("Job.copy_job_to_job_engine could not find a valid Job Definition in the editor.")
        }
        else {
            let path = "http://" + domain + "/srv/samba/share/dde_apps/" + job_name + ".dde"
            out("Copying Job definition to: " + path)
            DDEFile.write_file_async(path, src)
        }
    }
    //example: Monitor.render_measured_angles()
    static render_measured_angles(domain, period=0.05){
        this.send(domain,
            "Dexter.dexter0.rs.measured_angles()", //if you change this, change the show_window handler for stopping it.
            `(function(angles) {
                                  SimUtils.render_joints(angles) 
                              })`,
            period
        )
    }

    static run_job(domain) {//always run_once.
        let js_src = Editor.get_javascript("auto")
        let full_src = "Job.define_and_start_job(`" + js_src + "`)"
        this.send(domain, full_src, undefined, "run_once")
    }

    static stop_active_monitors(domain){
        this.send(domain,
            "MonitorServer.stop_active_monitors()",
            "(function() { out('Monitor: active monitors stopped.') })",
            "run_once"
        )
    }

    static stop_active_monitor(domain, operation_source){
        this.send(domain,
            "MonitorServer.stop_active_monitor('" + operation_source + "')",
            "(function() { out('Monitor: active monitors stopped.') })",
            "run_once"
        )
    }

    static show_robot_status(domain, period){
        Monitor.send(domain,
            "Dexter.default.robot_status",
            "Monitor.show_robot_status_cb",
            period)
    }

    static show_robot_status_cb(robot_status){
        if(RobotStatusDialog.window_up()){ //use existing window
            RobotStatusDialog.robot_status = robot_status
            RobotStatusDialog.update_robot_status_table()
        }
        else { //create a new window
            let sm = RobotStatus.array_status_mode(robot_status)
            RobotStatusDialog.show(Monitor.domain, sm, robot_status)
        }
    }

    static strips_solve({domain        = "required",
                         callback      = "Monitor.out",
                         period        = "run_once",

                         strips_domain = "required",
                         problem       = "required",
                         fast        = true,
                         verbose     = false,
                         output        = "(function(text) { console.log(text); })" //inside strips
                      }) {
         if(typeof(strips_domain) === "string") {} //ok as is
         else { //assume its a JSON object
             strips_domain = JSON.stringify(strips_domain)
             if (!strips_domain.startsWith("{")) {
                 dde_error("Monitor.strips_solve called with object which isn't " +
                     "a proper JSON object:\n" + strips_domain)
             }
         }
         let src_obj = {strips_domain: strips_domain,
                        problem: problem,
                        fast: fast,
                        verbose: verbose,
                        output: output}
         let src = JSON.stringify(src_obj)
         this.send(domain, src, callback, period)
    }

    static strips_pddl_to_json({
            domain        = "required",
            callback      = "Monitor.out",
            period        = "run_once",

            pddl_string   = "required",
            problem_or_domain= "problem",

            fast        = true,
            verbose     = false,
            output        = "(function(text) { console.log(text); })" //inside strips
        }) {
            if(typeof(pddl_string) === "string") {} //ok as is
            else {dde_error("Monitor.strips_pddl_to_json called with object which isn't " +
                        "a string:\n" + pddl_string)
            }
            let src_obj =  {pddl_string: pddl_string,
                            problem_or_domain: problem_or_domain,
                            fast: fast,
                            verbose: verbose,
                            output: output}
            let src = JSON.stringify(src_obj)
            this.send(domain, src, callback, period)
     }
}
/*
Monitor.ws_url()
Monitor.init()
Monitor.send("hey")
Monitor.close()
*/
globalThis.Monitor = Monitor


// https://www.tutorialspoint.com/websockets/websockets_server_working.htm
class MonitorServer {
   static source_to_interval_id_map = {}

   static active_monitor_sources(){
       return Object.keys(this.source_to_interval_id_map)
   }

   static stop_active_monitor(source){
       let interval_id = this.source_to_interval_id_map[source]
       if((interval_id === 0) || interval_id) {
           clearInterval(interval_id)
           delete this.source_to_interval_id_map[source]
       }
   }

   static stop_active_monitors(){
        for(let source of Object.keys(this.source_to_interval_id_map)) {
            this.stop_active_monitor(source)
        }
   }

   static server = null

   static init(){ //called by load_job_engine.js
       console.log("Top of MonitorServer.init now disabled")
       out("Top of MonitorServer.init now disabled")
       return //TODO needs work
       try {
           this.server = new WebSocketServer({port: Monitor.port, clientTracking: true})    //Monitor.ws_url()
           this.server.on('connection', function connection(ws_connection) { //ws_connection is the WebSocket connection for one client
               console.log("Top of MonitorServer onconnection")
               MonitorServer.send(ws_connection,
                   {
                       value: "'" + "MonitorServer top of connection, passed ws_connection: " + ws_connection + "'",
                       callback: "out"
                   })
               ws_connection.on('message', function (data) {
                   console.log("MonitorServer.on message passed: " + data)
                   MonitorServer.handle_message(ws_connection, data)
               })
               ws_connection.on('close', function (data) {
                   out("MonitorServer closed " + data)
                   if (Job.monitor_dexter &&
                       Job.monitor_dexter.is_active() &&
                       this.server.clients.length === 0) {
                       Job.monitor_dexter.stop_for_reason("interrupted", "MonitorServer closed")
                   }
                   this.server = null
               })
               ws_connection.on('error', function (data) { //not documented but maybe exists anyway.
                   console.log("MonitorServer.init got error; " + data)
               })
           })
           this.server.onerror = function (err) {
               console.log("MonitorServer.init error of: " + err)
               out("MonitorServer.init error of: " + err)
           }
       }
       catch (err){
           console.log("errored while creating new WebSocketServer with: " + err.message)
       }
	}

    //data is a string that looks like:
    // {source: "some string of js", callback: "some str"} // that evals to a fn of one arg on the client which will be passed the result of source
    static handle_message(ws_connection, data) {
        console.log('MonitorServer.handle_message got message: ' + data)
        let data_obj
        try {
            data_obj = JSON.parse(data) //has fields src, callback, period
        }
        catch (err) {
            this.handle_message_error(ws_connection, data, data_obj, err) //data_obj is undefined, and that's ok for JSON.parse errors
        }
        if (data_obj.period === "run_once") {
            if(data_obj.source.includes("strips_domain")) {
                   this.handle_message_strips_solve(ws_connection, data, data_obj)
            }
            else if (data_obj.source.includes("problem_or_domain")) {
                this.handle_message_strips_pddl_to_json(ws_connection, data, data_obj)
            }
            else { this.handle_message_one_eval(ws_connection, data, data_obj) }
        }
        else { //got a period so repeating eval
            let interval_id = setInterval(function() {
                   MonitorServer.handle_message_one_eval(ws_connection, data, data_obj)
                },
                data_obj.period * 1000)  //convert seconds to milliseconds
            this.source_to_interval_id_map[data_obj.source] = interval_id //so that we have a list of the active_monitors for status and for stopping
        }
    }
    static handle_message_one_eval(ws_connection, data, data_obj) {
        try{
            let value = globalThis.eval(data_obj.source)
            if (data_obj.callback) {
                let message_object = {
                    source:   data_obj.source, //not really needed by Monitor but useful for debugging
                    callback: data_obj.callback,
                    value:    to_source_code({value: value})
                }
                let message_str = JSON.stringify(message_object)
                MonitorServer.send(ws_connection, message_str)
            }
        }
        catch(err){
            this.handle_message_error(ws_connection, data, data_obj, err)
        }
    }

    static handle_message_error(ws_connection, data, data_obj, err) {
        let message_object = {
            source:             (data_obj ? data_obj.source : data), //If we have a data_obj, that means the JSON.parse call above didn't error, else it did
            callback:           "Monitor.out", //always do Monitor.out for the calleback when there is an error
            //value: err.message,
            //the below is similar to eval_part2 bottom
            error_type:         err.name,
            error_message:      err.message,
            full_error_message: err.stack
        }
        let message_str = JSON.stringify(message_object)
        MonitorServer.send(ws_connection, message_str)
    }

    static handle_message_strips_solve(ws_connection, data, data_obj){
        let the_strips_callback
        let strips_data_obj = JSON.parse(data_obj.source)
        if(strips_data_obj.strips_domain  === undefined) { // required
            let err = {error_type:         "required but not passed.",
                       error_message:      "domain required but not passed.",
                       full_error_message: ""
                      }
            this.handle_message_error(ws_connection, data, data_obj, err)
            return
        }
        if(strips_data_obj.problem === undefined) { //required
            let err = {error_type:         "required but not passed.",
                       error_message:      "problem required but not passed.",
                       full_error_message: ""
            }
            this.handle_message_error(ws_connection, data, data_obj, err)
            return
        }
        if(strips_data_obj.fast    !== undefined) { StripsManager.fast    = data_obj.fast } //default true
        if(strips_data_obj.verbose !== undefined) { StripsManager.verbose = data_obj.verbose } //default false
        if(strips_data_obj.output  !== undefined) { //default "(function(text) { console.log(text); })"
                try {
                    let fn = eval(strips_data_obj.output)
                    StripsManager.output = fn
                }
                catch(err) {
                    this.handle_message_error(ws_connection, data, data_obj, err)
                }
        }
        StripsManager.load(strips_data_obj.strips_domain,
                           strips_data_obj.problem,
                           function(domain, problem){
                             MonitorServer.strips_solve(ws_connection, data, data_obj, domain, problem)},
                           true)
    }

    //similar to MonitorServer.handle_message_one_eval
    //here domain and problem are actual objects, not their src code.
    static strips_solve(ws_connection, data, data_obj, domain, problem){
        let solutions = StripsManager.solve(domain, problem);
        let solutions_str = JSON.stringify(solutions)
        if (data_obj.callback) { //the Monitor(client) callback
            let message_object = {
                source:   "MonitorServer.strips_solve(...)", //not really needed by Monitor but useful for debugging
                callback: data_obj.callback,
                value:    solutions_str
            }
            let message_str = JSON.stringify(message_object)
            MonitorServer.send(ws_connection, message_str)
        }
    }

    static handle_message_strips_pddl_to_json(ws_connection, data, data_obj){
        console.log("top of MonitorServer.handle_message_strips_pddl_to_json passed dat_obj: " + data_obj)
        let the_strips_callback
        let strips_data_obj = JSON.parse(data_obj.source)
        if(strips_data_obj.pddl_string === undefined) { // required
            let err = {error_type:         "required but not passed.",
                       error_message:      "pddl_string required but not passed.",
                       full_error_message: ""
            }
            this.handle_message_error(ws_connection, data, data_obj, err)
            return
        }
        if(strips_data_obj.problem_or_domain === undefined) { //required
            let err = {error_type:         "required but not passed.",
                error_message:      "problem_or_domain required but not passed.",
                full_error_message: ""
            }
            this.handle_message_error(ws_connection, data, data_obj, err)
            return
        }
        if(strips_data_obj.fast    !== undefined) { StripsManager.fast    = data_obj.fast } //default true
        if(strips_data_obj.verbose !== undefined) { StripsManager.verbose = data_obj.verbose } //default false
        if(strips_data_obj.output  !== undefined) { //default "(function(text) { console.log(text); })"
            try {
                console.log("MonitorServer.handle_message_strips_pddl_to_json about to eval: " + strips_data_obj.output)
                let fn = eval(strips_data_obj.output)
                StripsManager.output = fn
            }
            catch(err) {
                this.handle_message_error(ws_connection, data, data_obj, err)
            }
        }
        let cb = (function(json_string) {
            if (data_obj.callback) { //the Monitor(client) callback
                let message_object = {
                    source: "MonitorServer.strips_pddl_to_json(...)", //not really needed by Monitor but useful for debugging
                    callback: data_obj.callback,
                    value: json_string
                }
                let message_str = JSON.stringify(message_object)
                MonitorServer.send(ws_connection, message_str)
            }
        })
        console.log("in  MonitorServer.handle_message_strips_pddl_to_json about to call StripsManager.loadCode")
        StripsManager.loadCode(strips_data_obj.problem_or_domain, strips_data_obj.pddl_string, cb);
    }

    static readyStateInt_to_string(int){
        let states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"]
        if(int >= states.length) { return "UNKNOWN STATE" }
        else                     { return states[int] }
    }
    
    static send(ws_connection, message_object) {
        let message_str
        if (typeof (message_object) !== "string") {
            message_str = JSON.stringify(message_object)
        }
        else { message_str = message_object}
        out("MonitorServer.send passed message: " + message_str + " wsc: " + ws_connection)
        if (ws_connection){
            let state_str = this.readyStateInt_to_string(ws_connection.readyState)
            if(state_str === "OPEN") {
                //console.log("ws_connection.send bound to: " + ws_connection.send)
                console.log("MonitorServer.send passed wdc and sending message: " + message_str)
                ws_connection.send(message_str)
            }
            else {
                console.log("MessageServer.send can't send message: " + message_str + "<br/> because ws_connection is not open, its: " + state_str)
            }
        }
        else {
            console.log("MessageServer.send can't send message: " + message_str + "<br/> because no ws_connection passed: " + ws_connection)
        }
    }

    static send_all(message_object){
        this.server.clients.forEach(function(client){
            MonitorServer.send(client, message_object)
        })
    }
}
   
globalThis.MonitorServer = MonitorServer
/*
MonitorServer.init()
*/