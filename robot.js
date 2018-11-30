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

    to_path(){ return "Robot." + this.name }

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

    static is_oplet(oplet, known_oplet=false){
        if((typeof(oplet) === "string") && (oplet.length == 1)){
            if(known_oplet){
                if(Dexter.instruction_type_to_function_name_map[oplet]) {
                    return true
                }
                else { return false }
            }
            else { return true }
        }
        else { return false }
    }

    //Control Instructions
    static break(){ //stop a Robot.loop
        return new Instruction.Control.break()
    }
    static debugger(){ //stop a Robot.loop
        return new Instruction.Control.debugger()
    }
    static error(reason){ //declare that an error happened. This will cause the job to stop.
        return new Instruction.Control.error(reason) //["error", reason]
    }

    static go_to(instruction_location){
        return new Instruction.Control.go_to(instruction_location)
    }

    static grab_robot_status(user_data_variable = "grabbed_robot_status",
                             starting_index = Serial.DATA0,
                             ending_index=null){
        return new Instruction.Control.grab_robot_status(user_data_variable,
                                                         starting_index,
                                                         ending_index)
    }
    //very useful for grabbing rs from a preceeding instr in the do_list of my_serial.string_instruction("foo")
    grab_robot_status(user_data_variable = "grabbed_robot_status",
                      starting_index = Serial.DATA0,
                      ending_index=null){
        return new Instruction.Control.grab_robot_status(user_data_variable,
                                                         starting_index,
                                                         ending_index,
                                                         this)
    }

    static if_any_errors(job_names=[], instruction_if_error=null){
        return new Instruction.Control.if_any_errors(job_names, instruction_if_error)
    }
    static label(name){
        return new Instruction.Control.label(name)
    }

    static loop(boolean_int_array_fn, body_fn){
        return new Instruction.Control.loop(boolean_int_array_fn, body_fn)
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
                        wait_until_done = false, //if true, a_job.send_to_job_receive_done will be called when the do_list_item is done by the to_job
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

    static start_job(job_name, start_options={}, if_started="ignore", wait_until_job_done=false){
        return new Instruction.Control.start_job(job_name, start_options, if_started, wait_until_job_done)
    }

    static stop_job(instruction_location, reason, perform_when_stopped = false){
        return new Instruction.Control.stop_job(instruction_location, reason, perform_when_stopped)
    }

    static suspend(job_name = null, reason = ""){
        return new Instruction.Control.suspend(job_name, reason)
    }
    //unsuspend is also instance meth on Job and should be!
    static unsuspend(job_name = "required"){
        return new Instruction.Control.unsuspend(job_name)
    }

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

    static show_picture({canvas_id="canvas_id", //string of a canvas_id or canvasId dom elt
                            content=null, //mat or file_path
                            title=undefined,
                            x=200, y=40, width=320, height=240,
                            rect_to_draw=null}={}) {
        return new Instruction.Control.show_picture({canvas_id: canvas_id, //string of a canvas_id or canvas dom elt
                                                     content: content, //mat or file_path
                                                     title: title,
                                                     x: x,
                                                     y: y,
                                                     width: width,
                                                     height: height,
                                                     rect_to_draw: rect_to_draw})
    }

    static show_video({video_id="video_id", //string of a video_id or video dom elt
                        content="webcam", //"webcam" or file_path
                        title=undefined,
                        x=200, y=40, width=320, height=240,
                        play=true}={}) {
        return new Instruction.Control.show_video({video_id: video_id, //string of a video_id or video dom elt
                                                    content: content, //mat or file_path
                                                    title: title,
                                                    x: x,
                                                    y: y,
                                                    width: width,
                                                    height: height,
                                                    play: true})
    }
    static take_picture({video_id="video_id", //string of a video_id or video dom elt
                         callback=Picture.show_picture_of_mat}={}) {
        return new Instruction.Control.take_picture({video_id: video_id, //string of a video_id or video dom elt
                                                     callback: callback})
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
    toString(){ return "Brain." + this.name }

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
    toString(){ return "Human." + this.name }

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
        throw new Error("send called on Robot.Human, which has no physical robot.")
    }

    //the human instructions

    static recognize_speech ({title="Recognize Speech", prompt="",
                             only_once=true, click_to_talk=true,
                             width=430, height=270, x=400, y=200,
                             background_color="rgb(238, 238, 238)",
                             phrase_callback=recognize_speech_default_phrase_callback,
                             finish_callback=null,
                             finish_phrase="finish", //unused if only_once=true
                             user_data_variable_name="recognized_speech"
                             } = {}){ //
        let args = {title: title, prompt: prompt, only_once:only_once, click_to_talk: click_to_talk,
                    width:width, height: height, x: x, y: y,
                    background_color: background_color,  phrase_callback:  phrase_callback,
                    //finish_callback=null,   //unused if only_once=true does not have calLback on purpose
                    finish_phrase:"finish",
                    finish_callback: finish_callback,
                    user_data_variable_name: user_data_variable_name}
        return new Instruction.Control.human_recognize_speech(args)
    }

    static speak ({speak_data = "hello", volume = 1.0, rate = 1.0, pitch = 1.0,
                     lang = "en_US", voice = 0, wait = true} = {}){ //does not have calLback on purpose
        if (arguments[0].length > 0){ speak_data = arguments[0] }
        let args = {speak_data: speak_data, volume: volume, rate: rate, pitch: pitch,
                    lang: lang, voice: voice, wait: wait}
        return new Instruction.Control.human_speak(args)
    }


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

    static enter_filepath({task = "",
                           user_data_variable_name="a_filepath", dependent_job_names=[],
                           title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"} = {}){
        return new Instruction.Control.human_enter_filepath(arguments[0])
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

    static enter_position({task="Position Dexter's end effector<br/>to the position that you want to record,<br/>and click 'Continue Job'.",
                           user_data_variable_name="a_position",
                           dependent_job_names=[],
                           title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"}={}) {
        return[Dexter.empty_instruction_queue,
               Dexter.set_follow_me,
               new Instruction.Control.human_enter_position(arguments[0])
              ]
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
    toString(){ return "Serial." + this.name }

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
        this.connecting            = false
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

    init(){
        this.connecting = true
        serial_connect(this.path, this.connect_options, this.simulate, this.capture_n_items, this.item_delimiter, this.parse_items, this.capture_extras)
        /*serial_init_one_info_map_item(this.path,
                                        this.options,
                                        this.simulate,
                                        this.capture_n_items,
                                        this.item_delimiter,
                                        this.trim_whitespace,
                                        this.parse_items,
                                        this.capture_extras)*/
        //this.is_connected = true //do this only in set_a_robot_instance_socket_id
    }

    ///called from serial_new_socket_callback
    static set_a_robot_instance_socket_id(path){ //do I really need the socket_id of a serial?
        let rob          = Serial.get_robot_with_path(path)
        //rob.socket_id    = socket_id
        rob.connecting   = false //connection and is_connected will never both be true
        rob.is_connected = true
        out("Connected to serial port at: " + rob.path, undefined, true)
        let job_instance = Serial.get_job_with_robot_path(path) //beware, this means only 1 job can use this robot!
        if(job_instance) {
            if (job_instance.status_code === "starting") {
                job_instance.set_status_code("running")
                job_instance.set_up_next_do(0) //we don't want to increment because PC is at 0, so we just want to do the next instruction, ie 0.
            }
            //before setting it should be "starting"
            else if (job_instance.status_code === "running") {
                rob.perform_instruction_callback(job_instance) //job_instance.set_up_next_do() //initial pc value is 0.
            }
        }
    }

    send(ins_array){
        let sim_actual   = Robot.get_simulate_actual(this.simulate)
        let job_id       = ins_array[Serial.JOB_ID]
        let job_instance = Job.job_id_to_job_instance(job_id)
        if (this.connecting) {
            job_instance.set_up_next_do(0)
            out("Connecting to serial port at: " + this.path, undefined, true)
        }
        else if (!this.is_connected){
            //this.start(job_instance)
            out("Initializing serial port at: " + this.path, undefined, true)
            this.init()
            job_instance.set_up_next_do(0)
        }
        else if (this.is_connected) { // || (sim_actual === true) || (sim_actual === "both"))  {
            job_instance.wait_until_instruction_id_has_run = job_instance.program_counter //we don't wantto continue the job until this instr is done.
            serial_send(ins_array, this.path, this.simulate, this.sim_fun) //ok time to finally run the instruction!
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

    robot_done_with_instruction(robot_status){ //called from UI sockets
        let stop_time    = Date.now() //the DDE stop time for the instruction, NOT Dexter's stop time for the rs.

        let job_id       = robot_status[Serial.JOB_ID]
        let job_instance = Job.job_id_to_job_instance(job_id)
        if (job_instance == null){
            job_instance.stop_for_reason("errored",
                      "Serial.robot_done_with_instruction passed job_id: " + job_id +
                      " but couldn't find a Job instance with that job_id.")

        }
        let op_let = robot_status[Serial.INSTRUCTION_TYPE]
        let ins_id = robot_status[Serial.INSTRUCTION_ID] //-1 means the initiating status get, before the first od_list instruction
        //let ins = ((ins_id >= 0) ? job_instance.do_list[ins_id] : null)
        let rob = this
        //if (ins && ins.robot) { rob = ins.robot } //used when instruction src code has a subject of a robot isntance
       // else                  { rob = job_instance.robot } //get the default robot for the job
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

    stringify(){
        return "Serial: <i>name</i>: "  + this.name           + ", " +
            ", <i>path</i>: "  + this.path  + ", <i>is_connected</i>: " + this.is_connected +
            Serial.robot_status_to_html(this.robot_status, " on robot: " + this.name)
    }

    static robot_status_to_html(rs, where_from){
        return where_from + " robot_status: " + rs
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

Serial.prototype.string_instruction = function(instruction_string){
    return new Instruction.Control.string_instruction(instruction_string, this)
}

/*anticipate classes for Dexter2, etc.
//the pose matrix includes info on position and orientation
* */
Dexter = class Dexter extends Robot {
    constructor({name = "dex1", simulate = null,
                 ip_address = null, port = null,
                 pose = Vector.identity_matrix(4),
                 enable_heartbeat=true,
                 instruction_callback=Job.prototype.set_up_next_do }={}){  //"192.168.1.144"
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

    toString(){ return "Dexter." + this.name }

    dexter_filepath(){
        if (operating_system == "win"){
            return "//" + this.ip_address + "/share"
        }
        else if (operating_system == "mac"){
            return "//" + this.ip_address + "/share" //probably wrong
        }
        else { //presume linux
            return "//" + this.ip_address + "/share" //probably wrong
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

        this.angles     = [0, 0, 0, 0, 0, 0, 0] //used by move_to_relative, set by move_all_joints, move_to, and move_to_relative
        this.pid_angles = [0, 0, 0, 0, 0, 0, 0]
        this.processing_flush = false //primarily used as a check. a_robot.send shouldn't get called while this var is true
        Robot.set_robot_name(this.name, this)
         //ensures the last name on the list is the latest with no redundancy
        let i = Dexter.all_names.indexOf(this.name)
        if (i != -1) {  Dexter.all_names.splice(i, 1) }
        Dexter.all_names.push(this.name)
        Dexter.last_robot = this
        //Socket.init(this.name, this.ip_address, this.port)
        return this
    }

    /*  ping-rpoxy doesn't seem to work or at least  doesn't have a timeout so it
       waits forever if there is nothing at the ip address
    start(job_instance){

        let sim_actual = Robot.get_simulate_actual(this.simulate)
        if ([false, "both"].includes(sim_actual)) {
            let pingProxy = require('ping-proxy')
            pingProxy({proxyHost: this.ip_address,
                       proxyPort: this.port},
                    function(err, options, statusCode) {
                        if (err) {
                            job_instance.stop_for_reason("errored", "Could not coonect to Dexter. " + err.message)
                        }
                        else {
                            this.start_aux(job_instance)
                        }
                    })
        }
        else { this.start_aux(job_instance) } //no actual connection to Dexter needed as we're only simulating
    }
    */
   /* use_ping_proxy(job_instance, timeout_secs=0){ //couldn't ge tthis npm pkg to work.
        let this_robot = this
        let pingProxy = require('ping-proxy')
        setTimeout(
          function() {
              pingProxy({proxyHost: this_robot.ip_address,
                         proxyPort: this_robot.port},
                  function(err, options, statusCode) {
                      if (err) {
                          if(timeout_secs >= 30){
                                job_instance.stop_for_reason("errored", "Dexter port: " + this_robot.port + " is not open.\nIf it is because Dexter is initializing,\ntry again in a minute." + err.message)
                          }
                          else {
                              this_robot.use_ping_proxy(job_instance, (timeout_secs + 10))
                          }
                      }
                      else {
                          this_robot.start_aux(job_instance)
                      }
                  })
          }, timeout_secs * 1000)
    }
    */
    start(job_instance){
        //out("robot start called with job: " + job_instance.name)
        let sim_actual = Robot.get_simulate_actual(this.simulate)
        let this_robot = this
        let this_job   = job_instance
        if ([false, "both"].includes(sim_actual)) {
                let ping = require('ping') //https://www.npmjs.com/package/ping
                ping.sys.probe(this.ip_address,
                                function(isAlive){
                                    if (isAlive) {
                                        setTimeout(function(){this_robot.start_aux(this_job)},
                                                  500) //in case dexster is booting up, give it a chance to complete boot cycle
                                        //this_robot.use_ping_proxy(job_instance)
                                    }
                                    else {
                                        this_job.stop_for_reason("errored", "Could not connect to Dexter.\nIf it is because Dexter is initializing,\ntry again in a minute.")
                                    }
                                },
                               {timeout: 10}
                               )
        }
        else { setTimeout(function(){this_robot.start_aux(this_job)},
                         500) } //no actual connection to Dexter needed as we're only simulating, BUT
                                 //to keep similation as much like non-sim. due the same timeout.
    }

    start_aux(job_instance) { //fill in initial robot_status
        //if (!this.is_initialized()) {
            Socket.init(this.name, this.simulate, this.ip_address, this.port)
        //}
        this.processing_flush = false
        let this_robot = this
        let this_job   = job_instance
        //give it a bit of time in case its in the process of initializing
        setTimeout(function(){ //give robot a chance to get its socket before doing the initial "g" send.
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
                        else { this_job.send(Dexter.get_robot_status(), this_robot)}
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
    robot_done_with_instruction(robot_status){ //called from UI sockets
        if (!(Array.isArray(robot_status))) {
            throw(TypeError("Dexter.robot_done_with_instruction recieved a robot_status array: " +
                robot_status + " that is not an array."))
        }
        else if (robot_status[Dexter.ERROR_CODE] !== 0){
            let job_id       = robot_status[Dexter.JOB_ID]
            let job_instance = Job.job_id_to_job_instance(job_id)
            if (job_instance) {
                let ins_id = robot_status[Dexter.INSTRUCTION_ID]
                job_instance.stop_for_reason("errored", "got error code: " + Dexter.ERROR_CODE + " back from Dexter for instruction id: " + ins_id)
            }
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
        let rob    = this //job_instance.robot
        let ins_id = robot_status[Dexter.INSTRUCTION_ID] //-1 means the initiating status get, before the first od_list instruction
        let op_let = robot_status[Dexter.INSTRUCTION_TYPE]
        //let op_let = String.fromCharCode(op_let_number)
        if (op_let == "h") { //we got heartbeat acknowledgement of reciept by phys or sim so now no longer waiting for that acknowledgement
            rob.waiting_for_heartbeat = false
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
                rob.rs = new RobotStatus({robot_status: robot_status})

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
               // if(rob.simulate) { SimUtils.render_once(robot_status, "Job: " + job_instance.name) } //now in dextersim where it really belongs
            }
            RobotStatusDialog.update_robot_status_table_maybe(rob) //if the dialog isn't up, this does nothing
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
            case 1: return this.robot_status[Dexter.J1_MEASURED_ANGLE]
            case 2: return this.robot_status[Dexter.J2_MEASURED_ANGLE]
            case 3: return this.robot_status[Dexter.J3_MEASURED_ANGLE]
            case 4: return this.robot_status[Dexter.J4_MEASURED_ANGLE]
            case 5: return this.robot_status[Dexter.J5_MEASURED_ANGLE]
            default:
                dde_error("You called Robot." + this.name + ".joint_angle(" + joint_number + ")" +
                          " but joint_number must be 1, 2, 3, 4, or 5.")
        }
    }

    joint_angles(){
        let rs = this.robot_status
        return [rs[Dexter.J1_MEASURED_ANGLE], rs[Dexter.J2_MEASURED_ANGLE], rs[Dexter.J3_MEASURED_ANGLE], rs[Dexter.J4_MEASURED_ANGLE], rs[Dexter.J5_MEASURED_ANGLE]]
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
    /* The below is a smarter version of run_instruction_fn that just defines job_00 once,
       leaves it running and just adds the instruction to it the 2nd through nth times
       its called. BUT this screws up if you are togglein between
       running an instruction and running a regular job because the job_oo uses up the robot.
       So to avoid that interferance, I've gone back to just
       defining job_00 each time this fn is called and starting the job as above.
    run_instruction_fn(instr){
        let the_job = Job.job_00
        if (!the_job) { //job has yet to be defined in this session of dde, so define it
            the_job = new Job({name: "job_00",
                               robot: this,
                               when_stopped: "wait"})
        }
        if (!the_job.is_active()) { //job is defined but is not running so start it. Might be brand new or might have just stopped
            the_job.start()
        }
        Job.insert_instruction(instr, //finally add in the instr to run.
                               {job: "job_00",
                                offset: "end"})
        //now job_00 is just waiting for another instruction to be passed to it.
    }*/
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

Dexter.draw_dxf   //set to DXF.dxf_to_instructions in ready.js

Dexter.dummy_move = function(){
    let CMD = []
    CMD.push(function(){return Dexter.get_robot_status()})
    CMD.push(function(){
        let rs = this.robot.robot_status //Dexter.my_dex.robot_status
        let J_angles = [rs[Dexter.J1_MEASURED_ANGLE], rs[Dexter.J2_MEASURED_ANGLE], rs[Dexter.J3_MEASURED_ANGLE], rs[Dexter.J4_MEASURED_ANGLE], rs[Dexter.J5_MEASURED_ANGLE]]
        return Dexter.move_all_joints(J_angles)
    })
    return CMD
}

//Dexter.run_gcode_workspace_pose_default = Vector.make_pose([0, 0.5, 0.1], [0, 0, 0], _mm)

Dexter.prototype.run_gcode = function({gcode = "",
                                       filepath = null,
                                       workspace_pose = Vector.make_pose([0, 0.5, 0.1], [0, 0, 0], _mm)}){
    return Dexter.run_gcode({gcode: gcode,
                             filepath:filepath,
                             workspace_pose: workspace_pose,
                             robot: this})
}

Dexter.run_gcode      = function({gcode = "", filepath = null, workspace_pose = Vector.make_pose([0, 0.5, 0.1], [0, 0, 0], _mm), robot=Dexter}){
                            return function(){
                                return Gcode.gcode_to_instructions({gcode: gcode,
                                                                    filepath: filepath,
                                                                    workspace_pose: workspace_pose,
                                                                    robot: robot})
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

Dexter.make_ins = make_ins

Dexter.prototype.make_ins = function(instruction_type, ...args){
    args = new Array(...args)
    args.unshift(instruction_type)
    args.push(this)
    return make_ins.apply(null, args)
}

Dexter.move_home = function(){ //move straight up
    return Dexter.move_all_joints(Dexter.HOME_ANGLES)
}

Dexter.check_joint_limits = false

//similar to Kin.check_J_ranges except returns string if out of range,
//and false if in range whereas Kin.check_J_ranges returns true if
//in range and false otherwise.
Dexter.joints_out_of_range = function(J_angles){
    if (!Dexter.check_joint_limits) { return false }
    else {
        let lower_limit = [Dexter.J1_ANGLE_MIN, Dexter.J2_ANGLE_MIN, Dexter.J3_ANGLE_MIN, Dexter.J4_ANGLE_MIN, Dexter.J5_ANGLE_MIN]
        let upper_limit = [Dexter.J1_ANGLE_MAX, Dexter.J2_ANGLE_MAX, Dexter.J3_ANGLE_MAX, Dexter.J4_ANGLE_MAX, Dexter.J5_ANGLE_MAX]
        let angle
        for(var i = 0; i < J_angles.length; i++){
            angle = J_angles[i]
            if(angle == null) {}
            else if (angle < lower_limit[i]){
                return "Joint " + (i + 1) + " with angle: " + angle + "\nis less than the minimum: " + lower_limit[i]
            }
            else if (angle > upper_limit[i]){
                return "Joint " + (i + 1) + " with angle: " + angle + "\nis more than the maximun: " + upper_limit[i]
            }
        }
        return false
    }
}

//take the actual args passed to maj (sans a possible robot at the end) and
//convert them into an array for further processing
//this always returns an array, and it is an array of angles (or nested array of 1 number for rel angle.
//array will be between 1 and  7 long inclusive.
//elts can be number or NaN
Dexter.convert_maj_angles = function(args_array){
      let result
      if(args_array.length == 1){ //user is only setting J1.
          let first_elt = args_array[0]
          if(Array.isArray(first_elt)){ //This could POSSIBLY be user intending to pass one *relative* joint angle for j1
                                        //but lets presume not.
                                        //but if first_elt is a number or an array of 1 number,
                                        //that's ok, return turn it
              result = first_elt //user passed in an array, use it as the array for the angles.
          }
          else { //only one arg and its not an array, (probably a number) so stick it in an array and we're done.
              result = [first_elt]
          }
      }
      else { // > 1 elt, so all those elts are in an array
          result =  args_array
      }
      //get rid of undefineds and NaN's on the end down to joint 5.
      for(let i = result.length - 1; i > 4; i--){
            let ang = result[i]
            if ((ang === undefined) || Number.isNaN(ang)) {
                result.pop()
            }
       }
       return result
}

Dexter.prototype.move_all_joints = function(...array_of_angles) {
    let array_to_use = Dexter.convert_maj_angles(array_of_angles)
    return new Instruction.Control.move_all_joints(array_to_use, this)
}

Dexter.move_all_joints = function(...array_of_angles){
    let robot
    if (last(array_of_angles) instanceof Dexter) {robot = pop(array_of_angles)}
    let array_to_use = Dexter.convert_maj_angles(array_of_angles)
    return new Instruction.Control.move_all_joints(array_to_use, robot)
}

//the same as move_all_joints but generates a "P" oplet

Dexter.prototype.pid_move_all_joints = function(...array_of_angles) {
    let array_to_use = Dexter.convert_maj_angles(array_of_angles)
    return new Instruction.Control.pid_move_all_joints(array_to_use, this)
}

Dexter.pid_move_all_joints = function(...array_of_angles){
    let robot
    if (last(array_of_angles) instanceof Dexter) {robot = pop(array_of_angles)}
    let array_to_use = Dexter.convert_maj_angles(array_of_angles)
    return new Instruction.Control.pid_move_all_joints(array_to_use, robot)
}

Dexter.prototype.move_all_joints_relative = function(...array_of_angles) {
    let array_to_use = Dexter.convert_maj_angles(array_of_angles)
    return new Instruction.Control.move_all_joints_relative(array_to_use, this)
}
Dexter.move_all_joints_relative = function(...delta_angles){
    let robot
    if (last(delta_angles) instanceof Dexter) {robot = pop(delta_angles)}
    let array_to_use = Dexter.convert_maj_angles(delta_angles)
    return new Instruction.Control.move_all_joints_relative(array_to_use, robot)
}



Dexter.is_position = function(an_array){
    return (Array.isArray(an_array)     &&
             (an_array.length == 3)     &&

             Array.isArray(an_array[0]) &&
            (an_array[0].length == 3)   &&

            Array.isArray(an_array[1])  &&
            (an_array[1].length == 3)   &&

             Array.isArray(an_array[2]) &&
            (an_array[2].length == 3)
    )
}
//warning: calling with no args to default everything will be out-of-reach because JS_direction is not straight up,
//params info:
// xyz New defaults are the cur pos, not straight up.
// J5_direction  = [0, 0, -1], //end effector pointing down
//warning: soe valid xyz locations won't be valid with the default J5_direction and config.
Dexter.prototype.move_to = function(xyz            = [],
                                    J5_direction   = [0, 0, -1],
                                    config         = Dexter.RIGHT_UP_OUT,
                                    workspace_pose = null, //will default to the job's default workspace_pose
                                    j6_angle       = [0],
                                    j7_angle       = [0]) {
    return Dexter.move_to(xyz,
                         J5_direction,
                         config,
                         workspace_pose,
                         j6_angle,
                         j7_angle,
                         this)
}
Dexter.move_to = function(xyz            = [],
                          J5_direction   = [0, 0, -1],
                          config         = Dexter.RIGHT_UP_OUT,
                          workspace_pose = null, //will default to the job's default workspace_pose
                          j6_angle       = [0],
                          j7_angle       = [0],
                          robot
                         ){
       return new Instruction.Control.move_to(xyz, J5_direction, config, workspace_pose, j6_angle, j7_angle, robot)
}

//the same as move_to but generates a "P" oplet
Dexter.prototype.pid_move_to = function(xyz        = [],
                                    J5_direction   = [0, 0, -1],
                                    config         = Dexter.RIGHT_UP_OUT,
                                    workspace_pose = null, //will default to the job's default workspace_pose
                                    j6_angle       = [0],
                                    j7_angle       = [0]) {
    return Dexter.pid_move_to(xyz,
                              J5_direction,
                              config,
                              workspace_pose,
                              j6_angle,
                              j7_angle,
                              this)
}

Dexter.pid_move_to = function(xyz            = [],
                              J5_direction   = [0, 0, -1],
                              config         = Dexter.RIGHT_UP_OUT,
                              workspace_pose = null, //will default to the job's default workspace_pose
                              j6_angle       = [0],
                              j7_angle       = [0],
                              robot
                              ){
    return new Instruction.Control.pid_move_to(xyz, J5_direction, config, workspace_pose, j6_angle, j7_angle, robot)
}

Dexter.prototype.move_to_relative = function(delta_xyz = [0, 0, 0], workspace_pose=null,
                                             j6_delta_angle = 0, j7_delta_angle = 0){
    return Dexter.move_to_relative(delta_xyz, workspace_pose, j6_delta_angle, j7_delta_angle, this)
}
Dexter.move_to_relative = function(delta_xyz = [0, 0, 0], workspace_pose=null, j6_delta_angle=0, j7_delta_angle=0, robot){
    return new Instruction.Control.move_to_relative(delta_xyz, workspace_pose, j6_delta_angle, j7_delta_angle,  robot)
}

Dexter.prototype.move_to_straight = function({xyz           = "required",
                                             J5_direction   = [0, 0, -1],
                                             config         = Dexter.RIGHT_UP_OUT,
                                             workspace_pose = null,
                                             tool_speed     = 5*_mm / _s,
                                             resolution     = 0.5*_mm,
                                             j6_angle       = [0],
                                             j7_angle       = [0],
                                             single_instruction = false}) {
    return Dexter.move_to_straight({xyz: xyz,
                                    J5_direction: J5_direction,
                                    config: config,
                                    workspace_pose: workspace_pose,
                                    tool_speed: tool_speed,
                                    resolution: resolution,
                                    j6_angle: j6_angle,
                                    j7_angle: j7_angle,
                                    single_instruction: single_instruction,
                                    robot: this})
                            }

Dexter.move_to_straight = function({xyz          = "required",
                                   J5_direction  = [0, 0, -1],
                                   config        = Dexter.RIGHT_UP_OUT,
                                   workspace_pose = null,
                                   tool_speed    = 5*_mm / _s,
                                   resolution    = 0.5*_mm,
                                   j6_angle      = [0],
                                   j7_angle      = [0],
                                   single_instruction = false,
                                   robot}){
    if(xyz == "required") { dde_error("Dexter.move_to_straight was not passed the required 'xyz' arg.<br/>move_to_straight takes keyword args.") }
    return new Instruction.Control.move_to_straight({xyz: xyz,
                                                    J5_direction: J5_direction,
                                                    config: config,
                                                    workspace_pose: workspace_pose,
                                                    tool_speed: tool_speed,
                                                    resolution: resolution,
                                                    j6_angle: j6_angle,
                                                    j7_angle: j7_angle,
                                                    single_instruction: single_instruction,
                                                    robot: robot})
}

Dexter.record_movement = function(...args){ return make_ins("m", ...args) }
Dexter.replay_movement = function(...args){ return make_ins("o", ...args) }
Dexter.set_parameter   = function(name="Acceleration", value){
                              if (name == "StartSpeed") {
                                  if (value < 0){
                                      dde_error("Dexter.set_parameter called with StartSpeed of: " + value +
                                                " but it must be greater than or equal to zero.")
                                  }
                              }
                              else if (name == "MaxSpeed") {
                                  if (value <= 0){
                                      dde_error("Dexter.set_parameter called with MaxSpeed of: " + value +
                                                " but it must be greater than zero.")
                                  }
                                  else if (value < (1 / _nbits_cf)){
                                      warning("Dexter.set_parameter called with MaxSpeed of: " + value +
                                      " which is too low.<br/>MaxSpeed set to the minimum permissible speed of: " + (1 / _nbits_cf))
                                  }
                              }
                              return make_ins("S", name, value)
                         }
Dexter.sleep           = function(seconds){ return make_ins("z", seconds) }
Dexter.slow_move       = function(...args){ return make_ins("s", ...args) }
Dexter.write           = function(...args){ return make_ins("w", ...args) }

/*Dexter.write_to_robot = function(a_string="", file_name=null){
    let max_content_chars = 64 //244 //252 //ie 256 - 4 for (instruction_id, oplet, suboplet, length
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
*/
Dexter.socket_encode = function(char){
    let code = char.charCodeAt(0)
    if((0x00 == code) || (0x3B == code) || (0x25 == code)){
        return "%" + code.toString(16).toUpperCase()
    }
    else { return char }
}

Dexter.write_to_robot = function(a_string="", file_name=null){
    let max_content_chars = 62 //244 //252 //ie 256 - 4 for (instruction_id, oplet, suboplet, length
    //payload can be max_contect_chars + 2 long if last character is escaped
    let payload = ""
    let instrs = []
    if (file_name){
        instrs.push(make_ins("W", "f", 0, file_name))
    }
    for(let char of a_string) {
        payload += Dexter.socket_encode(char)
        if (payload.length >= max_content_chars) {
            instrs.push(make_ins("W", "m", payload.length, payload))
            payload = ""
        }
    }
    instrs.push(make_ins("W", "e", payload.length, payload)) //close the file
    return instrs
}
/*testing code
    var data = ""
//for (var i = 255; i > 0; i--) { //top to bottom
for (var i = 0; i < 256; i++) {  //bottom to top
    data += String.fromCharCode(i)
}

//out(data);
out(data.length)

new Job({name: "my_job",
    do_list: [out(Dexter.write_to_robot(data, "/srv/samba/share/test.txt"))]})
*/

Dexter.read_from_robot = function (source, destination){
    return new Instruction.Control.read_from_robot(source, destination)
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
    B:"set_boundries", //10 args: j1BoundryHigh, j1Boundrylow,  j2BoundryHigh, j2Boundrylow, j3BoundryHigh, j3Boundrylow, j4BoundryHigh, j4Boundrylow, j5BoundryHigh, j5Boundrylow,
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
    P:"pid_move_all_joints",
    p:"find_home_rep",
    R:"move_all_joints_relative",
    r:"read_from_robot",
    s:"slow_move",
    S:"set_parameter",
    t:"dma_write",
    T:"move_to_straight",
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

Dexter.LINK1_v1 = Dexter.LINK1 * 1000000 //in microns
Dexter.LINK2_v1 = Dexter.LINK2 * 1000000 //in microns
Dexter.LINK3_v1 = Dexter.LINK3 * 1000000 //in microns
Dexter.LINK4_v1 = Dexter.LINK4 * 1000000 //in microns
Dexter.LINK5_v1 = Dexter.LINK5 * 1000000 //in microns

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
Dexter.J6_ANGLE_MIN = 0
Dexter.J6_ANGLE_MAX = 296
Dexter.J7_ANGLE_MIN = 0
Dexter.J7_ANGLE_MAX = 296

Dexter.MAX_SPEED    = 30  //degrees per second. NOT the max speed tha robot,
                         //but rather for a givien instruction's envelope of speed,
                         //its the max speed that will be attined by that instrution.
                         //The JOINT that this is the max speed for is
                         //the joint that changes the most in a given call to move_all_joints.
Dexter.START_SPEED  = 0.5 //degrees per second
Dexter.ACCELERATION = 0.000129 //degrees/(second^2)

Dexter.RIGHT_ANGLE    = 90 // 90 degrees
Dexter.HOME_ANGLES    = [0, 0, 0, 0, 0, 0, 0]  //j2,j3,j4 straight up, link 5 horizontal pointing frontwards.
Dexter.NEUTRAL_ANGLES = [0, 45, 90, -45, 0, 0, 0] //lots of room for Dexter to move from here.
Dexter.PARKED_ANGLES  = [0, 0, 135, 45, 0, 0, 0] //all folded up, compact.

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
"JOB_ID",              //new field                    0 //for commmanded instruction (when added to queue)
"INSTRUCTION_ID",      //same name                    1 //for cmd ins
"START_TIME",          //new field                    2 //for cmd ins//ms since jan 1, 1970? From Dexter's clock
"STOP_TIME",           //new field                    3 //for cmd ins//ms since jan 1, 1970? From Dexter's clock
"INSTRUCTION_TYPE",    //same name                    4 //for cmd ins  //"oplet"

"ERROR_CODE",          //same name                    5 //for any error      //0 means no error. 1 means an error
"JOB_ID_OF_CURRENT_INSTRUCTION", //                   6 // depricated DMA_READ_DATA
"CURRENT_INSTRUCTION_ID",                   //        7 // depricated READ_BLOCK_COUNT
"RECORD_BLOCK_SIZE",   //same name                    8 //unused
"END_EFFECTOR_IN",     //END_EFFECTOR_IO_IN           9 //0, 1, or 2 indicating type of io for end effector

//J1 block
"J1_ANGLE",            // BASE_POSITION_AT           10 //means commanded stepped angle, not commanded_angle and not current_angle
"J1_DELTA",            // BASE_POSITION_DELTA        11
"J1_PID_DELTA",        // BASE_POSITION_PID_DELTA    12
null,                  // BASE_POSITION_FORCE_DELTA  13 //was J1_FORCE_CALC_ANGLE
"J1_A2D_SIN",          // BASE_SIN                   14
"J1_A2D_COS",          // BASE_COS                   15
"J1_MEASURED_ANGLE",   // PLAYBACK_BASE_POSITION     16 //depricated J1_PLAYBACK
"J1_SENT",             // SENT_BASE_POSITION         17 //unused. angle sent in the commanded angle of INSTRUCTION_ID
"J7_MEASURED_ANGLE",   // SLOPE_BASE_POSITION        18 //depricated J1_SLOPE
 null,                 //                            19 //was J1_MEASURED_ANGLE. not used, get rid of, now don't compute on dde side,
//J2 block of 10
"J2_ANGLE",            // END_POSITION_AT            20
"J2_DELTA",            // END_POSITION_DELTA         21
"J2_PID_DELTA",        // END_POSITION_PID_DELTA     22 was J2_FORCE_CALC_ANGLE
null, // END_POSITION_FORCE_DELTA   23
"J2_A2D_SIN",          // END_SIN                    24
"J2_A2D_COS",          // END_COS                    25
"J2_MEASURED_ANGLE",   // PLAYBACK_END_POSITION      26 //depricated J2_PLAYBACK
"J2_SENT",             // SENT_END_POSITION          27 //unused
"J7_MEASURED_TORQUE",  // SLOPE_END_POSITION         28 //depricated J2_SLOPE
 null,                 // new field                  29 //was J2_MEASURED_ANGLE, not used, get rid of,
//J2 block of 10
"J3_ANGLE",            // PIVOT_POSITION_AT           30
"J3_DELTA",            // PIVOT_POSITION_DELTA        31
"J3_PID_DELTA",        // PIVOT_POSITION_PID_DELTA    32
null,                  // PIVOT_POSITION_FORCE_DELTA  33  was "J3_FORCE_CALC_ANGLE"
"J3_A2D_SIN",          // PIVOT_SIN                   34
"J3_A2D_COS",          // PIVOT_SIN                   35
"J3_MEASURED_ANGLE",   // PLAYBACK_PIVOT_POSITION     36 //depricated J3_PLAYBACK
"J3_SENT",             // SENT_PIVOT_POSITION         37 //unused
"J6_MEASURED_ANGLE",   // SLOPE_PIVOT_POSITION        38 //depricated  J3_SLOPE
 null,                 // new field                   39 //was J3_MESURED_ANGLE not used get rid of
//J4 block of 10
"J4_ANGLE",            // ANGLE_POSITION_AT           40
"J4_DELTA",            // ANGLE_POSITION_DELTA        41
"J4_PID_DELTA",        // ANGLE_POSITION_PID_DELTA    42
null,                  // ANGLE_POSITION_FORCE_DELTA  43 was "J4_FORCE_CALC_ANGLE"
"J4_A2D_SIN",          // ANGLE_SIN                   44
"J4_A2D_COS",          // ANGLE_SIN                   45
"J4_MEASURED_ANGLE",   // PLAYBACK_ANGLE_POSITION     46 //depricated J4_PLAYBACK
"J4_SENT",             // SENT_ANGLE_POSITION         47 //unused
"J6_MEASURED_TORQUE",  // SLOPE_ANGLE_POSITION        48 //depricated J4_SLOPE
null,                  // new field                   49 //not used get rid of
//J4 block of 10
"J5_ANGLE",            // ROTATE_POSITION_AT          50
"J5_DELTA",            // ROTATE_POSITION_DELTA       51
"J5_PID_DELTA",        // ROTATE_POSITION_PID_DELTA   52
null,                  // ROT_POSITION_FORCE_DELTA    53 was "J5_FORCE_CALC_ANGLE"
"J5_A2D_SIN",          // ROT_SIN                     54
"J5_A2D_COS",          // ROT_SIN                     55
"J5_MEASURED_ANGLE",   // PLAYBACK_ROT_POSITION       56 //depricated J5_PLAYBACK
"J5_SENT",             // SENT_ROT_POSITION           57 //unused
null,                  // SLOPE_ROT_POSITION          58 //depricated J5_SLOPE  unusued
null                   // new field                   59 //was J5_MEASURED_ANGLE, not used get rid of
]

Dexter.robot_status_index_labels = []
//its inefficient to have effectively 3 lists, but the sans-index list is good for
//short labels used in tables, and the index is nice and explicit
//for robot.robot_status[Dexter.foo_index] access
//The explicit Dexter.robot_status_index_labels is needed for a series.
Dexter.make_robot_status_indices = function(){
    for(var i = 0; i < Dexter.robot_status_labels.length; i++){
        var label = Dexter.robot_status_labels[i] //could be null
        if (label) {
            var index_label = "Dexter." + label //+ "_INDEX"
            Dexter[label] = i
            Dexter.robot_status_index_labels.push(index_label)
        }
    }
}

Dexter.make_robot_status_indices()

Dexter.make_backward_compatible_robot_status_indices = function(){
    Dexter.DMA_READ_DATA    = 6
    Dexter.READ_BLOCK_COUNT = 7

    Dexter.J1_PLAYBACK = 16
    Dexter.J1_SLOPE    = 18

    Dexter.J2_PLAYBACK = 26
    Dexter.J2_SLOPE    = 28

    Dexter.J3_PLAYBACK = 36
    Dexter.J3_SLOPE    = 38

    Dexter.J4_PLAYBACK = 46
    Dexter.J4_SLOPE    = 48

    Dexter.J5_PLAYBACK = 56
    Dexter.J5_SLOPE    = 58

    Dexter.J1_FORCE_CALC_ANGLE = Dexter.J1_MEASURED_ANGLE
    Dexter.J2_FORCE_CALC_ANGLE = Dexter.J2_MEASURED_ANGLE
    Dexter.J3_FORCE_CALC_ANGLE = Dexter.J3_MEASURED_ANGLE
    Dexter.J4_FORCE_CALC_ANGLE = Dexter.J4_MEASURED_ANGLE
    Dexter.J5_FORCE_CALC_ANGLE = Dexter.J5_MEASURED_ANGLE
}

Dexter.make_backward_compatible_robot_status_indices()

//also called by dexersim.js
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
//only called from the menu bar Jobs/show robot status item
//Always makes a new window
Dexter.show_robot_status = function(event){
    let robot = (Job.last_job? Job.last_job.robot : Robot.dexter0)
    let content = Dexter.update_robot_status_to_html_table(robot)
    show_window({content: content,
        title:  "<span style='font-size:16px;'>Robot Status of</span> " +
        Dexter.update_robot_status_names_menu_html(robot) +
        "<span style='font-size:12px;margin-left:10px;'> Updated: <span id='robot_status_window_time_id'>" + Dexter.update_time_string() + "</span></span>" +
        " <button title='Defines and starts a Job&#13; that continually gets the robot status&#13;of the selected robot.&#13;Click again to stop that Job.'" +
                " onclick='Dexter.robot_status_run_update_job()'>run update job</button>",
        width:  860,
        height: 380
    })
    setTimeout(Dexter.update_robot_status_init, 300)
}

Dexter.update_robot_status_window_up = function(){
    return (update_robot_status_names_select_id ? true : false)
}

//returns null if no update_robot_status window up, or if it doesn't have a robot selectec
Dexter.update_robot_status_robot = function(){
    if (Dexter.update_robot_status_window_up()) {
        let rob_name = update_robot_status_names_select_id.value //might be "Choose" so no real window.
        let rob = Robot[rob_name] //rob will be undefined if rob_name is "Choose"
        if (rob) { return rob }
        else { return null }
    }
    else {return null}
}

Dexter.update_robot_status_names_menu_html = function (robot){
    //broken chrome ignore's style on select and option, so sez stack overflow
    //but stack overflow sez use a style on optgroup. That doesn't work either.
    let result = "<select id='update_robot_status_names_select_id' " +
                 "<optgroup style='font-size:18px;'>"
    for(let name of Dexter.all_names){
        let sel = ((name == robot.name) ? " selected" : "" )
        result += "<option" + sel + ">" + name + "</option>"
    }
    return result + "</optgroup></select>"
}

Dexter.update_time_string = function(){
    let d = new Date()
    return d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
}

Dexter.robot_status_run_update_job = function(){
    let rob_name = update_robot_status_names_select_id.value
    let rob = Robot[rob_name]
    let existing_job = Job["rs_update"]
    if(existing_job && existing_job.is_active()){
        existing_job.stop_for_reason("interrupted", "user stopped job")
    }
    else {
        new Job({name: "rs_update",
            robot: rob,
            do_list: [ Robot.loop(true,  Dexter.get_robot_status)]}).start()
    }
}

Dexter.update_robot_status_init = function(){
    update_robot_status_names_select_id.oninput=Dexter.update_robot_status_table_name_changed
}


//called after the table is created, to update it dynamically.
//also called from robot_done_with_instruction when the actual robot_status is changed.
Dexter.update_robot_status_table = function(robot_status){
    if (window["update_robot_status_names_select_id"]) { //don't attempt to show if the window isn't up. this does repopulate window if its merely shrunken
        robot_status_window_time_id.innerHTML = Dexter.update_time_string()
        for (let i = 0; i < robot_status.length; i++){
           let label    = Dexter.robot_status_labels[i]
           if ((label != null) && !label.startsWith("UNUSED")){
                let val      = (robot_status ? robot_status[i] : "no status") //its possible that a robot will have been defined, but never actually run when this fn is called.
                if((typeof(val) == "number") && (i >= 10)) { //display as a real float
                   val = to_fixed_smart(val, 3) //val.toFixed(3)
                }
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
    let rob = Robot[name]
    let robot_status = rob.robot_status
    Dexter.update_robot_status_table(robot_status)
}

/* obsolete not called
Dexter.update_robot_status_replace_names_menu = function(names_menu_html){
    $("#update_robot_status_names_select_id").replaceWith(names_menu_html)
    setTimeout(Dexter.update_robot_status_init, 100)
}*/

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

        "<tr><th></th>    <th>ERROR_CODE</th><th>JOB_ID_OF_CI</th><th>CURRENT_INSTR</th><th>RECORD_BLOCK_SIZE</th><th>END_EFFECTOR_IN</th></tr>" +
        Dexter.make_rs_row(robot_status, "", "ERROR_CODE",      "JOB_ID_OF_CURRENT_INSTRUCTION",      "CURRENT_INSTRUCTION_ID",      "RECORD_BLOCK_SIZE",      "END_EFFECTOR_IN") +

            "<tr><th></th>         <th>Joint 1</th><th>Joint 2</th><th>Joint 3</th><th>Joint 4</th><th>Joint 5</th><th>Joint 6</th><th>Joint 7</th></tr>" +
        Dexter.make_rs_row(robot_status, "ANGLE",     "J1_ANGLE",     "J2_ANGLE",     "J3_ANGLE",     "J4_ANGLE",     "J5_ANGLE"    ) +
        Dexter.make_rs_row(robot_status, "DELTA",     "J1_DELTA",     "J2_DELTA",     "J3_DELTA",     "J4_DELTA",     "J5_DELTA"    ) +
        Dexter.make_rs_row(robot_status, "PID_DELTA", "J1_PID_DELTA", "J2_PID_DELTA", "J3_PID_DELTA", "J4_PID_DELTA", "J5_PID_DELTA") +
        //Dexter.make_rs_row(robot_status, "FORCE_CALC_ANGLE", "J1_FORCE_CALC_ANGLE", "J2_FORCE_CALC_ANGLE", "J3_FORCE_CALC_ANGLE", "J4_FORCE_CALC_ANGLE", "J5_FORCE_CALC_ANGLE") +
        Dexter.make_rs_row(robot_status, "A2D_SIN",   "J1_A2D_SIN",   "J2_A2D_SIN",   "J3_A2D_SIN",   "J4_A2D_SIN",   "J5_A2D_SIN"  ) +
        Dexter.make_rs_row(robot_status, "A2D_COS",   "J1_A2D_COS",   "J2_A2D_COS",   "J3_A2D_COS",   "J4_A2D_COS",   "J5_A2D_COS"  ) +
        //Dexter.make_rs_row(robot_status, "PLAYBACK",  "J1_PLAYBACK",  "J2_PLAYBACK",  "J3_PLAYBACK",  "J4_PLAYBACK",  "J5_PLAYBACK" ) +
        Dexter.make_rs_row(robot_status, "MEASURED_ANGLE",    "J1_MEASURED_ANGLE",   "J2_MEASURED_ANGLE",   "J3_MEASURED_ANGLE",   "J4_MEASURED_ANGLE", "J5_MEASURED_ANGLE", "J6_MEASURED_ANGLE", "J7_MEASURED_ANGLE") +
        Dexter.make_rs_row(robot_status, "MEASURED_TORQUE",    null,                 null,                   null,                  null,                null,               "J6_MEASURED_TORQUE", "J7_MEASURED_TORQUE") +

        Dexter.make_rs_row(robot_status, "SENT",      "J1_SENT",      "J2_SENT",      "J3_SENT",      "J4_SENT",      "J5_SENT"     ) +
        //Dexter.make_rs_row(robot_status, "SLOPE",     "J1_SLOPE",     "J2_SLOPE",     "J3_SLOPE",     "J4_SLOPE",     "J5_SLOPE"    ) +
         "<tr><th>MEASURED X</th><td><span id='\" + field + \"_id' style='font-family:monospace;float:right;'>" + Dexter.format_measured_angle(xyz[0]) +
        "</span></td><th>MEASURED Y</th><td><span id='\" + field + \"_id' style='font-family:monospace;float:right;'>" + Dexter.format_measured_angle(xyz[1]) +
        "</span></td><th>MEASURED Z</th><td><span id='\" + field + \"_id' style='font-family:monospace;float:right;'>" + Dexter.format_measured_angle(xyz[2]) +
        "</span></td></tr>" +
        "</table>"
    return result
}

Dexter.format_measured_angle = function(angle) {
    if (angle == "no status") { return angle }
    else { return to_fixed_smart(angle, 3) + "m" }
}

Dexter.make_rs_row = function(robot_status, ...fields){
    let result   = "<tr>"
    let on_first = true
    let row_header = fields[0]
    let do_decimal_processing = row_header != ""
    //let is_angle = fields[0].endsWith("ANGLE")
    //let degree_html = (is_angle ? "&deg;" : "")
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
        else if (row_header != "") { //body of table, expect floating point numbers, float right
            val = to_fixed_smart(val, 3) //val.toFixed(3) //format_number(val)
            result += "<td>" +
                "<span id='" + field + "_id' style='font-family:monospace;float:right;'>" + val + "</span>" +
                //degree_html + not playing nicely with float right so skip for now.
                "</td>"

        }
        /*else if (is_integer(val)){
            result += "<td style='font-family:monospace;' id='" + field + "_id'>" + val + degree_html + "</td>"
        }
        else if (typeof(val) == "number") { //it will be a float
                val = val.toFixed(3) //format_number(val)
                //val = val.substring(0, 12) //cut off precision because lots of prevision is
                      //useless, AND it makes the columns wider and narrower dynamically
                      //which is very distracting to read real time updates
            result += "<td>" +
                       "<span id='" + field + "_id' style='font-family:monospace;float:right;'>" + val + "</span>" +
                           //degree_html + not playing nicely with float right so skip for now.
                           "</td>"
        }*/
        else { result += "<td id='" + field + "_id'>" + val + "</td>" }
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

