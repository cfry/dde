/* Created by Fry on 3/30/16.*/
//whole file loaded in  env only as is tcp
//DexterSim.init_all()
DexterSim = class DexterSim{
    constructor(robot_name){ //called once per DDE session per robot_name by create_or_just_init
        this.robot_name = robot_name
        this.robot      = Robot[robot_name] //only used by predict_move_dur
        DexterSim.robot_name_to_dextersim_instance_map[robot_name] = this
        this.measured_angles_dexter_units = [0,0,0,0,0,
                                             Socket.degrees_to_dexter_units(0, 6), //different from the others because for the others, 0 deg is also 0 dexter units, but not for j6
                                             0]  //a_angles + pid_angles
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
        out(sim_html + rob_name + " " + string)
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

    init(sim_actual){
        this.sim_actual = sim_actual
        this.queue_instance = new Simqueue(this)

        //these should be in dexter_units
        this.parameters = { //set_params. see Socket.js instruction_array_degrees_to_arcseconds_maybe
            Acceleration:  0.0001,        // in _nbits_cf units
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


    static array_buffer_to_oplet_array(arr_buff){
        let str = this.array_buffer_to_string(arr_buff)
        let split_str = str.split(" ")
        let oplet_array = []
        let oplet
        for(let i = 0; i <  split_str.length; i++) {
            let substr = split_str[i]
            if(i == Instruction.INSTRUCTION_TYPE) { oplet = substr}
            else if ((oplet == "W") && (i == Instruction.INSTRUCTION_ARG2)) { //this is the payload of Dexter.write_file
                let raw_string = arr_buff.toString() //can't use str because that ends at first semicolon, and payload might have semicolons in it.
                let ending_semicolon_pos = raw_string.lastIndexOf(";") //note that the payload might have semicolons in it so don't choose those by using LASTindexOf
                let W_pos = raw_string.indexOf(" W ")
                let start_payload_length_pos = W_pos + 5 //5 skips over the "W f " (oplet and write_kind letter and spaces)
                //but now we must skip over the payload length, which is an int of variable length
                let start_payload_pos = raw_string.indexOf(" ", start_payload_length_pos) + 1 //skip over palyoad length and the space after it
                let payload = raw_string.substring(start_payload_pos, ending_semicolon_pos) //excludes final semicolon
                oplet_array.push(payload)
                break;
            }
            if(substr == "")               {} //ignore. this is having more than one whitespace together. Just throw out
            else if(substr == "undefined") { oplet_array.push(undefined) }
            else if (substr == "NaN")      { oplet_array.push(NaN) }
            else {
                let num_maybe = parseFloat(substr) //most are ints but some are floats
                if(Number.isNaN(num_maybe)) { oplet_array.push(substr) } //its a string
                else                        { oplet_array.push(num_maybe) } //its an actual number
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
    //typically adds instruction to sim_inst.instruction_queue
    static send(robot_name, arr_buff){
        let instruction_array = this.array_buffer_to_oplet_array(arr_buff) //instruction_array is in dexter_units
        //out("Sim.send passed instruction_array: " + instruction_array + " robot_name: " + robot_name)
        let sim_inst = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
        /*if(!sim_inst) {
            let rob = Dexter[robot_name]
            rob.instruction_to_send_on_connect = instruction_array
            const sim_actual = Robot.get_simulate_actual(rob.simulate)
            this.create_or_just_init(robot_name, sim_actual)
            return
        }*/
        sim_inst.last_instruction_sent = instruction_array
        let ins_args = Instruction.args(instruction_array) //in dexter_units
        let oplet  = instruction_array[Dexter.INSTRUCTION_TYPE]
        switch(oplet){
            case "a":
                sim_inst.queue_instance.add_to_queue(instruction_array)
                sim_inst.ack_reply_maybe(instruction_array)
                break;
            case "e": //cause an error. Used for testing only
                let the_error_code = instruction_array[Instruction.INSTRUCTION_ARG0]
                sim_inst.ack_reply_maybe(instruction_array, the_error_code)
                break;
            case "E": //not implemented on Dexter Mar 13, 2021 but should be. Requires FPGA programming
                sim_inst.queue_instance.empty_instruction_queue() //this will call ack_reply IFF the queue is blocked (by a previous "F" cmd
                break;
            case "F": //empty_instruction_queue. blocks adding to queue until its empty.
                sim_inst.queue_instance.set_queue_blocking_instruction(instruction_array)
                //do not ack_reply! That happens when all items removed from the queue.
                break;
            case "g":
                let inst_status_mode = instruction_array[Instruction.INSTRUCTION_ARG0]
                if((inst_status_mode === null) || (inst_status_mode === undefined)){ sim_inst.status_mode = 0} //helps backwards compatibility pre status modes.
                else { sim_inst.status_mode = inst_status_mode }
                sim_inst.ack_reply(instruction_array)
                break;
            /*case "G": //deprecated. get immediate. The very first instruction sent to send should be  "G",
                                     //so let it be the first call to process_next_instruction & start out the setTimeout chain
                sim_inst.add_instruction_to_queue(instruction_array) //stick it on the front of the queue so it will be done next
                break;*/
            case "h": //doesn't go on instruction queue, just immediate ack
                sim_inst.ack_reply(instruction_array)
                break;
            case "P":
                sim_inst.queue_instance.add_to_queue(instruction_array)
                sim_inst.ack_reply_maybe(instruction_array)
                break;
            case "r": //Dexter.read_file. does not go on queue
                let payload_string_maybe = sim_inst.process_next_instruction_r(instruction_array)
                sim_inst.ack_reply(instruction_array, payload_string_maybe)
                break;
            case "S":
                let param_name = ins_args[0]
                let param_val  = ins_args[1]
                if(["Acceleration", "MaxSpeed", "StartSpeed"].includes(param_name)) {
                    sim_inst.queue_instance.set_instruction_done_action(param_name, param_val)
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
                        //sim_inst.measured_angles_dexter_units[5] = param_val
                        sim_inst.queue_instance.start_running_j6_plus_instruction(6, param_val)
                    }
                    else if(param_name === "EESpan") { //joint 7
                        //sim_inst.measured_angles_dexter_units[6] = param_val
                        sim_inst.queue_instance.start_running_j6_plus_instruction(7, param_val)
                    }
                    //else if(param_name === "RebootServo"){
                       //we don't need special processing for RebootServo. After it will be
                       //a "z" oplet instruction (Dexter.sleep) that will cause Sim queue to show "sleep"
                    //}
                    else {
                        sim_inst.parameters[param_name] = param_val
                        sim_inst.simout("set parameter: " + param_name + " to " + param_val)
                    }
                }
                sim_inst.ack_reply(instruction_array)
                break;
            case "T":
                let angles_dexter_units = sim_inst.convert_T_args_to_joint_angles_dexter_units(ins_args)
                let new_instruction_array = instruction_array.slice(0, Instruction.INSTRUCTION_ARG0)
                new_instruction_array[Instruction.INSTRUCTION_TYPE] = "a" //change from "T" to "a"
                new_instruction_array.concat(angles_dexter_units)
                sim_inst.queue_instance.add_to_queue(instruction_array) //just like "a" for now

            case "w": //write fpga register
                const write_location = ins_args[0]
                if (write_location < sim_inst.fpga_register.length) {
                    let new_val = ins_args[1]
                    sim_inst.fpga_register[write_location] = new_val
                    let reg_name = Instruction.w_address_names[write_location]
                    sim_inst.simout("FPGA Register: " + reg_name + " ( " + write_location + " )  set to: " + new_val)
                    sim_inst.ack_reply(instruction_array)                 
                }
                else { shouldnt('DexterSim.fpga_register is too short to accommodate "w" instruction<br/> with write_location of: ' +
                    write_location + " and value of: " + ins_args[1]) 
                }  
                 break;
            case "W": //write file
                sim_inst.process_next_instruction_W(ins_args)
                sim_inst.ack_reply(instruction_array)
                break;
            case "z": //sleep, first arg holds microseconds dur
                //all sleep does is wait for the dur, (starting when the instruction is received
                // by the robot) and then return the ack_reply.
                //so it just holds up DDE sending more instructions.
                //Any ongoing queued instructions just keep running as they would
                //without the sleep.
                //When the dur is up, the queue_instance takes care of sending the ack_reply.
                sim_inst.queue_instance.start_sleep(instruction_array)
                break;
            default:
                warning("In DexterSim.send, got instruction not normally processed: " + oplet)
                sim_inst.ack_reply(instruction_array)
                break;
        }
    }

    //this is called by "a" and "P" instructions only, ie only
    //instuctions that add to the queue.
    ack_reply_maybe(instruction_array, payload_string_maybe){
        if(this.queue_instance.is_queue_full()) {
            this.simout("queue is full.<br/>There will be no reply until the current instruction completes.")
        }
        else {
            this.ack_reply(instruction_array, payload_string_maybe)
        }
    }

    //hacked to now create and pass to on_receive a full robot status
    //payload_string_maybe might be undefined, a string payload or an error number positive int.
    ack_reply(instruction_array, payload_string_maybe){
        let robot_status_array = Dexter.make_default_status_array_g_sm(this.status_mode)
        let rs_inst = new RobotStatus({robot_status: robot_status_array})

        robot_status_array[Dexter.JOB_ID]            = instruction_array[Instruction.JOB_ID]
        robot_status_array[Dexter.INSTRUCTION_ID]    = instruction_array[Instruction.INSTRUCTION_ID]
        robot_status_array[Dexter.START_TIME]        = instruction_array[Instruction.START_TIME] //Date.now()
        robot_status_array[Dexter.STOP_TIME]         = Date.now()
        robot_status_array[Dexter.INSTRUCTION_TYPE]  = instruction_array[Instruction.INSTRUCTION_TYPE] //leave this as a 1 char string for now. helpful for debugging
        if((robot_status_array[Dexter.INSTRUCTION_TYPE] === "r")   &&
            (typeof(payload_string_maybe) == "number") &&
            (payload_string_maybe > 0)){
            robot_status_array[Dexter.ERROR_CODE] = payload_string_maybe
        }

        if(rs_inst.supports_measured_angles()) {
            rs_inst.set_measured_angles(this.measured_angles_dexter_units, true) //we want to install arcseconds, as Socket is expected arcseconds and will convert to degrees
        }

        if(this.status_mode === 0){
           let latest = this.queue_instance.latest_sent_queued_instruction
           let j1_5_arcsecs
           if(latest) {
              j1_5_arcsecs = [latest[Instruction.INSTRUCTION_ARG0], 
                              latest[Instruction.INSTRUCTION_ARG1], 
                              latest[Instruction.INSTRUCTION_ARG2], 
                              latest[Instruction.INSTRUCTION_ARG3], 
                              latest[Instruction.INSTRUCTION_ARG4]]  
           }
           else { j1_5_arcsecs = [0,0,0,0,0] }
           robot_status_array[Dexter.J1_SENT] = j1_5_arcsecs[0]
           robot_status_array[Dexter.J2_SENT] = j1_5_arcsecs[1]
           robot_status_array[Dexter.J3_SENT] = j1_5_arcsecs[2]
           robot_status_array[Dexter.J4_SENT] = j1_5_arcsecs[3]
           robot_status_array[Dexter.J5_SENT] = j1_5_arcsecs[4]
           //unfortunately g0 doesn't support J6_SENT or J7_SENT
        } 
         
        if (this.sim_actual === true){
            let rob = this.robot
            setTimeout(function(){
                        Socket.on_receive(robot_status_array, payload_string_maybe)
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
    static render_once_node(dexter_sim_instance, job_name, robot_name, force_render=true){ //inputs in arc_seconds
         //note that SimUtils.render_once has force_render=false, but
         //due to other changes, its best if render_once_node default to true
         rs_inst = dexter_sim_instance.robot.rs
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
        if(angles_dexter_units === this.measured_angles_dexter_units) { //an optimization for this common case of no change
            return 0
        }
        else {
            //predict needs its angles in degrees but ins_args are in arcseconds
            const orig_angles_in_deg = Socket.dexter_units_to_degrees_array(this.measured_angles_dexter_units)  //Socket.dexter_units_to_degrees(this.measured_angles_dexter_units) //this.measured_angles_dexter_units.map(function(ang) { return ang / 3600 })
            const angles_in_deg  = Socket.dexter_units_to_degrees_array(angles_dexter_units) //ns_args.map(function(ang)    { return ang / 3600 })
            //ins_args_in_deg[5] = Socket.dexter_units_to_degrees(ins_args[5], 6) //joint 6
            //ins_args_in_deg[6] = Socket.dexter_units_to_degrees(ins_args[6], 7) //joint 7

            //predict_move_dur takes degrees in and returns seconds
            //let dur_in_seconds = Math.abs(Kin.predict_move_dur(orig_angles_in_deg, angles_in_deg, this.robot))
            let dur_in_seconds = Math.abs(Kin.predict_move_dur_5_joint(orig_angles_in_deg, angles_in_deg, this.robot))
            //use 5 joint as j6 and j7 aren't part of this path.
            let dur_in_milliseconds = dur_in_seconds * 1000
            return dur_in_milliseconds
        }
    }

    predict_j6_plus_instruction_dur_in_ms(new_angle_in_dexter_units, joint_number){
        let orig_angle_in_dexter_units = this.measured_angles_dexter_units[joint_number -1]
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

    process_next_instruction_r(instruction_array) {
        let hunk_index = instruction_array[Instruction.INSTRUCTION_ARG0]
        let source     = instruction_array[Instruction.INSTRUCTION_ARG1]
        let whole_content
        try { whole_content = read_file(source) }//errors if path in "source" doesn't exist
        catch(err){
            return 2 //return the error code
        }
        let start_index = hunk_index * Instruction.Dexter.read_file.payload_max_chars
        let end_index = start_index + Instruction.Dexter.read_file.payload_max_chars
        let payload_string = whole_content.substring(start_index, end_index) //ok if end_index is > whole_cotnent.length, it just gets how much it can, no error
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
                folder_path = make_full_path(folder_path)
                make_folder(folder_path)
                let full_path = dde_computer_file_system_start + this.write_file_file_name
                full_path = make_full_path(full_path)
                //fs.mkdirSync(path, options-recursive???)
                write_file(full_path, this.write_file_file_content)
                break;
            default:
              dde_error('The "W" write_file instruction recieved<br/>' +
                        'a "kind_of-write" letter of "' + kind_of_write + "<br/>" +
                        'but the only valid letters are "f", "m" and "e".')
        }
        return 0 //dur
    }
    //The corresponding fn for Dexter causes DexRun to crash, so we've commented out all calls to it.
    //When FPGA is updated to support it, we can re_instate it as a regular function.
    static empty_instruction_queue_now(robot_name){
        if(DexterSim.robot_name_to_dextersim_instance_map) {
            let sim_inst = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
            if(sim_inst) {
                sim_inst.queue_instance.empty_instruction_queue()
            }
        }
    }
    
}

DexterSim.robot_name_to_dextersim_instance_map = {}
DexterSim.set_interval_id      = null

module.exports = DexterSim

var {Robot, Dexter} = require("./robot.js")
var Socket          = require("./socket.js")
var {Instruction}   = require("./instruction.js")
var {shouldnt}      = require("./utils.js")
var {make_folder, make_full_path}   = require("./storage")

var Kin = require("../math/Kin.js")
var Vector = require("../math/Vector.js")
var {Simqueue}  = require("./simqueue.js")
