/*
		 1         2         3         4         5         6         7         8
12345678901234567890123456789012345678901234567890123456789012345678901234567890

	dexter.js

*/

module.exports.DexterSim2 = ( function() {

	let dexter = {};
	
	dexter.LINK1 =	0.228600;   //meters   6.5 inches,
	dexter.LINK2 =	0.320676;   //meters  12 5/8 inches
	dexter.LINK3 =	0.330201;   //meters  13 inches
	dexter.LINK4 =	0.050801;   //meters  2 inches
	dexter.LINK5 =	0.082551;   //meters  3.25 inches  // from pivot point to tip of the end-effector

	/*These are the HDI Link Lengths as of Jan 1, 2020:
	dexter.LINK1 =	0.2352;
	dexter.LINK2 =	0.339092;
	dexter.LINK3 =	0.3075;
	dexter.LINK4 =	0.0595;
	dexter.LINK5 =	0.08244;
	*/

	dexter.LINK1_v1 =	dexter.LINK1 * 1000000; //in microns
	dexter.LINK2_v1 =	dexter.LINK2 * 1000000; //in microns
	dexter.LINK3_v1 =	dexter.LINK3 * 1000000; //in microns
	dexter.LINK4_v1 =	dexter.LINK4 * 1000000; //in microns
	dexter.LINK5_v1 =	dexter.LINK5 * 1000000; //in microns

	dexter.LINK1_AVERAGE_DIAMETER =	 0.090000; //meters
	dexter.LINK2_AVERAGE_DIAMETER =	 0.120000; //meters
	dexter.LINK3_AVERAGE_DIAMETER =	 0.050000; //meters
	dexter.LINK4_AVERAGE_DIAMETER =	 0.035000; //meters
	dexter.LINK5_AVERAGE_DIAMETER =	 0.030000; //meters

	dexter.LEG_LENGTH =	0.152400; //meters  6 inches

	//values in degrees
	dexter.J1_ANGLE_MIN =	-150;
	dexter.J1_ANGLE_MAX =	150;
	dexter.J2_ANGLE_MIN =	-90;
	dexter.J2_ANGLE_MAX =	90;
	dexter.J3_ANGLE_MIN =	-150;
	dexter.J3_ANGLE_MAX =	150;
	dexter.J4_ANGLE_MIN =	-130; //-100
	dexter.J4_ANGLE_MAX =	130;  //100
	dexter.J5_ANGLE_MIN =	-185;
	dexter.J5_ANGLE_MAX =	185;
	dexter.J6_ANGLE_MIN =	0;
	dexter.J6_ANGLE_MAX =	296;
	dexter.J7_ANGLE_MIN =	0;
	dexter.J7_ANGLE_MAX =	296;

	dexter.MAX_SPEED =		30; //degrees per second. NOT the max speed tha robot,
								 //but rather for a givien instruction's envelope of speed,
								 //its the max speed that will be attined by that instrution.
								 //The JOINT that this is the max speed for is
								 //the joint that changes the most in a given call to move_all_joints.
	dexter.START_SPEED  =	0.5;//degrees per second
	dexter.ACCELERATION =	0.000129;//degrees/(second^2)

	dexter.RIGHT_ANGLE    =	90;// 90 degrees
	dexter.HOME_ANGLES    =	[0, 0, 0, 0, 0, 0, 0]; //j2,j3,j4 straight up, link 5 horizontal pointing frontwards.
	dexter.NEUTRAL_ANGLES =	[0, 45, 90, -45, 0, 0, 0];//lots of room for Dexter to move from here.
	dexter.PARKED_ANGLES  =	[0, 0, 135, 45, 0, 0, 0];//all folded up, compact.

	dexter.HOME_POSITION    =	[[0, 0.08255, 0.866775],[0, 1, 0], [1, 1, 1]];//meters, j5 direction, config
	dexter.NEUTRAL_POSITION =	[[0, 0.5,     0.075],   [0, 0, -1],[1, 1, 1]];   //meters, j5 direction, config

	//	For now.
	dexter.COLOR =			0x505050;
	dexter.LINK1_MASS  =	2.0;
	dexter.LINK2_MASS  =	6.0;
	dexter.LINK3_MASS  =	3.0;
	dexter.LINK4_MASS  =	0.5;
	dexter.LINK5_MASS  =	0.5;
//	dexter.LINK6_MASS  =	0.1;
	dexter.LINK6_MASS  =	0.2;
//	dexter.FINGER_MASS =	0.04; 
	dexter.FINGER_MASS =	0.00; 

	dexter.HiRes =			{ base:		null,
							  link1:	null,
							  link2:	null,
							  link3:	null,
							  link4:	null,
							  link5:	null,
							  link6:	null,
							  //	Either of these (but not both) can open 
							  //	and close the gripper.
							  link7:	null,	
							  finger:	null }; 

	return dexter;
} )();


