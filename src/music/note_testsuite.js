new TestSuite("Note",
     ["Midi.init()"],
     ["WebMidi.noteNameToNumber('C4')", "60"],
    ["new Note()", `new Note({
channel: 1,
time: 0,
dur: 1,
pitch: 60,
velocity: 0.5
})`],

['new Note("D5")', `new Note({
channel: 1,
time: 0,
dur: 1,
pitch: 74,
velocity: 0.5
})`],
    ['new Note("Eb-1")', `new Note({
channel: 1,
time: 0,
dur: 1,
pitch: 3,
velocity: 0.5
})`],
    ['new Note("2C#3")', `new Note({
channel: 1,
time: 0,
dur: 2,
pitch: 49,
velocity: 0.5
})`]
)

new TestSuite("Note.to_source_code",
    ['new Note("2C#3").to_source_code()', `'new Note("2C#3")'`],
    ["new Note({velocity: 0.7}).to_source_code()", 
      `'new Note({time: 0, dur: 1, pitch: "C4", velocity: 0.7, channel:  1})'`]
    )


new TestSuite("Note.diatonic_transpose",
    ['Note.diatonic_transpose("C", "C", 0)', '60'],
    ['Note.diatonic_transpose("C", "C", 1)', "60"],
    ['Note.diatonic_transpose("C", "C", 2)', "62"],
    ['Note.diatonic_transpose("C", "C", 3)', "64"],
    ['Note.diatonic_transpose("C", "C", 4)', "65"],
    ['Note.diatonic_transpose("C", "C", 5)', "67"],
    ['Note.diatonic_transpose("C", "C", 6)', "69"],
    ['Note.diatonic_transpose("C", "C", 7)', "71"]  
)

 new TestSuite("Note.diatonic_transpose_2",
    ['Note.diatonic_transpose("C", "C", 8)', "72", "C4"],
    ['Note.diatonic_transpose("C", "C", 9)', "74", "D4"],    
    ['Note.diatonic_transpose("C", "C", 10)', "76", "E4"],
    ['Note.diatonic_transpose("C", "C", 11)', "77", "F4"],
    ['Note.diatonic_transpose("C", "C", 12)', "79", "G4"],
    ['Note.diatonic_transpose("C", "C", 13)', "81", "A4"],
    ['Note.diatonic_transpose("C", "C", 14)', "83", "B4"]  
)

new TestSuite("Note.diatonic_transpose_3",
    ['Note.diatonic_transpose("C", "C", -1)', '60'],
    ['Note.diatonic_transpose("C", "C", -2)', "59", "B2"],
    ['Note.diatonic_transpose("C", "C", -3)', "57", "A2"],
    ['Note.diatonic_transpose("C", "C", -4)', "55", "G2"],
    ['Note.diatonic_transpose("C", "C", -5)', "53", "F2"],
    ['Note.diatonic_transpose("C", "C", -6)', "52", "E2"],
    ['Note.diatonic_transpose("C", "C", -7)', "50", "D2"],
    ['Note.diatonic_transpose("C", "C", -8)', "48", "C1"],
    ['Note.diatonic_transpose("C", "C", -9)', "47", "B0"]
)  

new TestSuite("Note.diatonic_transpose_4",
     ['Note.diatonic_transpose("C", "D", 1)',  "60"],
     ['Note.diatonic_transpose("C", "D", 2)',  "62", "D3"],
     ['Note.diatonic_transpose("C#", "D", 2)', "62"],
     ['Note.diatonic_transpose("D", "D", 2)',  "64", "E3"],
     ['Note.diatonic_transpose("D", "D", 3)',  "66", "F#3"],
     ['Note.diatonic_transpose("D", "D", 4)',  "67", "G3"],
     ['Note.diatonic_transpose("F", "D", 2)', "67"],
     ['Note.diatonic_transpose("D", "D", -2)', "61", "C#3"],
     ['Note.diatonic_transpose("D", "D", -3)', "59", "B2"]
     )
     
new TestSuite("Note.diatonic_transpose_5",
    ['Note.diatonic_transpose("C", "C", 0)',    "60"],
    ['Note.diatonic_transpose("C", "C", 0.5)',  "60"],
    ['Note.diatonic_transpose("C", "C", 1)',    "60"],
    ['Note.diatonic_transpose("C", "C", -0.5)', "60"],
    ['Note.diatonic_transpose("C", "C", -1)',   "60"]
) 

new TestSuite("Note.diatonic_transpose_6",
    ['Note.diatonic_transpose("C", "C",  1.5)', "61"],
    ['Note.diatonic_transpose("C", "C",  2.5)', "63"],
    ['Note.diatonic_transpose("C", "C", -1.5)', "59"],
    ['Note.diatonic_transpose("C", "C", -2.5)', "58"],
    ['Note.diatonic_transpose("C", "D", 1.5)', "61"],
    ['Note.diatonic_transpose("C", "D", 2.5)', "63", "D#3"]
)    
    
new TestSuite("Note.transpose",
   ['new Note("C").transpose(3).pitch', "63"],
   ['new Note("C").transpose(3, "C").pitch', "64"],
   ['new Note("C").transpose([0,2]).notes.length', "2"],
   ['new Note("C").transpose([1,3]).notes[1].pitch', "63"],
   ['new Note("C").transpose([1, 3, 5, 7], "C").notes[3].pitch', "71"] 
)

new TestSuite("Note.set_property",
    ['new Note("C").set_property("pitch", "C#4").pitch', "61"],
    ['new Note("C").set_property("pitch", "C#2", "B2", "C4").pitch', "47"], 
    ['new Note("C").set_property("pitch", "C#5", "B2", "C4").pitch', "60"],    
    ['new Note("C").set_property("pitch", 55).pitch', "55"],
    ['new Note("C").set_property("pitch", 55, 62, 70).pitch', "62"],
    ['new Note("C").set_property("pitch", 72, 62, 70).pitch', "70"], 
    ['new Note("C").set_property("time", 130).time', "130"], 
    ['new Note("C").set_property("octave", 5).pitch', "72"]
 )
new TestSuite("Note.increment_property",
    ['new Note("C").increment_property("pitch", 2).pitch', "62"],
    ['new Note("C").increment_property("pitch", -2).pitch', "58"],    
    ['new Note("C").increment_property("pitch", 2, "E", "G").pitch', "64"],
    ['new Note("B").increment_property("pitch", 2, "E", "G").pitch', "67"],
    ['new Note("C").increment_property("octave", 2).pitch', "84"] 
)

new TestSuite("Note.multiply_property",
    ['new Note("C").multiply_property("velocity", 2).velocity', "1"],
    ['new Note("C").multiply_property("dur", 2).dur', "2"],
    ['new Note("C").multiply_property("time_and_dur", 2).dur', "2"],
    ['new Note("C").multiply_property("time_and_dur", 2).time', "0"],
    ['new Note({time:3}).multiply_property("time_and_dur", 2).time', "6"],
    ['new Note({time:3, dur:4}).multiply_property("time_and_dur", 2).dur', "8"]
)

new TestSuite("Note.filter",
    ['new Note("C").filter() instanceof Note', "true"],
    ['new Note("C").filter({pitch: "C"}) instanceof Note', "true"],
    ['new Note("C").filter({pitch: "D"})',  "null"],
    ['new Note("C").filter({pitch: "B2"})', "null"],
    ['new Note("C").filter({pitch: "B2"}, {pitch: "D"}) instanceof Note', "true"], //ok
    ['new Note("C").filter({pitch: "B2"}, {pitch: "C"}, false)', "null"],
    ['new Note("C").filter({pitch: "B2"}, {pitch: "C"}, true) instanceof Note', "true"],
    ['new Note("C").filter({channel: 1}) instanceof Note', "true"],
    ['new Note("C").filter({channel: 2})', "null"],
    ['new Note("C").filter({dur: 1}) instanceof Note', "true"], //ok
    ['new Note("C").filter({dur: 0.5})', "null"],
    ['new Note("C").filter({time: 0}) instanceof Note', "true"],
    ['new Note("C").filter({time: 2})', "null"],
    ['new Note("C").filter({velocity: 0.5}) instanceof Note', "true"], //ok
    ['new Note("C").filter({velocity: 0.25})', "null"],
    ['new Note("C").filter({pitch: 60, velocity: 0.5}) instanceof Note', "true"],
    ['new Note("C").filter({pitch: 60, velocity: 0.25})', "null"],
    ['new Note("C").filter({pitch: "R"})', "null"], //ok
    ['new Note("C").filter({pitch: -1})', "null"],
    ['new Note("R").filter({pitch: "R"}) instanceof Note', "true"],
    ['new Note("R").filter({pitch: "C"}).pitch', "-1"]   
)

new TestSuite("Note.filter_out",
    ['new Note("C").filter({pitch: "C"}, {pitch: "C"}, true, false)', "null"],
    ['new Note("C").filter({pitch: 60, velocity: 0.25}, {pitch: 60, velocity: 0.75}, true, false)', "null"],
    ['new Note("C").filter({pitch: "A2"}, {pitch: "B2"}, true, false) instanceof Note', "true"]
)

new TestSuite("Note.time_interval",
    ['new Note("C").time_interval()', "new Note({channel: 1, time: 0, dur: 1, pitch: 60, velocity: 0.5})"],
    ['new Note("C").time_interval(0.2, 0.5).time', "0.2"],
    ['new Note("C").time_interval(0.2, 0.5).dur', "0.3"],
    ['new Note("C").time_interval(1.2, 1.5)', "null"]
)

new TestSuite("Note.repeat",
    ['new Note("C").repeat(4).dur', "4"],
    ['new Note("C").repeat(4).time', "0"],
    ['last(new Note("C").repeat(4).notes).time', "3"],
    ['new Note("C").repeat(4).notes.length', "4"],
    ['new Note("C").repeat(4).dur', "4"],
    ['new Note("1/2C").repeat(4).dur', "2"],
    ['new Note("C").repeat(0).notes.length', "0"],
    ['new Note("1/2C").repeat(2.5).dur', '1.25']
)

new TestSuite("Note.arpeggio",
    ['new Note("C").arpeggio([0, 4, 7]).notes.length', "3"],
    ['new Note("C").arpeggio([0, 4, 7]).dur', "1"],
    ['new Note("C").arpeggio([0, 4, 7]).notes[2].time', "0.6666666666666666"],
    ['new Note("C").arpeggio([1, 3, 5], "C").notes[1].pitch', "64"],
    ['new Note("C").arpeggio([1, 3, 5], "C", [0.5, 0.25, 0.25]).notes[1].dur', "0.25"]
)
    

/*beep.start = function(){out("beeping")}
beep()
beep.start()
beep.dur
new Job({name: "my_job",
         do_list: [beep, IO.out("aa")]})
*/

   



    
