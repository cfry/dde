//Convert Class
//James Wigglesworth
//Started: 6_18_16
//Updated: 3_27_17


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
    
    this.inches_to_microns = function(inches){
    	let meters = inches*0.0254
    	var mms = Convert.meters_to_mms(meters)
        return Convert.mms_to_microns(mms)
    }
    
    
    //*******************************************
    //Rotation representation conversions:
    
    this.angles_to_DCM = function(angles = [0, 0, 0], sequence = "XYZ"){
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
    //Convert.angles_to_DCM([Convert.degrees_to_arcseconds(45), Convert.degrees_to_arcseconds(45), 0])
      
    this.DCM_to_angles = function(DCM, sequence = "XYZ"){
    	
    }
    
    this.quat_to_DCM = function(quaternion = [1, 0, 0, 0]){
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

    
    this.DCM_to_quat = function(DCM){
    	//Algorithm was found here:
        //http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/
    	let trace = DCM[0][0] + DCM[1][1] + DCM[2][2]
        let S, w, x, y, z, quaternion
        if(trace > 0){
        	S = Math.sqrt(1.0 + trace) * 2
			w = .25 * S
            x = (DCM[2][1] - DCM[1][2]) / S
            y = (DCM[2][1] - DCM[1][2]) / S
            z = (DCM[2][1] - DCM[1][2]) / S
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
    
}