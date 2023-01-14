import "./object_system.js"
//import {Instruction} from "./instruction.js" //now global

export function to_source_code({value, indent="", function_names=false, newObject_paths=false,
                        job_names=false, robot_names=false,
                        depth_limit=100, depth=0, job_orig_args=false,
                        one_line_per_array_elt=false, array_elt_max_chars=60} = {}){
        //console.log("Object.isNewObject: " + Object.isNewObject)
        if(globalThis.Ammo && (value === Ammo)) { return "Ammo" } //if I let this go, it causes some infinite recursion which also happens in inspect
        if (!((typeof(arguments[0]) == "object") && arguments[0].hasOwnProperty("value"))){
            value = arguments[0] //so we can just do calls of to_source_code("stuf")
        }
        if (depth > depth_limit) { return "***" } //stops infinite recursion in circular structures.
        //console.log("to_source_code before big if")
        if      (value === undefined)        { return "undefined" }
        else if (value === null)             { return "null" } //since typeof(null) == "object", this must be before the typeof(value) == "object" clause
        else if (value === true)             { return "true"}
        else if (value === false)            { return "false"}
        else if (typeof(value) === "number") { return value.toString() } //works for NaN too, no need to use (isNaN(value)) { result = "NaN" } //note the check for number before checking isNanN is necessary because JS wasn't designed.
        else if (typeof(value) === "symbol") { return value.toString() }
        else if (typeof(value) === "string") {
            if (value.includes("\n") ||
                (value.includes("'") && value.includes('"')))
                                             { return indent + "`" + value + "`" }
            else if  (value.includes('"'))   { return indent + "'" + value + "'" }
            else                             { return indent + '"' + value + '"' }
        }
        else if (value instanceof Date)      { return value.toString() }
        else if (typeof(value) == "function"){
             let new_args = {value: value, indent: indent}
             return to_source_code_function(new_args)
        }
        else if (Object.isNewObject(value)) {
            //console.log("in to_source_code isNewObject")
            if (newObject_paths) { return value.objectPath }
            else                 { return value.sourceCode() }
        }
        else if (Instruction.is_oplet_array(value)){
            return Instruction.oplet_array_to_source_code(value)
        }
        else if (Utils.typed_array_name(value)){ //any type of array
            //console.log("calling to_source_code_array")
            return to_source_code_array({value: value, one_line_per_array_elt: one_line_per_array_elt, array_elt_max_chars: array_elt_max_chars})
        }
        //Job, Robot, Instruction, Duration
        else if (value.to_source_code){
            let new_args = {value: value, indent: indent, depth: depth + 1} //use depth because we can potentially have infinite recursion here.
            if (value.hasOwnProperty("job_orig_args")) {
                new_args.job_orig_args = value.job_orig_args //If true, src generated is from the orig props, not
                //the current instance props.  current instance props is the default.
            }
            return value.to_source_code(new_args)
        }
        else if (value === globalThis)     { return "globalThis"  } //too many weird values in there and too slow so punt.
        else if (globalThis.Picture && Picture.is_mat(value)){ //we can't and probably shouldn't attempt to print out a readable mat here,
                                          //so just print a string to let a user know what it is in the inspector
                                          //without this, bad bug happens when inspecting Jobs that have taken a picture and
                                          //put it in a user_data variable
            let result = "Mat (picture) of: width: " +  Picture.mat_width(value) +
                         " height: "  + Picture.mat_height(value)
            return result
        }
        else if (typeof(value) == "object"){//beware if we didn't catch arrays above this would hit
                                            //assumes at this point we just have a lit obj.
            return to_source_code_lit_obj({value: value, indent: indent}) //arguments[0]
        }
        else { shouldnt("to_source_code passed: " + value + " which is not a handled type.") }
}

function to_source_code_array(args){
    let value = args.value
    if (Instruction.is_oplet_array(value)) {
        return to_source_code_instruction_array(args)
    }
    let chars_added_since_last_newline = 0
    let result = "["
    let len = value.length
    let max_chars = (args.array_elt_max_chars ? args.array_elt_max_chars : 60)
    for (let i = 0; i < len; i++){ //don't use "for ... in here as it gets some wrong stuff
        let prefix = ""
        let val = value[i]
        let val_str = to_source_code({value: val, array_elt_max_chars: max_chars})
        let comma_maybe = ((i < (len - 1)) ? "," : "")
        let newline_or_space_suffix = ((i == (len - 1))? "" : " ")
        let str_and_suffix_len = val_str.length
        if (args.one_line_per_array_elt) { newline_or_space_suffix = "\n" }
        else if (chars_added_since_last_newline > max_chars) {
            prefix = "\n"
            chars_added_since_last_newline = str_and_suffix_len
        }
        else if ((chars_added_since_last_newline == 0) && (val_str.length > max_chars)) {
            chars_added_since_last_newline = str_and_suffix_len //add it in the usual way
        }
        else if ((chars_added_since_last_newline + str_and_suffix_len) > args.array_elt_max_chars) {
            prefix = "\n"
            chars_added_since_last_newline = str_and_suffix_len
        }
        else { chars_added_since_last_newline += str_and_suffix_len }
        //if (Array.isArray(elt_val)) sep = sep + "<br/>" //put each sub-array on its own line
        result += prefix + val_str + comma_maybe + newline_or_space_suffix
    }
    result += "]"
    return result
}

/* errors on at least some instruction arrays .function to_source_code_instruction_array(args){
    let inst_array = args.value
    let the_indent = ((args.indent === undefined) ? "" : args.indent)
    let result = the_indent + "make_ins("
    let prop_args = Object.assign({}, args) //Object.assign({}, args)
    prop_args.indent = ""
    for(let prop_index in inst_array) {
        prop_args.value = inst_array[prop_index]
        let prop_src = to_source_code(prop_args)
        let suffix = ((prop_index == (inst_array.length - 1)) ? "" : ", ")
        result += prop_src + suffix
    }
    result += ")"
    return result
}*/

function to_source_code_instruction_array(args){
    let inst_array = args.value
    let the_indent = ((args.indent === undefined) ? "" : args.indent)
    let result = the_indent + "make_ins("
    let start_array_index = Instruction.INSTRUCTION_TYPE
    for(let i = start_array_index; i <  inst_array.length; i++) {
        let val = inst_array[i]
        let val_src = to_source_code(val)
        let suffix = ((i == (inst_array.length - 1)) ? "" : ", ")
        result += val_src + suffix
    }
    result += ")"
    return result
}

function to_source_code_lit_obj(args){
        let value = args.value
        let indent = args.indent
        if (!indent) { indent = "" }
        let result = indent + "{"
        let prop_names = Object.getOwnPropertyNames(value) //long objects like cv cause problems
        for (var prop_index = 0; prop_index < prop_names.length; prop_index++) {
            let prop_name   = prop_names[prop_index]
            let prop_val    = value[prop_name]
            let prop_args   = Object.assign({}, args) //Object.assign({}, args) //copy the args
            prop_args.value = prop_val
            prop_args.indent = "" //((prop_index == 0) ? "" : (indent + " "))
            let prop_indent = ((prop_index == 0) ? "" : (indent + " "))
            let quote_char = ""
            if (prop_name.indexOf(" ") != -1){
                quote_char = '"'
                if (prop_name.indexOf('"') != -1) { prop_name = Utils.replace_substrings(prop_name, '"',  '\\"') }
            }
            let trailing_comma = ((prop_index == (prop_names.length - 1)) ? "" : ", ")
            result += prop_indent + quote_char + prop_name + quote_char + ": " + to_source_code(prop_args) +
                      trailing_comma + "\n"
        }
        result += indent + "}"
        return result
}

function to_source_code_function(args){
    let fn_name = Utils.function_name(args.value)
    if (args.function_names && (fn_name !== null) && (fn_name !== "")) {
        return args.indent + fn_name
    }
    else {
        let src = args.value.toString()
        return Utils.replace_substrings(src, "\n", args.indent + "\n")
    }
}

globalThis.to_source_code = to_source_code

