var {Instruction} = require("./instruction.js")

Instruction.Dexter = class Dexter extends Instruction{}

//only used for Dexter.dexter0.get_robot_status() like calls, not for Dexter.get_robot_status() calls.
//this instance is needed because we need the instruction on the do_list to contain
//the robot so that Socket.on_receive and its aux fn, find_dexter_instance_from_robot_status
//know what robot that the on_received robot status belongs to.
Instruction.Dexter.get_robot_status = class get_robot_status extends Instruction.Dexter{
    constructor (status_mode, robot) {
        super()
        this.status_mode = status_mode //keep for orig 5 angles so to_source_code can use them. May contain nulls
        this.robot = robot //if this is undefined, we will use the default robot of the job.
    }
    do_item (job_instance){
        if(!this.robot) { //this.robot = job_instance.robot
            this.set_instruction_robot_from_job(job_instance) //might error which is good
        }
        if(this.status_mode === null){
            job_instance.send(make_ins("g"), this.robot)
        }
        else {
            job_instance.send(make_ins("g", this.status_mode), this.robot)
        }
    }
    toString(){
        return "{instanceof: get_robot_status " + this.status_mode + "}"
    }
    to_source_code(args){
        let arg_src
        if(this.status_mode == null) { arg_src = "" }
        else { arg_src = "" + this.status_mode }
        args.indent = ""
        return args.indent + "Dexter." + this.robot.name + ".get_robot_status(" + arg_src + ")"
    }
}

Instruction.Dexter.move_all_joints = class move_all_joints extends Instruction.Dexter{
    constructor (array_of_angles, robot) {
        super()
        this.array_of_angles = array_of_angles //keep for orig 5 angles so to_source_code can use them. May contain nulls
        this.robot = robot //if this is undefined, we will use the default robot of the job.
    }
    do_item (job_instance){
        if(!this.robot) { //this.robot = job_instance.robot
            this.set_instruction_robot_from_job(job_instance) //might error which is good
        }
        let angles = []
        for (let i = 0; i < 5; i++){
            let ang = this.array_of_angles[i]
            if ((ang === undefined) || //happens when array is less than 5 long
                Number.isNaN(ang)) {
                angles.push(this.robot.angles[i]) //this.robot_status[Dexter.ds_j0_angle_index + i] //ie don't change angle
            }
            else if (Array.isArray(ang)) {  //relative move by the first elt of the array
                angles.push(this.robot.angles[i] + ang[0])
            }
            else { angles.push(ang) }
        }
        //angles is now 5 long
        for(let i = 5; i < this.array_of_angles.length; i++) {
            let ang = this.array_of_angles[i]
            if ((ang === undefined) ||
                Number.isNaN(ang) ||
                (Array.isArray(ang) && (ang.length == 1) && (ang[0] == 0))) { //ie [0] means move relative amount of 0. in which case, don't more at all, not even what we THINK is to the same place.
                angles.push(NaN) //this.robot_status[Dexter.ds_j0_angle_index + i] //ie don't change angle
            }
            else if (Array.isArray(ang)) {  //relative move by the first elt of the array
                angles.push(this.robot.angles[i] + ang[0])
            }
            else { angles.push(ang) }
        }
        //angles is at least 5 long, could be 6 or 7
        let error_mess = Dexter.joints_out_of_range(angles, this.robot)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nin Robot.move_all_joints([" + angles + "])")
            job_instance.set_up_next_do(0)
        }
        else  {
            //this.robot.angles = angles
            for(let i = 0; i < angles.length; i++) { this.robot.angles[i] = angles[i] }
            //job_instance.insert_single_instruction(make_ins("a", ...angles))
            job_instance.wait_until_instruction_id_has_run = job_instance.program_counter
            job_instance.send(make_ins("a", ...angles), this.robot)
            //job_instance.set_up_next_do(1) //effectively done in robot_done_with_instruction
        }
    }
    toString(){
        return "{instanceof: move_all_joints " + this.array_of_angles + "}"
    }
    to_source_code(args){
        args = jQuery.extend({}, args)
        args.value = this.array_of_angles
        args.indent = ""
        return args.indent + "Dexter.move_all_joints(" + to_source_code(args) + ")"
    }
}

Instruction.Dexter.pid_move_all_joints = class pid_move_all_joints extends Instruction.Dexter{
    constructor (array_of_angles, robot) {
        super()
        this.array_of_angles = array_of_angles //keep for orig 5 angles so to_source_code can use them. May contain nulls
        this.robot = robot
    }
    do_item (job_instance){
        if(!this.robot) { this.set_instruction_robot_from_job(job_instance) }
        let angles = []
        for (let i = 0; i < 5; i++){
            let ang = this.array_of_angles[i]
            if ((ang === undefined) || //happens when array is less than 5 long
                Number.isNaN(ang)) {
                angles.push(this.robot.pid_angles[i]) //this.robot_status[Dexter.ds_j0_angle_index + i] //ie don't change angle
            }
            else if (Array.isArray(ang)) {  //relative move by the first elt of the array
                angles.push(this.robot.pid_angles[i] + ang[0])
            }
            else { angles.push(ang) }
        }
        //angles is now 5 long
        for(let i = 5; i < this.array_of_angles.length; i++) {
            let ang = this.array_of_angles[i]
            if ((ang === undefined) ||
                Number.isNaN(ang)) {
                angles.push(NaN) //this.robot_status[Dexter.ds_j0_angle_index + i] //ie don't change angle
            }
            else if (Array.isArray(ang)) {  //relative move by the first elt of the array
                angles.push(this.robot.pid_angles[i] + ang[0])
            }
            else { angles.push(ang) }
        }
        let error_mess = Dexter.joints_out_of_range(angles, this.robot)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nin Robot.pid_move_all_joints([" + angles + "])")
            job_instance.set_up_next_do(0)
        }
        else  {
            for(let i = 0; i < angles.length; i++) { this.robot.pid_angles[i] = angles[i] }
            //job_instance.insert_single_instruction(make_ins("P", ...angles))
            job_instance.wait_until_instruction_id_has_run = job_instance.program_counter
            job_instance.send(make_ins("P", ...angles), this.robot)
            // job_instance.set_up_next_do(1) //called by robot_done_with_instruction
        }
    }
    toString(){
        return "{instanceof: pid_move_all_joints " + this.array_of_angles + "}"
    }
    to_source_code(args){
        args        = jQuery.extend({}, args)
        args.value  = this.array_of_angles
        args.indent = ""
        return args.indent + "Dexter.pid_move_all_joints(" + to_source_code(args) + ")"
    }
}

Instruction.Dexter.move_all_joints_relative = class move_all_joints_relative extends Instruction.Dexter{
    constructor (delta_angles, robot) {
        super()
        this.delta_angles = delta_angles //keep for orig 5 angles so to_source_code can use them. May contain nulls
        this.robot = robot
    }
    do_item (job_instance){
        if(!this.robot) { this.set_instruction_robot_from_job(job_instance)}
        let angles = [] //the absolute angles after the rel has been added in
        for (let i = 0; i < 5; i++){
            let ang = this.delta_angles[i]
            if ((ang === undefined) || //happens when array is less than 5 long
                Number.isNaN(ang)) {
                angles.push(this.robot.angles[i]) //this.robot_status[Dexter.ds_j0_angle_index + i] //ie don't change angle
            }
            else if (Array.isArray(ang)) {  //relative move by the first elt of the array
                //angles.push(this.robot.angles[i] + ang[0])
                dde_error("move_all_joints_relative passed an array: " + ang +
                    " but can only accept numbers as these are already relative.")
            }
            else { angles.push(this.robot.angles[i] + ang) }
        }
        //angles is now 5 long
        for(let i = 5; i < this.delta_angles.length; i++) {
            let ang = this.delta_angles[i]
            if ((ang === undefined) ||
                Number.isNaN(ang)) {
                angles.push(NaN) //this.robot_status[Dexter.ds_j0_angle_index + i] //ie don't change angle
            }
            else if (Array.isArray(ang)) {
                dde_error("move_all_joints_relative passed an array: " + ang +
                    " but can only accept numbers as these are already relative.")

            }
            else { angles.push(this.robot.angles[i] + ang) }
        }
        //angles is at least 5 long, could be 6 or 7
        let error_mess = Dexter.joints_out_of_range(angles, this.robot)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nin Robot.move_all_joints_relative([" + angles + "])")
            job_instance.set_up_next_do(0)
        }
        else  {
            //this.robot.angles = angles
            for(let i = 0; i < angles.length; i++) { this.robot.angles[i] = angles[i] }
            //job_instance.insert_single_instruction(make_ins("a", ...angles))
            job_instance.wait_until_instruction_id_has_run = job_instance.program_counter
            job_instance.send(make_ins("a", ...angles), this.robot)
            //job_instance.set_up_next_do(1) //effectively done in robot_done_with_instruction
        }
    }
    toString(){
        return "{instanceof: move_all_joints_relative " + this.delta_angles + "}"
    }
    to_source_code(args){
        args        = jQuery.extend({}, args)
        args.value  = this.delta_angles
        args.indent = ""
        return args.indent + "Dexter.move_all_joints_relative(" + to_source_code(args) + ")"
    }
}

Instruction.Dexter.move_to = class move_to extends Instruction.Dexter{
    constructor (xyz           = [],
                 J5_direction  = [0, 0, -1], //pointing down
                 config        = Dexter.RIGHT_UP_OUT,
                 workspace_pose = null, //default's to the job's default_workspace_pose
                 j6_angle = [0], //default is to move relatively 0, ie don't change
                 j7_angle = [0],
                 robot
    ){
        super()
        this.xyz            = xyz
        this.J5_direction   = J5_direction
        this.config         = config
        this.workspace_pose = ((workspace_pose === null) ? undefined : workspace_pose)
        this.j6_angle       = j6_angle
        this.j7_angle       = j7_angle
        this.robot          = robot
    }
    do_item (job_instance){
        if(!this.robot) { this.set_instruction_robot_from_job(job_instance) }
        let xyz          = this.xyz
        let J5_direction = this.J5_direction
        let config       = this.config
        let pose         = this.workspace_pose
        if(Dexter.is_position(this.xyz)){
            pose         = J5_direction
            xyz          = this.xyz[0]
            J5_direction = this.xyz[1]
            config       = this.xyz[2]

        }
        let [existing_xyz, existing_direction, existing_config] = Kin.J_angles_to_xyz(this.robot.angles, this.robot.pose) //just to get defaults.
        if(J5_direction === null) { J5_direction = existing_direction }
        if(config       === null) { config       = existing_config }
        if(Array.isArray(J5_direction) &&
            (J5_direction.length == 2) &&
            (Math.abs(J5_direction[0]) == 90) &&
            (Math.abs(J5_direction[1]) == 90)){
            job_instance.stop_for_reason("errored",
                "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nDexter.move_to([" + xyz + "], [" + J5_direction + "])\n" +
                "was passed an invalid J5_direction." +
                "\n[90, 90], [-90, 90], [90, -90] and [-90, -90]\n are all invalid.")
        }
        let xyz_copy = xyz.slice(0)
        for(let i = 0; i < 3; i++){
            let new_x_y_or_z = xyz_copy[i]
            if (xyz_copy.length <= i)             { xyz_copy.push(existing_xyz[i]) }
            else if (new_x_y_or_z == null)        { xyz_copy[i] = existing_xyz[i]  } //does not hit if new_x_y_or_z is 0
            else if (Array.isArray(new_x_y_or_z)) { xyz_copy[i] = existing_xyz[i] + new_x_y_or_z[0] } //relative "new val"
        }
        if(pose == null) { pose = job_instance.default_workspace_pose }

        if (Object.isNewObject(pose)) { pose = pose.pose }
        if (Object.isNewObject(J5_direction)) {
            J5_direction = J5_direction.pose
            config       = undefined
            pose         = undefined
        }
        else if (Array.isArray(J5_direction)) {
            if (Array.isArray(J5_direction[0])) { //J5_direciton is a 2d array
                config = undefined
                pose   = undefined
            }
            //else its a 1D array, so use config and pose as they are
        }
        else {
            dde_error("Dexter.move_to passed invalid 5_direction of: " + J5_direction)
        }
        let angles
        try {
            angles = Kin.xyz_to_J_angles(xyz_copy, J5_direction, config, pose) //was: job_instance.robot.pose
            //angles is now 5 long
        }
        catch(err){
            job_instance.stop_for_reason("errored",
                "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nDexter.move_to([" + xyz + "], [" + J5_direction + "])" +
                "\nwas passed invalid xyz.\n " +
                err.message)
            job_instance.set_up_next_do(0)
            return
        }
        let error_mess = Dexter.joints_out_of_range(angles, this.robot)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " +
                job_instance.program_counter +
                "\nin Dexter.move_to([" + xyz + "])" +
                "\nout of range xyz.")
            job_instance.set_up_next_do(0)
        }
        else {
            if(Array.isArray(this.j6_angle)) {
                angles.push(this.robot.angles[5] + this.j6_angle[0])
            }
            else { angles.push(this.j6_angle) }
            if(Array.isArray(this.j7_angle)) {
                angles.push(this.robot.angles[6] + this.j7_angle[0])
            }
            else { angles.push(this.j7_angle) }
            this.robot.angles       = angles
            //Job.insert_instruction(make_ins("a", ...angles), {job: job_instance, offset: "after_program_counter"})
            //job_instance.insert_single_instruction(make_ins("a", ...angles))
            job_instance.wait_until_instruction_id_has_run = job_instance.program_counter
            this.computed_angles = angles //for debugging purposes
            if(Array.isArray(this.j7_angle) &&
                (this.j7_angle.length === 1) &&
                (this.j7_angle[0] === 0)){
                if(Array.isArray(this.j6_angle) &&
                    (this.j6_angle.length === 1) &&
                    (this.j6_angle[0] === 0)){
                    angles = angles.slice(0, 5)
                }
                else { //only j7 is [0] so keep j6 in the array
                    angles = angles.slice(0, 6)
                }
            }
            //we're keeping j7, but maybe not j6
            else if (Array.isArray(this.j6_angle) &&
                    (this.j6_angle.length === 1) &&
                    (this.j6_angle[0] === 0)){
                    angles[5] = "N" //means don't move J6.
            }
            job_instance.send(make_ins("a", ...angles), this.robot)
            //job_instance.set_up_next_do(1) //effectively done in robot_done_with_instruction
        }
    }

    toString(){ return "{instanceof: move_to " + this.xyz + "}" }

    to_source_code(args){
        args        = jQuery.extend({}, args)
        args.indent = ""

        args.value  = this.xyz
        let xyx_src = to_source_code(args)

        args.value  = this.J5_direction
        let J5_direction_src = to_source_code(args)

        args.value  = this.config
        let config_src = to_source_code(args)

        return args.indent + "Dexter.move_to(" +
            xyx_src          + ", " +
            J5_direction_src + ", " +
            config_src       +
            ")"
    }
}

Dexter.prototype.get_dh_last_angles = function() {
    if (!this.dh_last_angles){
        this.dh_last_angles = [0, 0, 90, 0, 0, 0] //the default initial angles
    }
    return this.dh_last_angles
}

Dexter.prototype.set_dh_last_angles = function(new_last_angles) {
    this.dh_last_angles = new_last_angles
}

Instruction.Dexter.move_to_DH = class move_to_DH extends Instruction.Dexter{
    constructor (xyz           = [],
                 orientation  = [
                             [-1, 0, 0],
                             [0, 0, 1],
                             [0, 1, 0]
                            ],
                 dh_mat,
                 robot
    ){
        super()
        this.xyz         = xyz
        this.orientation = orientation
        this.dh_mat      = dh_mat
        this.robot       = robot
    }
    do_item (job_instance){
        if(!this.robot) { this.set_instruction_robot_from_job(job_instance) }
        if(!this.dh_mat){
            //total hack to make my code work:
            //var folder = "C:/Users/james/Documents/dde_apps/2021/Code/MoveWithForce/data_set_HDI_000047/"
            //var dh_mat = DH.parse_dh_mat_file(folder + "dh_mat.out")
            if(this.robot.defaults && this.robot.defaults.dh_mat) {
                this.dh_mat = this.robot.defaults.dh_mat
            }
            else {
                this.dh_mat = Dexter.defaults.dh_mat
            }
        }
        let old_last_angles = this.robot.get_dh_last_angles()
        let new_last_angles = DH.inverse_kinematics(this.xyz, this.orientation, this.dh_mat, old_last_angles) //Also kind of a hack to get the code to work
        if(Vector.max(Vector.abs(new_last_angles)) > 180){
           //Vector.max(Vector.abs(old_last_angles))){  //in place of 180, this returns something more than Vector.max(Vector.abs(new_last_angles)) so it cauess an error. Asj James W.
            dde_error("Dexter.move_to_DH: Kinematics Failure")
        }
        else {
            this.robot.set_dh_last_angles(new_last_angles)
            //return this.robot.move_all_joints(new_last_angles)
            job_instance.send(make_ins("a", ...new_last_angles), this.robot)
        }
    }
}

Instruction.Dexter.pid_move_to = class pid_move_to extends Instruction.Dexter{
    constructor (xyz           = [],
                 J5_direction  = [0, 0, -1],
                 config        = Dexter.RIGHT_UP_OUT,
                 workspace_pose = undefined, //default's to the job's default_workspace_pos
                 j6_angle = [0], //default is to move relatively 0, ie don't change
                 j7_angle = [0],
                 robot
    ){
        super()
        this.xyz            = xyz
        this.J5_direction   = J5_direction
        this.config         = config
        this.workspace_pose = ((workspace_pose === null) ? undefined : workspace_pose)
        this.j6_angle       = j6_angle
        this.j7_angle       = j7_angle
        this.robot          = robot
    }
    do_item (job_instance){
        if(!this.robot) { this.set_instruction_robot_from_job(job_instance) }
        let xyz          = this.xyz
        let J5_direction = this.J5_direction
        let config       = this.config
        let pose         = this.workspace_pose
        if(Dexter.is_position(this.xyz)){
            pose         = J5_direction
            xyz          = this.xyz[0]
            J5_direction = this.xyz[1]
            config       = this.xyz[2]
        }
        let [existing_xyz, existing_direction, existing_config] = Kin.J_angles_to_xyz(this.robot.pid_angles, this.robot.pose) //just to get defaults.
        if(J5_direction === null) { J5_direction = existing_direction }
        if(config       === null) { config       = existing_config }
        if(Array.isArray(J5_direction) &&
            (J5_direction.length == 2) &&
            (Math.abs(J5_direction[0]) == 90) &&
            (Math.abs(J5_direction[1]) == 90)){
            job_instance.stop_for_reason("errored",
                "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nDexter.pid_move_to([" + xyz + "], [" + J5_direction + "])\n" +
                "was passed an invalid J5_direction." +
                "\n[90, 90], [-90, 90], [90, -90] and [-90, -90]\n are all invalid.")
        }
        let xyz_copy = xyz.slice(0)
        for(let i = 0; i < 3; i++){
            let new_x_y_or_z = xyz_copy[i]
            if      (xyz_copy.length <= i)        { xyz_copy.push(existing_xyz[i]) }
            else if (xyz_copy[i] == null)         { xyz_copy[i] = existing_xyz[i]  }
            else if (Array.isArray(new_x_y_or_z)) { xyz_copy[i] = existing_xyz[i] + new_x_y_or_z[0] } //relative "new val"
        }
        if(pose == null) { pose = job_instance.default_workspace_pose }
        if (Object.isNewObject(pose)) { pose = pose.pose }
        if (Object.isNewObject(J5_direction)) {
            J5_direction = J5_direction.pose
            config       = undefined
            pose         = undefined
        }
        else if (Array.isArray(J5_direction)) {
            if (Array.isArray(J5_direction[0])) { //J5_direciton is a 2d array
                config = undefined
                pose   = undefined
            }
            //else its a 1D array, so use config and pose as they are
        }
        else {
            dde_error("Dexter.move_to passed invalid 5_direction of: " + J5_direction)
        }
        let angles
        try {
            angles = Kin.xyz_to_J_angles(xyz_copy, J5_direction, config, pose) //job_instance.robot.pose
            //angles is now 5 long
        }
        catch(err){
            //job_instance.stop_for_reason("errored",
            //    "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
            //    "\nDexter.pid_move_to([" + xyz + "], [" + J5_direction + "])" +
            //    "\nwas passed invalid xyz.\n " +
            // err.message)
            //job_instance.set_up_next_do(0)
            //return
            throw new Error("in pid_move_to do_item method. Call to Kin.xyz_to_J_angles has errored")
        }
        let error_mess = Dexter.joints_out_of_range(angles, this.robot)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nin Dexter.pid_move_to([" + xyz + "])")
            job_instance.set_up_next_do(0)
        }
        else{
            if(Array.isArray(this.j6_angle)) {
                angles.push(this.robot.pid_angles[5] + this.j6_angle[0])
            }
            else { angles.push(this.j6_angle) }
            if(Array.isArray(this.j7_angle)) {
                angles.push(this.robot.pid_angles[6] + this.j7_angle[0])
            }
            else { angles.push(this.j7_angle) }
            this.robot.pid_angles       = angles  //angles is 7 long
            //Job.insert_instruction(make_ins("P", ...angles), {job: job_instance, offset: "after_program_counter"})
            //job_instance.insert_single_instruction(make_ins("P", ...angles))
            job_instance.wait_until_instruction_id_has_run = job_instance.program_counter
            job_instance.send(make_ins("P", ...angles), this.robot)
            //job_instance.set_up_next_do(1) //called by robot_done_with_instruction
        }
    }

    toString(){ return "{instanceof: pid_move_to " + this.xyz + "}" }

    to_source_code(args){
        args        = jQuery.extend({}, args)
        args.indent = ""

        args.value  = this.xyz
        let xyx_src = to_source_code(args)

        args.value  = this.J5_direction
        let J5_direction_src = to_source_code(args)

        args.value  = this.config
        let config_src = to_source_code(args)

        return args.indent + "Dexter.pid_move_to(" +
            xyx_src          + ", " +
            J5_direction_src + ", " +
            config_src       +
            ")"
    }
}
Instruction.Dexter.move_to_relative = class move_to_relative extends Instruction.Dexter{
    constructor (delta_xyz = [0, 0, 0], workspace_pose=undefined, j6_delta_angle=0, j7_delta_angle=0, robot){
        super()
        if (delta_xyz.length == 1) {
            delta_xyz.push(0)
            delta_xyz.push(0)
        }
        else if (delta_xyz.length == 2) {  delta_xyz.push(0) }
        this.delta_xyz      = delta_xyz
        this.workspace_pose = ((workspace_pose === null)? undefined : workspace_pose)
        this.j6_delta_angle = j6_delta_angle
        this.j7_delta_angle = j7_delta_angle
        this.robot          = robot
    }
    do_item(job_instance){
        if(!this.robot) { this.set_instruction_robot_from_job(job_instance) }
        let [old_xyz, J5_direction, config] = Kin.J_angles_to_xyz(this.robot.angles, this.workspace_pose) //job_instance.robot.pose
        let new_xyz = Vector.add(old_xyz, this.delta_xyz) //makes a new array
        let angles
        try {
            angles = Kin.xyz_to_J_angles(new_xyz, J5_direction, config, this.workspace_pose) //job_instance.robot.pose)
            //now of length 5
        }
        catch(err){
            job_instance.stop_for_reason("errored",
                "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nDexter.move_to_relative([" + this.delta_xyz + "])" +
                "\ncalled with out of range delta_xyz\n" +
                err.message)
            job_instance.set_up_next_do(0)
            return
        }
        angles.push(this.robot.angles[5] + this.j6_delta_angle)
        angles.push(this.robot.angles[6] + this.j7_delta_angle)

        let error_mess = Dexter.joints_out_of_range(angles, this.robot)
        if (error_mess){ // a string like "Joint 1 with angle: 0.01 is less than the minimum: 30
            job_instance.stop_for_reason("errored",
                error_mess + "\nin Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nin Dexter.move_to_relative([" + this.delta_xyz + "])")
            job_instance.set_up_next_do(0)
        }
        else{
            this.robot.angles = angles
            //return make_ins("a", ...angles) // Dexter.move_all_joints(angles)
            //job_instance.insert_single_instruction(make_ins("a", ...angles))
            job_instance.wait_until_instruction_id_has_run = job_instance.program_counter
            job_instance.send(make_ins("a", ...angles), this.robot)
            //job_instance.set_up_next_do(1) //called by robot_done_with_instruction
        }
    }
    toString(){
        return "{instanceof: move_to_relative " + this.delta_xyz + "}"
    }
    to_source_code(args){
        let prop_args        = jQuery.extend({}, args)
        prop_args.indent     = ""
        prop_args.value      = this.delta_xyz
        return args.indent + "Dexter.move_to_relative(" + to_source_code(prop_args) + ")"
    }
}

Instruction.Dexter.move_to_straight = class move_to_straight extends Instruction.Dexter{
    constructor ({xyz           = [],
                  J5_direction   = [0, 0, -1],
                  config         = Dexter.RIGHT_UP_OUT,
                  workspace_pose = undefined,
                  tool_speed     = 5*_mm / _s,
                  resolution     = 0.5*_mm,
                  j6_angle       = [0],
                  j7_angle       = [0],
                  single_instruction = false, //false means make up all the make_ins for this here in DDE,
                                                 //true means create just 1 make_ins "T" instruction
                  robot}) {
        super()
        this.xyz            = xyz
        this.J5_direction   = J5_direction
        this.config         = config
        this.workspace_pos  = ((workspace_pose === null) ? undefined : workspace_pose)
        this.tool_speed     = tool_speed
        this.resolution     = resolution
        this.j6_angle       = j6_angle
        this.j7_angle       = j7_angle
        this.single_instruction = single_instruction
        this.robot          = robot
        if(!single_instruction) { this.inserting_instruction = true }
    }
    do_item (job_instance){
        if(!this.robot) { this.set_instruction_robot_from_job(job_instance) }
        let [existing_xyz, existing_J5_direction, existing_config] =
            Kin.J_angles_to_xyz(this.robot.angles, this.robot.pose)
        let xyz_copy = this.xyz.slice(0)
        for(let i = 0; i < 3; i++){
            let new_x_y_or_z = xyz_copy[i]
            if (xyz_copy.length <= i)             { xyz_copy.push(existing_xyz[i]) }
            else if (new_x_y_or_z == null)        { xyz_copy[i] = existing_xyz[i]  } //does not hit if new_x_y_or_z is 0
            else if (Array.isArray(new_x_y_or_z)) { xyz_copy[i] = existing_xyz[i] + new_x_y_or_z[0] } //relative "new val"
        }
        let angles
        try { angles = Kin.xyz_to_J_angles(xyz_copy, this.J5_direction, this.config, this.robot.pose)} //job_instance.robot.pose ?
        catch(err){
            job_instance.stop_for_reason("errored",
                "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                "\nDexter.move_to_straight([" + this.xyz + "])" +
                "\ncalled with out of range xyz\n" +
                err.message)
            job_instance.set_up_next_do(0)
            return
        }
        let new_j6_angle
        if(Array.isArray(this.j6_angle)) {
            new_j6_angle = this.robot.angles[5] + this.j6_angle[0]
        }
        else {  new_j6_angle = this.j6_angle }
        angles.push(new_j6_angle)

        let new_j7_angle
        if(Array.isArray(this.j7_angle)) {
            new_j7_angle =  this.robot.angles[6] + this.j7_angle[0]
        }
        else { new_j7_angle = this.j7_angle }
        angles.push(new_j7_angle)

        this.robot.angles = angles
        if(this.single_instruction) {
            let ins = make_ins("T",
                xyz_copy[0], xyz_copy[1], xyz_copy[2], //args 0, 1, 2
                this.J5_direction[0], this.J5_direction[1], this.J5_direction[2],
                this.config[0], this.config[1], this.config[2],
                this.tool_speed, this.resolution,
                new_j6_angle, new_j7_angle) //args 11, 12
            job_instance.wait_until_instruction_id_has_run = job_instance.program_counter
            job_instance.send(ins, this.robot)
            //job_instance.set_up_next_do(1) //will be called by robot_done_with_instruction
        }
        else {
            try {
                let instrs = this.move_to_straight_aux(existing_xyz,
                    xyz_copy,
                    this.J5_direction,
                    this.config,
                    this.robot.pose,
                    this.tool_speed,
                    this.resolution,
                    this.robot)
                //Job.insert_instruction(instrs, {job: job_instance, offset: "after_program_counter"})
                job_instance.insert_instructions(instrs)
                job_instance.set_up_next_do(1)
            }
            catch(err){
                job_instance.stop_for_reason("errored",
                    "In Job." + job_instance.name + " at PC: " + job_instance.program_counter +
                    "Dexter.move_to_straight({xyz: [" + this.xyz + "]})\n" +
                    "passed invalid xyz.\n" +
                    err.message)
            }
        }
    }
    move_to_straight_aux (xyz_1, xyz_2, J5_direction, config,  robot_pose, tool_speed = 5*_mm / _s, resolution = .5*_mm, robot){
        let movCMD = []
        let U1 = xyz_1
        let U2 = xyz_2
        let U21 = Vector.subtract(U2, U1)
        let v21 = Vector.normalize(U21)
        let mag = Vector.magnitude(U21)
        let div = 1
        let step = Infinity
        while(resolution < step){
            div++
            step = mag / div
        }
        let angular_velocity
        let Ui, new_J_angles
        let old_J_angles = Kin.xyz_to_J_angles(U1, J5_direction, config, robot_pose)
        for(let i = 1; i < div+1; i++){
            Ui = Vector.add(U1, Vector.multiply(i*step, v21))
            new_J_angles = Kin.xyz_to_J_angles(Ui, J5_direction, config, robot_pose)
            angular_velocity = Kin.tip_speed_to_angle_speed(old_J_angles, new_J_angles, tool_speed)
            old_J_angles = new_J_angles
            movCMD.push(robot.make_ins("S", "MaxSpeed", angular_velocity))
            movCMD.push(robot.make_ins("S", "StartSpeed", angular_velocity))
            movCMD.push(robot.move_to(Ui, J5_direction, config, robot_pose))
        }
        return movCMD
    }
    toString(){
        return "{instanceof: move_to_straignt " + this.xyz + "}"
    }
    to_source_code(args){
        args        = jQuery.extend({}, args)
        args.indent = ""

        args.value  = this.xyz
        let xyx_src = to_source_code(args)

        args.value  = this.J5_direction
        let J5_direction_src = to_source_code(args)

        args.value  = this.config
        let config_src = to_source_code(args)

        args.value  = this.tool_speed
        let tool_speed_src = to_source_code(args)

        args.value  = this.resolution
        let resolution_src = to_source_code(args)

        return args.indent + "Dexter.move_to_straight(" +
            xyx_src          + ", " +
            J5_direction_src + ", " +
            config_src       + ", " +
            tool_speed_src   + ", " +
            resolution_src   +
            ")"
    }
}

Instruction.Dexter.read_file = class read_file extends Instruction.Dexter{
    constructor (source        , //a file name path string
                 destination   = "read_file_content", //user data variable
                 robot         = null //null means use the default robot of the job.
    ){
        if (typeof(source) != "string") {
            dde_error("Dexter.read_file passed non-string for 'source' of: " + source)
        }
        if (typeof(destination) != "string") {
            dde_error("Dexter.read_file passed non-string for 'destination' of: " + destination)
        }
        super()
        this.source = source //Instruction.Dexter.read_file.add_default_file_prefix_maybe(source)
              //add_default no longer used. We pass teh users path straight thru.
              //if it starts with a letter (not slash or special char like *)
              //it gets file from /srv/samba/share
        this.destination = destination
        this.first_do_item_call = true
        this.is_done = false
        this.processing_r_instruction = false
        this.robot = robot
        this.inserting_instruction = true
    }
    do_item (job_instance){
        if(!this.robot) { this.set_instruction_robot_from_job(job_instance) }
        if (this.first_do_item_call) {
            const sim_actual = Robot.get_simulate_actual(this.robot.simulate)
            //have to check for dexter_file_systems or else the 2nd time I run the job, it will
            //have a double length path with 2 dexter_file_systems parts
            if (!this.source.startsWith("/") && (sim_actual === true) && !this.source.startsWith("dexter_file_systems")) {
                this.fuller_source = "dexter_file_systems/" + this.robot.name + "/" + this.source
            }
            else { this.fuller_source = this.source }
            job_instance.user_data[this.destination] = ""
            this.first_do_item_call = false
            this.is_done = false
            this.processing_r_instruction = false
        }
        //the below can never happen
        //if (this.is_done) {
        //    this.processing_r_instruction = false
        //    return Control.break()
        //}
        let read_file_instance = this
        let robot = this.robot //closed over
        job_instance.insert_single_instruction(Control.loop(true, function(content_hunk_index){
                let job_instance = this
                if (read_file_instance.is_done) {
                    //init this inst just in case it gets used again
                    read_file_instance.is_done = false
                    read_file_instance.first_do_item_call = true
                    read_file_instance.processing_r_instruction = false
                    return Control.break()
                }
                else {
                    read_file_instance.processing_r_instruction = true
                    return [make_ins("r", content_hunk_index, read_file_instance.fuller_source, robot),
                            Control.wait_until(function(){
                                return !read_file_instance.processing_r_instruction
                             })
                           ]
                }
            })
        )
        job_instance.set_up_next_do(1)
    }

    //back up over dolist and return the first Instruction.Dexter.read_file found
    //called from got_content_hunk AND Dexter.done_with_instruction
    static find_read_file_instance_on_do_list(job_instance, starting_ins_id){
        for (let i = starting_ins_id; i >= 0; i--){
            let an_instruction = job_instance.do_list[i]
            if(an_instruction instanceof Instruction.Dexter.read_file){
                    return an_instruction
            }
        }
        shouldnt("find_read_file_instance_on_do_list failed to find<br/>" +
            "an instance of Dexter.read_file on Job." + job_instance.name + ".do_list<br/>" +
            "at or before instruction: " + starting_ins_id)
    }

    //called from socket.js
    //payload_string_maybe is a string or an error code (an int > 0)
    static got_content_hunk(job_id, ins_id, payload_string_maybe){
        let job_instance = Job.job_id_to_job_instance(job_id)
        if (job_instance == null){
            throw new Error("Dexter.robot_done_with_instruction passed job_id: " + job_id +
                " but couldn't find a Job instance with that job_id.")
        }
        let read_file_instance = this.find_read_file_instance_on_do_list(job_instance, ins_id)
        read_file_instance.processing_r_instruction = false
        if(typeof(payload_string_maybe) == "string"){ //do the usual
            job_instance.user_data[read_file_instance.destination] += payload_string_maybe
            if(payload_string_maybe.length < Instruction.Dexter.read_file.payload_max_chars){ //meaning
                //no more chars from the robot so we must be at the end.
                read_file_instance.is_done = true
            }
            //if we get exactly payload_max_chars, we probably have more chars to come from the robot,
            //but its possible we're running the sim and we just so happened to have exactly
            //payload_max_chars
            else {//payload_string_maybe is probably more than payload_max_chars meaning it probably came
                //from the simulator, therefore we're done as we get all chars in one fell swoop from
                //the simulator.
                let rob = read_file_instance.robot
                const sim_actual = Robot.get_simulate_actual(rob.simulate)
                if(sim_actual === true) { //definitely simulating so we're done.
                    read_file_instance.is_done = true
                }
                //else we are not in sim and more chars to come from the robot.
            }
        }
        else if(typeof(payload_string_maybe) == "number"){ //an error number.
            job_instance.user_data[read_file_instance.destination] = payload_string_maybe //set, don't append
            read_file_instance.is_done = true
        }
    }

    //used by Dexter.write_file to prepare path for passing it to make_ins("W" ...)
    //because the path used for write_file defaults to "srv/samba/share/dde_apps",
    //whereas the path for make_ins("W" ...) defaults to srv/samba/share
    //see Dexter.srv_samba_share_default_to_absolute_path to do the opposite
    //no longer used.
    /*static add_default_file_prefix_maybe(path){
        if      (path.startsWith("/"))   { return path }
        else if (path.startsWith("#"))   { return path }
        else if (path.startsWith("./"))  { return "dde_apps/" + path.substring(2) }
        else if (path.startsWith("../")) { return path.substring(3) } //will go to dexrun's default folder, ie /srv/samba/share/
        else                             { return "dde_apps/" + path }
    }*/

    to_source_code(args){
        let result = "Dexter."
        if(this.robot) { result += this.robot.name + "." }
        result += args.indent +
                  "read_file(" +
                  to_source_code({value: this.source}) + ", " +
                  to_source_code({value: this.destination}) +
                  ")"
        return result
    }
}
Instruction.Dexter.read_file.payload_max_chars = 62
