/*
These functions will tell the user what needs to be done based on the Eye data.

The data should be stored in the following format:

	xydata.push([AxisTable [axis][1], AxisTable [axis][2]])

This line should be added to smLinex() right after the point is plotted.
It could be stored in the Job's user_data as a global.

Examples:
var xydata = [[100, 0], [0, 100], [400, 500], [500, 400]]
var eye_suggest_result = eye_suggestion(xydata)
out(eye_suggestion_string(eye_suggest_result))

var xydata = [[250, 0], [0, 250], [250, 300], [500, 250]]
var eye_suggest_result = eye_suggestion(xydata)
out(eye_suggestion_string(eye_suggest_result))

var xydata = [[250, 0], [0, 250], [250, 500], [500, 250]]
var eye_suggest_result = eye_suggestion(xydata)
out(eye_suggestion_string(eye_suggest_result))

*/

function eye_suggestion(xydata){
    let x = Vector.transpose(Vector.pull(xydata,[0,xydata.length-1], [0, 0]))
    let y = Vector.transpose(Vector.pull(xydata,[0,xydata.length-1], [1, 1]))
    let fit = Vector.poly_fit(x, y)
    let slope = fit[0]
    let block_postion_state = 0
    if(slope > .5){
        //Optical block needs to be moved closer to the code disk
        block_postion_state = 1
    }
    if(slope < -.5){
        //Optical block needs to be moved away from the code disk
        block_postion_state = -1
    }

    let max_val = 4096 //Change this to actual max value
    let x_state = 0
    let y_state = 0

    if(Vector.max(x) > max_val){
        //x amplitude too high
        x_state = -1
    }else if(Vector.max(x) < .8*max_val){
        //x amplitude too low
        x_state = 1
    }

    if(Vector.max(y) > max_val){
        //y amplitude too high
        y_state = -1
    }else if(Vector.max(y) < .8*max_val){
        //y amplitude too low
        y_state = 1
    }

    //suggested but probably not correct center 
    //let center_xy = [Vector.average(x), Vector.average(x)]
    let center_xy = find_perfect_center(xydata)

    return [block_postion_state, [x_state, y_state], center_xy]
}

function eye_suggestion_string(eye_suggest_result){
	if(eye_suggest_result[0] != 0){
    	if(eye_suggest_result[0] == 1){
        	return "Move optical block closer to code disk.<br/>"
        }else{
        	return "Move optical block away from code disk.<br/>"
        }
    }
	else if((eye_suggest_result[1][0] != 0) || (eye_suggest_result[1][1] != 0)){
    	if(eye_suggest_result[1][0] == 1){
        	return "Rotate left optical encoder clockwise.<br/>"
        }
        else if(eye_suggest_result[1][0] == -1){
        	return "Rotate left optical encoder counter-clockwise.<br/>"
        }
        else if(eye_suggest_result[1][1] == 1){
        	return "Rotate right optical encoder clockwise.<br/>"
        }
        else if(eye_suggest_result[1][1] == -1){
        	return "Rotate right optical encoder counter-clockwise.<br/>"
        }
    }
    else { return "Eye is accaptable. Wait for completion.<br/>" }
}

/*
 var xydata = [[250, 0], [0, 250], [250, 500], [500, 250], [250, 10], [10, 250]]
 //debugger
 find_perfect_center(xydata)
 */
function find_perfect_center(xy_data){
    let x = Vector.transpose(Vector.pull(xy_data,[0,xy_data.length-1], [0, 0]))
    let y = Vector.transpose(Vector.pull(xy_data,[0,xy_data.length-1], [1, 1]))
    let x_bounds = [Vector.min(x), Vector.max(x)]
    let y_bounds = [Vector.min(y), Vector.max(y)]
    let mesh = generate_mesh(x_bounds, y_bounds, 6)
    //out(mesh)
    //out(xy_data)
    let inside_mesh = []
    for(let i = 0; i < mesh.length; i++){
        if(is_inside(xy_data, mesh[i])){
            inside_mesh.push(mesh[i])
        }
    }
    //out(inside_mesh)

    return center_calc(xy_data, inside_mesh)
}

/*
 var mesh = generate_mesh([0, 10], [0, 10], 2)
 */
function generate_mesh(x_bounds, y_bounds, n_side_points){
    n_side_points++
    let x_step = (x_bounds[1] - x_bounds[0])/(n_side_points)
    let y_step = (y_bounds[1] - y_bounds[0])/(n_side_points)
    let mesh = []
    for(let i = 1; i < n_side_points; i++){
        for(let j = 1; j < n_side_points; j++){
            mesh.push([x_bounds[0]+i*x_step, y_bounds[0]+j*y_step])
        }
    }
    return mesh
}


function is_inside(contour, point){
    let U1a = point
    let U1b = Vector.add([1, 1], point) //Up
    let U1c = Vector.add([1, -1], point) //Right
    let updown = 0
    let leftright = 0
    for(let i = 1; i < contour.length; i++){
        updown += line_intersection(contour[i-1], contour[i], U1a, U1b)
        leftright += line_intersection(contour[i-1], contour[i], U1a, U1c)
    }
    if(Math.abs(updown) + Math.abs(leftright) <= 1){
        return true
    }else{
        return false
    }
}

function line_intersection(U1a, U1b, U2a, U2b){
    let A, B, C, alpha, beta
    let state = 0
    A = (U2b[0]-U1b[0])/(U1a[0]-U1b[0]);
    B = ((U2a[0]-U2b[0])*(U1b[1]-U2b[1]))/((U1a[0]-U1b[0])*(U2a[1]-U2b[1]));
    C = ((U2a[0]-U2b[0])*(U1a[1]-U1b[1]))/((U1a[0]-U1b[0])*(U2a[1]-U2b[1]));
    alpha = (A+B)/(1-C);
    beta = (U1b[1]-U2b[1]+(U1a[1]-U1b[1])*alpha)/(U2a[1]-U2b[1]);
    if((0 < alpha) && (alpha < 1)){
        if(beta < 0){
            state = 1
        }else{
            state = -1
        }
    }
    return state
}

function center_calc(contour, inside_mesh){
    let U1, U2a, U2b
    let temp_dists = Vector.make_matrix(1, contour.length-1)[0]
    let mesh_obj = []
    //debugger
    for(let i = 0; i < inside_mesh.length; i++){
        U1 = inside_mesh[i]
        for(let j = 1; j < contour.length; j++){
            U2a = contour[j-1]
            U2b = contour[j]
            temp_dists[j-1] = dist(U1, U2a, U2b)
        }
        mesh_obj.push({x: inside_mesh[i][0], y: inside_mesh[i][1], ave: Vector.average(temp_dists), min: Vector.min(temp_dists), idx: i})
    }
    let top_4_ave = []
    let top_4_min = []
    /*
     if(mesh_obj.length > 2){
     mesh_obj.sort(function(a, b){return b.ave-a.ave}) //sorts based on aves from largest to smallest
     top_4_ave = Vector.pull(mesh_obj, 0, [0, 3])
     mesh_obj.sort(function(a, b){return b.min-a.min}) //sorts based on maxes from largest to smallest
     top_4_min = Vector.pull(mesh_obj, 0, [0, 3])
     }else{
     top_4_ave = mesh_obj
     top_4_min = mesh_obj
     }*/

    top_4_ave = mesh_obj
    top_4_min = mesh_obj
    let sum_ave = 0, ave_elt, ave_center = [0, 0]
    let sum_min = 0, min_elt, min_center = [0, 0]
    for(let i = 0; i < top_4_ave.length; i++){
        ave_elt = top_4_ave[i].ave
        min_elt = top_4_min[i].min
        ave_center = Vector.add(ave_center, Vector.multiply(ave_elt, [top_4_ave[i].x, top_4_ave[i].y]))
        min_center = Vector.add(min_center, Vector.multiply(min_elt, [top_4_min[i].x, top_4_min[i].y]))
        sum_ave += ave_elt
        sum_min += min_elt
    }
    ave_center = Vector.divide(ave_center, sum_ave)
    min_center = Vector.divide(min_center, sum_min)
    //out(ave_center)
    //out(min_center)
    return [min_center, ave_center]
}

/*
 int.sort(function(a, b){return a.alpha-b.alpha}) //sorts based on alphas from smallest to largest
 result.push({point: int_point, alpha: alpha, beta: beta, idx: i})
 var matrix = [1, 2, 3, 4, 5]
 var nmat = Vector.pull(matrix, 0, [1, 3])
 */
function dist(U1, U2a, U2b){
    let Uba = Vector.subtract(U2b, U2a)
    let Ua1 = Vector.subtract(U1, U2a)
    let Vba = Vector.normalize(Uba)
    let scalar = Vector.dot(Ua1, Vba)
    if (0 <= scalar && scalar <= Vector.magnitude(Uba)){
        let int_point = Vector.add(Vector.multiply(scalar, Vba), U2a)
        return Vector.magnitude(Vector.subtract(U1, int_point))
    }else if (0 > scalar){
        return Vector.magnitude(Vector.subtract(U1, U2a))
    }else{
        return Vector.magnitude(Vector.subtract(U1, U2b))
    }
}

