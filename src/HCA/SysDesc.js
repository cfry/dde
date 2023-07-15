globalThis.SysDesc = class SysDesc {
    static name_to_sys_desc_object_map = {}
    static sys_desc_tree

    static init() {
        this.sys_desc_tree = null
        this.name_to_sys_desc_object_map = {}
    }

    constructor(json){
        for(let key of Object.keys(json)){
            if(!["children"].includes(key)){
                this[key] = json[key]
            }
        }
        this.children = []
        SysDesc.name_to_sys_desc_object_map[this.objectName] = this
    }
     /* obsolete after upgrade of sys_desc parser
    static parse_sys_desc_line(source_path, trimmed_line){
        let [sys_word_unused, name] = trimmed_line.split(" ")
        let sys_desc_obj = {
            name: name,
            line: trimmed_line,
            source_path: source_path,
            prototypes: [],
            netList:    [],
            revisions:  [],
            children:   [],
            description: ""
        }
        return sys_desc_obj
    }*/

    static insert_sys_descs_into_tree(source_path, sys_desc_json_obj){
        let new_sys_desc_inst = new SysDesc(sys_desc_json_obj)
        if(!this.sys_desc_tree){ //new_sys_desc_inst is top level
            this.sys_desc_tree = new_sys_desc_inst
        }
        for(let child_sys_desc_json_obj of sys_desc_json_obj.children){
            let child_sys_desc_inst = this.insert_sys_descs_into_tree(source_path, child_sys_desc_json_obj)
            new_sys_desc_inst.children.push(child_sys_desc_inst)
        }
        if(new_sys_desc_inst === this.sys_desc_tree) {  //new_sys_desc_inst is top level
            this.refresh_palette()
        }
        return new_sys_desc_inst
    }

    static refresh_palette(){
        let the_html = this.make_palette_html(this.sys_desc_tree)
        let summary_elt = HCA_palette_sys_desc_id.firstElementChild
        if(HCA_palette_sys_desc_id.children.length > 1) { //already have something there so delete it
            HCA_palette_sys_desc_id.children[1].remove() //remove the existing top level sys desc elt
        }
        summary_elt.insertAdjacentHTML("afterend", the_html)
    }

    static make_palette_html(sd_inst = SysDesc.sys_desc_tree){  // style='overflow:hidden;'
        if(!sd_inst){
            return "" //user has deleted the top level sys_desc, or there never was one.
        }
        let children = sd_inst.children
        let result
        if(children.length === 0){
            result = "<div onclick='SysDesc.show_sys_desc_dialog(event)' style='text-decoration:underline blue;margin-left:15px; white-space:nowrap;'>" + sd_inst.objectName + "\n"
        }
        else {
            result = "<details class='hca_folder'> <summary style='text-decoration:underline blue; white-space:nowrap;'>" +
                     "<a href='#' onclick='SysDesc.show_sys_desc_dialog(event)'> " + sd_inst.objectName + "</a></summary>\n"
        }
        for(let child_sys_desc_inst of sd_inst.children) {
            let child_html = this.make_palette_html(child_sys_desc_inst)
            result += child_html
        }
        if(children.length === 0){
            result += "</div>\n"
        }
        else {
            result += "</details>\n"
        }
        return result
    }

    static show_sys_desc_dialog(event){
        let the_objectName = event.target.innerText
        let sys_desc_inst = SysDesc.name_to_sys_desc_object_map[the_objectName]
        if((sys_desc_inst.children.length > 0) && (event.offsetX <= 12)) {  } //user click on the triangle, so don't open the dialog box.
        else {
            event.preventDefault() //stop twist down from happening

            inspect(sys_desc_inst)
            show_window({
                title: "Choose System Description Operation",
                x: 200, y: 100, width: 400, height: 200,
                content: `for: <b>` + the_objectName + `</b><br/>
                     <input type="hidden" name="the_objectName" value="` + the_objectName + `"/>
                     <input type="submit" value="Edit Definition"  style="margin:5px;"/><br/>
                     <input type="submit" value="Edit Attributes"  style="margin:5px;"/><br/> 
                     <input type="submit" value="Make New Child System Description" style="margin:5px;"/><br/>
                     <input type="submit" value="Delete"           style="margin:5px;"/><br/>
                     <input type="submit" value="Find"             style="margin:5px;"/>`,

                callback: "SysDesc.show_sys_desc_dialog_cb"
            })
        }
    }

    delete_sys_desc_with_warning(){
        let message
        if(this === SysDesc.sys_desc_tree){
            message = "OK to delete all System Descriptions?\n" +
                      "(You can reload their original file but changes will be lost.)"
        }
        else {
            message = "OK to delete System Description " + this.objectName
            if (this.children.length > 0) {
                message += "\nand all descendents, including\n"
                let on_first_iteration = true
                for (let child of this.children) {
                    message += (on_first_iteration ? "" : ", ") + child.objectName
                    on_first_iteration = false
                }
            }
            message += "?"
        }
        if(confirm(message)){
            this.delete_sys_desc()
        }
    }

    delete_sys_desc(possible_parent = SysDesc.sys_desc_tree, remove_from_map = false) {
        if (this === SysDesc.sys_desc_tree) {
            SysDesc.sys_desc_tree = null
            SysDesc.name_to_sys_desc_object_map = []
        }
        else {
            let children_copy = possible_parent.children.slice()
            for(let i = 0; i < children_copy.length; i++) { //use slice to make copy as we're deleting out of an array we're looping over
                let child = children_copy[i]
                if (child === this) { //found the one sys_desc we declare to be removed.
                    possible_parent.children.splice(i, 1) //remove from the real location
                    this.delete_sys_desc(child, true)
                }
                else {
                    this.delete_sys_desc(child, remove_from_map) //used passed in value
                } //even if we already removed the one declared to be removed, we still have to remove its descendents from the map
            }
            if(remove_from_map){
               delete SysDesc.name_to_sys_desc_object_map[possible_parent.objectName]
            }
        }
    }

    static show_sys_desc_dialog_cb(vals){
        let the_objectName = vals.the_objectName
        let sys_desc_inst = SysDesc.name_to_sys_desc_object_map[the_objectName]
        if(vals.clicked_button_value === "Edit Definition"){
            //HCAObjDef.show_edit_dialog(obj_def)
            HCAObjDef.display_obj_def(sys_desc_inst)
        }
        else if(vals.clicked_button_value === "Edit Attributes"){
            SysDesc.show_edit_attribute_dialog(sys_desc_inst)
        }
        else if(vals.clicked_button_value === "Make New Child System Description"){
            SysDesc.show_new_child_dialog(sys_desc_inst)
        }
        else if(vals.clicked_button_value === "Delete"){
            sys_desc_inst.delete_sys_desc_with_warning()
            SysDesc.refresh_palette()
        }
        else if(vals.clicked_button_value === "Find"){
            find_doc_input_id.value = the_objectName
            find_doc_button_id.click()
        }
        else if(vals.clicked_button_value === "close_button"){
            SW.close_window(vals.window_index)
        }
        else {
            shouldnt("In show_sys_desc_dialog_cb got invalid clicked_button_value: " +
                vals.clicked_button_value)
        }
    }

    static attribute_names_in_sys_desc(sys_desc_inst){
        let result = []
        for(let key of Object.keys(sys_desc_inst)){
            if(!["children"].includes(key)) {
                result.push(key)
            }
        }
        return result
    }

    static show_edit_attribute_dialog(sys_desc_inst){
        let names_and_values = ""
        let description_value = ""
        let attr_count = 0
        for(let key of this.attribute_names_in_sys_desc(sys_desc_inst)){
            let val =  sys_desc_inst[key]
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
                x:200, y:100, width:450, height:400,
                content: `of System Description: <b>` + sys_desc_inst.objectName + `</b>` +
                    `<input type="hidden"                               value="` + sys_desc_inst.objectName + `" name="the_objectName"/>` +
                    `<div style="margin:5px;"><b><i>Name: Value</i></b> ` + count_comment + `</div>` +
                    `<textarea id="hca_attributes_id" rows="8" cols="50" style="margin:5px; white-space:pre; overflow-wrap:normal; overflow-x:scroll;">` +
                     names_and_values + `</textarea><br/>` +
                    `<b><i>Description:</i></b><br/>` +
                    `<textarea id="hca_description_id" rows="5" cols="50" style="margin:5px;">` + description_value + `</textarea><br/>` +
                    `<input type="button"          style="margin:10px;" value="Update System Definition"/>`,
                callback: "SysDesc.edit_attribute_dialog_cb"
            })
    }

    static edit_attribute_dialog_cb(vals){
        if(vals.clicked_button_value === "Update System Definition") {
            let is_renaming = false
            let orig_objectName = vals.the_objectName
            let sys_desc_inst = SysDesc.name_to_sys_desc_object_map[orig_objectName]
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
                        if(attr_name && (attr_value !== orig_name)){ //renaming this SysDesc
                            is_renaming = true
                        }
                        sys_desc_inst[attr_name] = attr_value
                        attribute_names_in_dialog.push(attr_name)
                    }
                }
            }
            //Deleting attributes
            let att_names_in_sys_desc = SysDesc.attribute_names_in_sys_desc(sys_desc_inst)
            let att_names_to_delete  = Utils.symmetric_difference(att_names_in_sys_desc, attribute_names_in_dialog)
            for(let att_name_to_delete of att_names_to_delete){
                if(att_name_to_delete === "description") {} //handle below
                delete sys_desc_inst[att_name_to_delete]
            }
            let des_val = hca_description_id.value.trim()
            if(des_val.length > 0) {
                sys_desc_inst.description = des_val
            }
            else {
                delete sys_desc_inst.description
            }
            if(!sys_desc_inst.objectName){
                warning('You have deleted the "name:" row. please add it back.')
                return
            }

            SW.close_window(vals.window_index)
            if(is_renaming){
                delete SysDesc.name_to_sys_desc_object_map[orig_objectName]
                SysDesc.name_to_sys_desc_object_map[sys_desc_inst.objectName] = sys_desc_inst
                SysDesc.refresh_palette()
            }
        }
        else if(vals.clicked_button_value === "close_button"){
            SW.close_window(vals.window_index)
        }
    }

    static default_source_path(){
        if(SysDesc.sys_desc_tree) {
            return SysDesc.sys_desc_tree.source_path
        }
        else {
            return "/User/..."
        }
    }

    static show_new_child_dialog(parent_sys_desc_inst){
        let names_and_values =
`name: your_name_here
line: user created
source_path: ` + this.default_source_path() +
`\nResource: Default
MoreAttributes: here` //careful: "MoreAttributes" is used below
        let description_value = ""
        let first_line
        let parent_name
        if(parent_sys_desc_inst){
            first_line = "Make new child of: <b>" + parent_sys_desc_inst.objectName + "</b>"
            parent_name = parent_sys_desc_inst.objectName
        }
        else {
            first_line = "Make a new top level System Description."
            parent_name = "none"
        }
        show_window(
            {title: "Make New System Description",
                x:200, y:100, width:450, height:400,
                content: first_line +
                    `<input type="hidden"                               value="` + parent_name + `" name="parent_name"/>` +
                    `<div style="margin:5px;"><b><i>Name: Value</i></b> ` + `</div>` +
                    `<textarea id="hca_attributes_id" rows="8" cols="50" style="margin:5px; white-space:pre; overflow-wrap:normal; overflow-x:scroll;">` +
                    names_and_values + `</textarea><br/>` +
                    `<b><i>Description:</i></b><br/>` +
                    `<textarea id="hca_description_id" rows="5" cols="50" style="margin:5px;">` + description_value + `</textarea><br/>` +
                    `<input type="button" style="margin:10px;" value="Make New System Definition"/>`,
                callback: "SysDesc.new_child_dialog_cb"
            })
    }

    static new_child_dialog_cb(vals){
        if(vals.clicked_button_value === "Make New System Definition") {
            let is_renaming = false
            let parent_name = vals.parent_name
            let new_json_obj = {}
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
                        if (attr_name !== "MoreAttributes") {
                            let attr_value = row.substring(attr_name_delimiter_pos + 2).trim()
                            new_json_obj[attr_name] = attr_value
                        }
                    }
                }
            }
            if(!new_json_obj.objectName){
                warning("The new System Description must have a name.")
                return
            }
            else if(SysDesc.name_to_sys_desc_object_map[new_json_obj.objectName]){
                warning("The name you're using is already defined.\n" +
                         "Use a different one or edit the original System Description.")
                return
            }
            let sys_desc_inst = new SysDesc(new_json_obj)
            let des_val = hca_description_id.value.trim()
            if(des_val.length > 0) {
                sys_desc_inst.description = des_val
            }
            let parent_sys_desc_inst = SysDesc.name_to_sys_desc_object_map[parent_name] //parent_name will be "none" if we are making a new top level sys desc
            if(parent_sys_desc_inst) {
                parent_sys_desc_inst.children.push(sys_desc_inst)
            }
            else { //we have a new top level sys desc
                SysDesc.sys_desc_tree = sys_desc_inst
            }
            SW.close_window(vals.window_index)
            SysDesc.refresh_palette()
        }
        else if(vals.clicked_button_value === "close_button"){
            SW.close_window(vals.window_index)
        }
    }

    static show_no_sys_desc_tree_dialog_maybe(event){
        if(!SysDesc.sys_desc_tree){
            if(confirm("There are no System Definitions defined.\n" +
                    "Normally, you define them from a file using File menu/Open.\n" +
                    "But would you like to make a new top level one from scratch?")){
                SysDesc.show_new_child_dialog(null) //null means no parent
            }
        }
    }

    static find_sys_descs(search_string){
        let def_match=[], included_in_name=[], children=[]
        search_string = search_string.toLowerCase()
        for(let a_name in this.name_to_sys_desc_object_map) {
            let a_sys_desc = this.name_to_sys_desc_object_map[a_name]
            let a_name_lc = a_name.toLowerCase()
            if(a_name_lc === search_string) {
                def_match.push(a_sys_desc)
            }
            if(a_name_lc.includes(search_string)){
                included_in_name.push(a_sys_desc)
            }
            for(let child of a_sys_desc.children){
                if(child.objectName.toLowerCase() === search_string) {
                    children.push(a_sys_desc)
                }
            }
        }
        return {
            "System Description name matches":       def_match,
            "System Description name includes":      included_in_name,
            "System Description has children named": children
        }
    }

    static sys_descs_in_files(files_array) {
        if(!this.sys_desc_tree){
            return null
        }
        else if(files_array.includes(this.sys_desc_tree.source_path)){
            return this.sys_desc_tree
        }
        else {
            return null
        }
    }
}