new TestSuite("Note",
     ["Midi.init()"],
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
pitch: 86,
velocity: 0.5
})`],
    ['new Note("Eb-1")', `new Note({
channel: 1,
time: 0,
dur: 1,
pitch: 15,
velocity: 0.5
})`],
    ['new Note("2C#3")', `new Note({
channel: 1,
time: 0,
dur: 2,
pitch: 61,
velocity: 0.5
})`],
  // ['new Note("C").start().pitch', "60"],
   ['new Note("C").transpose(3).pitch', "63"],
   ['new Note("C").transpose(3, "C").pitch', "64"],
   ['new Note("C").transpose([0,2]).notes.length', "2"],
   ['new Note("C").transpose([1,3]).notes[1].pitch', "63"],
   ['new Note("C").transpose([1, 3, 5, 7], "C").notes[3].pitch', "71"]
   
)

new TestSuite("Note.set_property",
    ['new Note("C").set_property("pitch", "C#4").pitch', "73"],
    ['new Note("C").set_property("pitch", "C#2", "B2", "C4").pitch', "59"], 
    ['new Note("C").set_property("pitch", "C#5", "B2", "C4").pitch', "72"],    
    ['new Note("C").set_property("pitch", 55).pitch', "55"],
    ['new Note("C").set_property("pitch", 55, 62, 70).pitch', "62"],
    ['new Note("C").set_property("pitch", 72, 62, 70).pitch', "70"], 
    ['new Note("C").set_property("time", 130).time', "130"], 
    ['new Note("C").set_property("octave", 5).pitch', "84"]
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
    
