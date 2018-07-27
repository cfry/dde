/* Created by Fry on 7/11/16.
//
//On Mac, to see serial ports, open Terminal app and enter: ls /dev/tty.* or ls /dev/cu.*
// https://learn.sparkfun.com/tutorials/terminal-basics/all  geared toward windows, but servicable.
//for devices, mac and linux have both tty and cu for full duplex. windows only has tty.
//Macintosh problems
//sparkfun RedBoard is an arduino Uno, what james loaned me.
//didn't work for uploading programs to the board.
//Arduino Micro and Leonado have something special ie "mouse and kbd support
//that allows them to work on Mac.  I got Arduino Leonardo because
//arduino mciro can't take shields.
//Mike says some ardino boards don't work on mac, get a micro-arduino from Microcenter.
    // http://www.meetup.com/Cambridge-Hackspace/ tues 6:30PM union sq somerville
    //https://www.arduino.cc/en/Reference/Firmata  a Kketch for prototcol
    //that interfaces to javascript via https://github.com/firmata/firmata.js?utm_source=buffer&utm_medium=twitter&utm_campaign=Buffer&utm_content=buffer52691
//firmata provides the sketch for arduino and protolcoe. firmata .js is a way to use it
//from js, johnny 5 and cylon use firmata underneath and build on top of it.
//to make a "compiled" file of a arduino sketch, edit the sketch, then use File menu/Sketch/export compiled binary
//gort: CLI that can upload .hex files into an arduino board. for mac, win. linux
 The ATmega32U4 on the Micro comes preprogrammed with a bootloader that allows you to upload new code to it without the use of an external hardware programmer. It communicates using the AVR109 protocol.
 You can also bypass the bootloader and program the microcontroller through the ICSP (In-Circuit Serial Programming) header using Arduino ISP or similar; see these instructions for details.
temboo IOT js connectivity requires setting up a local js server to use.
// http://www.penvon.com/b/robotics-projects-github-cm596 johnny5 has 3 times the github stars as cylon
    // ie 6K vs 2K July, 2016


//strategy: sandbox never has to know connectionIDs, just paths.
//keep map between them on the UI side
*/

const SerialPort = require('serialport')

var serial_path_to_info_map = {}

function serial_path_to_info(path){
    return serial_path_to_info_map[path]
}

const ipc     = require('electron').ipcRenderer
function serial_devices(){
    const reply = ipc.sendSync('serial_devices')
    return reply
}

//only used for testing.
function serial_connect_low_level(path, options, capture_n_items=1, item_delimiter="\n",
                                  trim_whitespace = true,
                                  parse_items=true, capture_extras=false){
    const port = new SerialPort(path, options)
    serial_path_to_info_map[path] =
            {path: path, //Needed because sometinmes we get the info without having the path thru serial_path_to_connection_idsimulate: simulate,
            simulate: false,
            port: port,
            capture_n_items: capture_n_items,
            item_delimiter:  item_delimiter,
            trim_whitespace: trim_whitespace,
            parse_items:     parse_items,
            capture_extras:  capture_extras,
            pending_input:   ""}
    port.on('open', function(err){
        if (err) {
            dde_error("new SerialPort to path: " + path + " errored with; " + err)
        }
        else {
            out("Serial connection made to: " + path)
            port.on('data',  function(data) { onReceiveCallback_low_level(data, path) } )
            port.on('error', function(data) { onReceiveErrorCallback(data, path) } )
            out(stringify_value(serial_path_to_info_map[path]))
        }
    })
}

//not used by DDE robots
function serial_send_low_level(path, content){
    let info = serial_path_to_info_map[path]
    if (info){
        info.port.write(convertStringToArrayBuffer(content),
            function(error){ //can't rely on this getting called before onReceived so mostly pretend like its not called, except in error cases
                if (error){
                    dde_error("In serial_send callback to path: " + path +
                        " got the error: " + error.message)
                }
                else {
                    out("serial write just sent: " + content)
                }
            })
    }
    else {
        dde_error("In serial_send, attempt to send to path: " + path +
            " which doesn't have info.")
    }
}

//called by serial_connect AND Serial.send
function serial_init_one_info_map_item(path, options, simulate=null, capture_n_items=1, item_delimiter="\n",
                                       trim_whitespace=true,
                                       parse_items=true, capture_extras="error"){
    let sim_actual = Robot.get_simulate_actual(simulate)
    serial_path_to_info_map[path] =
           {path:            path, //Needed because sometimes we get the info without having the path thru serial_path_to_connection_id
            simulate:        sim_actual,
            capture_n_items: capture_n_items,
            item_delimiter:  item_delimiter,
            trim_whitespace: trim_whitespace,
            parse_items:     parse_items,
            capture_extras:  capture_extras,
            pending_input:   ""}

}

//called from robot.js
function serial_connect(path, options, simulate=null, capture_n_items=1, item_delimiter="\n",
                        trim_whitespace=true,
                        parse_items=true, capture_extras="error"){ //"ignore", "capture", "error"
    const sim_actual = Robot.get_simulate_actual(simulate)
    serial_init_one_info_map_item(path, options, simulate, capture_n_items, item_delimiter,
        trim_whitespace, parse_items, capture_extras)
    if(sim_actual === true){ //if its "both" we let the below handle it. Don't want to call serial_new_socket_callback twice when sim is "both"
        serial_new_socket_callback(path) //don't need to simulate socket_id for now
    }
    if ((sim_actual === false) || (sim_actual == "both")){
        const port = new SerialPort(path, options)
        port.on('open', function(err){
            if (err) {
                 dde_error("new SerialPort to path: " + path + " errored with; " + err)
            }
            else {
                out("Serial connection made to: " + path)
                serial_path_to_info_map[path].port = port
                serial_new_socket_callback(path)
                let the_path = path //needed for closed over var below
                port.on('data',  function(data) { serial_onReceiveCallback(data, the_path) } )
                port.on('error', function(data) { onReceiveErrorCallback(data, the_path) } )
            }
        })
    }
}

function serial_new_socket_callback(path){
    console.log("serial_new_socket_callback passed: " + "path: " + path)
    Serial.set_a_robot_instance_socket_id(path)
}

//_______send data to serial_______
//https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String?hl=en
//function convertArrayBufferToString(buf) { return String.fromCharCode.apply(null, new Uint16Array(buf));}
//http://www.fabiobiondi.com/blog/2014/02/html5-chrome-packaged-apps-and-arduino-bidirectional-communication-via-serial/
function convertArrayBufferToString(buf, content_length=null) {
    let bufView = new Uint8Array(buf);
    let encodedString = String.fromCharCode.apply(null, bufView);
    let result = decodeURIComponent(escape(encodedString));
    if (content_length){ result = result.substring(0, content_length) }
    return result
};

function convertStringToArrayBuffer(str) {
    var buf=new ArrayBuffer(str.length);
    var bufView=new Uint8Array(buf);
    for (var i=0; i<str.length; i++) {
        bufView[i]=str.charCodeAt(i);
    }
    return buf;
}

//content is a string
function serial_send(instruction_array, path, simulate=null, sim_fun) {
    let ins_str = instruction_array[Serial.INSTRUCTION_TYPE + 1]
    //out("top of serial_send about to send: " + ins_str)
    let robot_status = instruction_array.slice(0, Serial.DATA0) //Make a copy. don't include any fields for data coming back. We'll push onto this if need be.
    let info = serial_path_to_info(path)
    let the_path = path //because JS closures sometimes don't close over para variables
    info.robot_status = robot_status //save this so that onReceive can get it later
    info.robot_status[Serial.ERROR_CODE] = 0 //we haven't errored yet so pretend like its going to work
    //set the error code, and maybe call serial_on_done_with_sending
    info.robot_status[Serial.START_TIME] =  Date.now()
    const sim_actual = Robot.get_simulate_actual(simulate)
    if ((sim_actual === true) || (sim_actual === "both")){
        setTimeout(function(){
                        serial_send_simulate(ins_str, sim_fun, path, sim_actual)
                    }, 300)
    }
    if ((sim_actual === false) || (sim_actual === "both")){
        if (info.port){
            //out("just before serial send of: " + ins_str)
            info.port.write(convertStringToArrayBuffer(ins_str),
                function(error){ //can't rely on this getting called before onReceived so mostly pretend like its not called, except in error cases
                    if (error){
                        dde_error("In serial_send callback to path: " + the_path +
                                  " got the error: " + send_info.error)
                    }
                    else {
                        out("serial write just sent: " + ins_str)
                    }
                })
            if (info.capture_n_items === 0){ //everything ok just no robot_status to collect.
                serial_on_done_with_sending(info.robot_status, the_path)
            }
        }
        else {
            let err = "In serial_send, attempt to send to path: " + the_path +
                      " which doesn't have a port."
            info.robot_status[Serial.ERROR_CODE] = err
            serial_on_done_with_sending(info.robot_status, the_path)
        }
    }
}

function serial_send_simulate(ins_str, sim_fun, path, sim_actual){
    let result = sim_fun.call(null, ins_str)
    let info_from_board = {buffer: convertStringToArrayBuffer(result)}
    out("in serial_send_simulate with ins_str: " + ins_str + " and info_from_board: " + info_from_board)
    if (sim_actual === true) { //but NOT "both", since we let the hardware side take it from here if its "both".
        serial_onReceiveCallback(info_from_board, path)
    }
}

//_______receive data from serial_________
//getting data from serial: when info comes in from ANY port,
//onReceieveCallback gets called.

//might return a negative number if we are allowed to capture extras
function left_to_capture(info){
    let already_captured = info.robot_status.length - Serial.DATA0
    let result = info.capture_n_items - already_captured
    return result
}

/* delimiter of empty string: just use whatever chunk size was passed to OnRecieveCallback and
consider that "1 item".
If other string. use it as a delim but might have multiple delims at begin, middle (multiple)
and/or end. Still use between delims as an "item", If what's passed in
is a string that has no delims on end, then it will have at least some
fraction of it going to the info.pending_input to add to future "items"
made whole by future calls to serial_onReceiveCallback.
If delim is an integer, then grab that number of chars for an "item".
A delim of 0 means same as a delim of empty string, use whatever str is passed in
to serial_onReceiveCallback as an item.
Note on JS split: If it returns an array of 1, that means the delim wasn't in the string.
If it returns an array that starts or ends with "" , that means their was a delim
on the start or end respectively.
*/

function onReceiveCallback_low_level(info_from_board) { //if there's an error, onReceiveErrorCallback will be called instead
    if (info_from_board.buffer) { //info.connectionId == expectedConnectionId &&
        //let id = info_from_board.connectionId
        let str = convertArrayBufferToString(info_from_board.buffer); //note that if aruino program
        //has Serial.println("turned off1"); int foo = 2 + 3; Serial.println("turned off2");
        //then this is ONE call to serial_onReceiveCallback with a string "turned off1\r\nturned off2\t\n"
        //so that 1 string should count for 2 items from the board from the dde standpoint.
        //maybe the board software batches up the 2 strings and maybe crhome recieve does.
        //whichever, I need to handle it.
        out("onReceiveCallback_low_level got data str: " + str)
    }
    else {
        out("onReceiveCallback_low_level got no data.")
    }
}

function serial_onReceiveCallback(info_from_board, path) { //if there's an error, onReceiveErrorCallback will be called instead
    //out("top of serial_onReceiveCallback")
    if (info_from_board.buffer) { //info.connectionId == expectedConnectionId &&
        let str = convertArrayBufferToString(info_from_board.buffer, info_from_board.length); //note that if aruino program
        //has Serial.println("turned off1"); int foo = 2 + 3; Serial.println("turned off2");
        //then this is ONE call to serial_onReceiveCallback with a string "turned off1\r\nturned off2\t\n"
        //so that 1 string should count for 2 items from the board from the dde standpoint.
        //maybe the board software batches up the 2 strings and maybe crhome recieve does.
        //whichever, I need to handle it.
        //Note 2: when simulating, often info_from_board.length will return undefined.
        //this is ok as convertArrayBufferToString will just go with the length of the
        //info_from_board.buffer, which will usually be correct for the content.
        out("serial_onReceiveCallback got string: " + str)
        let info = serial_path_to_info_map[path]
        if (!info) {
           warning("serial_onReceiveCallback got path: " + path + " that's not a known DDE connected path which is possibly OK if you've got other serial devices sending in data.")
        }
        else {
            info.robot_status[Serial.ERROR_CODE] = 0 //since onRecievedErrorCallback wasn't called in place of this, we know it didn't error. Can't rely on send callbackgetting called so do this here.
            //first process the returned string
            let delim = info.item_delimiter //can be multi_character.
            if ((delim === "") || (delim === 0)) { //str holds exactly one item. we never put a substr in pending
                if (left_to_capture(info) > 0) {
                    serial_store_str_in_rs(str, info)
                    if (left_to_capture(info) == 0){
                        serial_on_done_with_sending(info.robot_status, info.path)
                    }
                    else { out("waiting for more strings from robot.") } //beware, the might never come in qhich case the job is just hanging.
                    //the job has status_code "running" but is really paused waiting for response.
                }
                else if (info.capture_extras == "capture"){
                    serial_send_extra_item_to_job(str, info.path, false, info) //false means everything ok
                }
                else if (info.capture_extras == "error"){
                    serial_send_extra_item_to_job(str, info.path, true, info) //true means job should error
                }
                else if (info.capture_extras == "ignore") {}
                else { dde_error("serial_onReceiveCallback got invalid capture_extras value of: " + info.capture_extras) }
            }
            else if (typeof(delim) == "string"){
                str = info.pending_input + str //pending_input will never contain a delim
                info.pending_input = "" //we're using it, so makes this empty, just so there's no using pending twice.
                if (str === "") { //we do have a real delimiter, but no delimiter in the input str and no chars so this is a no_op
                }
                else {
                    let split_str = str.split(delim)
                    let last_str_item = split_str.pop() //if last str item is "", that means that their was a delim on the end of str,
                         //so the 2nd to last item is complete, and we should put "" into pending.
                         //but if last is not "", then it is an incomplete item and goes into pending.
                         //either way last_str_item goes into pending and the 0th throu 2nd to last items are all complete items
                         //even if only [""] or [] is left.
                    info.pending_input = last_str_item
                    for (let item of split_str){
                        if (info.trim_whitespace) { item = item.trim() }
                        if (left_to_capture(info) > 0) {
                            serial_store_str_in_rs(item, info)
                            if (left_to_capture(info) == 0){
                                serial_on_done_with_sending(info.robot_status, info.path)
                            }
                            else { out("waiting for more strings from robot.") } //beware, the might never come in qhich case the job is just hanging.
                            //the job has status_code "running" but is really paused waiting for response.
                        }
                        else if (info.capture_extras == "capture"){
                            serial_send_extra_item_to_job(item, info.path, false, info) //false means everything ok
                        }
                        else if (info.capture_extras == "error"){
                            serial_send_extra_item_to_job(item, info.path, true, info) //true means job should error
                        }
                        else if (info.capture_extras == "ignore") {}
                        else { dde_error("serial_onReceiveCallback got invalid capture_extras value of: " + info.capture_extras) }
                    }
                }
            }
            else if (typeof(delim) == "number"){
                str = info.pending_input + str //pending_input will never contain a delim
                info.pending_input = "" //we're using it, so makes this empty, just so there's no using pending twice.
                if (str === "") { //we do have a real delimter, but no delimiter in the input str and no chars so this is a no_op
                }
                else {
                    while(true){
                        if (str.length >= delim){
                            let item = str.substr(0, delim) //the item this time in the loop
                            str = str.slice(delim) //get ready for the NEXT iteration
                            if (left_to_capture(info) > 0) {
                                serial_store_str_in_rs(item, info)
                                if (left_to_capture(info) == 0){
                                    serial_on_done_with_sending(info.robot_status, info.path)
                                }
                                else { out("waiting for more strings from robot.") } //beware, the might never come in qhich case the job is just hanging.
                                //the job has status_code "running" but is really paused waiting for response.
                            }
                            else if (info.capture_extras == "capture"){
                                serial_send_extra_item_to_job(item, info.path, false, info) //false means everything ok
                            }
                            else if (info.capture_extras == "error"){
                                serial_send_extra_item_to_job(item, info.path, true, info) //true means job should error
                            }
                            else if (info.capture_extras == "ignore") {}
                            else { dde_error("serial_onReceiveCallback got invalid capture_extras value of: " + info.capture_extras) }
                        }
                        else {
                            info.pending = str //might be "" and that's ok
                            break;
                        }
                    }
                }
            }
            else {
                dde_error("serial_onReceiveCallback got an item_delimiter of: " + delim + " which is not valid because its not a string or an integer.")
            }
        }
    }
}

function serial_parse_string_maybe(str, info){
    if (info.parse_items) {
        try {
            str = JSON.parse(str)
        }
        catch(e) {}
    }
    return str
}

function serial_store_str_in_rs(str, info){
    str = serial_parse_string_maybe(str, info)
    info.robot_status.push(str)
}

function onReceiveErrorCallback(info_from_board, path) {
    //let id = info_from_board.connectionId
    let errnum = info_from_board.error
    let error_codes = ["disconnected", "timeout", "device_lost", "break", "frame_error", "overrun",
                        "buffer_overflow", "parity_error", "system_error"] //beware,
        //it wouldn't surprise me if "disconnected" was really error_code 1 instead of 0.
        //but this is what https://developer.chrome.com/apps/serial#event-onReceive sez.
    let info = serial_path_to_info_map[path]
    let rs = info.robot_status
    out("onReceiveErrorCallback called with path: " + info.path, "red")
    rs[Serial.ERROR_CODE] = error_codes[errnum]
    serial_on_done_with_sending(rs, info.path)
}

//like socket on_receive
function serial_on_done_with_sending(robot_status, path){
    robot_status[Serial.STOP_TIME] = Date.now()
    out("serial_on_done_with_sending with rs: " + robot_status)
    Serial.robot_done_with_instruction(robot_status)
}

function serial_send_extra_item_to_job(string_from_robot, path, is_error=false, info){ //info only needed on UI side.
    string_from_robot = serial_parse_string_maybe(string_from_robot, info) //after this, might not be a string anymore
    let job_instance = Serial.get_job_with_robot_path(path)
    if (job_instance){
        job_instance.robot.robot_status.push(string_from_robot) //just add to the current robot_status. Might not be right.
        if (is_error){
            job_instance.stop_for_reason("errored", "Serial robot returned unexpected extra string: " + string_from_robot)
        }
    }
}

function serial_flush(path){
    let info = serial_path_to_info(path)
    if (info && ((info.simulate === false) || (info.simulate === "both"))) { info.port.flush(function(){ out("Serial path: " + path + " flushed.") }) }
    else {
        warning("Attempt to serial_flush path: " + path + " but that path doesn't have info.")
    }
}

//with an arduino connected, this disconnects but then immdiately afterwards,
//a new connection is automatically made with 1 higher port number and same path.
function serial_disconnect(path){
    let info = serial_path_to_info_map[path]
    if (info){
        if((info.simulate === false) || (info.simulate === "both")) {
            info.port.close(out)
        }
        delete serial_path_to_info_map[path]
    }
}

function serial_disconnect_all(){
  for(let path of Object.keys(serial_path_to_info_map)){
      serial_disconnect(path)
  }
}