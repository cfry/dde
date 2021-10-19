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
        if(window["sim_graphics_pane_id"]) { return true }
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
    //robot_name example: "Dexter.dexter0"
    static render_multi(ds_instance, new_angles_dexter_units, robot_name, dur_in_ms=0){ //inputs in arc_seconds
        //console.log("render_multi passed: " +  new_angles_dexter_units)
        if (Dexter.default.name === robot_name){
            let dur_to_show = Math.round(dur_in_ms / 100) //in 10ths of seconds, rounded
            dur_to_show = "" + dur_to_show
            if (dur_to_show.length > 1) {
                let dur_to_show_secs = dur_to_show.substring(0, dur_to_show.length - 1)
                dur_to_show = dur_to_show_secs + "." + last(dur_to_show)
            }
            else { dur_to_show = "0." + dur_to_show }
            sim_pane_move_dur_id.innerHTML = dur_to_show
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
            SimUtils.render_multi_frame(ds_instance, new_angles_dexter_units, prev_js, js_inc_per_frame, total_frames, 0, rob) //beginning an all but last rendering

            //used by render_once_but_only_if_have_prev_args\
            this.prev_joint_angles     = new_angles_dexter_units
            //SimUtils.prev_robot_status = robot_status //not use by  render_multi or render_multi_frame
            SimUtils.prev_robot_name   = robot_name
        }
        else {
            setTimeout(function(){
                ds_instance.queue_instance.done_with_instruction() //this is the final action of
                //calling SimUtils.render_multi_frame, and necessary to get this instruction
                //out of the queue. Must do even if we aren't redendering (ie calling SimUtils.render_multi_frame)
            }, dur_in_ms)
        }
    }
    //new_js is the array of target joint angles, only used for the "last" frame.
    //new_js and prev_js are in arcseconds. prev_js
    //For given new commanded angles of an instrution, this fn is called many times, with a dur of ms_per_frame
    //between the calls. All args remain the same for such calls except for frame, which is incremented from
    //0 up to total_frames. Once its called with frame == total_frames, it immediately stops the recursive calls.
    static render_multi_frame(ds_instance, new_angles_dexter_units, prev_js, js_inc_per_frame, total_frames, frame_number=0, rob){
        if(frame_number > total_frames) { //we're done
            ds_instance.queue_instance.done_with_instruction() //removes the cur instruction_array from queue and if there's more, starts the next instruction.
        }
        else{
            let new_angles = []
            let xyz
            let prev_js_useful_len = Math.min(5, prev_js.length) //we do not handle j6 & 7 here. That's done with render_j6_plus
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
                if(((joint === 1) || (joint === 2) || (joint === 3)) &&
                    Simulate.sim.hi_rez) {
                    angle_degrees *= -1
                }
                new_angles.push(angle_degrees)

               /* let j_angle_degrees_rounded = Math.round(angle_degrees)
                let rads = SimUtils.degrees_to_radians(angle_degrees)

                switch(joint) {
                    case 0:
                        Simulate.sim.J1.rotation.y = rads * -1
                        sim_pane_j1_id.innerHTML = j_angle_degrees_rounded
                        break;
                    case 1:
                        Simulate.sim.J2.rotation.z = rads
                        sim_pane_j2_id.innerHTML = j_angle_degrees_rounded * -1
                        break;
                    case 2:
                        Simulate.sim.J3.rotation.z = rads
                        sim_pane_j3_id.innerHTML = j_angle_degrees_rounded * -1
                        break;
                    case 3:
                        Simulate.Simulate.sim.J4.rotation.z = rads
                        sim_pane_j4_id.innerHTML = j_angle_degrees_rounded * -1
                        break;
                    case 4:
                        Simulate.sim.J5.rotation.y = rads * -1
                        xyz = Kin.J_angles_to_xyz(new_angles, rob.pose)[0] //needed in case 6 and below
                        sim_pane_j5_id.innerHTML = j_angle_degrees_rounded
                        break;
                    case 5:
                        if(Simulate.sim.J6) {
                            Simulate.sim.J6.rotation.z = rads
                        }
                        sim_pane_j6_id.innerHTML = j_angle_degrees_rounded
                        break;
                    case 6:
                        if(Simulate.sim.J7) { //330 degrees = 0.05 meters
                           let new_xpos = ((angle_degrees * 0.05424483315198377) / 296) * -1 //more precise version from James W aug 25.
                           new_xpos *= 10
                           //out("J7 angle_degrees: " + angle_degrees + " new xpos: " + new_xpos)
                           Simulate.sim.J7.position.setX(new_xpos) //see https://threejs.org/docs/#api/en/math/Vector3
                           //all below fail to change render
                           //Simulate.sim.J7.position.x = new_pos
                           //Simulate.sim.J7.updateMatrix() //no effect
                           //Simulate.sim.j7.updateWorldMatrix(true, true)
                                // prev new_pos value;
                                // ((angle_degrees * 0.05) / 330 ) * -1 //meters of new location
                                // but has the below problems
                                // x causes no movement, but at least inited correctly
                                // y sends the finger to move to outer space upon init, but still visible, however moving j7 doesn't move it
                                // z causes the finger to be somewhat dislocated upon dui init, however moving j7 doesn't move it
                           //sim.J7.rotation.y = rads
                        }
                        sim_pane_j7_id.innerHTML = j_angle_degrees_rounded
                        if(window.SimBuild) {
                             SimBuild.handle_j7_change(angle_degrees, xyz, rob)
                        }
                        break;
                } */ //end switch
            } //end for loop
           /* let str_length
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

            //ds_instance.queue_instance.update_show_queue_if_shown() //I *could* do this here and update
            //the current instruction row based on ds_instance.measured_angles_dexter_units
            //but update_show_queue_if_shown just uses the instruction_array's commanded angles and
            //besides, you can see J angles updated every frame in the Sim pane's header.
            //Best to just leave the queue sim alone until actual whole instructions in queue change.
            sim.renderer.render(sim.scene, sim.camera) //tell the graphis to finally draw.
            */
            this.render_j1_thru_j5(ds_instance)
            setTimeout(function() {
                SimUtils.render_multi_frame(ds_instance, new_angles_dexter_units, prev_js, js_inc_per_frame, total_frames, frame_number + 1, rob, false)
            }, SimUtils.ms_per_frame)
        }
    }

    //angles_in_degrees array of len 5. first elt is J1.
    //actually draws the graphics, but nothing else.
    //called both by render_multi_frame and in dextersim for super cheap handling of "P" (pid_move_all_joints)
    static render_j1_thru_j5(ds_instance, rob_pose){
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

            let xyz = Kin.J_angles_to_xyz(angles_in_degrees, rob_pose)[0] //needed in case 6 and below

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
            ma_du[joint_number - 1] = j_angle         //set it for all to see
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
                    if(window.SimBuild) {
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
                    if(SimBuild.template_object) {
                        let xyz = Kin.J_angles_to_xyz(new_angles, rob.pose)[0]
                        this.render_j7(ds_instance, xyz)
                    }
                    else {
                        this.render_j7(ds_instance)
                    }
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
        if(Simulate.sim.J6) {
            Simulate.sim.J6.rotation.z = rads
        }
        sim_pane_j6_id.innerHTML = j_angle_degrees_rounded
    }

    static render_j7(ds_instance, xyz){ //xyz only needs to be passed in if using SimBuild
        let angle_degrees = ds_instance.compute_measured_angle_degrees(7)
        let rads = SimUtils.degrees_to_radians(angle_degrees)
        let j_angle_degrees_rounded = Math.round(angle_degrees)
        if(Simulate.sim.J7) { //330 degrees = 0.05 meters
            let new_xpos = ((angle_degrees * 0.05424483315198377) / 296) * -1 //more precise version from James W aug 25.
            new_xpos *= 10
            //out("J7 angle_degrees: " + angle_degrees + " new xpos: " + new_xpos)
            Simulate.sim.J7.position.setX(new_xpos) //see https://threejs.org/docs/#api/en/math/Vector3
            //all below fail to change render
            //Simulate.sim.J7.position.x = new_pos
            //Simulate.sim.J7.updateMatrix() //no effect
            //Simulate.sim.j7.updateWorldMatrix(true, true)
            // prev new_pos value;
            // ((angle_degrees * 0.05) / 330 ) * -1 //meters of new location
            // but has the below problems
            // x causes no movement, but at least inited correctly
            // y sends the finger to move to outer space upon init, but still visible, however moving j7 doesn't move it
            // z causes the finger to be somewhat dislocated upon dui init, however moving j7 doesn't move it
            //Simulate.sim.J7.rotation.y = rads
        }
        sim_pane_j7_id.innerHTML = j_angle_degrees_rounded
        if(SimBuild.template_object) {
            let rob_pose = ds_instance.robot.pose
            SimBuild.handle_j7_change(angle_degrees, xyz, rob_pose)
        }
    }

    //called by simx.js
    static render_once_with_prev_args_maybe(){
        if(this.prev_robot_status){
            this.render_once(SimUtils.prev_robot_status,
                             SimUtils.prev_robot_name)
        }
        else { Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera) } //just the initial condition, dex straight up
    }

    //called from video.js
    static render_multi_with_prev_args_maybe(){
        if(this.prev_robot_status){
            this.render_multi(SimUtils.prev_robot_status,
                SimUtils.prev_robot_name)
        }
        else { Simulate.sim.renderer.render(Simulate.sim.scene, Simulate.sim.camera) } //just the initial condition, dex straight up
    }

    static is_shown(){
        if(window["sim_graphics_pane_id"]) { return true }
        else { return false }
    }

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
    static ms_per_frame      = 33 //30 frames per second
}


globalThis.SimUtils = SimUtils



