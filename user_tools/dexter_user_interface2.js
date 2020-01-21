//Utils tests:
// x_px_to_meters(300)
// x_px_to_meters(0)
// x_px_to_meters(150)
// meters_to_x_px(0.7)
// meters_to_x_px(-0.7)
// meters_to_x_px(0)

var x_px_to_meters, meters_to_x_px //utility fns defined below
//_________make HTML fns
function init_dui(xy_width_in_px = 300){
    out("top of init_dui")
    let half_xy_width_in_px = xy_width_in_px / 2
    let angles_for_min_x = [-90, 90, 0, -90, 0]
    let min_x = Kin.J_angles_to_xyz(angles_for_min_x)[0][0] //probably -0.7334... meters
    let max_x = min_x * -1
    let half_max_x = (max_x / 2)
    let max_x_range = max_x * 2
    let factor_to_multiply_x_px_by = max_x_range / xy_width_in_px
    x_px_to_meters = function(x_px) { return (x_px * factor_to_multiply_x_px_by) - max_x}
    meters_to_x_px = function(meters) {
        let scaled = (meters / factor_to_multiply_x_px_by) + half_xy_width_in_px //0 to 300
        //out("scaled: " + scaled)
        let reversed = xy_width_in_px - scaled
        //out("reversed: " + reversed)
        return reversed
    } //returns 0 to 300
    let angles_for_max_z = [0, 0, 0, -90, 0]
    let min_z = 0
    let max_z = Kin.J_angles_to_xyz(angles_for_max_z)[0][2]
    let dex = this.robot
    show_window({title: "Dexter User Interface",
        width: xy_width_in_px + 80, //380,
        height: xy_width_in_px + 270, //570,
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
        make_xyz_sliders_html(xy_width_in_px,
            min_x, max_x,
            //min_y, max_y are same as min_x, max_x, so don't pass them.
            min_z, max_z) +
        "<br/>" +
        make_joint_sliders_html(dex)
    })
    setTimeout(function() {
            update_from_robot(dex, "show_window_" + SW.window_index + "_id")
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
function make_xyz_sliders_html(xy_width_in_px = 300,
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
    //warning: circle has no "name" property. If you pass one, it will be ignored. stupid design.
    let circle_html = '<circle id="xy_2d_slider" cx="0" cy="0" r="5" fill="#0F0" class="draggable" data-oninput="true" ' +
        'style="stroke:black; stroke-width:1;"/>'
    let svg_html =
        '<div style="display:inline-block;vertical-align:900%;"><b style="margin-right:5px;">Y</b></div>' +
        '<svg style="display:inline-block; border:2px solid black;background-color:white;margin-bottom:0px;" ' +
        'width="'  + xy_width_in_px + 'px" ' +
        'height="' + xy_width_in_px + 'px" ' +
        '>' +
        circle_html +
        '</svg>'
    let z_slider_html =
        '<input type="range" name="z_slider" step="0.01" value="0" min="0" max="' + max_z + '" data-oninput="true" ' +
        'style="width:' + xy_width_in_px + 'px; height:20px;margin:0px; background-color:#0F0;' +
        'transform-origin:' + (xy_width_in_px / 2) + 'px; transform: translate(190px, -163px) rotate(-90deg);"/>'
    let xyz_num_html =
        'X: <input name="x_num" type="number" data-oninput="true" style="width:55px;" min="' + min_x + '" max="' + max_x + '" value="0" step="0.01" ' + '"/><span style="margin-right:15px;">m</span>' +
        'Y: <input name="y_num" type="number" data-oninput="true" style="width:55px;" min="' + min_x + '" max="' + max_x + '" value="0" step="0.01" ' + '"/><span style="margin-right:15px;">m</span>' +
        'Z: <input name="z_num" type="number" data-oninput="true" style="width:55px;" min="' + min_z + '" max="' + max_z + '" value="0" step="0.01" ' + '"/>m'

    let the_html = //hidden +
        svg_html + z_slider_html +
        '<div style="display:inline; position:absolute; margin-top:0px;left:160px;top:365px;"><b>X</b></div><br/>' +
        xyz_num_html
    return the_html
}

function make_joint_sliders_html(dex){
    out("top of make_joint_sliders_html with dex: " + dex)
    let rs = dex.robot_status
    out("in make_joint_sliders_html with rs: " + rs)
    let RS_inst = new RobotStatus(rs)
    out("in make_joint_sliders_html with RS_inst: " + RS_inst)
    let result = "" //"<style> .dui-slider::-webkit-slider-thumb {background-color:#00FF00;}</style>"
    for(let joint_number = 1; joint_number < 8; joint_number++){
        let min_name = "J" + joint_number + "_angle_min"
        let min = dex[min_name]
        let max_name = "J" + joint_number + "_angle_max"
        let max = dex[max_name]
        let val = RS_inst.measured_angle(joint_number)
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

//______show_window callback
function dexter_user_interface_cb(vals){
    out("dui_cb got clicked_button_value: " + vals.clicked_button_value +
        " which has val: " + vals[vals.clicked_button_value])
    let x
    let y
    let z
    let maj_angles
    if(["xy_2d_slider", "z_slider"].includes(vals.clicked_button_value)){
        let cir_data_array = vals.xy_2d_slider
        out(JSON.stringify(cir_data_array))
        let xyz = [cir_data_array.cx, cir_data_array.cy, vals.z_slider]
        try {
            maj_angles = Kin.xyz_to_J_angles(xyz)
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
            let prev_xyz = [vals.x_num, vals.y_num, vals.y_num]
            update_xyz_circle(vals.show_window_elt_id, prev_xyz) //restore old numbers
            return
        }
        update_xyz_nums(vals.show_window_elt_id, xyz)
        update_range_and_angle_nums(vals.show_window_elt_id, maj_angles)
    }
    else if(vals.clicked_button_value.endsWith("_num") &&
        !vals.clicked_button_value.endsWith("_angle_num")){ //an x,y,or z number input
        let xyz = [vals.x_num, vals.y_num, vals.z_num]
        try {
            maj_angles = Kin.xyz_to_J_angles(xyz)
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
            let cir_data_array = vals.xy_2d_slider
            let prev_xyz = [cir_data_array.cx, cir_data_array.cy, vals.z_slider]
            update_xyz_nums(vals.show_window_elt_id, prev_xyz) //restore old numbers
            return
        }
        update_xyz_circle(vals.show_window_elt_id, xyz)
        update_range_and_angle_nums(vals.show_window_elt_id, maj_angles)
    }
    else if(vals.clicked_button_value.endsWith("_range")){ //a joint slider
        maj_angles = [vals.j1_range, vals.j2_range, vals.j3_range, vals.j4_range,
            vals.j5_range, vals.j6_range, vals.j7_range]

        //selector_set_in_ui("#" + vals.show_window_elt_id + " [name=j1_range] [style] [width]", "75px")
        let joint_number = parseInt(vals.clicked_button_value[1]) // 1 thru 5
        let angle = maj_angles[joint_number - 1]
        let angle_num_name = "j" + joint_number + "_angle_num"
        let num_selector = "#" + vals.show_window_elt_id + " " +
            "[name=" + angle_num_name + "]" + " " +
            "[value]"
        selector_set_in_ui(num_selector, angle)
        let xyz = Kin.J_angles_to_xyz(maj_angles)[0]
        update_xyz_nums(vals.show_window_elt_id, xyz)
        update_xyz_circle(vals.show_window_elt_id, xyz)

    }
    else if(vals.clicked_button_value.endsWith("_angle_num")){ /// the num input for a joint angle
        let val = vals[vals.clicked_button_value]
        let joint_number = vals.clicked_button_value[1]
        let range_name = "j" + joint_number + "_range"
        let selector = "#" + vals.show_window_elt_id + " [name=" + range_name + "] [value]"
        selector_set_in_ui(selector, val)
        maj_angles = [vals.j1_angle_num, vals.j2_angle_num, vals.j3_angle_num, vals.j4_angle_num,
            vals.j5_angle_num, vals.j6_angle_num, vals.j7_angle_num]
        out("computed maj_angles in _angle_numb of: " + maj_angles)
        let xyz = Kin.J_angles_to_xyz(maj_angles)[0]
        update_xyz_nums(vals.show_window_elt_id, xyz)
        update_xyz_circle(vals.show_window_elt_id, xyz)

    }
    let instr = Dexter.move_all_joints(maj_angles)
    Job.insert_instruction(instr, {job: vals.job_name, offset: "end"})
    out("inserted instr: " + instr)
}

//_______update UI fns_______
function update_from_robot(dex, sw_elt_id){
    //let dex = default_robot()
    let rs = dex.robot_status
    let RS_inst = new RobotStatus(rs)
    let maj_angles = RS_inst.measured_angles()
    let xyz = Kin.J_angles_to_xyz(maj_angles)[0]
    update_range_and_angle_nums(sw_elt_id, maj_angles)
    update_xyz_nums(sw_elt_id, xyz)
    update_xyz_circle(sw_elt_id, xyz)
}
function update_range_and_angle_nums(sw_elt_id, maj_angles){
    for(let joint_number = 1; joint_number < 6; joint_number++){
        let angle = maj_angles[joint_number - 1] //j1 thru 5 are in index 0 thru 4
        selector_set_in_ui("#" + sw_elt_id + " [name=j" + joint_number + "_range] [value]",
            angle)
        selector_set_in_ui("#" + sw_elt_id + " [name=j" + joint_number + "_angle_num] [value]",
            angle)
    }
}

//x,y,z in meters
function update_xyz_nums(sw_elt_id, xyz){
    selector_set_in_ui("#" + sw_elt_id + " [name=x_num] [value]", xyz[0])
    selector_set_in_ui("#" + sw_elt_id + " [name=y_num] [value]", xyz[1])
    selector_set_in_ui("#" + sw_elt_id + " [name=z_num] [value]", xyz[2])
}

//x,y,z in meters
function update_xyz_circle(sw_elt_id, xyz){
    let x_px = meters_to_x_px(xyz[0])
    let y_px = meters_to_x_px(xyz[1])
    //let z_px = meters_to_x_px(xyz[2]) //don't do as range slider has its min and max
    selector_set_in_ui("#" + sw_elt_id + " [id=xy_2d_slider] [cx]", x_px)
    selector_set_in_ui("#" + sw_elt_id + " [id=xy_2d_slider] [cy]", y_px)
    selector_set_in_ui("#" + sw_elt_id + " [name=z_slider] [value]", xyz[2])
}

new Job({
    name: "dexter_user_interface2",
    when_stopped: "wait",
    do_list: [init_dui]})