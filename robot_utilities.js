//https://www.npmjs.com/package/ping
var ping = require('ping');

function output_is_not_connected_message(ip_address){
    open_doc(data_connection_doc_id)
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
    let result =  '<div name="ping_a_dexter_id_address_id" class="combo_box" style="display:inline-block;vertical-align:middle;width:240px;">' +
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
//_______default robot_______
function make_default_robot_menu_html(selected_robot_full_name=""){
    var result = "<span style='font-size:10px;'>default robot</span><br/>" +
        "<select id='default_robot_name_id' onchange='MakeInstruction.onchange_job_robot(event)' style='font-size:14px;width:130px;'" +
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

//example return: "Dexter.dexter0"
function default_robot_name(){
    if(default_robot_name_id){
        return default_robot_name_id.value
    }
    else { return "Dexter.dexter0" }
}

//but you can also use Dexter.default
function default_robot(){
    return value_of_path(default_robot_name())
}


function add_robot_to_default_menu(robot_or_name){
    if (typeof(robot_or_name) != "string") { //must be a robot instance
        robot_or_name = robot_or_name.constructor.name + "." + robot_or_name.name
    }
    let a_option = document.createElement("option")
    a_option.innerText = robot_or_name
    default_robot_name_id.prepend(a_option)
}

var {warning, last} = require("./core/utils.js")


/*
ping.sys.probe(host, function(isAlive){
    out(host + " connected: " + isAlive)
}

*/