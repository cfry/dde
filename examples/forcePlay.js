// This job requires DDE version 1.1.9 and will NOT function in 2.x.x

persistent_get(
	"Directory", 
    function(val){ 
       if (val===undefined){
          out("building directory");
          var dirset = [];
          dirset.push(" ");
          persistent_set("Directory",dirset)
          }
       }
    )
//AddToDir("boxadd")



var db_fetch = undefined
Dexter.LINK2 = 321246
Dexter.LINK3 = 298982

var pidXYZ = 0x3e4ccccc
var pidRP = 0x3dcccccc
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

var DEF_SPEED_FACTOR_A = 10
var DEF_SPEED_FACTOR_DIFF = 10

var gJobDone = 0
var gWindowVals = undefined
var ForceModeEnabled = false
var timeXYZ = []
function setFollowMe(){
    ForceModeEnabled = true
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
    retCMD.push(make_ins("S", "J4Friction",75 ))
    retCMD.push(make_ins("S", "J5Friction",75 ))
    retCMD.push(make_ins("w", 67, 0))
    retCMD.push(make_ins("w", 68, 0))
    retCMD.push(make_ins("w", 69, 0))
    retCMD.push(make_ins("w", 70, 0))
    retCMD.push(make_ins("w", 71, 0))
    retCMD.push(make_ins("w", 51, 200000))
    retCMD.push(make_ins("w", 54, 260000))

    retCMD.push(make_ins("w", 79, 50 ^ 200 ))
    retCMD.push(make_ins("w", 80, 50 ^ 200 ))
    retCMD.push(make_ins("w", 81, 50 ^ 200 ))
    retCMD.push(make_ins("w", 42, 12448))
    return retCMD  
}
function setForceProtect(){
	ForceModeEnabled = false
	var retCMD = []
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ANGLE, 4))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 4))
    retCMD.push(make_ins("w", SPEED_FACTORA, 15))
    retCMD.push(make_ins("S", "J1Friction",2 ))
    retCMD.push(make_ins("S", "J2Friction",3 ))
    retCMD.push(make_ins("S", "J3Friction",9 ))
    retCMD.push(make_ins("S", "J4Friction",15 ))
    retCMD.push(make_ins("S", "J5Friction",15 ))
    retCMD.push(make_ins("w", PID_ADDRESS, 0))
    retCMD.push(make_ins("w", PID_P, pidXYZ))
   	retCMD.push(make_ins("w", PID_ADDRESS, 1))
  	retCMD.push(make_ins("w", PID_ADDRESS, 2))
  	retCMD.push(make_ins("w", PID_ADDRESS, 3))
  	retCMD.push(make_ins("w", PID_P, pidRP))
  	retCMD.push(make_ins("w", PID_ADDRESS, 4))
    retCMD.push(make_ins("w", 67, 9000))
    retCMD.push(make_ins("w", 68, 9000))
    retCMD.push(make_ins("w", 69, 9000))
    retCMD.push(make_ins("w", 70, 9000))
    retCMD.push(make_ins("w", 71, 9000))
    retCMD.push(make_ins("w", 78,1 ))
    retCMD.push(make_ins("w", 78,0 ))
    retCMD.push(make_ins("w", 42, 12448))
    return retCMD  
}

function setKeepPossition(){
    ForceModeEnabled = false
	var retCMD = []
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ANGLE, 0))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0))
	retCMD.push(make_ins("w", PID_ADDRESS, 0))
    retCMD.push(make_ins("w", PID_P, pidXYZ))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0))
    retCMD.push(make_ins("w", DIFF_FORCE_SPEED_FACTOR_ROT, 0))
   	retCMD.push(make_ins("w", PID_ADDRESS, 1))
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
    	var xyzPoint = Kin.J_angles_to_xyz([Dexter.my_dex.robot_status[Dexter.J1_FORCE_CALC_ANGLE] + Dexter.my_dex.robot_status[Dexter.J1_DELTA] + Dexter.my_dex.robot_status[Dexter.J1_ANGLE] , 
						Dexter.my_dex.robot_status[Dexter.J2_FORCE_CALC_ANGLE] + Dexter.my_dex.robot_status[Dexter.J2_DELTA]+ Dexter.my_dex.robot_status[Dexter.J2_ANGLE], 
                        Dexter.my_dex.robot_status[Dexter.J3_FORCE_CALC_ANGLE] + Dexter.my_dex.robot_status[Dexter.J3_DELTA] +  Dexter.my_dex.robot_status[Dexter.J3_ANGLE],
                        Dexter.my_dex.robot_status[Dexter.J4_FORCE_CALC_ANGLE] + (Dexter.my_dex.robot_status[Dexter.J4_DELTA] / 16) + Dexter.my_dex.robot_status[Dexter.J4_ANGLE], 
                        Dexter.my_dex.robot_status[Dexter.J5_FORCE_CALC_ANGLE] + (Dexter.my_dex.robot_status[Dexter.J5_DELTA] / 16), + Dexter.my_dex.robot_status[Dexter.J5_ANGLE]])
        dex.set_in_window(gWindowVals.window_index, "X_display", "innerHTML",      Math.round(xyzPoint[5][0]))   
        dex.set_in_window(gWindowVals.window_index, "Y_display", "innerHTML",      Math.round(xyzPoint[5][1]))
        dex.set_in_window(gWindowVals.window_index, "Z_display", "innerHTML",      Math.round(xyzPoint[5][2]))
        xyzPoint.push(Vector.normalize(Vector.subtract(xyzPoint[5], xyzPoint[4])))
        return xyzPoint
}
var pointIdx = 0

function distance(pointA, pointB){
var rt = [Math.abs(pointA[5][0]-pointB[5][0]),Math.abs(pointA[5][1]-pointB[5][1]),Math.abs(pointA[5][2]-pointB[5][2])]
  return Math.sqrt(Math.pow(rt[0],2)+Math.pow(rt[1],2)+Math.pow(rt[2],2))
}


function replayPointsitr(points, times){
	out("replay "+times)
  var rt =[]
  for (var j=0;j<times;j++){
  out("points:"+points.length)
  for (var i = 0;i < points.length;i++){
    out("#"+i+" xyz:"+points[i][5]+" in,out,down:"+points[i][6])
    rt.push(make_ins("a",RoundArray(Kin.xyz_to_J_angles(points[i][5], points[i][6] , Dexter.RIGHT_UP_OUT))))
    //rt.push(Robot.wait_until(1000)) //delay is not needed, each move starts after the last.
  }}
  return rt
}


function AddToDir(MacroStr){
    //out(MacroStr)
    var closeStr = MacroStr
	dir = persistent_get("Directory")
    dir.push(closeStr)
    persistent_set("Directory",dir)
	}
//var dirset = []
//dirset.push("KBhello")
//persistent_set("Directory",dirset)
//AddToDir("boxcorners")

var iterations = undefined

function handleWindowUI(vals){ //vals contains name-value pairs for each
                         //html elt in show_window's content with a name.
	gWindowVals = vals 
    if(vals.clicked_button_value == "SetPoint" ){ // Clicked button value holds the name of the clicked button.
        timeXYZ[pointIdx] = updateXYZPoint();
        //out(timeXYZ[pointIdx]);
        pointIdx = pointIdx +1;
        out("Set point #"+pointIdx);
    	}
    else if(vals.clicked_button_value == "Follow" ) { 
    	Job.j1.user_data.choicemade = function (){return setFollowMe()}
        out("Set FollowMe mode")
    }
    else if(vals.clicked_button_value == "Keep" ){ 
        Job.j1.user_data.choicemade = function (){return setKeepPossition()}
        out("Set set Keep  mode")

    }
    else if(vals.clicked_button_value == "Protect" ) { 
        Job.j1.user_data.choicemade = function (){return setForceProtect()}
        out("Set set Protect mode")
    	}
    else if(vals.clicked_button_value == "Record" )	{
		if (0==timeXYZ.length) {
        	out("Error, no setpoints found");
            } 
        else {
	       out("Recording \'" + vals.macro_name +"\'")
         persistent_set(vals.macro_name,timeXYZ)
         //out("Testing recording")
         //persistent_get(vals.macro_name, function(val){ out("Got: ")})
         var MacroStr = vals.macro_name
         persistent_get("Directory",AddToDir(MacroStr))
         }
    }
    else if(vals.clicked_button_value == "Flush" ) { 
		//persistent_clear() //doesn't exist?
		//also clear all setpoints?
		timeXYZ=[]
        pointIdx=0
		out("cleared database and setpoints")
		if (undefined===persistent_get("Directory")){
          out("building directory");
          var dirset = [];
          dirset.push(" ");
          persistent_set("Directory",dirset)
          }
	    }
    else if(vals.clicked_button_value == "Dir" ) { 
       out("Known Macros: " + persistent_get("Directory"))
    }
    else if(vals.clicked_button_value == "Play" ){ 
        db_fetch = undefined
        iterations = vals.LI
        out(vals.macro_name)
        db_fetch=persistent_get(vals.macro_name)
        if ("" == db_fetch) {
        	out("Error, macro \'"+vals.macro_name+"\' not found");
            } 
        else {
        	out("Loaded \'"+vals.macro_name+"\' "+db_fetch.length+" steps");
            //why not load the setpoints back so we can add to an existing job?
            pointIdx=db_fetch.length
            timeXYZ=db_fetch
	        Job.j1.user_data.choicemade = function () { 
                  var rt = []
                  rt.push(function(){return replayPointsitr(db_fetch,iterations)})
                  return rt                                        
                  }
    		}
    	}
    else if (vals.clicked_button_value == "Done" ){   
        gJobDone = 1
        gWindowVals = undefined
		for (var i = 0;i < pointIdx-1;i++){
    		out(timeXYZ[i])
    	}
        out("outta here " )
        //Job.j1.user_data.choicemade = function (){return Dexter.move_all_joints(0, 0, 0, 0, 0)}
    }
}





show_window({content:
`<input name="SetPoint" type="button" accesskey="p" value="SetPoint"/> 
 <input name="SetFollowMe" type="button" value="Follow"/>
 <input name="SetKeepPoint" type="button" value="Keep"/>
 <input name="SetForceProtect" type="button" value="Protect"/>
 <input name="PlayMacro" type="button" value="Play"/>
 <input name="Write Time" type="button" value="Record"/><br/>
 <input name="Dir" type="button" value="Dir"/><br/><br/>
 <input name="Flush" type="button" value="Flush"/><br/><br/>
  Mode: <span id="mode_id">None</mode><br/>
 X: <span  name="X_display" id="X_id">0</span><br/>
 Y: <span  name="Y_display" id="Y_id">0</span><br/>
 Z: <span  name="Z_display" id="Z_id">0</span><br/><br/>
 Macro Name <input type="text" name="macro_name" value="test" id="mn_id" <br/><br/>
 Loop Iterations <input type="text" name="LI" value="1" id="li_id" <br/><br/>
 <input type="submit" value="Done"/>`, 
             callback: handleWindowUI})     


var J3AngleHI = 100000
var J3AngleLow = -100000

function updateXYZForce(){
var rt = []
var J3Angle = Dexter.my_dex.robot_status[Dexter.J3_FORCE_CALC_ANGLE] + 
              Dexter.my_dex.robot_status[Dexter.J3_DELTA] +  
              Dexter.my_dex.robot_status[Dexter.J3_ANGLE]
  if(J3Angle > J3AngleHI){rt.push(make_ins("S","J3Force", (J3AngleHI - J3Angle) * -.01))}
  if(J3Angle < J3AngleLow){rt.push(make_ins("S","J3Force", (J3AngleLow - J3Angle) * -.01))}
  if(J3Angle > J3AngleLow && J3Angle < J3AngleHI){rt.push(make_ins("S","J3Force", 0))}
  return rt
}
              
              
             
function resolve_choice()
{
	var na = []
    na.push(make_ins("g"))
    na.push(function(){if (this.user_data.choicemade != undefined) {
    		var rtval = this.user_data.choicemade
            this.user_data.choicemade = undefined
            return rtval
    		}})
   
    na.push(function(){if (gWindowVals != undefined){updateXYZPoint()}})
    //na.push(function(){if (gWindowVals != undefined){return updateXYZForce()}})
    na.push(function(){if (gJobDone == 0) {return resolve_choice()}})
    return na
}

function gotoXYZ(x, y, z, pose){
	return make_ins("a",RoundArray(Kin.xyz_to_J_angles( [x, y, z], pose , Dexter.RIGHT_UP_OUT)))
}

//gotoXYZ(100, 100, 100000, [0, 0, -1])
new Dexter({name: "my_dex", ip_address: "192.168.0.142", port: 50000, enable_heartbeat: false, simulate: false})
new Job({name: "j1", robot: Robot.my_dex, keep_history: false,
         do_list: [	
              make_ins("S", "J1BoundryHigh",648000),
        	  make_ins("S", "J1BoundryLow",-648000),
              make_ins("S", "J2BoundryLow",-300000),
              make_ins("S", "J2BoundryHigh",300000),
              make_ins("S", "J3BoundryLow",-530000),
              make_ins("S", "J3BoundryHigh",530000),
              make_ins("S", "J4BoundryLow",-340000),
              make_ins("S", "J4BoundryHigh",340000),
              make_ins("S", "J5BoundryLow",-648000),
              make_ins("S", "J5BoundryHigh",648000),
// Since Dexter moves so well without these changes, I'm commenting them out.
//                make_ins("S", "MaxSpeed",360000),
//                make_ins("S", "Acceleration",5), 
//                make_ins("S", "StartSpeed", 1000),
                Dexter.move_all_joints(0, 0, 0, 0, 0),
                function(){return resolve_choice},
//                make_ins("S", "MaxSpeed",240000),
//                make_ins("S", "Acceleration",1),
                Dexter.move_all_joints(0, 0, 0, 0, 0)
         ]})


Job.j1.start()
//Job.j1.inter_do_item_dur = 50 //Was 10. Actually, seems to work ok with the default value.
//Dexter.heartbeat_dur = 25


//DrawNum(123456, 23000, [0, 1])
