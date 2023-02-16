globalThis.HCAObjDef = class HCAObjDef {
    static obj_def_tree //will be a json obj of fields: folder_name, subfolders, obj_defs
    static sheets = []
    static current_sheet   = null
    static current_obj_def = null
    static core_lib_top_level_tree_names = "not_inited"

    static init() {
        this.obj_def_tree = {folder_name: "root", //always a single path part string. no slashes
                             subfolders: [], //each is an obj with fields of folder_name, subfolders, obj_defs
                             obj_defs: [] //each of which will have a TreeGroup prop that is an array of strings, each a path part, that last one being the name of the folder that obj_def is in
                             }
    }
    constructor(json_obj){
        for(let key of Object.keys(json_obj)){
            let val = json_obj[key]
            ///if(key === "TreeGroup") {
            //    this.TreeGroup = val.split("/") //obsolete. now done in parser
            //}
            //else {
                this[key] = val
            //}
        }
        if(!this.objectName){
            DDE.error("Attempt to create an HCA object definition without an objectName.<br/>" +
                      "Other Attributes: " + JSON.stringify(json_obj))
        }
        if(!this.TreeGroup) {//hits for the obj named "CoreLib".
            if(this.Primitive){
                this.TreeGroup = ["Primitives"]
            }
            else {
                this.TreeGroup = ["Misc"] //[this.objectName]
            } //fry added this because some objects didin't have a TreeGroup, such as the obj with objectName: "CoreLib". So I gave it one
        }
        if(!this.objectType) {
            this.objectType = this.objectName
        }
        if(!this.inputs)  { this.inputs  = [] } //CoreLib doesn't have an outputs field.
        if(!this.outputs) {
            this.outputs = []
        } //CoreLib doesn't have an outputs field.
        if(!this.prototypes) {
            this.prototypes = []
        }
        if(!this.netList){
            this.netList = []
        }
        if(!this.line){
            this.line = JSON.stringify(json_obj)
        }
        //console.log("just made HCAObjDef " + this.objectName)
        this.insert_obj_def_into_tree(HCAObjDef.obj_def_tree, this.TreeGroup)
        this.insert_obj_def_into_sheets_menu_maybe()
        HCA.insert_obj_def_into_pallette(this)
    }

    //"this" is the obj_def that we're inserting into the tree, based on its
    //TreeGroup prop which is originally the TreeGroupArr arg.
    insert_obj_def_into_tree(look_in_folder, TreeGroupArr, pallette_dom_elt){
        if(TreeGroupArr.length === 0){
            look_in_folder.obj_defs.push(this)
        }
        else {
            let sub_folder = HCAObjDef.get_subfolder_named(look_in_folder,  TreeGroupArr[0])
            if(sub_folder){
                return this.insert_obj_def_into_tree(sub_folder, TreeGroupArr.slice(1))
            }
            else {
                let new_fold = {folder_name: TreeGroupArr[0], subfolders: [], obj_defs: []}
                look_in_folder.subfolders.push(new_fold)
                return this.insert_obj_def_into_tree(new_fold, TreeGroupArr.slice(1)) //slice(1) cuts off the first elt of the array and makes a copy of the rest.
            }
        }
    }

    static get_subfolder_named(parent_folder, subfolder_name){
        for(let subfold of parent_folder.subfolders){
            if(subfold.folder_name === subfolder_name){
                return subfold
            }
        }
        return null
    }

    //the default callback to parse()
    static insert_obj_defs_into_tree(source_path, json_obj_defs=null){
        if(json_obj_defs.top_level_obj_defs){
            json_obj_defs = json_obj_defs.top_level_obj_defs
        }
        if(source_path){
            ipg_to_json.file_path_to_parse_obj_map[source_path] = json_obj_defs
            ipg_to_json.loaded_files.push(source_path)
            if(source_path.endsWith("CorLib.ipg")) {
                HCAObjDef.core_lib_top_level_tree_names = HCAObjDef.top_level_treegroup_names()
            }
            else if (source_path.endsWith("AXI_TO_AZIDO.idl")){
                HCAObjDef.core_lib_and_az_top_level_tree_names = HCAObjDef.top_level_treegroup_names()
            }
        }
        HCAObjDef.make_object_defs_slowly(source_path, json_obj_defs)
    }

    static make_object_defs_slowly(source_path=null, json_obj_defs, next_index = 0){
        if(HCA.pending_rendering_dom_id && !window[HCA.pending_rendering_dom_id]) { //take a lap waiting for the pendeing folder elt to render
            setTimeout(function(){
                HCAObjDef.make_object_defs_slowly(source_path, json_obj_defs, next_index)
            }, 200)
            return
        }
        else if (next_index >= json_obj_defs.length ) {} //all done with json_obj_defs
        else {
            let json_obj_def = json_obj_defs[next_index]
            json_obj_def.source_path = source_path //do this here, just before new HCAObjDef so
            //the resulting obj will have th source_path in it, AND not above here
            //because we'll call make_object_defs_slowly sometimes with JSON parsed from
            //a file, and we want that file name to be "updated" to the actual source file,
            //not just what might happen to be in the json string in the file for source_path
            new HCAObjDef(json_obj_def)
            HCAObjDef.make_object_defs_slowly(source_path, json_obj_defs, next_index + 1)
        }
    }

    insert_obj_def_into_sheets_menu_maybe(){
        if(globalThis.sheets_id){
            if(this.WipSheet || this.CurrentSheet){
                let name = this.objectName
                let the_html = "<option>" + name + "</option>"
                globalThis.sheets_id.insertAdjacentHTML("beforeend", the_html)
                HCAObjDef.sheets.push(this)
            }
        }
    }

    static js_to_HCA(){
        if( Editor.current_buffer_needs_saving &&
           (Editor.get_javascript().trim().length > 0)){
            warning("The editor has unsaved changes.<br/>" +
                    "Please save it or delete all the content before switching the view to HCA.")
            code_view_kind_id.value = "JS"
            return
        }
        let source = Editor.get_javascript().trim()
        try {
            HCA.init(Editor.current_file_path, source) //for error messages only
            globalThis.HCA_dom_elt.focus()
        }
        catch(err){
            code_view_kind_id.value = "JS"
            Editor.view = "JS"
            Editor.myCodeMirror.focus()
            warning("Sorry, could not convert the JavaScript in the Editor buffer into a valid JSON object for HCA.<br/>" +
                "If you want to start a new HCA program, please create an empty editor buffer first.")
        }
    }

//_______SAVING____________
    static hca_to_js(){
        if(!HCAObjDef.current_obj_def){ //just switch back to text editor with its old contents
            out("Since there is no current object in the HCA editor,<br/>the text in the text editor has not been changed.")
            html_db.replace_dom_elt(globalThis.HCA_dom_elt, Editor.the_CodeMirror_elt)
            Editor.view = "JS"
            Editor.myCodeMirror.focus()
            return
        }

        let old_js_full = Editor.get_text_editor_content(false) //get text regardles of view, if there's a selection, use it.
        let old_js = old_js_full.trim()
        if(old_js.length === 0) {
            let new_json_str = this.json_string_of_defs_in_obj_def()
            new_json_str = js_beautify(new_json_str)
            html_db.replace_dom_elt(globalThis.HCA_dom_elt, Editor.the_CodeMirror_elt)
            Editor.set_javascript(new_json_str)
            Editor.view = "JS"
            Editor.myCodeMirror.focus()
        }
        else {
            let old_content_to_show = ((old_js.length > 50) ? (old_js.substring(0, 50) + "...") : old_js)
            old_content_to_show = old_content_to_show.replaceAll("\n", "<br/>")
            let sel_text = Editor.get_text_editor_content(true).trim()//get selection or empty string
            let sel_text_to_show = ((sel_text.length > 50) ? (sel_text.substring(0, 50) + "...") : sel_text)
            sel_text_to_show = sel_text_to_show.replaceAll("\n" + "<br/>")
            let replace_sel_or_insert_html = ((sel_text.length > 0) ?
                                   ( "<input type='submit' value='Replace Selection'/> of:<br/>" +
                                   sel_text_to_show) :
                                   "<input type='submit' value='Insert'/> at cursor position " + Editor.selection_start() + " of " + old_js_full.length + ".")
            show_window({title: "Save current Object Definition to Text Editor",
                    x: 200, y: 100, width: 450, height: 300,
                    content: `<br/>
                              <input type='submit' value='Cancel'/> the save.<p/>
                              <input type='submit' value='Continue to JS'/> without saving anything.<br/>This leaves the text editor unchanged.<p/>
                              <input type='submit' value='Replace All'/> the text editor content of:<br/>` +
                               old_content_to_show + `<p/>` +
                               replace_sel_or_insert_html + `<p/>` +
                              `<input type='submit' value='Make new buffer'/> for the HCA content.
                             `,
                    callback: "HCAObjDef.save_handler"
                }
            )
        }
    }

    static save_handler(vals){
        if      (vals.clicked_button_value === "Cancel") {
            code_view_kind_id.value = "HCA"
        }
        else if (vals.clicked_button_value === "Continue to JS") {
            html_db.replace_dom_elt(globalThis.HCA_dom_elt, Editor.the_CodeMirror_elt)
            Editor.view = "JS"
            Editor.myCodeMirror.focus()
        }
        else if (vals.clicked_button_value === "Replace All") {
            let new_json_str = HCAObjDef.json_string_of_defs_in_obj_def()
            new_json_str = js_beautify(new_json_str)
            html_db.replace_dom_elt(globalThis.HCA_dom_elt, Editor.the_CodeMirror_elt)
            Editor.set_javascript(new_json_str)
            Editor.view = "JS"
            Editor.myCodeMirror.focus()
        }
        else if ((vals.clicked_button_value === "Replace Selection") ||
                 (vals.clicked_button_value === "Insert")){
            let new_json_str = HCAObjDef.json_string_of_defs_in_obj_def()
            new_json_str = js_beautify(new_json_str)
            setTimeout(function() {
                html_db.replace_dom_elt(globalThis.HCA_dom_elt, Editor.the_CodeMirror_elt)
                Editor.replace_selection(new_json_str)
                Editor.view = "JS"
                Editor.myCodeMirror.focus()
            }, 200)
        }
        else if (vals.clicked_button_value === "Make new buffer") {
            let new_json_str = HCAObjDef.json_string_of_defs_in_obj_def()
            new_json_str = js_beautify(new_json_str)
            setTimeout(function() {
                html_db.replace_dom_elt(globalThis.HCA_dom_elt, Editor.the_CodeMirror_elt)
                Editor.edit_new_file()
                Editor.set_javascript(new_json_str)
                Editor.view = "JS"
                Editor.myCodeMirror.focus()
            }, 200)
        }
    }

    static json_string_of_defs_in_obj_def(obj_def=HCAObjDef.current_obj_def, top_level_tree_group_names_to_ignore=["BuiltIn"]){
        let json_obj = this.json_obj_of_defs_in_obj_def(obj_def, top_level_tree_group_names_to_ignore)
        return Editor.pretty_print(JSON.stringify(json_obj))
    }

    static json_obj_of_defs_in_obj_def(obj_def, top_level_tree_group_names_to_ignore){
        let found_obj_defs = this.obj_defs_in_obj_def(obj_def, [], top_level_tree_group_names_to_ignore)
        let result = {top_level_obj_defs: found_obj_defs,
                      project_name: obj_def.objectName,
                      project_date: Utils.date_or_number_to_ymdhms(Date.now())
                     }
        return result
    }

    //the arg can really be any obj_def.
    //walk the prototypes to collect all the obj_defs including passed in obj_def
    //and all the obj_defs of its obj_calls recursively on down.
    static obj_defs_in_obj_def(obj_def, result_obj_defs=[], top_level_tree_group_names_to_ignore=[]){
        let top_level_tree_group_name = obj_def.TreeGroup[0]
        if(top_level_tree_group_names_to_ignore.includes(top_level_tree_group_name)) {}
        else {
          if(result_obj_defs.includes(obj_def)) {} //already got this obj_def so don't add it again!
          else {
              result_obj_defs.push(obj_def)
              for(let obj_call of obj_def.prototypes){
                  let a_obj_def = this.obj_call_to_obj_def(obj_call, top_level_tree_group_names_to_ignore)
                  if(!a_obj_def){
                      warning("obj_defs_in_obj_def found obj_call that has no definition: " + obj_call.objectName)
                  }
                  else {
                      this.obj_defs_in_obj_def(a_obj_def, result_obj_defs, top_level_tree_group_names_to_ignore)
                  }
              }
          }
        }
        return result_obj_defs
    }

    static top_level_treegroup_names(){
        let result = []
        for(let subfolder of this.obj_def_tree.subfolders){
            result.push(subfolder.folder_name)
        }
        return result
    }

    static obj_call_to_obj_def(obj_call, top_level_tree_group_names_to_ignore=[] ){
        let all_top_tree_names = this.top_level_treegroup_names()
        let useful_tree_names  = Utils.difference(all_top_tree_names, top_level_tree_group_names_to_ignore)
        for(let tree_node of this.obj_def_tree.subfolders){
            if(useful_tree_names.includes(tree_node.folder_name)){
                let found_obj_def = this.obj_call_to_obj_def_in_tree_name(obj_call, tree_node)
                if(found_obj_def) { return found_obj_def}
            }
        }
        return null
    }

    static obj_call_to_obj_def_in_tree_name(obj_call, tree_node){
        for(let a_obj_def of tree_node.obj_defs) {
            if (this.obj_call_matches_obj_def(obj_call, a_obj_def)) {
                return a_obj_def
            }
        }
        for(let a_tree_node of tree_node.subfolders){
            let result_obj_def = this.obj_call_to_obj_def_in_tree_name(obj_call, a_tree_node)
            if(result_obj_def){
                return result_obj_def
            }
        }
        return null //didn't find obj_def matching obj_call in tree_node
    }

    static obj_call_matches_obj_def(obj_call, obj_def){
        let def_name_from_call = this.call_name_to_def_name(obj_call.objectName)
        if(def_name_from_call === obj_def.objectName){
            if(obj_call.objectName === "$Select") {
                debugger;
            }
            return this.inputs_match_inputs(obj_call.inputs, obj_def.inputs)
        }
        else { return false }
    }

    static inputs_match_inputs(insA, insB){
        if(insA.length === insB.length){
            for(let i = 0; i < insA.length; i++){
                let inA = insA[i]
                let inB = insB[i]
                if(inA.type !== inB.type) { return false}
            }
            return true
        }
        else { return false}
    }
//_______END OF SAVING____________

    //questionable because it means only one obj def per obj_name regardless of different arg types.
    //but if not, how could the netList work with only objectNames in it?
    static obj_name_to_obj_def_map = {}

    static obj_name_to_obj_def(obj_name, tree_folder=HCAObjDef.obj_def_tree){
        obj_name = this.call_name_to_def_name(obj_name)
        obj_name = obj_name.toLowerCase()
        for(let obj_def of tree_folder.obj_defs){
            if(obj_name === obj_def.objectName.toLowerCase()){
                return obj_def
            }
        }
        for(let subfold of tree_folder.subfolders){
            let result = this.obj_name_to_obj_def(obj_name, subfold)
            if (result) {
                return result
            }
        }
        return null
        //return this.obj_name_to_obj_def_map[obj_name]
    }


    //called by Doc pane "Find" button & return of type in.
    //search_string is case-insensitive.
    //returns an array of 3 arrays of obj_defs:
    // def_match: those obj_defs whose names match, case_insensitive.
    // included_in_name: search_string is in their name (case insensitive
    // def_calls_match: inside the def has calls who's names match the search_string, case_insensitive
    // Note: included_in_name is a superset of def_match
    static find_obj_defs(search_string, tree_folder=HCAObjDef.obj_def_tree, def_match=[], included_in_name=[], def_calls_match=[]){
        search_string = search_string.toLowerCase()
        for(let obj_def of tree_folder.obj_defs){
            let obj_def_name_lc = obj_def.objectName.toLowerCase()
            if(obj_def_name_lc.toLowerCase().includes(search_string)){
                included_in_name.push(obj_def)
                if(obj_def_name_lc === search_string) {
                    def_match.push(obj_def)
                }
            }
            for(let obj_call of obj_def.prototypes){
                if(obj_call.objectName.toLowerCase() === search_string){
                    def_calls_match.push(obj_def)
                }
            }
        }
        for(let subfold of tree_folder.subfolders){
            this.find_obj_defs(search_string, subfold, def_match, included_in_name, def_calls_match)
        }
        return [def_match,included_in_name, def_calls_match ]
    }


    //if passed foo:A, cut off the :A and return "foo"
    //else return the arg.
    static call_name_to_def_name(str){
        let colon_pos = str.indexOf(":")
        if(colon_pos === -1) {return str}
        else { return str.substring(0, colon_pos)}
    }

    //path can be: like "CoreLib/GrammaticalOps/ReverseBits" or
    //                 ["CoreLib", "GrammaticalOps", "ReverseBits"]
    static path_to_obj_def(path, path_index = 0, look_in=HCAObjDef.obj_def_tree){
        if(typeof(path) === "string"){
            path = path.split("/")
        }
        let cur_path_part = path[path_index]
        if(path.length -1 === path_index) { //we're on the last path index.
            for (let obj_def of look_in.obj_defs) {
                if (obj_def.objectName === cur_path_part) { //beware. might be more than 1
                    this.obj_name_to_obj_def_map[obj_def.objectName] = obj_def
                    return obj_def
                }
            }
            shouldnt("HCA_objdef.path_to_obj_def could not find obj")
        }
        else { //not on last path elt
            for(let subfold of look_in.subfolders){
                if(subfold.folder_name === cur_path_part) {
                    return this.path_to_obj_def(path, path_index + 1, subfold)
                }
            }
        }
    }

    static object_name_to_sheet(obj_name){
        obj_name = this.call_name_to_def_name(obj_name)
        for(let obj_def of this.sheets){
            if(obj_def.objectName === obj_name) { return obj_def }
        }
        return null //no sheet of that name
    }

    /*Object ( Bit Out1) INVERT( Bit In1) ; //note it Out1 not Out like the others? Output also has Out1
    Object ( Bit Out) AND( Bit In1, Bit In2) ;
    Object ( Bit Out) OR( Bit In1, Bit In2) ;
    Object ( Variant In1) Input;
    Object Output( Variant Out1) ;
    Object ( Variant Out1, Variant Out2, Variant Out3) Junction( Variant In0) ;
    Object Text;
    Object ( Variant Out) $Select( Variant "#0", Variant "#1", Bit S) ;
    Object ( Variant Out) $Cast( Variant Data, Variant Type) ;
    */
    static define_built_ins(){
        let json_obj_defs = [
        {TreeGroup: ["BuiltIn"], objectName: 'INVERT', objectType: 'INVERT',
            inputs: [{type: 'Bit', name: 'In1'}],
            outputs:[{type: 'Bit', name: "Out1"}],
            netList:[],
            prototypes:[],
            line: "Object ( Bit Out1) INVERT( Bit In1)"
         },
        {TreeGroup: ["BuiltIn"], objectName: 'AND', objectType: 'AND',
            inputs: [{type: 'Bit', name: 'In1'}, {type: 'Bit', name: 'In2'}],
            outputs:[{type: 'Bit', name: "Out"}],
            netList:[],
            prototypes:[],
            line: "Object ( Bit Out) AND( Bit In1, Bit In2)"
        },
        {TreeGroup: ["BuiltIn"], objectName: 'OR', objectType: 'OR',
            inputs: [{type: 'Bit', name: 'In1'}, {type: 'Bit', name: 'In2'}],
            outputs:[{type: 'Bit', name: "Out"}],
            netList:[],
            prototypes:[],
            line: "Object ( Bit OUT) OR( Bit In1, Bit In2)"
        },
        {TreeGroup: ["BuiltIn"], objectName: 'Input', objectType: 'Input',
            inputs: [],
            outputs:[{type: 'Variant', name: 'In1'}],
            netList:[],
            prototypes:[],
            line: "Object ( Variant In1) Input"
        },
        {TreeGroup: ["BuiltIn"], objectName: 'Output', objectType: 'Output',
            inputs: [{type: 'Variant', name: 'Out1'}],
            outputs:[],
            netList:[],
            prototypes:[],
            line: "Object Output( Variant Out1)"
        },
        {TreeGroup: ["BuiltIn"], objectName: 'Junction', objectType: 'Junction',
            inputs: [{type: 'Variant', name: 'In0'}],
            outputs:[{type: 'Variant', name: 'Out1'}, {type: 'Variant', name: 'Out2'}, {type: 'Variant', name: 'Out3'}],
            netList:[],
            prototypes:[],
            line: "Object ( Variant Out1, Variant Out2, Variant Out3) Junction( Variant In0)"
        },
        {TreeGroup: ["BuiltIn"], objectName: '$Select', objectType: '$Select',
            inputs: [{type: 'Variant', name: '#0'}, {type: 'Variant', name: '#1'}, {type: 'Bit', name: 'S'}],
            outputs:[{type: 'Variant', name: 'Out'}],
            netList:[],
            prototypes:[],
            line: "Object ( Variant Out) $Select( Variant '#0', Variant '#1', Bit S)"
        },
        {TreeGroup: ["BuiltIn"], objectName: '$Cast', objectType: '$Cast',
            inputs: [{type: 'Variant', name: 'Data'}, {type: 'Variant', name: 'Type'}],
            outputs:[{type: 'Variant', name: 'Out'}],
            netList:[],
            prototypes:[],
            line: "Object ( Variant Out) $Cast( Variant Data, Variant Type)"
        }
        ]
        HCAObjDef.insert_obj_defs_into_tree("built_in", json_obj_defs)
        //for(let json_obj_def of json_obj_defs){
        //    new HCAObjDef(json_obj_def)
        //}
    }
}
HCAObjDef.init()