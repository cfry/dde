//symbols loaded from job_engine code needed by the test suite

var {sind, cosd, tand, asind, acosd, atand, atan2d} = require("./math/Trig_in_Degrees.js")
var Convert = require("../job_engine/math/Convert.js")
var Coor    = require("../job_engine/math/Coor.js")
var Kin     = require("../job_engine/math/Kin.js")
var Vector  = require("../job_engine/math/Vector.js")
var txt     = require("../job_engine/math/txt.js")
var calibrate_build_tables = require("../job_engine/low_level_dexter/calibrate_build_tables.js")

var {convertArrayBufferToString, convertStringToArrayBuffer,
    SerialPort, serial_port_init, serial_port_path_to_info_map,
    serial_devices, serial_devices_async,
    serial_connect_low_level,
    serial_send_low_level, serial_connect, serial_send, serial_flush, serial_disconnect,
    serial_disconnect_all} = require("../job_engine/core/serial.js")


var {array_to_html_table, array_to_csv, csv_to_array,
     base64_to_binary_string, binary_to_base64_string, is_string_base64,
     Duration, flatten, fn_is_keyword_fn, format_number,
    integer_array_to_rgb_string,
    is_array_of_numbers, is_2D_array_of_numbers, make_ins_arrays,
    ordinal_string, patch_until,
    return_first_arg, rgb,
    same_elts, shouldnt, show_string_char_codes, string_to_seconds,
    time_in_us, trim_comments_from_front,
    version_equal, version_less_than, version_more_than, dde_version_between} = require("../job_engine/core/utils.js")

var {adjust_path_to_os, append_to_file,
     choose_file, choose_save_file, choose_file_and_get_content, choose_folder,
     copy_file_async, copy_folder_async,
     file_exists, folder_listing, folder_separator, folder_name_version_extension,
     get_latest_path, get_page_async,
     is_folder, load_files,
     make_folder, make_full_path, make_unique_path,
     persistent_get, persistent_remove, persistent_save,
     read_file, read_file_async, write_file, write_file_async} = require("../job_engine/core/storage.js")

var file_content = read_file //file_content is deprecated

var {deg_c_to_c, deg_c_to_f, deg_f_to_c,
     deg_c_to_k, deg_k_to_c,
     deg_k_to_f, deg_f_to_k, } = require("../job_engine/core/units.js")

//require('./core/je_and_browser_code.js') //don't set SW, just load
//load_files(__dirname + "/core/je_and_browser_code.js") //must be before loading out.js
var {beep, beeps, format_text_for_code, speak, show_window, show_window_values} = require("../job_engine/core/out.js")

var {DXF} = require("../job_engine/math/DXF.js")


var {Instruction, make_ins, human_task_handler, human_enter_choice_handler,
    human_enter_filepath_handler, human_enter_number_handler, human_enter_position_handler,
    human_enter_instruction_handler,
    human_enter_text_handler,
    human_notify_handler, human_show_window_handler} = require("../job_engine/core/instruction.js")

var {FPGA} = require('../job_engine/core/fpga.js')
var {Robot, Brain, Dexter, Human, Serial} = require('../job_engine/core/robot.js')
var {RobotStatus} = require('../job_engine/core/robot_status.js')

var {Control} = require('../job_engine/core/instruction_control.js')
var {IO} = require('../job_engine/core/instruction_io.js')
var Job  = require('../job_engine/core/job.js')
var {Messaging, MessStat} = require('../job_engine/core/messaging.js')
var {linux_error_message} = require('../job_engine/core/linux_error_message.js')

var {ancestors_of_class, closest_ancestor_of_class,
     dom_elt_child_of_class, dom_elt_children_of_class, dom_elt_descendant_of_classes,
     focus_on_descendant_with_tag, html_db, html_to_dom_elt,
     is_dom_elt, is_dom_elt_ancestor, insert_elt_after, insert_elt_before,
     make_dom_elt, make_html,
    remove_dom_elt, replace_dom_elt} = require("../job_engine/core/html_db.js")

var {Py} = require('../job_engine/core/py.js')

var keep_alive_value = true //only really used by node-browser,
   //but effectively, dde, always has keep_alive_value true.
   //this should never actually be read by dde.



