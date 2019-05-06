//called for cmd input AND run instruction dialog run_src type in
function onclick_for_click_help(event) {
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
        if(full_src.length > 0){
            var pos = event.target.selectionStart
            Editor.show_identifier_info(full_src, pos)
        }
    }
    else {
        full_src = window.getSelection().focusNode
        if ((typeof(full_src) == "object") && (full_src !== null) && full_src["data"]) {
            full_src = full_src.data
        }
        if (full_src && (full_src.length > 0)){
            var pos      = window.getSelection().focusOffset
            if ((pos == 0) || pos) {
                Editor.show_identifier_info(full_src, pos)
            }
        }
    }
}

//Doc pane
var doc_pane_elt_id_history = []
var doc_pane_elt_id_history_cur_index = -1


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
    if(persistent_get("animate_ui")) {
        $('#doc_pane_content_id').animate({scrollTop: details_elt.offsetTop - 40}, 800) //WORKS! 800 is milliseconds for the animation to take.
    }
    else {
        $('#doc_pane_content_id').animate({scrollTop: details_elt.offsetTop - 40}, 0)
    }
    myCodeMirror.focus()
}

//fn_name can be the actual fn or a string of its name or a path to the fn, or a class
//fn name might have dots in it like "Robot.go_to"
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
        else if (src.startsWith("function (")){ //anonymous fn but I've got the fn_name
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
        let end  = previous_active_element.selectionEnd
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
    let search_string = find_doc_input_id.value
    if (search_string.length == 0) { search_string = selection_for_find_button() } //Editor.get_any_selection()  //doc & output panes
    if (search_string.length == 0) {
        warning("There is no text in the Find type-in nor selection anywhere to search for.")
        return
    }
    //out(search_string) //for testing only
    if(record) {
        doc_pane_elt_id_history.push(search_string)
        doc_pane_elt_id_history_cur_index = doc_pane_elt_id_history.length - 1
    }
    let array_of_found_test_suites = TestSuite.find_test_suites(search_string)
    let html_for_test_suites
    let ts_plural_suffix = ((array_of_found_test_suites.length > 1) ? "s" : "")
    if(array_of_found_test_suites.length == 0){
        html_for_test_suites = "<span style='background-color:yellow;'>" + search_string + "</span> is not in any TestSuites."
    }
    else {
        html_for_test_suites = "<span style='background-color:yellow;'>" + search_string + "</span> is in " +
        array_of_found_test_suites.length + " TestSuite" + ts_plural_suffix + "." +
        ` <button onclick="TestSuite.find_test_suites_and_print('` + search_string +
        `')">View Found TestSuite` + ts_plural_suffix + "</button>"
    }
    open_doc_arrow_set_opacity()
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
                    "black", true)
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
        "</details>\n" +
        '<details class="doc_details"><summary class="doc_articles_level_summary">Glossary</summary>\n' +
        read_file(__dirname + "/doc/glossary.html") +
        "</details>\n" +
        '</details>\n' +

        '<details><summary class="doc_top_level_summary">Release Notes</summary>\n' +
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

var {read_file} = require("./core/storage.js")
var {warning, last, replace_substrings, value_of_path} = require("./core/utils.js")