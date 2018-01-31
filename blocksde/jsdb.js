


/*an instance of one of these classes like jsdb_method
 reresents a fn, etc. ie Math.abs
   but NOT a particular call to the fn.
   That is represented by a dom elt that' a child of the_workspace elt.
   That dom elt is built with info from the corresponding jsdb instance
*/

var jsdb = class jsdb {
    static find_kind(kind_name){
        if      (kind_name == "for")  { return jsdb_for_let}
        else if (kind_name == "if")   { return jsdb_if}
        else if (kind_name == "var")  { return jsdb_var_declaration}
        else if (kind_name == "let")  { return jsdb_let_declaration}
        else {
            for(let jsdb_subclass of jsdb.subclasses){
                if (jsdb_subclass.kinds) {
                    for(let a_kind of jsdb_subclass.kinds){
                        if (a_kind.kind_name == kind_name) { return a_kind }
                    }
                }
            }
            let global_maybe = window[kind_name]
            if(global_maybe && (typeof(global_maybe) == "function")){
                return jsdb_method
            }
            else {
                global_maybe = eval(kind_name) //should work for "Math.abs" etc.
                if(global_maybe && (typeof(global_maybe) == "function")){
                    return jsdb_method
                }
                else {  console.log("shouldnt in find_kind") }
            }
        }
    }

    static find_kind_instance(kind_name){
        let kind = jsdb.find_kind(kind_name)
        debugger
        if(kind) {
            if(kind instanceof jsdb_method) {
                let meth_name = kind_name
                let class_name = ""
                if (meth_name.includes(".")) {
                    let class_and_meth_name = kind_name.split(".")
                    class_name = class_and_meth_name[0]
                    meth_name = class_and_meth_name[1]
                }
                return new kind({jsclassname: class_name,
                                 methodname: meth_name,
                                 is_static: true})
            }
            else { new kind() }
        }
        else { console.log("couldnt find kind in find_kind_instance: " + kind_name) }
    }
}

jsdb_param = class jsdb_param extends jsdb{
    constructor({name    = "required",
                    type    = "any",
                    value   = "required",
                    min     = -Infinity,
                    max     = Infinity,
                    subtype = null, //could be "integer"
                    is_rest = false
                }){
        super();
        this.name = name
        this.type = type //"null", "undefined", "boolean", "number" "array", "object"
        this.value
        this.min  = min  //for type array, this is min length
        this.max  = max  //for type array, this is max length
        this.subtype = subtype //ie "integer"
        is_rest   = is_rest
        jsdb_param.kinds.push(this)
    }
}
jsdb_param.kinds = []

function jsdb_auto_make_params(fn){
    let names_and_defaults_array = function_param_names_and_defaults(fn)
    let result = []
    for(let nd of names_and_defaults_array){
        let par = new jsdb_param({name:  nd[0],
            value: nd[1]
        })
        result.push(par)
    }
}

var jsdb_method = class jsdb_method extends jsdb{
    constructor({jsclassname   = "", //if "", no class
                 methodname  = "required",
                 is_static   = false, //if jsclassname = "", this is moot.
                 return_type = "any",
                 params      = "auto",
                 category    = "misc"
                }){
        super();
        if (params == "auto") {
            let cla = window[jsclassname]
            let meth = null
            if (cla) { meth = cla[methodname] }
            else     { meth = window[methodname] }
            if (meth) { params = jsdb_auto_make_params(meth) }
            else { params = [] }
        }
        if ((category == "misc") && (jsclassname == "Math")) { category = "Math" }

        this.jsclassname   = jsclassname
        this.methodname  = methodname
        this.return_type = return_type
        this.params      = params
        this.category    = category
        this.kind_name   = jsclassname + "." + methodname
        jsdb_method.kinds.push(this)
    }
    display_label(){ //for display in the items of a category menu
        let result = ""
        if(this.jsclassname != "") { result = this.jsclassname + "." }
        result += this.methodname + "()"
        return result
    }
    make_html(){
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
    }
    make_dom_elt(){
        let result = make_dom_elt("div",
                                  {class:"block"},
                                   make_dom_elt("div", {class:"block_name"}, this.methodname))
        let block_args_elt = make_dom_elt("div", {class:"block_args"})
        result.appendChild(block_args_elt)
        for(let param of this.params){
            let param_elt =
             make_dom_elt("label", {class:"arg_name_val"},
                           [make_dom_elt("span", {class:"arg_name"}, param.name),
                            make_dom_elt("input", {class:"arg_val", value:param.value})
                            ])
            block_args_elt.appendChild(param_elt)
        }
        result.appendChild(make_dom_elt("div", {},
                            [make_dom_elt("div", {class:"toggle_horiz_vert",
                                                  onclick:"toggle_horiz_vert(event)"}),
                             make_dom_elt("div", {class:"toggle_expand_collapse",
                                                  onclick:"toggle_expand_collapse(event)"})
                            ]))
        return result
    }
}

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
jsdb.subclasses = [jsdb_method, jsdb_infix_op, jsdb_prefix_op, jsdb_var_declaration, jsdb_let_declaration, jsdb_for_var, jsdb_for_let, jsdb_if]
//instances
Root.BlockCategory.Math.add_block_type(
    new jsdb_method({jsclassname: "Math",
                     methodname: "abs",
                     is_static: true,
                     return_type: "number",
                     params: new jsdb_param({name: "num", value:0, type: "number"})})
)

