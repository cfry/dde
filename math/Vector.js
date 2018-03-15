//Vector Class
//Vector and Matrix math functions
//James Wigglesworth
//Started: 6_18_16
//Updated: 1_20_17


//Public
var Vector = new function(){
//The Vector Class contains functions for manipulating the following:
/*

 Name        |    Variable    |    Syntax    |       Example        |     Description
 point               U           [x, y, z]          [1, 2, 3]           Defines a 3D position. Default units are microns.
 vector              Uab         [x, y, z]          [1, 2, 3]           Defines a 3D direction and magnitude. Uab = Ua-Ub.
 unit vector         V           [x, y, z]        [0, .707, .707]       Defines a 3D direction. Magnitude is scaled to be 1.
 plane               P           [x, y, z, d]    [0, .707, .707, 5]     Unit vector perpendicular to plane and distance from the origin.
 
*/

    this.size = function(a){
    	
    	if (a === undefined){
        	out("Error: input to function 'size()' is undefined", "red")
            return
        }
        if (a === null){
        	out("Error: input to function 'size()' is null:")
            return
        }
        
        if (typeof(a) == "number"){
        	return 1
        }
		//debugger
    	let temp_size = a.length
        
        
        if (temp_size === undefined){
        	return 1
        }else{
        /*
        	let a_temp = a
        	let result = []
        	let i = 0
        	while (a_temp !== undefined){
        		i++
        		result.push(a_temp.length)
            	a_temp = a[i]
        	}*/
        	return temp_size
        }
    }
    
    this.max = function(array){
    	let dim = Vector.matrix_dimensions(array)
        let max = -Infinity
        for(let i = 0; i < dim[0]; i++){
        	for(let j = 0; j < dim[0]; j++){
        		if(array[i][j] > max){
                	max = array[i][j]
                }
        	}
        }
        return max
    }
    
    this.min = function(array){
    	let dim = Vector.matrix_dimensions(array)
        let min = Infinity
        for(let i = 0; i < dim[0]; i++){
        	for(let j = 0; j < dim[0]; j++){
        		if(array[i][j] < max){
                	min = array[i][j]
                }
        	}
        }
        return min
    }
    
    
    //Vector.size([0, 0, 1])

    //Public
    //Returns the unit vector of the input
    //Works for both 2D and 3D vectors
    this.normalize = function(vector){
    	let magnitude = Vector.magnitude(vector)
        return Vector.divide(vector, magnitude)
    }
    
    
    //Public
    //Returns the dot product of two arrays
    //Will work for arrays of any equal length
    this.dot = function(vector_A, vector_B){
    	var A_size = Vector.size(vector_A)
        var B_size = Vector.size(vector_B)
        var point, plane
        var product = 0
        if (A_size === B_size){
        	if(A_size == 1){
            	return vector_A*vector_B
            }
        	for(var i = 0; i < Math.min(A_size, B_size); i++){
        		product += vector_A[i] * vector_B[i]
        	}
        	
        }else{
        	if (A_size === 3 && B_size === 4){
            	point = [vector_A[0], vector_A[1], vector_A[2], 1]
                plane = vector_B
            }else{
            	if (A_size === 4 && B_size === 3){
                	point = [vector_B[0], vector_B[1], vector_B[2], 1]
                	plane = vector_A
                }else{
                	if (A_size === 3 && B_size === 4){
                		point = [vector_A[0], vector_A[1], vector_A[2], 1]
                		plane = vector_B
                    }else{
                    	if(vector_A[0].length == vector_B.length){
                        	for(var i = 0; i < vector_A[0].length; i++){
        						product += vector_A[0][i] * vector_B[i]
        					}
                            return product
                        }else{
                        	if(vector_B[0].length == vector_A.length){
                            	for(var i = 0; i < vector_B[0].length; i++){
        							product += vector_A[i] * vector_B[0][i]
        						}
                            }else{
                				out("Error: Reconsider the input size in the function 'Vector.dot()'", "red")
                    			return null
                            }
                        }
                	}
                }
            }
            
        	for(var i = 0; i < 4; i++){
        		product += point[i] * plane[i]
        	}
        }
        return product
    }
    
    //Public
    //Returns the cross product of two vectors
    //Vectors must be equal lengths
    this.cross = function(vector_A, vector_B){
		var A_size = vector_A.length
    	var B_size = vector_B.length
    	var mat_size = Math.min(A_size, B_size)
    	var vector_C = new Array(mat_size)
    	for(var i = 0; i < mat_size; i++){
      		vector_C[i] = (vector_A[(i + 1) % mat_size] * vector_B[(i + 2) % mat_size]) - (vector_A[(i + 2) % mat_size] * vector_B[(i + 1) % mat_size])
    	}
      	return vector_C
	}
    
    //*************************************************
    
    
	//Public
    //This is used to add vectors of equal length
    //Can also add scalars to each element in vector
    //unlimited number of inputs args
    this.add = function(...args){
        let temp_args = Convert.deep_copy(args)
        var sum = temp_args[0]
        
    	for(let i = 1; i < Vector.size(arguments); i++){
        	if (Vector.size(arguments[i]) === Vector.size(sum)){
				if (Vector.size(sum) === 1){
                	sum += arguments[i]
                }else{
                	for(let j = 0; j < Vector.size(sum); j++){
                		sum[j] += arguments[i][j]
                	}
                }
            	
            }else{
            	if (Vector.size(arguments[i]) === 1){
                	for(let j = 0; j < Vector.size(sum); j++){
                		sum[j] += arguments[i]
                	}
                }else{
                	if (Vector.size(sum) === 1){
                    var temp = sum
                    sum = arguments[i]
                		for(var j = 0; j < Vector.size(sum); j++){
                			sum[j] += temp
                        }
                	}else{
                    	let dim_1 = Vector.matrix_dimensions(sum)
                        let dim_2 = Vector.matrix_dimensions(arguments[i])
                        if(dim_1[0] == 1 && dim_1[1] == dim_2[1]){
                        	let shift_vector = sum
                            sum = arguments[i]
                            for(let m = 0; m < dim_2[0]; m++){
                            	sum[m] = Vector.add(sum[m], shift_vector)
                            }
                        }else if(dim_2[0] == 1 && dim_2[1] == dim_1[1]){
                        	let shift_vector = arguments[i]
                            for(let m = 0; m < dim_1[0]; m++){
                            	sum[m] = Vector.add(sum[m], shift_vector)
                            }
                        }else{
                    		dde_error("Error: inputs to function 'add()' are not correct sizes", "red")
                        }
                    }
                }
            }
        }
        return sum
        
    }
    
    
    
    //Public
    //This is used to subtract vectors of equal length
    //Can also add scalars to each element in vector
    //unlimited number of inputs args
    this.subtract = function(){
        let temp_args = Convert.deep_copy(arguments)
        var sum = temp_args[0]
        
    	for(var i = 1; i < Vector.size(temp_args); i++){
        	if (Vector.size(temp_args[i]) === Vector.size(sum)){
				if (Vector.size(sum) === 1){
                	sum -= temp_args[i]
                }else{
                	for(var j = 0; j < Vector.size(sum); j++){
                		sum[j] -= temp_args[i][j]
                	}
                }
            	
            }else{
            	if (Vector.size(temp_args[i]) === 1){
                	for(var j = 0; j < Vector.size(sum); j++){
                		sum[j] -= temp_args[i]
                	}
                }else{
                	if (Vector.size(sum) === 1){
                    var temp = sum
                    sum = temp_args[i]
                		for(var j = 0; j < Vector.size(sum); j++){
                			sum[j] -= temp
                        }
                	}else{
                    	out("Error: inputs to function 'add()' are not correct sizes", "red")
                    }
                }
            }
        }
        return sum
    }
        
    //Public
    //This should be re-written in a more clever way....
    this.multiply = function(...args){
        if (args === undefined){
        	out("Error: the function 'Vector.multiply' has undefined inputs")
        }
        
        let temp_args = Convert.deep_copy(args)
        var product = temp_args[0]

    	for(var i = 1; i < Vector.size(args); i++){
        	let temp_arg = args[i]
        	var temp_arg_size = Vector.size(temp_arg)
        	var product_size = Vector.size(product)
        	if (product_size === 1 && temp_arg_size === 1){
        		product *= temp_arg
        	}else{
        		if (temp_arg_size === product_size){
					for(var j = 0; j < temp_arg_size; j++){
            			var arg_element_length = Vector.size(temp_arg[j])
                    	var product_element_length = Vector.size(product[j])
            			if (arg_element_length === 1 && arg_element_length === 1){
							product[j] *= temp_arg[j]
						}else{
                    		if (arg_element_length === product_element_length){
								for(var k = 0; k < arg_element_length; k++){
									product[j][k] *= temp_arg[j][k]
								}
                        	}else{
                        		if (arg_element_length === 1){
                            		for(var k = 0; k < product_element_length; k++){
                                		product[j][k] *= temp_arg[j]
                                	}
                            	}
                            	if (product_element_length === 1){
                            		var product_element_val = product[j]
                            		for(var k = 0; k < arg_element_length; k++){
                                		product[j][k] = temp_arg[j][k] * product_element_val
                                	}
                            	}
                        	}
            			}
          			}
        		}else{
                	if (Vector.size(temp_arg) === 1){
                		for(var j = 0; j < Vector.size(product); j++){ 
                        	if (Vector.size(product[j]) === 1){
                        		product[j] *= temp_arg
                        	}else{
                        		for(var k = 0; k < product[j].length; k++){
                            		product[j][k] *= temp_arg
                            	}
                        	}
                        }
                	}else{
                		if (Vector.size(product) === 1){
                    		var temp = product
                    		product = temp_arg.slice(0)
                			for(var j = 0; j < Vector.size(product); j++){
                				if (Vector.size(product[j]) === 1){
                        			product[j] *= temp
                        		}else{
                        			for(var k = 0; k < product[j].length; k++){
                            			product[j][k] *= temp
                            		}
                        		}
                    		}
                		}else{
                    		out("Error: inputs to function 'add()' are not correct sizes", "red")
                    	}
                	}
            	}
        	}
    	}
        return product
    }
    /*
    var pose_1 = [[1, 0, 0, 10], 
			     [0, 1, 0, 20],
			     [0, 0, 1, 30],
			     [0, 0, 0,  1]]
		var pose_2 = [[1, 0, 0, 100], 
			     [0, 1, 0, 200],
			     [0, 0, 1, 300],
			     [0, 0, 0,  1]]
		var result_1 = Vector.matrix_multiply(pose_1, pose_2)
        var result_2 = Vector.matrix_multiply(pose_2, pose_1)
    */
    
    //Public
    this.divide = function(...args){
        if (args === undefined){
        	out("Error: the function 'Vector.divide' has undefined inputs")
        }
        
        let temp_args = Convert.deep_copy(args)
        var quotient = temp_args[0]

    	for(var i = 1; i < Vector.size(args); i++){
        	let temp_arg = args[i]
        	var temp_arg_size = Vector.size(temp_arg)
        	var quotient_size = Vector.size(quotient)
        	if (quotient_size === 1 && temp_arg_size === 1){
        		quotient /= temp_arg
        	}else{
        		if (temp_arg_size === quotient_size){
					for(var j = 0; j < temp_arg_size; j++){
            			var arg_element_length = Vector.size(temp_arg[j])
                    	var quotient_element_length = Vector.size(quotient[j])
            			if (arg_element_length === 1 && arg_element_length === 1){
							quotient[j] /= temp_arg[j]
						}else{
                    		if (arg_element_length === quotient_element_length){
								for(var k = 0; k < arg_element_length; k++){
									quotient[j][k] /= temp_arg[j][k]
								}
                        	}else{
                        		if (arg_element_length === 1){
                            		for(var k = 0; k < quotient_element_length; k++){
                                		quotient[j][k] /= temp_arg[j]
                                	}
                            	}
                            	if (quotient_element_length === 1){
                            		var quotient_element_val = product[j]
                            		for(var k = 0; k < arg_element_length; k++){
                                		quotient[j][k] = quotient_element_val / temp_arg[j][k]
                                	}
                            	}
                        	}
            			}
          			}
        		}else{
                	if (Vector.size(temp_arg) === 1){
                		for(var j = 0; j < Vector.size(quotient); j++){ 
                        	if (Vector.size(quotient[j]) === 1){
                        		quotient[j] /= temp_arg
                        	}else{
                        		for(var k = 0; k < quotient[j].length; k++){
                            		quotient[j][k] /= temp_arg
                            	}
                        	}
                        }
                	}else{
                		if (Vector.size(quotient) === 1){
                    		var temp = quotient
                    		quotient = temp_arg.slice(0)
                			for(var j = 0; j < Vector.size(quotient); j++){
                				if (Vector.size(quotient[j]) === 1){
                        			quotient[j] = temp / quotient[j]
                        		}else{
                        			for(var k = 0; k < quotient[j].length; k++){
                            			quotient[j][k] = temp / quotient[j][k]
                            		}
                        		}
                    		}
                		}else{
                    		out("Error: inputs to function 'add()' are not correct sizes", "red")
                    	}
                	}
            	}
        	}
    	}
        return quotient
    }
    /*
    var pose_1 = [[1, 0, 0, 10], 
			     [0, 1, 0, 20],
			     [0, 0, 1, 30],
			     [0, 0, 0,  1]]
		var pose_2 = [[1, 0, 0, 100], 
			     [0, 1, 0, 200],
			     [0, 0, 1, 300],
			     [0, 0, 0,  1]]
		var result_1 = Vector.matrix_divide(pose_1, pose_2)
        var result_2 = Vector.matrix_divide(pose_2, pose_1)
    */
    
    /*
    debugger
    Vector.average([1, 2, 3])
    */
    
    
    this.average = function(...args){
    	let temp_args = Convert.deep_copy(args)
        let sum
        if(temp_args.length == 1){
        	sum = temp_args[0][0]
        	for(let i = 1; i < temp_args[0].length; i++){
            	sum += temp_args[0][i]
            }
            return sum/temp_args[0].length
        }
        
        sum = temp_args[0]
    	for(var i = 1; i < Vector.size(arguments); i++){
        	if (Vector.size(arguments[i]) === Vector.size(sum)){
				if (Vector.size(sum) === 1){
                	sum += arguments[i]
                }else{
                	for(var j = 0; j < Vector.size(sum); j++){
                		sum[j] += arguments[i][j]
                	}
                }
            	
            }else{
            	if (Vector.size(arguments[i]) === 1){
                	for(var j = 0; j < Vector.size(sum); j++){
                		sum[j] += arguments[i]
                	}
                }else{
                	if (Vector.size(sum) === 1){
                    var temp = sum
                    sum = arguments[i]
                		for(var j = 0; j < Vector.size(sum); j++){
                			sum[j] += temp
                        }
                	}else{
                    	out("Error: inputs to function 'add()' are not correct sizes", "red")
                    }
                }
            }
        }
        return Vector.divide(sum, args.length)
    }
    //Vector.average([2, 2], [4, 4])
    
    //Private
    function dist_point_to_plane(point, plane){
    	if (Vector.size(plane) !== 4){
        	out("Error: Complete the plane by using the function 'Vector.complete_plane(vector, point)'")
            return null
        }
    	return -Vector.dot(point, plane)
    }
    
	//Private
    function dist_point_to_line(point, line_point_A, line_point_B){
		var term1 = Vector.subtract(point, line_point_A)
    	var term2 = Vector.subtract(point, line_point_B)
    	var term3 = Vector.subtract(line_point_B, line_point_A)
    	var d = Vector.distance(Vector.cross(term1, term2)) / Vector.distance(term3)
    	return d
	}
    
	
    
    //Public
	this.distance = function() {
    	/*SYNTAX:
        	Kin.distance(POINT)        -> distance between point and origin / magnitude of VECTOR
            Kin.distance(POINT, POINT) -> distance between points
            Kin.distance(PLANE, POINT) -> distance between plane and point
            Kin.distance(POINT, PLANE) -> distance between point and point
        */
        var temp_args = Convert.deep_copy(arguments)
        
        
        switch(Vector.size(arguments)){
            
        	case 1:
            	var a = temp_args[0]
            	switch(Vector.size(a)){
					case 2:
                    	//magnitude of 2D vector
                    	return Math.hypot(a[0], a[1])
                 	case 3:
						//magnitude of 3D vector
						return Math.hypot(a[0], a[1], a[2])
					case 4:
						//distance between plane and origin
						return a[4]
					default:
						out("Error: single vector input to function 'distance()' must have a size of 2, 3, or 4", "red")
						return null
             	}
				break
                
                
            case 2:
            	var a = arguments[0].slice(0)
                var b = arguments[1].slice(0)
            	var aL = Vector.size(a)
                var bL = Vector.size(b)
                var point
                var plane
            	if (aL === 2 && bL === 2){
                	return Math.hypot(a[0] - b[0], a[1] - b[1])
                }
            	if (aL === 3 && bL === 3){
                	return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
                }else{
                	if (aL === 3 && bL === 4){
                    	point = a
                        plane = b
                    }else{
                    	if (aL === 4 && bL === 3){
                        	plane = a
                            point = b
                        }else{
                        	out("Error: inputs for function 'distance()' must be a point, plane, or vector", "red")
                            return null
                        }
                    }
					return dist_point_to_plane(point, plane)
                }
                break
                
            case 3:
                point = arguments[0].slice(0)
                var line_point_A = arguments[1].slice(0)
                var line_point_B = arguments[2].slice(0)
                if (Vector.size(point) === 3 && Vector.size(line_point_A) === 3 && Vector.size(line_point_B) === 3){
            		return dist_point_to_line(point, line_point_A, line_point_B)
                }
            	break
            
            default:
            	let sum = 0
            	for(var i = 0; i < temp_args.length; i++){
                	sum += temp_args[i] * temp_args[i]
                }
            	return Math.sqrt(sum)
        }

    }
    
    this.magnitude = function(vector){
    	if(vector.length == undefined){
        	return vector
        }
    	let sum = 0
        for(var i = 0; i < vector.length; i++){
          sum += vector[i] * vector[i]
        }
      	return Math.sqrt(sum)
    }
    
    //Public
    this.complete_plane = function(plane, point){
    	if (Vector.size(plane) === 3){
        	var vector = Vector.normalize(plane)
        	var d = Vector.dot(vector, point)
            vector.push(d)
            return vector
    	}else{
        	return plane
        }
    }
    
    //Public
    this.project_vector_onto_plane = function(vector, plane){
		var short_plane = [plane[0], plane[1], plane[2]]
		var term1 = Vector.dot(vector, short_plane)
    	var term2 = Math.pow(Vector.distance(short_plane), 2)
		return Vector.subtract(vector, Vector.multiply(term1 / term2, short_plane))
	}
    
    this.project_point_onto_line = function(point, line_point_1, line_point_2){
    	let U1a = line_point_1
        let U1b = point
        let U2a = line_point_1
        let U2b = line_point_2
        let U1ba = Vector.subtract(U1b, U1a)
        let U2ba = Vector.subtract(U2b, U2a)
        let proj = Vector.add(Vector.multiply(Vector.dot(U2ba, U1ba) / Vector.magnitude(U2ba)**2, U2ba), U2a)
        return proj
    }
    
    /*
    debugger
    Vector.sign(0)
    */
    this.sign = function(array){
		let dim = Vector.matrix_dimensions(array)
        let sign_array
        if(dim[1] == 0){
        	if(array >= 0){
            	return 1
            }else{
            	return -1
            }
        }else if(dim[0] == 1){
        	sign_array = Vector.make_matrix(dim)[0]
        	for(let i = 0; i < dim[1]; i++){
            	if(array[i] >= 0){
            		sign_array[i] = 1
            	}else{
            		sign_array[i] = -1
            	}
            }
        }else{
        	sign_array = Vector.make_matrix(dim)
        	for(let i = 0; i < dim[0]; i++){
            	for(let j = 0; j < dim[1]; i++){
            		if(array[i][j] >= 0){
            			sign_array[i][j] = 1
            		}else{
            			sign_array[i][j] = -1
            		}
                }
            }
        }
        return sign_array
	}
    
    //Public
    this.points_to_plane = function(Ua, Ub, Uc){
    	var Uba = Vector.subtract(Ub, Ua)
        var Uca = Vector.subtract(Uc, Ua)
        var Uba_norm = Vector.round(Vector.normalize(Uba),10)
        var Uca_norm = Vector.round(Vector.normalize(Uca),10)
        /*if (Vector.is_equal(Uba_norm, Uca_norm, 10) || Vector.is_equal(Vector.multiply(-1, Uba_norm), Uca_norm, 10)){
        	return Kin.base_rotation_to_plane(0, Vector.normalize(Uba))
        }*/
        var vector = Vector.normalize(Vector.cross(Uba, Uca))
        
        
        return Vector.complete_plane(vector, Ua)
    }
	
    
    //Public 
    this.round = function(number_or_array, digits = 1){
    	let mulitplier = Math.pow(10, digits)
    	let temp_args = Convert.deep_copy(arguments)
        if(typeof(number_or_array) == "number"){
        	return Math.round(mulitplier * number_or_array) / mulitplier
        }else{
        	let temp_array = Convert.deep_copy(number_or_array)
            let dim = Vector.matrix_dimensions(number_or_array)
            if(dim[0] == 1){
            	for(var i = 0; i < number_or_array.length; i++){
                	temp_array[i] = Math.round(mulitplier * temp_array[i]) / mulitplier
                }
            }else{
        		for(var i = 0; i < dim[0]; i++){
            		for(var j = 0; j < dim[1]; j++){
            			temp_array[i][j] = Math.round(mulitplier * temp_array[i][j]) / mulitplier
            		}
            	}
            }
            return temp_array
        }
    }

    
    
    //Public
    this.is_equal = function(array1, array2, tolerance = 14, tolerance_type = "decimal_places"){
        
        let result = true
        if (array1.length !== array2.length){
        	return false
        }else{
        	let array1_temp = Convert.deep_copy(array1)
            let array2_temp = Convert.deep_copy(array2)
        	
        	switch(tolerance_type){
            	case "decimal_places":
        		array1_temp = Vector.round(array1_temp, tolerance)
        		array2_temp = Vector.round(array2_temp, tolerance)
            	if(array1_temp.length == undefined){
            		if(array1_temp == array2_temp){
                		return true
                	}else{
                		return false
                	}
            	}
        		result = true
        		for(var i = 0; i < array1_temp.length; i++){
            		if (array1_temp[i] != array2_temp[i]){
                    	return false
                	}
            	}
                break
                
                case "absolute":
				if (Vector.max(Vector.abs(Vector.subtract(array1_temp, array2_temp))) > tolerance){
                	return false
                }
                break
                
                case "percent_difference":
                if(tolerance > 1){
                	
                	dde_warning("Percent difference tolerance should be within 0 and 1.</br>Input of " 
                    + tolerance + " changed to " + (tolerance/100) + ".")
                    tolerance = tolerance/100
                }
                
                let avg = Vector.average(array1_temp, array2_temp)
				if (Vector.max(Vector.divide(Vector.abs(Vector.subtract(array1_temp, array2_temp)), avg)) > tolerance){
                	return false
                }
                break
                
                case "magnitude":
                if (Vector.max(Vector.magnitude(Vector.subtract(array1_temp, array2_temp))) > tolerance){
                	return false
                }
                break
                
                default:
                dde_error("Vector.is_equal does not support input of \"" + tolerance_type
                + "\".</br>Supported tolerance types: \"decimal_places\", \"absolute\", \"percent_difference\", and \"magnitude\"")
                
            }
                
        }
        return result
    }
    
    
    
    //Public
    this.shorten = function(matrix){
    	return [matrix[0], matrix[1], matrix[2]]
    }
    
    //Public
    //Returns the smallest angle between two vectors with range 0-180 degrees
    this.angle = function(vector_A, vector_B){
    	//in case one of the vectors is a complete plane
    	var short_A = Vector.shorten(vector_A)
        var short_B = Vector.shorten(vector_B)
        var result
    	if (Vector.is_equal(short_A, short_B)){
        	result =  0
        }else{
        	if (Vector.distance(Vector.add(short_A, short_B)) === 0){
            	result = 180
            }else{
            	var result = atan2d(Vector.distance(Vector.cross(short_A, short_B)), Vector.dot(short_A, short_B))
        	}
        }
        return result
    }
    
    //Public
    //Returns angle between two vectors with range -180 to 180
    this.signed_angle = function(vector_A, vector_B, plane){
    	//checks if vectors lie in plane
        var cross_product = Vector.normalize(Vector.cross(Vector.shorten(vector_A), Vector.shorten(vector_B)))
        var short_plane = Vector.shorten(plane)
        if (!(Vector.is_equal(cross_product, short_plane) || Vector.is_equal(Vector.multiply(-1, cross_product), short_plane)) && cross_product[0] === NaN){
            out("Error: input vectors do not lie in plane")
        }
    	
    	var guess_angle = Vector.angle(vector_A, vector_B)
        var guess_vector = Vector.round(Vector.rotate(vector_A, plane, guess_angle), 3)
        var test_vector = Vector.round([vector_B[0], vector_B[1], vector_B[2]], 3)
        
        if (Vector.magnitude(Vector.subtract(guess_vector, test_vector)) < Vector.magnitude(Vector.subtract(guess_vector, Vector.multiply(-1, test_vector)))){
          return guess_angle
        }else{
          return -guess_angle
        }
    }
    
   
    
    
    //Public
    //returns intersection of two planes, a plane and a line, and two lines
    this.intersection = function(){
    	switch (Vector.size(arguments)){
        	case 2:
        		//Assumes intersection between two planes
                return Vector.normalize(Vector.cross(arguments[1], arguments[2]))
        	case 3:
            	//Assumes intersection between plane and line
            	var line_vector, complete_point, alpha, intersection_point
            	
            	for(var i = 0; i < 3; i++){
                	if (Vector.size(arguments[i]) === 4){
                    	var plane = arguments[i].slice(0)
                        var point_A = arguments[(i + 1) % 3].slice(0)
                        var point_B = arguments[(i + 2) % 3].slice(0)
                    }
                    
                }
                if (plane === undefined){
                    out("Error: inputs to the function 'Vector.intersection' must be a plane and two points or two planes")
                }
                if (Vector.size(point_A) !== 3 || Vector.size(point_B) !== 3){
                	out("Error: inputs to the function 'Vector.intersection' must be a plane and two points or two planes")
                }
                
                //Assumes plane is passed in along with a line defined by a point and unit vector
                if (Vector.distance(point_A) === 1 && Vector.distance(point_B) !== 1){
                	line_vector = point_A
                    complete_point = [point_B[0], point_B[1], point_B[2], 1]
                    alpha = -Vector.dot(plane, complete_point) / (Math.pow(line_vector[0], 2), Math.pow(line_vector[1], 2), Math.pow(line_vector[2], 2))
                    intersection_point = Vector.add(Vector.multiply(alpha, line_vector), point_B)
                    return intersection_point
                }
                
                //Assumes plane is passed in along with a line defined by a point and unit vector
                if (Vector.distance(point_A) !== 1 && Vector.distance(point_B) === 1){
                	line_vector = point_B
                    complete_point = [point_A[0], point_A[1], point_A[2], 1]
                    alpha = -Vector.dot(plane, complete_point) / (Math.pow(line_vector[0], 2), Math.pow(line_vector[1], 2), Math.pow(line_vector[2], 2))
                    intersection_point = Vector.add(Vector.multiply(alpha, line_vector), point_A)
                    return intersection_point
                }
                
                //Assumes plane is passed in along with a line defined by two points
                line_vector = Vector.subtract(point_B, point_A)
                complete_point = [point_A[0], point_A[1], point_A[2], 1]
                alpha = -Vector.dot(plane, complete_point) / (Math.pow(line_vector[0], 2), Math.pow(line_vector[1], 2), Math.pow(line_vector[2], 2))
                intersection_point = Vector.add(Vector.multiply(alpha, line_vector), point_A)
                return [intersection_point, alpha]
        	
            
            case 4:
            
            	
        }
    }

    //Public
    //rotates a vector in 3D space on a plane by angle theta
    //will also rotate a point about a line by substituting the line's vector in plane and its point in point
    this.rotate = function(vector, plane, theta, point = [0, 0, 0]){
    	plane =  Vector.normalize(Vector.shorten(plane))
        let result, short_vector, term_1, term_2, term_3
        if (vector[0].length == 3){
        	result = [0, 0, 0]
            for(var i = 0; i < vector.length; i++){
            	short_vector = Vector.subtract(vector[i], point)
                if(Vector.is_equal(short_vector, point)){
            		result[i] = short_vector
            	}else{
                	term_1 = Vector.multiply(cosd(theta), short_vector)
            		term_2 = Vector.multiply(sind(theta), Vector.cross(Vector.shorten(plane), short_vector))
                	result[i] = Vector.add(Vector.multiply(Vector.magnitude(vector),  Vector.normalize(Vector.add(term_1, term_2))), point)
                }
            }
        }else{
        	short_vector = Vector.subtract(Vector.shorten(vector), point)
            if(Vector.is_equal(short_vector, plane)){
            	return short_vector
            }
            term_1 = Vector.multiply(cosd(theta), short_vector)
            term_2 = Vector.multiply(sind(theta), Vector.cross(Vector.shorten(plane), short_vector))
            result = Vector.add(Vector.multiply(Vector.magnitude(short_vector),  Vector.normalize(Vector.add(term_1, term_2))), point)
        }
        return result
    }
    
    
    this.three_points_to_transformation = function(point_list, pointA = [0, 0, 0], pointB = [1, 0, 0], pointC = [0, 1, 0], U4){
		
        let points_plane = Vector.points_to_plane(pointA, pointB, pointC)
        let dist = Vector.distance(U4, points_plane)
        out("input plane and dist:")
        out(points_plane)
        out(dist)
        if(dist < 0){
        	points_plane = Vector.multiply(-1, points_plane)
        }
        if(!Vector.is_equal(points_plane, [0, 0, 1], 4)){
        	let intersection_axis = Vector.cross(points_plane, [0, 0, 1])
            let phi = Vector.signed_angle([1, 0, 0], points_plane, intersection_axis)
            for(var i = 0; i < point_list.length; i++){
				point_list[i] = Vector.rotate(point_list[i], [0, 0, 1], phi)
			}
        }
        
    	let rot_plane = Vector.cross(points_plane, [0, 0, 1])
    	let theta = Vector.signed_angle([0, 0, 1], points_plane, rot_plane)
        
        let new_point_list = []

        let sum = [0, 0, 0]
        if (point_list[0].length === 2){
        	for(var i = 0; i < point_list.length; i++){
				new_point_list[i] = Vector.rotate([point_list[i][0], point_list[i][1], 0], rot_plane, theta)
        		drawing_centroid = Vector.add(sum, new_point_list[i])
			}
        }
        if (point_list[0].length === 3){
        	for(var i = 0; i < point_list.length; i++){
				point_list[i] = [-point_list[i][0], point_list[i][1], point_list[i][2]] 
			}
        	for(var i = 0; i < point_list.length; i++){
				new_point_list.push(Vector.rotate([point_list[i][0], point_list[i][1], point_list[i][2]], rot_plane, theta))
        		drawing_centroid = Vector.add(sum, new_point_list[i])
			}
        }
        drawing_centroid = Vector.multiply(drawing_centroid, 1 / point_list.length)
        let plane_centroid = Vector.multiply(Vector.add(pointA, pointB, pointC), 1 / 3)
        let distance_vector = Vector.subtract(plane_centroid, drawing_centroid)
        for(var i = 0; i < point_list.length; i++){
			new_point_list[i] = Vector.add(new_point_list[i], distance_vector)
		}
    
    	return [new_point_list, Vector.shorten(points_plane)]
    	//[x*cos(theta)+dx, y*cos(theta)+dy, (Py*y + Pz*x)*sin(theta)+dz]
	}
    
    this.max = function(vector){
    	let dim = Vector.matrix_dimensions(vector)
        let temp_max
        
        if(dim[0] == 1){
        	if(dim[1] == 0){
            	return vector
            }
        	temp_max = -Infinity
        	for(let i = 0; i < dim[1]; i++){
            	if(vector[i] > temp_max){
                	temp_max = vector[i]
                }
            }
        }else{
        	temp_max = Vector.make_matrix(1, dim[1], -Infinity)[0]
        	for(let j = 0; j < dim[1]; j++){
            	for(let i = 0; i < dim[0]; i++){
            		if(vector[i][j] > temp_max[j]){
                		temp_max[j] = vector[i][j]
                	}
            	}
        	}
    	}
    	return temp_max
    }
    /*
    debugger
    var result = Vector.max([[1, 2, 10], [4, 5, 6]])
    var result = Vector.max([1, 2, 10])
    */
    
    this.min = function(vector){
    	let dim = Vector.matrix_dimensions(vector)
        let temp_min
        if(dim[0] == 1){
        	if(dim[1] == 0){
            	return vector
            }
        	temp_min = Infinity
        	for(let i = 0; i < dim[1]; i++){
            	if(vector[i] < temp_min){
                	temp_min = vector[i]
                }
            }
        }else{
        	temp_min = Vector.make_matrix(1, dim[1], Infinity)[0]
        	for(let j = 0; j < dim[1]; j++){
            	for(let i = 0; i < dim[0]; i++){
            		if(vector[i][j] < temp_min[j]){
                		temp_min[j] = vector[i][j]
                	}
            	}
        	}
    	}
    	return temp_min
    }
    /*
    var result = Vector.min([[1, 2, 10], [4, 5, 6]])
    var result = Vector.min([1, 2, 10])
    */
    
    this.is_NaN = function(vector){
    	let dim = Vector.matrix_dimensions(vector)
        if(dim[0] == 1 && dim[1] == 0){return isNaN(vector)}
        if(dim[0] == 1){
        	for(let i = 0; i < dim[1]; i++){
        		if(isNaN(vector[i])){return true}
        	}
        }else{
        	for(let i = 0; i < dim[0]; i++){
            	for(let j = 0; j < dim[1]; j++){
        			if(isNaN(vector[i][j])){return true}
                }
        	}
        }
        return false
    }
    
    this.sum = function(array){
    	let dim = Vector.matrix_dimensions(array)
        let sum = 0
        if(dim[0] == 1){
        	for(let i = 0; i < dim[1]; i++){
            	sum += array[i]
            }
        }
        return sum
    }
    
    /*
    debugger
    Vector.abs([[-10, 9], [-8, -6],[-1, -5]])
    Vector.abs([[-10, 9], [-8, -6]])
    */
    this.abs = function(array){
    	let dim = Vector.matrix_dimensions(array)
        let array_copy = Convert.deep_copy(array)
        
        if(dim[1] == 0){
        	return Math.abs(array)
        }else if(dim[0] == 1){
        	array_copy = Vector.make_matrix(dim)[0]
        	for(let i = 0; i < dim[1]; i++){
            	array_copy[i] = Math.abs(array[i])
            }
        }else{
        	array_copy = Vector.make_matrix(dim)
        	for(let i = 0; i < dim[0]; i++){
            	for(let j = 0; j < dim[1]; j++){
            		array_copy[i][j] = Math.abs(array[i][j])
                }
            }
        }
        return array_copy
    }
    /*
    var myvec = [1, -4, 5, -4]
    Vector.abs(myvec)
    out(myvec)
    */
    
    this.pow = function(array, power){
    	let dim = Vector.matrix_dimensions(array)
        let array_copy = Convert.deep_copy(array)
        
        if(dim[1] == 0){
        	return Math.pow(array, power)
        }else if(dim[0] == 1){
        	array_copy = Vector.make_matrix(dim)[0]
        	for(let i = 0; i < dim[1]; i++){
            	array_copy[i] = Math.pow(array[i], power)
            }
        }else{
        	array_copy = Vector.make_matrix(dim)
        	for(let i = 0; i < dim[0]; i++){
            	for(let j = 0; j < dim[1]; j++){
            		array_copy[i][j] = Math.pow(array[i][j], power)
                }
            }
        }
        return array_copy
    }
    
    
    
    /*
    Vector.is_greater([4, 4, 5], [4, 3, 5])
    */
    this.is_greater = function(vector_1, vector_2){
        let state = false
        for(let i = 0; i < vector_1.length; i++){
        	if(vector_1[i] > vector_2[i]){
            	state = true
                break
            }
        }
        return state
    }
    
    this.is_less = function(vector_1, vector_2){
        let state = false
        for(let i = 0; i < vector_1.length; i++){
        	if(vector_1[i] < vector_2[i]){
            	state = true
                break
            }
        }
        return state
    }
    
    this.quadratic_formula = function(a, b, c){
    	let det = Math.sqrt(b**2-4*a*c)
        if(isNaN(det)){
        	dde_error("Vector.quadratic_formula does not support imaginery roots yet")
        }
        return [(-b+det)/(2*a), (-b-det)/(2*a)]
    }
    
    this.root_mean_square = function(vector){
    	if(vector.length){
        	let sum = 0
        	for(let i = 0; i < vector.length; i++){
            	sum += vector[i] * vector[i]
        	}
            return Math.sqrt(sum / vector.length)
        }else{
        	return vector
        }
    }
    
    
    
	//Cubic Formula by Alexander Shtuchkin
	//https://stackoverflow.com/questions/27176423/function-to-solve-cubic-equation-analytically
    this.cuberoot = function(x){
    	let y = Math.pow(Math.abs(x), 1/3);
    	return x < 0 ? -y : y;
	}
    
    this.solveCubic = function(a, b, c, d) {
    	if (Math.abs(a) < 1e-8) { // Quadratic case, ax^2+bx+c=0
        	a = b; b = c; c = d;
        	if (Math.abs(a) < 1e-8) { // Linear case, ax+b=0
            	a = b; b = c;
            	if (Math.abs(a) < 1e-8) // Degenerate case
                	return [];
            	return [-b/a];
        	}

        	var D = b*b - 4*a*c;
        	if (Math.abs(D) < 1e-8)
            	return [-b/(2*a)];
        	else if (D > 0)
            	return [(-b+Math.sqrt(D))/(2*a), (-b-Math.sqrt(D))/(2*a)];
        	return [];
    	}

    	// Convert to depressed cubic t^3+pt+q = 0 (subst x = t - b/3a)
    	var p = (3*a*c - b*b)/(3*a*a);
    	var q = (2*b*b*b - 9*a*b*c + 27*a*a*d)/(27*a*a*a);
    	var roots;

    	if (Math.abs(p) < 1e-8) { // p = 0 -> t^3 = -q -> t = -q^1/3
        	roots = [cuberoot(-q)];
    	} else if (Math.abs(q) < 1e-8) { // q = 0 -> t^3 + pt = 0 -> t(t^2+p)=0
        	roots = [0].concat(p < 0 ? [Math.sqrt(-p), -Math.sqrt(-p)] : []);
    	} else {
        	var D = q*q/4 + p*p*p/27;
        	if (Math.abs(D) < 1e-8) {       // D = 0 -> two roots
            	roots = [-1.5*q/p, 3*q/p];
        	} else if (D > 0) {             // Only one real root
            	var u = cuberoot(-q/2 - Math.sqrt(D));
            	roots = [u - p/(3*u)];
        	} else {                        // D < 0, three roots, but needs to use complex numbers/trigonometric solution
            	var u = 2*Math.sqrt(-p/3);
            	var t = Math.acos(3*q/p/u)/3;  // D < 0 implies p < 0 and acos argument in [-1..1]
            	var k = 2*Math.PI/3;
            	roots = [u*Math.cos(t), u*Math.cos(t-k), u*Math.cos(t-2*k)];
        	}
    	}

    	// Convert back from depressed cubic
    	for (var i = 0; i < roots.length; i++)
        	roots[i] -= b/(3*a);

    	return roots;
	}
    
    this.linspace = function(start, end, n){
		let result = Vector.make_matrix(1, n)
    	let step = (end-start)/(n-1)
    	for(let i = 0; i < n; i++){
    		result[i] = start+i*step
    	}
    	return result
	}
    
    /**********************************************************
    //Matrix Math
    ***********************************************************/
    /*
    Vector.make_matrix(3,"tilt")
    debugger
    Vector.make_matrix(1,0)
    */
    
    this.make_matrix = function(nRows, nColumns, value = 0){
    	let result = []
        if(nColumns === undefined){
        	if(Vector.matrix_dimensions(nRows)[1] == 2){
            	nColumns = nRows[1]
                nRows = nRows[0]
            }else{
        		nColumns = nRows
            }
        }
        if(nColumns === "tilt"){
        	result = Vector.make_matrix(nRows)
            for(let i = 0; i < nRows; i++){
            	for(let j = 0; j < nRows; j++){
            		result[i][j] = 2*nRows-i-j-2
            	}
            }
            return result
        }
        if(nRows < 1 || nColumns < 1){
        	dde_error("matrix dimensions must be greater than 1")
        }
        
    	for(var i = 0; i < nRows; i++){
    		result.push([])
    		for(var j = 0; j < nColumns; j++){
    			result[i].push(value)
    		}
    	}
    	return result
	}
    //Vector.make_matrix(10, 7)
    //Vector.make_matrix(3)
    //Vector.make_matrix(3, 2, 1)
    //Vector.make_matrix([2,3])
    
    function multiply_two_matrices(matrix_A, matrix_B){
    	let A_height, B_height, A_width, B_width, A_dim, B_dim
        A_dim = Vector.matrix_dimensions(matrix_A)
        B_dim = Vector.matrix_dimensions(matrix_B)
        A_height = A_dim[0]
        A_width = A_dim[1]
        B_height = B_dim[0]
        B_width = B_dim[1]
        
        /*
    	let A_height = matrix_A.length
        let B_height = matrix_B.length
        let A_width  = matrix_A[0].length
        let B_width  = matrix_B[0].length
        */
        if(A_width == undefined){
        	A_width = A_height
        	A_height = 1
        }
        if(B_width == undefined){
        	B_width = B_height
        	B_height = 1
        }
        if(A_width != B_height){
        	dde_error("Inner matrix dimension must match")
        }
        let result = Vector.make_matrix(A_height, B_width)
        for(var i = 0; i < A_height; i++){
        	for(var j = 0; j < B_width; j++){
            	let verticle = Vector.make_matrix(1, B_height)[0]
                if(B_height == 1){
                	verticle = matrix_B[j]
                }else{
                	for(var k = 0; k < B_height; k++){
                		verticle[k] = matrix_B[k][j]
                	}
                }
                if(A_height == 1){
                	result[i][j] = Vector.dot(matrix_A, verticle)
                }else{
        			result[i][j] = Vector.dot(matrix_A[i], verticle)
                }
        	}
        }
    	return result
	}

	this.transpose = function(matrix){
    	let height = matrix.length
        let width  = matrix[0].length
        if(width == undefined){
        	width = height
        	height = 1
            matrix = [matrix]
        }
        let result = Vector.make_matrix(width, height)
        for(var i = 0; i < width; i++){
        	for(var j = 0; j < height; j++){
        		result[i][j] = matrix[j][i]
        	}
        }
        if(result.length == 1){
        	return result[0]
        }else{
        	return result
        }
    }
    /*
    var v = [1, 2, 3]
    v = Vector.transpose(v)
    var v2 = Vector.transpose(v)
    */
    
    this.matrix_multiply = function(...args){
    	if (args === undefined){
        	out("Error: the function 'Vector.matrix_multiply' has undefined inputs")
        }
        let temp_args = Convert.deep_copy(args)
        let matrix_A = temp_args[0]
        for(let i = 1; i < temp_args.length; i++){
            let matrix_B = temp_args[i]
            matrix_A = multiply_two_matrices(matrix_A, matrix_B)
    	}
        return matrix_A
    }
    
    function divide_two_matrices(matrix_numerator, matrix_denominator){
    	let dim_num = Vector.matrix_dimensions(matrix_numerator)
        let dim_den = Vector.matrix_dimensions(matrix_denominator)
        if (!((dim_num[0] == dim_den[0]) && (dim_num[1] == dim_den[1]))){
        	dde_error("matrix dimensions must match in Vector.matrix_divide")
        }
        return Vector.matrix_multiply(matrix_numerator, Vector.inverse(matrix_denominator))
    }
    
    this.matrix_divide = function(...args){
    	if (args === undefined){
        	out("Error: the function 'Vector.matrix_multiply' has undefined inputs")
        }
        let temp_args = Convert.deep_copy(args)
        let matrix_A = temp_args[0]
        for(var i = 1; i < temp_args.length; i++){
            let matrix_B = temp_args[i]
            matrix_A = divide_two_matrices(matrix_A, matrix_B)
    	}
        return matrix_A
    }
    
    
    this.determinant = function(matrix){
    	let result
    	let dim = Vector.matrix_dimensions(matrix)
        if (dim[0] == 2 && dim[1] == 2){
        	result = matrix[0][0]*matrix[1][1] - matrix[0][1]*matrix[1][0]
        }else if(dim[0] == 3 && dim[1] == 3){
        	//Source: https://en.wikipedia.org/wiki/Determinant#n_.C3.97_n_matrices
        	let a, b, c, d, e, f, g, h, i
            a = matrix[0][0]
            b = matrix[0][1]
            c = matrix[0][2]
            d = matrix[1][0]
            e = matrix[1][1]
            f = matrix[1][2]
            g = matrix[2][0]
            h = matrix[2][1]
            i = matrix[2][2]
        	result = a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g)
        }else if(dim[0] == 4 && dim[1] == 4){
        	// Source: http://www.cg.info.hiroshima-cu.ac.jp/~miyazaki/knowledge/teche23.html
            let a11, a12, a13, a14, a21, a22, a23, a24, a31, a32, a33, a34, a41, a42, a43, a44
            a11 = matrix[0][0]
            a12 = matrix[0][1]
            a13 = matrix[0][2]
            a14 = matrix[0][3]
            a21 = matrix[1][0]
            a22 = matrix[1][1]
            a23 = matrix[1][2]
            a24 = matrix[1][3]
            a31 = matrix[2][0]
            a32 = matrix[2][1]
            a33 = matrix[2][2]
            a34 = matrix[2][3]
            a41 = matrix[3][0]
            a42 = matrix[3][1]
            a43 = matrix[3][2]
            a44 = matrix[3][3]
            
            result = a11*a22*a33*a44 + a11*a23*a34*a42 + a11*a24*a32*a43
            		+a12*a21*a34*a43 + a12*a23*a31*a44 + a12*a24*a33*a41
                    +a13*a21*a32*a44 + a13*a22*a34*a41 + a13*a24*a31*a42
                    +a14*a21*a33*a42 + a14*a22*a31*a43 + a14*a23*a32*a41
                    -a11*a22*a34*a43 - a11*a23*a32*a44 - a11*a24*a33*a42
                    -a12*a21*a33*a44 - a12*a23*a34*a41 - a12*a24*a31*a43
                    -a13*a21*a34*a42 - a13*a22*a31*a44 - a13*a24*a32*a41
                    -a14*a21*a32*a43 - a14*a22*a33*a41 - a14*a23*a31*a42
        }else{
        	dde_error("determinants of matricies with these dimensions are not supported yet")
        }
        return result
    }
    /*
    var my_matrix = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    Vector.determinant(my_matrix)
    
    var mat = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16]]
    var det = Vector.determinant(mat)
    
    var mat = [[3, 2, 1.7, 1.5],[4.5, 5, 4.1, 1.9], [1.1, 8.5, 9, 8], [3, 9, 9, 10]]
    var det = Vector.determinant(mat)
    */
    
    /////////////////////////////////////////////////////////////////////////////////////
	//16 Nov 2013 by Andrew Ippoliti
    //http://blog.acipo.com/matrix-inversion-in-javascript/
    // Returns the inverse of matrix `M`.
	function matrix_invert(M){
    	// I use Guassian Elimination to calculate the inverse:
    	// (1) 'augment' the matrix (left) by the identity (on the right)
    	// (2) Turn the matrix on the left into the identity by elemetry row ops
    	// (3) The matrix on the right is the inverse (was the identity matrix)
    	// There are 3 elemtary row ops: (I combine b and c in my code)
    	// (a) Swap 2 rows
    	// (b) Multiply a row by a scalar
    	// (c) Add 2 rows
    
    	//if the matrix isn't square: exit (error)
    	if(M.length !== M[0].length){return;}
    
    	//create the identity matrix (I), and a copy (C) of the original
    	var i=0, ii=0, j=0, dim=M.length, e=0, t=0;
    	var I = [], C = [];
    	for(i=0; i<dim; i+=1){
        	// Create the row
        	I[I.length]=[];
        	C[C.length]=[];
        	for(j=0; j<dim; j+=1){
            	//if we're on the diagonal, put a 1 (for identity)
            	if(i==j){ I[i][j] = 1; }
            	else{ I[i][j] = 0; }
            	// Also, make the copy of the original
            	C[i][j] = M[i][j];
        	}
    	}
    
    	// Perform elementary row operations
    	for(i=0; i<dim; i+=1){
        	// get the element e on the diagonal
        	e = C[i][i];
        
        	// if we have a 0 on the diagonal (we'll need to swap with a lower row)
        	if(e==0){
            	//look through every row below the i'th row
            	for(ii=i+1; ii<dim; ii+=1){
                	//if the ii'th row has a non-0 in the i'th col
                	if(C[ii][i] != 0){
                    	//it would make the diagonal have a non-0 so swap it
                    	for(j=0; j<dim; j++){
                        	e = C[i][j];       //temp store i'th row
                        	C[i][j] = C[ii][j];//replace i'th row by ii'th
                        	C[ii][j] = e;      //repace ii'th by temp
                        	e = I[i][j];       //temp store i'th row
                        	I[i][j] = I[ii][j];//replace i'th row by ii'th
                        	I[ii][j] = e;      //repace ii'th by temp
                    	}
                    	//don't bother checking other rows since we've swapped
                    	break;
                	}
            	}
            	//get the new diagonal
            	e = C[i][i];
            	//if it's still 0, not invertable (error)
            	if(e==0){return}
        	}
        
        	// Scale this row down by e (so we have a 1 on the diagonal)
        	for(j=0; j<dim; j++){
            	C[i][j] = C[i][j]/e; //apply to original matrix
            	I[i][j] = I[i][j]/e; //apply to identity
        	}
        
        	// Subtract this row (scaled appropriately for each row) from ALL of
        	// the other rows so that there will be 0's in this column in the
        	// rows above and below this one
        	for(ii=0; ii<dim; ii++){
            	// Only apply to other rows (we want a 1 on the diagonal)
            	if(ii==i){continue;}
            
            	// We want to change this element to 0
            	e = C[ii][i];
            
            	// Subtract (the row above(or below) scaled by e) from (the
            	// current row) but start at the i'th column and assume all the
            	// stuff left of diagonal is 0 (which it should be if we made this
            	// algorithm correctly)
            	for(j=0; j<dim; j++){
                	C[ii][j] -= e*C[i][j]; //apply to original matrix
                	I[ii][j] -= e*I[i][j]; //apply to identity
            	}
        	}
    	}
    
    	//we've done all operations, C should be the identity
    	//matrix I should be the inverse:
    	return I;
	}
    /////////////////////////////////////////////////////////////////////////////////////
    
    this.inverse = function(matrix){
    	let result
    	let dim = Vector.matrix_dimensions(matrix)
        if (dim[0] == 2 && dim[1] == 2){
        	result = [[matrix[1][1], -matrix[1][0]], [-matrix[0][1], matrix[0][0]]]
            result = Vector.multiply(1/Vector.determinant(matrix), result)
        }else if(dim[0] == 3 && dim[1] == 3){
        	//Source: University of Massachusetts Lowell - MECH 5960 Mechanics of Composite Materials
        	let a, b, c, d, e, f, g, h, i, A, B, C, D, E, F, G, H, I
            a = matrix[0][0]
            b = matrix[0][1]
            c = matrix[0][2]
            d = matrix[1][0]
            e = matrix[1][1]
            f = matrix[1][2]
            g = matrix[2][0]
            h = matrix[2][1]
            i = matrix[2][2]
            
            A =  Vector.determinant([[e, f], [h, i]])
            B = -Vector.determinant([[d, f], [g, i]])
            C =  Vector.determinant([[d, e], [g, h]])
            D = -Vector.determinant([[b, c], [h, i]])
            E =  Vector.determinant([[a, c], [g, i]])
            F = -Vector.determinant([[a, b], [g, h]])
            G =  Vector.determinant([[b, c], [e, f]])
            H = -Vector.determinant([[a, c], [d, f]])
            I =  Vector.determinant([[a, b], [d, e]])
            
            result = [[A, B, C], [D, E, F], [G, H, I]]
            result = Vector.multiply(1/Vector.determinant(matrix), result)
        }else if(dim[0] == 4 && dim[1] == 4){
        	// Source: http://www.cg.info.hiroshima-cu.ac.jp/~miyazaki/knowledge/teche23.html
            let a11, a12, a13, a14, a21, a22, a23, a24, a31, a32, a33, a34, a41, a42, a43, a44
            let b11, b12, b13, b14, b21, b22, b23, b24, b31, b32, b33, b34, b41, b42, b43, b44
            a11 = matrix[0][0]
            a12 = matrix[0][1]
            a13 = matrix[0][2]
            a14 = matrix[0][3]
            a21 = matrix[1][0]
            a22 = matrix[1][1]
            a23 = matrix[1][2]
            a24 = matrix[1][3]
            a31 = matrix[2][0]
            a32 = matrix[2][1]
            a33 = matrix[2][2]
            a34 = matrix[2][3]
            a41 = matrix[3][0]
            a42 = matrix[3][1]
            a43 = matrix[3][2]
            a44 = matrix[3][3]
        	
            b11 = a22*a33*a44 + a23*a34*a42 + a24*a32*a43 - a22*a34*a43 - a23*a32*a44 - a24*a33*a42
            b12 = a12*a34*a43 + a13*a32*a44 + a14*a33*a42 - a12*a33*a44 - a13*a34*a42 - a14*a32*a43
            b13 = a12*a23*a44 + a13*a24*a42 + a14*a22*a43 - a12*a24*a43 - a13*a22*a44 - a14*a23*a42
            b14 = a12*a24*a33 + a13*a22*a34 + a14*a23*a32 - a12*a23*a34 - a13*a24*a32 - a14*a22*a33
            
            b21 = a21*a34*a43 + a23*a31*a44 + a24*a33*a41 - a21*a33*a44 - a23*a34*a41 - a24*a31*a43
            b22 = a11*a33*a44 + a13*a34*a41 + a14*a31*a43 - a11*a34*a43 - a13*a31*a44 - a14*a33*a41
            b23 = a11*a24*a43 + a13*a21*a44 + a14*a23*a41 - a11*a23*a44 - a13*a24*a41 - a14*a21*a43
            b24 = a11*a23*a34 + a13*a24*a31 + a14*a21*a33 - a11*a24*a33 - a13*a21*a34 - a14*a23*a31
            
            b31 = a21*a32*a44 + a22*a34*a41 + a24*a31*a42 - a21*a34*a42 - a22*a31*a44 - a24*a32*a41
            b32 = a11*a34*a42 + a12*a31*a44 + a14*a32*a41 - a11*a32*a44 - a12*a34*a41 - a14*a31*a42
            b33 = a11*a22*a44 + a12*a24*a41 + a14*a21*a42 - a11*a24*a42 - a12*a21*a44 - a14*a22*a41
            b34 = a11*a24*a32 + a12*a21*a34 + a14*a22*a31 - a11*a22*a34 - a12*a24*a31 - a14*a21*a32
            
            b41 = a21*a33*a42 + a22*a31*a43 + a23*a32*a41 - a21*a32*a43 - a22*a33*a41 - a23*a31*a42
            b42 = a11*a32*a43 + a12*a33*a41 + a13*a31*a42 - a11*a33*a42 - a12*a31*a43 - a13*a32*a41
            b43 = a11*a23*a42 + a12*a21*a43 + a13*a22*a41 - a11*a22*a43 - a12*a23*a41 - a13*a21*a42
            b44 = a11*a22*a33 + a12*a23*a31 + a13*a21*a32 - a11*a23*a32 - a12*a21*a33 - a13*a22*a31
            
            result = [[b11, b12, b13, b14], [b21, b22, b23, b24], [b31, b32, b33, b34], [b41, b42, b43, b44]]
            result = Vector.multiply(1/Vector.determinant(matrix),result)
        }else{
        	result = matrix_invert(matrix)
        }
        return result
   }
   
   /*
   var mat = Vector.identity_matrix(3)
   var mat = [[3, 2, 1.7, 1.5],[4.5, 5, 4.1, 1.9], [1.1, 8.5, 9, 8], [3, 9, 9, 10]]
   var det = Vector.determinant(mat)
   var imat = Vector.inverse(mat)
   
   var my_DCM = 
   
   var det = Vector.determinant(imat)
   var mat2 = Vector.inverse(imat)
   */
    
    /*
    var mat = []
    Vector.matrix_dimensions(mat)
    debugger
    Vector.matrix_dimensions(3)
    */
    
    this.matrix_dimensions = function(matrix){
    	let width
        let height = matrix.length
        if(height == undefined){
        	return [1, 0]
        }
        if(height == 0){
        	width = 0
        	height = 0
            return [height, width]
        }
        width  = matrix[0].length
        if(width == undefined){
        	width = height
        	height = 1
        }
        return [height, width]
    }
    //Vector.matrix_dimensions([10, 20, 30])
    //Vector.matrix_dimensions([[10], [20], [30]])
    
    this.properly_define_point = function(points){
    	//a proper point takes the following form: [[x], [y], [z], [1]]
        //for points: [[x1, x2, ..., xn], [y1, y2, ..., yn], [z1, z2, ..., zm=n] [1, 1, ..., 1]]
    	let dim = Vector.matrix_dimensions(points)
        let proper_points = Convert.deep_copy(points)
        if(dim[0] == 1){
        	proper_points = Vector.transpose(proper_points)
            proper_points.push([1])
            return proper_points
        }else{
        	if(dim[1] == 3){
            	for(var i = 0; i < dim[0]; i++){
                	proper_points[i].push(1)
                }
                proper_points = Vector.transpose(proper_points)
            	return proper_points
            }else{
            	if(dim[0] == 3){
                	//let ones = Vector.add(Vector.make_matrix(1, dim[0])[0], 1)
                    proper_points.push([1])
                    return proper_points
                }
            }
        }
    }
    /*
    Vector.properly_define_point([10, 20, 30])
    Vector.properly_define_point([[10], [20], [30]])
    debugger
    Vector.properly_define_point([[10, 20, 30], [10, 20, 30], [10, 20, 30]])
    */
	
    this.properly_define_vector = function(vectors){
    	//a proper point takes the following form: [[x], [y], [z], [1]]
        //for points: [[x1, x2, ..., xn], [y1, y2, ..., yn], [z1, z2, ..., zm=n] [1, 1, ..., 1]]
    	let dim = Vector.matrix_dimensions(vectors)
        let proper_vectors = Convert.deep_copy(vectors)
        if(dim[0] == 1){
        	proper_vectors = Vector.transpose(proper_vectors)
            if(dim[1] == 3){
            	proper_vectors.push([0])
            }
            return proper_vectors
        }else{
        	if(dim[1] == 3){
            	for(var i = 0; i < dim[0]; i++){
                	proper_vectors[i].push(0)
                }
                proper_vectors = Vector.transpose(proper_vectors)
            	return proper_vectors
            }else{
            	if(dim[0] == 3){
                	//let ones = Vector.add(Vector.make_matrix(1, dim[0])[0], 1)
                    proper_vectors.push([0])
                    return proper_vectors
                }
            }
        }
    }
    
    this.make_dcm = function(x_vector, y_vector, z_vector){
    	let dcm = Vector.identity_matrix(3)
        
        if(x_vector == undefined && y_vector == undefined && z_vector == undefined){
        	return dcm
        }else if(x_vector == undefined && y_vector != undefined && z_vector != undefined){
        	x_vector = Vector.cross(y_vector, z_vector)
        }else if(x_vector != undefined && y_vector == undefined && z_vector != undefined){
        	y_vector = Vector.cross(z_vector, x_vector)
        }else if(x_vector != undefined && y_vector != undefined && z_vector == undefined){
        	z_vector = Vector.cross(x_vector, y_vector)
        }
        
        x_vector = Vector.normalize(x_vector)
        y_vector = Vector.normalize(y_vector)
        z_vector = Vector.normalize(z_vector)
        
        dcm = Vector.insert(dcm, Vector.transpose(x_vector), [0, 0])
        dcm = Vector.insert(dcm, Vector.transpose(y_vector), [0, 1])
        dcm = Vector.insert(dcm, Vector.transpose(z_vector), [0, 2])
        
        return dcm
    }
    /*
    debugger
    var result = Vector.make_dcm([1, 1, 0], undefined, [0, 0, 1])
    */
    
	this.make_pose = function(position = [0, 0, 0], orientation = [0, 0, 0], sequence = "XYZ"){
		let dim = Vector.matrix_dimensions(orientation)
        let DCM
        if(dim[0] == 1 && dim[1] == 3){
        	//Euler Angle
            DCM = Convert.angles_to_DCM(orientation, sequence)
        }else if(dim[0] == 1 && dim[1] == 4){
            //Quaternion
            DCM = Convert.quat_to_DCM(orientation)
        }else if(dim[0] == 3 && dim[1] == 3){
        	//DCM
            DCM = orientation
        }else{
        	dde_error("orientation is improperly formatted")
        }
        
        //Please tell me there's a better way to do this:
        let pose = [[DCM[0][0], DCM[0][1], DCM[0][2], position[0]],
        			[DCM[1][0], DCM[1][1], DCM[1][2], position[1]],
                    [DCM[2][0], DCM[2][1], DCM[2][2], position[2]],
                    [0, 0, 0, 1]]
        return pose
	}

    
    this.identity_matrix = function(size){
    	let result = Vector.make_matrix(size, size)
        for(var i = 0; i < size; i++){
        	result[i][i] = 1
        }
        return result
    }
    //var im = Vector.identity_matrix(4)
    //var det = Vector.determinant(im)
    
    this.rotate_DCM = function(DCM = [[1, 0, 0],[0, 1, 0],[0, 0, 1]], axis_of_rotation, angle){
    	let trans_matrix = Vector.identity_matrix(3)
        let x_vector, y_vector, z_vector
    	switch(axis_of_rotation){
        	case "X":
            	trans_matrix[1][1] = cosd(angle)
                trans_matrix[2][2] = cosd(angle)
                trans_matrix[2][1] = sind(angle)
                trans_matrix[1][2] = -sind(angle)
                break
            case "Y":
            	trans_matrix[0][0] = cosd(angle)
                trans_matrix[2][2] = cosd(angle)
                trans_matrix[0][2] = sind(angle)
                trans_matrix[2][0] = -sind(angle)
            	break
            case "Z":
            	trans_matrix[0][0] = cosd(angle)
                trans_matrix[1][1] = cosd(angle)
                trans_matrix[1][0] = sind(angle)
                trans_matrix[0][1] = -sind(angle)
            	break
            case "X'":
            	x_vector = [DCM[0][0], DCM[1][0], DCM[2][0]]
            	DCM = Vector.rotate_DCM(DCM, x_vector, angle)
            	break
           	case "Y'":
            	y_vector = [DCM[0][1], DCM[1][1], DCM[2][1]]
            	DCM = Vector.rotate_DCM(DCM, y_vector, angle)
            	break
            case "Z'":
            	z_vector = [DCM[0][2], DCM[1][2], DCM[2][2]]
            	DCM = Vector.rotate_DCM(DCM, z_vector, angle)
            	break
            default:
            	x_vector = [DCM[0][0], DCM[1][0], DCM[2][0]]
                y_vector = [DCM[0][1], DCM[1][1], DCM[2][1]]
                z_vector = [DCM[0][2], DCM[1][2], DCM[2][2]]
                x_vector = Vector.rotate(x_vector, axis_of_rotation, angle)
                y_vector = Vector.rotate(y_vector, axis_of_rotation, angle)
                z_vector = Vector.rotate(z_vector, axis_of_rotation, angle)
                DCM = Vector.transpose([x_vector, y_vector, z_vector])
                return DCM
        }
        return Vector.matrix_multiply(DCM, trans_matrix)
    }
    /*
    var mat = Vector.rotate_DCM(Vector.identity_matrix(3), [1, 0, 0], Convert.degrees_to_arcseconds(90))
    var det = Vector.determinant(mat)
    */
    this.rotate_pose = function(pose, axis_of_rotation, angle, point_of_rotation = [0, 0, 0]){
    	if(Vector.is_pose(pose) == false){
        	dde_error("pose is not properly formatted")
        }
    	let DCM = Vector.pull(pose, [0, 2], [0, 2])
        DCM = Vector.rotate_DCM(DCM, axis_of_rotation, angle)
        let axis
        switch(axis_of_rotation){
        	case "X":
            	axis = [1, 0, 0]
                break
            case "Y":
            	axis = [0, 1, 0]
            	break
            case "Z":
            	axis = [0, 0, 1]
            	break
            case "X'":
            	axis = [DCM[0][0], DCM[1][0], DCM[2][0]]
            	break
           	case "Y'":
            	axis = [DCM[0][1], DCM[1][1], DCM[2][1]]
            	break
            case "Z'":
            	axis = [DCM[0][2], DCM[1][2], DCM[2][2]]
            	break
            default:
            	axis = axis_of_rotation
            }
        let position = Vector.transpose(Vector.pull(pose, [0, 2], 3))
        position = Vector.rotate(position, axis, angle, point_of_rotation)
        return Vector.make_pose(position, DCM)
    }

    
    this.is_pose = function(pose){
    	let dim = Vector.matrix_dimensions(pose)
        if (!(dim[0] == 4 && dim[1] == 4)){
        	return false
        }
        
        let short, short_mag
        short = [pose[0][0], pose[1][0], pose[2][0]]
        short_mag = Vector.magnitude(short)
        if (Vector.round(short_mag, 10) != 1){
        	return false
        }
        short = [pose[0][1], pose[1][1], pose[2][1]]
        short_mag = Vector.magnitude(short)
        if (Vector.round(short_mag, 10) != 1){
        	return false
        }
        short = [pose[0][2], pose[1][2], pose[2][2]]
        short_mag = Vector.magnitude(short)
        if (Vector.round(short_mag, 10) != 1){
        	return false
        }
        
        let DCM = Vector.pull(pose, [0, 2], [0, 2])
        if (!Vector.is_equal(Vector.determinant(DCM), 1, 10)){
        	return false
        }
        
        if (pose[3][3] != 1){
        	return false
        }
        
        if (!((pose[3][0] == 0) && (pose[3][1] == 0) && (pose[3][2] == 0))){
        	return false
        }
        
        return true
    }
    /*
    var my_pose = Vector.make_pose()
    var state = Vector.is_pose(my_pose)
    
    var my_pose = Vector.make_pose([10, 20, 30], [Convert.degrees_to_arcseconds(45), 0, 0], "ZX'Z'")
    var state = Vector.is_pose(my_pose)
    */
    
    
    /*
    this.place = function(matrix, row, column){
    	let dim = Vector.matrix_dimensions(matrix)
        let row_lower, row_upper, col_lower, col_upper
        if (Vector.size(row) == 1){
        	row_lower = row
            row_upper = row
        }else if (Vector.size(row) == 2){
        	row_lower = row[0]
            row_upper = row[1]
        }else{
        	dde_error("row has invalid dimensions")
        }
        if (Vector.size(column) == 1){
        	col_lower = column
            col_upper = column
        }else if (Vector.size(column) == 2){
        	col_lower = column[0]
            col_upper = column[1]
        }else{
        	dde_error("column has invalid dimensions")
        }
        if ((row_lower < 0) || (row_upper > dim[0]) || (col_lower < 0) || (col_upper > dim[1])){
        	dde_error("indeces exceed matrix dimensions")
        }
        
        let result = Vector.make_matrix(row_upper-row_lower+1, col_upper-col_lower+1)
        for(var i = row_lower; i < row_upper+1; i++){
        	for(var j = col_lower; j < col_upper+1; j++){
        		result[i-row_lower][j-col_lower] = matrix[i][j]
        	}
        }
        return result
    }
    */
    
    
    this.pull = function(matrix, row, column){
    	let dim = Vector.matrix_dimensions(matrix)
        if(dim[0] == 1){
        	matrix = [matrix]
        }
        let row_lower, row_upper, col_lower, col_upper
        if (Vector.size(row) == 1){
        	row_lower = row
            row_upper = row
        }else if (Vector.size(row) == 2){
        	row_lower = row[0]
            row_upper = row[1]
        }else{
        	dde_error("row has invalid dimensions")
        }
        if (Vector.size(column) == 1){
        	col_lower = column
            col_upper = column
        }else if (Vector.size(column) == 2){
        	col_lower = column[0]
            col_upper = column[1]
        }else{
        	dde_error("column has invalid dimensions")
        }
        if ((row_lower < 0) || (row_upper > dim[0]) || (col_lower < 0) || (col_upper > dim[1])){
        	dde_error("indeces exceed matrix dimensions")
        }
        
        let result = Vector.make_matrix(row_upper-row_lower+1, col_upper-col_lower+1)
        for(var i = row_lower; i < row_upper+1; i++){
        	for(var j = col_lower; j < col_upper+1; j++){
        		result[i-row_lower][j-col_lower] = matrix[i][j]
        	}
        }
        if(Vector.matrix_dimensions(result)[0] == 1){
        	return result[0]
        }
        return result
    }
    //Vector.pull([[1, 2, 3], [4, 5, 6], [7, 8, 9]], [1, 2], [1, 2])
    
    
    this.insert = function(big_matrix, small_matrix, location = [0, 0]){
    	let big_dim = Vector.matrix_dimensions(big_matrix)
        let small_dim = Vector.matrix_dimensions(small_matrix)
        let result = big_matrix
        let small_i, small_j
        
        for(let i = location[0]; (i < location[0]+small_dim[0]) && (i < big_dim[0]); i++){
        	for(let j = location[1]; (j < location[1]+small_dim[1]) && (j < big_dim[1]); j++){
        		small_i = i-location[0]
                small_j = j-location[1]
                result[i][j] = small_matrix[small_i][small_j]
        	}
        }
        return result
    }
    /*
    var my_big = Vector.make_matrix(10)
    var my_small = Vector.make_matrix(3, 2, 6)
    debugger
    var result = Vector.insert(my_big, my_small, [3, 4])
    */
    
    this.concatinate = function(direction, matrix_1, matrix_2){
    	let result, dim_1, dim_2
        if(matrix_1.length == 0){
        	return matrix_2
        }
        if(matrix_2.length == 0){
        	return matrix_1
        }
    	switch(direction){
        	//Vertical concatination
            case 0:
            dim_1 = Vector.matrix_dimensions(matrix_1)
            dim_2 = Vector.matrix_dimensions(matrix_2)
            if(dim_1[1] != dim_2[1]){
            	dde_error("Vector.concatinate, matrix widths must match")
            }
            if(dim_1[0] == 1){
            	result = [matrix_1]
            }else{
            	result = matrix_1
            }
            if(dim_2[0] == 1){
            	for(let i = 0; i < dim_2[0]; i++){
            		result.push(matrix_2)
            	}
            }else{
            	for(let i = 0; i < dim_2[0]; i++){
            		result.push(matrix_2[i])
            	}
            }
            break
            
            //Horizontal concatination
            case 1:
            dim_1 = Vector.matrix_dimensions(matrix_1)
            dim_2 = Vector.matrix_dimensions(matrix_2)
            if(dim_1[0] != dim_2[0]){
            	dde_error("Vector.concatinate, matrix heights must match")
            }
            if(dim_1[0] == 1){
            	result = Vector.make_matrix(dim_1[0], dim_1[1]+dim_2[1])[0]
                for(let j = 0; j < dim_1[1]; j++){
                	result[j] = matrix_1[j]
                }
                for(let j = 0; j < dim_2[1]; j++){
                	result[j+dim_1[1]] = matrix_2[j]
                }
            }else{
            	result = Vector.make_matrix(dim_1[0], dim_1[1]+dim_2[1])
                for(let i = 0; i < dim_1[0]; i++){
            		for(let j = 0; j < dim_1[1]; j++){
                		result[i][j] = matrix_1[i][j]
                	}
                	for(let j = 0; j < dim_2[1]; j++){
                		result[i][j+dim_1[1]] = matrix_2[i][j]
                	}
            	}
           	}
            
            break
            default:
            dde_error("In Vector.concatinate, direction must 0 or 1")
        }
        return result
    }
    /*
    var matrix_1 = [1, 2, 3]
    var matrix_2 = [4, 5, 6]
    //debugger
    var ans = Vector.concatinate(0, matrix_1, matrix_2)
	Vector.concatinate(0, [1, 2, 3], [4, 5, 6])  
    Vector.concatinate(1, [1, 2, 3], [4, 5, 6])
    Vector.concatinate(1, [[1, 1], [2, 2], [3, 2]], [[4], [5], [6]])

    var matrix_1 = [1, 2, 3]
    var matrix_2 = [4, 5, 6]
    debugger
    var ans = Vector.concatinate(1, matrix_1, matrix_2)
    
    var matrix_1 = [[1, 1], [2, 2], [3, 2]]
    var matrix_2 = [[4], [5], [6]]
    //debugger
    var ans = Vector.concatinate(1, matrix_1, matrix_2)
    */
    
    this.data_to_file = function(...args){
    //debugger
    
    	let temp_args = Convert.deep_copy(args)
        let file_name, elt, file_string, data_array, table_titles
        let data = []
        for(let i = 0; i < temp_args.length; i++){
        	elt = temp_args[i]
            if($.type(elt) === "string"){
            	//if contains 
            	if (elt.indexOf(" ") > -1){
                	table_titles = elt
                }else if(file_name == undefined){
                	file_name = elt
                }else{
                	dde_error("Vector.data_to_file can only take in one string")
                }
            }else{
            	data.push(elt)
            }
        }
        if(file_name == undefined){
        	dde_error("Vector.data_to_file needs a filename input arg")
        }
        
        let dim = Vector.matrix_dimensions(data[0])
        let height = dim[1]
        data_array = []
        for(var i = 0; i < data.length; i++){
        	elt = data[i]
            dim = Vector.matrix_dimensions(elt)
            if(dim[0] == 1){
            	elt = Vector.transpose(elt)
            }
            data_array = Vector.concatinate(1, data_array, elt)
        }
        
        dim = Vector.matrix_dimensions(data_array)
        if(table_titles == undefined){
        	file_string = ""
        }else{
        	file_string = table_titles + "\r\n"
        }
        for(let i = 0; i < dim[0]; i++){
        	file_string += data_array[i][0]
        	for(let j = 1; j < dim[1]; j++){
        		file_string += " " + data_array[i][j]
            }
            file_string += "\r\n"
        }
        write_file(file_name, file_string)
        return file_string
    }
    /*
    var data_1 = [1, 2, 3, 4]
    var data_2 = [100, 200, 300, 400]
    var filename = "2017/Main_Work_Version_Control/_Test_Files/torque_data.txt"
    var table_titles = "x y"
    //debugger
    var sol = Vector.data_to_file(table_titles, filename, Vector.transpose(data_1), Vector.transpose(data_2))
    
    //write_file("2017/Main_Work_Version_Control/_Test_Files/torque_data.txt", "lol")
    
    var my_string = "hello"
    _.isString(my_string)
    $.type(my_string) === "string"
    
    */
    /*
    var x_data = [361.1, 433.95, 474.3, 534.61, 966.06]
	var y_data = [0, 63500.24892, 158750.6223, 317501.2446, 1587506.223]
	
	var solution = Vector.poly_fit(x_data, y_data, 1)
    //debugger
	var solution = Vector.poly_fit(x_data, y_data, 4)
*/
    
    this.poly_fit = function(x_data, y_data, order = 1){
		let dim_x = Vector.matrix_dimensions(x_data)
    	let dim_y = Vector.matrix_dimensions(y_data)
    	if((dim_x[0]!=1) || (dim_y[0]!=1) || (dim_x[1]!=dim_y[1])){
    		dde_error(" Input data has incorrect dimensions for function Vector.poly_fit()")
    	}
        
		let sol = Vector.make_matrix(1, order)[0]
    	let A, B, B1=0, B2=0, A11=0, A12=0, A21=0, A22=0, xi, yi
    	switch(order){
    		case 0:
        		result = [Vector.average(y_data)]
        		break
        	case 1:
        		for(let i = 0; i < dim_x[1]; i++){
            		xi = x_data[i]
                	yi = y_data[i]
                
            		B1  += 2*xi*yi
                	B2  += 2*yi
                	A11 += 2*xi*xi
                	A12 += 2*xi
                	A21 += 2*xi
                	A22 += 2
            	}
            	A = [[A11, A12], [A21, A22]]
            	B = [[B1], [B2]]
            	sol = Vector.matrix_multiply(Vector.inverse(A), B)
        		break
        	default:
            	let size = order+1
                A = Vector.make_matrix(size)
                B = Vector.make_matrix(size,1)
                let powers = Vector.make_matrix(size, "tilt")
                for(let i = 0; i < dim_x[1]; i++){
            		xi = x_data[i]
                	yi = y_data[i]
                	for(let i = 0; i < size; i++){
                    	for(let j = 0; j < size; j++){
            				A[i][j] += 2*Math.pow(xi, powers[i][j])
                        }
                        B[i][0] += 2*Math.pow(xi, size-i-1)*yi
                    }
            	}
                sol = Vector.matrix_multiply(Vector.inverse(A), B)
    	}
    	return sol
	}
    /*
    
    */
	
}



new TestSuite("Vector Library",
    ["Vector.add([1, 2, 3], [4, 5, 6])", "[5, 7, 9]"],
    ["Vector.add([1, 2, 3], [4, 5, 6], 10, 50)", "[65, 67, 69]"],
    ["Vector.subtract([4, 5, 6], [1, 2, 3])", "[3, 3, 3]"],
	["Vector.subtract([4, 5, 6], 1, [1, 2, 3])", "[2, 2, 2]"],
	["Vector.multiply([1, 2, 3], [4, 5, 6])", "[4, 10, 18]"],
	["Vector.multiply([1, 2, 3], [4, 5, 6], 10, 50)", "[2000, 5000, 9000]"],
	["Vector.size([1, 2, 3])", "3"],
	["Vector.size([10])", "1"],
	["Vector.size(10)", "1"],
	["Vector.normalize([1, 1, 0])", "[0.7071067811865475, 0.7071067811865475, 0]"],
	["Vector.dot([1, 2, 3], [4, 5, 6])", "32"],
	["Vector.cross([1, 2, 3], [4, 5, 6])", "[-3, 6, -3]"],
    ["Vector.transpose(Vector.transpose([1, 2, 3, 4, 5]))", "[1, 2, 3, 4, 5]"],
    ["Vector.is_equal([1, 2, 3], [1, 2, 3.01])", "false"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3.01], 1, "decimal_places")', "true"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3.01], .005, "absolute")', "false"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3.01], .1, "absolute")', "true"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3], .1, "percent_difference")', "true"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3.01], .1, "percent_difference")', "true"],
    ['Vector.is_equal([1, 2, 3], [1, 2, 3.01], .001, "percent_difference")', "false"],
    ['Vector.is_equal([1, 1, 1], [2, 2, 2], 1, "absolute")', "true"],
    ['Vector.is_equal([1, 1, 1], [2, 2, 2], 1, "magnitude")', "false"]
)


new TestSuite("Vector Library - Matrix Math",
    ["Vector.matrix_divide([[1, 0, 0, 10], [0, 1, 0, 20], [0, 0, 1, 30], [0, 0, 0,  1]], [[1, 0, 0, 100], [0, 1, 0, 200], [0, 0, 1, 300], [0, 0, 0,  1]])", "[[1, 0, 0, -90], [0, 1, 0, -180], [0, 0, 1, -270], [0, 0, 0, 1]]"],	
    ["Vector.matrix_divide([[1, 0, 0, 100], [0, 1, 0, 200], [0, 0, 1, 300], [0, 0, 0,  1]], [[1, 0, 0, 10], [0, 1, 0, 20], [0, 0, 1, 30], [0, 0, 0,  1]])", "[[1, 0, 0, 90], [0, 1, 0, 180], [0, 0, 1, 270], [0, 0, 0, 1]]"],
	["Vector.make_matrix(10, 7)", "[[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]]"],
    ["Vector.make_matrix(3)", "[[0, 0, 0], [0, 0, 0], [0, 0, 0]]"],
	["Vector.make_matrix(3, 2, 1)", "[[1, 1], [1, 1], [1, 1]]"],
    ["Vector.transpose(Vector.transpose([1, 2, 3]))", "[1, 2, 3]"],
    ["Vector.matrix_multiply([1, 2, 3], [[1], [2], [3]])", "[[14]]"],
	["Vector.matrix_multiply([[1], [2], [3]], [1, 2, 3])", "[[1, 2, 3], [2, 4, 6], [3, 6, 9]]"],
	["Vector.matrix_multiply([[1, 2, 3], [4, 5, 6]], [[7, 8], [9, 10], [11, 12]])", "[[58, 64], [139, 154]]"],
	["Vector.matrix_multiply([[1, 0, 0, 10], [0, 1, 0, 20], [0, 0, 1, 30], [0, 0, 0,  1]], [[1], [2], [3], [1]])", "[[11], [22], [33], [1]]"],
    ["Vector.transpose([1, 2, 3])", "[[1], [2], [3]]"],
    ["Vector.transpose([[1, 2, 3], [4, 5, 6]])", "[[1, 4], [2, 5], [3, 6]]"],
    ["Vector.determinant([[1, 0, 0], [0, 1, 0], [0, 0, 1]])", "1"],
	["Vector.determinant([[0, 0, 0], [0, 1, 0], [0, 0, 1]])", "0"],
    ["Vector.determinant([[Math.sqrt(2)/2, Math.sqrt(2)/2, 0], [-Math.sqrt(2)/2, Math.sqrt(2)/2, 0], [0, 0, 1]])", "1.0000000000000002"],	
    ["Vector.inverse([[1, 0, 0], [0, 1, 0], [0, 0, 1]])", "[[1, 0, 0], [0, 1, 0], [0, 0, 1]]"],
    ["Vector.inverse([[3, 2, 1.7, 1.5], [4.5, 5, 4.1, 1.9], [1.1, 8.5, 9, 8], [3, 9, 9, 10]])", "[ [ 0.7319863743922018, -0.18592193878878188, 0.10453233481551132, -0.1580986556413699], [ -2.6473723899420833, 1.3118547988663025, -1.2270847960059614, 1.1295212835114843], [ 2.4406479964636474, -1.081727643862005, 1.5172790389266348, -1.374392178277074], [ -0.03354395818706807, -0.1513378578672326, -0.29253451907325856, 0.3678134019814442]]"],
    ["Vector.matrix_divide([[1, 0, 0, 10], [0, 1, 0, 20], [0, 0, 1, 30], [0, 0, 0,  1]], [[1, 0, 0, 100], [0, 1, 0, 200], [0, 0, 1, 300], [0, 0, 0,  1]])", "[[1, 0, 0, -90], [0, 1, 0, -180], [0, 0, 1, -270], [0, 0, 0, 1]]"],
    ["Vector.matrix_dimensions([10, 20, 30])", "[1, 3]"],
    ["Vector.matrix_dimensions([[10], [20], [30]])", "[3, 1]"],
    ["Vector.properly_define_point([10, 20, 30])", "[[10], [20], [30], [1]]"],
    ["Vector.properly_define_point([[10], [20], [30]])", "[[10], [20], [30], [1]]"],
    ["Vector.properly_define_point([[10, 20, 30], [10, 20, 30], [10, 20, 30]])", "[[10, 10, 10], [20, 20, 20], [30, 30, 30], [1, 1, 1]]"],
    ["Vector.make_pose()", "[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]"],
    ["Vector.make_pose([10, 20, 30], [45, 0, 0])", "[ [1, 0, 0, 10], [0, 0.7071067811865476, 0.7071067811865475, 20], [0, -0.7071067811865475, 0.7071067811865476, 30], [0, 0, 0, 1]]"],
    ["Vector.identity_matrix(4)", "[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]"],
    ["Vector.identity_matrix(2)", "[[1, 0], [0, 1]]"],
    ["Vector.rotate_DCM(Vector.identity_matrix(3), [1, 0, 0], 90)", "[[1, 0, 0], [0, 0, -1], [0, 1, 0]]"],
    ['Vector.rotate_pose(Vector.make_pose(), "Z", 90, [10, 0, 0])', "[ [0, -1, 0, 10], [1, 0, 0, -10], [0, 0, 1, 0], [0, 0, 0, 1]]"],
    ["Vector.is_pose(Vector.make_pose())", "true"],
    ["Vector.pull([[1, 2, 3], [4, 5, 6], [7, 8, 9]], [1, 2], [1, 2])", "[[5, 6], [8, 9]]"],
    ["Vector.concatinate(0, [1, 2, 3], [4, 5, 6])", "[[1, 2, 3], [4, 5, 6]]"],
    ["Vector.concatinate(1, [1, 2, 3], [4, 5, 6])", "[1, 2, 3, 4, 5, 6]"],
    ["Vector.concatinate(1, [[1, 1], [2, 2], [3, 2]], [[4], [5], [6]])", "[[1, 1, 4], [2, 2, 5], [3, 2, 6]]"]
)