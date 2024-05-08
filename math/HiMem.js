
var HiMem = {}
globalThis.HiMem = HiMem

HiMem.bin_to_obj = function(hi_mem_bin, axis_cal = [-0.24691358024691357, -0.24691358024691357, -0.24691358024691357, -0.06666666666666667, -0.06666666666666667], n_eyes = [200, 180, 157, 113, 100]){
	let hi_mem_array = HiMem.bin_to_array(hi_mem_bin)
	let hi_mem_obj = HiMem.array_to_obj(hi_mem_array, axis_cal, n_eyes)
    return hi_mem_obj
}

HiMem.obj_to_bin = function(hi_mem_obj, axis_cal = [-0.24691358024691357, -0.24691358024691357, -0.24691358024691357, -0.06666666666666667, -0.06666666666666667], n_eyes = [200, 180, 157, 113, 100]){
	let hi_mem_array = HiMem.obj_to_array(hi_mem_obj, axis_cal, n_eyes)
	let hi_mem_bin = HiMem.array_to_bin(hi_mem_array)
    return hi_mem_bin
}

HiMem.array_to_obj = function(hi_mem_array, axis_cal = [-0.24691358024691357, -0.24691358024691357, -0.24691358024691357, -0.06666666666666667, -0.06666666666666667], n_eyes = [200, 180, 157, 113, 100]){
    let r = Math.pow(2, 19)
    let half_r = Math.round(r/2)
	let ranges = [
		[3*r, 4*r], //J1 = J1
    	[5*r, 6*r], //J2 = J3
        [4*r, 5*r], //J3 = J2
    	[7*r, 8*r], //J5 = J4
        [6*r, 7*r]  //J4 = J5
	]

    let js = []
    for(let i = 0; i < 5; i++){
    	js.push({
        	x: Vector.make_matrix(1, r)[0],
            y: Vector.make_matrix(1, r)[0]
        })
    }
    
    let temp
    for(let i = 0; i < ranges.length; i++){
    	temp = hi_mem_array.slice(ranges[i][0], ranges[i][1])
        for(let j = 0; j < half_r; j++){
        	js[i].x[j] = (j - half_r) / (axis_cal[i] * 3600)
        	js[i].y[j] = temp[j + half_r] / (40 * n_eyes[i] * 360 * 2)
        }
        for(let j = half_r; j < r; j++){
        	js[i].x[j] = (j - half_r) / (axis_cal[i] * 3600)
        	js[i].y[j] = temp[j - half_r] / (40 * n_eyes[i] * 360 * 2)
        }
    }
    
    return js
}

HiMem.bin_to_array = function hi_mem_bin_to_array(hi_mem_bin){
	let addr, four
    let result = Vector.make_matrix(1, hi_mem_bin.length/4)[0]
    for(let i = 0; i<hi_mem_bin.length/4;i++){
  		addr = i * 4
  		four = hi_mem_bin.slice(addr, addr+4)
  		result[i] = (four[0].charCodeAt(0)+four[1].charCodeAt(0)*256+four[2].charCodeAt(0)*256*256+four[3].charCodeAt(0)*256*256*256) >> 0
	}
    return result
}

HiMem.obj_to_array = function(hi_mem_obj, axis_cal = [-0.24691358024691357, -0.24691358024691357, -0.24691358024691357, -0.06666666666666667, -0.06666666666666667], n_eyes = [200, 180, 157, 113, 100]){
    let r = Math.pow(2, 19)
    let half_r = Math.round(r/2)
	let ranges = [
		[3*r, 4*r], //J1 = J1
    	[5*r, 6*r], //J2 = J3
        [4*r, 5*r], //J3 = J2
    	[7*r, 8*r], //J5 = J4
        [6*r, 7*r]  //J4 = J5
	]

    let array = Vector.make_matrix(1, 8*r)[0]
    let low, hi, enc_per_deg
    for(let i = 0; i < ranges.length; i++){
    	low = ranges[i][0]
        hi = ranges[i][1]
        enc_per_deg = 40 * n_eyes[i] * 360 * 2
    	for(let j = low; j < low + half_r; j++){
        	array[j] = Math.round(hi_mem_obj[i].y[j - low + half_r] * enc_per_deg)
        }
        for(let j = low + half_r; j < hi; j++){
        	array[j] = Math.round(hi_mem_obj[i].y[j - low - half_r] * enc_per_deg)
        }
    }
    
    return array
}

HiMem.array_to_bin = function(hi_mem_array){
	let num_array
    let bin = "" //TODO pre-allocate
    for(let i = 0; i< hi_mem_array.length;i++){
    	num_array = []
    	for(let j = 0; j < 4; j++){
        	num_array.push(Math.round(hi_mem_array[i]) >> (8 * j) & 255)
    	}
  		bin += String.fromCharCode(...num_array)
    }
    return bin
}

function scrolling_plot(x_data, y_data, title = "Plot", dim = [300, 300], color = "white", position = [200, 200]){
	let show_window_id = window[title + "_id"]
    
    let points = []
    if(x_data === undefined){
    	x_data = []
    	for(let i = 0; i < y_data.length; i++){
        	x_data.push(i)
        }
    }
    let lim = [Vector.max(x_data)-Vector.min(x_data), Vector.max(y_data)-Vector.min(y_data)]
    
    
    let scale
    if(!show_window_id){
    	scale = [dim[0]/lim[0], dim[1]/lim[1]]
    }else{
    	
        scale = [dim[0]/lim[0], dim[1]/lim[1]]
    }
    let center = [-scale[0]*Vector.min(x_data), -scale[1]*Vector.min(y_data)]
    for(let i = 0; i < x_data.length; i++){
    	points.push([scale[0]*x_data[i] + center[0], -(scale[1]*y_data[i]+center[1])+dim[1]])
    }
    
    if(!show_window_id){
    	show_window({
        	title: title,
      		content: svg_svg({
            	id: title + "_id",
                x: position[0],
                y: position[1],
                height: dim[1],
                width: dim[0],
                child_elements: [
                	svg_line({
                    	x1: 0,
                        x2: dim[0],
                        y1: -center[1]+dim[1],
                        y2: -center[1]+dim[1],
                        color: "#4f4f4f",
                        width: 1,
                        html_class: title + "_layer_id",
                    }),
                	svg_polyline({
                    	points: points,
                        color: color,
                        width: 1,
                        html_class: title + "_layer_id",
                    })
         		]
            }),
      		width: 10+dim[0],
      		height: 50+dim[1],
      		x: 1270-(10+dim[0]),
      		y: 0,
            background_color: "black"
		})
    }else{
    	$("." + title + "_layer_id").remove()
        append_in_ui(
        	title + "_id",
        	svg_line({
            	x1: 0,
                x2: dim[0],
                y1: -center[1]+dim[1],
                y2: -center[1]+dim[1],
                color: "#4f4f4f",
                width: 1,
                html_class: title + "_layer_id",
             })
        )
        append_in_ui(
        	title + "_id",
        	svg_polyline({
                points: points,
                color: color,
                width: 1,
                html_class: title + "_layer_id",
            })
        )
        
        
    }
}

HiMem.plot_array = function(hi_mem_array){
	scrolling_plot(undefined, hi_mem_array, "hi_mem_array", [1200, 400])
}

HiMem.plot_obj = function(hi_mem_objs = [], J_num, names = []){
	let color_array = [
        "red",
        "green",
        "blue",
        "magenta",
        "cyan",
        "black",
        "brown",
        "chartreuse",
	]

    let plot_data = []
    for(let i = 0; i < hi_mem_objs.length; i++){
    	if(!names[i]){
        	names[i] = "data_" + i
        }
        plot_data.push({
        	type: "scatter",
  			name: names[i],
  			mode: "lines",
  			x: hi_mem_objs[i][J_num].x,
  			y: hi_mem_objs[i][J_num].y,
            marker: {
           		color: color_array[i]
            }
  		})
    }
    
    let title = "HiMem J" + (J_num + 1)
    Plot.show(
    	title,
        plot_data,
        {
        	title:  title,
            //xaxis:  {title: {text: 'Displacement (degrees)'}},
            //yaxis:  {title: {text: 'Torque (Nm)'}}
        },
        undefined,
        undefined,
        {
        	width: 1000,
            height: 300
        }
    )
}

HiMem.save_obj = function(hi_mem_obj, file_path = "C:\\Users\\james\\Documents\\dde_apps\\2020\\Code\\MoveWithForce\\cal_table.json"){
	let obj_content = JSON.stringify(hi_mem_obj)
	write_file(file_path, obj_content)
}

HiMem.save_array = function(hi_mem_array, file_path = "C:\\Users\\james\\Documents\\dde_apps\\2020\\Code\\MoveWithForce\\HiMem_array.json"){
	let obj_content = JSON.stringify(hi_mem_array)
	write_file(file_path, obj_content)
}

HiMem.save_bin = function(hi_mem_bin, file_path = "C:\\Users\\james\\Documents\\dde_apps\\2020\\Code\\MoveWithForce\\Corrected_HiMem\\HiMem.dta"){
	write_file(file_path, hi_mem_bin, "ascii")
}

HiMem.linear_transform = function(obj_axis, m, b, range = null){
    if(range == null){
    	range = {idx: [0, obj_axis.x.length]}
    }
    let x, y
	for(let i = range.idx[0]; i < range.idx[1]; i++){
    	x = obj_axis.x[i]
        obj_axis.y[i] = obj_axis.y[i] + (m*x + b)
    }
    return obj_axis
}

HiMem.linear_transforms = function(obj, ms, bs, ranges = null){
	let result = []
    if(ranges == null){
    	ranges = []
        for(let i = 0; i < obj.length; i++){ranges.push({idx: [0, obj[i].x.length]})}
    }
	for(let i = 0; i < obj.length; i++){
    	result.push(HiMem.linear_transform(obj[i], ms[i], bs[i], ranges[i]))
    }
    return result
}

HiMem.get_range = function(obj_axis){
	let chunks = []
	for(let i = 1; i < obj_axis.y.length; i++){
    	if(Math.sign(obj_axis.y[i-1]) != Math.sign(obj_axis.y[i])){
    		chunks.push(i)
		}
	}
    let low = chunks[0]
    let hi = chunks[chunks.length-1]
    return {
    	idx: [low, hi],
        deg: [obj_axis.x[hi], obj_axis.x[low]], // hi and low are swapped because axis cal is negative
        chunks: chunks
    }
}

HiMem.get_ranges = function(obj){
	let result = []
	for(let i = 0; i < obj.length; i++){
    	result.push(HiMem.get_range(obj[i]))
    }
    return result
}

HiMem.linear_fits = function(obj, ranges = null){
	let results = {ms: [], bs: []}
    if(ranges == null){
    	ranges = []
        for(let i = 0; i < obj.length; i++){ranges.push({idx: [0, obj[i].x.length]})}
    }
    let x, y, res
	for(let i = 0; i < obj.length; i++){
    	x = obj[i].x.slice(ranges[i].idx[0], ranges[i].idx[1])
        y = obj[i].y.slice(ranges[i].idx[0], ranges[i].idx[1])
        res = Vector.transpose(Vector.poly_fit(x, y, 1))
        results.ms.push(res[0])
        results.bs.push(res[1])
    }
    return results
}

HiMem.horizontal_shift = function(obj_axis, shift_deg){
	let idx_shift = Math.round(shift_deg / (obj_axis.x[1] - obj_axis.x[0]))
    let temp = Vector.make_matrix(1, obj_axis.y.length)[0]
    let idx
    for(let i = 0; i < obj_axis.y.length; i++){
    	idx = i - idx_shift
    	if(0 <= idx && idx < obj_axis.y.length){
        	temp[i] = obj_axis.y[idx]
        }
    }
    return {
    	x: obj_axis.x.slice(),
    	y: temp
    }
}



/*
var hi_mem_bin = file_content("C:/Users/james/Documents/dde_apps/2020/Code/MoveWithForce/JamesW_1_9_21/HiMem.dta", "binary")
var hi_mem_obj = HiMem.bin_to_obj(hi_mem_bin)
var ranges = HiMem.get_ranges(hi_mem_obj)
var lin_fits = HiMem.linear_fits(hi_mem_obj, ranges)
*/



//Correct Slope:
/*
var vertical_shifts = []
var slope_changes = []
for(let i = 0; i < 5; i++){
	vertical_shifts.push(0)
	slope_changes.push(1 - lin_fits.ms[i])
}
var hi_mem_obj = HiMem.linear_transforms(hi_mem_obj, slope_changes, vertical_shifts, ranges)
var lin_fits = HiMem.linear_fits(hi_mem_obj, ranges)
*/

//var J = 2
//hi_mem_obj[J] = HiMem.linear_transform(hi_mem_obj[J], 2 - lin_fits.ms[J], 0, ranges[J])

/*
//Vertical Shift (zeoring y intercept)
vertical_shifts = []
slope_changes = []
for(let i = 0; i < 5; i++){
	vertical_shifts.push(-lin_fits.bs[i])
	slope_changes.push(0)
}
var hi_mem_obj = HiMem.linear_transforms(hi_mem_obj, slope_changes, vertical_shifts, ranges)
var lin_fits = HiMem.linear_fits(hi_mem_obj, ranges) //inspect the values
*/


//Horizontal Shift (zeoring x intercept)
//var deg_shift = -90
//hi_mem_obj[2] = HiMem.horizontal_shift(hi_mem_obj[2], deg_shift)
//hi_mem_obj[2] = HiMem.linear_transform(hi_mem_obj[2], 0, deg_shift, ranges[2])


/*
horizontal_shifts = []
slope_changes = []
for(let i = 0; i < 5; i++){
	horizontal_shifts.push(-lin_fits.bs[i] / lin_fits.ms[i])
	slope_changes.push(0)
}
*/
//var hi_mem_obj = HiMem.linear_transforms(hi_mem_obj, slope_changes, vertical_shifts, ranges)
//var lin_fits = HiMem.linear_fits(hi_mem_obj, ranges) //inspect the values


//HiMem.plot_array(hi_mem_array_3)

/*
//Zero out Slope:
var vertical_shifts = []
var slope_changes = []
for(let i = 0; i < 5; i++){
	vertical_shifts.push(-lin_fits.bs[i])
	slope_changes.push(-lin_fits.ms[i])
}
var hi_mem_obj = HiMem.linear_transforms(hi_mem_obj, slope_changes, vertical_shifts, ranges)
var lin_fits = HiMem.linear_fits(hi_mem_obj, ranges)
*/


//Output:
/*
var hi_mem_bin = HiMem.obj_to_bin(hi_mem_obj)
var hi_mem_array = HiMem.obj_to_array(hi_mem_obj)
HiMem.save_obj(hi_mem_obj, "C:\\Users\\james\\Documents\\dde_apps\\2020\\Code\\MoveWithForce\\HiMem_array.json")
var array_filename = "HiMem_array_0.json"
HiMem.save_array(hi_mem_array, "C:\\Users\\james\\Documents\\dde_apps\\2020\\Code\\MoveWithForce\\data_dump\\" + array_filename)
HiMem.save_bin(hi_mem_bin)
*/

//Testing:
//var hi_mem_bin_2 = file_content("C:/Users/james/Documents/dde_apps/2020/Code/MoveWithForce/Corrected_HiMem/HiMem.dta", "binary")
//var hi_mem_obj_2 = HiMem.bin_to_obj(hi_mem_bin_2)
//HiMem.save_obj(hi_mem_obj_2, "C:\\Users\\james\\Documents\\dde_apps\\2020\\Code\\MoveWithForce\\HiMem_obj.json")



