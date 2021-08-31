/*an instance of one of these classes like jsdb_method
 reresents a fn, etc. ie Math.abs
   but NOT a particular call to the fn.
   That is represented by a dom elt that' a child of Workspace.inst elt.
   That dom elt is built with info from the corresponding jsdb objet
   thatrepresents the block_type.
*/

import {shouldnt, compute_string_size, function_param_names_and_defaults,
    is_literal_object, is_string_an_identifier, is_string_a_number,
    replace_substrings, value_of_path} from "../job_engine/core/utils.js"

import {newObject, Root} from "../job_engine/core/object_system.js"
import {make_dom_elt} from "../job_engine/core/html_db.js"

function blocks_jsdb_init(){
newObject({
    name: "jsdb",
    constructor: function(){
        if (this.hasOwnProperty("category")){
            if (typeof(this.category) == "string") {
                let cat_maybe = Root.BlockCategory.name_to_category(this.category)
                if (cat_maybe) { this.category = cat_maybe }
                else { dde_error("jsdb constructor unable to find category: " + this.category)}
            }
            if(this.category) { //no category for non-leaf jsdb objs.
                this.category.add_block_type(this)
            }
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
        let full_path = (((this.hasOwnProperty("name") && this.name) ?
                          this.objectPath() :
                          this.prototype.objectPath()))
        return full_path //.substring("Root.jsdb.".length)
    },
    param_to_block(arg, param, additional_args=[]){
        if(arg === undefined)        { arg = param }
        if(is_block(arg))            { return arg}
        else if (arg.isA(Root.jsdb)) { return arg.make_dom_elt(undefined, undefined, ...additional_args) }
        else                         { return Root.jsdb.value_to_block(arg, additional_args[0]) }
    },
    param_to_identifiers_block_probably(arg, param, ...additional_args){ //if arg or param is a string,
         //the we're going to be making a Root.jsdb.identifier.identifiers and
         //additional_args can either be not passed, or have one additiona arg, an array of choices
         //for the Root.jsdb.identifier.identifiers
        if(arg === undefined)        { arg = param }
        if(is_block(arg))            { return arg}
        else if (arg.isA(Root.jsdb)) { return arg.make_dom_elt(undefined, undefined, ...additional_args) }
        else if (typeof(arg) == "string") { return Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, arg, ...additional_args) }
        else                         { return Root.jsdb.value_to_block(arg, additional_args[0]) }
    },
    // create a block_elt from a js value, typically a default value for a fn param but could be any
    value_to_block(value, src) {
        let type = typeof(value)
        if (is_block(value)) { // means its already a block
            return value
        }
        else if(value === null){
            return Root.jsdb.one_of.null_undefined.make_dom_elt(undefined, undefined, "null") //pass in htensrc because passing in the "va;" of undefined ,acts like no pssed in val at all effecting the block default choice of null.
        }
        else if(value === undefined){
            return Root.jsdb.one_of.null_undefined.make_dom_elt(undefined, undefined, "undefined") //pass in htensrc because passing in the "va;" of undefined ,acts like no pssed in val at all effecting the block default choice of null.
        }
        else if(type == "boolean") {
            return Root.jsdb.literal.boolean.make_dom_elt(undefined, undefined, value)
        }
        else if (type == "number"){
            return Root.jsdb.literal.number.make_dom_elt(undefined, undefined, value)
        }
        else if (type == "string"){
            let quote_char = '"'
            if (src && ((src[0] == "'") || (src[0] == "`"))) { quote_char = src[0]}
            return Root.jsdb.literal.string.make_dom_elt(undefined, undefined, value, quote_char)
        }
        else if (Array.isArray(value)){
            return Root.jsdb.literal.array.make_dom_elt(undefined, undefined, value)
        }
        else if (is_literal_object(value)) { //questionable
            return Root.jsdb.literal.object.make_dom_elt(undefined, undefined, value)
        }
        else if(typeof(src) == "string"){
            return Root.jsdb.js.make_dom_elt(undefined, undefined, src)
        }
        else if (src === undefined){
            src = to_source_code(value)
            return Root.jsdb.js.make_dom_elt(undefined, undefined, src)
        }
        else { return Root.jsdb.js.make_dom_elt(undefined, undefined, src) }
    },
    method_to_arg_name_val_elts(meth){
        let params_obj = function_param_names_and_defaults(meth)
        let make_editable_arg_names = false
        let between_name_and_val_char = ""
        let names_are_identifiers = false
        if (Array.isArray(params_obj) &&  //this clause should be cleaner!
            (params_obj.length == 2)  &&
            Array.isArray(params_obj[0]) &&
            (params_obj[1] == "{}")) { //ie method is probably a class with name-val pairs
            params_obj = params_obj[0]
            make_editable_arg_names = true
            between_name_and_val_char = ":"
            names_are_identifiers = true
        }
        let params_obj_is_array = Array.isArray(params_obj)
        let arg_name_val_elts = []
        if(params_obj_is_array){
            for(let i = 0; i < params_obj.length; i++){
                let param_name_val_array = params_obj[i]
                let param_name           = param_name_val_array[0]
                if ((names_are_identifiers) || (typeof(param_name) === "string")) {
                    param_name = Root.jsdb.identifier.make_dom_elt(undefined, undefined, param_name)
                }
                let param_default_src    = param_name_val_array[1]
                if (param_default_src === undefined) { param_default_src = "undefined" }
                //let param_default_value  = ((param_default_src == "{}") ? {} : eval(param_default_src)) //bug in js eval
                //let arg_val_elt          = Root.jsdb.value_to_block(param_default_value, param_default_src)
                let arg_val_elt          = JS2B.js_to_blocks(param_default_src)[0]
                let suffix_char          = ((i < (params_obj.length - 1)) ? "," : "")
                let arg_name_val_elt     = make_arg_name_val(param_name, arg_val_elt, make_editable_arg_names, between_name_and_val_char, suffix_char) //4th arg is make arg_name editable
                arg_name_val_elts.push(arg_name_val_elt)
            }
        }
        //maybe this clause is never called
        else { //assume params_obj is a lit obj with name-val pairs
            let keys = Object.keys(params_obj) //beware: if params_obj_is_array == true, keys loks like: ["0", "1"...]
            for(let param_name of keys){
                let param_default_src = params_obj[param_name]
                //let param_default_value = ((param_default_src == "{}") ? {} : eval(param_default_src)) //bug in js eval
                //let arg_val_elt = Root.jsdb.value_to_block(param_default_value, param_default_src)
                let arg_val_elt          = JS2B.js_to_blocks(param_default_src)[0]
                let suffix_char = ((i < (keys.length - 1)) ? "," : "")
                let arg_name_val_elt = make_arg_name_val(param_name, arg_val_elt, true, ":", suffix_char) //3rd arg is make arg_name editable
                arg_name_val_elts.push(arg_name_val_elt)
            }
        }
        return arg_name_val_elts
    },
    clean_select_value(val_string) {
        //let index  = val_string.indexOf("&nbsp;(")
        //val_string = val_string.substring(0, index)
        //while (val_string.endsWith("nbsp;")){
        //    val_string = val_string.substring(0, val_string.length - 5)
        //}
        let nbsp_str = String.fromCharCode(160)
        let index  = val_string.indexOf(nbsp_str) //nbsp; & paren in one 2 char sring
        if (index !== -1) {
            val_string = val_string.substring(0, index)
            val_string = val_string.trimRight()
        }
        index = val_string.indexOf("&nbsp;")
        if (index !== -1) {
            val_string = val_string.substring(0, index)
            val_string = val_string.trimRight()
        }
        return val_string
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
            "data-block-type": this.make_data_block_type_string(), //"literal." + this.name,
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
        //let always_rel   = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        //let block_args   = html_db.dom_elt_child_of_class(always_rel, "block_args")
        //let arg_val      = html_db.dom_elt_child_of_class(block_args, "arg_val")
        let arg_val = html_db.dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val            = arg_val.checked
        return val.toString()
    },
    click_help_string(block_elt){
       return block_to_js(block_elt)
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
                       "data-block-type": this.make_data_block_type_string(), //"literal." + this.name,
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
                    //let always_rel   = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
                    //let block_args   = html_db.dom_elt_child_of_class(always_rel, "block_args")
                    //let arg_val      = html_db.dom_elt_child_of_class(block_args, "arg_val")
                    //let val          = arg_val.value
                    let arg_val = html_db.dom_elt_descendant_of_classes(block_elt,
                       ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
                    let val          = arg_val.value
                    return val //its already a string
                },
                click_help_string(block_elt){
                    return block_to_js(block_elt)
                }
})

newObject({prototype: Root.jsdb.literal,
    name: "string",
    category: Root.BlockCategory.String,
    display_label: '"string"', //not displayed in block but displayed in menu
    return_type: "string",
    value: "",
    make_dom_elt: function(x=0, y=0, arg_val, quote_char='"'){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "margin-top": "0px",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(), //"literal." + this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        //no block name by design: a string should be obvious. Don't take up the space of #, nor the newline usually after the block name
        always_rel.appendChild(make_dom_elt("span",
                                            {class:"block_name", display:"inline-block", visibility: "hidden", width:"0px", margin: "0px", padding: "0px"}, //not shown BUT useful internally to mark this element
                                            'string'))
        always_rel.appendChild(this.make_quote_button("open", quote_char))
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
                display:"inline-block",
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
        always_rel.appendChild(this.make_quote_button("close", quote_char))
        return result
    },

    //careful, the below two used by assignment and maybe some other blocks
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
    make_quote_button(open_or_close="open", quote_char='"'){
        let result = make_dom_elt("input", {type:    "button",
                                      class:   "block_args_delimiter " + open_or_close,
                                      //height:  "20px",
                                      //value:   '"',
                                      style: "width:12px;height:20px;",
                                      margin:  "0px",
                                      padding: "0px",
                                      onclick: "Root.jsdb.literal.string.quote_button_action(event)"})
        result.value = quote_char //can't get this right using make_dom_elt
        return result
    },
    to_js: function(block_elt){
        let always_rel   = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        //let block_args   = html_db.dom_elt_child_of_class(always_rel, "block_args")
        //let arg_val      = html_db.dom_elt_child_of_class(block_args, "arg_val")
        //let val          = arg_val.value
        let arg_val = html_db.dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val          = arg_val.value
        let block_args_delimiter = html_db.dom_elt_child_of_class(always_rel, "block_args_delimiter")
        let delim = block_args_delimiter.value
        return delim + val + delim
    },
    click_help_string(block_elt){
        return block_to_js(block_elt)
    }
})

newObject({prototype: Root.jsdb.literal,
    name: "array",
    category: Root.BlockCategory.Array,
    display_label: '[array]',
    //value: [], //don't us this, use params for each elt of the array.
    return_type:"array",
    params: [], //don't make this undefined as we don't need to look at  the "method" of "array" to know what its default args arg
    //category:"misc",
    constructor: function(){ this.callPrototypeConstructor() },
    //similar to method_call.make_dom_elt
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
                "data-block-type": this.make_data_block_type_string(), //this.make_data_block_type_string(), //"literal." + this.name,
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
            let suffix_char = ((param_name != last_name)? "," : "")
            let name_val_elt = make_arg_name_val(param_name_elt, param_val_elt, false, "", suffix_char)
            block_args_elt.append(name_val_elt)
        }
        delim_elt = make_delimiter_drop_zone("]")
        delim_elt.style["margin-left"]  = "3px", //with an empty array, the [] brackets are too close to one another
        block_args_elt.append(delim_elt)
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel   = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args   = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals = html_db.dom_elt_children_of_class(block_args, "arg_name_val")
        let result = "["
        let on_first = true
        for (let arg_name_val of arg_name_vals){
            let arg_val  = html_db.dom_elt_child_of_class(arg_name_val, "arg_val")
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
    },
    click_help_string(block_elt){
        return block_to_js(block_elt)
    }

})

newObject({prototype: Root.jsdb.literal,
    name: "object",
    category: Root.BlockCategory.Object,
    display_label: '{object}',
    //value: [], //don't us this, use params for each elt of the array.
    return_type:"object",
    params: {},
    between_name_and_value: ":",
    constructor: function(){ this.callPrototypeConstructor() },
    //similar to method_call.make_dom_elt
    //arg_vals can be:
    // - a lit obj with names of strings (the prop names) and vals of a js value like 123 or block_elts
    // - an array of arg_name_val_elts
    make_dom_elt: function(x, y, arg_vals, between_name_and_value){
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
                "data-block-type": this.make_data_block_type_string(), //"literal." + this.name,
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
        if (Array.isArray(val)) { //assume val is an array of arg_name_vals
            for(let name_val_elt of val){
                block_args_elt.append(name_val_elt)
            }
        }
        else {
            let names = Object.keys(val)
            let last_name = last(names)
            between_name_and_value = (between_name_and_value ? between_name_and_value : this.between_name_and_value)
            for(let param_name of names){
                let param_name_elt
                if      (is_string_a_number(param_name))  {
                      let num = parseFloat(param_name)
                      param_name_elt = Root.jsdb.literal.number.make_dom_elt(undefined, undefined, num)}
                else if (param_name == "true")  { param_name_elt = Root.jsdb.literal.boolean.make_dom_elt(undefined, undefined, true)}
                else if (param_name == "false") { param_name_elt = Root.jsdb.literal.boolean.make_dom_elt(undefined, undefined, false)}
                else if (param_name == "null")  { param_name_elt = Root.jsdb.one_of.null_undefined.make_dom_elt(undefined, undefined, null)}
                else if (typeof(param_name) == "string") {
                    if(is_string_an_identifier(param_name)) {
                           param_name_elt = Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, param_name)
                    }
                    else { param_name_elt = Root.jsdb.literal.string.make_dom_elt(undefined, undefined, param_name) }
                }
                else { shouldnt("in Root.jsdb.literal.object.make_dom_elt got invalid param_name of: " + param_name) }
                let array_elt_or_param_block_type = val[param_name]
                let param_val_elt
                if (arg_vals !== undefined){
                    param_val_elt = Root.jsdb.value_to_block(array_elt_or_param_block_type)
                }
                else { //array_elt_or_param_block_type should be a block_type
                    param_val_elt = array_elt_or_param_block_type.make_dom_elt()
                }
                let suffix_char = ((param_name != last_name) ? "," : "")
                let name_val_elt = make_arg_name_val(param_name_elt, param_val_elt, true, between_name_and_value, suffix_char)
                block_args_elt.append(name_val_elt)
                param_name_elt.style["margin-right"]  = "0px" //todo doesn't work
                param_name_elt.style["padding-right"] = "0px" //todo doesn't work
            }
        }
        delim_elt = make_delimiter_drop_zone("}")
        delim_elt.style["margin-left"]  = "3px" //with an empty array, the [] brackets are too close to one another
        block_args_elt.append(delim_elt)
        //always_rel.appendChild(make_dom_elt("div", {class:"block_bottom_spacer"}))
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt, non_first_indent){
        let always_rel   = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args   = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals = html_db.dom_elt_children_of_class(block_args, "arg_name_val")
        let result = "{"
        let on_first = true
        for (let arg_name_val of arg_name_vals){
            let arg_name  = html_db.dom_elt_child_of_class(arg_name_val, "arg_name") //this will be a lit string block
            let between_name_and_val = arg_name_val.childNodes[1].innerText //equal sign when we've got fn params with default vals, otherwise colon
            if (between_name_and_val == ":") { between_name_and_val = between_name_and_val + " " }
            let arg_val   = html_db.dom_elt_child_of_class(arg_name_val, "arg_val")
            let name_src  = block_to_js(arg_name)
            let val_src   = block_to_js(arg_val)
            if (!on_first) { result += ",\n " + non_first_indent}
            result += name_src + between_name_and_val + val_src
            on_first = false
        }
        return result + "}"
    },
    click_help_string(block_elt){
        return block_to_js(block_elt)
    }
})

newObject({prototype: Root.jsdb,
    name: "code_body",
    category: Root.BlockCategory.Misc,
    display_label: '{code_body}',
    //value: [], //don't us this, use params for each elt of the array.
    return_type:"any",
    params: [],
    constructor: function(){ this.callPrototypeConstructor() },
    //similar to method_call.make_dom_elt
    make_dom_elt: function(x, y, params){
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
                "data-block-type": this.make_data_block_type_string(), //this.name,
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
        params = ((params !== undefined) ? params : this.params)
        for(let val of params){
            let param_name_elt = make_dom_elt("span", {class: "arg_name", "margin-right": "0px", "padding-right": "0px"}, "")
            let param_val_elt = Root.jsdb.value_to_block(val)
            param_val_elt.classList.remove("block-absolute") //because its not absolute, and should inherit the position:relative of the always_relative wrapper in this block
            param_val_elt.classList.add("arg_val")
            let suffix_char = ";"
            let name_val_elt = make_arg_name_val(param_name_elt, param_val_elt, false, "", suffix_char)
            block_args_elt.append(name_val_elt)
            param_name_elt.style["margin-right"]  = "0px" //todo doesn't work
            param_name_elt.style["padding-right"] = "0px" //todo doesn't work
        }
        delim_elt = make_delimiter_drop_zone("}")
        delim_elt.style["margin-left"]  = "3px" //with an empty array, the [] brackets are too close to one another
        block_args_elt.append(delim_elt)
        //always_rel.appendChild(make_dom_elt("div", {class:"block_bottom_spacer"}))
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel   = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args   = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals = html_db.dom_elt_children_of_class(block_args, "arg_name_val")
        let result = "{"
        for (let arg_name_val of arg_name_vals){
            let arg_val   = html_db.dom_elt_child_of_class(arg_name_val, "arg_val")
            let val_src   = block_to_js(arg_val)
            result += val_src + "\n"
        }
        return result + "}"
    },
    click_help_string(block_elt){ //returning an array passes its first elt though to the user.
        return ["Curly braces surround code bodys found in <br/>function definitions, if, else, try, catch and other constructs."]
    }
})

newObject({prototype: Root.jsdb,
    name: "one_of", //abstract class, not useful by itself
    //display_label: 'true/false', //not displayed in block but displayed in menu
    return_type: "any",
    value: null, //the initially selected choice.  used by null_or_undefined
    choices: undefined,
    eval_each_choice: true,
    width:   undefined,
    make_dom_elt: function(x, y, value, choices, eval_each_choice, width){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": (this.category ? this.category.color : Root.BlockCategory.Misc.color), //when we're dynamicallymaking a one_oflike in assignment, there's no category
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(), //"one_of." + this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        //no block name by design: a num should be obviu. Don't take up the space of #, nor the newline usually after the block name
        let block_args_elt = make_dom_elt("div", {class:"block_args", "margin-top": "0px", "padding-top": "0px"})
        always_rel.appendChild(block_args_elt)
        eval_each_choice = ((eval_each_choice === undefined) ? this.eval_each_choice : eval_each_choice)
        let choice_elts = []
        value = ((value !== undefined) ? value : this.value)
        choices = ((choices !== undefined) ? choices : this.choices)
        for (let choice of choices){
            let choice_val = (eval_each_choice? eval(choice) : choice)
            let attrs = {}
            if(this.name=="null_undefined") {//without this check "undefined" will be selected by default,when "null" should be.
               if (((choice_val === null)      && (value === null)) ||
                   ((choice_val === null)      && (value === "null")) ||
                   ((choice_val === undefined) && (value === "undefined")) ||
                   ((choice_val === undefined) && (value === undefined)) ||
                   (choice_val == value)
                  )
                   { attrs.selected = "selected" }
            }
            else if(value === choice_val) { attrs.selected = "selected" }
            else if((typeof(choice_val) === "string") && choice_val.startsWith(value + "&nbsp;")) { attrs.selected = "selected" }
            choice_elts.push(make_dom_elt("option", attrs, choice))
        }
        let arg_val_elt = make_dom_elt("select",
                                       {class:"arg_val",
                                        "margin-left": "0px",
                                        //value: this.value,
                                        margin:  "4px",
                                        padding: "0px",
                                        "font-size": "13px !important", //doesn't work. still shows in font-size 11 grrrr.
                                        ondragenter:"enter_drop_target(event)",
                                        ondragleave:"leave_drop_target(event)"},
                                    choice_elts)
        width = (width ? width : this.width)
        if (typeof(width) == "number") { width = width + "px" }
        if (width) { arg_val_elt.style.width = width }
        let arg_name_val_elt = make_arg_name_val(null, arg_val_elt)
        arg_name_val_elt.style["margin-left"] = "0px"
        block_args_elt.appendChild(arg_name_val_elt)
        return result
    },
    to_js: function(block_elt){
        //let always_rel   = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        //let block_args   = html_db.dom_elt_child_of_class(always_rel, "block_args")
        //let arg_val      = html_db.dom_elt_child_of_class(block_args, "arg_val")
        //let val          = arg_val.value
        let arg_val = html_db.dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val            = arg_val.value
        val = Root.jsdb.clean_select_value(val)
        return val
    },
    click_help_string(block_elt){
        return block_to_js(block_elt)
    }
})

newObject({prototype: Root.jsdb,
    name: "path",
    category: Root.BlockCategory.Object,
    display_label: 'path (with dots)',
    //value: [], //don't us this, use params for each elt of the array.
    return_type:"any",
    path_elements: ["this", "foo"], //don't make this undefined as we don't need to look at  the "method" of "array"to know what its default args arg
                   //each elt can be a string, a block, or a Root.jsdb instance.
    constructor: function(){ this.callPrototypeConstructor() },
    //similar to method_call.make_dom_elt
    make_dom_elt: function(x, y, path_elements){ //arg_vals can be an array of the elts of the array, or a string (maybe with dots in it) or not passed.
        let always_rel = make_dom_elt("div",
                                      {class: "block_always_relative",
                                      "min-width": "28px", //otherwise the resizer box appears on top of the []
                                      "margin-bottom": "0px"})
        let result = make_dom_elt("div",
                                {class:"block block-absolute",
                                "background-color": this.category.color,
                                id: Root.jsdb.get_next_block_id(),
                                left: x + "px",
                                top:  y + "px",
                                padding: "0px",
                                //"margin-left": "20px",
                                draggable: "true",
                                "data-block-type": this.make_data_block_type_string(), //"path", //"literal." + this.name,
                                //  ondragstart: "Root.jsdb.dragstart_handler(event)",
                                ondragenter:"enter_drop_target(event)",
                                ondragleave:"leave_drop_target(event)",
                                onclick: "select_block(event)"
                                //position: "absolute"
                            },
            always_rel
        )
        let block_name_elt = make_dom_elt("div", {class:"block_name"}, "")
        let delim_elt = make_delimiter_drop_zone(block_left_triangle) //big black left pointingtriangle//&blacktriangleleft;") //&langd;
        block_name_elt.appendChild(delim_elt)
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-right":"2px"})
        always_rel.appendChild(block_args_elt)
        path_elements = (path_elements ? path_elements : this.path_elements)
        if (typeof(path_elements) == "string")  { path_elements = path_elements.split(".") } //turns a string of 1 or more dot separated path element into an array of identifiers
        let last_elt = last(path_elements)
        let processed_path_elts = []
        for(let path_elt of path_elements){
            let param_val_elt
            if (is_block(path_elt)) {
                path_val_elt = path_elt //ok as is
            }
            else if (path_elt.isA(Root.jsdb)) {
                path_val_elt = path_elt.make_dom_elt()
            }
            else if (typeof(path_elt) == "string"){
                path_val_elt = Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, path_elt)
            }
            else { shouldnt("in Root.jsdb.path.make_dom_elt with invalid path element type: " + path_elt) }
            processed_path_elts.push(path_val_elt)
        }
        for(let i = 0; i <  processed_path_elts.length; i++) {
            let path_elt = processed_path_elts[i]
            let suffix_char
            if (i == (processed_path_elts.length - 1)) {
                       suffix_char = ""
            }
            else {
                let next_path_elt = processed_path_elts[i + 1]
                let bt = dom_elt_block_type(next_path_elt)
                if (bt.isA(Root.jsdb.computed_path_element)) {
                       suffix_char = ""  //no dot before "["
                }
                else { suffix_char = "." }
            }
            let name_val_elt = make_arg_name_val("", path_elt, false, "", suffix_char)
            block_args_elt.append(name_val_elt)
        }
        delim_elt = make_delimiter_drop_zone(block_right_triangle) //big black right pointing triangle &blacktriangleright;") //&rangd;
        delim_elt.style["margin-left"]  = "3px", //with an empty array, the [] brackets are too close to one another
            block_args_elt.append(delim_elt)
        always_rel.appendChild(make_resizer_elt())
        return result
    },

    push_block: function(path_block_elt, new_last_path_elt){
        let always_rel   = html_db.dom_elt_child_of_class(path_block_elt, "block_always_relative")
        let block_args   = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let new_name_val = make_arg_name_val("", new_last_path_elt)
        let close_delim  = html_db.dom_elt_child_of_class(block_args, "close")
        html_db.insert_elt_before(new_name_val, close_delim)
        clean_up_arg_names(path_block_elt)
    },

    to_js: function(block_elt){
        let always_rel   = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args   = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals = html_db.dom_elt_children_of_class(block_args, "arg_name_val")
        let array_of_sources = []
        for (let i = 0; i < arg_name_vals.length; i++){
            let arg_name_val = arg_name_vals[i]
            let arg_val  = html_db.dom_elt_child_of_class(arg_name_val, "arg_val")
            let src = block_to_js(arg_val)
            array_of_sources.push(src)
        }
        let result = ""
        for(let i = 0; i < array_of_sources.length; i++){
            let cur_src = array_of_sources[i]
            let on_last = (i == (array_of_sources.length - 1))
            let next_src = (on_last ? null : array_of_sources[i + 1])
            let cur_src_is_computed  = cur_src.startsWith("[")
            let next_src_is_computed = (next_src && next_src.startsWith("["))
            if (cur_src_is_computed) {} //don't insert dot prefix
            else if (i > 0) { result += "." }
            result += cur_src
        }
        return result
    },
    click_help_string(block_elt){
        let src = block_to_js(block_elt)
        if (src.includes(".")) {
            return ["<code>" + src + "</code> is a path wherein each non-first element in the path gets a part of its preceding path element."]
        }
        else if (src == "") {
           return ["A one element path with an empty first element.<br/>" +
                   "Select or type in a variable name."]
        }
        else { return ["<code>" + src + "</code> is a one-element path. It behaves like a global variable reference."] }

    }
})

//for array aref a la foo[2], foo[2 + 3] or any object computued prop ref a la foo[bar()]
newObject({prototype: Root.jsdb,
    name: "computed_path_element",
    category: Root.BlockCategory.Object,
    display_label: 'computed path elt',
    //value: [], //don't us this, use params for each elt of the array.
    return_type:"any",
    core_element: 0, //don't make this undefined as we don't need to look at  the "method" of "array"to know what its default args arg
    //each elt can be a string, a block, or a Root.jsdb instance.
    constructor: function(){ this.callPrototypeConstructor() },
    //similar to method_call.make_dom_elt
    make_dom_elt: function(x, y, core_element){ //arg_vals can be an array of the elts of the array, or not passed
        let always_rel = make_dom_elt("div",
            {class: "block_always_relative",
                "min-width": "28px", //otherwise the resizer box appears on top of the []
                "margin-bottom": "0px"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                padding: "0px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(), //"path", //"literal." + this.name,
                //  ondragstart: "Root.jsdb.dragstart_handler(event)",
                ondragenter:"enter_drop_target(event)",
                ondragleave:"leave_drop_target(event)",
                onclick: "select_block(event)"
                //position: "absolute"
            },
            always_rel
        )
        let block_name_elt = make_dom_elt("div", {class:"block_name"}, "")
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-right":"2px"})
        always_rel.appendChild(block_args_elt)
        core_element = Root.jsdb.param_to_block(core_element, this.core_element)
       // core_elt.dataset["computed"] = "true"
        let name_val_elt = make_arg_name_val("", core_element)
        block_args_elt.append("[")
        block_args_elt.append(name_val_elt)
        block_args_elt.append("]")
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel   = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args   = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_val = html_db.dom_elt_child_of_class(block_args, "arg_name_val")
        let arg_val  = html_db.dom_elt_child_of_class(arg_name_val, "arg_val")
        let src = "[" + block_to_js(arg_val) + "]"
        return src
    }
})

// example: new Job({name: "foo"})
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
        }
    },

    get_class: function(){
        return value_of_path(this.jsclassname) //might return undefined
    },

    //https://stackoverflow.com/questions/8389643/css-making-the-content-div-auto-size-after-the-content-within
    //arg_vals is an array of vals. In the case of a Job, the array is 1 long with
    //a lit obj as its first arg containing all the name-val pairs.
    // OR the elts of the array can be js vals or block elts of those vals.
    //The block_args elt of THIS class_instance obj will contain
    //arg_name_val elts that have a name of "" and a block arg value.
    //in the case of a Job, there will be just one rg_name_val elt
    //whose name is "" and whose val is a lit obj of the 14 name-val pairs of a job.
    make_dom_elt: function(x, y, jsclassname, arg_vals){
        this.jsclassname = (jsclassname ? jsclassname : this.jsclassname)
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(), //is this right ??? data_bt_val,
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
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)
        let arg_name_val_elts = []
        if(arg_vals){
           for(arg_val of arg_vals){
               //if (is_block(arg_val)) { arg_name_val_elts.push(arg_val) }
               //else {
                   let arg_val_block = Root.jsdb.value_to_block(arg_val)
                   let name_val_elt  =  make_arg_name_val("", arg_val_block)
                   arg_name_val_elts.push(name_val_elt)
               //}
           }
        }
        else { //happens when we're making a Job from the menu.
            let the_class     = this.get_class()
            let inner_arg_name_val_elts = Root.jsdb.method_to_arg_name_val_elts(the_class)
            let lit_block_elt = Root.jsdb.literal.object.make_dom_elt(undefined, undefined, inner_arg_name_val_elts)
            let top_level_name_val = make_arg_name_val("", lit_block_elt)
            arg_name_val_elts.push(top_level_name_val)
        }
        for (let arg_name_val_elt of arg_name_val_elts){
            block_args_elt.appendChild(arg_name_val_elt)
        }
        delim_elt = make_delimiter_drop_zone(")")
        delim_elt.style["margin-left"]  = "3px" //with an empty array, the [] brackets are too close to one another
        block_args_elt.appendChild(delim_elt)
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = html_db.dom_elt_child_of_class(always_rel, "block_name")
        let block_args     = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals  = html_db.dom_elt_children_of_class(block_args, "arg_name_val")
        let result = block_name_elt.firstChild.data + "("
        let indent = " ".repeat(result.length)
        for (let i = 0; i < arg_name_vals.length; i++){
            let indent_for_this_arg = ((i == 0) ? "" : indent)

            let arg_name_val_elt = arg_name_vals[i]
            let arg_name_elt     = html_db.dom_elt_child_of_class(arg_name_val_elt, "arg_name")
            let arg_name_string  = ""
            if(arg_name_elt) { arg_name_string = arg_name_elt.value }

            if (arg_name_string != "") { arg_name_string += ": " }
            let arg_val_elt    = html_db.dom_elt_child_of_class(arg_name_val_elt, "arg_val")
            let arg_val_string = block_to_js(arg_val_elt, indent)

            let src = indent_for_this_arg + arg_name_string + arg_val_string
            result += src
            if (i < (arg_name_vals.length - 1)) { result += ","} //we're not on the last one, which doesn't get a comma
            result += "\n"
        }
        return result + ")"
    },
    click_help_string(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = html_db.dom_elt_child_of_class(always_rel, "block_name")
        let new_and_class_name = block_name_elt.firstChild.data
        let class_name = new_and_class_name.split(" ")[1]
        return ["<code>" + new_and_class_name + "</code> creates an instance of the <code>" + class_name + "</code> class."]
    }
})



newObject({prototype: Root.jsdb,
    name: "js",
    category: Root.BlockCategory.Misc,
    display_label: "js source",
    return_type: "any",
    js_src: "",
    make_dom_elt: function(x=0, y=0, js_src){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "margin-top": "0px",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(), //"literal." + this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        always_rel.appendChild(make_dom_elt("span",
                                            {class:"block_name", display:"inline-block", padding: "0px", margin: "0px"},
                                            "js"))
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-top": "0px", "padding-top": "0px"})
        always_rel.appendChild(block_args_elt)
        js_src = ((js_src === undefined) ? this.js_src : js_src )
        let width = Root.jsdb.literal.string.compute_width(js_src, 15, 3)
        let val_elt = make_dom_elt("input",
               {class:"arg_val",
                type: "text",
                "margin-left": "0px",
                value: js_src,
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
        let arg_val = html_db.dom_elt_descendant_of_classes(block_elt,
                         ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val          = arg_val.value
        return val
    },
    click_help_string(block_elt){
        let result = "A <i>js block</i> allows the direct insertion of JavaScript source code <br/>into DDE's blocks view, in this case:<br/>"
        let src = block_to_js(block_elt)
        let js_info = Js_info.get_info_string(src)
        if (js_info.startsWith("Sorry,")) {
            result += "<code>" + src + "</code><br>Click on a part of the above for detailed help."
        }
        else { result += js_info }
       return [result]
       }
})

//like JS but doesn't display "js" as  a block name, No displayed block name.
newObject({prototype: Root.jsdb,
    name: "identifier",
    category: Root.BlockCategory.Misc,
    display_label: "identifier",
    return_type: "any",
    value: "",
    make_dom_elt: function(x=0, y=0, value){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "margin-top": "0px",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(), //this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        always_rel.appendChild(make_dom_elt("span",
                                           {class:"block_name", display:"inline-block"},
                                           ""))
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-top": "0px", "padding-top": "0px"})
        always_rel.appendChild(block_args_elt)
        value = ((typeof(value) == "string") ? value : this.value)
        let width = Root.jsdb.literal.string.compute_width(value, 15, 3)
        let val_elt = make_dom_elt("input",
            {class:"arg_val",
                type: "text",
                "margin-left": "0px",
                value: value,
                style: "width:" + width + "px;",
                margin: "0px",
                padding: "0px",
                "font-size": "14px",
                oninput: "Root.jsdb.literal.string.oninput(event)",
                ondragenter:"enter_drop_target(event)",
                onchange: this.make_data_block_type_string() + ".onchange(event)",
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
    onchange(event){
        Root.jsdb.identifier.identifiers.add_item_maybe(event.target.value)
    },
    to_js: function(block_elt){ //if this changes, change block.js clean_up_arg_names fn
        let arg_val = html_db.dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val          = arg_val.value
        return val
    },
    click_help_string(block_elt){
        return block_to_js(block_elt)
    }
})

//combo_box of identifiers
newObject({prototype: Root.jsdb.identifier,
    name: "identifiers",
    category: Root.BlockCategory.Misc,
    display_label: "identifiers",
    return_type: "any",
    choices: ["this", "window"],
    selected_name: "",
    is_existing_choice(choice, choices){
        choices = (choices? choices : this.choices)
        if (is_block(choice)) { choice = block_to_js(choice) }
        for(let possible_choice of choices){
            if ((choice == possible_choice) || (possible_choice.startsWith(choice + "&n") ))
              return true
        }
        return false
    },

    //return non neg integer of index of select_name in choices, or null if its not in there.
    //be careful as selected_name might be "++" and choices might be ["++&nspbsome doc", ...]
    //and ++ should match that first item in choices.
    index_of_choice(choice, choices){
        choices = (choices? choices : this.choices)
        if (is_block(choice)) { choice = block_to_js(choice) }
        for(let i = 0; i < choices.length; i++){
            let possible_choice = choices[i]
            if ((choice == possible_choice) || (possible_choice.startsWith(choice + "&n") )){
                return i
            }
        }
        return null
    },

    make_dom_elt: function(x=0, y=0, selected_name, choices){ //choices usully not passed but used for identifiers_prefix and postfix
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "margin-top": "0px",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                margin: "0px",
                padding: "0px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(), //"identifier." + this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        always_rel.appendChild(make_dom_elt("span",
            {class:"block_name", display:"inline-block"},
            ""))
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-top": "0px", "padding-top": "0px"})
        always_rel.appendChild(block_args_elt)
        selected_name = (selected_name ? selected_name : this.selected_name)

        choices = (choices? choices : this.choices)

        if (!this.is_existing_choice(selected_name, choices)){ //note, we can't just call add_item_maybe since we haven't installed the hew combo box yet.. But we call add_item_maybe at the very end of this fn
            if (is_block(selected_name)) { selected_name = block_to_js(selected_name) } //when selected_name is an identifier block
            choices.unshift(selected_name)
        }
        let selected_index = this.index_of_choice(selected_name, choices) //choices.indexOf(selected_name)
        //let longest_choice = ""
        //for(let cho of this.choices){
        //    if(cho.length > longest_choice.length) { longest_choice = cho }
        //}
        let width = Root.jsdb.literal.string.compute_width(selected_name, 15, 3)
        let val_elt = make_dom_elt("div",
                                    {class:"arg_val identifier_combo_box",
                                    type: "text",
                                    value: selected_name,
                                    //style: "width:" + width + "px;", //does nothing. jqxcombobox overrules
                                    margin:  "0px",
                                    padding: "0px",
                                    "font-size": "14px",
                                    //style: "vertical-align:0%;", //doesn't help
                                        //oninput: "Root.jsdb.literal.string.oninput(event)",//does nothing for th jqx widget
                                    ondragenter:"enter_drop_target(event)",
                                    ondragleave:"leave_drop_target(event)"
                                    })
        //https://www.jqwidgets.com/community/topic/extract-combo-box-value-when-typed-in/#post-99347
        //https://www.jqwidgets.com/jquery-widgets-documentation/documentation/jqxcombobox/jquery-combobox-styling-and-appearance.htm?search=comb
        this.jqx_combo = $(val_elt).jqxComboBox({height: '16px',
                                                 source: choices,
                                                 selectedIndex: selected_index,
                                                 width: width + 25 + "px",
                                                 dropDownWidth: 200,
                                                 autoComplete: true,

                                })
        this.jqx_combo.on('change', function (event){
           // "this" inside this fn is the dom elt with class arg_val
           // this.children[1].value  returns the orig value string but not a typed in value string.
            let the_val
            let the_input_elt = this.children[1]
            the_input_elt.style["min-width"] = "40px"
            let sel_item = $(event.target).jqxComboBox("getSelectedItem")
            if (sel_item) { //sel_item is null if you type in a single char to the combo box, the change willbe called but sel_item will be null due to bug in jqx
                the_val = sel_item.value
            }
            else { //happens when user types in then hits return, tab or clicks outside the widget
                the_val = the_input_elt.value
            }
            the_val = Root.jsdb.clean_select_value(the_val)
            let new_width = Root.jsdb.literal.string.compute_width(the_val,
                                                                   14, //elt.style["font-size"],
                                                                   35)
            $(this).jqxComboBox({width: new_width}) // dropDownWidth: new_width + "px" }) // ,
            $(this).jqxComboBox({dropDownWidth: 200})
            var items = $(this).jqxComboBox('getItems')
            let identifiers_elt = html_db.closest_ancestor_of_class(this, "block")
            let path_elt        = html_db.closest_ancestor_of_class(identifiers_elt.parentNode, "block")
            if (path_elt){
                let meth_call_elt   = html_db.closest_ancestor_of_class(path_elt.parentNode, "block")
                if (meth_call_elt && meth_call_elt.dataset.blockType == "Root.jsdb.method_call"){
                 clean_up_arg_names(meth_call_elt)
                }
            }
            Root.jsdb.identifier.identifiers.add_item_maybe(the_val, $(this)[0])
        })

         this.jqx_combo.on('keyup', function (event){
            // "this" inside this fn is the jqx combo widget.
            let the_val       = event.target.value
            let new_width = Root.jsdb.literal.string.compute_width(the_val,
                14, //elt.style["font-size"],
                35)
            $(this).jqxComboBox({width: new_width})
            $(this).jqxComboBox({dropDownWidth: 200})
        })
        /*this.jqx_combo.on('keyup', function (event){
            // "this" inside this fn is the jqx combo widget.
            let key = event.key
            let the_input_elt = this.children[1]
            let width = $(this).jqxComboBox("width") //fails as does $(event.target).jqxComboBox("width")
            let new_width = ((key == "Backspace") ? width -= 12 : width += 12)
                12, //elt.style["font-size"],
                35)
            $(this).jqxComboBox({width: new_width})
            $(this).jqxComboBox({dropDownWidth: 200})
        })*/

        let arg_name_val_elt = make_arg_name_val("", val_elt)
        block_args_elt.appendChild(arg_name_val_elt)
        return result
    },
    //example call:  Root.jsdb.identifier.combo_box.add_item("new_item")
    // adds the new item as new first item
    //to all existing combo boxes and all new ones that will be created.
    //keeps whatever item was selected in an existing combo box as selected.
    add_item_maybe(new_item_string, source_jqx_combo_box){
        if (is_block(new_item_string)) { new_item_string = block_to_js(new_item_string) } //when new_item_sring is passed in as an identifier
        if(!this.is_existing_choice(new_item_string)){
            this.add_item(new_item_string, source_jqx_combo_box)
        }
    },
    add_item(new_item_string, source_jqx_combo_box){
        if (is_block(new_item_string)) { new_item_string = block_to_js(new_item_string) } //when new_item_sring is passed in as an identifier
        this.choices.unshift(new_item_string) //add to beginning of choices so that the next new combo box will have the new item
         //the above must occur before the below because the below will
         //trigger this.jqx_combo.on('change'...) and that will call
         //add_item_maybe which we want to NOT call add_item a 2nd time.

         //below, we want all identifier_combo_boxes to get our new_item_string, not just the one
         //that it was enter into.
        for (let cb of $(".identifier_combo_box")){
            let sel_item = $(cb).jqxComboBox('getSelectedItem')
            $(cb).jqxComboBox('insertAt',  new_item_string, 0) //put new item at beginning
            if(cb == source_jqx_combo_box){
                $(cb).jqxComboBox("selectIndex", 0) //have to do or else we get a blank in our originating combo box
            }
            else {  //reselect orig item because the insertAt changes the sel item which is really indicated internally just by the selectedIndex.
                $(cb).jqxComboBox("selectItem", sel_item)
            }
        }
    },
    //oninput(event){
    //    let elt = event.target //the jqx combon box jquery elt
        //let width = Root.jsdb.literal.string.compute_width(elt.value, elt.style["font-size"], 10)
        //elt.style.width = width + "px" //
    //    elt.jqxComboBox({ width: '250px' });
    //},
    compute_width(val, font_size, extra_width=0) {
        //f (typeof(val) != "string") { val = (val).toString() }
        //return ((val.length + 2) * 7) + "px" //just slightly bigger than necesary but making either constant 1 smaller makes it too small
        return compute_string_size(val, font_size, extra_width)[0]
    },
    to_js: function(block_elt){
        let arg_val = html_db.dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val     = $(arg_val).val()
        val = Root.jsdb.clean_select_value(val)
        return val
    },
    click_help_string(block_elt){
        let src = block_to_js(block_elt)
        if(src == "") { return ["This is an empty identifier. Type in a variable name."] }
        else { return block_to_js(block_elt) }
    }
})

/* attempts to use HTML 5 datalist way of making a combo box which fails in Electron
as does the Awesomeplete widget, so I use jqx combo box instead.
newObject({prototype: Root.jsdb.identifier,
    name: "combo_datalist",
    category: Root.BlockCategory.Misc,
    display_label: "identifiers",
    return_type: "any",
    choices: "identifiers_datalist_id", // ["this", "window"],
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

        //let options = []
        //for(let opt of this.choices){
        //    let opt_elt = make_dom_elt("option", {}, opt)
        //    options.push(opt_elt)
        //}
        let val_elt = make_dom_elt("input", {type: "text", list: "identifiers_datalist_id"}) //todo doesn't show thelsit of choices and never does the more complex version below.

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
        let arg_val = html_db.dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args", "arg_name_val", "arg_val"])
        let val     = $(arg_val).val()
        return val
    }
})
*/

//mst be before for_iter
newObject({prototype: Root.jsdb,
    name:          "identifiers_postfix",
    display_label: "i++/--",
    category:       Root.BlockCategory.Math,
    selected_identifier: "i",
    choices: ["++&nbsp;(increment before return)",
        "--&nbsp;&nbsp;&nbsp;(decriment before return)"],
    selected_operator:   "++",

    constructor: function(){
        this.callPrototypeConstructor()
    },
    //arg_vals are the blocks in the code_body, expr is wrapped in static parens
    make_dom_elt: function(x, y, selected_identifier, selected_operator){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(),
                onclick: "select_block(event)"
            },
            always_rel
        )
        let block_name_elt = make_dom_elt("div", {class:"block_name"}, "")
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)

        selected_identifier = Root.jsdb.param_to_identifiers_block_probably(selected_identifier, this.selected_identifier)
        selected_operator   = Root.jsdb.param_to_identifiers_block_probably(selected_operator, this.selected_operator, this.choices)

        let identifer_arg_name_val_elt = make_arg_name_val("", selected_identifier)
        let option_elts = []
        for(let op of this.choices) {
            option_elts.push(make_dom_elt("option", {}, op))
        }
        let operator_elt   = make_dom_elt("select", {width: "45px"}, option_elts)
        let operator_arg_name_val_elt = make_arg_name_val("", selected_operator)
        block_args_elt.appendChild(identifer_arg_name_val_elt)
        block_args_elt.appendChild(operator_arg_name_val_elt)
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = html_db.dom_elt_child_of_class(always_rel, "block_name")
        let block_args     = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let ident_elt      = html_db.dom_elt_child_of_class(block_args.childNodes[0], "arg_val")
        let op_select_elt  = html_db.dom_elt_child_of_class(block_args.childNodes[1], "arg_val")
        let op_str         = block_to_js(op_select_elt)
        let result         = block_to_js(ident_elt) + op_str
        return result
    },
    click_help_string(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args     = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let op_select_elt  = html_db.dom_elt_child_of_class(block_args.childNodes[1], "arg_val")
        let op_str         = op_select_elt.value
        op_str             = Root.jsdb.clean_select_value(op_str)
        return op_str
    }
})

newObject({prototype: Root.jsdb,
    name:          "identifiers_prefix",
    display_label: "! (not), etc",
    category:       Root.BlockCategory.Logic,
    selected_identifier: "i",
    choices: ["!&nbsp;&nbsp;&nbsp;&nbsp;(not)",
        "~&nbsp;&nbsp;&nbsp;(bitwise not)",
        "-&nbsp;&nbsp;&nbsp;&nbsp;(negation)",
        "++&nbsp;(increment after return)",
        "--&nbsp;&nbsp;&nbsp;(decriment after return)"],
    selected_operator:   "!",

    constructor: function(){
        this.callPrototypeConstructor()
    },
    //arg_vals are the blocks in the code_body, expr is wrapped in static parens
    make_dom_elt: function(x, y, selected_identifier, selected_operator){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(),
                onclick: "select_block(event)"
            },
            always_rel
        )
        let block_name_elt = make_dom_elt("div", {class:"block_name"}, "")
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)
        selected_identifier = Root.jsdb.param_to_identifiers_block_probably(selected_identifier, this.selected_identifier)
        selected_operator   = Root.jsdb.param_to_identifiers_block_probably(selected_operator, this.selected_operator, this.choices)

        let identifier_elt = Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, selected_identifier)
        let identifer_arg_name_val_elt = make_arg_name_val("", selected_identifier)
        let option_elts = []
        for(let op of this.choices) {
            option_elts.push(make_dom_elt("option", {}, op))
        }
        let operator_elt   = make_dom_elt("select", {width:"45px"}, option_elts)
        let operator_arg_name_val_elt = make_arg_name_val("", selected_operator)
        block_args_elt.appendChild(operator_arg_name_val_elt)
        block_args_elt.appendChild(identifer_arg_name_val_elt)
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt,  "block_always_relative")
        let block_name_elt = html_db.dom_elt_child_of_class(always_rel, "block_name")
        let block_args     = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let ident_elt      = html_db.dom_elt_child_of_class(block_args.childNodes[1], "arg_val")
        let op_select_elt  = html_db.dom_elt_child_of_class(block_args.childNodes[0], "arg_val")//op comes first in prefix
        let op_str         = block_to_js(op_select_elt)
        let result         = op_str + block_to_js(ident_elt)
        return result
    },
    click_help_string(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args     = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let op_select_elt  = block_args.childNodes[0].childNodes[1]
        let op_str         = op_select_elt.value
        op_str             = Root.jsdb.clean_select_value(op_str)
        return op_str
    }
})

newObject({prototype: Root.jsdb,
    name:            "assignment",
    category:         Root.BlockCategory.Misc,
    display_label:    "assignment",
    return_type:      "undefined",
    declaration_type: "",
    variable_name:    "i",
    initial_value:    0,
    show_initial_value: true,

    make_dom_elt: function(x=0, y=0, declaration_type, variable_name, initial_value, show_initial_value){ //set to false when showing the assignment in for(let of [6, 7, 8]) {...}
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result     = make_dom_elt("div",
            {class:"block block-absolute",
                "margin-top": "0px",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(), //this.name,
                onclick: "select_block(event)"
            },
            always_rel
        )
        always_rel.appendChild(make_dom_elt("span",
            {class:"block_name", display:"inline-block"},
            ""))
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-top": "0px", "padding-top": "0px"})
        always_rel.appendChild(block_args_elt)
        declaration_type = ((declaration_type == undefined) ? this.declaration_type : declaration_type)
        variable_name    = ((variable_name    == undefined) ? this.variable_name : variable_name)
        initial_value    = ((initial_value    == undefined) ? this.initial_value : initial_value)

        let kind_elt = make_dom_elt("select", {class: "assignment_kind", "vertical-align": "baseline",  width: "60px"},
                                     [make_dom_elt("option", ((declaration_type == "")      ? {selected: "selected"} : {}), "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(set variable)"),
                                      make_dom_elt("option", ((declaration_type == "let")   ? {selected: "selected"} : {}), "let&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(declare local variable"),
                                      make_dom_elt("option", ((declaration_type == "var")   ? {selected: "selected"} : {}), "var&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(declare function def variable)"),
                                      make_dom_elt("option", ((declaration_type == "const") ? {selected: "selected"} : {}), "const&nbsp;(declare constant)")
                                      ])
        let kind_name_val_elt = make_arg_name_val("", kind_elt)
        kind_name_val_elt.style["vertical-align"] = "50%"
        block_args_elt.appendChild(kind_name_val_elt)
        let var_name_elt = Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, variable_name)
        var_name_elt.style["vertical-align"] = "baseline"
        let var_name_val_elt = make_arg_name_val("", var_name_elt)
        block_args_elt.appendChild(var_name_val_elt)
        show_initial_value = ((show_initial_value === undefined) ? this.show_initial_value : show_initial_value)
        if(show_initial_value) {
            block_args_elt.appendChild(make_dom_elt("span", {"vertical-align" : "50%"}, " ="))
            let val_elt = Root.jsdb.value_to_block(initial_value)
            val_elt.style["vertical-align"] = "baseline"
            val_elt.style.margin  = "0px"
            val_elt.style.padding = "0px"
            let val_name_val_elt = make_arg_name_val("", val_elt)
            block_args_elt.appendChild(val_name_val_elt)
        }
        return result
    },
    remove_init_val: function(assigment_block_elt){
        let block_args_elt = html_db.dom_elt_descendant_of_classes(assigment_block_elt, ["block_always_relative", "block_args"])
        html_db.remove_dom_elt(last(block_args_elt.childNodes)) //init val
        html_db.remove_dom_elt(last(block_args_elt.childNodes)) //the equl sign span
    },

    to_js: function(block_elt){
        let block_args     = html_db.dom_elt_descendant_of_classes(block_elt,
                                                           ["block_always_relative", "block_args"])
        let arg_name_vals  = html_db.dom_elt_children_of_class(block_args, "arg_name_val")
        let variable_kind  = arg_name_vals[0].children[0].value //one of "",let, var, const
        variable_kind = Root.jsdb.clean_select_value(variable_kind)
        let variable_name_block  = arg_name_vals[1].children[0]
        let variable_name        = block_to_js(variable_name_block)
        let variable_val_block   = (arg_name_vals[2]? arg_name_vals[2].children[0] : null)
        let variable_value       = (variable_val_block? block_to_js(variable_val_block) : "undefined")
        let result = variable_kind
        result += ((result == "")? "" : " ")
        result += variable_name
        if (variable_value != "undefined") { result += " = " + variable_value }
        //if(this.show_initial_value) { result += " = " + variable_value }
        return result
    },
    click_help_string(block_elt){
        let block_args     = html_db.dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args"])
        let arg_name_vals  = html_db.dom_elt_children_of_class(block_args, "arg_name_val")
        let variable_kind  = arg_name_vals[0].children[0].value //one of "",let, var, const
        variable_kind      = Root.jsdb.clean_select_value(variable_kind)
        if (variable_kind != "") { return variable_kind} //"let", "var", or "const"
        else {
            let src = block_to_js(block_elt)
            let var_name = src.split(" ")[0]
            return ["<code>" + src + "</code> sets the <code>" + var_name + "</code> variable to a value."]
        }
    }
})
newObject({prototype: Root.jsdb,
            name: "infix",
            display_label: "", //can be "foo" for a global fn, or "Math.abs" for a static method
                               //or "(foo).bar" for an instance method on the class foo.
            return_type: "any",
            first_arg:  newObject({prototype: Root.jsdb.identifier.identifiers,
                                   value: "i"}),
            op_arg:     "+",
            second_arg: 1,
            operator_choices: [],
            operators_width: undefined,
            constructor: function(){
                this.callPrototypeConstructor()
            },
        make_dom_elt: function(x, y, first_arg, op_arg, second_arg){
            let always_rel = make_dom_elt("div", {class: "block_always_relative"})
            let result = make_dom_elt("div",
                {class:"block block-absolute",
                    "background-color": this.category.color,
                    id: Root.jsdb.get_next_block_id(),
                    left: x + "px",
                    top:  y + "px",
                    draggable: "true",
                    "data-block-type": this.make_data_block_type_string(), //"infix." + this.name,
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

            first_arg = Root.jsdb.param_to_block(first_arg, this.first_arg)
            let first_arg_name_val = make_arg_name_val("", first_arg)
            block_args_elt.appendChild(first_arg_name_val)

            if(op_arg === undefined) { op_arg = this.op_arg }
            let options = []
            for (let op of this.operator_choices) {
                let props
                if (op.startsWith(op_arg + "&nbsp;")) { props = {class: "operator", selected: "selected" } }
                else                                  { props = {class: "operator"} }
                let op_elt = make_dom_elt("option", props, op)
                options.push(op_elt)
            }
            let select = make_dom_elt("select", {class: "operators"}, options)
            if(this.operators_width) {
                select.style.width = this.operators_width + "px" //todo compute this based on subtracting suffixes of " (comment)". Maybe not: I want to show "unde" of "undefined" for instance.
            }
            block_args_elt.appendChild(select)

            second_arg = Root.jsdb.param_to_block(second_arg, this.second_arg)
            let second_arg_name_val = make_arg_name_val("", second_arg)
            block_args_elt.appendChild(second_arg_name_val)

            delim_elt = make_delimiter_drop_zone(")")
            delim_elt.style["margin-left"]  = "3px" //with an empty array, the [] brackets are too close to one another
            block_args_elt.append(delim_elt)
            always_rel.appendChild(make_resizer_elt())
            return result
        },
        to_js: function(block_elt){
            let block_args = html_db.dom_elt_descendant_of_classes(block_elt,
                ["block_always_relative", "block_args"])
            let children = block_args.children
            let result = "("
            let on_first = true
            for (let child of children){
                if(child.classList.contains("arg_name_val")){
                    let arg_val_elt = html_db.dom_elt_child_of_class(child, "arg_val")
                    let the_js = block_to_js(arg_val_elt)
                    if (!on_first) { result += " "}
                    result += the_js
                }
                else if (child.classList.contains("operators")){
                    let val = Root.jsdb.clean_select_value(child.value) //will be  a string
                    result += " " + val
                }
                on_first = false
            }
            result += ")"
            return result
        },
    click_help_string(block_elt){
        let block_args = html_db.dom_elt_descendant_of_classes(block_elt,
            ["block_always_relative", "block_args"])
        let children = block_args.children
        for (let child of children){
           if (child.classList.contains("operators")){
                return Root.jsdb.clean_select_value(child.value) //will be  a string
                result += " " + val
            }
        }
        //we couldn't find an operator so just to not error here and try
        //to give something a little bit useful ...
        let src = block_to_js(block_elt)
        return ["<code>" + src + "</code><br/> uses JavaScript infix operators."]
    },

    infix_sub_kind(operator){
        //all of the items in operator_choices have th actual operator followed by &nbsp;
        //its not good enough to see if each operator_choices string starts with
        //the operator because of operators < and << for instance,
        //and operators &, &&, thus we extend operator for the purose of this test.
        operator += "&n"
        for(let sub_kind of Root.jsdb.infix.subObjects()){
            for(let choice of sub_kind.operator_choices){
                if (choice.startsWith(operator)) { return sub_kind }
            }
        }
        return Root.jsdb.infix
    }
})

newObject({prototype: Root.jsdb.infix,
    name:             "arithmetic",
    category:         Root.BlockCategory.Math,
    display_label:    "arithmetic",
    return_type:      "number",
    first_arg:        Root.jsdb.identifier.identifiers, //"i",
    op_arg:           "+",
    second_arg:       1,
    operator_choices: [ "+&nbsp;&nbsp;&nbsp;&nbsp;(add)",
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
    first_arg:        true,
    op_arg:           "==",
    second_arg:       false,
    operator_choices: [ "==&nbsp;&nbsp;&nbsp;&nbsp;(equals)",
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
    display_label:    "&& (and), etc", //"operators",
    return_type:      "boolean",
    param_vals:       [true, false],
    operator_choices: [ "&&&nbsp;(logical AND)",
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
    operator_choices: ["in&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(property IN object)",
                       "instanceof&nbsp;(has class of)"
    ],
    operators_width:  70
})

//not use directly, only instances of it are such as try{foo(); bar(); } and else
newObject({prototype: Root.jsdb,
    name: "rword_code_body",
    display_label: "", //can be "foo" for a global fn, or "Math.abs" for a static method
    //or "(foo).bar" for an instance method on the class foo.
    //category:"misc",
    code_body:     undefined, //null,
    constructor: function(){
        this.callPrototypeConstructor()
        if(this.name != "rword_code_body"){
            if(this.display_label.length == 0) {
                this.display_label = this.name
            }
        }
    },
    //arg_vals are the blocks in the body_body
    make_dom_elt: function(x, y, code_body){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(),
                onclick: "select_block(event)"
            },
            always_rel
        )
        let block_name_elt = make_dom_elt("div",
            {class:"block_name"},
            this.display_label)
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)
        code_body = ((code_body == undefined) ? this.code_body : code_body)
        if (!is_block(code_body)) {
            code_body = Root.jsdb.code_body.make_dom_elt(x, y, code_body)
        }
        //code_body.style.position = "static"
        let arg_name_val_elt = make_arg_name_val("", code_body)
        block_args_elt.appendChild(arg_name_val_elt)
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = html_db.dom_elt_child_of_class(always_rel, "block_name")
        let block_args     = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let name_string    = block_name_elt.innerText
        let code_body      = block_args.childNodes[0].childNodes[0]
        let code_body_src  = block_to_js(code_body)
        code_body_src = "{\n" + code_body_src.substring(1)
        let result = name_string + code_body_src
        return result
    },
    click_help_string(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = html_db.dom_elt_child_of_class(always_rel, "block_name")
        let name_string    = block_name_elt.innerText
        return name_string
    }
})

//See also  "Root.jsdb.rword_expr.return"
newObject({prototype: Root.jsdb, //used for delete, yield, yield*. No parens around expr
    name: "rword_expr",
    display_label: "",
    //category: Root.BlockCategory.Control,
    operation: "return", // but could be yield, yield* delete
    operation_choices: ["return&nbsp;(value from fn or gen)", "yield&nbsp;&nbsp;&nbsp;(value from gen)", "yield*&nbsp;(values from gen)"],
    expr: "Root.jsdb.infix.comparison", //make it a string because comparison is lower down in the file so this errors on loading the file
    constructor: function(){
        this.callPrototypeConstructor()
        if(this.name != "rword_expr"){
            if(this.display_label.length == 0) {
                this.display_label = this.name
            }
        }
    },
    //arg_vals are the blocks in the code_body, expr is wrapped in static parens
    make_dom_elt: function(x, y, operation, expr, operation_choices){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(),
                onclick: "select_block(event)"
            },
            always_rel
        )
        operation = ((operation === undefined) ? this.operation : operation)
        operation_choices = ((operation_choices === undefined) ? this.operation_choices : operation_choices)
        let block_name_elt
        if (operation_choices) {
            block_name_elt = Root.jsdb.one_of.make_dom_elt(undefined, undefined,
                                                            operation,
                                                            operation_choices,
                                                            false,
                                                            65)
            block_name_elt.classList.add("block_name")
        }
        else {
            block_name_elt = make_dom_elt("div", {class:"block_name"}, operation)
        }
        block_name_elt.classList.remove("block-absolute")
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)
        expr = ((expr === undefined) ? this.expr : expr)
        if(!is_block(expr)){
            if(typeof(expr) == "string") {
                expr = value_of_path(expr)
            }
            expr = expr.make_dom_elt()
            expr.classList.remove("block-absolute")
        }
        let expr_bt = dom_elt_block_type(expr)
        let add_parens = false //((expr_bt == Root.jsdb.infix.comparison) ? false : true)
        if(add_parens) { //need to do this for "catch"
            block_args_elt.appendChild(make_dom_elt("span", {}, "("))
        } //don't include if expr is a  comparison since it already have their own internal parens
        let expr_arg_name_val_elt = make_arg_name_val("", expr)
        block_args_elt.appendChild(expr_arg_name_val_elt)
        if(add_parens) {
            block_args_elt.appendChild(make_dom_elt("span", {}, ")"))
        }
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = html_db.dom_elt_child_of_class(always_rel, "block_name")
        let name_string    = block_to_js(block_name_elt) //block_name_elt.innerText
        let block_args     = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let expr_name_val  = block_args.childNodes[0] //((block_args.childNodes.length == 2) ?  block_args.childNodes[0] :  block_args.childNodes[1])
        let expr_val       = html_db.dom_elt_child_of_class(expr_name_val, "arg_val") //expr_name_val.childNodes[1]
        let expr_src       = block_to_js(expr_val)
        //let open_paren_maybe   = (expr_src.startsWith("(") ? "" : "(")
        //let close_paren_maybe  = (expr_src.endsWith(")")   ? "" : ")")
        let result = name_string + " " + expr_src
        return result
    },
    click_help_string(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = html_db.dom_elt_child_of_class(always_rel, "block_name")
        let name_string    = block_name_elt.innerText
        return name_string
    }
})

newObject({prototype: Root.jsdb.rword_expr, //used for delete, yield, yield*. No parens around expr
    name: "return",
    display_label: "return",
    category: Root.BlockCategory.Control,
    operation: "return", // but could be yield, yield* delete
    operation_choices: ["return&nbsp;(value from fn or gen)", "yield&nbsp;&nbsp;&nbsp;(value from gen)", "yield*&nbsp;(values from gen)"],
    expr: "Root.jsdb.infix.comparison", //make it a string because comparison is lower down in the file so this errors on loading the file
})

newObject({prototype: Root.jsdb.rword_expr,
    name:          "delete",
    display_label: "delete",
    category:       Root.BlockCategory.Object,
    operation:     "delete",
    operation_choices: null,
    expr:           Root.jsdb.path
})
/*constructor: function(){
    this.callPrototypeConstructor()
},
//arg_vals are the blocks in the code_body, expr is wrapped in static parens
make_dom_elt: function(x, y, expr){
    let always_rel = make_dom_elt("div", {class: "block_always_relative"})
    let result = make_dom_elt("div",
        {class:"block block-absolute",
            "background-color": this.category.color,
            id: Root.jsdb.get_next_block_id(),
            left: x + "px",
            top:  y + "px",
            draggable: "true",
            "data-block-type": this.make_data_block_type_string(),
            onclick: "select_block(event)"
        },
        always_rel
    )
    let block_name_elt = make_dom_elt("div", {class:"block_name"}, "delete")
    always_rel.appendChild(block_name_elt)
    let block_args_elt = make_dom_elt("div", {class:"block_args"})
    always_rel.appendChild(block_args_elt)

    let expr_elt   = Root.jsdb.path.make_dom_elt()
    let expr_arg_name_val_elt = make_arg_name_val("", expr_elt)
    block_args_elt.appendChild(expr_arg_name_val_elt)
    always_rel.appendChild(make_resizer_elt())
    return result
},
to_js: function(block_elt){
    let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
    let block_name_elt = html_db.dom_elt_child_of_class(always_rel, "block_name")
    let block_args     = html_db.dom_elt_child_of_class(always_rel, "block_args")
    let expr_elt       = block_args.childNodes[0].childNodes[1]
    let result         = "delete " + block_to_js(expr_elt)
    return result
},
click_help_string(block_elt) { return "delete" }

})*/
/*
newObject({prototype: Root.jsdb.rword_expr,
        name:          "yield",
        display_label: "yield",
        category:       Root.BlockCategory.Object,
        expr:           Root.jsdb.path,
        delegate:       false,
    make_dom_elt: function(x, y, expr, delegate){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(),
                onclick: "select_block(event)"
            },
            always_rel
        )
        delegate = ((delegate === undefined) ? this.delegate : delegate)
        let block_name_elt = make_dom_elt("div",
            {class:"block_name"},
            (delegate ? "yield*" : "yield"))
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)
        expr = ((expr === undefined) ? this.expr : expr)
        if(!is_block(expr)){
            if(typeof(expr) == "string") {
                expr = value_of_path(expr)
            }
            expr = expr.make_dom_elt()
            expr.classList.remove("block-absolute")
        }
        let expr_bt = dom_elt_block_type(expr)
        let add_parens = false //((expr_bt == Root.jsdb.infix.comparison) ? false : true)
        if(add_parens) { //need to do this for "catch"
            block_args_elt.appendChild(make_dom_elt("span", {}, "("))
        } //don't include if expr is a  comparison since it already have their own internal parens
        let expr_arg_name_val_elt = make_arg_name_val("", expr)
        block_args_elt.appendChild(expr_arg_name_val_elt)
        if(add_parens) {
            block_args_elt.appendChild(make_dom_elt("span", {}, ")"))
        }
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = html_db.dom_elt_child_of_class(always_rel, "block_name")
        let block_args     = html_db.dom_elt_child_of_class(always_rel, "block_args")
        let name_string    = block_name_elt.innerText
        let expr_name_val  = block_args.childNodes[0] //((block_args.childNodes.length == 2) ?  block_args.childNodes[0] :  block_args.childNodes[1])
        let expr_val       = html_db.dom_elt_child_of_class(expr_name_val, "arg_val") //expr_name_val.childNodes[1]
        let expr_src       = block_to_js(expr_val)
        //let open_paren_maybe   = (expr_src.startsWith("(") ? "" : "(")
        //let close_paren_maybe  = (expr_src.endsWith(")")   ? "" : ")")
        let result = name_string + " " + expr_src
        return result
    }
    }
)*/

//not used directly but used as superclass for if, else if, catch
newObject({prototype: Root.jsdb,
    name: "rword_expr_code_body",
    display_label: "",
    category:  Root.BlockCategory.Control,
    operation: "required", //if, else if, catch
    operation_choices: null,
    expr: "Root.jsdb.infix.comparison", //make it a string because comparison is lower down in the file so this errors on loading the file
    code_body: undefined,
    constructor: function(){
        this.callPrototypeConstructor()
        if(this.name != "rword_expr_code_body"){
            if(this.display_label.length == 0) {
                this.display_label = this.name
            }
        }
    },
    //arg_vals are the blocks in the code_body, expr is wrapped in static parens
    make_dom_elt: function(x, y, operation, expr, code_body, operation_choices){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(),
                onclick: "select_block(event)"
            },
            always_rel
        )
        operation = ((operation == undefined) ? this.operation : operation)
        operation_choices = ((operation_choices == undefined) ? this.operation_choices : operation_choices)
        let block_name_elt
        if (operation_choices) {
            block_name_elt = Root.jsdb.one_of.make_dom_elt(undefined, undefined,
                                                            operation,
                                                            operation_choices,
                                                            false,
                                                            65)
            block_name_elt.classList.add("block_name")
        }
        else {
            block_name_elt = make_dom_elt("div", {class:"block_name"}, operation)
        }
        block_name_elt.classList.remove("block-absolute")
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)
        expr = ((expr === undefined) ? this.expr : expr)
        if(!is_block(expr)){
            if(typeof(expr) == "string") {
                expr = value_of_path(expr)
            }
            expr = expr.make_dom_elt()
            expr.classList.remove("block-absolute")
        }
        let expr_bt = dom_elt_block_type(expr)
        let add_parens = ((expr_bt == Root.jsdb.infix.comparison) ? false : true)
        if(add_parens) { //need to do this for "catch"
            block_args_elt.appendChild(make_dom_elt("span", {}, "("))
        } //don't include if expr is a  comparison since it already have their own internal parens
        let expr_arg_name_val_elt = make_arg_name_val("", expr)
        block_args_elt.appendChild(expr_arg_name_val_elt)
        if(add_parens) {
            block_args_elt.appendChild(make_dom_elt("span", {}, ")"))
        }
        code_body = ((code_body == undefined) ?  this.code_body : code_body)
        let code_body_elt
        if(is_block(code_body)) { code_body_elt = code_body }
        else { code_body_elt = Root.jsdb.code_body.make_dom_elt(x, y, code_body) }
        let arg_name_val_elt = make_arg_name_val("", code_body_elt)
        block_args_elt.appendChild(arg_name_val_elt)
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel     = html_db.dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = dom_elt_child_of_class(always_rel, "block_name")
        let name_string    = block_to_js(block_name_elt) //block_name_elt.innerText
        let block_args     = dom_elt_child_of_class(always_rel, "block_args")
        let expr_name_val  = ((block_args.childNodes.length == 2) ?  block_args.childNodes[0] :  block_args.childNodes[1])
        let expr_val       = dom_elt_child_of_class(expr_name_val, "arg_val") //expr_name_val.childNodes[1]
        let expr_src       = block_to_js(expr_val)
        let open_paren_maybe   = (expr_src.startsWith("(") ? "" : "(")
        let close_paren_maybe  = (expr_src.endsWith(")")   ? "" : ")")
        let code_body_name_val = ((block_args.childNodes.length == 2) ?  block_args.childNodes[1] :  block_args.childNodes[3])
        let code_body      = dom_elt_child_of_class(code_body_name_val, "arg_val") //code_body_name_val.childNodes[1]
        let code_body_src  = block_to_js(code_body)
        code_body_src = "{\n" + code_body_src.substring(1) //start the first expr on a newline, like the rest of them
        let result = name_string + open_paren_maybe + expr_src + close_paren_maybe + code_body_src
        return result
    },
    click_help_string(block_elt){
        let always_rel     = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = dom_elt_child_of_class(always_rel, "block_name")
        let name_string    = block_name_elt.innerText
        return name_string
    }
})

Root.BlockCategory.Control.add_block_type_header("LOOPING")
//just a class, not used directly
newObject({prototype: Root.jsdb,
            name:          "for",
            display_label:  undefined,
            assignment_arg: undefined,
            comparison_arg: undefined,
            increment_arg:  undefined,
            body_arg:       undefined,

    constructor: function(){
        this.callPrototypeConstructor()
    },
    //arg_vals are the blocks in the code_body, expr is wrapped in static parens
    make_dom_elt: function(x, y, assignment_arg, comparison_arg, increment_arg, body_arg){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(),
                onclick: "select_block(event)"
            },
            always_rel
        )
        let block_name_elt = make_dom_elt("div",
            {class:"block_name"},
            "for")
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)
        block_args_elt.appendChild(make_dom_elt("span", {}, "("))
        assignment_arg = Root.jsdb.param_to_block(assignment_arg, this.assignment_arg)
        comparison_arg = Root.jsdb.param_to_block(comparison_arg, this.comparison_arg)
        increment_arg  = Root.jsdb.param_to_block(increment_arg,  this.increment_arg)
        body_arg       = Root.jsdb.param_to_block(body_arg,       this.body_arg)

        block_args_elt.appendChild(make_arg_name_val("", assignment_arg))
        block_args_elt.appendChild(make_arg_name_val("", comparison_arg))
        block_args_elt.appendChild(make_arg_name_val("", increment_arg))
        block_args_elt.appendChild(make_dom_elt("span", {}, ")"))
        block_args_elt.appendChild(make_arg_name_val("", body_arg))

        always_rel.appendChild(make_resizer_elt())
        return result
    },
    click_help_string(block_elt){
       return "for"
    }
})
newObject({prototype: Root.jsdb.for,
    name:          "for_iter",
    display_label: "for i = 0",
    category:      Root.BlockCategory.Control,
    assignment_arg: newObject({prototype: Root.jsdb.assignment,
                                declaration_type: "let",
                                variable_name:    "i",
                                initial_value:    0
    }),
    comparison_arg: newObject({prototype: Root.jsdb.infix.comparison,
                                first_arg:  newObject({prototype: Root.jsdb.identifier.identifiers,
                                                        selected_name: "i"
                                            }),
                                op_arg:     "<",
                                second_arg: 10
    }),
    increment_arg:  newObject({prototype: Root.jsdb.identifiers_postfix,
                                selected_identifier: "i",
                                selected_operator: "++"
    }),
    body_arg:       newObject({prototype: Root.jsdb.code_body}),

    to_js: function(block_elt){
        let always_rel     = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = dom_elt_child_of_class(always_rel, "block_name")
        let block_args     = dom_elt_child_of_class(always_rel, "block_args")
        let assignment_elt = dom_elt_child_of_class(block_args.childNodes[1], "arg_val")
        let comparison_elt = dom_elt_child_of_class(block_args.childNodes[2], "arg_val")
        let increment_elt  = dom_elt_child_of_class(block_args.childNodes[3], "arg_val")
        let code_body      = dom_elt_child_of_class(block_args.childNodes[5], "arg_val")
        let code_body_src  = block_to_js(code_body)
        code_body_src = "{\n" + code_body_src.substring(1) //start the first expr on a newline, like the rest of them
        code_body_src = replace_substrings(code_body_src, "\n", "\n    ") //indent
        let result = "for(" + block_to_js(assignment_elt)  + "; " +
            block_to_js(comparison_elt) + "; " +
            block_to_js(increment_elt)  + ")" +
            code_body_src
        return result
    }
})
//todo js2b needs work below here.
newObject({prototype: Root.jsdb.for,
    name:          "for_of",
    display_label: "for of / in",
    category:      Root.BlockCategory.Control,
    assignment_arg: newObject({prototype: Root.jsdb.assignment,
                                declaration_type: "let",
                                variable_name:    "val",
                                initial_value:    undefined,
                                show_initial_value: false
    }),
    comparison_arg: newObject({prototype: Root.jsdb.one_of,
                               choices: ["of", "in"],
                               value: "of",
                               eval_each_choice: false,
                              }),
    increment_arg:  newObject({prototype: Root.jsdb.identifier.identifiers}),
    body_arg:       newObject({prototype: Root.jsdb.code_body}),

    to_js: function(block_elt){
        let always_rel     = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = dom_elt_child_of_class(always_rel, "block_name")
        let block_args     = dom_elt_child_of_class(always_rel, "block_args")
        let first          = dom_elt_child_of_class(block_args.childNodes[1], "arg_val")
        let second         = dom_elt_child_of_class(block_args.childNodes[2], "arg_val")
        let third          = dom_elt_child_of_class(block_args.childNodes[3], "arg_val")
        let code_body      = dom_elt_child_of_class(block_args.childNodes[5], "arg_val")
        let code_body_src  = block_to_js(code_body)
        code_body_src = "{\n" + code_body_src.substring(1) //start the first expr on a newline, like the rest of them
        code_body_src = replace_substrings(code_body_src, "\n", "\n    ") //indent
        let result = "for(" + block_to_js(first)  + " " +
            block_to_js(second) + " " +
            block_to_js(third)  + ")" +
            code_body_src
        return result
    },
    click_help_string(block_elt){
        let url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for"
        return ["<a href='" + url + "'>for</a>(let i of [5, 6, 7]){...}"]
    }
})

//very similar to Root.jsdb.literal.object
//used ony for fn defs.
newObject({prototype: Root.jsdb,
    name: "function_params",
    category: null,
    display_label: "",
    //value: [], //don't us this, use params for each elt of the array.
    return_type:"undefined",
    params: {},
    constructor: function(){ this.callPrototypeConstructor() },
    //similar to method_call.make_dom_elt
    make_dom_elt: function(x, y, params){
        let always_rel = make_dom_elt("div",
            {class: "block_always_relative",
                "min-width":     "32px", //otherwise the resizer box appears on top of the []
                "margin-bottom": "3px"}) //otherwise, the bottom of the squrae brackets too close to the bottom of the block.
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": Root.jsdb.function.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(), //"literal." + this.name,
                //  ondragstart: "Root.jsdb.dragstart_handler(event)",
                onclick: "select_block(event)"
                //position: "absolute"
            },
            always_rel
        )
        let block_name_elt = make_dom_elt("div",
            {class:"block_name"},
            "")
        let delim_elt = make_delimiter_drop_zone("(")
        block_name_elt.appendChild(delim_elt)
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args", display:"inline-block", "margin-right":"2px"})
        always_rel.appendChild(block_args_elt)
        params = (params ? params : this.params)
        if(Array.isArray(params)){
            for(let i = 0; i < params.length; i++){
                let param_name_val_array = params[i]
                let param_name = param_name_val_array[0]
                let param_name_elt     = Root.jsdb.identifier.make_dom_elt(undefined, undefined, param_name)
                let param_val          = param_name_val_array[1]
                let param_val_elt
                let name_is_editable_string = true
                let between_name_and_val = "="
                if(is_literal_object(param_val)) {
                    if(param_name == "") {
                        param_name_elt = ""
                        name_is_editable_string = false //if param_name is "", then no param name will be dispalyed so need to set editable to false
                        between_name_and_val = "" //so no equal sign will be shown
                    }
                    param_val_elt =  Root.jsdb.literal.object.make_dom_elt(undefined, undefined, param_val, "=")
                }
                else {
                    param_val_elt = Root.jsdb.value_to_block(param_val)
                }
                let suffix_char        = ((i == (params.length - 1)) ? "" : ",")
                let param_arg_name_val = make_arg_name_val(param_name_elt, param_val_elt,  name_is_editable_string, between_name_and_val, suffix_char)
                block_args_elt.append(param_arg_name_val)
            }
        }
        else {
            let names = Object.keys(params)
            let last_name = last(names)
            for(let param_name of names){
                let param_name_elt     = Root.jsdb.identifier.make_dom_elt(undefined, undefined, param_name)
                let param_val          = params[param_name]
                let param_val_elt      = Root.jsdb.value_to_block(param_val)
                let suffix_char        = ((param_name == last_name) ? "" : ",")
                let param_arg_name_val = make_arg_name_val(param_name_elt, param_val_elt,  true, "=", suffix_char)
                block_args_elt.append(param_arg_name_val)
            }
        }
        delim_elt = make_delimiter_drop_zone(")")
        delim_elt.style["margin-left"]  = "3px" //with an empty array, the [] brackets are too close to one another
        block_args_elt.append(delim_elt)
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel    = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args    = dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals = html_db.dom_elt_children_of_class(block_args, "arg_name_val")
        let result = "("
        let on_first = true
        for (let arg_name_val of arg_name_vals){
            let arg_name  = dom_elt_child_of_class(arg_name_val, "arg_name") //will be undefiend when have function foo({a=2, b=3}){}
            let arg_val   = dom_elt_child_of_class(arg_name_val, "arg_val")
            let name_src
            let between_name_and_value
            if(arg_name) {
                name_src  = block_to_js(arg_name)
                between_name_and_value = "="
            }
            else { //as when we have a big keyword lit obj
                name_src = ""
                between_name_and_value = ""
            }
            let val_src   = block_to_js(arg_val)
            if (!on_first) { result += ", "}
            result += name_src
            if (val_src !== "undefined") { result += between_name_and_value + val_src }
            on_first = false
        }
        return result + ")"
    },
    click_help_string(block_elt){
        return ["The parameters of a function definition are enclosed in parens.<br/>" +
                "Each parameter has a name and a default value."]
    }
})
newObject({prototype: Root.jsdb,
    name:           "function",
    display_label:  "function definition", //used only for the block types menu.
    category:       Root.BlockCategory.Misc,
    name_arg:       "",
    params_arg:     Root.jsdb.function_params,
    body_arg:       Root.jsdb.code_body,
    is_generator:  false,

    constructor: function(){
        this.callPrototypeConstructor()
    },
    //arg_vals are the blocks in the code_body, expr is wrapped in static parens
    make_dom_elt: function(x, y, name_arg, params_arg, body_arg, is_generator){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                left: x + "px",
                top:  y + "px",
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(),
                onclick: "select_block(event)"
            },
            always_rel
        )
        result.style.paddingLeft = "10px"
        is_generator = ((is_generator === undefined) ? this.is_generator : is_generator)
        let operation = (is_generator ? "function*" : "function")
        let block_name_elt = Root.jsdb.one_of.make_dom_elt(undefined, undefined,
                                 operation,
                                 ["function&nbsp;&nbsp;&nbsp;(define function)", "function*&nbsp;(define generator)"],
                                 false,
                                 80)
                                         //make_dom_elt("div", {class:"block_name"}, "function")
        block_name_elt.classList.remove("block-absolute")
        always_rel.appendChild(block_name_elt)
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)

        name_arg = (name_arg ? name_arg : this.name_arg)
        if (typeof(name_arg) == "string") { name_arg = Root.jsdb.identifier.make_dom_elt(undefined, undefined, name_arg) }
        let name_arg_name_val_elt = make_arg_name_val("", name_arg)
        block_args_elt.appendChild(name_arg_name_val_elt)

        params_arg = Root.jsdb.param_to_block(params_arg, this.params_arg)
        block_args_elt.appendChild(make_arg_name_val("", params_arg))

        body_arg = Root.jsdb.param_to_block(body_arg, this.body_arg)
        block_args_elt.appendChild(make_arg_name_val("", body_arg))

        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel    = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args    = dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals = html_db.dom_elt_children_of_class(block_args, "arg_name_val")
        let the_one_of_function_elt = always_rel.childNodes[0]
        let fn_or_gen_string = block_to_js(the_one_of_function_elt)
        let result = fn_or_gen_string
        let fn_name_arg_name_val = arg_name_vals[0]
        let fn_name_elt = dom_elt_child_of_class(fn_name_arg_name_val, "arg_val")
        let fn_name_src = block_to_js(fn_name_elt)
        if (fn_name_src && (fn_name_src != "")){
            result += " " + fn_name_src
        }
        let params_arg_name_val = arg_name_vals[1]
        let params_elt          = dom_elt_child_of_class(params_arg_name_val, "arg_val")
        let params_src          = block_to_js(params_elt)
        result += params_src

        let body_arg_name_val = arg_name_vals[2]
        let body_elt          = dom_elt_child_of_class(body_arg_name_val, "arg_val")
        let body_src          = block_to_js(body_elt)
        result += body_src
        return result
    },
    click_help_string(block_elt){
        let always_rel    = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_args    = dom_elt_child_of_class(always_rel, "block_args")
        let the_one_of_function_elt = always_rel.childNodes[0]
        let fn_or_gen_string = block_to_js(the_one_of_function_elt)
        return fn_or_gen_string
    }

})

newObject({prototype: Root.jsdb,
    name:         "method_call",
    display_label: "function call", //can be "foo" for a global fn, or "Math.abs" for a static method
    //or "(foo).bar" for an instance method on the class foo.
    category: Root.BlockCategory.Misc,
    path_array:  [""], //single item in path which starts out empty for use by the "funciton call" block
    is_static:   false, //if jsclassname = "", this is moot.
    return_type: "any",
    params:      undefined,
    keyword_params: null, //means we don't know. if we have to take defaults from the method def.
                         //then fill this in from there.
    //category:"misc",
    constructor: function(){
        if(this != Root.jsdb.method_call){
            if(!this.hasOwnProperty("display_label") ||
                (this.display_label.length == 0)) {
                this.fill_in_display_label()
            }
        }
        this.callPrototypeConstructor() //must be after fill_in_display_label
    },
    get_method: function(){
        return value_of_path(this.path_array) //might return undefined
    },
    //expects block_elt to be a method_call elt.
    //returns undefined if the meth is undefined.
    block_elt_to_method: function(block_elt){
        let always_rel     = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = dom_elt_child_of_class(always_rel, "block_name") //a path elt
        let path_string = block_to_js(block_name_elt)
        let meth = value_of_path(path_string)
        return meth
    },
    //should not end with open paren.
    fill_in_display_label: function(){
        this.display_label = this.path_array.join(".")
    },
    //https://stackoverflow.com/questions/8389643/css-making-the-content-div-auto-size-after-the-content-within
    make_dom_elt: function(x, y, path_array, params, keyword_params=null){
        let always_rel = make_dom_elt("div", {class: "block_always_relative"})
        let result = make_dom_elt("div",
            {class:"block block-absolute",
                "background-color": this.category.color,
                id: Root.jsdb.get_next_block_id(),
                //margin_left: "10px",
                left: x + "px",
                top:  y + "px",
                "padding-left": "10px", //needed for dragging the whole meth call. Otherwise draggign the upper left will just drag that path out of the meth call.
                draggable: "true",
                "data-block-type": this.make_data_block_type_string(),
                //  ondragstart: "Root.jsdb.dragstart_handler(event)",
                onclick: "select_block(event)"
                //position: "absolute"
            },
            always_rel
        )
        path_array = (path_array ? path_array : this.path_array)
        let block_name_elt = ((is_block(path_array)) ? path_array : Root.jsdb.path.make_dom_elt(undefined, undefined, path_array)) //make_dom_elt("div",{class:"block_name"},this.display_label)
        block_name_elt.classList.remove("block-absolute")
        block_name_elt.classList.add("block_name")
        block_name_elt.style.backgroundColor   = this.category.color
        block_name_elt.style.borderTopStyle    = "none"
        block_name_elt.style.borderRightStyle  = "none"
        block_name_elt.style.borderBottomStyle = "none"
        block_name_elt.style.borderLeftStyle   = "none"
        block_name_elt.style.marginLeft        = "0px"
        //block_name_elt.style.verticalAlign   = "top" //does nothing
        block_name_elt.style.marginTop         = "0px"
        let delim_elt = make_delimiter_drop_zone("(")
        delim_elt.style.verticalAlign = "125%"
        block_name_elt.appendChild(delim_elt)
        always_rel.appendChild(block_name_elt)
        //always_rel.appendChild(make_delimiter_drop_zone("("))
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        always_rel.appendChild(block_args_elt)
        params = (params ? params : this.params)
        keyword_params = (keyword_params ? keyword_params : this.keyword_params)
        if(params) {
            if(keyword_params) {
                let param_arg_val = Root.jsdb.literal.object.make_dom_elt(undefined, undefined, params)
                let name_val_elt = make_arg_name_val("", param_val_elt)
                block_args_elt.append(name_val_elt)
            }
            else if (Array.isArray(params)){ //array of arg_name_val elts. Happens when we parse the js.
                for(let name_val_elt of params){
                    block_args_elt.append(name_val_elt)
                }
            }
            else {
                let names = Object.keys(params)
                let last_name = last(names)
                for(let param_name of names){
                    let param_name_elt = make_dom_elt("span", {class: "arg_name"}, param_name)
                    //if (param_name_elt) { block_args_elt.appendChild(param_name_elt) }
                    let param_val = params[param_name]
                    let param_val_elt
                    if(is_block(param_val))            { param_val_elt = param_val }
                    else if (param_val.isA(Root.jsdb)) { param_val_elt = param_val.make_dom_elt() }
                    else                               { param_val_elt = Root.jsdb.value_to_block(param_val) }
                    param_val_elt.classList.remove("block-absolute") //because its not absolute, and should inherit the position:relative of the always_relative wrapper in this block
                    param_val_elt.classList.add("arg_val")
                    //param_val_elt.style["margin-left"] = "10px"
                    let suffix_char = ((param_name != last_name) ? "," : "")
                    let name_val_elt = make_arg_name_val(param_name_elt, param_val_elt, false, "", suffix_char)
                    block_args_elt.append(name_val_elt)
                }
            }
        }
        else { //no params passed, so display all of them that the meth takes.
            let meth = Root.jsdb.method_call.block_elt_to_method(result) //value_of_path(path_array)
            if (meth) { // if no meth, we probably have an empty "function call" which is ok, don't set up an args for that.
                let name_val_elts = Root.jsdb.method_to_arg_name_val_elts(meth)
                for(let name_val_elt of name_val_elts){
                    block_args_elt.append(name_val_elt)
                }
            }
        }
        delim_elt = make_delimiter_drop_zone(")")
        delim_elt.style["margin-left"]  = "3px" //with an empty array, the [] brackets are too close to one another
        block_args_elt.append(delim_elt)
        always_rel.appendChild(make_resizer_elt())
        return result
    },
    to_js: function(block_elt){
        let always_rel     = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = dom_elt_child_of_class(always_rel, "block_name") //a path elt
        let block_args     = dom_elt_child_of_class(always_rel, "block_args")
        let arg_name_vals  = html_db.dom_elt_children_of_class(block_args, "arg_name_val")
        let result = block_to_js(block_name_elt)  + "("//block_name_elt.firstChild.data + "("

        let on_first = true
        for (let arg_name_val of arg_name_vals){
            let arg_val  = dom_elt_child_of_class(arg_name_val, "arg_val")
            let src = block_to_js(arg_val)
            if (!on_first) { result += ", "}
            result += src
            on_first = false
        }
        return result + ")"
    },
    click_help_string(block_elt){
        let always_rel     = dom_elt_child_of_class(block_elt, "block_always_relative")
        let block_name_elt = dom_elt_child_of_class(always_rel, "block_name")
        let src = block_to_js(block_name_elt)
        if(src == "") { return ["This is a function call with no function name.<br/>" +
                                 "Type in a variable name."] }
        else { return block_to_js(block_name_elt) }
    }
})


newObject({prototype: Root.jsdb.rword_expr_code_body,
    name:        "while",
    category:    Root.BlockCategory.Control,
    operation:   "while",
    expr:        Root.jsdb.infix.comparison,
    code_body:   undefined,
    return_type: "undefined"
})

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
    value:         undefined,
    choices:       ["null", "undefined"], //this is src code choices
    eval_each_choice: true,
    width:         57 //the widest thing we want to show is the "unde"  of "undefined".
})


Root.BlockCategory.Control.add_block_type_header("CONDITIONAL")

newObject({prototype: Root.jsdb.rword_expr_code_body,
    name:        "if",
    category:    Root.BlockCategory.Control,
    operation:   "if",
    operation_choices: ["if", "else if"],
    expr:        Root.jsdb.infix.comparison,
    return_type: "undefined"
})

newObject({prototype: Root.jsdb.rword_expr_code_body,
    name:           "elseif", //tricky because can't have space in it.
    display_label:  "else if",
    category:       Root.BlockCategory.Control,
    operation:      "else if",
    operation_choices: ["if", "else if"],
    expr:           Root.jsdb.infix.comparison,
    return_type:    "undefined"
})

newObject({prototype: Root.jsdb.rword_code_body,
    name:           "else",
    display_label:  "else",
    category:     Root.BlockCategory.Control,
    code_body:    undefined,
    return_type: "undefined"
})

newObject({prototype: Root.jsdb.one_of,
    name:          "break_continue",
    category:       Root.BlockCategory.Control,
    display_label: 'break/continue',
    //return_type:   "break", //not too useful
    choices:       ["break", "continue"], //this is src code choices
    eval_each_choice: false
    //width:         57
})


Root.BlockCategory.Control.add_block_type_header("ERROR HANDLING")

newObject({prototype: Root.jsdb.rword_code_body,
           name: "try",
           category: Root.BlockCategory.Control,
           code_body:     undefined,
           return_type: "undefined"
})

newObject({prototype: Root.jsdb.rword_expr_code_body,
            name: "catch",
            category: Root.BlockCategory.Control,
            operation: "catch",
            expr: newObject({prototype: Root.jsdb.identifier, value: "err"}),
            code_body: undefined,
            return_type: "undefined"
})

newObject({prototype: Root.jsdb.rword_code_body,
            name:       "finally",
            category:    Root.BlockCategory.Control,
            code_body:   undefined,
            return_type: "undefined"
})

newObject({prototype: Root.jsdb.method_call,
    name: "Math__abs",
    category: Root.BlockCategory.Math,
    path_array: ["Math", "abs"],
    is_static: true,
    return_type: "number",
    params: {arg0: Root.jsdb.literal.number}
})

newObject({prototype: Root.jsdb.method_call,
    name: "Math__pow",
    category: Root.BlockCategory.Math,
    path_array: ["Math", "pow"],
    is_static: true,
    return_type: "number",
    params: {arg0: Root.jsdb.literal.number, arg1: Root.jsdb.literal.number,
        arg2: Root.jsdb.literal.number, arg3: Root.jsdb.literal.number}
})

newObject({prototype: Root.jsdb.class_instance,
    superclass:null,
    name: "Job",
    jsclassname: "Job",
    category: Root.BlockCategory.Job,
    return_type: "Job",
    //params: undefined
    click_help_string: function(block_elt) { return "Job" }
})
newObject({prototype: Root.jsdb.class_instance,
    superclass:null,
    name: "Dexter",
    jsclassname: "Dexter",
    category: Root.BlockCategory.Job,
    return_type: "Dexter",
    //params: undefined
    click_help_string: function(block_elt) { return "Dexter" }
})
newObject({prototype: Root.jsdb.method_call,
    name: "Dexter__move_all_joints",
    path_array: ["Dexter", "move_all_joints"],
    is_static: true,
    category: Root.BlockCategory.Job,
    return_type: "Array",
    params: {array_of_5_angles: Root.jsdb.literal.array.array5}
})
}








