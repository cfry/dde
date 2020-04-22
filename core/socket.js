/* Created by Fry on 2/4/16. */
//https://www.hacksparrow.com/tcp-socket-programming-in-node-js.html
const net = require("net")

//never create an instance
var Socket = class Socket{
    static init(robot_name //, simulate, ip_address, port=50000
            ){
        //out("Creating Socket for ip_address: " + ip_address + " port: "   + port + " robot_name: " + robot_name)
        let rob = Robot[robot_name]
        const sim_actual = Robot.get_simulate_actual(rob.simulate) //true, false, or "both"
        //if(Socket.robot_name_to_ws_instance_map[robot_name]){
        //    this.close(robot_name)
        //}
        if ((sim_actual === true)  || (sim_actual == "both")) {
            DexterSim.create_or_just_init(robot_name, sim_actual)
            out("Simulating socket for Robot." + robot_name + ". is_connected? " + Robot[robot_name].is_connected)
        }
        if ((sim_actual === false) || (sim_actual == "both")) {
            if(!Socket.robot_name_to_ws_instance_map[robot_name]){
                try {
                    let ws_inst = new net.Socket()
                    Socket.robot_name_to_ws_instance_map[robot_name] = ws_inst
                    ws_inst.on("data", function(data) { Socket.on_receive(data, robot_name) })
                    out("Now attempting to connect to Dexter: " + robot_name + " at ip_address: " + rob.ip_address + " port: " + rob.port + " ...", "brown")
                    ws_inst.connect(rob.port, rob.ip_address, function(){
                        Socket.new_socket_callback(robot_name)
                    })

                }
                catch(e){
                    dde_error("Error attempting to create socket: " + e.message)
                    this.close(robot_name, true)
                }
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
            Socket.send(robot_name, Socket.resend_instruction)
        }
    }

    static oplet_array_or_string_to_array_buffer(oplet_array_or_string){
        let str = this.oplet_array_or_string_to_string(oplet_array_or_string)
        return this.string_to_array_buffer(str)
    }

    static oplet_array_or_string_to_string(oplet_array_or_string) {
        if (typeof(oplet_array_or_string) == "string") { return oplet_array_or_string }
        else {
            let str = ""
            for(var i = 0; i < oplet_array_or_string.length; i++){
                let suffix = ((i == (oplet_array_or_string.length - 1))? ";": " ")
                //let elt = oplet_array_or_string[i] + suffix
                let elt = oplet_array_or_string[i]
                if (Number.isNaN(elt)) { elt = "NaN" } //usually only for "a" instructions and only for elts > 4
                  //looks like this is never used now because I convert from NaN to the prev val
                  //in the the higher level code so only numbers get passed to DexRun.
                elt = elt + suffix
                str += elt
            }
            return str
        }
    }

    static string_to_array_buffer(str){
        var arr_buff = Buffer.alloc(128) //dexter code expecting fixed length buf of 128
        //var view1    = new Uint8Array(arr_buff)
        for(var i = 0; i < str.length; i++){
            let char = str[i]
            let code = char.charCodeAt(0)
            arr_buff[i] = code
        }
        return arr_buff
    }

    //also converts S params: "MaxSpeed", "StartSpeed", "Acceleration", S params of  boundry
    //and  the z oplet. Note that instruction start and end times are always in milliseconds
    static instruction_array_degrees_to_arcseconds_maybe(instruction_array, rob){
        if(typeof(instruction_array) == "string") { return instruction_array} //no conversion needed.
        const oplet = instruction_array[Dexter.INSTRUCTION_TYPE]
        let number_of_args = instruction_array.length - Instruction.INSTRUCTION_ARG0
        if ((oplet == "a") || (oplet == "P")){
            //take any number of angle args
            let instruction_array_copy = instruction_array.slice()
            let angle_args_count = instruction_array_copy.length - Instruction.INSTRUCTION_ARG0
            for(let i = 0; i < number_of_args; i++) {
                let index = Instruction.INSTRUCTION_ARG0 + i
                let arg_val = instruction_array_copy[index]
                let converted_val
                if (i == 5) { //J6
                    converted_val = 512 + Math.round(arg_val / Socket.DEGREES_PER_DYNAMIXEL_UNIT) //convert degrees to dynamixel units to get dynamixel integer from 0 through 1023 going from 0 to 296 degrees
                }
                else if (i == 6) { //J7
                    converted_val = Math.round(arg_val / Socket.DEGREES_PER_DYNAMIXEL_UNIT) //convert degrees to dynamixel units to get dynamixel integer from 0 through 1023 going from 0 to 296 degrees
                }
                else {//J1 thru J5  for J1, i == 0
                    converted_val = Math.round(arg_val * 3600) //still might be a NaN
                    //if(i == 1) { out("soc J2: " + arg_val + " arcsec: " + converted_val) } //degugging statement only
                }
                instruction_array_copy[index] = converted_val
            }
            return instruction_array_copy
        }
        else if (oplet == "S") {
            const name = instruction_array[Instruction.INSTRUCTION_ARG0]
            const args = instruction_array.slice(Instruction.INSTRUCTION_ARG1, instruction_array.length)
            const first_arg = args[0]
            //first convert degress to arcseconds
            if(["MaxSpeed", "StartSpeed", "Acceleration",
                "AngularSpeed", "AngularSpeedStartAndEnd", "AngularAcceleration",
                "CartesianPivotSpeed", "CartesianPivotSpeedStart", "CartesianPivotSpeedEnd",
                "CartesianPivotAcceleration", "CartesianPivotStepSize" ].includes(name)){
                let instruction_array_copy = instruction_array.slice()
                instruction_array_copy[Instruction.INSTRUCTION_ARG1] = Math.round(first_arg * _nbits_cf)
                return instruction_array_copy
            }
            else if (name.includes("Boundry")) {
                let instruction_array_copy = instruction_array.slice()
                instruction_array_copy[Instruction.INSTRUCTION_ARG1] = Math.round(first_arg * 3600) //deg to arcseconds
                return instruction_array_copy
            }
            else if (["CommandedAngles", "RawEncoderErrorLimits", "RawVelocityLimits"].includes(name)){
                let instruction_array_copy = instruction_array.slice()
                for(let i = Instruction.INSTRUCTION_ARG1; i <  instruction_array.length; i++){
                    let orig_arg = instruction_array_copy[1]
                    instruction_array_copy[i] = Math.round(orig_arg * 3600)
                }
                return instruction_array_copy
            }
            //dynamixel conversion
            else if (name == "EERoll"){ //J6 no actual conversion here, but this is a convenient place
                        //to put the setting of robot.angles and is also the same fn where we convert
                        // the degrees to dynamixel units of 0.20 degrees
                        //val is in dynamixel units
                rob.angles[5] = first_arg * Socket.DEGREES_PER_DYNAMIXEL_UNIT //convert dynamixel units to degrees then shove that into rob.angles for use by subsequent relative move instructions
                return instruction_array
            }
            else if (name == "EESpan") { //J7
                rob.angles[6] = first_arg * Socket.DEGREES_PER_DYNAMIXEL_UNIT
                return instruction_array
            }
            //convert meters to microns
            else if ((name.length == 5) && name.startsWith("Link")){
                let instruction_array_copy = instruction_array.slice()
                let new_val = Math.round(first_arg / _um) //convert from meters to microns
                instruction_array_copy[Instruction.INSTRUCTION_ARG1] = new_val
            }
            else if ("LinkLengths" == "name"){
                let instruction_array_copy = instruction_array.slice()
                for(let i = Instruction.INSTRUCTION_ARG1; i < instruction_array.length; i++){
                    let orig_arg = instruction_array_copy[1]
                    instruction_array_copy[i] = Math.round(orig_arg / _um)
                }
                return instruction_array_copy
            }
            else if (["CartesianSpeed", "CartesianSpeedStart", "CartesianSpeedEnd", "CartesianAcceleration",
                      "CartesianStepSize", ].includes(name)){
                let instruction_array_copy = instruction_array.slice()
                let new_val = Math.round(first_arg / _um) //convert from meters to microns
                instruction_array_copy[Instruction.INSTRUCTION_ARG1] = new_val
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

    static send(robot_name, oplet_array_or_string){ //can't name a class method and instance method the same thing
        //onsole.log("Socket.send passed oplet_array_or_string: " + oplet_array_or_string)
        let rob = Robot[robot_name]
       	if(oplet_array_or_string !== Socket.resend_instruction){ //we don't want to convert an array more than once as that would have degreees * 3600 * 3600 ...
       	                                                     //so only to the convert on the first attempt.
            oplet_array_or_string = Socket.instruction_array_degrees_to_arcseconds_maybe(oplet_array_or_string, rob)
        }
        let job_id = Instruction.extract_job_id(oplet_array_or_string)
        let job_instance = Job.job_id_to_job_instance(job_id)
        const str =  Socket.oplet_array_or_string_to_string(oplet_array_or_string)
        if(job_instance.keep_history) {
            job_instance.sent_instructions_strings.push(str)
        }
        const arr_buff = Socket.string_to_array_buffer(str)
        const sim_actual = Robot.get_simulate_actual(rob.simulate)
        if((sim_actual === true) || (sim_actual === "both")){
            DexterSim.send(robot_name, arr_buff)
        }
        if ((sim_actual === false) || (sim_actual === "both")) {
            let ws_inst = Socket.robot_name_to_ws_instance_map[robot_name]
            if(ws_inst) {
                try {
                    ws_inst.write(arr_buff) //if doesn't error, success and we're done with send
                    Socket.resend_instruction = null
                    Socket.resend_count       = null
                    //this.stop_job_if_socket_dead(job_id, robot_name)
                    return
                }
                catch(err) {
                    if(oplet_array_or_string === Socket.resend_instruction) {
                        if (Socket.resend_count >= 4) {  //we're done
                            job_instance.stop_for_reason("errored_from_dexter", "can't connect to Dexter")
                            //job_instance.color_job_button() //automatically done by job.prototype.finish
                            job_instance.set_up_next_do(0)  //necessary?
                            return
                        }
                        else { //keep trying
                            Socket.resend_count += 1
                            Socket.close(robot_name, true) //both are send args
                            let timeout_dur = Math.pow(10, Socket.resend_count)
                            setTimeout(function(){
                                Socket.init(robot_name)
                            }, timeout_dur)
                            return
                        }
                    }
                    else { //first attempt failed so initiate retrys
                        Socket.resend_instruction =  oplet_array_or_string
                        Socket.resend_count = 0
                        Socket.close(robot_name, true) //both are send args
                        let timeout_dur = Math.pow(10, Socket.resend_count)
                        setTimeout(function(){
                            Socket.init(robot_name)
                        }, timeout_dur)
                        return
                    }
                }
            }
            else {
                Socket.close(robot_name, true) //both are send args
                setTimeout(function(){
                    Socket.init(robot_name)
                }, 100)
                return
            }
        }
    } //end of send method
    /* apr 2019: sim calls on_receive now
    static on_receive_sim(robot_status_in_arcseconds, robot_name){ //robot_status_in_arcseconds might also be an ack_array, wbich doens't have any degrees, and won't be converted. or modified.
        let rob = Robot[robot_name]
        let sim_actual = Robot.get_simulate_actual(rob.simulate)
        if(sim_actual === true) { //don't include "both"
            Socket.convert_robot_status_to_degrees(robot_status_in_arcseconds) //modifies its input
            rob.robot_done_with_instruction(robot_status_in_arcseconds) //now robot_status_in_arcseconds is really in degrees
        }
        //else {} rob.simulate will be "both", so let the real Dexter supply the call to
        //rob.robot_done_with_instruction and the rs_status from Dexter, not the simulated one.
    }*/

    //called both from Dexter returning, and from Sim.
    //data should be a Buffer object. https://nodejs.org/api/buffer.html#buffer_buffer
    //payload_string_maybe is undefined when called from the robot,
    //and if called from sim and we have an "r" oplet, it is either a string (everything ok)
    //or an integer (1) when sim get file-not-found.
    //
    static on_receive(data, robot_name, payload_string_maybe){
        //data.length == 240 data is of type: Uint8Array, all values between 0 and 255 inclusive
        //onsole.log("Socket.on_receive passed data: " + data)
        let robot_status
        let oplet
        if(Array.isArray(data)) {  //a status array passed in from the simulator
            robot_status = data
            oplet = robot_status[Dexter.INSTRUCTION_TYPE]
        }
        else { //a Uint8Array when called from the robot.
            let view1 = new Int32Array(data.buffer) //array_buff1.bytelength / 4); //weird google syntax for getting length of a array_buff1
            robot_status = []
            for(var i = 0; i < view1.length; i++){
                var elt_int32 = view1[i]
                robot_status.push(elt_int32)
            }
            let opcode = robot_status[Dexter.INSTRUCTION_TYPE]
            oplet  = String.fromCharCode(opcode)
        }
        //the simulator automatically does this so we have to do it here in non-simulation

        robot_status[Dexter.INSTRUCTION_TYPE] = oplet
        if(oplet == "r"){ //Dexter.read_file
            if(typeof(payload_string_maybe) == "number") { //only can hit im sim.// should be 2 if it hits
                robot_status[Dexter.ERROR_CODE] = 0 //even though we got an error from file_not_found,
                //don't set the error in the robot status. Just let that error
                //be used in r_payload_grab_aux which passes it to got_content_hunk
                //which sets the user data to the error code and
                // read_file_instance.is_done = true
                //so the loop in read_file_instance terminates normally.
            }
            else if ((payload_string_maybe === undefined) && //real. not simulated
                     (robot_status[Dexter.ERROR_CODE] > 0)) { //got an error, probably file not found
                payload_string_maybe = robot_status[Dexter.ERROR_CODE]
                robot_status[Dexter.ERROR_CODE] = 0
            }
            //now robot_status does NOT have an error code, but if there is an error,
            //payload_string_maybe is an int > 0
            //but if no error, payload_string_maybe is a string
            Socket.r_payload_grab(data, robot_status, payload_string_maybe)
        }
        else {
            Socket.convert_robot_status_to_degrees(robot_status)
        }
        let rob = Dexter[robot_name]
        //Socket.robot_is_waiting_for_reply[robot_name] = false
        rob.robot_done_with_instruction(robot_status) //robot_status ERROR_CODE *might* be 1
    }

    static r_payload_grab(data, robot_status, payload_string_maybe) {
        if(payload_string_maybe === undefined) { //only in real, not in sim
            let payload_length = robot_status[Socket.PAYLOAD_LENGTH]
            let data_start = Socket.PAYLOAD_START
            let data_end = data_start + payload_length
            payload_string_maybe = (data.slice(data_start, data_end).toString())
        }
        else if (payload_string_maybe instanceof Buffer) { //beware, sometimes payload_string_maybe is a buffer. This converts it to a string.
            payload_string_maybe = payload_string_maybe.toString()
        }
        //else { payload_string_maybe is normally a string, but could be an integer of > 0 if there's an error }
        Socket.r_payload_grab_aux(robot_status, payload_string_maybe)  //payload_string still might be an integer error code, ie 1 when file not found
    }

    //payload_string_maybe could be a string or an integer error code like 1 when no file found
    static r_payload_grab_aux(robot_status, payload_string_maybe){
        let job_id = robot_status[Dexter.JOB_ID]
        let ins_id = robot_status[Dexter.INSTRUCTION_ID]
        Instruction.Dexter.read_file.got_content_hunk(job_id, ins_id, payload_string_maybe)
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

    static close(robot_name, force_close=false){
        let rob = Robot[robot_name]
        const sim_actual = Robot.get_simulate_actual(rob.simulate)
        if ((sim_actual === true) || (sim_actual === "both")){ //simulation
            DexterSim.close(robot_name)
        }
        if ((sim_actual === false) || (sim_actual == "both")){
            if((rob.active_jobs_using_this_robot().length == 0) || force_close){
                const ws_inst = Socket.robot_name_to_ws_instance_map[robot_name]
                if(ws_inst){
                    ws_inst.removeAllListeners()
                    ws_inst.destroy()
                    delete Socket.robot_name_to_ws_instance_map[robot_name]
                }
            }
        }
    }

    static empty_instruction_queue_now(robot_name){
        let rob = Robot[robot_name]
        const sim_actual = Robot.get_simulate_actual(rob.simulate)
        if ((sim_actual === true) || (sim_actual === "both")){ //simulation
            DexterSim.empty_instruction_queue_now(robot_name)
        }
        if ((sim_actual === false) || (sim_actual == "both")){
            const ws_inst = Socket.robot_name_to_ws_instance_map[robot_name]
            if(ws_inst && !ws_inst.destroyed){
                const oplet_array = make_ins("E") //don't expect to hear anything back from this.
                const arr_buff = this.oplet_array_or_string_to_array_buffer(oplet_array)
                try { ws_inst.write(arr_buff) } //band-aid for not knowing what's in Dexter's queue.
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
var {Robot} = require("./robot.js")
var {Instruction, make_ins} = require("./instruction.js")
var DexterSim = require("./dextersim.js")
//var {_nbits_cf, _arcsec, _um} = require("./units.js") //don't do this. These units and all the rest are
//already global vars.



//Socket.on_receive_added = false