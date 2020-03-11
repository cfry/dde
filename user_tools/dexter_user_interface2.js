//Utils tests:
// x_px_to_meters(300)
// x_px_to_meters(0)
// x_px_to_meters(150)
// meters_to_x_px(0.7)
// meters_to_x_px(-0.7)
// meters_to_x_px(0)

//var x_px_to_meters, meters_to_x_px //utility fns defined below

//_________make HTML fns
if(!window.dui2) {
var dui2 = class dui2 {
    constructor(){
       dui2.instances.push(this)
    }

    //if angle_array is an array whose first 5 elts are 0, return true,
    //else return false
    static is_home_angles(angle_array){
        for(let i = 0; i < 5; i++){
            if(angle_array[i] !== 0) { return false }
        }
        return true
    }

    //if angle_array is an array whose first 5 elts are 0, return a new array
    //whose first 5 elts are 0 except the 2nd elt is Number.EPSLION
    //and any additional elts are the same as their corresponding ones in angle_array
    static fix_angles(angle_array){
        if(this.is_home_angles(angle_array)) {
            let result = []
            for(let i = 0; i < angle_array.length; i++) {
                if(i === 1) {
                    result.push(0.000000000001) //Number.EPSILON doesn't work, too small. From James W.)
                }
                else { result.push(angle_array[i]) }
            }
            return result
        }
        else { return angle_array }
    }

    //should be the ONLY way to set this.maj_angles
    set_maj_angles(maj_angles){
        this.maj_angles = dui2.fix_angles(maj_angles)
    }

    static make_job(){
        let dex = (window.default_robot ? default_robot() : Dexter.dexter0)
        new Job({
            name: "dui2_for_" + dex.name,
            robot: dex,
            when_stopped: "wait",
            do_list: [dui2.init_dui]})
    }
    static show_window_elt_id_to_dui2_instance(sw_elt_id){
        for(let inst of dui2.instances) {
            if(inst.show_window_elt_id === sw_elt_id) {
                return inst
            }
        }
        shouldnt("sw_elt_id_to_dui2_instance could not find instance for: " + sw_elt_id)
    }

static init_dui(xy_width_in_px = 300){
    out("top of init_dui")
    let dui2_instance = new dui2()
    dui2_instance.dexter_instance = this.robot
    dui2_instance.should_point_down = false //the checkbox is in sync with this.
    dui2_instance.xy_width_in_px = xy_width_in_px
    //we want to map 0 to 300 into roughly -0.7 to 0.7   where 150 -> 0, 0 -> -0.7, 300 -> 0.7
    let half_xy_width_in_px = xy_width_in_px / 2
    let angles_for_min_x = [-90, 90, 0, -90, 0]  //means pointing out.
    let min_x = Kin.J_angles_to_xyz(angles_for_min_x)[0][0] //probably -0.7334... meters
    let max_x = min_x * -1
    let half_max_x = (max_x / 2)
    let max_x_range = max_x * 2
    let factor_to_multiply_x_px_by = max_x_range / xy_width_in_px
    dui2_instance.x_px_to_meters = //function(x_px) { return (x_px * factor_to_multiply_x_px_by) - max_x}
        function(x_px) { return ((x_px - half_xy_width_in_px) * factor_to_multiply_x_px_by  * -1)}
    dui2_instance.y_px_to_meters = //function(y_px) { return (x_px * factor_to_multiply_x_px_by) - max_x}
        function(y_px) { return ((y_px - half_xy_width_in_px) * factor_to_multiply_x_px_by * -1)}
    dui2_instance.meters_to_x_px = function(meters) {
        let scaled = ((meters  * -1) / factor_to_multiply_x_px_by) + half_xy_width_in_px //0 to 300
        //out("scaled: " + scaled)
        //let reversed = xy_width_in_px - scaled
        //out("reversed: " + reversed)
        return scaled //reversed
    } //returns 0 to 300
    dui2_instance.meters_to_y_px = function(meters) {
        return ((meters * -1) / factor_to_multiply_x_px_by) + half_xy_width_in_px
    }

    dui2_instance.radius_meters_to_px = function(radius_meters){
        return radius_meters / factor_to_multiply_x_px_by
    }
    //let angles_for_max_z = [0, 0, 0, -90, 0]
    let min_z = 0
    let max_z = Kin.reach_extents()[2][1] //aprox 0.97 meters
    //Kin.J_angles_to_xyz(angles_for_max_z)[0][2]
    //the z slider will have max-px of 300 just like x and y.
    //BUT we dynamically change its length based on x & y from the xyslider.
    //so the z slider is differnt than the xy slider not just because its 1 dimensional,
    //but because both its px length AND its max value changes with x & y.
    //a given z px always translates to a given z meters, regardless of xy values.
    ///max_z_px of 300 translates to max_z_meters.
    //min_z px and min_z meters is always 0.
    dui2_instance.z_px_to_meters = function(z_pix)  { return z_pix / xy_width_in_px }
    dui2_instance.meters_to_z_px = function(meters) { return meters * xy_width_in_px }


    show_window({title: "Dexter." + dui2_instance.dexter_instance.name + " User Interface",
        width: xy_width_in_px + 80, //380,
        height: xy_width_in_px + 290, //570,
        y: 20,
        background_color: "#d5d5d5",
        job_name: this.name, //important to sync the correct job.
        callback: dexter_user_interface_cb,
        content:
        /*Use the below controls to move Dexter.<br/>
          <svg width="300px" height="300px" style="display:inline-block; border:2px solid black;background-color:white;">
            <circle name="xy_slider" cx="59" cy="20" r="5" fill="#0F0" class="draggable" data-oninput="true"
                    style="stroke:black; stroke-width:1;"/>
          </svg>
        <input type="range" name="z_slider" value="33" min="0" max="100" data-oninput="true"
               style="width:300px; height:20px;margin:0px; transform-origin:150px; transform: translate(170px, -163px) rotate(-90deg);"/>
        <br/> */
        '<span>Use the below controls to move Dexter.</span> <b style="margin-left:70px;">Z</b><br/>' +
        dui2_instance.make_xyz_sliders_html(xy_width_in_px,
            min_x, max_x,
            //min_y, max_y are same as min_x, max_x, so don't pass them.
            min_z, max_z) +
        "<br/>" +
        dui2_instance.make_joint_sliders_html() +
        dui2_instance.make_direction_html()
    })
    setTimeout(function() {
            dui2_instance.show_window_elt_id = "show_window_" + SW.window_index + "_id"
            let RS_inst = dui2_instance.dexter_instance.rs //new RobotStatus(rs)
            dui2_instance.set_maj_angles(RS_inst.measured_angles()) //returns a copy of the array so safe to change it.
            dui2_instance.update_all(true) //true means IFF maj_angles is pointing down, set the checkbox to point down.
        },
        300)
}


/*
var cir1 = SW.get_window_of_index().querySelector("[id=xy_2d_slider]")
cir1.cx = 42 fails
cir1.getAttribute("cx")
cir1.setAttribute("cx", 0)
cir1.setAttribute("cx", 42)
cir1.getAttribute("cy")
cir1.setAttribute("cy", 0)
cir1.setAttribute("cy", 42)
*/

//does not attempt to set initial value. That's done in update_from_robot
    make_xyz_sliders_html(xy_width_in_px = 300,
                               min_x, max_x,
                               //min_y, max_y are same as min_x, max_x, so don't pass them.
                               min_z, max_z){
        out("\ntop of make_xyz_sliders_html with xy_width_in_px: " + xy_width_in_px +
            " min_x:" +  min_x +
            " max_x:" +  max_x +
            " min_z:" +  min_z +
            " max_z:" +  max_z )
        //let hidden = '<input type="hidden" name="factor_to_multiply_x_px_by" value="' + factor_to_multiply_x_px_by + '"/>' +
        //             '<input type="hidden" name="max_x" value="' + max_x + '"/>' //used to compute both x and y
        //warning: circle has no "name" property. If you pass one, it will be ignored. stupid design. So use "id", but beware, it may not be unique
        let xy_loc_circle_html = '<circle id="xy_2d_slider" cx="0" cy="0" r="5" fill="#0F0" class="draggable" data-oninput="true" ' +
            'style="stroke:black; stroke-width:1;"/>'
        let outer_circle_html = '<circle id="outer_circle" cx="0" cy="0" r="100" fill="white" ' +
            'style="stroke:black; stroke-width:1;"/>'
        let inner_circle_html = '<circle id="inner_circle" cx="0" cy="0" r="100" fill="' + dui2.xy_background_color + '" ' +
            'style="stroke:black; stroke-width:1;"/>'
        let svg_html =
            '<div style="display:inline-block;vertical-align:900%;"><b style="margin-right:5px;">Y</b></div>' +
            '<svg style="display:inline-block; border:2px solid black;background-color:' + dui2.xy_background_color + ';margin-bottom:0px;" ' +
            'width="'  + xy_width_in_px + 'px" ' +
            'height="' + xy_width_in_px + 'px" ' +
            '>' +
            outer_circle_html +
            inner_circle_html +
            xy_loc_circle_html +
            '</svg>'
        let z_slider_html =
            '<input type="range" name="z_slider" step="0.01" value="0" min="0" max="' + max_z + '" data-oninput="true" ' +
            'style="width:' + xy_width_in_px + 'px; height:20px;margin:0px; background-color:#0F0;' +
            'transform-origin:' + (xy_width_in_px / 2) + 'px; transform: translate(190px, -163px) rotate(-90deg);"/>'
        let xyz_num_html =
            'X: <input name="x_num" type="number" data-oninput="true" style="width:55px;" min="' + min_x + '" max="' + max_x + '" value="0" step="0.01" ' + '"/><span style="margin-right:15px;">m</span>' +
            'Y: <input name="y_num" type="number" data-oninput="true" style="width:55px;" min="' + min_x + '" max="' + max_x + '" value="0" step="0.01" ' + '"/><span style="margin-right:15px;">m</span>' +
            'Z: <input name="z_num" type="number" data-oninput="true" style="width:55px;" min="' + min_z + '" max="' + max_z + '" value="0" step="0.01" ' + '"/>m'

        let z_slider_restriction_html = '<div style="position:absolute; top:60px; right:25px; width:20px; height:40px; background-color:' + dui2.xy_background_color + ';"></div>'
        let the_html =
            svg_html +
            z_slider_html +
            //z_slider_restriction_html +
            '<div style="display:inline; position:absolute; margin-top:0px;left:160px;top:365px;"><b>X</b></div><br/>' +
            xyz_num_html
        return the_html
    }

    make_joint_sliders_html(){
        out("top of make_joint_sliders_html with dex: " + dex)
        //let rs = dex.robot_status
        //out("in make_joint_sliders_html with rs: " + rs)
        //let RS_inst = new RobotStatus(rs)
        //out("in make_joint_sliders_html with RS_inst: " + RS_inst)
        let result = "" //"<style> .dui-slider::-webkit-slider-thumb {background-color:#00FF00;}</style>"
        for(let joint_number = 1; joint_number < 8; joint_number++){
            let min_name = "J" + joint_number + "_angle_min"
            let min = this.dexter_instance[min_name]
            let max_name = "J" + joint_number + "_angle_max"
            let max = this.dexter_instance[max_name]
            let val //= RS_inst.measured_angle(joint_number) //these will be set in update_all
            if(!val) { val = 0 } //when the robot hasn't had a job run on it yet, there won't be a measured_angle,
                                 //and a val of "undefined" causes a low level warning.
            let slider_width = 200
            let slider_step = 1
            let slider_html = 'J' + joint_number + ': <input data-oninput="true" type="range" ' +
                'name="j' + joint_number + '_range' +
                '" value="' + val + '" ' +
                'min="' + min + '" ' +
                'max="' + max + '" ' +
                'style="width:250px;"/>'
            let num_html = ' <input name="j' + joint_number + '_angle_num" type="number" step="0.1" data-oninput="true" min="' + min + '" max="' + max + '" value="' + val + '" style="width:55px;"/>'
            result += slider_html + num_html + '&deg;<br/>'
        }
        return result
    }

    make_direction_html(){
        let dir = [0, 0, -1] //down, the default  //doesn't really matter as this will be reset in update_all
        let result =  '<div>Direction: <span class="direction">' +
                       JSON.stringify(dir) +
                       '</span> ' +
                       '<input type="checkbox" name="direction_checkbox" data-onchange="true" style="margin-left:20px;"/> Point Down </div>' //unchecked by default
        return result
    }

    //unnecessary, use the dui2_instance.direction
    static get_direction_in_ui(sw_elt){
        if(typeof(sw_elt)) { sw_elt = window[sw_elt] }
        let dir_elt = sw_elt.querySelector(".direction")
       return JSON.parse(dir_elt.innerHTML)
    }

    set_direction_in_ui(){
        let sw_elt = window[this.show_window_elt_id]
        //if(typeof(sw_elt) == ) { sw_elt = window[sw_elt] }
        let dir_elt = sw_elt.querySelector(".direction")
        let dir_str = JSON.stringify(this.direction)
        dir_elt.innerHTML = dir_str
    }

     //unnecessary, use the dui2_instance.should_point_down
    static is_point_down_checked(sw_elt){
        if(typeof(sw_elt)) { sw_elt = window[sw_elt] }
        let dir_checkbox_elt = sw_elt.querySelector(".direction_checkbox")
        return dir_checkbox_elt.checked
    }

    set_point_down_checkbox(){
        let sw_elt = window[this.show_window_elt_id]
        let dir_checkbox_elt = sw_elt.querySelector(".direction_checkbox")
        dir_checkbox_elt.checked = this.should_point_down
    }

//______show_window callback

//strategy: convert the changed values into maj_angles, set dui2_instance.maj_angles and, at the end,
// call update_all once regardless of who started it.
static dexter_user_interface_cb_aux(vals){
    //out("dui_cb got clicked_button_value: " + vals.clicked_button_value +
    //    " which has val: " + vals[vals.clicked_button_value])
    debugger;
    let dui2_instance = dui2.show_window_elt_id_to_dui2_instance(vals.show_window_elt_id)
    if(["xy_2d_slider", "z_slider"].includes(vals.clicked_button_value)){
        let cir_xy_obj = vals.xy_2d_slider
        //out(JSON.stringify(cir_xy_obj))
        let x = parseFloat(cir_xy_obj.cx)
        x = dui2_instance.x_px_to_meters(x)
        let y = parseFloat(cir_xy_obj.cy) //a num between 0 and 300
        //out("got cy of: " + y)
        y = dui2_instance.y_px_to_meters(y)

        let xyz = [x, y, vals.z_slider]
        try {
            let j_angles = Kin.xyz_to_J_angles(xyz, dui2_instance.direction) //returns just 5 angles
            if(j_angles.length === 5) { j_angles.push(vals.j6_angle_num)   }
            if(j_angles.length === 6) { j_angles.push(vals.j7_angle_num)   }
            dui2_instance.set_maj_angles(j_angles)
        }
        catch(err) {
            if(vals.clicked_button_value === "z_slider"){
                warning("Sorry, Dexter can't go to Z position: " + xyz[2] +
                    " given X position: " + xyz[0] +
                    " and Y position: " + xyz[2])
            }
            else {
                warning("Sorry, Dexter can't go to X position: " + xyz[0] +
                    " and/or Y position: " + xyz[1] +
                    " given Z position: " + xyz[2])
            }
            //let prev_xyz = [vals.x_num, vals.y_num, vals.y_num]
            //dui2.update_xyz_circle(vals.show_window_elt_id, prev_xyz) //restore old numbers
            //return //don't return, just let update_all reset to old maj_angles
        }
        //dui2.update_xyz_nums(vals.show_window_elt_id, xyz)
        //dui2.update_range_and_angle_nums(vals.show_window_elt_id, maj_angles)
    }
    else if(vals.clicked_button_value.endsWith("_num") &&  //x_num, y_num, z_num the typein boxes
        !vals.clicked_button_value.endsWith("_angle_num")){ //an x,y,or z number input
        let xyz = [vals.x_num, vals.y_num, vals.z_num]
        try {
            let j_angles = Kin.xyz_to_J_angles(xyz, dui2_instance.direction) //returns just 5 angles
            if(j_angles.length === 5) { j_angles.push(vals.j6_angle_num)   }
            if(j_angles.length === 6) { j_angles.push(vals.j7_angle_num)   }
            dui2_instance.set_maj_angles(j_angles)
        }
        catch(err) {
            let x_y_or_z = vals.clicked_button_value[0]
            let other_dimensions
            if(x_y_or_z == "x")      { other_dimensions = "y and z" }
            else if(x_y_or_z == "y") { other_dimensions = "x and z" }
            else if(x_y_or_z == "z") { other_dimensions = "x and y" }
            let val = vals[vals.clicked_button_value]
            warning("Sorry, Dexter can't go to " +  x_y_or_z + " position: " + val +
                " given the positions of " + other_dimensions + ".")
           // let cir_data_array = vals.xy_2d_slider
           // let prev_xyz = [cir_data_array.cx, cir_data_array.cy, vals.z_slider]
           // dui2.update_xyz_nums(vals.show_window_elt_id, prev_xyz) //restore old numbers
           // return  //don't return, just let update_all reset to old maj_angles
        }
        //dui2.update_xyz_circle(vals.show_window_elt_id, xyz)
        //dui2.update_range_and_angle_nums(vals.show_window_elt_id, maj_angles)
    }
    else if(vals.clicked_button_value.endsWith("_range")){ //a joint slider
        dui2_instance.set_maj_angles([vals.j1_range, vals.j2_range, vals.j3_range, vals.j4_range,
            vals.j5_range, vals.j6_range, vals.j7_range])

        //selector_set_in_ui("#" + vals.show_window_elt_id + " [name=j1_range] [style] [width]", "75px")
        /*let joint_number = parseInt(vals.clicked_button_value[1]) // 1 thru 5
        let angle = maj_angles[joint_number - 1]
        let angle_num_name = "j" + joint_number + "_angle_num"
        let num_selector = "#" + vals.show_window_elt_id + " " +
            "[name=" + angle_num_name + "]" + " " +
            "[value]"
        selector_set_in_ui(num_selector, angle)
        let xyz = Kin.J_angles_to_xyz(maj_angles)[0]
        dui2.update_xyz_nums(vals.show_window_elt_id, xyz)
        dui2.update_xyz_circle(vals.show_window_elt_id, xyz)
        */

    }
    else if(vals.clicked_button_value.endsWith("_angle_num")){ /// the num input for a joint angle
        /*let val = vals[vals.clicked_button_value]
        let joint_number = vals.clicked_button_value[1]
        let range_name = "j" + joint_number + "_range"
        let selector = "#" + vals.show_window_elt_id + " [name=" + range_name + "] [value]"
        selector_set_in_ui(selector, val)
        */
        dui2_instance.set_maj_angles([vals.j1_angle_num, vals.j2_angle_num, vals.j3_angle_num, vals.j4_angle_num,
                                      vals.j5_angle_num, vals.j6_angle_num, vals.j7_angle_num])
        out("computed maj_angles in _angle_numb of: " + maj_angles)
        //let xyz = Kin.J_angles_to_xyz(maj_angles)[0]
        //dui2.update_xyz_nums(vals.show_window_elt_id, xyz)
        //dui2.update_xyz_circle(vals.show_window_elt_id, xyz)

    }
    else if(vals.clicked_button_value == "direction_checkbox"){
        dui2_instance.should_point_down = vals.direction_checkbox
        dui2_instance.set_maj_angles([vals.j1_angle_num, vals.j2_angle_num, vals.j3_angle_num, vals.j4_angle_num,
                                      vals.j5_angle_num, vals.j6_angle_num, vals.j7_angle_num])  //no actual change here, but just to ensure consistency
    }
    dui2_instance.update_all() // do update_all before move_all_joints because update_all may modify ui2_instance.maj_angles if the direction_checkbox is checked
    let instr = Dexter.pid_move_all_joints(dui2_instance.maj_angles)
    Job.insert_instruction(instr, {job: vals.job_name, offset: "end"})
    //out("inserted instr: " + instr)
}

//_______update UI fns_______
    //expects this.maj_angles to be set with the latest.
    //does NOT expect this.maj_angles to have yet been adjusted if the direction checkbox is checked.
    update_all(check_box_if_direction_is_down = false){
        //ebugger;
        if(this.should_point_down) {
            this.set_maj_angles(Kin.point_down(this.maj_angles))
        }
        this.direction = Kin.J_angles_to_dir(this.maj_angles)
        if(check_box_if_direction_is_down) { //true only during init
            this.should_point_down = similar(this.direction, [0, 0, -1])
        }
        this.update_direction()
        this.update_range_and_angle_nums()
        this.xyz = Kin.J_angles_to_xyz(this.maj_angles)[0]
        this.update_xyz_nums()
        this.update_xyz_limits()
        this.update_xyz_circle()
    }

/*static update_from_robot(dex, sw_elt_id){
    //let rs = dex.robot_status
    let RS_inst = dex.rs //new RobotStatus(rs)
    let maj_angles = RS_inst.measured_angles()

    let dir = Kin.J_angles_to_dir(maj_angles)
    let dir_is_down = similar(dir, [0, 0, -1])
    this.set_direction_in_ui(sw_elt_id, dir) //if its down, assume the user wants the checkbox to be checked and keep it down, until they uncheck it
    this.set_point_down_checkbox(sw_elt_id, dir_is_down)

    let xyz = Kin.J_angles_to_xyz(maj_angles)[0]
    dui2.update_range_and_angle_nums(sw_elt_id, maj_angles)
    dui2.update_xyz_nums(sw_elt_id, xyz)
    dui2.update_xyz_circle(sw_elt_id, xyz)
}*/
    update_range_and_angle_nums(){
        for(let joint_number = 1; joint_number < 6; joint_number++){
            let angle = this.maj_angles[joint_number - 1] //j1 thru 5 are in index 0 thru 4
            selector_set_in_ui("#" + this.show_window_elt_id + " [name=j" + joint_number + "_range] [value]",
                angle)
            selector_set_in_ui("#" + this.show_window_elt_id + " [name=j" + joint_number + "_angle_num] [value]",
                angle)
        }
        let j4_5_disabled_value = ((this.should_point_down) ? "disabled" : null)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=j4_range] [disabled]",
            j4_5_disabled_value)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=j5_range] [disabled]",
            j4_5_disabled_value)
        let j4_5_title = ""
        if(j4_5_disabled_value !== null) {
            j4_5_title = "J4 & J5 sliders disabled because Point Down checkbox is checked."
        }
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=j4_range] [title]", j4_5_title)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=j5_range] [title]", j4_5_title)
    }

    //x,y,z in meters
    update_xyz_nums(){
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=x_num] [value]", this.xyz[0])
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=y_num] [value]", this.xyz[1])
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=z_num] [value]", this.xyz[2])
    }

    //updates the LIMITs ,ie red areas in xy and the limits of the z slider.
    update_xyz_limits(){
        //get the model in meters
        let z = this.xyz[2] //already in meters
        let dir = this.direction
        let [inner_r, outer_r, outer_xy] = Kin.xy_donut_slice_approx(z, dir)
        let inner_xy = [0, 0] //and by the way, for now, outer_xy will also always be [0,0],
                              // but that will likely change

        let current_max_z = Kin.max_z(this.xyz[0], this.xyz[1], dir) //*might* return NaN
        let current_max_z_px = (Number.isNaN(current_max_z) ? 0 : Math.round(this.meters_to_z_px(current_max_z)) + "px")

        //convert to pixels
        let outer_r_px = (Number.isNaN(current_max_z) ? 0 : this.radius_meters_to_px(outer_r))
        let outer_x_px = this.meters_to_x_px(outer_xy[0])
        let outer_y_px = this.meters_to_y_px(outer_xy[1])

        let inner_r_px = (Number.isNaN(current_max_z) ? 0 : this.radius_meters_to_px(inner_r))
        let inner_x_px = this.meters_to_x_px(inner_xy[0])
        let inner_y_px = this.meters_to_y_px(inner_xy[1])
        //draw
        selector_set_in_ui("#" + this.show_window_elt_id + " svg [style] [background-color]", "#ff7e79")
        //ebugger;
        selector_set_in_ui("#" + this.show_window_elt_id + " svg [id=outer_circle] [r]",  outer_r_px)
        selector_set_in_ui("#" + this.show_window_elt_id + " svg [id=outer_circle] [cx]", outer_x_px)
        selector_set_in_ui("#" + this.show_window_elt_id + " svg [id=outer_circle] [cy]", outer_y_px)

        selector_set_in_ui("#" + this.show_window_elt_id + " svg [id=inner_circle] [r]",  inner_r_px)
        selector_set_in_ui("#" + this.show_window_elt_id + " svg [id=inner_circle] [cx]", inner_x_px)
        selector_set_in_ui("#" + this.show_window_elt_id + " svg [id=inner_circle] [cy]", inner_y_px)

        selector_set_in_ui("#" + this.show_window_elt_id + " [name=z_slider] [max]", current_max_z)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=z_slider] [value]", z)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=z_slider] [style] [width]", current_max_z_px)


    }

    //x,y,z in meters
    update_xyz_circle(){
        let x_px = this.meters_to_x_px(this.xyz[0])
        let y_px = this.meters_to_y_px(this.xyz[1])
        //let z_px = dui2.meters_to_x_px(xyz[2]) //don't do as range slider has its min and max
        selector_set_in_ui("#" + this.show_window_elt_id + " [id=xy_2d_slider] [cx]", x_px)
        selector_set_in_ui("#" + this.show_window_elt_id + " [id=xy_2d_slider] [cy]", y_px)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=z_slider] [value]", this.xyz[2])
    }

    update_direction(){
        let new_val_str = "["
        for (let i=0; i < 3; i++) {
            let dir_item = this.direction[i]
            dir_item = "" + dir_item
            let len = ((dir_item[0] === "-") ? 6 : 5)
            dir_item = dir_item.substring(0, len)
            new_val_str += dir_item
            if (i < 2) { new_val_str += ", " }
        }
        new_val_str  += "]"
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=direction_checkbox] [checked]", this.should_point_down) //selector_set_in_ui fixes bad design of checkboxes by accepting "false" and false to mean unchecked.
        selector_set_in_ui("#" + this.show_window_elt_id + " .direction [innerHTML]", new_val_str)
    }

} //end of class dui2

dui2.instances = []
dui2.xy_background_color = "#ff7e79"

function dexter_user_interface_cb(vals){
    dui2.dexter_user_interface_cb_aux(vals)
}
} //end of top level if

dui2.make_job() //in DDE, makes a job using the default_robot in the Misc pane select.