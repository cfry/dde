var {Dexter}  = require("./robot.js")

class FPGA {
    static command_reg_val({
                CapCalibrateBase = false,
                CapCalibrateEnd = false,
                CapCalibratePivot = false,
                MoveEnable = false,
                GoMove = false,
                EnableLoop = false,
                AClrLoop = false,
                CalRun = false,
                ResetMotorPosition = false,
                ResetForce = false,
                CapCalAngle = false,
                CapCalRot = false,
                AngleEnable = false,
                RotEnable = false
            }={}){
        let result = 0
        if(CapCalibrateBase){   result += 1}
        if(CapCalibrateEnd){    result += 2}
        if(CapCalibratePivot){  result += 4}
        if(MoveEnable){         result += 8}
        if(GoMove){             result += 16}
        if(EnableLoop){         result += 32}
        if(AClrLoop){           result += 64}
        if(CalRun){             result += 128}
        if(ResetMotorPosition){ result += 256}
        if(ResetForce){         result += 512}
        if(CapCalAngle){        result += 1024}
        if(CapCalRot){          result += 2048}
        if(AngleEnable){        result += 4096}
        if(RotEnable){          result += 8192}
        return result
    }
    /* not used. We must use FPGA.BASE_POSITION = 0 from below
      and not the series, because FPGA is part of the job engine,
      and that does NOT have series in them.
      So the below long list is redundant with
     */
    static init(){
        for(let i = 0; i < FPGA.w_oplet_address_names.length; i++){
            let name = FPGA.w_oplet_address_names[i]
            eval(name + " = " + i)
        }
    }
}
FPGA.w_oplet_address_names =[
    "FPGA.BASE_POSITION",  // 0
    "FPGA.END_POSITION",  // 1
    "FPGA.PIVOT_POSITION",  // 2
    "FPGA.ANGLE_POSITION",  // 3
    "FPGA.ROT_POSITION",  // 4
    "FPGA.ACCELERATION_MAXSPEED",  // 5
    "FPGA.BASE_SIN_CENTER",  // 6
    "FPGA.BASE_COS_CENTER",  // 7
    "FPGA.END_SIN_CENTER",  // 8
    "FPGA.END_COS_CENTER",  // 9
    "FPGA.PIVOT_SIN_CENTER",  // 10
    "FPGA.PIVOT_COS_CENTER",  // 11
    "FPGA.ANGLE_SIN_CENTER",  // 12
    "FPGA.ANGLE_COS_CENTER",  // 13
    "FPGA.ROT_SIN_CENTER",  // 14
    "FPGA.ROT_COS_CENTER",  // 15
    "FPGA.PID_DELTATNOT",  // 16
    "FPGA.PID_DELTAT",  // 17
    "FPGA.PID_D",  // 18
    "FPGA.PID_I",  // 19
    "FPGA.PID_P",  // 20
    "FPGA.PID_ADDRESS",  // 21
    "FPGA.BOUNDRY_BASE",  // 22
    "FPGA.BOUNDRY_END",  // 23
    "FPGA.BOUNDRY_PIVOT",  // 24
    "FPGA.BOUNDRY_ANGLE",  // 25
    "FPGA.BOUNDRY_ROT",  // 26
    "FPGA.SPEED_FACTORA",  // 27
    "FPGA.SPEED_FACTORB",  // 28
    "FPGA.FRICTION_BASE",  // 29
    "FPGA.FRICTION_END",  // 30
    "FPGA.FRICTION_PIVOT",  // 31
    "FPGA.FRICTION_ANGLE",  // 32
    "FPGA.FRICTION_ROT",  // 33
    "FPGA.MOVE_TRHESHOLD",  // 34
    "FPGA.F_FACTOR",  // 35
    "FPGA.MAX_ERROR",  // 36
    "FPGA.FORCE_BIAS_BASE",  // 37
    "FPGA.FORCE_BIAS_END",  // 38
    "FPGA.FORCE_BIAS_PIVOT",  // 39
    "FPGA.FORCE_BIAS_ANGLE",  // 40
    "FPGA.FORCE_BIAS_ROT",  // 41
    "FPGA.COMMAND_REG",  // 42
    "FPGA.DMA_CONTROL",  // 43
    "FPGA.DMA_WRITE_DATA",  // 44
    "FPGA.DMA_WRITE_PARAMS",  // 45
    "FPGA.DMA_WRITE_ADDRESS",  // 46
    "FPGA.DMA_READ_PARAMS",  // 47
    "FPGA.DMA_READ_ADDRESS",  // 48
    "FPGA.REC_PLAY_CMD",  // 49
    "FPGA.REC_PLAY_TIMEBASE",  // 50
    "FPGA.MAXSPEED_XYZ",  // 51
    "FPGA.DIFF_FORCE_BETA",  // 52
    "FPGA.DIFF_FORCE_MOVE_THRESHOLD",  // 53
    "FPGA.DIFF_FORCE_MAX_SPEED",  // 54
    "FPGA.DIFF_FORCE_SPEED_FACTOR_ANGLE",  // 55
    "FPGA.DIFF_FORCE_SPEED_FACTOR_ROT",  // 56
    "FPGA.DIFF_FORCE_ANGLE_COMPENSATE",  // 57
    "FPGA.FINE_ADJUST_BASE",  // 58
    "FPGA.FINE_ADJUST_END",  // 59
    "FPGA.FINE_ADJUST_PIVOT",  // 60
    "FPGA.FINE_ADJUST_ANGLE",  // 61
    "FPGA.FINE_ADJUST_ROT",  // 62
    "FPGA.RECORD_LENGTH",  // 63
    "FPGA.END_EFFECTOR_IO",  // 64
    "FPGA.SERVO_SETPOINT_A",  // 65
    "FPGA.SERVO_SETPOINT_B",  // 66
    "FPGA.BASE_FORCE_DECAY",  // 67
    "FPGA.END_FORCE_DECAY",  // 68
    "FPGA.PIVOT_FORCE_DECAY",  // 69
    "FPGA.ANGLE_FORCE_DECAY",  // 70
    "FPGA.ROTATE_FORCE_DECAY",  // 71
    "FPGA.PID_SCHEDULE_INDEX",  // 72
    "FPGA.GRIPPER_MOTOR_CONTROL",  // 73
    "FPGA.GRIPPER_MOTOR_OFF_WIDTH",  // 74
    "FPGA.GRIPPER_MOTOR_ON_WIDTH",  // 75
    "FPGA.START_SPEED",  // 76
    "FPGA.ANGLE_END_RATIO",  // 77
    "FPGA.RESET_PID_AND_FLUSH_QUEUE",  // 78
    "FPGA.XYZ_FORCE_TIMEBASE",  // 79
    "FPGA.DIFFERENTIAL_FORCE_TIMEBASE",  // 80
    "FPGA.PID_TIMEBASE"]

module.exports.FPGA = FPGA
/* obsolete, now down by FPGA.init()
FPGA.BASE_POSITION = 0
FPGA.END_POSITION = 1
FPGA.PIVOT_POSITION = 2
FPGA.ANGLE_POSITION = 3
FPGA.ROT_POSITION = 4
FPGA.ACCELERATION_MAXSPEED = 5
FPGA.BASE_SIN_CENTER = 6
FPGA.BASE_COS_CENTER = 7
FPGA.END_SIN_CENTER = 8
FPGA.END_COS_CENTER = 9
FPGA.PIVOT_SIN_CENTER = 10
FPGA.PIVOT_COS_CENTER = 11
FPGA.ANGLE_SIN_CENTER = 12
FPGA.ANGLE_COS_CENTER = 13
FPGA.ROT_SIN_CENTER = 14
FPGA.ROT_COS_CENTER = 15
FPGA.PID_DELTATNOT = 16
FPGA.PID_DELTAT = 17
FPGA.PID_D = 18
FPGA.PID_I = 19
FPGA.PID_P = 20
FPGA.PID_ADDRESS = 21
FPGA.BOUNDRY_BASE = 22
FPGA.BOUNDRY_END = 23
FPGA.BOUNDRY_PIVOT = 24
FPGA.BOUNDRY_ANGLE = 25
FPGA.BOUNDRY_ROT = 26
FPGA.SPEED_FACTORA = 27
FPGA.SPEED_FACTORB = 28
FPGA.FRICTION_BASE = 29
FPGA.FRICTION_END = 30
FPGA.FRICTION_PIVOT = 31
FPGA.FRICTION_ANGLE = 32
FPGA.FRICTION_ROT = 33
FPGA.MOVE_TRHESHOLD = 34
FPGA.F_FACTOR = 35
FPGA.MAX_ERROR = 36
FPGA.FORCE_BIAS_BASE = 37
FPGA.FORCE_BIAS_END = 38
FPGA.FORCE_BIAS_PIVOT = 39
FPGA.FORCE_BIAS_ANGLE = 40
FPGA.FORCE_BIAS_ROT = 41
FPGA.COMMAND_REG = 42
FPGA.DMA_CONTROL = 43
FPGA.DMA_WRITE_DATA = 44
FPGA.DMA_WRITE_PARAMS = 45
FPGA.DMA_WRITE_ADDRESS = 46
FPGA.DMA_READ_PARAMS = 47
FPGA.DMA_READ_ADDRESS = 48
FPGA.REC_PLAY_CMD = 49
FPGA.REC_PLAY_TIMEBASE = 50
FPGA.MAXSPEED_XYZ = 51
FPGA.DIFF_FORCE_BETA = 52
FPGA.DIFF_FORCE_MOVE_THRESHOLD = 53
FPGA.DIFF_FORCE_MAX_SPEED = 54
FPGA.DIFF_FORCE_SPEED_FACTOR_ANGLE = 55
FPGA.DIFF_FORCE_SPEED_FACTOR_ROT = 56
FPGA.DIFF_FORCE_ANGLE_COMPENSATE = 57
FPGA.FINE_ADJUST_BASE = 58
FPGA.FINE_ADJUST_END = 59
FPGA.FINE_ADJUST_PIVOT = 60
FPGA.FINE_ADJUST_ANGLE = 61
FPGA.FINE_ADJUST_ROT = 62
FPGA.RECORD_LENGTH = 63
FPGA.END_EFFECTOR_IO = 64
FPGA.SERVO_SETPOINT_A = 65
FPGA.SERVO_SETPOINT_B = 66
FPGA.BASE_FORCE_DECAY = 67
FPGA.END_FORCE_DECAY = 68
FPGA.PIVOT_FORCE_DECAY = 69
FPGA.ANGLE_FORCE_DECAY = 70
FPGA.ROTATE_FORCE_DECAY = 71
FPGA.PID_SCHEDULE_INDEX = 72
FPGA.GRIPPER_MOTOR_CONTROL = 73
FPGA.GRIPPER_MOTOR_OFF_WIDTH = 74
FPGA.GRIPPER_MOTOR_ON_WIDTH = 75
FPGA.START_SPEED = 76
FPGA.ANGLE_END_RATIO = 77
FPGA.RESET_PID_AND_FLUSH_QUEUE = 78
FPGA.XYZ_FORCE_TIMEBASE = 79
FPGA.DIFFERENTIAL_FORCE_TIMEBASE = 80
FPGA.PID_TIMEBASE = 81

*/

Dexter.set_fpga_command_reg = function({
    CapCalibrateBase = false,
    CapCalibrateEnd = false,
    CapCalibratePivot = false,
    MoveEnable = false,
    GoMove = false,
    EnableLoop = false,
    AClrLoop = false,
    CalRun = false,
    ResetMotorPosition = false,
    ResetForce = false,
    CapCalAngle = false,
    CapCalRot = false,
    AngleEnable = false,
    RotEnable = false} = {}) {
    let val = FPGA.command_reg_val({
        CapCalibrateBase: CapCalibrateBase,
        CapCalibrateEnd: CapCalibrateEnd,
        CapCalibratePivot: CapCalibratePivot,
        MoveEnable: MoveEnable,
        GoMove: GoMove,
        EnableLoop: EnableLoop,
        AClrLoop: AClrLoop,
        CalRun: CalRun,
        ResetMotorPosition: ResetMotorPosition,
        ResetForce: ResetForce,
        CapCalAngle: ResetForce,
        CapCalRot: CapCalRot,
        AngleEnable: AngleEnable,
        RotEnable:RotEnable
        })
    return make_ins("w", FPGA.COMMAND_REG, val )
}

/*
Example use:
    make_ins('w', FPGA.COMMAND_REG, FPGA.command_reg_val({
        EnableLoop: true,
        CAL_RUN: true,
        ResetForce: true,
        AngleEnable: true,
        RotEnable: true
    }))
*/