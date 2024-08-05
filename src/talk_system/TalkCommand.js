globalThis.TalkCommand = class TalkCommand {
    constructor({
                    name, // (prose name ie cmd_norm), //Can have spaces. auto replace > one space with one space,
                          //warn user if doing this. Use Utils.trim_all(name)
                    alternate_names = [],
                    parameters = [], //array of instances of parameter
                    action_function = "TalkCommand.default_action_function", //called with Talk as this, and one arg: aCAT
                    //last defined app.
                    mode = Utils.last(TalkMode.modes),       //defaults to last defined mode that had a mode, or if none,
                    //last defined mode
                    row,
                    //"new" means start a new row.
                    //expect define_command to be evaled IN ORDER,
                    //so mostly you rearrange the source code in the file to
                    //change an item's location in the menu.
                    pos_in_row,
                    tooltip="Click to run this command.",
                    should_display=true //(was cmd_display)can be fn to eval which returns a boolean
                           //or a string like "Talk.display_start_recording" & call that fn.
                }) {
        this.name = name //may have spaces in it. old name: cmd_norm
        this.name_with_underscores = name.replaceAll(" ", '_"')
        this.alternate_names = alternate_names
        this.parameters = parameters
        this.action_function = action_function
        this.mode = mode
        if(!row){
            if(mode.commands.length === 0) {
                row = 0
            }
            else {
                row = Utils.last(mode.commands).row
            }
        }
        this.row = row
        if(!pos_in_row){
            if(mode.commands.length === 0) {
                pos_in_row = 0
            }
            else {
                pos_in_row = Utils.last(mode.commands).pos_in_row + 1
            }
        }
        this.pos_in_row = pos_in_row
        if(!tooltip) {
            tooltip = "Run the " + name + " command."
        }
        this.tooltip = tooltip
        this.should_display = should_display
        mode.commands.push(this)
    }

    display_prose(){
        return Utils.capitalize(this.name)
    }

    parameter_names(){
        let result = []
        for(let parameter of this.parameters){
            result.push(parameter.name)
        }
        return result
    }

    parameter_name_to_parameter(parameter_name){
        for(let parameter of this.parameters){
            if(parameter.name === parameter_name){
                return parameter
            }
        }
        return false
    }

     call_action_function(aCAT){
        let af = this.action_function
         if(typeof(af) === "string"){
             af = TalkCommand[af]
         }
         if(typeof(af) !== "function"){
             shouldnt("The action_function for command: " + this.action_function +
                 " is: " +  this.action_function +
                 "<br/>which is not a valid function.")
         }
         else { af.call(Talk, aCAT) }
     }

    static default_action_function(content_obj) {
        dde_error("TalkCommand action_function not yet implemented.")
    }

    static remove_command(cmd_instance){

    }


}



/*
alias [orig_app_name, orig_mode, orig_cmd_name]
If given, don't give a params arg or an action_function args.
If you give a tooltip, it will override the orig tooltip.
    this functionality, "alias" is useful as a top level cmd,
    but also as a persistent def.
    Maybe not worth the work. Just have a  Talk.define_command call
that copies the action_function and params from the original.

 */
