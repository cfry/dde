/*

function on_load(){
    new Workspace(400, 400)
    //init_block()
}*/

var Workspace = class Workspace{
    constructor(width="100%", height="100%", html_wrapper_name="workspace_container_id"){
        //console.log("Workspace constructor top")
        this.width  = width
        this.height = height
        this.html_wrapper_name = html_wrapper_name
        this.highlighted_block=null //at most 1
        let the_dom_elt = this.make_dom_elt()
        workspace_container_id.appendChild(the_dom_elt)
        the_dom_elt.appendChild(make_bottom_left_spacer())
        Workspace.inst = this
        setTimeout(function(){ Workspace.inst.init_workspace()}, 10) //give the html a chance to render
    }
    static make_workspace_instance(width="800px", height="400px"){
        new Workspace(width, height)
    }
    init_workspace() {
        workspace_id.onclick=function(event){
            event.stopPropagation()
            unselect_block()
            if(event["target"] && (event.target.tagName == "INPUT")) {} //handled in onmouseup
            else {
                Workspace.floating_typein_x = event.x //needed by floating_typein_done
                Workspace.floating_typein_y = event.y //note that these are different that offsetX & Y, and that x & y position the new block correctly, but NOT the input widget correctly.
                Workspace.inst.workspace_onclick(event.offsetX, event.offsetY)
            }
        }
        workspace_floating_typein_id.onkeyup = Workspace.inst.floating_typein_done
    }

    make_dom_elt(){
        //return svg_svg({id:"workspace_id", width: this.width, height: this.height,
        //    style: "border-width:2px; border-style:solid; margin:0px; padding:0px;"
        //child_elements:[svg_line({x1: 30, y1: 30, x2: 100, y2: 200, color: "blue", width: 5})]
       return make_dom_elt("div",
                           {id: "workspace_id", width: this.width, height: this.height,
                            ondragstart: "block_dragstart_handler(event)",
                            ondragover:  "block_dragover_handler(event)", //withoutthis, dragging a block anywhere causes the red delete zone to get colored red. Not sure why
                            ondrag:      "block_drag_handler(event)",
                            ondrop:      "block_drop_handler(event)",
                            },
                           make_html("input",
                                          //{id:"workspace_floating_typein_id", display: "none"}
                                      {id:         "workspace_floating_typein_id",
                                       position:   "absolute",
                                       onclick:    "floating_typein_done(event)",
                                       display:    "block",
                                       visibility: "hidden"
                                       }
                                     ))

    }

    //draws the category menu
    //see block_drag_handler for related
    static toolkit_bar_mouseover(event){
        if (event.which == 0) { //mouse is up. If the mouse is down, we are draging a block into the area to delete it so don't op up the cat menu
            //event.stopPropagation()
            //let elementMouseIsOver = document.elementFromPoint(event.clientX, event.clientY);
            if (block_being_dragged){ //looks like never called
                console.log("toolkit_bar_mouseover")
                uninstall_block_drop_zones()
                remove_drop_target_class()
                let arg_name_val_elt = closest_ancestor_of_class(block_being_dragged, "arg_name_val")
                if (arg_name_val_elt) {
                    let dropped_on_block = closest_ancestor_of_class(arg_name_val_elt, "block")
                    remove_dom_elt(arg_name_val_elt)
                    clean_up_arg_names(dropped_on_block)
                }
                else { remove_dom_elt(block_being_dragged) }
                block_being_dragged = null
                toolkit_bar_id.style["background-color"] = "#DDDDDD"
                clean_up_top_lefts()
           }
           else { //normal, mouse enters toolbar to pop up category menu
                //user is drabbing a block into the toolkit bar to delete it.
                let the_html = "<div class='categories'><b>Categories</b><br/>"
                for(let cat of Root.BlockCategory.subObjects()){
                    the_html +=
                        '<div class="toolkit_category_name" ' +
                        `onmouseover="Root.BlockCategory.category_mouseover('` + cat.name + `')"`   +
                        `onmouseout="category_menu_id.style.display = 'block'" ` +
                        'style="width:70px; background-color:' + cat.color + ";" +
                        '">'  +
                        cat.name + "</div>"
                }
                category_menu_id.innerHTML = the_html+ "</div>"
                category_menu_id.style.display = "block"
            }
        }
    }
    /* obsolete
    static toolkit_bar_mouseup(event){
        console.log("toolkit_bar_mouseup")
        for(let a_block of Root.block.workspace_blocks){
            if (a_block.x <= -1) {
                a_block.delete()
                return //there should only be 1.
            }
        }
    }*/

    add_block_html(block_html){
        workspace_id.insertAdjacentHTML("beforeend", block_html)
    }
    add_block_elt(elt){
        workspace_id.appendChild(elt)
    }
    clear_blocks(){
        for(let node of workspace_id.childNodes){
            if(is_block(node)) { remove_dom_elt(node) }
        }
    }
    deselect_block(){
        if(this.selected_block) {
            let delt = this.selected_block.get_dom_elt()
            //delt.style.zIndex = 0
            let block_rect_elt = delt.querySelector(".block_rect")
            block_rect_elt.style.strokeWidth = 1
            block_rect_elt.style.stroke      = "#000000"
            //delt.classList.remove("selected_block") dynallic styles don't work in svg
            Workspace.inst.selected_block = null
        }
    }
    top_left_blocks() {
        let result = []
        for(let elt of workspace_id.children){
            if (is_top_left_block(elt)) { result.push(elt) }
        }
        //assume blocks are in order in childern position="static" after all.
       // result.sort(function(b1, b2) {
       //     return b1.y > b2.y //topmost block first
       // } )
        return result
    }

    //parallel to Editor.get_javascript
    get_javascript(use_selection=false){
        if (use_selection === true) {
            let sel_block = selected_block()
            if (sel_block) { return block_to_js(sel_block) }
            else { return "" } //no selection
        }
        else if (use_selection == "auto") {
            let sel_block = selected_block()
            if (sel_block) { return block_to_js(sel_block) }
            else { return Workspace.inst.to_js() }
        }
        else if (use_selection === false) { return Workspace.inst.to_js() }
        else { shouldnt("Workspace.get_javasript passed invalid: " + use_selection) }
    }

    to_js(){
        let blocks = Workspace.inst.top_left_blocks()
        let result = ""
        for(let elt of blocks){
            let src = block_to_js(elt)
            result += ((result == "") ? "" : "\n\n") + src //1 blank line between top level items
        }
        out(result)
        return result
    }
    workspace_onclick(x, y){
        console.log(x + " " + y)
        if(workspace_floating_typein_id.style.visibility == "visible"){ // was "_wrapper_id  if already using it, "cancel" it and make it go away, as in "I made a mistake by clickign to start it.
            workspace_floating_typein_id.style.visibility = "hidden" // was "_wrapper_id
        }
        else {
            this.deselect_block()
            workspace_floating_typein_id.style.left = (x).toString() + "px" // was "_wrapper_id
            workspace_floating_typein_id.style.top  = (y).toString() + "px"// was "_wrapper_id
            workspace_floating_typein_id.style.visibility = "visible" // was "_wrapper_id
            workspace_floating_typein_id.focus()
            workspace_floating_typein_id.select()
            out("Type in simple, short JavaScript like a number, string, or variable name.", undefined, true)
        }
    }
    /*floating_typein_done(event){
        if (event.key == "Enter"){
            let str = event.target.value
            if (str == ""){ //don't make a new block, just hide the type in area.
            }
            else if (is_string_a_number(str)){
                let block_type =
                block.type.make_and_draw_block("block_number",
                    Workspace.floating_typein_x,
                    Workspace.floating_typein_y,
                    [str])
            }
            else if (starts_with_one_of(str, ['"', "'", "`"])){
                let new_val
                if (str[0] === last(str)){
                    new_val= str.substring(1, str.length - 1)
                }
                else { new_val= str.substring(1) }
                make_and_draw_block_of_class("block_string",
                    Workspace.floating_typein_x,
                    Workspace.floating_typein_y,
                    [new_val])
            }
            else {
                let bt = Root.jsdb.find_block_type(str)
                if(bt){
                    bt.make_and_draw_block(Workspace.floating_typein_x, Workspace.floating_typein_y)
                }
                else { console.log("floating_typein_done couldn't find " + str)
                }
                workspace_floating_typein_id.style.visibility = "hidden"
            }
            event.stopPropagation()
        }
    }*/

    floating_typein_done(event){
        event.stopPropagation()
        if (event.key == "Enter"){
            let src = event.target.value
            if (src == ""){ //don't make a new block, just hide the type in area.
                workspace_floating_typein_id.style.visibility = "hidden"
            }
            else {
                  let block
                  let result = eval_js_part2(src, false) //eval(src) //eval_js_part2 needed since normal eval can't handle "{a:1}" embarrisngly.
                  if ((typeof(result) == "string") && result.startsWith("Error: ")) {
                      if(is_string_an_identifier(src)){
                          block = Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, src)
                      }
                      else {
                        warning(result) //result will be a string starting with "Error: "
                        return  //don't hide the type_in, let user correct it
                      }
                  }
                  else if (result.error_message){
                      if(is_string_an_identifier(src)){
                          block = Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, src)
                      }
                      else {
                          warning(result.error_message) //result will be a string starting with "Error: "
                          return  //don't hide the type_in, let user correct it
                      }
                  }
                  else {
                    let val = result.value
                    block = Root.jsdb.value_to_block(val, src)
                  }
                  //we've made a valid block
                  workspace_floating_typein_id.style.visibility = "hidden"
                  block.style.position = "absolute"
                  block.style.left = workspace_floating_typein_id.style.left //Workspace.floating_typein_x + "px"
                  block.style.top  = workspace_floating_typein_id.style.top  //Workspace.floating_typein_y + "px"
                  workspace_id.appendChild(block)
            }
        }
    }
}

Workspace.suck_left_margin = 20 //if a block is dropped with its x of <= this, then x will be set to 0
Workspace.floating_typein_x = 0
Workspace.floating_typein_y = 0
