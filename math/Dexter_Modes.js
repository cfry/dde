//Kent Gilson
//James Wigglesworth
//Fry 

function setFollowMe(robot){
	let pidXYZ  = 0x3e4ecccc //not set in this file
	let pidRP   = 0x3cf5c28f
	let pidBase = 0x3e4ecccc
	let PID_P = 20
	let PID_ADDRESS = 21
	let DIFF_FORCE_SPEED_FACTOR_ANGLE = 55
	let DIFF_FORCE_SPEED_FACTOR_ROT   = 56
	let SPEED_FACTORA = 27
	let DEF_SPEED_FACTOR_A    = 30
	let DEF_SPEED_FACTOR_DIFF = 8
	let result = [
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ANGLE, DEF_SPEED_FACTOR_DIFF),
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, DEF_SPEED_FACTOR_DIFF),
        make_ins("w", PID_P, 0),
        make_ins("w", PID_ADDRESS, 3),
        make_ins("w", PID_ADDRESS, 4),
        make_ins("w", PID_ADDRESS, 0),
        make_ins("w", PID_ADDRESS, 1),
        make_ins("w", PID_ADDRESS, 2),
        make_ins("w", SPEED_FACTORA, DEF_SPEED_FACTOR_A),
        make_ins("S", "J1Friction",5) ,
        make_ins("S", "J2Friction",5) ,
        make_ins("S", "J3Friction",5) ,
        make_ins("S", "J4Friction",15),
        make_ins("S", "J5Friction",15) ,
        make_ins("w", 67, 0),
        make_ins("w", 68, 0),
        make_ins("w", 69, 0),
        make_ins("w", 70, 0),
        make_ins("w", 71, 0),
        make_ins("w", 51, 140000),
        make_ins("w", 54, 200000),

	    make_ins("w", 79, 50 ^ 200) ,
        make_ins("w", 80, 50 ^ 200) ,
        make_ins("w", 81, 50 ^ 200) ,
        make_ins("w", 42, 12448)
    ]
    Instruction.add_robot_to_instructions(result)
    return result
}

function setForceProtect(robot){
	let pidXYZ  = 0x3e4ecccc //not set in this file
	let pidRP   = 0x3cf5c28f
	let pidBase = 0x3e4ecccc
	let PID_P = 20
	let PID_ADDRESS = 21
	let DIFF_FORCE_SPEED_FACTOR_ANGLE = 55
	let DIFF_FORCE_SPEED_FACTOR_ROT   = 56
	let SPEED_FACTORA = 27
	let DEF_SPEED_FACTOR_A    = 30
	let DEF_SPEED_FACTOR_DIFF = 8
	let result = [
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ANGLE, 3),
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 3),
        make_ins("w", SPEED_FACTORA, 10),
        make_ins("S", "J1Friction",2),
        make_ins("S", "J2Friction",3),
        make_ins("S", "J3Friction",9),
        make_ins("S", "J4Friction",15),
        make_ins("S", "J5Friction",15),
        make_ins("w", PID_ADDRESS, 0),
        make_ins("w", PID_P, pidBase),
   	    make_ins("w", PID_ADDRESS, 1),
        make_ins("w", PID_P, pidXYZ),
  	    make_ins("w", PID_ADDRESS, 2),
  	    make_ins("w", PID_ADDRESS, 3),
  	    make_ins("w", PID_P, pidRP),
  	    make_ins("w", PID_ADDRESS, 4),
        make_ins("w", 67, 9000),
        make_ins("w", 68, 9000),
        make_ins("w", 69, 9000),
        make_ins("w", 70, 9000),
        make_ins("w", 71, 9000),
        make_ins("w", 42, 12448)
    ]
    Instruction.add_robot_to_instructions(result)
    return result
}

function setKeepPosition(robot){
	let pidXYZ  = 0x3e4ecccc //not set in this file
	let pidRP   = 0x3cf5c28f
	let pidBase = 0x3e4ecccc
	let PID_P = 20
	let PID_ADDRESS = 21
	let DIFF_FORCE_SPEED_FACTOR_ANGLE = 55
	let DIFF_FORCE_SPEED_FACTOR_ROT   = 56
	let SPEED_FACTORA = 27
	let DEF_SPEED_FACTOR_A    = 30
	let DEF_SPEED_FACTOR_DIFF = 8
	let result = [
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ANGLE, 0),
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0),
        make_ins("w", PID_ADDRESS, 0),
        make_ins("w", PID_P, pidBase),
   	    make_ins("w", PID_ADDRESS, 1),
        make_ins("w", PID_P, pidXYZ),
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0),
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0),
  	    make_ins("w", PID_ADDRESS, 2),
  	    make_ins("w", PID_ADDRESS, 3),
  	    make_ins("w", PID_P, pidRP),
  	    make_ins("w", PID_ADDRESS, 4),
  	    make_ins("w", SPEED_FACTORA, 0),
        make_ins("w", 42, 12960)
    ]
    Instruction.add_robot_to_instructions(result)
    return result
}

function setOpenLoop(robot){
	let pidXYZ  = 0x3e4ecccc //not set in this file
	let pidRP   = 0x3cf5c28f
	let pidBase = 0x3e4ecccc
	let PID_P = 20
	let PID_ADDRESS = 21
	let DIFF_FORCE_SPEED_FACTOR_ANGLE = 55
	let DIFF_FORCE_SPEED_FACTOR_ROT   = 56
	let SPEED_FACTORA = 27
	let DEF_SPEED_FACTOR_A    = 30
	let DEF_SPEED_FACTOR_DIFF = 8
	let result = [
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ANGLE, 0),
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0),
	    make_ins("w", PID_ADDRESS, 0),
        make_ins("w", PID_P, 0),
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0),
        make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0),
   	    make_ins("w", PID_ADDRESS, 1),
  	    make_ins("w", PID_ADDRESS, 2),
  	    make_ins("w", PID_ADDRESS, 3),
  	    make_ins("w", PID_P, 0),
  	    make_ins("w", PID_ADDRESS, 4),
  	    make_ins("w", SPEED_FACTORA, 0),
        make_ins("w", 42, 12960)
    ]
    Instruction.add_robot_to_instructions(result)
    return result
}