//new Dexter({name: "my_dex2", ip_address: "192.168.1.142", port: 50000, enable_heartbeat: false, simulate: false})
new Job({name: "cal_optical",
	//Robot: "my_dex2",
    do_list: [function(){return save_boundaries()},
    		  setOpenLoop(),
    		  make_ins("w", 42,64),
    		  make_ins("w", 42,0),
              make_ins("w", 42,256),
              make_ins("w", 42,0),
              make_ins("S", "MaxSpeed", 30),
              make_ins("S", "Acceleration", 0.000129),
              make_ins("S", "StartSpeed", .05),
              make_ins("w", 79, 50 ^ 200 ),
              make_ins("w", 80, 50 ^ 200 ),
              make_ins("w", 81, 50 ^ 200 ),
        	  make_ins("S", "J1BoundryLow",-188),
              make_ins("S", "J1BoundryHigh",188),
              make_ins("S", "J2BoundryLow",-97),
              make_ins("S", "J2BoundryHigh",97),
              make_ins("S", "J3BoundryLow",-158),
              make_ins("S", "J3BoundryHigh",158),
              make_ins("S", "J4BoundryLow",-108),
              make_ins("S", "J4BoundryHigh",108),
              make_ins("S", "J5BoundryLow",-190),
              make_ins("S", "J5BoundryHigh",190),
    		  Dexter.move_all_joints(187,0,0,0,0),
              make_ins("F"),
              make_ins("S", "MaxSpeed",10),
              make_ins("w", 42,1),
              Dexter.move_all_joints(-187,0,0,0,0),
              make_ins("F"),
              make_ins("w", 42,0),
              make_ins("S", "MaxSpeed",30),
              Dexter.move_all_joints(0,0,0,0,0),
              Dexter.move_all_joints(0,92,0,0,0),
              make_ins("F"),
              make_ins("S", "MaxSpeed",10),
			  make_ins("w", 42,4),
              Dexter.move_all_joints(0,-92,0,0,0),
              make_ins("F"),
              make_ins("w", 42,0),
              make_ins("S", "MaxSpeed",30),
              Dexter.move_all_joints(0,0,0,0,0),
              Dexter.move_all_joints(0,0,153,0,0),
              make_ins("F"),
              make_ins("S", "MaxSpeed",10),
              make_ins("w", 42,2),
              Dexter.move_all_joints(0,0,-153,0,0),
              make_ins("F"),
              make_ins("w", 42,0),
              make_ins("S", "MaxSpeed",30),              
              Dexter.move_all_joints(0,0,0,0,0),
              make_ins("S", "MaxSpeed", 10),
              Dexter.move_all_joints(0,0,0,103,0),
              make_ins("F"),
              make_ins("w", 42,1024),
              Dexter.move_all_joints(0,0,0,-103,0),
              make_ins("F"),
              make_ins("w", 42,0),
              Dexter.move_all_joints(0,0,0,0,189),
              make_ins("F"),
              make_ins("w", 42,2048),
              Dexter.move_all_joints(0,0,0,0,-189),
              make_ins("F"),
              make_ins("w", 42,0),
              Dexter.move_all_joints(0,0,0,0,0),
              make_ins("S", "MaxSpeed", 30),
              Dexter.move_all_joints(30,30,30,30,30),
              Dexter.move_all_joints(0,0,0,0,0),
              make_ins("w", 42,12448),
              make_ins("l"),
              setKeepPosition(),
              function(){return restore_boundaries()},
              function(){
                   cal_instructions_id.innerHTML =
                  "Calibration completed. Click on the <b>x</b><br/>&nbsp;&nbsp;&nbsp;&nbsp;in the upper right to close this dialog."}
    ]})

var cal_old_boundaries

function save_boundaries(){
	cal_old_boundaries = [Dexter.J1_ANGLE_MIN, Dexter.J1_ANGLE_MAX,
    				  Dexter.J2_ANGLE_MIN, Dexter.J2_ANGLE_MAX,
                      Dexter.J3_ANGLE_MIN, Dexter.J3_ANGLE_MAX,
                      Dexter.J4_ANGLE_MIN, Dexter.J4_ANGLE_MAX,
                      Dexter.J5_ANGLE_MIN, Dexter.J5_ANGLE_MAX
                      ]
                      
    Dexter.J1_ANGLE_MIN = -188
    Dexter.J1_ANGLE_MAX = 188
    Dexter.J2_ANGLE_MIN = -97
    Dexter.J2_ANGLE_MAX = 97
    Dexter.J3_ANGLE_MIN = -158
    Dexter.J3_ANGLE_MAX = 158
    Dexter.J4_ANGLE_MIN = -108
    Dexter.J4_ANGLE_MAX = 108
    Dexter.J5_ANGLE_MIN = -190
    Dexter.J5_ANGLE_MAX = 190               
}

function restore_boundaries(){
	Dexter.J1_ANGLE_MIN = cal_old_boundaries[0]
    Dexter.J1_ANGLE_MAX = cal_old_boundaries[1]
    Dexter.J2_ANGLE_MIN = cal_old_boundaries[2]
    Dexter.J2_ANGLE_MAX = cal_old_boundaries[3]
    Dexter.J3_ANGLE_MIN = cal_old_boundaries[4]
    Dexter.J3_ANGLE_MAX = cal_old_boundaries[5]
    Dexter.J4_ANGLE_MIN = cal_old_boundaries[6]
    Dexter.J4_ANGLE_MAX = cal_old_boundaries[7]
    Dexter.J5_ANGLE_MIN = cal_old_boundaries[8]
    Dexter.J5_ANGLE_MAX = cal_old_boundaries[9]
    cal_old_boundaries = undefined
}

