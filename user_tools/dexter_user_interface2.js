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
        else {
            let new_angle_array = []
            for(let i = 0; i < angle_array.length; i++){
                let ang = angle_array[i]
                if (similar(ang, 0, Number.EPSILON)) {
                    ang = 0
                }
                else if (ang == 89.999999999999) { //similar(ang, 90, Number.EPSILON * 2)) {
                    ang = 90
                }
                new_angle_array.push(ang)
            }
            return new_angle_array
        }
    }

    //should be the ONLY way to set this.maj_angles
    //maj_angles can be less than 7.
    // If so and existing this.maj_angles has that angle, default to it,
    // else default-default to 0.
    // When done the this.maj_angles will be 7 long
    set_maj_angles(maj_angles){
        if(!this.maj_angles) { this.maj_angles = [] }
        let new_angles = []
        let existing_maj_angles_length = this.maj_angles.length
        for(let j = 0; j < 7; j++) {
            let val
            if(j >= maj_angles.length) {
                if(j >= existing_maj_angles_length) { val = 0 }
                else { val = this.maj_angles[j] }
            }
            else { val = maj_angles[j] }
            new_angles.push(val)
        }
        this.maj_angles = dui2.fix_angles(new_angles)
    }

    static make_job(explicity_start_job=false){
        let dex = (window.default_robot ? default_robot() : Dexter.dexter0)
        let name = ((platform === "dde") ? "dui2_for_" + dex.name : "dexter_user_interface2") //the job engine Job name must match the file name (sans .js")
        if (Job[name] && Job[name].is_active()) { //we're redefining the job so we want to make sure the
            //previous version is stopped first
            if (Job[name].robot instanceof Dexter) {Job[name].robot.empty_instruction_queue_now() }
            Job[name].stop_for_reason("interrupted", "User is redefining this job.")
            setTimeout(function(){ dui2.make_job(true) }, 200)
        }
        else { //hits when job is undefined, or is defined but not active.
               //if job is defined but not active, it will be redefined,
               //with a new job_id. This should be fine.
            let new_job = new Job({
                            name: name,
                            robot: dex,
                            when_stopped: "wait",
                            do_list: [dui2.init,
                                      Dexter.move_all_joints(0, 0, 0, 90, 0, 0, 0)
                                      ]
                        })
           // dex.instruction_callback = this.dui_instruction_callback //used for "run_forward" , complicated to get this to work so now run_forward does something simpler
            if(explicity_start_job) {
                new_job.start()
            }
        }
    }
    static show_window_elt_id_to_dui_instance(sw_elt_id){
        for(let inst of this.instances) {
            if(inst.show_window_elt_id === sw_elt_id) {
                return inst
            }
        }
        shouldnt("sw_elt_id_to_dui_instance could not find instance for: " + sw_elt_id)
    }

    static dui_instance_to_show_window_elt(dui_instance){
        return window[dui_instance.show_window_elt_id]
    }

    static dui_instance_under_mouse(){
        let elts = elements_under_mouse()
        for(let dui_instance of dui2.instances){
            let dui_elt = this.dui_instance_to_show_window_elt(dui_instance)
            if(elts.includes(dui_elt)) {
                return this.show_window_elt_id_to_dui_instance(dui_elt.id)
            }
        }
        return null
    }

    static init(xy_width_in_px = 300){
        open_doc(dexter_user_interface_doc_id)
        if((platform == "dde") &&
            !window.sim_graphics_pane_id) {
            misc_pane_menu_changed("Simulate Dexter") //changes Misc pane to sim. Preserves pose of Dexter.
        }
        let dui_instance = new dui2()
        dui_instance.job_name = this.name
        dui_instance.dexter_instance = this.robot
        dui_instance.should_point_down = true //the checkbox is in sync with this.
        dui_instance.xy_width_in_px = xy_width_in_px
        //we want to map 0 to 300 into roughly -0.7 to 0.7   where 150 -> 0, 0 -> -0.7, 300 -> 0.7
        let half_xy_width_in_px = xy_width_in_px / 2
        let angles_for_min_x = [-90, 90, 0, -90, 0]  //means pointing out.
        let min_x = Kin.J_angles_to_xyz(angles_for_min_x)[0][0] //probably -0.7334... meters
        let max_x = min_x * -1
        let half_max_x = (max_x / 2)
        let max_x_range = max_x * 2
        let factor_to_multiply_x_px_by = max_x_range / xy_width_in_px
        dui_instance.x_px_to_meters = //function(x_px) { return (x_px * factor_to_multiply_x_px_by) - max_x}
            function(x_px) {
              return ((x_px - half_xy_width_in_px) * factor_to_multiply_x_px_by)//  * -1)
            }
        dui_instance.y_px_to_meters = //function(y_px) { return (x_px * factor_to_multiply_x_px_by) - max_x}
            function(y_px) { return ((y_px - half_xy_width_in_px) * factor_to_multiply_x_px_by * -1)}
        dui_instance.meters_to_x_px = function(meters) {
            let scaled = ((meters
                  //* -1
                  ) / factor_to_multiply_x_px_by) + half_xy_width_in_px //0 to 300
            //out("scaled: " + scaled)
            //let reversed = xy_width_in_px - scaled
            //out("reversed: " + reversed)
            return scaled //reversed
        } //returns 0 to 300
        dui_instance.meters_to_y_px = function(meters) {
            return ((meters * -1) / factor_to_multiply_x_px_by) + half_xy_width_in_px
        }

        dui_instance.radius_meters_to_px = function(radius_meters){
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
        dui_instance.z_px_to_meters = function(z_pix)  { return z_pix / xy_width_in_px }
        dui_instance.meters_to_z_px = function(meters) { return meters * xy_width_in_px }


        show_window({title: "Dexter." + dui_instance.dexter_instance.name + " User Interface",
            width: xy_width_in_px + 80, //380,
            height: xy_width_in_px + 333, //570,
            x: 320,
            y: 0,
            background_color: "#d5d5d5",
            job_name: this.name, //important to sync the correct job.
            callback: "dui2.dexter_user_interface_cb",
            content:
            '<span style="margin-top:0px;padding:2px;">Move Dexter to:</span>' +
            `<input type="button" name="ready"  style="margin-left:10px;margin-top:0px;margin-bottom:3px; padding:2px;" value="ready"  title="Move Dexter to a neutal position.&#013;Good for 'elbow room'."/>` +
            `<input type="button" name="home"   style="margin-left:10px;margin-top:0px;margin-bottom:3px; padding:2px;" value="home"   title="Move Dexter straight up.&#013;This doesn't allow much freedom of motion."/>` +
            "<span name='step_arrow_buttons'>" + //needed by tutorial
            `<span  class="clickable" name="go_to_start"   style="font-size: 24px; margin-left: 5px; cursor: pointer; color: rgb(0, 200, 0); vertical-align:bottom;" title="Move cursor to before the first instruction&#013;of its containing do_list.">◀</span>` +
            `<span  class="clickable" name="step_backward" style="font-size: 18px; margin-left: 5px; cursor: pointer; color: rgb(0, 200, 0); vertical-align:-10%;"   title="Step and execute the instruction before the selection&#013;or, if none, the cursor&#013;in the Job defined in the editor.">◀</span>` +
            `<span  class="clickable" name="step_forward"  style="font-size: 18px; margin-left: 5px; cursor: pointer; color: rgb(0, 200, 0); vertical-align:-10%;"   title="Step through the instruction after the selection&#013;or, if none, the cursor&#013;in the Job defined in the editor.">▶</span>` +
            `<span  class="clickable" name="run_forward"   style="font-size: 24px; margin-left: 5px; cursor: pointer; color: rgb(0, 200, 0); vertical-align:-10%;"   title="Run the instructions &#013;from the cursor through the end.">▶</span>` +
            "</span>" +
            dui_instance.make_xyz_sliders_html(xy_width_in_px,
                min_x, max_x,
                //min_y, max_y are same as min_x, max_x, so don't pass them.
                min_z, max_z) +
            "<br/>" +
            dui_instance.make_joint_sliders_html() +
            dui_instance.make_direction_html() +
            "<hr style='height:1px; color:black; background-color:black; margin:0px; padding:0px;'/>" +
            dui_instance.make_insert_html()
        })
        setTimeout(function() {
                dui_instance.show_window_elt_id = "show_window_" + SW.window_index + "_id"
                let sw_elt = window[dui_instance.show_window_elt_id]
                sw_elt.classList.add("dui_dialog")
                let RS_inst = dui_instance.dexter_instance.rs //new RobotStatus(rs)
                dui_instance.set_maj_angles(RS_inst.measured_angles(7)) //returns a copy of the array so safe to change it.
                dui_instance.update_all(dui_instance.should_point_down) //true means IFF maj_angles is pointing down, set the checkbox to point down.
                //dui2.init_is_mouse_over(dui_instance)
            },
            300)
    }

    /*static init_is_mouse_over(dui_instance){
        let dom_elt = window[dui_instance.show_window_elt_id]
        dui_instance.is_mouse_over = true
        dom_elt.onmouseover = function(event){
            let x = event.clientX
            let y = event.clientY
            dui_instance.is_mouse_over = true
            out("is_mouse_over: " + dui_instance.is_mouse_over)
        };
        dom_elt.onmouseout = function(event){
            dui_instance.is_mouse_over = false
            out("is_mouse_over: " + dui_instance.is_mouse_over)
        }
    }*/



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
       // out("\ntop of make_xyz_sliders_html with xy_width_in_px: " + xy_width_in_px +
       //     " min_x:" +  min_x +
       //     " max_x:" +  max_x +
       //     " min_z:" +  min_z +
       //     " max_z:" +  max_z )
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
            //'<div style="display:inline-block;vertical-align:900%;">
            '<br/><b style="margin-right:5px; vertical-align:850%;">Y</b>' +
            //'</div>' +
            '<svg style="display:inline-block; border:2px solid black;background-color:' + dui2.xy_background_color + ';margin-bottom:0px;" ' +
            'width="'  + xy_width_in_px + 'px" ' +
            'height="' + xy_width_in_px + 'px" ' +
            '>' +
            outer_circle_html +
            inner_circle_html +
            xy_loc_circle_html +
            '</svg>'
        let z_slider_html =
            '<div style="border:4px solid ' + dui2.xy_background_color + '; display:inline-block; margin:0px; background-color:white; transform-origin:' + (xy_width_in_px / 2) + 'px; transform: translate(185px, -170px) rotate(-90deg);">' +
            '<input type="range" name="z_slider" step="0.01" value="0" min="0" max="' + max_z + '" data-oninput="true" ' +
            'style="width:' + xy_width_in_px + 'px; height:20px;margin:0px;' +
            '"/>' +
            '</div>'
        let xyz_num_html =
            'X: <input name="x_num" type="number" data-oninput="true" style="width:55px;margin-top:0px;" min="' + min_x + '" max="' + max_x + '" value="0" step="0.01" ' + '"/><span style="margin-right:15px;margin-top:0px;">m</span>' +
            'Y: <input name="y_num" type="number" data-oninput="true" style="width:55px;margin-top:0px;" min="' + min_x + '" max="' + max_x + '" value="0" step="0.01" ' + '"/><span style="margin-right:15px;margin-top:0px;">m</span>' +
            'Z: <input name="z_num" type="number" data-oninput="true" style="width:55px;margin-top:0px;" min="' + min_z + '" max="' + max_z + '" value="0" step="0.01" ' + '"/>m'

        let z_slider_restriction_html = '<div style="position:absolute; top:60px; right:25px; width:20px; height:40px; background-color:' + dui2.xy_background_color + ';"></div>'
        let the_html =
            svg_html +
            "<b style='vertical-align:top;margin-left:15px;'>Z</b>" + z_slider_html +
            //z_slider_restriction_html +
            '<div style="display:inline; position:absolute; margin-top:10px;margin-bottom:0px;left:167px;top:365px;"><b>X</b>' +
            '</div><br/>' +
               xyz_num_html
        return the_html
    }

    make_joint_sliders_html(){
       // out("top of make_joint_sliders_html with dex: " + dex)
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
        let checked_val = (this.should_point_down ? ' checked="checked" ' : "")
        let result =  '<div>Direction: <span class="direction">' +
                       JSON.stringify(dir) +
                       '</span> ' +
                       '<input type="checkbox"' + checked_val + 'name="direction_checkbox" data-onchange="true" style="margin-left:20px;"/> Point Down </div>' //checked by default
        return result
    }

    make_insert_html(){
        if(platform === "dde"){
            let insert_html = "Insert: " +
                              ' <select id="dui_instr_type_id" title="The type of instruction to insert." data-oninput="true">' +
                               '<option>move_all_joints</option>' +
                               '<option>pid_move_all_joints</option>' +
                               '<option>move_to</option>' +
                               '<option>pid_move_to</option></select>' +
                `<input type="button" name="insert_job"         value="job"         style="margin-left:15px" title="Insert into the editor&#013;a Job definition with an instruction&#013;of the current location.&#013;Do before 'insert instruction'."/>` +
                `<input type="button" name="insert_instruction" value="instruction" style="margin-left:15px" title="Insert into the editor&#013;an instruction of the current location.&#013;Do after 'insert job'."/>`
            return insert_html
        }
        else { return "" }
    }

    //unnecessary, use the dui_instance.direction
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

     //unnecessary, use the dui_instance.should_point_down
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

//strategy: convert the changed values into maj_angles, set dui_instance.maj_angles and, at the end,
// call update_all once regardless of who started it.
static dexter_user_interface_cb(vals){
    //out("dui_cb got clicked_button_value: " + vals.clicked_button_value +
    //    " which has val: " + vals[vals.clicked_button_value])
    let dui_instance = dui2.show_window_elt_id_to_dui_instance(vals.show_window_elt_id)
    //inspect(dui2.dui_instance_under_mouse())
    if(vals.clicked_button_value == "close_button"){
        let inst_index = dui2.instances.indexOf(dui_instance)
        if(inst_index == -1) { shouldnt("in dexter_user_interface_cb with close_button") }
        else { dui2.instances.splice(inst_index, 1) } //cut out the instance from the instances list
        return
    }
    else if(["xy_2d_slider", "z_slider"].includes(vals.clicked_button_value)){
        let cir_xy_obj = vals.xy_2d_slider
        //out(JSON.stringify(cir_xy_obj))
        let x = parseFloat(cir_xy_obj.cx)
        x = dui_instance.x_px_to_meters(x)
        let y = parseFloat(cir_xy_obj.cy) //a num between 0 and 300
        //out("got cy of: " + y)
        y = dui_instance.y_px_to_meters(y)
        let z = vals.z_slider
        let [inner_r, outer_r, outer_circle_center_xy] = Kin.xy_donut_slice_approx(z, dui_instance.direction)
        let new_xy_radius = Math.hypot(x, y)
        if((new_xy_radius < inner_r) ||
           (new_xy_radius > outer_r)){ //the new x and y are out of range. do nothing
             //don't print warning message, just refresh display by calling update_all way below
        }
        else {
            let xyz = [x, y, z]
            try {
                let j_angles = Kin.xyz_to_J_angles(xyz, dui_instance.direction) //returns just 5 angles
                //out("j_angles " + j_angles)
                if(j_angles.length === 5) { j_angles.push(vals.j6_angle_num)   }
                if(j_angles.length === 6) { j_angles.push(vals.j7_angle_num)   }
                dui_instance.set_maj_angles(j_angles)
            }
            catch(err) { //with the above test for new_xy_radius, this catch should never hit.
                if(vals.clicked_button_value === "z_slider"){
                    warning("Sorry, Dexter can't go to Z position: " + z +
                        " given X position: " + x +
                        " and Y position: " + y)
                }
                else {
                    warning("Sorry, Dexter can't go to X position: " + x +
                        " and/or Y position: " + y +
                        " given Z position: " + z)
                }
                return
            }
        }
        //dui2.update_xyz_nums(vals.show_window_elt_id, xyz)
        //dui2.update_range_and_angle_nums(vals.show_window_elt_id, maj_angles)
    }
    else if(vals.clicked_button_value.endsWith("_num") &&  //x_num, y_num, z_num the typein boxes
        !vals.clicked_button_value.endsWith("_angle_num")){ //an x,y,or z number input
        let x = vals.x_num
        let y = vals.y_num
        let z = vals.z_num
        let xyz = [x, y, z]
        let [inner_r, outer_r, outer_circle_center_xy] = Kin.xy_donut_slice_approx(z, dui_instance.direction)
        let new_xy_radius = Math.hypot(x, y)
        if((new_xy_radius < inner_r) ||
            (new_xy_radius > outer_r)){ //the new x and y are out of range. do nothing
            //don't print warning message, just refresh display by calling update_all way below
        }
        else {
            try {
                let j_angles = Kin.xyz_to_J_angles(xyz, dui_instance.direction) //returns just 5 angles
                if(j_angles.length === 5) { j_angles.push(vals.j6_angle_num)   }
                if(j_angles.length === 6) { j_angles.push(vals.j7_angle_num)   }
                dui_instance.set_maj_angles(j_angles)
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
                return
            }
        }
        //dui2.update_xyz_circle(vals.show_window_elt_id, xyz)
        //dui2.update_range_and_angle_nums(vals.show_window_elt_id, maj_angles)
    }
    else if(vals.clicked_button_value == "ready"){
        dui_instance.set_maj_angles([0, 0, 90, 0, 0, 0, 0])
    }
    else if(vals.clicked_button_value == "home"){
        dui_instance.set_maj_angles([0, 0, 0, 0, 0, 0, 0])
    }
    else if(vals.clicked_button_value == "go_to_start"){
            let continue_running = dui2.go_to_start_button_click_action(dui_instance)
            if(!continue_running) { return }
    }
    else if(vals.clicked_button_value == "step_backward"){
        let continue_running = dui2.step_backward_button_click_action(dui_instance)
        if(!continue_running) { return }
    }
    else if(vals.clicked_button_value == "step_forward"){
        let continue_running = dui2.step_forward_button_click_action(dui_instance)
        if(!continue_running) { return } //either a bad instruction or not a maj or mt instruction so stop processing here
       /* let full_src  = Editor.get_javascript()
        let start_pos = Editor.selection_start()
        let start_char = full_src[start_pos]
        if((start_char == "\n") && (start_pos > 0)) { //treat clicking on the end of a line, as if
            //its really IN the line, not the next line or in between
            start_pos -= 1
            start_char = full_src[start_pos]
        }
        if(start_pos == (full_src.length - 1)) { return } //at end of buffer, so no expression
        let prev_newline_pos = full_src.lastIndexOf("\n", start_pos)
        if (prev_newline_pos == -1) { prev_newline_pos = 0 } //an aproximation! start_pos is on first line
        let next_newline_pos = full_src.indexOf("\n", start_pos)
        let open_paren_pos   = full_src.indexOf("(", prev_newline_pos)
        if(open_paren_pos === -1) { return } //no instruction
        if(open_paren_pos > next_newline_pos) { return } //no instr starting on the same line as prev_newline_pos
        let expr_start_pos   = Editor.skip_forward_over_whitespace(full_src, prev_newline_pos)

        let close_paren_pos = Editor.find_matching_delimiter(full_src, open_paren_pos)
        if(!close_paren_pos) { return } //no close paren so no expression.
        let maj_pos = full_src.indexOf("move_all_joints(", expr_start_pos)
        if(maj_pos > next_newline_pos) { maj_pos = -1 } //too far away
        let mt_pos  = full_src.indexOf("move_to(", expr_start_pos)
        if(mt_pos > next_newline_pos) { mt_pos = -1 } //too far away

        let instr_type = null //means no valid instruction
        if(maj_pos == -1) {
            if(mt_pos > -1) { instr_type = "mt" }
        }
        else { instr_type = "maj" }
        if(!instr_type) { return } //didn't get an maj or mt instruction
        else { //good to go!
            let instr_src = full_src.substring(expr_start_pos, close_paren_pos + 1)
            let instr_obj
            let angles
            try{
                instr_obj = eval(instr_src)
            }
            catch(err) { return } //invalid instruction so just ignore it
            if((instr_obj instanceof Instruction.Dexter.move_all_joints) ||
                (instr_obj instanceof Instruction.Dexter.pid_move_all_joints)){
                angles = instr_obj.array_of_angles
            }
            else if ((instr_obj instanceof Instruction.Dexter.move_to) ||
                     (instr_obj instanceof Instruction.Dexter.pid_move_to)) {
                angles = Kin.xyz_to_J_angles(instr_obj.xyz, instr_obj.J5_direction,
                                             instr_obj.config, instr_obj.workspace_pos)
            }
            else{ return } //not one of the instructtion we need
            Editor.select_javascript(expr_start_pos, close_paren_pos + 1)
            dui_instance.set_maj_angles(angles)
            */
    }

    else if(vals.clicked_button_value == "run_forward"){
        let continue_running
        for(var i = 0; i < 100000; i++){
            continue_running = dui2.step_forward_button_click_action(dui_instance) //dui2.run_forward_button_click_action(dui_instance)
            if(!continue_running) { return } //error in processing next instr, perhaps syntactic, perhaps already did last instruction
            else if (continue_running == "already_inserted_instruction"){ //instruction was a valid instr but not a move instruction
            }
            else { //got a move instruction, keep going to bottom of this method for the instruction selection and insertion
                dui_instance.update_all(dui_instance.should_point_down) // do update_all before move_all_joints because update_all may modify ui2_instance.maj_angles if the direction_checkbox is checked
                let instr = Dexter.pid_move_all_joints(dui_instance.maj_angles)
                Job.insert_instruction(instr, {job: vals.job_name, offset: "end"})
            }
        }
        //let show_win_elt = window[vals.show_window_elt_id]
        //show_win_elt.focus()  //so that is_dui_the_focus will work after setting the selection.
                              //is_dui_the_focus needed by dui_instruction_callback
        return
    }
    else if(vals.clicked_button_value.endsWith("_range")){ //a joint slider
        dui_instance.set_maj_angles([vals.j1_range, vals.j2_range, vals.j3_range, vals.j4_range,
            vals.j5_range, vals.j6_range, vals.j7_range])

    }
    else if(vals.clicked_button_value.endsWith("_angle_num")){ /// the num input for a joint angle
        dui_instance.set_maj_angles([vals.j1_angle_num, vals.j2_angle_num, vals.j3_angle_num, vals.j4_angle_num,
                                      vals.j5_angle_num, vals.j6_angle_num, vals.j7_angle_num])
    }
    else if(vals.clicked_button_value == "direction_checkbox"){
        dui_instance.should_point_down = vals.direction_checkbox
        dui_instance.set_maj_angles([vals.j1_angle_num, vals.j2_angle_num, vals.j3_angle_num, vals.j4_angle_num,
                                      vals.j5_angle_num, vals.j6_angle_num, vals.j7_angle_num])  //no actual change here, but just to ensure consistency
    }
    else if(vals.clicked_button_value == "dui_instr_type_id"){
        dui_instance.update_editor_maybe()
    }
    else if (vals.clicked_button_value == "insert_instruction"){
        let full_src      = Editor.get_javascript()
        let start_pos     = Editor.selection_start()
        let start_char    = full_src[start_pos]
        let end_pos       = Editor.selection_end()
        let has_selection = (start_pos !== end_pos)
        let prev_newline_pos = full_src.lastIndexOf("\n", start_pos)
        let prefix_sans_comma
        let needs_comma_before_insert = dui2.needs_comma_before_insert(full_src, end_pos)

        let end_char = full_src[end_pos]
        let end_char_is_comma = (end_char == ",")
        let prev_end_char = ((end_pos == 0) ? null : full_src[end_pos - 1])
        let first_back_non_whitespace_from_start_pos = Editor.backup_over_whitespace(full_src, start_pos - 1)

        let insert_before_start_pos
        if(has_selection)       { insert_before_start_pos = false }
        else if(start_pos == 0) { insert_before_start_pos = true }
        else if(start_char == "\n") { insert_before_start_pos = false }
        else {
            if(first_back_non_whitespace_from_start_pos == null) { //no whitespace before start_pos, but not at 0
                insert_before_start_pos = false
            }
            else if(start_char == "\n") { insert_before_start_pos = false }
            else if (first_back_non_whitespace_from_start_pos < prev_newline_pos){ //between start_pos and the
                 //back newline, there is only whitespace, so we've clicked on the same line as an item,
                 //but before its actual text, so we want to insert before start_pos on that same line.
                insert_before_start_pos = true
            }
            else { insert_before_start_pos = false }
        }
        if(insert_before_start_pos) {
            if(start_pos == 0) {//leave sel where it is
                Editor.select_javascript(0, 0)
                needs_comma_before_insert = false
                prefix_sans_comma = "\n        "
            }
            else {
                //let first_back_non_whitespace_char = full_src[first_back_non_whitespace_from_start_pos]
                Editor.select_javascript(prev_newline_pos, prev_newline_pos)
                needs_comma_before_insert = false
                prefix_sans_comma = "\n        "
            }
        }
        else if(end_char_is_comma) {
            Editor.select_javascript(end_pos + 1, end_pos + 1)
            needs_comma_before_insert = false
            prefix_sans_comma = "\n        "
        }
        else if(prev_end_char == "[") { //end_char is probably just after the [ that begins the do_list
            needs_comma_before_insert = false
            Editor.select_javascript(end_pos, end_pos)
            prefix_sans_comma = "\n        "
        }
        else if(prev_end_char == ",") { //end_char is probably just after the [ that begins the do_list
            needs_comma_before_insert = false
            Editor.select_javascript(end_pos, end_pos)
            prefix_sans_comma = "\n        "
        }
        else {
            Editor.select_javascript(end_pos, end_pos)
            needs_comma_before_insert = true
            prefix_sans_comma = "\n        "
        }

        let prefix = (needs_comma_before_insert ? "," : "") + prefix_sans_comma
        let instr_src = dui_instance.make_instruction_source()
        let on_last_instr = dui2.is_on_last_instruction(full_src, end_pos)
        let total_insert = prefix + instr_src + (on_last_instr ? "" : ",")
        Editor.insert(total_insert)
        //let new_start_pos = end_pos + prefix.length //+ (on_last_instr? 0 : 1)
        //let new_end_pos = new_start_pos + instr_src.length
        full_src = Editor.get_javascript()
        let new_start_open_paren_pos =  //get past comma on prev line if any and to new first open paran
                           full_src.indexOf("(", end_pos)
        let new_start_pos = Editor.backup_to_whitespace(full_src, new_start_open_paren_pos)
        let new_end_pos   = Editor.find_matching_delimiter(full_src, new_start_open_paren_pos) + 1
        Editor.select_javascript(new_start_pos, new_end_pos)
        return
    }
    else if (vals.clicked_button_value == "insert_job"){
        let job_prefix_src =
`\nnew Job({
    name: "my_job",
    do_list: [
        `
        let instr_src = dui_instance.make_instruction_source()
        let job_src = job_prefix_src + instr_src + '\n]})\n'
        let cur_pos = Editor.selection_start()
        Editor.insert(job_src)
        let inst_start_pos = cur_pos + job_prefix_src.length
        let inst_end_pos = inst_start_pos + instr_src.length
         //end of job def, now back up to start of where next instruction should be inserted.
        Editor.select_javascript(inst_start_pos, inst_end_pos)
        return
    }
    else if (vals.clicked_button_value == "close_button"){
        let job_instance = Job[vals.job_name]
        if(job_instance){
            if(job_instance.is_active()){
                job_instance.stop_for_reason("interrupted", "User closed dui show_window.")
                setTimeout(function() {
                    job_instance.undefine_job()
                }, 200)
            }
            else {
                job_instance.undefine_job()
            }
        }
        return
    }
    dui_instance.update_all(dui_instance.should_point_down) // do update_all before move_all_joints because update_all may modify ui2_instance.maj_angles if the direction_checkbox is checked
    let instr = Dexter.pid_move_all_joints(dui_instance.maj_angles)
    Job.insert_instruction(instr, {job: vals.job_name, offset: "end"})
    //out("inserted instr: " + instr)
}

   //called from Job.go with dui2.instances guarenteed to be non-empty
   /*static go_button_click_action(){
       let dui_instance = last(dui.instances)
       if(pause_id.checked) {
           let start_pos = Editor.selection_start()
           let end_pos   = Editor.selection_end()
           let full_src  = Editor.get_javascript()
           if(start_pos != end_pos) { //selection so do the NEXT instruction
              let new_start_pos = Editor.find_forward_whitespace(full_src, end_pos)
               Editor.select_javascript(new_start_pos, new_start_pos) //and now just use
               //the dui2.editor_button_click_action as is.
           }
           let continue_running = dui2.editor_button_click_action(dui_instance)
           if(!continue_running) { return }
           else {
               dui_instance.update_all(dui_instance.should_point_down) // do update_all before move_all_joints because update_all may modify ui2_instance.maj_angles if the direction_checkbox is checked
               let instr = Dexter.pid_move_all_joints(dui_instance.maj_angles)
               Job.insert_instruction(instr, {job: dui_instance.job_name, offset: "end"})
           }
       }
   }*/

   //returns null if there's an error or already did last instruction
   //returns true if insructiom is a move instruction and we should let dexter_user_interface_cb
   //    code at its bottom handle the selection and insertion
   //returns "already_inserted_instruction" if the instruction was ok, its src selected,
   //    and we inserted it into the job.
   static step_forward_button_click_action(dui_instance) {
       let full_src  = Editor.get_javascript()
       let start_pos = Editor.selection_start()
       let end_pos   = Editor.selection_end()
       let look_for_instr_starting_at_pos = end_pos
       if(start_pos !== end_pos) { //got a selection. Presume its of a whole instruction
       //start at the end_pos, then forward over the next newline
           //full_src[look_for_instruction_starting_at_pos] == ";"
           //look_for_instruction_starting_at_pos += 1
           look_for_instr_starting_at_pos = full_src.indexOf("\n", look_for_instr_starting_at_pos)
           if(look_for_instr_starting_at_pos === -1) { return null} //no more instructions
           else {look_for_instr_starting_at_pos += 1 }  //get passed the newline
       }
       let start_and_end_array = Editor.start_and_end_of_instruction_on_line(full_src, look_for_instr_starting_at_pos)
       if(start_and_end_array == null) { return null } //no instruction on current line.
       let instr_src = full_src.substring(start_and_end_array[0], start_and_end_array[1])
       if(instr_src.startsWith("function(")) {
           instr_src = "(" + instr_src + ")"
       }
       let instr_obj
       try{
           instr_obj = eval(instr_src)
       }
       catch(err) {
            warning("Evaling: " + instr_src + " errored with:<br/>" + err.message)
            return null
       } //invalid instruction so just ignore it
       let angles
       let instr_type = null
       if((instr_obj instanceof Instruction.Dexter.move_all_joints) ||
           (instr_obj instanceof Instruction.Dexter.pid_move_all_joints)){
           angles = instr_obj.array_of_angles
           instr_type = "maj"
       }
       else if ((instr_obj instanceof Instruction.Dexter.move_to) ||
           (instr_obj instanceof Instruction.Dexter.pid_move_to)) {
           angles = Kin.xyz_to_J_angles(instr_obj.xyz, instr_obj.J5_direction,
                                        instr_obj.config, instr_obj.workspace_pos)
           instr_type = "maj"
       }
       Editor.select_javascript(start_and_end_array[0], start_and_end_array[1])
       if(angles) {
            dui_instance.set_maj_angles(angles)
            return true //continue running in
       }
       else { //we just have a non-mt or maj instruction which we should run anyway.
           Job.insert_instruction(instr_obj, {job: dui_instance.job_name, offset: "end"})
           return "already_inserted_instruction"
       }
   }

   static dui_instruction_callback(job_instance){
       let is_dui_on_top = dui2.is_dui_the_focus()
       job_instance.set_up_next_do()
   }

   static is_dui_the_focus() {
      let focus_elt =  document.activeElement
      let par = focus_elt.closest(".show_window")
      if(par) {
          return true
      }
      else { return false }
   }

   //maybe unused
   static is_on_last_instruction(full_src, end_pos) {
        let close_angle_pos = full_src.indexOf("]})", end_pos)
        let open_paren_pos  = full_src.indexOf("(",   end_pos)
        if(close_angle_pos == -1) { //not well formed situation but
           return false
        }
        else if (open_paren_pos == -1){ //no more open parens after end_pos, so
            return true
        }
        else if(open_paren_pos < close_angle_pos) {
            return false
        }
        else { return true }
   }

  /* not now debugged or used as isn't needed by
  step_backward_button_click_action but might come in handy
      static is_before_first_instruction(full_src, pos){
       let first_non_whitespace_pos = Editor.backup_over_whitespace(full_src, pos)
       let first_non_whitespace_char = full_src[first_non_whitespace_pos]
       if(first_non_whitespace_char == "[" &&
           (first_non_whitespace_pos >= 10)) {
           let more_back_pos = Editor.backup_over_whitespace(full_src, first_non_whitespace_pos - 1)
           let more_back_char = full_src[more_back_pos]
           if(more_back_char == ":") {
               if(Editor.endsWith("do_list:", more_back_pos + 1)) {
                   return true
               }
           }
       }
       else { return false }
   }*/

    static go_to_start_button_click_action(dui_instance) {
        let full_src  = Editor.get_javascript()
        let start_pos = Editor.selection_start()
        let do_list_pos = full_src.lastIndexOf("do_list:", start_pos)
        if(do_list_pos === -1) {
           warning("Could not find the beginning of the do_list.")
           return null
        }
        else {
            let past_do_list_pos = do_list_pos + 8
            let next_newline_pos = full_src.indexOf("\n", past_do_list_pos)
            let next_square_bracket_pos = full_src.indexOf("[", past_do_list_pos)
            let before_first_instr_pos
            if ((next_square_bracket_pos == -1) || (next_square_bracket_pos > next_newline_pos)){
                before_first_instr_pos = past_do_list_pos
            }
            else {
                before_first_instr_pos = next_square_bracket_pos + 1
            }
            Editor.select_javascript(before_first_instr_pos, before_first_instr_pos)
            return true
        }
    }

   static step_backward_button_click_action(dui_instance) {
        let full_src  = Editor.get_javascript()
        let start_pos = Editor.selection_start()
        //if(is_before_first_instruction(full_src, pos)) { return null }
        let prev_newline_pos = full_src.lastIndexOf("\n", start_pos)
        if(prev_newline_pos === -1) {return null} //no more instructions backward
        let prev_prev_newline_pos = full_src.lastIndexOf("\n", prev_newline_pos - 1)
        if(prev_prev_newline_pos === -1) {return null} //no more instructions backward
        let the_line_text = full_src.substring(prev_prev_newline_pos, prev_newline_pos)
        if (is_whitespace(the_line_text)) { //got a blank line
            Editor.select_javascript(prev_prev_newline_pos, prev_prev_newline_pos)
            return this.step_backward_button_click_action(dui_instance)
        }
        let do_list_pos = full_src.lastIndexOf("do_list:", start_pos)
        if(do_list_pos > prev_prev_newline_pos) {
            warning("you're already at the first instruction of the Job.")
            return null
        }

        else {
            let first_non_whitespace_pos = Editor.skip_forward_over_whitespace(full_src, prev_prev_newline_pos)
            if(full_src.startsWith("//", first_non_whitespace_pos)) {
                Editor.select_javascript(prev_prev_newline_pos, prev_prev_newline_pos)
                return this.step_backward_button_click_action(dui_instance)
            }
            else if(full_src.startsWith("/*", first_non_whitespace_pos)) {
                Editor.select_javascript(first_non_whitespace_pos, first_non_whitespace_pos)
                return this.step_backward_button_click_action(dui_instance)
            }
            let prev_non_whitespace_pos = Editor.backup_over_whitespace(full_src, start_pos - 1)
            if(full_src.endsWith("*/", prev_non_whitespace_pos + 1)){
                let starting_comment_pos = full_src.lastIndexOf("/*")
                if(starting_comment_pos !== -1){
                    Editor.select_javascript(starting_comment_pos - 1, starting_comment_pos - 1)
                    return this.step_backward_button_click_action(dui_instance)
                }
            }

            Editor.select_javascript(prev_prev_newline_pos + 1, prev_prev_newline_pos + 1)
            return this.step_forward_button_click_action(dui_instance)
        }
   }

    static needs_comma_before_insert(full_src, end_pos) {
        let end_char = full_src[end_pos]
        let end_char_is_comma = (end_char == ",")
        let close_angle_pos = full_src.indexOf("]})")
        let open_paren_pos = full_src.indexOf("(")
        let prev_end_char_is_comma = false
        if(end_pos > 0){
                prev_end_char_is_comma = (full_src[end_pos - 1] == ",")
        }

        if(end_char_is_comma) {return false}
        else if(prev_end_char_is_comma) {return false}
        //else if(close_angle_pos == -1) { //not well formed situation but
        //    return false
        //}
        //else if (open_paren_pos == -1){ //not well formed situation but
        //    return false
        //}
        //else if(open_paren_pos < close_angle_pos) {
        //    return false
        //}
        else { return true }
    }

    make_instruction_source(){
        let instr_name = dui_instr_type_id.value
        let instr_code = "Dexter." + instr_name
        let new_args
        if(instr_name.endsWith("move_all_joints"))  {
            /*let angles_to_use = this.maj_angles
            let last_non_zero_angle = 6
            for(last_non_zero_angle = last_non_zero_angle; last_non_zero_angle >= 0; last_non_zero_angle--){
                if(angles_to_use[last_non_zero_angle] !== 0) {
                    break;
                }
            }
            if (last_non_zero_angle != 6) {
                angles_to_use = angles_to_use.slice(0, last_non_zero_angle + 1)
            }*/
            new_args = this.maj_angles.join(", ") //just always do all 7.
        }
        else if (instr_name.endsWith("move_to")){
            let dir = (this.should_point_down ? [0, 0, -1] : this.direction)
            let dir_is_default_value = false
            if(similar(dir, [0, 0, -1], (Number.EPSILON * 10))){
                dir_is_default_value = true
                dir = [0, 0, -1]
            }
            let j6 = this.maj_angles[5]
            let j7 = this.maj_angles[6]
            if((j7 === 0) || (j7 === undefined)) {
                if((j6 === 0) || (j6 === undefined)) {
                    if(dir_is_default_value){
                        new_args = "[" + this.xyz.join(", ") + "]"
                    }
                    else {
                        new_args = "[" + this.xyz.join(", ") + "], " +
                            "[" + this.direction.join(", ") + "]"
                    }
                }
                else {
                    new_args =  "[" + this.xyz.join(", ") + "], " +
                        "[" + dir.join(", ") + "], " +
                        "undefined, undefined, " +
                        j6
                }
            }
            else {
                new_args =  "[" + this.xyz.join(", ") + "], " +
                    "[" + this.direction.join(", ") + "], " +
                    "undefined, undefined, " +
                    j6 + ", " +
                    j7
            }
        }
        instr_code += "(" + new_args + ")"
        return instr_code
    }
//_______update UI fns_______
    //expects this.maj_angles to be set with the latest.
    //does NOT expect this.maj_angles to have yet been adjusted if the direction checkbox is checked.
    update_all(check_box_if_direction_is_down = false){
        //ebugger;
        if(this.should_point_down) {
            this.set_maj_angles(Kin.point_down(this.maj_angles))
        }
        this.direction = Kin.J_angles_to_dir(this.maj_angles) //when this.should_point_down ==true.
             // Kin.J_angles_to_dir will return an array of 3 numbers that is within epsilon
             //of [0, 0, -1] but (at least often) not exactly [0, 0, -1],
             //so the call to similar has to take this into account and consider epslilon close to
             //[0, 0, -1] to be similar. Vector.is_equal can also handle this.
        if(check_box_if_direction_is_down) { //true only during init
            this.should_point_down = similar(this.direction, [0, 0, -1], Number.EPSILON * 100)
        }
        this.update_direction()
        this.update_range_and_angle_nums()
        this.xyz = Kin.J_angles_to_xyz(this.maj_angles)[0]
        this.update_xyz_nums()
        this.update_xyz_limits()
        this.update_xyz_circle()
        this.update_editor_maybe()
    }

    update_editor_maybe(){
        let full_src  = myCodeMirror.doc.getValue() //$("#js_textarea_id").val() //careful: js_textarea_id.value returns a string with an extra space on the end! A crhome bug that jquery fixes
        let sel_start_pos = Editor.selection_start()
        let sel_end_pos   = Editor.selection_end()
        let next_line_pos = full_src.indexOf("\n", sel_start_pos)
        if(sel_start_pos !== sel_end_pos){ //we have a selection
            let sel_text  = full_src.substring(sel_start_pos, sel_end_pos)
            let maj_pos = full_src.indexOf("move_all_joints(", sel_start_pos)
            let maj_pos_args = maj_pos + "move_all_joints(".length
            let maj_pos_args_end = full_src.indexOf(")", maj_pos_args)
            if((maj_pos !== -1) &&  //we have a move_all_joints after sel_start_pos
               (maj_pos_args_end !== -1) &&
               ((next_line_pos == -1) //no new lines after maj pos
                 || (maj_pos < next_line_pos))) //maj_pos is before the next newline.
               {
                let maj_pos_args = maj_pos + "move_all_joints(".length //finds move_all_joints, pid_move_all_joints but not move_all_joints_relative on purpose

                if((maj_pos_args_end !== -1) && (maj_pos_args_end <= sel_end_pos)) {
                    let begin_of_call_pos = Editor.backup_to_whitespace(full_src, maj_pos)
                    let last_non_zero_angle = 6
                    for(last_non_zero_angle = last_non_zero_angle; last_non_zero_angle >= 0; last_non_zero_angle--){
                        if(this.maj_angles[last_non_zero_angle] !== 0) {
                            break;
                        }
                    }
                    let angles_to_use = this.maj_angles
                    if (last_non_zero_angle != 6) {
                        angles_to_use = angles_to_use.slice(0, last_non_zero_angle + 1)
                    }
                    let new_args = angles_to_use.join(", ")
                    let new_type_and_args = dui_instr_type_id.value + "(" + new_args
                    Editor.replace_at_positions(new_type_and_args, maj_pos, maj_pos_args_end)
                    let new_sel_end = maj_pos_args + new_args.length + 1
                    Editor.select_javascript(begin_of_call_pos, new_sel_end)
                    return
                }
            }
            else {
                let mt_pos = full_src.indexOf("move_to(", sel_start_pos)
                let mt_pos_args = mt_pos + "move_to(".length
                let mt_pos_args_end = full_src.indexOf(")", mt_pos_args)
                if((mt_pos !== -1) &&
                   (mt_pos_args_end !== -1) &&
                   ((next_line_pos == -1) //no new lines after maj pos
                        || (mt_pos < next_line_pos))){ //mt_pos is before the next newline. {
                    let begin_of_call_pos = Editor.backup_to_whitespace(full_src, mt_pos)
                    //xyz, direction, config, workspace_pos, j6_angle, j7_angle, robot
                    //just ignore robot. Too hard to deal with.
                    /*let mt_args_src_str = full_src.substring(mt_pos_args, mt_pos_args_end)
                    let mt_args_src_arr
                    try{
                        mt_args_src_arr = eval("[" + mt_args_src_str + "]")
                    }
                    catch(err) { //can't parse move_to args
                        return
                    }*/
                    let new_args // "[" + this.xyz.join(", ") + "]"
                    let dir = (this.should_point_down ? [0, 0, -1] : this.direction)
                    let dir_is_default_value = false
                    if(similar(dir, [0, 0, -1], (Number.EPSILON * 10))){
                        dir_is_default_value = true
                        dir = [0, 0, -1]
                    }
                    let j6 = this.maj_angles[5]
                    let j7 = this.maj_angles[6]
                    if((j7 === 0) || (j7 === undefined)) {
                        if((j6 === 0) || (j6 === undefined)) {
                            if(dir_is_default_value){
                                new_args = "[" + this.xyz.join(", ") + "]"
                            }
                            else {
                                new_args = "[" + this.xyz.join(", ") + "], " +
                                           "[" + this.direction.join(", ") + "]"
                            }
                        }
                        else {
                            new_args =  "[" + this.xyz.join(", ") + "], " +
                                        "[" + dir.join(", ") + "], " +
                                        "undefined, undefined, " +
                                        j6
                        }
                    }
                    else {
                        new_args =  "[" + this.xyz.join(", ") + "], " +
                                    "[" + this.direction.join(", ") + "], " +
                                    "undefined, undefined, " +
                                    j6 + ", " +
                                    j7
                    }
                    let new_type_and_args = dui_instr_type_id.value + "(" + new_args
                    Editor.replace_at_positions(new_type_and_args, mt_pos, mt_pos_args_end)
                    let new_sel_end = mt_pos_args + new_args.length + 1
                    Editor.select_javascript(begin_of_call_pos, new_sel_end)
                    return
                }
            }
        }
    }

    update_editor_maybe(){
        let full_src  = myCodeMirror.doc.getValue() //$("#js_textarea_id").val() //careful: js_textarea_id.value returns a string with an extra space on the end! A crhome bug that jquery fixes
        let sel_start_pos = Editor.selection_start()
        let sel_end_pos   = Editor.selection_end()
        if(sel_start_pos !== sel_end_pos){ //we have a selection
            let sel_text  = full_src.substring(sel_start_pos, sel_end_pos)
            let maj_pos = full_src.indexOf("move_all_joints(", sel_start_pos)
            let mt_pos = full_src.indexOf("move_to(", sel_start_pos)
            let instr_name_start = maj_pos
            if (maj_pos === -1) {
               if(mt_pos === -1) { return }                         //no instr in file after sel_start_pos
               else { instr_name_start = mt_pos}                    //only mt is present
            }
            else if (mt_pos === -1) { instr_name_start = maj_pos}   //only maj is present
            //both instr names present so
            else if(maj_pos < mt_pos) { instr_name_start = maj_pos} //maj is first
            else { instr_name_start = mt_pos}                       //mt is first
            //ok instr_name_start is a non-neg value
            let next_line_pos = full_src.indexOf("\n", sel_start_pos)
            if((next_line_pos == -1) || (instr_name_start < next_line_pos)) { //instr_name_start is on the first line of the selection, so we're good to further process. otherwise, do nothing
                let trimmed_sel_start_pos = Editor.skip_forward_over_whitespace(full_src, sel_start_pos)
                let sel_end_pos   = Editor.selection_end()
                if(trimmed_sel_start_pos !== sel_start_pos){ //get ready to replace the selection
                    sel_start_pos = trimmed_sel_start_pos
                    Editor.select_javascript(sel_start_pos, sel_end_pos)
                }
                let inst_src = this.make_instruction_source()
                Editor.insert(inst_src, "replace_selection", true) //replace the selection, select the new text
            }
            //else we don't have a valid instruction in the first line of the selection, so don't modify editor
        }
    }
    handle_editor_selection(){

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
        for(let joint_number = 1; joint_number <= 7; joint_number++){
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
        let [inner_r, outer_r, outer_circle_center_xy] = Kin.xy_donut_slice_approx(z, dir)
        let inner_xy = [0, 0] //and by the way, for now, outer_circle_center_xy will also always be [0,0],
                              // but that will likely change

        let current_max_z = Kin.max_z(this.xyz[0], this.xyz[1], dir) //*might* return NaN
        let current_max_z_px = (Number.isNaN(current_max_z) ? 0 : Math.round(this.meters_to_z_px(current_max_z)) + "px")

        //convert to pixels
        let outer_r_px = (Number.isNaN(current_max_z) ? 0 : this.radius_meters_to_px(outer_r))
        let outer_x_px = this.meters_to_x_px(outer_circle_center_xy[0])
        let outer_y_px = this.meters_to_y_px(outer_circle_center_xy[1])

        let inner_r_px = (Number.isNaN(current_max_z) ? 0 : this.radius_meters_to_px(inner_r))
        let inner_x_px = this.meters_to_x_px(inner_xy[0])
        let inner_y_px = this.meters_to_y_px(inner_xy[1])
        //draw
        selector_set_in_ui("#" + this.show_window_elt_id + " svg [style] [background-color]", dui2.xy_background_color)
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
            if(similar(0, dir_item, Number.EPSILON)) {
                dir_item = "0"
            }
            else {
                dir_item = "" + dir_item
                let e_index = dir_item.indexOf("e")
                if(e_index != -1) { //we've got a really big, or really small number.
                    dir_item = dir_item.substring(e_index) //just show e17 or e-17 or something similar
                }
                else {
                    let len = ((dir_item[0] === "-") ? 6 : 5)
                    dir_item = dir_item.substring(0, len)
                }
            }
            new_val_str += dir_item
            if (i < 2) { new_val_str += ", " }
        }
        new_val_str  += "]"
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=direction_checkbox] [checked]", this.should_point_down) //selector_set_in_ui fixes bad design of checkboxes by accepting "false" and false to mean unchecked.
        selector_set_in_ui("#" + this.show_window_elt_id + " .direction [innerHTML]", new_val_str)
    }

} //end of class dui2

dui2.instances = []
dui2.xy_background_color = "#fe8798" //   #ff7e79 is too orange

} //end of top level if

dui2.make_job() //in DDE, makes a job using the default_robot in the Misc pane select.