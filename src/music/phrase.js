/**
 * Created by Fry on 8/6/17.
 */

import {trim_all} from "../job_engine/core/utils.js"


class Phrase{
    constructor({notes="",
                time=0, //in beats. used only for start time of first note if initializing notes from a string
                dur=null,   //in beats, null means compute dur from time and end of last note
                                 //this is the "logical dur" of the whole phrase,
                                 // ie 2 bars or 4 bars (8 or 16 respectively)
                                 //ignoring pickup notes and ignroing some rest at the end.
                                 //used for "concatenating phrases where you might have "picu notes"
                                 //before the logical 0 of the phrase. Those pickup notes
                                 //play during the time of the previous bar, and would have negative
                                 // start times.
                velocity=Phrase.default_velocity,
                channel=Phrase.default_channel, //null means leave the channel alone in tne note,
                              // presumably you're calling this with something like
                              // new Phrase ({channel:null, notes: [new note({channel:1 ...})
                              //where we've got channels in the indivdual notes,
                              //and they might be different channles in each note.
                seconds_per_beat=Phrase.default_seconds_per_beat
                } = {}){
        this.time             = time
        this.velocity         = velocity
        this.seconds_per_beat = seconds_per_beat
        if((arguments.length == 1) && (typeof(arguments[0]) == "string")){
           this.notes = arguments[0]
           if (this.channel == null) { this.channel = 1 }
           else { (this.channel = channel) } //always the default
        }
        else {
            this.notes   = notes
            this.channel = channel
        }
        if (typeof(this.notes) == "string") { this.fill_in_notes_from_string(this.notes) }
        if (dur === null) {
            if(this.notes.length == 0) { this.dur = 0 }
            else { this.dur = last(this.notes).time + last(this.notes).dur }
        } //in beats
        else { this.dur = dur }
    } //end of Phrase constructor

    toString() { "Phrase of " + this.notes.length + " notes" }

    to_source_code(){
        let prev_attr = false
        let result = "new Phrase({"
        if(this.time != 0)     { result += (prev_attr ? ", " : "") + "time: " + this.time; prev_attr = true}
        if(this.dur !== null)  { result += (prev_attr ? ", " : "") + "dur: " + this.dur; prev_attr = true}
        if(this.velocity != Phrase.default_velocity) {
            result += (prev_attr ? ", " : "") + "velocity: " + this.velocity; prev_attr = true}
        if(this.channel !== Phrase.default_channel)  {
            result += (prev_attr ? ", " : "") + "channel: " + this.channel; prev_attr = true}
        if(this.seconds_per_beat != Phrase.default_seconds_per_beat)  { result += (prev_attr ? ", " : "") + "seconds_per_beat: " + this.seconds_per_beat; prev_attr = true}
        if (this.notes.length > 0){ //nearly always true
            let notes = "notes: ["
            let first_note = true
            let start_time_needed_if_defaulting_it = 0
            for(let note of this.notes){
                let note_src = note.to_source_code()
                notes += (first_note ? "" : ", ") + note_src
                first_note = false
            }
            result += (prev_attr ? ", " : "") + notes + "]"
        }
        result += "})"
        return result
    }


    fill_in_notes_from_string(notes_string){
        let time_of_next_note = this.time //in beats
        const array_of_note_strings = trim_all(notes_string).split(" ")
        this.notes = []
        for (let note_string of array_of_note_strings) {
            note_string = note_string.trim()
            if (note_string == "") {} //happens if user puts 2 spaces between notes. skip it
            else {
                //var note = new Note(note_string)
                let [dur_string, base_pitch_index] = Note.extract_dur_string(note_string)
                let dur
                if(dur_string == "")               { dur = 1 }
                else if (dur_string.includes("/")) { dur = eval(dur_string) }
                else                               { dur = parseFloat(dur_string) }
                while(true) {
                    let [pitch_class, octave_index] = Note.extract_pitch_class(note_string, base_pitch_index)
                    //next_octave_index only used when parsing notes for a phrase that might be a chord.
                    let [octave_string, next_base_pitch_index] = Note.extract_octave_string(note_string, octave_index)
                    let pitch_class_and_octave = pitch_class + octave_string
                    let pitch_num = Note.pitch_name_to_number(pitch_class_and_octave)
                    let note = new Note()
                    if (this.channel) { note.channel = this.channel } //1 through 16 or "all"
                    note.time     = time_of_next_note
                    note.dur = dur
                    note.pitch    = pitch_num
                    note.velocity = this.velocity
                    this.notes.push(note)
                    if (next_base_pitch_index){ base_pitch_index = next_base_pitch_index }
                    else { break; }
                }
                time_of_next_note += last(this.notes).dur
            }
        }
    }

    remove_rests(){
        let notes_copy = []
        for(let n of this.notes) {
            if(!n.is_rest()) { notes_copy.push(n.copy()) }
        }
        let result = this.copy_except_notes()
        result.notes = notes_copy
        return result
    }
    //this is used in Instruction.control.play to decide when playing a phrase,
    //how long from the start of the instruction should it be until the instruction ends
    //and the next instruction should be run.
    dur_in_seconds()      { return this.dur * this.seconds_per_beat }
    dur_in_ms()           { return Math.round(this.dur_in_seconds() * 1000) }
    seconds_to_beats(secs){ return secs / this.seconds_per_beat }

    ///////////BELOW HERE SAME METHODS FOR NOTE and PHRASE
    start(){
        for(let note of this.notes){ note.start(this.seconds_per_beat) }
        return this
    }

    //dur = null means spread notelets out to fill orig note's dur
    //dur = array means array of the durs of the notelets.
    //dur = number, the dur of each notelet.
    arpeggio(interval_or_array, key="chromatic", dur_or_array=null){
        if (typeof(interval_or_array) == "number") { interval_or_array = [interval_or_array]}
        const new_notes = []
        for(let note of this.notes){
            if (note.is_rest()) { new_notes.push(note.copy()) }
            else {
                let notelet_dur //all notelets have the same dur
                if (dur_or_array == null) { notelet_dur = note.dur / interval_or_array.length }
                else             { notelet_dur = dur_or_array }
                let notelet_durs
                if(Array.isArray(notelet_dur)) { notelet_durs = notelet_dur }
                else {
                    notelet_durs = new Array(interval_or_array.length)
                    notelet_durs.fill(notelet_dur)
                }
                for(let notelet_index = 0; notelet_index < interval_or_array.length; notelet_index++){
                    let interval = interval_or_array[notelet_index]
                    new_notes.push(note.arpeggio(interval, key, notelet_durs, notelet_index))
                }
            }
        }
        let result = this.copy_except_notes()
        result.notes = new_notes
        return result
    }

    copy(){
        let notes_copy = []
        for(let n of this.notes) { notes_copy.push(n.copy()) }
        let result = this.copy_except_notes()
        result.notes = notes_copy
        return result
    }
    //not defined for note
    copy_except_notes(){
        return new Phrase({ notes:    [], //expected to be a new empty array by phrase.filter
                            time:     this.time,
                            dur:      this.dur,
                            velocity: this.velocity,
                            channel:  this.channel,
                            seconds_per_beat: this.seconds_per_beat})
    }

    /*concat(...args){
        let result = this.copy()
        let new_notes = result.notes
        let orig_spb = result.seconds_per_beat
        let prev_phrase_spb = 1
        let prev_phrase_end_time_in_beats = 0 //even if the orig phrase has pickup notes.
        for (var n_or_p of args){
            let cur_phrase_spb = n_or_p.seconds_per_beat
            let cur_phrase_start_time_beats = Note.convert_beats(prev_phrase_end_time_in_beats, prev_phrase_spb, cur_phrase_spb)
            n_or_p = n_or_p.copy()
            if(n_or_p instanceof Note){
                var n = n_or_p
                var time_in_seconds = n.time * n.seconds_per_beat
                var time_in_beats_of_result = time_in_seconds / result.seconds_per_beat
                n.time = result.dur + time_in_beats_of_result
                n.dur = n_or_p.dur_in_seconds() / result.seconds_per_beat
                n.seconds_per_beat = result.seconds_per_beat
                new_notes.push(n)
                result.dur += result.seconds_to_beats(n.dur_in_seconds())
            }
            else if(n_or_p instanceof Phrase){
                for (var n of n_or_p.notes) {
                    var time_in_seconds = n.time * n.seconds_per_beat
                    var time_in_beats_of_result = time_in_seconds / result.seconds_per_beat
                    n.time = result.dur + time_in_beats_of_result
                    n.dur = n.dur_in_seconds() / result.seconds_per_beat
                    n.seconds_per_beat = result.seconds_per_beat
                    new_notes.push(n)
                }
                var new_p_dur_in_beats_of_result = n_or_p.dur_in_seconds() / result.seconds_per_beat
                result.dur += new_p_dur_in_beats_of_result
            }
        }
        return result
    }*/
    concat(...args){
        let result = this.copy()
        let new_notes                     = result.notes
        let orig_spb                      = result.seconds_per_beat
        let prev_phrase_end_time_in_beats = this.dur //always in orig beats
        for (var n_or_p of args){
            n_or_p = n_or_p.copy()
            if(n_or_p instanceof Note){
                let n = n_or_p
                let cur_note_spb  = 1
                let cur_note_time_in_orig_beats = Note.convert_beats(n.time, 1, orig_spb) //just in case n.time != 0
                n.time = prev_phrase_end_time_in_beats + cur_note_time_in_orig_beats
                n.dur = Note.convert_beats(n.dur, 1, orig_spb)
                new_notes.push(n)
                prev_phrase_end_time_in_beats = Note.convert_beats(n.time + n.dur, 1, orig_spb)
                result.dur = n.time + n.dur
            }
            else if(n_or_p instanceof Phrase){ //a given phrase might have notes of different spb
                let phr = n_or_p
                for (var n of phr.notes) {
                    let orig_beats_time_for_n = Note.convert_beats(n.time, phr.seconds_per_beat, orig_spb)
                    n.time = prev_phrase_end_time_in_beats + orig_beats_time_for_n
                    n.dur =  Note.convert_beats(n.dur, phr.seconds_per_beat, orig_spb)
                    new_notes.push(n)
                }
                result.dur += Note.convert_beats(phr.dur, phr.seconds_per_beat, orig_spb)
                prev_phrase_end_time_in_beats = result.dur
            }
        }
        return result
    }
    filter(min_note={}, max_note=min_note, max_is_inclusive=true, filter_in=true){
        let result = this.copy_except_notes()
        for (let note of this.notes){
            let in_note = note.filter(min_note, max_note, max_is_inclusive, filter_in)
            if (in_note) { result.notes.push(in_note) }
        }
        return result
    }

    merge(...args){
        let result = this.copy()
        let new_notes = result.notes
        let orig_spb  = result.seconds_per_beat
        for (var n_or_p of args){
            n_or_p = n_or_p.copy()
            if(n_or_p instanceof Note){
                let n = n_or_p
                let cur_note_spb  = 1
                let cur_note_time_in_orig_beats = Note.convert_beats(n.time, 1, orig_spb) //just in case n.time != 0
                n.time = cur_note_time_in_orig_beats
                n.dur = Note.convert_beats(n.dur, 1, orig_spb)
                new_notes.push(n)
                result.dur = Math.max(result.dur, n.dur)
            }
            else if(n_or_p instanceof Phrase){ //a given phrase might have notes of different spb
                let phr = n_or_p
                for (var n of phr.notes) {
                    let orig_beats_time_for_n = Note.convert_beats(n.time, phr.seconds_per_beat, orig_spb)
                    n.time = orig_beats_time_for_n
                    n.dur =  Note.convert_beats(n.dur, phr.seconds_per_beat, orig_spb)
                    new_notes.push(n)
                }
                result.dur = Math.max(result.dur, Note.convert_beats(phr.dur, phr.seconds_per_beat, orig_spb))
            }
        }
        return result
    }
    static pattern(pattern_array, phrase_library, merge=false){
        let phrases_to_combine = []
        for(let pat_elt of pattern_array){
            if (pat_elt >= phrase_library.length) {
                 dde_error("Phrase.pattern passed pattern_array containing: " + pat_elt +
                           " which is longer than the phrase_library of: " + phrase_library.length)
            }
            phrases_to_combine.push(phrase_library[pat_elt])
        }
        if      (phrases_to_combine.length == 0) { return new Phrase() }
        let subject = phrases_to_combine[0]
        if (subject instanceof Note)        { subject = new Phrase({notes: [subject]}) }
        if (phrases_to_combine.length == 1) { return subject }
        else {
            let arg_phrases = phrases_to_combine.slice(1)
            if(merge) { return subject.merge(...arg_phrases)  }
            else      { return subject.concat(...arg_phrases) }
        }
    }
    //warning repetitions might not be a whole number
    repeat(repetitions = 2){
        let result = this.copy_except_notes()
        let whole_number = Math.ceil(repetitions)
        let end_time     = this.dur * repetitions

        for(let i = 0; i < whole_number; i++){
            //let new_phrase = this.increment_property("time", this.dur)
            let this_phrase_time_increment = this.dur * i
            for(let orig_n of this.notes){
                let new_n = orig_n.copy()
                new_n.time = new_n.time + this_phrase_time_increment
                let new_n_end_time = new_n.time + new_n.dur
                if(new_n_end_time <= end_time) {  result.notes.push(new_n) }
                //just because we find one note that's over the end,
                //don't stop the for loop since we might have a big chord at the end
                //of the phrase. Even allow for "out of order" notes.

                else if (new_n.time >= end_time) {} //off the end so forget it
                else {  //n overlaps the end time so cut its dur.
                    new_n.dur = end_time - new_n.time
                    result.notes.push(new_n)
                }
            }
        }
        if (result.notes.length == 0) { result.dur = 0}
        else { result.dur = this.dur * repetitions } //handles fractional repetitions too.
        return result
    }
    time_interval(start_time=0, end_time){
        let result = this.copy_except_notes()
        for (let note of this.notes){
            let in_note = note.time_interval(start_time, end_time)
            if (in_note) { result.notes.push(in_note) }
        }
        return result
    }
    transpose(interval_or_array, key="chromatic"){
       if (typeof(interval_or_array) == "number") { interval_or_array = [interval_or_array]}
       const new_notes = []
       for(let note of this.notes){
           if (note.is_rest()) { new_notes.push(note.copy()) }
           else {
               for(let interval of interval_or_array){
                   new_notes.push(note.transpose(interval, key))
               }
           }
       }
       let result = this.copy_except_notes()
       result.notes = new_notes
       return result
    }

    //virtual prop: octave
    set_property(prop_name, new_value){
        let new_phrase = this.copy_except_notes()
        let new_notes = []
        for(let n of this.notes) { new_notes.push(n.set_property(prop_name, new_value)) }
        new_phrase.notes = new_notes
        return new_phrase
    }
    //virtual prop: octave
    increment_property(prop_name, increment, min=-2, max=127){
        let new_phrase = this.copy_except_notes()
        let new_notes = []
        for(let n of this.notes) { new_notes.push(n.increment_property(prop_name, increment, min, max)) }
        new_phrase.notes = new_notes
        return new_phrase
    }
    //virtual prop: time_and_dur
    multiply_property(prop_name, factor, min=-2, max=127){
        let new_phrase = this.copy_except_notes()
        let new_notes = []
        for(let n of this.notes) { new_notes.push(n.multiply_property(prop_name, factor, min, max)) }
        new_phrase.notes = new_notes
        return new_phrase
    }

}
Phrase.default_channel  = 1
Phrase.default_velocity = 0.5
Phrase.default_seconds_per_beat = 1

globalThis.Phrase = Phrase





