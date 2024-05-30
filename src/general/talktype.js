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
"or type1; type2"
"and type1; type2"
"not type"
"notValue possible_val_str"
"className" (uses val instanceof classname)
"startsWith a string"
"array elt_type; min_length=0; max_length=Infinity"

function(val) { return boolean }
   Example: "possible_job_name"
   Example: "existing_job_name"

"string"  //essentially means the value_str isn't anything else, so just treat it as a string.
*/

globalThis.TalkType = class TalkType {
    static is_a(value_str, type){
        let [type_name, details] = Utils.separate_head_and_tail(type, " ", true)
       if(type_name === "boolean"){
           return ((value_str === "true") || (value_str === "false"))
       }
       else if(type_name === "integer"){
           let val = parseInt(value_str)
           if(Number.isNaN(val)){ return false }
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