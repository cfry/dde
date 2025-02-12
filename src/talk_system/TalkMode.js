globalThis.TalkMode = class TalkMode {
    constructor({
                    name,
                    mode_misc_method=TalkMode.default_mode_misc_method
                }) {
        this.name = name
        this.mode_misc_method = mode_misc_method
        this.commands = []
        TalkMode.modes.push(this)
        TalkMode[name] = this
        if(((typeof(TalkMode.initial_mode) === "string") && name === TalkMode.initial_mode) ||
            ((TalkMode.initial_mode instanceof TalkMode) && TalkMode.initial_mode.name === name)){
            TalkMode.initial_mode = this
        }
    }


    static initial_mode = "main" //user can set this string before they choose "Talk to Dexter" menu item, and this will be the displayed mode at first
    static modes = []

    static mode_names() {
        let result = []
        for(let mode of this.modes) {
            result.push(mode.name)
        }
        return result
    }
    static mode_name_to_mode(mode_name){
        for(let mode of this.modes) {
            if(mode.name === mode_name) {
                return mode
            }
        }
        shouldnt("TalkMode.mode_name_to_mode called with: " + mode_name +
                 " which is not a valid mode name of: " + this.mode_names())
    }
    //command_name can have underscores in it.
    //aks command_name_to_command
    get_command(command_name){
        command_name = command_name.replaceAll("_", " ")
        for(let cmd of this.commands){
            if(cmd.name === command_name) {
                return cmd
            }
        }
        shouldnt("In TalkMode.get_commmand, " + command_name + " is not a valid command in mode: " + this.name)
    }

    static default_mode_misc_method(aCAT){
        Talk.display_warning("Mode: " + Talk.mode.name + ". Invalid command:<br/>" + aCAT._full_text)
    }

    //returns true for regular Talk cmds
    //cmd_name can be either the name with spaces or the name with underscores.
    is_known_cmd_name(cmd_name) {
        for (let cmd of this.commands) {
            if ((cmd.name === cmd_name) || (cmd.name_with_underscores === cmd_name)) {
                return true
            }
        }
        return false
    }
    //used in cmd: define_name
    is_known_cmd_name_or_job_name(cmd_name_or_job_name) {
        if(this.is_known_cmd_name(cmd_name_or_job_name)) {
            return true
        }
        if(Talk.is_existing_job_name(cmd_name_or_job_name)){
            return true
        }
        return false
    }

    //if Talk.mode is TalkMode.params, aCAT is ignored.
    //That just means display all the fields without
    //getting any previous values, just use defaults.
    cmds_html(aCAT) {
        let html = ""
        if (Talk.mode === TalkMode.params) {
            //let [parent_mode, cmd_norm_with_underscores] = this.mode.split("__")
            let cmd = aCAT._cmd
            let parameters = cmd.parameters
            let cmd_tooltip = cmd.tooltip
            for (let parameter of parameters) {
                let def_val = parameter.default_value_string
                if (typeof (def_val) === "function") {
                    def_val = def_val.call(Talk)
                }
                if (aCAT[parameter.name]) {
                    let prev_val = aCAT[parameter.name]
                    if (![undefined, ""].includes(prev_val)) {
                        def_val = prev_val
                    }
                }
                let id = TalkCAT.make_id_for_parameter_html(aCAT._cmd, parameter.name)//this.mode.name + "__" + param.name + "__id"
                let parameter_tooltip = cmd_tooltip + "&#13;for parameter: " + parameter.name
                let typ_val_menu_html = ""
                if(parameter.type.typical && parameter.type.typical.length > 0) {
                    let on_change_fn = `(function(event){` +
                        id + `.value = event.target.value
                        event.target.value = ""
                    })(event)`
                    typ_val_menu_html = " <select oninput='" + on_change_fn + "' > <option></option>"
                    let typ_val_strs = parameter.type.typical_string_values()  //will error if typcial is not an array or a fn
                    for(let typ_val of typ_val_strs){
                        typ_val_menu_html += "<option>" + typ_val + "</option> "
                    }
                    typ_val_menu_html += "</select> "
                }
                let width = (parameter.type.typical_is_exclusive ? "150px" : "325px")
                html += "<div style='height:30px;' title='" + parameter_tooltip + "' >" +
                    "&nbsp;&#x2022;&nbsp;" + parameter.name + ": " +
                    '<input style="width:' + width + ';" id="' + id + '" value="' + def_val + '"' + //must have single quote on outside, double on inside because def_val might be "it's raining" and we need to capture that snglue quote inside the string for def_value.
                    " onkeydown='Talk.onkeydown_for_arg_input(event)' " +
                    " onkeyup='Talk.onkeyup_for_arg_input(event)' " +
                    "/> " + typ_val_menu_html + "</div>\n"
            }
            let cmds_for_mode = Talk.mode.commands //these are going to be: cancel, run (because we're in params mode.
            if (cmds_for_mode) {
                html += this.make_command_list_items(cmds_for_mode)
            }
            return html
        }
        else {  //regular (non-params) mode
            let cmds_for_mode = this.commands
            html += this.make_command_list_items(cmds_for_mode)
            return html
        }
    }

    //for format of cmds_for_mode, see cmd_props_table for any mode.
    make_command_list_items(cmds_for_mode){
        let result = ""
        let working_on_row = null
        for(let cmd of cmds_for_mode){
            if(cmd.name === "mode misc"){
                continue //this is for unrecognized cmds use the mode_misc_method. Don't display "mode misc" as a valid command
            }
            else if(!cmd.should_display_command()){
                    continue //don't display this cmd
            }
            if(cmd.row !== working_on_row) { //making a new row
                working_on_row = cmd.row
                if (cmd.row !== 0) {
                    result += "</div>\n<div style='height:30px;'>"
                }
            }
            result += " &nbsp;&#x2022;&nbsp;"
            //}
            let click_source = "Talk.handle_command('" + cmd.name + "')"
            let style_val = "" //text-decoration: underline; color:#3600cc " //#7d00fa; " //purple
            if(cmd.name === 'stop recording') {
                style_val += "background-color:rgb(255, 180, 180);"
            }
            result +=  '<span class="talk_cmd" onclick="' + click_source  + '"'  + //performing span onclick doesn't trigger onblur for dialog box as a whole and since these links change after dialog creation, doesn't need the fancy SW processing to call the sw callback upon click
                ' style="' + style_val     + '"'  +
                ' title="' + cmd.tooltip   + '">' +
                cmd.name + '</span>\n'
            //onsole.log("got: " + li_body_html)
        }
        result += "</div>"
        return result //+= "<li><span onclick='alert(123)' name='myname'>cont</span></li>"
    }

    //bottom of Talk dialog for entering the full text of a command.
    static make_command_command_html() {
        let display_prose = "Command" //upper case first letter, spaces between words
        let tooltip = 'Type a command and hit ENTER to run it.&#13;Clicking on, or saying "Command" when it has text will run that command.'
        let click_source = "Talk.handle_command_command()"
        let style_val = "font-size:20px;" //text-decoration: underline; color:#3600cc " //#7d00fa; " //purple
        let id = "Talk_command_command_id"
        let html = '<span class="talk_cmd" onclick="' + click_source + '"' + //performing span onclick doesn't trigger onblur for dialog box as a whole and since these links change after dialog creation, doesn't need the fancy SW processing to call the sw callback upon click
            ' style="' + style_val + '"' +
            ' title="' + tooltip + '">' +
            display_prose + ':</span>\n' +
            '<input style="width:440px;font-size:20px;" id="' + id +
            '" value=""' +
            'onkeydown="Talk.onkeydown_for_command_command_input(event)" ' +
            'onkeyup="Talk.onkeyup_for_command_command_input(event)" ' +
            'placeholder="Type a command and hit ENTER to run it." ' +
            '" title="' + tooltip +
            '"/>'
        return html
    }
}