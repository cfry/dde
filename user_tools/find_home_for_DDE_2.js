//Finds home position after plugging the arm into a 3D printed fixture attached to one toe.
//Requires DDE 2.0+
if(dde_version < "2.0.0"){dde_error("This file requires DDE version " + "2.0.0" +" or later. You are running version " + dde_version + ".")}

var my_dexter_ip = "192.168.1.142"

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
var minSpeed = .5 // (deg/s)
var maxSpeed = 25 // (deg/s)

var db_fetch = undefined
Dexter.LINK2 = 0.321246 // (m)
Dexter.LINK3 = 0.298982 // (m)

var pidXYZ = 0x3dcCCCCC
//var pidXYZ = 0x3e4ecccc
var pidRP = 0x3cf5c28f
//var pidRP = 0x3e4ccccc  //00000

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

var gJobDone = 0
var gbRcdArray = false

var gWindowVals = undefined
var timeXYZ = []
var lastTimeXYZ = []
let scalePoint = [0, 0, 0, 0, 0]
let scaleToggle = false
var bFirstTime = true
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



function reduceArray(array){
	var rtVal = []
	for (var i = 0;i < array.length;i++){
    	for (var j = 0;j < array[i].length;j++){
        rtVal.push (array[i][j])
        }
    }
	return rtVal
}


function RoundArray(my_array){
var x = 0;
var len = my_array.length
while(x < len){ 
    my_array[x] = Math.round(my_array[x]) 
    x++
}
return my_array
}


function updateXYZPoint(){
//debugger; my_array[x] = Math.round(my_array[x])
    	var xyzPoint = [Dexter.my_dex.robot_status[Dexter.J1_FORCE_CALC_ANGLE] + Dexter.my_dex.robot_status[Dexter.J1_DELTA], 
						Dexter.my_dex.robot_status[Dexter.J2_FORCE_CALC_ANGLE] + Dexter.my_dex.robot_status[Dexter.J2_DELTA], 
                        Dexter.my_dex.robot_status[Dexter.J3_FORCE_CALC_ANGLE] + Dexter.my_dex.robot_status[Dexter.J3_DELTA],
                        Dexter.my_dex.robot_status[Dexter.J4_FORCE_CALC_ANGLE] + (Dexter.my_dex.robot_status[Dexter.J4_DELTA] / 16), 
                        Dexter.my_dex.robot_status[Dexter.J5_FORCE_CALC_ANGLE] + (Dexter.my_dex.robot_status[Dexter.J5_DELTA] / 16),
                        Dexter.my_dex.robot_status[Dexter.START_TIME] + (Dexter.my_dex.robot_status[Dexter.STOP_TIME] /*/ 10000*/), 0]
        //var KinPoint = Kin.J_angles_to_xyz(xyzPoint)
        dex.set_in_window(gWindowVals.window_index, "Base_display", "innerHTML",      xyzPoint[0])   
        dex.set_in_window(gWindowVals.window_index, "Pivot_display", "innerHTML",      xyzPoint[1])
        dex.set_in_window(gWindowVals.window_index, "EndArm_display", "innerHTML",      xyzPoint[2])   
        dex.set_in_window(gWindowVals.window_index, "Angle_display", "innerHTML",      xyzPoint[3])
        dex.set_in_window(gWindowVals.window_index, "Rotate_display", "innerHTML",      xyzPoint[4])
        //out(xyzPoint[5])
        //xyzPoint.push(Vector.normalize(Vector.subtract(xyzPoint[5], xyzPoint[4])))
        return xyzPoint
}
var pointIdx = 0
//calcSpeed(timeXYZ)
function calcSpeedSingle(pA, pB){
var jd = JointDistance(pA, pB)
//turn 

}
function calcSpeed(pointArray){
//debugger;
pointArray[0][6] = minSpeed
  var jd
  for (var i = 0;i < pointArray.length-1;i++){
    jd = JointDistance([pointArray[i][0], pointArray[i][1], pointArray[i][2], pointArray[i][3], pointArray[i][4]],
       [pointArray[i+1][0], pointArray[i+1][1], pointArray[i+1][2], pointArray[i+1][3], pointArray[i+1][4]]) 
    pointArray[i+1][6] = jd / (pointArray[i+1][5] - pointArray[i][5])  
    out("time   " + (pointArray[i+1][5] - pointArray[i][5]) + "  distance  " + jd + " res  "  + pointArray[i][6])
    
  }
}
function distance(pointA, pointB){
var rt = [Math.abs(pointA[5][0]-pointB[5][0]),Math.abs(pointA[5][1]-pointB[5][1]),Math.abs(pointA[5][2]-pointB[5][2])]
  return Math.sqrt(Math.pow(rt[0],2)+Math.pow(rt[1],2)+Math.pow(rt[2],2))
}
//JointDistance([timeXYZ[5][0],timeXYZ[5][1],timeXYZ[5][2],timeXYZ[5][3],timeXYZ[5][4]], [timeXYZ[6][0],timeXYZ[6][1],timeXYZ[6][2],timeXYZ[6][3],timeXYZ[6][4]])
/*function JointDistance(pointA, pointB){
var pa = Kin.J_angles_to_xyz(pointA)
var pb= Kin.J_angles_to_xyz(pointB)
var rt = [pa[5][0]-pb[5][0], pa[5][1]-pb[5][1], pa[5][2]-pb[5][2]]
  return Math.sqrt(Math.pow(rt[0],2) + Math.pow(rt[1],2) + Math.pow(rt[2],2))
}*/
function JointDistance(pointA, pointB){
var d0 = Math.abs(pointA[0] - pointB[0])
var d1 = Math.abs(pointA[1] - pointB[1])
var d2 = Math.abs(pointA[2] - pointB[2])
var d3 = Math.abs(pointA[3] - pointB[3])
var d4 = Math.abs(pointA[4] - pointB[4])
var maxDeflection = Math.max(d0, d1, d2, d3, d4)
return maxDeflection
}

function replayPointsitr(points, times){
debugger;
  var rt =[]
  for (var j=0;j<times;j++){
  for (var i = 0;i < points.length;i++){
    var sp = points[i][6] * 2
    if(sp < minSpeed ){sp = minSpeed}
    if(sp > maxSpeed ){sp = maxSpeed}
    sp = Math.round(sp) 
    rt.push(make_ins("S", "MaxSpeed",sp))
    rt.push(make_ins("S", "StartSpeed",sp))
    //rt.push(function(){out("speed" + sp + "points " + points[i][0] + points[i][1] + points[i][2] + points[i][3] + points[i][4])})
    
    //old: rt.push(Dexter.move_all_joints(points[i][0], points[i][1], points[i][2],  Math.round(points[i][3]),  Math.round(points[i][4])))
    rt.push(Dexter.move_all_joints(points[i][0], points[i][1], points[i][2],  points[i][3],  points[i][4]))
  }}
  return rt
}



//persistent_get(vals.macro_name,function(val){db_fetch = val})
function handleWindowUI(vals){ //vals contains name-value pairs for each
                         //html elt in show_window's content with a name.
	debugger
    gWindowVals = vals 
    //updateXYZPoint()
    //out(vals)
    if(vals.clicked_button_value == "SetPoint" ){ // Clicked button value holds the name of the clicked button.
    bFirstTime = false
    if(gbRcdArray == false){gbRcdArray = true}else{gbRcdArray = false}
    
    timeXYZ[pointIdx] = updateXYZPoint()
    lastTimeXYZ = timeXYZ[pointIdx]
    //pointIdx = pointIdx +1
    out(gbRcdArray)
    }
    else if(vals.clicked_button_value == "Follow" ) { 
    	Job.FindHome.user_data.choicemade = function (){return setFollowMe()}
        out("Set FollowMe mode")
    }
    else if(vals.clicked_button_value == "Keep" ){ 
        Job.FindHome.user_data.choicemade = function (){return setKeepPossition()}
        out("Set set Keep  mode")

    }
    else if(vals.clicked_button_value == "Home" ){ 
        Job.FindHome.user_data.choicemade = function (){return setNewHome(lastTimeXYZ)}
    }
    else if(vals.clicked_button_value == "RecordPark" ){ 
        //db_fetch = undefined
       // persistent_get(vals.macro_name,function(val){db_fetch = val})
        /*Job.FindHome.user_data.choicemade = function ()
         							  { var rt = []
                                        rt.push(Robot.wait_until(function(){return db_fetch}))
                                        rt.push(function(){return replayPointsitr(db_fetch,1)})
                                        return rt                                        
                                      }*/
        Job.FindHome.user_data.choicemade = function ()
         							  { 
                                      	write_file("ParkPoint.js",createPersistantSetPoint (updateXYZPoint()))
                                      }
    }
    else if (vals.clicked_button_value == "Done" ){   
        gJobDone = 1
        gWindowVals = undefined
		for (var i = 0;i < pointIdx-1;i++){
    		out(timeXYZ[i])
    	}
        out("outta here " )
        //Job.FindHome.user_data.choicemade = function (){return Dexter.move_all_joints(0, 0, 0, 0, 0)}
    }
}


//        load_files("ParkPoint.js")
        
        
        
function setNewHome(offsetPoint){

  load_files("ParkPoint.js")
  let DeltaPoint = Vector.subtract (offsetPoint, PersistPoint)
  let rt = []
  rt.push(setKeepPossition())
  rt.push(Human.task({task: "Wait For Zero Motion.",
                               title: "Pay Attention!!!",
                               x: 0,
                               y: 0,
                               width: 600,
                               height: 150,
                               background_color: "rgb(230, 200, 250)"
                             }))
  rt.push(Dexter.move_all_joints(DeltaPoint[0], DeltaPoint[1], DeltaPoint[2], DeltaPoint[3],
  DeltaPoint[4]))
  rt.push(make_ins("F"))
  rt.push(make_ins("w", 42, (256 + 64)))
  rt.push(make_ins("w", 42, 0))
  rt.push(Dexter.move_all_joints(15, 15, 15, 15, 15)) // rounded up from 13.88888... or 50000 arcsecs
  rt.push(make_ins("F"))
  rt.push(Dexter.move_all_joints(0, 0, 0, 0, 0))
  rt.push(make_ins("F"))
  rt.push(setKeepPossition())
  return rt
}

function createPersistantSetPoint(array){
let rtString = "var PersistPoint = " + JSON.stringify(array)
return rtString
}

function start_find_home_ui(){
show_window({content:
`<i>To stop job click the FindHome button on Jobs bar.</i>
 <p/>
<input type="button" accesskey="p" value="SetPoint"/> 
 <input type="button" value="Follow"/>
 <input type="button" value="Keep"/>
 <input type="button" value="Home"/>
 <input type="button" value="RecordPark"/><br/><br/>
  Mode: <span id="mode_id">None</mode><br/>
 Base: <span  name="Base_display" id="Base_id">0</span><br/>
 Pivot: <span  name="Pivot_display" id="Pivot_id">0</span><br/>
 EndArm: <span  name="EndArm_display" id="EndArm_id">0</span><br/>
 Angle: <span  name="Angle_display" id="Angle_id">0</span><br/>
 Rotate: <span  name="Rotate_display" id="Rotate_id">0</span><br/><br/>
 
 <input type="submit" value="Done"/>`,
             title: "Find Home",
             width: 400, 
             height: 340,
             callback: handleWindowUI})
}



function resolve_choice() {
//debugger;
    if(gWindowVals != undefined ){updateXYZPoint()}
	var na = []
    na.push(make_ins("g"))
    na.push(function(){if (this.user_data.choicemade != undefined) {
    		var rtval = this.user_data.choicemade
            this.user_data.choicemade = undefined
            return rtval
    		}})
   
    na.push(function(){if (gWindowVals != undefined){if (gbRcdArray == true) {timeXYZ[pointIdx] = updateXYZPoint()}}})	
    na.push(function(){if (gJobDone == 0) {return resolve_choice()}})
    return na
}


new Dexter({name: "my_dex", ip_address: my_dexter_ip, port: 50000, enable_heartbeat: false, simulate: false})
new Job({name: "FindHome", robot: Robot.my_dex, keep_history: false, show_instructions: false,
         do_list: [	
              start_find_home_ui,
              setKeepPosition(),
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
                function(){return resolve_choice},
                make_ins("S", "MaxSpeed",240000 / _nbits_cf),
                make_ins("S", "StartSpeed",3000 / _nbits_cf),
                make_ins("S", "Acceleration",1 / _nbits_cf),
                Dexter.move_all_joints(0, 0, 0, 0, 0)
         ]})


//Job.FindHome.start()
//Job.FindHome.inter_do_item_dur = 30*_ms