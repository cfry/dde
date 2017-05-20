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

function s2t_init(){
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

s2t_init()


function sr_on_data(data){
    //out("data: " + data.speechEventType)
    switch (data.speechEventType) { //the only value is "SPEECH_EVENT_UNSPECIFIED"
        case "START_OF_SPEECH":
            out("START_OF_SPEECH")
            break;
        case "END_OF_SPEECH":
            out("END_OF_SPEECH")
            set_mic_and_instructions()
            break;
        case "END_OF_UTTERANCE":
            out("END_OF_UTTERANCE")
            set_mic_and_instructions()
        case "END_OF_AUDIO":
            out("END_OF_AUDIO")
            break;
        case "SPEECH_EVENT_UNSPECIFIED":
            set_mic_and_instructions() //don't talk
            if(data && (data.results.length > 0)){
                // out("got non zero text, calling s2t.stop()")
                // s2t.stop()
                recognize_speech_last_text = data.results[0].transcript.trim() //the 2nd through nth recos start with sapce,
                  //which would be good for contnuous dictation, but bad for recognizing the ending phrase.
                  //I could get clever and allow, but see how always trimming works out in practice.
                //out("Recognized: " + recognize_speech_last_text)
                sr_result(data)
                if (recognize_speech_only_once || (recognize_speech_last_text == recognize_speech_finish_phrase)) {
                    sr_end(data) //close window
                }
                else if (!recognize_speech_click_to_talk) {
                    sr_start()
                }
                else { //click to talk, so destroy so we won't be listening until next click to talk
                        //sourceStream.destroy()
                        //sourceStream.suspend()
                        //recognizeStream.destroy()
                        s2t.stop()
                }
            }
            break;
            default:
                shouldnt("recognize_speech ondata got unhandled speechEventType: " + data.speechEventType)
    }
}




//all these vars meaningful in ui only.
var recognition = null
var recognize_speech_window_index    = null
var recognize_speech_phrase_callback = null
var recognize_speech_finish_callback = null
var recognize_speech_only_once       = null
var recognize_speech_click_to_talk   = null
var recognize_speech_last_text       = null
var recognize_speech_last_confidence = null
var recognize_speech_finish_array    = []
var recognize_speech_finish_phrase   = "finish" //set by recognize_speech ui
var recognize_speech_only_once       = false

function start_recognition(){ sr_start() }

window.start_recognition = start_recognition

function sr_start() {
    //out("top of sr_start()")
    let instructions
    if ( recognize_speech_only_once ) { instructions = "Speak now.<br/>Be quiet to finish.<br/>" }
    else {
        instructions = "Speak now.<br/>" +
            "Pause to let DDE process your phrase.<br/>" +
            'Say <b>' + recognize_speech_finish_phrase + '</b> to end recognition.'
    }
    set_mic_and_instructions(instructions)
    //out("calling s2t.start()")
    s2t.start()
}

function sr_result(data) {
    //out('recognize_speech top of onresult');
    //recognize_speech_instructions_id.innerHTML = "Stop talking"
    recognize_speech_last_text       = data.results[0].transcript.trim() //event_to_text(event)
    recognize_speech_last_confidence = data.results[0].confidence //no confidence in Bret's new code
    recognize_speech_finish_array.push([recognize_speech_last_text, recognize_speech_last_confidence])
    //out("recognized speech--: " + recognize_speech_last_text)
    if (!recognize_speech_only_once && (recognize_speech_last_text == recognize_speech_finish_phrase)){
        out("recognized text: " + recognize_speech_last_text + "<br/>confidence: " + recognize_speech_last_confidence)
    }
    else if(recognize_speech_phrase_callback) {
        recognize_speech_phrase_callback(
            recognize_speech_last_text,
            recognize_speech_last_confidence
        )
    }
}

function sr_error(data) {
    set_mic_and_instructions() //don't talk
    if (is_window_shown(recognize_speech_window_index)){ //don't show this error message if the user closed the window
        out("onerror called with: " + data, "red")
    }
    s2t.stop()
}

//called only when this dialog is all over. no more reco will be done.
function sr_end(data) {
    close_window(recognize_speech_window_index)
    if ((recognize_speech_last_text == recognize_speech_finish_phrase) &&
        !recognize_speech_only_once &&
         recognize_speech_finish_callback){
            recognize_speech_finish_callback(recognize_speech_finish_array)
    }
    s2t.stop()
}

function set_mic_and_instructions(instructions="Don't talk"){
    //out("set_mic_and_instructions passed: " + instructions)
    if (window["recognize_speech_img_id"]) { //window is up
        var the_gif
        if (instructions == "Don't talk") { the_gif = "mic.gif" }
        else                              { the_gif = "mic-animate.gif"}
        recognize_speech_img_id.src = the_gif
        if ((instructions == "Don't talk") && recognize_speech_click_to_talk){
            instructions = "" //since the click to talk button is on the screen, it is unncesssary and confusing to have "Don't talk"  also displayed
        }
        //out("set_mic_and_instructions to: " + instructions)
        recognize_speech_instructions_id.innerHTML = instructions
    }
}

//public
function recognize_speech_default_phrase_callback(text, confidence){
    out("recognized text: " + text + "<br/>confidence: " + confidence.toFixed(2))
}
window.recognize_speech_default_phrase_callback = recognize_speech_default_phrase_callback

function recognize_speech({
    title="Recognize Speech", prompt="",
    only_once=true, click_to_talk=true,
    width=400, height=200, x=400, y=200,
    background_color="rgb(238, 238, 238)",
    phrase_callback=recognize_speech_default_phrase_callback,
    finish_callback=null,   //unused if only_once=true
    finish_phrase="finish" //unused if only_once=true
    }) {
    //s2t_init()
    let click_to_talk_html = ""
    if (click_to_talk) {
        click_to_talk_html =  "<input type='button' value='Click to talk' style='margin:10px;'/><br/>"
    }
    recognize_speech_phrase_callback = phrase_callback
    recognize_speech_finish_array  = []
    recognize_speech_finish_phrase = finish_phrase
    recognize_speech_only_once     = only_once
    recognize_speech_window_index =
        show_window({content: "<div>" + prompt   + "</div>" +
        click_to_talk_html +
        "<img id='recognize_speech_img_id' src='mic.gif'/>" +
        "<span id='recognize_speech_instructions_id'/>",
            title: title,
            width: width, height: height, x: x, y: y,
            background_color: background_color,
            //callback only would ever get called if there's a click-to-talk button
            callback: "window.start_recognition" //start_recognition //called from sandbox initially
        })
    recognize_speech_click_to_talk   = click_to_talk
    if (!click_to_talk) { start_recognition() }
}

window.recognize_speech = recognize_speech
