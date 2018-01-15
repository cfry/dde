new TestSuite("make_html_auto",
    ['make_html("b")', '"<b/>"'],
    ['make_html("b", {id: "b_id"})', `'<b id="b_id"/>'`],
    ['make_html("b", {id:"b_id", title:"hey"})', 
      `'<b id="b_id" title="hey"/>'`],
    ['make_html("b", {"font-size":"12px"})', 
      `'<b style="font-size:12px;"/>'`],
    ['make_html("b", {"font-size":"12px", color:"red"})', 
    `'<b style="font-size:12px; color:red;"/>'`],
    ['make_html("b", {id:"b_id", title:"hey", "font-size":"12px", color:"red"})', 
    `'<b id="b_id" title="hey" style="font-size:12px; color:red;"/>'`], 
    ['make_html("b", {id:"b_id", title:"hey", "font-size":"12px", color:"red"}, "inner text")', 
    `'<b id="b_id" title="hey" style="font-size:12px; color:red;">inner text</b>'`]       
)

new TestSuite("make_html_none",
    ['make_html("b", {}, "", "none")', '"<b"'],
    ['make_html("b", {id: "b_id"}, "", "none")', `'<b id="b_id"'`],
    ['make_html("b", {id:"b_id", title:"hey"}, "", "none")', 
      `'<b id="b_id" title="hey"'`],
    ['make_html("b", {"font-size":"12px"}, "", "none")', 
      `'<b style="font-size:12px;'`],
    ['make_html("b", {"font-size":"12px", color:"red"}, "", "none")', 
    `'<b style="font-size:12px; color:red;'`],
    ['make_html("b", {id:"b_id", title:"hey", "font-size":"12px", color:"red"}, "", "none")', 
    `'<b id="b_id" title="hey" style="font-size:12px; color:red;'`]    
)

new TestSuite("make_html_end_style_only",
    ['make_html("b", {}, "", "end_style_only")', '"<b"'],
    ['make_html("b", {id: "b_id"}, "", "end_style_only")', `'<b id="b_id"'`],
    ['make_html("b", {id:"b_id", title:"hey"}, "", "end_style_only")', 
      `'<b id="b_id" title="hey"'`],
    ['make_html("b", {"font-size":"12px"}, "", "end_style_only")', 
      `'<b style="font-size:12px;"'`],
    ['make_html("b", {"font-size":"12px", color:"red"}, "", "end_style_only")', 
    `'<b style="font-size:12px; color:red;"'`],
    ['make_html("b", {id:"b_id", title:"hey", "font-size":"12px", color:"red"}, "", "end_style_only")', 
    `'<b id="b_id" title="hey" style="font-size:12px; color:red;"'`]    
)

new TestSuite("make_html_end_properties_only",
    ['make_html("b", {}, "", "end_properties_only")', '"<b>"'],
    ['make_html("b", {id: "b_id"}, "", "end_properties_only")', `'<b id="b_id">'`],
    ['make_html("b", {id:"b_id", title:"hey"}, "", "end_properties_only")', 
      `'<b id="b_id" title="hey">'`],
    ['make_html("b", {"font-size":"12px"}, "", "end_properties_only")', 
      `'<b style="font-size:12px;">'`],
    ['make_html("b", {"font-size":"12px", color:"red"}, "", "end_properties_only")', 
    `'<b style="font-size:12px; color:red;">'`],
    ['make_html("b", {id:"b_id", title:"hey", "font-size":"12px", color:"red"}, "", "end_properties_only")', 
    `'<b id="b_id" title="hey" style="font-size:12px; color:red;">'`]    
)

new TestSuite("make_html_short",
    ['make_html("b", {}, "", "short")', '"<b/>"'],
    ['make_html("b", {id: "b_id"}, "", "short")', `'<b id="b_id"/>'`],
    ['make_html("b", {id:"b_id", title:"hey"}, "", "short")', 
      `'<b id="b_id" title="hey"/>'`],
    ['make_html("b", {"font-size":"12px"}, "", "short")', 
      `'<b style="font-size:12px;"/>'`],
    ['make_html("b", {"font-size":"12px", color:"red"}, "", "short")', 
    `'<b style="font-size:12px; color:red;"/>'`],
    ['make_html("b", {id:"b_id", title:"hey", "font-size":"12px", color:"red"}, "", "short")', 
    `'<b id="b_id" title="hey" style="font-size:12px; color:red;"/>'`]    
)

new TestSuite("make_html_long",
    ['make_html("b", {}, "", "long")', '"<b></b>"'],
    ['make_html("b", {id: "b_id"}, "", "long")', `'<b id="b_id"></b>'`],
    ['make_html("b", {id:"b_id", title:"hey"}, "", "long")', 
      `'<b id="b_id" title="hey"></b>'`],
    ['make_html("b", {"font-size":"12px"}, "", "long")', 
      `'<b style="font-size:12px;"></b>'`],
    ['make_html("b", {"font-size":"12px", color:"red"}, "", "long")', 
    `'<b style="font-size:12px; color:red;"></b>'`],
    ['make_html("b", {id:"b_id", title:"hey", "font-size":"12px", color:"red"}, "", "long")', 
    `'<b id="b_id" title="hey" style="font-size:12px; color:red;"></b>'`],
    ['make_html("b", {id:"b_id", title:"hey", "font-size":"12px", color:"red"}, "inner text", "long")', 
    `'<b id="b_id" title="hey" style="font-size:12px; color:red;">inner text</b>'`]
)

new TestSuite("make_html_html_properties",
    ['make_html("b", {html_properties:{color:"blue"}})', 
    `'<b color="blue"/>'`],
    [`make_html("b", {html_properties:'color="red"'})`,
    `'<b color="red"/>'`],
    [`make_html("b", {html_properties:'color="red" junk="234"'})`,
    `'<b color="red" junk="234"/>'`],
    [`make_html("b", {bgcolor: "green", html_properties:'color="red" junk="234"'})`,
    `'<b color="red" junk="234" bgcolor="green"/>'`]
    )
    
new TestSuite("make_html_style",
    ['make_html("b", {style: {color:"blue"}})', 
    `'<b style="color:blue;"/>'`],
    ['make_html("b", {style: {color:"blue", size:"567"}})', 
    `'<b style="color:blue; size:567;"/>'`],
    [`make_html("b", {style:'color:red;'})`,
    `'<b style="color:red;"/>'`],
    [`make_html("b", {style:'color:red; junk:234;', "font-size":"12px"})`,
    `'<b style="color:red; junk:234; font-size:12px;"/>'`],
    [`make_html("b", {style:'color:red;', "font-size":"22px"}, "inner text")`,
    `'<b style="color:red; font-size:22px;">inner text</b>'`],
    [`make_html("b", {html_properties:'color="red"', style:"bgcolor:blue;"})`,
    `'<b color="red" style="bgcolor:blue;"/>'`],
    [`make_html("b", {id:"my_id", "font-size":"14px", html_properties:'color="red"', style:"bgcolor:blue;"})`,
    `'<b color="red" id="my_id" style="bgcolor:blue; font-size:14px;"/>'`],
    
    )

//show_window(make_html("b", {style:'color:red;', "font-size":"22px"}, "inner text"))

