import http from "http"
import url from 'url'; //url parsing
import formidable from 'formidable'
import fs from 'fs'; //file system
import net from 'net'; //network
import ws from 'ws' ; //websocket
import path from 'path';
import { spawn } from 'child_process'
import ModbusRTU from "modbus-serial"
//dde4 replaced the below requires with the above imports
/*
var http = require('http'); 
var url = require('url'); //url parsing
var formidable = require('formidable');
var fs = require('fs'); //file system
var net = require('net'); //network
const ws = require('ws'); //websocket
const path = require('path'); //parse path / file / extension
*/
// https://github.com/websockets/ws 
//install with:
//npm install --save ws 
//on Dexter, if httpd.js is going to be in the /srv/samba/share/ folder, 
//install ws there but then run it from root. e.g. 
//cd /srv/samba/share/ 
//npm install --save ws 
//cd /
//node /srv/samba/share/httpd.js 

//var mime = require('mime'); //translate extensions into mime types
//skip that,it's stupidly big
var mimeTypes = {
  "css": "text/css",
  "html": "text/html",
  "gif": "image/gif",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "mp3": "audio/mpeg",
  "mp4": "video/mp4",
  "png": "image/png",
  "ico": "image/x-icon",
  "svg": "image/svg+xml",
  "txt": "text/plain"
  };

const SHARE_FOLDER = '/srv/samba/share';
const DDE_APPS_FOLDER = SHARE_FOLDER + '/dde_apps/';
const DDE_INSTALL_FOLDER = '/root/Documents/dde'; //where DDE is installed on Dexter

//const { spawn } = require('child_process'); //see top of file
 
var job_name_to_process = {};
function get_job_name_to_process(job_name) { 
     if(job_name_to_process.keep_alive) { //if there is such a process, then keep_alive is true
     	return job_name_to_process.keep_alive;
     }
     else {
        return job_name_to_process[job_name];
     }
}
function set_job_name_to_process(job_name, process) { job_name_to_process[job_name] = process }
function remove_job_name_to_process(job_name) { delete job_name_to_process[job_name] }       
        
//arg looks like "myjob.js", "myjob.dde", "myjob"
function extract_job_name(job_name_with_extension){
    /* 
    let job_name=""+job_name_with_extension
	let dot_pos = job_name.indexOf(".")
    if(dot_pos === -1) { job_name = job_name_with_extension }
    else { job_name = job_name_with_extension.substring(0, dot_pos) }
    return job_name
    */
    let ext = path.extname(job_name_with_extension);
    //console.log("extension:"+ext)
    if (ext && -1!=["dde","js"].indexOf(ext)) { //if it's a dde job
        return job_name_with_extension.slice(0,-1-ext.length); //remove the extension
    } else { //just return the full thing if it's not a dde job
      return job_name_with_extension;
    }
}

function serve_init_jobs(q, req, res){
    //console.log("top of serve_init_jobs in server")
    fs.readdir(DDE_APPS_FOLDER, 
        function(err, items){
        	console.log('\n\nAbout to stringify 1\n');
            let items_str = JSON.stringify(items);
            //console.log("serve_init_jobs writing: " + items_str)
            res.write(items_str);
            res.end();
        });
}

//https://www.npmjs.com/package/ws
console.log("now making wss");
const wss = new ws.Server({port: 3001});    //server: http_server });
console.log("done making wss: " + wss);

function serve_job_button_click(browser_socket, mess_obj){
    let app_file = mess_obj.job_name_with_extension; //includes ".js" suffix 
    console.log("\n\nserve_job_button_click for:" + app_file);
    let app_type = path.extname(app_file);
    if (-1!=[".dde",".js"].indexOf(app_type)) { app_type = ".dde" }//if this is a job engine job
    let jobfile = app_file;
    if (!app_file.startsWith("/")) jobfile = DDE_APPS_FOLDER + app_file; //q.search.substr(1)
    //console.log("serve_job_button_click with jobfile: " + jobfile)
    let job_name = extract_job_name(app_file); //console.log("job_name: " + job_name + "taken from file name")
    let job_process = get_job_name_to_process(app_file); //warning: might be undefined.
    //let server_response = res //to help close over
    if(!job_process){
        //https://nodejs.org/api/child_process.html
        //https://blog.cloudboost.io/node-js-child-process-spawn-178eaaf8e1f9
        let cmd_line = "bash";
        let cmd_args = [mess_obj.args || "-i"]; //if they didn't give us a -c <command> then do an interactive session
        let cmd_options = {cwd: SHARE_FOLDER, shell: true};
        if (".dde"==app_type) { //if this is a job engine job
            cmd_line = 'node'; //then we run node
            cmd_args = ["core define_and_start_job " + jobfile]; //tell it to start the job
            cmd_options = {cwd: DDE_INSTALL_FOLDER, shell: true};
        }
        job_process = spawn(cmd_line,
                            cmd_args,
                            cmd_options
                            
                           );
        set_job_name_to_process(app_file, job_process);
        console.log("started job_name: " + job_name + " with:"+cmd_line+" "+cmd_args+" to new process: " + job_process.pid + " of type:" + app_type);
        job_process.stdout.on('data', function(data) {
          console.log("\n\nserver: stdout.on data got data: " + data + "\n");
          let data_str = data.toString();
          //server_response.write(data_str) //pipe straight through to calling browser's handle_stdout
          //https://github.com/expressjs/compression/issues/56 sez call flush even though it isn't documented.
          //server_response.flushHeaders() //flush is deprecated.
          if (browser_socket.readyState != ws.OPEN) {job_process.kill(); return;} //maybe should be kill()?
          browser_socket.send(data_str);
	     });
        if (".dde"==app_type) {  
            job_process.stderr.on('data', function(data) {
                console.log("\n\njob: " + job_name + " got stderr with data: " + data);
                //remove_job_name_to_process(job_name) //just because there is an error, that don't mean the job closed.
                //server_response.write("Job." + job_name + " errored with: " + data)
                console.log('\n\nAbout to stringify 2\n');
                let lit_obj = {job_name: job_name,
                             kind: "show_job_button",
                             button_tooltip: "Server errored with: " + data, 
                             button_color: "red"};
                if (browser_socket.readyState != ws.OPEN) {job_process.kill(); return;} //maybe should be kill()?
                browser_socket.send("<for_server>" + JSON.stringify(lit_obj) + "</for_server>");
                //server_response.end()
                });
        } else {
            job_process.stderr.on('data', function(data) {
                console.log("\n\njob: " + job_name + " got stderr with data: " + data);
                if (browser_socket.readyState != ws.OPEN) {job_process.kill(); return;} //maybe should be kill()?
                browser_socket.send(data.toString());
                });
            
        }
        job_process.on('close', function(code) {
          console.log("\n\nServer closed the process of Job: " + job_name + " with code: " + code);
          if(code !== 0 && browser_socket.readyState === ws.OPEN){
          	console.log('\n\nAbout to stringify 3\n');
          	let lit_obj = {job_name: job_name, 
                           kind: "show_job_button",
                           button_tooltip: "Errored with server close error code: " + code,
                           button_color: "red"
              	};
          	browser_socket.send("<for_server>" + JSON.stringify(lit_obj) + "</for_server>");
          }
          remove_job_name_to_process(job_name);
          //server_response.end()
          });
        }
    else {
    	let code;
        if(job_name === "keep_alive") { //happens when transition from keep_alive box checked to unchecked
        	code = "set_keep_alive_value(" + mess_obj.keep_alive_value + ")\n";
        } else if (".dde" == app_type) { //job engine job
          //code = "Job." + job_name + ".server_job_button_click()"
          //e.g. `web_socket.send(JSON.stringify({"job_name_with_extension": "dexter_message_interface.dde", "ws_message": "goodbye" }))`
            if (mess_obj.ws_message ) { // {"job_name_with_extension": jobname.dde, "ws_message": data}
              //code = 'Job.'+job_name+'.user_data.ws_message = "' + mess_obj.ws_message  + '"'
              code = `Job.`+job_name+`.user_data.ws_message = '` + JSON.stringify(mess_obj.ws_message)  + `'\n`;
              }
            else if (mess_obj.code) {
              code = mess_obj.code + "\n";
            }
            else {
              code = 'Job.maybe_define_and_server_job_button_click("' + jobfile + '")\n';
              }
        } else { // something else, probably bash
            code = mess_obj.ws_message  + "\n";
        }
        console.log("serve_job_button_click writing to job: " + job_name + " stdin: " + code);
        //https://stackoverflow.com/questions/13230370/nodejs-child-process-write-to-stdin-from-an-already-initialised-process
        job_process.stdin.setEncoding('utf-8');
        job_process.stdin.write(code);
        //job_process.stdin.end(); 
    }
    //serve_get_refresh(q, req, res)
    //return serve_jobs(q, req, res)  //res.end()
}

//see bottom of je_and_browser_code.js: submit_window for
//the properties of mess_obj
function serve_show_window_call_callback(browser_socket, mess_obj){
    let callback_arg = mess_obj.callback_arg
    let job_name = callback_arg.job_name
    let job_process = get_job_name_to_process(job_name)
    console.log("\n\nserve_show_window_call_callback got job_name: " + job_name + " and its process: " + job_process)
    console.log('\n\nAbout to stringify 4\n');
    let code = mess_obj.callback_fn_name + "(" +
               JSON.stringify(callback_arg) + ")"
    //code = mess_obj.callback_fn_name + '({"is_submit": false})' //out('short str')" //just for testing
    console.log("serve_show_window_call_callback made code: " + code)
    job_process.stdin.setEncoding('utf-8');
    job_process.stdin.write(code + "\n") //need the newline so that stdio.js readline will be called
}

function serve_file(q, req, res){
	//var filename = SHARE_FOLDER + "/www/" + q.pathname  //this is in orig dexter file, but replaced for  dde4 with server laptop by the below 3 lines
    let maybe_slash = (q.pathname.startsWith("/") ? "" : "/")
    let cur_dir = process.cwd()
    let filename = cur_dir + maybe_slash +  q.pathname


    console.log("serving" + q.pathname)
    fs.readFile(filename, function(err, data) {
        if (err) { console.log(filename, "not found")
            res.writeHead(404, {'Content-Type': 'text/html'})
            return res.end("404 Not Found")
        }  
        res.setHeader('Access-Control-Allow-Origin', '*');
        let mimeType = mimeTypes[ q.pathname.split(".").pop() ] || "application/octet-stream"
        console.log("Content-Type:", mimeType)
        res.setHeader("Content-Type", mimeType);
        res.writeHead(200)
        res.write(data)
        return res.end()
    })
}

function isBinary(byte) { //must use numbers, not strings to compare. ' ' is 32
  if (byte >= 32 && byte < 128) {return false} //between space and ~
  if ([13, 10, 9].includes(byte)) { return false } //or text ctrl chars
  return true
}

//standard web server on port 80 to serve files
var http_server = http.createServer(function (req, res) {
  //see https://nodejs.org/api/http.html#http_class_http_incomingmessage 
  //for the format of q. 
  var q = url.parse(req.url, true)
  console.log("web server passed pathname: " + q.pathname)
  if (q.pathname === "/") {
      q.pathname = "index.html"
  }
  if (q.pathname === "/init_jobs") {
      serve_init_jobs(q, req, res)
  }
  else if (q.pathname === "/edit" && q.query.list ) { 
    let listpath = q.query.list
    console.log("File list:"+listpath)
    fs.readdir(listpath, {withFileTypes: true}, 
      function(err, items){ //console.log("file:" + JSON.stringify(items))
        let dir = []
        if (q.query.list != "/") { //not at root
          let now = new Date()
          dir.push({name: "..", size: "", type: "dir", date: now.getTime()})
          }
        for (i in items) { //console.log("file:", JSON.stringify(items[i]))
          if (items[i].isFile()) { 
            let size = "unknown"
            let permissions = "unknown"
            let stats = {size: "unknown"}
            try { //console.log("file:", listpath + items[i].name)
              stats = fs.statSync(listpath + items[i].name)
              size = stats["size"]
              date = stats["mtimeMs"]
              permissions = (stats.mode & parseInt('777', 8)).toString(8)
            } catch (e) {console.log("couldn't stat "+items[i].name+":"+e) }
            dir.push({name: items[i].name, size: size, type: "file", permissions: permissions, date: date})
            } //size is used to see if the file is too big to edit.
          else if (items[i].isDirectory()) {
            dir.push({name: items[i].name, size: "", type: "dir"})
            } //directories are not currently supported. 
          }
        console.log('\n\nAbout to stringify 5\n');
        res.write(JSON.stringify(dir))
        res.end()
      })
    }
  else if (q.pathname === "/edit" && q.query.edit || q.query.download) { 
    let filename = q.query.edit || q.query.download
    console.log("serving" + filename)
    fs.readFile(filename, function(err, data) {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/html'})
            return res.end("404 Not Found "+err)
        }
        let stats = fs.statSync(filename)
        console.log(("permissions:" + (stats.mode & parseInt('777', 8)).toString(8)))
        let line = 0;
        for (let i = 0; i < data.length; i++) { 
            if (10==data[i]) line++
            if ( isBinary(data[i]) ) { console.log("binary data:" + data[i] + " at:" + i + " line:" + line)
                res.setHeader("Content-Type", "application/octet-stream")
                break
                }
            }
        if (q.query.download) 
            res.setHeader("Content-Disposition", "attachment; filename=\""+path.basename(filename)+"\"")
        res.writeHead(200)
        res.write(data)
        return res.end()
      })
    }
    else if (q.pathname === "/edit" && req.method == 'DELETE' ) { //console.log("edit delete:"+JSON.stringify(req.headers))
      const form = formidable({ multiples: true });
      form.parse(req, (err, fields, files) => { //console.log(JSON.stringify({ fields, files }, null, 2) +'\n'+ err)
        console.log("delete:"+fields.path+"!")
        try {fs.unlinkSync(fields.path)} catch(e) {res.writeHead(400); return res.end(e)}
        return res.end('ok'); 
      });
      return
      }
    else if (q.pathname === "/edit" && req.method == 'POST' ) { //console.log("edit post headers:",req.headers)
        const form = formidable({ multiples: false });
        form.once('error', console.error);
        const DEFAULT_PERMISSIONS = parseInt('644', 8)
        var stats = {mode: DEFAULT_PERMISSIONS}
        form.on('file', function (filename, file) {  //console.log("edit post file:",file)
          topathfile = file.name
          try { console.log("copy", file.path, "to", topathfile)
            stats = fs.statSync(topathfile) 
            console.log(("had permissions:" + (stats.mode & parseInt('777', 8)).toString(8)))
          } catch {} //no biggy if that didn't work
          topath = topathfile.split('/').slice(0,-1).join('/')+'/'
          try { console.log(`make folder:${topath}.`)
            fs.mkdirSync(topath, {recursive:true})
          } catch(err) { console.log(`Can't make folder:${topath}.`, err)
            res.writeHead(400)
            return res.end(`Can't make folder ${topath}:`, err)
          }
          fs.copyFile(file.path, topathfile, function(err) {
            let new_mode = undefined
            if (err) { console.log("copy failed:", err)
              res.writeHead(400)
              return res.end("Failed")
              }
            else {
              fs.chmodSync(topathfile, stats.mode)
              try { //sync ok because we will recheck the actual file
                let new_stats = fs.statSync(topathfile)
                new_mode = new_stats.mode
                console.log(("has permissions:" + (new_mode & parseInt('777', 8)).toString(8)))
              } catch {} //if it fails, new_mode will still be undefined
              if (stats.mode != new_mode) { //console.log("permssions wrong")
                //res.writeHead(400) //no point?
                return res.end("Permissions error")
                }
              fs.unlink(file.path, function(err) {
                if (err) console.log(file.path, 'not cleaned up', err);
                }); 
              res.end('ok');
              }
            }) //done w/ copyFile
          });
        form.parse(req)
        return
        //res.end('ok');
      // });
      }
      else if (q.pathname === "/edit" && req.method == 'PUT' ) { console.log('edit put')
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => { //console.log('fields:', fields);
          let pathfile = fields.path
          newpath = pathfile.split('/').slice(0,-1).join('/')+'/'
          try { console.log(`make folder:${newpath}.`)
            fs.mkdirSync(newpath, {recursive:true})
          } catch(err) { console.log(`Can't make folder:${newpath}.`, err)
            res.writeHead(400)
            return res.end(`Can't make folder ${newpath}:`, err)
          }
          if (pathfile.slice(-1)!="/") { //if it wasn't just an empty folder
              fs.writeFile(pathfile, "", function (err) { console.log('create' + pathfile)
                if (err) {console.log("failed", err)
                  res.writeHead(400)
                  return res.end("Failed:" + err)
                  }
               }); 
             }
            res.end('ok'); //console.log('done');
          });
        }
      //else if(q.pathname === "/job_button_click") {
  //	  serve_job_button_click(q, req, res)
  //}
  //else if(q.pathname === "/show_window_button_click") {
  //	  serve_show_window_button_click(q, req, res)
  //} 
  else {
  	  serve_file(q, req, res)
  }
})

http_server.listen(80)
console.log("listening on port 80")

/* orig james N code
function jobs(q, res){
 console.log("serving job list")
    fs.readdir("/srv/samba/share/dde_apps/", function(err, items) {
      if (err) {
        console.log("ERROR:"+err)
        res.writeHead(500, {'Content-Type': 'text/html'})
        return res.end("500 Error")
        }
      res.writeHead(200, {'Content-Type': 'text'})
      for (var i=0; i<items.length; i++) {
        res.write(items[i]+"\n")
        }
      return res.end()
      })
    return
}
*/


// ModBus client server
//const ModbusRTU = require("modbus-serial"); //see above
var modbus_reg = []

function modbus_startjob(job_name) {
	console.log(job_name)
	let jobfile = DDE_APPS_FOLDER + job_name + ".dde"
	let job_process = get_job_name_to_process(job_name)
	if(!job_process){
	    console.log("spawning " + jobfile)
	    //https://nodejs.org/api/child_process.html
	    //https://blog.cloudboost.io/node-js-child-process-spawn-178eaaf8e1f9
	    //a jobfile than ends in "/keep_alive" is handled specially in core/index.js
	    job_process = spawn('node',
		["core define_and_start_job " + jobfile],   
		{cwd: DDE_INSTALL_FOLDER, shell: true}
		)
	    set_job_name_to_process(job_name, job_process)
	    console.log("Spawned " + DDE_APPS_FOLDER + job_name + ".dde as process id " + job_process)
	    job_process.stdout.on('data', function(data) {
		console.log("\n\n" + job_name + ">'" + data + "'\n")
		let data_str = data.toString()
		if (data_str.substr(0,7) == "modbus:") { //expecting 'modbus: 4, 123' or something like that
		    [addr, value] = data_str.substr(7).split(",").map(x => parseInt(x) || 0)
		    modbus_reg[addr] = value
		//TODO: Change this to something that allows multiple values to be set in one out.
		    }
		})
	 
	    job_process.stderr.on('data', function(data) {
	  	console.log("\n\n" + job_name + "!>'" + data + "'\n")
		//remove_job_name_to_process(job_name) //error doesn't mean end.
		})
	    job_process.on('close', function(code) {
		console.log("\n\nJob: " + job_name + ".dde closed with code: " + code)
		//if(code !== 0){  } //who do we tell if a job crashed?
		remove_job_name_to_process(job_name)
		})
	    }
	else {
	    console.log("\n" + job_name + " already running as process " + job_process)
	    } //finished with !job_process
	}

var vector = {
    //TODO: Figure out what to return as inputs.
    // Possible: Values from a file? 
    // e.g. modbus.json has an array where jobs can store data to be read out here.
    // maybe that is the modbus_reg array as a json file?
    getInputRegister: function(addr) { //doesn't get triggered by QModMaster for some reason.
	//This does work mbpoll -1 -p 8502 -r 2 -t 3 192.168.0.142 
        console.log("read input", addr)
        return addr; //just sample data
        },
    getMultipleInputRegisters: function(startAddr, length) {
        console.log("read inputs from", startAddr, "for", length); 
        var values = [];
        for (var i = startAddr; i < length; i++) {
            values[i] = startAddr + i; //just sample return data
            }
        return values;
        },
    getHoldingRegister: function(addr) {
        let value = modbus_reg[addr] || 0
        console.log("read register", addr, "is", value)
        return value 
        },
    getMultipleHoldingRegisters: function(startAddr, length) {
        console.log("read registers from", startAddr, "for", length); 
        let values = []
        for (var i = 0; i < length; i++) {
            values[i] = modbus_reg[i] || 0
            }
        return values
        },
    setRegister: function(addr, value) { 
        console.log("set register", addr, "to", value) 
        modbus_reg[addr] = value
        return
        },
    getCoil: function(addr) { //return 0 or 1 only.
        let value = ((addr % 2) === 0) //just sample return data
        console.log("read coil", addr, "is", value)
        return value 
        //TODO Return the status of the job modbuscoil<addr>.dde
        // e.g. 1 if it's running, 0 if it's not.
        },
    setCoil: function(addr, value) { //gets true or false as a value.
        console.log("set coil", addr, " ", value)
	if (value) { modbus_startjob("modbus" + addr) }
	else { console.log("stop") }
        //TODO Start or kill job modbuscoil<addr>.dde depending on <value>
        // Maybe pass in with modbus_reg as a user_data? or they can access the file?
        return; 
        },
    readDeviceIdentification: function(addr) {
        return {
            0x00: "HaddingtonDynamics",
            0x01: "Dexter",
            0x02: "1.1",
            0x05: "HDI",
            0x97: "MyExtendedObject1",
            0xAB: "MyExtendedObject2"
        };
    }
};

// set the server to answer for modbus requests
console.log("ModbusTCP listening on modbus://0.0.0.0:8502");
var serverTCP = new ModbusRTU.ServerTCP(vector, { host: "0.0.0.0", port: 8502, debug: true, unitID: 1 });

serverTCP.on("initialized", function() {
    console.log("initialized");
});

serverTCP.on("socketError", function(err) {
    console.error(err);
    serverTCP.close(closed);
});

function closed() {
    console.log("server closed");
}


// Web Socket Proxy to DexRun raw socket
wss.on('connection', function(the_ws, req) {
  console.log("\n\nwss got connection: " + the_ws)
  console.log("\nwss SAME AS the_ws : " + (wss === the_ws))
  let browser_socket = the_ws //the_socket used when stdout from job engine comes to the web server process
  the_ws.on('message', function(message) {
    console.log('\n\nwss server on message received: %s', message);
    //the_ws.send("server sent this to browser in response to: " + message)
    console.log('\n\nAbout to parse 1\n');
    let mess_obj = {kind: "error"}
    try { mess_obj = JSON.parse(message)} catch(e) {console.log("bad message: "+e); return;}
    console.log("\nwss server on message receieved kind: " + mess_obj.kind)
    if(mess_obj.kind === "keep_alive_click") {
        serve_job_button_click(browser_socket, mess_obj)
    }
    else if(mess_obj.kind === "job_button_click") {
    	serve_job_button_click(browser_socket, mess_obj)
    }
    else if(mess_obj.kind === "show_window_call_callback"){
        serve_show_window_call_callback(browser_socket, mess_obj)
    }
    else {
      console.log("\n\nwss server received message kind: " + mess_obj.kind)
      serve_job_button_click(browser_socket, mess_obj)
    }
  })
  the_ws.send('websocket connected.\n')
})



//websocket server that connects to Dexter
//socket server to accept websockets from the browser on port 3000
//and forward them out to DexRun as a raw socket
var browser = new ws.Server({ port:3000 })
var bs 
var dexter = new net.Socket()
//don't open the socket yet, because Dexter only allows 1 socket connection
dexter.connected = false //track socket status (doesn't ws do this?)

browser.on('connection', function connection(socket, req) {
  console.log(process.hrtime()[1], " browser connected ", req.connection.Server);
  bs = socket
  socket.on('message', function (data) {
    console.log(process.hrtime()[1], " browser says ", data.toString());
    //Now as a client, open a raw socket to DexRun on localhost
    if (!dexter.connected && !dexter.connecting) { 
      dexter.connect(50000, "127.0.0.1") 
      console.log("dexter connect")
      dexter.on("connect", function () { 
        dexter.connected = true 
        console.log("dexter connected")
        dexter.write(data.toString());
        } )
      dexter.on("data", function (data){
        //console.log(process.hrtime()[1], " dexter says ", data)
        //for(let i = 0; i<8*4; i+=4) {console.log(i, data[i])}
        console.log(process.hrtime()[1], " dexter says ","#"+data[1*4]+" op:"+String.fromCharCode(data[4*4]) + " len: " + data.length)
        if (data[5*4]) {console.log("error:"+data[5*4])}
        if (bs) {
            bs.send(data,{ binary: true })
            console.log(process.hrtime()[1], " sent to browser ")
            }
        })
      dexter.on("close", function () { 
        dexter.connected = false 
        console.log("dexter disconnect")
        dexter.removeAllListeners() 
        //or multiple connect/data/close events next time
        } )
      dexter.on("end", function (error) { 
        dexter.connected = false 
        console.log("dexter ended")
        //dexter.removeAllListeners() 
        if (error) {
            console.log(error)
            }
        dexter.end()
        dexter.destroy()
        //or multiple connect/data/close events next time
        } )
      dexter.on("error", function () {
        dexter.connected = false 
        console.log("dexter error")
        if (bs) { bs.send(null,{ binary: true }) }
        dexter.removeAllListeners() 
        dexter.destroy()
        } )
      } //TODO: Should this be an else? When re-connecting, messages are sent twice.
    else {//already connected.
      dexter.write(data.toString());
      }
    });
  socket.on('close', function (data) {
    console.log(process.hrtime()[1], " browser disconnected ");
    bs = null
    //dexter.close() //not defined.
    dexter.end()
    });
  });


//test to see if we can get a status update from DexRun
//dexter.write("1 1 1 undefined g ;")

