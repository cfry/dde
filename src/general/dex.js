//import {eval_js_part2} from "./eval.js" //now global

class Dex {
    static version = 4
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
    static run_button_handler(){
        let src = Editor.get_javascript("auto").trim()
        src = Dex.transform_source_to_async(src)
        src = "(" + src + ")()"
        out("evaling: " + src)
        eval_js_part2(src)
        //eval(src) //errors due to "strict mode".
    }

    static wrap_instruction_handler(){
        let src = Editor.get_javascript("auto").trim()
        src = Dex.transform_source_to_async(src)
        if(Editor.is_selection()){
            Editor.replace_selection(src)
        }
        else {
            Editor.set_javascript(src)
        }
    }

    static transform_source_to_async(src){
        src = "  " + src //indent first line
        src = src.replaceAll("\n", "\n  ") //indent the body of our new fn just 2 spaces as maybe user already had it indented in the editor.
        let result = "async function run_ins(){\n"
        let index = 0
        while(true){
           let await_index = src.indexOf("await ", index)
           let dex_index   = src.indexOf("Dex.m_joint", index)
           console.log("index: " + index + " await_index: " + await_index + " dex_index: " + dex_index)
           if(dex_index === -1) { break; } //no more "Dex." left.
           else if (await_index === -1){ //no await's so must insert one
               src = src.substring(0, dex_index) + "await " + src.substring(dex_index)
           }
           else if(await_index > dex_index) { //but we still need one here.
               src = src.substring(0, dex_index) + "await " + src.substring(dex_index)
           }
           else if ((dex_index - await_index) < 8) { //already has an await before it an near so leave src alone
               console.log("already have an await.") //can't have empty else_if clause due to bug in v8 engine apparently, probably due to optimization.
           }

           else { //need to insert " await "
               src = src.substring(0, dex_index) + "await " + src.substring(dex_index)
           }
           index = dex_index + 10 //if index is longer than src, startsWith will return false
        }
        result += src
        result += "\n}"
        return result
    }

    //see https://pretagteam.com/question/wait-until-condition-is-met-or-timeout-is-passed-in-javascript
    static async m_joint(...array_of_angles) {
        Dex.init() //make sure the job is running
        Dex.m_joint_aux(...array_of_angles)
        let eiq_instr_id = Job.DexJob.program_counter + 1 //pc is instr_id of the maj instr, one higher for the eiq
        let timeoutMS = 10000 //todo call predict_dur to get a better estimate?
        console.log("m_joint before new promise")
        return new Promise((resolve, reject) => {
            console.log("m_joint inside top new promise fn")
            let timeWas = Date.now();
            //resolve("from prom")})}
            let eiq_instr_id2 = eiq_instr_id //maybe closures can capture 2 levels down
            let timeoutMS2 = timeoutMS
            let setIntervalId = setInterval(function() {
                console.log("m_joint inside top setInterval fn")

                if(Job.DexJob &&
                   Job.DexJob.robot &&
                   Job.DexJob.robot.rs &&
                   (typeof(Job.DexJob.robot.rs.instruction_id()) == "number")) { //DexJob *might* not have been created yet, or we might not have an rs yet
                    let latest_rs = Job.DexJob.robot.rs
                    let latest_rs_instr_id = latest_rs.instruction_id()
                    if (latest_rs_instr_id >= eiq_instr_id2) { //got the robot status back from our eiq instruction
                        console.log("resolved after", Date.now() - timeWas, "ms");
                        clearInterval(setIntervalId);
                        resolve(latest_rs);
                    }
                    else if ((Date.now() - timeWas) > timeoutMS2) { // Timeout
                        console.log("rejected after", Date.now() - timeWas, "ms");
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
/*  Example:
Dex.init()
async function run_ins(){
  out("starting")
  let the_rs = await Dex.m_joint([10, 20, 90])
  out("got rs 1: " + the_rs.measured_angles())
  await Dex.m_joint([0, 0, 0])
  out("got rs 2: " + the_rs.measured_angles())
  out("ending")
}

async function run_ins(){
  let the_rs = await Dex.m_joint([10, 0, 30])
}

Dex.m_joint_aux(10, 20, 30)

run_ins()


function print_measured_angles(){
   out(this.robot.rs.measured_angles())
}
for(let i = 1; i < 4; i++) {
    Dex.run(IO.out("i = " + i))
    Dex.m_joint([10 * i, 20 * i, 30 * i])
    Dex.run(print_measured_angles)
    Dex.m_xyz([0.1, 0.2, 0.3])
    Dex.run(print_measured_angles)
    Dex.m_joint([0, 0, 0])
    Dex.run(IO.out("done with i = " + i))
}

Dex Release Notes:

V2 nov 3, 2021
- Dex.run implemented. Can take any existing
  do_list item as an argument, including functions
- Dex.maj renamed to Dex.m_joint
    as per James W suggestion.
- Dex.mt renamed to Dex.m_xyz
    as per James W suggestion.
- Example extended to:
   - Use new names for Dex.maj and Dex.mt
   - use a user defined function
       with Dex,run to print measured angles at
       run time.

V1 nov 2, 2021
- Dex.maj implemented
- dex.mt implemented
- Initial example using them implemented.

Dex Known bugs:
- the 2 different print measured angles do
  print and do print different numbers from
  each other. The 2nd prints are consistent. (good)
  But the first prints differ from each other
  and I don't know why (bad).


var dd = new Date()
*/