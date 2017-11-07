WebMidi = require("webmidi")

Midi = class Midi {
    static describe_midi_event(event){
        var in_or_out = event.target.constructor.name
        const str =
            "Got MIDI event: " + in_or_out +     //"Input", "Output"
            ", "   +         event.target.name + //name of device such as "VMPK"
            ", channel:"   + event.channel +     //integer 1 through 16
            ", type: "     + event.type +        //"noteon", "noteoff"
            ", pitch:"     + event.note.number + //integer 0 through 127
            ", velocity: " + event.velocity      //number from 0 to 1
        out(str)
    }

//returns true if WebMidi needed to be inited ,false otherwise.
    static init(){
        if(!WebMidi.enabled){
            WebMidi.enable(function(err) {
                                if (err) { warning("WebMidi couldn't be enabled: " + err) }
                                else {
                                    out("WedMidi enabled")
                                    //out(WebMidi.inputs)
                                    //out(WebMidi.outputs)
                                    inspect({"WebMidi.inputs":  WebMidi.inputs,
                                             "WebMidi.outputs": WebMidi.outputs})
                                }
                             })
            //eval_and_play_button_id.style.display = "inline-block"
        }
        else {
            Midi.all_notes_off()
            WebMidi.disable() //undefines the listeners, maybe other stuff
            setTimeout(Midi.init, 1000)
         }
    }

    static all_notes_off(){
        for(let an_out of WebMidi.outputs){
            an_out.sendChannelMode('allnotesoff', 0)
        }
    }
}

Note = class Note{
    constructor({time=0,       //in beats
                 dur=1,   //in beats
                 pitch=60,     //middle C
                 velocity=Phrase.default_velocity, // float 0 to 1, like WebMidi
                 channel=Phrase.default_channel,  //integers 1 thru 16 or "all"
                 }={}){
        if ((arguments.length == 1) && (typeof(arguments[0]) == "string")){
            //return Note.n(arguments[0])
            let a_string = arguments[0]
            let [dur_string, base_pitch_index] = Note.extract_dur_string(a_string)
            let dur
            if(dur_string == "")               { dur = 1 }
            else if (dur_string.includes("/")) { dur = eval(dur_string) }
            else                               { dur = parseFloat(dur_string) }
            let [pitch_class, octave_index] = Note.extract_pitch_class(a_string, base_pitch_index)
            //next_octave_index only used when parsing notes for a phrase that might be a chord.
            let [octave_string, next_octave_index] = Note.extract_octave_string(a_string, octave_index)

            let pitch_class_and_octave = pitch_class + octave_string
            let pitch_num = Note.pitch_name_to_number(pitch_class_and_octave)
            this.channel  = channel //1 through 16 or "all"
            this.time     = 0
            this.dur = dur
            this.pitch    = pitch_num
            this.velocity = 0.5
        }
        else { //create a note based on the keywords. simpler to implement but much more to enter for user.
            this.channel  = channel
            this.time     = time
            this.dur = dur
            if (typeof(pitch) == "string") {
                pitch = Note.pitch_name_to_number(pitch)
            }
            this.pitch    = pitch
            this.velocity = velocity
        }
    }

    toString() { return this.to_source_code() }

    to_source_code(){
        let result
        if ((this.time     == 0) &&
            (this.velocity == Phrase.default_velocity) &&
            (this.channel  == Phrase.default_channel)) {
            result =  Note.pitch_to_name(this.pitch) // ie C3
            if (this.dur != 1) { result = this.dur + result }
            result = '"' + result + '"'
        }
        else { result = "{" +
                        "time: "       + this.time +
                        ", dur: "      + this.dur +
                        ', pitch: "'   + Note.pitch_to_name(this.pitch) + '"' +
                        ", velocity: " + this.velocity +
                        ", channel:  " + this.channel +
                        "}"
        }
        return "new Note(" + result + ")"
    }

    static extract_dur_string(a_string){
        let dur_string       = ""
        let base_pitch_index = 0
        for(let i = 0; i < a_string.length; i++) {
            let char = a_string[i]
            if (is_digit(char)  || (char == ".") || (char == "/")) {
                dur_string += char
                base_pitch_index += 1
            }
            else { break }
        }
        return [dur_string, base_pitch_index]
    }
    static extract_pitch_class(a_string, base_pitch_index){
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
        return [pitch_class, octave_index]
    }

    //needs to handle "CDE4" when octaive index is pointing at D but it should skip ahead to 4
    static extract_octave_string(a_string, octave_index){
        let octave_string = "3"
        if(octave_index < a_string.length) {
            let octave_string_maybe = a_string[octave_index]
                if (is_digit(octave_string_maybe)) { //good we're done with octave
                    octave_string = octave_string_maybe
                    octave_index += 1
                }
                else if (octave_string_maybe == "-") { //ok looks like a neg oct -1 or -2
                    octave_string = octave_string_maybe
                    octave_index += 1
                    if (octave_index >= a_string.length) {
                        dde_error("got bad octave for note: " + a_string)
                    }
                    else if (is_digit(a_string[octave_index])) {
                        octave_string += a_string[octave_index]
                        octave_index += 1
                    }
                    else { dde_error("got bad octave for note: " + a_string) } //got minus sign but no ditig after it

                }
        }
        let next_pitch_index //used by new Phrase with "notes" like "CEG"
        if (octave_index >= a_string.length) { next_pitch_index = null }
        else { next_pitch_index = octave_index }
        return [octave_string, next_pitch_index]
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
       return new Note({channel: 1, //1 through 16
                        time:    0,
                        dur: dur,
                        pitch:    pitch_num,
                        velocity: 0.5})
    } //end string_to_note

    pitch_class_number() { return this.pitch % 12 }
    pitch_class_name()   { return Note.pitch_class_names[this.pitch_class_number()] }
    octave()             { return Math.floor(this.pitch / 12) - 2 } //middle C is C3
    pitch_name()         { return this.pitch_class_name() + this.octave() }
    toString()           { return this.dur + this.pitch_name() }
    //dur_in_seconds(spb=1) { return this.dur * spb }
    //dur_in_ms(spb=1)      { return Math.round(this.dur_in_seconds(spb) * 1000) }
    is_rest()            { return this.pitch === -1 }

    static pitch_to_octave(pitch) {
        pitch = Note.pitch_name_to_number(pitch)
        return (Math.floor(pitch / 12)) - 2
    }
    static pitch_to_pitch_class_number(pitch) {
       pitch = Note.pitch_name_to_number(pitch)
       return Math.floor(pitch % 12)
    }
    static pitch_to_name(pitch) {  //ie 60 => "C3"
        if (pitch === -1) { return "R" }
        else {
            let class_number = Note.pitch_to_pitch_class_number(pitch)
            let class_name   = Note.pitch_class_to_name(class_number)
            let octave       = Note.pitch_to_octave(pitch)
            return class_name + octave
        }
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
        else if (pitch_class == -1) { return "R" }
        else { dde_error("pitch_class_to_number passed invalid pitch_class: " + pitch_class) }
    }
    static pitch_name_to_number(pitch_name){
        if (typeof(pitch_name) == "number") { return pitch_name }
        else {
            if (pitch_name.startsWith("R")) { return -1 } //rest, It might have an octave on it
            if(!is_digit(last(pitch_name))) { pitch_name += "3" }
            return WebMidi.guessNoteNumber(pitch_name)
        }
    }
    /* previous diatonic transpose. didn't andle octaves or fracitonal intervals well
    static pitch_class_in_c_to_diatonic_index(pitch_class_in_c){
        for(var i = 0; i < Note.diatonic_intervals.length; i++){
            var dia_val = Note.diatonic_intervals[i]
            if (dia_val == pitch_class_in_c) { return i }
            else if (dia_val > pitch_class_in_c) { return i + 0.5 }
        }
        shouldnt("pitch_class_in_c_to_diatonic_index passed: " + pitch_class_in_c + " but couldn't find its index.")
    }

    static diatonic_index_to_pitch_in_c(dia_index){
        var dia_index0_6
        if (dia_index >= 0) { dia_index0_6 = dia_index % 7}
        else {
            dia_index0_6 = dia_index
            while(dia_index0_6 < 0) { dia_index0_6 += 7 }
        }
        var dia_index_octaves = Math.floor(dia_index / 7)
        var pitch_class_num = Note.diatonic_intervals[dia_index0_6]
        var result = (dia_index_octaves * 12) + pitch_class_num
        return result
    }



     //high level fn
    static diatonic_transpose_old(pitch, key, diatonic_interval){
        pitch = Note.pitch_name_to_number(pitch)       //ok if pitch is already a number
        key   = Note.pitch_to_pitch_class_number(key)  //ok if key   is already a number
        let zero_based_diatonic_interval = Note.convert_diatonic_interval_to_0_based(diatonic_interval)
                                //so that input of 1 will mean "unison, 3 will mean the interval of a 3rd, etc.
                                //note 3 is not major or minor 3rd its whichever one is diatonic witk key
                                //but from hear on, diatonic_interval is 0 based.
        var simple_oct = Math.floor(pitch / 12)
        var pitch_in_c = pitch - key
        var pitch_class_num_in_c = Note.pitch_to_pitch_class_number(pitch_in_c) // in key of C
        var index_into_dia = Note.pitch_class_in_c_to_diatonic_index(pitch_class_num_in_c)
        var new_index_into_dia = index_into_dia + zero_based_diatonic_interval
        var new_pitch_in_c = Note.diatonic_index_to_pitch_in_c(new_index_into_dia)
        var pitch_in_key = new_pitch_in_c + key
        return pitch_in_key + (simple_oct * 12)
    }
    */
    ////
    static diatonic_transpose(pitch, key, diatonic_interval){
        pitch = Note.pitch_name_to_number(pitch)       //ok if pitch is already a number
        key   = Note.pitch_to_pitch_class_number(key)  //ok if key   is already a number
        if((diatonic_interval <= 1) && (diatonic_interval >= -1)) { return pitch } //-1 -0.5, 0, 0.5, 1 all mean unison
        let [diatonic_interval_whole, dia_interval_semitones_to_add] = Note.diatonic_interval_whole_and_frac(diatonic_interval) // returns a whole numb (neg or pos), returns a frac, -0.5, 0, or 0.5
        let zero_based_diatonic_interval = Note.convert_diatonic_interval_to_0_based(diatonic_interval_whole) ////with zero adjustment. still has octaves
        //so that input of 1 will mean "unison, 3 will mean the interval of a 3rd, etc.
        //note 3 is not major or minor 3rd its whichever one is diatonic witk key
        //but from hear on, diatonic_interval is 0 based.
        let pitch_in_c = pitch - key
        let pitch_class_in_c = Note.pitch_to_pitch_class_number(pitch_in_c) // in key of C
        let pitch_in_c_octave =  Math.floor(pitch_in_c / 12)
        let[interval_0_6, interval_octs] = Note.zero_based_interval_to_0_to_6_and_octs(zero_based_diatonic_interval)
        let pitch_in_dia_c_scale_degree = Note.pitch_class_to_dia_scale_degree_in_c(pitch_class_in_c)
        let new_scale_degree_in_c = pitch_in_dia_c_scale_degree + interval_0_6 //since dia_interval_0_6 will be positive,
                                    //new_scale_degree_in_C will never be neg. May have a 0.5 res
        let [new_scale_degree_in_c_sans_oct, scale_degree_in_c_octs] =
                Note.scale_degree_0_to_6_and_octs(new_scale_degree_in_c)
        let new_pitch_class_in_c = Note.dia_scale_degree_in_c_to_pitch_class(new_scale_degree_in_c_sans_oct)
        let new_pitch_with_octaves =  new_pitch_class_in_c + ((scale_degree_in_c_octs + interval_octs + pitch_in_c_octave) * 12)
        let new_pitch_in_orig_key  = new_pitch_with_octaves + key + dia_interval_semitones_to_add
        return new_pitch_in_orig_key
    }

    //for 1.5 returns 1 and 1. for -1.5 returns -1 and -1 where the 2nd number is really "semitone to add" after all other processing done.
    static diatonic_interval_whole_and_frac(diatonic_interval){
            let frac = diatonic_interval % 1
            if (frac == -0.5) { frac = -1}
            else if (frac == 0.5) { frac = 1 }
            return [Math.trunc(diatonic_interval), frac]
    }

    static scale_degree_0_to_6_and_octs(new_scale_degree_in_C){
        let sd_0_6 = new_scale_degree_in_C % 7
        let oct = Math.floor(new_scale_degree_in_C / 7)
        if (sd_0_6 == 6.5) { //ie b flat, happens when input is 6.5
            sd_0_6 = 0 //6 means "the (maj) 7th in music terms so add .05 to that and you get to unison of next octave up
                       //since we are using zero_based intervals here, return 0 for unison
            oct += 1
        }
        return [sd_0_6, oct]
    }

    static pitch_class_to_dia_scale_degree_in_c(pitch_class_in_c){
              //C  C#   D  D#   E  F  F#   G  G#   A  A#   B
        return [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6][pitch_class_in_c]
    }

    static dia_scale_degree_in_c_to_pitch_class(dia_scale_degree_in_c){
        if (dia_scale_degree_in_c == 2.5) { return 5 }
        else {
                //C  C#   D  D#   E  F  F#   G  G#   A  A#   B
          return [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6].indexOf(dia_scale_degree_in_c)
        }
    }

    //returns [interval_0_6, octs]   interval_0_6 will be non-neg but octs might be neg
    static zero_based_interval_to_0_to_6_and_octs(zero_based_diatonic_interval){
        let interval_0_6
        let interval_octs
        if (zero_based_diatonic_interval == 0) { interval_0_6 = 0; interval_octs = 0 }
        else if (zero_based_diatonic_interval > 0) {
            interval_octs = Math.floor(zero_based_diatonic_interval / 7)
            interval_0_6  = zero_based_diatonic_interval % 7
        }
        else if (zero_based_diatonic_interval < 0) {
            interval_octs = 0
            interval_0_6 = zero_based_diatonic_interval
            for(interval_octs = 0; interval_0_6 < 0; interval_octs--){
                interval_0_6 += 7
            }
            if (interval_0_6 == 6.5) {
                interval_0_6 = 0.5
                interval_octs += 1
            }
        }
        return [interval_0_6, interval_octs]
    }

    static convert_diatonic_interval_to_0_based(interval){ //interval is 1 for unison, 3 for a third, etc.
        if      (interval == 0) { return 0 } //perhaps should be an error, but let's just call this unison
        else if (interval > 0)  { return interval - 1 }
        else if (interval < 0)  { return interval + 1 }
    }

    static convert_diatonic_interval_to_1_based(interval){ //interval is 1 for unison, 3 for a third, etc.
        if      (interval == 0) { return 0 } //perhaps should be an error, but let's just call this unison
        else if (interval > 0)  { return interval + 1 }
        else if (interval < 0)  { return interval - 1 }
    }


    // beats spb1 spb2   result
    // 2,     1,  0.5 => 4
    // 0.5,   1,  1   => 0.5
    //returned beats will last for same number of secs as orig beats,
    //but will be with a different spb
    static convert_beats(beats, orig_seconds_per_beat, new_seconds_per_beat=1){
        let orig_secs = beats * orig_seconds_per_beat
        return orig_secs / new_seconds_per_beat
    }

    note_to_phrase(spb=1){ //spb is desintnation spb, source spb is considered to be 1
        return new Phrase({ notes: [this.copy()],
            time:               Note.convert_beats(this.time,     1, spb),
            dur:           Note.convert_beats(this.dur, 1, spb),
            velocity:           this.velocity,
            channel:            this.channel,
            seconds_per_beat:   this.spb})
    }
    /////////////BELOW HERE SAME METHODS FOR NOTE AND PHRASE
    start(seconds_per_beat=1){
        if (!WebMidi.enabled) {
            Midi.init()
            let the_note = this
            setTimeout(function() { the_note.start(seconds_per_beat) }, 1000)
        }
        else if (WebMidi.outputs.length == 0) {
            dde_error("There are no WebMidi outputs to play into.")
        }
        else if (this.is_rest()) { return this } //skip playing the "Rest" as it would error
        else {
            var extra_args = {duration:       Math.round(this.dur  * seconds_per_beat * 1000),
                              time:     "+" + Math.round(this.time * seconds_per_beat * 1000),
                              velocity: this.velocity}
            const pitch = this.pitch
            const chan  = this.channel
            WebMidi.outputs[0].playNote(pitch, chan, extra_args)
            return this
        }
    }

    arpeggio(interval_or_array, key="chromatic", dur_or_array=null, notelet_index=0){
        if (Array.isArray(interval_or_array)){
            let new_phrase = this.note_to_phrase()
            return new_phrase.arpeggio(interval_or_array, key, dur_or_array)
        }
        else {
            let new_note = this.copy()
            let new_pitch
            if (this.is_rest()) { new_pitch = -1 }
            else if (key == "chromatic") { new_pitch = this.pitch + interval_or_array }
            else {
                key = Note.pitch_to_pitch_class_number(key)
                //let extra_halfstep = interval_or_array % 1 //-3.5 % 1 => -0.5, which is what we want for "adding" at the end
                //interval_or_array = Math.trunc(interval_or_array) //get integer towards 0, might be negative
                new_pitch = Note.diatonic_transpose(this.pitch, key, interval_or_array)
                //if (extra_halfstep) { new_pitch += 1 }
            }
            new_note.pitch = new_pitch
            let dur
            if (Array.isArray(dur_or_array)) { dur = dur_or_array[notelet_index] }
            else if (dur_or_array == null)   { dur = this.dur } //if interval_or_array is an array, control is passed to Phrase.arpeggio whcch passes a real dur number back down
            else                             { dur = dur_or_array }
            new_note.dur   = dur
            let new_note_time_incr = 0
            if (Array.isArray(dur_or_array)) { //add up all the durs before notelet_index and sum them into new_note_time
                for(let i = 0; i < notelet_index; i++) {
                    new_note_time_incr += dur_or_array[i]
                }
            }
            else { new_note_time_incr = dur * notelet_index }
            new_note.time = this.time + new_note_time_incr
            return new_note
        }
    }

    copy(){
        return new Note({   time:      this.time,
                            dur:       this.dur,
                            pitch:     this.pitch,
                            velocity:  this.velocity,
                            channel:   this.channel })
    }

    concat(...args){
        let new_p = this.note_to_phrase()
        return new_p.concat(...args)
    }

    filter_in_prop(prop, min_note, max_note, max_is_inclusive){
        let is_in
        let min_val = min_note[prop]
        let max_val = max_note[prop]
        let note_val = this[prop]
        if (prop == "pitch") {
            if (min_val) { min_val = Note.pitch_name_to_number(min_val) }
            if (max_val) { max_val = Note.pitch_name_to_number(max_val) }
            if (min_val == -1) { // a rest
                if (this.pitch == -1)   { is_in = true }
                else                    { is_in = false }
            }
            else if (this.pitch == -1) { is_in = true } //min_val is not -1
        }
        if ((prop == "channel") &&
            ((min_val == "all") ||
                (max_val == "all"))) { is_in == true }
        if (is_in === undefined) {
            let above_min = false
            if (min_val === undefined) { above_min = true }
            else if (note_val >= min_val) { above_min = true }

            let below_max = false
            if (max_val === undefined) { below_max = true }
            else if (note_val < max_val) { below_max = true }
            else if (max_is_inclusive &&
                (note_val === max_val)) { below_max = true }

            is_in = above_min && below_max
        }
        return is_in
    }
    //returns this or null
    filter(min_note={}, max_note=min_note, max_is_inclusive=true, filter_in=true){
        let include_if_is_in = true
        for(let prop of ["channel", "dur", "pitch", "velocity", "time"]){
            let is_in = this.filter_in_prop(prop, min_note, max_note, max_is_inclusive)
            if (!is_in){
                include_if_is_in = false
                break
            }
        }
        if (filter_in) { return (include_if_is_in? this : null) }
        else           { return (include_if_is_in? null : this) }
    }

    merge(...args){
        let new_p = this.note_to_phrase()
        return new_p.merge(...args)
    }

    //returns a phrase that will be empty if repetitions = 0
    repeat(repetitions = 2) {
        let result = new Phrase()
        let whole_number = Math.floor(repetitions)
        let fraction     = repetitions % 1

        for(let i = 0; i < whole_number; i++){
            let new_note = this.copy()
            if (i != 0) { new_note.time = this.dur * i }
            result.notes.push(new_note)
        }
        if (fraction > 0){
            let new_note  = this.copy()
            new_note.time = (this.time + this.dur) * result.notes.length
            new_note.dur  = this.dur * fraction
            result.notes.push(new_note)
        }
        if (result.notes.length == 0) { result.dur = 0}
        else { result.dur = last(result.notes).time + last(result.notes).dur }
        return result
    }

    time_interval(start_time=0, end_time){
        if (end_time === undefined)    { end_time = this.time + this.dur }
        if (end_time < start_time)     { return null }
        else if (this.time > end_time) { return null }
        else if ((this.time + this.dur) < start_time) { return null }
        else {
            let result = this.copy()
            if (this.time < start_time) { result.time = start_time }
            if ((result.time + this.dur) > end_time) { result.dur = end_time - result.time }
            return result
        }
    }

    transpose(interval_or_array, key="chromatic"){
        if (Array.isArray(interval_or_array)){
           let new_phrase = this.note_to_phrase()
           return new_phrase.transpose(interval_or_array, key)
        }
        else {
            let new_note = this.copy()
            let new_pitch
            if (this.is_rest()) { new_pitch = -1 }
            else if (key == "chromatic") { new_pitch = this.pitch + interval_or_array }
            else {
                key = Note.pitch_to_pitch_class_number(key)
                //let extra_halfstep = interval_or_array % 1 //-3.5 % 1 => -0.5, which is what we want for "adding" at the end
                //interval_or_array = Math.trunc(interval_or_array) //get integer towards 0, might be negative
                new_pitch = Note.diatonic_transpose(this.pitch, key, interval_or_array)
                //if (extra_halfstep) { new_pitch += 1 }
            }
            new_note.pitch = new_pitch
            return new_note
        }
    }


    //virtual prop: octave (affects pitch)
    //min and max not applied to prop_name "time"
    set_property(prop_name, new_value, min=-2, max=128){
        let note_copy = this.copy()
        if (prop_name == "pitch") {
            new_value = Note.pitch_name_to_number(new_value)
            min       = Note.pitch_name_to_number(min)
            max       = Note.pitch_name_to_number(max)
        }
        if (prop_name != "time") {
            new_value = limit_to_range(new_value, min, max)
         }
        if (prop_name == "octave") { //C3 is middle C, is 60
             new_value = (new_value + 2) * 12
             prop_name = "pitch"
        }
        note_copy[prop_name] = new_value
        return note_copy
    }
    //this is "add"
    //supports virtual prop "octave"
    increment_property(prop_name, increment, min=-2, max=128){
        let note_copy = this.copy()
        if (prop_name == "pitch") {
            increment = Note.pitch_name_to_number(increment)
            min       = Note.pitch_name_to_number(min)
            max       = Note.pitch_name_to_number(max)
        }
        if (prop_name == "octave") { //C3 is middle C, is 60
            increment = increment * 12
            prop_name = "pitch"
        }
        let new_value = this[prop_name] + increment
        if (prop_name != "time") { new_value = limit_to_range(new_value, min, max) }
        note_copy[prop_name] = new_value
        return note_copy
    }

    //For virtual prop: "time_and_dur",  min and max applied to dur onlu, not time.
    multiply_property(prop_name, factor, min=-2, max=128){
        let note_copy = this.copy()
        if (prop_name == "time_and_dur") {
            note_copy.time     *= factor
            note_copy.dur = limit_to_range(this.dur * factor, min, max)
        }
        else {
            let new_value = this[prop_name] * factor
            if (prop_name != "time") { new_value = limit_to_range(new_value, min, max) }
            note_copy[prop_name] = new_value
        }
        return note_copy
    }









} //end Note class
Note.pitch_class_names       = ["C", "C#", "D","D#","E","F","F#","G","G#","A","A#","B"]
Note.pitch_class_names_flat  = ["C", "Db", "D","Eb","E","F","Gb","G","Ab","A","Bb","B"]
Note.diatonic_intervals      = [0, 2, 4, 5, 7, 9, 11]