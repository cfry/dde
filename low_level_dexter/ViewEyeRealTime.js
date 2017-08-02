var centers_string
var AxisTable

function smLinex(){
    xydata = []
    const size = AxisTable[window.cal_working_axis][4]
    const result = []
    result.push (make_ins("F"))
    for (var i = 0;i < size;i++){
        result.push(make_ins("a",
            AxisTable[window.cal_working_axis][0][0] * i,
            AxisTable[window.cal_working_axis][0][1] * i,
            AxisTable[window.cal_working_axis][0][2] * i,
            AxisTable[window.cal_working_axis][0][3] * i,
            AxisTable[window.cal_working_axis][0][4] * i))

        result.push(make_ins("F"))
        result.push(function(){
            var x = cal_get_robot().robot_status[AxisTable[window.cal_working_axis][1]]/10
            var y = cal_get_robot().robot_status[AxisTable[window.cal_working_axis][2]]/10
            var thehtml = svg_circle({html_class: "cal_svg_circle", cx: x, cy: flip_point_y(y), r: 1})
            append_in_ui("svg_id", thehtml)

            //James Code
            xydata.push([x*10, y*10])

            if(xydata.length > 200){
                //debugger
                let eye_suggest_result = eye_suggestion(xydata)
                //let eye_center = eye_suggest_result[2] //this should get stored somewhere
                //$(".cal_svg_circle_auto_center_min").remove()
                //$(".cal_svg_circle_auto_center_ave").remove()
                //debugger
                
                //thehtml = svg_circle({html_class:"cal_svg_circle_auto_center_min", cx: eye_center[0][0]/10, cy:flip_point_y(eye_center[0][1]/10), r: 3, color: "green"}) //replace thiswith colored dot (maybe yellow) that deletes the previous one
                //append_in_ui("svg_id", thehtml)
                
                //thehtml = svg_circle({html_class:"cal_svg_circle_auto_center_ave", cx: eye_center[1][0]/10, cy:flip_point_y(eye_center[1][1]/10), r: 3, color: "blue"}) //replace thiswith colored dot (maybe yellow) that deletes the previous one
                //append_in_ui("svg_id", thehtml)
                //out(eye_center)
                let suggestion_string = eye_suggestion_string(eye_suggest_result)
                cal_instructions_id.innerHTML = eye_suggestion_string(eye_suggest_result) //replace this withsomething that changes the text in the show window
            }

        })}
    return result
}

//returns true if successful at writing the file, false if not.
function centers_output(){
    var content = replace_substrings(JSON.stringify(centers_string), ",", ", ")
    try{
        var ip_address = Job.CalSensors.robot.ip_address
        var path = "\\" + ip_address + "\share\AdcCenters.txt"
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

function display_center_guess(){
	$(".cal_svg_circle_auto_center_min").remove()
    let eye_center = find_perfect_center(xydata)
	thehtml = svg_circle({html_class:"cal_svg_circle_auto_center_min", cx: eye_center[0][0]/10, cy:flip_point_y(eye_center[0][1]/10), r: 3, color: "green"})
    append_in_ui("svg_id", thehtml)
}

function init_view_eye(){
    //this table has to be here rather than top level in the file even though it is static,
    //because _nbits_cf and the other units cause errors if referenced at top level.
    AxisTable = [[[100/_nbits_cf, 0, 0, 0, 0], Dexter.J1_A2D_SIN, Dexter.J1_A2D_COS, [-648000*_arcsec, 0, 0, 0, 0], 1240],
                    [[0, 100/_nbits_cf, 0, 0, 0], Dexter.J2_A2D_SIN, Dexter.J2_A2D_COS, [0, -324000*_arcsec, 0, 0, 0], 1900],
                    [[0, 0, 100/_nbits_cf, 0, 0], Dexter.J3_A2D_SIN, Dexter.J3_A2D_COS, [0, 0, -500000*_arcsec, 0, 0], 1500],
                    [[0, 0, 0, 200/_nbits_cf, 0], Dexter.J4_A2D_SIN, Dexter.J4_A2D_COS, [0, 0, 0, -190000*_arcsec, 0], 1800],
                    [[0, 0, 0, 0, -100/_nbits_cf], Dexter.J5_A2D_SIN, Dexter.J5_A2D_COS, [0, 0, 0, 0, -148000*_arcsec], 4240]]
    centers_string = [["0x000", "0x000"],
                        ["0x000", "0x000"],
                        ["0x000", "0x000"],
                        ["0x000", "0x000"],
                        ["0x000", "0x000"]]
    window.cal_working_axis = undefined //global needed by calibrate_ui.js
    new Job({name: "CalSensors", keep_history: true,
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
                        display_center_guess,
                        make_ins("S", "MaxSpeed",13),
                        make_ins("S", "Acceleration",1/_nbits_cf),
                        make_ins("S", "StartSpeed",.05),
                        Dexter.move_all_joints(0, 0, 0, 0, 0),
                        function() { cal_instructions_id.innerHTML =
                                     "Click in the center of the dot_pattern circle.<br/>"}
                       ]})
}