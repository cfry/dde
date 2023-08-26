import {LiteGraph} from "litegraph.js";
globalThis.LiteGraph = LiteGraph

//overview: https://github.com/jagenjo/litegraph.js
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

    /*if (e.type === "keydown") { //fry: this event not triggered in dde on mac so must use keyup
        if (e.keyCode === 32) {
            //esc
            this.dragging_canvas = true;
            block_default = true;
        }

        //select all Control A
        if ((e.keyCode === 65) && e.ctrlKey) {
            this.selectNodes();
            block_default = true;
        }

        if ((e.code === "KeyC") && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            //copy
            if (this.selected_nodes) {
                this.copyToClipboard();
                block_default = true;
            }
        }

        if ((e.code === "KeyV") && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
            //paste
            this.pasteFromClipboard();
        }

        //delete or backspace
        if ((e.keyCode === 46) || e.keyCode === 8) {
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
    } */
    if (e.type === "keyup") {
        if (e.keyCode === 32) {
            this.dragging_canvas = false;
        }
        //begin fry extension:
        else if ((e.key === "a") && e.ctrlKey) { //select all
            this.selectNodes(); //passing no nodes means select them all
            this.drawFrontCanvas() //without this, it doesn't highlight the selected nodes
            block_default = true;
        }
        //On mac, when you hold down command key and press x, the e.metaKey is NOT true.
        //after hours of internet search, I cannot detect a cmd-x or cmd-anything.
        //so just leave it as you have to use ctrl-x, ctrl-c etc on mac just like on windows. grrrr.
        else if ((e.key === "x") && (e.metaKey || e.ctrlKey) && !e.shiftKey) { //cut note: metaKey is supposed to be mac cloverleaf but it fails, so just use cntrl key on mac, just like window.
            if (this.selected_nodes) {
                this.copyToClipboard();
                this.deleteSelectedNodes();
                setTimeout(function() {HCAObjDef.update_current_obj_def_from_nodes()},
                           200)
                block_default = true;
            }
        }

        else if ((e.key === "c") && (e.metaKey || e.ctrlKey) && !e.shiftKey) { //copy
            if (this.selected_nodes) {
                this.copyToClipboard();
                block_default = true;
            }
        }

        else if ((e.key === "v") && (e.metaKey || e.ctrlKey) && !e.shiftKey) { //paste
            if(this.selected_nodes) {
                this.pasteFromClipboard() //counterintuitively, this has to happen before we uniquify the node_title (with a call_name a la foo:A)
                //because the clipboard is found in the localStorage of the browserm not actually in this.selected_nodes
                //The end of pasteFromClipboard updates this.selected_nodes with the actually pasted nodes,
                //so only THEN can I uniqufy the call_name (node title) and it works. Don't have to redisplay
                for (let i in this.selected_nodes) { //example in https://github.com/jagenjo/litegraph.js/blob/master/src/litegraph.js line 6477
                    // i is a string of a small non-neg integer
                    let a_node = this.selected_nodes[i]
                    let obj_name = a_node.title
                    let colon_pos = obj_name.indexOf(":")
                    if (colon_pos !== -1) {
                        obj_name = obj_name.substring(0, colon_pos) //strip off the :A suffixes
                    }
                    a_node.title = HCACall.first_free_call_name_aux(HCAObjDef.current_obj_def, obj_name)
                    HCAObjDef.update_current_obj_def_from_nodes()
                }

                //setTimeout(function () {
                //        HCAObjDef.update_current_obj_def_from_nodes()
                //    },
                //    200)
            }
        }
        else if ((e.keyCode === 46) || e.keyCode === 8) { //todo needs work
            if (
                e.target.localName !== "input" &&
                e.target.localName !== "textarea"
            ) {
                this.deleteSelectedNodes();
                block_default = true;
            }
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
        let canvas_wrapper_html =
            `<div id='HCA_canvas_wrapper_id' style='vertical-align:top; overflow:scroll;  display:inline-block; width:calc(100% - 190px); height:100%; border:1px solid blue;'>
                <canvas id='HCA_canvas_id' width='720px' height='1024px' <!--backing store in pixels -->
                    style='vertical-align:top; width:100%; height:100%; background-color:white;'> <!-- display size -->
                </canvas>
            </div>`
        let header_html = `<div style="padding:5px;"> 
                              <div style="display:inline-block">
                                 <div title="Where in the tree hierarchy this object definition lives."><b>TreeGroup:</b></div> 
                                 <input id="tree_path_id" value="Misc"/>
                              </div>
                              <div style="display:inline-block">
                                 <div title="The file path where this definition lives."><b>File:</b></div> 
                                 <input id="source_path_id" value=""/>
                              </div>
                              <div style="display:inline-block">
                                 <div><b>ObjectName:</b></div>
                                 <input id="current_obj_def_name_id" onchange="HCA.current_object_name_onchange()"/>
                                 <select id="current_obj_def_select_id" onchange="HCA.obj_def_select_onchange(event)" title="Choose a previously edited object definition to edit." style="width:20px;height:20px;">
                                 <option>__select an option__</option>
                                 </select>
                              </div>
                              <div style="display:inline-block">
                                 <div><b>Sheet Status:</b></div>
                                 <select id="sheet_kind_id" title="Sheet status of the edited object definition.">
                                    <option value="not a sheet">not a sheet</option>
                                    <option value="WipSheet">WipSheet</option>
                                    <option value="CurrentSheet">CurrentSheet</option>
                                 </select> 
                              </div>
                              <div style="display:inline-block">
                                 <div><b>Spread:</b></div> 
                                 <button onclick="HCA.spread()"    title="Decrease the distance between blocks (object calls).">less</button> 
                                 <button onclick="HCA.spread(1.5)" title="Increase the distance between blocks (object calls">more</button>
                              </div>
                              <button title="Set zoom, pan and spread to initial values." onclick="HCA.home()">Home</button>
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
        DocCode.open_doc(hca_ui_doc_id)
        ipg_to_json.init()
        HCAObjDef.init()
        globalThis.HCA_dom_elt = HCA.make_HCA_dom_elt()
        let the_codemirror_elt = document.getElementsByClassName("CodeMirror")[0]
        html_db.replace_dom_elt(the_codemirror_elt, HCA_dom_elt)
        Editor.view = "HCA"
        this.config_litegraph_class()
        LiteGraph.LGraphCanvas.prototype.processKey = LGraphCanvas_prototype_processKey  //must be before creating new LiteGraph.LGraphCanvas or it won't go into effect

        this.lgraph = new LiteGraph.LGraph();
        this.lgraphcanvas = new LiteGraph.LGraphCanvas("#HCA_canvas_id", this.lgraph);
        this.lgraphcanvas.background_image = null //get rid of dark grid and make it just white background
        //this.lgraphcanvas.canvas.addEventListener("drop", function(event) {// does nothing
        //    inspect("got drop")
       // })
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
                            ipg_to_json.parse(source_path, source)
                    }
                }, 1300) //should be AFTER CorLib is loaded
            }
            catch (err) {
                warning("The text in the editor did not represent a valid HCA application<br/> so starting a new one.")
            }
        }
        //HCA_canvas_id.addEventListener("drop", function(event) {// doesn't work for dropping a block
        //        inspect("got drop")
        //    })
    }

    static clear(){
        this.lgraph.clear()
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

    static js_to_HCA(){
        if( Editor.current_buffer_needs_saving &&
            (Editor.get_javascript().trim().length > 0)){
            warning("The editor has unsaved changes.<br/>" +
                "Please save it or delete all the content before switching the view to HCA.")
            //code_view_kind_id.value = "JS"
            return
        }
        let source = Editor.get_javascript().trim()
        try {
            HCA.init(Editor.current_file_path, source) //for error messages only
            globalThis.HCA_dom_elt.focus()
        }
        catch(err){
            //code_view_kind_id.value = "JS"
            $("#view_js_id").jqxRadioButton({ checked: true });
            Editor.view = "JS"
            Editor.myCodeMirror.focus()
            warning("Sorry, could not convert the JavaScript in the Editor buffer into a valid JSON object for HCA.<br/>" +
                "If you want to start a new HCA program, please create an empty editor buffer first.")
        }
    }

//_______SAVING____________
    static hca_to_js(){
        let old_js_full = Editor.get_text_editor_content(false) //get text regardless of view, if there's a selection, use it.
        let old_js = old_js_full.trim()
        let old_content_to_show = ((old_js.length > 50) ? (old_js.substring(0, 50) + "...") : old_js)
        old_content_to_show = old_content_to_show.replaceAll("\n", "<br/>")
        let sel_text = Editor.get_text_editor_content(true).trim()//get selection or empty string
        let sel_text_to_show = ((sel_text.length > 50) ? (sel_text.substring(0, 50) + "...") : sel_text)
        sel_text_to_show = sel_text_to_show.replaceAll("\n" + "<br/>")
        let replace_sel_or_insert_html = ((sel_text.length > 0) ?
            ( "<input type='submit' value='Replace Selection'/> of:<br/>" +
                sel_text_to_show) :
            "<input type='submit' value='Insert'/> at cursor position " + Editor.selection_start() + " of " + old_js_full.length + ".")
        let replace_all_innerHTML = ((old_js === "") ? " The text editor is now empty." :
                                                      (` the text editor content of:<br/>` +
                                                        old_content_to_show + `<p/>` +
                                                        replace_sel_or_insert_html)
        )

        show_window({title: "Save HCA Program to Text Editor",
                x: 200, y: 100, width: 800, height: 330,
                content: `<fieldset style="display: inline-block;vertical-align:top;">
                             <input type="radio" value="save_all"         name="save_obj_restriction"> Save ALL objects in the selected files.</input><br/>
                             <input type="radio" value="save_cur_obj_def" name="save_obj_restriction" checked>
                                  Save only objects that are connected to</input><br/> 
                                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;the current object definition<br/>
                                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;AND in the selected files.                                                                 <br/>
                             <hr/>
                             <b>Loaded Files:</b><br/>` +
                    this.make_file_checkboxes_html() +
                    `</fieldset>
                          <div style="display: inline-block;">
                          <input type='submit' value='Cancel'/> the save.<p/>
                          <input type='button' value='Inspect'/> what would be saved but<br/>
                          don't actually save it. Keeps this dialog up.<p/>
                          <input type='submit' value='Continue to JS'/> without saving anything.<br/>This leaves the text editor unchanged.<p/>
                          <input type='submit' value='Replace All'/>`  + replace_all_innerHTML +
                          `<p/>` +
                          `<input type='submit' value='Make new buffer'/> for the HCA content.
                          </div>
                         `,
                callback: "HCA.save_handler"
            }
        )
    }

    static make_file_checkboxes_html(){
        let result = ""
        for(let file of ipg_to_json.loaded_files){
            let checked = ""
            if(file.endsWith("built_in") ||
                file.endsWith("CorLib.ipg")) { //the default selected files
                checked = ""
            }
            else { checked = " checked "}
            result += '<input type="checkbox" ' +
                checked +
                ' value="' + "file:" + file + '" ' +
                ' >' + file + '</input><br/>'
        }
        return result
    }

    static save_handler(vals){
        if      (vals.clicked_button_value === "Cancel") {
            //code_view_kind_id.value = "HCA"
            $("#view_hca_id").jqxRadioButton({ checked: true });
            //view_hca_id.jqxRadioButton({ checked: true }); //simplifying to just using the dom elt id causes an error
            return
        }
        else if (vals.clicked_button_value === "Continue to JS") {
            html_db.replace_dom_elt(globalThis.HCA_dom_elt, Editor.the_CodeMirror_elt)
            Editor.view = "JS"
            Editor.myCodeMirror.focus()
        }
        else {
            let save_all_objects_in_selected_files = vals.save_all
            let selected_files = [] //this ends up being just a file list of the files to include object defs from
            let save_all_obj_defs = vals.save_obj_restriction === "save_all"
            for (let key in vals) {
                if (key.startsWith("file:")) {
                    if (vals[key]) {
                        selected_files.push(key.substring(5))
                    }
                }
            }
            let new_json_str
            if (save_all_obj_defs) {
                new_json_str = HCAObjDef.json_string_of_defs_in_files(selected_files)
            }
            else {
                new_json_str = HCAObjDef.json_string_of_defs_in_obj_def(undefined, selected_files)
            }
            new_json_str = js_beautify(new_json_str)

            if (vals.clicked_button_value === "Inspect") {
                let json_obj = JSON.parse(new_json_str)
                inspect(json_obj)
            } else if (vals.clicked_button_value === "Replace All") {
                html_db.replace_dom_elt(globalThis.HCA_dom_elt, Editor.the_CodeMirror_elt)
                Editor.set_javascript(new_json_str)
                Editor.view = "JS"
                Editor.myCodeMirror.focus()
            } else if ((vals.clicked_button_value === "Replace Selection") ||
                (vals.clicked_button_value === "Insert")) {
                setTimeout(function () {
                    html_db.replace_dom_elt(globalThis.HCA_dom_elt, Editor.the_CodeMirror_elt)
                    Editor.replace_selection(new_json_str)
                    Editor.view = "JS"
                    Editor.myCodeMirror.focus()
                }, 200)
            } else if (vals.clicked_button_value === "Make new buffer") {
                setTimeout(function () {
                    html_db.replace_dom_elt(globalThis.HCA_dom_elt, Editor.the_CodeMirror_elt)
                    Editor.edit_new_file()
                    Editor.set_javascript(new_json_str)
                    Editor.view = "JS"
                    Editor.myCodeMirror.focus()
                }, 200)
            }
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
            let call_obj = HCACall.call_name_to_call_obj(call_name)
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
        let call_obj = (call_name ? HCACall.call_name_to_call_obj(call_name) : "no selected call object")
        inspect({
            selected_call_object:       call_obj,
            selected_litegraph_node:    sel_node,
            current_obj_def:            HCAObjDef.current_obj_def,
            current_sheet:              HCAObjDef.current_sheet,
            sheets:                     HCAObjDef.sheets,
            name_to_dataset_object_map: Dataset.name_to_dataset_object_map,
            dataset_tree:               Dataset.dataset_def_tree,
            object_name_to_defs_map:    HCAObjDef.object_name_to_defs_map,
            obj_id_to_obj_def_map:      HCAObjDef.obj_id_to_obj_def_map,
            obj_def_tree:               HCAObjDef.obj_def_tree,
            "System Description top level": SysDesc.sys_desc_tree,
            "System Descriptions name map": SysDesc.name_to_sys_desc_object_map,
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

    //we only get keyup events from the keyboard, not keydown events.
    /*
    static clipboard = null
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
         HCAObjDef.update_current_obj_def_from_nodes()
         HCA.lgraph.clear()
         HCAObjDef.current_sheet = null
         HCAObjDef.current_obj_def = null
         current_obj_def_name_id.value = ""
         //current_obj_def_select_id.value = "" //this is a html select menu. todo I want this to leave no item checked, but this doesn't work,
                                              //it just makes the seleted item be the first item.
                                              //maybe I should have the first item be "" or
                                              //be "new Object Definition" and have that be the
                                              //same functionality as the File menu "New" for HCA???
        //current_obj_def_select_id.selectedIndex = -1; //from stack overflow, but fails
        current_obj_def_select_id.value = "__select an option__"

        sheet_kind_id.value = "not a sheet"
         out("<i>To define a new object:</i><br/>" +
                  "- Enter a new <b>objectName</b>.<br/>" +
                  "- Optionally edit its <b>TreeGroup</b>.<br/>" +
                  "- Optionally choose its <b>Sheet Status</b>.<br/>" +
                  "- To add a call, in the pallette under <b>Object Tree</b>, click on an object<br/>" +
                  " &nbsp; and choose <b>Make Call</b>.",
              "green")
         current_obj_def_name_id.focus()
    }

    static current_object_name_onchange(){
        let new_obj_name = current_obj_def_name_id.value
        if (HCAObjDef.current_obj_def) {
            if((HCAObjDef.current_obj_def.objectName !== new_obj_name)) {
                HCAObjDef.rename_obj_def(HCAObjDef.current_obj_def, new_obj_name)
            }
            //else {} do nothing. actually this clause should never hit
        }
        else { //no current_obj_def so we must be creating a new object.
            let tree_path = tree_path_id.value.trim()
            let tree_path_arr = tree_path
            let new_obj_def = new HCAObjDef(
                {objectName: new_obj_name,
                 TreeGroup:  tree_path_arr.TreeGroup,
                 source_path: source_path_id.value
                }
            )
            HCAObjDef.current_obj_def = new_obj_def
            HCA.add_to_obj_def_menu_maybe(new_obj_def)

            out("A new HCA Object definition for <b>" + new_obj_name + "</b> has been created.")
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
          "Simulator <button onclick='HCA.toggle_stop_run(event)' title='Toggle HCA simulation between stopped and running.\bNote: the simulator is not yet operational.' style='background-color:#ff7d8e;'>stopped</button><br/>" +
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
        HCA_palette_id.insertAdjacentHTML("beforeend", "<details title='Click on an underlined name\nto show a dialog box with options.'><summary style='font-weight:bold;'>Dataset Tree</summary>\n" +
                                            "<div  id='HCA_palette_datasets_id'>" +
                                            "</div></details>")
        HCA_palette_id.insertAdjacentHTML("beforeend", "<details title='Click on an underlined name\nto show a dialog box with options.'><summary style='font-weight:bold;'>Object Tree</summary>\n" +
                                           "<div  id='HCA_palette_make_objects_id'>" +
                                           "</div></details>")
        HCA_palette_id.insertAdjacentHTML("beforeend", "<details id='HCA_palette_sys_desc_id' title='Click on an underlined name\nto show a dialog box with options.'><summary onclick='SysDesc.show_no_sys_desc_tree_dialog_maybe(event)' style='font-weight:bold;'>System Desc Tree</summary>\n</details>")
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

    //just has the name, not the input types
    //this is returjs the dom_id for the objectNAME in the pallette
    static make_object_id(obj_def){
        let path = obj_def.TreeGroup.join("/") + "/" + obj_def.objectName
        return "make_obj_" + path + "_id"
    }

    static pending_rendering_dom_id = null //or string id of a folder pallette dom elt

    //creates tree path all the way down, then inserts the new link to make an obj_call of the obj_def
    //but only if this treegroup&objName are not already in the pallette
    static insert_obj_def_into_pallette(obj_def, folder_dom_elt=HCA_palette_make_objects_id, tree_arr_index_of_next_folder=0){
        if(HCA.pending_rendering_dom_id && !window[HCA.pending_rendering_dom_id]) { //take a lap waiting for
            setTimeout(function(){
                HCA.insert_obj_def_into_pallette(obj_def, folder_dom_elt, tree_arr_index_of_next_folder)
            }, 200)
            return
        }
        let dom_id = this.make_object_id(obj_def)
        if(globalThis[dom_id]) { //we already have this treegroup & object name in the pallette
            return
        }
        if(typeof(folder_dom_elt) === "string"){
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
            let tree_path = obj_def.TreeGroup.join("/")
            let tree_path_and_obj_name = tree_path + "/" + obj_def.objectName
            if(obj_def.objectName === "Output") {
                 let junk = "junk" //for debugging only
            }
            HCAObjDef.register_with_litegraph(obj_def)
            let html_to_insert = `<div class="hca_obj_def"  id="` + dom_id + `" onclick="HCAObjDef.show_obj_def_dialog(event)">` +  obj_def.objectName + `</div>`   //"HCA.make_and_add_block('` + tree_path_and_obj_name + `', event)">` + obj_def.objectName + "</div>"
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

    //only called when HCA is up
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
            try {
                HCA.edit_idl_or_json_file(path)
            } catch (err) {
                dde_error(path + " doesn't contain vaild HCA object(s).<br/>" + err.message)
            }
                //Editor.add_path_to_files_menu(path) //now down in edit_file because edit_file is called
                //from more places than ready.
        }
    }

    static async edit_idl_or_json_file(path){
        await ipg_to_json.parse(path)
    }

    static choose_and_edit_local_file(){

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

    static spread_factor = 1

    //peform the spreed less or spreed more operation.
    //spread less wehn factor is < 1, spread more hwen factor is > 1.
    /*static spread(factor=1/1.5){
        for(let obj_call of HCAObjDef.current_obj_def.prototypes){
            obj_call.x *= factor
            obj_call.y *= factor
        }
        //HCA.lgraphcanvas.ds.offset[0] =
        //HCA.lgraphcanvas.ds.offset[1] *= (factor * -1)
        HCAObjDef.redraw_obj_def()
        this.spread_factor *= factor
    }*/

    static spread(factor=1/1.5){
        let x_offset = HCA.lgraphcanvas.ds.offset[0]
        let actual_displayed_canvas_width = HCA_canvas_wrapper_id.offsetWidth
        let center_x = x_offset + (actual_displayed_canvas_width / 2)

        let y_offset = HCA.lgraphcanvas.ds.offset[1]
        let actual_displayed_canvas_height = HCA_canvas_wrapper_id.offsetHeight
        let center_y = y_offset + (actual_displayed_canvas_height / 2)

        let nodes = HCA.lgraph._nodes //remake cur_obj_def.prototypes from this
        for (let node of nodes) {
            let orig_x  = node.pos[0]
            let new_x   = ((orig_x - center_x) * factor) + center_x
            node.pos[0] = new_x

            let orig_y  = node.pos[1]
            let new_y   = ((orig_y - center_y) * factor) + center_y
            node.pos[1] = new_y
        }
        HCAObjDef.update_current_obj_def_from_nodes()
        //HCA.lgraphcanvas.dirty_canvas = true; //without this the new canvas block positions are not shown
        HCAObjDef.redraw_obj_def()  //without doing this, the wires are not moved with their blocks
        this.spread_factor *= factor
    }

    //not really the center but for a small display, it returns
    // a center that is good, for a large displayed canvas
    static center_point_in_call_coordinates() {
        return [300, 100]
    }

    static home(){
        //this.lgraphcanvas.scale = 1
        //this.lgraphcanvas.offset = [0,0]
        //this.lgraphcanvas.drawFrontCanvas()
        //HCA_canvas_id.top = 0 doesn't work by itself
        this.lgraphcanvas.ds.reset()
        this.spread(1 / this.spread_factor)
        this.lgraphcanvas.drawFrontCanvas()
    }

    static menu_label_to_obj_name(label){
        if(label.startsWith("CurSheet:"))     { return label.substring(9) }
        else if(label.startsWith("WipSheet:")){ return label.substring(9) }
        else { return label }
    }

    static update_obj_def_select_dom_elt(new_label){
        current_obj_def_select_id.value = new_label
    }

    static obj_def_select_onchange(event){
        let obj_id    = event.target.value
        if(obj_id === "__select an option__") {}
        else {
            HCAObjDef.update_current_obj_def_from_nodes()

            let colon_index = obj_id.indexOf(":")
            if (colon_index >= 0) { //remove the "Cursheet:" or "WipSheet:" prefix
                obj_id = obj_id.substring(colon_index + 1)
            }
            HCAObjDef.display_obj_def(obj_id)
        }
    }

    static add_to_obj_def_menu_maybe(obj_def){
        let label = obj_def.obj_id
        let is_sheet = false
        if     (obj_def.CurrentSheet) { label = "CurSheet:" + label; is_sheet = true}
        else if(obj_def.WipSheet)     { label = "WipSheet:" + label; is_sheet = true}
        for(let dom_elt of current_obj_def_select_id.children){
            if(dom_elt.innerText === label) { return}
        }
        let the_html = "<option>" + label + "</option>"
        let pos = (is_sheet ? "afterbegin" : "beforeend")
        current_obj_def_select_id.insertAdjacentHTML(pos, the_html)
        if(obj_def === HCAObjDef.current_obj_def) { //then select the correct item in the menu so it will be checked if the user pulls down the menu
            let menu_item_label
            if (obj_def.CurrentSheet) {
                menu_item_label = "CurSheet:" + obj_def.obj_id
            } else if (obj_def.WipSheet) {
                menu_item_label = "WipSheet:" + obj_def.obj_id
            } else {
                menu_item_label = obj_def.obj_id
            }
            current_obj_def_select_id.value = menu_item_label
        }
    }

    static find(search_string){
        let dataset_matches = Dataset.find_datasets(search_string)
        let [def_name_match, included_in_def_name, def_contains_matching_calls, matching_calls] = HCAObjDef.find_obj_defs(search_string)
        let sys_desc_matches = SysDesc.find_sys_descs(search_string)
        inspect({"Definition name matches":  def_name_match,
                      "Definition name includes": included_in_def_name,
                      "Definition contains matching calls": def_contains_matching_calls,
                      "Matching calls": matching_calls,
                      ...dataset_matches,
                      ...sys_desc_matches},
                undefined,
            'HCA data containing: "' + search_string + '"')
    }

} //end HCA class



