/* Dexter_j_move_proposal.dde
Written by: James Wigglesworth
Started: 11/13/2023
Modified: 11/27/2023


Proposed new functions:
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



//Limits:
var speed = [30, 30, 30, 30, 30, 30]
var accel = [150, 150, 150, 150, 150, 150]
var jerk = [3000, 3000, 3000, 3000, 3000, 3000]
define_j_move_functions() //this is just to show the code for the Jobs first in this file

//Job Examples:

//Example 1 - simple motion
new Job({
    name: "j_move_example_1",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    do_list: [
        j_set_hardware_limits(),
        Dexter.j_set_peak_velocity(speed),
        Dexter.j_set_peak_acceleration(accel),
        Dexter.j_set_peak_jerk(jerk),

        Control.loop(true, function(){
            return [
                Dexter.j_move([0, -45, 0, 0, 0]),
                Dexter.j_move([0, 45, 0, 0, 0]),
            ]
        })
    ]
})

Example 1 oplet strings sent per loop
    j p 0,-162000,0,0,0,0;
    j v 0,0,0,0,0,0;
    j a 0,0,0,0,0,0 ?;
    F 50;
    j p 0,162000,0,0,0,0;
    j v 0,0,0,0,0,0;
    j a 0,0,0,0,0,0 ?;
    F 50;



//Example 2 - simple motion with duration
new Job({
    name: "j_move_example_2",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    do_list: [
        j_set_hardware_limits(),
        Dexter.j_set_peak_velocity(speed),
        Dexter.j_set_peak_acceleration(accel),
        Dexter.j_set_peak_jerk(jerk),

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

Example 2 oplet strings sent per loop
    j p 0,-36000,0,0,0,0;
    j v 0,0,0,0,0,0;
    j a 0,0,0,0,0,0 1;
    F 50;
    j p 0,-18000,0,0,0,0;
    j v 0,0,0,0,0,0;
    j a 0,0,0,0,0,0 1;
    F 50;
    j p 0,36000,0,0,0,0;
    j v 0,0,0,0,0,0;
    j a 0,0,0,0,0,0 1;
    F 50;



//Example 3 - Motion through a waypoint
new Job({
    name: "j_move_example_3",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    do_list: [
        j_set_hardware_limits(),
        Dexter.j_set_peak_velocity(speed),
        Dexter.j_set_peak_acceleration(accel),
        Dexter.j_set_peak_jerk(jerk),

        Control.loop(true, function(){
            return [
                Dexter.j_move([-30, -30, 0, 0, 0, 0]),
                Dexter.j_move([0, 0, 0, 0, 0, 0], {end_velocity: [30, 0, 0, 0, 0, 0]}),
                Dexter.j_move([30, 0, 0, 0, 0, 0]),
            ]
        })
    ]
})

Example 3 oplet strings sent per loop
    j p -108000,-108000,0,0,0,0;
    j v 0,0,0,0,0,0;
    j a 0,0,0,0,0,0 ?;
    F 50;
    j p 0,0,0,0,0,0;
    j v 108000,0,0,0,0,0;
    j a 0,0,0,0,0,0 ?;
    j p 108000,0,0,0,0,0;
    j v 0,0,0,0,0,0;
    j a 0,0,0,0,0,0 ?;
    F 50;


//Example 4 - Sync vs. Async calls (This won't work until we impliment 'F' to work for j moves)
new Job({
    name: "j_move_example_4",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    user_data: {
        move_count: 0,
    },
    do_list: [
        j_set_hardware_limits(),
        Dexter.j_set_peak_velocity(speed),
        Dexter.j_set_peak_acceleration(accel),
        Dexter.j_set_peak_jerk(jerk),

        Control.loop(true, function(){
            return [
                function(){
                    this.user_data.move_count++
                    out("Synchronous j_move " + this.user_data.move_count + " starting...")
                    this.user_data.start_time = Date.now()
                },
                Dexter.j_move([0, -30, 0, 0, 0, 0]),
                function(){
                    let duration = Vector.round((Date.now() - this.user_data.start_time)*_ms, 5)
                    out("Synchronous j_move " + this.user_data.move_count + " completed in " + duration)
                },

                function(){
                    out("Asynchronous j_move " + this.user_data.move_count + " starting...")
                    this.user_data.start_time = Date.now()
                },
                Dexter.j_move([0, 30, 0, 0, 0, 0], {async: true}),
                function(){
                    let duration = Vector.round((Date.now() - this.user_data.start_time)*_ms, 5)
                    out("Asynchronous j_move " + this.user_data.move_count + " completed in " + duration)
                },

                function(){
                    this.user_data.move_count++
                    out("Synchronous j_move " + this.user_data.move_count + " starting...")
                    this.user_data.start_time = Date.now()
                },
                Dexter.j_move([0, 0, 0, 0, 0, 0]),
                function(){
                    let duration = Vector.round((Date.now() - this.user_data.start_time)*_ms, 5)
                    out("Synchronous j_move " + this.user_data.move_count + " completed in " + duration)
                },

            ]
        })
    ]
})

Example 4 oplet strings sent per loop
    j p -108000,-108000,0,0,0,0;
    j v 0,0,0,0,0,0;
    j a 0,0,0,0,0,0 ?;
    F 50;
    j p 0,0,0,0,0,0;
    j v 108000,0,0,0,0,0;
    j a 0,0,0,0,0,0 ?;


//Example 5 - Sync calls while moving (This won't work until we impliment sync_delay for 'F')
new Job({
    name: "j_move_example_5",
    show_instructions: false,
    when_stopped: function(){
        return Dexter.j_reset()
    },
    user_data: {
        move_count: 0,
    },
    do_list: [
        j_set_hardware_limits(),
        Dexter.j_set_peak_velocity(speed),
        Dexter.j_set_peak_acceleration(accel),
        Dexter.j_set_peak_jerk(jerk),

        Control.loop(true, function(){
            return [
                Dexter.j_move([0, -30, 0, 0, 0, 0]),
                Dexter.j_move([0, 0, 0, 0, 0, 0], {end_velocity: [0, 30, 0, 0, 0, 0], async: false, sync_delay: -0.1}),
                function(){
                    this.user_data.move_count++
                    out("Midpoint " + this.user_data.move_count)
                },
                Dexter.j_move([0, 30, 0, 0, 0, 0]),
            ]
        })
    ]
})

Example 5 oplet strings sent per loop
    j p 0,-108000,0,0,0,0;
    j v 0,0,0,0,0,0;
    j a 0,0,0,0,0,0 ?;
    F 50;
    j p 0,0,0,0,0,0;
    j v 0,108000,0,0,0,0;
    j a 0,0,0,0,0,0 ?;
    F -100;
    j p 0,108000,0,0,0,0;
    j v 0,0,0,0,0,0;
    j a 0,0,0,0,0,0 ?;
    F 50;


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
        j_set_hardware_limits(),
        Dexter.j_set_peak_velocity(speed),
        Dexter.j_set_peak_acceleration(accel),
        Dexter.j_set_peak_jerk(jerk),

        Dexter.j_move([0, 0, 0, 0, 0])
    ]
})
*/
    //stops Dexter from moving where ever it is and leaves it there.
    Dexter.j_reset = function(){
        return make_ins("j")
    }

    Dexter.j_set_peak_velocity = function(velocity = [30, 30, 30, 30, 30, 30]){
        let cmd = []
        for(let i = 0; i < velocity.length; i++){
            cmd.push(make_ins("S", "JointSpeed " + (i+1) + " " + Math.round(velocity[i]/_arcsec)))
        }
        return cmd
    }

    Dexter.j_set_peak_acceleration = function(acceleration = [300, 300, 300, 300, 300, 300]){
        let cmd = []
        for(let i = 0; i < accel.length; i++){
            cmd.push(make_ins("S", "JointAcceleration " + (i+1) + " " + Math.round(acceleration[i]/_arcsec)))
        }
        return cmd
    }

    Dexter.j_set_peak_jerk = function(jerk = [3000, 3000, 3000, 3000, 3000, 3000]){
        let cmd = []
        for(let i = 0; i < jerk.length; i++){
            cmd.push(make_ins("S", "JointJerk " + (i+1) + " " + Math.round(jerk[i]/_arcsec)))
        }
        return cmd
    }


    //goal_position is an array of angles, its lengths should be the same as the
    //measured angles that we compare to.
    //Truncate rs[Dexter.J1_MEASURED_ANGLE], based on goal_position length
    Dexter.wait_until_measured_angles = function(goal_position, tolerance = 0.05, callback){
        return Control.loop(true, function() {
            let cmd = []

            let rs = this.robot.robot_status
            let status_mode = rs[Dexter.STATUS_MODE]
            let meas
            if (status_mode === 0) {
                meas = [
                    rs[Dexter.J1_MEASURED_ANGLE],
                    rs[Dexter.J2_MEASURED_ANGLE],
                    rs[Dexter.J3_MEASURED_ANGLE],
                    rs[Dexter.J4_MEASURED_ANGLE],
                    rs[Dexter.J5_MEASURED_ANGLE],
                ]
            } else if (status_mode === 5) {
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
            if (error < tolerance) {
                cmd.push(Control.break())
            } else {
                //cmd.push(Dexter.get_robot_status())
                cmd.push(make_ins("g", 5))
            }
            return cmd
        })
    }

    Dexter.j_move = function(j_angles = [], options = {
        end_velocity: [0, 0, 0, 0, 0, 0],
        end_acceleration: [0, 0, 0, 0, 0, 0],
        duration: "?",
        async: false,
        sync_delay: 0.05,
        peak_velocity: undefined,
        peak_acceleration: undefined,
        peak_jerk: undefined,
        monitor_callback: function(){}
    }){

        let default_options = {
            end_velocity: [0, 0, 0, 0, 0, 0],
            end_acceleration: [0, 0, 0, 0, 0, 0],
            duration: "?", //'?' means get there as fast as possible

            async: false, //defualts true if coming to stop, false if moving through point, will always be overwritten by user value
            sync_delay: 0.05, //time from JtQ completion. Negative value means 'time before completion'.

            peak_velocity: undefined,
            peak_acceleration: undefined,
            peak_jerk: undefined,

            monitor_callback: function(){} //This function will get called over and over waiting for movement to complete. It returns to the do_list.
        }

        if(j_angles.length === 5){
            j_angles.push(0)
        }else if(j_angles.length !== 6){
            dde_error("Dexter.j_move() was passed: " + j_angles + "<br>It must have 5 or 6 joint angles as arguments")
        }

        let option_keys = Object.keys(options)
        let default_option_keys = Object.keys(default_options)
        for(let i = 0; i < option_keys.length; i++){
            if(!default_option_keys.includes(option_keys[i])){
                dde_error("Dexter.j_move() passed an invalid option: " + option_keys[i] + "<br>Valid options: " + JSON.stringify(default_option_keys))
            }
            default_options[option_keys[i]] = options[option_keys[i]]
        }

        /*
        if(default_options.async === false || Vector.is_equal(default_options.end_velocity, [0, 0, 0, 0, 0, 0]) && Vector.is_equal(default_options.end_acceleration, [0, 0, 0, 0, 0, 0])){
            default_options.async = false
        }else{
            default_options.async = true
        }
        */

        if(default_options.end_velocity.length === 5){
            default_options.end_velocity.push(0)
        }

        if(default_options.end_acceleration.length === 5){
            default_options.end_acceleration.push(0)
        }


        let cmd = []

        if(default_options.peak_velocity !== undefined){
            cmd.push(Dexter.j_set_peak_velocity(default_options.peak_velocity))
        }
        if(default_options.peak_acceleration !== undefined){
            cmd.push(Dexter.j_set_peak_acceleration(default_options.peak_acceleration))
        }
        if(default_options.peak_jerk !== undefined){
            cmd.push(Dexter.j_set_peak_jerk(default_options.peak_jerk))
        }

        cmd.push(make_ins("j", "p", ...Vector.round(Vector.multiply(j_angles, 1/_arcsec), 0)))
        cmd.push(make_ins("j", "v", ...Vector.round(Vector.multiply(default_options.end_velocity, 1/_arcsec), 0)))
        cmd.push(make_ins("j", "a", ...Vector.round(Vector.multiply(default_options.end_acceleration, 1/_arcsec), 0), default_options.duration))

        if(default_options.async === false){
            //Eventually this will be the F oplet but for now:
            cmd.push(Dexter.wait_until_measured_angles(j_angles, undefined, options.monitor_callback))
            cmd.push(Control.wait_until(options.sync_delay))
            //cmd.push(make_ins("F", Math.round(default_options.sync_delay/_ms))) //This may or may not become a different oplet specifically for j moves. Units could become seconds too.
        }

        return cmd
    }

function init_g5_robot_status_indexes() {
    let keys = ["MEASURED_ANGLE", "STEP_ANGLE", "ANGLE_AT", "J_POSITION", "J_VELOCITY", "J_ACCELERATION", "J_temp_reserved_1", "J_temp_reserved_2"]
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < keys.length; j++) {
            let key = "g5_J" + (i + 1) + "_" + keys[j]
            let idx = i * keys.length + 10 + j
            Dexter[key] = idx
        }
    }
}
init_g5_robot_status_indexes()

/*

//This should not be a DDE function, these should be defined correctly when a robot is first made and never changed.
function j_set_hardware_limits(){
    //I'll come back and make this have args for everything later
    return [
        "S, JointHardwareMaxSpeed, 1, 2880000;",
        "S, JointHardwareMaxSpeed, 2, 2880000;",
        "S, JointHardwareMaxSpeed, 3, 2880000;",
        "S, JointHardwareMaxSpeed, 4, 4320000;",
        "S, JointHardwareMaxSpeed, 5, 4320000;",
        "S, JointHardwareMaxSpeed, 6, 5760000;",

        "S, JointHardwareMaxAcceleration, 1, 28800000;",
        "S, JointHardwareMaxAcceleration, 2, 28800000;",
        "S, JointHardwareMaxAcceleration, 3, 28800000;",
        "S, JointHardwareMaxAcceleration, 4, 43200000;",
        "S, JointHardwareMaxAcceleration, 5, 43200000;",
        "S, JointHardwareMaxAcceleration, 6, 57600000;",

        "S, JointHardwareMaxJerk, 1, 324000000;",
        "S, JointHardwareMaxJerk, 2, 324000000;",
        "S, JointHardwareMaxJerk, 3, 324000000;",
        "S, JointHardwareMaxJerk, 4, 324000000;",
        "S, JointHardwareMaxJerk, 5, 324000000;",
        "S, JointHardwareMaxJerk, 6, 324000000;"
    ]
}*/
