import {out_eval_result} from "../job_engine/core/out.js"
//import {Robot, Brain, Dexter, Human, Serial} from '../job_engine/core/robot.js' //now all globals

var prefix_to_evaled_src = "try{" //referenced in eval code AND in error handler way below

function char_position(src, line_number, col_number){
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

function fix_code_to_be_evaled(src){
    let slash_slash_pos = src.lastIndexOf("//")
    let newline_pos     = src.lastIndexOf("\n")
    if (slash_slash_pos > newline_pos) { //src is ending with a slash-slash comment but no newline on end.
       return src + "\n" //without this I get an error
    }
    else { return src }
}

//a string or null indicating eval button hasn't been clicked since dde launch.
//used in make_dde_status_report
export var latest_eval_button_click_source = null

//part 1 of 3.
//Only called by eval_button_action
//when this is called, there is no selection, so either we're evaling the whole editor buffer
//or the whole cmd line.
//beware, the code *might* be HTML or python at this point
export function eval_js_part1(step=false){
    //tricky: when button is clicked, Editor.get_any_selection() doesn't work,
    //I guess because the button itself is now in focus,
    //so we grab the selection on mousedown of the the Eval button.
    //then use that here if its not "", otherwise, Editor.get_javascript("auto"), getting the whol editor buffer
    let src
    let src_comes_from_editor = false
    if(DocCode.previous_active_element &&
        DocCode.previous_active_element.parentNode &&
        DocCode.previous_active_element.parentNode.parentNode &&
        DocCode.previous_active_element.parentNode.parentNode.CodeMirror){
        src = Editor.get_javascript("auto") //if sel in editor, get it, else get whole editor
        src_comes_from_editor = true
    }
    //let sel_obj = window.getSelection()
    else if (DocCode.selected_text_when_eval_button_clicked.length > 0) {
        src = DocCode.selected_text_when_eval_button_clicked
    }
    else if (DocCode.previous_active_element &&
             DocCode.previous_active_element.tagName == "TEXTAREA"){
         let start = DocCode.previous_active_element.selectionStart
         let end  = DocCode.previous_active_element.selectionEnd
         if (start != end) { src = DocCode.previous_active_element.value.substring(start, end) }
         else              { src = DocCode.previous_active_element.value }
    }
    else if (DocCode.previous_active_element &&
             (DocCode.previous_active_element.tagName == "INPUT") &&
             (DocCode.previous_active_element.type == "text")){
        let start = DocCode.previous_active_element.selectionStart
        let end  = DocCode.previous_active_element.selectionEnd
        if (start != end) { src = DocCode.previous_active_element.value.substring(start, end) }
        else              { src = DocCode.previous_active_element.value }
        src = DocCode.previous_active_element.value
    }
    else {
        src = Editor.get_javascript("auto")
    }
    //we do NOT want to pass to eval part 2 a trimmed string as getting its char
    //offsets into the editor buffer correct is important.
    latest_eval_button_click_source = src
    if (src.trim() == ""){
        DocCode.open_doc(learning_js_doc_id)
        if(src.length > 0) {
            warning("There is a selection in the editor but it has whitespace only<br/>" +
                    "so there is no code to execute.<br/>" +
                    "If you intended to eval the whole editor buffer,<br/>" +
                    "click to eliminate the selection,<br/>" +
                    "then click the Eval button again.")
        }
        else {
            warning("There is no code to execute.<br/>See <span style='color:black;'>Learning JavaScript</span> " +
                "in the Documentation pane for help.")
        }
    }
    else{
        if (Editor.view == "DefEng") {
            try {src = DE.de_to_js(src) }
            catch(e) { dde_error("Error parsing DefEng: " + e.message) }
            //out("<code>" + src + "</code>") //don't need this as JS is printed in Output pane after "Eval result of"
        }   //must add "d ebugger" after converting DefEng to JS.
        else if (window.HCA && (Editor.view === "HCA")){
            HCA.eval_button_action(step)
            return
        }

        if(html_db.string_looks_like_html(src)){
            render_html(src)
        }
        //else if(Editor.current_file_path.endsWith(".py") && //todo needs current_file_path and global def of Py
        //        src_comes_from_editor
        //       ){
        //    Py.eval_part2(src)
        //}
        else {
            eval_js_part2((step? "debugger; ": "") + src) //LEAVE THIS IN RELEASED CODE
        }
    }
}

function render_html(str){
    let title_suffix = str.substring(0, 50) //14
    if(str.length > title_suffix.length) { title_suffix += "..." }
    title_suffix = Utils.replace_substrings(title_suffix, "<", "&lt;")
    title_suffix = Utils.replace_substrings(title_suffix, '"', "&quot;")
    let str_for_title = Utils.replace_substrings(str, '"', "&quot;")
    //let title = 'Rendering HTML: <span title="' + str_for_title + '">' + title_suffix + '</span>'
    //show_window({title: title, content: str})
    out_eval_result(str, "#000000", str_for_title, "The result of rendering HTML")
}

//part 2 of 3 is in eval.js,  window.addEventListener('message'  under the message name of "eval"
function eval_js_part2(command, call_eval_part3_if_no_error=true){ //2nd arg passed in as false for eval_and_play
    command = fix_code_to_be_evaled(command)
    let suffix_to_evaled_src
    let prefix_to_evaled_src
    if (command.startsWith("{")) {
        prefix_to_evaled_src = "try{(";
        suffix_to_evaled_src = ")}"
    } //parens fixes broken js eval of src like "{a:2, b:3}"
    else {
        prefix_to_evaled_src = "try{" //no parens, normal case
        suffix_to_evaled_src = "}"
    }
    //full_dexter_url = event.data.full_dexter_url
    var result = {command: command}

    try {//note doing try_command = "var val927; try{val927 = " + command ...fails because  evaling
        //"var f1 = function f2(){...}" will bind f1 to the fn but NOT f2!!! what a piece of shit js is.
        //AND wrapping parens around src of  "{a:2, b:3}" works but wrapping parens around a "function f1()..." doesn't get f1 bound to the fn.
        var try_command = prefix_to_evaled_src + command + suffix_to_evaled_src + " catch(err){error_message_start_and_end_pos(err)}"
        //if try succeeds, it returns its last val, else catch hits and it returns its last val
        //if I don't do this trick with val927, I get an error when evaling "{a:2, b:3}
        //I can't figure out whether try is supposed to return the val of its last exp or not from the js spec.
        let start_time = Date.now()
        var value = window.eval(command     //using: try_command fails to define async fns.
              ) //window.eval evals in "global scope" meaning that, unlike plain eval
        result.value = value //used by Job's menu item "Start job"
        //if I click on EVAL button with window.eval for defining a fn,
        //then a  2nd click on EVAL for calling it, it will work.
        //also works with var foo = 2, and foo in separate eval clicks.
        //also I think this global eval will not see var bindings for the
        //lex vars in this eventListener, ie name, result, etc. which is good.
        result.duration = Date.now() - start_time
        if (value === null){ //calling null.error_type will error so do this first.
            result.value_string = Utils.stringify_value(value)
        }
        else if ((typeof(value) == "object") && value.error_type){
            result = value
            result.command = command
            result.starting_index = char_position(command, result.line_no, result.char_no)
            var command_starting_with_starting_index = command.substring(result.starting_index)
            result.ending_index = command_starting_with_starting_index.match(/\W|$/).index + result.starting_index

        }
        else{
            result.value_string = Utils.stringify_value(value)
            //result.command = command
        }
    }
    catch(err) { //probably  a syntax error. Can't get starting_index so won't be able to highlight offending code
        result.error_type         = err.name
        result.full_error_message = err.stack
        result.error_message      = err.message
        eval_js_part3(result)
        return "Error: " + err.message
    }
    if (call_eval_part3_if_no_error) { eval_js_part3(result) }
    return result
}

globalThis.eval_js_part2 = eval_js_part2

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
            var cm_pos = Editor.myCodeMirror.doc.posFromIndex(start_of_selection + result.starting_index)
            string_to_print += "<br/>&nbsp;&nbsp;&nbsp;At line: " + (cm_pos.line + 1) + ", char: " + (cm_pos.ch + 1)
        }
        var stack_trace = result.full_error_message
        var first_newline = stack_trace.indexOf("\n")
        if (first_newline != -1) { stack_trace = stack_trace.substring(first_newline + 1) }
        stack_trace = Utils.replace_substrings(stack_trace, "\n", "<br/>")
        string_to_print = "<details><summary><span class='dde_error_css_class'>" + string_to_print +
                          "</span></summary>" + stack_trace + "</details>"
        out_eval_result(string_to_print, undefined, result.command)
    }
    else if (result.value_string == '"dont_print"') {}
    else {
        if (Inspect.inspect_is_primitive(result.value)) {
            let str = result.value_string
            if ((str.length > 2) &&
                (str[0] == '"') &&
                str.includes('\\"') &&
                !str.includes("'")
                ) {
                str = "'" + str.substring(1, str.length - 1) + "'"
                str = Utils.replace_substrings(str , '\\\\"', '"')
            }
            string_to_print =  str +
                            " <span style='padding-left:50px;font-size:10px;'>" + result.duration + " ms</span>" //beware, format_text_for_code depends on this exact string
            out_eval_result(string_to_print, undefined, result.command)
        }
        else { inspect(result.value, result.command) }
    }
    //highlight erroring source code if possible. If result.starting_index == undefined, that means no error.
    if (result.starting_index && (result.starting_index != 0)){ //we've got an error
        //beware starting_index might be 0 which IF treats as false
        if (result.ending_index == undefined){
            result.ending_index = result.starting_index + 1
        }
        Editor.select_javascript(start_of_selection + result.starting_index, start_of_selection + result.ending_index)
    }
    //else if(Editor.get_cmd_selection.length > 0) { cmd_input_id.focus() }
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

globalThis.error_message_start_and_end_pos = error_message_start_and_end_pos //need to make
//this global as we're passing a fn call as a string to eval with this in it. (see below, this file)

//action for the Eval&Start button
export function eval_and_start(){
     let sel_text = Editor.get_any_selection()
     if (sel_text.length == 0) {
         sel_text = Editor.get_javascript()
         if (sel_text.length == 0) {
            warning("There is no selection to eval.")
            return
         }
     }
     sel_text = sel_text.trim()
     if(Utils.starts_with_one_of(sel_text, ["function ", "function(", "function*"])) {
             sel_text = "(" + sel_text + ")"
     } //necessary because
       //without the parens, evaling an anonymous fn, named fn or gen def by itself errors (or returns undefined),
       //due to JS design bug.
       //BUT an anonymous fn as part of an array (as in the do_list) WILL return the fn def.
       //wrapping parens causes eval to return the fn def so we can use it as a dp+list item
       //and thus run it in a job.
     let result   = eval_js_part2(sel_text, false) //don't call eval part 3 if no error
     if ((typeof(result) == "string") && result.startsWith("Error:")) {} //handled by eval_js_part3
     else {
         let val = result.value
         let start_result
         if(Instruction.is_start_object(val)) {
             try { start_result = val.start() }
             catch(err) {
                 warning("The result of evaling: " + sel_text +
                     "<br/> is: " + val +
                     "<br/> but calling its <code>start</code> method errored with:<br/>" +
                     err.message)
                 return
             }
             inspect(start_result, sel_text)
         }
         else if (Instruction.is_do_list_item(val)){
             inspect(val, sel_text)
             Robot.dexter0.run_instruction_fn(val)
         }
         else {
             warning("The result of evaling: " + sel_text +
                 "<br/> is: " + val +
                 "<br/> but that isn't a do_list item and doesn't have a start method.")
         }
    }
}