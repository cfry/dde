/* Created by Fry on 3/11/16.*/
var job_examples = [null, //don't have example 0
`//////// Job Example 1
//A Job is esssentially a named list of instructions to
//be executed by a robot. There are several different
//formats for instructions. The most general is a
//function defintion. Below you can define a simple job
//with a name and 2 instructions by
//holding down the 'alt' key and clicking on 'new'.
//This will select the Job definition.
//With that selected, click the Eval button.
new Job({name: "my_job",
         do_list: [Robot.out("first instruction"), //will cause 'first instruction' to be printed in output pane when run
                   function(){out("2nd instruction")}]}) //This function will be called
   
//Now click the Output pane's Clear button.
//Hold down the 'alt' key and click on 'my_job'
//to select this call to 'start'.
//Click the Eval button.               
Job.my_job.start() //Start running 'my_job'
//Scroll to the top of the Output pane.
//You will see 'Starting job", followed by
//the results of calling the two function instructions
//followed by details of the job's ending state,
//including status_code: "completed" if all goes well.
`,

`///////// Job Example 2
//An instruction can also be a function call that
//returns a low level array for Dexter to execute.
///Dexter.sleep and Dexter.move_to
//are two such calls. Select and eval them to see their result.
//Just as in a normal JavaScript program, we can
//wrap a call in another function and call that other function
//as we do below by wrapping Dexter.move_all_joints in "move_once".
function move_once(){
    return Dexter.move_all_joints([1, 2, 3, 4, 5]) //also try: Dexter.move_to([100000, 200000, 300000])
}
function sleep_and_move(){
    return [Dexter.move_all_joints([10000, 20000, 30000, 40000, 50000]),
            Dexter.sleep(500),
            Dexter.move_to([100000, 200000, 250000], [0, 0, -1], Dexter.RIGHT_UP_IN)
           ]
}
new Dexter({name: "my_dex",
            simulate: true //simulate is true by default
           })
new Job({name: "j1",
         robot: Robot.my_dex, //assigns a robot to this job
         do_list: [move_once, sleep_and_move]} //use the above function definitions as do_list items
)
Job.j1.start()
/* Job.j1                    //the newly created Job instance
 Job.j1.status_code
 Job.j1.robot.joint_angles() //array of 5 angles, each in arcseconds
 Job.j1.robot.joint_angle(2) //1 thru 5
 Job.j1.robot.joint_xyz(5)   //0 thru 5, default 5. 0 is robot base position
 Job.j1.robot.joint_xyzs()   //Array of base xyz and all joint xyzs.
*/
`,


`//////// Job Example 3: Generators  See https://davidwalsh.name/es6-generators
//A generator is a function that can effectively return a value
//in the middle of its definition via 'yield', then be called again
//and resume after the previous 'yield'.
//A generator can be used as a do-list instruction.
//Running a job automatically handles the re-calling
//of a generator until its exhausted.

//_______Job Example 3a: Simple Generator
function* gen_moves(){
    yield (Dexter.move_all_joints([1, 200000, 3, 40, 50]))
    yield (Dexter.sleep(1000))
    yield* [Dexter.move_all_joints([1, 300001]),
            Dexter.sleep(999)
           ]
}
new Job({name: "j1", robot: new Dexter(), do_list: [gen_moves]})
Job.j1.start()

//_______Job Example 3b: Generator with for loop
function* complex_gen(){
    for(var i = 0; i < 4; i++){
        yield Dexter.move_all_joints(i * 100000)
    }
}
new Job({name: "j2",  robot: new Dexter(), do_list: [complex_gen]})
Job.j2.start()

//________Job Example 3c: Nested Generators
function* nested_gen(){
    var complex_iterator = complex_gen()
    for(var instru of complex_iterator){
        yield instru
    }
    yield Dexter.sleep(1000)
}
new Job({name: "j3", robot: new Dexter(), do_list: [nested_gen]})
Job.j3.start()
`,


`////////Job Example 4a: synchronizing Jobs
//The sync_point control instruction causes a job
//to wait until all the other jobs with the same
//sync_point name (i.e. "midway") reach that sync point.
new Job({name: "job_a",
    do_list: [Robot.out("hello"),
              Robot.sync_point("midway", ["job_a", "job_b"]),
              Robot.out("goodbye")]})

new Job({name: "job_b",
    do_list: [Robot.out("hello"),
              Robot.wait_until(10000),
              Robot.sync_point("midway", ["job_a", "job_b"]),
              Robot.out("goodbye")]})
Job.job_a.start(); Job.job_b.start() //execute both at once.
//job_a will wait at its "midway" point until job_b gets to 
//its "midway" point, then they both proceed.


/////////Job Example 4b: One job controlling another
//Control instructions increase the flexibility of Jobs.
//They can add instructions to other jobs (send_to_job)
// as well as pause (suspend) and resume (unsuspend) jobs.

new Dexter({name: "my_dex", ip_address: "192.168.1.142", port: 5000})
new Job({name: "j4", robot: Robot.my_dex,
         do_list: [Dexter.move_all_joints(100000, 200000),
                   Robot.suspend(), //j5 will unsuspend this
                   Robot.out("j4 sez goodbye.")]})
Job.j4.start()

new Dexter({name: "my_dex2", ip_address: "192.168.1.143", port: 5000})
new Job({name: "j5", robot: Robot.my_dex2,
         do_list: [Robot.send_to_job(
                     {do_list_item: Dexter.move_to([100000, 100000, 100000]),
                      where_to_insert: {job: "j4", offset: "after_program_counter"},
                      unsuspend: true,
                      wait_until_done: true}),
                   Robot.out("j5 sez goodbye.")]})
Job.j5.start()

////////Job Example 4c: Instructing another job and getting its data
//In DDE, its easy for a job to get the state of another job.
//Job.other_job_name.program_counter or Job.other_job_name.user_data
//or any other part of the job. But if you want to send an instruction
//to another job, then get the effect of that instruction has had,
// use sent_to_job with a status_variable_name, etc as below
//and you can bring that remote data into the user_data of the requesting job.
//First we create the job that is being controlled by, and supplying
//data to another job:
new Job({name: "j6", robot: new Dexter(), do_list: []})
//we'll let j7 start j6

//Now for our requesting job:
new Job({name: "j7",
         do_list: [Robot.send_to_job({
                      do_list_item: Dexter.move_all_joints(200000, 100000),
                      where_to_insert: {job: "j6", offset: "program_counter"},
                      start: true, //starts j6
                      wait_until_done: true,
                      status_variable_name: "that_j6_task",
                      //and any number of values you want to get from j6
                      j6_joint_5_pos:    function(){return this.robot.joint_xyz(5)},
                      j6_angle_number_2: function(){return this.robot.joint_angle(2)}
                      })]})
Job.j7.start()
/* Job.j7.user_data    contains info snatched from job j6
If you use Robot.send_to_job({where_to_insert: {job: "to_job", offset: "end"},
                              wait_until_done: true, ...}
then the job with the sent_to_job instruction will wait until
the whole of the to_job is done before proceeding                           
*/

////// Job Example 4d: Extending the do_list when calling start.
//sent_from_job is not commonly used by users directly,
//but is used internally by send_to_jobs that are not yet started.
new Job ({name: "j8",
          do_list: [Robot.out("first instruction"), //will cause 'first instruction' to be printed in output pane when run
                    Robot.sync_point("sp1"),
                    Robot.out("2nd instruction")]})
                
Job.j8.start(Robot.sent_from_job({do_list_item: 
                                  Robot.out("special insert"),
                                  where_to_insert: "sp1"})) //insert "special interest" between "first instruction" nad "2nd instruction"
                                  
`,


`//////// Job Example 5 Calling show_window from an instruction
function handle_print_job_1_dialog_input(vals){
    if(vals.clicked_button_value == "Continue"){
        Job.print_job_1.user_data.color = vals.input_3
        Job.print_job_1.user_data.color_status = "ok"
    }
    else if(vals.clicked_button_value == "Cancel"){
        Job.print_job_1.user_data.color_status = "cancel"
    }
}

function print_job_1_dialog(){
    show_window({content:` + "`" + `
        <span style="font-size:18px; font-family:serif; font-style:normal; color:#000000; font-weight:200;">
                There's no more white filament left.
            <br/>
            Please choose another color or cancel the job.</span>
            <br/>
            <span style="font-size:18px; font-family:serif; font-style:normal; color:#000000; font-weight:200;">
                <input name="input_3" type="radio" value="black" checked/>black&nbsp;
        <input name="input_3" type="radio" value="blue"/>blue&nbsp;
        </span>
            <br/>
            <input type="submit" value="Continue"/>
                <input type="submit" value="Cancel"/>
        ` + "`" + `,
        title: "Warning!",
        background_color: "#eeeeee",
        height: 150,
        callback: handle_print_job_1_dialog_input
    }
    )
}

new Job({name: "print_job_1", robot: new Dexter(),
    do_list:
    [Dexter.move_all_joints([1, 2, 3, 4, 5]),
     function(){print_job_1_dialog()},
     Robot.wait_until(function(){return this.user_data.color_status != undefined}),
     function(){if (this.user_data.color_status == "cancel"){
                    return Robot.error("ran out of filament.")
                   }
                else {return null}
               },
     Dexter.move_all_joints([10, 20, 30, 40, 50])
    ]})
Job.print_job_1.start()
// Job.print_job_1.user_data  //data set by the dialog
`,


`//////// Job Example 6a: Using a human 'robot' cooperating with a Brain robot
//Jobs may contain instructions for human operators as well as robots,
//facilitating well-coordinated human-machine processes.
new Job({name: "lots_of_options_task",
         robot: new Dexter(),
         do_list: [Human.task({task: "Load more filament.",
                               title: "Pay Attention!!!",
                               x: 0,
                               y: 0,
                               width: 600,
                               height: 150,
                               background_color: "rgb(230, 200, 250)"
                             }), //waits until user clicks 'Done'.
                    Dexter.move_to([0, 100000, 450000])
                ]})                           
Job.lots_of_options_task.start()

//////// Job Example 6b: Dependent Jobs
new Job({name: "dependent_job", //robot type defaults to Brain
    do_list: [Robot.sync_point("load_filament", ["my_job"]),
              Robot.out("dependent_job last instruction")]})

new Job({name: "my_job", robot: new Human({name: "Joe Jones"}),
    do_list: [Human.task({task: "Load more filament.",
                          height: 150,
                          dependent_job_names: ["dependent_job"]}), //this optional arg
                    //lists jobs to be stopped if user clicks
                    //"Stop this & dependent jobs" button.
              Robot.sync_point("load_filament"),
              Robot.out("my_job last instruction")]})

Job.dependent_job.start(); Job.my_job.start() //start both at once


//////// Job Example 6c: human chooses material from list
new Job({name: "material_job", robot: new Human({name: "Joe Jones"}),
    do_list: [Human.enter_choice({
                 task: "Which material should we use?",
                 user_data_variable_name: "material_choice", // user_data variable to store choice
                 choices: ["copper", "silver", "gold"],
                 show_choices_as_buttons: false, // the default, which shows choices as menu items
                 one_button_per_line: false,     // the default. relevant when showing buttons only
                 dependent_job_names: []}),      // [] means no dependent jobs.
              Robot.out("material_job last instruction")
              ]})
Job.material_job.start()
// Job.material_job.user_data

//////// Job Example 6d: human enters a number
new Job({name: "number_job",
    robot: new Human({name: "Joe Jones"}),
    do_list: [Human.enter_number({
        task: "How many millimeters long should we make the pipe?",
        user_data_variable_name: "pipe_length", // user_data variable to store the number
        initial_value: 15,
        min: 10,
        max: 1000,
        step: 1,
        dependent_job_names: []}), // [] means no dependent jobs.
        Robot.out("number_job last instruction")]})
Job.number_job.start()
// Job.number_job.user_data

//////// Job Example 6e: human enters text
new Job({name: "text_job",
    robot: new Human({name: "Joe Jones"}),
    do_list: [Human.enter_text({
        task: "Describe how this job is going.",
        user_data_variable_name: "job_description", // user_data variable to store the text
        initial_value: "OK",
        line_count: 3,
        dependent_job_names: []}), // [] means no dependent jobs.
        Robot.out("text_job last instruction")]})
Job.text_job.start()
// Job.text_job.user_data

//////// Job Example 6f: Notify
//Tell human something without pausing execution.
new Job({name: "notify_job",
    robot: new Human({name: "Joe Jones"}),
    do_list: [Human.notify({
        task: "Take off work early today!",
        window: true,      //the default
        output_pane: true, //the default
        beep_count: 0,     //the default
        speak: false       //the default
        }),
        Robot.out("text_job last instruction")]})
Job.notify_job.start()
`,


`//////// Job Example 7: Human Enter Instruction
//This job pauses and presents a dialog box allowing
//the entry of an instruction, to continue the job, or to cancel it.
//An instruction can be entered via text or we can GENERATE
//instructions by moving a Dexter robot where we want it to
//go as in 'training'.
new Dexter({name: "my_dex", ip_address: "192.168.1.142", port: 50000})

new Job({name: "my_job",
    robot: Robot.my_dex,
    do_list: [function(){out("first instruction")}, //will cause 'first instruction' to be printed in output pane when run
        Human.enter_instruction(), // Pops up a dialog requesting user input of an instruction.
        Robot.out("last instruction")]})

Job.my_job.start()
`,


`/*     Job Example 8 Async Instructions
Using "dont_call_set_up_next_do"
 Normally when a function in JS is called, it
 executes the code in its body and returns 
 (possibly with a value computed by the body).
 These are called "Synchronous Functions".
 But some functions, particularly ones that take a long time
 to run (ie hundreds of milliseconds or more) or are 
 performed on other computers such as a Dexter, are 
 designed to return immediately when called, but then 
 the real work of the function goes on behind the scenes. 
 These are called "Asynchronous Functions".
 Often such functions take an argument
 that is a "callback function" that is called when 
 the real work of the function ends. 
 
 If you want to call such a function,
 and wait until its done, before calling another function,
 you can't simply place calls to the functions
 one after the other as in normal code, because 
 the 2nd one will start executing right after the 
 immediate return of the first,
 not when the "real work" of the 1st is done.

 An example of such a function is "beep" 
 (supplied in DDE, but not normal JS). 
 First try a call to beep:
 */
beep({frequency: 440})
/*ok now select two calls to beep at once before hitting "Eval".*/
beep({frequency: 440, duration: 1000})
beep({frequency: 500, duration: 2000})
/*notice that the first call returns immediately and the
 2nd call is executing while the first beep is still beeping
 thus playing a 2 note chord.
 (We've extending the duration of the 2nd note to have it
 continue beyond the first to make the chord more obvious.

 OK playing chords is nice but what if you want to play a melody,
 ie one note AFTER the first has completed? 
 One approach is to use the "callback when done" for the first.
 */
beep({frequency: 330, callback: beep})
//and if we want to call that 2nd beep with other than its default args.
beep({frequency: 330, callback: function(){beep({frequency: 220})}})
/*this nesting trick can be played again by using the callback
 arg of the 2nd beep to place a 3rd beep, etc.
 But notice the code starts to get hard to read as the nesting
 level goes up.

 However, this problem is what the Job's do_list is 
 designed to solve. We define a function that calls 
 a method that returns immediatly but has a callback 
 to call when done. Our callback calls set_up_next_do, 
 which causes the do_list program counter to increment 
 and then execute the next instruction on the do_list.
 But to avoid the job code itself calling set_up_next_do as it
 usually does, we have to turn off that call by returning
 "dont_call_set_up_next_do" to avoid calling it twice
 for the same instrution.*/
function my_waiting_beeper(){
    var job_instance = this
    beep({duration: 1000, callback: function(){job_instance.set_up_next_do()}})
    return "dont_call_set_up_next_do"
}
/* Now our Job definition can just list 2 references to the 
 my_waiting_beeper function as regular do_list items, 
 without the hair of the sequencing
 callback code buried in my_waiting_beeper */
new Job({name: "my_job",
    do_list: [my_waiting_beeper, my_waiting_beeper]})
Job.my_job.start()
/* In our do_list we can have as many calls to my_waiting_beeper
 as we like, and they don't have to be contigous.

 We can also play sequential chords*/

function my_waiting_chording_beeper(){
    var job_instance = this
    beep({duration: 1000, frequency: 600})
    beep({duration: 1000, callback: function(){job_instance.set_up_next_do()}})
    return "dont_call_set_up_next_do"
}

new Job({name: "my_job",
    do_list: [my_waiting_chording_beeper,
        my_waiting_chording_beeper,
        my_waiting_beeper,
        my_waiting_chording_beeper
    ]})
Job.my_job.start()
/* You can use this pattern to sequence any functions that return immediately
 but have a callback-when-done argument.

 One last fun audio trick: play a chord with the two notes being very close
 in frequency to each other for the 'beating' effect. */

beep({frequency: 440,   duration: 5000})
beep({frequency: 440.5, duration: 5000})
`,
`/* Job Example 9 Serial Port
   Connections between different devices are often problematic,
   because this is much more complex than most programmers expect.
   Your most useful trait is persistence! 

  This walks you though controlling an Arduino board from DDE.
  If you haven't used Arduino before,
  1. Download the Arduino IDE from https://www.arduino.cc, SOFTWARE tab,
  2. Launch it, 
  3. Choose Help menu/Getting Started, and do what it says including:
  4. Connect your Arduino board to your computer via a USB cable.
  The green power light on the board should go on.
  Now get info on the connected hardware (low level, doesn't need Jobs/Robots)
*/
serial_devices() //show all serial devices available
//Use one of the returned "comName" paths like so:
var ard_path = last(serial_devices()).comName // something like: 
               //"/dev/tty.usbmodem1411"

//Now we are going to install a program into your Arduino.
//In the Arduino App, choose File menu/new and paste in:
/*
#define LED 13
void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  digitalWrite(LED, LOW);  // Turn LED off
}
//from http://www.fabiobiondi.com/blog/2014/02/html5-chrome-packaged-apps-and-arduino-bidirectional-communication-via-serial/
int incomingByte = 0;
void loop() {
  // Check if there's a serial message waiting.
  if (Serial.available() > 0) { //read the incoming byte.
    incomingByte = Serial.read();

    if (incomingByte == 'y') {
      digitalWrite(LED, HIGH); //turn on LED
      Serial.println("LED on");  //return this string to DDE
    } 
    else if (incomingByte == 'n') { //trun off LED
      digitalWrite(LED, LOW);
      Serial.println("LED off");
    }
  }
  delay(1000);
}
*/
//Save this as an Arduino Sketch in led_y_or_n.ino  
//In the Arduino IDE, click the upload button, annoying labeled as a right arrow.
//This should cause the orange light on the Arduino to falsh briefly signifying
//that its getting some data.
//If the uplaod fails, you'll see red text in the Arduino IDE output pane.
//Try unplugging and replugging your USB cable and uploading again.
//After success, connect to the device
serial_connect_low_level(ard_path) //returns lots of info including the path

serial_path_to_info_map //Shows us what the current connections are.
 //this should contain one with our "ard_path".

serial_send_low_level(ard_path, "y") //turns on orange light on board.
// in the DDE output pane you should see 
// "serial write just sent: y"  as the "y" char is sent from DDE and 
// "onReceiveCallback_low_level got data str: LED on"
// with data back from the Arduino.
serial_send_low_level(ard_path, "n") //turns off orange light on board. 
serial_flush(ard_path) //just makes sure all pending data moved. Not usually needed.

serial_disconnect(ard_path) //returns null
serial_path_to_info_map     //now this will return {} 

//Now we're ready to use DDE's Job software to control our Arduino.
//First, you may want to programmatically upload a file into Arduino from DDE.
//When the Arduino IDE uploads a file to Arduino, it first compiles the
//file in to a .hex file. It is this .hex file that is actually uploaded.
//The clever authors of the Arduino IDE made finding this file challenging.
//https://forum.arduino.cc/index.php?topic=131655.0 tells you how to do it
//for Windows, but not the Mac.
//Move that file to under your dde_apps folder and use:
serial_send_low_level(file_content("some_arduino_file.ino.hex"), ard_path)
//please let us know if this works, esp. if you're on a Mac.

//_________serial job_______  
new Serial({name: "S1", simulate: false, 
			sim_fun: function(input){ 
                        return "got: " + input + "\n"
                     },
            path:            ard_path, 
            connect_options: {baudRate: 300},
            capture_n_items: 1,  parse_items: true})

new Job({name: "j10",
         robot: Robot.S1,
         do_list: [Serial.string_instruction("y"),
                   Robot.grab_robot_status("yes_result"),
                   Robot.wait_until(new Duration(2000)),
                   Serial.string_instruction("n"),
                   Robot.grab_robot_status("no_result", Serial.DATA0)
                   ]}
)
Job.j10.start()

Job.j10.user_data //all the user data
Job.j10.user_data.yes_result //just our yes_result
`
]