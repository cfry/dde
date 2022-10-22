const LiteGraph = require("litegraph.js").LiteGraph; //needs to be at top of file

//copied from https://github.com/jagenjo/litegraph.js/blob/master/src/litegraph.js
var LGraphCanvas_prototype_processKey = function(e) { //used in init
    if(Editor.view !== "HCA"){
        return
    }
    else if (!this.graph) {
        return;
    }

    var block_default = false;
    //console.log(e); //debug

    if (e.target.localName == "input") {
        return;
    }

    if (e.type == "keydown") { //fry: this event not triggered in dde on mac so must use keyup
        if (e.keyCode == 32) {
            //esc
            this.dragging_canvas = true;
            block_default = true;
        }

        //select all Control A
        if (e.keyCode == 65 && e.ctrlKey) {
            this.selectNodes();
            block_default = true;
        }

        if (e.code == "KeyC" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            //copy
            if (this.selected_nodes) {
                this.copyToClipboard();
                block_default = true;
            }
        }

        if (e.code == "KeyV" && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            //paste
            this.pasteFromClipboard();
        }

        //delete or backspace
        if (e.keyCode == 46 || e.keyCode == 8) {
            if (
                e.target.localName != "input" &&
                e.target.localName != "textarea"
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
    } else if (e.type == "keyup") {
        if (e.keyCode == 32) {
            this.dragging_canvas = false;
        }
        //begin fry extension:
        else if (e.key == "a" && e.ctrlKey) { //select all
            this.selectNodes();
            block_default = true;
        }

        else if (e.key == "x" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { //cut note: metaKey is supposed to be mac cloverleaf but it fails, so just use cntrl key on mac, just like window.
            if (this.selected_nodes) {
                this.copyToClipboard();
                this.deleteSelectedNodes();
                block_default = true;
            }
        }

        else if (e.key == "c" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { //copy
            if (this.selected_nodes) {
                this.copyToClipboard();
                block_default = true;
            }
        }

        else if (e.key == "v" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { //paste
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


var HCA = class HCA {
    static make_HCA_dom_elt(){
        let big_div = make_dom_elt("div", {style: {display: "flex"}})
        let palette = make_dom_elt("div",
                                   {id: "HCA_palette_id", style: {width:150, height:400, "background-color":"#ffe0cd"}}, //display:"inline-block" //"overflow-block": "hidden"
                                   )
        big_div.append(palette)
        //let but = make_dom_elt("button", {margin: "5px"}, "number")
        //palette.append(but)
        setTimeout(this.populate_palette, 100)
        let can_holder = make_dom_elt("div", {style: {"flex-grow": 1}} )
        big_div.append(can_holder)
        let can = make_dom_elt("canvas", {id: "HCA_canvas_id",
                                          html_properties: {width: '1024',
                                                            height: '720'
                                                           }
                                          //style: { display: "inline-block"}
                                          }
                               )
         //<canvas id='mycanvas' width='1024' height='720' style='border: 1px solid'></canvas>
        can_holder.append(can)

        //Set canvas background color
        //set_css_properties(".lgraphcanvas {background-color: #FFFFFF;}") //doesn do anything


        return big_div
    }

    static config_litegraph_class(){
        LiteGraph.NODE_DEFAULT_BGCOLOR      = "#CCCCFF" //the background color of the lower part of a node
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

    static init(json_string=""){ //json_string can also be a jason object or null
        //this.edit_json_string(json_string)
        let json_obj = this.string_to_json_obj(json_string) //errors if js is invalid
        //if(!window.HCA_canvas_id) { this.make_HCA_dom_elt() }
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

        this.lgraph.configure(json_obj)
        for(let node of this.lgraph._nodes){
            this.node_add_usual_actions(node)
        }
        //this.lgraph.start(100) //let user do this. //arg is number of milliseconds between steps, default 1. don't need this for pure graphics
        if(!window.hca_ui_doc_id){
            let html = read_file(__dirname + "/HCA/HCA_doc.html")
            insert_html_into_doc_pane(html, "User Guide", "beforeend")
            open_doc(hca_ui_doc_id)
        }
        const ctx = HCA_canvas_id.getContext("2d");
        ctx.fillStyle = "rgb(200, 0, 0)";
        ctx.fillRect(10, 10, 50, 50);
    }

    static clear(){
        this.lgraph.clear()
    }

    //returns a json_obj with a "node" property, or errors.
    static path_to_json_obj(path){
        let json_string = read_file(path)
        let json_obj = this.string_to_json_obj(json_string, path)
        return json_obj
    }
    static string_to_json_obj(json_string, path=null){ //path is for error messages only
        if(typeof(json_string) === "string") {
            json_string = json_string.trim()
            if(json_string.length > 0) {
                try {
                    let json_obj = JSON.parse(json_string)
                    if(json_obj.nodes) {
                        return json_obj
                    }
                    else {
                        dde_error(path + " contains a valid json object but it doesn't represent an HCA object.")
                    }
                }
                catch(err){
                    if(json_string.startsWith("{") &&
                        json_string.endsWith("}") &&
                        json_string.includes("nodes:")) { //good chance ths is src for an obj that will work, even if the keys aren't double quoted strings
                        try{
                             let json_obj = eval("foo = " + json_string)
                             return json_obj
                        } //the foo= is necessary because of js broken by design evaluator. oddy it returns the object not the normal undefined for settig a var
                        catch(err){
                            dde_error(path + " does not contain a vaild HCA object.")
                        }
                    }
                    else {
                        dde_error(path + " does not contain a vaild HCA object.")                    }
                }
            }
        }
        else {
            dde_error(path + " isn't a valid path to an existing file.")
        }
    }

    static edit_file(path){
        let json_obj = HCA.path_to_json_obj(path) //errors if path is invalid
        this.lgraph.configure(json_obj) //configure must take a JSON obj, not a JSON string (which is the say its documented in the LiteGraph code
        Editor.add_path_to_files_menu(path) //this needs to be hear, not up in ready because
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
        if(typeof(json_obj) == "string") {

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
        const default_path = ((Editor.current_file_path == "new buffer") ? dde_apps_folder : Editor.current_file_path)
        const path = choose_save_file({title: title, defaultPath: default_path}) //sychronous! good
        if(path) { //path will be undefined IF user canceled the dialog
            let js = HCA.get_javascript()
            js = Editor.pretty_print(js)
            write_file_async(path, js)
            Editor.add_path_to_files_menu(path)
            Editor.current_file_path = path
            Editor.remove("new buffer") //if any
        }
    }

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
            inspect(sel_nodes[0])
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

    static get_javascript(use_selection=false){
        let json_string = ""
        if(HCA.lgraph._nodes.length > 0){
            json_string = JSON.stringify(HCA.lgraph.serialize())
        }
        //else return the empty string, otherwise there's a bunch of junk and coverting back to a JS empty buffer will get that junk in it.
        return json_string
    }

    static make_node_button(type, button_name, action_function){
        HCA.restore_palette() //expand the palette so we can add to it and so user can see the result
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
            action_function = 'function() { HCA.make_and_add_node("' + type + '", "' + button_name + '")}' //needs to be a string because if its a closure over button_name, that won't work with the toString below.
        }
        let but
        if(type) { //its a node making button
            let category = type.split("/")[0]
            let details_id = "hca_" + category + "_details_id"
            if(!window[details_id]){
                HCA_palette_id.insertAdjacentHTML("beforeend",
                                                  "<details id='" + details_id + "'style='margin-left:5px;'><summary>" + category + "</summary></details>")
            }
            let cat_elt = window[details_id]
            //but = make_dom_elt("div")
            //but.style["margin-left"] = "15px"
            //let a_elt = make_dom_elt("a", {href: "#"}, button_name)
            //but.appendChild(a_elt)
            //but.onclick = action_function
            //cat_elt.append(but)

            let fn_src = "(" + action_function.toString() + ")()"
            //fn_src = replace_substrings(fn_src, "'", "\\'") //screws up html and doesn't help because if we have a type, we know just what the actin_fn is like and it won't have any extra  single_quotes in it.
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
            fn_src = replace_substrings(fn_src, "'", "\\'")
            let new_html = "<button style='margin:2px' onclick='" + fn_src + "'>" + button_name + "</button>"
            HCA_palette_id.insertAdjacentHTML("beforeend", new_html)

        }
        HCA.save_palette() //save the changes
    }

    static load_def_choose_folder_or_file_cb(vals){
        let path
        if(vals.clicked_button_value == "file") {
            let path = choose_file()
            if(path) {
                HCA.load_node_definition_file(path)
            }
        }
        else if (vals.clicked_button_value == "folder"){
            let path = choose_folder()
            if(path){
                HCA.load_node_definition_folder(path)
            }
        }
        else { return } //cancel
    }

    static load_def_choose_folder_or_file(){
        show_window({title: "DDE HCA Interface",
                     height: 200,
                     content:
`<br/>To load a single object, click <input type='submit' value='file'/>.
<p/>
To load all the .hco object files in a folder, click <input type='submit' value='folder'/>.
<p/>
<input type='submit' value='cancel'/>
`,
                     callback: "HCA.load_def_choose_folder_or_file_cb"
    })
    }

    static load_node_definition(path){
        if(!path) {
            //path = choose_file()
            this.load_def_choose_folder_or_file()
        }
        else if (is_folder(path)){
            this.load_node_definition_folder(path)
        }
        else {
            this.load_node_definition_folder(path)
        }
    }
    static load_node_definition_file(path){
            let json_obj = this.path_to_json_obj(path)
            this.nodes_json_obj_to_button(path, json_obj)
    }

    static load_node_definition_folder(path){
        let files = folder_listing(path)
        for(let folder_or_file of files){
            if(is_folder(folder_or_file)){
                this.load_node_definition_folder(folder_or_file)
            }
            else if(folder_or_file.endsWith(".hco")){
                this.load_node_definition_file(folder_or_file)
            }
        }
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

    static make_and_add_node(type, button_name){
        out("making node of type: " + type)
        let node
        if(button_name == "number") {
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
    }

    static node_add_usual_actions(node){
         /*causes intermittent problems. Let  LGraphCanvas_prototype_processKey handle cut,copy,paste.
           if(!node.onKeyUp){
             node.onKeyUp = function(event) {
                 HCA.node_keyup_action.call(HCA, event, node)
             }
         }*/
        if(!node.onDblClick){
            node.onDblClick = function(event){
                out("got double click for node: " + node.title)
                let path = node.properties.composite_node_src_path
                out(path)
                if(path){
                    HCA.edit_file(path)
                }
                else {
                    warning("There is no source code file associated with this " + node.title + " node to edit.")
                }
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

    static define_node_type_from_canvas(path){
        /*prompt_async({title: "Make Composite Node",
                      doc: "Enter the name of the new node type.",
                      default_value: "new_object",
                      height: 140,
                      callback: this.make_composite_node_type_aux
                      */
        if(!path) {
            path = choose_save_file({title: "Enter object name. Don't include extension."}) //title does not display on mac.
                   //on windows, you can't have the options specify that you want to choose a file OR a dir.
                   //if you put in both options, it will only allow dir selection. GRR.
                   //I have to have a prompt_async let the user choose dir or file first,
                   //then pass the choose_save_file options accordingly.
        }
        if(path){
            if(!path.includes(".")){
                path += ".hco"
            }
            //out("making HCA object: " + path)
            let js = HCA.get_javascript()
            js = beautify.js(js)
            //let path = HCA.current_folder + "/" + name + "." + HCA.object_file_extension
            write_file(path, js)
            out("New object stored in: " + path)
            let nodes_json_obj = JSON.parse(js)
            HCA.nodes_json_obj_to_button(path, nodes_json_obj) //"this" doesn't work here
        }
    }

    static current_folder = dde_apps_folder

    static object_file_extension = "hco" //like HCA but with "object" instead.

    /*obsolete
     static make_composite_node_type_aux(name){
        out("making: " + name)
        let js = HCA.get_javascript()
        js = beautify.js(js)
        let path = HCA.current_folder + "/" + name + "." + HCA.object_file_extension
        write_file(path, js)
        out("New object stored in: " + path)
        let nodes_json_obj = JSON.parse(js)
        HCA.nodes_json_obj_to_button(name, nodes_json_obj) //"this" doesn't work here
    }*/

    static nodes_json_obj_to_button(path, nodes_json_obj){
         let path_parts = path.split("/")
        let name = last(path_parts)
        name = name.split(".")[0]
        let category = path_parts[path_parts.length - 2]
        let full_name = category + "/" + name
        this.make_node_button(full_name, name)
        let ins  = this.unconnnected_inputs(nodes_json_obj)
        let outs = this.unconnnected_outputs(nodes_json_obj)
        let node_maker_fn = function(){
            for(let name_type_pair of ins){
                this.addInput(name_type_pair[0], name_type_pair[1])
            }
            for(let name_type_pair of outs){
                this.addOutput(name_type_pair[0], name_type_pair[1])
            }
            if(!this.properties) { this.properties = {} }
            this.properties.composite_node_src_path = path
            this.title = name
            HCA.node_add_usual_actions(this)
        }
        //node_maker_fn.title = name; //name to show
        LiteGraph.registerNodeType(full_name, node_maker_fn); //register in the system
        HCA.palette_objects.push([full_name])
    }

    static unconnnected_inputs(node_json_obj){
        let result = []
        let name_count_obj = {}
        for(let node of node_json_obj.nodes){
            if(node.inputs) { //beware, if no inputs like "number" node.inputs will be undefined
                for(let an_in of node.inputs){
                    if(!an_in.link) {
                        let in_name = an_in.name
                        let count = name_count_obj[an_in.name]
                        if(count === undefined) {
                            name_count_obj[an_in.name] = 0
                        }
                        else {
                            let new_count =  count + 1
                            in_name = in_name + new_count
                            name_count_obj[an_in.name] = new_count
                        }
                        result.push([in_name, an_in.type])
                    }
                }
            }
        }
        return result
    }
    static unconnnected_outputs(node_json_obj){
        let result = []
        let name_count_obj = {}
        for(let node of node_json_obj.nodes){
            if(node.outputs) { //beware, node.outputs will be undefined if it has no outputs
                for(let an_out of node.outputs){
                    if(!an_out.links) {
                        let out_name = an_out.name
                        let count = name_count_obj[an_out.name]
                        if(count === undefined) {
                            name_count_obj[an_out.name] = 0
                        }
                        else {
                            let new_count =  count + 1
                            out_name = out_name + new_count
                            name_count_obj[an_out.name] = new_count
                        }
                        result.push([out_name, an_out.type])
                    }
                }
            }
        }
        return result
    }



    static palette_objects = []

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
    static populate_palette(){
        HCA_palette_id.innerHTML =
          "<button onclick='HCA.toggle_stop_run(event)' style='background-color:#ff7d8e;'>stopped</button><br/>" +
          "<div style='white-space:nowrap;'>Links " +
           "<input type='radio' checked name='link_type' onclick='HCA.lgraphcanvas.links_render_mode = 2; HCA.lgraphcanvas.dirty_bgcanvas = true;'>~</input>"   + //LiteGraph.SPLINE_LINK
           "<input type='radio'         name='link_type' onclick='HCA.lgraphcanvas.links_render_mode = 0; HCA.lgraphcanvas.dirty_bgcanvas = true;'>-_</input>"  + //LiteGraph.STRAIGHT_LINK'
           "<input type='radio'         name='link_type' onclick='HCA.lgraphcanvas.links_render_mode = 1; HCA.lgraphcanvas.dirty_bgcanvas = true;'>/</input>"   + //LiteGraph.LINEAR_LINK'
           "</div>"
        HCA.save_palette() //because make_node_button calls restore
        HCA.make_node_button(null,
            "define_object",
            function() {
                //HCA.make_subgraph()
                HCA.define_node_type_from_canvas()
            }
        )
        HCA.make_node_button(null,
            "make_group",
            function() {
                prompt_async({doc: "Enter a name for the new group.",
                              default_value: "group",
                              callback: HCA.make_group_cb})
            }
        )
        HCA.make_node_button(null,
                              "inspect_JSON",
                              function() {
                                inspect(HCA.lgraph.serialize(), "HCA.lgraph.serialize()")
                              }
                             )
        HCA_palette_id.append(make_dom_elt("div", {}, "&nbsp;HCA Objects"))
        HCA.make_node_button("basic/watch")
        HCA.make_node_button("basic/const", "number")
        for(let palette_obj of HCA.palette_objects){
            HCA.make_node_button.apply(HCA, palette_obj)
        }
        let width = HCA_palette_id.offsetWidth

        HCA_palette_id.onmouseenter = function(event){
            //out("got onmouseenter" + event)
            //HCA_palette_id.setAttribute("style","width:" + width + "px")
            //HCA_palette_id.setAttribute("style", "overflow-x:visible")
            //HCA_palette_id.style["overflow"] = "visible"
           // HCA_palette_id.style.width = width + "px"
            HCA.restore_palette()
        }
        HCA_palette_id.onmouseleave = function(event){
            //out("got onmouseleave" + event)
            //HCA_palette_id.setAttribute("style", "width:10px")
            //HCA_palette_id.setAttribute("style", "min-width:10px")
            //HCA_palette_id.setAttribute("style", "overflow-x:hidden")
            //HCA_palette_id.style.width = 10 + "px"
            //HCA_palette_id.style["overflow"] = "hidden"
            HCA.minimize_palette()
        }
        HCA.save_palette()
    }

    static save_palette(){
        HCA.palette_html = HCA_palette_id.innerHTML
    }

    static restore_palette(){
        HCA_palette_id.innerHTML = HCA.palette_html
    }

    static minimize_palette(){
        HCA_palette_id.innerHTML = "<br/>P<br/>u<br/>t<br/><br/>m<br/>o<br/>u<br/>s<br/>e<br/><br/>h<br/>e<br/>r<br/>e."
    }

} //end HCA class



