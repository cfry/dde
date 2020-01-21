/* Created by Fry on 3/11/16.*/
var job_examples = [
`new Job({
    name: "my_job",
    do_list: [
        Dexter.move_all_joints([30, 45, 60, 90, 120])
    ]})
`,

`//////// Job Example 1
//A Job is esssentially a named list of instructions to
//be executed by a robot. There are several different
//formats for instructions. The most general is a
//function defintion. Below you can define a simple job
//with a name and 2 instructions by
//holding down the 'alt' key and clicking on 'new'.
//This will select the Job definition.
//With that selected, click the Eval button.
new Job({
    name: "my_job",
    do_list: [
        IO.out("first instruction"),  //will cause 'first instruction' to be printed in output pane when run
        function(){out("2nd instruction")} //This function will be called
    ]}) 
   
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
`/*      Job Example 2 
move_all_joints takes 5 angles in degrees, one for each 
of Dexter's joints.
move_to takes an xyz position (in meters from Dexter's base),
where you want the end effect to end up.
Beware, the 2nd and 3rd args to move_to determine the ending
J5_direction and which way the joints go. 
These are tricky to get right.
*/
new Job({
    name: "j2",
    do_list: [
        Dexter.move_all_joints([0, 0, 0, 0, 0]), //angles
        Dexter.move_to(
            [0, 0.5, 0.075],     //xyz
            [0, 0, -1],          //J5_direction
            Dexter.RIGHT_UP_OUT) //config
    ]})
//After defining this Job by clicking the EVAL button,
//click this job's button in the Output pane's header to start it.
`,

`///////// Job Example 3
//An instruction can also be a function call that
//returns a low level array for Dexter to execute.
///Dexter.sleep and Dexter.move_to
//are two such calls. Select and eval them to see their result.
//Just as in a normal JavaScript program, we can
//wrap a call in another function and call that other function
//as we do below by wrapping Dexter.move_all_joints in "move_once".
function move_once(){
    return Dexter.move_all_joints([0, 45, 90, -45, 0]) //also try: Dexter.move_to([100000, 200000, 300000])
}
function sleep_and_move(){
    return [
        Dexter.move_all_joints([0, 0, 135, 45, 0]),
        Dexter.sleep(2),
        Dexter.move_to([0, 0.5, 0.075], [0, 0, -1], Dexter.RIGHT_UP_OUT)
    ]
}
new Dexter({
    name: "my_dex",
    simulate: null //simulate is null by default, giving control to the Jobs menu item 'Simulate?'
})
new Job({
    name: "j3",
    robot: Robot.my_dex, //assigns a robot to this job
    do_list: [ //use the below function definitions as do_list items
        move_once, 
        sleep_and_move
    ] 
})
/* Job.j3                    //the newly created Job instance
 Job.j3.status_code
 Job.j3.robot.joint_angles() //array of 5 angles, each in arcseconds
 Job.j3.robot.joint_angle(2) //1 thru 5
 Job.j3.robot.joint_xyz(5)   //0 thru 5, default 5. 0 is robot base position
 Job.j3.robot.joint_xyzs()   //Array of base xyz and all joint xyzs.
*/
`,


`//////// Job Example 4: Generators  See https://davidwalsh.name/es6-generators
//A generator is a function that can effectively return a value
//in the middle of its definition via 'yield', then be called again
//and resume after the previous 'yield'.
//A generator can be used as a do-list instruction.
//Running a job automatically handles the re-calling
//of a generator until it is exhausted.

//_______Job Example 4a: Simple Generator
function* moves_gen(){
    yield  Dexter.move_all_joints([0, 0, 135, 45, 0])
    yield  Dexter.sleep(1)
    yield* [Dexter.move_all_joints([0, 45, 90, -45, 0]),
            Dexter.sleep(1)
           ]
}
new Job({name: "ja", do_list: [moves_gen]})

//_______Job Example 4b: Generator with for loop
function* complex_gen(){
    for(var i = 0; i < 4; i++){
        yield Dexter.move_all_joints([i * 10])
    }
}
new Job({
    name: "jb",
    do_list: [complex_gen]
})

//________Job Example 4c: Nested Generators
function* nested_gen(){
    var complex_iterator = complex_gen()
    for(var instru of complex_iterator){
        yield instru
    }
    yield Dexter.sleep(1)
}
new Job({
    name: "jc", 
    do_list: [nested_gen]
})        
//________Job Example 4d: yield and return examples
function* yield_and_return_gen(){
    yield  //don't execute any new instruction but keep generator alive
    yield  null //don't execute any new instruction but keep generator alive
    yield  IO.out("gen still alive") //run IO.out and keep generator alive
    return IO.out("last gen instruction") //run IO.out and kill generator
    return //don't execute any new instruction and kill generator. 
           //note this line will not actually be executed in this context
           //because the preceeding 'return' kills the generator.
}
new Job({name: "jd", do_list: [yield_and_return_gen]})
`,


`////////Job Example 5a: synchronizing Jobs
//The sync_point control instruction causes a job
//to wait until all the other jobs with the same
//sync_point name (i.e. "midway") reach that sync point.
new Job({
    name: "job_a",
    do_list: [
        IO.out("hello"),
        Control.sync_point("midway", ["job_a", "job_b"]),
        IO.out("goodbye")
    ]})

new Job({
    name: "job_b",
    robot: new Brain({name: "brain1"}),
    do_list: [
        IO.out("hello"),
        Control.wait_until(10),
        Control.sync_point("midway", ["job_a", "job_b"]),
        IO.out("goodbye")
    ]})
Job.job_a.start(); Job.job_b.start() //execute both at once.
//job_a will wait at its "midway" point until job_b gets to 
//its "midway" point, then they both proceed.


/////////Job Example 5b: One job controlling another
//Control instructions increase the flexibility of Jobs.
//They can add instructions to other jobs (send_to_job)
// as well as pause (suspend) and resume (unsuspend) jobs.

new Dexter({name: "my_dex", ip_address: "192.168.1.142", port: 50000})
new Job({
    name: "j4", 
    robot: Robot.my_dex,
    do_list: [
        Dexter.move_all_joints([0, 45, 90, -45, 0]),
        Control.suspend(), //j5 will unsuspend this
        IO.out("j4 sez goodbye.")
    ]})
Job.j4.start()

new Dexter({name: "my_dex2", ip_address: "192.168.1.143", port: 50000})
new Job({
    name: "j5", 
    robot: Robot.my_dex2,
    do_list: [
        Control.send_to_job(
            do_list_item: Dexter.move_to([0.1, 0.2, 0.3]),
            where_to_insert: {job: "j4", offset: "after_program_counter"},
            unsuspend: true,
            wait_until_done: true}),
            IO.out("j5 sez goodbye.")
    ]})
Job.j5.start()

////////Job Example 5c: Instructing another job and getting its data
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
new Job({
    name: "j7",
    do_list: [
        Control.send_to_job({
            do_list_item: Dexter.move_all_joints([0, 0, 135, 45, 0]),
            where_to_insert: {job: "j6", offset: "program_counter"},
            start: true, //starts j6
            wait_until_done: true,
            status_variable_name: "that_j6_task",
            //and any number of values you want to get from j6
            j6_joint_5_pos: function(){return this.robot.joint_xyz(5)},
            j6_angle_number_2: function(){return this.robot.joint_angle(2)}
        })
    ]})
Job.j7.start()
/* Job.j7.user_data.j6_joint_5_pos and
   Job.j7.user_data.j6_angle_number_2 both
   contain info snatched from job j6.
If you use 
Control.send_to_job({
    where_to_insert: {job: "to_job", offset: "end"},
    wait_until_done: true, 
    ...
}
then the job with the sent_to_job instruction will wait until
the whole of the to_job is done before proceeding                           
*/

////// Job Example 5d: Prepending to the do_list when calling start.

new Job({
    name: "j8",
    do_list: [
        IO.out("first instruction"),
        IO.out("2nd instruction")
    ]})
                
Job.j8.start({initial_instruction: IO.out("special insert")})            
`,


`//////// Job Example 6 Calling show_window from an instruction
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
    do_list:[
        Dexter.move_all_joints([0, 45, 90, -45, 0]),
        function(){print_job_1_dialog()},
        Control.wait_until(function(){return this.user_data.color_status != undefined}),
        function(){
            if (this.user_data.color_status == "cancel"){
                return Control.error("ran out of filament.")
            }
            else {return null}
        },
        Dexter.move_all_joints([0, 0, 135, 45, 0 ])
    ]})
Job.print_job_1.start()
// Job.print_job_1.user_data  //data set by the dialog
`,


`//////// Job Example 7a: Using a human 'robot' cooperating with a Brain robot
//Jobs may contain instructions for human operators as well as robots,
//facilitating well-coordinated human-machine processes.
new Job({
    name: "human_task_test",
    robot: new Dexter(),
    do_list: [
        Human.task({
            task: "Load more filament.",
            title: "Pay Attention!!!",
            x: 0,
            y: 0,
            width: 600,
            height: 150,
            background_color: "rgb(230, 200, 250)"
        }), //waits until user clicks 'Done'.
        Dexter.move_to([0, 0.5, 0.075])
    ]})                           
Job.lots_of_options_task.start()

//////// Job Example 7b: Dependent Jobs
new Job({
    name: "dependent_job", //robot type defaults to Brain
    do_list: [
        Control.sync_point("load_filament", ["my_job"]),
        IO.out("dependent_job last instruction")
    ]})

new Job({
    name: "my_job", robot: new Human({name: "Joe Jones"}),
    do_list: [
        Human.task({
            task: "Load more filament.",
            height: 150,
            dependent_job_names: ["dependent_job"]
        }), //this optional arg
            //lists jobs to be stopped if user clicks
            //"Stop Job" button.
        Control.sync_point("load_filament"),
        IO.out("my_job last instruction")
    ]})

Job.dependent_job.start(); Job.my_job.start() //start both at once


//////// Job Example 7c: human chooses material from list
new Job({
    name: "material_job", robot: new Human({name: "Joe Jones"}),
    do_list: [
        Human.enter_choice({
            task: "Which material should we use?",
            user_data_variable_name: "material_choice", // user_data variable to store choice
            choices: ["copper", "silver", "gold"],
            show_choices_as_buttons: false, // the default, which shows choices as menu items
            one_button_per_line: false,     // the default. relevant when showing buttons only
            dependent_job_names: []
        }),      // [] means no dependent jobs.
        IO.out("material_job last instruction")
    ]})
Job.material_job.start()
// Job.material_job.user_data

//////// Job Example 7d: human enters a number
new Job({
    name: "number_job",
    robot: new Human({name: "Joe Jones"}),
    do_list: [
        Human.enter_number({
            task: "How many millimeters long should we make the pipe?",
            user_data_variable_name: "pipe_length", // user_data variable to store the number
            initial_value: 15,
            min: 10,
            max: 1000,
            step: 1,
            dependent_job_names: [] // [] means no dependent jobs.
        }), 
        IO.out("number_job last instruction")
    ]})
Job.number_job.start()
// Job.number_job.user_data

//////// Job Example 7e: human enters text
new Job({
    name: "text_job",
    robot: new Human({name: "Joe Jones"}),
    do_list: [
        Human.enter_text({
        task: "Describe how this job is going.",
        user_data_variable_name: "job_description", // user_data variable to store the text
        initial_value: "OK",
        line_count: 3,
        dependent_job_names: []}), // [] means no dependent jobs.
        IO.out("text_job last instruction")
    ]})
Job.text_job.start()
// Job.text_job.user_data

//////// Job Example 7f: Notify
//Tell human something without pausing execution.
new Job({
    name: "notify_job",
    robot: new Human({name: "Joe Jones"}),
    do_list: [
        Human.notify({
            task: "Take off work early today!",
            window: true,      //the default
            output_pane: true, //the default
            beep_count: 0,     //the default
            speak: false       //the default
        }),
        IO.out("text_job last instruction")
    ]})
Job.notify_job.start()

//////// Job Example 7g: Dexter User Interface
//Interactivly control Dexter's joints.
function dexter_user_interface_cb(vals){
    debugger;
    let maj_array = [vals.j1_range, vals.j2_range, vals.j3_range, vals.j4_range,
                     vals.j5_range, vals.j6_range, vals.j7_range]
    let instr = Dexter.move_all_joints(maj_array)
    Job.insert_instruction(instr, {job: vals.job_name, offset: "end"})
}
function init_dui(){
  show_window({title: "Dexter User Interface",
               width: 300,
               height: 220,
               y: 20,
               job_name: this.name, //important to sync the correct job.
               callback: dexter_user_interface_cb,
               content:\`
Use the below controls to move Dexter.<br/>
J1: <input type="range"  name="j1_range"  value="33"  min="0" max="100" data-oninput="true"/><br/>
J2: <input type="range"  name="j2_range"  value="33"  min="0" max="100" data-oninput="true"/><br/>
J3: <input type="range"  name="j3_range"  value="33"  min="0" max="100" data-oninput="true"/><br/>
J4: <input type="range"  name="j4_range"  value="33"  min="0" max="100" data-oninput="true"/><br/>
J5: <input type="range"  name="j5_range"  value="33"  min="0" max="100" data-oninput="true"/><br/>
J6: <input type="range"  name="j6_range"  value="33"  min="0" max="100" data-oninput="true"/><br/>
J7: <input type="range"  name="j7_range"  value="33"  min="0" max="100" data-oninput="true"/><br/>
\`
})}

new Job({
    name: "dexter_user_interface",
    when_stopped: "wait",
    do_list: [init_dui
]})
`,


`//////// Job Example 8: Human Enter Instruction
//This job pauses and presents a dialog box allowing
//the entry of an instruction, to continue the job, or to cancel it.
//An instruction can be entered via text or we can GENERATE
//instructions by moving a Dexter robot where we want it to
//go as in 'training'.
new Dexter({name: "my_dex", ip_address: "192.168.1.142", port: 50000})

new Job({
    name: "my_job",
    robot: Robot.my_dex,
    do_list: [
        function(){out("first instruction")}, //will cause 'first instruction' to be printed in output pane when run
        Human.enter_instruction(), // Pops up a dialog requesting user input of an instruction.
        IO.out("last instruction")
    ]})
Job.my_job.start()
`,


`/*     Job Example 9 Async Instructions
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
beep({frequency: 440, dur: 1})
beep({frequency: 500, dur: 2})
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
    beep({dur: 1, callback: function(){job_instance.set_up_next_do()}})
    return "dont_call_set_up_next_do"
}
/* Now our Job definition can just list 2 references to the 
 my_waiting_beeper function as regular do_list items, 
 without the hair of the sequencing
 callback code buried in my_waiting_beeper */
new Job({
    name: "my_job",
    do_list: [my_waiting_beeper, my_waiting_beeper]
})
Job.my_job.start()
/* In our do_list we can have as many calls to my_waiting_beeper
 as we like, and they don't have to be contigous.

 We can also play sequential chords*/

function my_waiting_chording_beeper(){
    var job_instance = this
    beep({dur: 1, frequency: 600})
    beep({dur: 1, callback: function(){job_instance.set_up_next_do()}})
    return "dont_call_set_up_next_do"
}

new Job({
    name: "my_job",
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

beep({frequency: 440,   dur: 10})
beep({frequency: 440.5, dur: 10})
`,
`/* Job Example 10 Serial Port
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
//This should cause the orange light on the Arduino to flash briefly signifying
//that its getting some data.
//If the upload fails, you'll see red text in the Arduino IDE output pane.
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
serial_send_low_level(read_file("some_arduino_file.ino.hex"), ard_path)
//please let us know if this works, esp. if you're on a Mac.
//If you can't get programmatic file upload into your Arduino,
//just use the Arduion app, paste the code into the editor,
//and click the right arrow to upload your Arduino code manually.

//_________serial job_______  
new Serial({
    name: "S1", simulate: null, 
	sim_fun: function(input){ 
        return "got: " + input + "\\n"
    },
    path: ard_path, 
    connect_options: {baudRate: 300},
    capture_n_items: 1, 
    parse_items: true
})

//with the default robot being a serial robot.
new Job({
    name: "j10a",
    robot: Robot.S1,
    do_list: [
        Serial.string_instruction("y"),
        IO.grab_robot_status("yes_result"),
        Control.wait_until(2),
        Serial.string_instruction("n"),
        IO.grab_robot_status("no_result", Serial.DATA0)
    ]})
Job.j10a.start()

Job.j10a.user_data //all the user data
Job.j10a.user_data.yes_result //just our yes_result

//with each serial and grab robot_status instruction having a robot.
new Job({
    name: "j10b",
    robot: new Brain(), //Robot.S1,
    do_list: [
        Serial.S1.string_instruction("y"),
        Serial.S1.grab_robot_status("yes_result"),
        Control.wait_until(2),
        Serial.S1.string_instruction("n"),
        Serial.S1.grab_robot_status("no_result", Serial.DATA0)
    ]})
`,

`/*Job Example 11 when_stopped
The 'when_stopped' parameter to new Job controls what
happens when a job executes all its instructions or otherwise
comes to a normal stopping point. The default value is "stop",
i.e. just stop the job. But you can instead cause the job to
wait for another instruction, loop, or call a callback function.
*/
//______job_ws1_____Wait for a new instruction to be added
//Click the Job's button in the Output pane header to stop it.
new Job({name: "job_ws1", 
         when_stopped: "wait",
         do_list: [IO.out("hey")]})
Job.job_ws1.start()
//Select and eval the below to add an instruction to the started job_ws1
Job.insert_instruction(IO.out("you2"), {job: "job_ws1", offset: "end"})
//You can do this as many times as you like.
//Click the Job's button to stop it or Eval:
Job.insert_instruction(Control.stop_job(), {job: "job_ws1", offset: "end"})
         
//______job_ws2_____You can even avoid a do_list completely.
new Job({
    name: "job_ws2", 
    when_stopped: "wait"
})
Job.job_ws2.start()
//Eval the below to add and run an instruction:
Job.insert_instruction(IO.out("joe1"), {job: "job_ws2", offset: "end"})


//______job_ws3______Call a callback function when the job finishes
new Job({
    name: "job_ws3", 
    when_stopped: function(){out("I've had it.")},
    do_list: [IO.out("I'm running.")]
})

//______job_ws4______Call a callback function when the job finishes
//but also perform the when_stopped action due to stop_job's 3rd (true) arg.
new Job({
    name: "job_ws4", 
    when_stopped: function(){out("I'm dead.")},
    do_list: [
        IO.out("I'm alive."),
        Control.stop_job("program_counter", "because I said so", true),
        IO.out("I'm not run.") //not reached
    ]})
         
//______job_ws5______Infinite Loop
new Job({
    name: "job_ws5", 
    when_stopped: 0, //when its done, restart job at instruction 0 
    do_list: [
        function(){
            if(Job.global_user_data.counter) {
                Job.global_user_data.counter += 1
            }
            else { 
                Job.global_user_data.counter = 1
            }
            out("counter = " + Job.global_user_data.counter)
        },
        Control.wait_until(2)
    ]}) //sleep for 2 seconds
`,

`////Job Example 12: go_to
//12a: initialize user data and display it
new Job({
    name: "my_job",
    user_data: {some_val: 0},
    do_list: [function() { out("val: " + this.user_data.some_val)}
    ]})

//12b: set user data from user input
new Job({
    name: "my_job",
    user_data: {some_val: 0},
    do_list: [
        Human.enter_number({user_data_variable_name: "some_val"}),
        function() { out("val: " + this.user_data.some_val)},
    ]})

//12c: go_to instruction 0, infinite loop
new Job({
    name: "my_job",
    user_data: {some_val: 0},
    do_list: [
        Human.enter_number({user_data_variable_name: "some_val"}),
        function(){ out("val: " + this.user_data.some_val)},
        Control.go_to(0)
    ]})

//12d: stop if user enters zero
new Job({
    name: "my_job",
    user_data: {some_val: 0},
    do_list: [
        Human.enter_number({user_data_variable_name: "some_val"}),
        function(){ out("val: " + this.user_data.some_val)},
        function(){ 
            if(this.user_data.some_val == 0){
                return Control.stop_job()
            }
        },
        Control.go_to(0)
    ]})

//12e go_to a label ("lab1").
new Job({
    name: "my_job",
    user_data: {some_val: 0},
    do_list: [
        Control.label("lab1"),
        Human.enter_number({user_data_variable_name: "some_val"}),
        function(){ out("val: " + this.user_data.some_val)},
        function(){ 
            if(this.user_data.some_val === 0){
                return Control.stop_job()
            }
        },
        Control.go_to("lab1")
    ]})
`,
`//Job Example 13: loop
//13a: loop with times_to_loop = true (infinite) & Control.break
new Job({
    name: "my_job",
    do_list: [
        IO.out("start of job"),
        Control.loop(
            true, 
            function(iter_index, iter_val, iter_total){
                if(iter_index < 3) {
                    return IO.out(
                        "index: "       + iter_index + 
                        " iter_val: "   + iter_val +
                        " iter_total: " + iter_total)
                }
                else { return Control.break() } 
            }),
        IO.out("end of job")
    ]})

////13b: loop with times_to_loop = 3
new Job({
    name: "my_job",
    do_list: [
        IO.out("start of job"),
        Control.loop(
            2 + 3, 
            function(iter_index, iter_val, iter_total){
                return IO.out(
                    "index: "       + iter_index + 
                    " iter_val: "   + iter_val +
                    " iter_total: " + iter_total
                )}),
            IO.out("end of job")
    ]})
                   

////13c: loop with times_to_loop = array                                     
new Job({
    name: "my_job",
    do_list: [
        IO.out("start of job"),
        Control.loop(
            [100, 101, 102], 
            function(iter_index, iter_val, iter_total){
                return IO.out(
                    "index: "       + iter_index + 
                    " iter_val: "   + iter_val +
                    " iter_total: " + iter_total)}
                ),
            IO.out("end of job"),
        ]})
                   
////13d: loop with times_to_loop = array  & multiple instructions per iteration                                   
new Job({
    name: "my_job",
    do_list: [
        IO.out("start of job"),
        Control.loop(
            [100, 101, 102], 
            function(iter_index, iter_val, iter_total){
                return [
                    IO.out("index: "       + iter_index + 
                    " iter_val: "   + iter_val +
                    " iter_total: " + iter_total),
                    IO.out("another instruction" + iter_index)        
                ]}
        ),
        IO.out("end of job")
    ]})                  
 
////13e: loop with times_to_loop = function (dynamically decide how many iterations)
new Job({
    name: "my_job",
    do_list: [
        IO.out("start of job"),
        Control.loop(
            function(iter_index, iter_val, iter_total){ return (iter_index < 3)}, 
            function(iter_index, iter_val, iter_total){
                return IO.out(
                    "index: "       + iter_index + 
                    " iter_val: "   + iter_val +
                    " iter_total: " + iter_total
                )}),
        IO.out("end of job")
    ]}) 
////13f: loop with times_to_loop a function returning an object to
////    loop through the properties of the object.                
new Job({
    name: "my_job",
    user_data: {foo: 100, bar: 101},
    do_list: [
        function(){ this.user_data.baz = 102 },
        function(){ 
            return Control.loop(
                this.user_data,
                function(iter_index, iter_val, iter_total, iter_key){
                    return [
                        IO.out(
                            "index: "       + iter_index + 
                            " iter_val: "   + iter_val +
                            " iter_total: " + iter_total +
                            " iter_key: "   + iter_key
                        )
                    ]}) },             
        function(){ inspect(this.user_data) }
    ]})                
                   
////13g: nested loops.  Note inner loop can reference outer loop vars.               
new Job({
    name: "my_job",
    do_list: [
        IO.out("start of job"),
        Control.loop(
            3,
            function(iter_index, iter_val, iter_total){
                return [
                    IO.out("index: "       + iter_index + 
                                " iter_val: "   + iter_val +
                                " iter_total: " + iter_total
                    ),
                    Control.loop(
                        2, 
                        function(inner_iter_index) { 
                            return IO.out(
                                "inner" + iter_index + 
                                "." + inner_iter_index
                            )
                        })
                   ]}),             
        IO.out("end of job")
    ]})
`,

`//Job Example 14: TestSuite in Job
//If the TestSuite has errors, 
//the TestSuite report is output and the job stops early.

new TestSuite("ts_in_job",
    ["2 + 3", "5"]
)

new Job({
    name: "my_job",
    do_list: [
        TestSuite.ts_in_job,
        function(){
            if((TestSuite.ts_in_job.known_failure_count > 0) ||
               (TestSuite.ts_in_job.unknown_failure_count > 0)){
                out(TestSuite.ts_in_job.report)
                return Control.stop_job()
            }
        },
        IO.out("last instruction")
    ]})
`
]