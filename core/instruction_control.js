
var {Robot} = require('./robot.js')

class Control{
    static is_control_instruction(arg){
        if(!this.instruction_classes_in_control) {
            this.init_classes_in_control()
        }
        for(let claz of Control.instruction_classes_in_control){
            if(arg instanceof claz) { return true }
        }
        return false
     }
    /*static is_control_instruction(arg){
        for(let claz of Instruction.control_classes){
            if(arg instanceof claz) { return true }
        }
        return false
    }*/
     static init_classes_in_control() {
        Control.instruction_classes_in_control = [
            Instruction.break,
            Instruction.go_to,
            Instruction.loop,
            Instruction.label,
            Instruction.suspend,
            Instruction.unsuspend,
            Instruction.sync_point,
            Instruction.wait_until,

            Instruction.include_job,
            Instruction.send_to_job,
            Instruction.sent_from_job,
            Instruction.start_job,
            Instruction.stop_job,

            Instruction.debugger,
            Instruction.step_instructions,
            Instruction.error,
            Instruction.if_any_errors
        ]
     }
}
Control.instruction_classes_in_control = null

//Methods that result in an instance of a Control class
Control.break = Robot.break
Control.go_to = Robot.go_to
Control.loop = Robot.loop
Control.label = Robot.label
Control.suspend = Robot.suspend
Control.unsuspend = Robot.unsuspend
Control.sync_point = Robot.sync_point
Control.wait_until = Robot.wait_until

Control.include_job = Robot.include_job
Control.send_to_job = Robot.send_to_job
Control.sent_from_job = Robot.sent_from_job
Control.start_job = Robot.start_job
Control.stop_job = Robot.stop_job

Control.debugger = Robot.debugger
Control.step_instructions = Robot.step_instructions
Control.error = Robot.error
Control.if_any_errors = Robot.if_any_errors

module.exports.Control = Control

var {Instruction} = require('./instruction.js')



