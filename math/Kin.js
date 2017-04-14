//Kinematics Class
//Inverse Kinematics + Forward Kinematics
//James Wigglesworth
//Started: 6_18_16
//Updated: 3_27_17


var Kin = new function(){


    
    this.IK = function({xyz, normal = [0, 0, -1], config = [1, 1, 1], base_coor, ref_coor}){
    	if(base_coor === undefined){
        	
        }else{
        	U[0] = base_coor.get_position()
            P[0] = base_coor.get_pose()
        }
    
    	var J = new Array(5) // Joint Angles
    	var U = new Array(5).fill(new Array(3)) //Point Locations
        var P = new Array(3).fill(new Array(4)) //Planes
        var L = [Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5] //Link Lengths

		//Default Values:
    	U[0] = U0 		//Base Location
    	var V10 = V10 	//Base Orientation
    	P[0] = P0 		//Base Plane
    	var right_arm = state[0];
    	var elbow_up = state[1];
    	var wrist_out = state[2];
		
		
        
    	//Calculations:
    	var V54 = Vector.multiply(-1, Vector.normalize(normal)) //Direction of 
        if(Vector.is_equal(tool_xyz, [0, 0, Dexter.LINK5]) && (Vector.is_equal(tool_normal, [0, 0, 1]))){
        	//Desired End Effector Position
        	U[5] = xyz
            U[4] = Vector.add(U[5], Vector.multiply(L[4], V54))
        }else{
        	/*
            let tool_V54 = Vector.multiply(-1, tool_xyz)
            let tool_U5 = xyz
            let tool_U4 = Vector.add(xyz, tool_V54)
            let theta = Vector.signed_angle(normal, tool_normal, Vector.cross(normal, tool_normal))
            let tool_U4 = Vector.rotate(tool_U4, Vector.cross(normal, tool_normal), theta, tool_U5)
            let tool_plane = Vector.complete_plane(tool_V54, tool_U4)
            //let proj_U1 = 
            
            local_xyz
            local_normal
        	U[4] = Vector.add(U[5], Vector.multiply(L[4], V54))
            */
        }
    	 
    	
    	//Easy points
    	U[1] = Vector.add(U[0], Vector.multiply(L[0], V10))
    	
        
    	//Solving for P1
        //debugger
    	P[1] = Vector.points_to_plane(U[1], U[0], U[4])
        
    	//Solving for U3
    	var U54_Proj = Vector.project_vector_onto_plane(V54, P[1])
    	var U3_a = Vector.add(U[4], Vector.multiply(L[3], Vector.rotate(Vector.normalize(U54_Proj), P[1], 324000)))
        var U3_b = Vector.add(U[4], Vector.multiply(L[3], Vector.rotate(Vector.normalize(U54_Proj), P[1], -324000)))
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
        
        
    	//Solving for P2
    	P[2] = Vector.points_to_plane(U[5], U[4], U[3])
		
    	//Solving for U2
    	var D3 = Vector.distance(U[3], U[1])
        
        //Checking if in reach
        //debugger
        if (D3 > Dexter.LINK2 + Dexter.LINK3){
        	let out_of_reach_dist = Vector.round(Convert.microns_to_mms(D3 - (Dexter.LINK2 + Dexter.LINK3)), 3)
            
        	dde_error("The location: " + Vector.round(Convert.microns_to_mms(xyz), 1) + ' is ' + out_of_reach_dist + ' mm out of reach.')
        }
        

    	var Beta = Vector.acos_arcsec((-Math.pow(L[2], 2) + Math.pow(L[1], 2) + Math.pow(D3, 2)) / (2 * D3 * L[1])) // Law of Cosines
        var V31 = Vector.normalize(Vector.subtract(U[3], U[1]))
    	var V23
    	
    	var U2_a = Vector.add(U[1], Vector.multiply(L[1], Vector.rotate(V31, P[1], Beta)))
    	var U2_b = Vector.add(U[1], Vector.multiply(L[1], Vector.rotate(V31, P[1], -Beta)))
    	var U2_a_dist = Vector.distance(U2_a, P[0])
    	var U2_b_dist = Vector.distance(U2_b, P[0])
    	
    	if (elbow_up){
    		if(U2_a_dist > U2_b_dist){
        		U[2] = U2_a
        	}else{
        		U[2] = U2_b
        	}
    	}else{
      		if(U2_a_dist < U2_b_dist){
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

    J[0] = Vector.signed_angle(P[1], P[0], V10) //648000 = 180 degrees
    J[1] = Vector.signed_angle(V21, V10, P[1])
    J[2] = Vector.signed_angle(V32, V21, P[1])
    J[3] = Vector.signed_angle(V43, V32, P[1])
    J[4] = Vector.signed_angle(P[2], P[1], V43) //648000 = 180 degrees
	
    return [J, U, P]
    }
    
    
    
    
    
    
    
    //Private
    this.inverse_kinematics = function (xyz, normal = [0, 0, -1], state = [1, 1, 1], U0 = [0, 0, 0], V10 = [0, 0, 1], P0 = [1, 0, 0, 0], tool_xyz = [0, 0, Dexter.LINK5], tool_normal = [0, 0, 1]){
    	var J = new Array(5) // Joint Angles
    	var U = new Array(5).fill(new Array(3)) //Point Locations
        var P = new Array(3).fill(new Array(4)) //Planes
        var L = [Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5] //Link Lengths

		//Default Values:
    	U[0] = U0 		//Base Location
    	var V10 = V10 	//Base Orientation
    	P[0] = P0 		//Base Plane
    	var right_arm = state[0];
    	var elbow_up = state[1];
    	var wrist_out = state[2];
		
		
        
    	//Calculations:
    	var V54 = Vector.multiply(-1, Vector.normalize(normal)) //Direction of 
        if(Vector.is_equal(tool_xyz, [0, 0, Dexter.LINK5]) && (Vector.is_equal(tool_normal, [0, 0, 1]))){
        	//Desired End Effector Position
        	U[5] = xyz
            U[4] = Vector.add(U[5], Vector.multiply(L[4], V54))
        }else{
        	/*
            let tool_V54 = Vector.multiply(-1, tool_xyz)
            let tool_U5 = xyz
            let tool_U4 = Vector.add(xyz, tool_V54)
            let theta = Vector.signed_angle(normal, tool_normal, Vector.cross(normal, tool_normal))
            let tool_U4 = Vector.rotate(tool_U4, Vector.cross(normal, tool_normal), theta, tool_U5)
            let tool_plane = Vector.complete_plane(tool_V54, tool_U4)
            //let proj_U1 = 
            
            local_xyz
            local_normal
        	U[4] = Vector.add(U[5], Vector.multiply(L[4], V54))
            */
        }
    	 
    	
    	//Easy points
    	U[1] = Vector.add(U[0], Vector.multiply(L[0], V10))
    	
        
    	//Solving for P1
        //debugger
    	P[1] = Vector.points_to_plane(U[1], U[0], U[4])
        
    	//Solving for U3
    	var U54_Proj = Vector.project_vector_onto_plane(V54, P[1])
    	var U3_a = Vector.add(U[4], Vector.multiply(L[3], Vector.rotate(Vector.normalize(U54_Proj), P[1], 324000)))
        var U3_b = Vector.add(U[4], Vector.multiply(L[3], Vector.rotate(Vector.normalize(U54_Proj), P[1], -324000)))
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
        
        
    	//Solving for P2
    	P[2] = Vector.points_to_plane(U[5], U[4], U[3])
		
    	//Solving for U2
    	var D3 = Vector.distance(U[3], U[1])
        
        //Checking if in reach
        //debugger
        if (D3 > Dexter.LINK2 + Dexter.LINK3){
        	let out_of_reach_dist = Vector.round(Convert.microns_to_mms(D3 - (Dexter.LINK2 + Dexter.LINK3)), 3)
            out(V54)
        	dde_error("The location: " + Vector.round(Convert.microns_to_mms(xyz), 1) + ' is ' + out_of_reach_dist + ' mm out of reach.')
        }
        

    	var Beta = Vector.acos_arcsec((-Math.pow(L[2], 2) + Math.pow(L[1], 2) + Math.pow(D3, 2)) / (2 * D3 * L[1])) // Law of Cosines
        var V31 = Vector.normalize(Vector.subtract(U[3], U[1]))
    	var V23
    	
    	var U2_a = Vector.add(U[1], Vector.multiply(L[1], Vector.rotate(V31, P[1], Beta)))
    	var U2_b = Vector.add(U[1], Vector.multiply(L[1], Vector.rotate(V31, P[1], -Beta)))
    	var U2_a_dist = Vector.distance(U2_a, P[0])
    	var U2_b_dist = Vector.distance(U2_b, P[0])
    	
    	if (elbow_up){
    		if(U2_a_dist > U2_b_dist){
        		U[2] = U2_a
        	}else{
        		U[2] = U2_b
        	}
    	}else{
      		if(U2_a_dist < U2_b_dist){
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
    	J[0] = Vector.signed_angle(P[1], P[0], V10) //648000 = 180 degrees
    	J[1] = Vector.signed_angle(V21, V10, P[1])
    	J[2] = Vector.signed_angle(V32, V21, P[1])
    	J[3] = Vector.signed_angle(V43, V32, P[1])
    	J[4] = Vector.signed_angle(P[2], P[1], V43) //648000 = 180 degrees
    }else{
    	J[0] = Vector.signed_angle(P[1], P[0], V10) + 648000 //648000 = 180 degrees
    	J[1] = -Vector.signed_angle(V21, V10, P[1])
    	J[2] = -Vector.signed_angle(V32, V21, P[1])
    	J[3] = -Vector.signed_angle(V43, V32, P[1])
    	J[4] = -Vector.signed_angle(P[2], P[1], V43)
    }
    
    return [J, U, P]
    }
    /*
    Kin.inverse_kinematics([0, 400000, 100000], [0, 0, -1], Dexter.RIGHT_UP_OUT)
    debugger
    Kin.inverse_kinematics([0, 400000, 100000], [0, 0, -1], Dexter.LEFT_UP_OUT)
    */
    //Public
    //convention for declaring local link reference frames:
    //origin is located at intersection of axis of rotation and plane of rotation 
    //z axis is along link length
    //x axis is along axis of rotation
    /*
    this.new_end_effector_transform = function(xyz, normal, local_xyz = [0, 0, Dexter.LINK5], local_normal = [0, 0, 1]){
    	let default_tool_tip = [0, 0, Dexter.LINK5]
        let default_tool_normal = [0, 0, 1]
        let theta = Vector.signed_angle(local_normal, default_tool_normal, [1, 0, 0])
        let result_normal = Vector.rotate(normal, [1, 0, 0], theta)
        let delta = Vector.subtract(default_tool_tip, local_xyz)
        let result_xyz = Vector.add(xyz, Vector.multiply(delta, normal))
        return [result_xyz, result_normal]
    }
   	
    debugger
    Kin.new_end_effector_transform([500000, 500000, 500000], [0, 0, -1], [10000, 10000, 82550 + 10000], [0, 0, 1])
    */
    
    
    //Private
    //Calculates point positions given joint angles
    this.forward_kinematics = function(joint_angles, U0 = [0, 0, 0], V10 = [0, 0, 1], P0 = [1, 0, 0, 0]){
        var J = Convert.deep_copy(joint_angles) //Joint Angles
        var U = new Array(5).fill(new Array(3)) //Point Locations
        var L = [Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5] //Link Lengths
    	var P = new Array(3).fill(new Array(4)) //Planes
        
        var U21, U32, U43, U54, V21, V32, V43, V54
        
        //Calculates all vectors first
        P[0] = P0
		P[1] = Vector.rotate(P[0], V10, 648000 - J[0])
        V21 = Vector.rotate(V10, P[1], J[1])
        V32 = Vector.rotate(V21, P[1], J[2])
        V43 = Vector.rotate(V32, P[1], J[3])
        P[3] = Vector.rotate(P[1], V43, 648000 - J[4])
        V54 = Vector.rotate(V43, P[3], -324000) // 324000 = 90 degrees
		let V = [V10, V21, V32, V43, V54]
        
        //Dimensionalizes vectors by multiplying by link lengths
        U[0] = U0
		U[1] = Vector.add(U[0], Vector.multiply(L[0], V10))
        U[2] = Vector.add(U[1], Vector.multiply(L[1], V21))
        U[3] = Vector.add(U[2], Vector.multiply(L[2], V32))
        U[4] = Vector.add(U[3], Vector.multiply(L[3], V43))
        U[5] = Vector.add(U[4], Vector.multiply(L[4], V54))

        return [U, V]
    }
    
    
    

    //This allows the base rotation to be represented as an angle 
    //Returns the base plane given that angle
    this.base_rotation_to_plane = function(base_rotation, base_plane){
    	let temp_plane
        if(Vector.is_equal(base_plane, [0, 1, 0])){
        	temp_plane = [0, 0, -1]
        }else{
        	temp_plane = [0, 1, 0]
        }
        let temp_vector = Vector.cross(temp_plane, base_plane)
        return Vector.rotate(temp_vector, base_plane, base_rotation)
    }
    
    
    this.L3_inverse_kinematics = function(J3_xyz, orientation = [0, 0, -1], config = Dexter.RIGHT_DOWN_OUT){
    	var J = new Array(5) // Joint Angles
    	var U = new Array(5).fill(new Array(3)) //Point Locations
        var P = new Array(3).fill(new Array(4)) //Planes
        var L = [Dexter.LINK1, Dexter.LINK2, Dexter.LINK3, Dexter.LINK4, Dexter.LINK5] //Link Lengths

		//Default Values:
    	U[0] = [0, 0, 0]		//Base Location
    	var V10 = [0, 0, 1] 	//Base Orientation
    	P[0] = [1, 0, 0] 		//Base Plane
    	var right_arm = config[0];
    	var elbow_up  = config[1];
    	var wrist_out = config[2];
		
		    	
    	//Easy points
    	U[1] = Vector.add(U[0], Vector.multiply(L[0], V10))
    	var V54 = Vector.multiply(-1, Vector.normalize(normal)) //Direction of 
        U[3] = J3_xyz
        
    	//Solving for P1
    	P[1] = Vector.points_to_plane(U[1], U[0], U[3])

    	//Solving for U2
    	var D3 = Vector.distance(U[3], U[1])
        
        //Checking if in reach
        //debugger
        if (D3 > Dexter.LINK2 + Dexter.LINK3){
        	let out_of_reach_dist = Vector.round(Convert.microns_to_mms(D3 - (Dexter.LINK2 + Dexter.LINK3)), 3)
            out(V54)
        	dde_error("The location: " + Vector.round(Convert.microns_to_mms(xyz), 1) + ' is ' + out_of_reach_dist + ' mm out of reach.')
        }
        

    	var Beta = Vector.acos_arcsec((-Math.pow(L[2], 2) + Math.pow(L[1], 2) + Math.pow(D3, 2)) / (2 * D3 * L[1])) // Law of Cosines
        var V31 = Vector.normalize(Vector.subtract(U[3], U[1]))
    	var V23
    	
    	var U2_a = Vector.add(U[1], Vector.multiply(L[1], Vector.rotate(V31, P[1], Beta)))
    	var U2_b = Vector.add(U[1], Vector.multiply(L[1], Vector.rotate(V31, P[1], -Beta)))
    	var U2_a_dist = Vector.distance(U2_a, P[0])
    	var U2_b_dist = Vector.distance(U2_b, P[0])
    	
    	if (elbow_up){
    		if(U2_a_dist > U2_b_dist){
        		U[2] = U2_a
        	}else{
        		U[2] = U2_b
        	}
    	}else{
      		if(U2_a_dist < U2_b_dist){
        		U[2] = U2_a
        	}else{
        		U[2] = U2_b
        	}
    	}


    //Solving for joint angles
    
	//var V10 = minus(U[1], U[0])
    var V21 = Vector.normalize(Vector.subtract(U[2], U[1]))
    var V32 = Vector.normalize(Vector.subtract(U[3], U[2]))
    Vector.signed_angle(V54, V32)
    var V43 = Vector.normalize(Vector.subtract(U[4], U[3]))

	if(right_arm == 1){
    	J[0] = Vector.signed_angle(P[1], P[0], V10) //648000 = 180 degrees
    	J[1] = Vector.signed_angle(V21, V10, P[1])
    	J[2] = Vector.signed_angle(V32, V21, P[1])
    	J[3] = Vector.signed_angle(V43, V32, P[1])
    	J[4] = Vector.signed_angle(P[2], P[1], V43) //648000 = 180 degrees
    }else{
    	J[0] = Vector.signed_angle(P[1], P[0], V10) + 648000 //648000 = 180 degrees
    	J[1] = -Vector.signed_angle(V21, V10, P[1])
    	J[2] = -Vector.signed_angle(V32, V21, P[1])
    	J[3] = -Vector.signed_angle(V43, V32, P[1])
    	J[4] = -Vector.signed_angle(P[2], P[1], V43)
    }
    
    return [J, U, P]
    }
    
    
    
    //Public
    this.is_in_reach = function(xyz, J5_direction = [0, 0, -1], base_xyz = [0, 0, 0], base_plane = [0, 0, 1]){
    	let U1 = Vector.add(base_xyz, Vector.multiply(base_plane, Dexter.LINK1))
    	let U4 = Vector.add(xyz, Vector.multiply(-1, Vector.normalize(J5_direction)))
		if (Vector.distance(U1, U4) <= Dexter.LINK2 + Dexter.LINK3 + Dexter.LINK4){
        	return true
        }else{
        	return false
        }
    }

	
    
    
    //Public
    this.table_intersection = function(joint_points){
    	let margins = [null, null, 40000, 30000, 30000, 0] //These are the distances each point can be from the table
        
    	let U_Copy = Convert.deep_copy(joint_points)
        let base_plane = Vector.normalize(Vector.subtract(U_Copy[1], U_Copy[0]))
        base_plane.push(0)
        let bad_points = []
        let point_dist
		
    	for(var i = 2; i <= 5; i++){
        	point_dist = -Vector.distance(U_Copy[i], base_plane)
        	if (margins[i] > point_dist){
            	bad_points.push([i, point_dist])
            }
        }
        if (bad_points.length === 1){
        	bad_points = [bad_points]
        }
        
        if (bad_points.length === 0){
        	return false
        }else{
        	return bad_points
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
    	let J = Convert.deep_copy(joint_angles)
        let U = Kin.forward_kinematics(J)
    }

	//Public
	this.point_at_xyz = function(xyz, current_J5_xyz, current_config, base_xyz = [0, 0, 0], base_plane = [0, 0, 1], base_rotation = 0){
    	let pointing_direction = Vector.subtract(xyz, current_J5_xyz)
        Kin.xyz_to_J_angles(current_J5_xyz, pointing_direction, current_config, base_xyz, base_plane, base_rotation)
    }
    
    
    //Torque:
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
    }
    
    
    this.torques_to_force = function(measured_torques = [0, 0, 0, 0, 0], J_angles = [0, 0, 0, 0, 0], base_xyz = [0, 0, 0], base_plane = [0, 0, 1], base_rotation = 0){
    	let P0 = Kin.base_rotation_to_plane(base_rotation, base_plane)
        let fk_result = Kin.forward_kinematics(J_angles, base_xyz, base_plane, P0)
        let et_result = Kin.expected_torques(J_angles, base_xyz, base_plane, base_rotation)
        let gravity_torques = et_result[0]
        let U = et_result[2]
        let planes_of_rotation = et_result[3]
        let forces = new Array(5).fill(new Array(3))
        let force = [0, 0, 0]
        
        let Fi = [0, 0, 0] //Force that lie along the intersection of P1 and P0 
        let Fj = [0, 0, 0] //Force perpendicular to P1
        let Fk = [0, 0, 0] //Force perpendicular to P0
        
        let applied_torques = Vector.subtract(measured_torques, gravity_torques)
        let applied_torque_vectors = new Array(5).fill(new Array(3))
        for(var i = 0; i < 5; i++){
        	applied_torque_vectors[i] = Vector.multiply(applied_torques[i], planes_of_rotation[i])
        }
        
        for(var i = 0; i < 5; i++){
        	forces[i] = Vector.cross(applied_torque_vectors[i], Vector.subtract(U[5], U[i]))
        }
        
        
        
        //assuming there are only forces acting on the end effector
    	//no torques and no other forcing points
        let count = [0, 0, 0]
        let total_force = [0, 0, 0]
        let force_comp
        for(var i = 0; i < 5; i++){
        	for(var j = 0; j <3; j++){
            	force_comp = forces[i][j]
            	if(force_comp !== 0){
                	count[j]++
                    total_force[j] += force_comp
                }
            }
        }
        for(var i = 0; i < 3; i++){
        	force[i] = total_force[i] / count[i]
        }
        
        
        return [force, forces]
    }
    
    
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

    //Public
    //Wrapper function for inverse kinematics
    //Returns joint angles
    this.xyz_to_J_angles = function(xyz, J5_direction = [0, 0, -1], config = Dexter.RIGHT_DOWN_OUT, base_xyz = [0, 0, 0], base_plane = [0, 0, 1], base_rotation = 0){
        var P0 = Kin.base_rotation_to_plane(base_rotation, base_plane)
        
        if(typeof(config) === "string"){
        	state = parse_config(config)
        }else{
        	var state = config
        }
        
        //xyz = Convert.mms_to_microns(xyz)
        //return Convert.arcseconds_to_degrees(inverse_kinematics(xyz, normal, state, U0, V10, P0))
        var result = Kin.inverse_kinematics(xyz, J5_direction, state, base_xyz, base_plane, P0)
        return result[0]
    }


	//Public
    //Wrapper function for inverse kinematics
    //Returns joint points
    this.xyz_to_J_points = function(xyz, J5_direction = [0, 0, -1], config = "right_up_out", base_xyz = [0, 0, 0], base_plane = [0, 0, 1], base_rotation = 0){
        var P0 = base_rotation_to_plane(base_rotation, base_plane)
        
        if(typeof(config) === "string"){
        	state = parse_config(config)
        }else{
        	var state = config
        }
        var result = Kin.inverse_kinematics(xyz, J5_direction, state, base_xyz, base_plane, P0)
        return result[1]
    }
    
    
    
    //Public
    //Wrapper function for inverse kinematics
    //Returns joint points
    this.xyz_to_J_planes = function(xyz, J5_direction = [0, 0, -1], config = "right_up_out", base_xyz = [0, 0, 0], base_plane = [0, 0, 1], base_rotation = 0){
        var P0 = base_rotation_to_plane(base_rotation, base_plane)
        
        if(typeof(config) === "string"){
        	state = parse_config(config)
        }else{
        	var state = config
        }

        var result = Kin.inverse_kinematics(xyz, J5_direction, state, base_xyz, base_plane, P0)
        return result[2]
    }
	

	//Public
    //Wrapper function for forward kinematics
    this.J_angles_to_xyz = function(joint_angles, base_xyz = [0, 0, 0], base_plane = [0, 0, 1], base_rotation = 0){
        //var temp_angles = Convert.degrees_to_arcseconds(joint_angles)
        var P0 = Kin.base_rotation_to_plane(base_rotation, base_plane)
        var temp_angles = Convert.deep_copy(joint_angles)
        let result = Kin.forward_kinematics(temp_angles, base_xyz, base_plane, P0)
        return result[0]
    }
    
    
    this.J_angles_to_coor = function(joint_angles, L0_pose){
    	//let L0, L1, L2, L3, L4, L5
        //var L0, L1, L2, L3, L4, L5
        if(Object.isNewObject(L0_pose)){
            L0 = L0_pose
            //L0.name = undefined
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
        //return [L0, L1, L2, L3, L4, L5] //this crashes DDE
        //return null
    }
    /*
    debugger
    var my_poses = Kin.J_angles_to_coor([162000, 0, 0, 0, 162000], Table)
    [L1]
    */
    
    this.set_Dexter_coor = function(poses){
    	
        L0.set_pose(poses[0], Table)
        L1.set_pose(poses[1], Table)
        L2.set_pose(poses[2], Table)
        L3.set_pose(poses[3], Table)
        L4.set_pose(poses[4], Table)
        L5.set_pose(poses[5], Table)
		
        return null
    }
    /*
    debugger
    var my_poses = Kin.J_angles_to_coor([162000, 0, 0, 0, 162000], Table)
    Kin.set_Dexter_coor(my_poses)
    out(L0)
    [L1]
    */
    
    this.three_positions_to_pose = function(J_angles_1, J_angles_2, J_angles_3){
    	let points_A, points_B, points_C, UA5, UA4, UB5, UB4, UC5, UC4, U5_ave, U4_ave, U45
        let point, x_vector, y_vector, z_vector, pose, angleA, angleB, angleC, vector_1, vector_2
        
        points_A = Kin.J_angles_to_xyz(J_angles_1)
        points_B = Kin.J_angles_to_xyz(J_angles_2)
        points_C = Kin.J_angles_to_xyz(J_angles_3)
        
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
    debugger
    var result = Kin.three_positions_to_pose([0, 0, 0, 0, 0], [0, 0, 0, 162000, 0], [0, 0, 0, 0, 162000])
    Vector.round(result, 0)
    Convert.degrees_to_arcseconds(360)
    */
    
    
    this.J_angles_L5_Direction = function(joint_angles, base_xyz = [0, 0, 0], base_plane = [0, 0, 1], base_rotation = 0){
    	let J_points = Kin.J_angles_to_xyz(joint_angles, base_xyz, base_plane, base_rotation)
        return Vector.normalize(Vector.subtract(J_points[5], J_points[4]))
    }
    //J_angles_J5_Direction([0, 0, 0, 0, 0])
    // Kin.J_angles_to_xyz([0, 0, 0, 0, 0])
    
    
    
    
    //Public
    //Wrapper function for inverse kinematics
    //Returns joint angles
    this.xyz_check = function(xyz, J5_direction = [0, 0, -1], config = "right_up_out", base_xyz = [0, 0, 0], base_plane = [0, 0, 1], base_rotation = 0){
        var P0 = Kin.base_rotation_to_plane(base_rotation, base_plane)
        
        if(typeof(config) === "string"){
        	state = parse_config(config)
        }else{
        	var state = config
        }
		
        
        let ir_result = Kin.is_in_reach(xyz, J5_direction, base_xyz, base_plane)
        if(ir_result !== true){
        	return ir_result
        }
        
        var ik_result = Kin.inverse_kinematics(xyz, J5_direction, state, base_xyz, base_plane, P0)
        var table_result = Kin.table_intersection(ik_result[1])
        if (table_result !== false){
        	let intersection_strn = "Joint"
            
            switch (table_result.length){
            	case 1:
                	intersection_strn += table_result[0][0] + " is below the base plane by " 
                    + Vector.round(Convert.microns_to_mms(table_result[0][1]), 3) + " mm."
                break
                case 2:
                	intersection_strn += table_result[0][0] + " and Joint" + table_result[1][0] + " are below the base plane by " 
                    + Vector.round(Convert.microns_to_mms(table_result[0][1]), 3) + "mm and " 
                    + Vector.round(Convert.microns_to_mms(table_result[1][1]), 3) + "mm, respectively "
                break
                case 3:
                	intersection_strn += table_result[0][0] + ", Joint" + table_result[1][0] + ", and Joint" + table_result[2][0] + " are below the base plane by " 
                    + Vector.round(Convert.microns_to_mms(table_result[0][1]), 3) + "mm, " 
                    + Vector.round(Convert.microns_to_mms(table_result[1][1]), 3) + "mm, and " 
                    + Vector.round(Convert.microns_to_mms(table_result[2][1]), 3) + "mm, respectively "
                break
                case 4:
                	intersection_strn += table_result[0][0] + ", Joint" + table_result[1][0] 
                    + ", Joint" + table_result[2][0] + ", and Joint" + table_result[3][0] + " are below the base plane by " 
                    + Vector.round(Convert.microns_to_mms(table_result[0][1]), 3) + "mm, " 
                    + Vector.round(Convert.microns_to_mms(table_result[1][1]), 3) + "mm, " 
                    + Vector.round(Convert.microns_to_mms(table_result[2][1]), 3) + "mm, and " 
                    + Vector.round(Convert.microns_to_mms(table_result[3][1]), 3) + "mm, respectively "
                break
                default:
            }
            //out(intersection_strn)
        	return false //
        }
        
        return true
    }
}

new TestSuite("Inverse to Forward Kinematics and Back",
    ["var point_1 = [100000, 200000, 300000]"],
	["var myJangles = Kin.xyz_to_J_angles(point_1, [0, 1, -1], Dexter.RIGHT_DOWN_OUT, [0, 0, 500000], [0, 0, -1], 45)"],
	["var myPoints = Kin.J_angles_to_xyz(myJangles, [0, 0, 500000], [0, 0, -1], 45)"],
    ["myPoints[5]"],
	["point_1"]
)

new TestSuite("Checking xyz",
    ["Kin.xyz_check([500000, 0, 500000])", "true"],
    ["Kin.xyz_check([500000, 0, -500000])", "false"],
    ["Kin.xyz_check([5000000, 0, 0])", "false"],
    ["Kin.check_J_ranges([0, 0, 0, 0, 0])", "true"],
    ["Kin.check_J_ranges([0, 0, 0, 648000, 0])", "false"],
    ["Kin.gravity_torques([0, 0, 0, 0, 0])", "[[0, -0.20238473937499996, -0.20238473937499996, -0.20238473937499996, 0], [ [-202384.73937499998, 4.956996465437301e-11, 0], [-202384.73937499998, 4.956996465437301e-11, 0], [-202384.73937499998, 4.956996465437301e-11, 0], [-202384.73937499998, 4.956996465437301e-11, 0], [-202384.73937499998, 4.956996465437301e-11, 0]], [ [0, 0, 0], [0, 0, 165100], [0, 0, 485775], [0, 0, 815975], [0, 0, 866775], [2.02189186539228e-11, 82550, 866775]], [[0, 0, 1], [1, 0, 0], [1, 0, 0], [1, 0, 0], [0, 0, 1]]]"],
	["Kin.gravity_torques([0, 324000, 0, 0, 0])", "[ [ 0, -6.507491903675, -3.3627149949749997, -0.124549358325, 2.47849823271865e-17], [ [-6507491.903675, 8.217228953584769e-10, 0], [-6507491.903675, 8.217228953584769e-10, 0], [-3362714.9949749997, 4.3659879783128066e-10, 0], [-124549.35832500001, 4.00378796280433e-11, 0], [-2.47849823271865e-11, 2.4784982327186504e-11, 0]], [ [0, 0, 0], [0, 0, 165100], [3.927136123165775e-11, 320675, 165100.00000000003], [7.970919853950334e-11, 650875, 165100.00000000006], [8.59304042791719e-11, 701675, 165100.00000000006], [9.60398636061333e-11, 701675, 82550.00000000006]], [ [0, 0, 1], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1.2246467991473532e-16, 1, 6.123233995736766e-17]]]"]
)