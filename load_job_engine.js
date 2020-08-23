//symbols loaded from job_engine code needed by the test suite

var {sind, cosd, tand, asind, acosd, atand, atan2d} = require("./math/Trig_in_Degrees.js")
var Convert = require("./math/Convert.js")
var Coor    = require("./math/Coor.js")
var Kin     = require("./math/Kin.js")
var Vector  = require("./math/Vector.js")
var txt     = require("./math/txt.js")
var calibrate_build_tables = require("./low_level_dexter/calibrate_build_tables.js")

var {SerialPort, serial_port_init, serial_path_to_info_map,
    serial_devices, serial_devices_async,
    serial_connect_low_level,
    serial_send_low_level, serial_connect, serial_send, serial_flush, serial_disconnect,
    serial_disconnect_all} = require("./core/serial.js")


var {array_to_csv, csv_to_array, Duration, flatten, fn_is_keyword_fn, format_number,
    is_array_of_numbers, make_ins_arrays,
    ordinal_string, patch_until, return_first_arg,
    same_elts, shouldnt, show_string_char_codes,
    time_in_us, trim_comments_from_front,
    version_equal, version_less_than, version_more_than, dde_version_between} = require("./core/utils.js")

var {choose_file, choose_save_file, choose_file_and_get_content,
     read_file, read_file_async, file_exists, folder_listing, is_folder, load_files,
     make_folder, make_full_path,
     persistent_get, persistent_remove, persistent_save,
     write_file, write_file_async} = require("./core/storage.js")

var file_content = read_file //file_content is deprecated

var {deg_c_to_c, deg_c_to_f, deg_f_to_c,
     deg_c_to_k, deg_k_to_c,
     deg_k_to_f, deg_f_to_k, } = require("./core/units.js")

//require('./core/je_and_browser_code.js') //don't set SW, just load
//load_files(__dirname + "/core/je_and_browser_code.js") //must be before loading out.js
var {beep, beeps, format_text_for_code, speak, show_window, show_window_values} = require("./core/out.js")

var {DXF} = require("./math/DXF.js")


var {Instruction, make_ins, human_task_handler, human_enter_choice_handler,
    human_enter_filepath_handler, human_enter_number_handler, human_enter_position_handler,
    human_enter_instruction_handler,
    human_enter_text_handler,
    human_notify_handler, human_show_window_handler} = require("./core/instruction.js")

var {FPGA} = require('./core/fpga.js')
var {Robot, Brain, Dexter, Human, Serial} = require('./core/robot.js')
var {RobotStatus} = require('./core/robot_status.js')

var {Control} = require('./core/instruction_control.js')
var {IO} = require('./core/instruction_io.js')
var Job  = require('./core/job.js')
var {Messaging, MessStat} = require('./core/messaging.js')
var {linux_error_message} = require('./core/linux_error_message.js')

var {make_dom_elt, make_html} = require("./core/html_db.js")

var keep_alive_value = true //only really used by node-browser,
   //but effectively, dde, always has keep_alive_value true.
   //this should never actually be read by dde.



