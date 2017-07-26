var centers_string = [["0x000", "0x000"],
                      ["0x000", "0x000"],
                      ["0x000", "0x000"],
                      ["0x000", "0x000"],
                      ["0x000", "0x000"]]
                      
                      
window.cal_working_axis = undefined //global needed by calibrate_ui.js
var AxisTable = [[[100/_nbits_cf, 0, 0, 0, 0], Dexter.J1_A2D_SIN, Dexter.J1_A2D_COS, [-648000*_arcsec, 0, 0, 0, 0], 1240], 
                 [[0, 100/_nbits_cf, 0, 0, 0], Dexter.J2_A2D_SIN, Dexter.J2_A2D_COS, [0, -324000*_arcsec, 0, 0, 0], 1900], 
                 [[0, 0, 100/_nbits_cf, 0, 0], Dexter.J3_A2D_SIN, Dexter.J3_A2D_COS, [0, 0, -500000*_arcsec, 0, 0], 1500], 
                 [[0, 0, 0, 200/_nbits_cf, 0], Dexter.J4_A2D_SIN, Dexter.J4_A2D_COS, [0, 0, 0, -190000*_arcsec, 0], 1800], 
                 [[0, 0, 0, 0, -100/_nbits_cf], Dexter.J5_A2D_SIN, Dexter.J5_A2D_COS, [0, 0, 0, 0, -148000*_arcsec], 4240]]
                 
     
//     AxisTable [axis][0]
function smLinex(){
  const size = AxisTable[window.cal_working_axis][4]
  const result = []
  result.push (make_ins("F"))
  for (var i = 0;i < size;i++){
      //move_all_joints calls Kin.check_J_ranges which uses Dexter.J1_ANGLE_MIN * friends to
      //check ranges, not the "J1BoundryLow" and friends that are put into effect
      //by Job.ViewEye. So use make_ins("a" ...) to bypass that check.
      //result.push (Dexter.move_all_joints([AxisTable[window.cal_working_axis][0][0] * i,
      //                                     AxisTable[window.cal_working_axis][0][1] * i,
      //                                     AxisTable[window.cal_working_axis][0][2] * i,
      //                                     AxisTable[window.cal_working_axis][0][3] * i,
      //                                     AxisTable[window.cal_working_axis][0][4] * i]))
      result.push(make_ins("a",
                           [AxisTable[window.cal_working_axis][0][0] * i,
                            AxisTable[window.cal_working_axis][0][1] * i,
                            AxisTable[window.cal_working_axis][0][2] * i,
                            AxisTable[window.cal_working_axis][0][3] * i,
                            AxisTable[window.cal_working_axis][0][4] * i]))

      result.push (make_ins("F"))
      result.push (function () { 
         var x = cal_get_robot().robot_status[AxisTable[window.cal_working_axis][1]]/10
         var y = cal_get_robot().robot_status[AxisTable[window.cal_working_axis][2]]/10
         var thehtml = svg_circle({cx: x, cy: flip_point_y(y), r: 1})
         append_in_ui("svg_id", thehtml)
      })}   
  return result
}

/*function scan_axis(){
	var retCMD = []
    retCMD.push(Human.enter_number({
          			task: "Select axis to measure eye",
        			user_data_variable_name: "measurement_axis", 
          			initial_value: 0,
          			min: 0,
        			max: 5,
        			step: 1,
                    x:0,
                    y: 50,
                    height: 150
        			}))
    retCMD.push(function () {if (this.user_data.measurement_axis !== 5){  
                             return new_eye_window()}})
    retCMD.push(function () {return Dexter.move_all_joints(0, 0, 0, 0, 0)})
    retCMD.push(function () {if (this.user_data.measurement_axis !== 5){  
                             return smLinex(AxisTable [this.user_data.measurement_axis][4], 
                                                       this.user_data.measurement_axis)}})
    retCMD.push(function () {if (this.user_data.measurement_axis !== 5){  return scan_axis()}})
    return retCMD

}*/


//new Dexter({name: "my_dex2", ip_address: "192.168.1.142", port: 50000, enable_heartbeat: false, simulate: false})
new Job({name: "ViewEye", keep_history: true,
         do_list: [ Dexter.move_all_joints(0, 0, 0, 0, 0),
         			make_ins("w", 42, 64),
         			make_ins("S", "J1BoundryHigh",648000*_arcsec),
        	        make_ins("S", "J1BoundryLow",-648000*_arcsec),
                    make_ins("S", "J2BoundryLow",-350000*_arcsec),
                    make_ins("S", "J2BoundryHigh",350000*_arcsec),
                    make_ins("S", "J3BoundryLow",-570000*_arcsec),
                    make_ins("S", "J3BoundryHigh",570000*_arcsec),
                    make_ins("S", "J4BoundryLow",-490000*_arcsec),
                    make_ins("S", "J4BoundryHigh",490000*_arcsec),
                    make_ins("S", "J5BoundryLow",-648000*_arcsec),
                    make_ins("S", "J5BoundryHigh",648000*_arcsec),

         			make_ins("S", "MaxSpeed", 25*_deg/_s),
                    make_ins("S", "Acceleration",0.00129*_deg/_s**2),
                    make_ins("S", "StartSpeed",.7),
                    //scan_axis(),
                    smLinex,
                    //function () {return centers_output()},
                    make_ins("S", "MaxSpeed",13),
                    make_ins("S", "Acceleration",1/_nbits_cf),
                    make_ins("S", "StartSpeed",.05),
                    Dexter.move_all_joints(0, 0, 0, 0, 0),
                    function() { cal_instructions_id.innerHTML =
                                 "Click in the center of the dot_pattern circle.<br/>"}
                   ]})

/*function centers_output(){
    out("copy from here" , "Red")
    out(centers_string[0][0])
    out(centers_string[0][1])
    out(centers_string[2][0])
    out(centers_string[2][1])
    out(centers_string[1][0])
    out(centers_string[1][1])
    out(centers_string[3][0])
    out(centers_string[3][1])
    out(centers_string[4][0])
    out(centers_string[4][1])
    out("copy to here", "Red")
    out("and place in //(Dexter ip address)/srv/samba/share/AdcCenters.txt")
}*/


//returns true if successful at writing the file, false if not.
function centers_output(){
    var content = replace_substrings(JSON.stringify(centers_string), ",", ", ")
    try{
        var ip_address = Job.ViewEye.robot.ip_address
        var path = "/" + ip_address + "/share/AdcCenters.txt"
        write_file(path, content)
        return true
    }
    catch(err) {
        warning("DDE was unable to write the calibration file named:<br/><code title='unEVALable'> " + path +
                "</code><br/>Please copy and paste the below (green) string into that file<br/>" +
                "on your Dexter.")
        out(content, "green")
        return false
    }
}