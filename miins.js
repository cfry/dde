var MiIns = class MiIns {
    constructor (){
        this.superclass_name = ""
        this.instance_name   = ""
        this.class_name      = ""
        this.args_obj        = {} //arg_name, arg_val_src pairs use Object.getOwnPropertyNames(args_obj) to get an in-order list of arg names.
    }
    //__________instruction_name__________
    //An instruction_name is a string of format "Dexter.dexter0.move_all_joints", or
    //"Dexter.move_all_joints"
    //or "function", "out", etc.
    //the first part is the superclass_name, 2nd: instance_name, 3rd, class_name
    //usually the instance_name is ""
    static make_instruction_name(superclass_name="", instance_name="", class_name=""){
        let result = ""
        if(superclass_name != "") {
            result = superclass_name
            if(instance_name != "") {
                result += "." + instance_name
                if(class_name != "") { result += "." + class_name }
            }
            else if(class_name != "") { result += "." + class_name }
        }
        else if(instance_name !== ""){
            result = instance_name
            if(class_name != "") { result += "." + class_name }
        }
        else { result = class_name }
        return result
    }
    static instruction_name_to_superclass_name(instruction_name){
        let firstdot_pos = instruction_name.indexOf(".")
        if(firstdot_pos == -1) { return "" }
        else { return instruction_name.substring(0, firstdot_pos) }
    }

    static instruction_name_to_instance_name(instruction_name){
        let firstdot_pos = instruction_name.indexOf(".")
        let lastdot_pos  = instruction_name.lastIndexOf(".")
        if  (firstdot_pos == lastdot_pos) { return "" } //works even when no dot at all
        else { return instruction_name.substring(firstdot_pos + 1,  lastdot_pos)}
    }

    //given "Dexter.dexter0.move_all_joints", returns "move_all_joints"
    static instruction_name_to_class_name(instruction_name){
        let lastdot_pos = instruction_name.lastIndexOf(".")
        if(lastdot_pos == -1) { return instruction_name }
        else { return instruction_name.substring(lastdot_pos + 1) }
    }

    static instruction_name_sans_instance_name(instruction_name){
        let firstdot_pos = instruction_name.indexOf(".")
        let lastdot_pos  = instruction_name.lastIndexOf(".")
        if  (firstdot_pos == lastdot_pos) { return instruction_name } //works when no dot at all, or when no instance_name
        else {  //we have a superclass, instance AND class name
            return instruction_name.substring(0, firstdot_pos) +
                   "." +
                   instruction_name.substring(lastdot_pos + 1)
        }
    }
    static instruction_name_to_array_of_3(instruction_name){
        let arr = instruction_name.split(".")
        if      (arr.length == 0) { return ["", "", ""] }
        if      (arr.length == 1) { return ["", "", instruction_name] }
        else if (arr.length == 2) { return [arr[0], "", arr[1]] }
        else if (arr.length == 3) { return [arr[0], arr[1], arr[2]] }
        else { shouldnt("instruction_name_to_array_of_3 passed: " + instruction_name +
                       " but that has more than three path parts.")}
    }

    //returns a class object like Dexter.move_all_joints.
    //except for function, function* it return "function" or "function*"
    static instruction_name_to_class(instruction_name){
        if(instruction_name == "new Array") { return Array }
        else if (["function", "function*"].includes(instruction_name)) { return instruction_name } //nothing else in JS to represent this
        else {
            if(instruction_name.startsWith("new ")) { instruction_name = instruction_name.substring(4) }
        return value_of_path(this.instruction_name_sans_instance_name(instruction_name)) }
    }

    get_instruction_class(){
        let instruction_name = this.get_instruction_name()
        return MiIns.instruction_name_to_class(instruction_name)
    }

    get_family_class(){
        return get_class_of_instance(this)
    }

    static instruction_name_to_family_class(instruction_name){
        instruction_name = this.instruction_name_sans_instance_name(instruction_name)
        for(let subclass of MiIns.subclasses){
            if(subclass.instruction_names && subclass.instruction_names.includes(instruction_name)){
                return subclass
            }
         }
        if(instruction_name.startsWith("new ")) { return MiIns.new_family } //must be after looping thru subclasses because that catches "new Array"
        else { return MiIns }//for all the miscelaneous instruction_names
    }

    //returns boolean
    static valid_instruction_name(instruction_name){
        if(MiIns.instruction_name_in_family_class(instruction_name, MiIns.function_family)){
            return true
        }
        else if(MiIns.instruction_name_in_family_class(instruction_name, MiIns.array_family)){
            return true
        }
        else if (MiIns.instruction_name_in_family_class(instruction_name, MiIns.new_family)){
            try { let result = value_of_path(instruction_name.substring(4)) // inf instruxtion_name is "", value_of_path returns undefined, so we catch this cake of an invalid instuction_name here
                  if(result) { return true }
                  else       { return false }
            }
            catch(err) { return false }
        }
        else {
            try { let result = value_of_path(instruction_name) // inf instruxtion_name is "", value_of_path returns undefined, so we catch this cake of an invalid instuction_name here
                  if(result) { return true }
                  else       { return false }
            }
            catch(err) { return false }
        }
    }

    //returns a string ex: "Dexter.dexter0.move_all_joints
    //does not get from UI, just internal props.
    get_instruction_name(){
        return MiIns.make_instruction_name(this.superclass_name, this.instance_name, this.class_name)
    }

    //its tempting to make this an instance method on each family class
    //but that won't work because we need to check all the subclasses,
    //and, if its not in them, us MiIns. IN any case, this is a compact
    //place to stick this functionality
    //returns boolean
    static instruction_name_in_family_class(instruction_name, family_class){
          let ins_family_class = this.instruction_name_to_family_class(instruction_name)
          return ins_family_class === family_class
    }

    //The robot of the instruction. returns null or an instance of a robot
    //Assumes that the instruction and or the robot wrapper are well formed & valid.
    //Beware, calling this fn may reach into the UI.
    get_robot(){
        if((this.superclass_name == "") || (this.instance_name == "")) {
            return value_of_path(mi_job_wrapper_robot_name_id.value)
        }
        else {
            let fullname = this.superclass_name + "." + this.instance_name
            return value_of_path(fullname)
        }
    }

    //_______Make instances of MiIns

    //make instructions: only make a call_obj with its names in place, no args added
    static make_from_instruction_name_no_args(instruction_name){
        let family_class = this.instruction_name_to_family_class(instruction_name)
        let new_class_name = get_class_name(family_class)
        let new_inst = window.eval("new " + new_class_name)
        new_inst.superclass_name = this.instruction_name_to_superclass_name(instruction_name)
        new_inst.instance_name   = this.instruction_name_to_instance_name(instruction_name)
        new_inst.class_name      = this.instruction_name_to_class_name(instruction_name)
        return new_inst
    }

    static make_from_instruction_source_no_args(src) {
        let ast = MiParser.string_to_ast(src)
        let instruction_name = MiParser.extract_instruction_name_from_ast(ast)
        let call_obj = this.make_from_instruction_name_no_args(instruction_name)
        return call_obj
    }
    //below make_from methods should be obsolete.
    /*
    //called from MakeInstruction.show with src from editor
    //replaces this.instruction_src_to_call_obj(instruction_call_src)
    static make_from_instruction_source(src, use_pipeline=true) {
        let ast = MiParser.string_to_ast(src)
        let instruction_name = MiParser.extract_instruction_name_from_ast(ast)
        let call_obj = this.make_from_instruction_name(instruction_name, use_pipeline=use_pipeline)
        let miins_instance_with_args = this.make_from_instruction_source_only(src)
        call_obj.merge_in(miins_instance_with_args)
        return call_obj
    }

    static make_from_instruction_source_only_no_args(src) {
        let ast = MiParser.string_to_ast(src)
        let instruction_name = MiParser.extract_instruction_name_from_ast(ast)
        let call_obj = this.make_from_instruction_name_only_no_args(instruction_name)
        return call_obj
    }

    //returns an  instance of the proper family from src,
    //but the important thing is it has the arg_name arg_val_src pairs from src,
    //and NOT any from the instruction def defaults.
    static make_from_instruction_source_only(src){
        let ast = MiParser.string_to_ast(src)
        let instruction_name = MiParser.extract_instruction_name_from_ast(ast)
        let new_inst = this.make_from_instruction_name_only_no_args(instruction_name)
        let args_array = MiParser.extract_args_from_ast(ast, instruction_name, src, false) //does not get default arg vals from def, they are returned as undefined, on purpose
        let miins_instance_arg_holder = this.args_array_from_parser_to_miins_instance(args_array) //not used for instance_name
        new_inst.merge_in(miins_instance_arg_holder)
        return new_inst
    }



    //has no access to the full inst src so can't get args from it, by design
    //called when picking an instruction name from Instruction menu
    static make_from_instruction_name(instruction_name, use_pipeline=true){
        let result = this.make_from_instruction_name_only_no_args(instruction_name) //doesn't even get args from instruction_def
        if(use_pipeline) { result.merge_in_pipeline() }
        return result
    }

    static make_from_instruction_name_default_args_only(instruction_name){
        let miins_inst = this.make_from_instruction_name_only_no_args(instruction_name)
        miins_inst.merge_in_from_instruction_def()
        return miins_inst
    }

    static make_from_instruction_name_only_no_args(instruction_name){
        let family_class = this.instruction_name_to_family_class(instruction_name)
        let new_class_name = get_class_name(family_class)
        let new_inst = window.eval("new " + new_class_name)
        new_inst.superclass_name = this.instruction_name_to_superclass_name(instruction_name)
        new_inst.instance_name   = this.instruction_name_to_instance_name(instruction_name)
        new_inst.class_name      = this.instruction_name_to_class_name(instruction_name)
        return new_inst
    }
    */
    //________merge________
    //for all vals in miins_instance that are not equal to "",
    //set the equiv vals in "this".
    merge_in(miins_instance){
        let old_args_obj = this.args_obj
        let new_args_obj = miins_instance.args_obj
        for(let key of Object.getOwnPropertyNames(new_args_obj)){
            let miins_instance_arg_val_src = new_args_obj[key]
            if (miins_instance_arg_val_src != "") {
                old_args_obj[key] = miins_instance_arg_val_src
            }
        }
        return this
    }
    //for all prop names that are common between this and miins_instance,
    //and those vals from miins_instance that are not equasl to "",
    //set the values in this to those from miins_instance
    //used when miins_instance is special_defaults
    merge_in_only_if_already_present(miins_instance){
        let old_args_obj = this.args_obj
        let new_args_obj = miins_instance.args_obj
        for(let key of Object.getOwnPropertyNames(new_args_obj)){
            if(old_args_obj.hasOwnProperty(key)){
                let miins_instance_arg_val_src = new_args_obj[key]
                if (miins_instance_arg_val_src != "") {
                    old_args_obj[key] = miins_instance_arg_val_src
                }
            }
        }
        return this
    }

    //may be defined in subclasses. This def for "normal" fns without a family
    merge_in_from_instruction_def(){
        let instruction_name = this.get_instruction_name()
        let arg_name_val_src_pairs = function_param_names_and_defaults_array(instruction_name, true)
        for(let arg_name_val_pair of arg_name_val_src_pairs){
            let arg_name    = arg_name_val_pair[0]
            if((arg_name == "robot") &&
               (["Dexter", "Serial"].includes(this.superclass_name) ) &&
               (arg_name_val_pair == last(arg_name_val_src_pairs))) {} //skip
            else {
                let arg_val_src = arg_name_val_pair[1]
                if(arg_val_src === undefined) { arg_val_src = "" }
                this.args_obj[arg_name] = arg_val_src
            }
        }
        return this
    }

    merge_in_from_instruction_def_only_if_empty(){
        let instruction_name = this.get_instruction_name()
        let arg_name_val_src_pairs = function_param_names_and_defaults_array(instruction_name, true)
        for(let arg_name_val_pair of arg_name_val_src_pairs){
            let arg_name    = arg_name_val_pair[0]
            if((arg_name == "robot") &&
                (["Dexter", "Serial"].includes(this.superclass_name) ) &&
                (arg_name_val_pair == last(arg_name_val_src_pairs))) {} //skip
            else {
                let arg_val_src = arg_name_val_pair[1]
                if(arg_val_src === undefined) { arg_val_src = "" }
                if(this.args_obj[arg_name] == "") {
                    this.args_obj[arg_name] = arg_val_src
                }
            }
        }
        return this
    }

    merge_in_special_defaults(){
        let family_of_instruction = this.get_family_class()
        this.merge_in_only_if_already_present(family_of_instruction.special_defaults)
        return this
    }

    merge_in_prev_defaults(){
        this.merge_in_only_if_already_present(MiIns.prev_defaults)
        return this
    }

    //note, "this" SHOULD have the same instruction_name in it that src does.
    merge_in_src(src){
        //let src_call_obj = MiIns.make_from_instruction_source_no_args(src, false)
        let ast = MiParser.string_to_ast(src)
        let instruction_name = MiParser.extract_instruction_name_from_ast(ast)
        let args_array = MiParser.extract_args_from_ast(ast, instruction_name, src, false) //does not get default arg vals from def, they are returned as undefined, on purpose
        let miins_instance_arg_holder = MiIns.args_array_from_parser_to_miins_instance(args_array) //not used for instance_name
        this.merge_in(miins_instance_arg_holder)
        //this.merge_in(src_call_obj)
        return this
    }

    static args_array_from_parser_to_miins_instance(args_array){
        let arg_name_val_obj = {}
        for(let arg of args_array){
            arg_name_val_obj[arg.name] = arg.arg_val_src
        }
        let miins_instance_arg_holder = new MiIns() //we don't care about the family here, we're nust using this inst for its args
        miins_instance_arg_holder.args_obj = arg_name_val_obj
        return miins_instance_arg_holder
    }

    //used when you have an instruction name and nothing else in the call_obj.
    merge_in_pipeline(){
        return this.merge_in_from_instruction_def().
                    merge_in_special_defaults().
                    merge_in_prev_defaults()
    }
}
MiIns.special_defaults = new MiIns() //empty here but specialized for each subclass maybe


MiIns.prev_defaults     = new MiIns()   //no subclass versions of this. Only one per session. Initially all arg empty. intruction_name ignored
MiIns.instruction_names = null //only is an array of real names for (most) subfamilies



MiIns.move_all_joints_family = class move_all_joints_family extends MiIns{
    merge_in_from_instruction_def(){
        for(let j=1; j < 8; j++){
            let arg_name = "joint" + j
            let arg_val_src = "" //not "0"
            this.args_obj[arg_name] = arg_val_src
        }
        return this
    }
    merge_in_from_instruction_def_only_if_empty(){
        for(let j=1; j < 8; j++){
            let arg_name = "joint" + j
            let arg_val_src = "" //not "0"
            if(this.args_obj[arg_name] == "") {
                this.args_obj[arg_name] = arg_val_src
            }
        }
        return this
    }
    merge_in_src(src){
        //let src_call_obj = MiIns.make_from_instruction_source_no_args(src, false)
        let ast = MiParser.string_to_ast(src)
        let instruction_name = MiParser.extract_instruction_name_from_ast(ast)
        let args_array = MiParser.extract_args_from_ast(ast, instruction_name, src, false) //does not get default arg vals from def, they are returned as undefined, on purpose
        if(args_array[0] && (args_array[0].name == "...array_of_angles")){
            for(let j=1; j < 8; j++){
                let arg_name = "joint" + j
                delete this.args_obj[arg_name]
            }
            this.args_obj["...array_of_angles"] = args_array[0].arg_val_src
        }
        else {
            let miins_instance_arg_holder = MiIns.args_array_from_parser_to_miins_instance(args_array)
            this.merge_in(miins_instance_arg_holder)
        }
        return this
    }
    //errors or returns an array of 7 angles.
    get_angle_array(){
        let rob = this.get_robot() //takes the instruction instance name and job wrapper robot into account
        if (!(rob instanceof Dexter)) { dde_error("The robot for this instruction is not a Dexter.") }
        let angles = []
        for(let i = 1; i < 8; i++){
            let joint_arg_name = "joint" + i
            let joint_val_src = this.args_obj[joint_arg_name]
            let joint_val
            if(joint_val_src == "") {
                if(i > 5) { joint_val = undefined } //leave undefiend so we won't move at all
                else {  joint_val = rob.angles[i - 1] } //need the first 5 angles to do kinematics.
            }
            else {
                try { joint_val = window.eval(joint_val_src)  }
                catch(err) {
                    dde_error("When converting from angles to position, " + joint_arg_name +
                        " with source: " + joint_val_src + " errored upon eval.")
                }
                if(typeof(joint_val) != "number"){
                    dde_error("When converting from angles to position, " + joint_arg_name +
                        " with source: " + joint_val_src + " did not eval to a number: " + joint_val)
                }
                angles.push(joint_val)
            }
        }
        return angles
    }
    static make_from_instruction_name_and_angles(instruction_name="Dexter.move_all_joints", angles){
        //let robot = this.get_robot() //takes the instruction instance name and job wrapper robot into account
        let call_obj = MiIns.make_from_instruction_name_no_args(instruction_name)
        for(let i = 1; i < 8; i++){
            let arg_val = angles[i - 1]
            let arg_val_src = ((arg_val == undefined) ? "" : "" + arg_val)
            call_obj.args_obj["joint" + i] = arg_val_src //we want a string of source, not a number.
        }
        return call_obj
    }
    /*convert_from_this_to_move_to(move_to_instruction_name="Dexter.move_to"){
        let rob = this.get_robot() //takes the instruction instance name and job wrapper robot into account
        if (!(rob instanceof Dexter)) { dde_error("The robot for this instruction is not a Dexter.") }
        let new_call_obj = MiIns.make_from_instruction_name_no_args(move_to_instruction_name)
        let angles = this.get_angle_array()
        let call_obj = MiIns.make_from_instruction_name_no_args(move_to_instruction_name)
        let [xyz, J5_direction, config] = Kin.J_angles_to_xyz(angles, rob.pose)
        call_obj.args_obj.xyz            = to_source_code({value: xyz})
        call_obj.args_obj.J5_direction   = to_source_code({value: J5_direction})
        call_obj.args_obj.config         = to_source_code({value: config})
        call_obj.args_obj.workspace_pose = to_source_code({value: rob.pose})
        call_obj.args_obj.j6_angle       = to_source_code({value: angles[6 - 1]})
        call_obj.args_obj.j7_angle       = to_source_code({value: angles[7 - 1]})
    }*/
}
MiIns.move_all_joints_family.instruction_names = ["Dexter.move_all_joints", "Dexter.move_all_joints_relative", "Dexter.pid_move_all_joints"]

/* often not good to have this. let user explicitly set home position. Startup gets all zeros, but is handled specially
MiIns.move_all_joints_family.special_defaults.args_obj =
    {"...array_of_angles": ["0", "0", "0", "0", "0","0", "0"],
        joint1: "0",
        joint2: "0",
        joint3: "0",
        joint4: "0",
        joint5: "0",
        joint6: "0",
        joint7: "0"}
*/

MiIns.move_to_family = class move_to_family extends MiIns{
    merge_in(miins_instance){
        let old_args_obj = this.args_obj
        let new_args_obj = miins_instance.args_obj
        for(let new_key of Object.getOwnPropertyNames(new_args_obj)){
            if(new_key == "x") { delete old_args_obj.xyz }
            let miins_instance_arg_val_src = new_args_obj[new_key]
            if (miins_instance_arg_val_src != "") {
                old_args_obj[new_key] = miins_instance_arg_val_src
            }
        }
        //we've got this.args_obj with the right name-val pairs but
        if(old_args_obj.x){ //now the ORDERING OF THE KEYS IS WITH X,Y,Z at the bottom instead of the top. so
                            //make a new obj and order it with x,y.x at the top
          let ordered_old_args_obj = {x: old_args_obj.x, y: old_args_obj.y, z: old_args_obj.z}
          for(let old_key of Object.getOwnPropertyNames(old_args_obj)){
              let arg_val_src = old_args_obj[old_key]
              if(["x", "y", "z"].includes(old_key)) {} //ignore
              else if (arg_val_src != "") { ordered_old_args_obj[old_key] = old_args_obj[old_key] }
          }
          this.args_obj = ordered_old_args_obj
        }
        return this
    }

    //instruction_name is expected to be in the move_to family
    static make_from_instruction_name_and_angles(instruction_name="Dexter.move_to", angles, robot){
        //let robot = this.get_robot() //takes the instruction instance name and job wrapper robot into account
        if (!(robot instanceof Dexter)) { dde_error("The robot for this instruction is not a Dexter.") }
        let call_obj = MiIns.make_from_instruction_name_no_args(instruction_name)
        let [xyz, J5_direction, config] = Kin.J_angles_to_xyz(angles, robot.pose)
        call_obj.args_obj.xyz            = to_source_code({value: xyz})
        call_obj.args_obj.J5_direction   = to_source_code({value: J5_direction})
        call_obj.args_obj.config         = to_source_code({value: config})
        call_obj.args_obj.workspace_pose = to_source_code({value: robot.pose})
        let j6_angle = angles[6 - 1]
        call_obj.args_obj.j6_angle       = ((j6_angle === undefined) ? "" : to_source_code({value: j6_angle}))
        let j7_angle = angles[7 - 1]
        call_obj.args_obj.j7_angle       = ((j7_angle === undefined) ? "" : to_source_code({value: j7_angle}))
        return call_obj
    }
}
MiIns.move_to_family.instruction_names = ["Dexter.move_to", "Dexter.move_to_relative", "Dexter.move_to_straight", "Dexter.pid_move_to"]
MiIns.move_to_family.special_defaults  = new MiIns()
MiIns.move_to_family.special_defaults.args_obj =
                                   {xyz: "[0, 0.3, 0.4]",
                                    J5_direction: "[0, 0, -1]",
                                    config: "Dexter.RIGHT_UP_OUT",
                                    workspace_pose: "Vector.make_pose()",
                                    j6_angle: "[0]",
                                    j7_angle: "[0]"}

MiIns.function_family = class function_family extends MiIns{

}
MiIns.function_family.instruction_names = ["function", "function*"]



MiIns.human_family = class human_family extends MiIns{

}
MiIns.human_family.instruction_names = ["Human.enter_choice", "Human.enter_filepath",
    "Human.enter_instruction", "Human.enter_number", "Human.enter_position",
    "Human.enter_text", "Human.notify", "Human.show_window", "Human.speak", "Human.task",
    //"Human.recognize_speech",
    "Human.speak", "Human.task"]


MiIns.array_family = class array_family extends MiIns{

}
MiIns.array_family.instruction_names = ["new Array"]

MiIns.new_family = class new_family extends MiIns{

}



MiIns.serial_family = class serial_family extends MiIns{

}
MiIns.serial_family.instruction_names = ["serial_instruction"]



MiIns.subclasses = [MiIns.array_family, MiIns.function_family, MiIns.human_family,
                    MiIns.move_all_joints_family, MiIns.move_to_family,
                    MiIns.new_family, MiIns.serial_family]

var {ends_with_one_of, fn_is_keyword_fn, get_class_of_instance, replace_substrings, starts_with_one_of, trim_end} = require("./core/utils.js")