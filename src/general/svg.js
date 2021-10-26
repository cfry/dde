/**
 * Created by Fry on 11/7/16.
 */

function svg_svg({id="", html_class="", style="", width=500, height=500, viewBox="", child_elements=[]}={}){
    let result = '<svg' +
         ' id="'      + id  +
        '" class="'   + html_class  +
        '" style="'   + style  +
        '" width="'   + width  +
        '" height="'  + height +
        ((viewBox.length == 0) ? "" : '" viewBox="' + viewBox) +
        '">\n    '   + child_elements.join("\n    ") +
        '\n</svg>'
    return result
}
globalThis.svg_svg = svg_svg


function svg_circle({id="", name="", html_class="", style="", cx=0, cy=0, r=10, color="black", border_width=1, border_color="black", data_oninput="false"}={}){
    if (style.length > 0) { //ensure proper ending
        if (last(style) == ";") style += " "
        else style += "; "
    }
    style += 'fill:' + color + '; stroke:' + border_color + '; stroke-width:' + border_width + ";"
    let result = '<circle' +
        '  id="'           + id  +
        '" name="'         + name +
        '" class="'        + html_class  +
        '" style="'        + style   +
        '" cx="'           + cx      +
        '" cy="'           + cy      +
        '" r="'            + r       +
        '" data-oninput="' + data_oninput +
        '"/>'
    return result
}

globalThis.svg_circle = svg_circle

function svg_ellipse({id="", html_class="", style="", cx=0, cy=0, rx=20, ry=10, color="black", border_width=1, border_color="black"}={}){
    if (style.length > 0) { //ensure proper ending
        if (last(style) == ";") style += " "
        else style += "; "
    }
    style += 'fill:' + color + '; stroke:' + border_color + '; stroke-width:' + border_width + ";"
    let result = '<ellipse' +
        ' id="'            + id  +
        '" class="'        + html_class  +
        '" style="'        + style   +
        '" cx="'           + cx      +
        '" cy="'           + cy      +
        '" rx="'           + rx      +
        '" ry="'           + ry      +
        '"/>'
    return result
}
globalThis.svg_ellipse = svg_ellipse

function svg_line({id="", html_class="", style="", x1=0, y1=0, x2=100, y2=100, color="black", width=1}={}){
    if (style.length > 0) { //ensure proper ending
        if (last(style) == ";") style += " "
        else style += "; "
    }
    style += 'stroke:' + color + '; stroke-width:' + width + ";"
    return '<line'  +
         ' id="'    + id  +
        '" class="' + html_class  +
        '" style="' + style   +
        '" x1="'    + x1 +
        '" y1="'    + y1 +
        '" x2="'    + x2 +
        '" y2="'    + y2 +
        '"/>'
}
globalThis.svg_line = svg_line

function svg_rect({id="", html_class="", style="", x=0, y=0, width=100, height=100, rx=0, ry=0,
                  color="black", border_width=1, border_color="black"}={}){
    if (style.length > 0) { //ensure proper ending
        if (last(style) == ";") style += " "
        else style += "; "
    }
    style += 'fill:' + color + '; stroke-width:' + border_width +  '; stroke:' + border_color + ";"
    return '<rect'   +
         ' id="'     + id  +
        '" class="'  + html_class  +
        '" style="'  + style   + '"' +
        ((x === null) ? '' : ' x="' + x + '"') + //for svg "inheritance
        ((y === null) ? '' : ' y="' + y + '"') + //for svg "inheritance
        ' width="'  + width +
        '" height="' + height +
        '" rx="'     + rx +
        '" ry="'     + ry +
        '"/>'
}
globalThis.svg_rect = svg_rect

//'<text style="font-size:30px;" x="60" y="400" fill="#AA66AA" transform="rotate(0, 0, 0)">Flexibility/Power/Complexity</text> <!-- 2nd arg = x 3rd arg = y rotate point -->
//points is of reasonable format [[2,3], [4,5]...] but svg requires "2,3  4,5"
function svg_polygon({id="", html_class="", style="", points=[], color="black", border_width=1, border_color="black"}={}){
    if (style.length > 0) { //ensure proper ending
        if (last(style) == ";") style += " "
        else style += "; "
    }
    let points_string = ""
    let separator = ""
    for(let p of points){
        points_string += separator + p[0] + "," + p[1]
        separator = " "
    }
    style += 'fill:' + color + '; stroke:' + border_color + '; stroke-width:' + border_width + ';'
    return '<polygon'  +
        ' id="'    + id  +
        '" class="' + html_class  +
        '" style="' + style   +
        '" points="'    + points_string +
        '"/>'
}
globalThis.svg_polygon = svg_polygon

function svg_polyline({id="", html_class="", style="", points=[], color="black", width=1}={}){
    if (style.length > 0) { //ensure proper ending
        if (last(style) == ";") style += " "
        else style += "; "
    }
    let points_string = ""
    let separator = ""
    for(let p of points){
        points_string += separator + p[0] + "," + p[1]
        separator = " "
    }
    style += 'stroke:' + color + '; stroke-width:' + width + ';'
    return '<polyline'  +
        ' id="'    + id  +
        '" class="' + html_class  +
        '" style="' + style   +
        '" points="'    + points_string +
        '" fill="none' +
        '"/>'
}
globalThis.svg_polyline = svg_polyline

function svg_text({id="", html_class="", style="", text="hi", x=20, y=20, size=16, color="black", border_width=0, border_color="black", transform="rotate(0, 0, 0)"}={}){
    if (style.length > 0) { //ensure proper ending
        if (last(style) == ";") style += " "
        else style += "; "
    }
    style += 'fill:' + color + '; font-size:' + size + "px" + '; stroke:' + border_color + '; stroke-width:' + border_width + ';'
    return '<text'      +
         ' id="'        + id  +
        '" class="'     + html_class  +
        '" style="'     + style   +
        '" x="'         + x +
        '" y="'         + y +
        '" transform="' + transform +
        '">' + text +
        '</text>'
}
globalThis.svg_text = svg_text

//todo commented out below is code that attempts to get drag and drop working for svg_html
//but it failed: the "drag" method never called.
function svg_html({html="<h1>hi</h1>", x=0, y=0, width=100, height=100, html_class="", //data_oninput="false"
      }={}){
    //let oninput_html = ""
    //let style_html = ""
    //if((data_oninput == "true") || (data_oninput == true)) {
    //    oninput_html = ' data-oninput="true" ' //note the underscore changed to hyphen
    //    style_html = ' style="user-select:none;" ' //because otherwise dragging the elt will just select its text, not actually drag it
    //}
    return '<foreignObject x="'      + x +
                        '" y="'      + y +
                        '" width="'  + width  +
                        '" height="' + height +
                        '" class="'  + html_class + '" ' +
                         //oninput_html +
                         //style_html
                        //'" requiredExtensions="http://www.w3.org/1999/xhtml">' +
                        '>' + html +
            '</foreignObject>'
}
globalThis.svg_html = svg_html