//Created by Fry on 3/22/16.

Js_info = class Js_info {
    static get_info_string(fn_name, series=null, full_src=null, pos=null){
            let orig_input = fn_name
            let fn
            let param_count
            let param_string = ""
            let path = null
            if (fn_name == "_the_editor_is_empty") { return "The Editor is empty. Type to insert text." }
            else if (fn_name == "_the_eof_token")  { return "You clicked beyond the last character in the Editor." }
            else if (Array.isArray(fn_name)){
                switch(fn_name[0]){
                    case "param_name":
                        return "<span style='color:blue;'>" + fn_name[1] + "</span> is a parameter of function: " + fn_name[2]
                    case "var_name":
                        return "<span style='color:blue;'>" + fn_name[1] + "</span> is a " + Js_info.make_atag("var", "var") + " (local variable) of function: " + fn_name[2]
                    case "let_name":
                        return "<span style='color:blue;'>" + fn_name[1] + "</span> is a " + Js_info.make_atag("let", "let") + " variable of function: " + fn_name[2]
                    case "fn_name":
                        return Js_info.get_info_string_aux(orig_input, full_src, pos)
                    default: //shouldn't but stick in for d ebugging
                        return "" + fn_name
                }
            }
            let is_identifier = ((typeof(fn_name) == "string") && is_string_an_identifier(fn_name))
            let bounds_of_identifier = (is_identifier ? Editor.bounds_of_identifier(full_src, pos) : null )
            let info_and_url = Js_info.fn_name_to_info_map[fn_name] //miscelaneous stuff
            fn_name = Js_info.strip_path_prefix_maybe(fn_name)
            if (!info_and_url) { info_and_url = Js_info.fn_name_to_info_map[fn_name] } //try again without prefix, for cases where orign fn_name is "fn.call", for instance
            if (!series){ series = Series.find_series(fn_name) }
            if (Array.isArray(info_and_url)){
                let [info, url] = info_and_url
                let new_fn_name = fn_name
                let [info_before_fn_name, info_after_fn_name] = info.split(fn_name)
                if (info == fn_name){
                    info_before_fn_name = ""
                    info_after_fn_name  = ""
                }
                else {
                   if (info_after_fn_name === undefined) { //means fn_name was not in info, just use whole info in tag
                        new_fn_name = info
                        info_before_fn_name = ""
                        info_after_fn_name  = ""
                    }
                }
                let the_class = new_fn_name
                if(info.startsWith("JSON.parse")) { the_class = "JSON" } //parse is used for both JSON.parse and Date.parse so we had to sepcial case here.
                let new_info = info_before_fn_name + Js_info.make_atag(the_class, new_fn_name, url) + info_after_fn_name
                if (series) { return Js_info.add_series_wrapper_to_info(series, new_info) }
                else { return new_info }
            }
            else if (fn_name == "Job"){
                let val = value_of_path(fn_name)
                //return "new " + Js_info.wrap_fn_name(fn_name) +
                //    function_params_for_keyword_call(val)
                let result = "new " + Js_info.wrap_fn_name(fn_name) + "({"
                let arg_index = 0
                for(let key in Job.job_default_params) {
                    let val = Job.job_default_params[key]
                    let src
                    if      (key == "default_workspace_pose") { src = "null" }
                    else if (key == "if_robot_status_error")  { src = "Job.prototype.if_robot_status_error" }
                    else if (key == "if_instruction_error")   { src = "Job.prototype.if_instruction_error" }
                    else { src = to_source_code({value: val, function_names: true, newObject_paths: true}) }
                    let key_html = '<a href="#" onclick="open_doc(job_param_' + key + '_doc_id)">' + key + '</a>'
                    result += key_html + ": " + src + ((key == "callback_param") ? "" : ", &nbsp;")
                    if(((arg_index % 3) == 0) && (arg_index !== 0)) {
                        result += "<br/> <span style='margin-left:83px;'> </span>"
                    }
                    arg_index += 1
                }
                result += "})"
                return result
            }
            else if (fn_name == "Dexter"){
                let val = value_of_path(fn_name)
                let result = "new " + Js_info.wrap_fn_name(fn_name) + "({"
                let arg_index = 0
                for(let key in Dexter.dexter_default_params) {
                    if(key != "instruction_callback") { //don't document this
                        let val = Dexter.dexter_default_params[key]
                        let src
                        src = ((key == "instruction_callback") ? "Job.prototype.set_up_next_do" : to_source_code({value: val, function_names: true, newObject_paths: true}))
                        let key_html = '<a href="#" onclick="open_doc(dexter_param_' + key + '_doc_id)">' + key + '</a>'
                        result += key_html + ": " + src + ", &nbsp;"
                        if(((arg_index % 3) == 0) && (arg_index !== 0)) {
                            result += "<br/> <span style='margin-left:110px;'> </span>"
                        }
                        arg_index += 1
                    }
                }
                result += "})"
                return result
            }
            else if (bounds_of_identifier && Js_info.makeins_w_info(fn_name, full_src, bounds_of_identifier[0])) {
                let the_msw_info =           Js_info.makeins_w_info(fn_name, full_src, bounds_of_identifier[0])
                return the_msw_info
            }
            //do this before series because we may have a keyword of "name:" and name is in the HTML series
            else if(bounds_of_identifier && (full_src[bounds_of_identifier[1]] == ":")) { //got keyword
                return '<span style="color: blue;">' + fn_name + ":</span> looks like a keyword for making an object or a function call."
            }
            else if(orig_input.startsWith("Messaging.")) { //because lots of erms like Messaging.eval
                //have the "eval" part in another series. So before doing the series test,
                //to this test and work around it.
                return Js_info.get_info_string_aux(orig_input, full_src, pos)
            }
            else if(series){
                let obj_to_inspect = this.object_to_inspect_maybe(fn_name, series)
                if(typeof(obj_to_inspect) == "string"){
                    if(file_exists(obj_to_inspect)) {
                        inspect(obj_to_inspect)
                        return null

                    }
                    else {
                        return Js_info.add_series_wrapper_to_info(series, obj_to_inspect)
                    }
                }
                else if(obj_to_inspect) {
                    inspect(obj_to_inspect)
                    return null
                }
                let info = Js_info.getInfo_string_given_series(fn_name, series)
                if (info) { return Js_info.add_series_wrapper_to_info(series, info) }
            }
            else if (!Number.isNaN(parseFloat(fn_name))){ //hits on both floats and ints, //must do before we split on dot
                if (fn_name.includes(".")){ //got a float
                    let the_series = Series.id_to_series("series_float_id")
                    let info       = Js_info.getInfo_string_given_series(fn_name, the_series)
                    return Js_info.add_series_wrapper_to_info(the_series, info)
                }
                else { //got an int
                    let the_series = Series.id_to_series("series_integer_id")
                    let info       = Js_info.getInfo_string_given_series(fn_name, the_series)
                    return Js_info.add_series_wrapper_to_info(the_series, info)
                }
            }
            //put after series because some series items ie Object.foo have dots in them.
            else if (fn_name.startsWith("[")) {
                if (fn_name.includes(",")){
                    return "<span style='color:blue;'>" + fn_name + "</span> is an " + Js_info.make_atag("array_literal", "array_literal")
                }
                else {
                    return "<span style='color:blue;'>[...]</span> (square brackets) are used to surround array literals and<br/> used to access array elements.<br/>Example: <code>[7, 5][1] => 5</code>"
                }
            }
           /*this is never called because its handled by literal string series else if (fn_name.startsWith('"') || fn_name.startsWith("'") || fn_name.startsWith("`")){
                return "<span style='color:blue;'>" + fn_name + "</span> is a " + Js_info.make_atag("string_literal", "string_literal")
            }*/
            else if (fn_name.startsWith('{')){
                return "<span style='color:blue;'>" + fn_name + "</span> is likely an " + Js_info.make_atag("object_literal", "object_literal")
            }
            else if (fn_name.startsWith("Job.") && fn_name.endsWith(".start")){
                let val = Job.prototype.start
                let job_name = fn_name.substring(3, fn_name.length - 5)
                return Js_info.wrap_fn_name("Job")  + job_name +
                    Js_info.wrap_fn_name("start") + function_params(val)
            }
            else if (fn_name.indexOf(".") != -1){
                path = fn_name.split(".")
                fn_name = path[path.length - 1]
            }

            if (Math[fn_name]){  //all Math fns are static. no 234.foo fns in Math.
                fn = Math[fn_name]
                param_count = fn.length
                if (param_count == 1) { param_string = "num" }
                else if (param_count == 2) { param_string = "num1, num2" }
                else if (param_count == 3) { param_string = "num1, num2, num3" }
                return "Math." + Js_info.make_atag("Math", fn_name) + "(" + param_string + ") => number"
            }

            else if (String[fn_name]){
                if (fn_name == "length") { return '"...".' + Js_info.make_atag("String", fn_name)}
                else {
                    fn = String[fn_name]
                    return "String." + Js_info.make_atag("String", fn_name) + "(" + Js_info.get_param_string(fn) + ")"
                }
            }
            else if (String.prototype[fn_name]){
                if (fn_name == "length") { return '"...".' + Js_info.make_atag("String", fn_name) }
                else {
                    fn = String.prototype[fn_name]
                    return '"...".' + Js_info.make_atag("String", fn_name) + "(" + Js_info.get_param_string(fn) + ")"
                }
            }
            else if (Array[fn_name]){
                if (fn_name == "length") { return '[...].' + Js_info.make_atag("Array", fn_name) }
                else {
                    fn = Array[fn_name]
                    return "Array." + Js_info.make_atag("Array", fn_name) + "(" + Js_info.get_param_string(fn) + ")"
                }
            }
            else if (Array.prototype[fn_name]){
                if (fn_name == "length") { return '[...].' +  Js_info.make_atag("Array", fn_name)}
                fn = Array.prototype[fn_name]
                return '["..."].' + Js_info.make_atag("Array", fn_name) + "(" + Js_info.get_param_string(fn) + ")"
            }
            else if (Date[fn_name]){
                fn = Date[fn_name]
                return "Date." + Js_info.make_atag("Date", fn_name) + "(" + Js_info.get_param_string(fn) + ")"
            }
            else if (Date.prototype[fn_name]){
                fn = Array.Date[fn_name]
                return '["..."].' + Js_info.make_atag("Date", fn_name) + "(" + Js_info.get_param_string(fn) + ")"
            }
            /*else if (["isFinite", "isInteger", "isNaN", "parseInt", "parseFloat"].indexOf(fn_name) != -1){
                fn = Number[fn_name]
                return "Number." + fn_name + "(" + Js_info.get_param_string(fn) + ")"
            }*/
            else if (JSON[fn_name]) { //["parse", "stringify"].indexOf(fn_name) != -1)
                return "JSON." + Js_info.make_atag("JSON", fn_name) + "(" + Js_info.get_param_string(fn) + ")"
            }
            else if (is_whitespace(fn_name)){
                return "<span style='color:blue;'>whitespace</span> (contiguous spaces, tabs, newlines) separates code fragments."
            }

            else if (fn_name == "start"){
                let val = Job.prototype.start
                return "new " + Js_info.wrap_fn_name(fn_name)  + //"</span>" +
                    function_params(val)
            }
            else if (window[fn_name]){
                fn = window[fn_name]
                if (fn && fn.toString().includes("[native code]")){ //catches at least a high percent of built0in js fns
                    let url = "https://developer.mozilla.org/en-US/docs/Web/API/Window/" + fn_name
                    return Js_info.make_atag("window", fn_name, url) + "(" + Js_info.get_param_string(fn) + ")"
                }
                else { return Js_info.get_info_string_aux(orig_input, full_src, pos) }
            }
            else if (Editor.in_a_comment(Editor.get_javascript(), Editor.selection_start())){
                return 'You clicked in a <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Basics">comment</a>.'
            }
            else { return Js_info.get_info_string_aux(orig_input, full_src, pos) }
    }

    //args that probably will return false from this: "title", "body", "activeElement"
    static document_prototype_lookup_ok(fn_name){
        try{ return Document.prototype[fn_name] } //if null or undefined, or some other data, return that!
        catch (err) { return false }
    }
    static get_info_string_aux(fn_name, full_src=null, pos=null){
            var val
            if (Array.isArray(fn_name)){
                if(fn_name[0] == "fn_name"){ //user clicked on the name of the function in a function def
                    var actual_name_of_function = fn_name[1]
                    var main_help =  "<span style='color:blue;'>" + actual_name_of_function + "</span> is the name of a function with parameters: " + fn_name[2] // fn_name[2].join(", ")
                    val = value_of_path(actual_name_of_function)
                    var suffix = ""
                    if(val == undefined){
                        suffix = "<br/><span style='color:red'>Warning:</span> <span style='color:blue;'>" + actual_name_of_function + "</span> is not defined. Define it by:<br/>" +
                                 "1. selecting the definition (alt-click on <b>function</b>)<br/>" +
                                 "2. click on <button>Eval</button>"
                    }
                    return main_help + suffix
                }
                else {shouldnt("In Js_info.get_info_string, with fn_name: " + fn_name)}
            }
            else { //last ditch effort
                val = value_of_path(fn_name)
                let doc_id_string = fn_name + "_doc_id"
                let doc_id_elt = window[doc_id_string]
                if ((val === undefined) && (doc_id_elt === undefined)){
                    let lit_string_info_maybe = Js_info.get_lit_string_info_maybe(fn_name, full_src, pos)
                    if(lit_string_info_maybe) { return lit_string_info_maybe }
                    else {
                        let is_identifier = ((typeof(fn_name) == "string") && is_string_an_identifier(fn_name))
                        let bounds_of_identifier = (is_identifier ? Editor.bounds_of_identifier(full_src, pos) : null )
                        if(bounds_of_identifier && (full_src[bounds_of_identifier[1]] == "(")) {
                            return "<span style='color:blue;'>" + fn_name + "</span> looks like the name of a function in a call, but it is undefined."
                        }
                        else { return "Sorry, DDE doesn't know what " + '<span style="color:blue">' + fn_name + "</span> is." }
                    }
                }
                else if (typeof(val) == "function"){
                    if (is_class(val)){
                            if(doc_id_elt) {
                                   return `new <a href='#' onclick="open_doc('` + doc_id_string + `')">` + Js_info.wrap_fn_name(fn_name)  + "</a>" + function_params(val)
                            }
                            else { return "new <span style='color:blue;'>" + Js_info.wrap_fn_name(fn_name)  + "</span>" + function_params(val) }
                    }
                    else {
                        return `<a href='#' onclick="open_doc_show_fn_def('` + doc_id_string + "', '" + fn_name + `')">` + fn_name + "</a>" + function_params(val)

                        if(doc_id_elt) {
                               return `function <a href='#' onclick="open_doc('` + doc_id_string + `')">` + fn_name + "</a>" + function_params(val)
                        }
                        else { return "function <span style='color:blue;'>" + fn_name  + "</span>" + function_params(val) }

                    }
                }
                else{
                    if(doc_id_elt) {
                           return `<a href='#' onclick="open_doc('` + doc_id_string + `')">` + fn_name + "</a> = " + stringify_value(val)
                    }
                    else { return "<span style='color:blue;'>" + fn_name + "</span> = " + stringify_value(val) }
                }
            }
    }

    //last ditch effort. Does not attempt to find backquote lit strings since those can
    //span multi_lines, so are harder to be definitinve about finding,
    // AND they are not so common.
    /*static get_lit_string_info_maybe(fn_name, full_src, pos){
        let prev_newline      = full_src.lastIndexOf("\n", pos)
        let next_newline      = full_src.indexOf("\n", pos)
        let prev_double_quote = full_src.lastIndexOf('"', pos)
        let prev_single_quote = full_src.lastIndexOf("'", pos)
        let next_double_quote = full_src.indexOf('"', pos)
        let next_single_quote = full_src.indexOf("'", pos)
        let double_quote_possible = true
        let single_quote_possible = true
        if((prev_double_quote == -1) ||
           (next_double_quote == -1) ||
           ((prev_newline != -1) && (prev_double_quote < prev_newline)) ||
           ((next_newline != -1) && (next_double_quote > next_newline))) {
            double_quote_possible = false
        }
        if((prev_single_quote == -1) ||
            (next_single_quote == -1) ||
            ((prev_newline != -1) && (prev_single_quote < prev_newline)) ||
            ((next_newline != -1) && (next_single_quote > next_newline))) {
            single_quote_possible = false
        }
        if(double_quote_possible && single_quote_possible) {
            if((prev_double_quote < prev_single_quote) &&
                (next_double_quote > next_single_quote)) { //look like "  '   '  " with curosr in the middle, ie nested single quote
                single_quote_possible = false //choose the OUTER string
            }
            else if ((prev_single_quote < prev_double_quote) &&
                    (next_single_quote > next_double_quote)) { //look like '  "   "  ' with curosr in the middle, ie nested single quote
                double_quote_possible = false //choose the OUTER string
            }
            else if (prev_double_quote > prev_single_quote) {
                   single_quote_possible = false //choose the closer string
            }
            else { double_quote_possible = false } //choose the closer string
        }
        //either we have just double_quote_possible, just single_quote_possible or neigther
        if(double_quote_possible) {
            let lit_str = full_src.substring(prev_double_quote, next_double_quote + 1)
            return this.getInfo_string_given_series(lit_str, series_literal_string_id)
        }
        else if(single_quote_possible) {
            let lit_str = full_src.substring(prev_single_quote, next_single_quote + 1)
            return this.getInfo_string_given_series(lit_str, series_literal_string_id)
        }
        else { return null } //can't find lit string.
    }*/

    //return null or a html string of help
    static get_lit_string_info_maybe(fn_name, full_src, pos){
        let prev_newline      = full_src.lastIndexOf("\n", pos)
        let next_newline      = full_src.indexOf("\n", pos)
        full_src = full_src.substring(prev_newline + 1, next_newline)
        pos -= (prev_newline + 1)
        let start_search = 0
        for(let i = 0; i < 20; i++){
            let begin_double_quote = full_src.indexOf('"', start_search)
            let end_double_quote   = ((begin_double_quote == -1) ? -1 :  full_src.indexOf('"', begin_double_quote + 1))
            let begin_single_quote = full_src.indexOf("'", start_search)
            let end_single_quote   = ((begin_single_quote == -1) ? -1 :  full_src.indexOf("'", begin_single_quote + 1))

            if((begin_double_quote == -1) || (end_double_quote == -1)) { //double not possible, try single
                if((begin_single_quote == -1) || (end_single_quote == -1)) { return null }
                else if((begin_single_quote <= pos) && (end_single_quote >= pos)) {
                    let lit_str = full_src.substring(begin_single_quote, end_single_quote + 1)
                    return this.getInfo_string_given_series(lit_str, series_literal_string_id)
                }
                else { start_search = end_single_quote + 1 } //loop around again
            }
            //double is possible
            else if((begin_single_quote == -1) ||
                    (end_single_quote == -1) ||
                    (begin_double_quote < begin_single_quote)) { //double is possible
               if((begin_double_quote <= pos) && (end_double_quote >= pos)) {
                    let lit_str = full_src.substring(begin_double_quote, end_double_quote + 1)
                    return this.getInfo_string_given_series(lit_str, series_literal_string_id)
               }
               else { start_search = end_double_quote + 1 } //loop around again
            }
            else { //only single possible
                if((begin_single_quote <= pos) && (end_single_quote >= pos)) {
                        let lit_str = full_src.substring(begin_single_quote, end_single_quote + 1)
                        return this.getInfo_string_given_series(lit_str, series_literal_string_id)
                }
                else {
                    start_search = end_single_quote + 1  //loop around again
                }
            }
        }
        return null //too many loop iterations, so quit.
    }

    static strip_path_prefix_maybe(fn_name){
        let lit_str_delimiters = ['"', "'", "`"]
        let first_char = ((fn_name.length > 1) ? fn_name[0] : null)
        if(is_string_a_literal_string(fn_name)) { return fn_name }
        else if (!fn_name.includes(".")) { return fn_name }
        else if (starts_with_one_of(fn_name, ["Brain.", "Dexter.", "FPGA.", "Human.", "Job.", "Math.",
                                              "Number.", "Object.", "Series.", "Robot.", "Serial."
                                              ])) {
            return fn_name
        }
        else if(!Number.isNaN(parseFloat(fn_name))){  //could be an integer or a float. that's ok, return whole fn_name
          return fn_name
        }
        else {
            let path_elts = fn_name.split(".")
            return last(path_elts)
        }
    }

    static add_series_wrapper_to_info(the_series, info){
        return "<i>Series: " + the_series.get_name() + "</i>&nbsp;&nbsp;" + info
    }
    
    static getInfo_string_given_series(fn_name, series){
        let fn, class_name, new_fn_name, class_fn_name_array, param_string  //more than 1 series uses this local var
        switch(series.id){
            case "series_punctuation_id":
                let info
                switch(fn_name) {
                    case ",": info = " comma separates<br/>&#9679; arguments in a function call,<br/>&#9679; parameters in a function definition,<br/>&#9679; elements in an array literal and <br/>&#9679; name-value pairs in an object literal."; break;
                    case ";": info = " semicolon and newlines end function calls."; break;
                    case ":": info = " colon goes between the name and the value of an item in an object literal."; break;
                    // not a decimal point
                    case ".": info = " period goes between an object and<br/>the name of a part you're getting from it."; break;
                    case "{": info = " curley braces surround code bodies in function definitions,<br/>for & while loops, try & catch,<br/>the actions of if, else if & else,<br/>and object literals."; break;
                    case "}": info = " curley braces surround code bodies in function definitions,<br/>for & while loops, try & catch,<br/>the actions of if, else if & else,<br/>and object literals."; break;
                    case "(": info = " open paren begins function call arguments, function definition parameters,<br/><code>for</code>, <code>while</code>, <code>if</code> and <code>else if</code> conditionals and<br/>help group infix operator calls."; break;
                    case ")": info = " close paren ends function call arguments, function definition parameters,<br/><code>for</code>, <code>while</code>, <code>if</code> and <code>else if</code> conditionals and<br/>help group infix operator calls."; break;
                    case "[": info = " open square bracket begins a literal array."; break;
                    case "]": info = " close square bracket ends a literal array."; break;
                    case '"': info = " double quotes surround a one-line literal string."; break;
                    case "'": info = " single quotes surround a one-line literal string."; break;
                    case "`": info = " backticks surround a potentially multi-lined literal string."; break;
                    case "/*": info = " begins a (potentially) multi-line comment that should end with */"; break;
                    case "*/": info = " ends a (potentially) multi-line comment that should begin with /*"; break;
                    case "//": info = " begins a comment that ends with a new line."; break;
                }
                let result =  "<span style='color:blue;'>" + fn_name + "</span>" + info
                return result;
            case "series_boolean_id":
                return Js_info.make_atag("boolean", fn_name) + " is a boolean literal."
            case "series_bitwise_id":
                return Js_info.make_atag("bitwise", fn_name) + " is a bitwise operator."
            case "series_literal_string_id":
                return "<span style='color:blue;'>" + fn_name + "</span> is a literal string."
            case "series_global_js_id":
                return Js_info.make_atag("global_js", fn_name) + " is a JS global function."
            case "series_js_object_name_id":
                return Js_info.make_atag("object_name", fn_name) + " is a JS global object."
            case "series_arithmetic_id":
                return "2 " +  Js_info.make_atag("arithmetic", fn_name) + " 3 => number"
            case "series_comparison_id":
                switch(fn_name) {
                    case "<":
                        return "2 " +  Js_info.make_atag("comparison", fn_name) + " 3 => true &nbsp; (less than)"
                    case "<=":
                        return "2 " +  Js_info.make_atag("comparison", fn_name) + " 3 => true &nbsp; (less than or equal to)"
                    case "==":
                        return "2 " +  Js_info.make_atag("comparison", fn_name) + " 3 => false &nbsp; (equal to)"
                    case "===":
                        return "2 " +  Js_info.make_atag("comparison", fn_name) + " 3 => false &nbsp; (the same as)"
                    case "!=":
                        return "2 " +  Js_info.make_atag("comparison", fn_name) + " 3 => true &nbsp; (not equal to)"
                    case "!==":
                        return "2 " +  Js_info.make_atag("comparison", fn_name) + " 3 => true &nbsp; (not the same as)"
                    case ">=":
                        return "2 " +  Js_info.make_atag("comparison", fn_name) + " 3 => false &nbsp; (greater than or equal to)"
                    case ">":
                        return "2 " +  Js_info.make_atag("comparison", fn_name) + " 3 => false &nbsp; (greater than)"
                }
                break;
            case "series_float_id":
                return "<span style='color:blue;'>" + fn_name + " </span>is a " + Js_info.make_atag("float", "floating point number")
            case "series_integer_id":
                return "<span style='color:blue;'>" + fn_name + " </span>is an " + Js_info.make_atag("integer", "integer")
            case "series_number_misc_id":
                //fn = value_of_path(fn_name) //fn_name is Number.isInteger & friends
                //return "<span style='color:blue;'>" + fn_name + "</span>(" + Js_info.get_param_string(fn) + ")"
                fn = value_of_path(fn_name)
                class_fn_name_array = fn_name.split(".")
                class_name   =  class_fn_name_array[0] //destructuring to an array doesn't work here.
                new_fn_name  =  class_fn_name_array[1]//cannot re-use "fn_name" here, it destroys the code horribly
                param_string = function_params(fn)
                return Js_info.make_atag(class_name, new_fn_name) + param_string + " => number"
            case "series_math_id":
                fn = value_of_path(fn_name)
                class_fn_name_array = fn_name.split(".")
                class_name   =  class_fn_name_array[0] //destructuring to an array doesn't work here.
                new_fn_name  =  class_fn_name_array[1]//cannot re-use "fn_name" here, it destroys the code horribly
                param_string = function_params(fn)
                return Js_info.make_atag(class_name, new_fn_name) + param_string + " => number"
            case "series_trigonometry_id":
                //return "<span style='color:blue;'>" + fn_name + "</span> is a trig function."
                fn = value_of_path(fn_name)
                class_fn_name_array = fn_name.split(".")
                class_name   =  class_fn_name_array[0] //destructuring to an array doesn't work here.
                new_fn_name  =  class_fn_name_array[1]//cannot re-use "fn_name" here, it destroys the code horribly
                param_string = function_params(fn)
                return Js_info.make_atag(class_name, new_fn_name) + param_string + " => number"
            case "series_number_constant_id":
                //return "<span style='color:blue;'>" + fn_name + "</span> is a trig function."
                fn = value_of_path(fn_name)
                if (fn_name == "Infinity") {
                    class_name = ""; //needed by make_atag to do the right thing.
                    new_fn_name = fn_name
                }
                else {
                    class_fn_name_array = fn_name.split(".")
                    class_name   =  class_fn_name_array[0] //destructuring to an array doesn't work here.
                    new_fn_name  =  class_fn_name_array[1]//cannot re-use "fn_name" here, it destroys the code horribly
                }
                return Js_info.make_atag(class_name, new_fn_name) + " => " + fn

            case "series_time_id":
                return "<span style='color:blue;'>" + fn_name + "</span> represents hours and minutes."
            case "series_color_name_id":
                return "<div style='color:blue;display:inline-block;width:160px;'>" + fn_name + " </div>is the color: <input type='color' name='color_choice' value='" + Series.color_name_to_hex(fn_name)  +"'/>"
            case "series_color_rgb_id":
                return "<div style='color:blue;display:inline-block;width:160px;'>" + fn_name + " </div>is the color: <input type='color' name='color_choice' value='" + Series.color_rgb_to_hex(fn_name)  +"'/>"
            case "series_if_id":
                if (fn_name == "if"){
                    return Js_info.make_atag("if", fn_name) + "(a < b) {...}"
                }
                else if (fn_name == "else if"){
                    return Js_info.make_atag("if", fn_name) + "(a < b) {...}"
                }
                else if (fn_name == "else"){
                    return Js_info.make_atag("if", fn_name) + "{...} "
                }
            case "series_try_id":
                if (fn_name == "try"){
                    return Js_info.make_atag("try", fn_name) + "{...}"
                }
                else if (fn_name == "catch"){
                    return Js_info.make_atag("try", fn_name) + "(err) {...}"
                }
                else if (fn_name == "finally"){
                    return Js_info.make_atag("try", fn_name) + "{...} "
                }
            case "series_assignment_id":
                return 'foo ' + Js_info.make_atag("assignment", fn_name) + ' 2'
            case "series_output_id":
                let fn1 = value_of_path(fn_name)
                return "function " + Js_info.wrap_fn_name(fn_name) + function_params(fn1)
            case "series_window_id":
                let fn11 = value_of_path(fn_name)
                return "function " + Js_info.wrap_fn_name(fn_name) + function_params(fn11)
            case "series_file_id":
                let fn2       = value_of_path(fn_name)
                let prefix    = ((typeof(fn2) == "function") ? "function " : "global variable ")
                let fn_params = ((typeof(fn2) == "function") ? function_params(fn2) : " = " + fn2) //good for "operating_system" global var
                return prefix + Js_info.wrap_fn_name(fn_name) + fn_params
            case "series_object_system_id":
                let fn3 = value_of_path(fn_name) //js chrome is confused about scope of let in switch statements so have to pick different names for fn
                return "function " + Js_info.wrap_fn_name(fn_name) + function_params(fn3)
            case "series_job_name_id":
                if (fn_name.endsWith(".start")){
                    var before_start = fn_name.substring(0, fn_name.length - 5)
                    var the_a_tag = Js_info.make_atag(null, "start")
                    return "<code style='color:blue;'>" + before_start + the_a_tag + "</code>"
                }
                else { return "<code style='color:blue;'>" + fn_name + "</code> => instance of Job"}
            case "series_job_method_id":
                let fn13 = value_of_path(fn_name)
                return "function " + Js_info.wrap_fn_name(fn_name) + function_params(fn13)
            case "series_note_id":
                let fn_note = value_of_path("Note.prototype." + fn_name)
                return "new Note()." + Js_info.wrap_fn_name(fn_name, "Note." + fn_name + "_doc_id") + function_params(fn_note)
            case "series_phrase_id":
                let fn_phrase = value_of_path("Note.prototype." + fn_name)
                return "new Phrase()." + Js_info.wrap_fn_name(fn_name, "Phrase." + fn_name + "_doc_id") + function_params(fn_phrase)

            case "series_robot_instruction_id":
                let fn4 = value_of_path(fn_name)
                return "function " + Js_info.wrap_fn_name(fn_name) + function_params(fn4)
            case "series_oplet_id":
                const oplet_full_name = Dexter.instruction_type_to_function_name(fn_name)
                var full_name_tag = Js_info.wrap_fn_name(oplet_full_name)
                return "<code style='color:blue;'>" + fn_name + "</code> means Dexter instruction: " + full_name_tag
            case "series_w_oplet_address_id":
                let w_oplet_address_num = Instruction.w_address_name_to_number(fn_name)
                let w_oplet_html = "<a target='_blank' href='" + "https://github.com/HaddingtonDynamics/Dexter/wiki/oplet-write#" + w_oplet_address_num +
                "'>" + fn_name + "</a>"
                return "<code style='color:blue;'>" + w_oplet_html + "</code> is FPGA address " + w_oplet_address_num + "."
            case "series_robot_status_label_id":
                return 'Job.a_job_name.robot.robot_status[<code style="color:blue;">' + fn_name + '</code>]'
            case "series_dexter_utility_id":
                let fn40 = value_of_path(fn_name)
                return "<span style='color:blue;'>" + Js_info.wrap_fn_name(fn_name) + '</span>' + function_params(fn40)
            case "series_dexter_constant_id": //fn_name looks like 'Dexter.link0'
                let the_constant_val = Dexter[fn_name.split(".")[1]]
                let dc_units = ""
                if      (fn_name === "Dexter.LEG_LENGTH")    { dc_units = " meters"}
                else if (fn_name === "Dexter.HOME_ANGLES")   { dc_units = " degrees"}
                else if (fn_name === "Dexter.PARKED_ANGLES") { dc_units = " degrees"}
                else if (fn_name.includes("LINK"))           { dc_units = " meters" }
                else if (fn_name.includes("ANGLE"))          { dc_units = " degrees"}
                return "<code style='color:blue;'>"     + fn_name + "</code> => " + the_constant_val + dc_units
            case "series_set_parameter_name_id":
                return "<code style='color:blue;'>"     + fn_name + "</code>" //=> " + the_constant_val + dc_units
            case "series_robot_subclass_id":
                let fn5 = value_of_path(fn_name)
                return "new <code style='color:blue;'>" + Js_info.wrap_fn_name(fn_name) + '</code>' + function_params_for_keyword_call(fn5)
            case "series_robot_name_id":
                return "<code style='color:blue;'>"     + fn_name + "</code> => instance of Robot"
            case "series_serial_id":
                let fn6 = value_of_path(fn_name)
                if (typeof(fn6) == "function"){
                    return "<code style='color:blue;'>" + Js_info.wrap_fn_name(fn_name) + '</code>' + function_params(fn6)
                }
                else { //hits for serial_path_to_info_map
                    return "<code style='color:blue;'>" + fn_name + '</code>'
                }
            case "series_object_system_id":
                //if (fn_name.startsWith("Object"){}
                let fn7 = value_of_path(fn_name)
                return "<code style='color:blue;'>" + Js_info.wrap_fn_name(fn_name) + '</code>' + function_params(fn7)
            case "series_temperature_id":
                let fn8 = value_of_path(fn_name)
                return "<code style='color:blue;'>" + Js_info.wrap_fn_name(fn_name) + '</code>' + function_params(fn8)
            case "series_html_tag_id":
                let prop_names = html_db.properties_for_tag(fn_name)
                let props_str  = ""
                for(let prop_name of prop_names){
                    props_str += ((props_str == "") ? "" : ", ") +
                      "<a target='_blank' href='https://www.w3schools.com/tags/att_" + prop_name + ".asp'>" + prop_name + '</a>:""'
                }
                return '<a href="#" onclick="open_doc(make_html_doc_id)">make_html</a>' +
                       '("' +
                       '<a title="HTML tag" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/' +
                       fn_name +
                       '">' + fn_name + '</a>", {' + props_str + '}, "inner text") ' +
                       "&nbsp;<a target='_blank'  title='HTML properties good for all HTML tags.' href='https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes'>Global props</a> " +
                       "&nbsp; <a target='_blank' href='http://www.htmldog.com/references/css/properties/'>CSS props</a>"
            case "series_html_property_id":
                let tags_str = ""
                for(let tag of html_db.html_property_tag_map[fn_name]){
                    if (tag == "all"){
                        tags_str = '<a title="HTML tag" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/' +
                            '">' + tag + '</a>'
                        break;
                    }
                    else {
                        tags_str += '<a title="HTML tag" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/' +
                                     tag +
                                     '">' + tag + '</a> &nbsp;'
                    }
                }
                return "<a target='_blank' href='https://www.w3schools.com/tags/att_" + fn_name + ".asp'>" +
                        fn_name + "</a> used in HTML tags: " + tags_str
            case "series_css_property_id":
                return "<a target='_blank' href='https://developer.mozilla.org/en-US/docs/Web/CSS/" + fn_name + "'>" +
                        fn_name + "</a>"
            case "series_robot_config_id":
                open_doc("Dexter.move_to.config_doc_id")
                return false //actual click help handled later on
        }
        if (["series_hours_minutes_seconds_id", "series_time_id", "series_3_letter_month_id",
             "series_full_month_id", "series_date_id"].indexOf(series.id) != -1){
            return fn_name + " is part of a " + Js_info.make_atag("Date", "Date")
        }
        else if (series.id.endsWith("_units_id")){
            let unit_full_name = unit_abbrev_to_full_name(series.id, fn_name)
            let [unity_abbrev, unity_full_name] = series_name_to_unity_unit(series.id)
            return  "Base: <code>" + unity_abbrev +
                    "</code> for " + unit_full_name +
                    ": <code style='color:blue;'>" + fn_name +
                    "</code> = " + window[fn_name] +
                    "&nbsp; <code>" + pluralize_full_unit_name(unit_full_name) + "*" + fn_name +
                    " => " + pluralize_full_unit_name(unity_full_name) +
                    "</code>"
        }
        return false
    }

    //fn name might have dots in it like "Control.go_to"
    static wrap_fn_name(fn_name, the_doc_id, title=""){
        let result = fn_name
        if(!the_doc_id) { the_doc_id = fn_name + "_doc_id"}
        if (!window[the_doc_id]){ the_doc_id = "" } //no doc
        let onclick_val = "open_doc_show_fn_def('" + the_doc_id + "', '" + fn_name + "')"
        let the_html = make_html("a", {href: "#", onclick: onclick_val, title: title}, fn_name)
        return the_html
    }


    static get_param_string(fn){
        var params_from_src = Js_info.parse_fn_source_for_params(fn)
        if (params_from_src && Array.isArray(params_from_src) && params_from_src.length > 0){
            return params_from_src.join(", ")
        }
        else {
            var param_count = fn.length //doesn't include args with default values, sigh
            if      (param_count == 1) { return "arg" }
            else if (param_count == 2) { return "arg1, arg2" }
            else if (param_count == 3) { return "arg1, arg2, arg3" }
            else if (param_count == 4) { return "arg1, arg2, arg3, arg4" }
            else {return ""}
        }
    }

    //See:  http://stackoverflow.com/questions/1007981/how-to-get-function-parameter-names-values-dynamically-from-javascript
    //best one is probably:
    //returns an array
    static parse_fn_source_for_params(fn){
                return (fn+'').replace(/\s+/g,'')
                    .replace(/[/][*][^/*]*[*][/]/g,'') // strip simple comments
                    .split('){',1)[0].replace(/^[^(]*[(]/,'') // extract the parameters
                    //.replace(/=[^,]+/g,'') // strip any ES6 defaults
                    .split(',').filter(Boolean); // split & filter [""]
    }

    static make_atag(the_class, fn_name, url){
        //setTimeout(function(){
        //            if(window["js_doc_link_id"]) { //intermittently, this is not defined and thus errors. So if its
                        //undefined, just don't set the onclick. Not great but better than erroring
                        //and usually the user doesn't click on the click-help link anyway.
        //                js_doc_link_id.onclick=function(){Js_info.show_doc(the_class, fn_name, url)}
        //            }
        //           }, 300)
        let display_name = fn_name
        if (fn_name == "Infinity") { display_name = fn_name }
        else if (["Math", "Number"].includes(the_class)){ display_name = the_class + "." + fn_name }
        if (url && !url.endsWith("_doc_id")) {
                   return '<a href="' + url + '" target="_blank">' + display_name + '</a>'
        }
        else {
           let url_js = (url? ", '" + url + "'" : "")
           let onclick_val = "Js_info.show_doc('" + the_class + "', '" + fn_name + "'" + url_js + ")"
           return '<a id="js_doc_link_id" href="#" onclick="' + onclick_val + '">' + display_name + '</a>'
        }
    }

    static show_doc(the_class, fn_name, url){
        if (url) {}
        else if (Js_info.fn_name_to_info_map[fn_name]){
            url = Js_info.fn_name_to_info_map[fn_name][1]
        }
        else if (the_class == "arithmetic"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators"
        }
        else if (the_class == "Array"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/" + fn_name
        }
        else if (the_class == "array_literal"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Array_literals"
        }
        else if (the_class == "assignment"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Assignment_Operators"
        }
        else if (the_class == "boolean"){
            if ((fn_name === "true") || (fn_name === "false")){
                url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Boolean_literals"
            }
            else {
                url == "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators"
            }
        }
        else if (the_class == "comparison"){
            //mozillia doesn't have  a page for each operator, but has a group of similar operators per page.
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comparison_Operators"
        }
        else if (the_class == "Date"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date"
        }
        else if (the_class == "Error"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error"
        }
        else if (the_class == "float"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Floating-point_literals"
        }
        else if (the_class == "if"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else"
        }
        else if (the_class == "integer"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Integers"
        }
        else if (the_class == "JSON"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/" + fn_name
        }
        else if (the_class == "Math"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/" + fn_name
        }
        else if (the_class == "Number"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/" + fn_name
        }
        else if (the_class == "object_literal"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Object_literals"
        }
        else if (the_class == "String"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/" + fn_name
        }
        else if (the_class == "string_literal"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#String_literals"
        }
        else if (the_class == "try"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch"
        }
        else if (the_class == "global_js"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/" +
                //the_class + "/"
                fn_name
        }
        else if (the_class == "object_name"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/" +
                   fn_name
        }
        if (!url) { return false }
        else if (url.endsWith("_doc_id")) { open_doc(window[url]); return true; }
        else                              { show_page(url); return true; } //window.open(url, "js_doc")
    }
    static object_to_inspect_maybe(fn_name, series){
        if(series.id == "series_literal_string_id"){
            fn_name = fn_name.substring(1, fn_name.length - 1)
            if (Robot.is_oplet(fn_name)) {
                const oplet_full_name = Dexter.instruction_type_to_function_name(fn_name)
                const full_name_tag = Js_info.wrap_fn_name(oplet_full_name)
                return "<code style='color:blue;'>" + fn_name + "</code> means Dexter instruction: " + full_name_tag
            } //handled elsewhere
            else if(Robot[fn_name])  { return Robot[fn_name] }
            else if (Job[fn_name])   { return Job[fn_name] }
            else if(value_of_path(fn_name)) { return value_of_path(fn_name) }
            else if(file_exists(fn_name))   { return fn_name }
            else {return null}
        }
        else { return null }
    }
}

// see http://www.w3schools.com/js/js_reserved.asp. I only did those that are most useful to DDE users
// some of those reserved words are handled elsehwere by Js_info
Js_info.fn_name_to_info_map = {
    "&&":        ["Performs logical <b>and</b> &nbsp;example: true && true",  "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators"],
    "||":        ["Performs logical <b>or</b>  &nbsp;example: true || false", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators"],
    "!":         ["Performs logical <b>not</b> &nbsp;example: !false",        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators"],
    "++":        ["++ increments a variable",                                 "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Increment"],
    "--":        ["-- decrements a variable",                                 "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators#Decrement"],
    "&":         ["& bitwise and",                      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators"],
    "|":         ["& bitwise or",                       "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators"],
    "^":         ["bitwise xor",                        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators"],
    "~":         ["~ bitwise not",                      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators"],
    "<<":        ["<< bitwise left shift",              "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators"],
    ">>":        [">> bitwise right shift",             "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators"],
    ">>>":       [">>> bitwise zero fill right shift",  "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators"],
    "apply":     ["fn.apply(thisArg, argsArray)",       "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply"],
    "break":     ["while(true){break;}",                "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/break"],
    "call":      ["fn.call(thisArg, arg1, arg2, arg3)", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call"],
    "class":     ["class Boat extends Vehicle {}",      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes"],
    "console.log": ["console.log(foo)",                 "https://developer.mozilla.org/en-US/docs/Web/API/Console/log"],
    "continue":  ["while(true){continue;}",             "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/continue"],
    "cv":        ["cv",                                 "cv_doc_id"],
    "debugger":  ["debugger; sets a breakpoint.",       "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/debugger"],//LEAVE THIS IN RELEASED CODE
    "delete":    ["delete foo.bar",                     "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete"],
    "for":       ["for(let i = 0; i < 3; i++){out(i)}", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for"],
    "function":  ["function foo(a, b){ a + b}",         "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions"],
    "function*": ["function* foo(){yield 1; yield 2}",  "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*"],
    "in":        ["for(var index in ['a', 'b']){out(index)}",     "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in"],
    "Infinity":  ["Infinity",                           "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Infinity"],
    "JSON.parse": ["JSON.parse(a_string)",                        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse"],
    "instanceof":["new Date() instanceof Date => true", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof"],
    "let":       ["let foo = 2;",                       "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let"],
    "new":       ['new creates an object such as a Job or a Dexter', "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new"],
    "null":      ["null",                               "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null"],
    "return":    ["function foo(){return 7}",           "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/return"],
    "Root":      ["Root is the common ancestor<br/>of all objects made with newObject."],
    "switch":    ['switch (2 + 3) {case 5: out("five"); break;}', "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch"],
    "this":      ["function(){this}",                   "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this"],
    "throw":     ['function foo(){throw "busted"}',     "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw"],
    "typeof":    ['typeof new Date() === "object"',     "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof"],
    "undefined": ["undefined",                          "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined"],
    "var":       ['var bar = "oak"',                    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var"],
    "while":     ["while (n < 3) { n = n + 1}",         "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/while"],
    "window":    ["window",                             "https://developer.mozilla.org/en-US/docs/Web/API/Window"],
    "yield":     ["function* foo(){yield 1; yield 2}",  "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield"],
    "yield*":    ["function* g4() {yield* [1, 2, 3];}", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*"]
}

//returns false if we don't have a mekeins "w" call of the proper format,
//else returns a string to be displayed for clickhelp
//pos is the index of  "m" in make_ins, not where the mouse was clicked.
Js_info.makeins_w_info = function(fn_name, full_src=null, pos){
  if(!full_src) { return false }
  else if(!is_non_neg_integer(pos)) { return false }
  else if(fn_name !== "make_ins") { return false }
  else if (full_src.startsWith("make_ins('w',", pos) ||
           full_src.startsWith('make_ins("w",', pos)) {
      let first_comma_pos = pos + 'make_ins("w",'.length
      let second_comma_pos = full_src.indexOf(",", first_comma_pos + 1)
      if(second_comma_pos == -1) { return false }
      let close_paren_pos = full_src.indexOf(")", second_comma_pos)
      if (close_paren_pos == -1) { return false }
      let first_arg_src = full_src.substring(first_comma_pos + 1, second_comma_pos).trim()
      if(!is_string_a_integer(first_arg_src)) { return false }
      let first_arg_num = parseInt(first_arg_src)
      let first_arg_name = Instruction.w_address_number_to_name(first_arg_num)
      let suffix = full_src.substring(second_comma_pos + 1, close_paren_pos + 1).trim()
      let first_name_link =  "<a target='_blank' href='" + "https://github.com/HaddingtonDynamics/Dexter/wiki/oplet-write#" + first_arg_num +
                             "'>" + first_arg_name + "</a>"
      let fn_name_html = Js_info.wrap_fn_name(fn_name, undefined, "Make a low-level Dexter instruction.")
      let w_html = "<a title='write value to FPGA address.' target='_blank' href='" + "https://github.com/HaddingtonDynamics/Dexter/wiki/oplet-write" +
          "'>" + '"w"' + "</a>"
      return fn_name_html + '(' + w_html + ', address=' + first_name_link + ", value=" + suffix
  }
  else { return false }
}

var {function_name, function_params, function_params_for_keyword_call,
     is_class, is_non_neg_integer, is_string_a_literal_string, is_whitespace,
     last, starts_with_one_of, stringify_value, value_of_path} = require("./core/utils.js")

var {pluralize_full_unit_name, series_name_to_unity_unit, unit_abbrev_to_full_name} = require("./core/units.js")

var {file_exists} = require("./core/storage.js")