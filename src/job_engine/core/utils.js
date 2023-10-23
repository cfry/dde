//import "../../../node_modules/semver/index.js" //error using rollup,  Cannot destructure property 'ANY' of 'require$$26' as it is undefined
//import semver        from "../../../node_modules/semver/index.js"//error  Cannot destructure property 'ANY' of 'require$$26' as it is undefined
//import {SemVer}        from "../../../node_modules/semver/index.js"
//import * as semver from "../../../node_modules/semver/index.js" //todo  require is not defined
 //const semverEq = require('semver/functions/eq')
 //for semver 7, semver.Lt, semver.Gt, and maybe semverEq ???
 //in DDE3, used semver verison "^5.7.1"  I should switch dde4 to using semver 7.
//can't get semver to work in dde4, so using alternative:
//import { compare as compare_semversions } from 'compare-versions';

//import pkg2 from 'compare-versions';
//const { compare_semversions } = pkg2;

import compareVersions from 'compare-versions';
const compare_semversions = compareVersions.compare;

//see https://stackoverflow.com/questions/65547827/how-to-import-npm-semver-on-an-ionic-project-with-angular
//which lies.
//import * as semver from "semver";

//import * as process from "../../../node_modules/process/index.js" //todo module is not defined
//import {Instruction} from "./instruction.js" //now global
//import {Robot, Brain, Dexter, Human, Serial} from './robot.js' //now global
//import * as espree from "espree"; //replaces esprima //now done in load_job_engine.js

//import {isBase64} from "../../../node_modules/is-base64/is-base64.js"
//importing from is_base64 npm module doesn't work, so code inlined below

class Utils {

//_______base64_______
static isBase64(v, opts) {
    if (v instanceof Boolean || typeof v === 'boolean') {
        return false
    }

    if (!(opts instanceof Object)) {
        opts = {}
    }

    if (opts.allowEmpty === false && v === '') {
        return false
    }

    var regex = '(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}==|[A-Za-z0-9+\/]{3}=)?'
    var mimeRegex = '(data:\\w+\\/[a-zA-Z\\+\\-\\.]+;base64,)'

    if (opts.mimeRequired === true) {
        regex =  mimeRegex + regex
    } else if (opts.allowMime === true) {
        regex = mimeRegex + '?' + regex
    }

    if (opts.paddingRequired === false) {
        regex = '(?:[A-Za-z0-9+\\/]{4})*(?:[A-Za-z0-9+\\/]{2}(==)?|[A-Za-z0-9+\\/]{3}=?)?'
    }

    return (new RegExp('^' + regex + '$', 'gi')).test(v)
}

//note that the JS fns atob and btoa are defined in DDE proper
//but are not in node.js so they don't work on the Job Engine.
//So these are defined and will work on both DDE and Job Engine under node.
static base64_to_binary_string(str) {
    return Buffer.from(str, 'base64').toString('binary')
}


static binary_to_base64_string(str) {
    return Buffer.from(str, 'binary').toString('base64')
}

//normal base64 chars are only letters, digits, plus_sign and slash
//but *some* base64 has \n every 76 chars, and sometimes there's a
//trailing newline.
static is_string_base64(a_string, permit_trailing_newline=false) {
    if(typeof(a_string) === "string") {
        if(this.isBase64(a_string)) { return true }
        else if(permit_trailing_newline  &&
            (last(a_string) == "\n") &&
            (this.is_integer(a_string.length - 1) / 4)) {
            //normal base64 length is a multiple of 4. since these strings can be long,
            //I don't want to unnecessarily make a long string
            a_string = a_string.substr(0, (a_string.length - 1))
            return this.isBase64(a_string)
        }
        else { return false }
    }
    else { return false } //this.isBase64(null) => true which is bad, but
    // that's in the pkg I'm using, so I do the extra check to ensure non-strings return false
}
//end base64

//Convert the string into a Uint8Array. from James N. Used in write_file
static string_to_unit8array(str){
    let buf8 = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        buf8[i] = str.charCodeAt(i);
    }
    return buf8
}

static prepend_file_message_maybe(message){
    if (message.startsWith("while loading file:")) { return message }
    else if (globalThis.loading_file) {
        return "while loading file: " + globalThis.loading_file + "<br/>" + message
    }
    else { return message }
}

static dde_error(message){
    let out_string = Utils.prepend_file_message_maybe(message)
    console.log("dde_error: " + out_string)
    var err = new Error();
    var stack_trace = err.stack
    out_string = "<details><summary><span class='dde_error_css_class'>Error: " + out_string +
        "</span></summary>" + stack_trace + "</details>"
    if(globalThis.out) { //when in DDE
        out(out_string)
    }
    else { //when in browser and Job Engine
        SW.append_to_output(out_string)
    }
    throw new Error(message)
}  //global


static warning(message, temp=false){
    if(message){
        let out_string
        let stack_trace = "Sorry, a stack trace is not available."
        try{  //if I don't do this, apparently the new error is actually throw, but
            //it really shouldn't be according to:
            // https://stackoverflow.com/questions/41586293/how-can-i-get-a-js-stack-trace-without-halting-the-script
            let err = new Error();
            stack_trace = Utils.replace_substrings(err.stack, "\n", "<br/>") //don't use "this", use "Utils." because warning can be called without a subject
            //get rid of the "Error " at the beginning
            stack_trace = stack_trace.substring(stack_trace.indexOf(" "))
        }
        catch(an_err) {}
        out_string = "<details><summary><span class='warning_css_class'>Warning: " + Utils.prepend_file_message_maybe(message) +
            "</span></summary>" + stack_trace + "</details>"
        out(out_string, undefined, temp)
    }
} //global (used a lot)

static warning_or_error(message, error=false){
    if(error) { dde_error(message) }
    else      { warning(message) }
}

static shouldnt(message){
    console.log(message)
    if(globalThis.contact_doc_id) {
        DocCode.open_doc(contact_doc_id)
    }
    dde_error("The function: shouldnt has been called.<br/>" +
                    "This means there is a bug in DDE.<br/>" +
                    "Please send a bug report. See User_Guide/Contact.<br/>" +
                    "Include this whole message.<br/>" +
                     Utils.prepend_file_message_maybe(message))
} //global (used a lot)

static version_equal(version_string1, version_string2=dde_version){
    //return semver.eq(version_string1, version_string2)
    return compare_semversions(version_string1, version_string2, "=")
}


static version_less_than(version_string1, version_string2=dde_version){
    //return semver.lt(version_string1, version_string2)
    return compare_semversions(version_string1, version_string2, "<")
}

static version_more_than(version_string1, version_string2=dde_version){
    //return semver.gt(version_string1, version_string2)
    return compare_semversions(version_string1, version_string2, ">")
}


static dde_version_between(min=null, max=null, action="error"){ //"error", "warn", "boolean"
    if (!["error", "warn", "boolean"].includes(action)) {
        dde_error("Utils.dde_version_between passed an invalid value for 'action' of: " + action +
                  ' It must be "error", "warn", or "boolean", with the default of "error". ')
    }
    if (min == null){
        if (max == null) {
            dde_error("Utils.dde_version_between given a null min and max." +
                      "<br/>You must supply at least one on these.")
        }
        //only max
        else if(this.version_more_than(max) || this.version_equal(max)) { return true }
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
        if (this.version_less_than(min) || this.version_equal(min)) { return true }
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
    else if (this.version_equal(min) || this.version_equal(max) ||
             (this.version_less_than(min) && this.version_more_than(max))) { return true }
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


static primitive_types = ["undefined", "boolean", "string", "number"] //beware; leave out null because
  //for some strange reason, null is of type "object"

static is_primitive(data){
    if (data === null) { return true }
    return this.primitive_types.includes(typeof(data))
}


//only checks first char
static is_digit(char){
    if(char.match(/^[0-9]/)) {  return true; }
    else { return false; } 
}


static is_alphanumeric(char) {
    var letterNumber = /^[0-9a-zA-Z]+$/;
    if(char.match(letterNumber)) {  return true; }
    else { return false; }
}


static is_letter(char) {
    var letter = /^[a-zA-Z]+$/;
    if(char.match(letter)) {  return true; }
    else { return false; }
}

static is_upper_case(char) {
    return /[A-Z]/.test(char)
}

static is_lower_case(char) {
    return /[a-z]/.test(char)
}

static is_letter_or_underscore(char) {
    var letter = /^[a-zA-Z_]+$/;
    if(char.match(letter)) {  return true; }
    else { return false; }
}


static is_integer(num) {
    return (typeof num === 'number') && (num % 1 === 0);
}

static is_non_neg_integer(anything){
    return Number.isInteger(anything) && (anything > -1)
}

static is_NaN_null_or_undefined(arg) {
    return (isNaN(arg) || (arg === null) || (arg === undefined) )
}

static is_string_a_integer(a_string){
    if(typeof(a_string) == "string") {
        let pat = /^-?[0-9]+$/;
        if(a_string.match(pat)) {  return true; }
        else { return false; }
    }
    else { return false; }
}

static is_string_a_float(a_string){
    if(typeof(a_string) == "string") {
        let pat = /^-?[0-9]+\.[0-9]+$/;
        if(a_string.match(pat)) {  return true; }
        else { return false; }
    }
    else { return false }
}

static is_string_a_number(a_string){
    return this.is_string_a_integer(a_string) || this.is_string_a_float(a_string)
}

//returns true for strings of the format "rgb(0, 100, 255)" ie the css color specifier
static is_string_a_color_rgb(a_string){
    return a_string.startsWith("rgb(") && a_string.endsWith(")") && a_string.includes(",") //not perfect but quick and pretty good
}

//this will count reserved words (ie "break" as an identifier, which
//isn't what JS thinks of as a valid user variable or fn name identifier
static is_string_an_identifier(a_string){
  let the_regex = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/
  return the_regex.test(a_string)
}

//not perfect as could be escape sequences, internal quotes, but pretty good
static is_string_a_literal_string(a_string){
    if (a_string.length < 2) { return false }
    else if (a_string.startsWith('"') && a_string.endsWith('"')) { return true }
    else if (a_string.startsWith("'") && a_string.endsWith("'")) { return true }
    else if (a_string.startsWith("`") && a_string.endsWith("`")) { return true }
    else { return false }
}

static is_string_a_path(path_string_maybe){
   if(typeof(path_string_maybe) !== "string") { return false }
   else {
       let arr = path_string_maybe.split(".")
       for(let ident of arr) {
           if (!this.is_string_an_identifier(ident)) { return false}
       }
       return true
   }
}

//not perfect as could be escape sequences, internal quotes, but pretty good
static is_string_a_literal_array(a_string){
    if (a_string.startsWith('[') && a_string.endsWith(']')) { return true }
    else { return false }
}



static is_whitespace(a_string){
    return a_string.trim().length == 0
}


//the empty string is considered a comment as is all whitespace strings
//and strings of prefix whitespace followed by // follwoed by no newline
//and whitespace /* some text */ whitespace
static is_comment(a_string){
    a_string = a_string.trim()
    if(a_string.length == 0) { return true }
    else if (a_string.startsWith("//") &&
        (a_string.indexOf("\n") === -1)) {
        return true
    }
    else if (a_string.startsWith("/*") &&
             a_string.endsWith("*/")) {
        return true
    }
    else { return false }
}


static is_literal_object(value){
    if(value === null) { return false } // because typeof(null) == "object")
    else if(typeof(value) == "object") {
        return (Object.getPrototypeOf(value) === Object.getPrototypeOf({}))
    }
    else { return false }
}


//see https://davidwalsh.name/javascript-detect-async-function
static is_async_function(obj){
    if(obj && obj.constructor && (obj.constructor.name == "AsyncFunction")){
        return true
    }
    else { return false }
}

static is_generator_function(obj){
    if(obj && obj.constructor && (obj.constructor.name == "GeneratorFunction")){
        return true
    }
    else { return false }
}



//Beware: this *might* only catch iterators made by generator functions.
static is_iterator(obj){
    if(obj && obj.constructor && Utils.is_generator_function(obj.constructor)){
        return true
    }
    else {
        return false
    }
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
static is_class(obj){
    return ((typeof(obj) == "function") && obj.toString().startsWith("class "))
}


//returns string or null if no class name
static get_class_name(a_class){
    if (typeof(a_class) == "function"){
        const src = a_class.toString()
        if (src.startsWith("class ")){
            const end_of_class_name_pos = src.indexOf("{")
            let result = src.substring(6, end_of_class_name_pos)
            if (result.includes(" extends ")) {
                let name_split = result.split(" ")
                result = name_split[2] + "." + name_split[0]
            }
            return result.trim()
        }
    }
    return null
}

static get_class_of_instance(instance){
    return instance.constructor
}



//______color_______
static rgb(r, g, b){return "rgb("+r+", "+g+", "+b+")"} //global this string used in css

// "rgb(2, 3, 123)" => [2, 3, 123]
static rgb_string_to_integer_array(str){
    str = str.substring(4, str.length - 1)
    let result = str.split(",")
    result[0] = parseInt(result[0])
    result[1] = parseInt(result[1])
    result[2] = parseInt(result[2])
    return result
}

//result is arr of 3 ints, each 0 to 255
static hex_to_rgb_integer_array(hex) {
    // Remove the # character if present
    hex = hex.replace("#", "");

    // Convert the hex value to RGB values
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);

    // Return the RGB values as an object
    return [r, g, b ]
}

//arr3 expected to have elts that are integers, 0 thru 255
static rgb_integer_array_to_hex(arr3){
    let result = "#"
    let str =  arr3[0].toString(16)
    if(str.length === 1) {str = "0" + str}
    else if(str.length > 2) { str = "ff" }
    result += str

    str =  arr3[1].toString(16)
    if(str.length === 1) {str = "0" + str}
    if(str.length > 2) { str = "ff" }
    result += str

    str =  arr3[2].toString(16)
    if(str.length === 1) {str = "0" + str}
    if(str.length > 2) { str = "ff" }
    result += str
    return result
}

//not called oct 23, 2921
static integer_array_to_rgb_string(arr3){
    return "rgb(" + arr3[0] + ", " + arr3[1] + ", " + arr3[2] + ")"
}

//Utils.pad_integer(123, 5, "x") => "xx123"
static pad_integer(int, places=3, pad_char="0"){
    let result = "" + int
    if (result.length < places) { result = pad_char.repeat(places - result.length) + result}
    return result
}

//used in computing numbers to display in the robot_status dialog
static to_fixed_smart(num, digits=0){
    if(typeof(num) === "number") {
        try{ return num.toFixed(digits)}
        catch(err){
            warning("Utils.to_fixed_smart called with non_number: " + num)
            return "" + num
        }
    }
    else { return num } //presume its a string like "N/A" and leave it alone.
}


static starts_with_one_of(a_string, possible_starting_strings){
    for (let str of possible_starting_strings){
        if (a_string.startsWith(str)) { return true }
    }
    return false
}

//returns array of one of the strs in possible_matching_strings
// and its starting index within a_string
// if no matches, returns [null, -1]
static index_of_first_one_of(a_string, possible_matching_strings, starting_pos=0){
    let a_string_length_limit = 100000000 //100 million. we're not expecting a_string to be longerr than that!
    if(a_string >= a_string_length_limit){
        dde_error("Utils.index_of_first_one_of passed string of length >= " +
                   a_string_length_limit +
                   " which is too long to handle.")
    }
    let matching_string = null
    let matching_index  = a_string_length_limit
    for(let possible_maching_string of possible_matching_strings){
        let index = a_string.indexOf(possible_maching_string, starting_pos)
        if((index !== -1) && (index < matching_index)){
            matching_string = possible_maching_string
            matching_index = index
        }
    }
    if (matching_index === a_string_length_limit) { matching_index = -1 }
    return [matching_string, matching_index]
}

static ends_with_one_of(a_string, possible_ending_strings){
    for (let str of possible_ending_strings){
        if (a_string.endsWith(str)) return true
    }
    return false
}


//the default for Robot Serial.sim_fun
static return_first_arg(arg){ return arg }

static typed_array_name(item){
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
static last(arg){
    let len = arg.length
    if (len == 0)                     { return undefined }
    else if (typeof(arg) == "string") { return arg[len - 1 ] }
    else if (Array.isArray(arg))      { return arg[len - 1] }
    else if (arg instanceof NodeList) { return arg[len - 1] }
    else if (arg instanceof HTMLCollection) { return arg[len - 1] }
    else                              { dde_error("last passed unhandled type of arg: " + arg) }
} //global


static flatten(arr, result=[]){
    if (Array.isArray(arr)){
        for (let elt of arr){
            this.flatten(elt, result)
        }
    }
    else { result.push(arr) }
    return result
}

//if length is null, a_array can be any length.
// but if it is an integer, the array must
//be of that length to return true
static is_array_of_numbers(a_array, length=null, min=null, max=null){
    if(!Array.isArray(a_array)) { return false }
    if((typeof(length) === "number") &&
       (a_array.length !== length)) { return false }
    for(let num of a_array){
        if((typeof(num) !== "number") ||
            Number.isNaN(num)){
            return false
        }
        else if ((typeof(min) === "number") &&
                 (num < min)){
                return false
        }
        else if ((typeof(min) === "number") &&
            (num > max)){
            return false
        }
    }
    return true
}

static is_2D_array_of_numbers(a_array){
    if(!Array.isArray(a_array)) { return false }
    else {
        for(let inner_array of a_array){
            if(!Utils.is_array_of_numbers(inner_array)) {
                return false
            }
        }
        return true
    }
}

//used by inspector for printing 2D arrays
static is_array_of_same_lengthed_arrays(array){
  if (array.length < 2) { return false }
  let len = null
  for(let arr of array) {
    if (!Array.isArray(arr))     { return false }
    else if (len === null)       { len = arr.length }
    else if (arr.length !== len) { return false }
  }
  return true
}

//written because JS built in slice doesn't work
//with just the first arg, returns a shallow copy of the first arg
//otherwise returns an array with the elements starting with start_index
//and up through but not including end_index.
//end_index defaults to the length of the array
//if end index is longer than array it will be set to the length of the array.
//if end index is the length of the array, subarray will copy arr elts from
//start_index through end of arr.
static subarray(arr, start_index=0, end_index){
    if(end_index === undefined) { end_index = arr.length}
    end_index = Math.min(end_index, arr.length) //permit passed in end_index to be longer than arr, and don't error, just copy over to end of array
    let result = []
    for(let index = start_index; index < end_index; index++){
        result.push(arr[index])
    }
    return result
}

// for [1, 2] and [2, 1] will return true
static arrays_have_same_elements(arr1, arr2){
    if(arr1.length === arr2.length){
        for(let elt of arr1){
            if(!(arr2.includes(elt))) {
                return false
            }
        }
        return true
    }
    else { return false }
}

//_____ set operations______
static intersection(arr1, arr2){
    let result = []
    for(let elt of arr1) {
        if (arr2.includes(elt)) { result.push(elt) }
    }
    return result
}

// elements from arr1 that are not in arr2
static difference(arr1, arr2){
    let result = []
    for(let elt of arr1) {
        if (!arr2.includes(elt)) { result.push(elt) }
    }
    return result
}

// elements that are in arr1 and not in arr2 AND
// elements that are in arr2 and not in arr1
static symmetric_difference(arr1, arr2){
    let result = this.difference(arr1, arr2)
    let more = this.difference(arr2, arr1)
    return result.concat(more)
}

//result does not contain duplicates
static union(arr1, arr2){
      return [...new Set([...arr1, ...arr2])]
}

//result does not contain duplicates
static de_duplicate(arr1){
    return [...new Set(arr1)]
}

//_____ end set operations______

static similar(arg1, arg2, tolerance=0, tolerance_is_percent=false, arg1_already_seen=[], arg2_already_seen=[]){
    //I started to do a infinite circularity test but its trick to do quickly and maybe unnecessary because
    //if say 2 arrays both have themselves as the 3rd elt, and the 2 arrays are eq to begin with, that
    //will get caught in the very first === so no infinite recursion.
    //now if we had 2 arrays that were both different and had themselves as only element,
    //we should be able to conclude that the 2 arrays are similar.
    //All very tricky!
    if(arg1 === arg2) {return true} //handles null case
    else if (Number.isNaN(arg1) && Number.isNaN(arg2)) { return true } //because undesigned JS has NaN != NaN
    let arg1_type = typeof(arg1)
    if (arg1_type !== typeof(arg2)) { return false }
    //ok now we know their js "types" are the same but beware, null is of type "object"
    else if (arg1 === null) { return false } //because if both were null, it would have been caught by === above
    else if (arg2 === null) { return false }
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
    else if(Utils.is_primitive(arg1)) { return false } //if one of the args is primitive, then if it was similar to th other,
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
                    if (!Utils.similar(arg1[i], arg2[i], tolerance, tolerance_is_percent, arg1_already_seen, arg2_already_seen)){
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
        //if (!Utils.similar(props1, props2)) { return false } //not good since same elts but different order will return false
        if (!Utils.arrays_have_same_elements(props1, props2)){ return false } //needed because the props *might* be in a different order, which is ok
        for (let prop of props1){
            if (!Utils.similar(arg1[prop], arg2[prop], tolerance, tolerance_is_percent)) { return false}
        }
        return true
    }
} //global used in test suites a lot


//return 0 if very dissimilar, 1 if the same (or very similar)
//now working only for num1 and num2, min, max being non neg
static number_similarity(num1, num2, min=null, max=null){
    if (num1 == num2) { return 1 }
    if (num1 > num2) {  //swap: ensure that num1 is less than num2.
        let temp = num1;
        num1 = num2;
        num2 = temp
    }
    if(num1 >= 0){ //means num2 will be > 0
        if(min === null)  { min = 0 }
        if(max === null)  { max = num2 }
    }
    else if (num2 <= 0) { //means num1 is also less than 0 }
        if (max === null) { max = 0 }
        if (min === null) { min = num1 }
        //now we've defaulted min and max. so now shift all 4 numbers to positive
        num1 = Math.abs(num1)
        num2 = Math.abs(num2)
        let temp = num1;
        num1 = num2;
        num2 = temp
        let orig_min = min
        min = Math.abs(max)
        max = Math.abs(orig_min)
    }
    else { //num1 is < 0 and num2 is >= 0
        let inc_by = num1 * -1
        num1 += inc_by //num1 is now 0
        num2 += inc_by
        if (min === null) { min = num1 }
        else { min += inc_by }
        if (max === null) { max = num2 }
        else { max += inc_by }
    }
    let range = max - min
    let new_max = range //so now min is effectively 0
    num1 -= min
    num2 -= min
    let num1_ratio = num1 / new_max  //0 to 1
    let num2_ratio = num2 / new_max  //0 to 1
    let raw_score = Math.abs(num1_ratio - num2_ratio)
    return 1 - raw_score
}


//arrays can be arrays, or can be a random objects.
//all must be of the same type and have elts of the same names with the same values
//compared with ===
static same_elts(...arrays){
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

static line_starting_with(text, starting_with, include_starting_with){
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

static encode_quotes(text){
    text = text.split("'").join("ssqq")
    text = text.split('"').join("ddqq")
    text = text.split('\n').join("nnll")
    return text
}

static decode_quotes(text){
    text = text.split("ssqq").join("'")
    text = text.split('ddqq').join('"')
    text = text.split('nnll').join('\n')
    return text
}

static constant_spaces = "                                                                              "
static spaces(number_of_spaces_desired){
    return this.constant_spaces.substring(0, number_of_spaces_desired)
}

//from http://eddmann.com/posts/ten-ways-to-reverse-a-string-in-javascript/ which tests this to be fastest
static reverse_string(s) {
    var o = '';
    for (var i = s.length - 1; i >= 0; i--)
        o += s[i];
    return o;
}

static insert_string(base_string, insert_string, position=0){
    if(position > base_string.length) {
        position = base_string.length
    }
    return base_string.substring(0, position) +
        insert_string +
        base_string.substring(position)
}
/*
insert_string("abc", "def")
insert_string("abc", "def", 100)
insert_string("abc", "def", 1)
*/
    //used by OpenAI text_to_data for "code"
static insert_outs_after_logs(base_string){
    let result = base_string
    let log_end_pos = 0
    for(let i = 0; i < 1000; i++){
        let log_start_pos = result.indexOf("console.log(", log_end_pos)
        if(log_start_pos === -1) { return result } //no more calls to console.log
        let open_paren_pos  = log_start_pos + 11
        let close_paren_pos = Editor.find_matching_close(result, open_paren_pos)
        if(close_paren_pos === null) {  //couldn't find the end of this console.log so pretend the code is just bad and return the result we've got so far. No more insertions.
            return result
        }
        if((close_paren_pos < result.length) &&
            (result[close_paren_pos + 1] === ";")){
            log_end_pos = close_paren_pos + 1
        }
        else {
            log_end_pos = close_paren_pos
        }
        let args = result.substring(open_paren_pos + 1, close_paren_pos)
        let out_str = "\nout(Utils.args_to_string(" + args + "))\n"
        result = Utils.insert_string(result, out_str, log_end_pos + 1)
    }
    dde_error("insert_outs_after_logs passed base_string with over 1 Million 'console.logs(' in it.")
}
/*
insert_outs_after_logs("")
insert_outs_after_logs("abc")
insert_outs_after_logs("console.log(222)")
insert_outs_after_logs("console.log(222);")
insert_outs_after_logs("abc console.log(222); def")
insert_outs_after_logs("abc console.log(junk(4, 5)); def")

insert_outs_after_logs("abc console.log(222); def console.log(333)")
*/

//returns an array of width an height of a_string with the given font_size
//font size is either a number or a string with a px suffix
static compute_string_size(a_string, font_size=12, extra_width = 0){
    if(typeof(font_size) == "number") { font_size = font_size + "px"}
    //at this point, font_size is a string with a px suffix
    compute_string_size_id.style["font-size"] = font_size
    compute_string_size_id.innerText = a_string
    return [compute_string_size_id.clientWidth + extra_width, compute_string_size_id.clientHeight]
}

//avoids calling eval. If the path isn't defined, this fn returns undefined.
//arg can either be a string with dots or an array of strings that are path elts.
static value_of_path(path_string){
    let path = path_string
    if (typeof(path) == "string"){ path = path.split(".") }
    else if(Array.isArray(path)) { } //ok as is
    else {
        dde_error("value_of_path passed: " + path_string + " which is not a string or an array.")
    }
    let result
    if(globalThis[path[0]] !== undefined) { result = globalThis} //window } //window errors in job engine
    //note globalThis["window"] returns the window obj so the arg can be "window" and we still win
    else if (Object.prototype[path[0]] !== undefined) { result = Object.prototype }
    else { return undefined }
    for (var path_elt of path){
        result = result[path_elt]
        if (result === undefined) {break}
    }
    return result
} //global (used a lot)

//returns null if fn_src doesn't look like a fn def.
//returns "" if its an anonymous fn
//else returns the fn name
//beware: js is clever about assigning names to annonymous fns if
//th happen to be bound to a keyword arg to a fn,
//In such cases, some.fn.name might yield the name its bound to,
//not the name its given in its source code.
static function_name(fn_or_src){
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
static function_params(fn, include_parens=true){
    let src = fn.toString() //dde4, when fn is the class obj for Job, returns src with "Job$1" in it.
    src = src.replaceAll("Job$1", "Job")
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
        for (let i = 0; i < fn.length; i++) {
            result += prefix + i
            if (i != (fn.length - 1)) { result += ", "}
        }
    }
    if (include_parens){ result = "(" + result + ")" }
    return result
}

//keyword calls & fns have just one block of {} in the params
//with no space between the ( and the {.
//ie foo({a:2})
static call_src_is_keyword_call(a_string){
  let open_pos = a_string.indexOf("(")
  if (open_pos == -1) { return false }
  let brace_pos = a_string.indexOf("{")
  return (open_pos + 1) == brace_pos
}

//if fn is a class, look at the args of its constructor. If no constructor, return false
static fn_is_keyword_fn(fn){
    let a_string = fn.toString()
    if(a_string.startsWith("class ")){
        let constructor_pos = a_string.indexOf("constructor")
        if(constructor_pos == -1) { return false }
        a_string = a_string.substring(constructor_pos) //this *could* fail if there is no class constructor (you have to explicitly make one) and the "constructor" word is somewhere in the class body.
    }
    let open_pos = a_string.indexOf("(")
    if (open_pos == -1) { return false }
    let brace_pos = a_string.indexOf("{")
    return (open_pos + 1) == brace_pos
}

//returns a string
static function_params_for_keyword_call(fn, include_parens=true){
    let result = this.function_params(fn, include_parens)
    if (result.endsWith("={})")) {
        result = result.substring(0, result.length - 4)
        if(include_parens) { result += ")" }
    }
    else if (result.endsWith("= {})")) {
        result = result.substring(0, result.length - 5)
        if(include_parens) { result += ")" }
    }
    result = this.replace_substrings(result, "=", ":")
    return result
}

//fn can be a constructor or other method who's src string doesn't have to start with "function".
//we really only care about the text between the first paren and the first ")}", exclusive
//returns an array of strings, the names of the params
//function(a, {b=2, c=3}){ return 99}   returns ["a", "b", "c"]
static function_param_names(fn){
    var params_full_string = this.function_params(fn, false)
    return this.params_string_to_param_names(params_full_string)
}


//used only by this file
//params_full_string can either be wrapped in parens or not
static params_string_to_param_names(params_full_string){
    if (params_full_string.startsWith("(")) {params_full_string = params_full_string.substring(1)}
    if (params_full_string.endsWith(")"))   {params_full_string = params_full_string.substring(0, params_full_string.length - 1)}
    params_full_string = this.remove_comments(params_full_string)
    var params_and_defaults_array = params_full_string.split(",")
    var param_names = []
    for(var param_and_default of params_and_defaults_array){
        param_and_default = param_and_default.trim()
        if (param_and_default.startsWith("{")){
            var inner_params_and_defaults = param_and_default.substring(1) //cut off {
            if(inner_params_and_defaults.endsWith("}")) {
                 inner_params_and_defaults = param_and_default.substring(0, param_and_default.length -1) //cut off }
            }
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

//for function foo({a:1}={}){} => {a:1},
//other cases returns an array of inner arrays of param_name, param_default_val
static function_param_names_and_defaults(fn){
    let params_full_string = this.function_params(fn, false)
    let params_string = params_full_string
    if (params_full_string.startsWith("{")){
        if (params_full_string.endsWith("= {}") ||
            params_full_string.endsWith("={}")){
            let closing_equal = params_full_string.lastIndexOf("=")
            params_string = params_full_string.substring(0, closing_equal).trim()
        }
        params_string = this.replace_substrings(params_string, "\\n", " ")
        var inner_params_and_defaults = params_string.substring(1, params_string.length -1) //cut off { and }
        var inner_params_and_defaults_array = inner_params_and_defaults.split(",")
        var param_names = []
        for(let inner_param_and_default of inner_params_and_defaults_array){
            inner_param_and_default = inner_param_and_default.trim()
            let the_param_default_array = inner_param_and_default.split("=")
            the_param_default_array[0] = the_param_default_array[0].trim()
            the_param_default_array[1] = the_param_default_array[1].trim()
            param_names.push(the_param_default_array)
            //obj[the_param_default_array[0]] = the_param_default_array[1]
        }
        return [param_names, "{}"]
    }
    else { return this.params_string_to_param_names_and_defaults(params_full_string) }
}


//returns an array of arrays. Each param is represented as an a array of
//1 or 2 elements. The first elt is the param name (string) and
// the 2nd elt is the default value src (which might be the symbol undefined or its a string of src
//if you have a fn of function foo(a, b=2 {c=3, d=4}, {e=5, f=6}={}) {} then this function returns
//the param names and the SOURCE CODE of the default values.
//[["a", "undefined"], ["b","2"], ["", {c="3", d="4"}], ["", {e:"5", f:"6"}] }
//if grab_key_vals is false, the keyword name will be "" and
// the arg will be a string, ie "{a=3, b=4}"
//but if its true we have an arg for each of the actual keywords and
//the values will be the defaults for that keyword
static function_param_names_and_defaults_array(fn, grab_key_vals=false){
    if(typeof(fn) == "string") {
        if(["function", "function*"].includes(fn)){
            return [["name", ""], ["...params", ""], ["body", ""]]
        }
        else if(fn == "new Array") { return [["...elts", ""]] }
        else if(fn.startsWith("new ")) {
            let class_name = fn.substring(4) //warning, could be "Job$1"
            if(class_name.endsWith("$1")) {  //happens when called from MiRecord, clicking the Record button
               class_name = class_name.substring(0, class_name.length - 2) //cut off the "$1". Kludge from dde4 rollup, etc.
            }
            let fn_val = value_of_path(class_name)
            if (typeof(fn_val) != "function") {
                dde_error("Utils.function_param_names_and_defaults_array called with non function: " + fn)
            }
            else { fn = fn_val }
        }
        else {
            let fn_val = value_of_path(fn)
            if (typeof(fn_val) != "function") {
                dde_error("Utils.function_param_names_and_defaults_array called with non function: " + fn)
            }
            else { fn = fn_val }
        }
    }
    if(fn.name == "Array") { return [["...elts", ""]]}
    let param_string = "function foo(" + this.function_params(fn, false) + "){}"
    //espree doc at https://github.com/eslint/espree
    let ast = Espree.parse(param_string, {range: true, ecmaVersion: "latest"}) //, raw: true})
    let params_ast = ast.body[0].params
    let result = []
    for (let param_ast of params_ast){
        let name
        let val_src
        switch(param_ast.type){
            case "Identifier":
                result.push([param_ast.name, undefined])
                break;
            case "AssignmentPattern": //ie has an equal sign
                if (param_ast.left.type == "Identifier"){ //ie a = 2
                    name = param_ast.left.name
                    val_src = Utils.param_names_get_default_val_src(param_string, param_ast.right)
                    result.push([name, val_src])
                }
                else if (param_ast.left.type == "ObjectPattern"){  //ie {a:2} = {}
                    if(grab_key_vals){
                        for(let prop of param_ast.left.properties){
                            let ass_pat_ast = prop.value
                            if(ass_pat_ast.type == "Identifier"){ //there's no default value
                                name = ass_pat_ast.name
                                val_src = "undefined"
                            }
                            else{ //should be ass_pat_ast.type == "AssignmentPattern"
                                name = ass_pat_ast.left.name
                                val_src = this.param_names_get_default_val_src(param_string,
                                    ass_pat_ast.right)
                            }
                            result.push([name, val_src])
                        }
                    }
                    else {
                        name = "" //no real param name
                        val_src = this.param_names_get_default_val_src(param_string, param_ast.left)
                        result.push([name, val_src])
                    }
                }
                break;
            case "ObjectPattern": //ie {a:2, b:3}
                if(grab_key_vals){
                    for(let prop of param_ast.properties){
                    	let ass_pat_ast = prop.value
                    	if(ass_pat_ast.type == "Identifier"){ //there's no default value
                            name = ass_pat_ast.name
                            val_src = this.param_names_get_default_val_src(param_string, ass_pat_ast)
                        }
                        else{ //should be ass_pat_ast.type == "AssignmentPattern"
                            name = ass_pat_ast.left.name
                            val_src = this.param_names_get_default_val_src(param_string,
                                                                          ass_pat_ast.right)
                        }
                        result.push([name, val_src])
                    }
                }
                else {
                    name = "" //no real param name
                    val_src = this.param_names_get_default_val_src(param_string,
                                                              param_ast)
                    result.push([name, val_src])
                }
                break;
            case "RestElement": //rest elts can't take a default value
                result.push(["..." + param_ast.argument.name, undefined])
                break;
            default:
                shouldnt("in param_names_and_defaults_array for fn: " + fn)
        }//end switch
    }//end for
    return result
}


//only called in this file.
static param_names_get_default_val_src(full_string, ast){
    return full_string.substring(ast.range[0], ast.range[1])
}

static remove_comments(a_string) {
    while(true){
        let start_index = a_string.indexOf("/*")
        let end_index
        if(start_index !== -1) {
            end_index = a_string.indexOf("*/")
            if(end_index !== -1){
                a_string = a_string.substring(0, start_index) + a_string.substring(end_index + 2)
            }
            else {
                a_string = a_string.substring(0, start_index) //nothing left in string so stop
                break;
            } //remove all the way to the end. Not always right, but the string is screwed up anyway.
        }
        else {
            start_index = a_string.indexOf("//")
            if(start_index !== -1) {
                end_index = a_string.indexOf("\n", start_index)
                if(end_index !== -1){
                    a_string = a_string.substring(0, start_index) + a_string.substring(end_index + 1)
                }
                else {
                    a_string = a_string.substring(0, start_index) //nothing left in string so stop
                    break;
                } //remove all the way to the end. Not always right, but the string is screwed up anyway.
            }
            else { break; } //no more comments to remove
        }
    }
    return a_string
}
//only called in this file.
//params_full_string can either be wrapped in parens or not
//returns an array of 2 elt arrays, name and default val.
static params_string_to_param_names_and_defaults(params_full_string){
    if (params_full_string.startsWith("(")) {params_full_string = params_full_string.substring(1)}
    if (params_full_string.endsWith(")"))   {params_full_string = params_full_string.substring(0, params_full_string.length - 1)}
    params_full_string = this.remove_comments(params_full_string).trim()
    if (params_full_string.startsWith("{")) {params_full_string = params_full_string.substring(1)}
    if (params_full_string.endsWith("}"))   {params_full_string = params_full_string.substring(0, params_full_string.length - 1)}

    var params_and_defaults_array = params_full_string.split(",")
    var param_names = []
    for(var param_and_default of params_and_defaults_array){
        param_and_default = param_and_default.trim()
        if (param_and_default.startsWith("{")){
            var inner_params_and_defaults = param_and_default.substring(1, param_and_default.length -1) //cut off { and }
            var inner_params_and_defaults_array = inner_params_and_defaults.split(",")
            for(var inner_param_and_default of inner_params_and_defaults_array){
                inner_param_and_default = inner_param_and_default.trim()
                let the_param_default_array = inner_param_and_default.split("=")
                the_param_default_array[0] = the_param_default_array[0].trim()
                the_param_default_array[1] = the_param_default_array[1].trim()
                param_names.push(the_param_default_array)
            }
        }
        else {
            let equal_pos = param_and_default.indexOf("=")
            let the_param_default_array
            if (equal_pos != -1){
                let the_param = param_and_default.substring(0, equal_pos).trim()
                let the_default = param_and_default.substring(equal_pos + 1).trim()
                the_param_default_array = [the_param, the_default]
            }
            else {
                the_param_default_array = [param_and_default.trim(), undefined]
            }
            param_names.push(the_param_default_array)
        }
    }
    return param_names
}

//fn can be either function foo({a:2}={}) style or function foo(a, b=3) style params
//returns {param_name: "default_val", ...} ie the values are src, not actual js vals
//with the returned value, you can call Object.keys(returned_lit_obj)
//and get back the names of the args in their proper order.
static function_param_names_and_defaults_lit_obj(fn){
    let params_full_string = this.function_params(fn, false)
    //let params_string = params_full_string
    if (params_full_string.startsWith("{")){
        if (params_full_string.endsWith("= {}") ||
            params_full_string.endsWith("={}")){
            let closing_equal = params_full_string.lastIndexOf("=")
            params_full_string = params_full_string.substring(0, closing_equal).trim()
        }
        //cut off both open and close brace
        if(params_full_string.endsWith("}")) { params_full_string = params_full_string.substring(0, params_full_string.length - 1) }
        params_full_string = params_full_string.substring(1)
    }
    /*    params_string = this.replace_substrings(params_string, "\\n", " ")
        var inner_params_and_defaults = params_string.substring(1, params_string.length -1) //cut off { and }
        var inner_params_and_defaults_array = inner_params_and_defaults.split(",")
        var param_names = []
        for(let inner_param_and_default of inner_params_and_defaults_array){
            inner_param_and_default = inner_param_and_default.trim()
            let the_param_default_array = inner_param_and_default.split("=")
            the_param_default_array[0] = the_param_default_array[0].trim()
            if(typeof(the_param_default_array[1]) == "string") { //ie there is a default
                the_param_default_array[1] = the_param_default_array[1].trim()
            }
            param_names.push(the_param_default_array)
            //obj[the_param_default_array[0]] = the_param_default_array[1]
        }
        return [param_names, "{}"]
    }
    else {*/
        let array_of_arrays = this.params_string_to_param_names_and_defaults(params_full_string)
        let result = {}
        for (let name_val of array_of_arrays) {
            result[name_val[0]] = name_val[1]
        }
        return result
    //}
}


//not general purpose
static shallow_copy(obj){ //copies only enumerable, own properites. Used in
                            //copying Job's user_data at start
    let result = obj
    if(result === null) {} //typeof returns "object" for null
    else if(Array.isArray(obj)){
        result = []
        for (let elt of obj) { result.push(elt) }
    }
    else if (typeof(obj) == "object"){ //typeof returns "object" for null
        result = {}
        for(let name of Object.keys(obj)){
            result[name] = obj[name]
        }
    }
    return result //might be a Date, I hope that's not mungable
}

static shallow_copy_lit_obj(obj){ //copies only enumerable, own properites. Used in
    //copying Job's user_data at start
    let result = {}
    for(let name of Object.keys(obj)){
        result[name] = this.shallow_copy(obj[name])
    }
    return result
}

//used to fix broken ES6 not allowing a keyword obj with destructuring.
                             //defaults   keyword_args
static copy_missing_fields(source_arg, target_obj){
    for(var name of Object.getOwnPropertyNames(source_arg)){
        if (!target_obj.hasOwnProperty(name)){
            var new_val = source_arg[name]
            if (new_val == "required"){
                shouldnt("Utils.copy_missing_fields passed target object: " + target_obj +
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


//does not trim the beginning of the string. Used by trim_string_for_eval
//note regex "s" matches spaces, newlines, tab at least, ie all whitespace
static trim_end(str){
    return str.replace(/\s+$/g, "")
}

//removes prefix, & suffix whitespace AND replaces multiple
//redundant interior whitespace with a single space.
static trim_all(str){
    str = str.trim()
    return str.replace(/\s+/g,' ')
}

static trim_string_quotes(a_string){
    if(a_string.length < 2) {return a_string}
    const first_char = a_string[0]
    if (["'", '"', "`"].includes(first_char)){
        if (last(a_string) == first_char){
            return a_string.substring(1, a_string.length - 1)
        }
    }
    return a_string
}

//returns a string that starts with the first char of src
//by trimming whitespace and comments from the front of src
//used by Control.include_job
static trim_comments_from_front(src){
    src = src.trimLeft()
    if(src.startsWith("//")) {
        let end = src.indexOf("\n")
        if(end == -1){ return "" } //src was a one-liner comment
        else {
            src = src.substring(end + 1)
            return this.trim_comments_from_front(src)
        }
    }
    else if(src.startsWith("/*")) {
        let end = src.indexOf("*/")
        if(end == -1) { //crap, we've got a faulty multi-line comment.
            return ""
        }
        else {
            src = src.substring(end + 2)
            return this.trim_comments_from_front(src)
        }
    }
    else { return src }
}

static show_string_char_codes(a_string){
    console.log(a_string + " has " + a_string.length + " chars of:")
    for(let char of a_string){
        console.log(char + "=>" + char.charCodeAt())
    }
}

//only used in this file
static regexp_escape_special_chars(str){
    return str.replace(/[-\/\\^$*+?.()|\[\]{}]/g, '\\$&')
}


//the first arg to new RegExp is a regexp pattern that treats
//lots of punctuation chars like parens specially.
//To turn off that special treatment, pass in a 4th arg of false
static replace_substrings(orig_string, substring_to_replace, replacement, substring_to_replace_treated_specially=true){
    if(!substring_to_replace_treated_specially) {
        substring_to_replace = Utils.regexp_escape_special_chars(substring_to_replace)
    }
    return orig_string.replace(new RegExp(substring_to_replace, 'g'), replacement);
} //global (used a lot)


//not used Jan 2019 except in testsuite
//the use of this fn is to left pad a number with spaces so that the
//decimal point comes at the same char position in a set of
//numbers passed to this fn with the same non-first args.
//After the decimal point is padded with zeros if
//there aren't enough regular post decimal point numbers.
// the end is padded with zeros.
//if digits are cut on the end, the last digit in the result is rounded
//to reflect the cut digits.
//returns a string whose length is digits_before_point + digits_after_point
// + 1 (for the decinmat point, plus 1 if allow_for_negative is true.
//returned string will be longer than that if num is bigger than can fit in digits_before_point,
//but it won't be shorter. So calls should have the largest digits_before_point expected,
//and should only set allow_for_negative to false when they know the num args in
// a displayed result set will never have a neg number.
static format_number(num, digits_before_point=6, digits_after_point=3, allow_for_negative=true){
    let result = num.toFixed(digits_after_point)
    let min_chars_before_point = digits_before_point + (allow_for_negative ? 1 : 0)
    let point_pos = result.indexOf(".")
    if (point_pos == -1) { point_pos = result.length }
    let needed_spaces_count = min_chars_before_point - point_pos
    if (needed_spaces_count > 0) {
        let needed_spaces = " ".repeat(needed_spaces_count)
        result = needed_spaces + result
    }
    return result
}

static array_to_html_table(values_array, labels_array=null, header_array=null, zeropad=3){
    if(labels_array == null) {
        labels_array = Array.from(Array(values_array.length).keys())
    }
    let result = "<table>"
    if(header_array){
        result += "<tr><th>" + header_array[0] + "</th><th>" + header_array[1] + "</th></tr>"
    }
    for(let i = 0; i < values_array.length; i++){
        let numstr = this.format_number(values_array[i])
        numstr = this.replace_substrings(numstr, " ", "&nbsp;")
        result += "<tr><td>" + labels_array[i] + "</td><td style='font-family:monospace;'>" + numstr + "</td></tr>"
    }
    result += "</table>"
    return result
}

// Utils.ordinal_string(0) => "0th"   Utils.ordinal_string(1) => "1st"
// Utils.ordinal_string(11) => "11th" Utils.ordinal_string(21) => "21st"
static ordinal_string(n){
    let suffix = ["st","nd","rd"][((n+90)%100-10)%10-1]||"th"
    return n + suffix
}

//used by users in calling  DXF.init_drawing for its dxf_filepath arg
static text_to_lines(text) { return txt.text_to_lines(text) }

//fry's get a js string into literal source code. Used in printout out a TestSuite test
static string_to_literal(a_string){
    if      (a_string.includes("\n")) {return '`' + a_string + '`'} //let's hope any backquotes in a_string are escaped!
    else if (!a_string.includes('"')) { return '"' + a_string + '"'}
    else if (!a_string.includes("'")) { return "'" + a_string + "'"}
    else if (!a_string.includes("`")) { return "`" + a_string + "`"}
    else {
        a_string = a_string.replace(/\"/g, '\\"')
        return '"' + a_string + '"'
    }
}

//not used jan 2019
static is_first_letter_upper_case(a_string){
    return ((a_string.length > 0) && (a_string[0] == a_string[0].toUpperCase()))
}

//not used jan 2019
static is_first_letter_lower_case(a_string){
    return ((a_string.length > 0) && (a_string[0] == a_string[0].toLowerCase()))
}

//not used jan 2019
static  make_first_char_upper_case(a_string){
    if(a_string.length == 0) { return "" }
    if (this.is_first_letter_upper_case(a_string)) { return a_string }
    else {
        let first_char = a_string[0].toUpperCase()
        return first_char + a_string.substring(1)
    }
}

//retuns "a" or "an" depending on first letter of str
static a_or_an(str="", capitalize=false){
  if(str.length == 0) {
       if(capitalize ) { return "A" }
       else { return "a" }
  }
  else if ("aeiouAEIOU".includes(str[0])) {
      if(capitalize ) { return "An" }
      else { return "an" }
  }
  else {
        if(capitalize ) { return "A" }
        else { return "a" }}
}


 //uses html to format newlines
//use for printing ANY possible value from JS so that a human (usually a programmer) can make sense of it.
//Use this,stringify_value_sans_html  for evalable string (but still not perfrect
//returns a string.
//called on the eval result by eval part 2, and by show_output if the input is not already a string
//and by Js_info
static stringify_value(value){
        var result = this.stringify_value_aux (value)
        //if (typeof(value) != "string"){
        //    result = "<code>" + result + "</code>"
        //}
        return result
}


static stringify_value_aux(value, job, depth=0){
    if (depth > 2) { return "***" } //stops infinite recustion in circular structures.
    var result
    if      (value === undefined)       { return "undefined" }
    else if (value === null)            { return "null" } //since typeof(null) == "object", this must be before the typeof(value) == "object" clause
    else if (value === globalThis)      { return "{globalThis object: stores globals}" } //too many weird values in there and too slow so punt.
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
        //Inspect.inspect_new_object(value) //causes infinite loop in electron dde
        result = Inspect.inspect_stringify_new_object_clickable_path(value) //causes infinite loop in electron dd
        //just let result be the string of the path.
        }
    }
    else if (depth > 2) { return "***" } //the below clauses call this.stringify_value_aux meaning
        //they can get into infinite recursion, so cut that off here.
    else if (this.typed_array_name(value)){ //any type of array
        let len = Math.min(value.length, 100)  //large arrays will cause problems
        result = "[<br/>"
        for (let i = 0; i < len; i++){ //don't use "for ... in here as it gets some wrong stuff
            let sep = ((i == len - 1) ? "<br/>" : ",<br/>")
            var elt_val = value[i]
            var elt_val_string = this.stringify_value_aux(elt_val, job, depth + 1)
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
               else { val_str = this.stringify_value_aux(prop_val) }
               result += "&nbsp;" + prop + ": " +  val_str + "<br/>"
            }
        }
        result += "}"
    }
    else if (Object.isNewObject(value)) {
        let prop_val = value["prototype"]
        let val_str = (Object.isNewObject(prop_val)?
                        stringify_new_object_clickable_path(prop_val):
                        this.stringify_value_aux(prop_val))
        result = "{prototype: "   + val_str + "<br/>" +
                   "&nbsp;name: " + ((value.name == undefined) ? "undefined" : JSON.stringify(value.name)) + "<br/>"
        for(let prop in value){
           if (value.hasOwnProperty(prop) && (prop != "name") && (prop != "prototype")){
               prop_val = value[prop]
               val_str = Object.isNewObject(prop_val)? stringify_new_object_clickable_path(prop_val): this.stringify_value_aux(prop_val)
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
        if (value.constructor && value.constructor.name && (value.constructor.name != "Object")) { result += "class: " + value.constructor.name + ",<br/>"}
        let prop_names = Object.getOwnPropertyNames(value) //long objects like cv cause problems
        for (var prop_index = 0; prop_index < Math.min(prop_names.length, 100); prop_index++) {
            let prop_name = prop_names[prop_index]
            let prop_val = value[prop_name]
            if(prop_name == "devToolsWebContents") {} //causes error so just ignore this rare item. occurs in electron BrowserWindow instances
            else if (prop_name == "robot_status"){
                if (!job && value.job_id) { job = Job.job_id_to_job_instance(value.job_id) }
                let where_from = ""
                if (value instanceof Job)   { where_from = " on job: "   + value.name }
                if (value instanceof Robot) { where_from = " on robot: " + value.name }
                result += Dexter.robot_status_to_html(prop_val, where_from)
            }
            else if ((prop_name == "do_list") && job) { //must check to insure job is defined or this errors as happens when inspecting Job.job_default_params
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
                  result += prop_name + ": " + this.stringify_value_aux(prop_val, job, depth + 1) + ",<br/>"
                }
                catch(e) {} //doing globalThis["caches"] errors so just forget about this prop and maybe others.
            }
        }
        result += "}"
        if (result == "{}") {  //as is the case with iterators
            if (Utils.is_iterator(value)) {
              result = value.toString() //not great as might make "[object Generator]" or "[object Array Iterator]" but better than {}
            }
            else {
                 try{
                     var result = value.toString()
                     if (result == "[object Object]"){
                         if (value.constructor == Object) { result = "{}" }
                         else { result = "{instanceof: " + this.stringify_value_aux(value.constructor, job, depth + 1) + "}" }
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

//crude but guarentees fidelity with Utils.stringify_value, but that might not be what I really want.
static stringify_value_sans_html(value){
    let result = this.stringify_value(value)
    //result = this.replace_substrings(result, "<co"  + "de>", "") //screws up inspetion of this fn (while inspecting 'window') having '<co  de>' in it. //
    result = result.replace(/<code>/g,   "")
    //result = this.replace_substrings(result, "</co" + "de>", "") //
    result = result.replace(/<\/code>/g, "")
    result = result.replace(/<br\/>/g,   "\n")
    result = result.replace(/&nbsp;/g,   " ")
    return result
}

static stringify_value_cheap(val){
    if(val === undefined) { return "undefined"}
    else if(typeof(value) == "string") { return val }
    //else if (Utils.is_class(val)) { return "Class:" + Utils.get_class_name}
    //else if(typeof(value) === "function"){
    //    return val.toString()
    //}
    try { val = JSON.stringify(val)
        return val
    }
    catch(err) {
        return "" + val
    }
}

//makes a string for the args similar to console.log in that
//the args output are separated by a space,
//and there's a good attempt to have objects, funtions, classes,
//to have a meaningful presention but not too long.
//doesn't attempt to make source code, but
//will often do what JSON.stringify does.
//but outputs strings as its chars, without wrapping in double quotes.
// used by Utils.insert_outs_after_logs
static args_to_string(...args){
    let result = ""
    for(let index = 0; index < args.length; index++) {
        let arg = args[index]
        let str = ((typeof(arg) === "string") ? arg : Utils.stringify_value(arg))
        result += (index === 0 ? "" : " ") + str  //console.log adds a space between args in printout
    }
    return result
}

//________CSV ________
//documented but not called jan 2019
static array_to_csv(an_array){
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

//documented but not called jan 2019
static csv_to_array(a_string){
    let result = []
    let row_strings = a_string.split("\n")
    for (let row_string of row_strings){
        let row_array = []
        let cell_strings = row_string.split(",")
        for (let cell_string of cell_strings){
            if (this.is_string_a_number(cell_string)) {
                cell_string = parseFloat(cell_string)
            }
            row_array.push(cell_string)
        }
        result.push(row_array)
    }
    return result
}
//______End CSV ______

//not called jan 2019
static scale_to_micron_factor(scale){
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

static limit_to_range(value, min=null, max=null){
    let result = value
    if (min){ result = Math.max(result, min) }
    if (max){ result = Math.min(result, max) }
    return result
}

//dxf uses objects but dde standardizes on arrays
static point_object_to_array(xyz_obj){
    return [xyz_obj.x, xyz_obj.y, xyz_obj.z]
}

static scale_point(xyz, scale) {
    return [Math.round(xyz[0] * scale),
            Math.round(xyz[1] * scale),
            Math.round(xyz[2] * scale)]
}

//not called jan 2019
static point_equal(a, b) { return (a[0] == b[0]) && (a[1] == b[1]) && (a[2] == b[2]) }

//user fn but not called in dde, jan 2019
static make_ins_arrays(default_oplet, instruction_arrays=[]){
    let result = []
    for(let instr of instruction_arrays) {
        if((instr.length > 0) && (Robot.is_oplet(instr[0], false))) {//instr ok as is
            result.push(make_ins(...instr))
        }
        else if(default_oplet) {
            let new_array = instr.slice()
            new_array.unshift(default_oplet)
            result.push(make_ins(...new_array))
        }
        else {
            dde_error("Utils.make_ins_arrays called with no default oplet and an instruction args array without an oplet: " + instr)
        }
    }
    return result
}

   static permissions_integer_string_to_letter_string(integer_string, is_dir=false){
      if(integer_string === undefined) { return "---" }
      let result = (is_dir? "d" : "-")
            //in the binary rep,  leftmost  means r
            //                    middle    means w
            //                    rightmost means x
                           //000,  001,   010,   011    100    101    110   111
                           // 0,    1,     2,     3,     4,     5,     6,    7
      let int_to_let_map = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"]
      for(let i = 0; i <  integer_string.length; i++){
          let char = integer_string[i]
          let int  = parseInt(char)
          let letters = int_to_let_map[int]
          result += letters
      }
      return result
   }

//________Date________
    static is_valid_new_date_arg(string_or_int){
        const timestamp = Date.parse(string_or_int)
        if (Number.isNaN(timestamp)) { return false }
        else { return true }
    }


    static is_hour_colon_minute(a_string){
        return a_string.match(/^\d\d:\d\d$/)
    }


    static is_hour_colon_minute_colon_second(a_string){
        return a_string.match(/^\d\d:\d\d:\d\d$/)
    }


//date_int is ms from jan 1, 1970 as returned by Date.now()
    static date_integer_to_long_string(date_int=Date.now()){
        let date_obj = new Date(date_int)
        let result = date_obj.toString()
        let ms = date_obj.getMilliseconds()
        result +=  " " + ms + "ms"
        return result
    }

    //like date_integer_to_long_string but removes ms and "(Eastern Standard Time)"
    static date_number_to_medium_string(date_int=Date.now()){
        let date_obj = new Date(date_int)
        let result = date_obj.toString()
        let paren_pos = result.indexOf("(")
        if(paren_pos !== -1) {
            result = result.substring(0, paren_pos)
        }
        return result
    }

    //returns 2021/1/31 23:11:5
    static date_or_number_to_ymdhms(date_or_number){
        let date
        if(typeof(date_or_number) === "number"){
            date = new Date(date_or_number)
        }
        else if (!date_or_number) {
            date = new Date(0)
        }
        else { date = date_or_number}
        return date.getFullYear() + "/" +
               (date.getMonth() + 1) + "/" +
               date.getDate() + " " +
               date.getHours() + ":" +
               date.getMinutes() + ":" +
               date.getSeconds()
    }

//integer milliseconds in, output "123:23:59:59:999" ie
// days:hours:minutes:seconds:milliseconds
    static milliseconds_to_human_string(total_ms=Date.now(), include_total_days=true){
        let remain_ms   = total_ms % 1000
        let total_secs  = (total_ms - remain_ms) / 1000

        let remain_secs = total_secs % 60
        let total_mins = (total_secs - remain_secs) / 60

        let remain_mins = total_mins % 60
        let total_hours = (total_mins - remain_mins) / 60

        let remain_hours = total_hours % 24
        let total_days   = (total_hours - remain_hours) / 24
        return (include_total_days ? total_days + ":" : "") +
            Utils.pad_integer(remain_hours, 2) + ":" +
            Utils.pad_integer(remain_mins, 2) + ":" +
            Utils.pad_integer(remain_secs, 2) + ":" +
            Utils.pad_integer(remain_ms, 3)
    }

//lots of inputs, returns "Mar 23, 2017" format
    static date_to_mmm_dd_yyyy(date){ //can't give the default value here because on DDE launch,
//this method is called and for some weird reason, that call errors, but doesn't
//if I set an empty date below.
        if(!(date instanceof Date)) { date = new Date(date) }
        const d_string = date.toString()
        const mmm = d_string.substring(4, 8)
        return mmm + " " + date.getDate() + ", " + date.getFullYear()
    }

    static date_to_human_string(date=new Date()){
        let result = this.date_to_mmm_dd_yyyy(date)
        return result +  " " + Utils.milliseconds_to_human_string(undefined, false)
    }

//________TIME related functions below here_______
//import {microseconds}              from "../../../node_modules/nano-time/index.js"
//importing microseconds from this module just doesn't work, so
//I'm inlining the code from the nano-time npm module here:
static nanoseconds() {
    let loadNs = process.hrtime();
    let loadMs = new Date().getTime();
    let diffNs = process.hrtime(loadNs);
    return BigInt(loadMs).times(1e6).add(BigInt(diffNs[0]).times(1e9).plus(diffNs[1])).toString();
}

static microseconds() {
    return BigInt(this.nanoseconds()).divide(1e3).toString();
}
//_____done with defining microseconds, called below
static month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September','October', 'November', 'December']

    /*
    nn = performance.now(); parseInt(microseconds()); performance.now() - nn;
    and
    nn = performance.now(); Utils.time_in_us(); performance.now() - nn;
    take very close to the same time, ie very clsoe to 0.1 ms normally,
    or very close to  0.2 ms. (its bi-modal)
    Note: nn = performance.now(); performance.now() - nn;
    usually measures as 0 ms but occassionally 0.1ms
    https://stackoverflow.com/questions/313893/how-to-measure-time-taken-by-a-function-to-execute/15641427
    Number.MAX_SAFE_INTEGER is
    9007199254740991
    whereas, this.time_in_us() returns (as of may3, 2020)
    1588518775923001
    so our JS integers are in good shape to handle this capacity.
    Conclusion: this.time_in_us gives us 0.1ms  or 0.2ms res, not consistently.
    */

static time_in_us() { return parseInt(microseconds()) }

//input -> output
// 12       12
// 12.3     12.3
// "1:34"     94
// "1:34.5"   94.5
// "1:2:3"    1 hour, 2 minutes, 3 seconds ie 3600 + 120 + 3
// else error
static string_to_seconds(dur){
    if(typeof(dur) === "number") { return dur }
    else if(typeof(dur) == "string"){
        let num_strings = dur.split(":")
        if(num_strings.length == 0)  { dde_error("Utils.string_to_seconds passed empty string for dur of: " + dur) }
        else if (num_strings.length == 1) {
            if(this.is_string_a_number(num_strings[0])) {
                return parseFloat(num_strings[0])
            }
            else { dde_error("Utils.string_to_seconds passed string that is not a number: " + dur) }
        }
        else if(num_strings.length == 2) {
            if(!this.is_string_a_integer(num_strings[0]) ||
                !this.is_string_a_number(num_strings[1])) {
                dde_error("Utils.string_to_seconds passed string that does not contain valid numbers: " + dur)
            }
            else {
                let result = parseInt(num_strings[0]) * 60
                result +=  parseFloat(num_strings[1])
                return result
            }
        }
        else if(num_strings.length == 3) {
            if(!this.is_string_a_integer(num_strings[0]) ||
                !this.is_string_a_number(num_strings[2])) {
                dde_error("Utils.string_to_seconds passed string that does not contain valid numbers: " + dur)
            }
            else {
                let result = parseInt(num_strings[0]) * 60 * 60
                result    += parseInt(num_strings[0]) * 60
                result    += parseFloat(num_strings[2])
                return result
            }
        }
        else {
            dde_error("Utils.string_to_seconds passed string that does not 1 to 3 numbers: " + dur)
        }
    }
    else {
        dde_error("Utils.string_to_seconds passed non number, non string: " + dur)
    }
    /* unused jan 2019
   static is_json_date(a_string){
       if((a_string.length > 19) && (a_string.length < 30)) {//impresise
           return (is_string_a_integer(a_string.substring(0, 4)) &&
           (a_string[4] == "-") &&
           (a_string[7] == "-") &&
           (a_string[10] == "T") &&
           (a_string[13] == ":"))
       }
       else return false
   }
   */
}
   //see https://gomakethings.com/how-to-get-all-parent-elements-with-vanilla-javascript/
   //fry modified, but same core algorithm
   //used in DocCode.open_doc
   static get_dom_elt_ancestors(dom_elt) {
        let result = [];
        for ( ; dom_elt && dom_elt !== document; dom_elt = dom_elt.parentNode ) {
            result.push(dom_elt)
        }
        return result
    }

   static available_memory(){
       if (Utils.value_of_path("window")) {
           //the below works in DDE but fails in node,
           return performance.memory.jsHeapSizeLimit -
                  performance.memory.usedJSHeapSize
       } else {
           //works in node, but not in DDE4.
           let info = process.memoryUsage()
           return info.heapTotal - info.heapUsed
       }
   }
} //end class Utils

globalThis.Utils = Utils

globalThis.dde_error = Utils.dde_error //not documented, but just used so many places in DDE.
                                 //we should probably encourage advances dde users to use it.
globalThis.warning       = Utils.warning
globalThis.shouldnt      = Utils.shouldnt
globalThis.rgb           = Utils.rgb //documented for users, as in Plot example
globalThis.last          = Utils.last //used a bunch of places that are hard to declare
globalThis.replace_substrings = Utils.replace_substrings
globalThis.similar       = Utils.similar
globalThis.value_of_path = Utils.value_of_path

