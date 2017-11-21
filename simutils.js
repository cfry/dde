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

    //job_or_robot name format is really "Job: j1"  or "Robot: dex1", ie same as the menu item in the Simulate pane
    static render_once(j1, j2, j3, j4, j5, job_or_robot_name, force_render=false){ //inputs in arc_seconds
        if (Array.isArray(j1)) { job_or_robot_name = j2; force_render = j3; }
        if (force_render || (videos_id.value == job_or_robot_name) || (videos_id.value == "All")){
            if (Array.isArray(j1)){
                if (j1.length == 5){
                    j2 = j1[1]
                    j3 = j1[3]
                    j4 = j1[4]
                    j5 = j1[5]
                    j1 = j1[0] //last so we can use the array in J1
                }
                else if (j1.length == Dexter.robot_status_labels.length){
                    j2 = j1[Dexter.J2_ANGLE]
                    j3 = j1[Dexter.J3_ANGLE]
                    j4 = j1[Dexter.J4_ANGLE]
                    j5 = j1[Dexter.J5_ANGLE]
                    j1 = j1[Dexter.J1_ANGLE] //last so we can use the array in J1
                }
            }
            j1 = j1 * -1 //fix for j1 wrong sign
            j5 = j5 * -1 //fix for j5 wrong sign
            sim.J1.rotation.y = arc_seconds_to_radians(j1)
            sim.J2.rotation.z = arc_seconds_to_radians(j2)
            sim.J3.rotation.z = arc_seconds_to_radians(j3)
            sim.J4.rotation.z = arc_seconds_to_radians(j4)
            sim.J5.rotation.y = arc_seconds_to_radians(j5)
            sim.renderer.render(sim.scene, sim.camera);
        }
    }
}

