/* doc
official: github.com/extrabacon/python-shell
but that doesn't describe passing js args to python code,
however the below does:
https://ourcodeworld.com/articles/read/286/how-to-execute-a-python-script-and-retrieve-output-data-and-errors-in-node-js
https://stackoverflow.com/questions/65876022/npm-python-shell-persistent-process-from-javascript
*/

class Py{

   //called from DDE Eval button
   static eval_part2(src){
        Py.eval(src, this.default_callback)
   }

   //very much like top level out_eval_result for JS.
   static out_eval_result(text, color="#000000", src, src_label="The result of evaling Python: "){
        let existing_temp_elts = []
        if(window["document"]){
            existing_temp_elts = document.querySelectorAll("#temp")
        }
        for(let temp_elt of existing_temp_elts){ temp_elt.remove() }

        if (color && (color != "#000000")){
            text = "<span style='color:" + color + ";'>" + text + "</span>"
        }
        text = format_text_for_code(to_source_code({value: text}))
        text = replace_substrings(text, "\n", "<br/>")
        let src_formatted = ""
        let src_formatted_suffix = "" //but could be "..."
        if(src) {
            src_formatted = src.trim()
            let src_first_newline = src_formatted.indexOf("\n")
            if (src_first_newline != -1) {
                src_formatted = src_formatted.substring(0, src_first_newline)
                src_formatted_suffix = "..."
            }
            if (src_formatted.length > 50) {
                src_formatted = src_formatted.substring(0, 50)
                src_formatted_suffix = "..."
            }
            src_formatted = replace_substrings(src_formatted, "<", "&lt;")
            src = replace_substrings(src, "'", "&apos;")
            src_formatted = " <code title='" + src + "'>&nbsp;" + src_formatted + src_formatted_suffix + "&nbsp;</code>"
        }
        //if (src_formatted == "") { console.log("_____out_eval_result passed src: " + src + " with empty string for src_formatted and text: " + text)}
        let the_html = "<fieldset><legend><i>" + src_label  + " </i>" + src_formatted + " <i> is...</i></legend>" +  text + "</fieldset>"
        append_to_output(the_html)
        //$('#js_textarea_id').focus() fails silently
        if(window["document"]){
            let orig_focus_elt = document.activeElement
            if(orig_focus_elt.tagName != "BUTTON"){ //if user clicks eval button, it will be BUTTON
                //calling focus on a button draws a rect around it, not good.
                //if user hits return in cmd line, it will be INPUT,
                //Its not clear that this is worth doing at all.
                orig_focus_elt.focus()
            }
        }
        //if(Editor.get_cmd_selection().length > 0) { cmd_input_id.focus() }
        //else { myCodeMirror.focus() }
    }

    static init_class(){ //does not init the process, just the Py class
       if(!Py.python_executable_path){
         if      (operating_system === "win")    { Py.python_executable_path = "python"  }
         else if (operating_system === "mac")    { Py.python_executable_path = "python3" } //python gets you python2.7
         else /*(operating_system === "linux")*/ { Py.python_executable_path = "python3"  }
       }
       if(!Py.main_eval_py_path) { Py.main_eval_py_path = dde_apps_folder + "/main_eval.py" }
       //Py.main_eval_py_path = __dirname + "/main_eval.py" //note that __dirname, when inside the job engine core folder,  ends in "/core" so don't stick that on the end.
       out('Py.python_executable_path set to: <code>' + Py.python_executable_path + '</code>')
    }
    //document
    static kill(){
        if(this.process){
            Py.process.kill()
        }
    }
    //document
    static init(){
        this.kill()
        Py.init_class()
        this.process = spawn(this.python_executable_path, [Py.main_eval_py_path]) //[dde_apps_folder + "/main_eval.py"]);
        out("New Python process created.")
        this.process.stdout.on('data', (data) => {
            let json_str_plus = data.toString()
            //because library python code might have some misc print statements in it
            //that aren't flushed, data might have those print statements in it..
            //ALSO we might get 2 valid json objects back in one string.
            //shouldn't happen according to my understanding of readline, but appears to happen
            //Print out the misc print statments to DDE's Output Pane,
            //and any actual json objects get sent to their callback.
            let begin_of_json_obj_str = '{"from": "Py.eval",'
            //json_strings_plus = data.split(begin_of_json_obj_str)
            //for(let json_str_plus of json_strings_plus){ //json_str_plus could be
                let open_curley_index  = json_str_plus.indexOf(begin_of_json_obj_str)
                let close_curley_index = json_str_plus.lastIndexOf("}")
                let prefix_string
                let suffix_string
                let json_string
                if(close_curley_index === -1) { //no json_string so only a prefix, unless json_str_plus is empty
                    prefix_string = json_str_plus
                    json_string   = ""
                    suffix_string = ""
                }
                else if(open_curley_index === 0){ //we have a json string and MAYBE a suffix
                    prefix_string = ""
                    json_string   = json_str_plus.substring(0, close_curley_index + 1)
                    suffix_string = json_str_plus.substring(close_curley_index + 1) // might be empty
                }
                else {//curley_index is positive, so we have a prefix, a json_string and MAYBE a suffix
                    prefix_string = json_str_plus.substring(0, open_curley_index)
                    json_string   = json_str_plus.substring(open_curley_index, close_curley_index + 1)
                    suffix_string = json_str_plus.substring(close_curley_index + 1)
                }
                //now print_prefix_string and json_string are set up
                if(prefix_string.length > 0) {
                    out("Misc. output from Python: " + prefix_string)
                }
                if(json_string.length > 0){
                    let json_obj
                    try {
                        json_obj = JSON.parse(json_string)
                    }
                    catch(err){
                        out("Data from Python is not proper JSON object: " + json_string)
                        return
                    }
                    if(json_obj.hasOwnProperty("from") &&
                        json_obj.from === "Py.eval") {
                        let callback_id = json_obj.callback_id
                        let cb = Py.callbacks[callback_id]
                        cb(json_obj)
                        return
                    }
                    else {
                        out("Data from Python is a proper JSON object, but it was not computed for DDE's Py.eval: " + json_string)
                    }
                }
                if((suffix_string.length > 0) && (suffix_string !== "\n")) {
                    out("Misc. output from Python: " + suffix_string)
                }
        })

        //this doesn't handle normal errors because I send normal error to stdout with
        //a json object of is_error: true.
        this.process.stderr.on('data', (data) => {
            out("error from Py: " + data)
        })
        this.process.on('exit', (err_code) => {
            console.log("pyprocess exiting with error code: " + err_code);
        });
        this.callbacks = [this.default_callback] //clear out old callbacks, and add back the default.
        this.eval('sys.path.append("' + dde_apps_folder + '")')
    }

    //callback takes 1 arg, a json_object with is_error, source, result properties
    static eval(python_source_code, callback=Py.default_callback){
        if(!this.process || this.process.killed) {
           this.init() //will call eval to set up sys.path, so we need a timeout to let the process init before
                       //evaling python_source_code
           setTimeout(function() {
                         Py.eval_aux(python_source_code, callback)
                      }, 1000)
        }
        else {
            this.eval_aux(python_source_code, callback)
        }
    }

    static eval_aux(python_source_code, callback=Py.default_callback){
        if(last(python_source_code) === "\n") {
            python_source_code = python_source_code.substring(0, python_source_code.length - 1) //will be added back later
        }
        let proccessed_src = replace_substrings(python_source_code, "\n", "{nL}")
        let existing_cb_id = this.register_callback(callback)
        proccessed_src = existing_cb_id + " " + proccessed_src + "\n" //needs \n for python readline() to complete
        this.process.stdin.write(proccessed_src);
    }
    //returns id for the callback, a non-neg integer.
    static register_callback(callback){
       let existing_cb_id = Py.callbacks.indexOf(callback)
       if (existing_cb_id === -1) {
           existing_cb_id = this.callbacks.length
           this.callbacks.push(callback)
       }
       return existing_cb_id
    }

    //path should end in .py
    static load_file(path, as_name = null, callback=Py.default_callback){
       path = make_full_path(path, false) //don't adjust to OS, keep as slashes.
       path = replace_substrings(path, "\\", "/", false)
       this.eval("sys.path",
                 function(json_obj){
                     let folder_array = json_obj.result
                     let last_slash_pos = path.lastIndexOf("/")
                     let dir = path.substring(0, last_slash_pos) //excludes last slash
                     let file_name_sans_dir = path.substring(last_slash_pos + 1)
                     if(file_name_sans_dir.endsWith(".py")){
                         file_name_sans_dir = file_name_sans_dir.substring(0, file_name_sans_dir.length - 3)
                     }
                     let py_code = ""
                     if(!folder_array.includes(dir)){
                         py_code = 'sys.path.append("' + dir + '")\n'
                     }
                     py_code += "import " + file_name_sans_dir
                     if(as_name) {
                         py_code += " as " + as_name
                     }
                     Py.eval(py_code, callback)
                 })
    }

    //called from File menu item "Load..." when user choses a .py file.
    static load_file_ask_for_as_name(path){
        open_doc(python_user_interface_doc_id)
        let last_slash_pos = path.lastIndexOf("/")
        let file_name_sans_dir = path.substring(last_slash_pos + 1)
        if(file_name_sans_dir.endsWith(".py")){
            file_name_sans_dir = file_name_sans_dir.substring(0, file_name_sans_dir.length - 3)
        }
        show_window({title: 'Load Python file',
                     content: '<div style="margin-left:10px;">' +
                              'For importing:<br/><input name="path" style="width:370px;" value="' + path + '"/><p/>' +
                              'use "as name": <input name="as_name" value="' + file_name_sans_dir + '"/><p/>' +
                              '<input type="submit" value="Cancel" style="margin-left:100px;"/> ' +
                              '<input type="submit" value="OK"     style="margin-left:20px;"/>' +
                              '<div/>',
                     height: 200,
                     callback: "Py.load_file_ask_for_as_name_cb"
        })
    }

    static load_file_ask_for_as_name_cb(vals){
       if(vals.clicked_button_value === "Cancel") {}
       else if (vals.clicked_button_value === "OK") {
           let as_name = vals.as_name
           let path = vals.path
           Py.load_file(path, as_name)
       }
    }

    //prints to output pane
    static default_callback(json_obj){
        let text = json_obj.result
        let color = "#000000" //don't use "black" because that affects Py.out_eval_result
        if(json_obj.is_error){
            let pos = text.indexOf(".py")
            if(pos > 0) { //happens for syntax errors but not for others.
                text = text.substring(pos + 6) //cut off the long, meaningless path name
            }
            //text = "Error: " + text  //redundant with "SyntaxError" or "NameError"
            color = "red"
        }
        Py.out_eval_result(text, color, json_obj.source)
    }
}
module.exports.Py = Py

Py.process = null //doc
Py.python_executable_path = null
Py.main_eval_py_path = null //see comment in ready.js about copying main_eval.py to dde_apps_folder
Py.callbacks = []

var {replace_substrings} = require("./utils")
var spawn = require('child_process').spawn
