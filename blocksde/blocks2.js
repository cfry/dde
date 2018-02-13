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


//only 1 block can be selected
function selected_block(){
   return workspace_id.querySelector(".selected_block") //might be none
}

function unselect_block(){
    let sel_block = selected_block()
    if (sel_block) { sel_block.classList.remove("selected_block") }
}

function select_block(event){
    //debugger;
    event.stopPropagation()
    let elt = first_ancestor_of_class(event.target, "block") //event.target might be a block_name for instance
    if (elt.classList.contains("block")) {
        unselect_block()
        elt.classList.add("selected_block")
    }
    else {} //don't select things that aren't blocks. maybe a param got passed or something
}

function block_to_js(elt){
    let bt = dom_elt_block_type(elt)
    let src = bt.to_js(elt)
    return src
}
//______resizer_______
var drag_start_client_x
var drag_start_client_x
var old_client_x
var old_client_y
//var resizes= [] //just for testing of resizer_drag_handler

function resizer_dragstart_handler(event){
    event.stopPropagation()
    drag_start_client_x = event.clientX
    drag_start_client_x = event.clientY
    old_client_x = event.clientX
    old_client_y = event.clientY
    //debugger
}

function ancestors_of_class_block_or_block_always_relative(elt){
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
    //debugger
    event.stopPropagation()
    event.preventDefault()
    if (event.buttons == 0) { //user has let up on the mouse so no longer dragging.
        //sue to a chrome bug resizer_drag_handler will still be called  a few times
        //after user lets up on the mouse.
        //the biggest problem is that the values I compute for the new width and height
        //are wrong when the mouse is u. (not serue quite why but
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
    let always_rel_elt = first_ancestor_of_class(resizer_elt, "block_always_relative")
    let elts_to_resize = ancestors_of_class_block_or_block_always_relative(always_rel_elt) //will include the immediate
       // parent of block_always_relative and its par, a block_elt
       //as well as all similar classes block ancestors
    resizes = []
    let resizes_internal = []
    for (bl of elts_to_resize){
        let wid = (bl.clientWidth  + deltax) + "px"
        let hei = (bl.clientHeight + deltay) + "px"
        //if(bl.style.width != "") { debugger }
        bl.style.width  = wid
        bl.style.height = hei
        //resizes_internal.push([bl, bl.style.width, bl.style.height, event.buttons])
    }
    //resizes.push(resizes_internal)
    //}
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
    debugger
    event.stopPropagation() //we don't want this misinterpreted as a select of the block
    let resi = event.target
    let always_rel = first_ancestor_of_class(resi, "block_always_relative")
    always_rel.style.width  = "auto"
    always_rel.style.height = "auto"
    let block_elt = first_ancestor_of_class(resi, "block")
    block_elt.style.width  = "auto"
    block_elt.style.height = "auto"
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

    let elt = event.target //the dom elt being dragged, this will be a block
    if(elt.style.position == "static") {
        elt.style.position == "absolute"
        elt.style.left = "auto"
        elt.style.top  = "auto"
    }
    out("starting to drag: " + elt.classList)
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
        dragged_elt.style.left="auto"
        dragged_elt.style.top="auto"
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
