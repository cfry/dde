WebMidi = require("webmidi")

Midi = class Midi {}
Midi.describe_midi_event = function(event){
    //debugger
    var in_or_out = event.target.constructor.name
    var port_name = event.target.name
    const str = "Got MIDI event: " + in_or_out +
        ", " + port_name +
        ", channel:" + event.channel +
        ", type: " + event.type +
        ", " + event.note.name + event.note.octave +
        ", vel: " + event.velocity
    if(window.out) { out(str) }
    else           { console.log(str) }
}

//returns true if WebMidi needed to be inited ,false otherwise.
Midi.init = function(){
    if(!WebMidi.enabled){
        WebMidi.enable(function(err) {
                            if (err) { warning("WebMidi couldn't be enabled: " + err) }
                            else {
                                out("WedMidi enabled")
                                out(WebMidi.inputs)
                                out(WebMidi.outputs)
                            }
                         })
        return true
    }
    else { return false }
}


Note = class Note{
    constructor({time=0,      //in beats
                 duration=1,   //in beats
                 pitch=60,     //middle C
                 velocity=0.5, // float 0 to 1, like WebMidi
                 channel="all", //integers 1 thru 16
                 seconds_per_beat = Note.seconds_per_beat
                 }={}){
        if ((arguments.length == 1) && (typeof(arguments[0]) == "string")){
            //return Note.n(arguments[0])
            let a_string = arguments[0]
            let dur_string = ""
            let base_pitch_index = 0
            for(let i = 0; i < a_string.length; i++) {
                let char = a_string[i]
                if (is_digit(char)  || (char == ".") || (char == "/")) {
                    dur_string += char
                    base_pitch_index += 1
                }
                else { break }
            }
            let dur
            if(dur_string == "")               { dur = 1 }
            else if (dur_string.includes("/")) { dur = eval(dur_string) }
            else                               { dur = parseFloat(dur_string) }
            let pitch_class = "C"
            if (base_pitch_index < a_string.length)  { pitch_class = a_string[base_pitch_index] }
            let accidental_index = base_pitch_index + 1
            let accidental = ""
            let octave_index = accidental_index
            if (accidental_index < a_string.length) {
                accidental = a_string[accidental_index]
                if ("#b".includes(accidental)){
                    pitch_class += accidental
                    octave_index += 1
                }
            }
            let octave = "3"
            if(octave_index < a_string.length) {
                octave = a_string[octave_index]
                if ((octave_index + 1) < a_string.length) {
                    if (octave == "-") { octave += a_string[octave_index + 1] }
                    else { dde_error("got bad octave for note: " + a_string) }
                }
            }

            let pitch_class_and_octave = pitch_class + octave
            let pitch_num = Note.pitch_name_to_number(pitch_class_and_octave)
            this.channel  = "all" //1 through 16
            this.time     = 0
            this.duration = dur
            this.pitch    = pitch_num,
            this.velocity = 0.5
        }
        else {
            this.time     = time
            this.duration = duration
            if (typeof(pitch) == "string") {
                pitch = Note.pitch_name_to_number(pitch)
            }
            this.pitch    = pitch
            this.velocity = velocity
            this.channel  = channel
            this.seconds_per_beat = seconds_per_beat
        }
    }

    copy(){
        return new Note({time:               this.time,
                         duration:           this.duration,
                         pitch:              this.pitch,
                         velocity:           this.velocity,
                         channel:            this.channel,
                         seconds_per_beat:   this.seconds_per_beat})
    }

    static n(a_string = ""){
       let dur_string = ""
       let base_pitch_index = 0
       for(let i = 0; i < a_string.length; i++) {
           let char = a_string[i]
           if (is_digit(char)  || (char == ".") || (char == "/")) {
                dur_string += char
                base_pitch_index += 1
           }
           else { break }
       }
       let dur
       if(dur_string == "")               { dur = 1 }
       else if (dur_string.includes("/")) { dur = eval(dur_string) }
       else                               { dur = parseFloat(dur_string) }
       let pitch_class = "C"
       if (base_pitch_index < a_string.length)  { pitch_class = a_string[base_pitch_index] }
       let accidental_index = base_pitch_index + 1
       let accidental = ""
       let octave_index = accidental_index
       if (accidental_index < a_string.length) {
           accidental = a_string[accidental_index]
           if ("#b".includes(accidental)){
                pitch_class += accidental
                octave_index += 1
           }
       }
       let octave = "3"
       if(octave_index < a_string.length) {
         octave = a_string[octave_index]
         if ((octave_index + 1) < a_string.length) {
             if (octave == "-") { octave += a_string[octave_index + 1] }
             else { dde_error("got bad octave for note: " + a_string) }
         }
       }

       let pitch_class_and_octave = pitch_class + octave
       let pitch_num = Note.pitch_name_to_number(pitch_class_and_octave)
       return new Note({channel: "all", //1 through 16
                        time:    0,
                        duration: dur,
                        pitch:    pitch_num,
                        velocity: 0.5})
    } //end string_to_note

    pitch_class_number() { return this.pitch % 12 }
    pitch_class_name()   { return Note.pitch_class_names[this.pitch_class_number()] }
    octave()             { return Math.floor(this.pitch / 12) - 2 } //middle C is C3
    pitch_name()         { return this.pitch_class_name() + this.octave() }
    toString()           { return this.duration + this.pitch_name() }
    dur_in_seconds()     { return this.duration * this.seconds_per_beat }
    dur_in_ms()          { return Math.round(this.dur_in_seconds() * 1000) }
    play(){
        var needed_initing = Midi.init()
        if ( WebMidi.outputs.length > 0) {
            var extra_args = {duration: this.dur_in_ms(),
                              time:     "+" + Math.round(this.time * this.seconds_per_beat * 1000),
                              velocity: this.velocity}
            console.log(extra_args.time)
            if (needed_initing) {
                const pitch = this.pitch
                const chan  = this.channel
                setTimeout(function(){ //do this because if needs to be inited it won't plau te first time unless I do the timeout.
                    WebMidi.outputs[0].playNote(pitch, chan, extra_args)
                    }, 1000)
            }
            else {  WebMidi.outputs[0].playNote(this.pitch, this.channel, extra_args) }
            return this
        }
        else { dde_error("There are no WebMidi outputs to play into.") }
    }
    note_to_phrase(){
        return new Phrase({ notes: [this.copy()],
                            time:               this.time,
                            duration:           this.duration,
                            velocity:           this.velocity,
                            channel:            this.channel,
                            seconds_per_beat:   this.seconds_per_beat})
    }
    concat(...args){
        let new_p = this.note_to_phrase()
        return new_p.concat(...args)
    }
    merge(...args){
        let new_p = this.note_to_phrase()
        return new_p.merge(...args)
    }
    static pitch_to_octave(pitch) { return (Math.floor(pitch / 12)) - 2 }
    static pitch_to_pitch_class_number(pitch) { return Math.floor(pitch % 12) }
    static pitch_to_name(pitch) {  //ie 60 => "C3"
        let class_number = Note.pitch_to_pitch_class_number(pitch)
        let class_name   = Note.pitch_class_to_name(class_number)
        let octave       = Note.pitch_to_octave(pitch)
        return class_name + octave
    }
    static pitch_class_to_name(pitch_class) {
        if (typeof(pitch_class) == "string") { return pitch_class }
        else { return Note.pitch_class_names[pitch_class] }
    }
    static pitch_class_to_number(pitch_class) {
        if (typeof(pitch_class) == "number") { return pitch_class }
        else if (Note.pitch_class_names.indexOf(pitch_class) != -1){
            return  Note.pitch_class_names.indexOf(pitch_class)
        }
        else if (Note.pitch_class_names_flat.indexOf(pitch_class) != -1){
            return  Note.pitch_class_names_flat.indexOf(pitch_class)
        }
        else { dde_error("pitch_class_to_number passed invalid pitch_class: " + pitch_class) }
    }
    static pitch_name_to_number(pitch_name){
        if (typeof(pitch_name) == "number") { return pitch_name }
        else {
            if(!is_digit(last(pitch_name))) { pitch_name += "3" }
            return WebMidi.guessNoteNumber(pitch_name)
        }
    }

    static pitch_class_in_c_to_diatonic_index(pitch_class_in_c){
        for(var i = 0; i < Note.diatonic_intervals.length; i++){
            var dia_val = Note.diatonic_intervals[i]
            if (dia_val == pitch_class_in_c) { return i }
            else if (dia_val > pitch_class_in_c) { return i + 0.5 }
        }
        shouldnt("pitch_class_in_c_to_diatonic_index passed: " + pitch_class_in_c + " but couldn't find its index.")
    }

    static diatonic_index_to_pitch_in_c(dia_index){
        var dia_index0_6 = dia_index % 7
        var dia_index_octaves = Math.floor(dia_index / 7)
        var pitch_class_num = Note.diatonic_intervals[dia_index0_6]
        var result = (dia_index_octaves * 12) + pitch_class_num
        return result
    }

    static convert_diatonic_interval_to_0_based(interval){ //interval is 1 for unison, 3 for a third, etc.
        if      (interval == 0) { return 0 } //perhaps should be an error, but let's just call this unison
        else if (interval > 0)  { return interval - 1 }
        else if (interval < 0)  { return interval + 1 }
    }

     //high level fn
    static diatonic_transpose(pitch, key, diatonic_interval){
        pitch = Note.pitch_name_to_number(pitch) //ok if pitch is laredy a number
        key   = Note.pitch_class_to_number(key)  //ok if key is already a number
        diatonic_interval = Note.convert_diatonic_interval_to_0_based(diatonic_interval)
                                //so that input of 1 will mean "unison, 3 will mean the interval of a 3rd, etc.
                                //note 3 is not major or minor 3rd its whichever one is diatonic witk key
                                //but from hear on, diatonic_interval is 0 based.
        var simple_oct = Math.floor(pitch / 12)
        var pitch_in_c = pitch - key
        var pitch_class_num_in_c = Note.pitch_to_pitch_class_number(pitch_in_c) // in key of C
        var index_into_dia = Note.pitch_class_in_c_to_diatonic_index(pitch_class_num_in_c)
        var new_index_into_dia = index_into_dia + diatonic_interval
        var new_pitch_in_c = Note.diatonic_index_to_pitch_in_c(new_index_into_dia)
        var pitch_in_key = new_pitch_in_c + key
        return pitch_in_key + (simple_oct * 12)
    }


} //end Note class
Note.pitch_class_names       = ["C", "C#", "D","D#","E","F","F#","G","G#","A","A#","B"]
Note.pitch_class_names_flat  = ["C", "Db", "D","Eb","E","F","Gb","G","Ab","A","Bb","B"]

Note.diatonic_intervals = [0, 2, 4, 5, 7, 9, 11]
Note.seconds_per_beat = 1 //usually set in a phrase