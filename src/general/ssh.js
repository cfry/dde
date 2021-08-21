/* New arch, aug 21, 2019
 the output of a cmd in the stream is bounded by:
 the cmd itself, and the ssh_eof string.
 run_command callback takes 2 args,
   1. the cmd string, and
   2. the data string that excludes the cmd and the ssh_eof string.
 The default callback dumps the output to
 Output pane. with special processing for SSH.show_dir_cmd cmds
 that get put in a table, with clickable elements.
 */
//const { clipboard } = require('electron')
import {Readable} from "../../node_modules/stream/index.js"
//import fs from "../../node_modules/fs" // Use node filesystem
import * as ssh2_client from "../../node_modules/ssh2/lib/client.js"

export var SSH = class SSH {
    //not passing in a command will fundamentally default to ls -l, but there's a complex wrapper around it for the default case.
    static run_command({command=null, computer=null, computer_name=null, username=null, password=null, callback=SSH.format_output}={}){
        if(computer){
            if(computer instanceof Dexter) {
                computer_name = "Dexter." + computer.name //must be before computer = computer.ip_address
                computer = computer.ip_address
                if (!username) { username = "root" }
                if(!password)  { password = "klg" }
            }
            else if(computer == "dde_computer") {
                computer = "127.0.0.1"
                computer_name = "dde_computer"
            }
            if (computer != this.config.host) {
                this.close_connection() //will force to init the ssh connection
                this.config.host = computer
            }
        }
        if(computer_name) { this.config.the_host_name = computer_name }
        if(username)      { this.config.username = username }
        if(password)      { this.config.password = password }
        if (!this.config.host) {
            this.config.host = Dexter.dexter0.ip_address
            this.config.the_host_name = "Dexter.dexter0"
            this.config.username = "root"
            this.config.password = "klg"
        }
        if(!this.config.username)   { this.config.username = "root" }
        if(!this.config.password)   { this.config.password = "klg" }
        if(this.config.host == "127.0.0.1") { this.config.the_host_name = "dde_computer" }
        else {
            for(let dex_name of Dexter.all_names) {
                let full_dexter_name = "Dexter." + dex_name
                let rob = value_of_path(full_dexter_name)
                if(rob && rob.ip_address == this.config.host) {
                    this.config.the_host_name = full_dexter_name
                    break;
                }
            }
        }
        if(!this.dir_for_ls){
            if(this.config.the_host_name && this.config.the_host_name.startsWith("Dexter.")) {
                   this.dir_for_ls = "/srv/samba/share"
            }
            else { this.dir_for_ls = "/" }
        }
        if(this.config.the_host_name &&
           this.config.the_host_name.startsWith("Dexter.") &&
            simulate_radio_false_id.checked === false){
            simulate_radio_false_id.checked = true
            persistent_set("default_dexter_simulate", false) //must do!
            warning("In order to use SSH to a dexter computer,<br/>the 'real' button in the Misc pane header must be checked.<br/>It has been switched to checked.")
        }
        if (!command){
            command = "cd " + this.dir_for_ls + ";" + SSH.show_dir_cmd
        }
        //at this point computer, username and password are filled in.
        //the_host_name *might* not be filled in, and that's ok
        command = replace_substrings(command, "ApOsTrOpHe", "'")
        if(command.endsWith("\n")) { command = command.substring(0, command.length - 1) } //cut off the ending newline
        this.current_cmd = command //current_cmd has no echo eof, and no new line on end.
        command = SSH.bof_cmd + ";" +
                  command +
                  (command.endsWith(";") ? "" : ";") +
                  SSH.eof_cmd + ";\n"
        this.init_maybe_and_write(command, callback)
    }
    static make_ls_elt_id(){
        let result = "DirectoryListing" + replace_substrings(SSH.config.host, "\\.", "_")
        return result + "_id"
    }

    static out_str_contains_complete_command_output(){
        let echo_pos   = this.out_str.indexOf(SSH.bof_special_string)
        if (echo_pos == -1) { return false }
        else {
            let actual_pos = this.out_str.indexOf(SSH.eof_special_string, echo_pos + SSH.bof_special_string.length) //AVOID THE echo pos
            return (actual_pos != -1)
        }
    }
    static out_str_contains_error(){
        if (this.out_str.indexOf("Permission denied") != -1)             { return "Permission denied" }
        else if (this.out_str.indexOf("No such file or directory") != -1){ return "No such file or directory" }
        else { return false }
    }

    //either errors or connects
    static init_maybe_and_write(command, callback){
       if(!this.Client){
            this.Client = ssh2_client //require('ssh2').Client
       }
       if(!this.conn) {
           this.close_connection()
           this.conn = new this.Client()
           this.conn.on('ready', function() {
               let the_callback = callback
               //out("top of conn.on ready")
               SSH.conn.shell(function(err, stream) {
                   if (err) {
                      //throw err;
                      dde_error("Unable to connect SSH to host: " + SSH.config.host + ", with username: " + SSH.config.username + "<br/>because: " + err.message)
                   }
                   stream.on('close', function() {
                       out('Stream :: close');
                       SSH.close_connection()
                   })
                   stream.on('data', function(data) {
                       let new_data_string = "" + data //for debugging
                       SSH.out_str += new_data_string
                       SSH.remove_ansi_codes()
                       let error_string = SSH.out_str_contains_error()
                       if(error_string){
                           SSH.out_str = ""
                           //dde_error("Permission denied executing: " + SSH.current_cmd) //screws up the ssh session
                           SSH.output_to_output_pane("<span style='color:red;'>" + error_string + "</span>")
                       }
                       else if(SSH.out_str_contains_complete_command_output()){ //got full output from running cmd
                                let data = SSH.clean_output()
                                let result = the_callback.call(SSH,
                                                            SSH.current_cmd, //can't be command as that only works on initial cmd
                                                            data)
                       }
                   });
                   stream.on('end', () => {
                       out('ssh_stream end: has no more data.')
                   })
                   stream.on('finish', () => {
                       out('ssh_stream finish: has no more data.')
                   })
                   stream.on('error', (err) => {
                       out('ssh_stream error: ' + err.message)
                   })
                   SSH.stream = stream
                   out('<b>SSH ready on ' + SSH.conn.config.host + "</b>");
                   //stream.end('ls -l \nexit\n');
               })
               SSH.wait_or_write(command)
           })
           this.conn.on('error', function(err) {
               dde_error("Unable to connect SSH to <br/>host: " + SSH.config.host + "<br/>with username: " + SSH.config.username + "<br/>because: " + err.message)
           })
       }
       if(this.stream) {
           SSH.wait_or_write(command)
       }
       else {
           //if(this.conn) { this.conn.end() } //stop the old connection
           this.stream = null
           try { this.conn.connect(this.config) }
           catch(err){
               let un = this.config.username
               let pa = this.config.password
               dde_error("Could not connect to host: " + this.config.host +
                   "<br/>with username: "              + this.config.username +
                   "<br/>and password: "               + this.config.password +
                   "<br/>" + err.message)
           }
       }
   }
   static output_to_output_pane(some_html){
       let cmd_src = this.current_cmd.trim()
       if(cmd_src.endsWith(this.eof_cmd)){
            cmd_src = cmd_src.substring(0, cmd_src.length - this.eof_cmd.length)
       }
       out_eval_result(some_html,
                       "#4001c4", //deep purple
                       cmd_src,
                       "The result of SSH command")

   }
   static close_connection(){
       if(this.conn) { this.conn.end() }
       this.conn   = null  //automatically set to null by close, but to be safe.
       this.stream = null //automatically set to null by close, but to be safe.
       this.out_str = ""
       this.dir_for_ls = null
   }
   static wait_or_write(command, tries=0){
       if (command.includes("copy_local_to_remote")){ //we won't get here unless current ssh conn is to remote (dexter) host
           //https://ourcodeworld.com/articles/read/133/how-to-create-a-sftp-client-with-node-js-ssh2-in-electron-framework
           this.copy_local_to_remote(command)
       }
       else if (command.includes("copy_remote_to_local")){
           this.copy_remote_to_local(command)
       }
       else if (command.includes("save_editor_to_remote")){
           this.save_editor_to_remote(command)
       }
       else if(this.stream && this.stream.writable) {
           setTimeout(function() { SSH.write(command) }, 200) //give a little extra time for
           //init of the connection as well as for previous cmd output to be sent to the stream
       }
       else if (tries > 5) {
           if(cmd_lang_id) { cmd_lang_id.value = "JS" }
           dde_error("Could not connect to computer at: " + this.config.host +
                    "<br/>with user: " + this.config.username +
                    "<br/>and password: " + this.config.password)
       }
       else {
           setTimeout(function(){ SSH.wait_or_write(command, tries + 1)}, 200)
       }
   }
   //full_command looks like 'junk cmd_name "first arg" second_arg;junk'
   //where each arg might or might not have surrounding double quotes,
   //and if it does, that arg is allowed to have spaces in it, otherwise
   //space delimits args.
   //semicolon is an optional end of full_command. If not present, end of string is end of full_command.
   static extract_cmd_args(cmd_name, full_command){
       let end_of_cmd_name_pos = full_command.indexOf(cmd_name) + cmd_name.length
       let cmd_args_str = full_command.substring(end_of_cmd_name_pos)
       let semicolon_pos = cmd_args_str.indexOf(";")
       if(semicolon_pos != -1) {
           cmd_args_str = cmd_args_str.substring(0, semicolon_pos)
       }
       cmd_args_str = cmd_args_str.trim()
       let args = []
       let cur_arg = ""
       let in_arg = false
       let cur_arg_delimiter = " "
       for(let char of cmd_args_str){
         if(char == '"'){
             if(in_arg){
                if(cur_arg_delimiter == char) { //found end of cur arg
                    args.push(cur_arg)
                    cur_arg_delimiter = " "
                    in_arg = false
                    cur_arg = ""
                }
                else {
                    dde_error("While parsing command input args, got a double_quote where it wasn't expected:<br/>" +
                               cmd_args_str)
                }
             }
             else { //beginning of a double quoted arg
                 cur_arg_delimiter = char
                 cur_arg = ""
                 in_arg = true
             }
         }
         else if (char == " ") {
             if(in_arg){
                 if(cur_arg_delimiter == char) { //found end of cur arg
                     args.push(cur_arg)
                     cur_arg_delimiter = " "
                     in_arg = false
                     cur_arg = ""
                 }
                 else {
                     dde_error("While parsing command input args, got a space where it wasn't expected:<br/>" +
                         cmd_args_str)
                 }
             }
             else { //beginning of a new space-delimited arg
                 in_arg = true
                 cur_arg_delimiter = " "
                 cur_arg = ""
             }
         }
         else {
             in_arg = true //could be the first char of a space-delimited arg.
             cur_arg += char
         }
       }
       if (in_arg && (cur_arg.length > 0)){
           if (cur_arg_delimiter == " ") { args.push(cur_arg) }
           else {dde_error("While parsing command input args, got end of command without a closing double quote:<br/>" +
                            cmd_args_str)}
       }
       return args
   }

   static copy_local_to_remote (command){
       if(this.logged_in_to_localhost()){
           warning("Your SSH session is logged in to the localhost (dde_computer).<br/>" +
                   "To copy files between a local and a remote (Dexter) computer,<br/>" +
                   "you must first SSH log in to the remote computer by:<br/>" +
                   "clicking the underlined text after 'Directory Listing for:' or<br/>" +
                   "choosing the cmd line lang menu item of 'JS', then choose 'SSH'.")
       }
       else {
           let args = this.extract_cmd_args("copy_local_to_remote", command)
           let moveFrom = args[0] //local path
           let moveTo   = args[1] //remote path
           let semicolon_pos = moveTo.indexOf(";")
           if(semicolon_pos != -1) {
               moveTo = moveTo.substring(0, semicolon_pos)
           }
           this.conn.sftp(function(err, sftp) {
               if (err){
                   dde_error("Copying dde_computer:" + moveFrom + " to " + SSH.config.the_host_name + ":" + moveTo + "<br/>" +
                       "errored with: " + err.message)
               }
               else {
                    try{
                       let readStream = fs.createReadStream(moveFrom);
                       let writeStream = sftp.createWriteStream(moveTo);
                       writeStream.on('close',function () {
                           out("dde_computer:" + moveFrom + "<br/>copied to<br/>" + SSH.config.the_host_name + ":" + moveTo)
                       });
                       writeStream.on('end', function () {
                           console.log( "sftp done" );
                           //conn.close();
                       });
                       // initiate transfer of file
                       readStream.pipe(writeStream)
                    }
                    catch(err){
                        dde_error("Copying dde_computer:" + moveFrom + "<br/>to<br/> " + SSH.config.the_host_name + ":" + moveTo + "<br/>" +
                                  "errored with: " + err.message)
                    }
               }
           })
       }
   }
   static copy_remote_to_local(command){
        if(this.logged_in_to_localhost()){
            warning("Your SSH session is logged in to the localhost (dde_computer).<br/>" +
                "To copy files between a remote (Dexter) and a local computer,<br/>" +
                "you must first SSH log in to the remote computer by:<br/>" +
                "clicking the underlined text after 'Directory Listing for:' or<br/>" +
                "choosing the cmd line lang menu item of 'JS', then choose 'SSH'.")
        }
        else {
            let args = this.extract_cmd_args("copy_remote_to_local", command)
            let moveFrom = args[0] //remote path
            let moveTo   = args[1] //local path
            let semicolon_pos = moveTo.indexOf(";")
            if(semicolon_pos != -1) {
                moveTo = moveTo.substring(0, semicolon_pos)
            }
            this.conn.sftp(function(err, sftp) {
                if (err) {
                    dde_error("Copying " + SSH.config.the_host_name + ":" + moveFrom + " to dde_computer:" + moveTo + "<br/>" +
                        "errored with: " + err.message)
                }
                else {
                    try{
                        let readStream = sftp.createReadStream(moveFrom);
                        let writeStream = fs.createWriteStream(moveTo);
                        writeStream.on('close',function () {
                            out(SSH.config.the_host_name + ":" + moveFrom + "<br/>copied to<br/>dde_computer:" + moveTo)

                        });
                        writeStream.on('end', function () {
                            console.log( "sftp done" );
                            //conn.close();
                        });
                        // initiate transfer of file
                        readStream.pipe(writeStream)
                    }
                    catch(err){
                       dde_error("Copying " + SSH.config.the_host_name + ":" + moveFrom + "<br/>to<br/>dde_computer:" + moveTo + "<br/>" +
                                 "errored with: " + err.message)
                    }
                }
            })
        }
   }
   //very similar to copy_local_to_remote
   static save_editor_to_remote (command){
        if(this.logged_in_to_localhost()){
            warning("Your SSH session is logged in to the localhost (dde_computer).<br/>" +
                "To copy files between a local and a remote (Dexter) computer,<br/>" +
                "you must first SSH log in to the remote computer by:<br/>" +
                "clicking the underlined text after 'Directory Listing for:' or<br/>" +
                "choosing the cmd line lang menu item of 'JS', then choose 'SSH'.")
        }
        else {
            let args = this.extract_cmd_args("save_editor_to_remote", command)
            let moveTo   = args[0] //remote path
            let semicolon_pos = moveTo.indexOf(";")
            if(semicolon_pos != -1) {
                moveTo = moveTo.substring(0, semicolon_pos)
            }
            this.conn.sftp(function(err, sftp) {
                if (err){
                    dde_error("Saving editor content to " + SSH.config.the_host_name + ":" + moveTo + "<br/>" +
                        "errored with: " + err.message)
                }
                else {
                    try{ //from https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js
                        let readStream = new Readable();
                        readStream._read = () => {}; // redundant? see update below
                        let editor_content = Editor.get_javascript()
                        readStream.push(editor_content);
                        readStream.push(null); //must do to signify end of stream
                        let writeStream = sftp.createWriteStream(moveTo);
                        writeStream.on('close',function () {
                            out("Saved editor content to: " + SSH.config.the_host_name + ":" + moveTo)
                        });
                        writeStream.on('end', function () {
                            console.log( "sftp done" ); //doesn't come to dde computer
                            //conn.close();
                        });
                        // initiate transfer of file
                        readStream.pipe(writeStream)
                    }
                    catch(err){
                        dde_error("Saving editor content to<br/> " + SSH.config.the_host_name + ":" + moveTo + "<br/>" +
                            "errored with: " + err.message)
                    }
                }
            })
        }
    }
   static write(command){
        this.stream.write(command)
   }
   static dir_list_id(){
       return "DirectoryListing" + replace_substrings(SSH.config.host, "\\.", "_")
   }

   //warning: clears only the text below the LAST dir listing, not necessarily
   //below the dir listing that the button "clear below output" is in.
   //hard to do otherwise.
   /*static clear_below_outout(event){
       let full_innerHTML =  output_div_id.innerHTML
       let last_pos = full_innerHTML.lastIndexOf("Directory Listing for")
       let fieldset_pos = full_innerHTML.indexOf("</fieldset>", last_pos)
       let next_div_pos = full_innerHTML.indexOf("<div", fieldset_pos)
       let new_out_HTML = full_innerHTML.substring(0, next_div_pos)
       output_div_id.innerHTML = new_out_HTML
   }*/
   //clears output below the selected dir listing regardless of if its the first or not.
    static clear_below_outout(event){
        let fieldset_elt = event.target.parentElement.parentElement.parentElement
        let output_div_children = new Array(...output_div_id.childNodes)
        let after_fieldset_elt = false
        for(let child_elt of output_div_children){
            if(child_elt === fieldset_elt) { after_fieldset_elt = true }
            else if(after_fieldset_elt) { output_div_id.removeChild(child_elt) }
        }
    }

    //called by close button AND by the "computer A tag action, SSH.close_and_show_config_dialog
   static dir_list_close_action(elt){
       //let the_id = this.inner_dir_list_id()
       elt.parentNode.parentNode.removeChild(elt.parentNode)
   }

    //don't include backspaces and the char BEFORE them.
    //this gets rid of the "double_chars" problem that man pages use for bold
    //which is char \b char  (where "char" is the same char)
    //and gets rid of the "all underscores" problem when man pages tries to underline a char
    //via _ \b char
    //We solve both problems by not including the backspace char AND the char before a backspace.
    static remove_bold_and_underlined_chars_from_man_page(){
        //onsole.log("got backspace")
        let sans_backspace_str = ""
        let prev_was_backspace = false
        let prev_char = null
        for(let char of SSH.out_str){
            //onsole.log(char + char.charCodeAt())
            if(char == "\b") {prev_char = null} //don't include the backspace or the char before it
            else {
                if (prev_char) {
                    sans_backspace_str += prev_char
                }
                prev_char = char
            }
        }
        if (prev_char) { sans_backspace_str += prev_char }
        SSH.out_str = sans_backspace_str
    }

    //extracts and returns data from out_str, then
    //sets out_str to its remainder after the actual data for the cmd
   /*static clean_output(){
       SSH.out_str = replace_substrings(SSH.out_str, "[01;34m", "",      false)
       SSH.out_str = replace_substrings(SSH.out_str, "[0m",     "",      false)
       SSH.out_str = replace_substrings(SSH.out_str, String.fromCharCode(13), "", false) //CR chars
       if(SSH.out_str.includes("\b") &&
          (this.current_cmd.startsWith("man ") ||
           this.current_cmd.includes(";man "))){ //at least one backspace, so copy whole str, removing backspace and the following char to get rid of double letters in man panges.
           this.remove_bold_and_underlined_chars_from_man_page()
       }
       let data_start_pos = SSH.out_str.indexOf(SSH.current_cmd)
       if (data_start_pos != -1) {
           data_start_pos += SSH.current_cmd.length
       }
       else {
           shouldnt("In SSH.clean_output, couldn't find the commanded:<br/>" +
                     SSH.current_cmd +
                    "<br/>in the output:<br/>" + SSH.out_str)
       }
       //data_start_pos += 1 //skip over semicolon
       if(SSH.out_str.startsWith(SSH.eof_cmd, data_start_pos)) {
           data_start_pos += SSH.eof_cmd.length
       }
       else if(SSH.out_str.startsWith(SSH.eof_cmd, data_start_pos + 1)) { //sometimes the shell inserts a space between the semiconon and the echo
       //this gets rid of prompt no matter what it is, and the cmd itself
           data_start_pos += SSH.eof_cmd.length + 1
       }
       else if(SSH.out_str.startsWith(SSH.eof_cmd, data_start_pos + 2)) { //sometimes the shell inserts a space between the semicolon and the echo
           //this gets rid of prompt no matter what it is, and the cmd itself
           data_start_pos += SSH.eof_cmd.length + 2
       }
       else {
           shouldnt("In SSH.clean_output, couldn't find: " + SSH.eof_cmd +
               "<br/>in<br/>" + SSH.out_str)
       }
       let data_end_pos = SSH.out_str.indexOf(SSH.eof_special_string, data_start_pos) //bypass the echo EoC_86
       let data = SSH.out_str.substring(data_start_pos, data_end_pos)
       let start_of_out_beyond_this_cmd = data_end_pos + SSH.eof_special_string.length
       if (SSH.out_str.length > start_of_out_beyond_this_cmd) {
           start_of_out_beyond_this_cmd += 1 //cut off newline after SSH.eof_special_string
       }
       SSH.out_str = SSH.out_str.substring(start_of_out_beyond_this_cmd)
        //or the residual prompt. The +1 is for the new line at the end.
       return data
   }*/
   //https://en.wikipedia.org/wiki/ANSI_escape_code
   //terminal esc sequences used for coloring letters start with ESC[  and end with m
   //between those are digits and a semicolon separting integers.
   static remove_ansi_codes(){
       let esc_char = "\x1B"  //"\x1B".charCodeAt() => 27
       let esc_prefix = esc_char + "["
       let in_esc_sequence = false
       if(this.out_str.includes(esc_prefix)){
            let result = ""
            let prev_char = null
            for(let char of this.out_str){
                if(prev_char == null) {} //first char only
                else if(prev_char == esc_char){
                    if(char == "[") {
                        in_esc_sequence = true //remove prev_char
                    }
                    else { result += prev_char }
                }
                else if(in_esc_sequence){
                    if(prev_char == "m") {
                        in_esc_sequence = false
                    }
                    else {} //remove prev_char
                }
                else { result += prev_char }
                prev_char = char
            }
            if(!in_esc_sequence) { result += prev_char }
            this.out_str = result
       }
   }
    //this new version avoids looking at SSH.current_cmd because that string is
    //not reliably in the output stream (esp from Dexter).
    //this algorithm just grabs the next delimited data in SSH.out_str
    static clean_output(){   //uniz uses LF 10, but windows uses 2 chars 13, 10 (CR, LF
                             // ESC[number;number;numberm  (ends with "m")
        //SSH.out_str = replace_substrings(SSH.out_str, "\x1B[01;34m", "",      false)
        //SSH.out_str = replace_substrings(SSH.out_str, "\x1B[0m",     "",      false)
        SSH.out_str = replace_substrings(SSH.out_str, String.fromCharCode(13), "", false) //CR chars
        //warning: the above must be above the below because in the sshH.eof cmd,
        //unix mangles it when printing it onto the stream by inserting a
        // \r (13) after the mangled space it inserts after the echo "$ " .
        this.remove_ansi_codes()
        if(SSH.out_str.includes("\b") &&
            (this.current_cmd.startsWith("man ") ||
                this.current_cmd.includes(";man "))){ //at least one backspace, so copy whole str, removing backspace and the following char to get rid of double letters in man panges.
            this.remove_bold_and_underlined_chars_from_man_page()
        }
        let data_start_pos
        if (SSH.out_str.includes(SSH.bof_special_string)) {
            data_start_pos = SSH.out_str.indexOf(SSH.bof_special_string)
            data_start_pos = data_start_pos + SSH.bof_special_string.length + 1 //the +1 is for the return on the end
        }
        else {
            shouldnt("In SSH.clean_output, couldn't find:<br/>" +
                SSH.eof_cmd +
                "<br/>in the output:<br/>" + SSH.out_str)
        }
        let data_end_pos = SSH.out_str.indexOf(SSH.eof_special_string, data_start_pos) //bypass the eof_special_string
        let data = SSH.out_str.substring(data_start_pos, data_end_pos)
        let start_of_out_beyond_this_cmd = data_end_pos + SSH.eof_special_string.length
        if (SSH.out_str.length > start_of_out_beyond_this_cmd) {
            start_of_out_beyond_this_cmd += 1 //cut off newline after SSH.eof_special_string
        }
        SSH.out_str = SSH.out_str.substring(start_of_out_beyond_this_cmd)
        //or the residual prompt. The +1 is for the new line at the end.
        return data
    }
   //don't use "this" in body, use SSH because this is called with no subject.
   //the result of this fn isn't used, except for debugging
   static format_output(command, data){
        if((command == SSH.show_dir_cmd) ||
            (command.startsWith("cd ") && command.endsWith(SSH.show_dir_cmd))){ //we've got a show_dir_cmd ie pwd;ls -l
            return SSH.handle_show_dir_cmd(command, data)
        }
        else if (command.startsWith(this.edit_file_cmd)) {
            return SSH.handle_edit_file_cmd(command, data)
        }
        else {
            let html_result  = replace_substrings(data, "\n", "<br/>", false)
            SSH.output_to_output_pane(html_result)
            return data
        }
   }
   //returns false if we know we're not done with the ls
   static handle_show_dir_cmd(command, data){
       let result
       let lines = data.split("\n")
       if (!data.includes("total ") && (lines.length < 3) && (lines[1] == "")) { //its an empty dir
           lines[1] = "total 0"
       }
       let saw_total = false
       for(let i = 0; i < lines.length; i++){ //first 3 lines aren't dir listing. Last line isn't either
           let line = lines[i].trim()
           if(line.length == 0) { continue; }
           else if (line.startsWith("total ")){
                saw_total = true
                this.dir_for_ls = lines[i - 1] //the whole prev line should be exactly the dir.
                let dir_for_html = `<a title='Browse the root directory.' href='#' onclick='SSH.run_command({command:"cd /;` + SSH.show_dir_cmd +
                                   `"})'>&nbsp;/</a> &nbsp;`
                if (this.dir_for_ls != "/") {
                   let dir_buildup_for_show = ""
                   for(let dirname_for_show of this.dir_for_ls.split("/")){ //still underline the last one even though we're already viewing it as the user might want to "refresh"
                       if(dirname_for_show.length > 0){ //will not be true on first iteration because dir_for_ls starts with slash
                           dir_buildup_for_show += "/" + dirname_for_show
                           let dir_buildup_for_action = "ApOsTrOpHe" + dir_buildup_for_show + "ApOsTrOpHe"
                           let dirname_html = `<a title='Browse the ` + dir_buildup_for_show + ` directory.' href='#' onclick='SSH.run_command({command:"cd ` + dir_buildup_for_action + `;` + SSH.show_dir_cmd +
                                              `"})'>` + dirname_for_show +  `</a>`
                           dir_for_html += dirname_html + " / "
                       }
                   }
               }
               //result = "<div id='" + this.inner_dir_list_id() + "' style='margin:0px;padding:0px;'>
               result = "" //"<button style='float:right;' onclick='" + this.dir_list_close_action() + "'>close</button><br/>"
               let computer_html = "<a href='#' title='Choose a different computer for SSH.' onclick='SSH.close_and_show_config_dialog(event)'>" + (this.config.the_host_name ? this.config.the_host_name : this.config.host) + "</a>"
               result += "Directory Listing for: " + computer_html + ":" + dir_for_html + ""
               result += "<button style='float:right;padding:2px;' onclick='SSH.dir_list_close_action(this)'>close</button>"
               result += "<button style='float:right;padding:2px;margin-right:10px;' onclick='SSH.clear_below_outout(event)' title='Remove the text below this directory listing.'>clear below output</button>"
               result += "<br/><table style='margin-top:5px'>"
               result += "<tr><th>Permissions</th><th>Links</th><th>Owner</th><th>Group</th><th>Size</th><th>Month</th><th>Day</th><th>Year</th><th>FileName</th></tr>"
               continue
           }
           else if(!saw_total)  { continue; }
           let fields = line.split(/\s+/)
           if (fields < 8) { return false } //since we page only a partial field, we can't
                                            //be done with the whole dir listing.
           let is_dir = false
           let suffix_field = null
           for(let f = 0; f <= 8; f++) {
               let field_for_show   = fields[f].trim()
               if(f == 0) { is_dir = field_for_show.startsWith("d") }
               if(f == 8) { //the file name, which might have spaces in it so collect all the other items in fields
                   for(let j = 9; j < fields.length; j++){
                       let subfield = fields[j]
                       if(subfield == "->") { //start of suffix_field. This is a "link". We're done collecting the file_name or dir_name proper
                           suffix_field = "->"
                       }
                       else if(suffix_field) {//ongoing suffix_field
                           suffix_field += (" " + subfield)
                       }
                       else { //usual case. No suffix_field, just 2nd thru nth parts of a name with embedded spaces
                           field_for_show   += " " + fields[j]
                       }
                   }
                   let action
                     //when this.dir_for_ls == "/", we have to be careful NOT to add an extra slash.
                   let field_for_action = this.dir_for_ls + (this.dir_for_ls.endsWith("/") ? "" : "/") + field_for_show
                   if(is_dir){ //can't use single-quotes in the below because I will have them in field if it contains spaces
                       if(field_for_action.includes(" ")) {
                           field_for_action = "ApOsTrOpHe" + field_for_action + "ApOsTrOpHe"
                       }
                       action = `SSH.run_command({command:"cd ` + field_for_action + `;` + SSH.show_dir_cmd + `"})`
                   }
                   else { //presume we have an editable file
                       action = `SSH.run_command({command:"` + SSH.edit_file_cmd + field_for_action + `;"})`
                   }
                   let title = (is_dir? "Click to browse this directory." : "Click to edit this file.")
                   let menu_html = (is_dir? this.dir_menu_html(this.dir_for_ls, field_for_show) :
                                            this.file_menu_html(this.dir_for_ls, field_for_show))
                   field_for_show = menu_html +
                                    `<a title="` + title + `" href="#" onclick='` + action + `'>` + field_for_show + `</a>` + (is_dir? "/" : "")
                   //quote strategy: the whole onclick attribute val is surrounded by single quotes
                   //inside that the string (1st) arg to SSH.run_command is surrounded by double quotes.
                   //inside that, file names with spaces are surrounded by escaped single quotes.
               } //end of field 8 (last real field
               result += "<td>" + field_for_show + "</td>"
           }
           if(suffix_field) { result += "<td>" + suffix_field + "</td>" }
           result += "</tr>"
       }
       if (saw_total) {
            result += "</table>"
            let id = SSH.make_ls_elt_id()
            let elt = value_of_path(id)
            result = "<div id='" + id + "'>" + result + "</div>"
            if(elt) {
               let let_par = elt.parentNode
               let_par.innerHTML = result
            }
            else { //first time with this id
               SSH.output_to_output_pane(result)
            }
            return result
       }
       else { //failed to parse into a table so just return string
           result = replace_substrings(data, "\n", "<br/>", false)
           SSH.output_to_output_pane(result)
           return data
       }
   }
   static handle_edit_file_cmd(command, data){
        let path_name      = command.substring(SSH.edit_file_cmd.length, command.length - 1) //full path with dir and file name
        let first_newline  = data.indexOf("\n")
        //let second_newline = data.indexOf("\n", first_newline + 1)
        let file_content   = data.substring(first_newline + 1)
        if(this.config.host != "127.0.0.1"){
            if(this.config.the_host_name){
                path_name = this.config.the_host_name + ":" + path_name //works for Dexter host names but probably not others
            }
            else {
                path_name = this.config.host + ":" + path_name  //probably won't work when you try to save the file, but
                //at least you should be able to view the file
            }
        }
        Editor.edit_file(path_name, file_content)
   }
    static insert_path_in_command_line(path){
        let existing_cmd = cmd_input_id.value
        let open_square_pos  = existing_cmd.indexOf("[")
        let close_square_pos = existing_cmd.indexOf("]", open_square_pos)
        let new_cmd
        if((open_square_pos != -1) && (close_square_pos != -1)){
            new_cmd = existing_cmd.substring(0, open_square_pos) +
                path +
                existing_cmd.substring(close_square_pos + 1)
        }
        else {
            new_cmd = existing_cmd.trim()
            if(!new_cmd.endsWith(" ")) {
                new_cmd += " "
            }
            new_cmd += path
        }
        cmd_input_id.value = new_cmd
    }
    //dir is really all but the last dir, and file is really the "last dir".
    static dir_menu_html(dir, file){
        return `<select data-dir="`  + dir  +  '" ' +
                     ` data-file="` + file + '" ' +
                     ` onchange="SSH.handle_dir_menu(event)" title="operations on this directory." style="width:15px;margin-right:10px;">
                      <option>Directory Operations</option>
                      <option title="Change the permissions 'mode' of the directory.&#13;chmod 777 foo&#13;means all user groups can&#13;read, write & access files in foo&#13;Edit and hit ENTER on cmd line to run.">Change directory permissions...</option>
                      <option>Copy path to clipboard</option>
                      <option title="Inserts path of this directory&#13;at the end of the cmd line,&#13;but if there's [some text], replace it.">Insert path in cmd line</option>
                      <option title="Inserts just the path of&#13;this file into the editor,&#13;not its contents.">>Insert path in editor</option>
                      <option title="Puts the 'mv' cmd in the command line&#13;and permits you to edit it&#13;before pressing ENTER.">Move or rename directory...</option>
                      <option title="Deletes the directory and its contents,&#13;including all its sub-directories.&#13;Press ENTER to permanently remove the directory.">Remove directory...</option>          
               </select>`
    }

    static file_menu_html(dir, file){
       return `<select data-dir="` + dir +  '" ' +
                    ` data-file="` + file + '" ' +
                    ` onchange="SSH.handle_file_menu(event)" title="operations on this file." style="width:15px;margin-right:10px;">
                      <option>File Operations</option>
                      <option title="Change the permissions 'mode' of the file.&#13;chmod 777 foo.txt means all user groups can&#13;read, write & execute foo.txt&#13;Edit and hit ENTER on cmd line to run.">Change file permissions...</option>
                      <option title="Only works if you are SSH logged in&#13;to a remote (Dexter) computer.">Copy file: local to remote...</option>
                      <option title="Only works if you are SSH logged in&#13;to a remote (Dexter) computer.">Copy file: remote to local...</option>
                      <option>Copy path to clipboard</option>
                      <option title="Inserts path of this file&#13;at the end of the cmd line,&#13;but if there's [some text], replace it.">Insert path in cmd line</option>
                      <option title="Inserts just the path of&#13;this file into the editor,&#13;not its contents.">Insert path in editor</option>
                      <option title="Puts the 'mv' cmd in the command line&#13;and permits you to edit it&#13;before pressing ENTER.">Move or rename file...</option>
                      <option title="Puts the cmd for deleting a file in the Cmd Line.&#13;Press ENTER to permanently remove the file.">Remove file...</option>
                      <option title="Run the first Job defined in this file&#13;in the Job Engine on Dexter.">Run & start Job</option>
                      <option title="Save the content of the editor&#13;into a file on Dexter.">Save editor to remote...</option>                           

                      <option title="Prints the file's content in the output pane.">Show file content</option>                           
               </select>`
    }
    static handle_dir_menu(event){
        event.stopPropagation()
        let elt  = event.target
        let op   = elt.value
        let dir  = elt.dataset.dir
        let file = elt.dataset.file
        let path = dir + ((dir == "/") ? "" : "/") + file
        if     (op == "Change directory permissions...")       { cmd_input_id.value = "chmod 777 " + path + ";stat " + path
                                                                 cmd_input_id.focus()
                                                               }
        //else if(op == "Copy directory to local directory..."){ cmd_input_id.value = "cp -R " + path + " " + dir + "/[new dir name]" }
        //else if(op == "Copy directory to remote directory..."){ cmd_input_id.value = "scp -r " + path + " root@" + Dexter.dexter0.ip_address + ":/[new dir name]" }
        else if(op == "Copy path to clipboard")                { clipboard.writeText(path)}
        else if(op == "Insert path in cmd line")               { this.insert_path_in_command_line(path) }
        else if(op == "Insert path in editor")                 { Editor.insert(path) }
        else if(op == "Move or rename directory...")           { cmd_input_id.value = "mv " + path + " " + path
                                                                 cmd_input_id.focus()
                                                               }
        else if(op == "Remove directory...")                   {
            let mess = "On " + (this.config.the_host_name ? this.config.the_host_name : this.config.host) +
                       ",\ndelete  " + path + "  ?"
            if(confirm(mess)){ SSH.run_command({command: "rm -rf " + path}) }
        }
        elt.options[0].selected = true //select the "header" for the menu
    }
    static handle_file_menu(event){
       event.stopPropagation()
       let elt  = event.target
       let op   = elt.value
       let dir  = elt.dataset.dir
       let file = elt.dataset.file
       let path =  dir + ((dir == "/") ? "" : "/") + file
       out(op)
        if     (op == "Change file permissions...")   { cmd_input_id.value = "chmod 777 " + path + ";stat " + path}
        else if(op == "Copy file: local to remote..."){
            open_doc(ssh_copying_files_doc_id)
            cmd_input_id.value = "copy_local_to_remote /[file to copy]" + " " + path
            cmd_input_id.setSelectionRange(21, 36)
            cmd_input_id.focus()
        }
        else if(op == "Copy file: remote to local..."){
            open_doc(ssh_copying_files_doc_id)
            cmd_input_id.value = "copy_remote_to_local " + path + " " + "/[new file name]"
            let val_len = cmd_input_id.value.length
            let sel_start = val_len - 16
            cmd_input_id.setSelectionRange(sel_start, val_len)
            cmd_input_id.focus()
        }
        else if(op == "Copy path to clipboard")       { clipboard.writeText(path)}
        else if(op == "Insert path in cmd line")      { this.insert_path_in_command_line(path) }
        else if(op == "Insert path in editor")        { Editor.insert(path) }
        else if(op == "Move or rename file...")       { cmd_input_id.value = "mv " + path + " " + path
                                                        cmd_input_id.focus()
                                                      }
        else if(op == "Remove file...")               {
            let mess = "On " + (this.config.the_host_name ? this.config.the_host_name : this.config.host) +
                ",\ndelete  " + path + "  ?"
            if(confirm(mess)){ SSH.run_command({command: "rm -f " + path}) }
        }
        else if(op == "Run & start Job") {
           let path_of_core = ((SSH.config.host == "127.0.0.1") ? __dirname + "/core" :
                                                                 "/root/Documents/dde/core")
           let cmd = "node " + path_of_core + " define_and_start_job " + path
           cmd_input_id.value = cmd
           SSH.run_command({command: cmd})
       }
       else if (op == "Save editor to remote..."){
            cmd_input_id.value = "save_editor_to_remote " + path
            cmd_input_id.focus()
       }
       else if (op == "Show file content"){ SSH.run_command({command: "cat " + path}) }
       elt.options[0].selected = true //select the "header" for the menu
    }

    static is_config_complete(){
        if(SSH.config){
            return (SSH.config.host && SSH.config.username && SSH.config.password)
        }
        else { return false }
    }
    static set_default_config(){
        SSH.config = {host: Dexter.dexter0.ip_address,
                      username: "root",
                      password: "klg",
                      the_host_name: 'Dexter.dexter0'}
    }
    static close_and_show_config_dialog(event){
        let elt = event.target
        this.dir_list_close_action(elt)
        this.show_config_dialog()
    }
    static logged_in_to_localhost(){
        if(SSH.config){ return SSH.config.host == "127.0.0.1" }
        else          { return false }
    }
    static show_config_dialog(){
        if(!this.is_config_complete()) {
            this.set_default_config()
        }
        let computer_choices = []
        for(let dex_name of Dexter.all_names){
            computer_choices.push("Dexter." + dex_name)
        }
        computer_choices.push("dde_computer")
        let computer_choices_options_html = ""
        for(let comp of computer_choices) {
            computer_choices_options_html += "<option>" + comp + "</option>"
        }
        show_window({title: "Enter SSH login information",
                     content:
`Connect to the below computer.<br/>
This info only stored for this DDE session.<br/>
Computer:  &nbsp;<div id="ssh_computer_id" class="combo_box" style="display:inline-block;">` +
computer_choices_options_html +
`</div><br/>
User Name: <input id="ssh_auth_dialog_user_name_id" style="font-size:16px;"/><br/>
Password: &nbsp;&nbsp;<input id="ssh_auth_dialog_pas_id" type="` +
(persistent_get("ssh_show_password")? "text": "password") +
`" style="font-size:16px;"/><p/>
Show password? <input type="checkbox"  id="ssh_auth_dialog_show_pas_id" ` +
(persistent_get("ssh_show_password")? "checked": "") +
` data-onchange='true'/><p/>
<center> <input type="submit" value="Cancel"/>
<input id="ssh_auth_dialog_ok_id" style="font-size:14px;margin-left:30px;" type="submit" value="OK"/>
`,
                     width:340,
                     height:250,
                     callback: ssh_show_config_dialog_handler
        })
        setTimeout(function(){
            //$("#ssh_computer_id").jqxComboBox({source: computer_choices, width: '200px', height: '25px'})
            let host_combo_box_string = (SSH.config.the_host_name ? SSH.config.the_host_name : SSH.config.host)
            if (SSH.logged_in_to_localhost()) {
                host_combo_box_string = "dde_computer"
            }
            $("#ssh_computer_id").jqxComboBox('val', host_combo_box_string);
            ssh_auth_dialog_user_name_id.value = SSH.config.username
            ssh_auth_dialog_pas_id.value       = SSH.config.password
            $('#ssh_computer_id').on('change', function (event){
                let args = event.args;
                if (args) {
                    // index represents the item's index.
                    let item = args.item;
                    let value = item.value;
                    if (value.startsWith("Dexter.")){
                        ssh_auth_dialog_user_name_id.value = "root"
                        ssh_auth_dialog_pas_id.value       = "klg"
                    }
                    ssh_auth_dialog_user_name_id.focus()
                    ssh_auth_dialog_user_name_id.select()
                }})
            ssh_auth_dialog_user_name_id.focus()
            $("#ssh_auth_dialog_pas_id").on("keyup", function(event){ //output pane  type in
                if(event.keyCode == 13){
                    ssh_auth_dialog_ok_id.click()
                }
            })
            }, 200)
    }
} //end SSH class

function ssh_show_config_dialog_handler(vals){
    if(vals.clicked_button_value == "ssh_auth_dialog_show_pas_id"){
        if(vals.ssh_auth_dialog_show_pas_id) {
            ssh_auth_dialog_pas_id.type = "text"
            persistent_set("ssh_show_password", true)
        }
        else {
            ssh_auth_dialog_pas_id.type = "password"
            persistent_set("ssh_show_password", false)
        }
    }
    else if(vals.clicked_button_value == "ssh_auth_dialog_ok_id"){
        let comp_orig = vals.ssh_computer_id   //$("#ssh_computer_id").jqxComboBox('val') when you submit, the dialog box goes away before show_window handler is called so the element and its id are no longer available.
        let comp = comp_orig
        let un   = vals.ssh_auth_dialog_user_name_id
        let pa   = vals.ssh_auth_dialog_pas_id
        if(comp && (comp.length > 0) &&
           un   && (un.length > 0) &&
           pa   && (pa.length > 0)){
            if(comp.startsWith("Dexter.")) {
                comp = value_of_path(comp)
                if(!comp){
                    warning("SSH not started because " + comp_orig + " is not a defined dexter.")
                    cmd_lang_id.value = "JS"
                    cmd_input_id.placeholder = "Type in JS & hit the Enter key to eval"
                    return
                }
            }
            SSH.close_connection() //prepare for init for the new computer.
            //cleared for take-off
            cmd_menu_id.style.display = "inline-block"
            cmd_input_id.value = SSH.show_dir_cmd
            setTimeout(function() {SSH.run_command({computer: comp, username: un, password: pa})}, //let the command default to SSH.show_dir_cmd
                       300) //give the close_connection above a chance to complete.
        }
        else {
            warning("SSH not started because no username and/or password was provided.")
            cmd_lang_id.value = "JS"
        }
    }
    else if(vals.clicked_button_value == "Cancel"){
        cmd_lang_id.value = "JS"
    }
}


SSH.config  = null // {host: "192.168.1.142", username: "root", password: "klg", the_host_name: "Dexter.dexter0'}
SSH.stream  = null
SSH.conn    = null
SSH.out_str = ""
SSH.show_dir_cmd  = "pwd;ls -l"
SSH.edit_file_cmd = "pwd;cat "
SSH.bof_special_string = "BoC_84"
SSH.bof_cmd            = 'echo $"BoC"$"_84"'
SSH.eof_special_string = "EoC_86"
SSH.eof_cmd            = 'echo $"EoC"$"_86"' //so that the beginning string (baxh src) of an output will be different from the ending string. // SSH.eof_special_string
SSH.eof_cmd_mangled_by_unix = 'echo $" EoC"$"_86"'
SSH.current_cmd
SSH.dir_for_ls
