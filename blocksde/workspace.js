/*function on_load(){
    new Workspace(400, 400)
    //init_block()
}*/

var Workspace = class Workspace{
    constructor(width=600, height=600, html_wrapper_name="workspace_container_id"){
        console.log("Workspace constructor top")
        this.width  = width
        this.height = height
        this.html_wrapper_name = html_wrapper_name
        this.highlighted_block=null //at most 1
        let the_dom_elt = this.make_dom_elt()
        workspace_container_id.appendChild(the_dom_elt)
        Workspace.inst = this
        setTimeout(function(){ Workspace.inst.init_workspace()}, 10) //give the html a chance to render
    }
    static make_workspace_instance(width="800px", height="400px"){
        new Workspace(width, height)
    }
    init_workspace() {
        workspace_id.onclick=function(event){
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
                            ondragover:  "block_dragover_handler(event)",
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
    static toolkit_bar_mouseover(event){
        if (event.which == 0) { //mouse is up. If the mouse is down, we are draging a block into the area to delete it so don't op up the cat menu
            let the_html = " <b>Categories</b><br/>"
            for(let cat of Root.BlockCategory.subObjects()){
                the_html +=
                    '<div class="toolkit_category_name" ' +
                    `onmouseover="Workspace.category_mouseover('` + cat.name + `')"`   +
                    `onmouseout="category_menu_id.style.display = 'block'" ` +
                    'style="width:70px; background-color:' + cat.color + ";" +
                    '">'  +
                    cat.name + "</div>"
            }
            category_menu_id.innerHTML = the_html
            //category_menu_id.show();
            category_menu_id.style.display = "block"
        }
    }

    static toolkit_bar_mouseup(event){
        console.log("toolkit_bar_mouseup")
        for(let a_block of Root.block.workspace_blocks){
            if (a_block.x <= -1) {
                a_block.delete()
                return //there should only be 1.
            }
        }
    }

    static category_mouseover(cat_name){
        let the_html = " <b>Block Types</b><br/>"
        let cat = Root.BlockCategory.name_to_category(cat_name)
        for(let bt of cat.block_types){
            the_html +=
                '<div class="toolkit_type_name" ' +
                      'onclick="' + bt.objectPath() + '.make_and_draw_block(150, 70)"' +
                     ' style="width:108px; background-color:' + cat.color + ';">' +
                      bt.display_label +
                "</div>"
        }
        block_type_menu_id.innerHTML     = the_html
        category_menu_id.style.display   = "block"
        block_type_menu_id.style.display = "block"
    }

    add_block_html(block_html){
        workspace_id.insertAdjacentHTML("beforeend", block_html)
    }
    add_block_elt(elt){
        workspace_id.appendChild(elt)
    }
    clear_blocks(){}
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

    to_js(){
        let blocks = Workspace.inst.top_left_blocks()
        let result = ""
        for(let elt of blocks){
            let bt = dom_elt_block_type(elt)
            let src = bt.to_js(elt)
            result += ((result == "") ? "" : "\n") + src
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
        }
    }
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
    }
}

Workspace.suck_left_margin = 20 //if a block is dropped with its x of <= this, then x will be set to 0
Workspace.floating_typein_x = 0
Workspace.floating_typein_y = 0
