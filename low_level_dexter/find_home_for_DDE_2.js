//Finds home position after plugging the arm into a 3D printed fixture attached to one toe.
//Requires DDE 2.0+
if(dde_version < "2.0.0"){dde_error("This file requires DDE version " + "2.0.0" +" or later. You are running version " + dde_version + ".")}

/*
To Calibrate (just once per robot):
1. Power on in the best version of home you can get. 
2. Calibrate (Jobs -> Calibrate Dexter... -> Calibrate Optical Encoders)
3. Eval this file
4. Click 'Follow' button
5. Put Dexter in dock
6. Click 'RecordPark' button
7. Move out of park to any position.
8. Power off Dexter.
To use:
1. Power on generally close to home
2. Eval this file
3. Click 'Follow' button
4. Put Dexter in the dock. You may notice it is a little difficult as Dexter isn't callibrated.
5. Click 'SetPoint' button
6. Take Dexter out of dock
7. Click 'Home' button
8. Wait until Dexter stops moving.
9. Hit Done button on popup box (not in main UI)
Dexter is now at the home you first set and is callibrated. 
This process can be repeated to really dial in Home Position.
*/

var FindHome = class FindHome {
	static setFollowMe(){
      return [make_ins("w", FindHome.DIFF_FORCE_SPEED_FACTOR_ANGLE, FindHome.DEF_SPEED_FACTOR_DIFF),
              make_ins("w", FindHome.DIFF_FORCE_SPEED_FACTOR_ROT, FindHome.DEF_SPEED_FACTOR_DIFF),
              make_ins("w", FindHome.PID_P, 0),
              make_ins("w", FindHome.PID_ADDRESS, 3),
              make_ins("w", FindHome.PID_ADDRESS, 4),
              make_ins("w", FindHome.PID_ADDRESS, 0),
              make_ins("w", FindHome.PID_ADDRESS, 1),
              make_ins("w", FindHome.PID_ADDRESS, 2),
              make_ins("w", FindHome.SPEED_FACTORA, FindHome.DEF_SPEED_FACTOR_A),
              make_ins("S", "J1Friction",5 ),
              make_ins("S", "J2Friction",5 ),
              make_ins("S", "J3Friction",5 ),
              make_ins("S", "J4Friction",15 ),
              make_ins("S", "J5Friction",15 ),
              make_ins("w", 67, 0),
              make_ins("w", 68, 0),
              make_ins("w", 69, 0),
              make_ins("w", 70, 0),
              make_ins("w", 71, 0),
              make_ins("w", 51, 140000),
              make_ins("w", 54, 200000),

              make_ins("w", 79, 50 ^ 200 ),
              make_ins("w", 80, 50 ^ 200 ),
              make_ins("w", 81, 50 ^ 200 ),
              make_ins("w", 42, 12448)
             ]
    }

	static setForceProtect(){
		return [ make_ins("w", FindHome.DIFF_FORCE_SPEED_FACTOR_ANGLE, 3),
                 make_ins("w", FindHome.DIFF_FORCE_SPEED_FACTOR_ROT, 3),
                 make_ins("w", FindHome.SPEED_FACTORA, 10),
                 make_ins("S", "J1Friction",2 ),
                 make_ins("S", "J2Friction",3 ),
                 make_ins("S", "J3Friction",9 ),
                 make_ins("S", "J4Friction",15 ),
                 make_ins("S", "J5Friction",15 ),
                 make_ins("w", FindHome.PID_ADDRESS, 0),
                 make_ins("w", FindHome.PID_P, FindHome.pidBase),
   	             make_ins("w", FindHome.PID_ADDRESS, 1),
                 make_ins("w", FindHome.PID_P, FindHome.pidXYZ),
  	             make_ins("w", FindHome.PID_ADDRESS, 2),
  	             make_ins("w", FindHome.PID_ADDRESS, 3),
  	             make_ins("w", FindHome.PID_P, FindHome.pidRP),
  	             make_ins("w", FindHome.PID_ADDRESS, 4),
                 make_ins("w", 67, 9000),
                 make_ins("w", 68, 9000),
                 make_ins("w", 69, 9000),
                 make_ins("w", 70, 9000),
                 make_ins("w", 71, 9000),
                 make_ins("w", 42, 12448)
                 ]
    }

    static setKeepPosition(){
	     return [
                 make_ins("w", FindHome.DIFF_FORCE_SPEED_FACTOR_ANGLE, 0),
                 make_ins("w", FindHome.DIFF_FORCE_SPEED_FACTOR_ROT, 0),
                 make_ins("w", FindHome.PID_ADDRESS, 0),
                 make_ins("w", FindHome.PID_P, FindHome.pidBase),
   	             make_ins("w", FindHome.PID_ADDRESS, 1),
                 make_ins("w", FindHome.PID_P, FindHome.pidXYZ),
                 make_ins("w", FindHome.DIFF_FORCE_SPEED_FACTOR_ROT, 0),
                 make_ins("w", FindHome.DIFF_FORCE_SPEED_FACTOR_ROT, 0),
  	             make_ins("w", FindHome.PID_ADDRESS, 2),
  	             make_ins("w", FindHome.PID_ADDRESS, 3),
  	             make_ins("w", FindHome.PID_P, FindHome.pidRP),
  	             make_ins("w", FindHome.PID_ADDRESS, 4),
  	             make_ins("w", FindHome.SPEED_FACTORA, 0),
                 make_ins("w", 42, 12960),
                ]
    }

    static reduceArray(array){
        var rtVal = []
        for (var i = 0;i < array.length;i++){
            for (var j = 0;j < array[i].length;j++){
            rtVal.push (array[i][j])
            }
        }
        return rtVal
    }

    static RoundArray(my_array){
        var x = 0;
        var len = my_array.length
        while(x < len){
            my_array[x] = Math.round(my_array[x])
            x++
        }
        return my_array
    }

    static updateXYZPoint(){
        //debugger; my_array[x] = Math.round(my_array[x])
        let dx = FindHome.find_home_get_robot()
    	var xyzPoint = [dx.robot_status[Dexter.J1_FORCE_CALC_ANGLE] + dx.robot_status[Dexter.J1_DELTA], 
						dx.robot_status[Dexter.J2_FORCE_CALC_ANGLE] + dx.robot_status[Dexter.J2_DELTA], 
                        dx.robot_status[Dexter.J3_FORCE_CALC_ANGLE] + dx.robot_status[Dexter.J3_DELTA],
                        dx.robot_status[Dexter.J4_FORCE_CALC_ANGLE] + (dx.robot_status[Dexter.J4_DELTA] / 16), 
                        dx.robot_status[Dexter.J5_FORCE_CALC_ANGLE] + (dx.robot_status[Dexter.J5_DELTA] / 16),
                        dx.robot_status[Dexter.START_TIME] + (dx.robot_status[Dexter.STOP_TIME]), 0]
        //var KinPoint = Kin.J_angles_to_xyz(xyzPoint)
        dex.set_in_window(FindHome.gWindowVals.window_index, "Base_display",   "innerHTML",      xyzPoint[0])
        dex.set_in_window(FindHome.gWindowVals.window_index, "Pivot_display",  "innerHTML",      xyzPoint[1])
        dex.set_in_window(FindHome.gWindowVals.window_index, "EndArm_display", "innerHTML",      xyzPoint[2])
        dex.set_in_window(FindHome.gWindowVals.window_index, "Angle_display",  "innerHTML",      xyzPoint[3])
        dex.set_in_window(FindHome.gWindowVals.window_index, "Rotate_display", "innerHTML",      xyzPoint[4])
        //out(xyzPoint[5])
        //xyzPoint.push(Vector.normalize(Vector.subtract(xyzPoint[5], xyzPoint[4])))
        return xyzPoint
    }

    static calcSpeed(pointArray){
        //debugger;
        pointArray[0][6] = FindHome.minSpeed
        var jd
        for (var i = 0;i < pointArray.length-1;i++){
            let jd = FindHome.JointDistance([pointArray[i][0], pointArray[i][1], pointArray[i][2],
                                             pointArray[i][3], pointArray[i][4]],
                                            [pointArray[i+1][0], pointArray[i+1][1], pointArray[i+1][2],
                                             pointArray[i+1][3], pointArray[i+1][4]])
            pointArray[i+1][6] = jd / (pointArray[i+1][5] - pointArray[i][5])
            out("time   " + (pointArray[i+1][5] - pointArray[i][5]) + "  distance  " + jd + " res  "  + pointArray[i][6])
        }
    }

    static JointDistance(pointA, pointB){
        var d0 = Math.abs(pointA[0] - pointB[0])
        var d1 = Math.abs(pointA[1] - pointB[1])
        var d2 = Math.abs(pointA[2] - pointB[2])
        var d3 = Math.abs(pointA[3] - pointB[3])
        var d4 = Math.abs(pointA[4] - pointB[4])
        var maxDeflection = Math.max(d0, d1, d2, d3, d4)
        return maxDeflection
    }

    static replayPointsitr(points, times){
          var rt =[]
          for (var j=0;j<times;j++){
            for (var i = 0;i < points.length;i++){
              var sp = points[i][6] * 2
              if(sp < FindHome.minSpeed ){sp = FindHome.minSpeed}
              if(sp > FindHome.maxSpeed ){sp = FindHome.maxSpeed}
              sp = Math.round(sp)
              rt.push(make_ins("S", "MaxSpeed",sp))
              rt.push(make_ins("S", "StartSpeed",sp))
              //rt.push(function(){out("speed" + sp + "points " + points[i][0] + points[i][1] + points[i][2] + points[i][3] + points[i][4])})

              //old: rt.push(Dexter.move_all_joints(points[i][0], points[i][1], points[i][2],  Math.round(points[i][3]),  Math.round(points[i][4])))
              rt.push(Dexter.move_all_joints(points[i][0], points[i][1], points[i][2],  points[i][3],  points[i][4]))
            }
          }
          return rt
    }

    //persistent_get(vals.macro_name,function(val){FindHome.db_fetch = val})

    static handleWindowUI(vals){ //vals contains name-value pairs for each
                             //html elt in show_window's content with a name.
        FindHome.gWindowVals = vals
        //updateXYZPoint()
        //out(vals)
        if(vals.clicked_button_value == "SetPoint"){ // Clicked button value holds the name of the clicked button.
            debugger
            FindHome.bFirstTime = false
            if(FindHome.gbRcdArray == false){FindHome.gbRcdArray = true}
            else{FindHome.gbRcdArray = false}

            FindHome.timeXYZ[FindHome.pointIdx] = FindHome.updateXYZPoint()
            FindHome.lastTimeXYZ = FindHome.timeXYZ[FindHome.pointIdx]
            //FindHome.pointIdx = FindHome.pointIdx +1
            out(FindHome.gbRcdArray)
        }
        else if(vals.clicked_button_value == "Follow") {
            Job.FindHome.user_data.choicemade = function (){return FindHome.setFollowMe()}
            out("Set FollowMe mode")
        }
        else if(vals.clicked_button_value == "Keep" ){
            Job.FindHome.user_data.choicemade = function (){return FindHome.setKeepPosition()}
            out("Set set Keep  mode")
        }
        else if(vals.clicked_button_value == "Home" ){
            Job.FindHome.user_data.choicemade = function (){return FindHome.setNewHome(FindHome.lastTimeXYZ)}
        }
        else if(vals.clicked_button_value == "RecordPark" ){
            //FindHome.db_fetch = undefined
           // persistent_get(vals.macro_name,function(val){FindHome.db_fetch = val})
            Job.FindHome.user_data.choicemade = function (){
                                            write_file("ParkPoint.js", FindHome.createPersistantSetPoint(FindHome.updateXYZPoint()))
                                          }
        }
        else if (vals.clicked_button_value == "Done" ){
            FindHome.gJobDone = 1
            FindHome.gWindowVals = undefined
            for (let i = 0; i < FindHome.pointIdx-1; i++){
                out(FindHome.timeXYZ[i])
            }
            out("outta here " )
            //Job.FindHome.user_data.choicemade = function (){return Dexter.move_all_joints(0, 0, 0, 0, 0)}
        }
    }

    // load_files("ParkPoint.js")
        
    static setNewHome(offsetPoint){
        load_files("ParkPoint.js")
        let DeltaPoint = Vector.subtract(offsetPoint, PersistPoint) //PersistPoint defined in ParkPoint.js
        return [ FindHome.setKeepPosition(),
                 Human.task({task: "Wait For Zero Motion.",
                                   title: "Pay Attention!!!",
                                   x: 0,
                                   y: 0,
                                   width: 600,
                                   height: 150,
                                   background_color: "rgb(230, 200, 250)"
                                 } ),
                 Dexter.move_all_joints(DeltaPoint[0], DeltaPoint[1], DeltaPoint[2], DeltaPoint[3], DeltaPoint[4] ),
                 make_ins("F" ),
                 make_ins("w", 42, (256 + 64)),
                 make_ins("w", 42, 0),
                 Dexter.move_all_joints(15, 15, 15, 15, 15), // rounded up from 13.88888... or 50000 arcsecs
                 make_ins("F"),
                 Dexter.move_all_joints(0, 0, 0, 0, 0),
                 make_ins("F"),
                 FindHome.setKeepPosition()
            ]
    }

    static createPersistantSetPoint(array){
        return "var PersistPoint = " + JSON.stringify(array)
    }

    static start_find_home_ui(){
        show_window({content:
        "<i>To stop the FindHome job,<br/> click the FindHome button on the Jobs bar.</i><br/>or the <b>Done</b> button below.<p/>" + 
         //"&nbsp;&nbsp;&nbsp;Dexter." + FindHome.find_home_make_dexter_robot_menu_html() +
         `<p/>
         <input type="button" accesskey="p" value="SetPoint"/>
         <input type="button" value="Follow" 
                title="Put dexter into FollowMe mode.\nBefore clicking this button,\n1. grab dexter by its end effector with your hand,\n2. click button,\n3. move Dexter to the desired park position."/>
         <input type="button" value="Keep"
                title="Puts dexter into setKeep position mode."/>
         <input type="button" value="Home"
                title="Sends Dexter to it's home position (straight up)."/>
         <input type="button" value="RecordPark"
                title="Record the current Dexter position as the park position."/>
         <p/>
           Mode: <span id="mode_id">None</mode><br/>
         Joint1: <span  name="Base_display"   id="Base_id">0</span><br/>
         Joint2: <span  name="Pivot_display"  id="Pivot_id">0</span><br/>
         Joint3: <span  name="EndArm_display" id="EndArm_id">0</span><br/>
         Joint4: <span  name="Angle_display"  id="Angle_id">0</span><br/>
         Joint5: <span  name="Rotate_display" id="Rotate_id">0</span><br/><br/>
         <input type="submit" value="Done" title="Closes this window and stops the FindHome Job."/>`,
                     title: "Find Home <i>for</i> Dexter." + FindHome.find_home_get_robot().name,
                     x: 500, y: 40,
                     width: 380,
                     height: 350,
                     callback: "FindHome.handleWindowUI"})
    }

    static resolve_choice() {
        //debugger;
        if(FindHome.gWindowVals != undefined ){FindHome.updateXYZPoint()}
        return [make_ins("g"),
                function(){
                    if (this.user_data.choicemade != undefined) {
                      let rtval = this.user_data.choicemade
                      this.user_data.choicemade = undefined
                      return rtval
                 	}
                 },
                 function(){if (FindHome.gWindowVals != undefined){
                                if (FindHome.gbRcdArray == true) {
                                     FindHome.timeXYZ[FindHome.pointIdx] = FindHome.updateXYZPoint()
                                }
                            }
                 },
                 function(){if (FindHome.gJobDone == 0) {return FindHome.resolve_choice()}}
                ]
    }

    //If this file is loaded by the calibration window then its robot is used
    static find_home_make_dexter_robot_menu_html(){
        let result = "<select id='robot_to_find_home_id' style='font-size:16px;'>\n"
        for(let dex_name of Dexter.all_names){
            result += "<option>" + dex_name + "</option>\n"
        }
        return result + "</select>"
    }

    static find_home_get_robot(){ 
         if(window["robot_to_calibrate_id"]) {
         	return Robot[robot_to_calibrate_id.value] 
         }
         else { return Robot.dexter0 }
    }
    
    static define_job(){
    	return new Job({name: "FindHome", robot: FindHome.find_home_get_robot(), keep_history: false, show_instructions: false,
         		 do_list: [	
                          FindHome.start_find_home_ui,
                          FindHome.setKeepPosition(),
                          make_ins("S", "J1BoundryHigh",410000*_arcsec),
                          make_ins("S", "J1BoundryLow",-410000*_arcsec),
                          make_ins("S", "J2BoundryLow",-210000*_arcsec),
                          make_ins("S", "J2BoundryHigh",220000*_arcsec),
                          make_ins("S", "J3BoundryLow",-520000*_arcsec),
                          make_ins("S", "J3BoundryHigh",520000*_arcsec),
                          make_ins("S", "J4BoundryLow",-330000*_arcsec),
                          make_ins("S", "J4BoundryHigh",330000*_arcsec),

                          make_ins("S", "J5BoundryLow",-380000*_arcsec),
                          make_ins("S", "J5BoundryHigh",380000*_arcsec),
                          make_ins("S", "Acceleration",1 / _nbits_cf),
                          FindHome.resolve_choice,
                          make_ins("S", "MaxSpeed",240000 / _nbits_cf),
                          make_ins("S", "StartSpeed",3000 / _nbits_cf),
                          make_ins("S", "Acceleration",1 / _nbits_cf),
                          Dexter.move_all_joints(0, 0, 0, 0, 0)
         ]})
    }

    static init_find_home () {
		FindHome.define_job().start() 
    }

} //end of class FindHome def



FindHome.minSpeed = 0.5 // (deg/s)
FindHome.maxSpeed = 25 // (deg/s)

FindHome.db_fetch = undefined
//Dexter.LINK2 = 0.321246 // (m)
//Dexter.LINK3 = 0.298982 // (m)

FindHome.pidXYZ = 0x3dcCCCCC
//FindHome.pidXYZ = 0x3e4ecccc
FindHome.pidRP = 0x3cf5c28f
//FindHome.pidRP = 0x3e4ccccc  //00000

FindHome.pidBase = 0x3f000000
FindHome.PID_DELTATNOT = 16
FindHome.PID_DELTAT = 17
FindHome.PID_D = 18
FindHome.PID_I = 19
FindHome.PID_P = 20
FindHome.PID_ADDRESS = 21

FindHome.DIFF_FORCE_SPEED_FACTOR_ANGLE = 55
FindHome.DIFF_FORCE_SPEED_FACTOR_ROT = 56
FindHome.SPEED_FACTORA = 27
FindHome.SPEED_FACTORB = 28

FindHome.DEF_SPEED_FACTOR_A = 30
FindHome.DEF_SPEED_FACTOR_DIFF = 8

FindHome.gJobDone = 0
FindHome.gbRcdArray = false

FindHome.gWindowVals = undefined
FindHome.timeXYZ = []
FindHome.lastTimeXYZ = []
//FindHome.scalePoint = [0, 0, 0, 0, 0] //not used
//FindHome.scaleToggle = false  //not used
FindHome.bFirstTime = true
FindHome.pointIdx = 0

FindHome.init_find_home()
