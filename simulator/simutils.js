/**
 * Created by Fry on 3/30/16.
 */
SimUtils = class SimUtils{
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

    //job_or_robot name format is really "Job.j1"  or "Dexter.dex1", ie same as the menu item in the Simulate pane
    //input angles are in arcseconds
    /* never called as of Dec, 2020 or before
    static render_once(robot_status, job_name, robot_name, force_render=false){ //inputs in arc_seconds
        let job_or_robot_to_sim = job_or_robot_to_simulate_name()
        if (force_render ||
           (job_or_robot_to_sim == job_name) ||
           (job_or_robot_to_sim == robot_name) ||
           (job_or_robot_to_sim == "All")){

            //used by render_once_but_only_if_have_prev_args
            SimUtils.prev_robot_status = robot_status
            SimUtils.prev_job_name     = job_name
            SimUtils.prev_robot_name   = robot_name

            let j1 = robot_status[Dexter.J1_MEASURED_ANGLE]
            let j2 = robot_status[Dexter.J2_MEASURED_ANGLE]
            let j3 = robot_status[Dexter.J3_MEASURED_ANGLE]
            let j4 = robot_status[Dexter.J4_MEASURED_ANGLE]
            let j5 = robot_status[Dexter.J5_MEASURED_ANGLE]
            j1 = j1 * -1 //fix for j1 wrong sign
            j5 = j5 * -1 //fix for j5 wrong sign
            sim.J1.rotation.y = arc_seconds_to_radians(j1)
            sim.J2.rotation.z = arc_seconds_to_radians(j2)
            sim.J3.rotation.z = arc_seconds_to_radians(j3)
            sim.J4.rotation.z = arc_seconds_to_radians(j4)
            sim.J5.rotation.y = arc_seconds_to_radians(j5)
            sim.renderer.render(sim.scene, sim.camera)
        }
    } */
    //ds_inst is an instance of DexterSim class.
    static render_multi(ds_instance, new_angles_arcseconds, job_name, robot_name, force_render=false, dur_in_ms=0){ //inputs in arc_seconds
        let job_or_robot_to_sim = job_or_robot_to_simulate_name()
        if (force_render ||
            (job_or_robot_to_sim == job_name) ||
            (job_or_robot_to_sim == robot_name) ||
            (job_or_robot_to_sim == "All")){
            let dur_to_show = Math.round(dur_in_ms / 100) //in 10ths of seconds, rounded
            dur_to_show = "" + dur_to_show
            if (dur_to_show.length > 1) {
                let dur_to_show_secs = dur_to_show.substring(0, dur_to_show.length - 1)
                dur_to_show = dur_to_show_secs + "." + last(dur_to_show)
            }
            else { dur_to_show = "0." + dur_to_show }
            sim_pane_move_dur_id.innerHTML = dur_to_show
            let ms_per_frame = 33
            let total_frames = Math.ceil(dur_in_ms / ms_per_frame) //total_frames might be 0. that's ok.
            //total_frames = Math.max(total_frames, 1) //when dur_in_ms == 0, total_frames can be zero, as happens on "g" instructions, like at beginning of a job
            /*let prev_js
            if(!SimUtils.prev_robot_status) { //happens on start up. Just presume robot is at 0
                prev_js = [0, 0, 0, 0, 0]
            }
            else {
                let prev_RobotStatus_instance = new RobotStatus({robot_status: SimUtils.prev_robot_status})
                prev_js = prev_RobotStatus_instance.measured_angles()
            }
            */
            //let new_RobotStatus_instance = new RobotStatus({robot_status: robot_status})
            //let new_js = new_RobotStatus_instance.measured_angles(7)
            let js_inc_per_frame = []
            for(let joint = 0; joint < new_angles_arcseconds.length; joint++){
                let j_diff = new_angles_arcseconds[joint] - this.prev_joint_angles[joint]
                js_inc_per_frame.push(j_diff / total_frames)
            }
            //let prev_js = this.prev_joint_angles.slice(0)
            let rob = value_of_path(robot_name)
            let prev_js = ds_instance.measured_angles_arcseconds.slice() //must copy because render_multi is going to continuous update mesured_angels per frame and we want to capture the prev_js and keep it constant
            //out("calling render_multi_frame first time with new_angles as: " + new_angles_arcseconds + " prev_js: " + prev_js + " js_inc_per_frame: " + js_inc_per_frame)
            SimUtils.render_multi_frame(ds_instance, new_angles_arcseconds, prev_js, js_inc_per_frame, ms_per_frame, total_frames, 0, rob, false) //beginning an all but last rendering

            //used by render_once_but_only_if_have_prev_args\
            this.prev_joint_angles     = new_angles_arcseconds
            //SimUtils.prev_robot_status = robot_status //not use by  render_multi or render_multi_frame
            SimUtils.prev_job_name     = job_name
            SimUtils.prev_robot_name   = robot_name
        }
    }
    //new_js is the array of target joint angles, only used for the "last" frame.
    //new_js and prev_js are in arcseconds. prev_js
    //For given new commanded angles of an instrution, this fn is called many times, with a dur of ms_per_frame
    //between the calls. All args remain the same for such calls except for frame, which is incremented from
    //0 up to total_frames. Once its called with frame == total_frames, it immediately stops the recursive calls.
    static render_multi_frame(ds_instance, new_angles_arcseconds, prev_js, js_inc_per_frame, ms_per_frame, total_frames, frame_number=0, rob, did_last_frame=false){
        if(frame_number >= total_frames) { ds_instance.animation_running = false} //we're done
        else{
            ds_instance.animation_running = true
            let new_angles = [] //used only for computing xyz to set in sim pane header
            let xyz = Kin.J_angles_to_xyz(new_angles, rob.pose)[0]
            for(let joint = 0; joint < prev_js.length; joint++){
                let prev_j = prev_js[joint]
                let j_inc_per_frame = js_inc_per_frame[joint] //might be undefined for j6 and 7
                let inc_to_prev_j = frame_number * j_inc_per_frame
                let j_angle = prev_j + (Number.isNaN(inc_to_prev_j) ? 0 : inc_to_prev_j) //j_angle is in arcseconds
                ds_instance.measured_angles_arcseconds[joint] = j_angle
                //if(joint === 0) { out("J" + joint + ": inc_to_prev_j: " + Math.round(inc_to_prev_j) + " j_angle: " + Math.round(j_angle)) }
                let angle_degrees
                if      (joint == 5) { angle_degrees = (j_angle - 512) * Socket.DEGREES_PER_DYNAMIXEL_UNIT }
                else if (joint == 6) { angle_degrees = j_angle * Socket.DEGREES_PER_DYNAMIXEL_UNIT }
                else                 { angle_degrees = j_angle / 3600 }
                if(((joint === 1) || (joint === 2) || (joint === 3)) &&
                    sim.hi_rez) {
                    angle_degrees *= -1
                }
                let rads = degrees_to_radians(angle_degrees)
                new_angles.push(angle_degrees)
                let j_angle_degrees_rounded = Math.round(angle_degrees)

                switch(joint) {
                    case 0:
                        sim.J1.rotation.y = rads * -1
                        sim_pane_j1_id.innerHTML = j_angle_degrees_rounded
                        break;
                    case 1:
                        sim.J2.rotation.z = rads
                        sim_pane_j2_id.innerHTML = j_angle_degrees_rounded
                        break;
                    case 2:
                        sim.J3.rotation.z = rads
                        sim_pane_j3_id.innerHTML = j_angle_degrees_rounded
                        break;
                    case 3:
                        sim.J4.rotation.z = rads
                        sim_pane_j4_id.innerHTML = j_angle_degrees_rounded
                        break;
                    case 4:
                        sim.J5.rotation.y = rads * -1
                        xyz = Kin.J_angles_to_xyz(new_angles, rob.pose)[0] //needed in case 6 and below
                        sim_pane_j5_id.innerHTML = j_angle_degrees_rounded
                        break;
                    case 5:
                        if(sim.J6) {
                            sim.J6.rotation.z = rads
                        }
                        sim_pane_j6_id.innerHTML = j_angle_degrees_rounded
                        break;
                    case 6:
                        if(sim.J7) { //330 degrees = 0.05 meters
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
                             SimBuild.handle_j7_change(angle_degrees, xyz, rob)
                        }
                        break;
                } //end switch
            } //end for loop
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

            sim.renderer.render(sim.scene, sim.camera)
            /*if(frame_number < (total_frames - 1)){
                setTimeout(function() {
                    SimUtils.render_multi_frame(ds_instance, new_angles_arcseconds, prev_js, js_inc_per_frame, ms_per_frame, total_frames, frame_number + 1, rob, false)
                   }, ms_per_frame)
            }
            else if ((frame_number == (total_frames - 1)) && !did_last_frame){//for the last time
                setTimeout(function() {
                    SimUtils.render_multi_frame(ds_instance, new_angles_arcseconds, new_angles_arcseconds, [0,0,0,0,0,0,0], ms_per_frame, 1, 0, rob, true)
                    //the only real use of "new_js" is for it to be the 2nd arg in the above call.
                    //then adding an increment of 0 to all its joints, makes whatever is in that
                    //2nd arg BE the place to move the sim to, which will be the target angles.
                    //we must have the did_last_frame be true so we don't keep having
                    //the above else_if hit after the "first" use of this "last frame".
                }, ms_per_frame) //since the correct "dur" for the final frame is really
                                 //only a partial frame, the real ms_per_frame should
                                 //be less than a full frame. But its set to a constant
                                 //above to 33msec (for 30 frames per sec) so
                                 //its small in any case. Thus we have an inaccuracy of the
                                 //sim, but, its minor and really just at the "animation frame rate".
            }*/
            setTimeout(function() {
                SimUtils.render_multi_frame(ds_instance, new_angles_arcseconds, prev_js, js_inc_per_frame, ms_per_frame, total_frames, frame_number + 1, rob, false)
            }, ms_per_frame)
        }
    }

    //called by video.js show_in_misc_pane
    static render_once_with_prev_args_maybe(){
        if(this.prev_robot_status){
            this.render_once(SimUtils.prev_robot_status,
                             SimUtils.prev_job_name,
                             SimUtils.prev_robot_name)
        }
        else { sim.renderer.render(sim.scene, sim.camera) } //just the initial condition, dex straight up
    }

    static render_multi_with_prev_args_maybe(){
        if(this.prev_robot_status){
            this.render_multi(SimUtils.prev_robot_status,
                SimUtils.prev_job_name,
                SimUtils.prev_robot_name)
        }
        else { sim.renderer.render(sim.scene, sim.camera) } //just the initial condition, dex straight up
    }

    static is_shown(){
        if(window["sim_graphics_pane_id"]) { return true }
        else { return false }
    }

    static inspect_dexter_sim_instance(robot_name){
        if(!robot_name) {
            robot_name = default_robot_name_id.value
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
}
SimUtils.prev_joint_angles = [0, 0, 0, 0, 0, 0, 0]
SimUtils.prev_robot_status = null
SimUtils.prev_job_name     = null
SimUtils.prev_robot_name   = null



