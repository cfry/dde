new TalkMode({name: "params"})

new TalkCommand({name: "cancel",
        action_function: "cancel_action_function",
        mode: TalkMode.params,
        tooltip: "Cancel this command and return to the MAIN dialog."})

TalkCommand.cancel_action_function = function(aCAT) {
        this.set_mode(Utils.last(Talk.previous_modes))
        this.dialog_dom_elt.focus()
    }

new TalkCommand({
        name: "run",
        action_function: "run_action_function",
        mode: TalkMode.params,
        tooltip: "Run this command and return to the main dialog."})

//called when in params mode
TalkCommand.run_action_function = function(aCAT) {
        if(!aCAT._has_args) {
                //let [parent_mode, cmd_str_with_underscores] = this.mode.split("__")
                //let param_names = this.cmd_param_names_for_current_params_mode()
                //let cmd_norm = cmd_str_with_underscores.replaceAll("_", " ")
                let new_full_text = aCAT._cmd.name //cmd_norm
                for (let i = 0; i < aCAT._cmd.parameters.length; i++) {
                        let parameter = aCAT._cmd.parameters[i]
                        let id_str = Talk.parent_mode().name + "__" + aCAT._cmd.name_with_underscores + "__params__" + parameter.name + "__id"
                        let dom_elt = globalThis[id_str]
                        let val = dom_elt.value
                        if([undefined, ""].includes(val)) { //no real value. Stop trying because the format for full_cmd is "define name green, the meaning" ie no keywords,
                                //because that's easiest for people to say. If the dialog happens to have other later values,
                                //too bad, we lose them and user has to put them in again.
                                //we presume that the user is putting in values IN ORDER as they must do in spoken cmds.
                                break;
                        }
                        else {
                                if (i !== 0) {
                                        new_full_text += ","
                                }
                                new_full_text += " " + val //param_name + " " + val
                        }
                }
                this.set_mode(Talk.parent_mode(), aCAT) //or the "cmd" won't be recognized as valid.
                //don't pass in aCAT here as we're going to redisplay when that
                //set_mode gets called again. duplicate display but not so bad.
                this.handle_command(new_full_text)
                return
        }
        //this.dialog_dom_elt.focus()
}


/*

// the mode for the params "menu" dialog box
params: [ //the constant cmds for all params valid cmds. Dynamically the "back" menu gets added by cmd_rows_for_mode and a row for each param will get added by cmds_html_for_current_mode
    [ //["main menu",                ["main", "maine"],                          [], "Change the menu of commands back to the main menu."],
        ["cancel",                   [],                                         [], "Don't run this command. Pop back to its parent menu."],
        ["run",                      [],                                         [], "Run the current command with the values for each param."]
    ]
]


//makes new full_cmd (full_text) like "define name green, is a cool color" (ie no param names or "object" identifier
//then handle_command transforms "content" into an object with param names in it and a bit more
//to send to the actual cmd action fn.
static run(content_obj){
    if(!content_obj._has_args) {
        let [parent_mode, cmd_str_with_underscores] = this.mode.split("__")
        let param_names = this.cmd_param_names_for_current_params_mode()
        let cmd_norm = cmd_str_with_underscores.replaceAll("_", " ")
        let new_full_text = cmd_norm
        for (let i = 0; i < param_names.length; i++) {
            let param_name = param_names[i]
            let id_str = parent_mode + "__" + cmd_str_with_underscores + "__params__" + param_name + "__id"
            let dom_elt = globalThis[id_str]
            let val = dom_elt.value
            if([undefined, ""].includes(val)) { //no real value. Stop trying because the format for full_cmd is "define name green, the meaning" ie no keywords,
                //because that's easiest for people to say. If the dialog happens to have other later values,
                //too bad, we lose them and user has to put them in again.
                //we presume that the user is putting in values IN ORDER as they must do in spoken cmds.
                break;
            }
            else {
                if (i !== 0) {
                    new_full_text += ","
                }
                new_full_text += " " + val //param_name + " " + val
            }
        }
        this.set_mode(parent_mode, content_obj) //or the "cmd" won't be recognized as valid.
        //don't pass in content_obj here as we're going to redisplay when that
        //set_mode gets called again. duplicate display but not so bad.
        this.handle_command(new_full_text)
        return
    }
}


//called from handle_command only when Talk.mode is a "__params" mode.
//but note, a dynamically generated call, not in Talk src code.
static params_mode_misc(content_obj){
    let param_names = content_obj._param_names //this.cmd_param_names_for_current_params_mode()
    let [param_name, param_val] = Utils.starts_with_one_of_and_tail(content_obj._full_text, param_names, true)
    if(param_name){
        if(param_val === ""){ //ie the new param value
            this.display_message("After saying the name of the param (i.e. " + param_name + "), say its new value.")
        }
        else {
            let id = this.mode + //main_menu__note__params
                "__" + param_name + "__id"
            globalThis[id].value = param_val
            if(param_names.length === 1) {
                this.run(content_obj) //gets us out of the params dialog and pops back up.
                //observe that we don't really need to set the field in the type in box,
                //but just in case something goes wrong, etc.
                //its not a bad thing to do, even if not seen by the user.
            }
            return true
        }
    }
    else { //no param name at beginning of full_text, so assume content_obj has fields of param_name bound to arg
        let cmd_str_with_underscores = content_obj._cmd_norm.replaceAll(" ", "_")
        for(let param_name of param_names) {

            let arg = content_obj[param_name]
            if(arg !== undefined){
                let id_str = content_obj._cmd_norm_mode + "__" + cmd_str_with_underscores + "__params__" + param_name + "__id"
                let dom_elt = globalThis[id_str]
                dom_elt.value = arg
            }
        }
        if(content_obj._unused_param_names.length === 0){ //just do it.
            this.run(content_obj)
        }
    }
    //fill in Talk_command_command_id
    out("heu")
}
*/