/* Created by Fry on 3/30/16.*/
//whole file loaded in ui env only as is tcp
DexterSim = class DexterSim{
    constructor({robot_name = "required"}){
        this.robot_name = robot_name
        this.rs = Dexter.make_default_status_array()
        this.instruction_queue = []
        this.completed_instructions = []
        this.status = "before_first_send"
        this.sent_instructions_count = 0
        this.now_processing_instruction = null //a Dexter can only be doing at most 1 instruction at a time. This is it.
        DexterSim.robot_name_to_dextersim_instance_map[robot_name] = this
        Socket.new_socket_callback(robot_name)
    }

    static create(robot_name){
        new DexterSim({robot_name: robot_name})
    }

    static send(robot_name, instruction_array){
        //out("Sim.send passed instruction_array: " + instruction_array + " robot_name: " + robot_name)
        let the_inst = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
        the_inst.sent_instructions_count += 1
        if (the_inst.status == "closing"){
            shouldnt("In a_DexterSim.send with robot_name: " + robot_name +
                     " passed instruction_array: " + instruction_array +
                     " but it shouldn't be called at all because a_DexterSim.status == 'closing'.")
        }
        let prev_status = the_inst.status
        the_inst.status = "after_first_send"

        let oplet  = instruction_array[Dexter.INSTRUCTION_TYPE]
        switch(oplet){
            case "E":  //empty_instruction_queue_immediately
                out("In simulating Dexter at robot_name: " + the_inst.robot_name +
                    ", an E instruction (empty_instruction_queue_immediately),<br/> is " +
                    "deleting " + the_inst.instruction_queue.length + " instructions:<br/>" +
                     the_inst.instruction_queue.join("<br/>") +
                    "<br/>from the queue that will never be run.")
                the_inst.instruction_queue = []
                the_inst.ack_reply(instruction_array)
                break;
            case "F": //empty_instruction_queue, //waits to be "executed" when instruction is processed
                the_inst.instruction_queue.push(instruction_array)
                break;
            case "g": //get naturally. This is like "F" in that it lets the buffer empty out.
                //so like F, don't ack_reply. This is automatically sent as the last instruction in a job.
                //it always returns a full robot_status in order.
                the_inst.instruction_queue.push(instruction_array) //stick it on the front of the queue so it will be done next
                break;
            case "G": //get immediate. The very first instruction sent to send should be  "G",
                                     //so let it be the first call to process_next_instruction & start out the setTimeout chain
                the_inst.instruction_queue.unshift(instruction_array) //stick it on the front of the queue so it will be done next
                break;
            case "h": //doesn't go on instruction queue, just immediate ack
                the_inst.ack_reply(instruction_array)
                break;
            default:
                the_inst.instruction_queue.push(instruction_array)
                the_inst.ack_reply(instruction_array)
                break;
        }
        if (prev_status == "before_first_send") { the_inst.process_next_instruction() }
        //else there should already be a setTimeout chain for process_next_instruction going on
    }

    ack_reply(instruction_array){
        let ack_array = new Array(Dexter.robot_ack_labels.length)
        ack_array[Dexter.JOB_ID]            = instruction_array[Instruction.JOB_ID]
        ack_array[Dexter.INSTRUCTION_ID]    = instruction_array[Instruction.INSTRUCTION_ID]
        ack_array[Dexter.START_TIME]        = Date.now()
        ack_array[Dexter.STOP_TIME]         = Date.now()
        ack_array[Dexter.INSTRUCTION_TYPE]  = instruction_array[Instruction.INSTRUCTION_TYPE] //leave this as a 1 char string for now. helpful for debugging
        ack_array[Dexter.ERROR_CODE]        = 0
        setTimeout(function(){
                    Dexter.robot_done_with_instruction(ack_array)
                    }, 1)
    }

    process_next_instruction(){
        let dur = 10
        if ((this.now_processing_instruction == null) && //we're not busy and
            (this.instruction_queue.length > 0)) {       //there's stuff to do
            this.now_processing_instruction = this.instruction_queue.shift() //pop off next inst from front of the list
            let instruction_array = this.now_processing_instruction
            var robot_status = this.rs
            dur     = 1000 //default dur in ms
            var oplet  = instruction_array[Dexter.INSTRUCTION_TYPE]
            robot_status[Dexter.JOB_ID]            = instruction_array[Instruction.JOB_ID]
            robot_status[Dexter.INSTRUCTION_ID]    = instruction_array[Instruction.INSTRUCTION_ID]
            robot_status[Dexter.START_TIME]        = Date.now()
            robot_status[Dexter.INSTRUCTION_TYPE]  = instruction_array[Instruction.INSTRUCTION_TYPE] //leave this as a 1 char string for now. helpful for debugging
            robot_status[Dexter.ERROR_CODE]        = 0
            let ins_args = Instruction.args(instruction_array)
            let angle
            switch (oplet){
                case "a": //moveall joints
                    angle = ins_args[0]
                    if (!isNaN(angle)){ robot_status[Dexter.J1_ANGLE] = angle}
                    angle = ins_args[1]
                    if (!isNaN(angle)){ robot_status[Dexter.J2_ANGLE] = angle}
                    angle = ins_args[2]
                    if (!isNaN(angle)){ robot_status[Dexter.J3_ANGLE] = angle}
                    angle = ins_args[3]
                    if (!isNaN(angle)){ robot_status[Dexter.J4_ANGLE] = angle}
                    angle = ins_args[4]
                    if (!isNaN(angle)){ robot_status[Dexter.J5_ANGLE] = angle}
                    //DexterSim.fill_in_robot_status_xyzs(robot_status)
                    break;
                case "b": //move_to  xyz
                    /*if (!isNaN(instruction_array[2])) robot_status[Dexter.ds_j5_x_index]     = instruction_array[2]
                    if (!isNaN(instruction_array[3])) robot_status[Dexter.ds_j5_y_index]     = instruction_array[3]
                    if (!isNaN(instruction_array[4])) robot_status[Dexter.ds_j5_z_index]     = instruction_array[4]
                    if (!isNaN(instruction_array[5])) robot_status[Dexter.ds_j4_angle_index] = instruction_array[5]
                    DexterSim.fill_in_robot_status_joint_angles(robot_status)
                    */
                    break;
                case "B": //move_to_relative  xyz
                    /*if (!isNaN(instruction_array[2])) robot_status[Dexter.ds_j5_x_index]     = robot_status[Dexter.ds_j5_x_index] + instruction_array[2]
                    if (!isNaN(instruction_array[3])) robot_status[Dexter.ds_j5_y_index]     = robot_status[Dexter.ds_j5_y_index] + instruction_array[3]
                    if (!isNaN(instruction_array[4])) robot_status[Dexter.ds_j5_z_index]     = robot_status[Dexter.ds_j5_z_index] + instruction_array[4]
                    if (!isNaN(instruction_array[5])) robot_status[Dexter.ds_j4_angle_index] = instruction_array[5] //not relative
                    DexterSim.fill_in_robot_status_joint_angles(robot_status)*/
                    break;
                case "e": //cause an error. Used for testing only
                    robot_status[Dexter.ERROR_CODE] = instruction_array[2]
                    break;
                case "F":
                    dur = 0
                    break;
                case "g": //get_robot_status
                    dur = 0;
                    break;
                case "G": //get_robot_status
                    dur = 0;
                    break;
                //handled by send. h never gets to this fn
                case "h": //heartbeat get robot status
                    //dur = 0;
                    shouldnt("In dextersim.process_next_instruction, got an 'h' oplet but this fn shouldn't get 'h' instructions.")
                    break;
                case "R": //relative_moveall joints
                    angle = ins_args[0]
                    if (!isNaN(angle)){ robot_status[Dexter.J1_ANGLE] += angle}
                    angle = ins_args[1]
                    if (!isNaN(angle)){ robot_status[Dexter.J2_ANGLE] += angle}
                    angle = ins_args[2]
                    if (!isNaN(angle)){ robot_status[Dexter.J3_ANGLE] += angle}
                    angle = ins_args[3]
                    if (!isNaN(angle)){ robot_status[Dexter.J4_ANGLE] += angle}
                    angle = ins_args[4]
                    if (!isNaN(angle)){ robot_status[Dexter.J5_ANGLE] += angle}
                    //DexterSim.fill_in_robot_status_xyzs(robot_status)
                    break;
                case "S": //set_parameter
                    dur = 0
                    break
                case "z": //sleep
                    dur =  Math.round(ins_args[0]) //instruction array z sleep time is in milliseconds. JS timeout dur is in milliseconds
                    break;
                default:
                    if (Dexter.instruction_type_to_function_name_map[oplet]){
                        out("Warning: Dextersim.send doesn't know what to do with the legal oplet: " + oplet, "red")
                    }
                    else {
                        out("Error: DexterSim.send received an instruction array with an illegal oplet: " + instruction_array, "red")
                    }
            }
            //if (oplet != "h"){  //never put -1 in instruction_id of robot status except before first instruction is run.
            //For heartbeats, we want to leave in robot_status whatever the last "real" instruction was in there.
            //    ds_copy[0] = instruction_array[0] //instruction id
                    //}
            if (!$("#real_time_sim_checkbox").val()){
                dur = 0
            }
            let ds_copy = robot_status.slice(0) //make a copy to return as some subseqent call to this meth will modify the one "model of dexter" that we're saving in the instance
            let the_inst = this
            setTimeout(function(){
                            ds_copy[Dexter.STOP_TIME] = Date.now()
                            the_inst.completed_instructions.push(instruction_array)
                            const job_id       = robot_status[Dexter.JOB_ID]
                            const job_instance = Job.job_id_to_job_instance(job_id)
                            SimUtils.render_once(robot_status, "Job: " + job_instance.name) //renders after dur, ie when the dexter move is completed.
                            if (["F", "G", "g"].includes(oplet)) { Dexter.robot_done_with_instruction(ds_copy) } //or I could just always do this when in sim mode.
                            the_inst.now_processing_instruction = null     //Done with cur ins,
                            if((the_inst.instruction_queue.length == 0) && //nothing in the queue,
                               (the_inst.status == "closing")) {           //and no more coming from DDE.
                                //the_inst.status = "closed"               //Its over.
                                DexterSim.close(the_inst.robot_name)        //cleaner to set "closed" in one place.
                            }
                       },
                       dur)
        }

        if(this.status == "closed") {} //don't call process_next_instruction any more
        else {
            let the_inst = this
            setTimeout(function(){
                the_inst.process_next_instruction()
                }, dur + 10) //no point in calling process_next_instruction until after dur so that we finish
                             //the prev instruction first. IF there are no instrucdtions in the queue
                             //when process_next_instruction is called, then dur will be some small number
        }
    }
    static close(robot_name){
        //when this is called, no more instructions will be coming from the job, but there might be
        //be stragglers left in the instruction_queue
        let the_inst = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
        if(the_inst){
           if ((the_inst.instruction_queue.length == 0) &&
               (the_inst.now_processing_instruction == null)){
                the_inst.status = "closed" //also set near bottom of process_next_instruction
            }
            else { //note: now that I automatically put a "g" instruction as the automatic last instruction
            //of a job's do_list, we shouldn't be getting this "closing" state because
            //the "g" naturally empties the instruction_queue.
            the_inst.status = "closing"
            //setTimeout(function(){DexterSim.close(socket_id)}, 1000) //shouldn't be necessary.
            //as process_next_instruction will handle final close in this case.
            }
        }
    }
    
}

DexterSim.robot_name_to_dextersim_instance_map = {}