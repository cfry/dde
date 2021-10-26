//Robot Status Class (as distinguished from the robot_status 1D array of 60 elts.
//import {Dexter} from './robot.js' //dde4 not needed because Dexter is now global

class RobotStatus{
    //below work for g0 and g1
    constructor({robot_status="required"}){
        this.robot_status = robot_status //for g0, the array has degrees, etc.
                                         //for g1+ the array has low level numbers, ie arcseconds,
                                         //unchanged from what Dexter sends to DDE.
                                         //But methods like measured_angle return degrees.
    }
    job_id()                        { return this.robot_status[Dexter.JOB_ID]}
    instruction_id()                { return this.robot_status[Dexter.INSTRUCTION_ID]}
    start_time()                    { return this.robot_status[Dexter.START_TIME]}
    stop_time()                     { return this.robot_status[Dexter.STOP_TIME]}
    instruction_type()              { return this.robot_status[Dexter.INSTRUCTION_TYPE]}
    error_code()                    { return this.robot_status[Dexter.ERROR_CODE]}
    dma_read_data()                 { return this.robot_status[Dexter.DMA_READ_INSTRUCTION]}
    read_block_count()              { return this.robot_status[Dexter.READ_BLOCK_COUNT]}
    end_effector_io_in()            { return this.robot_status[Dexter.END_EFFECTOR_IO_IN]} //was end_effector_io_in

    status_mode(){
        return RobotStatus.array_status_mode(this.robot_status)
    }

    static array_status_mode(robot_status_array){
        let raw = robot_status_array[Dexter.STATUS_MODE]
        if      (typeof(raw) === "string") { return parseInt(raw) }
        else if (typeof(raw === "number")) { return raw }
    }

    static is_other_status_mode(sm){ //such status_modes will use generic table display.
        return ![0, 1, 2].includes(sm)
    }

    supports_measured_angles(){
        return (this.status_mode() < 3)
    }

    value_at_index(index){
        if((index < 0) || (index > 59)) {
            return this.robot_status(index)
        }
        else {
            dde_error("RobotStatus.value_at_index called with index that's not between 0 and 59 iclusive: " + index)
        }
    }

    //below for g0 only
    angle(joint_number){
        let sm = this.status_mode()
        if(sm === 0) {
            let label = "Dexter.J" + joint_number + "_ANGLE"
            let index = value_of_path(label)
            let result = this.robot_status[index]
            if(typeof(result) == "number") { return result}
            else {
                  dde_error("RobotStatus.angle passed joint_number: " + joint_number +
                             "<br/> but the value of that is: " + result +
                             "<br/> when it should be a number." +
                             "<br/>The whole robot status is: " + this.robot_status)

                 }
        }
        else {
            dde_error("RobotStatus.angle is invalid for status_mode: " + sm)
        }
    }

    angles(joint_count=5){
        let sm = this.status_mode()
        if(sm === 0) {
            let result = []
            for(let j_number = 1; j_number <= joint_count;  j_number++){
                result.push(this.angle(j_number))
            }
            return result
        }
        else {
            dde_error("RobotStatus.angles is invalid for status_mode: " + sm)
        }
    }

    delta(joint_number){
        let sm = this.status_mode()
        if(sm === 0) {
            let label = "Dexter.J" + joint_number + "_DELTA"
            let index = value_of_path(label)
            let result = this.robot_status[index]
            if(typeof(result) == "number") { return result}
            else { dde_error("RobotStatus.delta passed joint_number: " + joint_number + " which isn't valid.") }
        }
        else {
            dde_error("RobotStatus.delta is invalid for status_mode: " + sm)
        }
    }

    deltas(joint_count=5){
        let sm = this.status_mode()
        if(sm === 0) {
            let result = []
            for(let j_number = 1; j_number <= joint_count;  j_number++){
                result.push(this.delta(j_number))
            }
            return result
        }
        else {
            dde_error("RobotStatus.deltas is invalid for status_mode: " + sm)
        }
    }

    pid_delta(joint_number){
        let sm = this.status_mode()
        if(sm === 0) {
            let label = "Dexter.J" + joint_number + "_PID_DELTA"
            let index = value_of_path(label)
            let result = this.robot_status[index]
            if(typeof(result) == "number") { return result}
            else { dde_error("RobotStatus.pid_delta passed joint_number: " + joint_number + " which isn't valid.") }
        }
        if(sm === 2) {
            let label = "Dexter.J" + joint_number + "_PID_DELTA_G2"
            let index = value_of_path(label)
            let result = this.robot_status[index]
            if(typeof(result) == "number") { return result}
            else { dde_error("RobotStatus.pid_delta passed joint_number: " + joint_number + " which isn't valid.") }
        }
        else {
            dde_error("RobotStatus.pid_delta is invalid for status_mode: " + sm)
        }
    }

    pid_deltas(joint_count=5){
        let sm = this.status_mode()
        if(sm === 0) {
            let result = []
            for(let j_number = 1; j_number <= joint_count;  j_number++){
                result.push(this.pid_delta(j_number))
            }
            return result
        }
        else {
            dde_error("RobotStatus.pid_deltas is invalid for status_mode: " + sm)
        }
    }

    /*force_calc_angle(joint_number){
        let result = this.robot_status["J" + joint_number + "_FORCE_CALC_ANGLE"]
        if(typeof(result) == "number") { return result}
        else { dde_error("RobotStatus.force_calc_angle passed joint_number: " + joint_number + " which isn't valid.") }
    }

    force_calc_angles(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.force_calc_angle(j_number))
        }
        return result
    }*/

    a2d_sin(joint_number){
        let sm = this.status_mode()
        if(sm === 0) {
            let label = "Dexter.J" + joint_number + "_A2D_SIN"
            let index = value_of_path(label)
            let result = this.robot_status[index]
            if(typeof(result) == "number") { return result}
            else { dde_error("RobotStatus.a2d_sin passed joint_number: " + joint_number + " which isn't valid.") }
        }
        else if(sm === 2) {
            let label = "Dexter.J" + joint_number + "_A2D_SIN_G2"
            let index = value_of_path(label)
            let result = this.robot_status[index]
            if(typeof(result) == "number") { return result}
            else { dde_error("RobotStatus.a2d_sin passed joint_number: " + joint_number + " which isn't valid.") }
        }
        else {
            dde_error("RobotStatus.a2d_sin is invalid for status_mode: " + sm)
        }
    }

    a2d_sins(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.a2d_sin(j_number))
        }
        return result
    }

    a2d_cos(joint_number){
        let sm = this.status_mode()
        if(sm === 0) {
            let label = "Dexter.J" + joint_number + "_A2D_COS"
            let index = value_of_path(label)
            let result = this.robot_status[index]
            if(typeof(result) == "number") { return result}
            else { dde_error("RobotStatus.a2d_cos passed joint_number: " + joint_number + " which isn't valid.") }
        }
        else if(sm === 2) {
            let label = "Dexter.J" + joint_number + "_A2D_COS_G2"
            let index = value_of_path(label)
            let result = this.robot_status[index]
            if(typeof(result) == "number") { return result}
            else { dde_error("RobotStatus.a2d_cos passed joint_number: " + joint_number + " which isn't valid.") }
        }
        else {
            dde_error("RobotStatus.a2d_cos is invalid for status_mode: " + sm)
        }
    }

    a2d_coses(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.a2d_cos(j_number))
        }
        return result

    }

    sent(joint_number){
        let sm = this.status_mode()
        if(sm === 0) {
            let label = "Dexter.J" + joint_number + "_SENT"
            let index = value_of_path(label)
            let result = this.robot_status[index]
            if(typeof(result) === "number") { return result}
            else { dde_error("RobotStatus.sent passed joint_number: " + joint_number + " which isn't valid.") }
        }
        if(sm === 2) {
            let label = "Dexter.J" + joint_number + "_SENT"
            let index = value_of_path(label)
            let result = this.robot_status[index]
            if(typeof(result) === "number") { return result}
            else { dde_error("RobotStatus.sent passed joint_number: " + joint_number + " which isn't valid.") }
        }
        else {
            dde_error("RobotStatus.sent is invalid for status_mode: " + sm)
        }
    }

    sents(joint_count=5){
        let sm = this.status_mode()
        if((sm === 0) || (sm === 2)) {
            let result = []
            for(let j_number = 1; j_number <= joint_count;  j_number++){
                result.push(this.sent(j_number))
            }
            return result
        }
        else {
            dde_error("RobotStatus.sents is invalid for status_mode: " + sm)
        }
    }

    //works for g0 & g1  returns angle in degrees except
    //if raw=true, then return the number in the array without converting
    //used in
    measured_angle(joint_number, raw=false) {
        let sm = this.status_mode()
        if(sm === 0) {
            if      (joint_number == 1) { return this.robot_status[Dexter.J1_MEASURED_ANGLE] }
            else if (joint_number == 2) { return this.robot_status[Dexter.J2_MEASURED_ANGLE] }
            else if (joint_number == 3) { return this.robot_status[Dexter.J3_MEASURED_ANGLE] }
            else if (joint_number == 4) { return this.robot_status[Dexter.J4_MEASURED_ANGLE] }
            else if (joint_number == 5) { return this.robot_status[Dexter.J5_MEASURED_ANGLE] }
            else if (joint_number == 6) { return this.robot_status[Dexter.J6_MEASURED_ANGLE] }
            else if (joint_number == 7) { return this.robot_status[Dexter.J7_MEASURED_ANGLE] }
            else {
                dde_error("RobotStatus.measured_angle passed invalid joint_number of: " + joint_number +
                          "<br/>Valid numbers are 1 through 7.")
            }
        }
        else if (sm === 1) {
            if((joint_number >= 0) && (joint_number <= 10)){
                let index = 9 + joint_number
                let result = this.robot_status[index]
                if(!raw) { result = result / 3600 } //the usual case
                return result
            }
            else{
                dde_error("RobotStatus.measured_angle passed invalid joint_number of: " + joint_number +
                          "<br/>Valid numbers are 1 through 7.")
            }
        }
        if(sm === 2) {
            if((joint_number >= 0) && (joint_number <= 7)) {
                if      (joint_number == 1) { return this.robot_status[Dexter.J1_MEASURED_ANGLE_G2] / 3600 }
                else if (joint_number == 2) { return this.robot_status[Dexter.J2_MEASURED_ANGLE_G2] / 3600 }
                else if (joint_number == 3) { return this.robot_status[Dexter.J3_MEASURED_ANGLE_G2] / 3600 }
                else if (joint_number == 4) { return this.robot_status[Dexter.J4_MEASURED_ANGLE_G2] / 3600 }
                else if (joint_number == 5) { return this.robot_status[Dexter.J5_MEASURED_ANGLE_G2] / 3600 }
                else if (joint_number == 6) { return this.robot_status[Dexter.J6_MEASURED_ANGLE_G2] / 3600 }
                else if (joint_number == 7) { return this.robot_status[Dexter.J7_MEASURED_ANGLE_G2] / 3600 }
            }
            else {
                dde_error("RobotStatus.measured_angle passed invalid joint_number of: " + joint_number +
                    "<br/>Valid numbers are 1 through 7.")
            }
        }
        else {
            dde_error("RobotStatus.measured_angle isn't supported for status_mode of " + sm)
        }
    }

    //works for g0 & g1 returns angle in degrees
    measured_angles(joint_count=7, raw=false){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.measured_angle(j_number, raw))
        }
        return result
    }

    //array_of_measured_angles is in degrees
    //if raw is true, don't modify array_of_measured_angles when shoving them into the array
    //array_of_measured_angles expected to be in degrees, but if raw = true, it doesn't matter.
    set_measured_angles(array_of_measured_angles, raw=false){
        let rs_array = this.robot_status
        let sm = this.status_mode()
        if(sm === 0) { //angles in rs_array are in degrees
            rs_array[Dexter.J1_MEASURED_ANGLE] = array_of_measured_angles[0]
            rs_array[Dexter.J2_MEASURED_ANGLE] = array_of_measured_angles[1]
            rs_array[Dexter.J3_MEASURED_ANGLE] = array_of_measured_angles[2]
            rs_array[Dexter.J4_MEASURED_ANGLE] = array_of_measured_angles[3]
            rs_array[Dexter.J5_MEASURED_ANGLE] = array_of_measured_angles[4]
            rs_array[Dexter.J6_MEASURED_ANGLE] = array_of_measured_angles[5]
            rs_array[Dexter.J7_MEASURED_ANGLE] = array_of_measured_angles[6]
        }
        else if (sm === 1) { //angles in rs_array are in arcseconds
            for(let i = 0; i < 7; i++){
                let new_val = array_of_measured_angles[i]
                if(!raw) { new_val = new_val * 3600 } //usual
                rs_array[10 + i] = new_val
            }
        }
        else if(sm === 2) { //angles in rs_array are in degrees
            rs_array[Dexter.J1_MEASURED_ANGLE_G2] = array_of_measured_angles[0]
            rs_array[Dexter.J2_MEASURED_ANGLE_G2] = array_of_measured_angles[1]
            rs_array[Dexter.J3_MEASURED_ANGLE_G2] = array_of_measured_angles[2]
            rs_array[Dexter.J4_MEASURED_ANGLE_G2] = array_of_measured_angles[3]
            rs_array[Dexter.J5_MEASURED_ANGLE_G2] = array_of_measured_angles[4]
            rs_array[Dexter.J6_MEASURED_ANGLE_G2] = array_of_measured_angles[5]
            rs_array[Dexter.J7_MEASURED_ANGLE_G2] = array_of_measured_angles[6]
        }
        else {
            dde_error("RobotStatus.set_measured_angles can't handle status_mode: " + sm)
        }
    }

    //works only for g1
    torque(joint_number) {
        if(this.status_mode() === 1) {
            if((joint_number >= 0) && (joint_number <= 7)) {
                let index = 19 + joint_number
                return this.robot_status[index] / 1000000
            }
            else {
                dde_error("RobotStatus.torque passed invalid joint_number of: " + joint_number +
                    "<br/>Valid numbers are 1 through 7.")
            }
        }
        else {
            dde_error("RobotStatus.torque called using status_mode " + sm + ", but it only works for 1.")
        }
    }

    //works only for g1
    torques(joint_count=7){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.torque(j_number))
        }
        return result
    }

    //works only for g1 returned value is in degrees per second
    velocity(joint_number) {
        if(this.status_mode() === 1) {
            if((joint_number >= 0) && (joint_number <= 7)) {
                let index = 29 + joint_number
                return this.robot_status[index] / 3600
            }
            else {
                dde_error("RobotStatus.velocity passed invalid joint_number of: " + joint_number +
                    "<br/>Valid numbers are 1 through 7.")
            }
        }
        else {
            dde_error("RobotStatus.velocity called using status_mode " + sm + ", but it only works for 1.")
        }
    }

    //works only for g1  returned values are in degrees per second
    velocities(joint_count=7){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.velocity(j_number))
        }
        return result
    }

    raw_encoder_angle(joint_number) {
        let sm = this.status_mode()
        if(sm === 2) {
            if      (joint_number == 1) { return this.robot_status[Dexter.J1_RAW_ENCODER_ANGLE_FXP_G2] }
            else if (joint_number == 2) { return this.robot_status[Dexter.J2_RAW_ENCODER_ANGLE_FXP_G2] }
            else if (joint_number == 3) { return this.robot_status[Dexter.J3_RAW_ENCODER_ANGLE_FXP_G2] }
            else if (joint_number == 4) { return this.robot_status[Dexter.J4_RAW_ENCODER_ANGLE_FXP_G2] }
            else if (joint_number == 5) { return this.robot_status[Dexter.J5_RAW_ENCODER_ANGLE_FXP_G2] }
            else {
                dde_error("RobotStatus.measured_angle passed invalid joint_number of: " + joint_number +
                    "<br/>Valid numbers are 1 through 5.")
            }
        }
        else {
            dde_error("RobotStatus.raw_encoder_angle called using status_mode: " + sm + ", but it only works for 2.")
        }
    }

    raw_encoder_angles(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.raw_encoder_angle(j_number))
        }
        return result
    }

    eye_number(joint_number) {
        let sm = this.status_mode()
        if(sm === 2) {
            if      (joint_number == 1) { return this.robot_status[Dexter.J1_EYE_NUMBER_G2] }
            else if (joint_number == 2) { return this.robot_status[Dexter.J2_EYE_NUMBER_G2] }
            else if (joint_number == 3) { return this.robot_status[Dexter.J3_EYE_NUMBER_G2] }
            else if (joint_number == 4) { return this.robot_status[Dexter.J4_EYE_NUMBER_G2] }
            else if (joint_number == 5) { return this.robot_status[Dexter.J5_EYE_NUMBER_G2] }
            else {
                dde_error("RobotStatus.measured_angle passed invalid joint_number of: " + joint_number +
                    "<br/>Valid numbers are 1 through 5.")
            }
        }
        else {
            dde_error("RobotStatus.raw_encoder_angle called using status_mode: " + sm + ", but it only works for 2.")
        }
    }

    eye_numbers(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.eye_number(j_number))
        }
        return result
    }


    //returns array. First elt is an array of x,y,z
    xyz(){
        let joint_angles = this.measured_angles(5)
        return Kin.J_angles_to_xyz(joint_angles)
    }

    static fill_robot_status_array_with_another(rs_array_to_modify, source_of_values_rs_array, raw=false){
       for(let i = 0; i < 10; i++){
           if(i !== Dexter.STATUS_MODE) { //don't change the status_mode of rs_array_to_modify, as that's the real reason we're calling this whole method
                rs_array_to_modify[i] = source_of_values_rs_array[i]
           }
       }
       let arr_mod_RS = new RobotStatus({robot_status: rs_array_to_modify})
       let arr_src_RS = new RobotStatus({robot_status: source_of_values_rs_array})
       let arr_src_mes_angs = arr_src_RS.measured_angles(7, raw)
       arr_mod_RS.set_measured_angles(arr_src_mes_angs, raw)
    }

}
globalThis.RobotStatus = RobotStatus