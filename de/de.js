/* https://pegjs.org/documentation
npm install pegjs --save
*/
var DE = class DE {
  static de_to_js(de_src) { return DE.parser.parse(de_src) }
  static make_verb_rule{ 
  	let result = ""
    for(let key of Object.keys(DE.ops)){
    	else { result += key + " / "}
    }
    return result + "variable"
  }
  
  static handle_infix_call(got_you, subj, vb, args) {
        debugger
        if (got_you) { return false }
        else if(subj && args) {
        	args = args.substring(1, args.length - 1) //strip ( and )
            let args_array = args.split(",")
            let clean_args = []
            for(let arg of args_array) {clean_args.push(arg.trim()) }
            let op = DE.ops[vb]
            if (!op) { return false }
            else { let result = subj
                   for(let clean_arg of clean_args) {
                       result += " " + op + " " + clean_arg
                   }
                   return "(" + result + ")"
            }
        }
  		else { return false }
	}
}

DE.peg = require("pegjs")

DE.ops = {"less than": "<",
          "equal to":  "==",
          "same as":   "===",
          "less than or equal to": "<=",
          "more than": ">", 
          "more than or equal to": ">=",
          "not equal to": "!=",
          "not same as":  "!==",

          "plus": "+",
          "minus": "-",
          "times": "*",
          "divide": "/",
          "remainder" : "%",
          "to the power of": "**",

          "all of": "&&",
          "one of": "||"
         }

DE.parser = peg.generate(
`start                = result:expr { return result }
expr                 = before_com:comment* ws_or_not result:(maker / sentence / path / variable / undefined / number ) ws_or_not after_com:comment* { return before_com + result + after_com }
maker                = "make" ws (("an" / "a") ws)? subj:subject ws "with" ws args:arguments? "." { return "new " + subj + args }

sentence             = result:(sent_verb_args / sent_subj_verb_args / sent_subj_verb / sent_verb) { return result }
sent_verb_args       = vb:verb ws "with" ws args:arguments "." { return vb + args }
sent_subj_verb_args  = subj:subject ws vb:verb ws "with" ws args:arguments "." { 
	                         let got_you = ((subj == "you") || (subj == "You"))
                             let infix_result = DE.handle_infix_call(got_you, subj, vb, args)
                             if( infix_result) { return infix_result }
                             else {
                             	let first   = (got_you ? "" : subj + ".")
                             	return first + vb + args 
                             }
                            }
sent_subj_verb       = subj:subject ws vb:verb ws "with" (ws undefined)? "." { return subj + "." + vb + "()" }
sent_verb            = vb:verb ws "with" (ws undefined)? "."                { return vb + "()"  }

subject              = result:(path / variable / number)            { return result }
verb                 =  "less than" / variable              { return text() }
arguments            = var_num1:argument var_nums:(arg_sep argument)* { 
                       let args = var_num1
                       for(let i = 0; i < var_nums.length; i++){
                       	  let arr = var_nums[i]
                          let prefix = ", "
                          args += prefix + arr[1]
                       }
                       let keywords = args.includes(": ") //if there is one keyword arg, they better all be. We don't check this, however
                       return "(" + (keywords? "{": "") + args + (keywords? "}": "") + ")" 
                     }
argument             = arg_name:(variable ws "of" ws)? the_expr:expr {
                            let prefix = ""
                            if(arg_name) { prefix = arg_name[0] + ": " }
                            return prefix + the_expr
                       }
arg_sep  "arg_sep"   = ws_or_not ("and" / ",") ws_or_not  { return ", " }

path     "path"      = variable ("/" variable)+           { return replace_substrings(text(), "/", ".") }
var_or_num           = variable / number                  { return text() }
variable "variable"  = !reserved_word [a-z_]i [a-z0-9_]*    { return text() }

undefined            = "nothing"  { return "undefined" }
reserved_word        = ( "with" / "and" / "nothing" ) ![A-Za-z_]

number   "number"    = float / integer                    { return text() }
float    "float"     = integer "." integer_sans_sign      { return text() }
integer  "integer"   = ("+" / "-")? digits:[0-9]+         { return text() }
integer_sans_sign    = digits:[0-9]+  { return text() }
ws       "ws"        = [ \\t\\r\\n]+
ws_or_not            = [ \\t\\r\\n]*
comment              = "(" result:[^\\)]* ")"  { return "/*" + result.join("") + "*/" }
`
)



 /*var:(variable ws "of" ws)? the_expr:expr {
                          let prefix = ""
                          if(var) { prefix = var + ": " }
                          return prefix + the_expr
                       }
                       
var parser = peg.generate(
`start     =  path      
path     "path"      = variable ("/" variable)+           { return replace_substrings(text(), "/", ".") }
variable "variable"  = [a-z]i [a-z0-9]*                   { return text() }

`
)
*/


