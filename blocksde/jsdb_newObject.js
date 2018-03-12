/*an instance of one of these classes like jsdb_method
 reresents a fn, etc. ie Math.abs
   but NOT a particular call to the fn.
   That is represented by a dom elt that' a child of Workspace.inst elt.
   That dom elt is built with info from the corresponding jsdb objet
   thatrepresents the block_type.
*/

newObject({
    name: "jsdb",
    methodname:"upper_type",
    constructor: function(){
        if (typeof(this.category) == "string") {
            let cat_maybe = Root.BlockCategory.name_to_category(this.category)
            if (cat_maybe) { this.category = cat_maybe }
            else { dde_error("jsdb constructor unable to find category: " + this.category)}
        }
        if(this.category) { //no category for non-leaf jsdb objs.
            this.category.add_block_type(this)
        }
    },
    block_counter: 0, //used as suffix to dom elt block id's.

    get_next_block_counter: function() {
        Root.jsdb.block_counter = Root.jsdb.block_counter + 1
        return Root.jsdb.block_counter
    },
    get_next_block_id: function() {
        Root.jsdb.block_counter = Root.jsdb.block_counter + 1
        return "block_" + Root.jsdb.block_counter + "_id"
    },

    find_block_type: function(block_type_name){
        let block_type_name_for_name = replace_substrings(block_type_name, "\\.", "__")
        if      ((block_type_name == this.display_label) ||
                 (block_type_name_for_name == this.name)) { return this }
        else {
            for(let jsdb_sub of this.subObjects()){
                let result = jsdb_sub.find_block_type(block_type_name)
                if(result) { return result }
            }
            return null
        }
    },
    make_block_type: function(block_type_name="", value){
        if (value == undefined) {
            value = window[block_type_name]
            if (!value) {  //block_type_name might be somethig like "Math.abs"
                try {
                    value = eval(block_type_name)
                }
                catch(err) { return null }
            }
            if (value === undefined) { return null }
            else if(typeof(value) == "function"){
                    return Root.jsdb.method.make_block_type(block_type_name, value)
            }
            else {  console.log("shouldnt in make_block_type") }
        }
    },
    //called from onclick blocks menu in category
    make_and_draw_block: function(x=null, y=25, arg_vals){
        if (x == null) {
            x = Workspace.suck_left_margin + 100
        }
        block_type_menu_id.style.display = "none"
        category_menu_id.style.display   = "none"
        let elt = this.make_dom_elt(x, y, arg_vals)
        Workspace.inst.add_block_elt(elt)
        let in_elt = elt.querySelector("INPUT[type=text]")
        if (!in_elt) { in_elt = elt.querySelector("INPUT[type=number]") }
        if (in_elt) { in_elt.select(); in_elt.focus() }
    },
    make_data_block_type_string(){
        let full_path = this.objectPath()
        return full_path.substring("Root.jsdb.".length)
    },
    // create a block_elt from a js value, typically a default value for a fn param but could be any
    value_to_block(value, src) {
        let type = typeof(value)
        if((value === null) || (value === undefined)){
            return Root.jsdb.one_of.null_undefined.make_dom_elt(undefined, undefined, value)
        }
        else if(type == "boolean") {
            return Root.jsdb.literal.boolean.make_dom_elt(undefined, undefined, value)
        }
        else if (type == "number"){
            return Root.jsdb.literal.number.make_dom_elt(undefined, undefined, value)
        }
        else if (type == "string"){
            return Root.jsdb.literal.string.make_dom_elt(undefined, undefined, value)
        }
        else if (Array.isArray(value)){
            return Root.jsdb.literal.array.make_dom_elt(undefined, undefined, value)
        }
        else if (is_literal_object(value)) { //questionable
            return Root.jsdb.literal.object.make_dom_elt(undefined, undefined, value)
        }
        else if(value.classList && value.classList.includes("block")) {
            return value
        }
        else if(typeof(src) == "string"){
            return Root.jsdb.js.make_dom_elt(undefined, undefined, src)
        }
        else {
            src = to_source_code(value)
            return Root.jsdb.js.make_dom_elt(undefined, undefined, src)
        }
    },
    method_to_arg_name_val_elts(meth){
        let params_obj = function_param_names_and_defaults(meth)
        let make_editable_arg_names = false
        if (Array.isArray(params_obj) &&  //this clause should be cleaner!
            (params_obj.length == 2)  &&
            Array.isArray(params_obj[0]) &&
            (params_obj[1] == "{}")) {
            params_obj = params_obj[0]
            make_editable_arg_names = true
        }
        let params_obj_is_array = Array.isArray(params_obj)
        let arg_name_val_elts = []
        if(params_obj_is_array){
            for(let i = 0; i < params_obj.length; i++){
                let param_name_val_array = params_obj[i]
                let param_name           = param_name_val_array[0]
                let param_default_src    = param_name_val_array[1]
                let param_default_value  = ((param_default_src == "{}") ? {} : eval(param_default_src)) //bug in js eval
                let arg_val_elt          = Root.jsdb.value_to_block(param_default_value, param_default_src)
                let add_comma_suffix     = i < (params_obj.length - 1)
                let arg_name_val_elt     = make_arg_name_val(param_name, arg_val_elt, add_comma_suffix, make_editable_arg_names) //4th arg is make arg_name editable
                arg_name_val_elts.push(arg_name_val_elt)
            }
        }
        //maybe this clause is never called
        else { //assume params_obj is  a lit obj with name-val pairs
            let keys = Object.keys(params_obj) //warning: if params_obj_is_array == true, keys loks like: ["0", "1"...]
            for(let param_name of keys){
                let param_default_src = params_obj[param_name]
                let param_default_value = ((param_default_src == "{}") ? {} : eval(param_default_src)) //bug in js eval
                let arg_val_elt = Root.jsdb.value_to_block(param_default_value, param_default_src)
                let add_comma_suffix = i < (keys.length - 1)
                let arg_name_val_elt = make_arg_name_val(param_name, arg_val_elt, add_comma_suffix, true) //4th arg is make arg_name editable
                arg_name_val_elts.push(arg_name_val_elt)
            }
        }
        return arg_name_val_elts
    }
})


newObject({prototype: Root.jsdb,
    name: "literal",
    display_label: "", //can be "foo" for a global fn, or "Math.abs" for a static method
                       //or "(foo).bar" for an instance method on the class foo.
    return_type:"any" ,
})

newObject({prototype: Root.jsdb.literal,
    name: "boolean",
    category: Root.BlockCategory.Logic,
    display_label: 'true/false', //not displayed in block but displayed in menu
    return_type: "boolean",
    value: false,
    make_dom_elt: function(x, y, arg_val){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
            "background-color": this.category.color,
            id: Root.jsdb.get_next_block_id(),
            left: x + "px",
            top:  y + "px",
            draggable: "true",
            "data-block-type": "literal." + this.name,
            onclick: "select_block(event)"
            },
            always_rel
        )
        //no block name by design: a num should be obviu. Don't take up the space of #, nor the newline usually after the block name
        let block_args_elt = make_dom_elt("div", {class:"block_args", "margin-top": "0px", "padding-top": "0px"})
        always_rel.appendChild(block_args_elt)
        let val = (((arg_val === true) || (arg_val === false)) ? arg_val : this.value)
        let arg_val_elt = make_dom_elt("input",
            {class:"arg_val",
                type: "checkbox",
                "margin-left": "0px",
                //checked: val,
                margin: "4px",
                padding: "0px",
                ondragenter:"enter_drop_target(event)",
                ondragleave:"leave_drop_target(event)"})
        if (val) { arg_val_elt.checked = "checked" }
        let arg_name_val_elt = make_arg_name_val(null, arg_val_elt)
        arg_name_val_elt.style["margin-left"] = "0px"
        block_args_elt.appendChild(arg_name_val_elt)
        return result
    },
    to_js: function(block_elt){ //the same as number.to_js
        //let always_rel   = dom_elt_child_of_class(block_elt, "block_always_relative")
        //let block_args   = dom_elt_child_of_class(always_rel, "block_args")
        //let arg_val      = dom_elt_child_of_class(block_args, "arg_val")
        let arg_val = dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val            = arg_val.checked
        return val.toString()
    }
})

newObject({prototype: Root.jsdb.literal,
           name: "number",
           category: Root.BlockCategory.Math,
           display_label: 'number', //not displayed in block but displayed in menu
           return_type: "number",
           value: 0,
           min:  -Infinity,
           max: Infinity,
           step: 1,
           make_dom_elt: function(x, y, arg_val){
               let always_rel = make_dom_elt("div", {class: "block_always_relative"})
               let result = make_dom_elt("div",
                      {class:"block block-absolute",
                       "margin-top": "0px",
                       //"background-color": this.category.color,
                       id: Root.jsdb.get_next_block_id(),
                       left: x + "px",
                       top:  y + "px",
                       draggable: "true",
                       "data-block-type": "literal." + this.name,
                       onclick: "select_block(event)"
                   },
                   always_rel
               )
               //no block name by design: a num should be obviu. Don't take up the space of #, nor the newline usually after the block name
               let block_args_elt = make_dom_elt("div", {class:"block_args", "margin-top": "0px", "padding-top": "0px"})
               always_rel.appendChild(block_args_elt)
               let val = ((typeof(arg_val) == "number") ? arg_val : this.value)
               let arg_val_elt = make_dom_elt("input",
                                               {class:"arg_val",
                                               type: "number",
                                               min: this.min,
                                               max: this.max,
                                               step: this.step,
                                               value: val,
                                               style: "width:" + Root.jsdb.literal.number.compute_width(val) + "; height:12px;",
                                               "font-size": "14px",
                                               margin: "0px",
                                               padding: "0px",
                                               oninput: "Root.jsdb.literal.number.oninput(event)",
                                               ondragenter:"enter_drop_target(event)",
                                               ondragleave:"leave_drop_target(event)"})
               let arg_name_val_elt = make_arg_name_val(null, arg_val_elt)
               arg_name_val_elt.style["margin-left"] = "0px"
               block_args_elt.appendChild(arg_name_val_elt)
               return result
               },
               oninput(event){
                   let elt = event.target
                   elt.style.width = Root.jsdb.literal.number.compute_width(event.target.value)
               },
               compute_width(val) {
                 if (typeof(val) == "number") { val = (val).toString() }
                 return ((val.length + 2) * 9) + "px" //just slightly bigger than necesary but making either constant 1 smaller makes it too small
               },
               to_js: function(block_elt){
                    //let always_rel   = dom_elt_child_of_class(block_elt, "block_always_relative")
                    //let block_args   = dom_elt_child_of_class(always_rel, "block_args")
                    //let arg_val      = dom_elt_child_of_class(block_args, "arg_val")
                    //let val          = arg_val.value
                    let arg_val = dom_elt_descendant_of_classes(block_elt,
                       ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
                    let val          = arg_val.value
                    return val //its already a string
                }
})

newObject({prototype: Root.jsdb.literal,
    name: "string",
    category: Root.BlockCategory.String,
    display_label: '"string"', //not displayed in block but displayed in menu
    return_type: "string",
    value: "",
    make_dom_elt: function(x=0, y=0, arg_val){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "margin-top": "0px",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": "literal." + this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        //no block name by design: a string should be obvious. Don't take up the space of #, nor the newline usually after the block name
        always_rel.appendChild(make_dom_elt("span",
                                            {class:"block_name", display:"inline-block", visibility: "hidden", width:"0px", margin: "0px", padding: "0px"}, //not shown BUT useful internally to mark this element
                                            'string'))
        always_rel.appendChild(this.make_quote_button("open"))
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block",
                                          //"margin-top": "0px", "padding-top": "0px"
                                          "margin": "0px", "padding": "0px"
                                          })
        always_rel.appendChild(block_args_elt)
        let val = ((typeof(arg_val) == "string") ? arg_val : this.value)
        let width = Root.jsdb.literal.string.compute_width(val, 15, 3)
        let arg_val_elt = make_dom_elt("input",
            {class:"arg_val",
                type: "text",
                "margin-left": "0px",
                value: val,
                style: "width:" + width + "px;",
                margin: "0px",
                padding: "0px",
                "font-size": "14px",
                oninput: "Root.jsdb.literal.string.oninput(event)",
                ondragenter:"enter_drop_target(event)",
                ondragleave:"leave_drop_target(event)"})
        let arg_name_val_elt = make_arg_name_val(null, arg_val_elt)
        arg_name_val_elt.style["margin-left"] = "0px"
        block_args_elt.appendChild(arg_name_val_elt)
        always_rel.appendChild(this.make_quote_button("close"))
        return result
    },
    oninput(event){
        let elt = event.target
        let width = Root.jsdb.literal.string.compute_width(elt.value, elt.style["font-size"], 3)
        elt.style.width = width + "px"
    },
    compute_width(val, font_size, extra_width=0) {
        //f (typeof(val) != "string") { val = (val).toString() }
        //return ((val.length + 2) * 7) + "px" //just slightly bigger than necesary but making either constant 1 smaller makes it too small
        return compute_string_size(val, font_size, extra_width)[0]
    },
    quote_button_action(event){
        let input_elt = event.target //type="button"
        let block_args_elt = input_elt.parentNode
        let delimiters = block_args_elt.querySelectorAll(".block_args_delimiter") //gets both open and close
        let now_quote = input_elt.value
        for(elt of delimiters){
            if      (now_quote == '"') { elt.value = "'" }
            else if (now_quote == "'") { elt.value = "`" }
            else if (now_quote == "`") { elt.value = '"' }
            else { shouldnt("in quote_button_action with invalid quote of: " + now_quote) }
        }
    },
    make_quote_button(open_or_close="open"){
        let result = make_dom_elt("input", {type:    "button",
                                      class:   "block_args_delimiter " + open_or_close,
                                      //height:  "20px",
                                      //value:   '"',
                                      style: "width:12px;height:20px;",
                                      margin:  "0px",
                                      padding: "0px",
                                      onclick: "Root.jsdb.literal.string.quote_button_action(event)"})
        result.value = '"' //can't get this right using make_dom_elt
        return result
    },
    to_js: function(block_elt){
        let always_rel   = dom_elt_child_of_class(block_elt, "block_always_relative")
        //let block_args   = dom_elt_child_of_class(always_rel, "block_args")
        //let arg_val      = dom_elt_child_of_class(block_args, "arg_val")
        //let val          = arg_val.value
        let arg_val = dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val          = arg_val.value
        let block_args_delimiter = dom_elt_child_of_class(always_rel, "block_args_delimiter")
        let delim = block_args_delimiter.value
        return delim + val + delim
    }
})

newObject({prototype: Root.jsdb.literal,
    name: "array",
    category: Root.BlockCategory.Array,
    display_label: '[array]',
    //value: [], //don't us this, use params for each elt of the array.
    return_type:"array",
    params: [], //don't make this undefined as we don't need to look at  the "method" of "array"to know what its default args arg
    //category:"misc",
    constructor: function(){ this.callPrototypeConstructor() },
    //similar to method.make_dom_elt
    make_dom_elt: function(x, y, arg_vals){ //arg_vals can be an array of the elts of the array, or not passed
        let always_rel = make_dom_elt("div",
                                      {class:          "block_always_relative",
                                      "min-width":     "28px", //otherwise the resizer box appears on top of the []
                                      "margin-bottom": "3px"}) //otherwise, the bottom of the squrae brackets too close to the bottom of the block.
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(), //"literal." + this.name,
                //  ondragstart: "Root.jsdb.dragstart_handler(event)",
                ondragenter:"enter_drop_target(event)",
                ondragleave:"leave_drop_target(event)",
                onclick: "select_block(event)"
                //position: "absolute"
            },
            always_rel
        )
        let block_name_elt = make_dom_elt("div",
            {class:"block_name"},
            "")
        let delim_elt = make_delimiter_drop_zone("[")
        block_name_elt.appendChild(delim_elt)
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-right":"2px"})
        always_rel.appendChild(block_args_elt)
        let val = (Array.isArray(arg_vals) ? arg_vals : this.params)
        let names = Object.keys(val) //if val is an array, returns ["0", "1" ...] which is fine,
        let last_name = last(names)
        for(let param_name of names){
            //if (!on_first_param) { block_args_elt.appendChild(make_comma_drop_zone()) }
            let param_name_elt = make_dom_elt("span", {class: "arg_name"}, param_name)
            let array_elt_or_param_block_type = val[param_name]
            let param_val_elt
            if (Array.isArray(val)){
                param_val_elt = Root.jsdb.value_to_block(array_elt_or_param_block_type)
            }
            else { //array_elt_or_param_block_type should be a block_type
               param_val_elt = array_elt_or_param_block_type.make_dom_elt()
            }
            param_val_elt.classList.remove("block-absolute") //because its not absolute, and should inherit the position:relative of the always_relative wrapper in this block
            param_val_elt.classList.add("arg_val")
            //param_val_elt.style["margin-left"] = "10px"
            let name_val_elt = make_arg_name_val(param_name_elt, param_val_elt, param_name != last_name)
            block_args_elt.append(name_val_elt)
        }
        delim_elt = make_delimiter_drop_zone("]")
        delim_elt.style["margin-left"]  = "3px", //with an empty array, the [] brackets are too close to one another
        block_args_elt.append(delim_elt)
        always_rel.appendChild(make_dom_elt("div", {class:"resizer",
            draggable:"true",
            ondragstart:"resizer_dragstart_handler(event)",
            ondrag:"resizer_drag_handler(event)",
            ondragend:"resizer_dragend_handler(event)",
            ondrop:"resizer_drop_handler(event)",
            onclick:"resizer_onclick(event)"}))
        return result
    },
    to_js: function(block_elt){
        let always_rel   = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args   = dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals = dom_elt_children_of_class(block_args, "arg_name_val")
        let result = "["
        let on_first = true
        for (let arg_name_val of arg_name_vals){
            let arg_val  = dom_elt_child_of_class(arg_name_val, "arg_val")
            let src = block_to_js(arg_val)
            if (!on_first) {
                result += ","
                if (src.length > 16){ result += "\n    "}
                else { result += " "}
            }
            result += src
            on_first = false
        }
        return result + "]"
    }
})

newObject({prototype: Root.jsdb.literal,
    name: "object",
    category: Root.BlockCategory.Object,
    display_label: '{object}',
    //value: [], //don't us this, use params for each elt of the array.
    return_type:"object",
    params: [],
    constructor: function(){ this.callPrototypeConstructor() },
    //similar to method.make_dom_elt
    make_dom_elt: function(x, y, arg_vals){
        let always_rel = make_dom_elt("div",
                                      {class: "block_always_relative",
                                       "min-width":     "32px", //otherwise the resizer box appears on top of the []
                                       "margin-bottom": "3px"}) //otherwise, the bottom of the squrae brackets too close to the bottom of the block.
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": "literal." + this.name,
                //  ondragstart: "Root.jsdb.dragstart_handler(event)",
                onclick: "select_block(event)"
                //position: "absolute"
            },
            always_rel
        )
        let block_name_elt = make_dom_elt("div",
            {class:"block_name"},
            "")
        let delim_elt = make_delimiter_drop_zone("{")
        block_name_elt.appendChild(delim_elt)
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-right":"2px"})
        always_rel.appendChild(block_args_elt)
        let val = ((arg_vals !== undefined) ? arg_vals : this.params)
        let names = Object.keys(val)
        let last_name = last(names)
        for(let param_name of names){
            let param_name_elt = make_dom_elt("span", {class: "arg_name", "margin-right": "0px", "padding-right": "0px"}, param_name)
            let array_elt_or_param_block_type = val[param_name]
            let param_val_elt
            if (arg_vals !== undefined){
                param_val_elt = Root.jsdb.value_to_block(array_elt_or_param_block_type)
            }
            else { //array_elt_or_param_block_type should be a block_type
                param_val_elt = array_elt_or_param_block_type.make_dom_elt()
            }
            param_val_elt.classList.remove("block-absolute") //because its not absolute, and should inherit the position:relative of the always_relative wrapper in this block
            param_val_elt.classList.add("arg_val")
            let name_val_elt = make_arg_name_val(param_name_elt, param_val_elt, param_name != last_name, true, ":")
            block_args_elt.append(name_val_elt)
            param_name_elt.style["margin-right"]  = "0px" //todo doesn't work
            param_name_elt.style["padding-right"] = "0px" //todo doesn't work
        }
        delim_elt = make_delimiter_drop_zone("}")
        delim_elt.style["margin-left"]  = "3px" //with an empty array, the [] brackets are too close to one another
        block_args_elt.append(delim_elt)
        //always_rel.appendChild(make_dom_elt("div", {class:"block_bottom_spacer"}))
        always_rel.appendChild(make_dom_elt("div", {class:"resizer",
            draggable:"true",
            ondragstart:"resizer_dragstart_handler(event)",
            ondrag:"resizer_drag_handler(event)",
            ondragend:"resizer_dragend_handler(event)",
            ondrop:"resizer_drop_handler(event)",
            onclick:"resizer_onclick(event)"}))
        return result
    },
    to_js: function(block_elt){
        let always_rel   = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args   = dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals = dom_elt_children_of_class(block_args, "arg_name_val")
        let result = "{"
        let on_first = true
        for (let arg_name_val of arg_name_vals){
            let arg_name  = dom_elt_child_of_class(arg_name_val, "arg_name") //this will be a lit string block
            let arg_val   = dom_elt_child_of_class(arg_name_val, "arg_val")
            let name_src  = block_to_js(arg_name)
            let val_src   = block_to_js(arg_val)
            if (!on_first) { result += ", "}
            result += name_src + ": " + val_src
            on_first = false
        }
        return result + "}"
    }
})

newObject({prototype: Root.jsdb,
    name: "one_of", //abstract class, not useful by itself
    //display_label: 'true/false', //not displayed in block but displayed in menu
    return_type: "any",
    value: undefined, //used by null_or_undefined
    choices: undefined,
    width:   undefined,
    make_dom_elt: function(x, y, arg_val, choices){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": "one_of." + this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        //no block name by design: a num should be obviu. Don't take up the space of #, nor the newline usually after the block name
        let block_args_elt = make_dom_elt("div", {class:"block_args", "margin-top": "0px", "padding-top": "0px"})
        always_rel.appendChild(block_args_elt)
        let choice_elts = []
        let val = ((arg_val !== undefined) ? arg_val : this.value)
        choices = ((choices !== undefined) ? choices : this.choices)
        for (let choice of choices){
            let choice_val = eval(choice)
            let attrs = {}
            debugger
            if(this.name=="null_undefined") {} //without this check "undefined" will be selected by default,when "null" should be.
            else if(val === choice_val) { attrs.selected = "selected" }
            choice_elts.push(make_dom_elt("option", attrs, choice))
        }
        let arg_val_elt = make_dom_elt("select",
                                       {class:"arg_val",
                                        "margin-left": "0px",
                                        //value: this.value,
                                        margin:  "4px",
                                        padding: "0px",
                                        ondragenter:"enter_drop_target(event)",
                                        ondragleave:"leave_drop_target(event)"},
                                    choice_elts)
        if (this.width) {
            if (typeof(this.width) == "number") { this.width = this.width + "px" }
            arg_val_elt.style.width = this.width
        }
        let arg_name_val_elt = make_arg_name_val(null, arg_val_elt)
        arg_name_val_elt.style["margin-left"] = "0px"
        block_args_elt.appendChild(arg_name_val_elt)
        return result
    },
    to_js: function(block_elt){
        //let always_rel   = dom_elt_child_of_class(block_elt, "block_always_relative")
        //let block_args   = dom_elt_child_of_class(always_rel, "block_args")
        //let arg_val      = dom_elt_child_of_class(block_args, "arg_val")
        //let val          = arg_val.value
        let arg_val = dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val            = arg_val.value
        return val
    }
})

newObject({prototype: Root.jsdb,
    name: "method",
    display_label: "", //can be "foo" for a global fn, or "Math.abs" for a static method
                       //or "(foo).bar" for an instance method on the class foo.
    jsclassname:"", //if "", no class
    methodname:"upper_type", //not the immediate parent of a block to display
    is_static:false, //if jsclassname = "", this is moot.
    return_type:"any",
    params:undefined,
    //category:"misc",
    constructor: function(){
        this.callPrototypeConstructor()
        if(this.methodname != "upper_type"){
            if(this.display_label.length == 0) {
                this.fill_in_display_label()
            }
            else { this.fill_in_class_and_meth() }
            if(this.method == "required") {
                dde_error("newObject jsdb.method can't be created without a methodname.")
            }
            //if (this.params == undefined) {
            //    Root.jsdb.method_to_arg_name_val_elts(this.get_method())
            //}
            //this.category.add_block_type(this)
        }
    },

    get_method: function(){
        let starting = window
        if (this.jsclassname.length > 0) { starting = window[this.jsclassname] }
        let result = starting[this.methodname]
        return result //might return undefined
    },
    //should not end with open paren.
    fill_in_display_label: function(){
        if((this.jsclassname == "") &&
            (this.methodname == "required")){
            dde_error("jsdb.method.fill_in_display_label called with empty jsclassname & methodname")
        }
        if (this.methodname.endsWith("(")) {
            this.methodname = this.methodname.substring(0, this.methodname.length - 1)
            this.display_label = this.methodname
        }
        else {
            if (this.jsclassname.length > 0) {
                if (this.is_static) { this.display_label = this.jsclassname }
                else { this.display_label = "(" + this.jsclassname + ")" }
                this.display_label += "."
            }
            this.display_label += this.methodname
        }
    },

    fill_in_class_and_method: function(){
        if(this.display_label == "") {
            dde_error("jsdb.method.fill_in_class_and_method called with empty display_label.")
        }
        else if(display_label.includes(".")) {
            let class_and_meth_name = display_label.split(".")
            this.jsclassname = class_and_meth_name[0]
            this.methodname = class_and_meth_name[1]
            if (this.jsclassname.startsWith("(")) {
                if (!this.jsclassname.endsWith(")")) {
                    dde_error("Attempt to create a jasb.method with an invalid display_labe syntax of: " +
                        this.display_label)
                }
                this.is_static = false
                this.jsclassname = this.jsclassname.substring(1, this.jsclassname.length - 1)
            }
            else { this.is_static = true }
        }
        else { this.methodname = this.display_label
            if (this.methodname.endsWith("(")) {
                this.methodname.substring(0,  this.methodname - 1)
            }
        }
    },
    //https://stackoverflow.com/questions/8389643/css-making-the-content-div-auto-size-after-the-content-within
    make_dom_elt: function(x, y, arg_vals){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
                                    {class:"block block-absolute",
                                        "background-color": this.category.color,
                                        id: Root.jsdb.get_next_block_id(),
                                        left: x + "px",
                                        top:  y + "px",
                                        draggable: "true",
                                        "data-block-type": "method." + this.name,
                                        //  ondragstart: "Root.jsdb.dragstart_handler(event)",
                                        onclick: "select_block(event)"
                                        //position: "absolute"
                                    },
                                    always_rel
                                )
        let block_name_elt = make_dom_elt("div",
            {class:"block_name"},
            this.display_label)
        let delim_elt = make_delimiter_drop_zone("(")
        block_name_elt.appendChild(delim_elt)
        always_rel.appendChild(block_name_elt)
        //always_rel.appendChild(make_delimiter_drop_zone("("))
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)
        if(this.params) {
            let names = Object.keys(this.params)
            let last_name = last(names)
            for(let param_name of names){
                //if (!on_first_param) { block_args_elt.appendChild(make_comma_drop_zone()) }
                let param_name_elt = make_dom_elt("span", {class: "arg_name"}, param_name)
                //if (param_name_elt) { block_args_elt.appendChild(param_name_elt) }
                let param_block_type = this.params[param_name]
                let param_val_elt = param_block_type.make_dom_elt()
                param_val_elt.classList.remove("block-absolute") //because its not absolute, and should inherit the position:relative of the always_relative wrapper in this block
                param_val_elt.classList.add("arg_val")
                //param_val_elt.style["margin-left"] = "10px"
                let name_val_elt = make_arg_name_val(param_name_elt, param_val_elt, param_name != last_name)
                block_args_elt.append(name_val_elt)
            }
        }
        else {
            let name_val_elts = Root.jsdb.method_to_arg_name_val_elts(this.get_method())
            for(let name_val_elt of name_val_elts){
                block_args_elt.append(name_val_elt)
            }
        }
        delim_elt = make_delimiter_drop_zone(")")
        delim_elt.style["margin-left"]  = "3px" //with an empty array, the [] brackets are too close to one another
        block_args_elt.append(delim_elt)
        always_rel.appendChild(//make_dom_elt("div",{class:"block_bottom_spacer"},
            make_dom_elt("div",
                {class:"resizer",
                    draggable:"true",
                    ondragstart:"resizer_dragstart_handler(event)",
                    ondrag:"resizer_drag_handler(event)",
                    ondragend:"resizer_dragend_handler(event)",
                    ondrop:"resizer_drop_handler(event)",
                    onclick:"resizer_onclick(event)"}
            ))
        return result
    },
    to_js: function(block_elt){
        //ebugger
        let always_rel     = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = dom_elt_child_of_class(always_rel, "block_name")
        let block_args    = dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals = dom_elt_children_of_class(block_args, "arg_name_val")
        let result = block_name_elt.firstChild.data + "("
        let on_first = true
        for (let arg_name_val of arg_name_vals){
            let arg_val  = dom_elt_child_of_class(arg_name_val, "arg_val")
            let src = block_to_js(arg_val)
            if (!on_first) { result += ", "}
            result += src
            on_first = false
        }
        return result + ")"
    }
})

newObject({prototype: Root.jsdb,
    name: "class_instance",
    jsclassname:"",
    display_label: "", //can be "foo" for a global fn, or "Math.abs" for a static method
                       //or "(foo).bar" for an instance method on the class foo.
    //category:"misc",
    constructor: function(){
        this.callPrototypeConstructor()
        if(this.name != "class_instance"){
            if(this.display_label.length == 0) {
                this.display_label = "new " + this.name
            }
            this.methodname = this.name
            //if (this.params == undefined) {
            //    Root.jsdb.auto_make_params(this.get_method())
            //}
            //this.category.add_block_type(this)
        }
    },

    get_method: function(){
        let starting = window
        if (this.jsclassname.length > 0) { starting = window[this.jsclassname] }
        let result = starting[this.methodname]
        return result //might return undefined
    },

    //https://stackoverflow.com/questions/8389643/css-making-the-content-div-auto-size-after-the-content-within
    make_dom_elt: function(x, y, arg_vals){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let data_bt_val = this.jsclassname
        if(data_bt_val != "")  { data_bt_val += "." }
        data_bt_val += "class_instance." + this.name
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": data_bt_val,
                //  ondragstart: "Root.jsdb.dragstart_handler(event)",
                onclick: "select_block(event)"
                //position: "absolute"
            },
            always_rel
        )
        let block_name_elt = make_dom_elt("div",
            {class:"block_name"},
            this.display_label)
        let delim_elt = make_delimiter_drop_zone("(")
        block_name_elt.appendChild(delim_elt)
        always_rel.appendChild(block_name_elt)
        //always_rel.appendChild(make_delimiter_drop_zone("("))
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)
        /*let names = Object.keys(this.params)
        let last_name = last(names)
        for(let param_name of names){
            //if (!on_first_param) { block_args_elt.appendChild(make_comma_drop_zone()) }
            let param_name_elt = make_dom_elt("span", {class: "arg_name"}, param_name)
            //if (param_name_elt) { block_args_elt.appendChild(param_name_elt) }
            let param_block_type = this.params[param_name]
            let param_val_elt = param_block_type.make_dom_elt()
            param_val_elt.classList.remove("block-absolute") //because its not absolute, and should inherit the position:relative of the always_relative wrapper in this block
            param_val_elt.classList.add("arg_val")
            //param_val_elt.style["margin-left"] = "10px"
            let name_val_elt = make_arg_name_val(param_name_elt, param_val_elt, param_name != last_name)
            block_args_elt.append(name_val_elt)
        }*/
        let meth = this.get_method()
        let arg_name_val_elts = Root.jsdb.method_to_arg_name_val_elts(meth)
        for (let arg_name_val_elt of arg_name_val_elts){
            block_args_elt.appendChild(arg_name_val_elt)
        }
        delim_elt = make_delimiter_drop_zone(")")
        delim_elt.style["margin-left"]  = "3px" //with an empty array, the [] brackets are too close to one another
        block_args_elt.appendChild(delim_elt)
        always_rel.appendChild(//make_dom_elt("div",{class:"block_bottom_spacer"},
            make_dom_elt("div",
                {class:"resizer",
                    draggable:"true",
                    ondragstart:"resizer_dragstart_handler(event)",
                    ondrag:"resizer_drag_handler(event)",
                    ondragend:"resizer_dragend_handler(event)",
                    ondrop:"resizer_drop_handler(event)",
                    onclick:"resizer_onclick(event)"}
            ))
        return result
    },
    to_js: function(block_elt){
        let always_rel     = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = dom_elt_child_of_class(always_rel, "block_name")
        let block_args     = dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals  = dom_elt_children_of_class(block_args, "arg_name_val")
        let result = block_name_elt.firstChild.data + "({"
        let indent = " ".repeat(result.length)
        for (let i = 0; i < arg_name_vals.length; i++){
            let arg_name_val_elt = arg_name_vals[i]
            let arg_name_elt     = dom_elt_descendant_of_classes(arg_name_val_elt,
                                     ["arg_name","block_always_relative", "block_args","arg_name_val", "arg_val"])
            let arg_name_string = arg_name_elt.value
            let arg_val_elt      = dom_elt_child_of_class(arg_name_val_elt, "arg_val")
            let src = ((i == 0) ? "" : indent) + arg_name_string + ": " + block_to_js(arg_val_elt)
            result += src
            if (i < (arg_name_vals.length - 1)) { result += ","} //we're not on the last one, which doesn't get a comma
            result += "\n"
        }
        return result + "})"
    }
})


newObject({prototype: Root.jsdb,
    name: "js",
    category: Root.BlockCategory.Misc,
    display_label: "js source",
    return_type: "any",
    value: "",
    make_dom_elt: function(x=0, y=0, arg_val){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "margin-top": "0px",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": "literal." + this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        always_rel.appendChild(make_dom_elt("span",
                                            {class:"block_name", display:"inline-block", padding: "0px", margin: "0px"},
                                            "js"))
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-top": "0px", "padding-top": "0px"})
        always_rel.appendChild(block_args_elt)
        let val = ((typeof(arg_val) == "string") ? arg_val : this.value)
        let width = Root.jsdb.literal.string.compute_width(val, 15, 3)
        let val_elt = make_dom_elt("input",
               {class:"arg_val",
                type: "text",
                "margin-left": "0px",
                value: (arg_val? arg_val : this.value),
                style: "width:" + width + "px;",
                margin: "0px",
                padding: "0px",
                "font-size": "14px",
                oninput: "Root.jsdb.literal.string.oninput(event)",
                ondragenter:"enter_drop_target(event)",
                ondragleave:"leave_drop_target(event)"})
        let arg_name_val_elt = make_arg_name_val("", val_elt)
        block_args_elt.appendChild(arg_name_val_elt)
        return result
    },
    oninput(event){
        let elt = event.target
        let width = Root.jsdb.literal.string.compute_width(elt.value, elt.style["font-size"], 10)
        elt.style.width = width + "px"
    },
    compute_width(val, font_size, extra_width=0) {
        //f (typeof(val) != "string") { val = (val).toString() }
        //return ((val.length + 2) * 7) + "px" //just slightly bigger than necesary but making either constant 1 smaller makes it too small
        return compute_string_size(val, font_size, extra_width)[0]
    },
    to_js: function(block_elt){
        let arg_val = dom_elt_descendant_of_classes(block_elt,
                         ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val          = arg_val.value
        return val
    }
})

//like JS but doesn't display "js" as  a block name, No displayed block name.
newObject({prototype: Root.jsdb,
    name: "identifier",
    category: Root.BlockCategory.Misc,
    display_label: "identifier",
    return_type: "any",
    value: "",
    make_dom_elt: function(x=0, y=0, arg_val){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "margin-top": "0px",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        always_rel.appendChild(make_dom_elt("span",
                                           {class:"block_name", display:"inline-block"},
                                           ""))
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-top": "0px", "padding-top": "0px"})
        always_rel.appendChild(block_args_elt)
        let val = ((typeof(arg_val) == "string") ? arg_val : this.value)
        let width = Root.jsdb.literal.string.compute_width(val, 15, 3)
        let val_elt = make_dom_elt("input",
            {class:"arg_val",
                type: "text",
                "margin-left": "0px",
                value: (arg_val? arg_val : this.value),
                style: "width:" + width + "px;",
                margin: "0px",
                padding: "0px",
                "font-size": "14px",
                oninput: "Root.jsdb.literal.string.oninput(event)",
                ondragenter:"enter_drop_target(event)",
                ondragleave:"leave_drop_target(event)"})
        let arg_name_val_elt = make_arg_name_val("", val_elt)
        block_args_elt.appendChild(arg_name_val_elt)
        return result
    },
    oninput(event){
        let elt = event.target
        let width = Root.jsdb.literal.string.compute_width(elt.value, elt.style["font-size"], 10)
        elt.style.width = width + "px"
    },
    compute_width(val, font_size, extra_width=0) {
        //f (typeof(val) != "string") { val = (val).toString() }
        //return ((val.length + 2) * 7) + "px" //just slightly bigger than necesary but making either constant 1 smaller makes it too small
        return compute_string_size(val, font_size, extra_width)[0]
    },
    to_js: function(block_elt){
        let arg_val = dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val          = arg_val.value
        return val
    }
})

newObject({prototype: Root.jsdb.identifier,
    name: "combo_box",
    category: Root.BlockCategory.Misc,
    display_label: "identifiers",
    return_type: "any",
    choices: ["this", "window"],
    value: "",
    make_dom_elt: function(x=0, y=0, arg_val){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "margin-top": "0px",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": "identifier." + this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        always_rel.appendChild(make_dom_elt("span",
            {class:"block_name", display:"inline-block"},
            ""))
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-top": "0px", "padding-top": "0px"})
        always_rel.appendChild(block_args_elt)
        //let val = ((typeof(arg_val) == "string") ? arg_val : this.value)
        let longest_choice = ""
        debugger
        for(let cho of this.choices){
            if(cho.length > longest_choice.length) { longest_choice = cho }
        }
        let width = Root.jsdb.literal.string.compute_width(longest_choice, 15, 3)
        //let options = []
        //for(let opt of this.choices){
        //    let opt_elt = make_dom_elt("option", {}, opt)
        //    options.push(opt_elt)
        //}
        let val_elt = make_dom_elt("div",
                                    {class:"arg_val",
                                    type: "text",
                                    "margin-left": "0px",
                                    value: (arg_val? arg_val : this.value),
                                    //style: "width:" + width + "px;", //does nothing. jqxcombobox overrules
                                    margin: "0px",
                                    padding: "0px",
                                    "font-size": "14px",
                                    oninput: "Root.jsdb.literal.string.oninput(event)",
                                    ondragenter:"enter_drop_target(event)",
                                    ondragleave:"leave_drop_target(event)"})
        $(val_elt).jqxComboBox({height: '16px', source: this.choices, selectedIndex: 0, width: width + 25 + "px"})
        let arg_name_val_elt = make_arg_name_val("", val_elt)
        block_args_elt.appendChild(arg_name_val_elt)
        return result
    },
    oninput(event){
        let elt = event.target
        let width = Root.jsdb.literal.string.compute_width(elt.value, elt.style["font-size"], 10)
        elt.style.width = width + "px"
    },
    compute_width(val, font_size, extra_width=0) {
        //f (typeof(val) != "string") { val = (val).toString() }
        //return ((val.length + 2) * 7) + "px" //just slightly bigger than necesary but making either constant 1 smaller makes it too small
        return compute_string_size(val, font_size, extra_width)[0]
    },
    to_js: function(block_elt){
        debugger
        let arg_val = dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val     = $(arg_val).val()
        return val
    }
})


newObject({prototype: Root.jsdb,
            name: "infix",
            display_label: "", //can be "foo" for a global fn, or "Math.abs" for a static method
                               //or "(foo).bar" for an instance method on the class foo.
            return_type: "any",
            param_values: undefined,
            operator_choices: [],
            operators_width: undefined,
            constructor: function(){
                this.callPrototypeConstructor()
            },
        make_dom_elt: function(x, y, arg_vals){
            debugger
            let always_rel = make_dom_elt("div", {class: "block_always_relative"})
            let result = make_dom_elt("div",
                {class:"block block-absolute",
                    "background-color": this.category.color,
                    id: Root.jsdb.get_next_block_id(),
                    left: x + "px",
                    top:  y + "px",
                    draggable: "true",
                    "data-block-type": "infix." + this.name,
                    //  ondragstart: "Root.jsdb.dragstart_handler(event)",
                    onclick: "select_block(event)"
                    //position: "absolute"
                },
                always_rel
            )
            let block_name_elt = make_dom_elt("div",
                {class:"block_name", padding: "0px", margin: "0px"},
                "" //this.display_label
                )
            let delim_elt = make_delimiter_drop_zone("(")
            block_name_elt.appendChild(delim_elt)
            always_rel.appendChild(block_name_elt)
            //always_rel.appendChild(make_delimiter_drop_zone("("))
            let block_args_elt = make_dom_elt("div", {class:"block_args"})
            always_rel.appendChild(block_args_elt)
            let vals = (arg_vals ? arg_vals : this.param_vals)
            let on_first = true
            for(let val of vals){
                if (!on_first) {
                    let options = []
                    let props = {class: "operator"}
                    //let selected_value = to_source_code(val)  //val is NOT the op, different spaces.
                    for (let op of this.operator_choices) {
                        //if (op == selected_value) { props.selected = "selected" }
                        let op_elt = make_dom_elt("option", props, op)
                        options.push(op_elt)
                    }
                    let select = make_dom_elt("select", {class: "operators"}, options)
                    if(this.operators_width) {
                        select.style.width = this.operators_width + "px" //todo compute this based on subtracting suffixes of " (comment)". Maybe not: I want to show "unde" of "undefined" for instance.
                    }
                    block_args_elt.appendChild(select)
                }
                let param_name_elt = make_dom_elt("span", {class: "arg_name", margin: "0px", padding: "0px"}, "")
                let param_val_elt = this.value_to_block(val)
                param_val_elt.classList.remove("block-absolute") //because its not absolute, and should inherit the position:relative of the always_relative wrapper in this block
                param_val_elt.classList.add("arg_val")
                let name_val_elt = make_arg_name_val(param_name_elt, param_val_elt) //no commas, no editable param names
                block_args_elt.append(name_val_elt)
                on_first = false
            }
            delim_elt = make_delimiter_drop_zone(")")
            delim_elt.style["margin-left"]  = "3px" //with an empty array, the [] brackets are too close to one another
            block_args_elt.append(delim_elt)
            always_rel.appendChild(//make_dom_elt("div",{class:"block_bottom_spacer"},
                make_dom_elt("div",
                    {class:"resizer",
                        draggable:"true",
                        ondragstart:"resizer_dragstart_handler(event)",
                        ondrag:"resizer_drag_handler(event)",
                        ondragend:"resizer_dragend_handler(event)",
                        ondrop:"resizer_drop_handler(event)",
                        onclick:"resizer_onclick(event)"}
                ))
            return result
        },
        to_js: function(block_elt){
            debugger
            let block_args = dom_elt_descendant_of_classes(block_elt,
                ["block_always_relative", "block_args"])
            let children = block_args.children
            result = "("
            let on_first = true
            for (let child of children){
                if(child.classList.contains("arg_name_val")){
                    let arg_val_elt = dom_elt_child_of_class(child, "arg_val")
                    let the_js = block_to_js(arg_val_elt)
                    if (!on_first) { result += " "}
                    result += the_js
                }
                else if (child.classList.contains("operators")){
                    let val = this.clean_select_value(child.value) //will be  a string
                    result += " " + val
                }
                on_first = false
            }
            result += ")"
            return result
        },
        clean_select_value(val_string) {
           //let index  = val_string.indexOf("&nbsp;(")
           //val_string = val_string.substring(0, index)
           //while (val_string.endsWith("nbsp;")){
           //    val_string = val_string.substring(0, val_string.length - 5)
           //}
           let nbsp_str = String.fromCharCode(160)
           let index  = val_string.indexOf(nbsp_str + "(") //nbsp; & paren in one 2 char sring
           if (index !== -1) {
            val_string = val_string.substring(0, index)
            val_string = val_string.trimRight()
           }
           return val_string
        }
})


/*
jsdb_method.kinds = []

var jsdb_infix_op = class jsdb_infix_op extends jsdb{
    constructor({name = "",
                 return_type = "number",
                 params = [],
                 category  = "Math"
                }){
        super();
        this.name        = name
        this.return_type = return_type
        this.params      = params
        this.category    = category
        jsdb_infix_op.kinds.push(this)
    }
}
jsdb_infix_op.kinds = []

var jsdb_prefix_op = class jsdb_prefix_op extends jsdb{ //for ! and -
    constructor({name = "",
                 return_type = "boolean",
                 params = "required", //always only 1
                 category  = "misc"
                }){
        super();
        this.name   = name
        this.return_type = return_type
        this.params      = params
        this.category    = category
        jsdb_prefix_op.kinds.push(this)
    }
}

jsdb_prefix_op.kinds = []

var jsdb_var_declaration = class jsdb_var_declaration extends jsdb {
    constructor({name = "",
                 value = undefined,
                 type= "any",
                 category="misc"
                }){
        super();
        this.name   = name
        this.value  = value
        this.type   = type //not usually used
        this.category  = category
    }
}

var jsdb_let_declaration = class jsdb_let_declaration extends jsdb {
    constructor({name = "",
                 value = undefined,
                 type= "any",
                 category="misc"
                }){
        super();
        this.name   = name
        this.value  = value
        this.type   = type //not usually used
        this.category  = category
    }
}

var jsdb_for_var = class jsdb_for_var extends jsdb {
    constructor({var_name = "i",
                 var_init_value = 0,
                 test = "i < 10",
                 incrementor="i++",
                 body = [],
                 category="control"
                }){
        super();
        this.var_name = var_name
        this.var_init_value = var_init_value,
        this.test = test
        this.incrementor = incrementor
        this.body = body
        this.category = category
    }
}

var jsdb_for_let = class jsdb_for_let extends jsdb {
    constructor({var_name = "i",
                 var_init_value = 0,
                 test = "i < 10",
                 incrementor="i++",
                 body = [],
                 category="control"
                }){
        super();
        this.var_name = var_name
        this.var_init_value = var_init_value
        this.test = test
        this.incrementor = incrementor
        this.body = body
        this.category = category
    }
}

var jsdb_if = class jsdb_if extends jsdb {
    constructor({test = "i < 10",
                 body = [],
                 category="control"
                }){
        super();
        this.test = test
        this.body = body
        this.category = category
    }
}

//note: can't find a way to get a classes subclasses in js.
//note: don't put "params" in here.
//jsdb.subclasses = [jsdb_method, jsdb_infix_op, jsdb_prefix_op, jsdb_var_declaration, jsdb_let_declaration, jsdb_for_var, jsdb_for_let, jsdb_if]
//instances
Root.BlockCategory.Math.add_block_type(
*/

newObject({prototype: Root.jsdb.literal.array,
    name:          "array3",
    category:       Root.BlockCategory.Array,
    display_label: '[0,0,0]',
    return_type:   "array",
    params: {0: Root.jsdb.literal.number,
             1: Root.jsdb.literal.number,
             2: Root.jsdb.literal.number
    }
})

newObject({prototype: Root.jsdb.literal.array,
    name:          "array5",
    category:       Root.BlockCategory.Array,
    display_label: '[0,0,0,0,0]',
    return_type:   "array",
    params: {0: Root.jsdb.literal.number,
             1: Root.jsdb.literal.number,
             2: Root.jsdb.literal.number,
             3: Root.jsdb.literal.number,
             4: Root.jsdb.literal.number
    }
})

newObject({prototype: Root.jsdb.one_of,
    name:          "null_undefined",
    category:       Root.BlockCategory.Logic,
    display_label: 'null/undefined',
    return_type:   "null", //not too useful
    choices:       ["null", "undefined"], //this is src code choices
    width:         57 //the widest thing we want to show is the "unde"  of "undefined".
})

newObject({prototype: Root.jsdb.infix,
    name:             "arithmetic",
    category:         Root.BlockCategory.Math,
    display_label:    "arithmetic",
    return_type:      "number",
    param_vals:       [1, 1],
    operator_choices: ["+&nbsp;&nbsp;&nbsp;&nbsp;(add)",
                       "-&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(subtract)",
                       "*&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(multiply)",
                       "/&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(divide)",
                       "%&nbsp;&nbsp;&nbsp;&nbsp;(remainder)",
                       "**&nbsp;&nbsp;&nbsp;&nbsp;(exponent)",
                       "<<&nbsp;&nbsp;&nbsp;(bitwise left shift)",
                       ">>&nbsp;&nbsp;&nbsp;(bitwise right shift)",
                       ">>>&nbsp;(unsigned bitwise right shift)"
                       ],
    operators_width:  52
})

newObject({prototype: Root.jsdb.infix,
    name:             "comparison",
    category:         Root.BlockCategory.Math,
    display_label:    "comparison",
    return_type:      "boolean",
    param_vals:       [true, false],
    operator_choices: ["==&nbsp;&nbsp;&nbsp;&nbsp;(equals)",
                       "===&nbsp;&nbsp;(same)",
                       "!=&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(not equals)",
                       "!==&nbsp;&nbsp;&nbsp;(not same)",
                       "<&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(less than)",
                       "<=&nbsp;&nbsp;&nbsp;&nbsp;(less than or equal to)",
                       "=>&nbsp;&nbsp;&nbsp;&nbsp;(more than or equal to)",
                       ">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(more than)"
                       ],
    operators_width:  50
})

newObject({prototype: Root.jsdb.infix,
    name:             "logic",
    category:         Root.BlockCategory.Logic,
    display_label:    "operators",
    return_type:      "boolean",
    param_vals:       [true, false],
    operator_choices: ["&&&nbsp;(logical AND)",
                       "||&nbsp;&nbsp;&nbsp;(logical OR)",
                       "&&nbsp;&nbsp;&nbsp;(bitwise AND)",
                       "|&nbsp;&nbsp;&nbsp;&nbsp;(bitwise OR)",
                       "^&nbsp;&nbsp;&nbsp;&nbsp;(bitwise XOR)"
                       ],
    operators_width:  45
})

newObject({prototype: Root.jsdb.infix,
    name:             "in_instanceof",
    category:         Root.BlockCategory.Object,
    display_label:    "in/instanceof",
    return_type:      "boolean",
    param_vals:       [true, false],
    operator_choices: ["in&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(property IN object)",
                       "instanceof&nbsp;(has class of)"
                      ],
    operators_width:  50
})


newObject({prototype: Root.jsdb.method,
    name: "Math__abs",
    category: Root.BlockCategory.Math,
    jsclassname: "Math",
    methodname: "abs",
    is_static: true,
    return_type: "number",
    params: {arg0: Root.jsdb.literal.number}
})

newObject({prototype: Root.jsdb.method,
    name: "Math__pow",
    category: Root.BlockCategory.Math,
    jsclassname: "Math",
    methodname: "pow",
    is_static: true,
    return_type: "number",
    params: {arg0: Root.jsdb.literal.number, arg1: Root.jsdb.literal.number,
             arg2: Root.jsdb.literal.number, arg3: Root.jsdb.literal.number}
})


newObject({prototype: Root.jsdb.class_instance,
    superclass:null,
    name: "Job",
    category: Root.BlockCategory.Job,
    return_type: "Job"
    //params: undefined
})
newObject({prototype: Root.jsdb.method,
    name: "Dexter__move_all_joints",
    jsclassname:"Dexter",
    methodname: "move_all_joints",
    is_static: true,
    category: Root.BlockCategory.Job,
    return_type: "Array",
    params: {array_of_5_angles: Root.jsdb.literal.array.array5}
})


function jsdb_init(){ }//must be called after blocks2.js loaded





