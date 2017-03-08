/**
 * Created by Fry on 1/17/16.
 */

function dex(){} //just a namespace

dex.train_task_names = [] //don't put this in the init as we want it to persist accross tasks, whe user clicks New task
dex.train_dex_pos_x = 0
dex.train_dex_pos_y = 0
dex.train_dex_pos_z = 0
dex.train_gripper_opening = 0

dex.init_train = function(){
    // these are per training window use and get reinited when new training window is opened
    dex.train_task_name    = ""
    dex.train_action_names = []
    dex.train_action_name_to_pure_code = {} //keys of action names, values of the code without function prefix or trailing comments.
    //dex.train_number_of_insertions = 0
    dex.train_halt_the_pause_by_example = false
    dex.train_pause_start_ms = 0
    dex.train_task_for_loops_made = 0
}

dex.post_creation_window_init = function(){
    var vals = {} //we don't have any as we're just initing
    var new_win_default_name = "task_" + (dex.train_task_names.length + 1)
    dex.set_in_window(undefined, "task_name", "value", new_win_default_name)
    dex.fill_in_task_names(vals)
}

dex.get_dexter_position = function(){
    return [dex.train_dex_pos_x, dex.train_dex_pos_y, dex.train_dex_pos_z]
}

dex.set_dexter_position = function(array3){
    dex.train_dex_pos_x = array3[0]
    dex.train_dex_pos_y = array3[1]
    dex.train_dex_pos_z = array3[2]
}

dex.handle_train_task_fn_start = function(vals){
    //returns empty string unless the "function ..." code needed, in which case it returns it
    var fn_start = ""
    if(dex.train_action_names.length == 0){
        dex.train_task_name = vals.task_name
        fn_start = "function " + clean_action_or_task_name(vals.task_name) + "(){ //task \n"
    }
    return fn_start
}

dex.simulate_user_moving_dexter = function(){
    dex.train_dex_pos_x = Math.floor(Math.random() * 600)
    dex.train_dex_pos_y = Math.floor(Math.random() * 600)
    dex.train_dex_pos_z = Math.floor(Math.random() * 600)
}

dex.fill_in_empty_position_values_from_dexter = function(vals){
    var val_names_from_dexter = []
    if ((vals.x == "") || (vals.x == null)) {vals.x = dex.train_dex_pos_x; val_names_from_dexter.push("x")}
    if ((vals.y == "") || (vals.y == null)) {vals.y = dex.train_dex_pos_y; val_names_from_dexter.push("y")}
    if ((vals.z == "") || (vals.z == null)) {vals.z = dex.train_dex_pos_z; val_names_from_dexter.push("z")}
    return val_names_from_dexter
}

dex.insert_etc = function(pure_code, code, vals){
    Editor.insert(code)
    //dex.train_number_of_insertions += 1 //the next index
    dex.train_action_name_to_pure_code[clean_action_or_task_name(vals.action_name)] = pure_code //for Do action button
    dex.train_action_names.push(clean_action_or_task_name(vals.action_name))
    var action_options = ""
    for(var act of dex.train_action_names){
        action_options += "<option>" + act + "</option>"
    }
    dex.set_in_window(vals.window_index, "do_action_action_names",      "innerHTML", action_options)
    dex.set_in_window(vals.window_index, "repeat_from_action_names",    "innerHTML", action_options)
    dex.set_in_window(vals.window_index, "repeat_through_action_names", "innerHTML", action_options)

    var new_action_name_default = "action_" + (dex.train_action_names.length + 1) //make this 1 baed so that the instruction "click to add the 1st action ..." will make most sense.
    dex.set_in_window(vals.window_index, "action_name", "value", new_action_name_default)
    dex.replace_top_instruction_line(vals)
}

dex.replace_top_instruction_line = function(vals, text){
    if (text == null){
        var index = dex.train_action_names.length + 1
        var index_string =  integer_to_ordinal(index)
        text = "Click on a button below to add the " + index_string + " action to this task."
    }
    text = "<i>" + text + "</i>">
    dex.set_in_window(vals.window_index, "top_instruction_line", "innerHTML", text)
}

//might be general utility so don't put it in dex package
function integer_to_ordinal(int){
//Given an integer, return the appropriate string.
//use "th" except if last digit is 1, 2, 3, except if we're between 11 and 13 inclusive.
    var int_str = "" + int
    var last_char = int_str[int_str.length - 1]
    var last_int = parseInt(last_char)
    var suffix
    if (int == 11) suffix = "th"
    else if (int == 12) suffix = "th"
    else if (int == 13) suffix = "th"
    else if (last_int == 1) suffix = "st"
    else if (last_int == 2) suffix = "nd"
    else if (last_int == 3) suffix = "rd"
    else suffix = "th"
    return int + suffix
}


dex.fill_in_task_names = function(vals){ //just called by New task
    /* var task_options = ""
   for (var task of dex.train_task_names){ //train_task_names whne this is called in new Task,
                                            //has just been extended with vals.task_name but
                                            //don't worry about recursion because we are now
                                            //getting OUT of the cur task and into a new one.
        task_options += "<option value='" + task + "'/>"
    }
    dex.set_in_window(vals.window_index, "task_names_datalist", "innerHTML", task_options)
    */
    dex.set_in_window(vals.window_index, "task_names", "combo_box_options", dex.train_task_names)
}


dex.set_in_window = function(window_index, elt_name, elt_attr_name, new_value){
    var jqxw_jq = get_window_of_index(window_index)
    var elt_jq = jqxw_jq.find("[name='" + elt_name + "']")
    if  (elt_attr_name == "innerHTML") {elt_jq[0].innerHTML = new_value}
    else if (elt_attr_name == "value") {elt_jq[0].value = new_value}
    else if (elt_attr_name.startsWith("style.")){
        var style_prop = elt_attr_name.split(".")[1]
        elt_jq.css(style_prop, new_value)
    }
    else if (elt_attr_name == "combo_box_options"){
        elt_jq.jqxComboBox({source: new_value, selectedIndex: 0})
    }
    else {elt_jq.attr(elt_attr_name, new_value)}
}

function clean_action_or_task_name(name){
    name = name.trim()
    name = name.replace(/   /g, " ") //replace 3 spaces with 1
    name = name.replace(/  /g, " ")  //replace 2 spaces with 1
    name = name.replace(/ /g, "_")   //replace 1 space with underscore
    return name
}

//in sandbox
function dex_handle_train(vals){ //not dex.handle_train because then I can't use the name in the show_window 2nd arg.
    //don't insert fn_start UNTIL the user does the first real action insert, so as making canceling easier
    if (vals.clicked_button_value == "Move"){
        dex.simulate_user_moving_dexter()
        var val_names_from_dexter = dex.fill_in_empty_position_values_from_dexter(vals)
        var val_names_string = val_names_from_dexter.join(",")
        if  (val_names_string != ""){
            val_names_string = val_names_string + " came from Dexter."
        }
        var pure_code = "    dex.move_to(" + vals.x + ", " + vals.y + ", " + vals.z + ")"
        var code = dex.handle_train_task_fn_start(vals) + pure_code + " //" +
                   clean_action_or_task_name(vals.action_name) + " " + val_names_string  + "\n"
        dex.insert_etc(pure_code, code, vals)
    }
    else if (vals.clicked_button_value == "Relative move"){
        var pure_code = "    dex.relative_move_to(" + vals.rel_x + ", " + vals.rel_y + ", " + vals.rel_z + ")"
        var code = dex.handle_train_task_fn_start(vals) + pure_code + " //" + clean_action_or_task_name(vals.action_name) + " \n"
        dex.insert_etc(pure_code, code, vals)
    }
    else if (vals.clicked_button_value == "Pause"){
        var secs = vals.pause_seconds
        if ((secs == null) || ((typeof(secs) == "string") && (secs.trim() == ""))) {
                dex.train_halt_the_pause_by_example = false
                dex.train_pause_start_ms = new Date().valueOf()
                var fn = function(){
                    var ending_ms = new Date().valueOf()
                    var secs =  (ending_ms - dex.train_pause_start_ms) / 1000.0
                    var the_window_index = vals.window_index
                    dex.set_in_window(the_window_index, "pause_seconds", "value", secs)
                    if (dex.train_halt_the_pause_by_example){
                        var pure_code = "    dex.pause_for(" + secs + ")"
                        var code = dex.handle_train_task_fn_start(vals) + pure_code + " //" + clean_action_or_task_name(vals.action_name) + " \n"
                        dex.insert_etc(pure_code, code, vals)
                    }
                    else {
                        setTimeout(arguments.callee, 100)
                    }
                }
            setTimeout(fn, 100)
        }
        else {
            var pure_code = "    dex.pause_for(" + secs + ")"
            var code = dex.handle_train_task_fn_start(vals) + pure_code + " //" + clean_action_or_task_name(vals.action_name) + " \n"
            dex.insert_etc(pure_code, code, vals)
        }
    }
    else if (vals.clicked_button_value == "Stop"){
        dex.train_halt_the_pause_by_example = true
    }
    else if (vals.clicked_button_value == "Do action"){
        //can't have any fn prefix because this can't be the first action, because no actions to copy
        var orig_action_name = vals.do_action_action_names
        var pure_code =  dex.train_action_name_to_pure_code[orig_action_name] //should get the chosed value
        var code = pure_code + " //" + clean_action_or_task_name(vals.action_name)  + //should be the NEW action name, not the one we're copying
                   " originally from: " + orig_action_name + " \n"
        dex.insert_etc(pure_code, code, vals)
    }
    else if (vals.clicked_button_value == "Do task"){
        var do_task_name = vals.task_names
        if (do_task_name == clean_action_or_task_name(vals.task_name)){
            out("Error: Do not specify to 'Do task' of<br/>" +
                "the current task you're creating because<br/>" +
                "that would cause infinite recursion.<br/>", "red")
        }
        else if (do_task_name == ""){
            out("Error: You did not specify a task name to do.<br/>", "red")
        }
        else{
            var pure_code = "    " + do_task_name + "()"
            var code = dex.handle_train_task_fn_start(vals) + pure_code +
                " //" + clean_action_or_task_name(vals.action_name) + " \n"
            dex.insert_etc(pure_code, code, vals)
        }
    }
    else if (vals.clicked_button_value == "Set gripper opening"){
        var pure_code =  "    dex.set_gripper_opening(" + vals.gripper_opening + ")"
        var code = dex.handle_train_task_fn_start(vals) + pure_code + " //" + clean_action_or_task_name(vals.action_name)  + " \n" //should be the NEW action name, not the one we're copying
        dex.insert_etc(pure_code, code, vals)
    }

    else if (vals.clicked_button_value == "Repeat"){
        Editor.train_for_loop_insert(clean_action_or_task_name(vals.task_name),
                                     vals.repeat_from_action_names,
                                     vals.repeat_through_action_names,
                                     vals.repeat_times,
                                     dex.train_task_for_loops_made) //so that on 2nd for loop, its var will be named j, not i
        dex.train_task_for_loops_made += 1
    }
    else if (vals.clicked_button_value == "Run Task"){
        Editor.run_unfinished_task(vals.task_name)
    }
    else if (vals.clicked_button_value == "New Task"){
        if (dex.train_action_names.length > 0){ //otherwise vals.task_name isn't a real task name
            Editor.insert("}\n\n" +  clean_action_or_task_name(vals.task_name) + "() //eval to perform this task\n\n")
            dex.train_task_names.push(clean_action_or_task_name(vals.task_name))
            dex.fill_in_task_names(vals)
            dex.replace_top_instruction_line(vals, "Click a button below to start this new task.")
        }
        dex.init_train()
        var new_default_task_name = "task_" + (dex.train_task_names.length + 1)//1 based names, just line action names need to be
        dex.set_in_window(vals.window_index, "task_name", "value", new_default_task_name)
        dex.set_in_window(vals.window_index, "action_name", "value", "action_1")
    }
    else if (vals.clicked_button_value == "Done"){
        if (dex.train_action_names.length > 0){ //otherwise we havent' made a real task.
            Editor.insert("}\n\n" +  clean_action_or_task_name(vals.task_name) + "() //eval to perform this task\n\n")
            dex.train_task_names.push(clean_action_or_task_name(vals.task_name))
        }
    }
}
//var next_index_for_task_default_name = 0 //must be here for ui env, can't use length of tasks becaue that's in snadvox

dex.train = function(){ //happens in ui env, called from Insert menu item when user chooses "train" item
    dex.init_train()
    var task_name = "task_" //+ (dex.train_task_names.length + 1)
    //next_index_for_task_default_name += 1
    show_window({content:
`<div style="font-size:12px;margin-bottom:5px;" name="top_instruction_line"><i>Click on a button below to add the first action to this task.</i></div>
<span title="Task Name must be unique\nin this DDE session.\nSet only before first button click.">Task Name: </span>
    <input type="text" name="task_name" value="`+ task_name + `" style="width:100px;margin-bottom:15px;"/> &nbsp;
<span title="Action Name must be unique\nin this task.">Action Name: </span>
    <input type="text" name="action_name" value="action_1"  style="width:100px;"/><br/>

<input type="button" value="Move" style="margin-right:53px;margin-bottom:15px;"
    title="Empty values will be captured from Dexter.\nFilled in values will move Dexter."/> to
     x: <input type="number" name="x" style="width:70px;"/>
     y: <input type="number" name="y" style="width:70px;"/>
     z: <input type="number" name="z" style="width:70px;"/><br/>

<input type="button" value="Relative move" style="margin-bottom:15px;"
    title="Increment Dexter's x, y and z\naccording to the entered values."/> to
     x: <input type="number" name="rel_x" value="0" style="width:70px;"/>
     y: <input type="number" name="rel_y" value="0" style="width:70px;"/>
     z: <input type="number" name="rel_z" value="0" style="width:70px;"/><br/>

<input type="button" value="Pause" style="margin-bottom:15px;"
    title="When you click Pause,\nif 'seconds' is blank,\nstart a timer."/>
    for <input type="number" name="pause_seconds" value="" style="width:70px;"/> seconds. &nbsp;
        <input type="button" value="Stop" title="Stop the pause-duration timer"/><br/>

<input type="button" value="Do action" style="margin-bottom:15px;"
    title="Have Dexter perform\nthe previously made named action\nwithin this task\nonce more."/>
        <select name="do_action_action_names"></select> again. &nbsp;
<input type="button" value="Do task" title="Tell Dexter to run\nany previously defined named task.\nDo not specify the current task."/>
        <!-- doesnt work <input name="task_names_old" list="task_names_datalist_id" style="width:100px;"/>
        <datalist id="task_names_datalist_id" name="task_names_datalist"></datalist><br/> --><!-- I needed this for combo box behavior -->
<div name="task_names" class="combo_box" style="display:inline-block;vertical-align:middle;"></div><br/>
<input type="button" value="Repeat" style="margin-bottom:15px;"
    title="Loop over the actions\nbetween 'from' and 'through'\nthe indicated number of times."/> from
        <select name="repeat_from_action_names"></select> through
        <select name="repeat_through_action_names"></select> ,
        <input type="number" name="repeat_times" value="2" style="width:40px;"/> times.<br/>

<input type="button" value="Set gripper opening" style="margin-bottom:15px;"
    title="Change Dexter's gripper gap\nto the given millimeters."/> to
        <input type="number" name="gripper_opening" value="0" style="width:70px;"/> mm.<br/>
<hr/>
<center>
<!--<input type="button" value="Delete Current Task"/> &nbsp;&nbsp; -->
<input type="button" value="Run Task"                           title="Run the current task\nfrom the beginning to the editor cursor."/>
<input type="button" value="New Task" style="margin-left:30px;" title="Complete the current task\nand start a new one."/>
<input type="submit" value="Done"     style="margin-left:30px;" title="Complete the current task\nand close this window."/>
</center>
`,
    title: '<span title="Create a set of actions for Dexter to perform.\nWrap them in a function representing the task.">' +
    'Train Dexter <i style="padding-left:100px;font-size:14px;">(simulation only)</i></span>',
    width:480, height:410, callback: dex_handle_train
})
    setTimeout(function(){dex.post_creation_window_init()}, 100) //needed to init the combo box for actions

}

dex.move_to = function(x, y ,z){
    dex.set_dexter_position([x, y, z])
    out("Dexter moved to: " + x +", " + y + ", " + z, "#338833")
}

dex.relative_move_to = function(x, y ,z){
    var dex_pos = dex.get_dexter_position()
    var new_x = dex_pos[0] + x
    var new_y = dex_pos[1] + y
    var new_z = dex_pos[2] + z
    dex.set_dexter_position([new_x, new_y, new_z])
    out("Dexter moved to: " + new_x +", " + new_y + ", " + new_z, "#338833")
}

dex.pause_for = function(seconds){
    out("Dexter pausing for: " + seconds + " seconds.", "#338833")
}

dex.set_gripper_opening = function(width){
    dex.train_gripper_opening = width
    out("Dexter gripper opening is: " + width, "#338833")
}

