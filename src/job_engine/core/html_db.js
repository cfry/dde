
class html_db{
   static is_html_tag(tag){
       return html_db.tags.includes(tag)
   }
   static string_looks_like_html(str){
       str = str.trim()
       if(str.length == 0) { return false } //because we normally want to let th empty string be considered JS
       else if (str[0] !== "<") { return false }
       else if (!str.includes(">")) { return false }
       else {
           let length_to_examine = Math.min(15, str.length) //"blockquote.length == 10
           for(let i = 1; i < length_to_examine; i++){
               let char = str[i]
               if(!Utils.is_letter(char)){
                 let tag = str.substring(1, i)
                 tag = tag.toLowerCase()
                 if(this.is_html_tag(tag)) { return true }
                 else { return false }
               }
           }
           return false
       }
   }
   static compute_html_properties(){
     let result = []
     for(let prop in html_db.html_property_tag_map){
         result.push(prop)
     }
     return result
   }

    //"border" "color" "content" "height" "width"
   static intersection_of_html_and_css_properties(){
       return Utils.intersection(html_db.html_properties, html_db.css_properties)
   }
   static is_html_property(prop_name){
       if (prop_name.startsWith("data-")) { return true }
       else { return html_db.html_properties.includes(prop_name) }
   }
   static tag_has_property(tag, property){
       if(property.startsWith("data-")) { return true }
       let valid_tags = html_db.html_property_tag_map[property]
       if (!valid_tags) { return false }
       else if (valid_tags[0] == "all") { return true }
       else { return valid_tags.includes(tag) }
   }
   static properties_for_tag(tag){ //the properties specific to this tag. Does not grab "global properties"
       let result = []
       for(let prop_name in html_db.html_property_tag_map){
           let tags_for_this_prop_name = html_db.html_property_tag_map[prop_name]
           if(tags_for_this_prop_name.includes(tag)) { result.push(prop_name) }
       }
       return result
   }
   static is_css_property(prop_name){
        return  html_db.css_properties.includes(prop_name)
   }
   static tags = [
    "a",
    "abbr",
    "acronym",
    "address",
    "applet",
    "area",
    "article",
    "aside",
    "audio",
    "b",
    "base",
    "basefont",
    "bdi",
    "bdo",
    "bgsound",
    "big",
    "blink",
    "blockquote",
    "body",
    "br",
    "button",
    "canvas",
    "caption",
    "center",
    "cite",
    "code",
    "col",
    "colgroup",
    "command",
    "content",
    "data",
    "datalist",
    "dd",
    "del",
    "details",
    "dfn",
    "dialog",
    "dir",
    "div",
    "dl",
    "dt",
    "element",
    "em",
    "embed",
    "fieldset",
    "figcaption",
    "figure",
    "font",
    "footer",
    "form",
    "frame",
    "frameset",
    "h1",
    "head",
    "header",
    "hgroup",
    "hr",
    "html",
    "i",
    "iframe",
    "image",
    "img",
    "input",
    "ins",
    "isindex",
    "kbd",
    "keygen",
    "label",
    "legend",
    "li",
    "link",
    "listing",
    "main",
    "map",
    "mark",
    "marquee",
    "menu",
    "menuitem",
    "meta",
    "meter",
    "multicol",
    "nav",
    "nextid",
    "nobr",
    "noembed",
    "noframes",
    "noscript",
    "object",
    "ol",
    "optgroup",
    "option",
    "output",
    "p",
    "param",
    "picture",
    "plaintext",
    "pre",
    "progress",
    "q",
    "rp",
    "rt",
    "rtc",
    "ruby",
    "s",
    "samp",
    "script",
    "section",
    "select",
    "shadow",
    "slot",
    "small",
    "source",
    "spacer",
    "span",
    "strike",
    "strong",
    "style",
    "sub",
    "summary",
    "sup",
    "table",
    "tbody",
    "td",
    "template",
    "textarea",
    "tfoot",
    "th",
    "thead",
    "time",
    "title",
    "tr",
    "track",
    "tt",
    "u",
    "ul",
    "var",
    "video",
    "wbr",
    "xmp"]

    // adapted from https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes
    static html_property_tag_map = {
    accept:["form", "input"],
    "accept-charset":["form"],
    accesskey:["all"],
    action:["form"],
    align:["applet", "caption", "col", "colgroup", "hr", "iframe", "img", "table", "tbody", "td", "tfoot", "th", "thead", "tr"],
    alt:["applet", "area", "img", "input"],
    async:["script"],
    autocomplete:["form", "input"],
    autofocus:["button", "input", "keygen", "select", "textarea"],
    autoplay:["audio", "video"],
    bgcolor:["body", "col", "colgroup", "marquee", "table", "tbody", "tfoot", "td", "th", "tr"],
    border:["img", "object", "table"],
    buffered:["audio", "video"],
    challenge:["keygen"],
    charset	:["meta", "script"],
    checked	:["command", "input"],
    cite:["blockquote", "del", "ins", "q"],
    class:["all"],
    code:["applet"],
    codebase:["applet"],
    color:["basefont", "font", "hr"],
    cols:["textarea"],
    colspan:["td", "th"],
    content:["meta"],
    contenteditable:["all"],
    contextmenu:["all"],
    controls:["audio", "video"],
    coords:["area"],
    crossorigin:["audio", "img", "link", "script", "video"],
    data:["object"],
    "data-*":["all"],
    datetime:["del", "ins", "time"],
    default:["track"],
    defer:["script"],
    dir:["all"],
    dirname	:["input", "textarea"],
    disabled:["button", "command", "fieldset", "input", "keygen", "optgroup", "option", "select", "textarea"],
    download:["a", "area"],
    draggable:["all"],
    dropzone:["all"],
    enctype:["form"],
    for:["label", "output"],
    form:["button", "fieldset", "input", "keygen", "label", "meter", "object", "output", "progress", "select", "textarea"],
    formaction:["input", "button"],
    headers	:["td", "th"],
    height:["canvas", "embed", "iframe", "img", "input", "object", "video"],
    hidden:["all"],
    high:["meter"],
    href:["a", "area", "base", "link"],
    hreflang:["a", "area", "link"],
    "http-equiv":["meta"],
    icon:["command"],
    id:["all"],
    integrity:["link", "script"],
    ismap:["img"],
    itemprop:["all"],
    keytype:["keygen"],
    kind:["track"],
    label:["track"],
    lang:["all"],
    language:["script"],
    list:["input"],
    loop:["audio", "bgsound", "marquee", "video"],
    low	:["meter"],
    manifest:["html"],
    max:["input", "meter", "progress"],
    maxlength:["input", "textarea"],
    minlength:["input", "textarea"],
    media:["a", "area", "link", "source", "style"],
    method:["form"],
    min:["input", "meter"],
    multiple:["input", "select"],
    muted:["audio", "video"],
    name:["button", "form", "fieldset", "iframe", "input", "keygen", "object", "output", "select", "textarea", "map", "meta", "param"],
    novalidate:["form"],

    onabort: ["audio", "embed", "img", "object", "video"],
    onafterprint: ["body"],
    onbeforeprint: ["body"],
    onbeforeunload: ["body"],
    onblur: ["all"], //all visible elts
    oncanplay: ["audio", "embed", "object", "video"],	//Script to be run when a file is ready to start playing (when it has buffered enough to begin)
    oncanplaythrough: ["audio", "video"], //	Script to be run when a file can be played all the way to the end without pausing for buffering
    onchange: ["all"], //All visible elements.	Script to be run when the value of the element is changed
    onclick: ["all"], //All visible elements.	Script to be run when the element is being clicked
    oncontextmenu: ["all"], //All visible elements.	Script to be run when a context menu is triggered
    oncopy: ["all"], //All visible elements.	Script to be run when the content of the element is being copied
    oncuechange: ["track"], //	Script to be run when the cue changes in a <track> element
    oncut: ["all"], //All visible elements.	Script to be run when the content of the element is being cut
    ondblclick: ["all"], //All visible elements.	Script to be run when the element is being double-clicked
    ondrag: ["all"], //All visible elements.	Script to be run when the element is being dragged
    ondragend: ["all"], //All visible elements.	Script to be run at the end of a drag operation
    ondragenter: ["all"], //All visible elements.	Script to be run when an element has been dragged to a valid drop target
    ondragleave: ["all"], //All visible elements.	Script to be run when an element leaves a valid drop target
    ondragover: ["all"], //All visible elements.	Script to be run when an element is being dragged over a valid drop target
    ondragstart: ["all"], //All visible elements.	Script to be run at the start of a drag operation
    ondrop: ["all"], //All visible elements.	Script to be run when dragged element is being dropped
    ondurationchange: ["audio", "video"],	//Script to be run when the length of the media changes
    onemptied: ["audio", "video"],	//Script to be run when something bad happens and the file is suddenly unavailable (like unexpectedly disconnects)
    onended: ["audio", "video"],	//Script to be run when the media has reach the end (a useful event for messages like "thanks for listening")
    onerror: ["audio", "body", "embed", "img", "object", "script", "style", "video"], //	Script to be run when an error occurs
    onfocus: ["all"], 	//All visible elements.	Script to be run when the element gets focus
    onhashchange: ["body"], //Script to be run when there has been changes to the anchor part of the a URL
    oninput: ["all"], //	All visible elements.	Script to be run when the element gets user input
    oninvalid: ["all"], //	All visible elements.	Script to be run when the element is invalid
    onkeydown: ["all"], //	All visible elements.	Script to be run when a user is pressing a key
    onkeypress: ["all"], //	All visible elements.	Script to be run when a user presses a key
    onkeyup: ["all"], //	All visible elements.	Script to be run when a user releases a key
    onload: ["body", "iframe", "img", "input", "link", "script", "style"], //	Script to be run when the element is finished loading
    onloadeddata: ["audio", "video"],	//Script to be run when media data is loaded
    onloadedmetadata: ["audio", "video"],	//Script to be run when meta data (like dimensions and duration) are loaded
    onloadstart: ["audio", "video"],	//Script to be run just as the file begins to load before anything is actually loaded
    onmousedown: ["all"], //	All visible elements.	Script to be run when a mouse button is pressed down on an element
    onmousemove: ["all"], //	All visible elements.	Script to be run as long as the  mouse pointer is moving over an element
    onmouseout: ["all"], //	All visible elements.	Script to be run when a mouse pointer moves out of an element
    onmouseover: ["all"], //	All visible elements.	Script to be run when a mouse pointer moves over an element
    onmouseup: ["all"], //	All visible elements.	Script to be run when a mouse button is released over an element
    onmousewheel: ["all"], //	All visible elements.	Script to be run when a mouse wheel is being scrolled over an element
    onoffline: ["body"], //Script to be run when the browser starts to work offline
    ononline: ["body"], //Script to be run when the browser starts to work online
    onpagehide: ["body"], //Script to be run when a user navigates away from a page
    onpageshow: ["body"], //Script to be run when a user navigates to a page
    onpaste: ["all"], //	All visible elements.	Script to be run when the user pastes some content in an element
    onpause: ["audio", "video"],	//Script to be run when the media is paused either by the user or programmatically
    onplay: ["audio", "video"],	//Script to be run when the media is ready to start playing
    onplaying: ["audio", "video"],	//Script to be run when the media actually has started playing.
    onpopstate: ["body"], //Script to be run when the window's history changes.
    onprogress: ["audio", "video"],	//Script to be run when the browser is in the process of getting the media data
    onratechange: ["audio", "video"],	//Script to be run each time the playback rate changes (like when a user switches to a slow motion or fast forward mode).
    onreset: ["form"], //	Script to be run when a reset button in a form is clicked.
    onresize: ["body"], //Script to be run when the browser window is being resized.
    onscroll: ["all"], //Script to be run when an element's scrollbar is being scrolled
    onsearch: ["input"], //	Script to be run when the user writes something in a search field (for <input="search">)
    onseeked: ["audio", "video"],	//Script to be run when the seeking attribute is set to false indicating that seeking has ended
    onseeking: ["audio", "video"],	//Script to be run when the seeking attribute is set to true indicating that seeking is active
    onselect: ["all"], //Script to be run when the element gets selected
    onshow: ["menu"], //	Script to be run when a <menu> element is shown as a context menu
    onstalled: ["audio", "video"],	//Script to be run when the browser is unable to fetch the media data for whatever reason
    onstorage: ["body"], //Script to be run when a Web Storage area is updated
    onsubmit: ["form"], //	Script to be run when a form is submitted
    onsuspend: ["audio", "video"],	//Script to be run when fetching the media data is stopped before it is completely loaded for whatever reason
    ontimeupdate: ["audio", "video"],	//Script to be run when the playing position has changed (like when the user fast forwards to a different point in the media)
    ontoggle: ["details"], //	Script to be run when the user opens or closes the <details> element
    onunload: ["body"], //Script to be run when a page has unloaded (or the browser window has been closed)
    onvolumechange: ["audio", "video"],	//Script to be run each time the volume of a video/audio has been changed
    onwaiting: ["audio", "video"],	//Script to be run when the media has paused but is expected to resume (like when the media pauses to buffer more data)
    onwheel: ["all"],

    open:["details"],
    optimum:["meter"],
    pattern:["input"],
    ping:["a", "area"],
    placeholder:["input", "textarea"],
    poster:["video"],
    preload:["audio", "video"],
    radiogroup:["command"],
    readonly:["input", "textarea"],
    rel:["a", "area", "link"],
    required:["input", "select", "textarea"],
    reversed:["ol"],
    rows:["textarea"],
    rowspan:["td", "th"],
    sandbox:["iframe"],
    scope:["th"],
    scoped:["style"],
    seamless:["iframe"],
    selected:["option"],
    shape:["a", "area"],
    size:["input", "select"],
    sizes:["link", "img", "source"],
    slot:["all"],
    span:["col", "colgroup"],
    spellcheck:["all"],
    src:["audio", "embed", "iframe", "img", "input", "script", "source", "track", "video"],
    srcdoc:["iframe"],
    srclang:["track"],
    srcset:["img"],
    start:["ol"],
    step:["input"],
    style:["all"],
    summary:["table"],
    tabindex:["all"],
    target:["a", "area", "base", "form"],
    title:["all"],
    type:["button", "input", "command", "embed", "object", "script", "source", "style", "menu"],
    usemap:["img", "input", "object"],
    value:["button", "option", "input", "li", "meter", "progress", "param"],
    width:["canvas", "embed", "iframe", "img", "input", "object", "video"],
    wrap:["textarea"]
    }

    static css_properties = [
    "all",
    "background", "background-attachment", "background-clip", "background-color",
    "background-image", "background-origin", "background-position", "background-repeat",
    "background-size",
    "border", "border-bottom", "border-bottom-color",
    "border-bottom-left-radius", "border-bottom-right-radius", "border-bottom-style",
    "border-bottom-width", "border-collapse", "border-color", "border-image",
    "border-image-outset", "border-image-repeat", "border-image-slice", "border-image-source",
    "border-image-width", "border-left", "border-left-color", "border-left-style",
    "border-left-width", "border-radius", "border-right", "border-right-color",
    "border-right-style", "border-right-width", "border-spacing", "border-style", "border-top",
    "border-top-color", "border-top-left-radius", "border-top-right-radius", "border-top-style",
    "border-top-width", "border-width",
    "bottom", "box-shadow",
    "caption-side", "clear",
    "clip", "color", "content", "counter-increment", "counter-reset", "cursor",
    "direction", "display", "empty-cells",
    "float", "font", "font-family", "font-size",
    "font-size-adjust", "font-stretch", "font-style", "font-synthesis", "font-variant",
    "font-weight",
    "height",
    "left", "letter-spacing", "line-height",
    "list-style", "list-style-image", "list-style-position", "list-style-type",
    "margin", "margin-bottom", "margin-left", "margin-right", "margin-top",
    "max-height", "max-width", "min-height", "min-width",
    "opacity", "orphans",
    "outline", "outline-color", "outline-style", "outline-width", "overflow",
    "padding", "padding-bottom", "padding-left", "padding-right", "padding-top",
    "page-break-after", "page-break-before", "page-break-inside", "position",
    "quotes",  "right",
    "table-layout", "text-align", "text-decoration", "text-indent", "text-transform",
    "top", "transform", "transform-origin", "transition", "transition-delay",
    "transition-duration", "transition-property", "transition-timing-function",
    "unicode-bidi", "vertical-align", "visibility",
    "white-space", "widows", "width", "word-spacing",
    "z-index"
    ]


//from https://davidwalsh.name/convert-html-stings-dom-nodes
//innerHTML can be a string, a Node (elt) or an array of Nodes

//only uses the first top level element
    static html_to_dom_elt(html, use_first_top_level_elemment_only=true){
        let frag = document.createRange().createContextualFragment(html)
        if (use_first_top_level_elemment_only) {
            return frag.firstChild
        }
        else { return frag }
    }

    static replace_dom_elt(old_elt, new_elt){
        old_elt.parentNode.replaceChild(new_elt, old_elt)
    }


    static insert_elt_before(new_elt, old_elt){
        old_elt.parentNode.insertBefore(new_elt, old_elt)
    }

//works even when old_elt is the only elt in its parent.
    static insert_elt_after(new_elt, old_elt){
        old_elt.parentNode.insertBefore(new_elt, old_elt.nextSibling);
    }

    static remove_dom_elt(elt){ elt.parentNode.removeChild(elt) }

    static is_dom_elt(obj){
      return obj instanceof HTMLElement
    }

    static is_dom_elt_ancestor(possible_ancestor, starting_elt){
        if (possible_ancestor == null) { return false}
        else if(possible_ancestor == starting_elt) { return true }
        else { return html_db.is_dom_elt_ancestor(possible_ancestor.parentNode, starting_elt) }
    }

    //find the first child of elt that has class
    static dom_elt_child_of_class(elt, a_class){
       for(let kid of elt.children){
           if (kid.classList.contains(a_class)) { return kid }
       }
       return null
    }

    static dom_elt_children_of_class(elt, a_class){
        let result = []
        for(let kid of elt.children){
            if (kid.classList.contains(a_class)) { result.push(kid) }
        }
        return result
    }

    //focuses on the first elt of a_tag name that it finds.
    //exludes elt in the returned results.
    //searchers all descendents of elt.
    //casing of a_tag doesn't matter.
    static focus_on_descendant_with_tag(elt, a_tag="input"){
        let sub_elts = elt.getElementsByTagName(a_tag)
        if(sub_elts.length > 0) {
          sub_elts[0].focus()
        }
    }

    static dom_elt_descendant_of_classes(elt, classes){
        if(classes.length == 0) { shouldnt("html_db.dom_elt_descendant_of_classes passed empty classes array.") }
        else {
            let next_class = classes[0]
            let result_maybe = html_db.dom_elt_child_of_class(elt, next_class)
            if(!result_maybe) {
                error("html_db.dom_elt_descendant_of_classes passed a class: " + next_class +
                      "that is not present in elt: " + elt)
            }
            else if(classes.length == 1) { return result_maybe }
            else { return html_db.dom_elt_descendant_of_classes(result_maybe, classes.slice(1)) }
        }
    }


//if elt has a_class. return the elt, else go up the parentNode until you find one
//or, if not, return null
    static closest_ancestor_of_class(elt, a_class){
        if (elt == null) { return null }
        else if(elt.classList && elt.classList.contains(a_class)) { return elt }
        else if (elt.parentNode) { return html_db.closest_ancestor_of_class(elt.parentNode, a_class) }
        else return null
    }


//possibly includes elt itself.
    static ancestors_of_class(elt, a_class){
        let result = []
        while(true) {
            if (elt == null) { break }
            else if(elt.classList && elt.classList.contains(a_class)) { result.push(elt) }
            elt = elt.parentNode
        }
        return result
    }
} //end html_db class

globalThis.html_db = html_db
html_db.html_properties = html_db.compute_html_properties()


//documented in dde3
function make_html(tag, properties, innerHTML="", ending="auto", error=false){
    let tag_is_valid
    let has_css = false
    if(html_db.is_html_tag(tag)){ tag_is_valid = true }
    else {
        tag_is_valid = false
        warning_or_error("make_html called with tag: " + tag +
            "<br/> that's not in DDE's database.",
            error)
    }
    let html_props = {}
    let css_props  = {}
    let direct_html_props = null  //this might get set to a string OR a js literal obj.
    let direct_css_props  = null
    for (let prop_name in properties){
        if      (prop_name == "html_properties") { direct_html_props = properties["html_properties"] }
        else if (prop_name == "style")           { direct_css_props  = properties["style"] }
        else if(tag_is_valid) {
            if(html_db.is_html_property(prop_name)) { //this clause checks for css overlap
                let tag_has_prop = html_db.tag_has_property(tag, prop_name)
                if(html_db.is_css_property(prop_name)) { //uh-oh, valid html and css prop but ...
                    if(tag_has_prop) { //double uh-oh, this prop is good for this tag
                        warning_or_error("make_html called with tag: " + tag +
                            " and property: " + prop_name +
                            " which is valid HTML and css. ", error)
                        //didn't error so:
                        warning(prop_name + " being used as CSS property. " +
                            "<br/> Stick it in 'html_properties' to force it to be HTML" +
                            "<br/> or put it in 'style' property to get rid of this warning."
                        )
                        css_props[prop_name] = properties[prop_name]
                    }
                    else { //ok prop is not an html prop for this tag so css wins, no error
                        css_props[prop_name] = properties[prop_name]
                    }
                }
                else { html_props[prop_name] = properties[prop_name] } //no conflict with css
            }
            else if(html_db.is_css_property(prop_name)) {
                css_props[prop_name] = properties[prop_name]
            }
            else {
                warning_or_error("make_html called with tag of: " + tag +
                    " with a property of: " + prop_name +
                    " that is not in DDE's database.", error)
                warning(prop_name + " treated as HTML property." +
                    "<br/> Stick it in the 'style' property to force it to be CSS." ) //if the above doesn't error, give more info
                html_props[prop_name] = properties[prop_name]
            }
        }
        else { //invalid html tag which either caused an error before here or has already been warned against
            //so we're skating on thin ice. Prefer HTML here. User has already been warned that
            //tag is unknown, so no fancy error messages.
            if(html_db.is_css_property(prop_name))  { //if a prop is both a css and and html prop, make it to a css prop
                css_props[prop_name] = properties[prop_name]
            }
            else if     (html_db.is_html_property(prop_name)) { html_props[prop_name] = properties[prop_name] }
            else {
                warning_or_error("make_html called with tag of: " + tag +
                    " with a property of: " + prop_name +
                    " that is not in DDE's database.", error)
                warning(prop_name + " treated as an HTML property." +
                    "<br/> Stick it in the 'style' property to force it to be CSS.")
                html_props[prop_name] = properties[prop_name]
            }
        }
    }
    //tag validated, html_props & css_props validated and filled in, now use them to
    //generate the html
    let result = "<" + tag
    if (direct_html_props){
        if (typeof(direct_html_props) == "string"){
            result += " " + direct_html_props
        }
        else {
            for (let attr in direct_html_props){
                result += " " + attr + '="' + direct_html_props[attr] + '"'
            }
        }
    }
    for (let attr in html_props){
        let val = html_props[attr]
        if ((typeof(val) == "string") && val.includes('"')) {
            val = Utils.replace_substrings(val, '"', '\"')
        }
        result += " " + attr + '="' + val + '"'
    }
    if (direct_css_props) {
        result += ' style="'
        if (typeof(direct_css_props) == "string"){
            result += direct_css_props
            has_css = true
        }
        else {
            for (let attr in direct_css_props){
                result += (has_css ? " ": "") + attr + ':' + direct_css_props[attr] + ';'
                has_css = true
            }
        }
        has_css = true
    }
    for(let attr in css_props){
        if (!has_css) {
            result += ' style="'  //before first style prop
        }
        result += (has_css ? " ": "") + attr + ":" + css_props[attr] + ";" //avoid extra space at end
        has_css = true
    }
    if (ending != "none") {
        if (has_css) { result += '"' }
    }
    if      (ending == "none") {}
    else if (ending == "end_style_only") {} //already done above in (ending != "none")
    else if (ending == "end_properties_only") {
        if (innerHTML != "") { dde_error('make_html called with ending="end_properties_only" but with a non-empty innerHTML.') }
        else { result += ">" }
    }
    else if (ending == "short") {
        if (innerHTML != "") { dde_error('make_html called with ending="short" but with a non-empty innerHTML.') }
        else { result += "/>" }
    }
    else if (ending == "long") { //works whether or not innerHTML exists
        result += ">" + innerHTML + "</" + tag + ">"
    }
    else if (ending == "auto") { //long or short depending on innerHTML presence.
        if (innerHTML == "") { result += "/>" }
        else { result += ">" + innerHTML + "</" + tag + ">"}
    }
    else { shouldnt("make_html got invalid ending: " + ending) }
    return result
}

globalThis.make_html = make_html


    /* from stack overflow
    function htmlToElement(html) {
        var template = document.createElement('template');
        html = html.trim(); // Never return a text node of whitespace as the result
        template.innerHTML = html;
        return template.content.firstChild;
    }
    */
//documented in dde3
function make_dom_elt(tag, properties, innerHTML="", ending="auto", error=false){
    let html_string = make_html(tag, properties, "", ending, error)
    let result = html_db.html_to_dom_elt(html_string)
    if(typeof(innerHTML) == "string")   { result.innerHTML = innerHTML  }
    else if (innerHTML instanceof Node) { result.appendChild(innerHTML) }
    else if (Array.isArray(innerHTML)) {
        for(elt of innerHTML){
            result.appendChild(elt)
        }
    }
    return result
}
globalThis.make_dom_elt = make_dom_elt