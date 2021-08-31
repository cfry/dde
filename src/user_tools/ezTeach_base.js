//ezTeach_base
//James Wigglesworth
//Based off of code from Kent Gilson
//Started: 8_14_17
//Updated: 1_26_18
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// General Use Functions:
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import {replace_substrings} from "../job_engine/core/utils.js"

function ez_my_settings(speed = 30){
    return [
    		make_ins("S", "GripperMotor", 0),
    		make_ins("w", 78, 1),
    		make_ins("w", 78, 0),
            make_ins("S", "J1BoundryLow",-188),
            make_ins("S", "J1BoundryHigh",188),
            make_ins("S", "J2BoundryLow",-97),
            make_ins("S", "J2BoundryHigh",97),
            make_ins("S", "J3BoundryLow",-158),
            make_ins("S", "J3BoundryHigh",158),
            make_ins("S", "J4BoundryLow",-108),
            make_ins("S", "J4BoundryHigh",108),
            make_ins("S", "J5BoundryLow",-190),
            make_ins("S", "J5BoundryHigh",190),
            make_ins("S", "MaxSpeed", speed),
            make_ins("S", "StartSpeed", .05),
            make_ins("S", "Acceleration", .0001),
    	   ]
}

function ez_get_object(parent_obj, key_string){
	let result = parent_obj
    let keys = key_string.split(".")
    for(let i = 0; i < keys.length; i++){
    	result = result[keys[i]]
    }
    return result
}

function ez_get_path_string(object, name_stop = "Root"){
    let current_name = object.name
    let name_list = [current_name]
    let current_obj = object
    
    while(current_name != name_stop){
    	current_obj = current_obj.prototype
        current_name = current_obj.name
        name_list.unshift(current_name)
    }
    let result = ""
    for(let i = 1; i < name_list.length-1; i++){
    	result += name_list[i] + "."
    }
    result += name_list[name_list.length-1]
    return result
}





function ezTeach_init(points_filepath = "choose_file", robot = Robot.dexter0){


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Code for Create
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function ez_show_create_doc(){
    show_window({title: "ezTeach GamePad Button Mapping",
        content: '<img width="1000"  src="' + __dirname +
        '/user_tools/ezTeach_create.jpg' +'"/>',
        x: 0, y: 50,
        width: 1020, height: 300
    })
}

function ez_show_run_doc(){
    show_window({title: "ezTeach GamePad Button Mapping",
        content: '<img width="1000"  src="' + __dirname +
        '/user_tools/ezTeach_run.jpg' +'"/>',
        x: 0, y: 50,
        width: 1020, height: 300
    })
}

function Init_Create(){
	// Initialize Game Controller
    SW.clear_output()
	let game_pads = navigator.getGamepads()
    let game_pad_idx
	for(let i = 0; i < game_pads.length; i++){
    	if(game_pads[i] != null && game_pads[i].id === game_controller_name){
    		game_pad_idx = i
        	break
    	}else if(i == game_pads.length - 1){
    		let game_str = ""
    		for(let j = 0; j < game_pads.length; j++){
        		if(game_pads[j] != null){
            		game_str += "<br>" + game_pads[j].id
            	}
        	}
            dde_error("Press any button on controller and try again.")
        }
	}
	this.user_data.game_pad_idx = game_pad_idx
    
    
    // Move to the start position
    let start_position = this.user_data.inputs.start_position
    let CMD = [ ez_show_create_doc,
    			ez_my_settings,
                Dexter.move_to(start_position[0], start_position[1], start_position[2]),
                /*
                function(){
                	let choice_made = Human.enter_choice({task: "Select Coordinate System", choices: ["Yes", "No"], show_choices_as_buttons: true})
                    switch(choice_made){
                    	case "Yes":
                        
                        break
                        case "No":
                        
                        break
                        default:
                        out("Something wierd happened")
                    }
                }*/
    		  
              ]
    this.user_data.old_buttons = navigator.getGamepads()[this.user_data.game_pad_idx].buttons
    this.user_data.old_position = start_position
    this.user_data.save_point = false
    this.user_data.reset = false
    this.user_data.next_coor = false
    this.user_data.prev_coor = false
    this.user_data.speed_up = false
    this.user_data.speed_down = false
    Coor.create_child(undefined, "Dexter_Base")
    return CMD
}

function Main_Create(){
    //Values to change when tuning for speed/smoothness/lag:
    let max_ang_vel = 10 *(_deg/_s) 	// This controls both the xyz velocity and pivot velocity even though it's in deg/s. All speeds are currently done in joint space.
    let max_step = 3.5 *(_mm)			// When a Joystick is pressed to its max this is the distance between startpoint and endpoint of the straight line.
    let resolution = 3 *(_mm) 			// Straight line interpolated segements cannot exceed this distance.
    let max_pivot = 10 *(_deg)			// When a Joystick is pressed to its max this is the angle between starting angle and ending angle of the pivot motion.
    let pivot_resolution = .2 *(_deg)	// Pivot interpolated movement change in J_angles cannot exceed this value
    
    let CMD = []
    let inputs = this.user_data.inputs
    let clearance = inputs.lift_height
    let gp = navigator.getGamepads()[this.user_data.game_pad_idx]
    let rs = this.robot.robot_status
	let J_angles = [rs[Dexter.J1_ANGLE], rs[Dexter.J2_ANGLE], rs[Dexter.J3_ANGLE], rs[Dexter.J4_ANGLE], rs[Dexter.J5_ANGLE]]
    let position = this.user_data.old_position
        
    let base_coor = ez_get_object(Coor, this.user_data.coordinate_systems[0])
    let local_coor = ez_get_object(Coor, this.user_data.coordinate_systems[this.user_data.coordinate_system_idx])
    let local_position = [[], [], position[2].slice()]
    let local_direction = local_coor.get_xy_plane_direction()
    local_position[0] = Coor.move_points_to_coor(position[0].slice(), base_coor, local_coor)
    local_position[1] = Coor.move_vectors_to_coor(position[1].slice(), base_coor, local_coor)
	let speed_factor = this.user_data.speed_factor_list[this.user_data.speed_factor_idx]
    //Pressed Buttons:
    if(gp.buttons[map.speed_down].pressed){
    	this.user_data.speed_down = true
    }
    
    if(gp.buttons[map.speed_up].pressed){
    	this.user_data.speed_up = true
    }
    
    if(gp.buttons[map.next_coor].pressed){
    	this.user_data.next_coor = true
    }
    
    if(gp.buttons[map.prev_coor].pressed){
    	this.user_data.prev_coor = true
    }
    
   	if(gp.buttons[map.plane_point].pressed){
    	let pp_array = []
        for(let i = 0; i < 3; i++){
        	if(this.user_data.plane_points[i].position[0] != undefined){
            	pp_array.push(Vector.round(this.user_data.plane_points[i].position[0], 3))
            }else{
            	pp_array.push(undefined)
            }
        }
        out("Plane point " + (this.user_data.plane_points_idx + 1) + " is at: [" + Vector.round(position[0], 3) + "] (meters) <br> Plane points: 1: [" + 
        pp_array[0] + "], 2: [" + pp_array[1] + "], 3: [" + pp_array[2] + "] </br>", "blue", true)
    
    	this.user_data.plane_point = true
    }
    
    if(gp.buttons[map.set_plane].pressed){
    	this.user_data.set_plane = true
    }
    
    if(gp.buttons[map.finish].pressed){
    	this.user_data.finish = true
    }
    
    let xyzVel = [0, 0, 0] // (m/s)
    let xyzStep = [0, 0, 0] // (m)
    let JoystickPos = gp.axes
    if(Math.abs(JoystickPos[0]) < joystick_threshold){JoystickPos[0] = 0}
    if(Math.abs(JoystickPos[1]) < joystick_threshold){JoystickPos[1] = 0}
    if(Math.abs(JoystickPos[2]) < joystick_threshold){JoystickPos[2] = 0}
    if(Math.abs(JoystickPos[3]) < joystick_threshold){JoystickPos[3] = 0}
    
    // Main Joystick code:
    if(gp.buttons[map.pivot_mode].pressed){
    	// Pivot Motions:
        let old_J_angles = Kin.xyz_to_J_angles(position[0], position[1], position[2])
        let Joystick_thetas = [-JoystickPos[map.x_theta], JoystickPos[map.y_theta]]
        Joystick_thetas[0] *= .1
        Joystick_thetas[1] *= .1
        Joystick_thetas = Vector.multiply(max_pivot, Joystick_thetas)
        
        let angles_1
        if(position[1].length === 3){
        	angles_1 = Kin.dir_xyz_to_angles(position[1])
        }else{
        	angles_1 = position[1]
        }
        let delta_angles = Vector.multiply(max_pivot, Joystick_thetas)
        let angles_2 = Vector.add(angles_1, delta_angles)
        let joy_mag = Vector.magnitude(delta_angles)
        let new_J_angles = Kin.xyz_to_J_angles(position[0], Kin.angles_to_dir_xyz(angles_2), position[2])
        
        if(!Vector.is_equal(old_J_angles, new_J_angles, 1)){
        	let pivot_J_angles = Kin.interp_movement(old_J_angles, new_J_angles, pivot_resolution)
        	CMD.push(make_ins("S", "MaxSpeed", joy_mag * max_ang_vel/10))
        	CMD.push(make_ins("S", "StartSpeed", joy_mag * max_ang_vel/10))
        	for(let i = 0; i < pivot_J_angles.length; i++){
        		CMD.push(Dexter.move_all_joints(pivot_J_angles[i]))
        	}
        	this.user_data.old_position = [position[0], Kin.angles_to_dir_xyz(angles_2), position[2]]
        }
    }else{
    	// XYZ Motion:
    	let xy_theta = Math.atan2(JoystickPos[map.Y], JoystickPos[map.X])
        let JoystickXYZ = [JoystickPos[map.X], -JoystickPos[map.Y], -JoystickPos[map.Z]]
        let joy_mag = Vector.magnitude(JoystickXYZ)
        if(joy_mag != 0){
            xyzStep = Vector.multiply(speed_factor, max_step, JoystickXYZ)
            let mag = Vector.magnitude(xyzStep)
            let res
            
            let xyz_1 = position[0]
            let local_xyz_1 = local_position[0]
            let local_xyz_2 = Vector.add(local_xyz_1, xyzStep)
            let xyz_2 = Coor.move_points_to_coor(local_xyz_2, local_coor, base_coor)
            if(!Kin.is_in_reach(xyz_2, position[1], position[2]) || !Kin.is_in_reach(xyz_1, position[1], position[2])){
            	//out("Robot limit reached", "blue")
            }else{
            	res = Kin.move_to_straight(xyz_1, xyz_2, position[1], position[2], undefined, resolution)
            	for(let i = 0; i < res[0].length; i++){
                	if(Kin.is_in_reach(res[0][i], position[1], position[2])){
                		CMD.push(make_ins("S", "MaxSpeed", speed_factor * joy_mag * max_ang_vel))
            			CMD.push(make_ins("S", "StartSpeed", speed_factor * joy_mag * max_ang_vel))
                		CMD.push(Dexter.move_to(res[0][i], position[1], position[2]))
                	}else{
                		out("Robot limit reached", "blue")
                	}
            	}
                this.user_data.old_position = [res[0][res[0].length - 1], position[1], position[2]]
            }
        }
    }
    
    if(gp.buttons[map.save_point].pressed){
    	if(gp.buttons[map.action_state].pressed){
    		out("Point is at [" + Vector.round(position[0], 4) + "](m) with normal [" + Vector.round(position[1], 3) + "]. Action state set to true.", "blue", true)
        }else{
        	out("Point is at [" + Vector.round(position[0], 4) + "](m) with normal [" + Vector.round(position[1], 3) + "]. Action state set to false.", "blue", true)
        }
        this.user_data.save_point = true
    }
    if(gp.buttons[map.cycle_left].pressed){
        this.user_data.cycle_left = true
    }
    if(gp.buttons[map.cycle_right].pressed){
        this.user_data.cycle_right = true
    }
    
    if(gp.buttons[map.reset].pressed){ 
    	if(!this.user_data.reset){
        	this.user_data.reset_start_time = Date.now()
            this.user_data.reset = true
        }else{
        	CMD = [
        		make_ins("S", "MaxSpeed", 30),
        		make_ins("S", "StartSpeed", .5),
        		make_ins("S", "Acceleration", 0.0001)
            	]
        	let origin, direction
        	if(this.user_data.coordinate_system_idx == 0){
        		origin = this.user_data.inputs.start_position[0]
            	direction = this.user_data.inputs.start_position[1]
        	}else{
        		origin = local_coor.get_position()
            	direction = local_coor.get_xy_plane_direction()
        	}
            
    		let reset_dur = (Date.now() - this.user_data.reset_start_time) * _ms
        
    		if(reset_dur < 1 * _s){
        		out("Caution: This button may drastically move Dexter. Hold for 1 sec to reset direction and 3 sec to reset position, relative to current coordiante system.", "blue", true)
        	}else if(reset_dur < 3 * _s){
                out("", "blue", true)
        		CMD.push(Dexter.move_to(position[0], direction, position[2]))
            	this.user_data.old_position = [position[0], direction, position[2]]
        	}else{
            	//debugger
        		CMD.push(Dexter.move_to(origin, direction, position[2]))
            	this.user_data.old_position = [origin, direction, position[2]]
        	}
            this.user_data.old_buttons = gp.buttons
    		//CMD.push(make_ins("F"))
    		CMD.push(make_ins("g"))
    		CMD.push(Control.go_to("Main_Create"))
    		return CMD
            
        }// end prev state
    }// end button press
    
    if(gp.buttons[map.follow_mode].pressed){
    	/*
    	if(this.user_data.follow_mode === false){
        	CMD.push(Dexter.set_follow_me)
        }
        */
    	this.user_data.follow_mode = true
    }
    
    
    
    
    
    
    //Released Buttons:
    
    
    if(!gp.buttons[map.speed_down].pressed && this.user_data.speed_down){
    	if(this.user_data.speed_factor_idx < this.user_data.speed_factor_list.length - 1){
        	this.user_data.speed_factor_idx++
        }
        out("Speed factor set to: " + this.user_data.speed_factor_strings[this.user_data.speed_factor_idx])
    	this.user_data.speed_down = false
    }
    
    if(!gp.buttons[map.speed_up].pressed && this.user_data.speed_up){
    	if(this.user_data.speed_factor_idx > 0){
        	this.user_data.speed_factor_idx--
        }
        out("Speed factor set to: " + this.user_data.speed_factor_strings[this.user_data.speed_factor_idx])
    	this.user_data.speed_up = false
    }
    
    if(!gp.buttons[map.next_coor].pressed && this.user_data.next_coor){
    	if(this.user_data.coordinate_system_idx < this.user_data.coordinate_systems.length - 1){
        	this.user_data.coordinate_system_idx++
        }
        out("Now in coordinate system " + this.user_data.coordinate_system_idx + ": " + this.user_data.coordinate_systems[this.user_data.coordinate_system_idx] + ". Exisiting coordinate systems:")
        out(this.user_data.coordinate_systems)
        
    	this.user_data.next_coor = false
    }
    
    if(!gp.buttons[map.prev_coor].pressed && this.user_data.prev_coor){
    	if(this.user_data.coordinate_system_idx > 0){
        	this.user_data.coordinate_system_idx--
        }
        out("Now in coordinate system " + this.user_data.coordinate_system_idx + ": " + this.user_data.coordinate_systems[this.user_data.coordinate_system_idx] + ". Exisiting coordinate systems:")
        out(this.user_data.coordinate_systems)
        
    	this.user_data.prev_coor = false
    }
    
    if(!gp.buttons[map.set_plane].pressed && this.user_data.set_plane){
    	let J_angles_1 = this.user_data.plane_points[0].J_angles
        let J_angles_2 = this.user_data.plane_points[1].J_angles
        let J_angles_3 = this.user_data.plane_points[2].J_angles
		if(J_angles_1.length == 0 || J_angles_2.length == 0 || J_angles_3.length == 0){
        	out("Three points are required to create a plane", "blue", true)
        }else{
        	let new_pose = Kin.three_positions_to_pose(J_angles_1, J_angles_2, J_angles_3)
            let new_coor = local_coor.create_child(new_pose, "Coordinate_System_" + this.user_data.coordinate_systems.length)
            this.user_data.coordinate_systems.push(ez_get_path_string(new_coor, "Coor"))
            this.user_data.coordinate_system_idx++
            
           	let dir = Vector.transpose(Vector.pull(new_coor.pose, [0, 2], [2,2]))
        	out("New plane set at: [" + Vector.round(new_coor.get_position(), 3) + "] with plane normal: [" + Vector.round(dir, 3) + "]. Coordinate systems:")
            out(this.user_data.coordinate_systems)
            
            this.user_data.plane_points[0].J_angles = []
            this.user_data.plane_points[1].J_angles = []
            this.user_data.plane_points[2].J_angles = []
            
            this.user_data.set_plane = false
        }
    }
    
    if(!gp.buttons[map.plane_point].pressed && this.user_data.plane_point){
		this.user_data.plane_points[this.user_data.plane_points_idx].position = position
        this.user_data.plane_points[this.user_data.plane_points_idx].J_angles = J_angles
        let pp_array = []
        for(let i = 0; i < 3; i++){
        	if(this.user_data.plane_points[i].position[0] != undefined){
            	pp_array.push(Vector.round(this.user_data.plane_points[i].position[0], 3))
            }else{
            	pp_array.push(undefined)
            }
        }
        
        out("Plane point " + (this.user_data.plane_points_idx + 1) + " saved at: [" + Vector.round(position[0], 3) + "] (meters) <br> Plane points: 1: [" + 
        pp_array[0] + "], 2: [" + pp_array[1] + "], 3: [" + pp_array[2] + "] </br>")
        
        this.user_data.plane_points_idx = (this.user_data.plane_points_idx + 1) % 3
		this.user_data.plane_point = false
    }
    
    if(!gp.buttons[map.follow_mode].pressed && this.user_data.follow_mode){
    	//CMD.push(Dexter.set_open_loop)
        this.user_data.follow_mode = false
    }
    
    if(!gp.buttons[map.finish].pressed && this.user_data.finish){
    	CMD.push(Control.go_to("Finish_Create"))
        this.user_data.finish = false
    }
    
    if(!gp.buttons[map.reset].pressed && this.user_data.reset){
        this.user_data.reset = false
    }
    
    if(!gp.buttons[map.save_point].pressed && this.user_data.save_point){
    	let res = ez_create_position({job: this, game_controller: gp, position: position, J_angles: J_angles})
        let position_object = res[0]
        for(let i = 0; i < res[0].length; i++){
        	CMD.push(res[1][i])
        }
        this.user_data.saved_positions.splice(this.user_data.cur_point_idx + 1, 0, position_object)
        out("Point saved at [" + Vector.round(position[0], 4) + "] with normal [" + Vector.round(position[1], 3) + "]. Action state set to " + position_object.properties.extrude_state + ".")
        this.user_data.save_point = false
        this.user_data.cur_point_idx++
        this.user_data.save_point_state = true
    }

	if(!gp.buttons[map.cycle_right].pressed && this.user_data.cycle_right){
    	if(this.user_data.save_point_state === true){
        	this.user_data.cur_point_idx--
        	this.user_data.save_point_state = false
    	}
    	if(this.user_data.saved_positions.length > 0){
        	if(this.user_data.cur_point_idx === this.user_data.saved_positions.length - 1){
        		out("You are currently on the last of " + this.user_data.saved_positions.length + " point(s). Press left button to move to the previous point.", "blue", true)
        	}else{
        		this.user_data.cur_point_idx++
            	out("You are currently on point " + (this.user_data.cur_point_idx+1) + " of " + this.user_data.saved_positions.length + " point(s).", "blue", true)
        		let position_object = this.user_data.saved_positions[this.user_data.cur_point_idx]
        		let new_CMDs = ez_run_position({position_object: position_object, job: this, game_pad: gp, position: position, J_angles: J_angles, extrude_time: this.user_data.input.extrude_time}, true)
        		for(let i = 0; i < new_CMDs.length; i++){
        			CMD.push(new_CMDs[i])
        		}
        	}
        	this.user_data.cycle_right = false
        }else{
        	out("Attempted to move to next point but no points are saved. To save a point press Left-bumper.", "blue", true)
        }
    }
    if(!gp.buttons[map.cycle_left].pressed && this.user_data.cycle_left){
    	if(this.user_data.save_point_state === true){
        	this.user_data.cur_point_idx--
        	this.user_data.save_point_state = false
    	}
    	if(this.user_data.saved_positions.length > 0){
            if(this.user_data.cur_point_idx === 0){
        		out("You are currently on the first of " + this.user_data.saved_positions.length + " point(s). Press right button to move to the next point.", "blue", true)
        	}else{
        		this.user_data.cur_point_idx--
            	out("You are currently on point " + (this.user_data.cur_point_idx+1) + " of " + this.user_data.saved_positions.length + " point(s).", "blue", true)
        		let position_object = this.user_data.saved_positions[this.user_data.cur_point_idx]
        		let new_CMDs = ez_run_position({position_object: position_object, job: this, game_pad: gp, position: position, J_angles: J_angles}, true)
        		for(let i = 0; i < new_CMDs.length; i++){
        			CMD.push(new_CMDs[i])
        		}
        		this.user_data.cycle_left = false
        	}
        }else{
        	out("Attempted to move to previous point but no points are saved. To save a point press Left-bumper.", "blue", true)
        }
    }
    
    this.user_data.old_buttons = gp.buttons
    //CMD.push(make_ins("F"))
    CMD.push(make_ins("g"))
    CMD.push(Control.go_to("Main_Create"))
    return CMD
}

function Finish_Create(){
	let ready_position = this.user_data.inputs.start_position
	let CMD = [
    	       make_ins("S", "MaxSpeed", 30),
               make_ins("S", "StartSpeed", .5),
               make_ins("S", "Acceleration", 0.0001),
               Dexter.move_all_joints(0, 0, 0, 0, 0),
               function(){
               		let CMD = []
               		if(this.user_data.saved_positions.length != 0 || this.user_data.coordinate_systems.length > 1){
                    	if(points_filepath == "choose_file"){
							points_filepath = choose_save_file({buttonLabel: "Save As"})
                        	if(points_filepath == undefined){
                            	out("Job has been stopped. No positions file saved.", "blue")
                                return CMD
                            }
                        }
                    	if(!points_filepath.endsWith(".json")){
                    		points_filepath += ".json"
                    	}
						
                        let coor_name = this.user_data.coordinate_systems[0]
                        let coor_source_string = ez_get_object(Coor, coor_name).sourceCode()
                        let file_string = JSON.stringify({old_user_data: this.user_data, coor_source_string: coor_source_string})
                       
                        file_string = replace_substrings(file_string, "\"saved_positions\":\\[\\{", "\"saved_positions\":\[\n\n\n{\n    ")
                        file_string = replace_substrings(file_string, "\"start_position\"", "\n    \"start_position\"")
                        file_string = replace_substrings(file_string, "}],\"plane_points\"", "\n}\n],\n\n\n\n\"plane_points\"")         
                        file_string = replace_substrings(file_string, "{},", "{}, ")         
                        file_string = replace_substrings(file_string, ",\"", ",\n    \"")
                        file_string = replace_substrings(file_string, "},{", "\n},\n{\n    ")
                        
                    	write_file(points_filepath, file_string)
                        out("Positions saved to " + points_filepath, "blue")
                    }else{
                    	out("No positions or coordinate systems were recorded so no file was created", "blue")
                    }
                    return CMD
			   }
    	  ]
	return CMD
}

//get_object(Coor, "Dexter_Base.Coordinate_System_1")
new Job({name: "ezCreate", 
         inter_do_item_dur: .5*_ms,
         robot: robot, keep_history: false, show_instructions: false,
		 user_data:{
         	inputs: inputs_for_ezCreate,
         	cur_point_idx: 0,
         	saved_positions: [],
         	plane_points: [{position: [], J_angles: []}, {position: [], J_angles: []}, {position: [], J_angles: []}],
            plane_points_idx: 0,
         	coordinate_systems: ["Dexter_Base"],
            coordinate_system_idx: 0,
            speed_factor_idx: 3,
            speed_factor_list: [4, 3, 2, 1, 1/2, 1/3, 1/4, 1/6, 1/8, 1/10, 1/20, 1/50, 1/100, 1/200, 1/500, 1/1000],
            speed_factor_strings: ["4", "3", "2", "1", "1/2", "1/3", "1/4", "1/6", "1/8", "1/10", "1/20", "1/50", "1/100", "1/200", "1/500", "1/1000"],
         	scale_factor: .1
         },
         do_list: [	
         		Init_Create,
                Main_Create,
                Finish_Create
         ]})       



















////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Code for ezRun
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Init_Run(){
	let CMD = []
    SW.clear_output()
	
    // Load in saved points file
    if(points_filepath == "choose_file"){
		points_filepath = choose_file({buttonLabel: "Open"})
    	if(points_filepath === undefined){
    		return Control.stop_job
    	}
    }
    let content = read_file(points_filepath)
    let parsed_content = JSON.parse(content)
    eval(parsed_content.coor_source_string)
    let old_data = parsed_content.old_user_data
    for(let key in old_data){
    	this.user_data[key] = old_data[key]
    }
    
    
    if(this.user_data.coordinate_systems.length > 1){
    	CMD.push(Human.enter_choice({task: "Would you like to re-define local coordinate systems?<br/>", 
        		      				 choices: [["Yes", true], ["No", false]],
                                     add_stop_button: false,
                                     height: 130,
                                     width: 450,
                                     show_choices_as_buttons: true}))
    	CMD.push(function(){
        	if(this.user_data.choice){
            	out("Gamepad will now control robot. Re-define coordinate systems then press the menu button to start running.")
            	return [Init_Edit_Coors_Run, Edit_Coors_Run]
            }
    	})
    }

    let ready_position = this.user_data.inputs.start_position
    //CMD.push(Dexter.move_to(ready_position[0], ready_position[1], ready_position[2]))
    CMD.push(make_ins("g"))
    return CMD
}

function Init_Edit_Coors_Run(){
	// Initialize Game Controller
    SW.clear_output()
	let game_pads = navigator.getGamepads()
    let game_pad_idx
	for(let i = 0; i < game_pads.length; i++){
    	if(game_pads[i] != null && game_pads[i].id === game_controller_name){
    		game_pad_idx = i
        	break
    	}else if(i == game_pads.length - 1){
    		let game_str = ""
    		for(let j = 0; j < game_pads.length; j++){
        		if(game_pads[j] != null){
            		game_str += "<br>" + game_pads[j].id
            	}
        	}
    		dde_error("Couldn't find specified controller. Press any button on controller and try again.<br>If that doesn't work copy controller name from below and paste into line 10 between quotation marks:" + game_str)
    	}
	}
	this.user_data.game_pad_idx = game_pad_idx
    // Move to the start position
    let start_position = this.user_data.inputs.start_position
    let CMD = [ ez_show_run_doc,
    			ez_my_settings,
                Dexter.move_to(start_position[0], start_position[1], start_position[2])
              ]
    this.user_data.old_buttons = navigator.getGamepads()[this.user_data.game_pad_idx].buttons
    this.user_data.old_position = start_position
    this.user_data.save_point = false
    this.user_data.reset = false
    this.user_data.next_coor = false
    this.user_data.prev_coor = false
    this.user_data.speed_up = false
    this.user_data.speed_down = false
    this.user_data.plane_points[0].J_angles = []
    this.user_data.plane_points[1].J_angles = []
    this.user_data.plane_points[2].J_angles = [] 
    this.user_data.coordinate_system_idx = 0
    return CMD
}

function Edit_Coors_Run(){
	//Values to change when tuning for speed/smoothness/lag:
    let max_ang_vel = 10 *(_deg/_s) 	// This controls both the xyz velocity and pivot velocity even though it's in deg/s. All speeds are currently done in joint space.
    let max_step = 3.5 *(_mm)			// When a Joystick is pressed to its max this is the distance between startpoint and endpoint of the straight line.
    let resolution = 3 *(_mm) 			// Straight line interpolated segements cannot exceed this distance.
    let max_pivot = 10 *(_deg)			// When a Joystick is pressed to its max this is the angle between starting angle and ending angle of the pivot motion.
    let pivot_resolution = .2 *(_deg)	// Pivot interpolated movement change in J_angles cannot exceed this value
    
    let CMD = []
    let inputs = this.user_data.inputs
    let clearance = inputs.lift_height
    let gp = navigator.getGamepads()[this.user_data.game_pad_idx]
    let rs = this.robot.robot_status
	let J_angles = [rs[Dexter.J1_ANGLE], rs[Dexter.J2_ANGLE], rs[Dexter.J3_ANGLE], rs[Dexter.J4_ANGLE], rs[Dexter.J5_ANGLE]]
    let position = this.user_data.old_position
        
    let base_coor = ez_get_object(Coor, this.user_data.coordinate_systems[0])
    let local_coor = ez_get_object(Coor, this.user_data.coordinate_systems[this.user_data.coordinate_system_idx])
    let local_position = [[], [], position[2].slice()]
    let local_direction = local_coor.get_xy_plane_direction()
    local_position[0] = Coor.move_points_to_coor(position[0].slice(), base_coor, local_coor)
    local_position[1] = Coor.move_vectors_to_coor(position[1].slice(), base_coor, local_coor)
	let speed_factor = this.user_data.speed_factor_list[this.user_data.speed_factor_idx]
    
    
    
    //Pressed Buttons:
    if(gp.buttons[map.speed_down].pressed){
    	this.user_data.speed_down = true
    }
    
    if(gp.buttons[map.speed_up].pressed){
    	this.user_data.speed_up = true
    }
    
    if(gp.buttons[map.next_coor].pressed){
    	this.user_data.next_coor = true
    }
    
    if(gp.buttons[map.prev_coor].pressed){
    	this.user_data.prev_coor = true
    }
    
   	if(gp.buttons[map.plane_point].pressed){
    	let pp_array = []
        for(let i = 0; i < 3; i++){
        	if(this.user_data.plane_points[i].position[0] != undefined){
            	pp_array.push(Vector.round(this.user_data.plane_points[i].position[0], 3))
            }else{
            	pp_array.push(undefined)
            }
        }
        out("Plane point " + (this.user_data.plane_points_idx + 1) + " is at: [" + Vector.round(position[0], 3) + "] (meters) <br> Plane points: 1: [" + 
        pp_array[0] + "], 2: [" + pp_array[1] + "], 3: [" + pp_array[2] + "] </br>", "blue", true)
    
    	this.user_data.plane_point = true
    }
    
    if(gp.buttons[map.set_plane].pressed){
    	this.user_data.set_plane = true
    }
    
    if(gp.buttons[map.set_plane].pressed){
    	this.user_data.set_plane = true
    }
    
    if(gp.buttons[map.finish].pressed){
    	this.user_data.finish = true
    }
    
    let xyzVel = [0, 0, 0] // (m/s)
    let xyzStep = [0, 0, 0] // (m)
    let JoystickPos = gp.axes
    if(Math.abs(JoystickPos[0]) < joystick_threshold){JoystickPos[0] = 0}
    if(Math.abs(JoystickPos[1]) < joystick_threshold){JoystickPos[1] = 0}
    if(Math.abs(JoystickPos[2]) < joystick_threshold){JoystickPos[2] = 0}
    if(Math.abs(JoystickPos[3]) < joystick_threshold){JoystickPos[3] = 0}
    
    // Main Joystick code:
    if(gp.buttons[map.pivot_mode].pressed){
    	// Pivot Motions:
        let old_J_angles = Kin.xyz_to_J_angles(position[0], position[1], position[2])
        let Joystick_thetas = [-JoystickPos[map.x_theta], JoystickPos[map.y_theta]]
        Joystick_thetas[0] *= .1
        Joystick_thetas[1] *= .1
        Joystick_thetas = Vector.multiply(max_pivot, Joystick_thetas)
        
        let angles_1
        if(position[1].length === 3){
        	angles_1 = Kin.dir_xyz_to_angles(position[1])
        }else{
        	angles_1 = position[1]
        }
        let delta_angles = Vector.multiply(max_pivot, Joystick_thetas)
        let angles_2 = Vector.add(angles_1, delta_angles)
        let joy_mag = Vector.magnitude(delta_angles)
        let new_J_angles = Kin.xyz_to_J_angles(position[0], Kin.angles_to_dir_xyz(angles_2), position[2])
        
        if(!Vector.is_equal(old_J_angles, new_J_angles, 1)){
        	let pivot_J_angles = Kin.interp_movement(old_J_angles, new_J_angles, pivot_resolution)
        	CMD.push(make_ins("S", "MaxSpeed", joy_mag * max_ang_vel/10))
        	CMD.push(make_ins("S", "StartSpeed", joy_mag * max_ang_vel/10))
        	for(let i = 0; i < pivot_J_angles.length; i++){
        		CMD.push(Dexter.move_all_joints(pivot_J_angles[i]))
        	}
        	this.user_data.old_position = [position[0], Kin.angles_to_dir_xyz(angles_2), position[2]]
        }
    }else{
    	// XYZ Motion:
    	let xy_theta = Math.atan2(JoystickPos[map.Y], JoystickPos[map.X])
        let JoystickXYZ = [JoystickPos[map.X], -JoystickPos[map.Y], -JoystickPos[map.Z]]
        let joy_mag = Vector.magnitude(JoystickXYZ)
        if(joy_mag != 0){
            xyzStep = Vector.multiply(speed_factor, max_step, JoystickXYZ)
            let mag = Vector.magnitude(xyzStep)
            let res
            
            let xyz_1 = position[0]
            let local_xyz_1 = local_position[0]
            let local_xyz_2 = Vector.add(local_xyz_1, xyzStep)
            let xyz_2 = Coor.move_points_to_coor(local_xyz_2, local_coor, base_coor)
            
            res = Kin.move_to_straight(xyz_1, xyz_2, position[1], position[2], undefined, resolution)
            for(let i = 0; i < res[0].length; i++){
                if(Kin.is_in_reach(res[0][i], position[1], position[2])){
                	CMD.push(make_ins("S", "MaxSpeed", speed_factor * joy_mag * max_ang_vel))
            		CMD.push(make_ins("S", "StartSpeed", speed_factor * joy_mag * max_ang_vel))
                	CMD.push(Dexter.move_to(res[0][i], position[1], position[2]))
                }else{
                	out("Robot limit reached", "red", true)
                }
            }
            this.user_data.old_position = [res[0][res[0].length - 1], position[1], position[2]]
        }
    }
    
    if(gp.buttons[map.save_point].pressed){
    	out("Points cannot be created in the ezRun job.")
    	/*
    	if(gp.buttons[map.action_state].pressed){
    		out("Point is at [" + Vector.round(position[0], 4) + "](m) with normal [" + Vector.round(position[1], 3) + "]. Action state set to true.", "blue", true)
        }else{
        	out("Point is at [" + Vector.round(position[0], 4) + "](m) with normal [" + Vector.round(position[1], 3) + "]. Action state set to false.", "blue", true)
        }*/
        this.user_data.save_point = true
    }
    if(gp.buttons[map.cycle_left].pressed){
        this.user_data.cycle_left = true
    }
    if(gp.buttons[map.cycle_right].pressed){
        this.user_data.cycle_right = true
    }
    
    if(gp.buttons[map.reset].pressed){ 
    	if(!this.user_data.reset){
        	this.user_data.reset_start_time = Date.now()
            this.user_data.reset = true
        }else{
        	CMD = [
        		make_ins("S", "MaxSpeed", 30),
        		make_ins("S", "StartSpeed", .5),
        		make_ins("S", "Acceleration", 0.0001)
            	]
        	let origin, direction
        	if(this.user_data.coordinate_system_idx == 0){
        		origin = this.user_data.inputs.start_position[0]
            	direction = this.user_data.inputs.start_position[1]
        	}else{
        		origin = local_coor.get_position()
            	direction = local_coor.get_xy_plane_direction()
        	}
            
    		let reset_dur = (Date.now() - this.user_data.reset_start_time) * _ms
        
    		if(reset_dur < 1 * _s){
        		out("Caution: This button may drastically move Dexter. Hold for 1 sec to reset direction and 3 sec to reset position, relative to current coordiante system.", "blue", true)
        	}else if(reset_dur < 3 * _s){
                out("", "blue", true)
        		CMD.push(Dexter.move_to(position[0], direction, position[2]))
            	this.user_data.old_position = [position[0], direction, position[2]]
        	}else{
            	//debugger
        		CMD.push(Dexter.move_to(origin, direction, position[2]))
            	this.user_data.old_position = [origin, direction, position[2]]
        	}
            this.user_data.old_buttons = gp.buttons
    		//CMD.push(make_ins("F"))
    		CMD.push(make_ins("g"))
    		CMD.push(Control.go_to("Edit_Coors_Run"))
    		return CMD
            
        }// end prev state
    }// end button press
    
    if(gp.buttons[map.follow_mode].pressed){
    	/*
    	if(this.user_data.follow_mode === false){
        	CMD.push(Dexter.set_follow_me)
        }
        */
    	this.user_data.follow_mode = true
    }
    
    
    
    
    
    
    //Released Buttons:
    
    
    if(!gp.buttons[map.speed_down].pressed && this.user_data.speed_down){
    	if(this.user_data.speed_factor_idx < this.user_data.speed_factor_list.length - 1){
        	this.user_data.speed_factor_idx++
        }
        out("Speed factor set to: " + this.user_data.speed_factor_strings[this.user_data.speed_factor_idx])
    	this.user_data.speed_down = false
    }
    
    if(!gp.buttons[map.speed_up].pressed && this.user_data.speed_up){
    	if(this.user_data.speed_factor_idx > 0){
        	this.user_data.speed_factor_idx--
        }
        out("Speed factor set to: " + this.user_data.speed_factor_strings[this.user_data.speed_factor_idx])
    	this.user_data.speed_up = false
    }
    
    if(!gp.buttons[map.next_coor].pressed && this.user_data.next_coor){
    	if(this.user_data.coordinate_system_idx < this.user_data.coordinate_systems.length - 1){
        	this.user_data.coordinate_system_idx++
        }
        out("Now in coordinate system " + this.user_data.coordinate_system_idx + ": " + this.user_data.coordinate_systems[this.user_data.coordinate_system_idx] + ". Exisiting coordinate systems:")
        out(this.user_data.coordinate_systems)
        
    	this.user_data.next_coor = false
    }
    
    if(!gp.buttons[map.prev_coor].pressed && this.user_data.prev_coor){
    	if(this.user_data.coordinate_system_idx > 0){
        	this.user_data.coordinate_system_idx--
        }
        out("Now in coordinate system " + this.user_data.coordinate_system_idx + ": " + this.user_data.coordinate_systems[this.user_data.coordinate_system_idx] + ". Exisiting coordinate systems:")
        out(this.user_data.coordinate_systems)
        
    	this.user_data.prev_coor = false
    }
    
    if(!gp.buttons[map.set_plane].pressed && this.user_data.set_plane){
    	let J_angles_1 = this.user_data.plane_points[0].J_angles
        let J_angles_2 = this.user_data.plane_points[1].J_angles
        let J_angles_3 = this.user_data.plane_points[2].J_angles
        
		if(J_angles_1.length == 0 || J_angles_2.length == 0 || J_angles_3.length == 0){
        	out("Three points are required to create a plane", "blue", true)
        }else{
        	let new_pose = Kin.three_positions_to_pose(J_angles_1, J_angles_2, J_angles_3)
            
            if(local_coor != base_coor){
            	local_coor.set_pose(new_pose)
                let dir = Vector.transpose(Vector.pull(local_coor.pose, [0, 2], [2,2]))
                out(local_coor.name + " has been edited. New plane set at: [" + Vector.round(local_coor.get_position(), 3) + "] with plane normal: [" + Vector.round(dir, 3) + "].")
            	this.user_data.plane_points[0].J_angles = []
            	this.user_data.plane_points[1].J_angles = []
            	this.user_data.plane_points[2].J_angles = []  
            }else{
            	out("Dexter_Base coordinate system cannot be changed. Press 'A' to go to the next coordinate system", "blue")
            }
                      
            this.user_data.set_plane = false
        }
    }
    
    if(!gp.buttons[map.plane_point].pressed && this.user_data.plane_point){
		this.user_data.plane_points[this.user_data.plane_points_idx].position = position
        this.user_data.plane_points[this.user_data.plane_points_idx].J_angles = J_angles
        let pp_array = []
        for(let i = 0; i < 3; i++){
        	if(this.user_data.plane_points[i].position[0] != undefined){
            	pp_array.push(Vector.round(this.user_data.plane_points[i].position[0], 3))
            }else{
            	pp_array.push(undefined)
            }
        }
        
        out("Plane point " + (this.user_data.plane_points_idx + 1) + " saved at: [" + Vector.round(position[0], 3) + "] (meters) <br> Plane points: 1: [" + 
        pp_array[0] + "], 2: [" + pp_array[1] + "], 3: [" + pp_array[2] + "] </br>")
        
        this.user_data.plane_points_idx = (this.user_data.plane_points_idx + 1) % 3
		this.user_data.plane_point = false
    }
    
    if(!gp.buttons[map.follow_mode].pressed && this.user_data.follow_mode){
    	//CMD.push(Dexter.set_open_loop)
        this.user_data.follow_mode = false
    }
    
    
    if(!gp.buttons[map.finish].pressed && this.user_data.finish){
    	out("Now starting Run...")
        CMD.push(Control.go_to("Main_Run"))
        this.user_data.finish = false
    }
    
    if(!gp.buttons[map.reset].pressed && this.user_data.reset){
        this.user_data.reset = false
    }
    
    if(!gp.buttons[map.save_point].pressed && this.user_data.save_point){
    	let res = ez_create_position({job: this, game_controller: gp, position: position, J_angles: J_angles})
        let position_object = res[0]
        for(let i = 0; i < res[0].length; i++){
        	CMD.push(res[1][i])
        }
        this.user_data.saved_positions.splice(this.user_data.cur_point_idx + 1, 0, position_object)
        out("Point saved at [" + Vector.round(position[0], 4) + "] with normal [" + Vector.round(position[1], 3) + "]. Action state set to " + position_object.properties.extrude_state + ".")
        this.user_data.save_point = false
        this.user_data.cur_point_idx++
        this.user_data.save_point_state = true
    }

	if(!gp.buttons[map.cycle_right].pressed && this.user_data.cycle_right){
    	if(this.user_data.save_point_state === true){
        	this.user_data.cur_point_idx--
        	this.user_data.save_point_state = false
    	}
    	if(this.user_data.saved_positions.length > 0){
        	if(this.user_data.cur_point_idx === this.user_data.saved_positions.length - 1){
        		out("You are currently on the last of " + this.user_data.saved_positions.length + " point(s). Press left button to move to the previous point.", "blue", true)
        	}else{
        		this.user_data.cur_point_idx++
            	out("You are currently on point " + (this.user_data.cur_point_idx+1) + " of " + this.user_data.saved_positions.length + " point(s).", "blue", true)
        		let position_object = this.user_data.saved_positions[this.user_data.cur_point_idx]
        		let new_CMDs = ez_run_position({position_object: position_object, job: this, game_pad: gp, position: position, J_angles: J_angles, extrude_time: this.user_data.input.extrude_time}, true)
        		for(let i = 0; i < new_CMDs.length; i++){
        			CMD.push(new_CMDs[i])
        		}
        	}
        	this.user_data.cycle_right = false
        }else{
        	out("Attempted to move to next point but no points are saved. To save a point press Left-bumper.", "blue", true)
        }
    }
    if(!gp.buttons[map.cycle_left].pressed && this.user_data.cycle_left){
    	if(this.user_data.save_point_state === true){
        	this.user_data.cur_point_idx--
        	this.user_data.save_point_state = false
    	}
    	if(this.user_data.saved_positions.length > 0){
            if(this.user_data.cur_point_idx === 0){
        		out("You are currently on the first of " + this.user_data.saved_positions.length + " point(s). Press right button to move to the next point.", "blue", true)
        	}else{
        		this.user_data.cur_point_idx--
            	out("You are currently on point " + (this.user_data.cur_point_idx+1) + " of " + this.user_data.saved_positions.length + " point(s).", "blue", true)
        		let position_object = this.user_data.saved_positions[this.user_data.cur_point_idx]
        		let new_CMDs = ez_run_position({position_object: position_object, job: this, game_pad: gp, position: position, J_angles: J_angles}, true)
        		for(let i = 0; i < new_CMDs.length; i++){
        			CMD.push(new_CMDs[i])
        		}
        		this.user_data.cycle_left = false
        	}
        }else{
        	out("Attempted to move to previous point but no points are saved. To save a point press Left-bumper.", "blue", true)
        }
    }
    
    this.user_data.old_buttons = gp.buttons
    //CMD.push(make_ins("F"))
    CMD.push(make_ins("g"))
    CMD.push(Control.go_to("Edit_Coors_Run"))
    return CMD
}

function Main_Run(){
	let CMD = []
    let gp = navigator.getGamepads()[this.user_data.game_pad_idx]
    let rs = this.robot.robot_status
	let J_angles = [rs[Dexter.J1_ANGLE], rs[Dexter.J2_ANGLE], rs[Dexter.J3_ANGLE], rs[Dexter.J4_ANGLE], rs[Dexter.J5_ANGLE]]
    let position = this.user_data.old_position
    
    if(gp.buttons[map.finish].pressed){
    	this.user_data.finish = true
    }
    if(!gp.buttons[map.finish].pressed && this.user_data.finish){
    	CMD.push(Control.go_to("Finish_Run"))
    }
    
    let position_object
    for(let i = 0; i < this.user_data.saved_positions.length; i++){
    	position_object = this.user_data.saved_positions[i]
        let new_CMDs = ez_run_position({
        	position_object: position_object,
            job: this,
            game_pad: gp,
            position: position,
            J_angles: J_angles,
            lift_height: this.user_data.inputs.lift_height
        },
        	this.user_data.inputs.dry_run
        )
        for(let i = 0; i < new_CMDs.length; i++){
        	CMD.push(new_CMDs[i])
        }
    }
    return CMD
}

function Finish_Run(){
	let CMD = []
    let inputs = this.user_data.inputs
    out("ezRun completed " + (this.user_data.loop_idx + 1) + " time(s)", "blue", true)
    if(this.user_data.finish == true){
    	CMD.push(ez_stop_run())
        return CMD
    }
    if(inputs.loop && this.user_data.loop_idx < inputs.loop_iterations){
    	CMD.push(Dexter.sleep(inputs.inter_loop_dur))
        CMD.push(make_ins("F"))
        CMD.push(Control.go_to("Main_Run"))
        this.user_data.loop_idx++
    }else{
        let ready_position = this.user_data.inputs.start_position
        CMD.push(Dexter.move_to(ready_position[0], ready_position[1], ready_position[2]))
    }
    return CMD
}

new Job({name: "ezRun", 
         inter_do_item_dur: .5*_ms,
         robot: robot, keep_history: false, show_instructions: false,
		 user_data:{
         	inputs_for_ezRun: inputs_for_ezRun,
         	loop_idx: 0,
            finish: false
         },
         do_list: [	
         		Init_Run,
                // Sometimes Init_Edit_Coors_Run and Edit_Coors_Run will be programitically put here
                Main_Run,
                Finish_Run
         ]})

SW.clear_output()


} //End of ezTeach_init()
