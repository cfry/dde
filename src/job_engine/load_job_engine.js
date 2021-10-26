//symbols loaded from job_engine code needed by the test suite

import {sind, cosd, tand, asind, acosd, atand, atan2d} from "./math/Trig_in_Degrees.js"
import Convert from "./math/Convert.js"
import Coor    from "./math/Coor.js"
import Kin     from "./math/Kin.js"
import Vector  from "./math/Vector.js"
import txt     from "./math/txt.js"
import calibrate_build_tables from "./low_level_dexter/calibrate_build_tables.js"

import {convertArrayBufferToString, convertStringToArrayBuffer,
    SerialPort, serial_port_init, serial_port_path_to_info_map,
    serial_devices, serial_devices_async,
    serial_connect_low_level,
    serial_send_low_level, serial_connect, serial_send, serial_flush, serial_disconnect,
    serial_disconnect_all} from "./core/serial.js"


import "./core/utils.js"

import {adjust_path_to_os, append_to_file,
     choose_file, choose_save_file, choose_file_and_get_content, choose_folder,
     copy_file_async, copy_folder_async,
     file_exists, folder_listing, folder_separator, folder_name_version_extension,
     get_latest_path, get_page_async,
     is_folder, load_files,
     make_folder, make_full_path, make_unique_path,
     persistent_get, persistent_remove, persistent_save,
     read_file, read_file_async, write_file, write_file_async}
     from "./core/storage.js"

var file_content = read_file //file_content is deprecated

import {deg_c_to_c, deg_c_to_f, deg_f_to_c,
     deg_c_to_k, deg_k_to_c,
     deg_k_to_f, deg_f_to_k, } from "./core/units.js"

//require('./core/je_and_browser_code.js') //don't set SW, just load
//load_files(__dirname + "/core/je_and_browser_code.js") //must be before loading out.js
import {beep, beeps, format_text_for_code, speak, show_window,
        show_window_values} from "./core/out.js"

import {DXF} from "./math/DXF.js"


import {Instruction, make_ins, human_task_handler, human_enter_choice_handler,
    human_enter_filepath_handler, human_enter_number_handler, human_enter_position_handler,
    human_enter_instruction_handler,
    human_enter_text_handler,
    human_notify_handler, human_show_window_handler}
    from "./core/instruction.js"

import {FPGA}from "./core/fpga.js"
import {Robot, Brain, Dexter, Human, Serial} from "./core/robot.js"
import {RobotStatus} from "./core/robot_status.js"

import {Control} from "./core/instruction_control.js"
import {IO} from "./core/instruction_io.js"
import Job  from "./core/job.js"
import {Messaging, MessStat} from "./core/messaging.js"
import {linux_error_message} from "./core/linux_error_message.js"

import "./core/html_db.js" //makes html_db, make_html, make_dom_elt,   global

import {Py} from "./core/py.js"

var keep_alive_value = true //only really used by node-browser
   //but effectively, dde, always has keep_alive_value true.
   //this should never actually be read by dde.



