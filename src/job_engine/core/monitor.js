// the client
class Monitor {
     static port = 3002
     
     //also used by MonitorServer
     static ws_uri(){ return  "ws://localhost:" + this.port }
     
     static websocket = null
     
	//browser side code (uses server, doesn't create it)
     static init(){
         this.websocket = new WebSocket(this.ws_uri()) //WebSocket defined in chrome browser
    
         this.websocket.onopen = function(evt) {
            out("Monitor websocket opened.") //onOpen(evt)
         }
		
         this.websocket.onclose = function(evt) {
            out("Monitor websocket closed.") //onClose(evt)
         }
		
         this.websocket.onmessage = function(evt) {
             let data_str = evt.data
             out("Monitor onmessage got: " + evt.data)
             let json_data = JSON.parse(data_str)
             if(json_data.type === "show_measured_angles") {
                 SimUtils.render_joints(json_data.value)
             }
             else if(json_data.type === "evaled") {
                 let new_val
                 if(json_data.callback) {
                     let response_str_to_eval = json_data.callback + "(" + json_data.value + ")"
                     try {
                         new_val = globalThis.eval(response_str_to_eval)
                     }
                     catch(err){
                        dde_err("Monitor evaled callback errored with: " + err.message)
                     }
                 }
                 else {
                     new_val = globalThis.eval(json_data.value)
                 }
                 out("Monitor got evaled of: " + new_val)
             }
             else if(json_data.type === "out") {
                 out(json_data.value)
             }
         }
		
         this.websocket.onerror = function(evt) {
            warning("Monitor got error: " + evt.data)
         }
      }
	
      static send(message) {
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
      this.server = new WebSocketServer(Monitor.ws_uri())
      this.server.on('connection', function connection(ws) {
        ws.on('message', function message(data) {
             out('MonitorServer got message: ' + data)
             let data_obj = JSON.parse(data)
             if(data_obj.type === "get_measured_angles"){
                 let ma
                 if(!Job.monitor_dexter.is_active()){
                     Job.monitor_dexter.start()
                     ma = Dexter.HOME_ANGLES
                 }
                 else { let ma = dexter0.rs.measured_angles() }
                 let json_obj = {type: "show_measured_angles",
                                 value: ma}
                 let json_str = JSON.stringify(json_obj)
                 ws.send(json_str)
             }
             else if(data_obj.type === "eval") {
                 let new_val
                 try {
                     new_val = globalThis.eval(data_obj.value)
                 }
                 catch (err){
                     new_val = "Error: " + err.message
                 }
                 let json_obj = {type: "evaled",
                                 value: new_val,
                                 callback: data_obj.callback}
                 let json_str = JSON.stringify(json_obj)
                 we.send(json_str)
             }
        })
        ws.on('close', function (data) {
          out("MonitorServer closed " + data)
          this.server = null
        })
        ws.send("MonitorServer connected.")
        new Job({name: "monitor_dexter",
                 inter_do_item_dur: 0.5, //todo speed up
                 robot: new Brain({name: "brain_for_monitor_default"}),
                 do_list: [ Control.loop(true, function(){
                                 out("in monitor_dexter loop")
                                 let ma = dexter0.rs.measured_angles()
                                 let json_obj = {type: "show_measured_angles",
                                                 value: ma}
                                 let json_str = JSON.stringify(json_obj)
                                 ws.send(json_str)
                                 return Dexter.default.get_robot_status()
                      } ) ]
        } ) //end of Job def
      })    
	}
    
    static send(message) {
        out('MonitorServer sending: ' + str)
        this.server.send(str)
    }
}
   
globalThis.MonitorServer = MonitorServer
/*
MonitorServer.init()
*/