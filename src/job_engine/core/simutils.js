/**
 * Created by Fry on 3/30/16.
 */
class SimUtils{
/*from http://stackoverflow.com/questions/30271693/converting-between-cartesian-coordinates-and-spherical-coordinates
 this.radius = sqrt((x*x) + (y*y) + (z*z));
 this.inclination = arccos(z / this.radius);
 this.azimuth = atan2(y, x);
 this.x = this.radius * sin(this.inclination) * cos(this.azimuth);
 this.y = this.radius * sin(this.inclination) * sin(this.azimuth);
 this.z = this.radius * cos(this.inclination);

 Fry convention:
 x is horizontal, left to right positive to the right
 y is vertical, postive is up
 z is nearer and further away, postive is further away

 */
    static ria_to_xyz(radius, inclination, azimuth){
        return [radius * Math.sin(inclination) * Math.cos(azimuth), //x
            radius * Math.sin(inclination) * Math.sin(azimuth), //y
            radius * Math.cos(inclination)]                     //z
    }
    static xyz_to_ria(x, y, z){
        var radius = Math.sqrt((x*x) + (y*y) + (z*z))
        return [radius,
            Math.arccos(z / radius), //inclination
            Math.atan2(y, x)        //asimuth
        ]
    }

    static add_xyzs(xyz1, xyz2){
        var result = []
        result.push(xyz1[0] + xyz2[0])
        result.push(xyz1[1] + xyz2[1])
        result.push(xyz1[1] + xyz2[1])
        return result
    }

    static distance (xyz1, xyz2){
        return Math.hypot(xyz1[0] - xyz2[0], xyz1[1] - xyz2[1], xyz1[2] - xyz2[2])
    }

    static is_simulator_showing(){
        if(globalThis["sim_graphics_pane_id"]) { return true }
        else { return false }
    }

    // 2 * Math.PI  radians == 360 degrees
    // (2 * Math.PI) / 360  == 0.017453292519943295  radians per degree
    // 0.00000484813681109536 radians per arc_second
    //not called in dde4
    static arc_seconds_to_radians(arc_seconds){
        return 0.00000484813681109536 * arc_seconds
    }

    static degrees_to_radians(degrees){
        return (Math.PI * degrees ) / 180
    }


    //ds_inst is an instance of DexterSim class.
    //robot_name example: "dexter0"
    //if move_kind === "j", new_angles_dexter_units is an array of 6.
    static render_multi(ds_instance, new_angles_dexter_units, robot_name, dur_in_ms=0, move_kind="a"){ //inputs in arc_seconds
        //console.log("render_multi passed: " +  new_angles_dexter_units)
        //onsole.log("Dexter.default: " + Dexter.default)
        //onsole.log("Dexter.dexter0: " + Dexter.dexter0)
        if (Dexter.default.name === robot_name){
            let dur_to_show = Math.round(dur_in_ms / 100) //in 10ths of seconds, rounded
            dur_to_show = "" + dur_to_show
            if (dur_to_show.length > 1) {
                let dur_to_show_secs = dur_to_show.substring(0, dur_to_show.length - 1)
                dur_to_show = dur_to_show_secs + "." + last(dur_to_show)
            }
            else { dur_to_show = "0." + dur_to_show }
            if(this.is_simulator_showing()) {
                sim_pane_move_dur_id.innerHTML = dur_to_show
            }
            let total_frames = Math.ceil(dur_in_ms / SimUtils.ms_per_frame) //total_frames might be 0. that's ok.
            let js_inc_per_frame = []
            for(let joint = 0; joint < new_angles_dexter_units.length; joint++){
                let j_diff = new_angles_dexter_units[joint] - this.prev_joint_angles[joint]
                js_inc_per_frame.push(j_diff / total_frames)
            }
            //let prev_js = this.prev_joint_angles.slice(0)
            let rob = Dexter[robot_name]
            let prev_js = ds_instance.angles_dexter_units.slice() //must copy because render_multi is going to continuous update mesured_angels per frame and we want to capture the prev_js and keep it constant
            //console.log("calling render_multi_frame first time with new_angles as: " + new_angles_dexter_units + " prev_js: " + prev_js + " js_inc_per_frame: " + js_inc_per_frame)
            SimUtils.render_multi_frame(ds_instance, new_angles_dexter_units, prev_js, js_inc_per_frame, total_frames, 0, rob, move_kind) //beginning an all but last rendering

            //used by render_once_but_only_if_have_prev_args\
            this.prev_joint_angles     = new_angles_dexter_units
            //SimUtils.prev_robot_status = robot_status //not use by  render_multi or render_multi_frame
            SimUtils.prev_robot_name   = robot_name
        }
        else {
            setTimeout(function(){
                    if(move_kind === "a") {
                        ds_instance.queue_instance.done_with_instruction() //this is the final action of
                        //calling SimUtils.render_multi_frame, and necessary to get this instruction
                        //out of the queue. Must do even if we aren't redendering (ie calling SimUtils.render_multi_frame)
                    }
                    else if(move_kind === "j") {
                        ds_instance.queuej_instance.done_with_instruction()
                    }
                    else { shouldnt("SimUtils.render_multi got invalid move_kind of: " + move_kind)}
                }, dur_in_ms)
        }
    }
    //new_js is the array of target joint angles, only used for the "last" frame.
    //new_js and prev_js are in arcseconds. prev_js
    //For given new commanded angles of an instrution, this fn is called many times, with a dur of ms_per_frame
    //between the calls. All args remain the same for such calls except for frame, which is incremented from
    //0 up to total_frames. Once its called with frame == total_frames, it immediately stops the recursive calls.
    static render_multi_frame(ds_instance, new_angles_dexter_units, prev_js, js_inc_per_frame, total_frames, frame_number=0, rob, move_kind="a"){
        if((frame_number > total_frames) || ds_instance.queuej_instance.stop_ongoing) { //we're done
            if(move_kind === "a") {
                ds_instance.queue_instance.done_with_instruction() //this is the final action of
                //calling SimUtils.render_multi_frame, and necessary to get this instruction
                //out of the queue. Must do even if we aren't redendering (ie calling SimUtils.render_multi_frame)
            }
            else if(move_kind === "j") {
                ds_instance.queuej_instance.stop_ongoing = false
                ds_instance.queuej_instance.done_with_instruction()
            }
            else { shouldnt("SimUtils.render_multi got invalid move_kind of: " + move_kind)}        }
        else{
            //if(platform === "node") { //job engine but this doesn't work
            //    out("Moving Dexter's Joints to: " + new_angles_dexter_units)
            //}
            let new_angles = []
            let xyz
            let len_for_min
            if(move_kind === "a")  len_for_min = 5
            else if (move_kind === "j") len_for_min = 6
            else { shouldnt("SimUtils.render_multi_frame got invalid move_kind of: " + move_kind)}

            let prev_js_useful_len = Math.min(len_for_min, prev_js.length) //for "a" moves, we do not handle j6 & 7 here. That's done with render_j6_plus
            for(let joint = 0; joint < prev_js_useful_len; joint++){
                let prev_j = prev_js[joint]
                let j_inc_per_frame = js_inc_per_frame[joint] //might be undefined for j6 and 7
                let inc_to_prev_j = frame_number * j_inc_per_frame
                let j_angle = prev_j + (Number.isNaN(inc_to_prev_j) ? 0 : inc_to_prev_j) //j_angle is in arcseconds
                ds_instance.angles_dexter_units[joint] = j_angle
                //if(joint === 0) { out("J" + joint + ": inc_to_prev_j: " + Math.round(inc_to_prev_j) +
                //                      " j_angle as: "  +  Math.round(j_angle) +
                //                      " j_angle deg: " + (Math.round(j_angle) / 3600 ))
                //}
                let angle_degrees = Socket.dexter_units_to_degrees(j_angle, joint + 1)
                if((joint === 1) || (joint === 2) || (joint === 3)) {//&& Simulate.sim.hi_rez //Simulate not in job engine, and doesn't really matter here so don't check this, just do the computation
                    angle_degrees *= -1
                }
                new_angles.push(angle_degrees)
            } //end for loop

            this.render_j1_thru_j5(ds_instance, move_kind)
            setTimeout(function() {
                SimUtils.render_multi_frame(ds_instance, new_angles_dexter_units, prev_js, js_inc_per_frame, total_frames, frame_number + 1, rob, move_kind)
            }, SimUtils.ms_per_frame)
        }
    }

    //never called in a job engine job, only called by dde_ide for "debugging".
    static render_joints_smart(src = null) {
        let evaled_src
        if (src == null) {
            src = Editor.get_any_selection().trim()
        }
        if (typeof(src) !== "string"){ evaled_src = src }
        else { //src is a string
            src = src.trim()
            if (src.endsWith(",")) {
                src = src.substring(0, src.length - 1) //cut off the trailing commaa
            }
            if (src.length === 0) {
                warning("To render joints you must select some text in the editor pane that indicates an array of joint angles.")
                return false
            } else {
                try {
                    evaled_src = globalThis.eval(src) //note: if src is "2,3,4" then eval returns 4. This problem is handled way below
                } catch (err) {
                    let joint_arr_maybe = this.render_joints_process_arg_list(src)
                    if (Utils.is_array_of_numbers(joint_arr_maybe)) {
                        evaled_src = joint_arr_maybe
                    } else {
                        warning(src + " did not evaluate to an array of joint angles.")
                        return false
                    }
                }
            }
        }
        //at this point, eval_src is not a string and maybe valid,
        //but we still might have to call render_joints_process_arg_list(src) again.
        let angle_degrees
        if(Utils.is_array_of_numbers(evaled_src)){
                angle_degrees = evaled_src
        }
        else {
            let angle_degrees_maybe = this.render_joints_process_instruction(evaled_src)
            if(Utils.is_array_of_numbers(angle_degrees_maybe)) {
                angle_degrees = angle_degrees_maybe
            }
            else {
                let angle_degrees_maybe = this.render_joints_process_arg_list(src)
                if (Utils.is_array_of_numbers(angle_degrees_maybe)) {
                    angle_degrees = angle_degrees_maybe
                }
                else {
                    warning(src + " did not evaluate to an array of joint angles.")
                    return false
                }
            }
        }
        //at this point, angle_degrees is an array of numbers.
        if(angle_degrees.length === 3){ //maybe its x, y z ?
            if(Kin.is_in_reach(angle_degrees)){
                angle_degrees = Kin.xyz_to_J_angles(angle_degrees) //this will error with [0,0,0] (singluarity) or out of range.
                //that's  not terrible as we just want to keep the orign angle_degrees and use them
                //as joint angles, but we do get a red error message in dde due to it.
            }
        }
        for(let i = 0; angle_degrees.length < 5; i++){
            angle_degrees.push(0)
        }
        this.render_joints(angle_degrees)
        return angle_degrees
    }
    

    static render_joints_process_arg_list(src){
        let split_src = src.split(",")
        let joint_arr_maybe = []
        for(let item of split_src){
            try {
                let num = globalThis.eval(item)
                if(typeof(num) === "number") { joint_arr_maybe.push(num)}
                else {return false }
            }
            catch(err){ return false}
        }
        return joint_arr_maybe
    }

    static render_joints_process_instruction(joint_arr_maybe){
        if ((joint_arr_maybe instanceof Instruction.Dexter.move_all_joints) ||
            (joint_arr_maybe instanceof Instruction.Dexter.pid_move_all_joints)){
            if(!Kin.check_J_ranges(joint_arr_maybe.array_of_angles)) {
                dde_error("Angles of: " + joint_arr_maybe.array_of_angles + " are not within Dexter's reach.")
            }
            return joint_arr_maybe.array_of_angles
        }
        else if ((joint_arr_maybe instanceof Instruction.Dexter.move_to) ||
                 (joint_arr_maybe instanceof Instruction.Dexter.pid_move_to)  ||
                 (joint_arr_maybe instanceof Instruction.Dexter.move_to_straight)){
            let xyz = joint_arr_maybe.xyz
            if(!Kin.is_in_reach(xyz)) {
                dde_error("The XYZ position of: " + xyz + " is not within Dexter's reach.")
            }
            else {
                return Kin.xyz_to_J_angles(
                    joint_arr_maybe.xyz,
                    joint_arr_maybe.J5_direction,
                    joint_arr_maybe.config,
                    joint_arr_maybe.workspace_pose
                )
            }
        }
        else { return false }
    }

    //called by render_j1_thru_j5 as well as monitor_dexter
    static render_joints(angle_degrees_array, rob_pose=Vector.make_pose(), move_kind = "a"){
        for(let i = 0; i < angle_degrees_array.length; i++){
            let angle_degrees = angle_degrees_array[i]
            this.render_joint(i + 1, angle_degrees, move_kind)
        }
        let xyz = Kin.J_angles_to_xyz(angle_degrees_array, rob_pose)[0]

        let str_length
        let x = xyz[0]
        if(x < 0) { str_length = 6} //so we get the minus sign plus 3 digits after decimal point, ie MM
        else      { str_length = 5}
        if(this.is_simulator_showing()) {
            sim_pane_x_id.innerHTML = ("" + x).substring(0, str_length)
        }
        let y = xyz[1]
        if(y < 0) { str_length = 6} //so we get the minus sign plus 3 digits after decimal point, ie MM
        else      { str_length = 5}
        if(this.is_simulator_showing()) {
            sim_pane_y_id.innerHTML = ("" + y).substring(0, str_length)
        }
        let z = xyz[2]
        if(z < 0) { str_length = 6} //so we get the minus sign plus 3 digits after decimal point, ie MM
        else      { str_length = 5}
        if(this.is_simulator_showing()) {
            sim_pane_z_id.innerHTML = ("" + z).substring(0, str_length)
        }

        //if(this.is_simulator_showing()) {
        //    Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera)
        //}
        // SimUtils.render()
    }

    //joint number is 1 thru 7
    static render_joint(joint_number, angle_degrees, move_kind="a"){
        if((joint_number <= 5) || (move_kind === "j")) {
            let y_or_z = (((joint_number === 1) || (joint_number === 5)) ? "y" : "z")
            let j_angle_degrees_rounded = Math.round(angle_degrees)
            let rads = SimUtils.degrees_to_radians(angle_degrees)
            let id_str = "J" + joint_number
            if(this.is_simulator_showing()) {
                Simulate.sim[id_str].rotation[y_or_z] = rads * -1
                globalThis["sim_pane_j" + joint_number + "_id"].innerHTML = j_angle_degrees_rounded
            }
        }
        else if(joint_number === 6){
            let rads = SimUtils.degrees_to_radians(angle_degrees)
            let j_angle_degrees_rounded = Math.round(angle_degrees)
            if(this.is_simulator_showing()) {
                if (Simulate.sim.J6) {
                    Simulate.sim.J6.rotation.z = rads
                }
                sim_pane_j6_id.innerHTML = j_angle_degrees_rounded
            }
        }
        else if(joint_number === 7){
            let rads = SimUtils.degrees_to_radians(angle_degrees)
            let j_angle_degrees_rounded = Math.round(angle_degrees)
            if(this.is_simulator_showing()) {
                if (Simulate.sim.J7) { //330 degrees = 0.05 meters
                    let new_xpos = ((angle_degrees * 0.05424483315198377) / 296) * -1 //more precise version from James W aug 25.
                    new_xpos *= 10
                    Simulate.sim.J7.position.setX(new_xpos) //see https://threejs.org/docs/#api/en/math/Vector3
                }
                sim_pane_j7_id.innerHTML = j_angle_degrees_rounded
            }
        }
    }


    //angles_in_degrees array of len 5. first elt is J1.
    //actually draws the graphics, but nothing else.
    //called both by render_multi_frame and in dextersim for super cheap handling of "P" (pid_move_all_joints)
    /*static render_j1_thru_j5(ds_instance, rob_pose){
            let angles_in_degrees = ds_instance.compute_measured_angles_degrees()
            let rob_pos = ds_instance.robot.pose

            let angle_degrees, j_angle_degrees_rounded, rads

            angle_degrees = angles_in_degrees[0] //Joint 1

            j_angle_degrees_rounded = Math.round(angle_degrees)
            rads = SimUtils.degrees_to_radians(angle_degrees)
            Simulate.sim.J1.rotation.y = rads * -1
            sim_pane_j1_id.innerHTML = j_angle_degrees_rounded

            angle_degrees = angles_in_degrees[1] //Joint 2
            j_angle_degrees_rounded = Math.round(angle_degrees)
            rads = SimUtils.degrees_to_radians(angle_degrees)
            Simulate.sim.J2.rotation.z = rads * -1
            sim_pane_j2_id.innerHTML = j_angle_degrees_rounded

            angle_degrees = angles_in_degrees[2] //Joint 3
            j_angle_degrees_rounded = Math.round(angle_degrees)
            rads = SimUtils.degrees_to_radians(angle_degrees)
            Simulate.sim.J3.rotation.z = rads * -1
            sim_pane_j3_id.innerHTML = j_angle_degrees_rounded

            angle_degrees = angles_in_degrees[3] //Joint 4
            j_angle_degrees_rounded = Math.round(angle_degrees)
            rads = SimUtils.degrees_to_radians(angle_degrees)
            Simulate.sim.J4.rotation.z = rads * -1
            sim_pane_j4_id.innerHTML = j_angle_degrees_rounded

            angle_degrees = angles_in_degrees[4] //Joint 5
            j_angle_degrees_rounded = Math.round(angle_degrees)
            rads = SimUtils.degrees_to_radians(angle_degrees)
            Simulate.sim.J5.rotation.y = rads * -1
            sim_pane_j5_id.innerHTML = j_angle_degrees_rounded

            let xyz = Kin.J_angles_to_xyz(angles_in_degrees, rob_pose)[0]

            let str_length
            let x = xyz[0]
            if(x < 0) { str_length = 6} //so we get the minus sign plus 3 digits after decimal point, ie MM
            else      { str_length = 5}
            sim_pane_x_id.innerHTML = ("" + x).substring(0, str_length)

            let y = xyz[1]
            if(y < 0) { str_length = 6} //so we get the minus sign plus 3 digits after decimal point, ie MM
            else      { str_length = 5}
            sim_pane_y_id.innerHTML = ("" + y).substring(0, str_length)

            let z = xyz[2]
            if(z < 0) { str_length = 6} //so we get the minus sign plus 3 digits after decimal point, ie MM
            else      { str_length = 5}
            sim_pane_z_id.innerHTML = ("" + z).substring(0, str_length)

            Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera)
    }*/

    static render_j1_thru_j5(ds_instance, move_kind = "a"){
        let angles_in_degrees = ds_instance.compute_measured_angles_degrees()
        let ang_len = ((move_kind === "j") ? 6: 5)
        angles_in_degrees = angles_in_degrees.slice(0, ang_len) //we only want the first 5.
        let rob_pos = ds_instance.robot.pose
        this.render_joints(angles_in_degrees, rob_pos, move_kind)
    }

    //same level as render_multi but for one of j6 or j7.
    static render_j6_plus(ds_instance, new_angle_dexter_units, robot_name, dur_in_ms=0, joint_number=7){
        if (Dexter.default.name === robot_name){
            let total_frames = Math.ceil(dur_in_ms / SimUtils.ms_per_frame)
            let prev_js = ds_instance.angles_dexter_units[joint_number - 1]
            let j_diff = new_angle_dexter_units - prev_js //this.prev_joint_angles[joint]
            let js_inc_per_frame = ((total_frames === 0) ? 0 : (j_diff / total_frames))
             //let prev_js = this.prev_joint_angles.slice(0)
            let rob = Dexter[robot_name]
            //console.log("calling render_j6_plus first time with new_angles as: " + new_angle_dexter_units + " prev_js: " + prev_js + " js_inc_per_frame: " + js_inc_per_frame)
            let render_j6_plus_frame_call = function(){
                SimUtils.render_j6_plus_frame(ds_instance, new_angle_dexter_units, js_inc_per_frame,
                                              total_frames, 0, rob, joint_number)
            }
            this.render_j6_plus_frame_outer(ds_instance, joint_number, render_j6_plus_frame_call)
        }
    }

    //joint_number: usually 6 or 7
    //render_j6_plus_frame_call a closure of no args that calls render_j6_plus_frame
    //If there is an ongoing call to render_j6_plus_frame,
    // then that ongoing call to render_j6_plus_frame will stop it and call render_j6_plus_frame_call,
    //otherwise, no ongoing call to stop so just call render_j6_plus_frame_call,
    static render_j6_plus_frame_outer(ds_instance, joint_number, render_j6_plus_frame_call){
        let call_map = ds_instance.queue_instance.joint_number_to_render_j6_plus_frame_call_map
        let the_call = call_map[joint_number]
        if(!the_call) { //no ongoing call to render_j6_plus_frame, so no need to stop one in progess.
            call_map[joint_number] = true //true indicates there is, (just to be started) an ongoing call, but no "next call"
            render_j6_plus_frame_call.call(this)
        }
        else if (the_call === true) { //there is an ongoing call, so have render_j6_plus_frame stop it then call the new render_j6_plus_frame_call
            call_map[joint_number] = render_j6_plus_frame_call
        }
        else if (typeof(the_call) === "function") { //unusual but could happen. there is an ongoing call, AND a "next call", but that
               //next_call hasn't been called yet, so overwrite it in the map, and have the ongoing call
               //stop. No need to bother with the exiting "next" call as we've got a new one
               //that superseeds it.
            call_map[joint_number] = render_j6_plus_frame_call
        }
        else {
            shouldnt("render_j6_plus_frame_outer found the_call of: " + the_call + " which is not undefined, not true and not a function.")
        }
    }



    static render_j6_plus_frame(ds_instance, new_angle_dexter_units, js_inc_per_frame,
                                total_frames, frame_number=0, rob, joint_number){
        let call_map = ds_instance.queue_instance.joint_number_to_render_j6_plus_frame_call_map
        let render_j6_plus_frame_call = call_map[joint_number]
        if(frame_number >= total_frames) { //we're done, normal
            if(render_j6_plus_frame_call === true) {
                ds_instance.queue_instance.done_with_j6_plus_instruction(joint_number) //updates j6 or j7 status
                call_map[joint_number] = undefined //all done with this call to render_j6_plus_frame

            }
            else if (typeof(render_j6_plus_frame_call === "function")) {
                ds_instance.queue_instance.done_with_j6_plus_instruction(joint_number) //updates j6 or j7 status
                call_map[joint_number] = undefined
                this.render_j6_plus_frame_outer(ds_instance, joint_number, render_j6_plus_frame_call)
            }
            else {
                shouldnt("In render_j6_plus_frame with joint_number: " + joint_number +
                         " done with instruction but invalid render_j6_plus_frame_call: " + render_j6_plus_frame_call)
            }
        }
        else if (typeof(render_j6_plus_frame_call) === "function") { //stop the current call early and switch to the new one
            ds_instance.queue_instance.done_with_j6_plus_instruction(joint_number) //updates j6 or j7 status
            call_map[joint_number] = undefined
            this.render_j6_plus_frame_outer(ds_instance, joint_number, render_j6_plus_frame_call)
        }
        else{
            let ma_du   = ds_instance.angles_dexter_units
            let prev_js = ma_du[joint_number - 1]     //grab the old
            let j_angle = prev_js + js_inc_per_frame  //compute the new
            ma_du[joint_number - 1] = j_angle         //set ds_instance.angles_dexter_units for all to see
            //undate the graphics of the simulation
            let angle_degrees = Socket.dexter_units_to_degrees(j_angle, joint_number)
            let rads = SimUtils.degrees_to_radians(angle_degrees)
            let j_angle_degrees_rounded = Math.round(angle_degrees)
            switch(joint_number) {
                case 6:
                    /*if(sim.J6) {
                        sim.J6.rotation.z = rads
                    }
                    sim_pane_j6_id.innerHTML = j_angle_degrees_rounded
                    */
                    this.render_j6(ds_instance)
                    break;
                case 7:
                    /*if(sim.J7) { //330 degrees = 0.05 meters
                        let new_xpos = ((angle_degrees * 0.05424483315198377) / 296) * -1 //more precise version from James W aug 25.
                        new_xpos *= 10
                        //out("J7 angle_degrees: " + angle_degrees + " new xpos: " + new_xpos)
                        sim.J7.position.setX(new_xpos) //see https://threejs.org/docs/#api/en/math/Vector3
                        //all below fail to change render
                        //sim.J7.position.x = new_pos
                        //sim.J7.updateMatrix() //no effect
                        //sim.j7.updateWorldMatrix(true, true)
                        // prev new_pos value;
                        // ((angle_degrees * 0.05) / 330 ) * -1 //meters of new location
                        // but has the below problems
                        // x causes no movement, but at least inited correctly
                        // y sends the finger to move to outer space upon init, but still visible, however moving j7 doesn't move it
                        // z causes the finger to be somewhat dislocated upon dui init, however moving j7 doesn't move it
                        //sim.J7.rotation.y = rads
                    }
                    sim_pane_j7_id.innerHTML = j_angle_degrees_rounded
                    if(globalThis.SimBuild) {
                        let new_angles = []
                        for(let i = 0; i < 5; i++) {
                            let ang_du = ma_du[i]
                            let ang_deg = Socket.dexter_units_to_degrees(ang_du, joint_number)
                            new_angles.push(ang_deg)
                        }
                        let xyz = Kin.J_angles_to_xyz(new_angles, rob.pose)[0]
                        SimBuild.handle_j7_change(angle_degrees, xyz, rob)
                    }
                    */
                    this.render_j7(ds_instance)
                    break;
            } //end switch
            //sim.renderer.render(sim.scene, sim.camera) //maybe not needed

            //figure out whether to loop, or start new commanded angle
            if (render_j6_plus_frame_call === true){ //just keep going
                 setTimeout(function() {
                    SimUtils.render_j6_plus_frame(ds_instance, new_angle_dexter_units, js_inc_per_frame, total_frames, frame_number + 1, rob, joint_number)
                }, SimUtils.ms_per_frame)
            }
            else {
               shouldnt("render_j6_plus_frame found render_j6_plus_frame_call of: " + render_j6_plus_frame_call +
                        "which is not true and not a function.")
            }
        }
    }

    static render_j6(ds_instance){
        let angle_degrees = ds_instance.compute_measured_angle_degrees(6)
        let rads = SimUtils.degrees_to_radians(angle_degrees)
        let j_angle_degrees_rounded = Math.round(angle_degrees)
        if(this.is_simulator_showing()) {
            if (Simulate.sim.J6) {
                Simulate.sim.J6.rotation.z = rads
                //Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera)
                // SimUtils.render()
            }
            sim_pane_j6_id.innerHTML = j_angle_degrees_rounded
        }
    }

    static render_j7(ds_instance){ //xyz only needs to be passed in if using SimBuild
        let angles_in_degrees = ds_instance.compute_measured_angles_degrees()
        let j7_angle_degrees = angles_in_degrees[6]
        let rads = SimUtils.degrees_to_radians(j7_angle_degrees)
        let j7_angle_degrees_rounded = Math.round(j7_angle_degrees)
        if(this.is_simulator_showing()) {
            if (Simulate.sim.J7) { //a THREE Object3D, i.e. there is a J7.    330 degrees = 0.05 meters
                let new_xpos = ((j7_angle_degrees * 0.05424483315198377) / 296) * -1 //more precise version from James W aug 25.
                new_xpos *= 10
                //out("J7 j7_angle_degrees: " + j7_angle_degrees + " new xpos: " + new_xpos)
                Simulate.sim.J7.position.setX(new_xpos) //see https://threejs.org/docs/#api/en/math/Vector3
                //Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera)
                // SimUtils.render()
            }
            sim_pane_j7_id.innerHTML = j7_angle_degrees_rounded
            if (SimObj && SimObj.user_objects && SimObj.user_objects.length > 0) {
                let rob        = ds_instance.robot
                let rob_pose   = rob.pose
                let xyz        = Kin.J_angles_to_xyz(angles_in_degrees, rob_pose)[0]
                SimBuild.handle_j7_change(j7_angle_degrees, xyz, rob)
            }
        }
    }

    //no longer called by SimObj.js, but calls "render" instead
    /*static render_once_with_prev_args_maybe(){
        if(this.prev_robot_status){
            this.render_once(SimUtils.prev_robot_status,
                             SimUtils.prev_robot_name)
        }
        else {
            if (this.is_simulator_showing()) {
                Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera)
            } //just the initial condition, dex straight up
        }
        }
    */

    /*was called from video.js, but now we use SimUtils.render()
    static render_multi_with_prev_args_maybe(){
        if(this.prev_robot_status){
            this.render_multi(SimUtils.prev_robot_status,
                SimUtils.prev_robot_name)
        }
        else {
            if (this.is_simulator_showing()) {
                Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera)
            }
        } //just the initial condition, dex straight up
    }*/

    static render(){
        debugger;
        console.log("WARNING: RENDER FUNCTION CALLED!")
        //if comment this out then comment in related code at bottom of Simulate.init_simulation
        //but when I comment this out and leave in the use of render_used_in_loop
        //bottom of Simulate.init_simulation, the rednering of Dexter in sim pane
        //is all screwed up with missing pieces and alignment.
        //So seems rendant to have both but that's what seems to work.
    }


    /* apparently not called May 2, 2022 use SimUtils.is_simulator_showing() instead
    static is_shown(){
        if(globalThis["sim_graphics_pane_id"]) { return true }
        else { return false }
    }*/

    static inspect_dexter_sim_instance(robot_name){
        if(!robot_name) {
            robot_name = default_dexter_name_id.value
            if(!robot_name.startsWith("Dexter.")) {
                robot_name = "Dexter." + Dexter.default.name
            }
        }
        if(robot_name.startsWith("Dexter.")) {
            robot_name = robot_name.substring(7)
        }
        if(!DexterSim.robot_name_to_dextersim_instance_map){
            warning('Sorry, no simulation has been run on: ' + robot_name + ' yet.<br/>' +
                "Run a job using " + robot_name + " before requesting this information.")
        }
        else {
            let dextersim_inst = DexterSim.robot_name_to_dextersim_instance_map[robot_name]
            if(!dextersim_inst){
                warning('Sorry, no simulation has been run on "robot_name" yet.<br/>' +
                        "Run a job using" + robot_name + " before requesting this information.")
            }
            else {
                inspect(dextersim_inst)
            }
        }
    }
    static prev_joint_angles = [0, 0, 0, 0, 0, 0, 0]
    static prev_robot_status = null
    static prev_robot_name   = null
    static ms_per_frame      = 33 //1000 / 60//60 fps, what THREEEjs renders at  //33 //30 frames per second
}


globalThis.SimUtils = SimUtils



