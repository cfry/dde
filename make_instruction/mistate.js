/* forward and reverse stepping ignores the marks. */
var MiState = class MiState {
    //since this is called from job.set_up_do_list, it's "this" isn't properly bound
    //so must use class name instead of "this".
    static run_next_instruction(job_instance=MiState.job_instance, program_counter_increment=null){ //called from set_up_next_do
        if(job_instance !== MiState.job_instance) { //the job has a modify_program_counter_increment_fn fn but its not the current job in MI, so MI ignores it
            return program_counter_increment
        }
        MiRecord.set_highest_completed_instruction_ui() //this is incremented in set_up_next_do, but do the MI UI here.
        if(MiState.status == null) { //happens when previous instr was a forward or reverse step.
            MiRecord.pause("Job paused while playing from Make Instruction.")
            return  null
        }
        else if (MiState.status == "playing") {
            if(!job_instance.disable_modify_do_list) { //running the last instr might have increased the length of the do_list
                MiRecord.set_max_loc()
                MiState.set_end_mark_to_do_list_length_maybe()
            }
            let inc = program_counter_increment
            let new_loc = MiState.next_loc_to_play(inc) //potentially adjusts new_loc due to gaps in the play interval
            //out("pc: " + job_instance.program_counter + " do length: " + job_instance.do_list.length +
            //    " next_loc_to_pay passed: (" + inc + ", " + ") => " + new_loc)
            //if((new_loc == null) && (job_instance.program_counter == 0) && (program_counter_increment == 0)){ //special case at beginning, program_counter_increment passed in is going to be 0
            //    new_loc = 0
            //}
            if(typeof(new_loc) == "number"){ //beware, new_loc can be 0.
                MiRecord.set_play_loc(new_loc)
                if(new_loc == job_instance.do_list.length) { //its over jim, but don't continue on which will call finish_job, disconnecting Dexter, and making it hard to backup etc, so ...
                    MiRecord.pause("Job played to end by Make Instruction.") //suspend job
                    return null
                }
                else { //keep going.
                    inc = new_loc - job_instance.program_counter
                    job_instance.disable_modify_do_list = (new_loc <= job_instance.highest_completed_instruction_id)
                    return inc
                }
            }
            else {
               new_loc = job_instance.program_counter + inc //will be == to do_list.length if we reached the end of the do_list
               MiRecord.set_play_loc(new_loc)
               MiRecord.pause("Job completed its last instruction\nwhile playing from Make Instruction.")
               return null
            }
        }
        else if (MiState.status == "reverse_playing") {
            job_instance.disable_modify_do_list = true
            let inc = -1 //run the istr that was a the pc before we started reverse stepping
            let new_loc = MiState.next_loc_to_play(inc)
            if(typeof(new_loc) == "number") { //beware, new_loc can be 0.
                inc = new_loc - job_instance.program_counter
                job_instance.disable_modify_do_list = true
                MiRecord.set_play_loc(new_loc)
                return inc  //usually -1
            }
            else {
                //new_loc = job_instance.program_counter + inc //will be == to do_list.length if we reached the end of the do_list
                //MiRecord.set_play_loc(new_loc)
                //warning("You can't step backwards from 0.<br/>No more instructions to back up to.")
                MiRecord.pause("Job completed its final instruction\nwhile playing backwards from Make Instruction.")
                return null
            }
        }
        else if (MiState.status == "stepping") { //ignore marks
            if(!job_instance.disable_modify_do_list) { //running the last instr might have increased the length of the do_list
                MiRecord.set_max_loc()
                //MiRecord.set_end_mark_loc("extend_maybe")
                MiState.set_end_mark_to_do_list_length_maybe()
            }
            let inc = program_counter_increment
            let new_loc = job_instance.program_counter + inc //MiState.next_loc_to_play(inc) //potentially adjusts new_loc due to gaps in the play interval
            //out("pc: " + job_instance.program_counter + " do length: " + job_instance.do_list.length +
            //" next_loc_to_pay passed: (" + inc + ", " + ") => " + new_loc)
            job_instance.disable_modify_do_list = (new_loc <= job_instance.highest_completed_instruction_id)
            //MiRecord.set_play_loc(new_loc) //no change from previous. but did_stepping captures new loc
            if (new_loc >= job_instance.do_list.length) {
                MiRecord.pause("Job completed its last instruction\nwhile playing from Make Instruction.")
                return null
            }
            else {
                MiState.status = "did_stepping"
                return inc
            }//usually 1  //if new_loc is do_list.length, that's ok, do_next_item will
        }
        else if (MiState.status === "did_stepping") {
            job_instance.program_counter += 1 //must leave pc at one higher then when
            //stepping done but, prepare to do the next instruction.
            MiRecord.pause("Job stepped forward\nwhile playing from Make Instruction.")
            MiRecord.set_play_loc(job_instance.program_counter)
            MiState.status = null
            return null
        }
        else if (MiState.status == "reverse_stepping") { //ignore marks
            let inc = -1 //run the PC
            let new_loc = job_instance.program_counter + inc //MiState.next_loc_to_play(inc) //potentially adjusts new_loc due to gaps in the play interval
            job_instance.disable_modify_do_list = true
            MiRecord.set_play_loc(new_loc)
            if (new_loc < 0) {
                MiRecord.pause("Job completed its final instruction\nwhile stepping backward in Make Instruction.")
                return null
            }
            else {
                MiState.status = "did_reverse_stepping"
                return inc //usually -1
            }
        }
        else if (MiState.status === "did_reverse_stepping") {
            //job_instance.program_counter -= 1 //leave pc alone. The next reverse will back it up one.
            MiRecord.pause("Job stepped backward\nwhile playing from Make Instruction.")
            //MiRecord.set_play_loc(job_instance.program_counter) redundant with reverse_stepping
            MiState.status = null
            return null
        }
        else {
            shouldnt("MiState.run_next_instruction got invalid MiState.status: " + MiState.status)
        }
    }
    /*not called static set_start_status(new_status) { //when user clicks on a button
       if(op == "playing") {
           this.status = op
           MiRecord.start_play()
       }
       else {
           shouldnt("MiState.set_start_status got invalid new_status: " + new_status)
       }
    }*/

   /* obsolete static ok_to_play_loc(loc){
        let [begin1, end1, begin2, end2] = MiRecord.get_play_instruction_locs() //this.play_intervals
        if(begin1 === undefined)                  { return false }
        else if((loc >= begin1) && (loc <= end1)) { return true }
        else if(begin2 === undefined)             { return false }
        else if((loc >= begin2) && (loc <= end2)) { return true }
        else                                      { return false }
    } */

    //return boolean
    static ok_to_play_loc(loc){
        let begin_loc = MiRecord.get_begin_mark_loc()
        let end_loc   = MiRecord.get_end_mark_loc()
        let do_list_length = MiState.get_do_list_smart().length
        if(loc < 0) { return null }
        else if (loc >= do_list_length) { return null }
        else if(MiRecord.get_play_middle()){ //excludes end_loc
            return ((loc >= begin_loc) && (loc < end_loc))
        }
        else { //ends
            return ((loc < begin_loc) || (loc >= end_loc))
        }
    }

    //returns null if shouldn't play inc + pc
    //pc is pointing at the prev instruction. We're computing the next instruction id
    //inc is neg when going in reverse
    /*static next_loc_to_play(inc) {
        let pc = this.job_instance.program_counter
        let loc = pc + inc
        let [begin1, end1, begin2, end2] =
            MiRecord.get_play_instruction_locs() //this.play_intervals
        //out("nltp: " + begin1 + ", " + end1 + ", " + begin2 + ", " + end2)
        if(begin1 == undefined) { return null }
        else if (inc >= 0) { //going forward
            if (loc < begin1) { return begin1 } //fast forward to begin1 if we are before it.
            else if((loc >= begin1) && (loc <= end1)) { return loc }
            //loc > end1
            else if (begin2 === undefined) {return null }
            //loc is > end1, we have a begin2
            else if(loc < begin2) { return begin2 }
            else if((loc >= begin2) && (loc <= end2)) { return loc }
            else if(pc == end2) { return loc } //end2 is a mark that means "go to the end of the do_list".
            else { return null }
        }
        else { //inc is neg so we're going backwards
           if(begin2) {
               if(loc > end2) { return end2 } //fast backwards to end2
               if((loc >= begin2) && (loc <= end2)){ return loc }
               else if ((loc < begin2) && (loc > end1)) { return end1} //loc is between end1 and begin2 so fast backward to end1
               else if((loc >= begin1) && (loc <= end1)) { return loc }
               else { return null } //loc is before begin1
           }
           else {  //there is no begin2
               if (loc > end1) { return end1 }
               else if ((loc >= begin1) && (loc <= end1)) { return loc }
               else { return null }
           }
        }
    }*/

    //inc is usually 1 or -1
    static next_loc_to_play(inc){
        let pc        = this.job_instance.program_counter
        let loc       = pc + inc //the proposed loc, but modified if outside what the marks indicate.
        let begin_loc = MiRecord.get_begin_mark_loc()
        let end_loc   = MiRecord.get_end_mark_loc()
        let fwd       = (inc >= 0)
        let do_list_length = MiState.get_do_list_smart().length
        if(loc < 0) { return null }
        else if (loc >= do_list_length) { return null }
        else if(MiRecord.get_play_middle()){ //excludes end_loc
            if(fwd){
              if(loc < begin_loc) { return begin_loc } //zoom ahead
              else if ((loc >= begin_loc) && (loc < end_loc)) { return loc } //normal, between marks
              else { return null } //loc >= end_loc
            }
            else { //backward
               if((loc == 0) && (end_loc == 0)) { return null } //end_loc is excluded, so we have to
                                                                //return end_loc - 1 but that would result in -1
                                                                //so return null
               if(loc >= end_loc) { return end_loc - 1 } //zoom backwards
               else if ((loc < end_loc) && (loc >= begin_loc)) { return loc } //normal
               else { return null } //loc is < begin_loc
            }
        }
        else { //playing the ends
            if(fwd) {
               if(loc < begin_loc) { return loc } //normal
               else if((loc >= begin_loc) && (loc <= end_loc)) { return end_loc } //zoom ahead
               else  { return loc } //normal (loc  must be < do_list_length here
            }
            else { //backward ends. include end_loc
               if(loc >= end_loc) { return loc }
               else if (loc >= begin_loc) {
                    if((loc == 0) && (begin_loc == 0)) { return null }
                    else {  return begin_loc - 1 } //zoom back
               }
               else { return loc } //normal. loc is < begin_loc and more than or equal to 0
            }
        }
    }

    static init(job_instance = null){
        if(this.job_instance && this.job_instance.is_active()) { this.job_instance.stop_for_reason("interrupted", "stopped due to initing Make Instance") }
        this.job_instance        = job_instance
        this.status              = null //null, "recording", "playing", "reverse_playing", "stepping", "reverse_stepping"
        this.end_mark_is_do_list_length = true
        //this.set_end_mark_to_do_list_length_maybe() //errors due to html not in place yet, but will get called by other inits
    }
    static set_end_mark_to_do_list_length_maybe() {
        if (MiState.end_mark_is_do_list_length) {
            let marks_max = 0
            let begin_mark = MiRecord.get_begin_mark_loc()
            let end_loc   = 0
            if(MiState.job_instance){
               if(MiState.job_instance.do_list) { end_loc = MiState.job_instance.do_list.length }
               else                             { end_loc = MiState.job_instance.orig_args.do_list.length }
            }
            mi_marks_slider_id.noUiSlider.updateOptions(
                {range: {min:0.01, max:end_loc},
                 start:[begin_mark, end_loc]}) //set the begin and end handles.
                 // null for a handle position is documentd to leave it alone,
                 // but I found that it deletes the whole handle, so I set the begin mark to where
                 //it was before we started.
            mi_marks_slider_max_id.innerHTML = end_loc
            mi_end_marks_slider_pos_id.innerHTML = "end mark always includes final instruction"
        }
    }

    static get_do_list_smart(){
        if(MiState.job_instance) {
            return (MiState.job_instance.do_list ?
                        MiState.job_instance.do_list :
                        MiState.job_instance.orig_args.do_list)
        }
        else { return null }
    }

    //called when the user types a char in MI Dialog arg fields.
    //after calling this, if you attempt a play, we must grab src from dialog, and then
    //any bad args will be evaled and reported.
    static invalidate_job_instance(){
        if(MiRecord.is_job_in_mi_dialog()) {
            if(this.job_instance && this.job_instance.is_active()) {
                this.job_instance.stop_for_reason("interrupted", "User edited Make Instruction Job definition,\nivalidating the Job instance.")
            }
            this.job_instance = null //makes sure that MiRecord.prepare_for_play will redefined the job from the MI dialog box.
            MiRecord.set_play_loc(0)
            MiRecord.set_highest_completed_instruction_ui()
        }
    }
}
MiState.init()


