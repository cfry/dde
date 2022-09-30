/* spec
there's just two levels of objects, the top level
and an inner level (typicaly of many object)
                     
 Object Text;  //_GUI 4,8,Welcome to CoreLib 3.1.1Arial,20,8388608,1 
   implement as: {name:"Text", type: "Text", x:4, y:8, doc:"Welcome ..."
   
 Object ( MSB008 MSB008) Input;  //_GUI 117,137    
   implement as: {name: "Input", type: "Input" x:117, y 137, doc:""

 Object ( MSB008 MSB008) Input;  //_GUI 117,137    
   impement as: {name: "Input", type: "Input" x:117, y 137}
   
 Object ( LSB007 LSB007) Input:A;  //_GUI 160,137  
   impement as: {name: "Input:A", type: "Input", x:160, y: 137}
    
Object ( Variant "LsbOutIsLsbIn+1", Variant LsbOutIsLsbIn) EveryOther( Variant In) 
//_ Attributes TreeGroup="CoreLib\\GrammaticalOps\\Advanced"
{
Implement: do capture that 2nd line, perhaps as:
  Attributes: {TreeGroup: "CoreLib\\GrammaticalOps\\Advanced" }
  or one with 2 attributes:
  //_ Attributes TreeGroup="CoreLib\\GrammaticalOps\\Advanced\\Lists\\$Internal",Documentation="NULL"
  where commas separte a name-value pair.

*/

globalThis.ipg_to_json = class ipg_to_json{
    //ipg can be either a file name or a big string of ipg
    static async parse(ipg) {
        if ((ipg.length < 256) && ipg.endsWith(".ipg")) {
            ipg = await DDEReadFile.read_file(ipg)
        }

        ipg = replace_substrings(ipg, "\\\\", "/", false)
        ipg = replace_substrings(ipg, "\\", "/", false)
        ipg = replace_substrings(ipg, "\u0001", " ", false)
        ipg = replace_substrings(ipg, "\u0002", " ", false)

        let result = {}
        let lines = ipg.split("\n")
        //return last(lines)
        //lines = lines.slice(-3)
        let top_level_obj = null //initialized and filled in during a loop that starts with
                                 //Object, but also used by subsequent lines
        let sub_obj = null
        let section = null
        for(let line_index = 0; line_index < lines.length; line_index++){
            let line = lines[line_index]
            console.log("line index: " + line_index + ":" + line)
            //initial meta-data
            if(line.startsWith("VIVA ")) {
                let split_line = line.split(" ")
                result.VIVA_version = split_line[1]
            }
            else if(line.startsWith("// Sheet ")) {
                result.sheet_date = line.substring(9).trim()
            }
            else if(line.startsWith("DataSet ")) {
                if(!result.datasets) {
                    console.log("DATASETS")
                    result.datasets = {}
                }
                let dataset_obj = this.parse_dataset(line)
                result.datasets[dataset_obj.name] = dataset_obj
            }

            else if (line.startsWith("{")) { section = "sub_objects"} //in a top level object, just before top level doc.
                                              //no content after the first char of such lines.
            else if (is_whitespace(line))  {} //ignore
            else if(line.includes("revision") || line.includes("Revision")){ //must be before handling lines that start with " // "
                if(!top_level_obj.revisions) {
                    top_level_obj.revisions = []
                }
                top_level_obj.revisions.push(line.substring(4))
            }
            else if (line.startsWith(" // ")){ //top level doc
                if (!top_level_obj.doc) { top_level_obj.doc = "" }
                top_level_obj.doc += line.substring(4) + "\n"
            }
            else if (line.trim() == "//")  {} //ignore, empty comment. place AFTER " // " test. probably has some newline char(s) after the //

            else if (line.startsWith(" //_ Object Prototypes")) {} //sub objects to follow

            //Behavior Topology (net_list)
            else if (line.startsWith(" //_ Behavior Topology")){
                console.log("NETLIST")
                section = "netList"
                top_level_obj.netList = []
            }

            else if (line.startsWith("}")){ //ends a top level object. No content after the close curley.
                section = null
                top_level_obj = null
                sub_obj = null
            }
            else if (section === "netList"){
                let bt_obj = this.parse_behavior_topology(line)
                top_level_obj.netList.push(bt_obj)
            }

            else if(line.startsWith("Object ")) { //making a new top level object
                if(!result.topLevelObjects) { result.topLevelObjects = [] }
                for(let i = line_index; i < lines.length; i++){
                    if(i === line_index) { continue } //on first line.
                    else if(i === lines.length) { break; } //won't happen. let the line as is be the full valid object, though this probably won't happen
                    //else if (line.includes(";")) { break; }
                    else {
                       let next_line = lines[i]
                       if (next_line.startsWith("//_")) { break; } //proper end of top level object header
                       else { //loop around looking for another line
                           line += next_line
                           line_index = i
                       }
                    }
                }
                top_level_obj = this.parse_object(line, true) //note don't make this "let top_level_obj" as we use it outside this scope.
                    //note: top level objects look like they never have a 2nd line of header info,
                    //so shouldn't need to be passed line_index & lines
                top_level_obj.line = line //for debugging
                result.topLevelObjects.push(top_level_obj)
            }
            else if (line.startsWith(" Object ")) { //making a new sub object
                if(!top_level_obj.prototypes) {
                    top_level_obj.prototypes = []
                }
                line = ""
                for(let i = line_index; i < lines.length; i++){
                    let next_line = lines[i]
                    line += next_line
                    line_index = i
                    if (next_line.includes(";")) { break; }
                    //else loop around
                }
                sub_obj = this.parse_object(line, false) // do not do "let sub_obj ..." as sub_obj is declared further up, by design
                sub_obj.line = line //for debugging
                top_level_obj.prototypes.push(sub_obj)
            }
            else if(line.startsWith("//_ Attributes ")) { //top level Attributes
                let attr_obj = this.parse_front_of_line_attributes(line)
                for(let key of Object.keys(attr_obj)) {
                    top_level_obj[key] = attr_obj[key]
                }
            }
            else if(line.startsWith(" //_ Attributes ")) { //sub_obj Attributes
                let attr_obj = this.parse_front_of_line_attributes(line)
                for(let key of Object.keys(attr_obj)) {
                    sub_obj[key] = attr_obj[key]
                }
            }
            else {
                warning("HCA.parse got a line " + line_index + " of:<br/><code>" + line + "</code><br/>which is unexpected and thus ignored.")
            }
        } //end big for loop
        return result //end parse
    }

    static parse_dataset(line){
        let split_line = line.split(" ")
        let name = split_line[1]
        let open_pos = line.indexOf("(")
        let close_pos = line.indexOf(")")
        let types_str = line.substring(open_pos + 1, close_pos).trim()
        let types_split = types_str.split(",")
        let types_array = []
        for(let type of types_split) {
            types_array.push(type.trim())
        }
        let comment_start = line.indexOf("//")
        let comment = line.substring(comment_start + 15).trim()
        let comment_split = comment.split(",")
        let context_type = parseInt(comment_split[0].trim())
        let color_int  = parseInt(comment_split[1].trim())
        let tree_group = (comment_split[2] ? comment_split[2] : "")

        let dataset = {name: name,
            types: types_array,
            contextType: context_type,
            color: color_int,
            TreeGroup: tree_group}
        return dataset
    }

    /* Called for both top level objects and sub_objects.
      first char is either a space or "O"
      then the word Object, space THEN
       (outs) objectName ( ins) ;// ... OR
       objectName (ins) ; // ... OR
       (outs) objectName; // ... OR
       objectName; // ... OR
       soo objectName is required,
       and ins & outs are optional
       BUT beware: some Objects are like:
       Object ( Bit Out1, Bit Out2, Bit Out3) Junction
    ( Bit In0) ;  //_GUI 28,17
      i.e. the inputs are on a 2nd line, perhaps with comments.
      There are 2 big kinds of objects: top_level and subobject.
      top level start with "Object " and after several lines have  a "{" then
       lots of lines and end with "}"
       subobjects start with " Object "  (note the beginning space)
        and are 1 to 2 lines long. After the name they might or might not
        have a newline, and then on the 2nd line can have inputs and the comments (starting with "//_GUI " )

     the subobject header ins, name outs doesnt end until a ;
     the top level object header doesn't end until the NEXT line starts with //_ Attributes
     because we can have a first line the ends with the name, and it might or might
     not have inputs, which could start on the next line OR the next line
     could start with //_ Attributes meaning no inputs, end of top level object header.

    */
    static parse_object(line, is_top_level, line_index, lines){
        //debugger
        let new_obj   = {}
        //new_obj.line = line //for debugging only.
        let [before_comment, comment] = line.split("//")
        let out_array_result
        let outputs_end_pos
        let open_pos  = before_comment.indexOf("(") //warning, this might be the open_pos for the inputs
        //let close_pos = before_comment.indexOf(")")
        let space_after_Object_pos = before_comment.indexOf(" ", 3) //start  is in the middle of "Object" or " Object"
        let char_after_space_after_Object = before_comment[space_after_Object_pos + 1]
        let name_start_pos
        if(char_after_space_after_Object === "(") { //we have outputs (before the name)
            /*let outputs_start_pos = space_after_Object_pos + 1
            let outputs_close_pos = before_comment.indexOf(")", outputs_start_pos)
            let outputs_dq_pos    = before_comment.indexOf('"', outputs_start_pos)
            let outputs_end_pos
            if((outputs_dq_pos !== -1) && (outputs_dq_pos < outputs_close_pos)) {
                outputs_dq_pos = before_comment.indexOf('"', outputs_dq_pos + 1) //get the matching dq
                outputs_end_pos = before_comment.indexOf(")", outputs_dq_pos) //hopefully only one of these per object!
            }
            else {
                outputs_end_pos = outputs_close_pos
            }
            let outputs_str = before_comment.substring(outputs_start_pos + 1, outputs_end_pos).trim()
            */
            console.log("grabbing outputs: ")
            let out_arr_and_end = this.grab_io(before_comment, space_after_Object_pos + 1) //this.io_string_to_obj_array(outputs_str)
            out_array_result = out_arr_and_end[0]
            outputs_end_pos  = out_arr_and_end[1]
               //don't put it on new_obj yet because we want to ORDER the items on new_obj
                    //of: name, type, inputs, outputs, x, y ...
            name_start_pos = outputs_end_pos + 2
        }
        else {
            name_start_pos = space_after_Object_pos + 1
        }
       /* let inputs_open_pos = before_comment.indexOf("(", name_start_pos)
        let semi_pos = before_comment.indexOf(";", name_start_pos)
        let slash_slash_pos = line.indexOf("//")

        //grab name
        let name_end_pos = inputs_open_pos
        if(name_end_pos != -1) {
            if(semi_pos != -1) { name_end_pos = Math.min(name_end_pos, semi_pos) }
        }
        else { name_end_pos = semi_pos }
        if(name_end_pos != -1) {
            if(slash_slash_pos != -1){ name_end_pos = Math.min(name_end_pos, slash_slash_pos) }
        }
        else { name_end_pos = slash_slash_pos }
        if(name_end_pos === -1) { name_end_pos = before_comment.length }
        */
        let [name, name_end_pos] = this.grab_name(before_comment, name_start_pos) //before_comment.substring(name_start_pos, name_end_pos).trim()
        //if(name.startsWith('"')) { name = name.substring(1, name.length - 1) } //cut off double quotes in name that are *sometimes* present
        let [type, name_ext] = name.split(":") //name_ext is included in name, we don't use it separately
        console.log("objectName: " + name)
        new_obj.objectName = name
        new_obj.objectType = type //the part of the name that's before the colon

        //grab inputs
        let [in_array_result, in_end_pos] = this.grab_io(before_comment, name_end_pos)
        /*new_obj.inputs = []
        let inputs_close_pos = -1
        if(inputs_open_pos !== -1) {
            inputs_close_pos = before_comment.indexOf(")", inputs_open_pos)
        }
        let inputs_str = before_comment.substring(inputs_open_pos + 1, inputs_close_pos).trim()
        console.log("grabbing inputs: " + inputs_str)
        let in_array_result = this.io_string_to_obj_array(inputs_str)
        */
        //don't put it on new_obj yet because we want to ORDER the items on new_obj
        //of: name, type, inputs, outputs, x, y ...
        new_obj.inputs  = in_array_result
        new_obj.outputs = out_array_result  //stick this here so that the order of props in the JSON obj
        //will be name, type, inputs, outputs, x, y, font ...
        //parse comment
        if(comment) { //only happens for sub_objects
            console.log("grabbing comments: " + comment)
            if(comment.startsWith("_GUI ")){
                let comment_start = 5
                comment = comment.substring(comment_start)
                let first_comma  = comment.indexOf(",")
                let end_of_y = comment.indexOf(",", first_comma + 1)
                if(end_of_y === -1) { end_of_y = comment.length }
                let x, y, doc
                new_obj.x = parseInt(comment.substring(0, first_comma))
                new_obj.y = parseInt(comment.substring(first_comma + 1, end_of_y))
                if(end_of_y !== comment.length) { //there's more
                    let font_name_start_pos = comment.indexOf("Arial,", comment_start)
                    let font_size_end_pos = -1
                    if(font_name_start_pos !== -1) {
                        let font_name_end_pos = font_name_start_pos + 5
                        let font_size_start_pos = font_name_end_pos + 1
                        font_size_end_pos = comment.indexOf(",", font_size_start_pos)
                        new_obj.fontName = comment.substring(font_name_start_pos, font_name_end_pos)
                        new_obj.fontSize = parseInt(comment.substring(font_size_start_pos, font_size_end_pos))
                    }
                    if(font_name_start_pos === -1) {
                        new_obj.doc = comment.substring(end_of_y + 1, comment.length)
                    }
                    else {
                        new_obj.doc = comment.substring(end_of_y + 1, font_name_start_pos)
                        if(font_size_end_pos !== -1) {
                            let junk = comment.substring(font_size_end_pos + 1).trim()
                            if(junk.length > 0){
                                let [font_color, font_mystery_int] = junk.split(",")
                                if(typeof(font_color) === "string") {
                                    new_obj.fontColor = parseInt(font_color.trim())
                                }
                                if(font_mystery_int &&
                                   (font_mystery_int.length > 0) &&
                                   (typeof(font_mystery_int) === "string")) {
                                       new_obj.fontMysteryInt = parseInt(font_mystery_int.trim())
                                }
                            }
                        }
                    }
                }
            }
        }
        return new_obj
    }

    /* obsolete. Didn't work well for very complex names.
      static io_string_to_obj_array(io_str){
        let io_array = io_str.split(",")
        let result_array = []
        for(let io_array_elt of io_array){
            io_array_elt = io_array_elt.trim()
            if(io_array_elt != "") {
                let first_dq_pos = io_array_elt.indexOf('"')
                let type, name
                if(first_dq_pos === -1) {
                    [type, name] = io_array_elt.split(" ")
                    if (!name) { name = type }
                }
                else if(first_dq_pos === 0){
                    shouldnt("In HCA.io_string_to_obj while parsing an input-output set:<br/>" +
                             "<code>" + io_str + "</code> got type starting with unexpected double quote.")
                }
                else { // name exists AND has double quotes around it
                    let first_space_pos = io_array_elt.indexOf(" ")
                    type = io_array_elt.substring(0, first_space_pos)
                    let second_dq_pos = io_array_elt.indexOf('"', first_dq_pos + 1)
                    name = io_array_elt.substring(first_dq_pos + 1, second_dq_pos).trim() //sometimes there's a trailing space inside the double quotes
                }
                if(name.startsWith('"')) { name = name.substring(1, name.length - 1) } //cut off double quotes in name that are *sometimes* present
                let in_arr_elt_obj = {type: type, name: name}
                result_array.push(in_arr_elt_obj)
            }
        }
        return result_array
    }*/

    /*
grab_io("")
grab_io("(myt myn)")
grab_io("(myt myn, myt2 myn2)")
grab_io("(myt myn, myt2 myn2,   myt3   myn3)")
grab_io('(myt "a b")')
grab_io('(myt "myn ame", myt2 myn2)')
grab_io(str)
*/
    static grab_io(str, start_index=0) {
        if(str.includes("MSB008 MSB008)")) { debugger; }
        let cur_term = ""
        let cur_pair
        let pair_array = [] //the main result
        let state = "between_pairs"
        if(is_whitespace(str)) { return [pair_array, start_index]}
        //states:
        //between_pairs, between_terms,
        //getting_type_string, getting_type_symbol
        //getting_name_string, getting_name_symbol
        for(let i = start_index; i < str.length; i++){
            let char = str[i]
            if(state === "between_pairs"){
                if(char === "(")     {} //throw away. happens only at very beginning
                else if(char == " ") {} //throw away
                else if(char == ",") {} //throw away
                else if(char == '"') {  //throw away
                    state = "getting_type_string"
                }
                else if(char === ")") { //should only happen after got a name_string
                    return [pair_array, i]
                }
                else { //first char of non_string type
                    state = "getting_type_symbol"
                    cur_term = char
                }
            }
            else if(state == "getting_type_symbol") {
                if(char == " ") {
                    cur_pair = {type: cur_term}
                    cur_term = ""
                    state = "between_terms"
                }
                else { cur_term += char }
            }
            else if(state == "getting_type_string"){
                if(char == '"') {
                    cur_pair = {type: cur_term}
                    cur_term = ""
                    state = "between_terms"
                }
                else { cur_term += char }
            }
            else if(state === "between_terms"){
                if(is_whitespace(char)) {}
                else if(char === '"'){
                    state = "getting_name_string"
                }
                else {
                    cur_term = char
                    state = "getting_name_symbol"
                }
            }
            else if(state === "getting_name_symbol") {
                if((char === ",") || (char == " ")) {
                    cur_pair.name = cur_term
                    pair_array.push(cur_pair)
                    cur_term = ""
                    state = "between_pairs"
                }
                else if(char === ")") {
                    cur_pair.name = cur_term
                    pair_array.push(cur_pair)
                    return [pair_array, i]
                }
                else { cur_term += char }
            }
            else if(state == "getting_name_string"){
                if(char == '"') {
                    cur_pair.name = cur_term
                    pair_array.push(cur_pair)
                    cur_term = ""
                    state = "between_pairs"
                }
                else { cur_term += char }
            }
            else { shouldnt("In grab_io with invalid state: " + state) }
        } //for
        return [pair_array, start_index] //happens with top level obj when called on inputs and there are none
    }

    static grab_name(str, start_index=0) {
        let cur_term = ""
        let state = "before"
        for(let i = start_index; i < str.length; i++){
            let char = str[i]
            if(state === "before"){
                if(is_whitespace(char)) {}
                else if(char === '"') { state = "grabbing_string" }
                else  {
                    cur_term = char
                    state = "grabbing_symbol"
                }
            }
            else if (state === "grabbing_string") {
                if(char === '"') {
                    return [cur_term, i]
                }
                else { cur_term += char }
            }
            else if(state === "grabbing_symbol"){
                if(is_whitespace(char) ||
                   (char === ";") ||
                   (char === "(")) {
                    return [cur_term, i]
                }
                else { cur_term += char } //not fault tolerant of bad symbol chars but good enough
            }
            else { shouldnt("grab_name got invalid state: " + state) }
        }
        return [cur_term, str.length] //top level objects that have no inputs or comments
    }

        //line starts with "Attributes" (top level) or " Attributes" (sub_obj)
    static parse_front_of_line_attributes(line){
        if(line.startsWith("Attributes")) { line = line.substring(14) }
        else  { line = line.substring(15) }
        let pairs = line.split(",")
        let attr_obj = {}
        for(let pair of pairs){
            let [key, val] = pair.split("=")
            key = key.trim()

            if(!val) { val = "" }
            else { val = val.trim() }
            if(val.startsWith('"') && val.endsWith('"')) {
                val = val.substring(1, val.length - 1) //cut off surrounding double quotes
            }
            attr_obj[key] = val
        }
        return attr_obj
    }

    static parse_behavior_topology(line){
        line = line.trim()
        line = line.substring(0, line.length - 1) //cut off trailing semicomon
        let [sink, src] = line.split("=")
        src = src.trim()
        let src_split = src.split(".")
        let src_obj = {objectName: src_split[0],
                       inputNumber: parseInt(src_split[1])
        }

        sink = sink.trim()
        let sink_split = sink.split(".")
        let sink_obj = {objectName: sink_split[0],
                        outputNumber: parseInt(sink_split[1])
        }
        let bt_obj = {source: src_obj, sink: sink_obj}
        return bt_obj
    }


        //pretty is true, false or "HTML" which is suitable for output in DDE output pane
    static print(result_obj, pretty=true){
        let str = JSON.stringify(result_obj)
        if(pretty) {
            str = Editor.pretty_print(str)
        }
        if(pretty === "HTML") {
            str = replace_substrings(str, "\n", "<br/>")
            str = "<pre>" + str + "</pre>"
            //the below makes all the dulbe quotes not escaped,
            //and doesn't print any unnecessary stuff in the output pane.
            out(str)
            return "dont_print"
        }
        return str
    }
    static parse_and_print(ipg, pretty=true){
        let result_obj = this.parse(ipg)
        return this.print(result_obj, pretty)
    }
} //end class
/*
ipg_to_json.parse("CorLibTop.ipg")
ipg_to_json.parse_and_print("CorLibTop.ipg")
ipg_to_json.parse_and_print("CorLibTop.ipg", "HTML")

ipg is case sensitive:  preserve csae.
todo: for dataset change "comment" to "Attributes": with
  a value of an array of numbers and strings.
*/
