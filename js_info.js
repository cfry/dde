/**
 * Created by Fry on 3/22/16.
 */
Js_info = class Js_info {
    static get_info_string(fn_name, series=null){
            var orig_input = fn_name
            var fn
            var param_count
            var param_string = ""
            var path = null
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
                        return Js_info.get_info_string_aux(orig_input)
                    default: //shouldn't but stick in for debugging
                        return "" + fn_name
                }
            }
            //else if (is_string_a_color_rgb(fn_name)){
            //    let the_series = Series.id_to_series("series_color_rgb_id")
            //    let info       = Js_info.getInfo_string_given_series(path, fn_name, the_series)
            //    return Js_info.add_series_wrapper_to_info(the_series, info)
            //}
            var info_and_url = Js_info.fn_name_to_info_map[fn_name] //miscelaneous stuff
            fn_name = Js_info.strip_path_prefix_maybe(fn_name)
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
                let new_info = info_before_fn_name + Js_info.make_atag(new_fn_name, new_fn_name) + info_after_fn_name
                if (series) { return Js_info.add_series_wrapper_to_info(series, new_info) }
                else { return new_info }
            }
            if(series){
                var info = Js_info.getInfo_string_given_series(path, fn_name, series)
                if (info) { return Js_info.add_series_wrapper_to_info(series, info) }
            }
            else if (!Number.isNaN(parseFloat(fn_name))){ //hits on both floats and ints, //must do before we split on dot
                if (fn_name.includes(".")){ //got a float
                    let the_series = Series.id_to_series("series_float_id")
                    let info       = Js_info.getInfo_string_given_series(path, fn_name, the_series)
                    return Js_info.add_series_wrapper_to_info(the_series, info)
                }
                else { //got an int
                    let the_series = Series.id_to_series("series_integer_id")
                    let info       = Js_info.getInfo_string_given_series(path, fn_name, the_series)
                    return Js_info.add_series_wrapper_to_info(the_series, info)
                }
            }
            //put after series because some series items ie Object.foo have dots in them.
            if (fn_name.startsWith("[")) {
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
                    fn = String[fn_name]
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
            else if (["parse", "stringify"].indexOf(fn_name) != -1){
                return "JSON." + Js_info.make_atag("Number", fn_name) + "(" + Js_info.get_param_string(fn) + ")"
            }
            //else if (Js_info.document_prototype_lookup_ok(fn_name)){
            //    fn = Document.prototype[fn_name]
            //    return 'a_Document.' + Js_info.make_atag("Document", fn_name) + "(" + Js_info.get_param_string(fn) + ")"
            //}
            else if (Editor.in_a_comment(Editor.get_javascript(), Editor.selection_start())){
                return 'You clicked in a <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#Basics">comment</a>.'
            }
            else if (is_whitespace(fn_name)){
                return "<span style='color:blue;'>whitespace</span> (contiguous spaces, tabs, newlines) separates code fragments."
            }
            else if (fn_name == "Job"){
                let val = value_of_path(fn_name)
                return "new " + Js_info.wrap_fn_name(fn_name)  + //"</span>" +
                       function_params(val)
            }
            else if (fn_name == "start"){
                let val = Job.prototype.start
                return "new " + Js_info.wrap_fn_name(fn_name)  + //"</span>" +
                    function_params(val)
            }
            else { return Js_info.get_info_string_aux(orig_input) }
    }

    //args that probably will return false from this: "title", "body", "activeElement"
    static document_prototype_lookup_ok(fn_name){
        try{ return Document.prototype[fn_name] } //if null or undefined, or some other data, return that!
        catch (err) { return false }
    }
    static get_info_string_aux(fn_name){
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
            else {
                val = value_of_path(fn_name)
                if (val === undefined){
                    return "Sorry, DDE doesn't know what " + '<span style="color:blue">' + fn_name + "</span> is."
                }
                else if (typeof(val) == "function"){
                    if (is_class(val)){
                        return "new <span style='color:blue;'>" + Js_info.wrap_fn_name(fn_name)  + "</span>" + function_params(val)
                    }
                    else {
                        return "function <span style='color:blue;'>" + fn_name  + "</span>" + function_params(val)
                    }
                }
                else{
                   return "<span style='color:blue;'>" + fn_name + "</span> = " + stringify_value(val)
                }
            }
    }

    static strip_path_prefix_maybe(fn_name){
        if (!fn_name.includes(".")) { return fn_name }
        else if (starts_with_one_of(fn_name, ["Dexter.", "Job.", "Math.", "Number.", "Object.", "Series.",
                                              "Brain.", "Human.", "Robot.", "Serial."
                                              ])) {
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
    
    static getInfo_string_given_series(path, fn_name, series){
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
            case "series_literal_string_id":
                return "<span style='color:blue;'>" + fn_name + "</span> is a literal string."
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
            case "series_robot_instruction_id":
                if (fn_name == '"debugger"') {
                    return '<span style="color:blue;">&quot;</span>' +
                           Js_info.wrap_fn_name("debugger")  +
                           '<span style="color:blue;">&quot;</span>'
                }
                let fn4 = value_of_path(fn_name)
                return "function " + Js_info.wrap_fn_name(fn_name) + function_params(fn4)
            case "series_robot_status_label_id":
                return 'Job.a_job_name.robot.robot_status[<code style="color:blue;">' + fn_name + '</code>]'
            case "series_dexter_utility_id":
                let fn40 = value_of_path(fn_name)
                return "<span style='color:blue;'>" + Js_info.wrap_fn_name(fn_name) + '</span>' + function_params(fn40)
            case "series_dexter_constant_id": //fn_name looks like 'Dexter.link0'
                let the_constant_val = Dexter[fn_name.split(".")[1]]
                let dc_units = ""
                if      (fn_name === "Dexter.LEG_LENGTH")    { dc_units = " microns ("     + (the_constant_val / 1000) + " millimeters)"}
                else if (fn_name === "Dexter.HOME_ANGLES")   { dc_units = " arc_seconds"}  //because we've got > 1, don't include degrees
                else if (fn_name === "Dexter.PARKED_ANGLES") { dc_units = " arc_seconds"}  //because we've got > 1, don't include degrees
                else if (fn_name.includes("LINK"))           { dc_units = " microns ("     + (the_constant_val / 1000) + " millimeters)"} // &mu;m"  don't use greek!
                else if (fn_name.includes("ANGLE"))          { dc_units = " arc_seconds (" + (the_constant_val / 3600) + " degrees)"}
                return "<code style='color:blue;'>"     + fn_name + "</code> => " + the_constant_val + dc_units
            case "series_robot_subclass_id":
                let fn5 = value_of_path(fn_name)
                return "new <code style='color:blue;'>" + Js_info.wrap_fn_name(fn_name) + '</code>' + function_params(fn5)
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
        }
        if (["series_hours_minutes_seconds_id", "series_time_id", "series_3_letter_month_id",
             "series_full_month_id", "series_date_id"].indexOf(series.id) != -1){
            return fn_name + " is part of a " + Js_info.make_atag("Date", "Date")
        }
        else if (series.id.endsWith("_units_id")){
            let unit_full_name = unit_abbrev_to_full_name(series.id, fn_name)
            let [unity_abbrev, unity_full_name] = series_name_to_unity_unit(series.id)
            return "for " + unit_full_name +
                    ": <code style='color:blue;'>" + fn_name +
                    "</code> = " + window[fn_name] +
                    "&nbsp; <code>" + pluralize_full_unit_name(unit_full_name) + "*" + fn_name +
                    " => " + pluralize_full_unit_name(unity_full_name) +
                    "</code>"
        }
        return false
    }

    static wrap_fn_name(fn_name){
        let result = fn_name
        let the_doc_id = fn_name + "_doc_id"
        if (window[the_doc_id]){ //otherwise we have to load the doc into teh snadbox instead of just the UI.
            let onclick_val = "open_doc(" + the_doc_id + ")"
            let click_id = fn_name + "_click_help_id"
            let the_html = "<a id='" + click_id + "' href='#'>" + fn_name + "</a>"
            result = the_html
            setTimeout(function(){
                         window[click_id].onclick=function(){open_doc(window[the_doc_id])}
                         },
                       100)
        }
        else { result = "<span style='color:blue;'>" + fn_name + "</span>" }
       return result
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

    static make_atag(the_class, fn_name){
        setTimeout(function(){
                    if(window["js_doc_link_id"]) { //intermittently, this is not defined and thus errors. So if its
                        //undefined, just don't set the onclick. Not great but better than erroring
                        //and usually the user doesn't click on the click-help link anyway.
                        js_doc_link_id.onclick=function(){Js_info.show_doc(the_class, fn_name)}
                    }
                   }, 300)
        let display_name = fn_name
        if (fn_name == "Infinity") { display_name = fn_name }
        else if (["Math", "Number"].includes(the_class)){ display_name = the_class + "." + fn_name }
        return '<a id="js_doc_link_id" href="#">' + display_name + '</a>'
    }

    static show_doc(the_class, fn_name){
        var url
        if (Js_info.fn_name_to_info_map[fn_name]){
            url = Js_info.fn_name_to_info_map[fn_name][1]
        }
        else if (the_class == "arithmetic"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators"
        }
        else if (the_class == "array_literal"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Array_literals"
        }
        else if (the_class == "assignment"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Assignment_Operators"
        }
        else if (the_class == "boolean"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Boolean_literals"
        }
        else if (the_class == "comparison"){
            //mozillia doesn't have  a page for each operator, but has a group of similar operators per page.
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Comparison_Operators"
        }
        else if (the_class == "Date"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date"
        }
        else if (the_class == "float"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Floating-point_literals"
        }
        else if (the_class == "integer"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Integers"
        }
        else if (the_class == "Math"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/" + fn_name
        }
        else if (the_class == "if"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else"
        }
        else if (the_class == "object_literal"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#Object_literals"
        }
        else if (the_class == "string_literal"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_Types#String_literals"
        }
        else if (the_class == "try"){
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch"
        }
        else {
            url = "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/" +
                the_class + "/" + fn_name
        }
       window.open(url, "js_doc")
    }
}

// see http://www.w3schools.com/js/js_reserved.asp. I only did those that are most useful to DDE users
// some of those reserved words are handled elsehwere by Js_info
Js_info.fn_name_to_info_map = {
    "&&":        ["Performs logical <b>and</b> &nbsp;example: true && true",  "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators"],
    "||":        ["Performs logical <b>or</b>  &nbsp;example: true || false", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators"],
    "!":         ["Performs logical <b>not</b> &nbsp;example: !false",        "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_Operators"],
    "break":     ["while(true){break;}",                "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/break"],
    "class":     ["class Boat extends Vehicle {}",      "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes"],
    "debugger":  ["debugger; sets a breakpoint.",       "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/debugger"],
    "delete":    ["delete foo.bar",                     "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/delete"],
    "for":       ["for(var i = 0; i < 3; i++){out(i)}", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for"],
    "function":  ["function foo(a, b){ a + b}",         "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions"],
    "function*": ["function* foo(){yield 1; yield 2}",  "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*"],
    "in":        ["for(var index in ['a', 'b']){out(index)}",     "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in"],
    "Infinity":  ["Infinity",                           "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Infinity"],
    "instanceof":["new Date() instanceof Date => true", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof"],
    "let":       ["let foo = 2;",                       "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let"],
    "new":       ['new Date("Apr 1 2016")',             "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new"],
    "null":      ["null",                               "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null"],
    "return":    ["function foo(){return 7}",           "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/return"],
    "Root": ["Root is the common ancestor<br/>of all objects made with newObject."],
    "switch":    ['switch (2 + 3) {case 5: out("five"); break;}', "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch"],
    "this":      ["function(){this}",                   "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this"],
    "throw":     ['function foo(){throw "busted"}',     "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/throw"],
    "typeof":    ['typeof new Date() === "object"',     "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/typeof"],
    "undefined": ["undefined",                          "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined"],
    "while":     ["while (n < 3) { n = n + 1}",         "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/while"],
    "var":       ['var bar = "oak"',                    "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var"],
    "yield":     ["function* foo(){yield 1; yield 2}",  "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield"],
    "yield*":    ["function* g4() {yield* [1, 2, 3];}", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*"]
}
