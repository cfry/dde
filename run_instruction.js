
function handle_run_instruction(vals){
    const dex_name = vals.dex_name_id
    const dex = Robot[dex_name]
    var instr
    if (vals.clicked_button_value == "mode_name") {
       const selected_mode = vals[vals.clicked_button_value]
       instr = Dexter[selected_mode]()
    }
    else if (vals.clicked_button_value == "Empty Instr Queue"){
        instr = Dexter.empty_instruction_queue_immediately
    }
    else if     (vals.clicked_button_value == "move_to"){
        const arg = [vals.X_id, vals.Y_id, vals.Z_id]
        instr = Dexter.move_to(arg)
    }
    else if(vals.clicked_button_value == "move_to_relative"){
        const arg = [vals.X_id, vals.Y_id, vals.Z_id]
        instr = Dexter.move_to_relative(arg)
    }
    else if (vals.clicked_button_value == "move_all_joints"){   
        const arg = [vals.J1_id, vals.J2_id, vals.J3_id, vals.J4_id, vals.J5_id]
        instr = Dexter.move_all_joints(arg)
    }
    else if (vals.clicked_button_value == "move_all_joints_relative"){
        const arg = [vals.J1_id, vals.J2_id, vals.J3_id, vals.J4_id, vals.J5_id]
        instr = Dexter.move_all_joints_relative(arg)
    }
    else if (vals.clicked_button_value == "set_parameter"){
        instr = Dexter.set_parameter(vals.set_param_name, vals.set_param_value)
    }
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
  var result = "<select name='mode_name' style='font-size:14px;width:180px;margin:8px;' data-onchange='true'>"
  for(let name of ["set_keep_position", "set_open_loop", "set_follow_me", "set_force_protect"]){
    result += "<option>" + name + "</option>"
  }
  result += "</select>"
  return result
}

function run_instruction(){
show_window({content:
"Send instruction to: " + make_robots_select_html() +
`<br/>
 <!--<input type="radio" name="abs_rel" checked="checked"/>Absolute &nbsp;
 <input type="radio" name="abs_rel"/>Relative-->
 Mode:` + make_modes_select_html() +
 '<input type="button" style="margin-left:55px;" value="Empty Instr Queue" title="empty_instruction_queue_immediately"/>' +
 `<table>
 <tr><td><input type="button" value="move_to"/> 
         <input type="button" value="rel" name="move_to_relative" title="move_to_relative"/>
     </td>
     <td><input type="button" value="move_all_joints"/>
         <input type="button" value="rel" name="move_all_joints_relative" title="move_all_joints_relative"/>
     </td>
     <td><input type="button" value="set_parameter"/></td>
 </tr>
 <tr><td>X:    <input name="X_id"  type="number" value=0 style="width:90px;"></input></td>
     <td>J1:   <input name="J1_id" type="number" value=0 style="width:90px;"></input></td>
     <td>Name: <input name="set_param_name" type="text" style="width:90px;"></input></td>
 </tr>
 <tr><td>Y:     <input name="Y_id"  type="number" value=0.5 style="width:90px;"></input></td>
     <td>J2:    <input name="J2_id" type="number" value=0 style="width:90px;"></input></td>
     <td>Value: <input name="set_param_value" type="number" value=0 style="width:90px;"></input></td>
 </tr>
 <tr><td>Z:  <input name="Z_id"   type="number" value=0.075 style="width:90px;"></input></td>
     <td>J3: <input name="J3_id"  type="number" value=0 style="width:90px;"></input></td>
 </tr>
 <tr><td></td>
     <td>J4: <input name="J4_id" type="number" value=0 style="width:90px;"></input></td>
 </tr>
 <tr><td></td>
     <td>J5: <input name="J5_id" type="number" value=0 style="width:90px;"></input></td>
 </tr>
 </table>
 `,
 title: "Run an Instruction on a Dexter",
 width: 480,
 height: 310,
 callback: handle_run_instruction})
}
