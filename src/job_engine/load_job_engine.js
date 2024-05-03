//this file only used when Job Engine is used as part of DDE IDE

globalThis.dde_running_in_cloud = function(){
    return (globalThis.location && globalThis.location.host === "cfry.github.io")
}
//start of Job Engine imports

globalThis.dde_version      = "not inited"
globalThis.dde_release_date = "not inited"
globalThis.operating_system = "not inited" //"mac", "win" or "linux"(for Ubuntu)  bound in both ui and sandbox by ready
globalThis.dde_apps_folder  = "not inited"
globalThis.platform         = "not inited" //"dde" or "node"

globalThis.default_default_ROS_URL           = "localhost:9090"
globalThis.default_default_dexter_ip_address = "192.168.1.142" //careful globalThis.platform is not bound when this is evaled. If runing in node, this is over-written in ready_je.js/on_ready_je()
globalThis.default_default_dexter_port       = 3000 //was 50000 in dde3



globalThis.keep_alive_value = false //true

import package_json from "../../package.json"
export {package_json}

import { LongBits } from 'longbits'
globalThis.LongBits = LongBits //needed by Protobuf
console.log("load_job_engine after loading longbits")

import * as Espree from "espree";
globalThis.Espree = Espree;

import js_beautify from "js-beautify"
globalThis.js_beautify = js_beautify
// js_beautify(JSON.stringify({a: 1, b:2})  //example of use. returns string nicely formatted.

/*errors with "Failed to resolve module specifier "stream"."
James N says: forget about modbus-serial, just uses serial. Its a very thinn layer on serial.
import ModbusRTU from "modbus-serial"
globalThis.ModbusRTU = ModbusRTU  //is this really ok in DDE4 browser (not job_engine?)
*/

//import mathjs from "mathjs" fails, see https://mathjs.org/docs/getting_started.html
//globalThis.mathjs = mathjs

import { create, all } from 'mathjs'
const config = { }
globalThis.mathjs = create(all, config)

import PCA from 'pca-js'
globalThis.PCA = PCA



//import cv from "opencv.js"
//globalThis.cv = cv

//import strips from "strips" //fails because strips needs "fs", ony available in node. See
//globalThis.strips = strips  //see ready_je.js for the importing of strips

//import { WebSocketServer } from 'ws'; //websocket server
//globalThis.WebSocketServer = WebSocketServer

//import {grpc} from '@grpc/grpc-js' //fails on build as does import grpc from '@grpc/grpc-js'
//import {CallOptions, ChannelCredentials, ServiceError} from '@grpc/grpc-js' //from fails on build  from: https://snyk.io/advisor/npm-package/@grpc/grpc-js/example
//globalThis.grpc = grpc //see ready_je.js for the importing of grpc

import "../job_engine/core/utils.js" //defines as global class Utils, and a few of its methods such as  dde_error, rgb
import "../job_engine/core/je_and_browser_code.js" //defines SW and out globally

import "../job_engine/math/Coor.js"    //now sets global Coor
import "../job_engine/math/Vector.js"  //now global
import {sind, cosd, tand, asind, acosd, atand, atan2d} from "../job_engine/math/Trig_in_Degrees.js"
globalThis.sind     = sind
globalThis.cosd     = cosd
globalThis.tand     = tand
globalThis.asind    = asind
globalThis.acosd    = acosd
globalThis.atand    = atand //called in picture1.js
globalThis.atan2d   = atan2d

import "../job_engine/math/Convert.js" //now global
import "../job_engine/math/Kin.js"     //now global
import "../job_engine/math/DXF.js"     //now global
import "../job_engine/math/DH.js"      //DH is now global
import "../job_engine/math/HiMem.js"   //DH is now global

import "../job_engine/low_level_dexter/calibrate_build_tables.js"

import "../job_engine/core/out.js" //makes get_output, show_window, beep, etc global
import "../job_engine/core/job.js" //globally defines Job
import "../job_engine/core/linux_error_message.js" //used by Job, makes linux_error_message global
import "../job_engine/core/gcode.js" //Gcode now global
import "../job_engine/core/fpga.js" //globally defines FPGA

//robots!
import "../job_engine/core/instruction.js"          //globally defines Instruction, make_ins
import "../job_engine/core/instruction_dexter.js"   //sets Instruction.Dexter to the dexter instruction class
import "../job_engine/core/instruction_io.js"       //makes class IO global
import "../job_engine/core/instruction_control.js" //makes  class Control global
import "../job_engine/core/robot.js"                //now global Robot, Brain, Serial, Human, Dexter
import "../job_engine/core/instruction_j_move.js"   //defines Dexter.j_move and friends

import "../job_engine/core/dexter_defaults.js"      //just extends the Dexter class
import "../job_engine/core/DexDefaults.js"  //nov 2023 new. defines globalThis.DexDefaults class

import "../job_engine/core/waiting.js"              //defines globalThis.Waiting


import "../job_engine/core/socket.js"       //defines class Socket as global
import "../job_engine/core/dextersim.js"    //defines class DexterSim as global
import "../job_engine/core/simqueue.js"     //defines class Simqueue as global
import "../job_engine/core/simqueuej.js"     //defines class SimqueueJ as global

import "../job_engine/core/simutils.js"     //defines class SimUtils as global
import "../job_engine/core/robot_status.js" //defines class RobotStatus as global

import "../job_engine/core/dde_file.js" //defines class File as global
import "../job_engine/core/object_system.js"//defined globals: Root, newObject
import "../job_engine/core/html_db.js" //makes: html_db, make_html, make_dom_elt global
import "../job_engine/core/to_source_code.js" //defined to_source_code globally
import "../job_engine/core/duration.js"
import "../job_engine/core/monitor.js" //defines Monitor and MonitorServer
import "../job_engine/core/py.js"      //defines class Py
import {init_units} from "../job_engine/core/units.js"
export {init_units}

import "../job_engine/act/ActEval.js"  //defines class ActEval
import "../job_engine/act/List.js"     //defines class List


//import "../job_engine/core/messaging.js"//defined global: Messaging todo dde4, this needs to be moved to the server.

//end  of Job Engine imports

export async function init_job_engine(){
    //out("out: top of init_job_engine") //DO NOT CALL "out" here. It will error.
    console.log("top of init_job_engine")
    globalThis.dde_version = package_json.version
    globalThis.dde_release_date = package_json.release_date
    console.log("DDE version: " + dde_version)
    Coor.init()
    //see also ./core/index.js that has this same code
    Dexter.make_ins = make_ins
    Dexter.calibrate_build_tables = globalThis.calibrate_build_tables
    Dexter.prototype.calibrate_build_tables = function() {
        let result = Dexter.calibrate_build_tables()
        for(let oplet_array of result){
            if(Array.isArray(oplet_array)){
                oplet_array.push(this)
            }
        }
        return result
    }

    Job.class_init()
    Dexter.class_init()
    new Brain({name: "brain0"})

    Dexter.draw_dxf = DXF.dxf_to_instructions //see Robot.js
    Dexter.prototype.draw_dxf = function({robot = null}={}) {
        let obj_args
        if (arguments.length == 0) { obj_args = {} } //when no args are passed, I must do this
        else { obj_args = arguments[0] }
        obj_args.robot = this
        return Dexter.draw_dxf(obj_args)
    }
    if(platform === "node") { //running in the Job Engine so init the MonitorServer.
        MonitorServer.init()
    }
}