//Vector Library + Inverse Kinematics + Forward Kinematics
//James Wigglesworth
//Started: 6_18_16
//Updated: 8_7_16


//Public
//This class is used to convert units of numbers and arrays
var Convert = new function(){


	//Private
    //This is used to prevent functions from altering outside arrays
    this.deep_copy = function(arg){
    	if (typeof(arg) == "number"){
        	return arg
        }else{
        	let result = []
        	for(var i = 0; i < arg.length; i++){
            	let elt = arg[i]
                if (typeof(elt) !== "number"){
                    elt = elt.slice(0)
                }
                result.push(elt)
            }
            return result
        }
    }
        
    

	//*******************************************
	//Angles:
    //Note: general syntax is "[input units (plural)]_to_[output units (plural)]"
    
    //Public
    this.radians_to_degrees = function(radians){
    	var degrees
		if (Vector.size(radians) === 1){
        	degrees = radians * 180 / Math.PI
        }else{
    		degrees = new Array(Vector.size(radians))
        	for(var i = 0; i < Vector.size(radians); i++){
        		degrees[i] = radians[i] * 180 / Math.PI
        	}
        }
        return degrees
    }
    
    
    //Public
    this.degrees_to_radians = function(degrees){
    	var radians
		if (Vector.size(degrees) === 1){
        	radians = degrees * Math.PI / 180
        }else{
    		radians = new Array(Vector.size(degrees))
        	for(var i = 0; i < Vector.size(degrees); i++){
        		radians[i] = degrees[i] * Math.PI / 180
        	}
        }
        return radians
    }
    
    //Public
    this.degrees_to_arcseconds = function(degrees){
    	var arcseconds
		if (Vector.size(degrees) === 1){
        	arcseconds = degrees * 3600
            //arcseconds = Math.round(degrees * 3600)
        }else{
    		arcseconds = new Array(Vector.size(degrees))
        	for(var i = 0; i < Vector.size(degrees); i++){
        		arcseconds[i] = degrees[i] * 3600
                //arcseconds[i] = Math.round(degrees[i] * 3600)
        	}
        }
        return arcseconds
    }
    
    //Public
    this.arcseconds_to_degrees = function(arcseconds){
    	var degrees
		if (Vector.size(arcseconds) === 1){
        	degrees = arcseconds / 3600
        }else{
    		degrees = new Array(Vector.size(arcseconds))
        	for(var i = 0; i < Vector.size(arcseconds); i++){
        		degrees[i] = arcseconds[i] / 3600
        	}
        }
        return degrees
    } 
    
    //Public
    this.radians_to_arcseconds = function(radians){
    	var degrees = Convert.radians_to_degrees(radians)
        return Convert.degrees_to_arcseconds(degrees)
    }
    
    //Public
    this.arcseconds_to_radians = function(arcseconds){
    	var degrees = Convert.arcseconds_to_degrees(arcseconds)
        return Convert.degrees_to_radians(degrees)
    }
    
    //*******************************************
    
    //*******************************************
    //distance
    
    //Public
    this.mms_to_microns = function(mm){
    	var microns
		if (Vector.size(mm) === 1){
        	microns = mm * 1000
            //microns = Math.round(mm * 1000)
        }else{
    		microns = new Array(Vector.size(mm))
            for(var i = 0; i < Vector.size(mm); i++){
        		microns[i] = mm[i] * 1000
                //microns[i] = Math.round(mm[i] * 1000)
        	}
        }
        return microns
    }
    
    //Public
    this.microns_to_mms = function(microns){
    	var mms
		if (Vector.size(microns) === 1){
        	mms = microns / 1000
        }else{
        	mms = Vector.multiply(.001, microns)
        }
        return mms
    }
    
    //Public
    this.mms_to_meters = function(mms){
    	var meters
		if (Vector.size(mms) === 1){
        	meters = mms / 1000
        }else{
    		meters = new Array(Vector.size(mms))
        	for(var i = 0; i < Vector.size(mms); i++){
        		meters[i] = mms[i] / 1000
        	}
        }
        return meters
    }
    
    //Public
    this.meters_to_mms = function(meters){
    	var mms
		if (Vector.size(meters) === 1){
        	mms = meters * 1000
        }else{
    		mms = new Array(Vector.size(meters))
        	for(var i = 0; i < Vector.size(meters); i++){
        		mms[i] = meters[i] * 1000
        	}
        }
        return mms
    }
    
    //Public
    this.meters_to_microns = function(meters){
    	var mms = Convert.meters_to_mms(meters)
        return Convert.mms_to_microns(mms)
    }
    
    //Public
    this.microns_to_meters = function(microns){
    	var mms = Convert.microns_to_mms(microns)
        return Convert.mms_to_meters(mms)
    }
    
}

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
    
    
    
    //Public
    //a more robust version of ".length"
    //will return 1 for both a number and array elemement (if it's length is 1)
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
    	var temp_size = a.length
        
        
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
    
    //Vector.size([0, 0, 1])

    //Public
    //Returns the unit vector of the input
    //Works for both 2D and 3D vectors
    this.normalize = function(vector){
    	var magnitude
    	switch(Vector.size(vector)){
        	case 2:
            	magnitude = Vector.distance(vector)
            	return [vector[0] / magnitude, vector[1] / magnitude]
			case 3:
            	magnitude = Vector.distance(vector)
                return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude]
            case 4:
            	magnitude = Vector.distance(vector)
                return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude]
        	default:
            	out("Error: the function 'Vector.normalize()' takes vector inputs of size 2 or 3")
        }
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
                		out("Error: Reconsider the input size in the function 'Vector.dot()'", "red")
                    	return null
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
    
    
    
    //Private
    //*************************************************
    //trigonometric functions with angles in arcseconds
    //These might belong in a different Class
    
    
    //Trig
    this.cos_arcsec = function(theta){
        return Math.cos(Convert.arcseconds_to_radians(theta))
    }
    this.sin_arcsec = function(theta){
    	return Math.sin(Convert.arcseconds_to_radians(theta))
    }
    this.tan_arcsec = function(theta){
    	return Math.tan(Convert.arcseconds_to_radians(theta))
    }
    
    //Inverse Trig
    this.asin_arcsec = function(ratio){
    	//return Math.round(Convert.radians_to_arcseconds(Math.asin(ratio)))
        return Convert.radians_to_arcseconds(Math.asin(ratio))
    }
    
    this.acos_arcsec = function(ratio){
    	return Convert.radians_to_arcseconds(Math.acos(ratio))
        //return Math.round(Convert.radians_to_arcseconds(Math.acos(ratio)))
    }
    
    this.atan_arcsec = function(ratio){
    	return Convert.radians_to_arcseconds(Math.atan(ratio))
        //return Math.round(Convert.radians_to_arcseconds(Math.atan(ratio)))
    }
    
    this.atan2_arcsec = function(a, b){
    	return Convert.radians_to_arcseconds(Math.atan2(a, b))
        //return Math.round(Convert.radians_to_arcseconds(Math.atan2(a, b)))
    }
    
    
    
    //*************************************************
    
    
	//Public
    //This is used to add vectors or equal length
    //Can also add scalars to each element in vector
    //unlimited number of inputs args
    this.add = function(...args){
        let temp_args = Convert.deep_copy(args)
        var sum = temp_args[0]
        
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
        return sum
        
    }
    
    
    
    //Public
    //This is used to add vectors or equal length
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
        	Kin.distance(VECTOR)       -> magnitude of VECTOR
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
            return
            
        }

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
		if (plane.length === 4){
        	var short_plane = [plane[0], plane[1], plane[2]]
    	}
		var term1 = Vector.dot(vector, short_plane)
    	var term2 = Math.pow(Vector.distance(short_plane), 2)
		return Vector.subtract(vector, Vector.multiply(term1 / term2, short_plane))
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
        	for(var i = 0; i < temp_array.length; i++){
            	temp_array[i] = Math.round(mulitplier * temp_array[i]) / mulitplier
            }
            return temp_array
        }
    }

    
    
    //Public
    this.is_equal = function(array1, array2, decimal_places = 14){
    	if (array1.length !== array2.length){
        	return false
        }else{
        	let array1_temp = Vector.round(Convert.deep_copy(array1), decimal_places)
        	let array2_temp = Vector.round(Convert.deep_copy(array2), decimal_places)
        	var result = true
        	for(var i = 0; i < array1_temp.length; i++){
            	if (array1_temp[i] !== array2_temp[i]){
                	result = false
                    break
                }
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
            	result = 648000 //this is 180 degrees in arcseconds
            }else{
            	var result = Vector.atan2_arcsec(Vector.distance(Vector.cross(short_A, short_B)), Vector.dot(short_A, short_B))
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
        	//debugger
            out("Error: input vectors do not lie in plane")
        }
    	
    	var guess_angle = Vector.angle(vector_A, vector_B)
        var guess_vector = Vector.round(Vector.rotate(vector_A, plane, guess_angle), 3)
        var test_vector = Vector.round([vector_B[0], vector_B[1], vector_B[2]], 3)
        
        if (Vector.is_equal(guess_vector, test_vector)){
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
                
                
                
                return
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
        }
    }
    
    //Public
    //rotates a vector in 3D space on a plane by angle theta
    //will also rotate a point about a line by substituting the line's vector in plane and its point in point
    this.rotate = function(vector, plane, theta, point = [0, 0, 0]){
    	var short_vector = Vector.shorten(vector)
        plane =  Vector.normalize(Vector.shorten(plane))
        let result = Vector.add(Vector.multiply(Vector.cos_arcsec(theta), short_vector),
               Vector.multiply(Vector.sin_arcsec(theta), Vector.cross(Vector.shorten(plane), short_vector)),
               point)
        return result
    }
    
    
    
    this.move_points_to_plane = function(point_list, pointA = [0, 0, 0], pointB = [1, 0, 0], pointC = [0, 1, 0], U4 = [0, 0, 1]){
		
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

//debugger
/*
var point_list = [[0, 0, 0], [100000, 0, 0], [100000, 100000, 0], [0, 100000, 0]]
//Vector.add(point_list, [10000, 0])
var pointA = [441543, 143953, 612665]
var pointB = [447231, 271541, 604905]
var pointC = [451538, 283335, 607526]
var results = Vector.three_points_to_transformation(point_list, pointA, pointB, pointC, [651538, 283335, 607526])
let plane_1 = Vector.points_to_plane(pointA, pointB, pointC)
let plane_2 = Vector.points_to_plane(results[0], results[1], results[2])
out(plane_1)
out(plane_2)
*/
}

/*
rot_plane = cross(points_plane, [0, 0, 1])
debugger
Vector.cross([Px, Py, Pz], [0, 0, 1])
rot_plane = [Py, -Pz, 0]

[x*cos(theta), y*cos(theta), 0] + cross([Py, -Pz, 0], [x, y, 0])*sin(theta)
[0, 0, Py*y + Pz*x]

[x*cos(theta)+dx, y*cos(theta)+dy, (Py*y + Pz*x)*sin(theta)+dz]
*/







//Public
//This class contains functions for the kinematics of the robot
//As of now it only does kinematcs for a non-moving points
var Kin = new function(){
	
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
        	dde_error('Location is ' + out_of_reach_dist + ' mm out of reach')
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
	["Vector.cross([1, 2, 3], [4, 5, 6])", "[-3, 6, -3]"]
)