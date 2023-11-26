globalThis.DexDefaults = class DexDefaults{
    static meta_data_comments_header = ";meta_data_comments"
    static meta_data_sparams_header  = ";meta_data_sparams"
    static model_instructions_header = ";model_instructions"
    static user_instructions_header  = ";user_instructions"
    static cal_sparams_header        = ";cal_sparams"

    static meta_data_sparam_names      = ["DexterSerial",          "DexterModel",  "ManufactureLocation",  "StaticIPAddress"]
    static meta_data_sparam_in_comment = ["Dexter Serial Number",  "Dexter Model", "Manufacture Location", "Static IP Address"]

    static cal_sparam_names       = ["J1BoundryHigh", "J1BoundryLow",
                                     "J2BoundryHigh", "J2BoundryLow",
                                     "J3BoundryHigh", "J3BoundryLow",
                                     "J4BoundryHigh", "J4BoundryLow",
                                     "J5BoundryHigh", "J5BoundryLow",
                                     "JointDH"  //(an array of arrays 6 x 4),
                                     ]
    static data = {}

    static async file_to_data(path, //path is now ignored. user picks it.
                              confirm_message="Choose a Defaults.make_ins file to read in.",
                              callback=inspect){
        if(confirm_message) {
            if(!confirm(confirm_message)) {
                return //user canceled
            }
        }
        this.data = {} //initialize
        let lines = await this.file_to_lines()
        this.data = this.lines_to_data(lines)
        this.data.meta_data_sparams = this.meta_data_comments_lines_to_sparams(this.data.meta_data_comments_lines) //returns nmae-value pairs obj.
        this.data.cal_sparams = this.lines_to_cal_sparams(this.data)
        callback(this.data)
    }

    static async file_to_lines(){
        let content = await Editor.pick_and_process_content()
        let lines = content.split("\n")
        return lines
    }

    static lines_to_data(lines) {
        let data = {
            meta_data_comments_lines: [],
            meta_data_sparams:        {},
            model_instructions_lines: [],
            user_instructions_lines:  [],
            cal_sparams_lines:        []
        }
        if (lines[0].startsWith(this.meta_data_comments_header)) { //new format file
            let index_of_meta_data_comments_header =
                Utils.starts_with_one_of_index(this.meta_data_comments_header, lines)
            let index_of_meta_data_sparams_header =
                Utils.starts_with_one_of_index(this.meta_data_sparams_header, lines)
            let index_of_model_instructions_header =
                Utils.starts_with_one_of_index(this.model_instructions_header, lines)
            let index_of_user_instructions_header =
                Utils.starts_with_one_of_index(this.user_instructions_header, lines)
            let index_of_cal_sparams_header =
                Utils.starts_with_one_of_index(this.index_of_cal_sparams_header, lines)
            data.meta_data_comments_lines = lines.slice(index_of_meta_data_comments_header + 1,
                index_of_meta_data_sparams_header)
            data.meta_data_sparams_lines = lines.slice(index_of_meta_data_sparams + 1,
                index_of_model_instructions)
            data.model_instructions_lines = lines.slice(index_of_model_instructions + 1,
                index_of_user_instructions)
            data.user_instructions_lines = lines.slice(index_of_user_instructions + 1,
                index_of_cal_params)
            data.cal_sparams_lines = lines.slice(index_of_cal_sparams + 1,
                lines.length)
            return data
        }
        else { //old format file
            let section = "meta_data_comments"
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i]
                if(line.trim() == "") {} //throw away empty lines
                else if ((section === "meta_data_comments") &&
                    (Utils.starts_with_one_of(line, ["; "]) )) {
                    data.meta_data_comments_lines.push(line)
                } else {
                    section = "user_instructions"
                    data.user_instructions_lines = lines.slice(i, lines.length)
                    /*let dh_lines = []
                    for (let j = 1; j < 7; j++) {
                        let line_index = Utils.starts_with_one_of_index("S, JointDH " + j, lines)
                        if (line_index > -1) {
                            let line = lines[line_index]
                            dh_lines.push(line)
                        }
                    }
                    data.model_instructions.dh_guess_lines = dh_lines
                     */
                    break;
                }
            }
            //rest of data are empty in old format
            return data
        }
    }

    static meta_data_comments_lines_to_sparams(meta_data_comments_lines){
        let sparams = {}
        let unfound_sparam_names = []
        for(let i = 0; i < this.meta_data_sparam_names.length; i++){
            let sparam_name = this.meta_data_sparam_names[i]
            let sparam_name_in_comment = this.meta_data_sparam_in_comment[i]
            for(let comment_line of meta_data_comments_lines){
                let start_index = comment_line.indexOf(sparam_name_in_comment)
                if(start_index !== -1){
                    let colon_index = comment_line.indexOf(":", start_index)
                    let str = comment_line.slice(colon_index + 1).trim()
                    let val
                    if(sparam_name === "StaticIPAddress"){ //because this looks like 192.168.1.142 and starting with a number, parseFloat grabs the first two numbers and throws out the rest, so do special parse
                        val = str
                    }
                    else {
                        let num = parseFloat(str)
                        val = (Number.isNaN(num) ? str : num)
                    }
                    sparams[sparam_name] = val
                }
            }
            if(!sparams[sparam_name]) {
                unfound_sparam_names.push(sparam_name_in_comment)
            }
        }
        if(unfound_sparam_names.length > 0){
            warning("meta_data_comments_lines_to_sparams could not find params: " + unfound_sparam_names)
        }
        return sparams
    }

    static lines_to_cal_sparams(data){
        //reverse the lines such that the first one we "find" in our search
        //is really the last one.
        let lines = data.cal_sparams_lines.slice().reverse()
        lines = lines.concat(data.user_instructions_lines.slice().reverse())
        lines = lines.concat(data.model_instructions_lines.slice().reverse())
        let sparams_obj = {JointDH: []}
        for(let sparam of this.cal_sparam_names) {
            for(let line of lines){
                line = line.trim()
                if(line.startsWith(";")) {} //ignore it
                else {
                    if(line.includes(sparam)){
                        let [oplet, sparam_name, first_arg, ...rest_args] = this.tokens_of_line(line)
                        if(sparam === "JointDH") {
                            let joint_number = first_arg
                            sparams_obj.JointDH[joint_number - 1] = rest_args
                        }
                        else {//J1BoundryLow, etc
                            sparams_obj[sparam] = first_arg
                        }
                    }
                }
            }
        }
        return sparams_obj
    }

    static tokens_of_line(line){
        let arr_of_strs = line.split(/[\s,]/) //split on space or comma, can yield elts that are ""
        let tokens_of_instr = [] //nums and strs
        for(let str of arr_of_strs) {
            str = str.trim()
            if ((str === "") || (str === ",")) {
            } //get rid of empty strs.
            else {
                let num = parseFloat(str)
                if(Number.isNaN(num)) {
                    tokens_of_instr.push(str)
                }
                else { tokens_of_instr.push(num)}
            }
        }
        return tokens_of_instr
    }

    static data_to_file(data=DexDefaults.data,
                        path="Defaults_calibrated.make_ins",
                        confirm_message="Choose the file path to save the new Defaults values to."){
        let content = this.data_to_string(data)
        Editor.save_local_file(path, confirm_message, content)
        let content_with_html = "<b>Written content:</b><br/>" + content.replaceAll("\n", "<br/>")
        out(content_with_html)
    }

    static data_to_string(data=DexDefaults.data) {
        let content = ";meta_data_comments Please don't delete this line.\n"
        content += data.meta_data_comments_lines.join("\n")
        content += "\n\n"
        content += ";meta_data_sparams Please don't delete this line.\n"
        for (let key of Object.keys(data.meta_data_sparams)) {
            let val = data.meta_data_sparams[key]
            let instr = "S " + key + " " + val + "\n"
            content += instr
        }
        content += "\n\n"
        content += ";model_instructions  Please don't delete this line.\n"
        content += data.model_instructions_lines.join("\n")
        content += "\n\n"
        content += ";user_instructions  Please don't delete this line.\n"
        content += data.user_instructions_lines.join("\n")
        content += "\n\n"
        content += ";cal_sparams  Please don't delete this line.\n"
        content += this.sparams_to_string(data.cal_sparams)
        return content
    }

    static sparams_to_string(sparams_obj){
        let str = ""
        for(let key of Object.keys(sparams_obj)){
            let val = sparams_obj[key]
            if(key = "JointDH"){
                for(let i = 0; i < val.length; i++) {
                    let joint_number = i + 1
                    let one_joint_vals = val[i]
                    let vals_str = one_joint_vals.join(", ")
                    let args_str = joint_number + ", " + vals_str
                    str += "S, " + key + ", " + args_str + "\n"
                }
            }
        }
        return str
    }
}