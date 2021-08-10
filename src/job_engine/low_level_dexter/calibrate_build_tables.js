/*
       outer_bound_factor = 1.1
       inner_bound_factor = 0.9
       
       move = 180
       outer_boundary = move*outer_bound_factor
       
       inner_boundary = user defined
       inner_boundary = move*inner_bound_factor

  new Job({
	name: "my_job",
	do_list: [calibrate]})new Job({
	name: "my_job",
	do_list: [calibrate]})
       
*/

export function calibrate_build_tables({
	J_move_max = [180, 100, 165, 110, 180],
    J_move_min = [-180, -100, -165, -110, -180],
    inner_factor = 1,
    outer_factor = 1.1,
    diff_beta = 5,
    xyz_beta = 5,
    move_speed = 35,
    cal_speed = 30
} = {}){
	
	let DIFF_BETA = 52
	let XYZ_BETA = 28
	let J_move_max_defaults = [180, 100, 165, 110, 180]
    let J_move_min_defaults = [-180, -100, -165, -110, -180]
	let J_boundary_max_defaults = [150, 90, 150, 90, 140]
    let J_boundary_min_defaults = [-150, -90, -150, -90, -140]


	let J_move_max_final = [0, 0, 0, 0, 0]
    let J_move_min_final = [0, 0, 0, 0, 0]
	for(let i = 0; i < 5; i++){
        let def_move_max = J_boundary_max_defaults[i]
        let def_move_min = J_boundary_min_defaults[i]
        
        
        if(J_move_max[i] == null){
        	J_move_max_final[i] = def_move_max
        }else{
        	J_move_max_final[i] = J_move_max[i]
        }
        if(J_move_min[i] == null){
        	J_move_min_final[i] = def_move_min
        }else{
        	J_move_min_final[i] = J_move_min[i]
        }
        
    }
    
    //Joint 3 moves the opposite direction (2=3)
    J_move_max_final[2] *= -1
    J_move_min_final[2] *= -1
    
	let J_outer_max = Vector.multiply(outer_factor, J_move_max_final) 
	let J_outer_min = Vector.multiply(outer_factor, J_move_min_final) 

    let J_inner_max = Vector.multiply(inner_factor, J_move_max_final) 
	let J_inner_min = Vector.multiply(inner_factor, J_move_min_final) 

    
    return [
    	make_ins("w", 42, 832),
        make_ins("w", 42, 512),
        make_ins("w", 79, 50 ^ 100 ),
        make_ins("w", 80, 50 ^ 100 ),
        make_ins("w", 81, 200 ^ 100 ),
        
        //Setting Outer Boundaries. Must be larger than move.
        Dexter.set_parameter("J1BoundryHigh", J_outer_max[0]),
        Dexter.set_parameter("J1BoundryLow", J_outer_min[0]),
        Dexter.set_parameter("J2BoundryHigh", J_outer_max[1]),
        Dexter.set_parameter("J2BoundryLow", J_outer_min[1]),
        Dexter.set_parameter("J3BoundryHigh", J_outer_max[2]),
        Dexter.set_parameter("J3BoundryLow", J_outer_min[2]),
        Dexter.set_parameter("J4BoundryHigh", J_outer_max[3]),
        Dexter.set_parameter("J4BoundryLow", J_outer_min[3]),
        Dexter.set_parameter("J5BoundryHigh", J_outer_max[4]),
        Dexter.set_parameter("J5BoundryLow", J_outer_min[4]),

		//Actual calibration movement:
		make_ins("S", "MaxSpeed", move_speed),
        Dexter.move_all_joints(J_move_max_final),
        make_ins("F"),
        make_ins("S", "MaxSpeed", cal_speed),
        make_ins("w", 42, 3079),
        Dexter.move_all_joints(J_move_min_final),
        make_ins("F"),
        make_ins("w", 42, 0),
        make_ins("S", "MaxSpeed", move_speed),
        make_ins("a", ...[0, 0, 0, 0, 0].arcsec()),

		//Take a bow, loads tables:
        //make_ins("a", ...[20000,20000,20000,20000,20000].arcsec()),
        make_ins("a", [2, 2, 2, 2, 2]),
        make_ins("a", ...[0, 0, 0, 0, 0].arcsec()),
        make_ins("F"),

        Dexter.set_parameter("J1BoundryHigh", J_inner_max[0]),
        Dexter.set_parameter("J1BoundryLow", J_inner_min[0]),
        Dexter.set_parameter("J2BoundryHigh", J_inner_max[1]),
        Dexter.set_parameter("J2BoundryLow", J_inner_min[1]),
        Dexter.set_parameter("J3BoundryHigh", J_inner_max[2]),
        Dexter.set_parameter("J3BoundryLow", J_inner_min[2]),
        Dexter.set_parameter("J4BoundryHigh", J_inner_max[3]),
        Dexter.set_parameter("J4BoundryLow", J_inner_min[3]),
        Dexter.set_parameter("J5BoundryHigh", J_inner_max[4]),
        Dexter.set_parameter("J5BoundryLow", J_inner_min[4]),
        make_ins("w", 79, 50 ^ 100 ),
        make_ins("w", 80, 50 ^ 100 ),
        make_ins("w", 81, 200 ^ 100 ),

        make_ins("w", DIFF_BETA, 5),
        make_ins("w", XYZ_BETA, 5),


        Dexter.sleep(1),
        make_ins("w", 42, 12960),
        
        //Set calibration state
        make_ins("F")
    ]
}