// to load blocks and get editor view menu in editor header.
// load_files(__dirname + "/blocksde/init.js")
// blocks_init()
//
/*load_files(__dirname + "/blocksde/",
           "workspace.js",
           "category_newObject.js",
           "blocks2.js",
           "jsdb_newObject.js",  //should be after blocks2.js
           "js2b.js"
           )
*/

import "./workspace.js"
import "./category_newObject.js"
import "./blocks2.js"
import "./jsdb_newObject.js"  //should be after blocks2.js
import "./js2b.js"

//import {make_dom_elt} from "../job_engine/core/html_db.js" //in DDE4, make_dom_elt is global so don't attempt to import int

//called from dde_init.js IFF we're in dde platform.
function blocks_init(){
   javascript_pane_header_wrapper_id.appendChild(
   /*make_dom_elt("span",
                {id:"text_blocks_toggle_id",
                 title: "Toggle editor view between text and blocks.",
                 "font-size":"20px",
                 "background-color": "#CCCCCC",
                 padding:"0px",
                 margin:"0px",
                 "vertical-align":"20%",
                 onclick:"toggle_text_blocks_display()"},
                " &boxbox; "))*/
    make_dom_elt("select",
                  {id:"code_view_kind_id",
                  title:"Translate the Editor pane to a different syntax for viewing your code.",
                  "background-color": "#93dfff",
                  "vertical-align":"50%",
                  onchange:"change_code_view_kind(event)"},
        "<option value='JS'>JS</option><option value='HCA'>HCA</option>" //"<option value='JS'>JS</option><option value='Blocks'>Blocks</option><option value='DefEng'>DefEng</option><option value='HCA'>HCA</option>"
                  )
   )
    blocks_category_init()
    blocks_jsdb_init()
}

globalThis.blocks_init = blocks_init

function make_blocksde_dom_elt(){
  return make_dom_elt("div", {id:"blocksde_id", width:"100%", height:"100%"},
`<div id="category_menu_id"
     onmouseover="category_menu_id.style.display='block'"
     onmouseout="category_menu_id.style.display='none'"
     style="display:none; position:absolute; left:10px; top:30px; z-index:2;
            width:100px; height:400px; background-color:#EEEEEE;padding:10px; font-family:sans-serif;">Categories</div>
<div id="block_type_menu_id"
     onmouseover="block_type_menu_id.style.display='block'; category_menu_id.style.display='block';"
     onmouseout ="block_type_menu_id.style.display='none';  category_menu_id.style.display='none'"
     style="display:none; position:absolute; left:110px; top:30px; z-index:3;
            width:120px; height:400px; background-color:#DDDDDD;padding:10px; font-family:sans-serif;">Block Types</div>


<table><tr><td style="margin:0px; padding:0px;"><div id="toolkit_bar_id" style="margin:0px; padding:0px; width:20px; height:400px;background-color:#DDDDDD;"
               onmouseover="Workspace.toolkit_bar_mouseover(event)"
              
               /></td>
           <td style="margin:0px; padding:0px;"><div id="workspace_container_id" style="margin:0px; padding:0px; position:relative;"> 
           </div></td>
       </tr>
</table>
`)
}
// onmouseup="Workspace.toolkit_bar_mouseup(event)"
var blocksde_dom_elt   = null


function change_code_view_kind(event){
    let new_view_kind = code_view_kind_id.value
    console.log("new_view_kind: " + new_view_kind)
    if      (Editor.view === "JS"){ //old_view_kind
            if      (new_view_kind === "Blocks"){ js_to_blocks() }
            else if (new_view_kind === "DefEng"){ js_to_defeng() }
            else if (new_view_kind === "HCA")   { js_to_HCA() }
    }
    else if(Editor.view === "Blocks"){ //old_view_kind
            if      (new_view_kind === "JS")    { blocks_to_js() }
            else if (new_view_kind === "DefEng"){ blocks_to_defeng() }
            else if (new_view_kind === "HCA")   { blocks_to_HCA() }
    }
    else if(Editor.view === "DefEng") { //old_view_kind
            if      (new_view_kind === "JS")    { defeng_to_js() }
            else if (new_view_kind === "Blocks"){ defeng_to_blocks() }
            else if (new_view_kind === "HCA")   {
                code_view_kind_id.value = "DefEng"
                warning("Sorry, can't convert from Definitive English to HCA yet.")
            }
    }
    else if(Editor.view === "HCA") {
            if      (new_view_kind === "JS")    { HCA_to_js() }
            else if (new_view_kind === "Blocks"){ HCA_to_blocks() }
            else if (new_view_kind === "DefEng"){
                code_view_kind_id.value = "HCA"
                warning("Sorry, can't convert from HCA to Definitive English yet.")
            }
    }
}

globalThis.change_code_view_kind = change_code_view_kind

function js_to_blocks(){
        out("installing blocks")
        let js = Editor.get_javascript() //must do before the switch
        let block_to_install
        try{
            if (js.trim() !== ""){block_to_install = JS2B.js_to_blocks(js.trim())} //do before switching views in case this errors, we want to stay in text view
        }
        catch(err){
            warning("Could not convert JavaScript source to blocks due to error:<br/>" +
                err.message +
                "<br/> Make sure your JS text evals without errors before switching to blocks.")
            return
        }
        if (!blocksde_dom_elt) { //haven't used blocksde yet so initialize it
            blocksde_dom_elt = make_blocksde_dom_elt()
            let blocks_style_content = read_file(__dirname + "/blocksde/style2.css")
            let style_elt = make_dom_elt("style", {}, blocks_style_content) //"* { background-color:blue;}")
            blocksde_dom_elt.appendChild(style_elt)
            html_db.replace_dom_elt(Editor.the_CodeMirror_elt, blocksde_dom_elt) //must occur before calling make_workspace_instance
            //because that needs workspace_container_id to be installed in order to
            //install workspace_id inside it
            Workspace.make_workspace_instance(
                //Editor.the_CodeMirror_elt.offsetWidth,  Editor.the_CodeMirror_elt.offsetHeight //this vals are always zero
            )
        }
        else { html_db.replace_dom_elt(Editor.the_CodeMirror_elt, blocksde_dom_elt) }
        Workspace.inst.clear_blocks()
        if (block_to_install){ //we've got non empty js code so turn it into blocks.
            install_top_left_block(block_to_install)
        }
        Editor.view = "Blocks"
}

function js_to_HCA(){
    HCAObjDef.js_to_HCA()
}

function HCA_to_js(){
    HCAObjDef.hca_to_js()
}

function HCA_to_blocks(){
    let js = HCA.get_javascript()
    //the below mostly lifed from js_to_blocks
    let block_to_install
    try{
        if (js.trim() !== ""){block_to_install = JS2B.js_to_blocks(js.trim())} //do before switching views in case this errors, we want to stay in text view
    }
    catch(err){
        warning("Could not convert JavaScript source to blocks due to error:<br/>" +
            err.message +
            "<br/> Make sure your JS text evals without errors before switching to blocks.")
        HCA_to_js()
        return
    }
    if (!blocksde_dom_elt) { //haven't used blocksde yet so initialize it
        blocksde_dom_elt = make_blocksde_dom_elt()
        let blocks_style_content = read_file(__dirname + "/blocksde/style2.css")
        let style_elt = make_dom_elt("style", {}, blocks_style_content) //"* { background-color:blue;}")
        blocksde_dom_elt.appendChild(style_elt)
        html_db.replace_dom_elt(globalThis.HCA_dom_elt, blocksde_dom_elt) //must occur before calling make_workspace_instance
        //because that needs workspace_container_id to be installed in order to
        //install workspace_id inside it
        Workspace.make_workspace_instance()
    }
    else { html_db.replace_dom_elt(globalThis.HCA_dom_elt, blocksde_dom_elt) }
    Workspace.inst.clear_blocks()
    if (block_to_install){ //we've got non empty js code so turn it into blocks.
        install_top_left_block(block_to_install)
    }
    Editor.view = "Blocks"
}

function blocks_to_HCA(){
    let js = Workspace.inst.to_js()
    let js_obj
    try { js_obj = JSON.parse(js) }
    catch(err){
        //code_view_kind_id.value = "JS"
        warning("Sorry, you've attempted to pass an invalid JSON string to HCA.<br/>You can use HCA if you start with an emppty editor buffer.")
        blocks_to_js()
        return
    }
    globalThis.HCA_dom_elt = HCA.make_HCA_dom_elt()
    html_db.replace_dom_elt(Editor.the_CodeMirror_elt, globalThis.HCA_dom_elt)
    Editor.view = "HCA"
    HCA.init(js_obj, //todo won't work.
             "js_object from blocks" //from error message
    )
    globalThis.HCA_dom_elt.focus()
}

function blocks_to_js(){
    out("installing text")
    let js = Workspace.inst.to_js()
    js = js_beautify(js)
    html_db.replace_dom_elt(blocksde_dom_elt, Editor.the_CodeMirror_elt)
    Editor.set_javascript(js)
    Editor.view = "JS"
    Editor.myCodeMirror.focus()
}



var old_source_defeng = "" //kludge to fake JS to defeng
function js_to_defeng(){
    if(old_source_defeng === ""){
        warning("Can't convert from JavaScript to Definitive English yet.<br/>Starting new Definitive English editor.")
    }
    else {
        warning("Can't convert from JavaScript to Definitive English yet.<br/>Using previous Definitive English.")
    }
    let defeng = old_source_defeng //usually wrong but ok for limited demos if you first do a defeng_to_js()
    Editor.set_javascript(defeng)
    Editor.view = "DefEng"
    out(DE.a_few_examples()) //show some doc to help with demoing
    Editor.myCodeMirror.focus()
}

function defeng_to_js(){
    let defeng = Editor.get_javascript()
    old_source_defeng = defeng //kludge for js_to_defeng
    let js
    try{js = DE.de_to_js(defeng)} //converts all whitespace to itself.
    catch(e) { //backout
        code_view_kind_id.value = "DefEng"
        Editor.view = "DefEng"
        Editor.myCodeMirror.focus()
        dde_error("The DefEng has an error so cannot change it to JS.")
        return
    }
    js = js_beautify(js)
    Editor.set_javascript(js)
    Editor.view = "JS"
    Editor.myCodeMirror.focus()
}

function blocks_to_defeng(){
    blocks_to_js()
    js_to_defeng()
}

function defeng_to_blocks(){
    old_source_defeng = Editor.get_javascript("auto") //kludge
    defeng_to_js()
    js_to_blocks()
}
