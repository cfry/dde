new TalkMode({name: "pick",
    mode_misc_method: "pick_mode_misc_action_function"
})

//mode_misc
function pick_mode_misc_action_function(aCAT) {
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
    action_function: pick_mode_misc_action_function,
    tooltip: "Run the named Job, or the GPT command."})


function talk_grasp_action_function(aCAT){
    if(aCAT._content_str === ""){
        let dex = Talk.job_for_normal_moves.robot
        let instr = [
            dex.grasp, // a fn def
            dex.empty_instruction_queue(),
            function() { Talk.stop_aux("Dexter's fingers closed.") }
        ]
        globalThis.talk_send_instruction_to_dexter(instr) //will cause Job[recording_name] to run
        if(TalkMode.move.is_recording) {
            TalkMode.move.instructions_being_recorded.push(instr)
        }
        this.display_message("Dexter's fingers closed.")
        talk_maybe_make_object()
    }
}
function talk_maybe_make_object(){
    let dex = Talk.job_for_normal_moves.robot
    let j7_angle = dex.rs.angle(7)
    if(j7_angle >= 20) { //means we must be holding an object
        let j7_angle_absolute = Math.max((j7_angle - 20), 0) //when closed its 20 degrees, 270 when fully open
        let j7_max_angle = 270
        let j7_min_angle = 20
        let j7_max_absolute = j7_max_angle = 20
        let proportion_of_j7_angle = j7_angle_absolute / j7_max_absolute
        let max_gripper_distance = 40 //20 == 40, so j7_angle_absolute = ?
        let gripper_distance = max_gripper_distance * proportion_of_j7_angle
        let new_name = SimObj.unique_name_for_object3d_or_null() //generates a new name each time
        let xyz = dex.rs.xyz()[0]
        let object3d = SimObj.make_object3d({
            name: new_name,
            position: [xyz],
            scale: [gripper_distance, gripper_distance, gripper_distance],
            is_dynamic: true
        })
    }
}
new TalkCommand({
    name: "grasp",
    alternate_names: ["grab"],
    action_function: talk_grasp_action_function,
    row: "new",
    tooltip: "Close the gripper around the object between its fingers."})

function talk_ungrasp_action_function(aCAT){
    if(aCAT._content_str === ""){
        let dex = Talk.job_for_normal_moves.robot
        let instr = [
            IO.out("first upgrasp instr."),
            dex.ungrasp, //a fn def
            dex.empty_instruction_queue(),
            function() {
                Talk.stop_aux("Dexter's fingers opened.")
            }
        ]
        globalThis.talk_send_instruction_to_dexter(instr) //will cause Job[recording_name] to run
        if(TalkMode.move.is_recording) {
            TalkMode.move.instructions_being_recorded.push(instr)
        }
        this.display_message("Dexter's fingers opened.")
    }
}

new TalkCommand({
    name: "ungrasp",
    alternate_names: ["ungrab"],
    action_function: talk_ungrasp_action_function,
    tooltip: "Open the gripper's fingers."})

new TalkCommand({
    name: "main menu",
    alternate_names: ["main", "maine menu", "maine"],
    action_function: globalThis.talk_main_menu_action_function,
    row: "new",
    tooltip: "Change the menu of commands back to the main menu."})

new TalkCommand({
    name: "move menu",
    alternate_names: ["move"],
    action_function: globalThis.talk_move_menu_action_function,
    tooltip: "Change this dialog box to show commands that move Dexter."} )

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


