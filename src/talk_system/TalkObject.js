new TalkMode({name: "object",
    mode_misc_method: "object_mode_misc_action_function"
})

//mode_misc
function object_mode_misc_action_function(aCAT) {
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
    action_function: object_mode_misc_action_function,
    tooltip: "Run the named Job, or the GPT command."})

function talk_object_should_display_command(){
    return SimBuild.now_editing_object3d  //needs to be dynamically evalued. When there is no such obj, don't show most of the Object menu cmds.
}

function talk_make_object_action_function(ACAT) {
    let new_name = SimObj.unique_name_for_object3d_or_null() //generates a new name each time
    let object3d = SimObj.make_object3d({
        name: new_name
    })
    SimBuild.set_now_editing_object3d(object3d)
    Talk.set_mode(TalkMode.object)
}
new TalkCommand({
    name: "make object",
    action_function: talk_make_object_action_function,
    should_display: true,
    row: "new",
    tooltip: "Make a new object in the simulator."})

function talk_rename_object_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to rename.<br/>Use <b>make object</b> to create one.")
    }
    else {
        let new_name = aCAT.name
        SimObj.set_name(SimBuild.now_editing_object3d, new_name)
        SimBuild.populate_dialog_from_object(SimBuild.now_editing_object3d, true) //true forces redisplay even if already editing the object
    }
}
new TalkCommand({
    name: "rename",
    action_function: talk_rename_object_action_function,
    parameters: [new TalkParameter({
        name: "name",
        default_value_string: function() {
            if (SimBuild.now_editing_object3d) { return SimBuild.now_editing_object3d.name }
            else { return "my object 3d" }
        },
        type: new TalkTypeString({
            typical: ["my object 3d", "my object 3d 1"],
            typical_is_exclusive: false})})
    ],
    should_display: talk_object_should_display_command,
    tooltip: "Rename the selected object."})

function talk_edit_object_action_function(ACAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to edit.<br/>Use <b>make object</b> to create one.")
    }
    else {
        SimBuild.show_dialog(SimBuild.now_editing_object3d)
    }
}
new TalkCommand({
    name: "edit",
    action_function: talk_edit_object_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Edit the selected object."})

function talk_geometry_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to set the gemotetry of.<br/>Use <b>make object</b> to create one.")
    }
    else {
        SimObj.set_geometry(SimBuild.now_editing_object3d, aCAT.geometry)
    }
}

new TalkCommand({
    name: "geometry",
    action_function: talk_geometry_action_function,
    parameters: [new TalkParameter({
        name: "geometry",
        default_value_string: "box",
        type: new TalkTypeString({
                typical: SimBuild.geometry_names, //["box", "cylinder"],
                typical_is_exclusive: true})})
    ],
    should_display: talk_object_should_display_command,
    tooltip: "change the geometry (shape) of the current object."})

new TalkCommand({
    name: "stop",
    alternative_names: ["stop it", "halt", "off", "kill", "shit", "oh shit"],
    action_function: talk_stop_action_function, //globally defined in TalkMain.js
    should_display: talk_object_should_display_command,
    tooltip: "Stop changing the current object's attribute."})


function talk_bigger_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to make bigger.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_bigger_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_scale(SimBuild.now_editing_object3d)
        let new_xyz = [1, 1, 1]
        for(let i = 0; i < 3; i++){
            new_xyz[i] = old_xyz[i] * 1.02
        }
        SimObj.set_scale(SimBuild.now_editing_object3d, new_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_bigger_action_function(aCAT)
            }
        }, 200)
    }
}

new TalkCommand({
    name: "bigger",
    action_function: talk_bigger_action_function,
    row: "new",
    should_display: talk_object_should_display_command,
    tooltip: "Make the current object bigger."})

function talk_smaller_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to make smaller.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_smaller_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_scale(SimBuild.now_editing_object3d)
        let new_xyz = [1, 1, 1]
        for(let i = 0; i < 3; i++){
            new_xyz[i] = old_xyz[i] * 0.98
        }
        SimObj.set_scale(SimBuild.now_editing_object3d, new_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_smaller_action_function(aCAT)
            }
        }, 200)
    }
}

new TalkCommand({
    name: "smaller",
    action_function: talk_smaller_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Make the current object smaller."})

function talk_wider_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to make wider.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_wider_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_scale(SimBuild.now_editing_object3d)
        old_xyz[0] = old_xyz[0] * 1.02
        SimObj.set_scale(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_wider_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "wider",
    action_function: talk_wider_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Make the current object wider (bigger x axis)."})

function talk_narrower_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to make narrower.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_narrower_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true

        Talk.display_status()
        let old_xyz = SimObj.get_scale(SimBuild.now_editing_object3d)
        old_xyz[0] = old_xyz[0] * 0.98
        SimObj.set_scale(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_narrower_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "narrower",
    action_function: talk_narrower_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Make the current object narrower (bigger x axis)."})


function talk_deeper_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to make deeper.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_deeper_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_scale(SimBuild.now_editing_object3d)
        old_xyz[1] = old_xyz[1] * 1.02
        SimObj.set_scale(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_deeper_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "deeper",
    action_function: talk_deeper_action_function,
    should_display: talk_object_should_display_command,
    row: "new",
    tooltip: "Make the current object deeper (bigger y axis)."})

function talk_shallower_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to make shallower.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_shallower_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_scale(SimBuild.now_editing_object3d)
        old_xyz[1] = old_xyz[1] * 0.98
        SimObj.set_scale(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_shallower_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "shallower",
    action_function: talk_taller_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Make the current object taller (bigger z axis)."})

function talk_taller_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to make taller.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_taller_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_scale(SimBuild.now_editing_object3d)
        old_xyz[2] = old_xyz[2] * 1.02
        SimObj.set_scale(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_taller_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "taller",
    action_function: talk_taller_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Make the current object taller (bigger z axis)."})

function talk_shorter_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to make shorter.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_shorter_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_scale(SimBuild.now_editing_object3d)
        old_xyz[2] = old_xyz[2] * 0.98
        SimObj.set_scale(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_shorter_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "shorter",
    action_function: talk_shorter_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Make the current object shorter (smaller z axis)."})

function talk_left_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to move left.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_left_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_position(SimBuild.now_editing_object3d)
        old_xyz[0] = old_xyz[0] + 0.005
        SimObj.set_position(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_left_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "left",
    action_function: talk_left_action_function,
    row: "new",
    should_display: talk_object_should_display_command,
    tooltip: "Move the current object left (bigger x axis)."})

function talk_right_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to move right.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_right_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_position(SimBuild.now_editing_object3d)
        old_xyz[0] = old_xyz[0] - 0.005
        SimObj.set_position(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_right_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "right",
    alternative_names: ["write"],
    action_function: talk_right_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Move the current object right (smaller x axis)."})

function talk_front_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to move front.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_front_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_position(SimBuild.now_editing_object3d)
        old_xyz[1] = old_xyz[1] + 0.005
        SimObj.set_position(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_front_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "front",
    action_function: talk_front_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Move the current object front (bigger y axis)."})

function talk_back_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to move back.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_back_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_position(SimBuild.now_editing_object3d)
        old_xyz[1] = old_xyz[1] - 0.005
        SimObj.set_position(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_back_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "back",
    action_function: talk_back_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Move the current object back (smaller y axis)."})

function talk_up_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to move up.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_up_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_position(SimBuild.now_editing_object3d)
        old_xyz[2] = old_xyz[2] + 0.005
        SimObj.set_position(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_up_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "up",
    action_function: talk_up_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Move the current object up (bigger z axis)."})

function talk_down_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to move down.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_down_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_position(SimBuild.now_editing_object3d)
        old_xyz[2] = old_xyz[2] - 0.005
        SimObj.set_position(SimBuild.now_editing_object3d, old_xyz)
        setTimeout(function(){
            if(Talk.is_moving){
                talk_down_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "down",
    action_function: talk_down_action_function,
    should_display: talk_object_should_display_command,
    tooltip: "Move the current object down (smaller z axis)."})

function talk_orientation_action_function(aCAT) {
    if(!SimBuild.now_editing_object3d){
        Talk.display_warning("There is no current object to change orientation.<br/>Use <b>make object</b> to create one.")
    }
    else {
        if(TalkMode.move.current_move_command && (aCAT._cmd !== TalkMode.move.current_move_command)){
            talk_stop_action_function() //sets is_moving to false, current_move_command could even be from move_menu
            TalkMode.move.last_move_command = TalkMode.move.current_move_command
            TalkMode.move.current_move_command = null //so this IF clause won't hit again
            setTimeout(function() {  //give the new is_moving == false time to stop other ongoing moves.
                    talk_orientation_action_function(aCAT)},
                200)
            return
        }
        TalkMode.move.current_move_command = aCAT._cmd
        Talk.is_moving = true
        Talk.display_status()
        let old_xyz = SimObj.get_orientation(SimBuild.now_editing_object3d)
        let axis_index
        if     (aCAT.axis === "x") { axis_index = 0 }
        else if(aCAT.axis === "y") { axis_index = 1 }
        else if(aCAT.axis === "z") { axis_index = 2 }
        else { shouldnt("In talk_orientation_action_function, got invalid axis of: " + aCAT._axis) }
        let direction
        if(aCAT.direction === "clockwise")         { direction = 1 }
        else if(aCAT.direction === "counter clockwise") { direction = -1 }
        else { //should be caught eariler so this shouldn't be necessary
            Talk.display_warning("Orientation must be <b>clockwise</b> or <b>counter clockwise</b><br/>It can't be: <b>" + direction + "<br/>")
            return
        }
        old_xyz[axis_index] = old_xyz[axis_index] +  (1 * direction) //increment (or decrement) by 1 degree
        SimObj.set_orientation(SimBuild.now_editing_object3d, old_xyz) //even if we're just setting this array back to what I was, that's ok, still do it for side-effects
        setTimeout(function(){
            if(Talk.is_moving){
                talk_orientation_action_function(aCAT)
            }
        }, 200)
    }
}
new TalkCommand({
    name: "orientation",
    action_function: talk_orientation_action_function,
    parameters: [new TalkParameter({
                    name: "axis",
                    default_value_string: "z",
                    type: new TalkTypeString({
                        typical: ["x", "y", "z"],
                        typical_is_exclusive: true})}),
                new TalkParameter({
                    name: "direction",
                    default_value_string: "clockwise",
                    type: new TalkTypeString({
                        typical: ["clockwise", "counter clockwise"],
                        typical_is_exclusive: true})})

    ],
    should_display: talk_object_should_display_command,
    tooltip: "Rotate the current object around its x, y, or z axis, either clockwise or counter clockwise"
})


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

new TalkCommand({
    name: "pick menu",
    alternate_names: ["pick"],
    action_function: globalThis.talk_pick_menu_action_function,
    tooltip: "Change this dialog box to pick and place objects."} )