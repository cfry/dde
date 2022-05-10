// the client
class Monitor {
     static port = 3002 //the monitor port for a Dexter. also used by MonitorServer

     static domain_to_websocket_map = {}

     //static default_domain = "192.168.1.142"

     //domain is the domain of the Job Engine you want to  monitor.
     //It can be "localhost", "102.168.1.142" (and friends), Dexter.dexter0 (or any Dexter instance)
     static domain_to_websocket(domain=Dexter.default){
         if(domain instanceof Dexter) {
             domain = domain.ip_address
         }
         return this.domain_to_websocket_map[domain]
     }

     static set_domain_to_websocket(domain=Dexter.default, websocket){
         if(domain instanceof Dexter) {
             domain = domain.ip_address
         }
         this.domain_to_websocket_map[domain] = websocket
     }

    static delete_domain(domain=Dexter.default){
        if(domain instanceof Dexter) {
            domain = domain.ip_address
        }
        delete this.domain_to_websocket_map[domain]
    }

     //domain can be a string:  use "localhost" for the simulator running on your pc,
     //or something like "192.168.1.142"
     static ws_uri(domain=Dexter.default){
         if(domain instanceof Dexter) {
             domain = domain.ip_address
         }
         return  "ws://" + domain + ":" + this.port
     }
     
	//browser side code (uses server, doesn't create it)
     static init(domain="localhost"){
         let the_uri = this.ws_uri(domain)
         let websocket = new WebSocket(the_uri) //WebSocket defined in chrome browser
         this.set_domain_to_websocket(domain, websocket)
         out("Created Monitor for: " + the_uri)
    
         websocket.onopen = function(evt) {
            out("Monitor for: " + websocket.url + " websocket opened.") //onOpen(evt)
         }
		
         websocket.onclose = function(evt) {
            out("Monitor for: " + websocket.url + " websocket closed.") //onClose(evt)
         }
		
         websocket.onmessage = function(evt) {
             let data_str = evt.data
             out("Monitor for: " + websocket.url + " onmessage got: " + data_str, undefined, true)
             try {
                 let json_data = JSON.parse(data_str)
                 let callback_src = json_data.callback
                 if(callback_src) {
                     let callback_fn = globalThis.eval(callback_src)
                     let value       = globalThis.eval(json_data.value)
                     out("Monitor for: " + websocket.url + " got value of: " + value)
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
                           " got error message back from MonitorServer of: " + data_str +
                 " with err: " + err.message)
             }
         }
		
         websocket.onerror = function(evt) {
            warning("Monitor for: " + websocket.url + " got an error of: " + evt)
         }
      } //end of init


      static readyStateInt_to_string(int){
            let states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"]
            if(int >= states.length) { return "UNKNOWN STATE" }
            else                     { return states[int] }
      }

      static state(domain){
         let websocket = this.domain_to_websocket(domain)
         if(!websocket) { return "Monitor.websocket not created"}
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
      // period indicates when source is evaled.
      //   "once" means just once the job engine recieves this message.
      //   A number means the number of seconds between evals of the source.
      //   the source continue to be evaled until it is stopped.
      // examples: Monitor.send("localhost", "Job.active_job_names()",  "out", "once")
      //           Monitor.send("localhost", "Job.defined_job_names()", "out", "once")
	
      static send(domain, source, callback="Monitor.out", period="once" //can also be a positive number of seconds to repeatedly eval message
          ){
         if(typeof(callback) === "function") {
             let fn_name = Utils.function_name(callback)
             if(fn_name !== "") { callback = fn_name}
         }
         let websocket = this.domain_to_websocket(domain)
         if(websocket) { this.send_aux(websocket, source, callback, period) }
         else {
             this.init(domain)
             websocket = this.domain_to_websocket(domain)
             if(websocket) {
                 setTimeout(function () {
                     Monitor.send_aux(websocket, source, callback, period)
                 }, 500)
             }
             else {
                 dde_error("Couldn't make websocket for domain: " + domain)
             }
         }

      }

      static send_aux(websocket, source, callback, period){
          let message_object = {source:   source,
                                callback: callback,
                                period:   period}
          let message_str = JSON.stringify(message_object)
          out("Monitor for: " + websocket.url + " sending: " + message_str)
          websocket.send(message_str);
      }

      //used as the default callback in a send.
      static out(value, websocket=null, json_data){
         let url_message = ""
         if(websocket) {
             url_message = "for websocket: " + websocket.url + " "
         }
         let result = {value: value, command: json_data.source, value_string: json_data.value,
                       error_type: json_data.error_type, error_message: json_data.error_message,
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

      //higher levels sends:
      //example: Monitor.render_measured_angles()
      static render_measured_angles(domain, period=0.05){
          this.send(domain,
                    "Dexter.dexter0.rs.measured_angles()",
                    "(function(angles) { SimUtils.render_joints(angles) })",
                    period
                   )
      }
	
      static close(domain){
          let websocket = this.domain_to_websocket(domain)
          websocket.close()
          this.delete_domain(domain)
      }	
}
/*
Monitor.ws_uri()
Monitor.init()
Monitor.send("hey")
Monitor.close()
*/
globalThis.Monitor = Monitor


// https://www.tutorialspoint.com/websockets/websockets_server_working.htm
class MonitorServer {
   static source_to_interval_id_map = {}

   static active_monitor_sources(){
       return Object.keys(source_to_interval_id_map)
   }

   static stop_active_monitor(source){
       let interval_id = this.source_to_interval_id_map[source]
       clearInterval(interval_id)
   }

   static stop_active_monitors(){
        for(let source of Object.keys(this.source_to_interval_id_map)) {
            this.stop_active_monitor(source)
        }
   }


   static server = null

   static init(){ //called by load_job_engine.js
       out("Top of MonitorServer.init")
       this.server = new WebSocketServer({port: Monitor.port, clientTracking: true})    //Monitor.ws_uri()
       this.server.on('connection', function connection(ws_connection) { //ws_connection is the WebSocket connection for one client
           MonitorServer.send(ws_connection,
               {value: "'" + "MonitorServer top of connection passed ws_connection: " + ws_connection + "'",
                              callback: "out"
                              })
           ws_connection.on('message', function(data) {
               MonitorServer.handle_message( ws_connection, data)
           })
           ws_connection.on('close', function (data) {
              out("MonitorServer closed " + data)
              if (Job.monitor_dexter &&
                  Job.monitor_dexter.is_active() &&
                  this.server.clients.length === 0){
                  Job.monitor_dexter.stop_for_reason("interrupted", "MonitorServer closed")
              }
              this.server = null
          })
      })    
	}

    static handle_message(ws_connection, data) {
        out('MonitorServer got message: ' + data)
        let data_obj
        try {
            data_obj = JSON.parse(data)
        }
        catch (err) {
            this.handle_message_error(ws_connection, data, data_obj, err) //data_obj is undefined, and that's ok for JSON.parse errors
        }
        if (data_obj.period === "once") {
            this.handle_message_one_eval(ws_connection, data, data_obj)
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
        out("MonitorServer.send passed message: " + message_str + " wsc: " + ws_connection.url)
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