//https://www.npmjs.com/package/ping
import ping from '/ping'

import {last} from "../job_engine/core/utils.js"


function output_is_not_connected_message(ip_address){
    DocCode.open_doc(data_connection_doc_id)
    warning(ip_address + " is not connected.")
}

function ping_host(ip_address = "127.0.0.1", display_non_connected_hosts_temporarily=false){
    ping.sys.probe(ip_address, function(isAlive){
        if (isAlive) {
            out(ip_address + " is connected. " +
                `<a href="#" title="Insert into the editor,&#013;a definition for the Dexter&#013;at this ip address." onclick="ping_a_dexter_make_dex_def('` + ip_address +
                `')"> Insert Dexter definition </a>`)
            return true
        }
        else {
            //out(ip_address + " is not connected.", "purple", display_non_connected_hosts_temporarily)
            output_is_not_connected_message(ip_address)
            return false
        }
    },
    { timeout: 1}) //in seconds, default is 1 second, can't take a float.
}

function make_ping_a_dexter_select(){
    //let result = '<select id="ping_a_dexter_id_address_id" style="font-size:16px;"> <option>Localhost: 127.0.0.1</option>'
    let result =  '<div id="ping_a_dexter_id_address_id" class="combo_box" style="display:inline-block;vertical-align:middle;width:240px;">' +
                   '<option></option> ' +
                   '<option>Localhost: 127.0.0.1</option> ' +
                   '<option>All_hosts_in: 127.0.0.</option> '

    let net_addresses = new Set([])  //each item will look like "123.456.78." WE don't want dplicates on the list,
                            //each one will become an item on the combo box menu to select.
    let wildcard_base_addresses = []
    let select_html = ' selected="selected" ' //select the first one of the names with an ip address
    for(let a_dex_name of Dexter.all_names){
        let a_dex = Dexter[a_dex_name]
        let ip_address = a_dex.ip_address
        if(ip_address){
            let label = a_dex_name + ": " + ip_address
            result += "<option " + select_html + ">" + label + "</option> "
            select_html = ""

            let new_wildcard_maybe = ip_address.substring(0, ip_address.length - 1) + "*"
            if(!wildcard_base_addresses.includes(new_wildcard_maybe)){
                result += "<option>" + "All_hosts_in: " + new_wildcard_maybe + "</option> "
                wildcard_base_addresses.push(new_wildcard_maybe)
            }

            let new_double_wildcard_maybe = ip_address.substring(0, ip_address.length - 2) + "**"
            if(!wildcard_base_addresses.includes(new_double_wildcard_maybe)){
                result += "<option>" + "All_hosts_in: " + new_double_wildcard_maybe + "</option> "
                wildcard_base_addresses.push(new_double_wildcard_maybe)
            }

            let last_dot_index = ip_address.lastIndexOf(".")
            let net_address_portion = ip_address.substring(0, last_dot_index + 1) //looks like "123.45.67."
            if(!net_addresses.has(net_address_portion)){
                result += "<option>" + "All_hosts_in: " + net_address_portion + "</option> "
                net_addresses.add(net_address_portion)
            }
        }
    }
    result += "</div>"
    return result
}

function ping_a_dexter_handler(vals){
    let menu_label = vals.ping_a_dexter_id_address_id
    if(!menu_label) { out("No ip_address selected.") }
    else {
        let split_menu_label = menu_label.trim().split(" ")
        let ip_address = last(split_menu_label)
        if(vals.clicked_button_value == "Ping") {
            let octets = ip_address.split(".")
            if (octets.length == 3) {
                ip_address += "."
                ping_a_dexter_scan(ip_address)
            }
            else if (octets.length == 4) {
                if(octets[3] == "") {  ping_a_dexter_scan(ip_address) }
                else if (ip_address.includes("*")) { ping_a_dexter_wildcard(ip_address) }
                else {  ping_host(ip_address) } //normal, ping one ip_address
            }
            else {
                warning("Incorrect syntax for ip_address. It should have 3 periods.")
            }
        }
        else if (vals.clicked_button_value == "Cancel") {
            ping_a_dexter_ongoing = false
        }
        else if (vals.clicked_button_value == "Insert Robot Definition") {
            if(split_menu_label.length == 2) {
                let old_dex_name = split_menu_label[0]
                old_dex_name = old_dex_name.substring(0, old_dex_name.length - 1)
                warning("Selected IP address: " + ip_address +
                        ", is already used by Dexter: " + old_dex_name)
            }
            ping_a_dexter_make_dex_def(ip_address)
        }
    }
}

function ping_a_dexter_make_dex_def(ip_address){
    let new_dex_name
    for(let i = 1; i < 255; i++){
        let maybe_new_dex_name = "dexter" + i
        if(!(Dexter[new_dex_name])) {
            new_dex_name  = maybe_new_dex_name
            break;
        }
    }
    if(!new_dex_name) { new_dex_name = "replace_with_dex_name" }
    let def = 'new Dexter({name: "' + new_dex_name +
        '",\n            ip_address: "' + ip_address + '"})\n'
    Editor.insert(def)
}

var ping_a_dexter_ongoing = false

function ping_a_dexter_wildcard(ip_address_with_wildcard){
    if(ip_address_with_wildcard.endsWith("**")) {
        let base_address = ip_address_with_wildcard.substring(0, ip_address_with_wildcard.length - 2)
        out("Pinging addresses from " + base_address + "00" + " through " +  base_address + "99" + " ...")
        ping_a_dexter_ongoing = true
        ping_a_dexter_double_wildcard_aux(ip_address_with_wildcard, 0, 0)
    }
    else {
        let wildcard_index = ip_address_with_wildcard.indexOf("*")
        out("Pinging addresses from " + ip_address_with_wildcard.replace("*", "0") + " through " +  ip_address_with_wildcard.replace("*", "9") + " ...")
        ping_a_dexter_ongoing = true
        ping_a_dexter_wildcard_aux(ip_address_with_wildcard, 0, 0)
    }
}

function ping_a_dexter_wildcard_aux(ip_address_with_wildcard, host = 0, connected_count=0, stop_after_nine=true){
    if (host < 10) {
        let ip_address = ip_address_with_wildcard.replace("*", host)
        ping.sys.probe(ip_address, function(isAlive){
            if (isAlive) {
                connected_count += 1
                out(ip_address + " is connected. " +
                    `<a href="#" title="Insert into the editor,&#013;a definition for the Dexter&#013;at this ip address." onclick="ping_a_dexter_make_dex_def('` + ip_address +
                    `')"> Insert Dexter definition </a>`)
            }
            //else if ((host % 32) == 0) { out("<br/>.") }
            else {
                //out(ip_address + " is not connected.", "purple", true)
                output_is_not_connected_message(ip_address)
            }
            if(stop_after_nine && (host == 9)) {
                out("ping scan complete. " + connected_count + " connected host(s) found.")
                ping_a_dexter_ongoing = false
            }
            else if(ping_a_dexter_ongoing){
                ping_a_dexter_wildcard_aux(ip_address_with_wildcard, host + 1, connected_count)
            }
            else {
                out("ping scan stopped after: " + ip_address + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + connected_count + " connected host(s) found.")
            }
        })
    }
}

function ping_a_dexter_double_wildcard_aux(ip_address_with_wildcard, host = 0, connected_count=0, stop_after_nine=true){
    if (host < 100) {
        let base_address = ip_address_with_wildcard.substring(0, ip_address_with_wildcard.length - 2)
        let ip_address
        if (host < 10) { ip_address = base_address + "0" + host }
        else           { ip_address = base_address + host }
        ping.sys.probe(ip_address, function(isAlive){
            if (isAlive) {
                connected_count += 1
                out(ip_address + " is connected. " +
                    `<a href="#" title="Insert into the editor,&#013;a definition for the Dexter&#013;at this ip address." onclick="ping_a_dexter_make_dex_def('` + ip_address +
                    `')"> Insert Dexter definition </a>`)
            }
            //else if ((host % 32) == 0) { out("<br/>.") }
            else {
                //out(ip_address + " is not connected.", "purple", true)
                output_is_not_connected_message(ip_address)
            }
            if(host == 99) {
                out("ping scan complete. " + connected_count + " connected host(s) found.")
                ping_a_dexter_ongoing = false
            }
            else if(ping_a_dexter_ongoing){
                ping_a_dexter_double_wildcard_aux(ip_address_with_wildcard, host + 1, connected_count)
            }
            else {
                out("ping scan stopped after: " + ip_address + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + connected_count + " connected host(s) found.")
            }
        })
    }
}

function ping_a_dexter_scan_aux(net_address, host = 0, connected_count=0){
    if (host < 10) {
        let ip_address = net_address + host
        ping.sys.probe(ip_address, function(isAlive){
            if (isAlive) {
                connected_count += 1
                out(ip_address + " is connected. " +
                    `<a href="#" title="Insert into the editor,&#013;a definition for the Dexter&#013;at this ip address." onclick="ping_a_dexter_make_dex_def('` + ip_address +
                    `')"> Insert Dexter definition </a>`)
            }
            //else if ((host % 32) == 0) { out("<br/>.") }
            else {
                //out(ip_address + " is not connected.", "purple", true)
                output_is_not_connected_message(ip_address)
            }
            if(host == 255) {
                out("ping scan complete. " + connected_count + " connected host(s) found.")
                ping_a_dexter_ongoing = false
            }
            else if(ping_a_dexter_ongoing){
                ping_a_dexter_scan_aux(net_address, host + 1, connected_count)
            }
            else {
                out("ping scan stopped after: " + ip_address + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + connected_count + " connected host(s) found.")
            }
        })
    }
}


//net address mst look like "123.45.6."   ending in a period, three periods total.
function ping_a_dexter_scan(net_address) {
  out("Pinging addresses from " + net_address + 0 + " through " +  net_address + 255 + " ...")
  ping_a_dexter_ongoing = true
  ping_a_dexter_scan_aux(net_address, 0, 0)
}

function ping_a_dexter_scan_aux(net_address, host = 0, connected_count=0){
    if (host < 256) {
        let ip_address = net_address + host
        ping.sys.probe(ip_address, function(isAlive){
            if (isAlive) {
                connected_count += 1
                out(ip_address + " is connected. " +
                    `<a href="#" title="Insert into the editor,&#013;a definition for the Dexter&#013;at this ip address." onclick="ping_a_dexter_make_dex_def('` + ip_address +
                    `')"> Insert Dexter definition </a>`)
            }
            //else if ((host % 32) == 0) { out("<br/>.") }
            else {
                //out(ip_address + " is not connected.", "purple", true)
                output_is_not_connected_message(ip_address)
            }
            if(host == 255) {
                out("ping scan complete. " + connected_count + " connected host(s) found.")
                ping_a_dexter_ongoing = false
            }
            else if(ping_a_dexter_ongoing){
                ping_a_dexter_scan_aux(net_address, host + 1, connected_count)
            }
            else {
                out("ping scan stopped after: " + ip_address + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + connected_count + " connected host(s) found.")
            }
        })
    }
}


function ping_a_dexter(){
    show_window({title: "Ping a Dexter",
                 content: `Test to see if a Dexter or other ip_address<br/>
                           is connected to this computer.<p/>` +
                           "<i>Type in, or select, an ip address.</i><br/>" +
                             "<b>123.45.6.12*</b> checks 123.45.6.120 => 123.45.6.129<br/>" +
                             "<b>123.45.6.1**</b> checks 123.45.6.100 => 123.45.6.199<br/>" +
                             "<b>123.45.6.</b>  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; checks 123.45.6.000 => 123.45.6.255<br/>" +
                             "<p/>" +
                            make_ping_a_dexter_select() +
                            "<p/><center><input type='button' value='Ping' title='Start pinging indicated ip address(es).'/> " +
                            " <input type='button' value='Cancel' title='Stop an ongoing scan of ip addresses.'/>" +
                            " <input type='button' value='Insert Robot Definition' title='Insert a definiton&#013;for a Dexter robot&#013;with the selected IP address.'/></center>",
                 x:      50,
                 y:      100, //high enough to show the ip menu in the dialog
                 height: 275,
                 width:  480,
                 callback: ping_a_dexter_handler
                })
}

//ping.sys.probe(host, function(isAlive){ out(host + " connected: " + isAlive) }

//_______default robot_______
function make_dexter_default_menu_html(selected_robot_full_name=""){
    var result = "<span style='font-size:10px;'>Dexter.default: </span>" +
        "<select id='default_dexter_name_id' onchange='onchange_dexter_default(event)' style='font-size:14px;width:130px;'" +
        " title='Supplies the robot for instructions prefixed\n" +
        "with a robot class (like Dexter or Serial)\n" +
        "but no robot instance.')>"
    for(let robot_class_name of ["Brain", "Dexter", "Human", "Serial"]){
        for(let name of window[robot_class_name].all_names){
            let full_name = robot_class_name + "." + name
            let sel_attr = ((full_name == selected_robot_full_name) ? " selected='selected' " : "")
            result += "<option " + sel_attr + ">" + full_name + "</option>"
        }
    }
    result += "</select>"
    return result
}

function onchange_dexter_default(){
    //let rob = value_of_path(event.target.value) ///might not be a dexter
    let dexter_name = event.target.value
    let rob = Dexter[dexter_name]
    if(rob instanceof Dexter) { Dexter.default = rob }
    else { //Dexter.default = Dexter.dexter0
       shouldnt("in onchange_dexter_default, got a non-dexter in the Dexter default menu.")
    }
}

//example return: "Dexter.dexter0"
//the id in the Misc Pane robot select widget.
//note this will always return a string starting with "Dexter."
function default_dexter_full_name(){
    if(default_dexter_name_id){
        return "Dexter." + default_dexter_name_id.value
    }
    else { return "Dexter.dexter0" }
}

function add_dexter_to_dexter_default_menu(a_dexter_or_dexter_name){
    let dex_name
    if (a_dexter_or_dexter_name instanceof Dexter) {
        dex_name = a_dexter_or_dexter_name.name
    }
    else if (typeof(a_dexter_or_dexter_name) === "string"){ dex_name = a_dexter_or_dexter_name}
    else { shouldnt("add_dexter_to_dexter_default_menu passed: " + a_dexter_or_dexter_name +
                    "<br/>but that isn't a dexter instance or dexter name.") }
    let a_option = document.createElement("option")
    a_option.innerText = dex_name
    default_dexter_name_id.prepend(a_option)
}

//_______Dexter Start Options dialog________
function dexter_start_options_path() {
    return "Dexter." + Dexter.default.name + ":/srv/samba/share/autoexec.jobs"
}

//top level fn called from menu item
function show_dexter_start_options(){
    let path = dexter_start_options_path()
    read_file_async(path, undefined, function(err, content){
       if(err) {
           warning("Sorry, can't connect to Dexter." + Dexter.default.name)
       }
       else {
           show_dexter_start_options_aux(content)
       }
    })
}

function show_dexter_start_options_cb(vals){
    if(vals.clicked_button_value === "Save"){
        out("saving start options.")
        let path = dexter_start_options_path()
        read_file_async(path, undefined, function(err, content){
            if(err) {
                warning("Sorry, can't connect to Dexter." + Dexter.default.name)
            }
            else {
                let show_dexter_start_options_lines = content.split("\n")
                let result_content = ""
                show_dexter_start_options_lines.forEach(function(line, index, lines){
                    if(index !== 0) { result_content += "\n" } //carefully done so that we won't build up extra newlines in the file
                    let name = "line_" + index
                    let should_be_checked_and_run = vals[name]
                    if      (line.trim() === "")      { the_new_line = line } //blank line. keep as is.
                    else if(line.startsWith("# "))    { the_new_line = line } //its just a comment. keep as is.
                    else if(line.startsWith("#")){
                       if(should_be_checked_and_run)  { the_new_line = line.substring(1) } //uncomment by cuting off the #
                       else                           {  the_new_line = line }  //should be commented out and it is
                    }
                    else { //no # at beginning
                        if(should_be_checked_and_run) { the_new_line = line } //should be run and it is
                        else                          { the_new_line = "#" + line } //comment it out
                    }
                    result_content += the_new_line
                })
                write_file_async(path, result_content, undefined,
                                 show_dexter_start_options_write_cb)
            }
        })
    }
}

function show_dexter_start_options_write_cb(err){
    let path = dexter_start_options_path()
    if(err){
        dde_error("Sorry, could not save: " + path + "<br/>" + err.message)
    }
    else {
        out("Saved " + path, "green")
    }
}

var show_dexter_start_options_lines = null

function show_dexter_start_options_aux(file_content){
    let show_dexter_start_options_lines = file_content.split("\n")
    let directions =
        `When Dexter turns on,<br/>it will run the checked items automatically.<br/>
         Modify them and click <b>Save</b> if you like.<p/>
         Checking PHUI2RCP.js puts Dexter in PHysical UI mode,<br/>
         where you program Dexter by moving Dexter.<br/>
         This prevents programming from DDE.<hr/>`
    let html_content = directions
    show_dexter_start_options_lines.forEach(function(line, index, lines){
        if(line.startsWith("# ")){} //its just a comment. leave as is
        else if (line.trim() === "") {} //ignore blank lines
        else {
            let is_checked = !line.startsWith("#")
            let label = (is_checked ? line : line.substring(1)) //for the unchecked ones, cut off the # (omment char)
            let checked_prop = (is_checked? " checked='checked'" : " ")
            let html_checkbox =  "<input name='line_" + index + "' type='checkbox' " + checked_prop + " />\n"
            let html_line = html_checkbox + " " + label + "<br/>"
            html_content += html_line
    }})
    html_content += ("<input type='submit' value='Cancel'/> &nbsp;&nbsp;\n" +
                     "<input type='submit' value='Save'/> &nbsp;&nbsp;")
    show_window({title: "Dexter." + Dexter.default.name + " Start Options",
                 content: html_content,
                 callback: show_dexter_start_options_cb
                })
}
