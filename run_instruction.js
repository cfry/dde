
function handle_run_instruction(vals){
    const dex_name = vals.dex_name_id
    const dex = Robot[dex_name]
    var instr_src = ""
    if (vals.clicked_button_value == "mode_name") {
       instr_src = vals[vals.clicked_button_value]
    }
    else if (vals.clicked_button_value == "Empty Instr Queue"){
        instr_src = "Dexter.empty_instruction_queue_immediately()"
    }
    else if     (vals.clicked_button_value == "move_to"){
        const xyz = "[" + vals.X_id + ", " + vals.Y_id + ", " + vals.Z_id + "]"
        const J5_dir = "[" +  ((vals.angles_xyz == "angles") ?
                                   vals.J5_direction_angle_x_id + ", " + vals.vals.J5_direction_angle_y_id :
                                   vals.J5_direction_xyz_x_id + ", " + vals.J5_direction_xyz_y + ", " + vals.J5_direction_xyz_z) +
                       "]"
        const config = "Dexter." + vals.left_right + "_" + vals.up_down + "_" + vals.in_out
        instr_src    = "Dexter.move_to(" + xyz + ", " + J5_dir + ", " + config + ")"
    }
    else if(vals.clicked_button_value == "move_to_relative"){
        const arg = [vals.X_id, vals.Y_id, vals.Z_id]
        instr_src = "Dexter.move_to_relative(" + arg + ")"
    }
    else if (vals.clicked_button_value == "move_all_joints"){   
        const arg = [vals.J1_id, vals.J2_id, vals.J3_id, vals.J4_id, vals.J5_id]
        instr_src = "Dexter.move_all_joints(" + arg + ")"
    }
    else if (vals.clicked_button_value == "move_all_joints_relative"){
        const arg = [vals.J1_id, vals.J2_id, vals.J3_id, vals.J4_id, vals.J5_id]
        instr_str = "Dexter.move_all_joints_relative(" + arg + ")"
    }
    else if (vals.clicked_button_value == "set_parameter"){
        instr_src = 'Dexter.set_parameter("' + vals.set_param_name + '", ' + vals.set_param_value + ")"
    }
    else if (vals.clicked_button_value == "run"){
        instr_src = run_src_id.value
    }
    else if (vals.clicked_button_value == "insert"){
        if(run_src_id.value.length > 0){ Editor.insert(run_src_id.value) }
        else { warning("No code to insert.") }
        return
    }
    else if (vals.clicked_button_value == "job"){
        var src = vals.mode_name
        if(run_src_id.value.length > 0){
           src += ",\n                   " + run_src_id.value
        }
        src = '\nnew Job({name: "my_job",\n' +
              '         robot: Robot.' + vals.dex_name_id + ',\n' +
              '         do_list: [' + src +
              '\n                  ]})\n'
        Editor.insert(src)
        return
    }
    run_src_id.value = instr_src
    var instr = eval(instr_src)
    dex.run_instruction_fn(instr)
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
  var result = "<select name='mode_name' style='font-size:14px;width:200px;margin:8px;' data-onchange='true'>"
  for(let name of ["set_keep_position", "set_open_loop", "set_follow_me", "set_force_protect"]){
    result += "<option>Dexter." + name + "()</option>"
  }
  result += "</select>"
  return result
}

function make_set_parameter_name_html(){
    let result = '<div name="set_param_name" class="combo_box" style="display:inline-block;vertical-align:middle;width:130px;">'
    for(let param_name of Series.id_to_series("series_set_parameter_name_id").array){
        result += "<option>" + param_name + "</option>"
    }
    result += "</div>"
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
            try { new_angles = Kin.Kin.dir_xyz_to_angles(xyz_array)
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

function run_instruction(){
show_window({content:
"Send instruction to: " + make_robots_select_html() +
`<br/>
 <!--<input type="radio" name="abs_rel" checked="checked"/>Absolute &nbsp;
 <input type="radio" name="abs_rel"/>Relative-->
 Mode:` + make_modes_select_html() +
 '<input type="button" style="margin-left:55px;" value="Empty Instr Queue" title="Dexter.empty_instruction_queue_immediately()"/>' +
 `<table>
 <tr><td><input type="button" value="move_to" title="Dexter.move_to(xyz, ...)"/> 
         <input type="button" value="rel" name="move_to_relative" title="Dexter.move_to_relative(delta_xyz)"/>
     </td>
     <td><input type="button" value="move_all_joints" title="Dexter.move_all_joints(array_of_5_angles)"/>
         <input type="button" value="rel" name="move_all_joints_relative" title="Dexter.move_all_joints_relative(delta_angles)"/>
     </td>
     <td><input type="button" value="set_parameter" title="Dexter.set_parameter(name, value)"/></td>
 </tr>
 <tr><td>X:    <input name="X_id"  type="number" value=0 step="0.01" style="width:90px;"/></td>
     <td>J1:   <input id="J1_id" type="number" value=0 min="Dexter.J1_ANGLE_MIN" max="Dexter.J1_ANGLE_MAX" step="5" style="width:90px;"></input>
               <br style="height:10px;"/><span id="J1_range_id" style="font-size:10px;margin:0;padding-left:30px; padding-top:0px; padding-bottom:0px;"></span></td>
     <td>Name: ` + make_set_parameter_name_html() + `</td>
 </tr>
 <tr><td>Y:     <input name="Y_id"  type="number" value=0.5 step="0.01" style="width:90px;"/></td>
     <td>J2:    <input id="J2_id" type="number" value=0  step="5" style="width:90px;"/>
                <br/><span id="J2_range_id" style="font-size:10px;margin:0;padding-left:30px"></span></td>
     <td>Value: <input name="set_param_value" type="number" value=0 style="width:90px;"/></td>
 </tr>
 <tr><td>Z:  <input name="Z_id"   type="number" value=0.075 step="0.01" style="width:90px;"/></td>
     <td>J3: <input id="J3_id"    type="number" value=0 step="5" style="width:90px;"/>
             <br/><span id="J3_range_id" style="font-size:10px;margin:0;padding-left:30px"></span></td>
 </tr>
 <tr><td style="font-size:11px;"><b>J5_direction</b><br/>
           <input type="radio" name="angles_xyz" value="angles" onclick="J5_direction_to_angles_html()" checked/>angles       &nbsp;&nbsp;&nbsp;&nbsp;
           <input type="radio" name="angles_xyz" value="xyz"    onclick="J5_direction_to_xyz_html()" id="angles_xyz_xyz_id"/>xyz
           <div id="J5_direction_args_id">
           </div> 
     </td>
     <td>J4: <input id="J4_id" type="number" value=0 step="5" style="width:90px;"/>
             <br/><span id="J4_range_id" style="font-size:10px;margin:0;padding-left:30px"></span></td>
 </tr>
 <tr style="border:0;">
    <td style="font-size:11px;"><b>config:</b><br/>
         <input type="radio" name="left_right" value="LEFT"/>left     &nbsp;&nbsp;&nbsp;&nbsp;            <input type="radio" name="left_right" value="RIGHT" checked/>right<br/> 
         <input type="radio" name="up_down"    value="UP" checked/>up &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;      <input type="radio" name="up_down"    value="DOWN"/>down<br/>
         <input type="radio" name="in_out"     value="IN"/>in         &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="radio" name="in_out"     value="OUT" checked/>out
    </td>
      <td>J5: <input id="J5_id" type="number" value=0 step="5" style="width:90px;"/>
             <br/><span id="J5_range_id" style="font-size:10px;margin:0;padding-left:30px"></span></td>
      
      <td style="vertical-align:bottom; border:0;">
        <div style="margin-left:100px;">
            <input type="button" value="insert" title="Insert the below instruction source into the editor."/>
            <input type="button" value="job"    title="Insert the source for a Job&#013;that wraps the below instruction,&#013;into the editor."/>
        </div>
      </td>
 </tr>
 </table>
 <input type="button" value="run" title="Eval this source to make an instruction,&#013;then run it." style="margin:5px;"/> 
 <input id="run_src_id" type="text" onclick="onclick_for_click_help(event)" style="width:435px;font-size:14px;"/>
 `,
 title: "Run an Instruction on a Dexter",
 x: 400,
 y: 50,
 width: 520,
 height: 520,
 callback: handle_run_instruction})
  J1_range_id.innerHTML = Dexter.J1_ANGLE_MIN + " to " + Dexter.J1_ANGLE_MAX

  J2_id.min = Dexter.J2_ANGLE_MIN
  J2_id.max = Dexter.J2_ANGLE_MAX
  J2_range_id.innerHTML = Dexter.J2_ANGLE_MIN + " to " + Dexter.J2_ANGLE_MAX

  J3_id.min = Dexter.J3_ANGLE_MIN
  J3_id.max = Dexter.J3_ANGLE_MAX
  J3_range_id.innerHTML = Dexter.J3_ANGLE_MIN + " to " + Dexter.J3_ANGLE_MAX

  J4_id.min = Dexter.J4_ANGLE_MIN
  J4_id.max = Dexter.J4_ANGLE_MAX
  J4_range_id.innerHTML = Dexter.J4_ANGLE_MIN + " to " + Dexter.J4_ANGLE_MAX

  J5_id.min = Dexter.J5_ANGLE_MIN
  J5_id.max = Dexter.J5_ANGLE_MAX
  J5_range_id.innerHTML = Dexter.J5_ANGLE_MIN + " to " + Dexter.J5_ANGLE_MAX

  J5_direction_to_angles_html()
  const sel_text = Editor.get_any_selection()
  if (sel_text.length > 0) { run_src_id.value = sel_text }
}
