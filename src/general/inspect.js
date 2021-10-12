/** Created by Fry on 8/12/17*/

import {out_eval_result} from "../job_engine/core/out.js"
import {a_or_an, get_class_name,
       is_array_of_same_lengthed_arrays, is_class, is_literal_object,
       replace_substrings, shouldnt, typed_array_name}
        from "../job_engine/core/utils.js"
import {file_exists, make_full_path, read_file} from "../job_engine/core/storage.js"

var inspect_stacks = [] //Outer array has one array per inspector_display.
                        //the inner array is the objects displayed in that inspector
                        // in order. So first one is the original item that
                        //that inspector_display was created for.
                        //no primitiave items (numbers)are ever in since
                        //one will never be inspected at top level and
                        //there's never a link to one in a property being displayed
                        //in a compound object inspected.
                        // this just grows and grows as user inspects new objects. No gc until user
                        //clicks Output pane's Clear button.
                        //2D array where the outer array is the set of items
                        //that are viewed in a particular inspector.
                        //and the inner are the whole list of items you can get
                        //to with the forward and back arrows.
var inspect_stacks_positions   = [] //NOT NOW USED should always be the same length as inspect_stacks.
                                  //holds the index of the currently inspected elt
                                  //within all the 2nd level arrays within insepct_stacks

var inspect_stack_max_display_length = []  //a 2D array indexed by stack_number and in_stack_position
                                           //the inner array may be sparse. used for interactive display of
                                           //long arrays and objects with many properties

//called by je_and_browser_code.js, but just once.
export function init_inspect(){
    inspect_stacks             = []
    inspect_stacks_positions   = []
    inspect_stack_max_display_length = []
}

//called outside of file
export function inspect_is_primitive(item){
    const the_type = typeof(item)
    return ((item === undefined)    ||
            (item === null)         ||
            (the_type == "boolean") ||
            (the_type == "number")  ||
            (the_type == "string")  ||
            (item instanceof Date))
}

function make_inspector_id_string(stack_number, in_stack_position){
    return "inspector_" + stack_number + //"_" + in_stack_position +
           "_id"
}

//called outside of file
function inspect(item, src){
    if(src === undefined) {
        try { src = to_source_code({value: item})  } //might get into an infinite loop
        catch(err) { src = "" + item }
    }
    inspect_out(item, undefined, undefined, undefined, undefined, undefined, src)
    return "dont_print"
}

globalThis.inspect = inspect

//in_stack_position is the place where the ITEM will go.
//if in_stack_position is null, then use the length of inspect_stacks[stack_number]
//as the stack_postion of the new item, ie push it on the end.
//called by job.js
export function inspect_out(item, stack_number, in_stack_position, html_elt_to_replace, collapse=false, increase_max_display_length=false, src){
    if(!item && (item != 0) && (typeof(stack_number) == "number") && (typeof(in_stack_position) == "number")) {
          item = inspect_stacks[stack_number][in_stack_position]
    }
    else if (stack_number || (stack_number == 0)){
        if(!in_stack_position && (in_stack_position != 0)) {
            in_stack_position = inspect_stacks[stack_number].length
            inspect_stacks[stack_number].push(item)
        }
        else { //got all 3 of item, stack_number and in_stack_position, but are they consistent?
            const item_in_stack = inspect_stacks[stack_number][in_stack_position]
            if (item_in_stack === item) {} //yep. everything ok
            else { //nope, replace item_in_stack with item and get rid of trailing items on stack ie the "forward arrow items
                inspect_stacks[stack_number][in_stack_position] = item
                if (inspect_stacks[stack_number].length - 1 > in_stack_position){ //extra junk on end of stack to delete
                    inspect_stacks[stack_number].splice(in_stack_position + 1)
                }
            }
        }
    }
    else { //got item but no stack_number or in_stack_position
        stack_number = inspect_stacks.length
        in_stack_position = 0
        inspect_stacks.push([item])
        inspect_stack_max_display_length.push([])
    }
    inspect_stacks_positions[stack_number] = in_stack_position //but is this used anywhere?
    //now first 3 args all filled in and consistent
    let new_inspect_html = inspect_aux(item, stack_number, in_stack_position, increase_max_display_length)
    if (collapse) { //probably never hits
        const title_start = new_inspect_html.indexOf("<i>") + 3
        const title_end   = new_inspect_html.indexOf("</i>")
        const title = new_inspect_html.substring(title_start, title_end)
        new_inspect_html = "<details><summary>" + title + "</summary></details>"
    }
    if (html_elt_to_replace){
        //const inspect_elt = $(event.target).closest(".inspector")
        if(html_elt_to_replace === true){
            html_elt_to_replace = make_inspector_id_string(stack_number, in_stack_position)
        }
        if (typeof(html_elt_to_replace) == "string"){
            html_elt_to_replace = window[html_elt_to_replace]
        }
        $(html_elt_to_replace).replaceWith(new_inspect_html) } //must use query repalceWith here as regular DOM replaceWith doesn't work
    else {  out_eval_result(new_inspect_html, undefined, src) }
    return item
}

function looks_like_an_existing_file_path(item){
    return ((typeof(item) == "string") &&
            (item.length > 1) &&
            (file_exists(item)))
}

var inspect_2d = true //but changed by checking

function inspect_toggle_2d_checkbox(stack_number, in_stack_position){
    inspect_2d = event.target.checked //this will be the new, just clicked on, value  //!inspect_2d
    let item = inspect_stacks[stack_number][in_stack_position]
    inspect_out(undefined, //item will be looked up using stack_number, in_stack_position
                stack_number, in_stack_position,
                true // html_elt_to_replace, if true, computes the existing html elt and replaces it.
    )
}

function make_plot_button_html_maybe(stack_number, in_stack_position){
    let item = inspect_stacks[stack_number][in_stack_position]
    let result = ""
    if(window.Plot) {
        if(Plot.is_data_array_ok(item)) {
            result = " <button title='Show a graph of the array.'" +
                     " style='cursor:pointer;font-size:12px;padding:2px;height:20px;'" +
                     " onclick='Plot.show(undefined," +
                     " inspect_stacks[" + stack_number + "][" + in_stack_position + "])'>Plot</button>"
        }
        else if (item instanceof Job){
            result = " <button title='Show a graph of the Job move points.'" +
                     " style='cursor:pointer;font-size:12px;padding:2px;height:20px;'" +
                     " onclick='Plot.show(undefined," +
                     " inspect_stacks[" + stack_number + "][" + in_stack_position + "].three_d_points_for_plotting())'>Plot</button>" +

                     " <button title='Show graphs of all Jobs points.'" +
                     " style='cursor:pointer;font-size:12px;padding:2px;height:20px;'" +
                     " onclick='Plot.show(undefined," +
                     ` "Job")'>Plot Jobs</button>`
        }
    }
    return result
}

function inspect_aux(item, stack_number, in_stack_position, increase_max_display_length=false){
    // still causes jquery infinite error if the below is commented in.
    //if (typeof(new_object_or_path) == "string")  { return new_object_or_path }
    //else { return value_of_path(new_object_or_path) }
    const the_type = typeof(item)
    if(looks_like_an_existing_file_path(item)) { return inspect_one_liner_existing_file_path(item) }
    //if (inspect_is_primitive(item)) { return inspect_one_liner(item) }
    if ((the_type == "function") && !is_class(item) && (item !== Number)) {
         return inspect_one_liner_regular_fn(item) //just a twistdown with no links in it. So inspecting top level fn won't have the fwd and back arrows. that's ok
    }
    else { //we're making a full inspector with back arrow
        let result
        let title = ""
        let array_type = typed_array_name(item) //"Array", "Int8Array" ... or null
        let checkbox_2d_html_maybe = ""
        let plot_button_html_maybe = make_plot_button_html_maybe(stack_number, in_stack_position) //returns non-empty string for certain arrays, and all Job instances
        let div_id = make_inspector_id_string(stack_number, in_stack_position)
        let max_display_factor = (increase_max_display_length ? 4 : 1)
        //each clause below sets title and result
        if (inspect_is_primitive(item)) {
            let type = typeof(item)
            if (Number.isNaN(item)) { type = "(Not A Number) Number" }
            title = a_or_an(type, true) + " " + type
            result = inspect_one_liner(item)
        }
        else if (array_type){ //return "Array of " + item.length
            checkbox_2d_html_maybe =  ' &nbsp;<input id="inspect_2d_checkbox_id" type="checkbox"' +
                                      ' onchange="inspect_toggle_2d_checkbox(' + stack_number + ', ' + in_stack_position + ')" ' +
                                      (inspect_2d ? "checked" : "") +
                                      '/>2D'
            if (inspect_2d && is_array_of_same_lengthed_arrays(item)) { //2D arrays can't be "typed arrays"
                  //all elts of item are arrays, but they might be of different lengths.
                title = "A 2D Array of " + item.length + "x" + item[0].length
                result = inspect_format_2D_array(item)
            }
            else if (inspect_2d && is_array_of_similar_objects(item)) {
                title = "An Array of " + item.length + " Literal Objects"
                result = inspect_format_array_of_similar_objects(item, stack_number, in_stack_position) //, prop_name)
            }
            else {
                title = a_or_an(array_type, true) + " " + array_type + " of " + item.length
                result = "["
                //let max_display_factor = (increase_max_display_length? 2 : 1)
                let orig_array_max_display_length = inspect_stack_max_display_length[stack_number][in_stack_position]
                let new_array_max_display_length  = (orig_array_max_display_length ? orig_array_max_display_length * max_display_factor : 10)
                inspect_stack_max_display_length[stack_number][in_stack_position] = new_array_max_display_length
                for(let prop_name = 0; prop_name < item.length; prop_name++){
                    if(prop_name >= new_array_max_display_length) {
                        result += `<button style="font-size:12px;height:20px;padding:1px;" onclick="inspect_out(undefined, ` +
                                    stack_number      + ", " +
                                    in_stack_position + ", " +
                                    true              + `, false, true)">more...</button>`
                        break;
                    }
                    else {
                        let prefix = "&nbsp;"
                        if (prop_name == 0) { prefix = "" }
                        let prop_val = item[prop_name]
                        let prop_val_string = inspect_one_liner(prop_val, stack_number, in_stack_position, prop_name)
                        prop_val_string = inspect_prop_val_string_exceptions(item, prop_name, prop_val, prop_val_string)
                        result += prefix + "<i>" + prop_name + "</i>: " + prop_val_string + "<br/>\n"
                    }
                }
                result += "]"
            }
        }
        else if (item instanceof HTMLElement) {
            title = "An HTML DOM Element of " + item.tagName
            result = "{"
            //https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap
            let attrs = item.attributes
            for(let i = 0; i <attrs.length; i++){
                let attr = attrs[i]
                let prefix = "&nbsp;"
                if (i == 0) { prefix = "" }
                let prop_name = attr.name
                let prop_val  = attr.value
                //like array elements above:
                let prop_val_string = inspect_one_liner(prop_val, stack_number, in_stack_position, prop_name)
                prop_val_string = inspect_prop_val_string_exceptions(item, prop_name, prop_val, prop_val_string)
                result += prefix + "<i>" + prop_name + "</i>: " + prop_val_string + "<br/>\n"
            }
            /*var children_array = Array.prototype.slice.call( item.children ) //converts HTMLCollection into an array
            let prop_name = "children"
            let prop_val  = children_array
            //like array elements above:
            let prop_val_string = inspect_one_liner(prop_val, stack_number, in_stack_position, prop_name)
            prop_val_string = inspect_prop_val_string_exceptions(item, prop_name, prop_val, prop_val_string)
            result += "&nbsp;" + "<i>" + prop_name + "</i>: " + prop_val_string + "<br/>\n"
            */
            attrs = Array.prototype.slice.call( item.children ) //converts HTMLCollection into an array
            for(let i = 0; i < attrs.length; i++){
                let attr = attrs[i]
                let prop_name = "child " + i //attr.name
                let prefix = "&nbsp;"
                let prop_val  = attr
                //like array elements above:
                let prop_val_string = inspect_one_liner(prop_val, stack_number, in_stack_position, prop_name)
                prop_val_string = inspect_prop_val_string_exceptions(item, prop_name, prop_val, prop_val_string)
                result += prefix + "<i>" + prop_name + "</i>: " + prop_val_string + "<br/>\n"
            }
            result += "}"
        }
        else if ((the_type == "function") &&
                  out.constructor &&
                 (out.constructor.name == "Function") &&
                 !is_class(item) &&
                 (item !== Number)){//a regular function
            result = inspect_one_liner_regular_fn(item)
            //note that this title for a fn is probably never used since fns
            //are either handld outside the insepctor at top level or
            //are parts where you just twist them down and can't inspect them furter.
            //But the below "future proofs" the code
            let fn_name = item.name
            if (fn_name && (fn_name != "")) {
                title = "A Function named " + fn_name
            }
            else { title = "An Anonymous Function" }
        }
        else if (globalThis.cv && cv.Mat && Picture.is_mat(item)) { //if cv is not inited, cv.Mat === undefined. We must check for this, otherwise calling Picture.is_mat will error
            title = "OpenCV.js Mat"
            let type
            if(Picture.is_mat(item, "gray"))       { type = '"gray"' }
            else if (Picture.is_mat(item, "rgba")) { type = '"rgba"' }
            else if (item.channels == 1)           { type = "probably gray" }
            else                                   { type = "probably color"}
            result = "type: "      + type + ", " +
                     "width: "     + Picture.mat_width(item)  + ", " +
                     "height: "    + Picture.mat_height(item) + ", " +
                     "channels: "  + item.channels() +
                     " &nbsp;&nbsp;<button onclick='inspect_show_mat(" + stack_number + ", " + in_stack_position + ")'" +
                            "'>show picture </button><br/>" +
                     '<i>After clicking "show picture", click a pixel to see its details.</i>'
        }
        else { //not an array, not a fn
            result = "{"
            let prefix = ""
            if (Object.isNewObject(item)) { title = "A newObject named: " + item.name }
            else {
                let class_name = get_class_name(item)
                if (class_name) { title = "A Class named: " + class_name }
            }
            if (item.hasOwnProperty("name")){
                let prop_name = "name"
                let prop_value = item.name
                result += prefix + "<i>name</i>: "                + inspect_one_liner(prop_value, stack_number, in_stack_position, prop_name)        + "<br/>\n"
                prefix = "&nbsp;&nbsp;"
            }


            if (item.constructor && item.constructor.name){
                let prop_name  = "constructor"
                let prop_value = item.constructor
                if (prop_value == {}.constructor) { } //just don't show this as we'be probably just inspecting a {foo: 2, bar: 3} literal obj
                else {
                    let name = ((item.name) ? " named: " + item.name : "")
                    if(is_class(item.constructor)) {
                        prop_name = "class"
                        title = "A " + get_class_name(item.constructor) + name
                    }
                    else if (prop_value &&
                             prop_value.name &&
                             (title == "")) { //otherwise we don't give proper classes like Job a title of "A class ..."
                        title = "A " + prop_value.name + name
                    }
                    result += prefix + "<i>" + prop_name + "</i>: "   + inspect_one_liner(prop_value, stack_number, in_stack_position, prop_name) + "<br/>\n"
                    prefix = "&nbsp;&nbsp;"
                }
            }
            if (item.hasOwnProperty("prototype")){
                let prop_name = "prototype"
                const constructor_class_name = get_class_name(item.constructor)
                if(constructor_class_name) { prop_name = constructor_class_name }
                let prop_value = item.prototype

                //if(title == "") { title = "A " + prop_name }
                result += prefix + "<i>" + prop_name + "</i>: "   + inspect_one_liner(prop_value, stack_number, in_stack_position, prop_name)   + "<br/>\n"
                prefix = "&nbsp;&nbsp;"
            }
            //https://stackoverflow.com/questions/30881632/es6-iterate-over-class-methods
            let prop_names = Object.getOwnPropertyNames(item)
            if ((prop_names.length > 0) && (typeof(prop_names[0]) != "number")){ //don't sort if the array props are numbers.
                prop_names.sort()
            }
            let orig_array_max_display_length = inspect_stack_max_display_length[stack_number][in_stack_position]
            let new_array_max_display_length  = (orig_array_max_display_length ? orig_array_max_display_length * max_display_factor : 10)
            inspect_stack_max_display_length[stack_number][in_stack_position] = new_array_max_display_length
            for(let prop_index = 0; prop_index < prop_names.length; prop_index ++){
                if(prop_index >= new_array_max_display_length) {
                    result += `<button style="font-size:12px;height:20px;padding:1px;" onclick="inspect_out(undefined, ` +
                                    stack_number      + ", " +
                                    in_stack_position + ", " +
                                    true              + `, false, true)">more...</button>`
                    break;
                }
                else {
                      let prop_name = prop_names[prop_index]
                      if (!["prototype", "constructor", "name"].includes(prop_name)){ //item.hasOwnProperty(prop_name) &&
                        let prop_val = item[prop_name]
                        let prop_val_string
                        if(prop_val === item) { //happens when inspecting "window" and "global". gets into infinite loop so stop it
                            prop_val_string = "" + prop_val
                        }
                        else if(prop_val === window) {
                            prop_val_string = "" + prop_val
                        }
                        else {
                            prop_val_string = inspect_one_liner(prop_val, stack_number, in_stack_position, prop_name)
                            prop_val_string = inspect_prop_val_string_exceptions(item, prop_name, prop_val, prop_val_string)
                        }
                        if((item instanceof Dexter) && (prop_name === "robot_status") && Array.isArray(prop_val)) {
                            prop_val_string += " <button onclick='RobotStatusDialog.show(Dexter." + item.name + ")'>Robot Status Dialog</button>"
                        }
                        if ((prop_index == 0) && (typeof(prop_val) == "function")) {//due to weirdness in formatting details tags when expanded and when the first item is inside or {}. This is a workaround.
                              prefix = "<br/>" + "&nbsp;&nbsp;"
                        }
                        result += prefix + "<div style='display:inline-block; vertical-align:top;'><i>" + prop_name +
                                           "</i>:</div> "    + prop_val_string + "<br/>\n"
                            //(prop_val_string.startsWith("<details") ? "" : "<br/>") + "\n"
                        prefix = "&nbsp;&nbsp;"
                      }
                }
            }
            if (item == Job) {
                let prop_name = "Job instances"
                let prop_val  = Job.all_jobs()
                let prop_val_string = inspect_one_liner(prop_val, stack_number, in_stack_position, prop_name)
                result += "<br/>" + prefix + "<div style='display:inline-block; vertical-align:top;'><i>" + prop_name + "</i>:</div> "    + prop_val_string + "<br/>\n"
            }
            else if ([Robot, Brain, Serial, Dexter, Human].includes(item)) {
                let prop_name = "Robot instances"
                let prop_val  = Robot.all_robots()
                let prop_val_string = inspect_one_liner(prop_val, stack_number, in_stack_position, prop_name)
                result += "<br/>" + prefix + "<div style='display:inline-block; vertical-align:top;'><i>" + prop_name + "</i>:</div> "    + prop_val_string + "<br/>\n"
            }
            if (result.startsWith("{")) { result += "}" }
            if(title == "") { title = "An Object" + ((item.name) ? " named: " + item.name : "") + " of " + prop_names.length + " properties"}
        }
        let stack_len = inspect_stacks[stack_number].length
        let prev_opacity = (in_stack_position > 0) ? 1 : 0.3
        let next_opacity = ((in_stack_position < (stack_len - 1)) ? 1 : 0.3)
        let prev_id    = "inspect_previous_" + stack_number  //don't include in_stack_position
        let next_id    = "inspect_next_"     + stack_number  //don't include in_stack_position
        let refresh_id = "inspect_refresh_"  + stack_number
        result = "<div id='" + div_id + "' class='inspector' style='background-color:#ffd9b4;'>\n" +
            "&nbsp;<span             id='" + prev_id + "' title='Inspect previous value.' style='cursor:pointer;color:blue;font-weight:900; font-size:20px; opacity:"  + prev_opacity + ";'>&lt;</span>\n" +
            "&nbsp;&nbsp;&nbsp;<span id='" + next_id + "' title='Inspect next value.'     style='cursor:pointer;color:blue;font-weight:900; font-size:20px; opacity:"  + next_opacity + ";'>&gt;</span>\n" +
            //"<span id='" + refresh_id + "' style='cursor:pointer;padding-left:30px;font-size:20px;' title='refresh' >" + "&#10227;</span>\n" +
            "<button id='" + refresh_id + "' style='cursor:pointer;font-size:12px;padding:1px;height:20px;' title='refresh the data being inspected.' >Refresh</button>\n" +
            "<b style='padding-left:10px;'>INSPECTing<i> &nbsp;" + title + "</i></b> " + checkbox_2d_html_maybe + plot_button_html_maybe + "<br/>\n"  +
            result + "</div>"
        inspect_set_prev_onclick(   stack_number, in_stack_position, prev_id)
        inspect_set_next_onclick(   stack_number, in_stack_position, next_id)
        inspect_set_refresh_onclick(stack_number, in_stack_position, refresh_id)

        return result
        //setTimeout(function(){out(result, "black", true)}, 200) //give the regular return value
    //a chance to be rendered, so that the temp browser will be rendered AFTER it,
    //because otherewise the temp browser will be erased by the regular result output.
    //but beware, after the browser html is renderend, we need to set the onclicks,
    //which has a timeout too that must be longer than this timeout.
    }
}

function inspect_show_mat(stack_number, in_stack_position){
         let mat = inspect_stacks[stack_number][in_stack_position]
         Picture.show_picture({content: mat})
}

function inspect_one_liner(item, stack_number, in_stack_position, prop_name){
    const the_type = typeof(item)
    //onsole.log("inspect_one_liner got: " + prop_name + ": " + item) //will hang DDE if item is a very long array
    if (item === undefined)            { return "undefined" }
    else if (item === null)            { return "null" }
    else if (Number.isNaN(item))       { return "NaN" }
    else if (the_type === "boolean")   { return "" + item }
    else if (the_type === "number")    { return "" + item }
    else if (item instanceof Date)     { return item.toString() }

    else if (the_type === "string")     {
        //return JSON.stringify(item)
        //var quoting_char = '"'
        let str_length = item.length
        item = replace_substrings(item, "\n", "<br/>")
        var pos_of_br = item.indexOf("<br/>")
        if (pos_of_br !== -1) {
            var first_part = item.substring(0, pos_of_br)
            var body       = item.substring(pos_of_br + 5)
            body   = "<div style='display:inline-block;margin-left:17px;'>" + body + "</div>" //to indent by teh twist triangle
            result = "<details style='display:inline-block;'><summary>" +
                      "<i>String of " + str_length + "</i>: " +
                      first_part + "</summary>" + body + "</details>"
            return result
        }
        else { return "&quot;" + item + "&quot;" }// JSON.stringify(item) // json stringfy screws up
        //if the string being "stringifyed contains both single and double quotes.
        //but since we're returning html, we can use "&quot;" instead of the quteo marks.
        //now, in DDE_NPM.list,  when I wrap each array item in an A tag with an ooncluck fn
        //that has a lit string arg, I can win.
    }
    else if (the_type === "function")   {
        if (is_class(item)){
            return inspect_clickable_path(item, stack_number, in_stack_position, prop_name)
        }
        else { return inspect_one_liner_regular_fn(item) }
    }

    else if (Array.isArray(item))  {
       if (is_array_of_same_lengthed_arrays(item)) { return inspect_format_2D_array(item) }
       else return inspect_clickable_path(item, stack_number, in_stack_position, prop_name) +
                    inspect_extra_info(item)
    }
    else if (the_type === "object") { //handles the typeArray case but note, is same call as normal array
        let name_text = ""
        if(item.name && (item.name !== "")) { name_text = " name: " + item.name + " " } //really useful for Threejs Object3D and probably others
        else if(prop_name === "prototype") { name_text = "(click for instance methods)"} //when inspecting a class
        return inspect_clickable_path(item, stack_number, in_stack_position, prop_name) +
                 name_text +
                 ((prop_name === "prototype") ? "" : inspect_extra_info(item))
    }
    else { //hits with HTMLAllCollection
        return "cannot inspect: " + item
        //shouldnt("inspect_one_liner passed unhandled: " + item)
    }
}

function inspect_one_liner_regular_fn(item){
    //var bod_pos = result.indexOf("{")
    //result = replace_substrings(result, "\n", "<br/>")
    //result = replace_substrings(result, " ", "&nbsp;")
    let result = item.toString()
    result = replace_substrings(result, "<", "&lt;") //if I don't do this, fns with bodies containing tags
    //get rendered and that's wrong for viewing source code.
    var pos_of_br = result.indexOf("\n")
    if (pos_of_br == -1) { //the fn params and body all are on one line, no need for a twistdown
       return "<code style='background-color:transparent;'>" + result + "</code>"
    }
    else {
        var first_part = result.substring(0, pos_of_br)
        var body       = result.substring(pos_of_br + 1)
        //body   = "<div style='display:inline-block;margin-left:0px;'>" + body + "</div>" //to indent by teh twist triangle
        result = "<details style='display:inline-block;'><summary><code style='background-color:transparent;'>" +
            //"<i>String of " + item.length + "</i>: " +
            //can't get rid of the blank line beteeen the first part and the body so best to make the background color same as the inspector
            first_part + "</code></summary><pre style='margin:0;'><code style='background-color:transparent;'>" + body + "</code></pre></details>"
        return result
    }
    /*if (bod_pos.length <= 12) { //very little to go on. probably an anonymous fn with no args
     if (result.length > 25){ //shorten longer defs
     result = result.substring(0, 22) + "...}"
     }
     }
     else{ result = result.substring(0, bod_pos) + "{...}"  }//just show "function foo(a, b){...}"
     */
}

function inspect_insert_first_part_of_file(path){
    let the_file_content = read_file(path)
    if(the_file_content > 100000) {
        the_file_content = the_file_content.substring(0, 100000)
        warning("This file is more than 100,000 characters long.<br/>Only inserting the first 100,000 characters.")
    }
    Editor.insert(the_file_content)
}

function inspect_one_liner_existing_file_path(item){
    let orig_arg = item
    item = make_full_path(item)
    if(!file_exists(item)) {
        return orig_arg + " looks like a file path but couldn't find the file."
    }
    else if(is_folder(item)){
        return '"' + item + '" is a folder.'
    }
    else { //item is an existing file (not a folder)
       let the_file_content
       try{
           the_file_content = read_file(item)
       }
       catch(err){
           return "Could not read content of: " + item
       }
        the_file_content = replace_substrings(the_file_content, "<", "&lt;") //if I don't do this, fns with bodies containing tags
        let file_length = the_file_content.length
        let title_suffix = "&#013;This file has length: " + file_length
        if(file_length > 100000){
            the_file_content = "<i>length: " + file_length + " truncated for display to: " + 100000 + "</i><br/>" +
                         the_file_content.substring(0, 100000)
            title_suffix += "&#013;Only the first 100000 will be inserted."
        }
        let title = 'Insert the content of this file&#013;at the editor cursor.' + title_suffix
        let insert_button_html = `<button title='` + title + `' onclick='inspect_insert_first_part_of_file("` + item + `")'>Insert</button>`
        let first_part = "File: " + item + " length: " + file_length + " "  + insert_button_html
        result = "<details style='display:inline-block;'><summary><code style='background-color:transparent;'>" +
                //"<i>String of " + item.length + "</i>: " +
                //can't get rid of the blank line beteeen the first part and the body so best to make the background color same as the inspector
                first_part + "</code></summary><pre style='margin:0;'><code style='background-color:transparent;'>" + the_file_content + "</code></pre></details>"
        return result
    }
}

function inspect_extra_info(item){
    var info
    if (typed_array_name(item)){ //an array of some sort
       item = item.slice(0, 10) //just in case we have a really long array, don't want to have JSON.stringify try to make a super long string
       info = "["
       for(let i = 0; i < item.length; i++) {
           let elt = item[i]
           let elt_str = ""
           if(elt === null) { elt_str = "null" }
           else if(Number.isNaN(elt)) { elt_str = "NaN"} //because JSON.stringify prints NaN as "null"
           else if (typeof(elt) == "object"){
               let class_name = get_class_name(elt)
               if(class_name) { elt += class_name }
               else if ((elt.constructor) &&
                         elt.constructor.name &&
                         elt.constructor.name != ""){
                   elt_str += " " + elt.constructor.name
               }
               if(elt.name && (elt.name != "")) {
                   elt_str += " name: " + elt.name
               }
               if(elt_str == "") {
                   let prop_names = Object.getOwnPropertyNames(elt)
                   elt_str = "object with " + prop_names.length + " prop" + ((prop_names.length == 1) ? "": "s")
               }
           }
           else  {
               try { elt_str = JSON.stringify(elt) }
               catch { elt_str = "" }
           }
           if (i > 0) { info += ", " }
           info += elt_str
       }
       info += "]"
    }
    else if (window.Ammo && (item === Ammo)) { //because JSON.stringify(Ammo) causes infinite recursion
        info = "Ammo"
    }
    else {
        //console.log("non-array extra info: ") // + item)
        //info = "extra info cannot inspect"
        //causes infinit loop when inspecting window, but it must be some field within window, not window itself
        try{ info = JSON.stringify(item) } //JSON.stringify(Ammo) causes infinit loop so I must catch this above.
        catch(err) { return "" }
    }
    if (info.length > 55) {
        info = info.substring(0, 50) + " &nbsp;..."
        if      (info[0] == "{") { info += "}" }
        else if (info[0] == "[") { info += "]" }
    }
    return "&nbsp;&nbsp;" + info
}

function is_array_of_literal_objects(item) {
    if(!Array.isArray(item)) { return false }
    for(let elt of item) {
        if(!is_literal_object(elt)) { return false }
    }
    return true
}

function is_array_of_similar_objects(item){
    if(item.length < 2) { return false }
    else if (item.length >= 100) {return false} //too long array
    else if (!is_array_of_literal_objects(item)) { return false }
    let item_0_keys = Object.keys(item[0])
    if(item_0_keys.length > 20) { return false} // too wide of an object. cheap but probably mostly right.
    for(let key of Object.keys(item[0])) {
        if(item[1].hasOwnProperty(key)) { return true }//we have at least one key in item0 that is also in item 1 so good enough for our cheap similarlity test
    }
    return false
}

function inspect_format_array_of_similar_objects(item, stack_number, in_stack_position, prop_name){
    //first build our array of keys and which index each belongs in
    let key_to_index = {}
    let index_to_key = [] //will become our in-order column headers
    for(let obj of item){
        for(let key in obj){
            if(!key_to_index.hasOwnProperty(key)) {
                key_to_index[key] = index_to_key.length
                index_to_key.push(key)
            }
        }
    }
    //now build our data as a 2d array from all the objs in item
    let array_of_rows = [] //outer array is rows, 1 row per object
    for(let i = 0; i < item.length; i++){ // i is a row index
        let obj = item[i]
        let a_row = []
        for(let key in obj){
           let index_of_key = key_to_index[key]
           a_row[index_of_key] = obj[key] //shove in the value of the key into a_row. a_row is a sparse array
        }
        array_of_rows.push(a_row)
    }
    //make the HTML table column headers
    let the_html = "<table><tr><th></th>"
    for(let key of index_to_key) {
        the_html += "<th>" + key + "</th>"
    }
    the_html += "</tr>"
    //finally the body of the table
    for(let i = 0; i < array_of_rows.length; i++){
        let a_row_array = array_of_rows[i]
        let row_html = "<tr><td>" + i + "</td>"
        for(let val of a_row_array){
            row_html += "<td>" +
                         inspect_one_liner(val, stack_number, in_stack_position, prop_name)//((val === undefined) ? "" :  val) +
                        "</td>"
        }
        row_html += "</tr>"
        the_html += row_html
    }
    the_html += "</table>"
    return the_html
}

//item has at least 1 item in it which is an array.
function inspect_format_2D_array(item){
    let rows_count = item.length
    let cols_count = ((rows_count > 0) ? (item[0].length) : 0)
    let opennness_html = (((item.length > 10) || (cols_count > 6)) ? "" : " open ")
    let result = "<details " + opennness_html + " style='display:inline-block;'><summary>2D Array " + item.length + "x" + item[0].length + "</summary>\n"
    result += "<table>\n"
    for(let i = -1; i < item.length; i++){
        //let row = item[i]
        result += "<tr>"
        let row_length = ((i == -1) ? item[0].length : item[i].length)
        for(let j = -1; j < row_length; j++){
            let tag_start = "<td>"
            let tag_end   = "</td>"
            let content
            if ((i == -1) || (j == -1)) {
                tag_start = "<th style='background-color:#CCCCCC;'>";
                tag_end   = "</th>"
            }
            if(i == -1){
                if (j == -1) { content = "" } // upper left
                else         { content = j  }
            }
            else if(j == -1) { content = i  }
            else {
               let data = item[i][j]
                //content = (inspect_is_primitive(data) ? JSON.stringify(data) : ("" + data))
               if(inspect_is_primitive(data)) {
                   if(Number.isNaN(data)) { content = "NaN" }
                   else { content = JSON.stringify(data)}
               }
               else { content = "" + data }
            }
            result += tag_start + content + tag_end
        }
        result += "</tr>\n"
    }
    result += "</table></details>\n"
    return result
}

function inspect_prop_val_string_exceptions(container_object, prop_name, prop_val, prop_val_string){
    if(prop_name == "pitch") {
        if(typeof(prop_val) == "number") { return prop_val + " (" + Note.pitch_to_name(prop_val) + ")" }
        else { return prop_val_string }
    }
    else if ((container_object instanceof Job) && (prop_name == "do_list")){
        return container_object.do_list_to_html()
    }
    else if ((container_object instanceof Job) && (prop_name == "sent_instructions")){
        return Dexter.sent_instructions_to_html(prop_val)
    }
    else if ((container_object instanceof Job) && (prop_name == "rs_history")){
        return Dexter.make_show_rs_history_button_html2(container_object.job_id)
    }

    //else if ((typeof(prop_val) == "string") && Job[prop_val]) {
    //    return prop_val_string + ' &nbsp;&nbsp;<a href="#">Job.' + prop_val + "</a>"
    //}
    else { return prop_val_string }
}


//called for the parts of a inspector display that are themselves inspectable
function inspect_clickable_path(item, stack_number, in_stack_position, prop_name){
    let path
    let array_type = typed_array_name(item)
    if      (array_type)            { path = array_type + " of " + item.length } //handles regular arrays and typed arrays. Absolutely necessary for cv
    else if (item.objectPath && item.objectPath()) { path = item.objectPath() }
    else if (item instanceof Job)   { path = "Job." + item.name }
    else if (item instanceof Robot) { path = "Robot." + item.name }
    else {
        path = get_class_name(item)
        if (!path){
            if (item.constructor) { path = item.constructor.name }
        }
        if (!path) { path = "{...}" }
    }
    let id_string = "inspect_item_pos_" + stack_number + "_" + in_stack_position + "_" + prop_name
    let result = '<span id="' + id_string + '" style="cursor:pointer;color:blue; text-decoration:underline;">' + path + '</span>'
    inspect_set_onclick(item, stack_number, in_stack_position, id_string)
    return result
}

function inspect_set_onclick(item, stack_number, in_stack_position, id_string){
    setTimeout(function(){ //we need to wait until the html is actually rendered.
        let fn = function(event){
                    const html_elt_to_replace = $(event.target).closest(".inspector")
                    inspect_out(item, stack_number, in_stack_position + 1, html_elt_to_replace)
                 }
        let elts = window[id_string] //beware, if there's more than one elt with this id, we get an HTMlCollection of the etls.
        // this is a very broken data structure that I can't even test for except with length
        if (elts == undefined) {
            console.log("In inspect_set_onclick, didn't find: " +  id_string)
        }
        else if (elts.length){
            for(let i = 0; i < elts.length; i++) {
                elts[i].onclick = fn
            }
        }
        else { elts.onclick = fn } //only one
    }, 1000)
}

function inspect_set_prev_onclick(stack_number, in_stack_position, id_string){
    setTimeout(function(){ //we need to wait until the html is actually rendered.
        if (in_stack_position > 0) {
            let fn = function(event){
                const html_elt_to_replace = $(event.target).closest(".inspector")
                var new_in_stack_position = in_stack_position - 1
                inspect_out(null, stack_number, new_in_stack_position, html_elt_to_replace)
            }
            let elts = window[id_string] //beware, if there's more than one elt with this id, we get an HTMlCollection of the etls.
            // this is a very broken data structure that I can't even test for except with length
            if (elts == undefined) {
                shouldnt("In inspect_set_onclick, didn't find: " +  id_string)
            }
            else if (elts.length){
                for(let i = 0; i < elts.length; i++) {
                    elts[i].onclick = fn
                }
            }
            else { elts.onclick = fn } //only one
        }
    }, 1000)
}

function inspect_set_next_onclick(stack_number, in_stack_position, id_string){
    setTimeout(function(){ //we need to wait until the html is actually rendered.
            if((inspect_stacks.length > 0) && ((in_stack_position + 1) < inspect_stacks[stack_number].length)){
                let fn = function(event){
                    const html_elt_to_replace = $(event.target).closest(".inspector")
                    inspect_out(null, stack_number, in_stack_position + 1, html_elt_to_replace)
                }
                let elts = window[id_string] //beware, if there's more than one elt with this id, we get an HTMlCollection of the etls.
                // this is a very broken data structure that I can't even test for except with length
                if (elts == undefined) {
                    shouldnt("In inspect_set_onclick, didn't find: " +  id_string)
                }
                else if (elts.length){
                    for(let i = 0; i < elts.length; i++) {
                        elts[i].onclick = fn
                    }
                }
                else { elts.onclick = fn } //only one
            }
    }, 1000)
}

function inspect_set_refresh_onclick(stack_number, in_stack_position, id_string){
    let set_onclick_fn_fn = function(){ //we need to wait until the html is actually rendered.
            let onclick_fn = function(event){
                const html_elt_to_replace = $(event.target).closest(".inspector")
                inspect_out(null, stack_number, in_stack_position , html_elt_to_replace)
            }
            let elts = window[id_string] //beware, if there's more than one elt with this id, we get an HTMlCollection of the etls.
            // this is a very broken data structure that I can't even test for except with length
            if (elts == undefined) { //could legitimately happen if user has out put "code" checked, so just do nothing
                //shouldnt("In inspect_set_refresh_onclick, didn't find: " +  id_string)
            }
            else if (elts.length){
                for(let i = 0; i < elts.length; i++) {
                    elts[i].onclick = onclick_fn
                }
            }
            else { elts.onclick = onclick_fn } //only one
    }
    setTimeout(set_onclick_fn_fn, 1000)
}
