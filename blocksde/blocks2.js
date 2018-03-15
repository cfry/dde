//A block is represented as a dom div of class "block" with id block_123 (ie Root.jsdb.block_counter)
//blocks have a type hierarchy represented by jsdb new ojjects
//Each leaf jsdb objects is ALSO organized into on cagetory, another short hierachy.

// This file has dom manipulation code having to do with blocks

var block_left_triangle  = "&#9664;" //used for open delimiter for path

function is_block_left_triangle(str) {
    let block_left_triangle_icon = "◀"
     return ((str == block_left_triangle) ||
             (str == block_left_triangle_icon)
            )
}

var block_right_triangle = "&#9654;" //used for close delimiter for path

function is_block_right_triangle(str) {
    let block_right_triangle_icon = "▶"
    return ((str == block_right_triangle) ||
            (str == block_right_triangle_icon)
           )
}

function is_top_left_block(elt){
    return ((elt instanceof Node) &&
             elt.classList.contains("block-top-left")
           )
}

function dom_elt_block_type(elt){
    let bt_string = elt.dataset.blockType
    bt_string = "Root.jsdb." + bt_string
    return value_of_path(bt_string)
}


function elt_to_method(elt){
    let bt = dom_elt_block_type(elt)
    return bt.get_method()
}

function block_to_js(elt){
    let bt = dom_elt_block_type(elt)
    let src = bt.to_js(elt)
    return src
}

//only 1 block can be selected
function selected_block(){
    return workspace_id.querySelector(".selected_block") //might be none
}

function unselect_block(){
    let sel_block = selected_block()
    if (sel_block) { sel_block.classList.remove("selected_block") }
}

function select_block(event){
    event.stopPropagation()
    let elt = closest_ancestor_of_class(event.target, "block") //event.target might be a block_name for instance
    if (elt.classList.contains("block")) {
        unselect_block()
        elt.classList.add("selected_block")
    }
    else {} //don't select things that aren't blocks. maybe a param got passed or something
}


//______resizer_______
var drag_start_client_x
var drag_start_client_x
var old_client_x
var old_client_y
//var resizes= [] //just for testing of resizer_drag_handler

function make_resizer_elt(){
    return make_dom_elt("div",
                       {class:"resizer",
                        title: "Click to toggle collapse/expand.\nDrag to resize.",
                        draggable:"true",
                        ondragstart:"resizer_dragstart_handler(event)",
                        ondrag:"resizer_drag_handler(event)",
                        ondragend:"resizer_dragend_handler(event)",
                        ondrop:"resizer_drop_handler(event)",
                        onclick:"resizer_onclick(event)"})
}

function resizer_dragstart_handler(event){
    event.stopPropagation()
    drag_start_client_x = event.clientX
    drag_start_client_x = event.clientY
    old_client_x = event.clientX
    old_client_y = event.clientY
}

function ancestors_of_class_block_and_block_always_relative(elt){
    let result = []
    while(true) {
        if (elt == null) { break }
        else if(elt.classList &&
                (elt.classList.contains("block") ||
                 elt.classList.contains("block_always_relative"))) {
                 result.push(elt)
        }
        elt = elt.parentNode
    }
    return result
}

function resizer_drag_handler(event){
    event.stopPropagation()
    event.preventDefault()
    if (event.buttons == 0) { //user has let up on the mouse so no longer dragging.
        //due to a chrome bug resizer_drag_handler will still be called a few times
        //after user lets up on the mouse.
        //the biggest problem is that the values I compute for the new width and height
        //are wrong when the mouse is up. (not sure quite why but
        //apparently due to bl.clientWidth being wrong or something.
        //in any case, stop attempting to resize the block when the mouse
        //is up to avoid setting to the wrong bl.style.width and height
        return
    }
    let deltax = event.clientX - old_client_x
    let deltay = event.clientY - old_client_y
    old_client_x = event.clientX
    old_client_y = event.clientY
    let resizer_elt = event.target
    let always_rel_elt = closest_ancestor_of_class(resizer_elt, "block_always_relative")
    let block_args_elt = dom_elt_child_of_class(always_rel_elt, "block_args")
    let block_elt = closest_ancestor_of_class(resizer_elt, "block")
    if ((block_elt.clientHeight + deltay) < 30) {
          //be + d = 35
          //d = 35 - be
        deltay = 30 - block_elt.clientHeight //limits the height of a block to b no less than 30
    }
   /*let block_name_elt = dom_elt_child_of_class(always_rel_elt, "block_name")
    if (block_elt.clientHeight < 40) {//so block name and args can all be on the same line.
        block_name_elt.style.display = "inline-block"
        block_args_elt.style.display = "inline-block"
    }
    else {
        block_name_elt.style.display = "inline-block"
        block_args_elt.style.display = "inline-block"
    }*/
    //this code is so that when we have the args mostly vertical,
    //we already have an indent for the arg name.
    //but when the block is so narrow that we have the arg name
    //on top of (not to the left of) the arg val,
    //then we want to indent the arg val also, not have it flush left to block border.
   /* for (let name_val_elt of block_args_elt.children){
        if (name_val_elt.classList.contains("arg_name_val")){
            let val_elt = dom_elt_child_of_class(name_val_elt, "arg_val")
            if(val_elt) {
                if(block_elt.clientHeight < 100) { val_elt.style["margin-left"] = "0px" }
                else  { val_elt.style["margin-left"] = "10px" }
            }
        }
    }*/
    let elts_to_resize = ancestors_of_class_block_and_block_always_relative(always_rel_elt) //will include the immediate
       // parent of block_always_relative and its par, a block_elt
       //as well as all similar classes block ancestors
    for (bl of elts_to_resize){
        let wid = (bl.clientWidth  + deltax) + "px"
        let hei = (bl.clientHeight + deltay) + "px"
        bl.style.width  = wid
        bl.style.height = hei
    }
}
function resizer_drop_handler(event){
    event.stopPropagation()
    event.preventDefault()
    let dropped_on_elt = event.target
}
function resizer_dragend_handler(event){
    event.stopPropagation()
    event.preventDefault()
    let resizer_elt = event.target
    let block_elt   = resizer_elt.parentNode
}


//this only resizes the block in question, not its container and on out.
//if it did resize container and on out, *maybe* that would be a good thing
//or maybe resize on in, or maybe both.
function resizer_onclick(event){
    event.stopPropagation() //we don't want this misinterpreted as a select of the block
    let resizer_elt = event.target
    /*let always_rel = closest_ancestor_of_class(resi, "block_always_relative")
    always_rel.style.width  = "auto"
    always_rel.style.height = "auto"
    let block_elt = closest_ancestor_of_class(resi, "block")
    block_elt.style.width  = "auto"
    block_elt.style.height = "auto"*/
    let always_rel = closest_ancestor_of_class(resizer_elt, "block_always_relative")
    let block_elt  = closest_ancestor_of_class(always_rel, "block")
    let block_args = dom_elt_child_of_class(always_rel, "block_args")
    if (block_args.style.display == "none") {
        block_args.style.display = "inline-block"
    }
    else {
        block_args.style.display = "none"
        always_rel.style.width   = "auto"
        always_rel.style.height  = "auto"
        block_elt.style.width    = "auto"
        block_elt.style.height   = "auto"
    }
}

function unfold_all_blocks(){
    let blks = document.querySelectorAll(".block")
    for(let blk of blks){
        blk.style.width  = "auto"
        blk.style.height = "auto"
    }
}
//_______End resizer_______

function install_block_drop_zones(block_that_is_being_dragged){
    for(let a_class of [".top-left-spacer", ".bottom-left-spacer",
                        ".arg_val", ".block_args_delimiter", ".comma"]){
        for (let elt of workspace_id.querySelectorAll(a_class)){
            //if (elt.closest(".block") != block_that_is_being_dragged) {
            if (!is_dom_elt_ancestor(elt, block_that_is_being_dragged) &&
                !["INPUT", "SELECT"].includes(elt.tagName)) {
                elt.classList.add("block-drop-zone")
            }
        }
    }
}

function uninstall_block_drop_zones(){
    for (let elt of workspace_id.querySelectorAll(".block-drop-zone")){
        elt.classList.remove("block-drop-zone")
    }
}


//see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
//http://apress.jensimmons.com/v5/pro-html5-programming/ch9.html more conceptual
function block_dragstart_handler(event){
    let elt = event.target //the dom elt being dragged, this will be a block
    /*if(elt.style.position == "static") {
        elt.style.position = "absolute"
        elt.style.left     = "auto"
        elt.style.top      = "auto"
    }*/
    //out("starting to drag: " + elt.classList)
    //event.effectAllowed = "move" doesn't seem to help
    event.dataTransfer.setData("text", elt.id);
    //event.dropEffect = "move"; //changes cursor into 4 arrows which makes it hard to click on the tiny expand/collapse squares
    Workspace.inst.start_drag_client_x  = event.clientX //needed to place block on drag end.
    Workspace.inst.start_drag_client_y  = event.clientY
    install_block_drop_zones(elt)
    //workspace_id.onmousemove = block_on_mouse_move
}

var block_being_dragged = null //used only by Workspace.toolkit_bar_mouseover to work around
//problem of dropping elt on toolbar to delete it then
//the mouse coursor is also over toolbar.

/*function block_drag_handler(event) {
    let elt = event.target //dom elt being dragged
    block_being_dragged = elt
    console.log("block_drag_handler clientx: " + event.clientX)
    let delta_x = event.clientX - Workspace.inst.start_drag_client_x
    let new_x = elt.offsetLeft + delta_x
    if (new_x < 0) {
        toolkit_bar_id.style["background-color"] = "red"
        //elt.style["background-color"] = "red"
        //console.log("in drag less than 0")
    }
    else {
        toolkit_bar_id.style["background-color"] = "#DDDDDD"
    }
    //console.log("Drag " +  event.movementX); always 0
}*/

// see toolkit_bar_mouseover(event) for related
function block_drag_handler(event) {
    block_being_dragged = event.target //dom elt being dragged
    //console.log("block_drag_handler clientx: " + event.clientX)
    if (event.clientX < 32) { //width of vertical toolbar
        toolkit_bar_id.style["background-color"] = "red"
    }
    else {
        toolkit_bar_id.style["background-color"] = "#DDDDDD"
    }
}

function block_dragover_handler(event) {
    event.preventDefault();
    //event.dataTransfer.dropEffect = "move"
}

function block_drop_handler(event){
    block_being_dragged = null //global on purpose
    uninstall_block_drop_zones()
    remove_drop_target_class()
    let dropped_on_elt = event.target //the dom elt that the dragged elt has just been dropped on
    if (dropped_on_elt.classList.contains("block_always_relative")) {
        dropped_on_elt = closest_ancestor_of_class(dropped_on_elt, "block")
    }
    else if (dropped_on_elt.classList.contains("block_args")) {
        dropped_on_elt = closest_ancestor_of_class(dropped_on_elt, "block")
    }
    event.preventDefault();
    // Get the id of the target and add the moved element to the target's DOM
    let id_of_block = event.dataTransfer.getData("text");
    let dragged_block_elt = document.getElementById(id_of_block) //block being dragged
    let orig_arg_name_val =  closest_ancestor_of_class(dragged_block_elt, "arg_name_val")
    let dragged_from_block = null
    debugger
    if (orig_arg_name_val) {
        dragged_from_block = closest_ancestor_of_class(orig_arg_name_val, "block")
    }
    /* not used. See toolkit_bar_mouseover for handling the drop on the toolbar to delete the dragged block
     let delta_x = event.clientX - Workspace.inst.start_drag_client_x
    let delta_y = event.clientY - Workspace.inst.start_drag_client_y
    let new_x = dragged_block_elt.offsetLeft + delta_x
    let new_y = dragged_block_elt.offsetTop  + delta_y
    //remove_block_enclosing_arg_name_val(dragged_block_elt) //can't do this in drag_start because then block isn't visible while dragging
    if (new_x < 0) { //delete this block
        remove_dom_elt(dragged_block_elt);
        toolkit_bar_id.style["background-color"] = "#DDDDDD"
        clean_up_top_lefts()
    }
    else*/
    if (dropped_on_elt.classList.contains("top-left-spacer") ||
        dropped_on_elt.classList.contains("bottom-left-spacer")){
        //workspace_id.insertBefore(make_top_left_spacer(), dropped_on_elt) /let clean_up_top_left do this
        dragged_block_elt.classList.remove("block-absolute") //replace not supported on Chrome
        dragged_block_elt.classList.add("block-top-left")
        dragged_block_elt.style.position = "static" //removing block-absolute and installing block-top-left doesnt do it
        dragged_block_elt.style.left="auto"
        dragged_block_elt.style.top="auto"
        workspace_id.insertBefore(dragged_block_elt, dropped_on_elt)
    }
    else if (dropped_on_elt.classList.contains("arg_val")){ //we're replacing the arg of a block with the dragged block
        dragged_block_elt.classList.remove("block-absolute")
        //if(dragged_block_elt.classList.contains("block-top-left")){
        //    dragged_block_elt.classList.remove("block-top-left")
        //    clean_up_top_lefts()
        //}
        dragged_block_elt.classList.add("arg_val")
        dragged_block_elt.style.left = "auto"
        dragged_block_elt.style.top  = "auto"
        let dropped_on_block   = closest_ancestor_of_class(dropped_on_elt, "block")
        replace_dom_elt(dropped_on_block, dragged_block_elt)
    }
    else if (dropped_on_elt.classList.contains("block_args_delimiter")){
        let dropped_on_block      = closest_ancestor_of_class(dropped_on_elt, "block")
        let dropped_on_block_block_type_string = dropped_on_block.dataset.blockType
        let dropped_on_always_rel = dom_elt_child_of_class(dropped_on_block, "block_always_relative")
        let dropped_on_block_args = dom_elt_child_of_class(dropped_on_always_rel, "block_args")
        dragged_block_elt.classList.remove("block-absolute")
        //if(dragged_block_elt.classList.contains("block-top-left")){
        //    dragged_block_elt.classList.remove("block-top-left")
        //    clean_up_top_lefts()
        //}
        dragged_block_elt.style.position = "static"
        let arg_name_vals    = dom_elt_children_of_class(dropped_on_block_args, "arg_name_val")
        if (dropped_on_elt.classList.contains("open")){
            let open_delimiter  = dropped_on_elt.innerText
            debugger
            if (dropped_on_block_block_type_string.startsWith("infix")){
                let old_sel_elt = dom_elt_child_of_class(dropped_on_block_args, "operators")
                let new_sel_elt = old_sel_elt.cloneNode(true)
                insert_elt_before(new_sel_elt, dropped_on_block_args.firstChild)
                let arg_name_elt = make_dom_elt("span", {class: "arg_name"}, "")
                let new_arg_name_val = make_arg_name_val(arg_name_elt, dragged_block_elt)
                insert_elt_before(new_arg_name_val, dropped_on_block_args.firstChild)
            }
            else {
                let arg_name_elt     = arg_name_for_open_delimiter_drop(dropped_on_block, dropped_on_block_args, dropped_on_elt)
                let is_lit_obj       = open_delimiter == "{"
                let suffix_char = ((arg_name_vals.length > 0) ? "," : "")
                let new_arg_name_val = make_arg_name_val(arg_name_elt, dragged_block_elt, suffix_char, is_lit_obj, (is_lit_obj ? ":" : ""))
                insert_elt_before(new_arg_name_val, dropped_on_block_args.firstChild)
            }
        }
        else if (dropped_on_elt.classList.contains("close")){
            let arg_name_elt     = arg_name_for_close_delimiter_drop(dropped_on_block, dropped_on_block_args, dropped_on_elt)
            let close_delimiter  = dropped_on_elt.innerText
            if (dropped_on_block_block_type_string.startsWith("infix")){
                let old_sel_elt = dom_elt_child_of_class(dropped_on_block_args, "operators")
                let new_sel_elt = old_sel_elt.cloneNode(true)
                let close_paren_elt = dom_elt_child_of_class(dropped_on_block_args, "close")
                insert_elt_before(new_sel_elt, close_paren_elt)
                let arg_name_elt = make_dom_elt("span", {class: "arg_name"}, "")
                let new_arg_name_val = make_arg_name_val(arg_name_elt, dragged_block_elt)
                insert_elt_before(new_arg_name_val, close_paren_elt)
            }
            else{
                let is_lit_obj       = close_delimiter == "}"
                let new_arg_name_val = make_arg_name_val(arg_name_elt, dragged_block_elt, "", is_lit_obj, (is_lit_obj ? ":" : ""))
                if(arg_name_vals.length > 0){ //if there's only 1, don't insert a comma
                    let last_orig_name_val_elt = last(arg_name_vals)
                    let suffix_char = ((is_block_right_triangle(close_delimiter)) ? "." : ",")
                    last_orig_name_val_elt.appendChild(make_comma_drop_zone(suffix_char))
                }
                //dropped_on_block_args.appendChild(new_arg_name_val)
                insert_elt_before(new_arg_name_val, dropped_on_elt)
            }
        }
        clean_up_arg_names(dropped_on_block)
    }
    else if (dropped_on_elt.classList.contains("comma")){ //if present, it means there's already at least two args,
        //and the new arg will not be the first or last of the args after it is inserted just after the comma.
        let old_arg_name_val      = dropped_on_elt.parentNode
        let dropped_on_block_args = old_arg_name_val.parentNode
        let dropped_on_block = closest_ancestor_of_class(dropped_on_block_args, "block")
        let close_elt = dom_elt_child_of_class(dropped_on_block_args, "close")
        let close_delimiter = close_elt.innerText
        let is_lit_obj = close_delimiter == "}"
        dragged_block_elt.classList.remove("block-absolute")
        //if(dragged_block_elt.classList.contains("block-top-left")){
        //    dragged_block_elt.classList.remove("block-top-left")
        //    clean_up_top_lefts()
        //}
        let arg_name_str
        let name_val_sep_char
        let suffix_char
        if (is_block_right_triangle(close_delimiter))  {
            arg_name_str = ""
            name_val_sep_char = ""
            suffix_char = "."

        }
        else if(is_lit_obj) {
            arg_name_str = ""
            name_val_sep_char = ":"
            suffix_char = ","
        }
        else {
            arg_name_str = "0"
            name_val_sep_char = ""
            suffix_char = ","
        }
        let new_arg_name_val = make_arg_name_val(arg_name_str, dragged_block_elt, suffix_char, is_lit_obj,
                                                 name_val_sep_char)
        insert_elt_after(new_arg_name_val, old_arg_name_val)
        clean_up_arg_names(dropped_on_block)
    }
    else if (dropped_on_elt == workspace_id){ //dropped_on_elt is workspace_id
        //if(dragged_block_elt.classList.contains("block-top-left")){
        //    dragged_block_elt.classList.remove("block-top-left")
        //    clean_up_top_lefts()
        //}
        dragged_block_elt.classList.remove("arg_val")
        dragged_block_elt.classList.add("block-absolute")
        dragged_block_elt.style.position = "absolute" //note that setting its class to block-absolute SHOULD set its postion to "absolute" but it doesn't.
        dragged_block_elt.style.left = event.offsetX + "px" //event.clientX + "px" //new_x + "px" // event.offsetX + "px"
        dragged_block_elt.style.top  = event.offsetY + "px" //event.clientX + "px" new_y + "px" //event.offsetY + "px"
        workspace_id.appendChild(dragged_block_elt) //causes dragged_block_elt to be removed from orig_arg_name_val, if any
    }
    else {
        shouldnt("in block_drop_handler got invalid dropped_on_elt of: " + dropped_on_elt)
    }
    let new_arg_name_val =  closest_ancestor_of_class(dragged_block_elt, "arg_name_val")
    if (orig_arg_name_val && (orig_arg_name_val != new_arg_name_val)) {
        //let dropped_on_block = closest_ancestor_of_class(orig_arg_name_val, "block")
        remove_dom_elt(orig_arg_name_val)
        //clean_up_arg_names(dropped_on_block)
    }
    if(dragged_from_block) { clean_up_arg_names(dragged_from_block) }
    clean_up_top_lefts() //doesn't need to be done EVERY time, but
    //hard to figure out when, including when we drag a block away from the top left.
}

function enter_drop_target(event){
    let drop_target_elt = event.target //the dropzone elt
    drop_target_elt.classList.add("drop_target")
}

function leave_drop_target(event){
    let drop_target_elt = event.target //the dropzone elt
    drop_target_elt.classList.remove("drop_target")
}

function remove_drop_target_class(){
    let elt = workspace_id.querySelector(".drop_target")
    if (elt) { elt.classList.remove("drop_target") }
}

function make_top_left_spacer(){
    return make_dom_elt("div",
                        {class:"top-left-spacer",
                         display: "block",
                         width: Workspace.suck_left_margin + "px",
                         height: "15px",
                         ondragenter:"enter_drop_target(event)",
                         ondragleave:"leave_drop_target(event)",
                         },
                        "&nbsp")
}

function make_bottom_left_spacer(){
    return make_dom_elt("div",
                        {class:"bottom-left-spacer",
                        width: Workspace.suck_left_margin + "px",
                        height: "100px",
                        ondragenter:"enter_drop_target(event)",
                        ondragleave:"leave_drop_target(event)",
                        },
                        "&nbsp")

}

function make_delimiter_drop_zone(delim){
    debugger
    let open_or_close
    if      (is_block_left_triangle(delim))     { open_or_close = "open" }
    else if (is_block_right_triangle(delim))    { open_or_close = "close" }
    else if ("([{".includes(delim)) { open_or_close = "open" }
    else                            { open_or_close = "close" }
    return make_dom_elt("span",
                        {class: "block_args_delimiter " + open_or_close,
                         ondragenter: "enter_drop_target(event)",
                         ondragleave: "leave_drop_target(event)"},
                         delim)
}

//between args of a block. Dropping on it inserts a block at that location
// (and a new comma drop zone!)
function make_comma_drop_zone(char = ","){ //also used for dot dropzone in a path
    return make_dom_elt("span",
                       {class: "comma",
                        ondragenter:"enter_drop_target(event)",
                        ondragleave:"leave_drop_target(event)"
                       },
                       char + " ")
}

//if param_name is null, its not editable and has no visual representation,
//such as when we have a literal boolean, number, string block
function make_arg_name_val(param_name="", arg_val_elt, suffix_char="", name_is_editable_string=false, between_name_and_value=""){
   arg_val_elt.classList.remove("block-absolute")
   arg_val_elt.classList.add("arg_val")
   let arg_name_elt = param_name //assume its already an elt, but ...
   if (typeof(param_name) == "string") {
        if(name_is_editable_string){ //we're adding a prop to a literal obj.
            //let newobj = newObject({prototype: Root.jsdb.literal.string, value: param_name})
            arg_name_elt = Root.jsdb.literal.string.make_dom_elt(undefined, undefined, param_name)
            arg_name_elt.classList.add("arg_name")
            arg_name_elt.classList.remove("block-absolute")
        }
        else { arg_name_elt = make_dom_elt("span",
                                           {class:"arg_name", "vertical-align":"top"},
                                           param_name)
              if (param_name == "") {
                  arg_name_elt.style.padding = "0px"
                  arg_name_elt.style.margin  = "0px"
              }
        }
   }
   else if (param_name === null){
        arg_name_elt = make_dom_elt("span",
            {class: "arg_name",
             "vertical-align": "top",
             padding: "0px",
             margin:  "0px"
            },
            "")
        arg_val_elt.style["left-margin"] = "Opx"
        arg_val_elt.style["left-padding"] = "Opx"
    }
    arg_val_elt.style.left = "auto"
    arg_val_elt.style.top  = "auto"
   let content = [arg_name_elt]
   if(between_name_and_value.length > 0) { content.push(make_dom_elt("span", {}, between_name_and_value)) }
   content.push(arg_val_elt)
   if(suffix_char != "") { content.push(make_comma_drop_zone(suffix_char)) }
   return make_dom_elt("div", //was label
                      {class:"arg_name_val"},
                      content)
}

function arg_name_for_open_delimiter_drop(dropped_on_block, dropped_on_block_args, dropped_on_elt){
   let open_delim_string = dropped_on_elt.innerText
   if (open_delim_string == "[") { return "0" }
   else if (open_delim_string == "{") { //let's user type in a string for the lit prop name
       let result = Root.jsdb.literal.string.make_dom_elt()
       result.classList.remove("block-absolute")
       result.classList.add("arg_name")
       return result
   }
   else if (open_delim_string == "(") { return "arg0" } //needs work
   else if (is_block_left_triangle(open_delim_string)) { return "" }
   else { shouldnt("arg_name_for_open_delimiter_drop passed dropped_on_elt delim of: " + open_delim_string) }
}

function arg_name_for_close_delimiter_drop(dropped_on_block, dropped_on_block_args, dropped_on_elt){
    debugger
    let close_delim_string = dropped_on_elt.innerText
    if (close_delim_string == ")") {
        let kids = dom_elt_children_of_class(dropped_on_block_args, "arg_name_val")
        return "arg" + kids.length //todo needs work to make an edit string block
    }
    else if (close_delim_string == "]") {
        let kids = dom_elt_children_of_class(dropped_on_block_args, "arg_name_val")
        return (kids.length).toString()
    }
    else if (close_delim_string == "}") { //let's user type in a string for the lit prop name
        let result = Root.jsdb.literal.string.make_dom_elt()
        result.classList.remove("block-absolute")
        result.classList.add("arg_name")
        return result
    }
    else if (is_block_right_triangle(close_delim_string))  { return "" }
    else { shouldnt("arg_name_for_close_delimiter_drop passed dropped_on_elt delim of: " + close_delim_string) }
}

function remove_block_enclosing_arg_name_val(block_elt){
   let surrounding_arg_name_val = closest_ancestor_of_class(block_elt, "arg_name_val")
   if (surrounding_arg_name_val) { remove_dom_elt(surrounding_arg_name_val) }
}

function clean_up_arg_names(block_elt){
    let block_type_string = block_elt.dataset.blockType  //crap syntax for working around the hyphen
    let always_rel        = dom_elt_child_of_class(block_elt, "block_always_relative")
    let block_args_elt    = dom_elt_child_of_class(always_rel, "block_args")
    let arg_name_vals     = dom_elt_children_of_class(block_args_elt, "arg_name_val")

    if(block_type_string.startsWith("method.")){
        let block_type = dom_elt_block_type(block_elt)
        let params = block_type.params
        let param_keys = Object.keys(params)
        for(let i = 0; i < arg_name_vals.length; i++){
           let arg_name_val = arg_name_vals[i]
           let arg_name_elt = dom_elt_child_of_class(arg_name_val, "arg_name")
           let param_name
           if(i < param_keys.length){  param_name = param_keys[i] }
           else { param_name = "Xarg" + i }
           arg_name_elt.innerText = param_name
           if (i == (arg_name_vals.length - 1)) { //on last one, make srue it doesn't have a comma
               debugger
               let comma_on_last = dom_elt_child_of_class(arg_name_val, "comma")
               if (comma_on_last){ remove_dom_elt(comma_on_last) }
           }
        }
    }
    else if(block_type_string.startsWith("infix")){
        let children = block_args_elt.children
        let prev_elt = null
        debugger
        for(let i = 0; i <  children.length; i++){ //remove 2 select elts in  a row as this occurs
                                                   //when you drag a value out to remove it
           let child = children[i]
           if(prev_elt &&
              prev_elt.classList.contains("operators") &&
              child.classList.contains("operators")){
              remove_dom_elt(child)
           }
            prev_elt = child
        }
    }
    else if (block_type_string.startsWith("literal.array")){
      for(let i = 0; i <  arg_name_vals.length; i++){
          let arg_name_val = arg_name_vals[i]
          let arg_name = dom_elt_child_of_class(arg_name_val, "arg_name")
          arg_name.innerText = (i).toString()
          let bar = "foo"
      }
    }
    else if (block_type_string == "literal.object"){ //nothing  to do here
     //but maybe check for duplicates?
    }
    else if (block_type_string == "path"){ //nothing to do here
    }
    else {
        shouldnt("clean_up_arg_names got invalid data-block-type of: " + block_type_string)
    }
    //comma elt's are children of arg_name_val elts. But they should never be in the LAST one
    //so this removes the comma if its there.
    let last_anv = last(arg_name_vals)
    let comma_elt = dom_elt_child_of_class(last_anv, "comma") //this could also be a "dot" for paths
    if (comma_elt) { remove_dom_elt(comma_elt) }
}

//ensure that every block has exactly 1 spacer above it.
//format: top_left_spacer, block_top_left, top_left_spacer, block_top_left, ... bottom-left-spacer
function clean_up_top_lefts(){
    let ws_kids = Array.from(workspace_id.children) // copy the kids list
    let top_left_spacer_since_last_block = false
    for(let elt_in_ws of ws_kids) {
        if(elt_in_ws.classList.contains("top-left-spacer")) {
            if (top_left_spacer_since_last_block) { remove_dom_elt(elt_in_ws) } //2 spacers in a row
            top_left_spacer_since_last_block = true
        }
        else if(elt_in_ws.classList.contains("bottom-left-spacer")){ //might be out of order, alawys remove hten always add at end
            remove_dom_elt(elt_in_ws)
        }
        else if(elt_in_ws.classList.contains("block-top-left")){
            if (!top_left_spacer_since_last_block){
               workspace_id.insertBefore(make_top_left_spacer(), elt_in_ws)
            }
            top_left_spacer_since_last_block = false
        }
    }
    workspace_id.appendChild(make_bottom_left_spacer())
}
