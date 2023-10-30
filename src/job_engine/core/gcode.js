globalThis.Gcode = class Gcode{
    static print_gcode_line_when_run = true
    static state = {
        X: 0,
        Y: 0,
        Z: 0,
        E: 0, //extruder
        F: 0, //feedrate
        G: 0, //type or speed of move
        need_move: false, //boolean
        M: 0, //current index into M array M0=pause, M1=pause_if_enabled, M2=End program
        M_array: [], //array of variables of numbers meaning different things
        S: 0, //value for M_array elements
        need_m_update: false //boolean
    }

    static prepare_gcode(str, the_job){
        let lines = str.split("\n")
        the_job.user_data.gcode_lines = lines
        the_job.user_data.gcode_pc = 0
    }

    static line_to_do_list_item(gcode_line){
        let line_tokens = gcode_line.split(" ")
        for(let token of line_tokens){
            if(token !== "") {
                let op = token[0] //ie G, M, etc.
                op = op.toUpperCase()
                if (!Utils.is_upper_case(op)) {
                    dde_error("In Gcode.line_to_do_list_item got invalid non_upper case first letter of: " + op)
                }
                let val = token.substring(1)
                val = parseFloat(val)
                if (Number.isNaN(val)) {
                    dde_error("In Gcode.line_to_do_list_item got non-number value of: " + val)
                }
                this.state[op] = val
                let handler_function_name = "handle_" + op
                let meth = Gcode[handler_function_name]
                if (meth) {
                    meth.call(val)
                }
                if ("EFGXYZ".includes(op)) {
                    this.state.need_move = true
                }
            }
        }
        return this.do_it() //call at end of every line
    }

    static do_it(){
        if(this.state.need_move){
            let do_list_item = this.move_it()
            this.state.need_move = false
            return do_list_item
        }
    }

    static move_it(){
        let y_pos = this.state.Y
        if(y_pos === 0) {
            y_pos = 1e-10 //to avoid singularity
        }
        let xyz = [this.state.X, y_pos, this.state.Z]

        return [ function() { Gcode.extrude()},
                 Dexter.move_to(xyz)
               ]
    }

    static extrude(){
        out("extruding: " + this.state.E + " at feedrate: " + this.state.F)
    }

    //called by Dexter.run_gcode({gcode: "G1 X0 Y5 Z8" ...}
    static gcode_to_instructions({gcode = "",
                                  filepath = null,
                                  workspace_pose = Gcode.gcode_to_instructions_workspace_pose_default,
                                  robot=Dexter,
                                  the_job}){
        return [
            Gcode.prepare_gcode(gcode, the_job),
            Control.loop(function() { return the_job.user_data.gcode_pc <
                    the_job.user_data.gcode_lines.length
                },
                function(){
                    let gcode_pc = the_job.user_data.gcode_pc
                    let gcode_line = the_job.user_data.gcode_lines[gcode_pc]
                    if(Gcode.print_gcode_line_when_run) { out("Running gcode line number " + gcode_pc + " of " + gcode_line, "green") }
                    let do_list_item = Gcode.line_to_do_list_item(gcode_line)
                    the_job.user_data.gcode_pc += 1 //get ready for next iteration
                    return do_list_item
                }
            )]

    }

}
/*
new Job( { name: "my_gcode_job",
           do_list: [
            //Gcode.prepare_gcode("foo.gcode"),
            Gcode.prepare_gcode(`g0 1 2 3
                                     m107 true`),
            Control.loop(function() { return this.user_data.gcode_pc <
                    this.user_data.gcode_lines.length
                },
                function(){
                    let gcode_line = this.user_data.gcode_lines[this.user_data.gcode_pc]
                    if(Gcode.print_gcode_line_when_run) { out(gcode_line) }
                    return Gcode.line_to_do_list_item(gcode_line)
                }
            ),
            function(){ out("done")}
        ]
    }
)
*/