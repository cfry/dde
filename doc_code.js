//called for cmd input AND run instruction dialog run_src type in
function onclick_for_click_help(event) {
    if(event.target.tagName == "SELECT") { return } //happens with SSH dir listing, when clicking on the dir or file menu in the output pane
    if($(event.target).closest(".inspector").length > 0){ //don't do regular on_click if inside an inspector
        //var elt = event.target  //; the click just go to the underlined item in the inspector
        return
    }
    if ($(event.target).closest("#temp").length > 0){ //we're in a temp, and if we have a selection, DON"T
      //give us click help on it because we want to select that thing, then use it in another operation
      //like Find or Eval or copy & paste. IF so, just do nothing.
      let sel = window.getSelection()
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
        full_src = window.getSelection().focusNode
        if ((typeof(full_src) == "object") && (full_src !== null) && full_src["data"]) {
            full_src = full_src.data
        }
        if (full_src && (full_src.length > 0)){
            var pos      = window.getSelection().focusOffset
            if ((pos == 0) || pos) {
                Editor.show_identifier_info(full_src, pos, event.target)
            }
        }
    }
}

//Doc pane
var doc_pane_elt_id_history = []
var doc_pane_elt_id_history_cur_index = -1
var open_doc_called_since_doc_pane_collapsed = false

//if an id name has a dot in it, then
//open_doc(foo.bar_doc_id) won't work because
//foo will be eevaled, then it looks for bar_doc_id inside that and
//won't find it.
//but if we do open_doc("foo.bar_doc_id") it will work because
//the below fn does "if its a string. then look it up in "window".
function open_doc(details_elt, record=true){
    if(typeof(details_elt) == "string"){
        if(details_elt == "Dexter.make_ins_doc_id") { //a synonym
           details_elt = "make_ins_doc_id"
        }
        details_elt = window[details_elt]
    }
    //details_elt.open = true;
    open_doc_elt_and_ancestors(details_elt)
    if(record) {
        if(record instanceof Event){
            let pars = $(record.target).parents()
            for (let par of pars){
                if (par && par.id && (par.id !== "") &&
                    (par.id !== last(doc_pane_elt_id_history))){
                    doc_pane_elt_id_history.push(par)
                    break;
                }
            }
        }
        doc_pane_elt_id_history.push(details_elt)
        doc_pane_elt_id_history_cur_index = doc_pane_elt_id_history.length - 1
    }
    open_doc_arrow_set_opacity()
    /* Careful Let the init_outer_splitter_event handle it.
       The problem is, if a pane isn't expanded, there's no "width" for details_elt.offsetTop
       to be able to calulate where the actual content you want to see is.
       So we have to explitly show that content when you expand it.
       But we dont' just want to move to the last open_doc loc because
       the user might have scrolled to where they want it to be,
       causes NO open_doc calls, and expect, upon expansion, for the doc to be where
       they left it.
       */
     if (!doc_pane_showing()){
        open_doc_called_since_doc_pane_collapsed = true
        doc_pane_content_id.scrollTop = details_elt.offsetTop - 40 //this can't win because
        //the pane is collapsed, then it tries to get the pos of the details_elt but
        ///how can in know how many pixels down from the top it is when
        //it doesn't know how wide the collpased pane will be when it opens up?
    }
    else if(persistent_get("animate_ui")) {
        open_doc_called_since_doc_pane_collapsed = false
        $('#doc_pane_content_id').animate({scrollTop: details_elt.offsetTop - 40}, 800) //WORKS! 800 is milliseconds for the animation to take.
    }
    else {
        open_doc_called_since_doc_pane_collapsed = false
        $('#doc_pane_content_id').animate({scrollTop: details_elt.offsetTop - 40}, 0)
    }
    blink_if_doc_pane_hidden()
    myCodeMirror.focus()
}

function init_outer_splitter_expand_event(){
    $('#outer_splitter_id').on('expanded',
        function (event) {
          if(open_doc_called_since_doc_pane_collapsed){
            open_doc_called_since_doc_pane_collapsed = false
            setTimeout(open_doc_current, 300)
          }
        })
}

//fn_name can be the actual fn or a string of its name or a path to the fn, or a class
//fn name might have dots in it like "Control.go_to"
function open_doc_show_fn_def(details_elt, fn_name){
    if(typeof(details_elt) == "string"){
        details_elt = window[details_elt]
    }
    if(details_elt){ open_doc(details_elt) } //but ignore if no doc
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
        src = replace_substrings(src, "\n", "<br/>")
        src = replace_substrings(src, " ", "&nbsp;")
        out(src)
    }
    myCodeMirror.focus()
}

function open_doc_arrow_set_opacity(){
    if(doc_pane_elt_id_history_cur_index == 0) { doc_prev_id.style.opacity = 0.3 }
    else { doc_prev_id.style.opacity = 1}
    if (doc_pane_elt_id_history_cur_index == (doc_pane_elt_id_history.length - 1)){
            doc_next_id.style.opacity = 0.3
    }
    else { doc_next_id.style.opacity = 1 }
}

function open_doc_elt_and_ancestors(elt){
    if(elt.tagName == "DETAILS") {elt.open = true}
    if (elt.id != "doc_pane_content_id") { open_doc_elt_and_ancestors(elt.parentElement) }
}

function open_doc_prev(){
    if(doc_pane_elt_id_history_cur_index <= 0) {
        warning("There is no previous document location to browse.")
    }
    else {
        doc_pane_elt_id_history_cur_index -= 1
        open_doc_current()
    }
}

function open_doc_next(){
    if(doc_pane_elt_id_history_cur_index >=  (doc_pane_elt_id_history.length - 1)) {
        warning("There is no next document location to browse.")
    }
    else {
        doc_pane_elt_id_history_cur_index += 1
        open_doc_current()
    }
}

function open_doc_current(){
    let elt_id = doc_pane_elt_id_history[doc_pane_elt_id_history_cur_index]
    if (typeof(elt_id) == "string"){
        find_doc_input_id.value = elt_id
        find_doc(false)
    }
    else { open_doc(elt_id, false) }
}

//splits editor-putput panes  from doc_misc panes
function blink_vertical_splitter(count = 6){
    if(count > 0) {
        setTimeout(function(){
                let color
                if((count % 2) === 0) { color = "#00FF00" }
                else { color = "#AAAAAA"}
                set_css_properties(".jqx-splitter-collapse-button-vertical {background-color:" + color + ";}")
                blink_vertical_splitter(count - 1)
            }, 500
        )
    }
}

function blink_editor_output_splitter(count = 6){
    if(count > 0) {
        setTimeout(function(){
                let color
                if((count % 2) === 0) { color = "#00FF00" }
                else { color = "#AAAAAA"}
                set_css_properties("#left_splitter_id .jqx-splitter-collapse-button-horizontal {background-color:" + color + ";}")
                    blink_editor_output_splitter(count - 1)
            }, 500
        )
    }
}

function blink_if_doc_pane_hidden(){
    if(!doc_pane_showing()){
        blink_vertical_splitter()
    }
}

function blink_if_output_pane_hidden(){
    if(!output_pane_showing()){
        blink_editor_output_splitter()
    }
}

function doc_pane_showing(){
    return !$('#outer_splitter_id').jqxSplitter('panels')[1].collapsed
}

function output_pane_showing(){
    return !$('#left_splitter_id').jqxSplitter('panels')[1].collapsed
}

function misc_pane_showing(){
    return !$('#right_splitter_id').jqxSplitter('panels')[1].collapsed
}





function close_all_details(){
    var details = document.getElementsByTagName("details");
    for(var i = 0; i < details.length; i++){
        details[i].removeAttribute("open");
    }
}

//returns the selection or the empty string. never gets the full editor or full input or full text area text
function selection_for_find_button(){
    let src
    if(previous_active_element &&
        previous_active_element.parentNode &&
        previous_active_element.parentNode.parentNode &&
        previous_active_element.parentNode.parentNode.CodeMirror){
        src = Editor.get_javascript(true) //if sel in editor, get it, else return empty string
    }
    //let sel_obj = window.getSelection()
    else if (selected_text_when_eval_button_clicked.length > 0) {
        src = selected_text_when_eval_button_clicked
    }
    else if (previous_active_element &&
        previous_active_element.tagName == "TEXTAREA"){
        let start = previous_active_element.selectionStart
        let end   = previous_active_element.selectionEnd
        if (start != end) { src = previous_active_element.value.substring(start, end) }
        else              { src = "" }
    }
    else if (previous_active_element &&
        (previous_active_element.tagName == "INPUT") &&
        (previous_active_element.type == "text")){
        let start = previous_active_element.selectionStart
        let end  = previous_active_element.selectionEnd
        if (start != end) { src = previous_active_element.value.substring(start, end) }
        else              { src = "" }
        src = ""
    }
    else {
        src = ""
    }
    return src
}

function find_doc(record=true){
    undecorate_doc_details({done: function(){find_doc_aux(record)}})
}

function find_doc_aux(record){
    close_all_details()
    //ut("active elt for find: " + document.activeElement.tagName)
    //ut("prev active elt for find: " + previous_active_element.tagName)
    let search_string = find_doc_input_id.value
    if (search_string.length == 0) { search_string = selection_for_find_button() } //Editor.get_any_selection()  //doc & output panes
    if (search_string.length == 0) {
        warning("There is no text in the Find type-in nor selection anywhere to search for.")
        return
    }
    //find_doc_input_id.value = search_string

    //out(search_string) //for testing only
    if(record) {
        doc_pane_elt_id_history.push(search_string)
        doc_pane_elt_id_history_cur_index = doc_pane_elt_id_history.length - 1
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
    open_doc_arrow_set_opacity()
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
                    'To see them, twist down the <details style="background-color:rgb(255, 214, 153);"><summary><b>Orange Rows</b></summary></details>' +
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
}

function undecorate_doc_details(unmark_options){
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

function find_doc_pane_details_elt_with_summary(summary_text_path){
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
function insert_html_into_doc_pane(html, summary_text_path=null, position="beforeend"){
    let parent_details_elt
    let valid_positions = ["beforebegin", "afterbegin", "beforeend", "afterend"]
    if(!valid_positions.includes(position)){
        dde_error('insert_html_into_doc_pane passed position of: <code>"' + position +
            '"</code><br/> that is not one of "' + valid_positions.join('", "') + '"')
    }
    if(summary_text_path == null) {
        if((position == "beforebegin") || (position == "afterend")){
            dde_error('In call to insert_html_into_doc_pane, position of: <code>"' + position +
                      '"</code><br/>is not valid with summary_text_path of: <code>null</code>')
        }
        else { parent_details_elt = doc_pane_content_id }
    }

    else {
        parent_details_elt = find_doc_pane_details_elt_with_summary(summary_text_path)
    }
    if(parent_details_elt == null) {
       dde_error("insert_html_into_doc_pane could not find summary_text_path: " + summary_text_path)
    }
    else {
        parent_details_elt.insertAdjacentHTML(position, html)
    }
}

function init_doc(){
    let content =
        '<details id="getting_started_id"><summary class="doc_top_level_summary">Getting Started</summary>\n' +
        read_file(__dirname + "/doc/getting_started.html") +
        "</details>\n" +
        '<details id="user_guide_id"><summary class="doc_top_level_summary">User Guide</summary>\n' +
        read_file(__dirname + "/doc/guide.html") +
        "</details>\n" +
        '<details id="reference_manual_id"><summary class="doc_top_level_summary">Reference Manual</summary>\n' +
        read_file(__dirname + "/doc/ref_man.html") +
        "</details>\n" +

        '<details><summary class="doc_top_level_summary">Articles</summary>\n' +
        '<details class="doc_details"><summary class="doc_articles_level_summary">Overview</summary>\n' +
        read_file(__dirname + "/doc/dde_overview/Dexter_Development_Environment.html") +
        "</details>\n" +
        '<details class="doc_details"><summary class="doc_articles_level_summary">Browser vs. DDE</summary>\n' +
        read_file(__dirname + "/doc/browser_vs_dde.html") +
        "</details>\n" +
        '<details class="doc_details"><summary class="doc_articles_level_summary">A Mental Model of Memory</summary>\n' +
        read_file(__dirname + "/doc/mental_model_of_memory.html") +
        "</details>\n" +
        '<details class="doc_details"><summary class="doc_articles_level_summary">How to Think Like a Computer</summary>\n' +
        read_file(__dirname + "/doc/eval.html") +
        "</details>\n" +
        '<details class="doc_details" id="music_article_doc_id"><summary class="doc_articles_level_summary">The Language of Music</summary>\n' +
        read_file(__dirname + "/doc/music.html") +
        "</details>\n" +
        '<details class="doc_details"><summary class="doc_articles_level_summary">Dexter Kinematics</summary>\n' +
        read_file(__dirname + "/doc/dexter_kinematics.html") +
        '</details>\n' +
        '<details class="doc_details"><summary class="doc_articles_level_summary">Glossary</summary>\n' +
        read_file(__dirname + "/doc/glossary.html") +
        '</details>\n' +
        '</details>\n' +

        '<details><summary class="doc_top_level_summary">Build Dexter</summary>\n' +
           'This is just an example of the kinds of tutorials you can construct with ' +
            `<a href="#" onclick="open_doc('Lesson.make_button_column_doc_id')"><code>Lesson.make_button_column</code></a>\n` +
        read_file(__dirname + "/doc/build_dexter/wire_harness_assembly.html") +
        '</details>\n' +

        '<details id="release_notes_doc_id"><summary class="doc_top_level_summary">Release Notes</summary>\n' +
        read_file(__dirname + "/doc/release_notes.html") +
        "</details>\n" +

        '<details><summary class="doc_top_level_summary">Known Issues</summary>\n' +
        read_file(__dirname + "/doc/known_issues.html") +
        "</details>\n"
    doc_pane_content_id.innerHTML = content
}

function show_configurations_image(){
    show_window({
        title: "Dexter Configurations",
        content: `
    <img width="800" src="doc/coor_images/Configurations.png"/>
    `,
        x:0, y:0, width:830, height:670
    })
}

var Mark = require('mark.js')
var {read_file} = require("./core/storage.js")
var {last, replace_substrings, value_of_path} = require("./core/utils.js")