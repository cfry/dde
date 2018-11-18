/* https://pegjs.org/documentation
npm install pegjs --save
DE.make_verb_rule_expers()
*/
var DE = class DE {
  static de_to_js(de_src) { 
     let tracer_instance = new DE.PegTracer(de_src,{
                                              parent:null,
                                              hiddenPaths:[],
                                              useColor:false,
                                              showTrace:true,
                                              maxSourceLines:6,
                                              maxPathLength:72,
		})
     return DE.parser.parse(de_src, {tracer: tracer_instance}) 
  }
  
  static make_verb_rule_expers() { 
  	let result = ""
    let the_keys = Object.keys(DE.ops)
    the_keys.sort(function(a1, a2) { 
    				if      (a1.length > a2.length)  { return -1 }
                    else if (a1.length == a2.length) { return 0 }
                    else                             { return 1 }
                    })
    for(let key of the_keys){
    	result += '"' + key + '" / '
    }
    return result + "variable"
  }
  
  static handle_infix_call(got_you, subj, vb, args) {
        if (got_you) { return false }
        else if(subj && args) {
        	args = args.substring(1, args.length - 1) //strip ( and )
            let args_array = args.split(",")
            let clean_args = []
            for(let arg of args_array) {clean_args.push(arg.trim()) }
            let op = DE.ops[vb]
            if (!op) { return false } //not an infix call, handle with normal call code
            else if (clean_args.length == 0) { 
               dde_error("In Definitive English, with subject of: " + subj + 
                         " and verb of: " + vb + 
                         " which requires arguments but none were supplied.")
            }
            else { 
            	let result = subj
              	for(let clean_arg of clean_args) {
                	result += " " + op + " " + clean_arg
              	}
             	return "(" + result + ")"
           }
        }
  		else { return false }
	}
} //end class DE

DE.ops = {"less than": "<",
          "equals":    "==",
          "same as":   "===",
          "less than or equals": "<=",
          "more than": ">", 
          "more than or equals": ">=",
          "not equals": "!=",
          "not same as":  "!==",

          "plus": "+",
          "minus": "-",
          "times": "*",
          "divide": "/",
          "remainder" : "%",
          "power": "**",

          "also": "&&",
          "or":   "||"
         }
DE.peg = require("pegjs")
DE.PegTracer = require('pegjs-backtrace');

DE.parser = DE.peg.generate(
`start               = result:expr { return result }
expr                 = before_com:comment* ws_or_not result:(fn_def / assignment / maker / sentence / string1 / path / variable / undefined / number) ws_or_not after_com:comment* 
                       { return before_com + result + after_com }
maker                = "make" ws (("an" / "a") ws)? subj:subject ws "with" ws args:arguments? sent_end 
                        { if (subj == "Array") { 
                            args = args.substring(1, args.length - 1)
                            return "[" + args + "]" }
                          else if (subj == "Object") {
                             result = args.substring(1, args.length - 1) //cut off parens 
                             return result
                          }
                          else return "new " + subj + args 
                        }
assignment           = scope:(("variable" / "local") ws)? loc:(path / variable) ws "means" ws val:expr sent_end { 
                           let the_scope = ""
                           if(scope){
                           	if      (scope[0].startsWith("variable")) { the_scope = "var "}
                           	else if (scope[0].startsWith("local"))    { the_scope = "let "}
                           }
                           return the_scope + loc + " = " + val 
                        }
                        
fn_def               = "to" ws sentence ws_or_not eb:exprs_block
                        {   let result = "function " + name + args + eb 
                            console.log("got fn_def: " + result)
                            return result
                        }
exprs_block          = "do" ws the_expers:(expr ws)* "!" {
                           console.log("got expers_block with: " + the_expers)
                           let result = "{"
                           for(expr of the_expers){
                           }
                           result += "}"
                       }

sentence             = result:(sent_subj_verb_args / sent_verb_args / sent_subj_verb / sent_verb) { 
                          console.log("got sentence: " + result)
                          return result 
                      }
sent_verb_args       = vb:verb ws "with" ws args:arguments sent_end { 
                        let result = vb + args 
                        console.log("got sent_verb args: " + result)
                        return result
                        }
sent_subj_verb_args  = subj:subject ws vb:verb ws "with" ws args:arguments sent_end { 
	                         //debugger;
                             let got_you = ((subj == "you") || (subj == "You"))
                             let infix_result = DE.handle_infix_call(got_you, subj, vb, args)
                             if( infix_result) { return infix_result }
                             else {
                             	let first   = (got_you ? "" : subj + ".")
                             	return first + vb + args 
                             }
                            }
sent_subj_verb       = subj:subject ws vb:verb ws "with" (ws undefined)? sent_end { return subj + "." + vb + "()" }
sent_verb            = vb:verb ws "with" (ws undefined)? sent_end                 { return vb + "()"  }
sent_end             = ws_or_not "."      { 
                          console.log("got sent_end")
                          return "." 
                       }

subject              = result:(path / variable / number)            { return result }
verb                 =  ` + DE.make_verb_rule_expers()    +       ` {
                          let result = text()
                          console.log("got verb: " + result)
                          return text() 
                     }
arguments            = var_num1:argument var_nums:(arg_sep argument)* { 
                       let args = var_num1
                       debugger
                       out("hi")
                       //get rid of trailing undefined args as would happen with DE "nothing"
                       for(let i = (var_nums.length - 1); i >= 0; i--){
                           if(var_nums[i][0] === undefined) { var_nums.pop() } 
                       }
                       if((var_nums.length == 0) && (var_num1 === undefined)) {
                         args = ""
                       }
                       for(let i = 0; i < var_nums.length; i++){
                       	  let arr = var_nums[i]
                          let prefix = ", "
                          args += prefix + arr[1]
                       }
                       let keywords = args.includes(": ") //if there is one keyword arg, they better all be. We don't check this, however
                       let result = "(" + (keywords? "{": "") + args + (keywords? "}": "") + ")" 
                       console.log("got args: " + result)
                       return result
                     }
argument             = arg_name:(variable ws "of" ws)? the_expr:expr {
                            let prefix = ""
                            if(arg_name) { prefix = arg_name[0] + ": " }
                            let result = prefix + the_expr
                            console.log("got arg: " + result)
                            return 
                       }
arg_sep  "arg_sep"   = (ws "and" ws) / (ws_or_not "," ws_or_not)  { return ", " }


                     
path     "path"      = variable ("/" variable)+           { return replace_substrings(text(), "/", ".") }
variable "variable"  = !reserved_word [a-zA-Z_]i [a-zA-Z0-9_]*  { 
                         console.log("got variable: " + text())
                         return text() 
                       }

undefined            = "nothing"  { return "undefined" }
reserved_word        = ("with" / "and" / "nothing" / "means" / "do" / "to") ![A-Za-z_]

number   "number"    = float / integer                    { return text() }
float    "float"     = integer "." integer_sans_sign      { return text() }
integer  "integer"   = ("+" / "-")? digits:[0-9]+         { return text() }
integer_sans_sign    = digits:[0-9]+  { return text() }

ws       "ws"        = [ \\t\\r\\n]+
ws_or_not            = [ \\t\\r\\n]*
comment              = "(" result:[^\\)]* ")"  { return "/*" + result.join("") + "*/" }

string1 = string_double_quote / string_single_quote
string_single_quote = "'" chars:[^']* "'" { return "'" + chars.join("") + "'" }
string_double_quote = '"' chars:[^"]* '"' { return '"' + chars.join("") + '"' }
` ,{trace: true}
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

string1               = ('"' [^"]* '"') / ("'" [^\\']* "'") {
                         debugger;
                         out("in string1 action")
                         let result = text()
                         console.log(result)
                         return result 
                     }
                     
                  
// string1               = string_double_quote
// string_double_quote "string_double_quote" = '"' chars:char* '"' { return chars.join(""); }

// char
//   = unescaped
//   / escape
//     sequence:(
//         '"'
//       / "\\"
//       / "/"
//       / "b" { return "\b"; }
//      / "f" { return "\f"; }
//       / "n" { return "\n"; }
//       / "r" { return "\r"; }
//       / "t" { return "\t"; }
//       / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
//           return String.fromCharCode(parseInt(digits, 16));
//         }
//     )
//     { return sequence; }

// escape = "\\"

// quotation_mark = '"'

// unescaped = [^\0-\x1F\x22\x5C]
// DIGIT  = [0-9]
// HEXDIG = [0-9a-f]i

"to" ws name:variable ws "with" ws args:arguments sent_end ws eb:exprs_block
                       
*/


