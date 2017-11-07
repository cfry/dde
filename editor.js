/**Created by Fry on 10/29/15.*/
/* this has bugs. Conclusion: codemirror not really deignd for npm, too many plug-ins, etc.
so load the old fashion way in index.html
window.CodeMirror = require("codemirror") //now in index.html because this didn't work
require("codemirror/mode/javascript/javascript")
//require("eslint")
//require("codemirror/addon/lint/lint.js")
require("codemirror-lint-eslint")

require("codemirror/addon/dialog/dialog.js") //maybe used by find ???
require("codemirror/addon/search/searchcursor.js")
require("codemirror/addon/search/search.js")
require("codemirror/addon/edit/matchbrackets.js")
require("codemirror/addon/fold/foldcode.js")
require("codemirror/addon/fold/foldgutter.js")
require("codemirror/addon/fold/brace-fold.js")
require("codemirror/addon/fold/comment-fold.js")
*/

var myCodeMirror

function Editor(){} //just a namespace of *some* internal fns
Editor.current_file_path = null //could be "new file" or "/Users/.../foo.fs"

Editor.init_editor = function(){
    myCodeMirror = CodeMirror.fromTextArea(js_textarea,
        {lineNumbers: true,
        //lineWrapping: true,
         mode: "javascript",
         matchBrackets: true,
         foldGutter: true,
         //extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }}, works ony when on line that can be folded
         gutters: ["CodeMirror-linenumbers", "CodeMirror-lint-markers", "CodeMirror-foldgutter"],
         lint: true,
         smartIndent: false, //default is true but that screws up a lot. false is suppose to
                               //indent each line to the line above it when you hit Return
         extraKeys: //undo z and select_all (a) work automaticaly with proper ctrl and cmd bindings for win and  mac
             ((operating_system === "win") ?
                    {"Left":  Series.ts_or_replace_sel_left,
                    "Right":  Series.ts_or_replace_sel_right,
                    "Shift-Right": Series.ts_sel_shift_right, //no non ts semantics
                    "Up":     Series.ts_or_replace_sel_up,
                    "Down":   Series.ts_or_replace_sel_down,
                    "Ctrl-E": eval_button_action, //the correct Cmd-e doesn't work
                    "Ctrl-O": Editor.open,
                    "Ctrl-N": Editor.edit_new_file,
                    "Ctrl-S": Editor.save //windows
                    } :
                    {"Left":  Series.ts_or_replace_sel_left,
                     "Right": Series.ts_or_replace_sel_right,
                     "Shift-Right": Series.ts_sel_shift_right, //no non ts semantics
                     "Up":    Series.ts_or_replace_sel_up,
                     "Down":  Series.ts_or_replace_sel_down,
                     "Cmd-E": eval_button_action, //the correct Cmd-e doesn't work
                     "Cmd-N": Editor.edit_new_file,
                     "Cmd-O": Editor.open,
                     "Cmd-S": Editor.save, //mac
                    })


        });
    undo_id.onclick        = Editor.undo
    set_menu_string(undo_id, "Undo", "z")
    redo_id.onclick        = function(){myCodeMirror.getDoc().redo()}
    find_id.onclick        = function(){CodeMirror.commands.findPersistent(myCodeMirror)}
    replace_id.onclick     = function(){CodeMirror.commands.replace(myCodeMirror)} //allows user to also replace all.
    fold_all_id.onclick    = function(){CodeMirror.commands.foldAll(myCodeMirror)}
    unfold_all_id.onclick  = function(){CodeMirror.commands.unfoldAll(myCodeMirror)}
    select_expr_id.onclick = function(){Editor.select_expr()}
    select_all_id.onclick  = function(){CodeMirror.commands.selectAll(myCodeMirror); myCodeMirror.focus()}
    set_menu_string(select_all_id, "Select All", "a")

    myCodeMirror.on("mousedown",
                    function(cm, mouse_event){
                         if(mouse_event.altKey) {
                             var line_char = myCodeMirror.coordsChar({left: mouse_event.x, top: mouse_event.y})
                             myCodeMirror.getDoc().setCursor(line_char)
                             if (Editor.select_expr()){
                                 mouse_event.preventDefault()
                             }
                         }
                         //I didn't need this setTimeout in ChromeApps,
                         //I could just call Editor.show_identifier_info directly
                         //but in Electron when I do that, you have to click twice
                         //to get the right click help to show up.
                         //Wrapping the setTimout fixes that bug.
                        setTimeout(function() {Editor.show_identifier_info()}, 1)
                        myCodeMirror.focus()
                    })
}

//used both from JS pane Edit menu undo item AND by App builder (called from sandbox))
Editor.undo = function(){ myCodeMirror.getDoc().undo() }
//fold examples. How do I implement menu items for fold all and unfold all?
//editor_html.foldCode(CodeMirror.Pos(0, 0));
//editor_html.foldCode(CodeMirror.Pos(21, 0));

//returns null if path is not in menu. path expected to be a full path,
//even the menu has partial paths.
Editor.index_of_path_in_file_menu = function(path){
    let inner_path = Editor.path_to_files_menu_path(path)
    for(let i in file_name_id.children){
        let a_path = file_name_id.children[i].innerHTML
        if (a_path == inner_path) { return parseInt(i) }
    }
    return null
}

Editor.path_to_files_menu_path = function(path){
    if (path.startsWith(dde_apps_dir)){
        return "dde_apps" + path.substring(dde_apps_dir.length)
    }
    else { return path }
}

Editor.files_menu_path_to_path = function(path){
    if (path.startsWith("dde_apps/")){
        return dde_apps_dir + path.substring(8)
    }
    else { return path }
}

Editor.add_path_to_files_menu = function(path){
        let existing_index = Editor.index_of_path_in_file_menu(path)
        let new_index = 0
        if (existing_index === null) {
            var opt     = document.createElement("OPTION")
            let inner_path = Editor.path_to_files_menu_path(path)
            var textelt = document.createTextNode(inner_path);       // Create a text node
            opt.appendChild(textelt);
            if (file_name_id.hasChildNodes()){
                file_name_id.insertBefore(opt, file_name_id.firstChild)
            }
            else{
                file_name_id.add(opt)
            }
            file_name_id.selectedIndex = new_index
            let paths = persistent_get("files_menu_paths")
            paths.unshift(path)
            if (paths.length > 20) { paths = paths.slice(0, 20) }
            persistent_set("files_menu_paths", paths)
        }
        else {
            new_index = existing_index
            file_name_id.selectedIndex = new_index
        }
         Editor.current_file_path = path

}

Editor.restore_files_menu_paths_and_last_file = function(){ //called by on ready
    if(file_exists("") && file_exists("dde_persistent.json")){ //Documents/dde_apps
        const paths =  persistent_get("files_menu_paths")
        var html = ""
        for(let path of paths){
            let inner_path = Editor.path_to_files_menu_path(path)
            html += '<option>' + inner_path + "</option>"
        }
        file_name_id.innerHTML = html
        if (paths.length > 0) {
            try {
                Editor.edit_file(paths[0]) //sometimes paths[0] will be 'new file' and that's fine
            }
            catch(err) {
                warning("Could not find the last edited file:<br/><code title='unEVALable'>" + paths[0] +
                        "</code><br/> to insert into the editor.")
                Editor.edit_new_file()
            }
        }
        else {
            Editor.edit_new_file()
        }
    }
}

Editor.get_any_selection = function(){
    var sel_text = ""
    sel_text = myCodeMirror.doc.getValue().substring(Editor.selection_start(), Editor.selection_end())
    if(sel_text.length > 0) { return sel_text }
    sel_text = Editor.get_cmd_selection()
    if(sel_text.length > 0 ) { return sel_text }
    //console.log("sel: " + window.getSelection().getRangeAt(0).toString()) //this print statement cause a weird bug for certaon large selections.
    if (!window.getSelection().isCollapsed) { //got sel in doc or output pane
        return window.getSelection().getRangeAt(0).toString()
    }
    if (window.run_src_id){ //run_insutruction dialog type in
        const sel_start = run_src_id.selectionStart
        const sel_end = run_src_id.selectionEnd
        if (sel_start != sel_end) {   //got sel in cmd_input
            const full_src = run_src_id.value
            return full_src.substring(sel_start, sel_end)
        }
    }
    return ""
}

//return editor sel or if none, cmd input, or if none, ""
Editor.get_selection_or_cmd_input = function(){
    var sel_text = myCodeMirror.doc.getValue().substring(Editor.selection_start(), Editor.selection_end())
    if (sel_text.length == 0) { sel_text = cmd_input_id.value }
    return sel_text
}

Editor.get_cmd_selection = function(){
    const sel_start = cmd_input_id.selectionStart
    const sel_end = cmd_input_id.selectionEnd
    if (sel_start != sel_end) {   //got sel in cmd_input
        const full_src = cmd_input_id.value
        return full_src.substring(sel_start, sel_end)
    }
    else { return "" }
}

Editor.get_javascript = function(use_selection=false){
    //if use_selection is true, return it.
    // if false, return whole buffer.
    // if "auto", then if sel, return it, else return whole buffer.
    var full_src =  myCodeMirror.doc.getValue() //$("#js_textarea").val() //careful: js_textarea.value returns a string with an extra space on the end! A crhome bug that jquery fixes
    if (use_selection){
        //var textComponent = document.getElementById('js_textarea')
        //var sel_text = all_text.substring(textComponent.selectionStart,textComponent.selectionEnd )
        var sel_text = full_src.substring(Editor.selection_start(), Editor.selection_end())
        if (use_selection === true) { return sel_text}
        else if (use_selection == "auto") {
            if (sel_text == "") { return full_src}
            else { return sel_text }
        }
        //if (sel_text == ""){
        //    return all_text
        //}
        //else { return sel_text }
    }
    else { return full_src }
}

Editor.set_javascript = function(text){
    //$("#js_textarea").val(text)
    myCodeMirror.doc.setValue(text)
}

Editor.selection_start = function(){
    return myCodeMirror.indexFromPos(myCodeMirror.getCursor("start"))
}

Editor.selection_column_number = function(){
    return myCodeMirror.getCursor("start").ch
}

Editor.selection_line_number = function(){
    return myCodeMirror.getCursor("start").line
}

Editor.line_number = function (src, pos) { //all numbers zero based. assume src linefeeds are just 1 char ie \n
    //and make that newline char be the last char on the line, not the first char of the next line.
    var cur_line = -1
    var cur_col = 0
    var line_number = 0
    for (var i = pos; i > 0; i--) {
        var char = src.charAt(i)
        if (char == '\n')
            line_number++
    }
    return line_number
}

Editor.selection_end = function(){
  return myCodeMirror.indexFromPos(myCodeMirror.getCursor("end"))
}

Editor.is_selection = function(){
    return Editor.selection_start() !== Editor.selection_end()
}


Editor.select_javascript = function(start, end=start){
    //js_textarea.setSelectionRange(start, end)
    //$('#js_textarea').focus() //scroll to make the selection visible .. Wierdly bad var refs get a squiggly red underline voer the whole var name, but not sure how this happens. But its good.
    //$('#js_textarea').scrollTop(start); //doesnt' scroll all the way
    var doc = myCodeMirror.getDoc()
    var cm_start_pos = doc.posFromIndex(start)
    var cm_end_pos   = doc.posFromIndex(end)
    doc.setSelection(cm_start_pos, cm_end_pos, {scroll:true}) //documented to force the initial char of the selection to be in view, but doesn't work
         //important for inserting the TestSuite example for example.
         //Codemirror doc claims the default is true, but apparently not
    if(cm_start_pos.ch < 21){ //column less than 21, just make it move to 0
        myCodeMirror.scrollIntoView({line: cm_start_pos.line, ch:0 })
    }
    else { //otherwise, give me 8 chars of "context" to the left.
        myCodeMirror.scrollIntoView({line: cm_start_pos.line, ch: cm_start_pos.ch - 8 })
    }
    myCodeMirror.focus()
}

//2nd arg can be boolean or a number which is a position relative to the
//actual editor start pos of the new_text to be inserted.
//3rd arg (if any)  is also relative to the editor start pos.
//it defaults to the end of the new_text inserted.
//If 3rd arg is neg, it means relative to the designated start of the selection + length of the new_text
//so 3rd arg of -1 means one char in from the end of the new inserted text.
//to select all of the inserted text, just make 2nd arg true.
//to select in from the end give a 2nd arg of some int, (could be 0) and a neg number for 3rd arg.
Editor.replace_selection = function(new_text, select_new_text=false, end_pos_of_selection_relative=null){
    var doc = myCodeMirror.getDoc()
    var select_arg
    if      (select_new_text === false) { doc.replaceSelection(new_text, "start")}
    else if (select_new_text === true)  { doc.replaceSelection(new_text, "around")}
    else if (typeof(select_new_text) == "number"){
        var editor_start_pos = Editor.selection_start()
        var start_sel
        if (select_new_text < 0){ //menas fron the end of the new_text
            start_sel = editor_start_pos + new_text.length + select_new_text
        }
        else {
            start_sel = editor_start_pos + select_new_text
        }
        var end_sel   = editor_start_pos + new_text.length
        if (typeof(end_pos_of_selection_relative) == "number"){
            if (end_pos_of_selection_relative < 0){
                end_sel = editor_start_pos + new_text.length + end_pos_of_selection_relative
            }
            else {
                end_sel = editor_start_pos + end_pos_of_selection_relative
            }
        }
        doc.replaceSelection(new_text)
        Editor.select_javascript(start_sel, end_sel)
    }
    setTimeout(function(){myCodeMirror.focus()})
}

Editor.path_to_sel_map = {}

Editor.store_selection_in_map = function (){
    Editor.path_to_sel_map[Editor.current_file_path] = [Editor.selection_start(), Editor.selection_end()]
}
//doc.setSelection(anchor: {line, ch}, ?head: {line, ch}, ?options: object)

Editor.restore_selection_from_map = function(){
    const start_end = Editor.path_to_sel_map[Editor.current_file_path]
    if (start_end){
        Editor.select_javascript(start_end[0], start_end[1])
    }
}

Editor.open = function(){
    const path = choose_file({title: "Choose a file to edit", properties: ['openFile']})
       //note that no title is shown, at least on a mac.
    if (path){
        //const content = file_content(path)
        //Editor.set_javascript(content)
        //Editor.add_path_to_files_menu(path)
        Editor.edit_file(path)
    }
}

Editor.edit_new_file = function(){ Editor.edit_file("new file") }

Editor.edit_file = function(path){ //path could be "new file"
    path = convert_backslashes_to_slashes(path) //must store only slashes in files menu
    if(Editor.current_file_path){ //false when we first boot up.
        Editor.store_selection_in_map()
        if ((Editor.current_file_path != "new file") &&
             persistent_get("save_on_eval")){
            Editor.save_current_file()
        }
    }
    const path_already_in_menu = Editor.select_file_in_file_menu(path)
    if (!path_already_in_menu) { Editor.add_path_to_files_menu(path) }
    var content
    if (path == "new file"){ content = "" }
    else                   { content = file_content(path) } //file_content will conver to windows format if needed
    Editor.set_javascript(content)
    Editor.current_file_path = path
    Editor.restore_selection_from_map()
    file_name_id.title = path
    myCodeMirror.focus()
}

Editor.save_current_file = function(){
        out("Saved: " + Editor.current_file_path)
        write_file(Editor.current_file_path, Editor.get_javascript())
}

//called by the File menu "Save" item and Cmd-s keystroke
Editor.save = function() {
    if (Editor.current_file_path == "new file"){ Editor.save_as() }
    else {
        Editor.save_current_file();
        myCodeMirror.focus()
    }
}

Editor.save_as = function(){ //also called by onclick save
    const title     = 'save "' + Editor.current_file_path + '" as'
    const default_path = ((Editor.current_file_path == "new file") ? dde_apps_dir : Editor.current_file_path)
    const path = choose_save_file({title: title, defaultPath: default_path}) //sychronous! good
    if(path) { //path will be undefined IF user canceled the dialog
        let content = Editor.get_javascript()
        write_file(path, content)
        Editor.add_path_to_files_menu(path)
    }
}

Editor.select_file_in_file_menu = function(path){
    let inner_path = Editor.path_to_files_menu_path(path)
    var the_opt_elts = file_name_id.children
    for (var index = 0; index < the_opt_elts.length; index++){
        var elt = the_opt_elts[index]
        if (elt.innerText == inner_path){
            file_name_id.selectedIndex = index
            return true
        }
    }
    return false //no such path in file menu
}


//replace selected text with new text.
Editor.insert = function(text, insertion_pos="replace_selection", select_new_text=false){ //insertion_pos defaults to the current editor selection start.
    if (insertion_pos == null) { insertion_pos = "replace_selection" }
    if (["replace_selection", "selection_start", "selection_end", "start", "end", "whole"].includes(insertion_pos) ||
        (typeof(insertion_pos) == "number")) {
        text = decode_quotes(text) //replace all ddqq with a double quote
        //var ta = document.getElementById("js_textarea")
        var orig_text = Editor.get_javascript()
        var orig_cursor_start = Editor.selection_start()
        var orig_cursor_start_object = myCodeMirror.getCursor("start")
        let s, e
        if     ((insertion_pos == "replace_selection") || (insertion_pos == null))
                                                    { s = orig_cursor_start; e = Editor.selection_end() }
        else if (insertion_pos == "selection_start"){ s = orig_cursor_start; e = s }
        else if (insertion_pos == "selection_end")  { s = Editor.selection_end(); e = s }
        else if (insertion_pos == "start")          { s = 0; e = s }
        else if (insertion_pos == "end")            { s = orig_text.length; e = s }
        else if (insertion_pos == "whole")          { s = 0; e = orig_text.length}
        else if (typeof(insertion_pos) == "number") { s = insertion_pos; e = s }
        //the below shouldn't happen because the real checking is done in the sandbox part of this fn.
        else{ throw(TypeError("Editor.insert passed insertion_pos of: " + insertion_pos +
                              " but the only legal values are: 'start', 'end', 'selection_start', 'selection_end'," +
                              " an integer, 'whole' (meaning replace the whole editor content) and " +
                              " 'replace_selection' -- the default (meaning replace the selection)."))
        }
        var new_text  = orig_text.substr(0, s) + text + orig_text.substr(e)
        Editor.set_javascript(new_text) //$('#js_textarea').val(new_text);
        var new_sel_end = e + text.length
        if (insertion_pos !== undefined) {new_sel_end = orig_cursor_start + text.length} //so cursor will be semantically where it started
        if (select_new_text){
            Editor.select_javascript(s, s + text.length)
        }
        else {
            var doc = myCodeMirror.getDoc()
            var new_cursor_pos = doc.posFromIndex(new_sel_end)
            myCodeMirror.setCursor(new_cursor_pos)
        }
        myCodeMirror.focus()
        myCodeMirror.scrollIntoView(orig_cursor_start_object) //orig_cursor_start_object can be
         //way off when insertion_pos == "whole", but that seems to not screw up so leave it.
    }
    else{
        throw(TypeError("Editor.insert passed insertion_pos of: " + insertion_pos +
                "<br/>but the only legal values are: " +
                "<br/>'start', 'end', 'selection_start', 'selection_end', an integer," +
                "<br/>'whole' (meaning replace the whole editor content) and " +
                "<br/>'replace_selection' -- the default (meaning replace the selection)."))
    }
}

/*Editor.insert_and_hide_window = function(text){
    Editor.insert(text)
    rde.hide_window()
}*/

//only used in ui as of feb, 2016. no support in sandbox
Editor.wrap_around_selection = function(prefix, suffix, if_no_selection_text){
        prefix = decode_quotes(prefix) //replace all ddqq with a double quote
        suffix = decode_quotes(suffix) //replace all ddqq with a double quote
        if(if_no_selection_text == undefined){
            if_no_selection_text = ""
        }
        if_no_selection_text = decode_quotes(if_no_selection_text)
        var orig_text = Editor.get_javascript()
        var s = Editor.selection_start()
        var e = Editor.selection_end()
        var sel_text = orig_text.slice(s, e)
        if (sel_text.length == 0){
            sel_text = if_no_selection_text
        }
        else if (sel_text[sel_text.length - 1] == "\n"){
            e = e - 1 //good when inserting /* */ to comment out a whole line.
            sel_text = sel_text.slice(0, sel_text.length - 1)
        }
        var new_text  = orig_text.slice(0, s) + prefix + sel_text + suffix + orig_text.substr(e)
        Editor.set_javascript(new_text) //$('#js_textarea').val(new_text);
        var new_sel_start = s + prefix.length
        var new_sel_end   = new_sel_start + sel_text.length
        var doc = myCodeMirror.getDoc()
        //var new_cursor_pos = doc.posFromIndex(new_sel_end)
        //myCodeMirror.setCursor(new_cursor_pos)
        Editor.select_javascript(new_sel_start, new_sel_end)
}

//not as good as inside out parser code way below.
Editor.start_and_end_of_js_call_at_pos = function(js_src, js_cursor_pos){
    //assumes cursor is somewhere in text like "Editor.some_fn("
    //return array of start and end pos, ie [34, 47]
    var start = -1
    var end = -1
    //first look for end of "Editor.some_fn("
    var max_last_char_pos = Math.min(js_cursor_pos + 25, js_src.length - 1)
    for(var i = 0; i < 25; i++){ //
        var end_pos_maybe = js_cursor_pos + i
        if (end_pos_maybe > max_last_char_pos){
            break;
        }
        var char = js_src[end_pos_maybe]
        if (char == "("){ //good
            end = end_pos_maybe
            break;
        }
        else if (char == '\n') { //bad
            break;
        }
        else if (is_alphanumeric(char) || (char == " ") || (char == ".")){
             //allow the dot in Editor.foo". JS also allows spaces between fn name and open paren ie "dexster.foo  ("
            null //keep looping
        }
       else { break; }
    }
    if (end == -1) return null
    //find the start of the Editor.foo call "
    for(var i = 0; i < 25; i++){ //
        var start_pos_maybe = js_cursor_pos - i
        if (start_pos_maybe < 0){
            break;
        }
        var char = js_src[start_pos_maybe]
        if (js_src.indexOf("Editor.", start_pos_maybe) == start_pos_maybe) { //bingo
            start = start_pos_maybe
        }
    }
    if (start == -1) return null
    else { return [start, end] }
}


//assumes that editor cursor is after end_action_name
//returns string error message or true for success
//ui fn
Editor.train_for_loop_insert = function (task_name, repeat_from_action_name, repeat_through_action_name,
                                         repetitions, train_task_for_loops_made){
        var orig_start_pos  = Editor.selection_start()
        Editor.select_javascript(orig_start_pos, orig_start_pos) //collapse selection if any.
        var orig_doc_text   = Editor.get_javascript()
        var start_loop_body = Editor.find_start_loop(orig_doc_text, orig_start_pos, repeat_from_action_name, task_name)
        if (typeof(start_loop_body) == "string") {
            out(start_loop_body, "red")
            return
        }
        var end_loop_body   = Editor.find_end_loop(orig_doc_text, orig_start_pos, repeat_through_action_name, task_name)
        if (typeof(end_loop_body) == "string") {
            out(end_loop_body, "red")
            return
        }
        if (start_loop_body > end_loop_body){
            out("Error: the start_action_name of: " + repeat_from_action_name +
                            "<br/>occurs after the end_action_name of: " + repeat_through_action_name + "<br/>", "red")
            return
        }
        var loop_var        = String.fromCharCode("i".charCodeAt(0) + train_task_for_loops_made) //so that the 2nd loop in a task will have var j, not i
        var for_start       = "  for(var " + loop_var + " = 0; " + loop_var + " < " + repetitions + "; " + loop_var + "++){\n" //indent 2 spaces because body will be indented 4.
        var for_end         = "  }\n"
        var for_body        = orig_doc_text.slice(start_loop_body, end_loop_body)
        var new_doc_text    = orig_doc_text.slice(0, start_loop_body) +
                              for_start + for_body + for_end +
                              orig_doc_text.slice(end_loop_body)
        Editor.set_javascript(new_doc_text)
        var new_cursor_pos = orig_start_pos + for_start.length + for_end.length
        Editor.select_javascript(new_cursor_pos, new_cursor_pos)
}

//returns int or string error message
Editor.find_start_loop = function(orig_doc_text, orig_start_pos, repeat_from_action_name, task_name){
    var upward_limit_string  = "function " + task_name + "(" //don't search up beyond this.
    var action_search_string = "//" + repeat_from_action_name + " "
    var action_pos = orig_doc_text.lastIndexOf(action_search_string, orig_start_pos)
    if (action_pos == -1) {
        action_search_string = "//" + repeat_from_action_name + "\n"
        action_pos = orig_doc_text.lastIndexOf(action_search_string, orig_start_pos)
        if (action_pos == -1) {
          return "Error: could not find action named: " + repeat_from_action_name + "<br/>in task: " + task_name + "<br/>"
        }
    }
    var limit_string_pos = orig_doc_text.lastIndexOf(upward_limit_string, orig_start_pos)
    if (limit_string_pos == -1) { return "Error: could not find task named: " + task_name }
    else if (action_pos > limit_string_pos) {  //success
        var newline_pos = orig_doc_text.lastIndexOf("\n", action_pos) //really should always find this before begin of file
        return newline_pos + 1
    }
    else {return "Error: could not find action named: " + repeat_from_action_name + "in task: " + task_name +
                 " but did find " +  repeat_from_action_name + " above " + task_name + "."}

}

Editor.find_end_loop = function(orig_doc_text, orig_start_pos, repeat_through_action_name, task_name){
    var upward_limit_string  = "function " + task_name + "(" //don't search up beyond this.
    var action_search_string = "//" + repeat_through_action_name + " "
    var action_pos = orig_doc_text.lastIndexOf(action_search_string, orig_start_pos)
    if (action_pos == -1) {
        action_search_string = "//" + repeat_through_action_name + "\n"
        action_pos = orig_doc_text.lastIndexOf(action_search_string, orig_start_pos)
        if (action_pos == -1) {
            return "Error: could not find action named: " + repeat_through_action_name + "<br/>in task: " + task_name + "<br/>"
        }
    }
    var limit_string_pos = orig_doc_text.lastIndexOf(upward_limit_string, orig_start_pos)
    if (limit_string_pos == -1) { return "Error: could not find task named: " + task_name }
    else if (action_pos > limit_string_pos) {  //success
        var newline_pos = orig_doc_text.indexOf("\n", action_pos) //really should always find this before begin of file
        return newline_pos + 1
    }
    else {return "Error: could not find action named: " + repeat_through_action_name + "in task: " + task_name +
        " but did find " +  repeat_through_action_name + " above " + task_name + "."}
}
//build_app and train utilties below here

Editor.insert_before_fn_def = function(fn_name, code){
        var orig_doc_text = Editor.get_javascript()
        var cursor_pos    = Editor.selection_start()
        var fn_start_pos  = Editor.find_task_start(orig_doc_text, cursor_pos, fn_name)
        Editor.insert(code, fn_start_pos)
}

Editor.close_app_builder_temp_windows = function(){
        var temp_wins = $('.app_builder_temp_window')
        if ((temp_wins.length > 0) && temp_wins.jqxWindow("isOpen")){
            temp_wins.jqxWindow('close')
        }
}
Editor.run_unfinished_app_builder_window = function (task_name, opening_code, closing_code){
        if (opening_code == undefined) { opening_code = "" }
        if (closing_code == undefined) { closing_code = "" } //closing code is "}" for training dexter, but is much more for App Builder.
        var orig_doc_text = Editor.get_javascript()
        var cursor_pos    = Editor.selection_start()
        var fn_start_pos  = Editor.find_task_start(orig_doc_text, cursor_pos, task_name)
        if (typeof(fn_start_pos) == "string") { //error message
            out("Error: " + fn_start_pos, "red")
        }
        else{
            var fn_partial_source = orig_doc_text.slice(fn_start_pos, cursor_pos)
            var temp_wins = $('.app_builder_temp_window')
            var new_x_code = ""
            var new_y_code = ""
            if ((temp_wins.length > 0) && temp_wins.jqxWindow("isOpen")){
                var old_win_pos = temp_wins.position() //temp_wins.jqxWindow("position") warning: crap jqWin position returns that last pos programmatically set NOT the pos dragged to by the user, which is what I want.
                temp_wins.jqxWindow('close')
                if (old_win_pos && ((old_win_pos.top != 200) || (old_win_pos.left != 200))){
                    //hack fn_partial_source to have the old_win_pos
                    new_x_code = 'x: "' + old_win_pos.left + 'px", '
                    var x_colon_pos = fn_partial_source.indexOf(" x:")//space in front of x: *might* not get some x: instances, but should get most. hward to work around
                    if(x_colon_pos != -1){
                        var x_comma_pos = fn_partial_source.indexOf(",", x_colon_pos)
                        var old_x_code = fn_partial_source.substring(x_colon_pos, x_comma_pos)
                        fn_partial_source.replace(old_x_code, new_x_code)
                        new_x_code = "" //used it already
                    }
                    new_y_code = ' y: "' + old_win_pos.top + 'px", '
                    var y_colon_pos = fn_partial_source.indexOf(" y:") //must have space in from of y: or we'll match font-family:
                    if(y_colon_pos != -1){
                        var y_comma_pos = fn_partial_source.indexOf(",", y_colon_pos)
                        var old_y_code = fn_partial_source.substring(y_colon_pos, y_comma_pos)
                        fn_partial_source.replace(old_y_code, new_y_code)
                        new_y_code = "" //used it already
                    }
                }
            }
            fn_partial_source = fn_partial_source.replace("{content:", "{" + new_x_code + new_y_code + 'window_class:"app_builder_temp_window", content:')

            var full_src = opening_code + fn_partial_source + closing_code +"\n" + task_name + "()"
            eval_js_part2(full_src)
        }
}


Editor.run_unfinished_task = function (task_name){
        var orig_doc_text = Editor.get_javascript()
        var cursor_pos    = Editor.selection_start()
        var fn_start_pos  = Editor.find_task_start(orig_doc_text, cursor_pos, task_name)
        if (typeof(fn_start_pos) == "string") { //error message
            out("Error: " + fn_start_pos, "red")
        }
        else{
            var fn_partial_source = orig_doc_text.slice(fn_start_pos, cursor_pos)
            var full_src = "(" + fn_partial_source + "})()"
            eval_js_part2(full_src)
        }
}

Editor.find_task_start = function(orig_doc_text, cursor_pos, task_name){
    //look up from cursor_pos to the beginning of the function its in.
    var fn_begin_text = "function " + task_name + "("
    var task_fn_pos = orig_doc_text.lastIndexOf(fn_begin_text, cursor_pos)
    if (task_fn_pos != -1) {return task_fn_pos}
    else { return "Could not find " + fn_begin_text + " so can't run " + task_name + "'s actions." }
}

//checks if pos is between slash_slash and newline
Editor.in_a_comment = function(src, pos){
    var slash_slash_pos = src.lastIndexOf("//", pos)
    if (slash_slash_pos == -1) {return false}
    else{
        var return_pos = src.indexOf("\n", slash_slash_pos)
        if ((slash_slash_pos < pos) && (return_pos > pos)) { return true }
        else { return false }
    }
}

Editor.select_expr = function(full_src = Editor.get_javascript(), cursor_pos = Editor.selection_start()){
    let start_and_end = Editor.find_expr(full_src, cursor_pos)
    if (start_and_end) {
        Editor.select_javascript(start_and_end[0], start_and_end[1])
    }
    return start_and_end
}

Editor.find_expr = function(full_src = Editor.get_javascript(), cursor_pos = Editor.selection_start()){
    let start_and_end = Editor.select_call(full_src, cursor_pos)
    if (start_and_end &&
        (start_and_end[0] <= cursor_pos) &&
        (start_and_end[1] >= cursor_pos)) { return start_and_end }
    let identifier_bounds = Editor.bounds_of_identifier(full_src, cursor_pos)
    if (identifier_bounds){ return identifier_bounds }
    let expr_bounds = Editor.find_delimited_expr(full_src, cursor_pos)
    if(expr_bounds) { return expr_bounds }
    expr_bounds = Editor.find_literal_string(full_src, cursor_pos)
    if(expr_bounds) { return expr_bounds }
    return null
}

//parens, square brakets, curley brace
Editor.find_delimited_expr = function(full_src, cursor_pos){
    let char = full_src[cursor_pos]
    let char_pos = cursor_pos
    if (!Editor.is_delimiter(char) && (cursor_pos >= 0)) {
        char_pos = cursor_pos - 1
        char = full_src[char_pos]
    }
    if (!Editor.is_delimiter(char) && (cursor_pos < (full_src.length - 1))) {
        char_pos = cursor_pos + 1
        char = full_src[char_pos]
    }
    if (Editor.is_delimiter(char)){
        let delim_pos = Editor.find_matching_delimiter(full_src, char_pos)
        return [Math.min(char_pos, delim_pos), Math.max(char_pos, delim_pos)]
    }
    else { return null }
}

Editor.find_literal_string = function(full_src, cursor_pos){
    let char = full_src[cursor_pos]
    let char_pos = cursor_pos
    if (!Editor.is_quote(char) && (cursor_pos >= 0)) {
        char_pos = cursor_pos - 1
        char = full_src[char_pos]
    }
    if (!Editor.is_quote(char) && (cursor_pos < (full_src.length - 1))) {
        char_pos = cursor_pos + 1
        char = full_src[char_pos]
    }
    if (Editor.is_quote(char)){
        let forward_pos          = Editor.find_forwards(full_src,  char_pos + 1, char)
        let backward_pos         = Editor.find_backwards(full_src, char_pos - 1, char)
        let forward_newline_pos  = Editor.find_forwards(full_src,  char_pos + 1, "\n")
        let backward_newline_pos = Editor.find_backwards(full_src, char_pos - 1, "\n")
        if ((char == "'") || (char == '"')){
            if (forward_newline_pos < forward_pos)   { forward_pos  = null } //forward can't work
            if (backward_newline_pos > backward_pos) { backward_pos = null } //backward can't work
        }
        if(forward_pos || (forward_pos == 0)){
            if (backward_pos || (backward_pos == 0)){ //both are possible
                if ((forward_pos - char_pos) < (char_pos - backward_pos)){ //forward wins as its shorter distance to it
                    return [char_pos, forward_pos + 1]
                }
                else { return [backward_pos, char_pos + 1] }
            }
            //only forward pos is in the running
            else { return [char_pos,  forward_pos + 1] }
        }
        else if (backward_pos || (backward_pos == 0)) { return [backward_pos, char_pos + 1] }
        else return null
    }
    else { return null }
}


//____________select_call______________
//returns array of start and end pos  if found selection and null if no call found
Editor.select_call = function(full_src = Editor.get_javascript(), cursor_pos = Editor.selection_start()){
    var start_and_end = Editor.find_call_start_end_from_end(full_src, cursor_pos)
    if (!start_and_end){
        start_and_end = Editor.find_call_start_end_from_start(full_src, cursor_pos)
    }
    if (!start_and_end){ //user clicked in middle of a call not very end and not a fn name.
        var fwd_nearest_delim_pos = Editor.find_forward_delimiter(full_src, cursor_pos)
        var delim_char = full_src[fwd_nearest_delim_pos]
        if (Editor.is_close_delimiter(delim_char)){
            start_and_end = Editor.find_call_start_end_from_end(full_src, fwd_nearest_delim_pos + 1)
        }
        else {
            var bwd_nearest_delim_pos = Editor.find_backward_delimiter(full_src, cursor_pos)
            var delim_char = full_src[bwd_nearest_delim_pos]
            if (Editor.is_open_delimiter(delim_char)){
                var close_delim = Editor.find_matching_delimiter(full_src, bwd_nearest_delim_pos)
                if (close_delim == null) {return false}
                else { start_and_end = Editor.find_call_start_end_from_end(full_src, close_delim + 1)}
            }
        }
    }
    if (!start_and_end){
        start_and_end = Editor.find_comment(full_src, cursor_pos)
    }
    if (start_and_end){
        return start_and_end
    }
    return null
}

Editor.find_comment = function(full_src, cursor_pos){
    let start = null
    let end = null
    if (full_src.startsWith("/*", cursor_pos)) {
        start = cursor_pos
        end = Editor.find_forwards(full_src, cursor_pos, "*/")
        if (end) { end += 2 }
    }
    else if ((cursor_pos > 1) &&
             (full_src[cursor_pos - 1] == "*") &&
        (full_src[cursor_pos - 2] == "/")){
        start = Editor.find_backwards_string(full_src, cursor_pos, "/*")
        end = Editor.find_forwards(full_src, cursor_pos, "*/")
        if (end) { end += 2 }
    }
    else if ((cursor_pos > 0) &&
             (full_src[cursor_pos - 1] == "/") &&
             (full_src[cursor_pos] == "*")){  //we've clicked between / and *
        start = cursor_pos - 1
        end = Editor.find_forwards(full_src, cursor_pos, "*/")
        if (end) { end += 2 }
    }
    //maybe we're at the end ie */
    else if ((cursor_pos < (full_src.length - 1))     &&
             (full_src[cursor_pos]     == "*") &&
             (full_src[cursor_pos + 1] == "/")){ //cursor in front of */
        end = cursor_pos + 2
        start = Editor.find_backwards(full_src, cursor_pos, "/*")
    }
    else if ((cursor_pos < (full_src.length))     &&
             (full_src[cursor_pos - 1] == "*") &&
             (full_src[cursor_pos] == "/")){ //cursor between * and /
        end = cursor_pos + 1
        start  = Editor.find_backwards(full_src, cursor_pos, "/*")
    }
    else if ((full_src[cursor_pos - 2] == "*") &&
             (full_src[cursor_pos - 1] == "/")){ //cursor after */
        end = cursor_pos
        start  = Editor.find_backwards(full_src, cursor_pos, "/*")
    }
    else if (full_src.startsWith("//", cursor_pos)){
        start = cursor_pos
        end   = Editor.find_forwards(full_src, cursor_pos, "\n")
        if (!end) { end = full_src.length }
        return [start, end]
    }
    else if (full_src.startsWith("/", cursor_pos) &&
             (cursor_pos > 0) &&
             (full_src[cursor_pos - 1] == "/")){
        start = cursor_pos - 1
        end   = Editor.find_forwards(full_src, cursor_pos, "\n")
        if (!end) { end = full_src.length }
        return [start, end]
    }
    else if ((cursor_pos > 1) &&
             (full_src[cursor_pos - 1] == "/") &&
             (full_src[cursor_pos - 2] == "/")){
        start = cursor_pos - 2
        end   = Editor.find_forwards(full_src, cursor_pos, "\n")
        if (!end) { end = full_src.length }
        return [start, end]
    }
    if ((start || (start === 0)) && end) { return [start, end] } //if end == 0, we can't have a selection
    else              { return null }
}

//if right before cursor_pos is ");" or ")" then this returns the start and end pos of the call
//otherwise retruns null
Editor.find_call_start_end_from_end = function(full_src, cursor_pos){
    var temp_cur = cursor_pos
    if (Editor.find_backwards_string(full_src, cursor_pos, ";")){ //there's a semi before the cursor
        temp_cur -= 1 //temp_cur now pointing at the semi
    }
    if (temp_cur > 0) {
        temp_cur -= 1 //maybe pointing at a close delim
        var close_delim_maybe = full_src[temp_cur]
        if (Editor.is_close_delimiter(close_delim_maybe)){
            temp_cur = Editor.find_matching_delimiter(full_src, temp_cur) //searches backwards
            if (temp_cur != null){
                var open_delim = full_src[temp_cur]
                if (open_delim == "[") { return [temp_cur, cursor_pos]} //done selecting array
                else if (open_delim == "(") {
                    if (temp_cur > 0){
                        var meth_name_start = Editor.find_call_start_from_open_paren(full_src, temp_cur)
                        if (meth_name_start || (meth_name_start == 0)) {
                            if (meth_name_start > 0){
                                var before_ws = Editor.backup_over_whitespace(full_src, meth_name_start - 1)
                                if (before_ws || (before_ws == 0)){
                                    var new_pos_start = Editor.find_backwards_string(full_src, before_ws + 1, "new")
                                    if (new_pos_start || (new_pos_start == 0)){ meth_name_start = new_pos_start}
                                }
                            }
                            return [meth_name_start, cursor_pos]
                        }
                    }
                }
                else if (open_delim == "{") { //maybe got a fn def
                    var close_paren_pos = Editor.find_backwards(full_src, temp_cur, ")")
                    if (close_paren_pos && (close_paren_pos > 1)){ //at least 1 char fn name
                        var open_paren_pos = Editor.find_matching_delimiter(full_src, close_paren_pos)
                        if ((open_paren_pos != null) && (open_paren_pos > 0)){
                            var last_char_before_whitespace_pos = Editor.backup_over_whitespace(full_src, open_paren_pos - 1)
                            if (last_char_before_whitespace_pos &&
                                (last_char_before_whitespace_pos > 0) &&
                                (last_char_before_whitespace_pos < open_paren_pos)){
                                var identifier_bounds =  Editor.bounds_of_identifier(full_src, last_char_before_whitespace_pos)
                                if (identifier_bounds){
                                    var identifier = full_src.substring(identifier_bounds[0], identifier_bounds[1])
                                    if(["catch", "else if", "function", "function*", "for", "if", "switch", "while"].indexOf(identifier) != -1)  { //anonymous fn, etc.
                                        return [identifier_bounds[0], cursor_pos]
                                    }
                                    else if (identifier_bounds[0] > 0) { //named fn
                                        last_char_before_whitespace_pos = Editor.backup_over_whitespace(full_src, identifier_bounds[0] - 1)
                                        if (last_char_before_whitespace_pos &&
                                            (last_char_before_whitespace_pos > 0) &&
                                            (last_char_before_whitespace_pos < open_paren_pos)){
                                            identifier_bounds =  Editor.bounds_of_identifier(full_src, last_char_before_whitespace_pos)
                                            if (identifier_bounds){
                                                var identifier = full_src.substring(identifier_bounds[0], identifier_bounds[1])
                                                if((identifier == "function") || (identifier == "function*")) { return [identifier_bounds[0], cursor_pos] } //anonymous fn
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else { //got curely close and open, but the curly open not preceeed by clsoe paren, so maybe its  a "try" or "else"
                        var last_char_before_whitespace_pos = Editor.backup_over_whitespace(full_src, temp_cur - 1)
                        if (last_char_before_whitespace_pos &&
                            (last_char_before_whitespace_pos > 0)){
                           var identifier_bounds = Editor.bounds_of_identifier(full_src, last_char_before_whitespace_pos)
                           var id = full_src.substring(identifier_bounds[0], identifier_bounds[1])
                           if (["else", "try"].indexOf(id) != -1){
                               return [identifier_bounds[0], cursor_pos]
                           }
                        }
                    }
                }
            }
        }
    }
    return null
}

//cursor_pos pointing at open paren
Editor.find_call_start_from_open_paren = function(full_src, cursor_pos){
    var temp_cur = Editor.backup_over_whitespace(full_src, cursor_pos - 1)
    if (temp_cur == null) { return null } //only whitespace between open paren and doc begin
    else {
        var identifier_bounds = Editor.bounds_of_identifier(full_src, temp_cur)
        if (!identifier_bounds) {return null}
        else { return identifier_bounds[0] }
        //fn_name_start = Editor.backup_to_whitespace(full_src, temp_cur)
        //if (fn_name_start <= temp_cur){
        //    return fn_name_start
        //}
    }
    return null
}

Editor.find_call_start_end_from_start = function(full_src, cursor_pos){
    let identifier_bounds = Editor.bounds_of_identifier(full_src, cursor_pos)
    if (identifier_bounds){
        var identifier = full_src.substring(identifier_bounds[0], identifier_bounds[1])
        if (["catch", "else if", "function", "function*", "for", "if", "switch", "while"].includes(identifier)){
            var open_paren_pos = Editor.find_forward_delimiter(full_src, identifier_bounds[1])
            var delim_char = full_src[open_paren_pos]
            if (delim_char != "("){ return null }
            else {
                var close_paren_pos = Editor.find_matching_delimiter(full_src, open_paren_pos)
                if (close_paren_pos == null){ return null }
                else {
                    var open_curley_pos = Editor.find_forward_delimiter(full_src, close_paren_pos + 1)
                    if (!open_curley_pos) { return null }
                    else{
                        var close_curley_pos = Editor.find_matching_delimiter(full_src, open_curley_pos)
                        if (close_curley_pos == null) { return null }
                        else { return [identifier_bounds[0], close_curley_pos + 1] }
                    }
                }
            }
        }
        else if (["else", "try"].includes(identifier)){
            var open_curley_pos = Editor.find_forward_delimiter(full_src, identifier_bounds[1])
            if (!open_curley_pos) { return null }
            else if (full_src[open_curley_pos] == "{"){
                var close_curley_pos = Editor.find_matching_delimiter(full_src, open_curley_pos)
                if (close_curley_pos == null) { return null }
                else { return [identifier_bounds[0], close_curley_pos + 1] }
            }
        }
        else if (identifier == "new"){
            var open_paren_pos = Editor.find_forward_delimiter(full_src, identifier_bounds[1])
            var delim_char = full_src[open_paren_pos]
            if (delim_char != "("){ return null }
            else {
                var close_paren_pos = Editor.find_matching_delimiter(full_src, open_paren_pos)
                if (close_paren_pos != null){
                    var close_paren_char = full_src[close_paren_pos]
                    if (close_paren_char == ")") {return [identifier_bounds[0], close_paren_pos + 1]}
                }
            }
        }
        else if ((identifier == "var") || (identifier == "let")){
            let equal_sign_pos = Editor.find_forwards(full_src, cursor_pos, "=")
                if (equal_sign_pos) {
                    let pos_of_first_val_char = Editor.skip_forward_over_whitespace(full_src, equal_sign_pos + 1)
                    if (pos_of_first_val_char) {
                        let expr_start_end = Editor.find_expr(full_src, pos_of_first_val_char)
                        if (expr_start_end) { return [identifier_bounds[0], expr_start_end[1]] }
                    }
                }
            return null
        }
    }
    var open_pos = Editor.find_forward_open_delimiter(full_src, cursor_pos)
    let end_comment_pos = -1
    if (cursor_pos > 2) {
        end_comment_pos = Editor.find_forwards(full_src, cursor_pos - 1, "*/")
    }
    if ((end_comment_pos > -1) && (end_comment_pos < open_pos)) { return null } //situation is
          //   /* foo |*/ function bar(){}
         //or  /* foo *|/ function bar(){}
         // or /* foo */| function bar(){} and we want to sel the comment, not function bar
    if (open_pos || (open_pos == 0)){
        var close_pos = Editor.find_forward_close_delimiter(full_src, cursor_pos)
        if (close_pos < open_pos) { return null }
        var close_pos = Editor.find_matching_delimiter(full_src, open_pos)
        if (close_pos != null) {
            var open_char = full_src[open_pos]
            if (open_char == "[") {
                if ((open_pos == cursor_pos) ||
                    ((open_pos - 1) == cursor_pos) ||
                    ((open_pos + 1) == cursor_pos)){
                    return [open_pos, close_pos + 1] }
                else { return null }
            }
            else if(open_char == "(") {
                temp_cur = Editor.find_call_start_from_open_paren(full_src, open_pos)
                if (temp_cur !== null) { //beware, if fn starts on first char of file, temp_cur will be 0
                    //ALSO: if we have src function foo(a){return 2} and user clicks on
                    //the close paran, we don't want to select the whole fn def because
                    //user could be trying to get an example fn call to the fn and copy & paste
                    //it somewhere else. //however, if preceeded by "new ", we want to select that.
                    if (temp_cur > 0){
                        var ws = Editor.backup_over_whitespace(full_src, temp_cur - 1)
                        if (ws && (ws < temp_cur)){ //found some whitespace
                            var new_pos_start = Editor.find_backwards_string(full_src, ws + 1, "new")
                            if ((new_pos_start == 0) || new_pos_start){ temp_cur = new_pos_start}
                        }
                    }
                    return [temp_cur, close_pos + 1]
                }
            }
        }
    }
    return null
}

Editor.is_close_delimiter = function(char){
    if (")]}".indexOf(char) == -1) {return false}
    else {return true}
}

Editor.is_open_delimiter = function(char){
    if ("([{".indexOf(char) == -1) {return false}
    else {return true}
}

Editor.is_delimiter = function(char){
    return Editor.is_open_delimiter(char) || Editor.is_close_delimiter(char)
}

Editor.matching_delimiter = function(char){
    if      (char == "(") {return ")"}
    else if (char == ")") {return "("}

    else if (char == "[") {return "]"}
    else if (char == "]") {return "["}

    else if (char == "{") {return "}"}
    else if (char == "}") {return "{"}
    else { shouldnt("Got char: " + char + " that is not a known delimiter.") }
}


Editor.find_forward_delimiter = function(full_src, cursor_pos=0){
    full_src = full_src.substring(cursor_pos)
    var match      = full_src.match(/[\(|\[|\{\)\]\}]|\/\//);
    if (match === null) {return null}
    else if (match[0] == "//"){ //we want to exclude from matching any parens that are between // and newline as they are in a comment.
        var new_line_pos = full_src.indexOf("\n", match.index)
        if (new_line_pos == -1) {return null} //no newline, so no text after the // in full_src, so there can't be any parents ,etc after the //
        else { return Editor.find_forward_delimiter(full_src, cursor_pos + new_line_pos + 1) }
    }
    else {
        return cursor_pos + match.index
    }
}

//skips over // comments
Editor.find_backward_delimiter = function(full_src, cursor_pos){
    full_src = full_src.substring(0, cursor_pos)
    full_src = reverse_string(full_src)
    var result = Editor.find_forward_delimiter(full_src, 0)
    result = full_src.length - result - 1
    return result
}


//does not bypass // comments.
Editor.find_forward_open_delimiter = function(full_src, cursor_pos=0){
    full_src = full_src.substring(cursor_pos)
    var match      = full_src.match(/[\(|\[|\{]/);
    if (match === null) {return null}
    else {
        return  cursor_pos + match.index
    }
}

//does not bypass // comments.
Editor.find_forward_close_delimiter = function(full_src, cursor_pos=0){
    full_src = full_src.substring(cursor_pos)
    var match      = full_src.match(/[\)|\]|\}]/);
    if (match === null) {return null}
    else {
        return  cursor_pos + match.index
    }
}

//cursor_pos is pointing at a ()[]{}. Returns the pos of the matching one or null
Editor.find_matching_delimiter = function(full_src, cursor_pos=0){
    var cursor_pos_delim    = full_src[cursor_pos]
    if (Editor.is_open_delimiter(cursor_pos_delim)) { return Editor.find_matching_close(full_src, cursor_pos) } //looking for ),}, or ]
    else                                            { return Editor.find_matching_open( full_src, cursor_pos) } //looking for (,{, or [
}


//expects cur_pos to point at close paren, searches backwards
Editor.find_matching_open = function(full_src, cursor_pos=0){
    var close_delim  = full_src[cursor_pos]
    var open_delim   = Editor.matching_delimiter(close_delim)
    var opens_needed = 0
    for (var i = cursor_pos; i >= 0; i--){
         var char = full_src[i]
         if (char == close_delim) { opens_needed += 1 } //expected to hit on first iteration
         else if (char == open_delim){
             opens_needed -= 1
             if (opens_needed == 0) { return i }
         }
         else if (char == "\n"){
             var slash_slash_pos = Editor.backup_over_slash_slash(full_src, i - 1)
             if (slash_slash_pos) {
                 if (slash_slash_pos == 0) {return null}
                 else {i = slash_slash_pos}
             }
         }
    }
     return null
}

//expects cur_pos to point at open paren, searches forwards
Editor.find_matching_close = function(full_src, cursor_pos=0){
    var open_delim    = full_src[cursor_pos]
    var close_delim   = Editor.matching_delimiter(open_delim)
    var closes_needed = 0
    for (var i = cursor_pos; i < full_src.length; i++){
        var char = full_src[i]
        if (char == open_delim) closes_needed += 1
        else if (char == close_delim){
            closes_needed -= 1
            if (closes_needed == 0) { return i }
        }
        else if ("\"'`".includes(char)){
            let quote_end_pos = Editor.find_forwards_matching_quote(full_src, i)
            if (quote_end_pos){
                i = quote_end_pos //skip over literal string. note that quote_end_pos points at the
                  //quote but when we get to the top of the loop, i is incremented so
                  //the next char we process will be after the quote.
            }
            else {} // weird situation. For now ignore it but not a good condition.
        }
        else if ((char == "/") &&
                 (i < (full_src.length - 1)) &&
                 (full_src[i + 1] == "/")){
            var newline_pos = full_src.indexOf("\n", i)
            if (newline_pos) { i = newline_pos }
            else return null //no chars after the // comment
        }
    }
    return null
}

//returns pos of start of string_to_find or null
//string is only looked for immedeately before cursor_pos
Editor.find_backwards_string = function(full_src, cursor_pos, string_to_find){
    if (string_to_find.length > cursor_pos) {return null}
    else {
        var start_pos_maybe = cursor_pos - string_to_find.length
        var index = full_src.indexOf(string_to_find, start_pos_maybe)
        if (index == start_pos_maybe) {return start_pos_maybe}
        else { return null }
    }
}

//finds starting pos of occurance of string_to_find that's close to, but before cursor_pos.
//skips over // comments
//returns -1 if can't find string_to_find
Editor.find_backwards = function(full_src, cursor_pos, string_to_find){
    var pos = full_src.lastIndexOf(string_to_find, cursor_pos)
    if (pos == -1) { return null }
    if(Editor.in_a_comment(full_src, pos)) {
        var slash_slash_pos = full_src.lastIndexOf("//", pos)
        return Editor.find_backwards(full_src, slash_slash_pos, string_to_find)
    }
    else { return pos }
}

Editor.find_forwards = function(full_src, cursor_pos, string_to_find){
     return full_src.indexOf(string_to_find, cursor_pos)
}

Editor.skip_forward_over_whitespace = function(full_src, cursor_pos){
   for (let pos = cursor_pos; pos < full_src.length; pos++){
       if (!is_whitespace(full_src[pos])) { return pos }
   }
   return full_src.length
}

//______literal stirngs ________
Editor.is_quote = function(char){ return (`"'` + "`").includes(char) }

// pos of the quote or null
Editor.find_forwards_any_kind_of_quote = function(full_src, cursor_pos=0){
    let double_pos   = full_src.indexOf('"', cursor_pos)
    let single_pos   = full_src.indexOf("'", cursor_pos)
    let backtick_pos = full_src.indexOf('`', cursor_pos)
    if (double_pos   == -1) { double_pos   = 1000000}
    if (single_pos   == -1) { single_pos   = 1000000}
    if (backtick_pos == -1) { backtick_pos = 1000000}
    let result = Math.min(double_pos, single_pos, backtick_pos)
    if (result === 1000000) { return null }
    else if (result === -1) { return null }
    else                    { return result }
}

//returns pos of the quote or null
Editor.find_backwards_any_kind_of_quote = function(full_src, cursor_pos){
    let double_pos   = full_src.lastIndexOf('"', cursor_pos)
    let single_pos   = full_src.lastIndexOf("'", cursor_pos)
    let backtick_pos = full_src.lastIndexOf('`', cursor_pos)
    let result = Math.max(double_pos, single_pos, backtick_pos)
    if (result === -1) { return null }
    else { return result }
}

Editor.find_forwards_matching_quote = function(full_src, cursor_pos=0){
    let quote_char = full_src[cursor_pos]
    let pos = full_src.indexOf(quote_char, cursor_pos + 1)
    if (pos === -1) { return null }
    else            { return pos }
}

Editor.find_backwards_matching_quote = function(full_src, cursor_pos){
    if (cursor_pos == 0) { return null }
    let quote_char = full_src[cursor_pos]
    let pos = full_src.lastIndexOf(quote_char, cursor_pos - 1)
    if (pos === - 1) { return null }
    else             { return pos  }
}
//returns the pos of the start of a comment but doesn't go beyond a newline.
//cursor_pos is expected to be just before a newline, and if no
//slash_slash on the line, return null
Editor.backup_over_slash_slash = function(full_src, cursor_pos){
    var slash_slash_pos = full_src.lastIndexOf("//", cursor_pos)
    if (slash_slash_pos == -1) { return null } //no slash_slashes in preceeding whole doc.
    else {
        var newline_pos = full_src.lastIndexOf("\n", cursor_pos)
        if (newline_pos == -1)                 { return slash_slash_pos } //we're on the top line, and there's a slash_slash on its end
        else if(slash_slash_pos > newline_pos) { return slash_slash_pos } //the nearest slash-slash is indeed on the line we're looing at, so return its pos so we can back up over it.
        else                                   { return null }      //no slash_slash in the line
    }
}

//returns index of the first char before a whitespace group, or, if none, cursor_pos
//in any case, returned index char will not point at whitespace,
//and may be the last char before a whitespace group
//if all whitespace from cursor_pos back to doc start, returns null
//If this fn is to backup at all, cursor_pos should point at whitespace.
Editor.backup_over_whitespace = function(full_src, cursor_pos){
    for (var i = cursor_pos; i >= 0; i--){
      if( !(/\s/.test(full_src[i]))){
          return i
      }
      else if (i == 0) { //we found no whitespace all the way to the begin of doc,
                         //so consider the begin of doc to be whitespace
         return 0
      }
    }
    return null //whitespace including cursor_pos and all the way to front of doc.
}

//cursorpos is expected to not be on whitespace, though it might be
//when we find whitespace, return pos of first char after it.
//if find begin of file before we find whitespace, return 0.
//if cursorpos is whitespace, then returns cursor_pos + 1
Editor.backup_to_whitespace = function(full_src, cursor_pos){
    for (var i = cursor_pos; i >= 0; i--){
        if((/\s/.test(full_src[i]))){
            return i + 1
        }
    }
    return 0 //no whitespace to front of doc.
}

//returns null if cursor pos not in a function def
Editor.bounds_of_function_def = function(full_src, cursor_pos){
    var function_pos = Editor.find_backwards(full_src, cursor_pos, "function")
    if (function_pos == null){ return null }
    var end_of_params_pos = full_src.indexOf("){", function_pos)
    if (end_of_params_pos == -1){ return null }
    var function_end_pos  = Editor.find_matching_delimiter(full_src, end_of_params_pos + 1)
    if (function_end_pos == null){ return null }
    else return [function_pos, function_end_pos]
}

//returns null if cursor_pos not in a function
Editor.function_params_and_locals = function(full_src, cursor_pos){
    var bounds = Editor.bounds_of_function_def(full_src, cursor_pos)
    if (!bounds) { return null } //not in a function
    var params_start_pos = full_src.indexOf("(", bounds[0])
    if (params_start_pos == -1) { return null }
    else { 
        var fn_name = full_src.substring(bounds[0] + 9, params_start_pos)
        fn_name.trim()    
        params_start_pos += 1 //skip over open paren
    } 
    var params_end_pos = full_src.indexOf("){", params_start_pos)
    if (params_end_pos == -1) { return null }
    var params_full_string = full_src.substring(params_start_pos, params_end_pos) //excludes parens
    var params_and_defaults_array = params_full_string.split(",")
    var param_names = []
    for(var param_and_default of params_and_defaults_array){
        param_and_default = param_and_default.trim()
        if (param_and_default.startsWith("{")){
            var inner_params_and_defaults = param_and_default.substring(1, param_and_default.length -1) //cut off { and }
            var inner_params_and_defaults_array = inner_params_and_defaults.split(",")
            for(var inner_param_and_default of inner_params_and_defaults_array){
                inner_param_and_default = inner_param_and_default.trim()
                var the_match = inner_param_and_default.match(/^[A-Za-z_-]+/)
                if (!the_match) {return null} //invalid syntax
                var the_param = the_match[0]
                param_names.push(the_param)
            }
        }
        else {
            var equal_pos = param_and_default.indexOf("=")
            var the_param
            if (equal_pos != -1){
                the_param = param_and_default.substring(0, equal_pos)
                the_param = the_param.trim()
            }
            else {
                the_param =  param_and_default
            }
            param_names.push(the_param)
        }
    }
    var fn_src = full_src.substring(bounds[0], bounds[1])
    var matches = fn_src.match(/var\s+[A-Za-z_-]+/g)
    var var_names = []
    if (matches){
        for (var match of matches){
            var_names.push(match.substring(4))
        }
    }
    matches = fn_src.match(/let\s+[A-Za-z_-]+/g)
    var let_names = []
    if (matches){
        for (var match of matches){
            let_names.push(match.substring(4))
        }
    }
    return {fn_name: fn_name, param_names: param_names, params_full_string: params_full_string, var_names: var_names, let_names: let_names}
}

//returns null if pos_of_char_in_identifier does not point at an identifier char,
//or returns [start_pos_of_identifier, identifier_last_char_pos_plus_1]
Editor.bounds_of_identifier = function(full_src, pos_of_char_in_indentifier, identifier_regex=/[a-zA-Z0-9\-\._]/){
    //var identifier_regex = /[a-zA-Z0-9\-\._]/
    if (!identifier_regex.test(full_src[pos_of_char_in_indentifier])){ return null}
    var start_pos = null
    for(var i = pos_of_char_in_indentifier; i >= 0; i--) {
        var char = full_src[i]
        if (!identifier_regex.test(char)) {
            start_pos = i + 1;
            break;
        }
        else if (i == 0) { start_pos = 0 }
    }
    var end_pos = null
    for(var i = pos_of_char_in_indentifier; i < full_src.length; i++) {
        var char = full_src[i]
        if (!identifier_regex.test(char)) {
            end_pos = i;
            break;
        }
        else if (i == (full_src.length - 1)) { end_pos = full_src.length }
    }
    if (end_pos == null) { return null }
    var id = full_src.substring(start_pos, end_pos)
    //hack to turn "else if" into a single identifier
    if (id == "else") {
        var end_of_else_if_maybe = end_pos + 3
        if ((full_src.length -1) >= end_of_else_if_maybe){
            var the_if_suffix = full_src.substring(end_pos, end_of_else_if_maybe)
            if (the_if_suffix == " if") { end_pos = end_of_else_if_maybe}
        }
    }
    else if (id == "if"){
        var start_of_else_if_maybe = start_pos - 5
        if (start_of_else_if_maybe >= 0){
            var the_else_prefix = full_src.substring(start_of_else_if_maybe, start_pos)
            if (the_else_prefix == "else ") { start_pos = start_of_else_if_maybe}
        }
    }
    else if (id == "function"){ //do we have function*  ???
        if ((full_src.length > end_pos) && full_src[end_pos] == "*"){
            end_pos += 1
        }
    }
    else if (id == "yield"){ //do we have yield*  ???
        if ((full_src.length > end_pos) && full_src[end_pos] == "*"){
            end_pos += 1
        }
    }
    return [start_pos, end_pos]
}

Editor.identifier_at_pos = function(){
    var pos = Editor.selection_start()
    var full_text = Editor.get_javascript()
    var bounds = Editor.bounds_of_identifier(Editor.get_javascript(), pos)
    if (bounds){
        return full_text.slice(bounds[0], bounds[1])
    }
    else { return null }
}

Editor.bounds_of_operator = function(full_src, pos_of_char_in_identifier){
    return Editor.bounds_of_identifier(full_src, pos_of_char_in_identifier, /[<>=!\+\-\*/%|&]/)
}

Editor.bounds_of_string_literal = function(full_src, pos_of_char_in_identifier){
    var first_char = full_src[pos_of_char_in_identifier]
    if ((first_char == '"') || (first_char ==  "'") || (first_char == "`")){
        var ending_quote_pos = full_src.indexOf(first_char, pos_of_char_in_identifier + 1)
        if (ending_quote_pos != -1){
            var newline_pos = full_src.indexOf("\n", pos_of_char_in_identifier + 1)
            if ((first_char == "`") || (newline_pos == -1) || (newline_pos > ending_quote_pos)){
                return [pos_of_char_in_identifier, ending_quote_pos + 1] //we use counds in slice so ending quote needs to me 1 more than the actual pos of the ending quote
            }
        }
        var starting_quote_pos = full_src.lastIndexOf(first_char, pos_of_char_in_identifier - 1)
        if (starting_quote_pos != -1){
            var newline_pos = full_src.lastIndexOf("\n", pos_of_char_in_identifier)
            if ((first_char == "`") || (newline_pos == -1) || (newline_pos < starting_quote_pos)){
                return [starting_quote_pos, pos_of_char_in_identifier + 1]
            }
        }
    }
    if (pos_of_char_in_identifier > 0){
        var last_char = full_src[pos_of_char_in_identifier - 1]
        if ((last_char == '"') || (last_char ==  "'") || (last_char == "`")){
            var starting_quote_pos = full_src.lastIndexOf(last_char, pos_of_char_in_identifier - 2)
            if (starting_quote_pos != -1){
                var newline_pos = full_src.lastIndexOf("\n", pos_of_char_in_identifier + 1)
                if ((first_char == "`") || (newline_pos == -1) || (newline_pos < starting_quote_pos)){
                    return [starting_quote_pos, pos_of_char_in_identifier]
                }
            }
        }
    }
    return null
}

//returns null if we have {}  since that could be the empty body of a fn, etc.
//this is pretty flakey so do it at the end.
//only matches on "{foo:..."
Editor.bounds_of_object_literal = function(full_src, pos_of_char_in_identifier){
    var first_char = full_src[pos_of_char_in_identifier]
    if (first_char == '{'){
        var ending_brace = full_src.indexOf("}", pos_of_char_in_identifier + 1)
        if (ending_brace != -1){
            for (var i = pos_of_char_in_identifier + 1; i < full_src.length; i++){
                var char = full_src[i]
                if(is_whitespace(char)){ } //keep looping//got first char of identifier
                else if(is_letter_or_underscore(char)){ //got first char of first identifier in obj lit.
                    var ident_bounds = Editor.bounds_of_identifier(full_src, i )
                    if (ident_bounds) {
                        if (full_src[ident_bounds[1]] == ":"){
                            return [pos_of_char_in_identifier, ending_brace + 1]
                        }
                        else { return null }
                    }
                    else { return null }
                }
                else { return null } //got non whitespace and non first letter of a var so no go
            }
        }
        else { return null }
    }
    else if (pos_of_char_in_identifier > 0){
        var last_char = full_src[pos_of_char_in_identifier - 1]
        if (last_char == '}'){
            var starting_brace = full_src.lastIndexOf("{", pos_of_char_in_identifier - 2)
            if (starting_brace != -1){
                return Editor.bounds_of_object_literal(full_src, starting_brace)
            }
        }
    }
    return null
}

Editor.bounds_of_array_literal = function(full_src, pos_of_char_in_identifier){
    var first_char = full_src[pos_of_char_in_identifier]
    if (first_char == '['){
        var ending_brace = Editor.find_matching_delimiter(full_src, pos_of_char_in_identifier)
        if (ending_brace != null){
           return [pos_of_char_in_identifier, ending_brace + 1]
        }
        else { return null }
    }
    else if (first_char == "]"){
        var start_brace = Editor.find_matching_delimiter(full_src, pos_of_char_in_identifier)
        if (start_brace != null){
            return [start_brace, pos_of_char_in_identifier + 1]
        }
        else { return null }
    }
    else if (pos_of_char_in_identifier > 0){
        var prev_char = full_src[pos_of_char_in_identifier - 1]
        if (prev_char == "]"){
            var start_pos = Editor.find_matching_delimiter(full_src, pos_of_char_in_identifier - 1)
            if (start_pos != null){
                return [start_pos, pos_of_char_in_identifier]  
            }
            else { return null }
        }
        else { return null }
    }
    else { return false }
}

Editor.in_whitespace = function(full_src, pos){
    if (pos >= full_src.length) { return true } //questionable, but what probably happened is user
    //licked beyond the end of the last char, and the "pos" found in such cases will
    //be the length of full_src, hence full_src[pos] will fail. So
    //just call it whitespace.
    else if (is_whitespace(full_src[pos])){
        if (pos == 0){ return true }
        else { return is_whitespace(full_src[pos - 1])}
    }
    else { return false }
}

//called by both editor click help and cmd_in help
Editor.identifier_or_operator = function(full_src=null, pos=null){
    if (full_src === null) { full_src = Editor.get_javascript() }
    if (pos === null)      { pos = Editor.selection_start() }
    if (full_src.length == 0){
        return "_the_editor_is_empty"
    }
    if (pos >= full_src.length){ //if we've clicked beyond the end of the buffer, back up one.
        pos = pos - 1
        if (is_whitespace(full_src[pos])){ return "  " } //1 whitespace on end and clicking off  the end is a whitespace click
    }
    var cur_char = full_src[pos]
    if (is_whitespace(cur_char) && (pos > 0) && !is_whitespace(full_src[pos -1 ])){
        pos = pos -1 // we probably have a situation like "foo   "  and the user clicked right after "foo",
                     //so pretend they really clicked on the last o of foo.
        cur_char = full_src[pos]
    }
    if (cur_char == ",") { return ","}
    else if (cur_char == ";") { return ";"}
    else if (cur_char == ":") { return ":"}
    else if (cur_char == "{") { return "{"}
    else if (cur_char == "}") { return "}"}
    else if (cur_char == "(") { return "("}
    else if (cur_char == ")") { return ")"}
    else if (cur_char == "[") { return "["}
    else if (cur_char == "]") { return "]"}
    else if ((cur_char == ".") && (pos > 0) && !is_digit(full_src[pos - 1])){ return "." } //NOT a decimal point
    var bounds   = Editor.bounds_of_identifier(full_src, pos)
    if (bounds){
        var identifier = full_src.slice(bounds[0], bounds[1])
        var fn_data = Editor.function_params_and_locals(full_src, pos)
        if (fn_data){
            if (fn_data.param_names.includes(identifier)){
                return ["param_name", identifier, fn_data.fn_name]
            }
            else if (fn_data.var_names.includes(identifier)){
                return ["var_name", identifier, fn_data.fn_name]
            }
            else if (fn_data.let_names.includes(identifier)){
                return ["let_name", identifier, fn_data.fn_name]
            }
            else if (fn_data.fn_name == identifier){
                return ["fn_name", identifier, fn_data.params_full_string //fn_data.param_names
                ]
            }
            else { return identifier }
        }
        else { return identifier }
    }
    bounds = Editor.bounds_of_operator(full_src, pos)
    if (bounds){return full_src.slice(bounds[0], bounds[1])}
    bounds = Editor.bounds_of_string_literal(full_src, pos)
    if (bounds){return full_src.slice(bounds[0], bounds[1])}
    bounds = Editor.bounds_of_object_literal(full_src, pos)
    if (bounds){return full_src.slice(bounds[0], bounds[1])}
    bounds = Editor.bounds_of_array_literal(full_src, pos)
    if (bounds){return full_src.slice(bounds[0], bounds[1])}
    if (pos >= full_src.length) { return "_the_eof_token" } //never happens now that  I back up 1 char if user clicks at end
    if (Editor.in_whitespace(full_src, pos)){
        return "  "  //note this won't likely be the actual string of whitespace but for our purposes, we 
                     //only really care if its any whitespace
    }
    return null
}

//not now called apr 2016. functionalty taken over by  identifier_or_operator
Editor.variable_info = function(identifier){
    if (/[a-zA-Z]/.test(identifier[0])){
        var full_src = Editor.get_javascript()
        var pos      = Editor.selection_start()
        var start_pos = Editor.find_backwards(full_src, pos, "function")
        //I don't handle nested fn defs so probably will just break with them.
        if (start_pos){
            var [fn_def_start, fn_def_end] = Editor.find_call_start_end_from_start(full_src, start_pos)
            if (fn_def_end == -1) { //hmm, if no valid end, then presume we're writing the fn now
                fn_def_end = full_src.length
            }
            var param_open_paren = full_src.indexOf("(", start_pos)
            if ((param_open_paren != -1) && (pos < fn_def_end)){
                var param_close_paren = Editor.find_matching_close(full_src, param_open_paren)
                if (param_close_paren != null){
                    var params_string = full_src.slice(param_open_paren + 1, param_close_paren)
                    var params_array = params_string.split(",")
                    for (let param of params_array){
                        param = param.trim()
                        if (param == identifier) { return "function parameter" }
                        else if (param.startsWith(identifier)){
                            var char_after_identifier = param[identifier.length]
                            if ([" ", "\n", "="].indexOf(char_after_identifier) != -1){
                                { return "function parameter" }
                            }
                        }
                    }
                }
            }
            var var_identifier = "var " + identifier
            var var_pos = full_src.indexOf(var_identifier, start_pos)
            if ((var_pos != -1) && (var_pos < pos) && (var_pos < fn_def_end)){ //note,
                //we might find the var but if its beyond the end of the fn def, then not so good.
                var char_after_identifier = full_src[var_pos + var_identifier.length]
                if ([" ", "\n", "="].indexOf(char_after_identifier) != -1){
                    return "a local variable " + Js_info.make_atag("var", "var")
                }
            }
            //I don't pretend to get the let scoping right, just check if let is declared between fn begin and cursor pos
            var_identifier = "let " + identifier
            var_pos = full_src.indexOf(var_identifier)
            if ((var_pos != -1) && (var_pos < pos) && (var_pos < fn_def_end)){
                var char_after_identifier = full_src[var_pos + var_identifier.length]
                if ([" ", "\n", "="].indexOf(char_after_identifier) != -1){
                    return "probably a local variable " + Js_info.make_atag("let", "let")
                }
            }
            if (window[identifier]){
                return "a global variable with value: " + window[identifier]
            }
        }
    }
    return null
}

Editor.show_identifier_info = function(full_src=null, pos=null){
    var identifier = Editor.identifier_or_operator(full_src, pos)
    if (identifier){
        var info = Js_info.get_info_string(identifier)
        /* this is now implemented in identifier_or_operator that returns a potential array with var, let and param into in it.
         if (!info){
            info = Editor.variable_info(identifier)
            if (info){ info = "<b>" + identifier + "</b> is " + info }
        }*/
        if (info){
            out(info, null, true)
        }
    }
}
