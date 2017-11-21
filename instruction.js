/** Created by Fry on 3/5/16. */

var Instruction = class Instruction {
    static to_string(instr){
       if(instr instanceof Instruction) { return instr.toString() }
       else if (Instruction.is_instruction_array(instr)) {
           var oplet = instr[Dexter.INSTRUCTION_TYPE]
           var fn_name = Dexter.instruction_type_to_function_name(oplet)
           var args = instr.slice(Instruction.INSTRUCTION_ARG0)
           return fn_name + " " + args
       }
       else if (Array.isArray(instr)) { return "Array of " + instr.length + " instructions" }
       else { return instr.toString() }
    }
    toString(){
        return "{instanceof: " + stringify_value_aux(this.constructor) + "}"
    }
    static is_instruction_array(obj){
        //since we're making the instruction arrays by our fn calls, ie Job.move,
        //the user isn't making up the arrays, so we assume all arrays that start
        //with a first elt of a string or length 1 are legitimate. But
        //we COULD check that the first char is legal and
        //the length and types of the rest of the elts matched what that op-let needs.
        if (Array.isArray(obj) && (obj.length > 0)){
            var first_elt = obj[Instruction.INSTRUCTION_TYPE]
            if ((typeof(first_elt) == "string") && (first_elt.length == 1)){
                return true
            }
        }
        return false
    }
    //not a good name. really it means, obj is a non-empty array that isn't an instruction array.
    //so could have an array of fns or other elts that might go on a do list.
    static is_instructions_array(obj){
        return Array.isArray(obj) &&
            (obj.length > 0)   &&
            !Instruction.is_instruction_array(obj)
        //Instruction.is_instruction_array(obj[0]) ||
        // Instruction.is_control_instruction(obj[0]) //permit a control instruction in here. thus "is_instructions_array" no longer a good name
        //)
    }
    
    static is_control_instruction(obj){
        return obj instanceof Instruction.Control
    }

    static is_start_object(obj){
        return (typeof(obj) == "object") && (typeof(obj.start) == "function")
    }
    static instruction_color(ins){
        if(Instruction.is_instruction_array(ins)) { return "#FFFFFF" }        //white
        else if (Instruction.is_control_instruction(ins)) {
            if(ins.constructor.name.startsWith("human")) { return "#ffb3d1" } //pink
            else                                         { return "#e6b3ff" } //lavender
        }
        else if (is_generator_function(ins)) { return "#ccffcc" }             //green
        else if (is_iterator(ins))           { return "#aaffaa" }             //lighter green
        else if (typeof(ins) == "function")  { return "#b3e6ff" }             //blue
        else if (Instruction.is_start_object(ins)) { return "#ffd492"}        //tan
        else if (ins == "debugger")          { return "red" }                 //red
        else if (ins == null) { return "#aaaaaa" }
        else if (Array.isArray(ins)) { return "#aaaaaa" }                     //gray
        else { shouldnt("Instruction.instruction_color got unknown instruction type: " + ins) }
    }
    static text_for_do_list_item(ins){
        if(Instruction.is_instruction_array(ins)) {
            let text = JSON.stringify(ins) //we want 1 line here, not the multi-lines that stringify_value(ins) puts out
            return "<span title='" + Robot.instruction_type_to_function_name(ins[Instruction.INSTRUCTION_TYPE]) + "'>" + text + "</span>"
         }
        else if (Instruction.is_control_instruction(ins)) {
            let name = ins.constructor.name
            let props = ""
            for(let prop_name of Object.keys(ins)){
                props += "<i>" + prop_name + "</i>: " + ins[prop_name] + "; "
            }
            return name + " with " + props
        }
        else if (is_generator_function(ins)) {
            return "generator function " + ins.toString().substring(0, 70)
        }
        else if (is_iterator(ins)){
            return "iterator " + ins.toString().substring(0, 70)
        }
        else if (typeof(ins)  == "function")       { return ins.toString().substring(0, 80) }
        else if (Instruction.is_start_object(ins)) { return ins.toString().substring(0, 80) }

        else if (ins == "debugger")         { return '"debugger"' }
        else if (ins == null) { return 'null' }
        else if (Array.isArray(ins)) { return stringify_value(ins) }
        else { shouldnt("Instruction.text_for_do_list_item got unknown instruction type: " + ins) }
    }
    static text_for_do_list_item_for_stepper(ins){
        if(Instruction.is_instruction_array(ins)) {
            let text = JSON.stringify(ins.slice(4)) //we want 1 line here, not the multi-lines that stringify_value(ins) puts out
            return "<span title='" + Robot.instruction_type_to_function_name(ins[Instruction.INSTRUCTION_TYPE]) + "'>" + text + "</span>"
        }
        else if (Instruction.is_control_instruction(ins)) {
            let name = ins.constructor.name
            let props = ""
            for(let prop_name of Object.keys(ins)){
                props += "<i>" + prop_name + "</i>: " + ins[prop_name] + "; "
            }
            return name + " with " + props
        }
        else if (is_generator_function(ins)) {
            return "generator function " + ins.toString().substring(0, 70)
        }
        else if (is_iterator(ins)){
            return "iterator " + ins.toString().substring(0, 70)
        }
        else if (typeof(ins) == "function") { return ins.toString().substring(0, 80) }
        else if (ins == "debugger")          { return '"debugger"' }
        else if (ins == null) { return 'null' }
        else if (Array.isArray(ins)) { return stringify_value(ins) }
        else { shouldnt("Instruction.text_for_do_list_item_for_stepper got unknown instruction type: " + ins) }
    }
}

Instruction.labels = [
"JOB_ID",             // 0
"INSTRUCTION_ID",     // 1
"START_TIME",         // 2
"STOP_TIME",          // 3 //END_TIME is better in this context BUT stop_time, stop_reason is used in Jobs and I wanted to be consistent with that.
"INSTRUCTION_TYPE",   // 4
"INSTRUCTION_ARG0",    // 5
"INSTRUCTION_ARG1",    // 6
"INSTRUCTION_ARG2",    // 7
"INSTRUCTION_ARG3",    // 8
"INSTRUCTION_ARG4",    // 9
] // and after those come the arguments to the instruction.

for (let i = 0; i < Instruction.labels.length; i++){
    Instruction[Instruction.labels[i]] = i
}

Instruction.job_of_instruction_array = function(ins_array){
    var job_id = ins_array[Instruction.JOB_ID]
    return Job.job_id_to_job_instance(job_id)
}

//return an array of the instruction args
Instruction.args = function(ins_array){
    return ins_array.slice(Instruction.INSTRUCTION_ARG0)
}

//user might call this at top level in a do_list so make it's name short.
function make_ins(instruction_type, ...args){
    if(!Dexter.instruction_type_to_function_name_map[instruction_type]){
        warning("make_ins called with an invalid instruction_type: " + instruction_type +
                "<br/>make_ins still returning an array using: " + instruction_type)
    }
    let result = new Array(Instruction.INSTRUCTION_TYPE)
    result.push(instruction_type)
    if (args.length === 0) { return result } //avoids generating the garbage that concat with an arg of an empty list would for this common case, ie for "g" ahd "h" instructions
    else { return result.concat(args) }
    return result.concat(args)
}
//to_source_code_insruction_array(isntr_array) //inplemented in to_source_code.js

//now Instruction.INSTRUCTION_TYPE == 4, and some_ins_array[Instruction.INSTRUCTION_TYPE] will return the oplet
//make_ins("a", 1, 2, 3, 4, 5) works
//make_ins("a", ...[1, 2, 3, 4, 5]) works

Instruction.Control = class Control extends Instruction{
    do_item(job_instance){
        job_instance.stop_for_reason("errored",
                                      "do_next_item got unrecognized control instruction: " +
                                      this)
        job_instance.do_next_item()
    }
}

Instruction.Control.error = class error extends Instruction.Control{
    constructor (reason) {
        super()
        this.reason = reason
    }
    do_item (job_instance){
        job_instance.stop_for_reason("errored", "Job: " + job_instance.name + " errored with: " + this.reason)
        //job_instance.set_up_next_do(0) //no, get out faster, we errored.
        job_instance.set_up_next_do(0)
    }
    toString(){
        return "error: " + this.reason
    }
    to_source_code(args){
        let this_indent = args.indent
        args        = jQuery.extend({}, arguments[0])
        args.value  = this.reason
        args.indent = ""
        return this_indent + "Robot.error(" + to_source_code(args) + ")"
    }
}

//upper case G to avoid a conflict, but the user instruction is spelled Robot.get_page
Instruction.Control.Get_page = class Get_page extends Instruction.Control{
    constructor (url_or_options, response_variable_name="http_response") {
        super()
        this.url_or_options = url_or_options
        this.response_variable_name = response_variable_name
        this.sent = false
    }
    do_item (job_instance){
        var the_var_name = this.response_variable_name  //for the closures
        if (this.sent == false){ //hits first time only
            job_instance.user_data[the_var_name] = undefined //must do in case there was some other
            //http_request for this var name, esp likely if its default is used.
            get_page_async(this.url_or_options, //note I *could* simplify here and use get_page (syncrhonos), but this doesn't freeze up UI while getting the page so a little safer.
                function(err, response, body) {
                    //console.log("gp top of cb with the_var_name: " + the_var_name)
                    //console.log("gp got err: " + err)
                    //console.log("ojb inst: "   + job_instance)
                    //console.log("response: "    + response)
                    if(err) { //bug err is not null when bad url
                        console.log("gp in err: ")
                        job_instance.user_data[the_var_name] = "Error: " + err
                        console.log("gp after err: ")
                    }
                    else if(response.statusCode !== 200){
                        job_instance.user_data[the_var_name] = "Error: in getting url: " + this.url_or_options + ", received error status code: " + response.statusCode
                    }
                    else {
                        //console.log("gp in good: ")
                        job_instance.user_data[the_var_name] = body
                        //console.log("gp after good: ")
                    }
                })
            this.sent = true
            job_instance.set_up_next_do(0)
        }
        else if (job_instance.user_data[the_var_name] === undefined){ //still waiting for the response
            job_instance.set_up_next_do(0)
        }
        else { job_instance.set_up_next_do(1)} //got the response, move to next instruction
    }
    to_source_code(args){
        return args.indent + "Robot.get_page(" +
            to_source_code({value: this.url_or_options}) +
            ((this.response_variable_name == "http_response") ? "" : (", " + to_source_code({value: this.response_variable_name})))  +
            ")"
    }
}

Instruction.Control.go_to = class go_to extends Instruction.Control{
    constructor (instruction_location) {
        super()
        if (instruction_location === undefined){
            dde_error("go_to has not been passed an instruction_location.")
        }
        this.instruction_location = instruction_location
    }
    do_item (job_instance){
        let id = job_instance.instruction_location_to_id(this.instruction_location)
        if (id == job_instance.program_counter){
            job_instance.stop_for_reason("errored", "In job." + job_instance.name +
                        "<br/>with a go_to instruction whose instruction_location: " + this.instruction_location +
                        "<br/>points to id: " + id +
                        "<br/>that is the same as this go_to instruction," +
                        "<br/>which would cause an infinite loop.")
            job_instance.set_up_next_do(0)

        }
        else {
            job_instance.program_counter = id
            job_instance.set_up_next_do(0)
        }
    }
    toString(){ return "Robot.go_to instruction_location: " + this.instruction_location }

    to_source_code(args){
        let this_indent = args.indent
        args        = jQuery.extend({}, arguments[0])
        args.value  = this.instruction_location
        args.indent = ""
        return this_indent + "Robot.go_to(" + to_source_code(args) + ")"
    }
}

Instruction.Control.grab_robot_status = class grab_robot_status extends Instruction.Control{
    constructor (user_data_variable = "grabbed_robot_status", //a string
                 start_index = Serial.DATA0, //integer, but can also be "all"
                 end_index=null)  //if integer and same as start_index,
                                //makes a vector of the start_index value,
                                //otherwise makes array of the start_index THROUGH
                                //end_index. OR can be the string "end" meaning
                                //grab through the end of the array
                 {
        super()
        this.user_data_variable = user_data_variable
        this.start_index        = start_index
        this.end_index          = end_index
    }
    do_item (job_instance){
        let rs = job_instance.robot.robot_status
        let val
        if (this.start_index == "data_array") {
            this.start_index = Serial.DATA0
            this.end_index   = "end"
        }
        //set val
        if (this.start_index == "all") { val = rs }
        else if (this.end_index) {
            if (this.end_index === "end") { this.end_index = rs.length - 1 }
            else if (this.start_index > this.end_index ) {
                job_instance.stop_for_reason("errored", "instruction: grab_robot_status passed end_index: " + this.end_index +
                          " that is less than start_index: " + this.start_index)
                job_instance.set_up_next_do(0)
                return
            }
            else { val = rs.slice(this.start_index, this.end_index + 1) }
        }
        else { val = rs[this.start_index] } //the one case that val is not an array
        job_instance.user_data[this.user_data_variable] = val
        job_instance.set_up_next_do(1)
    }
    toString(){
        return "grab_robot_status: " + this.user_data_variable
    }
    to_source_code(args){
        let this_indent = args.indent
        args        = jQuery.extend({}, args)
        args.value  = this.user_data_variable
        args.indent = ""
        let ud_src  = to_source_code(args)
        args        = jQuery.extend({}, args)
        args.value  = this.start_index
        args.indent = ""
        let si_src  = to_source_code(args)
        args        = jQuery.extend({}, args)
        args.value  = this.end_index
        args.indent = ""
        let ei_src  = to_source_code(args)
        return this_indent + "Robot.grab_robot_status(" +
               ud_src + ", " + si_src + ", " + ei_src + ")"
    }
}

Instruction.Control.human_task = class human_task extends Instruction.Control{
    constructor ({task="",
                  title, //don't give this default of "" because we reserve that for when you want NO title.
                         //without passing this, or passing "undefined", you get a smart default including the job name and "Human Task"
                  add_stop_button=true,
                  dependent_job_names=[],
                  x=200, y=200, width=400, height=400,  background_color = "rgb(238, 238, 238)"}={}) {
        super()
        this.task    = task
        this.add_stop_button     = add_stop_button
        this.dependent_job_names = dependent_job_names
        this.title   = title
        this.x       = x
        this.y       = y
        this.width   = width
        this.height  = height
        this.background_color = background_color
    }
    do_item (job_instance){
        var hidden  = '<input type="hidden" name="job_name" value="' + job_instance.name        + '"/>' +
                      "<input type='hidden' name='dependent_job_names' value='" + JSON.stringify(this.dependent_job_names) + "'/>"
        var buttons = '<center><input type="submit" value="Continue Job" title="Signify you are done with this task which\ncloses this dialog box and\ncontinues this job"/>&nbsp;'
        if (this.add_stop_button) { buttons += '<input type="submit" value="Stop Job" title="Close dialog box,\nstop this job and all dependent jobs."/>' }
        buttons += '</center>'
        if (this.title === undefined){
            this.title = "Job: " + job_instance.name + ", Human Task"
            if (job_instance.robot instanceof Human){
                this.title = job_instance.name + " task for: " +  job_instance.robot.name
            }
        }
        else if (this.title == "") { this.title = "<span style='height:25px;'>&nbsp;</span>" }
        job_instance.wait_reason = "user on Human.show_window interaction." //do before set_status_code so the tooltip gets set with the wait_reason.
        job_instance.set_status_code("waiting")
        show_window({content: this.task + "<p/>" + buttons + hidden,
                    callback: human_task_handler,
                    title: this.title,
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    background_color: this.background_color})
    }
    to_source_code(args){
        return args.indent + "Human.task({"  +
               ((this.task == "") ? "" : ("task: " + to_source_code({value: this.task}) + ", ")) +
               ((this.title === undefined) ? "" : ("title: " + to_source_code({value: this.title})  + ", ")) +
               ((this.add_stop_button == true)         ? "" : ("add_stop_button: "     + this.add_stop_button  + ", ")) +
               ((this.dependent_job_names.length == 0) ? "" : ("dependent_job_names: " + to_source_code({value: this.dependent_job_names}) + ", ")) +
               ((this.x      == 200) ? "" : ("x: " + this.x       + ", "   )) +
               ((this.y      == 200) ? "" : ("y: " + this.y       + ", "   )) +
               ((this.width  == 400) ? "" : ("width: "  + this.width   + ", "   )) +
               ((this.height == 400) ? "" : ("height: " + this.height  + ", "   )) +
               ((this.background_color == "rgb(238, 238, 238)") ? "" : ("background_color: " + to_source_code({value: this.background_color}))) +
               "})"
    }
}

var human_task_handler = function(vals){
    var job_instance = Job[vals.job_name]
    if (vals.clicked_button_value != "Continue Job"){
        job_instance.stop_for_reason("interrupted", "In human_task, user stopped this job.")
        var dep_job_names = JSON.parse(vals.dependent_job_names) //If the user did not pass in a dependent_job_names arg when
                    //creating the human_job, dep_job_names will now be [] so the below if hits but
                    //the for loop has nothing to loop over so nothing will be done.
        if (dep_job_names && Array.isArray(dep_job_names)){
            for (let j_name of dep_job_names){
                var j_inst = Job[j_name]
                if (!j_inst.stop_reason){ //if j_inst is still going, stop it.
                    j_inst.stop_for_reason("interrupted", "In human_task, user stopped this job which is dependent on job: " + job_instance.name)
                    j_inst.set_up_next_do(0)
                }
            }
        }
    }
    job_instance.set_up_next_do(1) //even for the case where we're stopping the job,
     //this lets the do_next_item handle finishing the job properly
}

Instruction.Control.human_enter_choice = class human_enter_choice extends Instruction.Control{
    constructor ({task="", user_data_variable_name="choice", choices=[], dependent_job_names=[],
                  show_choices_as_buttons=false, one_button_per_line=false,
                  add_stop_button=true,
                  title, x=200, y=200, width=400, height=400,  background_color="rgb(238, 238, 238)"}={}) {
        super()
        this.task        = task
        this.user_data_variable_name = user_data_variable_name
        //this.choices                 = choices
        this.show_choices_as_buttons = show_choices_as_buttons
        this.one_button_per_line     = one_button_per_line
        this.add_stop_button         = add_stop_button
        this.dependent_job_names     = dependent_job_names
        this.title   = title
        this.x       = x
        this.y       = y
        this.width   = width
        this.height  = height
        this.background_color = background_color
        this.choices = []
        for (let choice of choices){  //put each choice into an array. If already an array. leave it as is.
            if (typeof(choice) == "string") { choice = [choice] }
            if (Array.isArray(choice)) {  this.choices.push(choice) }
            else {dde_error("Human.enter_choice passed a choice that is not a string and not an array: " + choice)}
        }
    }
    do_item (job_instance){
        var hidden  = "<input type='hidden' name='job_name' value='" + job_instance.name                                   + "'/>\n" +
                      "<input type='hidden' name='dependent_job_names' value='" + JSON.stringify(this.dependent_job_names) + "'/>\n" +
                      "<input type='hidden' name='user_data_variable_name' value='" + this.user_data_variable_name         + "'/>\n" +
                      "<input type='hidden' name='choices_string' value='" + JSON.stringify(this.choices)                  + "'/>\n"
        let select = ""
        let buttons
        if (this.show_choices_as_buttons){
            for (var item of this.choices){
                select += "<input type='submit' style='background-color:#FFACB6;margin:4px;' value='" + item[0] + "'/> "
                if (this.one_button_per_line) { select += "<br/>" }
            }
            if(this.add_stop_button) {
              buttons = '<center><input type="submit" value="Stop Job" title="Close dialog box,\nstop this job and all dependent jobs."/></center>'
            }
        }
        else { //show as menu items,the default because we can have more of them.
            select  = "<center><select name='choice'>"
            for (var item of this.choices){ select += "<option>" + item[0] + "</option>" }
            select += "</select></center>"
            if(this.add_stop_button) {
                buttons = '<center><input type="submit" value="Continue Job" title="Close dialog box and\ncontinue this job"/>&nbsp;<input type="submit" value="Stop Job" title="Close dialog box,\nstop this job and all dependent jobs."/></center>'
            }
        }
        if (this.title === undefined){
            this.title = "Job: " + job_instance.name + ", Human Enter Choice"
            if (job_instance.robot instanceof Human){
                this.title = job_instance.name + " task for: " +  job_instance.robot.name
            }
        }
        else if (this.title == "") { this.title = "<span style='height:25px;'>&nbsp;</span>" }
        job_instance.wait_reason = "user on Human.show_window interaction." //do before set_status_code so the tooltip gets set with the wait_reason.
        job_instance.set_status_code("waiting")
        show_window({content: this.task + "<br/>" + select + "<br/>" + (buttons ? buttons : "") + hidden,
                    callback: human_enter_choice_handler,
                    title: this.title,
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    background_color: this.background_color})
    }

    to_source_code(args){
        return args.indent + "Human.enter_choice({" +
            ((this.task == "")                               ? "" : ("task: "                    + to_source_code({value: this.task})                    + ", ")) +
            ((this.title === undefined)                      ? "" : ("title: "                   + to_source_code({value: this.title})                   + ", ")) +
            ((this.user_data_variable_name == "choice")      ? "" : ("user_data_variable_name: " + to_source_code({value: this.user_data_variable_name}) + ", ")) +
            ((this.show_choices_as_buttons == false)         ? "" : ("show_choices_as_buttons: " + this.show_choices_as_buttons                          + ", ")) +
            ((this.one_button_per_line == false)             ? "" : ("one_button_per_line: "     + this.one_button_per_line                              + ", ")) +
            ((this.choices.length == 0)                      ? "" : ("choices: "                 + to_source_code({value: this.choices})                 + ", ")) +
            ((this.add_stop_button == true)                  ? "" : ("add_stop_button: "         + this.add_stop_button                                  + ", ")) +
            ((this.dependent_job_names.length == 0)          ? "" : ("dependent_job_names: "     + to_source_code({value: this.dependent_job_names})     + ", ")) +
            ((this.x      == 200)                            ? "" : ("x: " + this.x       + ", "   )) +
            ((this.y      == 200)                            ? "" : ("y: " + this.y       + ", "   )) +
            ((this.width  == 400)                            ? "" : ("width: "  + this.width   + ", "   )) +
            ((this.height == 400)                            ? "" : ("height: " + this.height  + ", "   )) +
            ((this.background_color == "rgb(238, 238, 238)") ? "" : ("background_color: " + to_source_code({value: this.background_color}))) +
            "})"
    }
}

var human_enter_choice_handler = function(vals){
    var job_instance = Job[vals.job_name]
    if(vals.clicked_button_value == "Continue Job") { //means the choices are in a menu, not individual buttons
        //job_instance.user_data[vals.user_data_variable_name] = vals.choice
        human_enter_choice_set_var(job_instance, vals.choice, vals.choices_string, vals.user_data_variable_name)
    }
    else if (vals.clicked_button_value == "Stop Job"){
        job_instance.stop_for_reason("interrupted", "In human_task, user stopped this job.")
        var dep_job_names = JSON.parse(vals.dependent_job_names) //If the user did not pass in a dependent_job_names arg when
        //creating the human_job, dep_job_names will now be [] so the below if hits but
        //the for loop has nothing to loop over so nothing will be done.
        if (dep_job_names && Array.isArray(dep_job_names)){
            for (let j_name of dep_job_names){
                var j_inst = Job[j_name]
                if (!j_inst.stop_reason){ //if j_inst is still going, stop it.
                    j_inst.stop_for_reason("interrupted", "In human_task, user stopped this job which is dependent on job: " + job_instance.name)
                    j_inst.set_up_next_do(0)
                    return
                }
            }
        }
    }
    else { //individual choices are in buttons and the user clicked on one of them
        //job_instance.user_data[vals.user_data_variable_name] = vals.clicked_button_value
        human_enter_choice_set_var(job_instance, vals.clicked_button_value, vals.choices_string, vals.user_data_variable_name)
    }
    job_instance.set_up_next_do(1) //even for the case where we're stopping the job,
    //this lets the do_next_item handle finishing the job properly
}

var human_enter_choice_set_var = function (job_instance, choice_string, choices_string, user_data_variable_name){
    let choices = JSON.parse(choices_string)
    let choice_array
    for(let a_choice_array of choices) {
        if (a_choice_array[0] == choice_string) {
            choice_array = a_choice_array
            break;
        }
    }
    if (!choice_array) { shouldnt("human_enter_choice got choice_string of: " + choice_string +
        " that isn't in: " + choices)}
    if (choice_array.length == 1) { job_instance.user_data[user_data_variable_name] = choice_array[0] }
    else {
        let val_src = choice_array[1]
        let val
        if(typeof(val_src == "string")) {
            let fn = new Function("return (" + val_src + ")") //create a new fn with no args and body of val_src
            val = fn.call(job_instance)
        }
        else { val = val_src }
        if (!choice_array[2]) {
            job_instance.user_data[user_data_variable_name] = val
        }
        else {
            Job.insert_instruction(val, {job: job_instance.name, offset:"after_program_counter"})
        }
    }
}

Instruction.Control.human_enter_filepath = class human_filepath extends Instruction.Control{
    constructor ({task="",
                  user_data_variable_name="a_filepath",
                  initial_value="",
                  add_stop_button = true,
                  dependent_job_names=[],
                  title, x=200, y=200, width=400, height=400,  background_color="rgb(238, 238, 238)"}={}) {
        super()
        this.task = task
        this.user_data_variable_name = user_data_variable_name
        this.initial_value           = initial_value
        this.add_stop_button         = add_stop_button
        this.dependent_job_names     = dependent_job_names
        this.title   = title
        this.x       = x
        this.y       = y
        this.width   = width
        this.height  = height
        this.background_color = background_color
    }

    do_item (job_instance){
        var hidden  = "<input type='hidden' name='job_name' value='" + job_instance.name                                   + "'/>" +
                      "<input type='hidden' name='dependent_job_names' value='" + JSON.stringify(this.dependent_job_names) + "'/>" +
                      "<input type='hidden' name='user_data_variable_name' value='" + this.user_data_variable_name         + "'/>"
        var text_html = "<input type='file' name='choice'/>"

        var buttons = '<center><input type="submit" value="Continue Job" title="Close dialog box and\\ncontinue this job"/>&nbsp;'
        if (this.add_stop_button) buttons += '<input type="submit" value="Stop Job" title="Close dialog box,\nstop this job and all dependent jobs."/>'
        buttons += '</center>'
        if (this.title === undefined){
            this.title = "Job: " + job_instance.name + ", Human Enter Filepath"
            if (job_instance.robot instanceof Human){
                this.title = job_instance.name + " task for: " +  job_instance.robot.name
            }
        }
        job_instance.wait_reason = "user on Human.enter_filepath interaction." //do before set_status_code so the tooltip gets set with the wait_reason.
        job_instance.set_status_code("waiting")
        show_window({content: this.task + "<br/>" + text_html + "<br/><br/>" + buttons + hidden,
            callback: human_enter_filepath_handler,
            title: this.title,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            background_color: this.background_color}
        )
    }
    to_source_code(args){
        return args.indent + "Human.enter_text({" +
            ((this.task == "")                               ? "" : ("task: "                    + to_source_code({value: this.task})                    + ", ")) +
            ((this.title === undefined)                      ? "" : ("title: "                   + to_source_code({value: this.title})                   + ", ")) +
            ((this.initial_value == "")                      ? "" : ("initial_value: "           + to_source_code({value: this.initial_value})           + ", ")) +
            ((this.add_stop_button  == true)                 ? "" : ("add_stop_button: "         + this.add_stop_button                                  + ", ")) +
            ((this.dependent_job_names.length == 0)          ? "" : ("dependent_job_names: "     + to_source_code({value: this.dependent_job_names})     + ", ")) +
            ((this.x      == 200)                            ? "" : ("x: " + this.x       + ", "   )) +
            ((this.y      == 200)                            ? "" : ("y: " + this.y       + ", "   )) +
            ((this.width  == 400)                            ? "" : ("width: "  + this.width   + ", "   )) +
            ((this.height == 400)                            ? "" : ("height: " + this.height  + ", "   )) +
            ((this.background_color == "rgb(238, 238, 238)") ? "" : ("background_color: " + to_source_code({value: this.background_color}))) +
            "})"
    }
}

function human_enter_filepath_handler(vals){
    var job_instance = Job[vals.job_name]
    if(vals.clicked_button_value == "Continue Job") { //means the choices are in a menu, not individual buttons
        job_instance.user_data[vals.user_data_variable_name] = vals.choice
    }
    else if (vals.clicked_button_value == "Stop Job"){
        job_instance.stop_for_reason("interrupted", "In human_enter_filepath, user stopped this job.")
        var dep_job_names = JSON.parse(vals.dependent_job_names) //If the user did not pass in a dependent_job_names arg when
        //creating the human_job, dep_job_names will now be [] so the below if hits but
        //the for loop has nothing to loop over so nothing will be done.
        if (dep_job_names && Array.isArray(dep_job_names)){
            for (let j_name of dep_job_names){
                var j_inst = Job[j_name]
                if (!j_inst.stop_reason){ //if j_inst is still going, stop it.
                    j_inst.stop_for_reason("interrupted", "In human_task, user stopped this job which is dependent on job: " + job_instance.name)
                    j_inst.set_up_next_do(0)
                    return
                }
            }
        }
    }
    job_instance.set_up_next_do(1) //even for the case where we're stopping the job,
    //this lets the do_next_item handle finishing the job properly
}



Instruction.Control.human_enter_instruction = class human_enter_instruction extends Instruction.Control{
    constructor ({task = "Enter a next instruction for this Job.",
                  instruction_type = "Dexter.move_all_joints",
                  instruction_args = "0, 0, 0, 0, 0",
                  add_stop_button = true,
                  dependent_job_names = [],
                  title, x=300, y=200, width=420, height=400,  background_color="rgb(238, 238, 238)"}={}) {
        super()
        this.task = task
        this.instruction_type    = instruction_type
        this.instruction_args    = instruction_args
        this.dependent_job_names = dependent_job_names
        this.add_stop_button     = add_stop_button
        this.title   = title
        this.x       = x
        this.y       = y
        this.width   = width
        this.height  = height
        this.background_color = background_color
    }

    make_instruction_options(){
        let result = ""
        let key_value_pairs = [] //Object.keys(Dexter.instruction_type_to_function_name_map).sort()
        for(let oplet of Object.keys(Dexter.instruction_type_to_function_name_map)){
           key_value_pairs.push([oplet, Robot.instruction_type_to_function_name(oplet)])
        }
        key_value_pairs.sort(function(a, b){ return ((a[1] < b[1])? -1 : 1 ) })
        for (let pair of key_value_pairs){
            let oplet = pair[0]
            let name  = pair[1]
            let label    = name + " (" + oplet + ")"
            let sel_html = ((name == this.instruction_type) ? "selected" : "")
            let the_html = "<option " + sel_html + ">" + label + "</option>"
            result      += the_html
        }
        return result
    }

    do_item (job_instance){
        if (!job_instance.enter_instruction_recording) { //don't always init as might have instructions from prev dialog in this set
             job_instance.enter_instruction_recording = []
        }
        var hidden  = "<input type='hidden' name='dependent_job_names' value='" + JSON.stringify(this.dependent_job_names) + "'/>" +
                      "<input type='hidden' name='job_name' value='" + job_instance.name + "'/>"
        var type_html = '<span name="instruction_type" class="combo_box" style="display:inline-block;vertical-align:middle;width:235px;">' +
                        this.make_instruction_options() +
                        '</span>'
        let rs = job_instance.robot.robot_status
        var immediate_do = '<b><i>&nbsp;or</i></b><fieldset style="margin-bottom:10px;margin-top:10px;background-color:#DDDDDD">' +
                           '<div style="margin-bottom:10px;"> <i title="'    +
                           'Find valid oplet letters at end of&#013;'        +
                           'each item in the Instruction type menu.&#013;'   +
                           "Type 'space' to create an 'a' instruction&#013;" +
                           "with joint angles from Dexter's current angles." +
                           '">Immediately do & record typed-in oplet</i>: ' +
                           '<input id="immediate_do_id" autofocus name="immediate_do" data-oninput="true" style="width:30px;"/></div>' +
                           '<span title="' + "Each letter you type into&#013;the above type-in box is recorded." +
                           '"><span style="font-size:12px;">Recorded instructions: ' +
                           '</span><span id="recorded_instructions_count_id">' + job_instance.enter_instruction_recording.length + '</span>' +
                           "</span>&nbsp;&nbsp;" +
                            '<input type="button" value="Save" title="Inserts the recorded instructions&#013;into the editor at the cursor,&#013;wrapped in a Job definition.&#013;Also erases (clears) the recording."/> &nbsp;'  +
                            '<input type="button" value="Clear" title="Erases all the instructions in the recording."/> &nbsp;' +
                            '<input type="button" value="Erase last" title="Erases just the last instruction recorded."/><br/>'   +
                            '<span style="font-size:12px;">' + job_instance.robot.name + " current angles: " +
                            rs[Dexter.J1_ANGLE] + ", " +
                            rs[Dexter.J2_ANGLE] + ", " +
                            rs[Dexter.J3_ANGLE] + ", " +
                            rs[Dexter.J4_ANGLE] + ", " +
                            rs[Dexter.J5_ANGLE] + "</span>" +
                           '</fieldset>'

        var args_html = "<input name='args' style='width:290px;' value='" + this.instruction_args + "'/>"
        var buttons =   '<input type="submit" value="Run instruction & reprompt"/><p/>' +
                        '<input type="submit" value="Continue this job without reprompting" title="Close dialog box and\ncontinue this job"/><p/>' +
            (this.add_stop_button ? '<input type="submit" value="Stop Job" title="Close dialog box,\nstop this job and all dependent jobs."/>' : "")
        if (this.title === undefined) {
            this.title = "Job: " + job_instance.name + ", Human Enter Instruction"
            if (job_instance.robot instanceof Human){
                this.title = job_instance.name + " task for: " +  job_instance.robot.name
            }
        }
        else if (this.title == "") { this.title = "<span style='height:25px;'>&nbsp;</span>" }
        if(job_instance.robot instanceof Dexter){
            out(Dexter.robot_status_to_html(job_instance.robot.robot_status, "on job: " + job_instance.name), "black", true)
        }
        job_instance.wait_reason = "user on Human.show_window interaction." //do before set_status_code so the tooltip gets set with the wait_reason.
        job_instance.set_status_code("waiting")
        show_window({content: "<div style='margin-bottom:10px;'><i>" + this.task + "</i></div>" +
                              "Instruction type: " + type_html +
                              immediate_do +
                              "<div style='padding-left:95px;font-size:12px'><i>Separate args with a comma.</i></div>"  +
                              "Arguments: " + args_html + "<p/>"  +
                              buttons +
                              hidden ,
                    callback: human_enter_instruction_handler,
                    title: this.title,
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    background_color: this.background_color //having larger than 350 does not increase the number of combo box menu items shown.
                    })
        //setTimeout(function(){immediate_do_id.focus()}, 100) //always focus on immediate_do_id id because if user is in a loop using it, we might as well focus on it. No other widgets where focus would matter in this dialog
        //above line can't work because we're in sandbox where immediate_do_id is unbound
        immediate_do_id.focus()
    }

    to_source_code(args){
        return args.indent + "Human.enter_instruction({" +
            ((this.task == "")                               ? "" : ("task: "                    + to_source_code({value: this.task})                    + ", ")) +
            ((this.title === undefined)                      ? "" : ("title: "                   + to_source_code({value: this.title})                   + ", ")) +
            ((this.instruction_type == "Dexter.move_all_joints") ? "" : ("instruction_type: "    + to_source_code({value: this.instruction_type}) + ", ")) +
            ((this.instruction_args  == "0, 0, 0, 0, 0")     ? "" : ("instruction_args: "        + to_source_code({value: this.instruction_args}) + ", ")) +
            ((this.add_stop_button  == true)                 ? "" : ("add_stop_button: "         + this.add_stop_button                                  + ", ")) +
            ((this.dependent_job_names.length == 0)          ? "" : ("dependent_job_names: "     + to_source_code({value: this.dependent_job_names})     + ", ")) +
            ((this.x      == 200)                            ? "" : ("x: " + this.x       + ", "   )) +
            ((this.y      == 200)                            ? "" : ("y: " + this.y       + ", "   )) +
            ((this.width  == 400)                            ? "" : ("width: "  + this.width   + ", "   )) +
            ((this.height == 400)                            ? "" : ("height: " + this.height  + ", "   )) +
            ((this.background_color == "rgb(238, 238, 238)") ? "" : ("background_color: " + to_source_code({value: this.background_color}))) +
            "})"
    }
}

var human_enter_instruction_handler = function(vals){
    var job_instance = Job[vals.job_name]
    var hei_instance = job_instance.do_list[job_instance.program_counter]
    if      (vals.clicked_button_value == "Stop Job"){
        job_instance.enter_instruction_recording = []
        job_instance.stop_for_reason("interrupted", "In human_enter_instruction, user stopped this job.")
        var dep_job_names = JSON.parse(vals.dependent_job_names) //If the user did not pass in a dependent_job_names arg when
        //creating the human_job, dep_job_names will now be [] so the below if hits but
        //the for loop has nothing to loop over so nothing will be done.
        if (dep_job_names && Array.isArray(dep_job_names)){
            for (let j_name of dep_job_names){
                let j_inst = Job[j_name]
                if (!j_inst.stop_reason){ //if j_inst is still going, stop it.
                    j_inst.stop_for_reason("interrupted", "In human_enter_instruction, user stopped this job which is dependent on job: " + job_instance.name)
                    j_inst.set_up_next_do(0)
                    return
                }
            }
        }
        //close_window(vals.window_index) //not needed. this is a submit button
    }
    else if (vals.clicked_button_value == "Continue this job without reprompting") {
        job_instance.enter_instruction_recording = []
        //close_window(vals.window_index) //not needed. this is a submit button
    }
    else if (vals.clicked_button_value == "Save") {
        let job_source_to_save = human_enter_instruction_job_source_to_save(job_instance)
        Editor.insert(job_source_to_save, "selection_end")
        job_instance.enter_instruction_recording = []
        recorded_instructions_count_id.innerHTML =  "0"
        out("Human.enter_instruction: recorded instructions saved and cleared.", "purple", true)
        immediate_do_id.focus()
        return
    }
    else if (vals.clicked_button_value == "Clear") {
        job_instance.enter_instruction_recording = []
        recorded_instructions_count_id.innerHTML =  "0"
        out("Human.enter_instruction cleared all recorded instructions.", "purple")
        immediate_do_id.focus()
        return
    }
    else if (vals.clicked_button_value == "Erase last") {
        let last_ins = job_instance.enter_instruction_recording.pop()
        if (last_ins){
            recorded_instructions_count_id.innerHTML = "" + job_instance.enter_instruction_recording.length
            out("Human.enter_instruction erased the last previously recorded instruction of:<br/>" + stringify_value(last_ins),
                "purple")
        }
        else {
            out("There are no instructions in the recording to erase.", "red", true)
        }
        immediate_do_id.focus()
        return
    }

    else { //Run ins & reprompt" or "immediate_do
      let oplet, ins_type
      if (vals.clicked_button_value == "immediate_do"){
          if (vals.immediate_do == "") {
              oplet = "a"
          }
          else {
              oplet = last(vals.immediate_do)
          }
          ins_type = oplet //probably won't do any good as its hard to init the combo box to something other than one of its already named items.
          close_window(vals.window_index)
          //console.log("in human_enter_instruction_handler after close_window")
      }
      else { //user clicked a submit button so don't need to close the window.
          ins_type = vals.instruction_type.trim()
          if (ins_type.length == 1){ oplet = ins_type }
          else {
             oplet = ins_type.split("(")[1]
             oplet = oplet[0]
          }
      }
      let args = vals.args
      let args_array = args.split(/,s*/) //the s* doesn't soak up the whitespace unfortunately
      if ((vals.clicked_button_value == "immediate_do") && (vals.immediate_do == "")){
          let rs = job_instance.robot.robot_status
          args_array = make_ins(oplet, rs[Dexter.J1_ANGLE], rs[Dexter.J2_ANGLE],
                                rs[Dexter.J3_ANGLE], rs[Dexter.J4_ANGLE], rs[Dexter.J5_ANGLE])
      }
      else {
          let new_array = make_ins(oplet)
          for (let i = 0; i < args_array.length; i++){
              new_array.push(parseFloat(args_array[i]))
          }
          args_array = new_array
      }
      if (vals.clicked_button_value == "immediate_do"){
          let prefix = "Human.enter_instruction made instruction:"
          if (vals.immediate_do == ""){
              prefix = "Human.enter_instruction captured Dexter's joint angles for instruction:"
          }
          out(prefix + "<br/>" + stringify_value(args_array), "purple")
          job_instance.enter_instruction_recording.push(args_array)
          //don't to the above set_in_ui because the win is now closed, but the new count will show up when the window redisplays
      }
      let ins_name = ins_type.split(" ")[0]
      let new_human_instruction = Human.enter_instruction({task: hei_instance.task, instruction_type: ins_name, instruction_args: args, dependent_job_names: hei_instance.dependent_job_names})
      let new_ins_array = [args_array, new_human_instruction]
      job_instance.insert_instructions(new_ins_array)
      job_instance.added_items_count[job_instance.program_counter] = 2
    }
    job_instance.set_up_next_do(1) //even for the case where we're stopping the job,
    //this lets the do_next_item handle finishing the job properly
}

var human_enter_instruction_job_source_to_save = function(job_instance){
    let instructions_src = ""
    let prefix = ""
    for (let ins of job_instance.enter_instruction_recording){
        let ins_src = "make_ins("
        for (let i = Dexter.INSTRUCTION_TYPE; i < ins.length; i++){
            let val = stringify_value_sans_html(ins[i])
            let arg_prefix = ((i == Dexter.INSTRUCTION_TYPE) ? "" : ", ")
            ins_src += arg_prefix + val

        }
        ins_src += ")"
        instructions_src += prefix + ins_src
        prefix = ",\n                   "
    }
    let new_job_name = "recorded_from_" + job_instance.name
    let result = '\n' +
'new Job({name: "' + new_job_name + '",\n' +
'         robot: Robot.' + job_instance.robot.name + ',\n' +
'         do_list: [' + instructions_src +
'\n                  ]})\n'
    return result + "Job." + new_job_name + ".start()\n"
}

Instruction.Control.human_enter_number = class human_enter_number extends Instruction.Control{
    constructor (  {task="",
                    user_data_variable_name="a_number",
                    initial_value=0,
                    min=0,
                    max=100,
                    step=1,
                    add_stop_button = true,
                    dependent_job_names=[],
                    title, x=200, y=200, width=400, height=400,  background_color="rgb(238, 238, 238)"}={}){
        super()
        this.task = task
        this.user_data_variable_name = user_data_variable_name
        this.initial_value=initial_value
        this.min = min
        this.max = max
        this.step = step
        this.add_stop_button = add_stop_button
        this.dependent_job_names = dependent_job_names
        this.title   = title
        this.x       = x
        this.y       = y
        this.width   = width
        this.height  = height
        this.background_color = background_color
    }
    
    do_item (job_instance){
        var hidden  = "<input type='hidden' name='job_name' value='" + job_instance.name                                   + "'/>" +
                      "<input type='hidden' name='dependent_job_names' value='" + JSON.stringify(this.dependent_job_names) + "'/>" +
                      "<input type='hidden' name='user_data_variable_name' value='" + this.user_data_variable_name         + "'/>"

        var number_html  = "<center>"  + this.user_data_variable_name + " = " + "<input type='number' name='choice" +
                           "' value='" + this.initial_value +
                           "' min='"   + this.min +
                           "' max='"   + this.max +
                           "' step='"  + this.step +
                           "'/></center>"
        var buttons = '<center><input type="submit" value="Continue Job" title="Close dialog box and\ncontinue this job"/>&nbsp;'
        if (this.add_stop_button) { buttons += '<input type="submit" value="Stop Job" title="Close dialog box,\nstop this job and all dependent jobs."/>' }
        buttons += '</center>'
        if (this.title === undefined){
            this.title = "Job: " + job_instance.name + ", Human Enter Number"
            if (job_instance.robot instanceof Human){
                this.title = job_instance.name + " task for: " +  job_instance.robot.name
            }
        }
        else if (this.title == "") { this.title = "<span style='height:25px;'>&nbsp;</span>" }
        job_instance.wait_reason = "user on Human.show_window interaction." //do before set_status_code so the tooltip gets set with the wait_reason.
        job_instance.set_status_code("waiting")
        show_window({content: this.task + "<br/>" + number_html + "<br/>" + buttons + hidden,
                    callback: human_enter_number_handler,
                    title: this.title,
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    background_color: this.background_color})
    }
    to_source_code(args){
        return args.indent + "Human.enter_number({" +
            ((this.task == "")                               ? "" : ("task: "                    + to_source_code({value: this.task})                    + ", ")) +
            ((this.title === undefined)                      ? "" : ("title: "                   + to_source_code({value: this.title})                   + ", ")) +
            ((this.initial_value == 0)                       ? "" : ("initial_value: "           + to_source_code({value: this.initial_value})           + ", ")) +
            ((this.min           == 0)                       ? "" : ("min: "                     + to_source_code({value: this.min})                     + ", ")) +
            ((this.max           == 1000)                    ? "" : ("max: "                     + to_source_code({value: this.max})                     + ", ")) +
            ((this.step          == 1)                       ? "" : ("step: "                    + to_source_code({value: this.step})                    + ", ")) +
            ((this.add_stop_button  == true)                 ? "" : ("add_stop_button: "         + this.add_stop_button                                  + ", ")) +
            ((this.dependent_job_names.length == 0)          ? "" : ("dependent_job_names: "     + to_source_code({value: this.dependent_job_names})     + ", ")) +
            ((this.x      == 200)                            ? "" : ("x: " + this.x       + ", "   )) +
            ((this.y      == 200)                            ? "" : ("y: " + this.y       + ", "   )) +
            ((this.width  == 400)                            ? "" : ("width: "  + this.width   + ", "   )) +
            ((this.height == 400)                            ? "" : ("height: " + this.height  + ", "   )) +
            ((this.background_color == "rgb(238, 238, 238)") ? "" : ("background_color: " + to_source_code({value: this.background_color}))) +
            "})"
    }
}

var human_enter_number_handler = function(vals){
    var job_instance = Job[vals.job_name]
    if (vals.clicked_button_value != "Continue Job"){
        job_instance.stop_for_reason("interrupted", "In human_enter_number, user stopped this job.")
        var dep_job_names = JSON.parse(vals.dependent_job_names) //If the user did not pass in a dependent_job_names arg when
        //creating the human_job, dep_job_names will now be [] so the below if hits but
        //the for loop has nothing to loop over so nothing will be done.
        if (dep_job_names && Array.isArray(dep_job_names)){
            for (let j_name of dep_job_names){
                var j_inst = Job[j_name]
                if (!j_inst.stop_reason){ //if j_inst is still going, stop it.
                    j_inst.stop_for_reason("interrupted", "In human_enter_number, user stopped this job which is dependent on job: " + job_instance.name)
                    j_inst.set_up_next_do(0)
                    return
                }
            }
        }
    }
    else { //Done
        var the_choice = parseFloat(vals.choice)
        job_instance.user_data[vals.user_data_variable_name] = the_choice
    }
    job_instance.set_up_next_do(1) //even for the case where we're stopping the job,
    //this lets the do_next_item handle finishing the job properly
}

Instruction.Control.human_enter_text = class human_enter_text extends Instruction.Control{
    constructor ({task="",
                    user_data_variable_name="a_text",
                    initial_value="",
                    line_count=1, //if 1, makes an input type=text. If > 1 makes a resizeable text area
                    add_stop_button = true,
                    dependent_job_names=[],
                    title, x=200, y=200, width=400, height=400,  background_color="rgb(238, 238, 238)"}={}) {
        super()
        this.task = task
        this.user_data_variable_name = user_data_variable_name
        this.initial_value = initial_value
        this.line_count = line_count
        this.add_stop_button = add_stop_button
        this.dependent_job_names = dependent_job_names
        this.title   = title
        this.x       = x
        this.y       = y
        this.width   = width
        this.height  = height
        this.background_color = background_color
    }
    
    do_item (job_instance){
        var hidden  = "<input type='hidden' name='job_name' value='" + job_instance.name                                   + "'/>" +
                      "<input type='hidden' name='dependent_job_names' value='" + JSON.stringify(this.dependent_job_names) + "'/>" +
                      "<input type='hidden' name='user_data_variable_name' value='" + this.user_data_variable_name         + "'/>"
        var text_html
        if(this.line_count == 1){
            text_html  = this.user_data_variable_name + " =<br/><input type='text' name='choice" +
            "' size='50" +
            "' value='" + this.initial_value +
            "'/>"
        }
        else {
            text_html  = this.user_data_variable_name + " =<br/><textarea name='choice" +
            "' rows='" + this.line_count +
            "' cols='50'>" + this.initial_value +
             "</textarea>"
        }
        var buttons = '<center><input type="submit" value="Continue Job"/>&nbsp;'
        if (this.add_stop_button) buttons += '<input type="submit" value="Stop Job" title="Close dialog box,\nstop this job and all dependent jobs."/>'
        buttons += '</center>'
        if (this.title === undefined){
            this.title = "Job: " + job_instance.name + ", Human Enter Text"
            if (job_instance.robot instanceof Human){
                this.title = job_instance.name + " task for: " +  job_instance.robot.name
            }
        }
        job_instance.wait_reason = "user on Human.show_window interaction." //do before set_status_code so the tooltip gets set with the wait_reason.
        job_instance.set_status_code("waiting")
        show_window({content: this.task + "<br/>" + text_html + "<br/><br/>" + buttons + hidden,
                    callback: human_enter_text_handler,
                    title: this.title,
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height,
                    background_color: this.background_color}
                    )
    }
    to_source_code(args){
        return args.indent + "Human.enter_text({" +
            ((this.task == "")                               ? "" : ("task: "                    + to_source_code({value: this.task})                    + ", ")) +
            ((this.title === undefined)                      ? "" : ("title: "                   + to_source_code({value: this.title})                   + ", ")) +
            ((this.initial_value == "")                      ? "" : ("initial_value: "           + to_source_code({value: this.initial_value})           + ", ")) +
            ((this.line_count    == 1)                       ? "" : ("line_count: "              + this.line_count                                       + ", ")) +
            ((this.add_stop_button  == true)                 ? "" : ("add_stop_button: "         + this.add_stop_button                                  + ", ")) +
            ((this.dependent_job_names.length == 0)          ? "" : ("dependent_job_names: "     + to_source_code({value: this.dependent_job_names})     + ", ")) +
            ((this.x      == 200)                            ? "" : ("x: " + this.x       + ", "   )) +
            ((this.y      == 200)                            ? "" : ("y: " + this.y       + ", "   )) +
            ((this.width  == 400)                            ? "" : ("width: "  + this.width   + ", "   )) +
            ((this.height == 400)                            ? "" : ("height: " + this.height  + ", "   )) +
            ((this.background_color == "rgb(238, 238, 238)") ? "" : ("background_color: " + to_source_code({value: this.background_color}))) +
            "})"
    }
}

var human_enter_text_handler = function(vals){
    var job_instance = Job[vals.job_name]
    if (vals.clicked_button_value != "Continue Job"){
        job_instance.stop_for_reason("interrupted", "In human_enter_text, user stopped this job.")
        var dep_job_names = JSON.parse(vals.dependent_job_names) //If the user did not pass in a dependent_job_names arg when
        //creating the human_job, dep_job_names will now be [] so the below if hits but
        //the for loop has nothing to loop over so nothing will be done.
        if (dep_job_names && Array.isArray(dep_job_names)){
            for (let j_name of dep_job_names){
                var j_inst = Job[j_name]
                if (!j_inst.stop_reason){ //if j_inst is still going, stop it.
                    j_inst.stop_for_reason("interrupted", "In human_enter_text, user stopped this job which is dependent on job: " + job_instance.name)
                    j_inst.set_up_next_do(0)
                }
            }
        }
    }
    else { //Done
        var the_choice = vals.choice
        job_instance.user_data[vals.user_data_variable_name] = the_choice
    }
    job_instance.set_up_next_do(1) //even for the case where we're stopping the job,
    //this lets the do_next_item handle finishing the job properly
}

Instruction.Control.human_notify = class human_notify extends Instruction.Control{
    constructor ({task="",
                  window=true,
                  output_pane=true,
                  beep_count=0,
                  speak=false,
                  //does not have x and y because those are automatically set to make
                  //multiple notify windows visible.
                  title, width=400, height=400,  background_color="rgb(238, 238, 238)"}={}) {

        super()
        //copy_missing_fields(arguments[0], this) //BUG! doesn't get the default values from above
        this.task=task,
        this.window=window,
        this.output_pane=output_pane,
        this.beep_count=beep_count,
        this.speak=speak
        this.title   = title
        this.width   = width
        this.height  = height
        this.background_color = background_color
    }
    
    do_item (job_instance){
        if (this.title === undefined){
            this.title = job_instance.name + ", Notification"
            if (job_instance.robot instanceof Human){
                this.title += " for: " +  job_instance.robot.name
            }
        }
        else if (this.title == "") { this.title = "<span style='height:25px;'>&nbsp;</span>" }
        var prefix = "<div style='font-size:11px;'>Presented at: " + new Date() + "<br/>" +
            "Instruction " + job_instance.program_counter +
            " of " + job_instance.do_list.length + "</div>"
        if (this.window){
            show_window({content: prefix + "<br/>" + this.task,
                         y: human_notify.get_window_y(), //do y first since it might cause reset of positions
                         x: human_notify.get_window_x(),
                         title:  this.title,
                         width:  this.width,
                         height: this.height,
                         background_color: this.background_color
            })
        }
        if (this.output_pane){
            out(this.title + "<br/>" + prefix + this.task, "#951616")
        }
        var the_notifiy = this
        beeps(this.beep_count,
             function(){if (the_notifiy.speak){
                             speak({speak_data: the_notifiy.title + ", " + the_notifiy.task})
             }})
        job_instance.set_up_next_do(1)
    }
    static get_window_x(){
        human_notify.window_x += 40
        return window.outerWidth - 370 - human_notify.window_x
    }
    static get_window_y(){
        human_notify.window_y += 40
        if (human_notify.window_y > (window.outerHeight - 300)){
            human_notify.window_x = 0
            human_notify.window_y = 40
        }
        return human_notify.window_y
    }
    to_source_code(args){
        return args.indent + "Human.notify({" +
            ((this.task == "")                               ? "" : ("task: "                    + to_source_code({value: this.task})                    + ", ")) +
            ((this.title === undefined)                      ? "" : ("title: "                   + to_source_code({value: this.title})                   + ", ")) +
            ((this.window      == true)                      ? "" : ("window: "                  + this.window                                           + ", ")) +
            ((this.output_pane == true)                      ? "" : ("output_pane: "             + this.output_pane                                      + ", ")) +
            ((this.beep_count  == 0)                         ? "" : ("beep_count: "              + this.beep_count                                       + ", ")) +
            ((this.speak       == false)                     ? "" : ("speak: "                   + this.speak                                            + ", ")) +
            ((this.x      == 200)                            ? "" : ("x: " + this.x              + ", "   )) +
            ((this.y      == 200)                            ? "" : ("y: " + this.y              + ", "   )) +
            ((this.width  == 400)                            ? "" : ("width: "  + this.width     + ", "   )) +
            ((this.height == 400)                            ? "" : ("height: " + this.height    + ", "   )) +
            ((this.background_color == "rgb(238, 238, 238)") ? "" : ("background_color: " + to_source_code({value: this.background_color}))) +
            "})"
    }
}

Instruction.Control.human_notify.window_x = 0
Instruction.Control.human_notify.window_y = 0

Instruction.Control.human_show_window = class human_show_window extends Instruction.Control{
    constructor (sw_lit_obj_args = {}) {
        super()
        this.win_index = null
        this.sw_lit_obj_args = sw_lit_obj_args
        this.user_data_variable_name = sw_lit_obj_args.user_data_variable_name
        this.orig_callback = sw_lit_obj_args.callback
    }

    do_item (job_instance){ //only gets called once, the first time this instr is run
        this.sw_lit_obj_args.the_job_name       = job_instance.name
        //this.sw_lit_obj_args.the_instruction_id = job_instance.do_list.indexOf(this)

        job_instance.wait_reason = "user on Human.show_window interaction." //do before set_status_code so the tooltip gets set with the wait_reason.
        job_instance.set_status_code("waiting")
        //can't use a closure here bevause if its an anonymous fn, then it gets src code
        //saved in the show-window dom, and that has to get evaled in an env
        //that's not this one so closed over vars won't work.
        this.sw_lit_obj_args.callback = human_show_window_handler
        this.win_index = show_window(this.sw_lit_obj_args)
    }
    to_source_code(args){
        let extra_indent = ' '.repeat(37)
        return args.indent + "Human.show_window(\n" +
               to_source_code({indent: args.indent + extra_indent, value: this.sw_lit_obj_args}) + ")"
    }
}

var human_show_window_handler = function(vals){
    const the_job  = Job[vals.the_job_name]
    delete vals.the_job_name
    const hsw_inst = the_job.current_instruction() //the_job.do_list[vals.the_instruction_id]
    const cb = hsw_inst.orig_callback
    cb.call(the_job, vals)
    if(!is_window_shown(vals.window_index)){
        //if windows is not shown, that means time to save its values in the job an let the job got to its next instruction
        the_job.user_data[hsw_inst.sw_lit_obj_args.user_data_variable_name] = vals
        the_job.set_status_code("running")
        the_job.set_up_next_do(1)
    }
}

Instruction.Control.if_any_errors = class if_any_errors extends Instruction.Control{
    constructor (job_names=[], instruction_if_error=null) {
        super()
        this.job_names = job_names
        this.instruction_if_error = instruction_if_error
    }
    do_item (job_instance){
        for(let job_name of this.job_names){
            let j_inst = Job[job_name]
            if (j_inst){
                if ((j_inst.status_code == "errored") ||
                    (j_inst.status_code == "interrupted")){
                    let the_error_ins = this.instruction_if_error
                    if (the_error_ins == null){
                        let message = "In job: " + job_instance.name +
                                      ", an instruction of type: Robot.if_any_errors, " +
                                      "discovered that job: " + job_name + " has errored."
                        the_error_ins =  Robot.error(message)
                    }
                    job_instance.insert_single_instruction(the_error_ins)
                    job_instance.added_items_count[this.program_counter] = 1
                    break;
                }
            }
            else {
                job_instance.stop_for_reason("errored", "In job: " + job_instance.name +
                             ", an instruction of type: Robot.if_any_errors<br/> " +
                             "was passed a job name of:  " + job_name + "<br/> that doesn't exist.")
                job_instance.set_up_next_do(0)
                return
            }
        }
        job_instance.set_up_next_do(1)
    }
    to_source_code(args){
        return args.indent + "Robot.if_any_errors(" +
                              to_source_code({value: this.job_names}) + ", " +
                              to_source_code({value: this.instruction_if_error}) + ")"
    }
}

Instruction.Control.label = class label extends Instruction.Control{
    //also job_names may or may not contain the name of the current job. It doesn't matter.
    constructor (name) {
        super()
        if (!name){
            dde_error("Instruction label has not been passed a name.")
        }
        this.name = name
    }
    do_item (job_instance){
        job_instance.set_up_next_do(1)
    }
    toString(){ return this.name }
    to_source_code(args){
        return args.indent + "Robot.label(" +
              to_source_code({value: this.name})  + ")"
    }
}

Instruction.Control.out = class Out extends Instruction.Control{
    constructor (val, color, temp) {
        super()
        this.val   = val
        this.color = color
        this.temp  = temp
    }
    do_item (job_instance){
        let message = "Job: " + job_instance.name + ", instruction ID: " + job_instance.program_counter + ", Robot.out<br/>" + this.val
        out(message, this.color, this.temp)
        job_instance.set_up_next_do(1)
    }
    toString() { return "Robot.out of: " + this.val }
    to_source_code(args){
        return args.indent + "Robot.out(" +
                to_source_code({value: this.val})  +
                ((this.color == "black") ? "" : (", " + to_source_code({value: this.color}))) +
                (this.temp ? (", " + to_source_code({value: this.temp})) : "") +
                ")"
    }
}

/*Obsoleted by just putting a phrase directly on the do_list
Instruction.Control.play_notes = class play_notes extends Instruction.Control{
    constructor (note_or_phrase) {
        super()
        if (typeof(note_or_phrase) == "string"){
            note_or_phrase = note_or_phrase.trim()
            if(note_or_phrase.includes(" ")){ //phrase
                   note_or_phrase = new Phrase({notes: note_or_phrase})
            }
            else { note_or_phrase = Note.n(note_or_phrase) }
        }
        this.note_or_phrase = note_or_phrase
    }
    do_item(job_instance){ //send all the notes on first call, then do a set_timeout of the overall dur to setup_next
        //works when note_or_phrase is either a note or a phrase
        this.note_or_phrase.play()
        //setTimeout(function(){
              job_instance.set_up_next_do(1, false, this.note_or_phrase.dur_in_seconds())
           // },
           // this.note_or_phrase.dur_in_ms())
    }
}*/

Instruction.Control.send_to_job = class send_to_job extends Instruction.Control{
    constructor ({//to_job_name     = "required",
                  do_list_item    = null, //can be null, a single instruction, or an array of instructions
                  where_to_insert = "required", //"next_top_level",
                  wait_until_done = false,
                  start           = false,
                  unsuspend       = false,
                  status_variable_name = null} = {}) {
        super()
        this.do_list_item    = do_list_item
        this.where_to_insert = where_to_insert
        this.wait_until_done = wait_until_done
        this.start           = start
        this.unsuspend       = unsuspend
        this.status_variable_name = status_variable_name
        this.already_sent_instruction = false //used internally
        let params = arguments[0]
        if (!params.where_to_insert || (params.where_to_insert == "required")) { //the defaults listed above don't actually work
            //params.where_to_insert = "next_top_level"
            dde.error("Instruction send_to_job ws not supplied with a 'where_to_send' instruction location.")
        }
        copy_missing_fields(params, this)
    }

    do_item (job_instance){ //job_instance is the "from" job
        this.from_job_name       = job_instance.name
        this.from_instruction_id = job_instance.program_counter
        if (!this.already_sent_instruction) { //only excute this code once per send_to_job instance
            if (this.status_variable_name){
             job_instance.user_data[this.status_variable_name] = "sent"
            }
            this.destination_do_send_to_job(job_instance) //this COULD be just a json obj of name value pairs. Don't really need the whole instance here.
                                                         //if we need to send to a job on another computer, convert to that json obj.
            this.already_sent_instruction = true
        }
        if(this.wait_until_done){
            job_instance.wait_until_instruction_id_has_run = job_instance.program_counter
            //don't do the below because the to_job will, when its inserted instr is done,
            //call from_job.send_to_job_receive_done which will call set_up_next_do(1)
           // job_instance.set_up_next_do(0) //a rare place I pass 0 here!
                      //since this is not going through robot_done_with_instruction
        }
        else{
            job_instance.set_up_next_do(1)
        }
    }
    to_source_code(args){
        return args.indent + "Robot.send_to_job({" +
            ((this.do_list_item == null)          ? "" :  ("do_list_item: "         + to_source_code({value: this.do_list_item})                 + ", ")) +
            ((this.where_to_insert === undefined) ? "" :  ("where_to_insert: "      + to_source_code({value: this.where_to_insert})      + ", ")) +
            ((this.wait_until_done === false)     ? "" :  ("wait_until_done: "      + to_source_code({value: this.wait_until_done})      + ", ")) +
            ((this.start === false)               ? "" :  ("start: "                + to_source_code({value: this.start})                + ", ")) +
            ((this.unsuspend === false)           ? "" :  ("unsuspend: "            + to_source_code({value: this.unsuspend})            + ", ")) +
            ((this.status_variable_name == null)  ? "" :  ("status_variable_name: " + to_source_code({value: this.status_variable_name}) )) +
            "})"
    }

            //fns prefixed with destination are run on the to_job.
//"this" is the send_to_job instruction instance
//This fn is not a user fn and is not an instruction for a do_list.
    destination_do_send_to_job(from_job_instance){
        let params = this
        var to_job_instance = Job.instruction_location_to_job(params.where_to_insert, false)
        if (!to_job_instance) { to_job_instance = from_job_instance }
        if (to_job_instance === from_job_instance) { this.wait_until_done = false } //when a job is inserting code into itself,//we don't want it to hang waiting for itself.

        //first, add destination_send_to_job_is_done to do_items if need be.
        let do_items = params.do_list_item
        var notify_item = null
        if (params.wait_until_done){
            //var send_back_obj = {from_job_name:        params.from_job_name,
            //                     from_instruction_id:  params.from_instruction_id,
            //                     status_variable_name: params.status_variable_name
            //                    }
            var notify_item = new Instruction.Control.destination_send_to_job_is_done(params)
            //notify_item is appeneded to the end of do_items, and the whole array of instructions
            //stuck into the destination job's do_list
            if (do_items == null){
                do_items = notify_item
            }
            else if (Instruction.is_instruction_array(do_items)){
                if(notify_item){
                    do_items = [do_items,  notify_item]
                }
            }
            else if (Instruction.is_instructions_array(do_items)){
                if(notify_item){
                    do_items = do_items.slice(0).push(notify_item)
                }
            }
            else { //typically a function.
                if(notify_item){
                    do_items = [do_items,  notify_item]
                }
            }
        }
        // next, bundle do_items into a sent_from_job instruction and stick it on the to_job
        let sfj_ins = new Instruction.Control.sent_from_job({do_list_item: do_items,
                                                     from_job_name: from_job_instance.name,
                                                     from_instruction_id: from_job_instance.program_counter,
                                                     where_to_insert: params.where_to_insert, //just for debugging
                                                     wait_until_done: params.wait_until_done //just for debugging
                                                    })
        Job.insert_instruction(sfj_ins, params.where_to_insert) //must do before starting or unsuspending
        if (to_job_instance.status_code == "not_started"){
            if(params.start){
                to_job_instance.start() //{initial_instruction: sfj_ins} //commented out because its redunant with insert_instruction and would put sfj_ins on to_job twice

            }
        }
        if (to_job_instance.status_code == "suspended"){
            if(params.unsuspend){
                to_job_instance.unsuspend()
                //this.set_up_next_do(1) //don't do this because unsuspend does it.
            }
        }
        //don't do this as to_job should already be running.
        //else{
        //    to_job_instance.set_up_next_do(1)
        //}
    }
}

Instruction.Control.send_to_job.param_names = ["do_list_item",    "where_to_insert",
                                               "wait_until_done", "start",
                                               "unsuspend",       "status_variable_name",
                                               "from_job_name",   "from_instruction_id",
                                                "already_sent_instruction"]

//user's never create this directly, but an instance of this is created by destination_do_send_to_job
//and stuck on the to_job do_list.
Instruction.Control.destination_send_to_job_is_done = class destination_send_to_job_is_done extends Instruction.Control{
    constructor (params){
        super()
        this.params = params
    }
    do_item(job_instance){ //job_instance is the "to" job
        var from_job_instance = Job[this.params.from_job_name]
        for (var user_var of Object.getOwnPropertyNames(this.params)){ //we can have multiple user_data vars that we set. The vars arae set in the sending job
            if(Instruction.Control.send_to_job.param_names.indexOf(user_var) == -1){ //if its not one of the regular paranms. that means its the name of a user_data var to set in the from_job_instance
                var fn = this.params[user_var]
                if (typeof(fn) == "function"){
                    var val = fn.call(job_instance)
                    from_job_instance.user_data[user_var] = val  //this.params is really the to_job_instance.
                }
                else {
                    job_instance.stop_for_reason("errored", "In job: " + job_instance.name +
                        " Instruction.Control.destination_send_to_job_is_done.do_item got user var: " + user_var +
                        " whose value: " + fn + " is not a function.")
                    return
                }
            }
        }
        from_job_instance.send_to_job_receive_done(this.params)
        job_instance.set_up_next_do(1)
    }
}

//an instance of this instr is stuck on the to_job by instr send_to_job
Instruction.Control.sent_from_job = class sent_from_job extends Instruction.Control{
    constructor ({do_list_item       = null, //can be null, a single instruction, or an array of instructions
                 from_job_name       = "required",
                 from_instruction_id = "required",
                 where_to_insert     = "next_top_level", //just for debugging
                 wait_until_done     = null //just for debugging
                } = {}) {
        super()
        let params = arguments[0]
        if (!params.where_to_insert) { //the defaults listed above don't actually work
            params.where_to_insert = "next_top_level"
        }
        copy_missing_fields(params, this)
    }

    do_item (job_instance){
        if (Instruction.is_instruction_array(this.do_list_item) ||
            !Array.isArray(this.do_list_item)){
            job_instance.insert_single_instruction(this.do_list_item)
            job_instance.added_items_count[job_instance.program_counter] += 1
        }
        else { //we've got more than 1 instr to insert.
            job_instance.insert_instructions(this.do_list_item)
            job_instance.added_items_count[job_instance.program_counter] += this.do_list_item.length
        }
        job_instance.set_up_next_do(1)
    }
}

Instruction.Control.start_job = class start_job extends Instruction.Control{
    constructor (job_name, start_options={}, if_started="ignore") {
        if(!["ignore", "error", "restart"].includes(if_started)){
            dde_error("Robot.start_job has invalid value for if_started of: " +
                       if_started +
                       '<br/>Valid values are: "ignore", "error", "restart"')
        }
        super()
        if (job_name instanceof Job) { job_name = job_name.name }
        this.job_name      = job_name
        this.start_options = start_options
        this.if_started    = if_started
    }
    do_item (job_instance){
        const new_job = Job[this.job_name]
        if (new_job){
            const stat = new_job.status_code
            if      (stat == "starting")    { job_instance.set_up_next_do(1) } //just let continue starting
            else if (stat == "suspended")   {
                new_job.unsuspend()
                job_instance.set_up_next_do(1)
            }
            else if (["running", "waiting"].includes(stat)){
               if     (this.if_started == "ignore") {job_instance.set_up_next_do(1)}
               else if(this.if_started == "error") {
                   job_instance.stop_for_reason("errored",
                        "Robot_start_job tried to start job: " + this.job_name +
                        " but it was already started.")
                   job_instance.set_up_next_do(0)
                   return
               }
               else if (this.if_started == "restart"){
                   new_job.stop_for_reason("interrupted",
                      "interrupted by start_job instruction in " + job_instance.name)
                   setTimeout(function(){ new_job.start(this.start_options)   },
                              new_job.inter_do_item_dur * 2)
                   job_instance.set_up_next_do(1)
               }
               else { //if_started is tested for validity in the constructor, but just in case...
                   shouldnt("Job." + job_instance.name +
                     " has a Robot.start_job instruction with an invalid " +
                     "<br/> if_started value of: " + this.if_started)
               }
            }
            else if (["not_started", "completed", "errored", "interrupted"].includes(stat)) {
               new_job.start(this.start_options)
                job_instance.set_up_next_do(1)
            }
            else {
                shouldnt("Robot.start_job got a status_code from Job." +
                          new_job.name + " that it doesn't understand.")
            }
        }
        else { job_instance.stop_for_reason("errored", "Robot.start_job attempted to start non-existent Job." + this.job_name) }
    }
    toString(){
        return "start_job: " + this.job_name
    }
    to_source_code(args){
        return args.indent + "Robot.start_job(" +
            to_source_code({value: this.job_name})  +
            (similar(this.start_options, {}) ? "" : (", " + to_source_code({value: this.start_options}))) +
            ((this.if_started == "ignore")   ? "" : (", " + to_source_code({value: this.if_started}))) +
            ")"
    }
}

Instruction.Control.stop_job = class stop_job extends Instruction.Control{
    constructor (instruction_location="program_counter", stop_reason=null, perform_when_stopped=false) {
        super()
        this.instruction_location = instruction_location
        this.stop_reason = stop_reason
        this.perform_when_stopped = perform_when_stopped
    }
    do_item (job_instance){
        var job_to_stop = Job.instruction_location_to_job(this.instruction_location, false)
        //job_to_stop might or might not be the same as job_instance
        if (!job_to_stop) { job_to_stop = job_instance }
        job_to_stop.ending_program_counter = this.instruction_location
        if (!this.stop_reason){
            this.stop_reason = "Stopped by Job." + job_instance.name + " instruction: Robot.stop_job."
        }
        job_to_stop.stop_for_reason("completed", this.stop_reason, this.perform_when_stopped)
          //this is not an error or interrupted, its a normal stoppage of the job.
        job_instance.set_up_next_do()
    }
    toString(){
        var job_to_stop = Job.instruction_location_to_job(this.instruction_location, false)
        if (!job_to_stop) { job_to_stop = " containing this instruction" }
        else              { job_to_stop = ": Job." + job_to_stop.name }
        return "stop_job" + job_to_stop + " because: " + this.stop_reason
    }
    to_source_code(args = {}){
        let indent = ((args && args.indent) ? args.indent : "")
        let props_args = args        = jQuery.extend({}, arguments[0])
        props_args.indent = ""
        props_args.value = this.instruction_location
        let loc_src = to_source_code(props_args)
        props_args.value = this.stop_reason
        let sr_src = to_source_code(props_args)
        props_args.value = this.perform_when_stopped
        let pws_src = to_source_code(props_args)
        let result = indent +
                     "Robot.stop_job(" +
                     loc_src + ", " +
                     sr_src          + ", " +
                     pws_src +
                     ")"
        return result
    }
}

Instruction.Control.suspend = class suspend extends Instruction.Control{
    constructor (job_name = null, reason = "") {
        super()
        if (job_name instanceof Job) { job_name = job_name.name }
        this.job_name = job_name
        this.reason   = reason
    }
    do_item (job_instance){
        let job_to_suspend = this.job_name
        if (!job_to_suspend) { job_to_suspend = job_instance }
        else if (typeof(job_to_suspend) == "string") { job_to_suspend = Job[job_to_suspend] }
        if (!job_to_suspend instanceof Job) {
           job_instance.stop_for_reason("error", "suspend attempted to suspend job: " + job_to_suspend + " but that isn't a job.")
           job_instance.set_up_next_do(1)
           return
        }
        else {
            job_to_suspend.wait_reason = this.reason //must be before set_status_code or it won't happen
            job_to_suspend.set_status_code("suspended")
            if (job_to_suspend !== job_instance) { job_instance.set_up_next_do(1) }
        }
    }
    to_source_code(args){
        return args.indent + "Robot.suspend(" +
            to_source_code({value: this.job_name}) +
            ((this.reason == "") ? "" : (", " + to_source_code({value: this.reason})))  +
            ")"
    }
}

Instruction.Control.unsuspend = class unsuspend extends Instruction.Control{
    constructor (job_name = "required") {
        super()
        if(job_name == "required"){
            dde_error("unsuspend not given a job name to uuspend. A job cannot unsuspend itself.")
        }
        if (job_name instanceof Job) { job_name = job_name.name }
        this.job_name = job_name
    }
    do_item (job_instance){
        let job_to_unsuspend = this.job_name
        if (typeof(job_to_unsuspend) == "string") { job_to_unsuspend = Job[job_to_unsuspend] }
        if (!(job_to_unsuspend instanceof Job))      {
            job_instance.stop_for_reason("errored", "unsuspend attempted to unsuspend job: " + this.job_name + " but that isn't a job.")
        }
        else if (job_to_unsuspend == job_instance) { shouldnt("unsuspend instruction attempting to unsuspend itself.: " + this.job_name) }
        else if (job_to_unsuspend.status_code == "suspended"){
            job_to_unsuspend.unsuspend()
        }
        else {} //if job_to_unsuspend is not suspended, do nothing
        job_instance.set_up_next_do(1)

    }
    to_source_code(args){
        return args.indent + "Robot.unsuspend(" +
            to_source_code({value: this.job_name}) +
            ")"
    }
}

Instruction.Control.sync_point = class sync_point extends Instruction.Control{
        //permit an empty array for job_names. We might be getting such an array from some computation
        //that legitimately has no items. Allow it. Then when this instruction's do_item is called,
        //it will always be in_sync and proceed. Empty job_names also useful for send_to_job
        //where_to_insert labels.
        //also job_names may or may not contain the name of the current job. It doesn't matter.
        constructor (name, job_names=[]) {
            super()
            if (!name){
                dde_error("Instruction sync_point has not been passed a name.")
            }
            this.name = name
            this.job_names = job_names
            this.inserted_empty_instruction_queue = false
        }
    /*The  below started from my old arch (pre aug 2016) in which when a sync point was encoutered,
      and its other jobs hadn't reach their sync points yet, this job simly didn't have
      its set_up_next_do called so it just was frozen.
      Then the last job of the sync job group, got to here, it could "unfreeze" all the
      other jobs. The great thing about this arch is that the 'frozen jobs' took up zreo compute time.
      BUT when we want to move to the new arch of allowing job_a to wait for job_b but NOT have
       job_b wait for job_a, this is no longer any good, because we would start out with Job_a
       waiting for job_b. Then Job b comes along and jsut breezes though its sync point
       since it doesn't wait for any job, and now job_a is hanging with no one to start it up again,
       even though the sync point it was waiting for in job b had been achieved.
       So job_a has to call set_up_next_do(0) while its waiting, just to see
       if job_b has made it through its sync point. This is slower but will work,
       however that means we have to get rid of the code wherein the last
       job to reach its sync point unfreezes all the other jobs because we
       really don't want to have a job get set_up_next_do called twice when
       it is unfrozen. So in the new implementaiton (after this comment)
       each job unfreezes itself. Slower, but gives us the
       increased funtionality of the one_sided dependency with no extra args to sync_point.
       If the slowdown becomes important we could re-implement the old sync point,
       and have a different instruction to do the one_sides algorithm which is slower.

    do_item (job_instance){
        for(let job_name of this.job_names){
            if (job_name != job_instance.name){ //ignore self
                var j_inst = Job[job_name]
                if(!j_inst){
                    job_instance.stop_for_reason("errored",
                                                 "Job." + job_instance.name +
                                                 " has a sync_point instruction that has a job-to-sync-with named: " + job_name +
                                                 " which is not defined.")
                    return;
                }
                // j_inst might have stopped, and perhaps completed fine so don't halt syn_point
                //   just because a job is stopped.
                // else if (j_inst.stop_reason){
                //    job_instance.stop_for_reason("errored", "sync_point has a job-to-sync-with named: Job." + job_name +
                //                                 " that has already stopped.")
                //    return;
                //}
                else if (j_inst.program_counter < 0) {//j_inst hasn't started yet. That's ok, it just hasn't reached the sync point.
                        job_instance.wait_reason = "for Job." + j_inst.name + " to get to sync_point named: " + this.name + " but that Job hasn't started yet.."
                        //job_instance.status_code = "waiting" //don't change this from "not_started"
                        return
                }
                else {
                    var cur_instruction = j_inst.do_list[j_inst.program_counter]
                    if (j_inst.at_or_past_sync_point(this.name)){ continue; } //good. j_inst is at the sync point.
                          //beware that j_inst *could* be at a sync point of a different name, and if so,
                          //let's hope there's a 3rd job that it will sync with to get it passed that sync point.
                    else { //j_inst didn't get to sync point yet
                        job_instance.wait_reason = "for Job." + j_inst.name + " to get to sync_point named: " + this.name
                        job_instance.status_code = "waiting"
                        return; //we have not acheived sync, so just pause job_instance, in hopes
                                //that another job will be the last job to reach sync and force job_instance
                                //to proceed.
                    }
                }
            }
        }
        //made it through all job_names, so everybody's in sync
        for(let job_name of this.job_names){
            let j_inst = Job[job_name]
            let cur_ins = j_inst.current_instruction()
            if ((cur_ins instanceof Instruction.Control.sync_point) &&
                (cur_ins.name == this.name) &&
                (j_inst.status_code == "waiting")){ //beware that j_inst *might* already be past the
                //sync point, or even stopped from completion, so above makes sure its merely AT the sync point, thus we can
                //get it going again (but not attempt to do that if its already past the sync point).
                j_inst.wait_reason = null
                j_inst.status_code = "running"
                j_inst.set_up_next_do(1)
            }
        }
        //note that the above does NOT process job_instance because job_instance.status_code
        //will be "running". If we get this far, job_instance will be the last
        //sync_point job to reach its sync_point, and it will still be running,
        //so just tell it to keep going with the below call to set_up.
        //We put the below code AFTER the above loop so that the other jobs
        //that reached their sync point first will be allowed to go ahead before job_instance.
        job_instance.set_up_next_do(1)
    }
    */
    do_item (job_instance){
        if ((job_instance.robot instanceof Dexter) &&
            (this.inserted_empty_instruction_queue == false) &&
            (this.job_names.length > 0) &&
            ((this.job_names.length > 1)  || //must contain a job other than itself
            (this.job_names[0] != job_instance.name))){ //the one job name its got is not job_instance so we've got to flush the instruction_queue
            let instruction_array = Dexter.empty_instruction_queue()
            job_instance.do_list.splice(job_instance.program_counter, 0, instruction_array);
            this.inserted_empty_instruction_queue = true
            job_instance.set_up_next_do(0) //go an do this empty_instruction_queue instruction, and when it finnaly returns, to the sync_point proper
        }
        else {
            for(let job_name of this.job_names){
                if (job_name != job_instance.name){ //ignore self
                    var j_inst = Job[job_name]
                    if(!j_inst){
                        job_instance.stop_for_reason("errored",
                            "Job." + job_instance.name +
                            " has a sync_point instruction that has a job-to-sync-with named: " + job_name +
                            " which is not defined.")
                        return;
                    }
                    else if(!j_inst.is_active()) { //perhaps not_started, perhaps done (but might be restarted).
                        job_instance.wait_reason = "Job." + j_inst.name + " to get to sync_point named: " + this.name +
                                                   "\nbut that Job has status: " + j_inst.status_code
                        job_instance.set_status_code("waiting")
                        job_instance.set_up_next_do(0)
                        return
                    }
                    else {
                        if (j_inst.at_or_past_sync_point(this.name)){ continue; } //good. j_inst is at the sync point.
                        //beware that j_inst *could* be at a sync point of a different name, and if so,
                        //let's hope there's a 3rd job that it will sync with to get it passed that sync point.
                        else { //j_inst didn't get to sync point yet
                            job_instance.wait_reason = "Job." + j_inst.name + " to get to sync_point named: " + this.name
                            job_instance.set_status_code("waiting")
                            job_instance.set_up_next_do(0)
                            return; //we have not acheived sync, so just pause job_instance, in hopes
                                    //that another job will be the last job to reach sync and cause job_instance
                                    //to proceed.
                        }
                    }
                }
            }
            //made it through all job_names, so everybody's in sync, but each job has to unfreeze itself.
            job_instance.set_status_code("running")
            job_instance.set_up_next_do(1)
        }
    }
    to_source_code(args){
        return args.indent + "Robot.sync_point("   +
            to_source_code({value: this.name})     + ", " +
            to_source_code({value: this.job_names}) +
            ")"
    }
}

Instruction.Control.wait_until = class wait_until extends Instruction.Control{
    constructor (fn_date_dur) {
        super()
        this.fn_date_dur = fn_date_dur
        if (typeof(this.fn_date_dur) == "function"){}
        else if (this.fn_date_dur instanceof Date) {}
        else if (typeof(fn_date_dur) == "number")  {}
        else if (fn_date_dur instanceof Duration)  { fn_date_dur = this.seconds() }
        else if (this.fn_date_dur == "new_instruction"){}
        else if (Array.isArray(this.fn_date_dur) ||
                 (typeof(this.fn_date_dur) == "object")){
                 if(!Job.instruction_location_to_job(this.fn_date_dur, false)){
                     warning("Robot.wait_until passed an array or literal object<br/>" +
                             "for an instruction location but<br/>" +
                             "it does not contain a job.<br/>" +
                             "That implies this job will wait for itself, and thus forever.<br/>" +
                             "However, unusual circumstances could make this ok.")
                 }
        }
        else {
            dde_error("Robot.wait_until instruction passed: " + this.fn_date_dur +
                      '<br/> which is not a number, date, function,<br/>' +
                      '"new_instruction" or instruction location array.')
        }
        this.start_time = null
    }
    do_item (job_instance){
        if (typeof(this.fn_date_dur) == "function"){
            if (this.fn_date_dur.call(job_instance)) {
                //console.log("wait_until fn returned true")
                job_instance.wait_reason = null
                job_instance.set_status_code("running")
                job_instance.set_up_next_do(1) //advance the PC
            }
            else {
                job_instance.wait_reason = "a wait_until function returns true"
                job_instance.set_status_code("waiting")
                job_instance.set_up_next_do(0) //loop until its true
            }
        }
        else if (this.fn_date_dur instanceof Date){
            if(Date.now() >= this.fn_date_dur){
                job_instance.wait_reason = null
                job_instance.set_status_code("running")
                job_instance.set_up_next_do(1)
            }
            else {
                job_instance.wait_reason = "until Date: " +  this.fn_date_dur
                job_instance.set_status_code("waiting")
                job_instance.set_up_next_do(0)
            }
        }
        else if (typeof(this.fn_date_dur) == "number"){ //number is seconds
            if (this.start_time == null) { this.start_time = Date.now() } //hits the first time this do_item is called for an inst
            var dur_from_start = Date.now() - this.start_time
            if (dur_from_start >= this.fn_date_dur * 1000){ //dur_from_start is in ms, fn_date_dur is in seconds
                job_instance.wait_reason = null
                job_instance.set_status_code("running")
                this.start_time = null //essential for the 2nd thru nth call to start() for this job.
                job_instance.set_up_next_do(1)
            }
            else if ((job_instance.robot instanceof Dexter) && (dur_from_start > 1000)){
                //so that we can keep the tcp connection alive, send a virtual heartbeat
                let new_instructions = [make_ins("g"), //just a do nothing to get a round trip to Dexter.
                                       Robot.wait_until(this.fn_date_dur - 1)] //create new wait_until to wait for the remaining time
                job_instance.insert_instructions(new_instructions)
                job_instance.added_items_count[job_instance.program_counter] += 2
                this.start_time = null //essential for the 2nd thru nth call to start() for this job.
                job_instance.wait_reason = null
                job_instance.set_status_code("running")
                job_instance.set_up_next_do(1)
            }
            else {
                job_instance.wait_reason = "until Duration: " +  this.fn_date_dur + " seconds"
                job_instance.set_status_code("waiting")
                job_instance.set_up_next_do(0)
            }
        }
        else if (this.fn_date_dur == "new_instruction"){
            const pc               = job_instance.program_counter
            const pc_on_last_instr = (pc == (job_instance.do_list.length - 1))
            const next_instruction = (pc_on_last_instr ?
                                       null : job_instance.do_list[pc + 1])
            if (this.old_instruction === undefined){ //first time through only
                this.old_instruction = next_instruction
                job_instance.wait_reason = 'until "new_instruction"'
                job_instance.set_status_code("waiting")
                job_instance.set_up_next_do(0)
            }
            else if (this.old_instruction === null){ //started with this instr as the last one
                if (pc_on_last_instr) { job_instance.set_up_next_do(0) }
                else                  {
                   job_instance.set_up_next_do(1)
                } //got a new last instr
            }
            else if (next_instruction == this.old_instruction){//no change so don't advance the pos
                job_instance.set_up_next_do(0)
            }
            else { //got a new instruction since this instruction started running so execute it
                job_instance.wait_reason = null
                job_instance.set_status_code("running")
                job_instance.set_up_next_do(1)
            }
        }
        else if (Array.isArray(this.fn_date_dur) ||
                 (typeof(this.fn_date_dur) == "object")){ //instruction_location, but not integer and string formats
            var loc_job_instance = Job.instruction_location_to_job(this.fn_date_dur, false)
            if (!loc_job_instance) {
                loc_job_instance = job_instance
            }
            var loc_pc = loc_job_instance.instruction_location_to_id(this.fn_date_dur)
            if(loc_pc > loc_job_instance.program_counter){ //wait until loc_job_instance advances
                if(loc_job_instance.stop_reason){
                    warning("Robot.wait_until is waiting for job: " + loc_job_instance.name +
                            "<br/>but that job is stopped, so it will probably wait forever.")
                }
                job_instance.wait_reason = "until instruction_location reached"
                job_instance.set_status_code("waiting")
                job_instance.set_up_next_do(0)
            }
            else { //done waiting, loc_job_instance already at or passe loc_ps
                job_instance.wait_reason = null
                job_instance.set_status_code("running")
                job_instance.set_up_next_do(1)
            }
        }
        else { //this is checked in the constructor, but just in case ...
            shouldnt("In job: " + job_instance.name +
                      ' in wait_until("new_instruction")<br/>' +
                      " got fn_date_dur of: " + this.fn_date_dur +
                      " which is invalid.<br/>" +
                      ' It should be a function, a date, a number, or "new_instruction".')
        }
    }
    to_source_code(args){
        return args.indent + "Robot.wait_until("       +
            to_source_code({value: this.fn_date_dur, function_names: true})  +
            ")"
    }
}

Instruction.Control.move_all_joints = class move_all_joints extends Instruction.Control{
    constructor (array_of_5_angles) {
        super()
        this.array_of_5_angles = array_of_5_angles //keep for orig 5 angles so to_source_code can use them. May contain nulls
    }
    do_item (job_instance){
        let angles = this.array_of_5_angles.slice(0)
        for (var i = 0; i < 5; i++){
            if (angles[i] == null){
                angles[i] = job_instance.robot.angles[i] //this.robot_status[Dexter.ds_j0_angle_index + i] //ie don't change angle
            }
        }
        let error_mess = Dexter.joints_out_of_range(angles)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nin Robot.move_all_joints([" + angles + "])")
            job_instance.set_up_next_do(0)
        }
        else  {
            job_instance.robot.angles = angles
            job_instance.insert_single_instruction(make_ins("a", ...angles))
            job_instance.added_items_count[job_instance.program_counter] += 1
            job_instance.set_up_next_do(1)
        }
    }
    toString(){
        return "{instanceof: move_all_joints " + this.array_of_5_angles + "}"
    }
    to_source_code(args){
        args = jQuery.extend({}, args)
        args.value = this.array_of_5_angles
        args.indent = ""
        return args.indent + "Dexter.move_all_joints(" + to_source_code(args) + ")"
    }
}

Instruction.Control.pid_move_all_joints = class pid_move_all_joints extends Instruction.Control{
    constructor (array_of_5_angles) {
        super()
        this.array_of_5_angles = array_of_5_angles //keep for orig 5 angles so to_source_code can use them. May contain nulls
    }
    do_item (job_instance){
        let angles = this.array_of_5_angles.slice(0)
        for (var i = 0; i < 5; i++){
            if (angles[i] == null){
                angles[i] = job_instance.robot.angles[i] //this.robot_status[Dexter.ds_j0_angle_index + i] //ie don't change angle
            }
        }
        let error_mess = Dexter.joints_out_of_range(angles)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nin Robot.pid_move_all_joints([" + angles + "])")
            job_instance.set_up_next_do(0)
        }
        else  {
            job_instance.robot.angles = angles
            job_instance.insert_single_instruction(make_ins("P", ...angles))
            job_instance.added_items_count[job_instance.program_counter] += 1
            job_instance.set_up_next_do(1)
        }
    }
    toString(){
        return "{instanceof: pid_move_all_joints " + this.array_of_5_angles + "}"
    }
    to_source_code(args){
        args        = jQuery.extend({}, args)
        args.value  = this.array_of_5_angles
        args.indent = ""
        return args.indent + "Dexter.pid_move_all_joints(" + to_source_code(args) + ")"
    }
}

Instruction.Control.move_all_joints_relative = class move_all_joints_relative extends Instruction.Control{
    constructor (delta_angles) {
        super()
        this.delta_angles = delta_angles //keep for orig 5 angles so to_source_code can use them. May contain nulls
    }
    do_item (job_instance){
        const abs_angles = []
        for(var i = 0; i < 5; i++){
            abs_angles.push(job_instance.robot.angles[i] + this.delta_angles[i])
        }
        //Job.insert_instruction(Dexter.move_all_joints(abs_angles), {job: job_instance, offset: "after_program_counter"})
        job_instance.insert_single_instruction(Dexter.move_all_joints(abs_angles))
        job_instance.added_items_count[job_instance.program_counter] += 1
        job_instance.set_up_next_do(1)
    }
    toString(){
        return "{instanceof: move_all_joints_relative " + this.delta_angles + "}"
    }
    to_source_code(args){
        args        = jQuery.extend({}, args)
        args.value  = this.delta_angles
        args.indent = ""
        return args.indent + "Dexter.move_all_joints_relative(" + to_source_code(args) + ")"
    }
}

Instruction.Control.move_to = class move_to extends Instruction.Control{
    constructor (xyz           = [],
                 J5_direction  = [0, 0, -1],
                 config        = Dexter.RIGHT_UP_OUT){
        super()
        this.xyz = xyz
        this.J5_direction = J5_direction
        this.config = config
       }
    do_item (job_instance){
        let xyz          = this.xyz
        let J5_direction = this.J5_direction
        let config       = this.config
        if(Dexter.is_position(this.xyz)){
            xyz          = this.xyz[0]
            J5_direction = this.xyz[1]
            config       = this.xyz[2]
        }
        let [existing_xyz, existing_direction, existing_config] = Kin.J_angles_to_xyz(job_instance.robot.angles, job_instance.robot.pose) //just to get defaults.
        if(J5_direction === null) { J5_direction = existing_direction }
        if(config       === null) { config       = existing_config }
        if(Array.isArray(J5_direction) &&
            (J5_direction.length == 2) &&
            (Math.abs(J5_direction[0]) == 90) &&
            (Math.abs(J5_direction[1]) == 90)){
            job_instance.stop_for_reason("errored",
                "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nDexter.move_to([" + xyz + "], [" + J5_direction + "])\n" +
                "was passed an invalid J5_direction." +
                "\n[90, 90], [-90, 90], [90, -90] and [-90, -90]\n are all invalid.")
        }
        if (similar(xyz, Dexter.HOME_POSITION[0])) {
            //Job.insert_instruction(make_ins("a", ...Dexter.HOME_ANGLES), {job: job_instance, offset: "after_program_counter"})
            job_instance.insert_single_instruction(make_ins("a", ...Dexter.HOME_ANGLES))
            job_instance.added_items_count[job_instance.program_counter] += 1
            job_instance.set_up_next_do(1)
            return
        }
        let xyz_copy = xyz.slice(0)
        for(let i = 0; i < 3; i++){
            if (xyz_copy.length <= i)     { xyz_copy.push(existing_xyz[i]) }
            else if (xyz_copy[i] == null) { xyz_copy[i] = existing_xyz[i]  }
        }
        let angles
        try {
            angles = Kin.xyz_to_J_angles(xyz_copy, J5_direction, config, job_instance.robot.pose)

        }
        catch(err){
            job_instance.stop_for_reason("errored",
                "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nDexter.move_to([" + xyz + "], [" + J5_direction + "])" +
                "\nwas passed invalid xyz.\n " +
                err.message)
            job_instance.set_up_next_do(0)
            return
        }
        let error_mess = Dexter.joints_out_of_range(angles)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nin Dexter.move_to([" + xyz + "])" +
                "\nout of range xyz.")
            job_instance.set_up_next_do(0)
        }
        else {
            job_instance.robot.angles       = angles
            //Job.insert_instruction(make_ins("a", ...angles), {job: job_instance, offset: "after_program_counter"})
            job_instance.insert_single_instruction(make_ins("a", ...angles))
            job_instance.added_items_count[job_instance.program_counter] += 1
            job_instance.set_up_next_do(1)
        }
    }

    toString(){ return "{instanceof: move_to " + this.xyz + "}" }

    to_source_code(args){
        args        = jQuery.extend({}, args)
        args.indent = ""

        args.value  = this.xyz
        let xyx_src = to_source_code(args)

        args.value  = this.J5_direction
        let J5_direction_src = to_source_code(args)

        args.value  = this.config
        let config_src = to_source_code(args)

        return args.indent + "Dexter.move_to(" +
            xyx_src          + ", " +
            J5_direction_src + ", " +
            config_src       +
            ")"
    }
}

Instruction.Control.pid_move_to = class pid_move_to extends Instruction.Control{
    constructor (xyz           = [],
                 J5_direction  = [0, 0, -1],
                 config        = Dexter.RIGHT_UP_OUT){
        super()
        this.xyz = xyz
        this.J5_direction = J5_direction
        this.config = config
    }
    do_item (job_instance){
        let xyz          = this.xyz
        let J5_direction = this.J5_direction
        let config       = this.config
        if(Dexter.is_position(this.xyz)){
            xyz          = this.xyz[0]
            J5_direction = this.xyz[1]
            config       = this.xyz[2]
        }
        let [existing_xyz, existing_direction, existing_config] = Kin.J_angles_to_xyz(job_instance.robot.angles, job_instance.robot.pose) //just to get defaults.
        if(J5_direction === null) { J5_direction = existing_direction }
        if(config       === null) { config       = existing_config }
        if(Array.isArray(J5_direction) &&
            (J5_direction.length == 2) &&
            (Math.abs(J5_direction[0]) == 90) &&
            (Math.abs(J5_direction[1]) == 90)){
            job_instance.stop_for_reason("errored",
                "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nDexter.pid_move_to([" + xyz + "], [" + J5_direction + "])\n" +
                "was passed an invalid J5_direction." +
                "\n[90, 90], [-90, 90], [90, -90] and [-90, -90]\n are all invalid.")
        }
        if (similar(xyz, Dexter.HOME_POSITION[0])) {
            //Job.insert_instruction(make_ins("P", ...Dexter.HOME_ANGLES), {job: job_instance, offset: "after_program_counter"})
            job_instance.insert_single_instruction(make_ins("P", ...Dexter.HOME_ANGLES))
            job_instance.added_items_count[job_instance.program_counter] += 1
            job_instance.set_up_next_do(1)
            return
        }
        let xyz_copy = xyz.slice(0)
        for(let i = 0; i < 3; i++){
            if (xyz_copy.length <= i)     { xyz_copy.push(existing_xyz[i]) }
            else if (xyz_copy[i] == null) { xyz_copy[i] = existing_xyz[i]  }
        }
        let angles
        try {
            angles = Kin.xyz_to_J_angles(xyz_copy, J5_direction, config, job_instance.robot.pose)

        }
        catch(err){
            job_instance.stop_for_reason("errored",
                "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nDexter.pid_move_to([" + xyz + "], [" + J5_direction + "])" +
                "\nwas passed invalid xyz.\n " +
                err.message)
            job_instance.set_up_next_do(0)
            return
        }
        let error_mess = Dexter.joints_out_of_range(angles)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nin Dexter.pid_move_to([" + xyz + "])")
            job_instance.set_up_next_do(0)
        }
        else{
            job_instance.robot.angles       = angles
            //Job.insert_instruction(make_ins("P", ...angles), {job: job_instance, offset: "after_program_counter"})
            job_instance.insert_single_instruction(make_ins("P", ...angles))
            job_instance.added_items_count[job_instance.program_counter] += 1
            job_instance.set_up_next_do(1)
        }
    }

    toString(){ return "{instanceof: pid_move_to " + this.xyz + "}" }

    to_source_code(args){
        args        = jQuery.extend({}, args)
        args.indent = ""

        args.value  = this.xyz
        let xyx_src = to_source_code(args)

        args.value  = this.J5_direction
        let J5_direction_src = to_source_code(args)

        args.value  = this.config
        let config_src = to_source_code(args)

        return args.indent + "Dexter.pid_move_to(" +
            xyx_src          + ", " +
            J5_direction_src + ", " +
            config_src       +
            ")"
    }
}
Instruction.Control.move_to_relative = class move_to_relative extends Instruction.Control{
    constructor (delta_xyz = [0, 0, 0]){
        super()
        if (delta_xyz.length == 1) {
            delta_xyz.push(0)
            delta_xyz.push(0)
        }
        else if (delta_xyz.length == 2) {  delta_xyz.push(0) }
        this.delta_xyz = delta_xyz
    }
    do_item(job_instance){
        let [old_xyz, J5_direction, config] = Kin.J_angles_to_xyz(job_instance.robot.angles, job_instance.robot.pose)
        let new_xyz = Vector.add(old_xyz, this.delta_xyz) //makes a new array
        let angles
        try {
            angles = Kin.xyz_to_J_angles(new_xyz, J5_direction, config, job_instance.robot.pose)
        }
        catch(err){
            job_instance.stop_for_reason("errored",
                "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nDexter.move_to_relative([" + this.delta_xyz + "])" +
                "\ncalled with out of range delta_xyz\n" +
                err.message)
            job_instance.set_up_next_do(0)
            return
        }
        let error_mess = Dexter.joints_out_of_range(angles)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nin Dexter.move_to_relative([" + this.delta_xyz + "])")
            job_instance.set_up_next_do(0)
        }
        else{
            this.robot.angles = angles
            //return make_ins("a", ...angles) // Dexter.move_all_joints(angles)
            job_instance.insert_single_instruction(make_ins("a", ...angles))
            job_instance.added_items_count[job_instance.program_counter] += 1
            job_instance.set_up_next_do(1)
        }
    }
    toString(){
        return "{instanceof: move_to_relative " + this.delta_xyz + "}"
    }
    to_source_code(args){
        let prop_args        = jQuery.extend({}, args)
        prop_args.indent     = ""
        prop_args.value      = this.delta_xyz
        return args.indent + "Dexter.move_to_relative(" + to_source_code(prop_args) + ")"
    }
}

Instruction.Control.move_to_straight = class move_to_straight extends Instruction.Control{
    constructor (xyz           = [],
                 J5_direction  = [0, 0, -1],
                 config        = Dexter.RIGHT_UP_OUT,
                 tool_speed    = 5*_mm / _s,
                 resolution    = 0.5*_mm) {
        super()
        this.xyz = xyz
        this.J5_direction = J5_direction
        this.config = config
        this.tool_speed = tool_speed
        this.resolution = resolution
    }
    do_item (job_instance){
        let [old_xyz, old_J5_direction, old_config] = Kin.J_angles_to_xyz(job_instance.robot.angles,
            job_instance.robot.pose)
        try {
            let instrs = this.move_to_straight_aux(old_xyz,
                this.xyz,
                this.J5_direction, this.config,
                this.tool_speed,
                this.resolution,
                job_instance.robot.pose)
            //Job.insert_instruction(instrs, {job: job_instance, offset: "after_program_counter"})
            job_instance.insert_instructions(instrs)
            job_instance.added_items_count[job_instance.program_counter] += instrs.length
            job_instance.set_up_next_do(1)
        }
        catch(err){
            job_instance.stop_for_reason("errored",
            "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
            "Dexter.move_to_straight([" + this.xyz + "])\n" +
            "passed invalid xyz.\n" +
            err.message)
        }
    }
    move_to_straight_aux (xyz_1, xyz_2, J5_direction, config, tool_speed = 5*_mm / _s, resolution = .5*_mm, robot_pose){
        let movCMD = []
        let U1 = xyz_1
        let U2 = xyz_2
        let U21 = Vector.subtract(U2, U1)
        let v21 = Vector.normalize(U21)
        let mag = Vector.magnitude(U21)
        let div = 1
        let step = Infinity
        while(resolution < step){
            div++
            step = mag / div
        }
        let angular_velocity
        let Ui, new_J_angles
        let old_J_angles = Kin.xyz_to_J_angles(U1, J5_direction, config, robot_pose)
        for(let i = 1; i < div+1; i++){
            Ui = Vector.add(U1, Vector.multiply(i*step, v21))
            new_J_angles = Kin.xyz_to_J_angles(Ui, J5_direction, config, robot_pose)
            angular_velocity = Kin.tip_speed_to_angle_speed(old_J_angles, new_J_angles, tool_speed)
            old_J_angles = new_J_angles
            movCMD.push(make_ins("S", "MaxSpeed", angular_velocity))
            movCMD.push(make_ins("S", "StartSpeed", angular_velocity))
            movCMD.push(Dexter.move_to(Ui, J5_direction, config, robot_pose))
        }
        return movCMD
    }
    toString(){
        return "{instanceof: move_to_straignt " + this.xyz + "}"
    }
    to_source_code(args){
        args        = jQuery.extend({}, args)
        args.indent = ""

        args.value  = this.xyz
        let xyx_src = to_source_code(args)

        args.value  = this.J5_direction
        let J5_direction_src = to_source_code(args)

        args.value  = this.config
        let config_src = to_source_code(args)

        args.value  = this.tool_speed
        let tool_speed_src = to_source_code(args)

        args.value  = this.resolution
        let resolution_src = to_source_code(args)

        return args.indent + "Dexter.move_to_straight(" +
            xyx_src          + ", " +
            J5_direction_src + ", " +
            config_src       + ", " +
            tool_speed_src   + ", " +
            resolution_src   +
            ")"
    }
}

