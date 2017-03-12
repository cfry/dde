function rde(){} //Robot Development Env. just a namespace of user useable fns. no dexter robot specific stuff.
// Connecting to ROS  see: http://wiki.ros.org/roslibjs/Tutorials/BasicRosFunctionality
var ros = null
var shellClient
function init_ros_service(url) { //url must start with ws:// and end with /, but the user doesn't type in that prefix or suffix
    //url = "ws://" + url
    if (url.indexOf(":") == -1){
        console.log("invalid url: " + url + " Example of correct url: localhost:9090")
        show_url_error_message(url)
    }
    else {
        try {
            ros = new ROSLIB.Ros({ //normally this causes an error printing in the console of:
                //"websocket connection to {url} failed" BUT the catch clause below doesn't catch it,
                //so I can't supress that error message in the console.
                url : url  //'ws://localhost:9090'
            })
        }
        catch(e){
            console.log(url)
            if(url == "ws://localhost:9090/") { //if the default doens't connect. don't make  big deal of it, ie don't print red error message.
                out("ROS didn't connect to Dexter.")
            }
            else { show_url_error_message(url) }
            return
        }
    }

    ros.on('connection', function() {
        console.log('Connected to websocket server.');
    });

    ros.on('error', function(error) {
        console.log('Error connecting to websocket server: ', error);
        if(url == "ws://localhost:9090/") { //if the default doesn't connect. don't make  big deal of it, ie don't print red error message.
            out("ROS didn't connect to Dexter.")
        }
        else { show_url_error_message(url) }
    });

    ros.on('close', function() {
        console.log('Connection to websocket server closed.');
    });
    // Calling a service
    shellClient = new ROSLIB.Service({
        ros : ros,
        name : '/shell_service',
        serviceType : 'py_cmd_server_pkg/shell' //'rospy_tutorials/shell'
    })
}

function show_url_error_message(url){
    //console.log("show_url_error_message called with: " + url)
    if (url.startsWith("ws://")){
        url = url.slice(5)
    }
    out("The URL for ROS of <code style='color:#000000;'>" + url +
    "</code><br/>is invalid. <br/>" +
    "Example of url syntax: <code style='color:#000000;'> localhost:9090</code><br/>" +
    "Do not include a protocol prefix, ie <code style='color:#000000;'>ws://</code><br/>" +
    "To find the correct URL, on the ROS server, enter:<br/>" +
    "<code style='color:#000000;'>nslookup localhost</code>",
        "red")
}

var full_dexter_url //primarily used when on the sandboxed side by get_full_dexter_url
                    // set in window.addEventListener('message' ...) ie the receiver of
                    // a mesage for the eval sandbox
function get_full_dexter_url(){
    if (window.dexter_url){
        full_dexter_url = "ws://" + $("#dexter_url").val() //this global settting really doesn't matter much outise the sandbox.
        if (!full_dexter_url.endsWith("/")){
            full_dexter_url += "/"
        }
    }
    return full_dexter_url
}

function init_ros_service_if_url_changed(){
    var url = get_full_dexter_url()
    if ((ros == null) || (ros.socket.url != url)){
        init_ros_service(url)
    }
}
//__________call_cmd_service
//used when user types in a custom cmd so we can remember it.
function call_cmd_service_custom(the_cmd){
    init_ros_service_if_url_changed()
    add_cmd_to_user_menu(the_cmd) //doesn't work because jqxmenu broken by design.
    rde.shell(the_cmd)
}
function add_cmd_to_user_menu(the_cmd){
    //add to user menu in error pane ops.
    var user_cmds_ul_jq = $("#user_cmds_ul")
    var kids = user_cmds_ul_jq[0].children
    var already_in_menu = false
    var kid_index = -1
    for (var i = 0; i < kids.length; i++){
        kid_index += 1
        if (kid_index > 9) {
            break  //if its not in the top 10, pretend its new and add it to the top of the list.
        }
        var kid = kids[i].innerText
        if (kid == the_cmd){
            already_in_menu = true
            break
        }
        console.log(kid)
    }
    if (!already_in_menu){
        //user_cmds_ul_jq.html("")
        user_cmds_ul_jq.prepend("<li class='jqx-item jqx-menu-item' onclick='rde.shell(\"" + the_cmd  + "\")'>" + the_cmd + "</li>")
        $("#error_ops_menu").jqxMenu({ width: '50px', height: '25px' }); //re-init the menu
    }
}

function default_cmd_service_callback(result){
    //console.log('Result for service call on ' + shellClient.name + ': ' + result.sum);
    var formatted = result.output
    var in_cmd = extract_input_from_result(formatted)
    var in_formatted = "Input: <a class='onclick_via_data' href='#' data-onclick='pop_up_insert_cmd_question,," + in_cmd + "'>" +  in_cmd + "</a>"

    var error_pos = formatted.indexOf("Error: ")
    if (error_pos != -1){
        formatted = formatted.replace(/\n/g, '<br/>');
        formatted = formatted.substring(0, error_pos) +
                    "<span style='color:red;'>" +
                    formatted.substring(error_pos) +
                    "</span>"
    }
    else { formatted = default_cmd_service_format_special(formatted) }
    formatted = in_formatted + "<br/>" + formatted
    out(formatted)
    install_onclick_via_data_fns()
    return result.output
}


//because chrome app security doesn't let me put onclick fns on the A tags directly, and
//we are dynamically generating the A tags, I have to go through this painful indirection
function onclick_via_data_fn(){
    var the_data = this.dataset.onclick.split(",,")
    var the_fn_name = the_data[0]
    var the_args = the_data.slice(1)
    switch(the_fn_name){
        case "call_info":
            call_info.apply(null, the_args)
            break;
        case "pop_up_insert_cmd_question":
            pop_up_insert_cmd_question.apply(null, the_args)
            break;
        case "Editor.insert":
            Editor.insert.apply(null, the_args)
            break;
        /*case "Editor.insert_and_hide_window":
            Editor.insert_and_hide_window.apply(null, the_args)
            break;
        case "hide_window":
            rde.hide_window.apply(null, the_args)
            break;*/
        case "Job.report_displayer":
            show_window({content: the_args[0], title: "DDE Job Details", width:500})
            break;
        case "Dexter.show_rs_history":
            Dexter.show_rs_history(the_args[0])
            break;
        case "Job.print_out_one_job":
            Job.print_out_one_job(the_args[0])
            break;
        default:
            shouldnt("in onclick_via_data_fn got unknown fn_name: " + the_fn_name)
    }
}

var cmd_to_details_map = {
    rosnode:   "rosnode info",
    rosservice:"rosservice info",
    //rospack find  just gives me the file path. no new info

    //for rostopic list remove the "v" from the menu item
    rostopic:  "rostopic info",   //rostopic info /rosout
    rosmsg:    "rosmsg show",
    rosparam:  "rosparam get"  ///rosdistro
}

function extract_cmd_from_result(result){
    var words = result.split(" ")
    if (words.length < 2) return null
    else return words[1]
}

function extract_input_from_result(result){
    var lines = result.split("\n")
    var in_line = lines[0].trim()
    var first_space_pos = in_line.indexOf(' ')
    var in_cmd = in_line.substring(first_space_pos + 1)
    return in_cmd
}

function result_to_details_cmd(result){
    var cmd = extract_cmd_from_result(result)
    return cmd_to_details_map[cmd] //might return undefined
}

function pop_up_insert_cmd_question(in_cmd){
    var full_cmd = 'rde.shell("' + in_cmd + '")\n'
    var pop_up_content = `<div style='font-size:16px;padding:10px;'>Insert a call to<br/><b>` + in_cmd +
                         `</b></br>into the JavaScript pane?</p>` +
                         "<input type='hidden' name='full_cmd' value='" + full_cmd + "'/>\n" +
                         "<center><input type='submit' value='OK'/>&nbsp;&nbsp;" +
                         "<input type='submit' value='Cancel'/></center></div>"
    show_window({content: pop_up_content, title: "DDE Question", callback: pop_up_insert_cmd_handler})
}

function pop_up_insert_cmd_handler(vals){
    if (vals.clicked_button_value == "OK") {
        Editor.insert(vals.full_cmd)
    }
}

function default_cmd_service_format_special(formatted){
    var input_cmd = extract_input_from_result(formatted)
    var details_cmd = result_to_details_cmd(formatted)
    if (details_cmd){
        var in_out = formatted.split("Output: ")
        var html = ""
        var cmd_words = input_cmd.split(" ")
        if (cmd_words[0].startsWith("ros") && (cmd_words[1] == "list")){
            var out_lines = in_out[1].split("\n")
            for (var out_line of out_lines){
               //html += "<a href='#' onclick='call_info(\"" + details_cmd + '\", \"' + out_line + "\")'>" + out_line + "</a><br/>"
                html += "<a class='onclick_via_data' href='#' data-onclick='call_info,," + details_cmd + ",," + out_line + "'>" + out_line + "</a><br/>"

            }
        }
        else{
            html = "<pre>" + in_out[1].trim() + "</pre>"
        }
        formatted = "Output: " + html
    }
    else {
        var newline_pos = formatted.indexOf("\n")
        formatted = formatted.substring(newline_pos + 1) //cut off top "input" line. This is re-added by the caller of this fn.
        formatted = formatted.replace(/\n/g, '<br/>');}
    return formatted //looks like "Output: <a href="#" onclick(...) ..."
}

function call_info_callback(result_obj){
    var formatted = "<i>" + result_obj.input + "</i>"
    var result_out = result_obj.output
    for (var i in result_out){  //trim off beginning junk if any.
        i = parseInt(i) //bug in JS! "in" makes it a string. useless!
        var char = result_out[i]
        if ((char == " ") || (char == "-")) {}
        else {
            result_out = result_out.substring(i)
            break
        }
    }
    if (result_obj.input.startsWith("rosnode info ")){
        formatted += call_info_callback_rosnode(result_obj.input, result_out)
    }
    else if (result_obj.input.startsWith("rosmsg show ")){
        call_info_callback_rosmsg(result_obj.input, result_out)
        return
    }
    //rospack: no interesting details to get from rospackages (that I see YET!)
    else if (result_obj.input.startsWith("rosparam get ")){
        formatted += call_info_callback_param(result_obj.input, result_out)
    }
    else if (result_obj.input.startsWith("rosservice info ")){
        formatted += call_info_callback_rosservice(result_obj.input, result_out)
    }
    else if (result_obj.input.startsWith("rostopic info ")){
         call_info_callback_rostopic(result_obj.input, result_out)
         return
    }
    else {
        formatted += call_info_callback_misc(result_obj.input, result_out)
    }
    show_window(formatted)

}

function call_info_callback_rosmsg(result_input_string, result_output_string){
    var in_cmd = result_input_string
    var code_to_insert = 'rde.shell(ddqq' + in_cmd + 'ddqq)nnll'
    var onclick_code_info = "Editor.insert,," + code_to_insert

    var formatted = "<table><tr><th>FieldType</th><th>FieldName</th></tr>"
    var out_lines = result_output_string.trim().split("\n")
    for (var out_line of out_lines){
        var line_items = out_line.trim().split(" ")
        formatted += "<tr><td>" + line_items[0] + "</td><td>" + line_items[1] + "</td></tr>"
    }
    formatted += "</table>" +
                 "<button class='onclick_via_data' data-onclick='" + onclick_code_info  + "'>Insert <b>rosmsg show</b> call</button><p/>"

    //very similar to code for call)inf_callbackrostopic that makes pub and sub buttons.
    var message_type = result_input_string.split(" ")[2].trim()
    rde.shell("rosmsg show " +  message_type, "last_command_result",
        function(result){
            var topicname = "/junk"
            var message = example_publish_message(message_type, result)
            code_to_insert     = 'rde.publish(ddqq' + topicname + 'ddqq, ddqq' + message_type + 'ddqq, ' + message + ')nnll'
            var onclick_code_pub = "Editor.insert,," + code_to_insert
            code_to_insert   = 'rde.subscribe(ddqq' + topicname + 'ddqq, ddqq' + message_type + 'ddqq)nnll'
            var onclick_code_sub = "Editor.insert,," + code_to_insert
            var formatted2 = formatted + //closed over
                        "<button class='onclick_via_data' data-onclick='" + onclick_code_pub  + "'>Insert call to <b>publish</b></button><p/>" +
                        "<button class='onclick_via_data' data-onclick='" + onclick_code_sub  + "'>Insert call to <b>subscribe</b></button><p/>"
            var formatted2 = "<i>" + result_input_string + "</i>" + formatted2
            show_window(formatted2)
        })
}

function call_info_callback_rosnode(result_input_string, result_output_string){
    var in_cmd = result_input_string
    var code_to_insert = 'rde.shell(ddqq' + in_cmd + 'ddqq)nnll'
    var onclick_code_info = "Editor.insert,," + code_to_insert
    var nodename = result_input_string.split(" ")[2]
    code_to_insert     = 'rde.shell(ddqqrosnode kill ' + nodename + 'ddqq)nnll'
    var onclick_code_kill = "Editor.insert,," + code_to_insert
    var formatted = "<pre>" + result_output_string + "</pre>" +
        "<button class='onclick_via_data' data-onclick='" + onclick_code_info  + "'>Insert <b>rosnode info</b> call</button><p/>" +
        '<button class="onclick_via_data" data-onclick="' + onclick_code_kill  + '">Insert <b>rosnode kill</b> call</button><p/>'
    return formatted
}

function call_info_callback_param(result_input_string, result_output_string){
    var name = result_input_string.split(" ")[2]
    var code_to_insert = 'rde.get_param(ddqq' + name + 'ddqq)nnll'
    var onclick_code_get = "Editor.insert,," + code_to_insert
    val = process_output_string(result_output_string)
    var val = encode_quotes(val)
    //val = val.split('"').join("ddqq")
    code_to_insert       = 'rde.set_param(ddqq' + name + 'ddqq, ' + val + ')nnll'
    var onclick_code_set = "Editor.insert,," + code_to_insert
    code_to_insert       = 'rde.get_param_names()nnll'
    var onclick_code_all = "Editor.insert,," + code_to_insert
    code_to_insert       = 'rde.delete_param(ddqq' + name + 'ddqq)nnll'
    var onclick_code_delete = "Editor.insert,," + code_to_insert
    var formatted = "<pre>" + result_output_string + "</pre>" +
           '<button class="onclick_via_data" data-onclick="' + onclick_code_get  + '">Insert get_param call</button><p/>' +
           '<button class="onclick_via_data" data-onclick="' + onclick_code_set  + '">Insert set_param call</button><p/>' +
           '<button class="onclick_via_data" data-onclick="' + onclick_code_all  + '">Insert get_param_names call</button><p/>' +
           '<button class="onclick_via_data" data-onclick="' + onclick_code_delete  + '">Insert delete_param call</button>'
    return formatted
}

function call_info_callback_rosservice(result_input_string, result_output_string){
    var in_cmd = result_input_string
    var code_to_insert = 'rde.shell(ddqq' + in_cmd + 'ddqq)nnll'
    var onclick_code_info = "Editor.insert,," + code_to_insert
    var service_name = result_input_string.split(" ")[2]
    var service_type = line_starting_with(result_output_string, "Type: ").trim()
    var request_field_names = []
    var request_args_lines = line_starting_with(result_output_string, "Args: ")
    if (request_args_lines != null){
        request_field_names = request_args_lines.trim().split(" ")
    }
    var request_jsobj = "{"
    for (var name_index in request_field_names){
        name_index = parseInt(name_index)
        var name = request_field_names[name_index]
        request_jsobj += name + ": " + "ddqqddqq"
        if (name_index < (request_field_names.length - 1)){ //only add comma on non-last fields
            request_jsobj += ", "
        }
    }
    request_jsobj += "}"
    code_to_insert     = 'rde.call_service(ddqq' + service_name + 'ddqq, ddqq' + service_type + 'ddqq, ' + request_jsobj + ')nnll'
    var onclick_code_kill = "Editor.insert,," + code_to_insert
    var formatted = "<pre>" + result_output_string + "</pre>" +
        '<button class="onclick_via_data" data-onclick="' + onclick_code_info  + '">Insert <b>rosservice info</b> call</button><p/>' +
        '<button class="onclick_via_data" data-onclick="' + onclick_code_kill  + '">Insert call to this service</button><p/>'
    return formatted
}

function call_info_callback_rostopic(result_input_string, result_output_string){
    var in_cmd = result_input_string
    var message_type = line_starting_with(result_output_string, "Type: ").trim()

    rde.shell("rosmsg show " +  message_type, "last_command_result",
      function(result){
        var code_to_insert = 'rde.shell(ddqq' + in_cmd + 'ddqq)nnll'
        var onclick_code_info = "Editor.insert,," + code_to_insert
        var topicname = result_input_string.split(" ")[2]
        var message = example_publish_message(message_type, result)
        code_to_insert     = 'rde.publish(ddqq' + topicname + 'ddqq, ddqq' + message_type + 'ddqq, ' + message + ')nnll'
        var onclick_code_pub = "Editor.insert,," + code_to_insert
        code_to_insert   = 'rde.subscribe(ddqq' + topicname + 'ddqq, ddqq' + message_type + 'ddqq)nnll'
        var onclick_code_sub = "Editor.insert,," + code_to_insert

        var formatted = "<pre>" + result_output_string + "</pre>" +
            '<button class="onclick_via_data" data-onclick="' + onclick_code_info  + '">Insert <b>rostopic info</b> call</button><p/>' +
            "<button class='onclick_via_data' data-onclick='" + onclick_code_pub   + "'>Insert call to <b>publish</b></button><p/>" +
            "<button class='onclick_via_data' data-onclick='" + onclick_code_sub   + "'>Insert call to <b>subscribe</b></button><p/>"
          var formatted = "<i>" + result_input_string + "</i>" + formatted
          show_window(formatted)
          //return formatted
      })
}

var message_type_to_example_message = {
    "rosgraph_msgs/Log": '{msg: "hey there"}'
}

//maps ROS built in types to examples of them. See:  http://wiki.ros.org/msg
var types_to_example_values = {
    bool:       'false',
    float32:    '32',
    float64:    '64',
    int:        '8',
    uint8:      '"a"',
    "uint8[]":  '"abc"',  //same as string
    int16:      '16',
    unti16:     '16',
    int32:      '32',
    uint32:     '32',
    int64:      '64',
    uint64:     '64',
    string:     '"hey there"',
    "string[]": '["hey", "you"]',
    time:       '[12345, 6789]',
    duration:    '[9876, 54321]'

}

//result is the jsobj that result from "rosmsg show some-msg-type". Wade through its output to constuct example
function example_publish_message(message_type, result){
    //returns a string like: '{msg: "hey there"}'
    var example = message_type_to_example_message[message_type]
    if (example) {return example}
    //rosmsg show actionlib/TestAction  returns fieldType-fieldName pairs. Using that:
    //else if (length of fields is < 5) { do all 4 or less, using  types_to_example_values
    //   filter out the ALLCAPS=0  values.}
    else{
        var lines = result.output.split("\n")
        var valid_lines = []
        for(var line of lines){
            if (line.startsWith(" ")) {} //not sure what to do with these
            else if (line.indexOf("=") != -1) {} //these are constant values like "int SIZE=23" values so don't know what to do with them
            else { valid_lines.push(line)}
        }
        var example = "{"
        if (valid_lines.length < 5){
            for (var valid_line of valid_lines){
              var type_and_name = valid_line.split(" ")
                var type = type_and_name[0]
                var name = type_and_name[1]
                var example_val_for_type = types_to_example_values[type]
                if (example_val_for_type){
                    example += name + ": " + example_val_for_type
                }
                else {console.log("types_to_example_values needs an entry for: " + type) }
            }
            example += "}"
            return example
        }
        else { return "{}" } //too many fields, can't decide which is important.
    }

}

function call_info_callback_misc(result_input_string, result_output_string){
    return "<pre>" + result_output_string + "</pre>"
}

function process_output_string(result_output_string){
    result_output_string = result_output_string.trim()
    if (result_output_string == "true")       return  result_output_string
    else if (result_output_string == "false") return  result_output_string
    else if (result_output_string == "null")  return  result_output_string
    else if ((result_output_string.length > 1) &&
             (result_output_string.startsWith('"') ||
              result_output_string.startsWith("'"))
             ) { //change '    foo   ' into  "foo" as in param for version
          var text = result_output_string.substring(1, result_output_string.length - 1)
          return '"' + text.trim() + '"'
    }
    else if (!isNaN(parseInt(result_output_string)))   return result_output_string //got an int
    else if (!isNaN(parseFloat(result_output_string))) return result_output_string //got a float
    else if (result_output_string.startsWith('['))     return result_output_string //got an array
    else if (result_output_string.startsWith('{'))     return result_output_string //got a js obj.
    else  return '"' + result_output_string + '"' //a string but not in quotes so put it in quotes
}


function call_info(cmd, out_line){
    rde.shell(cmd + " " + out_line, "last_command_result", call_info_callback)
    //alert(out_line)
}


//user fn ex: rde.shell("rosverion -d")
rde.shell = function(the_cmd, output_format, callback){
    //the_cmd is a string of a unix cmd like "date" or "rosversion -d"
    //output_format can be: "debug", "last_command_result", "all_command_results". default "debug"
    //callback is a fn of one arg, which is a record of {"input: "somestr", output: "somestr", error: "somestr"}
    // default of default_cmd_service_callback which does a show_output side effect of the "output"
    // (which will include the error message if any)
    init_ros_service_if_url_changed()
    if (output_format == null){
        output_format = "debug"
    }
    if (callback == null){
        callback = default_cmd_service_callback
    }
    var the_request = new ROSLIB.ServiceRequest({
        input : the_cmd,
        output_format : output_format //debug, last_command_result, all_command_results
    });
    shellClient.callService(the_request, callback)
    return "cmd service for: " + the_cmd + "<br/>has been called." //this is just s throw away for the UI.
         // the return value is not programmatically useful.
}
//_______________________
//user fn. ex:  rde.ping(null, function(result){alert(result.output)})
rde.ping = function(output_format, callback){
    init_ros_service_if_url_changed()
    var host = get_full_dexter_url().slice(5) //take off ws://
    host =  host.split(":")[0] //strip off the port number if any
    var the_cmd = "ping -c 1 " + host
    rde.shell(the_cmd, output_format, callback)
}
//_______________________call_service
function default_call_service_callback(result, error){
    if (typeof(result) == "string"){
        result = result.trim() //careful, means we won't see exactly what's returned, ie often extra newlines on the end.
                               // but usually this default_call_service_callback is just for human consumption.
    }
    out("Service call returned:<br/>" + stringify_value(result))
}

//user fn     the GENERAL, call any service.
//ex: rde.call_service('/shell_service', 'py_cmd_server_pkg/shell', {input : "rosversion -d", output_format : "debug"}, null)
//callback takes 1 arg, a jsobj, the result of the service call.
//note: seems to work fine if service_tyoe is null, or a random string.
//ex: rde.call_service("/rosapi/get_time", "rosapi/GetTime", {},function(result){alert(JSON.stringify(result))})
/*
 rde.call_service("/rosapi/service_host",    null, {service: "/rosapi/get_time"},
 function(result){alert(JSON.stringify(result))})
 )
 */
rde.call_service = function(service_name, service_type, request_jsobj, callback){
    if (callback == null) { callback = default_call_service_callback }
    service_obj = new ROSLIB.Service({
        ros : ros,
        name : service_name, //'/shell_service',
        serviceType: service_type //'py_cmd_server_pkg/shell' //'rospy_tutorials/shell'
    })
    var the_request = new ROSLIB.ServiceRequest(request_jsobj)
    service_obj.callService(the_request, callback)
    return service_name + " service called."
}
/*_______________________publish and subscribe
//user fn ex: rde.publish("/rosout", "rosgraph_msgs/Log", {msg: "hey"})  "/newtopic" "std_msgs/String"
The below works even though the topic "/junk2" has never been seen before.
 rde.subscribe("/junk2", "std_msgs/String")
 rde.publish("/junk2", "std_msgs/String", {data: "hey22 there"})
*/
rde.publish = function(topic, message_type, message){
    //topic:        a string like '/cmd_vel'
    //message_type: a string like 'geometry_msgs/Twist'  or 'std_msgs/String'
    //messsage:     usually js obj ie {x: 11, y: 12, z: 13}
    init_ros_service_if_url_changed()
    var pubcmd = new ROSLIB.Topic({
        ros : ros,
        name : topic,
        messageType : message_type
    });
    pubcmd.publish(message);
    out("Published: " + stringify_value(message) + "<br/>to: " + topic)
}

function default_subscribe_callback(message){
    out("Subscribe received: " + stringify_value(message))
}

//user fn ex: rde.subscribe("/rosout", "rosgraph_msgs/Log")
rde.subscribe = function (topic, message_type, callback, once){
    //topic: a string like '/listener'
    //message_type: a string like 'geometry_msgs/Twist'  or 'std_msgs/String'
    //callback: a function of 1 argument, the message that was published.
    //once: boolean (default false) of whether to unsubscribe after recieving first message
    init_ros_service_if_url_changed()
    if (callback == null) { callback = default_subscribe_callback }
    if (once == null) { once = false }
    var listener = new ROSLIB.Topic({
       ros : ros,
       name : topic,
       messageType : message_type
    });
    //listener.subscribe(callback)
    out("Subscribed to: " + topic) //doesn't allow customizaiton of calling unsubscribe or not
    listener.subscribe(function(message) {
        //console.log('Received message on ' + listener.name + ': ' + message.data);
        callback(message)
        if (once){
            listener.unsubscribe();
        }
    })
    return listener //TODO: so that user can unsubscribe via   the_return_val.unsubscribe()
                    //NO!, don't return the listener (but it does no harm!). make an unsubscribe("topic_name)) fn
                    //It works by having subscribe SAVE in a js obj topic_name to topic_obj pairs
                    //then unsubscribe can lookup in there and find the tpoic_obj to call
                    //unsubscribe on.
                    //with this list we can also SHOW all the topics the client is subscribed to
                    //and unsubscribe to them all with unsubscribe_from_all_js_topics()

}

rde.unsubscribe = function (topic){
    //topic: a string like '/listener'
    //ROS doc on unsubscribe is incomprehensible. http://robotwebtools.org/jsdoc/roslibjs/current/Topic.html
    init_ros_service_if_url_changed()
    var listener = new ROSLIB.Topic({
        ros : ros,
        name : topic,
        //messageType : message_type
    });
    //listener.subscribe(callback)
    out("Unsubscribed to: " + topic) //doesn't allow customizaiton of calling unsubscribe or not
    listener.unsubscribe();
    return listener
}

//____________________
function get_param_names_default_callback(params){
    params = params.join("<br/>")
    out("Params:<br/>" + params)
}

// Params
//user fn
rde.get_param_names = function(callback){
    //callback takes one argument, a jsobj with one key, params, whose value will be an array of params.
    if (callback == null){
       callback = get_param_names_default_callback
    }
    ros.getParams(callback);
    out("Getting all params ... ")
}

//user fn
rde.get_param = function(name, callback){
    //get the value of a param
    //if param doesn't exist, returns null
    //callback gets passed one argument, the value of the param
    if (callback == null){
        callback = function(value){ //needs to close over name.
            out("Param: " + name + " = " + stringify_value(value))
        }
    }
    var obj = new ROSLIB.Param({
    ros : ros,
    name : name})
    obj.get(callback)
    out("Getting param: " + name)
}

//user fn
rde.set_param = function(name, new_value){
    //no callback needed.
    var obj = new ROSLIB.Param({
        ros : ros,
        name : name})
    obj.set(new_value)
    return new_value //so output pane will show something when this is evaled
}

rde.delete_param = function(name){
    //no callback needed.
    var obj = new ROSLIB.Param({
        ros : ros,
        name : name})
    obj.delete()
    return "Param: " + name + " deleted." //so output pane will show something when this is evaled
}