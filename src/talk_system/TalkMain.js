new TalkMode({name: "main"})

function talk_stop_action_function(content_obj) {
    Talk.stop_aux()
}
new TalkCommand({
    name: "stop",
    action_function: talk_stop_action_function} )

function talk_insert_action_function(aCat){
    if (aCat._content_str === "") {
        this.set_params_mode(aCat)
    }
    else {
        Editor.insert(aCat.words, "end")
        Talk.dialog_dom_elt.focus() //we don't want to leave focus in the editor pane.
        let text_for_message = arg_val.substring(0, 40)
        if(text_for_message.length < arg_val.length){
            text_for_message += "..."
        }
        let mess = '"<i>' + text_for_message + ' </i>"<br/>has been inserted into the editor.'
        Talk.display_message(mess)
    }
}
new TalkCommand({
    name: "insert",
    alternate_names: [],
    parameters: [new TalkParameter({
                       name: "words",
                       type: new TalkTypeString({default_value_string: ""})})
    ], //array of instances of parameter
    action_function: talk_insert_action_function, //"TalkCommand.default_action_function",
    //last defined app.
    mode: TalkMode.main, //"same",       //defaults to last define_command that had a mode, or if none,
    //last defined mode
    row: null, //means keep same row we're now "working on" or 0
    //"new" means start a new row.
    //expect define_command to be evaled IN ORDER,
    //so mostly you rearrange the source code in the file to
    //change an item's location in the menu.
    pos_in_row: null, //means 1 greater than prev cmd pos_in_row or 0 if none.
    tooltip: "Click to run the " + name + " command.",
    display_command: true}
)


/*
static display_turn_on_speaker(){
    return !this.is_speaker_on()
}

static display_turn_off_speaker(){
    return this.is_speaker_on()
}

static display_start_recording() {
    return !this.is_recording
}

static display_stop_recording(){
    return this.is_recording
}

static cmd_props_table = {
    //0 cmd_normalized_prose,   1 cmd_display_prose,       2 cmd_method_name,  3 cmd_can_be_  4 cmd_alternatives                       5 cmd_tooltip
    //aka utterance from reco                              aka recording_name, in_recording,
    //                             1 cmd_alternatives                         2 params        3 cmd_tooltip         4 cmd_display (boolean or fn returning boolean,  default: true)
    main_menu: [   //                                                            only lc chars in name                  on weather or not to have this item appear in vali_cmds at all.
        [ //["turn on mic",               ["turn on mike",  "turn on microphone"],  [], "To turn on the mic, press the space-bar,&#013;then say a command.",     Talk.display_turn_on_mic],
            //["turn off mic",              ["turn off mike", "turn off microphone"], [], "Turn off the mic (or just pause speaking for auto-off)",             Talk.display_turn_off_mic],
            ["turn on speaker",           ["turn speaker on"],                      [], "Enables the speaker to work when Talk tries to, um, talk.",          Talk.display_turn_on_speaker],
            ["turn off speaker",          ["turn speaker off", "quiet", "be quiet", "shut up"], [], "Disables speaker so that Talk will (usually) be quiet.", Talk.display_turn_off_speaker],
        ],
        [ ["insert",                    [],                                       [["words", ""]], "Inserts text into the current position of the editor.&#13;Example: say: insert buy milk on way home."], //don't have alternatives
            ["note",                      [],                                       [["words", ""]], 'Inserts text into the end of the editor with a timestamp.&#13;Example: say: note read bio chapter 3.' ] //don't have alternatives
        ],
        [ ["say selection",             [],                                       [], "Select some text in the editor and &#13;say or click 'Say selection' to have it spoken."],
            ["define name",              ["defined name", "dine name", "define named"], [["name", ""], ["meaning", ""]],
                "Example: Say 'define name green comma is good'.&#13;Or select 'green is good' in the editor and&#13;click the menu item.&#13;Tap the space-bar briefly and say 'green',&#13;or click Job button 'green' to hear 'is good'."],
        ],
        [ ["gpt",                      ["GPT"],                                   [["prompt", ""]], "Passes the spoken text or selected text&#13;as a prompt to GPT.&#13;The response appears in the Output pane."],
        ],
        [ ["stop",                     [],                                        [], "Stop Dexter and other ongoing activities."],  //on both main and move menus
            ["quit",                     [],                                        [], "Stop activities and close the Talk dialog box."],
        ],

        [ ["move menu",                ["move"],                                  [], "Displays a menu of robot movement commands." ],
        ]
    ], //end main_menu





    static turn_on_speaker(content_obj) {
    if ((content_obj._content_str === "") && !this.listening) {
        this.enable_speaker = true
        let mess = "The speaker is now on.<br/>" + this.say_or_click()
        this.display_all(content_obj,mess)
        speak("The speaker is now on.")
    }
}

static turn_off_speaker(content_obj) {
    if ((content_obj._content_str === "")) {
        this.enable_speaker = false
        let mess = "The speaker is now off.<br/>" + this.say_or_click()
        this.display_all(content_obj, mess)
    }
}

//content_obj is optional and not actually used.
static quit(content_obj = null){
    Talk.stop_aux() //stop speaking, turn_off_mic, etc.
    //Talk.set_mode("main_menu")
    setTimeout(function () {  //not sure why this is needed but clicking "Off" doesn't close the show_window without it
        SW.close_window(Talk.sw_index)
    }, 100)
    if (Job.talk_internal) {
        Job.talk_internal.when_do_list_done = "run_when_stopped"
        //change from "wait" so that stop_for_reason will stop the job.
        Job.talk_internal.stop_for_reason("completed", "user stopped job")
        Job.talk_internal.undefine_job()
    }
}

static note(content_obj){
    if (content_obj._content_str === "") {
        this.set_params_mode(content_obj)
        return true
    }
    else {
        let text = content_obj._content_str
        let arg_obj = this.string_to_data(text)
        if(typeof(arg_obj) === "object") {
            text = arg_obj.words
        }
        let text_sans_date = text
        text = "\n//" + new Date() + "\n//" + text + "\n" //put in a comment so we can use this in "code" and it will mean nothing, esp in code wehre you wnat to eval the entire buffer
        Editor.insert(text, "end")
        Talk.dialog_dom_elt.focus() //we don't want to leave focus in the editor pane.
        let text_for_message = text_sans_date.substring(0, 40)
        if(text_for_message.length < text_sans_date.length){
            text_for_message += "..."
        }
        let mess = 'A note of "<i>' + text_for_message + '</i>"<br/>has been inserted into the editor.'
        Talk.display_message(mess)
    }
}

static insert(content_obj){
    if (content_obj._content_str === "") {
        this.set_params_mode(content_obj)
    }
    else {
        let text = content_obj._content_str
        let arg_obj = this.string_to_data(text)
        if(typeof(arg_obj) === "object") {
            text = arg_obj.words
        }
        Editor.insert(text, "end")
        Talk.dialog_dom_elt.focus() //we don't want to leave focus in the editor pane.
        let text_for_message = text.substring(0, 40)
        if(text_for_message.length < text.length){
            text_for_message += "..."
        }
        let mess = '"<i>' + text_for_message + ' </i>"<br/>has been inserted into the editor.'
        Talk.display_message(mess)
    }
}

//always speaks regardles of Talk.enable_speaker
static say_selection(content_obj){
    if(content_obj._content_str === "") {
        let sel = Editor.get_javascript(true)
        if (sel.length === 0) {
            Talk.warning("There is no selected text to speak.")
            speak({speak_data: "There is no selection. Drag the mouse over some text and try again."})
        }
        else { //the main case.
            speak({speak_data: sel})
        }
    }
    else {
        speak({speak_data: content_obj._content_str})
    }
}

static define_name(content_obj) {
    if (!content_obj._has_args) {
        let content_from_selection = Editor.get_javascript(true).trim()
        if (content_from_selection === "") {
            this.set_params_mode(content_obj)
            return true
        }
        else {
            let content_obj = this.define_name_handle_content_from_selection(content_from_selection)
            this.define_name_handle_content(content_obj)
        }
    }
    else {//we've passed in at least some content
        this.define_name_handle_content(content_obj)
    }
}

static define_name_handle_content_from_selection(content_from_selection) {
    content_from_selection = content_from_selection.trim()
    let words = content_from_selection.split(/\s/) //if content == "", first word will be "" with only one array elt
    let meaning = content_from_selection.substring(words[0].length + 1).trim()
    let content_obj
    let [parent_mode, cmd_str_from_mode, params_const] = Talk.mode.split("__")
    let cmd_norm_mode = ((params_const) ? parent_mode : Talk.mode)
    if (content_from_selection === "") {
        content_obj = {
            name: words[0],
            meaning: "",
            _cmd_norm_mode: cmd_norm_mode,
            _cmd_norm_with_underscores: "define_name",
            _has_args: false,
            _content_str: content_from_selection,
            _unused_param_names: ["name", "meaning"]
        }
    }
    else if (meaning.length > 0) {
        content_obj = {
            name: words[0],
            meaning: meaning,
            _cmd_norm_mode: cmd_str_mode,
            _cmd_norm_with_underscores: "define_name",
            _has_args: true,
            _content_str: content_from_selection,
            _unused_param_names: []
        }
    }
    else { //we have a first word, but not a meaning
        content_obj = {
            name: words[0],
            meaning: "",
            _cmd_str_mode: cmd_str_mode,
            _cmd_str: "define_name",
            _has_args: true,
            _content_str: content_from_selection,
            _unused_param_names: ["meaning"]
        }
    }
    return content_obj
}

static define_name_handle_content(content_obj) {
    let name   = content_obj.name
    let meaning = content_obj.meaning
    if (!name || !meaning) {
        this.set_params_mode(content_obj)
        return
    }
    name = this.string_to_job_name(name)
    if (this.is_known_cmd(name)) { //we want to exclude known recording names
        let mess = '"' + name + '" is a command, so it can&apos;t be used to name a Job.'
        this.set_params_mode(content_obj, mess)
        return
    }
    else { //got all the params so just do it.
        let the_job_src = '\nnew Job({name: "' + name + '",\n' +
            '         do_list: [\n' +
            '           function () {\n' +
            '             speak(`' + meaning + '`)}\n' +
            "]})\n"

        let mess
        if (this.is_existing_job_name(name)) {
            mess = 'The Job: "' + name + '" has been over-written with your new recording.'
        } else {
            mess = 'Say or click the Job button for: <b>' + name + '</b> to start it.'
        }
        eval(the_job_src) //put AFTER capturing the mess to say in case a Job of that name is not yet defined, but will be
        this.display_message(mess)
    }
}

static gpt_cb (envelope) {
    OpenAI.make_text_cb(envelope) //the default callback
    let response = OpenAI.envelope_to_response(envelope)
    Talk.speak_if_enabled(response)
    Talk.dialog_dom_elt.focus()
}

static gpt(content_obj) {
    let content_str = content_obj._content_str
    if(content_str === "") {
        content_str = Editor.get_javascript(true).trim()
        if (content_str === "") {
            this.set_params_mode(content_obj)
        }
        else {
            return this.gpt_aux(content_str)
        }
    }
    else {
        return this.gpt_aux(content_str)
    }
}

static gpt_aux(prompt){
    OpenAI.show_prompt(prompt)
    OpenAI.make_text(prompt, function(envelope) {
        OpenAI.make_text_cb(envelope)
        let response = OpenAI.envelope_to_response(envelope)
        Talk.speak_if_enabled(response)
        Talk.dialog_dom_elt.focus()
    })
}

static move_menu(content_obj){
    if(content_obj._content_str === "") {
        let mess
        if(globalThis.simulate_radio_true_id.checked){
            mess = "Dexter is in <b>simulate</b> mode.<br/>" +
                "(See Misc Pane header radio buttons.)<br/>" +
                "The real robot won't move when you run these commands."
        }
        else if(globalThis.simulate_radio_false_id.checked){
            mess = "Dexter is in <b>real</b> mode.<br/>" +
                "(See Misc Pane header radio buttons.)<br/>" +
                "The real robot will move when you run these commands."
        }
        else{
            mess = "Dexter is in <b>both</b> mode.<br/>" +
                "(See Misc Pane header radio buttons.)<br/>" +
                "The simulator and real robot will move when you run these commands."
        }
        this.set_mode("move_menu", content_obj, mess)
        this.dialog_dom_elt.focus()
    }
}
 */