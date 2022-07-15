class Dex {
    static version = 2
    static init(){
        if(!Job.DexJob) {
            new Job ({name: "DexJob",
                    do_list: [],
                    show_instructions: false,
                    when_do_list_done: "wait"
                }
            )
        }
        if(!Job.DexJob.is_active()) {
            Job.DexJob.start()
        }
    }

    //see https://pretagteam.com/question/wait-until-condition-is-met-or-timeout-is-passed-in-javascript
    static async m_joint(...array_of_angles) {
        Dex.init() //make sure the job is running
        Dex.m_joint_aux(...array_of_angles)
        let eiq_instr_id = Job.DexJob.program_counter + 1 //pc is instr_id of the maj instr, one higher for the eiq
        let timeoutMS = 10000 //todo call predict_dur to get a better estimate?
        //console.log("m_joint before new promise")
        return new Promise((resolve, reject) => {
            //console.log("m_joint inside top new promise fn")
            let timeWas = Date.now();
            //resolve("from prom")})}
            let eiq_instr_id2 = eiq_instr_id //maybe closures can capture 2 levels down
            let timeoutMS2 = timeoutMS
            let setIntervalId = setInterval(function() {
                //console.log("m_joint inside top setInterval fn")

                if(Job["DexJob"]) { //DexJob *might* not have been created yet.
                    let latest_rs = Job.DexJob.robot.rs
                    let latest_rs_instr_id = latest_rs.instruction_id()
                    if (latest_rs_instr_id >= eiq_instr_id2) { //got the robot status back from our eiq instruction
                        //console.log("resolved after", Date.now() - timeWas, "ms");
                        clearInterval(setIntervalId);
                        resolve(latest_rs);
                    }
                    else if ((Date.now() - timeWas) > timeoutMS2) { // Timeout
                        //console.log("rejected after", Date.now() - timeWas, "ms");
                        clearInterval(setIntervalId);
                        reject("timed-out");
                    }
                }
            }, 5);
        }  );
    }
    static m_joint_aux(...array_of_angles){
        Dex.init()
        let the_maj = Dexter.move_all_joints(...array_of_angles)
        Job.insert_instruction(the_maj,
            {job: "DexJob",
                offset: "end"})
        let the_eiq = Dexter.empty_instruction_queue()
        Job.insert_instruction(the_eiq,
            {job: "DexJob",
                offset: "end"})
    }
    static m_xyz(xyz = [],
                 J5_direction   = [0, 0, -1],
                 config         = Dexter.RIGHT_UP_OUT,
                 workspace_pose = null, //will default to the job's default workspace_pose
                 j6_angle       = [0],
                 j7_angle       = [0]){
        Dex.init()
        let the_maj = Dexter.move_to(xyz, J5_direction, config, workspace_pose, j6_angle, j7_angle)
        Job.insert_instruction(the_maj,
            {job: "DexJob",
                offset: "end"})
        let the_eiq = Dexter.empty_instruction_queue()
        Job.insert_instruction(the_eiq,
            {job: "DexJob",
                offset: "end"})
    }

    static run(do_list_item){
        Job.insert_instruction(do_list_item,
            {job: "DexJob",
                offset: "end"})
    }
}
globalThis.Dex = Dex