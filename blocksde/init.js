// to load blocks:  load_files(__dirname + "/blocksde/init.js")

/*load_files(__dirname + "/blocksde/",
           "workspace.js",
           "category_newObject.js",
           "blocks2.js",
           "jsdb_newObject.js",  //should be after blocks2.js
           "js2b.js"
           )
*/
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
                  "background-color": "#4cc9fd",
                  "vertical-align":"50%",
                  onchange:"change_code_view_kind(event)"},
                  "<option value='JS'>JS</option><option value='Blocks'>Blocks</option><option value='DefEng'>DefEng</option>"
                  )
   )
    blocks_category_init()
    blocks_jsdb_init()
}

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
var the_codemirror_elt = null
var blocksde_dom_elt   = null



/*function toggle_text_blocks_display(){
  if (Editor.view == "text"){
      out("installing blocks")
      let src = Editor.get_javascript("auto") //must do before the switch
      let block_to_install
      try{
          if (src.trim() != ""){block_to_install = JS2B.js_to_blocks(src.trim())} //do before switching views in case this errors, we want to stay in text view
      }
      catch(err){
          warning("Could not convert JavaScript source to blocks due to error:<br/>" +
              err.message +
              "<br/> Make sure your JS text evals without errors before switching to blocks.")
          return
      }
      if (!the_codemirror_elt) { //haven't used blocksde yet so initialize it
         the_codemirror_elt = document.getElementsByClassName("CodeMirror")[0]
         blocksde_dom_elt = make_blocksde_dom_elt()
         let blocks_style_content = file_content(__dirname + "/blocksde/style2.css")
         let style_elt = make_dom_elt("style", {}, blocks_style_content) //"* { background-color:blue;}")
         blocksde_dom_elt.appendChild(style_elt)
         replace_dom_elt(the_codemirror_elt, blocksde_dom_elt) //must occur before calling make_workspace_instance
           //because that needs workspace_container_id to be installed in order to
           //install workspace_id inside it
         Workspace.make_workspace_instance(
         //the_codemirror_elt.offsetWidth,  the_codemirror_elt.offsetHeight //this vals are always zero
         )
      }
      else { replace_dom_elt(the_codemirror_elt, blocksde_dom_elt) }
      Workspace.inst.clear_blocks()
      if (block_to_install){ //we've got non empty src code so turn it into blocks.
          install_top_left_block(block_to_install)
      }
      text_blocks_toggle_id.style["background-color"] = "#AAFFAA"
      Editor.view = "blocks"
  }
  else { 
      out("installing text")
      let js = Workspace.inst.to_js()
      replace_dom_elt(blocksde_dom_elt, the_codemirror_elt)
      text_blocks_toggle_id.style["background-color"] = "#CCCCCC"
      Editor.set_javascript(js)
      Editor.view = "text"
      myCodeMirror.focus()
  }
}*/

function change_code_view_kind(event){
    let new_view_kind = code_view_kind_id.value
    console.log("new_view_kind: " + new_view_kind)
    if      (Editor.view == "JS"){ //old_view_kind
            if      (new_view_kind == "Blocks"){ js_to_blocks() }
            else if (new_view_kind == "DefEng"){ js_to_defeng() }
    }
    else if(Editor.view == "Blocks"){ //old_view_kind
            if      (new_view_kind == "JS"){ blocks_to_js() }
            else if (new_view_kind == "DefEng"){ blocks_to_defeng() }
    }
    else if(Editor.view == "DefEng") { //old_view_kind
            if      (new_view_kind == "JS")    { defeng_to_js() }
            else if (new_view_kind == "Blocks"){ defeng_to_blocks() }
    }
}

function js_to_blocks(){
        out("installing blocks")
        let src = Editor.get_javascript() //must do before the switch
        let block_to_install
        try{
            if (src.trim() != ""){block_to_install = JS2B.js_to_blocks(src.trim())} //do before switching views in case this errors, we want to stay in text view
        }
        catch(err){
            warning("Could not convert JavaScript source to blocks due to error:<br/>" +
                err.message +
                "<br/> Make sure your JS text evals without errors before switching to blocks.")
            return
        }
        if (!the_codemirror_elt) { //haven't used blocksde yet so initialize it
            the_codemirror_elt = document.getElementsByClassName("CodeMirror")[0]
            blocksde_dom_elt = make_blocksde_dom_elt()
            let blocks_style_content = file_content(__dirname + "/blocksde/style2.css")
            let style_elt = make_dom_elt("style", {}, blocks_style_content) //"* { background-color:blue;}")
            blocksde_dom_elt.appendChild(style_elt)
            replace_dom_elt(the_codemirror_elt, blocksde_dom_elt) //must occur before calling make_workspace_instance
            //because that needs workspace_container_id to be installed in order to
            //install workspace_id inside it
            Workspace.make_workspace_instance(
                //the_codemirror_elt.offsetWidth,  the_codemirror_elt.offsetHeight //this vals are always zero
            )
        }
        else { replace_dom_elt(the_codemirror_elt, blocksde_dom_elt) }
        Workspace.inst.clear_blocks()
        if (block_to_install){ //we've got non empty src code so turn it into blocks.
            install_top_left_block(block_to_install)
        }
        text_blocks_toggle_id.style["background-color"] = "#AAFFAA"
        Editor.view = "Blocks"
}

function blocks_to_js(){
    out("installing text")
    let js = Workspace.inst.to_js()
    replace_dom_elt(blocksde_dom_elt, the_codemirror_elt)
    text_blocks_toggle_id.style["background-color"] = "#CCCCCC"
    Editor.set_javascript(js)
    Editor.view = "JS"
    myCodeMirror.focus()
}

var old_source_defeng = "" //kludge to fake JS to defeng
function js_to_defeng(){
    let defeng = old_source_defeng //usualy wrong but ok for limited demos if you first do a defeng_to_js()
    Editor.set_javascript(defeng)
    Editor.view = "DefEng"
    myCodeMirror.focus()
}

function defeng_to_js(){
    let defeng = Editor.get_javascript()
    old_source_defeng = defeng //kludge for js_to_defeng
    let js
    try{js = DE.de_to_js(defeng)} //converts all whitespace to itself.
    catch(e) { //backout
        code_view_kind_id.value = "DefEng"
        Editor.view = "DefEng"
        myCodeMirror.focus()
        dde_error("The DefEng has an error so cannot change it to JS.")
        return
    }
    Editor.set_javascript(js)
    Editor.view = "JS"
    myCodeMirror.focus()
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
var {dde_error, warning} = require("./core/utils.js")

             
             