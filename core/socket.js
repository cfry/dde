/* Created by Fry on 2/4/16. */
//https://www.hacksparrow.com/tcp-socket-programming-in-node-js.html
const net = require("net")

//never create an instance
var Socket = class Socket{
    static init(robot_name, simulate, ip_address, port=50000){
        //out("Creating Socket for ip_address: " + ip_address + " port: "   + port + " robot_name: " + robot_name)
        const sim_actual = Robot.get_simulate_actual(simulate) //true, false, or "both"
        if(Socket.robot_name_to_ws_instance_map[robot_name]){
            this.close(robot_name, simulate)
        }
        if ((sim_actual === true)  || (sim_actual == "both")) {
            DexterSim.create_or_just_init(robot_name, sim_actual)
            out("Simulating socket for Robot." + robot_name + ". is_connected? " + Robot[robot_name].is_connected)
        }
        if ((sim_actual === false) || (sim_actual == "both")) {
            try {
                let ws_inst = new net.Socket()
                Socket.robot_name_to_ws_instance_map[robot_name] = ws_inst
                ws_inst.on("data", function(data) { Socket.on_receive(data, robot_name) })
                out("Now attempting to connect to Dexter: " + robot_name + " at ip_address: " + ip_address + " port: " + port + " ...", "brown")
                ws_inst.connect(port, ip_address, function(){
                    Socket.new_socket_callback(robot_name)
                })

            }
            catch(e){
                dde_error("Error attempting to create socket: " + e.message)
                this.close(robot_name, simulate)
            }
        }
    }

    /*static new_socket_callback(robot_name){
        //console.log("Socket.new_socket_callback passed: " + "robot_name: " + robot_name)
        Dexter.set_a_robot_instance_socket_id(robot_name)
    }*/

    static new_socket_callback(robot_name){
        Dexter.set_a_robot_instance_socket_id(robot_name)
        if (Socket.resend_instruction) {
            let rob = Robot[robot_name]
            Socket.send(robot_name, Socket.resend_instruction, rob.simulate)
        }
    }

    static instruction_array_to_array_buffer(instruction_array){
        let result = ""
        for(var i = 0; i < instruction_array.length; i++){
            let suffix = ((i == (instruction_array.length - 1))? ";": " ")
            let elt = instruction_array[i] + suffix
            if (Number.isNaN(elt)) { elt = "NaN" } //usually only for "a" instructions and only for elts > 4
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

    //also converts S params: "MaxSpeed", "StartSpeed", "Acceleration", S params of  boundry
    //and  the z oplet. Note that instruction start and end times are always in milliseconds
    static instruction_array_degrees_to_arcseconds_maybe(instruction_array, rob){
        const oplet = instruction_array[Dexter.INSTRUCTION_TYPE]
        if ((oplet == "a") || (oplet == "P")){
            let instruction_array_copy = instruction_array.slice()
            /*instruction_array_copy[Instruction.INSTRUCTION_ARG0] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG0] * 3600)
            instruction_array_copy[Instruction.INSTRUCTION_ARG1] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG1] * 3600)
            instruction_array_copy[Instruction.INSTRUCTION_ARG2] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG2] * 3600)
            instruction_array_copy[Instruction.INSTRUCTION_ARG3] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG3] * 3600)
            instruction_array_copy[Instruction.INSTRUCTION_ARG4] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG4] * 3600)
            */
            //take any number of angle args
            let angle_args_count = instruction_array_copy.length - Instruction.INSTRUCTION_ARG0
            for(let i = 0; i < angle_args_count; i++) {
                let index = Instruction.INSTRUCTION_ARG0 + i
                let arg_val = instruction_array_copy[index]
                let converted_val
                if (i == 5) { //J6
                    converted_val = 512 + Math.round(arg_val / Socket.DEGREES_PER_DYNAMIXEL_UNIT) //convert degrees to dynamixel units to get dynamixel integer from 0 through 1023 going from 0 to 296 degrees
                }
                else if (i == 6) { //J7
                    converted_val = Math.round(arg_val / Socket.DEGREES_PER_DYNAMIXEL_UNIT) //convert degrees to dynamixel units to get dynamixel integer from 0 through 1023 going from 0 to 296 degrees
                }
                else { converted_val = Math.round(arg_val * 3600) } //still might be a NaN
                instruction_array_copy[index] = converted_val
            }
            return instruction_array_copy
        }
        else if (oplet == "S") {
            const name = instruction_array[Instruction.INSTRUCTION_ARG0]
            const val  = instruction_array[Instruction.INSTRUCTION_ARG1]
            if(["MaxSpeed", "StartSpeed", "Acceleration"].includes(name)){
                var instruction_array_copy = instruction_array.slice()
                instruction_array_copy[Instruction.INSTRUCTION_ARG1] = Math.round(val * _nbits_cf)
                return instruction_array_copy
            }
            else if (name.includes("Boundry")) {
                let instruction_array_copy = instruction_array.slice()
                instruction_array_copy[Instruction.INSTRUCTION_ARG1] = Math.round(val * 3600) //deg to arcseconds
                return instruction_array_copy
            }
            else if (name == "EERoll"){ //J6 no actual conversion here, but this is a conveneitn place
                        //to put the setting of robot.angles and is also the same fn where we convert
                        // the degrees to dynamixel units of 0.20 degrees
                        //val is in dynamixel units
                rob.angles[5] = val * Socket.DEGREES_PER_DYNAMIXEL_UNIT //convert dynamixel units to degrees then shove that into rob.angles for use by subsequent relative move instructions
                return instruction_array
            }
            else if (name == "EESpan") { //J7
                rob.angles[6] = val * Socket.DEGREES_PER_DYNAMIXEL_UNIT
                return instruction_array
            }
            else { return instruction_array }
        }
        else if (oplet == "T") { //move_to_straight
            let instruction_array_copy = instruction_array.slice()
            instruction_array_copy[Instruction.INSTRUCTION_ARG0] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG0] / _um) //meters to microns
            instruction_array_copy[Instruction.INSTRUCTION_ARG1] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG1] / _um) //meters to microns
            instruction_array_copy[Instruction.INSTRUCTION_ARG2] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG2] / _um) //meters to microns
            instruction_array_copy[Instruction.INSTRUCTION_ARG11] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG11] * 3600) //degrees to arcseconds
            instruction_array_copy[Instruction.INSTRUCTION_ARG12] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG12] * 3600) //degrees to arcseconds
            return instruction_array_copy
        }
        else if (oplet == "z") {
            let instruction_array_copy = instruction_array.slice()
            instruction_array_copy[Instruction.INSTRUCTION_ARG0] =
                Math.round(instruction_array_copy[Instruction.INSTRUCTION_ARG0] * 1000000) //seconds to microseconds
            return instruction_array_copy
        }
        else { return instruction_array }
    }

    /* not called, and not up to date with oplet "T"
    static instruction_array_arcseconds_to_degrees_maybe(instruction_array){
        const oplet = instruction_array[Dexter.INSTRUCTION_TYPE]
        if (oplet == "a"){
            //var instruction_array_copy = instruction_array.slice()
            //instruction_array_copy[Instruction.INSTRUCTION_ARG0] /= 3600
            //instruction_array_copy[Instruction.INSTRUCTION_ARG1] /= 3600
            //instruction_array_copy[Instruction.INSTRUCTION_ARG2] /= 3600
            //instruction_array_copy[Instruction.INSTRUCTION_ARG3] /= 3600
            //instruction_array_copy[Instruction.INSTRUCTION_ARG4] /= 3600
            let angle_args_count = instruction_array.length - Instruction.INSTRUCTION_ARG0
            let instruction_array_copy = instruction_array.slice()
            for(let i = 0; i < angle_args_count; i++) {
                let index = Instruction.INSTRUCTION_ARG0 + i
                let arg_val = instruction_array[index]
                instruction_array_copy[index] = arg_val / 3600
            }
            return instruction_array_copy
        }
        else if (oplet == "S"){
            const name = instruction_array[Instruction.INSTRUCTION_ARG0]
            if(["MaxSpeed", "StartSpeed", "Acceleration"].includes(name)){
                var instruction_array_copy = instruction_array.slice()
                instruction_array_copy[Instruction.INSTRUCTION_ARG1] =
                    instruction_array_copy[Instruction.INSTRUCTION_ARG1] / _nbits_cf
                return instruction_array_copy
            }
            else if (name.includes("Boundry")) {
                var instruction_array_copy = instruction_array.slice()
                instruction_array_copy[Instruction.INSTRUCTION_ARG1] =
                    instruction_array_copy[Instruction.INSTRUCTION_ARG1] / 3600 //arcseconds to deg
                return instruction_array_copy
            }
            else { return instruction_array }
        }
        else if (oplet == "z") {
            var instruction_array_copy = instruction_array.slice()
            instruction_array_copy[Instruction.INSTRUCTION_ARG0] =
                instruction_array_copy[Instruction.INSTRUCTION_ARG0] / 1000 //milliseocnds to seconds
            return instruction_array_copy
        }
        else { return instruction_array }
    }*/

    //static robot_done_with_instruction_convert()

    /*static send(robot_name, instruction_array, simulate){ //can't name a class method and instance method the same thing
        instruction_array = Socket.instruction_array_degrees_to_arcseconds_maybe(instruction_array)
        const sim_actual = Robot.get_simulate_actual(simulate)
        if((sim_actual === true) || (sim_actual === "both")){
            DexterSim.send(robot_name, instruction_array)
        }
        if ((sim_actual === false) || (sim_actual === "both")) {
            const array = Socket.instruction_array_to_array_buffer(instruction_array)
            let ws_inst = Socket.robot_name_to_ws_instance_map[robot_name]
            ws_inst.write(array);
        }
    }*/
    static send(robot_name, instruction_array, simulate){ //can't name a class method and instance method the same thing
        let rob = Robot[robot_name]
       	if(instruction_array !== Socket.resend_instruction){ //we don't want to convert an array more than once as that would have degreees * 3600 * 3600 ...
       	                                                     //so only to the convert on the first attempt.
        	instruction_array = Socket.instruction_array_degrees_to_arcseconds_maybe(instruction_array, rob)
        }
        const sim_actual = Robot.get_simulate_actual(simulate)
        if((sim_actual === true) || (sim_actual === "both")){
            DexterSim.send(robot_name, instruction_array)
        }

        if ((sim_actual === false) || (sim_actual === "both")) {
            const array = Socket.instruction_array_to_array_buffer(instruction_array)
            let ws_inst = Socket.robot_name_to_ws_instance_map[robot_name]
            let job_id = instruction_array[Instruction.JOB_ID]
            try {
                ws_inst.write(array) //if doesn't error, success and we're done with send
                Socket.resend_instruction = null
                Socket.resend_count       = null
                //this.stop_job_if_socket_dead(job_id, robot_name)
                return
            }
            catch(err) {
                if(instruction_array === Socket.resend_instruction) {
                    if (Socket.resend_count >= 4) {  //we're done
                        let job_instance = Job.id_to_job(job_id)
                        job_instance.stop_for_reason("errored", "can't connect to Dexter")
                        //job_instance.color_job_button() //automatically done by job.prototype.finish
                        job_instance.set_up_next_do(0)  //necessary?
                        return
                    }
                    else { //keep trying
                        Socket.resend_count += 1
                        Socket.close(robot_name, simulate) //both are send args
                        let timeout_dur = Math.pow(10, Socket.resend_count)
                        setTimeout(function(){
                            Socket.init(robot_name, //passed to send
                                        simulate,   //passed to send
                                        rob.ip_address, //get from ws_inst ???
                                        rob.port //50000   //port
                            )
                        }, timeout_dur)
                        return
                    }
                }
                else { //first attempt failed so initiate retrys
                    Socket.resend_instruction =  instruction_array
                    Socket.resend_count = 0
                    Socket.close(robot_name, simulate) //both are send args
                    let timeout_dur = Math.pow(10, Socket.resend_count)
                    setTimeout(function(){
                        Socket.init(robot_name, //passed to send
                            simulate,   //passed to send
                            rob.ip_address, //get from ws_inst ???
                            rob.port       //port
                        )
                    }, timeout_dur)
                    return
                }
            }
        }
    } //end of send method

    static on_receive_sim(robot_status_in_arcseconds, robot_name){ //robot_status_in_arcseconds might also be an ack_array, wbich doens't have any degrees, and won't be converted. or modified.
        Socket.convert_robot_status_to_degrees(robot_status_in_arcseconds) //modifies its input
        let rob = Robot[robot_name]
        rob.robot_done_with_instruction(robot_status_in_arcseconds) //now robot_status_in_arcseconds is really in degrees
    }

    static on_receive(data, robot_name){ //only called by ws, not by simulator
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
        if(op_let == "r"){
            Socket.r_payload_grab(data, js_array)
        }
        else {
            Socket.convert_robot_status_to_degrees(js_array)
        }
        //let job_id       = js_array[Dexter.INSTRUCTION_JOB_ID]
        //let job_instance = Job.id_to_job(job_id)
        //let robot_name   = job_instance.robot.name
        let rob = Dexter[robot_name]
        //Socket.robot_is_waiting_for_reply[robot_name] = false
        rob.robot_done_with_instruction(js_array) //this is called directly by simulator
    }

    static r_payload_grab(data, js_array) {
        let payload_length = js_array[Socket.PAYLOAD_LENGTH]
        let data_start = Socket.PAYLOAD_START
        let data_end = data_start + payload_length
        let payload_string = (data.slice(data_start, data_end).toString())
        Socket.r_payload_grab_aux(payload_string, js_array)
    }

    //called by both Socket.r_payload_grab AND DexterSim.process_next_instruction_r
    static r_payload_grab_aux(payload_string, js_array){
        let job_id = js_array[Dexter.JOB_ID]
        let ins_id = js_array[Dexter.INSTRUCTION_ID]
        Instruction.Dexter.read_from_robot.got_content_hunk(job_id, ins_id, payload_string)
    }

    static convert_robot_status_to_degrees(robot_status){
        if (robot_status.length == Dexter.robot_status_labels.length){
            robot_status[Dexter.J1_ANGLE] *= 0.0002777777777777778 //this number == _arcsec
            robot_status[Dexter.J2_ANGLE] *= 0.0002777777777777778
            robot_status[Dexter.J3_ANGLE] *= 0.0002777777777777778
            robot_status[Dexter.J4_ANGLE] *= 0.0002777777777777778
            robot_status[Dexter.J5_ANGLE] *= 0.0002777777777777778

            robot_status[Dexter.J1_DELTA] *= 0.0002777777777777778
            robot_status[Dexter.J2_DELTA] *= 0.0002777777777777778
            robot_status[Dexter.J3_DELTA] *= 0.0002777777777777778
            robot_status[Dexter.J4_DELTA] *= 0.00001736111111111111
            robot_status[Dexter.J5_DELTA] *= 0.00001736111111111111

            robot_status[Dexter.J1_PID_DELTA] *= 0.0002777777777777778
            robot_status[Dexter.J2_PID_DELTA] *= 0.0002777777777777778
            robot_status[Dexter.J3_PID_DELTA] *= 0.0002777777777777778
            robot_status[Dexter.J4_PID_DELTA] *= 0.00001736111111111111
            robot_status[Dexter.J5_PID_DELTA] *= 0.00001736111111111111

            robot_status[Dexter.J1_MEASURED_ANGLE] *= 0.0002777777777777778 //this number == _arcsec
            robot_status[Dexter.J2_MEASURED_ANGLE] *= 0.0002777777777777778
            robot_status[Dexter.J3_MEASURED_ANGLE] *= 0.0002777777777777778
            robot_status[Dexter.J4_MEASURED_ANGLE] *= 0.0002777777777777778
            robot_status[Dexter.J5_MEASURED_ANGLE] *= 0.0002777777777777778
            robot_status[Dexter.J6_MEASURED_ANGLE] = (robot_status[Dexter.J6_MEASURED_ANGLE] - 512) * Socket.DEGREES_PER_DYNAMIXEL_UNIT //0.0002777777777777778
            robot_status[Dexter.J7_MEASURED_ANGLE] *= Socket.DEGREES_PER_DYNAMIXEL_UNIT //0.0002777777777777778

           /* deprecated
             robot_status[Dexter.J1_FORCE_CALC_ANGLE] *= 0.0002777777777777778
            robot_status[Dexter.J2_FORCE_CALC_ANGLE] *= 0.0002777777777777778
            robot_status[Dexter.J3_FORCE_CALC_ANGLE] *= 0.0002777777777777778
            robot_status[Dexter.J4_FORCE_CALC_ANGLE] *= 0.00001736111111111111
            robot_status[Dexter.J5_FORCE_CALC_ANGLE] *= 0.00001736111111111111
            */

           // Socket.compute_measured_angles(robot_status)
        }
    }
    static compute_measured_angles(robot_status){
        robot_status[Dexter.J1_MEASURED_ANGLE] = robot_status[Dexter.J1_ANGLE] + robot_status[Dexter.J1_DELTA] - robot_status[Dexter.J1_PID_DELTA] + robot_status[Dexter.J1_FORCE_CALC_ANGLE]
        robot_status[Dexter.J2_MEASURED_ANGLE] = robot_status[Dexter.J2_ANGLE] + robot_status[Dexter.J2_DELTA] - robot_status[Dexter.J2_PID_DELTA] + robot_status[Dexter.J2_FORCE_CALC_ANGLE]
        robot_status[Dexter.J3_MEASURED_ANGLE] = robot_status[Dexter.J3_ANGLE] + robot_status[Dexter.J3_DELTA] - robot_status[Dexter.J3_PID_DELTA] + robot_status[Dexter.J3_FORCE_CALC_ANGLE]
        robot_status[Dexter.J4_MEASURED_ANGLE] = robot_status[Dexter.J4_ANGLE] + robot_status[Dexter.J4_DELTA] - robot_status[Dexter.J4_PID_DELTA] + robot_status[Dexter.J4_FORCE_CALC_ANGLE]
        robot_status[Dexter.J5_MEASURED_ANGLE] = robot_status[Dexter.J5_ANGLE] + robot_status[Dexter.J5_DELTA] - robot_status[Dexter.J5_PID_DELTA] + robot_status[Dexter.J5_FORCE_CALC_ANGLE]
    }

    static close(robot_name, simulate=null){
        const sim_actual = Robot.get_simulate_actual(simulate)
        if ((sim_actual === true) || (sim_actual === "both")){ //simulation
            DexterSim.close(robot_name)
        }
        if ((sim_actual === false) || (sim_actual == "both")){
            const ws_inst = Socket.robot_name_to_ws_instance_map[robot_name]
            if(ws_inst){
                ws_inst.removeAllListeners()
                ws_inst.destroy()
                Socket.robot_name_to_ws_instance_map[robot_name]
            }
        }
    }

    static empty_instruction_queue_now(robot_name, simulate){
        const sim_actual = Robot.get_simulate_actual(simulate)
        if ((sim_actual === true) || (sim_actual === "both")){ //simulation
            DexterSim.empty_instruction_queue_now(robot_name)
        }
        if ((sim_actual === false) || (sim_actual == "both")){
            const ws_inst = Socket.robot_name_to_ws_instance_map[robot_name]
            if(ws_inst && !ws_inst.destroyed){
                const instruction_array = make_ins("E") //don't expect to hear anything back from this.
                const array = Socket.instruction_array_to_array_buffer(instruction_array)
                try { ws_inst.write(array) } //band-aid for not knowing what in Dexter's queue.
                                              //if the queue is empty we shouldn't do.
                                              //we should empty the queue whenever DDE detects an error,
                                              //but before closing the socket.
                catch(err) {
                    warning("Writing to the robot: " + robot_name +
                            " while emptying its queue failed, but that may be ok.")
                }
            }
        }
    }
    /*static stop_job_if_socket_dead(job_id, robot_name){
        Socket.robot_is_waiting_for_reply[robot_name] = true
        setTimeout(function(){
                    if (Socket.robot_is_waiting_for_reply[robot_name]){
                        let job_instance = Job.id_to_job(job_id)
                        job_instance.stop_for_reason("errored", "can't connect to Dexter")
                        //Socket.close(robot_name, false) //don't do here. stop_for_reason will
                        //cause job.finish(), which will close the robot and close the socket.
                        job_instance.set_up_next_do(0)
                    }
                   },
                   Socket.max_dur_to_wait_for_reply_ms)
    }*/
}

//Socket.robot_is_waiting_for_reply = {} //robot_name to boolean map.
//Socket.max_dur_to_wait_for_reply_ms = 200

Socket.PAYLOAD_START = 7 * 4 //7th integer array index, times 4 bytes per integer
Socket.PAYLOAD_LENGTH = 6 //6th integer array index

Socket.resend_instruction = null
Socket.resend_count = null

Socket.robot_name_to_ws_instance_map = {}
Socket.DEGREES_PER_DYNAMIXEL_UNIT = 0.29

module.exports = Socket
var {Robot} = require('./robot.js')
var {Instruction, make_ins} = require("./instruction.js")
var DexterSim = require("./dextersim.js")
var {out} = require("./out.js")



//Socket.on_receive_added = false