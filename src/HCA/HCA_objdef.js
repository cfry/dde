globalThis.HCAObjDef = class HCAObjDef {
    static obj_def_tree
    static init() {
        this.obj_def_tree = {folder_name: "root", subfolders: [], obj_defs: []}

    }
    constructor(json_obj){
        for(let key of Object.keys(json_obj)){
            let val = json_obj[key]
            this[key] = val
            if(key === "TreeGroup") {
                this.TreeGroup = val.split("/")
            }
        }
        if(!this.TreeGroup) {//hits for the obj named "CorLib".
            this.TreeGroup = []
        }
        console.log("just made HCAObjDef " + this.objectName)
        this.insert_obj_def_into_tree(HCAObjDef.obj_def_tree, this.TreeGroup)
    }
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

    //path can be: like "CoreLib/GrammaticalOps/ReverseBits" or
    //                 ["CoreLib", "GrammaticalOps", "ReverseBits"]
    static path_to_json_obj(path, path_index = 0, look_in=HCAObjDef.obj_def_tree){
        if(typeof(path) === "string"){
            path = path.split("/")
        }
        let cur_path_part = path[path_index]
        if(path.length -1 === path_index) { //we're on the last path index.
            for (let obj of look_in.obj_defs) {
                if (obj.objectName === cur_path_part) { //beware. might be more than 1
                    return obj
                }
            }
            shouldnt("HCA_objdef.path_to_json_obj could not find obj")
        }
        else { //not on last path elt
            for(let subfold of look_in.subfolders){
                if(subfold.folder_name === cur_path_part) {
                    return this.path_to_json_obj(path, path_index + 1, subfold)
                }
            }
        }
    }
}
HCAObjDef.init()