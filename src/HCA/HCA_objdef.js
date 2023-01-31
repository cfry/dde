globalThis.HCAObjDef = class HCAObjDef {
    static obj_def_tree //will be a json obj of fields: folder_name, subfolders, obj_defs
    static sheets = []
    static current_sheet = null

    static init() {
        this.obj_def_tree = {folder_name: "root", //always a single path part string. no slashes
                             subfolders: [], //each is an obj with fields of folder_name, subfolders, obj_defs
                             obj_defs: [] //each of which will have a TreeGroup prop that is an array of strings, each a path part, that last one being the name of the folder that obj_def is in
                             }

    }
    constructor(json_obj){
        for(let key of Object.keys(json_obj)){
            let val = json_obj[key]
            if(key === "TreeGroup") {
                this.TreeGroup = val.split("/")
            }
            else {
                this[key] = val
            }
        }
        if(!this.TreeGroup) {//hits for the obj named "CoreLib".
            if(this.Primitive){
                this.TreeGroup = ["Primitives"]
            }
            else {
                this.TreeGroup = ["Misc"] //[this.objectName]
            } //fry added this because some objects didin't have a TreeGroup, such as the obj with objectName: "CoreLib". So I gave it one
        }
        if(!this.inputs)  { this.inputs  = [] } //CoreLib doesn't have an outputs field.
        if(this.objectName === "Output") {
            debugger;
        }
        if(!this.outputs) {
            this.outputs = []
        } //CoreLib doesn't have an outputs field.

        //console.log("just made HCAObjDef " + this.objectName)
        this.insert_obj_def_into_tree(HCAObjDef.obj_def_tree, this.TreeGroup)
    }

    //"this" is the obj_def that we're inserting into the tree, based on its
    //TreeGroup prop which is originally the TreeGroupArr arg.
    insert_obj_def_into_tree(look_in_folder, TreeGroupArr){
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
                return this.insert_obj_def_into_tree(new_fold, TreeGroupArr.slice(1))
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
    static insert_obj_defs_into_tree(json_obj_defs){
        if(json_obj_defs.top_level_obj_defs){
            json_obj_defs = json_obj_defs.top_level_obj_defs
        }
        for(let json_obj_def of json_obj_defs){
            new HCAObjDef(json_obj_def)
        }
    }

    //questionable because it means only one obj def per obj_name regardless of different arg types.
    //but if not, how could the netlist work with only objectNames in it?
    static obj_name_to_obj_def_map = {}

    static obj_name_to_obj_def(obj_name){
        return this.obj_name_to_obj_def_map[obj_name]
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
        for(let obj of this.sheets){
            if(obj.objectName === obj_name) { return obj}
        }
        return null //no sheet of that name
    }
}
HCAObjDef.init()