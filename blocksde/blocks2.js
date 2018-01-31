//A block is represented as a dom div of class "block" with id block_123 (ie Root.jsdb.block_counter)
//blocks have a type hierarchy represented by jsdb new ojjects
//Each leaf jsdb objects is ALSO organized into on cagetory, annother short hierachy.

// This file has dom manipulation code having to do with blocks

function is_top_left_block(elt){
    return ((elt instanceof Node) &&
            elt.classList.contains("block") &&
            ((elt.style.position == "static") || (elt.style.position == ""))
           )
}

function dom_elt_block_type(elt){
    let bt_string = elt.dataset.blockType
    bt_string = "Root.jsdb." + bt_string
    return value_of_path(bt_string)
}

function toggle_expand_collapse(event){
    event.stopPropagation()
    let block_elt = event.target.parentNode.parentNode
    let block_args_elt = block_elt.querySelector(".block_args")
    if(block_args_elt.style.display == "none") { block_args_elt.style.display = "inline" }
    else                                       { block_args_elt.style.display = "none" }
}

function toggle_horiz_vert(event){
    event.stopPropagation()
    let block_elt = event.target.parentNode.parentNode
    let block_args_elt = block_elt.querySelector(".block_args")
    if(block_args_elt.style.display == "none") {}
    else {
        if (block_args_elt.style.display == "inline"){ //set to vert
            block_args_elt.style.display = "block"
            for(let arg_name_val_elt of block_args_elt.children){
                arg_name_val_elt.style.display     = "block"
                arg_name_val_elt.style.marginLeft  = "10px"
                arg_name_val_elt.style.marginRight = "0px"

                let arg_name_elt = arg_name_val_elt.children[0]
                arg_name_elt.style.display = "inline"
            }
        }
        else {//set to horiz
            block_args_elt.style.display     = "inline"
            block_args_elt.style.marginLeft  = "0px"
            block_args_elt.style.marginRight = "10px"
            for(let arg_name_val_elt of block_args_elt.children){
                arg_name_val_elt.style.display     = "inline"
                arg_name_val_elt.style.marginLeft  = "0px"
                arg_name_val_elt.style.marginRight = "0px"
                let arg_name_elt = arg_name_val_elt.children[0]
                arg_name_elt.style.display = "none"
                let arg_val_elt = arg_name_val_elt.children[1]
                arg_val_elt.style.marginLeft  = "0px"
                arg_val_elt.style.marginRight = "0px"
            }
        }
    }
}

//see https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
function block_dragstart_handler(event){
    out("dragstart_handle with: " + event.target.id)
    console.log("start client x" + event.clientX)
    event.dataTransfer.setData("text", event.target.id);
    event.dropEffect = "move";
    Workspace.inst.start_drag_client_x  = event.clientX //needed to place block on drag end.
    Workspace.inst.start_drag_client_y  = event.clientY
    //workspace_id.onmousemove = block_on_mouse_move
}

function block_drag_handler(event) {
    let elt = event.target
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
    event.dataTransfer.dropEffect = "move"
}

function block_drop_handler(event) {
    console.log("drop client x" + event.clientX)
    event.preventDefault();
    // Get the id of the target and add the moved element to the target's DOM
    let id_of_block = event.dataTransfer.getData("text");
    out(id_of_block)
    let elt = document.getElementById(id_of_block)
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
}
/*
function block_on_mouse_move(event){
    Workspace.inst.now_dragging_block_x += event.mousemovementX
    Workspace.inst.now_dragging_block_y += event.mousemovementY
}*/

function make_top_left_spacer(){
    return make_dom_elt("div", {class:"top-left-spacer"}, "&nbsp")
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
