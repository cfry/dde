/* Job.j1                    //the newly created Job instance
 Job.j1.status_code
 Job.j1.robot.joint_angles() //array of 5 angles, each in arcseconds
 Job.j1.robot.joint_angle(2) //1 thru 5
 Job.j1.robot.joint_xyz(5)   //0 thru 5, default 5. 0 is robot base position
 Job.j1.robot.joint_xyzs()   //Array of base xyz and all joint xyzs.
*/
//Kent Gilson
//James Wigglesworth

/* Fry notes:
- js has a new declaration "const" for "vars that are never set, ony initialized.
  I've used that on those "var"s that are not set in this file.
  Maybe access is a little faster but I do it to make the intent clearer.
  If you attempt to set a const, you get a warning, which is good.
  
- I simplified using push and a variable to return by
  just building an array and using it.
 */

const pidXYZ  = 0x3e4ecccc //not set in this file
const pidRP   = 0x3cf5c28f
const pidBase = 0x3f000000
//var PID_DELTATNOT = 16 //not used in this file
//var PID_DELTAT = 17    //not used in this file
//var PID_D = 18         //not used in this file
//var PID_I = 19         //not used in this file
const PID_P = 20
const PID_ADDRESS = 21

const DIFF_FORCE_SPEED_FACTOR_ANGLE = 55
const DIFF_FORCE_SPEED_FACTOR_ROT   = 56
const SPEED_FACTORA = 27
//var SPEED_FACTORB = 28  //not used in this file

const DEF_SPEED_FACTOR_A    = 30
const DEF_SPEED_FACTOR_DIFF = 8

function setFollowMe(){
	return [
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
}

function setForceProtect(){
	return [
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
}

function setKeepPosition(){
	return [
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
}

function setOpenLoop(){
	return [
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
}