new TestSuite("loop",
    [`new Job({name: "my_job",
         user_data: {sum: 0},
         do_list: [Control.loop(true, 
                              function(iter_index, iter_val, iter_total){
                                  if(iter_index < 4) {
                                    this.user_data.sum += iter_index}
                                  else { return Control.break() } }),
                   ]})`],
    ["Job.my_job.user_data.sum", "6"],
    [`new Job({name: "my_job",
          user_data: {sum: 0},
         do_list: [Control.loop(2 + 4, 
                              function(iter_index, iter_val, iter_total){
                                this.user_data.sum += iter_val
                                  })
                   ]})`],
    ["Job.my_job.user_data.sum", "15"],
    [`new Job({name: "my_job",
         user_data: {sum: 0},
         do_list: [Control.loop([100, 101, 102], 
                              function(iter_index, iter_val, iter_total){
                                 this.user_data.sum += iter_val }
                             )
                   ]})`],
     ["Job.my_job.user_data.sum", "303"],
     [`new Job({name: "my_job",
         user_data: {sum: 0},
         do_list: [Control.loop([100, 101, 102], 
                              function(iter_index, iter_val, iter_total){
                                  this.user_data.sum += iter_total        
                                         }
                             )
                   ]})`],
     ["Job.my_job.user_data.sum", "9"],
     [`new Job({name: "my_job",
         user_data: {sum: 0},
         do_list: [Control.loop(function(iter_index, iter_val, iter_total){ return (iter_index < 4)}, 
                              function(iter_index, iter_val, iter_total){
                                   this.user_data.sum += iter_index 
                                  })
                   ]})`],
     ["Job.my_job.user_data.sum", "6"],
     [`new Job({name: "my_job",
         user_data: {sum: 0},
         do_list: [function(){ this.user_data.baz = 102 },
                   function(){ return Control.loop({foo: 200, bar: 301},
                              function(iter_index, iter_val, iter_total, iter_key){
                                 this.user_data.sum += iter_val
                                         }) }             
                   ]})`],
     ["Job.my_job.user_data.sum", "501"],
     [`new Job({name: "my_job",
         user_data: {sum: 0},
         do_list: [IO.out("start of job"),
                   Control.loop(2,
                              function(iter_index, iter_val, iter_total){
                                  return Control.loop(3, function(inner_iter_index) { 
                                              this.user_data.sum += inner_iter_index             
                                                        })
                                         })
                   ]})`],
     ["Job.my_job.user_data.sum", "6"],
     [`new Job({
	     name: "outer_loop_break_test",
         user_data: {an_array: [10]},
         do_list: [
             function() { this.user_data.an_array.push(11)},
    	     Robot.loop(2, function(){
                 this.user_data.an_array.push(12)
                 return Control.break()
                 this.user_data.an_array.push(13)
             }),
             function() { this.user_data.an_array.push(14)}
          ]})`],
     ["Job.outer_loop_break_test.user_data.an_array", "[10,11,12,14]"],
     [`new Job({
	name: "inner_loop_break_test",
    user_data: {an_array: [0]},
    do_list: [
        function() { this.user_data.an_array.push(1)},
    	Robot.loop(true, function(){
            this.user_data.an_array.push(2)
        	return [
                function(){this.user_data.an_array.push(3)},
            	Robot.loop(1, function(){this.user_data.an_array.push(4) }),
                Robot.break(),
                function() {this.user_data.an_array.push(5) }
            ]}),
        function(){this.user_data.an_array.push(6)}
            ]})`],
        ["Job.inner_loop_break_test.user_data.an_array", "[0,1,2,3,4,6]"],
    [`new Job({
    name: "test_continue_job",
    user_data: {loop_data: []},
    do_list: [Control.loop(3, 
    			function(i){
                    return [function(){this.user_data.loop_data.push(i)},
                            ((i === 1) ? Control.continue() : null),
                            function(){this.user_data.loop_data.push(i + 10)}
                           ]
            	}),                 
              IO.out("the end")
             ]
       })`
       ],
       ["Job.test_continue_job.user_data.loop_data", "[0, 10, 1, 2, 12]"]
)
          
                

