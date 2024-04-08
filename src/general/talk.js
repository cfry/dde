/*
How to Use OpenAI Whisper for speech recognition on MacOS in Node:
https://medium.com/codingthesmartway-com-blog/speech-to-text-use-node-js-and-openais-whisper-api-to-record-transcribe-in-one-step-c9a1fd441765
Needs OpenAI APIkey
//todo
   current bug: bring up dialog, click on Edit Job, enter xxx (non job name)
                see warning: Job not defined, click Edit Job
                and see that I DON'T get the type-in input in the dialog.
                BUT if I click on Edit Job a 2nd time, it works fine.
                It seems that at that first, failing click, the "Edit Job"
                text appears in teh dialog but click right on it, and
                no element is there. Rather chrom dev tools shows me the
                containing field_set as if there was no elt where I clicked.
   new cmd: Plot  point 2 3 point 4 5 point 6 7
             (starts new plot, shows the plot
            point 6 7  point 8 9   add points to the current plot
            erase point 7 8 erase point 4 5  and it erasese those points and redisplays
               the plot. Sort by x value?
               Maybe just auto insert js code into editor when showing its plot
               Allow: Plot name foo cmd
               Then user just sayng the nmae of the plot could bring it up.
               Way to hid a showing plot? (click its close box, but verbally?)
   new cmds:
        grab, release //close, open  (j7)// uses the value incremented by more, less.
           or perhaps better: narrower, wider and put it in down, etc loop to keep
           "narrowing" until user says "stop"/
           New servo instructions use "grasp", "ungrasp"
        pitch up, pitch down   uses the value incremented by more, less.
           can stick this into new "move until stop."
        yawl left, yawl right  uses the value incremented by more, less.
           rename clockwise, counterclockwise and "move until stop."
        roll left, roll right  uses the value incremented by more, less.
           new servo uses "twist"
        OR increase pitch, decrease pitch, same for yawl and role
        softer, louder and display status of volume next to Speaker: off
        initialize??? (stick in mode initial list of displayed cmds, but not elsewhere.)
        Convert from step_distance to degrees for pitch, yawl, roll and distance for j7 open.close
        In show_window, display state of:
          should I show, along with step_distance, the equiv step_degrees and step_gripper_distance?

        Start recording =>  define path
        Move => Move <i>aka</i> Show movement commands  (and have "Show movement commands" as an alternative)
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
              current position (print out joint angles and xyz, dir, etc.
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
   consider allowing "and" synonyms: " of ", " by " " to " (essentially commas in the fn call.
   string_or_alternatives_array defaults to the name of the fn,
   but lower case and replace underscores with spaces.
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

Fixing the 1011 error June 9, 2023:
To Reproduce by using talk app:
- from DDE Dexter menu, choose the talk item.
- click to turn on mic,
- say something.
See error with code 1011 in the chrome dev tools console.
To fix:
Browse https://api.speechly.com/dashboard
click on my app "voice app"
click on "voice_app" tile (my speechly app supporting my "talk" app.
click on "training data"
click in the text editor pain
make a trivial change like adding a new line
now the "deploy" button in the upper right lights up
click it
wait 6 minutes for it to compile and say its done.
Now use talk app
______
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
  ignores audio below a certain volume?

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
//import { BrowserClient, BrowserMicrophone} from '@speechly/browser-client'
//globalThis.BrowserClient = BrowserClient
// Create a new client.
// NOTE: Configure and get your appId from https://api.speechly.com/dashboard
// NOTE: Set vad.enable to true for hands free use

class Talk {
    static speech_reco_possible //true or false
    static client
    static microphone
    static sw_index
    static mode = "not_initialied"  //"main_menu" "move" "playing_recording" "waiting_for_saying_name" "waiting_for_position_name" "waiting_for_recording_name"

    static enable_speaker
    static speak_volume

    static listening
    static is_recording  //true or false
    static recording_name_now_playing //string

    static step_distance  //float in meters
    static is_moving      //true or false
    static current_command //initially null, then when moving: "down", up, left, right, farther, closer, reverse, forward
    static last_reverse_forward_index  //int
    static forward_limit_index //int
    static last_move_command // a string

    //we can call this more than once, and it brings down prev dialog, etc.
    //and re-initializes
    static initialize(speech_reco_possible=true){
        this.speech_reco_possible = speech_reco_possible
        this.sw_index       = null
        this.mode           = "not_initialied"
        this.enable_speaker = false
        this.speak_volume   = 0.5
        this.listening      = false //can't find a way to determine this from Speechly
        this.is_recording   = false
        this.recording_name_now_playing = null

        this.step_distance   = 0.005
        this.is_moving       = false
        this.current_command = null
        this.last_reverse_forward_index  = null
        this.forward_limit_index         = null
        this.last_move_command           = null
        if((Job.talk_to_dexter) && Job.talk_to_dexter.is_active()){
            Job.talk_to_dexter.stop_for_reason("interrupted",
                                               "re-initialization of Job.talk_to_dexter")
        }
        new Job ({name: "talk_to_dexter",
            robot: Brain.brain0,
            when_do_list_done: "wait",
            do_list: [
            ]
        }).start()
        this.init_speech_reco()
        setTimeout(Talk.display_ui, 1000) //give chance for the above init to work,
        //before showing UI that the user can interact with since
        //if they try speaking before the above init, it will fail.
    }

    static init_speech_reco(){
        if(!globalThis.SpeechRecognition) {
            globalThis.SpeechRecognition = globalThis.webkitSpeechRecognition ////only webkitSpeechRecognition is bound in chrome, against w3c spec.
        }
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = false;  //true doesn't seem to work, but in any case,
        // its documented to stop reco after a while anyway, so not really continuous.
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

        this.recognition.onresult = function(event) { //not called if onsoundstart called but no actual words
                                                 // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
                                                 // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
                                                 // It has a getter, so it can be accessed like an array
                                                 // The first [0] returns the SpeechRecognitionResult at the last position.
                                                 // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
                                                 // These also have getters so they can be accessed like arrays.
                                                 // The second [0] returns the SpeechRecognitionAlternative at position 0.
                                                 // We then return the transcript property of the SpeechRecognitionAlternative object
            Talk.turn_off_mic()
            let full_text = event.results[0][0].transcript
            console.log("got onresult of text: " + full_text)
            console.log('Confidence: ' + event.results[0][0].confidence);
            Talk.handle_command(full_text)
        }

        this.recognition.onspeechend = function() {
            console.log("got onspeechend")
            Talk.recognition.stop();
        }

         //called when recognition.abort() is called, which I often do.
        this.recognition.onerror = function(event) {
            Talk.turn_off_mic()
            console.log("got onerror of " + event.error) //"no-speech" after about 5 secs of quiet.// "network" immediately after click and no net connection
        }
    }

    /*static async init_speechly(){
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
                    // 20ms??? and undetectable by me (the dur for both is about 500ms)
                    //so might as well not do special processing and send "stop" through the regular pipeline
                    //if((segment.words.length === 1) &&
                    //    segment.words[0] &&
                    //    (segment.words[0].value === "stop")){
                    //    console.log('Received non_final segment of: stop')
                    //    Talk.stop()
                    //}
                    //else
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
    */

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
        //use Talk, not "this" in this method
        if(typeof(Talk.sw_index) === "number") {
            SW.close_window(Talk.sw_index) //note the html for the title is stripped
            Talk.sw_index = null
        }
        Talk.sw_index =
        show_window({title: "<b>Talk to Dexter</b>",
            x: 200, y:7, width: 570, height: 385,
            content: `<fieldset style="padding:2px;"><legend><i>Status</i></legend>
                            <div id="status_id"></div>
                            <div id="talk_out_id" style="background-color:white;font-size:20px;padding:10px;"></div>
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
                        //out("got space")
                        globalThis.stop_speaking()
                        Talk.stop_except_no_change_to_enable_speaker()
                        event.stopPropagation()
                        event.preventDefault()
                        setTimeout(function() { //needed because if there the mic is still on when the used hits space bar again,
                            //the call to this.recognition.start() inside turn_on_mic will error.
                            //Now we try to turn off the underlying mic in stop_except_no_change_to_enable_speaker but
                            //apparently this doesn't happen immediately so give it 100 ms to stop
                            Talk.turn_on_mic()
                        }, 100)
                    }
                }

            Talk.dialog_dom_elt.onblur = function(event){
                let ancests = []
                let mess = null
                /*if(event.relatedTarget) { //when teh reason onblur is called is because we're focusing on a thype_in elt in the talk dialog, we want to keep the dialog background non-gray
                    ancests = Utils.get_dom_elt_ancestors(event.relatedTarget, false)
                } //don't include event.target in ancests
                if (ancests.includes(Talk.dialog_dom_elt)) { //don't change dialog message.  Leave Talk.dialog_dom_elt fully visible with whatever its current message is which is probably instrudtions for filling in its input field.
                    mess = null
                }
                else {
                    mess = "Disabled. Click dialog to enable."
                }
                console.log("in onblur for dialog_dom_elt calling display_status with: " + "Disabled. Click dialog to enable. and: " + event.relatedTarget)
                */
                //don't change the mess when blur, keep the old one. We know the dialog is disabled by its gray background
                Talk.display_status(mess, event.relatedTarget) //with mess == null, it leaves in
                //the current mess which is probably an input field for "print" and related Talk cmds
            }

            Talk.dialog_dom_elt.onfocus = function(event){
                console.log("in onfocus for dialog_dom_elt calling display_status")
                Talk.display_status(null)
            }
            Talk.set_mode("main_menu")
            }, //need "Talk" here, not "this"
            200
        )
        Talk.talk_out(Talk.say_or_click() + " on a valid command.")
    }

    static sw_callback(vals){
        //out(vals)
        let but_val = vals.clicked_button_value
        if(but_val === "close_button") {
            Talk.off()
        }
        /*else { //all the cmds in the window are A tags with thei own onclick methods.
            let meth = Talk.cmd_method(but_val) //Talk.prose_name_to_method(but_val)
            if (meth) {
                meth.call(Talk)
            } else {
                out("show_window click has no action.")
            }
        }*/
    }

    static set_mode(mode, message){
        Talk.mode = mode //must use "Talk", not "this" due to setTimeout call
        Talk.display_status(message)
    }

    //shows status including valid cmds
    //not passing in a message displays the default message.
    static display_status(message, related_target){
        //out("top of display_status")
        if(globalThis.status_id) { //show_window is shown
            status_id.innerHTML =
                "<i>Mode: </i><b>"          + this.mode + (Talk.recording_name_now_playing ?  " " + Talk.recording_name_now_playing : "") + "</b> &nbsp;" +
                "<i>Step distance: </i><b>" + this.step_distance                   + "</b> &nbsp;" +
                "<i>Mic: </i><b>"           + (this.is_mic_on() ?    "on" : "off") + "</b> &nbsp;" +
                "<i>Speaker: </i><b>"       + (this.enable_speaker ? "on" : "off") + "</b> &nbsp;" +
                "<i>Recording: </i><b>"     + (this.is_recording ?   "on" : "off") + "</b> &nbsp;"

            this.set_display_status_color(related_target)
            let valid_cmds_html_fn_name
            valid_cmds_html_fn_name = "show_" + Talk.mode + "_mode_commands"
            let mode_cmds_meth = Talk[valid_cmds_html_fn_name]
            mode_cmds_meth.call(Talk) //show valid cmds for this Talk.mode, ie main menu, move menu, etc.
            if(message){
                Talk.talk_out(message)
            }
        }
    }

    static set_display_status_color(related_target) { //related_target is like print_elt_id, aan input elt inside the dialog , or nothing
        console.log("top of set_display_status_color passed related_target: " + related_target)
        let in_focus_color = "#ffd6c2" //"#ffd9ad" //tan  rgb(255, 253, 208) //cream
        let out_focus_color = "gray"
        //let bg_color=  ((document.activeElement === this.dialog_dom_elt) ? in_focus_color : out_focus_color)
        let color
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
        }
        status_id.style["background-color"] = color
        talk_out_id.style["background-color"] = color
        this.dialog_dom_elt.style["background-color"] = color
        console.log("just set color to: " + color + "with: ")
        console.log("document.activeElement: " + document.activeElement)
        console.log("_________")
    }

 //_______command Utilties_______

    //cmds is a list of cmd_rows. a list of methods  without their subject, lower-case, with underscores
    static make_command_list_items(...cmds){
        let result = ""
        for(let cmd_row_arr of cmds){
            if(!cmd_row_arr ) { continue }
            result += "<li style='height:30px;'>"
            for(let cmd of cmd_row_arr) {
                if(!cmd ) { continue }
                if ((cmd_row_arr.length > 1) && (cmd !== cmd_row_arr[0])) { //put comma before every non-first elt
                    result += " &nbsp;&#x2022;&nbsp;"
                }
                let display_prose = this.cmd_display_prose(cmd) //upper case first letter, spaces between words
                let norm = this.cmd_normalized_prose(cmd)
                let tooltip = this.cmd_tooltip(norm)
                let click_source = "Talk.handle_command('" + norm + "')"
                let style_val = "" //text-decoration: underline; color:#3600cc " //#7d00fa; " //purple
                if(norm === 'stop recording') {
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
        return result //+= "<li><span onclick='alert(123)' name='mynam'>cont</span></li>"
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

    static cmd_props_table = [
        //0 cmd_normalized_prose,   1 cmd_display_prose,       2 cmd_method_name,  3 cmd_can_be_  4 cmd_alternatives                       5 cmd_tooltip
        //aka utterance from reco                              aka recording_name, in_recording,

        ["turn on mic",            "Turn on mic",              "turn_on_mic",      true, ["turn on mike",  "turn on microphone"],  "Turn on the mic (or press space bar),&#013;then say a command."],
        ["turn off mic",           "Turn off mic",             "turn_off_mic",     true, ["turn off mike", "turn off microphone"], "Turn off the mic"], //note this isn't even on the menu and doesn't need to be as mic auto turns off after a pause in speaking

        ["turn on speaker",        "Turn on speaker",          "turn_on_speaker",  true, [], "Enables the speaker to work when Talk tries to, um, talk."],
        ["turn off speaker",       "Turn off speaker",         "turn_off_speaker", true,  ["turn speaker off", "quiet", "be quiet", "shut up"], "Disables speaker so that Talk will (usually) be quiet."],
        ["move",                   "Move&#9660;",              "move",             false, ["show movement commands"], "Displays a menu of robot movement commands."],
        ["note",                   "Note (text)",              "note",             true, [], "Inserts text into the end of the editor with a timestamp."  ], //don't have alternatives
        ["print",                  "Print (text)",             "print",            true, [], "Inserts text into the current position of the editor without timestamp."], //don't have alternatives
        ["say selection",          "Say selection",            "say_selection",    true, [], "Select some text in the editor and &#13;say or click 'Say selection' to have it spoken."],
        ["define saying",          "Define saying (text)",     "define_saying",    true, ["define saying", "defined saying", "dine saying"], //must be 2 words.
             "The 1st word of a saying is its name,&#13;the 2nd is its body.&#13;Ex: Say 'define saying green is good'.&#13;Or select 'green is good' in the editor and&#13;click the menu item.&#13;Tap the space bar and say 'green',&#13;or click Job button 'green' to hear 'is good'."],

        //recording dialog
        ["define position",        "Define position",          "define_position",  false, ["defined position", "dine position"]],
        ["start recording",        "Start recording",          "start_recording",  false, ["started recording"]],
        ["stop recording",         "Stop recording",           "stop_recording",   false],
        ["play recording",         "Play Recording (name)",    "play_recording",   true],
        ["stop playing",           "Stop playing",             "stop_playing",     true],
        ["edit job",               "Edit Job (name)",          "edit_job",         true, [], "Say 'Edit [job name] to&#13;insert the Job definition into the editor."], //don't have alternatives
        //["list recordings",        "List recordings",          "list_recordings",  true],
        ["gpt",                    "GPT (prompt)",             "gpt",              false, ["g", "gee", "GPT"], "Passes the spoken text as a prompt to GPT.&#13;The response appears in the Output pane. "],
        //move dialog
        ["straight up",            "Straight up",              "straight_up",      true, [], "Move Dexter until its straight up and stop."],
        ["down",                   "Down",                     "down",             true, [], "Move Dexter down.&#13;If Dexter is straight up (as it is initially)&#13;you must move it down&#13;before moving it in any other direction."],
        ["up",                     "Up",                       "up",               true, [], "Move Dexter up."],
        ["left",                   "Left",                     "left",             true, [], "Move Dexter left."],
        ["right",                  "Right",                    "right",            true, [], "Move Dexter right."],
        ["closer",                 "Closer",                   "closer",           true, [], "Move Dexter closer to its base."],
        ["farther",                "Farther",                  "farther",          true,  ["further"], "Move Dexter farther from its base."],
        ["reverse",                "Reverse",                  "reverse",          true, [], "Move Dexter back along the path from whence it came."],
        ["forward",                "Forward",                  "forward",          true, ["foreword"], "Move Dexter forward after you have moved it back along its path."],
        ["faster",                 "Faster",                   "faster",           true, [], "Double the speed of Dexter when it moves."],
        ["slower",                 "Slower",                   "slower",           true, [], "Half the speed of Dexter when it moves."],
        ["stop",                   "Stop",                     "stop",             true, [], "Stop Dexter and other ongoing activities."],  //on both main and move menus

        ["back",                   "Back",                     "back",             true, [], "Change the menu of commands back to the main menu."],
        ["off",                    "Off",                      "off",              false, [], "Stop activities and close the Talk dialog box."]
    ]
    static show_main_menu_mode_commands() {
        let mic_cmd = []
        if(this.speech_reco_possible){
            mic_cmd.push((this.is_mic_on() ? "Turn off mic" : "Turn on mic"))
        }
        mic_cmd.push((this.is_speaker_on()? "Turn off speaker" : "Turn on speaker"))
        let cmd_rows_arr = [
            mic_cmd,
            ["move"],
            ["note", "print", "say selection"],
            ["define saying", "define position", (this.is_recording ? "stop recording" : "start recording")],
            ["play recording", "edit job"],
            ["gpt"],
            ["stop", "off"],
        ]
        valid_commands_id.innerHTML = this.make_command_list_items(...cmd_rows_arr)
    }

    static show_move_mode_commands(){
        let cmd_row_arr =  [ //even if not moving, we need this to get back to main_menu mode
            ["straight up"],
            ["up",       "down"],
            ["left",     "right"],
            ["closer",   "farther"],
            ["forward",  "reverse"],
            ["faster",   "slower"],
            ["stop",     "back"]
        ]
        valid_commands_id.innerHTML = this.make_command_list_items(...cmd_row_arr)
    }

    //does not check for existance, just converts string to the right FORMAT of a cmd_normalized_prose.
    //used to get a recording_name as might be spoken
    static string_to_cmd_normalized_prose(string){
        let paren_index = string.indexOf("(")
        if (paren_index !== -1) {
            string = string.substring(0, paren_index) //open paren means the close paran ends the whole cmd, so we don't have to check for it.
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

    static get_cmd_props(cmd){ //ex: cmd === "print", returns ["print", "Print (text)", ...]
        for(let cmd_arr of this.cmd_props_table){  //cmd_arr ex: ["print", "Print (text)", ...]
            if((cmd_arr[0] === cmd) || (cmd_arr[1] === cmd) || (cmd_arr[2] === cmd) || (cmd_arr[4] === cmd)){ //excludes can_be_recording and tooltips on purpose
                return cmd_arr
            }
        }
        return null
    }

//called at top of handle_command. all lower case, spaces between words
    static cmd_normalized_prose(cmd){
       let cmd_props = this.get_cmd_props(cmd)
       if(cmd_props){ return cmd_props[0] }
       let norm_cmd = this.string_to_cmd_normalized_prose(cmd)
       let meth_name = this.string_to_method_name(cmd)
       if(this.is_recording_name(meth_name)) { return norm_cmd } //yes this is unnecessary, but clearer intent
       else                                  { return norm_cmd }//Might be a brand-new recording name
    }

    //returns true for regular cmds and known recording_names
    static is_known_cmd(cmd){
        let cmd_props = this.get_cmd_props(cmd)
        if(cmd_props){ return true }
        let meth_name = this.string_to_method_name(cmd)
        if(this.is_recording_name(meth_name)) { return true }
        else { return false }//cmd Might be a brand-new recording name, but we still return false as is it is as of yet, unknown
    }

    static cmd_display_prose(cmd){
        let cmd_props = this.get_cmd_props(cmd)
        if(cmd_props){ return cmd_props[1] }
        return this.string_to_display_prose(cmd)
    }

    static cmd_method_name(cmd){
        let cmd_props = this.get_cmd_props(cmd)
        if(cmd_props){ return cmd_props[2] }
        //below used for making a recording_name from some potentially unknown string
        let meth_name = this.string_to_method_name(cmd)
        return meth_name
    }

    static cmd_method(cmd){
        let meth_name = this.cmd_method_name(cmd)
        if(meth_name) { return Talk[meth_name] }
        return null //not found
    }

    //note that an unknown but proper recording_name will still return false
    static cmd_can_be_in_recording(cmd){
        let cmd_props = this.get_cmd_props(cmd)
        if(cmd_props){ return cmd_props[3] }
        let meth_name = this.string_to_method_name(string)
        if(this.is_recording_name(meth_name)) { true }
        return null //not found
    }

    //always returns an array.
    //If include_normalized_prose is true, the array will always be non-empty
    //with the normalized prose as the first elt.
    //else if include_normalized_prose is false, and there are no alternaitvles in the table,
    //returns the empty array.
    static cmd_alternatives(cmd, include_normalized_prose=true){
        let cmd_props = this.get_cmd_props(cmd)
        let alts = cmd_props[4]
        if(!alts){
            alts = []
        }
        if(include_normalized_prose){
            alts = alts.slice() //copy
            alts.unshift(this.cmd_normalized_prose(cmd))
        }
        return alts
    }

    static cmd_tooltip(cmd){
        let cmd_props = this.get_cmd_props(cmd)
        if(cmd_props){ return cmd_props[5] }
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
    static talk_out(html){
        if(globalThis.talk_out_id) {
            talk_out_id.innerHTML = html
            /* if (this.enable_speaker) {
                // but having problems turning it back on.
                //this.microphone.close()
                if(this.speech_reco_possible && this.is_mic_on()) {
                    //this.client.stop()
                    this.listening = false
                    //Talk.client.adjustAudioProcessor( { vad: { enabled: false }})
                }
                let str = this.strip_html(html)
                speak({
                    speak_data: str, volume:
                    this.speak_volume,
                    callback: function () {
                        if(Talk.speech_reco_possible && !Talk.is_mic_on()) {
                            //Talk.client.start()
                            Talk.listening = true
                            //Talk.client.adjustAudioProcessor( { vad: { enabled: true }})
                        }
                    }
                })
                //setTimeout(this.speak_and_restart(html), 1000)
            }
        }
        else {
            out(html)
        }
             */
        }
    }

    static say_or_click(){
        return (this.is_mic_on()? "Say or click" : "Tap space bar to turn on mic or click")
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

    static warning(text){
        Talk.talk_out("<span style=color:red;>" + text + "</span>")
        Talk.speak_if_enabled(text)
    }

    //called by gpt, Talk.warning(text)
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



//_______Start of Command Implementations________
    //if called with "off" or NO arg, it should still work
    static off(full_text="off"){
        let alts = this.cmd_alternatives("off", true)
        if(alts.includes(full_text)){
            Talk.stop() //stop speaking, turn_off_mic, etc.
            Talk.set_mode("main_menu")
            setTimeout(function(){  //not sure why this is needed but clicking "Off" doesn't close the show_window without it
                SW.close_window(Talk.sw_index)
            }, 100)
            if (Job.talk_to_dexter) {
                Job.talk_to_dexter.when_do_list_done = "run_when_stopped"
                //change from "wait" so that stop_for_reason will stop the job.
                Job.talk_to_dexter.stop_for_reason("completed", "user stopped job")
                Job.talk_to_dexter.undefine_job()
            }
            //put the above before the below because the below try doesn't catch a broken websocket error

            return "valid"
        }
        else { return "invalid"}
    }

    static is_mic_on(){
        //if(!this.client || !this.client.active) { return false }
        //else { return this.client.isActive() }
        return this.listening === true
    }

    static turn_on_mic(full_text="turn on mic"){
        let alts = this.cmd_alternatives("turn on mic", true) //don't do if we're already listening.
        if(!this.listening && alts.includes(full_text)){ //don't do if we're already listening.
            this.recognition.start()
            this.listening = true
            Talk.display_status()
            Talk.talk_out(Talk.say_or_click() + " on a valid command.")
            return "valid"
        }
        else { return "invalid"}
    }

    static turn_off_mic(full_text="turn off mic"){
        let alts = this.cmd_alternatives("turn off mic", true)
        if(alts.includes(full_text)){
            this.recognition.abort();
            this.listening = false
            this.display_status()
            if(talk_out_id.innerText.startsWith("Unrecognized")){}
            else { this.talk_out("Tap space bar then say a command.") }
            return "valid"
        }
        else { return "invalid"}
    }

    static is_speaker_on(){
        return this.enable_speaker
    }

    static turn_on_speaker(full_text = "turn on speaker") {
        let alts = this.cmd_alternatives("turn on speaker", true)
        if(!this.listening && alts.includes(full_text)){
            this.enable_speaker = true
            this.display_status()
            this.talk_out("The speaker is now on.")
            speak("The speaker is now on.")
            return "valid"
        } else {
            return "invalid"
        }
    }

    static turn_off_speaker(full_text = "turn off speaker"){
        let alts = this.cmd_alternatives("turn off speaker", true)
        if(alts.includes(full_text)){
            this.enable_speaker = false
            this.display_status()
            this.talk_out(this.say_or_click() + ' "Turn on Speaker" to start Dexter talking.')
            return "valid"
        }
        else { return "invalid"}
    }

    static note(full_text="note"){
        //let alts = this.cmd_alternatives("note", true)
        if(full_text === "note"){
            this.talk_out("Type in text to print and hit Enter: " +
                "<input id='print_text_id'  onkeyup='Talk.note_from_type_in(event)'/>"
            )
            setTimeout(function(){
                if(globalThis.print_text_id){ //just in case a speechly_out erases the recording_name input
                    globalThis.print_text_id.onkeydown = function(event){
                        if (event.key === " ") { //so hitting the space bar doesn't try to turn on the mic.
                            //out("got space")
                            event.stopPropagation()
                        }
                    }
                    globalThis.print_text_id.focus()
                    setTimeout(function() {
                        console.log("calling display_status after focus on print_text_id")
                        Talk.display_status(null, globalThis.print_text_id)
                    }, 200)
                }
            }, 200)
            return "valid"
        }
        else if(full_text.startsWith("note")){ //if we get here we have a message in tull_text
            let mess = full_text.substring(5)
            let text = "\n" + new Date() + "\n" + mess + "\n"
            Editor.insert(text, "end")
            Talk.dialog_dom_elt.focus() //we don't want to leave focus in the editor pane.
            Talk.talk_out("Printing into the editor.")
            return "valid"
        }

        else {
            return "invalid"
        }
    }

    static note_from_type_in(event){
        if(event.key === "Enter") {
            let text = "\n" + new Date() + "\n" + event.target.value + "\n"
            Editor.insert(text, "end")
            Talk.dialog_dom_elt.focus() //we don't want to leave focus in the editor pane.
            Talk.talk_out("Printing into the editor.")
        }
    }

    static print(full_text="print"){
        //let alts = this.cmd_alternatives("note", true)
        if(full_text === "print"){
            this.talk_out("Type in text to make a note and hit Enter: " +
                "<input id='print_text_id'  onkeyup='Talk.print_from_type_in(event)'/>"
            )
            setTimeout(function(){
                if(globalThis.print_text_id){ //just in case a speechly_out erases the recording_name input
                    globalThis.print_text_id.onkeydown = function(event){
                        if (event.key === " ") { //so hitting the space bar doesn't try to turn on the mic.
                            //out("got space")
                            event.stopPropagation()
                        }
                    }
                    globalThis.print_text_id.focus()
                    setTimeout(function() {
                        console.log("calling display_status after focus on print_text_id")
                        Talk.display_status(null, globalThis.print_text_id)
                    }, 200)
                }
            }, 200)
            return "valid"
        }
        else if(full_text.startsWith("print")){ //if we get here we have a message in tull_text
            let text = full_text.substring(5)
            Editor.insert(text, "end")
            Talk.dialog_dom_elt.focus() //we don't want to leave focus in the editor pane.
            Talk.talk_out("Printing into the editor.")
            return "valid"
        }

        else {
            return "invalid"
        }
    }

    static print_from_type_in(event){
        if(event.key === "Enter") {
            let text = event.target.value
            Editor.insert(text, "end")
            Talk.dialog_dom_elt.focus() //we don't want to leave focus in the editor pane.
            Talk.talk_out("Printing into the editor.")
        }
    }

    //always speaks regardles of Talk.enable_speaker
    static say_selection(full_text="say selection"){
        let alts = this.cmd_alternatives("say selection", true)
        if(alts.includes(full_text)){
            let sel = Editor.get_javascript(true)
            if(sel.length === 0) {
                speak({speak_data: "There is no selection. Drag the mouse over some text and try again."})
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

    //Defines a job with a name so goes in the Job bar. then user can SAY
    //any job name to run it.
    /* static define_saying(full_text="define saying", playing_a_recording_cmd=false) {
        let alts = this.cmd_alternatives("define saying", true)
        if(alts.includes(full_text)){
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

    //tne "saying" becomes a one istruction job, appearing on the job bar that you can click on.
    //todo If you say the name of a job, run it. No need to put it on a menu because its
    //already on the job bar to click on.
    static define_saying_name(saying_name, saying=Talk.saying_being_defined) {
        if(Talk.is_known_cmd(saying_name)) { //we want to exclude known recording names
            Talk.set_mode("main_menu")
            Talk.talk_out('"' + saying_name + '" is a command, so it can&apos;t be used to name a saying.')
            return "valid"
        }
        else {
            Talk.set_mode("main_menu")
            Talk.talk_out('The saying "' + saying_name + '" has been defined.')
            new Job({
                name: saying_name,
                do_list:
                    [function () {
                        //speak({speak_data: saying})
                        out("<b>" + saying + "</b>")
                        Talk.talk_out(saying)
                    }]
            })
            return "valid"
        }
    }
     */

    static define_saying(full_text="define saying", playing_a_recording_cmd=false) {
        let alts = this.cmd_alternatives("define saying", true)
        if (alts.includes(full_text)) { //exact match of an alternative. get content from Editor selection
            let content = Editor.get_javascript(true).trim()
            if (content === "") {
                Talk.warning("To define a saying without giving the content,<br/> select the text in the editor.")
                return "valid"
            } else {
                return this.define_saying_handle_content(content)
            }
        }
        else if (full_text.startsWith("define saying")){ //we've passed in at least some content
            let first_space_index  = full_text.indexOf(" ")
            let second_space_index = full_text.indexOf(" ", first_space_index + 1)
            if(second_space_index === -1){
                Talk.warning("To define a saying, you must start with a name.")
                return "valid"
            }
            let content = full_text.substring(second_space_index).trim()
            return this.define_saying_handle_content(content)
        }
        else {
            return "invalid"
        }
    }

    //content does not start with "define saying" but is not ""
    //The name can be only 1 word. IFF needed this can be extended by
    //having a newline separate the name and the body.
    //but careful, only the FIRST newline does this so that we
    //can have multiple lines in the body.
    //when saying the content, no way to separate name from body
    //without saying something extra so multi-word terms could work best
    //with text content.
    static define_saying_handle_content(content){
        let end_of_name_index = content.search(/\s+/)
        if(end_of_name_index === -1){
            Talk.warning("To define a saying, you must have words to say<br/> after the name of the saying.")
            return "valid"
        }
        let name = content.substring(0, end_of_name_index)
        let body = content.substring(end_of_name_index).trim()
        if (body === "") { //probably this won't hit, but its protection
            Talk.warning("To define a saying, you must have words to say<br/> after the name of the saying.")
            return "valid"
        } else {
            let the_job_src =   '\nnew Job({name: "' + name + '",\n' +
                                '         do_list: [\n' +
                                '           function () {\n' +
                                '             speak(`' + body + '`)}\n' +
                                "]})\n"
            eval(the_job_src)
            Editor.insert(the_job_src)
            Talk.dialog_dom_elt.focus() //we don't want to leave focus in the editor pane.
            return "valid"
        }
    }

    static gpt_cb (envelope) {
        OpenAI.make_text_cb(envelope) //the default callback
        let response = OpenAI.envelope_to_response(envelope)
        Talk.speak_if_enabled(response)
        Talk.dialog_dom_elt.focus()
    }

    static gpt(full_text="gpt") {
        let alts = this.cmd_alternatives("gpt", true)
        if (alts.includes(full_text)) { //exact match of an alternative. get content from Editor selection
            let prompt = Editor.get_javascript(true).trim()
            if (prompt === "") {
                Talk.warning("You must select text in the editor for a GPT prompt.")
                return "valid"
            } else {
                return this.gpt_aux(prompt)
            }
        } else if (full_text.startsWith("gpt")) {
            let first_space_index = full_text.indexOf(" ")
            let prompt = full_text.substring(first_space_index + 1).trim()
            if (prompt === "") {
                Talk.warning("You must say a GPT prompt.")
            } else {
                return this.gpt_aux(prompt)
            }
        } else {
            return "invalid"
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
        return "valid"
   }

    //run as gpt cmd maybe. Only call after normal cmd's all checked and didn't hit.
    static convert_to_gpt_cmd_maybe(full_text){
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
        else {
            return "invalid"
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

    static start_recording(full_text="start recording"){
        let alts = this.cmd_alternatives("start recording", true)
        if(!this.is_recording && alts.includes(full_text)){
                //this.set_mode("now_recording")
           Talk.is_recording = true
           this.the_recording_in_progress = [] //clear out the previous recording
           this.talk_out("Now recording.<br/>" + this.say_or_click() + " on commands, pausing between each.")
           this.show_main_menu_mode_commands() //needs to replace "Start recording" with "Stop recording"
           this.display_status() //needs to update "Recording" status
           return "valid"
        }
        else { return "invalid"}
    }

    static show_waiting_for_recording_name_mode_commands(){
        valid_commands_id.innerHTML = this.make_command_list_items( ["(the name for this recording)"],
                                                        ["Main menu (cancel recording)"]
                                                        )
    }

    static show_waiting_for_saying_name_mode_commands(){
        valid_commands_id.innerHTML = this.make_command_list_items( ["(the name for this saying)"],
            ["Main menu (cancel saying)"]
        )
    }

    static show_waiting_for_position_name_mode_commands(){
        valid_commands_id.innerHTML = this.make_command_list_items( ["(the name for this saying)"],
            ["Main menu (cancel position)"]
        )
    }

    static stop_recording(full_text="stop recording"){
        let alts = this.cmd_alternatives("start recording", true)
        if(this.is_recording && alts.includes(full_text)){
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

    static job_name_prose_to_job_name(job_name_prose){
        let job_names = Job.defined_job_names() //this.array_of_recording_names()
        let job_name_prose_name = job_name_prose.replaceAll(" ", "_").toLowerCase()
        for(let maybe_upper_case_job_name of job_names){
            let now_lower_case_job_name = maybe_upper_case_job_name.toLowerCase()
            if(now_lower_case_job_name === job_name_prose_name){
                return maybe_upper_case_job_name //the name of an actual job
            }
        }
        return null //no jobs of that name
    }

    //not on the menu, but handle_cmd tries it
    static start_job(job_name_prose){
        let job_name = this.job_name_prose_to_job_name(job_name_prose)
        if(job_name){
            Job[job_name].start()
            return "valid"
        }
        else {
            return "invalid"
        }
    }

    //full_text must be passed, it can't default
    //always returns valid todo questionable!

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
        this.set_mode("main_menu")
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
        let alts = this.cmd_alternatives("define position", true)
        if(alts.includes(full_text)){
            let first_space_index  = full_text.indexOf(" ")
            let second_space_index = full_text.indexOf(" ", first_space_index + 1)
            let name_maybe
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
                        this.talk_out('"' + recording_name + '" is now a defined position.')
                    }
                    //if (this.initialize_dexter_maybe(full_text, playing_a_recording_cmd, the_job)) {
                    //    return "valid"  //even if its not really valid, validate anyway. If full_text isn't valid,
                        //it will get caught by the handle_command in the setTimeout fn
                    //}
                    let angles = dex.rs.measured_angles()
                    let instrs = [dex.move_all_joints(angles), dex.empty_instruction_queue()]
                    this.define_position_name(recording_name, instrs) //got all the info we need dto define position and show main menu
                    return "valid"
                }
            }
            else if(!dex.rs) {
                Talk.talk_out("To name a Dexter position, you have to move Dexter first.")
                return "valid"
            }
            else {
                this.set_mode("waiting_for_position_name")
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
    static define_position_name(job_name, instrs){
        this.set_mode("main_menu")
        return new Job({name: job_name, do_list: instrs})
    }

    //not needed in the menu. This is now just the job buttons in the job bar.
    static list_recordings(full_text="list recordings"){
        let alts = this.cmd_alternatives("list recordings", true)
        if(alts.includes(full_text)){
            let job_names = this.array_of_recording_names()
            if (job_names.length === 0){
                this.talk_out('There are no recordings.<br/>Use "Start recording" to make one.')
            }
            else {
                let arr_of_arrs = [["main menu"]]
                for(let job_name of job_names){
                    job_name = job_name.replaceAll("_", " ")
                    arr_of_arrs.push([job_name, "Edit " + job_name])
                }
                valid_commands_id.innerHTM = this.make_command_list_items(...arr_of_arrs)
                this.talk_out(this.say_or_click() + ' the name of a recording to play it.')
            }
            return "valid"
        }
        else { return "invalid" }
    }


    static edit_job(full_text="edit job"){ //ex: "edit job my job"
        // let alts = this.cmd_alternatives("edit job", true) //can't have alternatives
        if(full_text === "edit job"){
            this.talk_out("Type in Job name to edit and hit Enter: " +
                "<input id='print_text_id' onkeyup='Talk.edit_job_from_type_in(event)'/>"
            )
            setTimeout(function(){
                if(globalThis.print_text_id){
                    console.log("globalThis.print_text_id:" + globalThis.print_text_id)
                    globalThis.print_text_id.onkeydown = function(event){
                        if (event.key === " ") { //so hitting the space bar doesn't try to turn on the mic.
                            //out("got space")
                            event.stopPropagation()
                        }
                    }
                    globalThis.print_text_id.focus()
                    setTimeout(function() {
                        console.log("calling display_status after focus on print_text_id")
                        Talk.display_status(null, globalThis.print_text_id)
                    }, 200)
                }
            }, 200)
            return "valid"
        }
        else if (full_text.startsWith("edit job")) { //expect "edit job my job" or similar
            let possible_job_name = full_text.substring(9).trim()
            let job_name = this.job_name_prose_to_job_name(possible_job_name) //convert "my job" tp "my_job"
            if(!job_name){
                return "invalid"
            }
            else {
                let the_job = Job[job_name]
                let job_src = to_source_code({value: the_job, job_orig_args: true})
                Editor.insert("\n" + job_src, "end")
                Talk.dialog_dom_elt.focus()
                Talk.talk_out('The definition for "' + job_name + '" has been appended to the editor buffer.')
                return "valid"
            }
        }
        else {
            return "invalid"
        }
    }

    static edit_job_from_type_in(event){
        if(event.key === "Enter") {
            let possible_job_name = event.target.value
            let job_name = this.job_name_prose_to_job_name(possible_job_name) //convert "my job" tp "my_job"
            if(!job_name){
                Talk.warning(possible_job_name + " is not a defined Job name.")
            }
            else {
                let the_job = Job[job_name]
                let job_src = to_source_code({value: the_job, job_orig_args: true})
                Editor.insert("\n" + job_src, "end")
                Talk.dialog_dom_elt.focus()
                Talk.talk_out('The definition for "' + job_name + '" has been appended to the editor buffer.')
            }
            //Talk.talk_out(Talk.say_or_click() + " a valid command.")
        }
    }

    static show_playing_recording_mode_commands(){
        valid_commands_id.innerHTML = this.make_command_list_items(["Stop playing"])
    }

    static play_recording(full_text="play recording"){
        let trimmed_text
        let alts = this.cmd_alternatives("play recording", true)
        if(alts.includes(full_text)){
            if (this.array_of_recording_names().length === 0) {
                this.talk_out('There are no recordings to play.<br/>' + this.say_or_click() + ' on "Start recording"" to make one.')
                return "valid"
            } else {
                this.list_recordings()
                this.talk_out(this.say_or_click() + ' on the name of a recording to play it.')
                return "valid"
            }
        } else if (Utils.starts_with_one_of(full_text, alts)) {
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
        let alts = this.cmd_alternatives("stop playing", true)
        if(alts.includes(full_text)){
            let rec_name = Talk.recording_name_now_playing
            let the_job = Job[rec_name]
            Talk.recording_name_now_playing = null
            if (the_job.is_active()) {
                the_job.stop_for_reason("interrupted", 'User said "stop playing".')
            }
            Talk.set_mode("main_menu")
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
        //beware, might error with "out of range".
        let new_angle_array = this.fix_home_angles_maybe(angle_array)
        let new_xyz_extra = Kin.J_angles_to_xyz(new_angle_array)
        return new_xyz_extra //arr of array of numbers
    }

    static word_to_axis_index_and_direction(word=Talk.current_command){
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
        let alts = this.cmd_alternatives("stop", true)
        if(alts.includes(full_text)){
            try {
                Talk.stop_aux()
                Talk.talk_out(this.say_or_click() + " on a valid command")
            }
            catch(err) {} //we don't want any errors during stop, lke if the Talk dialog box is down, and we try to write to it
            return "valid"
        }
        else { return "invalid" }
    }


    //called from both stop and as a job instruction, where we DON'T want it to return
    //anything, including "valid" as that will be interpreted by a job as an instruction
    static stop_aux(){
        Talk.is_moving = false
        this.recognition.abort()
        globalThis.stop_speaking()
        this.enable_speaker = false
        this.turn_off_mic() //calls display_status
        for(let job_inst of Job.active_jobs()){
            if(job_inst.name !== "talk_to_dexter"){
                job_inst.stop_for_reason("interrupted", "user said stop")
            }
        }
    }

    static stop_except_no_change_to_enable_speaker(full_text="stop except speaking"){
        if(full_text === "stop except speaking"){
            try {
                Talk.stop_except_no_change_to_enable_speaker_aux()
                Talk.talk_out(this.say_or_click() + " on a valid command")
            }
            catch(err) {} //we don't want any errors during stop, lke if the Talk dialog box is down and we try to write to it
            return "valid"
        }
        else { return "invalid" }
    }


    //called from both stop and as a job instruction, where we DON'T want it to return
    //anything, including "valid" as that will be interpreted by a job as an instruction
    static stop_except_no_change_to_enable_speaker_aux(){
        this.is_moving = false
        this.recognition.abort()
        //globalThis.stop_speaking() //bad idea if speaking a define saying as it will cut it off prematurely
        //this.enable_speaker = false //don't change this
        this.turn_off_mic() //calls display_status
        for(let job_inst of Job.active_jobs()){
            if((job_inst.name !== "talk_to_dexter") &&
                !is_speaking()){ //because define_saying uses a job and we don't
                //want to cut off a job if its speaking
                job_inst.stop_for_reason("interrupted", "user said stop")
            }
        }
    }

    /* now using "back" instead, but "main menu" is more accurate.
    static main_menu(full_text="main menu"){
        let alts = this.cmd_alternatives("main menu", true)
        if(alts.includes(full_text)){
            this.set_mode("main_menu")
            Talk.talk_out(this.say_or_click() + " on a valid command.")
            return "valid"
        }
        else { return "invalid" }
    }*/

    static back(full_text="back"){
        let alts = this.cmd_alternatives("back", true)
        if(alts.includes(full_text)){
            Talk.set_mode("main_menu")
            Talk.talk_out(this.say_or_click() + " on a valid command")
            return "valid"
        }
        else { return "invalid" }
    }

    static move(full_text){
        let alts = this.cmd_alternatives("move", true)
        if(alts.includes(full_text)){
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
        let alts = this.cmd_alternatives("straight up", true)
        if(alts.includes(full_text)){
            this.set_display_status_color()
            let dex = this.dexter_for_job(the_job)
            this.send_instruction_to_dexter([Talk.start_moving_aux,
                    dex.move_all_joints(Talk.straight_up_angles()),
                    dex.empty_instruction_queue(),
                    function() {
                        Talk.stop_aux() //changes status color back to white
                    },
                    function(){
                        Talk.talk_out("Dexter is straight up.")
                    }],
                the_job)

            Talk.talk_out("Dexter is moving straight up...")
            return "valid"
        }
        else { return "invalid"}
    }

    static left(full_text="left", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        let alts = this.cmd_alternatives("left", true)
        if(alts.includes(full_text)){
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static right(full_text="right", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        let alts = this.cmd_alternatives("right", true)
        if(alts.includes(full_text)){
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static farther(full_text="farther", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        let alts = this.cmd_alternatives("farther", true)
        if(alts.includes(full_text)){
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static closer(full_text="closer", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        let alts = this.cmd_alternatives("closer", true)
        if(alts.includes(full_text)){
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static up(full_text="up", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        let alts = this.cmd_alternatives("up", true)
        if(alts.includes(full_text)){
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        }
        else { return "invalid"}
    }

    static down(full_text="down", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter){
        let alts = this.cmd_alternatives("down", true)
        if(alts.includes(full_text)){
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
            Talk.talk_out("Moving Dexter " + Talk.current_command +
                           '...<br/>Click "Stop" to stop.')
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
            }
            else if (axis_index === 1) {  //y
                new_y = orig_xyz[axis_index] + (axis_direction * Talk.step_distance)
                new_xyz[1] = new_y
                if (new_y < 0) {
                    Talk.talk_out("This installation of Dexter prevents Dexter from going behind itself: " + to_source_code(new_xyz))
                    Talk.stop_aux()
                    return Control.break()
                }
            }
            else if (axis_index === 2) {  //z
                new_z = orig_xyz[axis_index] + (axis_direction * Talk.step_distance)
                new_xyz[2] = new_z
                if (new_z < 0) {
                    Talk.talk_out("This installation of Dexter prevents Dexter from going below it base: " + to_source_code(new_xyz))
                    Talk.stop_aux()
                    return Control.break()
                }
            }
            else if (axis_index === 5) {  //pitch up j6 clockwis4/counterclockwide
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
                Talk.stop_aux(mess)
                return Control.break()
            }
        }
    }

    static reverse(full_text="reverse", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter) {
        let alts = this.cmd_alternatives("reverse", true)
        if(alts.includes(full_text)){
            Talk.current_command = full_text
            Talk.send_init_and_control(the_job)
            return "valid"
        } else {
            return "invalid"
        }
    }

    static forward(full_text="forward", playing_a_recording_cmd=false, the_job=Job.talk_to_dexter) {
        let alts = this.cmd_alternatives("forward", true)
        if(alts.includes(full_text)){
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
        let alts = this.cmd_alternatives("faster", true)
        if(alts.includes(full_text)){
            this.set_step_distance(this.step_distance * 2)
            this.talk_out("Step distance has been increased to: " + this.step_distance + " meters.")
            return "valid"
        }
        else { return "invalid"}
    }

    static slower(full_text="slower"){
        let alts = this.cmd_alternatives("slower", true)
        if(alts.includes(full_text)){
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
        Talk.stop_except_no_change_to_enable_speaker() //when starting a cmd before doing anything else, stop robot and mic
        let status
        //full_text is a valid normalized command
        //the "main_menu mode needs to be first, See the below comment on "initia;" mode.
        if((this.mode === "main_menu") || playing_a_recording_cmd) {

            status = this.turn_on_mic(full_text)
            if(status === "valid") { return }

            status = this.turn_off_mic(full_text)
            if(status === "valid") { return }

            status = this.turn_on_speaker(full_text)
            if(status === "valid") { return } //speechly_out already called.

            status = this.turn_off_speaker(full_text)
            if(status === "valid") { return }

            status = this.note(full_text)
            if(status === "valid") { return }

            status = this.print(full_text)
            if(status === "valid") { return }

            status = this.say_selection(full_text)
            if(status === "valid") { return }

            status = this.define_saying(full_text)
            if(status === "valid") {
                console.log("handled define_saying")
                return
            }

            status = this.start_recording(full_text)
            if(status === "valid") { return }

            status = this.stop_recording(full_text)
            if(status === "valid") { return }

            status = this.define_position(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            //status = this.list_recordings(full_text)
            //if(status === "valid") { return }

            status = this.gpt(full_text)
            if(status === "valid") { return }

            status = this.edit_job(full_text)
            if(status === "valid") { return }

            //this should be last because full_text can be a user made up name of recording.
            status = this.play_recording(full_text)
            if(status === "valid") { return }

            status = this.move(full_text)
            if(status === "valid") { return }

            status = this.stop(full_text)
            if(status === "valid") {return}

            status = this.off(full_text)
            if(status === "valid") {return}

            //must go close to end
            status = this.start_job(full_text)
            if(status === "valid") {
                console.log("handled start_job")
                return
            }

            //must go at very end.
            status = this.convert_to_gpt_cmd_maybe(full_text)
            if(status === "valid") {return}

            Talk.warning("Unrecognized command: " + full_text + ".")
            return
        } //end of "main_menu" mode

        if(this.mode === "move") {
            status = this.stop(full_text)
            if(status === "valid") {return}

            status = this.straight_up(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.up(full_text, playing_a_recording_cmd, the_job)
            if(status === "valid") { return }

            status = this.down(full_text, playing_a_recording_cmd, the_job)
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

            status = this.back(full_text)
            if(status === "valid") { return }

            Talk.warning("Unrecognized command: " + full_text + ".")
            return
        }

        if(this.mode === "waiting_for_recording_name"){

            status = this.off(full_text)
            if(status === "valid") {return}

            status = this.main_menu(full_text)
            if(status === "valid") {return}

            status = this.define_recording(full_text)
            if(status === "valid") { return }

            Talk.warning("Unrecognized command: " + full_text + ".")
            return
        }

        if(this.mode === "waiting_for_saying_name"){

            status = this.off(full_text)
            if(status === "valid") {return}

            status = this.main_menu(full_text)
            if(status === "valid") {return}

            status = this.define_saying_name(full_text)
            if(status === "valid") { return }

            Talk.warning("Unrecognized command: " + full_text + ".")
            return
        }
        if(this.mode === "waiting_for_position_name"){

            status = this.off(full_text)
            if(status === "valid") {return}

            status = this.main_menu(full_text)
            if(status === "valid") {return}

            status = this.define_position_name(full_text)
            if(status === "valid") { return }

            Talk.warning("Unrecognized command: " + full_text + ".")
            return
        }


        if(this.mode === "playing_recording"){

            status = this.off(full_text)
            if(status === "valid") { return }

            status = this.stop_playing(full_text)
            if(status === "valid") { return }

            Talk.warning("Unrecognized command: " + full_text + ".")
            return
        }

        Talk.warning("Unrecognized mode: " + this.mode + ".") //shouldn't ever happen

    } //end of handle_command


} //end of Talk
globalThis.Talk = Talk

//with this, source code in a job's do_list can be: simple("down")
function simple(command){
    let a_simple_fn = function() {
        let the_job = this
        Talk.handle_command(command, true, the_job) //"true" is for playing a recording, so I don't have to switch modes.
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