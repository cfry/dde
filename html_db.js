var html_db = class html_db{
   static is_html_tag(tag){
       return html_db.tags.includes(tag)
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
       return intersection(html_db.html_properties, html_db.css_properties)
   }
   static is_html_property(prop_name){
       if (prop_name.startsWith("data-")) { return true }
       else { return html_db.html_properties.includes(prop_name) }
   }
   static tag_has_property(tag, property){
       let valid_tags = html_db.html_property_tag_map[property]
       if (valid_tags[0] == "all") { return true }
       else { return valid_tags.includes(tag) }
   }
   static properties_for_tag(tag){ //the properties specific to this tag. Does not grab "global properties"
       result = []
       for(let prop_name in html_db.html_property_tag_map){
           let tags_for_this_prop_name = html_db.html_property_tag_map[prop_name]
           if(tags_for_this_prop_name.includes(tag)) { result.push(prop_name) }
       }
       return result
   }
   static is_css_property(prop_name){
        return  html_db.css_properties.includes(prop_name)
   }
}

html_db.tags = [
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
html_db.html_property_tag_map = {
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

html_db.html_properties = html_db.compute_html_properties()

html_db.css_properties = [
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

/* obslete version that takes bot attributes and style objects
function make_html(tagName, attributes={}, style={}, innerHTML="", ending="auto") {
    let result = "<" + tagName
    for (let attr in attributes){
        result += " " + attr + '="' + attributes[attr] + '"'
    }
    let has_style = false
    for(let attr in style){
        if (!has_style) { result += ' style="' }
        result += (has_style ? " ": "") + attr + ":" + style[attr] + ";" //avoid extra space at end
        has_style = true
    }
    if (ending != "none") {
        if (has_style) { result += '"' }
    }
    if      (ending == "none") {}
    else if (ending == "close_quote") {} //already done above in ending != "none"
    else if (ending == "end_attributes_only") {
        if (innerHTML != "") { dde_error('make_html called with ending="end_attributes_only" but with a non-empty innerHTML.') }
        else { result += ">" }
    }
    else if (ending == "short") {
        if (innerHTML != "") { dde_error('make_html called with ending="short" but with a non-empty innerHTML.') }
        else { result += "/>" }
    }
    else if (ending == "long") { //works whether or not innerHTML exists
        result += ">" + innerHTML + "</" + tagName + ">"
    }
    else if (ending == "auto") { //long or short depending on innerHTML presence.
        if (innerHTML == "") { result += "/>" }
        else { result += ">" + innerHTML + "</" + tagName + ">"}
    }
    else { shouldnt("make_html got invalid ending: " + ending) }
    return result
}
*/

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
                let tag_has_prop = html_db.tag_has_property("tag", prop_name)
                if(html_db.is_css_property(prop_name)) { //uh-oh, valid html and css prop but ...
                   if(tag_has_prop) { //double uh-oh, this prop is good for this tag
                      warning_or_error("make_html called with tag: " + tag +
                                       " and property: " + prop_name +
                                       " which is valid HTML and css. ", error)
                       //didn't error so:
                       warning(prop_name + " being used as CSS property. " +
                              "<br/>" + "Stick it in 'html_properties' to force it to be HTML.")
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
                has_css = true
            }
            else {
               warning_or_error("make_html called with tag of + tag + " +
                                " with a property of: " + prop_name +
                                " that is not in DDE's database.", error)
               warning(prop_name + " treated as HTML property." +
                       "<br/> Stick it in the 'style' properto to force it to be CSS." ) //if the above doesn't error, give more info
               html_props[prop_name] = properties[prop_name]
            }
        }
        else { //invalid html tag which either caused an error before here or has already been warned against
               //so we're skating on thin ice. Prefer HTML here. User has already been warned that
               //tag is unknown, so no fancy error messages.
            if(html_db.is_css_property(prop_name))  { //if a prop is both a css and and html prop, make it to a css prop
                has_css = true
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
        result += " " + attr + '="' + html_props[attr] + '"'
    }
    let first_css_prop = true
    if (direct_css_props) {
        result += ' style="'
        if (typeof(direct_css_props) == "string"){
            result += direct_css_props
            first_css_prop = false
        }
        else {
            for (let attr in direct_css_props){
                result += (first_css_prop ? "": " ") + attr + ':' + direct_css_props[attr] + ';'
                first_css_prop = false
            }
        }
        has_css = true
    }
    for(let attr in css_props){
        if (first_css_prop) {
            result += ' style="'  //before first style prop
        }
        result += (first_css_prop ? "": " ") + attr + ":" + css_props[attr] + ";" //avoid extra space at end
        first_css_prop = false
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