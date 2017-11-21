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
    $('#doc_pane_content_id').animate({scrollTop: details_elt.offsetTop - 40}, 800); //WORKS! 800 is milliseconds for the animation to take.
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

function find_doc(record=true){
    undecorate_doc_details({done: function(){find_doc_aux(record)}})
}

function find_doc_aux(record){
    close_all_details()
    let search_string = find_doc_input_id.value
    if (search_string.length == 0) { search_string = Editor.get_any_selection() } //doc & output panes
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

/*function init_guide(){
    const path = __dirname + "/doc/guide.html"
    console.log("init_guide using path: " + path)
    doc_pane_content_id.innerHTML = file_content(path)
}

function init_ref_man(){
    ref_man_doc_id.innerHTML =
        "<summary>Reference Manual</summary>" +
        file_content(__dirname + "/doc/ref_man.html")
}

function init_release_notes(){
    release_notes_id.innerHTML =
        "<summary>Release Notes</summary>" +
        file_content(__dirname + "/doc/known_issues.html") +
        "<i>Note: some releases have no notes because they contain only internal changes.</i>" +
        file_content(__dirname + "/doc/release_notes.html")
}*/

function init_doc(){
    let content =   '<details><summary class="doc_top_level_summary">Articles</summary>\n' +
        '<details class="doc_details"><summary class="doc_articles_level_summary">Overview</summary>\n' +
        file_content(__dirname + "/doc/dde_overview/Dexter_Development_Environment.html") +
        "</details>\n" +
        '<details class="doc_details"><summary class="doc_articles_level_summary">Browser vs. DDE</summary>\n' +
        file_content(__dirname + "/doc/browser_vs_dde.html") +
        "</details>\n" +
        '<details class="doc_details"><summary class="doc_articles_level_summary">A Mental Model of Memory</summary>\n' +
        file_content(__dirname + "/doc/mental_model_of_memory.html") +
        "</details>\n" +
        '<details class="doc_details"><summary class="doc_articles_level_summary">How to Think Like a Computer</summary>\n' +
        file_content(__dirname + "/doc/eval.html") +
        "</details>\n" +
        '<details class="doc_details" id="music_article_doc_id"><summary class="doc_articles_level_summary">The Language of Music</summary>\n' +
        file_content(__dirname + "/doc/music.html") +
        "</details>\n" +
        '<details class="doc_details"><summary class="doc_articles_level_summary">Dexter Kinematics</summary>\n' +
        file_content(__dirname + "/doc/dexter_kinematics.html") +
        "</details>\n" +
        '<details class="doc_details"><summary class="doc_articles_level_summary">Glossary</summary>\n' +
        file_content(__dirname + "/doc/glossary.html") +
        "</details>\n" +
        '</details>\n' +
        '<details id="user_guide_id"><summary class="doc_top_level_summary">User Guide</summary>\n' +
        file_content(__dirname + "/doc/guide.html") +
        "</details>\n" +
        '<details id="reference_manual_id"><summary class="doc_top_level_summary">Reference Manual</summary>\n' +
        file_content(__dirname + "/doc/ref_man.html") +
        "</details>\n" +
        '<details><summary class="doc_top_level_summary">Release Notes</summary>\n' +
        file_content(__dirname + "/doc/release_notes.html") +
        "</details>\n" +
        '<details><summary class="doc_top_level_summary">Known Issues</summary>\n' +
        file_content(__dirname + "/doc/known_issues.html") +
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