globalThis.Waiting = class Waiting {

    //called by Job.do_next_item
    //returns a dexter instance or null if Job is not waiting.
    static job_waiting_for_dexter(job_instance){
        if(job_instance.waiting_for_dexter_and_instruction) {
            return job_instance.waiting_for_dexter_and_instruction[0]
        }
        else {
            return null
        }
    }

    static is_job_waiting_for_dexter(job_instance, dexter_instance){
        let result =
            (job_instance.waiting_for_dexter_and_instruction &&
             job_instance.waiting_for_dexter_and_instruction[0] === dexter_instance)
        return result
    }

    //returns null if dexter_instance is NOT now performing,
    //else returns [job_instance, instruction] that dexter_instance is now performing
    static dexter_now_performing(dexter_instance){
        return dexter_instance.now_performing
    }

    /*called by Job.do_next_item just before getting the cur_instr.
      if(Waiting.job_waiting_for_dexter(job_instance){

         if(!Waiting.dexter_now_performing(Waiting.job_waiting_for_dexter(job_instance))){
              Waiting.clear_job_and_dexter(job_instance, dexter_instance)
              job_instance.send(Waiting.instruction_to_run_on_job(job_instance)
              return
         }
         else { job_instance.set_up_next_do(0) }
         }
      }
      // else just continue
    */
    static instruction_to_run_on_job(job_instance){
        if(job_instance.waiting_for_dexter_and_instruction){
            return job_instance.waiting_for_dexter_and_instruction[1]
        }
        else { return null}
    }

    /*called by Job.send if is_job_waiting_for_dexter
     if(Waiting.dexter_now_performing(dexter_instance)){
        Waiting.set_job(job_instance, dexter_instance, instruction)
        job_instance.set_up_next_do(0)
        return
     }
     else { //ok to run this instruction now, but hold up this job until dexter_instance.robot_done_with_instruction called
        Waiting.set_job_and_dexter(job_instance, dexter_instance, instruction)
     }
    */
    static set_job(job_instance, dexter_instance, instruction){
        job_instance.waiting_for_dexter_and_instruction = [dexter_instance, instruction]
    }

    static set_job_and_dexter(job_instance, dexter_instance, instruction){
        if(job_instance.waiting_for_dexter_and_instruction){
            shouldnt("Waiting.set_job_and_dexter attempting to set " + Job.job_name +
            " " + dexter_instance.name + "<br/>but Job already has set for: " +
                job_instance.waiting_for_dexter_and_instruction[0].name
            )
        }
        else {
            job_instance.waiting_for_dexter_and_instruction = [dexter_instance, instruction]
            dexter_instance.now_performing = [job_instance, instruction]
        }
    }

    /* in dexter_instance.robot_done_with_instruction
      if(Waiting.is_job_waiting_for_dexter(job_instance, dexter_instance) ){
         Waiting.clear_job_and_dexter(job_instance, dexter_instance)
      }
      else { shouldnt() }
     */
    static clear_job_and_dexter(job_instance, dexter_instance){
        job_instance.waiting_for_dexter_and_instruction = null
        dexter_instance.now_performing = null
    }

    static clear_all(){
        for (let a_job_name of Job.all_names){
            let a_job = Job[a_job_name]
            a_job.waiting_for_dexter_and_instruction = null
        }
        for (let a_dexter_name of Dexter.all_names){
            Dexter[a_dexter_name].now_performing = null
        }
    }

    //call when starting job and ending job
    static clear_all_if_ok(){
        if(this.ok_to_clear_all()){
            this.clear_all()
        }
    }

    //just used internally by
    static ok_to_clear_all(){
        return (Job.active_jobs().length === 0)
    }

    //called when a job ends. It *shouldn't* be necessary, but to catch jobs and
    //dexters that slip through cracks, its good safety to init for the next Jobs.
    static done_with_job(job_instance) {
        let dexter_instance = Waiting.job_waiting_for_dexter(job_instance)
        if(dexter_instance){
            Waiting.clear_job_and_dexter(job_instance, dexter_instance)
        }
        if((Job.active_jobs().length === 0) ||
            ((Job.active_jobs().length === 1) &&
             (Job.active_jobs()[0] === job_instance))) {
            Waiting.clear_all()
        }
    }
}