//Kent Gilson
//James Wigglesworth

var pidXYZ = 0x3e4ecccc
var pidRP = 0x3cf5c28f
var pidBase = 0x3f000000

var PID_DELTATNOT = 16
var PID_DELTAT = 17
var PID_D = 18
var PID_I = 19
var PID_P = 20
var PID_ADDRESS = 21

var DIFF_FORCE_SPEED_FACTOR_ANGLE = 55
var DIFF_FORCE_SPEED_FACTOR_ROT = 56
var SPEED_FACTORA = 27
var SPEED_FACTORB = 28

var DEF_SPEED_FACTOR_A = 30
var DEF_SPEED_FACTOR_DIFF = 8

function setFollowMe(){
	var retCMD = []
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ANGLE, DEF_SPEED_FACTOR_DIFF))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, DEF_SPEED_FACTOR_DIFF))
    retCMD.push(make_ins("w", PID_P, 0))
    retCMD.push(make_ins("w", PID_ADDRESS, 3))
    retCMD.push(make_ins("w", PID_ADDRESS, 4))
    retCMD.push(make_ins("w", PID_ADDRESS, 0))
    retCMD.push(make_ins("w", PID_ADDRESS, 1))
    retCMD.push(make_ins("w", PID_ADDRESS, 2))
    retCMD.push(make_ins("w", SPEED_FACTORA, DEF_SPEED_FACTOR_A))
    retCMD.push(make_ins("S", "J1Friction",5 ))
    retCMD.push(make_ins("S", "J2Friction",5 ))
    retCMD.push(make_ins("S", "J3Friction",5 ))
    retCMD.push(make_ins("S", "J4Friction",15 ))
    retCMD.push(make_ins("S", "J5Friction",15 ))
    retCMD.push(make_ins("w", 67, 0))
    retCMD.push(make_ins("w", 68, 0))
    retCMD.push(make_ins("w", 69, 0))
    retCMD.push(make_ins("w", 70, 0))
    retCMD.push(make_ins("w", 71, 0))
    retCMD.push(make_ins("w", 51, 140000))
    retCMD.push(make_ins("w", 54, 200000))

	retCMD.push(make_ins("w", 79, 50 ^ 200 ))
    retCMD.push(make_ins("w", 80, 50 ^ 200 ))
    retCMD.push(make_ins("w", 81, 50 ^ 200 ))
    retCMD.push(make_ins("w", 42, 12448))
    return retCMD  
}

function setForceProtect(){
	var retCMD = []
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ANGLE, 3))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 3))
    retCMD.push(make_ins("w", SPEED_FACTORA, 10))
    retCMD.push(make_ins("S", "J1Friction",2 ))
    retCMD.push(make_ins("S", "J2Friction",3 ))
    retCMD.push(make_ins("S", "J3Friction",9 ))
    retCMD.push(make_ins("S", "J4Friction",15 ))
    retCMD.push(make_ins("S", "J5Friction",15 ))
    retCMD.push(make_ins("w", PID_ADDRESS, 0))
    retCMD.push(make_ins("w", PID_P, pidBase))
   	retCMD.push(make_ins("w", PID_ADDRESS, 1))
    retCMD.push(make_ins("w", PID_P, pidXYZ))
  	retCMD.push(make_ins("w", PID_ADDRESS, 2))
  	retCMD.push(make_ins("w", PID_ADDRESS, 3))
  	retCMD.push(make_ins("w", PID_P, pidRP))
  	retCMD.push(make_ins("w", PID_ADDRESS, 4))
    retCMD.push(make_ins("w", 67, 9000))
    retCMD.push(make_ins("w", 68, 9000))
    retCMD.push(make_ins("w", 69, 9000))
    retCMD.push(make_ins("w", 70, 9000))
    retCMD.push(make_ins("w", 71, 9000))
    retCMD.push(make_ins("w", 42, 12448))
    return retCMD  
}

function setKeepPosition(){
	var retCMD = []
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ANGLE, 0))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0))
    retCMD.push(make_ins("w", PID_ADDRESS, 0))
    retCMD.push(make_ins("w", PID_P, pidBase))
   	retCMD.push(make_ins("w", PID_ADDRESS, 1))
    retCMD.push(make_ins("w", PID_P, pidXYZ))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0))
  	retCMD.push(make_ins("w", PID_ADDRESS, 2))
  	retCMD.push(make_ins("w", PID_ADDRESS, 3))
  	retCMD.push(make_ins("w", PID_P, pidRP))
  	retCMD.push(make_ins("w", PID_ADDRESS, 4))
  	retCMD.push(make_ins("w", SPEED_FACTORA, 0))
    retCMD.push(make_ins("w", 42, 12960))
    return retCMD
}

function setOpenLoop(){
	var retCMD = []
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ANGLE, 0))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0))
	retCMD.push(make_ins("w", PID_ADDRESS, 0))
    retCMD.push(make_ins("w", PID_P, 0))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0))
   	retCMD.push(make_ins("w", PID_ADDRESS, 1))
  	retCMD.push(make_ins("w", PID_ADDRESS, 2))
  	retCMD.push(make_ins("w", PID_ADDRESS, 3))
  	retCMD.push(make_ins("w", PID_P, 0))
  	retCMD.push(make_ins("w", PID_ADDRESS, 4))
  	retCMD.push(make_ins("w", SPEED_FACTORA, 0))
    retCMD.push(make_ins("w", 42, 12960))
    return retCMD
}
