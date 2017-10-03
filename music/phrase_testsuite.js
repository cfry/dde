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

new TestSuite("Phrase.filter",
    ['new Phrase("C D E").filter().notes.length', "3"],
    ['new Phrase("C D E").filter({pitch: "D"}).notes.length', "1"],
    ['new Phrase("C D E F").filter({pitch: "D"}, {time: 2}).notes.length', "2"],
    ['new Phrase("C D E F").filter({pitch: "D"}, {pitch: "E"}).notes.length', "2"],
    ['new Phrase("C D E F G").filter({pitch: "D"}, {pitch: "E"}, true, false).notes.length', "3"]
)

new TestSuite("Phrase.time_interval",
    ['new Phrase("C D E F").time_interval().dur', '4'],
    ['new Phrase("C D E F").time_interval(1.5, 2.5).notes.length', "2"]
)
new TestSuite("Phrase.repeat",
    ['new Phrase("C D").repeat()',    'new Phrase("C D C D")'],
    ['new Phrase("C D").repeat(2.5)', 'new Phrase("C D C D C")'],
    ['new Phrase("C D").repeat(2.25)', 'new Phrase("C D C D 1/2C")']
)

new TestSuite("Phrase.arpeggio",
    ['new Phrase("C D").arpeggio([1, 3, 5], "C").notes.length', "6"],
    ['new Phrase("C D").arpeggio([1, 3, 5, 7], "C").notes[1].dur', "0.25"],
    ['new Phrase("C D").arpeggio([1, 3, 5, 7], "C").dur', "2"],
    ['new Phrase("C D").arpeggio([1, 3, 5, 7], "C").notes[5].pitch', "65"]
)

new TestSuite("Phrase.pattern",
    ['Phrase.pattern([0, 0, 1, 0], [new Phrase("C D"), new Phrase("E F")])',
         'new Phrase("C D C D E F C D")'],
     ['var phr11 = Phrase.pattern([0, 1], [new Phrase("C D"), new Phrase("E F")], true)'],
     ['phr11.dur', '2'],
     ['phr11.notes.length', '4'],
     ['phr11.notes[0].pitch', '60'],
     ['var phr12 = Phrase.pattern([0, 1, 0], [new Note("C"), new Phrase("E F")])'],
     ['phr12.dur', '4'],
     ['phr12.notes.length',    '4'],
     ['phr12.notes[0].pitch', '60'],
     ['phr12.notes[2].pitch', '65']    
)



