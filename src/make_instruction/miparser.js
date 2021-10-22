import * as espree from "espree"; //replaces esprima

import {function_param_names_and_defaults_array, starts_with_one_of,
        value_of_path} from "../job_engine/core/utils.js"

class MiParser {
    //_______utils_________
    //return string of src code for arg_name in prop_array (from ast) OR returnn undefined meaning couldn't find it
    static find_arg_val_src_in_prop_array(arg_name, prop_array, src){
        for(let prop_ast of prop_array){
            if(prop_ast.key.name == arg_name){
                return src.substring(prop_ast.value.range[0], prop_ast.value.range[1])
            }
        }
    }

    static clean_instruction_name(instruction_name){
        if(instruction_name.startsWith("new ")){
            instruction_name = instruction_name.substring(4).trim()
        }
        return instruction_name
    }

    static string_to_ast(src){
        if (src[0] == "{") { //esprima doesn't like so hack it
            let new_src = "var foo947 = " + src
            let st = espree.parse(new_src, {range: true, loc: true,  ecmaVersion: "latest"})
            let new_st = st.body[0].declarations[0].init
            return new_st
        }
        else {
            return espree.parse(src, {range: true, loc: true, ecmaVersion: "latest"})
        }
    }

    //________parser______

    static extract_instruction_name_from_ast(ast){
        try{
            let body0_ast = ast.body[0]
            if(body0_ast.type == "FunctionDeclaration"){
                if(body0_ast.generator) { return "function*" }
                else                    { return "function"  }
            }
            let call_ast = body0_ast.expression
            if     (call_ast.type == "ArrayExpression") { return "new Array" }
            else if(call_ast.type == "FunctionExpression"){ //happens when a fn def is wrapped in parens as is necessary for evaling anonymous fns
                if(call_ast.generator) { return "function*" }
                else                   { return "function"  }
            }
            else if(call_ast.type == "NewExpression"){
                let instruction_name = "new " + call_ast.callee.name
                return instruction_name
            }
            else {
                let the_called_fn_ast = call_ast.callee
                let instruction_name
                let name
                let prop
                if(the_called_fn_ast.type == "Identifier") { instruction_name = the_called_fn_ast.name }
                else if(the_called_fn_ast.type == "MemberExpression"){
                    if(the_called_fn_ast.object.object){ //got all 3
                        let superclass_name = the_called_fn_ast.object.object.name
                        let instance_name   = the_called_fn_ast.object.property.name
                        let class_name      = the_called_fn_ast.property.name
                        instruction_name    = superclass_name + "." + instance_name + "." + class_name
                    }
                    else { //bot 1 or 2
                        let name = (the_called_fn_ast.object && the_called_fn_ast.object.name)  //ie "Dexter"
                        let prop = (the_called_fn_ast.property && the_called_fn_ast.property.name)
                        if(name){
                            if (prop) { instruction_name =  name + "." + prop } //got superclass and class
                            else { instruction_name = name } //got only class
                        }
                        else if (prop) { instruction_name = prop } ////got only class
                    }
                }
                else { return null } //can't find insntruction name in ast.
                return instruction_name
            }
        }
        catch(err) {return null}
    }


    //makes an array of objs of each arg in ast. If there isn't an arg in the ast,
    //we get its default value from the fn_name's default value.
    //so we populate the returned val with either the actual arg_src in the ast,
    //or, if none, the default arg src from fn_name
    //if returns null, that means we couldn't parse the args so have to get the
    //default args from the instructions' def.
    static extract_args_from_ast(ast, instruction_name, src, get_defaults_from_def=false){
        let family_class = MiIns.instruction_name_to_family_class(instruction_name)
        if     (family_class == MiIns.array_family){
            return this.extract_args_from_ast_array(ast, instruction_name, src, get_defaults_from_def)
        }
        else if(family_class == MiIns.move_all_joints_family){
            return this.extract_args_from_ast_maj(ast, instruction_name, src, get_defaults_from_def)
        }
        else if(family_class == MiIns.move_to_family){
            return this.extract_args_from_ast_mt(ast, instruction_name, src, get_defaults_from_def)
        }
        else if(family_class == MiIns.function_family){
            return this.extract_args_from_ast_fn(ast, instruction_name, src, get_defaults_from_def)
        }
        else if(family_class == MiIns.new_family){
            instruction_name = this.clean_instruction_name(instruction_name)
            return this.extract_args_from_ast_normal(ast, instruction_name, src, get_defaults_from_def)
        }
        else{
            return this.extract_args_from_ast_normal(ast, instruction_name, src, get_defaults_from_def)
        }
    }


    //returns an array, one lit_obj for each arg in ast.
    // Each lit_obj has properties of arg_name and  arg_val_src.
    static extract_args_from_ast_normal(ast, instruction_name, src, get_defaults_from_def=false){
        let fn = value_of_path(instruction_name)
        let default_arg_name_val_src_pairs = function_param_names_and_defaults_array(fn, true)
        let args_array = []
        if(starts_with_one_of(instruction_name, ["Dexter.", "Serial."]) &&
            (default_arg_name_val_src_pairs.length > 0) &&
            (last(default_arg_name_val_src_pairs)[0] == "robot")){
            default_arg_name_val_src_pairs.pop() //get rid of "robot"
        }
        //arg_name_val_src_pairs holds all the arg names and their default values.
        //only use those defaults if no value from ast/src
        try{
            let src_args_array = ast.body[0].expression.arguments
            for(let i = 0; i <  default_arg_name_val_src_pairs.length; i++){
                let default_arg_pair = default_arg_name_val_src_pairs[i]
                let arg_name = default_arg_pair[0]
                let src_arg_ast = src_args_array[i]
                let arg_val_src
                if(src_arg_ast){
                    if(src_arg_ast.type == "ObjectExpression"){
                        let prop_array = src_arg_ast.properties
                        for(let default_arg_pair of default_arg_name_val_src_pairs){
                            arg_name = default_arg_pair[0]
                            arg_val_src = this.find_arg_val_src_in_prop_array(arg_name, prop_array, src)
                            if((arg_val_src === undefined) && get_defaults_from_def) { arg_val_src = default_arg_pair[1]}
                            if(arg_val_src === undefined) { arg_val_src = "" } //its supposed to be src, so it should be a string
                            args_array.push({name: arg_name, arg_val_src: arg_val_src})
                        }
                        break;
                    }
                    else if (arg_name.startsWith("...")){
                        let start_pos
                        if(i == 0) { start_pos = src_arg_ast.range[0] }
                        else { //get whitespace before first arg
                            start_pos = src_args_array[i - 1].range[1]
                        }
                        let end_pos   = last(src_args_array).range[1] //to end of last arg
                        arg_val_src = src.substring(start_pos, end_pos)
                        if(arg_val_src === undefined) { arg_val_src = "" } //its supposed to be src, so it should be a string

                        //exclude the comma before this rest arg src, but include
                        //the whitespace (maybe even newline) after the comma but before
                        //the first char of the firset arg src so that sucking in
                        //the src from editor then printing out again will look the same.
                       let trimmed_arg_val_src = arg_val_src.trim()
                       if(trimmed_arg_val_src.startsWith(",")){
                            let comma_pos = arg_val_src.indexOf(",")
                            arg_val_src = arg_val_src.substring(comma_pos + 1)
                       }
                        args_array.push({name: arg_name, arg_val_src: arg_val_src})
                    }
                    else {
                        arg_val_src = src.substring(src_arg_ast.range[0], src_arg_ast.range[1])
                        if(arg_val_src === undefined) { arg_val_src = "" } //its supposed to be src, so it should be a string
                        args_array.push({name: arg_name, arg_val_src: arg_val_src})
                    }
                }
                else {
                    arg_val_src = (get_defaults_from_def ? default_arg_pair[1] : undefined)
                    if(arg_val_src === undefined) { arg_val_src = "" } //its supposed to be src, so it should be a string
                    args_array.push({name: arg_name, arg_val_src: arg_val_src})
                }
            }
        }
        catch(err) {}
        return args_array
    }

    static extract_args_from_ast_maj(ast, instruction_name, src, get_defaults_from_def=false){
        let args_array = []
        let call_ast = ast.body[0].expression
        let the_args_ast = (call_ast && call_ast.arguments)
        let arg0_ast = the_args_ast[0]
        if ((the_args_ast.length == 1) &&
            (arg0_ast.type != "ArrayExpression") &&
            (typeof(arg0_ast.value) != "number")) { //1 arg dialog
            let arg_name = "...array_of_angles"
            let arg_val_src = src.substring(arg0_ast.range[0], arg0_ast.range[1])
            args_array.push({name: arg_name, arg_val_src: arg_val_src})
        }
        else { //7 arg dialog. this hits if there are no args as well as > 1 arg, or if the 1 arg is a lit array
            if ((the_args_ast.length == 1) && (arg0_ast.type == "ArrayExpression")) { //got a lit array in that 1 arg
                the_args_ast = the_args_ast[0].elements
            }
            //now the_args_ast is an array of the individual args.
            let fn = value_of_path(instruction_name)
            let arg_name_val_src_pairs = function_param_names_and_defaults_array(fn)
            for(let j = 1; j < 8; j++){
                let arg_name = "joint" + j
                let arg_ast = the_args_ast[j - 1]
                let arg_val_src = ""
                if (arg_ast){
                    let range = arg_ast.range
                    if(!range) { arg_val_src = "parsing_error" }
                    else { arg_val_src = src.substring(range[0], range[1]) }
                }
                else if(get_defaults_from_def){ //no arg so use default val
                    arg_val_src = "0"
                }
                else { arg_val_src = "" }
                args_array.push({name: arg_name, arg_val_src: arg_val_src})
            }
            return args_array
        }
        return args_array
    }
    //for parsing move_to family calls
    static extract_args_from_ast_mt(ast, instruction_name, src, get_defaults_from_def=false){
        let args_array = []
        let call_ast = ast.body[0].expression
        let the_args_ast = (call_ast && call_ast.arguments)
        let arg0_ast = the_args_ast[0] //the xyz arg
        if (!arg0_ast) { //rare case where there's no args at all in the src
            for(let arg_name of ["x", "y", "z"]){
                let arg_val_src = (get_defaults_from_def ? "0" : "")
                args_array.push({name: arg_name, arg_val_src: arg_val_src})
            }
        }
        else if (arg0_ast.type == "ArrayExpression") {
            let elts_ast = arg0_ast.elements
            for(let i = 0; i < 3; i++) {
                let arg_name = ["x", "y", "z"][i]
                let elt_ast = elts_ast[i]
                let arg_val_src = (get_defaults_from_def ? "0" : "")
                if(elt_ast){ arg_val_src = src.substring(elt_ast.range[0], elt_ast.range[1]) }
                args_array.push({name: arg_name, arg_val_src: arg_val_src})
            }
        }
        else if (arg0_ast.type == "ObjectExpression") { //happens just for move_to_straight
            let props_array = arg0_ast.properties
            for(let prop of props_array){
                let arg_name     = prop.key.name
                if(arg_name == "xyz"){
                    let prop_val_ast = prop.value
                    if(prop_val_ast.type == "ArrayExpression"){
                        let arg_vals_array = prop_val_ast.elements
                        for(let i = 0; i < 3; i++) {
                            let arg_name = ["x", "y", "z"][i]
                            let elt_ast = arg_vals_array[i]
                            let arg_val_src = (get_defaults_from_def ? "0" : "")
                            if(elt_ast){ arg_val_src = src.substring(elt_ast.range[0], elt_ast.range[1]) }
                            args_array.push({name: arg_name, arg_val_src: arg_val_src})
                        }
                    }
                    else {
                        let arg_val_src  = src.substring(prop_val_ast.range[0], prop_val_ast.range[1])
                        args_array.push({name: arg_name, arg_val_src: arg_val_src})
                    }
                }
                else {
                    let arg_val_src  = src.substring(prop.value.range[0], prop.value.range[1])
                    args_array.push({name: arg_name, arg_val_src: arg_val_src})
                }
            }
        }
        else { return this.extract_args_from_ast_normal(ast, instruction_name, src) }
        //now args_array is an array of the individual args & vals from the src
        let fn = value_of_path(instruction_name)
        let arg_name_val_src_pairs = function_param_names_and_defaults_array(fn, true)
        arg_name_val_src_pairs.shift() //get rid of the first "xyz" param
        arg_name_val_src_pairs.pop()  //get rid of "robot" last arg
        try{
            the_args_ast.shift() //get rid of first elt (xyz)
            for(let i = 0; i <  arg_name_val_src_pairs.length; i++){
                let arg_pair = arg_name_val_src_pairs[i]
                let arg_name = arg_pair[0]
                let arg_val_src
                let the_arg_ast = the_args_ast[i]
                if(the_arg_ast) {
                    arg_val_src = src.substring(the_arg_ast.range[0], the_arg_ast.range[1])
                }
                if(arg_val_src === undefined) { arg_val_src = (get_defaults_from_def ? arg_pair[1] : "") }
                if(arg_val_src === undefined) { arg_val_src = "" } //its supposed to be src, so it should be a string
                args_array.push({name: arg_name, arg_val_src: arg_val_src})
            }
        }
        catch(err) {}
        return args_array
    }

    static extract_args_from_ast_fn(ast, instruction_name, src){ //for generators too
        let args_array = []
        let body0_ast = ast.body[0]
        if (body0_ast.type == "ExpressionStatement") { //as in src of "(function(){})"
            body0_ast = body0_ast.expression
        }
        let arg_name, arg_val_src

        arg_name = "name"
        let id_ast  = body0_ast.id
        if(id_ast === null) { //happens for anonymous fns
            arg_val_src = ""
        }
        else { arg_val_src = id_ast.name }
        args_array.push({name: arg_name, arg_val_src: arg_val_src})

        arg_name = "...params"
        let params_array = body0_ast.params
        if (params_array.length == 0) { arg_val_src = "" }
        else { arg_val_src = src.substring(params_array[0].range[0], last(params_array).range[1])} //excludes surrounding parans
        args_array.push({name: arg_name, arg_val_src: arg_val_src})

        arg_name = "body"
        let body_array = body0_ast.body.body
        if (body_array.length == 0) { arg_val_src = "" }
        else { arg_val_src = src.substring(body_array[0].range[0], last(body_array).range[1])} //excludes curley braces
        arg_val_src = arg_val_src.trim() //we don't know what whitesapce is at beginning. This gets rid of it
        arg_val_src = replace_substrings(arg_val_src, "\n    ", "\n") //so the body text area lines will start with the most outdented  code normally
        args_array.push({name: arg_name, arg_val_src: arg_val_src})
        return args_array
    }

    static extract_args_from_ast_array(ast, instruction_name, src){ //for generators too
        let arg_name = "...elts"
        let args_array = []
        let body0_ast = ast.body[0]
        let call_ast = body0_ast.expression
        let elements_array = call_ast.elements
        let arg_val_src
        if(elements_array.length == 0) { arg_val_src = "" }
        else {
            arg_val_src = src.substring(elements_array[0].range[0], last(elements_array).range[1])
        }
        args_array.push({name: arg_name, arg_val_src: arg_val_src})
        return args_array
    }
}

globalThis.MiParser = MiParser

