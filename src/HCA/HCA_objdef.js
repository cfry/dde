globalThis.HCAObjDef = class HCAObjDef {
    static obj_def_tree //will be a json obj of fields: folder_name, subfolders, obj_defs
    static sheets
    static current_sheet
    static current_obj_def
    static core_lib_top_level_tree_names
    static object_name_to_defs_map
    static obj_id_to_obj_def_map

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
        this.obj_id_to_obj_def_map = {}
    }

    constructor(json_obj){
        if(!json_obj.objectName){
            DDE.error("Attempt to create an HCA object definition without an objectName.<br/>" +
                "Other Attributes: " + JSON.stringify(json_obj))
        }
        if(!json_obj.inputs)  { json_obj.inputs  = [] }
        //must do the above for the below call to make_obj_id to work
        if(!json_obj.outputs) { json_obj.outputs = [] }
        let obj_id = (json_obj.obj_id ? json_obj.obj_id : HCAObjDef.make_obj_id(json_obj) )
        let the_obj_def = HCAObjDef.obj_id_to_obj_def_map[obj_id]
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
        if(!the_obj_def.inputs)  { this.inputs  = [] } //CoreLib doesn't have an outputs field.
        if(!the_obj_def.outputs) {
            the_obj_def.outputs = []
        } //CoreLib doesn't have an outputs field.
        if(!the_obj_def.prototypes) {
            the_obj_def.prototypes = []
        }
        for(let i = 0; i <  the_obj_def.prototypes.length; i++){
            let pt = the_obj_def.prototypes[i]
            if(!(pt instanceof HCACall)){
                pt.containing_obj_id = obj_id
                let a_HCACall = new HCACall(pt) //with no containing def_obj passed in as 2nd arg,
                //don't attempt to uniquify call_names.
                // this allows for loading up all the prototypes before checkign against them all
                //to find a potentially needed unique call name.
                the_obj_def.prototypes[i] = a_HCACall
            }
            else {
                pt.containing_obj_id = obj_id //make sure our call obj knows what obj_def its inside of.
            }
        }
        if(!the_obj_def.netList){
            the_obj_def.netList = []
        }
        if(!the_obj_def.line){
            the_obj_def.line = JSON.stringify(json_obj)
        }
        if(making_new_obj) {
            the_obj_def.obj_id = obj_id
            HCAObjDef.obj_id_to_obj_def_map[obj_id] = the_obj_def //add or replaces if already exists
            for(let call_obj of this.prototypes) {
               call_obj.make_call_name_unique_maybe(this) //wait until now to do this because we want tis fn to be able to see all the call_objs in THIS.
            }
            the_obj_def.add_or_replace_in_object_name_to_defs_map()
            the_obj_def.insert_obj_def_into_tree(HCAObjDef.obj_def_tree, this.TreeGroup)
            the_obj_def.insert_obj_def_into_sheets_menu_maybe()
            HCA.insert_obj_def_into_pallette(the_obj_def) //but only if not already in
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
                    HCAObjDef.display_obj_def(HCAObjDef.current_sheet)
                }
                else {
                    for(let sheet of HCAObjDef.sheets){
                        if(sheet.source_path === source_path){
                            HCAObjDef.display_obj_def(sheet)
                            return
                        }
                    }
                    let an_obj_def = this.first_obj_def_with_source_path(source_path)
                    if(an_obj_def){
                        HCAObjDef.display_obj_def(an_obj_def)
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
            //see HCAObjDef.display_obj_def for other insertion into the menu.
            //but the sheets at the top, and the non-sheets at the bottom
        }
    }


    static json_string_of_defs_in_obj_def(obj_def=HCAObjDef.current_obj_def, files_array=ipg_to_json.loaded_files){
        let json_obj = this.json_obj_of_defs_in_obj_def(obj_def, files_array)
        return Editor.pretty_print(JSON.stringify(json_obj))
    }

    static json_obj_of_defs_in_obj_def(obj_def, files_array=ipg_to_json.loaded_files){
        let found_obj_defs = this.obj_defs_called_by_obj_def(obj_def, files_array)
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
    static obj_defs_called_by_obj_def(obj_def, files_array=ipg_to_json.loaded_files, result_obj_defs=[]){
        if(result_obj_defs.includes(obj_def))               {} //already got this obj_def so don't add it again!
        else if(!files_array.includes(obj_def.source_path)) {} //exclude obj_def
        else {
            result_obj_defs.push(obj_def)                  //include obj_def and maybe obj_defs it calls
            for(let obj_call of obj_def.prototypes){
                let a_obj_def = this.obj_call_to_obj_def(obj_call)
                if(!a_obj_def){
                    warning("HCAObjDef.obj_defs_called_by_obj_def found obj_call that has no definition: " + obj_call.objectName)
                }
                else {
                    this.obj_defs_called_by_obj_def(a_obj_def, files_array, result_obj_defs)
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
        {TreeGroup: ["BuiltIn"],
            objectName: 'INVERT',
            inputs: [{type: 'Bit', name: 'In1'}],
            outputs:[{type: 'Bit', name: "Out1"}],
            netList:[],
            prototypes:[],
            line: "Object ( Bit Out1) INVERT( Bit In1)"
         },
        {TreeGroup: ["BuiltIn"],
            objectName: 'AND',
            inputs: [{type: 'Bit', name: 'In1'}, {type: 'Bit', name: 'In2'}],
            outputs:[{type: 'Bit', name: "Out"}],
            netList:[],
            prototypes:[],
            line: "Object ( Bit Out) AND( Bit In1, Bit In2)"
        },
        {TreeGroup: ["BuiltIn"],
            objectName: 'OR',
            inputs: [{type: 'Bit', name: 'In1'}, {type: 'Bit', name: 'In2'}],
            outputs:[{type: 'Bit', name: "Out"}],
            netList:[],
            prototypes:[],
            line: "Object ( Bit OUT) OR( Bit In1, Bit In2)"
        },
        {TreeGroup: ["BuiltIn"],
            objectName: 'Input',
            inputs: [],
            outputs:[{type: 'Variant', name: 'In1'}],
            netList:[],
            prototypes:[],
            line: "Object ( Variant In1) Input"
        },
        {TreeGroup: ["BuiltIn"],
            objectName: 'Output',
            inputs: [{type: 'Variant', name: 'Out1'}],
            outputs:[],
            netList:[],
            prototypes:[],
            line: "Object Output( Variant Out1)"
        },
        {TreeGroup: ["BuiltIn"],
            objectName: 'Junction',
            inputs: [{type: 'Variant', name: 'In0'}],
            outputs:[{type: 'Variant', name: 'Out1'}, {type: 'Variant', name: 'Out2'}, {type: 'Variant', name: 'Out3'}],
            netList:[],
            prototypes:[],
            line: "Object ( Variant Out1, Variant Out2, Variant Out3) Junction( Variant In0)"
        },
        {TreeGroup: ["BuiltIn"],
            objectName: '$Select',
            inputs: [{type: 'Variant', name: '#0'}, {type: 'Variant', name: '#1'}, {type: 'Bit', name: 'S'}],
            outputs:[{type: 'Variant', name: 'Out'}],
            netList:[],
            prototypes:[],
            line: "Object ( Variant Out) $Select( Variant '#0', Variant '#1', Bit S)"
        },
        {TreeGroup: ["BuiltIn"],
            objectName: '$Cast',
            inputs: [{type: 'Variant', name: 'Data'}, {type: 'Variant', name: 'Type'}],
            outputs:[{type: 'Variant', name: 'Out'}],
            netList:[],
            prototypes:[],
            line: "Object ( Variant Out) $Cast( Variant Data, Variant Type)"
        },
        {TreeGroup: ["BuiltIn"],
            objectName: 'Text',
            inputs: [],
            outputs:[],
            netList:[],
            prototypes:[],
            line: "Object () Text()"
        }
        ]
        HCAObjDef.insert_obj_defs_into_tree("built_in", json_obj_defs)
    }

    static display_obj_def(obj_def_or_obj_id){
        let obj_def
        if(typeof(obj_def_or_obj_id)  === "string"){
            obj_def = HCAObjDef.obj_id_to_obj_def_map[obj_def_or_obj_id]
            if(!obj_def) {
                warning("Attempt to edit an object definition named: " + obj_def_or_obj_id +
                    " but couldn't find it.")
                return
            }
        }
        else { obj_def = obj_def_or_obj_id }
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
        HCA.update_obj_def_select_dom_elt(obj_def.obj_id)
        let tree_path = HCAObjDef.current_obj_def.TreeGroup.join("/")
        tree_path_id.value = tree_path
        source_path_id.value = obj_def.source_path
        HCAObjDef.redraw_obj_def()
        inspect(HCAObjDef.current_obj_def)
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
        let call_names_array = [] //array indices are lgraph node ids. arr elts are call_names

        //make the lgraph node json obj and compute the min_x and min_y position for all the nodes
        for(let i = 0; i <  obj_def.prototypes.length; i++){
            let call_obj = obj_def.prototypes[i]
            call_names_array[i] = call_obj.call_name
            let a_node = HCACall.call_obj_to_node(call_obj, i)
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
            node.pos[1] += 25 //because there's some error in where the Y pos in a node is.
                              //with this offset, the top of the topmost block comes to
                              // the top of the display area, not above it.
        }

        let netList = obj_def.netList //an array of objs, one per link.
        //each of these link objs has 2 props: "sink" and "source"
        //the sink obj as 2 props: call_name and outputNumber (a non-neg int)
        //the source obj as 2 props: call_name and inputNumber (a non-neg int)
        let lgraph_links = []
        for(let connection_index = 0;  connection_index < netList.length; connection_index++){
            let connection          = netList[connection_index]
            let source_call_name     = connection.source.call_name
            let source_outputNumber = connection.source.outputNumber
            let sink_call_name       = connection.sink.call_name
            let sink_inputNumber    = connection.sink.inputNumber

            let source_node =  HCACall.call_name_to_node(source_call_name, lgraph_config_json.nodes)
            let sink_node   =  HCACall.call_name_to_node(sink_call_name,   lgraph_config_json.nodes)

            let type
            try {
                type = source_node.outputs[source_outputNumber].type
                //let obj_def = HCAObjDef.obj_name_to_obj_def(sink_objectName)
                //type = obj_def.outputs[sink_outputNumber].type
                //let source_obj_call = connection.source //obj_def.prototypes[i]
                //type = source_obj_call.outputs[source_outputNumber].type //todo cant work. no type info in call
            }
            catch(err) { type = "Varient"} //todo this is a hack, need to fix.
            let source_node_id = call_names_array.indexOf(source_call_name)
            let sink_node_id   = call_names_array.indexOf(sink_call_name)
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
        HCA.lgraph.configure(lgraph_config_json) //ok if json_obj is undefined, which it will be if json_string defaults to "", or we launch HCA_UI from an empty editor buffer.
        for(let node of HCA.lgraph._nodes){ //if json_string === "", lgraph._nodes will be []
            HCACall.node_add_usual_actions(node)
        }
    }

    static show_obj_def_dialog(event){
        let the_objectName = event.target.innerText
        let obj_defs = HCAObjDef.object_name_to_defs_map[the_objectName]
        inspect(obj_defs)
        let obj_defs_select_html = `<select id="obj_def_overload_id" style="margin:5px;">`
        for(let obj_def of obj_defs){
            obj_defs_select_html += "<option value='" + obj_def.obj_id + "'>" + obj_def.obj_id + "</option>"
        }
        obj_defs_select_html += "</select><br/>"
        show_window({
            title: "Choose Object Definition Operation",
            x:200, y:100, width:360, height:270,
            content: `for: <b>` + the_objectName + `</b><br/>
                     <input type="hidden" name="the_objectName" value="` + the_objectName + `"/>
                     First, choose an overloaded object definition<br/>
                     with input types (after commas):<br/>` +
                     obj_defs_select_html +
                    `<input type="submit" value="Edit Definition"  style="margin:5px;"/><br/>
                     <input type="submit" value="Edit Attributes"  style="margin:5px;"/><br/> 
                     <input type="submit" value="Make Call"        style="margin:5px;"/><br/>
                     <input type="submit" value="Delete"           style="margin:5px;"/><br/>
                     <input type="submit" value="Find"             style="margin:5px;"/>`,

            callback: "HCAObjDef.show_obj_def_dialog_cb"
        })

    }

    static show_obj_def_dialog_cb(vals){
        let the_objectName = vals.the_objectName
        let obj_id = vals.obj_def_overload_id
        let obj_def = HCAObjDef.obj_id_to_obj_def_map[obj_id]
        if(vals.clicked_button_value === "Make Call"){
            //HCA.make_and_add_block('` + tree_path_and_obj_name + `', event)">` + obj_def.objectName + "</div>
            let call_obj = HCACall.make_and_add_call_to_definition(obj_def, HCAObjDef.current_obj_def)
            HCACall.display_call_obj(call_obj)
        }
        else if(vals.clicked_button_value === "Edit Definition"){
            //HCAObjDef.show_edit_dialog(obj_def)
            HCAObjDef.update_current_obj_def_from_nodes()
            HCAObjDef.display_obj_def(obj_def)
        }
        else if(vals.clicked_button_value === "Edit Attributes"){
            HCAObjDef.show_edit_attribute_dialog(obj_def)
        }
        else if(vals.clicked_button_value === "Delete"){
            //dataset_obj/obj_def.remove() //todo
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

    static non_attribute_names = ["TreeGroup", "inputs", "line", "netList",
                                  "obj_id", "objectName", "outputs", "prototypes",
                                  "revisions", "source_path"]

    static attribute_names_in_obj_def(obj_def){
        let result = []
        for(let key of Object.keys(obj_def)){
           if(!this.non_attribute_names.includes(key)) {
               result.push(key)
           }
        }
        return result
    }


    static show_edit_attribute_dialog(obj_def){
        let built_in_warning = ""
        let disabled_prop = ""
        if(obj_def.TreeGroup[0] === "BuiltIn"){
            built_in_warning = `<div style="color:red;">BuiltIn object definitions can't be edited.</div>`
            disabled_prop = " disabled "
        }
        let names_and_values = ""
        let description_value = ""
        let attr_count = 0
        for(let key of this.attribute_names_in_obj_def(obj_def)){
            let val =  obj_def[key]
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
            content: `of Object Definition: <b>` + obj_def.obj_id + `</b>` +
                built_in_warning +
                `<input type="hidden"                               value="` + obj_def.objectName + `" name="object_name"/>` +
                `<input type="hidden"                               value="` + obj_def.obj_id     + `" name="obj_def_id" />` +
                `<div style="margin:5px;"><b><i>Name: Value</i></b> ` + count_comment + `</div>` +
                `<textarea id="hca_attributes_id" rows="5" cols="50" style="margin:5px;">` + names_and_values + `</textarea><br/>` +
                `<b><i>Description:</i></b><br/>` +
                `<textarea id="hca_description_id" rows="5" cols="50" style="margin:5px;">` + description_value + `</textarea><br/>` +
                `<input type="button"          style="margin:10px;" value="Update Object Definition" ` + disabled_prop + `/>`,
            callback: "HCAObjDef.edit_attribute_dialog_cb"
        })
    }

    static edit_attribute_dialog_cb(vals){
        if(vals.clicked_button_value === "Update Object Definition") {
            let obj_def_id = vals.obj_def_id
            let obj_def = HCAObjDef.obj_id_to_obj_def_map[obj_def_id]
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
                        obj_def[attr_name] = attr_value
                        attribute_names_in_dialog.push(attr_name)
                    }
                }
            }
            //Deleting attributes
            let att_names_in_obj_def = HCAObjDef.attribute_names_in_obj_def(obj_def)
            let att_names_to_delete  = Utils.symmetric_difference(att_names_in_obj_def, attribute_names_in_dialog)
            for(let att_name_to_delete of att_names_to_delete){
                if(att_name_to_delete === "description") {} //handle below
                delete obj_def[att_name_to_delete]
            }
            let des_val = hca_description_id.value.trim()
            if(des_val.length > 0) {
                obj_def.description = des_val
            }
            else {
                delete obj_def.description
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
        HCA.unregister_with_litegraph(this)
        this.delete_obj_def_from_tree()
        delete HCAObjDef.obj_id_to_obj_def_map[this.obj_id]
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

    static rename_obj_def(current_obj_def, new_obj_name){
        current_obj_def.remove()
        current_obj_def.remove_from_pallette
        current_obj_def.objectName = new_obj_name
        HCAObjDef.obj_id_to_obj_def_map[this.obj_id] = current_obj_def
        HCAObjDef.object_name_to_defs_map[current_obj_def.objectName].push(current_obj_def)
        current_obj_def.insert_obj_def_into_tree(HCAObjDef.obj_def_tree, this.TreeGroup)
        current_obj_def.insert_obj_def_into_sheets_menu_maybe()
        HCA.insert_obj_def_into_pallette(current_obj_def) //but only if not already in
        HCA.register_with_litegraph(current_obj_def)

    }

    static update_current_obj_def_from_nodes(){
        let cur_obj_def = HCAObjDef.current_obj_def
        if(cur_obj_def) { //usually, if not always, hits
            let nodes = HCA.lgraph._nodes //remake cur_obj_def.prototypes from this
            let new_HCACalls = []
            for (let node of nodes) {
                let new_HCACall = HCACall.node_to_HCACall(node)
                new_HCACall.containing_obj_id = cur_obj_def.obj_id
                new_HCACalls.push(new_HCACall)
            }
            cur_obj_def.prototypes = new_HCACalls
            let new_connections = []
            let links = HCA.lgraph.links  //remake cur_obj_def.netList from this.
            for (let link of links) {
                if(link) { //warning: after we've deleted a node, sometimes link is undefined. if so, don't do the below
                    let new_connection = {
                        source: {
                            call_name: HCACall.node_id_to_HCACall(link.origin_id, new_HCACalls).call_name,
                            outputNumber: link.origin_slot
                        },
                        sink: {
                            call_name: HCACall.node_id_to_HCACall(link.target_id, new_HCACalls).call_name,
                            inputNumber: link.target_slot
                        }
                    }
                    //link.type //"Variant"
                    new_connections.push(new_connection)
                }
            }
            cur_obj_def.netList = new_connections
        }
    }
}