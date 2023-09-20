//See Examples at bottom of file

Dexter.defaults_arg_sep = ", "

Dexter.defaults_coloned_comment_props = [
    "Dexter Serial Number",
    "Dexter Model",
    "Manufacture Location",
    "Built by"
]

Dexter.defaults_colonless_comment_props = [
    "DexRun modified",
    "xillydemo modified",
    "OS version"
]

//Dexter.dexter0.defaults = {}

/* Returns something like: "Dexter.dexter0:/srv/samba/share/Defaults.make_ins"
Dexter.dexter0.defaults_url()
*/
Dexter.prototype.defaults_url = function(){
    return "Dexter." + this.name + ":/srv/samba/share/Defaults.make_ins"
}


/*Gets the Defaults.make_ins file from Dexter and
sets this.defaults_lines with an array of strings (1 string per line)
Dexter.dexter0.defaults_read()
Dexter.dexter0.defaults_lines
*/

//the callback is optional.
//when set_link_lengths called defaults_read,
//it has the callback call Dexter.prototype.start_aux
Dexter.prototype.defaults_read = function(callback = null){
    let the_url = this.defaults_url()
    let the_dex_inst = this
    let normal_defaults_read_cb = (function(err, content){
        if(err) { dde_error("Dexter." + the_dex_inst.name + ".defaults_read errored with url: " +
            the_url + "<br/>and error message: " +
            err.toString() +
            "<br/>You can set a Job's robot to the idealized defaults values by<br/>passing in a Job's 'get_dexter_defaults' to true.")
        }
        else {
            try {
                the_dex_inst.defaults_set_lines_from_string(content)
                the_dex_inst.defaults_lines_to_high_level()
                if (callback) {
                    callback.call(the_dex_inst, null)
                }
            }
            catch(err) {
                let defaults_copy = JSON.parse(JSON.stringify(Dexter.defaults))
                the_dex_inst.defaults = defaults_copy
                warning("Could not parse Defaults.make_ins due to:<br/>" +
                    err.message +
                    "<br/>so Dexter." + the_dex_inst.name +
                    ".defaults has been set to a copy of Dexter.defaults."
                )
                if (callback) {
                    callback.call(the_dex_inst, null)
                }
            }
        }
    })
    DDEFile.read_file_async(the_url, normal_defaults_read_cb)
}

Dexter.prototype.defaults_write_return_string = function(){
    this.defaults_high_level_to_defaults_lines()
    let content = this.defaults_get("whole_file_string")
    return content
}

Dexter.prototype.defaults_write = function(){
    let content = this.defaults_write_return_string()
    let the_url = this.defaults_url()
    let the_dex_inst = this
    DDEFile.write_file_async(the_url,  content,
        function(err){
            if(err) { warning("Dexter." + the_dex_inst.name + ".defaults_write errored with: " +
                err.message)
            }
            else {
                out(the_url + " written.")
            }
        })
}


/*
Internal fn not called by users.
They should use Dexter.dexter0.set("lines", "some str") instead.
Usually this function isn't called directly
as you can call Dexter.dexter0.defaults_read()
but if you really want to set defaults_lines to
a string you already have, its useful.

***
Dexter.dexter0.defaults_set_lines_from_string(read_file("Defaults.make_ins"))
Dexter.dexter0.defaults_lines
*/
Dexter.prototype.defaults_set_lines_from_string = function(content){
    content = content.trimEnd() //don't trim beginning. James N wants top blank lines.
    let orig_lines = content.split("\n")
    this.defaults_lines = []
    let at_beginning = true
    for(let orig_line of orig_lines){
        let a_clean_line = this.defaults_clean_line(orig_line)
        this.defaults_lines.push(a_clean_line)
    }
    return this.defaults_lines
}

/*any combination of contiguous spaces and commas counts as
  1 delimiter and are replace by one space in the output.
 inspect(Dexter.dexter0.defaults_clean_line(
    "  a    1 2  ; this    is").length)
  Dexter.dexter0.defaults_clean_line("a    9").length
  Dexter.dexter0.defaults_clean_line("S   RebootServo,,,   3, 1;")

  Dexter.dexter0.defaults_clean_line("S, RebootServo, 3, 1;")
*/
Dexter.prototype.defaults_clean_line = function (orig_line){
    let line = orig_line.trim()
    let new_line = ""
    let prev_char_was_space_or_comma = false
    let in_comment = false
    if(line === "") { return line }
    else {
        for(let char of line){
            if(in_comment) { new_line += char }
            else if (char === ";") {
                new_line += char;
                in_comment = true
            }
            else if((char === " ") || (char === ",")) {
                if(prev_char_was_space_or_comma) {} //throw out char
                else {
                    new_line += Dexter.defaults_arg_sep //canonical separator is space, and this is the ONE space separator
                    prev_char_was_space_or_comma = true
                }
            }
            else {
                new_line += char
                prev_char_was_space_or_comma = false
            }
        }
    }
    if(!line.includes(";")) { new_line += ";" }
    return new_line
}

/*
Returns array of start_index of
    0. line starting with line_start,
    1. start of line_start within its line
    2. end of line_start within str. Ie the next char after the last
       char of line_start
Dexter.dexter0.defaults_find_index("asdf")
Dexter.dexter0.defaults_find_index("; Dexter Serial", false)
*/
Dexter.prototype.defaults_find_index = function(line_start, smart=true, from_end=true){
    if(!from_end) {
        for(let i = 0; i < this.defaults_lines.length; i++) {
            let line = this.defaults_lines[i]
            if(!smart) {
                if(line.startsWith(line_start)) {
                    return [i, 0, line_start.length]
                }
            }
            else {
                let start_pos = line.indexOf(line_start)
                if(start_pos != -1) {
                    let prefix = line.substring(0, start_pos)
                    if((prefix[0] === ";") || (prefix[0] === "S")){
                        for(let j = 1; j < prefix.length; j++){
                            let char = prefix[j]
                            if(!(char === " ") || !(char === ",")) { }
                        }
                    }
                }
            }
        }
        return null
    }
    else { //from_end
        for(let i = this.defaults_lines.length - 1; i >= 0; i--) {
            let line = this.defaults_lines[i]
            if(!smart) {
                if(line.startsWith(line_start)) {
                    return [i, 0, line_start.length]
                }
            }
        }
        return null
    }
}

//_______End of Utils_______
/*
***
Dexter.dexter0.defaults_get("whole_file_string")
Dexter.dexter0.defaults_get("lines")
Dexter.dexter0.defaults_get(["line", -1])

Dexter.dexter0.defaults_get("Dexter Serial Number")
Dexter.dexter0.defaults_get("Dexter Model")
Dexter.dexter0.defaults_get("Manufacture Location")
Dexter.dexter0.defaults_get("Built by")

Dexter.dexter0.defaults_get("DexRun modified")
Dexter.dexter0.defaults_get("xillydemo modified")
Dexter.dexter0.defaults_get("OS version")

Dexter.dexter0.defaults_get("S, RebootServo, 3") // "1"
Dexter.dexter0.defaults_get("S, RebootServo")    // "1, 1"
Dexter.dexter0.defaults_get("S, J1BoundryHigh")  // "666000"
Dexter.dexter0.defaults_get("J1BoundryHigh")     // "666000"


Dexter.dexter0.defaults_lines
*/
Dexter.prototype.defaults_get = function(key){
    if(!Array.isArray(this.defaults_lines)) {
        warning("No content for defaults_lines yet so all calls to defaults_get will return undefined.")
        return undefined
    }
    if(key === "whole_file_string") {
        return this.defaults_lines.join("\n")
    }
    else if(key === "lines") { return this.defaults_lines }
    else if (Number.isInteger(key)) {
        if(key < 0) { key = this.defaults_lines.length + key }
        return this.defaults_lines[key]
    }
    else if (key.startsWith("^") || key.includes("\\")) { //key is a regex expression like '^J\\dBoundryHigh'
        let the_regex = new RegExp(key)
        let lines = []
        for(let i = 0; i < this.defaults_lines.length; i++){
            let line = this.defaults_lines[i]
            if(the_regex.test(line)) {
                lines.push(line)
            }
        }
        return lines
    }
    else {
        let [result, line_number] = this.get_coloned_prop_value(key)
        if(result !== undefined) { return result }
        else {
            [result, line_number] = this.get_colonless_prop_value(key)
            if(result !== undefined) { return result }
            else {
                [result, line_number] = this.defaults_get_S(key)
                if(result !== undefined) { return result }
                else {
                    warning("Dexter." + this.name + ".defaults_get could not find key: " + key)
                    return undefined
                }
            }
        }
    }
}

//returns array of value(a string) and its line number(a non-neg int)
//or undefined if not found
Dexter.prototype.get_coloned_prop_value = function(key){
    if(Dexter.defaults_coloned_comment_props.includes(key)) {
        for(let i = this.defaults_lines.length - 1; i >=0; i--){
            let line = this.defaults_lines[i]
            if (line.startsWith(";")){
                let trimmed_line = line.substring(1).trim()
                let colon_pos = trimmed_line.indexOf(":")
                if(colon_pos >= 0) {
                    let possible_key = trimmed_line.substring(0, colon_pos).trim()
                    if(key === possible_key){
                        let val = trimmed_line.substring(colon_pos + 1).trim()
                        return [val, i]
                    }
                }
            }
        }
    }
    return []
}

//returns array of value(a string) and its line number(a non-neg int)
//or [] if not found
Dexter.prototype.get_colonless_prop_value = function(key){
    if(Dexter.defaults_colonless_comment_props.includes(key)) {
        for(let i = this.defaults_lines.length - 1; i >=0; i--){
            let line = this.defaults_lines[i]
            if (line.startsWith(";")){
                let trimmed_line = line.substring(1).trim()
                let colon_pos = trimmed_line.indexOf(":")
                if(trimmed_line.startsWith(key + " ")) {
                    let val = trimmed_line.substring(key.length + 1).trim()
                    return [val, i]
                }
            }
        }
    }
    return []
}

/* Dexter.dexter0.defaults_lines
Dexter.dexter0.defaults_set("whole_file_string", ";top line\nS, hey")
Dexter.dexter0.defaults_lines
Dexter.dexter0.defaults_set("lines", ";diff top line\nS, hey")
   //synonym to whole_file_string but I want it since "get"
   //needs "whole_file_string"
Dexter.dexter0.defaults_set("lines", [";top line too", "S, hey 9"])
Dexter.dexter0.defaults_set(["line", 0], ";new top line")
                                        ["a", 30, 60] => "a 30 60"
Dexter.dexter0.defaults_get(["line", -2])

Dexter.dexter0.defaults_set("Dexter Serial Number", "XYZ")
Dexter.dexter0.defaults_set("Dexter Model", "ABC")
Dexter.dexter0.defaults_set("Manufacture Location", "LA")
Dexter.dexter0.defaults_set("Built by", "FRY")

Dexter.dexter0.defaults_set("DexRun modified", "FEB")
Dexter.dexter0.defaults_set("xillydemo modified", "1984")
Dexter.dexter0.defaults_set("OS version", "1.2.3")

Dexter.dexter0.defaults_set("S, RebootServo, 3", "X; a brand new comment")
Dexter.dexter0.defaults_set("S, RebootServo", "Y")
Dexter.dexter0.defaults_set("S, J1BoundryHigh", "ZZ")

Dexter.dexter0.defaults_set("JointDH", "1, 245656, 324100, 260, 323413") //note:
  //that first arg is really the Joint number, and semantically belongs in the key,
  //but then we can't use the s param name for the key, so keep the joint number in the value.


Dexter.dexter0.defaults_lines

//sets low level defaults_lines, then updates high level defaults
*/
Dexter.prototype.defaults_set = function(key, value){
    if(!Array.isArray(this.defaults_lines)) {
        this.defaults_lines = [] //not great but at least the below clauses will work
        if((key !== "whole_file_string") && (key !== "lines")) {
            warning("No content for defaults_lines yet so initializing it to the empty array.")
        }
    }
    if(typeof(this.defaults) !== "object") {
        if((key !== "whole_file_string") && (key !== "lines")) {
            this.defaults_init_defaults()
            warning("No content for defaults yet so initializing it to the empty object.")
        }
    }
    if(key === "whole_file_string") {
        if(Array.isArray(value)) { this.defaults_lines = value }
        else if (typeof(value) === "string") {
            this.defaults_set_lines_from_string(value)
        }
        this.defaults_lines_to_high_level()
        return this.defaults
    }
    else if(key === "lines") {
        if(typeof(value) === "string") { this.defaults_set_lines_from_string(value) }
        else if(Array.isArray(value)) {
            this.defaults_lines = value
        }
        else { dde_error("Dexter defaults.set passed 'lines' with a value that isn't an array: " + value)
        }
        this.defaults_lines_to_high_level()
        return this.defaults
    }
    else if (Number.isInteger(key)) { // -1 means we're  making a new last element.
        if(typeof(value) !== "string") {
            dde_error("Dexter." + this + ".defaults_set called with key of an integer<br/>" +
                      "so value should be a string but its not: " + value)
        }
        if(key < 0) { key = this.defaults_lines.length + key}
        if(key >= this.defaults_lines.length) {
            dde_error("Dexter." + this.name + ".defaults_set passed key: " + key +
                " which is higher than the length of Dexter." + this.name + ".defaults_lines")
        }
        else {
            if(typeof(value) !== "string") {
                dde_error("Dexter." + this.name + ".defaults_set passed key: " + key +
                    " which expected a value of a string, but passed instead: " + value)
            }
            let clean_line = this.defaults_clean_line(value)
            this.defaults_lines[key] = clean_line
            this.defaults_line_to_high_level(clean_line, key) //key is line number
            return value
        }
    }
    else if (key.length === 1) {
        dde_error("Dexter." + this.name + ".defaults_set passed key: " + key +
                  "<br/>which looks like an oplet, but you can't use oplets as keys with defaults_set." +
                  "<br/>Consider Dexter." + this.name + ".defaults_insert() instead.")
    }
    else {
        let value_str
        if(typeof(value) === "string") {
            value_str = value
            try {
                value = JSON.parse(value)
            }
            catch(err) {
                if (value.includes(Dexter.defaults_arg_sep)) {
                    value = value.split(Dexter.defaults_arg_sep)
                    for(let i = 0; i < value.length; i++){
                        let item = value[i]
                        let num = parseFloat(item)
                        if(Number.isNaN(num)) {
                            value = value_str //assume user wanted just a string.
                            break;
                        }
                        else { value[i] = num}
                    }
                }
            }
        }
        else {
            if (Array.isArray(value)) {
                value_str = value.join(Dexter.defaults_arg_sep)
            }
            else {
                value_str = "" + value
            }
        }
        //now value_str is a string, and value is a num, an array, or possibly a string
        let result = this.set_coloned_prop_value(key, value_str)
        if(result !== undefined) {
            this.defaults[key] = value
            return result
        }
        else {
            result = this.set_colonless_prop_value(key, value_str)
            if(result !== undefined) {
                this.defaults[key] = value
                return result
            }
            else {
                //we've got an S param
                this.defaults_set_S(key, value_str) //sets the line in defaults_lines
                if(Dexter.defaults_is_j_key(key)) {
                    let [high_key, joint_number] = Dexter.defaults_j_key_to_high_key(key)
                    let ins_arr = []
                    ins_arr[Instruction.INSTRUCTION_TYPE] = "S"
                    //ins_arr.push(parsed_line.key) //arg0, the param name
                    ins_arr[Instruction.INSTRUCTION_ARG0] = key //low key
                    if(Array.isArray(value)) {
                        ins_arr = ins_arr.concat(value)
                    }
                    else { ins_arr[Instruction.INSTRUCTION_ARG1] = value}
                    let dde_ins_arr = Socket.instruction_array_arcseconds_to_degrees_maybe(ins_arr, this)
                    let val_arr = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG1)
                    let new_high_val = val_arr[0]
                    this.defaults[high_key][joint_number - 1] = new_high_val
                    return new_high_val
                }
                else if (key === "JointDH"){
                    let high_key = "dh_mat"
                    if(!Array.isArray(this.defaults.dh_mat)) {
                        this.defaults.dh_mat = []
                    }
                    let high_val = this.defaults[high_key] //at the very least, will be an empty array
                    let joint_number = value[0]
                    let ins_arr = []
                    ins_arr[Instruction.INSTRUCTION_TYPE] = "S"
                    //ins_arr.push(parsed_line.key) //arg0, the param name
                    ins_arr[Instruction.INSTRUCTION_ARG0] = key //low key
                    ins_arr = ins_arr.concat(value)
                    let dde_ins_arr = Socket.instruction_array_arcseconds_to_degrees_maybe(ins_arr, this)
                    let val_arr = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG2)
                    this.defaults[high_key][joint_number - 1] = val_arr
                    return val_arr
                }
                else {
                    this.defaults[key] = value
                    return value
                }
            }
        }
    }
}

Dexter.prototype.set_coloned_prop_value = function(key, value){
    if(Dexter.defaults_coloned_comment_props.includes(key)) {
        for(let i = this.defaults_lines.length - 1; i >=0; i--){
            let line = this.defaults_lines[i]
            if (line.startsWith(";")){
                let trimmed_line = line.substring(1).trim()
                let colon_pos = trimmed_line.indexOf(":")
                if(colon_pos >= 0) {
                    let possible_key = trimmed_line.substring(0, colon_pos).trim()
                    if(key === possible_key){
                        colon_pos = line.indexOf(":")
                        let new_line = "; " + key + ": " + value
                        this.defaults_lines[i] = new_line
                        return value
                    }
                }
            }
        }
    }
    return undefined
}

Dexter.prototype.set_colonless_prop_value = function(key, value){
    if(Dexter.defaults_colonless_comment_props.includes(key)) {
        for(let i = this.defaults_lines.length - 1; i >=0; i--){
            let line = this.defaults_lines[i]
            if (line.startsWith(";")){
                let trimmed_line = line.substring(1).trim()
                let colon_pos = trimmed_line.indexOf(":")
                if(trimmed_line.startsWith(key + " ")) {
                    let new_line = "; " + key + " " + value
                    this.defaults_lines[i] = new_line
                    return value
                }
            }
        }
    }
    return undefined
}

Dexter.defaults_starts_with_S_oplet = function(string){
    return string.startsWith("S" + Dexter.defaults_arg_sep)
}

//trim "S, " from front
Dexter.defaults_trim_oplet = function(string){
    return string.substring(1 + Dexter.defaults_arg_sep.length)
}

// key can be "asdf", or "S, asdf"  or "asdf, 2" or "S, asdf, 2" ,etc.
//return array of value and line number of key in file
//or []
Dexter.prototype.defaults_get_S = function(key){
    for(let i = this.defaults_lines.length - 1; i >=0; i--){
        let line = this.defaults_lines[i]
        let first_sep_pos = line.indexOf(Dexter.defaults_arg_sep)
        let trimmed_line = line
        let trimmed_key  = key
        if((line === "") || line.startsWith(";")) { continue; } //not in this line
        else if (first_sep_pos === -1)            { continue; } //without sep, no val so not in this line
        else if (line.startsWith(key))            { trimmed_line = line; trimmed_key = key }
        else if (Dexter.defaults_starts_with_S_oplet(key)){
            trimmed_key = Dexter.defaults_trim_oplet(key)
            if(Dexter.defaults_starts_with_S_oplet(line)){
                trimmed_line = Dexter.defaults_trim_oplet(line)
            }
            else { trimmed_line = line }
        }
        else if(Dexter.defaults_starts_with_S_oplet(line)){  //we know key doesn't start with S_oplet
            trimmed_key = key
            trimmed_line = Dexter.defaults_trim_oplet(line)
        }
        //trimmed_key and trimmed_line are set
        if(trimmed_line.startsWith(trimmed_key)){  //we've got a match!
            let after_key_pos = key.length
            if(after_key_pos >= trimmed_line.length) { return [] } //end of line after key so no value
            else if (!(trimmed_line.substring(after_key_pos).startsWith(Dexter.defaults_arg_sep))){ return [] } //no sep after key so no value
            else {
                let val_begin_pos = after_key_pos + Dexter.defaults_arg_sep.length
                let val = trimmed_line.substring(val_begin_pos)
                let comment_pos = val.indexOf(";")
                if(comment_pos !== -1){ val = val.substring(0, comment_pos) }
                val = val.trim()
                if(length.val === 0) { return [] } //we found the key but no value
                else { return [val, i] }
            }
        }
    }
    return []
}

//key is a string of a param name. Must be > 1 char.
//value is a string of the value. It can start with the defaults_arg_sep(erator) or not.
//it can have a semicolon (value terminator & comment starter or not.
//If key exists, its value is replaced.
//If key does not exist, a new line is added at the end of defaults_lines.
Dexter.prototype.defaults_set_S = function(key, value_str){
    for(let i = this.defaults_lines.length - 1; i >=0; i--){
        let line = this.defaults_lines[i]
        let first_sep_pos = line.indexOf(Dexter.defaults_arg_sep)
        let trimmed_line = line
        let trimmed_key = key
        if((line === "") || line.startsWith(";")) { continue; } //not in this line
        else if (first_sep_pos === -1)            { continue; } //without sep, no val so not in this line
        else if (line.startsWith(key))            { trimmed_line = line; trimmed_key = key }
        else if (Dexter.defaults_starts_with_S_oplet(key)){
            trimmed_key = Dexter.defaults_trim_oplet(key)
            if(Dexter.defaults_starts_with_S_oplet(line)){
                trimmed_line = Dexter.defaults_trim_oplet(line)
            }
            else { trimmed_line = line }
        }
        else if(Dexter.defaults_starts_with_S_oplet(line)){
            trimmed_line = Dexter.defaults_trim_oplet(line)
        }
        else { trimmed_line = line }
        //trimmed_key and trimmed_line are set
        if(trimmed_line.startsWith(trimmed_key)){  //we've got a match!
            if(!(Dexter.defaults_starts_with_S_oplet(trimmed_key))){
                trimmed_key = "S" + Dexter.defaults_arg_sep + trimmed_key
            }
            if (!(trimmed_key.endsWith(Dexter.defaults_arg_sep))){
                trimmed_key = trimmed_key + Dexter.defaults_arg_sep
                let new_line = trimmed_key + value_str
                if(!(new_line.includes(";"))) {
                    new_line += ";"
                }
                let comment = ""
                let semi_pos = line.indexOf(";")
                if(semi_pos !== -1) { new_line += line.substring(semi_pos + 1) }
                this.defaults_lines[i] = new_line
                return new_line
            }
        }
    } //end of for_loop
    //key was not existing, so tack a new line onto the end.
    //warning("Dexter." + this.name + ".defaults_set attempted to set key: " + key +
    //        " but that key not found.")
    let new_line = "S"
    if(!key.startsWith(Dexter.defaults_arg_sep)) {
        new_line += Dexter.defaults_arg_sep
    }
    new_line += key
    new_line += Dexter.defaults_arg_sep
    new_line += value_str
    if(!value_str.includes(";")){
        new_line += ";"
    }
    this.defaults_lines.push(new_line)
    return value_str
}

var [foo, bar] = []

//returns deleted val
Dexter.prototype.defaults_delete = function(key){
    if(key === "whole_file_string") {
        let deleted_lines = this.defaults_lines
        this.defaults_lines = []
        this.defaults = {}
        return deleted_lines
    }
    else if(key === "lines") {
        let deleted_lines = this.defaults_lines
        this.defaults_lines = []
        this.defaults = {}
        return deleted_lines
    }
    else if (Number.isInteger(key)) {
        if(key < 0) { key = this.defaults_lines.length + key }
        let deleted_lines = this.defaults_lines.splice(key, 1)
        let parsed_line = Dexter.defaults_parse_line(line, line_number)
        if(parsed_line.hasOwnProperty("key")) {
            delete this.defaults[parsed_line.key]
        }
        return deleted_lines[0]
    }
    else if (key.startsWith("^") || key.includes("\\")) { //key is a regex expression like '^J\\dBoundryHigh'
        let the_regex = new RegExp(key)
        let lines_deleted_count = 0
        for(let i = this.defaults_lines.length - 1; i >= 0; i--){
            let line = this.defaults_lines[i]
            if(the_regex.test(line)) {
                this.defaults_lines.splice(i, 1)
                lines_deleted_count += 1
            }
        }
        this.defaults_lines_to_high_level()
        return lines_deleted_count
    }
    else {
        let [val, line_number] = this.get_coloned_prop_value(key)
        if(val !== undefined) {
            let deleted_lines = this.defaults_lines.splice(line_number, 1)
            delete this.defaults[key]
            return deleted_lines[0]
        }
        else {
            [val, line_number] = this.get_colonless_prop_value(key)
            if(val !== undefined) {
                let deleted_lines = this.defaults_lines.splice(line_number, 1)
                delete this.defaults[key]
                return deleted_lines[0]
            }
            else {
                [val, line_number] = this.defaults_get_S(key)
                if(val !== undefined) {
                    let deleted_lines = this.defaults_lines.splice(line_number, 1)
                    if (Dexter.defaults_is_j_key(key)) {
                        let [high_key, joint_number] = Dexter.defaults_j_key_to_high_key(key)
                        let arr = this.defaults[high_key]
                        delete arr[joint_number - 1]
                    }
                    else {
                        delete this.defaults[key]
                    }
                    return deleted_lines[0]
                }
                else {
                    warning("Dexter." + this.name + ".defaults_get could not find key: " + key)
                    return undefined
                }
            }
        }
    }
}
//index is the index of the line after it has been inserted
//into this.defaults_lines.
//A -1 index makes the line arg be in the same posiition in the array
//as the (before the call) last elt.
//ie in the new elt it is the 2nd to last elt.
//a bit "counter intuitive", but consistent with the
//index in defaults.set and JS splice
//That means the new elt will be the new 2nd to last elt
//with the new last elt still being the (before the call) last elt.
//this "def" of index is the same as I use in "defaults_insert"
//and the same that JS splice uses,
//but does mean that we don't have a way to represent how to
// "insert" a new elt on the end of the array (after the call)
//so an index of "last" is the way to do that.
//a -2 makes it the  to the last elt in the array.
// var foo = [4, 5, 6]
// foo.splice(-2, 0, 66)
Dexter.prototype.defaults_insert = function(line, index="last"){
    if     (index === "last") { index = this.defaults_lines.length }
    else if(index < 0)        { index = this.defaults_lines.length + index}

    if((index < 0) || (index > this.defaults_lines.length)){
        dde_error("Dexter." + this.name +
            ".defaults_insert passed an index that is out of range for defaults_lines.")
    }
    line = this.defaults_clean_line(line)
    this.defaults_lines.splice(index, 0, line)
    this.defaults_line_to_high_level(line, index)
}


Dexter.defaults_parse_line = function(line, line_number_for_error_message="unknown"){
    let result = {line: line}
    let trimmed_line = line.trim()
    result.trimmed_line = trimmed_line
    if(trimmed_line === ""){
        result.kind = "blank_line"
        result.value_string = ""
    }
    else if(trimmed_line.startsWith(";")) {
        result.comment = trimmed_line
        let colon_pos  = trimmed_line.indexOf(":")
        if(colon_pos !== -1) {
            let key = trimmed_line.substring(1, colon_pos).trim()
            if(Dexter.defaults_coloned_comment_props.includes(key)){
                result.key = key
                result.kind = "coloned_comment_prop"
                result.value_string = trimmed_line.substring(colon_pos + 1).trim()
            }
        }
        if(!result.kind) {
            let line_minus_semicolon = trimmed_line.substring(1).trim()
            for(let colonless_prop_key of Dexter.defaults_colonless_comment_props){
                if(line_minus_semicolon.startsWith(colonless_prop_key)){
                    result.key = colonless_prop_key
                    result.kind = "colonless_comment_prop"
                    result.value_string = line_minus_semicolon.substring(colonless_prop_key.length).trim()
                    break;
                }
            }
            if(!result.kind) {
                result.kind = "whole_line_comment"
                result.value_string = ""
            }
        }
    }
    else if (trimmed_line.startsWith("S" + Dexter.defaults_arg_sep)) {
        result.kind = "S_param"
        let key_start = 3
        let key_end = trimmed_line.indexOf(Dexter.defaults_arg_sep, 4)
        if(key_end === -1) {
            result.kind = "invalid"
            result.value_string = ""
            result.error_message = "Error in parsing Defaults.make_ins<br/>" +
                "line number: " + line_number_for_error_message +
                "<br/>line: " + line +
                "<br/>S param with no proper key"
        }
        else {
            result.key = trimmed_line.substring(key_start, key_end)
            let val = trimmed_line.substring(key_end + Dexter.defaults_arg_sep.length).trim()
            let comment_pos = val.indexOf(";")
            if(comment_pos !== -1) {
                result.value_string = val.substring(0, comment_pos).trim()
                result.comment = val.substring(comment_pos + 1)
            }
            else {
                result.value_string = val
            }
        }
    }
    else if(trimmed_line.indexOf(Dexter.defaults_arg_sep) === 1){
        result.kind = "oplet_instruction"
        result.key = trimmed_line[0] //the oplet
        result.value_string = trimmed_line.substring(1 + Dexter.defaults_arg_sep.length).trim()
    }
    else { //lines starting with a longer than 1 char token //todo are there any?
        result.kind = "non_oplet_instruction"
        let key_end = trimmed_line.indexOf(Dexter.defaults_arg_sep)
        result.key  = trimmed_line.substring(key_end)
        let val_start = key_end + Dexter.defaults_arg_sep.length
        let val_str   = trimmed_line.substring(val_start)
        let comment_start = val_str.indexOf(":")
        if(comment_start !== -1) {
            result.value_string = val_str.substring(0, comment_start).trim()
        }
        else { result.value_string = val_str }
    }
    if(result.value_string){
        if     (result.kind === "invalid")                { result.value_array = [] }
        else if(result.kind === "blank_line")             { result.value_array = [] }
        else if(result.kind === "coloned_comment_prop")   { result.value_array = [result.value_string] }
        else if(result.kind === "colonless_comment_prop") { result.value_array = [result.value_string] }
        else if(result.kind === "whole_line_comment")     { result.value_array = [] }
        else { //"S_param" "oplet_instruction" "non_oplet_instruction"
            let vs_arr = result.value_string.split(Dexter.defaults_arg_sep)
            let val_arr = []
            for(let item of vs_arr){
                let num = parseFloat(item)
                if(Number.isNaN(num)) { val_arr.push(item) }
                else { val_arr.push(num) }
            }
            result.value_array = val_arr
        }
    }
    return result
}

/*
Dexter.dexter0.defaults_lines_to_high_level()
Dexter.dexter0.defaults
Dexter.dexter0.defaults_lines

*/

Dexter.prototype.defaults_lines_to_high_level = function(){
    this.defaults_init_defaults() //initialize (ie clear existing, add J_key suffixes)
    for(let line_number = 0; line_number < this.defaults_lines.length; line_number++) {
        let line = this.defaults_lines[line_number]
        this.defaults_line_to_high_level(line, line_number)
    }
    //out("parsed " + this.defaults_lines.length + " lines.")
    return this.defaults
}
/*
Dexter.dexter0.defaults_lines
Dexter.dexter0.defaults_line_to_high_level("S, abJ2cd, 123")
Dexter.dexter0.defaults_line_to_high_level("S, J1BoundryHigh, 666000; 185")
Dexter.dexter0.defaults_line_to_high_level("S, LinkLengths, 82440, 59500, 307500, 339092, 235200")

FIXED bug in DDE inspect([undefined, 111]) errors: TypeError: Cannot read property '0' of undefined
*/

/*Dexter.prototype.defaults_low_to_high_values(parsed_line){
   let orig_array = parsed_line.value_array
   let converted_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(instruction_array, this)

}*/

Dexter.prototype.defaults_line_to_high_level = function(line, line_number="unknown"){
    if(!this.defaults) { this.defaults = {} } //usually unnecessary but safer
    let parsed_line = Dexter.defaults_parse_line(line, line_number)
    let low_key = parsed_line.key
    let high_key = low_key
    let high_value
    if      (parsed_line.kind  === "invalid")    {} //ignore
    else if (parsed_line.kind  === "blank_line") {} //ignore
    else if ((parsed_line.kind === "coloned_comment_prop") ||
        (parsed_line.kind === "colonless_comment_prop")) {
        if(parsed_line.value_array) {high_value = parsed_line.value_array[0]}
        else                        {
            high_value = Dexter.defaults[high_key]  //todo bug: noah reports that Dexter.defaults
            //is unbound. So before calling defaults_read, we need to get that
            //Dexter.defaults bound and filled up SO that we can steal "high_value" from it.
            warning("While parsing the Defaults.make_ins file,<br/>" +
                "there is no value for the comment_property key: " + low_key +
                "<br/>so we're using the value from Dexter.default." + high_key +
                "<br/>which is: " + high_value)
        }
        this.defaults[high_key] = high_value
    }
    else if (parsed_line.kind === "whole_line_comment") {} //ignore
    else if (parsed_line.kind === "S_param") {
        if(!parsed_line.value_array) { //grab default from Dexter class
            high_value = Dexter.defaults[high_key]
            if(high_value === undefined){
                warning("While parsing the Defaults.make_ins file,<br/>" +
                    "there is no value for the S_param key: " + low_key +
                    "<br/>and there's no value from Dexter.default." + high_key +
                    "<br/>so we're ignoring: " + low_key)
            }
            this.defaults[high_key] = high_value
            warning("While parsing the Defaults.make_ins file,<br/>" +
                "there is no value for the S_param key: " + low_key +
                "<br/>so we're using the value from Dexter.default." + high_key +
                "<br/>which is: " + high_value)
        }
        else { //use value from the low level.
            let ins_arr = []
            ins_arr[Instruction.INSTRUCTION_TYPE] = "S"
            ins_arr[Instruction.INSTRUCTION_ARG0] = low_key
            ins_arr = ins_arr.concat(parsed_line.value_array)
            let dde_ins_arr = Socket.instruction_array_arcseconds_to_degrees_maybe(ins_arr, this)
            let val_arr = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG1) //the high_val array
            parsed_line.high_value_array = val_arr
            if (low_key === "LinkLengths") { //array of 5, but needs to be reversed
                let val = parsed_line.high_value_array.slice() //make a copy
                val.reverse() //copies in place
                this.defaults[low_key] = val
            }
            else if (["RebootServo", "ServoSetX", "ServoSet2X"].includes(low_key)) {
                if (!this.defaults.ServoSetup) {
                    this.defaults.ServoSetup = []
                }
                let obj = {}
                high_key = "S" + Dexter.defaults_arg_sep + low_key
                obj[high_key] = parsed_line.high_value_array
                obj.orig_line = line_number
                this.defaults.ServoSetup.push(obj)

            }
            else if (low_key === "CmdXor") {//Added by Noah, 2/1/2023
                if (!this.defaults[parsed_line.key]){
                    this.defaults[low_key] = []
                }
                this.defaults[low_key] = parsed_line.value_array;
            }
            else if (low_key === "JointStiffness") { //several values, for all joints.
                //this.defaults[high_key] = parsed_line.high_value_array
                //this has been depreicated so just ignore this value.
            }
            else if (low_key === "JointDH") {
                let joint_number = parsed_line.value_array[0] //the low value_array
                if (!this.defaults.dh_mat) {
                    this.defaults.dh_mat = []
                }
                let four_val_array = val_arr.slice(1) //take off the joint_number on the beginning of the array
                this.defaults.dh_mat[joint_number - 1] = four_val_array
            }
            else if (low_key.startsWith("Joint")){
                let joint_number = val_arr[0]
                let val = val_arr[1]
                if(!this.defaults[high_key]){
                    this.defaults[high_key] = []
                }
                let joint_number_minus_1 = joint_number - 1
                this.defaults[high_key][joint_number_minus_1] = val  //this works even if the joint_numbers are out of order. thank you JS!
            }
            else if (low_key.endsWith("Joint")){
                if(val_arr.length === 1){
                    this.defaults[high_key] = val_arr[0] //parsed_line.high_value_array[0]
                }
                else if (val_arr.length === 2){
                    let val = val_arr[0]
                    let joint_number = val_arr[1]
                    if(!this.defaults[high_key]){
                        this.defaults[high_key] = []
                    }
                    let joint_number_minus_1 = joint_number - 1
                    this.defaults[high_key][joint_number_minus_1] = val
                }
            }
            else if (Dexter.defaults_is_j_key(low_key)) {
                let [high_key, joint_number] = Dexter.defaults_j_key_to_high_key(low_key)
                if (!this.defaults[high_key]) {
                    this.defaults[high_key] = []
                }
                this.defaults[high_key][joint_number - 1] = val_arr[0]
            }
            else if (val_arr.length === 1) {
                this.defaults[low_key] = val_arr[0]
            }
            else {
                this.defaults[parsed_line.key] = val_arr
            }
        }
    }
    else if (parsed_line.kind === "oplet_instruction"){ //"z", mayby "a"
        if(parsed_line.value_array.length === 1){ //primarily for z oplet
            let ins_arr = []
            ins_arr[Instruction.INSTRUCTION_TYPE] = low_key
            ins_arr = ins_arr.concat(parsed_line.value_array)
            let dde_ins_arr = Socket.instruction_array_arcseconds_to_degrees_maybe(ins_arr, this)
            let new_val_arr = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG0)
            parsed_line.high_value_array = new_val_arr
            if(!this.defaults.ServoSetup) { this.defaults.ServoSetup = [] }
            let obj = {}
            obj[high_key] = parsed_line.high_value_array[0]
            obj.orig_line = line_number
            this.defaults.ServoSetup.push(obj)
        }
        else { //any oplet with non-1 args. primarily a, P, T
            let ins_arr = []
            ins_arr[Instruction.INSTRUCTION_TYPE] = low_key
            ins_arr = ins_arr.concat(parsed_line.value_array)
            let dde_ins_arr = Socket.instruction_array_arcseconds_to_degrees_maybe(ins_arr, this)
            let new_val_arr = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG0)
            parsed_line.high_value_array = new_val_arr
            if(!this.defaults.ServoSetup) { this.defaults.ServoSetup = [] }
            let obj = {}
            obj[high_key] = parsed_line.high_value_array
            obj.orig_line = line_number
            this.defaults.ServoSetup.push(obj)
        }
    }
    else { warning("bottom of Dexter.prototype.defaults_line_to_high_level <br/>" +
        "unhandled line: " + line)
    }
}

//returns null or an array of a number between 1 and 9 inclusive
//and the index of that J char in the key
/*Dexter.defaults_j_number_of_key = function(key){
   let j_pos = key.indexOf("J")
   if(j_pos === -1) { return null }
   else if (j_pos === (key.length - 1)) { return null } //no room for a digit
   else {
     let digit_maybe = key[j_pos + 1]
     if((digit_maybe >= '1') && (digit_maybe <= '9')) { //must be at least 1
         return [parseInt(digit_maybe), j_pos]
     }
     else { return null }
   }
}*/

Dexter.prototype.defaults_init_defaults = function(){
    let obj = {}
    for(let high_key of Dexter.defaults_j_key_suffixes){
        obj[high_key + "s"] = [] //if this array is EMPTY when we attempt to write to low level, it writes nothing.
    }
    this.defaults = obj
}

//A JKey is a S param name that starts with "J" followed by an integer from 1 thru 9
Dexter.defaults_j_key_suffixes = ["Force", "Friction", "BoundryHigh", "BoundryLow", "PID_P"]

// returns array of high_key (string) and integer (the joint number)
//if null is returned, key is not a j_key
//Dexter.defaults_j_key_to_high_key("J1Force")
//Dexter.defaults_j_key_to_high_key("J2_PID_P")
//J keys are above with suffixes of Dexter.defaults_j_key_suffixes .

Dexter.defaults_is_j_key = function(key){
    if(key.startsWith("J")) {
        for(let suffix of Dexter.defaults_j_key_suffixes) {
            if(key.endsWith(suffix)){ return true }
        }
    }
    return false
}

//doesn't start with J-digit, does end in "s", ie the high level equiv of a J key
// Dexter.defaults_is_high_j_key("Forces")
Dexter.defaults_is_high_j_key = function(high_key){
    if(!high_key.endsWith("s")) { return false }
    else {
        let low_key_suffix_maybe = high_key.substring(0, high_key.length - 1) //cut off "s" suffix
        return Dexter.defaults_j_key_suffixes.includes(low_key_suffix_maybe)
    }
    return false
}

Dexter.defaults_j_key_to_high_key = function(key){
    if(key.startsWith("J")) {
        for(let suffix of Dexter.defaults_j_key_suffixes) {
            if(key.endsWith(suffix)){
                let joint_number = parseInt(key[1])
                return [suffix + "s", joint_number] }
        }
    }
    return null
}


//joint number is 1 based.
//returns null if key isn't one that is supposed to be turned into a j_key
// Dexter.defaults_high_key_to_j_key("Forces", 1)
// Dexter.defaults_high_key_to_j_key("PID_Ps", 2)
Dexter.defaults_high_key_to_j_key = function(key, joint_number){
    key = key.substring(0, key.length - 1) //cut off the "s"
    let is_j_key = false
    for(let suffix of Dexter.defaults_j_key_suffixes) {
        if(key.endsWith(suffix)){is_j_key = true; break;}
    }
    if(!is_j_key) { return null }
    else if(key === "PID_P") { return "J" + joint_number + "_" + key}
    else                     { return "J" + joint_number       + key}
}

Dexter.prototype.defaults_compute_parsed_lines = function(){
    let parsed_lines = []
    for(let i = 0; i < this.defaults_lines.length; i++){
        let line = this.defaults_lines[i]
        let parsed_line = Dexter.defaults_parse_line(line, i)
        parsed_lines.push(parsed_line)
    }
    return parsed_lines
}

//warning: this deletes all the data from high_level, but then
//fills it back in again after done.
Dexter.prototype.defaults_high_level_to_defaults_lines = function(){
    let parsed_lines = this.defaults_compute_parsed_lines()
    let result_lines = []
    for(let line_number = 0; line_number < parsed_lines.length; line_number++){
        let parsed_line = parsed_lines[line_number]
        let low_key = parsed_line.key
        if      (parsed_line.kind === "invalid")    {} //ignore
        else if (parsed_line.kind === "blank_line") { result_lines.push("")}
        else if (parsed_line.kind === "coloned_comment_prop") {
            let high_key = low_key
            if(this.defaults[high_key]) { //user didn't delete it
                let new_line = "; " + low_key + ": " + this.defaults[high_key]
                result_lines.push(new_line)
                delete this.defaults[high_key]
            }
        }
        else if (parsed_line.kind === "colonless_comment_prop") {
            let high_key = low_key
            if(this.defaults[high_key]) { //user didn't delete it
                let new_line = "; " + low_key + " " + this.defaults[high_key]
                result_lines.push(new_line)
                delete this.defaults[high_key]
            }
        }
        else if (parsed_line.kind === "whole_line_comment") { //there won't be any of these in the high level, but just for completeness ...
            result_lines.push(parsed_line.comment)
        }
        else if (parsed_line.kind === "S_param") {
            let ins_arr = []
            ins_arr[Instruction.INSTRUCTION_TYPE] = "S"
            if (low_key === "LinkLengths") { //array of 5, but needs to be reversed
                let high_key = low_key
                if(this.defaults.hasOwnProperty(high_key)) { //user didn't delete it
                    ins_arr[Instruction.INSTRUCTION_ARG0] = low_key
                    let high_val = this.defaults[high_key].slice() //copy
                    high_val.reverse() //copies in place
                    ins_arr = ins_arr.concat(high_val)
                    let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                    let low_val = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG1) //grab all the link lengths, now in dexter units
                    let new_line = "S"      + Dexter.defaults_arg_sep +
                        low_key + Dexter.defaults_arg_sep +
                        low_val.join(Dexter.defaults_arg_sep) +
                        ";" + parsed_line.comment
                    result_lines.push(new_line)
                    delete this.defaults[high_key]
                }
            }
            else if (["RebootServo", "ServoSetX", "ServoSet2X"].includes(low_key)){  //no units conversion
                let new_lines = this.defaults_high_level_to_defaults_lines_ServoSetup_line(line_number)
                for(let new_line of new_lines) { result_lines.push(new_line) }
            }
            else if (low_key === "CmdXor") {//Added by Noah, 2/1/2023
                let high_key = low_key
                let new_line = "S" + Dexter.defaults_arg_sep + high_key
                    + Dexter.defaults_arg_sep +  this.defaults[high_key].join() +
                    ";" + parsed_line.comment
                out(new_line)
                result_lines.push(new_line)
            }
            else if(low_key === "JointDH"){
                if(this.defaults.hasOwnProperty("dh_mat")) { //user didn't delete it
                    let high_val = this.defaults.dh_mat
                    let joint_number = parsed_line.value_array[0]
                    let low_key = "JointDH"
                    ins_arr[Instruction.INSTRUCTION_ARG0] = low_key
                    ins_arr[Instruction.INSTRUCTION_ARG1] = joint_number
                    let high_val_for_one_joint = high_val[joint_number - 1]
                    ins_arr = ins_arr.concat(high_val_for_one_joint)
                    let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                    let low_val_four_numbers = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG2) //now in dexter units

                    let new_line = "S" + Dexter.defaults_arg_sep + low_key + Dexter.defaults_arg_sep +
                        joint_number + Dexter.defaults_arg_sep +
                        low_val_four_numbers.join(Dexter.defaults_arg_sep) +
                        ";" + parsed_line.comment
                    result_lines.push(new_line)
                    delete high_val[joint_number - 1]
                }
            }
            else if(Dexter.defaults_is_j_key(low_key)){//starts with J, 2nd char is digit. ie J1BoundryLow, with high key BoundryLows
                let [high_key, joint_number] = Dexter.defaults_j_key_to_high_key(low_key)
                if(this.defaults.hasOwnProperty(high_key)) { //user didn't delete it
                    ins_arr[Instruction.INSTRUCTION_ARG0] = low_key
                    let high_val = this.defaults[high_key][joint_number - 1]
                    ins_arr[Instruction.INSTRUCTION_ARG1] = high_val
                    let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                    let low_val = dde_ins_arr[Instruction.INSTRUCTION_ARG1] //grab all the link lengths, now in dexter units
                    let new_line = "S" + Dexter.defaults_arg_sep + low_key +
                        Dexter.defaults_arg_sep + low_val +
                        ";" + parsed_line.comment
                    result_lines.push(new_line)
                    delete this.defaults[high_key][joint_number - 1]
                }
            }
            else if(low_key.startsWith("Joint")) {
                if (this.defaults.hasOwnProperty(low_key)) { //user didn't delete it
                    let joint_number = parsed_line.value_array[0] // 1 based
                    let high_val = this.defaults[low_key]
                    let high_joint_val = high_val[joint_number - 1]
                    ins_arr[Instruction.INSTRUCTION_ARG0] = low_key
                    ins_arr[Instruction.INSTRUCTION_ARG1] = joint_number
                    ins_arr[Instruction.INSTRUCTION_ARG2] = high_joint_val
                    let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                    let low_val = dde_ins_arr[Instruction.INSTRUCTION_ARG2]
                    let new_line = "S" +
                        Dexter.defaults_arg_sep + low_key +
                        Dexter.defaults_arg_sep + joint_number +
                        Dexter.defaults_arg_sep + low_val +
                        ";" + parsed_line.comment
                    result_lines.push(new_line)
                    delete this.defaults[low_key][joint_number - 1]
                }
            }
            else if (low_key.endsWith("Joint")) {
                if (this.defaults.hasOwnProperty(low_key)) { //user didn't delete it
                    let joint_number = parsed_line.value_array[1] // 1 based
                    let high_val = this.defaults[low_key]
                    let high_joint_val = high_val[joint_number - 1]
                    ins_arr[Instruction.INSTRUCTION_ARG0] = low_key
                    ins_arr[Instruction.INSTRUCTION_ARG1] = high_joint_val
                    ins_arr[Instruction.INSTRUCTION_ARG2] = joint_number
                    let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                    let low_val = dde_ins_arr[Instruction.INSTRUCTION_ARG1]
                    let new_line = "S" +
                        Dexter.defaults_arg_sep + low_key +
                        Dexter.defaults_arg_sep + low_val +
                        Dexter.defaults_arg_sep + joint_number +
                        ";" + parsed_line.comment
                    result_lines.push(new_line)
                    delete this.defaults[low_key][joint_number - 1]
                }
            }

            else { //low_key is non j_key so use it as the high key
                let high_key = low_key
                if(this.defaults.hasOwnProperty(high_key)) { //user didn't delete it
                    let high_val = this.defaults[low_key]
                    ins_arr[Instruction.INSTRUCTION_ARG0] = low_key
                    let low_val_str
                    if(Array.isArray(high_val)) {
                        ins_arr = ins_arr.concat(high_val)
                        let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                        let low_val = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG1)
                        low_val_str = low_val.join(Dexter.defaults_arg_sep)
                    }
                    else {
                        ins_arr[Instruction.INSTRUCTION_ARG1] = high_val
                        let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                        let low_val = dde_ins_arr[Instruction.INSTRUCTION_ARG1]
                        low_val_str = low_val
                    }
                    let new_line = "S" + Dexter.defaults_arg_sep + high_key +
                        Dexter.defaults_arg_sep + low_val_str +
                        ";" + parsed_line.comment
                    delete this.defaults[high_key]
                    result_lines.push(new_line)
                }
            }
        } //end S param
        else if (parsed_line.kind === "oplet_instruction"){
            let new_lines = this.defaults_high_level_to_defaults_lines_ServoSetup_line(line_number)
            for(let new_line of new_lines) { result_lines.push(new_line) }
        }
        else { warning("bottom of Dexter.prototype.defaults_line_to_high_level <br/>" +
            "unhandled line: " + parsed_line.kind)
        }
    }//end loop

    let new_lines = this.defaults_high_level_to_defaults_lines_new_high_level()
    for(let new_line of new_lines){ result_lines.push(new_line) }
    //now all the data should be deleted from Dexter.dexter0.defaults (high level)
    this.defaults_lines = result_lines //update the low level
    //so recreate it in case uses wants to use it after "writing it out".
    Dexter.dexter0.defaults_lines_to_high_level() //fill in high level since the above deletes it all.
    return this.defaults_lines
}


Dexter.defaults_high_key_of_SS_obj = function(obj){
    if(!obj) { return null }
    for(let high_key of Object.keys(obj)){
        if(high_key !== "orig_line") { return high_key }
    }
    return null //probably shouldn't
}

//ServoSetup includes S, RebootServo & friends as well as a, z and maybe other oplet instructions.
//This fn handles both the items that were in the orign low level, as well as
//items added to the high level
//Handles the items in the ServoSetup array before and after the line_number,
//but not passed the next array elt that HAS a orig_line prop.
//But there still might remain some items in the array after the
//orig pass going thru the low_level lines, so
//when doing the "new" instructions pass,
//IF we pass an invalid line number, ie null,
//then this fn gets the rest of the items in the ServoSetup array
//below includes bug fix by Noah Jan 25, 2023
Dexter.prototype.defaults_high_level_to_defaults_lines_ServoSetup_line = function(line_number = null){
    let new_lines = []
    let servo_setup_orig_length = this.defaults.ServoSetup.length
    let saw_orig_line_obj = false
    for(let k = 0; k < servo_setup_orig_length; k++) {
        let an_obj = this.defaults.ServoSetup[k]
        let high_key = Dexter.defaults_high_key_of_SS_obj(an_obj) //could be "a", "z", "S, RebootServo" or similar "S, foo"
        let high_val = (high_key ? an_obj[high_key] : null ) //usually an array, but for "z", just a number
        if(an_obj && high_key && Dexter.defaults_writeable_value(high_val)){
            if(an_obj.hasOwnProperty("orig_line")){
                if(an_obj.orig_line === line_number){ saw_orig_line_obj = true } //and keep going
                //to collect those objs UNTIL the next one that has an orig_line prop.
                else { //got to the next orig_line number so we're done until that line number is
                    //requested by driven from the low level array of strings.
                    return new_lines
                }
            }
            let val_str //the below just sets val_str
            if(high_key.length === 1) { //oplet
                if(Array.isArray(high_val)) {
                    let ins_arr = []
                    ins_arr[Instruction.INSTRUCTION_TYPE] = high_key
                    ins_arr = ins_arr.concat(high_val)
                    let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                    let low_val = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG0)
                    val_str = low_val.join(Dexter.defaults_arg_sep)
                }
                else {
                    let ins_arr = []
                    ins_arr[Instruction.INSTRUCTION_TYPE] = high_key
                    ins_arr.push(high_val)
                    let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                    let low_val = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG0)
                    val_str = low_val.join(Dexter.defaults_arg_sep)
                }
            }
            else { // high_key looks like "S, RebootServo"
                let [oplet, s_param_name] = high_key.split(Dexter.defaults_arg_sep)
                let ins_arr = []
                ins_arr[Instruction.INSTRUCTION_TYPE] = oplet
                ins_arr[Instruction.INSTRUCTION_ARG0] = s_param_name
                if(Array.isArray(high_val)) {
                    ins_arr = ins_arr.concat(high_val)
                    let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                    let low_val = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG1)
                    val_str = low_val.join(Dexter.defaults_arg_sep)
                }
                else {
                    ins_arr.push(high_val)
                    let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                    let low_val = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG1)
                    val_str = low_val.join(Dexter.defaults_arg_sep)
                }
            }
            let new_line = high_key + Dexter.defaults_arg_sep + val_str + ";"
            new_lines.push(new_line)
            delete this.defaults.ServoSetup[k] //replaces the elt in the array with undefined
        }
        else {} //just skip over the obj. Its val is probably undefined.
    }
    return new_lines
}

Dexter.defaults_writeable_value = function(val){
    if(Array.isArray(val)){
        if(val.length === 0) { return false }
        else {
            for(let elt of val){
                if(Array.isArray(elt)) {
                    if(elt.length === 0) { return false }
                    else { return true }
                }
                else if(elt || (elt === 0)) { return true } //if any elt of the array has real data, write out array
            }
            return false
        }
    }
    else if(val || (val === 0)) { return true }
    else { return false }
}

//loop thru remaining high level (after deleted the matching lines from low level)
//and return an array of new lines
Dexter.prototype.defaults_high_level_to_defaults_lines_new_high_level = function(){
    let result_lines = []
    for(let high_key of Object.keys(this.defaults)){
        let high_val = this.defaults[high_key]
        if(!Dexter.defaults_writeable_value(high_val)) {} //no val to write out so skip it
        else if (high_key === "LinkLengths") { //array of 5, but needs to be reversed
            let low_key = high_key
            if(Dexter.defaults_writeable_value(high_val)) {
                high_val.reverse() //copies in place, but ok since we delete it below
                let ins_arr = []
                ins_arr[Instruction.INSTRUCTION_TYPE] = "S"
                ins_arr[Instruction.INSTRUCTION_ARG0] = low_key
                ins_arr = ins_arr.concat(high_val)
                let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                let val_arr = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG1)
                let new_line = "S"      + Dexter.defaults_arg_sep +
                    low_key + Dexter.defaults_arg_sep +
                    val_arr.join(Dexter.defaults_arg_sep) +
                    ";"
                result_lines.push(new_line)
                delete this.defaults[high_key]
            }
        }
        else if(high_key === "dh_mat"){
            for (let i = 0; i < high_val.length; i++) {
                let joint_number = i + 1
                let high_val_joint_arr = high_val[i]
                let low_key = "JointDH"
                let ins_arr = []
                ins_arr[Instruction.INSTRUCTION_TYPE] = "S"
                ins_arr[Instruction.INSTRUCTION_ARG0] = low_key
                ins_arr[Instruction.INSTRUCTION_ARG1] = joint_number
                ins_arr = ins_arr.concat(high_val_joint_arr)
                let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                let low_val_arr = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG2)

                let new_line = "S" + Dexter.defaults_arg_sep  + low_key + Dexter.defaults_arg_sep +
                    joint_number   + Dexter.defaults_arg_sep  +
                    low_val_arr.join(Dexter.defaults_arg_sep) +
                    ";"
                result_lines.push(new_line)
                delete high_val[i]
            }
        }
        else if (high_key === "ServoSetup"){ //rebootServo and oplets under this. //no units conversion
            let new_lines = this.defaults_high_level_to_defaults_lines_ServoSetup_line(null) //null means get all the remaining ones in the ServoSetup array
            for(let new_line of new_lines) { result_lines.push(new_line) }
        }
        else if(Dexter.defaults_is_high_j_key(high_key)){
            for(let joint_number = 1; joint_number <= high_val.length; joint_number++){
                let low_key  = "J" + joint_number + high_key.substring(0, high_key.length - 1) //cut off "s" suffix from high_key
                let high_val_for_a_joint = high_val[joint_number - 1]
                let ins_arr = []
                ins_arr[Instruction.INSTRUCTION_TYPE] = "S"
                ins_arr[Instruction.INSTRUCTION_ARG0] = high_val_for_a_joint
                let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
                let low_val = dde_ins_arr[Instruction.INSTRUCTION_ARG1]
                let new_line = "S" + Dexter.defaults_arg_sep + low_key +
                    Dexter.defaults_arg_sep + low_val +
                    ";"
                result_lines.push(new_line)
            }
            delete this.defaults[high_key]
        }
        else if(high_key === "CmdXor"){} //already in the result so don't stick it in a 2nd time
        else { //low_key is non j_key so same as high key
            let low_key = high_key
            let ins_arr = []
            ins_arr[Instruction.INSTRUCTION_TYPE] = "S"
            ins_arr[Instruction.INSTRUCTION_ARG0] = low_key
            if(Array.isArray(high_val)) { ins_arr = ins_arr.concat(high_val) }
            else { ins_arr[Instruction.INSTRUCTION_ARG1] = high_val }
            let dde_ins_arr = Socket.instruction_array_degrees_to_arcseconds_maybe(ins_arr, this)
            let low_val_arr = dde_ins_arr.slice(Instruction.INSTRUCTION_ARG1)
            let low_val_str = low_val_arr.join(Dexter.defaults_arg_sep)
            let new_line = "S" + Dexter.defaults_arg_sep + low_key +
                Dexter.defaults_arg_sep + low_val_str + ";"
            delete this.defaults[high_key]
            result_lines.push(new_line)
        }
    }
    return result_lines
}

/* EXAMPLES
Dexter.dexter0.defaults_read() //the real top level. Gets the file, makes low level, then high level
//LOW LEVEL OPERATORS
Dexter.dexter0.defaults_set("whole_file_string", read_file("Defaults.make_ins")) //good for testing initialization
Dexter.dexter0.defaults_get("whole_file_string") //gets content from low level data, not the file
        //best to view the above in DDE with Output pane header "Code" checkbox checked.

Dexter.dexter0.defaults_get("lines")         //see the low level representation
Dexter.dexter0.defaults_get(3)               //see a particular line of the low level
Dexter.dexter0.defaults_get(-1)              //see the last line of the low level
Dexter.dexter0.defaults_get("J1BoundryHigh") //see J1BoundryHigh value
Dexter.dexter0.defaults.BoundryHighs
Dexter.dexter0.defaults.BoundryHighs[0] = 180
Dexter.dexter0.defaults_get("S, JointDH, 1")
Dexter.dexter0.defaults_get("^S, JointDH") //get array of all matching. But I might change this to get_all
Dexter.dexter0.defaults_get("^S, JointDH, \\d")
Dexter.dexter0.defaults_set("S, JointDH, 1", "225656, 224100, 260, 323413")

Dexter.dexter0.defaults_set(0,  ";top line comment")
Dexter.dexter0.defaults_set(-1, ";bottom line comment")
Dexter.dexter0.defaults_set("J1BoundryHigh", 777000)

Dexter.dexter0.defaults_insert("z 2000")

Dexter.dexter0.defaults_delete("Dexter Model")
Dexter.dexter0.defaults_delete("'^J\\dBoundryHi'")

Dexter.dexter0.defaults_get("Dexter Model")


Dexter.dexter0.defaults_compute_parsed_lines() //internal

// Dexter.dexter0.defaults_lines_to_high_level() //internal
Dexter.dexter0.defaults
Dexter.dexter0.defaults.Forces[1] = 60  //high level set
Dexter.dexter0.defaults.Forces[2] = 90  //high level set
Dexter.dexter0.defaults.ServoSetup.push({"a": [10, 20, 30]}) //high level insert
Dexter.dexter0.defaults.ServoSetup.unshift({"a": [90, 80, 70]}) //high level insert
Dexter.dexter0.defaults.LinkLengths
to_source_code({value: Dexter.dexter0.defaults.dh_mat})
js_beautify(JSON.stringify(Dexter.dexter0.defaults))

Dexter.dexter0.defaults_get("LinkLengths")
var a_dh_mat = Dexter.dexter0.defaults.dh_mat
a_dh_mat[0][0] = 250000
a_dh_mat[0] = [250000, 325000, 0.26, 89.83694444444444]

delete Dexter.dexter0.defaults.BWDampJoint

Dexter.dexter0.defaults.LinkLengths
Dexter.dexter0.defaults.LinkLengths[0] = 0.2


Dexter.dexter0.defaults_high_level_to_defaults_lines()

Dexter.dexter0.defaults_write_return_string()

// Dexter.dexter0.defaults_write() //warning: not ready for prime time. make a backup first.
*/





