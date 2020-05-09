These tests can't be performed by the automatic test system.
Each is ideosyncratic in how "success" is measured.
See the comments.

//causes a dom error when in the testsuite.
//see webcam video show in small window.
Picture.show_video() 
_____
//click stop button while waiting (job button yellow)
new Job({
    name: "my_job",
    user_data: {array: [0]},
    when_stopped: function() { Job.my_job.user_data.array.push(3)},
    when_stopped_conditions: {interrupted_by_stop_button: false},
    do_list: [
        function() { Job.my_job.user_data.array.push(1)},
         Control.wait_until(5),
        function() { Job.my_job.user_data.array.push(2)}
    ]
}).start()

similar(Job.my_job.user_data.array, [0, 1])
________
//click the stop button while its waiting.
new Job({
    name: "my_job",
    user_data: {array: [10]},
    when_stopped: function() { Job.my_job.user_data.array.push(13)},
    when_stopped_conditions: {interrupted_by_stop_button: true},
    do_list: [
        function() { Job.my_job.user_data.array.push(11)},
         Control.wait_until(5),
        function() { Job.my_job.user_data.array.push(12)}
    ]
}).start()

similar(Job.my_job.user_data.array, [10, 11, 13])
___________

//click the job button while its waiting.
new Job({
    name: "my_job",
    user_data: {array: [20]},
    when_stopped: function() { Job.my_job.user_data.array.push(23)},
    when_stopped_conditions: {interrupted_by_stop_button: true},
    do_list: [
        function() { Job.my_job.user_data.array.push(21)},
         Control.wait_until(5),
        function() { Job.my_job.user_data.array.push(22)}
    ]
}).start()

similar(Job.my_job.user_data.array, [20, 21, 23])

_______
//Job will pause for 10 seconds, then pop up a
//confirm dialog box asking users to try a new ip_address.
//teh ip address increments each time.
//click cancel stops the job, job button turns red.
new Job({name: "my_job",
         robot: new Dexter({name: "disconnected_dex",
                            ip_address: "111.111.1.111",
                            simulate: false}),
         if_dexter_connect_error: function(robot_name) {
              out("Failed to connect " + this.robot.name + " at ip_address: " + this.robot.ip_address)
              let orig_ip_address = this.robot.ip_address
              let old_last_digit = parseInt(last(orig_ip_address))
              let new_last_digit = old_last_digit + 1
              let new_ip_address = orig_ip_address.substring(0, orig_ip_address.length - 1) +
                                   new_last_digit
              if(confirm("try again with ip_address: " + new_ip_address + "?")){
                  this.robot.ip_address = new_ip_address
                  this.start()
              }
         },
         do_list:[Robot.out("its working!")
       ]}).start()

_______
Run the job, it should pause at Control.step_instructions(),
then you can step through the instructions (not into them)
by using the Misc pane header "Go" button.
new Job({
    name: "my_job",
    do_list: [
        IO.out("one"),
        Control.step_instructions(),
        IO.out("two"),
        IO.out("three"),
    ]
})
________
Run the job, (with the Dev tools window closed)
 it should open the dev tools window, and break
 at top of  do_next_item, while starting to execute the
 instruction AFTER the Control.debugger() instrudction, ie: out "two".length

    then you can step through the instructions (not into them)
by using the Misc pane header "Go" button.
new Job({
    name: "my_job",
    do_list: [
        IO.out("one"),
        Control.debugger(),
        IO.out("two"),
        IO.out("three"),
    ]
})
___________
Run the job, (with the Dev tools window closed).
Click on the Misc Pane JS Debugging check
when the job's button is yellow while paused at Control.wait_until(4).
This should open the dev tools window and break
at the top of do_next_item, while executing  the wait_until instruction.
See the help about calling undebug_job() in the console and Out pane.
 Job({
    name: "my_job",
    do_list: [
        IO.out("one"),
        Control.wait_until(4),
        IO.out("two"),
        IO.out("three"),
    ]
})