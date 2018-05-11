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
  static js_to_block(src){
      let st
      try {
        let st = JS2B.string_to_ast(src) //esprima.parse(src, {range: true, loc: true}) //st for syntax tree.
        let switcher = st.type
        let part = st
        switch(switcher) {
            case "ObjectExpression": return JS2B[switcher].call(undefined, part);
            case "Program":          return JS2B[switcher].call(undefined, part);
            default: shouldnt("Can't handle exprima type: " + switcher)
        }
      }
      catch(err){
          dde_error("Could not convert JavaScript to a block: " + err.message)
      }
  }
  static Program(st){
      let switcher = st.sourceType
      let part     = st.body[0]
      switch(switcher) {
          case "module": dde_error("unimplemented: JS2B module");
          case "script": return JS2B[switcher].call(undefined, part);
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
          case "VariableDeclaration": return JS2B[switcher].call(undefined, st);
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
          case "UnaryExpression":      return JS2B[switcher].call(undefined, part);
          case "UpdateExpression":     return JS2B[switcher].call(undefined, part);
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
        Root.jsdb.assignment.remove_init_val(left)
        let of_elt = newObject({prototype: Root.jsdb.one_of,
                                choices: ["of", "in"],
                                value: "of",
                                eval_each_choice: false,
                                })
        let right  = JS2B[st.right.type].call(undefined, st.right);
        let body   = JS2B[st.body.type].call(undefined, st.body);
        return Root.jsdb.for.for_of.make_dom_elt(undefined, undefined, left, of_elt, right, body)
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

  static CallExpression(st){
      let callee   = st.callee //could be a single Identifier or could be MemberExpression when its a path
      let meth_src = JS2B.get_src(callee)
      let meth     = value_of_path(meth_src)
      let param_names_and_defaults
      if (meth) { param_names_and_defaults = function_param_names_and_defaults(meth) } //defaults are all strings of src code
      let meth_block = JS2B[callee.type].call(undefined, callee)
      let arg_blocks = {}
      let iterations
      if(param_names_and_defaults) { iterations = Math.max(param_names_and_defaults.length, st.arguments.length) }
      else                         { iterations = st.arguments.length }
      for(let i = 0; i < iterations;  i++){
         let arg_val_block
         if (i < st.arguments.length) {
            let arg_st = st.arguments[i]
            arg_val_block = JS2B[arg_st.type].call(undefined, arg_st)
         }
         else if (param_names_and_defaults && (i < param_names_and_defaults.length)){
            let arg_src = param_names_and_defaults[i][1]
            let arg_st = JS2B.string_to_ast(arg_src)
             arg_val_block = JS2B[arg_st.type].call(undefined, arg_st)
         }
         else { arg_val_block = Root.jsdb.one_of.null_undefined.make_dom_elt(undefined, undefined, "undefined") }
         let param_name
         if(param_names_and_defaults && (i < param_names_and_defaults.length)) {
              param_name = param_names_and_defaults[i][0] }
         else { param_name = "arg" + i }
         arg_blocks[param_name] = arg_val_block
      }
      let call_block = Root.jsdb.method_call.make_dom_elt(undefined, undefined, meth_block, arg_blocks)
      return call_block
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

    // ie:  -23  is a Unary Expression
  static UnaryExpression(st){
      return JS2B.UpdateExpression(st) //works for -23  but maybe not for others.
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
      let inititial_value_st = st.init
      let inititial_value_block
      if (inititial_value_st === null) {
          // inititial_value_st = undefined  //not used
          inititial_value_block = Root.jsdb.one_of.null_undefined.make_dom_elt(undefined, undefined, "undefined")
      }
      else { inititial_value_block = JS2B[inititial_value_st.type].call(undefined, inititial_value_st) }
      return Root.jsdb.assignment.make_dom_elt(undefined, undefined, kind, name_string, inititial_value_block)
  }

  static Identifier(st){
      let name = st.name
      switch(name){
          case "null":      return Root.jsdb.value_to_block(null)
          case "undefined": return Root.jsdb.value_to_block(undefined)
          default:          return Root.jsdb.identifier.identifiers.make_dom_elt(undefined, undefined, name)
      }
  }

  static Literal(st){
     let part = st.value
     return Root.jsdb.value_to_block(part)
  }

  static ObjectExpression(st){
      let name_val_block_elt_lit_obj = {} //names of strings, vals of actual block elts
      for(let prop of st.properties){
          let key = prop.key //typically (at least) identifier
          let name_string = key.name
          //let key_block_elt = JS2B[key.type].call(undefined, key)
          let val = prop.value
          let value_block_elt = JS2B[val.type].call(undefined, val)
          name_val_block_elt_lit_obj[name_string] = value_block_elt
      }
      let lit_obj_block = Root.jsdb.literal.object.make_dom_elt(undefined, undefined, name_val_block_elt_lit_obj)
      return lit_obj_block
  }
}