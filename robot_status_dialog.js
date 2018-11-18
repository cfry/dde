/* No instances of this class are made.
   At most, only 1 dialog is shown at a time.
   Only 2 of the below methods are used outside this file:
      show   only called from the menu bar Jobs/show robot status item
      update_robot_status_table_maybe only called from Dexter.robot_done_with_instruction
*/

var RobotStatusDialog = class RobotStatusDialog{
//only called from the menu bar Jobs/show robot status item
//makes a new window, but not if one is already up.
    static show(event){
        if(RobotStatusDialog.window_up()) { warning("Robot Status is already shown.") }
        else {
            let robot = (Job.last_job? Job.last_job.robot : Robot.dexter0)
            let content = RobotStatusDialog.make_html_table(robot)
            show_window({content: content,
                title:  "<span style='font-size:16px;'>Robot Status of</span> " +
                RobotStatusDialog.make_names_menu_html(robot) +
                "<span style='font-size:12px;margin-left:10px;'> Updated: <span id='robot_status_window_time_id'>" + RobotStatusDialog.update_time_string() + "</span></span>" +
                " <button title='Defines and starts a Job&#13; that continually gets the robot status&#13;of the selected robot.&#13;Click again to stop that Job.'" +
                " onclick='RobotStatusDialog.run_update_job()'>run update job</button>",
                width:  860,
                height: 380
            })
            setTimeout(function(){
                update_robot_status_names_select_id.oninput=RobotStatusDialog.robot_name_changed
            }, 300)
        }
    }

    static window_up(){
        return (window.update_robot_status_names_select_id ? true : false)
    }

    //returns null if no update_robot_status window up, or if it doesn't have a robot selectec
    static selected_robot(){
        if (this.window_up()) {
            let rob_name = update_robot_status_names_select_id.value //might be "Choose" so no real window.
            let rob = Robot[rob_name] //rob will be undefined if rob_name is "Choose"
            if (rob) { return rob }
            else { return null }
        }
        else {return null}
    }

    static make_names_menu_html(robot){
        //broken chrome ignore's style on select and option, so sez stack overflow
        //but stack overflow sez use a style on optgroup. That doesn't work either.
        let result = "<select id='update_robot_status_names_select_id' " +
            "<optgroup style='font-size:18px;'>"
        for(let name of Dexter.all_names){
            let sel = ((name == robot.name) ? " selected" : "" )
            result += "<option" + sel + ">" + name + "</option>"
        }
        return result + "</optgroup></select>"
    }

    static update_time_string(){
        let d = new Date()
        return d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
    }

    //only called from Dexter.robot_done_with_instruction which
    //doesn't know if this robot is currently being shown in a dialog.
    //If its not, then do nothing. But if it is, then update the displayed values in the table.
    static update_robot_status_table_maybe(robot){
        let existing_shown_robot = this.selected_robot()
        if(existing_shown_robot && (existing_shown_robot == robot)){
            this.update_robot_status_table(robot)
        }
        else { } //do nothing.
    }

    //called after the table is created, to update it dynamically.
    static update_robot_status_table(robot){
        let robot_status = robot.robot_status
        if (this.window_up()) { //don't attempt to show if the window isn't up. this does repopulate window if its merely shrunken
            robot_status_window_time_id.innerHTML = this.update_time_string()
            for (let i = 0; i < robot_status.length; i++){
                let label    = Dexter.robot_status_labels[i]
                if ((label != null) && !label.startsWith("UNUSED")){
                    let val      = (robot_status ? robot_status[i] : "no status") //its possible that a robot will have been defined, but never actually run when this fn is called.
                    if((typeof(val) == "number") && (i >= 10)) { //display as a real float
                        val = to_fixed_smart(val, 3) //val.toFixed(3)
                    }
                    let elt_name = label + "_id"
                    window[elt_name].innerHTML = val
                }
            }
            START_TIME_id.title = date_integer_to_long_string(robot_status[Dexter.START_TIME])
            STOP_TIME_id.title  = date_integer_to_long_string(robot_status[Dexter.STOP_TIME])
            INSTRUCTION_TYPE_id.title = Robot.instruction_type_to_function_name(robot_status[Dexter.INSTRUCTION_TYPE])
            let xyz
            try      { xyz = robot.joint_xyz() } //gets xyz array for joint 5
            catch(e) { xyz = ["no status", "no status", "no status"] }
            MEASURED_X_id.innerHTML = this.format_measured_angle(xyz[0])
            MEASURED_Y_id.innerHTML = this.format_measured_angle(xyz[1])
            MEASURED_Z_id.innerHTML = this.format_measured_angle(xyz[2])
        }
    }

    //called only when user chooses a new robot to display the status of.
    static robot_name_changed(name){
        //when called from the UI, the "name" arg is bound to the event.
        if(typeof(name) != "string") {name = name.target.value}
        let robot = Robot[name]
        this.update_robot_status_table(robot)
    }

    static make_html_table(robot){
        //setting table class and using css to set fonts in th and td cells fails
        //let cs = " style='font-size:10pt;' " //cell style
        //let oplet = ds[Dexter.INSTRUCTION_TYPE]
        let robot_status = robot.robot_status
        let xyz
        try { xyz = robot.joint_xyz() } //gets xyz array for joint 5
        catch(e) {xyz = ["no status", "no status", "no status"] }
        let result =
            "<table class='robot_status_table'>" +
            "<tr><th></th>    <th>JOB_ID</th><th>INSTRUCTION_ID</th><th>START_TIME</th><th>STOP_TIME</th><th>INSTRUCTION_TYPE</th></tr>" +
            Dexter.make_rs_row(robot_status, "", "JOB_ID",      "INSTRUCTION_ID",      "START_TIME",      "STOP_TIME",      "INSTRUCTION_TYPE") +

            "<tr><th></th>    <th>ERROR_CODE</th><th>JOB_ID_OF_CI</th><th>CURRENT_INSTR</th><th>RECORD_BLOCK_SIZE</th><th>END_EFFECTOR_IN</th></tr>" +
            Dexter.make_rs_row(robot_status, "", "ERROR_CODE",      "JOB_ID_OF_CURRENT_INSTRUCTION",      "CURRENT_INSTRUCTION_ID",      "RECORD_BLOCK_SIZE",      "END_EFFECTOR_IN") +

            "<tr><th></th>         <th>Joint 1</th><th>Joint 2</th><th>Joint 3</th><th>Joint 4</th><th>Joint 5</th><th>Joint 6</th><th>Joint 7</th></tr>" +
            Dexter.make_rs_row(robot_status, "ANGLE",     "J1_ANGLE",     "J2_ANGLE",     "J3_ANGLE",     "J4_ANGLE",     "J5_ANGLE"    ) +
            Dexter.make_rs_row(robot_status, "DELTA",     "J1_DELTA",     "J2_DELTA",     "J3_DELTA",     "J4_DELTA",     "J5_DELTA"    ) +
            Dexter.make_rs_row(robot_status, "PID_DELTA", "J1_PID_DELTA", "J2_PID_DELTA", "J3_PID_DELTA", "J4_PID_DELTA", "J5_PID_DELTA") +
            //Dexter.make_rs_row(robot_status, "FORCE_CALC_ANGLE", "J1_FORCE_CALC_ANGLE", "J2_FORCE_CALC_ANGLE", "J3_FORCE_CALC_ANGLE", "J4_FORCE_CALC_ANGLE", "J5_FORCE_CALC_ANGLE") +
            Dexter.make_rs_row(robot_status, "A2D_SIN",   "J1_A2D_SIN",   "J2_A2D_SIN",   "J3_A2D_SIN",   "J4_A2D_SIN",   "J5_A2D_SIN"  ) +
            Dexter.make_rs_row(robot_status, "A2D_COS",   "J1_A2D_COS",   "J2_A2D_COS",   "J3_A2D_COS",   "J4_A2D_COS",   "J5_A2D_COS"  ) +
            //Dexter.make_rs_row(robot_status, "PLAYBACK",  "J1_PLAYBACK",  "J2_PLAYBACK",  "J3_PLAYBACK",  "J4_PLAYBACK",  "J5_PLAYBACK" ) +
            Dexter.make_rs_row(robot_status, "MEASURED_ANGLE",    "J1_MEASURED_ANGLE",   "J2_MEASURED_ANGLE",   "J3_MEASURED_ANGLE",   "J4_MEASURED_ANGLE", "J5_MEASURED_ANGLE", "J6_MEASURED_ANGLE", "J7_MEASURED_ANGLE") +
            Dexter.make_rs_row(robot_status, "MEASURED_TORQUE",    null,                 null,                   null,                  null,                null,               "J6_MEASURED_TORQUE", "J7_MEASURED_TORQUE") +

            Dexter.make_rs_row(robot_status, "SENT",      "J1_SENT",      "J2_SENT",      "J3_SENT",      "J4_SENT",      "J5_SENT"     ) +
            //Dexter.make_rs_row(robot_status, "SLOPE",     "J1_SLOPE",     "J2_SLOPE",     "J3_SLOPE",     "J4_SLOPE",     "J5_SLOPE"    ) +
                    "<tr><th>J5 MEASURED X</th><td><span id='MEASURED_X_id' style='font-family:monospace;float:right;'>" + this.format_measured_angle(xyz[0]) +
            "</span></td><th>J5 MEASURED Y</th><td><span id='MEASURED_Y_id' style='font-family:monospace;float:right;'>" + this.format_measured_angle(xyz[1]) +
            "</span></td><th>J5 MEASURED Z</th><td><span id='MEASURED_Z_id' style='font-family:monospace;float:right;'>" + this.format_measured_angle(xyz[2]) +
            "</span></td></tr>" +
            "</table>"
        return result
    }

    static format_measured_angle(angle) {
        if (angle == "no status") { return angle }
        else { return to_fixed_smart(angle, 3) + "m" }
    }

    static make_rs_row(robot_status, ...fields){
        let result   = "<tr>"
        let on_first = true
        let row_header = fields[0]
        let do_decimal_processing = row_header != ""
        //let is_angle = fields[0].endsWith("ANGLE")
        //let degree_html = (is_angle ? "&deg;" : "")
        for(let field of fields){
            let val = (robot_status ? robot_status[Dexter[field]] : "no status")
            if(on_first) {
                result += "<th>" + field + "</th>"
                on_first = false
            }
            else if ((typeof(val) == "string") && (val.length == 1)) { //oplet
                result += "<td title='" +
                    Robot.instruction_type_to_function_name(val) +
                    "' id='" + field + "_id'>" +
                    val + "</td>"
            }
            else if (field == "TIME"){
                result += "<td title='" +
                    date_integer_to_long_string(val) +
                    "' id='" + field + "_id'>" +
                    val + "</td>"
            }
            else if (row_header != "") { //body of table, expect floating point numbers, float right
                val = to_fixed_smart(val, 3) //val.toFixed(3) //format_number(val)
                result += "<td>" +
                    "<span id='" + field + "_id' style='font-family:monospace;float:right;'>" + val + "</span>" +
                    //degree_html + not playing nicely with float right so skip for now.
                    "</td>"

            }
            /*else if (is_integer(val)){
                result += "<td style='font-family:monospace;' id='" + field + "_id'>" + val + degree_html + "</td>"
            }
            else if (typeof(val) == "number") { //it will be a float
                    val = val.toFixed(3) //format_number(val)
                    //val = val.substring(0, 12) //cut off precision because lots of prevision is
                          //useless, AND it makes the columns wider and narrower dynamically
                          //which is very distracting to read real time updates
                result += "<td>" +
                           "<span id='" + field + "_id' style='font-family:monospace;float:right;'>" + val + "</span>" +
                               //degree_html + not playing nicely with float right so skip for now.
                               "</td>"
            }*/
            else { result += "<td id='" + field + "_id'>" + val + "</td>" }
        }
        return result + "</tr>"
    }

    static run_update_job(){
        let existing_job = Job["rs_update"]
        if(existing_job && existing_job.is_active()){
            existing_job.stop_for_reason("interrupted", "user stopped job")
        }
        else {
            let rob = selected_robot()
            new Job({name: "rs_update",
                robot: rob,
                do_list: [ Robot.loop(true,  Dexter.get_robot_status)]}).start()
        }
    }
}