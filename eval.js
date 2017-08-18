 var char_position = function(src, line_number, col_number){
// line_number is 1 based. as are chrome error messages
// col_number is 1 based.  as are chrome error messages
// result is 0 based.
// beware codemirror has line and char positions being 0 based, and its index 0 based as well
// assume src linefeeds are just 1 char ie \n
// and make that newline char be the last char on the line, not the first char of the next line.
    var cur_line = 1
    var cur_col  = 0
    var prev_char = null
    for (var i = 0; i < src.length; i++){
        var char = src.charAt(i)
        if (prev_char == '\n'){
            cur_line = cur_line + 1
            cur_col = 1
        }
        else {
            cur_col += 1
        }
        if ((cur_line == line_number) && (cur_col == col_number)){
            return i;
        }
        prev_char = char
    }
    return false
}




//var in_ui = function(){ return true }

/*function post_to_sandbox(message_obj){
    sandbox_iframe_id.contentWindow.postMessage(message_obj, '*');
}*/

/*function post_to_ui(message_obj){
    window.parent.postMessage(message_obj, "*")
}*/

var prefix_to_evaled_src = "try{" //referenced in eval code AND in error handler way below

function fix_code_to_be_evaled(src){
    let slash_slash_pos = src.lastIndexOf("//")
    let newline_pos     = src.lastIndexOf("\n")
    if (slash_slash_pos > newline_pos) { //src is ending with a slash-slash comment but no newline on end.
       return src + "\n" //without this I get an error
    }
    else { return src }
}

//part 1 of 3.
function eval_js_part1(){
    var src = Editor.get_javascript("auto") //if no selection get whole buffer, else get just the selection
    //we do NOT want to pass to eval part 2 a trimmed string as getting its char
    //offsets into the editor buffer correct is important.
    if (src.trim() == ""){
        open_doc(learning_js_doc_id)
        warning("There is no JavaScript to execute.<br/>See <span style='color:black;'>Learning JavaScript</span> " +
            "in the Documentation pane for help.")
    }
    else{
        eval_js_part2(src)
    }
}

//part 2 of 3 is in eval.js,  window.addEventListener('message'  under the message name of "eval"
function eval_js_part2 (command){
    //var command = event.data.command; //might be whole editor buffer or just the selection.
    //command = trim_string_for_eval(command) //cuts trailing whitespace and // comments only. but buggy
    command = fix_code_to_be_evaled(command)
    var suffix_to_evaled_src = ""
    if (command.startsWith("{")) { prefix_to_evaled_src = "try{("; suffix_to_evaled_src = ")" } //parens fixes broken js eval of src like "{a:2, b:3}"
    else { prefix_to_evaled_src = "try{" //no parens, normal case
        suffix_to_evaled_src = ""
    }
    //full_dexter_url = event.data.full_dexter_url
    var result = {command: command}

    try {//note doing try_command = "var val927; try{val927 = " + command ...fails because  evaling
        //"var f1 = function f2(){...}" will bind f1 to the fn but NOT f2!!! what a piece of shit js is.
        //AND wrapping parens around src of  "{a:2, b:3}" works but wrapping parens around a "function f1()..." doesn't get f1 bound to the fn.
        var try_command = prefix_to_evaled_src + command + suffix_to_evaled_src + "} catch(err){error_message_start_and_end_pos(err)}"
        //if try succeeds, it returns its last val, else catch hits and it returns its last val
        //if I dont' do this trick with val927, I get an error when evaling "{a:2, b:3}
        //I can't figure out whether try is supposed to return the val of its last exp or not from the js spec.
        let start_time = Date.now()
        var value = window.eval(try_command) //window.eval evals in "global scope" meaning that, unlike plain eval,
        result.value = value //used by Job's menu item "Start job"
        //if I click on EVAL button with window.eval for defining a fn,
        //then a  2nd click on EVAL for calling it, it will work.
        //also works with var foo = 2, and foo in separate eval clicks.
        //also I think this global eval will not see var bindings for the
        //lex vars in this eventListener, ie name, result, etc. which is good.
        result.duration = Date.now() - start_time
        if (value === null){ //calling null.error_type will error so do this first.
            result.value_string = stringify_value(value)
        }
        else if ((typeof(value) == "object") && value.error_type){
            result = value
            //result.command = command
            result.starting_index = char_position(command, result.line_no, result.char_no)
            var command_starting_with_starting_index = command.substring(result.starting_index)
            result.ending_index = command_starting_with_starting_index.match(/\W|$/).index + result.starting_index

        }
        else{
            result.value_string = stringify_value(value)
            //result.command = command
        }
    }
    catch(err) { //probably  a syntax error. Can't get starting_index so won't be able to highlight offending code
        result.error_type         = err.name
        result.full_error_message = err.stack
        result.error_message      = err.message
    }
    /*event.source.postMessage({ //send result to the UI side
     name:            "eval_result",
     result:          result,
     },
     event.origin)*/
    eval_js_part3(result)
    return result
}

// in UI.
function eval_js_part3(result){
    var string_to_print
    var start_of_selection = 0
    if (Editor.is_selection()){
        start_of_selection = Editor.selection_start()
    }
    if (result.error_type){
        string_to_print = result.error_type + ": " + result.error_message
        if (result.starting_index != undefined) { //beware, starting_index might == 0 which is false to IF
            var cm_pos = myCodeMirror.doc.posFromIndex(start_of_selection + result.starting_index)
            string_to_print += "<br/>&nbsp;&nbsp;&nbsp;At line: " + (cm_pos.line + 1) + ", char: " + (cm_pos.ch + 1)
        }
        var stack_trace = result.full_error_message
        var first_newline = stack_trace.indexOf("\n")
        if (first_newline != -1) { stack_trace = stack_trace.substring(first_newline + 1) }
        stack_trace = replace_substrings(stack_trace, "\n", "<br/>")
        string_to_print = "<details><summary><span style='color:red;'>" + string_to_print +
                          "</span></summary>" + stack_trace + "</details>"
        out_eval_result(string_to_print)
    }
    else if (result.value_string == '"dont_print"') {}
    else {
        if (inspect_is_primitive(result.value)) {
            string_to_print = result.value_string +
                            " <span style='padding-left:50px;font-size:10px;'>" + result.duration + " ms</span>"
            out_eval_result(string_to_print)
        }
        else { inspect_out(result.value) }
    }
    //highlight erroring source code if possible. If result.starting_index == undefined, that means no error.
    if (result.starting_index && (result.starting_index != 0)){ //we've got an error
        //beware starting_index might be 0 which IF treats as false
        if (result.ending_index == undefined){
            result.ending_index = result.starting_index + 1
        }
        Editor.select_javascript(start_of_selection + result.starting_index, start_of_selection + result.ending_index)
    }
}

//doesn't really need to return result as this side_effects result
//src evaled which might not be the whole editor buffer if there's a selection
function error_message_start_and_end_pos(err){
    var error_result = {}
    var full_mess             = err.stack
    error_result.full_error_message = full_mess
    error_result.error_type         = err.name
    error_result.error_message      = err.message
    if (error_result.error_type == "SyntaxError"){ //Syntax errors don't contain line number info.
        return error_result
    }
    else {
        try {
            var comma_split_part = full_mess.split(",")[1]
            var colon_splits  = comma_split_part.split(":")
            var line_no = parseInt(colon_splits[1])
            var char_part = colon_splits[2]
            var paren_splits = char_part.split(")")
            var char_no = parseInt(paren_splits[0])
            if (line_no == 1){ //because of the "try{" that I wrap command in.
                char_no = char_no - prefix_to_evaled_src.length  //7  due to the prefix evaled, ie "try{("
        }
        error_result.line_no = line_no
        error_result.char_no = char_no
        return error_result
        }
        catch(e){return error_result} //because might be some weird format of err.stack
         //that I can't parse, so just bail.
    }
}
