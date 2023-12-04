/* started from Simqueue but customized for J moves. */

globalThis.SimqueueJ = class SimqueueJ {
    //static queue_max_length = 16 //infinite
    constructor(dexter_sim_instance) {
        this.dexter_sim_instance = dexter_sim_instance
        this.queue = []
        this.latest_sent_queued_instruction = null //every time a cmd is added to the queue, this var is set to it.
        //we can't just pull the last item off the queue because,
        //at the beginning. this is null, and if the queue is emptied, the lasteset wouldn't be on the queue.
        //so we need this state var. J1 thru 6 make up the "SENT" robot_status row.
    }

    //called by test suite
    is_simulator_running() {
        return !this.is_queue_empty()
    }

    is_queue_empty() {
        return (this.queue.length === 0)
    }

    //returns an instruction_array or null if the queue is empty
    newest_instruction_in_queue() {
        if (this.is_queue_empty()) {
            return null
        } else return this.queue[this.queue.length - 1]
    }

    current_instruction_in_queue() {
        if (this.is_queue_empty()) {
            return null
        } else return this.queue[0]
    }

    simple_instruction_array_test(instruction_array) {
        for (let i = 0; i < instruction_array.length; i++) {
            let val = instruction_array[i]
            let type = typeof (val)
            if (!["number", "string", "undefined"].includes(type)) {
                dde_error("Simulator passed invalid instruction arg at index " + i +
                    " of : " + val +
                    " in instruction array: " + instruction_array)
            }
        }
    }

    //instruction oplet guarenteed to be "j".
    add_to_queue(instruction_array) {
        this.simple_instruction_array_test(instruction_array)
        let sub_oplet = instruction_array[Instruction.INSTRUCTION_ARG0] //could be "p", "v", "a", maybe "d"
        if(sub_oplet === undefined) {
            this.j_reset()
            return
        }
        else if(sub_oplet === "p") { //position
            this.last_jp_instruction_in_arcsecs = instruction_array
        }
        let queue_was_empty = this.is_queue_empty()
        if(("pav".includes(sub_oplet) &&
                (instruction_array[Instruction.INSTRUCTION_ARG7] !== undefined)) ||
            (sub_oplet === "d")){ //trigger the current j_move position
            this.queue.push(this.last_jp_instruction_in_arcsecs)
        }
        if (queue_was_empty) {
            this.start_running_instruction_if_any()
        }
    }

    jp_instruction_to_angles_in_arcsecs(instruction_array){
        return instruction_array.slice(Instruction.INSTRUCTION_ARG1, Instruction.INSTRUCTION_ARG7) //should be 6 integers
    }

    j_reset(){
        if(this.queue.length > 0){ //there is an ongoing j_move
            this.stop_ongoing = true //to stop ongoing j_move. must be set to false by rendering inner loop
        }
        this.queue = [] //empty the queue
    }

    //called when graphics simulator is done executing the now-running instruction.
    //dont set params in here because remove_from_queue is called by
    //empty_instruction_queue which we DON'T want to set_params.
    remove_from_queue() { //takes off of front of queue, returns the removed instruction
        let done_instruction_array = this.queue.shift()
    }

    done_with_instruction() {
        let cur_inst = this.current_instruction_in_queue()
        this.remove_from_queue()
        let queue_instance = this
        setTimeout(function () {
            queue_instance.start_running_instruction_if_any()
        }, 1) //even if 0, its probably a good idea to give JS chance to run other stuff between instructions.
    }

    //do not remove the front instruction from the queue until AFTER its done running
    start_running_instruction_if_any() {
        if (this.is_queue_empty()) {
            this.dexter_sim_instance.simout("queueJ is empty.")
        }
        else {
            let instruction_array = this.current_instruction_in_queue()
            this.render_instruction(instruction_array)
        }
    }


    //______Render instruction ________
    predict_j_instruction_dur_in_ms(angles_dexter_units){
        if(angles_dexter_units === this.dexter_sim_instance.angles_dexter_units) { //an optimization for this common case of no change
            return 0
        }
        else {
            //predict needs its angles in degrees but ins_args are in arcseconds
            const orig_angles_in_deg = Socket.dexter_units_to_degrees_array(this.dexter_sim_instance.angles_dexter_units)  //Socket.dexter_units_to_degrees(this.measured_angles_dexter_units) //this.measured_angles_dexter_units.map(function(ang) { return ang / 3600 })
            const angles_in_deg  = Socket.dexter_units_to_degrees_array(angles_dexter_units) //ns_args.map(function(ang)    { return ang / 3600 })

            let dur_in_seconds = Math.abs(Kin.predict_move_dur_6_joint(orig_angles_in_deg, angles_in_deg, 30)) //allow speed to always default to 30 deg per sec for now.
            let dur_in_milliseconds = dur_in_seconds * 1000
            return dur_in_milliseconds
        }
    }

    //called at the start of rendering an instruction
    render_instruction(instruction_array) {
        let ins_args  = this.jp_instruction_to_angles_in_arcsecs(instruction_array)
        let dur_in_ms = this.predict_j_instruction_dur_in_ms(ins_args)
        let rob_name  = this.dexter_sim_instance.robot_name
        SimUtils.render_multi(this.dexter_sim_instance, ins_args, rob_name, dur_in_ms, "j") //last arg is "move_kind"
    }
}