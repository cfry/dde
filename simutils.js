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
 x is horintal, left to right positive to the right
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
        if (force_render ||
           (job_or_robot_to_simulate_id.value == job_name) ||
           (job_or_robot_to_simulate_id.value == robot_name) ||
           (job_or_robot_to_simulate_id.value == "All")){

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

SimUtils.prev_robot_status = null
SimUtils.prev_job_name = null
SimUtils.prev_robot_name = null



