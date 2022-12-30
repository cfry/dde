/*
//todo
   After Edit some_recording, the display is just the rcording list with
     no way to get back to "listening" mode.
   new cmds:
        grab, release //close, open  (j7)// uses the value incremented by more, less.
        pitch up, pitch down   uses the value incremented by more, less.
        yawl left, yawl right  uses the value incremented by more, less.
        roll left, roll right  uses the value incremented by more, less.
        OR increase pitch, decrease pitch, same for yawl and role
        softer, louder and display status of volume next to Speaker: off
        initialize??? (stick in mode initial list of displayed cmds, but not elsewhere.)
        backward/forward (implementation: Job.talk_to_dexter.keep_history = true //even though now the default, may not be in future.
             Go up the robot_status's until you get to an "a" oplet,
             then use those angles to move_all_joints to those angles.
             Skip the first, one, check for the last one and give a warning when at beginning,
             successive "back" commands keep going up, but as soon as a non-back cmd comes in.
             set the instruction_id_back_pointer var to null.
             so first "back" sets it to the 2nd newest instriction_id of a "a" oplet,
             and subsequent ones in
        out (Just Speechly.speechly_out for some output in a job like IO.out,
             but we want to have bot speech output and text like Speechly.speechly_out
             Needs an input like waiting_for_recording_name
   ---
   Convert from step_distance to degrees for pitch, yawl, roll and distance for j7 open.close
   ---
   In show_window, display state of:
      should I show, along with step_distance, the equiv step_degrees and step_gripper_distance?
   ---
   Speechly => Say (shorter, separates from underlying implementation)
   for the instruction src in a Job: globalThis.say
   OR use Talk for the class and talk for the instruction.
   ---
   define_command(string_or_name_array, body_array_of_commands) //analogous to a function def
   //in a Job file, then we can have "say(cmd_name)" as do_list src code
   Maybe each cmd is defined subclass of Say top level class.
 */


/*
obsolete Commands
Dexter start listening (puts in normal listening mode
_____Normal Listening mode_____
Dexter, stop listening  (takes out of normal listening mode
x|y|z     plus|minus  less|same|more
tilt x|y  plus|minus  less|same|more
rotate    plus|minus  less|same|more
grab|drop
define <job_name> (start recording)
finish define     (stop recording)
<job_name>        (run sub job)
new file
save
load
_____________end obsolete Commands

Speechly Chicago contact:
Collin Borns collin@speechly.com +1 650-535-0146

Bug report to Speechly:
sent Dec 11 to us@speechly.com

- on https://www.npmjs.com/package/@speechly/browser-client
  first line of JS example is:
  import { BrowserClient, BrowserMicrophone, Segment } from '@speechly/browser-client'
  but that causes the error:
  Import of non-existent export (for Segment)
  I deleted ", Segment" and it works ok

 - Your line: appId: 'your-app-id'
   causes a syntax error. Change it to:
   appId: 'your-app-id',

 - on the page: https://api.speechly.com/dashboard/#/app/2357493e-4713-4d54-a041-a792f4952a62/trainingdata
   under Entities, I selected "number" in the drop down, then typed in "number"
   to the right of it and clicked "add"
    But that apparently did nothing since in the code:
    client.onSegmentChange((segment) => {
    console.log('Received new segment from the API:',
        segment.intent,
        segment.entities,
    When I said the words "thirty seven".
    I did see the regular words "thirty" and "seven" in the segment.
    But the segment.entities printed out as the empty array.

    Entity reco is an important functionality. I read
    https://github.com/speechly/api/blob/master/docs/slu.md#speechly.slu.v1.WLUEntity
    but with zero examples, let alone in JavaScript, its not useful.
    https://docs.speechly.com/features/intents-entities

- Your page: https://api.speechly.com/dashboard/#/dashboard
  gives doc for "Integrate Speechly" which describes on "On Device".
  That didn't have enough code for doing "On Device".
   Also what I really needed was "Off Device"
   It would be great to have documentation for a browser example that does not use the CDN
   for web page installation, but walks a developer though the steps of
   importing as well as getting app_id

- As far as I can tell, you don't document a way to get the string
 of a full utterance. Am I missing finding your doc, or
 do I have to cobble this together by looping through the
 words of a segment?

- I left the mic open without saying anything, then talked and got:
   "the audio stream is too long"
   My application needs a continuously open mic and to get
   utterances as they're uttered and just leave open the
   recognition. How do I do that?
   One thing I'm hoping is that when there's a long silence at the
   beginning of an audio file you're sending to the cloud,
   you just cut off that long silence (I know silences aren't really silences,
   but something like that would make the file much less long.
   Then less transfer of nothing over the web.
   I've used your tool to say a fairly long paragraph and seems to work
   quite well.
   Is there a

- Is there a way to turn off the reco of all but the "final" utterance?
  This could save network bandwidth and the use of your server compute resources
  potentially.
  ---- more after my email was sent.
- under the free usage, does it restrict who or what computers can use speech reco,
  or just the amount of usage?

- Is there a way to set a volume threshhold on the mic such that it
  ignores audo below a certain volume?

- can I "mute the microphone" temporarily so that I can have some speech output
  and not interfere with it getting recognized?

- how can I tell how much recognition time I've used up? (I get 50 hours free???)

*/
//import { BrowserClient, BrowserMicrophone, Segment } from '@speechly/browser-client' //from Speechly example but Segment is non-existent export
import { BrowserClient, BrowserMicrophone} from '@speechly/browser-client'
globalThis.BrowserClient = BrowserClient
// Create a new client.
// NOTE: Configure and get your appId from https://api.speechly.com/dashboard
// NOTE: Set vad.enable to true for hands free use

class Speechly {
    static client
    static microphone
    static mode = "not_initialied"
    static dexter_instance

    static segment_to_text(segment){
        let text = ""
        for(let word of segment.words){
            let str = word.value
            text += str + " "
        }
        return text.trim() //take off final space
    }
    static segment_to_array_of_words(segment){
        let arr = []
        for(let word of segment.words){
            arr.push(word.value)
        }
        return arr
    }

    /* obsolete
    static method_to_prose_name(meth){
        let meth_name = meth.name
        let result = ""
        if(["start_listening", "stop_listening", "off"].includes(meth_name)){
            result = "Dexter, "
        }
        meth_name = meth_name.replaceAll("_", " ")
        result += meth_name
        return result
    }*/

    /*obsolete
    //returns Speechly method or null if none
    static prose_name_to_method(prose_name){
        let meth_name
        if(prose_name.startsWith("Dexter,")){
            prose_name = prose_name.substring("Dexter,".length).trim()
        }
        let paren_index = prose_name.indexOf("(")
        if (paren_index !== -1) {
            prose_name = prose_name.substring(0, paren_index).trim() //open paren means the close paran ends the whole cmd so we don't have to check for it
        }
        prose_name = prose_name.trim()
        prose_name = prose_name.toLowerCase()
        prose_name = prose_name.replaceAll(" ", "_")
        prose_name = prose_name.replaceAll("'", "") // "don't" => "dont"
        let meth = Speechly[prose_name]
        if(typeof(meth) === "function"){
            return meth
        }
        else { return null}
    }
     */

    //returns the kind of string that speech-reco would
   /* static prose_name_to_utterance(prose_name){
        let result = prose_name.trim()
        let paren_index = result.indexOf("(")
        if(paren_index !== -1){
            result = result.substring(0, paren_index).trim()
        }
        result = result.replaceAll(",", "")
        result = result.toLowerCase()
        return result
    }*/

    //cmds is a list of a list of methods  without their subject, lower-case, with underscores
    static make_command_list_items(...cmds){
        let result = ""
        for(let cmd_arr of cmds){
            result += "<li style='height:30px;'>"
            for(let cmd of cmd_arr) {
                if ((cmd_arr.length > 1) && (cmd !== cmd_arr[0])) { //put comma before every non-first elt
                    result += ", &nbsp;"
                }
                let li_body_html
                let display_prose = this.cmd_display_prose(cmd)
                let norm = this.cmd_normalized_prose(cmd)
                if(norm.length > 0){ //meth could be null as in case of (recording name) in which case we
                    let click_source = "Speechly.handle_command('" + norm + "')"
                    li_body_html = '<a href="#" onclick="' + click_source + '">' + display_prose + '</a>'
                }
                else {
                    li_body_html = cmd
                }
                result += li_body_html
            }
            result += "</li>\n"
        }
        return result
    }

    static show_initial_mode_commands(){
        //let items = `<li><a href="#" onclick="Speechly.start_listening()">Dexter, start listening</a></li>
        //            <li><a href="#" onclick="Speechly.off()">Dexter, off</a></li>`//todo the onclick call isn't being called
        let items = this.make_command_list_items(["Dexter, start listening", "Dexter, off"])
        valid_commands_id.innerHTML = items
    }

    static straight_up_angles(){
        let angles = Kin.point_down([0,0,0,0,0, 0, 50])
        return Kin.point_down(angles)
    }

    static dexter_for_job(the_job){
        if(the_job.robot instanceof Dexter){
            return the_job.robot
        }
        else { //probably the_job is Job.talk_to_dexter
            return Dexter.default
        }
    }

    static initial_angles(the_job=Job.talk_to_dexter){
        let dex = this.dexter_for_job(the_job)
        if(dex.rs){
            return dex.rs.measured_angles()
        }
        else {
            return this.straight_up_angles() }
    }

    static initial_straight_up_angles_maybe(the_job=Job.talk_to_dexter){
        let dex = this.dexter_for_job(the_job)
        if(dex.rs){
            let ma = dex.rs.measured_angles()
            if(this.is_home_angles(ma)){
                return this.straight_up_angles()
            }
            else { return ma }
        }
        else {
            return this.straight_up_angles() }
    }

    /* obsolete
    static make_initial_instruction_maybe(){
        if(this.dexter_instance.robot.rs) { return null}
        else {
            return this.dexter_instance.move_all_joints(this.initial_angles())
        }
    }
     */

    static async initialize(enable_speech_reco=true){
        this.recordings = {}
        new Job ({name: "talk_to_dexter",
                  robot: Brain.brain0,
                  when_do_list_done: "wait",
                  do_list: [
                        //this.make_initial_instruction_maybe(), //needed since move_incrementally has to have a starting point
                        //this.dexter_instance.empty_instruction_queue()
            ]
        }).start()
        if(enable_speech_reco) {
            this.client = new BrowserClient({
                appId: '2357493e-4713-4d54-a041-a792f4952a62',
                vad: {enabled: false, noiseGateDb: -24.0} // https://github.com/speechly/speechly/blob/main/libraries/browser-client/docs/interfaces/client.VadOptions.md#enabled
            })
            this.microphone = new BrowserMicrophone()
            // React to the updates from the API.
            this.client.onSegmentChange((segment) => {
                console.log('Received new segment from the API:',
                    segment.intent,
                    segment.entities,
                    segment.words,
                    segment.isFinal
                )
                if (segment.isFinal) {
                    Speechly.handle_command(segment)
                }
            })
            // Initialize the microphone - this will ask the user for microphone permissions
// and establish the connection to Speechly API.
// Make sure you call `initialize` from a user action handler
// (e.g. from a button press handler).
            await this.microphone.initialize()

// bind the microphone to the client
            await this.client.attach(this.microphone.mediaStream)// Initialize the microphone - this will ask the user for microphone permissions

            this.client.start()
        }
        setTimeout(this.display_ui, 1000) //give chance for the above init to work,
        //before showing UI that the user can interact with since
        //if they try speaking before the above init, it will fail.
    }

    static display_ui(){
        show_window({title: "Valid Dexter Commands",
            x: 400, y:78, width: 540, height: 500,
            content: `<ul id='valid_commands_id' style="font-size:22px;"></ul>
                      <fieldset><legend><i>Status</i></legend>
                            <div><i>Mode:</i> <span id="mode_id"></span></div>
                            <div><i>Step distance:</i> <span id="step_distance_id"></span></div>
                            <div><span id="audio_id"></span></div>
                      </field_set>
                      <div id="speechly_out_id" style="background-color:white;font-size:20px;padding:10px;"></div>`,
            callback: "Speechly.sw_callback"
        })
        Speechly.set_mode("initial")
        setTimeout(function() { Speechly.display_status() }, //need "Speechly" here, not "this"
                   1000)
        Speechly.speechly_out("Say or click on a valid command.")
    }

    static sw_callback(vals){
        out(vals)
        let but_val = vals.clicked_button_value
        if(but_val === "close_button") {
            Speechly.off()
            return
        }
        else {
            let meth = Speechly.cmd_method(but_val) //Speechly.prose_name_to_method(but_val)
            if (meth) {
                meth.call(Speechly)
            } else {
                out("show_window click has no action.")
            }
        }
    }

    static set_mode(mode){
        Speechly.mode = mode //must use "Speechly", not "this" due to setTimeout call
        Speechly.display_status()
    }

    //shows status including valid cmds
    static display_status(){
        out("top of display_status")
        if(globalThis.mode_id) {
            let status_html =
                "<i>Mode: </i><b>"          + Speechly.mode + (Speechly.recording_name_now_playing ?  " " + Speechly.recording_name_now_playing : "") + "</b> &nbsp;" +
                "<i>Step distance: </i><b>" + Speechly.step_distance               + "</b> &nbsp;" +
                "<i>Mic: </i><b>"           + (this.is_mic_on() ? "on" : "off")    + "</b> &nbsp;" +
                "<i>Speaker: </i><b>"       + (this.enable_speaker ? "on" : "off") + "</b>"
            mode_id.innerHTML = status_html

            let valid_cmds_html_fn_name
            valid_cmds_html_fn_name = "show_" + Speechly.mode + "_mode_commands"
            out("display_status valid_cmds_html_fn_name: " + valid_cmds_html_fn_name)
            let meth = Speechly[valid_cmds_html_fn_name]
            out("display_status meth: " + meth)
            meth.call(Speechly) //show valid cmds
        }
    }

    //if called with "dexter off" or NO arg, it should still work
    static async off(full_text="dexter off"){
        if(full_text === "dexter off") {
            this.set_mode("initial")
            SW.close_window("Valid Dexter Commands")

            if (Job.talk_to_dexter) {
                Job.talk_to_dexter.when_do_list_done = "run_when_stopped"
                //change from "wait" so that stop_for_reason will stop the job.
                Job.talk_to_dexter.stop_for_reason("completed", "user stopped job")
                Job.talk_to_dexter.undefine_job()
            }
            //put the above before the below because the below try doesn't catch a broken websocket error
            try {
                if (this.client) {
                    await this.client.stop()
                }
                if (this.microphone) {
                    await this.microphone.close()
                }
            }
            catch (err) { } //ignore the errors if the websocket is busted.
            return "valid"
        }
        else { return "invalid"}
    }

    static word_replacements = {"poor": "pour" //as in "poor water
                               }
    //used only when user is saying a recording name.
    static clean_full_text(full_text){
        full_text = full_text.trim()
        let result = ""
        let word_array = full_text.split(" ")
        for(let word of word_array){
            let new_word = this.word_replacements[word]
            if(new_word){
                result.push(new_word + " ")
            }
            else { result += word + " " }
        }
        return result.trim()
    }

    static cmd_table = [
        //cmd_normalized_prose,    cmd_display_prose,          cmd_method_name,    can_be_in_   alternatives..
        //aka utterance from reco                              aka recording_name, recording,
        ["dexter start listening", "Dexter, start listening",  "start_listening",  false, "dexter started listening", "dexter starred listening", "dexter stark listening", "dexter stock listening", "dexter startles listening"],
        ["dexter stop listening",  "Dexter, stop listening",   "stop_listening",   false],
        ["dexter off",             "Dexter, off",              "off",              false],

        ["straight up",            "Straight up",              "straight_up",      true],
        ["down",                   "Down",                     "down",             true],
        ["up",                     "Up",                       "up",               true],
        ["left",                   "Left",                     "left",             true],
        ["right",                  "Right",                    "right",            true],
        ["closer",                 "Closer",                   "closer",           true],
        ["farther",                "Farther",                  "farther",          true,  "further"],
        ["backward",               "Backward",                 "backward",         true],
        ["forward",                "Forward",                  "forward",          true,  "foreword"],


        ["more",                   "More",                     "more",             true],
        ["less",                   "Less",                     "less",             true],

        ["mic on",                 "Mic on",                   "mic_on",           true, "mike on"],
        ["mic off",                "Mic off",                  "mic_off",          true, "mike off"],

        ["speaker on",             "Speaker on",               "speaker_on",       true],
        ["speaker off",            "Speaker off",              "speaker_off",      true],

        ["listen for other commands", "Listen for other commands", "listen_for_other_commands", false],
        ["name position",          "Name position",            "name_position",    false],
        ["start recording",        "Start recording",          "start_recording",  false, "started recording"],
        ["stop recording",         "Stop recording",           "stop_recording",   false],
        ["play recording",         "Play Recording (name)",    "play_recording",   true],
        ["stop playing",           "Stop playing",             "stop_playing",     true],
        ["list recordings",        "List recordings",          "list_recordings",  true]
    ]

    //does not check for existance, just converts string to the right FORMAT of a cmd_normalized_prose.
    //used to get a recording_name as might be spoken
    static string_to_cmd_normalized_prose(string){
        let paren_index = string.indexOf("(")
        if (paren_index !== -1) {
            string = string.substring(0, paren_index) //open paren means the close paran ends the whole cmd so we don't have to check for it.
                                                      //an open paren signifies a comment to the end of the string
        }
        string = string.replaceAll(",", "")
        string = string.trim()
        string = string.toLowerCase()
        return string
    }

    static string_to_method_name(string) { //also returns proper spelling for recording_name
        string = this.string_to_cmd_normalized_prose(string)
        string = string.replaceAll(" ", "_")
        string = string.replaceAll("'", "") // "don't" => "dont"
        return string
    }

    static string_to_display_prose(string){
        string = string.replaceAll("_", " ")
        string = Utils.make_first_char_upper_case(string)
        return string
    }

//called at top of handle_command
    static cmd_normalized_prose(cmd){
       for(let row of this.cmd_table){
           if(row.includes(cmd))            { return row[0] }
       }
       let norm_cmd = this.string_to_cmd_normalized_prose(cmd)
       let meth_name = this.string_to_method_name(cmd)
       if(this.is_recording_name(meth_name)) { return norm_cmd } //yes this is unnecessary, but clearer intent
       else                                  { return norm_cmd }//Might be a brand new recording name
    }

    //returns true for regular cmds and known recording_names
    static is_known_cmd(cmd){
        for(let row of this.cmd_table){
            if(row.includes(cmd)) { return true }
        }
        let meth_name = this.string_to_method_name(cmd)
        if(this.is_recording_name(meth_name)) { return true }
        else { return false }//cmd Might be a brand new recording name, but we still return false as is it is as of yet, unknown
    }

    static cmd_display_prose(cmd){
        for(let row of this.cmd_table){
            if(row.includes(cmd)) { return row[1] }
        }
        return this.string_to_display_prose(cmd)
    }

    static cmd_method_name(cmd){
        for(let row of this.cmd_table){
            if(row.includes(cmd)) { return row[2] }
        }
        //below used for making a recording_name from some potentially unknown string
        let meth_name = this.string_to_method_name(string)(cmd)
        return meth_name
    }

    static cmd_method(cmd){
        let meth_name = this.cmd_method_name(cmd)
        if(meth_name) { return Speechly[meth_name] }
        return null //not found
    }

    //note that an unknown but proper recording_name will still return false
    static can_be_in_recording(cmd){
        for(let row of this.cmd_table){
            if(row.includes(cmd)) { return row[3] }
        }
        let meth_name = string_to_method_name(string)
        if(this.is_recording_name(meth_name)) { true }
        return null //not found
    }

    //called in both "listening" and "now recording" modes
    static core_listening_cmds = [
        ["Dexter, stop listening", "Dexter, off"],
        ["Down",     "Up",         "Straight up"],
        ["Left",     "Right"],
        ["Closer",   "Farther"],
        ["Backward", "Forward"],
        ["More",     "Less"],
        ["Mic on",   "Mic off"],
        ["Speaker on",  "Speaker off"]
    ]

    static show_listening_mode_commands() {
        let arr = this.core_listening_cmds.slice()
        arr.push(["Name position", "Start recording", "List recordings"])
        arr.push(["Play recording (name)"])
        let items = this.make_command_list_items(...arr)
        valid_commands_id.innerHTML = items
    }

    static show_now_recording_mode_commands(){
        let arr = this.core_listening_cmds.slice()
        arr.push(["Stop recording"])
        let items = this.make_command_list_items(...arr)
        valid_commands_id.innerHTML = items
    }

    
    //works for no args or a string
    static start_listening(full_text = "dexter start listening") {
        if (["dexter start listening",
             "dexter started listening",
             "dexter starred listening",
             "dexter stark listening",
             "dexter startles listening",
             "dexter startled listening"].includes(full_text)){
            full_text = "dexter start listening"
            this.speechly_out("Say or click a valid command.")
            this.set_mode("listening")
            return "valid"
        }
        else { return "invalid"}
    }

    static stop_listening(full_text="dexter stop listening"){
        if (full_text === "dexter stop listening") {
            this.speechly_out("Say or click a valid command.")
            this.set_mode("initial")
            return "valid"
        }
        else { return "invalid"}
    }


    /*
    static segment_to_parsed_obj(segment){
        let words = this.segment_to_array_of_words(segment)
        let result = {}
        if     (("dexter" === words[0]) &&
                ["start", "stark", "starred", "stop", "off"].includes(words[1])){
            result.kind = "start_or_stop"
            if(["stark", "starred"].includes(words[1])) { words[1] = "start"}
            result.start_or_stop = words[1]
        }
        else if(["x", "y", "why", "z", "zed"].includes(words[0]))   {
            result.kind = "move_to"
            if(["plus", "minus"].includes(words[1])) {
                if(words[1] === "why") { words[1] = "y" }
                if(words[1] === "zed") { words[1] = "z" } // British to American
                result.axis = words[1]
                if(["less", "same", "more"].includes(words[2])) {
                    result.amount = words[2]
                }
                else { result.kind = "invalid"}
            }
            else { result.kind = "invalid"}
        }
        else if("tilt" === words[0])                  { result.kind = "tilt"}
        else if("rotate" === words[0])                { result.kind = "rotate"}
        else if(["grab", "drop"].includes(words[0]))  { result.kind = "grab_or_drop" }
        else {result.kind = "invalid" }
        return result
    }
     */

    static enable_speaker = false
    static speak_volume = 0.5

    //from: https://stackoverflow.com/questions/822452/strip-html-from-text-javascript
    static strip_html(str){
        str=str.replace(/<\s*br\/*>/gi, "\n");
        str=str.replace(/<\s*a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ");
        str=str.replace(/<\s*\/*.+?>/ig, "\n");
        str=str.replace(/ {2,}/gi, " ");
        str=str.replace(/\n+\s*/gi, "\n\n");
        return str
    }
    static speechly_out(html){
        if(globalThis.speechly_out_id) {
            speechly_out_id.innerHTML = html
            if (this.enable_speaker) {
                // but having problems turning it back on.
                //this.microphone.close()
                this.client.stop()
                let str = this.strip_html(html)
                speak({
                    speak_data: str, volume:
                    this.speak_volume,
                    callback: function () {
                        Speechly.client.start()
                    }
                })
                //setTimeout(this.speak_and_restart(html), 1000)
            }
        }
        else { out(html) }
    }

    static speak_and_restart(html){
        speak({speak_data: html,
               volume: this.speak_volume,
               callback: Speechly.restart
               })
    }

    static async restart(){
        await Speechly.client.start()
        await Speechly.microphone.initialize()
    }

    //_______move_incrementally________
    //if angle_array is an array whose first 5 elts are 0, return true,
    //else return false
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
    //whose first 5 elts are 0 except the 2nd elt is Number.EPSLION
    //and any additional elts are the same as their corresponding ones in angle_array
    //Returned is an array of arrays.
    static fix_xyz(xyz){
        let angle_array = Kin.xyz_to_J_angles(xyz) //will get out_of_range error with initial angles
        let new_angle_array = this.fix_home_angles_maybe(angle_array)
        let new_xyz_extra = Kin.J_angles_to_xyz(new_angle_array)
        return new_xyz_extra //arr of array of numbers
    }

    static word_to_axis_index_and_direction(word="down"){
        //x
        if     (word == "right") { return [0, -1]}
        else if(word == "left")  { return [0, 1]}
        //y
        else if(["closer", "nearer"].includes(word)) {
                                   return [1, -1]}
        else if(["farther", "further", ].includes(word)) {
                                   return [1, 1]}
        //z
        else if(word == "down")  { return [2, -1]}
        else if(word == "up")    { return [2, 1]}
        else { return false} //not a valid word
    }

    static step_distance = 0.05

    static set_step_distance(dist){
        this.step_distance = dist
        this.display_status()
    }

    static straight_up(full_text = "straight up", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text === "straight up") {
            let dex = this.dexter_for_job(the_job)
            this.send_instruction_to_dexter(dex.move_all_joints(this.straight_up_angles()), the_job)
            Speechly.speechly_out("Dexter is going straight up.")
            return "valid"
        }
        else { return "invalid"}
    }

    static down(   full_text="down")      { return this.move_incrementally(full_text)}
    static up(     full_text="up")        { return this.move_incrementally(full_text)}
    static left(   full_text="left")      { return this.move_incrementally(full_text)}
    static right(  full_text="right")     { return this.move_incrementally(full_text)}
    static farther(full_text="farther")   { return this.move_incrementally(full_text)}
    static closer( full_text="closer")    { return this.move_incrementally(full_text)}

    static send_instruction_to_dexter(instruction, the_job) {
        let dex = instruction.robot
        if(dex instanceof Dexter) {} //keep dex as is
        else { dex = this.dexter_for_job(the_job) }
        let instrs = [instruction, dex.empty_instruction_queue()]
        the_job.insert_instructions(instrs, false)
    }

    //moves dester straight up if we don't know hwere it is, and then
    //calls the next_full_text
    //returns true if it has to do the init, and false if its already good to go.
    //called by move_incrementally and name_position
    static initialize_dexter_maybe(next_full_text, playing_a_recording_cmd, the_job){
        let dex = this.dexter_for_job(the_job)
        if (dex.rs) { return false} //does not need to be initialized so the caller can keep going
        else {
            this.handle_command("straight_up", playing_a_recording_cmd, the_job)
            Speechly.speechly_out("Initializing Dexter to straight up position.")
            setTimeout(function () {
                Speechly.handle_command(next_full_text, playing_a_recording_cmd, the_job)
            }, 5000) //beware, possible infinite loop if straight_up fails to set the_job.robot.rs
            return true
        }
    }

    //return "valid" if valid cmd and performed.
    //return "out_of_reach" if out of reach
    //return "invalid" if word is not left, right, etc.
    static move_incrementally(full_text="down", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter) {
        //make sure dex is initialized with both dexter_instance and its robot.rs
        if(Utils.starts_with_one_of(full_text, ["down", "up", "left", "right", "closer", "farther"])) {
            if (this.initialize_dexter_maybe(full_text, playing_a_recording_cmd, the_job)) {
                return "valid"  //even if its not really valid, validate anyway. If full_text isn't valid,
                //it will get caught by the handle_command in the setTimeout fn
            }
            let axis_index_dir = this.word_to_axis_index_and_direction(full_text)
            if (!axis_index_dir) {
                return "invalid"
            }
            else {
                let ma = this.initial_straight_up_angles_maybe(the_job)
                let orig_xyz = Kin.J_angles_to_xyz(ma)[0] //the_job.robot.rs.xyz()[0]

                let [axis_index, dir] = axis_index_dir //axis_index is 9, 1, 2 for x,y, z. dir is 1 or -1
                let [new_x, new_y, new_z] = orig_xyz
                if (axis_index === 0) {
                    new_x = orig_xyz[axis_index] + (dir * this.step_distance)
                } else if (axis_index === 1) {
                    new_y = orig_xyz[axis_index] + (dir * this.step_distance)
                } else if (axis_index === 2) {
                    new_z = orig_xyz[axis_index] + (dir * this.step_distance)
                }

                //let orig_angles2 = Kin.xyz_to_J_angles(orig_xyz)
                let new_xyz = [new_x, new_y, new_z]
                new_xyz = this.fix_xyz(new_xyz)[0]
                let dex = this.dexter_for_job(the_job)
                //out("is_in_reach? " + new_xyz)
                if (true) { //Kin.is_in_reach(new_xyz)) {
                    this.speechly_out("Moving Dexter " + full_text)
                    this.send_instruction_to_dexter(dex.move_to(new_xyz), the_job)
                    return "valid"
                } else {
                    this.speechly_out("Moving " + full_text + " is out of Dexter's reach.")
                    return "valid"
                }
            }
        }
        else { return "invalid" }
    }

    static last_backward_forward_index = null
    static forward_limit_index = null  //backward_limit_index is always 0. but we need this because
       //doing a backward cmd extends the length of the rs_history and we don't want to count that
       //as when we go back ,then go forward, we want to stop the forward at the orig
       //length of rs_history, NOT including the extra "backs" or "forwards" we did
       //when we started the back and forward sequence

    static backward(full_text="backward", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text === "backward"){
            let dex = this.dexter_for_job(the_job)
            let hist_arr   = the_job.rs_history
            if(this.last_backward_forward_index === null) {
                this.last_backward_forward_index = hist_arr.length - 1
                this.forward_limit_index = hist_arr.length - 1
            }  //skip past the latest one

            if(this.last_backward_forward_index === 0){
                Speechly.speechly_out("There are no more commands to go backward to.")
                return "valid"
            }
            let RS_inst = new RobotStatus({})
            for(let i = this.last_backward_forward_index - 1; i >= 0; i--){
                let single_rs = hist_arr[i]
                if(single_rs[Dexter.INSTRUCTION_TYPE] === "F"){ //this is the one to go back to.
                    RS_inst.robot_status = single_rs
                    let angles = RS_inst.measured_angles()
                    let instr = dex.move_all_joints(angles)
                    this.last_backward_forward_index = i
                    Speechly.speechly_out("Backing up to: " + angles)
                    this.send_instruction_to_dexter(instr, the_job)
                    return "valid"
                }
            }
            Speechly.speechly_out("There are no more commands to go backward to.")
            return "valid"
        }
        else { return "invalid" }
    }

    static forward(full_text="forward", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text === "forward"){
            let dex = this.dexter_for_job(the_job)
            let hist_arr   = Job.talk_to_dexter.rs_history
            if(this.last_backward_forward_index === null){
                this.last_backward_forward_index = hist_arr.length - 1  //skip past the latest one
                this.forward_limit_index = hist_arr.length - 1
            }
            //now we're at the prev_index. First time in the loop we do prev_index + 1
            if(this.last_backward_forward_index >= this.forward_limit_index){
                Speechly.speechly_out("There are no more commands to go forward to.")
                return "valid"
            }
            let RS_inst = new RobotStatus({})
            for(let i = this.last_backward_forward_index + 1; i <= this.forward_limit_index; i++){
                let single_rs = hist_arr[i]
                if(single_rs[Dexter.INSTRUCTION_TYPE] === "F"){ //this is the one to go back to.
                    RS_inst.robot_status = single_rs
                    let angles = RS_inst.measured_angles()
                    let instr = dex.move_all_joints(angles)
                    this.last_backward_forward_index = i
                    Speechly.speechly_out("Going forward to: " + angles)
                    this.send_instruction_to_dexter(instr, the_job)
                    return "valid"
                }
            }
            Speechly.speechly_out("There are no more commands to go forward to.")
            return "valid"
        }
        else { return "invalid" }
    }

    static more(full_text="more"){
        if(full_text === "more"){
            this.set_step_distance(this.step_distance * 2)
            this.speechly_out("Step distance has been increased to: " + this.step_distance + " meters.")
            return "valid"
        }
        else { return "invalid"}
    }

    static less(full_text="less"){
        if(full_text === "less"){
            this.set_step_distance(this.step_distance / 2)
            this.speechly_out("Step distance has been decreased to: " + this.step_distance + " meters.")
            return "valid"
        }
        else { return "invalid"}
    }

    static is_mic_on(){
        if(!this.client) { return false }
        else { return this.client.isActive() }
    }

    static mic_on(full_text){
        if (full_text === "mic on"){
            this.client.start()
            this.display_status()
            Speechly.speechly_out("The microphone is now on.")
            return "valid"
        }
        else { return "invalid"}
    }

    static mic_off(full_text){
        if (full_text === "mic off"){
            this.client.stop()
            this.display_status()
            Speechly.speechly_out("The microphone is now off.")
            return "valid"
        }
        else { return "invalid"}
    }

    static speaker_on(full_text = "speaker on") {
        if (full_text === "speaker on") {
            this.enable_speaker = true
            this.display_status()
            this.speechly_out('Say or click on "Speaker off" to stop Dexter from talking.')
            return "valid"
        } else {
            return "invalid"
        }
    }

    static speaker_off(full_text = "speaker off"){
        if(full_text === "speaker off"){
            this.enable_speaker = false
            this.display_status()
            this.speechly_out('Say or click on "Speaker on" to start Dexter talking.')
            return "valid"
        }
        else { return "invalid"}
    }

//_______RECORDING_________
    static recordings = {}
    
    //names are lower cased and have underscores. Just a straight array, not nested.
    static array_of_recording_names(){
        //return Object.keys(this.recordings)
        let job_names = Job.defined_job_names()
        let rec_names = []
        for(let job_name of job_names){
            if(!(job_name === "talk_to_dexter")){
                rec_names.push(job_name)
            }
        }
        return rec_names
    }

    static is_recording_name(cmd){
        //return this.array_of_recording_names().includes(cmd)
        return (Job[cmd] ? true : false)
    }
    
    static show_recording_mode_commands(){
        let items = this.make_command_list_items(["Stop recording"],
                                                       ["Dexter, stop listening", "Dexter, off"])
        valid_commands_id.innerHTML = items
    }
    static start_recording(full_text="start recording"){
        if(full_text === "start recording"){
           this.set_mode("now_recording")
           this.the_recording_in_progress = [] //clear out the previous recording
           this.speechly_out("Now recording.<br/>Say or click on commands, pausing between each.")
           return "valid"
        }
        else { return "invalid"}
    }
    static record_this_command(full_text){
        if(this.can_be_in_recording(full_text)) {
            this.the_recording_in_progress.push(full_text)
            this.handle_command(full_text, true) //true means play it even though the mode is "now_recording"
            let cmd_number = this.the_recording_in_progress.length
            this.speechly_out("Recorded command #" + cmd_number + ": " + full_text + "." +
                                   '<br/>Say or click another command or "Stop recording".')
            return "valid"
        }
        else {
            this.speechly_out('"' + full_text + '" can&apos;t be in a recording, so it has been ignored.')
            return "valid"
        }
    }

    static show_waiting_for_recording_name_mode_commands(){
        let items = this.make_command_list_items( ["(the name for this recording)"],
                                                        //["List recordings"], //too confusing
                                                        ["Stop recording"],
                                                        ["Dexter, stop listening", "Dexter, off"])
        valid_commands_id.innerHTML = items
    }

    static stop_recording(full_text="stop recording"){
        if(full_text === "stop recording"){
            this.set_mode("waiting_for_recording_name")
            this.speechly_out("Say the name of your recording or<br/>" +
                                    "type it in and hit Enter: " +
                                    "<input id='recording_name_id'  onkeyup='Speechly.define_recording_from_type_in(event)'/>"
            )
            setTimeout(function(){recording_name_id.focus() }, 200)
            return "valid"
        }
        else { return "invalid" }
    }

    //full_text must be passed, it can't default
    //always returns valid
    static define_recording(full_text){
        full_text = this.clean_full_text(full_text)
        let recording_name = this.string_to_method_name(full_text)
        if(this.is_recording_name(recording_name)) {}
        else if(this.is_known_cmd(recording_name)) { //we want to exclude known recording names
            this.speechly_out('"' + full_text + '" is a command, so it can&apos;t be used to name a recording.')
            return "invalid"
        }

        if(this.is_recording_name(recording_name)) {
            this.speechly_out('"' + full_text + '" has been over-written with your new recording.')
        }
        else {
            this.speechly_out('"' + full_text + '" is now a brand new recording.')
        }
        this.recordings[recording_name] = this.the_recording_in_progress
        this.define_job(recording_name, this.the_recording_in_progress)
        this.set_mode("listening")
        return "valid"
    }

    static define_recording_from_type_in(event){
        if(event.key === "Enter") {
            let rec_name = event.target.value
            if(rec_name && (rec_name.length > 0)) {
                Speechly.define_recording(rec_name)
            }
        }
    }

    //instruction_strings example: ["down", "straight up"], ie cmd_normalized_prose
    static define_job(job_name, instruction_strings){
        let do_list = []
        for(let cmd of instruction_strings){
            do_list.push(simple(cmd))
        }
        new Job({name: job_name,
                 do_list: do_list})
        return Job[job_name]
    }

    //_____name position_______
    static name_position(full_text, playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text.startsWith("name position")){

            let name_maybe = full_text.substring("name position ".length).trim()
            if (name_maybe.length > 0){
                full_text = this.clean_full_text(full_text)
                let prose_name = full_text.substring("name position ".length).trim()
                let recording_name = this.string_to_method_name(prose_name)

                if(this.is_known_cmd(recording_name)) { //we want to exclude known recording names
                    this.speechly_out('"' + full_text + '" is a command, so it can&apos;t be used to name a position.')
                    return "invalid"
                }
                else {
                    if(this.is_recording_name(recording_name)) {
                        this.speechly_out('"' + recording_name + '" has been over-written with your new position.')
                    }
                    else {
                        this.speechly_out('"' + recording_name + '" is now a named position.')
                    }
                    if (this.initialize_dexter_maybe(full_text, playing_a_recording_cmd, the_job)) {
                        return "valid"  //even if its not really valid, validate anyway. If full_text isn't valid,
                        //it will get caught by the handle_command in the setTimeout fn
                    }
                    let dex = this.dexter_for_job(the_job)
                    let angles = dex.rs.measured_angles()
                    let instrs = [dex.move_all_joints(angles), dex.empty_instruction_queue()]
                    this.define_name_position(recording_name, instrs)
                    this.set_mode("listening")
                    return "valid"
                }
            }
            else {
                this.speechly_out("Say the name of your recording or<br/>" +
                    "type it in and hit Enter: " +
                    "<input id='recording_name_id'  onkeyup='Speechly.name_position_from_type_in(event)'/>"
                )
                setTimeout(function(){recording_name_id.focus() }, 200)
                return "valid"
            }
        }
        else { return "invalid"}
    }

    static name_position_from_type_in(event){
        if(event.key === "Enter") {
            let rec_name = event.target.value
            if(rec_name && (rec_name.length > 0)) {
                Speechly.name_position("name position "  + rec_name) //should pass in Job here but that's hard.
            }
        }
    }

    //just move the robot to the named position
    //having a whole job is kinda overkill, but fits in well with recordings.
    //instrs are actual dde job instruction instances
    static define_name_position(job_name, instrs){
        return new Job({name: job_name, do_list: instrs})
    }


    static listen_for_other_commands(full_text="listen for other commands"){
        if(full_text === "listen for other commands"){
            this.set_mode("listening")
            return "valid"
        }
        else { return "invalid" }
    }

    static list_recordings(full_text="list recordings"){
        if(["list recordings", "liszt recordings"].includes(full_text)) {
            let job_names = this.array_of_recording_names()
            if (job_names.length === 0){
                this.speechly_out('There are no recordings.<br/>Use "Start recording" to make one.')
            }
            else {
                let arr_of_arrs = [["listen for other commands", "dexter stop listening"]]
                for(let job_name of job_names){
                    job_name = job_name.replaceAll("_", " ")
                    arr_of_arrs.push([job_name, "Edit " + job_name])
                }
                let items = this.make_command_list_items(...arr_of_arrs)
                valid_commands_id.innerHTML = items
                this.speechly_out("Say or click the name of a recording to play it.")
            }
            return "valid"
        }
        else { return "invalid" }
    }

    static edit(full_text){
        if(full_text.startsWith("edit ")){
            let rec_prose = full_text.substring(5).trim()
            let job_name = this.string_to_method_name(rec_prose)
            let the_job = Job[job_name]
            if(!(the_job instanceof Job)){
                Speechly.speechly_out(job_name + " is not the name of a recording.")
                return "valid"
            }
            else {
                let job_src = to_source_code({value: the_job, job_orig_args: true})
                Editor.insert(job_src, "start")
            }
        }
    }

    static show_playing_recording_mode_commands(){
        let items = this.make_command_list_items(["Stop playing"],
                                                       ["Dexter, stop listening", "Dexter, off"])
            valid_commands_id.innerHTML = items
    }

    static recording_name_now_playing = null

    static play_recording(full_text="play_recording"){
        let trimmed_text
        if (full_text === "play_recording") {
            if (this.array_of_recording_names().length === 0) {
                this.speechly_out('There are no recordings to play.<br/>Say or click on "Start recording"" to make one.')
                return "valid"
            } else {
                this.list_recordings()
                this.speechly_out('Say or click on the name of a recording to play it.')
                return "valid"
            }
        } else if (full_text.startsWith("play recording ")) {
            trimmed_text = full_text.substring("play recording ".length).trim()
        } else {
            trimmed_text = full_text
        }
        trimmed_text = this.clean_full_text(trimmed_text)
        /*recording_name = this.clean_full_text(recording_name)
        recording_name = this.string_to_method_name(recording_name)
        let cmds = this.recordings[full_text]
        if (cmds) {
            this.speechly_out("Playing recording: " + recording_name)
            this.set_mode("playing_recording")
            out("Playing recording: " + full_text + " of commands: " + cmds)  //needs work

            for (let cmd of cmds) {
                this.handle_command(cmd, true)
            }
            return "valid"
        }*/
        let recording_name = this.string_to_method_name(trimmed_text)
        let the_job = Job[recording_name]
        if(the_job) {
            the_job.start()
            this.recording_name_now_playing = recording_name //do before set_mode
            this.set_mode("playing_recording")
            this.speechly_out("Now playing recording: " + recording_name)
            setTimeout(function(){ Speechly.finished_playing_maybe(recording_name)},
                        500)
            return "valid"
       }
       else {
            return "invalid" //not "invalid" because we know the full_text starts with "play recording"
       }
    }

    static finished_playing_maybe(recording_name) {
        let the_job = Job[recording_name]
        if (!the_job.is_active()) {
            //Speechly.speechly_out("Finished playing: " + recording_name + " with status: " + the_job.status_code)
            //Speechly.recording_name_now_playing = null
            //Speechly.set_mode("listening") //put after setting recording_name_now_playing
            Speechly.handle_command("stop playing")
        }
        else {
            setTimeout(function(){Speechly.finished_playing_maybe(recording_name)},
                       500)
        }
    }

    static stop_playing(full_text="stop playing"){
        if(["stop playing"].includes(full_text)){
            let rec_name = Speechly.recording_name_now_playing
            let the_job = Job[rec_name]
            Speechly.recording_name_now_playing = null
            Speechly.set_mode("listening")
            Speechly.speechly_out("Finished playing: " + rec_name + ", with status: " +  the_job.status_code + ".")
            return "valid"
        }
        else { return "invalid" }
    }

//____________END OF CMD DEFS_________

    static handle_command(segment_or_full_text, playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        let full_text = segment_or_full_text
        if(typeof(full_text) !== "string"){
            full_text = this.segment_to_text(segment_or_full_text)
        }
        out("Starting to handle: " + full_text)
        full_text = this.cmd_normalized_prose(full_text)
        if(!["backward", "forward"].includes(full_text)){
            this.last_backward_forward_index = null //no longer in backward-forward sequence
            this.forward_limit_index = null
        }
        let status
        //full_text is a valid normalized command
        //the "listening mode needs to be first, See the below comment on "initia;" mode.
        if((this.mode === "listening") || playing_a_recording_cmd) {
            status = this.stop_listening(full_text)
            if(status === "valid") {return}

            status = this.off(full_text)
            if(status === "valid") {return}

            status = this.straight_up(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") {return}

            status = this.move_incrementally(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.backward(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.forward(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.more(full_text)
            if(status === "valid") { return }

            status = this.less(full_text)
            if(status === "valid") { return }

            status = this.mic_on(full_text)
            if(status === "valid") { return }

            status = this.mic_off(full_text)
            if(status === "valid") { return }

            status = this.speaker_on(full_text)
            if(status === "valid") { return } //speechly_out already called.

            status = this.speaker_off(full_text)
            if(status === "valid") { return }

            status = this.start_recording(full_text)
            if(status === "valid") { return }

            status = this.name_position(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.list_recordings(full_text)
            if(status === "valid") { return }

            status = this.edit(full_text)
            if(status === "valid") { return }

            status = this.listen_for_other_commands(full_text)
            if(status === "valid") { return }

            //this should be last because full_text can be a user made up name of recording.
            status = this.play_recording(full_text)
            if(status === "valid") { return }

            this.speechly_out("Unrecognized command: " + full_text + ".")
            return
        } //end of "listening" mode

        if(this.mode === "initial"){ //needs to go AFTER (this.mode === "listening") || playing_a_recording_cmd)
            //because if we first run the actual talking version, then run
            //a job with "simple" cmds, the mode might be set to "initial",
            //in which case a normal simple cmd like "down" would not be found in
            //the "initial" mode cmds and we'd get an unrecognized command.
            status = this.start_listening(full_text)
            if(status === "valid") {return}

            status = this.off(full_text)
            if(status === "valid") {return}

            this.speechly_out("Unrecognized command: " + full_text + ".")
            return
        }

        if(this.mode === "now_recording") {
            status = this.stop_recording(full_text)
            if(status === "valid") { return }

            status = this.stop_listening(full_text)
            if(status === "valid") {return}

            status = this.off(full_text)
            if(status === "valid") {return}

            status = this.record_this_command(full_text)
            if(status === "valid") {return}

            this.speechly_out("Unrecognized command: " + full_text + ".")
            return
        }

        if(this.mode === "waiting_for_recording_name"){
            status = this.stop_listening(full_text)
            if(status === "valid") {return}

            status = this.off(full_text)
            if(status === "valid") {return}

            status = this.define_recording(full_text)
            if(status === "valid") { return }

            this.speechly_out("Unrecognized command: " + full_text + ".")
            return
        }

        if(this.mode === "playing_recording"){
            status = this.stop_listening(full_text)
            if(status === "valid") { return }

            status = this.off(full_text)
            if(status === "valid") {return}

            status = this.stop_playing(full_text)
            if(status === "valid") { return }

            this.speechly_out("Unrecognized command: " + full_text + ".")
            return
        }

        this.speechly_out("Unrecognized mode: " + this.mode + ".") //shouldn't ever happen
        return
    } //end of handle_command


} //end of Speechly
globalThis.Speechly = Speechly

//with this, source code in a job's do_list can be: simple("down")
function simple(command){
    let a_simple_fn = function() {
        let the_job = this
        Speechly.handle_command(command, true, the_job) //"true" is for playing a recording so I don't have to switch modes.
    }
    a_simple_fn.simple_command = command //for debugging and genrating src for editing
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