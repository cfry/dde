new TestSuite("Job.is_when_stopped_conditions_valid",
   ["Job.is_when_stopped_conditions_valid({interrupted: true})", "true"],
   ["Job.is_when_stopped_conditions_valid({interrupted_by_stop_button: true})", "true"],
   ["Job.is_when_stopped_conditions_valid({xxx: true})", "false"], 
   ["Job.is_when_stopped_conditions_valid({interrupted_by_stop_button: 234})", "false"],
   ["Job.is_when_stopped_conditions_valid({completed: true, interrupted: false, interrupted_by_stop_button: true, errored: false, errored_from_dexter: true})", "true"],
   ["Job.is_when_stopped_conditions_valid({errored_from_dexter_connect: false})", "true"],
   ["Job.is_when_stopped_conditions_valid({errored_from_dexter_connect: true})", "false"]

)

new TestSuite("when_stopped_jobs",
  [`new Job({
    name: "my_job",
    user_data: {an_array: [0]},
    when_stopped: [function(){ this.user_data.an_array.push(3)},
                   function(){ this.user_data.an_array.push(4)}],
    //perform_when_stopped: true,//the default
    do_list: [
        function(){ this.user_data.an_array.push(1)},
        function(){ this.user_data.an_array.push(2)}
    ]
  })`],
  ["Job.my_job.user_data.an_array", "[0, 1, 2, 3, 4]"],
  [`new Job({
    name: "my_job",
    user_data: {an_array: [0]},
    when_stopped: function() {this.user_data.an_array.push(7)},
    when_stopped_conditions: false,
    do_list: [
        function(){ this.user_data.an_array.push(5)},
        function(){ this.user_data.an_array.push(6)}
    ]
   })`],
   ["Job.my_job.user_data.an_array", "[0, 5, 6]"],
  
   [`new Job({
    name: "my_job",
    user_data: {an_array: [0]},
    when_stopped: function(){ this.user_data.an_array.push(10)},
    do_list: [
        function(){ this.user_data.an_array.push(8)},
        Control.stop_job(), // by new default perform_when_stopped is true
        function(){ this.user_data.an_array.push(9)}
    ]
    })`],
    ["Job.my_job.user_data.an_array", "[0, 8, 10]"],
    [`new Job({
    name: "my_job",
    user_data: {an_array: [0]},
    when_stopped: [function(){ this.user_data.an_array.push(12)},
                   function(){ this.user_data.an_array.push(13)}],
    when_stopped_conditions: false,
    do_list: [
        function(){ this.user_data.an_array.push(10)},
        Control.stop_job(), // by new default perform_when_stopped is true
        function(){ this.user_data.an_array.push(11)}
    ]
   })`],
   ["Job.my_job.user_data.an_array", "[0,10,12,13]"],
   [`new Job({
    name: "my_job",
    user_data: {an_array: [0]},
    when_stopped: function(){ this.user_data.an_array.push(22)},
    do_list: [
        function(){ this.user_data.an_array.push(20)},
        Control.stop_job(undefined, "my stop_job inst.", false), // by new default perform_when_stopped is true
        function(){ this.user_data.an_array.push(21)}
    ]
    })`],
    ["Job.my_job.user_data.an_array", "[0,20]"],
    [`new Job({
    name: "my_job",
    user_data: {an_array: [30]},
    when_stopped: function(){ this.user_data.an_array.push(33)},
    do_list: [
         function(){ this.user_data.an_array.push(31)},
         Control.stop_job(undefined, "my stop_job inst.", true), // by new default perform_when_stopped is true
         function(){ this.user_data.an_array.push(32)}
    ]
    })`],
     ["Job.my_job.user_data.an_array", "[30,31,33]"],
    [`new Job({
    name: "my_job",
    user_data: {an_array: [40]},
    when_stopped: function(){ this.user_data.an_array.push(45)}, //is run
    do_list: [
        function(){ this.user_data.an_array.push(41)},
        Control.stop_job("lab9", "my stop_job inst.", true), // by new default perform_when_stopped is true
        function(){ this.user_data.an_array.push(42)}, //is run
        function(){ this.user_data.an_array.push(43)}, //is run
        Control.label("lab9"),
        function(){ this.user_data.an_array.push(44)}  //is not run      
    ]
   })`],
    ["Job.my_job.user_data.an_array", "[40,41,42,43,45]"],
   [`new Job({
    name: "my_job",
    user_data: {an_array: [50]},
    when_stopped: function(){ this.user_data.an_array.push(55)},
    do_list: [
        function(){ this.user_data.an_array.push(51)},
        Control.stop_job("lab9", "my stop_job inst.", false), // by new default perform_when_stopped is true
        function(){ this.user_data.an_array.push(52)},
        function(){ this.user_data.an_array.push(53)},
        Control.label("lab9"),
        function(){ this.user_data.an_array.push(54)}       
    ]
    })`],
    ["Job.my_job.user_data.an_array", "[50,51,52,53]"],
    [`new Job({
    name: "my_job",
    user_data: {an_array: [60]},
    when_stopped: function(){ this.user_data.an_array.push(63)},
    when_stopped_conditions: {completed: true},
    do_list: [
        function(){ this.user_data.an_array.push(61)},
        function(){ this.user_data.an_array.push(62)}
    ]
    })`],
    ["Job.my_job.user_data.an_array", "[60,61,62,63]"],
    [`new Job({
    name: "my_job",
    user_data: {an_array: [70]},
    when_stopped: function(){ this.user_data.an_array.push(73)},
    when_stopped_conditions: {completed: false},
    do_list: [
        function(){ this.user_data.an_array.push(71)},
        function(){ this.user_data.an_array.push(72)}
    ]
   })`],
   ["Job.my_job.user_data.an_array", "[70,71,72]"],
   [`new Job({
    name: "my_job",
    when_stopped: "wait",
    do_list: [Control.stop_job(),
              IO.out("should not print")]})`],
    ["Job.my_job.status_code", "'completed'"]
)
   

new TestSuite("when_stopped_error",
   [`new Job({
    name: "my_job",
    user_data: {an_array: [80]},
    //the default if_instruction_error causes the job to stop,
    //but lets the when_stopped instruction run.
    when_stopped: function(){ this.user_data.an_array.push(83)}, //runs
    do_list: [
        function(){ this.user_data.an_array.push(81)}, //runs
        function(){ unbound_var_name }, //causes an error
        function(){ this.user_data.an_array.push(82)} //doesn't run
    ]
   })`, "TestSuite.error"],
   ["Job.my_job.user_data.an_array", "[80,81,83]"],
   [`new Job({
    name: "my_job",
    user_data: {an_array: [80]},
    if_instruction_error: Control.stop_job(),
    when_stopped: function(){ this.user_data.an_array.push(83)}, //runs
    do_list: [
        function(){ this.user_data.an_array.push(81)}, //runs
        function(){ unbound_var_name }, //causes an error
        function(){ this.user_data.an_array.push(82)} //doesn't run
    ]
   })`],
   ["Job.my_job.user_data.an_array", "[80,81,83]"],
   [`new Job({
    name: "my_job",
    user_data: {an_array: [80]},
    if_instruction_error: Control.error("my inst error"),
    when_stopped: function(){ this.user_data.an_array.push(83)}, //runs
    do_list: [
        function(){ this.user_data.an_array.push(81)}, //runs
        function(){ unbound_var_name }, //causes an error
        function(){ this.user_data.an_array.push(82)} //doesn't run
    ]
   })`, "TestSuite.error"],
   ["Job.my_job.user_data.an_array", "[80,81,83]"],
   [`new Job({
    name: "my_job",
    user_data: {an_array: [80]},
    if_instruction_error: IO.out("got inst error, but let job continue"),
    when_stopped: function(){ this.user_data.an_array.push(83)}, //runs
    do_list: [
        function(){ this.user_data.an_array.push(81)}, //runs
        function(){ unbound_var_name }, //causes an error
        function(){ this.user_data.an_array.push(82)} //runs
    ]
   })`, "TestSuite.error"],
   ["Job.my_job.user_data.an_array", "[80,81,82,83]"],
   [`new Job({
    name: "my_job",
    robot: new Dexter({name: "dexter_no_exist", ip_address: "111.111.1.111", simulate: false}),
    user_data: {an_array: [90]},
    do_list: [function(){ this.user_data.an_array.push(91)} //doesn't run
    ]
    })`, "TestSuite.error"],
    ["Job.my_job.user_data.an_array", "[90]"],
     [`new Job({
    name: "my_job",
    robot: new Dexter({name: "dexter_no_exist", ip_address: "111.111.1.111", simulate: false}),
    user_data: {an_array: [90]},
    if_dexter_connect_error: function(robot_name){ 
           out("error connecting to dexter: " + robot_name)
           this.user_data.an_array.push(92)
           },
    do_list: [function(){ this.user_data.an_array.push(91)} //doesn't run
    ]
    })`, "TestSuite.error"],
    [`new Job({
    name: "my_job_sleeper", //needed to give the if_dexter_connect_error fn a chance to run.
    do_list: [Control.wait_until(1)]      
    })`],
    ["Job.my_job.user_data.an_array", "[90, 92]"]
)

new TestSuite("Control.error",
    [`new Job({
    name: "my_job",
    user_data: {an_array: [100]},
    do_list: [ function(){ this.user_data.an_array.push(101)},
               Control.error("on purpose"),
               function(){ this.user_data.an_array.push(102)}      
    ]})`, "TestSuite.error"],
    ["Job.my_job.user_data.an_array", "[100, 101]"],
    [`new Job({
    name: "my_job",
    user_data: {an_array: [110]},
    when_stopped: function(){ this.user_data.an_array.push(113)},
    do_list: [ function(){ this.user_data.an_array.push(111)},
               Control.error("on purpose"),
               function(){ this.user_data.an_array.push(112)}      
    ]})`, "TestSuite.error"],
    ["Job.my_job.user_data.an_array", "[110, 111, 113]"],
    [`new Job({
    name: "my_job",
    user_data: {an_array: [120]},
    when_stopped: function(){ this.user_data.an_array.push(123)},
    do_list: [ function(){ this.user_data.an_array.push(121)},
               Control.error("on purpose", true),
               function(){ this.user_data.an_array.push(122)}      
    ]})`, "TestSuite.error"],
    ["Job.my_job.user_data.an_array", "[120, 121, 123]"],
    [`new Job({
    name: "my_job",
    user_data: {an_array: [130]},
    when_stopped: function(){ this.user_data.an_array.push(133)},
    do_list: [ function(){ this.user_data.an_array.push(131)},
               Control.error("on purpose", false), //don't run when_stopped
               function(){ this.user_data.an_array.push(132)}      
    ]})`, "TestSuite.error"],
    ["Job.my_job.user_data.an_array", "[130, 131]"]
)
