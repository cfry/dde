new TalkMode({name: "move",
    mode_misc_method: "move_mode_misc_action_function"})

TalkMode.move.is_recording
TalkMode.move.instructions_being_recorded
TalkMode.move.recording_name_now_playing
TalkMode.move.step_size //float in meters

TalkMode.move.current_move_command
TalkMode.move.current_move_direction //initially null, then when moving: "down", up, left, right, front, back, reverse, forward
TalkMode.move.last_move_command
TalkMode.move.current_move_joint_number

TalkMode.move.init = function(){
    TalkMode.move.is_recording = false
    TalkMode.move.instructions_being_recorded = []
    TalkMode.move.recording_name_now_playing = null
    TalkMode.move.step_size = 0.005

    TalkMode.move.current_move_command   = null
    TalkMode.move.current_move_direction = null
    TalkMode.move.last_move_command      = null
    TalkMode.move.current_move_joint_number = null //only for joint moves

    TalkMode.move.last_reverse_forward_index = null
    TalkMode.move.forward_limit_index        = null
}

//mode_misc
function move_mode_misc_action_function(aCAT) {
    let job_name = Talk.job_name_prose_to_existing_job_name(aCAT._full_text)
    if(job_name) { //we don't want to get the warning message from run_job about a non-existend job name so catch this here
        Job[job_name].start()
    }
    else {
        globalThis.talk_gpt_action_function(aCAT)
    }
}

new TalkCommand({
    name: "mode misc", //keep this as "mode misc for the "mode misc cmd" of every mode
                       //Talk.handle_command depends on it.
    action_function: move_mode_misc_action_function,
    tooltip: "Run the named Job, or the GPT command."})

//simulate
function talk_simulate_action_function(aCAT){
    if(aCAT._content_str === "") {
        let sim = Robot.get_simulate_actual(Dexter.default.simulate)
        if (globalThis.simulate_radio_true_id.checked) {
            Talk.display_warning("Dexter is already in <b>simulate</b> mode.<br/>" +
                "See the radio buttons in the Misc pane header.")
        } else {
            globalThis.simulate_radio_true_id.checked = true
            DDE_DB.persistent_set("default_dexter_simulate", true)
            let mess = "Dexter is now in <b>simulate</b> mode.<br/>" +
                "The real robot won't move when you run these commands."
            Talk.display_message(mess)
        }
    }
}

new TalkCommand({
    name: "simulate",
    action_function: talk_simulate_action_function,
    tooltip: "Causes robot commands to be simulated."})

//real
function talk_real_action_function(aCAT){
    if(aCAT._content_str === "") {
        let sim = Robot.get_simulate_actual(Dexter.default.simulate)
        if (globalThis.simulate_radio_false_id.checked) {
            Talk.display_warning("Dexter is already in <b>real</b> mode.<br/>" +
                "See the radio buttons in the Misc pane header.")
        } else {
            globalThis.simulate_radio_false_id.checked = true
            DDE_DB.persistent_set("default_dexter_simulate", false)
            let mess = "Dexter is now in <b>real</b> mode.<br/>" +
                "The real robot will move when you run these commands."
            Talk.display_message(mess)
        }
    }
}

new TalkCommand({
    name: "real",
    action_function: talk_real_action_function,
    tooltip: "Causes robot commands to be run on the real robot."})

function talk_both_action_function(content_obj){
    if(content_obj._content_str === "") {
        let sim = Robot.get_simulate_actual(Dexter.default.simulate)
        if (globalThis.simulate_radio_both_id.checked) {
            Talk.display_warning("Dexter is already in <b>both</b> (simulate & real) mode.<br/>" +
                "See the radio buttons in the Misc pane header.")
        } else {
            globalThis.simulate_radio_both_id.checked = true
            DDE_DB.persistent_set("default_dexter_simulate", "both")
            let mess = "Dexter is now in <b>both</b> mode.<br/>" +
                "The simulated and real robot will move when you run these commands."
            Talk.display_message(mess)
        }
    }
}

new TalkCommand({
    name: "both",
    action_function: talk_both_action_function,
    tooltip: "Causes robot commands to be simulated and&#13;run on the real robot."})

//_____define place_______
//expects full_text of "define postion", "define place foo"
function talk_define_place_action_function(aCAT){
    if(aCAT._content_str === ""){
        this.set_params_mode(aCAT)
    }
    else {
        let rob = Talk.job_for_normal_moves.robot
        if (!rob.rs) {
            talk_send_instruction_to_dexter(Dexter.get_robot_status())
            setTimeout(function(){
                                    define_place_with_name(aCAT)
                         },
                        1000)
            //Talk.display_warning("To name a Dexter place, you have to move Dexter first.")
        }
        else {
            return define_place_with_name(aCAT)
        }
    }
}

function define_place_with_name(aCAT, already_sent_get_robot_status = false){
    if((aCAT.job_name === "") || (!aCAT.job_name)){
        Talk.set_params_mode(aCAT, "Enter a job_name.")
    }
    else if (!Talk.job_for_normal_moves.robot.rs)  {
        if(already_sent_get_robot_status){
            Talk.display_warning("define place can't get robot status to get the robot place. Sorry.")
        }
        else {
            talk_send_instruction_to_dexter(Dexter.get_robot_status())
            setTimeout(function () {
                define_place_with_name(aCAT, true)
            }, 200)
        }
    }
    else { //we've got a valid job name and robot status so good to go
        let angles = Dexter.default.rs.measured_angles()
        let instrs = [Dexter.default.move_all_joints(angles),
                             Dexter.default.empty_instruction_queue()
        ]
        new Job({name: aCAT.job_name, do_list: instrs})
        Talk.dialog_dom_elt.focus()
        Talk.display_message("Job." + aCAT.job_name + " has been defined.")
    }
}

new TalkCommand({
    name: "define place",
    alernate_names: ["defined place", "dine place"],
    parameters: [new TalkParameter({
                    name: "job_name",
                    type: new TalkType.JobNameOrNewJobName()})
                 ],
    action_function: talk_define_place_action_function,
    row: "new",
    tooltip: "Assign Dexter's current position to a name."})

//start_recording
function display_start_recording() {
    return !TalkMode.move.is_recording
}

function talk_start_recording_action_function(aCAT){
    if(aCAT._content_str === ""){
        TalkMode.move.is_recording = true
        TalkMode.move.instructions_being_recorded = [] //clear out the previous recording
        Talk.display_all(aCAT, "To record a command, click it or<br/>tap the space-bar briefly and say it.") //needed to change "start_recording" to "stop_recording
    }
}

new TalkCommand({
    name: "start recording",
    action_function: talk_start_recording_action_function,
    should_display: display_start_recording,
    tooltip: "Begin the recording of Dexter move commands into a Job."})

//stop_recording
function display_stop_recording(){
    return TalkMode.move.is_recording
}
function talk_stop_recording_action_function(aCAT) {
    TalkMode.move.is_recording = false //must go before set_mode
    Talk.display_status()
    if (aCAT._content_str === "") {
        Talk.stop_aux() //does not call stop_recording, on purpose.
        //necessary because if we click on stop_recording during a move,.
        // then switch to the param screen to fill in
        //the job_name, we don't want the robot to keep moving
        //as it will just run out of bounds.
        //Also a user seeing "Stop ...." will probably expect the
        //robot to stop, EVEN THOUGH stopping a tape recroder doesn't
        //stop reality!
        let mess = ((TalkMode.move.instructions_being_recorded.length === 0) ?
                           "No commands have been recorded so you might as well cancel this recording." :
                           "Enter a new Job name if you like and click <b<run</b>.")
        Talk.set_params_mode(aCAT, mess)
    }
    else {
        return talk_define_recording(aCAT)
    }
}

function talk_define_recording(aCAT){
    if (TalkMode.move.instructions_being_recorded.length === 0) {
        TalkMode.move.instructions_being_recorded = []
        let mess = "No commands have been recorded."
        Talk.set_mode(TalkMode.move,  aCAT, mess) //changes the "stop recording" button to "start recording"
    }
    else {
        //let arg_obj = this.string_to_data(content_obj._content_str)
        //let recording_name = arg_obj.job_name
        if (!aCAT.job_name) {
            Talk.display_warning("Stop recording didn't get a job_name for the recording.")
        }
        else {
            //finally, good to make the recording.
                let mess
                if (Talk.is_existing_job_name(aCAT.job_name)) {
                    mess = '"' + aCAT.job_name + '" has been over-written with your new recording.'
                } else {
                    mess = 'Say or click the Job button for: "' + aCAT.job_name + '" to start it.'
                }
                new Job({name: aCAT.job_name, do_list: TalkMode.move.instructions_being_recorded})
                TalkMode.move.instructions_being_recorded = []
                Talk.set_mode(TalkMode.move, aCAT, mess)
                //setTimeout(function () {Talk.dialog_dom_elt.focus()}, 100)
        }
    }
}

new TalkCommand({
    name: "stop recording",
    action_function: talk_stop_recording_action_function,
    should_display: display_stop_recording,
    parameters: [new TalkParameter({
        name: "job_name",
        default_value_string: "my_job",
        type: new TalkType.JobNameOrNewJobName()})
    ],
    tooltip: "Stop the recording of Dexter move commands into a Job"})

//____________move utils_____________
//move utilties
function talk_send_instruction_to_dexter(instruction) {
    Talk.job_for_normal_moves.insert_single_instruction(instruction, false)
}
globalThis.talk_send_instruction_to_dexter = talk_send_instruction_to_dexter


function talk_is_in_reach(xyz, J5_direction = [0, 0, -1], config = [1, 1, 1], dexter_inst_or_workspace_pose){
    let angles
    try{
        angles = Kin.xyz_to_J_angles(xyz, J5_direction, config, dexter_inst_or_workspace_pose) //and fast!
        //James W says this is the best way to do it. Kin.is_in_reach is very approximate so
        //misses a bunch of details and is hard to fix.
    }
    catch(err) { //happens when xyz is out of range
        //out("out of reach angles: " + xyz)
        return false
    }
    //out("in reach angles: " + angles)
    return true
}
function talk_straight_up_angles(){
    let angles = [0,0,0,0,0, 0, 50]
    angles = talk_fix_home_angles_maybe(angles)
    angles = Kin.point_down(angles)
    return angles
}

//Not called Apr 14, 2024
function talk_initial_angles(){
    let dex = Talk.job_for_normal_moves.robot
    if(dex.rs){
        return dex.rs.measured_angles()
    }
    else {
        return talk_straight_up_angles() }
}

function talk_current_or_straight_up_angles(){
    let dex = Talk.job_for_normal_moves.robot
    if(dex.rs){
        let ma = dex.rs.measured_angles()
        if(talk_is_home_angles(ma)){
            return talk_straight_up_angles() //fixes them if need be.
        }
        else { return ma }
    }
    else {
        return talk_straight_up_angles() }
}


function talk_is_home_angles(angle_array){
    for(let i = 0; i < 5; i++){
        if(angle_array[i] !== 0) { return false }
    }
    return true
}

function talk_fix_home_angles_maybe(angle_array){
    let new_angle_array = []
    if(talk_is_home_angles(angle_array)) {
        for(let i = 0; i < angle_array.length; i++) {
            if((i === 1) || (i === 2)) {
                new_angle_array.push(0.000000000001) //Number.EPSILON doesn't work, too small. From James W.)
            }
            else { new_angle_array.push(angle_array[i]) }
        }
    }
    else {
        new_angle_array = angle_array
    }
    return new_angle_array
}

//Copied from dexter_user_interface2 and modified
// xyz is an array of 3 floats.
// if angle_array is an array whose first 5 elts are 0, return a new array
//whose first 5 elts are 0 except the 2nd elt is Number.EPSILON
//and any additional elts are the same as their corresponding ones in angle_array
//Returned is an array of arrays.
function talk_fix_xyz(xyz){
    let angle_array = Kin.xyz_to_J_angles(xyz) //will get out_of_range error with initial angles
    //beware, might error with "out of range".
    let new_angle_array = this.fix_home_angles_maybe(angle_array)
    let new_xyz_extra = Kin.J_angles_to_xyz(new_angle_array)
    return new_xyz_extra //arr of array of numbers
}

function talk_word_to_axis_index_and_direction(word){
    //x
    if      (word === "left")  { return [0, 1]}

    else if (word === "right") { return [0, -1]}
    //y
    else if(["front"].includes(word)) { return [1, 1]}
    else if(["back"].includes(word)) {
        return [1, -1]}

    //z
    else if(word === "up")       { return [2, 1]}
    else if(word === "down")     { return [2, -1]}
    else if(word === "pitch up") { return [3, 1] }

    else { return false} //not a valid word
}

//Not called Apr 14, 2024
function talk_axis_index_and_direction_to_word(axis_index, axis_direction){
    if     (axis_index === 0){
        return ((axis_direction === 1) ? "left"    : "right")
    }
    else if(axis_index === 1) {
        return ((axis_direction === 1) ? "front" : "back")
    }
    else if(axis_index === 2){
        return ((axis_direction === 1) ? "up"      : "down")
    }
    else { return null }
}

function talk_set_step_size(dist){
    TalkMode.move.step_size = dist
    Talk.display_status()
}

//don't use "this"
function talk_start_normal_move_cmd(aCAT){
    if(aCAT) {
        TalkMode.move.current_move_command = aCAT._cmd //used inside of move_incrmentally only.
        TalkMode.move.current_move_joint_number = aCAT.joint_number //will be null for xyz move
        TalkMode.move.current_move_direction    = aCAT.direction //will be null for xyz move
    }
    //else this is the setTimeout call from below with no arg passed so
    //don't change the TalkMode.move.current_move_direction
    Talk.is_moving = true
    Talk.display_status()
    let dex = Talk.job_for_normal_moves.robot
    if(!Talk.job_for_normal_moves.user_data.talk_started_init){ //just hits the first time start_normal_move_cmd is called per init of the job.
        Talk.job_for_normal_moves.user_data.talk_started_init = true //just done once until redefine the job
        Talk.display_message("Initializing Dexter to straight up.")
        let job_initial_instructions = [
            dex.move_all_joints(talk_straight_up_angles()),
            dex.empty_instruction_queue(),
            function () {
                Talk.display_message("Dexter is straight up.")
            }
        ]
        talk_send_instruction_to_dexter(job_initial_instructions)
    }

    if (!dex.rs) {
        setTimeout(talk_start_normal_move_cmd, //loop around again waiting for rs to be set
            100)
    }
    else {
        talk_send_instruction_to_dexter([talk_start_moving_aux, //sets Talk.is_moving = true and redisplay
                talk_move_incrementally //loop_inst
            ]
        )
    }
}

//called as a fn on do_list of talk_internal just before Control.loop for move_incrementally
//don't return a value
function talk_start_moving_aux(){
    Talk.is_moving = true
    Talk.display_status()
    Talk.display_color()
}

//called in body of Control.loop running in Job.
//this is bound to the Job.talk_internal
function talk_move_incrementally() {
    if(!Talk.ensure_talk_internal_is_defined_and_running()){
        setTimeout(talk_move_incrementally, 200)
    }
    if (!Talk.is_moving) {
        Talk.display_status()
        return //Control.break()
    }
    let cmd_name = TalkMode.move.current_move_command.name
    if (TalkMode.move.current_move_command !== TalkMode.move.last_move_command){
        let mess_suffix = "..."
        if(cmd_name === "joint"){
            mess_suffix = " " + TalkMode.move.current_move_joint_number + " " + TalkMode.move.current_move_direction + "."
        }
        Talk.display_message("Moving Dexter " + cmd_name + mess_suffix +
            '<br/>Click "Stop" to stop.')
    }
    let dexter_instance = this.robot //"this" is the running job

    if((cmd_name === "forward") || (cmd_name === "reverse")) {
        let inst
        if (cmd_name === "reverse") {
            inst = talk_compute_reverse_instruction()
        }
        else { inst = talk_compute_forward_instruction() }

        if(inst === null) {
            Talk.stop_aux()
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            return //Control.break()
        }
        if(typeof(inst) === "string") {
            Talk.stop_aux(inst)
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            return //Control.break()
        }
        else {
            return [inst,
                dexter_instance.empty_instruction_queue(),
                talk_move_incrementally] //"recursive" call on the do list.]
        }
    }
    else if (cmd_name === "joint"){
        let dir_sign = (["clockwise", "up", "wider"].includes(TalkMode.move.current_move_direction) ? 1 : -1)
        let degrees_incr =  TalkMode.move.step_size //default 0.005
            * (1 / 0.005)  //so that with default step_size, the degrees_inc will be 1 degrees.
            //and doubling TalkMode.move.step_size will double the degrees_inc
            * dir_sign
        let ma = talk_current_or_straight_up_angles()
        let new_angles = ma.slice()
        let old_ang = ma[TalkMode.move.current_move_joint_number - 1]
        let new_ang = old_ang + degrees_incr
        new_angles[TalkMode.move.current_move_joint_number - 1] = new_ang
        let false_or_error_mess = Dexter.joints_out_of_range(new_angles) //TODO: doesn't now check j6 and j7. Also doesn't check dexter specific so don't pass in the dexter intance so thagt it will at least check the default values of min and max for joints.
        if(false_or_error_mess){
            let mess = "Stopped move joint " + TalkMode.move.current_move_joint_number + " because:<br/>" + false_or_error_mess
            Talk.stop_aux(mess)
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            //Talk.display_warning(mess)
            return
        }
        else {
            return [dexter_instance.move_all_joints(new_angles),
                    dexter_instance.empty_instruction_queue(),
                    talk_move_incrementally //"recursive" call on the do list.
            ]
        }
    }
    else { //regular xyz move like left, down, etc.
        let [axis_index, axis_direction] = talk_word_to_axis_index_and_direction(cmd_name)
        let ma = talk_current_or_straight_up_angles()
        let orig_xyz = Kin.J_angles_to_xyz(ma)[0]

        let [new_x, new_y, new_z] = orig_xyz
        let new_xyz = [new_x, new_y, new_z]
        if (axis_index === 0) {  //x
            new_x = orig_xyz[axis_index] + (axis_direction * TalkMode.move.step_size)
            new_xyz[0] = new_x
        }
        else if (axis_index === 1) {  //y
            new_y = orig_xyz[axis_index] + (axis_direction * TalkMode.move.step_size)
            new_xyz[1] = new_y
            if (new_y < 0) {
                let mess ="This installation of Dexter prevents Dexter from going behind itself: " + to_source_code(new_xyz)
                Talk.stop_aux(mess)
                TalkMode.move.last_move_command = TalkMode.move.current_move_command
                return //Control.break()
            }
        }
        else if (axis_index === 2) {  //z
            new_z = orig_xyz[axis_index] + (axis_direction * TalkMode.move.step_size)
            new_xyz[2] = new_z
            if (new_z < 0) {
                let mess = "This installation of Dexter prevents Dexter from going below it base: " + to_source_code(new_xyz)
                Talk.stop_aux(mess)
                TalkMode.move.last_move_command = TalkMode.move.current_move_command
                return //Control.break()
            }
        }
        else if (axis_index === 5) {  //pitch up j6 clockwise/counterclockwide
            //TODO
            if (new_z < 0) {
                let mess ="This installation of Dexter prevents Dexter from going below it base: " + to_source_code(new_xyz)
                Talk.stop_aux(mess)
                TalkMode.move.last_move_command = TalkMode.move.current_move_command
                return //Control.break()
            }
        }

        //let orig_angles2 = Kin.xyz_to_J_angles(orig_xyz)
        if (talk_is_in_reach(new_xyz, undefined, undefined, dexter_instance)) { //bug in Kin.is_in_reach so use my special one.
            if(TalkMode.move.is_recording) {
                let instr = dexter_instance.move_to(new_xyz)
                TalkMode.move.instructions_being_recorded.push(instr)
            }
            //out("move_incrementally, in reach: " + new_xyz)
            //move_incrementally is a fn that's pushed onto the do_list, so
            //the fn is called when the job is run and whatever it returns is put on the do_list.
            return [dexter_instance.move_to(new_xyz),
                dexter_instance.empty_instruction_queue(),
                talk_move_incrementally //"recursive" call on the do list.
            ]
        }
        else {
            //out("bottom of talk_move_incrementally, out of reach: " + new_xyz)
            let num_arr_str = Utils.array_of_numbers_to_string(new_xyz, 8) //shows micron rez
            let mess = "Moving to xyz: " + num_arr_str + "<br/>is out of Dexter's reach."
            Talk.stop_aux(mess)
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            //Talk.display_warning(mess)
            return //Control.break()
        }
    }
}

globalThis.talk_move_incrementally = talk_move_incrementally //this fn put direclty on do_list so must be globally defined



//____________move commands
function talk_straight_up_action_function(aCAT){
    if(aCAT._content_str === "") {
        Talk.display_color()
        let dex = Talk.job_for_normal_moves.robot
        Talk.is_moving = true
        Talk.display_status()
        let instr = [
            dex.move_all_joints(talk_straight_up_angles()),
            dex.empty_instruction_queue(),
            function() { Talk.stop_aux("Dexter is straight up.") }
        ]
        talk_send_instruction_to_dexter(instr) //will cause Job[recording_name] to run
        let mess_suffix = ""
        if(TalkMode.move.is_recording) {
            TalkMode.move.instructions_being_recorded.push(instr)
            mess_suffix = "<br/>Wait until Dexter stops moving<br/>before running the next command to record."
        }
        this.display_message("Dexter is moving straight up..." + mess_suffix)
    }
}

new TalkCommand({
    name: "straight up",
    action_function: talk_straight_up_action_function,
    row: "new",
    tooltip: "Move Dexter until its straight up and stop"})

function talk_joint_action_function(aCAT){
    talk_start_normal_move_cmd(aCAT)
}
new TalkCommand({
    name: "joint",
    action_function: talk_joint_action_function,
    parameters: [new TalkParameter({
                    name: "joint_number",
                    default_value_string: "1",
                    type: new TalkTypeInteger({
                         min: 1,
                         max: 7,
                         typical: [1, 2, 3, 4, 5, 6, 7],
                         typical_is_exclusive: true
                         })}),
                new TalkParameter({
                    name: "direction",
                    default_value_string: "clockwise",
                    type: new TalkTypeString({
                        min: 1,
                        max: 7,
                        typical: ["clockwise", "counter clockwise"],
                        typical_is_exclusive: true
                    })
                })
        ],
    tooltip: "Move Dexter until its straight up and stop"})

function talk_up_action_function(aCAT){
    if(aCAT._content_str === "") {
        talk_start_normal_move_cmd(aCAT)
    }
}
new TalkCommand({
    name: "up",
    action_function: talk_up_action_function, //globally defined in TalkMain.js
    row: "new",
    tooltip: "Move Dexter up.&#13;If Dexter is straight up (as it is initially)&#13;you must move it down&#13;before moving it in any other direction."})

function talk_down_action_function(aCAT){
    if(aCAT._content_str === "") {
        talk_start_normal_move_cmd(aCAT)
    }
}
new TalkCommand({
    name: "down",
    action_function: talk_down_action_function, //globally defined in TalkMain.js
    tooltip: "Move Dexter down.&#13;If Dexter is straight up (as it is initially)&#13;you must move it down&#13;before moving it in any other direction."})

function talk_left_action_function(aCAT){
    if(aCAT._content_str === "") {
        talk_start_normal_move_cmd(aCAT)
    }
}
new TalkCommand({
    name: "left",
    action_function: talk_left_action_function, //globally defined in TalkMain.js
    tooltip: "Move Dexter left."})

function talk_right_action_function(aCAT){
    if(aCAT._content_str === "") {
        talk_start_normal_move_cmd(aCAT)
    }
}
new TalkCommand({
    name: "right",
    alternative_names: ["write"],
    action_function: talk_right_action_function, //globally defined in TalkMain.js
    tooltip: "Move Dexter right."})

function talk_back_action_function(aCAT){
    if(aCAT._content_str === "") {
        talk_start_normal_move_cmd(aCAT)
    }
}
new TalkCommand({
    name: "back",
    action_function: talk_back_action_function, //globally defined in TalkMain.js
    tooltip: "Move Dexter towards behind of its base."})

function talk_front_action_function(aCAT){
    if(aCAT._content_str === "") {
        talk_start_normal_move_cmd(aCAT)
    }
}
new TalkCommand({
    name: "front",
    action_function: talk_front_action_function, //globally defined in TalkMain.js
    tooltip: "Move Dexter towards the front from its base."})


//stop  (same functionality as Main menu stop
new TalkCommand({
    name: "stop",
    alternative_names: ["stop it", "halt", "off", "kill", "shit", "oh shit"],
    action_function: talk_stop_action_function, //globally defined in TalkMain.js
    tooltip: "Stop Dexter and other ongoing activities."})

function talk_faster_action_function(aCAT){
    if(aCAT._content_str === "") {
        talk_set_step_size(TalkMode.move.step_size * 2)
        Talk.display_message("Step distance has been increased to: " + TalkMode.move.step_size + " meters.")
        return true
    }
}
new TalkCommand({
    name: "faster",
    action_function: talk_faster_action_function, //globally defined in TalkMain.js
    row: "new",
    tooltip: "Double the speed of Dexter when it moves."})

function talk_slower_action_function(aCAT){
    if(aCAT._content_str === "") {
        talk_set_step_size(TalkMode.move.step_size / 2)
        Talk.display_message("Step distance has been decreased to: " + TalkMode.move.step_size + " meters.")
        return true
    }
}
new TalkCommand({
    name: "slower",
    action_function: talk_slower_action_function, //globally defined in TalkMain.js
    tooltip: "Half the speed of Dexter when it moves."})

//forward
//returns an instruction or a string to display indicating its done.
function talk_compute_forward_instruction(the_job=Talk.job_for_normal_moves){
    let dex = the_job.robot
    let hist_arr   = the_job.rs_history
    if(TalkMode.move.last_reverse_forward_index === null) {
        TalkMode.move.last_reverse_forward_index = hist_arr.length - 1
        TalkMode.move.forward_limit_index = hist_arr.length - 1
    }  //skip past the latest one

    if(TalkMode.move.last_reverse_forward_index >= TalkMode.move.forward_limit_index){
        return "There are no more commands to go forward to." //get out of loop
    }
    else {
        let RS_inst = new RobotStatus({})
        for (let i = TalkMode.move.last_reverse_forward_index + 1; i <= TalkMode.move.forward_limit_index; i++) {
            TalkMode.move.last_reverse_forward_index = i //so that if we switch to forward, that will start in the right place, as will subsequence calls to  compute_reverse_instruction
            let single_rs = hist_arr[i]
            let oplet = single_rs[Dexter.INSTRUCTION_TYPE]
            if (oplet === "F") { //this is the one to go back to.
                RS_inst.robot_status = single_rs
                let angles = RS_inst.measured_angles()
                let instr = dex.move_all_joints(angles)
                return instr
            }
        }
        return "There are no more commands to reverse to."
    }
}
function talk_forward_action_function(aCAT){
    if(aCAT._content_str === "") {
        talk_start_normal_move_cmd(aCAT)
    }
}
new TalkCommand({
    name: "forward",
    alternative_names: ["foreword"],
    action_function: talk_forward_action_function, //globally defined in TalkMain.js
    tooltip: "Move Dexter forward after you have reversed it back along its path."})


//reverse
//returns an instruction or a string to display indicating its done.
function talk_compute_reverse_instruction(the_job=Talk.job_for_normal_moves){
    let dex = the_job.robot
    let hist_arr   = the_job.rs_history
    if(TalkMode.move.last_reverse_forward_index === null) {
        TalkMode.move.last_reverse_forward_index = hist_arr.length - 1
        TalkMode.move.forward_limit_index = hist_arr.length - 1
    }  //skip past the latest one

    if(TalkMode.move.last_reverse_forward_index === 0){
        return "There are no more commands to reverse to." //get out of loop
    }
    else {
        let RS_inst = new RobotStatus({})
        for (let i = TalkMode.move.last_reverse_forward_index - 1; i >= 0; i--) {
            TalkMode.move.last_reverse_forward_index = i //so that if we switch to forward, that will start in the right place, as will subsequence calls to  compute_reverse_instruction
            let single_rs = hist_arr[i]
            let oplet = single_rs[Dexter.INSTRUCTION_TYPE]
            if (oplet === "F") { //this is the one to go back to.
                RS_inst.robot_status = single_rs
                let angles = RS_inst.measured_angles()
                let instr = dex.move_all_joints(angles)
                return instr
            }
        }
        return "There are no more commands to reverse to."
    }
}
function talk_reverse_action_function(aCAT){
    if(aCAT._content_str === "") {
        talk_start_normal_move_cmd(aCAT)
    }
}
new TalkCommand({
    name: "reverse",
    alternative_names: [],
    action_function: talk_reverse_action_function, //globally defined in TalkMain.js
    tooltip: "Move Dexter back along the path from where it came."})

//run_job
//Called by a regular cmd and by mode_misc methods which prepend "run job " to full_text first.
function talk_run_job_action_function(aCAT){
    if(aCAT._content_str === "") {
        this.set_params_mode(aCAT)
        return
    }
    else {
        // let arg_obj = this.string_to_data(content_obj._content_str)
        // let recording_name = arg_obj.job_name //will return undefined if arg_obj is a string
        let recording_name = aCAT.job_name
        if(!recording_name) {
            recording_name = aCAT._content_str
        }
        recording_name = Talk.string_to_job_name(recording_name)
        if(Talk.is_existing_job_name(recording_name)){
            let instr = Control.start_job(recording_name, undefined, undefined, true) //run this embedded job until it completes, THEN move to the next instruction in Talk.job_for_normal_moves
            talk_send_instruction_to_dexter(instr) //will cause Job[recording_name] to run
            if(TalkMode.move.is_recording) {
                TalkMode.move.instructions_being_recorded.push(instr)
                this.display_message('Wait until job: <b>' + recording_name + '</b> has completed<br/>' +
                    "before running the next command to record.")
            }
            return
        }
        else {
            Talk.display_warning('The <b>run job</b> command was passed: "' + recording_name + '",<br/>which does not name a defined Job.')
            return
        }
    }
}

new TalkCommand({
    name: "run job",
    alternative_names:  ["run jobe", "ron job"],
    action_function: talk_run_job_action_function, //globally defined in TalkMain.js
    parameters: [new TalkParameter({
        name: "job_name",
        default_value_string: Talk.default_job_name,
        type: new TalkType.JobNameOrNewJobName()})
    ],
    row: "new",
    tooltip: "Say 'Run Job [job name] or&#13;just the Job name to&#13;start the Job."})

//edit job
function talk_edit_job_action_function(aCAT){
    if(aCAT._content_str === "") {
        his.set_params_mode(aCAT)
    }
    else {
        if (this.default_job_name() === "") {
            Talk.display_warning("There are no defined Jobs to edit.")
        }
        else {
            talk_edit_job_aux(aCAT)
        }
    }
}

function talk_edit_job_aux(aCAT){
    let recording_name = aCAT.job_name
    if(!recording_name) {
        recording_name = aCAT._content_str
    }
    recording_name = Talk.string_to_job_name(recording_name)
    if (!Talk.is_existing_job_name(recording_name)){
        Talk.display_warning('"' + recording_name + '" is not the name of a defined Job.')
        return true
    }
    else {
        let the_job = Job[recording_name]
        the_job.program_counter = 0
        let job_src = to_source_code({value: the_job, job_orig_args: true})
        Editor.insert("\n" + job_src, "end")
        setTimeout(function() {
            Talk.dialog_dom_elt.focus()
            Talk.display_message('The definition for "' + recording_name + '" has been appended to the editor buffer.')
        }, 200)
        return true
    }
}

new TalkCommand({
    name: "edit job",
    alternative_names:  ["run jobe", "ron job"],
    action_function: talk_edit_job_action_function, //globally defined in TalkMain.js
    parameters: [new TalkParameter({
        name: "job_name",
        default_value_string: Talk.default_job_name,
        type: new TalkType.JobNameOrNewJobName()})
    ],
    tooltip: "Say 'Edit [job name] to&#13;insert the Job definition into the editor."})

//main_menu
//same as former "back"
function talk_main_menu_action_function(aCAT){
    if(aCAT._content_str === ""){
        Talk.set_mode(TalkMode.main, undefined, Talk.say_or_click())
    }
}
globalThis.talk_main_menu_action_function = talk_main_menu_action_function

new TalkCommand({
    name: "main menu",
    alternate_names: ["main", "maine menu", "maine"],
    action_function: globalThis.talk_main_menu_action_function,
    row: "new",
    tooltip: "Change the menu of commands back to the main menu."})

function talk_object_menu_action_function(aCAT){
    if(aCAT._content_str === "") {
        Talk.set_mode(TalkMode.object, aCAT, "Make 3D objects in the simulator.")
        Talk.dialog_dom_elt.focus()
    }
}
new TalkCommand({
    name: "object menu",
    alternate_names: ["object"],
    action_function: talk_object_menu_action_function,
    tooltip: "Change this dialog box to make 3D objects in the simulator"} )

new TalkCommand({
    name: "pick menu",
    alternate_names: ["pick"],
    action_function: globalThis.talk_pick_menu_action_function,
    tooltip: "Change this dialog box to pick and place objects."} )


/*static cmd_props_table = {
    move_menu: [
        [["simulate",                  ["simulator"],                              [], "Causes robot commands to be simulated."],
            ["real",                      [],                                         [], "Causes robot commands to go to the real robot."],
            ["both",                      [],                                         [], "Causes robot commands to be simulated and&#13;go to the real robot."],
        ],
        //needs to be above the "stop" cmd because otherwise, handle_cmd will choose "stop" when full_text is stop_recording which is bad
        [ ["define place",             ["defined place", "dine place"],            [["job_name", ""]], "Assign Dexter's current position to a name."],
            ["start recording",          ["started recording"],                      [], "Begin the recording of Dexter move commands into a Job.", Talk.display_start_recording],
            ["stop recording",           [],                                         [["job_name", ""]], "Stop the recording of Dexter move commands into a Job.",  Talk.display_stop_recording],
        ],
        [ ["straight up",              [],                                         [], "Move Dexter until its straight up and stop."],
            ["joint",                    [],                                         [["joint_number", "1"], ["direction", "clockwise"]], "Move one of Dexter's joints,&#131 thru 7,&#13clockwise or counter clockwise."],
        ],
        [ ["up",                        [],                                        [], "Move Dexter up."],
            ["down",                      [],                                        [], "Move Dexter down.&#13;If Dexter is straight up (as it is initially)&#13;you must move it down&#13;before moving it in any other direction."],

            ["left",                      [],                                        [], "Move Dexter left."],
            ["right",                     ["write"],                                 [], "Move Dexter right."],

            ["back",                      [],                                        [], "Move Dexter towards behind of its base."],
            ["front",                     [],                                        [], "Move Dexter towards the front from its base."],

            ["stop",                      [],                                         [], "Stop Dexter and other ongoing activities."]  //on both main and move menus

        ],
        [ ["faster",                    [],                                        [], "Double the speed of Dexter when it moves."],
            ["slower",                    [],                                        [], "Half the speed of Dexter when it moves."],

            ["forward",                  ["foreword"],                               [], "Move Dexter forward after you have moved it back along its path."],
            ["reverse",                  [],                                         [], "Move Dexter back along the path from whence it came."],
        ],
        [ ["run job",                  ["run jobe", "ron job"],                               [["job_name", Talk.default_job_name]], "Say 'Run Job [job name] or&#13;just the Job name to&#13;start the Job."],
            ["edit job",                 [],                                         [["job_name", Talk.default_job_name]], "Say 'Edit [job name] to&#13;insert the Job definition into the editor."], //don't have alternatives
        ],
        [
            ["main menu",                ["main", "maine"],                          [], "Change the menu of commands back to the main menu."],
        ],
    ], //end move_menu
}


//_______RECORDING_________

//names are lower cased and have underscores. Just a straight array, not nested.
static array_of_recording_names(){
    let job_names = Job.defined_job_names()
    let rec_names = []
    for(let job_name of job_names){
        if(!(job_name === "talk_internal")){
            rec_names.push(job_name)
        }
    }
    return rec_names
}

static display_start_recording() {
    return !this.is_recording
}

static display_stop_recording(){
    return this.is_recording
}

static start_recording(content_obj){
    if(content_obj._content_str === ""){
        Talk.is_recording = true
        this.instructions_being_recorded = [] //clear out the previous recording
        this.display_all("To record a command, click it or<br/>tap the space-bar briefly and say it.") //needed to change "start_recording" to "stop_recording
    }
}

//called internally. Not Now top level cmd
static stop_recording(content_obj) {
    this.is_recording = false //must go before set_mode
    this.display_status()
    if (content_obj._content_str === "") {
        this.stop(content_obj) //does not call stop_recording, on purpose.
        //necessary because if we click on stop_recording during a move,.
        // then switch to the param screen to fill in
        //the job_name, we don't want the robot to keep moving
        //as it will just run out of bounds.
        //Also a user seeing "Stop ...." will probably expect the
        //robot to stop, EVEN THOUGH stopping a tape recroder doesn't
        //stop reality!
        this.set_params_mode(content_obj)
    }
    else {
        return this.define_recording(content_obj)
    }
}

static define_recording(content_obj){
    if (this.instructions_being_recorded.length === 0) {
        this.instructions_being_recorded = null
        let mess = "No commands have been recorded."
        this.set_mode("move_menu", content_obj, mess) //changes the "stop recording" button to "start recording"
    }
    else {
        //let arg_obj = this.string_to_data(content_obj._content_str)
        //let recording_name = arg_obj.job_name
        let recording_name = content_obj.job_name
        if (!recording_name) {
            this.display_warning("Stop recording didn't get a job_name for the recording.")
        }
        else {
            recording_name = this.string_to_job_name(recording_name)
            if (TalkMode.move.is_known_cmd_name(recording_name)) { //we want to exclude known recording names
                this.display_message('"' + recording_name + '" is a command, so it can&apos;t be used to name a recording.')
            }
            else { //finally, good to make the recording.
                let mess
                if (Talk.is_existing_job_name(recording_name)) {
                    mess = '"' + recording_name + '" has been over-written with your new recording.'
                } else {
                    mess = 'Say or click the Job button for: "' + recording_name + '" to start it.'
                }
                new Job({name: recording_name, do_list: this.instructions_being_recorded})
                this.instructions_being_recorded = null
                this.set_mode("move_menu", content_obj, mess)
                //setTimeout(function () {Talk.dialog_dom_elt.focus()}, 100)
            }
        }
    }
}

//_____define place_______
//expects full_text of "define postion", "define place foo"
static define_place(content_obj){
    if(content_obj._content_str === ""){
        this.set_params_mode(content_obj)
    }
    else {
        if (!Dexter.default.rs) {
            Talk.display_warning("To name a Dexter place, you have to move Dexter first.")
        }
        else {
            return this.define_place_with_name(content_obj)
        }
    }
}

static define_place_with_name(content_obj){
    let arg_obj = this.string_to_data(content_obj._content_str)
    let recording_name = arg_obj.job_name
    if(!recording_name) {
        recording_name = content_obj._content_str
    }
    recording_name = this.string_to_job_name(recording_name)
    //ok we've got a valid recording_name, good to go
    let angles =  Dexter.default.rs.measured_angles()
    let instrs = [Dexter.default.move_all_joints(angles),
        Dexter.default.empty_instruction_queue()
    ]
    new Job({name: recording_name, do_list: instrs})
    Talk.dialog_dom_elt.focus()
    let mess = 'Tap space-bar and say: "' + recording_name + '" or<br/>click the "' +
        recording_name + '" button to move Dexter to its current position.'
    Talk.set_mode("move_menu", content_obj, mess)
}

//used near the end of main_mode and menu_mode.
//Called by a regular cmd and by mode_misc methods which prepend "run job " to full_text first.
static run_job(content_obj){
    if(content_obj._content_str === "") {
        this.set_params_mode(content_obj)
        return
    }
    else {
        // let arg_obj = this.string_to_data(content_obj._content_str)
        // let recording_name = arg_obj.job_name //will return undefined if arg_obj is a string
        let recording_name = content_obj.job_name
        if(!recording_name) {
            recording_name = content_obj._content_str
        }
        recording_name = this.string_to_job_name(recording_name)
        if(Talk.is_existing_job_name(recording_name)){
            let instr = Control.start_job(recording_name, undefined, undefined, true) //run this embedded job until it completes, THEN move to the next instruction in Talk.job_for_normal_moves
            talk_send_instruction_to_dexter(instr) //will cause Job[recording_name] to run
            if(this.is_recording) {
                this.instructions_being_recorded.push(instr)
                this.display_message('Wait until job: <b>' + recording_name + '</b> has completed<br/>' +
                    "before running the next command to record.")
            }
            return
        }
        else {
            Talk.display_warning('The <b>run job</b> command was passed: "' + recording_name + '",<br/>which does not name a defined Job.')
            return
        }
    }
}

static edit_job(content_obj){
    if(content_obj._content_str === "") {
        his.set_params_mode(content_obj)
    }
    else {
        if (this.default_job_name() === "") {
            Talk.display_warning("There are no defined Jobs to edit.")
        }
        else {
            this.edit_job_action(content_obj)
        }
    }
}

static edit_job_action(content_obj){
    let arg_obj = this.string_to_data(content_obj._content_str)
    let recording_name = content_obj.job_name //arg_obj.job_name
    if(!recording_name) {
        recording_name = content_obj._content_str
    }
    recording_name = this.string_to_job_name(recording_name)
    if (!Talk.is_existing_job_name(recording_name)){
        Talk.display_warning('"' + recording_name + '" is not the name of a defined Job.')
        return true
    }
    else {
        let the_job = Job[recording_name]
        the_job.program_counter = 0
        let job_src = to_source_code({value: the_job, job_orig_args: true})
        Editor.insert("\n" + job_src, "end")
        setTimeout(function() {
            Talk.dialog_dom_elt.focus()
            Talk.display_message('The definition for "' + recording_name + '" has been appended to the editor buffer.')
        }, 200)
        return true
    }
}


static simulate(content_obj){
    if(content_obj._content_str === "") {
        let sim = Robot.get_simulate_actual(Dexter.default.simulate)
        if (globalThis.simulate_radio_true_id.checked) {
            this.display_warning("Dexter is already in <b>simulate</b> mode.<br/>" +
                "See the radio buttons in the Misc pane header.")
        } else {
            globalThis.simulate_radio_true_id.checked = true
            DDE_DB.persistent_set("default_dexter_simulate", true)
            let mess = "Dexter is now in <b>simulate</b> mode.<br/>" +
                "The real robot won't move when you run these commands."
            this.display_message(mess)
        }
    }
}

static real(content_obj){
    if(content_obj._content_str === "") {
        let sim = Robot.get_simulate_actual(Dexter.default.simulate)
        if (globalThis.simulate_radio_false_id.checked) {
            this.display_warning("Dexter is already in <b>real</b> mode.<br/>" +
                "See the radio buttons in the Misc pane header.")
        } else {
            globalThis.simulate_radio_false_id.checked = true
            DDE_DB.persistent_set("default_dexter_simulate", "false")
            let mess = "Dexter is now in <b>real</b> mode.<br/>" +
                "The real robot will move when you run these commands."
            this.display_message(mess)
        }
    }
}

static both(content_obj){
    if(content_obj._content_str === "") {
        let sim = Robot.get_simulate_actual(Dexter.default.simulate)
        if (globalThis.simulate_radio_both_id.checked) {
            this.display_warning("Dexter is already in <b>both</b> (simulate & real) mode.<br/>" +
                "See the radio buttons in the Misc pane header.")
        } else {
            globalThis.simulate_radio_both_id.checked = true
            DDE_DB.persistent_set("default_dexter_simulate", "both")
            let mess = "Dexter is now in <b>both</b> mode.<br/>" +
                "The simulator and real robot will move when you run these commands."
            this.display_message(mess)
        }
    }
}

//____________move commands_____________
//if angle_array is an array whose first 5 elts are 0, return true,
//else return false

static straight_up_angles(){
    let angles = [0,0,0,0,0, 0, 50]
    angles = this.fix_home_angles_maybe(angles)
    angles = Kin.point_down(angles)
    return angles
}

//Not called Apr 14, 2024
static initial_angles(){
    let dex = this.job_for_normal_moves.robot
    if(dex.rs){
        return dex.rs.measured_angles()
    }
    else {
        return this.straight_up_angles() }
}

static current_or_straight_up_angles(){
    let dex = this.job_for_normal_moves.robot
    if(dex.rs){
        let ma = dex.rs.measured_angles()
        if(this.is_home_angles(ma)){
            return this.straight_up_angles() //fixes them if need be.
        }
        else { return ma }
    }
    else {
        return this.straight_up_angles() }
}


static is_home_angles(angle_array){
    for(let i = 0; i < 5; i++){
        if(angle_array[i] !== 0) { return false }
    }
    return true
}

static fix_home_angles_maybe(angle_array){
    let new_angle_array = []
    if(this.is_home_angles(angle_array)) {
        for(let i = 0; i < angle_array.length; i++) {
            if((i === 1) || (i === 2)) {
                new_angle_array.push(0.000000000001) //Number.EPSILON doesn't work, too small. From James W.)
            }
            else { new_angle_array.push(angle_array[i]) }
        }
    }
    else {
        new_angle_array = angle_array
    }
    return new_angle_array
}

//Copied from dexter_user_interface2 and modified
// xyz is an array of 3 floats.
// if angle_array is an array whose first 5 elts are 0, return a new array
//whose first 5 elts are 0 except the 2nd elt is Number.EPSILON
//and any additional elts are the same as their corresponding ones in angle_array
//Returned is an array of arrays.
static fix_xyz(xyz){
    let angle_array = Kin.xyz_to_J_angles(xyz) //will get out_of_range error with initial angles
    //beware, might error with "out of range".
    let new_angle_array = this.fix_home_angles_maybe(angle_array)
    let new_xyz_extra = Kin.J_angles_to_xyz(new_angle_array)
    return new_xyz_extra //arr of array of numbers
}

static word_to_axis_index_and_direction(word){
    //x
    if      (word === "left")  { return [0, 1]}

    else if (word === "right") { return [0, -1]}
    //y
    else if(["front"].includes(word)) { return [1, 1]}
    else if(["back"].includes(word)) {
        return [1, -1]}

    //z
    else if(word === "up")       { return [2, 1]}
    else if(word === "down")     { return [2, -1]}
    else if(word === "pitch up") { return [3, 1] }

    else { return false} //not a valid word
}

//Not called Apr 14, 2024
static axis_index_and_direction_to_word(axis_index, axis_direction){
    if     (axis_index === 0){
        return ((axis_direction === 1) ? "left"    : "right")
    }
    else if(axis_index === 1) {
        return ((axis_direction === 1) ? "front" : "back")
    }
    else if(axis_index === 2){
        return ((axis_direction === 1) ? "up"      : "down")
    }
    else { return null }
}

static set_step_size(dist){
    this.step_size = dist
    this.display_status()
}


//called from both stop and as a job instruction, where we DON'T want it to return
//anything, including "valid" as that will be interpreted by a job as an instruction

//same as former "back"
static main_menu(content_obj){
    if(content_obj._content_str === ""){
        this.set_mode("main_menu", undefined, this.say_or_click())
        return true
    }
}

//_______Move commands_________

static straight_up(content_obj){
    if(content_obj._content_str === "") {
        this.display_color()
        let dex = this.job_for_normal_moves.robot
        this.is_moving = true
        this.display_status()
        let instr = [
            dex.move_all_joints(Talk.straight_up_angles()),
            dex.empty_instruction_queue(),
            function() { Talk.stop_aux("Dexter is straight up.") }
        ]
        talk_send_instruction_to_dexter(instr) //will cause Job[recording_name] to run
        let mess_suffix = ""
        if(this.is_recording) {
            this.instructions_being_recorded.push(instr)
            mess_suffix = "<br/>Wait until Dexter stops moving<br/>before running the next command to record."
        }
        this.display_message("Dexter is moving straight up..." + mess_suffix)
    }
}

static left(content_obj){
    if(content_obj._content_str === "") {
        this.start_normal_move_cmd(content_obj)
    }
}

static right(content_obj){
    if(content_obj._content_str === "") {
        this.start_normal_move_cmd(content_obj)
    }
}

static front(content_obj){
    if(content_obj._content_str === "") {
        this.start_normal_move_cmd(content_obj)
    }
}

static back(content_obj){
    if(content_obj._content_str === "") {
        this.start_normal_move_cmd(content_obj)
    }
}


static up(content_obj){
    if(content_obj._content_str === "") {
        this.start_normal_move_cmd(content_obj)
    }
}

static down(content_obj){
    if(content_obj._content_str === "") {
        this.start_normal_move_cmd(content_obj)
    }
}

static reverse(content_obj){
    if(content_obj._content_str === "") {
        this.start_normal_move_cmd(content_obj)
    }
}

static forward(content_obj){
    if(content_obj._content_str === "") {
        this.start_normal_move_cmd(content_obj)
    }
}

//returns an instruction or a string to display indicating its done.
static compute_reverse_instruction(the_job){
    let dex = this.job_for_normal_moves.robot
    let hist_arr   = the_job.rs_history
    if(this.last_reverse_forward_index === null) {
        this.last_reverse_forward_index = hist_arr.length - 1
        this.forward_limit_index = hist_arr.length - 1
    }  //skip past the latest one

    if(this.last_reverse_forward_index === 0){
        return "There are no more commands to reverse to." //get out of loop
    }
    else {
        let RS_inst = new RobotStatus({})
        for (let i = this.last_reverse_forward_index - 1; i >= 0; i--) {
            this.last_reverse_forward_index = i //so that if we switch to forward, that will start in the right place, as will subsequence calls to  compute_reverse_instruction
            let single_rs = hist_arr[i]
            let oplet = single_rs[Dexter.INSTRUCTION_TYPE]
            if (oplet === "F") { //this is the one to go back to.
                RS_inst.robot_status = single_rs
                let angles = RS_inst.measured_angles()
                let instr = dex.move_all_joints(angles)
                //out("compute_reverse_instruction returning instr: " + instr)
                return instr
            }
        }
        return "There are no more commands to reverse to."
    }
}

//returns an instruction or a string to display indicating its done.
static compute_forward_instruction(the_job){
    let dex = this.job_for_normal_moves.robot
    let hist_arr   = the_job.rs_history
    if(this.last_reverse_forward_index === null) {
        this.last_reverse_forward_index = hist_arr.length - 1
        this.forward_limit_index = hist_arr.length - 1
    }  //skip past the latest one

    if(this.last_reverse_forward_index >= this.forward_limit_index){
        return "There are no more commands to go forward to." //get out of loop
    }
    else {
        let RS_inst = new RobotStatus({})
        for (let i = this.last_reverse_forward_index + 1; i <= this.forward_limit_index; i++) {
            this.last_reverse_forward_index = i //so that if we switch to forward, that will start in the right place, as will subsequence calls to  compute_reverse_instruction
            let single_rs = hist_arr[i]
            let oplet = single_rs[Dexter.INSTRUCTION_TYPE]
            if (oplet === "F") { //this is the one to go back to.
                RS_inst.robot_status = single_rs
                let angles = RS_inst.measured_angles()
                let instr = dex.move_all_joints(angles)
                //out("compute_forward_instruction returning instr: " + instr)
                return instr
            }
        }
        return "There are no more commands to reverse to."
    }
}

static faster(content_obj){
    if(content_obj._content_str === "") {
        this.set_step_size(this.step_size * 2)
        this.display_message("Step distance has been increased to: " + this.step_size + " meters.")
        return true
    }
}

static slower(content_obj){
    if(content_obj._content_str === "") {
        this.set_step_size(this.step_size / 2)
        this.display_message("Step distance has been decreased to: " + this.step_size + " meters.")
        return true
    }
}
//_________Joint cmd______________

static joint(content_obj){
    this.start_normal_move_cmd(content_obj)
}
//______End move commands _______

//_______move plumbing____________
//called by down, left and friends to do their real action.
//this version mostly works BUT If dexter is already moving (say "down")
//and you click on "left" for a bit, then the stop, the job
//keeps togging between running the last 2 instructions. Bad. The
//below version with the timeout fixes this.

//don't use "this"
static start_normal_move_cmd(content_obj){
    if(content_obj) {
        Talk.current_move_command      = content_obj._cmd_norm //used inside of move_incrmentally only.
        Talk.current_move_joint_number = content_obj.joint_number //will be null for xyz move
        Talk.current_move_direction    = content_obj.direction //will be null for xyz move
    }
    //else this is the setTimeout call from below with no arg passed so
    //don't change the Talk.current_move_command
    Talk.is_moving = true
    Talk.display_status()
    let dex = Talk.job_for_normal_moves.robot
    if(!Talk.job_for_normal_moves.user_data.talk_started_init){ //just hits the first time start_normal_move_cmd is called per init of the job.
        Talk.job_for_normal_moves.user_data.talk_started_init = true //just done once until redefine the job
        Talk.display_message("Initializing Dexter to straight up.")
        let job_initial_instructions = [
            dex.move_all_joints(Talk.straight_up_angles()),
            dex.empty_instruction_queue(),
            function () {
                Talk.display_message("Dexter is straight up.")
            }
        ]
        talk_send_instruction_to_dexter(job_initial_instructions)
    }

    if (!dex.rs) {
        setTimeout(Talk.start_normal_move_cmd, //loop around again waiting for rs to be set
            100)
    }
    else {
        talk_send_instruction_to_dexter([Talk.start_moving_aux, //sets Talk.is_moving = true and redisplay
                Talk.move_incrementally //loop_inst
            ]
        )
    }
}

//called as a fn on do_list of talk_internal just before Control.loop for move_incrementally
//don't return a value
static start_moving_aux(){
    Talk.is_moving = true
    Talk.display_status()
    Talk.display_color()
}

static send_instruction_to_dexter(instruction) {
    this.job_for_normal_moves.insert_single_instruction(instruction, false)
}

static is_in_reach(xyz, J5_direction = [0, 0, -1], config = [1, 1, 1], dexter_inst_or_workspace_pose){
    let angles
    try{
        angles = Kin.xyz_to_J_angles(xyz, J5_direction, config, dexter_inst_or_workspace_pose) //and fast!
        //James W says this is the best way to do it. Kin.is_in_reach is very approximate so
        //misses a bunch of details and is hard to fix.
    }
    catch(err) { //happens when xyz is out of range
        //out("out of reach angles: " + xyz)
        return false
    }
    //out("in reach angles: " + angles)
    return true
}

//called in body of Control.loop running in Job.
static move_incrementally() {
    //out("top of move_incrementally, is_moving: " + Talk.is_moving + " cmd: " + Talk.current_move_command)
    if (!Talk.is_moving) {
        Talk.display_status()
        return //Control.break()
    }
    if (Talk.current_move_command !== Talk.last_move_command){
        let mess_suffix = "..."
        if(Talk.current_move_command === "joint"){
            mess_suffix = " " + Talk.current_move_joint_number + " " + Talk.current_move_direction + "."
        }
        Talk.display_message("Moving Dexter " + Talk.current_move_command + mess_suffix +
            '<br/>Click "Stop" to stop.')
    }
    let dexter_instance = this.robot //"this" is the running job

    if((Talk.current_move_command === "forward") || (Talk.current_move_command === "reverse")) {
        let inst
        if (Talk.current_move_command === "reverse") {
            inst = Talk.compute_reverse_instruction(Talk.job_for_normal_moves)
        }
        else { inst = Talk.compute_forward_instruction(Talk.job_for_normal_moves) }

        if(inst === null) {
            Talk.stop_aux()
            Talk.last_move_command = Talk.current_move_command
            return //Control.break()
        }
        if(typeof(inst) === "string") {
            Talk.stop_aux(inst)
            Talk.last_move_command = Talk.current_move_command
            return //Control.break()
        }
        else {
            return [inst,
                dexter_instance.empty_instruction_queue(),
                Talk.move_incrementally] //"recursive" call on the do list.]
        }
    }
    else if (Talk.current_move_command === "joint"){
        let dir_sign = (["clockwise", "up", "wider"].includes(Talk.current_move_direction) ? 1 : -1)
        let degrees_incr =  Talk.step_size //default 0.005
            * (1 / 0.005)  //so that with default step_size, the degrees_inc will be 1 degrees.
            //and doubling Talk.step_size will double the degrees_inc
            * dir_sign
        let ma = Talk.current_or_straight_up_angles()
        let new_angles = ma.slice()
        let old_ang = ma[Talk.current_move_joint_number - 1]
        let new_ang = old_ang + degrees_incr
        new_angles[Talk.current_move_joint_number - 1] = new_ang
        let false_or_error_mess = Dexter.joints_out_of_range(new_angles) //TODO: doesn't now check j6 and j7. Also doesn't check dexter specific so don't pass in the dexter intance so thagt it will at least check the default values of min and max for joints.
        if(false_or_error_mess){
            let num_arr_str = Utils.array_of_numbers_to_string(new_xyz, 8) //shows micron rez
            let mess = false_or_error_mess
            Talk.stop_aux(false_or_error_mess)
            Talk.last_move_command = Talk.current_move_command
            //Talk.display_warning(mess)
            return
        }
        else {
            return [dexter_instance.move_all_joints(new_angles),
                dexter_instance.empty_instruction_queue(),
                Talk.move_incrementally //"recursive" call on the do list.
            ]
        }
    }
    else { //regular xyz move like left, down, etc.
        let [axis_index, axis_direction] = Talk.word_to_axis_index_and_direction(Talk.current_move_command)
        let ma = Talk.current_or_straight_up_angles()
        let orig_xyz = Kin.J_angles_to_xyz(ma)[0]

        let [new_x, new_y, new_z] = orig_xyz
        let new_xyz = [new_x, new_y, new_z]
        if (axis_index === 0) {  //x
            new_x = orig_xyz[axis_index] + (axis_direction * Talk.step_size)
            new_xyz[0] = new_x
        }
        else if (axis_index === 1) {  //y
            new_y = orig_xyz[axis_index] + (axis_direction * Talk.step_size)
            new_xyz[1] = new_y
            if (new_y < 0) {
                let mess ="This installation of Dexter prevents Dexter from going behind itself: " + to_source_code(new_xyz)
                Talk.stop_aux(mess)
                Talk.last_move_command = Talk.current_move_command
                return //Control.break()
            }
        }
        else if (axis_index === 2) {  //z
            new_z = orig_xyz[axis_index] + (axis_direction * Talk.step_size)
            new_xyz[2] = new_z
            if (new_z < 0) {
                let mess = "This installation of Dexter prevents Dexter from going below it base: " + to_source_code(new_xyz)
                Talk.stop_aux(mess)
                Talk.last_move_command = Talk.current_move_command
                return //Control.break()
            }
        }
        else if (axis_index === 5) {  //pitch up j6 clockwise/counterclockwide
            //TODO
            if (new_z < 0) {
                let mess ="This installation of Dexter prevents Dexter from going below it base: " + to_source_code(new_xyz)
                Talk.stop_aux(mess)
                Talk.last_move_command = Talk.current_move_command
                return //Control.break()
            }
        }

        //let orig_angles2 = Kin.xyz_to_J_angles(orig_xyz)
        if (Talk.is_in_reach(new_xyz, undefined, undefined, dexter_instance)) { //bug in Kin.is_in_reach so use my special one.
            if(Talk.is_recording) {
                let instr = dexter_instance.move_to(new_xyz)
                Talk.instructions_being_recorded.push(instr)
            }
            //out("move_incrementally, in reach: " + new_xyz)
            //move_incrementally is a fn that's pushed onto the do_list, so
            //the fn is called when the job is run and whatever it returns is put on the do_list.
            return [dexter_instance.move_to(new_xyz),
                dexter_instance.empty_instruction_queue(),
                Talk.move_incrementally //"recursive" call on the do list.
            ]
        }
        else {
            //out("bottom of Talk.move_incrementally, out of reach: " + new_xyz)
            let num_arr_str = Utils.array_of_numbers_to_string(new_xyz, 8) //shows micron rez
            let mess = "Moving to xyz: " + num_arr_str + "<br/>is out of Dexter's reach."
            Talk.stop_aux(mess)
            Talk.last_move_command = Talk.current_move_command
            //Talk.display_warning(mess)
            return //Control.break()
        }
    }
}

//______  mode_misc commands_______

//called from handle_command
static main_menu_mode_misc(content_obj) {
    let new_cmd_norm = "run job"
    let new_content = content_obj._full_text //hopefully a job name
    let new_full_text = new_cmd_norm + " " + new_content
    if(this.job_name_prose_to_existing_job_name(new_content)) { //we don't want to get the warning message from run_job about a non-existend job name so catch this here
        let new_content_obj = this.content_str_to_content_obj(new_full_text, new_cmd_norm, new_content, new_cmd_norm)
        this.run_job(new_content_obj)
        return
    }
    else {
        new_cmd_norm = "gpt"
        new_full_text = new_cmd_norm + " " + new_content
        let new_content_obj = this.content_str_to_content_obj(new_full_text, new_cmd_norm, new_content, new_cmd_norm)
        if (this.gpt(new_content_obj)) {
            return
        }
    }
}

//called from handle_command
static move_menu_mode_misc(content_obj) {
    //note cmd_str will just be the first word, ie "run"
    //and content will be the remaining ie "job blue" so neither are helpful.
    //but if "full_job" is a job_name, we can win
    let new_content = content_obj._full_text
    if(this.job_name_prose_to_existing_job_name(new_content)) {
        let new_cmd_norm  = "run_job"
        let new_full_text =  new_cmd_norm + content_obj._full_text
        let new_content_obj = this.content_str_to_content_obj(new_full_text, new_cmd_norm, new_content, new_cmd_norm)
        if (this.run_job(new_content_obj)) {
            return true
        }
    }
}
*/