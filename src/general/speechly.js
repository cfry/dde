/*Valid Commands
Dexter start listening (puts in normal listening mode
Dexter stop listening  (takes out of normal llistening mode
_____Normal Listening mode_____
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

 - on hte page: https://api.speechly.com/dashboard/#/app/2357493e-4713-4d54-a041-a792f4952a62/trainingdata
   under Entities, I selected "number" in the drop down, then typed in "number"
   to the right of it and clicked "add"
    But that apparently did nothing since in the code:
    client.onSegmentChange((segment) => {
    console.log('Received new segment from the API:',
        segment.intent,
        segment.entities,
    the segment.entities printed out as the empty array.

   when I said the words "thirty seven".
   I did see the regular words "thirty" and "seven" in the segment.

- Your page: https://api.speechly.com/dashboard/#/dashboard
  gives doc for Integrate Speechly which describes on "On Device".
  That didn't have enough code for doing "On Device".
   Also what I really needed was "Off Device"
   Have documentation for a browser example that does not use the CDN
   for web page installation, but walks a developer though the steps of
   importing  as well as getting app_id

- As far as I can tell, you don't document a way to get the string
 of a full utterance. Am I missing finding your doc, or
 do I have to cobble this together by looping through the
 words of a segment?

 - I left the mic open without saying anything and got:
   "the audio stream is too long"
   My application needs a continuously open mic and to get
   utterances as they're uttered and just leave open the
   recognition. How do I do that?

*/
//import { BrowserClient, BrowserMicrophone, Segment } from '@speechly/browser-client' //from Speechly example but Segment is non-existent export
import { BrowserClient, BrowserMicrophone} from '@speechly/browser-client'

// Create a new client.
// NOTE: Configure and get your appId from https://api.speechly.com/dashboard
// NOTE: Set vad.enable to true for hands free use
const client = new BrowserClient({
    appId: '2357493e-4713-4d54-a041-a792f4952a62',
    vad: { enabled: false, noiseGateDb: -24.0 }
})

// Create a microphone
const microphone = new BrowserMicrophone()
// Initialize the microphone - this will ask the user for microphone permissions
// and establish the connection to Speechly API.
// Make sure you call `initialize` from a user action handler
// (e.g. from a button press handler).
await microphone.initialize()

// bind the microphone to the client
await client.attach(microphone.mediaStream)

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

class Speechly {
    static start(){
        client.start()
        show_window({title: "Valid Dexter Commands",
                     x: 400, y:100,
                     content: `<ul style="font-size:20px;"><li>Dexter, start listening</li>
                               </ul>
                               <div id="speechly_out_id" style="background-color:white;font-size:20px;padding:10px;"></div>`
                              })
    }

    static stop(){
        client.stop()
    }
    static segment_to_text(segment){
        let text = ""
        for(let word of segment.words){
            let str = word.value
            text += str + " "
        }
        return text.trim() //take off final space
    }
    static speechly_out(html){
        speechly_out_id.innerHTML = html
    }

    static handle_final_utterance(segment){
        let full_text = this.segment_to_text(segment)
        if(full_text.includes("dexter start listening")){
            this.mode = "normal"
            this.speechly_out("Dexter now listening")
        }
        else if(full_text.includes("dexter stop listening")){
            this.mode = "initial"
            this.speechly_out('Dexter now can only recognize:<br/>"Dexter start listening".')
        }
        else if(this.mode === "initial" ){
            this.speechly_out('Dexter now can only recognize: "Dexter start listening".')
        }
        else { //normal mode
            this.speechly_out('Dexter heard: "' + full_text + '"')
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