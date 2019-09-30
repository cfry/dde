function init_calibrate_optical(a_dexter=null, make_ins_file_name="Cal.make_ins") {
  if(!a_dexter){
      a_dexter = cal_get_robot()
  }
  new Job({name: "CalEncoders",
  			show_instructions: false,
            robot: a_dexter,
            do_list: [ make_ins("S", "RunFile", make_ins_file_name) ]
  })
}
  /*
              make_ins("w", 42,64),
    		  make_ins("w", 42,0),
              make_ins("w", 42,256),
              make_ins("w", 42,0),
              make_ins("w", 79, 50 ^ 200 ),
              make_ins("w", 80, 50 ^ 200 ),
              make_ins("w", 81, 50 ^ 200 ),
              make_ins("S", "J1BoundryHigh",670010 * _arcsec),
        	  make_ins("S", "J1BoundryLow",-670010 * _arcsec),
              make_ins("S", "J2BoundryLow",-350010 * _arcsec),
              make_ins("S", "J2BoundryHigh",350010 * _arcsec),
              make_ins("S", "J3BoundryLow",-570010 * _arcsec),
              make_ins("S", "J3BoundryHigh",570010 * _arcsec),
              make_ins("S", "J4BoundryLow",-390010 * _arcsec),
              make_ins("S", "J4BoundryHigh",390010 * _arcsec),
              make_ins("S", "J5BoundryLow",-680010 * _arcsec),
              make_ins("S", "J5BoundryHigh",680010 * _arcsec),
    		  
              
              make_ins("a", ...[670000,0,0,0,0].arcsec()),
              make_ins("F"),
              make_ins("w", 42,1),
              make_ins("a", ...[-670000,0,0,0,0].arcsec()),
              make_ins("F"),
              make_ins("w", 42,0),
              
              make_ins("a", ...[0,0,0,0,0].arcsec()),
              make_ins("a", ...[0,350000,0,0,0].arcsec()),
              make_ins("F"),
              make_ins("w", 42,4),
              make_ins("a", ...[0,-350000,0,0,0].arcsec()),
              make_ins("F"),
              make_ins("w", 42,0),
              
              make_ins("a", ...[0,0,0,0,0].arcsec()),
              make_ins("a", ...[0,0,570000,0,0].arcsec()),
              make_ins("F"),
              make_ins("w", 42,2),
              make_ins("a", ...[0,0,-570000,0,0].arcsec()),
              make_ins("F"),
              make_ins("w", 42,0),
              
              make_ins("a", ...[0,0,0,0,0].arcsec()),
              make_ins("S", "MaxSpeed", 80000 / _nbits_cf),
              make_ins("a", ...[0,0,0,370000,0].arcsec()),
              make_ins("F"),
              make_ins("w", 42,1024),
              make_ins("a", ...[0,0,0,-370000,0].arcsec()),
              make_ins("F"),
              make_ins("w", 42,0),
              make_ins("a", ...[0,0,0,0,680000].arcsec()),
              make_ins("F"),
              make_ins("w", 42,2048),
              
              make_ins("a", ...[0,0,0,0,-680000].arcsec()),
              make_ins("F"),
              make_ins("w", 42,0),
              
              make_ins("a", ...[0,0,0,0,0].arcsec()),
              make_ins("S", "MaxSpeed", 240000 / _nbits_cf),
              make_ins("a", ...[100000,100000,100000,100000,100000].arcsec()),
              make_ins("a", ...[0,0,0,0,0].arcsec()),
              make_ins("F"),
              
              make_ins("w", 42,64),
    		  make_ins("w", 42,0),
              make_ins("w", 42,256),
              make_ins("w", 42,0),
              make_ins("l"),
              
              make_ins("S", "J1BoundryHigh",648000 * _arcsec),
        	  make_ins("S", "J1BoundryLow",-648000 * _arcsec),
              make_ins("S", "J2BoundryLow",-300000 * _arcsec),
              make_ins("S", "J2BoundryHigh",300000 * _arcsec),
              make_ins("S", "J3BoundryLow",-530000 * _arcsec),
              make_ins("S", "J3BoundryHigh",530000 * _arcsec),
              make_ins("S", "J4BoundryLow",-340000 * _arcsec),
              make_ins("S", "J4BoundryHigh",340000 * _arcsec),
              make_ins("S", "J5BoundryLow",-648000 * _arcsec),
              make_ins("S", "J5BoundryHigh",648000 * _arcsec),
              
              Dexter.sleep(1),
              make_ins("w", 42,12960),
            ])})
}
*/