var Simqueue = class Simqueue{
    static queue_max_length = 16
    constructor(sim_instance){
        this.sim_instance = sim_instance
        this.queue = new Array(Simqueue.queue_max_length)
        this.queue_blocking_instruction = null //set when F cmd comes in, to that F instruction_array
        this.queue_dom_elt_id_string_prefix         = this.sim_instance.robot_name + "_queue_"
        this.queue_dom_elt_status_string            = this.queue_dom_elt_id_string_prefix + "status_id"
        this.queue_dom_elt_instruction_table_string = this.queue_dom_elt_id_string_prefix + "instruction_table_id"

    }
    is_queue_full()  { return this.queue.length === this.queue_max_length }
    is_queue_empty() { return this.queue.length === 0 }
    ok_to_add_to_queue(){
        if(this.is_queue_full()) { return false }
        else if(this.queue_blocking_instruction) { return false }
        else { return true }
    }
    is_valid_instruction_for_queue(instruction_array){
        return instruction_array[Dexter.INSTRUCTION_TYPE] === "a"
    }
    add_to_queue(instr) {
        if(this.is_queue_full()){
            dde_error("Simqueue is full so can't be added to.")
        }
        else {
            this.queue.push(instr)
        }
    }
    remove_from_queue() { //takes off of front of queue, returns the removed instruction
        let result = this.queue.shift()
        if(this.is_queue_empty()) {
            let f_instruction_array = this.queue_blocking_instruction
            this.queue_blocking_instruction = full
            this.sim_instance.ack_reply(f_instruction_array)
        }
    }
    set_queue_blocking_instruction(f_instruction_array) {
        this.queue_blocking_instruction = queue_blocking_instruction
    }
    now_running_instruction() {
        if(this.is_queue_empty()) { return null }
        else { return this.queue[0] }
    }

    //________show_queue_______
    queue_status(){
        if(this.is_queue_full())                  { return "full" }
        else if (this.queue_blocking_instruction) { return "blocked" }
        else if (this.is_queue_empty())           { return "empty" }
        else                                      { return "accepting instructions" }
    }

    queue_status_color(){
        let q_status = this.queue_status()
        if      (q_status === "full")    { return "#ffff00" } //yellow
        else if (q_status === "blocked") { return "#ff6d75" } //red
        else if (q_status === "empty")   { return "#76cdf1" } //blue
        else if (q_status === "accepting instructions") { "#00f100" } //green
        else { shouldnt("In Simqueue.queue_status_color got invalid status: " + status)}
    }
    queue_is_shown(){
        if(window[this.queue_dom_elt_status_string]){
            return true
        }
        else { return false }
    }

    //top level show called from clicking the "Show Queue" button in Sim header.
    static show_queue_for_default_dexter(){
        var sim_inst = DexterSim.robot_name_to_dextersim_instance_map[Dexter.default.name]
        sim_inst.queue_inst.show_queue()
    }
    show_queue(){
        show_window({
            title: "Simulated Queue for " + this.sim_instance.robot_name,
            content: `<div id="` + this.queue_dom_elt_id_string +
                      `Status: <span id="` + this.queue_dom_elt_id_string_prefix + `status_id"></span>` +
                      this.make_show_queue_instructions_table()
        })
    }
    make_show_queue_status(){
        `<span id="` + this.queue_dom_elt_status_string + `" ` +
           `style="backgound-color:` + this.queue_status_color() + `".` +
           this.queue_status() +
        `</span>`
    }
    make_show_queue_instructions_table(){
        let result = '<table id="' + this.queue_dom_elt_instruction_table_string + ">\n" +
                     this.make_show_queue_instruction_labels()
        for(let inst_queue_index = 0; inst_queue_index < Simqueue.queue_max_length; inst_queue_index++){
            let row_html
            if(instr === undefined) {
                row_html = "<tr><td>" + inst_queue_index + "</td></tr>"
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
        let columns_labels = ["Q Pos", "JOB_ID", "INSTRUCTION_ID", "Joint 1", "Joint 2", "Joint 3", "Joint 4", "Joint 5", "Joint 6", "Joint 7"]
        let result = "<tr><td>Q Pos</td>"
        for(let i = 0; i < 10; i++) {
            result += "<th>" + columns_labels[i] + "</th>"
        }
        result += "</tr>\n"
        return result
    }

    //returns one row of data for one instruction_array
    make_show_queue_instruction_data(inst_queue_index){
        let instruction_array = this.queue[inst_queue_index]
        let data_labels   = ["Q Pos", "JOB_ID", "INSTRUCTION_ID", "INSTRUCTION_ARG0", "INSTRUCTION_ARG1","INSTRUCTION_ARG2","INSTRUCTION_ARG3","INSTRUCTION_ARG4","INSTRUCTION_ARG5","INSTRUCTION_ARG6"]
        let result = "<tr><td>" + inst_queue_index + "</td>"
        for(let q_pos = 0; q_pos < 10; q_pos++) {
            let data_val
            if(q_pos === 0) { data_val = inst_queue_index }
            else {
               let instr_elt_index = Instruction[data_labels[i]]
               data_val = instruction_array[instr_elt_index]
            }
            result += "<td>" + data_val + "</td>"
        }
        result += "</tr>\n"
        return result
    }

    update_show_queue(){
        let status_elt       = window[this.queue_dom_elt_status_string]
        status_elt.outerHTML = this.make_show_queue_status()
        let table_elt        = window[this.queue_dom_elt_instruction_table_string]
        table_elt.outerHTML  = this.make_show_queue_instructions_table()
    }
}