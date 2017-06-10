/* Created by Fry on 2/4/16. */
//https://www.hacksparrow.com/tcp-socket-programming-in-node-js.html
const net = require("net")

//never create an instance
var Socket = class Socket{
    static init(robot_name, simulate, ip_address, port=50000){
        //console.log("Creating Socket for ip_address: " + ip_address + " port: "   + port + " robot_name: " + robot_name)
        const sim_actual = Robot.get_simulate_actual(simulate)
        if ((sim_actual === true)  || (sim_actual == "both")) { DexterSim.create_or_just_init(robot_name, sim_actual) }
        if ((sim_actual === false) || (sim_actual == "both")) {
            try {
                let ws_inst = new net.Socket()
                Socket.robot_name_to_ws_instance_map[robot_name] = ws_inst
                ws_inst.on("data", Socket.on_receive)
                ws_inst.connect(port, ip_address, function(){
                    Socket.new_socket_callback(robot_name)
                })

            }
            catch(e){
                dde_error("Error attempting to create socket: " + e.message)
            }
        }
    }

    static new_socket_callback(robot_name){ //only called by the "real" side if simulate == "both".
        console.log("Socket.new_socket_callback passed: " + "robot_name: " + robot_name)
        Dexter.set_a_robot_instance_socket_id(robot_name)
    }

    static instruction_array_to_array_buffer(instruction_array){
        let result = ""
        for(var i = 0; i < instruction_array.length; i++){
            let suffix = ((i == (instruction_array.length - 1))? ";": " ")
            var elt = instruction_array[i] + suffix
            //if (i == 1) { elt = instruction_array[i]} //the op letter
            result += elt
        }
        var arr_buff = new Buffer(128) //dexter code expecting fixed length buf of 128
        //var view1    = new Uint8Array(arr_buff)
        for(var i = 0; i < result.length; i++){
            let char = result[i]
            let code = char.charCodeAt(0)
            arr_buff[i] = code
        }
        return arr_buff
    }

    static send(robot_name, instruction_array, simulate){ //can't name a class method and instance method the same thing
        const sim_actual = Robot.get_simulate_actual(simulate)
        if((sim_actual === true) || (sim_actual === "both")){
            DexterSim.send(robot_name, instruction_array)
        }
        if ((sim_actual === false) || (sim_actual === "both")) {
            const array = Socket.instruction_array_to_array_buffer(instruction_array)
            let ws_inst = Socket.robot_name_to_ws_instance_map[robot_name]
            ws_inst.write(array);
        }
    }

    static on_receive(data){ //only called by ws, not by simulator
        var js_array = []
        var view1 = new Int32Array(data.buffer) //array_buff1.bytelength / 4); //weird google syntax for getting length of a array_buff1
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
            if(ws_inst){
                ws_inst.destroy()}
        }
    }
}

Socket.robot_name_to_ws_instance_map = {}

//Socket.on_receive_added = false