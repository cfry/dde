/* https://pegjs.org/documentation
npm install pegjs --save
DE.make_verb_rule_expers()
*/
var DE = class DE {
  static de_to_js(de_src) {
     if(de_src.trim() == "") { return de_src } //convert whitespace to whitespace even if it isn't proper DE or JS for eval.
     let tracer_instance = new DE.PegTracer(de_src,{
                                              parent:null,
                                              hiddenPaths:[],
                                              useColor:false,
                                              showTrace:true,
                                              maxSourceLines:6,
                                              maxPathLength:72,
		})
      //try{
        return DE.parser.parse(de_src, {tracer: tracer_instance})
      //}
      //catch(e) { var foo = e.message
      //           var bar = 2 + 3
      //}
  }

  static eval(de_src){
      let src = this.de_to_js(de_src)
      return window.eval(src)
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
	static compute_loop_total(loop_times_result, loop_keys){
	  if      (loop_times_result == false)              { return 0 }
	  else if (loop_times_result == true)               { return Infinity }
      else if (typeof(loop_times_result) == "number")   { return loop_times_result } //todo eror check for non-neg int
	  else if (Array.isArray(loop_times_result))        { return loop_times_result.length }
      else if (typeof(loop_times_result) == "function") { return Infinity }
      else if (typeof(loop_times_result) == "object")   { return loop_keys.length }
      else { dde_err("loop passed invalid times_to_loop of " + loop_times_result) }
    }

    static compute_loop_value(loop_times_result, loop_keys, loop_key){
        if      (loop_times_result == false)              { return undefined }
        else if (loop_times_result == true)               { return undefined }
        else if (typeof(loop_times_result) == "number")   { return loop_key }
        else if (Array.isArray(loop_times_result))        { return loop_times_result[loop_key] }
        else if (typeof(loop_times_result) == "function") { return undefined }
        else if (typeof(loop_times_result) == "object")   { return loop_times_result[loop_key] }
        else { dde_err("loop passed invalid times_to_loop of " + loop_times_result) }
    }

	static make_loop_js(times_to_loop_src, eb){
	  let js_src = " (function(){\n"
	    js_src += "let loop_result  = []\n" //close over, user code may set this
        js_src += 'let loop_keys    = ((typeof(times_to_loop) == "object")? Object.keys(loop_times_result) : null)\n'
        js_src += 'let loop_times_result = ' + times_to_loop_src + '\n'
        js_src += 'let loop_total   = DE.compute_loop_total(loop_times_result, loop_keys)\n'
	    js_src += 'let loop_body_fn = function(loop_index, loop_value, loop_total, loop_key,)\n' + eb +'\n'

        js_src += `for(let loop_index = 0; loop_index < loop_total; loop_index++){
          if (loop_index >= loop_total) { break; }
          if ((typeof(loop_times_result) == "function") && (loop_times_result() === false)) { break; }
          let loop_key      = ((typeof(loop_times_result) == "object") ? loop_keys[loop_index] : loop_index)
          let loop_value    = DE.compute_loop_value(loop_times_result, loop_keys, loop_key)
          let loop_on_first = loop_index == 0
          let loop_on_last  = loop_index == loop_total - 1
          let iter_result   = loop_body_fn.call(null, loop_index, loop_value, loop_total, loop_key, loop_on_first, loop_on_last)
          if(Array.isArray(iter_result)){
              if      (iter_result[0] == "break")   {
                   if(iter_result.length == 1) {break;}
                   else                        { loop_result = iter_result[1] //you can set closed over var for outside use
                                                 break;
                   }
              }
              else if (iter_result[0] == "return")  {
                    if(iter_result.length == 1) { return; }
                    else                        { return  iter_result[1] }
              }
              else if (iter_result[0] == "collect")        { loop_result.push(iter_result[1]) }
              else if (iter_result[0] == "collect_break")  { loop_result.push(iter_result[1]); break; }
              else if (iter_result[0] == "collect_return") { loop_result.push(iter_result[1]); return loop_result; }
          }
       }\n`
        js_src += 'return loop_result})()'
        return js_src
    }
    static a_few_examples(){
      return "<h3>Definitive English Examples</h3>Math/PI<br/>foo means 2.<br/>foo<br/>make Array with 4 and 5.<br/>45 plus with 46.<br/>4 more than with 67.<br/>to double with num. do num plus with num.!<br/>double with 3.<br/>"
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
DE.peg       = require("pegjs")
DE.PegTracer = require('pegjs-backtrace');

DE.parser = DE.peg.generate(
`start               = result:exprs { return result }
exprs                = ws_or_not first_exper:expr rest_expers:(ws expr)* ws_or_not{
                         let result = first_exper
                         for(let ex of rest_expers) {
                            result += "\\n" + ex[1]
                         }
                         return result
                       }
expr                 = result:(fn_def / loop / assignment / maker / keyword_expr_exprs_block / catch1 / keyword_exprs_block / sentence / string1 / path / variable / undefined / number) {
                       return result
                       }
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
                        
fn_def               = "to" ws name_and_args:sentence ws_or_not eb:exprs_block{
                            name_and_args = replace_substrings(name_and_args, ": ", "=")
                            let result = "function " + name_and_args + eb 
                            console.log("got fn_def: " + result)
                            return result
                        }
loop                 = "loop" ws times_to_loop_src:expr ws eb:exprs_block{
                          return DE.make_loop_js(times_to_loop_src, eb)
                       }
empty_exprs_block    = "do!" { return "{}" }
full_exprs_block     = "do" ws first_expr:expr? rest_exprs:(ws expr)* ws_or_not "!"{ //js code returns value of last expr
                         console.log("got exprs_block")
                         let result
                         if(first_expr) {
                           if(rest_exprs.length == 0) {
                              result = "return " + first_expr
                           }
                           else { result = first_expr }
                         }
                         else {
                             result = ""
                         }      
                         for(let i = 0; i < rest_exprs.length; i++) {
                             let ex = rest_exprs[i]
                             if(i == (rest_exprs.length - 1)) {
                                 result += "\\n" + "return " + ex[1]
                             }
                             else {
                                 result += "\\n" + ex[1]
                             }
                         }
                         return "{" + result + "}"
                       }
exprs_block          = eb:(full_exprs_block / empty_exprs_block) { return eb }


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
argument             = arg_name:(variable ws arg_and_val_sep ws)? the_expr:expr {
                            let prefix = ""
                            if(arg_name) { 
                                    prefix = arg_name[0] + ((arg_name[2] == "default")? "=" : ": ")
                            }
                            let result = prefix + the_expr
                            console.log("got arg: " + result)
                            return result
                       }
arg_sep  "arg_sep"   = (ws "and" ws) / (ws_or_not "," ws_or_not)  { 
                        console.log("got arg_sep: " + text())
                        return ", " }

arg_and_val_sep      = "default" / "of" {
                          if (text() == "default") { return "=" }
                          else                     { return ": " }
                        }
                        
keyword_expr_exprs_block = keyword:("if" / "but if") ws ex1:expr ws eb:exprs_block {
                         let js_key = {"if": "if", "but if": "else if"}[keyword]
                         let need_parens = ex1[0] != "("
                         let result = js_key + (need_parens ? "(" : "") + ex1 + (need_parens ? ")" : "") + eb
                         return result
                       }
                       
catch1                = "if error" ws var1:variable ws eb:exprs_block {
                         let result = "catch(" + var1 + ")" + eb
                         return result

                       }
                        
keyword_exprs_block  = keyword:("try" / "finally" / "otherwise") ws eb:exprs_block {
                         let js_key = {try: "try", otherwise: "else", finally: "finally"}[keyword]
                         let result = js_key + eb
                         return result
                       }
                       
                   
                     
path     "path"      = variable ("/" variable)+           { return replace_substrings(text(), "/", ".") }
variable "variable"  = !reserved_word [a-zA-Z_]i [a-zA-Z0-9_]*  { 
                         console.log("got variable: " + text())
                         return text() 
                       }

undefined            = "nothing"  { return "undefined" }
reserved_word        = ("with" / "and" / "nothing" / "means" / "do" / "to" / "try" / "finally" / "if error" / "but if" / "if" / "otherwise") ![A-Za-z_]

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


