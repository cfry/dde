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
    }

    static render_multi(robot_status, job_name, robot_name, force_render=false, dur_in_ms){ //inputs in arc_seconds
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
            sim_pane_move_dur_id.innerHTML = dur_to_show + "s"
            let ms_per_frame = 33
            let total_frames = Math.ceil(dur_in_ms / ms_per_frame)
            total_frames = Math.max(total_frames, 1) //when dur_in_ms == 0, total_frames can be zero, as happens on "g" instructions, like at beginning of a job
            /*let prev_js
            if(!SimUtils.prev_robot_status) { //happens on start up. Just presume robot is at 0
                prev_js = [0, 0, 0, 0, 0]
            }
            else {
                let prev_RobotStatus_instance = new RobotStatus({robot_status: SimUtils.prev_robot_status})
                prev_js = prev_RobotStatus_instance.measured_angles()
            }
            */
            let new_RobotStatus_instance = new RobotStatus({robot_status: robot_status})
            let new_js = new_RobotStatus_instance.measured_angles()
            let js_inc_per_frame = []
            for(let joint = 0; joint <= 4; joint++){
                let j_diff = new_js[joint] - this.prev_joint_angles[joint]
                js_inc_per_frame.push(j_diff / total_frames)
            }
            let prev_js = this.prev_joint_angles.slice(0)
            let rob = value_of_path(robot_name)
            SimUtils.render_multi_frame(prev_js, js_inc_per_frame, ms_per_frame, total_frames, 0, rob)
            //used by render_once_but_only_if_have_prev_args\
            this.prev_joint_angles     = new_js
            SimUtils.prev_robot_status = robot_status
            SimUtils.prev_job_name     = job_name
            SimUtils.prev_robot_name   = robot_name
        }
    }

    static render_multi_frame(prev_js, js_inc_per_frame, ms_per_frame, total_frames, frame=0, rob){
        if(frame >= total_frames) {} //we're done
        else{
            let new_angles = []
            for(let joint = 0; joint <= 4; joint++){
                let prev_j = prev_js[joint]
                let j_inc_per_frame = js_inc_per_frame[joint]
                let inc_to_prev_j = frame * j_inc_per_frame
                let j_angle = prev_j + inc_to_prev_j
                new_angles.push(j_angle)
                let rads = arc_seconds_to_radians(j_angle)
                let j_angle_degrees_rounded = Math.round(j_angle / 3600)
                switch(joint) {
                    case 0:
                        sim.J1.rotation.y = rads
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
                        sim.J5.rotation.y = rads
                        sim_pane_j5_id.innerHTML = j_angle_degrees_rounded
                        break;
                }
            }
            let xyz = Kin.J_angles_to_xyz(new_angles, rob.pose)[0]
            let x = ("" + xyz[0]).substring(0, 5)
            sim_pane_x_id.innerHTML = x
            let y = ("" + xyz[1]).substring(0, 5)
            sim_pane_y_id.innerHTML = y
            let z = ("" + xyz[2]).substring(0, 5)
            sim_pane_z_id.innerHTML = z

            sim.renderer.render(sim.scene, sim.camera)
            if(frame < (total_frames - 1)){
                setTimeout(function() {
                    SimUtils.render_multi_frame(prev_js, js_inc_per_frame, ms_per_frame, total_frames, frame + 1, rob)
                   }, ms_per_frame)
            }
        }
    }

    //called by video.js misc_pane_menu_changed
    static render_once_with_prev_args_maybe(){
        if(this.prev_robot_status){
            this.render_once(SimUtils.prev_robot_status,
                             SimUtils.prev_job_name,
                             SimUtils.prev_robot_name)
        }
        else { sim.renderer.render(sim.scene, sim.camera) } //just the initial condition, dex straight up
    }

    static is_shown(){
        if(window["sim_graphics_pane_id"]) { return true }
        else { return false }
    }
}
SimUtils.prev_joint_angles = [0, 0, 0, 0, 0]
SimUtils.prev_robot_status = null
SimUtils.prev_job_name     = null
SimUtils.prev_robot_name   = null



