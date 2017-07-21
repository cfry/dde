/*Eval this file and read the directions.
Make sure your sound is turned up so you can hear the responses.
You must have a good web connection.
*/

try{dict1} catch(err) { dict1 = {} } //so we don't accidently overwrite dict1 when evaling the file, but do initialize it if need be.

function translate(text){
    var result = text
    for(let key of Object.keys(dict1)){
        const def = dict1[key]
        result = replace_substrings(result, key, def)
    }
    if (result.includes("selection")){
        let sel = Editor.get_javascript(true)
        if (sel == "") {
            out("There is no selection in the editor.")
            speak("There is no selection in the editor.")
        }
        else {
            result = replace_substrings(result, "selection", sel)
        }
    }
    return result
}

function handle_dialog(recognized_text, confidence){
    recognized_text = recognized_text.toLowerCase()
    out("Heard: " + recognized_text)
    if (recognized_text == "insert dictionary"){
        var src = "\ndict1 = \n" + JSON.stringify(dict1)
        src = replace_substrings(src, ",", ",\n")
        Editor.insert(src, "end")
        speak("Dictionary saved.")
    }
    else if (recognized_text == "show dictionary"){
        var src = JSON.stringify(dict1)
        src = replace_substrings(src, ",", ",<br/>")
        show_window({title: "The dictionary you made",
            content: src})
    }
    else if (recognized_text.includes(" means ")){
        const term_and_def     = recognized_text.split(" means ")
        dict1[term_and_def[0]] = translate(term_and_def[1])
        speak(term_and_def[0] + ", defined.")
    }
    else if (recognized_text.startsWith("insert ")){
        var text_to_insert = recognized_text.substring(6)
        text_to_insert     = translate(text_to_insert)
        Editor.insert(text_to_insert)
    }
    else { //not a def so a translation or a "so what"
        var translation = translate(recognized_text)
        if (translation == recognized_text) {
            out("So what?")
            speak("So what?")
        }
        else {
            out("translation: " + translation)
            speak(translation)
        }
    }
}

function make_dictionary_help(){
    show_window({title: "About Make Dictionary",
        width: 250,
        height: 450,
        x: 700, y: 60,
        background_color: "#FFEECA",
        content:
            `One model of programming is that
its all about designing and implementing
a language for expressiong what you want
the computer to do for you.
<p/>
A crucial aspect of a language is
its vocabulary. We commonly represent
a language's vocabulary in a dictionary.
This application helps you make a
dictionary by speaking. 
<p/>
Good programmers
test their applications. You test the
dictionary you've made by saying sentences
that contain the terms in the made dictionary.
`})
}

make_dictionary_help()

recognize_speech(
    {title: "Make Dictionary",
        prompt: 'Define terms with "means" and use them.<br/>' +
        'Example: click "Click to talk" and say each of:<br/>' +
        '&bull; "Turquoise means blue green."<br/>' +
        '&bull; "I love turquoise."<br/>'  +
        '&bull; "Show dictionary."<br/>'   +
        '&bull; "Insert dictionary."<br/>' +
        '&bull; "My code means selection."<br/>' +
        '&bull; "Insert my code."<br/>',
        click_to_talk: true, //If false, speech recognition starts immediately. Default true.
        only_once: false,    //If false, more than one phrase (after pauses) can be recognized. Default true.
        phrase_callback: handle_dialog, //Passed text and confidence score when user pauses. Default (undefined) prints text and confidence. If only_once=true, only this callback is called.
        finish_phrase: "finish",        //Say this to end speech reco when only_once=false.
        finish_callback: out, //Passed array of arrays of text and confidence when user says "finish". Default null. Only called if only_once=false
        x: 290, y: 100, height: 350})