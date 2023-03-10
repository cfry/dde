globalThis.Dataset = class Dataset{
    static name_to_dataset_object_map = {}
    static dataset_def_tree

    static init() {
        this.dataset_def_tree = {folder_name: "root", //always a single path part string. no slashes
                                 subfolders:  [], //each is an obj with fields of folder_name, subfolders, datasets
                                 datasets:    [] //each of which will have a TreeGroup prop that is an array of strings, each a path part, that last one being the name of the folder that the dataset is in
        }
    }

    //very similar to HCAObjDef
    constructor(json_obj){
        for(let key of Object.keys(json_obj)){
            let val = json_obj[key]
            this[key] = val
        }
        if(!this.name){
            DDE.error("Attempt to create a dataset definition without a name.<br/>" +
                      "Other Attributes: " + JSON.stringify(json_obj))
        }
        if(!this.line){
            this.line = JSON.stringify(json_obj)
        }
        this.insert_dataset_def_into_tree(Dataset.dataset_def_tree, this.TreeGroup)
        Dataset.insert_dataset_into_pallette(this)
        let collector = this.make_collector() //causes new collector to be inserted into obj def tree and obj def pallette
        let exposer   = this.make_exposer()   //causes new exposer   to be inserted into obj def tree and obj def pallette
    }

    //"this" is the dataset_def that we're inserting into the tree, based on its
    //TreeGroup prop which is originally the TreeGroupArr arg.
    insert_dataset_def_into_tree(look_in_folder=Dataset.dataset_def_tree, TreeGroupArr, pallette_dom_elt){
        if(TreeGroupArr.length === 0){
            //if there's already a same-named ds, in this folder, replace it with THIS, else
            //add THIS to the look_in_folder folder
            for(let a_ds_index = 0; a_ds_index < look_in_folder.datasets.length; a_ds_index++){
                let a_ds = look_in_folder.datasets[a_ds_index]
                if(a_ds.name === this.name) {
                    look_in_folder.datasets[a_ds_index] = this
                    return
                }
            }
            look_in_folder.datasets.push(this)
        }
        else {
            let sub_folder = Dataset.get_subfolder_named(look_in_folder,  TreeGroupArr[0])
            if(sub_folder){
                return this.insert_dataset_def_into_tree(sub_folder, TreeGroupArr.slice(1))
            }
            else {
                let new_fold = {folder_name: TreeGroupArr[0], subfolders: [], datasets: []}
                look_in_folder.subfolders.push(new_fold)
                return this.insert_dataset_def_into_tree(new_fold, TreeGroupArr.slice(1)) //slice(1) cuts off the first elt of the array and makes a copy of the rest.
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

    //in the default callback to parse()
    static insert_dataset_defs_into_tree(source_path, json_dataset_defs=null){
        this.make_dataset_defs_slowly(source_path, json_dataset_defs)
    }

    static make_dataset_defs_slowly(source_path=null, json_dataset_defs, next_index = 0){
        if(this.pending_rendering_dom_id && !window[this.pending_rendering_dom_id]) { //take a lap waiting for the pendeing folder elt to render
            setTimeout(function(){
                Dataset.make_dataset_defs_slowly(source_path, json_dataset_defs, next_index)
            }, 200)
            return
        }
        else if (next_index >= json_dataset_defs.length) {} //all done with json_dataset_defs. usually this doesn't hit, but if 0 dataset_defs in a file, it will
        else {
            let json_dataset_def = json_dataset_defs[next_index]
            json_dataset_def.source_path = source_path //do this here, just before new Dataset so
            //the resulting obj will have the source_path in it, AND not above here
            //because we'll call make_object_defs_slowly sometimes with JSON parsed from
            //a file, and we want that file name to be "updated" to the actual source file,
            //not just what might happen to be in the json string in the file for source_path
            new Dataset(json_dataset_def)
            if(next_index < (json_dataset_defs.length - 1)) {
                this.make_dataset_defs_slowly(source_path, json_dataset_defs, next_index + 1)
            }
        }
    }

    //TreeGroupArr contains the tree and the ds obj name at the end. Can be a string with slash separators
    //but simpler is just Dataset.name_to_dataset_object_map.dataset_name
    static tree_path_to_dataset_obj(look_in_folder=Dataset.dataset_def_tree, TreeGroupArr, pallette_dom_elt){
        if(typeof(TreeGroupArr) === "string") {TreeGroupArr = TreeGroupArr.split("/") }
        //if(TreeGroup[0] === "root") {
        //    return Dataset.tree_path_to_dataset_obj(TreeGroupArr.slice(1))
        //}
        if(TreeGroupArr.length === 1){
            for(let a_ds_obj of look_in_folder.datasets){
                if(a_ds_obj.name === TreeGroupArr[0]) {
                    return a_ds_obj
                }
            }
            dde_error("tree_path_to_dataset_obj couldn't find: " + TreeGroupArr)
        }
        else {
            let sub_folder = Dataset.get_subfolder_named(look_in_folder,  TreeGroupArr[0])
            if(sub_folder){
                return this.tree_path_to_dataset_obj(sub_folder, TreeGroupArr.slice(1))
            }
            else {
                dde_error("tree_path_to_dataset_obj couldn't find: " + TreeGroupArr)
            }
        }
    }

    static parse_dataset(source_path, line){
        let split_line = line.split(" ")
        let name = split_line[1]
        let open_pos = line.indexOf("(")
        let close_pos = line.indexOf(")")
        let types_str = line.substring(open_pos + 1, close_pos).trim()
        let types_split = types_str.split(",")
        let types_array = []
        for(let type of types_split) {
            types_array.push(type.trim())
        }
        let comment_start = line.indexOf("//")
        let comment = line.substring(comment_start + 15).trim()
        let comment_split = comment.split(",")
        let context_type = parseInt(comment_split[0].trim())
        let color_int  = parseInt(comment_split[1].trim())
        let tree_group = (comment_split[2] ? comment_split[2] : null)
        let tree_group_arr = (tree_group ? tree_group.split("/") : ["Misc"])
        //note datasets  is a forrest, not a tree from its "tree_path standpoint,
        //but in the pallete, the top level item DataSet Tree makes it into a visual tree
        //tree_group_arr.unshift("Datasets")

        let dataset_obj = {
            TreeGroup: tree_group_arr,
            name: name,
            componentTypes: types_array,
            contextType: context_type,
            color: color_int,
            line: line,
            source_path: source_path
        }
        this.name_to_dataset_object_map[dataset_obj.name] = dataset_obj
        return dataset_obj
    }

    static tree_folder_name_to_dom_id(folder_name){
        return "dataset_tree_" + folder_name + "_id"
    }

    //______pallette making. Similar to obj_def insert_obj_def_into_pallette
    static make_object_id(dataset_def){
        return "make_dataset_" + dataset_def.name + "_id"
    }

    static pending_rendering_dom_id = null //or string id of a folder pallette dom elt

    //creates tree path all the way down, then inserts the new link to make an obj_call of the obj_def
    static insert_dataset_into_pallette(dataset_obj, folder_dom_elt=HCA_palette_datasets_id, tree_path_arr){
        if(this.pending_rendering_dom_id && !window[this.pending_rendering_dom_id]) { //take a lap waiting for
            setTimeout(function(){
                Dataset.insert_dataset_into_pallette(dataset_obj, folder_dom_elt, tree_path_arr)
            }, 200)
            return
        }
        else if(typeof(folder_dom_elt) === "string") {
            folder_dom_elt = window[folder_dom_elt]
        }
        if(!folder_dom_elt) { //take a lap to let folder_dom_elt get rendered
            setTimeout(function(){
                this.insert_dataset_into_pallette(dataset_obj, folder_dom_elt, tree_path_arr)
            }, 200)
            return
        }
        //if we get this far, the id in Dataset.pending_rendering_dom_id is null, or its str value id has already been rendered
        //so there are no renderings to be completed, and
        //folder_dom_elt is a rendered dom_elt to stick the next item in the pallette, be it a
        //subfolder or and actual obj_def link
        this.pending_rendering_dom_id = null
        if(!tree_path_arr) { tree_path_arr = dataset_obj.TreeGroup }
        if(tree_path_arr.length === 0) { //done walking tree, so insert the actual link and we're done
            let dom_id = this.make_object_id(dataset_obj)
            let tree_path = dataset_obj.TreeGroup.join("/")
            let tree_path_and_obj_name = tree_path + "/" + dataset_obj.name
            let html_to_insert = `<div class="hca_obj_def"  id="` + dom_id + `" onclick="Dataset.show_dataset_dialog('` + tree_path_and_obj_name + `', event)">` + dataset_obj.name + "</div>"
            folder_dom_elt.insertAdjacentHTML("beforeend", html_to_insert) //no need to wait for leaves of tree to render
        }
        else { //more tree walking to do
            let next_folder_name = tree_path_arr[0]
            let next_folder_name_dom_elt_id = this.tree_folder_name_to_dom_id(next_folder_name)
            let next_folder_dom_elt = window[next_folder_name_dom_elt_id]
            let new_tree_path = Utils.subarray(tree_path_arr, 1) //((tree_path_arr.length === 1) ? [] : tree_path_arr.slice[1]) //JS slice doesn't work so I wrote my own.
            //above var is closed over by setTimeout below as well as directly used
            if(next_folder_dom_elt) {
                setTimeout(function () { //needed just because call stack size exceeded without it
                    Dataset.insert_dataset_into_pallette(dataset_obj, next_folder_dom_elt, new_tree_path) //whether or not the folder is rendered, we can still recurse and it will get caught at top of this fn.
                }, 1)
            }
            else { //no next_folder_dom_elt so we need to create it
                let html = "<details class='hca_folder' " + "id='" + next_folder_name_dom_elt_id + "'><summary class='hca_folder_summary'>" + next_folder_name + "</summary>\n</details>"
                folder_dom_elt.insertAdjacentHTML("beforeend", html)
                this.pending_rendering_dom_id = next_folder_name_dom_elt_id
                this.insert_dataset_into_pallette(dataset_obj,
                    next_folder_name_dom_elt_id, //we pass the id str because next_folder_dom_elt is undedfined as it doesnt exist yet
                    new_tree_path)
            }
        }
    }

    static show_dataset_dialog(tree_path_and_obj_name, event){
        let ds_obj = Dataset.tree_path_to_dataset_obj(Dataset.dataset_def_tree, tree_path_and_obj_name)
        let dataset_name = ds_obj.name
        inspect(ds_obj)
        show_window({
                     title: "Choose Dataset Operation",
                     x:200, y:100, width:300, height:200,
                     content: `for: ` + ds_obj.name + `<br/>
                               <input type="hidden" name="dataset_name" value="` + dataset_name + `"/>` +
                              `<input type="button" value="Edit Definition"   style="margin:5px;"/><br/>
                               <input type="button" value="Make Collector Block"  style="margin:5px;"/><br/>
                               <input type="button" value="Make Exposer Block" style="margin:5px;"/>`,
                     callback: "Dataset.show_dataset_dialog_cb"
                     })
    }

    static show_dataset_dialog_cb(vals){
        let dataset_name = vals.dataset_name
        if(vals.clicked_button_value === "Make Collector Block"){
            Dataset.make_collector_block(dataset_name)
        }
        else if(vals.clicked_button_value === "Make Exposer Block"){
            Dataset.make_exposer_block(dataset_name)
        }

    }

    //similer to HCA.make_and_add_block
    static make_collector_block(dataset_name){
            let collector_name = dataset_name + "Out"
            let node = LiteGraph.createNode("basic/" + collector_name, collector_name)
            HCA.lgraph.add(node);
            HCA.node_add_usual_actions(node)
            return node
    }

    static make_exposer_block(dataset_name){
        let collector_name = dataset_name + "In"
        let node = LiteGraph.createNode("basic/" + collector_name, collector_name)
        HCA.lgraph.add(node);
        HCA.node_add_usual_actions(node)
        return node
    }

    static datasets_in_files(files_array) {
        let result = []
        for(let ds_name of Object.keys(this.name_to_dataset_object_map)) {
            let ds_obj = this.name_to_dataset_object_map[ds_name]
            if(ds_obj) {
                if(files_array.includes(ds_obj.source_path)){
                    result.push(ds_obj)
                }
            }
        }
        return result
    }

    static define_built_ins() {
        let json_dataset_defs = [
            {
                TreeGroup: ["BuiltIn"],
                name: "Bit",
                componentTypes: ["Bit"], //primitiaves have no components
                contextType: 0, //what's this? I just made one up. They are small non-neg integers
                color: 12632256, //I just pulled this from an example. Should be adjusted once I figure out color
                line: "DataSet Bit = ( Bit )",
                source_path: "built_in"
            },
            {
                TreeGroup: ["BuiltIn"],
                name: "NULL",
                componentTypes: ["NULL"], //primitiaves have no components
                contextType: 0, //what's this? I just made one up. They are small non-neg integers
                color: 12632256, //I just pulled this from an example. Should be adjusted once I figure out color
                line: "DataSet NULL = ( NULL )",
                source_path: "built_in"
            },
            {
                TreeGroup: ["BuiltIn"],
                name: "Variant",
                componentTypes: ["Variant", "Variant"], //primitiaves have no components
                contextType: 0, //what's this? I just made one up. They are small non-neg integers
                color: 12632256, //I just pulled this from an example. Should be adjusted once I figure out color
                line: "DataSet Variant = ( Variant, Variant )",
                source_path: "built_in"
            },
            {
                TreeGroup: ["BuiltIn"],
                name: "List",
                componentTypes: ["Variant", "Variant"], //primitiaves have no components
                contextType: 0, //what's this? I just made one up. They are small non-neg integers
                color: 12632256, //I just pulled this from an example. Should be adjusted once I figure out color
                line: "DataSet List = ( Variant, Variant ))",
                source_path: "built_in"
            }
        ]
        Dataset.insert_dataset_defs_into_tree("built_in", json_dataset_defs)
    }

    make_collector(){
        let new_tree_group_arr = this.TreeGroup.slice() /// make copy
        new_tree_group_arr.unshift("Collector")
        let ins
        if((this.name === "Bit") || (this.name === "NULL")) {
            ins = []
        }
        else {
            ins = []
            for(let i = 0; i <  this.componentTypes.length; i++){
                let a_componentType = this.componentTypes[i]
                ins.push(
                    {type: a_componentType, //a string
                     name: a_componentType + "In" + i
                    }
                )
            }
        }
        let outs = [{type: this.name, name: this.name + "Out0"}]
        let json_obj = {
            objectName: this.name + "Out",
            objectType: this.name + "Out",
            TreeGroup:  new_tree_group_arr,
            inputs:     ins,
            outputs:    outs,
            netList:    [],
            prototypes: [],
            source_path: "auto_generated" //we never get this obj def from a file or save it to a file
        }
        json_obj.line = JSON.stringify(json_obj) //must be out of line or get recursive bug
        new HCAObjDef(json_obj)
    }

    make_exposer(){
        let new_tree_group_arr = this.TreeGroup.slice() /// make copy
        new_tree_group_arr.unshift("Exposer")
        let ins = [{type: this.name,
                    name: this.name + "In0"}
                  ]
        let outs = []
        for(let i = 0; i <  this.componentTypes.length; i++){
            let a_componentType = this.componentTypes[i]
            outs.push(
                    {type: a_componentType, //a string
                     name: a_componentType + "Out" + i
                }
            )
        }
        let json_obj = {
            objectName: this.name + "In",
            objectType: this.name + "In",
            TreeGroup:  new_tree_group_arr,
            inputs:     ins,
            outputs:    outs,
            netList:    [],
            prototypes: [],
            source_path: "auto_generated" //we never get this obj def from a file or save it to a file
        }
        json_obj.line = JSON.stringify(json_obj) //must be out of line or get recursive bug
        new HCAObjDef(json_obj)
    }
}

Dataset.init()