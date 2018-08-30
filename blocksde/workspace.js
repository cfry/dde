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
                                       //onclick:    "floating_typein_done(event)", //causes an error when you click in the floating type in. no point to doing this.
                                       display:    "block",
                                       visibility: "hidden",
                                       "font-size": "14px" //even thogh 13 is the font size for nomral block, 14 looks closer to the actual size in the type in
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
        focus_on_descendant_with_tag(elt) //defaults to "input"
    }

    spacer_elt_at(y){
        for(let elt of workspace_id.childNodes){
            if(elt.classList.contains("top-left-spacer")){
                let spacer_y = elt.offsetTop
                let spacer_bottom = spacer_y + elt.offsetHeight
                if ((y >= spacer_y) && (y <= spacer_bottom)) { return elt }
            }
        }
        return dom_elt_child_of_class(workspace_id, "bottom-left-spacer")  //every workkspace_id should have exactly 1 child of class bottom-left-spacer

    }
    //if x is less than or equal to
    draw_block_at(block_elt, x, y){
        if(x <= Workspace.suck_left_margin) {
            let dropped_on_block = Workspace.inst.spacer_elt_at(y) //document.elementFromPoint(x, y) fails due to wierd offset
            install_top_left_block(block_elt, dropped_on_block)
            clean_up_top_lefts()
        }
        else { //see blocks2.js block_drop_handler
            block_elt.classList.remove("block-top-left")
            block_elt.classList.remove("arg_val")
            block_elt.classList.add("block-absolute")
            block_elt.style.position = "absolute" //note that setting its class to block-absolute SHOULD set its postion to "absolute" but it doesn't.
            block_elt.style.left = x + "px" //event.clientX + "px" //new_x + "px" // event.offsetX + "px"
            block_elt.style.top  = y + "px" //event.clientX + "px" new_y + "px" //event.offsetY + "px"
            Workspace.inst.add_block_elt(block_elt)
        }
        focus_on_descendant_with_tag(block_elt)
    }
    clear_blocks(){
        for(let node of Array.from(workspace_id.childNodes)){
            if(is_block(node)) { remove_dom_elt(node) }
            else if (node.classList.contains("top-left-spacer")) { remove_dom_elt(node) }
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
    /* first version
    floating_typein_done(event){
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
    /* 2nd version
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
    }*/
    shortcut_to_longcut(shortcut){
        let longcut = {"<"      : "foo < 0",
                       "less"   : "foo < 0",
                       "<="     : "foo <= 0",
                       "=="     : "foo == 0",
                       "==="    : "foo === 0",
                       "equals" : "foo === 0",
                       "!="     : "foo != 0",
                       "!=="    : "foo !== 0",
                       "not equals": "foo !== 0",
                       ">="     : "foo >= 0",
                       ">"      : "foo > 0",
                       "more"   : "foo > 0",
                       "+"      : "foo + 1",
                       "*"      : "foo * 2",
                       "/"      : "foo / 2",
                       "%"      : "foo % 2",
                       "++"     : "i++",
                       "--"     : "i--",
                       "&&"     : "foo && bar",
                       "and"    : "foo && bar",
                       "||"     : "foo || bar",
                       "or"     : "foo || bar",
                       "!"      : "!foo",
                       "not"    : "!foo",
                       "="      : "let foo = 0",
                       "set"    : "foo = 0",
                       "else if": "elseif",
                       fn       : "function",
                       for      : "for_iter"
                       }[shortcut]
        if(longcut) { return longcut }
        else { return shortcut }
    }
    floating_typein_done(event){
        event.stopPropagation()
        if (event.key == "Enter"){
            let float_typein = event.target
            let src = float_typein.value.trim()
            if (src == ""){ //don't make a new block, just hide the type in area.
                workspace_floating_typein_id.style.visibility = "hidden"
            }
            else { Workspace.inst.install_block_from_typein_src_or_series_item(src) }
        }
    }
    install_block_from_typein_src_or_series_item(src){
        let x = workspace_floating_typein_id.offsetLeft
        let y = workspace_floating_typein_id.offsetTop
        src = Workspace.inst.shortcut_to_longcut(src)
        let block_obj
        let block_elt
        if (is_string_an_identifier(src)){
            if(src == "return") {
                block_obj = Root.jsdb.rword_expr.return
            }
            else if(src == "break") {
                block_elt = Root.jsdb.one_of.break_continue.make_dom_elt(undefined, undefined, "break")
            }
            else if(src == "continue") {
                block_elt = Root.jsdb.one_of.break_continue.make_dom_elt(undefined, undefined, "continue")
            }
            else if (typeof(value_of_path(src)) === "function") { //make a call
                let fn_name_path_array = src.split(".")
                block_elt = Root.jsdb.method_call.make_dom_elt(undefined, undefined, fn_name_path_array)
            }
            else { block_obj = Root.jsdb.leafObjectNamed(src) }
        }
        else if (is_string_a_path(src)) { //if src's val is a fn, then make a call to it.
            let val_of_path = value_of_path(src)
            if(typeof(val_of_path) === "function") {
                let fn_name_path_array = src.split(".")
                block_elt = Root.jsdb.method_call.make_dom_elt(undefined, undefined, fn_name_path_array)
            }
        }
        if(block_obj) {
           let block_elt = block_obj.make_dom_elt(x, y)
           workspace_floating_typein_id.style.visibility = "hidden"
           Workspace.inst.draw_block_at(block_elt, x, y)
        }
        else if(block_elt){
            workspace_floating_typein_id.style.visibility = "hidden"
            Workspace.inst.draw_block_at(block_elt, x, y)
        }
        else {
            try{
                let block_to_install = JS2B.js_to_blocks(src)
                Workspace.inst.draw_block_at(block_to_install[0], event.target.offsetLeft, event.target.offsetTop) //event.target is the text input elt
                try{ let result = eval(src) } //todo probably not a good idea due to side effects and long possible eval time
                catch(err){
                    warning("Your type-in is syntactically valid<br/>but when Evaled, errors with:<br/>" + err.message, true)
                }
                workspace_floating_typein_id.style.visibility = "hidden"
            }
            catch(err){ //syntactically invalid. Leave typein up so user can edit it.
                warning("You've entered syntactically invalid JavaScript.<br/>" + err.message, true)
            }
        }
    }
    install_blocks_from_series(the_ser){
        let x = workspace_floating_typein_id.offsetLeft
        let y = workspace_floating_typein_id.offsetTop
        let series_items = the_ser.array
        let block_to_install
        if ((the_ser.kind == "method_call") || (the_ser.kind == undefined)){
            let meth_name_one_of_elt = Root.jsdb.one_of.make_dom_elt(undefined, undefined, series_items[0], series_items)
            block_to_install = Root.jsdb.method_call.make_dom_elt(undefined, undefined, meth_name_one_of_elt)
        }
        else if(the_ser.kind == "infix"){
            let meth_name_one_of_elt = Root.jsdb.one_of.make_dom_elt(undefined, undefined, series_items[0], series_items , false) //last arg of false means don't eval choices
            block_to_install = Root.jsdb.infix.make_dom_elt(undefined, meth_name_one_of_elt, undefined)

        }
        else if(the_ser.kind == "variable"){
            block_to_install = Root.jsdb.one_of.make_dom_elt(undefined, undefined, series_items[0], series_items)
        }
        else if(the_ser.kind == "string"){
            let items =[]
            for(let it of series_items) { items.push('"' + it + '"') }
            block_to_install = Root.jsdb.one_of.make_dom_elt(undefined, undefined, series_items[0], items)
        }
        else if(the_ser.kind == "punctuation"){
            warning("Blocks View handles the punctuation for you.")
            return
        }

        Workspace.inst.draw_block_at(block_to_install, x, y)
    }
}

Workspace.suck_left_margin = 20 //if a block is dropped with its x of <= this, then x will be set to 0
Workspace.floating_typein_x = 0
Workspace.floating_typein_y = 0
