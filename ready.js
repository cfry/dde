
    dde_version = "not inited"
    dde_release_date = "not inited"
    var myCodeMirror //inited inside of ready

    function eval_button_action(){ //used by both clicking on the eval button and Cmd-e
        if((Editor.current_file_path != "new file") && (save_on_eval_id.checked)) { Editor.save_current_file() }
        eval_js_part1();
    }

    function open_doc(details_elt){
        //details_elt.open = true;
        open_doc_elt_and_ancestors(details_elt)
        $('#doc_pane_content_id').animate({scrollTop: details_elt.offsetTop - 40}, 800); //WORKS! 800 is milliseconds for the animation to take.
        myCodeMirror.focus()
    }

    function open_doc_elt_and_ancestors(elt){
        if(elt.tagName == "DETAILS") {elt.open = true}
        if (elt.id != "doc_pane_content_id") { open_doc_elt_and_ancestors(elt.parentElement) }
    }

    function close_all_details(){
        var details = document.getElementsByTagName("details");
        for(var i = 0; i < details.length; i++){
            details[i].removeAttribute("open");
        }
    }

    function find_doc(){
        let search_string = find_doc_input_id.value
        if (search_string.length == 0){
            let sel = window.getSelection().toString().trim()
            if (sel.length == 0) { sel = Editor.get_javascript(true) }
            if (sel.length == 0) { return }
            else {
                //find_doc_input_id.value = sel //don't do so that user can do
                 //other searches for sel with empty type in without having to
                 //delete the type in. Note output pane shows what's
                 //being searched for so that's good enough feedback.
                search_string = sel
            }
        }
        close_all_details()
        undecorate_doc_details()
        //out(search_string) //for testing only
        var mark_inst = new Mark(doc_pane_content_id) //document.querySelector("#doc_pane_content_id"))
        mark_inst.unmark()
        mark_inst.mark(search_string, {
            diacritics: false,  //I don't need diacritics, and it use to not work but is working now. Default is true.
            done:function(count){out(count + ' matches of <span style="background-color:yellow;">' +
                                     search_string + '</span> now highlighed  in yellow in the Doc pane.<br/>' +
                                     'To see them, twist down the <details style="background-color:rgb(255, 214, 153);"><summary><b>Orange Rows</b></summary></details>',
                                    "black", true)},
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

    function undecorate_doc_details(){
        var summaries = $("#doc_pane_content_id").find("summary");
        for(var i = 0; i < summaries.length; i++){
            let sum1 = summaries[i]
            sum1.style.backgroundColor = null //this is hard to do, but here's one syntax that seems to work
            //note the proper spelling of the property in css is background-color but because JS
            //broke the minus sign, and css "designers" were too stupid to avoid using it,
            //we have this convoluted syntax.
        }
    }

    function init_guide(){
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
            file_content(__dirname + "/doc/release_notes.html")
    }

    operating_system = "not inited" //on MAC this is "mac", on windows its "win".  bound in both ui and sandbox by ready
    dde_apps_dir  = null

    function on_ready() {
        const os = require('os');
        operating_system = os.platform()
        if      (operating_system == "darwin")  { operating_system = "mac" }
        else if (operating_system == "windows") { operating_system = "win" }
        const remote = require("electron").remote
        window.dde_apps_dir = remote.getGlobal("dde_apps_dir")
        console.log("In renderer dde_apps_dir: " + window.dde_apps_dir)
        console.log("In renderer appPath: "      + remote.app.getAppPath())
        console.log("In renderer __dirname: "    + __dirname)
        // require('fs-lock')({
        //     'file_accessdir': [__dirname, dde_apps_dir], //for readFile, etc. but must include __dirname since Electron needs it.
        //     'open_basedir':   [__dirname ] //__direname is the folder this app is installed in. //valid folders to get require's from. /usr/local/share/node_modules',
        // }) //restrict file access
        window.fs = require('fs')
        //dde_version = remote.getGlobal("get_app_version")
        var pckg         = require('./package.json');
        dde_version      = pckg.version
        dde_release_date = pckg.release_date
   // window.$ = require('jquery'); //Now done in index.html   after doing npm install --save jquery, we still need this
    //onload_fn()

    $('#outer_splitter').jqxSplitter({
        width: '98%', height: '93%', orientation: 'vertical',
        panels: [ { size: "63%", min: "0%", collapsible: false },
                  { size: '37%', min: "0%"}]
    })

    $('#left_splitter').jqxSplitter({orientation: 'horizontal', width: "100%", height: "100%",
        panels: [{ size: "60%", min: "5%", collapsible: false },
            { size: '40%', min: "5%"}]
    })
    // $('#upper_left_splitter').jqxSplitter({orientation: 'horizontal', width: "100%", height: "100%",
    //     panels: [{ size: "70%"}, { size: "30%"}]
    // });

    $('#right_splitter').jqxSplitter({ orientation: 'horizontal', width: "100%", height: "100%",
        panels: [{ size: "50%"}, { size: "50%"}]
    })
    //TestSuite.make_suites_menu_items() //doesn't work
    $("#js_menubar_id").jqxMenu(    {  height: '25px' });
    //$("#js_edit_menu").jqxMenu(    { width: '50px', height: '25px' });
    //$("#js_learn_js_menu").jqxMenu({ width: '90px', height: '25px' });
    //$("#js_insert_menu").jqxMenu(  { width: '65px', height: '25px' });
    //$("#js_jobs_menu").jqxMenu(    { width: '55px', height: '25px' });

    $("#error_ops_menu").jqxMenu({ width: '50px', height: '25px' });
    //$("#jqxwindow").jqxWindow({ height:400, width:400, showCloseButton: true});
    //$('#jqxwindow').jqxWindow('hide');
    $("#cmd_input").keyup(function(event){ //output pane  type in
        if(event.keyCode == 13){
            call_cmd_service_custom($("#cmd_input").val());
        }
    })

    init_simulation()
    init_ros_service_if_url_changed() //init_ros_service($("#dexter_url").val())

    init_guide()
    init_ref_man()
    init_release_notes()

    dde_version_id.innerHTML      = dde_version
    dde_release_date_id.innerHTML = dde_release_date

    Series.init_series()
    $('#js_textarea').focus() //same as myCodeMirror.focus()  but  myCodeMerror not inited yet
    rde.ping() //rde.shell("date")

    find_doc_button_id.onclick = find_doc
    find_doc_input_id.onchange = find_doc
    eval_doc_button_id.onclick = function(){
          let sel = window.getSelection().toString().trim()
          if (sel.length == 0) {out("There is no selection in the Doc pane to eval.", "orange", true) }
          else { eval_js_part2(sel) }
          }

    //handles the button clicks and menu selects that chromp Apps prevent in tHTM where they belong
    eval_id.onclick = function(event){
                        event.stopPropagation()
                        eval_button_action()
                      }
    save_on_eval_id.onclick = function(event) {
                                let val = save_on_eval_id.checked
                                persistent_set("save_on_eval", val)
                            }
    //persistent_get("save_on_eval", function(val) { save_on_eval_id.checked = val }) todo busted by electron

    email_bug_report_id.onclick=email_bug_report

    //File Menu

    new_id.onclick = function(){ Editor.edit_file("new file") }

    file_name_id.onchange = function(e){ //similar to open
        var path = e.target.value //could be "new file" or an actual file
        Editor.edit_file(path)
    }
    dde_overview_id.onclick = function() {
                          //window.open("here is text") //dde_paper_text)
                           //show_web_page('Dexter Development Environment.html')
                           //my_dialog_id.innerHTML = "<iframe>" + dde_paper_text + "</iframe>"
                           //my_dialog_id.showModal()
                           //window.open("doc/Dexter_Development_Environment.html") //permissions error
                           const the_text = file_content(__dirname + "/doc/dde_overview/Dexter_Development_Environment.html")
                           show_window({content:the_text, //dde_paper_text,
                                        x:50, y:50, width:700, height:550,
                                        title:"DDE Overview"})
                           }

    open_id.onclick=function(e) {
        const path = choose_file(show_dialog_options={title: "Choose a file to edit"})
        if (path){
            console.log(path)
            const content = file_content(path)
            Editor.set_javascript(content)
            Editor.add_path_to_files_menu(path)
        }
    }

    insert_file_id.onclick=function(e) {
        const path = choose_file({title: "Choose a file to insert into DDE's editor"})
        if (path){
            const content = file_content(path)
            Editor.insert(content)
        }
    }

    save_id.onclick=function(e) {
        if (Editor.current_file_path == "new file"){ Editor.save_as() }
        else { 
            Editor.save_current_file(); 
            myCodeMirror.focus() 
        }
    }
    save_as_id.onclick=Editor.save_as
    update_id.onclick = function (){check_for_latest_release()}

        //Edit menu
    Editor.init_editor()

    //Insert menu
    js_example_1_id.onclick=function(){Editor.insert(
`//Click the Eval button to define and call the function 'foo'.
function foo(a, b){ //define function foo with 2 args
    out("foo called with a=" + a) //print 1st arg to Output pane.
    for(var item of b){ //loop over items in array b
        if (item > 9.9){
            out("got a big one: " + item)
        }
    }
    return b.length //foo returns the length of its 2nd arg.
                    //After Evaling, observe '4' in the Output pane.
}

foo("hello", [7, 10, 20, -3.2]) //call function foo with 2 args
                                //a string and an array of numbers.
`)}
    out_black_id.onclick =function(){Editor.wrap_around_selection("out(", ')', '"Hello"')}
    out_purple_id.onclick=function(){Editor.wrap_around_selection("out(", ', "blue")', '"Hello"')}
    out_brown_id.onclick =function(){Editor.wrap_around_selection("out(", ', "rgb(255, 100, 0)")', '"Hello"')}

    editor_insert_id.onclick = function(){Editor.insert(
`Editor.insert("text to insert",
               "replace_selection", //insertion_pos.   "replace_selection" is the default. Other options: "start", "end", "selection_start", "selection_end", "whole", an integer
               false)               //select_new_text. false is the default.
`)}

    window_simple_message_id.onclick=function(){Editor.insert(
`//Pop up a window with content of the given HTML.
show_window("hi <i style='font-size:100px;'>wizard</i>")
`
)}
window_options_id.onclick=function(){Editor.insert('show_window({\n' +
                                                              '    content: "hi",      // Any HTML OK here.\n' +
                                                              '    title: "Greetings", // Appears above the content. Any HTML OK.\n' +
                                                              '    width: 150, // window width\n' +
                                                              '    height: 70, // window height\n' +
                                                              "    x: 0,       // Distance from left of DDE window to this window's left\n" +
                                                              "    y: 100,     // Distance from top  of DDE window to this window's top\n" +
                                                              '    is_modal: false, // If true, prevents you from interacting with other windows. Default false.\n' +
                                                              '    show_close_button: true,    // Default true.\n' +
                                                              '    show_collapse_button: true, // Allow quick shrink of window. Default true.\n' +
                                                              '    trim_strings: true,         // Remove whitespace from beginning and end of values from inputs of type text and texareas. Default true.\n' +
                                                              '    background_color: "ivory"   // Default is "rgb(238, 238, 238)" (light gray). White is "rgb(255, 255, 255)"\n' +
                                                              '})\n')}
    window_buttons_id.onclick=function(){Editor.insert(
`//Called when a button is clicked in the shown window.
function count_up(vals){ //vals contains name-value pairs for each
                         //html elt in show_window's content with a name.
    if(vals.clicked_button_value == "Count"){ // Clicked button value holds the name of the clicked button.
        if(window.demo_counter == undefined) { 
            window.demo_counter = 6           // Initialize the demo_counter global variable.
        }
        window.demo_counter = window.demo_counter + 1 // Increment demo_counter upon each button click.
        dex.set_in_window(vals.window_index, "count_display", "innerHTML",       window.demo_counter + "")   // Display counter. Doesn't need count_id
        dex.set_in_window(vals.window_index, "count_display", "style.font-size", window.demo_counter + "px") // Increments font size.
        //Below, a more general alterative to the above line. Uses id, not name
        //set_in_ui("count_id.style.font-size", window.demo_counter + "px")
    }
    else if (vals.clicked_button_value == "Done"){   // When a 'submit' button is clicked, its 'value' is used as its name.
        out("outta here at: " + window.demo_counter) // Last thing printed to the Output pane.
    }
}\n` +
'show_window({content:\n' +
'`<input name="count" type="button" value="Count"/> <!-- Regular button. Does not close window.-->\n' +
' <span  name="count_display" id="count_id">6</span><br/><br/>\n' +
' <input type="submit" value="Done"/>`, // submit button closes window\n' +
'             callback: count_up})      // This function called when either button is clicked.\n'
)}

    let show_window_menu_body =
`Choose:
<div class="menu" style="display:inline-block;">
   <ul>
      <li>TopMenu&#9660;
        <ul>
          <li title="this is a tooltip">item1</li>
          <li data-name="ITEM two">item2</li> <!-- if there's a data-name, use it, otherwise use the innerHTML-->
          <li>SubMenu
            <ul>
              <li>sub1</li>
              <li>sub2</li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
</div>
<span  name="menu_choice">pick menu item</span><br/><br/>
<input type="submit" value="Done"/>`

    window_menu_id.onclick=function(){Editor.insert(
`//Called whenever user chooses a menu item or clicks a button.
function menu_choice_cb(vals){
            if (vals.clicked_button_value != "Done"){ // True when menu item chosen.
                var clicked_item = vals.clicked_button_value
                dex.set_in_window(vals.window_index, "menu_choice", "innerHTML", clicked_item) // Display menu choice
            }
}

show_window({content: ` + "`" + show_window_menu_body + "`," +
` // submit closes window
        callback: menu_choice_cb // Called when menu item or button is clicked
        })
`)}

    window_many_inputs_id.onclick=function(){Editor.insert(
`//Called only when a button is clicked.
function show_vals(vals){out(vals, "black", true)}

show_window(
    {content:\n` +
"`" +
`text: <input type="text" name="my_text" value="Dexter"><br/><br/>
textarea: <textarea name="my_textarea">Hi Rez</textarea><br/><br/>
checkbox: <input name="my_checkbox" type="checkbox" checked="checked"/>heated bed?<br/><br/>
<!-- you can add the checked="checked" attribute to make it initially checked. -->
radio:
<input type="radio" name="my_radio_group" value="abs" />ABS
<input type="radio" name="my_radio_group" value="carbon"/>Carbon Fiber
<input type="radio" name="my_radio_group" value="pla" checked="checked"/>PLA<br/><br/>
    <!-- At most, only 1 radio button can be checked. If none are checked,
         the return value for the group will be undefined . -->
number: <input type="number" name="my_number" value="0.4" min="0" max="1" step="0.2"/><br/>
range:  <input type="range"  name="my_range"  value="33"  min="0" max="100"/><br/>
color:  <input type="color"  name="my_color"  value="#00FF88"/><br/>
date:   <input type="date"   name="my_date"   value="2017-01-20"/><br/>
select: <select name="size">
    <option>Gihugeic</option>
    <option selected="selected">Ginormace</option> <!--the inital value-->
    <option>Gilossal</option>
</select><br/>
combo_box: <div name="my_combo_box" class="combo_box" style="display:inline-block;vertical-align:middle;">
        <option>one</option>
        <option selected="selected">two</option>
</div><br/><br/>
button: <input type="button" value="Show settings"/><br/><br/>
submit: <input type="submit" value="OK"/>` + "`" +
',\n     width:380, height:450, title:"Printer Config", x:100, y:100,\n     callback: show_vals})\n')}

//______window_onchange_____________________
    var window_onchange_top_comments =
`/* In most uses of show_window, its callback is called only
   when an input of type 'submit' or 'button' is clicked. 
   But you CAN have the callback called whenever the value
   of an input element changes. 
   
   An HTML property of data-onchange='true' causes the
   callback call when the user clicks on another element,
   defocusing the element whose value changed. 
   For input type="radio" this is when any radio button in
   the group is clicked on.
   For 'range' (slider) inputs, this happens when the user 
   stops moving the slider.
   
   An HTML property of data-oninput='true' causes the
   callback call as soon as a new value is entered.
   For input type="text" this is upon each charcter entered.
   For input type="range" (sliders) this is upon every
   little move of the slider.
   
   The value of the "clicked_button_value" property of the
   object passed to the callback will be the 'name' of the
   changed input element, even though "clicked_button_value" 
   implies the 'value' of a 'button'.
   
   To see all this behavior, click the Eval button and play 
   with the controls in the window that pops up.
   Carefully observe the values printed in the output pane.
*/
`
     var window_onchange_content =
`Text input with <code>data-onchange='true'</code>
        calls the callback when user clicks on another input.<br/>
    <input type="text"  name="my_onchange_text"  value="33"  min="0" max="100"
    data-onchange='true'/>
        <hr/>
        Text input with <code>data-oninput='true'</code>
        calls the callback after each keystroke entering text.<br/>
    <input type="text" name="my_oninput_text" value="33"  min="0" max="100"
    data-oninput='true'/>
        <hr/>

        Range "slider" with <code>data-onchange='true'</code>
        calls the callback after user stops moving the slider.<br/>
    <input type="range"  name="my_onchange_range"  value="33"  min="0" max="100"
    data-onchange='true'/><br/>
        <hr/>
        Range "slider" with <code>data-oninput='true'</code>
        calls the callback often as user moves the slider.<br/>
    <input type="range"  name="my_oninput_range"  value="33"  min="0" max="100"
    data-oninput='true'/>
        <hr/>
        
        Radio button group input with each input having <code>data-onchange='true'</code>
        calls the callback once whenever one radio button is clicked.<br/>
    <input type="radio" name="my_radio_group" value="abs"    data-onchange="true"/>ABS
        <input type="radio" name="my_radio_group" value="carbon" data-onchange="true"/>Carbon Fiber
    <input type="radio" name="my_radio_group" value="pla"    data-onchange="true" checked="checked"/>PLA
`
    window_onchange_id.onclick = function(){Editor.insert(
        window_onchange_top_comments +
`function the_cb(vals){ //vals contains name-value pairs for each input
 out(vals)
}
show_window({content:
`       + "`" +
        window_onchange_content + "`" +
`,           title: "show_window onchange & oninput",
             height: 440, x: 500, callback: the_cb})
` )}
    window_svg_id.onclick=function(){Editor.insert(
`//SVG Example 1: lots of shapes
function handle1(arg) { 
  if((arg.clicked_button_value === "background_id") ||
     (arg.clicked_button_value === "svg_id")) {
    append_in_ui("svg_id", svg_circle({cx: arg.offsetX, cy: arg.offsetY, r: 7}))    
  }
  else if (arg.clicked_button_value === "circ_id") {
     out("clicked on circ_id")
  }
  else if (arg.clicked_button_value === "ellip_id") {
     out("The user clicked on ellip_id")
  }
}

show_window({
    title: "SVG Example 1: Lots of shapes. Click to interact",
    content: svg_svg({id: "svg_id", height: 500, width: 500, html_class: "clickable", child_elements: 
       [//svg_rect({id: "background_id", html_class: "clickable", style:"position: relative; top: 0; right: 0; x: 0, y: 0, width: 500, height: 500, color: "white", border_width: 3, border_color: "yellow"}),
        svg_circle({id: "circ_id", html_class: "clickable", cx: 20, cy: 20, r: 30, color: "purple"}),  
        svg_ellipse({id: "ellip_id", html_class: "clickable", cx: 270, cy: 50, rx: 60, ry: 30, color: "orange"}),
        svg_line({x1: 30, y1: 30, x2: 100, y2: 200, color: "blue", width: 5}),
        svg_rect({x: 50, y: 50, width: 40, height: 100, color: "green", border_width: 3, border_color: "yellow", rx: 20, ry: 5}),
        svg_polygon({points: [[400, 10], [500, 10], [450, 100]], color: "lime", border_width: 3, border_color: "yellow"}),
        svg_polyline({points: [[400, 100], [480, 100], [450, 200], [480, 250]], color: "brown", width: 10}),
        svg_text({text: "this is a really long string", x: 50, y: 50, size: 30, color: "red", border_width: 2, border_color: "black", style: 'font-weight:bold;'}),
        svg_html({html: "<i style='font-size:30px;'>yikes</i>", x: 60, y: 100})
                      ]}),
    width: 600, // window width
    height: 200, // window height
    x: 0,        // Distance from left of DDE window to this window's left
    y: 100,      // Distance from top  of DDE window to this window's top
    callback: handle1
})

//SVG Example 2: draw circle then move it to clicked position.
function handle2 (vals){ 
   if(window.c_id) {
      set_in_ui("c_id.cx", vals.offsetX)
      set_in_ui("c_id.cy", vals.offsetY)
   }
   else {
      append_in_ui("s2_id", 
         svg_circle({id: "c_id", cx: vals.offsetX, cy: vals.offsetY, 
                     r: 15, color: "blue"}))
  }
}

show_window({
   title: "SVG Example 2: Click to draw and move circle",
   content: svg_svg({id: "s2_id", width: 600, height: 200, html_class: "clickable"}),
   x: 0,
   y: 330,
   width: 600,
   height: 200,
   callback: handle2
})

//SVG Example 3: draw line segments
var linex = null
var liney = null
function handle3 (vals){ 
   if(linex) {
      append_in_ui("s3_id", 
         svg_line({x1: linex, y1: liney, x2: vals.offsetX, y2: vals.offsetY}))
   }
   else {
      append_in_ui("s3_id", 
         svg_circle({cx: vals.offsetX, cy: vals.offsetY, 
                     r: 5, color: "blue"})) 
  }
  linex = vals.offsetX
  liney = vals.offsetY
}

show_window({
   title: "SVG Example 3: Click to draw lines",
   content: svg_svg({id: "s3_id", width: 400, height: 400, html_class: "clickable",
           child_elements: [
             svg_rect({x: 100, y: 100, width: 200, height: 50, color: "yellow"})
           ]}),
   x: 620,
   y: 100,
   callback: handle3
})
`)}
    window_close_all_id.onclick=close_all_show_windows
    show_web_page_id.onclick=function(){Editor.wrap_around_selection('show_web_page(', ')\n', '"hdrobotic.com"')}

    get_page_id.onclick=function(){Editor.insert(
`//Return the content of the given URL.
//Scripts on the page will not be run, forms and links
//generally won't work, CSS styles won't be applied.
get_page("http://www.ibm.com")

//get_page is also useful for getting data on the web.
//Most such date requires passwords or keys.
//A couple that don't
get_page("http://jsonip.com") //returns your IP address
get_page("http://www.nactem.ac.uk/software/acromine/dictionary.py?sf=BMI") //Medical acronym defs. Takes 15 seconds or so.

//If you're getting a string representing JSON, pass that string
//as the first argument to the function JSON.parse to get an object.

//Retrieve the html text of a url and pass it as
//the first argument to a callback
get_page_async("http://www.ibm.com", function(err, response, body){ out(body.length) })

//The default for the 2nd arg is the DDE function 'out'.
//out redenders its html string argument in the output pane
//so you will see much of the actual text and markup
//of a page, but not its images or other media.
`)}

    beep_id.onclick = function(){Editor.insert("beep()\n")}
    beep_options_id.onclick = function(){Editor.insert(
`beep({duration: 500,  //the default, in milliseconds, 
      frequency: 440, //the default, in Hertz. This is A above middle C.    
      volume: 1,      //the default, 0 to 1
      waveform: "triangle", //the default, other choices: "sine", "square", "sawtooth"
      callback: function(){beep({frequency:493.88})} //default=null, run at end of the beep
     })
`
    )}
    beeps_id.onclick = function(){Editor.insert(
`beeps(3, //default=1. number of times to beep using the default beep.
      function(){speak({speak_data: "Third Floor, home robots"})}) //default=null. callback when done
`)}
    speak_id.onclick=function(){Editor.wrap_around_selection(
        "speak({speak_data: ", "})\n", '"Hello Dexter"')}
    speak_options_id.onclick=function(){Editor.wrap_around_selection(
        'speak({speak_data: ', `,//default="hello"  can be a string, number, boolean, date, array, etc.
           volume: 1.0,   //default=1.0   0 to 1.0,
           rate: 1.0,     //default=1.0   0.1 to 10,
           pitch: 1.0,    //default=1.0   0 to 2,
           lang: "en-US", //default="en-US"
           voice: 0,      //default=0     0, 1, 2, or 3
           callback: function(event) {out('Dur in nsecs: ' + event.elapsedTime)}  //default=null  called when speech is done.
          })\n`, '[true, "It is", new Date()]')}
    recognize_speech_id.onclick = function(){Editor.insert(
`recognize_speech(
    {prompt: "Say something funny.", //Instructions shown to the speaker. Default "".
     click_to_talk: false, //If false, speech recognition starts immediately. Default true.
     only_once: false,     //If false, more than one phrase (after pauses) can be recognized. Default true.
     phrase_callback: undefined,     //Passed text and confidence score when user pauses. Default (undefined) prints text and confidence. If only_once=true, only this callback is called.
     finish_phrase: "finish",         //Say this to end speech reco when only_once=false.
     finish_callback: out})          //Passed array of arrays of text and confidence when user says "finish". Default null. Only called if only_once=false
`)}
    inspect_rootObject_id.onclick=function(){ inspect_new_object("Root") }
    train_id.onclick=dex.train
    build_application_id.onclick=ab.launch

    jobs_help_id.onclick      = function(){ open_doc(Job_doc_id) }

    test_suites_help_id.onclick = function(){ open_doc(TestSuite_doc_id) }
                                        
    run_all_test_suites_id.onclick     = function(){TestSuite.run_all()}
    // show_all_test_suites_id.onclick    = function(){TestSuite.show_all()}  //functionality obtained with Find and no selection
    insert_all_test_suites_id.onclick  = function(){TestSuite.insert_all()}
    find_test_suites_id.onclick        = function(){TestSuite.find_test_suites(Editor.get_javascript(true))}
    selection_to_test_id.onclick=function(){
       TestSuite.selection_to_test(Editor.get_javascript(true), Editor.get_javascript(), Editor.selection_start())
       }
    show_suite_statistics_id.onclick=TestSuite.statistics
    insert_test_suite_example_id.onclick=function(){
                    Editor.insert(TestSuite.suites[0].to_source_code() + "\n", null, true)
                    }
    //TestSuite.make_suites_menu_items() //because the ones that are defined from TestSuite.js can't make their menu items until dom is ready

    //Learn Javascript menu
    learn_js_help_id.onclick = function (){open_doc(learning_js_doc_id)}
      // Debugging menu
    dev_tools_id.onclick      = function(){show_window({content:
         "To see the output of <code>console.log</code> calls,<br/>" +
         "and for using the <code>debugger</code> breakpoint,<br/>" +
         "you must first open <i>Chrome Dev Tools</i> by:<br/>" +
         "clicking right anywhere and choosing <b>Inspect</b>.<p/>" +
         "Note: The <b>out</b> call is more useful in most cases than <code>console.log</code>. " +
         "It doesn't require <i>Chrome Dev Tools</i>.<br/>See <button>Insert&#9660;</button> <i>Print to output</i>.<br/><br/>" +
         "There's more help in the Documentation pane under <b>Debugging</b>.",
         title: "Debugging Help", width:430, height:270});
         open_doc(debugging_id)
          //WORKS! 800 is milliseconds for the animation to take.
         //$('#doc_contents_id').animate({scrollTop: $('#debugging_id').offset().top}, 800); //jquery solution that fails.
         //debugging_id.scrollIntoView(true) //does so instantaneously but it at least works.
         //However, it causes the DDE header to scroll off the top of the window
         //and a user can't get it back. If the user has not expanded any triangles
         //in the doc pane, then NOT calling scrollIntoView is fine, but if they have.
         //they likely won't see the Debugging content. Probably an interaction between
         //this new HTML5 stuff and jqwidgets
        // the below fail.
                                      //poitions the top of the elt at the top of the pane, which is good.
        //debugging_id.scrollIntoView({behavior:"smooth"});//doesn't  smooth scroll in chrome
        //$("#debugging_id").parent().animate({scrollTop: $("#debugging_id").offset().top}, 1000) //doesn't work
         } //fails: window.open("chrome://inspect/#apps")
    console_log_id.onclick     = function(){Editor.wrap_around_selection("console.log(", ")", '"Hello"')}
    debugger_id.onclick        = function(){Editor.insert("debugger;nnll");}
    comment_out_id.onclick     = function(){Editor.wrap_around_selection("/*", "*/")}
    comment_eol_id.onclick     = function(){Editor.insert("//")}
      //true & false menu
    true_id.onclick          = function(){Editor.insert(" true ")}
    false_id.onclick         = function(){Editor.insert(" false ")}
    and_id.onclick           = function(){Editor.insert(" && ")}
    or_id.onclick            = function(){Editor.insert(" || ")}
    not_id.onclick           = function(){Editor.insert("!")}

      //Math menu
    math_example_id.onclick = function(){Editor.insert("(-1.75 + 3) * 2\n")}
    plus_id.onclick         = function(){Editor.insert("+")}
    minus_id.onclick        = function(){Editor.insert("-")}
    times_id.onclick        = function(){Editor.insert("*")}
    divide_id.onclick       = function(){Editor.insert("/")}
    pi_id.onclick           = function(){Editor.insert("Math.PI")}
    parens_id.onclick       = function(){Editor.wrap_around_selection("(", ")")}

       //Compare Numbers menu
    compare_example_id.onclick = function(){Editor.insert("Math.PI >= 3\n")}
    less_id.onclick            = function(){Editor.insert("<")}
    less_or_equal_id.onclick   = function(){Editor.insert("<=")}
    equal_id.onclick           = function(){Editor.insert("==")}
    more_or_equal_id.onclick   = function(){Editor.insert(">=")}
    more_id.onclick            = function(){Editor.insert(">")}
    not_equal_id.onclick       = function(){Editor.insert("!=")}

       //Strings menu
    double_quote_id.onclick   = function(){Editor.wrap_around_selection('"', '"')}
    single_quote_id.onclick   = function(){Editor.wrap_around_selection("'", "'")}
    back_quote_id.onclick     = function(){Editor.wrap_around_selection('`', '`')}
    add_strings_id.onclick    = function(){Editor.insert("+")}

    string_length_id.onclick  = function(){Editor.insert(".length")}
    get_char_id.onclick       = function(){Editor.insert("[0]")}
    slice_id.onclick          = function(){Editor.insert(".slice(0, 3)")}
    split_id.onclick          = function(){Editor.insert('.split(" ")')}
    string_equal_id.onclick   = function(){Editor.insert('==')}
    starts_with_id.onclick    = function(){Editor.insert('.startsWith("ab")')}
    ends_with_id.onclick      = function(){Editor.insert('.endsWith("yz")')}
    replace_string_id.onclick = function(){Editor.insert('.replace(/ab/g, "AB")')}

       //Arrays menu
    make_array_id.onclick         = function(){Editor.insert('[5, "ab", 2 + 2]')}
    array_length_id.onclick       = function(){Editor.insert('.length')}
    get_array_element_id.onclick  = function(){Editor.insert('[0]')}
    set_array_element_id.onclick  = function(){Editor.insert('[0] = 42')}
    push_array_element_id.onclick = function(){Editor.insert('.push(9)')}

    //DATE
    new_date_day_id.onclick       = function(){Editor.insert('new Date("' + new Date().toString().slice(4, 15) + '")')}
    new_date_time_id.onclick      = function(){Editor.insert('new Date("' + new Date().toString().slice(4, 24) + '")')}
    new_date_ms_id.onclick        = function(){Editor.insert('new Date(3000)')}
    date_now_id.onclick           = function(){Editor.insert('Date.now()')}
    date_valueOf_id.onclick       = function(){Editor.insert('new Date().valueOf()')}
    date_toString_id.onclick      = function(){Editor.insert('new Date().toString()')}
    duration_hms_id.onclick       = function(){Editor.insert('new Duration("01:14:05")')}
    duration_ms_id.onclick        = function(){Editor.insert('new Duration(3000)')}
    duration_hmsms_id.onclick     = function(){Editor.insert('new Duration(1, 2, 5, 10)')}
    duration_get_ms_id.onclick    = function(){Editor.insert('new Duration(100).milliseconds')}
      //Variables menu
    variable_examples_id.onclick = function(){Editor.insert('var foo = 5 //initialize variable\nfoo //evals to 5\nfoo = "2nd" + " " + "val" ///set existing variable to new value\nfoo //now evals to "2nd val"\n')}
    init_variable_id.onclick     = function(){Editor.insert('var foo = ')}
    set_variable_id.onclick      = function(){Editor.insert('=')}

     //JS Objects menu
    js_object_example_id.onclick = function(){Editor.insert(
`var foo = {sam: 2, joe: 5 + 1} //make a JS object
foo      //evals to the new object
foo.sam  //evals to 2
foo.joe  //evals to 6
foo.joe = 99 //within foo, sets the value of joe to 99
foo.joe  //now evals to 99
foo["jo" + "e"] //compute the name to lookup. evals to 99
foo["jo" + "e"] = "jones" //set computed name to new value
foo.joe  //NOW evals to "jones"
foo.ted = 3 / 2  //adds a new name:value pair to foo.
foo //eval to see the latest values\n`)}
        js_object_cheat_sheet_id.onclick = function(){show_window({content:
`<pre>var foo = {sam: 2, joe: 5 + 1} //make a JS object
foo      //evals to the new object
foo.sam  //evals to 2
foo.joe  //evals to 6
foo.joe = 99    //within foo, sets the value of joe to 99
foo.joe  //now evals to 99
foo["jo" + "e"] //compute the name to lookup. evals to 99
foo["jo" + "e"] = "jones" //set computed name to new value
foo.joe         //NOW evals to "jones"
foo.ted = 3 / 2 //adds a new name:value pair to foo.
foo      //eval to see the latest values</pre>`,
            title: "JavaScript Object Cheat Sheet",
            width:  550,
            height: 280,
            x:      440,
            y:      370})}

    // Control Flow menu
    if_single_armed_id.onclick = function(){Editor.wrap_around_selection('if (1 + 1 == 2) {\n    ', '\n}')}
    if_multi_armed_id.onclick  = function(){Editor.wrap_around_selection('if (1 + 1 == 2) {\n    ', '\n}\nelse if (2 + 2 == 4){\n    \n}\nelse {\n    \n}\n')}
    for_number_of_times_id.onclick  = function(){Editor.wrap_around_selection('for(var i = 0; i < 10; i++){\n', '\n}\n')}
    for_through_array_elts_id.onclick = function(){Editor.wrap_around_selection('for(var x of [7, 4, 6]){\n', '\n}\n')}
    try_id.onclick             = function(){Editor.wrap_around_selection('try{\n', '\n} catch(err){handle errors here}')}
    dde_error_id.onclick       = function(){Editor.wrap_around_selection('dde_error(', ')', '"busted!"')}
    setTimeout_id.onclick=function(){Editor.insert('setTimeout(function(){console.log("waited 3 seconds")}, 3000)nnll')}

    // Function menu
    function_example_id.onclick   = function(){Editor.insert("function my_add(a, b){ // define the function 'my_add'\n    var sum = a + b\n    return sum\n}\nmy_add(2, 3) // run my_add's code with a=2 and b=3\n")}
    named_function_id.onclick     = function(){Editor.wrap_around_selection('function foo(x, y) {\n', '\n}\n')}
    anonymous_function_id.onclick = function(){Editor.wrap_around_selection('function(x, y) {\n', '\n}\n')}
    return_id.onclick             = function(){Editor.insert("return ")}
    //End of Learn JS menu
    //jobs menu
    show_robot_status_id.onclick   = Dexter.show_robot_status
    jobs_report_id.onclick         = function(){Job.report() }
    stop_all_jobs_id.onclick       = function(){Job.stop_all_jobs() }
    clear_stopped_jobs_id.onclick  = function(){Job.clear_stopped_jobs() }
    $("#real_time_sim_checkbox").jqxCheckBox({ checked: true })
    insert_job_example1_id.onclick = function(){Editor.insert(job_examples[1])}
    insert_job_example2_id.onclick = function(){Editor.insert(job_examples[2])}
    insert_job_example3_id.onclick = function(){Editor.insert(job_examples[3])}
    insert_job_example4_id.onclick = function(){Editor.insert(job_examples[4])}
    insert_job_example5_id.onclick = function(){Editor.insert(job_examples[5])}
    insert_job_example6_id.onclick = function(){Editor.insert(job_examples[6])}
    insert_job_example7_id.onclick = function(){Editor.insert(job_examples[7])}
    insert_job_example8_id.onclick = function(){Editor.insert(job_examples[8])}
    insert_job_example9_id.onclick = function(){Editor.insert(job_examples[9])}

    //Output_ops menu
    ping_id.onclick          = function(){ rde.ping()}
    cat_etc_hosts_id.onclick = function(){ rde.shell('cat /etc/hosts')}
    rosversion_id.onclick    = function(){ rde.shell('rosversion -d')}
    roswtf_id.onclick        = function(){ rde.shell('roswtf')}
    printenv_id.onclick      = function(){ rde.shell('printenv | grep ROS')}
    rqt_graph_id.onclick     = function(){ rde.shell('rqt_graph')}

    rosmsg_id.onclick        = function(){rde.shell('rosmsg list')}
    rosnode_id.onclick       = function(){rde.shell('rosnode list')}
    rospack_id.onclick       = function(){rde.shell('rospack list')}
    rosparam_id.onclick      = function(){rde.shell('rosparam list')}
    rosservice_is.onclick    = function(){rde.shell('rosservice list')}
    rostopic_id.onclick      = function(){rde.shell('rostopic list')}

    clear_output_id.onclick   = function(){clear_output(); myCodeMirror.focus()}

    javascript_pane_help_id.onclick    = function(){ open_doc(javascript_pane_doc_id)  }
    output_pane_help_id.onclick        = function(){ open_doc(output_pane_doc_id)  }
    documentation_pane_help_id.onclick = function(){ open_doc(documentation_pane_doc_id)  }
    simulate_pane_help_id.onclick      = function(){ open_doc(simulate_pane_doc_id)  }

    <!-- simulate pane -->
    //init_video()
    demo_id.onclick          = function() { if (demo_id.innerHTML == "Demo") {
                                                demo_id.innerHTML = "Stop"
                                                play_simulation()
                                            }
                                            else {
                                                  sim.enable_rendering = false;
                                                  demo_id.innerHTML = "Demo"
                                            }
                               }
    pause_id.onclick         = function (){
                                    if (pause_id.checked) { //it just got checked
                                           Job.go_button_state = false
                                    }
                                    else { Job.go_button_state = true }
                                 }
    go_id.onclick                 = Job.go

    videos_id.onchange            = video_changed


    font_size_id.onclick = function(){ $(".CodeMirror").css("font-size", this.value + "px")}
    //setTimeout(init_view_eye(), 1000) //todo now this file is loaded in sandbox.html. once I get rid of that and solve reuire issues, and on-ready for render process issues, revisit this.
    setTimeout(persistent_load, 100)
    setTimeout(function(){
         const val = persistent_get("save_on_eval")
         if(val) { //have to do this because, unlike the DOM doc, chrome/electron checks the box if you set it to false.
            save_on_eval_id.setAttribute("checked", val)
         }
         },
         200)
    setTimeout(Editor.restore_files_menu_paths_and_last_file, 300)
    setTimeout(function() { //ready is evaled in ui but load_files expects to start from sandbox.
                if (file_exists("dde_init.js")){ //we don't want to error if the file doesn't exist.
                    load_files("dde_init.js")
                }}, 400)
     setTimeout(check_for_latest_release, 100)
}
function check_for_latest_release(){
    const version_and_date_array = latest_release_version_and_date()
    if (version_and_date_array){
        if (version_and_date_array[0] != dde_version){
            const ver      = version_and_date_array[0]
            var   ver_date = version_and_date_array[1]
            ver_date       = date_to_mmm_dd_yyyy(ver_date) //ver_date.substring(0, ver_date.indexOf("T"))
            warning("The latest version of DDE is: " + ver +
                    " released: " + ver_date +
                    "<br/>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp;&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspbut you're running version: " + dde_version +
                    " released: " + dde_release_date +
                    "<br/>See the Doc pane for how to update.")
            open_doc(update_doc_id)
        }
        else { out("DDE is up to date with version: " + dde_version +
                   " released: " + dde_release_date) }
    }
    else { out("You're running DDE version: " + dde_version +
                " released: " + dde_release_date +
                "<br/>Can't reach web to check for latest release.")
    }
}

//misc fns called in ready.js
function email_bug_report(){
    var output = get_output()
    output = output.replace(/<br>/g, "\n")
    output = output.replace(/<p>/g,  "\n\n")
    output = output.replace(/<hr>/g, "_____________________________________\n")
    var bod = "Please describe your issue with DDE v " + dde_version + " here:\n\n\n" +
        "Below are the contents of your JavaScript and Output panes\n"+
        "to help us with the context of your comment.\n" +
        "We won't use any software you send us without your permission,\n" +
        "but delete below whatever you want to protect or\n" +
        "what you think is not relevant to the issue.\n\n" +
        "________JavaScript Pane______________\n" +
        Editor.get_javascript() +
        "\n\n________Output Pane__________________\n" +
        output
    bod = encodeURIComponent(bod)
    window.open("mailto:cfry@media.mit.edu?subject=DDE Suggestion&body=" + bod);
}

play_simulation = function(){
    sim.enable_rendering = true;
    render();
    //out("Demo just moves Dexter randomly.")
}



