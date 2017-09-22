/* Created by Fry on 3/29/16. */
var Robot = class Robot {
    constructor (){
    }
    /*static robot_names(){
        var result = []
        for(var name in Robot){
            if (Robot[name] instanceof Robot){
                result.push(name)
            }
        }
        return result
    }
    */
    static all_robots(){
        let result = []
        for(let robot_name of Robot.all_names) { result.push(Robot[robot_name]) }
        return result
    }
    static default_robot_name(){
        if (Robot.all_names.length > 0){
            return Robot.all_names[Robot.all_names.length - 1]
        }
        else {
            return "r1"
        }
    }
    //put the new item on the end, even if ypu have to remove it from the middle,
    //because we want the latest on the end for default_robot_name
    static set_robot_name(name, robot_instance){
        Robot[name] = robot_instance
        //ensure name is on end of all_names
        let i = Robot.all_names.indexOf(name)
        if (i != -1){ Robot.all_names.splice(i, 1) }
        Robot.all_names.push(name)
        if (i == -1) {
            $("#videos_id").prepend("<option>Robot: " + name + "</option>")
        }
    }
    static get_simulate_actual(simulate_val){
        if      (simulate_val === true)   { return true   }
        else if (simulate_val === false)  { return false  }
        else if (simulate_val === "both") { return "both" }
        else if (simulate_val === null)   { return persistent_get("default_dexter_simulate") }
        else { shouldnt("get_simulate_actual passed illegal value: " + simulate_val) }
    }

    jobs_using_this_robot(){
        let result = []
        for (let j of Job.all_jobs()){
            if (j.robot === this){ result.push(j) }
        }
        return result
    }

    active_jobs_using_this_robot(){
        let result = []
        for (let j of Job.all_jobs()){
            if ((j.robot === this) &&
                 j.is_active()){
                result.push(j)
            }
        }
        return result
    }

    is_initialized(){ return true }

    //pretty weak. Only will work as long as Robots don't overlap in oplets
    //used in robot_history_status
    static instruction_type_to_function_name(ins_type){
        let fn_name = Dexter.instruction_type_to_function_name_map[ins_type]
        if (fn_name) {return "Dexter." + fn_name}
        fn_name = Serial.instruction_type_to_function_name_map[ins_type]
        if (fn_name) {return "Serial." + fn_name}
        return null
    }

    //Control Instructions
    static error(reason){ //declare that an error happened. This will cause the job to stop.
        return new Instruction.Control.error(reason) //["error", reason]
    }

    static go_to(instruction_location){
        return new Instruction.Control.go_to(instruction_location)
    }

    static grab_robot_status(user_data_variable,
                             starting_index = Serial.DATA0,
                             ending_index=null){
        return new Instruction.Control.grab_robot_status(user_data_variable,
                                                         starting_index,
                                                         ending_index)
    }

    static if_any_errors(job_names=[], instruction_if_error=null){
        return new Instruction.Control.if_any_errors(job_names, instruction_if_error)
    }
    static label(name){
        return new Instruction.Control.label(name)
    }

    static out(val, color="black", temp){
        return new Instruction.Control.out(val, color, temp)
    }

    /* Warning the below is at least somewhat obsolete as of new arch Aug 25, 2016
    The workflow for sent_to_job.
     job.sent_to_job calls Instruction.Contol.sent_to_job as for all control instructions.
     That creates an instance to sent_to_job and sticks it on the source_job do_list.
     When that instruction is run, its do_item calls
     to_job_instance.destination_do_send_to_job(this) which sticks the
     do_list_item onto the destination job's do list,
     and, if the source job is going to wait for the instruction to be done,
     an additonal control instruction of type
     Instruction.Control.destination_send_to_job_is_done is stuck on the do_list
     of the desitination job.
     Then the destination job runs those items
     and when the instruction destination_send_to_job_is_done is run,
     it calls the fns to get the values for the vars to set in from_instance,
     and calls from_job_instance.send_to_job_receive_done(this.params)
     passing those values to the from_instance.
     Then send_to_job_receive_done sets the user_data vars in the from job.
     */

    static send_to_job({do_list_item    = null,
                        where_to_insert = null,
                        wait_until_done = false, //if true, a_job.send_to_job_receive_done will be called withthe do_list_item is done by the to_job
                        start           = false,
                        unsuspend       = false,
                        status_variable_name = null} = {}){
        return new Instruction.Control.send_to_job(arguments[0])
    }

    //rarely used, but can be used to customize a job with additional do_list items at the start.
    static sent_from_job ({do_list_item        = null, //can be null, a single instruction, or an array of instructions
                           from_job_name       = null,
                           from_instruction_id = null,
                           where_to_insert     = "next_top_level", //just for debugging
                           wait_until_done     = false} = {}){
        return new Instruction.Control.sent_from_job(arguments[0])
    }

    static start_job(job_name, start_options={}, if_started="ignore"){
        return new Instruction.Control.start_job(job_name, start_options, if_started)
    }

    static stop_job(instruction_location, reason, perform_when_stopped = false){
        return new Instruction.Control.stop_job(instruction_location, reason, perform_when_stopped)
    }

    static suspend(){
        return new Instruction.Control.suspend()
    }
    //unsuspend is a instance meth on Job and should be!

    static sync_point(name, job_names=[]){
        return new Instruction.Control.sync_point(name, job_names)
    }

    static wait_until(fn_date_dur){
        return new Instruction.Control.wait_until(fn_date_dur)
    }

    //arg order is a bit odd because the headers come after the response_variable_name.
    //but the response_variable_name is takes the place of the primary callback,
    //and that's the order I have for get_page (headers on end) which very often
    //default to undefined.
    static get_page(url_or_options, response_variable_name="http_response"){
        return new Instruction.Control.Get_page(url_or_options, response_variable_name)
    }
    //static play(note_or_phrase){
    //    return new Instruction.Control.play_notes(note_or_phrase)
    //}
    close_robot(){ //overridden in Serial and Dexter
    }
}
Robot.all_names = []

Robot.robot_status_labels = [] //overridden by Serial and Dexter, needed by Show robot status history button

/*simulate vs non-simulate makes no difference so set simulate to false */
var Brain = class Brain extends Robot { /*no associated hardware */
    constructor({name = "b1"}={}){
        super()
        this.name = name
        Robot.set_robot_name(this.name, this)
        let i = Brain.all_names.indexOf(this.name)
        if (i != -1) {  Brain.all_names.splice(i, 1) }
        Brain.all_names.push(this.name) //ensures the last name on the list is the latest with no redundancy
        Brain.last_robot = this
        this.simulate = false
        //the_job //a Robot can have at most 1 current job associated with it.
    }
    toString(){
        return "{instance of Brain::  name: " + this.name + "}"
    }
    stringify(){
        return "Brain: <i>name</i>: " + this.name
    }
    start(job_instance) {
        job_instance.set_status_code("running")
        job_instance.set_up_next_do(0)
    }
    finish_job() {}

    send(inst_array_with_inst_id) {
        let job_id = inst_array_with_inst_id[Instruction.JOB_ID]
        var job_instance = Job.job_id_to_job_instance(job_id)
        var reason = "An instruction intended for a physical robot: " + inst_array_with_inst_id + "<br/>was sent to a Robot.Human: " + this.name + ",<br/> which has no physical robot."
        job_instance.stop_for_reason("errored", reason)
        out(reason, "red")
        throw new Error("send called on Robot.Brain, which has no physical robot.")
    }
}

Brain.all_names = []

var Human = class Human extends Brain { /*no associated hardware */
    constructor({name = "h1"}={}){
        super()
        this.name = name
        Robot.set_robot_name(this.name, this)
        let i = Human.all_names.indexOf(this.name)
        if (i != -1) {  Human.all_names.splice(i, 1) }
        Human.all_names.push(this.name) //ensures the last name on the list is the latest with no redundancy
        Human.last_robot = this
        this.simulate = false
        //the_job //a Robot can have at most 1 current job associated with it.
    }
    toString(){
        return "{instance of Human::  name: " + this.name + "}"
    }
    stringify(){
        return "Human: <i>name</i>: " + this.name
    }
    start(job_instance) {
        job_instance.set_status_code("running")
        job_instance.set_up_next_do(0)
    }
    finish_job() {}
    send(inst_array_with_inst_id) {
        let job_id = inst_array_with_inst_id[Instruction.JOB_ID]
        var job_instance = Job.job_id_to_job_instance(job_id)
        var reason = "An instruction intended for a physical robot: " + inst_array_with_inst_id + "<br/>was sent to a Robot.Human: " + this.name + ",<br/> which has no physical robot."
        job_instance.stop_for_reason("errored", reason)
        out(reason, "red")
        throw new Error("send called on Robot.Brain, which has no physical robot.")
    }

    //the human instructions
    static task({task = "", dependent_job_names=[],
                 title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"} = {}){
        return new Instruction.Control.human_task(arguments[0])
    }

    static enter_choice({task = "", choices=[],
        show_choices_as_buttons=false,
        one_button_per_line=false,
        user_data_variable_name="choice", dependent_job_names=[],
        title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"} = {}){
        return new Instruction.Control.human_enter_choice(arguments[0])
    }

    static enter_instruction({task = "Enter a next instruction for this Job.",
        instruction_type = "Dexter.move_all_joints",
        instruction_args = "5000, 5000, 5000, 5000, 5000",
        dependent_job_names = [],
        title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"}={}){
        return new Instruction.Control.human_enter_instruction(arguments[0])
    }

    static enter_number({task="",
        user_data_variable_name="a_number",
        initial_value=0,
        min=0,
        max=100,
        step=1,
        dependent_job_names=[],
        title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"}={}) {
        return new Instruction.Control.human_enter_number(arguments[0])
    }

    static enter_text({task="",
        user_data_variable_name="a_text",
        initial_value="OK",
        line_count=1, //if 1, makes an input type=text. If > 1 makes a resizeable text area.
        dependent_job_names=[],
        title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"}={}){
        return new Instruction.Control.human_enter_text(arguments[0])
    }

    static notify({task="",
        window=true,
        output_pane=true,
        beep_count=0,
        speak=false,
        title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"
    }={}){
        return new Instruction.Control.human_notify(arguments[0])
    }
    static show_window({content="", title="DDE Information",
                        x=200, y=200, width=400, height=400,
                        background_color = "rgb(238, 238, 238)",
                        is_modal = false,
                        show_close_button = true,
                        show_collapse_button = true,
                        trim_strings = true,
                        callback = window.show_window_values,
                        user_data_variable_name="show_window_vals"
    }={}){
        return new Instruction.Control.human_show_window({
            content: content,
            title: title,
            x: x, y: y, width: width, height: height,
            background_color:        background_color,
            is_modal:                is_modal,
            show_close_button:       show_close_button,
            show_collapse_button:    show_collapse_button,
            trim_strings:            trim_strings,
            callback:                callback,
            user_data_variable_name: user_data_variable_name
    })
    }
}

Human.all_names = []

Serial = class Serial extends Robot {
    constructor({name = "s1", simulate = null, //get sim val from Jobs menu item check box.
                 sim_fun = return_first_arg, path = "required", connect_options={},
                 capture_n_items = 1, item_delimiter="\n", trim_whitespace=true,
                 parse_items = true, capture_extras = "error", /*"ignore", "capture", "error"*/
                 instruction_callback = Job.prototype.set_up_next_do }={}){
        super()
        let keyword_args = {name: name, simulate: simulate, sim_fun: sim_fun, path: path, connect_options: connect_options,
                            capture_n_items: capture_n_items, item_delimiter: item_delimiter, trim_whitespace: trim_whitespace,
                            parse_items: parse_items, capture_extras: capture_extras,
                            instruction_callback: instruction_callback}
        this.make_new_robot_1(keyword_args)
        let old_same_named_robot = Robot[name]
        let old_same_path_robot  = Serial.get_robot_with_path(path)
        if (old_same_named_robot){
            if (old_same_named_robot.active_jobs_using_this_robot().length > 0){
                if(Serial.robots_equivalent(old_same_named_robot, this)){
                    warning("There's already a robot with the name: " + name +
                            ",<br/>that is a serial robot that has an active job " +
                            "<br/>so that's being used instead of a new Robot.serial instance.<br/>" +
                            "Stop a job by clicking on its button in the Output pane's header.")
                    return old_same_named_robot
                }
                else { //same name, active jobs, different robot characteristics
                    dde_error("Attempt to create Robot.Serial with name: " + name +
                              "<br/>but there is already a robot with that name with different properties " +
                              "that is active.<br/>" +
                              "Stop a job by clicking on its button in the Output pane's header."
                              )
                }
            }
            else { //same name but no active jobs
                old_same_named_robot.close_robot()
                return this.make_new_robot_2()
            }
        }
        else if(old_same_path_robot) {
            if (old_same_path_robot.active_jobs_using_this_robot().length > 0){
                dde_error("There's already a robot named: " +  old_same_path_robot.name +
                        " that has an active job.")
            }
            else {
                old_same_path_robot.close_robot()
                return this.make_new_robot_2()
            }
        }
        else { //no same named or same pathed robot
            return this.make_new_robot_2()
        }
    }
    make_new_robot_1(keyword_args){
        this.name                  = keyword_args.name
        this.path                  = keyword_args.path
        this.connect_options       = keyword_args.connect_options
        this.capture_n_items       = keyword_args.capture_n_items
        this.item_delimiter        = keyword_args.item_delimiter
        this.trim_whitespace       = keyword_args.trim_whitespace
        this.parse_items           = keyword_args.parse_items
        this.capture_extras        = keyword_args.capture_extras
        this.simulate              = keyword_args.simulate
        this.sim_fun               = keyword_args.sim_fun
        this.instruction_callback  = keyword_args.instruction_callback
    }
    make_new_robot_2(){
        this.is_connected          = false
        this.robot_status          = null
        Robot.set_robot_name(this.name, this)
        let i = Serial.all_names.indexOf(this.name)
        if (i != -1) {  Serial.all_names.splice(i, 1) }
        Serial.all_names.push(this.name) //ensures the last name on the list is the latest with no redundancy
        Serial.last_robot = this
        //if (this.simulate){
        //    let callback_number = cbr.store_callback(this.sim_fun)
        //    this.sim_fun_number  = callback_number
        //}
        return this
    }

    static robots_equivalent(rob1, rob2){
        if (rob1.constructor != rob2.constructor)          { return false }
        if (rob1.name            != rob2.name)             { return false }
        if (rob1.simulate        != rob2.simulate)         { return false }
        if (rob1.path            != rob2.path)             { return false }
        if (!similar(rob1.connect_options, rob2.connect_options))  { return false }
        if (rob1.capture_n_items != rob2.capture_n_items)  { return false }
        if (rob1.item_delimiter  != rob2.item_delimiter)   { return false }
        if (rob1.trim_whitespace != rob2.trim_whitespace)  { return false }
        if (rob1.parse_items     != rob2.parse_items)      { return false }
        if (rob1.capture_extras  != rob2.capture_extras)   { return false }
        if (!similar(rob1.instruction_callback, rob2.instruction_callback)) { return false }
        if (!similar(rob1.sim_fun, rob2.sim_fun))            { return false }
        return true
    }

    static get_robot_with_path(path){
        for(let robot_name of Serial.all_names){
            let rob = Robot[robot_name]
            if (rob.path == path) { return rob} //there should be at most 1
        }
        return null
    }

    static get_job_with_robot_path(path){
        for(let job_name of Job.all_names){
            let job_instance = Job[job_name]
            if (job_instance.robot.path == path) { return job_instance} //there should be at most 1
        }
        return null
    }

    is_initialized(){ return this.is_connected }

    start(job_instance) { //fill in initial robot_status
        if (this.is_initialized()) {
            Serial.set_a_robot_instance_socket_id(this.path) //we don't now actually use socket_id outside of serial.js
        }
        else {
            serial_connect(this.path, this.connect_options, this.simulate, this.capture_n_items, this.item_delimiter, this.parse_items, this.capture_extras)
        }
    }

    close_robot(){
        serial_disconnect(this.path)
        this.is_connected = false
    }

    //called when a job is finished.
    //returns true if no jobs are connected to this robot, false otherwise
    finish_job(){
        if(this.active_jobs_using_this_robot().length == 0) {
            this.close_robot() //don't do as we may want to use this serial robot for some other job.
            return true        //nope. close_robot just like Dexter robot does.
                               //starting a job with this robot will reconnect the serial port
        }
        else { return false }
    }

    ///called from serial_new_socket_callback
    static set_a_robot_instance_socket_id(path){ //do I really need the socket_id of a serial?
        let rob          = Serial.get_robot_with_path(path)
        //rob.socket_id    = socket_id
        rob.is_connected = true
        let job_instance = Serial.get_job_with_robot_path(path) //beware, this means only 1 job can use this robot!
        if (job_instance.status_code === "starting") {
            job_instance.set_status_code("running")
            job_instance.set_up_next_do(0) //we don't want to increment because PC is at 0, so we just want to do the next instruction, ie 0.
        }
        //before setting it should be "starting"
        else if (job_instance.status_code === "running") {
            rob.perform_instruction_callback(job_instance) //job_instance.set_up_next_do() //initial pc value is 0.
        }
    }

    send(ins_array){
        if      (this.is_connected)  {
          serial_send(ins_array, this.path, this.simulate, this.sim_fun)
        }
        else {
            const job_inst = Instruction.job_of_instruction_array(ins_array)
            job_inst.stop_for_reason("errored",
                                     "Series Robot: " + this.name +
                                     " was sent an instruction to execute on path: " + this.path +
                                     " but this robot is not connected")
        }
    }

    perform_instruction_callback(job_instance){
        if (this.instruction_callback) { this.instruction_callback.call(job_instance) }
    }
    stringify(){
        return "Serial: <i>name</i>: "  + this.name           + ", " +
            ", <i>path</i>: "  + this.path  + ", <i>is_connected</i>: " + this.is_connected +
            Serial.robot_status_to_html(this.robot_status, " on robot: " + this.name)
    }

    static robot_status_to_html(rs, where_from){
         return where_from + " robot_status: " + rs
    }

    static robot_done_with_instruction(robot_status){ //must be a class method, "called" from UI sockets
        let stop_time    = Date.now() //the DDE stop time for the instruction, NOT Dexter's stop time for the rs.

        let job_id       = robot_status[Serial.JOB_ID]
        var job_instance = Job.job_id_to_job_instance(job_id)
        if (job_instance == null){
            job_instance.stop_for_reason("errored",
                      "Serial.robot_done_with_instruction passed job_id: " + job_id +
                      " but couldn't find a Job instance with that job_id.")

        }
        var rob    = job_instance.robot
        var ins_id = robot_status[Serial.INSTRUCTION_ID] //-1 means the initiating status get, before the first od_list instruction
        let op_let = robot_status[Serial.INSTRUCTION_TYPE]
        //let op_let = String.fromCharCode(op_let_number)
        job_instance.record_sent_instruction_stop_time(ins_id, stop_time)
        if (!rob.is_connected) {} //ignore any residual stuff coming back from Serial robot
        //we don't want to change robot_status for instance because that will confuse
        //debugging in the case that we've had an error and want to close.
        //on the other hand, we want accurate info. Hmm, maybe the "residual" is
        //only comming for simulation and not from read dexter.
        //else if (ins_id == -1) {}
        else if (!(Array.isArray(robot_status))) {
            job_instance.stop_for_reason("errored",
                              "Serial.robot_done_with_instruction recieved a robot_status array: " +
                               robot_status + " that is not an array.")
            if (job_instance.wait_until_instruction_id_has_run == ins_id){ //we've done it!
                job_instance.wait_until_instruction_id_has_run = null //but don't increment PC
            }
            rob.perform_instruction_callback(job_instance)
            return
        }
        else if (robot_status.length < Serial.DATA0){
            job_instance.stop_for_reason("errored",
                "Serial.robot_done_with_instruction recieved a robot_status array: " +
                robot_status + "<br/> of length: " + robot_status.length +
                " that is less than the : " + (Serial.DATA0 - 1) + " required.<br/>" + stringify_value(robot_status))
            if (job_instance.wait_until_instruction_id_has_run == ins_id){ //we've done it!
                job_instance.wait_until_instruction_id_has_run = null //but don't increment PC
            }
            rob.perform_instruction_callback(job_instance)
            return
        }
        else {
            //job_instance.highest_completed_instruction_id = ins_id //now always done by set_up_next_do
            //job_instance.robot_status = robot_status
            rob.robot_status          = robot_status //thus rob.robot_status always has the latest rs we got from Dexter.
            if (job_instance.keep_history){
                job_instance.rs_history.push(robot_status)
            }
           // if (job_instance.name === Dexter.updating_robot_status_job_name) { //don't update the table if it isn't shown
           //     Dexter.update_robot_status_table(robot_status)
           // }
            var error_code = robot_status[Serial.ERROR_CODE]
            if (error_code != 0){ //we've got an error
                job_instance.stop_for_reason("errored", "Robot status got error: " + error_code)
                if (job_instance.wait_until_instruction_id_has_run == ins_id){ //we've done it!
                    job_instance.wait_until_instruction_id_has_run = null //but don't increment PC
                }
                rob.perform_instruction_callback(job_instance) //job_instance.set_up_next_do()
            }
           /* just for dexter
             else if (ins_id == -1) { //this is the get_robot_status always called at the very beginning
                if (job_instance.status_code === "starting") {
                    job_instance.status_code = "running"
                   // if(rob.enable_heartbeat && (rob.heartbeat_timeout_obj == null)) { //enabled but not already running
                        //beware multiple jobs could be using this robot, and we only want at most 1 heartbeat going
                   //     rob.run_heartbeat()
                   // }
                }
                //before setting it should be "starting"
                if (job_instance.status_code === "running") {
                    rob.perform_instruction_callback(job_instance) //job_instance.set_up_next_do() //initial pc value is -1. this is the first call to
                    //set_up_next_do (and do_next_item) in this job's life.
                }
            } */
            else { //the normal, no error, not initial case
                if (job_instance.wait_until_instruction_id_has_run == ins_id){ //we've done it!
                    job_instance.wait_until_instruction_id_has_run = null
                    if (ins_id == job_instance.program_counter) {
                        rob.perform_instruction_callback(job_instance)// job_instance.set_up_next_do() //note before doing this, pc might be on last do_list item.
                        //but that's ok. increment pc and call do_next_item.
                    }
                    else {
                        shouldnt("In job: " + job_instance.name +
                            " \n robot_done_with_instruction got ins_id: " + ins_id +
                            " \n which matched wait_until_instruction_id_has_run " +
                            " \n but the PC wasn't the same. Its: "  + job_instance.program_counter)
                    }
                }
                else { //instr coming back is not a wait for,
                    // so its just a non-last instr in a group, so we shouldn't call do_next_item for it
                    //and don't even set robot_status from it. May 2016 decided to set robot status
                    //and history ... see above. status and history should be consistent
                    //but still status can get into a race condition with user code so
                    //am not fond of setting it. ask kent.
                    rob.perform_instruction_callback(job_instance) //job_instance.set_up_next_do() //calling this is mostly a no-op, because
                    //job_instance.wait_until_instruction_id_has_run should be set to
                    //something higher than this instr coming back.
                    //BUT in case the user has stopped the job or another job does so,
                    //then calling do_next_item here would actually stop the job.
                    //so this call to do_next_item will at most get down to the
                    //this.wait_until_instruction_id_has_run clause but never further.
                }
            }
        }
    }


} //end Serial class
Serial.all_names = []
Serial.last_name = null

Serial.robot_status_labels = [
    "JOB_ID",              // 0
    "INSTRUCTION_ID",      // 1
    "START_TIME",          // 2 //ms since jan 1, 1970? From Dexter's clock
    "STOP_TIME",           // 3 //ms since jan 1, 1970? From Dexter's clock
    "INSTRUCTION_TYPE",    // 4 //"oplet"

    "ERROR_CODE",          // 5   0 means no error.
    "DATA0",               // 6  data coming back from the board
    "DATA1",
    "DATA2",
    "DATA3",
    "DATA4",
    "DATA5",
    "DATA6",
    "DATA7",
    "DATA8",
    "DATA9"
]

Serial.robot_status_index_labels = []
//its inefficient to have effectively 3 lists, but the sans-index list is good for
//short labels used in tables, and the index is nice and explicit
//for robot.robot_status[Dexter.foo_index] access
//The explicit Dexter.robot_status_index_labels is needed for a series.
Serial.make_robot_status_indices = function(){
    for(var i = 0; i < Serial.robot_status_labels.length; i++){
        var label = Serial.robot_status_labels[i]
        var index_label = "Series." + label //+ "_INDEX"
        Serial[label] = i
        Serial.robot_status_index_labels.push(index_label)
    }
}

Serial.make_robot_status_indices()

Serial.instruction_type_to_function_name_map = {
    I:"string_instruction" // "S" is used by Dexter and I isn't so use I just in case it helps in debugging.
}

Serial.string_instruction = function(instruction_string){
    if (typeof(instruction_string) != "string") {
        instruction_string = JSON.stringify(instruction_string)
    }
    return make_ins("I", instruction_string)
}

/*anticipate classes for Dexter2, etc. */
Dexter = class Dexter extends Robot {
    constructor({name = "dex1", simulate = null,
                 ip_address = null, port = null,
                 pose = Vector.identity_matrix(4), //default position and orientation
                 enable_heartbeat=true, instruction_callback=Job.prototype.set_up_next_do }={}){  //"192.168.1.144"
        //because arguments[0] doesn't work like it does for fns, I have to resort to this redundancy
        if(!ip_address) { ip_address = persistent_get("default_dexter_ip_address") }
        if(!port)       { port       = persistent_get("default_dexter_port") }

        let keyword_args = {name: name, simulate: simulate, ip_address: ip_address, port: port,
                            pose: pose,
                            enable_heartbeat: enable_heartbeat, instruction_callback: instruction_callback }
        let old_same_named_robot = Robot[name]
        if (old_same_named_robot){
           if ((old_same_named_robot.ip_address === ip_address) &&
               (old_same_named_robot.port       === port)){
               if (old_same_named_robot.active_jobs_using_this_robot().length > 0){
                    warning("There's already a robot with the name: " + name +
                        ", with same ip_address and port that has active jobs " +
                        " so that's being used instead of a new Robot.Dexter instance.")
                    return old_same_named_robot
               }
               else {
                   old_same_named_robot.close_robot()
                   super()
                   return this.make_new_robot(keyword_args)
               }
            }
            else {//old_same_named_robot is same_named but has different ip address
               if (old_same_named_robot.active_jobs_using_this_robot().length > 0){
                   dde_error("Attempt to create a robot named: " + name +
                       " but there is already robot with that name that has active jobs " +
                       " but a different ip_address and/or port.")
               }
               else {
                   old_same_named_robot.close_robot()
                   super()
                   return this.make_new_robot(keyword_args)
               }
           }
        }
        else {//there's no same-named robot
            let old_same_ip_address_robot = Dexter.get_robot_with_ip_address_and_port(ip_address, port)
            if (old_same_ip_address_robot){
                if (old_same_ip_address_robot.active_jobs_using_this_robot().length > 0){
                    dde_error("Attempt to create a robot named: " + name +
                         " but a robot named: " + old_same_ip_address_robot.name +
                         " is already using that ip_address and port and has active jobs.")
                }
                else {
                    old_same_ip_address_robot.close_robot()
                    super()
                    return this.make_new_robot(keyword_args)
                }
            }
            else {//different name, unused ip_address and port
                super()
                return this.make_new_robot(keyword_args)
            }
        }
    }

     make_new_robot(keyword_args){
        this.name                  = keyword_args.name
        this.ip_address            = keyword_args.ip_address
        this.port                  = keyword_args.port
        this.pose                  = keyword_args.pose

        this.simulate              = keyword_args.simulate
        this.instruction_callback  = keyword_args.instruction_callback
        this.robot_status          = null //now contains the heartbeat rs
        this.is_connected          = false

        this.enable_heartbeat      = keyword_args.enable_heartbeat
        this.waiting_for_heartbeat = false
        this.heartbeat_timeout_obj = null

        this.angles = [0, 0, 0, 0, 0] //used by move_to_relative, set by move_all_joints, move_to, and move_to_relative
        this.processing_flush      = false //primarily used as a check. a_robot.send shouldn't get called while this var is true
        Robot.set_robot_name(this.name, this)
         //ensures the last name on the list is the latest with no redundancy
        let i = Dexter.all_names.indexOf(this.name)
        if (i != -1) {  Dexter.all_names.splice(i, 1) }
        Dexter.all_names.push(this.name)
        Dexter.last_robot = this
        //Socket.init(this.name, this.ip_address, this.port)
        return this
    }

    start(job_instance) { //fill in initial robot_status
        //if (!this.is_initialized()) {
            Socket.init(this.name, this.simulate, this.ip_address, this.port)
        //}
        this.processing_flush = false
        let this_robot = this
        let this_job   = job_instance
        //give it a bit of time in case its in the process of initializing
        setTimeout(function(){ //give robot a chance to get its socket before doing th initial "g" send.
                        const sim_actual = Robot.get_simulate_actual(this_robot.simulate)
                        if(!this_robot.is_initialized()){
                            if (this_robot.simulate === true){
                                this_job.stop_for_reason("errored", "The job: " + this_job.name + " is using robot: " + this_robot.name +
                                    "<br/>\nwith simulate=true, but could not connect with the Dexter simulator.")
                            }
                            else if ((this_robot.simulate === false) || (this_robot.simulate === "both")){
                                this_job.stop_for_reason("errored", "The job: " + this_job.name + " is using robot: " + this_robot.name +
                                "<br/>\nbut could not connect with a Dexter robot at: " +
                                this_robot.ip_address + " port: " + this_robot.port +
                                "<br/>\nYou can change this robot to <code>simulate=true</code> and run it.")
                            }
                            else if (this_robot.simulate === null){
                                if ((sim_actual === false) || (sim_actual === "both")){
                                    this_job.stop_for_reason("errored", "The job: " + this_job.name + " is using robot: " + this_robot.name +
                                    '<br/>\nwith the Jobs menu "Simulate?" item being: ' + sim_actual  +
                                    "<br/>\nbut could not connect with Dexter." +
                                    "<br/>\nYou can use the simulator by switching the menu item to 'true'. ")
                                    out("Could not connect to Dexter.", "red")
                                }
                                else {
                                    this_job.stop_for_reason("errored", "The job: " + this_job.name + " is using robot: " + this_robot.name +
                                              "<br/>\nwith a Jobs menu, 'Simulate?' value of 'true', " +
                                              "<br/>\nbut could not connect with the Dexter simulator.")
                                }
                            }
                            else {
                                shouldnt("Dexter.start got invalid simulate value of: " + this_robot.simulate +
                                         '.<br/>\nThe value values are: true, false, "both" and null.')
                            }

                        }
                        else { this_job.send(Dexter.get_robot_status())}
                    },
                    200)
    }

    static get_robot_with_ip_address_and_port(ip_address, port){
        for(let robot_name of Dexter.all_names){
            let dex = Robot[robot_name]
            if (dex.ip_address && //note: if we have 2 Dexter instances that have the default ip_address of null and port of 5000, then we DON'T want to call them "at the same ip_address"
               (dex.ip_address == ip_address) &&
               (dex.port == port)){
                return dex //there should be at most 1
            }
        }
        return null
    }

    run_heartbeat(){
        let this_dex = this
        this.heartbeat_timeout_obj =
          setTimeout(function(){
            if (this_dex.finish_job()) {//If this returns true, that means no more jobs active on this robot, so don't continue the heartbeat.
                                        //If there are more jobs, finish_job does nothing except return false
            }
            else if (this_dex.waiting_for_heartbeat){ //stop recursive timeout
                out("Dexter " + this_dex.name + " did not recieve a response to the heartbeat. Stopping Job.")
                //this_dex.is_connected      = false //should be done by stop_for_reaason and next item
                //this_dex.socket_id         = null  //should be done by stop_for_reaason and next item
                for (let job_instance of this.active_jobs_using_this_robot()){
                    job_instance.stop_for_reason("errored", "No heartbeat response from dexter hardware.")
                    job_instance.do_next_item()
                }
            }
            // else if (!this_dex.socket_id) { //this should never hit because heartbeat isn't started until
            // the initial "g" instruction returns with a status in Dexter.robot_done_with_instruction
            // when this robot must already have a socket_id
            //    let job_instance = Job.job_id_to_job_instance(this_dex.job_id)
            //    job_instance.stop_for_reason("errored", "Dexter " + this_dex.name + " does not have a socket_id in heartbeat")
            //}
            else if (this_dex.enable_heartbeat) { //everything ok. Note: user might disable heartbeat during a job so check here.
                let h_ins = Dexter.get_robot_status_heartbeat()
                let job_instance = this_dex.active_jobs_using_this_robot()[0]
                h_ins[Instruction.JOB_ID] = job_instance.job_id
                h_ins[Instruction.INSTRUCTION_ID] = -4
                this_dex.send(h_ins) //heartbeat associated with the last job created using this robot as its robot.
                this.waiting_for_heartbeat = true
                this_dex.run_heartbeat()
            }
        }, Dexter.heartbeat_dur)
    }

    //called when a job is finished.
    //returns true if no jobs are connected to this robot, false otherwise
    finish_job(){
        if(this.active_jobs_using_this_robot().length == 0) {
            this.close_robot()
            return true
        }
        else { return false }
    }

    close_robot(){
        clearTimeout(this.heartbeat_timeout_obj) //looks like not working
        this.waiting_for_heartbeat = false
        this.heartbeat_timeout_obj = null
        this.is_connected          = false
        Socket.close(this.name, this.simulate) //must be before setting socket_id to null
        // delete Dexter[this.name] //don't do this. If the robot is still part of a Job,
        //and that job is inactive, then we can still "restart" the job,
        //and as such we want that binding of Robot.this_name to still be around.
    }

    empty_instruction_queue_now(){
        Socket.empty_instruction_queue_now(this.name, this.simulate)
    }

    send(ins_array){
        //var is_heartbeat = ins_array[Instruction.INSTRUCTION_TYPE] == "h"
        let oplet = ins_array[Instruction.INSTRUCTION_TYPE]
        if (oplet == "F") { this.processing_flush = true } //ok even if flush is already true. We can send 2 flushes in a row if we like, that's ok. essentially only 1 matters
        if (this.processing_flush && (oplet != "F")) {
            shouldnt(this.name + ".send called with oplet: " + oplet +
                     ", but " + this.name + ".processing_flush is true so send shouldn't have been called.")
        }
        /*else if (oplet == "z"){ //converstin done in sockets.
            ins_array = ins_array.slice()
            const sleep_in_ms = ins_array[Dexter.INSTRUCTION_TYPE + 1]
            const sleep_in_ns = Math.round(sleep_in_ms * 1000000)
            ins_array[Dexter.INSTRUCTION_TYPE + 1] = sleep_in_ns //because Dexter expects nanoseconds
        }*/
        //note: we send F instructions through the below.
        Socket.send(this.name, ins_array, this.simulate)
    }

    perform_instruction_callback(job_instance){
        if (this.instruction_callback) { this.instruction_callback.call(job_instance) }
    }
    stringify(){
        return "Dexter: <i>name</i>: "  + this.name           +
               ", <i>ip_address</i>: "  + this.ip_address     + ", <i>port</i>: "         + this.port         + ",<br/>" +
               "<i>socket_id</i> "      + this.socket_id      + ", <i>is_connected</i>: " + this.is_connected + ", <i>waiting_for_heartbeat</i>: " + this.waiting_for_heartbeat +
               Dexter.robot_status_to_html(this.robot_status, " on robot: " + this.name)
    }

    ///called from Socket in ui
    static set_a_robot_instance_socket_id(robot_name){
        let rob          = Dexter[robot_name]
        //rob.socket_id    = socket_id
        if ([false, "both"].includes(Robot.get_simulate_actual(rob.simulate))) {
            out("Succeeded connection to Dexter: " + robot_name + " at ip_address: " + rob.ip_address + " port: " + rob.port, "green")
        }
        rob.is_connected = true
    }

    //is_initialized(){ return ((this.socket_id || (this.socket_id === 0)) ? true : false ) }

    is_initialized(){
       return this.is_connected
    }

    //beware, robot_status could be an ack, can could be called by sim or real AND
    //will be called twice if simulate == "both"
    static robot_done_with_instruction(robot_status){ //must be a class method, "called" from UI sockets
        if (!(Array.isArray(robot_status))) {
            throw(TypeError("Dexter.robot_done_with_instruction recieved a robot_status array: " +
                robot_status + " that is not an array."))
        }
        else if ((robot_status.length != Dexter.robot_status_labels.length) &&
                 (robot_status.length != Dexter.robot_ack_labels.length)){
            throw(TypeError("Dexter.robot_done_with_instruction recieved a robot_status array: " +
                robot_status + "<br/> of length: " + robot_status.length +
                " that is not the proper length of: " + Dexter.robot_status_labels.length +
                " or: " + Dexter.robot_ack_labels.length))
        }
        let got_ack = (robot_status.length == Dexter.robot_ack_labels.length) //if we have an "acknowledgent, it means we DON"T have in robot_status all we need to render the joint positions
        let stop_time    = Date.now() //the DDE stop time for the instruction, NOT Dexter's stop time for the rs.
        let job_id       = robot_status[Dexter.JOB_ID]
        let job_instance = Job.job_id_to_job_instance(job_id)
        if (job_instance == null){
            throw new Error("Dexter.robot_done_with_instruction passed job_id: " + job_id +
                " but couldn't find a Job instance with that job_id.")
        }
        let rob    = job_instance.robot
        let ins_id = robot_status[Dexter.INSTRUCTION_ID] //-1 means the initiating status get, before the first od_list instruction
        let op_let = robot_status[Dexter.INSTRUCTION_TYPE]
        //let op_let = String.fromCharCode(op_let_number)
        if (op_let == "h") { //we got heartbeat acknowledgement of reciept by phys or sim so now no longer waiting for that acknowledgement
            rob.waiting_for_heartbeat = false
            //rob.robot_status = robot_status
            //if (rob.name === Dexter.updating_robot_status_robot_name) { //don't update the table if it isn't shown
            //    Dexter.update_robot_status_table(robot_status)
            //}
            //SimUtils.render_once(robot_status, "Robot: " + rob.name)
            return
        }
        else if (op_let == "F"){
            if (rob.processing_flush) { rob.processing_flush = false }
            else { shouldnt("robot_done_with_instruction passed a returned instruction oplet of: F " +
                            "but " + this.name + ".processing_flush is false. " +
                            "It should be true if we get an F oplet.")
            }
        }
        job_instance.record_sent_instruction_stop_time(ins_id, stop_time)
        if (!rob.is_connected) {} //ignore any residual stuff coming back from dexter
        //we don't want to change robot_status for instance because that will confuse
        //debugging in the case that we've had an error and want to close.
        //on the other hand, we want accurate info. Hmm, maybe the "residual" is
        //only comming for simulation and not from read dexter.
        //else if (ins_id == -1) {}
        else {
            //job_instance.highest_completed_instruction_id = ins_id //now always done by set_up_next_do
            if (!got_ack){
                //job_instance.robot_status = robot_status
                rob.robot_status          = robot_status //thus rob.robot_status always has the latest rs we got from Dexter.
                if((ins_id === -1) && (op_let == "g")){
                    rob.angles = rob.joint_angles() //must happen after rob.robot_status = robot_status because extracts angles from the robot_status which is ok for this FIRST time init of rob.angles
                }
                if (job_instance.keep_history && (op_let == "g")){ //don't do it for oplet "G", get_robot_status_immediate
                    job_instance.rs_history.push(robot_status)
                }
                /*Don't do this rob.angles is set by move_all_joints BEFORE sending it to robot and should not
                  be set by a move_all_joints coming back from robot.
                else if (op_let == "a"){ //no robot_status so I must get the pos we tried to move_to. This works for orign insturctions of move_to, move_to_relative, and move_all_joints
                                         //rob.xy used by move_to_relative
                    const full_inst = job_instance.do_list[ins_id]
                    rob.angles = [full_inst[Dexter.J1_ANGLE], full_inst[Dexter.J2_ANGLE], full_inst[Dexter.J3_ANGLE], full_inst[Dexter.J4_ANGLE], full_inst[Dexter.J5_ANGLE]]
                }*/
                if (job_instance.name === Dexter.updating_robot_status_job_name) { //don't update the table if it isn't shown
                    Dexter.update_robot_status_table(robot_status)
                }
               // if(rob.simulate) { SimUtils.render_once(robot_status, "Job: " + job_instance.name) } //now in dextersim where it really belongs
            }
            var error_code = robot_status[Dexter.ERROR_CODE]
            if (error_code != 0){ //we've got an error
                job_instance.stop_for_reason("errored", "Robot status got error: " + error_code)
                if (job_instance.wait_until_instruction_id_has_run == ins_id){ //we've done it!
                    job_instance.wait_until_instruction_id_has_run = null //but don't increment PC
                }
                rob.perform_instruction_callback(job_instance) //job_instance.set_up_next_do()
            }
            else if (job_instance.status_code === "starting") { //at least usually ins_id is -1
                job_instance.set_status_code("running")
                //rob.perform_instruction_callback(job_instance)
                job_instance.set_up_next_do(0) //we've just done the initial g instr, so now do the first real instr. PC is already pointing at it, so don't increment it.
            }
            else { //the normal, no error, not initial case
                if (job_instance.wait_until_instruction_id_has_run == ins_id){ //we've done it!
                    job_instance.wait_until_instruction_id_has_run = null
                    if (ins_id == job_instance.program_counter) {
                        rob.perform_instruction_callback(job_instance)// job_instance.set_up_next_do() //note before doing this, pc might be on last do_list item.
                        //but that's ok. increment pc and call do_next_item.
                    }
                    else {
                        shouldnt("In job: " + job_instance.name +
                            " \n robot_done_with_instruction got ins_id: " + ins_id +
                            " \n which matched wait_until_instruction_id_has_run " +
                            " \n but the PC wasn't the same. Its: "  + job_instance.program_counter)
                    }
                }
                else { //instr coming back is not a wait for,
                    // so its just a non-last instr in a group, so we shouldn't call do_next_item for it
                    //and don't even set robot_status from it. May 2016 decided to set robot status
                    //and history ... see above. status and history should be consistent
                    //but still status can get into a race condition with user code so
                    //am not fond of setting it. ask kent.
                    rob.perform_instruction_callback(job_instance) //job_instance.set_up_next_do() //calling this is mostly a no-op, because
                    //job_instance.wait_until_instruction_id_has_run should be set to
                    //something higher than this instr coming back.
                    //BUT in case the user has stopped the job or another job does so,
                    //then calling do_next_item here would actually stop the job.
                    //so this call to do_next_item will at most get down to the
                    //this.wait_until_instruction_id_has_run clause but never further.
                }
            }
        }
    }
    
    //Robot status accessors (read only for users)
    joint_angle(joint_number=1){
        switch(joint_number){
            case 1: return this.robot_status[Dexter.J1_ANGLE]
            case 2: return this.robot_status[Dexter.J2_ANGLE]
            case 3: return this.robot_status[Dexter.J3_ANGLE]
            case 4: return this.robot_status[Dexter.J4_ANGLE]
            case 5: return this.robot_status[Dexter.J5_ANGLE]
            default:
                dde_error("You called Robot." + this.name + ".joint_angle(" + joint_number + ")" +
                          " but joint_number must be 1, 2, 3, 4, or 5.")
        }
    }

    joint_angles(){
        let rs = this.robot_status
        return [rs[Dexter.J1_ANGLE], rs[Dexter.J2_ANGLE], rs[Dexter.J3_ANGLE], rs[Dexter.J4_ANGLE], rs[Dexter.J5_ANGLE]]
    }

    joint_xyz(joint_number=5){
        let xyzs = this.joint_xyzs() //note the first elt is the pos of the base, defaulting to 0,0,0
        return xyzs[joint_number]
    }
    joint_xyzs(){ //todo ask James about this
        return Kin.forward_kinematics(this.joint_angles(), this.pose)[0]
    }

    move_all_joints_fn(angle_array=Dexter.HOME_ANGLES, set_default_speed_first = true){
        let job_00
        if (set_default_speed_first) {
            job_00 = new Job({name: "job_00", robot: this,
                             do_list: [make_ins("S", "MaxSpeed", 25),
                                       Dexter.move_all_joints(angle_array)]
                     })
        }
        else {
            job_00 = new Job({name: "job_00", robot: this,
                              do_list: [Dexter.move_all_joints(angle_array)]
            })
        }
        job_00.start()
    }

    move_to_fn(xyz=[0,0,0], set_default_speed_first = true){
        let job_00
        if (set_default_speed_first) {
            job_00 = new Job({name: "job_00", robot: this,
                              do_list: [make_ins("S", "MaxSpeed", 25),
                                        Dexter.move_to(xyz)
                                        ]
                     })
        }
         else {
            job_00 = new Job({name: "job_00", robot: this,
                              do_list: [Dexter.move_to(xyz)]
                     })
         }
        job_00.start()
    }
    run_instruction_fn(instr){
        const job_00 = new Job({name: "job_00",
            robot: this,
            do_list: [instr]
        })
        job_00.start()
    }
}
Dexter.all_names = []
Dexter.last_robot = null //last Dexter defined.

Dexter.heartbeat_dur = 100 //milliseconds

//_______series robot_config ______
Dexter.LEFT            = [0, null, null]
Dexter.LEFT_DOWN       = [0, 0,    null]
Dexter.LEFT_UP         = [0, 1,    null]
Dexter.LEFT_IN         = [0, null, 0]
Dexter.LEFT_OUT        = [0, null, 1]
Dexter.LEFT_DOWN_IN    = [0, 0,    0]
Dexter.LEFT_DOWN_OUT   = [0, 0,    1]
Dexter.LEFT_UP_IN      = [0, 1,    0]
Dexter.LEFT_UP_OUT     = [0, 1,    1]

Dexter.RIGHT           = [1, null, null]
Dexter.RIGHT_DOWN      = [1, 0,    null]
Dexter.RIGHT_UP        = [1, 1,    null]
Dexter.RIGHT_IN        = [1, null, 0]
Dexter.RIGHT_OUT       = [1, null, 1]
Dexter.RIGHT_DOWN_IN   = [1, 0,    0]
Dexter.RIGHT_DOWN_OUT  = [1, 0,    1]
Dexter.RIGHT_UP_IN     = [1, 1,    0]
Dexter.RIGHT_UP_OUT    = [1, 1,    1]

Dexter.DOWN            = [null, 0, null]
Dexter.DOWN_IN         = [null, 0, 0]
Dexter.DOWN_OUT        = [null, 0, 1]
Dexter.UP              = [null, 1, null]
Dexter.UP_IN           = [null, 1, 0]
Dexter.UP_OUT          = [null, 1, 1]

Dexter.IN              = [null, null, 0]
Dexter.OUT             = [null, null, 1]


//__________INSTRUCTIONS______________
//called only for testing purposes. Goes all the way through to the simulate
//or dexter, unlike Job.error
Dexter.capture_ad     = function(...args){ return make_ins("c", ...args) }
Dexter.capture_points = function(...args){ return make_ins("i", ...args) }
Dexter.cause_error    = function(error_code=1){ return make_ins("e", error_code) } //fry made up. useful for testing

Dexter.draw_dxf       //= DXF.dxf_to_instructions //this must be done in ready.js because
                      //DXF.dxf_to_instructions isn't defined when this file is loaded.
                     /*function(dxf_filepath,
                                 J_angles_A=[[0, 39.3299269794896, 87.73461599877282, -37.064542978262416, 0],
                                             [0, 19.842581231816105, 122.12940522787682, -51.97198645969291, 0],
                                             [29.74488129694223, 26.571085191624196, 110.86421721470252, -47.4353024063267, 0]],
                                 lift_height=0.01, resolution=0.0005, cut_speed=0.0015,
                                 scale=1, fill=false){
                        return DXF.dxf_to_instructions(dxf_filepath, J_angles_A, lift_height, resolution, cut_speed,
                                 scale, fill)
                    }*/

Dexter.run_gcode      = function(filepath, scale=1){
                            return function(){
                            return this.gcode_to_instructions(filepath, scale)
                        }
                        }

Dexter.dma_read       = function(...args){ return make_ins("d", ...args) }
Dexter.dma_write      = function(...args){ return make_ins("t", ...args) }
Dexter.exit           = function(...args){ return make_ins("x", ...args) }
Dexter.empty_instruction_queue_immediately = function() { return make_ins("E") }
Dexter.empty_instruction_queue             = function() { return make_ins("F") }

Dexter.find_home      = function(...args){ return make_ins("f", ...args) }
Dexter.find_home_rep  = function(...args){ return make_ins("p", ...args) }
Dexter.find_index     = function(...args){ return make_ins("n", ...args) }
Dexter.get_robot_status = function(){ return make_ins("g") }
    //this forces do_next_item to wait until robot_status is
    //updated before it runs any more do list items.
Dexter.get_robot_status_heartbeat   = function(){ return make_ins("h") }//never called by user do_list items. Only called by system
Dexter.get_robot_status_immediately = function(){ return make_ins("G") }




//pass in an array of up to 5 elts OR up to 5 separate args.
//If an arg is not present or null, keep the value now in dexer_status unchanged.
//EXCEPT if no args passed in, set to home position.
Dexter.load_tables     = function(...args){ return make_ins("l", ...args) } //
//loads the data created from calibration onto the SD card for persistent storage.

Dexter.move_home = function(){ //move straight up
    return Dexter.move_all_joints(Dexter.HOME_ANGLES)
}

Dexter.move_all_joints = function(array_of_5_angles=[]){
    if (Array.isArray(array_of_5_angles)){ array_of_5_angles = array_of_5_angles.slice(0) }//copy so we don't modify the input array
    else { array_of_5_angles = Array.prototype.slice.call(arguments) }
    let has_non_nulls = false
    for(let ang of array_of_5_angles) { if (ang !== null) { has_non_nulls = true; break; } }
    if (!has_non_nulls) { return null }
    let the_inst_array = array_of_5_angles //closed over
    return function(){ //returns a fn because we must compute this at instruction do time
                //since we may need to get default values out of the current robot_status
                //if the input array is < 5 or has nulls.
                for (var i = 0; i < 5; i++){
                    if (the_inst_array[i] == null){
                        the_inst_array[i] = this.robot.angles[i] //this.robot_status[Dexter.ds_j0_angle_index + i] //ie don't change angle
                    }
                }
                if(Kin.check_J_ranges(the_inst_array)) {
                    this.robot.angles = the_inst_array
                    return make_ins("a", ...the_inst_array)
                }
                else {
                   this.stop_for_reason("errored", "move_all_joints passed angles: " + the_inst_array + "<br/>that are not reachable by Dexter.")
                }
    }
}

//beware, this can't do error checking for out of reach.
//MAYBE this should be implemented like move_to_relative which can do the error checking.


Dexter.move_all_joints_relative = function(delta_angles=[]){
    if (Array.isArray(delta_angles)){ delta_angles = delta_angles.slice(0) }//copy so we don't modify the input array
    else { delta_angles = Array.prototype.slice.call(arguments) }
    let has_non_nulls = false
    for (let i in delta_angles) {
        const val = delta_angles[i]
        if (val === null) { delta_angles[i] = 0 }
    }
    if (delta_angles.length < 5) {
        while(delta_angles.length < 5) {
            delta_angles.push(0)
        }
    }
    let the_int_array = delta_angles //closed over
    return function(){
        const abs_angles = []
        for(var i = 0; i < 5; i++){
            abs_angles.push(this.robot.angles[i] + the_int_array[i])
        }
        return Dexter.move_all_joints(abs_angles)
    }
}

Dexter.move_to_straight = function(xyz           = [],
                                   J5_direction  = [0, 0, -1],
                                   config        = Dexter.RIGHT_UP_OUT,
                                   tool_speed    = 5*_mm / _s,
                                   resolution    = 0.5*_mm){
    return function(){
        let [old_xyz, old_J5_direction, old_config] = Kin.J_angles_to_xyz(this.robot.angles, this.robot.pose)
        try {
            return move_to_straight_aux(old_xyz, xyz,
                                        J5_direction, config,
                                        tool_speed,
                                        resolution,
                                        this.robot.pose)
        }
        catch(err){
            this.stop_for_reason("errored", "Dexter instruction move_to_straight passed xyz values:<br/>" + xyz +
                                     "<br/>that are not valid for moving straight to. <br/>" +
                                     err.message)

        }
    }
}

function move_to_straight_aux(xyz_1, xyz_2, J5_direction, config, tool_speed = 5*_mm / _s, resolution = .5*_mm, robot_pose){
    let movCMD = []
    let U1 = xyz_1
    let U2 = xyz_2
    let U21 = Vector.subtract(U2, U1)
    let v21 = Vector.normalize(U21)
    let mag = Vector.magnitude(U21)
    let div = 1
    let step = Infinity
    while(resolution < step){
        div++
        step = mag / div
    }
    let angular_velocity
    let Ui, new_J_angles
    let old_J_angles = Kin.xyz_to_J_angles(U1, J5_direction, config, robot_pose)
    for(let i = 1; i < div+1; i++){
        Ui = Vector.add(U1, Vector.multiply(i*step, v21))
        new_J_angles = Kin.xyz_to_J_angles(Ui, J5_direction, config, robot_pose)
        angular_velocity = Kin.tip_speed_to_angle_speed(old_J_angles, new_J_angles, tool_speed)
        old_J_angles = new_J_angles
        movCMD.push(make_ins("S", "MaxSpeed", angular_velocity))
        movCMD.push(make_ins("S", "StartSpeed", angular_velocity))
        movCMD.push(Dexter.move_to(Ui, J5_direction, config, robot_pose))
    }
    return movCMD
}


Dexter.is_position = function(an_array){
    return (Array.isArray(an_array)    &&
             (an_array.length == 3)     &&

             Array.isArray(an_array[0]) &&
            (an_array[0].length == 3)  &&

            Array.isArray(an_array[1]) &&
            (an_array[1].length == 3)  &&

             Array.isArray(an_array[2]) &&
            (an_array[2].length == 3)
    )
}
//warning: calling with no args to default everything will be out-of-reach because JS_direction is not straight up,
//params info:
// xyz New defaults are the cur pos, not straight up.
// J5_direction  = [0, 0, -1], //end effector pointing down
//warning: soe valid xyz locations won't be valid with the default J5_direction and config.
Dexter.move_to = function(xyz = [],
                          J5_direction  = [0, 0, -1],
                          config        = Dexter.RIGHT_UP_OUT
                         ){
        return function(){
            if(Dexter.is_position(xyz)){
                xyz = xyz[0]
                J5_direction = xyz[1]
                config = xyz[2]
            }
            if((J5_direction === null) || (config === null)){
                let [existing_xyz, existing_direction, existing_config] = Kin.J_angles_to_xyz(this.robot.angles, this.robot.pose) //just to get defaults.
                if(J5_direction === null) { J5_direction = existing_direction }
                if(config       === null) { config       = existing_config }
            }
            if(Array.isArray(J5_direction) &&
               (J5_direction.length == 2) &&
               (Math.abs(J5_direction[0]) == 90) &&
               (Math.abs(J5_direction[1]) == 90)){
                this.stop_for_reason("errored", "Dexter.move_to was passed an invalid J5_direction of:<br/>" + J5_direction +
                          "<br/>[90, 90], [-90, 90], [90, -90] and [-90, -90]<br/> are all invalid.")
            }
            if (similar(xyz, Dexter.HOME_POSITION[0])) {
                return make_ins("a", ...Dexter.HOME_ANGLES)
            }
            let xyz_copy = xyz.slice(0)
            for(let i = 0; i < 3; i++){
                if (xyz_copy.length <= i)     { xyz_copy.push(existing_xyz[i]) }
                else if (xyz_copy[i] == null) { xyz_copy[i] = existing_xyz[i]  }
            }
            let angles
            try {
                angles = Kin.xyz_to_J_angles(xyz_copy, J5_direction, config, this.robot.pose)

            }
            catch(err){
                this.stop_for_reason("errored", "Dexter instruction move_to passed xyz values:<br/>" + xyz + "<br/>that are not valid.<br/>" +
                                                    err.message)
            }
            //for(let i = 0; i < 5; i++){ angles[i] = Math.round( angles[i]) }
            if (Kin.check_J_ranges(angles)){
                this.robot.angles       = angles
                return make_ins("a", ...angles) // Dexter.move_all_joints(angles)
            }
            else {
                this.stop_for_reason("errored", "move_to called with out of range xyz: " + xyz)
            }
        }
}

Dexter.move_to_relative = function(delta_xyz = [0, 0, 0]){
    let the_delta_xyz = delta_xyz
    return function(){
        //let old_xyz      = Kin.J_angles_to_xyz(this.robot.angles, this.robot.pose)[0]
        //let J5_direction = Kin.J_angles_to_xyz(this.robot.angles)[1]
        //let config       = Kin.J_angles_to_config(this.robot.angles)
        let [old_xyz, J5_direction, config] = Kin.J_angles_to_xyz(this.robot.angles, this.robot.pose)
        let new_xyz = Vector.add(old_xyz, the_delta_xyz) //makes a new array
        let angles
        try {
            angles = Kin.xyz_to_J_angles(new_xyz, J5_direction, config, this.robot.pose)
        }
        catch(err){
            this.stop_for_reason("errored", "move_to_relative called with out of range delta_xyz: " + the_delta_xyz +
                                                "<br/> " + err.message)
        }
        //for(let i = 0; i < 5; i++){ angles[i] = Math.round(angles[i]) }
        if (Kin.check_J_ranges(angles)){
            this.robot.angles = angles
            return make_ins("a", ...angles) // Dexter.move_all_joints(angles)
        }
        else { this.stop_for_reason("errored", "move_to_relative called with out of range delta_xyz: " + the_delta_xyz) }
    }
}
/*
Dexter.move_to_relative = function(xyz, joint_4_angle){
    var result = make_ins("B")
    if (Array.isArray(xyz)){
        if(joint_4_angle == null) joint_4_angle = NaN
        for (var i = 0; i < 3; i++){
            if (xyz.length < i + 1){ result.push(NaN) }//by doing this pusg instead of modifying incomming xyz,
                //we don't havae to worry that the caller might be using xyz after the call.
            else if (xyz[i] == null){ result.push(NaN) }
            else { result.push(xyz[i]) }
        }
        result.push(joint_4_angle)
    }
    else{
        for (var i = 0; i < 4; i++){
            if (arguments.length < (i + 1)){ result.push(NaN) }
            else if (arguments[i] == null) { result.push(NaN) }
            else { result.push(arguments[i]) }
        }
    }
    return result
}*/

Dexter.record_movement = function(...args){ return make_ins("m", ...args) }
Dexter.replay_movement = function(...args){ return make_ins("o", ...args) }
Dexter.set_parameter   = function (name="Acceleration", value){ return make_ins("S", name, value)}
Dexter.sleep           = function(seconds){ return make_ins("z", seconds) }
Dexter.slow_move       = function(...args){ return make_ins("s", ...args) }
Dexter.write           = function(...args){ return make_ins("w", ...args) }

Dexter.write_to_robot = function(a_string="", file_name=null){
    let max_content_chars = 252 //ie 256 - 4 for (instruction_id, oplet, suboplet, length
    let next_start_index = 0
    let instrs = []
    if (file_name){
        instrs.push(make_ins("W", "f", 0, file_name))
    }
    else if (a_string.length <= max_content_chars){ //WHOLE string fits in 1 instruction
        return make_ins("W", "w", a_string.length, a_string)
    }
    else {
        instrs.push(make_ins("W", "s", max_content_chars, a_string.substring(next_start_index, max_content_chars)))
        next_start_index += max_content_chars
    }
    while(next_start_index < a_string.length){
        let chars_left = a_string.length - next_start_index
        if (chars_left <= max_content_chars){
            instrs.push(make_ins("W", "e", chars_left, a_string.substring(next_start_index, a_string.length)))
            return instrs
            //break; //while doesn't support break due to bad js design
        }
        else {
            instrs.push(make_ins("W", "m", max_content_chars, a_string.substring(next_start_index, next_start_index + max_content_chars)))
            next_start_index += max_content_chars
        }
    }
    shouldnt("Dexter.write_to_robot didn't return out of its last while loop iteration.")
}
//from Dexter_Modes.js (these are instructions. The fns return an array of instructions
Dexter.set_follow_me          = function(){ return setFollowMe() }
Dexter.set_force_protect      = function(){ return setForceProtect() }
Dexter.set_keep_position      = function(){ return setKeepPosition() }
Dexter.set_open_loop          = function(){ return setOpenLoop() }

//End Dexter Instructions
//____________Dexter Database______________
//Note: often you should use Robot.instruction_type_to_
Dexter.instruction_type_to_function_name_map = {
    a:"move_all_joints",
    //b:"move_to",           //fry  obsolete
    //B:"move_to_relative",  //fry
    c:"capture_ad", 
    d:"dma_read",
    e:"cause_dexter_error", //fry
    E:"empty_instruction_queue_immediately", //new Sept 1, 2016
    F:"empty_instruction_queue",   //new Sept 1, 2016
    f:"find_home",
    G:"get_robot_status_immediately",        //new Sept 1, 2016
    g:"get_robot_status",   //fry
    h:"get_robot_status_heartbeat", //fry
    i:"capture_points",
    l:"load_tables",
    m:"record_movement",
    n:"find_index",
    o:"replay_movement",
    p:"find_home_rep",
    R:"move_all_joints_relative",
    s:"slow_move",
    S:"set_parameter",
    t:"dma_write",
    w:"write",
    W:"write_to_robot",
    x:"exit",
    z:"sleep"
}

/*
Dexter.prototype.props = function(){
    let file_name  = "dde_" + this.name + "_props.json"
    let result = {}
    if(file_exists(file_name)){
        let content = file_content(file_name)
        try {result = JSON.parse(content) }
        catch(err) {
           dde_error("The file: " + __dirname + "/" + file_name +
                     "<br/>is not valid jason format: " + err.message)
        }
    }
    if (!result.LINKS) {
        result.LINKS = Dexter.LINKS
    }
    return result
}
*/

var cache_of_dexter_instance_files = {}

//returns undefined or value of prop_name
//errors if the robot file is not valid json format
//first checks dexter instance, then file prop, then Dexter class prop

//returns a string if error, or literal name-value pairs object.
Dexter.prototype.get_dexter_props_file_object = function(){
    let file_path  = "//" + this.ip_address + "/share/robot_props.json" //todo needs verificatin
    if (file_exists(file_path)) {
        let content = file_content(file_path)
        try {
            const result = JSON.parse(content)
            return result
            //cache_of_dexter_instance_files[this.name] = result
        }
        catch(err) {
            return "The file: " + __dirname + "/" + file_name +
                "<br/>is not valid jason format: " + err.message
        }
    }
    else { return null }
}

Dexter.prototype.prop = function(prop_name, get_from_dexter=false){
    if (get_from_dexter){
        const file_result = this.get_dexter_props_file_object()
        if (typeof(file_result) == "string") { dde_error(file_result) }
        else { return file_result[prop_name] }
    }
    else {
        var val = this[prop_name]
        if(val !== undefined) { return val }
        else if (cache_of_dexter_instance_files[this.name] === undefined){ //fill up cache_of_dexter_instance_files or error, but don't even attempt to get actual result yet
            const file_result = this.get_dexter_props_file_object()
            if (typeof(file_result) == "string") {
                dde_error(file_result)
            }
            else if (file_result === null){
                let file_path  = "//" + this.ip_address + "/share/robot_props.json"
                warning("The file: " + file_path + " does not exist.")
                cache_of_dexter_instance_files[this.name] = false
            }
        }
        const obj = cache_of_dexter_instance_files[this.name] //obj will NOT be undefined. Its eitehr false or is a lit obj
        if (obj !== false){
            const result = obj[prop_name]
            if (result !== undefined) { return result }
        }
        return Dexter[prop_name]  //get the typical "class value" of the prop
    }
}

//Dexter constants
//values in microns, pivot point to pivot point, not actual link length.
//Dexter manufacturing tolerance is about 5 microns for these link lengths.
//
Dexter.LINK1 = 0.165100   //meters   6.5 inches,
Dexter.LINK2 = 0.320675   //meters  12 5/8 inches
Dexter.LINK3 = 0.330200   //meters  13 inches
Dexter.LINK4 = 0.050800   //meters  2 inches
Dexter.LINK5 = 0.082550   //meters  3.25 inches  // from pivot point to tip of the end-effector
//Dexter.LINKS = [0, Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5]

Dexter.LINK1_AVERAGE_DIAMETER =  0.090000 //meters
Dexter.LINK2_AVERAGE_DIAMETER =  0.120000 //meters
Dexter.LINK3_AVERAGE_DIAMETER =  0.050000 //meters
Dexter.LINK4_AVERAGE_DIAMETER =  0.035000 //meters
Dexter.LINK5_AVERAGE_DIAMETER =  0.030000 //meters

Dexter.LEG_LENGTH = 0.152400 //meters  6 inches

//values in degrees
Dexter.J1_ANGLE_MIN = -Infinity
Dexter.J1_ANGLE_MAX = Infinity
Dexter.J2_ANGLE_MIN = -90
Dexter.J2_ANGLE_MAX = 90
Dexter.J3_ANGLE_MIN = -150
Dexter.J3_ANGLE_MAX = 150
Dexter.J4_ANGLE_MIN = -130 //-100
Dexter.J4_ANGLE_MAX = 130  //100
Dexter.J5_ANGLE_MIN = -185
Dexter.J5_ANGLE_MAX = 185

Dexter.MAX_SPEED    = 30  //degrees per second
Dexter.START_SPEED  = 0.5 //degrees per second
Dexter.ACCELERATION = 0.000129 //degrees/(second^2)

Dexter.RIGHT_ANGLE    = 90 // 90 degrees
Dexter.HOME_ANGLES    = [0, 0, 0, 0, 0]  //j2,j3,j4 straight up, link 5 horizontal pointing frontwards.
Dexter.NEUTRAL_ANGLES = [0, 45, 90, -45, 0] //lots of room for Dexter to move from here.
Dexter.PARKED_ANGLES  = [0, 0, 135, 45, 0 ] //all folded up, compact.

Dexter.HOME_POSITION    = [[0, 0.08255, 0.866775],[0, 1, 0], [1, 1, 1]] //meters, j5 direction, config
Dexter.NEUTRAL_POSITION = [[0, 0.5,     0.075],   [0, 0, -1],[1, 1, 1]]    //meters, j5 direction, config
//don't define   Dexter.PARKED_POSITION = [0, 0.151, 0.20],  [0, -1, 0],   [1, 1, 1]

    /*Dexter.robot_status_labels = [
        "ds_instruction_id",    // = 0
        "ds_instruction_type",  // = 1 //helps in debugging
        "ds_error_code",        // = 2 //0 means no error.

        "ds_j0_angle", //  = 3
        "ds_j1_angle", //  = 4
        "ds_j2_angle", //  = 5
        "ds_j3_angle", //  = 6
        "ds_j4_angle", //  = 7

        "ds_j0_x", //  = 8
        "ds_j0_y", //  = 9
        "ds_j0_z", //  = 10

        "ds_j1_x", //  = 11
        "ds_j1_y", //  = 12
        "ds_j1_z", //  = 13

        "ds_j2_x", //  = 14
        "ds_j2_y", //  = 15
        "ds_j2_z", //  = 16

        "ds_j3_x", //  = 17
        "ds_j3_y", //  = 18
        "ds_j3_z", //  = 19

        "ds_j4_x", //  = 20
        "ds_j4_y", //  = 21
        "ds_j4_z", //  = 22

        "ds_j5_x", //  = 23
        "ds_j5_y", //  = 24
        "ds_j5_z", //  = 25

        "ds_tool_type"   //  = 26
    ]*/
/*
Dexter.robot_status_labels = [
    "INSTRUCTION_ID",       // = 0
    "INSTRUCTION_TYPE",     // = 1 //the "oplet". helps in debugging
    "ERROR_CODE",           // = 2 //0 means no error.

    "BASE_POSITION_AT",     // 3  j0  means angle degrees.  base is bottom
    "END_POSITION_AT",      // 4  j2
    "PIVOT_POSITION_AT",    // 5  j1
    "ANGLE_POSITION_AT",    // 6  j3
    "ROTATE_POSITION_AT",   // 7  j4

//TABLE CALCULATED DELTA
    "BASE_POSITION_DELTA",   // 8   delta diff between where commanded to go and where optical encoder says.
    "END_POSITION_DELTA",    // 9
    "PIVOT_POSITION_DELTA",  // 10
    "ANGLE_POSITION_DELTA",  // 11
    "ROTATE_POSITION_DELTA", // 12

//PID CALCULATED DELTA
    "BASE_POSITION_PID_DELTA",   // 13     proportion integraded d.... math fn. helps hone in, reducing ocillation. closest to the force
    "END_POSITION_PID_DELTA",    // 14
    "PIVOT_POSITION_PID_DELTA",  // 12
    "ANGLE_POSITION_PID_DELTA",  // 13
    "ROTATE_POSITION_PID_DELTA", // 14

// FORCE CALCULATED POSITION MODIFICATION
    "BASE_POSITION_FORCE_DELTA",    // 15   hair
    "END_POSITION_FORCE_DELTA",     // 16
    "PIVOT_POSITION_FORCE_DELTA",   // 17
    "ANGLE_POSITION_FORCE_DELTA",   // 18
    "ROT_POSITION_FORCE_DELTA",     // 19

// RAW ANALOG TO DIGITAL VALUES from A 2 D converter
    "BASE_SIN", //  20
    "BASE_COS", //  21
    "END_SIN",  //  22
    "END_COS",  //  23
    "PIVOT_SIN",//  24
    "PIVOT_COS",//  25
    "ANGLE_SIN",//  26
    "ANGLE_COS",//  27
    "ROT_SIN",  //  28
    "ROT_COS",  //  29

    "DMA_READ_DATA",    //  30   // PROB SHOULD NOT BE USED WITH DDE

// RECORD AND PLAYBACK
    "RECORD_BLOCK_SIZE",        //  31
    "READ_BLOCK_COUNT",         //  32
    "PLAYBACK_BASE_POSITION",   //  33
    "PLAYBACK_END_POSITION",    //  34
    "PLAYBACK_PIVOT_POSITION",  //  35
    "PLAYBACK_ANGLE_POSITION",  //  36
    "PLAYBACK_ROT_POSITION",    //  37

    "END_EFFECTOR_IO_IN",   //  38   32 bits coming from the end effector.

    "SENT_BASE_POSITION",   //  39  where we told joint to go, - 250k to + 250k fixed
    "SENT_END_POSITION",    //  40
    "SENT_PIVOT_POSITION",  //  41
    "SENT_ANGLE_POSITION",  //  42
    "SENT_ROT_POSITION",    //  43

    "SLOPE_BASE_POSITION",  //  44   where at in acell curve. minimize jerk
    "SLOPE_END_POSITION",   //  45
    "SLOPE_PIVOT_POSITION", //  46
    "SLOPE_ANGLE_POSITION", //  47
    "SLOPE_ROT_POSITION"    //  48
] */
//for acknowledgement
Dexter.robot_ack_labels = [
//new name   old name                   array index
// misc block
    "JOB_ID",              //0
    "INSTRUCTION_ID",      //1
    "START_TIME",          //2 //ms since jan 1, 1970? From Dexter's clock
    "STOP_TIME",           //3 //ms since jan 1, 1970? From Dexter's clock
    "INSTRUCTION_TYPE",    //4 "oplet"

    "ERROR_CODE"           //5   0 means ok
]

    Dexter.robot_status_labels = [
//new name   old name                   array index
// misc block
"JOB_ID",              //new field                    0
"INSTRUCTION_ID",      //same name                    1
"START_TIME",          //new field                    2 //ms since jan 1, 1970? From Dexter's clock
"STOP_TIME",           //new field                    3 //ms since jan 1, 1970? From Dexter's clock
"INSTRUCTION_TYPE",    //same name                    4 //"oplet"

"ERROR_CODE",          //same name                    5  //0 means no error.
"DMA_READ_DATA",       //same name                    6
"READ_BLOCK_COUNT",    //same name                    7
"RECORD_BLOCK_SIZE",   //same name                    8
"END_EFFECTOR_IN",     //END_EFFECTOR_IO_IN           9

//J1 block
"J1_ANGLE",            // BASE_POSITION_AT           10
"J1_DELTA",            // BASE_POSITION_DELTA        11
"J1_PID_DELTA",        // BASE_POSITION_PID_DELTA    12
"J1_FORCE_CALC_ANGLE",            // BASE_POSITION_FORCE_DELTA  13
"J1_A2D_SIN",          // BASE_SIN                   14
"J1_A2D_COS",          // BASE_COS                   15
"J1_PLAYBACK",         // PLAYBACK_BASE_POSITION     16
"J1_SENT",             // SENT_BASE_POSITION         17
"J1_SLOPE",            // SLOPE_BASE_POSITION        18
"J1_MEASURED_ANGLE",   // actual angle from Dexter   19
//J2 block of 10
"J2_ANGLE",            // END_POSITION_AT            20
"J2_DELTA",            // END_POSITION_DELTA         21
"J2_PID_DELTA",        // END_POSITION_PID_DELTA     22
"J2_FORCE_CALC_ANGLE", // END_POSITION_FORCE_DELTA   23
"J2_A2D_SIN",          // END_SIN                    24
"J2_A2D_COS",          // END_COS                    25
"J2_PLAYBACK",         // PLAYBACK_END_POSITION      26
"J2_SENT",             // SENT_END_POSITION          27
"J2_SLOPE",            // SLOPE_END_POSITION         28
"J2_MEASURED_ANGLE",   // new field                  29
//J2 block of 10
"J3_ANGLE",            // PIVOT_POSITION_AT           30
"J3_DELTA",            // PIVOT_POSITION_DELTA        31
"J3_PID_DELTA",        // PIVOT_POSITION_PID_DELTA    32
"J3_FORCE_CALC_ANGLE",            // PIVOT_POSITION_FORCE_DELTA  33
"J3_A2D_SIN",          // PIVOT_SIN                   34
"J3_A2D_COS",          // PIVOT_SIN                   35
"J3_PLAYBACK",         // PLAYBACK_PIVOT_POSITION     36
"J3_SENT",             // SENT_PIVOT_POSITION         37
"J3_SLOPE",            // SLOPE_PIVOT_POSITION        38
"J3_MEASURED_ANGLE",   // new field                   39
//J4 block of 10
"J4_ANGLE",            // ANGLE_POSITION_AT           40
"J4_DELTA",            // ANGLE_POSITION_DELTA        41
"J4_PID_DELTA",        // ANGLE_POSITION_PID_DELTA    42
"J4_FORCE_CALC_ANGLE",            // ANGLE_POSITION_FORCE_DELTA  43
"J4_A2D_SIN",          // ANGLE_SIN                   44
"J4_A2D_COS",          // ANGLE_SIN                   45
"J4_PLAYBACK",         // PLAYBACK_ANGLE_POSITION     46
"J4_SENT",             // SENT_ANGLE_POSITION         47
"J4_SLOPE",            // SLOPE_ANGLE_POSITION        48
"J4_MEASURED_ANGLE",   // new field                   49
//J4 block of 10
"J5_ANGLE",            // ROTATE_POSITION_AT          50
"J5_DELTA",            // ROTATE_POSITION_DELTA       51
"J5_PID_DELTA",        // ROTATE_POSITION_PID_DELTA   52
"J5_FORCE_CALC_ANGLE",            // ROT_POSITION_FORCE_DELTA    53
"J5_A2D_SIN",          // ROT_SIN                     54
"J5_A2D_COS",          // ROT_SIN                     55
"J5_PLAYBACK",         // PLAYBACK_ROT_POSITION       56
"J5_SENT",             // SENT_ROT_POSITION           57
"J5_SLOPE",            // SLOPE_ROT_POSITION          58
"J5_MEASURED_ANGLE"    // new field                   59
]

Dexter.robot_status_index_labels = []
//its inefficient to have effectively 3 lists, but the sans-index list is good for
//short labels used in tables, and the index is nice and explicit
//for robot.robot_status[Dexter.foo_index] access
//The explicit Dexter.robot_status_index_labels is needed for a series.
Dexter.make_robot_status_indices = function(){
    for(var i = 0; i < Dexter.robot_status_labels.length; i++){
        var label = Dexter.robot_status_labels[i]
        var index_label = "Dexter." + label //+ "_INDEX"
        Dexter[label] = i
        Dexter.robot_status_index_labels.push(index_label)
    }
}

Dexter.make_robot_status_indices()

Dexter.make_default_status_array = function(){
    let result = new Array(Dexter.robot_status_labels.length).fill(0)
    result[Dexter.INSTRUCTION_ID]   = -1
    result[Dexter.INSTRUCTION_TYPE] = "g"
    return result
}

Dexter.tool_names = [
    "no_tool",      //0
    "unknown_tool" //1
]

Dexter.error_code_strings = [
    "OK",   //0
    "error" //1
]

//____________END of Dexter Database______________
Dexter.tool_type_to_name = function(tool_type){
    if(tool_type < Dexter.tool_names.length){
        return Dexter.tool_names[tool_type]
    }
    else { return "unknown_tool" }
}

Dexter.error_code_to_string = function(error_code){
    if(error_code < Dexter.error_code_strings.length){
        return Dexter.error_code_strings[error_code]
    }
    else { return "error" }
}

Dexter.robot_status_to_html = function(rs, where_from = ""){
    if (rs === null) { return "robot_status " + where_from + " : null,<br/>" }
    else {
        let html_table = Dexter.robot_status_to_html_table(rs)
        return "<details><summary>robot_status fields " + where_from + "</summary>" + html_table + "</details>"
    }
}
//also called by Job.show_robot_status_history_item
Dexter.robot_status_to_html_table = function(ds){
        //setting table class and using css to set fonts in th and td cells fails
        //let cs = " style='font-size:10pt;' " //cell style
        let oplet = ds[Dexter.INSTRUCTION_TYPE]
        let long_start_time_string = date_integer_to_long_string(ds[Dexter.START_TIME])
        let long_stop_time_string = date_integer_to_long_string(ds[Dexter.STOP_TIME])
        let result =
        "<table class='robot_status_table'>" +
        "<tr><th></th>                        <th>JOB_ID</th>                           <th>INSTRUCTION_ID</th>                                                            <th>START_TIME</th>                                                         <th>STOP_TIME</th>                                                                              <th>INSTRUCTION_TYPE</th> </tr>" +
        "<tr><td></td><td>"           + ds[Dexter.JOB_ID]         + "</td><td>" + ds[Dexter.INSTRUCTION_ID]   + "</td><td title='" + long_start_time_string + "'>" + ds[Dexter.START_TIME] + "</td><td title='" + long_stop_time_string + "'>" + ds[Dexter.STOP_TIME] + "</td><td title='" + Robot.instruction_type_to_function_name(oplet)  + "'>" + oplet +        "</td></tr>" +

        "<tr><th></th>              <th>ERROR_CODE</th>                          <th>DMA_READ_DATA</th>                    <th>READ_BLOCK_COUNT</th>                   <th>RECORD_BLOCK_SIZE</th>                                                                 <th>END_EFFECTOR_IN</th></tr>"      +
        "<tr><td></td><td>" + ds[Dexter.ERROR_CODE] + "</td> <td>"       + ds[Dexter.DMA_READ_DATA]  + "</td><td>" + ds[Dexter.READ_BLOCK_COUNT] + "</td><td>" + ds[Dexter.RECORD_BLOCK_SIZE]                                               + "</td><td>" + ds[Dexter.END_EFFECTOR_IN] + "</td></tr>" +

        "<tr><th></th>                   <th>Joint 1</th>                          <th>Joint 2</th>                          <th>Joint 3</th>                          <th>Joint 4</th>                          <th>Joint 5</th></tr>" +
        "<tr><th>ANGLE</th><td>"      + ds[Dexter.J1_ANGLE]       + "</td><td>" + ds[Dexter.J2_ANGLE]       + "</td><td>" + ds[Dexter.J3_ANGLE]       + "</td><td>" + ds[Dexter.J4_ANGLE]       + "</td><td>" + ds[Dexter.J5_ANGLE]     + "</td></tr>" +
        "<tr><th>DELTA</th><td>"      + ds[Dexter.J1_DELTA]       + "</td><td>" + ds[Dexter.J2_DELTA]       + "</td><td>" + ds[Dexter.J3_DELTA]       + "</td><td>" + ds[Dexter.J4_DELTA]       + "</td><td>" + ds[Dexter.J5_DELTA]     + "</td></tr>" +
        "<tr><th>PID_DELTA</th><td>"  + ds[Dexter.J1_PID_DELTA]   + "</td><td>" + ds[Dexter.J2_PID_DELTA]   + "</td><td>" + ds[Dexter.J3_PID_DELTA]   + "</td><td>" + ds[Dexter.J4_PID_DELTA]   + "</td><td>" + ds[Dexter.J5_PID_DELTA] + "</td></tr>" +
        "<tr><th>FORCE_CALC_ANGLE</th><td>"     + ds[Dexter.J1_FORCE_CALC_ANGLE]      + "</td><td>" + ds[Dexter.J2_FORCE_CALC_ANGLE]      + "</td><td>" + ds[Dexter.J3_FORCE_CALC_ANGLE]      + "</td><td>" + ds[Dexter.J4_FORCE_CALC_ANGLE]      + "</td><td>" + ds[Dexter.J5_FORCE_CALC_ANGLE]    + "</td></tr>" +
        "<tr><th>A2D_SIN</th><td>"    + ds[Dexter.J1_A2D_SIN]     + "</td><td>" + ds[Dexter.J2_A2D_SIN]     + "</td><td>" + ds[Dexter.J3_A2D_SIN]     + "</td><td>" + ds[Dexter.J4_A2D_SIN]     + "</td><td>" + ds[Dexter.J5_A2D_SIN]   + "</td></tr>" +
        "<tr><th>A2D_COS</th><td>"    + ds[Dexter.J1_A2D_COS]     + "</td><td>" + ds[Dexter.J2_A2D_COS]     + "</td><td>" + ds[Dexter.J3_A2D_COS]     + "</td><td>" + ds[Dexter.J4_A2D_COS]     + "</td><td>" + ds[Dexter.J5_A2D_COS]   + "</td></tr>" +
        "<tr><th>PLAYBACK</th><td>"   + ds[Dexter.J1_PLAYBACK]    + "</td><td>" + ds[Dexter.J2_PLAYBACK]    + "</td><td>" + ds[Dexter.J3_PLAYBACK]    + "</td><td>" + ds[Dexter.J4_PLAYBACK]    + "</td><td>" + ds[Dexter.J5_PLAYBACK]  + "</td></tr>" +
        "<tr><th>SENT</th><td>"       + ds[Dexter.J1_SENT]        + "</td><td>" + ds[Dexter.J2_SENT]        + "</td><td>" + ds[Dexter.J3_SENT]        + "</td><td>" + ds[Dexter.J4_SENT]        + "</td><td>" + ds[Dexter.J5_SENT]      + "</td></tr>" +
        "<tr><th>SLOPE</th><td>"      + ds[Dexter.J1_SLOPE]       + "</td><td>" + ds[Dexter.J2_SLOPE]       + "</td><td>" + ds[Dexter.J3_SLOPE]       + "</td><td>" + ds[Dexter.J4_SLOPE]       + "</td><td>" + ds[Dexter.J5_SLOPE]     + "</td></tr>" +
        "</table>"
        return result
}

//_________updating robot status___________
Dexter.update_time_string = function(){
    let d = new Date()
    return d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
}
//runs in  sandbox
Dexter.update_robot_status_names_menu_html = function (){
    //broken chrome ignore's style on select and option, so sez stack overflow
    //but stack overflow sez use a style on optgroup. That doesn't work either.
    let result = "<select id='update_robot_status_names_select_id' " +
                 "<optgroup style='font-size:18px;'>"
    if (Dexter.updating_robot_status_job_name){
        for(let name of Job.all_names){
            let job_instance = Job[name]
            if(job_instance.robot instanceof Dexter){
                let sel = (name == Dexter.updating_robot_status_job_name ? " selected" : "" )
                result += "<option" + sel + ">" + name + "</option>"
            }
        }
    }
    else {
        for(let name of Dexter.all_names){
            let sel = (name == Dexter.updating_robot_status_robot_name ? " selected" : "" )
            result += "<option" + sel + ">" + name + "</option>"
        }
    }
    return result + "</optgroup></select>"
}

Dexter.update_robot_status_job_or_robot_menu_html = function (){
    //broken chrome ignore's style on select and option, so sez stack overflow
    //but stack overflow sez use a style on optgroup. That doesn't work either.
    let job_sel = ""
    let rob_sel = ""
    if (Dexter.updating_robot_status_job_name) { job_sel = " selected"}
    else                                       { rob_sel = " selected"}
    let result = "<select id='update_robot_status_job_or_robot_select_id' " +
                "<optgroup style='font-size:18px;'>" +
                "<option " + job_sel + ">Job</option>" +
                "<option " + rob_sel + ">Robot</option>" +
                "</optgroup></select>"
    return result
}
//called iniitally from sandbox only when calling show_window
//necessary because can't embed js in html in chrome apps
Dexter.update_robot_status_init = function(){
    update_robot_status_names_select_id.oninput=Dexter.update_robot_status_table_name_changed
    update_robot_status_job_or_robot_select_id.oninput=Dexter.update_robot_status_table_job_or_robot_changed
}

//called from UI from the menu item
Dexter.show_robot_status = function(){
    if(!Job.last_job){
        warning('No Jobs have been run so there is no robot status to show.')
    }
    else {
        if((Dexter.updating_robot_status_robot_name == null) &&
           (Dexter.updating_robot_status_job_name == null)){
            Dexter.updating_robot_status_job_name = Job.last_job.name
        }
        let job_robot_select_html = Dexter.update_robot_status_job_or_robot_menu_html()
        let robot = (Dexter.updating_robot_status_job_name   ?
                        Job[Dexter.updating_robot_status_job_name].robot :
                        Dexter[Dexter.updating_robot_status_robot_name])
        let robot_status = robot.robot_status
        let content = Dexter.update_robot_status_to_html_table(robot)
        show_window({content: content,
                     title:  "<span style='font-size:16px;'>Robot Status of</span> " + job_robot_select_html + ": " +
                             Dexter.update_robot_status_names_menu_html() +
                             " <span id='updating_robot_status_info_id' style='font-size:12px'>" + Dexter.update_robot_status_info_html() + "</span>" +
                             "<span style='font-size:12px;margin-left:10px;'> Updated: <span id='robot_status_window_time_id'>" + Dexter.update_time_string() + "</span></span>",
                     width:  755,
                     height: 430
                    })
        setTimeout(Dexter.update_robot_status_init, 300)
    }
}

//only one of these should be non-null at a time
Dexter.updating_robot_status_robot_name = null
Dexter.updating_robot_status_job_name   = null

//called initially from sandbox, from robot_done_with_instruction when the actual robot_status is changed.
Dexter.update_robot_status_table = function(robot_status){
    if((Dexter.updating_robot_status_robot_name == null) &&
        (Dexter.updating_robot_status_job_name  == null)) {
        Dexter.updating_robot_status_job_name = Job.last_job.name
    }
    if (Dexter.updating_robot_status_job_name) {
        robot_status = Job[Dexter.updating_robot_status_job_name].robot.robot_status
    }
    else {
        robot_status = Dexter[Dexter.updating_robot_status_robot_name].robot_status
    }
    if (window["INSTRUCTION_ID_id"]) { //don't attempt to show if the window isn't up. this does repopulate window if its merely shrunken
        robot_status_window_time_id.innerHTML = Dexter.update_time_string()
        for (let i = 0; i < robot_status.length; i++){
           let label    = Dexter.robot_status_labels[i]
           if (!label.startsWith("UNUSED")){
                let val      = (robot_status ? robot_status[i] : "no status") //its possible that a robot will have been defined, but never actually run when this fn is called.
                let elt_name = label + "_id"
                window[elt_name].innerHTML = val
           }
        }
        START_TIME_id.title = date_integer_to_long_string(robot_status[Dexter.START_TIME])
        STOP_TIME_id.title  = date_integer_to_long_string(robot_status[Dexter.STOP_TIME])
        INSTRUCTION_TYPE_id.title = Robot.instruction_type_to_function_name(robot_status[Dexter.INSTRUCTION_TYPE])
    }
}

//called initially from UI
Dexter.update_robot_status_table_name_changed = function(name){
    //when called from the UI, the "name" arg is bound to the event.
    if(typeof(name) != "string") {name = name.target.value}
    let robot_status
    if (Dexter.updating_robot_status_job_name){
        Dexter.updating_robot_status_job_name   = name
        Dexter.updating_robot_status_robot_name = null
        robot_status = Job[Dexter.updating_robot_status_job_name].robot.robot_status
    }
    else {
        Dexter.updating_robot_status_robot_name = name
        Dexter.updating_robot_status_job_name   = null
        robot_status = Dexter[Dexter.updating_robot_status_robot_name].robot_status
    }
    Dexter.update_robot_status_table(robot_status)
    Dexter.update_robot_status_info()
}

Dexter.update_robot_status_table_job_or_robot_changed = function(name){
    //when called from the UI, the "name" arg is bound to the evemt.
    if(typeof(name) != "string") {name = name.target.value}
    let robot_status
    if (name == "Job"){
        Dexter.updating_robot_status_job_name   = Job.last_job.name
        Dexter.updating_robot_status_robot_name = null
        robot_status = Job.last_job.robot.robot_status
    }
    else {
        Dexter.updating_robot_status_robot_name = Dexter.last_robot.name
        Dexter.updating_robot_status_job_name   = null
        robot_status = Dexter.last_robot.robot.robot_status
    }
    //Dexter.show_robot_status() //easiest to change the entire table
    let names_menu_html = Dexter.update_robot_status_names_menu_html()
    Dexter.update_robot_status_replace_names_menu(names_menu_html)
    Dexter.update_robot_status_table(robot_status)
    Dexter.update_robot_status_info()
    setTimeout(Dexter.update_robot_status_init, 100)
}
Dexter.update_robot_status_replace_names_menu = function(names_menu_html){
    $("#update_robot_status_names_select_id").replaceWith(names_menu_html)
    setTimeout(Dexter.update_robot_status_init, 100)
}

Dexter.update_robot_status_info = function(){
    let the_html = Dexter.update_robot_status_info_html()
    updating_robot_status_info_id.innerHTML = the_html
}

//in sandbox
Dexter.update_robot_status_info_html = function(){
    if (Dexter.updating_robot_status_job_name){
       let job_instance = Job[Dexter.updating_robot_status_job_name]
       let result = "(using robot: " + job_instance.robot.name + ")"
       return result
    }
    else {
        let the_robot = Robot[Dexter.updating_robot_status_robot_name]
        let job_instances = the_robot.jobs_using_this_robot()
        let result = "(used by jobs:"
        for(let i = 0; i < job_instances.length; i++){
            let j = job_instances[i]
            if (i > 0) { result += "," }
            result += " " + j.name
        }
        result += ")"
        return result
    }
}

Dexter.update_robot_status_to_html_table = function(robot){
    //setting table class and using css to set fonts in th and td cells fails
    //let cs = " style='font-size:10pt;' " //cell style
    //let oplet = ds[Dexter.INSTRUCTION_TYPE]
    let robot_status = robot.robot_status
    let xyz
       try { xyz = robot.joint_xyz() }
       catch(e) {xyz = ["no status", "no status", "no status"] }
    let result =
        "<table class='robot_status_table'>" +
        "<tr><th></th>    <th>JOB_ID</th><th>INSTRUCTION_ID</th><th>START_TIME</th><th>STOP_TIME</th><th>INSTRUCTION_TYPE</th></tr>" +
        Dexter.make_rs_row(robot_status, "", "JOB_ID",      "INSTRUCTION_ID",      "START_TIME",      "STOP_TIME",      "INSTRUCTION_TYPE") +

        "<tr><th></th>    <th>ERROR_CODE</th><th>DMA_READ_DATA</th><th>READ_BLOCK_COUNT</th><th>RECORD_BLOCK_SIZE</th><th>END_EFFECTOR_IN</th></tr>" +
        Dexter.make_rs_row(robot_status, "", "ERROR_CODE",      "DMA_READ_DATA",      "READ_BLOCK_COUNT",      "RECORD_BLOCK_SIZE",      "END_EFFECTOR_IN") +

            "<tr><th></th>         <th>Joint 1</th><th>Joint 2</th><th>Joint 3</th><th>Joint 4</th><th>Joint 5</th></tr>" +
        Dexter.make_rs_row(robot_status, "MEASURED_ANGLE",    "J1_MEASURED_ANGLE",   "J2_MEASURED_ANGLE",   "J3_MEASURED_ANGLE",   "J4_MEASURED_ANGLE", "J5_MEASURED_ANGLE") +
        Dexter.make_rs_row(robot_status, "ANGLE",     "J1_ANGLE",     "J2_ANGLE",     "J3_ANGLE",     "J4_ANGLE",     "J5_ANGLE"    ) +
        Dexter.make_rs_row(robot_status, "DELTA",     "J1_DELTA",     "J2_DELTA",     "J3_DELTA",     "J4_DELTA",     "J5_DELTA"    ) +
        Dexter.make_rs_row(robot_status, "PID_DELTA", "J1_PID_DELTA", "J2_PID_DELTA", "J3_PID_DELTA", "J4_PID_DELTA", "J5_PID_DELTA") +
        Dexter.make_rs_row(robot_status, "FORCE_CALC_ANGLE", "J1_FORCE_CALC_ANGLE", "J2_FORCE_CALC_ANGLE", "J3_FORCE_CALC_ANGLE", "J4_FORCE_CALC_ANGLE", "J5_FORCE_CALC_ANGLE") +
        Dexter.make_rs_row(robot_status, "A2D_SIN",   "J1_A2D_SIN",   "J2_A2D_SIN",   "J3_A2D_SIN",   "J4_A2D_SIN",   "J5_A2D_SIN"  ) +
        Dexter.make_rs_row(robot_status, "A2D_COS",   "J1_A2D_COS",   "J2_A2D_COS",   "J3_A2D_COS",   "J4_A2D_COS",   "J5_A2D_COS"  ) +
        Dexter.make_rs_row(robot_status, "PLAYBACK",  "J1_PLAYBACK",  "J2_PLAYBACK",  "J3_PLAYBACK",  "J4_PLAYBACK",  "J5_PLAYBACK" ) +
        Dexter.make_rs_row(robot_status, "SENT",      "J1_SENT",      "J2_SENT",      "J3_SENT",      "J4_SENT",      "J5_SENT"     ) +
        Dexter.make_rs_row(robot_status, "SLOPE",     "J1_SLOPE",     "J2_SLOPE",     "J3_SLOPE",     "J4_SLOPE",     "J5_SLOPE"    ) +
        "<tr><th>MEASURED X</th><td>" + xyz[0] + "</td><th>MEASURED Y</th><td>" + xyz[1] + "</td><th>MEASURED Z</th><td>" + xyz[2] + "</td></tr>" +
        "</table>"
    return result
}

Dexter.make_rs_row = function(robot_status, ...fields){
    let result   = "<tr>"
    let on_first = true
    for(let field of fields){
        let val = (robot_status ? robot_status[Dexter[field]] : "no status")
        if(on_first) {
           result += "<th>" + field + "</th>"
           on_first = false
        }
        else if ((typeof(val) == "string") && (val.length == 1)) { //oplet
            result += "<td title='" +
                Robot.instruction_type_to_function_name(val) +
                       "' id='" + field + "_id'>" +
                       val + "</td>"
        }
        else if (field == "TIME"){
            result += "<td title='" +
                        date_integer_to_long_string(val) +
                        "' id='" + field + "_id'>" +
                        val + "</td>"
        }
        else {
            result += "<td id='" + field + "_id'>" + val + "</td>"
        }
    }
    return result + "</tr>"
}
//_______end updating robot status________

Dexter.sent_instructions_to_html = function(sent_ins){
    var result = "<table><tr>" +
        "<th>JOB_ID</th>" +
        "<th title='The instruction_id is the same as the program counter at send time.'>INS ID</th>" +
        "<th>START_TIME</th>" +
        "<th>STOP_TIME</th>" +
        "<th>INSTRUCTION_TYPE</th>" +
        "<th>Instruction arguments</th></tr>"
    for(var ins of sent_ins){
        var instruction_type = ins[Instruction.INSTRUCTION_TYPE]
        var instruction_name = " (" + Robot.instruction_type_to_function_name(instruction_type) + ")"
        result +=  "<tr><td>" + ins[Instruction.JOB_ID] + "</td><td>" + ins[Instruction.INSTRUCTION_ID] + "</td><td>" + ins[Instruction.START_TIME] + "</td><td>" + ins[Instruction.STOP_TIME] + "</td><td>" + instruction_type + instruction_name + "</td><td>" + Instruction.args(ins) + "</td></tr>"
    }
    result += "</table>"
    return "<details style='display:inline-block;'><summary></summary>" + result + "</details>"
}
//called from utils stringify_value
Dexter.make_show_rs_history_button_html = function(job_id){
    return "<button class='onclick_via_data' data-onclick='Dexter.show_rs_history,," + job_id + "'>Show robot status history</button>"

}
//called from inspect
Dexter.make_show_rs_history_button_html2 = function(job_id){
    return "<button onclick='Dexter.show_rs_history(" + job_id + ")'>Show robot status history</button>"

}

//start the process in ui
Dexter.show_rs_history = function(job_id){
    job_id = parseInt(job_id) //coming from UI so job_id likely a string to start with.
    Dexter.show_rs_history_get_rs_history(job_id)
}

Dexter.show_rs_history_get_rs_history = function(job_id){
    var the_job = Job.job_id_to_job_instance(job_id)
    var rob     = the_job.robot
    var rs_history = the_job.rs_history
    var rs_labels  = rob.constructor.robot_status_labels
    let xyz_for_rs_history = null
    if (rob instanceof Dexter) { //shove the xyz on the end of every rs, and append xyz to the labels too.
         rs_labels = rs_labels.concat(["End_Effector_X", "End_Effector_Y","End_Effector_Z"])
         let new_rs_history = []
         for (let i = 0; i < rs_history.length; i++){
            let rs = rs_history[i]
            let angles = [rs[Dexter.J1_ANGLE], rs[Dexter.J2_ANGLE], rs[Dexter.J3_ANGLE], rs[Dexter.J4_ANGLE], rs[Dexter.J5_ANGLE]]
            let a_xyz  = Kin.J_angles_to_xyz(angles, rob.pose)[0]
            new_rs_history.push(rs.concat(a_xyz))
        }
        rs_history = new_rs_history
    }
    Dexter.show_rs_history_display(the_job.name, the_job.robot.name, the_job.status_code,
                 the_job.highest_completed_instruction_id,
                 the_job.sent_instructions,  rs_history, rs_labels
                )
}

Dexter.show_rs_history_display = function(job_name, robot_name, status, highest_completed_instruction_id, sent_instructions, rs_history, rs_labels){
    //var job_instance = Job.job_id_to_instance(job_id) //won't work cause we'er in the UI.
    //out("in show_rs_history_display: " + sent_instructions)
    var highest_sent_instruction = "null"
    if (sent_instructions.length > 0) {
        highest_sent_instruction = sent_instructions[sent_instructions.length - 1][1]
    }
    var top_info = "<div> " + status + ". highest_sent_instruction: " + highest_sent_instruction +
        " &nbsp;&nbsp;highest completed instruction: " + highest_completed_instruction_id + "</div>"
    show_window({content: top_info + "<div id='rs_history_table'/>",
        title: "Job: " + job_name + ",&nbsp;&nbsp; Robot: " + robot_name + ", &nbsp;&nbsp; Status History",
        width:  725,
        height: 300})
    Dexter.rs_history_populate_window(sent_instructions, rs_history, rs_labels)
}

Dexter.make_rs_history_dataFields = function(rs_labels){
    var result = []
    for(var i  = 0; i < rs_labels.length; i++){
        result.push({name: i, type:"string"})
    }
    return result
}

Dexter.make_rs_history_columns = function(rs_labels, sent_instructions){
    var result = []
    let label
    let width
    let cells_renderer = null //function(row, column, value, rowData){
                                  //try { value =  JSON.stringify(value) }
                                  //catch (e) {}
                                 // return value}
    for(var i  = 0; i < rs_labels.length; i++){
        label  = rs_labels[i]
        width=90
        cells_renderer = null
        if      (label == "JOB_ID")   {
            label = "<span title='The Job this instruction is in.'>JOB_ID</span>" //doesn't work. tooltip doesn't show up
            width=60
        }
        else if      (label == "INSTRUCTION_ID")   {
            label = "<div title='instruction_id'>INS_ID</div>" //doesn't work. tooltip doesn't show up
            width=70
            cells_renderer = function (row, column, value, rowData) {
                    let ins_id = parseInt(value)
                    let ins = Dexter.get_instruction_from_sent_instructions(sent_instructions, ins_id)
                    let ins_html = "Instruction Fields&#013;"
                    let label_index = 0
                    for(let lab of Instruction.labels){
                        ins_html += lab +  ": " + ins[label_index] + "&#013"
                        label_index += 1
                    }
                    let args_html = ins.slice(label_index)
                    try { args_html = JSON.stringify(args_html) }
                    catch (e) {}
                    ins_html += "args: " + args_html
                    return "<div title='" + ins_html + "' style='width:100%;color:blue;'>" + value + "</div>"
                    }
        }
        else if (label == "START_TIME") {
            width=120
        }
        else if (label == "STOP_TIME") {
            width=120
        }
        else if (label == "INSTRUCTION_TYPE") {
            label = "<span title='instruction_type'>Type</span>" // setting title doesn't give tooltip
            width=40
            cells_renderer = function (row, column, value, rowData) {
                let fn_name = Robot.instruction_type_to_function_name(value[1]) //value will be a string of 3 chars, an oplet surounded by double quots.
                return "<div title='" + fn_name + "' style='width:100%;color:blue;'>" + value + "</div>"
            }
        }
        else if (label == "ERROR_CODE") {
            label = "<span title='error_code'>Error</span>" // setting title doesn't give tooltip
            width=40
        }
        else if (label.startsWith("End_Effector")) {
            width = 170
        }
        else { //other labels
           width = Math.max(label.length, 8) * 10
        }
        var pinned = (i < 3)
        let col_obj = {text: label, dataField: i, width: width, pinned: pinned,
                        draggable: true, cellsRenderer: cells_renderer } //draggable is supposed to make the column draggable but it doesn't
        result.push(col_obj)
    }
    return result
}

Dexter.get_instruction_from_sent_instructions = function(sent_instructions, instruction_id){
    for(var ins of sent_instructions){
        if(ins[Dexter.INSTRUCTION_ID] == instruction_id){
            return ins
        }
    }
    return null
}

Dexter.prepare_rses_for_display = function(rs_history){
    let result = []
    for (let row of rs_history){
        let new_row = []
        result.push(new_row)
        for(let elt of row){
            if (typeof(elt) != "number"){
                try{ elt = JSON.stringify(elt) }
                catch (e) {}
            }
            new_row.push(elt)
        }
    }
    return result
}

Dexter.rs_history_populate_window = function(sent_instructions, rs_history, rs_labels){
    // prepare the data
    var data = Dexter.prepare_rses_for_display(rs_history) // [] // rs_history //looks like all html formatting & tooltips in the data are just trhown out bu jqdatatable
    var source =
    {   localData: data,
        dataType: "array",
        dataFields: Dexter.make_rs_history_dataFields(rs_labels)
    };
    var dataAdapter = new $.jqx.dataAdapter(source);
    $("#rs_history_table").jqxDataTable(
        {   width:  700,
            height: 225,
            //columnsHeight: "32px", //jqx bug: when including this field, it causes the vertical scroll bar to disappear rendering scorlling of long tables impossible.
            // need 2 rows of text
            altRows:  true,
            sortable: true,
            //theme: 'energyblue',
            pageable: false, //true,
            //pagerButtonsCount: 10,
            source: dataAdapter,
            columnsResize: true,
            columns: Dexter.make_rs_history_columns(rs_labels, sent_instructions)
        });
}
/* To Do
A bunch of the 10 above fns should be moved to Job or maybe Robot.
Some could be Job instance fns or Robot instance fns.
*/

