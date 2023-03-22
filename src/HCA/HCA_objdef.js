globalThis.HCAObjDef = class HCAObjDef {
    static obj_def_tree //will be a json obj of fields: folder_name, subfolders, obj_defs
    static sheets
    static current_sheet
    static current_obj_def
    static core_lib_top_level_tree_names
    static object_name_to_defs_map
    static object_name_plus_in_types_to_def_map

    static init() {
        console.log("top of HCAObjDef.init")
        this.obj_def_tree = {
            folder_name: "root", //always a single path part string. no slashes
            subfolders: [], //each is an obj with fields of folder_name, subfolders, obj_defs
            obj_defs: [] //each of which will have a TreeGroup prop that is an array of strings, each a path part, that last one being the name of the folder that obj_def is in
        }
        this.sheets = []
        this.current_sheet   = null
        this.current_obj_def = null
        this.core_lib_top_level_tree_names = "not_inited"
        this.object_name_to_defs_map = {}
        this.object_name_plus_in_types_to_def_map = {}
    }

    constructor(json_obj){
        if(!json_obj.objectName){
            DDE.error("Attempt to create an HCA object definition without an objectName.<br/>" +
                "Other Attributes: " + JSON.stringify(json_obj))
        }
        let obj_id = HCAObjDef.make_obj_id(json_obj)
        let the_obj_def = HCAObjDef.object_name_plus_in_types_to_def_map[obj_id]
        //if there is aready an obj-def_overload for this obj_id, use it, else
        //use the new obj in "this".
        //This way we avoid making duplicates as some files redefine
        let making_new_obj = false
        if(!the_obj_def) {
            the_obj_def = this
            making_new_obj = true
        }
        let TreeGroup_changed = false
        for(let key of Object.keys(json_obj)){
            let val = json_obj[key]
            if((key === "TreeGroup") &&
                !making_new_obj &&
                (val !== the_obj_def.TreeGroup)){
                TreeGroup_changed = true
            }
            the_obj_def[key] = val
        }
        if(!the_obj_def.TreeGroup) {//hits for the obj named "CoreLib".
            //beware, if the obg_def already existed, but
            //our josn_obj had a DIFFERENT TreeGroup, then
            //we SHOOULD switch the treegroup of the_obj_def, but
            //for now I presume the TreeGroup didn't change and so I don't
            //remove the
            if(the_obj_def.Primitive){
                the_obj_def.TreeGroup = ["Primitive"]
            }
            else {
                the_obj_def.TreeGroup = ["Misc"] //[this.objectName]
            } //fry added this because some objects didin't have a TreeGroup, such as the obj with objectName: "CoreLib". So I gave it one
        }
        if(!the_obj_def.objectType) {
            the_obj_def.objectType = this.objectName
        }
        if(!the_obj_def.inputs)  { this.inputs  = [] } //CoreLib doesn't have an outputs field.
        if(!the_obj_def.outputs) {
            the_obj_def.outputs = []
        } //CoreLib doesn't have an outputs field.
        if(!the_obj_def.prototypes) {
            the_obj_def.prototypes = []
        }
        if(!the_obj_def.netList){
            the_obj_def.netList = []
        }
        if(!the_obj_def.line){
            the_obj_def.line = JSON.stringify(json_obj)
        }
        if(making_new_obj) {
            the_obj_def.obj_id = obj_id
            HCAObjDef.object_name_plus_in_types_to_def_map[obj_id] = the_obj_def //add or replaces if already exists
            the_obj_def.add_or_replace_in_object_name_to_defs_map()
            the_obj_def.insert_obj_def_into_tree(HCAObjDef.obj_def_tree, this.TreeGroup)
            the_obj_def.insert_obj_def_into_sheets_menu_maybe()
            HCA.insert_obj_def_into_pallette(the_obj_def) //but only if no already in
            HCA.register_with_litegraph(the_obj_def)
        }
        else if(TreeGroup_changed){
            //remove_from old treegroup //todo
            //add to new treegroup
        }
    }

    static make_obj_id(json_or_obj_def){
        let result = json_or_obj_def.objectName
        for(let input of json_or_obj_def.inputs){
            result += "," + input.type
        }
        return result
    }

    make_obj_id(){
        return HCAObjdef.make_obj_id(this)
    }

    add_or_replace_in_object_name_to_defs_map(){
        let arr_of_defs = HCAObjDef.object_name_to_defs_map[this.objectName]
        if(!arr_of_defs){ //first obj_def of this name
            HCAObjDef.object_name_to_defs_map[this.objectName] = [this]
            return
        }
        for(let i = 0; i < arr_of_defs.length; i++){
            let a_def = arr_of_defs[i]
            if(a_def.obj_id === this.obj_id){
                arr_of_defs[i] = this //replace old
                return
            }
        }
        arr_of_defs.push(this) //their is already at least one def for this objectName, but
            //none of them are THIS, so add it.
    }

    //"this" is the obj_def that we're inserting into the tree, based on its
    //TreeGroup prop which is originally the TreeGroupArr arg.
    insert_obj_def_into_tree(look_in_folder=HCAObjDef.obj_def_tree, TreeGroupArr){
        if (!TreeGroupArr){
            TreeGroupArr = this.TreeGroup
        }
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

    //the default callback to ipg_to_json.parse()
    static insert_obj_and_dataset_defs_into_tree(source_path, proj_file_json_obj){
        HCAObjDef.insert_obj_defs_into_tree(source_path, proj_file_json_obj.object_definitions)
        Dataset.insert_dataset_defs_into_tree(source_path, proj_file_json_obj.datasets)
        if(proj_file_json_obj.fpga_type){
            FPGAType.set_current_fpga_type(proj_file_json_obj.fpga_type)
        }
    }


    static insert_obj_defs_into_tree(source_path, json_obj_defs=null){
        if(json_obj_defs.object_definitions){
            json_obj_defs = json_obj_defs.object_definitions
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
        else if (next_index >= json_obj_defs.length) {} //all done with json_obj_defs. usually this doesn't hit, but if 0 obj_defs in a file, it will
        else {
            let json_obj_def = json_obj_defs[next_index]
            json_obj_def.source_path = source_path //do this here, just before new HCAObjDef so
            //the resulting obj will have th source_path in it, AND not above here
            //because we'll call make_object_defs_slowly sometimes with JSON parsed from
            //a file, and we want that file name to be "updated" to the actual source file,
            //not just what might happen to be in the json string in the file for source_path
            new HCAObjDef(json_obj_def)
            if(next_index < (json_obj_defs.length - 1)) {
                HCAObjDef.make_object_defs_slowly(source_path, json_obj_defs, next_index + 1)
            }
            else{ //all done loading obj_defs, so display an obj_def
                if(HCAObjDef.current_sheet && HCAObjDef.current_sheet.source_path === source_path){
                    HCA.display_obj_def(HCAObjDef.current_sheet)
                }
                else {
                    for(let sheet of HCAObjDef.sheets){
                        if(sheet.source_path === source_path){
                            HCA.display_obj_def(sheet)
                            return
                        }
                    }
                    let an_obj_def = this.first_obj_def_with_source_path(source_path)
                    if(an_obj_def){
                        HCA.display_obj_def(an_obj_def)
                    }
                    else {
                        warning("There are no object definitions in: " + source_path)
                    }
                }
            }
        }
    }

    insert_obj_def_into_sheets_menu_maybe(){
        if(globalThis.current_obj_def_select_id){
            if(this.CurrentSheet){
                HCAObjDef.current_sheet = this
                HCA.add_to_obj_def_menu_maybe(this)
            }
            else if(this.WipSheet){
                HCAObjDef.sheets.push(this)
                HCA.add_to_obj_def_menu_maybe(this)
            }
            //see HCA.display_obj_def for other insertion into the menu.
            //but the sheets at the top, and the non-sheets at the bottom
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
        let old_js_full = Editor.get_text_editor_content(false) //get text regardles of view, if there's a selection, use it.
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
        show_window({title: "Save HCA Program to Text Editor",
                x: 200, y: 100, width: 750, height: 330,
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
                          <input type='submit' value='Replace All'/> the text editor content of:<br/>` +
                           old_content_to_show + `<p/>` +
                           replace_sel_or_insert_html + `<p/>` +
                          `<input type='submit' value='Make new buffer'/> for the HCA content.
                          </div>
                         `,
                callback: "HCAObjDef.save_handler"
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
            code_view_kind_id.value = "HCA"
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

    static json_string_of_defs_in_obj_def(obj_def=HCAObjDef.current_obj_def, files_array=ipg_to_json.loaded_files){
        let json_obj = this.json_obj_of_defs_in_obj_def(obj_def, files_array)
        return Editor.pretty_print(JSON.stringify(json_obj))
    }

    static json_obj_of_defs_in_obj_def(obj_def, files_array=ipg_to_json.loaded_files){
        let found_obj_defs = this.obj_defs_in_obj_def(obj_def, files_array)
        let datasets = Dataset.datasets_in_files(files_array)
        let result = {project_name: obj_def.objectName,
                      project_date: Utils.date_or_number_to_ymdhms(Date.now()),
                      content_connected_to_object_definition: obj_def.objectName,
                      content_from_files: files_array,
                      fpga_type: FPGAType.current_fpga_type,
                      object_definitions: found_obj_defs,
                      datasets: datasets,
                     }
        return result
    }

    //the arg can really be any obj_def.
    //walk the prototypes to collect all the obj_defs including passed in obj_def
    //and all the obj_defs of its obj_calls recursively on down.
    /*static obj_defs_in_obj_def(obj_def, result_obj_defs=[], top_level_tree_group_names_to_ignore=[]){
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
    }*/

    static obj_defs_in_obj_def(obj_def, files_array=ipg_to_json.loaded_files, result_obj_defs=[]){
        if(result_obj_defs.includes(obj_def))               {} //already got this obj_def so don't add it again!
        else if(!files_array.includes(obj_def.source_path)) {} //exclude obj_def
        else {
            result_obj_defs.push(obj_def)                  //include obj_def and maybe obj_defs it calls
            for(let obj_call of obj_def.prototypes){
                if(obj_call.objectName.startsWith("Output")) {
                    debugger;
                }
                let a_obj_def = this.obj_call_to_obj_def(obj_call)
                if(!a_obj_def){
                    warning("HCAObjDef.obj_defs_in_obj_def found obj_call that has no definition: " + obj_call.objectName)
                }
                else {
                    this.obj_defs_in_obj_def(a_obj_def, files_array, result_obj_defs)
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

    static obj_call_to_obj_def(obj_call){
        for(let tree_node of this.obj_def_tree.subfolders){
            let found_obj_def = this.obj_call_to_obj_def_in_tree_name(obj_call, tree_node)
            if(found_obj_def) { return found_obj_def}
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
            return this.inputs_match_inputs(obj_call.inputs, obj_def.inputs)
        }
        else { return false }
    }

    static inputs_match_inputs(insA, insB){
        if(insA.length === insB.length){
            for(let i = 0; i < insA.length; i++){
                let inA = insA[i]
                let inB = insB[i]
                if(inA.type === inB.type)  {} //ok match
                if(inB.type === "Variant") {} //ok match
                    //maybe I should allsow intA.type === "Variant" but
                    //in my normal use case, insA is from the CALL and
                    //inB is the ObjDef that we're trying to match the call with
                    //so inB.type === "Variant" covers that case.
                else { return false }
            }
            return true
        }
        else { return false}
    }
//________saving all obj_defs in files
    //Walk the whole tree, grabbing all obj_defs that have their source_path in the files array.
    static json_string_of_defs_in_files(files_array=ipg_to_json.loaded_files){
        let json_obj = this.json_obj_of_defs_in_files(files_array)
        return Editor.pretty_print(JSON.stringify(json_obj))
    }

    static json_obj_of_defs_in_files(files_array=ipg_to_json.loaded_files) {
        let found_obj_defs = this.obj_defs_in_files_in_treegroup(files_array, HCAObjDef.obj_def_tree)
        let datasets = Dataset.datasets_in_files(files_array)
        let result =   {project_name: files_array.join("&"),
                        project_date: Utils.date_or_number_to_ymdhms(Date.now()),
                        content_connected_to_object_definition: "all object definitions in the files are included",
                        content_from_files: files_array,
                        fpga_type: FPGAType.current_fpga_type,
                        object_definitions: found_obj_defs,
                        datasets: datasets,

        }
        return result
    }

    static obj_defs_in_files_in_treegroup(files_array, treegroup_fold=HCAObjDef.obj_def_tree, result=[]){
        for(let obj_def of treegroup_fold.obj_defs){
            if(files_array.includes(obj_def.source_path) &&
               !result.includes(obj_def)) {
                result.push(obj_def)
            }
        }
        for(let subfolder of treegroup_fold.subfolders){
            this.obj_defs_in_files_in_treegroup(files_array, subfolder, result)
        }
        return result
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
        for(let subfolder of tree_folder.subfolders){
            let result = this.obj_name_to_obj_def(obj_name, subfolder)
            if (result) {
                return result
            }
        }
        return null
        //return this.obj_name_to_obj_def_map[obj_name]
    }

    //used when showing a def from a file when the file is loaded, and doesn't have any sheets,
    //we show a random obj_def from the file computed by this fn.
    static first_obj_def_with_source_path(source_path, tree_folder=HCAObjDef.obj_def_tree){
        for(let obj_def of tree_folder.obj_defs){
            if(obj_def.source_path === source_path){
                return obj_def
            }
        }
        for(let subfold of tree_folder.subfolders){
            let result = this.first_obj_def_with_source_path(source_path, subfold)
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
        for(let subfolder of tree_folder.subfolders){
            this.find_obj_defs(search_string, subfolder, def_match, included_in_name, def_calls_match)
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
            for(let subfolder of look_in.subfolders){
                if(subfolder.folder_name === cur_path_part) {
                    return this.path_to_obj_def(path, path_index + 1, subfolder)
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
        },
        {TreeGroup: ["BuiltIn"], objectName: 'Text', objectType: 'Text',
            inputs: [],
            outputs:[],
            netList:[],
            prototypes:[],
            line: "Object () Text()"
        }
        ]
        HCAObjDef.insert_obj_defs_into_tree("built_in", json_obj_defs)
    }

    static show_obj_def_dialog(event){
        let the_objectName = event.target.innerHTML
        let obj_defs = HCAObjDef.object_name_to_defs_map[the_objectName]
        inspect(obj_defs)
        let obj_defs_select_html = `<select id="obj_def_overload_id" style="margin:5px;">`
        for(let obj_def of obj_defs){
            obj_defs_select_html += "<option value='" + obj_def.obj_id + "'>" + obj_def.obj_id + "</option>"
        }
        obj_defs_select_html += "</select><br/>"
        show_window({
            title: "Choose Object Definition Operation",
            x:200, y:100, width:360, height:260,
            content: `for: <b>` + the_objectName + `</b><br/>
                     <input type="hidden" name="the_objectName" value="` + the_objectName + `"/>
                     First, choose an overloaded object definition<br/>
                     with input types (after commas):<br/>` +
                     obj_defs_select_html +
                    `<input type="submit" value="Edit Definition"  style="margin:5px;"/><br/>
                     <input type="submit" value="Make Call"        style="margin:5px;"/><br/>
                     <input type="submit" value="Delete"           style="margin:5px;"/><br/>
                     <input type="submit" value="Find"             style="margin:5px;"/>`,

            callback: "HCAObjDef.show_obj_def_dialog_cb"
        })

    }

    static show_obj_def_dialog_cb(vals){
        let the_objectName = vals.the_objectName
        let overload_obj_id = vals.obj_def_overload_id
        let overload_obj_def = HCAObjDef.object_name_plus_in_types_to_def_map[overload_obj_id]
        if(vals.clicked_button_value === "Make Call"){
            //HCA.make_and_add_block('` + tree_path_and_obj_name + `', event)">` + obj_def.objectName + "</div>
            //make_and_add_call_to_definition(HCA.current_obj_def, obj_def_to_call) //todo incomplete def now in HCA_ui.js
            HCA.display_obj_call(overload_obj_def)
        }
        else if(vals.clicked_button_value === "Edit Definition"){
            //HCAObjDef.show_edit_dialog(overload_obj_def)
            HCA.display_obj_def(overload_obj_def)
        }
        else if(vals.clicked_button_value === "Delete"){
            //dataset_obj/overload_obj_def.remove() //todo
            warning("Delete of an object definition not yet implemented.")
        }
        else if(vals.clicked_button_value === "Find"){
            find_doc_input_id.value = the_objectName
            find_doc_button_id.click()
        }
        else if(vals.clicked_button_value === "close_button"){
            SW.close_window(vals.window_index)
        }
        else {
            shouldnt("In show_dataset_dialog_cb got invalid clicked_button_value: " +
                vals.clicked_button_value)
        }


    }

    static show_edit_dialog(overload_obj_def){
        let built_in_warning = ""
        let disabled_prop = ""
        if(overload_obj_def.TreeGroup[0] === "BuiltIn"){
            built_in_warning = `<span style="color:red;">BuiltIn object definitions can't be edited.</span><br/>`
            disabled_prop = " disabled "
        }
        let inputs_html = ""
        for(let a_in of overload_obj_def.inputs){
            inputs_html  += a_in.name  + " " + a_in.type  + "\n"
        }
        inputs_html.trim() //take off final newline
        let outputs_html = ""
        for(let a_out of overload_obj_def.inputs){
            outputs_html += a_out.name + " " + a_out.type + "\n"
        }
        outputs_html.trim() //take off final newline
        show_window({title: "Edit Object Definition",
            x:200, y:100, width:350, height:350,
            content: built_in_warning +
                `<input type="hidden"                               value="` + overload_obj_def.objectName + `" name="orig_name"/>` +
                `<input type="hidden"                               value="` + overload_obj_def.obj_id     + `" name="obj_def_overload_id" />` +
                `name:        <input style="margin:5px;"            value="` + overload_obj_def.objectName             + `" name="name"`        + disabled_prop + `/><br/>` +
                `TreeGroup:   <input style="margin:5px;"            value="` + overload_obj_def.TreeGroup.join("/")    + `" name="TreeGroup"`   + disabled_prop + `/><br/>` +
                `source_path: <input style="margin:5px;width:200px" value="` + overload_obj_def.source_path            + `" name="source_path"` + disabled_prop + `/><br/>` +
                `<div style="margin:5px 5px 0px 60px;">Name Type</div>` +
                `<div><span style="vertical-align:top;margin-top:20px;"> Inputs:</span> <textarea style="margin:5px 5px 5px 10px;" name="inputs"  rows="3" cols="30"` + disabled_prop + `>` + inputs_html + `</textarea></div>` +
                `<div><span style="vertical-align:top;margin-top:20px">Outputs:</span>  <textarea style="margin:5px 5px 5px 0px;"  name="outputs" rows="3" cols="30"` + disabled_prop + `>` + outputs_html + `</textarea></div>` +
                `<input              style="margin:10px;" value="Update Object Definition" type="button"` + disabled_prop + `/>`,
            callback: "HCAObjDef.edit_dialog_cb"
        })
    }

    static edit_dialog_cb(vals){
        if(vals.clicked_button_value === "Update Object Definition") {
            let obj_def_overload_id = vals.obj_def_overload_id
            let obj_def = HCAObjDef.object_name_plus_in_types_to_def_map[obj_def_overload_id]
            obj_def.source_path = vals.source_path

            if(vals.name !== vals.orig_name) {
                let orig_dom_elt_id = HCA.make_object_id(obj_def) //do with dataset_obj having orig name
                let orig_dom_elt = globalThis[orig_dom_elt_id]
                orig_dom_elt.innerText = vals.name //set to new name
                obj_def.name = vals.name //set to new name
                let new_dom_elt_id = HCA.make_object_id(obj_def) //do with dataset_obj having new name
                orig_dom_elt.setAttribute("id", new_dom_elt_id)
                delete HCAObjDef.object_name_plus_in_types_to_def_map[obj_def.obj_id]
                obj_def.obj_id = new_dom_elt_id
                HCAObjDef.object_name_plus_in_types_to_def_map[new_dom_elt_id] = obj_def
            }

            let new_ins_objs = {}
            let in_lines = vals.inputs.trim().split("\n")
            for(let line of in_lines) {
                line = line.trim()
                let [name, type] = split(line, " ")
                new_ins_objs.push({name: name, type: type})
            }
            if(!Utils.similar(new_ins_objs, obj_def.inputs)) {
                delete HCAObjDef.object_name_plus_in_types_to_def_map[obj_def.obj_id]
                obj_def.inputs = new_ins_objs
                let new_new_obj_id = HCA.make_object_id(obj_def)
                obj_def.obj_id = new_new_obj_id
                HCAObjDef.object_name_plus_in_types_to_def_map[new_new_obj_id] = obj_def
            }

            let new_outs_objs = {}
            let out_lines = vals.outputs.trim().split("\n")
            for(let line of vals.outputs) {
                line = line.trim()
                let [name, type] = split(line, " ")
                new_outs_objs.push({name: name, type: type})
            }
            if(!Utils.similar(new_outs_objs, obj_def.outputs)) {
                obj_def.outputs = new_outs_objs
            }

            let new_treegroup_arr = vals.TreeGroup.split("/'")
            if(!Utils.similar(new_treegroup_arr, dataset_obj.TreeGroup)){
                obj_def.change_treegroup(new_treegroup_arr)
            }
            SW.close_window(vals.window_index)
        }
        else if(vals.clicked_button_value === "close_button"){
            SW.close_window(vals.window_index)
        }
    }
    change_treegroup(new_treegroup_arr){
        this.remove()
        this.set_treegroup(new_treegroup_arr)
    }

    remove(){
        this.delete_obj_def_from_tree()
        delete HCAObjDef.object_name_plus_in_types_to_def_map[this.obj_id]
        let index = HCAObjDef.object_name_to_defs_map[this.objectName].indexof(this)
        HCAObjDef.object_name_to_defs_map.splice(index, 1) //remove it
        this.remove_from_pallette()
    }

    remove_from_pallette(){
        let dom_id = HCAObjDef.make_dom_id(this)
        let dom_elt = globalThis[dom_id]
        dom_elt.remove()
    }

    set_treegroup(new_treegroup_arr){
        this.TreeGroup = new_treegroup_arr
        this.insert_obj_def_into_tree()
        HCA.insert_obj_def_into_pallette(this)
    }
}