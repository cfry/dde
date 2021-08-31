//DXF class
//James Wigglesworth
//Started: 2_10_2017
//Updated: 1_26_19
import {txt}       from "./txt.js"
import {DxfParser} from "./dxf-parser.js"
import {setKeepPosition, setOpenLoop} from "./Dexter_Modes.js"
//import {Coor}      from "./Coor.js"   //now global
//import {Vector}    from "./Vector.js" //now global
//import {Kin}       from "./Kin.js"    //now global

import {point_object_to_array, scale_point} from "../core/utils.js"
import {read_file} from "../core/storage.js"
//import {Instruction, make_ins} from "../core/instruction.js"
//import {Dexter}    from "../core/robot.js"
//import {Job}       from "../core/job.js"


var DXF = new function() {
	
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
                }else if (ent.type == "POLYLINE"){
                	a = point_object_to_array(ent.vertices[0])
               		b = point_object_to_array(ent.vertices[1])
                	points.push(a)
                    points.push(b)
                }else if (ent.type == "LWPOLYLINE"){
                	let v_array = ent.vertices
                    points.push([v_array[0].x, v_array[0].y, v_array[0].z])
                    for(let j = 1; j < v_array.length-1; j++){
                    	points.push([v_array[j].x, v_array[j].y, v_array[j].z])
                        points.push([v_array[j].x, v_array[j].y, v_array[j].z])
                    }
                    points.push([v_array[v_array.length-1].x, v_array[v_array.length-1].y, v_array[v_array.length-1].z])
                }else{
                	warning("Entity of type " + ent.type + " is not currently supported.")
                }
                
            }//end for
            
        out(points)
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
    
	this.fill_DXF = function(filename, scale, theta, tool_diameter = 5000, overlap_ratio = .1, toggle_fill = false, J_angles){
		let dxf_content = read_file(filename)
		let my_entities = DXF.content_to_entities(dxf_content)
		let perimeter_points = DXF.entities_to_points(my_entities)
    	perimeter_points = scale_points(perimeter_points, scale, J_angles)
    
		let perimeter = points_to_object(perimeter_points)
		perimeter.points = Vector.matrix_multiply(perimeter.points, z_rotate_matrix(-theta))

		let fill = fill_perimeter(perimeter, tool_diameter, overlap_ratio, toggle_fill)
		perimeter.points = Vector.matrix_multiply(perimeter.points, z_rotate_matrix(theta))
		fill.points = Vector.matrix_multiply(fill.points, z_rotate_matrix(theta))
    
    	return fill
	}

	this.points_to_object = function(point_array){
		let dim = Vector.matrix_dimensions(point_array)
    	let unique_points = []
    	let lines_seg = []
    	let connectivity = []
    	let elt, dimu, diml
    	for(let i = 0; i < dim[0]; i++){
    		elt = point_array[i]
        	dimu = Vector.matrix_dimensions(unique_points)
        	match_flag = 0
        	for(let j = 0; j < dimu[0]; j++){
        		if(Vector.is_equal(elt, unique_points[j])){
            		match_flag = 1
                	break
            	}
        	}
        	if(match_flag == 0){
        		unique_points.push(elt)
        	}
    	}
    	dimu = Vector.matrix_dimensions(unique_points)
    	for(let i = 0; i < dim[0]; i += 2){
    		lines_seg.push([point_array[i][0], point_array[i][1], point_array[i][2],
                        	point_array[i+1][0], point_array[i+1][1], point_array[i+1][2]])
    	}
    
    	diml = Vector.matrix_dimensions(lines_seg)
        if(diml[0] ==0){
        	dde_error("The DXF appears to be empty. </br> Only regular line segments are currently supported. <br/>Polylines, circle, splines etc. are ignored.")
        }
    	connectivity = Vector.make_matrix(diml[0], 2)
    	for(let i = 0; i < diml[0]; i++){
    		for(let j = 0; j < 2; j++){
        		elt = [lines_seg[i][0+3*j], lines_seg[i][1+3*j], lines_seg[i][2+3*j]]
            	for(let k = 0; k < dimu[0]; k++){
            		unique_points[k]
                	if(Vector.is_equal(elt, unique_points[k])){
                		connectivity[i][j] = k
                    	break
            		}
            	}
        	}
    	}
    	let result = {points: unique_points, lines: connectivity}
    	return result
	}

	this.object_to_points = function(object){
		object.points
    	object.lines
    	let points = []
    	for(let i = 0; i < object.lines.length; i++){
    		for(let j = 0; j < 2; j++){
        		points.push(object.points[object.lines[i][j]])
        	}
    	}
    	return points
	}


	this.find_intersections = function(object, point_1, point_2){
		let U2a, U2b, A, B, C, alpha, beta, int_point
    	let U1b = point_1
    	let U1a = point_2
		let dim = Vector.matrix_dimensions(object.lines)
    	let int_points = []
    	let int_alphas = []
    	let int_betas = []
    	let int_idx = []
    	let result = []
    	for(let i = 0; i < dim[0]; i++){
    		U2b = object.points[object.lines[i][0]]
        	U2a = object.points[object.lines[i][1]]
        
        	A = (U2b[0]-U1b[0])/(U1a[0]-U1b[0]);
        	B = ((U2a[0]-U2b[0])*(U1b[1]-U2b[1]))/((U1a[0]-U1b[0])*(U2a[1]-U2b[1]));
        	C = ((U2a[0]-U2b[0])*(U1a[1]-U1b[1]))/((U1a[0]-U1b[0])*(U2a[1]-U2b[1]));
        	alpha = (A+B)/(1-C);
        	beta = (U1b[1]-U2b[1]+(U1a[1]-U1b[1])*alpha)/(U2a[1]-U2b[1]);
			if(((0 <= alpha) && (alpha <= 1)) && ((0 <= beta) && (beta <= 1))){
        		int_point = Vector.add(U2b, Vector.multiply(beta, Vector.subtract(U2a, U2b)))
        		result.push({point: int_point, alpha: alpha, beta: beta, idx: i})
        	}
    	}
    	return result
	}

	this.connect_fill = function(fill_obj, perimeter_obj, tool_diameter){
		let perim = perimeter_obj
    	let fill = fill_obj
    	let line_list = Vector.deep_copy(fill_obj.lines)
    	let perim_idxs_list = Vector.deep_copy(fill_obj.perim_idxs)
    	let fill_idxs_list = Vector.deep_copy(fill_obj.fill_idxs)
    	let new_lines = []
    	let new_perim_idxs = []
    	let new_fill_idxs = []
    	let end_point_idx, perim_line_idx, fill_line_idx, start_point_idx
    	let result = {lines: [], points: []}
    
    	new_lines.push(line_list.shift())
    	new_perim_idxs.push(perim_idxs_list.shift())
    	new_fill_idxs.push(fill_idxs_list.shift())
    	//debugger
    	while(line_list.length != 0){
    		end_point_idx = new_lines[new_lines.length-1][1]
    		perim_line_idx = perim_idxs_list[line_list.length-1][1] //this is wyere  eerror
			fill_line_idx = fill_idxs_list[line_list.length-1]
        	for(let i = 0; i < line_list.length; i++){
        	
    			if(perim_idxs_list[i][0] == perim_line_idx && fill_idxs_list[i] == fill_line_idx+1){
            		start_point_idx = line_list[i][0]
            		new_lines.push([end_point_idx, start_point_idx])
                	new_lines.push(line_list.splice(i, 1)[0])
                	new_perim_idxs.push(perim_idxs_list.splice(i, 1)[0])
                	new_fill_idxs.push(fill_idxs_list.splice(i, 1)[0])
                	break
            	}
            
            	if(i == line_list.length-1){
            		new_lines.push(line_list.splice(i, 1)[0])
                	new_perim_idxs.push(perim_idxs_list.splice(i, 1)[0])
                	new_fill_idxs.push(fill_idxs_list.splice(i, 1)[0])
            	}
    		}
    	}
    	result.points = fill.points
    	result.lines = new_lines
    	return result
	}

	this.rotate_2D_matrix = function(theta){
		let theta_radians = theta*Math.PI/180
		let c = Math.cos(theta_radians)
		let s = Math.sin(theta_radians)
    	let result = [[ c, s, 0],
                  	  [-s, c, 0],
          		  	  [ 0, 0, 1]]
		return result
		/*
    	//shear transformation matrix I wrote by accident
		let theta_radians = theta*Math.PI/180
		let m = Math.cos(theta_radians)
    	let m2 = m*m
		let n = Math.sin(theta_radians)
    	let n2 = n*n
		let result = [[  m2,  n2,  2*n*m],
                  	  [  n2,  m2, -2*n*m],
          		  	  [-n*m, n*m,  m2-n2]]
    	return result
    	*/
	}


	this.fill_perimeter = function(perimeter_obj, tool_diameter, overlap_ratio = .1, toggle_fill = false){
		let perim = perimeter_obj
    	let dim = Vector.matrix_dimensions(perim.points)
    	let upper_lim = Vector.max(perim.points)
    	let lower_lim = Vector.min(perim.points)
    	let R = tool_diameter/2
    	let U1p, U2p, U1f, U2f, y, int, fill_points = [], int_points, int_alphas, int_idxs, sorted_int
    	let U1, U2, U21, v21p_perp, v21p, proj, v21
    	let dim_int
    	let fill = {points: [], lines: [], fill_idxs: [], perim_idxs: []}
    	y = lower_lim[1]+R
    	let t=0
    	let direction = 1
    	let fill_idx = 0
    	//draws and trims lines over perimeter
    	while(y < upper_lim[1]) { 
    		if(direction == 1){
    			U1f = [lower_lim[0]-R, y, 0]
    			U2f = [upper_lim[0]+R, y, 0]
            	direction = 0
        	}else{
        		U2f = [lower_lim[0]-R, y, 0]
    			U1f = [upper_lim[0]+R, y, 0]
            	direction = 1
        	}
    		int = find_intersections(perim, U1f, U2f)
        	int.sort(function(a, b){return a.alpha-b.alpha}) //sorts based on alphas from smallest to largest

			for(let i = 0; i < int.length; i+=2){
        		//debugger
            	/*
            	if(t > 1 && int[i].idx == fill.idxs[fill.idxs.length-1][1]){ //if connected to the same perimeter line
            		fill.idxs.push(int[i].idx, int[i+1].idx)
            		fill.lines.push([t-1, t])
            		//t+=2
            	}
            	*/
            	//debugger
            	U1 = int[i].point
            	U2 = int[i+1].point
            
        		fill.points.push(U1, U2)
            	//fill.points.push(int[i].point, int[i+1].point)
            	fill.fill_idxs.push(fill_idx)
            	fill.perim_idxs.push([int[i].idx, int[i+1].idx])
            	fill.lines.push([t, t+1])
            	t+=2
        	}
        	fill_idx++
    		y += R * (1-overlap_ratio)
    	}
    	return fill
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


    
    
    
    
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////    
// DXF Drawing
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//James Wigglesworth
//Started 6_1_17
//Updated 9_19_17


////////////////////////////////////////////////////////////////////////////
//DXF drawing utility functions
////////////////////////////////////////////////////////////////////////////

function get_bounds_from_three_positions(J_angles_1, J_angles_2, J_angles_3){
	let points_A, points_B, points_C, UA5, UA4, UB5, UB4, UC5, UC4, U5_ave, U4_ave, U45
    let point, x_vector, y_vector, z_vector, pose, angleA, angleB, angleC, vector_1, vector_2, x_length, y_length, y_dist_1, y_dist_2
    
    points_A = Kin.forward_kinematics(J_angles_1)[0]
    points_B = Kin.forward_kinematics(J_angles_2)[0]
    points_C = Kin.forward_kinematics(J_angles_3)[0]
        
    UA5 = points_A[5]
    UA4 = points_A[4]
    UB5 = points_B[5]
    UB4 = points_B[4]
    UC5 = points_C[5]
    UC4 = points_C[4]
        
    U5_ave = Vector.average([UA5, UB5, UC5])
    U4_ave = Vector.average([UA4, UB4, UC4])
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
        
    if(Vector.dot(Vector.cross(vector_1, vector_2), U45) > 0){
    	x_length = Vector.magnitude(vector_1)
        x_vector = Vector.normalize(vector_1)
        y_length = y_dist_1
    }else{
    	x_length = Vector.magnitude(vector_2)
        x_vector = Vector.normalize(vector_2)
        y_length = y_dist_2
    }
    
    return [x_length, y_length]
}

function move_straight_to(xyz_1, xyz_2, resolution, J5_direction, config, base_xyz, base_plane, base_rotation){
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
    let Ui
    for(let i = 0; i < div+1; i++){
    	Ui = Vector.add(U1, Vector.multiply(i*step, v21))
        movCMD.push(Dexter.move_to(Ui, J5_direction, config, base_xyz, base_plane, base_rotation))
    }
	return movCMD
}

function move_straight(tool_speed, xyz_1, xyz_2, resolution, J5_direction, config, base_xyz, base_plane, base_rotation){
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
    let old_J_angles = Kin.xyz_to_J_angles(U1, J5_direction, config, base_xyz, base_plane, base_rotation)
    for(let i = 1; i < div+1; i++){
    	Ui = Vector.add(U1, Vector.multiply(i*step, v21))
        new_J_angles = Kin.xyz_to_J_angles(Ui, J5_direction, config, base_xyz, base_plane, base_rotation)
        angular_velocity = Kin.tip_speed_to_angle_speed(old_J_angles, new_J_angles, tool_speed)
        old_J_angles = new_J_angles
        movCMD.push(make_ins("S", "MaxSpeed", angular_velocity))
    	movCMD.push(make_ins("S", "StartSpeed", angular_velocity))
        movCMD.push(Dexter.move_to(Ui, J5_direction, config, base_xyz, base_plane, base_rotation))
    }
	return movCMD
}


function PID_move_to(xyz, J5_direction, config, base_xyz, base_plane, base_rotation){
    let CMD = []
    let Angles = Kin.xyz_to_J_angles(xyz, J5_direction, config, base_xyz, base_plane, base_rotation)
    CMD.push(make_ins("P", Angles))
    CMD.push(Dexter.sleep(.01))
    return CMD
}

function my_settings(speed = 20){
	/*
    Dexter.LINK1 = .165100
    Dexter.LINK2 = .327025 
    Dexter.LINK3 = .295425 
    Dexter.LINK4 = tool_height
    Dexter.LINK5 = tool_length
    */
    
	return [
    make_ins("S", "MaxSpeed", speed),
    make_ins("S", "StartSpeed", .5),
    make_ins("S", "Acceleration", 0.000129),
    make_ins("S", "J1BoundryHigh",670000*_arcsec),
    make_ins("S", "J1BoundryLow",-670000*_arcsec),
    make_ins("S", "J2BoundryHigh",330000*_arcsec),
    make_ins("S", "J2BoundryLow",-330000*_arcsec),
    make_ins("S", "J3BoundryHigh",600000*_arcsec),
    make_ins("S", "J3BoundryLow",-600000*_arcsec),
    make_ins("S", "J4BoundryHigh",390000*_arcsec),
    make_ins("S", "J4BoundryLow",-390000*_arcsec),
    make_ins("S", "J5BoundryHigh",680000*_arcsec),
    make_ins("S", "J5BoundryLow",-680000*_arcsec)
    ]
}

function scale_points(points, scale, J_angles){
	let my_edit = [[0,0,0], 1]
    if(typeof(scale) == "number"){
    	my_edit[1] = scale
    }else{
    	switch(scale){
    		case undefined:
            	my_edit = DXF.auto_fit(points, J_angles[0], J_angles[1], J_angles[2])
            	break
            case "fit": 
        		my_edit = DXF.auto_fit(points, J_angles[0], J_angles[1], J_angles[2])
            	break
        	case "micron": 
        		my_edit[1] = _um
            	break
        	case "mm": 
        		my_edit[1] = _mm
            	break
        	case "cm": 
        		my_edit[1] = _cm
            	break
        	case "in": 
        		my_edit[1] = _in
            	break
        	default:
        		dde_error("Units of " + units +  " are not supported")
    	}
    }
    return DXF.edit(points, my_edit[0], my_edit[1])
}










////////////////////////////////////////
//Fill DXF code
////////////////////////////////////////
function fill_DXF(filename, scale, theta, tool_diameter = 5000, overlap_ratio = .1, toggle_fill = false, J_angles){
	let dxf_content = read_file(filename)
	let my_entities = DXF.content_to_entities(dxf_content)
	let perimeter_points = DXF.entities_to_points(my_entities)
    perimeter_points = scale_points(perimeter_points, scale, J_angles)
    
	let perimeter = points_to_object(perimeter_points)
	perimeter.points = Vector.matrix_multiply(perimeter.points, z_rotate_matrix(-theta))

	let fill = fill_perimeter(perimeter, tool_diameter, overlap_ratio, toggle_fill)
	perimeter.points = Vector.matrix_multiply(perimeter.points, z_rotate_matrix(theta))
	fill.points = Vector.matrix_multiply(fill.points, z_rotate_matrix(theta))
    
    return fill
}

function points_to_object(point_array){
	let dim = Vector.matrix_dimensions(point_array)
    let unique_points = []
    let lines_seg = []
    let connectivity = []
    let elt, dimu, diml
    for(let i = 0; i < dim[0]; i++){
    	elt = point_array[i]
        dimu = Vector.matrix_dimensions(unique_points)
        match_flag = 0
        for(let j = 0; j < dimu[0]; j++){
        	if(Vector.is_equal(elt, unique_points[j])){
            	match_flag = 1
                break
            }
        }
        if(match_flag == 0){
        	unique_points.push(elt)
        }
    }
    dimu = Vector.matrix_dimensions(unique_points)
    for(let i = 0; i < dim[0]; i += 2){
    	lines_seg.push([point_array[i][0], point_array[i][1], point_array[i][2],
                        point_array[i+1][0], point_array[i+1][1], point_array[i+1][2]])
    }
    
    diml = Vector.matrix_dimensions(lines_seg)
    connectivity = Vector.make_matrix(diml[0], 2)
    for(let i = 0; i < diml[0]; i++){
    	for(let j = 0; j < 2; j++){
        	elt = [lines_seg[i][0+3*j], lines_seg[i][1+3*j], lines_seg[i][2+3*j]]
            for(let k = 0; k < dimu[0]; k++){
            	unique_points[k]
                if(Vector.is_equal(elt, unique_points[k])){
                	connectivity[i][j] = k
                    break
            	}
            }
        }
    }
    let result = {points: unique_points, lines: connectivity}
    return result
}

function object_to_points(object){
	object.points
    object.lines
    let points = []
    for(let i = 0; i < object.lines.length; i++){
    	for(let j = 0; j < 2; j++){
        	points.push(object.points[object.lines[i][j]])
        }
    }
    return points
}


function find_intersections(object, point_1, point_2){
	let U2a, U2b, A, B, C, alpha, beta, int_point
    let U1b = point_1
    let U1a = point_2
	let dim = Vector.matrix_dimensions(object.lines)
    let int_points = []
    let int_alphas = []
    let int_betas = []
    let int_idx = []
    let result = []
    for(let i = 0; i < dim[0]; i++){
    	U2b = object.points[object.lines[i][0]]
        U2a = object.points[object.lines[i][1]]
        
        A = (U2b[0]-U1b[0])/(U1a[0]-U1b[0]);
        B = ((U2a[0]-U2b[0])*(U1b[1]-U2b[1]))/((U1a[0]-U1b[0])*(U2a[1]-U2b[1]));
        C = ((U2a[0]-U2b[0])*(U1a[1]-U1b[1]))/((U1a[0]-U1b[0])*(U2a[1]-U2b[1]));
        alpha = (A+B)/(1-C);
        beta = (U1b[1]-U2b[1]+(U1a[1]-U1b[1])*alpha)/(U2a[1]-U2b[1]);
		if(((0 <= alpha) && (alpha <= 1)) && ((0 <= beta) && (beta <= 1))){
        	int_point = Vector.add(U2b, Vector.multiply(beta, Vector.subtract(U2a, U2b)))
        	result.push({point: int_point, alpha: alpha, beta: beta, idx: i})
        }
    }
    return result
}

function connect_fill(fill_obj, perimeter_obj, tool_diameter){
	let perim = perimeter_obj
    let fill = fill_obj
    let line_list = Vector.deep_copy(fill_obj.lines)
    let perim_idxs_list = Vector.deep_copy(fill_obj.perim_idxs)
    let fill_idxs_list = Vector.deep_copy(fill_obj.fill_idxs)
    let new_lines = []
    let new_perim_idxs = []
    let new_fill_idxs = []
    let end_point_idx, perim_line_idx, fill_line_idx, start_point_idx
    let result = {lines: [], points: []}
    
    new_lines.push(line_list.shift())
    new_perim_idxs.push(perim_idxs_list.shift())
    new_fill_idxs.push(fill_idxs_list.shift())
    while(line_list.length != 0){
    	end_point_idx = new_lines[new_lines.length-1][1]
    	perim_line_idx = perim_idxs_list[line_list.length-1][1] //this is wyere  eerror
		fill_line_idx = fill_idxs_list[line_list.length-1]
        for(let i = 0; i < line_list.length; i++){
        	
    		if(perim_idxs_list[i][0] == perim_line_idx && fill_idxs_list[i] == fill_line_idx+1){
            	start_point_idx = line_list[i][0]
            	new_lines.push([end_point_idx, start_point_idx])
                new_lines.push(line_list.splice(i, 1)[0])
                new_perim_idxs.push(perim_idxs_list.splice(i, 1)[0])
                new_fill_idxs.push(fill_idxs_list.splice(i, 1)[0])
                break
            }
            
            if(i == line_list.length-1){
            	new_lines.push(line_list.splice(i, 1)[0])
                new_perim_idxs.push(perim_idxs_list.splice(i, 1)[0])
                new_fill_idxs.push(fill_idxs_list.splice(i, 1)[0])
            }
    	}
    }
    result.points = fill.points
    result.lines = new_lines
    return result
    
}


function z_rotate_matrix(theta){
	let c = cosd(theta)
	let s = sind(theta)
    let result = [[c, s,  0],
                  [-s,  c,  0],
          		  [0,  0,  1]]
	return result
	/*
    //shear transformation matrix I wrote by accident
	let theta_radians = theta*Math.PI/180
	let m = Math.cos(theta_radians)
    let m2 = m*m
	let n = Math.sin(theta_radians)
    let n2 = n*n
	let result = [[  m2,  n2,  2*n*m],
                  [  n2,  m2, -2*n*m],
          		  [-n*m, n*m,  m2-n2]]
    return result
    */
}


function fill_perimeter(perimeter_obj, tool_diameter, overlap_ratio = .1, toggle_fill = false){
	let perim = perimeter_obj
    let dim = Vector.matrix_dimensions(perim.points)
    let upper_lim = Vector.max(perim.points)
    let lower_lim = Vector.min(perim.points)
    let R = tool_diameter/2
    let U1p, U2p, U1f, U2f, y, int, fill_points = [], int_points, int_alphas, int_idxs, sorted_int
    let U1, U2, U21, v21p_perp, v21p, proj, v21
    let dim_int
    let fill = {points: [], lines: [], fill_idxs: [], perim_idxs: []}
    y = lower_lim[1]+R
    let t=0
    let direction = 1
    let fill_idx = 0
    //draws and trims lines over perimeter
    while(y < upper_lim[1]) { 
    	if(direction == 1){
    		U1f = [lower_lim[0]-R, y, 0]
    		U2f = [upper_lim[0]+R, y, 0]
            direction = 0
        }else{
        	U2f = [lower_lim[0]-R, y, 0]
    		U1f = [upper_lim[0]+R, y, 0]
            direction = 1
        }
    	int = find_intersections(perim, U1f, U2f)
        int.sort(function(a, b){return a.alpha-b.alpha}) //sorts based on alphas from smallest to largest
		for(let i = 0; i < int.length; i+=2){
            U1 = int[i].point
            U2 = int[i+1].point
            
        	fill.points.push(U1, U2)
            //fill.points.push(int[i].point, int[i+1].point)
            fill.fill_idxs.push(fill_idx)
            fill.perim_idxs.push([int[i].idx, int[i+1].idx])
            fill.lines.push([t, t+1])
            t+=2
        }
        fill_idx++
    	y += R * (1-overlap_ratio)
    }
    return fill
} // closes fill_perimeter


////////////////////////////////////////////////////////////////////////////
//DXF drawing instruction
////////////////////////////////////////////////////////////////////////////
/*
DXF.dxf_to_instructions()
new Job({name: "Draw",
				show_instructions: false,
         	 	do_list: [DXF.dxf_to_instructions]}
			    )
*/

    this.dxf_to_instructions = function({
                                            dxf_filepath = "choose_file",
                                            three_J_angles = [[0, 45, 90, -45, 0], [0, 30, 120, -60, 0], [-10, 30, 120, -60, 0]],
                                            tool_height = Dexter.LINK4,
                                            tool_length = Dexter.LINK5,
                                            DXF_units,
                                            draw_speed = 1 * _cm/_s,
                                            draw_res = 0.5 * _mm,
                                            lift_height = 1 * _cm,
                                            rapid_speed = 20,
                                            tool_action = false,
                                            tool_action_on_function  = undefined,
                                            tool_action_off_function = undefined,
                                            robot = undefined
                                        } = {}){

    	if (tool_action_on_function === undefined){
    	  tool_action_on_function = function() {
				  let instrs = [ make_ins("w", 64, 2), Dexter.dummy_move()]
				  Instruction.add_robot_to_instructions(instrs, robot)
				  return instrs
		  }
        }

        if (tool_action_off_function === undefined){
            tool_action_off_function = function() {
                let instrs = [ make_ins("w", 64, 0), Dexter.dummy_move()]
                Instruction.add_robot_to_instructions(instrs, robot)
                return instrs
            }
        }

        //correct link lengths for tool geometry:
        DXF.orig_link4 = Dexter.LINK4
        DXF.orig_link5 = Dexter.LINK5
        Dexter.LINK4 = tool_height
        Dexter.LINK5 = tool_length

        let dxf_content
        let my_entities
        let my_points
        if(dxf_filepath == "choose_file"){
            let title_string
            if(tool_action){
                title_string = "Select File with '.dxf' Extension to Apply Tool Action to"
            }else{
                title_string = "Select File with '.dxf' Extension to Draw"
            }
            dxf_filepath = choose_file({title: title_string})
            if(dxf_filepath == undefined){
                out("No file has been selected. Nothing will be drawn.", "blue")
                return
            }
            if(!(dxf_filepath.endsWith(".dxf") || dxf_filepath.endsWith(".DXF"))){
                dde_error("Only DXF's are supported. The following file needs the extension '.dxf': " + dxf_filepath)
            }
        }

        if(typeof(dxf_filepath) == "string" && dxf_filepath.length < 512){
            dxf_content = read_file(dxf_filepath)
            my_entities = DXF.content_to_entities(dxf_content)
            my_points = DXF.entities_to_points(my_entities)
        }else if(Array.isArray(dxf_filepath)){
            my_points = dxf_filepath
        }else{
            dde_error("Input arg, file_path, to DXF.dxf_to_instructions is incorrect data type")
        }

        /*
        if(tool_action){
            new Job({name: "Action_Off",
                      do_list: [tool_action_off_function]}
                    )
            new Job({name: "Action_On",
                      do_list: [tool_action_on_function]}
                    )
        }
        */

        //let rapid_speed = 30
        //let dxf_content = read_file(dxf_filepath)

        let J_angles_1 = three_J_angles[0]
        let J_angles_2 = three_J_angles[1]
        let J_angles_3 = three_J_angles[2]

        let my_pose = Kin.three_positions_to_pose(J_angles_1, J_angles_2, J_angles_3)
        let J5_dir = Vector.multiply(-1, Vector.pull(my_pose, [0, 2], 2))
        var work_plane = Coor.Table.create_child(my_pose, "work_plane")
        let bounds = get_bounds_from_three_positions(J_angles_1, J_angles_2, J_angles_3)

        //let my_entities = DXF.content_to_entities(dxf_content)
        /*
        if(fill == false){
            my_points = DXF.entities_to_points(my_entities)
            my_points = scale_points(my_points, scale, J_angles_A)
        }else{
            let fill_obj = fill_DXF(dxf_file_name, scale, 30, 5)
            my_points = object_to_points(fill_obj)
        }
        */

        my_points = scale_points(my_points, DXF_units, three_J_angles)

        let my_path = DXF.points_to_path(my_points, lift_height)

        let path_points = my_path[0]
        let rapid = my_path[1]
        path_points = Coor.move_points_to_coor(path_points, work_plane)
        let dim = Vector.matrix_dimensions(path_points)

        let movCMD = []
        let temp_mov
        if(tool_action){movCMD.push(make_ins("w", 64, 0))}
        movCMD.push(make_ins("S", "MaxSpeed", rapid_speed))
        movCMD.push(make_ins("S", "StartSpeed", .5))
        movCMD.push(Dexter.move_to(path_points[0], J5_dir))
        if(tool_action){movCMD.push(tool_action_on_function)}

        for(let i = 1; i < dim[0]; i++){
            if(rapid[i] == 0){
                if(tool_action){movCMD.push(tool_action_on_function)}
                temp_mov = move_straight(draw_speed, path_points[i-1], path_points[i], draw_res, J5_dir, Dexter.RIGHT_UP_OUT)
                for(let j = 0; j < temp_mov.length; j++){
                    movCMD.push(temp_mov[j])
                }
            }else{
                if(rapid[i+0] == 0){
                    if(tool_action){
                        movCMD.push(tool_action_on_function)
                    }else{
                        temp_mov = move_straight_to(path_points[i-1], path_points[i], draw_res, J5_dir)
                        for(let j = 0; j < temp_mov.length; j++){
                            movCMD.push(temp_mov[j])
                        }
                    }
                }else{
                    movCMD.push(make_ins("S", "MaxSpeed", rapid_speed))
                    movCMD.push(make_ins("S", "StartSpeed", .5))
                    if(tool_action){movCMD.push(make_ins("w", 64, 0))}
                }

                temp_mov = move_straight_to(path_points[i-1], path_points[i], .2, J5_dir)
                for(let j = 0; j < temp_mov.length; j++){
                    movCMD.push(temp_mov[j])
                }

            }
        }
        if(tool_action){
            movCMD.push(tool_action_off_function)
        }
        movCMD.push(make_ins("F"))
        movCMD.push(function(){
            Dexter.LINK4 = DXF.orig_link4
            Dexter.LINK5 = DXF.orig_link5
        })
        if(robot){ Instruction.add_robot_to_instructions(movCMD, robot) }
        return movCMD
    }


/*General Setup (these can be done before or after the below instructions):
- Attach drawing end effector such as a pen or laser to Dexter
- On a flat work surface within Dexter's reach place a flat work piece (Paper, cardboard etc.)
- 
*/
/*Instructions:
1. Choose the Jobs menu and click 'DXF.init_drawing...' to define the jobs used to help make DXF drawings
1. Before turning Dexter on, orient all joints to [0, 0, 0, 0, 0]
2. Run the job Cal by clicking the Cal button on the job bar
3. Change the value of the global variable Apoint1 and eval
4. Start Job.A1 by clicking the 'A1' button in the Jobs bar
5. Adjust the value of Apoint1 until laser is in focus or pen is on paper
6. Repeat for A2 and A3
   These points define your plane and bounding box
   Create a right triangle with these points. 
   The corner with approximately 90 degrees will become the origin
7. Set 'filename' to the path from dde_apps to your DXF file.
8. Choose the units that the DXF was drawn in
9. Adjust tooltip location which is relative to the top of the differential cylinder
10. Click Cut_DXF or Draw_DXF to laser cut or draw with a pen.
*/
///////////////////////////////////////////////////////




///////////////////////////////////////////////////////
//USER UNPUT:
//
/*
debugger
DXF.init_drawing()
*/

	this.init_drawing = function({
		dxf_filepath = "choose_file",
		robot = Dexter.dexter0,
		three_points = [[0, .55, 0.05], [0, .4, 0.05], [.15, .4, 0.05]], //(m) 
		plane_normal_guess = [0, 0, 1],
		calc_plane_normal = false,
		tool_height = 5.08 * _cm,
		tool_length = 8.255 * _cm,
		DXF_units,
		draw_speed = 1 * _cm/_s,
		draw_res = 0.5 * _mm,
		lift_height = 1 * _cm,
        lift_speed = 20,
		tool_action = false,
		tool_action_on_function = function(){
		return [
			make_ins("S", "SetIOState",80),
			Dexter.set_parameter("EESpan", 0),
			function(){return Dexter.dummy_move(this)}
        ]
		},
        tool_action_mid_function = function(){
		return [
			make_ins("S", "SetIOState",80),
			Dexter.set_parameter("EESpan", 430),
			function(){return Dexter.dummy_move(this)}
        ]
		},
		tool_action_off_function = function(){
		return [
			make_ins("S", "SetIOState",80),
			Dexter.set_parameter("EESpan", 512),
			function(){return Dexter.dummy_move(this)}
        ]
		}
	} = {}){

//Plane points
var Apoint1 = three_points[0] //(m)
var Apoint2 = three_points[1] //(m)
var Apoint3 = three_points[2] //(m)

var speed = draw_speed //microns per second
var resolution = draw_res //(microns) Straight line movements are made up of interpolated points with this as spacing
var global_inter_do_item_dur = 1*_ms

var Adir = Vector.multiply(-1, plane_normal_guess)
var J_angles_A = [Kin.xyz_to_J_angles(Apoint1, Adir), 
			  	  Kin.xyz_to_J_angles(Apoint2, Adir), 
              	  Kin.xyz_to_J_angles(Apoint3, Adir)]

function calc_dir_from_J_angles(J_angles){
	let plane_pose = Kin.three_positions_to_pose(J_angles_A[0], J_angles_A[1], J_angles_A[2])
	return Vector.multiply(-1, Vector.pull(plane_pose, [0, 2], 2))
}

if(calc_plane_normal){
	Adir = calc_dir_from_J_angles(J_angles_A)
}

new Job({name: "Home",
		 robot: robot,
         show_instructions: false,
         do_list: [function(){return my_settings(20)},
         		   function(){return Dexter.move_all_joints([0, 0, 0, 0, 0])}]}
)

/////////////////////////////////////////////////////////////////
//Calibration
/////////////////////////////////////////////////////////////////
var old_boundaries
new Job({name: "Cal", 
	robot: robot,
    show_instructions: false,
    do_list: [setOpenLoop(),
            		  make_ins("S", "J1BoundryHigh",180),
                      make_ins("S", "J1BoundryLow",-180),
                      make_ins("S", "J2BoundryLow",-90),
                      make_ins("S", "J2BoundryHigh",90),
                      make_ins("S", "J3BoundryLow",-150),
                      make_ins("S", "J3BoundryHigh",150),
                      make_ins("S", "J4BoundryLow",-130),
                      make_ins("S", "J4BoundryHigh",130),
                      make_ins("S", "J5BoundryLow",-185),
                      make_ins("S", "J5BoundryHigh",180),
                      make_ins("a", 0, 0, 0, 0, 0),
                      make_ins("F"),
                      make_ins("w", 42,64),
                      make_ins("w", 42,0),
                      make_ins("w", 42,256),
                      make_ins("w", 42,0),
                      make_ins("S", "MaxSpeed", 30),
                      make_ins("S", "Acceleration", 0.000129),
                      make_ins("S", "StartSpeed", .05),
                      make_ins("w", 79, 50 ^ 200 ),
                      make_ins("w", 80, 50 ^ 200 ),
                      make_ins("w", 81, 50 ^ 200 ),
                      make_ins("a", 187, 0, 0, 0, 0),
                      make_ins("F"),
                      make_ins("S", "MaxSpeed",10),
                      make_ins("w", 42,1),
                      make_ins("a", -187, 0, 0, 0, 0),
                      make_ins("F"),
                      make_ins("w", 42,0),
                      make_ins("S", "MaxSpeed",30),
                      make_ins("a", 0, 0, 0, 0, 0),
                      make_ins("a", 0, 92, 0, 0, 0),
                      make_ins("F"),
                      make_ins("S", "MaxSpeed",10),
                      make_ins("w", 42,4),
                      make_ins("a", 0, -92, 0, 0, 0),
                      make_ins("F"),
                      make_ins("w", 42,0),
                      make_ins("S", "MaxSpeed",30),
                      make_ins("a", 0, 0, 0, 0, 0),
                      make_ins("a", 0, 0, 153, 0, 0),
                      make_ins("F"),
                      make_ins("S", "MaxSpeed",10),
                      make_ins("w", 42,2),
                      make_ins("a", 0, 0, -153, 0, 0),
                      make_ins("F"),
                      make_ins("w", 42,0),
                      make_ins("S", "MaxSpeed",30),
                      make_ins("a", 0, 0, 0, 0, 0),
                      make_ins("S", "MaxSpeed", 10),
                      make_ins("a", 0, 0, 0, 103, 0),
                      make_ins("F"),
                      make_ins("w", 42,1024),
                      make_ins("a", 0, 0, 0, -103, 0),
                      make_ins("F"),
                      make_ins("w", 42,0),
                      make_ins("a", 0, 0, 0, 0, 189),
                      make_ins("F"),
                      make_ins("w", 42,2048),
                      make_ins("a", 0, 0, 0, 0, -189),
                      make_ins("F"),
                      make_ins("w", 42,0),
                      make_ins("a", 0, 0, 0, 0, 0),
                      make_ins("S", "MaxSpeed", 30),
                      make_ins("a", 30, 30, 30, 30, 30),
                      make_ins("a", 0, 0, 0, 0, 0),
                      make_ins("w", 42,12448),
                      make_ins("l"),
                      setKeepPosition()
    ]})

new Job({
	name: "Point1",
	robot: robot,
    show_instructions: false,
    do_list: [
    	function(){return my_settings(20)},
        function(){return Dexter.move_to(Apoint1, Adir, Dexter.RIGHT_UP_OUT)}
	]
})

new Job({
	name: "Point2",
    robot: robot,
    show_instructions: false,
	do_list: [
    	function(){return my_settings(20)},
        function(){return Dexter.move_to(Apoint2, Adir, Dexter.RIGHT_UP_OUT)}
	]
})

new Job({
	name: "Point3",
    robot: robot,
    show_instructions: false,
    do_list: [
    	function(){return my_settings(20)},
        function(){return Dexter.move_to(Apoint3, Adir, Dexter.RIGHT_UP_OUT)}
	]
})

new Job({name: "Out_Rectangle",
		 robot: robot,
		 show_instructions: false,
         do_list: [function(){out("Width: " + Vector.round(Vector.multiply(100, get_bounds_from_three_positions(J_angles_A[0], J_angles_A[1], J_angles_A[2])[0]), 3) + " (cm)   Height: " + Vector.round(Vector.multiply(100, get_bounds_from_three_positions(J_angles_A[0], J_angles_A[1], J_angles_A[2])[1]), 3) + "  (cm)", "blue")}
         		  ]}
)

if(tool_action){
	new Job({
		name: "Action_Off",
    	robot: robot,
        show_instructions: false,
		do_list: [tool_action_off_function]}
	)
    
    new Job({
		name: "Action_Mid",
    	robot: robot,
        show_instructions: false,
		do_list: [tool_action_mid_function]}
	)

	new Job({
		name: "Action_On", 
        robot: robot,
        show_instructions: false,
		do_list: [tool_action_on_function]}
	)

	new Job({
		name: "DXF_Tool",
        robot: robot,
		inter_do_item_dur: global_inter_do_item_dur,
		show_instructions: false,
		do_list: [
    		function(){return my_settings(30)},
			function(){
        		return DXF.dxf_to_instructions({
					dxf_filepath: dxf_filepath, 
					three_J_angles: J_angles_A,
					tool_height: tool_height,
					tool_length: tool_length,
					DXF_units: DXF_units,
					draw_speed: draw_speed,
					draw_res: draw_res,
					lift_height: lift_height,
					tool_action: tool_action,
					tool_action_on_function: tool_action_on_function,
					tool_action_off_function: tool_action_off_function
				})
        	}
		]
    })
}else{
	new Job({
		name: "Draw_DXF",
    	robot: robot,
		inter_do_item_dur: global_inter_do_item_dur,
		show_instructions: false,
		do_list: [
    		function(){return my_settings(30)},
			function(){return DXF.dxf_to_instructions({
				dxf_filepath: dxf_filepath, 
				three_J_angles: J_angles_A,
				tool_height: tool_height,
				tool_length: tool_length,
				DXF_units: DXF_units,
				draw_speed: draw_speed,
				draw_res: draw_res,
				lift_height: lift_height,
				tool_action: tool_action,
				tool_action_on_function: tool_action_on_function,
				tool_action_off_function: tool_action_off_function
			})}
		]})
}

/*
this.dxf_to_instructions = function({
						dxf_filepath = "choose_file",
						three_J_angles = [[0, 30, 90, -30, 0], [0, 45, 90, -45, 0], [15, 45, 90, -45, 0]],
                        tool_height = 5.08 * _cm,
                        tool_length = 8.255 * _cm,
                        DXF_units,
                        draw_speed = 3 * _cm/_s,
                        draw_res = 0.5 * _mm,
                        lift_height = 1 * _cm,
                        laser_cut = false
                      } = {}){
*/
 
} // closes DXF.init_drawing
    this.string_to_lines = txt.string_to_lines
} // closes DXF class

globalThis.DXF = DXF


