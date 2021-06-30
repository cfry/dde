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
                if((i === 1) || (i === 2)) {
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

    make_move_instruction(slider_angles){
      let dui_instance = this
      let commanded_angles = dui_instance.dexter_instance.rs.angles(5) //there aren't 7 angles, only 5
      if(slider_angles.length === 7){
        commanded_angles.push(0) //because we need commanded_angles to be 7 long, and j6 and j7 don't do pid, they just treat a pid_maj for j6 and j7 as if it was a regular maj
        commanded_angles.push(0)
      }
      let angles_to_use = Vector.subtract(slider_angles, commanded_angles)
      let instr = Dexter.pid_move_all_joints(angles_to_use)
      return instr
    }

    //this is the top level code in this file that is called when the user chooses Jobs menu, Dexter UI item.
    static make_job(explicitly_start_job=false){
        let dex = (window.default_robot ? Dexter.default : Dexter.dexter0)
        let name = ((platform === "dde") ? "dui2_for_" + dex.name : "dexter_user_interface2") //the job engine Job name must match the file name (sans .js")
        if (Job[name] && Job[name].is_active()) { //we're redefining the job so we want to make sure the
            //previous version is stopped first
            //if (Job[name].robot instanceof Dexter) {Job[name].robot.empty_instruction_queue_now() }
            Job[name].stop_for_reason("interrupted", "User is redefining this job.")
            setTimeout(function(){ dui2.make_job(true) }, 200)
        }
        else { //hits when job is undefined, or is defined but not active.
               //if job is defined but not active, it will be redefined,
               //with a new job_id. This should be fine.
            let new_job = new Job({
                            name: name,
                            robot: dex,
                            when_do_list_done: "wait",
                            do_list: [dui2.init,
                                      //Dexter.move_all_joints(0, 0, 0, 90, 0, 0, 0)
                                      //Dexter.move_all_joints([0, 0, 0, 0, 0]),
                                      //Dexter.pid_move_all_joints([0, 0, 0, 0, 0])
                                      ]
                        })
           // dex.instruction_callback = this.dui_instruction_callback //used for "run_forward" , complicated to get this to work so now run_forward does something simpler
            if(explicitly_start_job) {
                new_job.start()
            }
           // else {} //this job will get started anyway via define_and_start_job which is called by dui2_id.onclick
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
        let elts = Array.from(document.querySelectorAll(':hover'))
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
            show_in_misc_pane("Simulate Dexter") //changes Misc pane to sim. Preserves pose of Dexter.
        }
        let dui_instance = new dui2()
        dui_instance.job_name = this.name
        dui_instance.dexter_instance = this.robot
        let initial_angles
        let initial_move_instruction
        //set initial_angles
        if(!dui_instance.dexter_instance.rs) {
            initial_angles = Dexter.HOME_ANGLES
        }
        else {//the normal case
            initial_angles = dui_instance.dexter_instance.rs.measured_angles(7)
        }

        //set should_point_down and initial_move_instruction
        if(similar(initial_angles.slice(0, 3), [0,0,0], 0.02)) { //consider Dexter is HOME. Just look at
                                                                 //first 3 joints as sometimes j4 is 90 or -90.
            dui_instance.should_point_down = true //if its home, it should be set to point down,
            //because otherwise we won't be able to move the z slider, and its not
            //obvious what a user can do in the dialog box, but if we point it down,
            //they can move the z slider. James W likes this approach,
            //but, it means we have to move the dexter.
            initial_angles = Kin.point_down([0,0,0,0,0, 0, 50]) //change our initial_angles,
              //j7 needs to be 50 as it is in the new HOME, to avoid overtorque when its 0.
            initial_move_instruction = //Dexter.pid_move_all_joints(initial_angles)
                                       //dui_instance.make_move_instruction(initial_angles)
                                       Dexter.move_all_joints(initial_angles)
        }
        else {
            dui_instance.should_point_down = dui_instance.dexter_instance.is_direction() //the checkbox is in sync with this.
            initial_move_instruction = null
        }

        dui_instance.xy_width_in_px = xy_width_in_px
        dui_instance.dexter_mode = "keep_position" //always starts in keep position.
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
            height: xy_width_in_px + 333 + ((operating_system === "win") ? 60 : 0), //windows needs more vert space than mac for some strange reason.
            x: 320,
            y: 0,
            background_color: "#d5d5d5",
            job_name: this.name, //important to sync the correct job.
            callback: "dui2.dexter_user_interface_cb",
            content:
            '<div style="margin-top:-10px;"><span style="margin-top:0px;padding:2px;">Move Dexter to:</span>' +
            `<input type="button" name="ready"  style="margin-left:10px;margin-top:0px;margin-bottom:3px; padding:2px;" value="ready"  title="Move Dexter to a neutal position.&#013;Good for 'elbow room'."/>` +
            `<input type="button" name="home"   style="margin-left:10px;margin-top:0px;margin-bottom:3px; padding:2px;" value="home"   title="Move Dexter straight up.&#013;This doesn't allow much freedom of motion."/>` +
            "<span name='step_arrow_buttons'>" + //needed by tutorial
            `<span class="clickable" name="go_to_start"   style="font-size: 24px; margin-left: 5px; cursor: pointer; color: rgb(0, 200, 0); vertical-align:-10%;" title="Move cursor to before the first instruction&#013;of its containing do_list.">◀</span>` +
            `<span class="clickable" name="step_backward" style="font-size: 18px; margin-left: 5px; cursor: pointer; color: rgb(0, 200, 0); vertical-align:-10%;"   title="Step and execute the instruction before the selection&#013;or, if none, the cursor&#013;in the Job defined in the editor.">◀</span>` +
            `<span class="clickable" name="step_forward"  style="font-size: 18px; margin-left: 5px; cursor: pointer; color: rgb(0, 200, 0); vertical-align:-10%;"   title="Step through the instruction after the selection&#013;or, if none, the cursor&#013;in the Job defined in the editor.">▶</span>` +
            `<span class="clickable" name="run_forward"   style="font-size: 24px; margin-left: 5px; cursor: pointer; color: rgb(0, 200, 0); vertical-align:-10%;"   title="Run the instructions &#013;from the cursor through the end.">▶</span>` +
            '<div class="clickable"  name="help"          style="display:inline-block; margin-left:15px;cursor: pointer;color:blue;font-size:20px;font-weight:bold;" title="Help"> ? </div>' +
            "</span></div>" +
            dui_instance.make_xyz_sliders_html(xy_width_in_px,
                min_x, max_x,
                //min_y, max_y are same as min_x, max_x, so don't pass them.
                min_z, max_z) +
           // "<br/>" +
            dui_instance.make_joint_sliders_html() +
            dui_instance.make_direction_html() +
            "<hr style='height:1px; color:black; background-color:black; margin:0px; padding:0px;'/>" +
            dui_instance.make_insert_html()
        })
        setTimeout(function() {
                dui_instance.show_window_elt_id = "show_window_" + SW.window_index + "_id"
                let sw_elt = window[dui_instance.show_window_elt_id]
                sw_elt.classList.add("dui_dialog")
                //let RS_inst = dui_instance.dexter_instance.rs
                //let measured_angles = RS_inst.measured_angles(7).slice() //returns a copy of the array so safe to change it.
                dui_instance.set_maj_angles(initial_angles)
                dui_instance.update_all(dui_instance.should_point_down) //true means IFF maj_angles is pointing down, set the checkbox to point down.
                //dui2.init_is_mouse_over(dui_instance)
            },
            300)
        return initial_move_instruction //this will be run as the first instr of the DUI job. Often it is null,
          //but if we have to adjust the cur measured angles because their HOME, this could be a maj instr.
    }

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

            'style="stroke:black; stroke-width:1;"><title>The draggable X,Y location of the Dexter end effector.</title></circle>'
        let outer_circle_html = '<circle id="outer_circle" cx="0" cy="0" r="100" fill="white" ' +
            'style="stroke:black; stroke-width:1;"><title>This white donut represents the X,Y locations that the Dexter end effector can reach at the current Z location.</title></circle>'
        let inner_circle_html = '<circle id="inner_circle" cx="0" cy="0" r="100" fill="' + dui2.xy_background_color + '" ' +
            'style="stroke:black; stroke-width:1;"/>'
        let svg_html =
            //'<div style="display:inline-block;vertical-align:900%;">
            '<b style="margin-right:5px; vertical-align:850%;">Y</b>' +
            //'</div>' +
            '<svg tabindex="0" onkeydown="dui2.keydown_on_xy_square_action(event)"  onkeyup="dui2.keyup_on_xy_square_action(event)"' +
            'style="display:inline-block; border:2px solid black;background-color:' + dui2.xy_background_color + ';margin-bottom:0px;" ' +
            'width="'  + xy_width_in_px + 'px" ' +
            'height="' + xy_width_in_px + 'px" ' +
            '>' +
            //normal html title attribute doesn't work for SVG tags so you have to use ...
            '<title>After clicking on the big square, you can use:&#013;' +
                   'left and right arrow keys to move in X,&#013;' +
                   'down and up arrow keys to move in Y,&#013;' +
                   'period and comma keys to move in Z.&#013;' +
                   '1 thru 7 and their shift equivalents to move joints.&#013;' +
                   'r and v for joint 6 roll.' +
            '</title>' +
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
            'Z: <input name="z_num" type="number" data-oninput="true" style="width:55px;margin-top:0px;" min="' + min_z + '" max="' + max_z + '" value="0" step="0.01" ' + '"/>m<br/>'

        let z_slider_restriction_html = '<div style="position:absolute; top:60px; right:25px; width:20px; height:40px; background-color:' + dui2.xy_background_color + ';"></div>'
        let the_html =
            svg_html +
            "<b style='vertical-align:top;margin-left:15px;'>Z</b>" + z_slider_html +
            //z_slider_restriction_html +
            '<div style=" margin-top:-28px;margin-bottom:0px;left:10px;top:365px;"><b>X</b>' +
            //'<div margin-top:0px;margin-bottom:0px;left:20px;"><b>X</b>' +

            ' key inc:<select name="key_inc" title="When using keys to increment x, y, or z,&#013;this is the inc amount.&#013;auto means automatically increase inc&#013;the longer you hold down the key.">' +
            '<option>auto</option><option>0.001</option><option>0.01</option><option>0.1</option>' +
            '<option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>8</option><option>10</option><option>12</option><option>16</option>' +
            '<option>20</option><option>25</option><option>30</option><option>40</option>'+
            '<option>50</option><option>75</option><option>100</option>' +
             '</select>mm ' +
            '<span style="margin-left:5px;">J6roll:</span><input name="J6_roll" data-oninput="true" type="number" min="-180" max="180" step="0.1" value="0" style="width:50px;"/>&deg;' +
            '<span style="margin-left:3px;" title="Fill in joint angles by moving your Dexter by hand.">FromDex:<input name="from_dexter" type="checkbox" data-oninput="true"/></span>' +
            '</div>' +
               xyz_num_html
        return the_html
    }

    make_joint_sliders_html(){
        let result = "" //"<style> .dui-slider::-webkit-slider-thumb {background-color:#00FF00;}</style>"
        for(let joint_number = 1; joint_number < 8; joint_number++){
            let min_name = "J" + joint_number + "_angle_min"
            let min = this.dexter_instance[min_name]
            let max_name = "J" + joint_number + "_angle_max"
            let max = this.dexter_instance[max_name]
            let val = 0 //= RS_inst.measured_angle(joint_number) //these will be set in update_all.
                        //When the robot hasn't had a job run on it yet, there won't be a measured_angle,
                        // and a val of "undefined" causes a low level warning.
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
                `<input type="button" name="insert_job"         value="Job"         style="margin-left:15px" title="Insert, into the editor,&#013;a Job definition with no instructions.&#013;Do before 'insert instruction'."/>` +
                `<input type="button" name="insert_instruction" value="instruction" style="margin-left:15px" title="Insert, into the editor,&#013;an instruction of the current location.&#013;Do after 'insert job'."/>`
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

    static xyz_key_increment = 0
    static joint_key_increment = 0

    static set_new_xyz_increment(){
        let xy_square = document.activeElement
        let show_window_elt = xy_square.closest(".dui_dialog")
        let key_inc_elt = show_window_elt.querySelector("[name=key_inc]")
        let key_inc_val = key_inc_elt.value
        if(key_inc_val === "auto"){
            if(this.xyz_key_increment === 0) {
                this.xyz_key_increment = 0.000001
            }
            else {
                let maybe = this.xyz_key_increment * 1.4
                this.xyz_key_increment = Math.min(maybe, 0.004)
            }
        }
        else {
            key_inc_val = parseFloat(key_inc_val)
            this.xyz_key_increment = key_inc_val / 1000  //xyz_key_increment should be in meters, but the key_inc select menu has values in mm.
        }
    }

    static set_new_joint_increment(){
        if(this.joint_key_increment === 0) {
            this.joint_key_increment = 0.000001
        }
        else {
            let maybe = this.joint_key_increment * 1.7
            this.joint_key_increment = Math.min(maybe, 2)
        }
    }

    static keyup_on_xy_square_action(event){
        this.xyz_key_increment = 0
        this.joint_key_increment = 0 //use for roll (r & v) as well
    }

    //returns ["Shift", null] when only the shift key is down as happens when you hold shift down,
    //THEN you type a number key
    //returns array of 2 elts, the key (as a string, or,
    // if its a number key, an actual pos integer of the joint) and
    // the sign as either 1 or -1 (a factor in a multiply)
    static convert_key_and_sign(key){
        let shift_joint_keys = ")!@#$%^&*("
        let keyint = shift_joint_keys.indexOf(key)  //if keyint is not -1, then we have a SHIFT_integer keystroke, ie a decriment of a joint angle
        if(is_digit(key))      { return [parseInt(key), 1] } //positive joint angle
        else if(keyint !== -1) { return [keyint, -1] } //the shift of an int, ie a negative joint angle
        else if (key === "r")  { return [key, 1]    }
        else if (key === "v")  { return [key, -1]   }
        else {                   return [key, null] } //could be arrow key or other key for xyz or r or v
    }

    //similar in functionality to dexter_user_interface_cb, only for keyboard events on the big xy square
    static keydown_on_xy_square_action(event){
        //ebugger;
        let [key, sign]  = this.convert_key_and_sign(event.key)
        //out(key + " " + sign)
        let dui_instance = dui2.dui_instance_under_mouse()
        if (!dui_instance) {
            warning("To use the keyboard to control the Dexter User Inferface,<br/>" +
                     "the mouse must be in the dialog box.")
            return
        }
        else if((key === "Shift") && (sign === null)) { return } // a no-op. don't even print warning
        let x = dui_instance.xyz[0]
        let y = dui_instance.xyz[1]
        let z = dui_instance.xyz[2]
        let xyz = [x,y,z]
        let j_angles
        //out("got key " + key, undefined, true)
        //this.xyz_key_increment = 0.001
        //this set of if..else sets j_angles to new values, OR returns from fn because a
        //key was pressed that does nothing
        if (typeof(key) === "number") { //got joint key
            let joint_number = key
            if (dui_instance.should_point_down && ((joint_number == 4) || joint_number == 5)) {
                  warning("You can't change Joint 4 or 5 when you have 'Point Down' checked.")
                  return
            }
            this.set_new_joint_increment()
            //out("new joint increment: " + this.joint_key_increment, undefined, true)
            //let is_shift = event.shiftKey
            j_angles = dui_instance.maj_angles
            let old_joint_degrees = j_angles[joint_number - 1]
            if(Number.isNaN(old_joint_degrees)) { old_joint_degrees = 0 } //shouldn't be necessary but makes it more robust
            let j_inc = this.joint_key_increment * sign
            let new_joint_degrees = old_joint_degrees + j_inc
            j_angles[joint_number - 1] = new_joint_degrees
            try {
                Kin.J_angles_to_xyz(j_angles) //returns just 5 angles
            }
            catch(err){
                warning("Sorry, Dexter can't go to Joint " + joint_number + " angle:  " + new_joint_degrees +
                    " given the other joint angles.")
                return
            }
        }
        else if((key === "r") || (key === "v")) { //roll
            j_angles = dui_instance.maj_angles
            this.set_new_joint_increment()
            let old_j6   = j_angles[5]
            let old_roll = Kin.J6_to_roll(xyz, old_j6)
            let roll_inc = this.joint_key_increment * sign
            let new_roll = old_roll + roll_inc
            let new_J6   = Kin.roll_to_J6(xyz, new_roll)
            j_angles[5]  = new_J6
        }
        else {
            this.set_new_xyz_increment()
            if((key === "ArrowRight") || (key === "d")){
                x += this.xyz_key_increment
            }
            else if((key === "ArrowLeft") || (key === "a")) {
                x -= this.xyz_key_increment
            }
            else if((key === "ArrowUp") || (key === "w")){
                y += this.xyz_key_increment
            }
            else if((key === "ArrowDown") || (key === "s")){
                y -= this.xyz_key_increment
            }
            else if((key === ".") || (key === "e")){ //z up
                z += this.xyz_key_increment
            }
            else if((key === ",") || (key === "c")){
                z -= this.xyz_key_increment
            }
            else {
                warning("The key: " + key + " does nothing while the x-y square is selected.")
                return
            } //ignore the key
            xyz = [x,y,z] //grab the new value for x, y, or z
            try {
                j_angles = Kin.xyz_to_J_angles(xyz, dui_instance.direction) //returns just 5 angles
            }
            catch(err) { //with the above test for new_xy_radius, this catch should never hit.
                if((key === ",") || (key === ".")){
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
        //now j_angles is set, at least to 5 elts.
        //don't do set_maj_angles until we're sure that Kin.xyz_to_J_angles didn't error
        if(j_angles.length === 5) { j_angles.push(dui_instance.maj_angles[5]) } //joint 6 vals.j6_angle_num)
        if(j_angles.length === 6) { j_angles.push(dui_instance.maj_angles[6]) } //joint 7 vals.j7_angle_num)   }
        dui_instance.set_maj_angles(j_angles)
        dui_instance.update_all(dui_instance.should_point_down) // do update_all before move_all_joints because update_all may modify ui2_instance.maj_angles if the direction_checkbox is checked
        let instr = //Dexter.pid_move_all_joints(dui_instance.maj_angles)
                    dui_instance.make_move_instruction(dui_instance.maj_angles)
        //Job.insert_instruction(instr, {job: dui_instance.job_name, offset: "end"}) //todo overwrite
        Job[dui_instance.job_name].insert_last_instruction_overwrite(instr)
    }

//______show_window callback

//strategy: convert the changed values into maj_angles, set dui_instance.maj_angles and, at the end,
// call update_all once regardless of who started it.

  static dexter_user_interface_cb(vals){
    //out("dui_cb got clicked_button_value: " + vals.clicked_button_value +
    //    " which has val: " + vals[vals.clicked_button_value])
    let dui_instance = dui2.show_window_elt_id_to_dui_instance(vals.show_window_elt_id)
    //inspect(dui2.dui_instance_under_mouse())
    if(vals.clicked_button_value === "close_button"){
        if(dui_instance.dexter_mode === "follow_me") {
            let instr = Dexter.set_keep_position()
            Job.insert_instruction(instr, {job: vals.job_name, offset: "end"})
            dui_instance.dexter_mode = "keep_position" //do this even through we're ending the job because this will stop the follow_me loop setTimeout
            out(dui_instance.dexter_instance.name + " restored to mode: keep_position.")
        }
        let the_job = Job[vals.job_name]
        the_job.stop_for_reason("interrupted", "User closed Dexter Interface dialog.")
        let inst_index = dui2.instances.indexOf(dui_instance)
        if(inst_index == -1) { shouldnt("in dexter_user_interface_cb with close_button") }
        else { dui2.instances.splice(inst_index, 1) } //cut out the instance from the instances list
        return
    }
    else if(vals.clicked_button_value === "help") {
        open_doc(dexter_user_interface_doc_id)
        return
    }
    else if(["xy_2d_slider", "z_slider", "J6_roll"].includes(vals.clicked_button_value)){
        let cir_xy_obj = vals.xy_2d_slider
        let x = parseFloat(cir_xy_obj.cx)
        x = dui_instance.x_px_to_meters(x)
        let y = parseFloat(cir_xy_obj.cy) //a num between 0 and 300
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
                let j6_joint_angle = Kin.roll_to_J6(xyz, vals.J6_roll)
                if(j_angles.length === 5) { j_angles.push(j6_joint_angle)   }
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
                let j6_joint_angle = Kin.roll_to_J6(xyz, vals.J6_roll)
                if(j_angles.length === 5) { j_angles.push(j6_joint_angle)   }
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
        dui_instance.set_maj_angles([0, 0, 90, 0, 0, 0, 50])
    }
    else if(vals.clicked_button_value == "home"){
        let instr = Dexter.move_all_joints(Dexter.HOME_ANGLES)
        Job.insert_instruction(instr, {job: vals.job_name, offset: "end"}) //Jmaes W says HOME needs both a pidmaj and maj instructions.
        //Job[dui_instance.job_name].insert_last_instruction_overwrite(instr)
        dui_instance.set_maj_angles(Dexter.HOME_ANGLES) //ultimately causes a pid_move_all_joints insert
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
                let instr = //Dexter.pid_move_all_joints(dui_instance.maj_angles)
                            dui_instance.make_move_instruction(dui_instance.maj_angles)
                Job.insert_instruction(instr, {job: vals.job_name, offset: "end"})
            }
        }
        //let show_win_elt = window[vals.show_window_elt_id]
        //show_win_elt.focus()  //so that is_dui_the_focus will work after setting the selection.
                              //is_dui_the_focus needed by dui_instruction_callback
        return
    }
    else if(vals.clicked_button_value == "from_dexter"){
        if(vals.from_dexter){ //user just checked the checkbox
            dui_instance.dexter_instance.clear_time_of_last_phui_button_click_ms()
            dui_instance.waiting_for_phui_gui_button_click = true
            out("If the editor cursor is not already in a Job's do_list,<br/>" +
                "you should probably click insert <span style='background-color:rgb(221, 211, 255);'>Job</span> for recording points.<br/>" +
                "To start getting points from Dexter,<br/>" +
                "you must first grab Dexter to prevent it from falling, then<br/>" +
                "either  click <button class='get_points_from_dexter' onclick='dui2.from_dexter_gui_button_click(" +
                dui_instance.dui_instance_to_index() +
                ")'>Get Points From Dexter</button> or click Dexter's Phui button.")
            dui_instance.waiting_for_user_to_start_get_points = true
            let the_follow_me_fn  //declaer first so the body of the fn will close over the var
            the_follow_me_fn = function() {
                let show_window_instance = value_of_path(dui_instance.show_window_elt_id)
                if(!show_window_instance) {return} //its over user closed show_window
                let from_dexter_checkbox = show_window_instance.querySelector("[name=from_dexter]")
                if(!from_dexter_checkbox.checked) {return} //its over. user unchecked checkbox.
                else if (dui_instance.waiting_for_user_to_start_get_points) { //not yet inited.
                    let job_instance = Job[dui_instance.job_name]
                    job_instance.insert_single_instruction(Dexter.get_robot_status(), false)
                    if((!dui_instance.waiting_for_phui_gui_button_click) ||
                        dui_instance.dexter_instance.was_phui_button_down()){ //ready to start getting points
                        dui_instance.waiting_for_phui_gui_button_click = false
                        dui_instance.waiting_for_user_to_start_get_points = false
                        dui_instance.should_point_down = false //let user drag end effector where they want.
                        for(let elt of output_div_id.querySelectorAll(".get_points_from_dexter")){
                            elt.disabled = true
                        }
                        Job.insert_instruction(Dexter.set_follow_me(), {job: dui_instance.job_name, offset: "end"}) //builds up long do_list
                        dui_instance.dexter_mode = "follow_me"
                        out("Manually move Dexter to set the Dexter User Interface dialog point.<br/>" +
                            "To record a point, click Dexter's Phui button or<br/>" +
                            "the dialog's insert <span style='background-color:rgb(221, 211, 255);'>instruction</span> button.<br/>" +
                            "Uncheck FromDex to exit that mode.")
                    }
                    setTimeout(the_follow_me_fn, 30) //loop around, whether or not we're inited.
                    return
                }
                else { //we started
                    Job[dui_instance.job_name].insert_last_instruction_overwrite(Dexter.get_robot_status())
                    let j_angles =  dui_instance.dexter_instance.rs.measured_angles(7) //note, this probably gets the prev robot status, but that's ok
                    dui_instance.set_maj_angles(j_angles)
                    dui_instance.update_all(false) //hmm, needs work on should_point_down.
                    out("grabbed from Dexter: " + j_angles, "green", true)
                    if(dui_instance.dexter_instance.was_phui_button_down()){ //insert point into editor
                        dui_instance.insert_instruction_into_editor()
                    }
                    if(dui_instance.dexter_mode === "follow_me") { //user hasn't quit yet so keep updating dialog from Dexter
                        setTimeout(the_follow_me_fn, 30) //loop around
                    }
                    //else user unchecked the box so we're no longer in follow_me so stop the loop
                    return
                }
            }
            setTimeout(the_follow_me_fn, 30) //first call to the_follow_me_fn
        }
        else { //user unchecked the check box
                dui_instance.waiting_for_phui_gui_button_click = false
                dui_instance.waiting_for_user_to_start_get_points = false
                dui_instance.dexter_mode = "keep_position"
                Job.insert_instruction(Dexter.set_keep_position(), {job: vals.job_name, offset: "end"})
                dui_instance.enable_all_robot_moving_elts(true)
                return
        }
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
        dui_instance.insert_instruction_into_editor()
        return
    }
    else if (vals.clicked_button_value == "insert_job"){
        let job_prefix_src =
`\nnew Job({
    name: "my_job",
    keep_history: false,
    show_instructions: false,
    do_list: [
        `
        /* inserts an instruction but not the right thing if you use FromDex mode to get all points
        let instr_src = dui_instance.make_instruction_source()
        let job_src = job_prefix_src + instr_src + '\n]})\n'
        let cur_pos = Editor.selection_start()
        Editor.insert(job_src)
        let inst_start_pos = cur_pos + job_prefix_src.length
        let inst_end_pos = inst_start_pos + instr_src.length
         //end of job def, now back up to start of where next instruction should be inserted.
        Editor.select_javascript(inst_start_pos, inst_end_pos)
        */
        let job_src = job_prefix_src + '\n]})\n'
        let cur_pos = Editor.selection_start()
        Editor.insert(job_src)
        let inst_start_pos = cur_pos + job_prefix_src.length
        let inst_end_pos = inst_start_pos
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
    let instr = //Dexter.pid_move_all_joints(dui_instance.maj_angles)
                dui_instance.make_move_instruction(dui_instance.maj_angles)
    //Job.insert_instruction(instr, {job: vals.job_name, offset: "end"})

    Job[dui_instance.job_name].insert_last_instruction_overwrite(instr)
}
   //called both from show_window handler insert_instruction, and by a phui button click
   insert_instruction_into_editor(){
       let dui_instance = this
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
       let first_back_non_whitespace_from_start_char = full_src[first_back_non_whitespace_from_start_pos]
       let first_forward_non_whitespace_from_start_pos = Editor.skip_forward_over_whitespace(full_src, start_pos)
       let first_forward_non_whitespace_from_start_char = ((first_forward_non_whitespace_from_start_pos === full_src.length) ? null :
                                                            full_src[first_forward_non_whitespace_from_start_pos])
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
       else if ((first_back_non_whitespace_from_start_char === "[") &&
                !has_selection &&
                (first_forward_non_whitespace_from_start_char === "]")){ //happens with empty Job after user clicked insert Job
           needs_comma_before_insert = false
           prefix_sans_comma = ""
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
   }

   static index_to_dui_instance(index){
        return dui2.instances[index]
   }

   dui_instance_to_index(){
        return dui2.instances.indexOf(this)
   }

   static from_dexter_gui_button_click(index){
        let dui_instance = dui2.index_to_dui_instance(index)
        dui_instance.waiting_for_phui_gui_button_click = false
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
        this.update_xyz_limits() //adjusts donut diameter
        this.update_xyz_circle() //adjusts the green (x,y) dot and the z slider
        this.update_j6_roll() //must set this.xyz before calling update_j6_roll
        this.update_editor_maybe()
    }

    //similar to udate_all
    enable_all_robot_moving_elts(is_yes=true){
        this.enable_direction(is_yes)
        this.enable_range_and_angle_nums(is_yes)
        this.enable_xyz_nums(is_yes)
        //this.enable_xyz_limits(is_yes) //no need for this
        this.enable_xyz_circle(is_yes)
        this.enable_j6_roll(is_yes) //must set this.xyz before calling update_j6_roll
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

    update_range_and_angle_nums(){
        for(let joint_number = 1; joint_number <= 7; joint_number++){
            let angle = this.maj_angles[joint_number - 1] //j1 thru 5 are in index 0 thru 4
            selector_set_in_ui("#" + this.show_window_elt_id + " [name=j" + joint_number + "_range] [value]",
                angle)
            selector_set_in_ui("#" + this.show_window_elt_id + " [name=j" + joint_number + "_angle_num] [value]",
                angle)
        }
        let j4_5_disabled_value = ((this.should_point_down || (this.dexter_mode === "follow_me")) ? "disabled" : null)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=j4_range] [disabled]",
            j4_5_disabled_value)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=j5_range] [disabled]",
            j4_5_disabled_value)
        let j4_5_title = ""
        if(j4_5_disabled_value !== null) {
            j4_5_title = "J4 & J5 sliders are disabled because\nthe Point Down checkbox is checked,\nwhich constrains the motion of J4 & J5."
        }
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=j4_range] [title]", j4_5_title)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=j5_range] [title]", j4_5_title)
    }

    enable_range_and_angle_nums(is_yes=true){
        let disabled_value = (is_yes ? null : "disabled")
        for(let joint_number = 1; joint_number <= 7; joint_number++){
            let angle = this.maj_angles[joint_number - 1] //j1 thru 5 are in index 0 thru 4
            selector_set_in_ui("#" + this.show_window_elt_id + " [name=j" + joint_number + "_range] [disabled]",
                disabled_value)
            selector_set_in_ui("#" + this.show_window_elt_id + " [name=j" + joint_number + "_angle_num] [disabled]",
                disabled_value)
        }
    }

    //x,y,z in meters
    update_xyz_nums(){
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=x_num] [value]", this.xyz[0])
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=y_num] [value]", this.xyz[1])
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=z_num] [value]", this.xyz[2])
    }

    enable_xyz_nums(is_yes=true){
        let disabled_value = (is_yes ? null : "disabled")
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=x_num] [disabled]", disabled_value)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=y_num] [disabled]", disabled_value)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=z_num] [disabled]", disabled_value)
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
    //moves the green dot in the circle and the z slider.
    update_xyz_circle(){
        let x_px = this.meters_to_x_px(this.xyz[0])
        let y_px = this.meters_to_y_px(this.xyz[1])
        //let z_px = dui2.meters_to_x_px(xyz[2]) //don't do as range slider has its min and max
        selector_set_in_ui("#" + this.show_window_elt_id + " [id=xy_2d_slider] [cx]", x_px)
        selector_set_in_ui("#" + this.show_window_elt_id + " [id=xy_2d_slider] [cy]", y_px)
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=z_slider] [value]", this.xyz[2])
    }

    enable_xyz_circle(is_yes=true){
        let disabled_value = (is_yes ? null : "disabled")
        let xy_2d_slider_color = (is_yes ? "rgb(0, 255, 0)" : "rgb(0, 150, 0)")
        let outer_circle_color = (is_yes ? "white" : "rgb(200, 200, 200)")
        selector_set_in_ui("#" + this.show_window_elt_id + " [id=xy_2d_slider] [fill]", xy_2d_slider_color)
        selector_set_in_ui("#" + this.show_window_elt_id + " [id=outer_circle] [fill]", outer_circle_color)

        selector_set_in_ui("#" + this.show_window_elt_id + " [name=z_slider] [disabled]", disabled_value)
    }



    update_j6_roll(){
        let j6_roll = Kin.J6_to_roll(this.xyz, this.maj_angles[5])
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=J6_roll] [value]", j6_roll)
    }

    enable_j6_roll(is_yes=true){
        let disabled_value = (is_yes ? null : "disabled")
        let j6_roll = Kin.J6_to_roll(this.xyz, this.maj_angles[5])
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=J6_roll] [disabled]", disabled_value)
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

    enable_direction(is_yes=true){
        let disabled_value = (is_yes ? null : "disabled")
        selector_set_in_ui("#" + this.show_window_elt_id + " [name=direction_checkbox] [disabled]", disabled_value) //selector_set_in_ui fixes bad design of checkboxes by accepting "false" and false to mean unchecked.
    }

} //end of class dui2

dui2.instances = []
dui2.xy_background_color = "#fe8798" //   #ff7e79 is too orange

} //end of top level if

dui2.make_job() //in DDE, makes a job using the default_robot in the Misc pane select.