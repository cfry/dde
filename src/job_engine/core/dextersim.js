/* Created by Fry on 3/30/16.*/
//whole file loaded in  env only as is tcp

//import {Robot, Dexter} from "./robot.js" //dde4 not needed as Robot, Dexter now global
//import {Socket}        from "./socket.js" //dde4 Socket is now global
//import {Instruction}   from "./instruction.js" //dde4 Instruction is now global

//import {Kin}           from "../math/Kin.js"    //dde4 Kin is now global
//import {Vector}        from "../math/Vector.js" //dde4 Vector is now global
//import {Simqueue}      from "./simqueue.js"     //dde4 SimQueue is now global

class DexterSim{
    static robot_name_to_dextersim_instance_map = {}

    constructor(robot_name){ //called once per DDE session per robot_name by create_or_just_init
        this.robot_name = robot_name
        this.robot      = Robot[robot_name] //mostly used by predict_move_dur
        DexterSim.robot_name_to_dextersim_instance_map[robot_name] = this
        this._angles_dexter_units = [0,0,0,0,0,
                                   Socket.degrees_to_dexter_units(0, 6), //different from the others because for the others, 0 deg is also 0 dexter units, but not for j6
                                   50];  //50 which is the new HOME angle so that j7 doesn't overtorque.
        
        this.angles_dexter_units = new Proxy(this._angles_dexter_units,{
            set(obj, prop, value) {
                if(isNaN(value))
                {
                    debugger;
                    return false;
                }
                obj[prop] = value;
                return true;
            }
        });
        
        this.pid_angles_dexter_units = [0,0,0,0,0,0,0]  //last 2 angles are always zero.
        this.parameters = {} //record latest set_parameter values for simulator, esp for AngularSpeed
    }

    compute_measured_angles_dexter_units(){
        return Vector.add(this.angles_dexter_units, this.pid_angles_dexter_units)
    }

    compute_measured_angles_degrees(){
        let ma_du = this.compute_measured_angles_dexter_units()
        return Socket.dexter_units_to_degrees_array(ma_du)
    }

    compute_measured_angle_degrees(joint_number){ //joint is 1 thru 7
        let ma_du = this.angles_dexter_units[joint_number - 1]
        let ma_deg = Socket.dexter_units_to_degrees(ma_du, joint_number)
        return ma_deg
    }

    static is_simulator_running(){
        for(let rob_name in DexterSim.robot_name_to_dextersim_instance_map){
            let sim_instance = DexterSim.robot_name_to_dextersim_instance_map[rob_name]
            if(sim_instance.queue_instance.is_simulator_running()){
                return true
            }
        }
        return false
    }

    simout(string){
       let sim_html = '<span style="color:black; background-color:#ab99ff;"> &nbsp;Simulator: </span> &nbsp;&nbsp;'
        let rob_name = "Dexter." + this.robot_name
        out(sim_html + rob_name + " " + string, undefined, true) //temp printout
    }

    //sim_actual passed in is either true or "both"
    //called by Socket.init. This is the top level initializer for the simulator
    static create_or_just_init(robot_name, sim_actual = "required"){
        if (!DexterSim.robot_name_to_dextersim_instance_map){
            DexterSim.init_all()
        }
        var sim_inst = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
        if(!sim_inst) {
            sim_inst = new DexterSim(robot_name)
            sim_inst.init(sim_actual)
        }
        else {
            let cur_dex_inst_of_name = Dexter[robot_name]
            sim_inst.robot = cur_dex_inst_of_name //because if the user redefined the robot of that name
            //since the last time they made a DexterSim instance, sim_inst will have the old dexter inst,
            //so we need to update it.
            sim_inst.sim_actual = sim_actual
        }
        //if (sim_actual === true) { //do not call new_socket_callback if simulate is "both" because we don't want to call it twice
        //    Socket.new_socket_callback(robot_name)
        //}
    }

    static init_all(){ //called once per DDE session (normally)
        DexterSim.robot_name_to_dextersim_instance_map = {}
        //DexterSim.set_interval_id = setInterval(DexterSim.process_next_instructions, 10)
    }

    //called by Socklet.send when reboot_robot sent
    //After Dexter is sent a reboot instruction, it continues to run the items in its queue,
    //but does not accept new instructions, so simulate that.
    static uninit(robot_name, tries=0){
        let dexsim = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
        if(dexsim.queue_instance.is_queue_empty() || (tries === 80)) { //80 * 200 = 16 secs. If the queue hasn't empied by that time, kill it anyway
            setTimeout(function() {
                delete DexterSim.robot_name_to_dextersim_instance_map[robot_name]
            }, 4000) //Give the last instruction in  the queue a chance to finish, then kill it
        }
        else {
            setTimeout(function(){DexterSim.uninit(robot_name, tries + 1)},
                200)
        }
    }

    init(sim_actual){
        this.sim_actual = sim_actual
        this.queue_instance  = new Simqueue(this)
        this.queuej_instance = new SimqueueJ(this)

        //these should be in dexter_units
        this.parameters = { //set_params. see Socket.js instruction_array_degrees_to_arcseconds_maybe
            Acceleration:  0.0001,        // in _nbits_cf units
            AngularSpeed: 30 * 3600, //must be here so that the dur for a move can be computed in DexterSim.predict_a_instruction_dur_in_ms
            MaxSpeed:     30 * _nbits_cf, // in _nbits_cf units

            StartSpeed:    0 * _nbits_cf  // in _nbits_cf units
        }
        this.status_mode = 0 //can also be 1, set by "g" command.
        this.fpga_register = new Array(Instruction.w_address_names.length) //the make_ins("w", index, val) instructions stored here. //write fpga register
        this.fpga_register.fill(0)
        this.write_file_file_name = null
        this.write_file_file_content = "" //grows as "m" instructions come in
        this.last_instruction_sent = null

        // not used  this.pid_angles_arcseconds      = [0,0,0,0,0,0,0]
        this.velocity_arcseconds_per_second = [0,0,0,0,0,0,0]
    }

    static array_buffer_to_string(arr_buff, terminating_char=";"){
        let str = arr_buff.toString()
        let end_index = str.indexOf(terminating_char)
        return str.substring(0, end_index)
    }

    //this fn obsoleted by dde4 and str's getting sent from Socket, not arr_buff's
    static array_buffer_to_oplet_array(arr_buff){
        let str = this.array_buffer_to_string(arr_buff)
    }

    static str_to_oplet_array(str) {
        if(str.endsWith(";")) {
            str = str.substring(0, str.length - 1) //cut off the semicolon on the end
        }
        let split_str = str.split(/[ ,]+/)//separator can be space, comma, or any combination of them. use to be just: " ", but that's not what dexrun does
        //if its a var length instruction, then an integer is in place of the oplet and the oplet is one later
        let orig_oplet_maybe = split_str[Instruction.INSTRUCTION_TYPE]
        if(!Robot.is_oplet(orig_oplet_maybe)) { //assume its an integer for a variable-length instruction
            split_str.splice(Instruction.INSTRUCTION_TYPE, 1) //removes integer from var length array. makign it 1 shorter
        }
        let oplet_array = []
        let oplet
        for(let i = 0; i <  split_str.length; i++) {
            let substr = split_str[i]
            if(i == Instruction.INSTRUCTION_TYPE) {
                oplet = substr[0] //dde4: substr is someimes "g;" so get rid of the semicolon.
                oplet_array.push(oplet)
                if(substr.endsWith(";")) {
                    substr = substr.substring(0, (substr.length - 1)) //cut off the trailing semicolon
                    break;
                }
                else                     { continue; }
            }
            else if ((oplet == "W") && (i == Instruction.INSTRUCTION_ARG2)) { //this is the payload of Dexter.write_file
                //let raw_string = arr_buff.toString() //can't use str because that ends at first semicolon, and payload might have semicolons in it.
                //don't do the above, str can now have semicolons in it beecause its not filtered by  array_buffer_to_string
                //cutting everything after semicolon off.

                let ending_semicolon_pos = str.lastIndexOf(";") //note that the payload might have semicolons in it so don't choose those by using LASTindexOf
                let W_pos = str.indexOf(" W ")
                let start_payload_length_pos = W_pos + 5 //5 skips over the "W f " (oplet and write_kind letter and spaces)
                //but now we must skip over the payload length, which is an int of variable length
                let start_payload_pos = str.indexOf(" ", start_payload_length_pos) + 1 //skip over palyoad length and the space after it
                let payload = str.substring(start_payload_pos, ending_semicolon_pos) //excludes final semicolon
                oplet_array.push(payload)
                break;
            }
            else if (substr == ";")         { break }
            else if (substr == "")          {} //ignore. this is having more than one whitespace together. Just throw out
            else if (substr == "undefined") { oplet_array.push(undefined) }
            else if (substr == "undefined;") {
                oplet_array.push(undefined)
                break;
            }
            else if (substr == "NaN")       { oplet_array.push(NaN) }
            else if (substr == "NaN;")      {
                oplet_array.push(NaN)
                break;
            }
            else {
                let num_maybe = parseFloat(substr) //most are ints but some are floats
                if(Number.isNaN(num_maybe)) { oplet_array.push(substr) } //its a string
                else                        { oplet_array.push(num_maybe) } //its an actual number
                if(substr.includes(";")) { break; } //this clause new in dde4. Allows input str to have a semicolon,
                 //and to use that semicolon in a W oplet's payload, while also
                 //ignoring chars after the semicolon. //todo dde4 needs testing
            }
        }
        return oplet_array
    }

    //used in Simqueue for showing sent instructions
    job_of_last_instruction_sent() {
        let instr = this.last_instruction_sent
        if(!instr) { return null }
        else {
            let job_id = instr[Instruction.JOB_ID]
            return Job.job_id_to_job_instance(job_id)
        }
    }

    //called from Socket.send
    //typically adds instruction to ds_instance.instruction_queue
    static async send(robot_name, str){ //use to take arr_buff as 2nd arg in dde3
        let instruction_array = //obsolete in dde4:  this.array_buffer_to_oplet_array(arr_buff) //instruction_array is in dexter_units
                                this.str_to_oplet_array(str)
        //out("Sim.send passed instruction_array: " + instruction_array + " robot_name: " + robot_name)
        let ds_instance = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
        /*if(!ds_instance) {
            let rob = Dexter[robot_name]
            rob.instruction_to_send_on_connect = instruction_array
            const sim_actual = Robot.get_simulate_actual(rob.simulate)
            this.create_or_just_init(robot_name, sim_actual)
            return
        }*/
        ds_instance.last_instruction_sent = instruction_array
        let ins_args = Instruction.args(instruction_array) //in dexter_units
        let oplet  = instruction_array[Dexter.INSTRUCTION_TYPE]
        switch(oplet) {
            case "a":
                ds_instance.queue_instance.add_to_queue(instruction_array)
                ds_instance.ack_reply_maybe(instruction_array)
                break;
            case "e": //cause an error. Used for testing only
                //not needed as ack_reply pulls the error_code out of instruction_array for "e" oplets. let the_error_code = instruction_array[Instruction.INSTRUCTION_ARG0]
                ds_instance.ack_reply_maybe(instruction_array)
                break;
            case "E": //not implemented on Dexter Mar 13, 2021 but should be. Requires FPGA programming
                ds_instance.queue_instance.empty_instruction_queue() //this will call ack_reply IFF the queue is blocked (by a previous "F" cmd
                break;
            case "F": //empty_instruction_queue. blocks adding to queue until its empty.
                ds_instance.queue_instance.set_queue_blocking_instruction(instruction_array)
                //do not ack_reply! That happens when all items removed from the queue.
                break;
            case "g":
                let inst_status_mode = instruction_array[Instruction.INSTRUCTION_ARG0]
                if ((inst_status_mode === null) || (inst_status_mode === undefined)) {
                    ds_instance.status_mode = 0
                } //helps backwards compatibility pre status modes.
                else {
                    ds_instance.status_mode = inst_status_mode
                }
                ds_instance.ack_reply(instruction_array)
                break;
            /*case "G": //deprecated. get immediate. The very first instruction sent to send should be  "G",
                                     //so let it be the first call to process_next_instruction & start out the setTimeout chain
                ds_instance.add_instruction_to_queue(instruction_array) //stick it on the front of the queue so it will be done next
                break;*/
            case "h": //doesn't go on instruction queue, just immediate ack
                ds_instance.ack_reply(instruction_array)
                break;
            case "j":
                console.log("DexterSim.send passed 'j' oplet: " + instruction_array)
                ds_instance.queuej_instance.add_to_queue(instruction_array)
                ds_instance.ack_reply_maybe(instruction_array) //send back the original
                break;
            case "M": //move to.  convert to an "a" array and use that.
                //note: doesn't encode j6 and j7.
                //see: https://github.com/HaddingtonDynamics/OCADO/wiki/Command-oplet-instruction
                let ins_arr_a = instruction_array.slice(0, Instruction.INSTRUCTION_ARG0)
                ins_arr_a[Instruction.INSTRUCTION_TYPE] = "a"
                let xyz_meters = [instruction_array[Instruction.INSTRUCTION_ARG0] / 1000000,  //x
                    instruction_array[Instruction.INSTRUCTION_ARG1] / 1000000,  //y
                    instruction_array[Instruction.INSTRUCTION_ARG2] / 1000000]  //z

                let direction  = [instruction_array[Instruction.INSTRUCTION_ARG3],
                    instruction_array[Instruction.INSTRUCTION_ARG4],
                    instruction_array[Instruction.INSTRUCTION_ARG5]]

                let config     = [instruction_array[Instruction.INSTRUCTION_ARG6],
                    instruction_array[Instruction.INSTRUCTION_ARG7],
                    instruction_array[Instruction.INSTRUCTION_ARG8]]

                let new_angles_deg = Kin.xyz_to_J_angles(xyz_meters, direction, config)
                for(let i = 0; i < 5; i++) {
                    let deg = new_angles_deg[i]
                    let arcsec = deg * 3600
                    ins_arr_a.push(arcsec)
                }
                ds_instance.queue_instance.add_to_queue(ins_arr_a)
                ds_instance.ack_reply_maybe(instruction_array) //return the orig "M" array
                break;
            case "P": //does not go on queue  //ds_instance.queue_instance.add_to_queue(instruction_array)
                //pid_move_all_joints for j6 and 7 are handled diffrently than J1 thru 5.
                //IF we get a pid_maj for j6 and/or j7, just treat it like
                // an maj for j6 and j7, ie just more the joints to those locations.
                //pid_move_all_joints can construct an istruction array that has less than 7 joint angles.
                //IF a j6 or j7 is NOT present, then don't do anything with j6 and j7 ie don't set it to zero.
                let pid_ang_du = Instruction.extract_args(instruction_array) //probably will be 5 long but could be 7
                for (let i = 0; i < pid_ang_du.length; i++) {
                    let new_ang = pid_ang_du[i]
                    if (i < 5) {
                        ds_instance.pid_angles_dexter_units[i] = new_ang
                    } else {
                        ds_instance.angles_dexter_units[i] = new_ang //j6 & J7.
                    }
                }
                let ma_deg = ds_instance.compute_measured_angles_degrees()
                //let angle_degrees_array = Socket.dexter_units_to_degrees_array(ds_instance.angles_dexter_units)
                //let pid_angle_degrees_array = Socket.dexter_units_to_degrees_array(ds_instance.pid_angles_dexter_units)
                //let sum_degrees_array = Vector.add(angle_degrees_array, pid_angle_degrees_array).slice(0, 5)
                if (SimUtils.is_simulator_showing()) {
                    SimUtils.render_j1_thru_j5(ds_instance) //todo this just jumps to the new angles, not move smoothly as it should
                    if (pid_ang_du.length > 5) {
                        SimUtils.render_j6(ds_instance)
                    }
                    if (pid_ang_du.length > 6) {
                        SimUtils.render_j7(ds_instance) //don't bother to pass xyz and robot.pose as that's only used by simBuild.
                    }
                }
                ds_instance.ack_reply(instruction_array)
                break;
            case "r": //Dexter.read_file. does not go on queue
                let is_reboot_inst = Dexter.is_reboot_instruction(instruction_array)
                if (is_reboot_inst) { //don't do ack_reply as the actual robot doesn't send back a robot status
                    DexterSim.uninit(robot_name) //its over for this Dexter.
                    warning("Rebooting simulated Dexter." + robot_name + " due to running reboot instruction.")
                }
                else {
                    let payload_string_maybe = await ds_instance.process_next_instruction_r(instruction_array)
                    ds_instance.ack_reply(instruction_array, payload_string_maybe)
                }
                break;
            case "S":
                let param_name = ins_args[0]
                let param_val  = ins_args[1]
                if(["Acceleration", "MaxSpeed", "StartSpeed"].includes(param_name)) {
                    ds_instance.queue_instance.set_instruction_done_action(param_name, param_val)
                }
                //EERoll & EESpan *ought* to go on queue but Dexter Mar 19, 2021 does them immediately
                //so the simulator follows suit.
                //Also, the belwo sets the peasured angles immediately to the commanded angle
                //bit really should "animate" it based on the speed of these motors
                //though they're much faster than j1 thru 5.
                //Note that if the robot has 320 motors vs 430, the speed will vary.
                //So this is a cheap simulation.
                else {
                    if(param_name === "EERoll") { //joint 6
                        //ds_instance.measured_angles_dexter_units[5] = param_val
                        ds_instance.queue_instance.start_running_j6_plus_instruction(6, param_val)
                    }
                    else if(param_name === "EESpan") { //joint 7
                        //ds_instance.measured_angles_dexter_units[6] = param_val
                        ds_instance.queue_instance.start_running_j6_plus_instruction(7, param_val)
                    }
                    //else if(param_name === "RebootServo"){
                       //we don't need special processing for RebootServo. After it will be
                       //a "z" oplet instruction (Dexter.sleep) that will cause Sim queue to show "sleep"
                    //}
                    else {
                        ds_instance.parameters[param_name] = param_val
                        if(param_name === "MaxSpeed"){ //in order to make ethe simulator work on changes to MaxSpeed, we update the AngularSpeed too
                            //bcuase the simulator runs off of the AngularSpeed setting
                            let speed_in_deg = param_val / _nbits_cf
                            let new_angular_speed_in_arcsecs = speed_in_deg * 3600
                            ds_instance.parameters["AngularSpeed"] = new_angular_speed_in_arcsecs
                        }
                        ds_instance.simout("set parameter: " + param_name + " to " + param_val)
                    }
                }
                ds_instance.ack_reply(instruction_array)
                break;
            case "T":
                let angles_dexter_units = ds_instance.convert_T_args_to_joint_angles_dexter_units(ins_args)
                let new_instruction_array = instruction_array.slice(0, Instruction.INSTRUCTION_ARG0)
                new_instruction_array[Instruction.INSTRUCTION_TYPE] = "a" //change from "T" to "a"
                new_instruction_array.concat(angles_dexter_units)
                ds_instance.queue_instance.add_to_queue(instruction_array) //just like "a" for now

            case "w": //write fpga register
                const write_location = ins_args[0]
                if (write_location < ds_instance.fpga_register.length) {
                    let new_val = ins_args[1]
                    ds_instance.fpga_register[write_location] = new_val
                    let reg_name = Instruction.w_address_names[write_location]
                    ds_instance.simout("FPGA Register: " + reg_name + " ( " + write_location + " )  set to: " + new_val)
                    ds_instance.ack_reply(instruction_array)
                }
                else { shouldnt('DexterSim.fpga_register is too short to accommodate "w" instruction<br/> with write_location of: ' +
                    write_location + " and value of: " + ins_args[1]) 
                }  
                 break;
            case "W": //write file
                ds_instance.process_next_instruction_W(ins_args)
                ds_instance.ack_reply(instruction_array)
                break;
            case "z": //sleep, first arg holds microseconds dur
                //all sleep does is wait for the dur, (starting when the instruction is received
                // by the robot) and then return the ack_reply.
                //so it just holds up DDE sending more instructions.
                //Any ongoing queued instructions just keep running as they would
                //without the sleep.
                //When the dur is up, the queue_instance takes care of sending the ack_reply.
                ds_instance.queue_instance.start_sleep(instruction_array)
                break;
            default:
                let temp_str = "non_normal_oplet_" + oplet //prevent this from being printed more than once between out pane clearnings
                warning("In DexterSim.send, got instruction not normally processed: " + temp_str + " in instruction_array: " + instruction_array)
                ds_instance.ack_reply(instruction_array)
                break;
        }
    }

    //this is called by "a" and "P" instructions only, ie only
    //instuctions that add to the queue.
    ack_reply_maybe(instruction_array, payload_string_maybe){
        if(this.queue_instance.is_queue_full()) {
            let the_job = Job.active_job_with_robot(this.robot)
            if (the_job.show_instructions) { //if we're doing a move_to_straight instruction, there's a lot of instrs per sec, so good to be able to stop this printout as it slows down sim
                this.simout("queue is full.<br/>There will be no reply until the current instruction completes.")
            }
        }
        else {
            this.ack_reply(instruction_array, payload_string_maybe)
        }
    }

    //hacked to now create and pass to on_receive a full robot status
    //payload_string_maybe might be undefined, a string payload or an error number positive int.
    ack_reply(instruction_array, payload_string_maybe){
        let job_id = instruction_array[Instruction.JOB_ID]
        let job_instance = Job.job_id_to_job_instance(job_id)
        let robot_status_array = Dexter.make_default_status_array_g_sm(this.status_mode)
        let rs_inst = new RobotStatus({robot_status: robot_status_array})
        let opcode = instruction_array[Instruction.INSTRUCTION_TYPE]
        robot_status_array[Dexter.JOB_ID] = job_id
        robot_status_array[Dexter.INSTRUCTION_ID] = instruction_array[Instruction.INSTRUCTION_ID]
        robot_status_array[Dexter.START_TIME] = instruction_array[Instruction.START_TIME] //Date.now()
        robot_status_array[Dexter.STOP_TIME] = Date.now()
        robot_status_array[Dexter.INSTRUCTION_TYPE] = opcode //leave this as a 1 char string for now. helpful for debugging
        if ((opcode === "r") &&
            (typeof (payload_string_maybe) == "number") &&
            (payload_string_maybe > 0)) {
            robot_status_array[Dexter.ERROR_CODE] = payload_string_maybe
        } else if (opcode === "e") {
            robot_status_array[Dexter.ERROR_CODE] = instruction_array[Dexter.ERROR_CODE]
        }
        if (rs_inst.supports_measured_angles()) {
            let ma_du = this.compute_measured_angles_dexter_units()
            rs_inst.set_measured_angles(ma_du, true) //we want to install arcseconds, as Socket is expected arcseconds and will convert to degrees
        }

        if (this.status_mode === 0) {
            robot_status_array[Dexter.J1_ANGLE] = this.angles_dexter_units[0]
            robot_status_array[Dexter.J2_ANGLE] = this.angles_dexter_units[1]
            robot_status_array[Dexter.J3_ANGLE] = this.angles_dexter_units[2]
            robot_status_array[Dexter.J4_ANGLE] = this.angles_dexter_units[3]
            robot_status_array[Dexter.J5_ANGLE] = this.angles_dexter_units[4]
            //there are no slots in robot_status_array g0 for j6 and j7 angles
            let latest = this.queue_instance.latest_sent_queued_instruction
            let j1_5_arcsecs
            if (latest) {
                j1_5_arcsecs = [latest[Instruction.INSTRUCTION_ARG0],
                    latest[Instruction.INSTRUCTION_ARG1],
                    latest[Instruction.INSTRUCTION_ARG2],
                    latest[Instruction.INSTRUCTION_ARG3],
                    latest[Instruction.INSTRUCTION_ARG4]]
            } else {
                j1_5_arcsecs = [0, 0, 0, 0, 0]
            }
            robot_status_array[Dexter.J1_SENT] = j1_5_arcsecs[0]
            robot_status_array[Dexter.J2_SENT] = j1_5_arcsecs[1]
            robot_status_array[Dexter.J3_SENT] = j1_5_arcsecs[2]
            robot_status_array[Dexter.J4_SENT] = j1_5_arcsecs[3]
            robot_status_array[Dexter.J5_SENT] = j1_5_arcsecs[4]
            //unfortunately g0 doesn't support J6_SENT or J7_SENT
        }
        else if(this.status_mode === 1){
            //needs work
        }

        if (this.sim_actual === true) {
            let dexter_instance = this.robot  //for closure variable
            setTimeout(function () {
                Socket.on_receive(robot_status_array, payload_string_maybe, dexter_instance)
            }, 1)
        }
    }

    //from https://stackoverflow.com/questions/15761790/convert-a-32bit-integer-into-4-bytes-of-data-in-javascript/24947000
    //not called mar 18, 2021
    /*toBytesInt32 (num) {
        arr = new ArrayBuffer(4); // an Int32 takes 4 bytes
        view = new DataView(arr);
        view.setUint32(0, num, false); // byteOffset = 0; litteEndian = false
        return arr;
    }*/

    //when we're running the simulator on Dexter
    static render_once_node(ds_instance, job_name, robot_name, force_render=true){ //inputs in arc_seconds
         //note that SimUtils.render_once has force_render=false, but
         //due to other changes, its best if render_once_node default to true
        let rs_inst = ds_instance.robot.rs
        if (force_render){
            let j1 = rs_inst.measured_angle(1) //joint_number)robot_status[Dexter.J1_MEASURED_ANGLE]
            let j2 = rs_inst.measured_angle(2)
            let j3 = rs_inst.measured_angle(3)
            let j4 = rs_inst.measured_angle(4)
            let j5 = rs_inst.measured_angle(5)
            let j6 = rs_inst.measured_angle(6)
            let j7 = rs_inst.measured_angle(7)
            j1 = j1 //* -1 //fix for j1 wrong sign
            j5 = j5 * -1 //fix for j5 wrong sign
            out("DexterSim " + job_name + " " + robot_name + " J1: " + j1 + ", J2: " + j2 + ", J3: " + j3 + ", J4: " + j4 + ", J5: " + j5 + ", J6: " + j6 + ", J7: " + j7,
                "#95444a", //brown,
                true) //temp output
        }
    }

    // also called by process_next_instruction_T()
    /*process_next_instruction_a(angles_dexter_units){
        //predict needs its angles in degrees but ins_args are in arcseconds
        const orig_angles_in_deg = Socket.dexter_units_to_degrees_array(this.measured_angles_dexter_units)  //Socket.dexter_units_to_degrees(this.measured_angles_dexter_units) //this.measured_angles_dexter_units.map(function(ang) { return ang / 3600 })
        const angles_in_deg  = Socket.dexter_units_to_degrees_array(angles_dexter_units) //ns_args.map(function(ang)    { return ang / 3600 })
        //ins_args_in_deg[5] = Socket.dexter_units_to_degrees(ins_args[5], 6) //joint 6
        //ins_args_in_deg[6] = Socket.dexter_units_to_degrees(ins_args[6], 7) //joint 7

        //predict_move_dur takes degrees in and returns seconds
        let dur_in_seconds = Math.abs(Kin.predict_move_dur(orig_angles_in_deg, angles_in_deg, this.robot))
        let dur_in_milliseconds = dur_in_seconds * 1000
        return dur_in_milliseconds
    }*/

    //same as the above. just better named for its functionality
    predict_a_instruction_dur_in_ms(angles_dexter_units){
        if(angles_dexter_units === this.angles_dexter_units) { //an optimization for this common case of no change
            return 0
        }
        else {
            //predict needs its angles in degrees but ins_args are in arcseconds
            const orig_angles_in_deg = Socket.dexter_units_to_degrees_array(this.angles_dexter_units)  //Socket.dexter_units_to_degrees(this.measured_angles_dexter_units) //this.measured_angles_dexter_units.map(function(ang) { return ang / 3600 })
            const angles_in_deg  = Socket.dexter_units_to_degrees_array(angles_dexter_units) //ns_args.map(function(ang)    { return ang / 3600 })
            //ins_args_in_deg[5] = Socket.dexter_units_to_degrees(ins_args[5], 6) //joint 6
            //ins_args_in_deg[6] = Socket.dexter_units_to_degrees(ins_args[6], 7) //joint 7

            //predict_move_dur takes degrees in and returns seconds
            //let dur_in_seconds = Math.abs(Kin.predict_move_dur(orig_angles_in_deg, angles_in_deg, this.robot))
            //let max_speed_nbits = this.parameters["MaxSpeed"]
            //let max_speed_deg = max_speed_nbits / _nbits_cf
            let max_speed_arcseconds = this.parameters["AngularSpeed"]
            let max_speed_deg = max_speed_arcseconds / 3600
            let dur_in_seconds = Math.abs(Kin.predict_move_dur_5_joint(orig_angles_in_deg, angles_in_deg, max_speed_deg))
            //use 5 joint as j6 and j7 aren't part of this path.
            let dur_in_milliseconds = dur_in_seconds * 1000
            return dur_in_milliseconds
        }
    }

    predict_j6_plus_instruction_dur_in_ms(new_angle_in_dexter_units, joint_number){
        let orig_angle_in_dexter_units = this.angles_dexter_units[joint_number -1]
        let diff_du = new_angle_in_dexter_units - orig_angle_in_dexter_units
        let diff_deg = Socket.dexter_units_to_degrees(diff_du, joint_number)
        let dur_in_seconds = Math.abs(diff_deg) / Kin.dynamixel_320_degrees_per_second
        let dur_in_ms = dur_in_seconds * 1000
        return dur_in_ms
    }

    /*
    process_next_instruction_T(ins_args){ //ins_args xyz in microns
        let xyz_in_microns = [ins_args[0], ins_args[1], ins_args[2]]
        let J5_direction   = [ins_args[3], ins_args[4], ins_args[5]]
        let config         = [ins_args[6], ins_args[7], ins_args[8]]
        let j6_angle       = ins_args[11]
        let j7_angle       = ins_args[12]
        let pose           = undefined //its not in the ins_args, and defaults just fine

        let xyz_in_meters = [xyz_in_microns[0] / 1000000,
                             xyz_in_microns[1] / 1000000,
                             xyz_in_microns[2] / 1000000]
        let angles_in_degrees = Kin.xyz_to_J_angles(xyz_in_meters, J5_direction, config, pose)
        let angles_in_dexter_units = Socket.degrees_to_dexter_units(angles_in_degrees)
        angles_in_dexter_units.push(j6_angle)
        angles_in_dexter_units.push(j7_angle)
        return this.process_next_instruction_a(angles_in_dexter_units)
    }*/

    convert_T_args_to_joint_angles_dexter_units(ins_args){ //ins_args contains xyz in microns
        let xyz_in_microns = [ins_args[0], ins_args[1], ins_args[2]]
        let J5_direction   = [ins_args[3], ins_args[4], ins_args[5]]
        let config         = [ins_args[6], ins_args[7], ins_args[8]]
        let j6_angle       = ins_args[11]
        let j7_angle       = ins_args[12]
        let pose           = undefined //its not in the ins_args, and defaults just fine

        let xyz_in_meters = [xyz_in_microns[0] / 1000000,
            xyz_in_microns[1] / 1000000,
            xyz_in_microns[2] / 1000000]
        let angles_in_degrees = Kin.xyz_to_J_angles(xyz_in_meters, J5_direction, config, pose)
        let angles_in_dexter_units = Socket.degrees_to_dexter_units(angles_in_degrees)
        angles_in_dexter_units.push(j6_angle)
        angles_in_dexter_units.push(j7_angle)
        return angles_in_dexter_units //this.process_next_instruction_a(angles_in_dexter_units)
    }

    //read_file
    async process_next_instruction_r(instruction_array) {
        let hunk_index = instruction_array[Instruction.INSTRUCTION_ARG0]
        let source     = instruction_array[Instruction.INSTRUCTION_ARG1]
        let source_path_array = source.split("/")
        let last_path_part = Utils.last(source_path_array)
        let payload_string
        if(source.startsWith("`")){
            dde_error("The Dexter Simulator can't handle Dexter.read_from_robot instructions<br/>" +
                      "that start with a backtick for executing BASH commands.")
        }
        else if(last_path_part.startsWith("#")) { //got special "file"
            if(last_path_part.startsWith("#MeasuredAngles")){
                let result_array = this.compute_measured_angles_dexter_units()
                result_array = result_array.slice(0, 5) //cut off angles 6 and 7
                payload_string = JSON.stringify(result_array) //a crude aapproximation of the real values.
                //should return a string of 5 integers of arcseconds.
            }
            else if(last_path_part.startsWith("#POM") ||
                last_path_part.startsWith("#XYZ")){
                /*let measured_angs = this.compute_measured_angles_dexter_units().slice(0, 5)
                let link_lens = this.robot.link_lengths
                if(link_lens.length !== 5) { link_lens = ink_lens.slice(0, 5) }
                let result_array  = DexterSim.make_pom(measured_angs, link_lens) //2 arrays of 5 numbers in dexter units
                payload_string = JSON.stringify(result_array)
                 */
                last_path_part = last_path_part.trim()
                let last_path_parts = last_path_part.split(" ")
                let num = 4
                if(last_path_parts.length > 1) {
                    let arg = last(last_path_parts)
                    let num = parseInt(arg)
                    if(Number.isNaN(num)) { num = 4 }
                    else if((num > 0) && (num < 10)) {} //leave as is
                    else { num = 4}
                }
                let rob = this.robot
                let pom = rob.get_POM(num) //a matrix
                payload_string = JSON.stringify(pom)
            }
            else if(last_path_part.startsWith("#StepAngles")){
                let result_array = this.compute_measured_angles_dexter_units()
                result_array = result_array.slice(0, 5) //cut off angles 6 and 7
                payload_string = JSON.stringify(result_array) //a crude aapproximation of the real values.
                  //should return a string of 5 integers of arcseconds.
            }
            else {
                dde_error("The Dexter Simulator can't handle Dexter.read_from_robot instructions<br/>" +
                    "with a path of: " + source)
            }
        }
        else {
            let whole_content
            try {
                whole_content = await DDEFile.read_file_async(source)
            }//errors if path in "source" doesn't exist
            catch (err) {
                return 2 //return the error code
            }
            let start_index = hunk_index * Instruction.Dexter.read_file.payload_max_chars
            let end_index = start_index + Instruction.Dexter.read_file.payload_max_chars
            payload_string = whole_content.substring(start_index, end_index) //ok if end_index is > whole_cotnent.length, it just gets how much it can, no error
        }
            return payload_string
    }
    //Dexter.write_file
    process_next_instruction_W(ins_args, rob){
        let kind_of_write  = ins_args[0]
        let payload_length = ins_args[1]
        let payload        = ins_args[2]
        let robot_name     = this.robot_name
        let dde_computer_file_system_start = "dexter_file_systems/" + robot_name + "/"
        switch(kind_of_write){
            case "f": //payload is file name to write to. Just one of these to start with
                this.write_file_file_name = payload
                this.write_file_file_content = ""
                break;
            case "m": //middle, ie a content instruction, many of these
                this.write_file_file_content += payload
                break;
            case "e":   //end, just one of these
                this.write_file_file_content += payload
                let last_slash_pos = this.write_file_file_name.lastIndexOf("/")
                let folders_string = ""
                if(last_slash_pos != -1) { folders_string = this.write_file_file_name.substring(0, last_slash_pos + 1) }
                let folder_path
                if(folders_string.startsWith("/")) {
                    folder_path = folders_string
                }
                else {
                    folder_path = dde_computer_file_system_start + folders_string //ends with slash
                }
               /* folder_path = make_full_path(folder_path)
                make_folder(folder_path)
                let full_path = dde_computer_file_system_start + this.write_file_file_name
                full_path = make_full_path(full_path)
                //fs.mkdirSync(path, options-recursive???)
                write_file(full_path, this.write_file_file_content)
                */
                DDEFile.write_file_async(this.write_file_file_name, this.write_file_file_content)
                break;
            default:
              dde_error('The "W" write_file instruction received<br/>' +
                        'a "kind_of-write" letter of "' + kind_of_write + "<br/>" +
                        'but the only valid letters are "f", "m" and "e".')
        }
        return 0 //dur
    }
    //The corresponding fn for Dexter causes DexRun to crash, so we've commented out all calls to it.
    //When FPGA is updated to support it, we can re_instate it as a regular function.
    static empty_instruction_queue_now(robot_name){
        if(DexterSim.robot_name_to_dextersim_instance_map) {
            let ds_instance = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
            if(ds_instance) {
                ds_instance.queue_instance.empty_instruction_queue()
            }
        }
    }

    static robot_name_to_dextersim_instance_map = {}
    static set_interval_id = null

    static change_speed(){
        /*if(!Job.change_dexter_speed){
            new Job ({name: "change_dexter_speed",
                      do_list: [function() {
                          let speed_str = change_dexter_speed_id.value
                          //let index = selected_label.indexOf(" ")
                          //let new_speed_str = selected_label.substring(index + 1)
                          let new_speed = parseFloat(speed_str)
                          out("Dexter." + Dexter.default.name + " AngularSpeed set to " + new_speed + " degrees per second.", "green")
                          change_dexter_speed_id.value = 0 //set back to the "header" so can change to any speed next time. Note any job can change the speed during it.
                          return Dexter.set_parameter("AngularSpeed", new_speed)
                      }
                      ]})
        }
        Job.change_dexter_speed.start()
         */
        let speed_str = change_dexter_speed_id.value
        //let index = selected_label.indexOf(" ")
        //let new_speed_str = selected_label.substring(index + 1)
        let new_speed = parseFloat(speed_str)
        out("Dexter." + Dexter.default.name + " AngularSpeed set to " + new_speed + " degrees per second.", "green")
        change_dexter_speed_id.value = 0 //set back to the "header" so can change to any speed next time. Note any job can change the speed during it.
        let new_speed_arcsecs = new_speed * 3600
        let robot_name = Dexter.default.name
        let ds_instance =  DexterSim.robot_name_to_dextersim_instance_map[robot_name]
        ds_instance.parameters["AngularSpeed"] = new_speed_arcsecs
    }
    
}

globalThis.DexterSim = DexterSim