function make_calibrate_joint_buttons_html(){
     var result = ""
     for(var i = 1; i <= 5; i++){
        var checkmark = "&nbsp;&nbsp;&nbsp;"
        if(i < 3) { checkmark = "&#10004;" }
        //if (i === 3) { checkmark = "<span style='color:#00DD00;'>&#8680;</span>" }
        else if (i > 3) { checkmark = "&nbsp;&nbsp;&nbsp;" }
        result += "<input name='cal_joint' type='radio'  style=margin-top:10px; data-onchange='true' title='Start calibrating this joint.' value='Joint" + i + "'/>" +
                  "Joint " + i +
                  //" <span id='j" + i + "checkmark' style='margin-left:0px'>" + checkmark + " </span><br/>" +
                  "<input name='cal_joint_done' type='checkbox' style='margin-left:20px;'data-onchange='true' value='Done' title='Mark that you have completed calibration for this Joint.'/> Done<br/>"
     }
    const stop_button    = "<br/><input type='button' value='Stop'    style='margin-left:20px;' title='Stop the currently running Joint calibration.'/><p/>"
    const restart_button =      "<input type='button' value='Restart' style='margin-left:20px;' title='Restart the calibration for the selected Joint.'/><p/>"
    const save_button    =      "<input type='button' value='Save'    title='Save the calibration settings for all Joints to disk.'/>"
    return result + stop_button + restart_button + save_button
}

window.cal_svg_height = 410

function flip_point_y(y){
    return (y * -1) + window.cal_svg_height
}

function handle_cal(vals){
    if (vals.clicked_button_value === "cal_joint_done") {
        if(Job.ViewEye.is_active()){
            Job.ViewEye.stop_for_reason("interrupted", "User stopped job.")
        }
        //let user check or uncheck this Joint, its just "note taking" for the user.
        //window.cal_working_axis = undefined
        cal_instructions_id.innerHTML = "Choose <b>Restart</b> or a joint to calibrate.<br/>"
    }
    else if (vals.clicked_button_value.startsWith("cal_joint")){
        if(window.cal_working_axis){
            Job.ViewEye.stop_for_reason("interrupted", "User stopped job.")
        }
        window.cal_working_axis = parseInt(last(vals[vals.clicked_button_value]))
        var message = "Adjust the 2 trim pots for Joint " + window.cal_working_axis + " to make a circle.<br/>"
        if ([1, 4, 5].includes(window.cal_working_axis)){
            message += "&nbsp;&nbsp;&nbsp;&nbsp;You can also adjust Joint " + window.cal_working_axis + "'s two position screws."
        }
        cal_instructions_id.innerHTML = message
        Job.ViewEye.start({robot: cal_get_robot()})
    }
	else if(vals.clicked_button_value === "svg_id") {
	 if (!window.cal_working_axis){
         cal_instructions_id.innerHTML = "<span style='color:red'>You must first press a Joint button to calibrate.<br/></span>"
     }
     else {
         cal_instructions_id.innerHTML = "Check this joint's <b>Done</b> check box<br/>&nbsp;&nbsp;&nbsp;&nbsp;if you like the center you've chosen."
         const y_val_to_save = flip_point_y(vals.offsetX)
         centers_string[window.cal_working_axis][0] =
              "0x" + ((vals.offsetX  * 10) * 65536).toString(16)
         centers_string[window.cal_working_axis][1] =
              "0x" + ((y_val_to_save * 10) * 65536).toString(16)
         out ("0x" + ((vals.offsetX  * 10) * 65536).toString(16) + " " +
              "0x" + ((y_val_to_save * 10) * 65536).toString(16))
         $("." + "cal_svg_circle").css("fill", "#fdd715")
         append_in_ui("svg_id", svg_circle({html_class: "cal_svg_circle",
                                           cx: vals.offsetX,
                                           cy: vals.offsetY,
                                           r: 3,
                                           color: "Red"}))
     }
    }
    else if (vals.clicked_button_value == "Stop"){
        if(Job.ViewEye.is_active()){
            Job.ViewEye.stop_for_reason("interrupted", "User stopped job.")
        }
        cal_instructions_id.innerHTML = "Click the <b>Restart</b> button or <br/>" +
                                        "&nbsp;&nbsp;&nbsp;&nbsp;click the radio button for another Joint."
    }
    else if (vals.clicked_button_value == "Restart"){
        if(Job.ViewEye.is_active()){
            Job.ViewEye.stop_for_reason("interrupted", "User stopped job.")
        }
        if(window.cal_working_axis){
            var message = "Adjust the 2 trim pots for Joint " + window.cal_working_axis + " to make a circle.<br/>"
            if ([1, 4, 5].includes(window.cal_working_axis)){
                message += "&nbsp;&nbsp;&nbsp;&nbsp;You can also adjust Joint " + window.cal_working_axis + "'s two position screws."
            }
            cal_instructions_id.innerHTML = message
            Job.ViewEye.start({robot: cal_get_robot()})
        }
        else {
            cal_instructions_id.innerHTML = "No selected joint to Restart.<br/>&nbsp;&nbsp;&nbsp;&nbsp;Click a Joint's radio button."
        }
    }
    else if (vals.clicked_button_value === "Save"){
        const file_write_worked = centers_output()
        var message_prefix
        if(file_write_worked) {
            message_prefix = "Settings saved<br/>&nbsp;&nbsp;&nbsp;&nbsp;Now click"
        }
        else {
            message_prefix = "<span style='color:red;'>Can't write file.</span> See Output and Doc panes,<br/>&nbsp;&nbsp;&nbsp;&nbsp;then click"
            open_doc(dexters_file_system_doc_id)
        }
        cal_instructions_id.innerHTML = message_prefix + " <b>Calibrate Optical Encoder Geometry</b>"
    }
    else if (vals.clicked_button_value === "calibrate_optical_id"){
        Job.cal_optical.start({robot: cal_get_robot()})
        cal_instructions_id.innerHTML = "Now calibrating optical encoders...<br/><i>This takes about a minute.</i>"
    }
}

function make_dexter_robot_menu_html(){
    var result = "<select id='robot_to_calibrate_id' style='font-size:16px;'>\n"
    for(let dex_name of Dexter.all_names){
        result += "<option>" + dex_name + "</option>\n"
    }
    return result + "</select>"
}

function start_calibrate(){
  show_window({
    title:"Caibrate your Dexter(s)",
    x:325, y: 0, width:550, height: 575,
    content:
  "1. Choose a Dexter to calibrate: " + make_dexter_robot_menu_html() + "<br/>" +
  "2. <span id='cal_instructions_id'>Choose a joint to calibrate:<br/></span><br/>" +
     "<table style='margin:0px;padding:0px;'><tr><td style='margin:0px;padding-right:10px;background-color:#ffc69e;'>" +
      make_calibrate_joint_buttons_html() +
      "</td><td>" +
      svg_svg({id: "svg_id", height: window.cal_svg_height, width: window.cal_svg_height,
                   html_class: "clickable", style:"background-color:white;",
                   child_elements: [
                       svg_text({text: "X   Axis", x: 150, y: 400, size: 30, color: "#DDDDDD", border_width: 1, border_color: "black", style: 'font-weight:bold;'}),
                       svg_text({text: "Y   Axis", x:  30, y: 250, size: 30, color: "#DDDDDD", border_width: 1, border_color: "black", style: 'font-weight:bold;', transform: 'rotate(-90 30 250)'}),

                   ]}) +
      "</td></tr></table>" +
  "3. <input type='button' id='calibrate_optical_id' style='margin-top:10px;' " +
             "value='Calibrate Optical Encoder Geometry'/>",
   callback: handle_cal
  })
  open_doc(calibrate_doc_id)
}
//used in this file and ViewEye
function cal_get_robot(){
    return Robot[robot_to_calibrate_id.value]
}