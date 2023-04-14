//failed import * as Mark from '../../node_modules/mark.js/dist/jquery.mark.es6.js' //todo using mark.js, mark.es6.js didn't work. From https://github.com/julmot/mark.js/issues/408 I got the trick of using the jquery version jquery.mark.js and maybe jquery.mark.es6.js but that doesn't work either
//import * as Mark from '../../node_modules/mark.js/dist/mark.es6.js' //todo ok on module path but "Mark" is not a constructor
import Mark from '../../node_modules/mark.js/dist/mark.es6.js'


// also note I'm using the latest version of mark.js (4 years old of 8.1.11) and still get errors
  //note that jquery is a DevDependency for mark.js so shouldn't be needed here.
import {Js_info}                 from "./js_info.js"

class DocCode {
    //these two referenced by ready.js, eval.js and doc_code.js
    static previous_active_element = null
    static selected_text_when_eval_button_clicked = ""

    //called for cmd input AND run instruction dialog run_src type in
    static onclick_for_click_help(event) {
        if(event.target.tagName == "SELECT") { return } //happens with SSH dir listing, when clicking on the dir or file menu in the output pane
        if($(event.target).closest(".inspector").length > 0){ //don't do regular on_click if inside an inspector
            //var elt = event.target  //; the click just go to the underlined item in the inspector
            return
        }
        if ($(event.target).closest("#temp").length > 0){ //we're in a temp, and if we have a selection, DON"T
          //give us click help on it because we want to select that thing, then use it in another operation
          //like Find or Eval or copy & paste. IF so, just do nothing.
          let sel = globalThis.getSelection()
          if(sel.toString().length != 0) { return }
          //else get click help on it, ie do the below.
        }
        //normal click help
        var full_src = event.target.value
        if (full_src) {
            if(typeof(full_src) == "string"){
                if(full_src.length > 0){
                    var pos = event.target.selectionStart
                    Editor.show_identifier_info(full_src, pos, event.target)
                }
            }
            //else do nothing
        }
        else {
            full_src = globalThis.getSelection().focusNode
            if ((typeof(full_src) == "object") && (full_src !== null) && full_src["data"]) {
                full_src = full_src.data
            }
            if (full_src && (full_src.length > 0)){
                var pos      = globalThis.getSelection().focusOffset
                if ((pos == 0) || pos) {
                    Editor.show_identifier_info(full_src, pos, event.target)
                }
            }
        }
    }

//Doc pane
    static doc_pane_elt_id_history = []
    static doc_pane_elt_id_history_cur_index = -1
    static open_doc_called_since_doc_pane_collapsed = false

//if an id name has a dot in it, then
//DocCode.open_doc(foo.bar_doc_id) won't work because
//foo will be evaled, then it looks for bar_doc_id inside that and
//won't find it.
//but if we do DocCode.open_doc("foo.bar_doc_id") it will work because
//the below fn does "if its a string. then look it up in "window".
    static open_doc(details_elt, record=true){
        if(typeof(details_elt) == "string"){
            if(details_elt == "Dexter.make_ins_doc_id") { //a synonym
               details_elt = "make_ins_doc_id"
            }
            details_elt = globalThis[details_elt]
        }
        //details_elt.open = true;
        this.open_doc_elt_and_ancestors(details_elt)
        if(record) {
            if(record instanceof Event){
                //let pars = Element.ancestors(record.target) // the following fails in dde4 $(record.target).parents()
                let pars = Utils.get_dom_elt_ancestors(record.target)
                for (let par of pars){
                    if (par && par.id && (par.id !== "") &&
                        (par.id !== this.doc_pane_elt_id_history.at(-1))){ //let last elt
                        this.doc_pane_elt_id_history.push(par)
                        break;
                    }
                }
            }
            this.doc_pane_elt_id_history.push(details_elt)
            this.doc_pane_elt_id_history_cur_index = this.doc_pane_elt_id_history.length - 1
        }
        this.open_doc_arrow_set_opacity()
        /* Careful Let the init_outer_splitter_event handle it.
           The problem is, if a pane isn't expanded, there's no "width" for details_elt.offsetTop
           to be able to calulate where the actual content you want to see is.
           So we have to explitly show that content when you expand it.
           But we dont' just want to move to the last open_doc loc because
           the user might have scrolled to where they want it to be,
           causes NO open_doc calls, and expect, upon expansion, for the doc to be where
           they left it.
           */
         if (!this.doc_pane_showing()){
             this.open_doc_called_since_doc_pane_collapsed = true
            doc_pane_content_id.scrollTop = details_elt.offsetTop - 40 //this can't win because
            //the pane is collapsed, then it tries to get the pos of the details_elt but
            ///how can in know how many pixels down from the top it is when
            //it doesn't know how wide the collpased pane will be when it opens up?
        }
        //else if(DDE_DB.persistent_get("animate_ui")) { //todo comment in when persitent_get defined.
        //     this.open_doc_called_since_doc_pane_collapsed = false
        //    $('#doc_pane_content_id').animate({scrollTop: details_elt.offsetTop - 40}, 800) //WORKS! 800 is milliseconds for the animation to take.
        //}
        else {
             this.open_doc_called_since_doc_pane_collapsed = false
            $('#doc_pane_content_id').animate({scrollTop: details_elt.offsetTop - 40}, 0)
        }
        this.blink_if_doc_pane_hidden()
        Editor.myCodeMirror.focus()
    }

    static init_outer_splitter_expand_event(){
        $('#outer_splitter_id').on('expanded',
            function (event) {
              if(this.open_doc_called_since_doc_pane_collapsed){
                  this.open_doc_called_since_doc_pane_collapsed = false
                setTimeout(this.open_doc_current, 300)
              }
            })
    }

    //fn_name can be the actual fn or a string of its name or a path to the fn, or a class
    //fn name might have dots in it like "Control.go_to"
    static open_doc_show_fn_def(details_elt, fn_name){
        if(typeof(details_elt) == "string"){
            details_elt = globalThis[details_elt]
        }
        if(details_elt){ this.open_doc(details_elt) } //but ignore if no doc
        else { Js_info.show_doc(fn_name, fn_name) }
        let fn
        if(typeof(fn_name) == "string"){
            fn = value_of_path(fn_name)
        }
        else {
            fn = fn_name
            fn_name = fn.name
        }
        let non_last_parts_of_path = null
        let last_dot_pos = fn_name.lastIndexOf(".")
        if (last_dot_pos != -1) {
            non_last_parts_of_path = fn_name.substring(0, last_dot_pos)
        }
        if (fn && (typeof(fn) == "function")){
            let src = fn.toString() //for actual functions, the result starts with "function ", For classes it starts with "class "
            if (src.startsWith("class ")) {}
            else if (src.startsWith("function (") ||
                     src.startsWith("function(")){ //anonymous fn but I've got the fn_name
                src = fn_name + "<br/>" + src
            }
            else if (src.startsWith("function ")){
                if (non_last_parts_of_path) {
                    src = non_last_parts_of_path + "<br/>" + src
                }
                else {} //ok as is
            }
            else {
                if (non_last_parts_of_path) {
                    src = non_last_parts_of_path + "<br/>function " + src
                }
                else {src = "function " + src}

            }
            src = Utils.replace_substrings(src, "\n", "<br/>")
            src = Utils.replace_substrings(src, " ", "&nbsp;")
            out(src)
        }
        Editor.myCodeMirror.focus()
    }

    static open_doc_arrow_set_opacity(){
        if(this.doc_pane_elt_id_history_cur_index == 0) { doc_prev_id.style.opacity = 0.3 }
        else { doc_prev_id.style.opacity = 1}
        if (this.doc_pane_elt_id_history_cur_index == (this.doc_pane_elt_id_history.length - 1)){
                doc_next_id.style.opacity = 0.3
        }
        else { doc_next_id.style.opacity = 1 }
    }

    static open_doc_elt_and_ancestors(elt){
        if(elt.tagName == "DETAILS") {elt.open = true}
        if (elt.id != "doc_pane_content_id") { this.open_doc_elt_and_ancestors(elt.parentElement) }
    }

    static open_doc_prev(){
        if(this.doc_pane_elt_id_history_cur_index <= 0) {
            warning("There is no previous document location to browse.")
        }
        else {
            this.doc_pane_elt_id_history_cur_index -= 1
            this.open_doc_current()
        }
    }

    static open_doc_next(){
        if(this.doc_pane_elt_id_history_cur_index >=  (this.doc_pane_elt_id_history.length - 1)) {
            warning("There is no next document location to browse.")
        }
        else {
            this.doc_pane_elt_id_history_cur_index += 1
            this.open_doc_current()
        }
    }

    static open_doc_current(){
        let elt_id = this.doc_pane_elt_id_history[this.doc_pane_elt_id_history_cur_index]
        if (typeof(elt_id) == "string"){
            find_doc_input_id.value = elt_id
            this.find_doc(false)
        }
        else { this.open_doc(elt_id, false) }
    }

//splits editor-putput panes  from doc_misc panes
    static blink_vertical_splitter(count = 6){
        if(count > 0) {
            setTimeout(function(){
                    let color
                    if((count % 2) === 0) { color = "#00FF00" }
                    else { color = "#AAAAAA"}
                    set_css_properties(".jqx-splitter-collapse-button-vertical {background-color:" + color + ";}")
                    this.blink_vertical_splitter(count - 1)
                }, 500
            )
        }
    }

    static blink_editor_output_splitter(count = 6){
        if(count > 0) {
            setTimeout(function(){
                    let color
                    if((count % 2) === 0) { color = "#00FF00" }
                    else { color = "#AAAAAA"}
                    set_css_properties("#left_splitter_id .jqx-splitter-collapse-button-horizontal {background-color:" + color + ";}")
                    this.blink_editor_output_splitter(count - 1)
                }, 500
            )
        }
    }

    static blink_if_doc_pane_hidden(){
        if(!this.doc_pane_showing()){
            this.blink_vertical_splitter()
        }
    }

    static blink_if_output_pane_hidden(){
        if(!this.output_pane_showing()){
            this.blink_editor_output_splitter()
        }
    }

    static doc_pane_showing(){
        return !$('#outer_splitter_id').jqxSplitter('panels')[1].collapsed
    }

    static output_pane_showing(){
        if(globalThis.left_splitter_id) {
            return !$('#left_splitter_id').jqxSplitter('panels')[1].collapsed
        }
        else { return false } //hits if user replaced the whole ui (body_id)
    }


    static misc_pane_showing(){
        return !$('#right_splitter_id').jqxSplitter('panels')[1].collapsed
    }

    static close_all_details(){
        var details = document.getElementsByTagName("details");
        for(var i = 0; i < details.length; i++){
            details[i].removeAttribute("open");
        }
    }

//returns the selection or the empty string. never gets the full editor or full input or full text area text
    static selection_for_find_button(){
        let src
        if(DocCode.previous_active_element &&
            DocCode.previous_active_element.parentNode &&
            DocCode.previous_active_element.parentNode.parentNode &&
            DocCode.previous_active_element.parentNode.parentNode.CodeMirror){
            src = Editor.get_javascript(true) //if sel in editor, get it, else return empty string
        }
        else if (DocCode.selected_text_when_eval_button_clicked.length > 0) {
            src = DocCode.selected_text_when_eval_button_clicked
        }
        else if (DocCode.previous_active_element &&
            DocCode.previous_active_element.tagName == "TEXTAREA"){
            let start = DocCode.previous_active_element.selectionStart
            let end   = DocCode.previous_active_element.selectionEnd
            if (start != end) { src = DocCode.previous_active_element.value.substring(start, end) }
            else              { src = "" }
        }
        else if (DocCode.previous_active_element &&
            (DocCode.previous_active_element.tagName == "INPUT") &&
            (DocCode.previous_active_element.type == "text")){
            let start = DocCode.previous_active_element.selectionStart
            let end  = DocCode.previous_active_element.selectionEnd
            if (start != end) { src = DocCode.previous_active_element.value.substring(start, end) }
            else              { src = "" }
            src = ""
        }
        else {
            src = ""
        }
        return src
    }

    static find_doc(record=true){
        DocCode.undecorate_doc_details({done: function(){DocCode.find_doc_aux(record)}}) //weirdly I need DocCode instead of "this" in both places.
    }

    static find_doc_aux(record){
        this.close_all_details()
        //ut("active elt for find: " + document.activeElement.tagName)
        //ut("prev active elt for find: " + DocCode.previous_active_element.tagName)
        let search_string = find_doc_input_id.value
        if (search_string.length == 0) { search_string = this.selection_for_find_button() } //Editor.get_any_selection()  //doc & output panes
        if (search_string.length == 0) {
            warning("There is no text in the Find type-in nor selection anywhere to search for.")
            return
        }
        //find_doc_input_id.value = search_string

        //out(search_string) //for testing only
        if(record) {
            this.doc_pane_elt_id_history.push(search_string)
            this.doc_pane_elt_id_history_cur_index = this.doc_pane_elt_id_history.length - 1
        }
        let array_of_found_test_suites = TestSuite.find_test_suites(search_string)
        let html_for_test_suites
        let ts_plural_suffix = ((array_of_found_test_suites.length > 1) ? "s" : "")
        if(array_of_found_test_suites.length == 0){
            html_for_test_suites = "" //note; having this text is just confusing for users. so if not found in text suites, just print nothing. //"<span style='background-color:yellow;'>" + search_string + "</span> is not in any TestSuites."
        }
        else {
            html_for_test_suites = "<span style='background-color:yellow;'>" + search_string + "</span> is in " +
            array_of_found_test_suites.length + " TestSuite" + ts_plural_suffix + "." +
            ` <button onclick="TestSuite.find_test_suites_and_print('` + search_string +
            `')">View Found TestSuite` + ts_plural_suffix + "</button>"
        }
        this.open_doc_arrow_set_opacity()
        //doc in https://markjs.io/  npm package
        var mark_inst = new Mark(doc_pane_content_id) //document.querySelector("#doc_pane_content_id"))
        mark_inst.unmark()
        mark_inst.mark(search_string, {
            diacritics: false,  //I don't need diacritics, and it use to not work but is working now. Default is true.
            separateWordSearch: false,
            done:function(count){
                if (count === 0 ) {
                    warning("No matches of <code>" + search_string + "</code> found.<br/>" +
                        "Matches are case-insensitive, so changing the case<br/>" +
                        "of your search string won't help.")
                }
                else {
                    out(count + ' matches of <span style="background-color:yellow;">' +
                        search_string + '</span> now highlighed  in yellow in the Doc pane.<br/>' +
                        'To see them, twist down the <details style="background-color:rgb(255, 214, 153);"><summary><b>Orange Rows</b> (in the Doc pane)</summary></details>' +
                        html_for_test_suites,
                        "black")
                }
            },
            each:function(text_node){
                let details_ancestors = $(text_node).parents("details").children("summary")
                for(let i = 0; i <  details_ancestors.length; i++){
                    let elt = details_ancestors[i]
                    elt.style.backgroundColor = "#ffd699" //"#ffc266" //"orange"
                }
                //out("hey" + text_node)

                return true; //true means we keep this match
            }
        }) //does not work with the non-jquery (vanilla js ) verison of mark.js either ES5 or ES6
        //error message:  Cannot read property 'caseSensitive' of undefined
        //but goes away with a 2nd arg of {caseSensitive: false} but then
        //it will only match all uppercase keywords , another bug.
        //with {caseSensitive: true}, it doesn't match anything
        //bug submitted sep 5, 2016 to https://github.com/julmot/mark.js/issues/68
        //$("#doc_pane_content_id").mark(search_string)
        //let elts = $( "#doc_pane_content_id > :contains(" + search_string + ")" )
        //elts.css( "text-decoration", "underline" );

        if(Editor.view === "HCA") {
            HCA.find(search_string)
        }
    }

    static undecorate_doc_details(unmark_options){
        var summaries = $("#doc_pane_content_id").find("summary");
        for(var i = 0; i < summaries.length; i++){
            let sum1 = summaries[i]
            sum1.style.backgroundColor = null //this is hard to do, but here's one syntax that seems to work
            //note the proper spelling of the property in css is background-color but because JS
            //broke the minus sign, and css "designers" were too stupid to avoid using it,
            //we have this convoluted syntax.
        }
        let context = doc_pane_content_id.querySelectorAll("mark"); //fails
        let instance = new Mark(context);
        instance.unmark(unmark_options);
       // $("mark").unmark();
    }

/*
Returns the details elt with summary specified by summary_text_path.
summary_text_path can be:
  - null, meaning return doc_pane_content_id so that new doc goes at top level in doc pane
 - a single summary innerText (and that might be
      nested deep0 OR, to help with ambiguity possibility of
 - a summary having same named 'cousins', you can give a path a la
  "foo/bar/baz for finding the correct details elt.

<details><summary>foo</summary>
  <details><summary>bar</summary>
    <details id="the_det"><summary>baz</summary>
    </details>
  </details>
</details>
to return the elt "the_det"
*/

    static find_doc_pane_details_elt_with_summary(summary_text_path){
        let par = doc_pane_content_id
        let new_par
        let path_arr = summary_text_path.split("/")
        for(let sum_text of path_arr){
            let summaries = par.querySelectorAll("summary")
            new_par = null
            for(let elt of summaries) {
                if(elt.innerText === sum_text) {
                    new_par = elt.parentElement
                    break;
                }
            }
            if(new_par === null) {return null} //didn't find it
            else {par = new_par}
        }
        if(par === doc_pane_content_id) { return null }
        else { return par }
    }
/*inserts html as the new last child of the details elt that has a summary elt
specified by summary_text_path. See find_doc_pane_details_elt_with_summary
position is same as position arg for insertAdjacentHTML
<!-- beforebegin -->
<p>
<!-- afterbegin -->
foo
<!-- beforeend -->
</p>
<!-- afterend -->
*/

//documented in Ref Man/Lesson
    static insert_html_into_doc_pane(html, summary_text_path=null, position="beforeend"){
        let parent_details_elt
        let valid_positions = ["beforebegin", "afterbegin", "beforeend", "afterend"]
        if(!valid_positions.includes(position)){
            dde_error('DocCode.insert_html_into_doc_pane passed position of: <code>"' + position +
                '"</code><br/> that is not one of "' + valid_positions.join('", "') + '"')
        }
        if(summary_text_path == null) {
            if((position == "beforebegin") || (position == "afterend")){
                dde_error('In call to DocCode.insert_html_into_doc_pane, position of: <code>"' + position +
                          '"</code><br/>is not valid with summary_text_path of: <code>null</code>')
            }
            else { parent_details_elt = doc_pane_content_id }
        }

        else {
            parent_details_elt = this.find_doc_pane_details_elt_with_summary(summary_text_path)
        }
        if(parent_details_elt == null) {
           dde_error("DocCode.insert_html_into_doc_pane could not find summary_text_path: " + summary_text_path)
        }
        else {
            parent_details_elt.insertAdjacentHTML(position, html)
        }
    }

    static show_configurations_image(){
        show_window({
            title: "Dexter Configurations",
            content: `
        <img width="800" src="doc/coor_images/Configurations.png"/>
        `,
            x:0, y:0, width:830, height:670
        })
    }
}

globalThis.DocCode = DocCode
