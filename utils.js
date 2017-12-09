function prepend_file_message_maybe(message){
    if (message.startsWith("while loading file:")) { return message }
    else if (window["loading_file"]) {
        return "while loading file: " + window["loading_file"] + "<br/>" + message
    }
    else { return message }
}

function shouldnt(message){
    console.log(message)
    throw new Error("Shouldnt: " + prepend_file_message_maybe(message))
}

function warning(message, temp=false){
    var err = new Error();
    var stack_trace = replace_substrings(err.stack, "\n", "<br/>")
    out_string = "<details><summary><span style='color:#e50;'>Warning: " + prepend_file_message_maybe(message) +
                 "</span></summary>" + stack_trace + "</details>"
    out(out_string, "black", temp) //#ff751a e61
}

function dde_error(message){
    let mess = prepend_file_message_maybe(message)
    console.log("dde_error: " + mess)
    //var err = new Error();
    //var stack_trace = err.stack
    //var  out_string = //"<details><summary><span style='color:red;'>" + message +
                      //"</span></summary>" + stack_trace + "</details>"
    out(mess, "red") //I shouldn't have to do this but sometimes with setTimeouts and/or
    //ui to sandbox transfer, the error doesn't get printed out from dde eval so do this to be sure.
    throw new Error(mess)
}

let semver = require("semver")

function version_equal(version_string1, version_string2=dde_version){
    //let semver = require("semver")
    return semver.eq(version_string1, version_string2)
}

function version_less_than(version_string1, version_string2=dde_version){
    //let semver = require("semver")
    return semver.lt(version_string1, version_string2)
}

function version_more_than(version_string1, version_string2=dde_version){
    //let semver = require("semver")
    return semver.gt(version_string1, version_string2)
}

function dde_version_between(min=null, max=null, action="error"){ //"error", "warn", "boolean"
    if (!["error", "warn", "boolean"].includes(action)) {
        dde_error("dde_version_between passed an invalid value for 'action' of: " + action +
                  ' It must be "error", "warn", or "boolean", with the default of "error". ')
    }
    if (min == null){
        if (max == null) {
            dde_error("dde_version_between given a null min and max." +
                      "<br/>You must supply at least one on these.")
        }
        //only max
        else if(version_more_than(max) || version_equal(max)) { return true }
        else if (action == "warn"){
            warning("You are running DDE version: " + dde_version +
                     "<br/>but this code requires version: " + max + " or less.")
            return false
        }
        else if (action == "error"){
            dde_error("You are running DDE version: " + dde_version +
                      "<br/>but this code requires version: " + max + " or less.")
        }
        else { return false }
    }
    //min is present
    else if (max == null) {
        //only min
        if (version_less_than(min) || version_equal(min)) { return true }
        else if (action == "warn"){
            warning("You are running DDE version: " + dde_version +
                    "<br/>but this code requires version: " + min + " or more.")
            return false
        }
        else if (action == "error") {
            dde_error("You are running DDE version: " + dde_version +
                      "<br/>but this code requires version: " + min + " or more.")
        }
        else { return false }
    }
    //both min and max are present
    else if (version_equal(min) || version_equal(max) ||
             (version_less_than(min) && version_more_than(max))) { return true }
    else if (action == "warn"){
        warning("You are running DDE version: " + dde_version +
                "<br/>but this code requires a version between " + min + " and " + max + " inclusive.")
        return false
    }
    else if (action == "error") {
        dde_error("You are running DDE version: " + dde_version +
                  "<br/>but this code requires a version between " + min + " and " + max + " inclusive.")
    }
    else { return false }
}

var primitive_types = ["undefined", "boolean", "string", "number"] //beware; leave out null because
  //for some strange reason, null is of type "object"

function is_primitive(data){
    if (data === null) { return true }
    return primitive_types.includes(typeof(data))
}

//only checks first char
function is_digit(char){
    if(char.match(/^[0-9]/)) {  return true; }
    else { return false; } 
}

function is_alphanumeric(char) {
    var letterNumber = /^[0-9a-zA-Z]+$/;
    if(char.match(letterNumber)) {  return true; }
    else { return false; }
}


function is_letter(char) {
    var letter = /^[a-zA-Z]+$/;
    if(char.match(letter)) {  return true; }
    else { return false; }
}
function is_letter_or_underscore(char) {
    var letter = /^[a-zA-Z_]+$/;
    if(char.match(letter)) {  return true; }
    else { return false; }
}

function is_string_a_integer(a_string){
    var pat = /^-?[0-9]+$/;
    if(a_string.match(pat)) {  return true; }
    else { return false; }
}

function is_string_a_float(a_string){
    var pat = /^-?[0-9]+\.[0-9]+$/;
    if(a_string.match(pat)) {  return true; }
    else { return false; }
}
function is_string_a_number(a_string){
    return is_string_a_integer(a_string) || is_string_a_float(a_string)
}

//returns true for strings of the format "rgb(0, 100, 255)" ie the css color specifier
function is_string_a_color_rgb(a_string){
    return a_string.startsWith("rgb(") && a_string.endsWith(")") && a_string.includes(",") //not perfect but quick and pretty good
}

//not perfect as could be escape sequences, internal quotes, but pretty good
function is_string_a_literal_string(a_string){
    if (a_string.length < 2) { return false }
    else if (a_string.startsWith('"') && a_string.endsWith('"')) { return true }
    else if (a_string.startsWith("'") && a_string.endsWith("'")) { return true }
    else if (a_string.startsWith("`") && a_string.endsWith("`")) { return true }
    else { return false }
}

//not perfect as could be escape sequences, internal quotes, but pretty good
function is_string_a_literal_array(a_string){
    if (a_string.startsWith('[') && a_string.endsWith(']')) { return true }
    else { return false }
}

function is_whitespace(a_string){
    return a_string.trim().length == 0
}

function is_generator_function(obj){
    return obj.constructor && obj.constructor.name == "GeneratorFunction"
}

//Beware: this *might* only catch iterators made by generator functions.
function is_iterator(obj){
    return obj.constructor && is_generator_function(obj.constructor)
}

//very kludgey but apparently no good way to tell.
// you can also do obj.next and if its not undefined
//that's a good sign but not definitive because a user
//could define the next method to do pretty much anything.
/*function is_iterator(obj){
 if((typeof(obj) == "object") &&
 !Array.isArray(obj) ) {        //because typeof([]) => "object" in JS's non-designed type system
 //because obj.toString errors on certain empty objects, protect against that error
 try {
 var str = obj.toString()
 if (obj.toString().includes("Iterator") ||
 obj.toString().includes("Generator")) {
 return true
 }
 else { return false }
 }
 catch (e) { return false }
 }
 else { return false}
 }*/

//see http://stackoverflow.com/questions/30758961/how-to-check-if-a-variable-is-an-es6-class-declaration
//so in other words, ES6 doesn't have classes!
function is_class(obj){
    return ((typeof(obj) == "function") && obj.toString().startsWith("class "))
}

//returns string or null if no class name
function get_class_name(a_class){
    if (typeof(a_class) == "function"){
        const src = a_class.toString()
        if (src.startsWith("class ")){
            const end_of_class_name_pos = src.indexOf("{")
            let result = src.substring(6, end_of_class_name_pos)
            if (result.includes(" extends ")) {
                let name_split = result.split(" ")
                result = name_split[2] + "." + name_split[0]
            }
            return result
        }
    }
    return null
}

//______color_______
function rgb(r, g, b){return "rgb("+r+", "+g+", "+b+")"} //this string used in css

// "rgb(2, 3, 123)" => [2, 3, 123]
function rgb_string_to_integer_array(str){
    str = str.substring(4, str.length - 1)
    let result = str.split(",")
    result[0] = parseInt(result[0])
    result[1] = parseInt(result[1])
    result[2] = parseInt(result[2])
    return result
}

function integer_array_to_rgb_string(arr3){
    return "rgb(" + arr3[0] + ", " + arr3[1] + ", " + arr3[2] + ")"
}
//________Date________
function is_valid_new_date_arg(string_or_int){
    const timestamp = Date.parse(string_or_int)
    if (Number.isNaN(timestamp)) { return false }
    else { return true }
}

function is_hour_colon_minute(a_string){
    return a_string.match(/^\d\d:\d\d$/)
}

function is_hour_colon_minute_colon_second(a_string){
    return a_string.match(/^\d\d:\d\d:\d\d$/)
}

//date_int is ms from jan 1, 1970 as returned by Date.now()
function date_integer_to_long_string(date_int=Date.now()){
    let date_obj = new Date(date_int)
    let result = date_obj.toString()
    let ms = date_obj.getMilliseconds()
    result +=  " " + ms + "ms"
    return result
}

//integer millisecons in, output "0:59:59:999"
function milliseconds_to_human_string(total_ms){
   let remain_ms   = total_ms % 1000
   let total_secs  = (total_ms - remain_ms) / 1000

   let remain_secs = total_secs % 60
   let total_mins = (total_secs - remain_secs) / 60

   let remain_mins = total_mins % 60
   let total_hours = (total_mins - remain_mins) / 60
   return total_hours                 + ":" +
          pad_integer(remain_mins, 2) + ":" +
          pad_integer(remain_secs, 2) + ":" +
          pad_integer(remain_ms, 3)
}

//pad_integer(123, 5, "x") => "xx123"
function pad_integer(int, places=3, pad_char="0"){
    let result = "" + int
    if (result.length < places) { result = pad_char.repeat(places - result.length) + result}
    return result
}

function is_json_date(a_string){
    if((a_string.length > 19) && (a_string.length < 30)) {//impresise
        return (is_string_a_integer(a_string.substring(0, 4)) &&
        (a_string[4] == "-") &&
        (a_string[7] == "-") &&
        (a_string[10] == "T") &&
        (a_string[13] == ":"))
    }
    else return false
}

//lots of inputs, returns "Mar 23, 2017" format
function date_to_mmm_dd_yyyy(date){
    if(!(date instanceof Date)) { date = new Date(date) }
    const d_string = date.toString()
    const mmm = d_string.substring(4, 8)
    return mmm + " " + date.getDate() + ", " + date.getFullYear()
}
//_____end Date_______

//returns a primitiate that can be posted like a string, nuumber, boolean
function convert_to_postable(val){
    switch (typeof(val)){
        case "string": break;
        case "number": break;
        case "boolean": break;
        case "undefined": break;
        case "object":
            if      (val === null) break;
            else if (Array.isArray(val))  break;  //hope that its an array of primitives
            else if (val instanceof Date) { val = val.toJSON() }
            else { val = JSON.stringify(val) } //hopefully a literal object
            break;
        default:
            dde_error("Attempt convert: " + val + " to a postable value, but this can't be done.")
    }
    return val
}

function convert_from_postable(val){
    switch (typeof(val)){
        case "string":
            if(val.startsWith("{"))     val = JSON.parse(val)
            else if (is_json_date(val)) val = new Date(val)
            //else leave as a string
            break;
        //default: leave as is
    }
    return val
}

function starts_with_one_of(a_string, possible_starting_strings){
    for (let str of possible_starting_strings){
        if (a_string.startsWith(str)) return true
    }
    return false
}


//the default for Robot Serial.sim_fun
function return_first_arg(arg){ return arg }

function typed_array_name(item){
    if(Array.isArray(item)) { return "Array" }
    else if (item instanceof Int8Array)         { return "Int8Array" }
    else if (item instanceof Uint8Array)        { return "Uint8Array" }
    else if (item instanceof Uint8ClampedArray) { return "Uint8ClampedArray" }
    else if (item instanceof Int16Array)        { return "Int16Array" }
    else if (item instanceof Uint16Array)       { return "Uint16Array" }
    else if (item instanceof Int32Array)        { return "Int32Array" }
    else if (item instanceof Uint32Array)       { return "Uint32Array" }
    else if (item instanceof Float32Array)      { return "Float32Array" }
    else if (item instanceof Float64Array)      { return "Float64Array" }
    else { return null } //not an array of any type
}

//returns null or the last elt of an array or a string
function last(arg){
    let len = arg.length
    if (len == 0)                     { return undefined }
    else if (typeof(arg) == "string") { return arg[len - 1 ] }
    else if (Array.isArray(arg))      { return arg[len - 1] }
    else if (arg instanceof NodeList) { return arg[len - 1] }
    else if (arg instanceof HTMLCollection) { return arg[len - 1] }
    else                              { dde_error("last passed unhandled type of arg: " + arg) }
}

function flatten(arr, result=[]){
    if (Array.isArray(arr)){
        for (let elt of arr){
            flatten(elt, result)
        }
    }
    else { result.push(arr) }
    return result
}

//used by inspector for printing 2D arrays
function is_array_of_same_lengthed_arrays(array){
  if (array.length === 0) { return false }
  let len = null
  for(let arr of array) {
    if (!Array.isArray(arr))     { return false }
    else if (len === null)       { len = arr.length }
    else if (arr.length !== len) { return false }
  }
  return true
}

function similar(arg1, arg2, tolerance=0, tolerance_is_percent=false, arg1_already_seen=[], arg2_already_seen=[]){
    //I started to do a infinite circularity test but its trick to do quickly and maybe unnecessary because
    //if say 2 arrays both have themselves as the 3rd elt, and the 2 arrays are eq to begin with, that
    //will get caught in the very first === so no infinite recursion.
    //now if we had 2 arrays that were both different and had themselves as only element,
    //we should be able to conclude that the 2 arrays are similar.
    //All very tricky!
    if(arg1 === arg2) {return true} //handles null case
    let arg1_type = typeof(arg1)
    if (arg1_type !== typeof(arg2)) { return false }
    //ok now we know their js "types" are the same but beware, null is of type "object"
    else if (arg1 === null) { return false } //because if both were null, it would have been caught by === above
    //else if (arg1_type === "boolean") { return false } //because if both were true or both were false, it would have been caught by === above
    else if(arg1_type == "number") { //because of same type test above, we know arg2 is also a number
        if (tolerance === 0) { return false } //if they were === would have been caught by the above.
        else {
            let tol = Math.abs(arg1 - arg2)
            if (tolerance_is_percent){
                let max = Math.max(Math.abs(arg1), Math.abs(arg2))
                let percent = (tol / max) * 100
                return percent <= tolerance
            }
            else { return (tol <= (tolerance + Number.EPSILON)) } //adding epslion gets rid of the normal floating point "bugs"
                    //for instance similar(2.1, 2, 0.1) =>  "true" with the addition of EPSILON but doesn't without it.
        }
    }
    else if(is_primitive(arg1)) { return false } //if one of the args is primitive, then if it was similar to th other,
        // that other arg must have been primitve and same value.
        // but arg1 !== arg2 at this point so  arg1 must not be similar to arg2
    else if (Array.isArray(arg1)){
        if      (!Array.isArray(arg2))        { return false }
        else if (arg1.length !== arg2.length) { return false }
        else { //we've got 2 arrays of the same length
            let arg1_already_seen_index = arg1_already_seen.indexOf(arg1)
            let arg2_already_seen_index = arg2_already_seen.indexOf(arg2)
            if ((arg1_already_seen_index >= 0) && (arg1_already_seen_index === arg2_already_seen_index)){
                return true //this doesn't mean the WHOLE outer data structure is similar, just this part of it
            }
            else { //each unique array only gets on its already-seen list 0 or once.
                arg1_already_seen.push(arg1)
                arg2_already_seen.push(arg2)
                for (let i = 0; i < arg1.length; i++) {
                    if (!similar(arg1[i], arg2[i], tolerance, tolerance_is_percent, arg1_already_seen, arg2_already_seen)){
                         return false
                    }
                }
                return true
            }
        }
    }
    else if (Array.isArray(arg2)) { return false } //because we know at this point that arg1 is NOT an array
    else if (Object.getPrototypeOf(arg1) !== Object.getPrototypeOf(arg2)) { return false }
    else if (typeof(arg1) == "function"){ return arg1.toString() == arg2.toString() } //warning: fns could differ only in whitspace and this returns false, but if they have THE SAME src, its true.
    else { //arg1 and arg2 should be of type "object" but neither is null (due to primitive checks above)
        var props1 = Object.getOwnPropertyNames(arg1)
        var props2 = Object.getOwnPropertyNames(arg2)
        if (!similar(props1, props2)) { return false }
        for (let prop of props1){
            if (!similar(arg1[prop], arg2[prop], tolerance, tolerance_is_percent)) { return false}
        }
        return true
    }
}

//arrays can be arrays, or can be a random objects.
//all must be of the same type and have elts of the same names with the same values
//compared with ===
function same_elts(...arrays){
    if(arrays.length < 2) {return true}
    var first = arrays[0]
    if (Array.isArray(first)) {
        for(let arr of arrays.slice(1)){
            if (!Array.isArray(arr)) { return false }
            else if(first.length !== arr.length) {return false}
            else {
                for (let i = 0; i < arr.length; i++){
                    if (first[i] !== arr[i]) { return false}
                }
            }
        }
        return true
    }
    else {
        var first_props = Object.getOwnPropertyNames(first)
        for(let obj of arrays.slice(1)){
            if (Array.isArray(obj)) { return false }
            var obj_props = Object.getOwnPropertyNames(obj)
            if (obj_props.length !== first_props.length) { return false }
            else {
                for (let prop of first_props){
                    if (first[prop] !== arr[prop]) { return false}
                }
            }
        }
    }
}

function line_starting_with(text, starting_with, include_starting_with){
    var lines = text.split("\n")
    for (var line of lines){
        if (line.startsWith(starting_with)){
            if (include_starting_with){
                return line
            }
            else {
                return line.substring(starting_with.length)
            }
        }
    }
    return null //didn't find a line.
}

function encode_quotes(text){
    text = text.split("'").join("ssqq")
    text = text.split('"').join("ddqq")
    text = text.split('\n').join("nnll")
    return text
}

function decode_quotes(text){
    text = text.split("ssqq").join("'")
    text = text.split('ddqq').join('"')
    text = text.split('nnll').join('\n')
    return text
}

var contant_spaces = "                                                                              "
function spaces(number_of_spaces_desired){
    return contant_spaces.substring(0, number_of_spaces_desired)
}

//from http://eddmann.com/posts/ten-ways-to-reverse-a-string-in-javascript/ which tests this to be fastest
function reverse_string(s) {
    var o = '';
    for (var i = s.length - 1; i >= 0; i--)
        o += s[i];
    return o;
}

//avoids calling eval. If a path_elt isn't defined, this fn returns undefined.
function value_of_path(path_string){
    let path = path_string.split(".")
    let result
    if(window[path[0]] !== undefined) { result = window }
    //note window["window"] returns the window obj so the arg can be "window" and we still win
    else if (Object.prototype[path[0]] !== undefined) { result = Object.prototype }
    else { return undefined }
    for (var path_elt of path){
        result = result[path_elt]
        if (result === undefined) {break}
    }
    return result
}


//returns null if fn_src doesn't look like a fn def.
//returns "" if its an anonymous fn
//else returns the fn name
//beware: js is clever about assigning names to annonymous fns if
//th happen to be bound to a keyword arg to a fn,
//In such cases, some.fn.name might yield the name its bound to,
//not the name its given in its source code.
function function_name(fn_or_src){
    if (typeof(fn_or_src) == "string"){
        if (!fn_or_src.startsWith("function ")) {return null}
        else{
            let parts = fn_or_src.split(" ")
            if (parts.length < 2) { return "" }
            else {
                let name_maybe = parts[1]
                if (name_maybe.startsWith("(")) { return "" }
                else {
                    let paren_pos = name_maybe.indexOf("(")
                    if (paren_pos == -1) { return name_maybe }
                    else { return name_maybe.substring(0, paren_pos) }
                }
            }
        }
    }
    else if (typeof(fn_or_src) == "function"){
        return  fn_or_src.name   //returns "" if anonymous function
    }
    else { return null }
}
//returns a string
function function_params(fn, include_parens=true){
    let src = fn.toString()
    let open_pos = src.indexOf("(")
    let close_pos = Editor.find_matching_delimiter(src, open_pos)
    /*close_pos = src.indexOf("){") //beware, with default args, there can be syntax in params, but this will at least mostly work
    if (close_pos == -1) {close_pos = src.indexOf(") {") //that space is in some system defs like isPrototypeOf
    if (close_pos == -1) {close_pos = src.indexOf(")") //one last try. Not so good since a default value
          // *might* have a paren in it, but not too many fns with such default values so might as well.
    */
    let result = src.substring(open_pos + 1, close_pos)
    if ((result == "") && (fn.length !== 0)) { //the src of the fn does not contain the params as is true for Math fns, and fns whose body source is [native code]
        let prefix = "arg"
        if (Math.hasOwnProperty(fn.name)) { prefix = "num" } //all fns in Math take only number args. This is not true for the "Number" class fns.
        for (let i = 1; i <= fn.length; i++) {
            result += prefix + i
            if (i != fn.length) { result += ", "}
        }
    }
    if (include_parens){ result = "(" + result + ")" }
    return result
}
//fn can be a constructor or other method who's src string doesn't have to start with "function".
//we really only care about the text between the first paren and the first ")}", exclusive
//returns an array of strings, the names of the params
//function(a, {b=2, c=3}){ return 99}   returns ["a", "b", "c"]
function function_param_names(fn){
    var params_full_string = function_params(fn, false)
    return params_string_to_param_names(params_full_string)
}

//params_full_string can either be wrapped in parens or not
function params_string_to_param_names(params_full_string){
    if (params_full_string.startsWith("(")) {params_full_string = params_full_string.substring(1)}
    if (params_full_string.endsWith(")"))   {params_full_string = params_full_string.substring(0, params_full_string.length - 1)}
    var params_and_defaults_array = params_full_string.split(",")
    var param_names = []
    for(var param_and_default of params_and_defaults_array){
        param_and_default = param_and_default.trim()
        if (param_and_default.startsWith("{")){
            var inner_params_and_defaults = param_and_default.substring(1, param_and_default.length -1) //cut off { and }
            var inner_params_and_defaults_array = inner_params_and_defaults.split(",")
            for(var inner_param_and_default of inner_params_and_defaults_array){
                inner_param_and_default = inner_param_and_default.trim()
                var the_match = inner_param_and_default.match(/^[A-Za-z_-]+/)
                if (!the_match) {return null} //invalid syntax
                var the_param = the_match[0]
                param_names.push(the_param)
            }
        }
        else {
            var equal_pos = param_and_default.indexOf("=")
            var the_param
            if (equal_pos != -1){
                the_param = param_and_default.substring(0, equal_pos)
                the_param = the_param.trim()
            }
            else {
                the_param =  param_and_default
            }
            param_names.push(the_param)
        }
    }
    return param_names
}

//not general purpose
function shallow_copy(obj){ //copies only enumerable, own properites. Used in
                            //copying Job's user_data at start
    let result = obj
    if(Array.isArray(obj)){
        result = []
        for (let elt of obj) { result.push(elt) }
    }
    else if (typeof(obj) == "object"){
        result = {}
        for(let name of Object.keys(obj)){
            result[name] = obj[name]
        }
    }
    return result //might be a Date, I hope that's not mungable
}

function shallow_copy_lit_obj(obj){ //copies only enumerable, own properites. Used in
    //copying Job's user_data at start
    let result = {}
    for(let name of Object.keys(obj)){
        result[name] = shallow_copy(obj[name])
    }
    return result
}

//used to fix broken ES6 not allowing a keyword obj with destructuring.
                             //defaults   keyword_args
function copy_missing_fields(source_arg, target_obj){
    for(var name of Object.getOwnPropertyNames(source_arg)){
        if (!target_obj.hasOwnProperty(name)){
            var new_val = source_arg[name]
            if (new_val == "required"){
                shouldnt("copy_missing_fields passed target object: " + target_obj +
                        " that was missing required field of: " + name)
            }
            else { target_obj[name] = new_val }
        }
    }
}
/* not called as of apr 17, 2016. unfortunately won't work for class constructors that use the ES6 keyword default params
function process_constructor_keyword_args(defaults, args, the_this){
    //verify that keyword_args doesn't have any illegal arg in it.
    for(let name in args){
        if (!defaults.hasOwnProperty(name)){
            throw new Error(name + " is not a valid arg name. The valid arg names are: " + Object.keys(defaults))
        }
    }
    for(let name in defaults){
        if (!args.hasOwnProperty(name)){
            var new_val = defaults[name]
            if (new_val == "required"){
                throw new Error(args + " should have contained required arg: " + name + " but didn't.")
            }
            else { args[name] = new_val }
        }
    }
    for(let name in args){
        the_this[name] = args[name]
    }
}
*/
/*
 function pp_json(obj){
 var str = JSON.stringify(obj, null, 4)
 str = str.replace(/\{\n/g, "{")
 str = str.replace(/\n/g, "<br/>")
 str = str.replace(/\ \ \ \ /g, "&nbsp;&nbsp;&nbsp;&nbsp;")
 return str
 }
 */

//does not trim the beginning of the string. Usd by trim_string_for_eval
//note regex "s" matches spaces, newlines, tab at least, ie all whitespace
function trim_end(str){
    return str.replace(/\s+$/g, "")
}

//only needs to get rid of a trailing // comment,
//not ones at beginning or end of str, and not /* .. */
//in order for eval to work on str
//we keep leading whitespace so that the char position of errors can be accurate.
//buggy when // is inside quotes.
function trim_string_for_eval(str){
    str = trim_end(str)
    let double_slash_pos = str.lastIndexOf("//")
    if (double_slash_pos == -1) { return str }
    let newline_pos = str.lastIndexOf("\n")
    if (newline_pos < double_slash_pos) { //we've got "bar //junk" or "foo \n bar //junk"
          //this clause hits if newline_pos == -1 which is fine.
        let result = str.substring(0, double_slash_pos)
        //but might have "foo \n \\ junk \n \\more junk
        return trim_string_for_eval(result)
    }
    else {  //we've got "foo //junk \n bar" ie a non-last line of \\comment so that's ok for eval
        return str
    }
}

//removes prefix, & suffix whitespace AND replaces multiple
//redundant interior whtiespace with a single space.
function trim_all(str){
    str = str.trim()
    return str.replace(/\s+/g,' ')
}

function trim_string_quotes(a_string){
    if(a_string.length < 2) {return a_string}
    const first_char = a_string[0]
    if (["'", '"', "`"].includes(first_char)){
        if (last(a_string) == first_char){
            return a_string.substring(1, a_string.length - 1)
        }
    }
    return a_string
}

function replace_substrings(orig_string, substring_to_replace, replacement){
    return orig_string.replace(new RegExp(substring_to_replace, 'g'), replacement);
}

//used by users in calling  DXF.init_drawing for its dxf_filepath arg
function text_to_lines(text) { return txt.text_to_lines(text) }

//fry's get a js string into literal source code. Used in printout out a TestSuite test
function string_to_literal(a_string){
    if      (!a_string.includes('"')) { return '"' + a_string + '"'}
    else if (!a_string.includes("'")) { return "'" + a_string + "'"}
    else if (!a_string.includes("`")) { return "`" + a_string + "`"}
    else {
        a_string = a_string.replace(/\"/g, '\\"')
        return '"' + a_string + '"'
    }
}
 //uses html to format newlines
//use for printing ANY possible value from JS so that a human (usually a programmer) can make sense of it.
//Use stringify_value_sans_html  for evalable string (but still not perfrect
//returns a string.
//called on the eval result by eval part 2, and by show_output if the input is not already a string
//and by Js_info
function stringify_value(value){
    //if (Object.isNewObject(value)) { inspect_new_object(value) }
    //else {
        var result = stringify_value_aux (value)
        //if (typeof(value) != "string"){
        //    result = "<code>" + result + "</code>"
        //}
        return result
    //}
}

function stringify_value_aux (value, job, depth=0){
    if (depth > 2) { return "***" } //stops infinite recustion in circular structures.
    var result
    if      (value === undefined)       { return "undefined" }
    else if (value === null)            { return "null" } //since typeof(null) == "object", this must be before the typeof(value) == "object" clause
    else if (value === window)          { return "{window object: stores globals}" } //too many weird values in there and too slow so punt.
    else if (typeof(value) == "number") { return value.toString() } //works for NaN too, no need to use (isNaN(value)) { result = "NaN" } //note the check for number before checking isNanN is necessary because JS wasn't designed.
    else if (typeof(value) == "string") { return JSON.stringify(value) }
    else if (value instanceof Date){ result = value.toString() }
    else if (typeof(value) == "function") {
        result = value.toString()
        var bod_pos = result.indexOf("{")
        if (bod_pos.length <= 12) { //very little to go on. probably an anonymous fn with no args
            if (result.length > 25){ //shorten longer defs
                result = result.substring(0, 22) + "...}"
            }
        }
        else{
            result = result.substring(0, bod_pos) + "{...}" //just show "function foo(a, b){...}"
        }
    }
    else if (Object.isNewObject(value)) {
        result = value.objectPath(value)
        if (!result) {
            result = "Instance of: " + value.prototype.objectPath() //todo what if we make an instance of an unnamed instance? we shoud go up the tree to find the first named prototype.
        }
        //from top level, we'll be in sandbox, so value can be browsed without it having to have a path to it.
        //but hopuflly value.prototype WILL have a path (as is likely). For now don't worry about
        //unnamed objs 2 levels down.
        else {
        //inspect_new_object(value) //causes infinite loop in electron dde
        result = inspect_stringify_new_object_clickable_path(value) //causes infinite loop in electron dd
        //just let result be the string of the path.
        }
    }
    else if (depth > 2) { return "***" } //the below clauses call stringify_value_aux meaning
        //they can get into infinite recursion, so cut that off here.
    else if (typed_array_name(value)){ //any type of array
        let len = Math.min(value.length, 100)  //large arrays will cause problems
        result = "[<br/>"
        for (let i = 0; i < len; i++){ //don't use "for ... in here as it gets some wrong stuff
            let sep = ((i == len - 1) ? "<br/>" : ",<br/>")
            var elt_val = value[i]
            var elt_val_string = stringify_value_aux(elt_val, job, depth + 1)
            //if (Array.isArray(elt_val)) sep = sep + "<br/>" //put each sub-array on its own line
            result += " " + elt_val_string + sep
        }
        result += "]"
        if ((result.length < 100) && (result.indexOf("{") == -1)){ //worked up until I put in indicies above
            result = result.replace(/\[<br\/>\s+/g, "[")
            result = result.replace(/,<br\/>\s+/g, ", ")
            result = result.replace(/<br\/>\]/g, "]")
            result = result.replace(/\[\s+/g, "[")
        }
        result = result.replace(/\],\s+\[/g, "],<br/>&nbsp;[")
    }

    /*else if (value == rootObject) {
        result = "{prototype: undefined<br/>" +
                 '&nbsp;name: "rootObject"<br/>'
        for(let prop in value){
            let prop_val = value[prop]
            let val_str
            if (value.hasOwnProperty(prop) && (prop != "name") && (prop != "prototype")){
               if (Object.isNewObject(prop_val)){
                  val_str = stringify_new_object_clickable_path(prop_val)
               }
               else { val_str = stringify_value_aux(prop_val) }
               result += "&nbsp;" + prop + ": " +  val_str + "<br/>"
            }
        }
        result += "}"
    }
    else if (Object.isNewObject(value)) {
        let prop_val = value["prototype"]
        let val_str = (Object.isNewObject(prop_val)?
                        stringify_new_object_clickable_path(prop_val):
                        stringify_value_aux(prop_val))
        result = "{prototype: "   + val_str + "<br/>" +
                   "&nbsp;name: " + ((value.name == undefined) ? "undefined" : JSON.stringify(value.name)) + "<br/>"
        for(let prop in value){
           if (value.hasOwnProperty(prop) && (prop != "name") && (prop != "prototype")){
               prop_val = value[prop]
               val_str = Object.isNewObject(prop_val)? stringify_new_object_clickable_path(prop_val): stringify_value_aux(prop_val)
               result += "&nbsp;" + prop + ": " +  val_str + "<br/>"
           }
        }
        result += "}"
    }*/

    else if (typeof(value) == "object"){//beware if we didn't catch arrays above this would hit
        if (value.constructor == Job){ //must be under object clause since value might be null
            job = value
        }
        //I can't figure out how to tell if toString is explicity defined on value. hasOwnProperty doesn't work
        if ((value instanceof Instruction) || (value instanceof Duration) || (value instanceof Brain) ||
            (value instanceof Human) || (value instanceof TestSuite)){
            return value.toString()
        }
        var result = "{"
        let constructor_name = value.constructor.name
        if (constructor_name != "Object") { result += "class: " + constructor_name + ",<br/>"}
        let prop_names = Object.getOwnPropertyNames(value) //long objects like cv cause problems
        for (var prop_index = 0; prop_index < Math.min(prop_names.length, 6); prop_index++) {
            let prop_name = prop_names[prop_index]
            let prop_val = value[prop_name]
            if (prop_name == "robot_status"){
                if (!job && value.job_id) { job = Job.job_id_to_job_instance(value.job_id) }
                let where_from = ""
                if (value instanceof Job)   { where_from = " on job: "   + value.name }
                if (value instanceof Robot) { where_from = " on robot: " + value.name }
                result += Dexter.robot_status_to_html(prop_val, where_from)
            }
            else if (prop_name == "do_list"){
                result += job.do_list_to_html() //Job.do_list_to_html(value[prop])
            }
            else if (prop_name == "original_do_list"){
                result += Job.non_hierarchical_do_list_to_html(prop_val) //Job.do_list_to_html(value[prop])
            }
            else if (prop_name == "sent_instructions"){
                result += Dexter.sent_instructions_to_html(prop_val)
            }
            else if (prop_name == "rs_history"){ //value is instance of Dexter
                result += prop_name + ": " + Dexter.make_show_rs_history_button_html(value.job_id)
            }
            else {
                try{
                  result += prop_name + ": " + stringify_value_aux(prop_val, job, depth + 1) + ",<br/>"
                }
                catch(e) {} //doing window["caches"] errors so just forget about this prop and maybe others.
            }
        }
        result += "}"
        if (result == "{}") {  //as is the case with iterators
            if (is_iterator(value)) {
              result = value.toString() //not great as might make "[object Generator]" or "[object Array Iterator]" but better than {}
            }
            else {
                 try{
                     var result = value.toString()
                     if (result == "[object Object]"){
                         if (value.constructor == Object) { result = "{}" }
                         else { result = "{instanceof: " + stringify_value_aux(value.constructor, job, depth + 1) + "}" }
                     }
                 }
                 catch(e) {return "{}" }
            }
        }
    }
    else {
        result = JSON.stringify(value, null, 2) //beware if a val of a field in a obj is a fn, it prints as null
        if (result == undefined){ //as happens at least for functions
            result = value.toString()
        }
        else{//as for js objects, etc.
            result = result.replace(/\{\n  /g, "{&nbsp;")
            result = result.replace(/\[\n  /g, "[&nbsp;")
            result = result.replace(/\n/g, "<br/>")
            result = result.replace(/\ \ /g, "&nbsp;&nbsp;")
        }
    }
    return result
}

//crude but guarentees fidelity with stringify_value, but that might not be what I really want.
function stringify_value_sans_html(value){
    let result = stringify_value(value)
    //result = replace_substrings(result, "<co"  + "de>", "") //screws up inspetion of this fn (while inspecting 'window') having '<co  de>' in it. //
    result = result.replace(/<code>/g,   "")
    //result = replace_substrings(result, "</co" + "de>", "") //
    result = result.replace(/<\/code>/g, "")
    result = result.replace(/<br\/>/g,   "\n")
    result = result.replace(/&nbsp;/g,   " ")
    return result
}

/////// CSV ///////
function array_to_csv(an_array){
    let result = ""
    for(let i = 0; i < an_array.length; i++){
        let row = an_array[i]
        for (let j = 0; j < row.length; j++) {
            let cell = row[j]
            result += "" + cell
            if (j < (row.length - 1)) { result += "," }
        }
        if (i < (an_array.length - 1)) { result += "\n" } //don't print a final newline
    }
    return result
}

function csv_to_array(a_string){
    let result = []
    let row_strings = a_string.split("\n")
    for (let row_string of row_strings){
        let row_array = []
        let cell_strings = row_string.split(",")
        for (let cell_string of cell_strings){
            if (is_string_a_number(cell_string)) {
                cell_string = parseFloat(cell_string)
            }
            row_array.push(cell_string)
        }
        result.push(row_array)
    }
    return result
}
///// End CSV //////

function inspect_new_object(new_object_or_path, add_to_stack=true){ //called from Insert menu item and stringify_value
    // still causes jquery infinite error if the below is commented in.
    //if (typeof(new_object_or_path) == "string")  { return new_object_or_path }
    //else { return value_of_path(new_object_or_path) }

    let new_object = (typeof(new_object_or_path) == "string") ?
                        value_of_path(new_object_or_path) :
                        new_object_or_path
    let prop_val = new_object["prototype"]
    let val_str
    if (prop_val == undefined)             { val_str = "undefined" }
    else if (Object.isNewObject(prop_val)) { val_str = inspect_stringify_new_object_clickable_path(prop_val) }
    else                                   { val_str = stringify_value_aux(prop_val) }
    let the_name = new_object.name
    if ((the_name == undefined) && (new_object == Root)) { the_name = '"Root"' }
    else if (the_name == undefined) { the_name = "undefined" }
    else { the_name = '"' + the_name + '"' }
    result = "{prototype: " + val_str  + "<br/>" +
             "&nbsp;name: " + the_name + "<br/>"
    for(let prop in new_object){
        if (new_object.hasOwnProperty(prop) && (prop != "name") && (prop != "prototype")){
            prop_val = new_object[prop]
            if (prop_val == undefined)             { val_str = "undefined" }
            else if (Object.isNewObject(prop_val)) { val_str = inspect_stringify_new_object_clickable_path(prop_val) }
            else                                   { val_str = stringify_value_aux(prop_val) }
            result += "&nbsp;" + prop + ": " +  val_str + "<br/>"
        }
    }
    result += "}"
    if(add_to_stack){ //do this before computing opacity
        inspect_stack.push(new_object)
        inspect_stack_pos = inspect_stack.length - 1
    }
    let prev_opacity = (inspect_stack_pos >= 1) ? 1 : 0.3
    let next_opacity = (inspect_stack_pos < (inspect_stack.length - 1)) ? 1 : 0.3
    result = "<div id='inspector_id' style='background-color:#ffd9b4;'>" +
             "&nbsp;<span             id='inspect_previous_value_id' title='Inspect previous value.' style='color:blue;font-weight:900; opacity:" + prev_opacity + ";'>&lt;</span>" +
             "&nbsp;&nbsp;&nbsp;<span id='inspect_next_value_id'     title='Inspect next value.'     style='color:blue;font-weight:900; opacity:" + next_opacity + ";'>&gt;</span>" +
             "<b style='padding-left:100px;'><i>Inspector</i></b><br/>"  +
             result + "</div>"

    setTimeout(function(){out(result, "black", true)}, 200) //give the regular return value
      //a chance to be rendered, so that the temp browser will be rendered AFTER it,
      //because otherewise the temp browser will be erased by the regular result output.
      //but beware, after the browser html is renderend, we need to set the onclicks,
      //which has a timeout too that must be longer than this timeout.
}
var inspect_stack = []
var inspect_stack_pos = -1
function inspect_previous_value(){
    if(inspect_stack_pos > 0) {
        inspect_stack_pos -= 1
        inspect_new_object(inspect_stack[inspect_stack_pos], false)
    }
}

function inspect_next_value(){
        if(inspect_stack_pos < (inspect_stack.length - 1)) {
            inspect_stack_pos += 1
            inspect_new_object(inspect_stack[inspect_stack_pos], false)
        }
}

function inspect_stringify_new_object_clickable_path(new_obj){
    let path = new_obj.objectPath()
    let id_string = path.replace(/\./g, "_") + "_path_id"
    let result = '<span id="' + id_string + '" style="color:blue; text-decoration:underline;">' + path + '</span/>'
    inspect_set_new_object_onclick(id_string, path)
    return result
}

function inspect_set_new_object_onclick(id_string, path){
    setTimeout(function(){ //we need to wait until the html is actually rendered.
        let fn = function(){ inspect_new_object(path) }
        let elts = window[id_string] //beware, if there's more than one elt with this id, we get an HTMlCollection of the etls.
        // this is a very broken data struture that I can't even test for except with length
        if (elts == undefined) {
           console.log("In inspect_set_new_object_onclick, didn't find: " +  id_string)
        }
        else if (elts.length){
            for(let i = 0; i < elts.length; i++) {
                elts[i].onclick = fn
            }
        }
        else { elts.onclick = fn } //only one
        if(window.inspect_previous_value_id){
            inspect_previous_value_id.onclick = inspect_previous_value
        }
        else {
            console.log("inspect_previous_value_id not bound in inspect_set_new_object_onclick.")
        }
        if(window.inspect_next_value_id) {
            inspect_next_value_id.onclick     = inspect_next_value
        }
        else {
            console.log("inspect_next_value_id not bound in inspect_set_new_object_onclick.")
        }
    }, 1000)
}

function scale_to_micron_factor(scale){
    if (typeof(scale) == "number") { return scale }
    else {
        let num =  {"microns":     1,
                    "millimeters": 1000,
                    "centimeters": 10000,
                    "meters":      1000000,
                    "inches":      25400,
                    "feet":        304800}[scale]
        if (num) { return num }
        else { dde_error("scale_to_factor passed invalid scale: " + scale +
            ' use a number or "microns", "millimeters", "centimeters", "meters", "inches", "feet".')
        }
    }
}

function limit_to_range(value, min=null, max=null){
    let result = value
    if (min){ result = Math.max(result, min) }
    if (max){ result = Math.min(result, max) }
    return result
}

//dxf uses objects but dde standardizes on arrays
function point_object_to_array(xyz_obj){
    return [xyz_obj.x, xyz_obj.y, xyz_obj.z]
}


function scale_point(xyz, scale) {
    return [Math.round(xyz[0] * scale),
            Math.round(xyz[1] * scale),
            Math.round(xyz[2] * scale)]
}

function point_equal(a, b) { return (a[0] == b[0]) && (a[1] == b[1]) && (a[2] == b[2]) }


var Duration = class Duration {
    //DO NOT default minutes to anything as we need null there so that the first arg will be interprested as ms
    constructor(string_or_hours=0, minutes=0, seconds=0, milliseconds=0){ //First arg can be "12:34" for hours:mins,
                                                                         // "12:34:56" for hours:mins:secs,
                                                                         // or 123 for hours
        if (typeof(string_or_hours) == "string") { //presume "12:34"(hours and mins) or "12:34:56" hours, mins, secs
            if (is_hour_colon_minute(string_or_hours) || is_hour_colon_minute_colon_second(string_or_hours)){
                var [h, m, s] = string_or_hours.split(":")
                var secs = parseInt(h) * 60 * 60
                secs += parseInt(m) * 60
                if (s) { secs += parseInt(s) }
                this.milliseconds = secs * 1000 //to get milliseconds
                return
            }
        }
        else if (typeof(string_or_hours) == "number"){
                let secs = (string_or_hours * 60 * 60) + (minutes * 60) + seconds
                this.milliseconds = (secs * 1000) + milliseconds
                return
        }
        throw new Error("new Duration passed arg: " + string_or_hours + " which is not a number or a string of the format 12:34 or 12:34:56 ")
    }
    toString() { return this.to_source_code }

    to_source_code(){
        let total_ms  = this.milliseconds
        let ms        = total_ms  % 1000
        let total_sec = (total_ms - ms)   / 1000
        let sec       = total_sec % 60
        let total_min = (total_sec - sec) / 60
        let min       = total_min % 60
        let hour      = (total_min - min) / 60
        return "new Duration(" + hour + ", " + min + ", " + sec + ", " + ms + ")"
    }

    to_seconds(){ return this.milliseconds / 1000 }
}