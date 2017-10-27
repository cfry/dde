//EasyTeach v1.5.1
//James Wigglesworth
//Based off of code from Kent Gilson
//Started: 8_14_17
//Updated: 10_26_17


// Version requirement: 2.1.10


var joystick_threshold = .15 // Increase if arm is moving without pressing joysticks. Has range of 0-1. Originally the value was 0.1. 
//If you have a new controller, eval this file and run ezCreate.
//If it errors follow the error message instructions and change the values below:
var game_controller_name = "Xbox 360 Controller (XInput STANDARD GAMEPAD)"
var xbox = {A:0, B:1, X:2, Y:3, LB:4, RB:5, LT:6, RT:7, VIEW:8, MENU:9, LJ:10, RJ:11, UP:12, DOWN:13, LEFT:14, RIGHT:15, LJLR: 0, LJUD: 1, RJLR: 2, RJUD: 3}
//

//You can re-map the functionality of each button here:
var map = {plane_point: xbox.Y, set_plane: xbox.B, 
		   next_coor: xbox.A, prev_coor: xbox.X,
		   cycle_left: xbox.LEFT, cycle_right: xbox.RIGHT, 
           pivot_mode: xbox.RT, follow_mode: xbox.LT, save_point: xbox.LB,
           X: xbox.LJLR, Y: xbox.LJUD, Z: xbox.RJUD,
           reset: xbox.VIEW, finish: xbox.MENU,
           x_theta: xbox.LJLR, y_theta: xbox.LJUD,
           action_state: xbox.RB,
           speed_up: xbox.UP, speed_down: xbox.DOWN
           }


//Adjustable properties for each job:
var inputs_for_ezCreate = {start_position: [[0,0.45,.2], [0, 0, -1], [1, 1, 1]], lift_height: 4 *_cm, extrude_time: 1 *_s}
var inputs_for_ezRun = {start_position: [[0,0.45,.2], [0, 0, -1], [1, 1, 1]], loop: false, loop_iterations: Infinity, inter_loop_dur: 0 *_s, lift_height: 4 *_cm, dry_run: false}


//Main functions to control action at each point:
//User defines the content in these functions

//Edit create_position() to control what information gets stored when different buttons are held
function ez_create_position(info){
	let CMD = [] 					//These are commands added to the do list everytime a position is created

	let base_coor_name = info.job.user_data.coordinate_systems[0]
	let base_coor = ez_get_object(Coor, base_coor_name)
    let local_coor_name = info.job.user_data.coordinate_systems[info.job.user_data.coordinate_system_idx]
    let local_coor = ez_get_object(Coor, local_coor_name)
    
    let position_object = { 		//This object is added to the array that will get saved out and read by ez_run_position() below
		xyz: info.position[0],
		normal: info.position[1],
		config: info.position[2],
		J_angles: info.J_angles,
        local_coor: local_coor_name,
        local_xyz: Coor.move_points_to_coor(info.position[0], base_coor, local_coor),
        local_normal: info.position[1],
        properties: {}
    }
    
	if(info.game_controller.buttons[map.action_state].pressed){
		position_object.properties.extrude_state = true
		position_object.properties.extrude_time = info.extrude_time
	}else{
		position_object.properties.extrude_state = false
	}
    return [position_object, CMD]
    /*
    the info variable contains:
    info.position //[xyz, direction, config] of current robot position
    info.J_angles //J_angles of current robot position
    info.game_controller// Contains the button states of the game controller
    info.job //The actual job instance such that info.job.user_data will change the job's user_data
    */
}

//Edit ez_run_position() to control the actions run at each position
function ez_run_position(info, dry_run = false){
	let CMD				//These are commands added to the do list everytime a position is run
    let position_object = info.position_object
    
    // Coordinate system transforms:
    let base_coor = ez_get_object(Coor, info.job.user_data.coordinate_systems[0])
    let local_coor = ez_get_object(Coor, position_object.local_coor)
    let base_xyz = Coor.move_points_to_coor(position_object.local_xyz, local_coor, base_coor)
    let base_dir = Coor.move_vectors_to_coor(position_object.local_normal, local_coor, base_coor)    
        
    if(dry_run === true){
    	//dry_run is set to true when cycling through the positions in the Create job.
        //dry_run can also be set to true for the Run job by changing the variable inputs_for_Run
    	if(position_object.properties.extrude_state === true){
        	//To prevent dragging on the workepiece Dexter starts and finishes from an offset position
        	let offset_point = Vector.add(base_xyz, Vector.multiply(-info.job.user_data.inputs.lift_height, base_dir))
        	CMD = [
        		make_ins("S", "MaxSpeed", 30),
        		make_ins("S", "StartSpeed", .5),
        		make_ins("S", "Acceleration", 0.0001),
        		Dexter.move_to(offset_point, base_dir, position_object.config),
    			Dexter.move_to(base_xyz, base_dir, position_object.config),
            	make_ins("F"),
                //function(){info.job.inter_do_item_dur = position_object.properties.extrude_time},
            	function(){info.job.inter_do_item_dur = .5 * _ms},
                Dexter.move_to(offset_point, base_dir, position_object.config)
        	]
            
            //This variable must be set to the last commanded position
        	info.job.user_data.old_position = [offset_point, base_dir, position_object.config]
        }else{
        	//This is a way-point used to direct the path around obstacles
        	CMD = [
        		make_ins("S", "MaxSpeed", 30),
        		make_ins("S", "StartSpeed", .5),
        		make_ins("S", "Acceleration", 0.0001),
    			Dexter.move_to(base_xyz, base_dir, position_object.config)
        	]
            
            //This variable must be set to the last commanded position
        	info.job.user_data.old_position = [base_xyz, base_dir, position_object.config]
        }
    }else{
    	if(position_object.properties.extrude_state){
        	//Action for extrusions
        	let offset_point = Vector.add(base_xyz, Vector.multiply(-info.job.user_data.inputs.lift_height, base_dir))
        	CMD = [
        		make_ins("S", "MaxSpeed", 30),
        		make_ins("S", "StartSpeed", .5),
        		make_ins("S", "Acceleration", 0.0001),
        		Dexter.move_to(offset_point, base_dir, position_object.config),
    			Dexter.move_to(base_xyz, base_dir, position_object.config),
                make_ins("F"),
                //function(){info.job.inter_do_item_dur = .1*_ms},
                function(){info.job.inter_do_item_dur = position_object.properties.extrude_time / 2},
            	make_ins("S", "GripperMotor", 1),
            	function(){info.job.inter_do_item_dur = .5 * _ms},
                make_ins("S", "GripperMotor", 0),
            	Dexter.move_to(offset_point, base_dir, position_object.config),
        	]
        }else{
        	//Action for way points
        	CMD = [
        		make_ins("S", "MaxSpeed", 30),
        		make_ins("S", "StartSpeed", .5),
        		make_ins("S", "Acceleration", 0.0001),
    			Dexter.move_to(base_xyz, base_dir, position_object.config)
        	]
        }
    }
    return CMD
}

function ez_stop_run(info){
	let CMD				//These are commands added to the do list everytime a position is run
    let position_object = info.position_object
    CMD = [
    	function(){info.job.inter_do_item_dur = .5 * _ms},
    	make_ins("S", "GripperMotor", 0),
        Robot.stop_job,
    ]
}

// Defines the Jobs 
ezTeach_init(points_filepath = "choose_file", robot = Robot.dexter0)