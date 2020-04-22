These tests can't be performed by the automatic test system.
Each is ideosyncratic in how "success" is measured.
See the comments.

//click stop  button while waiting,
// prints only:  hey
new Job({
    name: "my_job",
    when_stopped: IO.out("one"),
    when_stopped_conditions: {interrupted_by_stop_button: false},
    do_list: [
        IO.out("hey"),
         Control.wait_until(5),
        IO.out("you")
    ]
})

//tests if_dexter_connect_error with a confirm dialog
//that asks user to try a new ip_address.
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
       ]})


//click the job button while its waiting.
//prints hey, one  does not print "you"
new Job({
    name: "my_job",
    when_stopped: IO.out("one"),
    when_stopped_conditions: {interrupted_by_stop_button: true},
    do_list: [
        IO.out("hey"),
         Control.wait_until(5),
        IO.out("you")
    ]
})


//can't be automated now becuase even when running in the testsuite,
//it gets all the way through in running the when_stopped instruction,
//but the final job status_code is still "errored", and 
//the test suite considers an errored job to be a test failure.
//This behavior is relied upon by many test suite items that
//just have a job def (like in the ref man), where
//the only real test is: define the job then run it and 
//if it doesn't error it passes. So we 
//automate the below with that behavior and the current test suite.
// so its a manual test.
new TestSuite("when_stopped_err",
   [`new Job({
    name: "my_job",
    user_data: {an_array: [80]},
    when_stopped: function(){ this.user_data.an_array.push(83)}, //runs
    do_list: [
        function(){ this.user_data.an_array.push(81)}, //runs
        function(){ unbound_var_name }, //causes an error
        function(){ this.user_data.an_array.push(82)} //doesn't run
    ]
   })`, "TestSuite.error"],
   ["Job.my_job.user_data.an_array", "[80,81,83]"]
)

`