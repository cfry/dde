/* Created by Fry on 3/29/16. */

//import {RobotStatus} from "./robot_status.js" //in dde4 RobotStatus is global
//import {Job} from "./job.js" now global
//import {Instruction, make_ins} from "./instruction.js" //now global

import {file_exists, node_server_supports_editor,
        read_file} from "./storage"
//import {Socket} from "./socket.js"
//import {serial_connect, serial_disconnect, serial_send}from "./serial.js"

//import {Vector} from "../math/Vector.js" //now global
//import {Kin} from "../math/Kin.js" //now global

import {show_window_values} from "./out.js"


class Robot {
    constructor (args){
       if(!Utils.is_string_an_identifier(args.name)) {
           dde_error('You have attempted to make a new Robot with an invalid name of: "' + args.name +
                     '".<br/>Robot names should start with a letter and be followed only by letters, digits, or underscores.')
       }
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
    //superclass can be a string name like "Dexter" or "Serial", OR it can be the class object.
    //returns true or false
    static is_valid_robot_class_name(robot_class_name) {
        return ["Brain", "Dexter", "Human", "Serial"].includes(robot_class_name)
    }
    static robot_instances_exist_for_running_instructions_of_superclass(superclass){
        let rob_class = ((typeof(superclass) == "string") ? value_of_path(superclass) : superclass)
        if ([Robot, Human].includes(rob_class)) { return true } //Robot and Human instructions can be run on any class of robot
        else { return rob_class.all_names.length > 0 }
    }

    //put the new item on the end, even if you have to remove it from the middle,
    //because we want the latest on the end for default_robot_name
    static set_robot_name(name, robot_instance){
        Robot[name] = robot_instance
        //ensure name is on end of all_names
        let i = Robot.all_names.indexOf(name)
        if (i != -1){ Robot.all_names.splice(i, 1) }
        Robot.all_names.push(name)
        //for Make Instance dialog
        if ((i == -1) &&
             window["DexterUtils"] &&
            (robot_instance instanceof Dexter)) {
            DexterUtils.add_dexter_to_dexter_default_menu(robot_instance)
        }
    }

    static get_simulate_actual(simulate_val){
        if      (simulate_val === true)   { return true   }
        else if (simulate_val === false)  { return false  }
        else if (simulate_val === "both") { return "both" }
        else if (simulate_val === null)   { return DDE_DB.persistent_get("default_dexter_simulate") }
        else { shouldnt("get_simulate_actual passed illegal value: " + simulate_val) }
    }

    static simulate_or_both_selected(){
        if(DDE_DB.persistent_get("default_dexter_simulate")) { return true} //persistent_get call returns true or "both"
        else { return false } //DDE_DB.persistent_get call returns false
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

    //this is shadowed by Dexter, but all other robots are never busy.
    is_busy(){ return false }

    add_to_busy_job_array(a_job){ } //no-op. shadowed by Dexter.

    remove_from_busy_job_array(a_job){} //no-op. shadowed by Dexter.

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
    static break(){ //stop a Control.loop
        return new Instruction.break()
    }
    static continue(){ //start next iteration of a Control.loop
        return new Instruction.continue()
    }
    static debugger(){
        return new Instruction.debugger()
    }
    static step_instructions(){
        return new Instruction.step_instructions()
    }
    static error(reason="Job stopped due to executing a Control.error instruction.",
                 perform_when_stopped=true){ //declare that an error happened. This will cause the job to stop.
        return new Instruction.error(reason, perform_when_stopped)
    }

    static go_to(instruction_location){
        return new Instruction.go_to(instruction_location)
    }

    static grab_robot_status(user_data_variable = "grabbed_robot_status",
                             starting_index = Serial.DATA0,
                             ending_index=null){
        return new Instruction.grab_robot_status(user_data_variable,
                                                         starting_index,
                                                         ending_index)
    }
    //very useful for grabbing rs from a preceeding instr in the do_list of my_serial.string_instruction("foo")
    grab_robot_status(user_data_variable = "grabbed_robot_status",
                      starting_index = Serial.DATA0,
                      ending_index=null){
        return new Instruction.grab_robot_status(user_data_variable,
                                                         starting_index,
                                                         ending_index,
                                                         this)
    }

    static if_any_errors(job_names=[], instruction_if_error=null){
        return new Instruction.if_any_errors(job_names, instruction_if_error)
    }
    static label(name="my_label"){
        return new Instruction.label(name)
    }

    static loop(boolean_int_array_fn=2, body_fn){
        return new Instruction.loop(boolean_int_array_fn, body_fn)
    }

    static out(val="", color="black", temp=false, print_job_info=false){
        return new Instruction.out(val, color, temp, print_job_info)
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
     Instruction.destination_send_to_job_is_done is stuck on the do_list
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
        return new Instruction.send_to_job(arguments[0])
    }

    //rarely used, but can be used to customize a job with additional do_list items at the start.
    static sent_from_job ({do_list_item        = null, //can be null, a single instruction, or an array of instructions
                           from_job_name       = null,
                           from_instruction_id = null,
                           where_to_insert     = "next_top_level", //just for debugging
                           wait_until_done     = false} = {}){
        return new Instruction.sent_from_job(arguments[0])
    }

    static set_inter_do_item_dur(dur, instructions_array){
        return new Instruction.set_inter_do_item_dur({dur: dur, instructions_array: instructions_array})
    }

    static start_job(job_name, start_options={}, if_started="ignore", wait_until_job_done=false){
        return new Instruction.start_job(job_name, start_options, if_started, wait_until_job_done)
    }

    static stop_job(instruction_location, reason, perform_when_stopped = true){
        return new Instruction.stop_job(instruction_location, reason, perform_when_stopped)
    }

    static include_job(job_name, start_loc=null, end_loc=null){
        return new Instruction.include_job(job_name, start_loc, end_loc)
    }

    static suspend(job_name = null, reason = ""){
        return new Instruction.suspend(job_name, reason)
    }
    //unsuspend is also instance meth on Job and should be!
    static unsuspend(job_name = "required", stop_reason=false){
        return new Instruction.unsuspend(job_name, stop_reason)
    }

    static sync_point(name, job_names=[]){
        return new Instruction.sync_point(name, job_names)
    }

    static wait_until(fn_date_dur=1){
        return new Instruction.wait_until(fn_date_dur)
    }

    //arg order is a bit odd because the headers come after the response_variable_name.
    //but the response_variable_name is takes the place of the primary callback,
    //and that's the order I have for get_page (headers on end) which very often
    //default to undefined.
    static get_page(url_or_options, response_variable_name="http_response"){
        if(url_or_options === undefined){
            dde_error("Control.get_page called with no <b>url_or_options</b> argument<br/>" +
                      "which is typically the string of a url.")
        }
        return new Instruction.Get_page(url_or_options, response_variable_name)
    }
    //static play(note_or_phrase){
    //    return new Instruction.play_notes(note_or_phrase)
    //}
    close_robot(){ //overridden in Serial and Dexter
    }

    static save_picture({canvas_id_or_mat="canvas_id",
                         path="my_pic.png"}={}) {
        return new Instruction.save_picture({canvas_id_or_mat: canvas_id_or_mat,
                                             path: path})
    }

    static show_picture({canvas_id="canvas_id", //string of a canvas_id or canvasId dom elt
                            content=null, //mat or file_path
                            title=undefined,
                            x=200, y=40, width=320, height=240,
                            rect_to_draw=null}={}) {
        return new Instruction.show_picture({canvas_id: canvas_id, //string of a canvas_id or canvas dom elt
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
                        play=true,
                        visible=true}={}) {
        return new Instruction.show_video({video_id: video_id, //string of a video_id or video dom elt
                                                    content: content, //mat or file_path
                                                    title: title,
                                                    x: x,
                                                    y: y,
                                                    width: width,
                                                    height: height,
                                                    play: play,
                                                    visible: visible})
    }
    static take_picture({video_id="video_id", //string of a video_id or video dom elt
                         camera_id=undefined,
                         width=320, height=240,
                         callback=Picture.show_picture_of_mat}={}) {
        return new Instruction.take_picture({video_id: video_id, //string of a video_id or video dom elt
                                             camera_id: camera_id,
                                             width: width,
                                             height: height,
                                             callback: callback})
    }
}
globalThis.Robot = Robot
Robot.all_names = []

Robot.robot_status_labels = [] //overridden by Serial and Dexter, needed by Show robot status history button

/*simulate vs non-simulate makes no difference so set simulate to false */
class Brain extends Robot { /*no associated hardware */
    constructor({name = "b1"}={}){
        super(arguments[0])
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
        var reason = "An instruction intended for a physical robot: " + inst_array_with_inst_id + "<br/>was sent to a Robot.Brain: " + this.name + ",<br/> which has no physical robot."
        job_instance.stop_for_reason("errored", reason)
        out(reason, "red")
        throw new Error("send called on Robot.Brain, which has no physical robot.")
    }

    static eval_python(python_source, user_data_variable="python_value"){
        return [
            function() {
              let the_job = this
              the_job.user_data[user_data_variable + "_python_source"] = python_source
              Py.eval(python_source,
                function(json_obj){
                    the_job.user_data[user_data_variable] = json_obj.result
                })
            },
            Control.wait_until(function() {
                      //out("this.user_data." + user_data_variable = ": " + this.user_data.[user_data_variable])
                      return this.user_data[user_data_variable] !== undefined})
            ]
    }
}

globalThis.Brain = Brain

Brain.all_names = []

class Human extends Brain { /*no associated hardware */
    constructor({name = "h1"}={}){
        super(arguments[0])
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
    /*
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
        return new Instruction.human_recognize_speech(args)
    }*/

    static speak ({speak_data = "hello", volume = 1.0, rate = 1.0, pitch = 1.0,
                     lang = "en_US", voice = 0, wait = true} = {}){ //does not have calLback on purpose
        if (arguments[0].length > 0){ speak_data = arguments[0] }
        let args = {speak_data: speak_data, volume: volume, rate: rate, pitch: pitch,
                    lang: lang, voice: voice, wait: wait}
        return new Instruction.human_speak(args)
    }


    static task({task = "", dependent_job_names=[],
                 title, x=200, y=200, width=400, height=400,
                 background_color = "rgb(238, 238, 238)",
                 add_stop_button=true} = {}){
        return new Instruction.human_task(arguments[0])
    }

    static enter_choice({
        task = "",
        choices=[["Yes", true], ["No", false]],
        show_choices_as_buttons=false,
        one_button_per_line=false,
        user_data_variable_name="a_choice",
        dependent_job_names=[],
        add_stop_button=true,
        title,
        x=200, y=200, width=400, height=400,
        background_color = "rgb(238, 238, 238)"} = {}){
        return new Instruction.human_enter_choice(arguments[0])
    }

    static enter_filepath({task = "",
                           user_data_variable_name="a_filepath",
                           initial_value="",
                           add_stop_button = true,
                           dependent_job_names=[],
                           title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"} = {}){
        return new Instruction.human_enter_filepath(arguments[0])
    }

    static enter_instruction({task = "Enter a next instruction for this Job.",
        instruction_type = "Dexter.move_all_joints",
        instruction_args = "5000, 5000, 5000, 5000, 5000",
        add_stop_button=true,
        dependent_job_names = [],
        title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"}={}){
        return new Instruction.human_enter_instruction(arguments[0])
    }

    static enter_number({task="",
        user_data_variable_name="a_number",
        initial_value=0,
        min=0,
        max=100,
        step=1,
        add_stop_button = true,
        dependent_job_names=[],
        title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"}={}) {
        return new Instruction.human_enter_number(arguments[0])
    }

    static enter_position({task="Position Dexter&apos;s end effector<br/>to the position that you want to record,<br/>and click <b>Continue Job</b>.",
                           user_data_variable_name="a_position",
                           add_stop_button = true,
                           dependent_job_names=[],
                           title, x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"}={}) {
        return[Dexter.empty_instruction_queue,
               Dexter.set_follow_me,
               new Instruction.human_enter_position(arguments[0])
              ]
    }

    static enter_text({task="",
        user_data_variable_name="a_text",
        add_stop_button = true,
        initial_value="OK",
        line_count=1, //if 1, makes an input type=text. If > 1 makes a resizeable text area.
        dependent_job_names=[],
        title,
        close_same_titled_windows = false,
        x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"}={}){
        return new Instruction.human_enter_text(arguments[0])
    }

    static notify({task="",
        window=true,
        output_pane=true,
        beep_count=0,
        speak=false,
        add_stop_button=true,
        dependent_job_names=[],
        title,
        close_same_titled_windows = false,
        x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"
    }={}){
        return new Instruction.human_notify(arguments[0])
    }
    static show_window({content=`<input type="submit" value="Done"/>`,
                        title="DDE Information",
                        x=200, y=200, width=400, height=400,
                        background_color = "rgb(238, 238, 238)",
                        is_modal = false,
                        show_close_button = true,
                        show_collapse_button = true,
                        trim_strings = true,
                        add_stop_button=true,
                        callback = show_window_values,
                        user_data_variable_name="show_window_vals",
                        dependent_job_names=[]
    }={}){
        return new Instruction.human_show_window({
            content: content,
            title: title,
            x: x, y: y, width: width, height: height,
            background_color:        background_color,
            is_modal:                is_modal,
            show_close_button:       show_close_button,
            show_collapse_button:    show_collapse_button,
            trim_strings:            trim_strings,
            add_stop_button:         add_stop_button,
            callback:                callback,
            user_data_variable_name: user_data_variable_name,
            dependent_job_names:     dependent_job_names
    })
    }
}
globalThis.Human = Human

Human.all_names = []

class Serial extends Robot {
    constructor({name = "s1", simulate = null, //get sim val from Jobs menu item check box.
                 sim_fun = Utils.return_first_arg, path = "required", connect_options={},
                 capture_n_items = 1, item_delimiter="\n", trim_whitespace=true,
                 parse_items = true, capture_extras = "error", /*"ignore", "capture", "error"*/
                 instruction_callback = Job.prototype.set_up_next_do }={}){
        super(arguments[0])
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
                            "<br/>so that's being used instead of a new Robot.Serial instance.<br/>" +
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
        if (!Utils.similar(rob1.connect_options, rob2.connect_options))  { return false }
        if (rob1.capture_n_items != rob2.capture_n_items)  { return false }
        if (rob1.item_delimiter  != rob2.item_delimiter)   { return false }
        if (rob1.trim_whitespace != rob2.trim_whitespace)  { return false }
        if (rob1.parse_items     != rob2.parse_items)      { return false }
        if (rob1.capture_extras  != rob2.capture_extras)   { return false }
        if (!Utils.similar(rob1.instruction_callback, rob2.instruction_callback)) { return false }
        if (!Utils.similar(rob1.sim_fun, rob2.sim_fun))            { return false }
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
            //unlike the other set_a_robot_instance_socket_id methods, we must pass job_instance
            //as a 2nd arg.
            Serial.set_a_robot_instance_socket_id(this.path, job_instance) //we don't now actually use socket_id outside of serial.js
        }
        else {
            serial_connect(this.path, this.connect_options, this.simulate, this.capture_n_items, this.item_delimiter, this.trim_whitespace, this.parse_items, this.capture_extras, job_instance)
        }
    }

    init(job_instance){
            this.connecting = true
            serial_connect(this.path, this.connect_options, this.simulate, this.capture_n_items, this.item_delimiter, this.trim_whitespace, this.parse_items, this.capture_extras, job_instance)
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

    ///called from Serial.start
    static set_a_robot_instance_socket_id(path, job_instance){ //do I really need the socket_id of a serial?
        let rob          = Serial.get_robot_with_path(path)
        //rob.socket_id    = socket_id
        rob.connecting   = false //connection and is_connected will never both be true
        rob.is_connected = true
        out("Connected to serial port at: " + rob.path, undefined, true)
        //let job_instance = Serial.get_job_with_robot_path(path) //beware, this means only 1 job can use this robot!
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
            this.init(job_instance)
            job_instance.set_up_next_do(0)
        }
        else if (this.is_connected) { // || (sim_actual === true) || (sim_actual === "both"))  {
            job_instance.wait_until_instruction_id_has_run = job_instance.program_counter //we don't want to continue the job until this instr is done.
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
                              "Serial.robot_done_with_instruction received a robot_status array: " +
                               robot_status + " that is not an array.")
            if (job_instance.wait_until_instruction_id_has_run === ins_id){ //we've done it!
                job_instance.wait_until_instruction_id_has_run = null //but don't increment PC
            }
            rob.perform_instruction_callback(job_instance)
            return
        }
        else if (robot_status.length < Serial.DATA0){
            job_instance.stop_for_reason("errored",
                "Serial.robot_done_with_instruction received a robot_status array: " +
                robot_status + "<br/> of length: " + robot_status.length +
                " that is less than the : " + (Serial.DATA0 - 1) + " required.<br/>" + Utils.stringify_value(robot_status))
            if (job_instance.wait_until_instruction_id_has_run === ins_id){ //we've done it!
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
                if (job_instance.wait_until_instruction_id_has_run === ins_id){ //we've done it!
                    job_instance.wait_until_instruction_id_has_run = null //but don't increment PC
                }
                rob.perform_instruction_callback(job_instance) //job_instance.set_up_next_do()
            }
            else { //the normal, no error, not initial case
                if (job_instance.wait_until_instruction_id_has_run === ins_id){ //we've done it!
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
globalThis.Serial = Serial
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
    return new Instruction.Serial.string_instruction(instruction_string, this)
}

/*anticipate classes for Dexter2, etc.
//the pose matrix includes info on position and orientation
* */
class Dexter extends Robot {
    constructor({name = null,
                 simulate = null,
                 ip_address = null,
                 port = null,
                 pose = Vector.identity_matrix(4),
                 enable_heartbeat=true,
                 instruction_callback = Job.prototype.set_up_next_do}={}){
        for(let key in arguments[0]){
            if(!["name", "simulate", "ip_address", "port", "pose", "enable_heartbeat", "instruction_callback"].includes(key)){
                dde_error("Attempt to create a Dexter with an invalid argument of: " + key +
                          "<br/>Click on 'Dexter' to see its valid argument names.")
            }
        }
        if(!name) {
            name = Dexter.generate_default_name()
        }
        if((name.length == 1) && (name >= "A") && (name <= "Z")){
           dde_error("While construction a Dexter robot named: " + name +
                     "<br/>Sorry, you can't name a Dexter with a single upper case letter.")
        }
        if(!ip_address) { ip_address = DDE_DB.persistent_get("default_dexter_ip_address") }
        if(!port)       { port       = DDE_DB.persistent_get("default_dexter_port") }

        let keyword_args = {name: name,
                            simulate: simulate,
                            ip_address: ip_address,
                            port: port,
                            pose: pose,
                            enable_heartbeat: enable_heartbeat,
                            instruction_callback: instruction_callback }
        let old_same_named_robot = Robot[name]
        if (old_same_named_robot){
           if ((old_same_named_robot.ip_address === ip_address) &&
               (old_same_named_robot.port       === port)){
               if (old_same_named_robot.active_jobs_using_this_robot().length > 0){
                    warning("There's already a robot with the name: " + name +
                             ", with same ip_address and port that has active jobs " +
                             " so that's being used instead of a new Dexter instance.")
                    return old_same_named_robot
               }
               else {
                   old_same_named_robot.close_robot()
                   super(keyword_args //arguments[0]
                   )
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
                   super(keyword_args //arguments[0]
                   )
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
                    super(keyword_args //arguments[0]
                     )
                    return this.make_new_robot(keyword_args)
                }
            }
            else {//different name, unused ip_address and port
                super(arguments[0])
                return this.make_new_robot(keyword_args)
            }
        }
    }

    static generate_default_name(){
        for(let i = 1; i < 1000000; i++) {
           let candidate_name = "dexter" + i
           if(!Dexter[candidate_name]) {
                return candidate_name
           }
        }
        dde_error("When making an instance of Dexter,<br/>the first million default names are used.<br/> Probably something wrong.")
    }

    static class_init(){  //inits Dexter class as a whole. called by ready
        this.dexter_default_params =
            {name: "dex1",
             simulate: null,
             ip_address: null,
             port: null,
             pose: Vector.identity_matrix(4),
             enable_heartbeat: true,
             instruction_callback: Job.prototype.set_up_next_do
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
        //this.processing_flush = false //primarily used as a check. a_robot.send shouldn't get called while this var is true
        this.busy_job_array = []
        Robot.set_robot_name(this.name, this)
         //ensures the last name on the list is the latest with no redundancy
        let i = Dexter.all_names.indexOf(this.name)
        if (i != -1) {  Dexter.all_names.splice(i, 1) }
        Dexter.all_names.push(this.name)
        Dexter.last_robot = this
        return this
    }

    start(job_instance){
        //out("top of Dexter.start() for "+ job_instance.name)
        //let sim_actual = Robot.get_simulate_actual(this.simulate)
        //let this_robot = this
        //let this_job   = job_instance
        //if ([false, "both"].includes(sim_actual)){ //runnig in "real" not simulated.
              /*let ping = require('ping') //https://www.npmjs.com/package/ping
                ping.sys.probe(this.ip_address,
                                function(isAlive, err){
                                    if (isAlive) {
                                        if(job_instance.name == "set_link_lengths") { //don't attempt to set link lengths again!
                                            this_robot.start_aux(job_instance)
                                        }
                                        else { setTimeout(function(){
                                                            this_robot.set_link_lengths(this_job)
                                                          },
                                                          500)} //in case dexster is booting up, give it a chance to complete boot cycle
                                        //this_robot.use_ping_proxy(job_instance)
                                    }
                                    else if (err){
                                        this_job.stop_for_reason("errored_from_dexter_connect", "Ping on robot: " + this_robot.name + " errored with: " + err.message)
                                    }
                                    else {
                                        this_job.stop_for_reason("errored_from_dexter_connect", "Could not connect to Dexter.\nIf it is because Dexter is initializing,\ntry again in a minute,\nor click Misc pane 'simulate' button.", true)
                                        //3rd arg is true so that we will run the stop method for dex_read_file job,
                                        //so that this error of "not connected" will reset the orig editor files menu item.
                                    }
                                },
                               {timeout: 10}
                               )*/
          //new strategy: just let the socket interface test Dexter connectivity because ping fails on Linux
          //run same code for sim and real
        if(job_instance.name === "set_link_lengths") { //don't attempt to set link lengths again!
            this.start_aux(job_instance)
        }
        else {
            this.set_link_lengths(job_instance) //eventually calls start_aux
        }
        /*}
        else { //running in simulation
            if(job_instance.name == "set_link_lengths") { //don't attempt to set link lengths again!
                this_robot.start_aux(job_instance)
            }
            else {
                this_robot.set_link_lengths(this_job)
            }
        } //no actual connection to Dexter needed as we're only simulating, BUT
                                 //to keep similation as much like non-sim. due the same timeout.
       */
    }

    start_aux(job_instance) { //fill in initial robot_status
        //out("top of Dexter.start_aux() for "+ job_instance.name)
        //this.processing_flush = false
        let this_robot = this
        let this_job   = job_instance
        //give it a bit of time in case its in the process of initializing
        /*let connect_success_cb = function(){ //give robot a chance to get its socket before doing the initial "g" send.
                        const sim_actual = Robot.get_simulate_actual(this_robot.simulate)
                        if(!this_robot.is_initialized()){ //bad. stop the job
                            if (this_robot.simulate === true){
                                this_job.stop_for_reason("errored_from_dexter_connect", "The job: " + this_job.name + " is using robot: " + this_robot.name +
                                    "<br/>\nwith simulate=true, but could not connect with the Dexter simulator.")
                            }
                            else if ((this_robot.simulate === false) || (this_robot.simulate === "both")){
                                this_job.stop_for_reason("errored_from_dexter_connect", "The job: " + this_job.name + " is using robot: " + this_robot.name +
                                "<br/>but could not connect with a Dexter robot at: " +
                                this_robot.ip_address + " port: " + this_robot.port +
                                "<br/>You can change this robot to <code>simulate=true</code> and run it.")
                            }
                            else if (this_robot.simulate === null){
                                if ((sim_actual === false) || (sim_actual === "both")){
                                    this_job.stop_for_reason("errored_from_dexter_connect", "The job: " + this_job.name + " is using robot: " + this_robot.name +
                                    '<br/>with the Misc Pane "Simulate?" radio button being: ' + sim_actual  +
                                    "<br/>but could not connect with Dexter." +
                                    "<br/>You can use the simulator by clicking 'simulate' in the Misc Pane header. ")
                                    out("Could not connect to Dexter.", "red")
                                }
                                else {
                                    this_job.stop_for_reason("errored_from_dexter_connect", "The job: " + this_job.name + " is using robot: " + this_robot.name +
                                              "<br/>\nwith a Jobs menu, 'Simulate?' value of 'true', " +
                                              "<br/>\nbut could not connect with the Dexter simulator.")
                                }
                            }
                            else {
                                shouldnt("Dexter.start got invalid simulate value of: " + this_robot.simulate +
                                         '.<br/>\nThe value values are: true, false, "both" and null.')
                            }

                        }
                        else { //good. normal case
                            //this_job.send(Dexter.get_robot_status(), this_robot)
                        } //the initial g stareting off the job
        }*/
        /* not needed if pass job_instance into Socket.init
             let connect_error_cb = function(){
             this_job.stop_for_reason("errored_from_dexter_connect",
                 "The job: " + this_job.name + " could not connect to Dexter." + this_robot.name)
        }
        this_robot.connect_error_cb = connect_error_cb*/
        let instruction_to_send_on_connect = Dexter.get_robot_status() //the inital g instr
        Socket.init(this.name, job_instance, instruction_to_send_on_connect)
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

    //return true if it is, false if it isn't and null if can't tell
    is_calibrated(){
        let sim_actual = Robot.get_simulate_actual(this.simulate)
        if(sim_actual === true) { return true } //simulation is always calibrated
        else if(this.rs === undefined) { return null } //calibration unknown
        else if (this.rs.supports_measured_angles()) {
                for(let j_deg of this.rs.measured_angles()){ //gets joint angles 1 through 5
                    if(j_deg != 0) { return true } //is calibrated
                }
                return false //not calibrated, ie all joint angles are 0
        }
        else { return null }
    }

    //returns null if don't know (because no job yet run,
    //otherwise gets the latest robot status run on this dexter,
    //and sees if its pointing down and returns true or false.
    //so null (don't know) is presumed to be false,
    //which is good for Dexter UI's call to this fn.
    /*is_pointing_down(){
        if(!this.rs) { return null }
        let measured_angles = this.rs.measured_angles(7)
        let angles_to_make_dexter_point_down = Kin.point_down(measured_angles)
        for(let j = 0; j < 5; j++){
            if(measured_angles[j] !== angles_to_make_dexter_point_down[j]){
                return false
            }
        }
        return true
    }*/

    //returns null if don't know (because no job yet run,
    //otherwise gets the latest robot status run on this dexter,
    //and sees if its pointing in "direction" and returns true or false.
    is_direction(direction=[0, 0, -1], //pointing down
                 tolerance_in_deg=0.01){
        if(!this.rs) { return null } //meaning we don't know what direction its pointing
        else { return Kin.is_direction(this.rs.measured_angles(5)) }
    }

    //______phui_button processing
    is_phui_button_down(){
        if(!this.robot_status) { return false }
        else {
            return ((this.robot_status[Dexter.END_EFFECTOR_IO_IN] & 1) === 1)
        }
    }

    /* changed to an instance variable on Dexter instances, may 18, 2021
    waiting_for_flush_ack(){
        let rob = this
        let instr = rob.instruction_to_send_on_connect
        if(instr) {
            if(Array.isArray(instr)){
                if(instr[Instruction.INSTRUCTION_TYPE] === "F"){
                    return true }
                else { return false }
            }
            else if (typeof(instr) === "string") { //we have a string, pull the "F" out of the string.
               let str_parts = instr.split(" ")
               let oplet = str_parts[4]
               if(oplet.startsWith("F")) { //might have a semicolon in the oplet.
                    return true
               }
               else { return false }
            }
            else { return false }
        }
        else { return false }
    }*/

    set_robot_status(robot_status) {
        let old_robot_status_button_down = this.is_phui_button_down() //do this first before setting robot_status
        this.robot_status = robot_status //thus rob.robot_status always has the latest rs we got from Dexter.
        if(window.platform == "dde"){
            if(this.rs) { this.rs.robot_status = robot_status }
            else {
                this.rs = new RobotStatus({robot_status: robot_status})
            }
        }
        let new_robot_status_button_down = this.is_phui_button_down() //tricky. Not the same as 2 lines up!
        if((!old_robot_status_button_down) &&
            new_robot_status_button_down) {
            this.time_of_last_phui_button_click_ms = Date.now()
        }
    }
    clear_time_of_last_phui_button_click_ms(){
        this.time_of_last_phui_button_click_ms = null
    }

    /*candidate names:
    //phui_button_clicked
    //was_phui_button_clicked
    //was_phui_button_down
    //phui_button_clicked_but_not_processed
    This is the main fn called by job authors.
    It returns true if the phui button was pressed down since the
    last time this fn was called. THUS its an async input,
    so that the job author doesn't "miss" calling is_phui_button_down
    by not calling it at exactly the right time.
    */
    was_phui_button_down(){
        if(this.time_of_last_phui_button_click_ms) {
            this.clear_time_of_last_phui_button_click_ms()
            return true
        }
        else { return false }
    }
    seconds_since_phui_button_clicked(){
        if(!this.time_of_last_phui_button_click_ms) {
            return null
        }
        else {
            return (Date.now() - this.time_of_last_phui_button_click_ms) / 1000
        }
    }
    //end phui button processing

    run_heartbeat(){
        let this_dex = this
        this.heartbeat_timeout_obj =
          setTimeout(function(){
            if (this_dex.finish_job()) {//If this returns true, that means no more jobs active on this robot, so don't continue the heartbeat.
                                        //If there are more jobs, finish_job does nothing except return false
            }
            else if (this_dex.waiting_for_heartbeat){ //stop recursive timeout
                out("Dexter " + this_dex.name + " did not receive a response to the heartbeat. Stopping Job.")
                //this_dex.is_connected      = false //should be done by stop_for_reaason and next item
                //this_dex.socket_id         = null  //should be done by stop_for_reaason and next item
                for (let job_instance of this.active_jobs_using_this_robot()){
                    job_instance.stop_for_reason("errored_from_dexter", "No heartbeat response from dexter hardware.")
                    job_instance.do_next_item()
                }
            }
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
        //out("top of Dexter.close_robot")
        //setTimeout(function(){
        //out("top of timeout fn Dexter.close_robot")
        clearTimeout(this.heartbeat_timeout_obj) //looks like not working
        this.waiting_for_heartbeat = false
        this.heartbeat_timeout_obj = null
        this.is_connected          = false
        Socket.close(this.name, false) //must be before setting socket_id to null
        // delete Dexter[this.name] //don't do this. If the robot is still part of a Job,
        //and that job is inactive, then we can still "restart" the job,
        //and as such we want that binding of Robot.this_name to still be around.
        //}, 5000)
    }

    /* causes DexRun to crash. re-inswtate when FPGA code rewriten to support this
    empty_instruction_queue_now(){
        Socket.empty_instruction_queue_now(this.name)
    }*/

    //ins_array can be an oplet array or a raw string
    send(oplet_array_or_string){
        //var is_heartbeat = ins_array[Instruction.INSTRUCTION_TYPE] == "h"
        //let oplet = Instruction.extract_instruction_type(oplet_array_or_string)
        /*if (oplet === "F") { this.processing_flush = true } //ok even if flush is already true. We can send 2 flushes in a row if we like, that's ok. essentially only 1 matters
        if (this.processing_flush && (oplet !== "F")) {
            shouldnt(this.name + ".send called with oplet: " + oplet +
                     ", but " + this.name + ".processing_flush is true so send shouldn't have been called.")
        }*/
        //note: we send F instructions through the below.
        Socket.send(this.name, oplet_array_or_string)
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
        rob.is_connected = true
        //out("bottom of set_a_robot_instance_socket_id with rob.name: " + rob.name + " rob.is_connected: " + rob.is_connected)
    }

    //is_initialized(){ return ((this.socket_id || (this.socket_id === 0)) ? true : false ) }

    is_initialized(){
        //out("is_initialized() returning: " + this.is_connected)
       return this.is_connected
    }

    //Class: Dexter
    //beware, robot_status could be an ack, can could be called by sim or real
    //but if sim is "both", will only be called by real (from socket)
    robot_done_with_instruction(robot_status){ //called from UI sockets
        let job_id       = robot_status[Dexter.JOB_ID]
        let job_instance = Job.job_id_to_job_instance(job_id)
        let ins_id       = robot_status[Dexter.INSTRUCTION_ID] //-1 means the initiating status get, before the first od_list instruction
        let oplet        = robot_status[Dexter.INSTRUCTION_TYPE]
        let error_code   = robot_status[Dexter.ERROR_CODE]
        let rob          = this //job_instance.robot
        if(oplet === "F") {
            rob.waiting_for_flush_ack = false
        }
        if (!(Array.isArray(robot_status))) { //note: we have to error here because we can't get the job
            //so we can't call stop_for_reason
            job_instance.stop_for_reason("errored_from_dexter",
                                 "Dexter.robot_done_with_instruction received a robot_status array: " +
                                  robot_status + " that is not an array.")
            job_instance.wait_until_instruction_id_has_run = null
            job_instance.set_up_next_do(0)
            return
        }
        //rob.robot_status = robot_status //beware, is possibly the wrong length, but if so we're going to error, so might as well have that bad robot_status accessible for debugging
        rob.set_robot_status(robot_status) //makes RobotStatus updated too
        if (job_instance == null){
            shouldnt("In robot_done_with_instruction, got job_id: " + job_id +
                     " which does not refer to a valid Job instance.<br/>" +
                     "robot_status: " + robot_status)
        }
        else if (robot_status.length < Dexter.robot_status_labels.length){ //allows when_stopped action to run if any
            //if its longer than 60, ie 120, then we got 2 robot status's back.
            //just use the first 60 from the array.
            job_instance.condition_when_stopped = "errored_from_dexter"
            job_instance.stop_for_reason("errored_from_dexter",
                "Dexter.robot_done_with_instruction received a robot_status array: " +
                robot_status + "<br/> of length: " + robot_status.length +
                " that is not the proper length of: " + Dexter.robot_status_labels.length)
            job_instance.wait_until_instruction_id_has_run = null
            job_instance.set_up_next_do(0)
            return
        }
        else if (job_instance.wait_until_instruction_id_has_run !== ins_id){
            job_instance.stop_for_reason("errored_from_dexter",
                "Dexter.robot_done_with_instruction received a robot_status array with an instruction_id of: " + ins_id +
                "<br/> but expected: " + job_instance.wait_until_instruction_id_has_run)
            job_instance.wait_until_instruction_id_has_run = null
            job_instance.set_up_next_do(0)
            return
        }
        else if((error_code !== 0) && (oplet !== "r")){ //we've got an error
                //job_instance.stop_for_reason("errored", "Robot status got error: " + error_code)
            job_instance.wait_until_instruction_id_has_run = null //but don't increment PC
            let instruction_to_run_when_error = job_instance.if_robot_status_error //.call(job_instance, robot_status)
            if(instruction_to_run_when_error){
                //note instruction_to_run_when_error can be a single instruction or an array
                //of instructions. If its an array, we insert it as just one instruction,
                //and that will cause all to be run.
                job_instance.insert_single_instruction(instruction_to_run_when_error)
            }
            rob.perform_instruction_callback(job_instance) //job_instance.set_up_next_do()
            return
        }

        job_instance.wait_until_instruction_id_has_run = null
        let busy_job_array_copy = rob.busy_job_array.slice()
        rob.clear_busy_job_array() //so that the other jobs that I call set_up_next_do, won't hang up because they are busy,
         //because they no longer should be busy, because we got back our ack from Dexter that was keeping them busy,
        for(let busy_job of busy_job_array_copy){
            if(busy_job === job_instance) {} //let this pass through to the below as the passed in robot_status is from this instrr and this job_instance
            else {
               busy_job.set_up_next_do(0) //now execute the instr at the PC in an OTHER job, without advancing it.
               return
            }
        }
        if ((error_code !== 0) && (oplet === "r")){ //we have an error but its "file not found" handled specially
             //Dexter.read_file errored, assuming its "file not found" so end the rfr loop and set the "content read" as null, meaning file not found
                //the below setting of the user data already done by got_content_hunk
                //let rfr_instance = Instruction.Dexter.read_file.find_read_file_instance_on_do_list(job_instance, ins_id)
                // job_instance.user_data[ins.destination] = null //usually means "file not found"
                //rfr_instance.is_done = true
                this.perform_instruction_callback(job_instance) //calls set_up_next_do(1) but we want 0, because we want to give the Dexter.read_file instance code a chance to clean up before ending its loop
                //job_instance.set_up_next_do(0)
                return
        }
        if (oplet === "h") { //we got heartbeat acknowledgement of reciept by phys or sim so now no longer waiting for that acknowledgement
            rob.waiting_for_heartbeat = false
            return
        }
        let stop_time    = Date.now() //the DDE stop time for the instruction, NOT Dexter's stop time for the rs.
        job_instance.record_sent_instruction_stop_time(ins_id, stop_time)
       // if (!rob.is_connected) {} //ignore any residual stuff coming back from dexter
        //we don't want to change robot_status for instance because that will confuse
        //debugging in the case that we've had an error and want to close.
        //on the other hand, we want accurate info. Hmm, maybe the "residual" is
        //only comming for simulation and not from read dexter.
        //else if (ins_id == -1) {}
     // else {
        if (job_instance.keep_history && (oplet == "g")){ //don't do it for oplet "G", get_robot_status_immediate
                job_instance.rs_history.push(robot_status)
        }
        if(window.platform === "dde"){
            RobotStatusDialog.update_robot_status_table_maybe(rob) //if the dialog isn't up, this does nothing
        }

        if (job_instance.status_code === "starting") { //at least usually ins_id is -1
            job_instance.set_status_code("running")
            //pass robot_status because we *might* not be keeping it in the history
            //rob.perform_instruction_callback(job_instance)
            //if(job_instance.dont_proceed_after_initial_g) {//used by MakeInstruction
            //    MiRecord.start_is_done_with_initial_g_and_paused(job_instance)
            //}
            job_instance.set_up_next_do(0)//we've just done the initial g instr, so now do the first real instr. PC is already pointing at it, so don't increment it.
        }
        else if ((job_instance.status_code === "stopping") && (oplet === "F")){
            job_instance.stop_for_reason("interrupted", "Completed Dexter.empty_instruction_queue after user stopped the Job.")
            rob.perform_instruction_callback(job_instance)
        }
        else if (ins_id == job_instance.program_counter) { //the normal case.
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

    //Dexter busy
    clean_up_busy_job_array(){
       let result = []
       for(let a_job of this.busy_job_array){
            if(a_job.is_active()) { //remove inactive jobs from busy_job_array by preserviong the still active ones
                if(!result.includes(a_job)) { //remove duplicates
                    result.push(a_job)
                }
            }
       }
       this.busy_job_array = result
    }

    //returns true or false
    is_busy(){
        this.clean_up_busy_job_array()
        return (this.busy_job_array.length > 0)
    }

    add_to_busy_job_array(a_job){
        if(!this.busy_job_array.includes(a_job)){
            this.busy_job_array.push(a_job)
        }
    }

    remove_from_busy_job_array(a_job){
        let i = this.busy_job_array.indexOf(a_job)
        if(i >= 0) { this.busy_job_array.splice(i, 1) }
    }

    //called when a job is finished. Note that we might have a
    //job that has, say a brain default robot but has instructions that are sent to a Dexter,
    //and Job.send still adds its Job to the busy_job_array of a Dexter,
    //so we better remove it from all Dexters' busy_job_array
    static remove_from_busy_job_arrays(a_job) {
        for(let dex_name of Dexter.all_names){
            let dex = Dexter[dex_name]
            dex.remove_from_busy_job_array(a_job)
        }
    }

    clear_busy_job_array(){
        this.busy_job_array = []
    }
    //end robot_busy

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
        let is_home_angles = Utils.similar(angle_array, Dexter.HOME_ANGLES)
        let do_list = []
        if(set_default_speed_first) { do_list.push(make_ins("S", "MaxSpeed", 25)) }
        do_list.push(Dexter.move_all_joints(angle_array))
        if(is_home_angles) {
            do_list.push(Dexter.pid_move_all_joints([0, 0, 0, 0, 0])) //only do 5 joints here. let the angle_array's version of j6 and j7 dictate their movvement.
            do_list.push(Dexter.empty_instruction_queue())
        }
        new Job({name: "job_00", robot: this,
                 do_list: do_list}).start()
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
                               when_do_list_done: "wait"})
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
globalThis.Dexter = Dexter

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

//Dexter.make_ins = make_ins //now inited by on_ready
Dexter.capture_ad               = function(...args){ return make_ins("c", ...args) }
Dexter.prototype.capture_ad     = function(...args){ args.push(this); return Dexter.capture_ad(...args) }

Dexter.capture_points           = function(...args){ return make_ins("i", ...args) }
Dexter.prototype.capture_points = function(...args){ args.push(this); return Dexter.capture_points(...args) }

Dexter.cause_error              = function(error_code=1){ return make_ins("e", error_code) } //fry made up. useful for testing
Dexter.prototype.cause_error    = function(error_code=1){ return make_ins("e", error_code, this) }

Dexter.draw_dxf   //set to DXF.dxf_to_instructions in ready.js
Dexter.prototype.draw_dxf //set in ready.js

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

Dexter.prototype.dummy_move = function(){
    let robot = this
    let CMD = []
    CMD.push(function(){return robot.get_robot_status()})
    CMD.push(function(){
        let rs = robot.robot_status //Dexter.my_dex.robot_status
        let J_angles = [rs[Dexter.J1_MEASURED_ANGLE], rs[Dexter.J2_MEASURED_ANGLE], rs[Dexter.J3_MEASURED_ANGLE], rs[Dexter.J4_MEASURED_ANGLE], rs[Dexter.J5_MEASURED_ANGLE]]
        return robot.move_all_joints(J_angles)
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

Dexter.dma_read           = function(...args){ return make_ins("d", ...args) }
Dexter.prototype.dma_read = function(...args){ args.push(this); return Dexter.dma_read(...args) }

Dexter.dma_write           = function(...args){ return make_ins("t", ...args) }
Dexter.prototype.dma_write = function(...args){ args.push(this); return Dexter.dma_write(...args) }

Dexter.exit           = function(...args){ return make_ins("x", ...args) }
Dexter.prototype.exit = function(...args){ args.push(this); return Dexter.exit(...args) }


Dexter.empty_instruction_queue_immediately = function(){
        //return make_ins("E")
        let num = Instruction.w_address_name_to_number("RESET_PID_AND_FLUSH_QUEUE")
        if(num >= 0) {
            return [ Dexter.write_fpga(num, 1), //this flushes the queue
                     Dexter.write_fpga(num, 0)  //this resets the ode to normal so Dexter can accept new instructions
                   ]
        }
        else {
            shouldnt("Dexter.empty_instruction_queue_immediately could not find w name: RESET_PID_AND_FLUSH_QUEUE.")
        }
}
Dexter.prototype.empty_instruction_queue_immediately = function(...args){ args.push(this); return Dexter.empty_instruction_queue_immediately(...args) }

Dexter.empty_instruction_queue           = function() { return make_ins("F") }
Dexter.prototype.empty_instruction_queue = function(...args){ args.push(this); return Dexter.empty_instruction_queue(...args) }

Dexter.find_index           = function(...args){ return make_ins("n", ...args) }
Dexter.prototype.find_index = function(...args){ args.push(this); return Dexter.find_index(...args) }


//dec 6, 2020: this gives us backwards compatibility of
//Dexter.get_robot_status()
//Dexter.get_robot_status(rob)
//and also allows for
//Dexter.get_robot_status(1)
//Dexter.get_robot_status(rob)
//Dexter.get_robot_status(1, rob)
//Dexter.get_robot_status(null, rob)
Dexter.get_robot_status = function(status_mode = null){
                                if(typeof(status_mode) === "number") {
                                    return make_ins("g", status_mode)
                                }
                                else if((status_mode === null) || (status_mode === undefined)) {
                                    return make_ins("g")
                                }
                                else {
                                    dde_error("Dexter.get_robot_status called with invalid status mode: " +
                                               status_mode +
                                               "<br/>The valid status_modes are null or non-negative integers, usually 0 or 1.")
                                }
}

//must be different from Dexter.get_robot_status. See commment in Instruction.Dexter.get_robot_statu
Dexter.prototype.get_robot_status = function(status_mode = null){
                                        if((typeof(status_mode) != "number") &&
                                            (status_mode !== null)){
                                            dde_error("Dexter.get_robot_status called with invalid status mode: " +
                                                       status_mode +
                                                       "<br/>The valid status_modes are null or non-negative integers, usually 0 or 1.")
                                        }
                                        else {
                                            return new Instruction.Dexter.get_robot_status(status_mode, this)
                                        }
}


    //this forces do_next_item to wait until robot_status is
    //updated before it runs any more do list items.
Dexter.get_robot_status_heartbeat           = function(){ return make_ins("h") }//never called by user do_list items. Only called by system
Dexter.prototype.get_robot_status_heartbeat = function(){ return Dexter.get_robot_status_heartbeat(this) }

Dexter.get_robot_status_immediately           = function(){ return make_ins("G") } //deprecated
Dexter.prototype.get_robot_status_immediately = function(){ return Dexter.get_robot_status_immediately(this) } //deprecated

//pass in an array of up to 5 elts OR up to 5 separate args.
//If an arg is not present or null, keep the value now in dexer_status unchanged.
//EXCEPT if no args passed in, set to home position.
Dexter.load_tables     = function(...args){ return make_ins("l", ...args) } //
//loads the data created from calibration onto the SD card for persistent storage.
Dexter.prototype.load_tables = function(...args){ args.push(this); return Dexter.load_tables(...args) }


Dexter.joint_to_servo_number_map = {6: 3, 7: 1}
Dexter.joint_to_servo_number = function(joint_number){
    return Dexter.joint_to_servo_number_map[joint_number]
}
Dexter.servo_to_joint_number = function(servo_number){
    for(let a_joint_number in Dexter.joint_to_servo_number_map){
       let a_servo_number = Dexter.joint_to_servo_number_map[a_joint_number]
       if(a_servo_number === servo_number) { return parseInt(a_joint_number) }
    }
    return undefined
}
//the instruction
Dexter.reboot_joints = function(joint_number_array="all"){
   let servos_to_reboot = []
   if(joint_number_array === "all") {
       joint_number_array = Object.getOwnPropertyNames(Dexter.joint_to_servo_number_map)
       for(let i = 0; i < joint_number_array.length; i++){
           joint_number_array[i] =  parseInt(joint_number_array[i])
       }
   }
   let instrs = []
   for(let joint_number of joint_number_array){
       instrs.push(
            Dexter.set_parameter("RebootServo", Dexter.joint_to_servo_number(joint_number)))
       instrs.push(Dexter.sleep(1)) //sleep for 1 sec to allow dynamixel bus to settle
   }
   return instrs
}

Dexter.prototype.reboot_joints = function(joint_number_array="all"){
    let servos_to_reboot = []
    if(joint_number_array === "all"){
        joint_number_array = Object.getOwnPropertyNames(Dexter.joint_to_servo_number_map)
        for(let i = 0; i < joint_number_array.length; i++){
            joint_number_array[i] =  parseInt(joint_number_array[i])
        }
    }
    let instrs = []
    for(let joint_number of joint_number_array){
        instrs.push(
            this.set_parameter("RebootServo", Dexter.joint_to_servo_number(joint_number)))
        instrs.push(this.sleep(1)) //sleep for 1 sec to allow dynamixel bus to settle
    }
    return instrs
}

//the function
Dexter.prototype.reboot_joints_fn = function (){
    new Job({name: "reboot_joints",
        robot: new Brain({name: "brain_reboot_joints"}),
        do_list: [
            //Dexter.set_parameter("RebootServo", 1), //reset J7 SPAN
            //Dexter.sleep(1), //give the servo time to reset.
            //Dexter.set_parameter("RebootServo", 3), //reset J6 ROLL
            //Dexter.sleep(1) //give the servo time to reset.
            this.reboot_joints()
        ]
    }).start()
}

Dexter.reboot_dexter_default_cb = function(){
    Job.reboot_dexter.stop_for_reason("completed", "Dexter done rebooting.")
    out("Dexter." + Dexter.default.name + " rebooted.")
}

//the job will "hang" on running because the make_ins instruction will
//not get a robot status back.
Dexter.prototype.reboot_dexter = function(callback=Dexter.reboot_dexter_default_cb) {
    new Job({name: "reboot_dexter",
        robot: this,
        do_list: [
            function() { setTimeout(callback, (3 * 60 * 1000)) }, //3 minutes timeout to start next job
            make_ins("r 0 ` reboot")
        ]
    }).start()
}


//Dexter.make_ins = make_ins this is below due to loading order issues

Dexter.prototype.make_ins = function(instruction_type, ...args){
    args = new Array(...args)
    args.unshift(instruction_type)
    args.push(this)
    return make_ins.apply(null, args)
}

Dexter.move_home = function(){ //move straight up
    return Dexter.move_all_joints(Dexter.HOME_ANGLES)
}
Dexter.prototype.move_home = function(){
    return this.move_all_joints(Dexter.HOME_ANGLES)
}

Dexter.check_joint_limits = false

//similar to Kin.check_J_ranges except returns string if out of range,
//and false if in range whereas Kin.check_J_ranges returns true if
//in range and false otherwise.
Dexter.joints_out_of_range = function(J_angles, dexter_inst){
    if (!Dexter.check_joint_limits) { return false }
    else {
        let lower_limit
        let upper_limit
        if(dexter_inst instanceof Dexter) {
            lower_limit = [dexter_inst.J1_angle_min, dexter_inst.J2_angle_min, dexter_inst.J3_angle_min, dexter_inst.J4_angle_min, dexter_inst.J5_angle_min]
            upper_limit = [dexter_inst.J1_angle_max, dexter_inst.J2_angle_max, dexter_inst.J3_angle_max, dexter_inst.J4_angle_max, dexter_inst.J5_angle_max]
        }
        else {
            lower_limit = [Dexter.J1_ANGLE_MIN, Dexter.J2_ANGLE_MIN, Dexter.J3_ANGLE_MIN, Dexter.J4_ANGLE_MIN, Dexter.J5_ANGLE_MIN]
            upper_limit = [Dexter.J1_ANGLE_MAX, Dexter.J2_ANGLE_MAX, Dexter.J3_ANGLE_MAX, Dexter.J4_ANGLE_MAX, Dexter.J5_ANGLE_MAX]
        }
        for(var i = 0; i < J_angles.length; i++){
            let angle = J_angles[i]
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
Dexter.convert_maj_angles = function(args_array, instruction_name=""){
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
       if (result.length > 7){
          warning("You are creating a " + instruction_name + " instruction with more than 7 angles:<br/>" +
                   args_array + "<br/>" +
                  "Usually 7 is the maximum.")
       }
       return result
}

Dexter.prototype.move_all_joints = function(...array_of_angles) {
    let array_to_use = Dexter.convert_maj_angles(array_of_angles, "move_all_joints")
    return new Instruction.Dexter.move_all_joints(array_to_use, this)
}

Dexter.move_all_joints = function(...array_of_angles){
    let robot = null
    if (last(array_of_angles) instanceof Dexter) {robot = pop(array_of_angles)}
    let array_to_use = Dexter.convert_maj_angles(array_of_angles, "move_all_joints")
    return new Instruction.Dexter.move_all_joints(array_to_use, robot)
}

//the same as move_all_joints but generates a "P" oplet

Dexter.prototype.pid_move_all_joints = function(...array_of_angles) {
    let array_to_use = Dexter.convert_maj_angles(array_of_angles, "pid_move_all_joints")
    return new Instruction.Dexter.pid_move_all_joints(array_to_use, this)
}

Dexter.pid_move_all_joints = function(...array_of_angles){
    let robot
    if (last(array_of_angles) instanceof Dexter) {robot = pop(array_of_angles)}
    let array_to_use = Dexter.convert_maj_angles(array_of_angles, "pid_move_all_joints")
    return new Instruction.Dexter.pid_move_all_joints(array_to_use, robot)
}

Dexter.prototype.move_all_joints_relative = function(...array_of_angles) {
    let array_to_use = Dexter.convert_maj_angles(array_of_angles, "move_all_joints_relative")
    return new Instruction.Dexter.move_all_joints_relative(array_to_use, this)
}
Dexter.move_all_joints_relative = function(...delta_angles){
    let robot
    if (last(delta_angles) instanceof Dexter) {robot = pop(delta_angles)}
    let array_to_use = Dexter.convert_maj_angles(delta_angles, "move_all_joints_relative")
    return new Instruction.Dexter.move_all_joints_relative(array_to_use, robot)
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

//note that a workspace_pose = null, will default to the job's default workspace_pose
Dexter.move_to = function(xyz            = [],
                          J5_direction   = [0, 0, -1],
                          config         = Dexter.RIGHT_UP_OUT,
                          workspace_pose = null,
                          j6_angle       = [0],
                          j7_angle       = [0],
                          robot
                         ){
       return new Instruction.Dexter.move_to(xyz, J5_direction, config, workspace_pose, j6_angle, j7_angle, robot)
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
    return new Instruction.Dexter.pid_move_to(xyz, J5_direction, config, workspace_pose, j6_angle, j7_angle, robot)
}

Dexter.prototype.move_to_relative = function(delta_xyz = [0, 0, 0], workspace_pose=null,
                                             j6_delta_angle = 0, j7_delta_angle = 0){
    return Dexter.move_to_relative(delta_xyz, workspace_pose, j6_delta_angle, j7_delta_angle, this)
}
Dexter.move_to_relative = function(delta_xyz = [0, 0, 0], workspace_pose=null, j6_delta_angle=0, j7_delta_angle=0, robot){
    return new Instruction.Dexter.move_to_relative(delta_xyz, workspace_pose, j6_delta_angle, j7_delta_angle,  robot)
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
    return new Instruction.Dexter.move_to_straight({xyz: xyz,
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

Dexter.record_movement           = function(...args){ return make_ins("m", ...args) }
Dexter.prototype.record_movement = function(...args){ args.push(this); return Dexter.record_movement(...args) }


Dexter.replay_movement           = function(...args){ return make_ins("o", ...args) }
Dexter.prototype.replay_movement = function(...args){ args.push(this); return Dexter.replay_movement(...args) }


Dexter.set_parameter   = function(name="Acceleration", ...values){
                              let first_arg = values[0]
                              if (name == "StartSpeed") {
                                  if (first_arg < 0){
                                      dde_error("Dexter.set_parameter called with StartSpeed of: " + first_arg +
                                                " but it must be greater than or equal to zero.")
                                  }
                              }
                              else if (name == "MaxSpeed") {
                                  if (first_arg <= 0){
                                      dde_error("Dexter.set_parameter called with MaxSpeed of: " + first_arg +
                                                " but it must be greater than zero.")
                                  }
                                  else if (first_arg < (1 / _nbits_cf)){
                                      warning("Dexter.set_parameter called with MaxSpeed of: " + first_arg +
                                      " which is too low.<br/>MaxSpeed set to the minimum permissible speed of: " + (1 / _nbits_cf))
                                  }
                              }
                              return make_ins("S", name, ...values)
                         }
Dexter.prototype.set_parameter = function(name="Acceleration", ...values){
                                    let first_arg = values[0]
                                    if (name == "StartSpeed") {
                                        if (first_arg < 0){
                                            dde_error("Dexter.set_parameter called with StartSpeed of: " + first_arg +
                                                " but it must be greater than or equal to zero.")
                                        }
                                    }
                                    else if (name == "MaxSpeed") {
                                        if (first_arg <= 0){
                                            dde_error("Dexter.set_parameter called with MaxSpeed of: " + first_arg +
                                                " but it must be greater than zero.")
                                        }
                                        else if (first_arg < (1 / _nbits_cf)){
                                            warning("Dexter.set_parameter called with MaxSpeed of: " + first_arg +
                                                " which is too low.<br/>MaxSpeed set to the minimum permissible speed of: " + (1 / _nbits_cf))
                                        }
                                    }
                                    return make_ins("S", name, ...values, this)
                                }


Dexter.sleep           = function(seconds){ return make_ins("z", seconds) }
Dexter.prototype.sleep = function(seconds){ return make_ins("z", seconds, this) }

Dexter.slow_move           = function(...args){ return make_ins("s", ...args) }
Dexter.prototype.slow_move = function(...args){ args.push(this); return Dexter.slow_move(...args) }

//address is a non-neg integer, probably below 82, value is an integer
Dexter.write_fpga           = function(address, value){ return make_ins("w", address, value) }
Dexter.prototype.write_fpga = function(address, value){ return make_ins("w", address, value, this) }

Dexter.socket_encode = function(char){
    let code = char.charCodeAt(0)
    if((0x00 == code) || (0x3B == code) || (0x25 == code)){
        return "%" + code.toString(16).toUpperCase()
    }
    else { return char }
}

Dexter.write_file = function(file_name=null, content=""){
    let max_content_chars = 62 //244 //252 //ie 256 - 4 for (instruction_id, oplet, suboplet, length
    //payload can be max_contect_chars + 2 long if last character is escaped
    let payload = ""
    let instrs = []
    if (file_name){
        instrs.push(make_ins("W", "f", 0, file_name))
    }
    for(let char of content) {
        payload += Dexter.socket_encode(char)
        if (payload.length >= max_content_chars) {
            instrs.push(make_ins("W", "m", payload.length, payload))
            payload = ""
        }
    }
    instrs.push(make_ins("W", "e", payload.length, payload)) //close the file
    return instrs
}

//deprecated. Note reversed args from Dexter.write_file and default path adjustment
Dexter.write_to_robot = function(content="", file_name=null){
    file_name = Dexter.srv_samba_share_default_to_absolute_path(file_name)
    return Dexter.write_file(file_name, content)
}

Dexter.prototype.write_file = function(file_name=null, content=""){
    let max_content_chars = 62 //244 //252 //ie 256 - 4 for (instruction_id, oplet, suboplet, length
    //payload can be max_contect_chars + 2 long if last character is escaped
    let payload = ""
    let instrs = []
    if (file_name){
        instrs.push(make_ins("W", "f", 0, file_name, this))
    }
    for(let char of content) {
        payload += Dexter.socket_encode(char)
        if (payload.length >= max_content_chars) {
            instrs.push(make_ins("W", "m", payload.length, payload, this))
            payload = ""
        }
    }
    instrs.push(make_ins("W", "e", payload.length, payload, this)) //close the file
    return instrs
}

//deprecated. Note reversed args from Dexter.write_file
Dexter.prototype.write_to_robot = function(content="", file_name=null){
    return this.write_file(file_name, content)
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
    do_list: [out(Dexter.write_file(data, "/srv/samba/share/test.txt"))]})
*/

Dexter.read_file = function(source, destination="read_file_content"){
    return new Instruction.Dexter.read_file(source, destination)
}
//examples pf path input:
//  ./foo.txt =>  /srv/samba/share/foo.txt
// ../foo.txt =>  /srv/samba/foo.txt
//    foo.txt => /srv/samba/share/foo.txt
Dexter.srv_samba_share_default_to_absolute_path = function(path){
    if      (path.startsWith("/"))   { return path }
    else if (path.startsWith("#"))   { return path }
    else if (path.startsWith("./"))  { return "/srv/samba/share/" + path.substring(2) }
    else if (path.startsWith("../")) { return "/srv/samba/"       + path.substring(3) }
    else                             { return "/srv/samba/share/" + path }
}

Dexter.read_from_robot =  function (source, destination="read_file_content"){ //deprecated. simlar to read_file but differs in that srv_sama_share is the default folder
    source = Dexter.srv_samba_share_default_to_absolute_path(source)
    return Dexter.read_file(source, destination)
}

Dexter.prototype.read_file = function (source, destination="read_file_content"){
    return new Instruction.Dexter.read_file(source, destination, this)
}

Dexter.prototype.read_from_robot = Dexter.prototype.read_file


//See James N email Jul 14, 2021
Dexter.turn_off_j6_and_j7_torque  = function(){
    return [Dexter.set_parameter("ServoSet", 3, 24, 0), //J6, for XL-320 motors
            Dexter.set_parameter("ServoSet", 1, 24, 0)] //J7, for XL-320 motors
}

Dexter.prototype.turn_off_j6_and_j7_torque  = function(){
    return [this.set_parameter("ServoSet", 3, 24, 0), //J6, for XL-320 motors
            this.set_parameter("ServoSet", 1, 24, 0)] //J7, for XL-320 motors
}

Dexter.turn_on_j6_and_j7_torque  = function(){
    return [Dexter.set_parameter("ServoSet", 3, 24, 1), //J6, for XL-320 motors
            Dexter.set_parameter("ServoSet", 1, 24, 1)] //J7, for XL-320 motors
}

Dexter.prototype.turn_on_j6_and_j7_torque  = function(){
    return [this.set_parameter("ServoSet", 3, 24, 1), //J6, for XL-320 motors
            this.set_parameter("ServoSet", 1, 24, 1)] //J7, for XL-320 motors
}


//from Dexter_Modes.js (these are instructions. The fns return an array of instructions
Dexter.set_follow_me                = function(){ return [make_ins("S", "RunFile", "setFollowMeMode.make_ins"),
                                                          Dexter.turn_off_j6_and_j7_torque()]}
Dexter.prototype.set_follow_me      = function(){ return [make_ins("S", "RunFile", "setFollowMeMode.make_ins", this),
                                                          this.turn_off_j6_and_j7_torque()]}

Dexter.set_force_protect            = function(){ return [make_ins("S", "RunFile", "setForceProtectMode.make_ins"),
                                                          Dexter.turn_on_j6_and_j7_torque()]}
Dexter.prototype.set_force_protect  = function(){ return [make_ins("S", "RunFile", "setForceProtectMode.make_ins", this),
                                                          this.turn_on_j6_and_j7_torque()]}

Dexter.set_keep_position            = function(){ return [make_ins("S", "RunFile", "setKeepPositionMode.make_ins"),
                                                          Dexter.turn_on_j6_and_j7_torque()]}
Dexter.prototype.set_keep_position  = function(){ return [make_ins("S", "RunFile", "setKeepPositionMode.make_ins", this),
                                                          this.turn_on_j6_and_j7_torque()]}

Dexter.set_open_loop                = function(){ return [make_ins("S", "RunFile", "setOpenLoopMode.make_ins"),
                                                          Dexter.turn_on_j6_and_j7_torque()]}
Dexter.prototype.set_open_loop      = function(){ return [make_ins("S", "RunFile", "setOpenLoopMode.make_ins", this),
                                                          this.turn_on_j6_and_j7_torque()]}


//End Dexter Instructions
//____________Dexter Database______________
//Note: often you should use Robot.instruction_type_to_
Dexter.instruction_type_to_function_name_map = {
    a:"move_all_joints",
    //b:"move_to",           //fry  obsolete
    B:"set_boundries", //10 args: j1BoundryHigh, j1Boundrylow,  j2BoundryHigh, j2Boundrylow, j3BoundryHigh, j3Boundrylow, j4BoundryHigh, j4Boundrylow, j5BoundryHigh, j5Boundrylow,
    C:"pid_move_to",
    c:"capture_ad",
    D:"pid_move_to_straight",
    d:"dma_read",
    e:"cause_dexter_error", //fry
    //E:"empty_instruction_queue_immediately", //new Sept 1, 2016
    F:"empty_instruction_queue",   //new Sept 1, 2016
    G:"get_robot_status_immediately",        //new Sept 1, 2016. Deprecated Dec 8, 2020
    g:"get_robot_status",   //fry
    h:"get_robot_status_heartbeat", //fry
    i:"capture_points",
    l:"load_tables",
    m:"record_movement",
    n:"find_index",
    o:"replay_movement",
    P:"pid_move_all_joints",
    R:"move_all_joints_relative",
    r:"read_file",
    s:"slow_move",
    S:"set_parameter",
    t:"dma_write",
    T:"move_to_straight",
    w:"write_fpga",
    W:"write_file",
    x:"exit",
    z:"sleep"
}

/*
var cache_of_dexter_instance_files = {}

//returns undefined or value of prop_name
//errors if the robot file is not valid json format
//first checks dexter instance, then file prop, then Dexter class prop

//returns a string if error, or literal name-value pairs object.
Dexter.prototype.get_dexter_props_file_object = function(){
    let file_path  = "//" + this.ip_address + "/share/robot_props.json" //todo needs verificatin
    if (file_exists(file_path)) {
        let content = read_file(file_path)
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
*/

//Dexter constants
//values in microns, pivot point to pivot point, not actual link length.
//Dexter manufacturing tolerance is about 5 microns for these link lengths.

//             HDI         ORIG DEX              ORIG DEX
Dexter.LINK1 = 0.235200    //0.228600   //meters   6.5 inches,
Dexter.LINK2 = 0.339092   //0.320676   //meters  12 5/8 inches
Dexter.LINK3 = 0.307500    //0.330201   //meters  13 inches
Dexter.LINK4 = 0.059500    //0.050801   //meters  2 inches
Dexter.LINK5 = 0.082440   //0.082551   //meters  3.25 inches  // from pivot point to tip of the end-effector
//Dexter.LINKS = [0, Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5]

/*These are the HDI Link Lengths as of Jan 1, 2020:
Dexter.LINK1 = 0.2352
Dexter.LINK2 = 0.339092
Dexter.LINK3 = 0.3075
Dexter.LINK4 = 0.0595
Dexter.LINK5 = 0.08244
*/

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

//gets called regardless of whether simulate = true or not because
//even if we're simulating, we like to get that actual link lengths from
//the dexter IF its available
/*Dexter.prototype.set_link_lengths = function(job_to_start_when_done = null){
    let job_to_start = job_to_start_when_done //for closure
    let the_robot  = this //for closure
    let sim_actual = Robot.get_simulate_actual(this.simulate)
    if(this.Link1 &&
      (sim_actual !== true) && //ie "real"
      (this.link_lengths_set_from_dde_computer == true)){
        this.Link1 = undefined  //we want to get vals from Dexter.
        this.Link2 = undefined
        this.Link3 = undefined
        this.Link4 = undefined
        this.Link5 = undefined
    }
    if(!this.Link1 &&
       (!job_to_start || (job_to_start.name != "set_link_lengths"))){
       //we're going to set link lengths.
        if(sim_actual !== true) { //get link lengths from Dexter
            if(node_server_supports_editor(this)) {
                this.set_link_lengths_using_node_server(job_to_start)
            }
            else {
                warning("Dexter." + the_robot.name + "'s node server is not responding.<br/>" +
                        "Now attempting to get link lengths via a Job.")
                this.set_link_lengths_using_job(job_to_start)
            }
        }
        else { //get link lengths from dde computer
            this.set_link_lengths_using_dde_db(job_to_start)
        }
    }
    else {
        this.start_aux(job_to_start)
    }
}*/

//note that
Dexter.prototype.set_link_lengths = function(job_to_start_when_done = null){
    let sim_actual = Robot.get_simulate_actual(this.simulate)
    if(job_to_start_when_done && (job_to_start_when_done.name === "set_link_lengths")) {
        this.start_aux(job_to_start_when_done)
    }
    else if(!this.Link1) { //no values set since dde launch
        if(sim_actual !== true) { //ie "real"
            if(false) { //node_server_supports_editor(this)) { //todo dde4 uncomment, etc.
                this.set_link_lengths_using_node_server(job_to_start_when_done)
            }
            else {
                warning("Dexter." + this.name + "'s node server is not responding.<br/>" +
                    "Setting link lengths via DDE's internal defaults.")
                //this.set_link_lengths_using_job(job_to_start_when_done)
                this.set_link_lengths_using_dde_db(job_to_start_when_done)
            }
        }
        else { //simulating
            this.set_link_lengths_using_dde_db(job_to_start_when_done)
        }
    }
    //already set the Link lengths once, but ...
    else if((sim_actual !== true) && //ie real
            (this.link_lengths_set_from_dde_computer === true)) { //the only time we read link_lengths_set_from_dde_computer
        if(false) { //node_server_supports_editor(this)) {//todo dde4 uncomment, etc.
            this.set_link_lengths_using_node_server(job_to_start_when_done)
        }
        else {
            warning("Dexter." + this.name + "'s node server is not responding.<br/>" +
                    "Setting link lengths via DDE's internal defaults.")
            //this.set_link_lengths_using_job(job_to_start_when_done)
            this.set_link_lengths_using_dde_db(job_to_start_when_done)
        }
    }
    else {//link lengths already set correctly
        this.start_aux(job_to_start_when_done)
    }
}

/*
Dexter.prototype.set_link_lengths_using_node_server = function(job_to_start){
    let path = //"https://" + this.ip_address + "/srv/samba/share/Defaults.make_ins"
              "http://192.168.1.142/edit?edit=/srv/samba/share/Defaults.make_ins"
    let the_dexter = this
    let callback = function(err, data){
        if(err){
            dde_error("in set_link_lengths_using_node_server, could not get content of:<br/>" +
                       path)
        }
        else {
            if(typeof(data) !== "string") {
                data = data.body
            }
            the_dexter.set_link_lengths_from_file_content(data)
            if(job_to_start) { job_to_start.start }
        }
    }
    read_file_async(path, undefined, callback)
}
*/

Dexter.prototype.set_link_lengths_using_node_server = function(job_to_start){
    let ip = job_to_start.robot.ip_address
    let path = "http://" + ip + "/edit?edit=/srv/samba/share/Defaults.make_ins"
               //"http://192.168.1.142/edit?edit=/srv/samba/share/Defaults.make_ins"
    let options = {uri: path} //, timeout: 1000}
    let content = get_page(path)
    if(content.startsWith("Error: ")) {
        warning("set_link_lengths_using_node_server with path: " + path +
                " got error: " + content +
                "<br/> so now setting link lengths using a DDE Job.")
        this.set_link_lengths_using_dde_db(job_to_start) //this will deal with link_lengths_set_from_dde_computer
    }
    else {
        this.set_link_lengths_from_file_content(content)
        delete this.link_lengths_set_from_dde_computer
        if(job_to_start) {
            this.start_aux(job_to_start)
        }
    }
}
/*
Dexter.prototype.set_link_lengths_using_job = function(job_to_start){
    let the_robot = this
    let callback = function() {
        if(Job.set_link_lengths) {
            out("in sll cbb")
        }
        the_robot.start_aux(job_to_start)
    }
    let ssl_job =  new Job({name: "set_link_lengths",
                            robot: this,
                            show_instructions: false,
                            when_stopped: (job_to_start ? callback : "stop"),
                            if_dexter_connect_error: function(robot_name){
                                 warning("Can't connect to Dexter." + robot_name + " executing Job." + "set_link_lengths")
                                if(job_to_start.if_dexter_connect_error){
                                    job_to_start.if_dexter_connect_error(robot_name)
                                }
                                job_to_start.stop_for_reason("errored", "Can't connect to robot: " + robot_name)
                            },
                            do_list: [
                                Dexter.read_file("../Defaults.make_ins", "default_content"), //gets file from Dexter
                                function() {
                                    if(typeof(this.user_data.default_content) == "string"){
                                        this.robot.set_link_lengths_from_file_content(this.user_data.default_content)
                                        delete the_robot.link_lengths_set_from_dde_computer //because link lengths set from Dexter
                                    }
                                    else { //no file because we got an error code integer in this.user_data.default_content
                                        this.robot.set_link_lengths_using_dde_db(job_to_start) //will deal with link_lengths_set_from_dde_computer
                                    }
                                }
                            ]})
    ssl_job.start()
}
*/

Dexter.prototype.set_link_lengths_using_dde_db = function(job_to_start){
    /*let path = dde_apps_folder + "/dexter_file_systems/"  + this.name + "/Defaults.make_ins"
    if(file_exists(path)) {
        let content = read_file(path)
        this.set_link_lengths_from_file_content(content)
    }
    else {*/ //todo dde4 comment in when have access to robot.
        this.Link1 = Dexter.LINK1
        this.Link2 = Dexter.LINK2
        this.Link3 = Dexter.LINK3
        this.Link4 = Dexter.LINK4
        this.Link5 = Dexter.LINK5

        this.J1_angle_min = Dexter.J1_ANGLE_MIN
        this.J2_angle_min = Dexter.J2_ANGLE_MIN
        this.J3_angle_min = Dexter.J3_ANGLE_MIN
        this.J4_angle_min = Dexter.J4_ANGLE_MIN
        this.J5_angle_min = Dexter.J5_ANGLE_MIN
        this.J6_angle_min = Dexter.J6_ANGLE_MIN
        this.J7_angle_min = Dexter.J7_ANGLE_MIN

        this.J1_angle_max = Dexter.J1_ANGLE_MAX
        this.J2_angle_max = Dexter.J2_ANGLE_MAX
        this.J3_angle_max = Dexter.J3_ANGLE_MAX
        this.J4_angle_max = Dexter.J4_ANGLE_MAX
        this.J5_angle_max = Dexter.J5_ANGLE_MAX
        this.J6_angle_max = Dexter.J6_ANGLE_MAX
        this.J7_angle_max = Dexter.J7_ANGLE_MAX
    // } //todo dde4 comment in when have access to robot.
    this.link_lengths_set_from_dde_computer = true
    if(job_to_start) {
        this.start_aux(job_to_start)
    }
}

//content is the content of a Defaults.make_ins file
//sets link lengths as well as any other params in the file.
Dexter.prototype.set_link_lengths_from_file_content = function(content){
    for(let line of content.split("\n")){
        //first get rid of comment, if any, at line end.
        let semi_pos = line.indexOf(";")
        if (semi_pos > -1) { line = line.substring(0, semi_pos) }
        line = line.trim()
        if(line.length > 0) {
            let line_elts = line.split(",")
            let oplet = line_elts[0].trim()
            if(oplet == "S"){
                let param_name = line_elts[1].trim()
                if(line_elts.length == 3){
                    let val = parseFloat(line_elts[2].trim())
                    let new_param_name = param_name
                    if(param_name.includes("Boundry")) {
                        val = val * _arcsec
                        new_param_name = "J"
                        new_param_name += param_name[1]
                        new_param_name = new_param_name + "_angle_" //+= fails here. JS bug
                        if(param_name.endsWith("Low")) {new_param_name += "min"}
                        else                           {new_param_name += "max"}
                    }
                    this[new_param_name] = val
                }
                //the rest have more than one val
                else if (param_name == "LinkLengths") { //link5 length is in the array first. }
                    for(let i = 2; i < line_elts.length; i++){
                        let i_val = parseFloat(line_elts[i].trim()) * _um  //convert from string of microns to meters.
                        if     (i == 2) { this.Link5 = i_val }
                        else if(i == 3) { this.Link4 = i_val }
                        else if(i == 4) { this.Link3 = i_val }
                        else if(i == 5) { this.Link2 = i_val }
                        else if(i == 6) { this.Link1 = i_val }
                        else { shouldnt("set_parameter of: " + param_name + " got more than 5 link lengths.") }
                    }
                }
                else {
                    let val = line_elts.slice(2, line_elts.length - 1)
                    this[param_name] = val
                }
            }
        }
    }
    if(!this.J6_angle_min) { //not included in some defaults.makeins files
        this.J6_angle_min = Dexter.J6_ANGLE_MIN
    }
    if(!this.J6_angle_max) { //not included in some defaults.makeins files
        this.J6_angle_max = Dexter.J6_ANGLE_MAX
    }
    if(!this.J7_angle_min) { //not included in some defaults.makeins files
        this.J7_angle_min = Dexter.J7_ANGLE_MIN
    }
    if(!this.J7_angle_max) { //not included in some defaults.makeins files
        this.J7_angle_max = Dexter.J7_ANGLE_MAX
    }
}

Dexter.LEG_LENGTH = 0.152400 //meters  6 inches

//values in degrees, Dexter HDI
Dexter.J1_ANGLE_MIN = -185
Dexter.J1_ANGLE_MAX = 185
Dexter.J2_ANGLE_MIN = -105
Dexter.J2_ANGLE_MAX = 105
Dexter.J3_ANGLE_MIN = -150
Dexter.J3_ANGLE_MAX = 150
Dexter.J4_ANGLE_MIN = -120 //-100
Dexter.J4_ANGLE_MAX = 120  //100
Dexter.J5_ANGLE_MIN = -185
Dexter.J5_ANGLE_MAX = 185
Dexter.J6_ANGLE_MIN = -150 //0
Dexter.J6_ANGLE_MAX = 150 //296
Dexter.J7_ANGLE_MIN = 0
Dexter.J7_ANGLE_MAX = 296

Dexter.MAX_SPEED    = 30  //degrees per second. NOT the max speed of the robot,
                         //but rather for a given instruction's envelope of speed,
                         //its the max speed that will be attined by that instruction.
                         //The JOINT that this is the max speed for is
                         //the joint that changes the most in a given call to move_all_joints.
Dexter.START_SPEED  = 0.5 //degrees per second
Dexter.ACCELERATION = 0.000129 //degrees/(second^2)

Dexter.RIGHT_ANGLE    = 90 // 90 degrees
Dexter.HOME_ANGLES    = [0, 0, 0, 0, 0, 0, 50]  //j2,j3,j4 straight up, link 5 horizontal pointing frontwards. If J7 is 0 it will overtorque, turning on the red light as it closes too tightly. James W likes 50 degrees.
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
/* obsolete Jan 2021
Dexter.robot_ack_labels = [
//new name   old name                   array index
// misc block
    "JOB_ID",              //0
    "INSTRUCTION_ID",      //1
    "START_TIME",          //2 //ms since jan 1, 1970? From Dexter's clock
    "STOP_TIME",           //3 //ms since jan 1, 1970? From Dexter's clock
    "INSTRUCTION_TYPE",    //4 "oplet"
    "ERROR_CODE"           //5   0 means ok
]*/

//call this from most code
Dexter.robot_status_labels_sm = function(sm=0){
    if(sm === 0) { return Dexter.robot_status_labels }
    else {
        let labels_name = "robot_status_labels_g" + sm
        let actual_labels_array = Dexter[labels_name]
        if(actual_labels_array) { return actual_labels_array}
        else { return Dexter.robot_status_labels_g_other }
    }
}

Dexter.robot_status_labels = [
//new name             old name
// misc block                    array index
"JOB_ID",              //new field                    0 //for commmanded instruction (when added to queue)
"INSTRUCTION_ID",      //same name                    1 //for cmd ins
"START_TIME",          //new field                    2 //for cmd ins//ms since jan 1, 1970? From Dexter's clock
"STOP_TIME",           //new field                    3 //for cmd ins//ms since jan 1, 1970? From Dexter's clock
"INSTRUCTION_TYPE",    //same name                    4 //for cmd ins  //"oplet"

"ERROR_CODE",          //same name                    5 //for any error      //0 means no error. 1 means an error
"DMA_READ_DATA",       //                             6 // deprecated DMA_READ_DATA  then deprecated  "JOB_ID_OF_CURRENT_INSTRUCTION"
"READ_BLOCK_COUNT",    //                             7 // deprecated READ_BLOCK_COUNT then deprecated CURRENT_INSTRUCTION_ID
"STATUS_MODE",         //same name                    8 //was RECORD_BLOCK_SIZE and was unused
"END_EFFECTOR_IO_IN",     //END_EFFECTOR_IO_IN        9 // was END_EFFECTOR_IN for a while, 0, 1, or 2 indicating type of io for end effector
//J1 block
"J1_ANGLE",            // BASE_POSITION_AT           10 //means commanded stepped angle, not commanded_angle and not current_angle
"J1_DELTA",            // BASE_POSITION_DELTA        11
"J1_PID_DELTA",        // BASE_POSITION_PID_DELTA    12
null,                  // BASE_POSITION_FORCE_DELTA  13 //was J1_FORCE_CALC_ANGLE
"J1_A2D_SIN",          // BASE_SIN                   14
"J1_A2D_COS",          // BASE_COS                   15
"J1_MEASURED_ANGLE",   // PLAYBACK_BASE_POSITION     16 //deprecated J1_PLAYBACK
"J1_SENT",             // SENT_BASE_POSITION         17 //unused. angle sent in the commanded angle of INSTRUCTION_ID
"J7_MEASURED_ANGLE",   // SLOPE_BASE_POSITION        18 //deprecated J1_SLOPE
 null,                 //                            19 //was J1_MEASURED_ANGLE. not used, get rid of, now don't compute on dde side,
//J2 block of 10
"J2_ANGLE",            // END_POSITION_AT            20
"J2_DELTA",            // END_POSITION_DELTA         21
"J2_PID_DELTA",        // END_POSITION_PID_DELTA     22 was J2_FORCE_CALC_ANGLE
null,                  // END_POSITION_FORCE_DELTA   23
"J2_A2D_SIN",          // END_SIN                    24
"J2_A2D_COS",          // END_COS                    25
"J2_MEASURED_ANGLE",   // PLAYBACK_END_POSITION      26 //deprecated J2_PLAYBACK
"J2_SENT",             // SENT_END_POSITION          27 //unused
"J7_MEASURED_TORQUE",  // SLOPE_END_POSITION         28 //deprecated J2_SLOPE
 null,                 // new field                  29 //was J2_MEASURED_ANGLE, not used, get rid of,
//J2 block of 10
"J3_ANGLE",            // PIVOT_POSITION_AT           30
"J3_DELTA",            // PIVOT_POSITION_DELTA        31
"J3_PID_DELTA",        // PIVOT_POSITION_PID_DELTA    32
null,                  // PIVOT_POSITION_FORCE_DELTA  33  was "J3_FORCE_CALC_ANGLE"
"J3_A2D_SIN",          // PIVOT_SIN                   34
"J3_A2D_COS",          // PIVOT_SIN                   35
"J3_MEASURED_ANGLE",   // PLAYBACK_PIVOT_POSITION     36 //deprecated J3_PLAYBACK
"J3_SENT",             // SENT_PIVOT_POSITION         37 //unused
"J6_MEASURED_ANGLE",   // SLOPE_PIVOT_POSITION        38 //deprecated  J3_SLOPE
 null,                 // new field                   39 //was J3_MESURED_ANGLE not used get rid of
//J4 block of 10
"J4_ANGLE",            // ANGLE_POSITION_AT           40
"J4_DELTA",            // ANGLE_POSITION_DELTA        41
"J4_PID_DELTA",        // ANGLE_POSITION_PID_DELTA    42
null,                  // ANGLE_POSITION_FORCE_DELTA  43 was "J4_FORCE_CALC_ANGLE"
"J4_A2D_SIN",          // ANGLE_SIN                   44
"J4_A2D_COS",          // ANGLE_SIN                   45
"J4_MEASURED_ANGLE",   // PLAYBACK_ANGLE_POSITION     46 //deprecated J4_PLAYBACK
"J4_SENT",             // SENT_ANGLE_POSITION         47 //unused
"J6_MEASURED_TORQUE",  // SLOPE_ANGLE_POSITION        48 //deprecated J4_SLOPE
null,                  // new field                   49 //not used get rid of
//J4 block of 10
"J5_ANGLE",            // ROTATE_POSITION_AT          50
"J5_DELTA",            // ROTATE_POSITION_DELTA       51
"J5_PID_DELTA",        // ROTATE_POSITION_PID_DELTA   52
null,                  // ROT_POSITION_FORCE_DELTA    53 was "J5_FORCE_CALC_ANGLE"
"J5_A2D_SIN",          // ROT_SIN                     54
"J5_A2D_COS",          // ROT_SIN                     55
"J5_MEASURED_ANGLE",   // PLAYBACK_ROT_POSITION       56 //deprecated J5_PLAYBACK
"J5_SENT",             // SENT_ROT_POSITION           57 //unused
null,                  // SLOPE_ROT_POSITION          58 //deprecated J5_SLOPE  unusued
null                   // new field                   59 //was J5_MEASURED_ANGLE, not used get rid of
]


//its inefficient to have effectively 3 lists, but the sans-index list is good for
//short labels used in tables, and the index is nice and explicit
//for robot.robot_status[Dexter.foo_index] access
//The explicit Dexter.robot_status_index_labels is needed for a series.
Dexter.make_robot_status_indices = function(labels = Dexter.robot_status_labels, index_array=Dexter.robot_status_index_labels){
    for(var i = 0; i < labels.length; i++){
        var label = labels[i] //could be null
        if (label) {
            var index_label = "Dexter." + label //+ "_INDEX"
            Dexter[label] = i
            index_array.push(index_label)
        }
    }
}

Dexter.robot_status_index_labels = []
Dexter.make_robot_status_indices()

Dexter.make_backward_compatible_robot_status_indices = function(){
    Dexter.DMA_READ_DATA    = 6
    Dexter.READ_BLOCK_COUNT = 7
    Dexter.RECORD_BLOCK_SIZE = 8
    Dexter.END_EFFECTOR_IN  = 9

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


Dexter.make_default_status_array = function(){
    let result = new Array(Dexter.robot_status_labels.length).fill(0)
    result[Dexter.INSTRUCTION_ID]   = -1
    result[Dexter.INSTRUCTION_TYPE] = "g"
    result[Dexter.J6_MEASURED_ANGLE] = (0 - 512) * Socket.DEGREES_PER_DYNAMIXEL_UNIT  //should result in degrees
    return result
}

Dexter.make_default_status_array_g1 = function(){
    let result = new Array(Dexter.robot_status_labels_g1.length).fill(0)
    result[Dexter.INSTRUCTION_ID]   = -1
    result[Dexter.INSTRUCTION_TYPE] = "g"
    result[Dexter.STATUS_MODE] = 1
    let index_j6_ma = Dexter.robot_status_labels_g1.indexOf("J6_MEASURED_ANGLE_G1")
    result[index_j6_ma] = -512
    return result
}

Dexter.make_default_status_array_g_other = function(sm){
    let result = new Array(Dexter.robot_status_labels.length).fill(0)
    result[Dexter.INSTRUCTION_ID]   = -1
    result[Dexter.INSTRUCTION_TYPE] = "g"
    result[Dexter.STATUS_MODE] = sm
    return result
}

//call this from most code
Dexter.make_default_status_array_g_sm = function(sm=0){
    let meth_name = "make_default_status_array_g" + sm
    let meth = Dexter[meth_name]
    if(meth) { return  meth.call(this) }
    else     { return Dexter.make_default_status_array_g_other(sm) }
}

Dexter.robot_status_labels_g1 = [
    // misc block
    "JOB_ID",              //new field  0 //for commmanded instruction (when added to queue)
    "INSTRUCTION_ID",      //same name  1 //for cmd ins
    "START_TIME",          //new field  2 //for cmd ins//ms since jan 1, 1970? From Dexter's clock
    "STOP_TIME",           //new field  3 //for cmd ins//ms since jan 1, 1970? From Dexter's clock
    "INSTRUCTION_TYPE",    //same name  4 //for cmd ins  //"oplet"

    "ERROR_CODE",          //same name  5 //for any error      //0 means no error. 1 means an error
    "DMA_READ_DATA",       //           6 // deprecated DMA_READ_DATA then deprecated JOB_ID_OF_CURRENT_INSTRUCTION
    "READ_BLOCK_COUNT",    //           7 // deprecated READ_BLOCK_COUNT then deprecated CURRENT_INSTRUCTION_ID
    "STATUS_MODE",   //same name        8
    "END_EFFECTOR_IO_IN",  //END_EFFECTOR_IO_IN 9 // was END_EFFECTOR_IN for a while, 0, 1, or 2 indicating type of io for end effector

    "J1_MEASURED_ANGLE_G1", //10
    "J2_MEASURED_ANGLE_G1", //11
    "J3_MEASURED_ANGLE_G1", //12
    "J4_MEASURED_ANGLE_G1", //13
    "J5_MEASURED_ANGLE_G1", //14
    "J6_MEASURED_ANGLE_G1", //15
    "J7_MEASURED_ANGLE_G1", //16
    null,                   //17
    null,                   //18
    null,                   //19

    "J1_TORQUE_G1", //20
    "J2_TORQUE_G1", //21
    "J3_TORQUE_G1", //22
    "J4_TORQUE_G1", //23
    "J5_TORQUE_G1", //24
    "J6_TORQUE_G1", //25
    "J7_TORQUE_G1", //26
    null,           //27
    null,           //28
    null,           //29

    "J1_VELOCITY_G1", //30
    "J2_VELOCITY_G1", //31
    "J3_VELOCITY_G1", //32
    "J4_VELOCITY_G1", //33
    "J5_VELOCITY_G1", //34
    "J6_VELOCITY_G1", //35
    "J7_VELOCITY_G1", //36
    null,             //37
    null,             //38
    null,             //39

    null,            //40
    null,            //41
    null,            //42
    null,            //43
    null,            //44
    null,            //45
    null,            //46
    null,            //47
    null,            //48
    null,            //49

    null,            //50
    null,            //51
    null,            //52
    null,            //53
    null,            //54
    null,            //55
    null,            //56
    null,            //57
    null,            //58
    null             //59
]

Dexter.robot_status_index_labels_g1 = []
Dexter.make_robot_status_indices(Dexter.robot_status_labels_g1, Dexter.robot_status_index_labels_g1)

/* changes from g0 to g2:
DONE Replace *_AT (presumably ANGLE as in J1_ANGLE) with *_RAW_ENCODER_ANGLE_FXP
DONE Replace *_DELTA with *_EYE_NUMBER
NO CHANGE Keep *_PID_DELTA
DON'T DO: Replace *_FORCE_DELTA with AdcCenter  What's FORCE_DELTA?
NO CHANGE Keep *_SIN
NO CHANGE Keep *_COS
NO CHANGE Keep MEASURED_ANGLE
*/
Dexter.robot_status_labels_g2 = [
//new name             old name
// misc block                    array index
    "JOB_ID",              //new field                    0 //for commmanded instruction (when added to queue)
    "INSTRUCTION_ID",      //same name                    1 //for cmd ins
    "START_TIME",          //new field                    2 //for cmd ins//ms since jan 1, 1970? From Dexter's clock
    "STOP_TIME",           //new field                    3 //for cmd ins//ms since jan 1, 1970? From Dexter's clock
    "INSTRUCTION_TYPE",    //same name                    4 //for cmd ins  //"oplet"

    "ERROR_CODE",          //same name                    5 //for any error      //0 means no error. 1 means an error
    "DMA_READ_DATA",       //                             6 // deprecated DMA_READ_DATA  then deprecated  "JOB_ID_OF_CURRENT_INSTRUCTION"
    "READ_BLOCK_COUNT",    //                             7 // deprecated READ_BLOCK_COUNT then deprecated CURRENT_INSTRUCTION_ID
    "STATUS_MODE",   //same name                    8 //was RECORD_BLOCK_SIZE and was unused
    "END_EFFECTOR_IO_IN",     //END_EFFECTOR_IO_IN           9 // was END_EFFECTOR_IN for a while, 0, 1, or 2 indicating type of io for end effector

//J1 block
    "J1_RAW_ENCODER_ANGLE_FXP_G2",            // BASE_POSITION_AT           10 //means commanded stepped angle, not commanded_angle and not current_angle
    "J1_EYE_NUMBER_G2",            // BASE_POSITION_DELTA        11
    "J1_PID_DELTA_G2",        // BASE_POSITION_PID_DELTA    12
    null,                  // BASE_POSITION_FORCE_DELTA  13 //was J1_FORCE_CALC_ANGLE
    "J1_A2D_SIN_G2",          // BASE_SIN                   14
    "J1_A2D_COS_G2",          // BASE_COS                   15
    "J1_MEASURED_ANGLE_G2",   // PLAYBACK_BASE_POSITION     16 //deprecated J1_PLAYBACK
    "J1_SENT_G2",             // SENT_BASE_POSITION         17 //unused. angle sent in the commanded angle of INSTRUCTION_ID
    "J7_MEASURED_ANGLE_G2",   // SLOPE_BASE_POSITION        18 //deprecated J1_SLOPE
    null,                 //                            19 //was J1_MEASURED_ANGLE. not used, get rid of, now don't compute on dde side,
//J2 block of 10
    "J2_RAW_ENCODER_ANGLE_FXP_G2",            // END_POSITION_AT            20
    "J2_EYE_NUMBER_G2",            // END_POSITION_DELTA         21
    "J2_PID_DELTA_G2",        // END_POSITION_PID_DELTA     22 was J2_FORCE_CALC_ANGLE
    null, // END_POSITION_FORCE_DELTA   23
    "J2_A2D_SIN_G2",          // END_SIN                    24
    "J2_A2D_COS_G2",          // END_COS                    25
    "J2_MEASURED_ANGLE_G2",   // PLAYBACK_END_POSITION      26 //deprecated J2_PLAYBACK
    "J2_SENT_G2",             // SENT_END_POSITION          27 //unused
    "J7_MEASURED_TORQUE_G2",  // SLOPE_END_POSITION         28 //deprecated J2_SLOPE
    null,                 // new field                  29 //was J2_MEASURED_ANGLE, not used, get rid of,
//J2 block of 10
    "J3_RAW_ENCODER_ANGLE_FXP_G2",            // PIVOT_POSITION_AT           30
    "J3_EYE_NUMBER_G2",            // PIVOT_POSITION_DELTA        31
    "J3_PID_DELTA_G2",        // PIVOT_POSITION_PID_DELTA    32
    null,                  // PIVOT_POSITION_FORCE_DELTA  33  was "J3_FORCE_CALC_ANGLE"
    "J3_A2D_SIN_G2",          // PIVOT_SIN                   34
    "J3_A2D_COS_G2",          // PIVOT_SIN                   35
    "J3_MEASURED_ANGLE_G2",   // PLAYBACK_PIVOT_POSITION     36 //deprecated J3_PLAYBACK
    "J3_SENT_G2",             // SENT_PIVOT_POSITION         37 //unused
    "J6_MEASURED_ANGLE_G2",   // SLOPE_PIVOT_POSITION        38 //deprecated  J3_SLOPE
    null,                 // new field                   39 //was J3_MESURED_ANGLE not used get rid of
//J4 block of 10
    "J4_RAW_ENCODER_ANGLE_FXP_G2",            // ANGLE_POSITION_AT           40
    "J4_EYE_NUMBER_G2",            // ANGLE_POSITION_DELTA        41
    "J4_PID_DELTA_G2",        // ANGLE_POSITION_PID_DELTA    42
    null,                  // ANGLE_POSITION_FORCE_DELTA  43 was "J4_FORCE_CALC_ANGLE"
    "J4_A2D_SIN_G2",          // ANGLE_SIN                   44
    "J4_A2D_COS_G2",          // ANGLE_SIN                   45
    "J4_MEASURED_ANGLE_G2",   // PLAYBACK_ANGLE_POSITION     46 //deprecated J4_PLAYBACK
    "J4_SENT_G2",             // SENT_ANGLE_POSITION         47 //unused
    "J6_MEASURED_TORQUE_G2",  // SLOPE_ANGLE_POSITION        48 //deprecated J4_SLOPE
    null,                  // new field                   49 //not used get rid of
//J4 block of 10
    "J5_RAW_ENCODER_ANGLE_FXP_G2",            // ROTATE_POSITION_AT          50
    "J5_EYE_NUMBER_G2",            // ROTATE_POSITION_DELTA       51
    "J5_PID_DELTA_G2",        // ROTATE_POSITION_PID_DELTA   52
    null,                  // ROT_POSITION_FORCE_DELTA    53 was "J5_FORCE_CALC_ANGLE"
    "J5_A2D_SIN_G2",          // ROT_SIN                     54
    "J5_A2D_COS_G2",          // ROT_SIN                     55
    "J5_MEASURED_ANGLE_G2",   // PLAYBACK_ROT_POSITION       56 //deprecated J5_PLAYBACK
    "J5_SENT_G2",             // SENT_ROT_POSITION           57 //unused
    null,                  // SLOPE_ROT_POSITION          58 //deprecated J5_SLOPE  unusued
    null                   // new field                   59 //was J5_MEASURED_ANGLE, not used get rid of
]
Dexter.robot_status_index_labels_g2 = []
Dexter.make_robot_status_indices(Dexter.robot_status_labels_g2, Dexter.robot_status_index_labels_g2)

Dexter.robot_status_labels_g_other = [
    // misc block
    "JOB_ID",              //new field                    0 //for commmanded instruction (when added to queue)
    "INSTRUCTION_ID",      //same name                    1 //for cmd ins
    "START_TIME",          //new field                    2 //for cmd ins//ms since jan 1, 1970? From Dexter's clock
    "STOP_TIME",           //new field                    3 //for cmd ins//ms since jan 1, 1970? From Dexter's clock
    "INSTRUCTION_TYPE",    //same name                    4 //for cmd ins  //"oplet"

    "ERROR_CODE",          //same name                    5 //for any error      //0 means no error. 1 means an error
    "DMA_READ_DATA",       //                             6 // deprecated DMA_READ_DATA then deprecated JOB_ID_OF_CURRENT_INSTRUCTION
    "READ_BLOCK_COUNT",    //                             7 // deprecated READ_BLOCK_COUNT then deprecated CURRENT_INSTRUCTION_ID
    "STATUS_MODE",   //same name                    8
    "END_EFFECTOR_IO_IN",  //END_EFFECTOR_IO_IN           9 // was END_EFFECTOR_IN for a while, 0, 1, or 2 indicating type of io for end effector

    "RS_10_G_OTHER", //10
    "RS_11_G_OTHER", //11
    "RS_12_G_OTHER", //12
    "RS_13_G_OTHER", //13
    "RS_14_G_OTHER", //14
    "RS_15_G_OTHER", //15
    "RS_16_G_OTHER", //16
    "RS_17_G_OTHER", //17
    "RS_18_G_OTHER", //18
    "RS_19_G_OTHER", //19

    "RS_20_G_OTHER", //20
    "RS_21_G_OTHER", //21
    "RS_22_G_OTHER", //22
    "RS_23_G_OTHER", //23
    "RS_24_G_OTHER", //24
    "RS_25_G_OTHER", //25
    "RS_26_G_OTHER", //26
    "RS_27_G_OTHER", //27
    "RS_28_G_OTHER", //28
    "RS_29_G_OTHER", //29

    "RS_30_G_OTHER", //30
    "RS_31_G_OTHER", //31
    "RS_32_G_OTHER", //32
    "RS_33_G_OTHER", //33
    "RS_34_G_OTHER", //34
    "RS_35_G_OTHER", //35
    "RS_36_G_OTHER", //36
    "RS_37_G_OTHER", //37
    "RS_38_G_OTHER", //38
    "RS_39_G_OTHER", //39

    "RS_40_G_OTHER", //40
    "RS_41_G_OTHER", //41
    "RS_42_G_OTHER", //42
    "RS_43_G_OTHER", //43
    "RS_44_G_OTHER", //44
    "RS_45_G_OTHER", //45
    "RS_46_G_OTHER", //46
    "RS_47_G_OTHER", //47
    "RS_48_G_OTHER", //48
    "RS_49_G_OTHER", //49

    "RS_50_G_OTHER", //50
    "RS_51_G_OTHER", //51
    "RS_52_G_OTHER", //52
    "RS_53_G_OTHER", //53
    "RS_54_G_OTHER", //54
    "RS_55_G_OTHER", //55
    "RS_56_G_OTHER", //56
    "RS_57_G_OTHER", //57
    "RS_58_G_OTHER", //58
    "RS_59_G_OTHER"  //59
]

Dexter.robot_status_index_labels_g_other = []
Dexter.make_robot_status_indices(Dexter.robot_status_labels_g_other, Dexter.robot_status_index_labels_g_other)


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
        let long_start_time_string = Utils.date_integer_to_long_string(ds[Dexter.START_TIME])
        let long_stop_time_string  = Utils.date_integer_to_long_string(ds[Dexter.STOP_TIME])
        let result =
        "<table class='robot_status_table'>" +
        "<tr><th></th>                        <th>JOB_ID</th>                           <th>INSTRUCTION_ID</th>                                                            <th>START_TIME</th>                                                         <th>STOP_TIME</th>                                                                              <th>INSTRUCTION_TYPE</th> </tr>" +
        "<tr><td></td><td>"           + ds[Dexter.JOB_ID]         + "</td><td>" + ds[Dexter.INSTRUCTION_ID]   + "</td><td title='" + long_start_time_string + "'>" + ds[Dexter.START_TIME] + "</td><td title='" + long_stop_time_string + "'>" + ds[Dexter.STOP_TIME] + "</td><td title='" + Robot.instruction_type_to_function_name(oplet)  + "'>" + oplet +        "</td></tr>" +

        "<tr><th></th>              <th>ERROR_CODE</th>                          <th>DMA_READ_DATA</th>                    <th>READ_BLOCK_COUNT</th>                   <th>STATUS_MODE</th>                                                                 <th>END_EFFECTOR_IO_IN</th></tr>"      +
        "<tr><td></td><td>" + ds[Dexter.ERROR_CODE] + "</td> <td>"       + ds[Dexter.DMA_READ_DATA]  + "</td><td>" + ds[Dexter.READ_BLOCK_COUNT] + "</td><td>" + ds[Dexter.STATUS_MODE]                                               + "</td><td>" + ds[Dexter.END_EFFECTOR_IO_IN] + "</td></tr>" +

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


Dexter.sent_instructions_to_html = function(sent_ins){
    var result = "<table><tr>" +
        "<th>JOB_ID</th>" +
        "<th title='The instruction_id is the same as the program counter at send time.'>INS ID</th>" +
        "<th>START_TIME</th>" +
        "<th>STOP_TIME</th>" +
        "<th>INSTRUCTION_TYPE</th>" +
        "<th>Instruction arguments</th></tr>"
    for(var ins of sent_ins){
        var instruction_type = Instruction.extract_instruction_type(ins)
        var instruction_name = " (" + Robot.instruction_type_to_function_name(instruction_type) + ")"
        result +=  "<tr><td>" + Instruction.extract_job_id(ins)          + "</td><td>" +
                                Instruction.extract_instruction_id(ins)  + "</td><td>" +
                                Instruction.extract_start_time(ins)      + "</td><td>" +
                                Instruction.extract_stop_time(ins)       + "</td><td>" +
                                instruction_type + instruction_name      + "</td><td>" +
                                Instruction.extract_args(ins)            + "</td></tr>"
    }
    result += "</table>"
    return "<details style='display:inline-block;'><summary></summary>" + result + "</details>"
}
//called from Utils.stringify_value
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
            let robot_status_instance = new RobotStatus({robot_status: rs})
            let sm = robot_status_instance.status_mode()
            if((sm === 0) || (sm === 1)) {
                //let angles = [rs[Dexter.J1_MEASURED_ANGLE], rs[Dexter.J2_MEASURED_ANGLE], rs[Dexter.J3_MEASURED_ANGLE], rs[Dexter.J4_MEASURED_ANGLE], rs[Dexter.J5_MEASURED_ANGLE]]
                let a_xyz  = robot_status_instance.xyz()[0]
                new_rs_history.push(rs.concat(a_xyz))
            }
            else { new_rs_history.push(rs) }
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
        if      (label === null) { label = "unused" }
        else if (label == "JOB_ID")   {
            label = "<span title='The Job this instruction is in.'>JOB_ID</span>" //doesn't work. tooltip doesn't show up
            width=70
        }
        else if (label == "INSTRUCTION_ID")   {
            label = "<span title='instruction_id in the Job of JOB_ID.'>INS_ID</span>" //doesn't work. tooltip doesn't show up
            width=80
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
            label = "<span title='In milliseconds since Jan 1, 1970.'>START_TIME</span>"
            width=120
        }
        else if (label == "STOP_TIME") {
            label = "<span title='In milliseconds since Jan 1, 1970.'>STOP_TIME</span>"
            width=120
        }
        else if (label == "INSTRUCTION_TYPE") { //beware, usually this tooltip doesn't show. Maybe a jqxwidget bug?
            label = "<span title='instruction_type, a.k.a oplet.'>Type</span>" // setting title doesn't give tooltip
            width=54
            cells_renderer = function (row, column, value, rowData) {
                let fn_name = Robot.instruction_type_to_function_name(value[1]) //value will be a string of 3 chars, an oplet surounded by double quots.
                return "<div title='" + fn_name + "' style='width:100%;color:blue;'>" + value + "</div>"
            }
        }
        else if (label == "ERROR_CODE") {  //beware, usually this tooltip doesn't show. Maybe a jqxwidget bug?
            label = "<span title='error_code. Zero means no error.'>Error</span>" // setting title doesn't give tooltip
            width=60
        }
        else if (label.startsWith("End_Effector")) {
            width = 170
        }
        else { //other labels
           width = (Math.max(label.length, 8) * 10)
           if(i < 60) { width += 15 } //room for the array index number.
        }
        var pinned = (i < 3)
        if(i < 60) { label = i + ". " + label }
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