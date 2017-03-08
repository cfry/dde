/* Created by Fry on 2/4/16. */

const ws = require("ws")

//never create an instance
var Socket = class Socket{
    static init( robot_name, simulate, ip_address, port=5000){
        //console.log("Creating Socket for ip_address: " + ip_address + " port: "   + port + " robot_name: " + robot_name)
        if (simulate){ DexterSim.create(robot_name) }
        else {
          try {
              let ws_inst = new WebSocket(ip_address + ":" + port)
              Socket.robot_name_to_ws_instance_map[robot_name] = ws_inst
              ws_ins.on("open", function(){
                                    Socket.new_socket_callback(robot_name)
                                }
              )
              ws_ins.on("message", Socket.on_receive)
          }
          catch(e){
              dde_error("Error attempting to create socket: " + e.message)
          }
        }
    }

    static new_socket_callback(robot_name){
            console.log("Socket.new_socket_callback passed: " + "robot_name: " + robot_name)
            Dexter.set_a_robot_instance_socket_id(robot_name)
    }

    //not called in new web sockets version
    static instruction_array_to_array_buffer(instruction_array){
        let result = ""
        for(var i = 0; i < instruction_array.length; i++){
            let suffix = ((i == (instruction_array.length - 1))? ";": " ")
            var elt = instruction_array[i] + suffix
            //if (i == 1) { elt = instruction_array[i]} //the op letter
            result += elt
        }
        var arr_buff = new ArrayBuffer(128) //dexter code expecting fixed length buf of 128
        var view1    = new Uint8Array(arr_buff)
        for(var i = 0; i < result.length; i++){
            let char = result[i]
            let code = char.charCodeAt(0)
            view1[i] = code
        }
        return arr_buff
    }

    static send(robot_name, instruction_array, simulate){ //can't name a class method and instance method the same thing
          if(simulate){
              DexterSim.send(robot_name, instruction_array)
          }
          else {
                const array = new Float32Array(instruction_array.length);
                for (var i = 0; i < array.length; ++i) {
                    array[i] = instruction_array[i]
                }
                let ws_inst = Socket.robot_name_to_ws_instance_map[robot_name]
                ws_inst.send(array);
          }
    }

    static on_receive(data, flags){ //only called by ws, not by simulator
        var js_array = []
        var view1 = new Int32Array(data) //array_buff1.bytelength / 4); //weird google syntax for getting length of a array_buff1
        for(var i = 0; i < view1.length; i++){
            var elt_int32 = view1[i]
            js_array.push(elt_int32)
        }
        //the simulator automatically does this so we have to do it here in non-simulation
        let op_code = js_array[Dexter.INSTRUCTION_TYPE]
        let op_let  = String.fromCharCode(op_code)
        js_array[Dexter.INSTRUCTION_TYPE] = op_let
        Dexter.robot_done_with_instruction(js_array) //this is called directly by simulator
    }

    static close(robot_name, simulate){ //called only from sandbox, with NO arg,
        if (simulate){ //simulation
                DexterSim.close(robot_name)
        }
        else {
            const ws_inst = Socket.robot_name_to_ws_instance_map[robot_name]
            ws_inst.terminate() //like disconnect I guess
            ws_inst.close()
        }
    }
}

Socket.robot_name_to_ws_instance_map = {}

Socket.on_receive_added = false
