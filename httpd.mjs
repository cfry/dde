
import http      from "http"
import https     from "https"
import url       from 'url'; //url parsing
import pkg       from 'formidable'; //I have formidable v 2. see https://stackoverflow.com/questions/65368903/node-formidable-why-does-require-work-but-import-does-not
const formidable = pkg;

import fs        from 'fs'; //file system
import net       from 'net'; //network
// debugger;
//import ws from 'ws';
// debugger;
//const {WebSocket, WebSocketServer} = ws;
//debugger;
//import {WebSocket, WebSocketServer} from 'ws'; //websocket //dde4 added curlies around ws to fix bug_in_import
//debugger;
//import WebSocket from 'ws';
//WebSocketServer = WebSocket.Server
//const WebSocketServer = WebSocket.Server
import WebSocket, { WebSocketServer } from 'ws'; //see https://www.npmjs.com/package/ws
import path      from 'path';
import { spawn } from 'child_process'
import ModbusRTU from "modbus-serial"
import os        from "os" //dde4 added
//import {readChunkSync} from 'read-chunk' //https://www.npmjs.com/package/read-chunk
function readChunkSync(filePath, {length, startPosition}) {
    console.log("top of readChunkSync with filePath: " + filePath +
                " length: " + length + " startPosition: " + startPosition)
    console.log("Buffer: " + Buffer)
    let buffer = Buffer.alloc(length);
    console.log("got buffer: " + buffer)
    console.log("got fs.openSync: " + fs.openSync)
    const fileDescriptor = fs.openSync(filePath, 'r');
    console.log("got fileDescriptor: " + fileDescriptor)
    try {
        const bytesRead = fs.readSync(fileDescriptor, buffer, {
            length,
            position: startPosition,
        });

        if (bytesRead < length) {
            buffer = buffer.slice(0, bytesRead);
        }

        return buffer;
    } finally {
        fs.closeSync(fileDescriptor);
    }
}



//dde4 replaced the below requires with the above imports
/*
var http = require('http'); 
var url = require('url'); //url parsing
var formidable = require('formidable');
var fs = require('fs'); //file system
var net = require('net'); //network
const ws = require('ws'); //websocket
const path = require('path'); //parse path / file / extension
const { spawn } = require('child_process'); //see top of file
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
  "css":  "text/css",
  "html": "text/html",
  "gif":  "image/gif",
  "jpeg": "image/jpeg",
  "jpg":  "image/jpeg",
  "js":   "text/javascript",
  "mjs":  "text/javascript", //new for dde4 https://github.com/google/WebFundamentals/issues/7549
  "mp3":  "audio/mpeg",
  "mp4":  "video/mp4",
  "png":  "image/png",
  "ico":  "image/x-icon",
  "svg":  "image/svg+xml",
  "txt":  "text/plain"
  };

function compute_dde_apps_folder(){ //new in dde4 //todo dde4 result proably shouldn't end in slash
    if(running_on_dexter()) { return SHARE_FOLDER + '/dde_apps/' }
    else {
        return os.homedir()  //example: "/Users/Fry"
               + "/Documents/dde_apps/"
    }
}

function compute_dde_install_folder(){ //new in dde4 //todo dde4 result proably shouldn't end in slash
    if(running_on_dexter()) {
          return  SHARE_FOLDER + "/www/dde/build"  //'/root/Documents/dde'
    }
    else {
        return path.join(process.cwd(), 'dde', 'build')
    }
}

const SHARE_FOLDER       = '/srv/samba/share';
const DDE_APPS_FOLDER    = compute_dde_apps_folder() //dde4
const DDE_INSTALL_FOLDER = compute_dde_install_folder() //where DDE is installed on Dexter  //todo dde4 this changes

function running_on_dexter() { //dde4 added
    return fs.existsSync(SHARE_FOLDER)
}

function make_full_path(path){ //dde4 added
    if(path.startsWith("/")) {} //keep path as is
    else if ((path === "dde_apps") || path.startsWith("dde_apps/")){
        if(running_on_dexter()) {
            path = SHARE_FOLDER + "/" + path
        }
        else {
            let prefix = os.homedir() + "/Documents/"
            console.log("in make_full_path, NOT running_on_dexter, prefix: " + prefix)
            path = prefix + path
        }
    }
    else {
        path = SHARE_FOLDER + "/" + path
    }
    return path
}
//const { spawn } = require('child_process'); //see top of file
 
var job_name_to_process = {};
function get_job_name_to_process(job_name) {
     console.log("get_job_name_to_process passed: " + job_name)
     if(job_name_to_process.keep_alive) { //if there is such a process, then keep_alive is true
     	return job_name_to_process.keep_alive;
     }
     else {
        return job_name_to_process[job_name];
     }
}
function set_job_name_to_process(job_name, process) { job_name_to_process[job_name] = process }
function remove_job_name_to_process(job_name) { delete job_name_to_process[job_name] }

function kill_all_job_processes(){
    for (let key of Object.keys(job_name_to_process)){
        let proc = job_name_to_process[key]
        proc.kill()
        remove_job_name_to_process(key)
    }
}
        
//arg looks like "myjob.js", "myjob.dde", "myjob"
function extract_job_name(job_name_with_extension){
    /* 
    let job_name=""+job_name_with_extension
	let dot_pos = job_name.indexOf(".")
    if(dot_pos === -1) { job_name = job_name_with_extension }
    else { job_name = job_name_with_extension.substring(0, dot_pos) }
    return job_name
    */
    /*let ext = path.extname(job_name_with_extension);
    //console.log("extension:"+ext)
    if (ext && -1!=["dde","js"].indexOf(ext)) { //if it's a dde job
        return job_name_with_extension.slice(0,-1-ext.length); //remove the extension
    } else { //just return the full thing if it's not a dde job
      return job_name_with_extension;
    }
    */
    //new in dde4
    if(job_name_with_extension.endsWith(".dde")) {
        return job_name_with_extension.substring(0, job_name_with_extension.length - 4)
    }
    else if (job_name_with_extension.endsWith(".js")) {
        return job_name_with_extension.substring(0, job_name_with_extension.length - 3)
    }
    else { return job_name_with_extension}
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
const wss = new WebSocketServer({port: 3001});    //server: http_server });
console.log("done making wss: " + wss);



function serve_job_button_click(browser_socket, mess_obj){
    let app_file = mess_obj.job_name_with_extension; //includes ".js" suffix 
    console.log("\n\nserve_job_button_click for:" + app_file);
    console.log("\nserve_job_button_click mess_obj:\n" + JSON.stringify(mess_obj))
    let app_type = path.extname(app_file);
    console.log("app_type: " + app_type)
    if (-1!=[".dde",".js"].indexOf(app_type)) { app_type = ".dde" }//if this is a job engine job
    let jobfile = app_file;
    if (!app_file.startsWith("/")) jobfile = DDE_APPS_FOLDER + app_file; //q.search.substr(1)
    //console.log("serve_job_button_click with jobfile: " + jobfile)
    let job_name = extract_job_name(app_file); //console.log("job_name: " + job_name + "taken from file name")
    console.log("job_name: " + job_name)
    let job_process = get_job_name_to_process(app_file); //warning: might be undefined.
    //let server_response = res //to help close over
    console.log("process: " + job_process)

    if(!job_process){
        //https://nodejs.org/api/child_process.html
        //https://blog.cloudboost.io/node-js-child-process-spawn-178eaaf8e1f9
        let cmd_line = "bash";
        let cmd_args = [mess_obj.args || "-i"]; //if they didn't give us a -c <command> then do an interactive session
        let cmd_options = {cwd: SHARE_FOLDER, shell: true};
        if (".dde"==app_type) { //if this is a job engine job
            cmd_line = 'node --experimental-fetch'; // --inspect'; // --inspect-brk then we run node
                  //the --experimental-fetch is needed when running node v 17
            cmd_args = // ["core define_and_start_job " + jobfile]; //orig dde3 //tell it to start the job
                      ["bundleje.mjs define_and_start_job " + jobfile] //dde4
            cmd_options = {cwd: DDE_INSTALL_FOLDER,
                           shell: true};
        }
        console.log("spawn\n    cmd_line: " + cmd_line + "\n    cmd_args: " + cmd_args + "\n    cmd_options: " + JSON.stringify(cmd_options))
        job_process = spawn(cmd_line,
                            cmd_args,
                            cmd_options
                            
                           );
        set_job_name_to_process(app_file, job_process);
        console.log("started job_name: " + job_name + " with: "+cmd_line+" "+cmd_args+" to new process: " + job_process.pid + " of type:" + app_type);
        job_process.stdout.on('data', function(data) {
          let data_str = data.toString();
          //console.log("\n\nserver: stdout.on data got data: " + data_str + "\n");

          //server_response.write(data_str) //pipe straight through to calling browser's handle_stdout
          //https://github.com/expressjs/compression/issues/56 sez call flush even though it isn't documented.
          //server_response.flushHeaders() //flush is deprecated.
          if (browser_socket.readyState != WebSocket.OPEN) {job_process.kill(); return;} //maybe should be kill()?
          browser_socket.send(data_str);
	     });
        if (".dde"==app_type) {  
            job_process.stderr.on('data', function(data) {
                let data_str = data.toString();
                console.log("\n\nJob." + job_name + " got stderr with data: " + data_str);
                //remove_job_name_to_process(job_name) //just because there is an error, that don't mean the job closed.
                //server_response.write("Job." + job_name + " errored with: " + data)
                console.log('\n\nAbout to stringify 2\n');
                let lit_obj = {job_name: job_name,
                               kind: "show_job_button",
                               button_tooltip: "Server errored with: " + data_str,
                               button_color: "red"};
                if (browser_socket.readyState != WebSocket.OPEN) {job_process.kill(); return;} //maybe should be kill()?
                browser_socket.send(data_str) //redundant but the below might not be working
                browser_socket.send("<for_server>" + JSON.stringify(lit_obj) + "</for_server>");
                //server_response.end()
                //job_process.kill() //*probably* the right thing to do in most cases.
                //remove_job_name_to_process(job_name);
                //BUT even with Node v 18, it sends to stderr:
                // " ExperimentalWarning: The Fetch API is an experimental feature. This feature could change at any time"
                //so we don't want to kill the process just for that.
            });
        } else {
            job_process.stderr.on('data', function(data) {
                let data_str = data.toString();
                console.log("\n\njob: " + job_name + " got stderr with data: " + data_str);
                if (browser_socket.readyState != WebSocket.OPEN) {job_process.kill(); return;} //maybe should be kill()?
                browser_socket.send(data_str);
                });
            
        }
        job_process.on('close', function(code) {
          console.log("\n\nServer closed the process of Job: " + job_name + " with code: " + code);
          if(code !== 0 && browser_socket.readyState === WebSocket.OPEN){
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
          })
        job_process.on('exit', function(code) { //do I really need to handle this?
                console.log("\n\nServer on exit the process of Job: " + job_name + " with code: " + code)
            }
          );
    }

    else { //using an existing process
        console.log("in serve_job_button_click already got a process")
    	let code;
        if(job_name === "keep_alive") { //happens when transition from keep_alive box checked to unchecked
        	code = "globalThis.set_keep_alive_value(" + mess_obj.keep_alive_value + ")\n";
        }
        else if (".dde" == app_type) { //job engine job
          //code = "Job." + job_name + ".server_job_button_click()"
          //e.g. `web_socket.send(JSON.stringify({"job_name_with_extension": "dexter_message_interface.dde", "ws_message": "goodbye" }))`
            if (mess_obj.ws_message ) { // {"job_name_with_extension": jobname.dde, "ws_message": data}
              //code = 'Job.'+job_name+'.user_data.ws_message = "' + mess_obj.ws_message  + '"'
              code = `Job.`+job_name+`.user_data.ws_message = '` + JSON.stringify(mess_obj.ws_message)  + `'\n`;
              }
            else if (mess_obj.code) {
              code = mess_obj.code + "\n";
            }
            /*else if (mess_obj.kind === "job_button_click"){
                code = "Job." + job_name + ".stop_for_reason('interrupted', 'user stopped the job')"
                console.log("server button click stopping job with code: " + code)
                setTimeout(function() {
                    kill_all_job_processes() //todo this presumes that if there's already a process, we clicked the
                    //job button to stop the process, so kill this process after it settles down
                    //so that starting it up again won't run into the problem with the websocket port open
                }, 2000)
            }*/
            else {
                code = 'Job.maybe_define_and_server_job_button_click("' + jobfile + '")\n';
                setTimeout(function() {
                    kill_all_job_processes() //todo this presumes that since there's already a process, we clicked the
                    //job button to stop the process, so kill this process after it settles down
                    //so that starting it up again won't run into the problem with the websocket port open
                }, 2000)
            }

        }
        else { // something else, probably bash
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

//not used for dde getting file content from the server.
//use a path of /edit?edit=/foo/bar.js instead and that
//bypasses serve_file.
function serve_file(q, req, res){
    //console.log("top of serve_file")
    let cur_dir = process.cwd()
    let filename
    if(fs.existsSync(SHARE_FOLDER)) { //running on Dexter
       filename = SHARE_FOLDER + "/www/" + q.pathname  //this is in orig dexter file, but replaced for  dde4 with server laptop by the below clause
    }
    //dde4 works except for editing a file
    else { //dde4 not running on dexter
        filename = q.pathname
        let maybe_slash = (q.pathname.startsWith("/") ? "" : "/")
        //console.log("serve_file got cur_dir: " + cur_dir)
        filename = cur_dir + maybe_slash +  q.pathname

    }
    /*else { //dde4 not running on dexter
        filename = q.pathname
        console.log("serve_file passed pathname: " + filename)
        if(filename.startsWith("/")) {
            let cur_dir = process.cwd()
            console.log("serve_file got cur_dir: " + cur_dir)
            filename = cur_dir +  filename
        }
        else { //filename does NOT start with slash
            filename = "/" + filename
        }
    }*/
    console.log("serve_file passed pathname: " + q.pathname +
              "\n                   cur_dir: " + cur_dir +
              "\n          serving filename: " + filename)

    //console.log("serving " + filename) //dde4 changed the 2nd arg to filename
    fs.readFile(filename, function(err, data) {
        if (err) { console.log(filename, "not found")
            res.writeHead(404, {'Content-Type': 'text/html'})
            return res.end("404 Not Found")
        }  
        res.setHeader('Access-Control-Allow-Origin', '*');
        let mimeType = mimeTypes[ q.pathname.split(".").pop() ] || "application/octet-stream"
        console.log("              Content-Type:", mimeType)
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

function get_page_get_cb() {}

//standard web server on port 80 to serve files
var http_server = http.createServer(async function (req, res) {
  //see https://nodejs.org/api/http.html#http_class_http_incomingmessage 
  //for the format of q.
  //console.log("web server got request: " + req.url )
  var q = url.parse(req.url, true)
  let [main_url, query_string] = ("" + req.url).split("?") //url.parse(req.url,true).search fails
  console.log("\nweb server passed url: " + req.url +
              "\n             pathname: " + q.pathname +
              "\n                query: " + query_string)
  if (q.pathname === "/") {
      q.pathname = "index.html"
  }
  if (q.pathname === "/init_jobs") {
      serve_init_jobs(q, req, res)
  }
  //get path info
  else if (q.pathname === "/edit" && q.query.info ) { //added dde4
      let path = q.query.info
      console.log("Getting info for orig path: " + path)
      path = make_full_path(path)
      console.log("Getting info for full path: " + path)
      let str_to_write
      if(fs.existsSync(path)) {
          let stat = fs.statSync(path)
          let kind
          if     (stat.isFile())            { kind = "file" }
          else if(stat.isDirectory())       { kind = "folder" }
          else if(stat.isSocket())          { kind = "socket" }
          else if(stat.isFIFO())            { kind = "fifo" }
          else if(stat.isCharacterDevice()) { kind = "character_device" }
          else                              { kind = "other" }
          stat.kind        = kind
          stat.full_path   = path
          let permissions  = (stat.mode & parseInt('777', 8)).toString(8)
          stat.permissions = permissions
          str_to_write     = JSON.stringify(stat)
      }
      else { str_to_write = "null"} //path is non-existant
      console.log("info: " + str_to_write)
      res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
      res.write(str_to_write)
      res.end()
  }

  //get directory listing
  else if (q.pathname === "/edit" && q.query.list ) { 
    let listpath = q.query.list
    //if(!listpath.endsWith("/")) {//fixed in DDEFile/get_folder //dde4 at least on Mac, listpath initially does not end in slash which breaks the below concat of listpath + items[i].name
    //    listpath = listpath + "/"
    //}
    //console.log("File list:"+listpath)
    listpath = make_full_path(listpath)
    fs.readdir(listpath, {withFileTypes: true}, 
      function(err, items){ //console.log("file:" + JSON.stringify(items))
        if(err) { console.log("error in http.createServer: " + err.message) } //dde4 added for insurance
        else    { console.log("http.createServer got item count of: " + items.length) }
        let dir = []
        if (q.query.list != "/") { //not at root
          let now = new Date()
          dir.push({name: "..", size: "", type: "dir", date: now.getTime()})
          }
        for (let i = 0; i < items.length; i++) { //dde4 added "let "  //console.log("file:", JSON.stringify(items[i]))
           //console.log("getting stats for i: " + i + " item: " + items[i] + " name: " + items[i].name)
          let file_maybe = items[i]
          if (file_maybe.isFile()) {
            let file_name = file_maybe.name
            let size = "unknown"
            let permissions = "unknown"
            let stats = {size: "unknown"} //dde4 not used so delete this line and move "let" to 3 lines below
            let date = 0 //dde4 necessary for catch clause of date
            try { //console.log("file:", listpath + items[i].name)
              stats = fs.statSync(listpath + file_name)
              size = stats["size"]
              date = stats["mtimeMs"]
              //if(!date) { date = 0 } //dde4 added to fix bug when no mtimeMs
              permissions = (stats.mode & parseInt('777', 8)).toString(8)
            } catch (e) {console.log("couldn't stat "+ file_name +":"+e) }
            dir.push({name: file_name, size: size, type: "file", permissions: permissions, date: date})
          } //size is used to see if the file is too big to edit.
          else if (file_maybe.isDirectory()) {
            dir.push({name:file_maybe.name, size: "", type: "dir"})
            } //directories are not currently supported. 
        }
        console.log('\n\nAbout to stringify 5\n');
        res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
        let dir_listing_str = JSON.stringify(dir)
        res.write(dir_listing_str)
        res.end()
      })
    }
    //use url/edit?edit=/foo.bar.js" to GET contents of a file
    //use url/edit?download=/foo.bar.js" to store the file
    //on the user's disc.
    ///foo.bar.js is the location of the file on the server.
    //If browser is set up to auto downlaod to the downloads filer,
    //it will otherwise browser can be set to ask the user
    //where the file should go. The Filename including full path,
    // comes back with the data from the server.
    //and the browser may chose to prepend "downloads" folder and
    //save just the downloads/filename.txt there.
   //used by read_file_async
  else if (q.pathname === "/edit" && q.query.edit || q.query.download) { 
    let filename = q.query.edit || q.query.download
    console.log("serving for edit filename: " + filename)
    filename = make_full_path(filename) //dde4
    fs.readFile(filename, function(err, data) {
        if (err) {
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.writeHead(404, {'Content-Type': 'text/html'})
            return res.end("404 Not Found "+err)
        }
        let stats = fs.statSync(filename)
        //console.log(("permissions:" + (stats.mode & parseInt('777', 8)).toString(8)))
        let line = 0;
        for (let i = 0; i < data.length; i++) { 
            if (10==data[i]) line++
            if ( isBinary(data[i]) ) { //console.log("binary data:" + data[i] + " at:" + i + " line:" + line)
                res.setHeader("Content-Type", "application/octet-stream")
                break
                }
            }
        if (q.query.download) {
            res.setHeader("Content-Disposition", "attachment; filename=\"" + path.basename(filename) + "\"")
        }
        console.log("in server edit?edit with: " + filename + " about to allow CORS.")
        res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
        res.writeHead(200)
        //console.log("server writing out data: " + data)
        res.write(data)
        return res.end()
      })
    }
    //used by read_file_part
    else if (q.pathname === "/edit" && q.query.read_part){ //dde4
      let filename = q.query.read_part
      console.log("serving for read_part filename: " + filename)
      filename   = make_full_path(filename)
      let start  = parseInt(q.query.start)
      let length = parseInt(q.query.length)
      if(start < 0) { //read length bytes from the end of the file
          let stats = fs.statSync(filename)
          let fileSizeInBytes = stats.size;
          start = fileSizeInBytes - length + start + 1 //compute new start when reading from end
      }
      console.log("read_file_part full_path: " + filename + " start: " + start + " length: " + length)
      try {
          console.log("got readChunckSync: " + readChunkSync)
          let data = readChunkSync(filename, {length: length, startPosition: start});
          console.log("After readChunkSync with data: " + data)
          let line = 0;
          for (let i = 0; i < data.length; i++) {
              if (10==data[i]) line++
              if ( isBinary(data[i]) ) { //console.log("binary data:" + data[i] + " at:" + i + " line:" + line)
                  res.setHeader("Content-Type", "application/octet-stream")
                  break
              }
          }
          res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
          res.writeHead(200)
          //console.log("server writing out data: " + data)
          res.write(data)
          return res.end()
      }
      catch(err) {
          res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
          res.writeHead(404, {'Content-Type': 'text/html'})
          return res.end("404 Not Found "+ err)
      }
    }
    /*else if(q.pathname === "/get_page") {
        let url = q.query.path
        let response = await fetch(url)
        if(response.ok) {
            let content = await file_info_response.text()
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.writeHead(200)
            //console.log("server writing out data: " + data)
            res.write(data)
            return res.end()
        }
        else {
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.writeHead(404, {'Content-Type': 'text/html'})
            return res.end("404 " + url + " Not Found: " + err)
        }
    }*/
      //see https://nodejs.org/api/http.html#httpgeturl-options-callback
      //be very careful "res" is the respoonse that goes back to the browser.
      // "get_res" is the response that comes back from the http.get
    else if(q.pathname === "/get_page") {
      let url = q.query.path
      if (url.startsWith("https:")) {
          let options = {headers: {"User-Agent": req.headers['user-agent']}}
          https.get(url, options, (get_res) => {
                  let rawData = '';
                  get_res.on('data', (chunk) => {
                      rawData += chunk;
                  });
                  get_res.on('end', () => {
                      //res.setHeader('Access-Control-Allow-Origin', '*'); //causes error
                      if((get_res.statusCode >= 300) &&
                         (get_res.statusCode <  400) &&
                          get_res.headers.location) { //an indirection
                         setTimeout(
                             function() {
                                 https.get(get_res.headers.location, options, function() {
                                     console.log("needs work")
                                 })
                             }, 10)
                      }
                      else {
                          res.writeHead(get_res.statusCode)
                          //console.log("server writing out data: " + data)
                          res.write(rawData)
                          return res.end()
                      }
                  })
                  get_res.on("error", (err) => {
                  //res.setHeader('Access-Control-Allow-Origin', '*'); //causes error
                     res.writeHead(get_res.statusCode)
                     return res.end()
                 })
          })
      }
      else { //presume starts with http:
          let options = {headers: {"User-Agent": req.headers['user-agent']}}
          http.get(url, options,
              (get_res) => {
              let rawData = '';
              get_res.on('data', (chunk) => {
                  rawData += chunk;
              });
              get_res.on('end', () => {
                  //res.setHeader('Access-Control-Allow-Origin', '*'); //causes error
                  res.writeHead(get_res.statusCode)
                  //console.log("server writing out data: " + data)
                  res.write(rawData)
                  return res.end()
              })
              get_res.on("error", (err) => {
                  //res.setHeader('Access-Control-Allow-Origin', '*'); //causes error
                  res.writeHead(get_res.statusCode)
                  return res.end()
              })
          })
      }
      //from https://nodejs.org/api/https.html#httpsgeturl-options-callback

    }

    else if (q.pathname === "/edit" && req.method == 'DELETE' ) { //console.log("edit delete:"+JSON.stringify(req.headers))
      const form = formidable({ multiples: true });
      form.parse(req, (err, fields, files) => { //console.log(JSON.stringify({ fields, files }, null, 2) +'\n'+ err)
        let path = make_full_path(fields.path) //dde4
        console.log("delete:" + path + "!")
        try {
            fs.unlinkSync(path)
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.writeHead(200);
            return res.end('ok');
        } catch(e) {
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
            res.writeHead(400);
            return res.end(e)
        }
      });
      return
      }
      //use POST for updating the content of an existing file
      //below the first causeofan||(or)is for formindable v 1.2.2  and the 2nd is for formidable v "^2.0.1"
      //used by write_file_async and append_to_file
     else if (q.pathname === "/edit" && req.method == 'POST' ) { //console.log("edit post headers:",req.headers)
        const form = formidable({ multiples: false });
        form.once('error', console.error);
        const DEFAULT_PERMISSIONS = parseInt('644', 8)
        var stats = {mode: DEFAULT_PERMISSIONS}
        form.on('file', function (filename, file) {  //console.log("edit post file:",file)
            //console.log("filename: " + filename + " file: " + JSON.stringify(file))
            let topathfile = (file.name || file.originalFilename) // dde4 we need the "let"
            topathfile = make_full_path(topathfile)
            try {
                console.log("copy", (file.path || file.filepath),
                    "to", topathfile)
                stats = fs.statSync(topathfile)
                //console.log(("had permissions:" + (stats.mode & parseInt('777', 8)).toString(8)))
            } catch {
            } //no biggy if that didn't work
            //if the folder doesn't exist, we want to auto-create it.
            let topath = topathfile.split('/').slice(0, -1).join('/') + '/' //dde4 needs "let"
            try {
                console.log(`make folder:${topath}.`)
                fs.mkdirSync(topath, {recursive: true})
            } catch (err) {
                console.log(`Can't make folder:${topath}.`, err)
                res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
                res.writeHead(400)
                return res.end(`Can't make folder ${topath}:`, err)
            }
            if (q.query.append) {
                // open destination file for appending
                let write_stream = fs.createWriteStream(topathfile, {flags: 'a'});
                // open source file for reading
                let read_stream = fs.createReadStream((file.path || file.filepath));

                write_stream.on('close', function() {
                    fs.unlink((file.path || file.filepath), function (err) {
                        if (err) console.log((file.path || file.filepath), 'not cleaned up', err);
                    });
                    res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
                    res.end('ok');
                    console.log("done writing");
                });

                read_stream.pipe(write_stream);
                //fs.appendFile((file.path || file.filepath), topathfile)
            }
            else {
                fs.copyFile((file.path || file.filepath),  //or  file.filepath
                  topathfile, function (err) {
                    let new_mode = undefined
                    if (err) {
                        console.log("copy failed:", err)
                        res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
                        res.writeHead(400)
                        return res.end("Failed")
                    } else {
                        fs.chmodSync(topathfile, stats.mode)
                        try { //sync ok because we will recheck the actual file
                            let new_stats = fs.statSync(topathfile)
                            new_mode = new_stats.mode
                            //console.log(("has permissions:" + (new_mode & parseInt('777', 8)).toString(8)))
                        } catch {
                        } //if it fails, new_mode will still be undefined
                        if (stats.mode != new_mode) { //console.log("permssions wrong")
                            //res.writeHead(400) //no point?
                            return res.end("Permissions error")
                        }
                        fs.unlink((file.path || file.filepath), function (err) {
                            if (err) console.log((file.path || file.filepath), 'not cleaned up', err);
                        });
                        res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
                        res.end('ok');
                    }
                }) //done w/ copyFile
            }
          });
        form.parse(req)
        return
        //res.end('ok');
      // });
      }
      //use for creating a new file
      else if (q.pathname === "/edit" && req.method == 'PUT' ) { console.log('edit put')
        const form = formidable({ multiples: true });
        form.parse(req, (err, fields, files) => { //console.log('fields:', fields);
          let pathfile = fields.path
          let newpath = pathfile.split('/').slice(0,-1).join('/')+'/'
          try { console.log(`make folder:${newpath}.`)
            fs.mkdirSync(newpath, {recursive:true})
          } catch(err) {
              console.log(`Can't make folder:${newpath}.`, err)
              res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
              res.writeHead(400)
              return res.end(`Can't make folder ${newpath}:`, err)
          }
          if (pathfile.slice(-1)!="/") { //if it wasn't just an empty folder
              fs.writeFile(pathfile, "", function (err) { console.log('create' + pathfile)
                if (err) {
                  console.log("failed", err)
                  res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
                  res.writeHead(400)
                  return res.end("Failed:" + err)
                  }
               }); 
             }
            res.setHeader('Access-Control-Allow-Origin', '*'); //dde4
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
    console.log("\nwss server on message received kind: " + mess_obj.kind)
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
var browser = new WebSocketServer({ port:3000 })
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

