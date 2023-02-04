globalThis.HCAObjDef = class HCAObjDef {
    static obj_def_tree //will be a json obj of fields: folder_name, subfolders, obj_defs
    static sheets = []
    static current_sheet = null

    static init() {
        this.obj_def_tree = {folder_name: "root", //always a single path part string. no slashes
                             subfolders: [], //each is an obj with fields of folder_name, subfolders, obj_defs
                             obj_defs: [] //each of which will have a TreeGroup prop that is an array of strings, each a path part, that last one being the name of the folder that obj_def is in
                             }
        this.define_built_ins()
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
        for(let obj of this.sheets){
            if(obj.objectName === obj_name) { return obj}
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
        this.insert_obj_defs_into_tree({top_level_obj_defs: [
        {TreeGroup: "BuiltIn", objectName: 'INVERT', objectType: 'INVERT',
            inputs: [{type: 'Bit', name: 'In1'}],
            outputs:[{type: 'Bit', name: "Out1"}],
            netlist:[],
            prototypes:[],
            line: "Object ( Bit Out1) INVERT( Bit In1)"
         },
        {TreeGroup: "BuiltIn", objectName: 'AND', objectType: 'AND',
            inputs: [{type: 'Bit', name: 'In1'}, {type: 'Bit', name: 'In2'}],
            outputs:[{type: 'Bit', name: "Out"}],
            netlist:[],
            prototypes:[],
            line: "Object ( Bit Out) AND( Bit In1, Bit In2)"
        },
        {TreeGroup: "BuiltIn", objectName: 'OR', objectType: 'OR',
            inputs: [{type: 'Bit', name: 'In1'}, {type: 'Bit', name: 'In2'}],
            outputs:[{type: 'Bit', name: "Out"}],
            netlist:[],
            prototypes:[],
            line: "Object ( Bit OUT) OR( Bit In1, Bit In2)"
        },
        {TreeGroup: "BuiltIn", objectName: 'Input', objectType: 'Input',
            inputs: [],
            outputs:[{type: 'Variant', name: 'In1'}],
            netlist:[],
            prototypes:[],
            line: "Object ( Variant In1) Input"
        },
        {TreeGroup: "BuiltIn", objectName: 'Output', objectType: 'Output',
            inputs: [{type: 'Variant', name: 'Out1'}],
            outputs:[],
            netlist:[],
            prototypes:[],
            line: "Object Output( Variant Out1)"
        },
        {TreeGroup: "BuiltIn", objectName: 'Junction', objectType: 'Junction',
            inputs: [{type: 'Variant', name: 'In0'}],
            outputs:[{type: 'Variant', name: 'Out1'}, {type: 'Variant', name: 'Out2'}, {type: 'Variant', name: 'Out3'}],
            netlist:[],
            prototypes:[],
            line: "Object ( Variant Out1, Variant Out2, Variant Out3) Junction( Variant In0)"
        },
        {TreeGroup: "BuiltIn", objectName: '$Select', objectType: '$Select',
            inputs: [{type: 'Variant', name: '#0'}, {type: 'Variant', name: '#1'}, {type: 'Bit', name: 'S'}],
            outputs:[{type: 'Variant', name: 'Out'}],
            netlist:[],
            prototypes:[],
            line: "Object ( Variant Out) $Select( Variant '#0', Variant '#1', Bit S)"
        },
        {TreeGroup: "BuiltIn", objectName: '$Cast', objectType: '$Cast',
            inputs: [{type: 'Variant', name: 'Data'}, {type: 'Variant', name: 'Type'}],
            outputs:[{type: 'Variant', name: 'Out'}],
            netlist:[],
            prototypes:[],
            line: "Object ( Variant Out) $Cast( Variant Data, Variant Type)"
        }
        ]})
    }
}
HCAObjDef.init()