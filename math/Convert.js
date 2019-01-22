//Convert Class
//James Wigglesworth
//Started: 6_18_16
//Updated: 3_27_17


class Convert{
	//Private
    //This is used to prevent functions from altering outside arrays
    static deep_copy(arg){
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
    //Rotation representation conversions:

    static angles_to_DCM(angles = [0, 0, 0], sequence = "XYZ"){
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

    static DCM_to_angles(DCM, sequence = "XYZ"){
    	
    }

    static quat_to_DCM(quaternion = [1, 0, 0, 0]){
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


    static DCM_to_quat(DCM){
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

module.exports = Convert
var Vector = require("./Vector.js")
