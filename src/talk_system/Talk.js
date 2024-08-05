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
    static previous_modes

    static enable_speaker
    static speak_volume

    static listening
    static is_recording  //true or false
    static recording_name_now_playing //string

    static step_size  //float in meters
    static is_moving      //true or false. Automatically set to true when Dexter is moving due to user invoking a normal
                          //move command like "down". 
                          //To stop such a command as its running, set is_moving to false.
    static current_move_command //initially null, then when moving: "down", up, left, right, front, back, reverse, forward
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
        this.mode           = TalkMode.initial_mode
        this.previous_modes = []
        this.enable_speaker = false
        this.speak_volume   = 0.5
        this.listening      = false //can't find a way to determine this from Speechly
        this.is_recording   = false
        this.recording_name_now_playing = null

        this.step_size   = 0.005
        this.is_moving       = false
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
        //setTimeout(function() {
            this.display_ui()  //at least during init, "this" is Talk1 but Talk is Talk2 (some rollup bug)
        //}, 1000) //give chance for the above init to work,
        //before showing UI that the user can interact with since
        //if they try speaking before the above init, it will fail.
        DocCode.open_doc(talk_doc_id)
    }

    static parent_mode(){
        return Utils.last(this.previous_modes)
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
            Talk_command_command_id.value = full_text
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
        //spoken  replacement_to_use
        //"poor": "pour", //as in "pour water"
        dde:  "DDE",
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
            x: 200, y:7, width: 570, height: 420,
            content: `<fieldset style="padding:2px;"><legend><i>Status</i></legend>
                            <div id="display_status_id"></div>
                            <div id="talk_out_id" style="background-color:white;font-size:20px;padding:5px;height:60px;"></div>
                      </fieldset>
                      <fieldset style="padding:2px;"><legend><i>Valid Commands</i></legend>
                            <ul id='valid_commands_id' style="font-size:22px;margin:0px 0px 0px 20px; padding:0px;"></ul>
                      </fieldset>` +
                      TalkMode.make_command_command_html(),
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
            let content_obj = Talk.content_str_to_content_obj("mode main", "main", "", "main", TalkMode.initial_mode)
            let mess = "Tap the space-bar briefly and say a command<br/>" +
                       "or click on one.<br/>" +
                       "If you're a new user, try <b>Note</b>. Please read tooltips."
            //Talk.display_message(mess)
            //Talk.display_all()
            Talk.set_mode(TalkMode.initial_mode, content_obj, mess) // actual setting of mode not needed here, but convenient to call anyway
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

    static set_params_mode(aCAT, message){
       // let cmd_norm = content_obj._cmd_norm
       // let cmd_meth_name = this.string_to_method_name(cmd_norm)
       // let the_new_mode = content_obj._cmd_norm_mode + "__" + cmd_meth_name + "__params"
       // this.set_mode(the_new_mode, content_obj)
        this.set_mode(TalkMode.params, aCAT, message)
    }

    static set_mode(mode, aCAT, message){
        if(Utils.last(Talk.previous_modes) !== Talk.mode) { //don't have adjacent items in pervious_modes array be the same, its just "noise")
            Talk.previous_modes.push(Talk.mode) //now user can back up thru all their modes.
        }
        Talk.mode = mode //oneof main_menu, move_menu, or param like: "main_menu__define_term__params"
        Talk.display_all(aCAT, message)
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
                "<i>Mode:          </i><b>" + this.mode.name + (Talk.recording_name_now_playing ? " " + Talk.recording_name_now_playing : "") + "</b> &nbsp;"
        }
    }

    static display_message(message, content_obj){ //display_message
        if (message){} //just use it below
        else if (content_obj) {
            let parameters = content_obj._cmd.parameters
            if (parameters.length === 1) {
                message = "For <b>" + content_obj._cmd.name + "</b>, tap space-bar and say the value for: <b>" + parameters[0].name +
                    "</b><br/>or type it in."
            }
            else {
                message = "For <b>" + content_obj._cmd.name + "</b>, say a param_name and its new value<br/>" +
                    "or type in a new value."
            }
        }
        else {
            message = "Tap space-bar and say a command or click on one."
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
        valid_commands_id.innerHTML = Talk.mode.cmds_html(content_obj)
    }

 //_______command Utilities_______

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
        Talk.recognition.abort()
        globalThis.stop_speaking()
        //this.enable_speaker = false
        Talk.turn_off_mic_aux()
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
                Talk.handle_command("run") //does its own setting of command_line
            }
            else { //there's more inputs. Focus on next input
                let cur_index = names.indexOf(param_name)
                let next_index = cur_index + 1
                let next_param_name = names[next_index]
                let next_id = parent_mode + "__" + cmd_str + "__params__" + next_param_name + "__id"
                let next_dom_elt = globalThis[next_id]
                if(next_dom_elt) {
                    next_dom_elt.focus()
                }
                Talk.compute_and_set_command_line_in_param_mode(Talk.mode) //should be a params mode
            }
        }
    }

    //needed to shadow typing space for whole dialog
    static onkeydown_for_command_command_input(){
        event.stopPropagation()
    }
    static onkeyup_for_command_command_input(event) {
        event.stopPropagation()
        //event.preventDefault()
        if (event.key === "Enter") {
            Talk.handle_command_command()
        }
    }



    //called when user clicks the "Command:" button/link or when hits ENTER on the cmd line.
    static handle_command_command() {
        let full_text = Talk_command_command_id.value.trim()
        if (full_text.length === 0) {
            Talk.display_message("There is nothing in the <b>Command</b> text box.<br/> You must enter one or<br/>tap the space-bar and say a command.")
        } else {
            //let [parent_mode, cmd_name_with_understores, params] = this.mode.split("__")
            if(Talk.mode === TalkMode.params){
                let prev_mode = Utils.last(this.previous_modes)
                if(!prev_mode){
                    shouldnt("In Talk.handle_command_command with Talk.mode: " + Talk.mode.name) + " no previous mode."
                }
                this.set_mode(prev_mode) //because the full_text is relevant to the parent_mode, NOT to the parsms mode, so we must be in parent_mode for handle_cmd to handle it.
            }
            Talk.handle_command(full_text)
        }
    }


    static define_command_parameter_callback(callback_name, callback_param_name, callback_callback) {
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

    //called when user says "command <do something>" but not when user clicks the Command button/link
    //that's handled by handle_command_command() as is typing Enter on cmd line.
    //this fn CAN'T get anything useful from the cmd line as that's replaced with "command"
    //as soon as user says something.
    static command(content_obj_or_full_text){
        if(typeof(content_obj_or_full_text) === "object"){
            content_obj_or_full_text = content_obj_or_full_text._full_text
        }
        if (typeof(content_obj_or_full_text) !== "string"){
            shouldnt("Talk.command passed invalid content_obj_or_full_text of: " + content_obj_or_full_text)
        }
        let full_text = content_obj_or_full_text

        if(full_text.toLowerCase().startsWith("command")){
            full_text = full_text.substring(7).trim()
        }

        if(full_text.trim() === "") { //If anything was passed, it started with "command" so we've gotten rid of it
                                     //and the typein is empty too, so nothing to do.
            Talk.display_message("There is no content for the command.")
            window.Talk_command_command_id.value = ""
        }
        /*else {
            let [parent_mode, comd_norm_with_underscores, params] = Talk.mode.split("__")
            if (params) {
                Talk.set_mode(parent_mode)
            }
            Talk.handle_command(full_text)
        }*/
        else {
            window.Talk_command_command_id.value =  full_text
            Talk.handle_command(full_text)
        }
    }




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
        let is_cmd =  cmd_norm_mode.is_known_cmd(cmd_norm)
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









    static handle_command(full_text){
        console.log("handle_command passed: " + full_text)
        this.stop_aux() // this is called by space-bar down. So it *might* be redundant,
        //but in the case where the user clicks a menu item instead, we shoudl do it.
        //one reason is for the cmd stop_recording, but in general. makes clickng space bar and
        //clicking a menu item more similar.
        full_text = full_text.trim()
        if(full_text.toLowerCase().startsWith("command")){
            this.command(full_text)
            return
        }

        //mode is valid
        for (let cmd of Talk.mode.commands) {
            if (!cmd.should_display) {
            } //loop around as this cmd can't be acceptable for the mode node
            else {
                let alts = [cmd.name].concat(cmd.alternate_names) //alts needs to include orig cmd
            //all cmd_norm and alts are lower case
                let [cmd_str, content_str] = Utils.starts_with_one_of_and_tail(full_text.toLowerCase(), alts, true)
                if (cmd_str) { //good. At least one of the alts is valid. But use the cmd_meth generated from cmd_norm NOT this cmd_str which might be an alt.
                    if ((cmd.parameters.length === 0) && (content_str.length > 0)) {
                    } //no match. cmd_norm might be "stop" but content_str is "recording", so loop around again until we find cmd_norm is "step recording"
                    else { //positive identification that full_text is for cmd_norm.
                        //let [parent_mode, cmd_norm_from_mode_with_underscores, params_const] = Talk.mode.split("__")
                        //let cmd_norm_mode = (params_const ? parent_mode : Talk.mode)
                        //let cmd_norm_with_underscores = cmd_norm.replaceAll(" ", "_")
                        let aCAT = new TalkCAT({full_text: full_text, cmd: cmd, content_str: content_str}) //this.content_str_to_content_obj(full_text, cmd_norm_with_underscores, content_str, cmd_norm, Talk.mode)
                        if (aCAT._unused_param_names.length > 0) {
                            this.set_params_mode(aCAT)
                        } else {
                            //cmd.action_function.call(Talk, aCAT)
                            cmd.call_action_function(aCAT)
                        }
                        if (cmd_str !== "run") { //reclude "run" because cmd_meth.call(Talk, aCAT) for "run" ends up calling handle_command with a new full_text that will set its own, better cmd line
                            this.compute_and_set_command_line(aCAT)
                        }
                        return
                    }
                }
            }
        }
                    ///else no match for full_text with the alts, as is usual, so loop around again
        //no success with normal cmds so call the misc method for the mode, including, perhaps "params_mode_misc"

        let use_mode_for_making_mode_misc
        let cmd_norm
        let cmd_norm_with_underscores
        let content_str
        let cmd_norm_mode
        //let [parent_mode, cmd_norm_from_mode_with_underscores, params_const] = Talk.mode.split("__")
        if(Talk.mode === Talk.params){ //got a params dialog up.
            use_mode_for_making_mode_misc = "params"
            cmd_norm = cmd_norm_from_mode_with_underscores.replaceAll("_", " ")
            cmd_norm_with_underscores = cmd_norm_from_mode_with_underscores
            content_str  = full_text //"" //full_text.substring(cmd_norm.length).trim()
            cmd_norm_mode = Talk.parent_mode() //parent_mode
        }
        else { //not a params mode
            use_mode_for_making_mode_misc = Talk.mode
            cmd_norm = false
            //cmd_norm_with_underscores = false //no known cmd in the mode so cmd_str is false.
            content_str = ""
            cmd_norm_mode = Talk.mode
        }
        let misc_mode_name = use_mode_for_making_mode_misc + "_mode_misc" // ie "main_menu_mode_misc", "move_menu_mode_misc", "params_mode_misc"
        let misc_meth = Talk[misc_mode_name]
        if (!misc_meth) {
            this.display_warning('Mode: <b>' + Talk.mode + `</b> doesn't have a matching command for:<br/>"` + full_text + '" (no misc method).')
            return
        }

        let aCAT = new TalkCAT({full_text: full_text, cmd: cmd, content_str: content_str})
            //this.content_str_to_content_obj(full_text, cmd_norm_with_underscores, content_str, cmd_norm, cmd_norm_mode)
        if(aCAT._unused_param_names.length > 0){
            this.set_params_mode(aCAT)
            this.compute_and_set_command_line(aCAT)
        }
        else {
            misc_meth.call(Talk, aCAT)
            this.compute_and_set_command_line(aCAT)
        }
    }

    static compute_and_set_command_line(aCAT = null){
        let new_full_text
        let cmd_norm = aCAT._cmd_norm
        if(!cmd_norm){
            new_full_text = aCAT._full_text
        }
        else {
            if ((cmd_norm === "cancel") || (cmd_norm === "run")) {
                let [parent_mode, raw_cmd, params] = aCAT._cmd_norm_mode.split("__")
                cmd_norm = raw_cmd
            }
            new_full_text = cmd_norm + " "
            let param_names = aCAT._param_names
            for (let i = 0; i < param_names.length; i++) {
                let param_name = param_names[i]
                if (i !== 0) {
                    new_full_text += ","
                }
                if ((aCAT[param_name] === undefined) ||
                    ((typeof (aCAT[param_name]) === "string") &&
                        (aCAT[param_name].trim().length === 0))) {
                    new_full_text += " /*needs: " + param_name + "*/ "
                } else {
                    new_full_text += " " + aCAT[param_name]
                }
            }
        }
        new_full_text = new_full_text.trim() //trailing space maybe
        Talk_command_command_id.value = new_full_text
    }

    //called after entering a param value in param mode
    static compute_and_set_command_line_in_param_mode(a_param_mode = Talk.mode){
        let [parent_mode, cmd_str_with_underscores] = a_param_mode.split("__")
        let cmd_norm = cmd_str_with_underscores.replaceAll("_", " ")
        let param_names = this.cmd_param_names(cmd_norm, parent_mode)
        let new_full_text = cmd_norm
        for (let i = 0; i < param_names.length; i++) {
            let param_name = param_names[i]
            let id_str = parent_mode + "__" + cmd_str_with_underscores + "__params__" + param_name + "__id"
            let dom_elt = globalThis[id_str]
            let val = dom_elt.value
            if ((val === undefined) || (val.trim() === "")) {
                val = "/*needs: " + param_name + "*/"
            }
            if(i !== 0){
                new_full_text += ","
            }
            new_full_text += " " + val
        }
        Talk_command_command_id.value = new_full_text
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