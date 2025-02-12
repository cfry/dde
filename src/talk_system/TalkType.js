/* Examples of types
"boolean"
"integer"
"integer 1 thru 7"
"number"
"number 1 thru 7"
"null"
"undefined"
"null_or_undefined"


"oneof 1 2 3 4 5 6 7"
"oneof_not_exclusive type 0 1 2 3"
"or type1; type2"
"and type1; type2"
"not type"
"notValue possible_val_str"
"className" (uses val instanceof classname)
"string"  any string
"startsWith a string"
"array elt_type; min_length=0; max_length=Infinity"

function(val) { return boolean }
   Example: "possible_job_name"
   Example: "existing_job_name"

"string"  //essentially means the value_str isn't anything else, so just treat it as a string.
*/

globalThis.TalkType = class TalkType {
    //string is usually the content arg to a normal top level cmd.
    //Effectively, Talk's eval
    //converts "zero" thru "nine" to 0  thru 9.
    // Google speech reco:
    //    - returns string of digits, and minus sign for numbers not "zero" thru "nine",
    //    - returns string of digits for "one point two"
    //    - for isolated words, returns "two" and "four", but may return "to" or "for " in context.
    //    - input "for dollars" returns "$4"
    //uCalled by TalkType.any.source_to_value
    static string_to_data(string) {
        if     (string === "true")      { return true      }
        else if(string === "false")     { return false     }
        else if(string === "null")      { return null      }
        else if(string === "undefined") { return undefined }
        else if (Utils.is_string_a_number(string)) { return parseFloat(string) }
        else if (string.startsWith("array ")){
            let array_elts_str = string.substring(6).trim()
            let array_elts = array_elts_str.split(",")
            let result = []
            for(let arr_elt_str of array_elts){
                arr_elt_str = arr_elt_str.trim() //just ins case real sep is ", "
                let arr_val = this.string_to_data(arr_elt_str)
                result.push(arr_val)
            }
            return result
        }
        else if(string.startsWith("object ")){
            let obj_elts_str = string.substring(7).trim()
            let obj_pairs_str = obj_elts_str.split(",")
            let result = {}
            for(let obj_pair_str of obj_pairs_str){
                obj_pair_str = obj_pair_str.trim() //just in csae the separator was ", "
                let space_pos = obj_pair_str.indexOf(" ") //todo only allows 1 word long names
                let name = obj_pair_str.substring(0, space_pos).trim()
                let val_str = obj_pair_str.substring(space_pos + 1).trim()
                let val = this.string_to_data(val_str)
                result[name] = val
            }
            return result
        }
        else {
            let integer_maybe = this.string_to_small_integer(string)
            if(integer_maybe === false) {
                return string //could be the empty string
            }
            else { return integer_maybe}
        }
    }

    typical_string_values(){
        if(Array.isArray(this.typical)) { return this.typical}
        else if(typeof(this.typical === "function")) {
            return this.typical.call(this)
        }
        else {
            let clz = Utils.get_class_of_instance(this)
            let clz_name = Utils.get_class_name(clz)
            dde_error("The 'typical' property for an instance of: " +  clz_name +  "<br/>" +
                       " is: " + this.typical + " but should be <br/>" +
                       "an array of strings or a function that returns an array of strings.")
        }
    }
    //returns string for an error message or null, meaning str is of the correct type
    is_type_for_string_error_message(str){
        if(this.is_type_for_string(str)){ return null }
        else {
            let clz = Utils.get_class_of_instance(this)
            let clz_name = Utils.get_class_name(clz)
            let desc = this.prose_type_description()
            return str + " is not a valid type for: " + clz_name + " which requires:<br/>" + desc
        }
    }
    prose_type_description() {
        if(this.typical_is_exclusive){
            return "one of: " + this.typical.join(", ") + "."
        }
        else { return "" } //no new info to add, by default
    }

    //only converts "zero" thru "nine" to 0 thru 9 or returns false
    static string_to_small_integer(a_string){
        let integer = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"].indexOf(a_string)
        if(integer === -1) {
            return false
        }
        else {
            return integer
        }
    }
}

globalThis.TalkTypeAny = class TalkTypeAny extends TalkType{
    constructor({typical= ["0", "true", "one, two"], //can be either an array of strings or a function that returns an array of strings
                    typical_is_exclusive = false}={}) {
        super()
        this.typical = ["true", "0", "one, two"]
        this.typical_is_exclusive = typical_is_exclusive //means that, if true, ALL the valid values are in the typical array
    }
    is_type_for_string(str) {
        return true
    }
    static inst = new TalkTypeAny({})

    //IF it can make the source into the data type indicated by this class, then it returns it,
    //else returns Number.NaN
    source_to_value(source){
        return TalkType.string_to_data(source)
    }
}


globalThis.TalkTypeBoolean = class TalkTypeBoolean extends TalkType {
    constructor({}={}) {
        super()
        this.typical = ["true", "false"]
        this.typical_is_exclusive = true
    }

    is_type_for_string(str){
        return this.typical.includes(str)
    }

    source_to_value(source){
        if(source === "true") { return true }
        else if(source === "false ") { return false }
        else { return Number.NaN}
    }

    //returns a string
    html_for_value_entry(id, value=false) {
        return
        '<span title"' + this.tooltip + '">\n' +
        '<input type="radio" name="' + id + '" ' +
        ((value === true) ? " checked " : "") +
         '/>true &nbsp; &nbsp; ' +
        ((value === false) ? " checked " : "") +
        '/>false</span>'
    }
}

globalThis.TalkTypeInteger = class TalkTypeInteger extends TalkType {
    constructor({
                    typical = [-1, 0, 1, 2],
                    typical_is_exclusive = false,
                    min = -Infinity,
                    max = Infinity
                }={}) {
        super()
        this.typical = typical
        this.typical_is_exclusive = typical_is_exclusive
        this.min = min
        this.max = max
    }

    is_type_for_string(str) {
        let val = parseInt(str)
        if (!Number.isInteger(val)) {
            return false
        } else if (this.typical_is_exclusive) {
            return this.typical.includes(val)
        } else if (this.min > val) {
            return false
        } else if (this.max < val) {
            return false
        } else {
            return true
        }
    }

    source_to_value(source) {
        if(this.is_type_for_string(source)){
            return parseInt(source)
        }
        else {
            return Number.NaN
        }
    }
}

globalThis.TalkTypeNumber = class TalkTypeNumber extends TalkType {
    constructor({
                    typical = [-1, 0, 1, 2],
                    typical_is_exclusive = false,
                    min = -Infinity,
                    max = Infinity
                }={}) {
        super()
        this.typical_is_exclusive = typical_is_exclusive
        this.min = min
        this.max = max
    }

    is_type_for_string(str) {
        let val = parseFloat(str)
        if (typeof(val) !== "number") {
            return false
        } else if (this.typical_is_exclusive) {
            return this.typical.includes(val)
        } else if (this.min > val) {
            return false
        } else if (this.max < val) {
            return false
        } else {
            return true
        }
    }
    source_to_value(source) {
        if(this.is_type_for_string(source)){
            return parseFloat(source)
        }
        else {
            return Number.NaN
        }
    }
}

globalThis.TalkTypeNullOrUndefined = class TalkTypeNullOrUndefined extends TalkType {
    constructor({}={}) {
        super()
        this.typical = ["null", "undefined", ""]
        this.typical_is_exclusive = true
    }
    is_type_for_string(str) {
        return ((str === "null") || (str === "undefined") || (str === ""))
    }
    source_to_value(source) {
        if(source === "null"){
            return null
        }
        else if(source === "undefined"){
            return undefined
        }
        else if(source === ""){
            return ""
        }
        else {
            return Number.NaN
        }
    }
}

globalThis.TalkTypeString = class TalkTypeString  extends TalkType{
    constructor({ typical = ["hello world", "what does GPT mean?"],
                    typical_is_exclusive=false}={}) {
        super()
        this.typical = typical
        this.typical_is_exclusive = typical_is_exclusive
    }

    is_type_for_string(str) {
        if(this.typical_is_exclusive){
            return this.typical.includes(str)
        }
        else { return true }
    }
    source_to_value(source) {
        return source.trim()
    }
}

globalThis.TalkTypeJobName = class TalkTypeString  extends TalkType{
    constructor({typical = ["my_job", "job1"],
                    typical_is_exclusive=false}={}) {
        super()
        this.typical = this.typical_value_strings()
        this.typical_is_exclusive = typical_is_exclusive
    }

    typical_value_strings(){
       return Job.all_names
    }

    is_type_for_string(str) {
        return Talk.is_existing_job_name(str)
    }
    source_to_value(source) {
        return Talk.string_to_job_name(source)
    }
}

TalkType.JobNameOrNewJobName = class JobNameOrNewJobName  extends TalkType{
    constructor({ typical = function(){return Job.all_names},
                  typical_is_exclusive=false}={}) {
        super()
        this.typical = typical
        this.typical_is_exclusive = typical_is_exclusive
    }

    is_type_for_string(str) {
        let job_name_maybe = Talk.string_to_job_name(source)
        if(Job[job_name_maybe]) {
            return true
        }
        else { return false }
    }

    source_to_value(source) {
        let meth_name = Talk.string_to_method_name(source)
        if(!Utils.is_string_an_identifier(meth_name)) {
            return Number.NaN
        }
        else {
            return Talk.string_to_job_name(source) //if source can be coered into an existing job name, it is, else just make string a valid job name, ie replace spaces with underscores.
        }
    }
}

globalThis.TalkTypeOneof = class TalkTypeOneof  extends TalkType{
    constructor({ typical,
                    typical_is_exclusive = true,
                    elt_type_inst}={}) {
        super()
        this.elt_type_inst = type_inst
        this.typical = typical
        this.typical_is_exclusive = typical_is_exclusive
    }
    is_type_for_string(str) {
        if (this.exclusive) {
            return this.typical.includes(str)
        } else if (this.elt_type_inst.is_type_for_string(str)) {
            return true
        } else {
            return false
        }
    }
    source_to_value(source) {
        if (this.exclusive) {
            if(this.typical.includes(str)){
                return this.elt_type_inst.source_to_class(source)
            }
            else { return Number.Nan }
        }
        else {
            return this.elt_type_inst.source_to_class(source)
        }
    }
}

globalThis.TalkTypeArray = class TalkTypeArray  extends TalkType{
    constructor({
                    typical,
                    typical_is_exclusive,
                    elt_type_inst=TalkTypeNumber,
                    min_length = 0,
                    max_length = Infinity}={}) {
        super()
        this.typical = typical
        this.typical = ["true", "0", "one, two"]
        this.typical_is_exclusive = typical_is_exclusive
        this.elt_type_inst = type_inst
        this.min_length = min_length
        this.max_length = max_length
    }
    is_type_for_string(str) {
        str = str.replaceAll("comma", ", ")
        let arr_of_strs = str.split("'")
        if(this.min_length > arr_of_strs.length) {
            return false
        }
        else if (this.max_length < arr_of_strs.length ) {
            return false
        }
        else {
            for (let i = 0; i < arr_of_strs.length; i++) {
                let str_elt = arr_of_strs[i].trim()
                if(this.exclusive) {
                    if (!this.typical.includes(str_elt)) {
                        return false
                    }
                }
                else if (!elt_type_inst.is_type_for_str(str_elt)) {
                        return false
                }
            }
            return true
        }
    }

    source_to_value(source) {
        source = source.replaceAll("comma", ", ")
        let arr_of_strs = source.split("'")
        if(this.min_length > arr_of_strs.length) {
            return Number.Nan
        }
        else if (this.max_length < arr_of_strs.length ) {
            return Number.Nan
        }
        else {
            let value = []
            for (let i = 0; i < arr_of_strs.length; i++) {
                let str_elt = arr_of_strs[i].trim()
                if (this.exclusive) {
                    if (this.typical.includes(str_elt)) {
                        let elt_val = this.elt_type_inst.source_to_value(str_elt)
                        if (elt_val === Number.NaN) {
                            return Number.Nan
                        } else {
                            value.push(elt_val)
                        }
                    } else {
                        return Number.Nan
                    }
                } else {
                    let elt_val = this.elt_type_inst.source_to_value(str_elt)
                    if (elt_val === Number.NaN) {
                        return Number.Nan
                    } else {
                        value.push(elt_val)
                    }
                }
            }// end for loop
            return value
        }
    }
} //end TalkTypeArray


/*
static is_a(value_str, type){
        let [type_name, details] = Utils.separate_head_and_tail(type, " ", true)
       if(type_name === "boolean"){
           return ((value_str === "true") || (value_str === "false"))
       }
       else if(type_name === "integer"){
           let val = parseInt(value_str)
           if(!Number.isInteger(val)){ return false }
           else {
               if(details === ""){ return true  }
               else {
                   let [min_str, thru, max_str] = details.split(" ")
                   if((min_str === "") || (min_str === undefined)) { return true }
                   let min = parseInt(min_str)
                   if(Number.isNaN(min)){
                       dde_error("TalkType.is_a passed non-integer: " + min_str + " for integer min.")
                   }
                   if(min > val) { return false }

                   if((max_str === "") || (max_str === undefined)) { return true }
                   let max = parseInt(max_str)
                   if(max === "") { return true } //we know that val is >= the min, and no max so assume no restriction on max and we're good to go.
                   if(Number.isNaN(max)){
                       dde_error("TalkType.is_a passed non-integer: " + min_str + " for number min.")
                   }
                   else if(val <= max){ return true }
                   else { return false}
               }
           }
        }
        else if(type_name === "number"){
           let val = parseFloat(value_str)
           if(Number.isNaN(val)){ return false }
           else {
               if(details === ""){ return true  }
               else {
                   let [min_str, thru, max_str] = details.split(" ")
                   if((min_str === "") || (min_str === undefined)) { return true }
                   if(min_str === "") { return true }
                   let min = parseFloat(min_str)
                   if(Number.isNaN(min)){
                       dde_error("TalkType.is_a passed non-number: " + min_str + " for number min.")
                   }
                   if(min > val) { return false }

                   if((max_str === "") || (max_str === undefined)) { return true }
                   let max = parseFloat(max_str)
                   if(max === "") { return true } //we know that val is >= the min, and no max so assume no restriction on max and we're good to go.
                   if(Number.isNaN(max)){
                       dde_error("TalkType.is_a passed non-number: " + min_str + " for number min.")
                   }
                   else if(val <= max){ return true }
                   else { return false}
               }
           }
       }
       else if (type_name === "null") {
           return (value_str === "null")
       }
       else if (type_name === "undefined") {
           return (value_str === "undefined")
       }
       else if (type_name === "null_or_undefined") {
           return ((value_str === "null") || (value_str === "undefined"))
       }
       else if(type_name === "oneof"){ //the details holds possible values (not possible types)
           let val = Talk.string_to_data(value_str)
           let possible_val_strs = details.split(/\s+/)
           for(let possible_val_str of possible_val_strs){
               let possible_val = Talk.string_to_data(possible_val_str)
               if(val === possible_val){
                   return true
               }
           }
           return false
       }
       else if(type_name === "or"){ //the details holds possible types (not possible values)
           let possible_type_strs = details.split(/\s+/)
           for(let possible_type_str of possible_type_strs){
               if(TalkType.is_a(value_str, possible_type_str)){
                   return true
               }
           }
           return false
       }
       else if(type_name === "and"){ //the details holds possible types (not possible values)
           let possible_type_strs = details.split(/\s+/)
           for(let possible_type_str of possible_type_strs){
               if(!TalkType.is_a(value_str, possible_type_str)){
                   return false
               }
           }
           return true
       }
       else if(type_name === "not"){ //the details holds possible types (not possible values)
           //if val_str is NOT of the type in details, return true
           if(TalkType.is_a(value_str, details)){
                   return false
           }
           else return true
       }
       else if(type_name === "notValue"){ //the details holds possible types (not possible values)
           //if value_str is NOT of the type in details, return true
           let val = eval(value_str)
           let possible_value = Talk.string_to_data(details)
           if(val !== possible_value){
               return true
           }
           else {
               return false
           }
       }
       else if (value_str.startsWith(details)){
           return true
       }
       else if(type_name === "className"){
           let val = Utils.value_of_path(details)
           return Utils.is_class(val)
       }
       else if(type_name === "array") {
           let [possible_elt_type, min_str, thru, max_str] = details.split(";") //if details lacks min_str, and/or max_str, these missing strs are bound to undefined
           let min //minimum length of the array we are testing
           if(!min_str) { min = 0 }
           else {
               min = parseInt(min_str)
               if (Number.isNaN(min)) {
                   dde_error("TalkType.is_a passed array min length of: " + min_str + " which is not an integer.")
               }
           }
           let max //maximum length of the array we are testing
           if(!max_str) { max = Infinity }
           else {
               max = parseInt(max_str)
               if (Number.isNaN(max)) {
                   dde_error("TalkType.is_a passed array max length of: " + max_str + " which is not an integer.")
               }
           }
           let val_strs = details.split(",") //  /\s+/
           for(let val_str of val_strs){
               val_str = val_str.trim() //just in case the real separator was ", ", not just ","
               let type_is_good = TalkType.is_a(val_str, possible_elt_type)
               if(!type_is_good) {
                   return false
               }
           }
           //all val_strs are of the right type, now do we have the right number of them?
           if((val_strs.length >= min) && (val_strs.length <= max)){
               return true
           }
           else { return false} //wrong number of values in array
       }
       else {
           let type_fn = Utils.value_of_path(type)
           if (!type_fn) {
               dde_error("TalkType.is_a passed invalid type: " + type)
           } else if (Utils.is_class(type_fn)) {
               try {
                   let val = eval(value_str) //warning: a bit dangerous
                   if (val instanceof type_fn) {
                       return true
                   } else {
                       return false
                   }
               } catch (err) {
                   return false
               }
           }
           else if (typeof(type_fn) === "function") {
               let result = type_fn.call(null, value_str)
               if (result) {
                   return true
               } else {
                   return false
               }
           }
           else {
               dde_error(dde_error("TalkType.is_a passed invalid type: " + type))
           }
       }
    }

} //end of TalkType
 */