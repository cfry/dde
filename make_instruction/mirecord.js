//var noUiSlider = require('noUiSlider') //works but can't get the css
//var noUiSlider = require('noUiSlider.css') //errors

var MiRecord = class MiRecord {
    static set_highest_completed_instruction_ui(){
        let loc = "None"
        if(MiState.job_instance){
            if(MiState.job_instance.do_list) {
                loc = MiState.job_instance.highest_completed_instruction_id
                if (MiState.job_instance.do_list && (loc == (MiState.job_instance.do_list.length - 1))) {
                    loc = loc + " (whole do_list completed)"
                }
            }
            else { loc = "None" }
        }
        mi_highest_completed_instruction_id.innerHTML = loc
    }

    static get_play_loc(){
        return parseInt(mi_record_slider_id.value)
    }
    static set_play_loc(event_or_loc=null){ //event_or_loc, if not passed, defaults to
        let job_instance = this.job_in_mi_dialog()
        let the_do_list = MiState.get_do_list_smart()
        let loc
        if(event_or_loc === null)                  { loc = MiRecord.get_play_loc() }
        else if (typeof(event_or_loc) == "number") { loc = event_or_loc }
        else {                                       loc = parseInt(event_or_loc.value) }
        if (loc < 0) { loc = 0 }
        if(job_instance){
            if(job_instance.highest_completed_instruction === undefined) {} //probably at beginning of running job_instance
            else if(loc > job_instance.highest_completed_instruction){
                warning("You can't start playing an instruction <br/>" +
                        "that's higher than the highest_completed_instruction.")
                loc = job_instance.highest_completed_instruction
            }
        }

        let instr = ""
        if(the_do_list) {
            instr = the_do_list[loc]
            instr = to_source_code({value: instr}).substr(0, 60)
        }
        mi_record_slider_id.value = loc
        let new_text
        if (the_do_list && (loc == the_do_list.length)) { new_text = "next instr fwd at " + loc + " is beyond final instruction." }
        else { new_text  = "next instr fwd at " + loc + " is " + instr } //show small forward arrow?
        mi_record_slider_pos_id.innerHTML = new_text
    }


    static get_max_loc(){
      let the_do_list = MiState.get_do_list_smart()
      if (the_do_list) {
          let result = the_do_list.length
          if (result < 0) { return 0 }
          else { return result }
      }
      else { return 0 }
    }

    static set_max_loc()   {
        let max = this.get_max_loc()
        if(max < 0) { max = 0 }
        if(max != parseInt(mi_record_slider_id.max)) { //don't unnessarily do this
            mi_record_slider_id.max = max
            mi_record_slider_max_id.innerHTML = max
            let marks_max = Math.max(0, max - 1)
            mi_marks_slider_max_id.innerHTML = marks_max
            mi_marks_slider_id.noUiSlider.updateOptions({range: {min:-0.01, max:marks_max}}) //noUiSlider requires max to be more than min or it will error
        }
    }

    static get_begin_mark_loc(){ return parseInt(mi_marks_slider_id.noUiSlider.get()[0]) }

    static set_begin_mark_loc(event_or_loc){ //event_or_loc, if not passed, defaults to
        let end_loc = this.get_end_mark_loc()
        let loc
        if      (typeof(event_or_loc) == "number") { loc = event_or_loc }
        else if (typeof(event_or_loc) == "string") {loc = parseFloat(event_or_loc) } //noUiSlider onslide passes in a float as a string. Must parse it as a float (not int) and round below
        else                                       { loc = parseInt(event_or_loc.value) }
        if (loc < 0) { loc = 0 }
        if (loc > end_loc) {
            this.set_begin_mark_loc(end_loc)
            dde_error("You can't set the begin mark to after the end mark.<br/>" +
                      "Move the end mark further right first.")
        }
        loc = Math.round(loc) //the slider callback onslide returns a float
        let the_do_list = MiState.get_do_list_smart()
        let instr = ""
        if(the_do_list) {
            instr = the_do_list[loc]
            instr = to_source_code({value: instr}).substr(0, 60)
        }
        mi_marks_slider_id.noUiSlider.setHandle(0, loc)
        mi_begin_marks_slider_pos_id.innerHTML = "begin mark at " + loc + " is " + instr
    }

    static get_end_mark_loc()  { return parseInt(mi_marks_slider_id.noUiSlider.get()[1]) }

    static set_end_mark_loc(event_or_loc){ //event_or_loc, if not passed, defaults to
        let begin_loc = this.get_begin_mark_loc()
        let the_do_list = MiState.get_do_list_smart() //probably gets real do_lsit here.
        let loc
        if      (typeof(event_or_loc) == "number") { loc = event_or_loc }
        else if (event_or_loc == "extend_maybe") { //passed by set_up_next_do
            let old_end_loc = this.get_end_mark_loc()
            if (old_end_loc == the_do_list.length - 2) { loc = the_do_list.length - 1 }
            else { return }  //no change to the loc.
        }
        else if (typeof(event_or_loc) == "string") {
            loc = parseFloat(event_or_loc) //noUiSlider onslide passes in a float as a string. Must parse it as a float (not int) and round below
        }
        else                                       { loc = parseInt(event_or_loc.value) }
        if (loc < 0) { loc = 0 }
        if (loc < begin_loc) {
            this.set_begin_mark_loc(begin_loc)
            dde_error("You can't set the end mark to before the begin mark.<br/>" +
                "Move the begin mark further left first.")
        }
        loc = Math.round(loc) //the slider callback onslide returns a float
        let instr = ""
        if(the_do_list) {
            instr = the_do_list[loc]
            instr = to_source_code({value: instr}).substr(0, 60)
        }
        mi_marks_slider_id.noUiSlider.setHandle(1, loc)
        mi_end_marks_slider_pos_id.innerHTML = "end mark at " + loc + " is " + instr
    }

    static is_job_in_mi_dialog(){ return MakeInstruction.get_instruction_name_from_ui() == "new Job" }

    static job_in_mi_dialog(){
        if(!this.is_job_in_mi_dialog()) { return null }
        let job_name = MakeInstruction.arg_name_to_src_in_mi_dialog("name")
        if (!is_string_a_literal_string(job_name)) { return false }
        job_name = job_name.substring(1, job_name.length - 1)
        if(job_name.length == 0) { return false }
        let job_instance = Job[job_name]
        if(job_instance instanceof Job) { return job_instance }
        else { return null }
    }



    //do_list now has the orig do_list in it,  but does it need to be run to be
    //used by the play buttons?
    /*static start_is_done_with_initial_g_and_paused(job_instance){
        if(Instruction.array_has_only_non_inserting_instructions(job_instance.do_list, job_instance)){
            job_instance.playable = true
            job_instance.disable_modify_do_list = true
            job_instance.dont_proceed_after_initial_g = false //not sure I should do this here.
            job_instance.stop_for_reason("interrupted", "Normal stopping of Job after initialization.")
            this.last_play_button_success_fn.apply(this)
        }
        else {
           warning("Job." + job_instance + " is defined.<br/>" +
                   "In order to use the play/step controls with this Job,<br/>" +
                   "you must run the Job once through completion.<br/>" +
                   'Click on <button>Run</button> in Make Instruction dialog to do this.')
        }
    }*/

    static start_record(){
        if(!this.is_job_in_mi_dialog()){
            MakeInstruction.update_instruction_name_and_args("new Job")
        }
        let job_name = MakeInstruction.arg_name_to_src_in_mi_dialog("name")
        job_name = job_name.trim()
        if (is_string_a_literal_string(job_name)) {
            job_name = job_name.substring(1, job_name.length - 1)
            if(job_name.length == 0) {
                sim_pane_content_id.scrollTop = 0
                MakeInstruction.set_border_color_of_arg("name", "red")
                let id = MakeInstruction.arg_name_to_dom_elt_id("name")
                let elt = window[id]
                elt.focus() //hmm, not working. maybe because doc pane is scrolling to the Job doc???
                elt.setSelectionRange(1, 1) //set cursor to between the two quote chars.
                out("The name in the Job field is an empty string.<br/>" +
                           'Please edit the Job name and click "Record" again.<br/>' +
                           "Preserve the quotes around the Job name.",
                           "red")
                return
            }
        }
        else {
            sim_pane_content_id.scrollTop = 0
            MakeInstruction.set_border_color_of_arg("name", "red")
            id = MakeInstruction.arg_name_to_dom_elt_id("name")
            elt = window[id]
            elt.focus()
            dde_error("The name in the Job field is not a literal string.<br/>" +
                      "A literal string is surrounded with single or double quotes.<br/>" +
                      "To record, we must have a valid Job name.<br/>" +
                      'Please edit the Job name and click "Record" again.')
        }
        MakeInstruction.set_border_color_of_arg("name") //valid name so set it back to normal
        let job_instance = Job[job_name]
        if (!job_instance) {
            let inst_src = MakeInstruction.dialog_to_instruction_src(true)
            if (inst_src == null) { return null } //error message has already been printed by dialog_to_instruction_src
            try { job_instance = eval(inst_src) }
            catch(err){ //this should rarely happen because dialog_to_instruction_src catcnes most bad args.
                dde_error("The job in the dialog is invalid with: <br/>" +
                err.message +
                "<br/>Please edit its fields and try again.")
            }
        }
        MiState.job_instance = job_instance
        if(job_instance.status_code == "suspended") {
            job_instance.unsuspend()
            setTimeout(MiRecord.start_record_aux, job_instance.inter_do_item_dur + 100)
        }
        else { this.start_record_aux() }
    }

    static start_record_aux(){
        let job_instance = MiState.job_instance //closed over
        delete job_instance.do_list
        job_instance.orig_args.do_list = [] //might be a rpevious recording in there. lose it!
        //ok now we've got a valid job with job_instance.orig_args.do_list == []
        MiState.status = "recording"
        MiRecord.set_max_loc(0)
        MiRecord.set_end_mark_loc(0)
        MiRecord.set_begin_mark_loc(0)
        MiRecord.set_play_loc(0)

        MiRecord.set_record_state("active")
        MiRecord.set_step_reverse_state("disabled")
        MiRecord.set_reverse_state("disabled")
        MiRecord.set_step_play_state("disabled")
        MiRecord.set_play_state("disabled")
        MiRecord.set_insert_recording_state("disabled")
        new Job({
            name: "mi_record",
            do_list: [
                Dexter.set_follow_me(),
                Robot.loop(true,
                            function(){
                                let rs_array = last(this.rs_history)
                                let rs_obj = new RobotStatus({robot_status: rs_array})
                                let angles = rs_obj.measured_angles(7)
                                angles.unshift("@")
                                job_instance.orig_args.do_list.push(angles)
                                let loc_of_new_instr = job_instance.orig_args.do_list.length - 1 //will be at least 0 due to the above push
                                MiRecord.set_max_loc(loc_of_new_instr + 1)
                                MiRecord.set_play_loc(loc_of_new_instr) //because we want to SEE the instr just recorded, not one beyond it
                                out("Recording Dexter joint angles: " + angles,
                                     "#95444a", //brown,
                                     true)
                                return job_instance.robot.get_robot_status() //immediately()
                            })
            ]}).start()

    }

    static stop_record(){
        Job.mi_record.stop_for_reason("interrupted", "User stopped the recording.")
        setTimeout(MiRecord.stop_record_aux,  //give job a chance to stop properly since its still recording
                   (MiState.job_instance.inter_do_item_dur * 1000) + 100)
    }
    //can't use 'this' because its not bound when called from the timeout above
    static stop_record_aux(){
        MiState.status           = null //"recording", "playing" "reverse_playing", "stepping", "reverse_stepping"
        //MiRecord.play_intervals      = null
        MiRecord.stick_recording_in_ui()
        MiRecord.set_max_loc() //grabs smart do_list, must be done before setting end mark or end mark will truncate to old max
        MiRecord.set_begin_mark_loc(0)
        let the_do_list = MiState.get_do_list_smart() //this will always get the orig do_list length right after a record.
        MiRecord.set_end_mark_loc(the_do_list.length - 1) //do before calling play_middle_onchange
        mi_play_middle_checkbox_id.checked = true     //do before calling play_middle_onchange
        MiRecord.play_middle_onchange() //just sets ui of highlighted segments and delete button

        MiRecord.set_play_loc(0)
        MiRecord.set_begin_mark_loc(0) //since record has no inserting instrutions, this is correct.
        MiRecord.set_end_mark_loc(the_do_list.length - 1)
        MiRecord.set_record_state("enabled")
        MiRecord.set_step_reverse_state("enabled")
        MiRecord.set_reverse_state("enabled")
        MiRecord.set_pause_state("disabled")
        MiRecord.set_step_play_state("enabled")
        MiRecord.set_play_state("enabled")
        MiRecord.set_insert_recording_state("enabled")
    }

    static stick_recording_in_ui(){
        //if(MakeInstruction.get_instruction_name_from_ui() != "new Job"){
        //    MakeInstruction.update_instruction_name_and_args("new Job")
        //}
        let job_instance = this.job_in_mi_dialog()
        let do_list_src = "["
        let recorded_do_list = job_instance.orig_args.do_list
        for(let i = 0; i < recorded_do_list.length; i++){
           let instr_src = to_source_code({value: recorded_do_list[i]})
           let comma_or_not = ","
           let suffix = " "
           if(i == recorded_do_list.length - 1) {
                comma_or_not = " "
                suffix = "" //so final close square bracket won't be indented
           }
           let count_text = ((i == 0) ? " of " + recorded_do_list.length : "")
           do_list_src += instr_src + comma_or_not + " // " + i + count_text + "\n" + suffix
        }
        //do_list_src = replace_substrings(do_list_src, "],", "],\n")
        do_list_src += "]"
        let do_list_elt_id = MakeInstruction.arg_name_to_dom_elt_id("do_list")
        window[do_list_elt_id].value = do_list_src
    }

    static start_reverse(step = false){
        if(!this.prepare_for_play()) {} //warning messages already printed.
        //now MiState.job_instance should be set
        else if(!MiState.job_instance.do_list || (this.get_play_loc() <= 0)) {
            warning("The play location is at 0.\nYou can't go backwards from 0.")
        }
        else {
            let [begin1, end1, begin2, end2] = this.get_play_instruction_locs()
            let real_end = ((typeof(end2) == "number") ? end2 : end1)
            if((begin1 === undefined) || (real_end == 0)) { warning("No instructions are selected to play backwards.") }
            else {
                MiState.status = (step ? "reverse_stepping" : "reverse_playing")
                let play_loc = this.get_play_loc()
                this.set_record_state("disabled")
                this.set_step_reverse_state((step ? "active" : "disabled"))
                this.set_reverse_state((step ? "disabled" : "active"))
                this.set_step_play_state("disabled")
                this.set_pause_state("enabled")
                this.set_play_state("disabled")
                this.set_insert_recording_state("disabled")
                MiState.job_instance.stop_reason = null //otherwise, if we ran to completion, do_next_item wouldn't allow instructions to be run
                MiState.job_instance.suspend("Make Instruction suspended this Job.") //If we don't have status_code = "suspended",  unsuspend will take no effect.
                //before the below, pc is on the last insr executed.
                MiState.job_instance.program_counter = play_loc //now pc is one after the first inst we want to execute.
                      //but MiState.run... will supply an inc of -1 to reduce that pc to
                      //what we want to execute first. The 1 in set_up_next_do(1) called by unsuspend is ignored
                      //by MiState.run... which always uses an inc of -1 for reverse and reverse step.
                MiState.job_instance.unsuspend()  //calls set_up_next_do(1), handles setting of disable_modify_do_list
            }
        }
    }

    static step_reverse(){
        this.start_reverse(true)
    }

    static step_play(){
        this.start_play(true)
    }

    //new semantics: sets MiState.job_instance to the job indicated in the MI dialog, and returns true,
    //else prints warnings on what to do and returns false
    static prepare_for_play(){
        if(!this.is_job_in_mi_dialog()) {
            warning("There is no Job in the Make Instruction dialog to play.<br/>" +
                "Pick one on the 'Replace Arg Values' menu,<br/>" +
                "or option_click on one in the editor.")
            return false
        }
        let job_name = MakeInstruction.arg_name_to_src_in_mi_dialog("name")
        if (!is_string_a_literal_string(job_name) || (job_name.length < 3)) {
            warning("The name field of the Job has invalid syntax.<br/>" +
                'It should look like <code>"my_job"</code> (including the quotes.)')
            return false
        }
        job_name = job_name.substring(1, job_name.length - 1)
        let job_instance = Job[job_name]
        if(!(job_instance instanceof Job) || !job_instance.do_list || (job_instance !== MiState.job_instance)) {
            let inst_src = MakeInstruction.dialog_to_instruction_src(true)
            if (inst_src == null) { return false } //error message has already been printed by dialog_to_instruction_src
            try { job_instance = window.eval(inst_src) }
            catch(err){ //this should rarely happen because dialog_to_instruction_src catches most bad args.
                warning("The job in the dialog is invalid with:<br/>" +
                    err.message)
                return false
            }
        }
        if(job_instance === MiState.job_instance) { }// no change so leave setting alone
        else { //got a new job.
            MiState.job_instance = job_instance
            //this.status              = null //null, "recording", "playing" "reverse_playing", "stepping", "reverse_stepping"
            this.init_with_job_in_dialog()
        }
        job_instance.modify_program_counter_increment_fn = MiState.run_next_instruction
        return true
    }

    static start_play(step=false){
        if(!MiRecord.prepare_for_play()){ } //warnings already printed
        else { //we have a valid job in MiState.job_instance. It *might* not have a dolist
            MiState.status = (step ? "stepping" : "playing") //must be after prepare_for_play
            let job_instance = this.job_in_mi_dialog()
            let play_loc = (job_instance.do_list ? this.get_play_loc() : 0 ) //if no do_list, we're going to start at 0
            let [begin1, end1, begin2, end2] = this.get_play_instruction_locs()
            if(begin1 === undefined) { warning("No instructions selected to play.") }
            else {
                if(!job_instance) { shouldnt("in MiRecord." + start_play + " with bad job_instance: " +  job_instance) }
                this.set_record_state("disabled")
                this.set_step_reverse_state("disabled")
                this.set_reverse_state("disabled")
                this.set_pause_state("enabled")
                this.set_step_play_state((step ? "active" : "disabled"))
                this.set_play_state((step ? "disabled" : "active"))
                this.set_insert_recording_state("disabled")
                if(!job_instance.do_list) { //must START the job
                    let begin1 = 0 //since no do_list, we haven't run any instructions, so only makes sense to start at the beginning, regardless of what the user has set for the begin slider. highest_completed)nsruction here is none.
                    MiRecord.set_play_loc(begin1)
                    let end_pc = ((begin2 === undefined) ? end1 : end2) //beware, in the end2 case, there's a gap in the middle of instructions not to play
                    end_pc += 1
                    if(end_pc == job_instance.orig_args.do_list.length) {
                        end_pc = "end" //pretty much always what you would want here. play to the end.
                                       //esp given that playing may insert instructions.
                    }
                    //mi_play_middle_checkbox_id.checked = true //already done by init.  //makes sense with no do_list. do before calling play_middle_onchange
                    MiRecord.play_middle_onchange() //just sets ui of highlighted segments and delete button
                    job_instance.start({program_counter: begin1,
                                        end_program_counter: end_pc,
                                        when_stopped: function() {MiRecord.pause() }}) //can't used just this.pause_aux here because the job passes itsself as the subject when calling the when_stopped fn.
                }
                else if (play_loc == job_instance.do_list.length){
                    this.set_record_state("enabled")
                    this.set_step_reverse_state("enabled")
                    this.set_reverse_state("enabled")
                    this.set_step_play_state("enabled")
                    this.set_pause_state("enabled")
                    this.set_play_state("enabled")
                    warning("Play location: " +  play_loc + " is already at the end of the Job's do_list.<br/>" +
                            "There are no more instructions to play.<br/>" +
                            "To play back already played instructions,<br/>" +
                            "drag the play location slider (round dot) to the left.")

                }
               // else if (play_loc <= job_instance.highest_completed_instruction_id){ //don't execute
               //     needs work
               // }
                else {
                   job_instance.stop_reason = null //otherwise, if we ran to completion, do_next_item wouldn't allow instructions to be run
                   job_instance.suspend("Make Instruction suspended this Job.") //If we don't have status_code = "suspended",  unsuspend will take no effect.
                   job_instance.program_counter = play_loc - 1 //-1 because unsuspend will call set_up_next_do(1), to make the first instruction run be play_loc.
                   job_instance.unsuspend()  //calls set_up_next_do(1), handles setting of disable_modify_do_list
                }
            }
        }
    }

    static pause(reason="Make Instruction suspended this Job."){
        if(MiState.status == "recording") { MiRecord.stop_record() }
        else {
            MiState.status = null
            let job_instance = MiRecord.job_in_mi_dialog()
            if(!job_instance) { shouldnt("in MiRecord.pause got bad job_instance: " + job_instance) }
            job_instance.suspend(reason)
            this.pause_ui()
        }
    }

    static pause_ui(){
        this.set_record_state("enabled")
        this.set_step_reverse_state("enabled")
        this.set_reverse_state("enabled")
        this.set_step_play_state("enabled")
        this.set_pause_state("disabled")
        this.set_play_state("enabled")
        this.set_insert_recording_state("enabled")
    }

    static play_middle_onchange(){ //called when checkbox changed and by stop_record
        let begin_loc   = this.get_begin_mark_loc()
        let end_loc     = this.get_end_mark_loc()
        let the_do_list = MiState.get_do_list_smart()
        let marks_max   = the_do_list.length
        if(mi_play_middle_checkbox_id.checked){
            mi_marks_slider_id.noUiSlider.destroy() //disappears slider completely
            noUiSlider.create(mi_marks_slider_id, {
                start: [begin_loc, end_loc],
                connect: [false, true, false],
                range: {
                    'min': -0.01, //if min is not less than max, noUiSlider errors. So always make min -1, but
                              //then set_begin_mark auto-changes -1 to 0, so begin mark is never really -1
                    'max': marks_max
                }
            })
            mi_marks_slider_id.noUiSlider.on("slide", this.marks_slider_onslide)
            mi_marks_slider_id.noUiSlider.on("change", this.marks_slider_onchange) //fired at the end of a drag hande

            delete_instructions_id.innerHTML = "Delete ends"
        }
        else {
            mi_marks_slider_id.noUiSlider.destroy() //disappears slider completely
            noUiSlider.create(mi_marks_slider_id, {
                start: [begin_loc, end_loc],
                connect: [true, false, true],
                range: {
                    'min': -0.01,
                    'max': marks_max
                }
            })
            mi_marks_slider_id.noUiSlider.on("slide", this.marks_slider_onslide)
            mi_marks_slider_id.noUiSlider.on("change", this.marks_slider_onchange)
            delete_instructions_id.innerHTML = "Delete middle"
        }
    }


    //____________
    static insert_recording(){
        let result =
`\nnew Job({
        name: "mi_play_1",
        do_list: [Dexter.set_keep_position(),
                  Dexter.loop(true,
                    function(iter_index){
                        if (iter_index >= mi_recorded_angles.length){
                             return Robot.break()
                        }
                        else { return Dexter.pid_move_all_joints(mi_recorded_angles[iter_index]) }
                    })
        ]})` +
        "\n\nvar mi_recorded_angles =\n" +
        this.make_big_array_string()

        Editor.insert(result)
    }
    static make_big_array_string(){
        let job_instance = this.job_in_mi_dialog()
        let the_do_list = job_instance.do_list
        let result = "[ //______joints 1 through 7______\n"
        for(let i = 0; i < the_do_list.length; i++){
            result += "["
            let arr = the_do_list[i]
            result += arr.join(", ")
            let suffix = ((i == the_do_list.length - 1) ? " " : ",")
            result += "]" + suffix + " // " + i + "\n"
        }
        result += "]\n"
        return result
    }
    //________buttons_________
    static make_html(){
        let result = "<div style='white-space:nowrap;'>" +
                         "<input id='mi_record_id'       style='vertical-align:25%;cursor:pointer;' type='button' value='Record'/>" +
                         "<span  id='mi_reverse_id'      style='font-size:25px;margin-left:5px;cursor:pointer;'>&#9664;</span>" +
                         "<span  id='mi_step_reverse_id' style='font-size:15px;margin-left:5px;cursor:pointer;vertical-align:20%;'>&#9664;</span>" +
                         "<b     id='mi_pause_id'        style='font-size:28px;margin-left:5px;cursor:pointer;'>&#8545</b>" +
                         "<span  id='mi_step_play_id'    style='font-size:15px;margin-left:5px;cursor:pointer;vertical-align:20%;'>&#9654;</span>" +
                         "<span  id='mi_play_id'         style='font-size:25px;margin-left:5px;cursor:pointer;'>&#9654;</span>" +
                         //"<input id='mi_insert_recording_id' style='margin-left:5px;vertical-align:25%;' type='button' value='Insert Recording'/>" +
                            /*"<div style='display:inline-block;margin-left:10px;'>" +
                                "<div><input type='checkbox' checked id='mi_play_seg_begin_id'  style='margin-left:12px;cursor:pointer;'/>" +
                                     "<input type='checkbox' checked id='mi_play_seg_middle_id' style='margin-left:30px;cursor:pointer;'/>" +
                                     "<input type='checkbox' checked id='mi_play_seg_end_id'    style='margin-left:22px;cursor:pointer;'/>" +
                                "</div>" +
                                "<div>begin middle end</div>" +
                           "</div>" + */
                         "<div style='display:inline-block;margin-left:10px;vertical-align:50%'>" +
                              "<input type='checkbox' checked id='mi_play_middle_checkbox_id' onchange='MiRecord.play_middle_onchange()' style='margin-left:12px;cursor:pointer;' " +
                                      "title='When checked, Play, and Backwards Play\nwill only run the instructions between\n(inclusive) the knobs on the double slider below.\nUnchecked plays those instructions NOT between the two knobs.'/>" +
                              "play middle" +
                         "</div>" +
                     "</div>" +
                     "<div style='white-space:nowrap;'>highest_completed_instruction: " +
                           "<button id='mi_highest_completed_instruction_id' title='Click to reset the current job.\nThe next time it is played, it will be:\n1. redefined from the Make Instruction dialog code\n2. started.' style='padding:1px;font-size:13px;'>None</button></div>" +
                     "<div id='mi_record_slider_pos_id' style='white-space:nowrap;'></div>" +
                     "<div style='white-space:nowrap;'>0" +
                       "<input id='mi_record_slider_id' oninput='MiRecord.set_play_loc(this)' type='range' value='0' min='0' max='100' style='width:270px;cursor:poinnter;'" +
                             " title='Drag the knob to set\nthe starting play location.'/>" +
                       "&nbsp;<span id='mi_record_slider_max_id'>0</span>" +
                     "</div>" +
                    //"<input id='mi_begin_mark_slider_id' oninput='MiRecord.set_begin_mark_loc(this)' type='range' value='0' min='0' max='100' style='width:270px;'" +
                    //" title='Drag the knob to set\nMark A.\nYou must Record first.'/>" +
                    "<div style='white-space:nowrap;'> 0 <div id='mi_marks_slider_id' style='display:inline-block; width:270px;height:10px;' " +
                          `title='Designates which instructions will be used\nwhen you click play, backwards play or insert.\nGoverned by the "play middle" checkbox.'></div>` +
                        "&nbsp;<span id='mi_marks_slider_max_id'>0</span> &nbsp; " +
                        "<button title='Sorry, not yet implemented.' id='delete_instructions_id'>Delete ends</button>" +
                    "</div>" +
                    "<div id='mi_begin_marks_slider_pos_id' style='white-space:nowrap;'></div>" +
                    "<div id='mi_end_marks_slider_pos_id'   style='white-space:nowrap;'></div>"
                    //"<span>0</span>" +
                   // "<input id='mi_end_mark_slider_id' oninput='MiRecord.set_end_mark_loc(this)' type='range' value='0' min='0' max='100' style='width:270px;'" +
                   // " title='Drag the knob to set\nMark A.\nYou must Record first.'/>" +
                    //"<span id='mi_end_mark_slider_max_id'>0</span>"
        return result
    } //&VerticalSeparator;  document.getElementById("myBtn").disabled = true;

    //returns a string, either "all", "begin", "middle" or "end"
    //static get_play_segment_selection(){
    //   return document.querySelector('input[name="mi_play_segment"]:checked').value
    //}

    //returns an array of 4 non-neg integers indicating
    // the instructions that are permitted to play.
    // data format: [begin1, end1, begin2, end2]
    // but note that all 4 may be undefined, or the last 2 undefined,
    // meaning, don't play those segements
    //begin1 >= end1 >= begin2 >= end2  except if undefines.
    //if begin1 is undeffined, so is begin2.
    //if a begin is undefined, so is its corresponding end.
    //if middle is checked, the numbers are inclusive.
    //if middle is unchecked, we play the two outer "end" segments,
    // exclusive of begin1 and end2.
    static get_play_instruction_locs(){
        let begin1, end1, begin2, end2
        if(mi_play_middle_checkbox_id.checked) {
            begin1 = this.get_begin_mark_loc()
            end1   = this.get_end_mark_loc()
        }
        else {
            begin1 = 0
            end1   = this.get_begin_mark_loc() - 1
            begin2 = this.get_end_mark_loc() + 1
            end2   = MiState.get_do_list_smart().length - 1
        }
        let locs = [begin1, end1, begin2, end2]
        return locs
     }

    //cases: parens define the 2 segments, vertical bar is MiRecord.play_loc
    //    (   )   (   ) |
    //    (   )   ( | )
    //    (   ) | (   )
    //    ( | )   (   )
    // |  (   )   (   )
    // play_loc reduces the locs to play unless its <= begin1
    /* No longer needed
      static modify_play_instruction_locs_playing_forward(play_loc, locs){
         let [begin1, end1, begin2, end2] = locs
         if(begin1 === undefined) { return locs } //0 segments, nothing to play
         //else if(end2) { //we have 2 segments         (  )    (  )
         else if(end2 && (play_loc > end2)) {      //   (   )   (   ) |
             return [undefined, undefined, undefined, undefined]
         }
         else if(end2 && (play_loc <= end2) &&
                         (play_loc > begin2)){     //   (   )   ( | )
             return [play_loc, end2, undefined, undefined]
         }
         else if(play_loc > end1){                 //    (   ) | (   )
             return [begin2, end2, undefined, undefined]
         }
         // has seg 1, and maybe seg2 below here, leave seg2 alone
         else if((play_loc < end1) &&
                 (play_loc >= begin1)){            //    ( | )   (   )
             return [play_loc, end1, begin2, end2]
         }
         else  { return locs }                     // |  (   )   (   )
    }

    static modify_play_instruction_locs_playing_reverse(play_loc, locs){
        let [begin1, end1, begin2, end2] = locs
        if(begin1 === undefined) { return locs } //0 segments, nothing to play
        //else if(end2) { //we have 2 segments         (  )  (  )
        else if(end2 && (play_loc > end2)) {      //   (   )   (   ) |
            return locs
        }
        else if(end2 && (play_loc <= end2) &&
            (play_loc > begin2)){                 //   (   )   ( | )
            return [begin1, end1, begin2, play_loc]
        }
        else if(play_loc >= end1){                 //    (   ) | (   )
            return [begin1, end1, undefined, undefined]
        }
        // has seg 1, and maybe seg2 below here, leave seg2 alone
        else if((play_loc < end1) &&
            (play_loc >= begin1)){                //    ( | )   (   )
            return [begin1, play_loc, undefined, undefined]
        }
        else  {                                   // |  (   )   (   )
            return [undefined, undefined, undefined, undefined]
        }
    }*/

    //https://refreshless.com/nouislider/events-callbacks/
    static marks_slider_onslide(values_array, handle_number, unencoded, tap, positions){
         let new_val = values_array[handle_number]
         if(handle_number == 0)       { MiRecord.set_begin_mark_loc(new_val) } //can't use "this" here, must be MiRecord
         else if (handle_number == 1) { MiRecord.set_end_mark_loc(new_val) }
         else { shouldnt("in marks_slider_onupdate with handle_number: " + handle_number) }
    }

    static marks_slider_onchange(values_array, handle_number, unencoded, tap, positions){
        if(handle_number == 1) {
            if(MiState.job_instance &&
                (handle_number == 1) &&
                (values_array[1] == MiState.get_do_list_smart().length)){
                MiState.set_end_mark_to_do_list_length_maybe()
            }
        }
    }

     //called by show, with no job in the dialog
    static init(){
       MiState.init(MiState.job_instance) //so that we don't set MiState.job_instance to null IFF MiState.job_instance is not null
       if(mi_marks_slider_id && mi_marks_slider_id.noUiSlider) { mi_marks_slider_id.noUiSlider.destroy() }
       noUiSlider.create(mi_marks_slider_id, {
            start: [0, 0],
            connect: [false, true, false],
            range: {
                'min': -0.01,
                'max': 0
            }
        })
        this.set_max_loc(0)
        this.set_end_mark_loc(0)
        this.set_begin_mark_loc(0)
        this.set_play_loc(0)
        mi_marks_slider_id.noUiSlider.on("slide", this.marks_slider_onslide)
        mi_marks_slider_id.noUiSlider.on("change", this.marks_slider_onchange)

        mi_play_middle_checkbox_id.checked = true //makes sense with no do_list. do before calling play_middle_onchange
        //MiRecord.play_middle_onchange() //don't do as screws up if no job_instance or do_list
        delete_instructions_id.innerHTML = "Delete ends"
        mi_highest_completed_instruction_id.onclick = function(){ MiRecord.reset_job() }
        MiState.set_end_mark_to_do_list_length_maybe()
        this.set_record_state("enabled")
        this.set_reverse_state("disabled")
        this.set_step_reverse_state("disabled")
        this.set_pause_state("disabled")
        this.set_step_play_state("disabled")
        this.set_play_state("disabled")
        this.set_insert_recording_state("enabled")
        this.set_highest_completed_instruction_ui()
    }

    static init_with_job_in_dialog(){
        this.init()
        this.set_step_play_state("enabled")
        this.set_play_state("enabled")
    }

    static set_record_state(state) {
        if(state == "disabled") {
            mi_record_id.disabled = true
            mi_record_id.value    = "Record"
            mi_record_id.onclick  = function(){MiRecord.start_record()}
            mi_record_id.title    = "Record disabled while playing."
            mi_record_id.style["background-color"] = "#d8dadf" //"#ffd5e2"
        }
        else if(state == "enabled") {
            mi_record_id.disabled = false
            mi_record_id.value    = "Record"
            mi_record_id.onclick  = function(){MiRecord.start_record()}
            mi_record_id.title    = "Click to record Dexter's motions\nas you manually move it.\nRecordings are stored in Jobs."
            mi_record_id.style["background-color"] = "#ff8899" //"#ff6981"
        }
        else if(state == "active") {
            mi_record_id.disabled = false
            mi_record_id.value    = "recording"
            mi_record_id.onclick  = function(){MiRecord.stop_record()}
            mi_record_id.title    = "Click to stop recording."
            mi_record_id.style["background-color"] = "#ff2839"
        }
        else {shouldnt("MiRecord.set_record_state passed invalid state: " + state) }
    }
    static set_reverse_state(state) {
        if(state == "disabled") {
            mi_reverse_id.disabled = true
            mi_reverse_id.onclick  = function(){MiRecord.start_reverse()}
            mi_reverse_id.title    = "Reverse is disabled when no recording and\nduring recording & playing."
            mi_reverse_id.style["color"] = "#bebcc0"
        }
        else if(state == "enabled") {
            mi_reverse_id.disabled = false
            mi_reverse_id.onclick  = function(){MiRecord.start_reverse()}
            mi_reverse_id.title    = "Play the current job backwards.\nPlay only those instructions indicated\nin dark green on the double slider below."
            mi_reverse_id.style["color"] = "#000000"
        }
        else if(state == "active") {
            mi_reverse_id.disabled = false
            mi_reverse_id.onclick  = function(){MiRecord.pause()}
            mi_reverse_id.title    = "Click to stop playing."
            mi_reverse_id.style["color"] = "#00f036"  //green
        }
        else {shouldnt("MiRecord.set_reverse_state passed invalid state: " + state) }
    }

    static set_step_reverse_state(state) {
        if(state == "disabled") {
            mi_step_reverse_id.disabled = true
            mi_step_reverse_id.onclick     = function(){MiRecord.step_reverse()}
            mi_step_reverse_id.title       = "Play is disabled when no recording and\nduring recording."
            mi_step_reverse_id.style["color"] = "#bebcc0"
        }
        else if(state == "enabled") {
            mi_step_reverse_id.disabled = false
            mi_step_reverse_id.onclick     = function(){MiRecord.step_reverse()}
            mi_step_reverse_id.title       = "Run the current instruction and step back one instruction.\nIgnores the double slider below."
            mi_step_reverse_id.style["color"] = "#000000"
        }
        else if(state == "active") {
            mi_step_reverse_id.disabled = false
            mi_step_reverse_id.onclick  = function(){MiRecord.pause()}
            mi_step_reverse_id.title    = "Click to stop playing."
            mi_step_reverse_id.style["color"] = "#00f036" //green
        }
        else {shouldnt("MiRecord.set_reverse_state passed invalid state: " + state) }
    }
    static set_pause_state(state) {
        if(state == "disabled") {
            mi_pause_id.disabled = true
            mi_pause_id.onclick  = function(){MiRecord.pause()}
            mi_pause_id.title    = "Pause is disabled when not playing."
            mi_pause_id.style["color"] = "#bebcc0"
        }
        else if(state == "enabled") {
            mi_pause_id.disabled = false
            mi_pause_id.onclick  = function(){MiRecord.pause()}
            mi_pause_id.title    = "Stop playing."
            mi_pause_id.style["color"] = "#000000"
        }
        else if(state == "active") { //this is never active. Just here for completeness
            mi_pause_id.disabled = false
            mi_pause_id.onclick  = function(){MiRecord.pause()}
            mi_pause_id.title    = "Stop playing."
            mi_pause_id.style["color"] = "#000000"
        }
        else {shouldnt("MiRecord.set_reverse_state passed invalid state: " + state) }
    }
    static set_step_play_state(state) {
        if(state == "disabled") {
            mi_step_play_id.disabled = true
            mi_step_play_id.onclick     = function(){MiRecord.step_play()}
            mi_step_play_id.title       = "Play is disabled when no recording and\nduring recording."
            mi_step_play_id.style["color"] = "#bebcc0"
        }
        else if(state == "enabled") {
            mi_step_play_id.disabled = false
            mi_step_play_id.onclick     = function(){MiRecord.step_play()}
            mi_step_play_id.title       = "Run the current instruction and step forward one instruction.\nIgnores the double slider below."
            mi_step_play_id.style["color"] = "#000000"
        }
        else if(state == "active") {
            mi_step_play_id.disabled = false
            mi_step_play_id.onclick  = function(){MiRecord.pause()}
            mi_step_play_id.title    = "Click to stop playing."
            mi_step_play_id.style["color"] = "#00f036" //green
        }
        else {shouldnt("MiRecord.set_reverse_state passed invalid state: " + state) }
    }

    static set_play_state(state) {
        if(state == "disabled") {
            mi_play_id.disabled = true
            mi_play_id.onclick     = function(){MiRecord.start_play()}
            mi_play_id.title       = "Play is disabled when no recording and\nduring recording."
            mi_play_id.style["color"] = "#bebcc0"
        }
        else if(state == "enabled") {
            mi_play_id.disabled = false
            mi_play_id.onclick     = function(){MiRecord.start_play()}
            mi_play_id.title       = "Play the current job forwards.\nPlay only those instructions indicated\nin dark green on the double slider below."
            mi_play_id.style["color"] = "#000000"
        }
        else if(state == "active") {
            mi_play_id.disabled = false
            mi_play_id.onclick  = function(){MiRecord.pause()}
            mi_play_id.title    = "Click to stop playing."
            mi_play_id.style["color"] = "#00f036" //green
        }
        else {shouldnt("MiRecord.set_reverse_state passed invalid state: " + state) }
    }


    static set_insert_recording_state(state) { }
       /* if(state == "disabled") {
            mi_insert_recording_id.disabled = true
            mi_insert_recording_id.value    = "Insert Recording"
            mi_insert_recording_id.onclick  = function(){MiRecord.insert_recording()}
            mi_insert_recording_id.title    = "Disabled when no recording and\nduring recording & playing."
            mi_insert_recording_id.style["background-color"] = "#d8dadf" //"#e0d9ff"
        }
        else if(state == "enabled") {
            mi_insert_recording_id.disabled = false
            mi_insert_recording_id.value    = "Insert Recording"
            mi_insert_recording_id.onclick  = function(){MiRecord.insert_recording()}
            mi_insert_recording_id.title    = "Insert a job that will\nplay the latest recording\ninto the editor."
            mi_insert_recording_id.style["background-color"] = "#bca6fd"
        }
        else if(state == "active") {
            mi_insert_recording_id.disabled = true
            mi_insert_recording_id.value    = "Insert Recording"
            mi_insert_recording_id.onclick  = function(){MiRecord.insert_recording()}
            mi_insert_recording_id.title    = "Now inserting the recording."
            mi_insert_recording_id.style["background-color"] = "#9447ff"
        }
        else {shouldnt("MiRecord.set_insert_recording_state passed invalid state: " + state) }
    }*/

    //alsocalled from make_instruction.js
    static set_prepare_for_play_ui(){
        MiRecord.set_record_state("enabled")
        MiRecord.set_reverse_state("disabled")
        MiRecord.set_step_reverse_state("disabled")
        MiRecord.set_pause_state("disabled")
        MiRecord.set_step_play_state("enabled")
        MiRecord.set_play_state("enabled")
        MiRecord.set_insert_recording_state("disabled")
        MiRecord.set_highest_completed_instruction_ui()
    }

    static reset_job(){
        if(MiState.job_instance) {
           if(MiState.job_instance.is_active()){
               MiState.job_instance.stop_for_reason("interrupted", "Make Instance restarting job.")
           }
           delete MiState.job_instance.do_list //now prepare_for_play will recreate
                                               //job from its source in the dialog box.
        }
        if(MiRecord.prepare_for_play()){ //if no job in the MI dialog, his will print out warning and return false
            MiState.job_instance.highest_completed_instruction_id = -1
            MiRecord.set_prepare_for_play_ui()
            MiRecord.set_play_loc(0)
        }
        //don't do this. prepare_for_play prints a more accuurate message. else { warning("There's no job_instance that Make Instruction is now managing.") }
    }
}
