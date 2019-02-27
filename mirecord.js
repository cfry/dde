var MiRecord = class MiRecord {
    static set_playback_loc(loc=0){
        //if(loc >= MiRecord.array_of_joint_sets.length) {  //sometimes this is called with a loc == MiRecord.array_of_joint_sets.length and that's one too long
        //   loc = MiRecord.array_of_joint_sets.length - 1
        //}
        //if (loc < 0) { loc = 0 }
        //out("loc:  " + loc)
        let max = Math.max(0, MiRecord.array_of_joint_sets.length - 1)
        MiRecord.playback_loc = loc
        mi_record_slider_id.value = loc
        mi_record_slider_pos_id.innerHTML = loc
        mi_record_slider_id.max = max
        mi_record_slider_max_id.innerHTML = max

    }
    static record_slider_oninput(event){
        MiRecord.playback_loc = parseInt(event.value)
        mi_record_slider_pos_id.innerHTML = event.value
    }
    static start_record(){
        new Job({
            name: "mi_record",
            do_list: [
                function(){ MiRecord.array_of_joint_sets = [] },
                Dexter.set_follow_me(),
                function(){ MiRecord.playback_loc = 0 },
                Robot.loop(true,
                            function(){
                                Dexter.get_robot_status() //immediately()
                                let rs_array = last(this.rs_history)
                                let rs_obj = new RobotStatus({robot_status: rs_array})
                                let angles = rs_obj.measured_angles(7)
                                MiRecord.array_of_joint_sets.push(angles)
                                MiRecord.set_playback_loc(MiRecord.array_of_joint_sets.length - 1)
                                out(angles)
                            })
            ]}).start()
        this.set_record_state("active")
        this.set_reverse_state("disabled")
        this.set_pause_state("disabled")
        this.set_play_state("disabled")
        this.set_insert_recording_state("disabled")
    }
    static stop_record(){
        Job.mi_record.stop_for_reason("interrupted", "User stopped the recording.")
        this.set_record_state("enabled")
        this.set_reverse_state("enabled")
        this.set_pause_state("disabled")
        this.set_play_state("enabled")
        this.set_insert_recording_state("enabled")
        this.set_playback_loc(0)
    }
    static start_play(){
        new Job({
            name: "mi_play",
            do_list: [Dexter.set_keep_position(),
                       Dexter.loop(true,
                                   function(){
                                       let arr_of_joints = MiRecord.array_of_joint_sets[MiRecord.playback_loc]
                                       let ins = Dexter.pid_move_all_joints(arr_of_joints)
                                       if(MiRecord.playback_loc >= (MiRecord.array_of_joint_sets.length - 1)){
                                           MiRecord.stop_play("completed", "Recording played to its end.")
                                       }
                                       else { MiRecord.set_playback_loc(MiRecord.playback_loc + 1)
                                              return ins
                                       }
                                   })
                     ]}).start()
        this.set_record_state("disabled")
        this.set_reverse_state("disabled")
        this.set_pause_state("enabled")
        this.set_play_state("active")
        this.set_insert_recording_state("disabled")
    }
    static start_reverse(){
        new Job({
            name: "mi_play",
            do_list: [Dexter.set_keep_position(),
                    Dexter.loop(true,
                        function(){
                            let arr_of_joints = MiRecord.array_of_joint_sets[MiRecord.playback_loc]
                            let ins = Dexter.pid_move_all_joints(arr_of_joints)
                            if(MiRecord.playback_loc == 0) {
                                MiRecord.stop_play("completed", "Recording played back to its beginning.")
                            }
                            else {
                                MiRecord.set_playback_loc(MiRecord.playback_loc - 1)
                                return ins
                            }
                        })
            ]}).start()
        this.set_record_state("disabled")
        this.set_reverse_state("active")
        this.set_pause_state("enabled")
        this.set_play_state("disabled")
        this.set_insert_recording_state("disabled")

    }
    static stop_play(status="interrupted", reason="User stopped the recording."){
        Job.mi_play.stop_for_reason(status, reason)
        this.set_record_state("enabled")
        this.set_reverse_state("enabled")
        this.set_pause_state("disabled")
        this.set_play_state("enabled")
        this.set_insert_recording_state("enabled")
    }
    static insert_recording(){
        let result =
`\nnew Job({
        name: "mi_play_1",
        do_list: [Dexter.set_keep_position(),
            Dexter.loop(mi_recorded_angles,
                function(iter_index, iter_value){
                    let ins = Dexter.pid_move_all_joints(iter_value)
                    return ins
                })
        ]})` +
        "\n\nvar mi_recorded_angles =\n" +
        this.make_big_array_string()

        Editor.insert(result)
    }
    static make_big_array_string(){
        let result = "[ //______joints 1 through 7______\n"
        for(let i = 0; i < MiRecord.array_of_joint_sets.length; i++){
            result += "["
            let arr = MiRecord.array_of_joint_sets[i]
            result += arr.join(", ")
            let suffix = ((i == MiRecord.array_of_joint_sets.length - 1) ? "" : ",")
            result += "]" + suffix + " // " + i + "\n"
        }
        result += "]\n"
        return result
    }
    //________buttons_________
    static make_html(){
        let result = "<div style='white-space:nowrap;'>" +
                     "<input id='mi_record_id'  style='vertical-align:25%;' type='button' value='Record'/>" +
                     "<span  id='mi_reverse_id' style='font-size:25px;margin-left:5px;'>&#9664;</span>" +
                     "<b     id='mi_pause_id'   style='font-size:28px;margin-left:5px;'>&#8545;</b>" +
                     "<span  id='mi_play_id'    style='font-size:25px;margin-left:5px;'>&#9654;</span>" +
                     "<input id='mi_insert_recording_id' style='margin-left:5px;vertical-align:25%;' type='button' value='Insert Recording'/>" +
                     "</div>" +
                     "<div id='mi_record_slider_pos_id' style='margin-left:100px;'>0</div>" +
                     "<span>0</span>" +
                     "<input id='mi_record_slider_id' oninput='MiRecord.record_slider_oninput(this)' type='range' value='0' min='0' max='100' style='width:250px;'" +
                             " title='Drag the knob to set\nthe starting play location.\nYou must Record first.'/>" +
                     "<span id='mi_record_slider_max_id'>0</span>"
        return result
    } //&VerticalSeparator;  document.getElementById("myBtn").disabled = true;

    static set_initial_states(){
        this.set_record_state("enabled")
        this.set_reverse_state("disabled")
        this.set_pause_state("disabled")
        this.set_play_state("disabled")
        this.set_insert_recording_state("disabled")
        this.set_playback_loc(0)
    }

    static set_record_state(state) {
        if(state == "disabled") {
            mi_record_id.disabled = true
            mi_record_id.value    = "Record"
            mi_record_id.onclick  = function(){MiRecord.start_record()}
            mi_record_id.title    = "Record disabled while playing."
            mi_record_id.style["background-color"] = "#d8dadf" //"#ffd5e2"
        }
        else if(state == "enabled") {
            mi_record_id.disabled = false
            mi_record_id.value    = "Record"
            mi_record_id.onclick  = function(){MiRecord.start_record()}
            mi_record_id.title    = "Click to record Dexter's motions\nas you manually move it."
            mi_record_id.style["background-color"] = "#ff6981"
        }
        else if(state == "active") {
            mi_record_id.disabled = false
            mi_record_id.value    = "recording"
            mi_record_id.onclick  = function(){MiRecord.stop_record()}
            mi_record_id.title    = "Click to stop recording."
            mi_record_id.style["background-color"] = "#ff2839"
        }
        else {shouldnt("MiRecord.set_record_state passed invalid state: " + state) }
    }
    static set_reverse_state(state) {
        if(state == "disabled") {
            mi_reverse_id.disabled = true
            //mi_reverse_id.value  = "Reverse"
            mi_reverse_id.onclick  = function(){MiRecord.start_reverse()}
            mi_reverse_id.title    = "Reverse is disabled when no recording and\nduring recording & playing."
            mi_reverse_id.style["color"] = "#bebcc0"
        }
        else if(state == "enabled") {
            mi_reverse_id.disabled = false
            //mi_reverse_id.value  = "Reverse"
            mi_reverse_id.onclick  = function(){MiRecord.start_reverse()}
            mi_reverse_id.title    = "Play the latest recording backwards."
            mi_reverse_id.style["color"] = "#000000"
        }
        else if(state == "active") {
            mi_reverse_id.disabled = false
            //mi_reverse_id.value  = "Reverse"
            mi_reverse_id.onclick  = function(){MiRecord.stop_play()}
            mi_reverse_id.title    = "Click to stop playing."
            mi_reverse_id.style["color"] = "#00f036"  //green
        }
        else {shouldnt("MiRecord.set_reverse_state passed invalid state: " + state) }
    }
    static set_pause_state(state) {
        if(state == "disabled") {
            mi_pause_id.disabled = true
            //mi_pause_id.value  = "Reverse"
            mi_pause_id.onclick  = function(){MiRecord.stop_play()}
            mi_pause_id.title    = "Pause is disabled when no recording and\nduring recording."
            mi_pause_id.style["color"] = "#bebcc0"
        }
        else if(state == "enabled") {
            mi_pause_id.disabled = false
            //mi_pause_id.value  = "Reverse"
            mi_pause_id.onclick  = function(){MiRecord.stop_play()}
            mi_pause_id.title    = "Stop playing."
            mi_pause_id.style["color"] = "#000000"
        }
        else if(state == "active") { //this is never active. Just here for completeness
            mi_pause_id.disabled = false
            //mi_pause_id.value  = "Reverse"
            mi_pause_id.onclick  = function(){MiRecord.stop_play()}
            mi_pause_id.title    = "Stop playing."
            mi_pause_id.style["color"] = "#000000"
        }
        else {shouldnt("MiRecord.set_reverse_state passed invalid state: " + state) }
    }
    static set_play_state(state) {
        if(state == "disabled") {
            mi_reverse_id.disabled = true
            //mi_reverse_id.value  = "Reverse"
            mi_play_id.onclick     = function(){MiRecord.start_play()}
            mi_play_id.title       = "Play is disabled when no recording and\nduring recording."
            mi_play_id.style["color"] = "#bebcc0"
        }
        else if(state == "enabled") {
            mi_reverse_id.disabled = false
            //mi_reverse_id.value  = "Reverse"
            mi_play_id.onclick     = function(){MiRecord.start_play()}
            mi_play_id.title       = "Play the latest recording."
            mi_play_id.style["color"] = "#000000"
        }
        else if(state == "active") {
            mi_play_id.disabled = false
            //mi_play_id.value  = "Reverse"
            mi_play_id.onclick  = function(){MiRecord.stop_play()}
            mi_play_id.title    = "Click to stop playing."
            mi_play_id.style["color"] = "#00f036" //green
        }
        else {shouldnt("MiRecord.set_reverse_state passed invalid state: " + state) }
    }
    static set_insert_recording_state(state) {
        if(state == "disabled") {
            mi_insert_recording_id.disabled = true
            mi_insert_recording_id.value    = "Insert Recording"
            mi_insert_recording_id.onclick  = function(){MiRecord.insert_recording()}
            mi_insert_recording_id.title    = "Disabled when no recording and\nduring recording & playing."
            mi_insert_recording_id.style["background-color"] = "#d8dadf" //"#e0d9ff"
        }
        else if(state == "enabled") {
            mi_insert_recording_id.disabled = false
            mi_insert_recording_id.value    = "Insert Recording"
            mi_insert_recording_id.onclick  = function(){MiRecord.insert_recording()}
            mi_insert_recording_id.title    = "Insert a job that will\nplay the latest recording\ninto the editor."
            mi_insert_recording_id.style["background-color"] = "#bca6fd"
        }
        else if(state == "active") {
            mi_insert_recording_id.disabled = true
            mi_insert_recording_id.value    = "Insert Recording"
            mi_insert_recording_id.onclick  = function(){MiRecord.insert_recording()}
            mi_insert_recording_id.title    = "Now inserting the recording."
            mi_insert_recording_id.style["background-color"] = "#9447ff"
        }
        else {shouldnt("MiRecord.set_insert_recording_state passed invalid state: " + state) }
    }
}

MiRecord.array_of_joint_sets = []
MiRecord.playback_loc = 0 //index into array_of_joint_sets

