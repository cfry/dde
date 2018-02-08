//A block is represented as a dom div of class "block" with id block_123 (ie Root.jsdb.block_counter)
//blocks have a type hierarchy represented by jsdb new ojjects
//Each leaf jsdb objects is ALSO organized into on cagetory, annother short hierachy.

// This file has dom manipulation code having to do with blocks

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

function toggle_expand_collapse(event){
    debugger
    event.stopPropagation()
    let block_elt = event.target.parentNode.parentNode
    let block_args_elt = dom_elt_child_of_class(block_elt, "block_args")
    if (is_block_collapsed(block_elt)) {
         block_args_elt.classList.remove("block_args_collapsed")
         if (is_block_horizontal(block_elt)) { block_args_elt.classList.add("block_args_horiz") }
         else { block_args_elt.classList.add("block_args_vert") }
    }
    else {
        block_args_elt.classList.remove("block_args_horiz")
        block_args_elt.classList.remove("block_args_vert")
        block_args_elt.classList.add("block_args_collapsed")
    }
    //if(block_args_elt.style.display == "none") { block_args_elt.style.display = "inline" }
    //else                                       { block_args_elt.style.display = "none" }
}

function is_block_collapsed(block_elt){
    let block_args_elt = dom_elt_child_of_class(block_elt, "block_args")
    return block_args_elt.classList.contains("block_args_collapsed") //(block_args_elt.style.display == "none")
}

//even if a block is collapsed, its args are still either configured for horiz or vert.
//(if no args, just call it "horiz".
function is_block_horizontal(block_elt){
    let block_args_elt   = dom_elt_child_of_class(block_elt, "block_args")
    if(block_args_elt.classList.contains("block_args_horiz")) { return true }
    else if(block_args_elt.classList.contains("block_args_vert")) { return false }
    else { //its collapsed, and should have "block_args_collapsed" class
       let first_name_val_arg =  block_args_elt.firstChild
       if (first_name_val_arg) { return first_name_val_arg.classList.contains("arg_name_val_horiz") }
       else { //no args so default to horiz
          return true
       }
    }
    //let arg_name_val_elt = dom_elt_child_of_class(block_args_elt, "arg_name_val")
    //if (!arg_name_val_elt) { return true } //since "horiz" is the default, just assume its true.
    //else return arg_name_val_elt.style.display == "inline" //its "block" if its vertical.
}

/*function toggle_horiz_vert(event){
    event.stopPropagation()
    debugger
    let block_elt = event.target.parentNode.parentNode
    let block_args_elt = dom_elt_child_of_class(block_elt, "block_args")
    if(block_args_elt.style.display == "none") { //block is collapsed
        block_args_elt.style.display = "inline" //expand block into horiz
    } //might as well expand it
    if(block_args_elt.style.display == "inline"){ //now horiz, change to vert
        block_args_elt.style.display = "block"
        for(let arg_name_val_elt of block_args_elt.children){
            if(arg_name_val_elt.classList.contains("arg_name_val")) { //filter out commas
                arg_name_val_elt.style.display     = "block"
                arg_name_val_elt.style.marginLeft  = "10px"
                arg_name_val_elt.style.marginRight = "0px"

                let arg_name_elt = dom_elt_child_of_class(arg_name_val_elt, "arg_name")
                arg_name_elt.style.display = "inline"
            }
        }
    }
    else {//now vert, change to horiz
        block_args_elt.style.display     = "inline"
        block_args_elt.style.marginLeft  = "0px"
        block_args_elt.style.marginRight = "10px"
        for(let arg_name_val_elt of block_args_elt.children){
            if(arg_name_val_elt.classList.contains("arg_name_val")) { //filter out commas
                arg_name_val_elt.style.display     = "inline"
                arg_name_val_elt.style.marginLeft  = "0px"
                arg_name_val_elt.style.marginRight = "0px"
                let arg_name_elt = dom_elt_child_of_class(arg_name_val_elt, "arg_name")
                arg_name_elt.style.display = "none" //hide the names in horiz view
                let arg_val_elt = dom_elt_child_of_class(arg_name_val_elt, "arg_val")
                arg_val_elt.style.marginLeft  = "0px"
                arg_val_elt.style.marginRight = "0px"
            }
        }
    }
}*/

function toggle_horiz_vert(event){
    event.stopPropagation()
    debugger
    let block_elt = event.target.parentNode.parentNode
    if(is_block_horizontal(block_elt)){ //now horiz, change to vert
        make_block_vert(block_elt)
    }
    else {//now vert, change to horiz
        make_block_horiz(block_elt)
    }
}

function make_block_horiz(block_elt){
    let block_args_elt = dom_elt_child_of_class(block_elt, "block_args")
    block_args_elt.classList.remove("block_args_collapsed")
    block_args_elt.classList.remove("block_args_vert")
    block_args_elt.classList.add("block_args_horiz")
    for(let arg_name_val_elt of block_args_elt.children){
        if(arg_name_val_elt.classList.contains("arg_name_val")) { //filter out commas
            arg_name_val_elt.classList.remove("arg_name_val_vert")
            arg_name_val_elt.classList.add("arg_name_val_horiz")

            let arg_name_elt = dom_elt_child_of_class(arg_name_val_elt, "arg_name")
            arg_name_elt.style.display = "none" //hide the names in horiz view
            //do I really need the below?
            let arg_val_elt = dom_elt_child_of_class(arg_name_val_elt, "arg_val")
            arg_val_elt.style.marginLeft  = "0px"
            arg_val_elt.style.marginRight = "0px"
        }
    }
}

function make_block_vert(block_elt){
    let block_args_elt = dom_elt_child_of_class(block_elt, "block_args")
    block_args_elt.classList.remove("block_args_collapsed")
    block_args_elt.classList.remove("block_args_horiz")
    block_args_elt.classList.add("block_args_vert")
    for(let arg_name_val_elt of block_args_elt.children){
        if(arg_name_val_elt.classList.contains("arg_name_val")) { //filter out commas
            arg_name_val_elt.classList.remove("arg_name_val_horiz")
            arg_name_val_elt.classList.add("arg_name_val_vert")

            let arg_name_elt = dom_elt_child_of_class(arg_name_val_elt, "arg_name")
            arg_name_elt.style.display = "inline"
        }
    }
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
    let elt = event.target
    if (elt.classList.contains("block")) {
        let prev_sel_block = selected_block()
        if (prev_sel_block) { prev_sel_block.classList.remove("selected_block") }
        elt.classList.add("selected_block")
    }
    else {} //don't select things that aren't blocks. maybe a param got passed or something
}

function block_to_js(elt){
    let bt = dom_elt_block_type(elt)
    let src = bt.to_js(elt)
    return src
}

function install_block_drop_zones(block_that_is_being_dragged){
    for(let a_class of [".top-left-spacer", ".bottom-left-spacer",
                        ".arg_val", ".array_object_delimiter", ".comma"]){
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
    let elt = event.target //the dom elt being dragged
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

function block_drag_handler(event) {
    let elt = event.target //dom elt being dragged
    block_being_dragged = elt
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
}

function block_dragover_handler(event) {
    event.preventDefault();
    //event.dataTransfer.dropEffect = "move"
}

/*function block_drop_handler(event) {
    uninstall_block_drop_zones()
    let dropped_on_elt = event.target //the dom elt that the dragged elt has just been dropped on
    debugger
    console.log("drop client x" + event.clientX)
    remove_drop_target_class()
    event.preventDefault();
    // Get the id of the target and add the moved element to the target's DOM
    let id_of_block = event.dataTransfer.getData("text");
    out(id_of_block)
    let elt = document.getElementById(id_of_block) //block being dragged
    let delta_x = event.clientX - Workspace.inst.start_drag_client_x
    let delta_y = event.clientY - Workspace.inst.start_drag_client_y
    let new_x = elt.offsetLeft + delta_x
    let new_y = elt.offsetTop  + delta_y
    if (new_x < 0) { //delete this block
        remove_dom_elt(elt);
        toolkit_bar_id.style["background-color"] = "#DDDDDD"
        clean_up_top_lefts()
        return
    }
    else if (new_x < Workspace.suck_left_margin) {
       reposition_top_left_block(elt, new_y)
    }
    else { //not a top_left block
        elt.classList.remove("block-top-left")
        elt.classList.add("block-absolute")
        elt.style.left = new_x + "px"
        elt.style.top  = new_y + "px"
    }
}*/

function block_drop_handler(event) {
    block_being_dragged = null //global on purpose
    uninstall_block_drop_zones()
    remove_drop_target_class()
    let dropped_on_elt = event.target //the dom elt that the dragged elt has just been dropped on
    debugger
    console.log("drop client x" + event.clientX)
    event.preventDefault();
    // Get the id of the target and add the moved element to the target's DOM
    let id_of_block = event.dataTransfer.getData("text");
    let dragged_elt = document.getElementById(id_of_block) //block being dragged
    let delta_x = event.clientX - Workspace.inst.start_drag_client_x
    let delta_y = event.clientY - Workspace.inst.start_drag_client_y
    let new_x = dragged_elt.offsetLeft + delta_x
    let new_y = dragged_elt.offsetTop  + delta_y
    if (new_x < 0) { //delete this block
        remove_dom_elt(dragged_elt);
        toolkit_bar_id.style["background-color"] = "#DDDDDD"
        clean_up_top_lefts()
    }
    //else if (new_x < Workspace.suck_left_margin) { reposition_top_left_block(elt, new_y)}
    else if (dropped_on_elt.classList.contains("top-left-spacer") ||
             dropped_on_elt.classList.contains("bottom-left-spacer")){
        workspace_id.insertBefore(make_top_left_spacer(), dropped_on_elt)
        dragged_elt.classList.remove("block-absolute") //replace not supported on Chrome
        dragged_elt.classList.add("block-top-left")
        workspace_id.insertBefore(dragged_elt, dropped_on_elt)
        //dragged_elt.style.left = 0 + "px" //shouldn't matter
    }
    else if (dropped_on_elt.classList.contains("arg_val")){ //we're replacing the arg of a block with the dragged block
        dragged_elt.classList.remove("block-absolute")
        dragged_elt.classList.remove("block-top-left")
        dragged_elt.classList.add("arg_val")
        replace_dom_elt(dropped_on_elt, dragged_elt)
    }
    else if (dropped_on_elt.classList.contains("array_object_delimiter")){
        let dropped_on_block = dropped_on_elt.parentNode
        let dropped_on_block_args = dom_elt_child_of_class(dropped_on_block, "block_args")
        debugger
        if (dropped_on_elt.innerText.includes("[")){
            dragged_elt.classList.remove("block-absolute")
            dragged_elt.classList.remove("block-top-left")
            if(dropped_on_block_args.children.length == 0){
                let new_arg_name_val = make_arg_name_val("0", dragged_elt)
                dropped_on_block_args.appendChild(new_arg_name_val) //new last arg
            }
            else {
               insert_elt_before(make_comma_drop_zone(), dropped_on_block_args.firstChild)
                let new_arg_name_val = make_arg_name_val("0", dragged_elt)
                insert_elt_before(new_arg_name_val, dropped_on_block_args.firstChild)
            }
        }
        else if (dropped_on_elt.innerText.includes("]")){
            dragged_elt.classList.remove("block-absolute")
            dragged_elt.classList.remove("block-top-left")
            let new_arg_name_val = make_arg_name_val("0", dragged_elt)
            dropped_on_block_args.appendChild(new_arg_name_val) //new last arg
            if(dropped_on_block_args.children.length > 1){ //if there's only 1, don't insert a comma
                insert_elt_before(make_comma_drop_zone(), new_arg_name_val)
            }
        }
        if(is_block_horizontal(dropped_on_block)){ make_block_horiz(dropped_on_block) }
        else { make_block_vert(dropped_on_block) }
    }
    else if (dropped_on_elt.classList.contains("comma")){ //if present, it means there's already at least two args
        let dropped_on_block_args = dropped_on_elt.parentNode
        let dropped_on_block = dropped_on_block_args.parentNode
        dragged_elt.classList.remove("block-absolute")
        dragged_elt.classList.remove("block-top-left")
        let new_arg_name_val = make_arg_name_val("0", dragged_elt)
        insert_elt_before(new_arg_name_val, dropped_on_elt)
        insert_elt_before(make_comma_drop_zone(), new_arg_name_val)
        if(is_block_horizontal(dropped_on_block)){ make_block_horiz(dropped_on_block) }
        else { make_block_vert(dropped_on_block) }
    }
    else { //dropped_on_elt is workspace_id
        dragged_elt.classList.remove("block-top-left")
        dragged_elt.classList.add("block-absolute")
        dragged_elt.style.left = new_x + "px" // event.offsetX + "px" //event.clientX + "px" //new_x + "px"
        dragged_elt.style.top  = new_y + "px" //event.offsetY + "px" //event.clientY + "px" //new_y + "px"
    }
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
                         width: Workspace.suck_left_margin + "px",
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

//between args of a block. Dropping on it inserts a block at that location
// (and a new comma drop zone!)
function make_comma_drop_zone(){
    return make_dom_elt("span",
                       {class: "comma",
                        ondragenter:"enter_drop_target(event)",
                        ondragleave:"leave_drop_target(event)"
                       },
                       ", ")
}

function make_arg_name_val(param_name="", a_block){
   a_block.classList.add("arg_val")
   return make_dom_elt("label",
                      {class:"arg_name_val"},
                      [make_dom_elt("span", {class:"arg_name", "vertical-align":"top"}, param_name),
                       a_block])
}

function clean_up_array_arg_names(array_block){

}

//ensure that every block has exactly 1 spacer above it.
function clean_up_top_lefts(){
    let prev_elt = null
    let ws_kids = Array.from(workspace_id.children)
    for(let elt_in_ws of ws_kids) {
        if      (elt_in_ws == elt) {} //ignore in this looping, just in case we're reposiitoning a top_left elt.
        else if (window.workspace_floating_typein_id && (elt_in_ws == workspace_floating_typein_id)) {} //ignore
        else if(elt_in_ws.classList.contains("block-top-left")){
            if (!prev_elt || !prev_elt.classList.contains("top-left-spacer")){
               workspace_id.insertBefore(make_top_left_spacer(), elt_in_ws)
            }
        }
        else if(elt_in_ws.classList.contains("top-left-spacer")) {
            if (prev_elt && prev_elt.classList.contains("top-left-spacer")) {
                remove_dom_elt(prev_elt)
            }
        }
        prev_elt = elt_in_ws
    }
    if((ws_kids.length == 0) ||
       !last(ws_kids).classList.contains("bottom-left-spacer")){
        workspace_id.appendChild(make_bottom_left_spacer())
    }
}

function reposition_top_left_block(elt, new_y){
    let y_cursor = 0
    let prev_elt = null
    let ws_kids = Array.from(workspace_id.children) //we need a copy because we're going
       //to be hacking the children in the loop, and the children nodelist might up updates
       //when we delete one screwing uo the loop.
    for(let elt_in_ws of ws_kids) {
        if      (elt_in_ws == elt) {} //ignore in this looping, just in case we're reposiitoning a top_left elt.
        else if (window.workspace_floating_typein_id && (elt_in_ws == workspace_floating_typein_id)) {} //ignore
        else if(elt_in_ws.classList.contains("block-top-left")){ prev_elt = elt_in_ws }
        else if(elt_in_ws.classList.contains("top-left-spacer")){
            //let elt_in_ws_bounding_rect = elt_in_ws.getBoundingClientRect() //can't figure out teh coord system for this so its useless. I want workspace_id coord sys
            //let elt_in_ws_y = elt_in_ws_bounding_rect.bottom
            //let tlb_y = px_suffix_string_to_number(tlb.style.top) //can't rely on this
            y_cursor += elt_in_ws.clientHeight
            if(new_y <= (elt_in_ws.offsetTop + elt_in_ws.offsetHeight)) { //elt goes before this top-left-spacer
                workspace_id.insertBefore(make_top_left_spacer(), elt_in_ws)
                workspace_id.insertBefore(elt, elt_in_ws)
                elt.classList.remove("block-absolute")
                elt.classList.add("block-top-left")
                clean_up_top_lefts()
                return
            }
            prev_elt = elt_in_ws
        }
    }
    workspace_id.appendChild(make_top_left_spacer())
    workspace_id.appendChild(elt)  //workspace_id is same as tlb.parentNode here
    elt.classList.remove("block-absolute")
    elt.classList.add("block-top-left")
    clean_up_top_lefts()
}

/*function reposition_top_left_block(elt, new_y){
    elt.style.left = "0px"
    let tlbs = Workspace.inst.top_left_blocks() //sorted top to bottom
    for(let tlb of tlbs) {

        if(tlb != elt){ //because elt may show up in tlbs, and we don't want it too
            let tlb_bounding_rect = tlb.getBoundingClientRect()
            let tlb_y = tlb_bounding_rect.top
            //let tlb_y = px_suffix_string_to_number(tlb.style.top) //can't rely on this
            if(tlb_y >= new_y) { //elt goes before this block
                let spacer_above_block = make_dom_elt("div", {class:"top-left-spacer"}, "&nbsp")
                tlb.parentNode.insertBefore(spacer_above_block, tlb)
                tlb.parentNode.insertBefore(elt, tlb)
                return
            }
        }
    }
    let spacer_above_block = make_dom_elt("div", {class:"top-left-spacer"}, "&nbsp;")
    workspace_id.appendChild(spacer_above_block)
    workspace_id.appendChild(elt)  //workspace_id is same as tlb.parentNode here
    elt.classList.remove("block-absolute")
    elt.classList.add("block-top-left") //This will cause redrawing. Must be after top_left_blocks call
    //so tha that doesn't accidentally pick it up.
}
*/
