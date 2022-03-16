/* the queue is an array of 16 "a" instruction arrays.
   pos 0 is the "front" of the queue, the currently being executed instruction
   by the FPGA. instructions are removed at the end of the queue.
   The last elt in the queue is the latests "sent" instruction.
   It is pushed onto the end of the queue when the Job "executes" the instruction.

   J6 and J7: although its good for "whole instruction display purposes" to have
   J6 and j7 in an instruction, they aren't put in the queue.
   As soon as Dextrun gets an "a" instruction with a J6 and/or J7,
   or a set_parameter("EERoll") (J6) or "EESpan" (J7) it starts
   executing it, bypassing the queue. thus they are out of sequence
   with the movement of J1 thru 5, unless the queue is empty.
   They have their own "speed" (not variable) and generally take much shorter time
   to execute than a j1 thru 5 long move. ie j 6 or 7 long move
   might take 0.5 sec or less.
   Also, J6 and J7 aren't coordinated with each other like the
   j1 thru 5 are in an "a" cmd.
   Also, if a move for j7 comes in WHILE another move
   for J7 is going on, that ongoing move is aborted, and
   the new commanded angle takes over before finishing the old move.
   (same for J6). So there's no special "queue" for J6/J7.

   Sleep (z oplet) have times in microseconds (as their dexter units).
   When one comes in to dexrun, ack_reply is not sent,
   but a countdown for the dur starts as soon as it get to dexrun,
   and when the dur is up, the ack_reply is sent.
   A sleep instruction does not affect exiting items in queue,
   but does prevent DDE from sending more instructions until
   the sleep dur is up.

   So we really have up to 4 different independent "processes" going on.
   1. Moving j1 thru j5, all the joints can move simulaneously.
          // the fastest joint takes the top speed, and the others
          //all move slower such that all 5 joints start and end together.
   2. Moving j6
   3. Moving j7
   4. Sleep
   j1 thru 5 are similar to each other.
   J6 & J7 are similar to each other.

   Despite the fact that j6 & j7 and sleep aren't in the queue, this
   file processes them anyway for modularity and
   because a move_all_joints has its first 5 joints processes
   here, so this code strips off the j6 and 7 and handles them
   separately.
*/

class Simqueue{
    static queue_max_length = 16
    constructor(sim_instance){
        this.sim_instance = sim_instance
        this.queue = [] //new Array of 16 fails because length will == 16, and first push pushes to index 16  new Array(Simqueue.queue_max_length)
        this.queue_blocking_instruction = null //set when F cmd comes in, to that F instruction_array
        this.sleep_dur_us = 0   //microseconds
        this.queue_dom_elt_id_string_prefix         = this.sim_instance.robot_name + "_queue_"
        this.queue_dom_elt_status_string            = this.queue_dom_elt_id_string_prefix + "status_id"
        this.queue_dom_elt_instruction_table_string = this.queue_dom_elt_id_string_prefix + "instruction_table_id"
        this.latest_sent_queued_instruction = null //every time a cmd is added to the queue, this var is set to it.
         //we can't just pull the last item off the queue because,
         //at the beginning. this is null, and if the queue is emptied, the lasteset wouldn't be on the queue.
         //so we need this state var. J1 thru 5 make up the "SENT" robot_status row.
        this.instr_to_param_map = {} //keys are an instruction array. Values are an array of a set param name (string) and its new value
                                     //to be set in sim_inst.parameters whenever the instr is done executing (ie when removed from queue
        this.joint_number_to_j6_plus_status_map = {6: "stopped at " + sim_instance.angles_dexter_units[5],
                                                   7: "stopped at " + sim_instance.angles_dexter_units[6]
                                                  }
        this.joint_number_to_render_j6_plus_frame_call_map = {}
        this.show_degrees = false
    }

    //called by test suite
    is_simulator_running(){
        return (!this.is_queue_empty() || (this.sleep_dur_us > 0))
    }
    
    is_queue_full(){
      return (this.queue.length === Simqueue.queue_max_length)
    }
    
    is_queue_empty(){ 
    	return (this.queue.length === 0)
    }
    
    //returns an instruction_array or null if the queue is empty
    newest_instruction_in_queue() {
       if(this.is_queue_empty()) { return null }
       else return this.queue[this.queue.length - 1]
    }

    current_instruction_in_queue(){
        if(this.is_queue_empty()) { return null }
        else return this.queue[0]
    }

    
    ok_to_add_to_queue(){
        if(this.is_queue_full()) { return false }
        else if(this.queue_blocking_instruction) { return false }
        else { return true }
    }
    
    is_valid_instruction_for_queue(instruction_array){
        let oplet = instruction_array[Dexter.INSTRUCTION_TYPE]
        return  ["a", "P"].includes(oplet)
    }

    simple_instruction_array_test(instruction_array){
        for(let i = 0; i < instruction_array.length; i++){
            let val = instruction_array[i]
            let type = typeof(val)
            if(!["number", "string", "undefined"].includes(type)) {
                dde_error("Simulator passed invalid instruction arg at index " + i +
                    " of : " + val +
                    " in instruction array: " + instruction_array)
            }
        }
    }

    add_to_queue(instruction_array){
        this.simple_instruction_array_test(instruction_array)
        if(this.is_queue_full()){
            shouldnt("Simqueue is full so can't be added to.")
        }
        else {
            let queue_was_empty = this.is_queue_empty()
            this.queue.push(instruction_array)
            this.latest_sent_queued_instruction = instruction_array
            this.update_show_queue_if_shown()
            if(queue_was_empty) {
                this.start_running_instruction_if_any()
            }
            let j6_du = instruction_array[Instruction.INSTRUCTION_ARG5]
            if(j6_du !== undefined) { //if it is undefined, no change so do nothing
                this.start_running_j6_plus_instruction(6, j6_du)
            }
            let j7_du = instruction_array[Instruction.INSTRUCTION_ARG6]
            if(j7_du !== undefined) {
                this.start_running_j6_plus_instruction(7, j7_du)
            }
        }
    }

    //called when graphics simulator is done executing the now-running instruction.
    //dont set params in here because remove_from_queue is called by
    //empty_instruction_queue which we DON'T want to set_params.
    remove_from_queue(){ //takes off of front of queue, returns the removed instruction
        let done_instruction_array = this.queue.shift()
        if(this.is_queue_empty()) {
            this.unset_queue_blocking_instruction_maybe()
        }
    }

    done_with_instruction(){
        let cur_inst = this.current_instruction_in_queue()
        this.remove_from_queue()
        let param_names_and_values = this.instr_to_param_map[cur_inst]
        if(param_names_and_values){
            for(let param_name in param_names_and_values){
                let param_value = param_names_and_values[param_name]
                this.sim_instance.parameters[param_name] = param_value
                this.sim_instance.simout("set_parameter: " + param_name + " to " + param_value)
            }
        }
        delete this.instr_to_param_map[cur_inst] //not needed anymore
        this.unblock_from_unfull_maybe()
        this.update_show_queue_if_shown()
        let queue_instance = this
        setTimeout(function(){
                    queue_instance.start_running_instruction_if_any()
                   }, 1) //even if 0, its probably a good idea to give JS chance to run other stuff between instructions.
    }

    //do not remove the front instruction from the queue until AFTER its done running
    start_running_instruction_if_any(){
        if(this.is_queue_empty()) {
            this.sim_instance.simout("queue is empty.")
        }
        else {
            let instruction_array = this.current_instruction_in_queue()
            this.render_instruction(instruction_array)
        }
    }

    //implements  the "E" oplet
    empty_instruction_queue(){
        while (this.queue.length) { this.remove_from_queue()  }
        this.update_show_queue_if_shown()
    }

    //implements the "F" oplet. called from DexterSim
    set_queue_blocking_instruction(f_instruction_array) {
        if(this.queue_blocking_instruction) { //yikes we got an F cmd before the prev F cmd was finished.
          //we need to ack_reply to the first one so DDE will know that one was handled.
          //but that doesn't mean DDE can expect its other instructions from
          //getting handled because this call returns on blocking.
          //But maybe this never happens because if DDE can't send ANY instructions
          //to Dexter after an "F" until the block is cleared, then maybe this clause
          //never happens.
           let instr = this.queue_blocking_instruction
           this.queue_blocking_instruction = f_instruction_array
           this.update_show_queue_if_shown() //probably not necessary because queue is already blocked
           this.sim_instance.ack_reply(instr)
        }
        else if(this.is_queue_empty()){ //since the queue is already empty,
        //this instruction is basically a no-op. Don't set this.queue_blocking_instruction
        //just ack_reply
            this.sim_instance.ack_reply(f_instruction_array)
        }
        else { //normal case
            this.queue_blocking_instruction = f_instruction_array
            this.update_show_queue_if_shown()
        }
    }

    unset_queue_blocking_instruction_maybe(){
        if(this.queue_blocking_instruction){
            let instr = this.queue_blocking_instruction
            this.queue_blocking_instruction = null
            this.sim_instance.ack_reply(instr)
        }
    }

    //called by done_with_instruction just after the cur instruction is removed from the queue.
    unblock_from_unfull_maybe(){
        if(this.queue.length === (Simqueue.queue_max_length - 1)){
          let newest_instr = this.newest_instruction_in_queue()
          this.sim_instance.ack_reply(newest_instr) //because its ack_reply wasn't called when it first came in and filled the queue
        }
    }

    actions_for_instruction(instruction_array){
        return this.instr_to_param_map[instruction_array]
    }

    //called from DexSim.send, "P" clause for MaxSpeed, & friends and from the  "z" clause
    set_instruction_done_action(param_name, param_value){
        let newest = this.newest_instruction_in_queue()
        if(newest){
           let actions = this.actions_for_instruction(newest)
           if(!actions) {  //might not be any action yet.
              actions = {}
              this.instr_to_param_map[newest] = actions    
           }
           //beware, there can be more than one action, and
           //we might even have a do_list that attempts to set
           //the same param more than once. We want to keep the LATEST of them,
           //an this data structure will do that by overwriting previous same param_name values.
           actions[param_name] = param_value
        }
        else { //queue is empty so just set params immediately and don't put them in instr_to_param_map
               this.sim_instance.parameters[param_name] = param_value
               this.sim_instance.simout("set_parameter: " + param_name + " to " + param_value)
        }
    }

    //J6_plus
    start_running_j6_plus_instruction(joint_number, new_angle_in_dexter_units){
        let ds_instance = this.sim_instance
        let dur_in_ms = ds_instance.predict_j6_plus_instruction_dur_in_ms(new_angle_in_dexter_units, joint_number)
        if(dur_in_ms === 0) {} //the joint is already at the commanded angle so nothing to do. This is a big optimization for a common case.
        else if (SimUtils.is_simulator_showing()){
            let val_for_show = (this.show_degrees ? Socket.dexter_units_to_degrees(new_angle_in_dexter_units, joint_number) : new_angle_in_dexter_units)
            val_for_show = (Number.isInteger(val_for_show) ? val_for_show : val_for_show.toFixed(3))
            this.joint_number_to_j6_plus_status_map[joint_number] = "moving to " + val_for_show
            this.update_j6_plus_status_if_shown(joint_number)
            let robot_name = ds_instance.robot_name
            SimUtils.render_j6_plus(ds_instance, new_angle_in_dexter_units, robot_name, dur_in_ms, joint_number)
        }
    }

    //just sets j6_plus status and updates
    done_with_j6_plus_instruction(joint_number){
        let du = this.sim_instance.angles_dexter_units[joint_number - 1]
        let val_for_show = (this.show_degrees ? Socket.dexter_units_to_degrees(du, joint_number) : du)
        val_for_show = (Number.isInteger(val_for_show) ? val_for_show : val_for_show.toFixed(3))
        this.joint_number_to_j6_plus_status_map[joint_number] = "stopped at " + val_for_show
        this.update_j6_plus_status_if_shown(joint_number)
    }

    start_sleep(instruction_array_in_us) {
        this.sleep_dur_us = instruction_array_in_us[Instruction.INSTRUCTION_ARG0]
        let sleep_instruction = instruction_array_in_us //for closure
        this.update_show_queue_status_if_shown()
        let sleep_dur_ms = this.sleep_dur_us / 1000
        let queue_instance = this
        setTimeout(function(){ //end sleep
                     queue_instance.sleep_dur_us = 0 //must do before update_show_queue_status
                     queue_instance.update_show_queue_status_if_shown()
                     queue_instance.sim_instance.ack_reply(sleep_instruction)
                    }, sleep_dur_ms)
    }


    //______Render instruction ________
    //called at the start of rendering an instruction
    render_instruction(instruction_array){
        let ins_args  = instruction_array.slice(Instruction.INSTRUCTION_ARG0, Instruction.INSTRUCTION_ARG7)
        let dur_in_ms = this.sim_instance.predict_a_instruction_dur_in_ms(ins_args)
        //out("render_instruction passed instruction_array: " + instruction_array)
        //let job_id    = instruction_array[Instruction.JOB_ID]
        //let job_instance = Job.job_id_to_job_instance(job_id)
        //I use to pass job name to render_multi, but it doesn't really need it.
        //I took it out because in the testsuite or ref man, if you have 2 job defs of the same
        //name next to each other, then the 2nd one removes the first one.
        //but if the first one has instructions in the queue, they belong to a
        //non_exisitant job so getting the job_id out of the instruction array and
        //looking it up to find the job def will fail, causing an error.
        //so just avoid that. Dexter (and by extension the simulator) don't
        //know about Jobs and don't care. Useful for debugging perhaps, but
        //causes problems as in above.
        let rob_name  = this.sim_instance.robot_name
        if(SimUtils.is_simulator_showing()) { //globalThis.platform == "dde") //even if we're in dde, unless the sim pane is up, don't attempt to render
            SimUtils.render_multi(this.sim_instance, ins_args, rob_name, dur_in_ms)
        }
        else {
            warning('To see a graphical simulation,<br/>choose from the Misc pane menu: "Simulate" then select: "Simulate."')
            let the_job = this.sim_instance.job_of_last_instruction_sent()

            this.render_once_node(instruction_array, the_job.name, rob_name) //renders after dur, ie when the dexter move is completed.
        }
    }
    render_once_node(instruction_array, job_name, rob_name, dur_in_ms){
        this.sim_instance.simout("For Job." + job_name +
               "<br/>Starting to similate instruction: " + instruction_array, "green")
          let queue_instance = this
          setTimeout(function(){
              queue_instance.sim_instance.simout("Done simulating instruction: <span style='margin-right;40px;'/>" + instruction_array, "green")
              queue_instance.done_with_instruction()
          }, dur_in_ms)
    }


    //________show_queue_______
    queue_status(){
        if(this.is_queue_full())                  { return "full" }
        else if (this.sleep_dur_us > 0)           { return "sleep" } //put before blocked as robot can sleep even when blocked
        else if (this.queue_blocking_instruction) { return "blocked" }
        else if (this.is_queue_empty())           { return "empty" }
        else                                      { return "accepting" }
    }

    queue_status_color(){
        let q_status = this.queue_status()
        if      (q_status === "accepting") { return "#aaf1aa" } //green
        else if (q_status === "blocked")   { return "#ff7e79" } //pale red/orange
        else if (q_status === "empty")     { return "#76cdf1" } //blue
        else if (q_status === "full")      { return "#da7900" } //brown
        else if (q_status === "sleep")     { return "#ffff00" } //yellow
        else { shouldnt("In Simqueue.queue_status_color got invalid status: " + status)}
    }
    queue_is_shown(){
        if(window[this.queue_dom_elt_status_string]){
            return true
        }
        else { return false }
    }

    //top level show called from clicking the "Show Queue" button in Sim header.
    // Simqueue.show_queue_for_default_dexter()
    static show_queue_for_default_dexter(){
        if(DDEVideo.misc_pane_menu_selection !== "Simulate Dexter"){
            DDEVideo.show_in_misc_pane("Simulate Dexter") //if Simulate Dexter is not shown when queue is shown, we'll get an error
        }
        let rob_name = Dexter.default.name
        let sim_inst = (DexterSim.robot_name_to_dextersim_instance_map ?
                         DexterSim.robot_name_to_dextersim_instance_map[rob_name] :
                         null)
        if(!sim_inst){ //create one, even before we actually send any instructions.
                       //then we can at least show an empty version of the queue.
            let connect_success_cb = function(){
                //has to be an out, not a simout because sim_inst isn't available to make the cb.
                out("show_queue_for_default_dexter initialized DexterSim instance for Dexter." + rob_name)
            }
            DexterSim.create_or_just_init(rob_name, true, connect_success_cb)
            sim_inst = DexterSim.robot_name_to_dextersim_instance_map[rob_name]
        }
        sim_inst.queue_instance.show_queue()
    }

    static show_queue_cb(vals){
        let sim_inst = DexterSim.robot_name_to_dextersim_instance_map[vals.robot_name]
        if(!sim_inst) { warning("The simulator has not yet been initialized. Run a Job.") }
        else if(vals.clicked_button_value === "show_instructions") {
           Simqueue.show_instructions(vals.robot_name)
       }
       else if(vals.clicked_button_value === "show_parameters"){
           Simqueue.show_parameters(vals.robot_name)
       }
       else if (vals.clicked_button_value === "show_fpga_reg"){
           Simqueue.show_fpga_reg(vals.robot_name)
       }
       else if (vals.clicked_button_value === "init"){
            Simqueue.init(vals.robot_name)
       }
       else if (vals.clicked_button_value === "show_degrees"){
           sim_inst.queue_instance.show_degrees = vals.show_degrees
           sim_inst.queue_instance.done_with_j6_plus_instruction(6)
           sim_inst.queue_instance.done_with_j6_plus_instruction(7)
           sim_inst.queue_instance.update_show_queue_if_shown()
       }
    }

    show_queue(){
        if(!this.queue_is_shown()) {
            let content = '<div>\n' +
                          this.make_show_queue_status() +
                          this.make_show_queue_instructions_table() +
                          '\n</div>'
            show_window({title: "Queue simulation for Dexter:" + this.sim_instance.robot_name,
                         content: content,
                         x:520, y:0, width:600, height: 400,
                         callback: "Simqueue.show_queue_cb"})
        }
        else {
            this.sim_instance.simout("simqueue is already shown.")
        }
        this.update_show_queue_if_shown()
    }
    make_show_queue_status(){
        let rob_name = this.sim_instance.robot_name
        return  '<input type="hidden" name="robot_name" value="' + rob_name + '"/>\n' +

                `<input type="button" name="show_instructions" ` +
                `title="Show the instructions sent\nto the simulated Dexter." ` +
                `value="&#9432; instructions"/>&nbsp;&nbsp;` +

                `<input type="button" name="show_parameters" ` +
                `title="Show the simulated set_parameters\nand their values." ` +
                `value="&#9432; params">&nbsp;&nbsp;` +

                `<input type="button" name="show_fpga_reg" ` +
                `title="Show the simulated FGPA register\naddresses, names and values." ` +
                `value="&#9432; FPGA reg">&nbsp;&nbsp;`+

                `<input type="button" name="init" ` +
                `title="Initialize the simulator for Dexter.` + rob_name + `\nThis simulates turning Dexter off and on." ` +
                `value="init">`+

                `<span title="Unchecked shows&#013;Joints 1 thru 5 in arcseconds and&#013;Joints 6 & 7 in Dynamixel units."> ` +
                    `<input name="show_degrees" style="margin-left:15px;" type="checkbox" data-onchange='true' ` +
                    `/>Show degrees` +
                 `</span>` +
                 `<div style="margin-top:4px;"><i>Status </i>` +
                 '<b>Queue:</b> <div style="display:inline-block; padding-left:10px; padding-bottom:3px; padding-top:2px; width:80px;" id="' + this.queue_dom_elt_status_string + '"></div> ' +
                 '<b>J6:   </b> <div style="display:inline-block; padding-left:10px; padding-bottom:3px; padding-top:2px; width:150px;" id="sim_j6_dom_elt_status_id"></div> ' +
                 '<b>J7:   </b> <div style="display:inline-block; padding-left:10px; padding-bottom:3px; padding-top:2px; width:150px;" id="sim_j7_dom_elt_status_id"></div> ' +
                 '</div>'
    }

    update_show_queue_if_shown(){
        if(this.queue_is_shown()){
            this.update_show_queue_status_if_shown()
            this.update_show_queue_instructions_table()
            this.update_j6_plus_status_if_shown()
        }
    }

    update_show_queue_status_if_shown(){
        if(this.queue_is_shown()){
            let elt = window[this.queue_dom_elt_status_string]
           /* let html = '<span id="' + this.queue_dom_elt_status_string + '" '  +
                       'style="background-color:' + this.queue_status_color()        + ';">&nbsp;' +
                       this.queue_status() +
                       '&nbsp;</span>'*/
            let q_stat = this.queue_status()
            if(q_stat === "sleep"){
                q_stat += " " + (this.sleep_dur_us/1000000).toFixed(1)
            }
            elt.innerHTML = q_stat
            elt.style["background-color"] = this.queue_status_color()
            //elt.outerHTML = html
            if(this.sleep_dur_us > 0){
                let queue_instance = this
                setTimeout(function(){
                             queue_instance.sleep_dur_us -= 100000 //subtract 100 ms
                             if (queue_instance.sleep_dur_us <= 0) { //we're done with the sleep
                                 queue_instance.sleep_dur_us = 0
                             }
                             //even if we're now at 0, n
                             queue_instance.update_show_queue_status_if_shown() //updates the sleep time left display

                           }, 100)
            }
        }
    }

    static show_instructions(robot_name){
        let sim_inst = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
        let the_job = sim_inst.job_of_last_instruction_sent()
        if(!the_job) {
            warning("No instructions sent to Dexter." + sim_inst.robot_name)
        }
        else {
            let title = "<b>Job." + the_job.name + ".sent_instructions</b>"
            let html = Dexter.sent_instructions_to_html(the_job.sent_instructions)
            let start_pos = html.indexOf("<table>")
            let end_pos   = html.indexOf("</table>") + 7
            html = html.substring(start_pos, end_pos)
            sim_inst.simout(title + html)
        }
    }
    
    static show_parameters(robot_name){
      let sim_inst = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
      let title = " <b>set_parameters</b>"
      let html = "<table>"
      let params_obj = sim_inst.parameters
      let param_names = Object.getOwnPropertyNames(params_obj)
      param_names.sort()
      for(let param_name of param_names){
          html += "<tr><td>" + param_name + "</td><td>" + params_obj[param_name] + "</td></tr>"
      }
        html += "</table>"
        sim_inst.simout(title + html)
    }
    
    static show_fpga_reg(robot_name){
      let sim_inst = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
      let fr_arr = sim_inst.fpga_register
      let display_html = "<table><tr><th>Address</th><th>Address Name</th><th>Value</th></tr>\n"
      for(let i = 0; i < fr_arr.length; i++) {
         let val = fr_arr[i]
         let row = "<tr><td>"  + i + 
                   "</td><td>" + Instruction.w_address_names[i] +
                   "</td><td>" + val + 
                   "</td></tr>"
         display_html += row
      }
      display_html += "</table>"
        sim_inst.simout("<b> Simulated FPGA Registers </b>" + display_html)
    }

    static init(robot_name){
        let sim_inst = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
        let rob = Dexter[robot_name]
        let sim_actual = Robot.get_simulate_actual(rob.simulate) //true, false, or "both"
        if(sim_actual === false) { sim_actual = true } //we know we're simulating
        sim_inst.init(sim_actual)
        sim_inst.simout("initialized.")
    }


    
    make_show_queue_instructions_table(){
        let result = '<table id="' + this.queue_dom_elt_instruction_table_string + '" style="margin-top:5px;">\n' +
                     this.make_show_queue_instruction_labels()
        for(let inst_queue_index = 0; inst_queue_index < Simqueue.queue_max_length; inst_queue_index++){
            let instr = this.queue[inst_queue_index]
            let row_html
            if(instr === undefined) {
                row_html = "<tr><td  class='simqueue_td'>" + inst_queue_index + "</td></tr>\n"
            }
            else {
                row_html = this.make_show_queue_instruction_data(inst_queue_index)
            }
            result += row_html
        }
        result += "</table>"
        return result
    }

    make_show_queue_instruction_labels(){
        let columns_labels = ["Q&nbsp;Pos", "JOB", "INSTR#", "Joint&nbsp;1", "Joint&nbsp;2", "Joint&nbsp;3", "Joint&nbsp;4", "Joint&nbsp;5", "Joint&nbsp;6", "Joint&nbsp;7"]
        let result = "<tr>"
        for(let i = 0; i < columns_labels.length; i++) {
            let header_label = columns_labels[i]
            if((i === 8) || (i === 9)) {
                let joint_number = i - 2
                header_label = "<span style='color:blue;' " +
                               "title='" +
`These values are sent directly to the J` + joint_number + ` motor
 when they are first added to the queue.
 They do not wait until their instruction is at
 the front of the queue (Q Pos=0)
 to start moving the motor. 
 J1 thru J5 do wait.` +
                               "'>" + header_label + "</span>"
            }
            result += "<th>" + header_label + "</th>"
        }
        result += "</tr>\n"
        return result
    }

    //returns one row of data for one instruction_array
    make_show_queue_instruction_data(inst_queue_index){
        let instruction_array = this.queue[inst_queue_index]
        let data_labels   = ["Q Pos", "JOB_ID", "INSTRUCTION_ID", "INSTRUCTION_ARG0", "INSTRUCTION_ARG1","INSTRUCTION_ARG2","INSTRUCTION_ARG3","INSTRUCTION_ARG4","INSTRUCTION_ARG5","INSTRUCTION_ARG6"]
        let result = "<tr>"
        let job_name
        let instruction_id
        for(let q_pos = 0; q_pos < data_labels.length; q_pos++) {
            let data_val
            if(q_pos === 0) { data_val = inst_queue_index }
            else {
               let data_label = data_labels[q_pos]
               let instr_elt_index = Instruction[data_label]
               data_val = instruction_array[instr_elt_index]
               if(data_label === "JOB_ID") { //data_val is a job_id
                    let job_instance = Job.job_id_to_job_instance(data_val)
                    if(job_instance) {
                        job_name = job_instance.name
                        data_val = job_name //job_name also used below for set_params
                    }
                    //else //rarely, the job_id doesn't find a job. In that case don't error. just show the job_id in place of the job name
               }
               else if(data_label === "INSTRUCTION_ID") {
                   instruction_id = data_val
               }
               else if (this.show_degrees) { //we only get INSTRUCTION_ARG0 and up in this clause
                   let joint_number = q_pos - 2
                   data_val = Socket.dexter_units_to_degrees(data_val, joint_number)
               }
            }
            result += "<td class='simqueue_td'>" + data_val + "</td>"
        }
        result += "</tr>\n"
        let actions = this.actions_for_instruction(instruction_array)
        if(actions) {
            let actions_string = "" + "set_parameters: " + JSON.stringify(actions)
            result +=  "<tr><td class='simqueue_td'>"  + (inst_queue_index + 0.5) +
                      "</td><td class='simqueue_td'>" + job_name +
                      "</td><td class='simqueue_td'>" + (instruction_id + 1) +  //because there could be multiple set params, all of them at instruction id's higher than instruction_id variable. Just go with instruction_id as a simplification
                      "</td><td class='simqueue_td'colspan='7'>" + actions_string + "</td></tr>"
        }
        return result
    }

    update_show_queue_instructions_table(){
        let table_elt        = window[this.queue_dom_elt_instruction_table_string]
        table_elt.outerHTML  = this.make_show_queue_instructions_table()
    }

    update_j6_plus_status_if_shown(joint_number){
        if(this.queue_is_shown()){
            if(!joint_number) {
                this.update_j6_plus_status_if_shown(6)
                this.update_j6_plus_status_if_shown(7)
            }
            else {
                let status = this.joint_number_to_j6_plus_status_map[joint_number]
                let elt_id = "sim_j" + joint_number + "_dom_elt_status_id"
                let elt = window[elt_id]
                elt.innerHTML = status
                let color = (status.startsWith("stopped") ? "#76cdf1" : //blue
                                                            "#aaf1aa") //green
                elt.style["background-color"] = color
            }
        }
    }
}

globalThis.Simqueue = Simqueue