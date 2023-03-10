import {LiteGraph} from "litegraph.js";
globalThis.LiteGraph = LiteGraph

//overview: https://github.com/jagenjo/litegraph.js
//copied from https://github.com/jagenjo/litegraph.js/blob/master/src/litegraph.js
//src of litegraph is in big file: https://github.com/jagenjo/litegraph.js/blob/master/src/litegraph.js
var LGraphCanvas_prototype_processKey = function(e) { //used in init
    if(Editor.view !== "HCA"){
        return
    }
    else if (!this.graph) {
        return;
    }

    var block_default = false;
    //console.log(e); //debug

    if (e.target.localName === "input") {
        return;
    }

    if (e.type === "keydown") { //fry: this event not triggered in dde on mac so must use keyup
        if (e.keyCode === 32) {
            //esc
            this.dragging_canvas = true;
            block_default = true;
        }

        //select all Control A
        if (e.keyCode === 65 && e.ctrlKey) {
            this.selectNodes();
            block_default = true;
        }

        if (e.code === "KeyC" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            //copy
            if (this.selected_nodes) {
                this.copyToClipboard();
                block_default = true;
            }
        }

        if (e.code === "KeyV" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            //paste
            this.pasteFromClipboard();
        }

        //delete or backspace
        if (e.keyCode === 46 || e.keyCode === 8) {
            if (
                e.target.localName !== "input" &&
                e.target.localName !== "textarea"
            ) {
                this.deleteSelectedNodes();
                block_default = true;
            }
        }

        //collapse
        //...

        //TODO
        if (this.selected_nodes) {
            for (var i in this.selected_nodes) {
                if (this.selected_nodes[i].onKeyDown) {
                    this.selected_nodes[i].onKeyDown(e);
                }
            }
        }
    } else if (e.type === "keyup") {
        if (e.keyCode === 32) {
            this.dragging_canvas = false;
        }
        //begin fry extension:
        else if (e.key === "a" && e.ctrlKey) { //select all
            this.selectNodes();
            block_default = true;
        }

        else if (e.key === "x" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { //cut note: metaKey is supposed to be mac cloverleaf but it fails, so just use cntrl key on mac, just like window.
            if (this.selected_nodes) {
                this.copyToClipboard();
                this.deleteSelectedNodes();
                block_default = true;
            }
        }

        else if (e.key === "c" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { //copy
            if (this.selected_nodes) {
                this.copyToClipboard();
                block_default = true;
            }
        }

        else if (e.key === "v" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { //paste
            this.pasteFromClipboard();
        }

        //end fry extension
        else if (this.selected_nodes) { //fry added "else" before the "if" only
            for (var i in this.selected_nodes) {
                if (this.selected_nodes[i].onKeyUp) {
                    this.selected_nodes[i].onKeyUp(e);
                }
            }
        }
    }

    this.graph.change();

    if (block_default) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
    }
};


globalThis.HCA = class HCA {
    static object_file_extension = "hco" //like HCA but with "object" instead. Not now used

    static is_valid_hca_json_obj(json_obj) {
        return json_obj.project_date
    }

    static make_HCA_dom_elt(){
        let big_div = make_dom_elt("div", {id: "HCA_dom_elt", style:{height: "100%"}})//, style: {display: "flex"}})
        //let palette = make_dom_elt("div",
        ///                           {id: "HCA_palette_id", style: { height:400, "background-color":"#ffe0cd"}}//, "overflow-y":"scroll"}}, //display:"inline-block" //"overflow-block": "hidden"
        //                           )
        //big_div.append(palette)
        let pal_html = "<div id='HCA_palette_id', style='vertical-align:top; width:170px; height:400px; background-color:#ffe0cd; overflow-y:scroll; display:inline-block; padding:5px;'</div>" //, "overflow-y":"scroll"}}, //display:"inline-block" //"overflow-block": "hidden"
        big_div.insertAdjacentHTML("beforeend", pal_html)
        //let but = make_dom_elt("button", {margin: "5px"}, "number")
        //palette.append(but)
        setTimeout(this.populate_palette, 100)
        //setTimeout(function(){palette.setAttribute("style", "overflow-y:scroll")}, 1000)
       //f let can_holder = make_dom_elt("div"//, {style: { display:"inline-block"}}
       //f )
       //f big_div.append(can_holder)
        let canvas_wrapper_html = /*`<div id='HCA_canvas_wrapper_id' style=' overflow:scroll;  display:inline-block;'>
                                        <canvas id='HCA_canvas_id' style='width:1024px; height:720px;'> </canvas>
                                     </div>`
                                    `<div id='HCA_canvas_wrapper_id' style='flex-grow: 1;'>
                                         <canvas id='HCA_canvas_id' style='width:1024px; height:720px;'> </canvas>
                                     </div>`

                                     `<div id='HCA_canvas_wrapper_id' style='vertical-align:top; overflow:scroll;  display:inline-block; width:calc(100% - 150px); height:100%; border:2px solid blue;''>
                                         <canvas id='HCA_canvas_id' width='720' height='1024' <!--backing store in pixels -->
                                            style='vertical-align:top; width:100%; height:100%; border:2px solid green;'> <!-- display size -->
                                         </canvas>
                                     </div>`
                                     */
            `<div id='HCA_canvas_wrapper_id' style='vertical-align:top; overflow:scroll;  display:inline-block; width:calc(100% - 190px); height:100%; border:1px solid blue;'>
                <canvas id='HCA_canvas_id' width='720px' height='1024px' <!--backing store in pixels -->
                    style='vertical-align:top; width:100%; height:100%;'> <!-- display size -->
                </canvas>
            </div>`
        let header_html = `<div  style="padding:5px;">    
                           <span title="Where in the tree hierarchy this object definition lives.">TreeGroup:</span> <input id="tree_path_id" value="Misc"/>
                           ObjectName: <input id="current_obj_def_name_id" onchange="HCA.current_object_name_onchange()"/>
                           <select id="current_obj_def_select_id" onchange="HCA.obj_def_select_onchange(event)" title="Choose a name to edit its object definition." style="width:20px;height:20px;"></select> &nbsp;
                           <select id="sheet_kind_id" title="Sheet status of the edited object definition.">
                                <option value="not a sheet">not a sheet</option>
                                <option value="WipSheet">WipSheet</option>
                                <option value="CurrentSheet">CurrentSheet</option>
                           </select> 
                           Spread: <button onclick="HCA.spread()"    title="Decrease the distance between object calls.">less</button> 
                                   <button onclick="HCA.spread(1.5)" title="Increase the distance between object calls.">more</button>
                           </div>`
        big_div.insertAdjacentHTML("afterbegin", header_html)
        big_div.insertAdjacentHTML("beforeend", canvas_wrapper_html)
        /*let can = make_dom_elt("canvas",
                          {id: "HCA_canvas_id",
                                     display: "inline-block",
                                     html_properties: {width: '1024',
                                                       height: '720'
                                                           }
                                          //style: { display: "inline-block"}
                                    }
                               )
         //<canvas id='mycanvas' width='1024' height='720' style='border: 1px solid'></canvas>
        //f can_holder.append(can)
        big_div.append(can)
         */

        //Set canvas background color
        //set_css_properties(".lgraphcanvas {background-color: #FFFFFF;}") //doesn do anything
        return big_div
    }

    static config_litegraph_class(){
        LiteGraph.NODE_DEFAULT_BGCOLOR      = "#ABF" //the background color of the lower part of a node
        LiteGraph.NODE_DEFAULT_COLOR        = "#CCCCFF" //the background color of a node's title header
        LiteGraph.NODE_DEFAULT_BOXCOLOR     = "#00CC00" //the color of a node's upper left circle for expand/collase
        LiteGraph.NODE_BOX_OUTLINE_COLOR    = "#000000"
        LiteGraph.NODE_SELECTED_TITLE_COLOR = "#FF0000"
        LiteGraph.NODE_TEXT_COLOR           = "#000000"
        LiteGraph.NODE_TITLE_COLOR          = "#000000"
        LiteGraph.NODE_TITLE_HEIGHT         = 25
        //LiteGraph.NODE_WIDGET_HEIGHT      = 25
        LiteGraph.DEFAULT_POSITION          = [5, 35]
    }

    //source is a string of json describing a new style HCA app.
    static async init(source_path, source=""){ //json_string can also be a json object or null
        ipg_to_json.init()
        globalThis.HCA_dom_elt = HCA.make_HCA_dom_elt()
        let the_codemirror_elt = document.getElementsByClassName("CodeMirror")[0]
        html_db.replace_dom_elt(the_codemirror_elt, HCA_dom_elt)
        Editor.view = "HCA"
        this.config_litegraph_class()
        LiteGraph.LGraphCanvas.prototype.processKey = LGraphCanvas_prototype_processKey  //must be before creating new LiteGraph.LGraphCanvas or it won't go into effect

        this.lgraph = new LiteGraph.LGraph();
        this.lgraphcanvas = new LiteGraph.LGraphCanvas("#HCA_canvas_id", this.lgraph);
        this.lgraphcanvas.background_image = null //get rid of dark grid and make it just white background
        // fails  this.lgraphcanvas.processKey = LGraphCanvas_prototype_processKey
        /*let can = HCA_canvas_id
        let context = can.getContext('2d');
        context.fillStyle = 'rgba(255, 255, 255)';
        context.fillRect(0, 0, can.innerWidth, can.innerHeight);
        */
        /*let node_const = LiteGraph.createNode("basic/const");
        node_const.pos = [200,200];
        this.lgraph.add(node_const);
        node_const.setValue(4.5);

        var node_watch = LiteGraph.createNode("basic/watch");
        node_watch.pos = [500,200];
        this.lgraph.add(node_watch);
        node_const.connect(0, node_watch, 0 );

        inspect(this.lgraph.serialize())*/

        this.lgraph.configure()
        //the below is unneeded.
        //this.lgraph.configure((json_obj ? json_obj : undefined)) //ok if json_obj is undefined, which it will be if json_string defaults to "", or we launch HCA_UI from an empty editor buffer.
        //for(let node of this.lgraph._nodes){ //if json_string === "", lgraph._nodes will be []
        //    this.node_add_usual_actions(node)
        //}



        //this.lgraph.start(100) //let user do this. //arg is number of milliseconds between steps, default 1. don't need this for pure graphics
        /* just for testing canvas
        const ctx = HCA_canvas_id.getContext("2d");
        ctx.fillStyle = "rgb(200, 0, 0)";
        ctx.fillRect(10, 10, 50, 50);
        */
        source = source.trim()
        if(source.length === 0) {}
        else {
            try {
                setTimeout(function(){
                    let json_obj = HCA.string_to_json_obj(source_path, source,
                        "When launching the HCA UI,<br/>" +
                                     "if the editor had contained a valid HCA program,<br/>" +
                                     "you would have been given the opportunity to load it.")
                    if(Array.isArray(json_obj) && (json_obj.length === 0)) {} //json_obj is empty so nothing to load
                    else if (confirm("The editor probably contains a valid HCA program.\nLoad it into HCA UI?")) {
                            HCAObjDef.insert_obj_and_dataset_defs_into_tree(source_path, json_obj)
                    }
                }, 1300) //should be AFTER CorLib is loaded
            }
            catch (err) {
                warning("The text in the editor did not represent a valid HCA application<br/> so starting a new one.")
            }
        }
    }

    static clear(){
        this.lgraph.clear()
    }

    //returns a json_obj with a "node" property, or errors.
    static async file_path_to_json_obj(source_path){
        let source = await DDEFile.read_file_async(path)
        let json_obj = this.string_to_json_obj(source_path, source)
        return json_obj
    }

    static string_to_json_obj(source_path,
                              source,
                              error_message="\" does not contain a vaild HCA object.\""){ //path is for error messages only
        if(typeof(source) === "string") {
            source = source.trim()
            if(source.length > 0) {
                try {
                    let json_obj = JSON.parse(source)
                    if(HCA.is_valid_hca_json_obj(json_obj)) {
                        return json_obj
                    }
                    else {
                        dde_error("HCA.string_to_json_obj passed source:<br/><code>" + source.substring(0, 60) + "...<code><br/> that isn't valid HCA JSON. " + error_message)
                    }
                }
                catch(err){
                    warning("HCA.string_to_json_obj passed source:<br/><code>" + source.substring(0, 60) + "...</code><br/>that isn't valid JSON.<br/>" + error_message)
                    return []
                }
            }
            else {
                return [] //no nodes in an empty string
            }
        }
        else {
            dde_error("HCA.string_to_json_obj passed source: " + source  + " that isn't a string.")
        }
    }

    //source_path is to a file containing JSON HCA source.
    static async edit_file(source_path){
        let json_obj = await HCA.file_path_to_json_obj(source_path) //errors if path is invalid
        HCAObjDef.insert_obj_and_dataset_defs_into_tree(source_path, json_obj)
    }
    /* obsolete
    //return a json obj (name-value pair that has a "node" prop) or
    //errors. path is
    static json_string_to_valid_node_jason_obj(json_string, path){
        let json_obj
        if(typeof(json_string) === "string") {
            json_string = json_string.trim()
            if(json_string.length > 0) {
                try {
                    json_obj = JSON.parse(json_string)
                    return json_obj
                }
                catch(err){
                    if(json_string.startsWith("{") &&
                        json_string.endsWith("}") &&
                        json_string.includes("nodes:")) { //good chance ths is src for an obj that will work, even if the keys aren't double quoted strings
                        try{ json_obj = eval("foo = " + json_string) } //the foo= is necessary because of js broken by design evaluator. oddy it returns the object not the normal undefined for settig a var
                        catch(err){
                            return "HCA passed an invalid JSON string<br/>You can switch to an empty editor buffer and start HCA.<br/>Invalid JSON:<br/>" + json_string //don't start up HCA because going BACK to JS, will wipe out whatever JS is in that editor buffer. Better to let the user make an empty buffer and start HCA.
                        }
                    }
                    else {
                        return "HCA passed an invalid JSON string<br/>You can switch to an empty editor buffer and start HCA.<br/>Invalid JSON:<br/>" + json_string //don't start up HCA because going BACK to JS, will wipe out whatever JS is in that editor buffer. Better to let the user make an empty buffer and start HCA.
                    }
                }
            }
        }
        else {
            return "The string is not a valid JSON node object: " + json_string
        }
    }

    //if json_string is "", it does nothing silently
    static edit_json_string(json_string){
        let json_obj = this.json_string_to_valid_node_jason_obj(json_string)
        if(typeof(json_obj) === "string") {

        }
        if(typeof(json_string) === "string") {
            json_string = json_string.trim()
            if(json_string.length > 0) {
                try {
                    json_obj = JSON.parse(json_string)
                }
                catch(err){
                    if(json_string.startsWith("{") &&
                        json_string.endsWith("}") &&
                        json_string.includes("nodes:")) { //good chance ths is src for an obj that will work, even if the keys aren't double quoted strings
                        try{ json_obj = eval("foo = " + json_string) } //the foo= is necessary because of js broken by design evaluator. oddy it returns the object not the normal undefined for settig a var
                        catch(err){
                            dde_error("HCA.init passed an invalid JSON string<br/>You can switch to an empty editor buffer and start HCA.<br/>Invalid JSON:<br/>" + json_string) //don't start up HCA because going BACK to JS, will wipe out whatever JS is in that editor buffer. Better to let the user make an empty buffer and start HCA.
                        }
                    }
                    else {
                        dde_error("HCA.init passed an invalid JSON string<br/>You can switch to an empty editor buffer and start HCA.<br/>Invalid JSON:<br/>" + json_string) //don't start up HCA because going BACK to JS, will wipe out whatever JS is in that editor buffer. Better to let the user make an empty buffer and start HCA.
                    }
                }
            }
        }
        if(json_obj) {
            this.lgraph.configure(json_obj) //configure must take a JSON obj, not a JSON string (which is the say its documented in the LiteGraph code
        }
    }
    */
    static save_current_file(){
        let js = this.get_javascript()
        js = Editor.pretty_print(js)
        write_file(Editor.current_file_path, js)
    }

    static save_as(){
        const title     = 'save "' + Editor.current_file_path + '" as'
        const default_path = ((Editor.current_file_path === "new buffer") ? dde_apps_folder : Editor.current_file_path)
        const path = choose_save_file({title: title, defaultPath: default_path}) //sychronous! good
        if(path) { //path will be undefined IF user canceled the dialog
            let js = HCA.get_javascript()
            js = Editor.pretty_print(js)
            DDEFile.write_file_async(path, js)
            Editor.add_path_to_files_menu(path)
            Editor.current_file_path = path
            Editor.remove("new buffer") //if any
        }
    }

    //called by Edit menu/pretty print
    static pretty_print(){
        HCA.lgraph.arrange()
    }

    static eval_button_action(step){
        let sel_nodes = HCA.selected_nodes()
        if(step){
           HCA.lgraph.runStep()
           HCA.lgraph.change()
        }
        else if(sel_nodes.length === 0) {
            inspect(HCA)
        }
        else if(sel_nodes.length === 1){
            let sel_node = sel_nodes[0]
            let call_name = sel_node.title
            let call_obj = this.call_name_to_call_obj(call_name)
            inspect({
                          selected_call_object:    call_obj,
                          selected_litegraph_node: sel_node,
                          current_obj_def:            HCAObjDef.current_obj_def,
                          lgraph:                     HCA.lgraph.serialize(),
                          current_sheet:              HCAObjDef.current_sheet,
                          sheets:                     HCAObjDef.sheets,
                          dataset_tree:               Dataset.dataset_def_tree,
                          obj_def_tree:               HCAObjDef.obj_def_tree,
                          file_path_to_parse_obj_map: ipg_to_json.file_path_to_parse_obj_map,
                          loaded_files:               ipg_to_json.loaded_files
                   })
        }
        else {
            inspect(sel_nodes)
        }
    }

    //unlike HCA.lgraphcanvas.selected_nodes, this fn returns an array of the selected nodes. Might be empty.
    static selected_nodes(){
        let sel_nodes = HCA.lgraphcanvas.selected_nodes //but this is not an array, rather an obj with keys of the node id, and values of the node objects
        let keys = Object.keys(sel_nodes)
        let result = []
        for(let key of keys){
            result.push(sel_nodes[key])
        }
        return result
    }

    static inspect_data(){
        let sel_nodes = HCA.selected_nodes()
        let sel_node = ((sel_nodes.length > 0) ? sel_nodes[0] : "no selected node")
        let call_name = ((sel_nodes.length > 0) ? sel_node.title : null)
        let call_obj = (call_name ? this.call_name_to_call_obj(call_name) : "no selected call object")
        inspect({
            selected_call_object:       call_obj,
            selected_litegraph_node:    sel_node,
            current_obj_def:            HCAObjDef.current_obj_def,
            current_sheet:              HCAObjDef.current_sheet,
            sheets:                     HCAObjDef.sheets,
            dataset_tree:               Dataset.dataset_def_tree,
            object_name_to_defs_map:    HCAObjDef.object_name_to_defs_map,
            object_name_plus_in_types_to_def_map: HCAObjDef.object_name_plus_in_types_to_def_map,
            obj_def_tree:               HCAObjDef.obj_def_tree,
            file_path_to_parse_obj_map: ipg_to_json.file_path_to_parse_obj_map,
            file_path_to_datasets_map:  ipg_to_json.file_path_to_datasets_map,
            loaded_files:               ipg_to_json.loaded_files,
            lgraph:                     HCA.lgraph.serialize(),
            LiteGraph:                  LiteGraph,
            "LiteGraph.registered_node_types" : LiteGraph.registered_node_types
        })
    }

    static get_javascript(use_selection=false){
        let json_string = ""
        if(HCA.lgraph._nodes.length > 0){
            json_string = JSON.stringify(HCA.lgraph.serialize())
        }
        //else return the empty string, otherwise there's a bunch of junk and coverting back to a JS empty buffer will get that junk in it.
        return json_string
    }

    static make_node_button(type, button_name, action_function, add_newline=false, tooltip=null){
        //HCA.restore_palette() //expand the palette so we can add to it and so user can see the result
        if(!button_name) {
            let slash_pos = type.indexOf("/")
            if(slash_pos === -1){
                button_name = type
            }
            else {
                button_name = type.substring(slash_pos + 1)
            }
        }
        //let action = "HCA.make_and_add_node('" + type + "')"
        if(!action_function) {
            //action_function = 'function() { HCA.make_and_add_block("' + type + '", "' + button_name + '")}' //needs to be a string because if its a closure over button_name, that won't work with the toString below.
            shouldnt("HCA.make_node_button called without an action_function arg but with type: " + type)
        }
        if(type) { //its a node making button
            let category = type.split("/")[0]
            let details_id = "hca_" + category + "_details_id"
            if(!window[details_id]){
                HCA_palette_id.insertAdjacentHTML("beforeend",
                                                  "<details id='" + details_id + "' style='margin-left:5px;'><summary>" + category + "</summary></details>")
            }
            let cat_elt = window[details_id]
            //but = make_dom_elt("div")
            //but.style["margin-left"] = "15px"
            //let a_elt = make_dom_elt("a", {href: "#"}, button_name)
            //but.appendChild(a_elt)
            //but.onclick = action_function
            //cat_elt.append(but)

            let fn_src = "(" + action_function.toString() + ")()"
            //fn_src = Utils.replace_substrings(fn_src, "'", "\\'") //screws up html and doesn't help because if we have a type, we know just what the actin_fn is like and it won't have any extra  single_quotes in it.
            let new_html = `<div style='margin-left:15px;'>` +
                               `<a href='#' onclick='` + fn_src + `'>` + button_name + `</a>` +
                           `</div>`
            cat_elt.insertAdjacentHTML("beforeend", new_html)
        }
        else {
           // but = make_dom_elt("button", {margin: "2px"}, button_name)
           // but.onclick = action_function
           // HCA_palette_id.append(but)
            //the above fails due to my palette show and hide via setting innerHTML, because the dom programmatic
            //manipulation doesn't change what innerHTML returns.
            let fn_src = "(" + action_function.toString() + ")()"
            fn_src = Utils.replace_substrings(fn_src, "'", "\\'")
            let tt = (tooltip? (" title='" + tooltip + "' ") : "")
            let new_html = "<button style='margin:2px' onclick='" + fn_src + "' " + tt + "'>" + button_name + "</button>"
            if(add_newline) {new_html += "<br>" }
            HCA_palette_id.insertAdjacentHTML("beforeend", new_html)
        }
        HCA.save_palette() //save the changes
    }

    static clipboard = null

    //we only get keyup events from the keyboard, not keydown events.
    /*
      Obsolete. now done more reliably by LGraphCanvas_prototype_processKey
     static node_keyup_action(event, node){

        out("got key up with node: " + node.title)
        if(event.ctrlKey) { //note the apple key (cloverleaf) meta key processing is all screwed up
                            //so have to go with ctrl key even on a Mac.
            if(event.key === "x"){ //cut
                this.clipboard = node
                this.lgraph.remove(node)
            }
            else if (event.key === "c"){ //copy
                this.clipboard = node
            }
            else if(event.key === "v"){ //paste
               if(this.clipboard) {
                   this.clipboard.pos = [5,35]; //upper left of canvas, because cur mouse pos not available (defect of DOM design)
                   this.lgraph.add(node);
               }
            }
        }
    }*/

    static make_and_add_block(object_path, event){ //click action from pallette, dde4.
        let last_slash = object_path.lastIndexOf("/")
        let button_name = object_path.substring(last_slash + 1)
        if(event.shiftKey){ //edit the definition of the object
            HCA.display_obj_def(button_name)
        }
        else { //make and add a block to canvas

            let node = LiteGraph.createNode(object_path, button_name)
            this.lgraph.add(node);
            this.node_add_usual_actions(node)
            return node
        }
    }

    /*obsoluted with dde4 pallet items from CorLib
    static make_and_add_node(type, button_name){
        out("making node of type: " + type)
        let node
        if(button_name === "number") {
            node = LiteGraph.createNode(type, button_name, {size: [150, 20]})
        }
        else if (type === "graph/subgraph") {
            node = LiteGraph.createNode(type, button_name)

        }
        else {
            node = LiteGraph.createNode(type, button_name)
        }

        //node_const.pos = [5,35];
        //node_const.setValue(4.5);
        this.lgraph.add(node);
        this.node_add_usual_actions(node)
        return node
    }*/

    static node_add_usual_actions(node){
         /*causes intermittent problems. Let  LGraphCanvas_prototype_processKey handle cut,copy,paste.
           if(!node.onKeyUp){
             node.onKeyUp = function(event) {
                 HCA.node_keyup_action.call(HCA, event, node)
             }
         }*/
        if(!node.onDblClick){
            node.onDblClick = function(event){
                let obj_name = node.title
                out("got double click for node: " + node.title)
                HCA.display_obj_def(obj_name)
            }
        }
        if(!node.title){
             warning("A node is used but not defined. Define it via:<br/>" +
                     "File menu/Load... and choose: " + node.properties.composite_node_src_path +
                     "<br/>Then re-edit the file via:<br/>" +
                     "File menu/Open ... and choose: " + Editor.current_file_path)
        }
    }

    static make_group_cb(group_name){
        if(group_name) {
            HCA.lgraph.add(new LiteGraph.LGraphGroup(group_name))
        }
    }
    //copied and modified from         LGraphCanvas.onMenuNodeToSubgraph = function(value, options, e, menu, node) {
    /*static make_subgraph(button_name="new_subgraph", pos=[40, 40]){
        var graphcanvas = this.lgraphcanvas //LitegGraph.LGraphCanvas.active_canvas;
        var nodes_list = Object.values( graphcanvas.selected_nodes || {} );
        if( !nodes_list.length )  {
            //nodes_list = [ node ];
            warning("No selected nodes to make a subgraph from.")
            return
        }
        else {
            let node = nodes_list[0]

            var subgraph_node = //LiteGraph.createNode("graph/subgraph");
                                this.make_and_add_node("graph/subgraph", button_name)
            //subgraph_node.pos = pos.concat();
            //graph.add(subgraph_node);

            subgraph_node.buildFromNodes( nodes_list )

            graphcanvas.deselectAllNodes();
            node.setDirtyCanvas(true, true);
        }
    }*/

    //called by File menu/new and other places
    static new_object(){
         HCA.lgraph.clear()
         HCAObjDef.current_sheet = null
         HCAObjDef.current_obj_def = null
         current_obj_def_name_id.value = ""
         sheet_kind_id.value = "not a sheet"
         sheets_id.value = "None"
         out("Enter a new object name and<br/>optionally edit its tree path and sheet status<br/>to define a new object.",
              "green")
         current_obj_def_name_id.focus()
    }

    static current_object_name_onchange(){
        let new_obj_name = current_obj_def_name_id.value
        if (HCAObjDef.current_obj_def){
            HCAObjDef.rename_obj_def(HCAObjDef.current_obj_def, new_obj_name)
        }
        else {
            let tree_path = tree_path_id.value.trim()
            let tree_path_arr = tree_path
            let new_obj_def = new HCAObjDef(
                {objectName: new_obj_name,
                 TreeGroup:  tree_path_arr}
            )
            out("A new HCA Object definition for " + new_obj_name + " has been created.")
        }
    }

    static toggle_stop_run(event){
        let but_elt = event.target
        if(but_elt.innerHTML === "stopped"){
            //HCA.lgraph.setDirtyCanvas(true, true)
            HCA.lgraph.start(100)
            setTimeout(function(){ HCA.lgraph.change() }, //notify canvas to redraw
                       120) //have to give the onExecute time to actually make a change.
            but_elt.innerHTML = "running"
            but_elt.style["background-color"] = "rgb(136, 255, 136)"
        }
        else {
            HCA.lgraph.stop(100)
            but_elt.innerHTML = "stopped"
            but_elt.style["background-color"] = "rgb(255, 123, 0)"
        }
        HCA.save_palette()
    }

    //don't use "this" inside this method since its called with a timeout. Use HCA instead.
    static async populate_palette(){
        HCA_palette_id.innerHTML =
          "Simulator <button onclick='HCA.toggle_stop_run(event)' title='Toggle HCA simulation between stopped and running.' style='background-color:#ff7d8e;'>stopped</button><br/>" +
          `<div style='white-space:nowrap;' title='Specify the shape of the wire transporting data from an output to an input of blocks.'>Wires ` +
           "<input type='radio' checked name='link_type' onclick='HCA.lgraphcanvas.links_render_mode = 2; HCA.lgraphcanvas.dirty_bgcanvas = true;'>~</input>"   + //LiteGraph.SPLINE_LINK
           "<input type='radio'         name='link_type' onclick='HCA.lgraphcanvas.links_render_mode = 0; HCA.lgraphcanvas.dirty_bgcanvas = true;'>-_</input>"  + //LiteGraph.STRAIGHT_LINK'
           "<input type='radio'         name='link_type' onclick='HCA.lgraphcanvas.links_render_mode = 1; HCA.lgraphcanvas.dirty_bgcanvas = true;'>/&nbsp;&nbsp;</input>"   + //LiteGraph.LINEAR_LINK' //need the nbsp to give the div a width that will acomodate longest folder name for Object defs.
           "</div>"
        HCA.save_palette() //because make_node_button calls restore
        /*obsoleted by File menu/new
          HCA.make_node_button(null,
            "define object",
            function() {
                HCA.new_object()
            },
            true //add_newline
        )*/
        /*HCA.make_node_button(null,
            "make_group",
            function() {
                prompt_async({doc: "Enter a name for the new group.",
                              default_value: "group",
                              callback: HCA.make_group_cb})
            },
            true //add_newline
        )*/
        HCA.make_node_button(null,
                              "Inspect Info",
                              function() { HCA.inspect_data() },
                               false,
                               "Inspect HCA internal data structures for debugging."
                             )
        HCA_palette_id.insertAdjacentHTML("beforeend", "<br/>" + FPGAType.pallette_html())
        HCA_palette_id.insertAdjacentHTML("beforeend", "<details title='Click on an underlined name\nto edit that dataset.'><summary style='font-weight:bold;'>Dataset Tree</summary>\n" +
                                            "<div  id='HCA_palette_datasets_id'>" +
                                            "</div></details>")
        HCA_palette_id.insertAdjacentHTML("beforeend", "<details title='Click on an underlined name\nto create an object of that type.\nShift-click to edit its definition.'><summary style='font-weight:bold;'>Object Tree</summary>\n" +
                                           "<div  id='HCA_palette_make_objects_id'>" +
                                           "</div></details>")
        setTimeout( function() {
            HCAObjDef.define_built_ins()
            Dataset.define_built_ins()
            ipg_to_json.parse("dde/third_party/CorLib.ipg")
        }, 200)
        //await ipg_to_json.parse("dde/third_party/CorLib.ipg")
        //note, CorLib has no CurrentSheet
        //HCA.populate_palette_obj_defs(HCAObjDef.obj_def_tree)
        //HCA.save_palette()
    }

    /*static populate_palette_obj_defs(tree){
        let html = this.populate_palette_obj_defs_aux(tree)
        //HCA_palette_id.insertAdjacentHTML("beforeend", html)
        //HCA_palette_id.innerHTML = html
        HCA_palette_make_objects_id.innerHTML = html
    }*/


   /* static populate_palette_obj_defs_aux(tree){
        let dom_id = this.tree_folder_name_to_dom_id(tree.folder_name)
        let ht = ((tree.folder_name === "root") ? "" :
                 "<details class='hca_folder' " + "id='" + dom_id + "'><summary class='hca_folder_summary'>" + tree.folder_name + "</summary>"
                 )
        for(let obj_def of tree.obj_defs) {
            let obj_path_arr = obj_def.TreeGroup.slice()
            obj_path_arr.push(obj_def.objectName)
            let obj_path = obj_path_arr.join("/")
            this.register_with_litegraph(obj_def)
            let action_src = 'HCA.make_and_add_block("' + obj_path + '")'
            ht +="<div class='hca_obj_def' onclick='" + action_src + "'>" + obj_def.objectName + "</div>\n"
            |* //now done during new HCAObjDef
            if(obj_def.WipSheet){
                let html = "<option>" + obj_def.objectName + "</option>\n"
                sheets_id.insertAdjacentHTML("beforeend", html)
                HCAObjDef.sheets.push(obj_def)
            }
            else if (obj_def.CurrentSheet){
                let html = "<option>" + obj_def.objectName + "</option>\n"
                sheets_id.insertAdjacentHTML("afterbegin", html)
                HCAObjDef.sheets.unshift(obj_def) //put CurrentSheet first
            }
            *|
        }
        for(let subfold of tree.subfolders) {
            ht += this.populate_palette_obj_defs_aux(subfold)
        }
        ht += ((tree.folder_name === "root") ? "" : "</details>\n")
        return ht
    }*/

    //static tree_folder_name_to_dom_id(folder_name){
    //    return "tree_" + folder_name + "_id"
    //}

    static tree_folder_name_to_dom_id(obj_def, tree_arr_index_of_next_folder){
        let tree_arr_up_to_next_fold = Utils.subarray(obj_def.TreeGroup, 0,tree_arr_index_of_next_folder + 1)
        let tree_path_str = tree_arr_up_to_next_fold.join("/")
        return "tree_" + tree_path_str + "_id"
    }

    static make_object_id(obj_def){
        let path = obj_def.TreeGroup.join("/") + "/" + obj_def.objectName
        return "make_obj_" + path + "_id"
    }

    static pending_rendering_dom_id = null //or string id of a folder pallette dom elt

    //creates tree path all the way down, then inserts the new link to make an obj_call of the obj_def
    static insert_obj_def_into_pallette(obj_def, folder_dom_elt=HCA_palette_make_objects_id, tree_arr_index_of_next_folder=0){
        if(HCA.pending_rendering_dom_id && !window[HCA.pending_rendering_dom_id]) { //take a lap waiting for
            setTimeout(function(){
                HCA.insert_obj_def_into_pallette(obj_def, folder_dom_elt, tree_arr_index_of_next_folder)
            }, 200)
            return
        }
        else if(typeof(folder_dom_elt) === "string"){
            folder_dom_elt = window[folder_dom_elt]
            if(!folder_dom_elt) { //take a lap to let folder_dom_elt get rendered
                setTimeout(function(){
                    HCA.insert_obj_def_into_pallette(obj_def, folder_dom_elt, tree_arr_index_of_next_folder)
                }, 200)
                return
            }
            // else folder_dom_elt is a rendered elt so we can proceed
        }
        //if we get this far, the id in HCA.pending_rendering_dom_id is null, or its str value id has already been rendered
        //so there are no renderings to be completed, and
        //folder_dom_elt is a rendered dom_elt to stick the next item in the pallette, be it a
        //subfolder or and actual obj_def link
        HCA.pending_rendering_dom_id = null
        if(tree_arr_index_of_next_folder === obj_def.TreeGroup.length) { //done walking tree, so insert the actual link and we're done
            let dom_id = this.make_object_id(obj_def)
            let tree_path = obj_def.TreeGroup.join("/")
            let tree_path_and_obj_name = tree_path + "/" + obj_def.objectName
            this.register_with_litegraph(obj_def)
            let html_to_insert = `<div class="hca_obj_def"  id="` + dom_id + `" onclick="HCA.make_and_add_block('` + tree_path_and_obj_name + `', event)">` + obj_def.objectName + "</div>"
            folder_dom_elt.insertAdjacentHTML("beforeend", html_to_insert) //no need to wait for leaves of tree to render
        }
        else { //more tree walking to do
            let next_folder_name_dom_elt_id = this.tree_folder_name_to_dom_id(obj_def, tree_arr_index_of_next_folder)
            let next_folder_dom_elt = window[next_folder_name_dom_elt_id]
            if(next_folder_dom_elt) {
                setTimeout(function () { //needed just because call stack size exceeded without it
                    HCA.insert_obj_def_into_pallette(obj_def, next_folder_dom_elt, tree_arr_index_of_next_folder + 1) //whether or not the folder is rendered, we can still recurse and it will get caught at top of this fn.
                }, 1)
            }
            else  { //no next_folder_dom_elt so we need to create it
                let next_folder_name = obj_def.TreeGroup[tree_arr_index_of_next_folder]
                let html = "<details class='hca_folder' " + "id='" + next_folder_name_dom_elt_id + "'><summary class='hca_folder_summary'>" + next_folder_name + "</summary>\n</details>"
                folder_dom_elt.insertAdjacentHTML("beforeend", html)
                HCA.pending_rendering_dom_id = next_folder_name_dom_elt_id
                HCA.insert_obj_def_into_pallette(obj_def,
                                                 next_folder_name_dom_elt_id, //we pass the id str because next_folder_dom_elt is undedfined as it doesnt exist yet
                    tree_arr_index_of_next_folder + 1)
            }
        }
    }

    static register_with_litegraph(obj_def){
         let fn = function(){
             for(let input of obj_def.inputs) {
                 this.addInput(input.name, input.type)
             }
             for(let output of obj_def.outputs) {
                 this.addOutput(output.name, output.type)
             }
             //this.size = [80, 40] //width and height  if not given, this is automatically computed
             this.properties = { precision: 1 };
         }
         fn.title = obj_def.objectName; //name to show
         let obj_path = "basic/" + //obj_def.TreeGroup + "/" +
                         obj_def.objectName
         LiteGraph.registerNodeType(obj_path, fn); //register in the system
    }

    static save_palette(){
        HCA.palette_html = HCA_palette_id.innerHTML
    }

    /*
    static restore_palette(){
        HCA_palette_id.innerHTML = HCA.palette_html
    }

    static minimize_palette(){
        HCA_palette_id.innerHTML = "<br/>P<br/>u<br/>t<br/><br/>m<br/>o<br/>u<br/>s<br/>e<br/><br/>h<br/>e<br/>r<br/>e."
    }*/

    static choose_and_edit_file() {
        DDEFile.choose_file(
            {
                folder: undefined,
                title: 'Choose an .idl file to edit',
                callback: "HCA.choose_and_edit_file_cb"
            })
    }

    static choose_and_edit_file_cb(val) {
        SW.close_window(val.window_index)
        let path = val.clicked_button_value
        if (path) {
            if (path.endsWith(".idl")) {
                HCA.edit_idl_file(path)
            } else {
                try {
                    HCA.edit_file(path)
                } catch (err) {
                    dde_error(path + " doesn't contain vaild HCA object(s).<br/>" + err.message)
                }
                //Editor.add_path_to_files_menu(path) //now down in edit_file because edit_file is called
                //from more places than ready.
            }
        }
    }

    static async edit_idl_file(path_or_content){
        await ipg_to_json.parse(path_or_content)
    }

    //obsolete?
    /* static edit_idl_file_cb(big_obj){
        for(let obj_def of big_obj.object_definitions){
            if(obj_def.CurrentSheet) {
                HCAObjDef.sheets.unshift(obj_def)  //put on front of list
                HCAObjDef.current_sheet = obj_def
            }
            else if(obj_def.WipSheet) {
                HCAObjDef.sheets.push(obj_def)
            }
        }
        //let sheets_menu_items_html = ""
        for(let sheet_obj of HCAObjDef.sheets){
            let sheets_menu_item_html = ("<option>" + sheet_obj.objectName + "</option>\n")
            sheets_id.insertAdjacentHTML("beforeend", sheets_menu_items_html)
        }
        //sheets_id.innerHTML = sheets_menu_items_html

        //the below is to pretend the user clicked on the top most elt in the menu,
        //which is the CurrentSheet upon loading the file,
        //so that it will automatically display the current sheet's prototypes.
        setTimeout(function(){
            sheets_id.dispatchEvent(new Event('input', {bubbles:true}));
        }, 200)
    }*/

    /* doesn't really work because if you're on say 0.4 and you INCREASE the spread to 0.5, it
       still decreases the spread by 0.5.
       use with HTML:
     <input type="number" min="0.1" max="10" value="1" step="0.1" onchange="HCA.spread_onchange(event)"/>
    static spread_onchange(event){
        let factor_str = event.target.value
        let factor = parseFloat(factor_str)
        this.spread(factor)
    }*/

    static spread(factor=1/1.5){
        for(let obj_call of HCAObjDef.current_obj_def.prototypes){
            obj_call.x *= factor
            obj_call.y *= factor
        }
        this.redraw_obj_def()
    }

    static menu_label_to_obj_name(label){
        if(label.startsWith("CurSheet:"))     { return label.substring(9) }
        else if(label.startsWith("WipSheet:")){ return label.substring(9) }
        else { return label }
    }

    static obj_def_select_onchange(event){
        let label    = event.target.value
        let obj_name = this.menu_label_to_obj_name(label)
        this.display_obj_def(obj_name)
    }

    static display_obj_def(obj_name_or_def){
        let obj_def
        if(typeof(obj_name_or_def)  === "string"){
            obj_def = HCAObjDef.obj_name_to_obj_def(obj_name_or_def)
            if(!obj_def) {
                warning("Attempt to edit an object definition named: " + obj_name_or_def +
                    " but couldn't find it.")
                return
            }
        }
        else { obj_def = obj_name_or_def }
        //let sheet_obj = HCAObjDef.object_name_to_sheet(obj_name)
        HCAObjDef.current_obj_def = obj_def
        if(obj_def.CurrentSheet) {
            HCAObjDef.current_sheet = obj_def
            sheet_kind_id.value = "CurrentSheet"
        }
        else if(obj_def.WipSheet){
            HCAObjDef.current_sheet = obj_def
            sheet_kind_id.value = "WipSheet"
        }
        else {
            //should I set HCAObjDef.current_sheet to null??? We might still have a "working sheet".
            sheet_kind_id.value = "not a sheet"
            HCA.add_to_obj_def_menu_maybe(obj_def)
            //see HCAObjDef
        }
        current_obj_def_name_id.value = obj_def.objectName
        let tree_path = HCAObjDef.current_obj_def.TreeGroup.join("/")
        tree_path_id.value = tree_path
        this.redraw_obj_def()
        inspect(HCAObjDef.current_obj_def)
    }

    static add_to_obj_def_menu_maybe(obj_def){
        let label = obj_def.objectName
        let is_sheet = false
        if     (obj_def.CurrentSheet) { label = "CurSheet:" + label; is_sheet = true}
        else if(obj_def.WipSheet)     { label = "WipSheet:" + label; is_sheet = true}
        for(let dom_elt of current_obj_def_select_id.children){
            if(dom_elt.innerText === label) { return}
        }
        let the_html = "<option>" + label + "</option>"
        let pos = (is_sheet ? "afterbegin" : "beforeend")
        current_obj_def_select_id.insertAdjacentHTML(pos, the_html)
    }

    static redraw_obj_def(obj_def=HCAObjDef.current_obj_def) {
        HCA.lgraph.clear() //remove all existing graphical nodes
        if(!obj_def.prototypes) { return } //no prototypes to display in canvas
        let lgraph_config_json = { "last_node_id": obj_def.prototypes.length - 1,
                                    //"last_link_id" //set below
                                    "nodes":  [], //filled in below
                                    "links":  [],//filled in below, example of elt: //[1, 2, 0, 1, 0, "Variant"]
                                    "groups": [],
                                    "config": {},
                                    "extra":  {},
                                    "version": 0.4
                                 }
        let min_x = null
        let min_y = null
        let objectNames_array = [] //array indices are lgraph node ids. arr elts are objectNames

        //make the lgraph node json obj and compute the min_x and min_y position for all the nodes
        for(let i = 0; i <  obj_def.prototypes.length; i++){
            let obj_call = obj_def.prototypes[i]
            objectNames_array[i] = obj_call.objectName
            let a_node = this.make_lgraph_node_json(obj_call, i)
            let x = a_node.pos[0]
            if((min_x === null) || (min_x > x)) { min_x = x}
            let y = a_node.pos[1]
            if((min_y === null) || (min_y > y)) { min_y = y}
            lgraph_config_json.nodes.push(a_node)
        }

        //shift the nodes such that the min-x is up against left side of the canvas and
        //min_y is up against the top of the canvas.
        for(let node of lgraph_config_json.nodes){
            node.pos[0] -= min_x
            node.pos[1] -= min_y
        }

        let netList = obj_def.netList //an array of objs, one per link.
                                        //each of these link objs has 2 props: "sink" and "source"
                                        //the sink obj as 2 props: objectName and outputNumber (a non-neg int)
                                        //the source obj as 2 props: objectName and inputNumber (a non-neg int)
        let lgraph_links = []
        for(let connection_index = 0;  connection_index < netList.length; connection_index++){
            let connection          = netList[connection_index]
            let source_objectName   = connection.source.objectName
            let source_outputNumber = connection.source.outputNumber
            let sink_objectName     = connection.sink.objectName
            let sink_inputNumber    = connection.sink.inputNumber

            let source_node =  this.objectName_to_node(lgraph_config_json.nodes, source_objectName) //this.node_id_to_node(lgraph_config_json.nodes, source_node_id)
            let sink_node   =  this.objectName_to_node(lgraph_config_json.nodes, sink_objectName) //this.node_id_to_node(lgraph_config_json.nodes, sink_node_id)

            let type
            try {
                type = source_node.outputs[source_outputNumber].type
                //let obj_def = HCAObjDef.obj_name_to_obj_def(sink_objectName)
                //type = obj_def.outputs[sink_outputNumber].type
                //let source_obj_call = connection.source //obj_def.prototypes[i]
                //type = source_obj_call.outputs[source_outputNumber].type //todo cant work. no type info in call
            }
            catch(err) { type = "Varient"} //todo this is a hack, need to fix.
            let source_node_id = this.objectName_to_node_id(objectNames_array, source_objectName)
            let sink_node_id   = this.objectName_to_node_id(objectNames_array, sink_objectName)
            let links_elt  = [connection_index, //LLink.id
                              source_node_id,  //LLink.origin_id,
                              source_outputNumber,  //LLink.origin_slot,
                              sink_node_id,  //LLink.target_id,
                              sink_inputNumber,  ///LLink.target_slot,
                              type  //LLink.type
                             ]
            lgraph_links.push(links_elt)
            source_node.outputs[source_outputNumber].links.push(connection_index)
            sink_node.inputs[sink_inputNumber].link = connection_index
            console.log("connected lgraph nodes")
        }
        lgraph_config_json.links        = lgraph_links
        lgraph_config_json.last_link_id = lgraph_links.length - 1

        //actually render the nodes.
        this.lgraph.configure(lgraph_config_json) //ok if json_obj is undefined, which it will be if json_string defaults to "", or we launch HCA_UI from an empty editor buffer.
        for(let node of this.lgraph._nodes){ //if json_string === "", lgraph._nodes will be []
            this.node_add_usual_actions(node)
        }
    }

    static node_id_to_node(nodes, id){
        for(let node of nodes) {
            if(node.id === id) {
                return node
            }
        }
        return null
    }

    static call_name_to_call_obj(call_name, obj_def = HCAObjDef.current_obj_def){
        for(let call_obj of obj_def.prototypes){
            if(call_obj.objectName === call_name){
                return call_obj
            }
        }
        return null
    }

    static objectName_to_node_id(objectNames_array, objectName){
        for(let i = 0; i < objectNames_array.length; i++) {
            if(objectNames_array[i] === objectName) {
                return i
            }
        }
        return null
    }

    static objectName_to_node(nodes, objectName){
        for(let node of nodes){
            if(node.title === objectName){
                return node
            }
        }
    }

    static compute_block_width(obj_call){
        let max_in_letters = 0
        let max_out_letters = 0
        if(obj_call.inputs) {
            for (let a_in of obj_call.inputs) {
                max_in_letters = Math.max(max_in_letters, a_in.name.length)
            }
        }
        if(obj_call.outputs) {
            for (let a_out of obj_call.outputs) {
                max_out_letters = Math.max(max_out_letters, a_out.name.length)
            }
        }
        let io_letters_length = max_in_letters + max_out_letters
        if((max_in_letters > 0) && (max_out_letters > 0)) {
            io_letters_length += 2 //space between input and output labels
        }
        if(max_in_letters)  {max_in_letters  += 2 }//for the bullet point
        if(max_out_letters) {max_out_letters += 2 }//for the bullet point

        let title_letters_length = obj_call.objectName.length
        let title_pix      = (title_letters_length * 9) + 24 //24 is pixels of title's bullet point width title font wider than io names font
        let io_letters_pix = io_letters_length     * 7
        let block_width = Math.max(title_pix, io_letters_pix)
        return block_width
    }

    static compute_block_height(obj_call){
        let ins_count  = (obj_call.inputs  ? obj_call.inputs.length  : 0)
        let outs_count = (obj_call.outputs ? obj_call.outputs.length : 0)
        let vert_sections = 1 + //the title
            Math.max(ins_count, outs_count)
        return vert_sections * 18 //32   LiteGraph.NODE_TITLE_HEIGHT
    }

    static make_lgraph_node_json(obj_call, id){
        let ins = []
        //make json of format:
        // "inputs": [{ "name": "In1", "type": "Variant", "link": null_or_pos_int }]
        let hca_call_ins = (obj_call.inputs? obj_call.inputs : [])
        for(let an_in of hca_call_ins){
            let a_graph_in = {name: an_in.name, type: an_in.type, link: null}
            ins.push(a_graph_in)
        }
        let outs = []
        //make json of format:
        // "outputs": [{ "name": "In1", "type": "Variant", "link": null_or_pos_int }]
        let hca_call_outs = (obj_call.outputs? obj_call.outputs : [])

        for(let an_out of hca_call_outs){
            let a_graph_out = {name: an_out.name, type: an_out.type, links: []} //links can be null if none
            outs.push(a_graph_out)
        }
        let width  = this.compute_block_width(obj_call)
        let height = this.compute_block_height(obj_call)
        let result = {
            "id": id,
            "type": HCAObjDef.call_name_to_def_name(obj_call.objectName),
            "title": obj_call.objectName,
            "pos": [obj_call.x * 40, obj_call.y * 40],
            "size": {
                "0": width, //140
                "1": height //26
            },
            "flags": {},
            "order": 1,
            "mode": 0,
            "inputs": ins,
            "outputs": outs,
            "properties": {
                "precision": 1
            }
        }
        return result
    }

    static find(search_string){
        let [def_match, included_in_name, def_calls_match] = HCAObjDef.find_obj_defs(search_string)
        if ((included_in_name.length > 0) || (def_calls_match.length > 0))  {
            inspect({"Definition name matches":  def_match,
                          "Definition name includes": included_in_name,
                          "Definition calls match":   def_calls_match},
                    undefined,
                'HCA defs containing: "' + search_string + '"')
        }
        else {
            warning("No HCA object definitions found for: " + search_string)
        }
    }

} //end HCA class



