// the client
class Monitor {
     static port = 3002
     
     //also used by MonitorServer
     static ws_uri(){ return  "ws://localhost:" + this.port }
     
     static websocket = null
     
	//browser side code (uses server, doesn't create it)
     static init(){
         let the_uri = this.ws_uri()
         this.websocket = new WebSocket(the_uri) //WebSocket defined in chrome browser
         out("Created Monitor.websocket at: " + the_uri)
    
         this.websocket.onopen = function(evt) {
            out("Monitor websocket opened.") //onOpen(evt)
         }
		
         this.websocket.onclose = function(evt) {
            out("Monitor websocket closed.") //onClose(evt)
         }
		
         this.websocket.onmessage = function(evt) {
             let data_str = evt.data
             out("Monitor onmessage got: " + data_str)
             try {
                 let json_data = JSON.parse(data_str)
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
                 }
             }
             catch(err){
                 out("Monitor got message that might not be a JSON object: " + data_str +
                 " with err: " + err.message)
             }
         }
		
         this.websocket.onerror = function(evt) {
            warning("Monitor got an error: ")
         }
      }

      static readyStateInt_to_string(int){
            let states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"]
            if(int >= states.length) { return "UNKNOWN STATE" }
            else                     { return states[int] }
      }

      static state(){
         if(!this.websocket) { return "Monitor.websocket not created"}
         else {
             let state_str = this.readyStateInt_to_string(this.websocket.readyState)
             return state_str
         }
      }
	
      static send(message){
         if(typeof(message) !== "string") {
             message = JSON.stringify(message)
         }
         out("Monitor sending: " + message)
         this.websocket.send(message);
      }
	
      static close(){
         this.websocket.close()
         this.websocket = null
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
   static server = null
   static init(){
       out("Top of MonitorServer.init")
       this.server = new WebSocketServer({port: Monitor.port, clientTracking: true})    //Monitor.ws_uri()
       this.server.on('connection', function connection(ws_connection) { //ws_connection is the WebSocket connection for one client
           MonitorServer.send_one("MonitorServer top of connection passed ws_connection: " + ws_connection, ws_connection)
           ws_connection.on('message',
                  function message(data) {
              out('MonitorServer got message: ' + data)
              try {
                  let data_obj = JSON.parse(data)
                  if (data_obj.type === "get_measured_angles") {
                      out("MonitorServer got type: get_measured_angles")
                      let ma
                      if (!Job.monitor_dexter || !Job.monitor_dexter.is_active()) {
                          out("MonitorServer starting Job.monitor_dexter")
                          Job.monitor_dexter.start()
                          ma = Dexter.HOME_ANGLES
                      }
                      else {
                          out("MonitorServer getting ma to send")
                          let ma = Dexter.dexter0.rs.measured_angles()
                      }
                      let json_obj = {
                          type: "show_measured_angles",
                          value: ma
                      }
                      let json_str = JSON.stringify(json_obj)
                      MonitorServer.send_one(json_str, ws_connection)
                  } else if (data_obj.type === "eval") {
                      let new_val
                      try {
                          new_val = globalThis.eval(data_obj.value)
                      } catch (err) {
                          new_val = "Error: " + err.message
                      }
                      let json_obj = {
                          type: "evaled",
                          value: new_val,
                          callback: data_obj.callback
                      }
                      let json_str = JSON.Stringify(json_obj)
                      out("MonitorServer sending: " + json_str)
                      MonitorServer.send_one(json_str, ws_connection)
                  }
              }
              catch(err) {
                  out("MonitorServer got message that isn't a JSON object: " + data)
              }
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
          if (!Job.monitor_dexter) {
              new Job({
                  name: "monitor_dexter",
                  inter_do_item_dur: 0.5, //todo speed up
                  robot: new Brain({name: "brain_for_monitor_default"}),
                  do_list: [Control.loop(true, function () {
                      out("in Job.monitor_dexter loop")
                      out("in Job.monitor_dexter loop with Dexter.dexter0.name: " + Dexter.dexter0.name)
                      let ma
                      out("in Job.monitor_dexter Dexter.dexter0.robot_status: " + Dexter.dexter0.robot_status)
                      out("in Job.monitor_dexter Dexter.dexter0.rs: " + Dexter.dexter0.rs)

                      if(Dexter.dexter0.rs) {
                          out("in Job.monitor_dexter loop getting measured_angles")
                          ma = Dexter.dexter0.rs.measured_angles()
                      }
                      else { //hits on the first loop iteration
                          out("in Job.monitor_dexter loop getting HOME_ANGLES")
                          ma = Dexter.HOME_ANGLES
                      }
                      out("in Job.monitor_dexter loop got ma: " + ma)
                      let json_obj = {
                          type: "show_measured_angles",
                          value: ma
                      }
                      MonitorServer.send_all(json_obj) //send to all clients
                      return Dexter.dexter0.get_robot_status()
                  })]
              }) //end of Job def
         }
      })    
	}

    static readyStateInt_to_string(int){
        let states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"]
        if(int >= states.length) { return "UNKNOWN STATE" }
        else                     { return states[int] }
    }
    
    static send_one(message, ws_connection) { //this is "send_first"
        if (typeof (message) !== "string") {
            message = JSON.stringify(message)
        }
        out("MonitorServer.send_one passed message: " + message + " wsc: " + ws_connection)
        if (ws_connection){
            let state_str = this.readyStateInt_to_string(ws_connection.readyState)
            if(state_str === "OPEN") {
                //console.log("ws_connection.send bound to: " + ws_connection.send)
                console.log("MonitorServer.send_one passed wdc and sending message: " + message)
                ws_connection.send(message)
            }
            else {
                console.log("send_one can't send because we_connection is not open, its: " + state_str)
            }
        }
        else if (this.server.clients.length > 0) {
            ws_connection = this.server.clients[0]
            let state_str = this.readyStateInt_to_string(ws_connection.readyState)
            if(state_str === "OPEN") {
                console.log('MonitorServer sending: ' + message)
                ws_connection.send(message)
            }
            else {
                console.log("WebSocketServer.send_one can't send message: " + message +
                            " because readyState is not OPEN, its: " + status_str)
            }
        }
        //else no one to send to so do nothing
    }

    static send_all(message){
        out("MonitorServer.send_all passed: " + message)
        this.server.clients.forEach(function(client){
            MonitorServer.send_one(message, client)
        })
    }
}
   
globalThis.MonitorServer = MonitorServer
/*
MonitorServer.init()
*/