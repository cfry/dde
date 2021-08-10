var esprima = require('esprima')

var JS2B = class JS2B{
  static string_to_ast(src){
      if (src[0] == "{") { //esprima doesn't like so hack it
           let new_src = "var foo947 = " + src
           let st = esprima.parse(new_src, {range: true, loc: true})
           let new_st = st.body[0].declarations[0].init
           return new_st
      }
      else {
          return esprima.parse(src, {range: true, loc: true})
      }
  }

  //returns an array of block_elts (but might be only 1 long).
  static js_to_blocks(src){
      try {
        let st = JS2B.string_to_ast(src) //esprima.parse(src, {range: true, loc: true}) //st for syntax tree.
        let switcher = st.type
        switch(switcher) {
            case "ObjectExpression": return [JS2B[switcher].call(undefined, st)]
            case "Program":          return  JS2B[switcher].call(undefined, st);
            default: shouldnt("Can't handle exprima type: " + switcher)
        }
      }
      catch(err){
          dde_error("Could not convert JavaScript to a block: " + err.message)
      }
  }
  static Program(st){
      let switcher = st.sourceType
      switch(switcher) {
          case "module": dde_error("unimplemented: JS2B module");
          case "script": {
              let result = []
              for(let part of st.body) { //expect multiple top level parts.
                  result.push(JS2B[switcher].call(undefined, part))
              }
              return result
          }
          default: shouldnt("Can't handle exprima switcher: " + switcher)
      }
  }

  static script(st){
      let switcher = st.type
      switch(switcher){
          case "BlockStatement":      return JS2B[switcher].call(undefined, st);
          case "ExpressionStatement": return JS2B[switcher].call(undefined, st);
          case "ForStatement":        return JS2B[switcher].call(undefined, st);
          case "ForOfStatement":      return JS2B[switcher].call(undefined, st);
          case "FunctionDeclaration": return JS2B[switcher].call(undefined, st);
          case "IfStatement":         return JS2B[switcher].call(undefined, st);
          case "TryStatement":        return JS2B[switcher].call(undefined, st);
          case "VariableDeclaration": return JS2B[switcher].call(undefined, st);
          case "WhileStatement":      return JS2B[switcher].call(undefined, st);

          default: shouldnt("Can't handle exprima switcher: " + switcher)
      }
  }
  static BlockStatement(st){
      let body_blocks = []
      for(let stmt of st.body){
         let a_block = JS2B[stmt.type].call(undefined, stmt);
          body_blocks.push(a_block)
      }
      return Root.jsdb.code_body.make_dom_elt(undefined, undefined, body_blocks)
  }

  static ExpressionStatement(st){
      let part = st.expression
      let switcher = part.type
      switch(switcher){
          case "ArrayExpression":      return JS2B[switcher].call(undefined, part)
          case "AssignmentExpression": return JS2B[switcher].call(undefined, part)
          case "BinaryExpression":     return JS2B[switcher].call(undefined, part)
          case "CallExpression":       return JS2B[switcher].call(undefined, part)
          case "Identifier":           return JS2B[switcher].call(undefined, part)
          case "Literal":              return JS2B[switcher].call(undefined, part)
          case "LogicalExpression":    return JS2B[switcher].call(undefined, part)
          case "MemberExpression":     return JS2B[switcher].call(undefined, part)
               //when we have a path like foo.bar.baz, st.type == "MemberExpression"
               //it will have 2 important "parts"
               // "object" the val of object will have type "MemberExpression"
               // and itself have an "object" prop that has type Identifier with name "foo"
               //              and "property" prop that has type Identifier with name "bar"
               // "property". whose val will be of type Identifier with a name == "baz".
               //note its the LAST name in foo.bar.baz.
               //whereas the "object" encompasses all path elts except the last name, ie foo.bar

          case "NewExpression":        return JS2B[switcher].call(undefined, part);
          case "ReturnStatement":      return JS2B[switcher].call(undefined, part);
          case "TemplateLiteral":      return JS2B[switcher].call(undefined, part);
          case "UnaryExpression":      return JS2B[switcher].call(undefined, part);
          case "UpdateExpression":     return JS2B[switcher].call(undefined, part);
          case "YieldExpression":      return JS2B[switcher].call(undefined, part);
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

  static ArrayExpression(st){
        let block_elts = []
        for(let elt of st.elements){
            block_elts.push(JS2B[elt.type].call(undefined, elt))
        }
        return Root.jsdb.literal.array.make_dom_elt(undefined, undefined, block_elts)
   }

  static AssignmentExpression(st){
        let name_string   = st.left.name
        let val_block_elt = JS2B[st.right.type].call(undefined, st.right)
        let result_block  = Root.jsdb.assignment.make_dom_elt(undefined, undefined, "", name_string, val_block_elt)
        return result_block
  }
  static BinaryExpression(st){
        let operator_string  = st.operator
        let left_block_elt   = JS2B[st.left.type].call(undefined, st.left)
        let right_block_elt  = JS2B[st.right.type].call(undefined, st.right)
        let infix_sub_kind   = Root.jsdb.infix.infix_sub_kind(operator_string)
        let result_block     = infix_sub_kind.make_dom_elt(undefined, undefined, left_block_elt, operator_string, right_block_elt)
        return result_block
  }

  static LogicalExpression(st){ return JS2B.BinaryExpression(st) }

  static get_src(st){
      let switcher = st.type
      if      (switcher == "Identifier") { return st.name }
      else if (switcher == "MemberExpression") {
          return JS2B.get_src(st.object) +  "." + JS2B.get_src(st.property)
      }
  }
  /* this grabs all the possible params from the fn def of the fn call
     and supplies ALL of them in the output block (with default vals),
     not just the ones passed. BUT
    doesn't handle keyworded fns properly.
 */

  //this does not add non passed args with their default vals
  // the new def
   static CallExpression(st){
      let callee   = st.callee //could be a single Identifier or could be MemberExpression when its a path
      let meth_block = JS2B[callee.type].call(undefined, callee) //might be a path, or a single "Literal" identifier
      let meth_src = JS2B.get_src(callee)
      let meth     = value_of_path(meth_src)
      let param_arrays = null
      if(meth) { param_arrays = function_param_names_and_defaults_array(meth) }
      let arg_blocks = []
      for(let i = 0; i < st.arguments.length; i++){
          let arg_ast = st.arguments[i]
          let name = "arg" + i
          if(param_arrays) {
            if (i >= param_arrays.length) { name = "Xarg" + i }
            else                          { name = param_arrays[i][0] }
          }
          let arg_st = st.arguments[i]
          let arg_val_block = JS2B[arg_st.type].call(undefined, arg_st)
          let suffix_char = ","
          if (i == (st.arguments.length - 1)) { suffix_char = "" }
          let arg_name_val_elt = make_arg_name_val(name, arg_val_block, false, "", suffix_char )
          arg_blocks.push(arg_name_val_elt)
      }
      let result = Root.jsdb.method_call.make_dom_elt(undefined, undefined, meth_block, arg_blocks)
      return result
  }

//called for paths
  static MemberExpression(st){
      let ob   = st.object
      let prop = st.property
      let ob_blocks  = JS2B[ob.type].call(undefined, ob) //could be array of block elts or just a single block_elt
      let prop_block = JS2B[prop.type].call(undefined, prop)
      if (st.computed) { prop_block = Root.jsdb.computed_path_element.make_dom_elt(undefined, undefined, prop_block) }
      let path_elt_blocks
      //if (Array.isArray(ob_blocks)) {
      //      ob_blocks.push(prop_block)
      //      path_elt_blocks = ob_blocks
      //}
      let block_type = dom_elt_block_type(ob_blocks)
      if (block_type == Root.jsdb.path){
          block_type.push_block(ob_blocks, prop_block)
          return ob_blocks
      }
      else {
          path_elt_blocks = [ob_blocks, prop_block]
          let path_block_elt = Root.jsdb.path.make_dom_elt(undefined, undefined, path_elt_blocks)
          return path_block_elt
      }
  }

  static NewExpression(st){
    let jsclassname = st.callee.name // a string like "Job"
    let args        = st.arguments //an array
    let arg_blocks  = []
    for(let arg of args){
        let switcher     = arg.type
        let arg_block    = JS2B[switcher].call(undefined, arg) //in the case of new Job,
          //the first arg_block will be a lit_obj block containing the 14 name-val pairs of
          //a job's props.
        arg_blocks.push(arg_block)
    }
    //in the case of a Job, arg_blocks will be an array of one elt, a lit_obj block
    let the_block_type = Root.jsdb.class_instance
    if(Root.jsdb.class_instance.hasOwnProperty(jsclassname)){ //hits when jsclassname is "Job"
        the_block_type = Root.jsdb.class_instance[jsclassname] //needed to get the category prop out of the Job newobject.
    }
    let result_block = the_block_type.make_dom_elt(undefined, undefined, jsclassname, arg_blocks)
    return result_block
  }

  static FunctionDeclaration(st){
      let fn_name = "" //used in annoymous fn defs
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
  }

  static FunctionExpression(st, operation="if"){
      return JS2B.FunctionDeclaration.call(undefined, st)
  }
  //always returns an array of block elts
  static IfStatement(st, operation="if"){
      let test = st.test
      let test_elt = JS2B[test.type].call(undefined, test)
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

  static VariableDeclaration(st){
      let array_of_VariableDeclarator = st.declarations
      let kind = st.kind //"var" or "let". see AssignmentExpression for kind == ""
      let result = []
      for(let vdr of array_of_VariableDeclarator){
          let block_elt = JS2B[vdr.type].call(undefined, vdr, kind)
          result.push(block_elt)
      }
      if (result.length == 1) { return result[0] }
      else { return result }
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

    static ReturnStatement(st){
        let arg = st.argument
        let operation = "return"
        let arg_block = JS2B[arg.type].call(undefined, arg)
        return Root.jsdb.rword_expr.return.make_dom_elt(undefined, undefined, operation, arg_block)
    }
    static YieldExpression(st){
        let arg = st.argument
        let operation = (st.delegate ? "yield*" : "yield")
        let arg_block = JS2B[arg.type].call(undefined, arg)
        return Root.jsdb.rword_expr.make_dom_elt(undefined, undefined, operation, arg_block)
    }

  static Identifier(st){
      let name = st.name
      switch(name){
          case "null":      return Root.jsdb.value_to_block(null)
          case "undefined": return Root.jsdb.value_to_block(undefined)
          default:          return Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, name)
      }
  }

    static ThisExpression(st){
        return Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, "this")
    }

  static Literal(st){
     let part = st.value
     if (typeof(part) == "string") {
        let quote_char = st.raw[0]
        return Root.jsdb.literal.string.make_dom_elt(undefined, undefined, part, quote_char)
     }
     else { return Root.jsdb.value_to_block(part) }
  }

  static TemplateLiteral(st){
        let part = st.quasis[0].value.raw
        let quote_char = "`"
        return Root.jsdb.literal.string.make_dom_elt(undefined, undefined, part, quote_char)
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
}
var {shouldnt, function_param_names_and_defaults_array, value_of_path} = require("../job_engine/core/utils.js")
var {make_dom_elt} = require("./core/html_db.js")

