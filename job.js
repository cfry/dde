/**Created by Fry on 2/5/16. */
var esprima = require('esprima')

var Job = class Job{
    constructor({name=null, robot=Robot.dexter0, do_list=[], keep_history=true, show_instructions=false,
                 inter_do_item_dur = 100, user_data={}, program_counter=0, ending_program_counter="end",
                 initial_instruction = null} = {}){
    //program_cpunter is the counter of the next instruction that should be executed.
    //so since we're currently "executing" 1 instruction, and after its done,
    //we'll be incrementing the pc, then internally we decriment the
    //passed in program_counter. If its negative, it means
    //computer it from the end, ie -1 means when set_next_do is called,
    //it will set the pc to the length of the do_list, hence we'll be done
    //with the job. -2 means we want to execute the last instruction of the
    //job next, etc.
    //save the args
    this.orig_args = {do_list: do_list, keep_history: keep_history, show_instructions: show_instructions,
        inter_do_item_dur: inter_do_item_dur, user_data: user_data,
        program_counter: program_counter, ending_program_counter: ending_program_counter,
        initial_instruction: initial_instruction}
    this.name              = name
    this.robot             = robot
    //setup name
    Job.job_id_base       += 1
    this.job_id            = Job.job_id_base
    if (this.name == null){ this.name = "job_" + this.job_id }
    if (!(robot instanceof Robot)){
        if (!Robot.dexter0){
            dde_error("Attempt to created Job: " + this.name + " with no valid robot instance.<br/>" +
                      " Note that Robot.dexter0 is not defined<br/> " +
                      " but should be in your file: Documents/dde_apps/dde_init.js <br/>" +
                      " after setting the default ip_address and port.<br/> " +
                      "To generate the default dde_init.js file,<br/>" +
                      " rename your existing one and relaunch DDE.")
        }
        else {
            dde_error("Attempt to created Job: " + this.name + " with no valid robot instance.<br/>" +
                      "You can let the robot param to new Job default to get a correct Robot.dexter.0")
        }
    }
    this.program_counter = program_counter //this is set in start BUT, if we have an unstarted job, and
                         //instruction_location_to_id needs access to program_counter, this needs to be set
    this.highest_completed_instruction_id = -1 //same comment as for program_counter above.
    this.sent_from_job_instruction_queue = [] //will be re-inited by start, but needed here
      //just in case some instructions are to be inserted before this job starts.
    Job[this.name]         = this //beware: if we create this job twice, the 2nd version will be bound to the name, not the first.
    Job.remember_job_name(this.name)
    this.status_code       = "not_started" //see Job.status_codes for the legal values
    this.add_job_button_maybe()
    this.color_job_button()
    }

    //Called by user to start the job and "reinitialize" a stopped job
    start(options={}){  //sent_from_job = null
        if(Job.disable_all){
            out('Attempt to start Job: ' + this.name + " but all jobs have been disabled.")
        }
        else if (["starting", "running", "suspended"].includes(this.status_code)){
            dde_error("Attempt to restart job: "  + this.name +
                      " but it has status code: " + this.status_code +
                      " which doesn't permit restarting.")
        }
        else{//init from orig_args
            this.do_list           = Job.flatten_do_list_array(this.orig_args.do_list) //make a copy in case the user passes in an array that they will use elsewhere, which we wouldn't want to mung
            this.keep_history      = this.orig_args.keep_history
            this.show_instructions  = this.orig_args.show_instructions
            this.inter_do_item_dur = this.orig_args.inter_do_item_dur
            this.user_data         = // don't do as gets non-enumerables, etc. messes up printing of what should be empty user_data of a job jQuery.extend(true, {}, this.orig_args.user_data) //performs deep copy. This is hard, so use jquery
                                     shallow_copy(this.orig_args.user_data)
            this.program_counter   = this.orig_args.program_counter //see robot_done_with_instruction as to why this isn't 0,
                                     //its because the robot.start effectively calls set_up_next_do(1), incremening the PC
            this.ending_program_counter = this.orig_args.ending_program_counter
            this.initial_instruction = this.orig_args.initial_instruction

            //first we set all the orig (above), then we over-ride them with the passed in ones
            for (let key in options){
                if (options.hasOwnProperty(key)){
                    let new_val = options[key]
                    //if (key == "program_counter") { new_val = new_val - 1 } //don't do. You set the pc to the pos just before the first instr to execute.
                    if (key == "do_list")         { new_val = Job.flatten_do_list_array(new_val) }
                    else if (key == "user_data")  { new_val = shallow_copy(new_val) }
                    else if (key == "name")       {} //don't allow renaming of the job
                    this[key] = new_val
                }
            }
            let maybe_symbolic_pc = this.program_counter
            this.program_counter = 0 //just temporarily so that instruction_location_to_id can start from 0
            const job_in_pc = Job.instruction_location_to_job(maybe_symbolic_pc, false)
            if (job_in_pc) {
                dde_error("Job." + this.name + " has a program_counter initialization<br/>" +
                          "of an instruction_location that contains a job. It shouldn't.")
            }
            this.program_counter = this.instruction_location_to_id(maybe_symbolic_pc)

            //this.robot_status      = []  use this.robot.robot_status instead //only filled in when we have a Dexter robot by Dexter.robot_done_with_instruction or a Serial robot
            this.rs_history        = [] //only filled in when we have a Dexter robot by Dexter.robot_done_with_instruction or a Serial robot
            this.sent_instructions = []

            this.start_time        = new Date()
            this.stop_time         = null
            this.status_code       = "starting" //before setting it here, it should be "not_started"
            this.stop_reason       = null

            this.wait_reason       = null //not used when waiting for instruction, but used when status_code is "waiting"
            this.wait_until_instruction_id_has_run = null
            this.highest_completed_instruction_id  = -1

            //this.iterator_stack    = []
            if (this.sent_from_job_instruction_queue.length > 0) { //if this job hasn't been started when another job
                 // runs a sent_to_job instruction to insert into this job, then that
                 //instruction is stuck in this job's sent_from_job_instruction_queue,
                 //so that it can be inserted into this job when it starts.
                 //(but NOT into its original_do_list, so its only inserted the first time this
                 //job is run.
                Job.insert_instruction(this.sent_from_job_instruction_queue, this.sent_from_job_instruction_location)
                //this.do_list.splice(this.program_counter, 0, ...this.sent_from_job_instruction_queue)
            }
            this.sent_from_job_instruction_queue = [] //send_to_job uses this. its on the "to_job" instance and only stores instructions when send_to_job has
                                                  //where_to_insert="next_top_level", or when this job has yet to be starter. (see above comment.)
            this.sent_from_job_instruction_location = null
            if (this.initial_instruction) { //do AFTER the sent_from_job_instruction_queue insertion.
                //Instruction.Control.send_to_job.insert_sent_from_job(this, sent_from_job)
                Job.insert_instruction(this.initial_instruction, {job: this, offset: "program_counter"})
            }
            //must be after  insrt queue and init_insrr processing
            if (this.program_counter >= this.do_list.length){ //note that maybe_symbolic_pc can be "end" which is length of do_list which is valid, though no instructions would be executed in that case so we error.
                dde_error("While starting job: " + this.name +
                    "<br/>the programer_counter is initialized to: " + this.program_counter +
                    "<br/>but the highest instruction ID in the do_list is: " +  (this.do_list.length - 1))
            }
            Job.last_job           = this


            this.added_items_count = new Array(this.program_counter) //This array parallels and should be the same length as the run items on the do_list.
            this.added_items_count.fill(0) //stores the number of items "added" by each do_list item beneath it
                //if the initial pc is > 0, we need to have a place holder for all the instructions before it
            this.go_state          = true
            //this.init_show_instructions()
            out("Starting job: " + this.name + " ...")
            this.color_job_button()
            this.robot.start(this)
        }
    }
    //show_instruction in editor
    static start_job_menu_item_action () {
        var full_src   = Editor.get_javascript()
        var start_cursor_pos = Editor.selection_start()
        var end_cursor_pos   = Editor.selection_end()
        var text_just_after_cursor = full_src.substring(start_cursor_pos, start_cursor_pos + 7)
        var start_of_job = -1
        if (text_just_after_cursor == "new Job") { start_of_job = start_cursor_pos }
        else { start_of_job = Editor.find_backwards(full_src, start_cursor_pos, "new Job") }
        if (start_of_job == -1) {
            warning("There's no Job definition surrounding the cursor.")
            var selection = Editor.get_javascript(true).trim()
            //if (selection.endsWith(",")) { selection = selection.substring(0, selection.length - 1) } //ok to have trailing commas in array new JS
            if (selection.length > 0){
                if (selection.startsWith("[") && selection.endsWith("]")) {}
                else {
                    selection = "[" + selection + "]"
                    start_cursor_pos = start_cursor_pos - 1
                }
                var eval2_result = eval_js_part2(selection)
                if (eval2_result.error_type) {} //got an error but error message should be displayed in output pane automatmically
                else if (Array.isArray(eval2_result.value)){ //got a do_list!
                   if (Job.j0 && Job.j0.is_active()) {
                        Job.j0.stop_for_reason("interrupted", "Start Job menu action stopped job.")
                        setTimeout(function() {
                                       Job.init_show_instructions_for_insts_only_and_start(start_cursor_pos, end_cursor_pos, eval2_result.value, selection)}
                        (Job.j0.inter_do_item_dur * 2) + 10)
                    }
                    else {
                        Job.init_show_instructions_for_insts_only_and_start(start_cursor_pos, end_cursor_pos, eval2_result.value, selection)
                    }
                }
                else {
                    shouldnt("Selection for Start job menu item action wasn't an array, even after wrapping [].")
                }
            }
            else {
                warning("When choosing the Start menu item with no surrounding Job definition<br/>" +
                        "you must select exactly those instructions you want to run.")
            }
        }
        else {
            Editor.select_javascript(start_of_job)
            if (Editor.select_call()){ //returns true if it manages to select the call.
                //eval_button_action()
                var job_src = Editor.get_javascript(true)
                const eval2_result = eval_js_part2(job_src)
                if (eval2_result.error_type) { } //got an error but error message should be displayed in Output pane automatically
                else {
                    const job_instance = eval2_result.value
                    const [pc, ending_pc]  = job_instance.init_show_instructions(start_cursor_pos, end_cursor_pos, start_of_job, job_src)
                    job_instance.start({show_instructions: true, program_counter: pc, ending_program_counter: ending_pc})
                }
            }
            else { warning("Ill-formed Job definition surrounding the cursor.") }
        }
    }

    static init_show_instructions_for_insts_only_and_start(start_cursor_pos, end_cursor_pos, do_list_array, selection){
        const job_instance = new Job({name: "j0", do_list: do_list_array})
        const begin_job_src = 'new Job ({name: "j0", do_list: '
        const job_src = begin_job_src + selection + "})"
        const start_of_job = start_cursor_pos - begin_job_src.length//beware, could be < 0
        job_instance.init_show_instructions(start_cursor_pos, end_cursor_pos, start_of_job, job_src)
        job_instance.start({show_instructions: true})
    }

    init_show_instructions(start_cursor_pos, end_cursor_pos, start_of_job, job_src){
        this.job_source_start_pos = start_of_job //necessary offset to range positions that are in the syntax tree
        const syntax_tree = esprima.parse(job_src, {range: true})
        const job_props_syntax_array = syntax_tree.body[0].expression.arguments[0].properties
        for (var prop_syntax of job_props_syntax_array){
            if (prop_syntax.key.name == "do_list"){
                this.do_list_syntax_array = prop_syntax.value.elements
                return this.instruction_ids_at_selection(start_cursor_pos, end_cursor_pos, start_of_job, syntax_tree)
            }
        }
        dde_error("Job." + this.name + " apparently has no do_list property.")
    }

    //returns pc to set for starting job that cursor is in, or 0, start at begining,
    instruction_ids_at_selection(start_cursor_pos, end_cursor_pos, start_of_job, syntax_tree) {
        var start_cursor_pos_in_job_src = start_cursor_pos - start_of_job
        var end_cursor_pos_in_job_src   = end_cursor_pos   - start_of_job
        var result_start = null
        var result_end   = "end"
        for(let i = 0; i <  this.do_list_syntax_array.length; i++) {
            var do_list_item_syntax = this.do_list_syntax_array[i]
            //var inst_start_pos = do_list_item_syntax.range[0]
            var inst_start_pos = do_list_item_syntax.range[0]
            var inst_end_pos   = do_list_item_syntax.range[1]
            if (result_start === null){
                if (start_cursor_pos_in_job_src <= (inst_end_pos + 1)){ //comma at end still in the instr
                    result_start = i //first time through, cursor before do_list, just start at 0
                    if (start_cursor_pos == end_cursor_pos) { //no selection
                        result_end = "end"
                        break;
                    }
                    else if (end_cursor_pos_in_job_src <= (inst_end_pos + 1)){ //there's a selection, but it starts and ends in just one instruction
                        result_end = i + 1
                        break;
                    }
                }
            }
            else { //looking for result_end
                if (end_cursor_pos_in_job_src <= (inst_end_pos + 1)){ //comma at end still in the instr
                    result_end = i + 1
                    break;
                }
            }
        }
        return [result_start, result_end]
    }

    select_instruction_maybe(cur_do_item){
        if(this.show_instructions && this.do_list_syntax_array){
            console.log("    now processing instruction: " + stringify_value(cur_do_item))
            const orig_instruction_index = this.orig_args.do_list.indexOf(cur_do_item)
            if(orig_instruction_index != -1){
                const range = this.instruction_text_range(orig_instruction_index)
                Editor.select_javascript(range[0], range[1])
            }
        }
    }
    instruction_text_range(orig_instruction_index){
        const array_elt_syntax_tree = this.do_list_syntax_array[orig_instruction_index]
        return [array_elt_syntax_tree.range[0] + this.job_source_start_pos,
                array_elt_syntax_tree.range[1] + this.job_source_start_pos]
    }
    //end show_instruction in editor
    //Job BUTTONS______
    get_job_button_id(){ return this.name + "_job_button_id"}

    get_job_button(){
        const the_id = this.get_job_button_id()
        var but_elt = window[the_id]
        return but_elt
    }

    add_job_button_maybe(){
        var but_elt = this.get_job_button()
        if (!but_elt){
            const job_name = this.name
            const the_id = this.get_job_button_id()
            const the_html = '<button style="margin-left:10px; vertical-align:top;" id="' + the_id + '">'+ job_name + '</button>'
            $("#jobs_button_bar_id").append(the_html)
            but_elt = window[the_id]
            but_elt.onclick = function(){
                const the_job = Job[job_name]
                if (the_job.status_code == "suspended"){
                    the_job.unsuspend()
                }
                else if(the_job.is_active()){
                    the_job.stop_for_reason("interrupted", "User stopped job")
                }
                else {
                    the_job.start()
                }
            }
            this.color_job_button()
        }
    }

    remove_job_button(){
        var but_elt = this.get_job_button()
        if(but_elt){  $(but_elt).remove()  }
    }

    set_status_code(status_code){
        if (Job.status_codes.includes(status_code)){
            this.status_code = status_code
            this.color_job_button()
        }
        else {
            shouldnt("set_status_code passed illegal status_code of: " + status_code +
                     "<br/>The legal codes are:</br/>" +
                     Job.status_codes)
        }
    }

    color_job_button(){
        var but_elt = this.get_job_button()
        var bg_color = null
        var tooltip  = ""
        switch(this.status_code){
            case "not_started":
                bg_color = "#CCCCCC";
                tooltip  = "This job has not been started since it was defined.\nClick to start this job."
                break; //defined but never started.
            case "starting":
                bg_color = "#88FF88";
                tooltip  = "This job is in the process of starting.\nClick to stop it."
                break;
            case "running":
                bg_color = "#88FF88";
                tooltip  = "This job is running.\nClick to stop this job."
                break;
            case "suspended":
                bg_color = "#FFFF11"; //bright yellow
                tooltip  = "This job is suspended.\nClick to unsuspend it.\nAfter it is running, you can click to stop it."
                break; //yellow
            case "waiting":
                bg_color = "#FFFF66"; //pale yellow
                tooltip  = "This job is waiting for:\n" + this.wait_reason + "\nClick to stop this job."
                break; //yellow
            case "completed":
                bg_color = "#e6b3ff" // purple. blues best:"#66ccff"  "#33bbff" too dark  //"#99d3ff" too light
                tooltip  = "This job has successfully completed.\nClick to restart it."
                break;
            case "errored":
                bg_color = "#FF4444";
                tooltip  = "This job errored with:\n" + this.stop_reason + "\nClick to restart this job."
                break;
            case "interrupted":
                bg_color = "#ff7b00"; //orange
                tooltip  = "This job was interrupted by:\n" + this.stop_reason + "\nClick to restart this job."
                break;
        }
        but_elt.style.backgroundColor = bg_color
        but_elt.title                 = tooltip
    }
    //end of jobs buttons

    is_active(){ return ((this.status_code != "not_started") && (this.stop_reason == null)) }

    //called in utils stringify_value    used for original_do_list
    static non_hierarchical_do_list_to_html(a_do_list){
        var result = "<table><tr><th title='The instruction_id is the order of the instruction in the do_list.\nSame as the program counter at send time.'>ID</th>" +
                                "<th title='The instruction type and its arguments'>Instruction</th></tr>"
        for(var i = 0; i < a_do_list.length; i++){
            result +=  "<tr><td>" + i + "</td><td>" + stringify_value(a_do_list[i]) + "</td><td></tr>"
        }
        result += "</table>"
        return "<details><summary>original do_list</summary>" + result + "</details>"
    }

    do_list_to_html(){
        Job.do_list_to_html_set_up_onclick()
        return "<details><summary>do_list</summary>" +
                this.do_list_to_html_aux(0, 1) +
                "</details>"
    }

    static do_list_to_html_set_up_onclick(){
        setTimeout(function(){
            let elts = document.getElementsByClassName("do_list_item")
            for (let i = 0; i < elts.length; i++) { //more clever looping using let elt of elts breaks but only on windows deployed DDE
                let elt = elts[i]
                elt.onclick = Job.do_list_item_present_robot_status }
        }, 500)
    }
    //runs in UI
    static do_list_item_present_robot_status(event){
       event.stopPropagation();
            let elt = event.target
            let [job_name, instruction_id] = elt.dataset.do_list_item.split(" ")
            Job.show_robot_status_history_item(job_name, parseInt(instruction_id))
    }

    instruction_id_to_rs_history_item(id){
        for (let item of this.rs_history){
            if (item[Dexter.INSTRUCTION_ID] == id) { return item }
        }
        if (this.keep_history){
            shouldnt("Job.instruction_id_to_rs_history_item passed id: " + id + " but couldn't be found in rs_history: " + this.rs_history)
        }
        else { return null }
    }

    current_instruction(){
        return this.do_list[this.program_counter]
    }

    is_top_level_do_item(do_item){
        return this.orig_args.do_list.includes(do_item)
    }

    at_sync_point(sync_point_name){
        let ins = this.current_instruction()
        return ((ins instanceof Instruction.Control.sync_point) &&
                (ins.name == sync_point_name))
    }

    at_or_past_sync_point(sync_point_name){
        for(let a_pc = this.program_counter; a_pc >= 0; a_pc--){
            let ins = this.do_list[a_pc]
            if ((ins instanceof Instruction.Control.sync_point) &&
                (ins.name == sync_point_name)) { return true }
        }
        return false
    }

    static show_robot_status_history_item(job_name, instruction_id){
        let job_instance    = Job[job_name]
        let rs_history_item = job_instance.instruction_id_to_rs_history_item(instruction_id)
        if (rs_history_item) {
            let table_html      = Dexter.robot_status_to_html_table(rs_history_item)
            show_window({content: table_html,
                         title: "Robot status for " + job_name + ", instruction: " + instruction_id,
                         width:  800,
                         height: 380})
        }
        else {
            out("Robot: " + job_instance.robot.name + " in job: " + job_instance.name +
                " has not kept robot_status for instruction: "    + instruction_id + "." +
                "<br/>Job " + job_instance.name + " keep_history is: " + job_instance.keep_history,
                "red")
        }
    }

    do_list_to_html_aux(id_to_start_from = 0, indent_level = 0, sub_item_count){
        if (!sub_item_count) {
            if (this.do_list) { sub_item_count = this.do_list.length}
            else { sub_item_count = 0 }
        }
        let result = ""
        let sub_sub_items_processed = 0
        for(let sub_item_index = 0; sub_item_index < sub_item_count; sub_item_index++){
            let id = id_to_start_from + sub_item_index + sub_sub_items_processed
            if (id >= this.do_list.length) {return result}
            let item = this.do_list[id]
            let new_sub_item_count = this.added_items_count[id]
            let class_html = "class='do_list_item' "
            let rs_button = ""
            if (Instruction.is_instruction_array(item)) { rs_button = " <button data-do_list_item='" + this.name + " " + id + "' + title='Show the robot status as it was immediately after this instruction was run.'" + class_html + ">RS</button> "}
            let item_text =  "<span title='instruction_id'>id=" + id +
                             "</span>&nbsp;<span title='Number of sub_instructions&#13;added by this instruction below it.'> si=" + new_sub_item_count + "</span>" +
                             rs_button +
                             "&nbsp;" + Instruction.text_for_do_list_item(item) //core of the_item
            let html_indent = 'style="margin-left:' + (indent_level * 20) + 'px; background-color:' + Instruction.instruction_color(item) + ';"'

            let actual_sub_items_grabbed_this_iter
            if (new_sub_item_count > 0) {
                item_text = "<details " + html_indent + "><summary>" + item_text + "</summary>"
                let sub_items_text = this.do_list_to_html_aux(id + 1, indent_level + 1, new_sub_item_count)
                item_text = item_text + sub_items_text + "</details>"
                actual_sub_items_grabbed_this_iter = (sub_items_text.match(/<div|<details/g) || []).length
                sub_sub_items_processed += actual_sub_items_grabbed_this_iter
            }
            else {
                item_text = "<div " + html_indent + ">" + item_text + "</div>"
                actual_sub_items_grabbed_this_iter = 0
              }

            result += item_text
        }
        return result
    }
    time_to_string(a_time){
        if (a_time){
            return a_time.getHours() + ":" + a_time.getMinutes() + ":" + a_time.getSeconds()
        }
        else { return "null" }
    }
    stringify(){
        let stat_code = this.status_code
        if (stat_code == "completed") { stat_code = "<span style='color:#00b300;'>completed</span>" }
        else if ((stat_code === "errored") || (stat_code === "interrupted")) {
            stat_code = "<span style='color:#cc0000;'>" + stat_code + "</span>"
        }
        let dur_string = milliseconds_to_human_string(this.stop_time - this.start_time)
        let result = "Job <i>name</i>: "        + this.name                  + ", <i>job_id</i>: " + this.job_id + ", <i>simulate</i>: " + this.robot.simulate + "<br/>" +
                     "<i>start_time</i>: "      + this.time_to_string(this.start_time) +
                     ", <i>stop_time</i>:  "    + this.time_to_string(this.stop_time)  +
                     ", <i>dur</i>: "           + dur_string + "<br/>" +
                     "<i>program_counter</i>: " + this.program_counter       + ", <i>status_code</i>: " + stat_code + ",<br/>" +
                     "<i>stop_reason</i>: "     + this.stop_reason           + ", <i>wait_reason</i>: " + this.wait_reason + "<br/>" +
                     "<i>wait_until_instruction_id_has_run</i>: " + this.wait_until_instruction_id_has_run + "<br/>" +
                     "<i>highest_completed_instruction_id</i>: " + this.highest_completed_instruction_id + "<br/>" +
                     "<i>user_data</i>: " + stringify_value(this.user_data) + ",<br/>" +
                      Job.non_hierarchical_do_list_to_html(this.orig_args.do_list) +
                      this.do_list_to_html() +
                      Dexter.sent_instructions_to_html(this.sent_instructions) +
                      Dexter.make_show_rs_history_button_html(this.job_id)     +
                      "<fieldset style='background-color:#EEEEEE;'><legend>Robot</legend>" + this.robot.stringify() + "</fieldset>"

        return result
    }

    //takes nested items in array and makes flattened list where the elts are
    //a dexter instrution array, a fn, or something else that can be a do_item.
    //could possibly return [] which will be ignored by do_next_item
    static flatten_do_list_array(arr, result=[]){
       for(let elt of arr){
           if      (Instruction.is_instruction_array(elt))   { result.push(elt) }
           else if (Array.isArray(elt)) { //if elt is empty array, tbis works fine too.
                                                             Job.flatten_do_list_array(elt, result)
           }
           else if (elt == null)                             {} //includes undefined
           else if (Instruction.is_control_instruction(elt)) { result.push(elt) }
           else if (typeof(elt) === "function")              { result.push(elt) }
           else if (is_iterator(elt))                        { result.push(elt) }
           else if (elt === "debugger")                      { result.push(elt) }
           else {
                throw(TypeError("Job.flatten_do_list_array got illegal item on do list: " + elt))
           }
       }
       return result
    }
    //can't be an instruction, must be called from a method
    //unsuspend is like start, ie it calls start_after_connected which calls send get status
    // which calls robot_done_with_instruction which calls set_up_next_do(1)
    unsuspend(){
        if (this.status_code == "suspended"){
            this.set_status_code("running")
            this.set_up_next_do(1)
        }
    }
    record_sent_instruction_stop_time(ins_id, stop_time){
        if (this.keep_history){
            for(let ins of this.sent_instructions){
                if (ins[Instruction.INSTRUCTION_ID] === ins_id){
                    ins[Instruction.STOP_TIME] = stop_time
                    return
                }
            }
            shouldnt("a_job.record_sent_instruction_stop_time  passed ins_id: " + ins_id +
                     " but couldn't find an instruction with that id in Job." + this.name + ".sent_instructions")
        }
    }

    xyz_for_rs_history(){
        let result = []
        let rob = this.robot
        for(let rs of this.rs_history){
            let angles = [rs[Dexter.J1_ANGLE], rs[Dexter.J2_ANGLE], rs[Dexter.J3_ANGLE], rs[Dexter.J4_ANGLE], rs[Dexter.J5_ANGLE]]
            let a_xyz  = Kin.J_angles_to_xyz(angles, rob.base_xyz, rob.base_plane, rob.base_rotation)[5]
            result.push(a_xyz)
        }
        return result
    }



}
Job.status_codes = ["not_started", "starting", "running", "completed",
                    "suspended", "waiting",   //(wait_until, sync_point)
                    "errored", "interrupted" //(user stopped manually),
                    ]

Job.global_user_data = {}
Job.job_id_base = 0 //only used for making the job_id.
Job.disable_all = false //allows all jobs to run
Job.all_names = [] //maintained in both UI and sandbox/ used by replacement series job names

//note that once we make 1 job instance with a name, that binding of
//Job.the_name never goes away, and that name will always be in the
//the all_names list. But if you redefine a Job (with the same name)
//the old value of that name is gc'd.
Job.remember_job_name = function(job_name){
    if (!Job.all_names.includes(job_name)){
        Job.all_names.push(job_name)
        $("#videos_id").prepend("<option>Job: " + job_name + "</option>")
    }
}

Job.forget_job_name = function(job_name){
    let i = Job.all_names.indexOf(job_name)
    if (i != -1){
        Job.all_names.splice(i, 1)
    }
}

//we can't send to sandbox or UI, this has to work in both.
//that's why we have Job.remember_job_name().
//used by series replacement
Job.is_job_name = function(a_string){
    return Job.all_names.includes(a_string)
}

Job.all_jobs = function(){
    let result = []
    for(let name of Job.all_names){
        result.push(Job[name])
    }
    return result
}

Job.job_id_to_job_instance = function(job_id){
    for(let name of Job.all_names){
        if (Job[name].job_id === job_id) {return Job[name]}
    }
    return null
}

Job.last_job = null

Job.stop_all_jobs = function(){
    var stopped_job_names = []
    for(var j of Job.all_jobs()){
        if ((j.stop_reason == null) && (j.status_code != "not_started")){
            j.set_status_code("interrupted")
            j.stop_reason = "User stopped all jobs."
            j.stop_time   = new Date()
            if (j.robot.heartbeat_timeout_obj) { clearTimeout(j.robot.heartbeat_timeout_obj) }
            stopped_job_names.push(j.name)
        }
       // j.robot.close() //does not delete the name of the robot from Robot, ie Robot.mydex will still exist, but does disconnect serial robots
          //this almost is a good idea, but if there's a job that's stopped but for some reason,
          //its serial port is still alive, better to call serial_disconnect_all()
        if (j.robot instanceof Dexter) { j.robot.close_robot() } //needed when wanting to start up again, exp with dexter0
    }
    serial_disconnect_all()
    if (stopped_job_names.length == 0){
        out("There are no active jobs to stop.")
    }
    else {
       out("Stopped jobs: " + stopped_job_names)
    }
}

Job.clear_stopped_jobs = function(){
    var cleared_job_names = []
    for(var j of Job.all_jobs()){
        if ((j.stop_reason != null) || (j.status_code == "not_started")){
            delete Job[j.name]
            Job.forget_job_name(j.name)
            cleared_job_names.push(j.name)
            j.remove_job_button()
            if (j == Job.last_job) { Job.last_job = null }

        }
    }
    if ((Job.last_job === null) && (Job.all_names.length > 0)){
        Job.last_job = last(Job.all_names) //not technically the last job created since
        //that was deleted
        //and might not even be the last job "redefined".
        //but its pretty close and the use of last_job isn't really sensitve to
        //being precise so this is pretty good.
    }
    if (cleared_job_names.length == 0){
        out("There are no stopped jobs to clear.")
    }
    else { out("Cleared jobs: " + cleared_job_names) }
}

//used in making robot_status_history window.
/* this functionality doesn't match its name, and its never called so don't have it!
Job.prototype.highest_sent_instruction_id = function(){
    if (this.sent_instructions.length > 0){
        return this.sent_instructions[0]
    }
    else { return null }
}*/

Job.report = function(){
        if (Job.all_names.length == 0){
            out("Either no jobs have been created in this session,<br/>" +
                "or all the jobs have been cleared.<br/>" +
                "See the <button>Jobs&#9660;</button> <b>Insert example</b> menu item<br/>" +
                "for help in creating a job.")
        }
        else {
            result  = "<table style='border: 1px solid black;border-collapse: collapse;'><tr style='background-color:white;'><th>Job Name</th><th>ID</th><th>Robot</th><th>Start Time</th><th>Stop Time</th><th>Status</th></tr>"
            for (var j of Job.all_jobs()){
                var start_time = "Not started"
                var stop_time = ""
                if (j.start_time){
                    start_time = j.start_time.getHours()   + ":" +
                        j.start_time.getMinutes() + ":" +
                        j.start_time.getSeconds() + ":" +
                        j.start_time.getMilliseconds()
                    stop_time = "ongoing"
                }
                if (j.stop_time){
                    stop_time = j.stop_time.getHours()   + ":" +
                        j.stop_time.getMinutes() + ":" +
                        j.stop_time.getSeconds() + ":" +
                        j.stop_time.getMilliseconds()
                }
                var action = 'Job.print_out_one_job,,' + j.name
                //var name = "<a href='#' title='Click for details on this job.' class='onclick_via_data' data-onclick='" + action + "'>" + j.name + "</a>"
                var job_name = "<a href='#' title='Click for details on this job.' class='onclick_via_data' data-onclick='" + action + "'>" + j.name + "</a>"

                result += "<tr/><td>" + job_name + "</td><td>" + j.job_id + "</td><td>" + j.robot.name + "</td><td>" + start_time + "</td><td>" + stop_time + "</td><td>" + j.status() + "</td><tr>"
            }
            result += "</table>"
            out(result)
            install_onclick_via_data_fns()
        }
}

Job.prototype.print_out = function(){
    out(this.stringify())
    //setTimeout(function(){install_onclick_via_data_fns()}, 200) //needs to let the html render.
}

Job.print_out_one_job = function(job_name){
        var j = Job[job_name]
        j.print_out()
}

Job.prototype.status = function (){
    if (this.stop_reason)      { return this.status_code + ": " + this.stop_reason }
    else if (this.wait_reason) { return this.status_code + ": " + this.wait_reason}
    else {
       let len = this.orig_args.do_list.length
       if ( this.do_list) { len = this.do_list.length }
       let pc = 0
       if (this.program_counter) { pc = this.program_counter }
       return this.status_code + ", pc: " + pc + " of " + len
    }
}

Job.prototype.finish_job = function(){ //regardless of more to_do items or wiating for instruction, its over.
    this.robot.finish_job()
    this.color_job_button()
    this.print_out()
    out("Done with job: " + this.name)
}

Job.go_button_state = true

Job.set_go_button_state = function(bool){ //called initially from sandbox
    pause_id.checked = !bool
    Job.go_button_state = bool
}

Job.go = function(){
    if (Job.go_button_state){
        let any_active_jobs = false
        for(let a_job of Job.all_jobs()){
            if (a_job.is_active()){
                any_active_jobs = true
                if (a_job.go_state) {} //user hit go button with go_button_state true  and a_job go true. let it run
                    //a_job.set_up_next_do(a_job.pause_next_program_counter_increment, false)
                else { //go_button state is true but  a_job go is false so turn it on an run
                    a_job.go_state = true
                    a_job.set_up_next_do(a_job.pause_next_program_counter_increment, false)
                }
            }
        }
        if (!any_active_jobs) { warning("There are no active jobs.", true) }
    }
    else { //go_button_state is false
        let any_active_jobs = false
        for(let a_job of Job.all_jobs()){
            if (a_job.is_active()){
                any_active_jobs = true
            //if (a_job.go_state) {
                a_job.set_up_next_do(a_job.pause_next_program_counter_increment, true) //allow once
            //}
            //else {} //go_button_state is false and a_job go is false, already paused,  do nothing
            }
        }
        if (!any_active_jobs) { warning("There are no active jobs.", true) }
    }
    return "dont_print"
}

//in EVERY call, as of mar 7, 2016 the arg is 1. So probably should just get rid of the arg.
//nope: we need it to be 0 when we have a fn that is "looping" checking for some
//condition to be true, in which case it moves on to incfement by 1, like "sleep" or something.
//this is important because send_to_job  might do insert of its instruction "after_pc"
//and we want that to be in a "good" spot, such that the inserted insetruction
//will run next. So we want to keep the incrementing of the PC to be
//in the setTimeout so that when we do a insert "after_pc",
//that inserted instruction is run next.
Job.prototype.set_up_next_do = function(program_counter_increment = 1, allow_once=false){ //usual arg is 1 but a few control instructions that want to take a breath call it with 0
    var job_instance = this
    if (Job.go_button_state || allow_once){ //the normal case
        if (program_counter_increment > 0) {
            job_instance.highest_completed_instruction_id = job_instance.program_counter
        }
        job_instance.program_counter += program_counter_increment
        setTimeout(function(){
                        job_instance.do_next_item()
                    },
                    this.inter_do_item_dur)
    }
    else {
        job_instance.pause_next_program_counter_increment = program_counter_increment
        job_instance.go_state = false
        let suffix = ""
        if          (job_instance.program_counter == -1) { suffix = " (initing robot status)" }
        else if     (job_instance.program_counter == 0)  { suffix = " (your first instruction)" }
        else if     (job_instance.program_counter == job_instance.do_list.length - 1) { suffix = " (last instruction)" }
        else if     (job_instance.program_counter == job_instance.do_list.length - 2) { suffix = " (2nd to last instruction)" }
        let out_text = job_instance.name + " paused after program_counter=" + job_instance.program_counter + " of " +
                       job_instance.do_list.length + suffix + "<br/>"
        if(job_instance.program_counter >= 0) {
            out_text +=  "Prev ins: " + Instruction.text_for_do_list_item_for_stepper(this.do_list[job_instance.program_counter])
        }
        else { out_text +=  "Prev ins: None" }
        out_text += "<br/> Next ins: "
        if ((job_instance.program_counter + 1) >= job_instance.do_list.length){
            out_text +=  "None"
        }
        else {
            out_text +=  Instruction.text_for_do_list_item_for_stepper(this.do_list[job_instance.program_counter + 1])
        }
        out(out_text, "brown", true)
    }
}

Job.prototype.stop_for_reason = function(status_code, //"errored", "interrupted", "completed"
                                         reason_string){
    this.set_status_code(status_code)
    this.stop_reason = reason_string
    this.stop_time   = new Date()
}


Job.prototype.do_next_item = function(){ //user calls this when they want the job to start, then this fn calls itself until done
    //this.program_counter += 1 now done in set_up_next_do
    if (this.show_instructions){
        console.log("Top of do_next_item in job: " + this.name + " with PC: " + this.program_counter)
    }
    //this.pc_at_do_item_start = this.program_counter
    if (Job.disable_all){//stop even if we're waiting for instrunctions to be confirmed done.
        this.stop_for_reason("interrupted", "Job: " + this.name + " and all jobs disabled.")
        this.finish_job()
    }
    else if ((this.status_code == "interrupted") || //put before the wait until instruction_id because interrupted is the user wanting to halt, regardless of pending instructions.
             (this.status_code == "errored")){
        this.finish_job()
    }
    else if (this.wait_until_instruction_id_has_run || (this.wait_until_instruction_id_has_run === 0)){ //the ordering of this clause is important. Nothing below has to wait for instructions to complete
        //wait for the wait instruction id to be done
        //the waited for instruction coming back thru robot_done_with_instruction will call set_up_next_do(1)
        //so don't do it here. BUT still have this clause to block doing anything below if we're waiting.
    }
    else if (this.stop_reason){ this.finish_job() }
    else if (this.program_counter >= this.instruction_location_to_id(this.ending_program_counter)) {  //this.do_list.length
             //the normal stop case
        if ((this.robot instanceof Dexter) &&
            ((this.do_list.length == 0) ||
            (last(this.do_list)[Dexter.INSTRUCTION_TYPE] != "g"))){
            this.program_counter = this.do_list.length //probably already true, but just to make sure.
            this.do_list.splice(this.do_list.length, 0, Dexter.get_robot_status()) //this final instruction naturally flushes dexter'is instruction queue so that the job will stay alive until the last insetruction is done.
            this.set_up_next_do(0)
        }
        else if (!this.stop_reason){
            var stat = "completed"
            var reas = "Finished all do_list items."
            if(this.stop_job_instruction_reason){
                stat = "interrupted"
                reas = this.stop_job_instruction_reason
            }
            this.stop_for_reason(stat, reas)
            this.finish_job()
        }
        else { this.finish_job() }
    }

    else{
        //regardless of whether we're in an iter or not, do the item at pc. (might or might not
        //have been just inserted by the above).
        var cur_do_item = this.current_instruction()
        this.select_instruction_maybe(cur_do_item)
        if (this.program_counter >= this.added_items_count.length) { this.added_items_count.push(0)} //might be overwritten further down in this method
        else if (this.added_items_count[this.program_counter] > 0) { //will only happen if we go_to backwards,
           //in which case we *might* call an instruction twice that makes some items that it adds to the to_do list.
           //so we want to get rid of those items and "start over" with that instruction.
            const sub_items_count = this.added_items_count[this.program_counter]
            this.do_list.splice(this.program_counter + 1, sub_items_count) //cut out the sub-items under the pc instruction
        }
        if (cur_do_item == null){ //nothing to do, just skip it.
            this.set_up_next_do(1)
        }
        else if ((this.sent_from_job_instruction_queue.length > 0) &&
                 this.is_top_level_do_item(cur_do_item)){
            //bad, inserts after pc not AT pc this.insert_instructions(this.sent_from_job_instruction_queue) //all items on queue are next_top_level, so just insert them all.
            this.do_list.splice(this.program_counter, 0, ...this.sent_from_job_instruction_queue)
            //note we're inserting sent_from_job instructions, not the REAL instruction we want to execute.
            //that's because in the hierarchical do_list display, we want to see where those REAL instructions came from for debugging purposes.
            this.sent_from_job_instruction_queue = []
            this.set_up_next_do(0)
        }
        else if (Instruction.is_control_instruction(cur_do_item)){
            cur_do_item.do_item(this)
        }
        else if (Instruction.is_instruction_array(cur_do_item)){
            this.wait_until_instruction_id_has_run = this.program_counter
            this.send(cur_do_item)
        }
        else if (Array.isArray(cur_do_item)){
            this.handle_function_call_or_gen_next_result(cur_do_item, cur_do_item)
            //note that a user normally wouldn't directly put an array on the do_list,
            //but Job.insert_instruction very likely would to put > 1 instruction on
        }
        else if (is_iterator(cur_do_item)){ //must be before "function" because an iterator is also of type "function".
            var next_obj = cur_do_item.next()
            var do_items = next_obj.value
            if (next_obj.done){ //don't insert cur_do_item (the iterator) cause we're all done.
                if (do_items) { //happens when our gen fn has a return value.
                    if(Instruction.is_instructions_array(do_items)){ this.insert_instructions(do_items) }
                    else { this.insert_single_instruction(do_items) }
                    this.set_up_next_do(1)
                }
                else { //normal, we're beyond the last yield but just did our next call to "exhaust" the gen. nothing to do for cur_do_item
                    this.set_up_next_do(1)
                }
            }
            else { //iterator not done. push the next_obj.value into the do_list followed by the iterator in cur_do_item
                if(Instruction.is_instructions_array(do_items)){
                    do_items = do_items.slice(0) //copy the do_items just in case user is hanging on to that array, we don't want to mung it.
                }
                else if (do_items == null) { do_items = [] } //no point in sticking null on do_list as its a no-op. An iterator might return null because
                               //its waiting for some callback to complete as in dxf_to_instructions,
                               //so throw out the null and let do_list loop around again.
                else {//just one item
                    do_items = [do_items]
                }
                do_items.push(cur_do_item) //add the iterator on the end so that after we do these "next" items, we'll call next again on the iterator
                this.insert_instructions(do_items)
                this.set_up_next_do(1)
            }
        }
        //else if (is_iterator(cur_do_item)){ //calling a generator fn returns an iterator
        //    this.iterator_stack.push([cur_do_item, this.program_counter])
        //    this.set_up_next_do(1)
        //}
        else if (typeof(cur_do_item) == "function"){
            var do_items = cur_do_item.call(this)
            this.handle_function_call_or_gen_next_result(cur_do_item, do_items)
        }
        else if (cur_do_item == "debugger"){
            Job.set_go_button_state(false)
            this.set_up_next_do(1)
        }
        else {
            this.stop_for_reason("errored", "Job: " + this.name + " got illegal do_item on do_list of: " +
                stringify_value(cur_do_item))
            //It's over, Jim, So don't take a breath, by calling set_up_next_do(0),
            //just kill it quickly before anything else can happen.
            //we don't want to increment the pc,
            this.do_next_item()
        }
    }
}

/*cur_do_item is the fn, do_items is the val returned from calling it.
 cur_do_item merely for error message. the real item to do is do_items which might be an array of items

 A do_list function on the do_list can return:
 - an instruction_array (1 letter op_let)  stick it on the do_list and send it.
 - an array of items to stick on the do_list.
 - another function. stick it on the do_list and next time call it.\
 - a generator function
 - an iterator 
 Stick them all (except for iterator) on the do_list and execute them.
 */
Job.prototype.handle_function_call_or_gen_next_result = function(cur_do_item, do_items){
    if ((do_items == null) || (Array.isArray(do_items) && (do_items.length == 0))) {//ok, just nothing to insert
        this.set_up_next_do(1)
    }
    else if (do_items == "dont_call_set_up_next_do"){
        //do nothing as the fn that was called is expected to have called its
        //own do_next_item, perhaps via a "I'm done callback" to the fn that
        //does the real work. such as beep({callback: function(){job_instance.set_up_next_do() } )
    }
    else if (Instruction.is_instruction_array(do_items)   ||
             Instruction.is_control_instruction(do_items) ||
             (typeof(do_items) == "function") //ok if this includes generator functions
             ) {
        this.insert_single_instruction(do_items)
        this.added_items_count[this.program_counter] = 1
        this.set_up_next_do(1)
    }
    else if (Array.isArray(do_items)){
        let flatarr = Job.flatten_do_list_array(do_items)
        this.insert_instructions(flatarr)
        this.added_items_count[this.program_counter] = flatarr.length
        this.set_up_next_do(1)
    }
    else if (is_iterator(do_items)){ //calling a generator fn returns an iterator
        //this.iterator_stack.push([do_items, this.program_counter])
        //this.set_up_next_do(1)
        this.insert_single_instruction(do_items)
        this.added_items_count[this.program_counter] = 1
        this.set_up_next_do(1)
    }
    else if (do_items == "debugger"){
        this.insert_single_instruction(do_items)
        this.added_items_count[this.program_counter] = 1
        this.set_up_next_do(1)
    }
    else {
        this.stop_for_reason("errored", "do_item function: " + stringify_value(cur_do_item) +
            " returned invalid value: "     + stringify_value(do_items))
        //its over. Don't take a breath with set_up_next_do, kill it off.
        //don't increment pc
        this.do_next_item()
    }
}

Job.prototype.insert_single_instruction = function(instruction_array){
    let the_do_list = this.do_list
    //if (!the_do_list){ the_do_list = this.orig_args.do_list }
    the_do_list.splice(this.program_counter + 1, 0, instruction_array);
}

Job.prototype.insert_instructions = function(array_of_do_items){
    this.do_list.splice.apply(this.do_list, [this.program_counter + 1, 0].concat(array_of_do_items));
}

Job.prototype.send = function(instruction_array){ //if remember is false, its a heartbeat
    var instruction_id
    if(instruction_array[Instruction.INSTRUCTION_TYPE] == "h") { //op_let is first elt UNTIL we stick in the instuction id
        //instruction_id = -1 //heartbeat always has instruction id of -1
        shouldnt('Job.send passed "h" instruction (heartbeat) but that shouldnt happen as heartbeat is handled lower level by Dexter robot')
    }
    else if (this.status_code == "not_started"){ //instuction_array should be a Job.get_robot_status
        instruction_id = -3 //looked at by robot_done_with_instruction
    }
    else if (this.status_code == "starting"){ //instuction_array should be a Job.get_robot_status
        instruction_id = -1 //looked at by robot_done_with_instruction
    }
    else{
        instruction_id = this.program_counter
    }
    instruction_array[Instruction.JOB_ID]         = this.job_id
    instruction_array[Instruction.INSTRUCTION_ID] = instruction_id
    instruction_array[Instruction.START_TIME]     = Date.now()
    if (this.keep_history){
        this.sent_instructions.push(instruction_array) //for debugging mainly
    }
    this.robot.send(instruction_array)
}

//"this" is the from_job
// params is the instance of Instruction.send_to_job
//send_to_job_receive_done is kinda like Serial and Dexter.robot_done_with_instruction
//but used only with send_to_job and only when the from_job is waiting for the
//to_job to complete the ins it was sent before allowing the from_job to continue.
Job.prototype.send_to_job_receive_done = function(params){
    if (this.wait_until_instruction_id_has_run == params.from_instruction_id){
        this.highest_completed_instruction_id  = params.from_instruction_id
        this.wait_until_instruction_id_has_run = null
        //below is done in Instruction.Control.destination_send_to_job_is_done.do_item
        //for (var user_var in params){
        //    if (Instruction.Control.send_to_job.param_names.indexOf(user_var) == -1){
        //        var val = params[user_var]
        //        this.user_data[user_var] = val
        //    }
        //}
        this.user_data[params.status_variable_name] = "done"
        this.set_up_next_do(1)
    }
    else {
        shouldnt("In job: " + this.name + " send_to_job_receive_done got params.from_instruction_id of: " +
            params.from_instruction_id +
            " but wait_until_instruction_id_has_run is: " + this.wait_until_instruction_id_has_run)
    }
}

//right now I don't use this (a_job) but will need it in the future to get a_job.robot. its transformations
Job.prototype.dxf_to_instructions = function (filepath, scale = 1, up_distance = 2000){
    let  the_content
    if((filepath.length <= 512) &&
        (filepath.endsWith(".dxf") || filepath.endsWith(".DXF"))){
        the_content = file_content(filepath)
    }
    else { the_content = filepath }
    scale = scale_to_micron_factor(scale)
    let parser = new DxfParser();
    try {
        let dxf_entities = parser.parseSync(the_content).entities
        let prev_xyz = null
        let ins = []
        for(let i = 0; i < dxf_entities.length; i++){
            ent = dxf_entities[i]
            if (ent.type == "LINE"){
                let a = point_object_to_array(ent.vertices[0])
                let b = point_object_to_array(ent.vertices[1])
                a = scale_point(a, scale)
                b = scale_point(b, scale)
                if (prev_xyz == null) {
                    if ((dxf_entities.length > 1) &&
                        (point_equal(a, point_object_to_array(dxf_entities[1].vertices[0])) ||
                         point_equal(a, point_object_to_array(dxf_entities[1].vertices[1])))){
                        let c = a; a = b; b = c //swap
                    }
                    ins.push(Dexter.move_to([a[0], a[1], a[2] + up_distance]))
                    ins.push(Dexter.move_to(a))
                    if (!point_equal(a, b)){
                        ins.push(Dexter.move_to(b))
                    }
                    prev_xyz = b
                }
                else {
                    if (point_equal(prev_xyz, b)){
                        let c = a; a = b; b = c //swap
                    }
                    //Now if prev is equal to orig a or orig b, then
                    //that orig equal point is in a, ie a and b are ordered correctly
                    if (prev_xyz != a) {
                        ins.push(Dexter.move_to([prev_xyz[0], prev_xyz[1], prev_xyz[2] + up_distance]))
                        ins.push(Dexter.move_to([a[0], a[1], a[2] + up_distance]))
                        ins.push(Dexter.move_to(a)) //pen down
                    }

                    if (!point_equal(a, b)){
                        ins.push(Dexter.move_to(b))
                    }
                    prev_xyz = b
                }
            }
        }//end for
        return ins
    }
    catch(err) { out(err.message); }
}

//right now I don't use this (a_job) but will need it in the future to get a_job.robot. its transformations
Job.prototype.gcode_to_instructions = function* (filepath, scale = 1){
    let the_content = null
    file_content(filepath, function(content){
        the_content = content //closed over in outer context
    })
    while (the_content === null) { yield null }
    scale = scale_to_micron_factor(scale)
    let gcode_lines = the_content.split("\n")
    for(let i = 0; i < gcode_lines.length; i++){
        let gobj = Job.gcode_line_to_obj(gcode_lines[i])
        if (gobj == null) { continue; }
        else {
            let result
            switch(gobj.type){
                case "G0":
                    result = Job.gobj_to_move_to(gobj, scale)
                    yield result
                    break;
                case "G1":
                    result = Job.gobj_to_move_to(gobj, scale)
                    yield result
                    break;
                case "G28": //home
                    result = Job.gobj_to_move_to({X: 100, Y:100, Z:0}, scale) //needed to initialize out of the way
                    yield result
                case "VAR":
                    break; //ignore. do next iteration
                default:
                    break; //ignore. do next iteration
            }
        }
    }
}
//rekturns lit obj or null  if gstring is a comment or blank line
Job.gcode_line_to_obj = function(gstring){
    gstring = Job.gline_remove_comment(gstring)
    if (gstring == "") { return null }
    else if (gstring.startsWith(";")){ //semicolon on non first line starts end of line comment.
        return Job.gcode_varline_to_obj(gstring)
    }
    else {
        var litobj = {}
        var garray = gstring.split(" ")
        litobj.type = garray[0]
        for(let arg of garray){
            arg = arg.trim()
            let letter = arg[0]  //typically M, G, X, Y, X, E, F
            let num = arg.substring(1)
            if (is_string_a_number(num)){
                num = parseFloat(num)
            }
            litobj[letter] = num //allowed to be a string, just in case somethign wierd, but is
               //usually a number
        }
        return litobj
    }
}
//trims whitespace and comment. Careful: if line begins with semicolon, its not a comment
Job.gline_remove_comment = function(gstring){
    let comment_pos = gstring.lastIndexOf(";")
    if      (comment_pos == -1) { return gstring.trim() }
    else if (comment_pos == 0)  {
         if (gstring.includes("=")) { return gstring.trim()} //not actually a comment, its a var
         else { return "" } //a comment whose line starts with semicolon as in the top line of a file
    }
    else                        { return gstring.substring(0, comment_pos).trim() }
}

Job.gcode_varline_to_obj = function (gstring){
    let litobj = {}
    gstring = gstring.substring(1).trim() //cut off the semicolon
    let var_val = gstring.split("=")
    let var_name = var_val[0].trim()
    litobj.type = "VAR"
    litobj.name = var_name
    let val = var_val[1].trim()
    if (val.includes(",")){
        let vals = val.split(",")
        litobj.val = []
        for(let subval of vals){
            let processed_subval = Job.gcode_process_subval(subval) //probably won't be [12, "%"] but if it is, ok
            litobj.val.push(processed_subval) //if our val is something like "0x0,2x3,4x5" then each subval will b [0, 0] etc and we'll have an array of arrays
        }
    }
    else {
        let processed_subval = Job.gcode_process_subval(val)
        if (Array.isArray(processed_subval) &&
            (processed_subval.length == 2)  &&
            (typeof(processed_subval[1]) != "number")){
            litobj.val   = processed_subval[0]
            litobj.units = processed_subval[1]
        }
        else { litobj.val = processed_subval }
    }
    return litobj
}

//subval can be "123", "123.45",  "123%"    "#FFFFFF"  "0x0", "123x45",  "G28" "M104 S0", "12.3mm",     "1548.5mm (3.7cm3)", ""
//return         a number,        [123, "%"] "#FFFFFF", [0, 0] [123, 45], "G28" "M104 S0", [12.3, "mm"], "1548.5mm (3.7cm3)", ""
Job.gcode_process_subval = function(subval){
    subval = subval.trim()
    let x_pos = subval.indexOf("x")
    if (subval.includes(" ")) { return subval } //just a string
    else if ((x_pos != -1) &&
             (x_pos != 0)  &&
             (x_pos != (subval.length - 1))) { //we've probably got subval of format "12x34"
        let subsubvals = subval.split("x")
        let val = []
        for(let subsubval of subsubvals){
            if (is_string_a_number(subsubval)) { val.push(parseFloat(subsubval))}
            else { return subval } //its just a string with an x in the middle of it.
        }
        return val
    }
    else if (is_string_a_number(subval)){
        return parseFloat(subval)
    }
    else { //maybe have a number with units ie 12.3mm, but we don't have just a number, we might have just a string
         for(let i = 0; i < subval.length; i++){
             let char = subval[i]
             if ("0123456789.-".includes(char)) {} //continue looping
             else if (i == 0) { //first char not in a num so whole thing is a string
                return subval
             }
             else if ((i == 1) && (subval[0] == "-")){ //example "-foo". Its not a num
                return subval
             }
             else {
                let num = parseFloat(subval.substring(0, i))
                let units = subval.substring(i)
                return [num, units]
             }
         }
         //not expecting this to happen, but in case it does
         return subval
    }
}

//G0 or G1 code
Job.gobj_to_move_to = function(gobj, scale){ //ok for say, gobj to not have Z. that will just return undefined, and
    //move_to will get the existing Z value and use it.
    let the_x = gobj.X
    if (the_x){ the_x = the_x * scale }
    let the_y = gobj.Y
    if (the_y){ the_y = the_y * scale }
    let the_z = gobj.Z
    if (the_z){ the_z = the_z * scale }
    let result = Dexter.move_to([the_x, the_y, the_z])
    return result
}

//used in go_to, wait_until at least.
Job.instruction_location_to_job = function (instruction_location, maybe_error=true){
    var the_job_elt = instruction_location
    if (Array.isArray(instruction_location)){
        if (instruction_location.length === 0){
            if (maybe_error) {
                dde_error("Job.instruction_location_to_job passed empty array.<br/>" +
                          " It must have at least 1 item in it,,br/>" +
                          'with the first of format: {job: "some_job"}')
            }
            else {return null}
        }
        else { the_job_elt = instruction_location[0] }
    }
    if (the_job_elt){
        if (the_job_elt.job) {
            var the_job = the_job_elt.job
            if (typeof(the_job) == "string"){
                const the_job_name = the_job
                the_job = Job[the_job]
                if (!the_job) {
                    if (maybe_error) {
                        dde_error("Attempt to find instruction_location: " + instruction_location +
                        "<br/>but the specified job: " + the_job_name +
                        "<br/>isn't a defined job.")
                    }
                    else { //if we get a string, but that's not a defined job, that's kinda suspicious, so I warning
                      warning("instruction_location_to_job passed: " + instruction_location +
                              "<br/>which contains a name for a job: " + the_job_name +
                              "<br/>but a job with that name is not defined.")
                      return null
                    }
                }
            }
            return the_job
        }
        else {
            if (maybe_error) {
                dde_error("Job.instruction_location passed " + instruction_location +
                        '<br/> which does not have an element of format: {job:"some_job"}')
            }
            else { return null }
        }
    }
    else {
        if (maybe_error) {
            dde_error("Job.instruction_location passed a location: " + instruction_location +
                           "<br/> that doesn't have a job in it.")
        }
        else { return null }
    }
}
//intruction_location can be 5, {offset: 5}, [{offset: 5}}, {job: "myjob", offset:5}
// [{job:myjob}, {offset:5}], then throw in process attribute.
//getting a job makes it hold for the rest of the il, any there should be at most
//one job and it should be in the first element.
//offset and process DON'T carry forward to become defaults for later array elts.
//if the first offset is negative, it is added to the job's do_list length to
//get the resulting instruction id.
Job.prototype.instruction_location_to_id = function(instruction_location, starting_id=null, orig_instruction_location=null){
    var job_instance = this
    if (orig_instruction_location == null) { orig_instruction_location = instruction_location} //used for error messages
    let inst_loc = instruction_location
    let process = "forward_then_backward" //process ignored for integer inst_loc's.
    if ((typeof(inst_loc) == "object") && !Array.isArray(inst_loc)){
        if (instruction_location.job) {
            job_instance = instruction_location.job
            if (typeof(job_instance) == "string") { job_instance = Job[job_instance] }
            if (!(job_instance instanceof Job)) {
                dde_error("instruction_location_to_id passed: " +  orig_instruction_location +
                    "<br/> passed an invalid job of: " + job_instance)
            }
        }
        //an object might have just a job, just an offset, or both
        if(instruction_location.offset) {
            inst_loc = instruction_location.offset
            if (instruction_location.process) {
                process = instruction_location.process
            }
        }
        else {
            dde_error("In instruction_location_to_id, got an object: " + instruction_location +
                      "<br/>that did not have an offset field,<br/>" +
                      "in the original_instruction_location: " + orig_instruction_location)
        }
    }
    if (typeof(inst_loc) == "number"){
        if (starting_id == null){
            if (inst_loc >= 0) { starting_id = 0 }
            else { starting_id = job_instance.do_list.length } // an initial negative inst_loc means count from the end, with -1 pointin at the last instruction
        }
        let result = starting_id + inst_loc
        if ((result < 0) || (result > job_instance.do_list.length)){
              dde_error("instruction_location_to_id passed: " + instruction_location +
                        "<br/>but that finds an instruction outside the range of<br/>" +
                        " valid ids: 0 through " + (job_instance.do_list.length) +
                        "<br/>in the original_instruction_location: " + orig_instruction_location)

        }
        else { return result }
    }
    else if (typeof(inst_loc) == "string"){
        if      (inst_loc == "program_counter")        { return job_instance.program_counter }
        else if (inst_loc == "before_program_counter") { return job_instance.program_counter - 1 }
        else if (inst_loc == "after_program_counter")  { return job_instance.program_counter + 1 }
        else if (inst_loc == "end")                    { return job_instance.do_list.length } //bad for go_to but ok for insert instruction, ie a new last instruction
        else if (inst_loc == "next_top_level")         { return "next_top_level" } //used only by insert_instruction
        else if (inst_loc == "highest_completed_instruction") {
            const hci = job_instance.highest_completed_instruction_id
            if(!hci || (hci <= 0)) { return 0 }
            else { return hci }
        }
        else if (inst_loc == "highest_completed_instruction_or_zero") {
            const hci = job_instance.highest_completed_instruction_id
            if(!hci || (hci <= 0) || (hci >= (this.do_list.length - 1)))  { return 0 }
             //for the last cause above: if we completed the job the last time through, then start over again at zero
            else { return hci } //else we are resuming at
              //the highest completed instruction. But beware, you *might* not want
              //to do that instruction twice, in which case the instruction_location should be
              // ["zero_or_highest_completed_instruction", 1]
        }
        else { // a label or a sync_point name search pc, then after, then before pc
           if (starting_id == null) { starting_id = this.program_counter }
           if      (process == "forward_then_backward") { return job_instance.ilti_forward_then_backward(inst_loc, starting_id, orig_instruction_location) }
           else if (process == "backward_then_forward") { return job_instance.ilti_backward_then_forward(inst_loc, starting_id, orig_instruction_location) }
           else if (process == "forward")               { return job_instance.ilti_forward( inst_loc, starting_id, orig_instruction_location) }
           else if (process == "backward")              { return job_instance.ilti_backward(inst_loc, starting_id, orig_instruction_location) }
           else {
               dde_error("instruction_location_to_id passed process: " + process +
                   "<br/>but the only valid processes are:<br/>" +
                   '"forward_then_backward", "backward_the_forward", "forward", "backward".' +
                   "<br/>in the original_instruction_location: " + orig_instruction_location)
           }
        }
    }
    else if (Array.isArray(inst_loc)){
        let result = starting_id //will be null on first call
        for(let item of inst_loc){
            if (item.job){
                if(result == null){ //we're on the first elt of the array. so ok for it to have a job
                    job_instance = item.job
                    if (typeof(job_instance) == "string") {
                        job_instance = Job[job_instance]
                        if (!job_instance) { dde_error("In instruction_location_to_id got undefined job name: " + job_inst)}
                    }
                }
                else {
                    dde_error("In instruction_location_to_id got a non-first item<br/>" +
                             " that has job in it, which is invalid. That invalid job is: " + item.job +
                             "<br/>in the original_instruction_location: " + orig_instruction_location)
                }
            }
            result = job_instance.instruction_location_to_id(item, result, orig_instruction_location)
        }
        return result
    }
    else {dde_error("Job." + this.name + " doesn't contain a location named: " + inst_loc +
                    "in the original_instruction_location: " + orig_instruction_location)}
}

Job.prototype.ilti_forward_then_backward = function(inst_loc, starting_id, orig_instruction_location){
    for(let id = starting_id; id < this.do_list.length; id++){
        let ins = this.do_list[id]
        if (ins.name === inst_loc) {return id} //gets label, sync_point and fn name
        else if (ins instanceof Instruction){
            if (ins.constructor.name === inst_loc) { return id }
        }
        else if (Instruction.is_instruction_array(ins)){
            if (ins[Instruction.INSTRUCTION_TYPE] ===  inst_loc) { return id }
        }
    }
    for(let id = starting_id - 1; id >= 0; id--){
        let ins = this.do_list[id]
        if (ins.name === inst_loc) {return id} //finds both label and sync_point instructions with "name" of inst_loc
        else if (ins instanceof Instruction){
            if (ins.constructor.name === inst_loc) { return id }
        }
        else if (Instruction.is_instruction_array(ins)){
            if (ins[Instruction.INSTRUCTION_TYPE] ===  inst_loc) { return id }
        }
    }
    dde_error("Job." + this.name + " doesn't contain a location named: " + inst_loc +
        "<br/>in the original_instruction_location: " + orig_instruction_location)
}

Job.prototype.ilti_backward_then_forward = function(inst_loc, starting_id){
    for(let id = starting_id - 1; id >= 0; id--){
        let ins = this.do_list[id]
        if (ins.name === inst_loc) {return id} //finds both label and sync_point instructions with "name" of inst_loc
        else if (ins instanceof Instruction){
            if (ins.constructor.name === inst_loc) { return id }
        }
        else if (Instruction.is_instruction_array(ins)){
            if (ins[Instruction.INSTRUCTION_TYPE] ===  inst_loc) { return id }
        }
    }
    for(let id = starting_id; id < this.do_list.length; id++){
        let ins = this.do_list[id]
        if (ins.name === inst_loc) {return id} //gets label, sync_point and fn name
        else if (ins instanceof Instruction){
            if (ins.constructor.name === inst_loc) { return id }
        }
        else if (Instruction.is_instruction_array(ins)){
            if (ins[Instruction.INSTRUCTION_TYPE] ===  inst_loc) { return id }
        }
    }
    dde_error("Job." + this.name + " doesn't contain a location named: " + inst_loc +
        "<br/>in the original_instruction_location: " + orig_instruction_location)
}

Job.prototype.ilti_forward = function(inst_loc, starting_id){
    for(let id = starting_id; id < this.do_list.length; id++){
        let ins = this.do_list[id]
        if (ins.name === inst_loc) {return id} //gets label, sync_point and fn name
        else if (ins instanceof Instruction){
            if (ins.constructor.name === inst_loc) { return id }
        }
        else if (Instruction.is_instruction_array(ins)){
            if (ins[Instruction.INSTRUCTION_TYPE] ===  inst_loc) { return id }
        }
    }
    dde_error("Job." + this.name + " doesn't contain a location named: " + inst_loc +
        "<br/>in the original_instruction_location: " + orig_instruction_location)
}

Job.prototype.ilti_backward = function(inst_loc, starting_id){
    for(let id = starting_id - 1; id >= 0; id--){
        let ins = this.do_list[id]
        if (ins.name === inst_loc) {return id} //finds both label and sync_point instructions with "name" of inst_loc
        else if (ins instanceof Instruction){
            if (ins.constructor.name === inst_loc) { return id }
        }
        else if (Instruction.is_instruction_array(ins)){
            if (ins[Instruction.INSTRUCTION_TYPE] ===  inst_loc) { return id }
        }
    }
    dde_error("Job." + this.name + " doesn't contain a location named: " + inst_loc +
        "<br/>in the original_instruction_location: " + orig_instruction_location)
}

Job.insert_instruction = function(instruction, location){
    const the_job = Job.instruction_location_to_job(location)
    if (the_job){
        const index = the_job.instruction_location_to_id(location)
        if ((index === "next_top_level") ||
            ["not_started", "completed", "errored", "interrupted"].includes(the_job.status_code)){
                the_job.sent_from_job_instruction_queue.push(instruction)
                the_job.sent_from_job_instruction_location = location
                //if a job isn't running, then we stick it on the ins queue so that
                //the next time is DOES run (ie its restarted), this
                //insertined instruction will make it in to the do_list.
        }
        else { the_job.do_list.splice(index, 0, instruction) }
    }
    else {
        dde_error("insert_instruction passed location: " + insert_instruction +
                  " which doesn't specify a job. Location should be an array with" +
            "a first element of a literal object of {job:'some-job'}")
    }
}




