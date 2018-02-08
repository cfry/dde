/*an instance of one of these classes like jsdb_method
 reresents a fn, etc. ie Math.abs
   but NOT a particular call to the fn.
   That is represented by a dom elt that' a child of Workspace.inst elt.
   That dom elt is built with info from the corresponding jsdb objet
   thatrepresents the block_type.
*/

newObject({name:    "jsdb_param",
           jstype:  "any",
           value:   "required", //the default value or "required"
           is_rest: false,
           auto_make_params: function(fn){
              let names_and_defaults_array = function_param_names_and_defaults(fn)
              let result = []
              for(let nd of names_and_defaults_array){
                 let par = new jsdb_param({name:  nd[0], value: nd[1]})
                 result.push(par)
              }
              return result
           },
           all_params_to_js(block_elt){
               let block_args_elt = dom_elt_child_of_class(block_elt, "block_args")
               //let arg_vals = args_elt.querySelectorAll(".arg_val") //gets all arg_val etls below, but we want just the first level
               let result = ""
               debugger
               let block_args_elt_children = block_args_elt.children
               for(let i=0; i < block_args_elt_children.length; i++){
                   let arg_name_val = block_args_elt_children[i]
                   let arg_val_elt = dom_elt_child_of_class(arg_name_val, "arg_val") //warning will be null if arg_val_elt is a comma
                   if (arg_name_val.classList.contains("comma")){ result += ", " }
                   else if(arg_val_elt.tagName == "INPUT") {
                        if(arg_val_elt.type == "checkbox") { result += arg_val_elt.checked }
                        else { result += arg_val_elt.value }
                   }
                   else if(arg_val_elt.tagName == "SELECT") {
                       result += arg_val_elt.value
                   }
                   else if (arg_val_elt.classList.contains("block")){
                       let bt = dom_elt_block_type(arg_val_elt)
                       result += bt.to_js(arg_val_elt)
                   }
                   else { shouldnt("in all_params_to_js with invalid arg_val_elt: " + arg_val_elt) }
                   //if (i < (args_elt_children.length - 1)) { //i.e. we're NOT on the last arg
                   //    result += ", "
                   //}
               }
               return result
           },
           make_input_elt(){
               return make_dom_elt("input",
                                  {class:"arg_val",
                                   type: "text", //general purpose but generally overridden bu subobjects
                                   width: 80 + "px",
                                   value:param.value,
                                   ondragenter:"enter_drop_target(event)",
                                   ondragleave:"leave_drop_target(event)"})
           }
})



newObject({prototype: Root.jsdb_param,
    name: "boolean",
    display_label: "",
    value: false,
    make_input_elt: function(){
        return make_dom_elt("input",
            {class:"arg_val",
                type: "checkbox", //general purpose but generally overridden bu subobjects
                width: 5 + "px", //if its smaller, the cursor over the checkbox isn't always an array, preventing you from clicking the checkbox
                value:false,
                ondragenter:"enter_drop_target(event)",
                ondragleave:"leave_drop_target(event)"})
    }

})

newObject({prototype: Root.jsdb_param,
    name: "string",
    display_label: "",
    value: false,
    make_input_elt: function(){
        return make_dom_elt("input",
            {class:"arg_val",
                type: "text", //general purpose but generally overridden bu subobjects
                width: 80 + "px",
                value:"",
                ondragenter:"enter_drop_target(event)",
                ondragleave:"leave_drop_target(event)"})
    }

})

newObject({prototype: Root.jsdb_param,
    name: "number",
    display_label: "",
    value: 0, //a default value. Axtual value is stored in the dom_elt
    min: -Infinity,
    max: Infinity,
    make_input_elt: function(){
        return make_dom_elt("input",
            {class:"arg_val",
                type: "number",
                width: 60 + "px",
                "margin-left": "0px",
                value: this.value,
                ondragenter:"enter_drop_target(event)",
                ondragleave:"leave_drop_target(event)"})
    }
})

newObject({prototype: Root.jsdb_param,
    name: "one_of",
    display_label: "",
    value: "",
    choices: ["one", "two"],
    make_input_elt: function(){
        let inner_elts = []
        for(let choice of this.choices){
            inner_elts.push(make_dom_elt("option", {}, choice))
        }
        return make_dom_elt("select",
                            {class:"arg_val",
                             width: 80 + "px", //at 70, the last letter of "undefined" is cut off.
                             value: this.choices[0],
                             ondragenter:"enter_drop_target(event)",
                             ondragleave:"leave_drop_target(event)"},
            inner_elts)
    }
})

newObject({prototype: Root.jsdb_param,
    name: "array",
    display_label: "",
    value: [],
    make_input_elt: function(){ return null }
})


//_______JSDB______________
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
    make_and_draw_block: function(x=null, y=25, arg_vals=[]){
        debugger
        if (x == null) {
            x = Workspace.suck_left_margin + 100
        }
        category_menu_id.style.display   = "none"
        block_type_menu_id.style.display = "none"
        let elt = this.make_dom_elt(x, y, arg_vals)
        Workspace.inst.add_block_elt(elt)
    },

    block_counter: 0, //used as suffix to dom elt block id's.

    get_next_block_counter: function() {
        Root.jsdb.block_counter = Root.jsdb.block_counter + 1
        return Root.jsdb.block_counter
    },
    get_next_block_id: function() {
        Root.jsdb.block_counter = Root.jsdb.block_counter + 1
        return "block_" + Root.jsdb.block_counter + "_id"
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
       params:"auto",
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
                if (this.params == "auto") {
                    Root.jsdb_param.auto_make_param(this.get_method())
                }
               //this.category.add_block_type(this)
            }
       },

        get_method: function(){
             let starting = window
             if (this.jsclassname.length > 0) { starting = window[this.jsclassname] }
             let result = starting[this.methodname]
             return result //might return undefined
        },

        fill_in_display_label: function(){
            if((this.jsclassname == "") &&
               (this.methodname == "required")){
                dde_error("jsdb.method.fill_in_display_label called with empty jsclassname & methodname")
            }
            if (this.methodname.endsWith("(")) {
                this.methodname = this.methodname.substring(0, this.methodname.length - 1)
            }
            else {
                if (this.jsclassname.length > 0) {
                    if (this.is_static) { this.display_label = this.jsclassname }
                    else { this.display_label = "(" + this.jsclassname + ")" }
                    this.display_label += "."
                }
                this.display_label += this.methodname + "("
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

    /*make_html(){
        return `<div class="block">
            <div class="block_name">remainder</div>(
            <div class="block_args">
                <label class="arg_name_val"> <span class="arg_name">arg1</span>
                    <input class="arg_val"></input>,
                </label>
                <label class="arg_name_val"> <span class="arg_name">arg2</span>
                    <input class="arg_val"></input>)
                </label>
            </div>
            <div>
                <div class="toggle_horiz_vert"onclick="toggle_horiz_vert(event)"></div>
                <div class="toggle_expand_collapse" onclick="toggle_expand_collapse(event)"></div>
            </div>
        </div>`
    }*/
    make_dom_elt: function(x, y, arg_vals){
        let result = make_dom_elt("div",
                                  {class:"block block-absolute block_horiz",
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
                                   make_dom_elt("div", {class:"block_name"}, this.display_label)
                                 )
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        result.appendChild(block_args_elt)
        for(let param of this.params){
            let param_elt =
             make_dom_elt("label", {class:"arg_name_val"},
                           [make_dom_elt("span", {class:"arg_name", "vertical-align":"top"}, param.display_label),
                            make_dom_elt("input",
                                          {class:"arg_val",
                                           width: 80 + "px", //don't put on css class arg_val because wehn I drop a block in there, it needs to expand
                                           value:param.value,
                                           ondragenter:"enter_drop_target(event)",
                                           ondragleave:"leave_drop_target(event)"})
                            ])
            block_args_elt.appendChild(param_elt)
        }
        result.appendChild(make_dom_elt("div", {},
                            [make_dom_elt("div", {class:"toggle_horiz_vert",
                                                  onclick:"toggle_horiz_vert(event)"}),
                             make_dom_elt("div", {class:"toggle_expand_collapse",
                                                  onclick:"toggle_expand_collapse(event)"})
                            ]))
        make_block_horiz(result)
        return result
    },
    to_js(block_elt){
        let result = ""
        if (this.is_static) { result = this.jsclassname + "." }
        result += this.methodname
        result += "("
        result += Root.jsdb_param.all_params_to_js(block_elt)
        result += ")"
        return result
    }
})

newObject({prototype: Root.jsdb,
    name: "literal",
    display_label: "", //can be "foo" for a global fn, or "Math.abs" for a static method
                       //or "(foo).bar" for an instance method on the class foo.
    return_type:"any" ,
    make_dom_elt: function(x, y, arg_vals){
        debugger
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
            make_dom_elt("div", {class:"block_name", display:"inline-block"}, this.display_label)
        )
        //a key diff between this meth and corresponding meth for "method"
        //is the  display:"inline-block" on block-name, block_args, and arg_name_val
        //so that we have the 1 param on the top line, same line as block-name
        let block_args_elt = make_dom_elt("div", {class:"block_args block_args_collapsed"}) // display:"inline-block"})
        result.appendChild(block_args_elt)
        if(this.params.length == 1) { //excludes literal array which starts with no params
            let param = this.params[0]
            let input_elt = param.make_input_elt()
            let param_elt =
                    make_dom_elt("label", {class:"arg_name_val arg_name_val_horiz"}, //display:"inline-block"},
                        [make_dom_elt("span",  {class:"arg_name", "margin-right": "0px"}, param.display_label),
                         input_elt
                        ])
            block_args_elt.appendChild(param_elt)
        }
        else if (this.name == "array") {
            this.append_array_begin_and_end(result)
        }
        result.appendChild(make_dom_elt("div", {},
            [make_dom_elt("div", {class:"toggle_horiz_vert",
                                  onclick:"toggle_horiz_vert(event)"}),
             make_dom_elt("div", {class:"toggle_expand_collapse",
                                  onclick:"toggle_expand_collapse(event)"})
            ]))
        make_block_horiz(result)
        return result
    },

    append_array_begin_and_end: function(block_elt){
        let block_args = dom_elt_child_of_class(block_elt, "block_args")
        let begin = make_dom_elt("span",
                                {class: "array_object_delimiter",
                                    ondragenter:"enter_drop_target(event)",
                                    ondragleave:"leave_drop_target(event)"},
                                "&nbsp;[&nbsp;")
        insert_elt_before(begin, block_args)
        let end = make_dom_elt("span",
                               {class: "array_object_delimiter",
                                ondragenter:"enter_drop_target(event)",
                                ondragleave:"leave_drop_target(event)"},
                               "&nbsp;]&nbsp;")
        insert_elt_after(end, block_args)
    },

    to_js: function(elt){
        debugger
        let src = Root.jsdb_param.all_params_to_js(elt)
        if(this.name == "string"){
            if (src.includes("\n"))   { return "`" + src + "`" } //src has newline
            else if(src.includes('"')){
                if(src.includes("'")) { return "`" + src + "`" } //src has both double and single quote
                else                  { return "'" + src + "'" } //src has double quote but not single
            }
            else { return '"' + src + '"' } //src does not have double quote
        }
        else if (this.name == "array"){
            return "[" + src + "]"
        }
        else { return src } //hits for this.name == "boolean", "null_undefined" at least
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


newObject({prototype: Root.jsdb.literal,
    name: "boolean",
    category: Root.BlockCategory.Logic,
    display_label: 't/f',
    return_type: "boolean",
    params: [Root.jsdb_param.boolean]
})

newObject({prototype: Root.jsdb.literal,
    name: "number",
    category: Root.BlockCategory.Math,
    display_label: '#',
    return_type: "number",
    params: [Root.jsdb_param.number]
})

newObject({prototype: Root.jsdb.literal,
    name: "null_undefined",
    category: Root.BlockCategory.Logic,
    display_label: 'n/u',
    return_type: "null", //not too useful
    params: [newObject({prototype: Root.jsdb_param.one_of,
                        name: "null_undefined",
                        display_label:"",
                        choices:["null", "undefined"] //this is src code choices
                        })]
})

newObject({prototype: Root.jsdb.literal,
    name: "string",
    category: Root.BlockCategory.String,
    display_label: '"',
    return_type: "string",
    params: [Root.jsdb_param.string]
})

newObject({prototype: Root.jsdb.literal,
    name: "array",
    category: Root.BlockCategory.Array,
    display_label: 'Array',
    return_type: "Array",
    params: []
})

newObject({prototype: Root.jsdb.method,
    name: "Math__abs",
    category: Root.BlockCategory.Math,
    jsclassname: "Math",
    methodname: "abs",
    is_static: true,
    return_type: "number",
    params: [Root.jsdb_param.number]
})

newObject({prototype: Root.jsdb.method,
    name: "Math__pow",
    category: Root.BlockCategory.Math,
    jsclassname: "Math",
    methodname: "pow",
    is_static: true,
    return_type: "number",
    params: [Root.jsdb_param.number, Root.jsdb_param.number]
})






