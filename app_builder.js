/* Created by Fry on 2/1/16.*/

function ab(){} //just a namespace

//in sandbox
ab.window_names = [] //don't put this in the init as we want it to persist accross tasks, whe user clicks New task

ab.init = function(){
    // these are per training window use and get reinited when new training window is opened
    ab.window_name = ""
    ab.input_names = []
    ab.button_name_to_action_map = {}
    ab.has_items = false //we might have only static text in which case, ab.input_names.length == 0
}

ab.post_creation_window_init = function(){
    var vals = {} //we don't have any as we're just initing
    var new_win_default_name = "window_" + (ab.window_names.length + 1)
    dex.set_in_window(undefined, "window_name", "value", new_win_default_name)
    ab.fill_in_action_names(vals)
}

ab.actions = function(){
    var result = ['out("clicked on " + vals.clicked_button_value)', 'out(vals)']
    for (var wn of ab.window_names){
        result.push(wn + "()")
    }
    return result
}

ab.handle_fn_start = function(vals, always_add_function_header){
    //returns empty string unless the "function ..." code needed, in which case it returns it
    var fn_start = ""
    if(always_add_function_header || (ab.input_names.length == 0)){
        ab.window_name = vals.window_name
        fn_start = "function " + ab.clean_name(vals.window_name) + "(){ //window \n" +
                   "    show_window({content:`\n"
    }
    return fn_start
}


ab.insert_etc = function(pure_code, code, vals, can_have_action){
    Editor.insert(code)
    ab.has_items = true //includes not just inputs but static text too. important to know that "something's been added"
    var inp_name = vals.input_name
    if (vals.clicked_button_value != "Button"){
        inp_name = ab.clean_name(inp_name)
    }
    var elt_to_add_to_input_names = inp_name //ab.clean_name(vals.input_name)
    if (!can_have_action){
        elt_to_add_to_input_names = [elt_to_add_to_input_names, "cant_have_action"]
    }
    ab.input_names.push(elt_to_add_to_input_names)
    //dex.train_number_of_insertions += 1 //the next index
   //dex.train_action_name_to_pure_code[clean_action_or_task_name(vals.action_name)] = pure_code //for Do action button
    //var action_options = ""
    //for(var act of dex.train_action_names){
    //    action_options += "<option>" + act + "</option>"
    //}
    //dex.set_in_window(vals.window_index, "do_action_action_names",      "innerHTML", action_options)
    //dex.set_in_window(vals.window_index, "repeat_from_action_names",    "innerHTML", action_options)
   // dex.set_in_window(vals.window_index, "repeat_through_action_names", "innerHTML", action_options)

    var new_input_name_default = "input_" + (ab.input_names.length + 1) //make this 1 based so that the instruction "click to add the 1st action ..." will make most sense.
    dex.set_in_window(vals.window_index, "input_name", "value", new_input_name_default)
    ab.replace_top_instruction_line(vals)
    ab.show_window(vals)
}

ab.code_for_handle_fn = function(vals) {
    var code = "function handle_" + vals.window_name + "_input(vals){\n"
    var cond_keyword = "if"
    //for (var inp_name of ab.input_names){
    for (var inp_name in ab.button_name_to_action_map){
        if (typeof(inp_name) == "string"){
            var inp_code = '    ' + cond_keyword + '(vals.clicked_button_value == "' + inp_name + '"){\n' +
                           '        ' + ab.button_name_to_action_map[inp_name] +
            '\n    }\n'
            code += inp_code
            cond_keyword = "else if"
        }
        //else inp_name looks like ["some_static_text_name", "cant_have_action"]
    }
    code += "}\n\n"
    return code
}


ab.replace_top_instruction_line = function(vals, text){
    if (text == null){
        var index = ab.input_names.length + 1
        var index_string =  integer_to_ordinal(index)
        text = "Click on a button below to add the " + index_string + " input to this window."
    }
    text = "<i>" + text + "</i>"
    dex.set_in_window(vals.window_index, "top_instruction_line", "innerHTML", text)
}



ab.fill_in_action_names = function(vals){ //just called by New task
    /* var task_options = ""
     for (var task of dex.train_task_names){ //train_task_names whne this is called in new Task,
     //has just been extended with vals.task_name but
     //don't worry about recursion because we are now
     //getting OUT of the cur task and into a new one.
     task_options += "<option value='" + task + "'/>"
     }
     dex.set_in_window(vals.window_index, "task_names_datalist", "innerHTML", task_options)
     */
    var new_val = ab.actions()
    dex.set_in_window(vals.window_index, "actions",       "combo_box_options", new_val)
    //dex.set_in_window(vals.window_index, "format_action", "combo_box_options", new_val)

}

ab.clean_name = function(name){
    name = name.trim()
    name = name.replace(/   /g, " ") //replace 3 spaces with 1
    name = name.replace(/  /g, " ")  //replace 2 spaces with 1
    name = name.replace(/ /g, "_")   //replace 1 space with underscore
    return name
}

ab.semi_clean_name = function(name){
    name = name.trim()
    name = name.replace(/   /g, " ") //replace 3 spaces with 1
    name = name.replace(/  /g, " ")  //replace 2 spaces with 1
    //name = name.replace(/ /g, "_")   //replace 1 space with underscore
    return name
}

//in sandbox
function handle_ab(vals){ //not dex.handle_train because then I can't use the name in the show_window 2nd arg.
    //don't insert fn_start UNTIL the user does the first real action insert, so as making canceling easier
    var can_have_action = true
    var always_add_function_head = false
    if (vals.clicked_button_value == "New line"){
        can_have_action = false
        var pure_code = '<br/>\n'
        var code      = ab.handle_fn_start(vals) + pure_code + "\n"
        ab.insert_etc(pure_code, code, vals, can_have_action)
    }
    else if (vals.clicked_button_value == "Horizontal line"){
        can_have_action = false
        var pure_code = '<hr/>'
        var code      = ab.handle_fn_start(vals) + pure_code + "\n"
        ab.insert_etc(pure_code, code, vals, can_have_action)
    }
    else if (vals.clicked_button_value == "Horizontal space"){
        can_have_action = false
        var pure_code = '<span style="margin-left:' + vals.horizontal_space_pixels + 'px;"/>'
        var code      = ab.handle_fn_start(vals) + pure_code + "\n" //"
        ab.insert_etc(pure_code, code, vals, can_have_action)
    }

    else if (vals.clicked_button_value == "Format"){
        var text
        if      (vals.format_kind == "static text"){
           can_have_action = false
           text = vals.format_text.replace(/\n/g, "<br/>")
        }
        else if (vals.format_kind == "bullet points"){
            can_have_action = false
            text = vals.format_text.replace(/\n/g, "</li><li>")
            text = "<ul><li>" + text + "</li></ul>"
        }
        else if (vals.format_kind == "numbered points"){
            can_have_action = false
            text = vals.format_text.replace(/\n/g, "</li><li>")
            text = "<ol><li>" + text + "</li></ol>"
        }
        else if (vals.format_kind == "table"){
            can_have_action = false
            text = vals.format_text.replace(/,\n/g, "\n") //remove extra comma at end of line so as to have a canonical format.
            if (text.endsWith(",")){ text = text.substring(0, text.length - 1)} //trailing comma is bad.
            text = text.replace(/\n/g, "</td></tr>\n<tr><td>")
            text = text.replace(/\,/g, "</td><td>")
            text = "<table>\n<tr><td>" + text + "</td></tr>\n</table>\n"
        }
        else if (vals.format_kind == "table: top row bold"){
            can_have_action = false
            text = vals.format_text.replace(/\,\n/g, "\n")
            if (text.endsWith(",")){ text = text.substring(0, text.length - 1)} //trailing comma is bad.
            var first_return_pos = text.indexOf("\n")
            var first_row = ""
            var other_rows = ""
            if (first_return_pos == -1) {
                first_row = text
            }
            else {
                first_row  = text.substring(0, first_return_pos)
                other_rows = text.substring(first_return_pos + 1)
            }
            first_row = "<table>\n<tr><th>" + first_row.replace(/\,/g, "</th><th>") + "</th></tr>\n"
            if (other_rows != ""){
                 other_rows = other_rows.replace(/\n/g, "</td></tr>\n<tr><td>")
                 other_rows = "<tr><td>" + other_rows.replace(/\,/g, "</td><td>") + "</td></tr>\n"
            }
            text = first_row + other_rows + "</table>\n"
        }
        else if (vals.format_kind == "table: 1st row & col bold"){
            can_have_action = false
            text = vals.format_text.replace(/\,\n/g, "\n")
            if (text.endsWith(",")){ text = text.substring(0, text.length - 1)} //trailing comma is bad.
            var first_return_pos = text.indexOf("\n")
            var first_row = ""
            var other_rows = ""
            if (first_return_pos == -1) {
                first_row = text
            }
            else {
                first_row  = text.substring(0, first_return_pos)
                other_rows = text.substring(first_return_pos + 1)
            }
            first_row = "<table>\n<tr><th>" + first_row.replace(/\,/g, "</th><th>") + "</th></tr>\n"
            if (other_rows != ""){
                other_rows = other_rows.replace(/\n/g, "</td></tr>\n<tr><td>")
                other_rows = "<tr><td>" + other_rows.replace(/\,/g, "</td><td>") + "</td></tr>\n"
                other_rows = other_rows.replace(/<tr><td>/g, '<tr><td style="font-weight:700;">') //this is the only thing diferent (added) from the "table: top row bold" def
            }
            text = first_row + other_rows + "</table>\n"
        }
        else if (vals.format_kind == "single_line_input"){
            text = vals.input_name + ': <input name="'        + vals.input_name +
                        '" value="'       + vals.format_text +
                        '" style="width:' + vals.format_text_width + ";" +
                   '"/>'
        }
        else if (vals.format_kind == "multi_line_input"){
            text = '<textarea name="' + vals.input_name +
                   '" style="width:'  + vals.format_text_width  + "; " +
                           "height:"  + vals.format_text_height + ";"  +
                '">'                  + vals.format_text + "</textarea>"
        }
        else if (vals.format_kind == "radio buttons"){
            var lines = vals.format_text.split("\n")
            text = ""
            for (var line of lines){
                var sel = ""
                if (line.endsWith("selected")){
                    sel = " checked" //radio and checkbox need "checked" but select tag needs "selected". HTML was not designed. I make them all consistent with "selected"
                    line = line.substring(0, line.length - 8)
                }
                line = line.trim()
                var but = '<input name="'    + vals.input_name +
                    '" type="radio" value="' + line +
                    '"'   + sel +
                    '/>' +
                    line + "&nbsp;\n"
                text += but
            }
        }
        else if (vals.format_kind == "select"){
            var lines = vals.format_text.split("\n")
            text  = '<select name="'  + vals.input_name +
                        '" style="width:' + vals.format_text_width + ";" +
                        '">\n'
            for (var line of lines){
                var sel = ""
                if (line.endsWith("selected")){
                    sel = " selected" //radio and checkbox need "checked" but select tag needs "selected". HTML was not designed. I make them all consistent with "selected"
                    line = line.substring(0, line.length - 8)
                }
                line = line.trim()
                var but = '<option ' +
                    'value="' + line +
                    '"'   + sel +
                    '>'   +
                    line  + "</option>\n"
                text += but
            }
            text += "</select>\n"
        }
        else if (vals.format_kind == "combo box"){
            var lines = vals.format_text.split("\n")
            text  = '<div class="combo_box" name="' + vals.input_name +
                        '" style="display:inline-block;vertical-align:middle;width:' + vals.format_text_width + ";"  +
                        '">\n'
            for (var line of lines){
                var sel = ""
                if (line.endsWith("selected")){
                    sel = " selected" //radio and checkbox need "checked" but select tag needs "selected". HTML was not designed. I make them all consistent with "selected"
                    line = line.substring(0, line.length - 8)
                }
                line = line.trim()
                var but = '<option ' +
                    'value="' + line +
                    '"'   + sel +
                    '>'   +
                    line  + "</option>\n"
                text += but
            }
            text += "</div>\n"
        }
        else if (vals.format_kind == "details hierarchy"){
            can_have_action = false //turns off saving of clicking on the menu title, but not the underlying  items.
            if(vals.format_text.length == 0){
                out("No text in the textarea to make a details hierarchy out of.", "red")
                return
            }
            else{
                text = dex.make_details_items(0, 0, vals.format_text.split("\n"))
            }
        }
        else if (vals.format_kind == "menu"){
            can_have_action = false //turns off saving of clicking on the menu title, but not the underlying  items.
            text = '<div class="menu" style="display:inline-block;">\n<ul><li>' + vals.input_name + "&#9660;\n"
            /*text = text + "<ul>\n"
            for (var item of vals.format_text.split("\n")){
                text += "<li>" + item + "</li>\n"
            }
            text = text + "</ul>\n"*/
            if (vals.format_text != ""){ //because split of empty string returns [""] ie 1 item
                always_add_function_head = (ab.input_names.length == 0) //only needed for menu because make_menu_items adds to input_names
                text += dex.make_menu_items(0, 0, vals.format_text.split("\n"), vals.actions)
            }
            text += "</li></ul>\n</div>"
        }
        var font_weight = 200
        var font_style  = "normal" //could be italic
        if (vals.font_style == "bold") { font_weight = 700 }
        else if (vals.font_style == "italic"){ font_style = "italic" }
        var pure_code = '<span style="font-size:'   + vals.font_size   + "px; " +
                                     "font-family:" + vals.font_family + "; " +
                                     "font-style:"  + font_style       + "; " +
                                     "color:"       + vals.font_color  + "; " +
                                     "font-weight:" + font_weight      + ';">\n' +
                                text + '</span>' //todo fails to set color, etc of menu items.
        var code      = ab.handle_fn_start(vals, always_add_function_head) + pure_code + "\n"
        ab.insert_etc(pure_code, code, vals, can_have_action)
    }
    else if (vals.clicked_button_value == "Button"){
        var name = ab.semi_clean_name(vals.input_name) //dontreplace single spaces with underscore
        vals.input_name = name
        ab.button_name_to_action_map[vals.input_name] = vals.actions
        var kind = vals.button_kind
        var pure_code
        if (kind == "close window"){
           pure_code = '<input type="submit" value="' + vals.input_name + '"/>'
        }
        else if (kind == "don't close"){
           pure_code = '<input type="button" value="' + vals.input_name + '"/>'
        }
        else if (kind == "underlined link") {
            var href_val = "#"
            var act = vals.actions
            if (act.indexOf("(") == -1){ //assume action is a url
                href_val = act
            }
           pure_code = '<a href="' + href_val + '" name="' + vals.input_name + '">' + vals.input_name + '</a>'
        }
        var code = ab.handle_fn_start(vals) + pure_code + "\n"
        ab.insert_etc(pure_code, code, vals, can_have_action)
    }
    else if (vals.clicked_button_value == "Number"){
        //infer optimal width by looking at initial, min and max. a min or max is more important than initial for determining width
        var most_chars   = 1
        var any_non_nans = false
        var initial_only = false
        var val = vals.number_initial
        var str
        if (val) {
            str = val.toString()
            most_chars = Math.max(most_chars, str.length)
            any_non_nans = true
            initial_only = true
        }
        val = vals.number_min
        if (val) {
            str = val.toString()
            most_chars = Math.max(most_chars, str.length)
            any_non_nans = true
            initial_only = false
        }
        val = vals.number_max
        if (val) {
            str = val.toString()
            most_chars = Math.max(most_chars, str.length)
            any_non_nans = true
            initial_only = false
        }
        val = vals.number_step
        if (val) {
            str = val.toString()
            if (str.indexOf(".") != -1) { most_chars += (str.length - 1) } //got decimal points. Not perfect but will get us closer.
        }
        if      (initial_only)  {most_chars = most_chars + 3} //will be at least 4 giving us -999 thru 9999
        else if (!any_non_nans) {most_chars = 5 }
        var width = 15 + (most_chars * 7) //the widget takes up a certain constant amount of pixels
        var pure_code = vals.input_name + '<input type="number'             +
                    '" name="'  + vals.input_name     +
                    '" value="' + vals.number_initial +
                    '" min="'   + vals.number_min     +
                    '" max="'   + vals.number_max     +
                    '" step="'  + vals.number_step    +
                    '" style="width:' + width + 'px;"/>'
        var code = ab.handle_fn_start(vals) + pure_code + "\n"
        ab.insert_etc(pure_code, code, vals, can_have_action)
    }
    else if (vals.clicked_button_value == "Checkbox"){
        var checked = ""
        if (vals.checkbox_checked) { checked = ' checked="checked"' }
        var pure_code = '<input name="' + vals.input_name  +
                         '" ' + 'type="checkbox"' + checked + "/>" + vals.input_name
        var code = ab.handle_fn_start(vals) + pure_code + "\n"
        ab.insert_etc(pure_code, code, vals, can_have_action)
    }
    else if (vals.clicked_button_value == "Color"){
        var pure_code = vals.input_name +
                       ': <input name="' + vals.input_name  +
                       '" ' + 'type="color" ' +
                       'value="' + vals.color_color + '"/>'
        var code = ab.handle_fn_start(vals) + pure_code + "\n"
        ab.insert_etc(pure_code, code, vals, can_have_action)
    }
    else if (vals.clicked_button_value == "Datetime"){
        var pure_code
        if (vals.datetime_type == "year"){
            pure_code = vals.input_name +
                ': <input name="' + vals.input_name  +
                '" ' + 'type="number" ' +
                'value="' + new Date().getFullYear() +
                '" min="1900" max="2100">'
        }
        else {
            pure_code = vals.input_name +
                ': <input name="' + vals.input_name  +
                '" type="' + vals.datetime_type      +
                '"/>'
        }
        var code = ab.handle_fn_start(vals) + pure_code + "\n"
        ab.insert_etc(pure_code, code, vals, can_have_action)
    }
    //______________________________________________
    else if (vals.clicked_button_value == "Undo"){
        if (ab.input_names.length == 0){
            out("Sorry, there are no more input items<br/>in the currently being made window to undo.",
                "red")
        }
        else {
            var last_input_name = ab.input_names.pop()
            if (Array.isArray(last_input_name)){
                last_input_name = last_input_name[0]
            }
            delete ab.button_name_to_action_map[last_input_name]
            Editor.undo()
            dex.set_in_window(vals.window_index, "input_name", "value", last_input_name)
            //tricky figuring out what should go in the window's input name.
            //consier hitting undo twice in a row.
            //we like undo to leave the window in a state where we can click, say
            //format button and have it do the same thing that you undid. (if it was added with format)
            ab.replace_top_instruction_line(vals)
            ab.show_window(vals)
        }
    }
    else if (vals.clicked_button_value == "Show Window"){
        ab.show_window(vals)
    }
    else if (vals.clicked_button_value == "New Window"){
        if (ab.input_names.length > 0){ //otherwise we haven't made a real window so insert nothing as user was probably "just looking".
            Editor.close_app_builder_temp_windows()
            var win_name = ab.clean_name(vals.window_name)
            var finish_win_code = dex.code_to_finish_window(vals)
            var the_call = "// " + win_name  + "() //eval to launch this window\n\n"
            Editor.insert(finish_win_code + the_call)
            //Editor.insert(win_name  + "() //eval to launch this window\n\n")
            var handle_fn_code = ab.code_for_handle_fn(vals)
            Editor.insert_before_fn_def(win_name, handle_fn_code)
            ab.window_names.push(win_name)
        }
        ab.launch()
    }
    else if (vals.clicked_button_value == "Done"){
        if (ab.input_names.length > 0){ //otherwise we haven't made a real window so insert nothing as user was probably "just looking".
            Editor.close_app_builder_temp_windows()
            var win_name = ab.clean_name(vals.window_name)
            var finish_win_code = dex.code_to_finish_window(vals)
            var the_call = win_name  + "() //eval to launch this window\n\n"
            Editor.insert(finish_win_code + the_call)
            //Editor.insert(win_name  + "() //eval to launch this window\n\n")
            var handle_fn_code = ab.code_for_handle_fn(vals)
            Editor.insert_before_fn_def(win_name, handle_fn_code)
            ab.window_names.push(win_name)
        }
    }
}

ab.show_window = function (vals){
    var handle_fn_code = ab.code_for_handle_fn(vals)
    var end_main_fn_code = dex.code_to_finish_window(vals)
    var win_name = vals.window_name
    if (ab.input_names.length == 0){
        //out("You haven't declared any window parts yet so there's nothing to show.")
        Editor.close_app_builder_temp_windows() //might be none open which is ok
        var start_main_fn_code = "function " + win_name + "(){" +
            "show_window({window_class:'app_builder_temp_window', content:`"
        var the_call = win_name + "()"
        var full_code = handle_fn_code + start_main_fn_code + end_main_fn_code + the_call
        eval(full_code)
    }
    else {
        Editor.run_unfinished_app_builder_window(win_name, handle_fn_code, end_main_fn_code)
    }
}

//in sandbox
//makes a forrest of details
dex.make_details_items = function(level, index, all_lines){
    var result = ""
    if (all_lines.length == index){
        return ""
    }
    var this_level_ul_spaces = spaces((level * 4) + 2)
    var this_level_li_spaces = spaces((level + 1) * 4)
    result = "" //this_level_ul_spaces + "<ul>\n"
    for (var i = index; i < all_lines.length; i++){
        index = i
        var line = all_lines[i]
        var line_indent = dex.initial_spaces(line)
        if (line_indent == -1) {} //skip it
        else if (line_indent < level) {
            return result
        }
        else if (line_indent > level){
            var sub_results = dex.make_details_items(level + 1, i, all_lines)
            var menu_items_processed_count = sub_results.match(/margin-left\:/g).length
            i = i + menu_items_processed_count - 1
            result += sub_results  + this_level_li_spaces + "</details>\n"
        }
        else{
            var line_trimmed = line.trim()
            var margin_left = 20
            if(level == 0) {margin_left = 0}
            var new_item = ""
            if (index == (all_lines.length - 1)) { //on the last line
                new_item = this_level_li_spaces + '<div style="margin-left:' + margin_left + 'px;">&#9679; ' + line_trimmed + "</div>\n"
            }
            else if (dex.initial_spaces(all_lines[index + 1]) <= level){ //the next line is either at the same level as this one or up level(s)
                new_item = this_level_li_spaces + '<div style="margin-left:' + margin_left + 'px;">&#9679; ' + line_trimmed + "</div>\n"
            }
            else {//recursing down a level on next iteration.
                new_item = this_level_li_spaces + '<details style="margin-left:' + margin_left + 'px;"><summary>' + line_trimmed + "</summary>\n"
            }
            result += new_item
            /*var new_item = this_level_li_spaces + '<details style="margin-left:' + margin_left + 'px;"><summary>' + line_trimmed + "</summary>\n"
            if (index == (all_lines.length - 1)) { //on the last line
                new_item += this_level_li_spaces + "</details>\n"
            }
            else if (dex.initial_spaces(all_lines[index + 1]) <= level){ //the next line is either at the same level as this one or up level(s)
                //if we have to recurse down a level on the next interation, then we must
                //leave the closing </li> tag off, otherwise, as in this case, put it on.
                new_item += this_level_li_spaces + "</details>\n"
            }
            else { //recursing down a level on next iteration. new item is '<li> foo' with no closing </li>
                //new_item += "\n"
            }
            result += new_item
            */
        }
    }
    return result //+ //"\n" +this_level_ul_spaces + "</ul>\n"
}

//in sandbox
dex.make_menu_items = function(level, index, all_lines, action_for_all_items){
    var result = ""
    if (all_lines.length == index){
        return ""
    }
    var this_level_ul_spaces = spaces((level * 4) + 2)
    var this_level_li_spaces = spaces((level + 1) * 4)
    result = this_level_ul_spaces + "<ul>\n"
    for (var i = index; i < all_lines.length; i++){
        index = i
        var line = all_lines[i]
        var line_indent = dex.initial_spaces(line)
        if (line_indent == -1) {} //skip it
        else if (line_indent < level) {
            return result
        }
        else if (line_indent > level){
            var sub_results = dex.make_menu_items(level + 1, i, all_lines, action_for_all_items)
            var menu_items_processed_count = sub_results.match(/<li>/g).length
            i = i + menu_items_processed_count - 1
            result += sub_results  + this_level_li_spaces + "</li>\n"
        }
        else{
            var line_trimmed = line.trim()
            var new_item = this_level_li_spaces + "<li>" + line_trimmed
            ab.input_names.push(ab.clean_name(line_trimmed))
            ab.button_name_to_action_map[line_trimmed] = action_for_all_items
            if (index == (all_lines.length - 1)) { //on the last line
                new_item += "</li>\n"
            }
            else if (dex.initial_spaces(all_lines[index + 1]) <= level){ //the next line is either at the same level as this one or up level(s)
                //if we have to recurse down a level on the next interation, then we must
                //leave the closing </li> tag off, otherwise, as in this case, put it on.
                new_item += "</li>\n"
            }
            else { //recursing down a level on next iteration. new item is '<li> foo' with no closing </li>
               new_item += "\n"
            }
            result += new_item
        }
    }
    return result + //"\n" +
           this_level_ul_spaces + "</ul>\n"
}

dex.initial_spaces = function(a_string){
    for (var i = 0; i < a_string.length; i++){
        if (a_string[i] != " "){
            return i
        }
    }
    return -1 //means an empty line or a line of all spaces, either way we want to throw it out.
}

//returns a string that contains all the window options (besides content), the closing of the call to show_window and its wrapper fn,
//and the new handle_fn def.
//does not include example call to launch the window, nor does it push the window_name onto window_names.
//Thus the code is useful for "Done", "New Window" and "Show Window".
dex.code_to_finish_window = function(vals){
    var win_name = ab.clean_name(vals.window_name)
    var suffix = "`,\n"
    suffix +=  '    title: "' + vals.window_name + '",\n' //do not clean, we want the spaces here.
    if (vals.x      != 200){ suffix += "    x: "      + vals.x      + ',\n' }
    if (vals.y      != 200){ suffix += "    y: "      + vals.y      + ',\n' }
    if (vals.width  != 400){ suffix += "    width: "  + vals.width  + ',\n' }
    if (vals.height != 400){ suffix += "    height: " + vals.height + ',\n' }

    if (vals.is_modal              != false){ suffix += "    is_modal: "             + vals.is_modal      + ',\n' }
    if (vals.show_close_button     != true ){ suffix += "    show_close_button: "    + vals.show_close_button      + ',\n' }
    if (vals.show_collapse_button  != true ){ suffix += "    show_collapse_button: " + vals.show_collapse_button      + ',\n' }
    if (vals.trim_strings          != true ){ suffix += "    trim_strings: "         + vals.trim_strings      + ',\n' }

    if (vals.background_color      != "#EEEEEE" ){ suffix += '    background_color: "' + vals.background_color      + '",\n' }

    suffix +=  "    callback: handle_" + win_name + "_input})}\n\n"
    //var handle_fn_code = ab.code_for_handle_fn(vals)
    return suffix //+ handle_fn_code
}

//var index_for_window_default_name = 0 //must be here for ui env, can't use length of tasks becaue that's in snadvox

ab.launch = function(){ //happens in ui env, called from Insert menu item when user chooses "build applicaiton" item
    ab.init()
    //index_for_window_default_name += 1
    var window_name = "window_" //+ index_for_window_default_name //this is inited by ab.post_creation_window_init
    show_window({content:
`<div style="font-size:12px;margin-bottom:5px;" name="top_instruction_line"><i>Click on a button below to add the first input to this window.</i></div>
    <span style="margin-bottom:10px;" title="Window Name must be unique\nin this DDE session.\nSet only before first button click.">Window Name: </span>
    <input type="text" name="window_name" value="`+ window_name + `" style="width:100px;margin-bottom:15px;"/> &nbsp;
    <span title="Input Name must be unique\nin this window.">Input Name: </span>
    <input type="text" name="input_name" value="input_1"  style="width:100px;"/><br/>
    <input title="Insert a new line\nforcing the next insertion\nto start a new row." type="button" value="New line" style="margin-bottom:10px;"/>&nbsp;&nbsp;
    <input title="Insert a horizontal line\naccross the window being made.\nThe next insertion will start a new row." type="button" value="Horizontal line"/>&nbsp;&nbsp;
    <input title="Insert horizontal space\nso that the next insertion\nwill be to the right\nby the given pixels." type="button" value="Horizontal space"/>
        <input name="horizontal_space_pixels" type="number" min-value="0" value="20" style="width:32px;"/> pixels<br/>
    <input type="button" value="Button" style="margin-right:20px;margin-bottom:10px;" title="Create a button.\nThe selected action will be run\nwhen the button is clicked."/>
    Action: <div name="actions" class="combo_box" style="display:inline-block;vertical-align:middle;"> </div>
      <select name="button_kind">
        <option title="When the button is clicked,\nthe window closes and\nthe action is run.">close window</option>
        <option title="When the button is clicked,\nthe action is run.\nThe window does not close.">don't close</option>' +
    '   <option title="Creates an HTML A tag.\nDoes not close window when clicked.\nThe action can be a regular function call,\nbut if its a url, that page will be opened.">underlined link</option>' +
    '</select>
    <br/>
    <input type="button" value="Format" style="vertical-align:middle;margin-right:20px;margin-bottom:0px;" title="Add formatted text or an input control\nto the window being made."/>
    <textarea name="format_text" style="vertical-align:middle;margin-right:20px;margin-bottom:5px;width:50px;height:26px;"
              title="Enter text to be added.\nDrag lower right corner to make bigger.\nWhen Google fixes their bug,\nyou'll be able to make it smaller too.">
    </textarea><br/>
            <table style="margin-bottom:10px;">
            <tr><td title="Select the kind of formatting or\ninput control to insert.">Kind</td>
                <td title="Choose the font size of the text\nto be inserted.">Size</td>
                <td title="Click below to select a color\nof the text to be inserted." >Color</td>
                <td title="Choose the font family of the text\nto be inserted.">Family</td>
                <td title="Select the font style of the text\nto be inserted.">Style</td></tr>
                <tr><td><select name="format_kind" style="width:130px;">
                            <option title="The text in the above textarea\nwill be inserted in the window,\npreserving line breaks.">static text</option>
                            <option title="A bullet point is made\nfor each line in the textarea.">bullet points</option>
                            <option title="A numbered point is made\nfor each line in the textarea.">numbered points</option>
                            <option title="Each textarea line becomes a table row.\nCells in a row\nare separated by commas.">table</option>
                            <option title="The top row of the table\n(column headings)\nis in bold.">table: top row bold</option>
                            <option title="The top row and left column of the table\nis in bold.">table: 1st row & col bold</option>
                            <option title="Make an expandable hierarchy\nwith 1 row per textarea line.\nIntent each line one space per level.">details hierarchy</option>
                            <option title="Static text above,\ninputs below.">______________________</option>
                            <option title="Let user input 1 line of text.\nDrag textarea to the width\nyou want this input to be.">single_line_input</option>
                            <option title="Let user input multiple lines of text.\nDrag textarea to the size\nyou want this input to be.">multi_line_input</option>
                            <option title="Each line of the text area makes a radio button.\nA line ending in 'selected'\nwill be initially selected.">radio buttons</option>
                            <option title="Make an HTML 'select' input\nwith an option for each line in the textarea.\nA line ending in 'selected'\nwill be initially selected.">select</option>
                            <option title="Make an input that has options to select\nas well as allowing type-in.\nEach line in the textarea is an option.\nA line ending in 'selected'\nwill be initially selected.">combo box</option>
                            <option title="Make a hierarchical menu\nwith one item per textarea line.\nIndent textarea lines\nby 1 space for sub-menus.">menu</option>
                     </select></td>
        <td><input name="font_size" type="number" value="18" min="4" max="99"/></td>
                <td><input name="font_color" type="color" value="#000000" style="width:30px;"></input></td>
                <td><select name="font_family" style="width:90px;">
                                               <option>serif</option>
                                               <option>sans-serif</option>
                                               <option>monospace</option>
                                               <option>cursive</option>
                                               <option>fantasy</option>
                                               <option>Comic Sans MS</option>

        </select></td>
                <td><select name="font_style"><option>plain</option>
                                              <option>bold</option>
                                               <option>italic</option>
                    </select></td>
                <!--<td> <div name="format_action" class="combo_box" style="display:inline-block;vertical-align:middle;"> </div></td>-->
            </tr>
            </table>
     <input title="Insert a control for entering a number\nthat is not less than 'Min',\nnot more than 'Max',\nwith a resolution of 'Step'."
            type="button" value="Number" style="margin-bottom:10px;"/>
        Initial: <input name="number_initial" type="number" style="width:40px"/>
            Min: <input name="number_min"     type="number" style="width:40px"/>
            Max: <input name="number_max"     type="number" style="width:40px"/>
           Step: <input name="number_step"    type="number" style="width:40px""/><br/>
    <input title="Insert a checkbox with the selected initial state." type="button" value="Checkbox" style="margin-bottom:10px;"/>
        Initially: <input type="checkbox"  name="checkbox_checked"/>&nbsp;&nbsp;
    <input title="Insert a control for selecting a color\nwith the initial chosen color." type="button" value="Color"/>
        Initially: <input name="color_color" type="color"/><br/>
    <input title="Insert a control for choosing\na time, day, month, etc." type="button" value="Datetime"/> of type:
            <select name="datetime_type">
                <option>time</option>
                <!-- <option>datetime</option> not supported by chrome and maybe wc3-->
                <option>datetime-local</option>
                <option>date</option>
                <option>week</option>
                <option>month</option>
                <option>year</option>
            </select>

        <fieldset style="margin-bottom:10px;"> <legend>Window Options</legend>
        <table style="border:None;">
                <tr><td style="border:None;" title="The distance in pixels from\nthe left DDE window border\nto the window being made.">x     </td><td style="border:None;"><input name="x"      type="number" min="0"  max="2000" value="200"/> </td><td style="border:None;"><input style="margin-left:30px;" name="is_modal" type="checkbox"/><span title="If checked, the user of the window\nwill not be able to click outside of it\nuntil it is closed.">is_modal</span>&nbsp;&nbsp;&nbsp; <span title="The window's background color.">bg_color: </span><input name="background_color" type="color" value="#EEEEEE"/>         </td></tr>
                <tr><td style="border:None;" title="The distance in pixels from\nthe top of the DDE window\nto the window being made.">y     </td><td style="border:None;"><input name="y"      type="number" min="0"  max="2000" value="200"/> </td><td style="border:None;" title="If checked, the red close box\nin the upper right of the window\nwill be shown."><input style="margin-left:30px;" name="show_close_button" type="checkbox" checked="checked"/>show_close_button</td></tr>
                <tr><td style="border:None;" title="The distance in pixels from\n the left border of the window being made\nto its right border.">width</td><td style="border:None;"><input name="width"  type="number" min="10" max="2000" value="400"/> </td><td style="border:None;" title="If checked, the green arrow\nin the upper right of the window\nwill be shown."><input style="margin-left:30px;" name="show_collapse_button" type="checkbox" checked="checked"/>show_collapse_button</td></tr>
                <tr><td style="border:None;" title="The distance in pixels from\n the top of the window being made\nto its bottom.">height</td><td style="border:None;"><input name="height" type="number" min="10" max="2000" value="400"/> </td><td style="border:None;" title="If checked, the single-line and multi-lined inputs\nwill have whitespace removed from\nthe beignning and end of user input text."><input style="margin-left:30px;" name="trim_strings" type="checkbox" checked="checked"/>trim strings</td></tr>
        </table>
    </fieldset>


        <center>
        <input type="button" value="Undo"                                  title="Remove the last inserted input from the window definition."/>
        <input type="button" value="Show Window" style="margin-left:15px;" title="Show the window now being made."/>
        <input type="submit" value="New Window"  style="margin-left:15px;" title="Finish the window being made\nand start a new one."/>
        <input type="submit" value="Done"        style="margin-left:15px;" title="Complete the window being made\nand close this window."/>
        </center>
`,
    title: '<span title="Build the code for a window that becomes\nthe interface to an application.\nWrap it in a function that, when called,\nshows the window.">' +
           'Application Builder</span>',
    width:480,
    height:590,
    x:540, //x and y positioned so that if you shrink this window, it will as much as pssible not occlude the most useful DDE info.
    y:80,
    callback: handle_ab //"handle_ab"
})
    setTimeout(function(){ab.post_creation_window_init()}, 100) //needed to init the combo box for actions
}



