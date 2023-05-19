/*
objectName objectName of the method/object that this call is calling
call_name  same as objectname if only one such call in the definition,
          but will be objectname:A  for the 2nd objectname:B for the 3rd.
          in an lgraph node, there is node.title,  with value: call_name
call_obj_id: obj_id of the actual object overload (obj_def) that is being called,
  derived from objectName and concat input types from inputs.
  create and set this in the constructor of HCACall
  in an lgraph node, there is node.type,  with value something like "basic/Everyother,Varient
     ie made up of a lgraph category followed by the obj_id of the obj_def being called by
     this call.
containing_obj_id: obj_id of the obj that this call is in.
          Set in ObjDef constructor when processing its calls.
inputs:  same as objDef, array of {type: "str", name: "str"}
outputs: same as objDef, array of {type: "str", name: "str"}
x = 0
y = 0
width
height
line: the line from parsing
other misc attributes from ipg file such as:
System="PEn",KeepObject="One side",PadLoc="AA24"
Welcome to CoreLib 3.1.1Arial,20,8388608,1
(comment, fontName, fontSize, fontColor, fontMysteryInt

NO
source_path
TreeGroup
objectType
prototypes

new HCACall is called in HCAObjDef constructor by looping thru the
json objects for prototypes.
when calling the HCACall constructor, pass in the obj_def
the call is in. Grab the obj_id from that to stick in the call instance's containing_obj_id
Then create the call_obj_id from the obj_def.objectName and the call's input types.
MAYBE: if the call_name doesn't include a colon, check to see
if the obj_def already has a call of that (objectName) and
if so, find the latest call_name Letter, increment it, and
use that in the suffix to create the call_name.

When can I do the check of "is the obj_id actually defined?"
At the end of ipg_to_json.parse BUT I won't have the obj_id
at that point unless I make it in ipg_to_json.parse_object
rather than the constructor for HCACall.
Hmm end of parse can loop thru all objdefs in obj_id_to_obj_def_map
and find just those wit the passed in source_path,
then loop thru all the prototypes (will be instances of HCACall,
grab its obj_id and check to see it exists in
obj_id_to_obj_def_map.
If not, stick it on a list, then make a "report"
and print out a warning(
"In foo.ipg, there are 7 calls to an object def that doesn't exist:
Each line below contains the
- objname and input types of the obj def called,
- call_name:A
- the object Def (with input types) called.<br/>")


 */


globalThis.HCACall = class HCACall{
    constructor(json_obj, containing_def_obj){ //dont deffault this. IF its not passed, we don't attempt touniquify the call_name on purpose
        if(!json_obj.objectName){
            dde_error("Attempt to create an HCA object call without a objectName.<br/>" +
                "Other Attributes: " + JSON.stringify(json_obj))
        }
        //this.call_obj_id = HCAObjDef.make_obj_id(json_obj)
        //let the_obj_def = HCAObjDef.obj_id_to_obj_def_map[call_obj_id]

        let TreeGroup_changed = false
        for(let key of Object.keys(json_obj)){
            let val = json_obj[key]
            this[key] = val
        }
        if(containing_def_obj) {
            this.make_call_name_unique_maybe(containing_def_obj)
        }
        if(!this.inputs)  { this.inputs  = [] }        //CoreLib doesn't have an outputs field.
        if(!this.outputs) { this.outputs = [] } //CoreLib doesn't have an outputs field.
        if(!this.line){
            this.line = JSON.stringify(json_obj)
        }
        this.call_obj_id = HCAObjDef.make_obj_id(json_obj)
    }

    static xy_call_to_node_pos_multiplier = 40

    //if call name already has a colon in it, leave it alone, else potentially make it unique
    //with a no suffix OR a :A suffix or greater suffix.
    make_call_name_unique_maybe(containing_def_obj=HCAObjDef.current_obj_def){
        let obj_name
        if(this.call_name && (this.call_name.indexOf(":") > -1)) {} //already got a suffix in the call_name so presume its good as is
        else {
            this.call_name = this.first_free_call_name(containing_def_obj)
        }
    }

    //call names are made up in the progression of strings:
    // foo, foo:A, foo:B ... foo:Z, foo:AA, foo:AB ... foo:AZ, foo:BA, foo:BB ...
    //with 2 suffix chars we can have 677 possibilities: 1 + (26 * 26)
    first_free_call_name(containing_def_obj=HCAObjDef.current_obj_def){
        return HCACall.first_free_call_name_aux(containing_def_obj, this.objectName)
    }

    //also called when pasting a copied node into the lgraphcanvas
    static first_free_call_name_aux(containing_def_obj=HCAObjDef.current_obj_def, objectName_to_call){
        for(let i = 64; i <= 90; i++) {
            let outer_suffix_char = ((i === 64) ? "" : String.fromCharCode(i))
            for(let j = 64; j <= 90; j++) {
                let colon_maybe = (((i === 64) && (j === 64)) ? "" : ":")
                let inner_suffix_char = ((j === 64) ? "" : String.fromCharCode(j))
                let possible_call_name = objectName_to_call + colon_maybe + outer_suffix_char + inner_suffix_char
                let existing_call_obj  = HCACall.call_name_to_call_obj(possible_call_name, containing_def_obj)
                if (!existing_call_obj) {
                    return possible_call_name
                }
            }
        }
    }

    static call_name_to_call_obj(call_name, containing_def_obj=HCAObjDef.current_obj_def){
        for(let call_obj of containing_def_obj.prototypes){
            if(call_obj.call_name === call_name){
                return call_obj
            }
        }
        return null
    }

    //obj_def_to_call is use to get the name and inputs of the call
    //does not cause display
    static make_and_add_call_to_definition(obj_def_to_call, add_to_obj_def=HCAObjDef.current_obj_def){
        let json_call = {
            objectName: obj_def_to_call.objectName,
            call_name:  obj_def_to_call.objectName,
            inputs:     obj_def_to_call.inputs,
            outputs:    obj_def_to_call.outputs,
            containing_obj_id: HCAObjDef.make_obj_id(add_to_obj_def)
        }
        let new_call = new HCACall(json_call, add_to_obj_def)
        add_to_obj_def.prototypes.push(new_call)
        return new_call
    }

    //just called from dialog button "Make Call"
    static display_call_obj(call_obj){
        let node_path = "basic/" + call_obj.call_obj_id
        let node = LiteGraph.createNode(node_path, call_obj.call_name)
        if(!node){
            shouldnt("Attempt to call LiteGraph.createNode with node_path: " + node_path +
                "<br/>but that hasn't had HCAObjDef.register_with_litegraph() called on it.")
        }
        else {
            HCA.lgraph.add(node);
            this.node_add_usual_actions(node)
            return node
        }
    }

    //1. switches to editing the displayed containing obj def.
    //2. positions the call to 300 pixels to the left and
    //3. 150 pixes down from the top (a cheap kind of "centering" of the call in the canvas)
    //4. changes zoom back to 1 (orig)
    //5. selects the call/node.
    //does not change the spread.
    //HTML canvas 0,0 is in upper left.
    static display_call_from_inspector(containing_obj_id, call_name){
        HCAObjDef.display_obj_def(containing_obj_id)
        //HCA.lgraphcanvas.drawFrontCanvas()
        let node = this.call_name_to_node(call_name)
        this.center_on_node(node) //HCA.lgraphcanvas.centerOnNode(node) lgraphcanvas.centerOnNode doesn't seem to work, so I wrote my own, simplier one.
        HCA.lgraphcanvas.selectNodes([node])
        //HCA.lgraphcanvas.graph.afterChange();
        //HCA.lgraphcanvas.drawFrontCanvas()
    }

    //patthered after LGraphCanvas.prototype.centerOnNode
    //but changed canvas.width and canvas.height to the actual shown
    //width and height, not the full canvas width and height
    static center_on_node(node){
        /* copied from litegraph source code, but doesn't work.
          HCA.lgraphcanvas.ds.offset[0] =
            -node.pos[0] -
            node.size[0] * 0.5 +
            (HCA_canvas_wrapper_id.width //this.canvas.width
                * 0.5) / HCA.lgraphcanvas.ds.scale;
        HCA.lgraphcanvas.ds.offset[1] =
            -node.pos[1] -
            node.size[1] * 0.5 +
            (HCA_canvas_wrapper_id.height
                * 0.5) / HCA.lgraphcanvas.ds.scale;
        HCA.lgraphcanvas.setDirty(true, true);
         */
        HCA.lgraphcanvas.ds.reset() //unzooms to orig scale.
        //Also offsets to 0, but that part shouldn't matter.
        //panning and zooming canvas does not change a calls x and y pos,
        //but spreading does
        //HCA.lgraphcanvas.ds.scale has the zoom factor. 1 means initial, no zoom.
        //HCA.lgraphcanvas.ds.visible_area is an array of 4 floats,
        //[neg_x_offset, neg_y_offset, width, height]
        //width and height do not change with scrolling, panning, or
        //resizing DDE splitter pane to show more canvas, but
        //do change with zooming
        HCA.lgraphcanvas.ds.offset[0] = 300 - node.pos[0]  //x pos
        HCA.lgraphcanvas.ds.offset[1] = 150 - node.pos[1]  //y pos
    }

    //returns existing call
    static node_id_to_existing_HCACall(node_or_node_id, call_objs_array = HCAObjDef.current_obj_def.prototypes){
        let node_id
        if(typeof(node_or_node_id) === "number") { node_id = node_or_node_id}
        else { node_id = node_or_node_id.id}
        for(let call_obj of call_objs_array){
            if(call_obj.node_id === node_id){
                return call_obj
            }
        }
        return null //probably an error
    }

    //called by update_current_obj_def_from_nodes
    //makes  a new HCAcall from the node input
    static node_to_new_HCACall(node){
        let [objectName, postfix_letter] = node.title.split(":")
        let new_inputs = []
        for(let node_in of node.inputs){
            let hca_in =  {name: node_in.name, //ex: "In1"
                           type:node_in.type //ex: "Variant"
                          }
            new_inputs.push(hca_in)
        }
        let new_outputs = []
        for(let node_out of node.outputs){
            let hca_out =  {name: node_out.name, //ex: "In1"
                            type:node_out.type //ex: "Variant"
                           }
            new_outputs.push(hca_out)
        }
        let call_obj_id = objectName
        for(let new_in of new_inputs){
            call_obj_id += "," + new_in.type
        }
        let output_count = node.outputs.length
        call_obj_id += "," + output_count + "_outputs"
        return new HCACall({
            objectName:  objectName,
            call_name:    node.title, //foo:A
            call_obj_id: call_obj_id,
            //containing_obj_id: set this in update_current_obj_def_from_nodes
            node_id:     node.id, //needed temporarily
            inputs:      new_inputs,
            outputs:     new_outputs,
            x:           node.pos[0] / this.xy_call_to_node_pos_multiplier, //node has int, needs scaling?
            y:           node.pos[1] / this.xy_call_to_node_pos_multiplier, //node has int, needs scaling?
            width:       node.size[0], //node has int
            height:      node.size[1]  //node has int
        })
    }

    static call_name_to_node(call_name, nodes= HCA.lgraph._nodes){
        for(let node of nodes){
            if(node.title === call_name){
                return node
            }
        }
    }

    static call_name_to_call_obj(call_name, obj_def = HCAObjDef.current_obj_def){
        for(let call_obj of obj_def.prototypes){
            if(call_obj.call_name === call_name){
                return call_obj
            }
        }
        return null
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

        let title_letters_length = obj_call.call_name.length
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

    //was make_lgraph_node_json
    static call_obj_to_new_node(obj_call, id){
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
            "type":  "basic/" + obj_call.call_obj_id, //HCAObjDef.call_name_to_def_name(obj_call.objectName),
            "title": obj_call.call_name,
            "pos":  [obj_call.x * this.xy_call_to_node_pos_multiplier,
                     obj_call.y * this.xy_call_to_node_pos_multiplier],
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

    delete(){
        let call_name = this.call_name
        let node = HCACall.call_name_to_node(call_name)
        node.graph.remove(node)
        //because I can't find a deleteNode method, I have to use deleteSelectedNodes.
        //I want to be careful to only delete the one node the user clicked on
        //so I resorted to the kludge below.
        //let the_lgraph_canvas = node.graph.list_of_graphcanvas[0]
        //the_lgraph_canvas.deselectAllNodes()
       // the_lgraph_canvas.selectNode(node) //with no
       // the_lgraph_canvas.deleteSelectedNodes() //clicking on a node selects it and deselects all others
    }

    static show_call_dialog(call_obj){
        let call_name = call_obj.call_name
        show_window({
            title: "Choose Call Operation",
            x:200, y:100, width:275, height:180,
            content: `for: <b>` + call_name + `</b><br/>
                     <input type="hidden" name="call_name" value="` + call_name + `"/>   
                     <input type="submit" value="Edit Attributes"  style="margin:5px;"/><br/>       
                     <input type="submit" value="Edit Called Definition"  style="margin:5px;"/><br/>
                     <input type="submit" value="Delete"           style="margin:5px;"/><br/>
                     <input type="submit" value="Find"             style="margin:5px;"/>`,

            callback: "HCACall.show_call_dialog_cb"
        })
    }

    static show_call_dialog_cb(vals){
        let call_name = vals.call_name
        let call_obj  = HCACall.call_name_to_call_obj(call_name)
        let called_obj_def     = HCAObjDef.obj_id_to_obj_def_map[call_obj.call_obj_id]
        let containing_obj_def = HCAObjDef.obj_id_to_obj_def_map[call_obj.containing_obj_id]

        if(vals.clicked_button_value === "Edit Attributes"){
            HCACall.show_edit_attribute_dialog(call_obj)
        }
        else if(vals.clicked_button_value === "Edit Called Definition"){
            //HCAObjDef.update_current_obj_def_from_nodes()
            SW.close_window(vals.window_index)
            HCAObjDef.display_obj_def(called_obj_def)
        }
        else if(vals.clicked_button_value === "Delete"){
            SW.close_window(vals.window_index)
            call_obj.delete()
        }
        else if(vals.clicked_button_value === "Find"){
            inspect({"Called definition":                     called_obj_def,
                          "Containing definition":                 containing_obj_def,
                          "Defs with similar calls":               HCACall.find_obj_defs_calling_obj_id(call_obj.call_obj_id),
                          "Similar calls (obj_name,in1_type ...)": HCACall.find_call_objs_having_call_obj_id(call_obj.call_obj_id)
                          }
            )
            //find_doc_button_id.click()
        }
        else if(vals.clicked_button_value === "close_button"){
            SW.close_window(vals.window_index)
        }
        else {
            shouldnt("In show_dataset_dialog_cb got invalid clicked_button_value: " +
                vals.clicked_button_value)
        }
    }

    static non_attribute_names = ["call_name", "call_obj_id", "containing_obj_id",
                                  "inputs", "line", "objectName", "outputs"
                                 ]

    static attribute_names_in_call_obj(call_obj){
        let result = []
        for(let key of Object.keys(call_obj)){
            if(!this.non_attribute_names.includes(key)) {
                result.push(key)
            }
        }
        return result
    }

    static show_edit_attribute_dialog(call_obj){
        let names_and_values = ""
        let description_value = ""
        let attr_count = 0
        for(let key of this.attribute_names_in_call_obj(call_obj)){
            let val =  call_obj[key]
            if(typeof(val) === "string") { //val might be a number
                val = val.trim()
            }
            if(key === "description"){
                description_value = val
            }
            else {
                names_and_values += key + ": " + val + "\n"
                attr_count += 1
            }
        }
        let plural = ((attr_count === 1) ? "" : "s")
        let count_comment = "<i>&nbsp;&nbsp;" + attr_count +  " existing attribute" + plural + ", one per row.</i>"
        show_window(
            {title: "Edit Attributes",
                x:200, y:100, width:450, height:350,
                content: `of Object Call: <b>` + call_obj.call_name + `</b>` +
                    `<input type="hidden"                               value="` + call_obj.objectName + `" name="object_name"/>` +
                    `<input type="hidden"                               value="` + call_obj.call_name  + `" name="call_name"/>` +
                    `<div style="margin:5px;"><b><i>Name: Value</i></b> ` + count_comment + `</div>` +
                    `<textarea id="hca_attributes_id" rows="5" cols="50" style="margin:5px;">`  + names_and_values  + `</textarea><br/>` +
                    `<b><i>Description:</i></b><br/>` +
                    `<textarea id="hca_description_id" rows="5" cols="50" style="margin:5px;">` + description_value + `</textarea><br/>` +
                    `<input type="button" value="Update Call"             style="margin:10px;"/>`,
                callback: "HCACall.edit_attribute_dialog_cb"
            })
    }

    static edit_attribute_dialog_cb(vals){
        if(vals.clicked_button_value === "Update Call") {
            let call_obj = HCACall.call_name_to_call_obj(vals.call_name)
            let attribute_names_in_dialog = []
            for (let row of hca_attributes_id.value.split("\n")){
                row = row.trim()
                if(row.length > 0) {
                    let attr_name_delimiter_pos = row.indexOf(": ")
                    if(attr_name_delimiter_pos === -1) {
                        warning("While parsing attribute row, there's no colon-space so no attribute name for:<br/><code>" +
                            row + `</code><br/>Please add a colon-space after attribute name or delete this row.`)
                        return //don't close window, let the user fix the problem first.
                    }
                    else {
                        let attr_name = row.substring(0, attr_name_delimiter_pos)
                        let attr_value = row.substring(attr_name_delimiter_pos + 2).trim()
                        let num_maybe = parseFloat(attr_value)
                        if(!Number.isNaN(num_maybe)){  //got a number so use it!
                            attr_value = num_maybe
                        }
                        call_obj[attr_name] = attr_value
                        attribute_names_in_dialog.push(attr_name)
                    }
                }
            }
            //Deleting attributes
            let att_names_in_call_obj = HCACall.attribute_names_in_call_obj(call_obj)
            let att_names_to_delete  = Utils.symmetric_difference(att_names_in_call_obj, attribute_names_in_dialog)
            for(let att_name_to_delete of att_names_to_delete){
                if(att_name_to_delete === "description") {} //handle below
                delete call_obj[att_name_to_delete]
            }
            let des_val = hca_description_id.value.trim()
            if(des_val.length > 0) {
                call_obj.description = des_val
            }
            else {
                delete call_obj.description
            }
            SW.close_window(vals.window_index)
            HCAObjDef.redraw_obj_def()
        }
        else if(vals.clicked_button_value === "close_button"){
            SW.close_window(vals.window_index)
        }
    }

//______exclusivly lgraph node methods below here
    static node_add_usual_actions(node){
        /*causes intermittent problems. Let  LGraphCanvas_prototype_processKey handle cut,copy,paste.
          if(!node.onKeyUp){
            node.onKeyUp = function(event) {
                HCA.node_keyup_action.call(HCA, event, node)
            }
        }*/

        // This fires even when I attempt to drag a block, so if it pops up a dialog,
        // that prevent dragging the block
        node.onSelected = function (event) {

            //let [lgraph_category, call_obj_id] = node.type.split("/") //the obj_id of the def that is being called by
            //let obj_def = HCAObjDef.obj_id_to_obj_def_map[call_obj_id]
            let call_name = node.title //example: foo:A
            let call_obj  = HCACall.call_name_to_call_obj(call_name)
            let called_object = HCAObjDef.obj_id_to_obj_def_map[call_obj.call_obj_id]
            let containing_obj_def = HCAObjDef.obj_id_to_obj_def_map[call_obj.containing_obj_id]
            inspect({node: node,
                          call_obj: call_obj,
                          called_object: called_object,
                          containing_obj_def: containing_obj_def
            })
            //HCACall.show_call_dialog(call_obj)
        }
        /*does nothing
           node.onMouseUp = function(event){
            inspect("mouse is up")
        }*/
        if(!node.onDblClick){
            node.onDblClick = function(event){
                let call_name = node.title //example: foo:A
                let call_obj  = HCACall.call_name_to_call_obj(call_name)
                //inspect({node: node, call_obj: call_obj})
                HCACall.show_call_dialog(call_obj)
            }
        }
        if(!node.title){
            warning("A node is used but not defined. Define it via:<br/>" +
                "File menu/Load... and choose: " + node.properties.composite_node_src_path +
                "<br/>Then re-edit the file via:<br/>" +
                "File menu/Open ... and choose: " + Editor.current_file_path)
        }
    }

    static find_obj_defs_calling_obj_id(call_obj_id){
        let result = []
        for(let obj_id of Object.keys(HCAObjDef.obj_id_to_obj_def_map)){
            let obj_def = HCAObjDef.obj_id_to_obj_def_map[obj_id]
            for(let call_obj of obj_def.prototypes){
                if(call_obj.call_obj_id === call_obj_id){
                   result.push(obj_def)
                   break; //only need the first one
                }
            }
        }
        return result
    }

    static find_call_objs_having_call_obj_id(call_obj_id){
        let result = []
        for(let obj_id of Object.keys(HCAObjDef.obj_id_to_obj_def_map)){
            let obj_def = HCAObjDef.obj_id_to_obj_def_map[obj_id]
            for(let call_obj of obj_def.prototypes){
                if(call_obj.call_obj_id === call_obj_id){
                    result.push(call_obj)
                }
            }
        }
        return result
    }

    //not now used
    static node_id_to_node(nodes, id){
        for(let node of nodes) {
            if(node.id === id) {
                return node
            }
        }
        return null
    }


}