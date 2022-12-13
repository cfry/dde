/*Valid Commands
Dexter start listening (puts in normal listening mode
_____Normal Listening mode_____
Dexter stop listening  (takes out of normal llistening mode
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

Bug report to Speechly:
- on https://www.npmjs.com/package/@speechly/browser-client
  first line of JS example is:
  import { BrowserClient, BrowserMicrophone, Segment } from '@speechly/browser-client'
  but that causes the error:
  Import of non-existent export (for Segment)
  I deleted ", Segement" and it works ok

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

*/
//import { BrowserClient, BrowserMicrophone, Segment } from '@speechly/browser-client' //from Speechly example but Segment is non-existent export
import { BrowserClient, BrowserMicrophone} from '@speechly/browser-client'
globalThis.BrowserClient = BrowserClient
// Create a new client.
// NOTE: Configure and get your appId from https://api.speechly.com/dashboard
// NOTE: Set vad.enable to true for hands free use
var client

// Create a microphone
var microphone




class Speechly {
    static async initialize(){
        client = new BrowserClient({
            appId: '2357493e-4713-4d54-a041-a792f4952a62',
            vad: { enabled: false, noiseGateDb: -24.0 }
        })
        microphone = new BrowserMicrophone()
        // React to the updates from the API.
        client.onSegmentChange((segment) => {
            console.log('Received new segment from the API:',
                segment.intent,
                segment.entities,
                segment.words,
                segment.isFinal
            )
            if(segment.isFinal) {
                Speechly.handle_final_utterance(segment)
            }
        })
        // Initialize the microphone - this will ask the user for microphone permissions
// and establish the connection to Speechly API.
// Make sure you call `initialize` from a user action handler
// (e.g. from a button press handler).
        await microphone.initialize()

// bind the microphone to the client
        await client.attach(microphone.mediaStream)// Initialize the microphone - this will ask the user for microphone permissions

        client.start()
        show_window({title: "Valid Dexter Commands",
                     x: 450, y:78, width: 500,
                     content: `<ul id='valid_commands_id' style="font-size:22px;">
                               </ul>
                               <div id="speechly_out_id" style="background-color:white;font-size:20px;padding:10px;"></div>`
                              })
        new Job ({name: "talk_to_dexter",
                  when_do_list_done: "wait",
                  do_list: [
                      function() {
                          let initial_angles = this.robot.rs.measured_angles()
                          initial_angles = Kin.point_down(initial_angles) //sets joint 4 to 90 when its straight up
                           //without this, you can't move down from the straight up pos of [0,0,0,0,0]
                           //see same logic in dexter_user_interface2.js init method.
                          let inst = Dexter.dexter0.move_all_joints(initial_angles)
                          return inst
                      },
                      Dexter.empty_instruction_queue()
                  ]
        }).start()
        this.mode = "initial"
        this.show_initial_mode_commands()
        //this.speechly_out("Dexter now listening")
    }

    static async off(){
        try {
            if (client) {
                await client.stop()
            }
            if (microphone) {
                await microphone.close()
            }
        }
        catch(err) {} //ignore the errors if the websocket is busted.
        if (Job.talk_to_dexter) {
            Job.talk_to_dexter.when_do_list_done = "run_when_stopped"
            //change from "wait" so that stop_for_reason will stop the job.
            Job.talk_to_dexter.stop_for_reason("completed", "user stopped job")
            Job.talk_to_dexter.undefine_job()
        }
        SW.close_window("Valid Dexter Commands")
        this.mode = "initial"
    }

    static async start_listening(){
        this.mode = "listening"
        this.show_listening_mode_commands()
    }
    static async stop_listening(){
        this.mode = "initial"
        this.show_initial_mode_commands()
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
    static speechly_out(html){
        speechly_out_id.innerHTML = html
    }
    static show_initial_mode_commands(){
        let items = `<li>Dexter, start listening</li> 
                     <li>Dexter, off</li>`
        valid_commands_id.innerHTML = items
    }
    static show_listening_mode_commands(){
        let items =
           `<li style="line-height: 40px;">Dexter, stop listening</li>
            <li style="line-height: 40px;">Dexter, off</li>
            <li style="line-height: 40px;">x | y | z  &nbsp;&nbsp;&nbsp;   plus | minus &nbsp;&nbsp;&nbsp; less | same | more<br/> </li>
            <li style="line-height: 40px;">tilt &nbsp;&nbsp;&nbsp; x | y  &nbsp;&nbsp;&nbsp; plus | minus  &nbsp;&nbsp;&nbsp; less | same | more<br/> </li>
            <li style="line-height: 40px;">rotate &nbsp;&nbsp;&nbsp;   plus | minus &nbsp;&nbsp;&nbsp; less | same | more<br/> </li>
            <li style="line-height: 40px;">grab | drop</li>`
        valid_commands_id.innerHTML = items
    }

    //if angle_array is an array whose first 5 elts are 0, return true,
    //else return false
    static is_home_angles(angle_array){
        for(let i = 0; i < 5; i++){
            if(angle_array[i] !== 0) { return false }
        }
        return true
    }

    //Copied from dexter_user_interface2 and modified
    // xy is an array of 3 floats.
    // if angle_array is an array whose first 5 elts are 0, return a new array
    //whose first 5 elts are 0 except the 2nd elt is Number.EPSLION
    //and any additional elts are the same as their corresponding ones in angle_array
    //Returned is an array of arrays.
    static fix_xyz(xyz){
        let angle_array = Kin.xyz_to_J_angles(xyz)
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
        let new_xyz = Kin.J_angles_to_xyz(new_angle_array)
        return new_xyz_extra //arr of array of numbers
    }

    static handle_final_utterance(segment){
        let full_text  = this.segment_to_text(segment)
        let parsed_obj = this.segment_to_parsed_obj(segment)
        if(parsed_obj.kind === "start_or_stop") {
            if(parsed_obj.start_or_stop === "start") {
                this.start_listening()
            }
            else if (parsed_obj.start_or_stop === "stop"){
                this.stop_listening()
            }
            else if (parsed_obj.start_or_stop === "off"){
                this.off()
            }
            else {
                this.speechly_out('Unrecognized command: "' + full_text + '"')
            }
        }
        //in "listening" mode
        else if (parsed_obj.kind === "move_to"){
            this.speechly_out("Moving to: " + full_text)
            let x, y, z //todo compute values
            x = 0.1
            y = 0.2
            z = 0.3
            let inst = Dexter.move_to([x, y, z])
            let instrs = [inst, Dexter.empty_instruction_queue()]
            Job.talk_to_dexter.insert_instructions(instrs, false)
        }
        else if (full_text === "up") {
            let orig_xyz = Dexter.dexter0.rs.xyz()[0]
            let new_xyz = [orig_xyz[0], orig_xyz[1], orig_xyz[2] + 0.01] // one centimeter
            let new_xyz_extra = this.fix_xyz(new_xyz)
            let new_angles = Kin.xyz_to_J_angles(new_xyz_extra[0])
            new_angles = Kin.point_down(new_angles)
            let new_xyz_extra2 = Kin.J_angles_to_xyz(new_angles)
            if(Kin.is_in_reach(new_xyz_extra2[0])) {
                let inst = Dexter.move_to(new_xyz)
                let instrs = [inst, Dexter.empty_instruction_queue()]
                Job.talk_to_dexter.insert_instructions(instrs, false)
            }
            else {
                this.speechly_out("Moving up is out of Dexter's reach.")
            }
        }
        else if (full_text === "down") {
            let orig_angles1 = Dexter.dexter0.rs.measured_angles()
            out(orig_angles1)
            let orig_xyz = Dexter.dexter0.rs.xyz()[0]
            let orig_angles2 = Kin.xyz_to_J_angles(orig_xyz)
            let new_xyz = [orig_xyz[0], orig_xyz[1], orig_xyz[2] - 0.01]
            new_xyz = this.fix_xyz(new_xyz)[0]
            if(true){ //Kin.is_in_reach(new_xyz)) {
                let inst = Dexter.move_to(new_xyz)
                let instrs = [inst, Dexter.empty_instruction_queue()]
                Job.talk_to_dexter.insert_instructions(instrs, false)
            }
            else {
                this.speechly_out("Moving down is out of Dexter's reach.")
            }
        }
        else {
            this.speechly_out('Unrecognized command: "' + full_text + '"')
        }
    }

}
globalThis.Speechly = Speechly

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