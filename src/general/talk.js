/* How to add a new command
- Extend cmd_props_table with a row under the existing mode for the command.
  The param names must not contain spaces. Ex. "job_name"

- add a method for the command in Talk class, named the cmd prose name with spaces replaced by underscores
  which takes 3 args, full_text, the command string from speech reco (may contain internal spaces,
  and content, the text after the command (if any).  If none. content is the empty string.
  It does not start with a space.
  The method returns true if that method could handle the command and false or undefined if it can't.

- If you need to add a new mode, extend the cmd_props_table copying the syntax for an exiwting mode,
  and any new cmds under it.
  Mode names are all lower case, no spaces.
  Note that a cmd row can appear in more than one mode,
   but it needs to have the same behavior OR its method needs to banch on the Talk.mode to
   accomodate the different functionality.

- modes *should* also have a "misc" method named MODENAME_mode_misc  that takes full_text (string from reco),
  the first word of the full_text and the content after the first word.
  The first word has no spaces. The content does not start with a space.
  and returns true if it handles the full_text, undefined if it doesn't.
    MODENAME_mode_misc handle the misc full_text that can't be handled by the
    normal cmds of the mode, such as when we say just a Job name to run the job,
    or the param name and value in a param dialog.
    IF you need fancy parsing where the beginning of the utterance is NOT one of the
    known cmds for teh mode, then handle it in MODENAME_mode_misc.
    If there is no defined misc method, the user will get a warning:
    warning("Mode: " + Tall.mode + " doesn't have a matching command for: " + full_text + " (no misc method).")
    Else if there is a misc method, but no known cmds matched and the misc method did not match,
    the user gets a warning:
    warning("Mode: " + Tall.mode + " doesn't have a matching command for: " + full_text)
*/

class Talk {
    static speech_reco_possible //true or false
    static client
    static microphone
    static sw_index
    static mode

    static enable_speaker
    static speak_volume

    static listening
    static is_recording  //true or false
    static recording_name_now_playing //string

    static step_size  //float in meters
    static is_moving      //true or false. Automatically set to true when Dexter is moving due to user invoking a normal
                          //move command like "down". 
                          //To stop such a command as its running, set is_moving to false.
    static current_command_for_display_in_status
    static current_move_command //initially null, then when moving: "down", up, left, right, farther, closer, reverse, forward
    static last_move_command // a string
    static current_move_joint_number //only for joint moves
    static current_move_direction

    static instructions_being_recorded //null or an array of xyz arrays when is_recording is true.

    static last_reverse_forward_index  //int
    static forward_limit_index //int

    static job_for_normal_moves //normally set to the job named "talk_internal". Use "_internal" so users
       //will know its not for them to manipulate.
       //Has a robot of Dexter, normally dexter_default at initialization time

    //we can call this more than once, and it brings down prev dialog, etc.
    //and re-initializes
    static initialize(speech_reco_possible=true){
        this.speech_reco_possible = speech_reco_possible
        this.sw_index       = null
        this.mode           = "not_initialized"
        this.enable_speaker = false
        this.speak_volume   = 0.5
        this.listening      = false //can't find a way to determine this from Speechly
        this.is_recording   = false
        this.recording_name_now_playing = null

        this.step_size   = 0.005
        this.is_moving       = false
        this.current_command_for_display_in_status = "none yet"
        this.current_move_command        = null
        this.last_move_command           = null
        this.current_move_joint_number   = null //only for joint moves
        this.current_move_direction      = null   //only for joint moves

        this.instructions_being_recorded = null

        this.last_reverse_forward_index  = null
        this.forward_limit_index         = null
        if((Job.talk_internal) && Job.talk_internal.is_active()){
            Job.talk_internal.stop_for_reason("interrupted",
                                               "re-initialization of Job.talk_internal")
        }
        this.job_for_normal_moves = new Job ({name: "talk_internal",
            robot: Dexter.dexter_default,
            when_do_list_done: "wait",
            do_list: [
            ]
        }).start()
        this.init_speech_reco()
        setTimeout(Talk.display_ui, 1000) //give chance for the above init to work,
        //before showing UI that the user can interact with since
        //if they try speaking before the above init, it will fail.
        DocCode.open_doc(talk_doc_id)
    }

    static init_speech_reco(){
        if(!globalThis.SpeechRecognition) {
            globalThis.SpeechRecognition = globalThis.webkitSpeechRecognition ////only webkitSpeechRecognition is bound in chrome, against w3c spec.
        }
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = false;  //true doesn't seem to work, but in any case,
        // it's documented to stop reco after a while anyway, so not really continuous.
        this.recognition.lang = 'en-US';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onaudiostart = function() {
            console.log(" got onaudiostart")
        }

        this.recognition.onsoundstart = function() {
            console.log(" got onsoundstart")
            //Talk.recognition.start()
        };

        this.recognition.onspeechstart = () => {
            console.log("Speech has been detected");
        };

        this.recognition.onstart = function(){ //after recognition.start is called and its ready to recieve speech, this will automatically be called.
            console.log("got recognition.onstart")
        }

        this.recognition.onresult = function(event) { //not called if onsoundstart called but no actual words
                                                 // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
                                                 // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
                                                 // It has a getter, so it can be accessed like an array
                                                 // The first [0] returns the SpeechRecognitionResult at the last position.
                                                 // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
                                                 // These also have getters, so they can be accessed like arrays.
                                                 // The second [0] returns the SpeechRecognitionAlternative at position 0.
                                                 // We then return the transcript property of the SpeechRecognitionAlternative object
            Talk.turn_off_mic_aux()
            let full_text = event.results[0][0].transcript
            console.log("got onresult of text: " + full_text)
            full_text = Talk.replace_reco_words(full_text)
            console.log("onresult replaced text: " + full_text)
            console.log('Confidence: ' + event.results[0][0].confidence);

            Talk.handle_command(full_text) //the main call to handle_command
        }

        this.recognition.onnomatch = function(event){
            Talk.display_message("Sorry, speech recognition failed. Please try again.")
            Talk.turn_off_mic_aux()
        }

        //fired when there is actual speech detected BUT
        // might be called before or after onresult.
        //but also called when no speech detected, but there is sound.
        //So for the later case, we need to call Talk.turn_off_mic_aux() to chante
        //the status to turn off the mic, but for the former,
        //we need to NOT call a warning since maybe onresult was called.
        //if onresult was called, Talk.listening will be false and we don't
        //then want to issue the warning.

        //if onresult is called (by google) onspeechend will be called AFTER it.
        //but if onresult is not called, onspeechend is still called.
        //the "event" arg has no useful info in it other than maybe a timestamp.
        this.recognition.onspeechend = function(event) { //seems to be called AFTER onresult which doesn't match the spec
            console.log("got onspeechend")
            //Talk.recognition.stop();
            if (Talk.listening) {
                Talk.turn_off_mic_aux()
                //Don't warn because sometimes onspeechend is called AFTER we've already got the result,
                //Now if we got the result, that should hav
                // Talk.display_warning("Talk detected noise but not speech.<br/>Tap the space-bar and speak clearly.")
            }
        }

         //called when recognition.abort() is called, which I often do.
        this.recognition.onerror = function(event) {
            Talk.turn_off_mic_aux()
            console.log("got onerror of " + event.error) //"no-speech" after about 5 secs of quiet.// "network" immediately after click and no net connection
            if(event.error === "no-speech") {
                Talk.display_warning("Talk did not hear you say anything.<br/>After tapping the space-bar briefly you must say a command.")
            }
            Talk.listening = false
            Talk.display_status()
        }
        if(!Dexter.check_joint_limits) {
            Dexter.check_joint_limits = true
            warning("Dexter.check_joint_limits has been set to true during Talk init.<br/>" +
                    "To turn it off, eval: <code> Dexter.check_joint_limits = false </code>.")
        }
    }

    static replace_reco_words(full_text){
        full_text = full_text.trim()
        let result = ""
        let word_array = full_text.split(" ")
        for(let word of word_array){
            let new_word = this.word_replacements[word]
            if(new_word){
                result += new_word + " "
            }
            else { result += word + " " }
        }
        return result.trim()
    }

    static word_replacements = {
        //"poor": "pour", //as in "pour water"
        fu:   "foo",
        fubar: "foo bar",
        apostrohe:   "'", //also single-quote
        asterisk:    "*",
        Asterix:     "*",
        ampersand:   "&",
        //back quote is recoed as 2 works
        backslash:   "\\",
        circumflex:  "^",
        colon:       ":",
        comma:       ",",
        //"exclamation": "!", //use exclamation point instead
        dash:        "-",  //shorter than hyphen. meaning of hypehn is for multi-word terms nad 2 different kinds of dash for esparating caulses, but dash would be ok to separate words.
        hyphen:      "-",
        period:      ".",
        //"quote":       "quote" //use double quote instead. Todo multi-word term replacements
        semicolon:   ";",
        slash:       "/",
        tilde:       "~",
        Tilda:       "~",
        underscore:  "_"
    }

    static display_ui(){
        //use Talk, not "this" in this method
        if(typeof(Talk.sw_index) === "number") {
            SW.close_window(Talk.sw_index) //note the html for the title is stripped
            Talk.sw_index = null
        }
        Talk.sw_index =
        show_window({title: "<b>Talk to Dexter</b>",
            x: 200, y:7, width: 570, height: 390,
            content: `<fieldset style="padding:2px;"><legend><i>Status</i></legend>
                            <div id="display_status_id"></div>
                            <div id="talk_out_id" style="background-color:white;font-size:20px;padding:5px;height:60px;"></div>
                      </fieldset>
                      <fieldset style="padding:2px;"><legend><i>Valid Commands</i></legend>
                            <ul id='valid_commands_id' style="font-size:22px;margin:0px 0px 0px 20px; padding:0px;"></ul>
                      </fieldset>`,
            callback: "Talk.sw_callback"
        })
        setTimeout(function() {
            Talk.dialog_dom_elt = SW.get_show_window_elt(talk_out_id)
            Talk.dialog_dom_elt.onkeydown = //don't use onkeyup here because that causes the whole dde window to scroll up about an inch. Very annoying.
                function(event){
                    if (event.key === " ") { //when talk dialog is up, and user hits space, turn on the mic.
                        console.log("talk whole dialog got space char")
                        //Talk.stop_except_speaking()
                        Talk.stop_aux() //fast as possible to set is_moving to false
                        //globalThis.stop_speaking()

                        event.stopPropagation()
                        event.preventDefault()
                        setTimeout(function() { //needed because if the mic is still on when the used hits space bar again,
                            //the call to this.recognition.start() inside turn_on_mic will error.
                            //Now we try to turn off the underlying mic in stop_except_speaking but
                            //apparently this doesn't happen immediately so give it 100 ms to stop
                            Talk.turn_on_mic_aux()
                        }, 100)
                    }
                }

            Talk.dialog_dom_elt.onblur = function(event){
                if(event.relatedTarget) { //when the reason onblur is called is because we're focusing on a type_in elt in the talk dialog, we want to keep the dialog background non-gray
                    let ancests = Utils.get_dom_elt_ancestors(event.relatedTarget, false)//don't include event.target in ancests
                    if (ancests.includes(Talk.dialog_dom_elt)) { //don't change dialog message.  Leave Talk.dialog_dom_elt fully visible with whatever its current message is which is probably instructions for filling in its input field.
                    }
                    else {
                        SW.sw_shrink(Talk.dialog_dom_elt)
                    }
                }
                else {
                    SW.sw_shrink(Talk.dialog_dom_elt)
                }
            }

            Talk.dialog_dom_elt.onfocus = function(event){
                if(event.relatedTarget) { //when the reason onblur is called is because we're focusing on a type_in elt in the talk dialog, we want to keep the dialog background non-gray
                    let ancests = Utils.get_dom_elt_ancestors(event.relatedTarget, false)//don't include event.target in ancests
                    if (ancests.includes(Talk.dialog_dom_elt)) { //don't change dialog message.  Leave Talk.dialog_dom_elt fully visible with whatever its current message is which is probably instructions for filling in its input field.
                    }
                    else {
                        console.log("in onfocus for dialog_dom_elt calling display_status")
                        SW.sw_expand(Talk.dialog_dom_elt)
                        Talk.display_status()
                        Talk.display_color()
                    }
                }
                else {
                    console.log("in onfocus for dialog_dom_elt calling display_status")
                    SW.sw_expand(Talk.dialog_dom_elt)
                    Talk.display_status()
                    Talk.display_color()
                }
            }
            let content_obj = Talk.content_str_to_content_obj("main menu", "main menu", "", "main menu", "main_menu")
            let mess = "Tap the space-bar briefly and say a command<br/>" +
                       "or click on one.<br/>" +
                       "If you're a new user, try <b>Note</b>. Please read tooltips."
            Talk.set_mode("main_menu", content_obj, mess)
            }, //need "Talk" here, not "this"
            200
        )
        //Talk.display_message(Talk.say_or_click())
    }

    static sw_callback(vals){
        //out(vals)
        let but_val = vals.clicked_button_value
        if(but_val === "close_button") {
            Talk.quit()
        }
        else {
            shouldnt("Talk.sw_callback got invalid button_value of: " + but_val)
        }
    }

    static set_params_mode(content_obj, message){
        let cmd_norm = content_obj._cmd_norm
        let cmd_meth_name = this.string_to_method_name(cmd_norm)
        let the_new_mode = content_obj._cmd_norm_mode + "__" + cmd_meth_name + "__params"
        this.set_mode(the_new_mode, content_obj)
    }

    static set_mode(mode, content_obj, message){
        Talk.mode = mode //must use "Talk", not "this" due to setTimeout call
                         //oneof main_menu, move_menu, or param like: "main_menu__define_term__params"
        Talk.display_all(content_obj, message)
    }

    //shows status including valid cmds
    //not passing in a message displays the default message.
    static display_all(content_obj, message, related_target=document.activeElement){ //display_all
        //out("top of display_all")
        this.display_status()
        this.display_color(related_target)
        this.display_commands(content_obj)
        this.display_message(message, content_obj)
    }

    static display_status(){
        if (globalThis.display_status_id) { //show_window is shown
            let step_value_color = "black"
            if      (this.step_size < 0.005) { step_value_color = "blue"}
            else if (this.step_size > 0.005) { step_value_color = "red"}
            display_status_id.innerHTML =
                "<i>Mic:           </i><b>" + (this.is_mic_on()    ? "<span style='color:rgb(0, 220, 0);'>on</span>" : "off") + "</b> &nbsp;" +
                "<i>Speaker:       </i><b>" + (this.enable_speaker ? "<span style='color:rgb(0, 220, 0);'>on</span>" : "off") + "</b> &nbsp;" +
                "<i>Recording:     </i><b>" + (this.is_recording   ? "<span style='color:rgb(0, 220, 0);'>on</span>" : "off") + "</b> &nbsp;" +
                "<i>Moving:        </i><b>" + (this.is_moving      ? "<span style='color:rgb(0, 220, 0);'>on</span>" : "off") + "</b> &nbsp;" +
                "<i>Step size: </i><b title='The default step size is: 0.005m (5 millimeters).' style='color:" + step_value_color + ";'>" + this.step_size + "m</b><br/>" +
                "<i>Mode:          </i><b>" + this.mode + (Talk.recording_name_now_playing ? " " + Talk.recording_name_now_playing : "") + "</b> &nbsp;" +
                "<i>Last command:  </i><b>" + this.current_command_for_display_in_status + "</b>"
        }
    }

    static display_message(message, content_obj){ //display_message
       if (message){} //just use it below
        else if (content_obj) {
            let param_names = content_obj._param_names
            if (param_names.length === 1) {
                message = "For <b>" + content_obj._cmd_norm + "</b>, tap space-bar and say the value for: " + param_names[0] +
                    "<br/>or type it in."
            } else {
                message = "For <b>" + content_obj._cmd_norm + "</b>, say a param_name and its new value<br/>" +
                    "or type in a new value."
            }
        }
        else {
           shouldnt("Talk.display_message passed no message and no content_obj.")
       }
        if(globalThis.talk_out_id) { //the dialog is up.
            talk_out_id.innerHTML = message
        }
    }

    static display_color(related_target) { // display_color related_target is like print_elt_id, aan input elt inside the dialog , or nothing
        console.log("top of display_color passed related_target:")
        //console.log(related_target)
        //console.log("and activeElement")
        //console.log(document.activeElement)
        let color = "#ffd6c2"
       /* probably best to always keep tan. out-of-focus shrinks the pane so we *should* never
         see the out-of-focus gray, but occassionally it shows up and is annoying.
       let in_focus_color = "#ffd6c2" //"#ffd9ad" //tan  rgb(255, 253, 208) //cream
        let out_focus_color = "gray"
        //let bg_color=  ((document.activeElement === this.dialog_dom_elt) ? in_focus_color : out_focus_color)

        let ancests = []
        if(related_target) {
            ancests = Utils.get_dom_elt_ancestors(related_target) //document.activeElement)
        }
        if(document.activeElement === this.dialog_dom_elt){
            color = in_focus_color
        }
        else if(ancests.includes(Talk.dialog_dom_elt)) {
            color = in_focus_color
        }
        else if(this.is_moving) {
            color = rgb(100, 255, 100)
        }
        else {
            color = out_focus_color
        } */
        display_status_id.style["background-color"] = color
        talk_out_id.style["background-color"] = color
        this.dialog_dom_elt.style["background-color"] = color
        //console.log("just set color to: " + color + " with activeElement: ")
        //console.log(document.activeElement)
        //console.log("document.activeElement: " + document.activeElement)
        console.log("_________end of display_color")
    }

    static display_commands(content_obj){
        valid_commands_id.innerHTML = this.cmds_html_for_current_mode(content_obj)
    }

 //_______command Utilities_______

    static onkeydown_for_arg_input(event){
        event.stopPropagation()
        //event.preventDefault()
    }

    static onkeyup_for_arg_input(event){
        event.stopPropagation()
        //event.preventDefault()
        if(event.key === "Enter") {
            let [parent_mode, cmd_str] = Talk.mode.split("__")
            let names = Talk.cmd_param_names_for_current_params_mode()
            let last_name = Utils.last(names)
            let [id_parent_mode, cmd, params_const, param_name] = event.target.id.split("__")
            if(param_name === last_name){ //user edited last param value and hit Enter, so just run the cmd
                Talk.handle_command("run")
            }
            else { //focus on next input
                let cur_index = names.indexOf(param_name)
                let next_index = cur_index + 1
                let next_param_name = names[next_index]
                let next_id = parent_node + "__" + cmd_str + "__params__" + next_param_name
                let next_dom_elt = thisGlobal[next_id]
                if(next_dom_elt) {
                    next_dom_elt.focus()
                }
            }
        }
    }

    //ok if content_obj is undefined. That just means display all the fields without
    //getting any previous values, just use defaults.
    static cmds_html_for_current_mode(content_obj) {
        if (this.mode.endsWith("__params")) {
            let [parent_mode, cmd_norm_with_underscores] = this.mode.split("__")
            let params = this.cmd_params_for_current_params_mode()
            let html = ""
            let tooltip = "A parameter for the " + content_obj._cmd_norm + " command."
            for (let param of params) {
                let [param_name, def_val] = param
                if(typeof(def_val) === "function"){
                    def_val = def_val.call(Talk)
                }
                if(content_obj && content_obj[param_name]){
                    let prev_val = content_obj[param_name]
                    if(![undefined, ""].includes(prev_val)) {
                        def_val = content_obj[param_name]
                    }
                }
                let id = this.mode + "__" + param_name + "__id"
                html += "<li style='height:30px;' title='" + tooltip + "' >" + param_name + ": " +
                    '<input style="width:300px;" id="' + id + '" value="' + def_val + '"' + //must have singlue quote on outise,d double on inside because def_val might be "it's raining" and we need to capture that snglue quote inside the string for def_value.
                    " onkeydown='Talk.onkeydown_for_arg_input(event)' " +
                    "' onkeyup='Talk.onkeyup_for_arg_input(event)' " +
                    "'/></li>\n"
            }

            //html that, when clicked on will run the cmd with all the args in the param menu
            let click_source = "Talk.handle_command('run')"
            //we want to bypass the handle_command call because it would call the cmd table but it can't handle the params dialog
            //Talk.handle_command('" + norm_cmd + "')"
            tooltip = "Run the " + content_obj._cmd_norm + " command with the param values in this dialog box."
            let display_prose = "Run"
            let li_body_html = '<span class="talk_cmd" onclick="' + click_source + '"' + //performing span onclick doesn't trigger onblur for dialog box as a whole and since these links change after dialog creation, doesn't need the fancy SW processing to call the sw callback upon click
                ' title="' + tooltip +
                '">' +
                display_prose + '</span>\n'
            let li_menu_item = "<li style='height:30px;'>" + li_body_html + "</li>\n"
            html += li_menu_item

            //html that, when clicked on will go back to the parent mode menu
            click_source = "Talk.set_mode('" + parent_mode + "', undefined, Talk.say_or_click())"
                  //we want to bypass the handle_command call because it would call the cmd table but it can't handle the params dialog
                  //Talk.handle_command('" + norm_cmd + "')"
            tooltip = "Change the menu of commands back to the main menu."
            display_prose = Talk.string_to_display_prose(parent_mode)
            li_body_html = '<span class="talk_cmd" onclick="' + click_source + '"' + //performing span onclick doesn't trigger onblur for dialog box as a whole and since these links change after dialog creation, doesn't need the fancy SW processing to call the sw callback upon click
                            ' title="' + tooltip +
                            '">' +
                            display_prose + '</span>\n'
            li_menu_item = "<li style='height:30px;'>" + li_body_html + "</li>\n"
            html += li_menu_item
            return html
        }
        else {//regular mode
            let cmds_for_mode = this.cmd_props_table[this.mode]
            if (cmds_for_mode) {
                return this.make_command_list_items(cmds_for_mode)
            }
            else {
                shouldnt("cmds_html_for_current_mode passed unknown mode: " + this.mode)
            }
        }
    }

     //for format of cmds_for_mode, see cmd_props_table for any mode.
    static make_command_list_items(cmds_for_mode){
        let result = ""
        for(let cmd_rows of cmds_for_mode){
            if(!cmd_rows ) { continue }
            result += "<li style='height:30px;'>"
            for(let cmd_props of cmd_rows) {
                if(!cmd_props ) { continue }
                let cmd_normalized_prose = cmd_props[0]  //usually a string, but could be a fn
                let should_display = this.cmd_display(cmd_normalized_prose)
                if(!should_display) { //don't display this cmd
                    continue
                }
                if ((cmd_rows.length > 1) && (cmd_props !== cmd_rows[0])) { //put comma before every non-first elt
                    result += " &nbsp;&#x2022;&nbsp;"
                }
                let display_prose = this.cmd_display_prose(cmd_normalized_prose) //upper case first letter, spaces between words
                let tooltip = this.cmd_tooltip(cmd_normalized_prose)
                let click_source = "Talk.handle_command('" + cmd_normalized_prose + "')"
                let style_val = "" //text-decoration: underline; color:#3600cc " //#7d00fa; " //purple
                if(cmd_normalized_prose === 'stop recording') {
                    style_val += "background-color:rgb(255, 180, 180);"
                }
                /*li_body_html = '<a class="simple_cmd" href="#" ' + color +
                                   //' onclick="' + click_source + '"' +
                                   ' title="' + tooltip + '">' + display_prose + '</a>' */
                let li_body_html = '<span class="talk_cmd" onclick="' + click_source  + '"'  + //performing span onclick doesn't trigger onblur for dialog box as a whole and since these links change after dialog creation, doesn't need the fancy SW processing to call the sw callback upon click
                                      ' style="' + style_val     + '"'  +
                                      ' title="' + tooltip       + '">' +
                                                   display_prose + '</span>\n'
                //onsole.log("got: " + li_body_html)
                result += li_body_html
            }
            result += "</li>\n"
        }
        return result //+= "<li><span onclick='alert(123)' name='myname'>cont</span></li>"
    }

    //presents collecting an argument to a command for user to "fill in"
    /*obsolete static show_command_parameter(cmd_meth_name) {
        let callback_name = cmd_meth_name + "_from_type_in"
        let param_name = this.cmd_param_name(cmd_meth_name)
        let callback_callback = Talk[cmd_meth_name + "_action"]
        this.define_command_parameter_callback(callback_name, param_name, callback_callback)
        let default_value = this.cmd_param_default_value(param_name)
        let doc = "Say or type in " + param_name
        this.display_message(doc +
            " <input id='print_text_id' " +
            " onkeyup='Talk." + callback_name + "(event)' " +
            " value='" + default_value + "'/>"
        )
    }

    static define_command_parameter_callback(callback_name, callback_param_name, callback_callback){
        Talk[callback_name] = function(event) {
            event.stopPropagation()
            if (event.key === "Enter") {
                let arg_str = event.target.value
                if (arg_str && (arg_str.length > 0)) {
                    callback_callback(arg_str)
                }
                else {
                    //Talk.move_menu()
                    Talk.display_warning("You must type something in.")
                }
            }
            else if ((event.key === " ") &&
                (event.target.value.length === 0)) {
                let call_back_param_doc = "Say " + callback_param_name + "."
                Talk.display_message(call_back_param_doc)
                Talk.turn_on_mic()
                Talk.dialog_dom_elt.focus()
            }
        }
    }
    */

    //static modes = ["main_menu", "move_menu", "waiting_for_job_name", "waiting_for_place_name", "playing_recording"]

    //used in cmd_props_table
    /*
    static display_turn_on_mic(){
        return (this.speech_reco_possible && !this.is_mic_on())
    }
    static display_turn_off_mic() {
        return (this.speech_reco_possible && this.is_mic_on())
    }*/

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
     move_menu: [
      [["simulate",                  ["simulator"],                              [], "Causes robot commands to be simulated."],
       ["real",                      [],                                         [], "Causes robot commands to go to the real robot."],
       ["both",                      [],                                         [], "Causes robot commands to be simulated and&#13;go to the real robot."],
      ],
      [ ["straight up",              [],                                         [], "Move Dexter until its straight up and stop."],
        ["joint",                    [],                                         [["joint_number", "1"], ["direction", "clockwise"]], "Move one of Dexter's joints,&#131 thru 7,&#13clockwise or counter clockwise."],
      ],
      [ ["up",                        [],                                        [], "Move Dexter up."],
        ["down",                      [],                                        [], "Move Dexter down.&#13;If Dexter is straight up (as it is initially)&#13;you must move it down&#13;before moving it in any other direction."],

        ["left",                      [],                                        [], "Move Dexter left."],
        ["right",                     ["right turn", "write"],                   [], "Move Dexter right."],

        ["closer",                    [],                                        [], "Move Dexter closer to its base."],
        ["farther",                   ["further"],                               [], "Move Dexter farther from its base."],

        ["stop",                     [],                                         [], "Stop Dexter and other ongoing activities."]  //on both main and move menus

      ],
      [ ["faster",                    [],                                        [], "Double the speed of Dexter when it moves."],
        ["slower",                    [],                                        [], "Half the speed of Dexter when it moves."],

        ["forward",                  ["foreword"],                               [], "Move Dexter forward after you have moved it back along its path."],
        ["reverse",                  [],                                         [], "Move Dexter back along the path from whence it came."],
      ],
      [ ["define place",             ["defined place", "dine place"],            [["job_name", ""]], "Assign Dexter's current position to a name."],
        ["start recording",          ["started recording"],                      [], "Begin the recording of Dexter move commands into a Job.", Talk.display_start_recording],
        ["stop recording",           [],                                         [["job_name", ""]], "Stop the recording of Dexter move commands into a Job.",  Talk.display_stop_recording],
      ],
      [ ["run job",                  ["run jobe", "ron job"],                               [["job_name", Talk.default_job_name]], "Say 'Run Job [job name] or&#13;just the Job name to&#13;start the Job."],
        ["edit job",                 [],                                         [["job_name", Talk.default_job_name]], "Say 'Edit [job name] to&#13;insert the Job definition into the editor."], //don't have alternatives
      ],
      [
        ["main menu",                ["main", "maine"],                          [], "Change the menu of commands back to the main menu."],
      ],
   ], //end move_menu
   params: [ //the constant cmds for all params valid cmds. Dynamically the "back" menu gets added by cmd_rows_for_mode and a row for each param will get added by cmds_html_for_current_mode
      [ ["main menu",                ["main", "maine"],                          [], "Change the menu of commands back to the main menu."],
        ["run",                      [],                                         [], "Run the current command with the values for each param."]
      ]
   ]
} //end cmd_props_table
    //not called Apr 22 whuich is good because excludes params mode if any.
    static is_mode(a_string){
        if(this.cmd_props_table[a_string]){
            return true
        }
        else { return false}
    }

    //does not check for existence, just converts string to the right FORMAT of a cmd_normalized_prose.
    //used to get a recording_name as might be spoken
    static string_to_cmd_normalized_prose(string){
        let paren_index = string.indexOf("(")
        if (paren_index !== -1) {
            string = string.substring(0, paren_index) //open paren means the close paran ends the whole cmd, so we don't have to check for it.
                                                      //an open paren signifies a comment to the end of the string
        }
        string = Utils.trim_all(string) //trim off begin and ending witespace. replace multiple whitespace with one space.
        string = string.toLowerCase()
        string = string.replaceAll(",", "")
        string = string.replaceAll("'", "")
        string = string.replaceAll("_", " ")
        return string
    }

    //does not check if method actually exists for the returned string.
    static string_to_method_name(string) { //also returns proper spelling for recording_name
        string = this.string_to_cmd_normalized_prose(string)
        string = string.replaceAll(" ", "_")
        string = string.replaceAll("'", "") // "don't" => "dont"
        return string
    }

    //returns null or an actual define job name.
    static job_name_prose_to_existing_job_name(job_name_prose){
        job_name_prose = job_name_prose.replaceAll(" ", "_").toLowerCase()
        job_name_prose = job_name_prose.replaceAll("'", "")
        job_name_prose = job_name_prose.toLowerCase()

        let job_names = Job.defined_job_names() //this.array_of_recording_names()
        for(let existing_job_name of job_names){
            let now_lower_case_job_name = existing_job_name.toLowerCase()
            if(now_lower_case_job_name === job_name_prose){
                return existing_job_name //the name of an actual job
            }
        }
        return null //no jobs of that name
    }

    //if content (possibly multiple word string) can reasonably represent an existing job name,
    //the name of that existing job is returned.
    //Otherwise replacing spaces with underscores, etc. is done to make a good, new,
    //job name is returned.
    static string_to_job_name(content) {
        let job_name
        let existing_job_name = this.job_name_prose_to_existing_job_name(content) //if we get a case insensitive match on an existing job name. return the exsting job_name with upper case chars.
        if (existing_job_name) {
            job_name = existing_job_name
        }
        else {
            job_name = this.string_to_method_name(content) //lower_cases, repalce apce with underscore
        }
        return job_name
    }

    static string_to_display_prose(string){
        string = string.replaceAll("_", " ")
        string = Utils.make_first_char_upper_case(string)
        return string
    }

    //for Talk.mode of main_menu and move_menu, returs "main menu: or "move menu"
    //fpr param Talk.mode, it gets the parent mode and also changes underscores to spaces.
    static cmd_normalized_prose_from_current_mode(){
        let [parent_mode, cmd_str, params] = this.mode.split("__")
        return this.string_to_cmd_normalized_prose(parent_mode)
    }

    //if mode is a normal mode (non-params) just get the rows from the cmd_props_table.
    //otherwise, get the "params" rows from the cmd_props_table and
    //add the appropriate "menu" row the return those rows.
    //For a params mode, this does not return rows for each param. handle_command
    //does that separately.
    static cmd_rows_for_mode(a_mode){
        let rows = this.cmd_props_table[a_mode]
        if(rows) { return rows }
        else {
            let [parent_mode, cmd_str, params_const] = a_mode.split("__")
            if(params_const){
              let rows = this.cmd_props_table["params"].slice()
              //let norm_prose = this.cmd_normalized_prose_from_current_mode()
              //let tooltip = "Change the menu of commands back to the " + norm_prose + "."
              //let menu_row = [norm_prose, [], [], tooltip]
              //rows.push([menu_row])
              return rows
            }
            else {
                shouldnt("In Talk.cmd_rows_for_mode passed mode: " + a_mode + " is not in cmd_props_table more is it a params mode.")
            }
        }
    }


    //returns true for regular Talk cmds only
    static is_known_cmd(cmd, a_mode=Talk.mode){
        let cmd_props = this.get_cmd_props(cmd, a_mode)
        if(cmd_props){ return true }
        else         { return false }
    }

    //returns cmd_props but with no function as the first elt of the array
    //OR null if cmd is not in a_mode
    static get_cmd_props(cmd, a_mode=Talk.mode){ //ex: cmd === "print", returns ["print", "Print (text)", ...]
        if(!cmd) { return null }
        cmd = cmd.toLowerCase()
        cmd = cmd.replaceAll("_", " ")
        if(a_mode.endsWith("__params")){
            //use_mode = parent_mode
            a_mode = "params"
        }
        let cmds_for_mode = this.cmd_props_table[a_mode]
        for(let cmd_row of cmds_for_mode){  //cmd_arr ex: ["print", "Print (text)", ...]
            for(let cmd_props of cmd_row) {
                let normalized_cmd = cmd_props[0]
                if ((normalized_cmd === cmd) || (cmd_props[1] === cmd)) { //excludes other props on purpose
                    return cmd_props
                }
            }
        }
        return null  //happens when say cmd === "turn off speaker" but speaker is not on so "turn off speaker" is not displayed in the menu and is not valid in the current mode
        //also could happen if cmd is just never legit and the whole utterance is going to the default (gpt)
    }

    static cmd_display(cmd, a_mode=Talk.mode){
        let cmd_props = this.get_cmd_props(cmd, a_mode)
        let raw = cmd_props[4]
        if(raw === undefined)              { return true } //the default
        else if(typeof(raw) === "boolean") { return raw }
        else if(typeof(raw) === "function"){
            return raw.call(Talk)
        }
        else {
            shouldnt("Talk.cmd_display called with cmd_props: " + cmd_props +
                     " with invalid value: " + raw)
        }
    }

//called at top of handle_command. all lower case, spaces between words
    static cmd_normalized_prose(cmd, a_mode=Talk.mode){
       cmd = cmd.toLowerCase()
       cmd = cmd.replaceAll("_", " ")
       let cmd_props = this.get_cmd_props(cmd, a_mode)
       if(cmd_props){
           let norm_cmd = cmd_props[0]
           return norm_cmd
       }
       else { //can happen for Job names
           return cmd
       }
    }

    static cmd_display_prose(cmd, a_mode=Talk.mode){
        let result = cmd.replaceAll("_", " ")
        result = Utils.make_first_char_upper_case(result)
        let params = this.cmd_params(cmd, a_mode)
        if(!params) { shouldnt("cmd_display_prosep passed unknown cmd: " + cmd) }
        else if (params.length === 0) {}
        else {
            let first_param_name = params[0][0]
            result += " (" + first_param_name
            if (params.length > 1) {
                result += ", ..."
            }
            result += ")"
        }
        return result
    }

    static cmd_method_name(cmd){
        let result = cmd.replaceAll(" ", "_")
        result = result.replaceAll("'", "") // "don't" => "dont"
        if(typeof(Talk[result]) === "function") {
            return meth_name
        }
        else {
            shouldnt("Talk.cmd_method_name passed unknown cmd: " + cmd)
        }
    }

    static cmd_method(cmd){
        let meth_name = this.cmd_method_name(cmd)
        if(meth_name) { return Talk[meth_name] }
        else {
            return null
        } //not found
    }

    static cmd_params(cmd, a_mode=Talk.mode){
        let cmd_props = this.get_cmd_props(cmd, a_mode)
        if(!cmd_props) { shouldnt("In Talk.cmd_params, passed unknown cmd: " + cmd)}
        return cmd_props[2]
    }

    static cmd_param_names(cmd, a_mode=Talk.mode){
        let params = this.cmd_params(cmd, a_mode)
        let param_names = []
        for(let param of params){
            param_names.push(param[0])
        }
        return param_names
    }

    //returns an array of elements of [param_name, default_value]
    //Talk.mode is expectect to be a string with suffix "__params"
    /*static cmd_params_for_current_params_mode(){
        let [parent_mode, cmd_str_with_underscores, params] = this.mode.split("__")
        if(!params){
            shouldnt("Talk.cmd_params_for_current_params_mode called with mode: " + this.mode +
            " which isn't a __params__ mode.")
        }
        else {
            let cmd_str = cmd_str_with_underscores.replaceAll("_", " ")
            let rows = this.cmd_props_table[parent_mode]
            for (let row of rows) {
                for (let cmd_arr of row) {
                    let cmd_norm = cmd_arr[0]
                    if (cmd_str === cmd_norm) {
                        return cmd_arr[2]
                    }
                }
            }
            shouldnt("cmd_param_names_for_current_params_mode couldn't find the cmd: " +
                cmd_str + " in mode: " + parent_mode)
        }
    }*/

    static cmd_params_for_current_params_mode() {
        let [parent_mode, cmd_str_with_underscores, params] = this.mode.split("__")
        if (!params) {
            shouldnt("Talk.cmd_params_for_current_params_mode called with mode: " + this.mode +
                " which isn't a __params__ mode.")
        } else {
            let cmd_norm = cmd_str_with_underscores.replaceAll("_", " ")
            let cmd_props = this.get_cmd_props(cmd_norm, parent_mode)
            return cmd_props[2]
        }
    }

    static cmd_param_names_for_current_params_mode(){
        let params = this.cmd_params_for_current_params_mode()
        let param_names = []
        for(let param of params){ //name-default_value pairs
            param_names.push(param[0])
        }
        return param_names
    }

    static is_param(cmd, param_name, a_mode=Talk.mode){
        let params = this.cmd_param_names(cmd, a_mode)
        if(params.length === 0) { shouldnt("In Talk.cmd_param_default_value, passed unknown cmd: " + cmd)}
        for(let a_param of params) {
            if(a_param === param_name) {
                return true
            }
        }
        return false
    }

    static cmd_param_default_value(cmd, param_name, a_mode=Talk.mode){
        let params = this.cmd_params(cmd, a_mode)
        if(!params) { shouldnt("In Talk.cmd_param_default_value, passed unknown cmd: " + cmd)}
        for(let a_param of params) {
           if(a_param === param_name) {
               let default_value = a_param[1]
               if(typeof(default_value) === "function") {
                   default_value = result.call(Talk)
               }
               return default_value
           }
       }
       shouldnt("In Talk.cmd_param_default_value, passed unknown param: " + param_name + " for cmd: " + cmd)
    }

    //always returns an array.
    //If include_normalized_prose is true, the array will always be non-empty
    //with the normalized prose as the first elt.
    //else if include_normalized_prose is false, and there are no alternatives in the table,
    //returns the empty array.
    static cmd_alternatives(cmd, include_normalized_prose=true, a_mode=Talk.mode){
        let cmd_props = this.get_cmd_props(cmd, a_mode)
        let alts
        if(!cmd_props){ //hits when say cmd is "turn speaker off" when the speaker is already off, so "turn speaker_off" is not on the menu.
            return []   //so saying it has no alteratives is literally true.
            //but more than that, even if include_normalized_prose == true, we want to return []
            //so that in the normal call to cmd_alternatives at the top of the cmd methods,
            //"cmd" will NOT match any alternatives, and the method will return "invalid"
            //so that we move on to check the next cmd in the cmds_for_mode.
        }
        else {
            alts = cmd_props[1]
        }
        if(!alts){ //no alts in the table so []
            alts = []
        }
        if(include_normalized_prose){ //If cmd is not in the table, this will cause the alts return to be [cmd]
            //now if cmd is not allowed, this would be
            alts = alts.slice() //copy
            alts.unshift(this.cmd_normalized_prose(cmd))
        }
        return alts
    }

    static cmd_tooltip(cmd, a_mode=Talk.mode){
        let cmd_props = this.get_cmd_props(cmd, a_mode)
        if(cmd_props){ return cmd_props[3] }
        return ""  //don't return null as I use the result in a title dom elt.
    }

//______Show mode commands__________

    //from: https://stackoverflow.com/questions/822452/strip-html-from-text-javascript
    static strip_html(str){
        str=str.replace(/<\s*br\/*>/gi, "\n");
        str=str.replace(/<\s*a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ");
        str=str.replace(/<\s*\/*.+?>/ig, "\n");
        str=str.replace(/ {2,}/gi, " ");
        str=str.replace(/\n+\s*/gi, "\n\n");
        return str
    }

    static before_first_message = true

    static say_or_click(){
        let mess = "Tap the space-bar briefly and say a command, or click one."
        if(this.before_first_message){
            mess += '<br/>A good first command to try is <b>Note</b>.'
            this.before_first_message = false
        }
        return mess
    }

    //_______speak methods_______

    static speak_and_restart(html){
        speak({speak_data: html,
               volume: this.speak_volume,
               callback: Talk.restart
               })
    }

    static async restart(){
        await Talk.client.start()
        await Talk.microphone.initialize()
    }

    static display_warning(text){
        Talk.display_message("<span style=color:red;>" + text + "</span>")
        Talk.speak_if_enabled(text)
    }

    //called by gpt, Talk.display_warning(text)
    //not called by "say_selection which just says it regardless of the alk.enable_speaker flag
    static speak_if_enabled(text_or_object){
        if(Talk.enable_speaker){
            let args_options
            if(typeof(text_or_object) === "string") {
                args_options = {data: text_or_object}
            }
            else {
                args_options =  text_or_object
            }
            this.speak_better(args_options)
        }
    }

    static speak_better(text_or_object){
        let speak_options
        if(typeof(text_or_object) === "string") {
            speak_options = {data: text_or_object}
        }
        else {
            speak_options = text_or_object
        }
        let text = speak_options.data
        let words = text.split(" ")
        let better_words = []
        for(let word of words){
            let better_word = this.english_word_to_better_sounding(word)
            better_words.push(better_word)
        }
        speak_options.speak_data = better_words.join(" ")
        speak(speak_options)
    }

    static english_word_to_better_sounding(word){
        let table = {
            unrecognized: "unwreckognized", Unrecognized: "unwreckognized"
        }
        let result = table[word]
        if(!result) {
            result = word
        }
        return result
    }

    //returns last defined job name, or if none "", but avoid returning "talk_internal"
    //as we don't want the user editing or overwriting this job.
    static default_job_name(){
        if(Job.all_names.length > 0) {
            let last_name = Utils.last(Job.all_names)
            if(last_name === "talk_internal"){
                if(Job.all_names.length === 1){
                    return ""
                }
                else {
                    return Job.all_names[Job.all_names.length - 2] //get the 2nd latest
                }
            }
            else {
                return last_name
            }
        }
        else {
            return ""
        }
    }



//_______Start of Command Implementations________
//There are two syntactic types of commands
//1. cmds with no "content" (args). If these are given extra text after the cmd they
//aren't recognized as the cmd.
//2. cmds with "content" (args). Some of these MUST have content in the "full_text",
// others can get the content after the cmd is recognized with a type-in field, saying it,
//or sometimes from selection in the editor.

    static quit(content_obj){
        if(content_obj._content_str === "") {
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
    }

    static is_mic_on(){
        //if(!this.client || !this.client.active) { return false }
        //else { return this.client.isActive() }
        return this.listening === true
    }

    /*static turn_on_mic(full_text="turn on mic", cmd_str="turn on mic", content=""){
        if(cmd_str && !this.listening) { //don't do if we're already listening.
            if (content === "") {
                //return this.turn_on_mic_aux()
                this.display_warning("To turn on the mic, tap the space-bar briefly and<br/>say a command.")
                return true
            }
            else {
                return false  //turn_on_mic takes no arguments
            }
        }
    }*/

    //this is also called by onkeydown for the whole dialog
    //since turn_on_mic isn't a cmd in mode: move_menu, we need
    //to call this aux version from onkeydown for the whole dialog
    static turn_on_mic_aux(){
        console.log("in turn_on_mic_aux just before calling reco-start")
        this.recognition.start() //should cause recognition.onstart to get fired, but it does nothing
        this.listening = true
        Talk.display_status()
        Talk.display_message("Say a command.")
        return true
    }

    /*static turn_off_mic(full_text="turn off mic"){
        let alts = this.cmd_alternatives("turn off mic", true)
        let [cmd_str, content] = Utils.starts_with_one_of_and_tail(full_text, alts, true)
        if(cmd_str){
            if(content === "") {
                this.turn_off_mic_aux()
                return true
            }
        }
    }*/

    //also called by
    static turn_off_mic_aux(){
        if(this.listening) {
            //this.recognition.abort();
            this.listening = false
            let mess = "Tap the space-bar briefly then say a command."
            if (talk_out_id.innerText.startsWith("Unrecognized")) {
                mess = null
            }
            this.display_status(mess)
            this.display_message(mess)
        }
    }

    static is_speaker_on(){
        return this.enable_speaker
    }

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
            text = "\n" + new Date() + "\n" + text + "\n"
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

    //not now called or needed.
    //run as gpt cmd, maybe. Only call after normal cmd's all checked and didn't hit.
    /*static convert_to_gpt_cmd_maybe(full_text){
        let words = full_text.split(" ")
        if(Utils.is_digit(full_text[0])) { //captures full_text like "2 + 3"
            return Talk.gpt("gpt " + full_text)

        }
        else if (["-√"].includes(full_text[0])){ //captures full_text like "square root 5"
            return Talk.gpt("gpt " + full_text)
        }
        else if(words.length > 3){
            return Talk.gpt("gpt " + full_text)
        }
    }*/

//_______RECORDING_________

    //names are lower cased and have underscores. Just a straight array, not nested.
    static array_of_recording_names(){
        let job_names = Job.defined_job_names()
        let rec_names = []
        for(let job_name of job_names){
            if(!(job_name === "talk_internal")){
                rec_names.push(job_name)
            }
        }
        return rec_names
    }

    static is_existing_job_name(cmd_str){
        //return this.array_of_recording_names().includes(cmd)
        return (Job[cmd_str] && (Job[cmd_str] instanceof Job) && (cmd_str !== "talk_internal"))
    }

    static start_recording(content_obj){
       if(content_obj._content_str === ""){
           Talk.is_recording = true
           this.instructions_being_recorded = [] //clear out the previous recording
           this.display_all("To record a command, click it or<br/>tap the space-bar briefly and say it.") //needed to change "start_recording" to "stop_recording
        }
    }

    //called internally. Not Now top level cmd
    static stop_recording(content_obj) {
        this.is_recording = false //must go before set_mode
        if (content_obj._content_str === "") {
            this.stop() //does not call stop_recording, on purpose.
            //necessary because if we click on stop_recording during a move,.
            // then switch to the param screen to fill in
            //the job_name, we don't want the robot to keep moving
            //as it will just run out of bounds.
            //Also a user seeing "Stop ...." will probably expect the
            //robot to stop, EVEN THOUGH stopping a tape recroder doesn't
            //stop reality!
            this.set_params_mode(content_obj)
        }
        else {
            return this.define_recording(content_obj)
        }
    }

    static define_recording(content_obj){
        if (this.instructions_being_recorded.length === 0) {
            this.instructions_being_recorded = null
            let mess = "No commands have been recorded."
            this.set_mode("move_menu", content_obj, mess) //changes the "stop recording" button to "start recording"
        }
        else {
            //let arg_obj = this.string_to_data(content_obj._content_str)
            //let recording_name = arg_obj.job_name
            let recording_name = content_obj.job_name
            if (!recording_name) {
                this.display_warning("Stop recording didn't get a job_name for the recording.")
            }
            else {
                recording_name = this.string_to_job_name(recording_name)
                if (this.is_known_cmd(recording_name)) { //we want to exclude known recording names
                    this.display_message('"' + recording_name + '" is a command, so it can&apos;t be used to name a recording.')
                }
                else { //finally, good to make the recording.
                    let mess
                    if (this.is_existing_job_name(recording_name)) {
                        mess = '"' + recording_name + '" has been over-written with your new recording.'
                    } else {
                        mess = 'Say or click the Job button for: "' + recording_name + '" to start it.'
                    }
                    new Job({name: recording_name, do_list: this.instructions_being_recorded})
                    this.instructions_being_recorded = null
                    this.set_mode("move_menu", content_obj, mess)
                    //setTimeout(function () {Talk.dialog_dom_elt.focus()}, 100)
                }
            }
        }
    }

    //_____define place_______
    //expects full_text of "define postion", "define place foo"
    static define_place(content_obj){
        if(content_obj._content_str === ""){
            this.set_params_mode(content_obj)
        }
        else {
            if (!Dexter.default.rs) {
                Talk.display_warning("To name a Dexter place, you have to move Dexter first.")
            }
            else {
                return this.define_place_with_name(content_obj)
            }
        }
    }

    static define_place_with_name(content_obj){
        let arg_obj = this.string_to_data(content_obj._content_str)
        let recording_name = arg_obj.job_name
        if(!recording_name) {
            recording_name = content_obj._content_str
        }
        recording_name = this.string_to_job_name(recording_name)
        //ok we've got a valid recording_name, good to go
        let angles =  Dexter.default.rs.measured_angles()
        let instrs = [Dexter.default.move_all_joints(angles),
                      Dexter.default.empty_instruction_queue()
                     ]
        new Job({name: recording_name, do_list: instrs})
        Talk.dialog_dom_elt.focus()
        let mess = 'Tap space-bar and say: "' + recording_name + '" or<br/>click the "' +
            recording_name + '" button to move Dexter to its current position.'
        Talk.set_mode("move_menu", content_obj, mess)
    }

    //used near the end of main_mode and menu_mode.
    //Called by a regular cmd and by mode_misc methods which prepend "run job " to full_text first.
    static run_job(content_obj){
        if(content_obj._content_str === "") {
            this.set_params_mode(content_obj)
            return
        }
        else {
           // let arg_obj = this.string_to_data(content_obj._content_str)
           // let recording_name = arg_obj.job_name //will return undefined if arg_obj is a string
            let recording_name = content_obj.job_name
            if(!recording_name) {
                recording_name = content_obj._content_str
            }
            recording_name = this.string_to_job_name(recording_name)
            if(this.is_existing_job_name(recording_name)){
                /*if(this.is_recording) {
                    let instr = Control.start_job(recording_name, undefined, undefined, true) //run this embedded job until it completes, THEN move to the next instruction in Talk.job_for_normal_moves
                    this.instructions_being_recorded.push(instr)
                    this.send_instruction_to_dexter(instr) //will cause Job[recording_name] to run
                    this.display_message('Wait until job: <b>' + recording_name + '</b> has completed<br/>' +
                                         "before running the next command to record.")
                }
                else {
                    Job[recording_name].start()
                }*/
                let instr = Control.start_job(recording_name, undefined, undefined, true) //run this embedded job until it completes, THEN move to the next instruction in Talk.job_for_normal_moves
                this.send_instruction_to_dexter(instr) //will cause Job[recording_name] to run
                if(this.is_recording) {
                    this.instructions_being_recorded.push(instr)
                    this.display_message('Wait until job: <b>' + recording_name + '</b> has completed<br/>' +
                                          "before running the next command to record.")
                }
                return
            }
            else {
                Talk.display_warning('The <b>run job</b> command was passed: "' + recording_name + '",<br/>which does not name a defined Job.')
                return
            }
        }
    }

    static edit_job(content_obj){
        if(content_obj._content_str === "") {
            his.set_params_mode(content_obj)
        }
        else {
            if (this.default_job_name() === "") {
                Talk.display_warning("There are no defined Jobs to edit.")
            }
            else {
                this.edit_job_action(content_obj)
            }
        }
    }

    static edit_job_action(content_obj){
        let arg_obj = this.string_to_data(content_obj._content_str)
        let recording_name = content_obj.job_name //arg_obj.job_name
        if(!recording_name) {
            recording_name = content_obj._content_str
        }
        recording_name = this.string_to_job_name(recording_name)
        if (!Talk.is_existing_job_name(recording_name)){
            Talk.display_warning('"' + recording_name + '" is not the name of a defined Job.')
            return true
        }
        else {
            let the_job = Job[recording_name]
            the_job.program_counter = 0
            let job_src = to_source_code({value: the_job, job_orig_args: true})
            Editor.insert("\n" + job_src, "end")
            setTimeout(function() {
                Talk.dialog_dom_elt.focus()
                Talk.display_message('The definition for "' + recording_name + '" has been appended to the editor buffer.')
            }, 200)
                return true
        }
    }

    //not now a command or otherwise called
    /*static play_recording(full_text="play recording", cmd_str, content){
        if(cmd_str){
            if (this.array_of_recording_names().length === 0) {
                this.display_message('There are no recordings to play.<br/>' + this.say_or_click() + ' on "Start recording"" to make one.')
                return true
            }
            else if(content === ""){
                this.display_warning("You must say a recording name.")
                return true
            }
            else {
                let recording_name = this.string_to_method_name(content)
                let the_job = Job[recording_name]
                if(the_job) {
                    the_job.start()
                    this.recording_name_now_playing = recording_name //do before set_mode
                    let mess = "Now playing recording: " + recording_name
                    this.set_mode("playing_recording", content_obj, mess)
                    setTimeout(function(){ Talk.finished_playing_maybe(recording_name)},
                                500)
                    return true
               }
                else {
                    this.display_warning("There is no defined Job named: " + recording_name)
                }
            }
        }
    }


    static finished_playing_maybe(recording_name) {
        //out("top of finished_playing_maybe with: " + recording_name + " mode: " + Talk.mode)
        let the_job = Job[recording_name]
        if (the_job.is_active()) { //job is still active (playing) so keep checking to see if it ztopped by being completed
            //out("top of finished_playing_maybe with ACTIVE: " + recording_name)
            setTimeout(function () {
                    Talk.finished_playing_maybe(recording_name)
                },
                500)
        }
        else { //job is no longer active.
           if(Talk.mode === "playing_recording") { //but my code think's its still playing so stop it
                //out("in finished_playing_maybe with INACTIVE : " + recording_name)
               Talk.handle_command("stop playing")
            }
            //else we've terminated the playing properly, so stop looking
        }
    }

    static stop_playing(full_text="stop playing", cmd_str, content){
        if(cmd_str) {
            if (content === "") {
                let rec_name = Talk.recording_name_now_playing
                let the_job = Job[rec_name]
                if(rec_name && the_job) { //the Job might have already stopped, and recording_name_now_playing is already null.
                                          //if so, skip the action of this IF and go straight to set_mode
                    Talk.recording_name_now_playing = null
                    if (the_job.is_active()) {
                        the_job.stop_for_reason("interrupted", 'User said "stop playing".')
                    }
                }
                let mess = "Finished playing: " + rec_name + ", with status: " + the_job.status_code + "."
                Talk.set_mode("main_menu", content_obj, mess)
                return true
            }
        }
    } */

    /* makes new full_cmd (full_text) like "define name object name green meaning "is a cool color"
    static run(full_text="run", cmd_str="run", content){
        if(!content._has_args) {
            let [parent_mode, cmd_str] = this.mode.split("__")
            let param_names = this.cmd_param_names_for_current_params_mode()
            let full_cmd = cmd_str + " object"
            for (let param_name of param_names) {
                let id_str = parent_mode + "__" + cmd_str + "__params__" + param_name + "__id"
                let dom_elt = globalThis[id_str]
                let val = dom_elt.value
                full_cmd += " " + param_name + " " + val //TODO: if a non-last param value has a space in it,
                if(param_name !== Utils.last(param_names)){
                    full_cmd += "," //don't stick in trailing space. Already added above
                }
                //we can't know that its a 2 or more word value. Bad, but for
                //single param cmds ok, but not fully general.
                //I need some separator between args, like comma,
                // or to wrap quotes around multi-word args, then
                //the receiver has to parse those out.
                //but we don't have commas in speech so for now, only last
                //arg can have spaces in it. Maybe in practice not so limiting.
            }
            this.set_mode(parent_mode) //or the "cmd" won't be recognized as valid
            this.handle_command(full_cmd)
            return true
        }
    }*/

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
                        result[param_name] = this.string_to_data(val)
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
                let val = this.string_to_data(value_src)
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
                        result[the_param] = this.string_to_data(arg)
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

    //string is usually the content arg to a normal top level cmd.
    //Effectively, Talk's eval
    //converts "zero" thru "nine" to 0  thru 9.
    // Google speech reco:
    //    - returns string of digits, and minus sign for numbers not "zero" thru "nine",
    //    - returns string of digits for "one point two"
    //    - for isolated words, returns "two" and "four", but may return "to" or "for " in context.
    //    - input "for dollars" returns "$4"
    static string_to_data(string) {
        if     (string === "true")      { return true      }
        else if(string === "false")     { return false     }
        else if(string === "null")      { return null      }
        else if(string === "undefined") { return undefined }
        else if (Utils.is_string_a_number(string)) { return parseFloat(string) }
        else if (string.startsWith("array ")){
            let array_elts_str = string.substring(6).trim()
            let array_elts = array_elts_str.split(",")
            let result = []
            for(let arr_elt_str of array_elts){
                arr_elt_str = arr_elt_str.trim() //just ins case real sep is ", "
                let arr_val = this.string_to_data(arr_elt_str)
                result.push(arr_val)
            }
            return result
        }
        else if(string.startsWith("object ")){
            let obj_elts_str = string.substring(7).trim()
            let obj_pairs_str = obj_elts_str.split(",")
            let result = {}
            for(let obj_pair_str of obj_pairs_str){
                obj_pair_str = obj_pair_str.trim() //just in csae the separator was ", "
                let space_pos = obj_pair_str.indexOf(" ") //todo only allows 1 word long names
                let name = obj_pair_str.substring(0, space_pos).trim()
                let val_str = obj_pair_str.substring(space_pos + 1).trim()
                let val = this.string_to_data(val_str)
                result[name] = val
            }
            return result
        }
        else {
            let integer_maybe = this.string_to_small_integer(string)
            if(integer_maybe === false) {
                return string //could be the empty string
            }
            else { return integer_maybe}
        }
    }

    //only converts "zero" thru "nine" to 0 thru 9 or returns false
    static string_to_small_integer(a_string){
        let integer = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"].indexOf(a_string)
        if(integer === -1) {
            return false
        }
        else {
            return integer
        }
    }

    static simulate(content_obj){
        if(content_obj._content_str === "") {
            let sim = Robot.get_simulate_actual(Dexter.default.simulate)
            if (globalThis.simulate_radio_true_id.checked) {
                this.display_warning("Dexter is already in <b>simulate</b> mode.<br/>" +
                    "See the radio buttons in the Misc pane header.")
            } else {
                globalThis.simulate_radio_true_id.checked = true
                DDE_DB.persistent_set("default_dexter_simulate", true)
                let mess = "Dexter is now in <b>simulate</b> mode.<br/>" +
                    "The real robot won't move when you run these commands."
                this.display_message(mess)
            }
        }
    }

    static real(content_obj){
        if(content_obj._content_str === "") {
            let sim = Robot.get_simulate_actual(Dexter.default.simulate)
            if (globalThis.simulate_radio_false_id.checked) {
                this.display_warning("Dexter is already in <b>real</b> mode.<br/>" +
                    "See the radio buttons in the Misc pane header.")
            } else {
                globalThis.simulate_radio_false_id.checked = true
                DDE_DB.persistent_set("default_dexter_simulate", "false")
                let mess = "Dexter is now in <b>real</b> mode.<br/>" +
                    "The real robot will move when you run these commands."
                this.display_message(mess)
            }
        }
    }

    static both(content_obj){
        if(content_obj._content_str === "") {
            let sim = Robot.get_simulate_actual(Dexter.default.simulate)
            if (globalThis.simulate_radio_both_id.checked) {
                this.display_warning("Dexter is already in <b>both</b> (simulate & real) mode.<br/>" +
                    "See the radio buttons in the Misc pane header.")
            } else {
                globalThis.simulate_radio_both_id.checked = true
                DDE_DB.persistent_set("default_dexter_simulate", "both")
                let mess = "Dexter is now in <b>both</b> mode.<br/>" +
                    "The simulator and real robot will move when you run these commands."
                this.display_message(mess)
            }
        }
    }

//____________move commands_____________
    //if angle_array is an array whose first 5 elts are 0, return true,
    //else return false

    static straight_up_angles(){
        let angles = [0,0,0,0,0, 0, 50]
        angles = this.fix_home_angles_maybe(angles)
        angles = Kin.point_down(angles)
        return angles
    }

    //Not called Apr 14, 2024
    static initial_angles(){
        let dex = this.job_for_normal_moves.robot
        if(dex.rs){
            return dex.rs.measured_angles()
        }
        else {
            return this.straight_up_angles() }
    }

    static current_or_straight_up_angles(){
        let dex = this.job_for_normal_moves.robot
        if(dex.rs){
            let ma = dex.rs.measured_angles()
            if(this.is_home_angles(ma)){
                return this.straight_up_angles() //fixes them if need be.
            }
            else { return ma }
        }
        else {
            return this.straight_up_angles() }
    }


    static is_home_angles(angle_array){
        for(let i = 0; i < 5; i++){
            if(angle_array[i] !== 0) { return false }
        }
        return true
    }

    static fix_home_angles_maybe(angle_array){
        let new_angle_array = []
        if(this.is_home_angles(angle_array)) {
            for(let i = 0; i < angle_array.length; i++) {
                if((i === 1) || (i === 2)) {
                    new_angle_array.push(0.000000000001) //Number.EPSILON doesn't work, too small. From James W.)
                }
                else { new_angle_array.push(angle_array[i]) }
            }
        }
        else {
            new_angle_array = angle_array
        }
        return new_angle_array
    }

    //Copied from dexter_user_interface2 and modified
    // xyz is an array of 3 floats.
    // if angle_array is an array whose first 5 elts are 0, return a new array
    //whose first 5 elts are 0 except the 2nd elt is Number.EPSILON
    //and any additional elts are the same as their corresponding ones in angle_array
    //Returned is an array of arrays.
    static fix_xyz(xyz){
        let angle_array = Kin.xyz_to_J_angles(xyz) //will get out_of_range error with initial angles
        //beware, might error with "out of range".
        let new_angle_array = this.fix_home_angles_maybe(angle_array)
        let new_xyz_extra = Kin.J_angles_to_xyz(new_angle_array)
        return new_xyz_extra //arr of array of numbers
    }

    static word_to_axis_index_and_direction(word){
        //x
        if      (word === "left")  { return [0, 1]}

        else if (word === "right") { return [0, -1]}
        //y
        else if(["farther", "further", ].includes(word)) { return [1, 1]}
        else if(["closer", "nearer"].includes(word)) {
            return [1, -1]}

        //z
        else if(word === "up")       { return [2, 1]}
        else if(word === "down")     { return [2, -1]}
        else if(word === "pitch up") { return [3, 1] }

        else { return false} //not a valid word
    }

    //Not called Apr 14, 2024
    static axis_index_and_direction_to_word(axis_index, axis_direction){
        if     (axis_index === 0){
            return ((axis_direction === 1) ? "left"    : "right")
        }
        else if(axis_index === 1) {
            return ((axis_direction === 1) ? "farther" : "closer")
        }
        else if(axis_index === 2){
            return ((axis_direction === 1) ? "up"      : "down")
        }
        else { return null }
    }

    static set_step_size(dist){
        this.step_size = dist
        this.display_status()
    }

    static stop(content_obj){
            if (content_obj._content_str === "") {
                Talk.stop_aux() //calls turn_off_mic which does display_all
            }
    }


    //called from both stop and as a job instruction, where we DON'T want it to return
    //anything, including "valid" as that will be interpreted by a job as an instruction
    static stop_aux(message = this.say_or_click()){
        //don't stop recording. stop is to stop the current motion.
        //then we might want to start another motion, stop it, etc
        //and only THEN user explicitly stops the recording.
        //hmm, so while robot is moving, if we click stop_recording,
        //it should probably call STOP which is OK since stop doesn't call stop_recording
        //so no infinite loop
        //if(this.is_recording){ //avoid infinite recursion s stop_recording sets is_recording to false.
        //    this.stop_recording()
        //}
        Talk.is_moving = false
        this.recognition.abort()
        globalThis.stop_speaking()
        //this.enable_speaker = false
        this.turn_off_mic_aux()
        let did_stop_a_job = false
        for(let job_inst of Job.active_jobs()){
            if(job_inst !== Talk.job_for_normal_moves){
                job_inst.stop_for_reason("interrupted", 'Talk user said "Stop"')
                did_stop_a_job = true
            }
        }

        Talk.display_status()

        if (did_stop_a_job) {
            message += "<br/>Job(s) were stopped but will continue to move until their queue is empty."
        }
        Talk.display_message(message)
    }

    // not used as a top level cmd.
    /*
    static stop_except_speaking(full_text="stop except speaking"){
        if(full_text === "stop except speaking"){
            try {
                Talk.stop_except_speaking_aux()
            }
            catch(err) {} //we don't want any errors during stop, lke if the Talk dialog box is down and we try to write to it
            return true
        }
    }*/


    //called from both stop and as a job instruction, where we DON'T want it to return
    //anything, including "valid" as that will be interpreted by a job as an instruction
    /*
    static stop_except_speaking_aux(){
        this.is_moving = false
        Talk.display_status()
        this.recognition.abort()
        //globalThis.stop_speaking() //bad idea if speaking a define name as it will cut it off prematurely
        //this.enable_speaker = false //don't change this
        this.turn_off_mic_aux() //calls display_status
        for(let job_inst of Job.active_jobs()){
            if((job_inst.name !== "talk_internal") &&
                !is_speaking()){ //because define_name uses a job and we don't
                //want to cut off a job if its speaking
                job_inst.stop_for_reason("interrupted", "user said stop")
            }
        }
        Talk.display_message(this.say_or_click())
    }*/

    //same as former "back"
    static main_menu(content_obj){
        if(content_obj._content_str === ""){
                this.set_mode("main_menu", undefined, this.say_or_click())
                return true
        }
    }

    /*static back(full_text="back"){
        let alts = this.cmd_alternatives("back", true)
        if(alts.includes(full_text)){
            Talk.set_mode("main_menu")
            Talk.display_message(this.say_or_click())
            return true
        }
    }*/

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

//_______Move commands_________

    static straight_up(content_obj){
        if(content_obj._content_str === "") {
                this.display_color()
                let dex = this.job_for_normal_moves.robot
                this.is_moving = true
                this.display_status()
                let instr = [
                    dex.move_all_joints(Talk.straight_up_angles()),
                    dex.empty_instruction_queue()
                    //function () { Talk.display_message("Dexter is straight up.")}
                    ]
                this.send_instruction_to_dexter(instr) //will cause Job[recording_name] to run
                let mess_suffix = ""
                if(this.is_recording) {
                    this.instructions_being_recorded.push(instr)
                    mess_suffix = "<br/>Wait until Dexter stops moving<br/>before running the next command to record."
                }
                this.display_message("Dexter is moving straight up..." + mess_suffix)
        }
    }

    static left(content_obj){
        if(content_obj._content_str === "") {
            this.start_normal_move_cmd(content_obj)
        }
    }

    static right(content_obj){
        if(content_obj._content_str === "") {
            this.start_normal_move_cmd(content_obj)
        }
    }

    static farther(content_obj){
        if(content_obj._content_str === "") {
            this.start_normal_move_cmd(content_obj)
        }
    }

    static closer(content_obj){
        if(content_obj._content_str === "") {
            this.start_normal_move_cmd(content_obj)
        }
    }


    static up(content_obj){
        if(content_obj._content_str === "") {
            this.start_normal_move_cmd(content_obj)
        }
    }

    static down(content_obj){
        if(content_obj._content_str === "") {
            this.start_normal_move_cmd(content_obj)
        }
    }

    static reverse(content_obj){
        if(content_obj._content_str === "") {
            this.start_normal_move_cmd(content_obj)
        }
    }

    static forward(content_obj){
        if(content_obj._content_str === "") {
            this.start_normal_move_cmd(content_obj)
        }
    }

    //returns an instruction or a string to display indicating its done.
    static compute_reverse_instruction(the_job){
        let dex = this.job_for_normal_moves.robot
        let hist_arr   = the_job.rs_history
        if(this.last_reverse_forward_index === null) {
            this.last_reverse_forward_index = hist_arr.length - 1
            this.forward_limit_index = hist_arr.length - 1
        }  //skip past the latest one

        if(this.last_reverse_forward_index === 0){
            return "There are no more commands to reverse to." //get out of loop
        }
        else {
            let RS_inst = new RobotStatus({})
            for (let i = this.last_reverse_forward_index - 1; i >= 0; i--) {
                this.last_reverse_forward_index = i //so that if we switch to forward, that will start in the right place, as will subsequence calls to  compute_reverse_instruction
                let single_rs = hist_arr[i]
                let oplet = single_rs[Dexter.INSTRUCTION_TYPE]
                if (oplet === "F") { //this is the one to go back to.
                    RS_inst.robot_status = single_rs
                    let angles = RS_inst.measured_angles()
                    let instr = dex.move_all_joints(angles)
                    //out("compute_reverse_instruction returning instr: " + instr)
                    return instr
                }
            }
            return "There are no more commands to reverse to."
        }
    }

    //returns an instruction or a string to display indicating its done.
    static compute_forward_instruction(the_job){
        let dex = this.job_for_normal_moves.robot
        let hist_arr   = the_job.rs_history
        if(this.last_reverse_forward_index === null) {
            this.last_reverse_forward_index = hist_arr.length - 1
            this.forward_limit_index = hist_arr.length - 1
        }  //skip past the latest one

        if(this.last_reverse_forward_index >= this.forward_limit_index){
            return "There are no more commands to go forward to." //get out of loop
        }
        else {
            let RS_inst = new RobotStatus({})
            for (let i = this.last_reverse_forward_index + 1; i <= this.forward_limit_index; i++) {
                this.last_reverse_forward_index = i //so that if we switch to forward, that will start in the right place, as will subsequence calls to  compute_reverse_instruction
                let single_rs = hist_arr[i]
                let oplet = single_rs[Dexter.INSTRUCTION_TYPE]
                if (oplet === "F") { //this is the one to go back to.
                    RS_inst.robot_status = single_rs
                    let angles = RS_inst.measured_angles()
                    let instr = dex.move_all_joints(angles)
                    //out("compute_forward_instruction returning instr: " + instr)
                    return instr
                }
            }
            return "There are no more commands to reverse to."
        }
    }

    static faster(content_obj){
        if(content_obj._content_str === "") {
                this.set_step_size(this.step_size * 2)
                this.display_message("Step distance has been increased to: " + this.step_size + " meters.")
                return true
        }
    }

    static slower(content_obj){
        if(content_obj._content_str === "") {
                this.set_step_size(this.step_size / 2)
                this.display_message("Step distance has been decreased to: " + this.step_size + " meters.")
                return true
        }
    }
 //_________Joint cmd______________
   /* static joint(content_obj){
        if(content_obj._content_str === "") {
                    this.set_params_mode(content_obj)
        }
        else {
            this.joint_handle_content(content_obj)
        }
    }

    static joint_handle_content(content_obj){
        let content = content_obj._content_str
        if(content.startsWith("object ")) {
            out("joint_handle_content passed content: " + content)
            let arg_obj = this.string_to_data(content)
            let joint_number = arg_obj.joint_number
            let direction = arg_obj.direction
            if (!content_obj.joint_number) {
                this.display_warning("Joint didn't get a joint_number. It should be between 1 and 7 inclusive.")
            } else if (!content_obj.direction) {
                this.display_warning("Joint didn't get a direction.")
            } else {
                this.start_normal_move_cmd("joint", content_obj.joint_number, content_obj.direction)
            }
        }
        else {
            this.run(content_obj) //put arg values into content_obj.
        }
    } */

    static joint(content_obj){
        this.start_normal_move_cmd(content_obj)
    }
//______End move commands _______

//_______move plumbing____________
    //called by down, left and friends to do their real action.
    //this version mostly works BUT If dexter is already moving (say "down")
    //and you click on "left" for a bit, then the stop, the job
    //keeps togging between running the last 2 instructions. Bad. The
    //below version with the timeout fixes this.
    /*static start_normal_move_cmd() {
        this.is_moving = false //if dexter has an ongoing normal move cmd, stop it
        setTimeout(this.start_normal_move_cmd_aux,
            200 //Talk.job_for_normal_moves.inter_do_item_dur * 3
        ) //give ongoing move a chance to stop after setting is_moving to false
    }*/

    //don't use "this"
    static start_normal_move_cmd(content_obj){
        if(content_obj) {
            Talk.current_move_command      = content_obj.cmd_norm //used inside of move_incrmentally only.
            Talk.current_move_joint_number = content_obj.joint_number //will be null for xyz move
            Talk.current_move_direction    = content_obj.direction //will be null for xyz move
        }
        //else this is the setTimeout call from below with no arg passed so
        //don't change the Talk.current_move_command
        Talk.is_moving = true
        Talk.display_status()
        let dex = Talk.job_for_normal_moves.robot
        if(!Talk.job_for_normal_moves.user_data.talk_started_init){ //just hits the first time start_normal_move_cmd is called per init of the job.
            Talk.job_for_normal_moves.user_data.talk_started_init = true //just done once until redefine the job
            Talk.display_message("Initializing Dexter to straight up.")
            let job_initial_instructions = [
                dex.move_all_joints(Talk.straight_up_angles()),
                dex.empty_instruction_queue(),
                function () {
                    Talk.display_message("Dexter is straight up.")
                }
            ]
            Talk.send_instruction_to_dexter(job_initial_instructions)
        }

        if (!dex.rs) {
            setTimeout(Talk.start_normal_move_cmd, //loop around again waiting for rs to be set
                       100)
        }
        else {
            /*let loop_inst = //todo this pointless, and if we ever extecut this, its at least not good.
                    Control.loop(function () {
                        return Talk.is_moving //keep looping (and calling move_incrementally) as long as Talk.is_moving  is true
                    },
                    Talk.move_incrementally) now done by recursion which is better than loop
            */
            Talk.send_instruction_to_dexter([Talk.start_moving_aux, //sets Talk.is_moving = true and redisplay
                                            Talk.move_incrementally //loop_inst
                ]
            )
        }
    }

    //called as a fn on do_list of talk_internal just before Control.loop for move_incrementally
    //don't return a value
    static start_moving_aux(){
        Talk.is_moving = true
        Talk.display_status()
        Talk.display_color()
    }

    static send_instruction_to_dexter(instruction) {
        this.job_for_normal_moves.insert_single_instruction(instruction, false)
    }

    static is_in_reach(xyz, J5_direction = [0, 0, -1], config = [1, 1, 1], dexter_inst_or_workspace_pose){
        let angles
        /*out("calling Kin.xyz_to_J_angles(" +
            to_source_code(xyz) + ", " +
            to_source_code(J5_direction) + ", " +
            to_source_code(config) + ", " +
            "Dexter." + dexter_inst_or_workspace_pose.name +
            ")"
        )*/
        try{
            angles = Kin.xyz_to_J_angles(xyz, J5_direction, config, dexter_inst_or_workspace_pose) //and fast!
            //James W says this is the best way to do it. Kin.is_in_reach is very approximate so
            //misses a bunch of details and is hard to fix.
        }
        catch(err) { //happens when xyz is out of range
            //out("out of reach angles: " + xyz)
            return false
        }
        //out("in reach angles: " + angles)
        return true
    }

    //called in body of Control.loop running in Job.
    static move_incrementally() {
        //out("top of move_incrementally, is_moving: " + Talk.is_moving + " cmd: " + Talk.current_move_command)
        if (!Talk.is_moving) {
            Talk.display_status()
            return //Control.break()
        }
        if (Talk.current_move_command !== Talk.last_move_command){
            let mess_suffix = "..."
            if(Talk.current_move_command === "joint"){
                mess_suffix = " " + Talk.current_move_joint_number + " " + Talk.current_move_direction + "."
            }
            Talk.display_message("Moving Dexter " + Talk.current_move_command + mess_suffix +
                           '<br/>Click "Stop" to stop.')
        }
        let dexter_instance = this.robot //"this" is the running job

        if((Talk.current_move_command === "forward") || (Talk.current_move_command === "reverse")) {
           let inst
           if (Talk.current_move_command === "reverse") {
               inst = Talk.compute_reverse_instruction(Talk.job_for_normal_moves)
           }
           else { inst = Talk.compute_forward_instruction(Talk.job_for_normal_moves) }

           if(inst === null) {
                Talk.stop_aux()
                Talk.last_move_command = Talk.current_move_command
                return //Control.break()
           }
            if(typeof(inst) === "string") {
                Talk.stop_aux(inst)
                Talk.last_move_command = Talk.current_move_command
                return //Control.break()
            }
           else {
                return [inst,
                        dexter_instance.empty_instruction_queue(),
                        Talk.move_incrementally] //"recursive" call on the do list.]
           }
        }
        else if (Talk.current_move_command === "joint"){
            let dir_sign = (["clockwise", "up", "wider"].includes(Talk.current_move_direction) ? 1 : -1)
            let degrees_incr =  Talk.step_size //default 0.005
                                * (1 / 0.005)  //so that with default step_size, the degrees_inc will be 1 degrees.
                                               //and doubling Talk.step_size will double the degrees_inc
                                * dir_sign
            let ma = Talk.current_or_straight_up_angles()
            let new_angles = ma.slice()
            let old_ang = ma[Talk.current_move_joint_number - 1]
            let new_ang = old_ang + degrees_incr
            new_angles[Talk.current_move_joint_number - 1] = new_ang
            let false_or_error_mess = Dexter.joints_out_of_range(new_angles) //TODO: doesn't now check j6 and j7. Also doesn't check dexter specific so don't pass in the dexter intance so thagt it will at least check the default values of min and max for joints.
            if(false_or_error_mess){
                let num_arr_str = Utils.array_of_numbers_to_string(new_xyz, 8) //shows micron rez
                let mess = false_or_error_mess
                Talk.stop_aux(false_or_error_mess)
                Talk.last_move_command = Talk.current_move_command
                //Talk.display_warning(mess)
                return
            }
            else {
                return [dexter_instance.move_all_joints(new_angles),
                        dexter_instance.empty_instruction_queue(),
                        Talk.move_incrementally //"recursive" call on the do list.
                ]
            }
        }
        else { //regular xyz move like left, down, etc.
            let [axis_index, axis_direction] = Talk.word_to_axis_index_and_direction(Talk.current_move_command)
            let ma = Talk.current_or_straight_up_angles()
            let orig_xyz = Kin.J_angles_to_xyz(ma)[0]

            let [new_x, new_y, new_z] = orig_xyz
            let new_xyz = [new_x, new_y, new_z]
            if (axis_index === 0) {  //x
                new_x = orig_xyz[axis_index] + (axis_direction * Talk.step_size)
                new_xyz[0] = new_x
            }
            else if (axis_index === 1) {  //y
                new_y = orig_xyz[axis_index] + (axis_direction * Talk.step_size)
                new_xyz[1] = new_y
                if (new_y < 0) {
                    let mess ="This installation of Dexter prevents Dexter from going behind itself: " + to_source_code(new_xyz)
                    Talk.stop_aux(mess)
                    Talk.last_move_command = Talk.current_move_command
                    return //Control.break()
                }
            }
            else if (axis_index === 2) {  //z
                new_z = orig_xyz[axis_index] + (axis_direction * Talk.step_size)
                new_xyz[2] = new_z
                if (new_z < 0) {
                    let mess = "This installation of Dexter prevents Dexter from going below it base: " + to_source_code(new_xyz)
                    Talk.stop_aux(mess)
                    Talk.last_move_command = Talk.current_move_command
                    return //Control.break()
                }
            }
            else if (axis_index === 5) {  //pitch up j6 clockwise/counterclockwide
                //TODO
                if (new_z < 0) {
                    let mess ="This installation of Dexter prevents Dexter from going below it base: " + to_source_code(new_xyz)
                    Talk.stop_aux(mess)
                    Talk.last_move_command = Talk.current_move_command
                    return //Control.break()
                }
            }

            //let orig_angles2 = Kin.xyz_to_J_angles(orig_xyz)
            if (Talk.is_in_reach(new_xyz, undefined, undefined, dexter_instance)) { //bug in Kin.is_in_reach so use my special one.
                if(Talk.is_recording) {
                    let instr = dexter_instance.move_to(new_xyz)
                    Talk.instructions_being_recorded.push(instr)
                }
                //out("move_incrementally, in reach: " + new_xyz)
                //move_incrementally is a fn that's pushed onto the do_list, so
                //the fn is called when the job is run and whatever it returns is put on the do_list.
                return [dexter_instance.move_to(new_xyz),
                        dexter_instance.empty_instruction_queue(),
                        Talk.move_incrementally //"recursive" call on the do list.
                       ]
            }
            else {
                //out("bottom of Talk.move_incrementally, out of reach: " + new_xyz)
                let num_arr_str = Utils.array_of_numbers_to_string(new_xyz, 8) //shows micron rez
                let mess = "Moving to xyz: " + num_arr_str + "<br/>is out of Dexter's reach."
                Talk.stop_aux(mess)
                Talk.last_move_command = Talk.current_move_command
                //Talk.display_warning(mess)
                return //Control.break()
            }
        }
    }

//______  mode_misc commands_______

    //called from handle_command
    static main_menu_mode_misc(content_obj) {
        let new_cmd_norm = "run job"
        let new_content = content_obj._full_text //hopefully a job name
        let new_full_text = new_cmd_norm + " " + new_content
        if(this.job_name_prose_to_existing_job_name(new_content)) { //we don't want to get the warning message from run_job about a non-existend job name so catch this here
            let new_content_obj = this.content_str_to_content_obj(new_full_text, new_cmd_norm, new_content, new_cmd_norm)
            this.run_job(new_content_obj)
            return
        }
        else {
            new_cmd_norm = "gpt"
            new_full_text = new_cmd_norm + " " + new_content
            let new_content_obj = this.content_str_to_content_obj(new_full_text, new_cmd_norm, new_content, new_cmd_norm)
            if (this.gpt(new_content_obj)) {
                return
            }
        }
    }

    //called from handle_command
    static move_menu_mode_misc(content_obj) {
        //note cmd_str will just be the first word, ie "run"
        //and content will be the remaining ie "job blue" so neither are helpful.
        //but if "full_job" is a job_name, we can win
        let new_content = content_obj._full_text
        if(this.job_name_prose_to_existing_job_name(new_content)) {
            let new_cmd_norm  = "run_job"
            let new_full_text =  new_cmd_norm + content_obj._full_text
            let new_content_obj = this.content_str_to_content_obj(new_full_text, new_cmd_norm, new_content, new_cmd_norm)
            if (this.run_job(new_content_obj)) {
                return true
            }
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
                /*let first_param = param_names[0]
                let cmd_str_with_underscores = content_obj._cmd_norm.replaceAll(" ", "_")
                let id_str = content_obj._cmd_norm_mode + "__" + cmd_str_with_underscores + "__params__" + first_param + "__id"
                let dom_elt = globalThis[id_str]
                dom_elt.value =  content_obj._full_text
                if(param_names.length === 1){ //only 1 param so just do it!
                    this.run(content_obj)
                }*/
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
    }

    static handle_command(full_text){
        console.log("handle_command passed: " + full_text)
        this.stop_aux() // this is called by space-bar down. So it *might* be redundant,
        //but in the case where the user clicks a menu item instead, we shoudl do it.
        //one reason is for the cmd stop_recording, but in general. makes clickng space bar and
        //clicking a menu item more similar.
        let cur_cmd = full_text.substring(0, 20).trim()
        if (full_text.length > 20) {
            cur_cmd += "..."
        }
        Talk.current_command_for_display_in_status = cur_cmd
        Talk.display_status()
        let cmd_rows = this.cmd_rows_for_mode(Talk.mode) //cmd_rows_for_mode special cases for "__params" modes
        if (!cmd_rows) {
            shouldnt("handle_command can't find rows since mode is invalid: " + Talk.mode)
        }
        //mode is valid
        for (let row of cmd_rows) {
            for (let cmd_arr of row) {
                let cmd_norm = cmd_arr[0]
                if (cmd_norm) { //will be undefined in the case of its inappropriate ie Turn mic on when its already on
                    let cmd_meth_name = this.string_to_method_name(cmd_norm)
                    let cmd_meth = Talk[cmd_meth_name]
                    if (!cmd_meth) {
                        shouldnt("handle_command can't find method for: Talk." + cmd_meth_name)
                    }
                    let alts = this.cmd_alternatives(cmd_norm, true)
                    //all cmd_norm and alts are lower case
                    let [cmd_str, content_str] = Utils.starts_with_one_of_and_tail(full_text.toLowerCase(), alts, true)
                    if(cmd_str) { //good at least one of the alts is valid. But use the cmd_meth generated from cmd_norm NOT this cmd_str which might be an alt.
                        if((this.cmd_params(cmd_norm, Talk.mode).length === 0) && (content_str.length > 0)) {} //no match. cmd_norm might be "stop" but content_str is "recording", so loop around again until we find cmd_norm is "step recording"
                        else { //positive identification that full_text is for cmd_norm.
                            let [parent_mode, cmd_norm_from_mode_with_underscores, params_const] = Talk.mode.split("__")
                            //let cmd_norm_mode = (params_const ? parent_mode : Talk.mode)
                            let cmd_norm_with_underscores = cmd_norm.replaceAll(" ", "_")
                            let content_obj = this.content_str_to_content_obj(full_text, cmd_norm_with_underscores, content_str, cmd_norm, Talk.mode)
                            if (content_obj._unused_param_names.length > 0) {
                                this.set_params_mode(content_obj)
                            } else {
                                cmd_meth.call(Talk, content_obj)
                            }
                            return
                        }
                    }
                    ///else no match for full_text with the alts, as is usual, so loop around again
                }
            }
        }
        //no success with normal cmds so call the misc method for the mode, including, perhaps "params_mode_misc"

        let use_mode_for_making_mode_misc
        let cmd_norm
        let cmd_norm_with_underscores
        let content_str
        let cmd_norm_mode
        let [parent_mode, cmd_norm_from_mode_with_underscores, params_const] = Talk.mode.split("__")
        if(params_const){ //got a params dialog up.
            use_mode_for_making_mode_misc = "params"
            cmd_norm = cmd_norm_from_mode_with_underscores.replaceAll("_", " ")
            cmd_norm_with_underscores = cmd_norm_from_mode_with_underscores
            content_str  = full_text //"" //full_text.substring(cmd_norm.length).trim()
            cmd_norm_mode = parent_mode
        }
        else { //not a params mode
            use_mode_for_making_mode_misc = Talk.mode
            cmd_norm = false
            cmd_norm_with_underscores = false //no known cmd in the mode so cmd_str is false.
            content_str = ""
            cmd_norm_mode = Talk.mode
        }
        let misc_mode_name = use_mode_for_making_mode_misc + "_mode_misc" // ie "main_menu_mode_misc", "move_menu_mode_misc", "params_mode_misc"
        let misc_meth = Talk[misc_mode_name]
        if (!misc_meth) {
            this.display_warning('Mode: <b>' + Talk.mode + `</b> doesn't have a matching command for:<br/>"` + full_text + '" (no misc method).')
            return
        }

        let content_obj = this.content_str_to_content_obj(full_text, cmd_norm_with_underscores, content_str, cmd_norm, cmd_norm_mode)
        if(content_obj._unused_param_names.length > 0){
            this.set_params_mode(content_obj)
        }
        else {
            misc_meth.call(Talk, content_obj)
        }
    }


} //end of Talk
globalThis.Talk = Talk

//with this, source code in a job's do_list can be: simple("down")
function simple(command){
    let a_simple_fn = function() {
        let the_job = this
        Talk.handle_command(command) //"true" is for playing a recording, so I don't have to switch modes.
    }
    a_simple_fn.simple_command = command //for debugging and generating src for editing
    return a_simple_fn //goes on the do_list
}
globalThis.simple = simple

/*
// Start recording.
// This can be bound to e.g. a button press.
await client.start()

// Stop recording after a timeout.
// This can be bound to e.g. a button press.
setTimeout(async function () {
    await client.stop()
}, 3000)

 */