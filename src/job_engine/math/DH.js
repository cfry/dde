let mathjs = require("mathjs")
var DH = {}
globalThis.DH = DH


DH.forward_kinematics = function(J_angles, dh_mat){
	let T = [0, 0, 0, 0, 0, 0]
	T[0] = Vector.make_pose()
    let dh = JSON.parse(JSON.stringify(dh_mat)) //deep copy
    
    for(let i = 0; i < J_angles.length; i++){
    	dh[i][1] += J_angles[i] * DH.sign_swap[i]
    }
    
    T[0] = Vector.make_pose()
    for(let i = 0; i < dh.length; i++){
    	T[i + 1] = Vector.matrix_multiply(
        	Vector.make_pose([0, 0, dh[i][0]], [-dh[i][1], 0, 0]),
            Vector.make_pose([dh[i][2], 0, 0], [0, 0, -dh[i][3]])
        )
    }
    
	let T_end = T[0]
    let T_global = []
    for(let i = 0; i < T.length; i++){
    	T_end = Vector.matrix_multiply(T_end, T[i])
        T_global.push(T_end.slice())
    }

	let xyz_6 = [T_end[0][3], T_end[1][3], T_end[2][3]]
    let dir_6 = [T_end[0][0], T_end[1][0], T_end[2][0]]

    return [xyz_6, dir_6, T_global]
}
/*

var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")
debugger
var J_angles = [0, 0, 90, 0, 0, 0]
var fk = DH.forward_kinematics(J_angles, dh_mat)
inspect(fk[2][6])

Vector.multiply([0.004376061498635432, 0.3747559999576882, 0.5220044115252782], 1/_um)

*/

DH.get_joint_points = function(J_angles, dh_mat){
	let T = []
    let U = new Array(12)
	T[0] = Vector.make_pose()
    let dh = JSON.parse(JSON.stringify(dh_mat)) //deep copy
    
    for(let i = 0; i < J_angles.length; i++){
    	dh[i][1] += J_angles[i] * DH.sign_swap[i]
    }
    
    //T.push(Vector.make_pose())
    for(let i = 0; i < dh.length; i++){
    	T.push(Vector.make_pose([0, 0, dh[i][0]], [-dh[i][1], 0, 0]))
        T.push(Vector.make_pose([dh[i][2], 0, 0], [0, 0, -dh[i][3]]))
    }
    
	let T_end = T[0]
    let T_global = []
    for(let i = 0; i < T.length; i++){
    	T_end = Vector.matrix_multiply(T_end, T[i])
        T_global.push(T_end.slice())
    }

	let xyz_6 = [T_end[0][3], T_end[1][3], T_end[2][3]]
    let dir_6 = [T_end[0][0], T_end[1][0], T_end[2][0]]

    return [xyz_6, dir_6, T_global]
}

/*
var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")

var J_angles = [0, 45, 90, -45, 0, 0]
var T = DH.get_joint_points(J_angles, dh_mat)[2]

var x = []
var y = []
var z = []
var view_plane = [45, 45]
var xyz, proj_xyz
for(let i = 0; i < T.length; i++){
	xyz = [
    	T[i][0][3],
        T[i][1][3],
        T[i][2][3]
    ]
    proj_xyz = Vector.rotate(xyz, [0, 1, 0], view_plane[1])
    proj_xyz = Vector.rotate(proj_xyz, [0, 0, 1], view_plane[0])
    
	//x.push(proj_xyz[1])
    //y.push(proj_xyz[2])
    
    x.push(xyz[0])
    y.push(xyz[1])
    z.push(xyz[2])
}

var plot_data = []

plot_data.push({
	type: "scatter_3d",
    name: "J1",
    mode: "lines+markers", //lines between points and dots (markers) on the points
    x: x,
    y: y,
    z: z
})

Plot.show(
	null,
    plot_data,
    null,
    undefined,
    {
    	title: "Joint Points",
        x_axis: "[X] (meters)",
        y_axis: "[Y] (meters)"
    }
)

*/

DH.inverse_kinematics = function(x_e, r_e, dh_mat, angles_guess = [0, 0, 90, 0, 0, 0]){
    let x_precision = 0.01 * _mm
    let r_precision = 0.001 //quaternion magnitude
    let max_iter = 1000
    let k = [2.5, 2.5, 2.5, 10.5, 10.5, 10.5]
    let dt = 0.01
    
    let q_angles = angles_guess.slice() //shallow copy because q_angles gets modified
    let fk = DH.forward_kinematics(angles_guess, dh_mat)
    let x_nominal = fk[0]
    let T_global = fk[2]
    let r_nominal = Vector.pull(T_global[T_global.length -1], [0, 2], [0, 2])
	
    let count = 0
    let err = Vector.make_matrix(1, 6, 0)[0]
    let x_d_dot = Vector.make_matrix(1, 6, 0)[0]
    while(
    	(Vector.magnitude(Vector.subtract(x_e, x_nominal)) >= x_precision
        || Vector.magnitude(Vector.max(Vector.magnitude(DH.orientation_error_quat(r_e, r_nominal)))) >= r_precision)
        && count < max_iter
    ){
    	err = Vector.subtract(x_e, x_nominal)
        err = [...err, ...DH.orientation_error_quat(r_e, r_nominal).slice(0, 3)]
        
        let v_e = Vector.add(x_d_dot, Vector.multiply(k, err))
        let g_jacobian = DH.geometric_jacobian(q_angles, dh_mat)
        let q_dot = Vector.transpose(Vector.matrix_multiply(Vector.inverse(g_jacobian), Vector.transpose(v_e)))
        q_dot = Vector.multiply(q_dot, _rad, DH.sign_swap) //q_dot is in radians and needs same sign swap
        
        q_angles = Vector.add(
        	q_angles,
        	Vector.multiply(dt, q_dot)
        )
        
    	fk = DH.forward_kinematics(q_angles, dh_mat)
        x_nominal = fk[0]
    	T_global = fk[2]
        r_nominal = Vector.pull(T_global[T_global.length -1], [0, 2], [0, 2])
		count++
    }
    if(count >= max_iter){
    	out("DH.inverse_kinematics: no solution found, improve initial guess", "red")
        out("quat: " + DH.orientation_error_quat(r_e, r_nominal), "red")
        out("q_angles: " + q_angles, "red")
    }
    //out("count: " + count)
    
    
    return q_angles
}
/*
var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
debugger
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")

var J_angles = [0, -30, 90, 0, 0, 0]
var [xyz, dir_6, T_global] = DH.forward_kinematics(J_angles, dh_mat)
var r_e = Vector.pull(T_global[T_global.length -1], [0, 2], [0, 2])

var ik = DH.inverse_kinematics(xyz, r_e, dh_mat)
inspect(ik)

var fk = DH.forward_kinematics(ik, dh_mat)
var xyz_2 = fk[0]
var xyz_error = Vector.subtract(xyz_2, xyz)
var dir_2 = fk[1]
var dir_error = Vector.angle(dir_2, dir_6)
inspect(xyz_error)
inspect(dir_error)


var x_des = [-16.25*_cm, 33.75*_cm, 0.475*_cm]
var r_des = [
	[0, -1, 0],
    [0, 0, 1],
    [-1, 0, 0]
]


for(let a = -1; a < 2; a+=2){
	for(let b = -1; b < 2; b+=2){
    	for(let c = -1; c < 2; c+=2){
        	for(let d = -1; d < 2; d+=2){
            	for(let e = -1; e < 2; e+=2){
                    var guess_angles = Vector.multiply([0.40911, -1.09898, 1.98286, -1.17373, -0.18340, 0], _rad) 
                    var sign_swap = [a, b, c, d, e, 1]
                    out(sign_swap)
                    guess_angles = Vector.multiply(guess_angles, sign_swap)
                    var ik = DH.inverse_kinematics(x_des, r_des, dh_mat, guess_angles)
                }
            }
        }
	}
}


x_nominal: -18.35632557188965,32.785463033390386,0.39063180263509967
[-1, 1, -1, -1, -1, 1]

x_nominal: -17.374478638550297,-34.87208042380309,14.750186873793975
[1, 1, -1, 1, -1, 1]




var x_des = [-16.25*_cm, 33.75*_cm, 0.475*_cm]
var r_des = [
	[0, -1, 0],
    [0, 0, 1],
    [-1, 0, 0]
]
var guess_angles = Vector.multiply([0.40911, -1.09898, 1.98286, -1.17373, -0.18340, 0], _rad) 
//var sign_swap = [-1, -1, 1, 1, -1, 1]
var sign_swap = [-1, -1, 1, 1, -1, 1]
guess_angles = Vector.multiply(guess_angles, sign_swap)
var ik = DH.inverse_kinematics(x_des, r_des, dh_mat, guess_angles)


//x_nominal = [-18.01651, 35.30429, 8.09183]

//var sign_swap = [-1, 1, 1, 1, -1, 1]


var angles = [
    23.440276356597106,
    62.96691576928721,
    113.60950936531042,
    -67.24977528789012,
    -10.508045962699299,
    0
]
debugger
DH.forward_kinematics(angles, dh_mat)[0]


*/

DH.sign_swap = [-1, -1, 1, 1, -1, 1]

DH.orientation_error_quat = function(r2, r1){
	let e_o = Vector.DCM_to_quaternion(Vector.matrix_multiply(r2, Vector.transpose(r1)))
	return e_o.slice(1, 4)
}

/*
DH.force_to_torque = function(force_vector, J_angles, dh_mat){
	
	let fk = DH.forward_kinematics(J_angles, dh_mat)
    
    let T = fk[2]
	let rotation_axes = []
    let xyzs = []
    for(let i = 0; i < 5; i++){
		rotation_axes.push(Vector.transpose(Vector.pull(T[i], [0, 2], [2, 2])))
        xyzs.push(Vector.transpose(Vector.pull(T[i], [0, 2], [3, 3])))
	}
    let force_xyz = fk[0]
    let moment_arms = []
    for(let i = 0; i < 5; i++){
    	moment_arms.push(Vector.subtract(force_xyz, xyzs[i]))
    }
    let projected_moment_arm
    let torque_vector
    let torques = []
    for(let i = 0; i < 5; i++){
    	torque_vector = Vector.cross(moment_arms[i], force_vector)
        //projected_moment_arm = Vector.project_vector_onto_plane(torque_vector, rotation_axes[i])
        projected_moment_arm = Vector.dot(torque_vector, rotation_axes[i])
        torques.push(Vector.magnitude(projected_moment_arm))
    }
    let torque_sign_swap = [-1, -1, 1, 1, -1]
    torques = Vector.multiply(torques, torque_sign_swap)
	return torques
}
*/

DH.parse_dh_mat_file = function(fp, dist_units = _m, ang_units = _deg){
	var dh_content = file_content(fp)
    var dh_mat = dh_content.split('\r\n')
    if(dh_mat.length < 2){
    	dh_mat = dh_content.split('\n')
    }
    dh_mat.pop() //last element is empty
    let units
    for(let i = 0; i < dh_mat.length; i++){
    	dh_mat[i] = dh_mat[i].split(" ")
        for(let j = 0; j < dh_mat[i].length; j++){
        	if(j %2 == 0){
            	units = _cm / dist_units
            }else{
            	units = _rad / ang_units
            }
        	dh_mat[i][j] = Number(dh_mat[i][j]) * units
        }
    }
    return dh_mat
}

DH.add_sixth_axis = function(dh_mat){
	if(dh_mat.length === 6){return dh_mat}
	let dh_6 = Vector.make_matrix(6, 4)
    for(let i = 0; i < dh_mat.length; i++){
    	for(let j = 0; j < dh_mat[i].length; j++){
        	dh_6[i][j] = dh_mat[i][j]
        }
    }
    
    dh_6[4][1] += 90
    dh_6[4][2] = 0
    dh_6[4][3] += 90
    
    dh_6[5][0] = dh_mat[4][2]
    dh_6[5][3] = -90
    
    return dh_6
}
/*

var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/cal_data_HDI_000047/"
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")
var dh_mat_6 = DH.add_sixth_axis(dh_mat)

DH.mat_to_s_param(dh_mat_6, true)

*/

DH.mat_to_s_param = function(dh_mat, print = false){
	var str_array = []
    for(let i = 0; i < dh_mat.length; i++){
    	str_array.push("S JointDH " + (i + 1) + ", "
        	+ Math.round(dh_mat[i][0]/_um) + ", "
            + Math.round(dh_mat[i][1]/_arcsec) + ", "
            + Math.round(dh_mat[i][2]/_um) + ", "
            + Math.round(dh_mat[i][3]/_arcsec) + ";\n"
        )
        if(print){out(str_array[i])}
    }
    return str_array
}

DH.force_to_torque = function(force_vector, J_angles, dh_mat){
	let jac = DH.geometric_jacobian(J_angles, dh_mat)
    let torques 
    if(force_vector.length === 3){
        torques = Vector.matrix_multiply(
            Vector.transpose(Vector.pull(jac, [0, 2], [0, 5])),
            Vector.transpose(force_vector)
        )
    }else if(force_vector.length === 6){
    	torques = Vector.matrix_multiply(
        	Vector.transpose(jac),
            Vector.transpose(force_vector)
        )
    }
    torques = Vector.transpose(torques)
    torques = Vector.multiply(torques, DH.sign_swap)
	return torques
}

DH.torque_to_force = function(torques, angles, dh_mat){
    let jac = DH.geometric_jacobian(angles, dh_mat)
    let T = Vector.multiply(torques.slice(), DH.sign_swap) //t = 1x6 needs to be 6x1 for matrix multiply, sign swap may not be needed 
    let forces = Vector.matrix_multiply(Vector.transpose(Vector.inverse(jac)), Vector.transpose(T))
    return Vector.transpose(forces)
}

/*

var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out", _um*_cm, _arcsec*_rad)

var fp = choose_save_file()
write_file(fp, JSON.stringify(dh_mat))

var dh_mat = [
    [0.2465932006, 93.65331946005284, 0.0038729666, 93.05939542032479],
    [0.0907698793, 91.13789493772651, 0.3380409702, 176.51443339299567],
    [0.06146, -1.8286469423193792, 0.3055877615, -0.36841014339573397],
    [0.0393, 88.92047493197245, 0.0004895402, 89.6277260128728],
    [0.060364807799999996, 89.50574387124725, 0, 90.0000001836389],
    [0.0810977499, 0, 0, -90.0000001836389]
]

L = [
	dh_mat[0][0],
    dh_mat[1][2],
    dh_mat[2][2],
    dh_mat[4][0],
    dh_mat[5][0],
]



var dh_mat_cm = [
    [0.2465932006/_cm, 93.65331946005284, 0.0038729666/_cm, 93.05939542032479],
    [0.0907698793/_cm, 91.13789493772651, 0.3380409702/_cm, 176.51443339299567],
    [0.06146/_cm, -1.8286469423193792, 0.3055877615/_cm, -0.36841014339573397],
    [0.0393/_cm, 88.92047493197245, 0.0004895402/_cm, 89.6277260128728],
    [0.060364807799999996/_cm, 89.50574387124725, 0/_cm, 90.0000001836389],
    [0.0810977499/_cm, 0, 0/_cm, -90.0000001836389]
]


var force = [0, 0, 10, 0, 0, 3]
var J_angles = [0, 45, 90, -45, 0, 0]
//debugger
var torque = DH.force_to_torque(force, J_angles, dh_mat_cm)
inspect(torque)
var force_2 = DH.torque_to_force(torque, J_angles, dh_mat_cm)
inspect(force_2)

*/

DH.cart_vel_to_ang_vel = function(cart_vel, J_angles, dh_mat){
	let jac = DH.geometric_jacobian(J_angles, dh_mat)
    
    let ang_vels 
    if(cart_vel.length === 3){
        ang_vels = Vector.matrix_multiply(
            Vector.transpose(Vector.pull(jac, [0, 2], [0, 5])),
            Vector.transpose(cart_vel)
        )
    }else if(cart_vel.length === 6){
    	ang_vels = Vector.matrix_multiply(Vector.transpose(jac), Vector.transpose(cart_vel))
    }
    ang_vels = Vector.transpose(ang_vels)
    ang_vels = Vector.multiply(ang_vels, DH.sign_swap, _rad)
	return ang_vels
}
/*
var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")

var J_angles = [0, 0, 90, 0, 0, 0]
var cart_vel = [0.5, 0, 0] // (m/s)
var ang_vel = DH.cart_vel_to_ang_vel(cart_vel, J_angles, dh_mat)
inspect(ang_vel)

var fk = DH.forward_kinematics(J_angles, dh_mat)
var xyz_0 = fk[0]
var r_e = Vector.get_DCM_from_pose(fk[2][6])

var dt = 0.1
var xyz_1 = Vector.add(xyz_0, Vector.multiply(cart_vel, dt))
var J_angles_1 = DH.inverse_kinematics(xyz_1, r_e, dh_mat)
var ang_vel_1 = Vector.divide(Vector.subtract(J_angles_1, J_angles), dt)
inspect(ang_vel)


*/

//Adapted from this Python code written by Karime:
//https://github.com/HaddingtonDynamics/OCADO/blob/deca6a246878f19100aa1afcfcdede735e76c6ae/DDE/ForceControl/PositionalAccuracy/Dexter_simulator/scripts/robotModel.py#L412
DH.geometric_jacobian = function(angles, dh_mat){
	let link_n = dh_mat.length
	let A_i_ip1 = Vector.identity_matrix(4)
    let pt_im1 = Vector.make_matrix(4, link_n, 0)
    let pt_0 = Vector.transpose([0, 0, 0, 1])
    let z_0 = Vector.transpose([0, 0, 1])
    let q_angles = angles.slice()
    
    let [pt_e, dir_6, T_global] = DH.forward_kinematics(q_angles, dh_mat)
    
    let g_jacobian = Vector.make_matrix(6, link_n)
    for(let i = 0; i < link_n; i++){
    	for(let j = 0; j < pt_im1.length; j++){
        	pt_im1[j][i] = T_global[i][j][3]
        }
        for(let j = 3; j < 6; j++){
        	g_jacobian[j][i] = T_global[i][j-3][2]
        }
    }
    let a
    for(let i = 0; i < link_n; i++){
    	a = Vector.cross(
        	Vector.transpose(Vector.pull(g_jacobian, [3, 5], [i, i])),
            [...Vector.subtract(pt_e, Vector.transpose(pt_im1)[i].slice(0, 3)), 1]
        )
    	for(let j = 0; j < 3; j++){
        	g_jacobian[j][i] = a[j]
        }
    }
    return g_jacobian
}
/*
var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")

var J_angles = [30, 30, 30, 30, 30]
debugger
var jac = DH.geometric_jacobian(J_angles, dh_mat)

var pt_0 = Vector.transpose([0, 0, 0, 1])
var A = [
	[1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
]
a = Vector.matrix_multiply(A, pt_0)



*/

DH.torques_gravity = function(J_angles, dh_mat, g = [0, 0, -9.81], masses = [1.838, 2.520, 0.288, 0.100, 0.044, 0]){    
    let CoM_local = [
        [0, 182.4*_mm - 246.593*_mm, 37.5*_mm, 1],
        [-61.15*_mm - 339.092*_mm, 0, 100.76*_mm - 90.7698793*_mm, 1],
        [100*_mm - 307.5*_mm, 0, 39.3*_mm - 29.31*_mm, 1],
        [0, 0, 15.59*_mm, 1],
        [0, 0, 30*_mm, 1],
        [0, 0, 0, 1],
    ]
    /*
    let masses = [
        1.838,
        2.520,
        0.288,
        0.100,
        0.044,
        10
    ] // kg
    */
    
    
    
	let fk = DH.forward_kinematics(J_angles, dh_mat)
    let hts = fk[2]
    let CoM_global = []
    let J_xyzs = []
    for(let i = 0; i < CoM_local.length; i++){
    	CoM_global.push(Vector.transpose(Vector.matrix_multiply(hts[i+1], Vector.transpose(CoM_local[i]))).slice(0, 3))
    }
    
    let J_xyz, moment_arm, CoM_sum, rot_axis, force_vector, torque_vector, torque_sum, proj_torque
    let torques = []
    for(let i = 0; i < CoM_local.length; i++){
    	J_xyz = Vector.get_xyz_from_pose(hts[i])
        rot_axis = Vector.transpose(Vector.pull(hts[i], [0, 2], [2, 2]))
        torque_sum = 0
    	for(let j = i; j < CoM_local.length; j++){
        	moment_arm = Vector.subtract(CoM_global[j], J_xyz)
            force_vector = Vector.multiply(masses[j], g)
        	torque_vector = Vector.cross(moment_arm, force_vector)
        	proj_torque = Vector.dot(torque_vector, rot_axis)
        	torque_sum += proj_torque
        }
        torques.push(torque_sum)
    }
    let torque_sign_swap = [-1, -1, 1, 1, -1, 1]
    torques = Vector.multiply(torques, torque_sign_swap)
    return [torques, CoM_global]
}

/*
var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")
//var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat_clean.out")
var J_angles = [0, 0, 0, 0, 0, 0]

var T = DH.torques_gravity(J_angles, dh_mat)
//inspect(Vector.multiply(T, 1/_mm))
inspect(T)

?8
8?

*/







/*
var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")

var force = [10, 0, 0] //N
var J_angles = [0, 0, 90, 0, 0]
debugger
var Ts_jac = DH.force_to_torques_jac(force, J_angles, dh_mat)
var Ts = DH.force_to_torques(force, J_angles, dh_mat)
out(Ts)

[
-3.7475600021236835,
0.37318860797607323,
0.20030288429353235,
0.029624905455625065,
-0.8103307408401627
]

*/

DH.move_to = function(xyz, dir, roll, dh_mat){
	return function(){
    	if(dh_mat === undefined){
        	//total hack to make my code work:
            var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
            var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")
        }

        //var r = Vector.make_dcm

        var T = [
            [-1, 0, 0],
            [0, 0, 1],
            [0, 1, 0]
        ]
        
        DH.last_angles = DH.inverse_kinematics(xyz, T, dh_mat, DH.last_angles) //Also kind of a hack to get the code to work
        if(Vector.max(Vector.abs(DH.last_angles)) > 180){
        	dde_error("Kinematics Failure")
        }
        return Dexter.move_all_joints(DH.last_angles)
    }
}

DH.J_angles_to_xyz = function(J_angles, dh_mat){
	let dh_mat_temp = JSON.parse(JSON.stringify(dh_mat))
	let fk = DH.forward_kinematics(J_angles, dh_mat_temp)
	return {
    	xyz: [fk[2][6][0][3], fk[2][6][1][3], fk[2][6][2][3]],
		dir: [-fk[2][6][0][1], -fk[2][6][1][1], -fk[2][6][2][1]],
        //dh_mat: dh_mat_temp
    }
}
/*
var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")
var J_angles = [0, 0, 90, 0, 0, 0]
var position = DH.J_angles_to_xyz(J_angles, dh_mat)
inspect(position)
*/

DH.xyz_to_J_angles = function(xyz, dir, roll, dh_mat){
	if(dir !== undefined){
    	dde_error("DH.xyz_to_J_angles does not support 'dir' yet, it will default to [0, 0, -1]")
    }
    if(roll !== undefined){
    	dde_error("DH.xyz_to_J_angles does not support 'roll' yet, it will default to 0")
    }
    
    let T = [
        [-1, 0, 0],
        [0, 0, 1],
        [0, 1, 0]
    ]

    DH.last_angles = DH.inverse_kinematics(xyz, T, dh_mat, DH.last_angles) //Kind of a hack, last_angles belongs on robot instance
    if(Vector.max(Vector.abs(DH.last_angles)) > 180){
        dde_error("Kinematics Failure")
    }
    return DH.last_angles
}

/*
var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")
var dh_mat = DH.add_sixth_axis(dh_mat)
var J_angles = DH.xyz_to_J_angles([0, 0.4, 0.5], undefined, undefined, dh_mat).slice(0, 5)
inspect(J_angles)
*/


DH.last_angles = undefined

/*
new Job({
    name: "my_job",
    show_instructions: false,
    do_list: [
        //DH.move_to([(8.5*25)*_mm, 387.5*_mm, 50*_mm])
    ]
})
*/


DH.maintain_force = function(job, xyz, goal_force, dh_mat, lin_fits, mag_thresh = 0.05){
    job.user_data.maintain_force_complete = false
    job.user_data.cur_force_xyz = xyz.slice()
	return Robot.loop(function(){
    	return !job.user_data.maintain_force_complete
    }, function(){
    	let CMD = []
    	let rs = this.robot.robot_status
        this.user_data.meas = [
            rs[Dexter.J1_MEASURED_ANGLE],
            rs[Dexter.J2_MEASURED_ANGLE],
            rs[Dexter.J3_MEASURED_ANGLE],
            rs[Dexter.J4_MEASURED_ANGLE],
            rs[Dexter.J5_MEASURED_ANGLE]
        ]
        this.user_data.step_angles = Vector.multiply(JSON.parse(this.user_data.StepAngles), _arcsec)
        let disps = Vector.subtract(this.user_data.meas, this.user_data.step_angles)
        
        this.user_data.torques = DH.disps_to_torques(disps, lin_fits)
        this.user_data.torques.push(0)
        this.user_data.meas_force = DH.torque_to_force(this.user_data.torques, this.user_data.meas, dh_mat)
        
        let Ps = [-0.1, -0.1, -0.1]
        let force_error = Vector.subtract(goal_force, this.user_data.meas_force.slice(0, 3))
        let d_xyz = Vector.multiply(Ps, force_error, _mm) 
        this.user_data.cur_force_xyz = Vector.add(this.user_data.cur_force_xyz, d_xyz)
        
        //out(Vector.round(this.user_data.meas_force.slice(0, 3), 2), "blue", true)
        let error_mag = Vector.magnitude(force_error)
        
        if(error_mag < mag_thresh){
        	this.user_data.maintain_force_complete = true
            speak("complete")
            out("maintain_force complete!")
            out("Force error magnitude: " + error_mag)
            return
        }

        CMD.push(DH.move_to(this.user_data.cur_force_xyz))
        CMD.push(Dexter.empty_instruction_queue())
        CMD.push(Dexter.read_from_robot("#StepAngles", "StepAngles"))
        CMD.push(Dexter.empty_instruction_queue())
        return CMD
    })
}

DH.disps_to_torques = function(disps, lin_fits){
	let torques = []
	for(let i = 0; i < disps.length; i++){
    	torques.push(lin_fits[i][0][0] * disps[i] + lin_fits[i][1][0])
    }
    return torques
}

//The following is here to patch a bug in some versions of DDE

Vector.DCM_to_quaternion = function(DCM = Vector.make_DCM()){
    	//Algorithm was found here:
        //http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/
    	let trace = DCM[0][0] + DCM[1][1] + DCM[2][2]
        let S, w, x, y, z, quaternion
        if(trace > 0){
        	S = Math.sqrt(1.0 + trace) * 2
			w = .25 * S
            x = (DCM[2][1] - DCM[1][2]) / S
            y = (DCM[0][2] - DCM[2][0]) / S
            z = (DCM[1][0] - DCM[0][1]) / S
        }else if(DCM[0][0] > DCM[1][1] && DCM[0][0] > DCM[2][2]){
        	S = 2 * Math.sqrt(1 + DCM[0][0] - DCM[1][1] - DCM[2][2])
            w = (DCM[2][1] - DCM[1][2]) / S
            x = .25 * S
            y = (DCM[0][1] + DCM[1][0]) / S
            z = (DCM[0][2] + DCM[2][0]) / S
        }else if(DCM[1][1] > DCM[2][2]){
        	S = 2 * Math.sqrt(1 + DCM[1][1] - DCM[0][0] - DCM[2][2])
            w = (DCM[0][2] - DCM[2][0]) / S
            x = (DCM[0][1] + DCM[1][0]) / S
            y = .25 * S
            z = (DCM[1][2] + DCM[2][1]) / S
        }else if(DCM[1][1] > DCM[2][2]){
        	S = 2 * Math.sqrt(1 + DCM[2][2] - DCM[0][0] - DCM[1][1])
            w = (DCM[1][0] - DCM[0][1]) / S
            x = (DCM[0][2] + DCM[2][0]) / S
            y = (DCM[1][2] + DCM[2][1]) / S
            z = .25 * S
        }
    	quaternion = [w, x, y, z]
        return quaternion
    }
/*

var r_des = [
	[0, -1, 0],
    [0, 0, 1],
    [-1, 0, 0]
]
var r_nominal = [
	[-0.85884, -0.28507, -0.42560],
    [-0.47832, 0.14896, 0.86546],
    [-0.18332, 0.94686, -0.26429]
]

debugger
Vector.DCM_to_quaternion(Vector.matrix_multiply(r_des, Vector.transpose(r_nominal)))

should return:
[something, 0.24305, -0.59099, -0.09054]


*/
    
//Patch:
function angles_to_DCM(angles = [0, 0, 0], sequence = "XYZ"){
    //default could be ZX'Z'

    var result = []
    let elt = ""
    for(let char of sequence){
        if(elt.length == 1){
            if(char == "'"){
                elt += char
                result.push(elt)
                elt = ""
            }else{
                result.push(elt)
                elt = char
            }
        }else{
            elt = char
        } 
    }
    if((elt != "'") && (elt.length == 1)){
        result.push(elt)
    }

    let DCM = Vector.identity_matrix(3)
    if(result.length == 3){
        for(var i = 0; i < 3; i++){
            DCM = Vector.rotate_DCM(DCM, result[i], angles[i]) 
        }
    }
    return Vector.transpose(DCM)
}

function quat_to_DCM(quaternion = [1, 0, 0, 0]){
    //Algorithm was found here:
    //http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToMatrix/
    let w = quaternion[0]
    let x = quaternion[1]
    let y = quaternion[2]
    let z = quaternion[3]

    let DCM = Vector.make_matrix(3,3)
    DCM[0][0] = 1-2*y*y-2*z*z
    DCM[1][0] = 2*x*y+2*z*w
    DCM[2][0] = 2*x*z-2*y*w
    DCM[0][1] = 2*x*y-2*z*w
    DCM[1][1] = 1-2*x*x-2*z*z
    DCM[2][1] = 2*y*z+2*x*w
    DCM[0][2] = 2*x*z+2*y*w
    DCM[1][2] = 2*y*z-2*x*w
    DCM[2][2] = 1-2*x*x-2*y*y
    return DCM
}

Vector.make_pose = function(position = [0, 0, 0], orientation = [0, 0, 0], scale_factor = 1, sequence = "ZYX"){
		let dim = Vector.matrix_dimensions(orientation)
        let DCM
        let s = scale_factor
        if(dim[0] === 1 && dim[1] === 3){
        	//Euler Angle
            //DCM = Convert.angles_to_DCM(orientation, sequence)
            DCM = angles_to_DCM(orientation, sequence)
        }else if(dim[0] === 1 && dim[1] === 4){
            //Quaternion
            //DCM = Convert.quat_to_DCM(orientation)
            DCM = quat_to_DCM(orientation)
        }else if(dim[0] === 3 && dim[1] === 3){
        	//DCM
            DCM = orientation
        }else{
        	dde_error("orientation is improperly formatted")
        }
        
        //Please tell me there's a better way to do this:
        let pose = [[s*DCM[0][0], s*DCM[0][1], s*DCM[0][2], position[0]],
        			[s*DCM[1][0], s*DCM[1][1], s*DCM[1][2], position[1]],
                    [s*DCM[2][0], s*DCM[2][1], s*DCM[2][2], position[2]],
                    [0, 0, 0, 1]]
        return pose
	}


/*

Vector.euler_angles_to_DCM = function(euler_angles = [0, 0, 0], euler_sequence = "ZYX"){
    	//default could be ZX'Z'
        let dim = Vector.matrix_dimensions(euler_angles)
        if(dim[0] == 2 && dim[1] == 3){
        	euler_sequence = euler_angles[1]
            euler_angles = euler_angles[0]
        }
        
        var result = []
        let elt = ""
        for(let char of euler_sequence){
        	if(elt.length == 1){
            	if(char == "'"){
                	elt += char
                    result.push(elt)
                    elt = ""
                }else{
                	result.push(elt)
                    elt = char
                }
            }else{
            	elt = char
            } 
        }
        if((elt != "'") && (elt.length == 1)){
        	result.push(elt)
        }
          
        
    	let DCM = Vector.identity_matrix(3)
        if(result.length == 3){
        	for(var i = 0; i < 3; i++){
        	DCM = Vector.rotate_DCM(DCM, result[i], euler_angles[i]) 
            }
        }
        //return Vector.transpose(DCM)
        return DCM
    }

*/

DH.scale_dh_mat = function(dh_mat, length_scale = 1, rotation_scale = 1){
    for(let i = 0; i < dh_mat.length; i++){
    	dh_mat[i][0] *= length_scale
        dh_mat[i][1] *= rotation_scale
        dh_mat[i][2] *= length_scale
        dh_mat[i][3] *= rotation_scale
    }
    return dh_mat
}



//******************************* Acceleration Conversion *********************
// Written by Josh Smith
// Started: 3/1/2023
// Updated: 3/28/2023


DH.sub = {} //all of the sub functions are put here to not polute DH

DH.sub.to_radians = function (degrees) {
  return degrees * (Math.PI / 180);
}
DH.sub.from_radians = function (radians) {
  return radians * (180/Math.PI);
}
DH.sub.dh_to_T = function(dh_params){
    //convert dh parameters to homogenous transformation
	var [d, theta, r, alpha] = dh_params
    var alpha_c = Math.cos(DH.sub.to_radians(alpha))
    var alpha_s = Math.sin(DH.sub.to_radians(alpha))
    var theta_c = Math.cos(DH.sub.to_radians(theta))
    var theta_s = Math.sin(DH.sub.to_radians(theta))
    var result = [[theta_c,-theta_s*alpha_c,theta_s*alpha_s,r*theta_c],
                  [theta_s,theta_c*alpha_c,-theta_c*alpha_s,r*theta_s],
                  [0,alpha_s,alpha_c,d],
                  [0,0,0,1]]
    return result
}
DH.sub.T_to_Ad = function(T){
    //convert homogenoeous matrix to SE3 adjoint
	var R = mathjs.subset(T,mathjs.index([0,1,2],[0,1,2]))
    var p_skew = [[0, -T[2][3], T[1][3]],
                  [T[2][3], 0, -T[0][3]],
                  [-T[1][3], T[0][3], 0]]
    var Ad = mathjs.zeros(6,6)
    Ad.subset(mathjs.index([0,1,2],[0,1,2]),R)
    Ad.subset(mathjs.index([3,4,5],[3,4,5]),R)
    Ad.subset(mathjs.index([0,1,2],[3,4,5]),mathjs.multiply(p_skew,R))
    return Ad
}
DH.sub.qd_to_twist = function(qd, Ad){
    //convert qd to the local twist for a link
	var eta = [0,0,0,0,0,1] // rotation around z axis only due to DH parameters
    var twist = mathjs.multiply(mathjs.inv(Ad),mathjs.multiply(eta,qd))
    return twist
}
DH.sub.twist_to_adj = function(twist){
   //convert 6x1 twist into se3 6x6 adj
   var adj = mathjs.zeros(6,6)
   var v_skew = [[0, -twist[2], twist[1]],
                 [twist[2],0,-twist[0]],
                 [-twist[1],twist[0],0]]
   var w_skew = [[0, -twist[5], twist[4]],
                 [twist[5],0,-twist[3]],
                 [-twist[4],twist[3],0]]
   adj.subset(mathjs.index([0,1,2],[0,1,2]),w_skew)
   adj.subset(mathjs.index([3,4,5],[3,4,5]),w_skew)
   adj.subset(mathjs.index([0,1,2],[3,4,5]),v_skew)
   return adj
}
DH.sub.compute_Jd_body = function(Ad, Adj, J){
    // Jd_i+1 =  Ad_i^-1 * Jd_i - adj_i * Ad_i^-1 * J_i
	var jacobian_dot_acc = (acc => (ad,i) => {acc = mathjs.add(mathjs.multiply(mathjs.inv(ad),acc), mathjs.unaryMinus(mathjs.multiply(Adj[i], mathjs.multiply(mathjs.inv(ad),i>=1?J[i-1]:mathjs.zeros(6,6))))); return acc})(mathjs.zeros(6,6))
    return Ad.map(jacobian_dot_acc)
}
DH.sub.compute_J_body = function(Ad){
    // J_i+1 = Ad_i^-1 * J_i + Ad_i^-1 * [0,0,0,0,0,1]
	var jacobian_acc = (acc => (ad,i) => {acc = mathjs.multiply(mathjs.inv(ad),acc); acc.subset(mathjs.index([0,1,2,3,4,5],i),mathjs.multiply(mathjs.inv(ad),[0,0,0,0,0,1])); return acc})(mathjs.zeros(6,6))
	return Ad.map(jacobian_acc)
}
    
DH.sub.compute_J_wa = function(fk, J){
	//compute body to world aligned frame conversion (no translation only rotation)
    var ee = mathjs.clone(fk[5])
    ee.subset(mathjs.index([0,1,2],[3,4,5]),mathjs.zeros(3,3))
    //convert body jacobian to world aligned
    return mathjs.multiply(ee,J[5])
}

DH.sub.compute_Jd_wa = function(fk, twists, J_wa, Jd){
    //compute body to world aligned frame conversion (no translation only rotation)
    var ee = mathjs.clone(fk[5])
    ee.subset(mathjs.index([0,1,2],[3,4,5]),mathjs.zeros(3,3))
    //compute derivative of conversion from body to world aligned
    var twists_adj = DH.sub.twist_to_adj(mathjs.multiply(ee, twists[5])._data)
    twists_adj.subset(mathjs.index([0,1,2],[3,4,5]),mathjs.zeros(3,3))
    //convert body jacobian derivative to world aligned
    return mathjs.add(mathjs.multiply(ee, Jd[5]), mathjs.multiply(twists_adj, J_wa))
}

DH.sub.compute_Jd = function(fk, twists, Ad, Adj, J, J_wa){
    //compute the body jacobian first
	var Jd = DH.sub.compute_Jd_body(Ad,Adj,J)
    //convert the frame into world aligned
    return DH.sub.compute_Jd_wa(fk,twists, J_wa, Jd)
}

DH.sub.compute_link_states = function(Q_rad, dh_mat){
    //DH parameters to transformation matrices
    var robot_fixed = dh_mat.map((dh_params) => DH.sub.dh_to_T(dh_params))
    //Joint state to transformation matrix
    var robot_joints = Q_rad.map((q,i) => mathjs.matrix([[Math.cos(q), -Math.sin(q),0,0],
                                                         [Math.sin(q), Math.cos(q),0,0],
                                                         [0,0,1,0],
                                                         [0,0,0,1]]))
    //Multiply joint state and dh parameters to get per link FK at robot state Q
    var robot_state = robot_joints.map((T,i) => mathjs.multiply(T,robot_fixed[i]))
    //Transformation matrices to SE3 spatial transform
    var robot_ad = robot_state.map((T) => DH.sub.T_to_Ad(T._data))
    return robot_ad
}

DH.sub.compute_link_twists = function(Q_dot_rad, Ad){
    //convert Q_dot to spatial twists
    var robot_twists = Ad.map((Ad,i) => DH.sub.qd_to_twist(Q_dot_rad[i],Ad))
    //convert twist to se3 lie algebra
    var robot_adj = robot_twists.map((twist) => DH.sub.twist_to_adj(twist._data))
    return [robot_twists,robot_adj]
}

DH.J_accel_to_cart = function(Q, Q_dot, Q_dot_dot, dh_mat){
    var cart_accels = [0, 0, 0, 0, 0, 0]
    //Map Q to radians
    var Q_rad = Vector.multiply(Q, DH.sign_swap).map((q)=>DH.sub.to_radians(q))
    var Q_dot_rad = Vector.multiply(Q_dot, DH.sign_swap).map((q)=>DH.sub.to_radians(q))
    var Q_dot_dot_rad = Vector.multiply(Q_dot_dot, DH.sign_swap).map((q)=>DH.sub.to_radians(q))
    
   	//compute SE3 adjoint and se3 adj
    var Ad = DH.sub.compute_link_states(Q_rad,dh_mat)
    var [twists,adj] = DH.sub.compute_link_twists(Q_dot_rad,Ad)
    
    //cumulatively add up adjoints to fk
    var cumulative_ad = (acc => (ad,i) => {acc = mathjs.multiply(acc,ad);return acc})(mathjs.identity(6,6))
    var fk = Ad.map(cumulative_ad)
    //compute cumulative twist to end effector
    var cumulative_twist = (acc => (twist,i) => {acc = mathjs.add(mathjs.multiply(mathjs.inv(Ad[i]),acc),twist); return acc})([0,0,0,0,0,0])
    var fk_twists = twists.map(cumulative_twist)
    
    //compute body jacobians
	var J_body = DH.sub.compute_J_body(Ad)
    //compute world aligned jacobian
    var J = DH.sub.compute_J_wa(fk, J_body)
    //compute world aligned jacobian derivative
    var Jd = DH.sub.compute_Jd(fk, fk_twists, Ad, adj, J_body, J)
    // xdd = Jqdd + Jd qd
    
    return [mathjs.multiply(J,Q_dot_rad)._data,mathjs.add(mathjs.multiply(J,Q_dot_dot_rad)._data, mathjs.multiply(Jd, Q_dot_rad)._data)]
    //return [mathjs.multiply(J,Q_dot_rad),mathjs.add(mathjs.multiply(J,Q_dot_dot_rad), mathjs.multiply(Jd, Q_dot_rad))]
}
DH.cart_accel_to_J = function(cart_accel, cart_vel, Q, dh_mat){
    //convert Q into radians
    var Q_rad = Vector.multiply(Q, DH.sign_swap).map((q)=>DH.sub.to_radians(q))
    //compute SE3 adjoints
    var Ad = DH.sub.compute_link_states(Q_rad,dh_mat)
    //compute body jacobians
    var J_body = DH.sub.compute_J_body(Ad)
    //cumulatively add up adjoints to fk
    var cumulative_ad = (acc => (ad,i) => {acc = mathjs.multiply(acc,ad);return acc})(mathjs.identity(6,6))
    var fk = Ad.map(cumulative_ad)
    //convert body jacobian to world aligned jacobian
    var J = DH.sub.compute_J_wa(fk, J_body)
    //compute q dot from jacobian inverse (assumed world aligned)
    var Q_dot_rad = mathjs.multiply(mathjs.inv(J), cart_vel)
    
    //compute the se3 adj
    var [twists,adj] = DH.sub.compute_link_twists(Q_dot_rad._data,Ad)
    
    //compute cumulative twist to end effector
    var cumulative_twist = (acc => (twist,i) => {acc = mathjs.add(mathjs.multiply(mathjs.inv(Ad[i]),acc),twist); return acc})([0,0,0,0,0,0])
    var fk_twists = twists.map(cumulative_twist)
    
    //compute the world aligned jacobian derivative
    var Jd = DH.sub.compute_Jd(fk, fk_twists, Ad, adj, J_body, J)
    // qdd = J^-1 (xdd - Jd qd)
    Q_dot_dot_rad = mathjs.multiply(mathjs.inv(J),mathjs.add(cart_accel, mathjs.unaryMinus(mathjs.multiply(Jd, Q_dot_rad))))
    
    //map back to degrees
    return [Vector.multiply(Q_dot_rad.map((qd)=>DH.sub.from_radians(qd))._data,DH.sign_swap),Vector.multiply(Q_dot_dot_rad.map((qdd)=>DH.sub.from_radians(qdd))._data,DH.sign_swap)]
}


/* // Tests for Acceleration Conversion:
//DH params from Dexter HDI-007010 (meters and degrees):
var dh_mat = [
    [0.250101, 91.59388888888888, -0.003545, 85.35805555555555],
    [0.088342, 89.42305555555555, 0.339865, 180.43055555555554],
    [0.06146, -0.018333333333333333, 0.31178, 0.8072222222222222],
    [0.0393, 86.67277777777778, -0.000049, 89.75666666666666],
    [0.055616, 94.56972222222223, 0, 90],
    [0.08295, 0, 0, -90]
]
var range = 60
var lower = -30
var random = function(){ return Math.random()*range + lower }


var error_sum = 0
var N = 10
var start_time = Date.now()
for(let i = 0; i < N; i++){
    var Q = [random(),random(),random(),random(),random(),random()]
    range = 40
    lower = -20
    var Q_dot = [random(),random(),random(),random(),random(),random()]
    var Q_dot_dot = [random(),random(),random(),random(),random(),random()]
    var [cart_vel,cart_acc] = DH.J_accel_to_cart(Q,Q_dot,Q_dot_dot, dh_mat)

    var [Q_dot_computed, Q_dot_dot_computed] = DH.cart_accel_to_J(cart_acc, cart_vel, Q, dh_mat)
    var result = Vector.subtract(Q_dot_dot, Q_dot_dot_computed)
    var error = Vector.max(Vector.abs(result))
    if(error > 1e-7){
    	out()
        out("Error " + error_sum + ":" + error)
        out("Result: " + JSON.stringify(result))
        out("Q: " + JSON.stringify(Q))
        out("Q_dot: " + JSON.stringify(Q_dot))
        out("Q_dot_dot: " + JSON.stringify(Q_dot_dot))
        error_sum++
    }
}
var dur = (Date.now() - start_time)*_ms
out("dur: " + dur)
out("dur/iteration: " + dur/N)
out("Succes Rate: " + 100*(1-error_sum/N) + "%")
out("Goal Success: 99.939%")

//out(mathjs.add(Q_dot_dot, mathjs.unaryMinus(Q_dot_dot_computed))._data)



cart_acc._data = [0, 0, 0, 0, 0, 0]
cart_vel._data = [0, 0, 0, 0, 0, 0]
Q = [0, 0, 0, 0, 0, 0]

var [Q_dot_computed, Q_dot_dot_computed] = DH.cart_accel_to_J(cart_acc, cart_vel, Q, dh_mat)
out(Q_dot_dot_computed)
out(mathjs.add(Q_dot_dot, mathjs.unaryMinus(Q_dot_dot_computed)))


var [Q_dot_computed, Q_dot_dot_computed] = DH.cart_accel_to_J(cart_acc, cart_vel, Q, dh_mat)

var [cart_vel,cart_acc] = DH.J_accel_to_cart(Q,Q_dot,Q_dot_dot, dh_mat)

*/



//******************************* End of Acceleration Conversion *********************





