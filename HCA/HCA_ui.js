const LiteGraph = require("litegraph.js").LiteGraph; //needs to be at top of file

//copied from https://github.com/jagenjo/litegraph.js/blob/master/src/litegraph.js
var LGraphCanvas_prototype_processKey = function(e) { //used in init
    if (!this.graph) {
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
                                   {id: "HCA_palette_id", style: {width:150, height: 400, "background-color": "#ffe0cd", display: "inline-block"}},
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
        let json_obj = null
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
                            dde_error("Vivi.init passed an invalid JSON string<br/>You can switch to an empty editor buffer and start HCA.<br/>Invalid JSON:<br/>" + json_string) //don't start up HCA because going BACK to JS, will wipe out whatever JS is in that editor buffer. Better to let the user make an empty buffer and start HCA.
                        }
                    }
                    else {
                        dde_error("Vivi.init passed an invalid JSON string<br/>You can switch to an empty editor buffer and start HCA.<br/>Invalid JSON:<br/>" + json_string) //don't start up HCA because going BACK to JS, will wipe out whatever JS is in that editor buffer. Better to let the user make an empty buffer and start HCA.
                    }
                }
            }
        }
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

        if(json_obj) {
            this.lgraph.configure(json_obj) //configure must take a JSON obj, not a JSON string (which is the say its documented in the LiteGraph code
        }
        this.lgraph.start(100) //arg is number of milliseconds betweeen steps, default 1. don't need this for pure graphics
    }

    static get_javascript(use_selection=false){
        let json_string = JSON.stringify(HCA.lgraph.serialize())
        return json_string
    }

    static make_node_button(type, button_name, action_function){
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
        let but = make_dom_elt("button", {margin: "2px"}, button_name)
        if(!action_function) {
            action_function = function() {
                                HCA.make_and_add_node(type, button_name)
                              }
        }
        but.onclick = action_function
        HCA_palette_id.append(but)
    }

    static clipboard = null

    //we only get keyup events from the keyboard, not keydown events.
    static node_keyup_action(event, node){
        out("got key up with: " + this)
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

    }

    static make_and_add_node(type, button_name){
        let node
        if(button_name == "number") {
            node = LiteGraph.createNode(type, button_name, {size: [150, 20]})
        }
        else {
            node = LiteGraph.createNode(type, button_name)
        }


        function logKey(e) {
            log.textContent += ` ${e.code}`;
        }
        //node_const.pos = [5,35];
        this.lgraph.add(node);
        node.onKeyUp = function(event) {
            HCA.node_keyup_action.call(HCA, event, node)
        }
        //node_const.setValue(4.5);
    }

    static make_group_cb(group_name){
        if(group_name) {
            HCA.lgraph.add(new LiteGraph.LGraphGroup(group_name))
        }
    }
    static palette_objects = []

    //don't use "this" inside this method since its called with a timeout. Use HCA instead.
    static populate_palette(){
        HCA.make_node_button(null,
            "make_group",
            function() {
                prompt_async({doc: "Enter a name for the new group.",
                              default_value: "group",
                              callback: HCA.make_group_cb})
            }
        )
        HCA.make_node_button(null,
                              "inspect_net",
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
        /*HCA.make_node_button("basic/const", "number") //can't use "this" for the subject, must uses HCA
        HCA.make_node_button("basic/and")
        HCA.make_node_button("basic/or")
        HCA.make_node_button("basic/invert")
        HCA.make_node_button("basic/watch")*/
    }
}


/* making new node types
See examples https://www.javascripting.com/view/litegraph-js
node constructor class

function MyAndNode() {
    this.addInput("A","number");
    this.addInput("B","number");
    this.addOutput("A&B","number");
    this.size = [80, 40] //width and height
    this.properties = { precision: 1 };
}
MyAndNode.title = "and"; //name to show
MyAndNode.prototype.onExecute = function() {
    var A = this.getInputData(0);
    if( A === undefined )
        A = 0;
    var B = this.getInputData(1);
    if( B === undefined )
        B = 0;
    this.setOutputData( 0, A & B );
}
LiteGraph.registerNodeType("basic/and", MyAndNode ); //register in the system
HCA.palette_objects.push(["basic/and"])



function MyOrNode() {
    this.addInput("A","number");
    this.addInput("B","number");
    this.addOutput("A|B","number");
    this.size = [80, 40] //width and height
    this.properties = { precision: 1 };
}
MyOrNode.title = "or"; //name to show
MyOrNode.prototype.onExecute = function() {
    var A = this.getInputData(0);
    if( A === undefined )
        A = 0;
    var B = this.getInputData(1);
    if( B === undefined )
        B = 0;
    this.setOutputData( 0, A | B );
}
LiteGraph.registerNodeType("basic/or", MyOrNode ); //register in the system
HCA.palette_objects.push(["basic/or"])


function MyInvertNode() {
    this.addInput("A","number");
    this.addOutput("!A","number");
    this.size = [80, 20] //width and height
    this.properties = { precision: 1 };
}
MyInvertNode.title = "invert"; //name to show
MyInvertNode.prototype.onExecute = function() {
    var A = this.getInputData(0);
    if( A === undefined )
        A = 0;
    let out = ((A === 1)  ? 0 : 1)
    this.setOutputData(0, out);
}
LiteGraph.registerNodeType("basic/invert", MyInvertNode); //register in the system
HCA.palette_objects.push(["basic/invert"])

*/

/*
Notes from https://github.com/jagenjo/litegraph.js/blob/master/src/litegraph.js, most of the code.
LiteGraph.Nodes {} name-value pairs of the built in nodes. Excludes my designed nodes.
LiteGraph.registered_node_types  {} name-value pairs of the built in  and custom nodes
HCA.lgraph._nodes an array of all node instances installed in mny lgraph
HCA.lgraph._nodes_in_order  an array of all the nodes
HCA.lgraph._nodes_in_order[0] the first node
HCA.lgraph._nodes_in_order[0].is_selected //true or false
HCA.lgraph.remove(node)
HCA.lgraph.clear() //remove all nodes
HCA.lgraph.start()
HCA.lgraph.stop()
HCA.lgraph.runStep(number_of_steps_to_run)
HCA.lgraph.arrange(margin_in_pixels) //I guess auto-layout!
HCA.lgraph.getNodeById(id)
HCA.lgraph.addGlobalInput(...)
HCA.lgraph.addOutput(...) //global output
HCA.lgraph.serialize() //makes a json object of all the data in this lgraph
HCA.lgraph.configure(json_string, keep_old_boolean) //Configure a graph from a JSON string
HCA.lgraph._groups  a array, initially empty.


LiteGraph.NODE_sizes and colors for the box, fonts, etc.
LiteGraph.NODE_DEFAULT_BGCOLOR = "#353535"

LiteGraph.createNode(type, // "basic/const"
                     title,
                     options)
new LiteGraph.Subgraph() //I guess
LiteGraph.registered_node_types  {} key value pairs of the string type  a la "basic/const" and val of its constructor fn.
       about 200 of them including "basic/boolean" "basic/string" "basic/script" "events/delay"
       "graph/Subgraph" (can probably use this to make a subgraph.
       "input/gamepad"

LiteGraph.wrapFunctionAsNode: ƒ ( name, func, param_types, return_type, properties )

NODES:
slot means a non-neg int that refers to a specific input or output in the node,
  i.e. an index into the array that represents inputs or outputs.

properties are user-defined name-value pairs with some extra info.
LGraphNode.prototype.addProperty = function(name, default_value, type, extra_info)
Get a prop value with:
LGraphNode.prototype.id LGraphNode.prototype.properities[name]
Set a prop vslue with:
LGraphNode.prototype.id LGraphNode.prototype.properities[name] = new_val

LGraphNode.prototype.flags.collapsed   (boolean)
LGraphNode.prototype.serialize() returns JSON obj.
LGraphNode.prototype.clone = function()
LGraphNode.prototype.addWidget = function( type, name, value, callback, options )
 LGraphNode.prototype.alignToGrid = function()

LGraphNode.prototype.trace = function(msg)   Console output
LGraphNode.prototype.loadImage = function(url) //umm could I make a real AND gate?
         //loads the image from LiteGraph.node_images_path but
         //doesn't look like it displays this image anywhere nor in the node itself.

LGraphNode.prototype.collapse = function(force)

GROUPS
HCA.lgraph._groups  a array, initially empty.
function LGraphGroup(title)
new LiteGraph.LGraphGroup("mytitle")  //make a group.
HCA.lgraph.add(new LiteGraph.LGraphGroup("mytit"))  //add new group to grpah, it shows with title
you can drag the lower right cornder of the group rect to exand or contract it.
You can drop a node in a group, then drag teh group and it keeps the node in the group.
You can drag a node and drop it inside the group

_____LGraphCanvas______ this is NOT the dom elt for the "canvas" tag, which I store in HCA_canvas_id
But you can get all the canvases from HCA.lgraph.list_of_graphcanvas
and to get the first one, HCA.lgraph.list_of_graphcanvas[0]
HCA.lgraph.list_of_graphcanvas[0].canvas === HCA_canvas_id

LGraphCanvas.link_type_colors
LGraphCanvas.prototype.getTopGraph()
LGraphCanvas.prototype.openSubgraph = function(graph)  // opens a graph contained inside a node in the current grap
LGraphCanvas.prototype.closeSubgraph = function()
 LGraphCanvas.prototype.getCurrentGraph = function()
 LGraphCanvas.prototype.copyToClipboard
 LGraphCanvas.prototype.pasteFromClipboard = function()
 LGraphCanvas.prototype.selected_nodes   //an array.
 LGraphCanvas.prototype.processNodeDblClicked = function(n)
 LGraphCanvas.prototype.selectNode = function(node, add_to_current_selection)
  LGraphCanvas.prototype.deleteSelectedNodes = function()
  LGraphCanvas.prototype.setZoom = function(value=1, zooming_center)
  LGraphCanvas.prototype.drawNodeWidgets = function(node, posY, ctx,active_widget)
     doesn't draw an img but maybe shows the way to do it.
 LGraphCanvas.prototype.drawGroups = function(canvas, ctx)
 Lots of menu methods in here but no obvious create menu, show menu
 LGraphCanvas.onShowPropertyEditor = function(item, options, e, menu, node) //???properties editor?
  LGraphCanvas.prototype.prompt = function(title, value, callback, event, multiline) {
LGraphCanvas.prototype.showSearchBox = function(event) {
 LGraphCanvas.prototype.createDialog = function(html, options)
 LGraphCanvas.prototype.createPanel = function(title, options)
 LGraphCanvas.prototype.showShowNodePanel = function( node ) //what's this ???
 LGraphCanvas.prototype.showSubgraphPropertiesDialog = function(node)

 LGraphCanvas.onMenuNodeToSubgraph = function(value, options, e, menu, node)
LGraphCanvas.prototype.getCanvasMenuOptions = function()
LGraphCanvas.prototype.getNodeMenuOptions = function(node)//called by processContextMenu to extract the menu list
 LGraphCanvas.prototype.getGroupMenuOptions = function(node)
 function ContextMenu(values, //(allows object { title: "Nice text", callback: function ... })
                       options) {


GraphCanvas.prototype.drawNode(node, ctx);
  which draws links, inputs, outputs,
  calls GraphCanvas.prototype.drawNodeShape(node, ctx,size,color,bgcolor,
                                            node.is_selected,node.mouseOver)
    extra stuff can be drawn if the user defines:
     LGraphNode.prototype.onDrawForeground
     with some help via node.onDrawCollapsed(ctx, this)
     node.onDrawForeground(ctx, this, this.canvas)  (and note that the default value
       for onDrawForeground is null, in which case this is not called.
       onDrawBackground: render the background area inside the node (only in edit mode)
    But most of the node is drawn by drawNodeShape(node, ...),
    unfortunate because I'd have to hack this monster fn to special case
    its node arg to, say draw an image in place of the other svg draw fns.


questions
You can write any feedback to javi.agenjo@gmail.com
???More complete doc somewhere?
???example of an app using many features of this library?
   https://tamats.com/projects/litegraph/editor/
   https://tamats.com is Javi's website.
???Cut/copy/paste keystrokes fail. Is there a way to interactively delete a node?
???double click on graph background displays Search type-in but typing in "and"
  creates the node "Rand" not my node "and" which is registered.
???click on group does not highlight/select it.
???relationship of subgraph and group?
???How to bring up context menu on click right (on background, node, group)
??? how to create subgraphs, expand and shrink them.


??? How to make a node be rendered as a small image, like and AND gate with input and output circles?
From: https://github.com/jagenjo/litegraph.js/tree/master/guides
ou can draw something inside a node using the callbacks onDrawForeground and onDrawBackground. The only difference is that onDrawForeground gets called in Live Mode and onDrawBackground not.
Both functions receive the Canvas2D rendering context and the LGraphCanvas instance where the node is being rendered.
You do not have to worry about the coordinates system, (0,0) is the top-left corner of the node content area (not the title).
node.onDrawForeground = function(ctx, graphcanvas)
{
  if(this.flags.collapsed)
    return;
  ctx.save();
  ctx.fillColor = "black";
  ctx.fillRect(0,0,10,this.size[1]);
  ctx.restore();
}

*/


