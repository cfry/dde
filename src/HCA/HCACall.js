globalThis.HCACall = class HCACall{
    constructor(json_obj){
        if(!json_obj.objectName){
            DDE.error("Attempt to create an HCA object call without an objectName.<br/>" +
                "Other Attributes: " + JSON.stringify(json_obj))
        }
        let obj_id = HCAObjDef.make_obj_id(json_obj)
        let the_obj_def = HCAObjDef.object_name_plus_in_types_to_def_map[obj_id]
        //if there is already an obj-def_overload for this obj_id, use it, else
        //use the new obj in "this".
        //This way we avoid making duplicates as some files redefine
        let TreeGroup_changed = false
        for(let key of Object.keys(json_obj)){
            let val = json_obj[key]
            this[key] = val
        }
        if(!this.inputs)  { this.inputs  = [] } //CoreLib doesn't have an outputs field.
        if(!this.outputs) { the_obj_def.outputs = [] } //CoreLib doesn't have an outputs field.
        if(!this.line){
            this.line = JSON.stringify(json_obj)
        }
    }
}