import './robot.js'//even though Robot is global,
//we import it here, just to make sure its loaded,
//before the below code is loaded.

class IO{}

IO.get_page     = Robot.get_page
IO.grab_robot_status = Robot.grab_robot_status
IO.out          = Robot.out
IO.save_picture = Robot.save_picture
IO.show_picture = Robot.show_picture
IO.show_video   = Robot.show_video
IO.take_picture = Robot.take_picture
//read_file and write_file are Dexter-specific instructions only,
//so they are under Dexter.read_file and Dexter.write_file

globalThis.IO = IO


