
function run_instruction_move_all_joints_args_string(vals, relative=false){
    let result = ""
    for(let j = 1; j <= 7; j++){
         let id_str = "J" + j + "_id"
         let val = vals[id_str]
         if (val == null) { val = (relative? "0": "[0]") }
         else { val = "" + val }
         result += val
         if (j < 7) { result += ", " }
    }
    return "[" + result + "]"
}

function run_instruction_move_to_args_string(vals){
    const xyz = "[" +
                ((vals.X_id || (vals.X_id == 0)) ? vals.X_id : "[0]") + ", " +
                ((vals.Y_id || (vals.Y_id == 0)) ? vals.Y_id : "[0]") + ", " +
                ((vals.Z_id || (vals.Z_id == 0)) ? vals.Z_id : "[0]") +
                "]"
    const J5_dir = "[" +  ((vals.angles_xyz == "angles") ?
        vals.J5_direction_x_angle_id + ", " + vals.J5_direction_y_angle_id :
        vals.J5_direction_xyz_x_id + ", " + vals.J5_direction_xyz_y_id + ", " + vals.J5_direction_xyz_z_id) +
        "]"
    const config = "Dexter." + vals.left_right + "_" + vals.up_down + "_" + vals.in_out
    return xyz + ", " + J5_dir + ", " + config
}

function handle_run_instruction(vals){
    const dex_name = vals.dex_name_id
    const dex = Robot[dex_name]
    var instr_src = ""
    if (vals.clicked_button_value == "Insert Dexter Def") {
        insert_dexter_def(vals.dex_name_id)
        return
    }
    else if (vals.clicked_button_value == "mode_name") {
       instr_src = vals[vals.clicked_button_value]
    }
    else if (vals.clicked_button_value == "Empty Instr Queue"){
        instr_src = "Dexter.empty_instruction_queue_immediately()"
    }
    else if (vals.clicked_button_value == "move_to"){
        instr_src    = "Dexter.move_to(" + run_instruction_move_to_args_string(vals) + ")"
    }
    else if (vals.clicked_button_value == "move_to_relative"){
        const arg = "[" +
                     (vals.X_id ? vals.X_id : 0) + ", " +
                     (vals.Y_id ? vals.Y_id : 0) + ", " +
                     (vals.Z_id ? vals.Z_id : 0) +
                    "]"
        instr_src = "Dexter.move_to_relative(" + arg + ")"
    }
    else if (vals.clicked_button_value == "move_all_joints"){   
        const arg = run_instruction_move_all_joints_args_string(vals) //[vals.J1_id, vals.J2_id, vals.J3_id, vals.J4_id, vals.J5_id]
        instr_src = "Dexter.move_all_joints(" + arg + ")"
    }
    else if (vals.clicked_button_value == "move_all_joints_relative"){
        const arg = run_instruction_move_all_joints_args_string(vals, true)
        instr_src = "Dexter.move_all_joints_relative(" + arg + ")"
    }
    else if (vals.clicked_button_value == "set_parameter"){
        instr_src = 'Dexter.set_parameter("' + vals.set_param_name_id + '", ' + vals.set_param_value + ")"
    }
    else if (vals.clicked_button_value == "dexter_instructions_id"){
        const sel_instr_name = vals.dexter_instructions_id
        if(sel_instr_name == "Dexter.move_to_straight"){
            instr_src    = "Dexter.move_to_straight(" + run_instruction_move_to_args_string(vals) + ")"
        }
        else if(sel_instr_name == "Dexter.move_to"){
            instr_src    = "Dexter.move_to(" + run_instruction_move_to_args_string(vals) + ")"
        }
        else if(sel_instr_name == "Dexter.move_to_relative"){
            const arg = [vals.X_id, vals.Y_id, vals.Z_id]
            instr_src = "Dexter.move_to_relative([" + arg + "])"
        }
        else if(sel_instr_name == "Dexter.move_all_joints"){
            const arg = run_instruction_move_all_joints_args_string(vals)
            instr_src = "Dexter.move_all_joints(" + arg + ")"
        }
        else if(sel_instr_name == "Dexter.move_all_joints_relative"){
            const arg = run_instruction_move_all_joints_args_string(vals, true)
            instr_src = "Dexter.move_all_joints_relative(" + arg + ")"
        }
        else if(sel_instr_name == "Dexter.set_parameter"){
            instr_src = 'Dexter.set_parameter("' + vals.set_param_name_id + '", ' + vals.set_param_value + ")"
        }
        else {
            instr_src = vals.dexter_instructions_id + "(" + ")"
        }
    }
    else if (vals.clicked_button_value == "run"){
        instr_src = src_of_run_instruction()
    }
    else if (vals.clicked_button_value == "insert"){
        Editor.insert(src_of_run_instruction() + "\n")
        return
    }
    else if (vals.clicked_button_value == "job"){
        let src = vals.mode_name
        let src_of_run_ins = src_of_run_instruction()
        if (src_of_run_ins != src) {
            src += ",\n                   " + src_of_run_ins
        }
        src = '\nnew Job({name: "my_job",\n' +
              '         robot: Robot.' + vals.dex_name_id + ',\n' +
              '         do_list: [' + src +
              '\n                  ]})\n'
        Editor.insert(src)
        return
    }
    if(instr_src === "") {
        warning("Please click on a non-blank mode in the Run Instruction dialog box.")
        return
    }
    var args_source = instr_src.substring(instr_src.indexOf("(") + 1, instr_src.length - 1)
    run_src_id.value = args_source
    var instr_name = instr_src.substring(0, instr_src.indexOf("("))
    var instr_select_index = null
    for(var i = 0; i < dexter_instructions_id.options.length; i++){
        var opt_elt = dexter_instructions_id.options[i]
        if (opt_elt.value == instr_name) {
            instr_select_index = i
            break
        }
    }
    dexter_instructions_id.selectedIndex = instr_select_index
    onchange_run_instruction_src_aux(instr_name)
    if (vals.clicked_button_value != "dexter_instructions_id"){
        var instr = eval(instr_src)
        dex.run_instruction_fn(instr)
    }
}

function onchange_run_instruction_src(){
    const instr_name = dexter_instructions_id.value
    onchange_run_instruction_src_aux(instr_name)
    run_src_id.value = ""
}

function onchange_run_instruction_src_aux(instr_name){
    const instr_fn = value_of_path(instr_name)
    const instr_params = trim_all(Utils.function_params(instr_fn))
    var font_size = "14px"
    if (instr_params.length > 80) {
        font_size = "10px"
    }
    run_instruction_params_id.style.fontSize = font_size
    run_instruction_params_id.innerHTML = instr_params
    const details_elt_name = instr_name + "_doc_id"
    const details_elt = window[details_elt_name]
    if (details_elt) { DocCode.open_doc(details_elt) }
}

function src_of_run_instruction(){
    return dexter_instructions_id.value + "(" + run_src_id.value + ")"
}

function make_robots_select_html(){
  var result = "<select name='dex_name_id' style='font-size:14px;width:130px;'>"
  for(let name of Dexter.all_names){
    result += "<option>" + name + "</option>"
  }
  result += "</select>"
  return result
}

function make_modes_select_html(){
  var result = "<select name='mode_name' title='Changing this will send a mode change instruction to Dexter.' " +
                       "style='font-size:14px;width:200px;margin:8px;' data-onchange='true'>" +
                       " <option title='Please select a non-blank mode'></option> " //needs to be blank when dialog first comes up.
  for(let name of ["set_open_loop", "set_follow_me", "set_force_protect", "set_keep_position"]){
    result += "<option>Dexter." + name + "()</option>"
  }
  result += "</select>"
  return result
}

function make_set_parameter_name_html(){
    let result = '<div id="set_param_name_id" class="combo_box" style="display:inline-block;vertical-align:middle;width:130px;">'
    for(let param_name of Series.id_to_series("series_set_parameter_name_id").array){
        result += "<option>" + param_name + "</option>"
    }
    result += "</div>"
    return result
}

function make_dexter_instructions_html(){
    let result = '<select id="dexter_instructions_id" style="width:170px;" data-onchange="true">' // onchange="onchange_run_instruction_src()"
    for(let instr_name of Series.id_to_series("series_robot_instruction_id").array){
        if(!instr_name.startsWith("Serial")) {
            result += "<option>" + instr_name + "</option>"
        }
    }
    result += "</select>"
    return result
}

function J5_direction_to_xyz_html(){
    const new_xyz = Kin.angles_to_dir_xyz(J5_direction_x_angle_id.value, J5_direction_y_angle_id.value)
    const html = 'x: <input id="J5_direction_xyz_x_id" type="number" value="' + new_xyz[0] + '" step="0.1" style="width:75px;"/><br/>' +
                 'y: <input id="J5_direction_xyz_y_id" type="number" value="' + new_xyz[1] + '" step="0.1" style="width:75px;"/><br/>' +
                 'z: <input id="J5_direction_xyz_z_id" type="number" value="' + new_xyz[2] + '" step="0.1" style="width:75px;"/>'
    J5_direction_args_id.innerHTML = html
    return html
}

function J5_direction_to_angles_html(){
    var new_angles = [0, 0]
    if (window.J5_direction_xyz_x_id) {
        const xyz_array = [J5_direction_xyz_x_id.value, J5_direction_xyz_y_id.value, J5_direction_xyz_z_id.value]
        if ((xyz_array[0] == 0) && (xyz_array[1] == 0) && (xyz_array[2] == -1)){
            new_angles = [0, 0]
        }
        else {
            try { new_angles = Kin.dir_xyz_to_angles(xyz_array)
            }
            catch(err){
                warning("Cannot convert J5_direction from xyz: " + xyz_array + " to angles<br/>" +
                        "because they contain singularities at 90 degrees.")
                angles_xyz_xyz_id.checked = "checked" //set radio button back to where it should be, ie "unchanged"
                return
            }
        }
    }
    const html = 'x: <input id="J5_direction_x_angle_id" type="number" value="' + new_angles[0] + '" step="5" style="width:75px;" checked /><br/>' +
                 'y: <input id="J5_direction_y_angle_id" type="number" value="' + new_angles[1] + '" step="5" style="width:75px;"/>'
    J5_direction_args_id.innerHTML = html
}

function insert_dexter_def(dex_name){
   let ip_addr = Robot[dex_name].ip_address
   Editor.insert('new Dexter({' +
                 'name: "' + dex_name +
                 '",\n            ip_address: "' + ip_addr + '"})')
}

export function run_instruction(){
show_window({content:
"Send instruction to: " +
make_robots_select_html() +
" &nbsp;&nbsp;&nbsp;<input type='button' value='Insert Dexter Def' " +
  "title='Insert the definition of the selected Dexter into the editor.' " +
  "/>" +
`<br/>
 Change mode to:` + make_modes_select_html() +
 '<input type="button" value="Empty Instr Queue" title="Dexter.empty_instruction_queue_immediately()"/>' +
 `<table>
 <tr><td><input type="button" value="move_to" title="Dexter.move_to(xyz, ...)"/> 
         <input type="button" value="rel" name="move_to_relative" title="Dexter.move_to_relative(delta_xyz)"/>
     </td>
     <td><input type="button" value="move_all_joints" title="Dexter.move_all_joints(array_of_angles)"/>
         <input type="button" value="rel" name="move_all_joints_relative" title="Dexter.move_all_joints_relative(delta_angles)"/>
     </td>
     <td><input type="button" value="set_parameter" title="Dexter.set_parameter(name, value)"/></td>
 </tr>
 <tr><td>X:<input name="X_id"  type="number" value=0 title="Blank means no change." step="0.01" style="width:90px;"/><br/>
        <span style="margin-left:20px;font-size:10px;">meters</span>
 </td>
     <td>J1:   <input id="J1_id" type="number" value=0 title="Blank means no change." min="Dexter.J1_ANGLE_MIN" max="Dexter.J1_ANGLE_MAX" step="5" style="width:90px;"></input>
               <br style="height:10px;"/><span id="J1_range_id" style="font-size:10px;margin:0;padding-left:30px; padding-top:0px; padding-bottom:0px;"></span></td>
     <td>Name: ` + make_set_parameter_name_html() + `</td>
 </tr>
 <tr><td>Y:<input name="Y_id"  type="number" value=0.5 title="Blank means no change." step="0.01" style="width:90px;"/><br/>
         <span style="margin-left:20px;font-size:10px;">meters</span></td>
     <td>J2:    <input id="J2_id" type="number" value=0  title="Blank means no change." min="Dexter.J2_ANGLE_MIN" max="Dexter.J2_ANGLE_MAX" step="5" style="width:90px;"/>
                <br/><span id="J2_range_id" style="font-size:10px;margin:0;padding-left:30px"></span></td>
     <td>Value: <input name="set_param_value" type="number" value=0 style="width:90px;"/></td>
 </tr>
 <tr><td>Z:<input name="Z_id"   type="number" value=0.075 title="Blank means no change." step="0.01" style="width:90px;"/><br/>
        <span style="margin-left:20px;font-size:10px;">meters</span></td>
     <td>J3: <input id="J3_id"    type="number" value=0 title="Blank means no change." min="Dexter.J3_ANGLE_MIN" max="Dexter.J3_ANGLE_MAX" step="5" style="width:90px;"/>
             <br/><span id="J3_range_id" style="font-size:10px;margin:0;padding-left:30px"></span></td>
 </tr>
 <tr><td style="font-size:11px;"><b>J5_direction</b><br/>
           <input type="radio" name="angles_xyz" value="angles" onclick="J5_direction_to_angles_html()" checked/>angles       &nbsp;&nbsp;&nbsp;
           <input type="radio" name="angles_xyz" value="xyz"    onclick="J5_direction_to_xyz_html()" id="angles_xyz_xyz_id"/>xyz
           <div id="J5_direction_args_id">
           </div> 
     </td>
     <td>J4: <input id="J4_id" type="number" value=0 title="Blank means no change." step="5" style="width:90px;"/>
             <br/><span id="J4_range_id" style="font-size:10px;margin:0;padding-left:30px"></span></td>
 </tr>
 <tr style="border:0;">
    <td style="font-size:11px;"><b>config:</b><br/>
         <input type="radio" name="left_right" value="LEFT"/>left     &nbsp;&nbsp;&nbsp;&nbsp;            <input type="radio" name="left_right" value="RIGHT" checked/>right<br/> 
         <input type="radio" name="up_down"    value="UP" checked/>up &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;      <input type="radio" name="up_down"    value="DOWN"/>down<br/>
         <input type="radio" name="in_out"     value="IN"/>in         &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="radio" name="in_out"     value="OUT" checked/>out
    </td>
      <td>J5: <input id="J5_id" type="number" value=0 title="Blank means no change." min="Dexter.J5_ANGLE_MIN" max="Dexter.J5_ANGLE_MAX" step="5" style="width:90px;"/>
             <br/><span id="J5_range_id" style="font-size:10px;margin:0;padding-left:30px"></span></td>
 </tr>
 <tr style="border:0;">
    <td></td>
      <td>J6: <input id="J6_id" type="number" value="" title="Blank means no change." min="Dexter.J6_ANGLE_MIN" max="Dexter.J6_ANGLE_MAX" step="5" style="width:90px;"/>
             <br/><span id="J6_range_id" style="font-size:10px;margin:0;padding-left:30px"></span></td>
 </tr>
  <tr style="border:0;">
    <td></td>
      <td>J7: <input id="J7_id" type="number" value="" title="Blank means no change." min="Dexter.J7_ANGLE_MIN" max="Dexter.J7_ANGLE_MAX" step="5" style="width:90px;"/>
             <br/><span id="J7_range_id" style="font-size:10px;margin:0;padding-left:30px"></span></td>
    <td style="vertical-align:bottom; border:0;">
        <div style="margin-left:100px;">
            <input type="button" value="insert" title="Insert the below instruction source into the editor."/>
            <input type="button" value="job"    title="Insert the source for a Job&#013;that wraps the below instruction,&#013;into the editor."/>
        </div>
    </td>
 </tr>
 </table>
 <div id="run_instruction_params_id" style="margin-left:218px;"></div>
 <input type="button" value="run" title="Eval this source to make an instruction,&#013;then run it." style="margin:5px;"/>` +
 make_dexter_instructions_html() +
 `(<input id="run_src_id" type="text" onclick="DocCode.onclick_for_click_help(event)" style="width:255px;font-size:14px;"/>)
 `,
 title: "Run an Instruction on a Dexter",
 x: 250,
 y: 50,
 width:  550,
 height: 610,
 callback: handle_run_instruction})


  J1_range_id.innerHTML = Dexter.J1_ANGLE_MIN + " to " + Dexter.J1_ANGLE_MAX

  J2_id.min = Dexter.J2_ANGLE_MIN
  J2_id.max = Dexter.J2_ANGLE_MAX
  J2_range_id.innerHTML = Dexter.J2_ANGLE_MIN + " to " + Dexter.J2_ANGLE_MAX + " degrees"

  J3_id.min = Dexter.J3_ANGLE_MIN
  J3_id.max = Dexter.J3_ANGLE_MAX
  J3_range_id.innerHTML = Dexter.J3_ANGLE_MIN + " to " + Dexter.J3_ANGLE_MAX + " degrees"

  J4_id.min = Dexter.J4_ANGLE_MIN
  J4_id.max = Dexter.J4_ANGLE_MAX
  J4_range_id.innerHTML = Dexter.J4_ANGLE_MIN + " to " + Dexter.J4_ANGLE_MAX + " degrees"

  J5_id.min = Dexter.J5_ANGLE_MIN
  J5_id.max = Dexter.J5_ANGLE_MAX
  J5_range_id.innerHTML = Dexter.J5_ANGLE_MIN + " to " + Dexter.J5_ANGLE_MAX + " degrees"

  J5_direction_to_angles_html()

    J6_id.min = Dexter.J6_ANGLE_MIN
    J6_id.max = Dexter.J6_ANGLE_MAX
    J6_range_id.innerHTML = Dexter.J6_ANGLE_MIN + " to " + Dexter.J6_ANGLE_MAX + " degrees"

    J7_id.min = Dexter.J7_ANGLE_MIN
    J7_id.max = Dexter.J7_ANGLE_MAX
    J7_range_id.innerHTML = Dexter.J7_ANGLE_MIN + " to " + Dexter.J7_ANGLE_MAX + " degrees"


    const sel_text = Editor.get_any_selection()
  if (sel_text.length > 0) { run_src_id.value = sel_text }
}

