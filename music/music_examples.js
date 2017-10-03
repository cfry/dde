//Select and eval each example to see the data struture.
//Use Eval&Start to also play them, if you have
//set up a synthesizer (see Ref Man/IO/Sound/Music with MIDI)

new Phrase("C E G B")   //the notes of a C Major 7 chord as a melody
new Phrase("C Eb G Bb") //C Minor 7 arpeggio
new Phrase("C 0.5Eb 1/2G Bb")//durations preceed pitches.
new Phrase("0.5C 0.5C 1/3C 1/3C 4/3C") //you can use floats or ratios for durations.         
new Phrase("C E G R B") //Use a "pitch" of "R" for a rest.
new Phrase("C E G 0.5R B 1/2R G") //Rest have durations too.
new Phrase("CEGB") //spaces separate sequential notes.
                   //remove them to make a chord
new Phrase("C E G2 B2") //octaves follow pitches. 
                        //3 is the default octave & middle C's octave
new Phrase("2CEG2B2") //All the notes of the chord are the 
                      //duration of 2. But only the G and B
                      //are played in OCTAVE 2.
new Phrase("CEG CEG FAC4 FAC4 GBD4 GBD4 FAC4 FAC4")//3 chord rock and roll!
new Phrase({seconds_per_beat: 0.5,
            notes: "CEG CEG FAC4 FAC4 GBD4 GBD4 FAC4 FAC4"})
new Phrase({seconds_per_beat: 0.5,
            notes: `CEG CEG 0.5R 0.5FAC4 FAC4 
                    GBD4 GBD4 0.5R 0.5FAC4 FAC4`})//use backquote for strings contsing newlines
                    //Timing and rests turn nursury rhymes into music. 
new Phrase({
   seconds_per_beat: 0.4,
   channel: 2,
   notes: "CEG CEG 0.5R 0.5FAC4 FAC4 GBD4 GBD4 0.5R 0.5FAC4 FAC4 " +
          "0.5CEG 0.5CEG CEG 0.5R 0.5FAC4 0.5R 0.5FAC4 GBD4 0.125R GBD4 " + 
          " 2/3R 2/3F 2/3FA 2/3FAC4 2/3FAC4E4 2/3FACE4G4 8CEGBD4"
   }) //we can use double quote and + instead of backquote for long strings.
 
var p1 = new Phrase("CEG CEG") //just eval, don't do Eval&Start because setting
                               //a var returns undefined in JS
p1 //Eval&Start
var p2 = new Phrase("0.5R 0.5FAC4 FAC4")
p2
p1.concat(p2)
var p3 = p1.concat(p2).repeat() //default repetitions = 2
p3
p3.seconds_per_beat = 0.5
p3
p3.start() //Use just Eval here to programatically play the notes.
p3.repeat(3) //repeat's argument defaults to 2 but we can put any number
new Phrase("C D E F").repeat(1.5) //by repeating 1.5 times we get 6 notes.

new Phrase("C D E F").transpose(1)  //up a half step
new Phrase("C D E F").transpose(-2) //down a whole step
new Phrase("C D E F").transpose(12) //up an octave
new Phrase("C D E F").transpose(2, "C")
new Phrase("C D E F").transpose(2, "D")

//blues
var roots_1 = new Phrase({seconds_per_beat: 1/3,
                          notes: "8C 8C 8F 8C 8G 8C"})
roots_1 
var blues_chords = roots_1.transpose([1, 3, 5, 6.5], "C")
blues_chords                          
           
var bass_1 = new Phrase({seconds_per_beat: 1/3,
                        notes: "C2 E2 G2 A2 Bb2 A2 G2 E2"})
bass_1
var blues_bass = bass_1.concat(bass_1,
                               bass_1.transpose(5),
                               bass_1,
                               bass_1.transpose(7),
                               bass_1)
blues_bass

blues_chords.merge(blues_bass)


//Light My Fire bass & chords
var p1 = new Phrase("A1 B1")
  p1
  .arpeggio([1, 3, 5], "G", [1/2, 1/4, 1/4])
  .merge(
  p1.transpose([1+7, 3+7, 5+7], "G" ) //the chords A minor, B minor
  .set_property("velocity", 0.4)) //make chords quieter to not overwhelm bass line
  .repeat(16)

Phrase.pattern //used for even higher level composition.   
