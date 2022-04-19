//__________out  and helper fns_______
//out itself is now defined in je_and_browser_code as it is called in the browser

//require("./je_and_browser_code.js") //don't set SW from this.
function format_text_for_code(text, code=null){
    if (code === null) {
        code = DDE_DB.persistent_get("default_out_code")
        if ((code === undefined) || (code === null) || (code == false)) { code = false }
    }
    if (code) { //cut off timing info: too confusing to see it.
        let timing_index = text.indexOf(" <span style='padding-left:50px;font-size:10px;'>")
        if (timing_index !== -1) { text = text.substring(0, timing_index) }
        text = Utils.replace_substrings(text, "<",   "&lt;")
        text = Utils.replace_substrings(text, ">",   "&gt;")
        text = Utils.replace_substrings(text, "\\\\n", "\n")
        text = "<pre><code>" + text + "</code></pre>"
    }
    return text
}

globalThis.format_text_for_code = format_text_for_code

/*
 StackTrace.get(function(sf){
 return sf.functionName == show_output
 })then(function(sf){
 var lineno = sf.lineNumber
 var colno  = sf.columnNumber
 }catch("errorcb")
 out_aux = function(text, color){
 */

//text is a string that represents a result from eval.
// It has been trimmed, and stringified, with <code> </code> wrapped around it probably.
//never passed 'dont_print, always prints <hr/> at end whereas regular output never does
//ui only
export function out_eval_result(text, color="#000000", src, src_label="The result of evaling JS"){
    if (text != '"dont_print"'){
        //var existing_temp = $("#temp")
        //if (existing_temp.length > 0){
        //    existing_temp.remove()
        //}
        let existing_temp_elts = []
        if(globalThis["document"]){
            existing_temp_elts = document.querySelectorAll("#temp")
        }
        for(let temp_elt of existing_temp_elts){ temp_elt.remove() }

        if (Utils.starts_with_one_of(text, ['"<svg ', '"<circle ', '"<ellipse ', '"<foreignObject ', '"<line ', '"<polygon ', '"<polyline ', '"<rect ', '"<text '])) {
            text = text.replace(/\</g, "&lt;") //so I can debug calls to svg_svg, svg_cirle ettc
        }
        if (color && (color != "#000000")){
            text = "<span style='color:" + color + ";'>" + text + "</span>"
        }
        text = format_text_for_code(text)
        let src_formatted = ""
        let src_formatted_suffix = "" //but could be "..."
        if(src) {
            src_formatted = src.trim()
            let src_first_newline = src_formatted.indexOf("\n")
            if (src_first_newline != -1) {
                src_formatted = src_formatted.substring(0, src_first_newline)
                src_formatted_suffix = "..."
            }
            if (src_formatted.length > 55) {
                src_formatted = src_formatted.substring(0, 55)
                src_formatted_suffix = "..."
            }
            src_formatted = Utils.replace_substrings(src_formatted, "<", "&lt;")
            src = Utils.replace_substrings(src, "'", "&apos;")
            src_formatted = " <code title='" + src + "'>&nbsp;" + src_formatted + src_formatted_suffix + "&nbsp;</code>"
        }
        //if (src_formatted == "") { console.log("_____out_eval_result passed src: " + src + " with empty string for src_formatted and text: " + text)}
        let the_html = "<fieldset><legend><i>" + src_label  + " </i>" + src_formatted + " <i>is...</i></legend>" +  text + "</fieldset>"
        SW.append_to_output(the_html)
    }
    //$('#js_textarea_id').focus() fails silently
    if(globalThis["document"]){
        let orig_focus_elt = document.activeElement
        if(orig_focus_elt.tagName != "BUTTON"){ //if user clicks eval button, it will be BUTTON
           //calling focus on a button draws a rect around it, not good.
           //if user hits return in cmd line, it will be INPUT,
           //Its not clear that this is worth doing at all.
            orig_focus_elt.focus()
        }
    }
    //if(Editor.get_cmd_selection().length > 0) { cmd_input_id.focus() }
    //else { myCodeMirror.focus() }
}

function get_output(){ //rather uncommon op, used only in SW.append_to_output
    return output_div_id.innerHTML
}

globalThis.get_output = get_output

//value can either be some single random js type, or a literal object
//with a field of speak_data, in which case we use that.
function stringify_for_speak(value, recursing=false){
    var result
    if ((typeof(value) == "object") && (value !== null) && value.hasOwnProperty("speak_data")){
        if (recursing) {
            dde_error('speak passed an invalid argument that is a literal object<br/>' +
                'that has a property of "speak_data" (normally valid)<br/>' +
                'but whose value itself is a literal object with a "speak_data" property<br/>' +
                'which can cause infinite recursion.')
        }
        else { return stringify_for_speak(value.speak_data, true) }
    }
    else if (typeof(value) == "string") { result = value }
    else if (value === undefined)       { result = "undefined" }
    else if (value instanceof Date){
        var mon   = value.getMonth()
        var day   = value.getDate()
        var year  = value.getFullYear()
        var hours = value.getHours()
        var mins  = value.getMinutes()
        if (mins == 0) { mins = "oclock, exactly" }
        else if(mins < 10) { mins = "oh " + mins }
        result    = Utils.month_names[mon] + ", " + day + ", " + year + ", " + hours + ", " + mins
        //don't say seconds because this is speech after all.
    }
    else if (Array.isArray(value)){
        result = ""
        for (var elt of value){
            result += stringify_for_speak(elt) + ", "
        }
    }
    else {
        result = JSON.stringify(value, null, 2)
        if (result == undefined){ //as happens at least for functions
            result = value.toString()
        }
    }
    return result
}

globalThis.stringify_for_speak = stringify_for_speak

function speak({speak_data = "hello", volume = 1.0, rate = 1.0, pitch = 1.0, lang = "en_US", voice = 0, callback = null, node_callback = null} = {}){
    if (arguments.length > 0){
        var speak_data = arguments[0] //, volume = 1.0, rate = 1.0, pitch = 1.0, lang = "en_US", voice = 0, callback = null
    }
    var text = stringify_for_speak(speak_data)
    if(globalThis.platform == "node"){
        let cmd_string = "espeak \"" + text + "\" -a "+ (volume*200) + " -p " + (pitch * 50) + " -s " + (rate * 37 + 130)
        if(node_callback) {
            exec(cmd_string, node_callback) //node_callback passed 3 args,
                                            // 1. an error obj (or null if no error)
                                            // 2. string of stdout
                                            // 3. string of stderr
          //see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
        }
        else {
            exec(cmd_string)
        }
    }
    else {
        var msg = new SpeechSynthesisUtterance();
        //var voices = globalThis.speechSynthesis.getVoices();
        //msg.voice = voices[10]; // Note: some voices don't support altering params
        //msg.voiceURI = 'native';
        msg.text   = text
        msg.volume = volume; // 0 to 1
        msg.rate   = rate;   // 0.1 to 10
        msg.pitch  = pitch;  // 0 to 2
        msg.lang   = lang;
        var voices = globalThis.speechSynthesis.getVoices();
        msg.voice  = voices[voice]; // voice is just an index into the voices array, 0 thru 3
        msg.onend  = callback //this callback takes 1 arg, an event.
        speechSynthesis.speak(msg);
        }
    return speak_data
}

globalThis.speak = speak

//______show_window_____
//output the "vals" to inspector or stdout.
//this use to be the default show_window callback
//good for debugging
export function show_window_values(vals){
    if(platform == "dde") { inspect(vals) }
    else {
        let str = JSON.stringify(vals)
        globalThis.write_to_stdout(str)
    }
}

function show_window({content = `<input type="submit" value="Done"/>`,
                      title = "DDE Information",
                      title_bar_height = 25,
                      title_bar_color = "#b8bbff",
                      width = 400, height = 400, //the outer width of the dialog. Content region is smaller
                      x = 200, y = 200,
                      resizable = true,
                      draggable = true,
                      background_color = "rgb(238, 238, 238)",
                      is_modal = false,
                      show_close_button = true,
                      show_collapse_button = true,
                      trim_strings = true,
                      window_class,
                      callback = null, //show_window_values,
                      close_same_titled_windows = true,
                      job_name = null, //this really is a param, but its only used internally with Human instructions and some browser interactions.
                      init_elt_id = null} = {}){
    //callback should be a string of the fn name or anonymous source.
    //onsole.log("top of show_window")
    if ((platform == "dde") && close_same_titled_windows){
        //this attempt to set a window to the loc of the prev window of the same title doesn't work,
        //but worse, sometimes sets the window to very small as it doesn't really find the window
        //sp just don't do it.
        let latest_win = SW.latest_window_of_title(title)
        if(latest_win){
            //x = Math.max(0, latest_win.offset().left) //user might have repositioned the old window. let's preserve that
            //y = Math.max(0, latest_win.offset().top)
            var style = globalThis.getComputedStyle(latest_win, null)
            x = parseInt(style.getPropertyValue("left"), 10)
            y = parseInt(style.getPropertyValue("top"),  10)
            width =  parseInt(style.getPropertyValue("width"), 10) //user might have resized the old window. let's preserve that
            height = parseInt(style.getPropertyValue("height"), 10)
            SW.close_window(title)
        }
    }
    //onsole.log("show_window after close_same_titled_windows")
    if ((arguments.length > 0) && (typeof(arguments[0]) == "string")){
        var content = arguments[0] //all the rest of the args will be bound to their defaults by the js calling method.
    }
    if (typeof(content) !== "string"){
        content = Utils.stringify_value(content)
    }
    //onsole.log("show_window before callback")
    if (typeof(callback) === "function"){
        let fn_name = callback.name
        if (fn_name && (fn_name != "")) {
            if(fn_name == "callback") { //careful, might be just JS being clever and not the actual name in the fn def
                fn_name = Utils.function_name(callback.toString()) //extracts real name if any
                if ((fn_name == "") || (fn_name == null)) { //nope, no actual name in fn
                    callback = callback.toString() //get the src of the anonymous fn
                }
                else { callback = fn_name }
            }
            else { callback = fn_name }
        }
        else { callback = callback.toString() } //using the src of an annonymous fn,
              //or, if callback passed in is a string, then this just sets callback back
              //to that same string.
    }
    if (!job_name){
        let latest_job = Job.job_id_to_job_instance(Job.job_id_base)
        if (latest_job) { job_name = latest_job.name }
        else { job_name = "" }
        //note that if there's no job name, that's ok for running a show_window in DDE
        //before you've made the first job. But in the browser, we are always running a job,
        //so the_job_name should never be null in the browser.
    }
    //onsole.log("middle of show_window")
    //var the_instruction_id = null
    //if(arguments[0]) {the_instruction_id =  arguments[0].the_instruction_id}
    //Warning: do not put newlines in the html for show_window as that will result in <br/> tags that
    //replace the newlines and thus screw up the html for the show_window.
    if(SW.window_index === null) { SW.window_index = 0 }
    else { SW.window_index += 1 }
    let the_sw_elt_id = 'show_window_' + SW.window_index + '_id'
    //let content_height = height - title_bar_height -21
    //let content_width  = width - 10
    content = '<div class="show_window_content" contentEditable="false" draggable="false"\n' +
              //'onresize="show_window_content_onresize(event)" ' +
        ' style="' +
        //'width:' + content_width + 'px; height:' + content_height + 'px; ' +
       // 'overflow:' + (resizable? "auto" : "visible") + '; resize:' + (resizable? "both" : "none") + "; " +
        'font-size:15px; padding:5px;\n' +

        'width:'    + width + 'px; height:' + (height - title_bar_height) + 'px;\n' +
        'overflow:' + (resizable? 'auto' : 'visible')                 + ';\n'   +
        'resize:'   + (resizable? 'both' : 'none')                    + ';\n'   +
        '">\n' +
        `<input type="hidden" name="window_callback_string" value='` + callback        + "'/>\n" +
        '<input type="hidden" name="trim_strings"           value="' + trim_strings    + '"/>\n' +
        '<input type="hidden" name="job_name"               value="' + job_name        + '"/>\n' +
        '<input type="hidden" name="show_window_elt_id"     value="' + the_sw_elt_id   + '"/>\n' +
        '<input type="hidden" name="window_index"           value="' + SW.window_index + '"/>\n' +
        content +
        '\n</div>\n' //to allow selection and copying of window content


    var show_window_html =
        '<dialog class="show_window"' +
        ' data-window_index="' + SW.window_index +
        '" id="' + the_sw_elt_id +
        //'" data-show_window_title="' + title +
        // '" ondragstart="sw_dragstart(event)' +
        '"\nstyle="padding:0px; right:none; margin:0px; position:fixed; z-index:100;' +
         ' left:' + x + 'px; top:' + y + 'px; ' +

        //'width:'    + width + 'px; height:' + height + 'px; ' +
        //'overflow:' + (resizable? "auto" : "visible") + "; " +
        //'resize:'   + (resizable? "both" : "none") + "; " +

        'background-color:' + background_color + //if the content div doesn't take up the whole rest of the window, its good if this covers that extra area below the content
        ';">' +
        sw_make_title_html(title, width, title_bar_height, title_bar_color, show_close_button, show_collapse_button) +
        '<div draggable="false" background-color:' + background_color + ';">\n' + content + '</div>' +
        '</dialog>'
    //onsole.log("show_window produced html: " + show_window_html)
    let props = {job_name: job_name, kind: "show_window", html: show_window_html, draggable: draggable,
                 is_modal: is_modal, init_elt_id: init_elt_id, window_index: SW.window_index,
                 close_same_titled_windows: close_same_titled_windows}
    //Warning: evaling the below will cause 2 copies of the the show_window code to go to the browser.
    //then we get TWO such elements in the browser (one invisible) but that screws up
    //getting the right one and breaks dropping a dragged show_window dialog. Yikes!
    //onsole.log("near bottom of show_window with show_window_html:" + show_window_html)
    if(platform == "dde") {
        SW.render_show_window(props)
    }
    else {
        //onsole.log("bottom of show_window writing to stdout")
        globalThis.write_to_stdout("<for_server>" + JSON.stringify(props) + "</for_server>")
    }
    return SW.window_index
}

globalThis.show_window = show_window

//can't get this to work well with shrinking the title bar below orig size.
//function show_window_content_onresize(event){ }
//module.exports.show_window_content_onresize = show_window_content_onresize

//if you change, this, also change get_show_window_title
function sw_make_title_html(title, title_bar_width, title_bar_height,  title_bar_color, show_close_button, show_collapse_button){
    if(title == "") { return "" } // with no title, there are no close nor collapse buttons and you can't drag it.
                                  //so its mostly good for "kiosk mode" type windows.
    else {
        let buttons = ""  // onclick="SW.sw_close(this)"  onclick="SW.sw_toggle(this)"
        if(show_close_button)    { buttons += '<button name="close_button"     title="close this window."                   style="float:right; background-color:#b8bbff; padding:0px; margin-top:0px;margin-left:5px;">X</button>' }
        if(show_collapse_button) { buttons += '<button onclick="SW.sw_toggle(this)" name="collapse_button"  title="Toggle the shrinking or expanding of this window." style="float:right; background-color:#b8bbff; padding:0px; margin-top:0px;margin-right:5px;">&#8679;</button>' //double headed updown arrow.
            //'<button onclick="function(event){ SW.sw_toggle(this, event)   }" ' + //"SW.sw_toggle(this)" ' +
            //                                             ' name="collapse_button"  title="toggle shrink/expand of this window." style="float:right; background-color:#b8bbff; padding:0px; margin-top:0px;margin-right:5px;">&#8679;</button>'  //double headed updown arrow.
        }
        if(buttons != "") {
            buttons = '<div style="float:right; position:absolute; right:5px; top:5px;">' + buttons + '</div>'
        }
        return  "<div " + //id='" + id +
                " class='show_window_title' " +
                " style='background-color: " + title_bar_color +
                "; padding:5px; height:" + title_bar_height +
                //"px; width:" + title_bar_width +
                "px; overflow: hidden; " +
                " font-size:20px; white-space:nowrap;'>" +
                title + buttons
                + "</div>" //DON'T DO. the content needs to be INSIDE the title for drag of title to work properly
    }
}

function beeps(times=1, callback){
    if (times == 0){
        if (callback){
            callback.call()
        }
    }
    else if (times > 0){
        beep()
        setTimeout(function(){beeps(times -1, callback)}, 1000)
    }
}

globalThis.beeps = beeps

var audioCtx

function beep({dur = 0.5, frequency = 440, volume = 1, waveform = "triangle", callback = null}={}){
    if(globalThis.platform == "node"){
        exec("espeak \"" + "beep" + "\" -a "+ (volume*200) + " -p " + (frequency * 100) + " -s 300",
            callback );//this callback takes 2 args, an err object and a string of the shell output
                       //of calling the command.
    }
    else {
        if(!audioCtx) {  audioCtx = new globalThis.AudioContext() }
        var oscillator = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (volume){gainNode.gain.value = volume;};
        if (frequency){oscillator.frequency.value = frequency;}
        if (waveform){oscillator.type = waveform;}
        if (callback){oscillator.onended = callback;}

        oscillator.start();
        setTimeout(function(){oscillator.stop()}, dur * 1000);
    }
}

globalThis.beep = beep
