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

    static prepare_gcode(str){
        let lines = str.split("\n").trim()
        this.user_data.gcode_lines = lines
        this.user_data.gcode_pc = 0
    }

    static line_to_do_list_item(gcode_line){
        let line_tokens = gcode_line.split(" ")
        for(let token of line_tokens){
            if(token !== "") {
                let op = token[0] //ie G, M, etc.
                op = op.toUpperCase()
                if (!Utils.is_upper_case(op)) {
                    dde_error("In Gcode.line_to_do_list_item got non_upper case first letter of: " + op)
                }
                let val = token.substring(1)
                val = parseFloat(val)
                if (Number.isNaN) {
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
                this.do_it()
            }
        }
    }

    static do_it(){
        if(this.state.need_move){
            this.move_it()
            this.state.need_move = false
        }
    }

    static move_it(){
        let xyz = [this.state.X, this.state.Y, this.state.Z]
        return [ function() { Gcode.extrude()},
                 Dexter.move_to(xyz)
               ]
    }

    static extrude(){
        out("extruding: " + this.state.E + " at feedrate: " + this.state.F)
    }

    //called by Dexter.run_gcode
    static gcode_to_instructions({gcode = "",
                                  filepath = null,
                                  workspace_pose = Gcode.gcode_to_instructions_workspace_pose_default,
                                  robot=Dexter}){
        return [
            Gcode.prepare_gcode(gcode),
            Control.loop(function() { return this.user_data.gcode_pc <
                    this.user_data.gcode_lines.length
                },
                function(){
                    let gcode_line = this.user_data.gcode_lines[this.user_data.gcode_pc]
                    if(Gcode.print_gcode_line_when_run) { out(gcode_line) }
                    return Gcode.line_to_do_list_item(gcode_line)
                }
            )]

    }

}

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