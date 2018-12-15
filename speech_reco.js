/* Created by Fry on 3/29/17.*/
var path = require('path')

var GetUserMediaToText = require('getusermedia-to-text')

var key_path = path.join(__dirname, 'dexter-dev-env-code.json')

var code1 = `BDhx1L/42\nLAAjAfz7S61hAXJHgy3/Sh8nzAXsX0hVkNWcUMSDMJx65m9LSN7ojF0KukxiPVwY\niIvTnzbzjBpdea8Bg24lTiYb/BflQ4/WSEjrJsE6k+hI1BiNh/8vV/lyUXkmpJ72\n/V5M7aI9Hpy1iEhP5ESUg3OCP6JsuSlLeFiydLugl2FfAyPOEWPNQUZsjVRP5Kpk\nPd9xzJf+zuzFIhOOechqd6kaxkU3FV4bzoyoIKuEc36t80YuwyFO0D6t5JJ9UXm5\nHQFBg50WaI13gdKn+sFDgAuPOUq52kVI3UyIn5rokOKhs3AxrWorY32EjqNqjxFN\nEgJl6+ANAgMBAAECggEBAMh07q3TWDAe/GpJFPjLipcAmABQ1rH3XzsfjAVP1sJK\n8xWrXNJiD8QSqYktvk/W6f43RHSSV/wDd+SsLAE4QRKLQDkET3oQK+GEl3uMouwT\nw97RpAGj+oa+kiANesLXDM7f2tBYffefyNbrlx46NBrLVFyM6YHdQzYoFV1UZ482\nuFOXh0XFi1in/GuHxVcGxdjECrnIPib31TonCbTUknuBp1VfIzXzwQzjumx4fEAA\nvdL5O7huqBnkt5pNxLFUJndsVeYS/wKj0xQLIoHotwCmedUPDgDOU5HwnQR72lqQ\nzyGxTFvTNzf01dIf0c9vduKGJn5OBBUw8EUoUBE3HTUCgYEA+Hm9GSjmVZkWQTyP\n/9bmt7ZzRU9azFoDkug5GvyZHTUCf3TKom1Dtw5jKYGWRl2KM573GMdQP1/D5+vA\nLEJIVuVMibiVbhFh5yx1A2Xh/PuqnOg7r5sB/t4Ni/mW5Vtxnq1Ew698cutqCbUS\ne7kzgfCkkuW1gLFn0VS9kp5fFYMCgYEA8f9hE3RHPi9dU/L+bQQ0zBprzRUu3qdc\nFyQn8DE6+Ir5G+yea6Cv8ispUEHBud8COIuOft6HSaAHkSkmYIUe+u5YswLYEcfo\nf2LHltUfKmdKjd3RJZLCBmo04dABnQwB0IuQomISSPFm9G2ZMndAu8gYOWKbaFNm\ngeb65iUGzy8CgYEA6bBtRa1uvBCnmqFf+UlfYmcJEKWqiskZ1V/s3VG2m36Qo9ju\n/0ZuSksQvievcuxkn1ohoT9LXN8ve/8AlV+dc4RisKBWgdd9UZNBVfnLSkhTVREh\nmW3auZ6T9RK/dWTEfm0NYFG6ZMa9yvVutcggBlSSI8pBIxE2x+zAApZKbQsCgYEA\nnXm5GybEoZPC4Lk0lY5yKQtccTVCrcMsqyZtEuGGZWxSFLjSkmkbdbReiwpvXVvg\nnxk5nheC5AdORUkI3zBha5skf0DviAqVoieOh/mh8T8MBet9iTzKI9CDHxrzodXJ\nbIMVmIXHLk5g19hmI6/0oP3hvZ4MUURMZWYAiTk5CCMCgYEAk8pZpatUCJiVrIJP\nXgig9uRKJ15+Vqucms43bmWsWfuNa2N0nLVB6RucNVUw9RR99YPuOUZ8twSoWYnS\nPKzeu6UO5fBse698uuJjlqfFdDD2E1Hcswkpi/H1vGefw1+DobmL5AgeARh68OIk\nwSnfgW00iGapsR2/5qTXkVMfkCA=\n-----END PRIVATE KEY-----\n",
  "client_email": "dexter-dev-env@dexter-dev-env.iam.gserviceaccount.com",
  "client_id": "112741637141669678658",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://accounts.google.com/o/oauth2/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/dexter-dev-env%40dexter-dev-env.iam.gserviceaccount.com"
}`

var code0 = `{
    "type": "service_account",
    "project_id": "dexter-dev-env",
    "private_key_id": "b05da431ead6129406056df46fe1d5fc3ea8a8f7",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEwAIBADANBgkqhkiG9w0BAQEFAASCBKowggSmAgEAAoIBAQDq4nq`

var s2t

//all these vars meaningful in ui only.
//var recognition = null
var recognize_speech_window_index    = null
var recognize_speech_prompt          = ""  //string or array of strings
var recognize_speech_phrase_callback = null
var recognize_speech_finish_callback = null
//var recognize_speech_only_once       = null
var recognize_speech_click_to_talk   = null
var recognize_speech_last_text       = null
var recognize_speech_last_confidence = null
var recognize_speech_phrases_array   = [] //a array of arrays. the inner array is [recognized_text, confidence_float]
var recognize_speech_finish_phrase   = "finish" //or a pos integer of # of phrases to reco. set by recognize_speech ui
var recognize_speech_cancel_finish = false

function s2t_init(){
    out("init")
    //if (!file_exists(key_path)){
    //    write_file(key_path, code0 + code1) //ffails to write a good file probably due to encoding
    //}
    s2t = new GetUserMediaToText({
        projectId: 'dexter-dev-env',
        keyFilename: key_path
        // request: { options }
    })
    s2t.on('error',     console.error)
    s2t.on('status',    console.log)
    s2t.on('listening', function (isListening) {
        isListening ? console.log('Listening!') : console.log('Stopped Listening!')
    })
    s2t.on('data',      sr_on_data)
}

function start_recognition(){
    s2t_init()
    sr_start()
}

window.start_recognition = start_recognition

function sr_start() {
    //out("top of sr_start()")
    set_mic_and_instructions(true)
    recognize_speech_cancel_finish = false
    //out("calling s2t.start()")
    s2t.start()
    recognize_speech_type_in_id.focus() //often doesn't work.
    recognize_speech_type_in_id.select()

}

function sr_on_data(data){
    //out("data: " + data.speechEventType)
    if(window.recognize_speech_type_in_id) { recognize_speech_type_in_id.focus() }
    switch (data.speechEventType) { //the only value is "SPEECH_EVENT_UNSPECIFIED"
        case "START_OF_SPEECH": //doesn't look like ever happens.
            out("START_OF_SPEECH")
            break;
        case "END_OF_SPEECH": //doesn't look like ever happens.
            out("END_OF_SPEECH")
            set_mic_and_instructions()
            break;
        case "END_OF_UTTERANCE": //doesn't look like ever happens.
            out("END_OF_UTTERANCE")
            set_mic_and_instructions()
        case "END_OF_AUDIO": //doesn't look like ever happens.
            out("END_OF_AUDIO")
            break;
        case "SPEECH_EVENT_UNSPECIFIED":
            set_mic_and_instructions() //don't talk, turns off animation
            if(data && (data.results.length > 0)){
                recognize_speech_last_text       = data.results[0].transcript.trim() //the 2nd through nth recos start with sapce,
                recognize_speech_last_confidence = data.results[0].confidence
                  //which would be good for continuous dictation, but bad for recognizing the ending phrase.
                  //I could get clever and allow, but see how always trimming works out in practice.
                //out("Recognized: " + recognize_speech_last_text)
                sr_result(data) //if the data is good, the phrase is pushed onto the result.
                                //but if not, it isn't so even if finish_prhase is 1, we might
                                //still get more input from user
                                //if user says the finish phrase, it will be pushed onto the result.
                if (typeof(recognize_speech_finish_phrase) == "number") {
                    if (recognize_speech_phrases_array.length >= recognize_speech_finish_phrase){
                      //give user chance to reject the last phrase.
                       //but this is too tricky to get right
                        /*setTimeout(function(){
                            out("timout")
                            if(recognize_speech_cancel_finish == false){ sr_end() }
                            else { set_mic_and_instructions(true) }
                        }, 5000) //give user 5 secs to reject, else the last item is accepted
                        */
                        sr_end()
                    }
                    else { set_mic_and_instructions(true) } //still more phrases to collect
                }
                else if (typeof(recognize_speech_finish_phrase) == "string"){ //has a finish_phrase string
                    if (recognize_speech_last_text == recognize_speech_finish_phrase) { sr_end() } //close window
                    else {set_mic_and_instructions(true)} //more phrases to go
                }
                else if (typeof(recognize_speech_finish_phrase) == "function"){ //has a finish_phrase string
                    let fp_result = recognize_speech_finish_phrase(recognize_speech_last_text, recognize_speech_last_confidence)
                    if (fp_result) { sr_end() } //close window
                    else {set_mic_and_instructions(true)} //more phrases to go
                }
                /*if(recognize_speech_type_in_id) { recognize_speech_type_in_id.select() }
                if ((typeof(recognize_speech_finish_phrase) == "number") &&
                    (recognize_speech_phrases_array.length >= recognize_speech_finish_phrase)){
                    //s2t.stop()
                }
                else if (recognize_speech_click_to_talk) { //s2t.stop()
                }
                else { sr_animate_gif() }*/
            }
            break;
            default:
                shouldnt("recognize_speech ondata got unhandled speechEventType: " + data.speechEventType)
    }
}


function set_mic_and_instructions(instructions=false){
    //out("set_mic_and_instructions passed: " + instructions)
    if (instructions === true) {
        instructions = "<span style='vertical-align:100%;'>Speak now.</span><br/><i>&nbsp;Be quiet to recognize speech.</i>"
    }
    else if (instructions === false) { instructions = "Don't talk" }
    if (window["recognize_speech_img_id"]) { //window is up
        if (instructions == "Don't talk") { sr_unanimate_gif() }
        else if (recognize_speech_click_to_talk) {
            sr_unanimate_gif();
            recognize_speech_type_in_id.focus();
            instructions = "<br/>" //click to talk button is on the screen so unnecessary and confusing to have more instructions
        }
        else { sr_animate_gif() }
        //out("set_mic_and_instructions to: " + instructions)
        recognize_speech_instructions_id.innerHTML = instructions
    }
}

//not called if the recoed text effectively declares "finished"
function sr_result(data) {
    recognize_speech_last_text       = data.results[0].transcript.trim() //event_to_text(event)
    recognize_speech_last_confidence = data.results[0].confidence //no confidence in Bret's new code
    let is_reco_text_valid = true
    if(recognize_speech_phrase_callback) {
        is_reco_text_valid = recognize_speech_phrase_callback(recognize_speech_last_text, recognize_speech_last_confidence)
        if (is_reco_text_valid !== false) {
            if (typeof(is_reco_text_valid) == "string") { recognize_speech_last_text = is_reco_text_valid }
            is_reco_text_valid = true
        }
    }
    if (!is_reco_text_valid) { recognize_speech_last_text = "INVALID: " + recognize_speech_last_text }
    else { recognize_speech_phrases_array.push([recognize_speech_last_text, recognize_speech_last_confidence])
    }
    if(recognize_speech_type_in_id) {
        recognize_speech_type_in_id.value = recognize_speech_last_text
        recognize_speech_type_in_id.select()
    }
    if (!is_reco_text_valid || !got_enough_phrases()){
        sr_display_finish_help()
        sr_display_prompt()
    }
    return is_reco_text_valid
}

//called only when this dialog is all over. no more reco will be done.
function sr_end() {
    close_window(recognize_speech_window_index)
    s2t.stop() //this will cause an error to be printed in the console if we take too long,
               //but that seems to be harmless and we can keep going after that.
               //from web commentary before Dec 18, 2017, this loooks like a google bug.
    if(typeof(recognize_speech_finish_callback)) {
        recognize_speech_finish_callback(recognize_speech_phrases_array)
    }
}

function sr_error(data) {
    set_mic_and_instructions() //don't talk
    if (is_window_shown(recognize_speech_window_index)){ //don't show this error message if the user closed the window
        out("onerror called with: " + data, "red")
    }
    s2t.stop()
}


function got_enough_phrases(){
   if(typeof(recognize_speech_finish_phrase) == "number"){
       return (recognize_speech_phrases_array.length >= recognize_speech_finish_phrase)
   }
   else { return false } //unlimited
}

function limited_number_of_phrases(){
    return (typeof(recognize_speech_finish_phrase) == "number")
}

function sr_animate_gif(){ recognize_speech_img_id.src = "mic-animate.gif"; out("on")  }

function sr_unanimate_gif(){ recognize_speech_img_id.src = "mic.gif"; out("off") }


//public
function recognize_speech_default_phrase_callback(text, confidence){
    out("recognized text: " + text + "<br/>confidence: " + confidence.toFixed(2))
    return true
}
window.recognize_speech_default_phrase_callback = recognize_speech_default_phrase_callback

function sr_onkeypress(event){
    if (event.charCode == 13){
        let text = recognize_speech_type_in_id.value
        data = {speechEventType: "SPEECH_EVENT_UNSPECIFIED",
                results:[{transcript: text,
                          confidence: 100}]}
        sr_on_data(data)
    }
}

window.sr_onkeypress = sr_onkeypress

function sr_on_finish_button_click(){
    let data = {speechEventType: "SPEECH_EVENT_UNSPECIFIED",
                results:[{transcript: recognize_speech_finish_phrase,
                          confidence: 100}]}
    sr_on_data(data)
}
window.sr_on_finish_button_click = sr_on_finish_button_click

function sr_display_finish_help(){
    sr_finish_help_id.innerHTML = sr_finish_help()
}

function sr_finish_help(){
    let finish_help
    if (limited_number_of_phrases()) {
        return "Recognized " + recognize_speech_phrases_array.length  +
               " out of "    + recognize_speech_finish_phrase
    }
    else {
        let finish_button_html = "<input type='button' value='" + recognize_speech_finish_phrase +
                                 "' onmouseup='sr_on_finish_button_click()'/>" //for some inexplcable reason, onclick doesn't work here
        return "To end recognition,<br/>say, type, or click " + finish_button_html
    }
}

function sr_reject_html(){
   return "<input type='button' value='reject' onmouseup='sr_reject()'/>"
}

/* not called
function sr_reject(){
    let new_phrase = ""
    let current_phrase = recognize_speech_type_in_id.value
    if(recognize_speech_phrases_array.length == 0) {
        new_phrase = "NOTHING TO REJECT"
    }
    else if (current_phrase == "NOTHING TO REJECT") {} //leave the same
    else if (current_phrase.startsWith("INVALID: ")) {
        new_phrase = replace_substrings(current_phrase, "INVALID: ", "REJECT: ")
    }
    else if (current_phrase.startsWith("REJECT: ")) {} //leave the same
    else {
        new_phrase = "REJECT: " + current_phrase
        recognize_speech_phrases_array.pop()
    }
    recognize_speech_type_in_id.value = new_phrase
}

window.sr_reject = sr_reject
*/

function sr_current_prompt(){
    let prompt = recognize_speech_prompt
    if (Array.isArray(prompt)) {
        if(recognize_speech_phrases_array.length >= prompt.length) {
            prompt = last(prompt)
        }
        else { prompt = prompt[recognize_speech_phrases_array.length] }
    }
    return prompt
}

function sr_display_prompt(){
    sr_prompt_id.innerHTML = sr_current_prompt()
}


function recognize_speech({
    title="Recognize Speech", prompt="",
    //only_once=true, now integer on finish_phrase
    click_to_talk=true,
    width=430, height=270, x=400, y=200,
    background_color="rgb(238, 238, 238)",
    phrase_callback=recognize_speech_default_phrase_callback,
    finish_callback=null,   //this fn called only when we know we're done
    finish_phrase=1,        //used for finish button label or an integer for how many to collect,
                            //or a fn, passed the phrase, and return true to mean done.
                            //if this fn returns true, the cur phrase does not go in the result.
    } = {}) {
    if (typeof(finish_phrase) == "number"){
        if (finish_phrase < 1) {
            dde_error("recognize_speech passed invalid finish_phrase of: " + finish_phrase +
                      '.<br/>It must be a positive integer or a string of a phrase that finishes input.')
        }
    }
    let click_to_talk_html = ""
    if (click_to_talk) {
        click_to_talk_html =  "<input type='button' value='Click to talk' style='margin:10px;vertical-align:top;'/>"
    }
    recognize_speech_phrase_callback = phrase_callback
    recognize_speech_finish_callback = finish_callback
    recognize_speech_phrases_array   = []
    recognize_speech_finish_phrase   = finish_phrase
    recognize_speech_prompt          = prompt
    recognize_speech_click_to_talk = click_to_talk
    let content = "<div id='sr_prompt_id'>" + sr_current_prompt() + "</div>" +
                click_to_talk_html +
                "<img  id='recognize_speech_img_id' src='mic.gif'/> " +
                "<span id='recognize_speech_instructions_id'><br/></span><br/> " + //must use a full close tag for span here because HTML is broken
                "<br/>OR: type in text and hit ENTER.<br/>" +
                "<input id='recognize_speech_type_in_id' autofocus style='width:330px;font-size:16px;margin:5px;' onkeypress='sr_onkeypress(event)'/> " +
                sr_reject_html() +
                "<div id=sr_finish_help_id>" + sr_finish_help() + "</div>"
    recognize_speech_window_index =
    show_window({content: content,
                 title: title,
                 width: width, height: height, x: x, y: y,
                 background_color: background_color,
                 //callback only would ever get called if there's a click-to-talk button
                 callback: "window.start_recognition" //start_recognition //called from sandbox initially
    })
    if (!click_to_talk) { start_recognition() }
}

window.recognize_speech = recognize_speech
