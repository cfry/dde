/* Why Futures
Automatic garbage collection wins because it frees the programmer from having to worry about
memory management.
Futues win becuase it frees the programmer from having to worry about serial vs parallel in
optimizing the performance of their algorithm. The program just runs
as parallel as it can, very little extra work for programmer.
Programmer also doesn't have to deal with callback hell or even promises/async/await
which interact poorly (to say hte least) with normal callstack return of values.
 */
globalThis.ActEval = class ActEval{
    static string_to_ast(source){ //same as JS2B.string_to_ast
        if (source[0] == "{") { //esprima doesn't like so hack it
            let new_src = "var foo947 = " + source
            let st = Espree.parse(new_src, {range: true,
                                                    loc: true,
                                                    ecmaVersion: 7 //Chrome 105 (sept 2022) supports ES7 and probably more
            })
            let new_st = st.body[0].declarations[0].init
            return new_st
        }
        else {
            return Espree.parse(source, {range: true, loc: true, ecmaVersion: 7})
        }
    }

    static last_read_source = null

    static read_eval(source){
        let st = ActEval.string_to_ast(source)
        let lex_env = {}
        this.eval(st,
                  lex_env,
                  out,
                  source) ///continuation
    }

    //returns an array of block_elts (but might be only 1 long).
    static eval(st, //st === ast === abstract_syntax_tree
                lex_env,
                cont=out, //continuation. A fn of one arg.
                source
    ){
        try {
            let switcher = st.type
            /*switch(switcher) {
                case "ObjectExpression": return  this[switcher].call(this, st, lex_env, cont);
                case "Program":          return  this[switcher].call(this, st, lex_env, cont);
                default: shouldnt("Can't handle exprima type: " + switcher)
            }*/
            this[switcher].call(this, st, lex_env, cont, source)
        }
        catch(err){
            dde_error("Could not convert JavaScript to ast: " + err.message)
        }
    }
    static Program(st, lex_env, cont, source){
        let switcher = st.sourceType
        switch(switcher) {
            case "module": dde_error("unimplemented: JS2B module");
            case "script": {
                let result = []
                for(let part of st.body) { //expect multiple top level parts.
                    result.push(this[switcher].call(this, part, lex_env, cont, source))
                }
                return result
            }
            default: shouldnt("Can't handle exprima switcher: " + switcher)
        }
    }

    static script(st, lex_env, cont, source){
        let switcher = st.type
        switch(switcher){
            case "BlockStatement":      return this[switcher].call(this, st, lex_env, cont, source);
            case "ExpressionStatement": return this[switcher].call(this, st, lex_env, cont, source);
            case "ForStatement":        return this[switcher].call(this, st, lex_env, cont, source);
            case "ForOfStatement":      return this[switcher].call(this, st, lex_env, cont, source);
            case "FunctionDeclaration": return this[switcher].call(this, st, lex_env, cont, source);
            case "IfStatement":         return this[switcher].call(this, st, lex_env, cont, source);
            case "TryStatement":        return this[switcher].call(this, st, lex_env, cont, source);
            case "VariableDeclaration": return this[switcher].call(this, st, lex_env, cont, source);
            case "WhileStatement":      return this[switcher].call(this, st, lex_env, cont, source);

            default: shouldnt("Can't handle exprima switcher: " + switcher)
        }
    }
    static BlockStatement(st, lex_env, cont, source){
        let result = undefined
        for(let a_st of st.body){
            let new_cont
            if(a_st.type === "ReturnStatement") {
                new_cont = function (elt_val) {
                    result = elt_val //result closed over
                }
            }
            else { new_cont = cont}
            this.eval(a_st,
                      lex_env,
                      new_cont,
                      source)
        }
        if(cont && result) {
            cont.call(null, result)
        }
    }


    static ExpressionStatement(st, lex_env, cont, source){
        let part = st.expression
        let switcher = part.type
        switch(switcher){
            case "ArrayExpression":      return this[switcher].call(this, part, lex_env, cont, source)
            case "AssignmentExpression": return this[switcher].call(this, part, lex_env, cont, source)
            case "BinaryExpression":     return this[switcher].call(this, part, lex_env, cont, source)
            case "CallExpression":       return this[switcher].call(this, part, lex_env, cont, source)
            case "Identifier":           return this[switcher].call(this, part, lex_env, cont, source)
            case "Literal":              return this[switcher].call(this, part, lex_env, cont, source)
            case "LogicalExpression":    return this[switcher].call(this, part, lex_env, cont, source)
            case "MemberExpression":     return this[switcher].call(this, part, lex_env, cont, source)
            //when we have a path like foo.bar.baz, st.type == "MemberExpression"
            //it will have 2 important "parts"
            // "object" the val of object will have type "MemberExpression"
            // and itself have an "object" prop that has type Identifier with name "foo"
            //              and "property" prop that has type Identifier with name "bar"
            // "property". whose val will be of type Identifier with a name == "baz".
            //note its the LAST name in foo.bar.baz.
            //whereas the "object" encompasses all path elts except the last name, ie foo.bar

            case "NewExpression":        return this[switcher].call(this, part, lex_env, cont, source);
            case "ReturnStatement":      return this[switcher].call(this, part, lex_env, cont, source);
            case "TemplateLiteral":      return this[switcher].call(this, part, lex_env, cont, source);
            case "UnaryExpression":      return this[switcher].call(this, part, lex_env, cont, source);
            case "UpdateExpression":     return JS2B[switcher].call(this, part, lex_env, cont, source);
            case "YieldExpression":      return this[switcher].call(this, part, lex_env, cont, source);
            default: shouldnt("Can't handle exprima switcher: " + switcher)
        }
    }

    static ForStatement(st){
        let init   = JS2B[st.init.type].call(undefined, st.init);
        let test   = JS2B[st.test.type].call(undefined, st.test);
        let update = JS2B[st.update.type].call(undefined, st.update);
        let body   = JS2B[st.body.type].call(undefined, st.body);
        return Root.jsdb.for.for_iter.make_dom_elt(undefined, undefined, init, test, update, body)
    }

    static ForOfStatement(st){
        let left   = JS2B[st.left.type].call(undefined, st.left);
        //but have to remove the init val and equal sign of the declaration
        if (dom_elt_block_type(left).isA(Root.jsdb.assignment)) {
            Root.jsdb.assignment.remove_init_val(left)
        }
        let of_elt = newObject({prototype: Root.jsdb.one_of,
            choices: ["of", "in"],
            value: "of",
            eval_each_choice: false,
        })
        let right  = JS2B[st.right.type].call(undefined, st.right);
        let body   = JS2B[st.body.type].call(undefined, st.body);
        return Root.jsdb.for.for_of.make_dom_elt(undefined, undefined, left, of_elt, right, body)
    }

    static WhileStatement(st){
        let test_elt   = JS2B[st.test.type].call(undefined, st.test);
        let body_elt   = JS2B[st.body.type].call(undefined, st.body);
        return Root.jsdb.rword_expr_code_body.while.make_dom_elt(undefined, undefined, test_elt, body_elt)
    }

    static ArrayExpression(st, lex_env, cont, source){
        let result_arr = []
        for(let a_st of st.elements){
            this.eval(a_st, lex_env, function(val) {result_arr.push(val)}, source )
        }
        cont.call(null, result_arr)
    }

    static AssignmentExpression(st, lex_env, cont, source){
        let right_val
        this.eval(st.right, lex_env, function(val){ right_val = val}, source)
        if(st.left.type === "Identifier") {
            let name_string = st.left.name
            if (lex_env.hasOwnProperty(name_string)) {
                lex_env[name_string] = right_val
            } else {
                globalThis[name_string] = right_val
            }
        }
        else if(st.left.type === "MemberExpression") {
            let object_st = st.left.object
            let obj_val
            this.eval(object_st,
                      lex_env,
                      function(val) {
                              obj_val = val},
                      source)
            let property_st = st.left.property
            if(property_st.type === "Identifier") {
                obj_val[property_st.name] = right_val
            }
            else {
                shouldnt("ActEval.eval AssignmentExpression left side needs work.")
            }
        }
    }

    static BinaryExpression(st, lex_env, cont, source){
        let operator_string = st.operator
        let left_val
        let right_val
        this.eval(st.left,  lex_env, function(val){ left_val  = val}, source)
        this.eval(st.right, lex_env, function(val){ right_val = val}, source)
        let rock_bottom_source = left_val.toString() + operator_string + right_val.toString()
        if(Future.contains_future(left_val, right_val)){
            Future.make(function(){
                                let result = globalThis.eval(rock_bottom_source)
                                cont.call(null, result)
            })
        }
        else{
            //have to do toString and eval because no way to CALL an infix operator in JS.
            let result = globalThis.eval(rock_bottom_source)
            cont.call(null, result)
        }
    }

    static LogicalExpression(st){ return this.BinaryExpression(st) }

    /*static get_src(st) {
        this.last_read_source.substring(st.range[0], st.range[1])
        /* let switcher = st.type
         if      (switcher == "Identifier") { return st.name }
         else if (switcher == "MemberExpression") {
             return this.get_src(st.object) +  "." + this.get_src(st.property)
         }
     }
      this grabs all the possible params from the fn def of the fn call
        and supplies ALL of them in the output block (with default vals),
        not just the ones passed. BUT
       doesn't handle keyworded fns properly.
    */
    static get_src(st, source) {
         return source.substring(st.range[0], st.range[1])
    }

    //this does not add non passed args with their default vals
    // the new def
    static CallExpression(st, lex_env, cont, source) {
        let callee = st.callee //could be a single Identifier or could be MemberExpression when its a path
        let callee_type = callee.type //callee_type not bound due to a bug in Chrome
        //let meth_block   = this[callee_type].call(this, callee) //might be a path, or a single "Literal" identifier
        let meth_name = callee.name
        let meth = value_of_path(meth_name)
        let param_arrays = null
        if (meth) {
            param_arrays = Utils.function_param_names_and_defaults_array(meth)
        }
        //Process Args
        let new_lex_env = {}
        for (let i = 0; i < st.arguments.length; i++) {
            let arg_name = param_arrays[i][0]
            let arg_st = st.arguments[i]
            this.eval(arg_st,
                       lex_env,
                  function (arg_val) {
                               new_lex_env[arg_name] = arg_val},
                       source)
        }

        //Process Body
        let meth_def_src = meth.toString()
        let meth_def_ast = this.string_to_ast(meth_def_src)
        let body_top_level_expressions = meth_def_ast.body[0].body.body
        let result = undefined
        let regular_cont = function (elt_val) {
                              result_arr.push(elt_val)}
        let return_cont  = function(elt_val){
            result = elt_val //result closed over
        }
        for (let top_level_expr of body_top_level_expressions) {
            //let expr_type = top_level_expr.type.toString() //fails due to bug in Chrome
            this.eval(top_level_expr,
                      new_lex_env,
                      ((top_level_expr.type === "ReturnStatement") ? return_cont : regular_cont),
                       source
                      )
        }
        cont.call(null, result)
        //inspect(meth_def_ast)
    }

    static FunctionDeclaration(st, lex_env, cont, source){
        let src = this.get_src(st, source)
        let result = globalThis.eval(src)
        cont.call(null, result)
    }
    /*let fn_name = "" //used in annoymous fn defs
    if (st.id) { fn_name = st.id.name }
    //else {} //handles annoymous fn defs.
    let param_arg_name_vals = [] //an array of arrays. Each inner array has the param name and the default val block elt.
    for(let param_st of st.params) {
        let param_name
        let param_val
        if (param_st.type == "Identifier"){
            param_name = param_st.name
            param_val = Root.jsdb.one_of.null_undefined.make_dom_elt(undefined, undefined, undefined)
        }
        else if(param_st.type == "AssignmentPattern"){
            param_name = param_st.left.name
            param_val = JS2B[param_st.right.type].call(undefined, param_st.right)
        }
        else if (param_st.type == "ObjectPattern"){ //happens when function foo ({a=1, b=2})
            param_name = ""
            param_val = {}
            for(let prop of param_st.properties){
                let prop_assign_pat = prop.value
                let prop_name = prop_assign_pat.left.name
                let prop_val_block_elt = JS2B[prop_assign_pat.right.type].call(undefined, prop_assign_pat.right)
                param_val[prop_name] = prop_val_block_elt
            }
        }
        else {
            shouldnt("FunctionDexlaration for: " + fn_name + " got unhandled param type of: " + param_st.type)
        }
        param_arg_name_vals.push([param_name, param_val])
    }
    let params_block_elt = Root.jsdb.function_params.make_dom_elt(undefined, undefined, param_arg_name_vals)
    let body_st = st.body
    let body_block_elt = JS2B[body_st.type].call(undefined, body_st)
    let is_generator = st.generator
    return Root.jsdb.function.make_dom_elt(undefined, undefined, fn_name, params_block_elt, body_block_elt, is_generator)
}*/

    static FunctionExpression(st, operation="if"){
        return JS2B.FunctionDeclaration.call(undefined, st)
    }

    /*let fn_name = "" //used in annoymous fn defs
    if (st.id) { fn_name = st.id.name }
    //else {} //handles annoymous fn defs.
    let param_arg_name_vals = [] //an array of arrays. Each inner array has the param name and the default val block elt.
    for(let param_st of st.params) {
        let param_name
        let param_val
        if (param_st.type == "Identifier"){
            param_name = param_st.name
            param_val = Root.jsdb.one_of.null_undefined.make_dom_elt(undefined, undefined, undefined)
        }
        else if(param_st.type == "AssignmentPattern"){
            param_name = param_st.left.name
            param_val = JS2B[param_st.right.type].call(undefined, param_st.right)
        }
        else if (param_st.type == "ObjectPattern"){ //happens when function foo ({a=1, b=2})
            param_name = ""
            param_val = {}
            for(let prop of param_st.properties){
                let prop_assign_pat = prop.value
                let prop_name = prop_assign_pat.left.name
                let prop_val_block_elt = JS2B[prop_assign_pat.right.type].call(undefined, prop_assign_pat.right)
                param_val[prop_name] = prop_val_block_elt
            }
        }
        else {
            shouldnt("FunctionDexlaration for: " + fn_name + " got unhandled param type of: " + param_st.type)
        }
        param_arg_name_vals.push([param_name, param_val])
    }
    let params_block_elt = Root.jsdb.function_params.make_dom_elt(undefined, undefined, param_arg_name_vals)
    let body_st = st.body
    let body_block_elt = JS2B[body_st.type].call(undefined, body_st)
    let is_generator = st.generator
    return Root.jsdb.function.make_dom_elt(undefined, undefined, fn_name, params_block_elt, body_block_elt, is_generator)
}*/

    static Identifier(st, lex_env, cont, source){
        let name = st.name
        let val  = lex_env[name]
        if(val === undefined) {
            val = globalThis[name]
        }
        cont.call(null, val)
    }

    //always returns an array of block elts
    static IfStatement(st, lex_env, cont, source){
        let test_st = st.test
        let action_st = st.consequent
        let alternatve_st = st.alternate
        let test_result
        this.eval(test_st, lex_env, function(val) { test_result = val })
        if(test_result) {
            this.eval(action_st, lex_env,
                     null,
                      source) //JS IF doesn't return a value
        }
    }

    static Literal(st, lex_env, cont, source){
        cont.call(null, st.value)
    }

    //called for paths
    static MemberExpression(st, lex_env, cont, source){
        let obj_st = st.object
        let obj_val
        this.eval(obj_st,
                  lex_env,
                  function(val) { obj_val = val},
                  source)
        let prop_st = st.property
        if(prop_st.type === "Identifier"){
            let result = obj_val[prop_st.name]
            cont.call(null, result)
        }
        else {
            shouldnt("ActEval.MemberExpression got unhandled property type: " + prop_st.type)
        }
    }

    static NewExpression(st) {
        let jsclassname = st.callee.name // a string like "Job"
        let args = st.arguments //an array
        let arg_blocks = []
        for (let arg of args) {
            let switcher = arg.type
            let arg_block = JS2B[switcher].call(undefined, arg) //in the case of new Job,
            //the first arg_block will be a lit_obj block containing the 14 name-val pairs of
            //a job's props.
            arg_blocks.push(arg_block)
        }
        //in the case of a Job, arg_blocks will be an array of one elt, a lit_obj block
        let the_block_type = Root.jsdb.class_instance
        if (Root.jsdb.class_instance.hasOwnProperty(jsclassname)) { //hits when jsclassname is "Job"
            the_block_type = Root.jsdb.class_instance[jsclassname] //needed to get the category prop out of the Job newobject.
        }
        let result_block = the_block_type.make_dom_elt(undefined, undefined, jsclassname, arg_blocks)
        return result_block
    }

    static ObjectExpression(st){
        let name_val_block_elt_lit_obj = {} //names of strings, vals of actual block elts
        for(let prop of st.properties){
            let key = prop.key //typically (at least) identifier
            let name
            if (key.type == "Identifier") { name = key.name }
                //the below turn into strings anyway, so no utility in giving them real values.
                //but I do speical case these strings in Root.jsdb.literal.object.make_dom_elt
                //if      (key.name == "null")  { name = null }
                //else if (key.name == "true")  { name = true }
                // else if (key.name == "false") { name = false }
            // else                          { name = key.name } // a string

            else if (key.type == "Literal") { name = key.value } //works for strings a la "a str" and numbers.
            //let key_block_elt = JS2B[key.type].call(undefined, key)
            let val = prop.value
            let value_block_elt = JS2B[val.type].call(undefined, val)
            name_val_block_elt_lit_obj[name] = value_block_elt
        }
        let lit_obj_block = Root.jsdb.literal.object.make_dom_elt(undefined, undefined, name_val_block_elt_lit_obj)
        return lit_obj_block
    }

    static TryStatement(st){
        let block_st = st.block
        let block_elt = JS2B[block_st.type].call(undefined, block_st)
        let try_elt = Root.jsdb.rword_code_body.try.make_dom_elt(undefined, undefined, block_elt)
        let result = [try_elt]
        if(st.handler) {
            let catch_elt = JS2B.CatchClause(st.handler)
            result.push(catch_elt)
        }
        if (st.finalizer) {
            let inner_elt = JS2B[st.finalizer.type].call(undefined, st.finalizer)
            let finally_elt = Root.jsdb.rword_code_body.finally.make_dom_elt(undefined, undefined, inner_elt)
            result.push(finally_elt)
        }
        return result
    }

    static CatchClause(st){
        let param_elt = JS2B[st.param.type].call(undefined, st.param)
        let body_elt  = JS2B[st.body.type].call(undefined, st.body)
        let catch_elt = Root.jsdb.rword_expr_code_body.catch.make_dom_elt(undefined, undefined, "catch", param_elt, body_elt)
        return catch_elt
    }
    /*   let test_elt = JS2B[test.type].call(undefined, test)
       let consequent = st.consequent
       let consequent_elt = JS2B[consequent.type].call(undefined, consequent)
       let one_clause
       if(operation == "if") {
           one_clause = [Root.jsdb.rword_expr_code_body.if.make_dom_elt(undefined, undefined, operation, test_elt, consequent_elt)]
       }
       else { //operation is "else if"
           one_clause = [Root.jsdb.rword_expr_code_body.elseif.make_dom_elt(undefined, undefined, operation, test_elt, consequent_elt)]
       }
       if(st.alternate) {
           if(st.alternate.type == "IfStatement") { //alternate is an "else if"
               return one_clause.concat(JS2B.IfStatement(st.alternate, "else if"))
           }
           else { //alternate is a "else". usually st.alternative.type is ExpressionStatement
               let bod_block_elt = JS2B[st.alternate.type].call(undefined, st.alternate)
               let block_elt = Root.jsdb.rword_code_body.else.make_dom_elt(undefined, undefined, bod_block_elt)
               one_clause.push(block_elt)
               return one_clause
           }
       }
       else { return one_clause }
   }*/

    static ReturnStatement(st, lex_env, cont, source){
        let arg = st.argument
        this.eval(arg, lex_env, cont, source)
    }

    static ThisExpression(st){
        return Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, "this")
    }

    static TemplateLiteral(st){
        let part = st.quasis[0].value.raw
        let quote_char = "`"
        return Root.jsdb.literal.string.make_dom_elt(undefined, undefined, part, quote_char)
    }

    // ie:  -23  is a Unary Expression, delete is a unary expression.
    static UnaryExpression(st){
        let op = st.operator
        switch(op){
            case "delete":
                let arg_type = st.argument.type
                let expr_block  = JS2B[arg_type].call(undefined, st.argument)
                return Root.jsdb.rword_expr.delete.make_dom_elt(undefined, undefined, "delete", expr_block, null)
            case "-":
                let arg = st.argument
                if ((arg.type = "Literal") && (typeof(arg.value) == "number")){ //we've got a neg number
                    return Root.jsdb.literal.number.make_dom_elt(undefined, undefined, - arg.value)
                }
                else {
                    return JS2B.UpdateExpression(st)
                }
            default:
                return JS2B.UpdateExpression(st) //works for -23  but neg lit numbs treated above
        }
    }

    static UpdateExpression(st){
        let operator_string = st.operator
        let arg = JS2B[st.argument.type].call(undefined, st.argument)
        let is_prefix = st.prefix  // true if we have ++i,  false if we have i++
        if(is_prefix) {
            return Root.jsdb.identifiers_prefix.make_dom_elt(undefined, undefined, arg, operator_string)
        }
        else {
            return Root.jsdb.identifiers_postfix.make_dom_elt(undefined, undefined, arg, operator_string)
        }
    }

    static VariableDeclaration(st, lex_env, cont, source){
        let array_of_VariableDeclarator = st.declarations
        let kind = st.kind //"var" or "let". see AssignmentExpression for kind == ""
        for(let vdr of array_of_VariableDeclarator){
            let var_name = vdr.id.name
            let val_st =  vdr.init
            this.eval(val_st,
                      lex_env,
                      function(var_val) {
                              lex_env[var_name] = var_val},
                     source)
        }
        //dont call cont
    }

    static VariableDeclarator(st, kind="var"){ //kind can also be "let"
        let name_string = st.id.name
        let initial_value_st = st.init
        let initial_value_block
        if (initial_value_st === null) {
            // inititial_value_st = undefined  //not used
            initial_value_block = Root.jsdb.one_of.null_undefined.make_dom_elt(undefined, undefined, "undefined")
        }
        else { initial_value_block = JS2B[initial_value_st.type].call(undefined, initial_value_st) }
        return Root.jsdb.assignment.make_dom_elt(undefined, undefined, kind, name_string, initial_value_block)
    }

    static YieldExpression(st){
        let arg = st.argument
        let operation = (st.delegate ? "yield*" : "yield")
        let arg_block = JS2B[arg.type].call(undefined, arg)
        return Root.jsdb.rword_expr.make_dom_elt(undefined, undefined, operation, arg_block)
    }
}
