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
    static default_mode_misc_method(content_obj){
        warning("Mode: " + content_obj.cmd_norm_mode + " can't handle command: " + content_obj.cmd_norm)
    }

    //returns true for regular Talk cmds only
    is_known_cmd(cmd){
        return this.commands.includes(cmd)
    }

    //ok if content_obj is undefined. That just means display all the fields without
    //getting any previous values, just use defaults.
    cmds_html(content_obj) {
        let html = ""
        if (Talk.mode === TalkMode.params) {
            //let [parent_mode, cmd_norm_with_underscores] = this.mode.split("__")
            let cmd = content_obj._cmd
            let parameters = cmd.parameters
            let cmd_tooltip = cmd.tooltip
            for (let parameter of parameters) {
                let def_val = parameter.type.default_value_string
                if (typeof (def_val) === "function") {
                    def_val = def_val.call(Talk)
                }
                if (content_obj[parameter.name]) {
                    let prev_val = content_obj[parameter.name]
                    if (![undefined, ""].includes(prev_val)) {
                        def_val = prev_val
                    }
                }
                let id = TalkCAT.make_id_for_parameter_html(content_obj._cmd, parameter.name)//this.mode.name + "__" + param.name + "__id"
                let parameter_tooltip = cmd_tooltip + " for parameter: " + parameter.name
                html += "<li style='height:30px;' title='" + parameter_tooltip + "' >" + parameter.name + ": " +
                    '<input style="width:350px;" id="' + id + '" value="' + def_val + '"' + //must have single quote on outside, double on inside because def_val might be "it's raining" and we need to capture that snglue quote inside the string for def_value.
                    " onkeydown='Talk.onkeydown_for_arg_input(event)' " +
                    " onkeyup='Talk.onkeyup_for_arg_input(event)' " +
                    "/></li>\n"
            }
            let cmds_for_mode = Talk.mode.commands//this.cmd_props_table["params"] //differs from below that uses this.cmd_props_table[Talk.mode]
            if (cmds_for_mode) {
                html += this.make_command_list_items(cmds_for_mode)
            }
            return html
        }
        else {  //regular (non-params) mode
            let cmds_for_mode = this.commands //these are going to be: cancel, run (because we're in params mode.
            html += this.make_command_list_items(cmds_for_mode)
            return html
        }
    }

    //for format of cmds_for_mode, see cmd_props_table for any mode.
    make_command_list_items(cmds_for_mode){
        let result = ""
        for(let cmd of cmds_for_mode){
            if(!cmd.should_display) { //don't display this cmd
                continue
            }
            result += "<li style='height:30px;'>"
            //if ((cmd_rows.length > 1) && (cmd_props !== cmd_rows[0])) { //put center-dot before every non-first elt
                result += " &nbsp;&#x2022;&nbsp;"
            //}
            let click_source = "Talk.handle_command('" + cmd.name + "')"
            let style_val = "" //text-decoration: underline; color:#3600cc " //#7d00fa; " //purple
            if(cmd.name === 'stop recording') {
                style_val += "background-color:rgb(255, 180, 180);"
            }
            let li_body_html = '<span class="talk_cmd" onclick="' + click_source  + '"'  + //performing span onclick doesn't trigger onblur for dialog box as a whole and since these links change after dialog creation, doesn't need the fancy SW processing to call the sw callback upon click
                ' style="' + style_val     + '"'  +
                ' title="' + cmd.tooltip       + '">' +
                cmd.display_prose() + '</span>\n'
            //onsole.log("got: " + li_body_html)
            result += li_body_html
            result += "</li>\n"
        }
        return result //+= "<li><span onclick='alert(123)' name='myname'>cont</span></li>"
    }

    static make_command_command_html() {
        let display_prose = "Command" //upper case first letter, spaces between words
        let tooltip = "Type a command and hit ENTER to run it."
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
            'placeholder="' + tooltip +
            '" title="' + tooltip +
            '"/>'
        return html
    }
}