//Coordinate System 
//James Wigglesworth
//Started: 1_19_17
//Updated: 4_7_17


var Coor = newObject({prototype: Root, name: "Coor", pose: Vector.make_pose()})


Coor.create_child = function(pose, name){
	if(pose === undefined){
    	pose = Vector.make_pose()
    }
    if (!Vector.is_pose(pose)){
    		dde_error("pose is not constructed properly")
    	}
	var old_child = this[name]
	if(Object.isNewObject(old_child)){
    	old_child.set_pose(pose)
        return old_child
    }else if(name){
		return newObject({prototype: this, pose: pose, name: name})
    }else{
		return newObject({prototype: this, pose: pose})
    }
	
}


var Table = Coor.create_child(Vector.make_pose(), "Table")
var L0 = Table.create_child(Vector.make_pose(), "L0")
var L1 = L0.create_child(Vector.make_pose(), "L1")
var L2 = L1.create_child(Vector.make_pose(), "L2")
var L3 = L2.create_child(Vector.make_pose(), "L3")
var L4 = L3.create_child(Vector.make_pose(), "L4")
var L5 = L4.create_child(Vector.make_pose(), "L5")



Coor.get_pose = function(reference_coordinate_system){
	let result, obj_elt, base_idx, ref_idx
    let base = this
    let ref = reference_coordinate_system
	if (ref === undefined || this === ref){
    	return base.pose
    }else{
        let base_path = base.ancestors()
        base_path.push(base)
        let ref_path = ref.ancestors()
        ref_path.push(ref)
        let common = Object.lowestCommonAncestor(base, ref)
        
        for(let i = 1; i < base_path.length; i++){
        	if (common === base_path[i]){
            	base_idx = i
                break
            }
        }
        let common_to_base = Vector.make_pose()
        for(i = base_idx; i < base_path.length; i++){
        	obj_elt = base_path[i]
        	common_to_base = Vector.matrix_multiply(common_to_base, obj_elt.pose)
        }
        //common_to_base = Vector.matrix_multiply(common_to_base, base.pose)
        
        for(i = 1; i < ref_path.length; i++){
        	if (common === ref_path[i]){
            	ref_idx = i
                break
            }
        }
        let common_to_ref = Vector.make_pose()
        for(i = ref_idx; i < ref_path.length; i++){
        	obj_elt = ref_path[i]
        	common_to_ref = Vector.matrix_multiply(common_to_ref, obj_elt.pose)
        }
        //common_to_ref = Vector.matrix_multiply(common_to_ref, ref.pose)
        
        return Vector.matrix_divide(common_to_base, common_to_ref)
    }
}

Coor.get_position = function(reference_coordinate_system){
	let result
    if(reference_coordinate_system === undefined){
    	result = Vector.pull(this.pose, [0, 2], 3)
    }else{
    	let pose = this.get_pose(reference_coordinate_system)
        result = Vector.pull(pose, [0, 2], 3)
    }
    return Vector.transpose(result)
}

Coor.get_orientation = function(reference_coordinate_system){
    let result
    if(reference_coordinate_system === undefined){
    	result = Vector.pull(this.pose, [0, 2], [0, 2])
    }else{
    	let pose = this.get_pose(reference_coordinate_system)
        result = Vector.pull(pose, [0, 2], [0, 2])
    }
    return result
}

Coor.set_pose = function(pose, reference_coordinate_system){
	let result
    let ref = reference_coordinate_system
    if(reference_coordinate_system === undefined){
    	this.pose = pose
        result = pose
    }else{
    	let base_ancestors = this.ancestors()
        let parent = base_ancestors[base_ancestors.length-1]
        result = Vector.matrix_multiply(pose, ref.get_pose(parent))
    	this.pose = result
    }
    return result
}


Coor.set_position = function(position, reference_coordinate_system){
	let result, current_pose
    let ref = reference_coordinate_system
    if(reference_coordinate_system === undefined){
    	current_pose = this.pose 
        current_pose[0][3] = position[0]
        current_pose[1][3] = position[1]
        current_pose[2][3] = position[2]
    	this.pose = current_pose
        result = current_pose
    }else{
    	let base_ancestors = this.ancestors()
        let parent = base_ancestors[base_ancestors.length-1]
        let temp_position = Vector.transpose(Vector.matrix_multiply(ref.get_pose(parent), Vector.properly_define_point(position)))
        temp_position.pop()
        this.pose = Vector.make_pose(temp_position, this.get_orientation())
    	result = this.pose
    }
    return result
}


Coor.set_orientation = function(orientation, reference_coordinate_system){
	let result, current_pose
    let ref = reference_coordinate_system
    if(reference_coordinate_system === undefined){
    	this.pose = Vector.make_pose(this.get_position(), orientation)
        result = this.pose
    }else{
    	let base_ancestors = this.ancestors()
        let parent = base_ancestors[base_ancestors.length-1]
        let temp_orientation = Vector.matrix_multiply(ref.get_orientation(parent), orientation)
        this.pose = Vector.make_pose(this.get_position(), temp_orientation)
    	result = this.pose
    }
    return result
}

Coor.is_Coor = function(){
	
}

Coor.insert = function(){
	Object.set_prototypeof 
}

Coor.move_points_to_coor = function(points, destination_coordinate_system, reference_coordinate_system){
	let dest = destination_coordinate_system
    let ref = reference_coordinate_system
    
    if(ref === undefined){
    	ref = Table
    }
    let trans = dest.get_pose(Table)
    let result = points
    let dim = Vector.matrix_dimensions(points)
    if(dim[1] == 3){
    	for(let i = 0; i < dim[0]; i++){
    		result[i] = Vector.transpose(Vector.matrix_multiply(trans, Vector.properly_define_point(points[i])))
    	}
        result = Vector.pull(result, [0, dim[0] - 1], [0, 2])
    }
    return result
}
/*
var board = Table.create_child(Vector.make_pose([0, 0, 1000], [0, 0, 324000]), "board")
var points = [[1, 2, 3], [4, 5, 6]]
debugger
var result = Coor.move_points_to_coor(points, board)
*/

Coor.rotate = function(axis_of_rotation, angle, point_of_rotation, reference_coordinate_system){
	let pose, result
    let ref = reference_coordinate_system
    if(ref === undefined){
    	pose = this.get_pose()
        if(point_of_rotation == undefined){
        	point_of_rotation = this.get_position()
        }
        pose = Vector.rotate_pose(pose, axis_of_rotation, angle, point_of_rotation)
        this.set_pose(pose)
        result = this.pose
    }else{
    	pose = this.get_pose(ref)
        if(point_of_rotation == undefined){
        	point_of_rotation = [0, 0, 0]
        }
        pose = Vector.rotate_pose(pose, axis_of_rotation, angle, point_of_rotation)
        this.set_pose(pose, ref)
        result = this.pose
    }
    return result
}

new TestSuite("Coordinate Object System",
    ['table = Coor.create_child(Vector.make_pose(), "table")', "Coor.table"],
	['J0 = table.create_child(Vector.make_pose(), "J0")', "Coor.table.J0"],
    ['J1 = J0.create_child(Vector.make_pose([10, 0, 0]), "J1")', "Coor.table.J0.J1"],
    ['J2 = J1.create_child(Vector.make_pose([0, 0, 20]), "J2")', "Coor.table.J0.J1.J2"],
    ['J3 = J2.create_child(Vector.make_pose([0, 0, 20]), "J3")', "Coor.table.J0.J1.J2.J3"],
    ['cube = table.create_child(Vector.make_pose([15, 10, 5], [0, 0, 0]), "cube")', "Coor.table.cube"],
	["J3.get_pose()", "[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 20], [0, 0, 0, 1]]"],
    ["J3.get_pose(table)", "[[1, 0, 0, 10], [0, 1, 0, 0], [0, 0, 1, 40], [0, 0, 0, 1]]"],
    ["cube.get_pose()", "[[1, 0, 0, 15], [0, 1, 0, 10], [0, 0, 1, 5], [0, 0, 0, 1]]"],
    ["J3.get_pose(cube)", "[[1, 0, 0, -5], [0, 1, 0, -10], [0, 0, 1, 35], [0, 0, 0, 1]]"],
    ["cube.get_pose(J3)", "[[1, 0, 0, 5], [0, 1, 0, 10], [0, 0, 1, -35], [0, 0, 0, 1]]"],
    ['cube = table.create_child(Vector.make_pose([15, 10, 5], [0, 0, 45]), "cube")', "Coor.table.cube"],
    ["cube.get_pose()", "[ [0.7071067811865476, 0.7071067811865475, 0, 15], [-0.7071067811865475, 0.7071067811865476, 0, 10], [0, 0, 1, 5], [0, 0, 0, 1]]"],
    ["J3.get_pose(cube)", "[ [0.7071067811865476, -0.7071067811865475, 0, 6.464466094067261], [0.7071067811865475, 0.7071067811865476, 0, -17.67766952966369], [0, 0, 1, 35], [0, 0, 0, 1]]"],
    ["J3.get_position()", "[0, 0, 20]"],
    ["J3.get_pose(cube)", "[ [0.7071067811865476, -0.7071067811865475, 0, 6.464466094067261], [0.7071067811865475, 0.7071067811865476, 0, -17.67766952966369], [0, 0, 1, 35], [0, 0, 0, 1]]"],
    ["J3.get_orientation()", "[[1, 0, 0], [0, 1, 0], [0, 0, 1]]"],
    ["J3.get_orientation(cube)", "[ [0.7071067811865476, -0.7071067811865475, 0], [0.7071067811865475, 0.7071067811865476, 0], [0, 0, 1]]"],   
    ["J3.set_pose([[1, 0, 0, 10], [0, 1, 0, 10],[0, 0, 1, 10],[0, 0, 0, 1]])", "[[1, 0, 0, 10], [0, 1, 0, 10], [0, 0, 1, 10], [0, 0, 0, 1]]"],
    ["J3.set_pose([[1, 0, 0, 10], [0, 1, 0, 10],[0, 0, 1, 10],[0, 0, 0, 1]], table)   ", "[[1, 0, 0, 0], [0, 1, 0, 10], [0, 0, 1, -10], [0, 0, 0, 1]]"],    
    ["J3.set_position([10, 10, 10])", "[[1, 0, 0, 10], [0, 1, 0, 10], [0, 0, 1, 10], [0, 0, 0, 1]]"],
    ["J3.set_position([10, 10, 10], table)", "[[1, 0, 0, 0], [0, 1, 0, 10], [0, 0, 1, -10], [0, 0, 0, 1]]"],
    ["J3.set_orientation([[-1, 0, 0], [0, 0, 1], [0, 0, 1]])", "[[-1, 0, 0, 0], [0, 0, 1, 10], [0, 0, 1, -10], [0, 0, 0, 1]]"],
    ["J3.set_orientation([[-1, 0, 0], [0, 0, 1], [0, 0, 1]], cube)", "[[-0.7071067811865476, 0, 0.7071067811865475, 0], [0.7071067811865475, 0, 0.7071067811865476, 10], [0, 0, 1, -10], [0, 0, 0, 1]]"]
)




/*
Table = Coor.create_child(Vector.make_pose(), "Table")
J0 = table.create_child(Vector.make_pose(), "J0")
J1 = J0.create_child(Vector.make_pose([10, 0, 0]), "J1")
J2 = J1.create_child(Vector.make_pose([0, 0, 20]), "J2")
J3 = J2.create_child(Vector.make_pose([0, 0, 20]), "J3")
cube = table.create_child(Vector.make_pose([15, 10, 5], [0, 0, Convert.degrees_to_arcseconds(0)]), "cube")

debugger

J3.set_pose([[ 0.707, 0.707, 0, 15], [-0.707, 0.707, 0, 10],[0, 0, 1, 5],[0, 0, 0, 1]])
J3.set_pose([[1, 0, 0, 10], [0, 1, 0, 10],[0, 0, 1, 10],[0, 0, 0, 1]])
J3.set_pose([[1, 0, 0, 10], [0, 1, 0, 10],[0, 0, 1, 10],[0, 0, 0, 1]], table)
J3.set_position([10, 10, 10])
J3.set_position([10, 10, 10], table)
debugger
J3.set_orientation(Convert.angles_to_DCM([0, 0, Convert.degrees_to_arcseconds(90)]))
J3.set_orientation([[-1, 0, 0], [0, 0, 1], [0, 0, 1]])
J3.set_orientation([[-1, 0, 0], [0, 0, 1], [0, 0, 1]], cube)


J3.get_pose()
J3.get_pose(table)

cube.get_pose()

J3.get_pose(cube)
cube.get_pose(J3)

cube = table.create_child(Vector.make_pose([15, 10, 5], [0, 0, Convert.degrees_to_arcseconds(45)]), "cube")
J3.get_pose(cube)
cube.get_pose(J3)


J3.get_position()
J3.get_position(cube)

J3.get_orientation()
J3.get_orientation(cube)
*/