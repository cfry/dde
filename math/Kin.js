//Kinematics Class
//Inverse Kinematics + Forward Kinematics + supporting functions
//James Wigglesworth
//Started: 6_18_16
//Updated: 3_12_18


/*
debugger
//Kin.xyz_to_J_angles([0, 0.08255, 0.8667749999999999], [0, 1, 0])
Kin.xyz_to_J_angles([[0, .5, .075], [0, 0], [1, 1, 1]])
debugger
Kin.xyz_to_J_angles(Kin.J_angles_to_xyz([0,4, 0, 0, 0]))

debugger
Kin.J_angles_to_xyz(Dexter.NEUTRAL_ANGLES)
Kin.xyz_to_J_angles(Kin.J_angles_to_xyz(Dexter.NEUTRAL_ANGLES))

debugger
Kin.xyz_to_J_angles([0, 0.511038126204794, 0.07581480790919819])

Dexter.NEUTRAL_ANGLES
Vector.matrix_multiply(Vector.make_pose([1, 2, 3], [0, 0, 0]), Vector.properly_define_point([[1, 2, 3], [4, 5, 6]]))


Kin.inverse_kinematics([0.1, 0.5, 0.075], undefined, undefined, Vector.make_pose([0, 0, 0]))[0]
Kin.inverse_kinematics([0.1, 0.5, 0.075], undefined, undefined)[0]


debugger
Kin.J_angles_to_xyz(Dexter.NEUTRAL_ANGLES, Vector.make_pose([0, 0, 0.07581480790919819]))

Kin.J_angles_to_xyz([0, 0, 0, 0, 0], Vector.make_pose())


Kin.xyz_to_J_angles(Kin.J_angles_to_xyz(Dexter.NEUTRAL_ANGLES))

*/

var Kin = new function(){
    this.inverse_kinematics = function (xyz, direction = [0, 0, -1], config = [1, 1, 1], workspace_pose = Vector.make_pose()){
    	if(xyz == undefined){
        	dde_error("xyz must be defined. To prevent unpredictable movement a default is not used.")
        }
        let xyz_dim = Vector.matrix_dimensions(xyz)
        if(xyz_dim[0] == 3 && xyz_dim[1] == 3){
        	workspace_pose = direction
            config = xyz[2]
            direction = xyz[1]
            xyz = xyz[0]
        }
        
        
    
        let J = Vector.make_matrix(1, 5)[0] // Joint Angles
        let U = Vector.make_matrix(5, 3)
        let P = [0, 0, 0, 0]
        let L = [Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5] //Link Lengths
		let normal = direction
    	let right_arm = config[0]
    	let elbow_up = config[1]
    	let wrist_out = config[2]
        
        if(direction.length == 2){
        	normal = Kin.angles_to_dir_xyz(direction[0], direction[1])
        }else if(direction.length == 3){
        	if(Vector.magnitude(direction) == 0){
            	dde_error("Direction must have a magnitude. Try [0, 0, -1] or [0, 0] for the [x_angle, y_angle] form")
            }
        }else{dde_error("Direction must be in the form [x, y, z] or [x_angle, y_angle]")}
        
        
        let xyz_trans, normal_trans
        if(workspace_pose == undefined || workspace_pose === [0, 0, -1]){
        	workspace_pose = Vector.identity_matrix(4)
            xyz_trans = xyz.slice()
            normal_trans = normal.slice()
        }else if(Vector.is_equal([4,4], Vector.matrix_dimensions(workspace_pose))){
        	xyz_trans = Vector.transpose(Vector.matrix_multiply(workspace_pose, Vector.properly_define_point(xyz))).slice(0,3)
        	normal_trans = Vector.transpose(Vector.matrix_multiply(workspace_pose, Vector.properly_define_vector(normal))).slice(0,3)
        }else{
        	dde_error("Unsupported workspace_pose datatype")
        }
        
        
    	//Knowns:
        P[0] = [1, 0, 0, 0]
    	let V54 = Vector.multiply(-1, Vector.normalize(normal_trans)) //Direction of EE
        U[0] = [0, 0, 0]
        let V10 = [0, 0, 1]
    	U[1] = Vector.multiply(L[0], V10)
        U[4] = Vector.add(xyz_trans, Vector.multiply(Dexter.LINK5, V54))
        U[5] = xyz_trans
        
    	
    	//Solving for P1
    	P[1] = Vector.points_to_plane(U[1], U[0], U[4])
        if(Vector.is_NaN(P[1])){
        	P[1] = Vector.points_to_plane(U[1], U[0], U[3])
            if(Vector.is_NaN(P[1])){
        		dde_error(`Singularity: Toolpoint xyz is on Base axis. [0, 0, z] divides by 0.
            	Try [0, 1e-10, z] if it works use the ouputted joint angles for a move_all_joints() instead.
            	The first joint angle can be changed to any value without affecting the tool point`)
            }
        }

		//Solving for U3
    	var U54_Proj = Vector.project_vector_onto_plane(V54, P[1])
    	var U3_a = Vector.add(U[4], Vector.multiply(L[3], Vector.rotate(Vector.normalize(U54_Proj), P[1], 90)))
        var U3_b = Vector.add(U[4], Vector.multiply(L[3], Vector.rotate(Vector.normalize(U54_Proj), P[1], -90)))
        
        
        //This is proven to work for directions of approx. [0, 1, 0] but has potentially not been tested enough
        var dist_a = Vector.distance(U3_a, [0, 0, 0])
    	var dist_b = Vector.distance(U3_b, [0, 0, 0])
        if (wrist_out){
    		if (dist_a < dist_b){
        		U[3] = U3_a
        	}else{
        		U[3] = U3_b
        	}
    	}else{
    		if (dist_a > dist_b){
        		U[3] = U3_a
        	}else{
        		U[3] = U3_b
        	}
    	}
    	
        
        
        /*
        //This is proven to work for directions of approx. [0, 0, -1] but not for [x, y, 0]
        var dist_a = Vector.distance(U3_a, U[1], U[0])
    	var dist_b = Vector.distance(U3_b, U[1], U[0])
        if (wrist_out){
    		if (dist_a < dist_b){
        		U[3] = U3_a
        	}else{
        		U[3] = U3_b
        	}
    	}else{
    		if (dist_a > dist_b){
        		U[3] = U3_a
        	}else{
        		U[3] = U3_b
        	}
    	}
        */
        
        
    	//Solving for P2
    	P[2] = Vector.points_to_plane(U[5], U[4], U[3])
        if(Vector.is_NaN(P[2])){
        	dde_error("Unknown plane singularity at: " + xyz + ", " + direction + ", " + config + ". Please copy this message and report it as a bug.")
        }
		
    	//Solving for U2
    	var D3 = Vector.distance(U[3], U[1])
        if(Vector.is_equal(D3, Dexter.LINK2 + Dexter.LINK3, 9)){
        	D3 = Dexter.LINK2 + Dexter.LINK3
        }
        
        //Checking if in reach
        if (D3 > Dexter.LINK2 + Dexter.LINK3){
        	let out_of_reach_dist = Vector.round(D3 - (Dexter.LINK2 + Dexter.LINK3), 4)
        	dde_error("Point [" + Vector.round(xyz, 3)+"], [" + Vector.round(V54,3) + '] is ' + out_of_reach_dist + 'm out of reach')
        }
        
        
    	//let Beta = acosd((-Math.pow(L[2], 2) + Math.pow(L[1], 2) + Math.pow(D3, 2)) / (2 * D3 * L[1])) // Law of Cosines
        let Beta = acosd((-Math.pow(L[2], 2) + Math.pow(L[1], 2) + Math.pow(D3, 2)) / (2 * D3 * L[1])) // Law of Cosines
        let V31 = Vector.normalize(Vector.subtract(U[3], U[1]))
    	let V23
    	
    	let U2_a = Vector.add(U[1], Vector.multiply(L[1], Vector.rotate(V31, P[1], Beta)))
    	let U2_b = Vector.add(U[1], Vector.multiply(L[1], Vector.rotate(V31, P[1], -Beta)))
    	//let U2_a_dist = Vector.distance(U2_a, P[0])
    	//let U2_b_dist = Vector.distance(U2_b, P[0])
        let V2a1 = Vector.subtract(U2_a, U[1])
        let V32a = Vector.subtract(U[3], U2_a)
        //let V2b1 = Vector.subtract(U2_b, U[1])
        //let V32b = Vector.subtract(U[3], U2_b)
    	
    	if (elbow_up){
    		if(Vector.dot(Vector.cross(V2a1, V32a), P[1]) < 0){
        		U[2] = U2_a
        	}else{
        		U[2] = U2_b
        	}
    	}else{
      		if(Vector.dot(Vector.cross(V2a1, V32a), P[1]) > 0){
        		U[2] = U2_a
        	}else{
        		U[2] = U2_b
        	}
    	}


    	//Solving for joint angles
    
		//var V10 = minus(U[1], U[0])
    	var V21 = Vector.normalize(Vector.subtract(U[2], U[1]))
    	var V32 = Vector.normalize(Vector.subtract(U[3], U[2]))
    	var V43 = Vector.normalize(Vector.subtract(U[4], U[3]))
    	//var V54 = minus(U[5], U[3])

		if(right_arm == 1){
    		J[0] = Vector.signed_angle(P[1], P[0], V10) 
    		J[1] = Vector.signed_angle(V21, V10, P[1])
    		J[2] = Vector.signed_angle(V32, V21, P[1])
    		J[3] = Vector.signed_angle(V43, V32, P[1])
    		J[4] = Vector.signed_angle(P[2], P[1], V43)
    	}else{
    		J[0] = Vector.signed_angle(P[1], P[0], V10) + 180
    		J[1] = -Vector.signed_angle(V21, V10, P[1])
    		J[2] = -Vector.signed_angle(V32, V21, P[1])
    		J[3] = -Vector.signed_angle(V43, V32, P[1])
    		J[4] = -Vector.signed_angle(P[2], P[1], V43)
    	}
    
    	if(Vector.is_NaN(J[2])){
        	let thres = 100
        	if(Dexter.LINK1 > thres || Dexter.LINK2 > thres || Dexter.LINK3 > thres || Dexter.LINK4 > thres || Dexter.LINK5 > thres){
            	dde_error("Link lengths are non properly defined: "  
                + "</br>Dexter.LINK1: " + Dexter.LINK1 + " (meters)"
                + "</br>Dexter.LINK2: " + Dexter.LINK2 + " (meters)"
                + "</br>Dexter.LINK3: " + Dexter.LINK3 + " (meters)"
                + "</br>Dexter.LINK4: " + Dexter.LINK4 + " (meters)"
                + "</br>Dexter.LINK5: " + Dexter.LINK5 + " (meters)")
            }
        	dde_error("Singularity at: " + xyz + ", " + direction + ", " + config + ".</br>Please copy this message and report it as a bug.")
    	}
    
    	return [J, U, P]
    } 
    
    this.forward_kinematics = function(joint_angles, workspace_pose = Vector.make_pose()){
        let J = Convert.deep_copy(joint_angles) //Joint Angles
        let U = new Array(5).fill(new Array(3)) //Point Locations
        let L = [Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5] //Link Lengths
    	let P = new Array(3).fill(new Array(4)) //Planes
        
        let U21, U32, U43, U54, V21, V32, V43, V54
        //Knowns:
        let U0 = [0, 0, 0]
        let V10 = [0, 0, 1]
        let P0 = [1, 0, 0, 0]
        
        //Calculates all vectors first
        P[0] = P0
		P[1] = Vector.rotate(P[0], V10, -(J[0]-180))
        V21 = Vector.rotate(V10, P[1], J[1])
        V32 = Vector.rotate(V21, P[1], J[2])
        V43 = Vector.rotate(V32, P[1], J[3])
        P[2] = Vector.rotate(P[1], V43, -(J[4]-180))
        V54 = Vector.rotate(V43, P[2], -90)
		let V = [V10, V21, V32, V43, V54]
        
        //Dimensionalizes vectors by multiplying by link lengths
        U[0] = U0
		U[1] = Vector.add(U[0], Vector.multiply(L[0], V10))
        U[2] = Vector.add(U[1], Vector.multiply(L[1], V21))
        U[3] = Vector.add(U[2], Vector.multiply(L[2], V32))
        U[4] = Vector.add(U[3], Vector.multiply(L[3], V43))
        U[5] = Vector.add(U[4], Vector.multiply(L[4], V54))
		
        P[1] = Vector.round(P[1], 15)
        P[2] = Vector.round(P[2], 15)
        
        
        let trans_mat = Vector.inverse(workspace_pose)
        if(Vector.is_equal([4,4], Vector.matrix_dimensions(workspace_pose))){
        	for(let i = 0; i < U.length; i++){
            	U[i] = Vector.transpose(Vector.matrix_multiply(trans_mat, Vector.properly_define_point(U[i]))).slice(0,3)
            }
            //debugger
            for(let i = 0; i < P.length; i++){
            	P[i] = Vector.transpose(Vector.matrix_multiply(trans_mat, Vector.properly_define_vector(P[i]))).slice(0,3)
            }
            for(let i = 0; i < V.length; i++){
            	V[i] = Vector.transpose(Vector.matrix_multiply(trans_mat, Vector.properly_define_vector(V[i]))).slice(0,3)
            }
        }else{
        	dde_error("Unsupported workspace_pose datatype")
        }
        
        return [U, V, P]
    }

    this.is_in_reach = function(xyz, J5_direction = [0, 0, -1], config = [1, 1, 1], workspace_pose){
    	let base_xyz = [0, 0, 0] // Come back to this and pull it from robot_pose
        let base_plane = [0, 0, 1]
        let U3
        let U1 = Vector.add(base_xyz, Vector.multiply(base_plane, Dexter.LINK1))
    	let U4 = Vector.add(xyz, Vector.multiply(-Dexter.LINK5, Vector.normalize(J5_direction)))

		//Solving for P1
    	let P1 = Vector.points_to_plane(U1, base_xyz, U4)
        if(Vector.is_NaN(P1)){
        	P1 = Vector.points_to_plane(U1, base_xyz, U3)
            if(Vector.is_NaN(P1)){
        		return false
            }
        }
        
        
    	//Solving for U3
        let V54 = Vector.subtract(xyz, U4)
    	var U54_Proj = Vector.project_vector_onto_plane(V54, P1)
    	var U3_a = Vector.add(U4, Vector.multiply(Dexter.LINK3, Vector.rotate(Vector.normalize(U54_Proj), P1, 90)))
        var U3_b = Vector.add(U4, Vector.multiply(Dexter.LINK3, Vector.rotate(Vector.normalize(U54_Proj), P1, -90)))
        var dist_a = Vector.distance(U3_a, U1, base_xyz)
    	var dist_b = Vector.distance(U3_b, U1, base_xyz)
    	if (config[2] == 1){
    		if (dist_a < dist_b){
        		U3 = U3_a
        	}else{
        		U3 = U3_b
        	}
    	}else{
    		if (dist_a > dist_b){
        		U3 = U3_a
        	}else{
        		U3 = U3_b
        	}
    	}
        
        
		if (Vector.distance(U1, U3) <= Dexter.LINK2 + Dexter.LINK3){
        	return true
        }else{
        	return false
        }
    }
    
    
	
    //Private 
    //converts keywords in config to array
    //example: parse_config("right_down_in") returns [1, 0, 0]
    function parse_config(config){
    		var state = [1, 1, 1]
        	var config_words = config.split("_")
            
            if (config_words.includes("right")){
            	state[0] = 1
            }else{
            	if (config_words.includes("left")){
            		state[0] = 0
            	}
            }
            if (config_words.includes("up")){
            	state[1] = 1
            }else{
            	if (config_words.includes("down")){
            		state[1] = 0
            	}
            }
            if (config_words.includes("out")){
            	state[2] = 1
            }else{
            	if (config_words.includes("in")){
            		state[2] = 0
            	}
            }
            return state
    }	
    
    //Public
    this.J_angles_to_config = function(joint_angles){
    	let U54_Proj, U3_a, U3_b, dist_a, dist_b
    	let J = Convert.deep_copy(joint_angles)
        let fk = Kin.forward_kinematics(J)
        let U = fk[0]
        let V = fk[1]
        let L = [Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5] //Link Lengths
        let right_arm, elbow_up, wrist_out
        let P = fk[2]
        
        P[1] = Vector.points_to_plane(U[1], U[0], U[4])
        U54_Proj = Vector.project_vector_onto_plane(V[4], P[1])
    	U3_a = Vector.add(U[4], Vector.multiply(L[3], Vector.rotate(Vector.normalize(U54_Proj), P[1], 90)))
        U3_b = Vector.add(U[4], Vector.multiply(L[3], Vector.rotate(Vector.normalize(U54_Proj), P[1], -90)))
        
        
        dist_a = Vector.distance(U3_a, U[2])
    	dist_b = Vector.distance(U3_b, U[2])
        if (Vector.is_equal(U[3], U3_a)){
    		if (dist_a < dist_b){
        		wrist_out = 0
        	}else{
        		wrist_out = 1
        	}
    	}else{
    		if (dist_a > dist_b){
        		wrist_out = 1
        	}else{
        		wrist_out = 0
        	}
    	}
        /*
        //Old code:
        dist_a = Vector.distance(U3_a, U[1], U[0])
    	dist_b = Vector.distance(U3_b, U[1], U[0])
    		
        if(U[3] == U3_a){
        	if (dist_a < dist_b){
            	wrist_out = 1
            }else{
            	wrist_out = 0
            }
        }else{
        	if (dist_a < dist_b){
            	wrist_out = 0
            }else{
            	wrist_out = 1
            }
        }
        */
        
        
        let U50 = Vector.subtract(U[5], U[0])
        if(Vector.dot(Vector.cross(U50, P[1]), V[0]) > 0){
        	right_arm = 0
            
            if(wrist_out == 0){
            	wrist_out = 1
            }else{
            	wrist_out = 0
            }
        }else{
        	right_arm = 1
        }
        
        if(right_arm == 1){
        	if(Vector.dot(Vector.cross(V[1], V[2]), P[1]) > 0){
        		elbow_up = 0
        	}else{
        		elbow_up = 1
        	}
        }else{
        	if(Vector.dot(Vector.cross(V[1], V[2]), P[1]) < 0){
        		elbow_up = 0
        	}else{
        		elbow_up = 1
        	}
        }
        
        
        return [right_arm, elbow_up, wrist_out]
    }

	/*
	this.point_at_xyz = function(xyz, current_J5_xyz, current_config, base_xyz = [0, 0, 0], base_plane = [0, 0, 1], base_rotation = 0){
    	let pointing_direction = Vector.subtract(xyz, current_J5_xyz)
        Kin.xyz_to_J_angles(current_J5_xyz, pointing_direction, current_config, base_xyz, base_plane, base_rotation)
    }
    */
    
    
    
    //Torque:
    
    
    /*
    I've run a mile in 4:24 what is that in MPH?
    var meter_per_sec = _mile / (4*_min+24*_s)
    var MPH = meter_per_sec / (_mile/_hour)
    
    
    
    this.gravity_torques = function(J_angles, base_xyz = [0, 0, 0], base_plane = [0, 0, 1], base_rotation = 0){
    	//This will return the torques expected due to the forces of gravity
        //As of now the output units are in Newton-meters but are subject to change
        
        
        //These will change once measurements are taken
        let L = [Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5] //Link Lengths
        let CM_L = Vector.multiply(.5, L) // Center of mass as distance along the link
        let M = [5, 2, 2, .5, .5] //Link masses (kg) (guesses)
        let g = [0, 0, -9.80665] // (micron/millisecond^2 or m/s^2, they are equivalent)
        var T_vector = new Array(5).fill(new Array(3))
        var T = new Array(5)
        var F_vector = new Array(5).fill(new Array(3))
        var CM_r = new Array(5).fill(new Array(3))

        let P0 = Kin.base_rotation_to_plane(base_rotation, base_plane)
        let fk_result = Kin.forward_kinematics(J_angles, base_xyz, base_plane, P0)
        let U = fk_result[0]
        let V = (fk_result[1])
        let Vn = new Array(3).fill(new Array(5))
        for(var i = 0; i < 5; i++){
        	Vn[i] = Vector.normalize(V[i])
            F_vector[i] = Vector.multiply(M[i], g)
            CM_r[i] = Vector.multiply(CM_L[i], Vn[i])
        }
        //var P1 = Vector.points_to_plane(U[1], U[0], U[4])
        var P1 = Vector.rotate(P0, base_plane, J_angles[0])
        
        
        
        
        //Torques are calculated backwards from the end effector
        //The system is stationary so the sum of the torques equal zero 
        //the torque vector is found by crossing the radius (distance from joint to link's center of mass) and the weight vector
        //that torque vector may only have some components that affect the actual joint's torque reading
        //This is dealt with by projecting the torque vector onto the axis of the joint's rotation 
        let T_sum = [0, 0, 0]
        let F_sum = 0
        let radius
        let planes_of_rotation = [Vn[0], P1, P1, P1, Vn[3]]
        
        //Joints 1 and 2 
        T_sum = [0, 0, 0]
        T_sum = Vector.add(T_sum, Vector.cross(Vector.multiply(CM_L[1], Vn[1]), F_vector[1]))
        radius = Vector.add(V[1], CM_r[2])
        T_sum = Vector.add(T_sum, Vector.cross(radius, F_vector[2]))
        radius = Vector.add(V[1], V[2], CM_r[3])
        T_sum = Vector.add(T_sum, Vector.cross(radius, F_vector[3]))
        radius = Vector.add(V[1], V[2], V[2], CM_r[4])
        T_sum = Vector.add(T_sum, Vector.cross(radius, F_vector[4]))
        T_vector[0] = T_sum
        T_vector[1] = T_sum
        
        //Joint 3
        T_sum = [0, 0, 0]
        radius = CM_r[2]
        T_sum = Vector.add(T_sum, Vector.cross(radius, F_vector[2]))
        radius = Vector.add(V[2], CM_r[3])
        T_sum = Vector.add(T_sum, Vector.cross(radius, F_vector[3]))
        radius = Vector.add(V[2], V[3], CM_r[4])
		T_sum = Vector.add(T_sum, Vector.cross(radius, F_vector[4]))
		T_vector[2] = T_sum
        
        //Joint 4
        T_sum = [0, 0, 0]
        radius = CM_r[3]
        T_sum = Vector.add(T_sum, Vector.cross(radius, F_vector[3]))
        radius = Vector.add(V[3], CM_r[4])
        T_sum = Vector.add(T_sum, Vector.cross(radius, F_vector[4]))
		T_vector[3] = T_sum
        
        //Joint 5
        T_sum = [0, 0, 0]
        radius = CM_r[4]
        T_sum = Vector.add(T_sum, Vector.cross(radius, F_vector[4]))
		T_vector[4] = T_sum
        
        for(var i = 0; i < 5; i++){
        	T[i] = Vector.dot(planes_of_rotation[i], T_vector[i])
        }
        
        T = Vector.multiply(.000001, T) // Converting to Nm (will change)
		return [T, T_vector, U, planes_of_rotation] 
    }*/
    
 
    
    this.check_J_ranges = function(J_angles){
    	let lower_limit = [Dexter.J1_ANGLE_MIN, Dexter.J2_ANGLE_MIN, Dexter.J3_ANGLE_MIN, Dexter.J4_ANGLE_MIN, Dexter.J5_ANGLE_MIN]
        let upper_limit = [Dexter.J1_ANGLE_MAX, Dexter.J2_ANGLE_MAX, Dexter.J3_ANGLE_MAX, Dexter.J4_ANGLE_MAX, Dexter.J5_ANGLE_MAX]
        let angle
        for(var i = 0; i < J_angles.length; i++){
        	angle = J_angles[i]
        	if((angle != null) && ((lower_limit[i] > angle) || (upper_limit[i] < angle))){
            	return false
            }
        }
        return true
    }

	/**************************************************************
	Wrapper Functions:
	***************************************************************/

    //Wrapper function for inverse kinematics
    //Returns joint angles
    this.xyz_to_J_angles = function(xyz, J5_direction = [0, 0, -1], config = Dexter.RIGHT_UP_OUT, workspace_pose = Vector.make_pose()){
        return Kin.inverse_kinematics(xyz, J5_direction, config, workspace_pose)[0]
    }

    this.xyz_to_J_points = function(xyz, J5_direction = [0, 0, -1], config = Dexter.RIGHT_UP_OUT, workspace_pose = Vector.make_pose()){
        return Kin.inverse_kinematics(xyz, J5_direction, config, workspace_pose)[1]
    }
    
    this.xyz_to_J_planes = function(xyz, J5_direction = [0, 0, -1], config = Dexter.RIGHT_UP_OUT, workspace_pose = Vector.make_pose()){
        return Kin.inverse_kinematics(xyz, J5_direction, config, workspace_pose)[2]
    }
    
    /*
    var EE_pose = Vector.make_pose([-0.4, 0.4, 0.2], [90, 0, 0])
    var direction = Vector.transpose(Vector.pull(EE_pose, [0,2], [1,1]))
    debugger
    var J_angles = Kin.xyz_to_J_angles_6_axes(EE_pose)
    
    
    */
    this.xyz_to_J_angles_6_axes = function(EE_pose, config = Dexter.RIGHT_UP_OUT, workspace_pose = Vector.make_pose()){
        let direction = Vector.transpose(Vector.pull(EE_pose, [0,2], [1,1]))
        let xyz = Vector.transpose(Vector.pull(EE_pose, [0,2], [3,3]))
        let kin_res = Kin.inverse_kinematics(xyz, direction, config, workspace_pose)
        let x_vector = kin_res[2][2].slice(0,3)
        //let y_vector = direction
        //let z_vector = Vector.cross(x_vector, y_vector)
        let x_vector_desired = Vector.transpose(Vector.pull(EE_pose, [0,2], [0,0]))
        let J6 = Vector.signed_angle(x_vector, x_vector_desired, direction)
		
        return [kin_res[0][0], kin_res[0][1], kin_res[0][2], kin_res[0][3], kin_res[0][4], J6]
    }
    
	
    //Wrapper function for forward kinematics
    this.J_angles_to_xyz = function(joint_angles, workspace_pose = Vector.make_pose()){
        let temp_angles = Convert.deep_copy(joint_angles)
        let xyzs = Kin.forward_kinematics(temp_angles, workspace_pose)[0]
        //out(xyzs)
        let direction = Vector.normalize(Vector.subtract(xyzs[5], xyzs[4]))
        let config = Kin.J_angles_to_config(temp_angles)
        return [xyzs[5], direction, config]
    }
    
    this.J_angles_to_coor = function(joint_angles, L0_pose){
        if(Object.isNewObject(L0_pose)){
            L0 = L0_pose
        }else if(Vector.is_pose(L0_pose)){
        	L0 = Table.create_child(L0_pose)
        }else if(L0_pose == undefined){ // this should get replaced with is_Coor()
            L0 = Table.create_child(Vector.make_pose())
        }else{
        	dde_error("L0_pose input arg must be a Coordinate System Object, a pose, or undefined")
        }
        let L = [Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5]
        let J = joint_angles
        
        
		L1 = L0.create_child(Vector.make_pose([0, 0, L[0]]), "L1")
		L2 = L1.create_child(Vector.make_pose([0, 0, L[1]]), "L2")
		L3 = L2.create_child(Vector.make_pose([0, 0, L[2]]), "L3")
        L4 = L3.create_child(Vector.make_pose([0, 0, L[3]]), "L4")
        L5 = L4.create_child(Vector.make_pose([0, 0,    0]), "L5")
		
        L1.rotate("Z", J[0], [0, 0, 0])
        L2.rotate("X", J[1], [0, 0, 0])
        L3.rotate("X", J[2], [0, 0, 0])
        L4.rotate("X", J[3], [0, 0, 0])
        L5.rotate("Z", J[4], [0, 0, 0])
        
        return [L0.get_pose(Table), L1.get_pose(Table), L2.get_pose(Table), L3.get_pose(Table), L4.get_pose(Table), L5.get_pose(Table)]
    }
    
    this.three_positions_to_pose = function(J_angles_1, J_angles_2, J_angles_3){
    	let points_A, points_B, points_C, UA5, UA4, UB5, UB4, UC5, UC4, U5_ave, U4_ave, U45
        let point, x_vector, y_vector, z_vector, pose, angleA, angleB, angleC, vector_1, vector_2
        
        points_A = Kin.forward_kinematics(J_angles_1)[0]
        points_B = Kin.forward_kinematics(J_angles_2)[0]
        points_C = Kin.forward_kinematics(J_angles_3)[0]
        
        UA5 = points_A[5]
        UA4 = points_A[4]
        UB5 = points_B[5]
        UB4 = points_B[4]
        UC5 = points_C[5]
        UC4 = points_C[4]
        
        U5_ave = Vector.average(UA5, UB5, UC5)
        U4_ave = Vector.average(UA4, UB4, UC4)
        U45 = Vector.subtract(U4_ave, U5_ave)
        
        angleA = Vector.angle(Vector.subtract(UB5, UA5), Vector.subtract(UC5, UA5))
        angleB = Vector.angle(Vector.subtract(UA5, UB5), Vector.subtract(UC5, UB5))
        angleC = Vector.angle(Vector.subtract(UB5, UC5), Vector.subtract(UA5, UC5))
        
        switch(Math.max(angleA, angleB, angleC)){
        	case angleA:
            	point = UA5
                vector_1 = Vector.subtract(UB5, UA5)
                vector_2 = Vector.subtract(UC5, UA5)
            	break
                
            case angleB:
            	point = UB5
                vector_1 = Vector.subtract(UA5, UB5)
                vector_2 = Vector.subtract(UC5, UB5)
            	break
                
            case angleC:
            	point = UC5
                vector_1 = Vector.subtract(UB5, UC5)
                vector_2 = Vector.subtract(UA5, UC5)
            	break
        }
        
        if(0 < Vector.dot(Vector.cross(vector_1, vector_2), U45)){
        	x_vector = Vector.normalize(vector_1)
        }else{
        	x_vector = Vector.normalize(vector_2)
        }
        
        z_vector = Vector.pull(Vector.points_to_plane(UA5, UB5, UC5), 0, [0, 2])
        if(0 > Vector.dot(z_vector, U45)){
        	z_vector = Vector.multiply(-1, z_vector)
        }
        
        pose = Vector.make_pose(point, Vector.make_dcm(x_vector, undefined, z_vector))
        return pose
    }
    /*
    var applied_force = -75 //N
    var angles = [0, 45, 90, -45, 0]
    var fk = Kin.forward_kinematics(angles)
    var points = fk[0]

	var forcepoint = points[5]
    var arm1 = Vector.subtract(points[5], points[1])[1]
    var arm2 = 0
    var arm3 = 0
    //var arm1 = 0
    //var arm2 = Vector.subtract(points[5], points[1])[1]
    //var arm3 = Vector.subtract(points[5], points[2])[1]
    var T = [0, 0, 0]
    T[0] = arm1*applied_force
    T[1] = arm2*applied_force
    T[2] = arm3*applied_force
    out(T)
    
    //var angles = [0, 45, 0, 0, 0]
    //T = [0, -0.8255, 0.8255]
    //debugger
    Kin.three_torques_to_force(angles, T)
    
    */

    this.three_torques_to_force = function(J_angles, torques = [0, 0, 0]){
    	if(torques.length != 3){dde_error("Only the first three torques are required for this function")}
        
        let U, V, P, L2, L3, P1_offset, torque_vectors, U_contact, base_rot
        let tangent_forces, force_vector, num, den, force_direction, force_magnitude, cartesian_forces, Fv_mag
        let axes = [0, 0, 0]
        let D = [0, 0, 0]
        let T = [0, 0, 0]
        let F = [0, 0, 0]
        let temp_J_angles = Convert.deep_copy(J_angles)
        base_rot = temp_J_angles[0]
        temp_J_angles[0] = 0
        let fk = Kin.forward_kinematics(temp_J_angles)
        U = fk[0]
        V = fk[1]
        P = fk[2]
        L2 = Dexter.LINK2
        L3 = Dexter.LINK3
        
        U_contact = U[5]
        
        //Torque axes
        axes[0] = Vector.normalize(V[0])
        axes[1] = P[1]
        axes[2] = P[1]
        
        //Moment arms (as vectors):
        D[0] = Vector.project_vector_onto_plane(U_contact, axes[0])
        D[1] = Vector.subtract(Vector.project_vector_onto_plane(U_contact, P[1]), U[1])
        D[2] = Vector.subtract(Vector.project_vector_onto_plane(U_contact, P[1]), U[2])
		
        //Torques (as vectors):
        T[0] = Vector.multiply(torques[0], axes[0])
        T[1] = Vector.multiply(torques[1], axes[1])
        T[2] = Vector.multiply(torques[2], axes[2])
        
        //Perpendicular forces:
        F[0] = Vector.multiply(Vector.abs(torques[0]/Vector.magnitude(D[0])), Vector.normalize(Vector.cross(D[0], T[0])))
        F[1] = Vector.multiply(Vector.abs(torques[1]/Vector.magnitude(D[1])), Vector.normalize(Vector.cross(D[1], T[1])))
        F[2] = Vector.multiply(Vector.abs(torques[2]/Vector.magnitude(D[2])), Vector.normalize(Vector.cross(D[2], T[2])))
        
        //Force-space calcs:
        let F1a = F[1]
        let F1b = Vector.add(F[1], Vector.cross(F[1], P[1]))
        let F2a = F[2]
        let F2b = Vector.add(F[2], Vector.cross(F[2], P[1]))
        
        
        let A = (F2b[1]-F1b[1])/(F1a[1]-F1b[1])
        let B = ((F2a[1]-F2b[1])*(F1b[2]-F2b[2]))/((F1a[1]-F1b[1])*(F2a[2]-F2b[2]))
        let C = ((F2a[1]-F2b[1])*(F1a[2]-F1b[2]))/((F1a[1]-F1b[1])*(F2a[2]-F2b[2]))
        let alpha = (A+B)/(1-C)
        let beta = (F1b[2]-F2b[2]+(F1a[2]-F1b[2])*alpha)/(F2a[2]-F2b[2])
        
        let ForceYZ = Vector.add(F2b, Vector.multiply(beta, Vector.subtract(F2a, F2b)))
		if(torques[1] == 0 && torques[2] == 0){
        	ForceYZ[1] = 0
            ForceYZ[2] = 0
        }

		let lineYZa = [0, ForceYZ[1], ForceYZ[2]]
        let lineYZb = [1, ForceYZ[1], ForceYZ[2]]
        let ForceXYZ
        if(torques[0] == 0){
        	ForceXYZ = [0, ForceYZ[1], ForceYZ[2]]
        }else{
        	ForceXYZ = Vector.project_point_onto_line(F[0], lineYZa, lineYZb)
        }
        
        return ForceXYZ
    }
    /*
    var J_angles = Convert.degrees_to_arcseconds([0, 0, 0, 0, 0]) 
    var F = 22
    var T = [F*Convert.mms_to_microns(40.7), F*(Dexter.LINK2 + Dexter.LINK3), F*Dexter.LINK3]
    debugger
    out(Kin.three_joints_force(J_angles, T, 'EndAxisHub'))
    
    
    
    var J_angles = Convert.degrees_to_arcseconds([0, 0, 90, 0, 0]) 
    var F = 22
    var F2 = 0
    var T = [F2*Dexter.LINK3, F*Dexter.LINK3, F*Dexter.LINK3]
    //debugger
    out(Kin.three_joints_force(J_angles, T, 'EndAxisHub'))
    
    var J_angles = Convert.degrees_to_arcseconds([45, 0, 45, 0, 0]) 
    var Fz = 13
    var Fx = 0
    var T = [Fx*Dexter.LINK3, Fz*Dexter.LINK3, Fz*Dexter.LINK3]
    //debugger
    out(Kin.three_joints_force(J_angles, T, 'EndAxisHub'))
    
    
    var Fv_mag = Vector.magnitude(Fv[1])
    var angle = Math.atan(Fv[1][1]/Fv[1][2])
    var hyp = Fv_mag/Math.cos(angle)
    var hyp2 = Fv_mag*Math.sqrt(1+Math.pow(Math.hypot(Fv[1][1], Fv[0][1])/Fv[1][2],2))
    var hyp2 = Fv_mag*Math.sqrt(1+Math.pow(Fv[0][1]/Fv[1][2],2))
    Vector.cross(Fv[1], [0,0,1])
    */
    /*
    function dde_warning(message){
        if(!(dde_warning_list.indexOf(message) > -1)){
        	dde_warning_list.push(message)
    		out("dde_warning: " + message, "red")
        }
    }
    */
    
	this.predict_move_dur = function(J_angles_original, J_angles_destination, robot /*returns time in milliseconds*/){
        
        //let speed = robot.prop("MAX_SPEED")
        let speed = 30
        let delta = Vector.subtract(J_angles_destination, J_angles_original)
        for(let i = 0; i < delta.length; i++){
        	delta[i] = Math.abs(delta[i])
        }
        return Vector.max(delta)/speed
    }
    
    this.tip_speed_to_angle_speed = function(J_angles_original, J_angles_destination, tip_speed){
        let U1, U2
        let EE_point_1 = Kin.J_angles_to_xyz(J_angles_destination)[0]
        let EE_point_2 = Kin.J_angles_to_xyz(J_angles_original)[0]
        let delta = Vector.subtract(J_angles_destination, J_angles_original)
        let data = []
        let temp_dist
        let dist = Vector.distance(EE_point_2, EE_point_1)
        if(dist == 0){return 30}
        let time = dist/tip_speed
        for(let i = 0; i < delta.length; i++){
        	delta[i] = Math.abs(delta[i])
        }
        let max_theta = Vector.max(delta)
        return max_theta/time
    }
    /*
    Kin.tip_speed_to_angle_speed([0, 90, 0, 0, 0], [1, 90, 0, 0, 0], 5*_mm/_s)
    */
    
    this.angles_to_dir_xyz = function(x_angle = 0, y_angle = 0){
        if(x_angle.length == 2){
        	y_angle = x_angle[1]
            x_angle = x_angle[0]
        }
        let ZX_plane = [0, cosd(y_angle), sind(y_angle)]
        let ZY_plane = [cosd(x_angle), 0, sind(x_angle)]
        if(Vector.is_equal(ZX_plane, ZY_plane) || Vector.is_equal(Vector.multiply(-1, ZX_plane), ZY_plane)){
        	dde_error("Direction (" + x_angle +", " + y_angle + ") causes a singularity")
        }
		return Vector.round(Vector.normalize(Vector.cross(ZX_plane, ZY_plane)), 15)
    }
    
    this.dir_xyz_to_angles = function(dir_xyz = [0, 0, -1]){
    	let x_angle, y_angle
        if(dir_xyz[2] == 0){
        	dde_error("The direction " + dir_xyz + " cannot be converted to angles")
        }
        if(dir_xyz[2] < 0){
        	x_angle = atan2d(dir_xyz[0], -dir_xyz[2])
        	y_angle = atan2d(dir_xyz[1], -dir_xyz[2])
        }else{
        	if(Math.abs(dir_xyz[0]) > Math.abs(dir_xyz[1])){
        		x_angle = atan2d(dir_xyz[0], -dir_xyz[2])
        		y_angle = -atan2d(dir_xyz[1], dir_xyz[2])
            }else{
            	x_angle = -atan2d(dir_xyz[0], dir_xyz[2])
        		y_angle = atan2d(dir_xyz[1], -dir_xyz[2])
            }
        }
		return [x_angle, y_angle]
    }
    
    /*
    
    Kin.angles_to_dir_xyz(90, 0)
    
    Kin.angles_to_dir_xyz(91, 45) //[0.999695459881888, -0.017449749160683, 0.017449749160683]
    Kin.angles_to_dir_xyz(91, -45) //[0.999695459881888, 0.017449749160683, 0.017449749160683]
    Kin.angles_to_dir_xyz(-91, 45) //[-0.999695459881888, -0.017449749160683, 0.017449749160683]
    Kin.angles_to_dir_xyz(-91, -45) //[-0.999695459881888, 0.017449749160683, 0.017449749160683]
    
    
    Kin.angles_to_dir_xyz(45, 91) //[-0.017449749160683, 0.999695459881888, 0.017449749160683]
    Kin.angles_to_dir_xyz(-45, 91) //[0.017449749160683, 0.999695459881888, 0.017449749160683]
    
    Kin.angles_to_dir_xyz(91, 91) //[-0.707052927141246, -0.707052927141246, -0.012341654750937]
    Kin.angles_to_dir_xyz(-91, 91) //[0.707052927141246, -0.707052927141246, -0.012341654750937]
    Kin.angles_to_dir_xyz(91, -91) //[-0.707052927141246, 0.707052927141246, -0.012341654750937]
    Kin.angles_to_dir_xyz(-95, -95) //[0.707052927141246, 0.707052927141246, -0.012341654750937]
    
    [0.705757556807952, 0.705757556807952, -0.061745785418449]
    [0.705757556807952, 0.705757556807952, -0.061745785418449] 
    
    Kin.angles_to_dir_xyz(85, 85) //[0.707052927141246, 0.707052927141246, -0.012341654750937]
    
    */
    
    this.dir_xyz_to_percent = function(dir_xyz = [0, 0, -1]){
    	let total = Vector.sum(Vector.abs(dir_xyz))
		return Vector.multiply(100, Vector.divide(dir_xyz, total))
    }
    
	/*
    debugger
    Kin.interp_movement([0, 0, 0, 0, 0], [44, 45, 0, 0, 0], 30)
    */
    this.interp_movement = function(J_angles_original, J_angles_destination, resolution = 5*_deg){
    	let delta = Vector.subtract(J_angles_destination, J_angles_original)
        let abs_delta = [0, 0, 0, 0, 0]
        for(let i = 0; i < delta.length; i++){
        	abs_delta[i] = Math.abs(delta[i])
        }
        let max_delta = Vector.max(abs_delta)
        let div = 1
    	let step = Infinity
    	while(resolution < step){
    		div++
        	step = max_delta / div
    	}
        let J_angles_array = []
        let delta_steps = Vector.divide(delta, div)
        for(let i = 1; i < div+1; i++){
    		J_angles_array.push(Vector.add(Vector.multiply(i, delta_steps), J_angles_original))
    	}
        return J_angles_array
    }
    /*
    out(Kin.angles_to_direction(0, 45))
    */
    
    this.move_to_straight = function(xyz_1, xyz_2, J5_direction, config, tool_speed = 5*_mm / _s, resolution = .5*_mm, robot_pose, no_error = false){
    	let movCMD = []
    	let U1 = xyz_1
    	let U2 = xyz_2
    	let U21 = Vector.subtract(U2, U1)
    	let v21 = Vector.normalize(U21)
    	let mag = Vector.magnitude(U21)
    	let div = 1
    	let step = Infinity
    	while(resolution < step){
    		div++
        	step = mag / div
    	}
    	let angular_velocity
    	let Ui, new_J_angles
    	let old_J_angles = Kin.xyz_to_J_angles(U1, J5_direction, config, robot_pose)
        let xyzs = []
        let speeds = []
    	for(let i = 0; i < div+1; i++){
    		Ui = Vector.add(U1, Vector.multiply(i*step, v21))
            if(!Kin.is_in_reach(Ui, J5_direction, config, robot_pose) && no_error){
        		return xyzs
            }
            new_J_angles = Kin.xyz_to_J_angles(Ui, J5_direction, config, robot_pose)
        	angular_velocity = Kin.tip_speed_to_angle_speed(old_J_angles, new_J_angles, tool_speed)
        	old_J_angles = new_J_angles
            
            xyzs.push(Ui)
            speeds.push(angular_velocity)
            /*
        	movCMD.push(make_ins("S", "MaxSpeed", angular_velocity))
    		movCMD.push(make_ins("S", "StartSpeed", angular_velocity))
        	movCMD.push(Dexter.move_to(Ui, J5_direction, config, robot_pose))
            */
    	}
		return [xyzs, speeds]
	}
    /*
    
    Kin.move_to_straight([0, .5, .075], [0, .6, .075])
    */
    /*
    this.make_ins_move_straight(xyz_1, xyz_2, J5_direction, config, tool_speed = 5*_mm / _s, resolution = .5*_mm, robot_pose){
    	let CMD = []
        
        
        for(let i = 0; i < .length; i++){
    		CMD.push(make_ins("S", "MaxSpeed", angular_velocity))
    		CMD.push(make_ins("S", "StartSpeed", angular_velocity))
        	CMD.push(Dexter.move_to(Ui, J5_direction, config, robot_pose))
        }
        return CMD
    }*/
    
}

/*
var point_1 = [0, .3, .4]
//debugger
//var myJangles = Kin.xyz_to_J_angles([-0.4961591506890708, 0.4961591506890706, 0.08255000000000005], [0, 0, -1], Dexter.RIGHT_UP_OUT)
myJangles = [0,-45, -45, 0, 0]
var myPoints = Kin.forward_kinematics(myJangles)[0]
var myPosition = Kin.J_angles_to_xyz(myJangles)
debugger
Kin.xyz_to_J_angles(myPosition[0], myPosition[1], myPosition[2])


var point_1 = [.1, .2, .3]
//debugger
var myJangles = Kin.xyz_to_J_angles(point_1, [0, 1, -1], Dexter.RIGHT_DOWN_OUT)
var new_point = Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3], [0, 1, -1], Dexter.RIGHT_DOWN_OUT))
*/

/*
new TestSuite("Inverse to Forward Kinematics and Back",
	["Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3]))", "[[0.09999999999999996, 0.20000000000000004, 0.30000000000000004],[0, 0, -1],[1, 1, 1]]"],
	["Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3], [0, .1, -1]))", "[ [0.10000000000000012, 0.19999999999999998, 0.30000000000000004], [3.362274453740632e-16, 0.09950371902099878, -0.995037190209989], [1, 1, 1]]"],
	["Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3], [0, 0, -1], [1, 0, 1]))", "[ [0.09999999999999994, 0.20000000000000004, 0.3], [-3.362274453740631e-16, -6.724548907481262e-16, -1], [1, 0, 1]]", "known, wrist_out vs wrist_in issue"],
    ["Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3], [0, 0, -1], [1, 0, 0]))", "[[0.1, 0.20000000000000012, 0.29999999999999993], [0, 0, -1], [1, 0, 0]]"],
    ["Kin.xyz_to_J_angles(Kin.J_angles_to_xyz([0, 45, 45, 30, 0]))", "[0, 45, 44.999999999999986, 30.000000000000014, 0]"]
)
*/

new TestSuite("Inverse to Forward Kinematics and Back",
	["Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3]))", "[[0.09999999999999998, 0.20000000000000004, 0.29999999999999993],[-1.6811372268703155e-16, -3.362274453740631e-16, -1],[1, 1, 1]]"],
    ["Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3], [0, .1, -1]))", "[[0.10000000000000013, 0.19999999999999996, 0.30000000000000016],[5.043411680610948e-16, 0.09950371902099911, -0.995037190209989],[1, 1, 1]]"],
	["Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3], [0, 0, -1], [1, 0, 1]))", "[[0.09999999999999994, 0.20000000000000004, 0.29999999999999993],[-1.6811372268703155e-16, -3.362274453740631e-16, -1],[1, 0, 0]]"],
    ["Kin.J_angles_to_xyz(Kin.xyz_to_J_angles([.1, .2, .3], [0, 0, -1], [1, 0, 0]))", "[[0.09999999999999994, 0.2, 0.29999999999999993],[0, 0, -1],[1, 0, 0]]"],
    ["Kin.xyz_to_J_angles(Kin.J_angles_to_xyz([0, 45, 45, 30, 0]))", "[0, 44.99999999999997, 45.00000000000003, 29.999999999999996, 0]"]
)

new TestSuite("Checking xyz",
    ["Kin.check_J_ranges([0, 0, 0, 0, 0])", "true"],
    ["Kin.check_J_ranges([0, 0, 0, 181, 0])", "false"]
)