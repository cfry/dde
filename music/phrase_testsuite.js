new TestSuite("Phrase",
    ['new Phrase("C").notes.length', "1"],
    ['new Phrase("C").notes[0].pitch', "60"],
    ['new Phrase("C").notes[0].dur', "1"],
    ['new Phrase("C D").notes.length', "2"],
    ['new Phrase("C# R D").notes.length', "3"],
    ['new Phrase("C# R D").notes[1].pitch', "-1"],
    ['new Phrase("CE").notes[1].time', "0"],
    ['new Phrase({channel:  3, notes:"C"}).notes[0].channel', '3'],
    ['new Phrase({velocity: 0.25, notes:"C"}).notes[0].velocity', '0.25'],
    [`new Phrase({notes: [new Note({time: 0, dur: 1, pitch: 60, velocity: 0.25, channel:  1}),
                          new Note({time: 3, dur: 1, pitch: 61, velocity: 0.75, channel:  2})]}).notes[1].velocity`,
                         "0.75"]
    )
    
new TestSuite("Phrase.merge", 
    ['new Phrase({seconds_per_beat: 0.5, notes: "C E"}).merge(new Phrase("G B")).notes.length', "4"],    
    ['new Phrase({seconds_per_beat: 0.5, notes: "C E"}).merge(new Phrase("G B")).dur', "4"],
    ['new Phrase("C E").merge(new Phrase("G B")).dur', "2"]
)

new TestSuite("Phrase.concat",
    ['var test_phr1 = new Phrase({notes: "C 0.5D", seconds_per_beat: 0.5})'],
	['test_phr1.concat(new Note("E")).notes.length', "3"],
    ['test_phr1.concat(new Note("E")).notes[2].time', "1.5"],
    ['test_phr1.concat(new Note("E")).notes[2].dur', "2"],
	[`var test_phr2 = new Phrase({seconds_per_beat: 1/2,
                  notes: "C2 E2"}).concat(
                    new Phrase("G2 A2"), 
                    new Phrase("Bb2 A2 G2 E2"))`],
    ['test_phr2.notes.length', "8"],
    ["test_phr2.notes[3].time", "4"],
    ["test_phr2.notes[3].dur", "2"],
    ["test_phr2.dur", "14"]
)

new TestSuite("Phrase.transpose",   
    ['new Phrase("C").transpose(2).notes[0].pitch', "62"],
    ['new Phrase("C F").transpose([0, 4]).notes[1].pitch', "64"],
    ['new Phrase("C F").transpose([1, 3], "C").notes[3].pitch', "69"],
    ['new Phrase("C R F").transpose([1, 3], "C").notes[2].pitch', "-1"], 
    ['new Phrase("C R F").transpose([1, 3], "C").notes.length', "5"],
    ['new Phrase("C").transpose(6.5, "C").notes[0].pitch', "70"] 
)

new TestSuite("Phrase.set_property",
    ['new Phrase("C C4").set_property("pitch", 50).notes[0].pitch', "50"],    
    ['new Phrase("C C4").set_property("pitch", 50).notes[1].pitch', "50"],
    ['new Phrase("C C4").set_property("octave", 5).notes[1].pitch', "84"],
    ['new Phrase("C C4").set_property("octave", 5).notes[0].octave()', "5"]
)

new TestSuite("Phrase.increment_property",
    ['new Phrase("C C4").increment_property("pitch", 2).notes[0].pitch', "62"],    
    ['new Phrase("C C4").increment_property("pitch", 2).notes[1].pitch', "74"],
    ['new Phrase("C C4").increment_property("octave", 1).notes[1].pitch', "84"],
    ['new Phrase("C C4").increment_property("octave", 2).notes[0].octave()', "5"]
)

new TestSuite("Phrase.multiply_property",
    ['new Phrase("C C4").multiply_property("velocity", 1.5).notes[0].velocity', "0.75"],    
    ['new Phrase("C C4").multiply_property("dur", 0.5).notes[1].dur', "0.5"],
    ['new Phrase("C C4").multiply_property("time", 2).notes[1].time', "2"],
    ['new Phrase("C C4").multiply_property("time_and_dur", 4).notes[0].dur', "4"],
    ['new Phrase("C C4").multiply_property("time_and_dur", 4).notes[1].time', "4"],
    ['new Phrase("C C4").multiply_property("time_and_dur", 4).notes[1].dur',  "4"]
)
/*
new Phrase("CEGB R DFAC4 R EGBD4 R DFAC4").start() //does play final A

//3 chord rock and roll
new Phrase({
   seconds_per_beat: 0.3,
   channel: 2,
   notes: "CEG CEG 0.5R 0.5FAC4 FAC4 GBD4 GBD4 0.5R 0.5FAC4 FAC4 " +
          "0.5CEG 0.5CEG CEG 0.5R 0.5FAC4 0.5R 0.5FAC4 GBD4 0.125R GBD4 2/3R 2/3F 2/3FA " +
          " 2/3FAC4 2/3FAC4E4 2/3FACE4G4 8CEGBD4"
   }).start()
   
//blues
 new Phrase({channel: 1, 
                seconds_per_beat: 1/2,
                notes: "8C 8C 8F 8C 4G 4F 4C 4G"}).transpose([1, 3, 5, 6.5], "C")
   
new Note("C").play()
new Note("1").play()

new Phrase({seconds_per_beat: 1/3,
                  notes: 
                    new Phrase("C2 E2").concat(
                    new Phrase({seconds_per_beat: 1/3,
                                notes: "G2 A2"}), 
                    new Phrase({seconds_per_beat: 1/3,
                                notes: "Bb2 A2 G2 E2"}))})
                                
*/

