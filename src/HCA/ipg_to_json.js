/* spec
there's just two levels of objects, the top level
Example of a top level objext line:
//its an obj the ( & the outputs, each with a type and a name then ending with a comma|name of the obj then ( and type, name, comma for each output ending )
  "Object ( Variant A, Variant B, Variant C , Variant D, Bit Done, Bit Busy) MoveLin( List MotorParam , Variant 1, Variant 2, Variant 3, Variant 4 , Variant StartSpeed, Variant Acceleration, Variant MaxSpeed, Bit Go) "


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
    static file_path_to_parse_obj_map
    static loaded_files //in chronological order, first to last loaded.
    static file_path_to_datasets_map

    static init(){
        console.log("top of ipg_to_json.init")
        this.file_path_to_parse_obj_map = {}
        this.loaded_files = []
        this.file_path_to_datasets_map = {}
    }

    static async parse(source_path=null, source, callback=HCAObjDef.insert_obj_and_dataset_defs_into_tree){
        if(!source) {
            if(!source_path) { shouldnt("ipg_to_json.parse passed no source_path or ipg.")}
            else { source = await DDEFile.read_file_async(source_path) }
        }
        let json_obj = this.parse_string(source_path, source)
        if(callback){
            callback(source_path, json_obj)
        }
    }

    //ipg must be a string of the contents of an .ipg or .idl file
    static parse_string(source_path, source){
        source = source.trim()
        if(source.startsWith("{")) {
           let json_obj = JSON.parse(source)
           return json_obj
        }
        else {
            let ipg = source
            ipg = Utils.replace_substrings(ipg, "\\\\", "/", false)
            ipg = Utils.replace_substrings(ipg, "\\", "/", false)
            ipg = Utils.replace_substrings(ipg, "\u0001", " ", false)
            ipg = Utils.replace_substrings(ipg, "\u0002", " ", false)

            let result = {object_definitions: [], datasets: [], top_level_sys_desc: undefined}
            let lines = ipg.split("\n")
            //return last(lines)
            //lines = lines.slice(-3)
            let cur_obj_def = null //initialized and filled in during a loop that starts with
                                   //Object, but also used by subsequent lines
                                   //Will also have a value of a sys_desc if that's the cur_obj_def being parsed
            let call_obj_json = null
            let section = null
            let system_ancestors = [] //for nested system_descriptor processing. If non-empty, it means the current line is in a sys desc.
            for (let line_index = 0; line_index < lines.length; line_index++) {
                let line = lines[line_index]
                //console.log("line index: " + line_index + ":" + line)
                //initial meta-data
                let trimmed_line = line.trim()
                if (line.startsWith("VIVA ")) {
                    let split_line = line.split(" ")
                    result.VIVA_version = split_line[1]
                }
                else if (line.startsWith("// Project ")) {
                    this.parse_project_line(line, result)
                }
                // remMinNumberOfObjects=10000000
                else if (line.startsWith("// remMinNumberOfObjects")) { //precede by a line of "//_ Attributes"
                    let num_str = line.trim().split("=")[1]
                    let num = parseInt(num_str)
                    result.remMinNumberOfObjects = num
                }
                else if (line.startsWith("// Sheet ")) {
                    result.sheet_date = line.substring(9).trim()
                }

                //example:  ComLibrary "$(DirName:Viva)SYSTEMDESCRIPTIONS\DIGILENT\NEXYS3\LIB\ADEPTUSB.DLL"
                else if (line.startsWith("ComLibrary")) {
                    let name = line.trim().split(" ")[1]
                    name = name.substring(1, name.length - 1) //trim off the double quotes
                    if (!result.ComLibraries) {
                        result.ComLibraries = []
                    }
                    result.ComLibraries.push(name)
                }
                else if (line.startsWith("ComObject")) {
                    let items = line.trim().split(" ")
                    let name = items[1] + " " + items[1]
                    if (!result.ComObjects) {
                        result.ComObjects = []
                    }
                    result.ComObjects.push(name)
                }
                else if (line.startsWith("Library")) {
                    let items = line.trim().split(" ")
                    let name = items[1]
                    name = name.substring(1, name.length - 1) //trim off the double quotes
                    if (!result.Libraries) {
                        result.Libraries = []
                    }
                    result.Libraries.push(name)
                }
                else if (line.startsWith("DynamicSystemFile")) {
                    let items = line.trim().split(" ")
                    let name = items[1]
                    name = name.substring(1, name.length - 1) //trim off the double quotes
                    result.DynamicSystemFile = name
                }
                else if (line.startsWith("DataSet ")) {
                    let ds_obj = Dataset.parse_dataset(source_path, line)
                    result.datasets.push(ds_obj)
                }
                /* obsoleted by below handling of "System" and " System "
                else if (system_ancestors.length > 0){ //we are in the system section, and have read the one top level system desc first line.
                    let cur_sys_def = Utils.last(system_ancestors)
                    if (trimmed_line.startsWith("System ")) { //these lines are always indented, so are NOT the top_level_sys_desc
                        let new_sys_desc_obj = SysDesc.parse_sys_desc_line(source_path, trimmed_line)
                        let pre_cur_sys_desc = Utils.last(system_ancestors)
                        pre_cur_sys_desc.children.push(new_sys_desc_obj)
                        system_ancestors.push(new_sys_desc_obj)
                        section = null
                    }
                    else if(trimmed_line.startsWith("//_")){  //first line of the attributes
                        let [slashslash, Attr, content] = trimmed_line.split(" ")
                        let [mystery_int, name_val] = content.split(",")
                        let [name, val] = name_val.split("=")
                        cur_sys_def.mystery_int = parseInt(mystery_int.trim())
                        if(name && name.length > 0){
                            cur_sys_def[name] = val
                        }
                        section = "sys_desc_collecting_attributes"
                    }
                    else if (trimmed_line.startsWith("//")) { //non first line of attributes
                        if(section == "sys_desc_collecting_attributes") {
                            let [slashslash, name_val] = trimmed_line.split(" ")
                            let [name, val] = name_val.split("=")
                            if (name && name.length > 0) {
                                cur_sys_def[name] = val
                            }
                        }
                        else { //appears only right after { for perhaps several contiguous lines starting with //
                            cur_sys_def.description += trimmed_line + "\n"
                        }
                    }
                    else if (trimmed_line === "{"){ //starting either sub SYSTEMS or the "// description lines
                        section = "sys_desc_after_curley" //not now actually read.
                    }
                    else if (trimmed_line === "}"){ //done with sub_sys_descs
                        section = null
                        system_ancestors.pop()
                    }
                    else {
                        shouldnt("in parse_string with line: " + line +
                                 "<br/> and system_ancestors: " + system_ancestors +
                                 "<br/> and section: " + section)
                    }
                } //end of old sys desc parsing
                */

                //done with System Description parsing
                else if (line.startsWith("{")) {
                    section = "calls" //a.k.a. prototypes
                } //in a top level object, just before top level doc.
                //no content after the first char of such lines.
                else if (Utils.is_whitespace(line)) {
                } //ignore
                else if (line.includes("revision") || line.includes("Revision")) { //must be before handling lines that start with " // "
                    cur_obj_def.revisions.push(line.substring(4))
                }
                else if (line.startsWith(" // ")) { //top level doc
                    cur_obj_def.description += line.substring(4) + "\n"
                }
                else if (line.startsWith("// ")) { //happens in top top level System Desc.
                    cur_obj_def.description += line.substring(3) + "\n"
                }
                else if (trimmed_line == "//") {
                } //ignore, empty comment. place AFTER " // " test. probably has some newline char(s) after the //

                else if (line.startsWith(" ") && trimmed_line.startsWith("//_ Object Prototypes")) {
                } //sub objects to follow, but the lines all start with space, the "Object" so don't need to set a special mode

                //Behavior Topology (net_list)
                else if (line.startsWith(" ") && trimmed_line.startsWith("//_ Behavior Topology")) {
                    section = "netList"
                    cur_obj_def.netList = [] //redundant as the obj will be initialized to empty array, but OK to leave this here
                }
                else if (trimmed_line === "}") { //ends a top level object or a Sys desc. No content after the close curley for cur_obj_def
                    section = null
                    call_obj_json = null
                    if(system_ancestors.length === 0) {
                        cur_obj_def = null
                    }
                    else if (system_ancestors.length === 1) {
                        result.top_level_sys_desc.children.push(system_ancestors.pop())
                    }
                    else { //system_ancestors.length > 1
                        let just_completed_sys = system_ancestors.pop()
                        cur_obj_def = Utils.last(system_ancestors)
                        cur_obj_def.children.push(just_completed_sys)
                    }
                }
                else if (section === "netList") {
                    if(system_ancestors.length > 0){
                        debugger;
                    }
                    let bt_obj = this.parse_behavior_topology(trimmed_line, cur_obj_def)
                    cur_obj_def.netList.push(bt_obj)
                }
                else if (line.startsWith("Object ")) { //making a new object definition
                    [cur_obj_def, line_index] = this.parse_object_def(lines, line, line_index, source_path)
                    result.object_definitions.push(cur_obj_def)
                }
                //System Description happens at the bottom of a ".sd" file.
                else if (line.startsWith("System ")) { //this will be at most once in a file, and the top level sys desc.
                    /*let new_sys_desc_obj = SysDesc.parse_sys_desc_line(source_path, trimmed_line)
                    let pre_cur_sys_desc = Utils.last(system_ancestors)
                    system_ancestors.push(new_sys_desc_obj)
                    cur_obj_def = new_sys_desc_obj
                    if(!pre_cur_sys_desc) {  //usually if not always hits
                        result.top_level_sys_desc = new_sys_desc_obj
                    }
                    else {
                        pre_cur_sys_desc.children.push(sys_desc_obj)
                    }*/
                    [cur_obj_def, line_index] = this.parse_object_def(lines, line, line_index, source_path)
                    cur_obj_def.children = []
                    result.top_level_sys_desc = cur_obj_def
                }
                else if (trimmed_line.startsWith("System ")) { //we're making a subsystem, which is more like a Obj Def than it is a obj call
                    [cur_obj_def, line_index] = this.parse_object_def(lines, line, line_index, source_path)
                    cur_obj_def.children = []
                    system_ancestors.push(cur_obj_def) //system_ancestors does NOT include too_level_sys_desc, just its descendents stright line to cur_obj_def
                }
                else if ((line.startsWith(" ") && trimmed_line.startsWith("Object "))) { //making a new call. note that calls under a sys desc have one OR MORE spaces before "Object"
                    line = ""
                    for (let i = line_index; i < lines.length; i++) {
                        let next_line = lines[i]
                        line += next_line
                        line_index = i
                        if (next_line.includes(";")) {
                            break;
                        }
                        //else loop around
                    }
                    call_obj_json = this.parse_object(line, false) // do not do "let call_obj_json ..." as call_obj_json is declared further up, by design
                    call_obj_json.line = line //for debugging
                    cur_obj_def.prototypes.push(call_obj_json)
                }
                else if (line.startsWith("//_ Attributes ") ||  //top level object Attributes
                    ((system_ancestors.length > 0) && (line.trim().startsWith("//_ Attributes "))) || //working on sub sys desc
                    ((cur_obj_def === result.top_level_sys_desc) && (line.trim().startsWith("//_ Attributes ")))) { //working on top level sys desc
                    let next_line = ((line_index === (lines.length - 1)) ? null : lines[line_index + 1])
                    if (next_line.startsWith(" ") && next_line.trim().startsWith(",")) {
                    } //its a true 2nd line of attributes
                    else {
                        next_line = null
                    }
                    //to handle kludgy syntax where a top level attribute line might have a 2nd line of attributes.
                    //if(line.includes("(")){ out("line: " + line_index + " of: " + line)}
                    //if(next_line && !next_line.startsWith("{")){ d//ebugger;}
                    let attr_obj = this.parse_front_of_line_attributes(line, next_line)
                    for (let key of Object.keys(attr_obj)) {
                        cur_obj_def[key] = attr_obj[key]
                    }
                    section = "cur_ob_def_attributes" //there *might be another line of
                    //attributes that starts with spaces, then a comma then the attributes then the close paran
                }
                //the following clause should be after the clause: (line.startsWith("{"))
                else if ((section === "cur_ob_def_attributes") &&
                    line.startsWith(" ") &&
                    line.trim().startsWith(",")) { //we have a 2nd line of top level obj attributes
                    //which is ignored because the clause line.startsWith("//_ Attributes ") handles it.
                }
                else if (line.startsWith(" //_ Attributes ")) { //call_obj_json Attributes, doesn't have a 2nd line of attributes in az.idl, but allow for it
                    let next_line = ((line_index === (lines.length - 1)) ? null : lines[line_index + 1])
                    let attr_obj = this.parse_front_of_line_attributes(line, next_line)
                    for (let key of Object.keys(attr_obj)) {
                        call_obj_json[key] = attr_obj[key]
                    }
                }
                else {
                    warning("HCA.parse got a line " + line_index + " of:<br/><code>" + line + "</code><br/>which is unexpected and thus ignored.")
                }
            } //end big for loop
            this.file_path_to_datasets_map[source_path] = result.datasets
            return result //end parse
        }
    }

    //example: // Project  AXI_TO_AZIDO 7/24/2021 11:09:07 PM
    //as in the 2nd line of the "main.idl" file.
    static parse_project_line(line, result){
        let line_split = line.trim().split(" ")
        let name = line_split[3]
        let date = line_split[4] + " " + line_split[5] + " " + line_split[6]
        result.project_name = name
        result.project_date = date
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

    static parse_object_def(lines, line, line_index, source_path) { //also parses top level system defs
        //first extend "line" with all the sub-lines that semantically make up the key line for the def
        for (let i = line_index; i < lines.length; i++) {
            if (i === line_index) {  //on first line.
                continue
            }
            else if (i === lines.length) {
                break;
            } //won't happen. let the line as is be the full valid object, though this probably won't happen
            //else if (line.includes(";")) { break; }
            else {
                let next_line = lines[i]
                if (next_line.trim().startsWith("//_")) {
                    break;
                } //proper end of top level object header
                else if (next_line.trim().startsWith("{")) {
                    break;
                }
                else if (next_line.trim().startsWith("}")) {
                    break;
                }
                else { //loop around looking for another line
                    line += next_line
                    line_index = i
                }
            }
        }
        let cur_obj_def = this.parse_object(line, true)
        //note: top level objects look like they never have a 2nd line of header info,
        //so shouldn't need to be passed line_index & lines
        cur_obj_def.line = line        //for debugging, not in VIVA
        cur_obj_def.source_path = source_path //not in VIVA
        cur_obj_def.obj_id = HCAObjDef.make_obj_id(cur_obj_def)
        //result.object_definitions.push(cur_obj_def)
        return [cur_obj_def, line_index]
    }

    static parse_object(line,
                        is_obj_def, //true if we are parsing an obj_def, false if we are parsing an obj call
                        line_index, lines){
        let new_obj   = {description: "", //may be set below
                         prototypes: [],
                         netList:    [],
                         revisions:  []
                        }
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
            //console.log("grabbing outputs: ")
            let out_arr_and_end = this.grab_io(before_comment, space_after_Object_pos + 1) //this.io_string_to_obj_array(outputs_str)
            out_array_result = out_arr_and_end[0]
            outputs_end_pos  = out_arr_and_end[1]
               //don't put it on new_obj yet because we want to ORDER the items on new_obj
                    //of: name, type, inputs, outputs, x, y ...
            name_start_pos = outputs_end_pos + 2
        }
        else {
            out_array_result = []
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
        if(is_obj_def){
            new_obj.objectName = name
        }
        else { //object call
            let colon_pos = name.indexOf(":")
            if(colon_pos != -1) {
                new_obj.call_name = name
                new_obj.objectName = name.substring(0, colon_pos)
            }
            else {
                new_obj.objectName = name
                //This is tricky.
                // Don't set call_name here, leave it non-existent.
                //Then HCACall.constructor can fill it in with either
                //same as objectName OR a unique objectName:A across the
                //calls that already have call names.
                //we presume that any objectName:A syntax call names are
                //unique and good. There can only be one call name
                //for a given objectName that has no suffix.
            }
        }
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
        if(comment) { //only happens for calls
            //console.log("grabbing comments: " + comment)
            if(comment.startsWith("_GUI ")){
                let comment_start = 5
                comment = comment.substring(comment_start)
                let first_comma  = comment.indexOf(",")
                let end_of_y = comment.indexOf(",", first_comma + 1)
                if(end_of_y === -1) { end_of_y = comment.length }
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
                        new_obj.description = comment.substring(end_of_y + 1, comment.length)
                    }
                    else {
                        new_obj.description = comment.substring(end_of_y + 1, font_name_start_pos)
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
                                       new_obj.fontBold = parseInt(font_mystery_int.trim()) //values of: 0 for false (not bold), 1 for bold.
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
        //if(str.includes("MSB008 MSB008)")) { de bugger; }
        let cur_term = ""
        let cur_pair
        let pair_array = [] //the main result
        let state = "between_pairs"
        if(Utils.is_whitespace(str)) { return [pair_array, start_index]}
        //states:
        //between_pairs, between_terms,
        //getting_type_string, getting_type_symbol
        //getting_name_string, getting_name_symbol
        for(let i = start_index; i < str.length; i++){
            let char = str[i]
            if(state === "between_pairs"){
                if(char === "(")     {} //throw away. happens only at very beginning
                else if(char == " ") {} //throw away
                else if(char == "\r") {} //throw away. causes big problems when parsing a $Select call ins.
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
                if(Utils.is_whitespace(char)) {}
                else if(char === '"'){
                    state = "getting_name_string"
                }
                else {
                    cur_term = char
                    state = "getting_name_symbol"
                }
            }
            else if(state === "getting_name_symbol") {
                if((char === ",") || (char === " ") || (char === "\r")) {
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
        if(str.trim().startsWith("System ")){ //when parsing a sys desc
            let sys_start_pos = str.indexOf("System")
            start_index = sys_start_pos + 7
        }
        let cur_term = ""
        let state = "before"
        let extra_chars_length = 0
        for(let i = start_index; i < str.length; i++){
            let char = str[i]
            if(state === "before"){
                if(Utils.is_whitespace(char)) {}
                else if(char === '"') { state = "grabbing_string" } //happens when name has double quotes around it like "Parallel->Serial_Clr"
                else  {
                    cur_term = char
                    state = "grabbing_symbol"
                }
            }
            else if (state === "grabbing_string") {
                if(char === '"') {
                    //cur_term = cur_term.substring(0, cur_term.length - 1)
                    return [cur_term, i + 1] //the extra 1 causes us to skip over the closing double quote when grabbing_io
                }
                else { cur_term += char }
            }
            else if(state === "grabbing_symbol"){
                if(Utils.is_whitespace(char) ||
                   (char === ";") ||
                   (char === "(")) {
                    return [cur_term, i]
                }
                else { cur_term += char } //not fault tolerant of bad symbol chars but good enough
            }
            else { shouldnt("grab_name got invalid state: " + state) }
        }
        return [cur_term, str.length + extra_chars_length] //top level objects that have no inputs or comments
    }

    //line starts with "//_ Attributes" (top level) or " //_ Attributes" (calls )
    static parse_front_of_line_attributes(line, next_line = null){
        line = line.trim()
        if(line.startsWith("Attributes")) { line = line.substring(14) }
        else  { line = line.substring(15) }
        if(next_line){
            line += next_line
        }
        let attr_obj = {}
        if(line !== "") { //has at least some attributes
            //this CopyOf hack special cases such lines becuase they are hard to parse because they
            //contain commas that AREN'T separators of name-val pairs, but rather
            //inside parens and separate "args".
            //there are only 2 such attribute lines in az.idl, and both of them
            //are the values of CopyOf attr name that is the last attr of the attributes line,
            //and both of them have a "next_line".
            //so cut that CopyOf attr off of line, process the new shortened line as usual,
            //then at end of this fn, process the CopyOf attr specially.
            let index_of_copyof_attr = line.indexOf(",CopyOf=")
            let copyof_text = null
            if(index_of_copyof_attr !== -1){
                copyof_text = line.substring(index_of_copyof_attr + 1)
                line = line.substring(0, index_of_copyof_attr)
            }
            let pairs = line.split(",")
            if(pairs.length > 0) {
               let mystery_int = parseInt(pairs[0]) //shows up in Sys descs
                if(!Number.isNaN(mystery_int)){
                    attr_obj.mystery_int =  mystery_int
                    pairs.shift() //remove the mystery_int from pairs
                }
            }
            for (let pair of pairs) {
                let [key, val] = pair.split("=")
                key = key.trim()

                if (!val) { //note Attributes in SYSTEM defs often start with a single digit integer and no equal sign. Rodney doesn't know what that means
                    val = "True" // Rodney advised this rather than ""
                }
                else {
                    val = val.trim()
                    if (val.startsWith('"') && val.endsWith('"')) {
                        val = val.substring(1, val.length - 1) //cut off surrounding double quotes
                    }
                }
                if(key === "TreeGroup"){
                    val = val.split("/")
                }
                attr_obj[key] = val
            }
            if(copyof_text){
                let val = copyof_text.substring(",CopyOf=".length - 1)
                attr_obj["CopyOf"] = val
            }
        }
        return attr_obj
    }

    //the netList
    static parse_behavior_topology(trimmed_line, cur_obj_def_for_debugging_only){
        trimmed_line = trimmed_line.substring(0, trimmed_line.length - 1) //cut off trailing semicomon
        let [sink, src] = trimmed_line.split("=") //bad design: sink comes before source.
        src = src.trim()
        let src_split = src.split(".")
        let call_name  = src_split[0]
        if(call_name.startsWith('"') && call_name.endsWith('"')){ //happens when name is "Serial->Parallel_Clr" (including the double quotes, which need to be stripped off
            call_name = call_name.substring(1, call_name.length - 1)
        }
        let src_obj = {call_name: call_name, // src_split[0],
                       outputNumber: parseInt(src_split[1])
        }

        sink = sink.trim()
        let sink_split = sink.split(".")
        call_name = sink_split[0]
        let sink_in = parseInt(sink_split[1])
        if(call_name.startsWith('"') && call_name.endsWith('"')){ //happens when name is "Serial->Parallel_Clr" (including the double quotes, which need to be stripped off
            call_name = call_name.substring(1, call_name.length - 1)
        }
        let sink_obj = {call_name: call_name, // sink_split[0],
                        inputNumber: sink_in
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
            str = Utils.replace_substrings(str, "\n", "<br/>")
            str = "<pre>" + str + "</pre>"
            //the below makes all the double quotes not escaped,
            //and doesn't print any unnecessary stuff in the output pane.
            out(str)
            return "dont_print"
        }
        return str
    }
} //end class
/*
ipg is case sensitive:  preserve case.
todo: for dataset change "comment" to "Attributes": with
  a value of an array of numbers and strings.
*/
