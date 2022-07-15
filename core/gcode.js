class Gcode{
  //these variables are initended to be persistent accross gcode jobs, as is Gcode itself.
  static absolute_coordinates = true
  static absolute_distances   = true //use absolute distances for extrusion
  static distance_units = 0.001 // _mm == 0.001 == millimeters. I think mm should be the default.
  static hotend_temperature //in degrees C. typical 220
  static fan_on = false
  static feedrate = 5000 //in millimeters per minute. 5000 was just first use, not a std default
  static X = 0 //in mm
  static Y = 0 //in mm
  static Z = 0 //in mm
  static init(){ //called from ready.js
      Gcode.gcode_to_instructions_workspace_pose_default =
          Vector.make_pose([0, 0.5, 0.1], [0, 0, 0], _mm)
  }

  static XYZ() { return [this.X, this.Y, this.Z] } //in mm

//returns lit obj or null  if gstring is a comment or blank line
  static gcode_line_to_obj (gstring){
    gstring = Gcode.gline_remove_comment(gstring)
    if (gstring == "") { return null }
    else if (gstring.startsWith(";")){ //semicolon on non first column starts end of line comment.
        return Gcode.gcode_varline_to_obj(gstring)
    }
    else {
        var litobj = {}
        if(gstring.startsWith("F")) {
            litobj.type = "F"
            let val = parseFloat(gstring.substring(1))
            litobj.F = val
        }
        else {
            var garray = gstring.split(" ")
            litobj.type = garray[0]
            for(let arg of garray){
                arg = arg.trim()
                let letter = arg[0]  //typically M, G, X, Y, X, E, F
                let num = arg.substring(1)
                if (is_string_a_number(num)){
                    num = parseFloat(num)
                }
                litobj[letter] = num //allowed to be a string, just in case somethign wierd, but is
                //usually a number
            }
        }
        return litobj
    }
  }
//trims whitespace and comment. Careful: if line begins with semicolon, its not a comment
 static gline_remove_comment(gstring){
    let comment_pos = gstring.lastIndexOf(";")
    if      (comment_pos == -1) { return gstring.trim() }
    else if (comment_pos == 0)  {
        if (gstring.includes("=")) { return gstring.trim()} //not actually a comment, its a var
        else { return "" } //a comment whose line starts with semicolon as in the top line of a file
    }
    else                        { return gstring.substring(0, comment_pos).trim() }
  }

 static gcode_varline_to_obj(gstring){
    let litobj = {}
    gstring = gstring.substring(1).trim() //cut off the semicolon
    let var_val = gstring.split("=")
    let var_name = var_val[0].trim()
    litobj.type = "VAR"
    litobj.name = var_name
    let val = var_val[1].trim()
    if (val.includes(",")){
        let vals = val.split(",")
        litobj.val = []
        for(let subval of vals){
            let processed_subval = Gcode.gcode_process_subval(subval) //probably won't be [12, "%"] but if it is, ok
            litobj.val.push(processed_subval) //if our val is something like "0x0,2x3,4x5" then each subval will b [0, 0] etc and we'll have an array of arrays
        }
    }
    else {
        let processed_subval = Gcode.gcode_process_subval(val)
        if (Array.isArray(processed_subval) &&
            (processed_subval.length == 2)  &&
            (typeof(processed_subval[1]) != "number")){
            litobj.val   = processed_subval[0]
            litobj.units = processed_subval[1]
        }
        else { litobj.val = processed_subval }
    }
    return litobj
  }

//subval can be "123", "123.45",  "123%"    "#FFFFFF"  "0x0", "123x45",  "G28" "M104 S0", "12.3mm",     "1548.5mm (3.7cm3)", ""
//return         a number,        [123, "%"] "#FFFFFF", [0, 0] [123, 45], "G28" "M104 S0", [12.3, "mm"], "1548.5mm (3.7cm3)", ""
  static gcode_process_subval(subval){
    subval = subval.trim()
    let x_pos = subval.indexOf("x")
    if (subval.includes(" ")) { return subval } //just a string
    else if ((x_pos != -1) &&
        (x_pos != 0)  &&
        (x_pos != (subval.length - 1))) { //we've probably got subval of format "12x34"
        let subsubvals = subval.split("x")
        let val = []
        for(let subsubval of subsubvals){
            if (is_string_a_number(subsubval)) { val.push(parseFloat(subsubval))}
            else { return subval } //its just a string with an x in the middle of it.
        }
        return val
    }
    else if (is_string_a_number(subval)){
        return parseFloat(subval)
    }
    else { //maybe have a number with units ie 12.3mm, but we don't have just a number, we might have just a string
        for(let i = 0; i < subval.length; i++){
            let char = subval[i]
            if ("0123456789.-".includes(char)) {} //continue looping
            else if (i == 0) { //first char not in a num so whole thing is a string
                return subval
            }
            else if ((i == 1) && (subval[0] == "-")){ //example "-foo". Its not a num
                return subval
            }
            else {
                let num = parseFloat(subval.substring(0, i))
                let units = subval.substring(i)
                return [num, units]
            }
        }
        //not expecting this to happen, but in case it does
        return subval
    }
  }

//G0  for "rapid move" or G1 code
  static gobj_to_move_to(gobj, workspace_pose, robot){ //ok for say, gobj to not have Z. that will just return undefined, and
    //move_to will get the existing Z value and use it.
    if (typeof(gobj) == "string") {
        gobj = Gcode.gcode_line_to_obj(gobj)
    }
    if (gobj) {
        let [x_u, y_u, z_u] = this.XYZ()
        let old_point = [gobj.X || x_u, gobj.Y || y_u, gobj.Z || z_u] //because one or more of x,y,z might not be present
        //var new_point = Vector.transpose(Vector.matrix_multiply(workspace_pose, Vector.properly_define_point(old_point))).slice(0, 3)
        //commented out since I couldn't figure it out.
        let new_point = old_point
        if(!this.absolute_coordinates) { //new_point is in relative coords
            new_point = Vector.add(new_point, [Gcode.X, Gcode.Y. Gcode.Z]) //do the add first.
        }
        //store new positions in mm
        Gcode.X = new_point[0]
        Gcode.Y = new_point[1]
        Gcode.Z = new_point[2]

        //then convert to meters for Dexter
        new_point = Vector.multiply(old_point, Gcode.distance_units)

        let move_inst = robot.move_to(new_point)
        let result = move_inst
        if(gobj.F){
           result = [this.set_feedrate(gobj.F)]
           result.push(move_inst)
        }
        return result
    }
    else { return null } //happens when passing a string for gobj and its just a comment.
  }
    static gobj_to_move_to_straight(gobj, workspace_pose, robot){ //ok for say, gobj to not have Z. that will just return undefined, and
        //move_to will get the existing Z value and use it.
        if (typeof(gobj) == "string") {
            gobj = Gcode.gcode_line_to_obj(gobj)
        }
        if (gobj) {
            let [x_u, y_u, z_u] = this.XYZ()
            let old_point = [gobj.X || x_u, gobj.Y || y_u, gobj.Z || z_u]
            //var new_point = Vector.transpose(Vector.matrix_multiply(workspace_pose, Vector.properly_define_point(old_point))).slice(0, 3)
            //commented out since I couldn't figure it out.
            let new_point = old_point
            if(!this.absolute_coordinates) { //new_point is in relative coords
                new_point = Vector.add(new_point, [Gcode.X, Gcode.Y. Gcode.Z]) //do the add first.
            }
            //store new positions in mm
            Gcode.X = new_point[0]
            Gcode.Y = new_point[1]
            Gcode.Z = new_point[2]

            //then convert to meters for Dexter
            new_point = Vector.multiply(old_point, Gcode.distance_units)
            let move_inst = robot.move_to_straight({xyz: new_point})
            let result = move_inst
            if(gobj.F){
                result = [this.set_feedrate(gobj.F)]
                result.push(move_inst)
            }
            return result
        }
        else { return null } //happens when passing a string for gobj and its just a comment.
    }
    static set_feedrate(mm_per_min) {
        this.feedrate = mm_per_min
        let meters_per_min = mm_per_min / 1000
        let meters_per_sec = meters_per_min / 60
        return Dexter.set_parameter("CartesianSpeed", meters_per_sec)
    }
}

//need this here because just putting a * at the end of a static method in a class errors.
Gcode.gcode_to_instructions = function* ({gcode = "",
                                          filepath = null,
                                          workspace_pose = Gcode.gcode_to_instructions_workspace_pose_default,
                                          robot=Dexter}){
    let the_content = gcode
    if (filepath) { the_content += read_file(filepath) }
    let gcode_lines = the_content.split("\n")
    for(let i = 0; i < gcode_lines.length; i++){
        let gcode_line = gcode_lines[i]
        let gobj = Gcode.gcode_line_to_obj(gcode_line) //added for debugging only, sep 24, 2021
        if (gobj == null) { continue; }
        else {
            let result
            switch(gobj.type){
                case "F":
                    result = Gcode.set_feedrate(gobj.F)
                    yield result
                    break;
                case "G0":
                    result = Gcode.gobj_to_move_to(gobj, workspace_pose, robot) //fast move
                    yield result
                    break;
                case "G1":
                    result = Gcode.gobj_to_move_to_straight(gobj, workspace_pose, robot)
                    yield result
                    break;
                case "G21":
                    Gcode.distance_units = _mm
                    break;
                case "G28": //home  xyz 0,0,0 is unreachable so I made up some coors that are reachable
                    Gcode.X = 0    / _mm
                    Gcode.Y = 0.01 / _mm
                    Gcode.Z = 0.07 / _mm
                    result = Gcode.gobj_to_move_to({ X:Gcode.X, Y:Gcode.Y, Z:Gcode.Z }, workspace_pose, robot) //needed to initialize out of the way
                    yield result
                    break; //added to fix, sep 24, 2021
                case "G90":
                     Gcode.absolute_coordinates = true
                     break;
                case "G91":
                    Gcode.absolute_coordinates = false  //ie relative coords.
                    break;
                case "M82":
                     Gcode.absolute_distances = true
                     break;
                case "M82":   //use absolute distances for extrusion
                     Gcode.absolute_distances = true
                     break;
                case "M84":   //Stop idle hold. Probalby should be a no-op for Dexter.
                    Gcode.absolute_distances = true
                    break;
                case "M104":  //set temp of extruder contains value like S220, degrees C.
                    Gcode.hotend_temperature = gobj.S
                    break;
                case "M106":  //fan on. has lots of params ie which fan, fan speed, but this is the basic, 1 fan system.
                    Gcode.fan_on = true
                    break;
                case "M107":  //fan off
                    Gcode.fan_on = false
                    break;
                case "M109":  //set temp and wait for it to be reached
                    Gcode.hotend_temperature = gobj.S
                    //needs work
                    break;
                case "VAR":
                    break; //ignore. do next iteration
                default:
                    warning("Gcode.gcode_to_instructions got unknown instruction type: " + gobj.type)
                    break; //ignore. do next iteration
            }
        }
    }
}

module.exports = Gcode
var Vector = require("../math/Vector.js")
var {is_string_a_number} = require("./utils.js")