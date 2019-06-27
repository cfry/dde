var {Robot} = require('./robot.js')

class Control{}

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
Control.error = Robot.error
Control.if_any_errors = Robot.if_any_errors

module.exports.Control = Control