//This file is loaded both in the Job Engine and in the Jobs Browser
//copied from utils.js so that we don't have to have any requires in this file
function prepend_file_message_maybe(message){
    if (message.startsWith("while loading file:")) { return message }
    else if (window.loading_file) {
        return "while loading file: " + window.loading_file + "<br/>" + message
    }
    else { return message }
}

function dde_error(message){
    let out_string = prepend_file_message_maybe(message)
    console.log("dde_error: " + out_string)
    var err = new Error();
    var stack_trace = err.stack
    out_string = "<details><summary><span class='dde_error_css_class'>Error: " + out_string +
        "</span></summary>" + stack_trace + "</details>"
    if(window["out"]) { //when in DDE
        out(out_string)
    }
    else { //when in browser and Job Engine
        append_to_output(out_string)
    }
    throw new Error(message)
}

function warning(message, temp=false){
    let out_string
    let stack_trace = "Sorry, a stack trace is not available."
    if(window["replace_substrings"]){
        let err = new Error();
        stack_trace = replace_substrings(err.stack, "\n", "<br/>")
    }
    out_string = "<details><summary><span class='warning_css_class'>Warning: " + prepend_file_message_maybe(message) +
        "</span></summary>" + stack_trace + "</details>"
    out(out_string, undefined, temp)
}

function function_name(fn_or_src){
    if (typeof(fn_or_src) == "string"){
        if (!fn_or_src.startsWith("function ")) {return null}
        else{
            let parts = fn_or_src.split(" ")
            if (parts.length < 2) { return "" }
            else {
                let name_maybe = parts[1]
                if (name_maybe.startsWith("(")) { return "" }
                else {
                    let paren_pos = name_maybe.indexOf("(")
                    if (paren_pos == -1) { return name_maybe }
                    else { return name_maybe.substring(0, paren_pos) }
                }
            }
        }
    }
    else if (typeof(fn_or_src) == "function"){
        return  fn_or_src.name   //returns "" if anonymous function
    }
    else { return null }
}

function is_string_a_integer(a_string){
    var pat = /^-?[0-9]+$/;
    if(a_string.match(pat)) {  return true; }
    else { return false; }
}

function is_string_a_float(a_string){
    var pat = /^-?[0-9]+\.[0-9]+$/;
    if(a_string.match(pat)) {  return true; }
    else { return false; }
}

function is_string_a_number(a_string){
    return is_string_a_integer(a_string) || is_string_a_float(a_string)
}

//____end copy from utils.js
function append_to_output(text){
    var out_height = output_div_id.scrollHeight
    text += "\n"
    if(window["output_div_id"]) { //DDE and browser
        output_div_id.insertAdjacentHTML('beforeend', text) //output_div_id is defined in DDE and browser
        output_div_id.scrollTop = out_height
        SW.install_onclick_via_data_fns()
    }
    else { //in Job Engine
        write_to_stdout(text)
    }
}

function clear_output(){
    output_div_id.innerText = ""
    if(window["init_inspect"]) {
        init_inspect();
    }
    return "dont_print"
}

function stringify_value_cheap(val){
    if(typeof(value) == "string") { return val }
    try { val = JSON.stringify(val)
        return val
    }
    catch(err) {
        return "" + val
    }
}

function out(val="", color="black", temp=false, code=null){
    let text = val
    if (typeof(text) != "string"){ //if its not a string, its some daeta structure so make it fixed width to demostrate code. Plus the json =retty printing doesn't work unless if its not fixed width.
        if(window["stringify_value"]) { text = stringify_value(text) }
        else { text = stringify_value_cheap(val) } //hits in browser
    }
    if(window.platform == "node") { //console.log(val)
        let out_obj = {kind: "out_call", val: text, color: color, temp: temp, code: code} //code isn't actually used in the browser
        write_to_stdout("<for_server>" + JSON.stringify(out_obj) + "</for_server>")
        return val
    }

    if(window["format_text_for_code"]) { //doesn't hit in browser
        text = format_text_for_code(text, code)
    }
    if ((color != "black") && (color != "#000000")){
        text = "<span style='color:" + color + ";'>" + text + "</span>"
    }
    let temp_str_id = ((typeof(temp) == "string") ? temp : "temp")
    let existing_temp_elts = []
    if(window["document"]){
        existing_temp_elts = document.querySelectorAll("#" + temp_str_id)
    }
    if (temp){
        if (existing_temp_elts.length == 0){
            text = '<div id="' + temp_str_id + '" style="border-style:solid;border-width:1px;border-color:#0000FF;margin:5px 5px 5px 15px;padding:4px;">' + text + '</div>'
            append_to_output(text)
        }
        else {
            //existing_temp_elts.html(text)
            for(let temp_elt of existing_temp_elts){ temp_elt.innerHTML = text}
        }
        return "dont_print"
    }
    else {
        if ((existing_temp_elts.length > 0) && (temp_str_id == "temp")){ //don't remove if temp is another string. This is used in Job.show_progress
            //existing_temp_elts.remove()
            for(let temp_elt of existing_temp_elts){ temp_elt.remove() }
        }
        //var out_item_id = "out_" + out_item_index
        //out_item_index += 1
        text = '<div id="' + //out_item_id +
            '" style="border-style:solid;border-width:1px;border-color:#AA00AA;margin:5px 5px 5px 15px;padding:4px;">' + text + '</div>'
        append_to_output(text)
    }
    if(window["document"]){
        let orig_focus_elt = document.activeElement
        orig_focus_elt.focus()
    }
    if (temp){
        return "dont_print"
    }
    else {
        return val //so value can be used by the caller of show_output
    }
}


class SW { //stands for Show Window. These are the aux fns that the top level show_window fn uses
           //show_window itself is not called from the browser

//good test: get_index_of_window(get_window_of_index(0))
static get_index_of_window(show_window_elt){
    let index_str = show_window_elt.getAttribute('data-window_index')
    return parseInt(index_str)
}

//index is an int. result is a win or null if none
static get_window_of_index(index){
    if (index === undefined){ //risky to just get the latest created, but a good trick when I need to call some init  for a window as in combo box for app builder from ab.fill_in_action_names
        index = this.window_index
    }
    let win = document.querySelector('[data-window_index="' + index + '"]')
    return win
}

//returns true or false
static is_window_shown(index){
    let the_elt = this.get_window_of_index(index)
    if(the_elt) { return true }
    else        { return false }
}

//works for both DDE and Browser. needed by submit_window
static get_window_content_of_elt(elt){
    return elt.closest(".show_window_content")
}

static get_show_window_elt(elt) {
    return elt.closest(".show_window")
}
//return sw_elt or null if none.
static get_window_index_containing_elt(elt){
    let sw_elt = this.get_show_window_elt(elt)
    if(sw_elt) {
        return this.get_index_of_window(sw_elt)
    }
    else { return null }
}

static all_show_windows(){
    let nodelist = document.querySelectorAll(".show_window")
    let arr = Array.prototype.slice.call(nodelist)
    return arr
}

//esp good for a zillion human_notify show windows
static close_all_show_windows(){
    for(let win of SW.all_show_windows()){
        SW.sw_close(win)
    }
}

//if you change, this, also change sw_make_title_html
static get_show_window_title(sw_elt){
    let title_elt = sw_elt.firstChild
    let html = title_elt.innerHTML //warning: includes the buttons
    let pos  = html.indexOf("sw_close(")
    pos = html.lastIndexOf("<button", pos)
    let title = html.substring(0, pos)
    return title
}

//might return an empty array
static windows_of_title(title){
    //return document.querySelectorAll('[data-show_window_title="' + title + '"]') //fails if there's HTML in the title
    let result = []
    for(let sw_elt of this.all_show_windows()){
        if(this.get_show_window_title(sw_elt) == title) { result.push(sw_elt) }
    }
    return result
}

static close_windows_of_title(title){
    sw_win_elts = this.windows_of_title(title)
    for(let win_elt of sw_win_elts){
        this.sw_close(win_elt)
    }
}

//returns latest show_window having title, or null if none.
//called from show_window fn
static latest_window_of_title(title){
    let win_elts = this.windows_of_title(title)
    let max_index = -1
    let max_elt = null
    for(win_elt of win_elts){
        let index = this.get_index_of_window(win_elt)
        if(index > max_index) {
            max_index = max_index
            max_elt = win_elt
        }
    }
    return max_elt
}


//same for dde and browser
static render_show_window(properties){
    //onsole.log("top of render_show_window")
    //kludge but that's dom reality
    let holder_div = document.createElement("div"); // a throw away elt
    holder_div.innerHTML = properties.html
    let show_window_elt = holder_div.firstElementChild
    body_id.appendChild(show_window_elt) //this is automatically done when I call jqxw_jq.jqxWindow({width:width below
    if(properties.is_modal) {
        show_window_elt.showModal()
    }
    else {
        show_window_elt.show()
    }

    //see https://stackoverflow.com/questions/26283661/drag-drop-with-handle
    //and the code solution at https://jsfiddle.net/a6tgy9so/1/
    //BUT: THIS EXAMPLE DOESN'T HAVE HOW TO POSITION THE DRAGGED DIALOG AFTER YOU DROP IT.
    // on dragging title to move whole window, without drag on content doing anything
    //the title is called the drag "handle", whereas the whole window is called the "draggable"
    show_window_elt.focus()
    //let title_id = "sw_title_" + properties.window_index + "_id"
    let title_elt = show_window_elt.querySelector(".show_window_title") //window[title_id]
    //onsole.log("render_show_window got title_elt: " + title_elt)
    let draggable_value = (properties.draggable? "true": "false")
    //onsole.log("render_show_window got draggable_value: " + draggable_value)
    title_elt.onmousedown = function(event) {
        event.target.parentNode.setAttribute('draggable', draggable_value) //set the whole sw window to now be draggable.
    }
    title_elt.onmouseup = function(event) {
        event.target.parentNode.setAttribute('draggable', 'false') //set the whole sw window to now be draggable.
    }
    show_window_elt.ondragstart = function(event) {
        let show_win_elt = event.target
        var style = window.getComputedStyle(show_win_elt, null)
        let left = parseInt(style.getPropertyValue("left"), 10) - event.clientX
        let top  = parseInt(style.getPropertyValue("top"),  10) - event.clientY
        //event.dataTransfer.setData("text/plain", (parseInt(style.getPropertyValue("left"), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"), 10) - event.clientY) + ',' + event.target.getAttribute('data-item'));
        let data = show_window_elt.id + "," + left + "," + top
        event.dataTransfer.setData("sw_id", data) //title_id) //don't use "text or "text/plain" here
        //as that will cause the data to ALSO be inserted into the DDE editor.
    };
    show_window_elt.ondragend = function(event) {
        event.target.setAttribute('draggable', 'false')
    };

    body_id.ondragenter = this.sw_ondragenter
    body_id.ondragover = this.sw_allow_drop
    body_id.ondrop = this.sw_drop
    this.init_draggable_elements(show_window_elt) //not for dragging the whole win, just elts WITHIN the win

    setTimeout(SW.install_onclick_via_data_fns, 10) //don't need this at all for show_window in browser.
    setTimeout(function(){SW.install_submit_window_fns(show_window_elt)}, 10)
    if (properties.init_elt_id){
        setTimeout(function(){window[properties.init_elt_id].click()} , 100)
    }
}

static init_draggable_elements(show_window_elt){
    var ins = show_window_elt.querySelectorAll(".draggable") //"[draggable='true']")
    if(ins.length > 0) {
        let first_ins = ins[0]
        let par = first_ins.parentElement
        this.makeDraggable(par)
    }
}
    //for(var index = 0; index < ins.length; index++){ //bug in js chrome: for (var elt in elts) doesn't work here.
    //    var inp = ins[index]
    //    if (inp.class !== "show_window") {
    //        inp.draggable = "true" //doesn't work in triggering ondragstart
            //inp.onmousedown = function(e) {
            //    e.target.setAttribute('draggable', 'true') //set the whole sw window to now be draggable.
            //}
            //inp.onmouseup = function(e) {
            //    e.target.setAttribute('draggable', 'false') //set the whole sw window to now be draggable.
            //}
           /* inp.ondragstart = function(event) {
                event.preventDefault();
                event.stopPropagation()
                let inp = event.target
                var style = window.getComputedStyle(inp, null)
                let left = parseInt(style.getPropertyValue("left"), 10) - event.clientX
                let top  = parseInt(style.getPropertyValue("top"),  10) - event.clientY
                //event.dataTransfer.setData("text/plain", (parseInt(style.getPropertyValue("left"), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"), 10) - event.clientY) + ',' + event.target.getAttribute('data-item'));
                let data = inp.id + "," + left + "," + top
                event.dataTransfer.setData("sw_id", data) //title_id) //don't use "text or "text/plain" here
            }
            let inp_parent = inp.parentElement
            inp_parent.ondragenter = this.sw_ondragenter
            inp_parent.ondragover = this.sw_allow_drop
            inp_parent.ondrop = this.sw_drop*/
//}}}

//http://www.petercollingridge.co.uk/tutorials/svg/interactive/dragging/
//svg_elt is the PARENT of the elt to drag, ie an "SVG" tag elt.
    static makeDraggable(svg_elt){
        //var svg_elt = evt.target;  //was named "svg"
        svg_elt.addEventListener('mousedown', startDrag, false);
        svg_elt.addEventListener('mousemove', drag, false);
        svg_elt.addEventListener('mouseup', endDrag, false);

        function getMousePosition(evt){
            let CTM = svg_elt.getScreenCTM();
            return {
                x: (evt.clientX - CTM.e) / CTM.a,
                y: (evt.clientY - CTM.f) / CTM.d
            };
        }
        var selectedElement, offset, transform;

        function startDrag(evt) {
            if (evt.target.classList.contains('draggable')) {
                selectedElement = evt.target;
                if(selectedElement.tagName == "circle") { //no need to transform this. mouse coords are the coord of the containing SVG elt, with 0,0 in upper left.
                    return
                }
                offset = getMousePosition(evt);
                out("in startDrag offset: " + offset)
                // Make sure the first transform on the element is a translate transform
                var transforms = selectedElement.transform.baseVal;

                if (transforms.length === 0 || transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                    // Create an transform that translates by (0, 0)
                    var translate = svg_elt.createSVGTransform();
                    translate.setTranslate(0, 0);
                    selectedElement.transform.baseVal.insertItemBefore(translate, 0);
                }
                // Get initial translation
                transform = transforms.getItem(0);
                offset.x -= transform.matrix.e;
                offset.y -= transform.matrix.f;
            }
        }
        function drag(evt) {
            if (selectedElement) {
                let coord = getMousePosition(evt);
                out("in drag x: " + coord.x + " y: " + coord.y)
                if(selectedElement.tagName == "circle"){
                    selectedElement.setAttribute("cx", coord.x)
                    selectedElement.setAttribute("cy", coord.y)
                }
                else {
                    transform.setTranslate(coord.x - offset.x, coord.y - offset.y);
                }
                let elt_being_dragged = evt.target
                if(elt_being_dragged.dataset.oninput == "true"){
                    SW.submit_window.call(elt_being_dragged, evt)
                }
            }
        }
        function endDrag(evt) {
            selectedElement = null;
        }
    }

//called with elt of the close button, a sw_window_content_elt, or a a sw_window_elt
static sw_close(elt){
    let sw_window_elt = elt.closest(".show_window")
    sw_window_elt.close()
    sw_window_elt.remove() //remove from body_id
}
static sw_toggle(elt){
    let dia_elt = elt.closest(".show_window")
    let content_elt = dia_elt.querySelector(".show_window_content") // dia_elt.children[1]
    if(content_elt.style.display == "none") { //expand the window
        content_elt.style.display = "block"
        dia_elt.style.height = dia_elt["data-full-height"]
        elt.innerHTML = "^"
    }
    else { //shrink the window
        dia_elt["data-full-height"] = dia_elt.style.height
        content_elt.style.display = "none"
        dia_elt.style.height = "35px"
        elt.innerHTML = "v"
    }
}

static sw_allow_drop(event) {
    event.preventDefault();
}
static sw_ondragenter(event) {
    event.preventDefault();
}

//"this" is body_id
static sw_drop(event){
    console.log("got drop")
    event.preventDefault();
    event.stopPropagation()
    let data = event.dataTransfer.getData("sw_id")
    console.log("sw_drop got data: " + data)
    let [sw_elt_id, left, top] = data.split(",")
    event.dataTransfer.clearData("sw_id") //doesn't prevent inserting of the data into the editor
    let show_window_elt_being_dragged = body_id.querySelector("#" + sw_elt_id) //window[sw_elt_id]
    //event.target //in browser, this is the sw dialog. In DDE this is some codemirror nested elt
    //show_window_elt_being_dragged = show_window_elt_being_dragged.closest("DIALOG") ////in browser, this is the sw dialog. In DDE this is null
    let new_x = (event.clientX + parseInt(left, 10)) + 'px';
    let new_y = (event.clientY + parseInt(top,  10)) + 'px';
    console.log("clientX: " + event.clientX + " clientY: " + event.clientY +
                " new_x: " + new_x + " new_y: " + new_y)
    //let new_x = event.clientX + "px" //event.offsetX + "px"
    //show_window_elt_being_dragged.getBoundingClientRect().left + "px"
    //let new_y = event.clientY + "px" //event.offsetY + "px"
    //show_window_elt_being_dragged.getBoundingClientRect().top + "px"
    show_window_elt_being_dragged.style.left = new_x
    show_window_elt_being_dragged.style.top = new_y

}

static install_onclick_via_data_fns(){
    var elts = document.getElementsByClassName("onclick_via_data")
    for (var index = 0; index < elts.length; index++){ //bug in js chrome: for (var elt in elts) doesn't work here.
        var elt = elts[index]
        elt.onclick = this.onclick_via_data_fn //in ROS code but this is bad. Not used in browser code
    }
}

static sw_combobox_select_oninput(event){
    let the_select_elt = event.target
    let val = the_select_elt.value
    let combobox_div = the_select_elt.closest(".combo_box")
    let input_elt = combobox_div.firstElementChild
    input_elt.value = val
}

static install_submit_window_fns(show_window_elt){
    let ins = show_window_elt.querySelectorAll(".clickable")
    for (var index = 0; index < ins.length; index++){ //bug in js chrome: for (var elt in elts) doesn't work here.
        var inp = ins[index]
        inp.onclick = this.submit_window
    }
    ins = show_window_elt.querySelectorAll("[data-onchange='true']")
    for (var index = 0; index < ins.length; index++){ //bug in js chrome: for (var elt in elts) doesn't work here.
        var inp = ins[index]
        inp.onchange = this.submit_window
    }
    ins = show_window_elt.querySelectorAll("[data-oninput='true']")
    for (var index = 0; index < ins.length; index++){ //bug in js chrome: for (var elt in elts) doesn't work here.
        var inp = ins[index]
        inp.oninput = this.submit_window
    }

    //var ins = info_win_div.find("input")
     ins = show_window_elt.querySelectorAll("input")
    for (var index = 0; index < ins.length; index++){ //bug in js chrome: for (var elt in elts) doesn't work here.
        var inp = ins[index]
        if ((inp.type == "submit") || (inp.type == "button")){
            inp.onclick = this.submit_window
        }
        //else{
        //    if (inp.dataset.onchange == "true") { inp.onchange = this.submit_window }
        //    if (inp.dataset.oninput  == "true") { inp.oninput  = this.submit_window }
        //}
    }
    //var ins = info_win_div.find("select")

    // ins = show_window_elt.querySelectorAll("select")
    //for (var index = 0; index < ins.length; index++){ //bug in js chrome: for (var elt in elts) doesn't work here.
    //    var inp = ins[index]
    //    if (inp.dataset.onchange == "true") { inp.onchange = this.submit_window }
    //    if (inp.dataset.oninput  == "true") { inp.oninput  = this.submit_window }
    //}
    //var ins = info_win_div.find("a")
     ins = show_window_elt.querySelectorAll("a")
    for (var index = 0; index  < ins.length; index++){ //bug in js chrome: for (var elt in elts) doesn't work here.
        var inp = ins[index]
        inp.onclick = this.submit_window
    }
    var combo_boxes = show_window_elt.querySelectorAll(".combo_box")  //should be a div tag a la <div class="combo_box><option>one</option><option>two</option></div>
    for (var i = 0; i < combo_boxes.length; i++){
        let cb = combo_boxes[i] //$(combo_boxes[i])
        //make an ARRAY, not a collection, of kids. becaluse the n2 for loop below really needs an array
        var kids = []
        for(let kid of cb.children){ //was: cb.children()
            kids.push(kid)
        }
        let input_elt = document.createElement("INPUT")
        input_elt.id = cb.id
        cb.id = ""
        let select_elt = document.createElement("SELECT")
        select_elt.oninput=this.sw_combobox_select_oninput
        select_elt.style["margin-left"] = "5px"
        select_elt.style.width = "20px"
        //select_elt.children = kids
        for (let kid of kids){
            //let kid = kids[j] //could be nearly any html elt but option is a good choice.
            //kid.remove() //is this necessary?
            select_elt.appendChild(kid)
            if (kid.selected) {input_elt.value = kid.innerText}
        }
        cb.appendChild(input_elt)
        cb.appendChild(select_elt)
        //if (cb[0].style && cb[0].style.width) {
        //    var cb_width = cb[0].style.width
        //    cb.jqxComboBox({height: '16px', source: choices, selectedIndex: sel_index, width: cb_width})
        //}
        //else{
        //    cb.jqxComboBox({height: '16px', source: choices, selectedIndex: sel_index})
        //}
    }
    //don't do this. Just give the canvas tag (or any tag  you want to be clickable,  prop:
    // class="clickable"
    //let canvases = info_win_div.find("canvas")
    //for(let canvas_elt of canvases) {
    //  canvas_elt.onclick = submit_window
    //}
    let window_index = this.get_index_of_window(show_window_elt)
    var menus = show_window_elt.querySelectorAll(".menu")
    for (var i = 0; i < menus.length; i++){
        var menu = menus[i]
        var outer_lis = menu.children[0].children
        if (outer_lis && outer_lis[0] && outer_lis[0].children && outer_lis[0].children[0]){
            var inner_lis = outer_lis[0].children[0].children
            this.install_menus_and_recurse(inner_lis, window_index)
        }
        // else we've got a menu with zero items, but for dev purposes its nice to
        //be able to show the menu's name, and its down arrow, even if nothing under it.
        $(menu).jqxMenu({ width: '100px', height: '25px' })
    }
}


static install_menus_and_recurse(inner_lis, window_index){ //the arg is li elts that *might* not be leaves
    for(var j = 0; j < inner_lis.length; j++){
        var inner_li = inner_lis[j]
        inner_li.onclick = this.submit_window
        //$(inner_li).attr('data-window_index', window_index)//because jqx sticks these LIs outside the dom so it screws uo the normal way of looking up the dom to find it.
        inner_li.setAttribute('data-window_index', window_index)
        if (inner_li.children.length > 0){
            this.install_menus_and_recurse(inner_li.children[0].children, window_index)
        }
    }
}


//beware, this method uses "this" to mean the subject it was called with, not SW
static submit_window(event){
    // descriptions of x & y's: http://stackoverflow.com/questions/6073505/what-is-the-difference-between-screenx-y-clientx-y-and-pagex-y
    let subject_elt = this
    event.stopPropagation();
    let result = {offsetX:event.offsetX,  offsetY:event.offsetY, //relative to the elt clocked on
        x:event.x,              y:event.y, //relative to the parent of the elt clicked on
        clientX:event.clientX,  clientY:event.clientY, //Relative to the upper left edge of the content area (the viewport) of the browser window. This point does not move even if the user moves a scrollbar from within the browser.
        pageX:event.pageX,      pageY:event.pageY, //Relative to the top left of the fully rendered content area in the browser.
        screenX:event.screenX,  screenY:event.screenY, //Relative to the top left of the physical screen/monitor
        altKey:event.altKey,    //on mac, the option key.
        ctrlKey:event.ctrlKey,
        metaKey:event.metaKey, //on WindowsOS, the windows key, on Mac, the Command key.
        shiftKey:event.shiftKey,
        tagName:subject_elt.tagName}
    //set clicked_button_value
    if (subject_elt.tagName == "LI"){ //user clicked on a menu item
        if(subject_elt.hasAttribute("data-name")) { result.clicked_button_value = subject_elt.getAttribute("data-name") }
        else {result.clicked_button_value = subject_elt.innerHTML}
    }
    else if (subject_elt.tagName == "A"){
        if (subject_elt.href.endsWith("#")){
            result.clicked_button_value = subject_elt.innerHTML
        }
        else { //we've got a real url. The only thing to do with it is open a window, so
            //don't even go through the handler fn, just do it.
            var url = subject_elt.href
            var double_slash_pos = url.indexOf("//")
            url = url.substring(double_slash_pos + 2, url.length)
            var single_slash_pos =  url.indexOf("/")
            url = url.substring(single_slash_pos + 1, url.length)
            if (!url.startsWith("http")){
                url = "http://" + url
            }
            window.open(url)
            return
        }
    }
    else if (subject_elt.tagName == "INPUT") {
        if(subject_elt.name)     { result.clicked_button_value = subject_elt.name   }
        else if (subject_elt.id) { result.clicked_button_value = subject_elt.id     }
        else                     { result.clicked_button_value = subject_elt.value  } //the displayed text in the button.
        //but note that we *might* have 2 buttons with the same label but want them to have different actions
        //so check name and id first because we can give them different values even if
        //the label (value) is the same for 2 different buttons.
        //but if we WANT the action to be the same for 2 same-valued buttons, fine
        //give the buttons values but no name or id.
    }
    else if (subject_elt.name) { result.clicked_button_value = subject_elt.name }
    else if (subject_elt.id)   { result.clicked_button_value = subject_elt.id }

    var window_content_elt = SW.get_window_content_of_elt(subject_elt)
    var trim_strings_elt = window_content_elt.querySelector("input[name|='trim_strings']")
    var trim_strings = trim_strings_elt.value
    if (trim_strings == "false") { trim_strings = false}
    else {trim_strings = true}
    var inputs = window_content_elt.querySelectorAll("input") //finds all the descendents of the outer div that are "input" tags
    var window_callback_string = null
    for (var i = 0; i < inputs.length; i++){
        var inp = inputs[i]
        var in_name = inp.name
        if (!in_name) { in_name = inp.id }
        if (!in_name) { in_name = inp.value }
        var in_type      = inp.type    //text (one-liner), submit, button, radio, checkbox, etc.
        if (in_type == "radio"){
            if (inp.checked){
                result[in_name] = inp.value
            }
            else if (result[in_name] === undefined){ //first time we've seen a radio button from this group.
                //make sure is val is null instead of not setting
                //it at call because if no button was set on init,
                //and user didn't click on one, we STILL
                //want a field for it in the result (unlike most
                //stupid web programming that would pretend it didn't exist.
                //we want to see this field when debugging, etc.
                result[in_name] = null
            }
        }
        else if (in_type == "checkbox"){
            if (in_name){
                let val = inp.checked
                result[in_name] = val
            }
        }
        else if (in_type == "file") {
            let val = null
            if(inp.files.length > 0){
                let file0 = inp.files[0]
                if(file0.path) { //only bound in Electron (in DDE)
                    val = file0.path
                }
                else if(file0.name){ //bound in the browser. only has the "name" part of the path, not its directory
                  //due to security restriction. But when running in the browser. input of type file isn't
                  //much good as you'd really probably want to choose a file on Dexter, not your local
                  //file system, since you're running in the job engine.
                  //but maybe this is good for something.
                    val = file0.name
                    out("Warning: choosing files in the browser<br/>" +
                        "only gets you the file name and extension, not its directory,<br/>" +
                        "due to browser security restrictions.<br/>" +
                        "This mechanism can only get local file names, not ones from Dexter.",
                        "#e50")
                }
                else {val = null}
            }
            result[in_name] = val
        }
        else if (in_type == "submit"){}
        else if (in_type == "button"){} //button click still causes the callback to be called, but leaves window open
        else if (in_type == "hidden") { //trim_strings, window_callback_string, and for Human.show_instruction: the_job_name
            var val = inp.value
            if      (val == "false") {val = false}
            else if (val == "true")  {val = true}
            else if (val == "null")  {val = null}
            else if (is_string_a_number(val)) { val = parseFloat(val) } //for "123", returns an int
            result[in_name] = val
        }
        else if (in_type == "text"){
            if (in_name){
                var val = inp.value
                if (trim_strings) { val = val.trim() }
                result[in_name] = val
            }
        }
        else if ((in_type == "number") || (in_type == "range")){
            if (in_name){
                var val = parseFloat(inp.value.trim()) //comes in as a string. Gee why would an input of type number return a number? It would be too logical
                if (isNaN(val)) { val = null }
                result[in_name] = val
            }
        }
        else { //all the other inputs.
            if (in_name){
                var val = inp.value
                result[in_name] = val
            }
        }
    }
    var textareas = window_content_elt.querySelectorAll("textarea") //finds all the descentents of teh outer div that are "input" tags
    for (var i = 0; i < textareas.length; i++){
        var inp = textareas[i]
        var in_name = inp.name
        if (in_name){
            var val = inp.value
            if (trim_strings) { val = val.trim() }
            result[in_name] = val
            //for the below, before the user drags the lower right of the textbox, inp.style.width
            //and inp.style.height have the value of "".
            //After, its a string, suffixed with "px".
            //But I can get the real width had height as integers by inp.offsetWidth
            //even before the first drag, so just do it.
            result[in_name + "_width"]  = inp.offsetWidth - 6 //inp.style.width //usesd by app builder to get size of input and text areas being made by the user
            result[in_name + "_height"] = inp.offsetHeight - 6 //inp.style.height
        }
    }
    var selects = window_content_elt.querySelectorAll("select") //finds all the descentents of teh outer div that are "input" tags
    for (var i = 0; i < selects.length; i++){
        var inp = selects[i]
        var in_name = (inp.name ? inp.name : inp.id)
        if (in_name){
            var val = inp.value
            result[in_name] = val
        }
    }
    var combo_boxes = window_content_elt.querySelectorAll(".combo_box")  //should be a div tag a la <div class="combo_box><option>one</option><option selected="selected">two</option></div>
    for (var i = 0; i < combo_boxes.length; i++){
        let outer_cb = combo_boxes[i]
        //let inner_cb = outer_cb.children[1] //not needed but this is a INPUT tag of type "text" whose value prop is the combo box prop
        let input_elt = outer_cb.children[0]
        let val = input_elt.value //$(outer_cb).val() //inner_cb.value
        var in_name = input_elt.id //(outer_cb.name ? outer_cb.name : outer_cb.id)
        result[in_name] = val
    }
    let circles = window_content_elt.querySelectorAll("circle") //needed by 2d_slider
    for(let i = 0; i < circles.length; i++){
        let cir = circles[i]
        if(cir.id) {
            //let the_matrix = cir.transform.baseVal.getItem(0).matrix
            let x = cir.getAttribute("cx") //the_matrix.e //rect.x //no, clientLeft doesn't change when dragging the cir. // cir.clientLeft //rect.left
            let y = cir.getAttribute("cy") //the_matrix.f //rect.y //cir.clientTop  //rect.top
            let val = {cx: x, //offsetX only works when dragging the cir, not when we are moving the Z slider and still want to get x & y. result.offsetX, //parseFloat(cir.getAttribute("cx")), //returns string. can't just do cir.cx due to bad svg design
                       cy: y,//result.offsetY, //parseFloat(cir.getAttribute("cy")), //but this string is just what the cir cx and cy were ORIGNIALLY set to at creating not he dragged posoition which is in the event offsetX & Y.
                       r: parseFloat(cir.getAttribute("r")),
                       fill: cir.getAttribute("fill") //keep as a string. This is the color of the circle.
                       }
            result[cir.id] = val
        }
    }
    if (subject_elt.type == "submit"){
        result.is_submit = true  //used by Human.show_window, human_show_window_handler
        SW.sw_close(subject_elt)
    }
    else {
        result.is_submit = false
    }
    //widget_values: result,
    let callback_fn_string = result["window_callback_string"]
    let cb
    if(platform === "browser") { cb = callback_fn_string }
    else {
        cb = value_of_path(callback_fn_string)
        if (!cb) { try { cb = window.eval("(" + callback_fn_string + ")") } //probably have an anonymous fn. Evaling it without the parent wrappers errors.
                   catch(err){ dde_error("During show_window handler (callback), could not find: " + callback_fn_string) } //just ignore
        }
    }
    //cb is probably "function () ..." ie a string of a fn src code
    if (!cb) { //cb could have been a named fn such that when evaled didn't return the fn due to bad js design
        if(callback_fn_string.startsWith("function ")){
            let fn_name = function_name(callback_fn_string)
            if ((typeof(fn_name) == "string") && (fn_name.length > 0)) { cb = window.fn_name }
            else { //we've got an anonyous function source cde def
                cb = eval("(" + callback_fn_string + ")") //need extra parens are veal will error becuase JS is wrong
                if(typeof(cb) != "function"){
                    dde_error("show_window got a callback that doesn't look like a function.")
                }
            }
        }
        else {
            dde_error("In submit_window with bad format for the callback function of: " + callback_fn_string)
        }
    }
    try {   if (platform == "dde") { cb.call(null, result) }
            else { //in  browser. send to server this button click
                let mess_obj = {kind: "show_window_call_callback", callback_fn_name: cb, callback_arg: result}
                let mess = JSON.stringify(mess_obj)
                web_socket.send(mess)
            }
    }
    catch(err){
        let err_string
        if (typeof(err) == "string") { err_string = err } //weiredly this DOES happen sometimes
        else if (err.message) { err_string = err.message }
        else { err_string = err.toString() }
        dde_error("While calling the show_window handler function of<code>: " + cb.name + "</code>,<br/>" + err_string)
    }
    event.preventDefault()
    event.stopPropagation()
    if (subject_elt.oninput) { //work around bug in Chrome 51 June 8 2016 wherein when you have
        //input of type text, and using my oninput technique, the
        // upon a keystroke entering a char, the focus changes from the
        //input elt (and out of the show_window window itself back to the codemirror editor)
        //just setting the focus in this method doesn't do the trick, I have to
        //do the setTimeout below to get the focus back to the orig input elt.
        setTimeout(function(){
            if ((subject_elt) && subject_elt.ownerDocument.body.contains(subject_elt)){ //its possible that the win that the_this is in will be closed by the time this code is run.
                //happens in the case of Human.enter_instruction with immediate_do
                subject_elt.focus()
            }
        }, 10)
    }
}

//called by dex.js and app_builder.js
static set_combo_box_options(combo_box_div_elt, array_of_strings){
    let select_elt = combo_box_div_elt.children[1]
    select_elt.innerHTML = ""
    for(let item of array_of_strings){
        let option_elt = document.createElement("OPTION")
        option_elt.innerHTML = item
        select_elt.appendChild(option_elt)
    }
}


//rde.hide_window = function() { $('#jqxwindow').jqxWindow('hide') }
//called from the ui, window_title_index_or_elt can be either a window_index, window title, or elt
//in the window
static close_window(window_title_index_or_elt=SW.window_index){ //elt can be a window_index int
    if(window_title_index_or_elt === null){
        window_title_index_or_elt = SW.window_index
    }
    try {
        if ((typeof(window_title_index_or_elt) == "string") &&
            is_string_a_integer(window_title_index_or_elt)) {
            window_title_index_or_elt = parseInt(window_title_index_or_elt)
        }
        if (typeof(window_title_index_or_elt) == "string") {
            SW.close_windows_of_title(window_title_index_or_elt) //don't use "this", use SW because we may call this without its subject class
        }
        else if (typeof(window_title_index_or_elt) == "number"){ //ie a window_index
            let win = this.get_window_of_index(window_title_index_or_elt)
            SW.sw_close(win) //don't use "this", use SW because we may call this without its subject class
        }
        else if (window_title_index_or_elt instanceof HTMLElement) {
            SW.sw_close(window_title_index_or_elt) //don't use "this", use SW because we may call this without its subject class
        }
        else {
            dde_error("close_window called with invalid window_title_index_or_elt: " + window_title_index_or_elt)
        }
    }
    catch(err) { warning("DDE unable to close the window specified in: " + window_title_index_or_elt +
        "<br/>Perhaps its already closed.")
    }
}
}//close of class SW

SW.window_index = null // The window_index of the last show_window made, or null if none made
                       // This value is incremented in show_window fn, then that incremeted value is used in the window being made
                       // The first show_window made has window index of 0

//path elts separated by space, and are CSS selector expressions.
//The last one CAN BE a property name surrounded by square brackets
//value is a string of the new value of the property in the last path elt.
//a null value means remove the dom_elt or attribute specified in path_string
//ex: selector_set_in_ui("#show_window_0_id foo [value]" , "blue")
function selector_set_in_ui(path_string, value=null){
    if(window.platform == "node") { //console.log(val)
        let obj = {kind: "selector_set_in_ui_call", path_string: path_string, value: value}
        write_to_stdout("<for_server>" + JSON.stringify(obj) + "</for_server>")
    }
    else {
        if(value === -0) { value = 0 } //in some werid raoujnding situations, we get a negative zero.
                                       //and maybe this cause problems in the below setAttrubute call
                                       //so jsut to be safe. get rid of it.
                                       //Note -0 === 0, but still, here we ensure either 0 or -0 is really 0
        let path_string_elts = path_string.split(" ")
        let last_elt_str = path_string_elts[path_string_elts.length - 1]
        let path_string_references_style_attribute = false
        let path_string_references_html_attribute = false
        let path_string_references_dom_elt = false
        //exactly one of the above 3 will be set to true in the next if...else
        if((path_string_elts.length > 1) &&
           (path_string_elts[path_string_elts.length - 2] == "[style]")) {
            path_string_references_style_attribute = true
        }
        else if(last_elt_str.includes("=")) { path_string_references_dom_elt = true } // ie "[name=foo]"
        else if((last_elt_str.length < 3) ||
                (last_elt_str[0] !== "[")){
            path_string_references_dom_elt = true
        }
        else { path_string_references_html_attribute = true }
        //now path_string_references_dom_elt is true or false.
        //if its false, exactly one of path_string_references_html_attribute or
        // path_string_references_style_attribute should be true
        if(path_string_references_dom_elt){
            let dom_elt = document.querySelector(path_string)
            if((dom_elt instanceof HTMLElement) || (dom_elt instanceof SVGElement)) {
                if(value === null){
                    dom_elt.remove()
                }
                else {
                    dom_elt.outerHTML = value //replace the dom_elt
                }
            }
            else {
                dde_error("In selector_set_in_ui, path_string: " + path_string +
                          " should be a referernece to an existing dom_elt, but isn't.")
            }
        }
        else if (path_string_references_style_attribute) { //2nd to last path_string elt is "[style]"
            let path_elts_before_style = path_string_elts.slice(0, path_string_elts.length - 2)
            let dom_elt_string = path_elts_before_style.join(" ")
            let dom_elt = document.querySelector(dom_elt_string)
            let last_elt_attr_name = last_elt_str.substring(1, last_elt_str.length - 1) //strip off [ and ]
            if(value == null) {
                dom_elt.style.removeProperty(last_elt_attr_name)
            }
            else { dom_elt.style[last_elt_attr_name] = value }
        }
        else { //we're referencing an html or svg attribute, presume last_elt_str is surrounded by [] with a single attr name in it.
            let last_elt_attr_name = last_elt_str.substring(1, last_elt_str.length - 1) //strip surrounding square brackets
            let path_elts_for_dom_elt = path_string_elts.slice(0, path_string_elts.length - 1)
            let dom_elt_string = path_elts_for_dom_elt.join(" ")
            let dom_elt = document.querySelector(dom_elt_string)
            if((dom_elt instanceof HTMLElement) || (dom_elt instanceof SVGElement)){
                if(["value", "innerHTML", "innerText", "outerHTML", "outerText"].includes(last_elt_attr_name)){
                    if(value === null) { dom_elt[last_elt_attr_name] = "" }
                    else { dom_elt[last_elt_attr_name] = value }//some_input_of_type_range.setAttribute("value", "" + value)
                                              // sets the internal value of the elt, but does not update the display to it.
                                              //looks like a bug in chrome to me.
                }

                //https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML
                else if (["beforebegin", "afterbegin", "beforeend", "afterend"].includes(last_elt_attr_name)){
                   dom_elt.insertAdjacentHTML(last_elt_attr_name, value)
                }
                else {
                    if(value === null) { dom_elt.removeAttribute(last_elt_attr_name)}
                    else { dom_elt.setAttribute(last_elt_attr_name, "" + value) }
                }
            }
            else {dde_error("selector_set_in_ui passed: " + path_string +
                              " that didn't resolve to an HTML or SVG element.")
            }
        }
    }
}
 //ie we have a platform global var meaning we're runnningthis in node, not in the browser, which doesn't have module defined.
// module.exports.SW = SW //"module" not available in browser
//window.SW = SW

try { //if window is defined, we're in DDE or the browser
    window.SW = SW
    window.append_to_output = append_to_output
    window.clear_output = clear_output
    window.dde_error = dde_error
    window.warning = warning
    window.prepend_file_message_maybe = prepend_file_message_maybe
    window.out = out
    window.selector_set_in_ui = selector_set_in_ui
}
catch(e){ //else we're in the job engine
    global.SW = SW
    global.append_to_output = append_to_output
    global.clear_output = clear_output
    global.dde_error = dde_error
    global.warning = warning
    global.prepend_file_message_maybe = prepend_file_message_maybe
    global.out = out
    global.selector_set_in_ui = selector_set_in_ui
}

//global.SW = SW
//var {function_name, is_string_a_number} = require("./utils.js") //see top of file for why this is commented out