/**
 * Created by Fry on 4/17/16.
 */
var ipcRenderer = require('electron').ipcRenderer
var request = require('request')

ipcRenderer.on('record_dde_window_size', function(event){
    //onsole.log("top of on record_window_size")
    persistent_values.dde_window_x      = window.screenX
    persistent_values.dde_window_y      = window.screenY
    persistent_values.dde_window_width  = window.outerWidth
    persistent_values.dde_window_height = window.outerHeight
    persistent_save()
});

//never called
window.set_dde_window_size_to_persistent_values = function(){
    ipcRenderer.send('set_dde_window_size',
                        persistent_get("dde_window_x"),
                        persistent_get("dde_window_y"),
                        persistent_get("dde_window_width"),
                        persistent_get("dde_window_height"))
}

//_________show_window and helper fns__________
//get the value of the path in the UI.
window.get_in_ui = function(path_string){
    //return value_of_path(path_string) //fails on getting svg attributes,
    //and returns strings for numbers.
    let path_elts = path_string.split(".")
    let the_loc = window
    for (var i = 0; i < path_elts.length; i++){
        var path_elt = path_elts[i]
        if (i === (path_elts.length - 1)){ //on last elt so set it
            if( // the_loc.hasOwnProperty("attributes") /doesn't work
                the_loc.hasAttributes && //note if the_loc is the global obj, it doesn't have a field of hasAttributes
                the_loc.hasAttributes() &&
                the_loc.attributes.hasOwnProperty(path_elt)) {
                let result = the_loc.getAttribute(path_elt)
                if ((typeof(result) === "string") && (is_string_a_number(result))) {
                    return parseFloat(result)
                }
                else { return result }

            } //necessary for "active" attributes like cx in svg ellipse, in order to actually get the real value of  "cx" property
            else if(the_loc[path_elt] !== undefined) { //hits when path_elt is "value"
                let result = the_loc[path_elt]
                if ((typeof(result) === "string") && (is_string_a_number(result))) {
                    return parseFloat(result)
                }
                else { return result }
            }
            else {
                let result = the_loc.getAttribute(path_elt)
                if ((typeof(result) === "string") && (is_string_a_number(result))) {
                    return parseFloat(result)
                }
                else { return result }
            }
        }
        else {
            the_loc = the_loc[path_elt]
        }
    }
}


window.set_in_ui = function(path_string, value){
    let path_elts = path_string.split(".")
    let the_loc = window
    for (var i = 0; i < path_elts.length; i++){
        var path_elt = path_elts[i]
        if (i == (path_elts.length - 1)){ //on last elt so set it
            if( // the_loc.hasOwnProperty("attributes") /doesn't work
               the_loc.hasAttributes() &&
               the_loc.attributes.hasOwnProperty(path_elt)) {
                    the_loc.setAttribute(path_elt, value)
            } //necessary for "active" attributes like cx in svg ellipse, in order to actually change the visible appearance of the ellipse
            else { the_loc[path_elt] = value }
        }
        else {
            the_loc = the_loc[path_elt]
        }
    }
}



window.remove_in_ui = function(path_string){
        let elt = value_of_path(path_string)
        elt.remove()
}

window.replace_in_ui = function(path_string, new_html){
    let elt = value_of_path(path_string)
    $(elt).replaceWith(new_html)
}

function html_to_tag_name(html){
    if (html.length < 2) { return null }
    var start_pos = 0
    if (html[0] == "<") start_pos = 1
    var end_pos = html.indexOf(" ")
    if (end_pos == -1) end_pos = html.length
    let result = html.substring(start_pos, end_pos)
    if      (result.endsWith("/>")) result = result.substring(0, result.length - 2)
    else if (result.endsWith(">"))  result = result.substring(0, result.length - 1)
    return  result.trim()
}

window.html_to_tag_name = html_to_tag_name

//returns an array of arrays.
// the Inner array has 2 elts, a string of the attribute name
//and a string of the attribute value
function html_attributes_and_values(html){
    html = html.trim()
    if (html.length < 3) { return null }
    let start_pos = 0
    if (html[0] == "<") {
        start_pos = html.indexOf(" ")
        if (start_pos == -1) return []
    }
    let end_pos = html.length
    if (last(html) == ">") end_pos = end_pos - 1
    if (html[end_pos - 1] == "/") end_pos = end_pos - 1
    let attr_string = html.substring(start_pos, end_pos)
    attr_string.trim()
    let result = []
    /*//let pairs = attr_string.split(" ")
    for(let pair of pairs){
        pair = pair.trim()
        if (pair.length > 2){
            let name_val = pair.trim().split("=")
            let name = name_val[0].trim()
            let val  = name_val[1].trim()
            //cut off quotes from val if any
            let val_start = 0
            if (["'", '"', "`"].includes(val[0])) val_start = 1
            let val_end = val.length
            if (["'", '"', "`"].includes(last(val))) val_end = val_end - 1
            val = val.substring(val_start, val_end)
            result.push([name, val])
        }
    }*/
    var state = "before_name"
    var name = ""
    var start_token = 0
    var string_delim = null
    for(let i = 0; i < attr_string.length; i++){
      let char = attr_string[i]
      if (state == "before_name"){
          if (char == " ") {}
          else if (char == "/") break;
          else if (char == ">") break;
          else { start_token = i; state = "in_name"}
      }
      else if (state == "in_name") {
          if (char == "=") {
             name = attr_string.substring(start_token, i)
             state = "in_val"
             start_token = i + 1
          }
      }
      else if (state == "in_val"){
          if ((start_token == i) && ["'", '"', "`"].includes(char)){
              state = "in_string"
              start_token += 1
              string_delim = char
          }
          else if (char == " ") {
              val = attr_string.substring(start_token, i)
              result.push([name, val])
              state = "before_name"
          }
      }
      else if (state == "in_string"){ //pretend no backslashed string delimiters.
          if (char == string_delim) {
              val = attr_string.substring(start_token, i)
              if (val.length > 0) {
                result.push([name, val])
              }
              //else we only had "" for the val so just ignore it.
              state = "before_name"
          }
      }
      else { shouldnt("in html_attributes_and_values with illegal state of: " + state) }
    }
    return result
}

window.html_attributes_and_values = html_attributes_and_values

//input" '<foo a="3"> bar </foo>'  output: " bar "
function html_content(html){
    html = html.trim()
    let close_angle_pos = html.indexOf(">")
    if(close_angle_pos == html.length - 1) { return "" }
    else {
        let open_angle_pos = html.indexOf("<", 1)
        if(open_angle_pos == -1) { return "" } //actually this means the html is invalid syntax
        else { return html.substring(close_angle_pos + 1, open_angle_pos) }
    }
}
window.html_content = html_content




//___________SOUND__________
//speak now in out.js (sep 10, 2019)
//________recognize_speech_____________
//all these vars meaningful in ui only.
/*
window.recognition = null
window.recognize_speech_window_index    = null
window.recognize_speech_phrase_callback = null
window.recognize_speech_finish_callback = null
window.recognize_speech_only_once       = null
window.recognize_speech_click_to_talk   = null
window.recognize_speech_last_text       = null
window.recognize_speech_last_confidence = null
window.recognize_speech_finish_array    = []
window.recognize_speech_finish_phrase   = "finish" //set by recognize_speech ui

function init_recognize_speech(){
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart  = function(event) {
        recognize_speech_img_id.src = 'mic-animate.gif';
        let instructions
        if ( recognize_speech_only_once ) { instructions = "Speak now.<br/>Be quiet to finish.<br/>" }
        else {
            instructions = "Speak now.<br/>" +
                           "Pause to let DDE process your phrase.<br/>" +
                           'Say <b>' + recognize_speech_finish_phrase + '</b> to end recognition.'
        }
        recognize_speech_instructions_id.innerHTML = instructions
    }

    recognition.onresult = function(event) {
        //out('recognize_speech top of onresult');
        recognize_speech_img_id.src = 'mic.gif';
        recognize_speech_instructions_id.innerHTML = "Stop talking"
        recognize_speech_last_text       = event.results[0][0].transcript //event_to_text(event)
        recognize_speech_last_confidence = event.results[0][0].confidence
        recognize_speech_finish_array.push([recognize_speech_last_text, recognize_speech_last_confidence])
        //out("recognized speech: " + recognize_speech_last_text)
        if (!recognize_speech_only_once && (recognize_speech_last_text == recognize_speech_finish_phrase)){
        }
        else if(recognize_speech_phrase_callback) {
            recognize_speech_phrase_callback(
                                 recognize_speech_last_text,
                                 recognize_speech_last_confidence)
        }
        //typed_input_id.value = text
    }
    
    recognition.onend    = function(event) {
        //out('recognize_speech top of onend');
        if (recognize_speech_only_once) { SW.close_window(recognize_speech_window_index) }
        else if (recognize_speech_last_text == recognize_speech_finish_phrase){
            Sw.close_window(recognize_speech_window_index)
            if (recognize_speech_finish_callback){
                recognize_speech_finish_callback(recognize_speech_finish_array)
            }
        }
        else if (recognize_speech_click_to_talk){
            recognize_speech_img_id.src = 'mic.gif';
            recognize_speech_instructions_id.innerHTML = ""
        }
        //Note that its hard to turn off the calling of onstart when the user just closes the
        //window via the window close box. This will do it.
        //but bware, it does NOT call the finish_callback, rather closing the window
        //is like a cancel, ie do nothing.
        else if (is_window_shown(recognize_speech_window_index)){ //more than once AND don't have to click to talk
            start_recognition() //this will set the gif and the instructions
        }
    }

    recognition.onerror  = function(event) {
        if (window["recognize_speech_img_id"]){
            recognize_speech_img_id.src = 'mic.gif';
            recognize_speech_instructions_id.innerHTML = "Stop talking"
        }
        if (is_window_shown(recognize_speech_window_index)){ //don't show this error message if the user closed the window
            out("onerror called with: " + event.error, "red")
        }
    }
} //end init_recognize_speech
//window.init_recognize_speech = init_recognize_speech
//public
function recognize_speech_default_phrase_callback(text, confidence){
    out("text: " + text + "<br/>confidence: " + confidence.toFixed(2))
}
window.recognize_speech_default_phrase_callback = recognize_speech_default_phrase_callback

function recognize_speech({title="Recognize Speech", prompt="",
                           only_once=true, click_to_talk=true,
                           width=400, height=180, x=400, y=200,
                           background_color="rgb(238, 238, 238)",
                           phrase_callback=recognize_speech_default_phrase_callback,
                           finish_callback=null,   //unused if only_once=true
                           finish_phrase="finish", //unused if only_once=true
                           show_window_callback="system_use_only"}={}){
        init_recognize_speech()
        recognize_speech_phrase_callback = phrase_callback
        recognize_speech_finish_callback = finish_callback

        let click_to_talk_html = ""
        if (click_to_talk) {
            click_to_talk_html =  "<input type='button' value='Click to talk'/><br/>"
        }
        //note: this show_window is evaled FIRST (and only) in the ui, so the phrase_callback should be a callback_number
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
                        callback: show_window_callback //start_recognition //called from sandbox initially
                        })
        recognize_speech_click_to_talk   = click_to_talk
        if (!click_to_talk) { start_recognition() }
}

window.recognize_speech = recognize_speech

function start_recognition(){
       recognition.start()
}
window.start_recognition = start_recognition
*/

//_______end Chrome Apps recognize_speech_______
//Google cloud rocognize speech
// started from https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/master/speech/recognize.js
/*function streamingMicRecognize() {
    const record = require('node-record-lpcm16'); // [START speech_streaming_mic_recognize]
    const Speech = require('@google-cloud/speech'); // Imports the Google Cloud client library
    //const speech = Speech() // Instantiates a client
    const my_path = adjust_path_to_os(__dirname + '/dexter-dev-env-code.json')
    const speech = Speech({
        projectId: 'dexter-dev-env',
        keyFilename: my_path
    })

    //from https://github.com/GoogleCloudPlatform/google-cloud-node#cloud-speech-alpha
    //const speechClient = speech({
    //    projectId: 'dexter-dev-env',
    //   keyFilename:  adjust_path_to_os(__dirname + '/dexter-dev-env-code.json')
    //})

    const request = { config: { encoding: 'LINEAR16',  sampleRate: 16000 },
                      singleUtterance: false,
                      interimResults: false,
                      verbose: true};
    // Create a recognize stream
    const recognizeStream = speech.createRecognizeStream(request)
            .on('error', console.error)
            .on('data', function(data){console.log(data)})
              //process.stdout.write(data.results)

    // Start recording and send the microphone input to the Speech API
    record.start({
        sampleRate: 16000,
        threshold: 0
    }).pipe(recognizeStream);
}

window.streamingMicRecognize = streamingMicRecognize
*/



/* a too low volume beep but has a nice tone and "echo" effect.
 //from: http://stackoverflow.com/questions/879152/how-do-i-make-javascript-beep
 var beep_snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");

 function beep_once(){
 beep_snd.play();
 }
 */
//________show_page__________
/* The opened window does not show the URL and does not have back/forward buttons.
 You can get that with
 var {shell} = require("electron")
shell.openExternal("http://192.168.1.142")
that opened window shows the url, has back/forward buttons.
But it opens in the default browser for the computer.
(on Mac this is Apple's browser, not chrome.)
 */

/* uses Electron and main porcess. but not much advnatage to that,
and js window.open is stanard js, plus returns an object
that I can call win.closed(), win.focus(), win.blur(), win.print(), win.location, win.closed
on

function show_page(url, options={x:0, y:0, width: 800, height: 600}){
    if (url.indexOf("://") == -1){
        url = "http://" + url
    }
    if (!options) { options = {} }
    //electron's BrowserWindow options must have both x & y or neighter.
    //that's an unnecessary restriction so I fix this deficiency in electron below.
    //if (options.x || (options.x == 0)) {
    //    if (!options.y && (options.y != 0)) { options.y = 0 }
    //}
    //if (options.y || (options.y == 0)) {
    //    if (!options.x  && (options.x != 0)) { options.x = 0 }
    //}
    if (!options.x)      { options.x = 0 }
    if (!options.y)      { options.y = 0 }
    if (!options.width)  { options.width  = 800 } //does not allow width to be 0. Is that good? a 0 width means the window is invisible
    if (!options.height) { options.height = 600 } //does not allow width to be 0. Is that good? a 0 width means the window is invisible
    if (!options.title)  { options.title = url }
   // window.open(url) //show_url(url) //fails in electron 1 but works in later versions
    ipcRenderer.sendSync('show_page', url, options) //see main.js "show_page"
    return url
}*/
/* window.open fails to use its options  correctly due to Google bugs
 since 2012. https://bugs.chromium.org/p/chromium/issues/detail?id=137681
 so switch back to electron solution but use it in rennder process,
 not main process.

function show_page(url, options={x:0, y:0, width: 800, height: 600}){
    if (url.indexOf("://") == -1){
        url = "http://" + url
    }
    if(!options) {
        options = {x:0, y:0, width: 800, height: 600}
    }
    let options_str = "left="    + options.x +
                      ",top="    + options.y +
                      ",width="  + options.width +
                      ",height=" + options.height
    //window.open is documented to take a middle arg of "name" but that
    //looks useless for our purposes at least.
    return window.open(url, options_str)
}*/
/* return value good for:
bw1.loadURL("http://hdrobotic.com")
bw1.loadFile("somefilename")
bw1.close()
bw1.getURL()
bw1.blur()
bw1.focus()
 */
function show_page(url, options={x:0, y:0, width: 800, height: 600}){
    if (url.indexOf("://") == -1){
        url = "http://" + url
    }
    if(!options) {
        options = {x:0, y:0, width: 800, height: 600}
    }
    var bw = new BrowserWindow(options)
    bw.loadURL(url)
    return bw
}



window.show_page = show_page

//unlike show_page, you can't set size, x, y, BUT it opens the page
//in your default browser and you see the url and you can edit the url
//and continue to browse, because it is a regular browser window.
//it will probably add a tab to your already open browser window.
function browse_page(url){
    require("electron").shell.openExternal(url)
}

window.browse_page = browse_page


/*
function get_page(url, callback=out, error_callback=get_page_error_callback){//in sandbox, callback is a fn, in ui, its an integer
    if (in_ui()){
        try{
            fetch(url)
                .then(function(response) {
                    if (response.ok) {  return response.text()  }
                    else {
                        cbr.perform_callback(error_callback, url, response.statusText)

                    }
                }).then(function(text){
                //out("in 2nd then")
                //out(text)
                cbr.perform_callback(callback, text)
            }).catch(function(err) { //this does not catch error 404 file not found. Stupid!
                cbr.perform_callback(error_callback, url, err.message)
            })
        }
        catch(e) {
            cbr.perform_callback(error_callback, url, err)
        }
    }
    else {
        var callback_number = cbr.store_callback(callback)
        var error_callback_number = cbr.store_callback(error_callback)
        post_to_ui({name: "get_page", url: url, callback: callback_number, error_callback: error_callback_number})
    }
}*/


//get_page_async now in storage.js and part of job engine.

//synchronous.
//bret's recommended I use npm sync-request BUT that takes different
//args/options than standard request which I use for get_page_async
//and I don't want users to have to use different args for the 2 fns,
//so I stick with my "main.js" trick for async here.
//Always returns a string.
//If there's an error, the string starts with: "Error: "
/*
function get_page(url_or_options){
        //onsole.log("rend get_page sync: " + url_or_options)
        if(platform === "node"){ //in job engine. URL better be to 127.0.0.1, "localhost"
            //or the ip of the dexter its running on or it will error
            let url
            let options
            if(typeof(url_or_options) === "string"){
                url = url_or_options
                options = undefined
            }
            else {
                url = url_or_options.url //got an object
                options = url_or_options
            }
            let content = fs.readFileSync(url, options)
            return content
        }
        else {
            const reply = ipcRenderer.sendSync('get_page', url_or_options) //see main.js "get_page"
            //onsole.log("rend get_page sync back from: " + url_or_options + " with: " + reply.substring(0, 10))
            return reply
        }
}
window.get_page = get_page
 */


//returns null if it can't get the data, else an array
//of 2 strings a la ["1.0.2, "2017-03-23T13:02:59"]
window.latest_release_version_and_date = function(callback){
    //hitting the below url from a browser works, but not programmatically
    //unless you have a header of the below usr agent.
    const browser_user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    get_page_async({url: "https://api.github.com/repos/cfry/dde/releases/latest",
                    headers: {"user-agent": browser_user_agent}},
                   callback)
}

function make_url(url, arguments) {
    let index_of_protocol = url.indexOf("://")
    if ((index_of_protocol == -1) || (index_of_protocol > 16)) {
        url = "http://" + url
    }
    if (arguments){
        let arg_string = ""
        if (typeof(arguments) == "object") { //presume we've got a literal object of args
           var on_first = true
           for (let key in arguments){
               let val = arguments[key]
               arg_string += (on_first ? "" : "&") + key + "=" + val
               on_first = false
           }
        }
        else if (typeof(arguments) == "string") { arg_string = arguments }
        else {
            dde_error("The 2nd argument to make_url, if passed, should be a string or a literal object, " +
                      "but it is neither: " + arguments)
        }
        if (arg_string.length > 0){
            if (last(url) == "?"){ url = url.substring(0, url.length - 1) }
            if (arg_string[0] == "?") { arg_string = arg_string.substring(1) }
            url = url + "?" + arg_string
        }
    }
    return url
}
window.make_url = make_url

//hack! no good way to do this but go after an existing elt that uses
//a particular "class" that I'm interrested in, and grab its
//css. Need to use jquery as body_id.style.background-color doesn't get it
function window_frame_background_color(){
    return $("#body_id").css("background-color") // ie "rgb(123, 45, 67))
}

function pane_header_background_color(){
    return $(".pane_header_wrapper").css("background-color")
}

function menu_background_color(){
    return $("#js_menubar_id").css("background-color") // ie "rgb(123, 45, 67))
}

function button_background_color(){
    return $("#eval_id").css("background-color") // ie "rgb(123, 45, 67))
}
//beware property_name muxt be camel cased (lower case first char, no dashes
//so background_color mush be represented as backgroundColor.
function set_css_property(selector, property_name, new_value){
    let sss = document.styleSheets
    for (let ss_index = 0; ss_index < sss.length; ss_index++){
        let ss = sss[ss_index]
        if (ss.href && ss.href.endsWith("styles.css")) { //dde's style sheet name
            let the_rules = ss.rules
            for(let rule_index = 0; rule_index < the_rules.length; rule_index++){
                let the_rule = the_rules[rule_index]
                if (the_rule.selectorText == selector){
                    the_rule.style[property_name] = new_value
                    return
                }
            }
        }
    }
}

function set_css_properties(css_string){
    let head = document.getElementsByTagName('head')[0]
    let sty  = document.createElement('style');
    sty.innerHTML = css_string
    head.append(sty);
}

function set_window_frame_background_color(new_color){
    $(".window_frame").css("background-color", new_color)
    set_css_property(".window_frame",
                     "backgroundColor", //must use the camel cased version of the name, no dashes
                      new_color)
}
window.set_window_frame_background_color = set_window_frame_background_color


function set_pane_header_background_color(new_color){
    $(".pane_header_wrapper").css("background-color", new_color)
    set_css_property(".pane_header_wrapper",
                     "backgroundColor", //must use the camel cased version of the name, no dashes
        new_color)
}
window.set_pane_header_background_color = set_pane_header_background_color

function set_menu_background_color(new_color){
    $(".dde_menu").css("background-color", new_color)
    set_css_property(".dde_menu",
                     "backgroundColor", //must use the camel cased version of the name, no dashes
                     new_color)
}
window.set_menu_background_color = set_menu_background_color

function set_button_background_color(new_color){
    $("button").css("background-color", new_color)
    set_css_property("button",
                     "backgroundColor", //must use the camel cased version of the name, no dashes
                     new_color)

    $("input[type=button]").css("background-color", new_color)
    set_css_property('input[type="submit"]', //submit must be double quoted
        "backgroundColor", //must use the camel cased version of the name, no dashes
        new_color)

}
window.set_button_background_color = set_button_background_color


function insert_color_cb(vals){
    if(vals.clicked_button_value == "Insert Color"){
        let new_color = vals.my_color
        if(window.insert_color_cb_remove_sharp_sign){
            new_color = new_color.substring(1)
        }
        if (window.insert_color_cb_add_quotes) {
            new_color = window.insert_color_cb_add_quotes + new_color +
                        window.insert_color_cb_add_quotes
        }
        Editor.insert(new_color)
    }
}

window.insert_color_cb = insert_color_cb
window.insert_color_cb_remove_sharp_sign = false
window.insert_color_cb_add_quotes         = false

function insert_color(){
    let orig_color = Editor.get_javascript(true).trim()
    let hex_color_name_maybe = Series.color_name_to_hex(orig_color) //if orig_color == "green" then this wil return something like "#00FF00"
    if (hex_color_name_maybe) { orig_color = hex_color_name_maybe}
    if (orig_color == "") { orig_color = "#FFFFFF" } //white
    if (starts_with_one_of(orig_color, ["'", '"'])) {
        window.insert_color_cb_add_quotes =  orig_color[0]
        orig_color = orig_color.substring(1, orig_color.length - 1) //assume it has ending quote too
    }
    else { window.insert_color_cb_add_quotes = false }
    if (starts_with_one_of(orig_color, ["#", "rgb"])) {
        window.insert_color_cb_remove_sharp_sign = false
    }
    //else { orig_color = "#" + orig_color
    //    window.insert_color_cb_remove_sharp_sign = true
    //}
    show_window(
        {title: "Choose a color to insert",
            content: '<ol><li>Click <input type="color" name="my_color" value="' +
            orig_color + '"/> to edit color.</li>' +
            '<li>Select a color and <br/>close the pop up color dialog.</li>' +
            '<li>Click <input type="submit" value="Cancel"/> or ' +
            '<input type="submit" value="Insert Color"/></li></ul>',
            width:300, height:175, x:100, y:100,
            callback: insert_color_cb})
}
window.insert_color = insert_color

var prompt_async_cb
function prompt_async({title = "DDE Prompt",
                       doc = "Enter string.", //can be any HTML
                       default_value = "",
                       x=200, y=200, width=280, height=120,
                       callback = out}={}){
      prompt_async_cb = function(vals){
      if(vals.clicked_button_value === "OK"){
          callback.call(null, vals.input)
      }
      else if(vals.clicked_button_value === "Cancel"){
            callback.call(null, null)
      }
    }
    show_window({title: title,
                 content:
doc + `<br/><input name="input" type="text" size="40" style="margin:5px;" value="` +
       default_value + `"/><br/>
       <input type="submit" name="Cancel" value="Cancel"/>
       <input type="submit" name="OK"     value="OK"     style="margin-left: 20px;"/>`,
                 x:x, y:y, width:width, height:height,
                 trim_strings: false, //allow user to supply whitespace
                 callback:  prompt_async_cb
                 })
}


//fixes broken Electron prompt See main.js for more code and doc
//ue to work.
// https://github.com/konsumer/electron-prompt claims to work, but I can't get its tricks to sep 4, 2019
/*window.prompt = function(description="", default_value=""){
    let obj
    if(typeof(description) == "string"){
        obj = {description: description,
               default_value: default_value,
              }
    }
    else { obj = description }
    if(!obj.hasOwnProperty("title"))                         { obj.title = "DDE Prompt" }
    if(!obj.hasOwnProperty("description"))                   { obj.description = "" }
    if(!obj.hasOwnProperty("default_value"))                 { obj.default_value = "" }
    if(!obj.hasOwnProperty("x"))                             { obj.x = 200 }
    if(!obj.hasOwnProperty("y"))                             { obj.y = 200 }
    if(!obj.hasOwnProperty("width"))                         { obj.width =  400 }
    if(!obj.hasOwnProperty("height"))                        { obj.height = 200 }
    if(!obj.hasOwnProperty("color"))                         { obj.color = "black" }
    if(!obj.hasOwnProperty("background_color"))              { obj.background_color = "#DDDDDD" }
    if(!obj.hasOwnProperty("window_frame_background_color")) { obj.window_frame_background_color = window_frame_background_color() }
    if(!obj.hasOwnProperty("button_background_color"))       { obj.button_background_color = button_background_color() }
    obj.x = obj.x + persistent_get("dde_window_x") //make x and y relative to the dde window.
    obj.y = obj.y + persistent_get("dde_window_y")
    console.log(obj)
    let return_val = ipcRenderer.sendSync('prompt', obj)

    return return_val
}*/

var {persistent_get, persistent_set} = require("./core/storage")
var {function_name, is_string_a_integer, is_string_a_number, starts_with_one_of,
    stringify_value, value_of_path} = require("./core/utils.js")
var {write_to_stdout} = require("./core/stdio.js")
var { BrowserWindow } = require('@electron/remote')

