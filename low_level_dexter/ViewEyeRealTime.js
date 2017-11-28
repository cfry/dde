var centers_string
var AxisTable

function smLinex(run_backwards = false){
    xydata = []
    const size = Math.floor(AxisTable[window.cal_working_axis][4])
    const result = []
    result.push (make_ins("F"))
	out(run_backwards)
    for (let j = 0;j < size;j++){
    	let i = j
    	if(run_backwards){
        	i = size - j
        }
    	result.push(make_ins("a",
            AxisTable[window.cal_working_axis][0][0] * i + AxisTable[window.cal_working_axis][5][0],
            AxisTable[window.cal_working_axis][0][1] * i + AxisTable[window.cal_working_axis][5][1],
            AxisTable[window.cal_working_axis][0][2] * i + AxisTable[window.cal_working_axis][5][2],
            AxisTable[window.cal_working_axis][0][3] * i + AxisTable[window.cal_working_axis][5][3],
            AxisTable[window.cal_working_axis][0][4] * i + AxisTable[window.cal_working_axis][5][4]))
    
    		
            
    /*
        result.push(make_ins("a",
            AxisTable[window.cal_working_axis][0][0] * i,
            AxisTable[window.cal_working_axis][0][1] * i,
            AxisTable[window.cal_working_axis][0][2] * i,
            AxisTable[window.cal_working_axis][0][3] * i,
            AxisTable[window.cal_working_axis][0][4] * i))
	*/
        
        result.push(make_ins("F"))
        result.push(function(){
            var x = cal_get_robot().robot_status[AxisTable[window.cal_working_axis][1]]/10
            var y = cal_get_robot().robot_status[AxisTable[window.cal_working_axis][2]]/10
            var thehtml = svg_circle({html_class: "cal_svg_circle", cx: x, cy: flip_point_y(y), r: 1})
            let J_num = window.cal_working_axis+1
            
            cal_saved_points[J_num-1][0].push(x)
            cal_saved_points[J_num-1][1].push(y)

            append_in_ui("svg_id", thehtml)

            //James Code
            xydata.push([x*10, y*10])
			
            if(xydata.length%20 == 0){
            	let J_angle = cal_get_robot().joint_angle(J_num)
                let angle_string = J_angle.toString().substring(0, 7)
            	window["cal_angle_" + J_num + "_id"].innerHTML = angle_string
            }
            
            
            if(xydata.length > 200){
                //debugger
                let eye_suggest_result = eye_suggestion(xydata)
                //let eye_center = eye_suggest_result[2] //this should get stored somewhere
                //$(".cal_svg_circle_auto_center_min").remove()
                //$(".cal_svg_circle_auto_center_ave").remove()
                //debugger
                
                //thehtml = svg_circle({html_class:"cal_svg_circle_auto_center_min", cx: eye_center[0][0]/10, cy:flip_point_y(eye_center[0][1]/10), r: 3, color: "green"}) //replace thiswith colored dot (maybe yellow) that deletes the previous one
                //append_in_ui("svg_id", thehtml)
                
                //thehtml = svg_circle({html_class:"cal_svg_circle_auto_center_ave", cx: eye_center[1][0]/10, cy:flip_point_y(eye_center[1][1]/10), r: 3, color: "blue"}) //replace thiswith colored dot (maybe yellow) that deletes the previous one
                //append_in_ui("svg_id", thehtml)
                //out(eye_center)
                let suggestion_string = eye_suggestion_string(eye_suggest_result)
                cal_instructions_id.innerHTML = eye_suggestion_string(eye_suggest_result) //replace this withsomething that changes the text in the show window
            	
                
                if(xydata.length%200 == 0){
                	$(".cal_svg_circle_auto_center_min").remove()
    				let eye_center = find_perfect_center(xydata)
                    if (!Number.isNaN(eye_center[0][0]) && !Number.isNaN(eye_center[0][1])){
						thehtml = svg_circle({html_class:"cal_svg_circle_auto_center_min", cx: eye_center[0][0]/10, cy:flip_point_y(eye_center[0][1]/10), r: 3, color: "green"})
    					append_in_ui("svg_id", thehtml)
                    }
                }
            }

        })}
    return result
}




/*
var ip_address = "192.168.1.142"
var path = "//" + ip_address + "/share/AdcCenters.txt"
var centers_content = file_content(path)
var centers_content = file_content(path)
write_file(path, centers_content)
*/

//returns true if successful at writing the file, false if not.
function centers_output(){
    
    let centers_string_copy = centers_string.slice()
    // Swapping pivot and end arm
    let temp_string = centers_string_copy[4]
    centers_string_copy[4] = centers_string_copy[2]
    centers_string_copy[2] = temp_string
    temp_string = centers_string_copy[5]
    centers_string_copy[5] = centers_string_copy[3]
    centers_string_copy[3] = temp_string
    
    var content = ""
    for(let i = 0; i < 10; i++){
    	content += centers_string_copy[i]
        content += "\r\n"
    }
    try{
        var ip_address = Job.CalSensors.robot.ip_address
        var path = "//" + ip_address + "/share/AdcCenters.txt"
        write_file(path, content)
        out("Saved: " + path)
        return true
    }
    catch(err) {
        warning("DDE was unable to save the 'AdcCenters.txt' file directly to Dexter.<br>Please save the file manually.</br>")
		setTimeout(function(){ 
        	let path = choose_save_file({defaultPath: 'AdcCenters.txt'})
        	if(path){
        		write_file(path, content)
    			out("Saved: " + path)
        	}
        }, 500)
        return false
    }
}

function display_center_guess(){
	$(".cal_svg_circle_auto_center_min").remove()
    let eye_center = find_perfect_center(xydata)
	thehtml = svg_circle({html_class:"cal_svg_circle_auto_center_min", cx: eye_center[0][0]/10, cy:flip_point_y(eye_center[0][1]/10), r: 3, color: "green"})
    append_in_ui("svg_id", thehtml)
}

function init_view_eye(){
    //this table has to be here rather than top level in the file even though it is static,
    //because _nbits_cf and the other units cause errors if referenced at top level.
    
    AxisTable = [[[400/_nbits_cf, 0, 0, 0, 0], Dexter.J1_A2D_SIN, Dexter.J1_A2D_COS, [-648000*_arcsec, 0, 0, 0, 0], 1240, [0, 0, 0, 0, 0]],
                    [[0, 400/_nbits_cf, 0, 0, 0], Dexter.J2_A2D_SIN, Dexter.J2_A2D_COS, [0, -324000*_arcsec, 0, 0, 0], 1900, [0, 0, 0, 0, 0]],
                    [[0, 0, 400/_nbits_cf, 0, 0], Dexter.J3_A2D_SIN, Dexter.J3_A2D_COS, [0, 0, -500000*_arcsec, 0, 0], 1500, [0, 0, 0, 0, 0]],
                    [[0, 0, 0, 400/_nbits_cf, 0], Dexter.J4_A2D_SIN, Dexter.J4_A2D_COS, [0, 0, 0, -190000*_arcsec, 0], 1800, [0, 0, 0, 0, 0]],
                    [[0, 0, 0, 0, 400/_nbits_cf], Dexter.J5_A2D_SIN, Dexter.J5_A2D_COS, [0, 0, 0, 0, -148000*_arcsec], 4240, [0, 0, 0, 0, 0]]]
    
    /*
    centers_string = [["0x000000", "0x000000"],
                        ["0x000000", "0x000000"],
                        ["0x000000", "0x000000"],
                        ["0x000000", "0x000000"],
                        ["0x000000", "0x000000"]]
    */
    
    window.cal_working_axis = undefined //global needed by calibrate_ui.js
    new Job({name: "CalSensors", keep_history: true, show_instructions: false,
    		inter_do_item_dur: .5 * _ms,
             do_list: [ Dexter.move_all_joints(0, 0, 0, 0, 0),
             			Robot.label("loop_start"),
                        make_ins("w", 42, 64),
                        make_ins("S", "J1BoundryHigh",648000*_arcsec),
                        make_ins("S", "J1BoundryLow",-648000*_arcsec),
                        make_ins("S", "J2BoundryLow",-350000*_arcsec),
                        make_ins("S", "J2BoundryHigh",350000*_arcsec),
                        make_ins("S", "J3BoundryLow",-570000*_arcsec),
                        make_ins("S", "J3BoundryHigh",570000*_arcsec),
                        make_ins("S", "J4BoundryLow",-490000*_arcsec),
                        make_ins("S", "J4BoundryHigh",490000*_arcsec),
                        make_ins("S", "J5BoundryLow",-648000*_arcsec),
                        make_ins("S", "J5BoundryHigh",648000*_arcsec),

                        make_ins("S", "MaxSpeed", 25*_deg/_s),
                        make_ins("S", "Acceleration",0.000129),
                        make_ins("S", "StartSpeed",.7),
                        //scan_axis(),
                        smLinex,
                        display_center_guess,
                        make_ins("S", "MaxSpeed",13),
                        make_ins("S", "Acceleration",1/_nbits_cf),
                        make_ins("S", "StartSpeed",.05),
                        function(){
                        	if(cal_is_loop_checked(window.cal_working_axis+1)){ //if looping
                                return [
                                	function(){cal_clear_points()},
                                	function(){return smLinex(true)},
                                    function(){cal_clear_points()},
                                    Dexter.go_to("loop_start")
                                ]
                            }
                        },
                        Dexter.move_all_joints(0, 0, 0, 0, 0),
                        Dexter.empty_instruction_queue,
                        function() { 
                        	let J_num = window.cal_working_axis+1
        					let start_button_dom_elt = window["Start_J_" + J_num + "_id"]
                        	start_button_dom_elt.style.backgroundColor = "rgb(230, 179, 255)"
                            cal_instructions_id.innerHTML =
                                     "Click in the center of the dot_pattern circle.<br/>"}
                        ]})
	let ip_address = Job.CalSensors.robot.ip_address
    let path = "//" + ip_address + "/share/AdcCenters.txt"
    try{
    	//debugger
        let original_content = file_content(path)
        let content_array = original_content.split("\r\n")
    	centers_string = []
    	for(let i = 0; i < 10; i++){
    		//centers_string.push(content_array[i], content_array[i+1])
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
    catch(err) {
        warning("DDE was unable to connect to Dexter's file system.<br/>A full calibration can still be completed without this connection.<br/>This occurs when running on a Mac OS, not being connected to Dexter, or a accessing a non-existent file.<br/>The calibration file is named:<br/><code title='unEVALable'> " + path)
        centers_string = ["0x0000000", "0x0000000", "0x0000000", "0x0000000", "0x0000000", "0x0000000", "0x0000000", "0x0000000", "0x0000000", "0x0000000"]
    }
}