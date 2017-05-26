//DXF class
//James Wigglesworth
//Started: 2_10_2017
//Updated: 3_12_2017


var DXF = new function(){
	
    this.content_to_entities = function(content){
    	let parser = new DxfParser()
        return parser.parseSync(content).entities
    }
    
    this.entities_to_points = function(dxf_entities){
    	let ent, a, b
        let points = []
    	for(let i = 0; i < dxf_entities.length; i++){
            	ent = dxf_entities[i]
            	if (ent.type == "LINE"){
                	a = point_object_to_array(ent.vertices[0])
               		b = point_object_to_array(ent.vertices[1])
                	points.push(a)
                    points.push(b)
                }
            }//end for
        return points
 	}
	
    this.edit = function(points, shift = [0, 0, 0], scale_factor = 1){
        
        let dim = Vector.matrix_dimensions(points)
        let result = points
        for(let i = 0; i < dim[0]; i++){
        	result[i] = Vector.add(shift, points[i])
        }
        return Vector.multiply(scale_factor, result)
    }
    
    this.points_to_path = function(points, lift_height){
    	let path = []
        let Ua, Ub, Ub_old
        let dim = Vector.matrix_dimensions(points)
        path.push(Vector.add(points[0], [0, 0, lift_height]))
        path.push(points[0])
        path.push(points[1])
        let rapid = [1, 1, 0]
        Ub_old = points[1]
        for(let i = 3; i < dim[0]; i+=2){
        	Ua = points[i-1]
            Ub = points[i]
            if(!Vector.is_equal(Ua, Ub_old, 10)){
            	path.push(Vector.add(Ub_old, [0, 0, lift_height]))
                path.push(Vector.add(Ua, [0, 0, lift_height]))
                path.push(Ua)
                rapid.push(1)
                rapid.push(1)
                rapid.push(1)
            }
            path.push(Ub)
            rapid.push(0)
            Ub_old = Ub
        }
        path.push(Vector.add(Ub, [0, 0, lift_height]))
        rapid.push(1)
        return [path, rapid]
    }
    
    this.move_path_to_coor = function(path, destination_coordinate_system){
    	return Coor.move_points_to_coor(path, destination_coordinate_system)
    }
    
    this.auto_fit = function(dxf_points, J_angles_1, J_angles_2, J_angles_3){
		let points_A, points_B, points_C, UA5, UA4, UB5, UB4, UC5, UC4, U5_ave, U4_ave, U45
    	let point, x_vector, y_vector, z_vector, pose, angleA, angleB, angleC, vector_1, vector_2, x_length, y_length, y_dist_1, y_dist_2
        
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
            	y_dist_1 = Vector.distance(UC5, point, UB5)
            	y_dist_2 = Vector.distance(UB5, point, UC5)
            	break
                
        	case angleB:
            	point = UB5
            	vector_1 = Vector.subtract(UA5, UB5)
            	vector_2 = Vector.subtract(UC5, UB5)
            	y_dist_1 = Vector.distance(UC5, point, UA5)
            	y_dist_2 = Vector.distance(UA5, point, UC5)
            	break
                
        	case angleC:
            	point = UC5
            	vector_1 = Vector.subtract(UB5, UC5)
            	vector_2 = Vector.subtract(UA5, UC5)
            	y_dist_1 = Vector.distance(UA5, point, UB5)
            	y_dist_2 = Vector.distance(UB5, point, UA5)
            	break
    	}
        
    	if(0 < Vector.dot(Vector.cross(vector_1, vector_2), U45)){
    		x_length = Vector.magnitude(vector_1)
        	x_vector = Vector.normalize(vector_1)
        	y_length = y_dist_1
    	}else{
    		x_length = Vector.magnitude(vector_2)
        	x_vector = Vector.normalize(vector_2)
        	y_length = y_dist_2
    	}
        
    	let upper = Vector.max(dxf_points)
    	let lower = Vector.min(dxf_points)
    	let diff = Vector.subtract(upper, lower)
    	let shift = Vector.multiply(-1, lower)
    	let width = Math.abs(diff[0])
    	let height = Math.abs(diff[1])
    
    	let scale_factor_1 = x_length / width
    	let scale_factor_2 = y_length / height
    
    	return [shift, Math.min(scale_factor_1, scale_factor_2)]
	}
    
    /*
    this.text_fit_top_left = function(dxf_points, J_angles_1, J_angles_2, J_angles_3, scale = 1){
		let points_A, points_B, points_C, UA5, UA4, UB5, UB4, UC5, UC4, U5_ave, U4_ave, U45
    	let point, x_vector, y_vector, z_vector, pose, angleA, angleB, angleC, vector_1, vector_2, x_length, y_length, y_dist_1, y_dist_2
        
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
            	y_dist_1 = Vector.distance(UC5, point, UB5)
            	y_dist_2 = Vector.distance(UB5, point, UC5)
            	break
                
        	case angleB:
            	point = UB5
            	vector_1 = Vector.subtract(UA5, UB5)
            	vector_2 = Vector.subtract(UC5, UB5)
            	y_dist_1 = Vector.distance(UC5, point, UA5)
            	y_dist_2 = Vector.distance(UA5, point, UC5)
            	break
                
        	case angleC:
            	point = UC5
            	vector_1 = Vector.subtract(UB5, UC5)
            	vector_2 = Vector.subtract(UA5, UC5)
            	y_dist_1 = Vector.distance(UA5, point, UB5)
            	y_dist_2 = Vector.distance(UB5, point, UA5)
            	break
    	}
        
    	if(0 < Vector.dot(Vector.cross(vector_1, vector_2), U45)){
    		x_length = Vector.magnitude(vector_1)
        	x_vector = Vector.normalize(vector_1)
        	y_length = y_dist_1
    	}else{
    		x_length = Vector.magnitude(vector_2)
        	x_vector = Vector.normalize(vector_2)
        	y_length = y_dist_2
    	}
        
    	let upper = Vector.max(dxf_points)
    	let lower = Vector.min(dxf_points)
    	let diff = Vector.subtract(upper, lower)
        let shift = 
    	let shift = y_length - 1.1*scale
    	let width = Math.abs(diff[0])
    	let height = Math.abs(diff[1])
    
    	let scale_factor_1 = x_length / width
    	let scale_factor_2 = y_length / height
    
    	return [shift, scale]
	}
    
    
    this.draw_dxf_on_plane = function(dxf_content = Hello_World_DXF, J_angles){
		let lift_height = 25000
    	let low_speed = 60000
    	let high_speed = 130000
    	let J_angles_1 = J_angles[0]
    	let J_angles_2 = J_angles[1]
    	let J_angles_3 = J_angles[2]
    
    
    	let my_pose = Kin.three_positions_to_pose(J_angles_1, J_angles_2, J_angles_3)
    	let J5_dir = Vector.multiply(-1, Vector.pull(my_pose, [0, 2], 2))
    	var white_board = Table.create_child(my_pose, "white_board")
    	let my_entities = DXF.content_to_entities(dxf_content)
    	let my_points = DXF.entities_to_points(my_entities)
    	let my_edit = DXF.auto_fit(my_points, J_angles_1, J_angles_2, J_angles_3)
    	my_points = DXF.edit(my_points, my_edit[0], my_edit[1])
    	let my_path = DXF.points_to_path(my_points, lift_height)
    	let path_points = my_path[0]
    	let rapid = my_path[1]
    	path_points = Coor.move_points_to_coor(path_points, white_board)
    	let dim = Vector.matrix_dimensions(path_points)
    	let movCMD = []
    
    	let temp_mov
    	movCMD.push(Dexter.move_to(path_points[0], J5_dir))
    	for(let i = 1; i < dim[0]; i++){
    		if(rapid[i] == 0){
        		temp_mov = move_straight_to(path_points[i-1], path_points[i], 500, J5_dir)
            	for(let j = 0; j < temp_mov.length; j++){
            		movCMD.push(temp_mov[j])
            	}
        	}else{
            	temp_mov = move_straight_to(path_points[i-1], path_points[i], 200000, J5_dir)
            	for(let j = 0; j < temp_mov.length; j++){
            		movCMD.push(temp_mov[j])
            	}
        	}
    	}
    	return movCMD
	}*/
}
