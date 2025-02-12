//CAT stands for: CommandAndText
//An instance of TalkCAT is essentially the parsed data from a user utterance
//An instance of TalkCAT holds the js value of every parameter for which
//that parameters HAS a value (of the correct type) in a KEY of the parameter name.
//If the user attempted to pass a value but it is not of a valid type for the param,
//the "value" of that parameter inside the CAT is a string of
// "Not " + parameter_type.name + ": " + parameter_src   i.e. an error message
//and the TalkCAT instance still has that parameter_name in its __unused_param_names key.
//all other keys that are not parameter_names begin with underscore.

globalThis.TalkCAT = class TalkCAT {
    constructor({full_text, cmd, content_str}) {
        this._full_text = full_text
        this._has_args = false
        this._error = null //or a string of the error message
        //if there's no cmd, then we just have the full_text meaning we qre using this aCAT to call
        //the mode's misc method which only uses _full_text
        if(cmd) {
            this._cmd = cmd
            this._content_str = content_str
            let parameters = cmd.parameters
            let parameter_names = cmd.parameter_names()
            this._unused_param_names = parameter_names.slice() //make a copy

            if (cmd.mode === TalkMode.params) { //populate result with existing values from params dialog box
                for (let parameter of parameters) {
                    let id_str = TalkCat.make_id_for_parameter_html(cmd, parameter.name)
                    let dom_elt = globalThis[id_str]
                    let the_parameter_source = dom_elt.value.trim()
                    let the_parameter_value = parameter.source_to_value(the_parameter_source)
                    if (Number.isNaN(the_parameter_value)) { //parameter_soruce is of wrong type.
                        let class_name = Utils.get_class_name(Utils.get_class_of_instance(parameter.type))
                        this._error = "Error: <span style='color:black;'>" + the_parameter_source + "</span> is not a valid " + class_name + "."
                        //don't remove it from unused_param_names
                    }
                    else {
                        this[parameter.name] = the_parameter_value
                        Utils.remove_value_from_array(parameter.name, this._unused_param_names)
                        this._has_args = true
                    }
                }
            }
            if (parameters.length > 1) {
                this._content_str = this._content_str.replaceAll(" comma ", ",") //when in parma dialog, if user hits space, they can say more than one arg and fill in the first such args tghey say, by separating them with commas.
            }
            //sometimes Chrome reco upper cases the first letter. No param names have upper case chars.
            let content_str_with_lower_case_first_letter = ((this._content_str.length === 0) ? "" : this._content_str[0].toLowerCase() + this._content_str.substring(1))
            let [the_parameter_name, the_parameter_source] = Utils.starts_with_one_of_and_tail(content_str_with_lower_case_first_letter, parameter_names, true)
            if (the_parameter_name) {
                the_parameter_name = the_parameter_name.trim()
                let parameter = cmd.parameter_name_to_parameter(the_parameter_name)
                let the_parameter_value = parameter.type.source_to_value(the_parameter_source)
                if (Number.isNaN(the_parameter_value)) {
                    let class_name = Utils.get_class_name(Utils.get_class_of_instance(parameter.type))
                    this._error = "Error: <span style='color:black;'>" + the_parameter_source + "</span> is not a valid " + class_name + "."
                }
                else {
                    this[the_parameter_name] = the_parameter_value
                    Utils.remove_value_from_array(the_parameter_name, this._unused_param_names)
                    if (this._unused_param_names.length === 0) {
                        this._has_args = false
                    }
                }
            }
            else {//go through content_str looking for by_position parameter_source that matches  the type.
                //first word of content_str is NOT a param name so presume we
                //start with the first param name and go down the list of args to match.
                let parameter_sources = ((this._content_str === "") ? [] : this._content_str.split(","))
                for (let i = 0; i < parameter_sources.length; i++) {
                    let parameter = parameters[i]
                    let the_parameter_source = parameter_sources[i].trim()
                    if (!parameter) {
                        warning("<b>" + cmd.name + "</b> got more content than the parameters allow for of: " + the_parameter_source +
                            "<br/>so ignoring it.")
                    } else {
                        let the_parameter_value = parameter.type.source_to_value(the_parameter_source)
                        if (Number.isNaN(the_parameter_value)) {  //source_to_value could not convert parameter_source to the correct type
                            let class_name = Utils.get_class_name(Utils.get_class_of_instance(parameter.type))
                            this._error = "Error: <span style='color:black;'>" + the_parameter_source + "</span> is not a valid " + class_name + "."
                            this[parameter.name] = the_parameter_source
                        }
                        else {
                            this[parameter.name] = the_parameter_value
                        }
                        this._unused_param_names.shift() //remove param name from the front of the array.
                        this._has_args = true
                    }
                }
            }
        }
    } //end of constructor

    static make_id_for_parameter_html(cmd, param_name) {
        let id_str = cmd.mode.name + //the "parent mode"
            "__" + cmd.name_with_underscores + "__params__" + param_name + "__id"
        return id_str
    }

    remove_unsed_parameter_name(parameter_name){
        let index = this._unused_param_names.indexOf(parameter_name)
        if(index >= 0){
            this._unused_param_names.splice(index, 1)
        }
    }

}


/*
//if content_str starts with one of the params of cmd_str, then the returned content_obj
//wil; contain a field of that param name whose value is the content_str AFTER the
//param_name (spaces trimmed from both param_name and what's after it.
//The value of the param_name has string_to_data called on it.
//If content_str does NOT start with a param_name, then
//split content_str on comma or "," and treat each resulting ele as a value
//of successive param names from the array of param_names for cmd_str.
static content_str_to_content_obj(full_text, cmd_norm_with_underscores, content_str, cmd_norm, cmd_norm_mode=Talk.mode){
    this.mode   //for debugging
    let has_args = false
    let the_param_names = []
    let unused_param_names = []
    let is_cmd = this.is_known_cmd(cmd_norm, cmd_norm_mode)
    let result = {}
    if(is_cmd) {
        the_param_names = this.cmd_param_names(cmd_norm, cmd_norm_mode)
        unused_param_names = the_param_names.slice()
        let [parent_mode, cmd_str_from_mode, params_const] = Talk.mode.split("__")
        if(params_const) {
            //populate result with existing values from params dialog box
            for (let param_name of the_param_names) {
                let id_str = parent_mode + "__" + cmd_norm_with_underscores + "__params__" + param_name + "__id"
                let dom_elt = globalThis[id_str]
                let val = dom_elt.value
                if ([undefined, ""].includes(val)) {}
                else {
                    result[param_name] = TalkType.string_to_data(val)
                    Utils.remove_value_from_array(param_name, unused_param_names)
                    has_args = (unused_param_names.length !== 0)
                }
            }
        }
        if(the_param_names.length > 1) {
            content_str = content_str.replaceAll(" comma ", ",") //when in parma dialog, if user hits space, they can say more than one arg and fill in the first such args tghey say, by separating them with commas.
        }
        let args = ((content_str === "") ? [] : content_str.split(","))
        //sometimes Chrome reco upper cases the first letter. No param names have upper case chars.
        let content_str_with_lower_case_first_letter = ((content_str.length === 0) ? "" : content_str[0].toLowerCase() + content_str.substring(1))
        let [param_name_in_content_str, value_src] = Utils.starts_with_one_of_and_tail(content_str_with_lower_case_first_letter, the_param_names, true)
        if(param_name_in_content_str){
            let val = TalkType.string_to_data(value_src)
            result[param_name_in_content_str] = val
            Utils.remove_value_from_array(param_name_in_content_str, unused_param_names)
            if(unused_param_names.length === 0) { has_args = false }
        }
        else { //first word of content_str is NOT a param name so presume we
            //start with the first param name and go down the list of args to match.
            for (let i = 0; i < args.length; i++) {
                let the_param = the_param_names[i]
                let arg = args[i].trim()
                if (!the_param) {
                    warning("<b>" + cmd_norm + "</b> got more content than the params allow of: " + arg +
                        "<br/>so ignoring it.")
                } else if (!arg || (arg === "")) {
                } //no arg so nothing to add to result
                else {
                    result[the_param] = TalkType.string_to_data(arg)
                    unused_param_names.shift() //remove param name from the front of the array.
                    has_args = true
                }
            }
        }
    }
    else {
        cmd_norm_with_underscores = false //the former cmd_str is not a known cmd, so forget it.
    }
    //result already has param name-value pairs in it, if any
    result._full_text = full_text
    result._cmd_norm_with_underscores = cmd_norm_with_underscores //could be false, if the passed in cmd is not a known cmd
    result._content_str = content_str
    result._cmd_norm = cmd_norm
    result._cmd_norm_mode = cmd_norm_mode
    result._has_args = has_args
    result._param_names = the_param_names
    result._unused_param_names = unused_param_names
    return result
}
*/