var Outer_J_Ranges = {
	J1BoundryLow: -187,
	J1BoundryHigh: 187,
	J2BoundryLow: -92,
	J2BoundryHigh: 92,
	J3BoundryLow: -153,
	J3BoundryHigh: 153,
	J4BoundryLow: -103,
	J4BoundryHigh: 103,
	J5BoundryLow: -189,
	J5BoundryHigh: 189
}

var cal_saved_points = [
	[[], []],
	[[], []],
    [[], []],
    [[], []],
    [[], []],
    [[], []]
    ]

var showing_J_num = 1
var cal_init_view_eye_state = true


globalThis.cal_svg_height = 410
globalThis.cal_working_axis = undefined //this is either undefined, 0, 1, 2, 3, 4 (ie zero based joint numbers)



function cal_init_robot_show_window_cb(vals){
   if(vals.clicked_button_value == "Cancel") {
        Job.cal_init_job.stop_for_reason("interrupted", "user canceled the job")
   		SW.close_window(vals.window_index)
   }
}

function cal_init_robot(){
   let the_robot = cal_get_robot()
   let show_dia = show_window(
       {title: "Initializing a Dexter for calibration",
        content: "Please wait for data from " + the_robot.name + "...<p/>" +
                 "<center><input type='button' value='Cancel'/></center>",
        width:  400,
        height: 130,
        callback: cal_init_robot_show_window_cb
        })
	let the_job = new Job({
		name: "cal_init_job",
		show_instructions: false,
		inter_do_item_dur: 0,
		robot: cal_get_robot(),
		user_data: {
			dex_filepath: "/srv/samba/share/AdcCenters.txt"
		},
		do_list: [
			function(){
            	out("Attempting to read AdcCenters.txt from robot with IP: " + this.robot.ip_address + "...")
        		
                return [
                	Dexter.read_file(this.user_data.dex_filepath, "read_results"),
                    make_ins("F")
                ]
        	},
            function(){
            	let original_content = this.user_data.read_results
				let my_file_content = out(original_content)
            	
                let content_array = original_content.split("\r\n")
        
        
    			centers_string = []
    			for(let i = 0; i < 10; i++){
            		centers_string.push(content_array[i])
    			}
        
        		// Switched J2 and J3
        		let temp_string = centers_string[4]
    			centers_string[4] = centers_string[2]
    			centers_string[2] = temp_string
    			temp_string = centers_string[5]
    			centers_string[5] = centers_string[3]
    			centers_string[3] = temp_string
            	
			}
		],
		when_stopped: function(){
			SW.close_window(show_dia)
			let init_data = Job.cal_init_job.user_data.cal_init_data
			//do stuff with init data
		}
	})
   the_job.start()
}


function cal_is_loop_checked(J_num){
	let cb_string = "cal_loop_joint_" + J_num + "_cb_id"
    let result = globalThis[cb_string].checked
    return result
}

function make_calibrate_joint_buttons_html(){
    //var result = "<input type='button' value='Start All Joints' id='Start_J_6'</input> <hr style='border-width:1px; border-color: #c89191'/>"
    var result = ""
    
    for(var i = 1; i <= 5; i++){
    	let title = 'Expect a circle of points to be drawn counter-clockwise.'
        if(i == 5){
        	title = 'Expect a circle of points to be drawn clockwise.'
        }
        result += 
            "<input title='" + title + "' type='button' value='Start J" + i + "' id='Start_J_" + i + "_id' style='margin-right:15px; background-color: rgb(204, 204, 204);margin-bottom:5px;'></input> " +
            "<span style='font-size:18px; margin:0px; padding:0px;' title='Make Joint " + i + " current and show recorded points.'> &#128065; </span>" +
            "<input name='cal_joint_radio' id='cal_joint_" + i +
            	"_radio_id' type='radio' style='margin-top:10px; margin-left:0px; margin-right:10px; padding:0px;' data-onchange='true' title='Make Joint " + i + " current and show recorded points.' value='cal_joint_" + i + "_value'/>" +
            "<span title='Loop Joint " + i + "' > &#10227;</span>" +
            "<input id='cal_loop_joint_" + i + "_cb_id' type='checkbox' style=''data-onchange='true' value=false title='Loop Joint " + i + "'/>" +
            "<br/>" +
            "<input id='cal_start_angle_" + i + "_id' type='number' style='width:45px;'/>" +
            "<span id='cal_angle_" + i + "_id'>&nbsp;&nbsp;0.000</span>&deg;" +
            "<input id='cal_end_angle_" + i + "_id' type='number' style='width:45px;'/>" +
            "<hr style='border-width:1px; border-color: #c89191'/>"
    }
    const reset_button = "<input type='button' value='Reset Ranges' style='margin-left:20px;' title='Reset all joint ranges'/><p/>"
    const clear_button = "<input type='button' value='Clear' style='margin-left:20px;' title='Clear current joint's recorded points.'/><p/>"
    const save_button  = "<input type='button' value='Save'    title='Save eye centers to file on Dexter.'/>"
    return result + reset_button + clear_button + save_button
}

function flip_point_y(y){
    return (y * -1) + globalThis.cal_svg_height
}

function remove_svg_points(){
    $(".cal_svg_circle").remove();
}

function are_all_joints_calibrated(){
    return (cal_joint_done1_id.checked &&
        cal_joint_done2_id.checked &&
        cal_joint_done3_id.checked &&
        cal_joint_done4_id.checked &&
        cal_joint_done5_id.checked)
}

function cal_reset_ranges(){
	for(let i = 1; i <= 5; i++){
		let start_box_name = "cal_start_angle_" + i + "_id"
        let start_dom_elt = globalThis[start_box_name]
        start_dom_elt.value = Outer_J_Ranges["J" + i + "BoundryLow"]
        
        
        let end_box_name = "cal_end_angle_" + i + "_id"
        let end_dom_elt = globalThis[end_box_name]
        
        end_dom_elt.value = Outer_J_Ranges["J" + i + "BoundryHigh"]
		
        start_dom_elt.min = start_dom_elt.value
        start_dom_elt.max = end_dom_elt.value
        end_dom_elt.min = start_dom_elt.value
        end_dom_elt.max = end_dom_elt.value
        /*
        if(i == 3){
        	let temp_val = end_dom_elt.value
            end_dom_elt.value = start_dom_elt.value
            start_dom_elt.value = temp_val
        }
        */
    }
}

function cal_clear_points(){
	remove_svg_points()
	cal_saved_points[showing_J_num-1] = [[], []]
}

function cal_redraw_points(){
	remove_svg_points()
    let J_num = showing_J_num
	let points = cal_saved_points[J_num-1]
    let thehtml = ""
    let num_points = points[0].length
    for(let i = 0; i < num_points; i++){
    	thehtml = (svg_circle({html_class: "cal_svg_circle", cx: points[0][i], cy: flip_point_y(points[1][i]), r: 1}))
		SW.append_in_ui("svg_id", thehtml)
    }
}

function cal_draw_saved_center(){
	let saved_x = parseInt(centers_string[2*(showing_J_num-1)]) / 655360
    let saved_y = parseInt(centers_string[2*(showing_J_num-1)+1]) / 655360
	
    $(".cal_svg_circle_saved_center").remove()
	thehtml = svg_circle({html_class:"cal_svg_circle_saved_center", cx: saved_x, cy:flip_point_y(saved_y), r: 3, color: "blue"})
    SW.append_in_ui("svg_id", thehtml)
}

function handle_cal(vals){
	//debugger
	if(vals.clicked_button_value === "close_button") { return }
    var the_robot = cal_get_robot()
    //out(vals.clicked_button_value)
    if(vals.clicked_button_value == "Reset Ranges") {
    	if(cal_init_view_eye_state){
        	out("Attempting to connect to " + robot_to_calibrate_id.value +"...", "blue")
        	init_view_eye()
    	}
    	cal_reset_ranges()
    }else if(vals.clicked_button_value == "Clear") {
    	cal_clear_points()
    }else if(vals.clicked_button_value == ("cal_joint_radio")){
    	if(cal_init_view_eye_state){
        	out("Attempting to connect to " + robot_to_calibrate_id.value +"...", "blue")
        	init_view_eye()
    	}
        showing_J_num = parseInt(vals.cal_joint_radio.substring(10, 11))
        cal_redraw_points()
        cal_draw_saved_center()
    }else if (vals.clicked_button_value.startsWith("Start_J")) {
    	if(cal_init_view_eye_state){
        	out("Attempting to connect to " + robot_to_calibrate_id.value +"...", "blue")
        	init_view_eye()
    	}
    	let J_num = parseInt(vals.clicked_button_value.substring(8, 9))
        let start_button_dom_elt = globalThis["Start_J_" + J_num + "_id"]
        let radio_button_dom_elt = globalThis["cal_joint_" + J_num + "_radio_id"]
        radio_button_dom_elt.checked = true
        showing_J_num = J_num
        cal_draw_saved_center()
        
        let starting_timeout = 0
        if(Job.CalSensors.is_active()){
        	starting_timeout = 1000
        	Job.CalSensors.stop_for_reason("interrupted", "User stopped job.")
        	if(globalThis.cal_working_axis == J_num-1){
            	start_button_dom_elt.style.backgroundColor = "rgb(255, 123, 0)"
                return
        	}else{
            	let old_start_button_dom_elt = globalThis["Start_J_" + (globalThis.cal_working_axis + 1) + "_id"]
            	old_start_button_dom_elt.style.backgroundColor = "rgb(255, 123, 0)"
            }
        }
        
        
        var message = "Adjust the 2 trim pots for Joint " + J_num + " to make a circle.<br/>"
        if ([1, 4, 5].includes(J_num)){
            message += "&nbsp;&nbsp;&nbsp;&nbsp;You can also adjust Joint " + (globalThis.cal_working_axis - 1) + "'s two position screws."
        }
        cal_instructions_id.innerHTML = message
        if (the_robot.simulate === true) {
            warning("To calibrate a Dexter, it must have its simulate property set to false.<br/>" +
                the_robot.name + " has simulate==true. <br/>" +
                'Use <code>new Dexter({name: "' + the_robot.name + '" simulate: true ...})</code><br>' +
                "to define your Dexter.")
        }
        else if (Robot.get_simulate_actual(the_robot.simulate) == true){
            cal_instructions_id.innerHTML = "<span style='color:red'>To calibrate " + the_robot.name + ", the Jobs menu/Simulate? radio button <br/>" +
                "&nbsp;&nbsp;&nbsp;&nbsp;should be set to false.</span>"
        }
        	
            
            
        
        start_button_dom_elt.style.backgroundColor = "rgb(136, 255, 136)"  
    		
        let start_range = vals["cal_start_angle_" + J_num + "_id"] //Outer_J_Ranges["J" + J_num + "BoundryLow"]
        let end_range   = vals["cal_end_angle_" + J_num + "_id"] //Outer_J_Ranges["J" + J_num + "BoundryHigh"]
        globalThis.cal_working_axis = J_num - 1
        AxisTable[globalThis.cal_working_axis][5][J_num-1] = start_range
        AxisTable[globalThis.cal_working_axis][4] = Math.abs(end_range - start_range) / AxisTable[globalThis.cal_working_axis][0][J_num-1]
        AxisTable[globalThis.cal_working_axis][0][J_num-1] = Math.sign(end_range - start_range) * Math.abs(AxisTable[globalThis.cal_working_axis][0][J_num-1])
        
        remove_svg_points()
        setTimeout(function(){Job.CalSensors.start({robot: the_robot})}, starting_timeout)
            
    }else if(vals.clicked_button_value === "svg_id") {
    	/*
        if (globalThis.cal_working_axis === undefined){
            cal_instructions_id.innerHTML = "<span style='color:red'>You must first press a Start J button to calibrate.<br/></span>"
        }
        else {
        */
            //cal_instructions_id.innerHTML = "Check this joint's <b>Done</b> check box<br/>&nbsp;&nbsp;&nbsp;&nbsp;if you like the center you've chosen."
            cal_instructions_id.innerHTML = "If you like the center you've chosen, click the <b>Save</b> button to save it to Dexter<br/>or move onto the next joint."
            const y_val_to_save = flip_point_y(vals.offsetY)
            let idx
            switch(globalThis.cal_working_axis){
                case 1:
                    idx = 2
                    break
                case 2:
                    idx = 1
                    break
                default:
                    idx = globalThis.cal_working_axis
            }
            centers_string[2*globalThis.cal_working_axis] =
                "0x" + ((vals.offsetX  * 10) * 65536).toString(16)
            centers_string[2*globalThis.cal_working_axis+1] =
                "0x" + ((y_val_to_save * 10) * 65536).toString(16)


            out ("0x" + ((vals.offsetX  * 10) * 65536).toString(16) + " " +
                "0x" + ((y_val_to_save * 10) * 65536).toString(16))
            
            //$("." + "cal_svg_circle").css("fill", "#fdd715") // turns black dots yellow
            SW.append_in_ui("svg_id", svg_circle({html_class: "cal_svg_circle",
                cx: vals.offsetX,
                cy: vals.offsetY,
                r: 3,
                color: "red"}))
        /*
        }
        */
    }
    else if (vals.clicked_button_value == "Stop"){
    	if(cal_init_view_eye_state){
        	init_view_eye()
    	}
        if(Job.CalSensors.is_active()){
            Job.CalSensors.stop_for_reason("interrupted", "User stopped job.")
        }
        cal_instructions_id.innerHTML = "Click the <b>Restart</b> button or <br/>" +
            "&nbsp;&nbsp;&nbsp;&nbsp;click the radio button for another Joint."
    }
    else if (vals.clicked_button_value == "Restart"){
        if(Job.CalSensors.is_active()){
            Job.CalSensors.stop_for_reason("interrupted", "User stopped job.")
        }
        remove_svg_points()
        if(globalThis.cal_working_axis !== undefined){
            var message = "Adjust the 2 trim pots for Joint " + (globalThis.cal_working_axis + 1) + " to make a circle.<br/>"
            if ([1, 4, 5].includes(globalThis.cal_working_axis - 1)){
                message += "&nbsp;&nbsp;&nbsp;&nbsp;You can also adjust Joint " + (globalThis.cal_working_axis + 1) + "'s two position screws."
            }
            cal_instructions_id.innerHTML = message
            Job.CalSensors.start({robot: cal_get_robot()})
        }
        else {
            cal_instructions_id.innerHTML = "No selected joint to Restart.<br/>&nbsp;&nbsp;&nbsp;&nbsp;Click a Joint's radio button."
        }
    }
    else if (vals.clicked_button_value === "Save"){
    	/*
        if (globalThis.cal_working_axis === undefined){
            cal_instructions_id.innerHTML = "<span style='color:red'>You must first press a Start J button to calibrate.<br/></span>"
        }else{
        */
        
        	let CMD = centers_output()
            let save_job = new Job({
            	name: "Cal_Save_Eye_Centers",
				show_instructions: false,
				inter_do_item_dur: 0,
				robot: cal_get_robot(),
         		do_list: [CMD]
            })
            
            save_job.start()
			
            
            
        	//const file_write_worked = centers_output()
            /*
        	var message_prefix
        	if(file_write_worked) {
            	message_prefix = "Settings saved<br/>&nbsp;&nbsp;&nbsp;&nbsp;Now click"
        	}
        	else {
            	message_prefix = "<span style='color:red;'>Can't write file.</span> See Output and Doc panes,<br/>&nbsp;&nbsp;&nbsp;&nbsp;then click"
            	DocCode.open_doc(dexters_file_system_doc_id)
        	}
        	cal_instructions_id.innerHTML = message_prefix + " <b>Calibrate Optical Encoders</b>"
            */
            
        /*    
        }
        */
    }else if (vals.clicked_button_value === "calibrate_optical_id"){
        if (the_robot.simulate === true) {
            warning("To calibrate a Dexter, it must have its simulate property set to false.<br/>" +
                the_robot.name + " has simulate==true. <br/>" +
                'Use <code>new Dexter({name: "' + the_robot.name + '" simulate: true ...})</code><br>' +
                "to define your Dexter.")
        }
        else if (Robot.get_simulate_actual(the_robot.simulate) == true){
            cal_instructions_id.innerHTML = "<span style='color:red'>To calibrate " + the_robot.name + ", the Misc Pane's <b>real</b> radio button <br/>" +
                "&nbsp;&nbsp;&nbsp;&nbsp;should be selected.</span>"
        }
        else if (confirm("Caution! Clear the hemisphere that the fully extended Dexter can reach.")){
            init_calibrate_optical(null, vals.cal_dialog_make_ins_file_id)
            Job.CalEncoders.start({robot: cal_get_robot()})
            cal_instructions_id.innerHTML = "Now calibrating optical encoders...<br/>&nbsp;&nbsp;&nbsp;&nbsp;<i>This takes about a minute.</i>"
        }
        else {
            cal_instructions_id.innerHTML = "Optical encoder calibration canceled.<br/>"
        }
    }
    else if (vals.clicked_button_value === "robot_to_calibrate_id"){
    	if(the_robot != undefined){
        	cal_init_view_eye_state = true
        	cal_init_robot()  //Fry added Oct 19, 2018
        }
    }
}

function make_dexter_robot_menu_html(){
    var result = "<select data-onchange='true' id='robot_to_calibrate_id' style='font-size:16px;' value='robot_to_calibrate'>\n"
    if(Dexter.all_names.length > 1){
    	result += "<option>Choose</option>\n" 
    }
    result += "<option>" + Dexter.last_robot.name + "</option>\n"
    for(let dex_name of Dexter.all_names){
        if (dex_name != Dexter.last_robot.name) {  
           result += "<option>" + dex_name + "</option>\n"
        }
    }
    return result + "</select>"
}

//used in this file and ViewEye
function cal_get_robot(){
	try{
    	return Robot[robot_to_calibrate_id.value]
    }catch(err){
    	dde_error("cal_get_robot() was called before robot_to_calibrate_id exists")
    }
}

function init_calibrate(){

	//this has been moved because the robot isn't known yet
    //init_view_eye() //will define (or redefine the view eye job, which is ok)
    cal_init_view_eye_state = true
    
    
    //init_calibrate_optical() //will define (or redefine the calibrate_optical job, which is ok)
    show_window({
        title:"Calibrate your Dexter(s)",
        x:325, y: 0, width:680, height: 640,
        content:
        "1. Choose a Dexter to calibrate: " + make_dexter_robot_menu_html() + "<br/>" +
        "2. <span id='cal_instructions_id'>Calibrate optical sensors by<br/>&nbsp;&nbsp;&nbsp;&nbsp;choosing each joint to calibrate.</span><br/>" +
        "<table style='margin:0px;padding:0px;'><tr><td style='margin:0px;padding-right:10px;background-color:#ffc69e;'>" +
        make_calibrate_joint_buttons_html() +
        "</td><td><table style='border-collapse:collapse !important;border;0px;'><tr><td>" +
        //"<div style='width:20px;height:410px;display:inline-block; transform:rotateZ(-90deg);'>" +
        //    " Right potentiometer: &nbsp;Clockwise pot rotation &rarr;" +
        //    "</div></td><td>" +
        svg_svg({width:20, height:410, child_elements: [svg_text({x:0, y:380, transform: 'rotate(-90 15 380)',
            text:'Left potentiometer: &nbsp;Clockwise pot rotation &rarr;'
        })]}) + "</td><td>" +
        svg_svg({id: "svg_id", height: globalThis.cal_svg_height, width: globalThis.cal_svg_height,
            html_class: "clickable", style:"background-color:white;",
            child_elements: [
                svg_text({text: "X   Axis", x: 150, y: 400, size: 30, color: "#DDDDDD", border_width: 1, border_color: "black", style: 'font-weight:bold;'}),
                svg_text({text: "Y   Axis", x:  30, y: 250, size: 30, color: "#DDDDDD", border_width: 1, border_color: "black", style: 'font-weight:bold;', transform: 'rotate(-90 30 250)'}),
            ]}) +
        "</td></tr><tr style='border-collapse:collapse;'><td style='border-collapse:collapse;'></td><td>&nbsp;&nbsp;&nbsp;&nbsp;Right potentiometer: &nbsp;Clockwise pot rotation &rarr;</td></tr>" +
        "</table></td></tr></table>" +
        
        /*
        "3. <input type='button' id='calibrate_optical_id' style='margin-top:10px;' title='Do each time you turn on Dexter.'" +
        "value='Calibrate optical encoders'/>" +
        `&nbsp&nbsp4. <input type='button' style='margin-top:10px;' title='Click to start FindHome Job'
              value='Start FindHome'>
      </button> &nbsp(Experimental)`,
      */

      	"3. <input type='button' id='calibrate_optical_id' style='margin-top:10px;' title='Do each time you turn on Dexter.'" +
        "value='Calibrate optical encoders'/>" +

        ` Calibration process: <div id="cal_dialog_make_ins_file_id" class="combo_box" style="display:inline-block;vertical-align:middle;">
        <option selected="selected">Cal.make_ins</option>
        <option>FastCal.make_ins</option>
        </div>`,
        
      
        callback: handle_cal
    })
    DocCode.open_doc(calibrate_doc_id)
    setTimeout(cal_reset_ranges, 200)
    setTimeout(function(){
        try{
        	//this errors when the robot to calibrate hasn't been chosen yet
    		let robot_sim = Robot[robot_to_calibrate_id.value].simulate
        	let sim_actual = Robot.get_simulate_actual(robot_sim)
        	if(sim_actual === true){
        		//show_window({content: "Don't Sim"})
            	DocCode.open_doc(dexter_param_simulate_doc_id)
            	alert("Warning: Simulate is turned on so the calibration window will not work. \n" +
                        "To set to real, choose Misc pane radio button: 'real'.")
        	}
        	else if (Dexter.all_names.length == 1) { cal_init_robot() } //Fry added Oct 19, 2018
    	}catch(err){
        	
        }
    }, 1000)
    
    
}