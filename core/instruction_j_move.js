/*
//j_move_examples.dde
//Written by: James Wigglesworth
//Started: 11/13/2023
//Modified: 2/5/2024

New functions:
	-Dexter.j_move()
    -Dexter.j_reset()
    -Dexter.j_set_peak_velocity()
    -Dexter.j_set_peak_acceleration()
    -Dexter.j_set_peak_jerk()


Example Dexter.j_move() calls:

Dexter.j_move([0, -45, 0, 0, 0]),
Dexter.j_move([0, -45, 0, 0, 0, 0]),
Dexter.j_move([0, -10, 0, 0, 0], {duration: 1}),
Dexter.j_move([0, 0, 0, 0, 0, 0], {end_velocity: [30, 0, 0, 0, 0, 0]}),
Dexter.j_move([0, 0, 0, 0, 0, 0], {end_acceleration: [30, 0, 0, 0, 0, 0]}),
Dexter.j_move([0, 30, 0, 0, 0, 0], {async: true}),

Dexter.j_move([0, 30, 0, 0, 0, 0], {
    end_velocity: [0, 0, 0, 0, 0, 0],
    end_acceleration: [0, 0, 0, 0, 0, 0],
    duration: "?", //'?' means get there as fast as possible
    async: undefined, //defualts true if coming to stop, false if moving through point, will always be overwritten by user value
}),

load_files("Libraries/lib_j_moves.dde")

//Limits:
var vel = [30, 30, 30, 30, 30, 30]
var accel = [100, 100, 100, 100, 100, 100]
var jerk = [1000, 1000, 1000, 1000, 1000, 1000]

//Run once per boot up to initialize speed settings that work best for these examples.
new Job({
    name: "Init",
    show_instructions: false,
    do_list: [
        init
    ]
})

//Job Examples:

//Example 0 - simple motion
new Job({
    name: "Example_0",
    show_instructions: false,
    do_list: [
        Dexter.j_move([30, 0, 0, 0, 0]),
        Dexter.j_move([0, 0, 0, 0, 0]),
    ]
})

//Example 1 - simple motion loop (try stopping mid motion)
new Job({
    name: "Example_1",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    do_list: [
        Control.loop(true, function(){
            return [
                Dexter.j_move([0, -45, 0, 0, 0]),
                Dexter.j_move([0, 45, 0, 0, 0]),
            ]
        })
    ]
})

//Example 2 - Plotting J moves and how to use second argument of 'options'
var example_2_data
function record_example_2_data(){
    return [
        function(){
            let obj = parse_g5(this.robot.robot_status)
            obj.time = Date.now()*_ms - this.user_data.start_time
            example_2_data.push(obj)
        }
    ]
}

new Job({
    name: "Example_2",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    do_list: [
        Dexter.j_move([0, 0, 0, 0, 0]),

        function(){
            example_2_data = []
            this.user_data.start_time = Date.now()*_ms
        },

        Dexter.j_move([30, 0, 0, 0, 0], {
            monitor_callback: record_example_2_data
        }),

        Dexter.j_move([0, 0, 0, 0, 0]),

        function(){
            //Plotting positional data:
            plot_trajectory(example_2_data, {
                title: "J_Move Position vs. Time",
                data_types: ["MEASURED_ANGLE", "STEP_ANGLE", "J_POSITION"],
                joints_to_plot: [true, false, false, false, false, false],
                y_axis: "Joint Angle (deg)"
            })
        },

        function(){
            //Plotting velocity data (notice the 'd', it can be used with other vairables too):
            plot_trajectory(example_2_data, {
                title: "J_Move Velocity vs. Time",
                data_types: ["dMEASURED_ANGLE", "dSTEP_ANGLE", "J_VELOCITY"],
                joints_to_plot: [true, false, false, false, false, false],
                y_axis: "Joint Velocity (deg/s)"
            })
        },

        function(){
            //Plotting acceleration data (notice that 'd' can be applied multiple times):
            plot_trajectory(example_2_data, {
                title: "J_Move Acceleration vs. Time",
                data_types: ["ddMEASURED_ANGLE", "ddSTEP_ANGLE", "J_ACCELERATION"], //you could add the
                joints_to_plot: [true, false, false, false, false, false],
                y_axis: "Joint Acceleration (deg/s^2)"
            })
        },


    ]
})

//Example 3 - Setting 'peak' values
new Job({
    name: "Example_3",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    do_list: [
        init, // sets speeds to default values
        Dexter.j_move([0, 0, 0, 0, 0]),
        function(){
            example_3_data = []
            this.user_data.start_time = Date.now()*_ms
        },

        //Default settings:
        Dexter.j_move([30, 0, 0, 0, 0], {
            peak_velocity: [30, 30, 30, 30, 30, 30],
            peak_acceleration: [100, 100, 100, 100, 100, 100],
            peak_jerk: [1000, 1000, 1000, 1000, 1000, 1000],
            monitor_callback: record_example_3_data
        }),

        //2x higher velocity:
        Dexter.j_move([60, 0, 0, 0, 0], {
            peak_velocity: [40, 30, 30, 30, 30, 30],
            peak_acceleration: [100, 100, 100, 100, 100, 100],
            peak_jerk: [1000, 1000, 1000, 1000, 1000, 1000],
            monitor_callback: record_example_3_data
        }),

        //3x higher acceleration:
        Dexter.j_move([90, 0, 0, 0, 0], {
            peak_velocity: [30, 30, 30, 30, 30, 30],
            peak_acceleration: [3*100, 100, 100, 100, 100, 100],
            peak_jerk: [1000, 1000, 1000, 1000, 1000, 1000],
            monitor_callback: record_example_3_data
        }),

        //30x higher jerk:
        Dexter.j_move([120, 0, 0, 0, 0], {
            peak_velocity: [30, 30, 30, 30, 30, 30],
            peak_acceleration: [100, 100, 100, 100, 100, 100],
            peak_jerk: [30*1000, 1000, 1000, 1000, 1000, 1000],
            monitor_callback: record_example_3_data
        }),

        //higher everything:
        Dexter.j_move([150, 0, 0, 0, 0], {
            peak_velocity: [40, 30, 30, 30, 30, 30],
            peak_acceleration: [3*100, 100, 100, 100, 100, 100],
            peak_jerk: [30*1000, 1000, 1000, 1000, 1000, 1000],
            monitor_callback: record_example_3_data
        }),

        //Go to Home at normal settings:
        Dexter.j_move([0, 0, 0, 0, 0], {
            peak_velocity: [30, 30, 30, 30, 30, 30],
            peak_acceleration: [100, 100, 100, 100, 100, 100],
            peak_jerk: [1000, 1000, 1000, 1000, 1000, 1000],
        }),

        function(){
            //Plotting positional data:
            plot_trajectory(example_3_data, {
                title: "J_Move Position vs. Time",
                data_types: ["MEASURED_ANGLE", "STEP_ANGLE", "J_POSITION"],
                joints_to_plot: [true, false, false, false, false, false],
                y_axis: "Joint Angle (deg)"
            })
        },

        function(){
            //Plotting velocity data (notice the 'd', it can be used with other vairables too):
            plot_trajectory(example_3_data, {
                title: "J_Move Velocity vs. Time",
                data_types: ["dMEASURED_ANGLE", "dSTEP_ANGLE", "J_VELOCITY"],
                joints_to_plot: [true, false, false, false, false, false],
                y_axis: "Joint Velocity (deg/s)"
            })
        },


        //function(){
        	//Plotting acceleration data (notice that 'd' can be applied multiple times):
        //	plot_trajectory(example_3_data, {
        //    	title: "J_Move Acceleration vs. Time",
        //		data_types: ["ddMEASURED_ANGLE", "ddSTEP_ANGLE", "J_ACCELERATION"], //
        //        joints_to_plot: [true, false, false, false, false, false],
        //        y_axis: "Joint Acceleration (deg/s^2)"
        //    })
        // },


    ]
})

var example_3_data
function record_example_3_data(){
    return [
        function(){
            let obj = parse_g5(this.robot.robot_status)
            obj.time = Date.now()*_ms - this.user_data.start_time
            example_3_data.push(obj)
        }
    ]
}

//Example 4 - Setting 'end' values
new Job({
    name: "Example_4",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    do_list: [
        Control.loop(true, function(){
            return [
                Dexter.j_move([-30, -30, 0, 0, 0, 0]),
                Dexter.j_move([0, 0, 0, 0, 0, 0], {end_velocity: [30, 0, 0, 0, 0, 0]}),
                Dexter.j_move([30, 0, 0, 0, 0, 0]),
            ]
        })
    ]
})

//Example 5 - Controlling speeds with 'duration'
new Job({
    name: "Example_5",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    do_list: [
        Dexter.j_move([0, 0, 0, 0, 0]),
        Control.loop(true, function(){
            return [
                Dexter.j_move([0, -10, 0, 0, 0], {duration: 1}),
                Dexter.j_move([0, -5, 0, 0, 0], {duration: 1}),
                Dexter.j_move([0, 10, 0, 0, 0], {duration: 1}),
            ]
        })
    ]
})

//Example 6 - Asynchronous j_moves (watch when the job button turns purple)
new Job({
    name: "Example_6",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    user_data: {
        move_count: 0,
    },
    do_list: [
        Dexter.j_move([0, -30, 0, 0, 0, 0], {async: false}),
    ]
})

//Example 7 - Synchronous j_moves during motion (listen for beeps mid-motion)
new Job({
    name: "Example_7",
    show_instructions: false,
    inter_do_item_dur: 0,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    user_data: {
        move_count: 0,
    },
    do_list: [
        Control.loop(true, function(){
            return [
                Dexter.j_move([0, 30, 0, 0, 0, 0]),
                Dexter.j_move([0, 0, 0, 0, 0, 0], {end_velocity: [0, -30, 0, 0, 0, 0]}),
                make_sound,
                Dexter.j_move([0, -30, 0, 0, 0, 0]),
                Dexter.j_move([0, 0, 0, 0, 0, 0], {end_velocity: [0, 30, 0, 0, 0, 0]}),
                make_sound
            ]
        })
    ]
})

function make_sound(){
    beep({dur: 0.1, frequency: 600, volume: 1})
    this.user_data.move_count++
    out("Midpoint " + this.user_data.move_count)
}

//Example 8 - Using 'this.user_data.j_move' to track which j_move it's currently on, even with async = true
var example_8_data
var delay = 0.5
new Job({
    name: "Example_8",
    show_instructions: false,
    inter_do_item_dur: 0,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    do_list: [
        function(){
            clear_output()
            example_8_data = []
        },
        Dexter.j_move([0, 0, 0, 0, 0]),
        Control.wait_until(1),

        function(){this.user_data.start_time = Date.now() * _ms},
        Dexter.j_move([30, 0, 0, 0, 0], {async: true}),
        Dexter.j_move([60, 0, 0, 0, 0], {async: true}),
        loop_for_dur(delay, record_data_example_8),
        Dexter.j_move([90, 0, 0, 0, 0], {monitor_callback: record_data_example_8}),

        function(){
            inspect(this.user_data.j_move)
        },

        function(){
            let joints_to_plot = [true, false, false, false, false, false]
            let plot_data = []
            let time_stack = this.user_data.j_move.time_stack
            let ys = [0, 40]
            for(let i = 0; i < time_stack.length; i++){
                let label_str = ""
                let j_cmd = this.user_data.j_move.cmd_stack[i]
                for(let j = 0; j < joints_to_plot.length; j++){
                    if(joints_to_plot[j]){
                        if(j !== 0){
                            label_str += "<br>"
                        }
                        label_str += "J" + (j+1) + ": [p:" + j_cmd.p[j] + ",v:" + j_cmd.v[j] + ",a:" + j_cmd.a[j] + "]"
                    }
                }
                plot_data.push({
                    type: "scatter",
                    name: label_str,
                    //mode: "markers",
                    mode: "lines",
                    x: [time_stack[i], time_stack[i]],
                    y: ys,
                    marker: {
                        width: 1,
                    }
                })
            }

            let times = []
            let stack_idxs = []
            let num_sent_cmds = []
            for(let i = 0; i < example_8_data.length; i++){
                times.push(example_8_data[i].time)
                stack_idxs.push(example_8_data[i].cur_stack_idx)
                num_sent_cmds.push(example_8_data[i].num_sent_cmds)
            }

            plot_data.push({
                type: "scatter",
                name: "this.user_data.j_move.cur_stack_idx",
                //mode: "markers",
                mode: "lines",
                x: times,
                y: stack_idxs,
                marker: {
                    width: 1,
                }
            })

            plot_trajectory(example_8_data, {
                title: "J Move Completion Prediction, Delay = " + delay + "s",
                data_types: ["dMEASURED_ANGLE", "J_VELOCITY"],
                joints_to_plot: joints_to_plot,
                y_axis: "Joint Velocity (deg/s)",
                additional_plot_data: plot_data
            })
        }
    ]
})

function record_data_example_8(){
    return [
        function(){
            let obj = parse_g5(this.robot.robot_status)
            obj.time = Date.now()*_ms - this.user_data.start_time
            obj.num_sent_cmds = this.user_data.j_move.num_sent_cmds
            obj.cur_stack_idx = this.user_data.j_move.cur_stack_idx

            example_8_data.push(obj)
        }
    ]
}

new Job({
    name: "stop_j_move",
    inter_do_item_dur: 0,
    show_instructions: false,
    do_list: [
        Dexter.j_reset()
    ]
})

new Job({
    name: "Home",
    inter_do_item_dur: 0,
    show_instructions: false,
    do_list: [
        init,
        Dexter.j_move([0, 0, 0, 0, 0])
    ]
})

new Job({
    name: "Print_Strs",
    robot: Brain.brain0,
    inter_do_item_dur: 0,
    show_instructions: false,
    do_list: [
        function(){
            let keys = Job.all_names
            let completed_jobs = []
            debugger
            for(let i = 0; i < keys.length; i++){
                if(Job[keys[i]].status_code === "completed"){
                    completed_jobs.push({
                        job_name: keys[i],
                        stop_time: Job[keys[i]].stop_time
                    })
                }
            }
            if(completed_jobs.length === 0){
                out("No completed jobs found.<br>Button must be purple.<br>Don't 'Eval' after completion.")
                return
            }
            completed_jobs = completed_jobs.sort(function(a, b){
                let date_a = Date(a.stop_time)
                let date_b = Date(b.stop_time)
                return date_a - date_b
            })

            let last_job = Job[completed_jobs[0].job_name]
            out(last_job + " sent instruction strings:")
            inspect(last_job.sent_instructions_strings)
        }
    ]
})

function init(){
    return [
        j_set_hardware_limits(), //in case they aren't already set in Defaults.make_ins
        Dexter.j_set_peak_velocity(vel),
        Dexter.j_set_peak_acceleration(accel),
        Dexter.j_set_peak_jerk(jerk),
    ]
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ignore all code below here:

function plot_trajectory(data, options = {
    data_types: ["MEASURED_ANGLE", "STEP_ANGLE", "ANGLE_AT", "J_POSITION", "J_VELOCITY", "J_ACCELERATION", "J_JERK"],
    joints_to_plot: [true, true, true, true, true, true],
    x_axis: "Time (s)",
    y_axis: "Joint Angle (deg)",
    title: "Trajectory",
    absolute_values: false,
    additional_plot_data: []
}){
    let default_options = {
        data_types: ["MEASURED_ANGLE", "STEP_ANGLE", "ANGLE_AT", "J_POSITION", "J_VELOCITY", "J_ACCELERATION", "J_JERK"],
        joints_to_plot: [true, true, true, true, true, true],
        x_axis: "Time (s)",
        y_axis: "Joint Angle (deg)",
        title: "Trajectory",
        absolute_values: false,
        additional_plot_data: []
    }
    let keys = Object.keys(options)
    for(let i = 0; i < keys.length; i++){
        if(default_options[keys[i]] === undefined){
            dde_error("The key of '" + keys[i] + "' is not valid for plot_trajectory()")
        }
        default_options[keys[i]] = options[keys[i]]
    }

    let color_array = [
        "red", "green", "blue", "magenta", "cyan", "orange", "brown", "lime", "purple",
        rgb(153,195,167), rgb(92,50,91), rgb(240,20,120), rgb(200,134,65), rgb(93,51,93),
        rgb(169,246,74), rgb(81,150,118), rgb(64,71,239), rgb(110,165,222), rgb(133,85,217),
        rgb(77,29,17), rgb(43,200,132), rgb(160,212,211), rgb(74,249,166), rgb(90,237,21),
        rgb(130,186,240), rgb(118,46,24), rgb(143,226,182), rgb(35,146,158), rgb(88,97,161)
    ]

    if(!Array.isArray(data)){
        data = obj_of_arrs_to_arr_objs(data)
    }

    let plot_data = []
    let T = 0

    let time_range = [Infinity, -Infinity]
    for(let i = 0; i < default_options.data_types.length; i++){
        let key = default_options.data_types[i]
        let d_count = get_d_chars(key)
        key = key.slice(d_count)
        let values = []
        let times = []
        for(let k = 0; k < data.length; k++){
            values.push(data[k][key])
            if(data[k].time === undefined && data[k].times){
                times.push(data[k].times)
            }else if(data[k].time && data[k].times === undefined){
                times.push(data[k].time)
            }else{
                out("data[k]:")
                inspect(data[k])
                dde_error("plot_trajectory() given incorrectly formatted time feild")
            }
        }

        let time = Vector.min(times)
        if(time < time_range[0]){
            time_range[0] = time
        }
        time = Vector.max(times)
        if(time > time_range[1]){
            time_range[1] = time
        }

        let values_T = Vector.transpose(values)
        for(let k = 0; k < values_T.length; k++){
            if(default_options.joints_to_plot[k] === false){
                continue
            }
            let ds = ""
            for(let l = 0; l < d_count; l++){
                ds += "d"
                values_T[k] = derive(times, values_T[k])
            }

            if(default_options.absolute_values){
                values_T[k] = Vector.abs(values_T[k])
            }

            plot_data.push({
                type: "scatter",
                name: "J" + (k+1) + " " + ds + key,
                //mode: "markers",
                mode: "lines",
                x: times,
                y: values_T[k],
                marker: {
                    width: 1,
                    //color: get_joint_color([T++])
                    color: color_array[T++]
                }
            })
        }
    }

    for(let i = 0; i < default_options.additional_plot_data.length; i++){
        let obj = default_options.additional_plot_data[i]
        if(obj.marker.color === undefined){
            obj.marker.color = color_array[T++]
        }
        plot_data.push(obj)
    }

    Plot.show(
        undefined,
        plot_data,
        {
            title:  default_options.title,
            xaxis:  {title: {text: options.x_axis}},
            yaxis:  {title: {text: options.y_axis}},
        },
        undefined,
        {
            title: default_options.title,
            x: 580,
            y: 40,
        }
    )
}

function derive(times, values){
    let result = []
    for(let i = 0; i < values.length-1; i++){
        result.push((values[i+1] - values[i]) / (times[i+1] - times[i]))
    }
    return result
}

function get_d_chars(string){
    let count = 0
    for(let i = 0; i < string.length; i++){
        if(string[i] === "d"){
            count++
        }else{
            break
        }
    }
    return count
}

function loop_for_dur(duration, callback = function(){}){
    return [
        function(){this.user_data.loop_for_dur_start_time = Date.now()*_ms},
        Control.loop(true, function(){
            let dur = Date.now()*_ms - this.user_data.loop_for_dur_start_time
            if(dur >= duration){
                return Control.break
            }else{
                return [
                    make_ins("g 5"),
                    callback
                ]
            }
        })
    ]
}

function parse_g5(rs){
    let result = {}
    let keys = ["MEASURED_ANGLE", "STEP_ANGLE", "ANGLE_AT", "J_POSITION", "J_VELOCITY", "J_ACCELERATION", "J_JERK", "J_temp_reserved_2"]
    for(let j = 0; j < keys.length; j++){
        result[keys[j]] = []
        for(let i = 0; i < 6; i++){
            let key = "g5_J" + (i+1) + "_" + keys[j]
            result[keys[j]].push(rs[Dexter[key]] * _arcsec)
        }
    }
    result.JTQ_DUR = rs[Dexter.g5_JTQ_DUR] / 100000
    return result
}




function arr_of_objs_to_obj_of_arrs(arr_obj){
    //array of objects to object of arrays
    //[{key_1: val, key_2: val}, {key_1: val, key_2: val}] -> {key_1: [], key_2: []}

    let keys = Object.keys(arr_obj[0])
    let obj_arr = {}
    for(let i = 0; i < keys.length; i++){
        let key = keys[i]
        obj_arr[key] = []
        for(let j = 0; j < arr_obj.length; j++){
            obj_arr[key].push(arr_obj[j][key])
        }
    }
    return obj_arr
}

function obj_of_arrs_to_arr_objs(obj_arr){
    //object of arrays to array of objects
    //{key_1: [], key_2: []} -> [{key_1: val, key_2: val}, {key_1: val, key_2: val}]

    let keys = Object.keys(obj_arr)
    let arr_obj = []
    for(let i = 0; i < obj_arr[keys[0]].length; i++){
        let obj = {}
        for(let j = 0; j < keys.length; j++){
            let key = keys[j]
            obj[key] = obj_arr[key][i]
        }
        arr_obj.push(obj)
    }
    return arr_obj
}

function get_joint_color(J_idx, shade_scale = 0){
    let color_array = ["red", "green", "blue", "magenta", "cyan", "orange"]
    if(shade_scale > 1 || -1 > shade_scale){
        dde_error("get_joint_color() shade_scale must be -1 to 1.<br>It was passed a shade_scale of: "+ shade_scale)
    }
    let color_a
    if(typeof J_idx === "number"){
        if(J_idx >= color_array.length){
            dde_error("get_joint_color() J_idx must be 0 to " + (color_array.length-1) + ".<br>It was passed a J_idx of: "+ J_idx)
        }
        color_a = color_array[J_idx]
    }else if(typeof J_idx === "string"){
        color_a = color_str_to_arr(J_idx)
    }else if(J_idx === undefined){
        color_a = [Math.round(Math.random()*255), Math.round(Math.random()*255), Math.round(Math.random()*255)]
    }
    let color_b
    if(shade_scale < 0){
        color_b = [0, 0, 0]
        shade_scale = Math.abs(shade_scale)
    }else{
        color_b = [240, 240, 240]
    }

    let color = interp_color(color_a, color_b, shade_scale)
    return color
}

//This should not be a DDE function, these should be defined correctly when a robot is first made and never changed.
function j_set_hardware_limits(){
    //I'll come back and make this have args for everything later
    return [
        "S, JointHardwareMaxSpeed, 1, 28800000;",
        "S, JointHardwareMaxSpeed, 2, 28800000;",
        "S, JointHardwareMaxSpeed, 3, 28800000;",
        "S, JointHardwareMaxSpeed, 4, 432000000;",
        "S, JointHardwareMaxSpeed, 5, 432000000;",
        "S, JointHardwareMaxSpeed, 6, 576000000;",

        "S, JointHardwareMaxAcceleration, 1, 2880000000;",
        "S, JointHardwareMaxAcceleration, 2, 2880000000;",
        "S, JointHardwareMaxAcceleration, 3, 2880000000;",
        "S, JointHardwareMaxAcceleration, 4, 432000000;",
        "S, JointHardwareMaxAcceleration, 5, 432000000;",
        "S, JointHardwareMaxAcceleration, 6, 576000000;",

        "S, JointHardwareMaxJerk, 1, 32400000000;",
        "S, JointHardwareMaxJerk, 2, 32400000000;",
        "S, JointHardwareMaxJerk, 3, 32400000000;",
        "S, JointHardwareMaxJerk, 4, 324000000000;",
        "S, JointHardwareMaxJerk, 5, 324000000000;",
        "S, JointHardwareMaxJerk, 6, 324000000000;"
    ]
}
*/

Dexter.g5_JTQ_DUR = 58

Dexter.j_reset = function(){
    return function(){
        return [
            make_ins("j"),
            Dexter.j_init,
        ]
    }
}

Dexter.j_init = function(){
    return function(){
        this.user_data.j_move = {}
        this.user_data.j_move.j_reset_start_time = Date.now() * _ms
        this.user_data.j_move.time_stack = []
        let experimental_fudge_factor = 0.09//0.06693
        let replay_delay = 0.05
        this.user_data.j_move.dur_sum = replay_delay + experimental_fudge_factor

        this.user_data.j_move.cmd_stack = []
        this.user_data.j_move.cur_stack_idx = 0
        this.user_data.j_move.num_sent_cmds = -1

        return "g 5"
    }
}

Dexter.j_set_peak_velocity = function(velocity = [30, 30, 30, 30, 30, 30]){
    let cmd = []
    for(let i = 0; i < velocity.length; i++){
        cmd.push("S JointSpeed " + (i+1) + " " + Math.round(velocity[i]/_arcsec) + ";")
    }
    return cmd
}

Dexter.j_set_peak_acceleration = function(acceleration = [300, 300, 300, 300, 300, 300]){
    let cmd = []
    for(let i = 0; i < accel.length; i++){
        cmd.push("S JointAcceleration " + (i+1) + " " + Math.round(acceleration[i]/_arcsec) + ";")
    }
    return cmd
}

Dexter.j_set_peak_jerk = function(jerk = [3000, 3000, 3000, 3000, 3000, 3000]){
    let cmd = []
    for(let i = 0; i < jerk.length; i++){
        cmd.push("S JointJerk " + (i+1) + " " + Math.round(jerk[i]/_arcsec) + ";")
    }
    return cmd
}

Dexter.wait_until_measured_angles = function(goal_position, tolerance = 0.05, callback){
    return Control.loop(true, function(){
        let cmd = []

        let rs = this.robot.robot_status
        let status_mode = rs[Dexter.STATUS_MODE]
        let meas
        if(status_mode === 0){
            meas = [
                rs[Dexter.J1_MEASURED_ANGLE],
                rs[Dexter.J2_MEASURED_ANGLE],
                rs[Dexter.J3_MEASURED_ANGLE],
                rs[Dexter.J4_MEASURED_ANGLE],
                rs[Dexter.J5_MEASURED_ANGLE],
            ]
        }else if(status_mode === 5){
            meas = [
                rs[Dexter.g5_J1_MEASURED_ANGLE],
                rs[Dexter.g5_J2_MEASURED_ANGLE],
                rs[Dexter.g5_J3_MEASURED_ANGLE],
                rs[Dexter.g5_J4_MEASURED_ANGLE],
                rs[Dexter.g5_J5_MEASURED_ANGLE],
            ]
            meas = Vector.multiply(meas, _arcsec)
        }

        let error = Vector.max(Vector.abs(Vector.subtract(meas, goal_position.slice(0, 5))))
        cmd.push(callback)
        if(error < tolerance){
            cmd.push(Control.break())
        }else{
            //cmd.push(Dexter.get_robot_status())
            cmd.push(make_ins("g 5"))
        }
        return cmd
    })
}

Dexter.j_wait_until_idx = function(idx, sync_delay, callback){
    //This allows j moves to be synchronous via jtq remaining duration
    return Control.loop(true, function(){
        let cmd = []
        let dur = Date.now() * _ms - this.user_data.j_move.j_reset_start_time

        for(let i = this.user_data.j_move.cur_stack_idx; i < this.user_data.j_move.time_stack.length; i++){
            if(dur >= this.user_data.j_move.time_stack[this.user_data.j_move.cur_stack_idx]){
                this.user_data.j_move.cur_stack_idx++
            }
        }

        if(dur >= sync_delay + this.user_data.j_move.time_stack[idx]){
            return Control.break()
        }

        cmd.push(make_ins("g 5"))
        cmd.push(callback)
        return cmd
    })
}

Dexter.j_move = function(j_angles = [], options = {
    peak_velocity: undefined,
    peak_acceleration: undefined,
    peak_jerk: undefined,
    end_velocity: [0, 0, 0, 0, 0, 0],
    end_acceleration: [0, 0, 0, 0, 0, 0],
    duration: "?",
    async: false,
    sync_delay: 0.05,
    in_motion_sync_delay: -0.2,
    monitor_callback: function(){}
}){
    return function(){
        let cmd = []
        let default_options = {
            peak_velocity: undefined, // peak velocity allowed during this motion. 'undefined' means keep previous value.
            peak_acceleration: undefined, // peak acceleration allowed during this motion. 'undefined' means keep previous value.
            peak_jerk: undefined, // peak jerk allowed during this motion. 'undefined' means keep previous value.

            end_velocity: [0, 0, 0, 0, 0, 0], // velocity that this motion ends at. Start velocity comes from previous j move's end_velocity.
            end_acceleration: [0, 0, 0, 0, 0, 0], // velocity that this motion ends at. Start acceleration comes from previous j move's end_acceleration.
            duration: "?", //'?' means get there as fast as possible given peak values

            async: false, //defualts true if coming to stop, false if moving through point, will always be overwritten by user value
            sync_delay: 0.05, //time from JtQ completion. Negative value means 'time before completion'.
            in_motion_sync_delay: -0.2, //time from JtQ completion. Is only used if end vel/accel are not 0.

            monitor_callback: function(){} //This function will get called over and over waiting for movement to complete. It returns to the do_list.
        }

        if(j_angles.length === 5){
            j_angles.push(0)
        }else if(j_angles.length !== 6){
            dde_error("Dexter.j_move() was passed: " + j_angles + "<br>It must have 5 or 6 joint angles as arguments")
        }
        if(this.user_data.j_move === undefined){
            //This means it's the first j move in a job
            this.user_data.j_move = {}
            this.user_data.j_move.j_reset_start_time = Date.now() * _ms
            this.user_data.j_move.time_stack = []
            this.user_data.j_move.dur_sum = 0.05

            this.user_data.j_move.cmd_stack = []
            this.user_data.j_move.cur_stack_idx = 0
            this.user_data.j_move.num_sent_cmds = -1
            cmd.push(Dexter.j_reset)
        }

        let option_keys = Object.keys(options)
        let default_option_keys = Object.keys(default_options)
        for(let i = 0; i < option_keys.length; i++){
            if(!default_option_keys.includes(option_keys[i])){
                dde_error("Dexter.j_move() passed an invalid option: " + option_keys[i] + "<br>Valid options: " + JSON.stringify(default_option_keys))
            }
            default_options[option_keys[i]] = options[option_keys[i]]
        }

        if(default_options.end_velocity.length === 5){
            default_options.end_velocity.push(0)
        }

        if(default_options.end_acceleration.length === 5){
            default_options.end_acceleration.push(0)
        }

        if(default_options.peak_velocity !== undefined){
            cmd.push(Dexter.j_set_peak_velocity(default_options.peak_velocity))
        }
        if(default_options.peak_acceleration !== undefined){
            cmd.push(Dexter.j_set_peak_acceleration(default_options.peak_acceleration))
        }
        if(default_options.peak_jerk !== undefined){
            cmd.push(Dexter.j_set_peak_jerk(default_options.peak_jerk))
        }

        cmd.push(make_ins("j p " + Vector.round(Vector.multiply(j_angles, 1/_arcsec), 0)))
        cmd.push(make_ins("j v " + Vector.round(Vector.multiply(default_options.end_velocity, 1/_arcsec), 0)))
        cmd.push(make_ins("j a " + Vector.round(Vector.multiply(default_options.end_acceleration, 1/_arcsec), 0) + " " + default_options.duration))
        cmd.push(function(){
            //Algorithm for syncing j moves via time information
            this.user_data.j_move.num_sent_cmds++
            let jtq_dur = this.robot.robot_status[Dexter.g5_JTQ_DUR] * 0.00001

            //new method:
            let delta_time = Date.now()*_ms + jtq_dur - this.user_data.j_move.j_reset_start_time
            this.user_data.j_move.time_stack.push(delta_time)

            this.user_data.j_move.cmd_stack.push({
                p: j_angles,
                v: default_options.end_velocity,
                a: default_options.end_acceleration,
                d: default_options.duration
            })

        })
        if(default_options.async === false){



            //Old Method:
            if(Vector.is_equal(default_options.end_velocity, [0, 0, 0, 0, 0, 0]) && Vector.is_equal(default_options.end_acceleration, [0, 0, 0, 0, 0, 0])){
                //If coming to a stop reset
                //This prevents the j queue underruning or getting too large

                cmd.push(function(){return Dexter.j_wait_until_idx(this.user_data.j_move.num_sent_cmds, default_options.sync_delay, default_options.monitor_callback)})
                cmd.push(Dexter.j_reset)
            }else{
                cmd.push(function(){return Dexter.j_wait_until_idx(this.user_data.j_move.num_sent_cmds, default_options.in_motion_sync_delay, default_options.monitor_callback)})
            }
        }
        return cmd
    }
}

function init_g5_robot_status_indexes() {
    let keys = ["MEASURED_ANGLE", "STEP_ANGLE", "ANGLE_AT", "J_POSITION", "J_VELOCITY", "J_ACCELERATION", "J_JERK", "J_temp_reserved_2"]
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < keys.length; j++) {
            let key = "g5_J" + (i + 1) + "_" + keys[j]
            let idx = i * keys.length + 10 + j
            Dexter[key] = idx
        }
    }
}

init_g5_robot_status_indexes()