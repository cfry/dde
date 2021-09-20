/* No instances of this class are made.
   At most, only 1 dialog is shown at a time.
   Only 2 of the below methods are used outside this file:
      show   only called from the menu bar Jobs/show robot status item
      update_robot_status_table_maybe only called from Dexter.robot_done_with_instruction
*/

import {to_fixed_smart, date_integer_to_long_string} from "../job_engine/core/utils.js"

export class RobotStatusDialog{
//only called from the menu bar Jobs/show robot status item
//makes a new window, but not if one is already up.
    static show(robot, default_status_mode=0, x=200, y=200){
        if(RobotStatusDialog.window_up()) { out("Robot Status is already shown.") }
        else {
            if(!(robot instanceof Dexter)) {
                robot = (Job.last_job? Job.last_job.robot : Dexter.dexter0)
            }
            let content = RobotStatusDialog.make_html_table(robot)
            let cal = robot.is_calibrated()
            cal = ((cal === null) ? "unknown" : cal)
            let sm_to_show
            if(robot.rs) { sm_to_show = robot.rs.status_mode() }
            else { sm_to_show = default_status_mode } //happens when there is no status mode, ie no job has run on this robot.
               //BUT the user might have still changed the "g" input number spinner, and then clicked the update button,
               //so we want to pass in that number from the prev dialog, which we do in the default_status_mode
            RobotStatusDialog.show_window_id =  //careful. "this" is the dom elt when this is first called, not the class.
              show_window({content: content,
                title:  "<span style='font-size:16px;'>Robot Status of</span> " +
                RobotStatusDialog.make_names_menu_html(robot) +
                "<span title='Inspect this robot.' onclick='RobotStatusDialog.inspect_robot()' " +
                "style='color:blue;cursor:pointer;font-weight:bold;font-size:14px;'> &#9432;</span>" +
                "<span style='font-size:12px;margin-left:10px;'> Updated: <span id='robot_status_window_time_id'>" + RobotStatusDialog.update_time_string() + "</span></span>" +
                " <button id='robot_status_run_update_job_button_id' title='Defines and starts a Job&#13; that continually gets the robot status&#13;of the selected robot.&#13;Click again to stop that Job.'" +
                " onclick='RobotStatusDialog.run_update_job()'>run rs_update job</button> " +
                `<span style='font-size:12px;' title='The status_mode to use&#013;when the "run rs_update job" button is clicked.'> sm: <input id='robot_status_status_mode_id' type='number' step='1' value='` + sm_to_show + "' style='width:27px;'/></span> " +
                "<span style='font-size:14px;'> &nbsp;&nbsp;is_calibrated: <span id='robot_status_is_calibrated_id'>" + cal + "</span></span> " +
                `<button title='Inspect the robot_status array.' onclick="RobotStatusDialog.inspect_array()"'>Inspect Array</button> ` +
                `<button title="Browse the Dexter node server main page.&#013;For this to work, you must be connected&#013;to a Dexter that's running its server." onclick="RobotStatusDialog.browse()"'>Browse</button> `
                ,
                x: x,
                y: y,
                width:  890,
                height: 380
            })
            setTimeout(function(){
                update_robot_status_names_select_id.oninput=RobotStatusDialog.robot_name_changed
            }, 300)
        }
    }

    static inspect_robot(){
        let rob = this.selected_robot()
        inspect(rob)
    }

    static window_up(){
        return (window.update_robot_status_names_select_id ? true : false)
    }

    static close_window(){
       if(typeof(this.show_window_id) === "number"){
           SW.close_window(this.show_window_id)
       }
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
        if(this.window_up()){
            let existing_shown_robot = this.selected_robot()
            if(existing_shown_robot && (existing_shown_robot == robot)){
                this.update_robot_status_table(robot)
            }
            else { } //do nothing.
        }
    }

    //called after the table is created, to update it dynamically.
    static update_robot_status_table(robot){
        let robot_status = robot.robot_status
        if (this.window_up()) { //don't attempt to show if the window isn't up. this does repopulate window if its merely shrunken
            robot_status_window_time_id.innerHTML = this.update_time_string()
            let sm = robot.rs.status_mode()
            let sm_inner_text = STATUS_MODE_id.innerText
            let actual_sm_now_shown
            if(is_string_a_integer(sm_inner_text)) {
                actual_sm_now_shown = parseInt(sm_inner_text)
            }
            else {
                actual_sm_now_shown = 0
            }
            if(sm !== actual_sm_now_shown) {
                this.show_window_id
                let win = SW.get_window_of_index(this.show_window_id)
                let win_x = win.offsetLeft
                let win_y = win.offsetTop
                this.close_window()
                //setTimeout(function() {
                    RobotStatusDialog.show(robot, actual_sm_now_shown, win_x, win_y)
                //    }, 100)
            }
            else {
                let labels = Dexter.robot_status_labels_sm(sm)
                let val_prefix = ""
                for (let i = 0; i < 60; i++){ //don't use robot_status.length as there might not BE a robot_status if it hasn't been run yet
                    let label = labels[i]
                    if ((label != null) && !label.startsWith("UNUSED")){
                        let val      = (robot_status ? robot_status[i] : "N/A") //its possible that a robot will have been defined, but never actually run when this fn is called.
                        if((typeof(val) == "number") && (i >= 10)) { //display as a real float
                            val = to_fixed_smart(val, 3) //val.toFixed(3)
                        }
                        let elt_name = label + "_id"
                        if(RobotStatus.is_other_status_mode(sm)) {
                            val_prefix = "<b>" + i + "</b>: "
                        }
                        window[elt_name].innerHTML = val_prefix + val
                    }
                }
                if(robot_status){
                    JOB_ID_id.innerHTML = this.make_job_id_td_innerHTML(robot_status[Dexter.JOB_ID])
                    START_TIME_id.title = date_integer_to_long_string(robot_status[Dexter.START_TIME])
                    STOP_TIME_id.title  = date_integer_to_long_string(robot_status[Dexter.STOP_TIME])
                    INSTRUCTION_TYPE_id.title = Robot.instruction_type_to_function_name(robot_status[Dexter.INSTRUCTION_TYPE])
                    if(window["MEASURED_X_id"]) {
                        let xyz
                        if(robot.rs) { xyz = robot.rs.xyz()[0] }  //gets xyz array for joint 5}
                        else { xyz = ["N/A", "N/A", "N/A"] }
                        MEASURED_X_id.innerHTML = this.format_measured_meters(xyz[0])
                        MEASURED_Y_id.innerHTML = this.format_measured_meters(xyz[1])
                        MEASURED_Z_id.innerHTML = this.format_measured_meters(xyz[2])
                    }
                }
                else {
                    START_TIME_id.title = "No jobs run on this robot yet."
                    STOP_TIME_id.title  = "No jobs run on this robot yet."
                    INSTRUCTION_TYPE_id.title = "No jobs run on this robot yet."
                    if(window["MEASURED_X_id"]) {
                        MEASURED_X_id.innerHTML = "no status"
                        MEASURED_Y_id.innerHTML = "no status"
                        MEASURED_Z_id.innerHTML = "no status"
                    }
                }
            }
        }
    }

    //called only when user chooses a new robot to display the status of.
    static robot_name_changed(name){
        //when called from the UI, the "name" arg is bound to the event.
        if(typeof(name) != "string") {name = name.target.value}
        let robot = Robot[name]
        RobotStatusDialog.update_robot_status_table(robot) //can't use "this" for subject because "this" is the select widget
    }

    static make_html_table(robot){
        //setting table class and using css to set fonts in th and td cells fails
        //let cs = " style='font-size:10pt;' " //cell style
        //let oplet = ds[Dexter.INSTRUCTION_TYPE]
        let robot_status = robot.robot_status
        let core_rows_html
        let sm = (robot.rs ? robot.rs.status_mode() : 0)
        let meth_name = "make_html_table_g" + sm
        if(this[meth_name]) { core_rows_html = this[meth_name].call(this, robot_status, robot) }
        else { core_rows_html = this.make_html_table_g_other(robot_status) }
        //if(sm === 0)      { core_rows_html = this.make_html_table_g0(robot_status)  }
        //else if(sm === 1) { core_rows_html = this.make_html_table_g1(robot_status)  }
        //else { shouldnt("RobotStatusDialog.make_html_table got invalid status_mode of: " + sm) }
        let result =
            "<table class='robot_status_table'>" +
            "<tr><th></th>    <th>JOB_ID</th><th>INSTRUCTION_ID</th><th>START_TIME</th><th>STOP_TIME</th><th>INSTRUCTION_TYPE</th></tr>" +
            this.make_rs_row(robot_status, "", "JOB_ID",      "INSTRUCTION_ID",      "START_TIME",      "STOP_TIME",      "INSTRUCTION_TYPE") +

            "<tr><th></th>    <th>ERROR_CODE</th><th>JOB_ID_OF_CI</th><th>CURRENT_INSTR</th><th>STATUS_MODE</th><th>END_EFFECTOR_IO_IN</th></tr>" +
            this.make_rs_row(robot_status, "", "ERROR_CODE",      "DMA_READ_DATA",      "READ_BLOCK_COUNT",      "STATUS_MODE",      "END_EFFECTOR_IO_IN") +
            core_rows_html +
            "</table>"
        return result
    }

    static make_html_table_g0(robot_status, robot){
        let xyz
        if(robot.rs) { xyz = robot.rs.xyz()[0] } //gets xyz array for joint 5
        else { xyz = ["N/A", "N/A", "N/A"] }
      return (
        "<tr><th></th>         <th>Joint 1</th><th>Joint 2</th><th>Joint 3</th><th>Joint 4</th><th>Joint 5</th><th>Joint 6</th><th>Joint 7</th></tr>" +
        this.make_rs_row(robot_status, "MEASURED_ANGLE",    "J1_MEASURED_ANGLE",   "J2_MEASURED_ANGLE",   "J3_MEASURED_ANGLE",   "J4_MEASURED_ANGLE", "J5_MEASURED_ANGLE", "J6_MEASURED_ANGLE",  "J7_MEASURED_ANGLE") +
        this.make_rs_row(robot_status, "ANGLE",     "J1_ANGLE",     "J2_ANGLE",     "J3_ANGLE",     "J4_ANGLE",     "J5_ANGLE"    ) +
        this.make_rs_row(robot_status, "MEASURED_TORQUE",   "N/A",                 "N/A",                 "N/A",                 "N/A",               "N/A",               "J6_MEASURED_TORQUE", "J7_MEASURED_TORQUE") +
        this.make_rs_row(robot_status, "DELTA",     "J1_DELTA",     "J2_DELTA",     "J3_DELTA",     "J4_DELTA",     "J5_DELTA"    ) +
        this.make_rs_row(robot_status, "PID_DELTA", "J1_PID_DELTA", "J2_PID_DELTA", "J3_PID_DELTA", "J4_PID_DELTA", "J5_PID_DELTA") +
        //this.make_rs_row(robot_status, "FORCE_CALC_ANGLE", "J1_FORCE_CALC_ANGLE", "J2_FORCE_CALC_ANGLE", "J3_FORCE_CALC_ANGLE", "J4_FORCE_CALC_ANGLE", "J5_FORCE_CALC_ANGLE") +
        this.make_rs_row(robot_status, "A2D_SIN",   "J1_A2D_SIN",   "J2_A2D_SIN",   "J3_A2D_SIN",   "J4_A2D_SIN",   "J5_A2D_SIN"  ) +
        this.make_rs_row(robot_status, "A2D_COS",   "J1_A2D_COS",   "J2_A2D_COS",   "J3_A2D_COS",   "J4_A2D_COS",   "J5_A2D_COS"  ) +
        //this.make_rs_row(robot_status, "PLAYBACK",  "J1_PLAYBACK",  "J2_PLAYBACK",  "J3_PLAYBACK",  "J4_PLAYBACK",  "J5_PLAYBACK" ) +

        this.make_rs_row(robot_status, "SENT",      "J1_SENT",      "J2_SENT",      "J3_SENT",      "J4_SENT",      "J5_SENT")     +
        "<tr>        <th>J5 MEASURED X</th><td><span id='MEASURED_X_id' style='font-family:monospace;float:right;'>" + this.format_measured_meters(xyz[0]) +
        "</span></td><th>J5 MEASURED Y</th><td><span id='MEASURED_Y_id' style='font-family:monospace;float:right;'>" + this.format_measured_meters(xyz[1]) +
        "</span></td><th>J5 MEASURED Z</th><td><span id='MEASURED_Z_id' style='font-family:monospace;float:right;'>" + this.format_measured_meters(xyz[2]) +
        "</span></td></tr>"      )
    }

    static make_html_table_g1(robot_status, robot){
        let xyz
        if(robot.rs) { xyz = robot.rs.xyz()[0]}  //gets xyz array for joint 5
        else { xyz = ["N/A", "N/A", "N/A"] }
        return (
            "<tr><th></th>         <th>Joint 1</th><th>Joint 2</th><th>Joint 3</th><th>Joint 4</th><th>Joint 5</th><th>Joint 6</th><th>Joint 7</th></tr>" +
            this.make_rs_row(robot_status, "MEASURED_ANGLE", "J1_MEASURED_ANGLE_G1", "J2_MEASURED_ANGLE_G1", "J3_MEASURED_ANGLE_G1", "J4_MEASURED_ANGLE_G1", "J5_MEASURED_ANGLE_G1", "J6_MEASURED_ANGLE_G1", "J7_MEASURED_ANGLE_G1") +
            this.make_rs_row(robot_status, "TORQUE",         "J1_TORQUE_G1",         "J2_TORQUE_G1",         "J3_TORQUE_G1",         "J4_TORQUE_G1",         "J5_TORQUE_G1",         "J6_TORQUE_G1",         "J7_TORQUE_G1") +
            this.make_rs_row(robot_status, "VELOCITY",       "J1_VELOCITY_G1",       "J2_VELOCITY_G1",       "J3_VELOCITY_G1",       "J4_VELOCITY_G1",       "J5_VELOCITY_G1",       "J6_VELOCITY_G1",       "J7_VELOCITY_G1") +
            "<tr>        <th>J5 MEASURED X</th><td><span id='MEASURED_X_id' style='font-family:monospace;float:right;'>" + this.format_measured_meters(xyz[0]) +
            "</span></td><th>J5 MEASURED Y</th><td><span id='MEASURED_Y_id' style='font-family:monospace;float:right;'>" + this.format_measured_meters(xyz[1]) +
            "</span></td><th>J5 MEASURED Z</th><td><span id='MEASURED_Z_id' style='font-family:monospace;float:right;'>" + this.format_measured_meters(xyz[2]) +
            "</span></td></tr>"
            )
    }

    static make_html_table_g2(robot_status, robot){
        let xyz
        if(robot.rs) { xyz = robot.rs.xyz()[0]}  //gets xyz array for joint 5
        else { xyz = ["N/A", "N/A", "N/A"] }
        return (
            "<tr><th></th>         <th>Joint 1</th><th>Joint 2</th><th>Joint 3</th><th>Joint 4</th><th>Joint 5</th><th>Joint 6</th><th>Joint 7</th></tr>" +
            this.make_rs_row(robot_status, "MEASURED_ANGLE",    "J1_MEASURED_ANGLE_G2",   "J2_MEASURED_ANGLE_G2",   "J3_MEASURED_ANGLE_G2",   "J4_MEASURED_ANGLE_G2", "J5_MEASURED_ANGLE_G2", "J6_MEASURED_ANGLE_G2",  "J7_MEASURED_ANGLE_G2") +
            this.make_rs_row(robot_status, "RAW_ENCODER_ANGLE_FXP", "J1_RAW_ENCODER_ANGLE_FXP_G2", "J2_RAW_ENCODER_ANGLE_FXP_G2", "J3_RAW_ENCODER_ANGLE_FXP_G2", "J4_RAW_ENCODER_ANGLE_FXP_G2", "J5_RAW_ENCODER_ANGLE_FXP_G2") +
            this.make_rs_row(robot_status, "MEASURED_TORQUE",   "N/A",                 "N/A",                 "N/A",                 "N/A",               "N/A",               "J6_MEASURED_TORQUE_G2", "J7_MEASURED_TORQUE_G2") +
            this.make_rs_row(robot_status, "EYE_NUMBER",     "J1_EYE_NUMBER_G2",     "J2_EYE_NUMBER_G2",     "J3_EYE_NUMBER_G2",     "J4_EYE_NUMBER_G2",  "J5_EYE_NUMBER_G2") +
            this.make_rs_row(robot_status, "PID_DELTA", "J1_PID_DELTA_G2", "J2_PID_DELTA_G2", "J3_PID_DELTA_G2", "J4_PID_DELTA_G2", "J5_PID_DELTA_G2") +
            //this.make_rs_row(robot_status, "FORCE_CALC_ANGLE", "J1_FORCE_CALC_ANGLE", "J2_FORCE_CALC_ANGLE", "J3_FORCE_CALC_ANGLE", "J4_FORCE_CALC_ANGLE", "J5_FORCE_CALC_ANGLE") +
            this.make_rs_row(robot_status, "A2D_SIN",   "J1_A2D_SIN_G2",   "J2_A2D_SIN_G2",   "J3_A2D_SIN_G2",   "J4_A2D_SIN_G2",   "J5_A2D_SIN_G2"  ) +
            this.make_rs_row(robot_status, "A2D_COS",   "J1_A2D_COS_G2",   "J2_A2D_COS_G2",   "J3_A2D_COS_G2",   "J4_A2D_COS_G2",   "J5_A2D_COS_G2"  ) +
            //this.make_rs_row(robot_status, "PLAYBACK",  "J1_PLAYBACK",  "J2_PLAYBACK",  "J3_PLAYBACK",  "J4_PLAYBACK",  "J5_PLAYBACK" ) +

            this.make_rs_row(robot_status, "SENT",      "J1_SENT_G2",      "J2_SENT_G2",      "J3_SENT_G2",      "J4_SENT_G2",      "J5_SENT_G2")     +
            "<tr><th>J5 MEASURED X</th><td><span id='MEASURED_X_id' style='font-family:monospace;float:right;'>"         + this.format_measured_meters(xyz[0]) +
            "</span></td><th>J5 MEASURED Y</th><td><span id='MEASURED_Y_id' style='font-family:monospace;float:right;'>" + this.format_measured_meters(xyz[1]) +
            "</span></td><th>J5 MEASURED Z</th><td><span id='MEASURED_Z_id' style='font-family:monospace;float:right;'>" + this.format_measured_meters(xyz[2]) +
            "</span></td></tr>"      )
    }

    static make_html_table_g_other(robot_status){
        let result = ""
        for(let decade = 1; decade < 6; decade++) {
            result += this.make_rs_row_g_other(robot_status, decade)
        }
        return result
    }

    static make_rs_row_g_other_elt_id(rs_index) {
        return "RS_" + rs_index + "_G_OTHER_id"
    }

    static make_rs_row_g_other(robot_status, decade){
        let result = ""
        for (let ones = 0; ones < 10; ones++){
            let rs_index = (decade * 10) + ones
            let elt_id = this.make_rs_row_g_other_elt_id(rs_index)
            result += "<td id='" + elt_id + "'><b>" + rs_index + ":</b> " + robot_status[rs_index] + "</td> "
        }
        return "<tr>" + result + "</tr>"
    }

    static format_measured_meters(angle) {
        if (typeof(angle) === "number") { return to_fixed_smart(angle, 3) + "m" }
        else { return angle }
    }

    static make_rs_row(robot_status, ...fields){
        let result   = "<tr>"
        let on_first = true
        let row_header = fields[0]
        let sm = (robot_status ? robot_status[Dexter.STATUS_MODE] : 0)
        let do_decimal_processing = row_header != ""
        //let is_angle = fields[0].endsWith("ANGLE")
        //let degree_html = (is_angle ? "&deg;" : "")
        for(let field of fields){
            let val_units = ""
            let val = (robot_status ? robot_status[Dexter[field]] : "no status")
            if(robot_status) {
                if(field && field.includes("MEASURED_ANGLE") && (field !== "MEASURED_ANGLE")) { //exclude the header
                    if(sm > 0) { val = val / 3600   }  //convert from degrees to arcseconds for all sm's except G0
                    val_units = "&deg;"
                }
                else if (field && field.includes("TORQUE") && ((field !== "TORQUE") || (field !== "MEASURED_TORQUE"))) {
                    if((val === undefined) || (val === null)) { val = "N/A" } //happens when sm === 0 for J1 thru 5
                    else {
                        val = val / 1000000
                        val_units = "" //"Nm" //Newton-meter  this is NOT Newton-meter its "dexter_units, ie speical Dynamixel units, 0 to 1023
                    }
                }
                else if (field && field.includes("VELOCITY") && (field !== "VELOCITY")) {
                    val = val / 3600 //convert from arcseconds per second to degrees per second
                    val_units = "&deg;/s" //degrees per scound
                }
            }
            else {
                val = "N/A"
                val_units = ""
            }
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
            else if (field === "TIME"){
                result += "<td title='" +
                    date_integer_to_long_string(val) +
                    "' id='" + field + "_id'>" +
                    val + "</td>"
            }
            else if (field === "JOB_ID"){
                val = this.make_job_id_td_innerHTML(val)
                result += '<td id="' + field + '_id">' + val + '</td>'
            }
            else if (field === "N/A") {
                val = field
                result += "<td><span style='float:right;'>N/A</span></td>"
            }
            else if (row_header != "") { //body of table, expect floating point numbers, float right
                val = to_fixed_smart(val, 3)
                result += "<td>" +
                    "<span id='" + field + "_id' style='font-family:monospace;float:right;'>" + val + val_units + "</span>" +
                    //degree_html + not playing nicely with float right so skip for now.
                    "</td>"

            }
            else { result += "<td id='" + field + "_id'>" + val + "</td>" }
        }
        return result + "</tr>"
    }

    static make_job_id_td_innerHTML(val){
        let job_name = ((typeof(val) === "number") ? Job.job_id_to_job_instance(val).name : null)
        let tooltip
        if(job_name){
            tooltip = "Inspect: Job." + job_name + "&#013;details."
        }
        else {
            tooltip = "No Job indicted."
        }
        let the_html = '<span title="' + tooltip + '" ' +
                        'onclick="inspect(Job.job_id_to_job_instance(' + val + '))" ' +
                        'style="color:blue;cursor:pointer;font-weight:bold;">' + val +
                        ' &#9432; </span>'

        return the_html
    }

    static run_update_job(){
        let existing_job = Job.rs_update
        if(existing_job && existing_job.is_active()){
            //robot_status_run_update_job_button_id.style.backgroundColor = "#93dfff" //done in Job.color_job_button
            existing_job.stop_for_reason("interrupted", "user stopped job")
        }
        else {
            let rob = this.selected_robot()
            //let sm = (rob.rs ? rob.rs.status_mode() : 0)
            //robot_status_run_update_job_button_id.style.backgroundColor = "#AAFFAA"
            let the_job = new Job({name: "rs_update",
                                     robot: new Brain({name: "rs_update_brain"}),
                                     inter_do_item_dur: 0.5, //UI update doesn't need to be faster than this.
                                                             //its even hard to read the numbers if they are faster.
                                                             //and we don't want to slow down a monitored job unessessarily
                                     do_list: [ Control.loop(true,
                                                   function() {
                                                      if(RobotStatusDialog.window_up()){
                                                          let cal = rob.is_calibrated()
                                                          if (cal == null) { cal = "unknown" }
                                                          robot_status_is_calibrated_id.innerHTML = cal
                                                          let sm = robot_status_status_mode_id.value
                                                          sm = parseInt(sm)
                                                          //out("in Job.rs_update,  sending get_robot_status of: " + sm)
                                                          return rob.get_robot_status(sm)
                                                      }
                                                      else {
                                                          //out("in rs_update_brain window down, ending loop.")
                                                          return Control.break()
                                                      }
                                                   })]})
            the_job.start()
        }
    }

    static inspect_array(){
        let robot_name = update_robot_status_names_select_id.value
        let robot = Dexter[robot_name]
        let robot_status_array = robot.robot_status
        let rs_inst = new RobotStatus({robot_status: robot_status_array})
        let sm = rs_inst.status_mode()
        let labels = Dexter.robot_status_labels_sm(sm)
        let len = labels.length
        let array_for_display = []
        for(let i = 0; i < len; i++){
            array_for_display.push([
               //i, //i is already printed by the inspector
               labels[i],
                (robot_status_array ? robot_status_array[i] : "no status")])
        }
        inspect(array_for_display)
    }

    static browse(){
        try{
        let robot_name = update_robot_status_names_select_id.value
        let robot = Dexter[robot_name]
        let ip_addr = robot.ip_address
        show_page(ip_addr)
        }
        catch(err) {
            warning("Sorry, unable to browse the web page for: " + update_robot_status_names_select_id.value)
        }
    }
}
