//__________out  and helper fns_______

var out_item_index   = 0 //used by the "out" code

function out(val="", color="black", temp=false, code=null){
    if(window.platform == "node") { console.log(val) }
    else {
        let orig_focus_elt = document.activeElement
        let text = val
        if (typeof(text) != "string"){ //if its not a string, its some daeta structure so make it fixed width to demostrate code. Plus the json =retty printing doesn't work unless if its not fixed width.
            text = stringify_value(text)
        }
        text = format_text_for_code(text, code)
        if ((color != "black") && (color != "#000000")){
            text = "<span style='color:" + color + ";'>" + text + "</span>"
        }
        let temp_str_id = ((typeof(temp) == "string") ? temp : "temp")
        let existing_temp_elts = $("#" + temp_str_id)
        if (temp){
            if (existing_temp_elts.length == 0){
                text = '<div id="' + temp_str_id + '" style="border-style:solid;border-width:1px;border-color:#0000FF;margin:5px 5px 5px 15px;padding:4px;">' + text + '</div>'
                append_to_output(text)
            }
            else {
                existing_temp_elts.html(text)
            }
            return "dont_print"
        }
        else {
            if ((existing_temp_elts.length > 0) && (temp_str_id == "temp")){ //don't remove if temp is another string. This is used in Job.show_progress
                existing_temp_elts.remove()
            }
            var out_item_id = "out_" + out_item_index
            out_item_index += 1
            text = '<div id="' + out_item_id + '" style="border-style:solid;border-width:1px;border-color:#AA00AA;margin:5px 5px 5px 15px;padding:4px;">' + text + '</div>'
            append_to_output(text)
        }
        orig_focus_elt.focus()
        if (temp){
            return "dont_print"
        }
        else {
            return val //so value can be used by the caller of show_output
        }
    }
}
module.exports.out = out

function format_text_for_code(text, code=null){
    if (code === null) {
        code = persistent_get("default_out_code")
        if ((code === undefined) || (code === null) || (code == false)) { code = false }
    }
    if (code) { //cut off timing info: too confusing to see it.
        let timing_index = text.indexOf(" <span style='padding-left:50px;font-size:10px;'>")
        if (timing_index !== -1) { text = text.substring(0, timing_index) }
        text = replace_substrings(text, "<",   "&lt;")
        text = replace_substrings(text, ">",   "&gt;")
        //text = replace_substrings(text, "\n",  "<br/>")
        text = replace_substrings(text, "\\\\n", "\n")
        text = "<pre><code>" + text + "</code></pre>"
    }
    return text
}

/*
 StackTrace.get(function(sf){
 return sf.functionName == show_output
 })then(function(sf){
 var lineno = sf.lineNumber
 var colno  = sf.columnNumber
 }catch("errorcb")
 out_aux = function(text, color){
 */

//text is a string that represents a result from eval.
// It has been trimmed, and stringified, with <code> </code> wrapped around it probably.
//never passed 'dont_print, always prints <hr/> at end whereas regular output never does
//ui only
function out_eval_result(text, color="#000000", src, src_label="The result of evaling JS"){
    if (text != '"dont_print"'){
        var existing_temp = $("#temp")
        if (existing_temp.length > 0){
            existing_temp.remove()
        }
        if (starts_with_one_of(text, ['"<svg ', '"<circle ', '"<ellipse ', '"<foreignObject ', '"<line ', '"<polygon ', '"<polyline ', '"<rect ', '"<text '])) {
            text = text.replace(/\</g, "&lt;") //so I can debug calls to svg_svg, svg_cirle ettc
        }
        if (color && (color != "#000000")){
            text = "<span style='color:" + color + ";'>" + text + "</span>"
        }
        text = format_text_for_code(text)
        let src_formatted = ""
        let src_formatted_suffix = "" //but could be "..."
        if(src) {
            src_formatted = src
            let src_first_newline = src_formatted.indexOf("\n")
            if (src_first_newline != -1) {
                src_formatted = src_formatted.substring(0, src_first_newline)
                src_formatted_suffix = "..."
            }
            if (src_formatted.length > 55) {
                src_formatted = src_formatted.substring(0, 55)
                src_formatted_suffix = "..."
            }
            src_formatted = replace_substrings(src_formatted, ">", "&lt;")
            src = replace_substrings(src, "'", "&apos;")
            src_formatted = " <code title='" + src + "'>&nbsp;" + src_formatted + src_formatted_suffix + "&nbsp;</code>"
        }
        //if (src_formatted == "") { console.log("_____out_eval_result passed src: " + src + " with empty string for src_formatted and text: " + text)}
        text = "<fieldset><legend><i>" + src_label  + " </i>" + src_formatted + " <i>is...</i></legend>" +  text + "</fieldset>"
        append_to_output(text)
    }
    //$('#js_textarea_id').focus() fails silently
    let orig_focus_elt = document.activeElement
    if(orig_focus_elt.tagName != "BUTTON"){ //if user clicks eval button, it will be BUTTON
       //calling focus on a button draws a rect around it, not good.
       //if user hits return in cmd line, it will be INPUT,
       //Its not clear that this is worth doing at all.
        orig_focus_elt.focus()
    }
    //if(Editor.get_cmd_selection().length > 0) { cmd_input_id.focus() }
    //else { myCodeMirror.focus() }
}
module.exports.out_eval_result = out_eval_result

function get_output(){ //rather uncommon op, used only in append_to_output
    return $("#output_div_id").html()
}
module.exports.get_output = get_output

function clear_output(){
    output_div_id.innerText = ""
    init_inspect();
    return "dont_print"
}
module.exports.clear_output = clear_output

//only called from this file
function append_to_output(text){
    var out_height = output_div_id.scrollHeight
    text += "\n"
    $("#output_div_id").append(text)
    output_div_id.scrollTop = out_height
    install_onclick_via_data_fns()
}

var {persistent_get} = require("./storage")
var {replace_substrings, starts_with_one_of} = require("./utils.js")
