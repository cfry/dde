/*
//todo
   new cmds:
        grab, release //close, open  (j7)// uses the value incremented by more, less.
           or perhaps better: narrower, wider and put it in down, etc loop to keep
           "narrowing" until user says "stop"/
        pitch up, pitch down   uses the value incremented by more, less.
           can stick this into new "move until stop."
        yawl left, yawl right  uses the value incremented by more, less.
           rename clockwise, counterclockwise and "move until stop."
        roll left, roll right  uses the value incremented by more, less.
        OR increase pitch, decrease pitch, same for yawl and role
        softer, louder and display status of volume next to Speaker: off
        initialize??? (stick in mode initial list of displayed cmds, but not elsewhere.)
        Convert from step_distance to degrees for pitch, yawl, roll and distance for j7 open.close
        In show_window, display state of:
          should I show, along with step_distance, the equiv step_degrees and step_gripper_distance?
   ______
       mode: calculate
              add 23 and/to 5 and/to 6
              substract 34 and/from 45
              multiply 5 and/by/times
              divide 3 and/by 4
              square 17
              square root(of) 43
              power 2 and/of 3
              degrees to arcseconds 23
              arcseconds to degrees 45
              current position (print out joint andlges and xyz, dir, etc.
   ---
   define_command(string_or_name_array, body_array_of_commands) //analogous to a function def
   //in a Job file, then we can have "say(cmd_name)" as do_list src code
   Maybe each cmd is defined subclass of Say top level class.
   OR
   define_command({mode="user", string_or_alternatives_array, fn, process_args})
   pushes a full cmd onto cmd obj that has for each mode the mode as a key and the value
     is an array of cmd_objects as the value.
   at end of handle_command
   loop over each command_obj, If we get a match (looking at the alternatives,
   then strip off the cmd name from the full_text and take the remainer of full_text
   and process it into the args to apply them to the fn.
   The fn always returns "valid" unless it errors. hmm do we move on to other possible
   commands, or display an error message? Probably display the error message.
   processing the args converts "null" => null, "undefined" => undefined
   "true" => true (maybe "yes" => true) "false" => false,
   "one" => 1 (hard, use the npm pkg.)
   in full text, " and " is separator between args.
   consider allowing "and" synonyms: " of ", " by " " to " (essentialy commas in the fn call.
   string_or_alternatives_array defaults to the name of the fn,
   but lower case and replace understores with spaces.
   _____
   List reader:
      define list  Then
         each sentence you say gets added to an array (of strings).
         If you say "do over", it writes over the last thing you said.
         when you say "done" it prompts you for a list name.
      Then it gets added to "recordings". Say the name and it says:
      "number 1: (the text you said) or maybe special case the first item:
          "the first of 3 items" (the text you said)
       also special case last item:  "number 3 and last item: (the text you said)
       when you say "next", it says
       "number 2: (the text you said)
         "previous" reads the previous item, and you can back up more than once to
           go back further, then say "next" to go forward from there.
        "done" ends the list reading, or its done when
         it reads the last item.
         "delete" deletes the last read item.
         "insert" inserts a new item into the list at that point.
         "replace" replaces the current item with a new spoken text.
         "repeat" say the current list item.
         "read rest" (reads rest of items but does not move pointer to end)
         "read next" (reads next item but doesn't move pointer to it.)
         "resume" start "playing" the list from the last "current item"
             ie Talk.talk_out("resuming from item 3 blue") //give user previous context.
         hmm, could we store COMMANDS as items, them "play" them all?
         Implementation:
             - as a job with Human.task for each item?
                         Get speech reco to work on "continue" and "stop job"
                         ultimately get reco to work on multiple choice, checkboxes, etc.
            - as special Talk mechanism
                class to_do_list
                   static list (of utterance strings)
                   static current_item (0 thru n - 1.)
                   static instances = [] //array of all the lists.
                   static next() {
                      current_item++
                      Talk.talk_out(current_item + 1 + ". " + this.list[this.current_item])
                   }
                   static repeat(){
                      Talk.talk_out(current_item + 1 + ". " + this.list[this.current_item])
                   }
                   static start_over(){
                      this.current_item = 0
                      Talk.talk_out(current_item + 1 + ". " + this.list[this.current_item])
                   }
 */
/*
_____obsolete Commands
_____end obsolete Commands

Talk Chicago contact:
Collin Borns collin@speechly.com +1 650-535-0146

Bug report to Talk:
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
  gives doc for "Integrate Talk" which describes on "On Device".
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
/* Entity reco in the SAL lang: https://dreamy-cori-a02de1.netlify.app/slu-examples/cheat-sheet/
   and https://docs.speechly.com/reference/sal/#entity

Example:
*relative_move down $SPEECHLY.NUMBER(num)
"*relative_move" is the intent of the utterance matched
"down " is just recoed text match
in place of "down" we could have [down | up] mathcing either "down" or "up" for this intent.
"$SPEECHLY.NUMBER"  captures numbers (including pos and neg, and decimal numbers).
     see https://dreamy-cori-a02de1.netlify.app/slu-examples/standard-variables/
"(num)" is used in the returned entity as a label for the found number.

To input this SAL lang entity reco,
browse: https://api.speechly.com/dashboard/#/app/2357493e-4713-4d54-a041-a792f4952a62/trainingdata
click on "login with Google"
Click on "voice_app" (Fry's app used in this code)
click on the "training data" tab

On the client, this.client.onSegmentChange callback is called with a segment
that's a nested JSON object
segment.isFinal => true
segment.intent.intent => "relative_move"
segment.entities[0].type => "a_number"
segment.entities[0].value => "36" note: this is NOT a number, its the string digits of the number.



*/

//import { BrowserClient, BrowserMicrophone, Segment } from '@speechly/browser-client' //from Talk example but Segment is non-existent export
import { BrowserClient, BrowserMicrophone} from '@speechly/browser-client'
globalThis.BrowserClient = BrowserClient
// Create a new client.
// NOTE: Configure and get your appId from https://api.speechly.com/dashboard
// NOTE: Set vad.enable to true for hands free use

class Talk {
    static speech_reco_possible //true or false
    static client
    static microphone
    static sw_index
    static mode = "not_initialied"

    static enable_speaker
    static speak_volume
    static speak_volume

    static is_vad_enabled
    static is_recording  //true or false
    static recording_name_now_playing //string

    static step_distance  //float in meters
    static is_moving      //true or false
    static current_command //initially null, then when moving: "down", up, left, right, farther, closer, reverse, forward
    static last_reverse_forward_index  //int
    static forward_limit_index //int
    static last_move_command // a string

    //does not init speechly. We wait until the user turns the mic on, (initially off)
    // then, if speechly hasn't been inited yet, it will be, then it turns on the mic.
    static initialize(speech_reco_possible=true){
        this.speech_reco_possible = speech_reco_possible
        this.sw_index       = null
        this.mode           = "not_initialied"
        this.enable_speaker = false
        this.speak_volume   = 0.5
        this.is_vad_enabled = false //can't find a way to determine this from Speechly
        this.is_recording   = false
        this.recording_name_now_playing = null

        this.step_distance  = 0.005
        this.is_moving      = false
        this.current_command = null
        this.last_reverse_forward_index = null
        this.forward_limit_index         = null
        this.last_move_command           = null

        new Job ({name: "talk_to_dexter",
            robot: Brain.brain0,
            when_do_list_done: "wait",
            do_list: [
            ]
        }).start()
        setTimeout(Talk.display_ui, 1000) //give chance for the above init to work,
        //before showing UI that the user can interact with since
        //if they try speaking before the above init, it will fail.
    }

    static async init_speechly(){
        if(this.speech_reco_possible) {
            try {
                this.client = new BrowserClient({
                    appId: '2357493e-4713-4d54-a041-a792f4952a62',
                    vad: {enabled: true, //enables voice activated detection, no need to use stop and start except to pause
                          noiseGateDb: -24.0} // https://github.com/speechly/speechly/blob/main/libraries/browser-client/docs/interfaces/client.VadOptions.md#enabled
                })
                this.is_vad_enabled = true
                this.microphone = new BrowserMicrophone()
                // React to the updates from the API.
                this.client.onSegmentChange((segment) => {
                    console.log('Received new segment:', segment
                        // segment.intent,
                        // segment.entities,
                        // segment.words,
                        // segment.isFinal
                    ) //the duration between getting a non-final "stop" and a final "go" is
                    // 20ms??? and undetetable by me (the dur for both is about 500ms)
                    //so might as well not do special processing and send "stop" thru the regular pipeline
                    /*if((segment.words.length === 1) &&
                        segment.words[0] &&
                        (segment.words[0].value === "stop")){
                        console.log('Received non_final segment of: stop')
                        Talk.stop()
                    }
                    else*/
                    if (segment.isFinal) {
                        console.log('Received final segment of: ' + this.segment_to_text(segment))
                        Talk.handle_command(segment)
                    }
                })
                // Initialize the microphone - this will ask the user for microphone permissions
// and establish the connection to Talk API.
// Make sure you call `initialize` from a user action handler
// (e.g. from a button press handler).
                await this.microphone.initialize()

// bind the microphone to the client
                await this.client.attach(this.microphone.mediaStream)// Initialize the microphone - this will ask the user for microphone permissions
                //this.client.start() //done only in turn_on_mic
            }
            catch(err){
                warning("Sorry, can't connect to internet-based speech recognition.<br/>" +
                         "Check your connectivity.<br/>" +
                         err.message)
                this.speech_reco_possible = false
            }
        }
    }

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

    static display_ui(){
        this.sw_index =
        show_window({title: "<b>Talk to Dexter</b>: &nbsp; <i>valid commands</i>",
            x: 200, y:7, width: 550, height: 500,
            content: `<ul id='valid_commands_id' style="font-size:22px;"></ul>
                      <fieldset><legend><i>Status</i></legend>
                            <div id="status_id"></div>
                      </field_set>
                      <div id="talk_out_id" style="background-color:white;font-size:20px;padding:10px;"></div>`,
            callback: "Talk.sw_callback"
        })
        setTimeout(function() { Talk.set_mode("listening") }, //need "Talk" here, not "this"
            200)
        Talk.talk_out(Talk.say_or_click() + " on a valid command.")
    }

    static sw_callback(vals){
        out(vals)
        let but_val = vals.clicked_button_value
        if(but_val === "close_button") {
            Talk.off()
            return
        }
        else {
            let meth = Talk.cmd_method(but_val) //Talk.prose_name_to_method(but_val)
            if (meth) {
                meth.call(Talk)
            } else {
                out("show_window click has no action.")
            }
        }
    }

    static set_mode(mode, message){
        Talk.mode = mode //must use "Talk", not "this" due to setTimeout call
        Talk.display_status(message)
    }

    //shows status including valid cmds
    //not passing in a message displays the default message.
    static display_status(message){
        //out("top of display_status")
        if(globalThis.status_id) { //show_window is shown
            let status_html =
                "<i>Mode: </i><b>"          + Talk.mode + (Talk.recording_name_now_playing ?  " " + Talk.recording_name_now_playing : "") + "</b> &nbsp;" +
                "<i>Step distance: </i><b>" + Talk.step_distance               + "</b> &nbsp;" +
                "<i>Mic: </i><b>"           + (this.is_mic_on() ?    "on" : "off") + "</b> &nbsp;" +
                "<i>Speaker: </i><b>"       + (this.enable_speaker ? "on" : "off") + "</b> &nbsp;" +
                "<i>Recording: </i><b>"     + (this.is_recording ?   "on" : "off") + "</b> &nbsp;"

            status_id.innerHTML = status_html
            this.set_display_status_color()
            let valid_cmds_html_fn_name
            valid_cmds_html_fn_name = "show_" + Talk.mode + "_mode_commands"
            //out("display_status valid_cmds_html_fn_name: " + valid_cmds_html_fn_name)
            let meth = Talk[valid_cmds_html_fn_name]
            //out("display_status meth: " + meth)
            meth.call(Talk) //show valid cmds
            //if(!message) {
            //    message = Talk.say_or_click() + " on a valid command."
            //}
            //Talk.talk_out(message)
            if(message){
                Talk.talk_out(message)
            }
        }
    }

    static set_display_status_color() {
        let color = (this.is_moving ? rgb(100, 255, 100) : "white")
        status_id.style["background-color"] = color
    }

 //_______command Utilties_______

    //cmds is a list of a list of methods  without their subject, lower-case, with underscores
    static make_command_list_items(...cmds){
        let result = ""
        for(let cmd_arr of cmds){
            if(!cmd_arr ) { continue }
            result += "<li style='height:30px;'>"
            for(let cmd of cmd_arr) {
                if(!cmd ) { continue }
                if ((cmd_arr.length > 1) && (cmd !== cmd_arr[0])) { //put comma before every non-first elt
                    result += ", &nbsp;"
                }
                let li_body_html
                let display_prose = this.cmd_display_prose(cmd) //upoper case first letter, spaces between words
                let norm = this.cmd_normalized_prose(cmd)
                if(norm.length > 0){ //meth could be null as in case of (recording name) in which case we
                    let click_source = "Talk.handle_command('" + norm + "')"
                    let color = ((norm === 'stop recording')? ' style="background-color:rgb(255, 180, 180);" ' : "") //see show_listening_mode_commands for whether Stop recording is even in the list.
                    li_body_html = '<a class="simple_cmd" href="#" ' + color + ' onclick="' + click_source + '">' + display_prose + '</a>'
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

    static word_replacements = {
        "poor": "pour" //as in "poor water
    }

    static cmd_table = [
        //cmd_normalized_prose,    cmd_display_prose,          cmd_method_name,    can_be_in_   alternatives..
        //aka utterance from reco                              aka recording_name, recording,
        ["dexter off",             "Dexter, off",              "off",              false],

        ["turn on mic",            "Turn on mic",              "turn_on_mic",      true, "turn on mike",  "turn on microphone"],
        ["turn off mic",           "Turn off mic",             "turn_off_mic",     true, "turn off mike", "turn off microphone"],

        ["turn on speaker",        "Turn on speaker",          "turn_on_speaker",  true],
        ["turn off speaker",       "Turn off speaker",         "turn_off_speaker", true],

        ["print",                  "Print (take a note)",      "print",            true],
        ["say selection",          "Say selection",            "say_selection",    true],
        ["define saying",          "Define saying",            "define_saying",    true],

        ["define position",        "Define position",          "define_position",  false, "defined position", "dine position"],
        ["start recording",        "Start recording",          "start_recording",  false, "started recording"],
        ["stop recording",         "Stop recording",           "stop_recording",   false],
        ["play recording",         "Play Recording (name)",    "play_recording",   true],
        ["stop playing",           "Stop playing",             "stop_playing",     true],
        ["list recordings",        "List recordings",          "list_recordings",  true],

        ["stop",                   "Stop",                     "stop",             true],
        ["straight up",            "Straight up",              "straight_up",      true],
        ["down",                   "Down",                     "down",             true],
        ["up",                     "Up",                       "up",               true],
        ["left",                   "Left",                     "left",             true],
        ["right",                  "Right",                    "right",            true],
        ["closer",                 "Closer",                   "closer",           true],
        ["farther",                "Farther",                  "farther",          true,  "further"],
        ["reverse",                "Reverse",                  "reverse",          true],
        ["forward",                "Forward",                  "forward",          true,  "foreword"],
        ["faster",                 "Faster",                   "faster",           true],
        ["slower",                 "Slower",                   "slower",           true]
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

//called at top of handle_command. all ower case, spaces between words
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
        if(meth_name) { return Talk[meth_name] }
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

//______Show mode commands__________

    static show_listening_mode_commands() {
        let mic_cmd = []
        if(this.speech_reco_possible){
          mic_cmd.push((this.is_mic_on() ? "Turn off mic" : "Turn on mic"))
        }
        mic_cmd.push((this.is_speaker_on()? "Turn off speaker" : "Turn on speaker"))
        let arr = [["Dexter, off"],
                   mic_cmd,
                   ["Print", "Say selection"],
                   ["Define saying", "Define position", (this.is_recording ? "Stop recording" : "Start recording")],
                   ["List recordings", "Play recording (name)"],
                   ["Straight up", "move"]
                  ]
        let items = this.make_command_list_items(...arr)
        valid_commands_id.innerHTML = items
    }

    static show_move_mode_commands(){
        let arr =  [ //even if not moving, we need this to get back to listening mode
                    ["Up",       "Down"],
                    ["Left",     "Right"],
                    ["Closer",   "Farther"],
                    ["Forward",  "Reverse"],
                    ["Faster",   "Slower"],
                    ["stop"]
                  ]
        let items = this.make_command_list_items(...arr)
        valid_commands_id.innerHTML = items
    }

    //from: https://stackoverflow.com/questions/822452/strip-html-from-text-javascript
    static strip_html(str){
        str=str.replace(/<\s*br\/*>/gi, "\n");
        str=str.replace(/<\s*a.*href="(.*?)".*>(.*?)<\/a>/gi, " $2 (Link->$1) ");
        str=str.replace(/<\s*\/*.+?>/ig, "\n");
        str=str.replace(/ {2,}/gi, " ");
        str=str.replace(/\n+\s*/gi, "\n\n");
        return str
    }
    static talk_out(html){
        if(globalThis.talk_out_id) {
            talk_out_id.innerHTML = html
            if (this.enable_speaker) {
                // but having problems turning it back on.
                //this.microphone.close()
                if(this.speech_reco_possible && this.is_mic_on()) {
                    //this.client.stop()
                    this.is_vad_enabled = false
                    Talk.client.adjustAudioProcessor( { vad: { enabled: false }})
                }
                let str = this.strip_html(html)
                speak({
                    speak_data: str, volume:
                    this.speak_volume,
                    callback: function () {
                        if(this.speech_reco_possible && !this.is_mic_on()) {
                            //Talk.client.start()
                            this.is_vad_enabled = true
                            this.client.adjustAudioProcessor( { vad: { enabled: true }})
                        }
                    }
                })
                //setTimeout(this.speak_and_restart(html), 1000)
            }
        }
        else { out(html) }
    }

    static say_or_click(){
        return (this.is_mic_on()? "Say or click" : "Click")
    }

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

//_______Start of Command Implementations________
    //if called with "dexter off" or NO arg, it should still work
    static off(full_text="dexter off"){
        if(full_text === "dexter off") {
            this.set_mode("listening")
            SW.close_window(Talk.sw_index)

            if (Job.talk_to_dexter) {
                Job.talk_to_dexter.when_do_list_done = "run_when_stopped"
                //change from "wait" so that stop_for_reason will stop the job.
                Job.talk_to_dexter.stop_for_reason("completed", "user stopped job")
                Job.talk_to_dexter.undefine_job()
            }
            //put the above before the below because the below try doesn't catch a broken websocket error
            try {
                if (this.client) {
                    this.is_vad_enabled = false
                    Talk.client.adjustAudioProcessor( { vad: { enabled: false }}) //this.client.stop()
                }
                if (this.microphone) {
                    this.microphone.close()
                }
            }
            catch (err) { } //ignore the errors if the websocket is busted.
            return "valid"
        }
        else { return "invalid"}
    }

    static is_mic_on(){
        //if(!this.client || !this.client.active) { return false }
        //else { return this.client.isActive() }
        return (this.client && (this.is_vad_enabled === true))
    }

    static turn_on_mic(full_text="turn on mic"){
        if (full_text === "turn on mic"){
            if(!this.client || !this.client.active) {
                 this.init_speechly()
                 setTimeout(Talk.turn_on_mic_aux, 2000)
            }
            else {
                Talk.turn_on_mic_aux()
            }
            return "valid"
        }
        else { return "invalid"}
    }

    static turn_on_mic_aux() {
        //Talk.client.start() //don't need this with below call to AdjustAudioProcessor(true)
        //Talk.client.AdjustAudioProcessor(true) //see https://speechly.github.io/speechly-unity-dotnet/api/Speechly.SLUClient.SpeechlyClient.html#Speechly_SLUClient_SpeechlyClient_OnSegmentChange
        //this turns on VAD ( automatic Voice Activity Detection)
        Talk.is_vad_enabled = true
        Talk.client.adjustAudioProcessor( { vad: { enabled: true }})
        Talk.display_status()
        Talk.talk_out("The microphone is now on.")
    }

    static turn_off_mic(full_text="turn off mic"){
        if (full_text === "turn off mic"){
            if(this.client) {
                //this.client.stop()
                this.is_vad_enabled = false
                Talk.client.adjustAudioProcessor( { vad: { enabled: false }})
            }
            this.display_status()
            Talk.talk_out("The microphone is now off.")
            return "valid"
        }
        else { return "invalid"}
    }

    static is_speaker_on(){
        return this.enable_speaker
    }

    static turn_on_speaker(full_text = "turn on speaker") {
        if (full_text === "turn on speaker") {
            this.enable_speaker = true
            this.display_status()
            this.talk_out("The speaker is now on.")
            return "valid"
        } else {
            return "invalid"
        }
    }

    static turn_off_speaker(full_text = "turn off speaker"){
        if(full_text === "turn off speaker"){
            this.enable_speaker = false
            this.display_status()
            this.talk_out(this.say_or_click() + ' "Turn on Speaker" to start Dexter talking.')
            return "valid"
        }
        else { return "invalid"}
    }

    static print(full_text="print"){
        if(full_text.startsWith("print ")){
            let mess = full_text.substring(6)
            if(mess.length > 0){
                Editor.insert(mess + "\n")
                Talk.talk_out("Printing into the editor.")
            }
            return "valid"
        }
        else if(full_text === "print"){
            this.talk_out("Type in text to print and hit Enter: " +
                "<input id='print_text_id'  onkeyup='Talk.print_from_type_in(event)'/>"
            )
            setTimeout(function(){
                if(globalThis.print_text_id){ //just in case a speechly_out erases the recording_name input
                    print_text_id.focus() }
            }, 200)
            return "valid"
        }
        else {
            return "invalid"
        }
    }

    static print_from_type_in(event){
        if(event.key === "Enter") {
            let text = event.target.value
            if(text && (text.length > 0)) {
                Editor.insert(text + "\n")
            }
            Talk.talk_out(Talk.say_or_click() + " a valid command.")
        }
    }

    static say_selection(full_text="say selection"){
        if(full_text === "say selection"){
            let sel = Editor.get_javascript(true)
            if(sel.length === 0) {
                Talk.talk_out("There is no selection.<br/>Drag the mouse over some text and try again.")
            }
            else {
                speak({speak_data: sel})
            }
            return "valid"
        }
        else {
            return "invalid"
        }
    }

    static define_saying(full_text="define saying", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter) {
        if (Utils.starts_with_one_of(full_text,
                ["define saying", "defined saying", "dine saying"])) {
            let first_space_index = full_text.indexOf(" ")
            let second_space_index = full_text.indexOf(" ", first_space_index + 1)
            if(second_space_index === -1) {
                Talk.saying_being_defined = ""
            }
            else {
                Talk.saying_being_defined = full_text.substring(second_space_index + 1).trim() //can handle both define and defined.
            }
            if(Talk.saying_being_defined.length === 0){
                Talk.saying_being_defined = Editor.get_javascript(true)
            }
            if (Talk.saying_being_defined.length > 0) {
                this.set_mode("waiting_for_saying_name")
                this.talk_out("Say or type in a name for the saying and hit Enter: " +
                    "<input id='saying_name_id'  onkeyup='Talk.saying_name_from_type_in(event)'/>"
                )
                setTimeout(function () {
                    if (globalThis.saying_name_id) { //just in case a speechly_out erases the recording_name input
                        saying_name_id.focus()
                    }
                }, 200)
            } else {
                Talk.talk_out('You must say something after "define saying" or have selected text to define a saying.')
            }
            return "valid"
        } else {
            return "invalid"
        }
    }

    static saying_name_from_type_in(event){
        if(event.key === "Enter") {
            let saying_name = event.target.value
            if(saying_name && (saying_name.length > 0)) {
                Talk.define_saying_name(saying_name)
            }
        }
    }

    //just move the robot to the named position
    //having a whole job is kinda overkill, but fits in well with recordings.
    //instrs are actual dde job instruction instances
    static define_saying_name(saying_name, saying=Talk.saying_being_defined) {
        if(Talk.is_known_cmd(saying_name)) { //we want to exclude known recording names
            Talk.set_mode("listening")
            Talk.talk_out('"' + saying_name + '" is a command, so it can&apos;t be used to name a saying.')
            return "valid"
        }
        else {
            Talk.set_mode("listening")
            Talk.talk_out('The saying ' + saying_name + " has been defined.")
            new Job({
                name: saying_name,
                do_list:
                    [function () {
                        //speak({speak_data: saying})
                        out(saying)
                        Talk.talk_out(saying)
                    }]
            })
            return "valid"
        }
    }

//_______RECORDING_________

    //names are lower cased and have underscores. Just a straight array, not nested.
    static array_of_recording_names(){
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

    static is_recording = false

    static start_recording(full_text="start recording"){
        if((full_text === "start recording") && !this.is_recording){
           //this.set_mode("now_recording")
           Talk.is_recording = true
           this.the_recording_in_progress = [] //clear out the previous recording
           this.talk_out("Now recording.<br/>" + this.say_or_click() + " on commands, pausing between each.")
           this.show_listening_mode_commands() //needs to replace "Start recording" with "Stop recording"
           this.display_status() //needs to update "Recording" status
           return "valid"
        }
        else { return "invalid"}
    }
    /*obsolete
    static record_this_command(full_text){
        if(this.can_be_in_recording(full_text)) {
            this.the_recording_in_progress.push(full_text)
            this.handle_command(full_text, true) //true means play it even though the mode is "now_recording"
            let cmd_number = this.the_recording_in_progress.length
            this.talk_out("Recorded command #" + cmd_number + ": " + full_text + "." +
                                   '<br/>' + this.say_or_click() + ' another command or "Stop recording".')
            return "valid"
        }
        else {
            this.talk_out('"' + full_text + '" can&apos;t be in a recording, so it has been ignored.')
            return "valid"
        }
    }*/

    static show_waiting_for_recording_name_mode_commands(){
        let items = this.make_command_list_items( ["(the name for this recording)"],
                                                        ["Listen for other commands (don't name recording)"]
                                                        )
        valid_commands_id.innerHTML = items
    }

    static show_waiting_for_saying_name_mode_commands(){
        let items = this.make_command_list_items( ["(the name for this saying)"],
            ["Listen for other commands (don't name saying)"]
        )
        valid_commands_id.innerHTML = items
    }

    static stop_recording(full_text="stop recording"){
        if((full_text === "stop recording") && this.is_recording){
            this.set_mode("waiting_for_recording_name")
            this.talk_out("Say the name of your recording or<br/>" +
                                    "type it in and hit Enter: " +
                                    "<input id='recording_name_id'  onkeyup='Talk.define_recording_from_type_in(event)'/>"
            )
            Talk.is_recording = false
            setTimeout(function(){
                if(globalThis.recording_name_id){ //just in case a speechly_out erases the recording_name input
                    recording_name_id.focus() }
                }, 200)
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
            this.talk_out('"' + full_text + '" is a command, so it can&apos;t be used to name a recording.')
            return "invalid"
        }

        if(this.is_recording_name(recording_name)) {
            this.talk_out('"' + full_text + '" has been over-written with your new recording.')
        }
        else {
            this.talk_out('"' + full_text + '" is now a brand new recording.')
        }
        this.define_job(recording_name, this.the_recording_in_progress)
        this.set_mode("listening")
        return "valid"
    }

    static define_recording_from_type_in(event){
        if(event.key === "Enter") {
            let rec_name = event.target.value
            if(rec_name && (rec_name.length > 0)) {
                Talk.define_recording(rec_name)
            }
        }
    }

    //instruction_strings example: ["down", "straight up"], ie cmd_normalized_prose
    static define_job(job_name, xyz_arrays){
        let do_list = []
        for(let xyz of xyz_arrays){
            do_list.push(Dexter.move_to(xyz))
            do_list.push(Dexter.empty_instruction_queue()) //so that when we issue a stop cmd, there will be no queue so it will stop quickly.
        }
        new Job({name: job_name,
                 do_list: do_list})
        return Job[job_name]
    }

    //_____define position_______
    static define_position(full_text="define position", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(Utils.starts_with_one_of(full_text,
              ["define position", "defined position", "dine position"])){
            let first_space_index  = full_text.indexOf(" ")
            let second_space_index = full_text.indexOf(" ", first_space_index + 1)
            let name_maybe = ""
            if(second_space_index === -1) {
                name_maybe = ""
            }
            else {
                name_maybe = full_text.substring(second_space_index + 1).trim() //can handle both define and defined.
            }
            let dex = this.dexter_for_job(the_job)
            if (name_maybe.length > 0){
                full_text = this.clean_full_text(full_text)
                let recording_name = this.string_to_method_name(name_maybe)

                if(this.is_known_cmd(recording_name)) { //we want to exclude known recording names
                    this.talk_out('"' + full_text + '" is a command, so it can&apos;t be used to name a position.')
                    return "valid"
                }
                else {
                    if(!dex.rs) {
                        Talk.talk_out("To name a Dexter position, you have to move Dexter first.")
                        return "valid"
                    }
                    if(this.is_recording_name(recording_name)) {
                        this.talk_out('"' + recording_name + '" has been over-written with your new position.')
                    }
                    else {
                        this.talk_out('"' + recording_name + '" is now a named position.')
                    }
                    //if (this.initialize_dexter_maybe(full_text, playing_a_recording_cmd, the_job)) {
                    //    return "valid"  //even if its not really valid, validate anyway. If full_text isn't valid,
                        //it will get caught by the handle_command in the setTimeout fn
                    //}
                    let angles = dex.rs.measured_angles()
                    let instrs = [dex.move_all_joints(angles), dex.empty_instruction_queue()]
                    this.define_name_position(recording_name, instrs)
                    this.set_mode("listening")
                    return "valid"
                }
            }
            else if(!dex.rs) {
                Talk.talk_out("To name a Dexter position, you have to move Dexter first.")
                return "valid"
            }
            else {
                this.talk_out("Say the name of your recording or<br/>" +
                    "type it in and hit Enter: " +
                    "<input id='recording_name_id'  onkeyup='Talk.define_position_from_type_in(event)'/>"
                )
                setTimeout(function(){
                       if(globalThis.recording_name_id){ //just in case this goes away from some other speechly_out.
                           recording_name_id.focus()
                       }}, 200)
                return "valid"
            }
        }
        else { return "invalid"}
    }

    static define_position_from_type_in(event){
        if(event.key === "Enter") {
            let rec_name = event.target.value
            if(rec_name && (rec_name.length > 0)) {
                Talk.define_position("define position "  + rec_name) //should pass in Job here but that's hard.
            }
        }
    }

    //just move the robot to the named position
    //having a whole job is kinda overkill, but fits in well with recordings.
    //instrs are actual dde job instruction instances
    static define_name_position(job_name, instrs){
        return new Job({name: job_name, do_list: instrs})
    }

    //not now used but maybe needed in the future
    static listen_for_other_commands(full_text="listen for other commands"){
        if(full_text === "listen for other commands"){
            this.set_mode("listening")
            Talk.talk_out(this.say_or_click() + " on a valid command.")
            return "valid"
        }
        else { return "invalid" }
    }

    static list_recordings(full_text="list recordings"){
        if(["list recordings", "liszt recordings"].includes(full_text)) {
            let job_names = this.array_of_recording_names()
            if (job_names.length === 0){
                this.talk_out('There are no recordings.<br/>Use "Start recording" to make one.')
            }
            else {
                let arr_of_arrs = [["listen for other commands"]]
                for(let job_name of job_names){
                    job_name = job_name.replaceAll("_", " ")
                    arr_of_arrs.push([job_name, "Edit " + job_name])
                }
                let items = this.make_command_list_items(...arr_of_arrs)
                valid_commands_id.innerHTML = items
                this.talk_out(this.say_or_click() + ' the name of a recording to play it.')
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
                Talk.talk_out(job_name + " is not the name of a recording.")
                return "valid"
            }
            else {
                let job_src = to_source_code({value: the_job, job_orig_args: true})
                Editor.insert("\n" + job_src, "end")
                Talk.talk_out('The definition for "' + job_name + '" has been appended to the editor buffer.')
                return "valid"
            }
        }
    }

    static show_playing_recording_mode_commands(){
        let items = this.make_command_list_items(["Stop playing"],
                                                       ["Dexter, stop listening", "Dexter, off"])
            valid_commands_id.innerHTML = items
    }

    static recording_name_now_playing = null

    static play_recording(full_text="play recording"){
        let trimmed_text
        if (full_text === "play recording") {
            if (this.array_of_recording_names().length === 0) {
                this.talk_out('There are no recordings to play.<br/>' + this.say_or_click() + ' on "Start recording"" to make one.')
                return "valid"
            } else {
                this.list_recordings()
                this.talk_out(this.say_or_click() + ' on the name of a recording to play it.')
                return "valid"
            }
        } else if (full_text.startsWith("play recording ")) {
            trimmed_text = full_text.substring("play recording ".length).trim()
        } else {
            trimmed_text = full_text
        }
        trimmed_text = this.clean_full_text(trimmed_text)
        let recording_name = this.string_to_method_name(trimmed_text)
        let the_job = Job[recording_name]
        if(the_job) {
            the_job.start()
            this.recording_name_now_playing = recording_name //do before set_mode
            this.set_mode("playing_recording")
            this.talk_out("Now playing recording: " + recording_name)
            setTimeout(function(){ Talk.finished_playing_maybe(recording_name)},
                        500)
            return "valid"
       }
       else {
            return "invalid" //not "invalid" because we know the full_text starts with "play recording"
       }
    }

    static finished_playing_maybe(recording_name) {
        //out("top of finished_playing_maybe with: " + recording_name + " mode: " + Talk.mode)
        let the_job = Job[recording_name]
        if (the_job.is_active()) { //job is still active (playing) so keep checking to see if its quit by being completed
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

    static stop_playing(full_text="stop playing"){
        if(["stop playing"].includes(full_text)){
            let rec_name = Talk.recording_name_now_playing
            let the_job = Job[rec_name]
            Talk.recording_name_now_playing = null
            if (the_job.is_active()) {
                the_job.stop_for_reason("interrupted", 'User said "stop playing".')
            }
            Talk.set_mode("listening")
            Talk.talk_out("Finished playing: " + rec_name + ", with status: " +  the_job.status_code + ".")
            return "valid"
        }
        else { return "invalid" }
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

    static current_or_straight_up_angles(the_job=Job.talk_to_dexter){
        let dex = this.dexter_for_job(the_job)
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
    //whose first 5 elts are 0 except the 2nd elt is Number.EPSLION
    //and any additional elts are the same as their corresponding ones in angle_array
    //Returned is an array of arrays.
    static fix_xyz(xyz){
        let angle_array = Kin.xyz_to_J_angles(xyz) //will get out_of_range error with initial angles
        //beware, might error with "out of range.
        let new_angle_array = this.fix_home_angles_maybe(angle_array)
        let new_xyz_extra = Kin.J_angles_to_xyz(new_angle_array)
        return new_xyz_extra //arr of array of numbers
    }

    static word_to_axis_index_and_direction(word=Talk.current_command){
        //x
        if      (word == "left")  { return [0, 1]}

        else if (word == "right") { return [0, -1]}
        //y
        else if(["farther", "further", ].includes(word)) { return [1, 1]}
        else if(["closer", "nearer"].includes(word)) {
            return [1, -1]}

        //z
        else if(word == "up")    { return [2, 1]}
        else if(word == "down")  { return [2, -1]}
        else { return false} //not a valid word
    }

    static axis_index_and_direction_to_word(axis_index = Talk.axis_index, axis_direction=Talk.axis_direction){
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

    static set_step_distance(dist){
        this.step_distance = dist
        this.display_status()
    }

    static stop(full_text="stop"){
        if(full_text === "stop"){
            Talk.stop_aux()
            return "valid"
        }
        else { return "invalid" }
    }

    //called from both stop and as a job instruction, where we DON'T want it to return
    //anything, including "valid" as that will be interpreted by a job as an instruction
    static stop_aux(message){
        Talk.is_moving = false
        //Talk.set_display_status_color()
        Talk.set_mode("listening", message)
        for(let job_inst of Job.active_jobs()){
            if(job_inst.name !== "talk_to_dexter"){
                job_inst.stop_for_reason("interrupted", "user said stop")
            }
        }
    }

    static move(full_text){
        if(full_text === "move"){
            this.set_mode("move")
            this.talk_out(this.say_or_click() + " on a valid command.")
            return "valid"
        }
        else {
            return "invalid"
        }
    }

    //called as a fn on do_list of talk_to_dexter just before Control.loop for move_incrementally
    //don't return a value
    static start_moving_aux(){
        Talk.is_moving = true
        Talk.set_display_status_color()
    }

    static straight_up(full_text = "straight up", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text === "straight up") {
            this.set_display_status_color()
            let dex = this.dexter_for_job(the_job)
            this.send_instruction_to_dexter([Talk.start_moving_aux,
                    dex.move_all_joints(this.straight_up_angles()),
                    dex.empty_instruction_queue(),
                    Talk.stop_aux, //changes status color back to white
                    function(){
                        Talk.talk_out("Dexter is straight up.")
                    }],
                the_job)

            Talk.talk_out("Dexter is moving straight up.")
            return "valid"
        }
        else { return "invalid"}
    }

    static left(full_text="left", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text === "left") {
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static right(full_text="right", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text === "right") {
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static farther(full_text="farther", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text === "farther") {
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static closer(full_text="closer", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text === "closer") {
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static up(full_text="up", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text === "up") {
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static down(full_text="down", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        if(full_text === "down") {
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static send_init_and_control(the_job){
        if(this.is_moving){} //if we're moving, its been initialized and the control loop is running, so nothing to do
        else {
            this.send_instruction_to_dexter(
                function () { //initialize to straight_up maybe
                    let cmds = [Talk.start_moving_aux]
                    let dex = Talk.dexter_for_job(the_job)
                    if (!dex.rs) {
                        cmds.push(function () {
                            Talk.talk_out("Initializing Dexter to straight up.")
                        })
                        cmds.push(dex.move_all_joints(Talk.straight_up_angles()))
                        cmds.push(dex.empty_instruction_queue())
                        cmds.push(function () {
                            Talk.talk_out("Dexter is straight up.")
                        })
                    }
                    if (!Talk.is_moving) {
                        cmds.push(Control.loop(function () {
                                return Talk.is_moving
                            },
                            Talk.move_incrementally))
                        //cmds.push(function () {
                        //    Talk.talk_out(Talk.say_or_click() + ' on a valid command.')
                        //})
                    }
                    return cmds
                }, //end big send fn
                the_job
            ) //end send_instruction_to_dexter
        }
    }

    static send_instruction_to_dexter(instruction, the_job) {
        the_job.insert_single_instruction(instruction, false)
    }

    //moves dester straight up if we don't know hwere it is, and then
    //calls the next_full_text
    //returns true if it has to do the init, and false if its already good to go.
    //called by move_incrementally and define_position
    static initialize_dexter_maybe(next_full_text, playing_a_recording_cmd, the_job){
        let dex = this.dexter_for_job(the_job)
        if (dex.rs) { return false} //does not need to be initialized so the caller can keep going
        else {
            this.handle_command("straight_up", playing_a_recording_cmd, the_job)
            Talk.talk_out("Initializing Dexter to straight up position.")
            // setTimeout(function () {
            //     Talk.handle_command(next_full_text, playing_a_recording_cmd, the_job)
            // }, 5000) //beware, possible infinite loop if straight_up fails to set the_job.robot.rs
            return true
        }
    }

    static initialize_dexter_in_job_maybe(the_job){
        let dex = this.dexter_for_job(the_job)
        if (dex.rs) { return null} //does not need to be initialized so the caller can keep going
        else {
            //Talk.talk_out("Initializing Dexter to straight up position.")
            // setTimeout(function () {
            //     Talk.handle_command(next_full_text, playing_a_recording_cmd, the_job)
            // }, 5000) //beware, possible infinite loop if straight_up fails to set the_job.robot.rs
            return true
        }
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
            out("out of reach angles: " + angles)
            return false
        }
        //out("in reach angles: " + angles)
        return true
    }

    //called in body of Control.loop running in Job.
    static move_incrementally() {
        //out("top of move_incrementally, is_moving: " + Talk.is_moving + " cmd: " + Talk.current_command)
        if (!Talk.is_moving) {
            return Control.break()
        }
        if (Talk.current_command !== Talk.last_move_command){
            Talk.talk_out("Moving Dexter " + Talk.current_command)
            Talk.last_move_command = Talk.current_command
        }
        let the_job = this
        let dex = Talk.dexter_for_job(the_job) //this is the job running the move_to instruction

        if((Talk.current_command === "forward") || (Talk.current_command === "reverse")) {
           let inst
           if (Talk.current_command === "reverse") {
               inst = Talk.compute_reverse_instruction(the_job)
           }
           else { inst = Talk.compute_forward_instruction(the_job) }

           if(inst === null) {
                Talk.stop_aux()
                return Control.break()
           }
           else {
                return [inst, // undefined, undefined, undefined, undefined, dex),
                        dex.empty_instruction_queue()]
           }
        }
        else { //regular move
            let [axis_index, axis_direction] = Talk.word_to_axis_index_and_direction(Talk.current_command)
            let ma = Talk.current_or_straight_up_angles(the_job)
            let orig_xyz = Kin.J_angles_to_xyz(ma)[0] //the_job.robot.rs.xyz()[0]

            let [new_x, new_y, new_z] = orig_xyz
            let new_xyz = [new_x, new_y, new_z]
            if (axis_index === 0) {  //x
                new_x = orig_xyz[axis_index] + (axis_direction * Talk.step_distance)
                new_xyz[0] = new_x
            } else if (axis_index === 1) {  //y
                new_y = orig_xyz[axis_index] + (axis_direction * Talk.step_distance)
                new_xyz[1] = new_y
                if (new_y < 0) {
                    Talk.talk_out("This installation of Dexter prevents Dexter from going behind itself: " + to_source_code(new_xyz))
                    Talk.stop_aux()
                    return Control.break()
                }
            } else if (axis_index === 2) {  //z
                new_z = orig_xyz[axis_index] + (axis_direction * Talk.step_distance)
                new_xyz[2] = new_z
                if (new_z < 0) {
                    Talk.talk_out("This installation of Dexter prevents Dexter from going below it base: " + to_source_code(new_xyz))
                    Talk.stop_aux()
                    return Control.break()
                }
            }

            //let orig_angles2 = Kin.xyz_to_J_angles(orig_xyz)
            if (Talk.is_in_reach(new_xyz, undefined, undefined, dex)) { //bug in Kin.is_in_reach so use my special one.
                if (Talk.is_recording) {
                    Talk.the_recording_in_progress.push(new_xyz)
                }
                //out("move_incrementally, in reach: " + new_xyz)
                return [dex.move_to(new_xyz), // undefined, undefined, undefined, undefined, dex),
                    dex.empty_instruction_queue()]
            } else {
                out("bottom of move_incrementally, out of reach: " + new_xyz)
                let mess = "Moving to xyz: <br/>" + to_source_code(new_xyz) + "<br/>is out of Dexter's reach."
                debugger;
                Talk.stop_aux(mess)
                return Control.break()
            }
        }
    }

    static reverse(full_text="reverse", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter) {
        if (full_text === "reverse") {
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        } else {
            return "invalid"
        }
    }

    static forward(full_text="forward", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter) {
        if (full_text === "forward") {
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        } else {
            return "invalid"
        }
    }

    static compute_reverse_instruction(the_job){
        let dex = this.dexter_for_job(the_job)
        let hist_arr   = the_job.rs_history
        if(this.last_reverse_forward_index === null) {
            this.last_reverse_forward_index = hist_arr.length - 1
            this.forward_limit_index = hist_arr.length - 1
        }  //skip past the latest one

        if(this.last_reverse_forward_index === 0){
            Talk.talk_out("There are no more commands to reverse to.")
            return null //get out of loop
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
            Talk.talk_out("There are no more commands to reverse to.")
            return null
        }
    }

    static compute_forward_instruction(the_job){
        let dex = this.dexter_for_job(the_job)
        let hist_arr   = the_job.rs_history
        if(this.last_reverse_forward_index === null) {
            this.last_reverse_forward_index = hist_arr.length - 1
            this.forward_limit_index = hist_arr.length - 1
        }  //skip past the latest one

        if(this.last_reverse_forward_index >= this.forward_limit_index){
            Talk.talk_out("There are no more commands to go forward to.")
            return null //get out of loop
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
            Talk.talk_out("There are no more commands to reverse to.")
            return null
        }
    }

    static faster(full_text="faster"){
        if(full_text === "faster"){
            this.set_step_distance(this.step_distance * 2)
            this.talk_out("Step distance has been increased to: " + this.step_distance + " meters.")
            return "valid"
        }
        else { return "invalid"}
    }

    static slower(full_text="slower"){
        if(full_text === "slower"){
            this.set_step_distance(this.step_distance / 2)
            this.talk_out("Step distance has been decreased to: " + this.step_distance + " meters.")
            return "valid"
        }
        else { return "invalid"}
    }

//______End move commands_______



//____________END OF CMD DEFS_________

    static handle_command(segment_or_full_text, playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        let full_text = segment_or_full_text
        if(typeof(full_text) !== "string"){
            full_text = this.segment_to_text(segment_or_full_text)
        }
        //out("Starting to handle: " + full_text)
        full_text = this.cmd_normalized_prose(full_text)
        //if(!["reverse", "forward", "stop"].includes(full_text)){
        //    this.last_reverse_forward_index = null //no longer in reverse-forward sequence
        //    this.forward_limit_index        = null
        //}
        let status
        //full_text is a valid normalized command
        //the "listening mode needs to be first, See the below comment on "initia;" mode.
        if((this.mode === "listening") || playing_a_recording_cmd) {

            status = this.listen_for_other_commands(full_text) //usuely not in listen valid comd display but is displayed hwen you run "list recordings"
            if(status === "valid") {return}

            status = this.off(full_text)
            if(status === "valid") {return}

            status = this.turn_on_mic(full_text)
            if(status === "valid") { return }

            status = this.turn_off_mic(full_text)
            if(status === "valid") { return }

            status = this.turn_on_speaker(full_text)
            if(status === "valid") { return } //speechly_out already called.

            status = this.turn_off_speaker(full_text)
            if(status === "valid") { return }

            status = this.print(full_text)
            if(status === "valid") { return }

            status = this.say_selection(full_text)
            if(status === "valid") { return }

            status = this.define_saying(full_text)
            if(status === "valid") { return }

            status = this.start_recording(full_text)
            if(status === "valid") { return }

            status = this.stop_recording(full_text)
            if(status === "valid") { return }

            status = this.straight_up(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") {return}

            status = this.define_position(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.list_recordings(full_text)
            if(status === "valid") { return }

            status = this.edit(full_text)
            if(status === "valid") { return }

            //this should be last because full_text can be a user made up name of recording.
            status = this.play_recording(full_text)
            if(status === "valid") { return }

            status = this.move(full_text)
            if(status === "valid") { return }

            this.talk_out("Unrecognized command: " + full_text + ".")
            return
        } //end of "listening" mode

        if(this.mode === "move") {
            status = this.stop(full_text)
            if(status === "valid") {return}

            status = this.down(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.up(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.left(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.right(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.farther(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.closer(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            //status = this.move_incrementally(full_text, playing_a_recording_cmd, the_job)
            //if(status === "valid") { return }

            status = this.reverse(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.forward(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.faster(full_text)
            if(status === "valid") { return }

            status = this.slower(full_text)
            if(status === "valid") { return }

            this.talk_out("Unrecognized command: " + full_text + ".")
            return
        }

        if(this.mode === "waiting_for_recording_name"){

            status = this.off(full_text)
            if(status === "valid") {return}

            status = this.listen_for_other_commands(full_text)
            if(status === "valid") {return}

            status = this.define_recording(full_text)
            if(status === "valid") { return }

            this.talk_out("Unrecognized command: " + full_text + ".")
            return
        }

        if(this.mode === "waiting_for_saying_name"){

            status = this.off(full_text)
            if(status === "valid") {return}

            status = this.listen_for_other_commands(full_text)
            if(status === "valid") {return}

            status = this.define_saying_name(full_text)
            if(status === "valid") { return }

            this.talk_out("Unrecognized command: " + full_text + ".")
            return
        }

        if(this.mode === "playing_recording"){

            status = this.off(full_text)
            if(status === "valid") { return }

            status = this.stop_playing(full_text)
            if(status === "valid") { return }

            this.talk_out("Unrecognized command: " + full_text + ".")
            return
        }

        this.talk_out("Unrecognized mode: " + this.mode + ".") //shouldn't ever happen
        return
    } //end of handle_command


} //end of Talk
globalThis.Talk = Talk

//with this, source code in a job's do_list can be: simple("down")
function simple(command){
    let a_simple_fn = function() {
        let the_job = this
        Talk.handle_command(command, true, the_job) //"true" is for playing a recording so I don't have to switch modes.
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