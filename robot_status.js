/*issues
  measured_angles now returns array of 5. But might we want array of 6 or 7?
     proposal takes 1 arg, # of angles to return. Default=5, but could be 6 or 7 (or 1 thru 4)
*/

//Robot Status Class (as distinguished from the robot_status 1D array of 60 elts.
var RobotStatus = class RobotStatus{
    constructor({robot_status="required"}){
        this.robot_status = robot_status
    }
    job_id()                        { return this.robot_status[Dexter.JOB_ID] }
    instruction_id()                { return this.robot_status[Dexter.INSTRUCTION_ID]}
    start_time()                    { return this.robot_status[Dexter.START_TIME]}
    stop_time()                     { return this.robot_status[Dexter.STOP_TIME]}
    instruction_type()              { return this.robot_status[Dexter.INSTRUCTION_TYPE]}
    error_code()                    { return this.robot_status[Dexter.ERROR_CODE]}
    job_id_of_current_instruction() { return this.robot_status[Dexter.JOB_ID_OF_CURRENT_INSTRUCTION]}
    current_instruction_id()        { return this.robot_status[Dexter.CURRENT_INSTRUCTION_ID]}
    //unused "RECORD_BLOCK_SIZE",   //same name                    8 //unused
    end_effector_in()               { return this.robot_status[Dexter.END_EFFECTOR_IN]}

    angle(joint_number){
        let result = this.robot_status["J" + joint_number + "_ANGLE"]
        if(typeof(result) == "number") { return result}
        else { dde_error("RobotStatus.angle passed joint_number: " + joint_number + " which isn't valid.") }
    }

    angles(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.angle(j_number))
        }
        return result
    }

    delta(joint_number){
        let result = this.robot_status["J" + joint_number + "__DELTA"]
        if(typeof(result) == "number") { return result}
        else { dde_error("RobotStatus.delta passed joint_number: " + joint_number + " which isn't valid.") }
    }

    deltas(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.delta(j_number))
        }
        return result
    }

    pid_delta(joint_number){
        let result = this.robot_status["J" + joint_number + "_PID_DELTA"]
        if(typeof(result) == "number") { return result}
        else { dde_error("RobotStatus.pid_delta passed joint_number: " + joint_number + " which isn't valid.") }
    }

    pid_deltas(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.pid_delta(j_number))
        }
        return result
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
        let result = this.robot_status["J" + joint_number + "_A2D_SIN"]
        if(typeof(result) == "number") { return result}
        else { dde_error("RobotStatus.a2d_sin passed joint_number: " + joint_number + " which isn't valid.") }
    }

    a2d_sins(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.a2d_sin(j_number))
        }
        return result
    }

    a2d_cos(joint_number){
        let result = this.robot_status["J" + joint_number + "_A2D_COS"]
        if(typeof(result) == "number") { return result}
        else { dde_error("RobotStatus.a2d_cos passed joint_number: " + joint_number + " which isn't valid.") }
    }

    a2d_coses(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.a2d_cos(j_number))
        }
        return result
    }

    measured_angle(joint_number) {
        if      (joint_number == 1) { return this.robot_status[Dexter.J1_MEASURED_ANGLE] }
        else if (joint_number == 2) { return this.robot_status[Dexter.J2_MEASURED_ANGLE] }
        else if (joint_number == 3) { return this.robot_status[Dexter.J3_MEASURED_ANGLE] }
        else if (joint_number == 4) { return this.robot_status[Dexter.J4_MEASURED_ANGLE] }
        else if (joint_number == 5) { return this.robot_status[Dexter.J5_MEASURED_ANGLE] }
        else if (joint_number == 6) { return this.robot_status[Dexter.J6_MEASURED_ANGLE] }
        else if (joint_number == 7) { return this.robot_status[Dexter.J7_MEASURED_ANGLE] }
        else { dde_error("RobotStatus.measured_angle passed joint_number: " + joint_number + " which isn't valid.") }
    }
    measured_angles(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.measured_angle(j_number))
        }
        return result
    }

    send(joint_number){
        let result = this.robot_status["J" + joint_number + "_SENT"]
        if(typeof(result) == "number") { return result}
        else { dde_error("RobotStatus.sent passed joint_number: " + joint_number + " which isn't valid.") }
    }

    sents(joint_count=5){
        let result = []
        for(let j_number = 1; j_number <= joint_count;  j_number++){
            result.push(this.sent(j_number))
        }
        return result
    }
}