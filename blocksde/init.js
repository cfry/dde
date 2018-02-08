// load_files(__dirname + "/blocksde/init.js")

load_files(__dirname + "/blocksde/",
           "workspace.js",
           "category_newObject.js",
           "jsdb_newObject.js",
           "blocks2.js")

setTimeout(function(){
javascript_pane_header_wrapper_id.appendChild(
   make_dom_elt("span",
                {id:"text_blocks_toggle_id",
                 title: "Toggle editor view between text and blocks.",
                 "font-size":"20px",
                 "background-color": "#CCCCCC",
                 padding:"0px",
                 margin:"0px",
                 "vertical-align":"20%",
                 onclick:"toggle_text_blocks_display()"},
                " &boxbox; ")
)}, 300)
/*
show_window({content: make_html("div", {}, 
        `<input id='text_or_blocks_id' 
                type='checkbox'
                onchange='toggle_text_blocks_display()'/><span style='font-size:26px;'>&boxbox;</span>`),
             title: "", x: 740, y: 0, width: 80, height: 10})
*/
function make_blocksde_dom_elt(){
  return make_dom_elt("div", {id:"blocksde_id"},
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
               onmouseup="Workspace.toolkit_bar_mouseup(event)"
               /></td>
           <td style="margin:0px; padding:0px;"><div id="workspace_container_id" style="margin:0px; padding:0px; position:relative;"></div></td>
       </tr>
</table>
}`)
}
 
var the_codemirror_elt = null
var blocksde_dom_elt   = null


function toggle_text_blocks_display(){
  if (Editor.view == "text"){
      out("installing blocks")
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
      else {
            replace_dom_elt(the_codemirror_elt, blocksde_dom_elt)
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
  }
}
             
             