/**
 * Created by Fry on 8/6/17.
 */

Phrase = class Phrase{
    constructor({notes=".5C3 2D3",
                time=0, //in beats
                duration=null,   //in beats, null means compute dur from time and end of last note
                                 //this is the "logical dur", ie 2 bars or 4 bars (8 or 16 respectively)
                                 //ignoring pickup notes and ignroing some rest at the end.
                                 //used for "concatenating phrases where you might have "picu notes"
                                 //before the logical 0 of the phrase. Those pickup notes
                                 //play during the time of the previous bar, and would have negative
                                 // start times.
                velocity=0.5,
                channel=null, //null means leave the channel alone in tne note. If creating a new
                              //note, this would mean it defaults to 1.
                seconds_per_beat=1
                }){
        this.time = time
        this.channel = channel
        this.seconds_per_beat = seconds_per_beat
        var time_of_next_note = time //in beats
        if(typeof(notes) == "string"){
           const array_of_note_strings = notes.trim().split(" ")
           this.notes = []
           for (var note_string of array_of_note_strings) {
               note_string = note_string.trim()
               if (note_string == "") {} //happens if user puts 2 spaces between notes. skip it
               else {
                   var note = Note.n(note_string)
                   note.time = time_of_next_note
                   note.seconds_per_beat = seconds_per_beat
                   note.velocity = velocity
                   if(channel) {  note.channel = channel }
                   this.notes.push(note)
                   time_of_next_note += note.duration
               }
           }
        }
        else { this.notes = notes }
        if (duration === null) { this.duration = time_of_next_note } //in beats
        else { this.duration = duration }
        this.velocity = velocity
        this.seconds_per_beat = seconds_per_beat
    }
    copy(){
         let notes_copy = []
         for(let n of this.notes) { notes_copy.push(n.copy()) }
         return new Phrase({notes:              notes_copy,
                            time:               this.time,
                            duration:           this.duration,
                            velocity:           this.velocity,
                            channel:            this.channel,
                            seconds_per_beat:   this.seconds_per_beat})
    }
    //this is used in Instruction.control.play to decide when playing a phrase,
    //how long from the start of the instruction should it be until the instruction ends
    //and the next instruction should be run.
    dur_in_seconds()      { return this.duration * this.seconds_per_beat }
    dur_in_ms()           { return Math.round(this.dur_in_seconds() * 1000) }
    seconds_to_beats(secs){ return secs / this.seconds_per_beat }

    play(){
        for(let note of this.notes){
            note.play()
        }
        return this
    }

    concat(...args){
        var result = this.copy()
        var new_notes = result.notes
        var orig_spb = result.seconds_per_beat
        for (var n_or_p of args){
            n_or_p = n_or_p.copy()
            if(n_or_p instanceof Note){
                var n = n_or_p
                var time_in_seconds = n.time * n.seconds_per_beat
                var time_in_beats_of_result = time_in_seconds / result.seconds_per_beat
                n.time = result.duration + time_in_beats_of_result
                n.duration = n_or_p.dur_in_seconds() / result.seconds_per_beat
                n.seconds_per_beat = result.seconds_per_beat
                new_notes.push(n)
                result.duration += result.seconds_to_beats(n.dur_in_seconds())
            }
            else if(n_or_p instanceof Phrase){
                for (var n of n_or_p.notes) {
                    var time_in_seconds = n.time * n.seconds_per_beat
                    var time_in_beats_of_result = time_in_seconds / result.seconds_per_beat
                    n.time = result.duration + time_in_beats_of_result
                    n.duration = n.dur_in_seconds() / result.seconds_per_beat
                    n.seconds_per_beat = result.seconds_per_beat
                    new_notes.push(n)
                }
                var new_p_dur_in_beats_of_result = n_or_p.dur_in_seconds() / result.seconds_per_beat
                result.duration += new_p_dur_in_beats_of_result
            }
        }
        return result
    }
    merge(...args){
        var result = this.copy()
        var new_notes = result.notes
        var orig_spb = result.seconds_per_beat
        var longest_dur = result.duration
        for (var n_or_p of args){
            n_or_p = n_or_p.copy()
            if(n_or_p instanceof Note){
                var n = n_or_p
                var time_in_seconds = n.time * n.seconds_per_beat
                var time_in_beats_of_result = time_in_seconds / result.seconds_per_beat
                n.time = time_in_beats_of_result
                n.duration = n_or_p.dur_in_seconds() / result.seconds_per_beat
                n.seconds_per_beat = result.seconds_per_beat
                new_notes.push(n)
                var new_dur_in_beats_of_result = result.seconds_to_beats(n.dur_in_seconds())
                longest_dur = Math.max(longest_dur, new_dur_in_beats_of_result)
            }
            else if(n_or_p instanceof Phrase){
                for (var n of n_or_p.notes) {
                    var time_in_seconds = n.time * n.seconds_per_beat
                    var time_in_beats_of_result = time_in_seconds / result.seconds_per_beat
                    n.time = time_in_beats_of_result
                    n.duration = n.dur_in_seconds() / result.seconds_per_beat
                    n.seconds_per_beat = result.seconds_per_beat
                    new_notes.push(n)
                }
                var new_dur_in_beats_of_result = n_or_p.dur_in_seconds() / result.seconds_per_beat
                longest_dur = Math.max(longest_dur, new_dur_in_beats_of_result)
            }
        }
        result.duration = longest_dur
        return result
    }

}



