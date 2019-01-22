/**Created by Fry on 2/5/16. */
//for name param, both "" and null mean compute a job name a la "job_123"
class Job{
    constructor({name="",
                 robot=Robot.dexter0, do_list=[], keep_history=true, show_instructions=true,
                 inter_do_item_dur=0.01, user_data={},
                 default_workspace_pose=null, //Coor.Table,
                 program_counter=0, ending_program_counter="end",
                 initial_instruction=null, when_stopped = "stop",
                 callback_param = "start_object_callback"} = {}){
    //program_counter is the counter of the next instruction that should be executed.
    //so since we're currently "executing" 1 instruction, and after its done,
    //we'll be incrementing the pc, then internally we decriment the
    //passed in program_counter. If its negative, it means
    //computer it from the end, ie -1 means when set_next_do is called,
    //it will set the pc to the length of the do_list, hence we'll be done
    //with the job. -2 means we want to execute the last instruction of the
    //job next, etc.
    //save the args
    if (default_workspace_pose == null) {
          //console.log("default_workspace_pose is null, Job.job_default_params: " + Job.job_default_params)
          default_workspace_pose=Job.job_default_params.default_workspace_pose
    }
    if (!Array.isArray(do_list)){
        open_doc(do_list_doc_id)
        dde_error("While defining Job." + name +
                   "<br/> the do_list must be an array, but instead is: <br/>" +
                   do_list)
        return
    }
    try { do_list = Job.flatten_do_list_array(do_list) }
    catch(err){
        open_doc(do_list_doc_id)
        dde_error("While defining Job." + name + "<br/>" + err.message)
        return
    }
    if (Job[name] && Job[name].is_active()) { //we're redefining the job so we want to make sure the
       //previous version is stopped.
        if (Job[name].robot instanceof Dexter) {Job[name].robot.empty_instruction_queue_now() }
        Job[name].stop_for_reason("interrupted", "User is redefining this job.")
        let orig_args = arguments[0]
        setTimeout(function(){ new Job (orig_args) }, 200)

    }
    else {
        if (!Job.is_plausible_when_stopped_value(when_stopped)) {
            dde_error("new Job passed: " + when_stopped + " but that isn't a valid value.")
        }
        this.orig_args = {do_list: do_list, keep_history: keep_history, show_instructions: show_instructions,
                            inter_do_item_dur: inter_do_item_dur, user_data: user_data,
                            default_workspace_pose: default_workspace_pose,
                            program_counter: program_counter, ending_program_counter: ending_program_counter,
                            initial_instruction: initial_instruction, when_stopped: when_stopped,
                            callback_param: callback_param}
        this.name              = name
        this.robot             = robot
        this.user_data         = user_data //needed in case we call to_source_code before first start of the job
        //setup name
        Job.job_id_base       += 1
        this.job_id            = Job.job_id_base
        if ((this.name == null) || (this.name == "")){ this.name = "job_" + this.job_id }
        if (!(robot instanceof Robot)){
            if (!Robot.dexter0){
                dde_error("Attempt to create Job: " + this.name + " with no valid robot instance.<br/>" +
                          " Note that Robot.dexter0 is not defined<br/> " +
                          " but should be in your file: Documents/dde_apps/dde_init.js <br/>" +
                          " after setting the default ip_address and port.<br/> " +
                          "To generate the default dde_init.js file,<br/>" +
                          " rename your existing one and relaunch DDE.")
            }
            else {
                dde_error("Attempt to create Job: " + this.name + " with no valid robot instance.<br/>" +
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
    } //end constructor

    static init(){ //inits the class as a whole. called by ready
        this.job_default_params =
            {name: null, robot: Robot.dexter0, do_list: [],
                keep_history: true, show_instructions: true,
                inter_do_item_dur: 0.01, user_data:{},
                default_workspace_pose: Coor.Table, //null, //error on loading DDE if I use: Coor.Table, so we init this in Job.constructor
                program_counter:0, ending_program_counter:"end",
                initial_instruction: null, when_stopped: "stop", //also can be "wait" or a fn
                callback_param: "start_object_callback"}
    }

    toString() { return "Job." + this.name }
    show_progress_maybe(){
        if(this.show_instructions === true) { this.show_progress() }
        else if(typeof(this.show_instructions) === "function") {
            this.show_instructions.call(this)
        }
        //else do nothing
    }


    show_progress(){
        var html_id = this.name + this.start_time.getTime()
        var cur_instr = this.current_instruction()
        if (this.program_counter >= this.do_list.length) { cur_instr = "Done." }
        else { cur_instr = "Last instruction sent: "  + Instruction.to_string(cur_instr) }
        var content = "Job: " + this.name + " pc: "   + this.program_counter +
            " <progress style='width:100px;' value='" + this.program_counter +
                      "' max='" + this.do_list.length + "'></progress>" +
            " of " +  this.do_list.length + ". " +
            cur_instr +
            "&nbsp;&nbsp;<button onclick='inspect_out(Job." + this.name + ")'>Inspect</button>"

        out(content, "#5808ff", html_id)
    }

    show_progress_and_user_data(){
        var html_id = this.name + this.start_time.getTime()
        var cur_instr = this.current_instruction()
        if (this.program_counter >= this.do_list.length) { cur_instr = "Done." }
        else { cur_instr = "Last instruction sent: "  + Instruction.to_string(cur_instr) }
        var content = "Job: " + this.name + " pc: "   + this.program_counter +
            " <progress style='width:100px;' value='" + this.program_counter +
            "' max='" + this.do_list.length + "'></progress>" +
            " of " +  this.do_list.length + ". " +
            cur_instr +
            "&nbsp;&nbsp;<button onclick='inspect_out(Job." + this.name + ")'>Inspect</button>" +
            "<br/>"
        let has_user_data = false
        for(let prop_name in this.user_data){
            if(!has_user_data) { //first iteration only
                content += "<b>user_data: </b> "
                has_user_data = true
            }
            content += "<i>" + prop_name + "</i>: " + this.user_data[prop_name] + "&nbsp;&nbsp;"
        }
        if(!has_user_data) { content += "<i>No user data in this job.</i>" }
        out(content, "#5808ff", html_id)
    }

    static define_and_start_job(job_file_path){
        let starting_job_id_base = Job.job_id_base
        try { load_files(job_file_path)}
        catch(err){
            console.log("Could not find Job file: " + job_file_path + "  " + err.message)
            return
        }
        if(starting_job_id_base == Job.job_id_base){
            console.log("apparently there is no job definition in " + job_file_path)
        }
        else {
            let latest_job = Job.job_id_to_job_instance(Job.job_id_base)
            latest_job.start()
        }
    }


    //Called by user to start the job and "reinitialize" a stopped job
    start(options={}){  //sent_from_job = null
        if(this.wait_until_this_prop_is_false) { this.wait_until_this_prop_is_false = false } //just in case previous running errored before it could set this to false, used by start_objects
        if (["starting", "running", "suspended"].includes(this.status_code)){
            dde_error("Attempt to restart job: "  + this.name +
                      " but it has status code: " + this.status_code +
                      " which doesn't permit restarting.")
        }
        else{//init from orig_args
            let other_jobs = this.robot.active_jobs_using_this_robot()
            for(let other_job of other_jobs){
                if (other_job.robot instanceof Dexter){ //can 2 jobs use a Robot.Serial? I assume so for now.
                    dde_error("Job." + this.name + " attempted to use: Dexter." + this.robot.name +
                               " but that robot is in use by Job." + other_job.name)
                    return
                }
            }
            this.status_code       = "starting" //before setting it here, it should be "not_started"
            this.color_job_button()
           // this.do_list           = Job.flatten_do_list_array(this.orig_args.do_list) //make a copy in case the user passes in an array that they will use elsewhere, which we wouldn't want to mung
           // this.added_items_count = new Array(this.do_list.length) //This array parallels and should be the same length as the run items on the do_list.
           // this.added_items_count.fill(0) //stores the number of items "added" by each do_list item beneath it
            //if the initial pc is > 0, we need to have a place holder for all the instructions before it
            //see total_sub_instruction_count_aux for explanation of added_items_count
            this.init_do_list()
            this.callback_param    = this.orig_args.callback_param
            this.keep_history      = this.orig_args.keep_history
            this.show_instructions = this.orig_args.show_instructions
            this.inter_do_item_dur = this.orig_args.inter_do_item_dur
            this.user_data         = shallow_copy_lit_obj(this.orig_args.user_data)
            this.default_workspace_pose = this.orig_args.default_workspace_pose
            this.program_counter   = this.orig_args.program_counter //see robot_done_with_instruction as to why this isn't 0,
                                     //its because the robot.start effectively calls set_up_next_do(1), incremening the PC
            this.ending_program_counter = this.orig_args.ending_program_counter
            this.initial_instruction    = this.orig_args.initial_instruction
            this.when_stopped           = this.orig_args.when_stopped

            //first we set all the orig (above), then we over-ride them with the passed in ones
            for (let key in options){
                if (options.hasOwnProperty(key)){
                    let new_val = options[key]
                    //if (key == "program_counter") { new_val = new_val - 1 } //don't do. You set the pc to the pos just before the first instr to execute.
                    if      (key == "do_list")    { new_val = Job.flatten_do_list_array(new_val) }
                    else if (key == "user_data")  { new_val = shallow_copy_lit_obj(new_val) }
                    else if (key == "name")       {} //don't allow renaming of the job
                    else if ((key == "when_stopped") &&
                             !Job.is_plausible_when_stopped_value(new_val)) {
                        dde_error("Job.start called with an invalid value for 'when_stopped' of: " +
                                  new_val)
                        return
                    }
                    this[key] = new_val
                }
                else if (!Job.job_default_params.hasOwnProperty(key)){
                    warning("Job.start passed an option: " + key + " that is unknown. This is probably a mistake.")
                }
            }
            let maybe_symbolic_pc = this.program_counter
            this.program_counter = 0 //just temporarily so that instruction_location_to_id can start from 0
            const job_in_pc = Job.instruction_location_to_job(maybe_symbolic_pc, false)
            if ((job_in_pc != null) && (job_in_pc != this)) {
                dde_error("Job." + this.name + " has a program_counter initialization<br/>" +
                          "of an instruction_location that contains a job that is not the job being started. It shouldn't.")
                return
            }
            this.program_counter = this.instruction_location_to_id(maybe_symbolic_pc)

            //this.robot_status      = []  use this.robot.robot_status instead //only filled in when we have a Dexter robot by Dexter.robot_done_with_instruction or a Serial robot
            this.rs_history        = [] //only filled in when we have a Dexter robot by Dexter.robot_done_with_instruction or a Serial robot
            this.sent_instructions = []

            this.start_time        = new Date()
            this.stop_time         = null
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
            }
            this.sent_from_job_instruction_queue = [] //send_to_job uses this. its on the "to_job" instance and only stores instructions when send_to_job has
                                                  //where_to_insert="next_top_level", or when this job has yet to be starter. (see above comment.)
            this.sent_from_job_instruction_location = null
            if (this.initial_instruction) { //do AFTER the sent_from_job_instruction_queue insertion.
                //Instruction.Control.send_to_job.insert_sent_from_job(this, sent_from_job)
                Job.insert_instruction(this.initial_instruction, {job: this, offset: "program_counter"})
            }
            //must be after insert queue and init_instr processing
            if ((this.program_counter == 0) &&
                (this.do_list.length  == 0) &&
                ((this.when_stopped   == "wait") || (typeof(this.when_stopped) == "function"))) {} //special case to allow an empty do_list if we are waiting for an instruction or have a callback.
            else if (this.do_list.length == 0) {
                warning("While starting job: " + this.name + ", the do_list is empty.<br/>" +
                         "The job still requests the status of Dexter, but does not cause it to move.")
            }
            else if (this.program_counter >= this.do_list.length){ //note that maybe_symbolic_pc can be "end" which is length of do_list which is valid, though no instructions would be executed in that case so we error.
                dde_error("While starting job: " + this.name +
                    "<br/>the program_counter is initialized to: " + this.program_counter +
                    "<br/>but the highest instruction ID in the do_list is: " +  (this.do_list.length - 1))
            }
            Job.last_job           = this
            this.go_state          = true
            //this.init_show_instructions()
            //out("Starting job: " + this.name + " ...")
            this.show_progress_maybe()
            this.robot.start(this) //the only call to robot.start
            //console.log("end of Job.start")
            return this
        }
    }
    //action for the Start Job button
    static start_job_menu_item_action () {
        var full_src   = Editor.get_javascript()
        var start_cursor_pos = Editor.selection_start()
        var end_cursor_pos   = Editor.selection_end()
        var text_just_after_cursor = full_src.substring(start_cursor_pos, start_cursor_pos + 7)
        var start_of_job = -1
        if (text_just_after_cursor == "new Job") { start_of_job = start_cursor_pos }
        else {
            start_of_job = Editor.find_backwards(full_src, start_cursor_pos, "new Job")
            let [start_job_pos, end_job_pos] = Editor.select_call(full_src, start_of_job)
            if (end_job_pos < start_cursor_pos) { start_of_job = null } //because
               //we found a new Job but the whole thing was before our start cursor,
               //so the user is after the selection, not the preceding job.
        }
        if (start_of_job == null) {
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
                        (Job.j0.inter_do_item_dur * 1000 * 2) + 10) //convert from seconds to milliseconds
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
            let [start_pos, end_pos] = Editor.select_call()
            if (end_pos){ //returns true if it manages to select the call.
                //eval_button_action()
                var job_src =  full_src.substring(start_pos, end_pos)    //Editor.get_javascript(true)
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
      if(window.platform == "dde") {
        let but_elt = this.get_job_button()
        if (!but_elt){
            const job_name = this.name
            const the_id = this.get_job_button_id()

            const the_html = '<button style="margin-left:10px; margin-botton:0px; padding-bottom:0px; vertical-align:top;" id="' + the_id + '">'+ job_name + '</button>'
            //$("#jobs_button_bar_id").append(the_html)
            let wrapper= document.createElement('div');
            wrapper.innerHTML = the_html
            jobs_button_bar_id.append(wrapper.firstChild)

            but_elt = window[the_id]
            but_elt.onclick = function(){
                const the_job = Job[job_name]
                if (the_job.status_code == "suspended"){
                    the_job.unsuspend()
                }
                else if(the_job.is_active()){
                    if (the_job.robot instanceof Dexter) { the_job.robot.empty_instruction_queue_now() }
                    the_job.stop_for_reason("interrupted", "User stopped job", false)
                }
                else {
                    the_job.start()
                }
            }
            this.color_job_button()
        }
      }
    }

    remove_job_button(){
        var but_elt = this.get_job_button()
        if(but_elt){
            //$(but_elt).remove()
            but_elt.remove()
        }
    }

    set_status_code(status_code){
        if (Job.status_codes.includes(status_code)){
            this.status_code = status_code
            this.color_job_button()
            if (status_code != "waiting") { this.wait_reason = null }
        }
        else {
            shouldnt("set_status_code passed illegal status_code of: " + status_code +
                     "<br/>The legal codes are:</br/>" +
                     Job.status_codes)
        }
    }

    color_job_button(){
        if(window.platform == "dde"){
            let bg_color = null
            let tooltip  = ""
            switch(this.status_code){
                case "not_started":
                    bg_color = "rgb(204, 204, 204)";
                    tooltip  = "This job has not been started since it was defined.\nClick to start this job."
                    break; //defined but never started.
                case "starting":
                    bg_color = "rgb(210, 255, 190)";
                    tooltip  = "This job is in the process of starting.\nClick to stop it."
                    break;
                case "running":
                    if((this.when_stopped    == "wait") &&
                       (this.program_counter == this.instruction_location_to_id(this.ending_program_counter))) {
                        bg_color = "rgb(255, 255, 102)"; //pale yellow
                        tooltip  = 'This job is waiting for a new last instruction\nbecause it has when_stopped="wait".\nClick to stop this job.'
                    }
                    else {
                        const cur_ins = this.do_list[this.program_counter]
                        if (Instruction.is_instruction_array(cur_ins)){
                            const oplet   = cur_ins[Dexter.INSTRUCTION_TYPE]
                            if(oplet == "z") {
                                bg_color = "rgb(255, 255, 102)"; //pale yellow
                                tooltip  = "Now running 'sleep' instruction " + this.program_counter + "."
                                break;
                            }
                        }
                        bg_color = "rgb(136, 255, 136)";
                        tooltip  = "This job is running instruction " + this.program_counter +
                                   ".\nClick to stop this job."
                    }
                    break;
                case "suspended":
                    bg_color = "rgb(255, 255, 17)"; //bright yellow
                    tooltip  = "This job is suspended at instruction: " + this.program_counter +
                                "because\n" +
                                this.wait_reason + "\n" +
                                "Click to unsuspend it.\nAfter it is running, you can click to stop it."
                    break; //yellow
                case "waiting":
                    bg_color = "rgb(255, 255, 102)"; //pale yellow
                    tooltip  = "This job is at instruction " + this.program_counter +
                                " waiting for:\n" + this.wait_reason + "\nClick to stop this job."
                    break; //yellow
                case "completed":
                    if((this.program_counter === this.do_list.length) &&
                        (this.when_stopped === "wait")){
                        bg_color = "rgb(255, 255, 102)"; //pale yellow
                        tooltip  = 'This job is waiting for a new last instruction\nbecause it has when_stopped="wait".\nClick to stop this job.'
                    }
                    else {
                        bg_color = "rgb(230, 179, 255)" // purple. blues best:"#66ccff"  "#33bbff" too dark  //"#99d3ff" too light
                        tooltip  = "This job has successfully completed.\nClick to restart it."
                    }
                    break;
                case "errored":
                    bg_color = "rgb(255, 68, 68)";
                    tooltip  = "This job errored at instruction: " + this.program_counter +
                    " with:\n" + this.stop_reason + "\nClick to restart this job."
                    break;
                case "interrupted":
                    bg_color = "rgb(255, 123, 0)"; //orange
                    tooltip  = "This job was interrupted at instruction " + this.program_counter +
                    " by:\n" + this.stop_reason + "\nClick to restart this job."
                    break;
            }
            const but_elt = this.get_job_button()
            if (but_elt.style.backgroundColor !== bg_color) { //cut down the "jitter" in the culor, don't set unnecessarily
                but_elt.style.backgroundColor = bg_color
            }
            but_elt.title = tooltip
        }
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
        return "<details style='display:inline-block'><summary></summary>" +
                this.do_list_to_html_aux(0, 1) +
                "</details>"
    }

    static do_list_to_html_set_up_onclick(){
        if(window.platform == "dde"){
            setTimeout(function(){
                let elts = document.getElementsByClassName("do_list_item")
                for (let i = 0; i < elts.length; i++) { //more clever looping using let elt of elts breaks but only on windows deployed DDE
                    let elt = elts[i]
                    elt.onclick = Job.do_list_item_present_robot_status }
            }, 500)
        }
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

    at_or_past_sync_point(sync_point_name){ //presumes that the THIS job HAS an instuction with the named sync point
        if(!this.do_list) { return false} //before this job has started so its definately not past any of its sync points.
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
            let item_text =  ((id == this.program_counter) ? "<span style='border-style:solid; border-width:2px;'> ": "") +
                             "<span title='instruction_id'>id=" + id +
                             "</span>&nbsp;<span title='Number of sub_instructions&#13;added by this instruction below it.'> si=" + new_sub_item_count + "</span>" +
                             rs_button +
                             "&nbsp;" + Instruction.text_for_do_list_item(item) + //core of the_item
                             ((id == this.program_counter) ? "</span>" : "" )
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
       for(let i = 0; i < arr.length; i++){
           let elt = arr[i]
           if      (Instruction.is_instruction_array(elt))   { result.push(elt) }
           else if (Array.isArray(elt)) { //if elt is empty array, tbis works fine too.
                                                             Job.flatten_do_list_array(elt, result)
           }
           else if (elt == null)                             {} //includes undefined
           else if (Instruction.is_control_instruction(elt)) { result.push(elt) }
           else if (typeof(elt) === "function")              { result.push(elt) }
           else if (is_iterator(elt))                        { result.push(elt) }
           else if ((typeof(elt) === "object") && (typeof(elt.start) == "function")) { result.push(elt) }
           else {
                throw(TypeError("Invalid do_list item at index: " + i + "<br/>of: " + elt))
           }
       }
       return result
    }
    //can't be an instruction, must be called from a method
    //unsuspend is like start, ie it calls start_after_connected which calls send get status
    // which calls robot_done_with_instruction which calls set_up_next_do(1)
    unsuspend(){
        if (this.status_code == "suspended"){
            this.wait_reason = ""
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
}

//used by Job.prototype.to_source_code. Keep in sync with Job.constructor!
Job.job_default_params = null

Job.status_codes = ["not_started", "starting", "running", "completed",
                    "suspended",
                    "waiting",   //(wait_until, sync_point)
                    "errored",
                    "interrupted" //(user stopped manually),
                    ]

Job.global_user_data = {}
Job.job_id_base = 0 //only used for making the job_id.
Job.all_names = [] //maintained in both UI and sandbox/ used by replacement series job names

//note that once we make 1 job instance with a name, that binding of
//Job.the_name never goes away, and that name will always be in the
//the all_names list. But if you redefine a Job (with the same name)
//the old value of that name is gc'd.
Job.remember_job_name = function(job_name){
    if (!Job.all_names.includes(job_name)){
        Job.all_names.push(job_name)
        if(window.platform == "dde"){
            //$("#videos_id").prepend("<option>Job: " + job_name + "</option>")
            let a_option = document.createElement("option");
            a_option.innerText = "Job: " + job_name
            videos_id.prepend(a_option)
        }
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

//does not perform when_stopped action on purpose. This is a drastic stop.
Job.stop_all_jobs = function(){
    var stopped_job_names = []
    for(var j of Job.all_jobs()){
        if (j.robot instanceof Dexter) { j.robot.empty_instruction_queue_now() }
        if ((j.stop_reason == null) && (j.status_code != "not_started")){
            j.stop_for_reason("interrupted", "User stopped all jobs.", false)
            stopped_job_names.push(j.name)
            j.color_job_button()
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
            var result  = "<table style='border: 1px solid black;border-collapse: collapse;'><tr style='background-color:white;'><th>Job Name</th><th>ID</th><th>Robot</th><th>Start Time</th><th>Stop Time</th><th>Status</th></tr>"
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

Job.prototype.finish_job = function(perform_when_stopped=true){ //regardless of more to_do items or waiting for instruction, its over.
    if(perform_when_stopped && (this.when_stopped !== "stop")){
        let the_job = this //for closure
        setTimeout(function(){
                      if(the_job.when_stopped == "wait") { //even if we somehow stopped in the middle of the do_list,
                           // we are going to wait for a new instruction to be added
                           //beware, maybe race condition here with adding a new instruction.
                          the_job.status_code = "running"
                          the_job.stop_reason = null
                          the_job.program_counter = the_job.do_list.length
                          the_job.color_job_button()
                          the_job.set_up_next_do(0)
                      }
                      else if (typeof(the_job.when_stopped) === "function"){
                          setTimeout(function () { the_job.when_stopped.call(the_job)
                                                   the_job.finish_job(false)
                                    },
                                     100)
                      }
                      else if (Job.is_plausible_when_stopped_value(the_job.when_stopped)){
                          setTimeout(function(){
                                        const found_job = Job.instruction_location_to_job(the_job.when_stopped, false)
                                        if (found_job) { the_job = found_job }
                                        the_job.finish_job(false)
                                        setTimeout(function(){ //give the first job the chance to finish so that it isn't taking up the socket, and only THEN start the 2nd job.
                                             the_job.start({program_counter: the_job.when_stopped})
                                        }, 200)
                                     }, 100)
                      }
                      else {
                          shouldnt("Job: " + the_job.name + " has an invalid when_stopped value of: " + the_job.when_stopped)
                      }
                   },
                   1)
    }
    else {
        this.robot.finish_job()
        this.color_job_button()
        this.show_progress_maybe()
        //this.print_out()
        out("Done with job: " + this.name)
        //    "&nbsp;&nbsp;<button onclick='function(){inspect_out(Job." + this.name + ")}'>Inspect</button>")
        //inspect_out(this, null, null, null, true) //collapse inspector
    }
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
Job.prototype.set_up_next_do = function(program_counter_increment = 1, allow_once=false, inter_do_item_dur=this.inter_do_item_dur){ //usual arg is 1 but a few control instructions that want to take a breath call it with 0
    var job_instance = this
    if (Job.go_button_state || allow_once){ //Job.go_button_state being true is the normal case
        if ((this.status_code == "errored") || (this.status_code == "interrupted")){
            program_counter_increment = 0 //don't increment because we want pc and highest_completed_instruction_id
                                          //the instruction that errored when the job finishes.
        }
        if (program_counter_increment > 0) {
            job_instance.highest_completed_instruction_id = job_instance.program_counter
        }
        job_instance.program_counter += program_counter_increment
        setTimeout(function(){
                        job_instance.do_next_item()
                    },
                    inter_do_item_dur * 1000) //convert from seconds to milliseconds
    }
    else { //the stepper output
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
                                         reason_string,
                                         perform_when_stopped = false){
    out("top of Job.stop_for_reason with reason: " + reason_string)
    this.stop_reason  = reason_string //put before set_status_code because set_status_code calls color_job_button
    this.set_status_code(status_code)
    if (this.robot.heartbeat_timeout_obj) { clearTimeout(this.robot.heartbeat_timeout_obj) }
    this.stop_time    = new Date()
    if(!perform_when_stopped) { this.when_stopped = "stop"}
}


Job.prototype.do_next_item = function(){ //user calls this when they want the job to start, then this fn calls itself until done
    //this.program_counter += 1 now done in set_up_next_do
    //if (this.show_instructions){ console.log("Top of do_next_item in job: " + this.name + " with PC: " + this.program_counter)}
    //console.log("top of do_next_item with pc: " + this.program_counter)
    let ending_pc = this.instruction_location_to_id(this.ending_program_counter) //we end BEFORE executing the ending_pcm we don't execute the instr at the ending pc if any
    if (["completed", "interrupted", "errored"].includes(this.status_code)){//put before the wait until instruction_id because interrupted is the user wanting to halt, regardless of pending instructions.
        this.finish_job()
    }
    else if (this.wait_until_instruction_id_has_run || (this.wait_until_instruction_id_has_run === 0)){ //the ordering of this clause is important. Nothing below has to wait for instructions to complete
        //wait for the wait instruction id to be done
        //the waited for instruction coming back thru robot_done_with_instruction will call set_up_next_do(1)
        //so don't do it here. BUT still have this clause to block doing anything below if we're waiting.
    }
    else if (this.stop_reason){ this.finish_job() } //must be before the below since if we've
    //already got a stop reason, we don't want to keep waiting for another instruction.
    else if (this.wait_until_this_prop_is_false) { this.set_up_next_do(0) }
    else if (this.program_counter >= ending_pc) {  //this.do_list.length
             //the normal stop case
        if (this.when_stopped == "wait") { //we're in a loop waiting for th next instruction.
            this.color_job_button()
            this.set_up_next_do(0)
        }
        else if (ending_pc < this.do_list.length) { //we're ending in the middle of the ob. Don't do the final g cmd, as tt confusing
            this.stop_reason = "Stopped early due to ending_program_counter of: " + this.ending_program_counter
            this.status_code = "completed"
            this.set_up_next_do(0)
        }
        else if ((this.robot instanceof Dexter) &&
            ((this.do_list.length == 0) ||
            (last(this.do_list)[Dexter.INSTRUCTION_TYPE] != "g"))){
            //this.program_counter = this.do_list.length //probably already true, but just to make sure.
            //this.do_list.splice(this.program_counter, 0, Dexter.get_robot_status()) //this final instruction naturally flushes dexter'is instruction queue so that the job will stay alive until the last insetruction is done.
                //this.added_items_count(this.program_counter, 0, 0)
            //this.added_items_count.splice(this.program_counter, 0, 0)

            this.insert_single_instruction(Dexter.get_robot_status(), false) //false says making this new instruction a top level (not sub) instruction
            //this.added_items_count[this.program_counter] += 1 //hmm, the final g instr isn't reallyy "nested" under the last item, just a top level expr
                //but its not an orig top level one either. so maybe nest it.
                //jun 9, 2018: No consider the new g a top level cmd with 0 subinstructions
            this.set_up_next_do(0)
        }
        else if (!this.stop_reason){
            var stat = "completed"
            var reas = "Finished all do_list items."
            if(this.stop_job_instruction_reason){
                stat = "interrupted"
                reas = this.stop_job_instruction_reason
            }
            this.stop_for_reason(stat, reas, true) //true becuse this is a normal stop so perform the sotp reason if any
            this.finish_job()
        }
        else { this.finish_job() }
    }

    else{
        //regardless of whether we're in an iter or not, do the item at pc. (might or might not
        //have been just inserted by the above).
      try {
        var cur_do_item = this.current_instruction()
        //console.log("do_next_item cur_do_item: " + cur_do_item)
        this.show_progress_maybe()
        this.select_instruction_maybe(cur_do_item)
        if (this.program_counter >= this.added_items_count.length) { this.added_items_count.push(0)} //might be overwritten further down in this method
        else if (this.added_items_count[this.program_counter] > 0) { //will only happen if we go_to backwards,
           //in which case we *might* call an instruction twice that makes some items that it adds to the to_do list.
           //so we want to get rid of those items and "start over" with that instruction.
            this.remove_sub_instructions_from_do_list(this.program_counter)
        }
        if (cur_do_item == null){ //nothing to do, just skip it.
            this.set_up_next_do(1)
        }
        else if ((this.sent_from_job_instruction_queue.length > 0) &&
                 this.is_top_level_do_item(cur_do_item)){
            //bad, inserts after pc not AT pc this.insert_instructions(this.sent_from_job_instruction_queue) //all items on queue are next_top_level, so just insert them all.
            this.do_list.splice(this.program_counter, 0, ...this.sent_from_job_instruction_queue)
            let added_items_for_insert = new Array(this.sent_from_job_instruction_queue.length)
            added_items_for_insert.fill(0)
            this.added_items_count.splice(this.program_counter, 0, ...added_items_for_insert)


            //note we're inserting sent_from_job instructions, not the REAL instruction we want to execute.
            //that's because in the hierarchical do_list display, we want to see where those REAL instructions came from for debugging purposes.
            this.sent_from_job_instruction_queue = []
            this.set_up_next_do(0)
        }
        /* now in Instruction.Control.break.do_item
          else if (cur_do_item == "break") { //we're in a loop. skip over rest of items under the cur loop iteration (including any go_to at its end) and go to next instr after the whole loop
            let loop_pc = Instruction.Control.loop.pc_of_enclosing_loop(this)
            if (loop_pc === null) {
                dde_warning("Job " + this.name + ' has a "break" instruction at pc: ' + this.program_counter +
                            "<br/> but there is no Robot.loop instruction above it.")
                this.set_up_next_do(1)
            }
            else {
                let loop_ins = this.do_list[loop_pc]
                loop_ins.resolved_boolean_int_array_fn = null //just in case this loop is nested in another loop
                   //or we "go_to backwards" to it, we want its next "first_call" to initialize
                   //the loop so set resolved_boolean_int_array_fn to null
                let items_within_loop = this.added_items_count[loop_pc]
                this.program_counter = loop_pc + items_within_loop //np pc is pointing at last inst of loop iteratil instrs
                this.set_up_next_do(1) //skip past the last inst in the loop iteration, as we're done with the loop
            }
        }*/
        else if (cur_do_item instanceof Instruction.Control.loop){
            let ins = cur_do_item.get_instructions_for_one_iteration(this)
            if (ins === null) { } //done with loop
            else {
                let flatarr = Job.flatten_do_list_array(ins)
                this.insert_instructions(flatarr)
            }
            this.set_up_next_do(1)
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
        else if (is_iterator(cur_do_item)){ //generator. must be before "function" because an iterator is also of type "function".
            var next_obj = cur_do_item.next()
            var do_items = next_obj.value
            let have_item_to_insert
            if      (do_items === null)       { have_item_to_insert = false }
            else if (do_items === undefined)  { have_item_to_insert = false }
            else if (Array.isArray(do_items) && (do_items.length == 0)) { have_item_to_insert = false }
            else have_item_to_insert = true

            if (have_item_to_insert) {
                if (next_obj.done){ //run the one last instruction from this gen
                    this.insert_single_instruction(do_items)
                    this.set_up_next_do(1)
                }
                else  { //not done so we must insert the cur_do_item
                    if (Instruction.is_instruction_array(do_items) || !Array.isArray(do_items)) {
                       do_items = [do_items, cur_do_item] }
                    else  { //do_items is already an array
                        do_items = do_items.slice(0) //copy the do_items just in case user is hanging on to that array, we don't want to mung it.
                        do_items.push(cur_do_item)
                    }
                    this.insert_instructions(do_items)
                    this.set_up_next_do(1)

                }
            }
            else { //no items to insert
                if (next_obj.done){ this.set_up_next_do(1) } //done with this generator
                else              { this.set_up_next_do(0) } //keep generator alive
            }
        }
        else if (typeof(cur_do_item) == "function"){
            try{
                var do_items = cur_do_item.call(this) //the fn is called with "this" of this job
                //console.log("do_next_item with function that returned: " + do_items)
                this.handle_function_call_or_gen_next_result(cur_do_item, do_items) //take the result of the fn call and put it on the do_list
            }
            catch(err){
                warning("Job " + this.name + " errored executing instruction with id: " + this.program_counter + "<br/>" +
                         cur_do_item.toString() + "<br/>" +
                         err.message)
                this.stop_for_reason("errored", "function at instruction id: " + this.program_counter)
                this.set_up_next_do(1)
             }
        }
        else if (Instruction.is_start_object(cur_do_item)){
            this.handle_start_object(cur_do_item)
        }
        else {
            this.stop_for_reason("errored", "Job: " + this.name + " got illegal do_item on do_list of: " +
                                            stringify_value(cur_do_item))
            //It's over, Jim, So don't take a breath, by calling set_up_next_do(0),
            //just kill it quickly before anything else can happen.
            //we don't want to increment the pc,
            this.set_up_next_do(0)
        }
    }
    catch(err){ //this can happen when, for instance a fn def on the do_list is called and it contains an unbound var ref
       this.stop_for_reason("errored", err.message) //let do_next_item loop around and stop normally
    }
  }
    //this.color_job_button() //todo needs to work for Dexter.sleep (z) instruction and to undo its yellow.
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
        this.set_up_next_do(1)
    }
    else if (Array.isArray(do_items)){
        let flatarr = Job.flatten_do_list_array(do_items)
        this.insert_instructions(flatarr)
        this.set_up_next_do(1)
    }
    else if (is_iterator(do_items)){ //calling a generator fn returns an iterator
        //this.iterator_stack.push([do_items, this.program_counter])
        //this.set_up_next_do(1)
        this.insert_single_instruction(do_items)
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

//cur_do_item guarenteed to have a start method when this fn is called.
Job.prototype.handle_start_object = function(cur_do_item){
        //the below gets around having to require("test_suite.js") because that would
        //violate what the job_engine code has access too, but still allows
        //including a test suite instance in a job that is run in DDE.
        if(cur_do_item.constructor && (cur_do_item.constructor.name == "TestSuite")){
            cur_do_item.constructor.set_state_and_resume({suites: [cur_do_item]})
        }
        else {
            let user_data_variable = cur_do_item.user_data_variable
            let job_instance = this
            let cb_fn = null
            let the_inst_this = cur_do_item.start_this
            if (!the_inst_this) { the_inst_this = cur_do_item }
            else if (the_inst_this == "job_instance") { the_inst_this = job_instance }
            let start_args = cur_do_item.start_args
            let cb_param = cur_do_item.callback_param
            if(cb_param) {
                job_instance.wait_until_this_prop_is_false = "waiting for start object callback to run"
                let cb_fn = function(...args) {
                    if (user_data_variable){
                        job_instance.user_data[user_data_variable] =  args
                    }
                    job_instance.wait_until_this_prop_is_false = false
                }
                if(typeof(cb_param) === "number") { //must be a non-neg int
                    if ((start_args === undefined) || (start_args === null)) {start_args = []}
                    if (Array.isArray(start_args)) {
                         start_args = start_args.slice() //copy
                         start_args[cb_param] = cb_fn
                    }
                    else { dde_error("For Job: " + job_instance.name +
                        " pc: " +  job_instance.program_counter +
                        "<br/>got data structure instruction: " + cur_do_item +
                        "<br/> which has a cb_param of a number but the start_args " +
                        "is not an array.")
                    }
                }
                else if (typeof(cb_param) === "string") {
                    if ((start_args === undefined) || (start_args === null)) { start_args = {} }
                    if (typeof(start_args) == "object") {
                       start_args =  jQuery.extend({}, start_args) //shallow copy
                       start_args[cb_param] = cb_fn
                    }
                    else {
                       dde_error("For Job: " + job_instance.name +
                                " pc: " +  job_instance.program_counter +
                                "<br/>got data structure instruction: " + cur_do_item +
                                '<br/> which has a cb_param of a string, "' + cb_param + '", but the start_args ' +
                                "is not an object.")
                    }
                }
            }
            else if(cur_do_item.dur) {
                this.insert_single_instruction(Robot.wait_until(cur_do_item.dur))
            }
            if (!start_args)                    { cur_do_item.start.apply(the_inst_this) }
            else if (Array.isArray(start_args)) { cur_do_item.start.apply(the_inst_this, start_args) }
            else                                { cur_do_item.start.call(the_inst_this, start_args) }
        }
        this.set_up_next_do(1)
}

Job.prototype.send = function(instruction_array, robot){ //if remember is false, its a heartbeat
    var instruction_id
    const oplet = instruction_array[Instruction.INSTRUCTION_TYPE]
    if(oplet == "h") { //op_let is first elt UNTIL we stick in the instuction id
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
    //if there's both a passed in robot, and one in the instruction_array, prefer
    //the one in the instruction array
    if (last(instruction_array) instanceof Robot) { robot = instruction_array.pop() }
    else if (!robot)                              { robot = this.robot }
    robot.send(instruction_array)
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



//used in go_to, wait_until at least.
Job.instruction_location_to_job = function (instruction_location, maybe_error=true){
    var the_job_elt = instruction_location
    if (Array.isArray(instruction_location)){
        if (instruction_location.length === 0){
            if (maybe_error) {
                dde_error("Job.instruction_location_to_job passed empty array.<br/>" +
                          " It must have at least 1 item in it,<br/>" +
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
    let job_instance = this
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
    if (Number.isInteger(inst_loc)){
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

//functions for managing adding and removal from do_list
// (and keeping added_items_count in sync).
//see also Job.insert_instruction and Job.prototype.do_list_to_html_aux

//called by Job.start
Job.prototype.init_do_list = function(new_do_list=undefined){
    if(new_do_list === undefined) { new_do_list = this.orig_args.do_list }
    this.do_list           = Job.flatten_do_list_array(new_do_list) //make a copy in case the user passes in an array that they will use elsewhere, which we wouldn't want to mung
    this.added_items_count = new Array(this.do_list.length) //This array parallels and should be the same length as the run items on the do_list.
    this.added_items_count.fill(0) //stores the number of items "added" by each do_list item beneath it
    //if the initial pc is > 0, we need to have a place holder for all the instructions before it
    //see total_sub_instruction_count_aux for explanation of added_items_count
}

Job.prototype.remove_sub_instructions_from_do_list = function(instr_id){
    const sub_items_count = this.total_sub_instruction_count(instr_id)
    this.do_list.splice(instr_id + 1, sub_items_count) //cut out all the sub-instructions under instr_id
    this.added_items_count.splice(instr_id + 1, sub_items_count)
    this.added_items_count[instr_id] = 0 //because we just deleted all of ites subitems and their descendents
}

/*Job.prototype.total_sub_instruction_count = function(id_of_top_ins){
    var this_level_subitems = this.added_items_count[id_of_top_ins]
    var result = 0
    for(let i = 0; i < this_level_subitems; i++){
        result += 1 //for each this_level_sub_item
        result += this.total_sub_instruction_count(id_of_top_ins + result)
    }
    return result
}*/

/*Job.prototype.total_sub_instruction_count = function(id_of_top_ins){
    let result = 0
    for(let i = 0; i < this.added_items_count[id_of_top_ins]; i++){
        result += 1 //for each this_level_sub_item
        result += this.total_sub_instruction_count(id_of_top_ins + i + 1)
    }
    return result
}
*/

Job.prototype.total_sub_instruction_count = function(id_of_top_ins){
    return total_sub_instruction_count_aux(id_of_top_ins, this.added_items_count)
}

/*
added_items_count is the way in which the do_list can be considered to be a
hierarchy such that an insturciton that adds more instuctoins nder it,
those new insturctions will be considered sub-instrustions.
This is important for presenting the do_lsit as a hierarchy
(as the Inspect does, but alos necessary to remove previous do_list items
from the do_list when we start an loop iteratioin or perform a backward s go_to.

added_items_count is an array that is maintained to always be the same
length as the do_list, and contains a non-neg integer sayng
how many sub-instructions the instruction at that array index
has beneath it *when they are first added*
If a subinstruction, when it is run, returns more instructions to
instert the orig instruction sub-instruction count is NOT increased,
its just left alone, but the orig subinsrution's item-count is
incremented by the new sub-sub-instructions added.
This makes computing how many actuaul insturcitons are underneath
a given instruciton tricky, as it may well be more than its
added_items_count indicates.
(If the added_items_count is 0, it has no sub-instructions but
if it is more than 0, it might be that number or more.)
The job of total_sub_instruction_count_aux is to figure out
total sub)instructions. It walks down the  added_items_count
from the given index until it "runs out" of sub-insructions,
and returns the count. The sub-instructions count excludes the
instruction at the given index. See the test suite for
total_sub_instruction_count_aux for examples.
*/

function total_sub_instruction_count_aux(id_of_top_ins, aic_array){
    let result = 0 //this.added_items_count[id_of_top_ins]
    let tally  = 1 //this.added_items_count[id_of_top_ins]
    for(let i = id_of_top_ins; true ; i++){
        let aic_for_i = aic_array[i] //this.added_items_count[i]
        if (aic_for_i === undefined) {
            shouldnt("total_sub_instruction_count_aux got undefined from aic_array: " + aic_array)
        }
        result += aic_for_i //often this is adding 0
        tally  += aic_for_i - 1
        if (tally == 0) { break; }
        else if (tally < 0) { shouldnt("in total_sub_instruction_count got a negative tally") }
    }
    return result
}

//These 2 fns take care of inserting into added_items_count array,
//slots for the new items they are inserting
//Both of these fns always insert right after the pc
Job.prototype.insert_single_instruction = function(instruction_array, is_sub_instruction=true){
    this.do_list.splice(this.program_counter + 1, 0, instruction_array);
    this.added_items_count.splice(this.program_counter + 1, 0, 0); //added oct 31, 2017
    if (is_sub_instruction) {
        this.added_items_count[this.program_counter] += 1
    }
}

Job.prototype.insert_instructions = function(array_of_do_items, are_sub_instructions=true){
    //this.do_list.splice.apply(this.do_list, [this.program_counter + 1, 0].concat(array_of_do_items));
    this.do_list.splice(this.program_counter + 1, 0, ...array_of_do_items)
    let added_items_to_insert = new Array(array_of_do_items.length)
    added_items_to_insert.fill(0)
    //this.added_items_count.splice.apply(this.do_list, [this.program_counter + 1, 0].concat(added_items_to_insert));
    this.added_items_count.splice(this.program_counter + 1, 0, ...added_items_to_insert)
    if(are_sub_instructions) {
        this.added_items_count[this.program_counter] += added_items_to_insert.length
    }
}


Job.insert_instruction = function(instruction, location){
    const job_instance = Job.instruction_location_to_job(location)
    if (job_instance){
        const index = job_instance.instruction_location_to_id(location)
        if ((index === "next_top_level") ||
            ["not_started", "completed", "errored", "interrupted"].includes(job_instance.status_code)){
            job_instance.sent_from_job_instruction_queue.push(instruction)
            job_instance.sent_from_job_instruction_location = location
                //if a job isn't running, then we stick it on the ins queue so that
                //the next time is DOES run (ie its restarted), this
                //inserted instruction will make it in to the do_list.
        }
        else { job_instance.do_list.splice(index, 0, instruction)
               job_instance.added_items_count.splice(index, 0, 0) //added oct 31, 2017
               if(index > 0) { //unlike the instance method cousins of this static method,
                    //this meth must do the added_items_count increment because
                    //the caller of this meth doesn't know the index of the instr to increment
                    //the added_items_count of.
                    //job_instance.added_items_count[this.program_counter] += 1 //isn't right that pc has its added_items count incremented. Maybe should be something else, or no increment at all
                   job_instance.increment_added_items_count_for_parent_instruction_of(index)
               }
        }
    }
    else {
        dde_error("insert_instruction passed location: " + insert_instruction +
                  " which doesn't specify a job. Location should be an array with" +
            "a first element of a literal object of {job:'some-job'}")
    }
}

Job.prototype.increment_added_items_count_for_parent_instruction_of = function(instr_id){
    if(instr_id == 0) { } //must be at top level, so no parent aic to increment. This is ok
    else {
        let par_id_maybe = instr_id - 1
        let par_instr = this.do_list[par_id_maybe]
        if(par_instr instanceof Instruction.Control.go_to) { //below code is hairy but very rarely if ever called
            let location = par_instr.instruction_location
            let par_loc_job_inst = Job.instruction_location_to_job(location)
            let par_loc_index = this.instruction_location_to_id(location)
            if((par_loc_job_inst === this) &&
               (type_of(par_loc_index) == "number") &&
               (par_loc_index < this.program_counter)) { //backwards goto in same job
               let loop_inst_maybe = this.do_list[par_loc_index]
               if(loop_inst_maybe instanceof Robot.loop){ //shoot, we can't make the inserted instruction a sub_object of a loop's go_to
                    //so we've got to climb up the tree and increment the next instr that has a positive added_items_count
                    //but that aic must "contain" the instr_id of the added instruction
                   for(let maybe_par_id = par_loc_index - 1; maybe_par_id >= 0; maybe_par_id--){
                       //assumes go_to of a loop instr won't have a positive added_items_count which should be right
                       if(this.added_items_count[maybe_par_id] > 0) {
                           let sub_items_count = this.total_sub_instruction_count(maybe_par_id)
                           let last_instruction_id_under_maybe_par = maybe_par_id + sub_items_count
                           if (instr_id <= (last_instruction_id_under_maybe_par + 1)){ //even if our new instr is one beyond the current scope of our maybe_par_id, consider that we're adding to the end of that maybe_par's sub_instructions. The laternative is to keep going up but this is good enough.
                               this.added_items_count[maybe_par_id] += 1
                               return
                           }
                       }
                   }
                   return //didn't find a parent that included instr_id so it must be at top level,
                          //in which case, no need to increment any par instr aic
               }
            }
        }
        //the case that applies nearly all of the time
        //do not make this an else as the inner if's above need to fall through to here.
        this.added_items_count[instr_id - 1] += 1 //fairly dumb but usually right. Just make it the sub_instruction of the instruction above it.
    }
}

//end do_list management fns

//returns true if the argument is the right type to be an
///instrudtion location. Note it might not actually BE an instruction location,
//but at least it coforms to the bare minimum of a type
//called from Job constructor for use in finish_job
Job.is_plausible_instruction_location = function(instruction_locaction){
    return Number.isInteger(instruction_locaction) ||
           (typeof(instruction_locaction) === "string") ||
            //array check must be before object check because typeof([]) => "object"
            (Array.isArray(instruction_locaction) &&
                (instruction_locaction.length > 0) &&
                Job.is_plausible_instruction_location(instruction_locaction[0])
            ) ||
           ((typeof(instruction_locaction) === "object") &&
            (   instruction_locaction.offset ||
                instruction_locaction.job    ||
                instruction_locaction.process
            ))
}

Job.is_plausible_when_stopped_value = function(val){
    return ((val === "stop") ||
            (val === "wait") ||
            (typeof(val) === "function") ||
            Job.is_plausible_instruction_location(val)
            )
}

Job.prototype.to_source_code = function(args={}){
    if(!args.indent) { args.indent = "" }
    let props_indent = args.indent + "         "
    let result = 'new Job({name: "' + this.name + '",\n'
    if (this.robot !== Robot.dexter0){
        result += props_indent + 'robot: '  + this.robot.to_path() + ',\n'
    }
    let prop_names = ["keep_history", "show_instructions",
                       "inter_do_item_dur", "program_counter",
                       "ending_program_counter",
                       "when_stopped",
                       "initial_instruction",
                       "user_data"]
    let props_container = ((args.job_orig_args || !this.do_list) ? this.orig_args : this)

    for(let prop_name of prop_names){ //if job has never been run, do_list will be undefined,
                                      //in which case use orig_args even if orig_args arg is false
       let prop_val = props_container[prop_name]
       if (!similar(prop_val, Job.job_default_params[prop_name])){ //I could *almost* use == instead pf similar but doesn't work for user_data of an empty lit obj
            let prop_args = jQuery.extend({}, args)
            prop_args.value = prop_val
            let user_data_val_prefix = ""
            if (prop_name == "user_data") {
                prop_args.indent = props_indent + "    "
                user_data_val_prefix = "\n"
            }
            let comma = ","
            //if (prop_name == last(prop_names)) { comma = "" }
            result += props_indent + prop_name + ": " +
                      user_data_val_prefix + to_source_code(prop_args) +
                      comma + "\n"
       }
    }
    result += props_indent + "do_list: ["
    let do_list_val = props_container.do_list
    if (!args.job_orig_args){
        let last_instr  = last(do_list_val)
        if (Instruction.is_instruction_array(last_instr) &&
            last_instr[Instruction.INSTRUCTION_TYPE] == "g") { //don't print the auto_added g instr at end of a run job
            do_list_val = do_list_val.slice(0, (do_list_val.length - 1))
        }
    }
    let on_first = true
    for(let i = 0; i < do_list_val.length; i++){
       let on_last = (i == do_list_val.length - 1)
       let prop_args = jQuery.extend({}, arguments[0])
       prop_args.value = do_list_val[i]
       prop_args.indent = (on_first ? "" : props_indent + "          ")
       let instr_src = to_source_code(prop_args)
       result += instr_src + (on_last ? "" : ",") + "\n"
       on_first = false
    }
    result += props_indent + "         " + "]\n" + args.indent + "})"
    return result
}

module.exports = Job
var esprima = require('esprima')
var {serial_disconnect_all} = require("./serial.js")
var {Robot, Brain, Dexter, Human, Serial} = require('./robot.js')
var Coor  = require('../math/Coor.js')
var {Instruction, make_ins} = require("./instruction.js")
var {load_files} = require("./storage.js")
var {shouldnt, warning, dde_error, milliseconds_to_human_string, is_iterator, last, prepend_file_message_maybe, shallow_copy_lit_obj, stringify_value_sans_html} = require("./utils")
var {out} = require("./out.js")
//var TestSuite = require("../test_suite/test_suite.js")




