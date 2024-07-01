/*glossary
servo_firmware_type     examples: 1 (nothing: doesn't exist), 8 (steppers, joint 1 thru 5), 320 (j6/j7), 430 (j6/j7)  //most general
servo_model_class_name  examples: "XL320", "XL330", "XC430" "XC430_LOAD"

servo_model_number      examples: 350,     1200,           1240,          1080,
servo_model_name        examples: "XL320", "XL330-M288-T", "XC330-M288-T" "XC430-W240-T" //one to one with servo_model_number

servo_id  a integer 3 = j6, 1=j7, (j1 thru 5 not in this category because are not servos, they are steppers)
servo_status  A json object containing the status of a servo on a dexter. Used in a_job.user_data.servo_status

joint_number (1 thru 7)

todo:
  DONE For class name: "Servos" or "Servo" ? Note you have effectively "Dexter.dexter0.servos"
       so "servos" is (almost) overloaded. do rename to Servo
       - "Dexter.dexter0.servos" is the same kind of data structure
          as Servos.info so can we unify those names? ie: Servo.servos
          renamne Servos.default_servos

  - robot_from_class_or_job see possible fry rewrite below to: job_or_dexter_to_dexter
	- orig has args: (dex_inst_or_class, the_job) but
      looks like it should just have 1 arg, call it "job_or_dexter"
      and what was the "or-class" of "dex_inst_or_class" supposed to mean?
      looks like no supporting code.
      but also returns Servos class but only for testing so get rid of that?
      AWAIT email to James N sent Mar 19, 2024

  DONE You have set_servo but it makes instruction: "S ServoSetX "
     So is servo_set_X or ServoSetX a better name?
     leave as is.


  DONE servo_id_to_servo see possible fry rewrite below
     DONE using fry rewrite. Same semantics.

  DONE static interpret_job_get (job_or_data, reqid, reqaddr, reqlen) => rename
    fry proposal static servo_status_to_error_object (job_or_servo_status, req_servo_id, reqaddr, reqlen)
     - is "id" actually "servo_id"" IF so , rename reqid to req_servo_id and
       can we return the object with the prop name of "servo_id" instead of just "id" ?
       leave as is.
    NO. leave as is. This is only an internal fn. DOn't doc. And James N working on a replacement anyway.


  DONE add to glossary "servo_status"  A json object containing the status of a servo on a dexter.  yes.

  - Dexter.grasp = function(new_degrees=2)  but we get overtorque of j7 at 50 or below.
       does the fn called, move_until_static really stop it in time to not overtorgue?

       Change 2 degrees to 20, change name of param and static's param to be min_degrees.
       and switch order of degree_tolerance=0.01, joint_number in move_until_static
       putting joint_number as the 2nd param.
      See James N email Mar 19, 2024

  - Should I wrap: new Job({ name: "test_servos" ...}) in
    static define_test_servos_job  ? to make it easy to define it but not always defined?
    NO, but put job def in doc as an example on how to use this class.

*/

console.log("Top of servo.js")

globalThis.Servo = class Servo {

    static models = { //https://github.com/ROBOTIS-GIT/Dynamixel2Arduino/blob/master/src/actuator.cpp
        "XL320": {
            "type": "320",
            "units": (360/1024), //a full 360' rotation is 1024 positional units
            "table": { //https://emanual.robotis.com/docs/en/dxl/x/xl320  //makes dynamixels, table properties
                "MODEL": { "addr": 0, "len": 2, "readonly":true },
                "MODE":   { "addr": 11, "len": 1 },
                "MAXTEMP": { "addr": 12, "len": 1, "default":65 }, //'C
                "SHUTDOWN": { "addr": 18, "len": 1, "default": 3 }, //bitfield
                "TORQUE": { "addr": 24, "len": 1, "default": 0 },
                "LED": { "addr": 25, "len": 1, "default": 0},
                "ERROR": { "addr": 50, "len": 1, "readonly":true },
                //"GOALCURRENT": { "addr": , "len":  }, // not supported on XL320
                "GOAL_POSITION": { "addr": 30, "len": 2 }, // 300/1023
                "POSITION": { "addr": 37, "len": 2, "readonly":true },
                "LOAD": { "addr": 41, "len": 2, "readonly":true },
                "MOVING": { "addr": 49, "len": 1, "readonly":true },

            }
        },
        "XC430": {
            "type": "430",
            "units": (360/4096), //a full 360' rotation is 4096 positional units
            "table": { //control table v2.0  //values of these props are the location of the actual data
                "MODEL":            	{ "addr": 0,  	"len": 2, "readonly":true },
                "MODEL_INFORMATION": 	{ "addr": 2,  	"len": 4, "readonly":true },
                "FIRMWARE_VERSION": 	{ "addr": 6,  	"len": 2, "readonly":true },
                "ID":               	{ "addr": 7,  	"len": 1 },
                "BAUD_RATE":        	{ "addr": 8,  	"len": 1 },
                "RETURN_DELAY_TIME": 	{ "addr": 9,  	"len": 1 },
                "DRIVE_MODE":        	{ "addr": 10, 	"len": 1 },
                "MODE":             	{ "addr": 11, 	"len": 1 },
                "SECONDARY_ID":      	{ "addr": 12, 	"len": 1 },
                "PROTOCOL_VERSION":  	{ "addr": 13, 	"len": 1 },
                "HOMING_OFFSET":     	{ "addr": 20, 	"len": 4 },
                "MOVING_THRESHOLD":   	{ "addr": 24, 	"len": 4 },
                "MAXTEMP":          	{ "addr": 31, 	"len": 1, "default":70 }, //'C
                "MAX_VOLTAGE_LIMIT":   	{ "addr": 32, 	"len": 2 },
                "MIN_VOLTAGE_LIMIT":   	{ "addr": 34, 	"len": 2 },
                "SHUTDOWN":         	{ "addr": 63, 	"len": 1, "default": 52 }, //bitfield
                "TORQUE":           	{ "addr": 64, 	"len": 1, "default": 0 },
                "LED":              	{ "addr": 65, 	"len": 1, "default": 0},
                "ERROR":            	{ "addr": 70, 	"len": 1, "readonly":true },
                "CURRENT_LIMIT":     	{ "addr": 38, 	"len": 2 }, // mA
                "GOAL_CURRENT":     	{ "addr": 102,	"len": 2 }, // mA see addr 38
                "PRESENT_CURRENT":  	{ "addr": 126, 	"len": 2, "readonly":true }, // mA see addr 38
                /* XL430_W250(1060), XC430_W150(1070), XC430_W240(1080), XXL430_W250(1090), XXC430_W250(1160)
                   do not have GOAL_CURRENT 102, PRESENT_CURRENT 126, or CURRENT_LIMIT 38 */
                "GOAL_POSITION":    	{ "addr": 116, 	"len": 4 }, // 360/4095
                "MOVING":           	{ "addr": 122, 	"len": 1, "readonly":true },
                "POSITION":         	{ "addr": 132, 	"len": 4, "readonly":true },
            }
        },
        "XC430_LOAD": {
            "type": "430",
            "units": (360/4096), //a full 360' rotation is 4096 positional units
            "table": { //control table v2.0
                "MODEL":         { "addr": 0, "len": 2, "readonly":true },
                "MODE":          { "addr": 11, "len": 1 },
                "MAXTEMP":       { "addr": 31, "len": 1, "default":70 }, //'C
                "SHUTDOWN":      { "addr": 63, "len": 1, "default": 52 }, //bitfield
                "TORQUE":        { "addr": 64, "len": 1, "default": 0 },
                "LED":           { "addr": 65, "len": 1, "default": 0},
                "ERROR":         { "addr": 70, "len": 1, "readonly":true },
                //"CURRENT_LIMIT": { "addr": 38, "len": 2 }, // mA
                //"GOAL_CURRENT": { "addr": 102, "len": 2 }, // mA see addr 38
                //"PRESENT_CURRENT": { "addr": 126, "len": 2, "readonly":true }, // mA see addr 38
                /* XL430_W250(1060), XC430_W150(1070), XC430_W240(1080), XXL430_W250(1090), XXC430_W250(1160)
                   do not have GOAL_CURRENT 102, PRESENT_CURRENT 126, or CURRENT_LIMIT 38 */
                "CURRENT_LOAD":  { "addr": 126, "len": 2, "readonly":true },
                "GOAL_POSITION": { "addr": 116, "len": 4 }, // 360/4095
                "MOVING":        { "addr": 122, "len": 1, "readonly":true },
                "POSITION":      { "addr": 132, "len": 4, "readonly":true },
            }
        }
    }

    //was servo_model
    static get_servo_model_class_name (servo_model_number) { //can be a number or a string representing a number.
        let no = parseInt(servo_model_number)
        switch(true) { //https://github.com/ROBOTIS-GIT/Dynamixel2Arduino/blob/master/src/actuator.h
            case no===350:  return "XL320";
            case no===1060: return "XC430_LOAD"; //XL430_W250
            case no===1070: return "XC430_LOAD"; //XC430_W150
            case no===1080: return "XC430_LOAD"; //XC430_W240
            case no===1090: return "XC430_LOAD"; //XXL430_W250
            case no===1160: return "XC430_LOAD"; //XXC430_W250
            case no>=1000 && no <=1090: return "XC430";
            case no>=1100 && no<=1180:  return "XM540";
            case no>=1190 && no<=1240:  return "XL330";
            case no>=1270 && no <=1280: return "XC430"; //XW430_T200 XW430_T333
            default: return false;
        }
    }

    static default_servos = [] //array of actual servos for testing purposes. The indexes of the
                     //array are servo_id (s).

    //do call init when dde is inited.
    static init() { //yes, we could use classes, but the JSON syntax is compact and clear.
        //330's and 430's have the same table,
        console.log("top of Servo.init")
        this.models.XL330 = JSON.parse(JSON.stringify(this.models.XC430)) //copy
        this.models.XL330.type = "330" //maybe should be 430  do carlos will test. bug???
        //TODO: Wrap it in a function or make a test suite
        if (Servo.set_servo_id_model(1, "asdfsadf")) {shouldnt("Unknown servo model accepted")}

        Servo.set_servo_id_model(1, "XL320")
        if (Servo.default_servos[1].table.TORQUE.addr !== 24
            || Servo.default_servos[1].table.TORQUE.len  !== 1
        ) { shouldnt("wrong torque address for XL320 servo") }
        if (Servo.default_servos[1].table.ERROR.addr !== 50
            || Servo.default_servos[1].table.ERROR.len  !== 1
        ) { shouldnt("wrong error address for XL320 servo") }

        Servo.set_servo_id_model(3, Servo.models.XL330) //temp setting to 330 for testing
        if (Servo.default_servos[3].table.TORQUE.addr !== 64
            || Servo.default_servos[3].table.TORQUE.len  !== 1
        ) { shouldnt("wrong torque address for XL330/XC430 servo") }
        if (Servo.default_servos[3].table.ERROR.addr !== 70
            || Servo.default_servos[3].table.ERROR.len  !== 1
        ) { shouldnt("wrong error address for XL330/XC430 servo") }
        Servo.set_servo_id_model(3, Servo.models.XL320) //correct to default settings for servo id 3
    }

    //do fry verify: is there THERE A Dexter.reboot??? make sure it does the same thing.
    static reboot(servo_id) { //just reboot it. No type, slope or offset so those values won't change.
        if (typeof(servo_id) !== "number") error("Servo.reboot expects a numerical id")
        return "S RebootServo " + servo_id + ";"
    }


    static robot_from_class_or_job(dex_inst_or_class, the_job) {
        //Let's play find the robot!
        let robot = Servo //just for testing, start robot as the Servo class
        if (dex_inst_or_class instanceof Dexter) { out("robot "+dex_inst_or_class.name)
            robot = dex_inst_or_class;
        }
        else if (the_job instanceof Job) { out("job "+the_job.name+" robot "+the_job.robot.name);
            robot = the_job.robot;
        }
        out("Robot is "+robot.name)
        return robot
    }

    //fry rewrite:
    static job_or_dexter_to_dexter(a_job_or_dexter){
        if(a_job_or_dexter instanceof Job){
            return a_job_or_dexter.robot
        }
        else if (a_job_or_dexter instanceof Dexter){
            return a_job_or_dexter
        }
        else if (a_job_or_dexter === Dexter){
            return Servo
        }
        else {
            return Servo
        }
    }

    static set_servo_id_model(servo_id, model_or_servo_model_class_name, robot=undefined) {
        //copy generic model info into id array. Or just point to it:
        console.log("top of Servo.set_servo_id_model")
        let model = model_or_servo_model_class_name
        console.log("got model: " + model)
        if (typeof(model) === "string") { //they gave us the model name
            model = this.models[model] //so get them the model object
        }
        console.log("now model is: " + model)
        console.log("!model is: " + !model)
        if(!model){
            console.log("in model if,  no model")
            warning("Servo model: " + model + " is unknown.")
            return false
        }
        else if (!model.table) {
            console.log("in model else if, no table")
            warning("Servo model : " + model + " doesn't have a 'table' property.")
            return false
        }
        console.log("after using model: " + model)
        let default_servos = this.default_servos //start with the global list
        if (robot) {  //if we actually have a robot
            if (!robot.servos) {robot.servos = []} //retrofit a servos array as needed
            default_servos = robot.servos //but use the robots list, not the global list.
        }
        default_servos[servo_id] = {"state":{}, "table": model.table, "type":model.type, "id":servo_id}
        return true
    }

    //fry rewrite:
    static servo_id_to_servo = function(servo_id, a_dexter) {
        let the_servos
        if((a_dexter instanceof Dexter) && a_dexter.servos) {
            the_servos = a_dexter.servos
        }
        else { the_servos = this.default_servos }
        let servo = the_servos[servo_id]
        return servo
    }

    static servo_property(servo, property_name) {
        if (!servo.table) { dde_error("no table found for servo") }
        let table_item = servo.table[property_name]
        if (!table_item) {
            dde_error("Servo "+servo.it+" has no property "+property_name+". Properties:"+Object.keys(servo.table))
        }
        return table_item
    }


    //make a servo_set instruction  put in Dexter.servo_set  (done later in this file?)
    //if robot is not passed, it will default to the robot of the job that this instruction
    //is running in. When we have do_list src code of Dexter.servo_set(1, "MAXTEMP", 123),
    //we don't pass in a robot to Servo.servo_set and we use the job's robot as usual
    static servo_set = function(servo_or_id=3, property_name, value, robot) {
        let servo = servo_or_id
        if (typeof(servo_or_id) === "number") {
            servo = this.servo_id_to_servo(servo_or_id)
        }
        let table_item = this.servo_property(servo, property_name)
        if (table_item.readonly) {
            dde_error("Servo " + servo.id + " property:" + property_name + " is read only")
        }
        let addr = table_item.addr
        let len = table_item.len
        let hex = Utils.value_to_percent_hex(value, len)
        return make_ins("S", "ServoSetX", servo.id, addr, hex.length, hex, robot)
        //"S ServoSetX " + servo.id + " " + addr + " " + hex.length + " " + hex //orig James N code
    }


    static interpret_job_get (job_or_data, reqid, reqaddr, reqlen) {
        let data = job_or_data //hope it's just a string
        if (typeof(job_or_data) !== "string") {
            data = job_or_data.user_data.servo_status
        }
        if (typeof(data) !== "string")        return {"error": "INVALID RESPONSE"}
        if (data.length == 0)                 return {"error": "NO RESPONSE"}
        if (data.length < 11*3)               return {"error": "INCOMPLETE RESPONSE:" + data.length + " bytes"}
        if (!data.startsWith("FF FF FD 00 ")) return {"error": "BAD HEADER:"+data}
        let id = parseInt(data.substr(4*3,1*3))
        let len = Utils.little_hex_to_integer(data.substr(5*3,2*3))
        len -= 4 //back out the instruction, error, and two CRC bytes to indicate the number of data bytes sent
        if (data.length < 9*3 + len*3)        return {"error": "INCOMPLETE RESPONSE:" + data.length + " bytes"}
        if (data.substr(7*3,1*3) != "55 ") return {"error": "NOT A STATUS:"+data.substr(7*3,1*3)}
        let err = Utils.little_hex_to_integer(data.substr(8*3,1*3))
        let errmsg = ""
        switch(err&127) { //7 bit code, high bit hardware error flag
            case 1: errmsg += " instruction failed";break;
            case 2: errmsg += " bad instruction";break;
            case 3: errmsg += " CRC error";break;
            case 4: errmsg += " outside address range";break;
            case 5: errmsg += " wrong length";break;
            case 6: errmsg += " exceeds limit";break;
            case 7: errmsg += " access denied";break;
        } //https://emanual.robotis.com/docs/en/dxl/protocol2/#error
        if (id != reqid) errmsg+=" wrong servo id returned:" + reqid
        let addr = parseInt(reqaddr)
        let val = Utils.little_hex_to_integer(data.substr(9*3,len*3))
        //debugger
        let servo = this.default_servos[id]
        /* TODO: Figure out how to check the servo type against the DDE read of the servos
            if (job.robot && job.robot.defaults && job.robot.defaults.ServoSetup[id]) {
                servo = job.robot.defaults.ServoSetup[id]
                }
        */
        let settype = servo.type
        //TODO: Dex doesn't exist here. Where does DDE store the defaults data?
        if (!settype && !Dex.defaults) { settype = "XL320" } //we've read Defaults, and there were no RebootServos, so 320 setup is default.
        let type = servo.detected || settype //best guess, auto-diag wouldn't continue if this hadn't been proven
        //let msg = "ID:"+id+" address:"+addr+" value:"+val+" len:"+len+" hex:"+data.substr(9*3,len*3)
        let res = {"id":id
            , "address":addr
            , "value":val
            , "len":len
            , "hex":data.substr(9*3,len*3)
            , "data":data
            , "que":[]
        }
        let hw_err_reg = servo.table.ERROR.addr
        let torque_reg = servo.table.TORQUE.addr
        if (err >= 128) {
            errmsg+=" hardware fault."
        }
        //out("readback servo "+id+" type "+type+" address " + addr + " for " + reqlen + " bytes")
        switch(addr) {
            case 0:
                type=this.get_servo_model_class_name(val); //out("model "+val+" is type "+type)
                //if (type=="XL330" && settype=="XC430") settype = type //430 setup works for 330's
                //msg += " servo is type:"+type
                res.type = type
                /*
                TODO, figure out how to check this against DDE's read of Defaults.make_ins.
                It currently doesn't know that the default is XL-320s.
                            if (!Dex.S) S = {}
                            if (!Dex.S.RebootServo) Dex.S.RebootServo = []
                            if (!Dex.S.RebootServo[id]) Dex.S.RebootServo[id] = {}
                            Dex.S.RebootServo[id].detected = type
                            Dex.S.RebootServo[id].id = id //yes, this is stupid, but it helps with the Settings control.
                            if (type!=settype) { console.log("setup:" + settype + " type:" + type)
                                if (settype) {
                                    msg += " mismatched RebootServo "+id+" "+settype+"; in read .make_ins file"
                                }
                                else {
                                    msg += ". Setup unknown, r 0 Defaults.make_ins; or other setup to check"
                                    //byID("msg").value = "r 0 Defaults.make_ins; Read default setup"
                                }
                            }
                            servolist(); //update the list in the Settings control panel.
                */

                if (err) { //was an error, but maybe we just figured out the servo type so que a request here
                    res.que.push("r 0 #Servo "+id+" "+hw_err_reg+" 1; Read "+type+" hardware error")
                } else { //no no errors, so continue to auto-diag the servo
                    res.que.push("r 0 #Servo "+id+" "+torque_reg+" 1; Check torque setting")
                }
                break;
            case hw_err_reg:
                if (val!=0) {errmsg += "Type:" + type + " hardware error status register:"+hw_err_reg+" value:" + val+" bits:"+val.toString(2)
                    switch(type) {
                        case "XL320": out("decoding 320 errors"+val+" "+(val& 1<<2))
                            if (val & 1<<2) { //console.log("voltage")
                                errmsg += " ERROR BIT 2: VOLTAGE! Check 13 and 14 for min max voltage"
                            }
                            if (val & 1<<1) { //console.log("temp?") //very confusing docs not sure.
                                errmsg += " ERROR BIT 1: OVERTEMP! Check 12 for temp limit"
                            }
                            if (val & 1<<0) { //console.log("overtorque")
                                errmsg += " ERROR BIT 0: OVERTORQUE!"
                            }
                            break;
                        case "XL330":
                        case "XC430":
                            if (val & 1<<5) {
                                errmsg += " ERROR BIT 5: OVERTORQUE!"
                            }
                            if (val & 1<<4) {
                                errmsg += " ERROR BIT 4: UNDER-VOLTAGE!"
                            }
                            if (val & 1<<2) {
                                errmsg += " ERROR BIT 2: OVERTEMP! Check temp limit field"
                            }
                            if (val & 1<<0) {
                                errmsg += " ERROR BIT 0: OVER-VOLTAGE!"
                            }
                            break;
                    }
                } //else {msg += " no hardware errors"}
                break;
            case torque_reg:
                if (val==0) {
                    errmsg += " Torque disabled. Send 'S ServoSetX "+id+" "+torque_reg+" 1;' to re-enable torque"
                    res.que.push("S ServoSetX "+id+" "+torque_reg+" 1; Re-enable torque") // Should we do this automatically?
                    res.ready = false
                } else {
                    //msg += " torque is enabled"
                    res.ready = true
                }
                break;
        }
        if (errmsg) { res.error = "ERROR:"+errmsg+""; res.err = err; }
        return res
    }

    //called by Dexter.constructor to supply the "default" value for the dexter_instance.servos prop.
    //actually called by Dexter.make_new_robot which is called by the constructor.
    //then after that default.makeins will "customize" the servos for
    //that particular Dexter instance if need be
    static make_servos_for_dexter() {
        let result =  [
            undefined, //servo_id 0
            Servo.servo_id_to_servo(1), //default the default servo into the default robot
            undefined, //servo_id 2
            Servo.servo_id_to_servo(3) //default the default servo into the default robot
        ]
        result.span = result[1] //ie the same as  servo_id 1
        result.roll = result[3] //ie teh same as servo_id 3
        return result
    }


} //end of class Servo

//Servo.init() //moved to ready.js because too many dependencies not loaded to call it hear.

/*
Dexter.prototype.servo_set = function (servo_or_id=3, property_name, value) {
    let dex_inst_or_class = this //'this' will be the Dexter class, or an instance of that class at define time
    return function() {
        let the_job = this //At run time, 'this' will be the job
        let robot = Servo.robot_from_class_or_job(dex_inst_or_class, the_job)
        return Servo.servo_set(servo_or_id, property_name, value)
    }
}
Dexter.servo_set = Dexter.prototype.servo_set //backfill
 */

Dexter.servo_set = Servo.servo_set
Dexter.prototype.servo_set = function(servo_or_id, property_name, value) {
    let dexter_instance = this
    return Servo.servo_set(servo_or_id, property_name, value, dexter_instance) //this must be the Dexter instance
}


Dexter.prototype.servo_get = function (servo_or_servo_id=3, property_name="MODEL") {
//this part can be done at job definition time (nothing)
    let robot = this //'this' will be an instance of a Dexter or null, when we want the Job's robot as is the case when
    //this method is called by Dexter.servo_get
    return function() { //and these parts need to be done at job run time.
        let the_job = this //At run time, 'this' will be the job
        if(!robot) { robot = the_job.robot }
        let servo = servo_or_servo_id
        if (typeof(servo_or_servo_id) === "number") {
            servo = Servo.servo_id_to_servo(servo_or_servo_id,robot)
        }
        if (!servo && property_name === "MODEL") { //if it's just to get the model
            servo = {id: servo_or_servo_id, table: { "MODEL": { "addr": 0, "len": 2, "readonly":true }}}
        } //make a fake entry to get us through, 'cause model is always there
        if (!servo) { //still no servo? Error time
            let servo_array = robot.servos
            let servo_list = ""
            for (let s in servo_array) {
                servo_list += s.toString()+" "
            }
            if (robot && robot.servos) { servo_list += " in Robot: "+robot.name }
            dde_error("Servo "+id+" does not exist. Know servo IDs are: "+servo_list)
            return []
        }
        let id = servo.id
        //don't pre-set the servo table because the type of servo might change as the job runs
        let table_item = Servo.servo_property(servo, property_name)
        let addr = table_item.addr
        let len = table_item.len
        let file = "#Servo " + id + " " + addr + " " + len
        return [ function(){console.log("Reading:"+file+" for job "+the_job.name)}
            ,function() {the_job.user_data.servo_status = ""}
            ,robot.read_from_robot(file, "servo_status") //be sure to ask the correct robot.
            ,function() { //after data is returned in job user_data.servo_status,
                let s = Servo.interpret_job_get(the_job, id, addr, len); //interpret it
                the_job.user_data.servo_status = s; //put it in the job user_data.servo_status
                if (s.error) { warning("Servo "+id+" "+s.error) } //warn about errors
                if (s.err) { warning("Servo "+id+" hardware error: " + s.err)}

                //do fry: maybe remove the_job. ???
                if (the_job.robot && property_name === "MODEL") { //we are in a job and got a model
                    Servo.set_servo_id_model(id, s.type, robot) //so track it in the robot
                    //out(the_job.robot.servos)
                }
            }
        ]
    }
}

//Dexter.servo_get = Dexter.prototype.servo_get //backfill

Dexter.servo_get = function(servo_or_servo_id=3, property_name="MODEL"){
    return Dexter.prototype.servo_get.call(null, servo_or_servo_id, property_name) //pass in null so that we''ll get the Job's robot
}

Dexter.prototype.servo_detect = function (servo_or_servo_id=3) {
    let robot = this //'this' will be the Dexter class, or an instance of that class at define time
    return function() {
        let the_job = this //At run time, 'this' will be the job
        if(!robot) { robot = the_job.robot }
        return robot.servo_get(servo_or_servo_id, "MODEL") //just get the model, servo_get does the rest.
    }
}

//Dexter.servo_detect = Dexter.prototype.servo_detect //backfill
Dexter.servo_detect = function(servo_or_servo_id=3){
    return Dexter.prototype.servo_detect.call(null, servo_or_servo_id) //pass in null so that we''ll get the Job's robot
}

//do fry put servo_check on Dexter menu???  no for now.
Dexter.prototype.servo_check = function (servo_or_servo_id=3) {
    let robot = this //'this' will be the Dexter class, or an instance of that class at define time
    return function() {
        let the_job = this //At run time, 'this' will be the job
        if(!robot) { robot = the_job.robot }
        return [ robot.servo_get(servo_or_servo_id, "MODEL")
            ,Control.loop(10, function(){ //run up to 10 commands from the que
                let q = the_job.user_data.servo_status.que
                if (que.length > 0) {return que.pop()}
                return Control.break() //stop when we run out of suggestions
            })
        ]
    }
}

Dexter.servo_check = function(servo_or_servo_id=3){
    return Dexter.prototype.servo_check.call(null, servo_or_servo_id) //pass in null so that we''ll get the Job's robot
}

Dexter.prototype.move_until_torque = function(goal_degrees = 90, joint_number = 7, torque_limit = 500){
    let dexter_instance = this
    return Dexter.move_until_torque(goal_degrees, joint_number, torque_limit, dexter_instance)
}

//robot of null means use the_job.robot
Dexter.move_until_torque = function (goal_degrees = 90, joint_number = 7, torque_limit = 500, robot=null){
    if((joint_number !== 6) && (joint_number !== 7)) {
        dde_error("Dexter.move_until_torque passed joint_number: " + joint_number +
            "<br/>but only 6 and 7 are valid now.")
    }
    return function(){
        let the_job = this
        if(!robot) { robot = the_job.robot }
        //at this point, robot is either a dexter_instance OR Dexter (the class)
        let torque_timeout_ms = 200 //100ms is too short, 300 unnecessarily long
        out("move_until_torque trying to reach " + goal_degrees +
            "&deg; or torque " + torque_limit +
            " in " + torque_timeout_ms + "ms")
        let first_move
        //TODO: This XL-320 stuff should be abstracted away, see Servo.models.XL320.units
        let deg_per_dynamixel_320_unit = 0.29
        let j6_offset = 512
        if(joint_number === 6) {
            let du = Math.round(goal_degrees / deg_per_dynamixel_320_unit) +
                j6_offset
            first_move = robot.set_parameter("EERoll", du)
        }
        else if(joint_number === 7) {
            let du = Math.round(goal_degrees / deg_per_dynamixel_320_unit)
            first_move = robot.set_parameter("EESpan", du)
        }
        this.user_data.torque_clock_start_ms = Date.now()
        return [first_move,
            Control.loop(function(){
                    let ma
                    let mt
                    let dur_since_start_ms = Date.now() - this.user_data.torque_clock_start_ms
                    if(joint_number === 6){
                        ma = robot.robot_status[Dexter.J6_MEASURED_ANGLE]
                        mt = robot.robot_status[Dexter.J6_MEASURED_TORQUE]
                    }
                    else if(joint_number === 7){
                        ma = robot.robot_status[Dexter.J7_MEASURED_ANGLE]
                        mt = robot.robot_status[Dexter.J7_MEASURED_TORQUE]
                    }
                    else {
                        shouldnt("Dexter.move_until_torque passed invalid joint_number of: " + joint_number)
                    }
                    if ((dur_since_start_ms > torque_timeout_ms) && (Math.abs(mt) >= torque_limit)) {
                        out("Torque limit of: " + torque_limit + " reached at: " + mt + ", at " + ma + "&deg;")
                        return false //stop looping, we're done
                    }
                    else if(similar(ma, goal_degrees, 2)) {
                        out("Target angle of: " + goal_degrees + "&deg; reached at: " + ma + "&deg;, at torque: " + mt)
                        return false //stop looping, we're done
                    }
                    else {
                        out("Joint " + joint_number + " now at " + ma.toFixed(15) + "&deg; and torque: " + mt + " after " + dur_since_start_ms + "ms")
                        return true
                    }
                },
                function() {
                    return robot.get_robot_status()
                }),
            function(){
                //tell the robot to go where it IS, thus stopping its attempt to get to the orig goal
                //important when we've stopped because we were within a tolerance but not dead on,
                //or we stopped due to the torque limit
                if(joint_number === 6) {
                    let cur_degrees = robot.robot_status[Dexter.J6_MEASURED_ANGLE]
                    let cur_du = Socket.degrees_to_dexter_units(cur_degrees, 6)
                    out("Joint 6 set to where it already is: " + cur_degrees + "&deg;.")
                    return robot.set_parameter("EERoll", cur_du)
                }
                else if(joint_number === 7) {
                    let cur_degrees = this.robot.robot_status[Dexter.J7_MEASURED_ANGLE]
                    let cur_du = Socket.degrees_to_dexter_units(cur_degrees, 7)
                    out("Joint 7 set to where it already is: " + cur_degrees + "&deg;")
                    return robot.set_parameter("EESpan", cur_du)
                }
            }
        ]
    }
}

Dexter.prototype.move_until_static = function(goal_degrees = 90, joint_number = 7, degree_tolerance=0.01){
    let dexter_instance = this
    return Dexter.move_until_static(goal_degrees, joint_number, degree_tolerance, dexter_instance)
}


//doesn't need a torque, full strength of servo.   maybe more useful.
//robot of null means use the_job.robot
Dexter.move_until_static = function (goal_degrees=20, joint_number = 7, degree_tolerance=0.01, robot=null){
    if((joint_number !== 6) && (joint_number !== 7)) {
        dde_error("Dexter.move_until_static passed joint_number: " + joint_number +
            "<br/>but only 6 and 7 are valid now.")
    }
    let prev_mas = []
    let prev_mas_full_length = 4 //2 is too short: motor doesn't move enough
    return function(){
        out("move_until_static trying to reach " + goal_degrees + "&deg;")
        let the_job = this
        if(!robot) { robot = the_job.robot }
        let first_move
        let new_du = Socket.degrees_to_dexter_units(goal_degrees, joint_number)
        if(joint_number === 6) {
            first_move = robot.set_parameter("EERoll", new_du)
        }
        else if(joint_number === 7) {
            first_move = robot.set_parameter("EESpan", new_du)
        }
        return [first_move,
            Control.loop(function(){
                    let ma = this.robot.rs.measured_angle(joint_number)
                    //out("Joint " + joint_number + " now at " + ma + "&deg;")
                    if (similar(ma, goal_degrees, degree_tolerance)) {
                        out("Measured angle: " + ma + "&deg; is within: " +  degree_tolerance + " of goal_degrees: " + goal_degrees)
                        prev_mas = []
                        return false
                    }
                    else if(prev_mas.length < prev_mas_full_length) {
                        prev_mas.push(ma)
                        return true //keep looping
                    }
                    else { //we know prev_mas.length == prev_mas_full_length
                        for(let prev_ma of prev_mas){
                            if(!similar(ma, prev_ma, degree_tolerance)){
                                prev_mas.shift() //take off first elt of prev_mas
                                prev_mas.push(ma)
                                return true //continue looping
                            }
                        }
                        //prev_mas and ma are similar so no movement of joint, so we're done
                        out("last " + (prev_mas_full_length + 1) + " measured angles stopped moving and within: " + degree_tolerance + " of: " + ma +
                            "&deg;<br/>Prev angles: " + prev_mas.join(", "))
                        prev_mas = [] //must do or will not be reset when clikcing on job button the 2nd time
                        return false //done, the usual stop case.
                    }
                },
                function() {
                    return robot.get_robot_status()
                }),
            function(){
                //tell the robot to go where it IS, thus stopping its attempt to get to the orig goal
                //important when we've stopped because we were within a tolerance but not dead on,
                //or we stopped due to the torque limit
                let ma = this.robot.rs.measured_angle(joint_number)
                let du = Socket.degrees_to_dexter_units(ma, joint_number)
                out("Joint " + joint_number + " set to where it is: " + ma + "&deg;")
                if(joint_number === 6) {
                    return robot.set_parameter("EERoll", du)
                }
                else if(joint_number === 7) {
                    return robot.set_parameter("EESpan", du)
                }
            }
        ]
    }
}

//Error: In Socket.send, attempt to send instruction: 11,-1,1617918232780,,g but still waiting for previous instruction: 9,1,1617917826237,,P,100544.02707910512,208196.21318379667,405642.68474489666,-289838.8979286934,0,693,898

Dexter.prototype.twist = function(goal_degrees){
    let dexter_instance = this
    return Dexter.move_until_static(goal_degrees, 6, undefined, dexter_instance)
}
Dexter.twist = function(goal_degrees=0){
    return Dexter.move_until_static(goal_degrees,  6, undefined)
}

Dexter.prototype.grasp = function(min_degrees=20){
    let dexter_instance = this
    return Dexter.move_until_static(min_degrees, 7, undefined, dexter_instance)
}

Dexter.grasp = function(min_degrees=20){
    return Dexter.move_until_static(min_degrees, 7, undefined)
}

Dexter.prototype.ungrasp = function(max_degrees=270){ //theoretical limit 296 but without perfect calibration, best to set it lower
    let dexter_instance = this
    return Dexter.move_until_static(max_degrees, 7, undefined, dexter_instance)
}

Dexter.ungrasp = function(max_degrees=270){ //theoretical limit 296 but without perfect calibration, best to set it lower
    return Dexter.move_until_static(max_degrees, 7, undefined)
}

/*
function(servo_or_id=3, property_name="MODEL") {
    let robot = Servo //just for testing
    if (this instanceof Job) {out("job "+this.name);robot = this.robot}
    if (this instanceof Dexter) {out("robot "+this.name);robot = this}
    out(robot.name)
	return function() { //and these parts need to be done at job run time.
		Dexter.servo_get(servo_or_id, property_name)
        }
    }
*/

/* example
new Job({ //test
    name: "test_servos", user_data: {count: 0},
    do_list: [ IO.out("starting at "+Date())
        //,Dexter.read_from_robot("#Servo 3 0 2", "servo_status")
        //,function() { out("servo returned:"+this.user_data.servo_status+" good luck with that") }
        ,Dexter.servo_get(3, "MODEL") //instead of the above, just do this
        ,function() {
            let servo = this.user_data.servo_status;
            out(servo.id+" is a "+servo.type);
            out(Servo.servo_id_to_servo(3, this) === this.robot.servos[3]) //test that we did learn it
        }
        //,Dexter.dexter1.servo_get(3, "MODEL")() //as expected, fails; there is no dexter1 robot. move to doc example for servo-get
        //,Dexter.servo_get(2, "MODEL") //as expected, fails; there is no servo id 2.  ,,, move as above
        ,Dexter.servo_detect(1) //just calls servo_get(id, "MODEL"), if found, servo is added to the robot.
        //,"S ServoSetX 1, 116, 12, %01%00%00%00" //only if it's a 430  ,, move to doc  for servp_set
        //,"S ServoSetX 1, 30, 6, %01%00" //only if it's a 320
        //,"S ServoSet2X 1, 30, 1" //only if it's a 320, can't support a 430's 4 byte position
        ,Dexter.servo_set(1, "GOAL_POSITION", 400)
        ,Dexter.servo_set(Dexter.dexter0.servos.roll, "TORQUE", 0) //must specify robot to use named servos. sigh.

        ,function() {let servo_stat = this.user_data.servo_status; out(servo_stat)}
    ]
})
*/

/* Now in testsuites.js
new TestSuite("servo_interpret_job_get",
    ['Servo.servo_set(Servo.roll, "GOAL_POSITION", 10)',
        "[undefined, undefined, undefined, undefined, 'S', 'ServoSetX', 3, 30, 6, '%0A%00', undefined]"
    ],
    [`similar(make_ins("S", "ServoSetX", Dexter.dexter0.servos.roll.table.LED.addr, 1),
        [undefined, undefined, undefined, undefined, "S", "ServoSetX", 25, 1])`,
        "true"
    ],
    [`similar(Servo.interpret_job_get({"user_data": {"servo_status":""}}, 1, 0, 2)
    	, {"error":"NO RESPONSE"})`
        , "true"
        , "failed to detect empty reply"
    ]
    ,[`similar(Servo.interpret_job_get({"user_data": {"servo_status":"FF FF FD 00"}}, 1, 0, 2)
    	, {error: "INCOMPLETE RESPONSE:11 bytes"})`
        , "true"
    ]
    ,[`similar(
    	Servo.interpret_job_get({"user_data": {"servo_status":"FF FF FD AB                      "}}, 1, 0, 2)
    	, {error: "BAD HEADER:FF FF FD AB                      "})`
        , "true"
    ]
    ,[`similar(
    	Servo.interpret_job_get({"user_data": {"servo_status":"FF FF FD 00                      "}}, 1, 0, 2)
        ,{error:"NOT A STATUS:   "})`
        , "true"
    ]
    ,[`similar(
    	Servo.interpret_job_get({"user_data": {"servo_status":"FF FF FD 00 01 08 00 55 00           "}}, 1, 0, 2)
        ,{error: "INCOMPLETE RESPONSE:37 bytes"})`
        , "true"
    ]
    ,[`similar(
    	Servo.interpret_job_get({"user_data": {"servo_status":"FF FF FD 00 01 08 00 55 80 5E 01 00 00 "}}, 1, 0, 2).type
        ,"XL320")`
        , "true"
    ]
    ,[`similar(
    	Servo.interpret_job_get({"user_data": {"servo_status":"FF FF FD 00 01 08 00 55 80 08 04 02 00 "}}, 1, 2, 2).error
        ,"ERROR: hardware fault.")`
        , "true"
    ]
) */
//        ,{address: 0, err: 128, error: "ERROR: hardware fault.", hex: "5E 01 00 00 ", id: 1, len: 4, type: "330", value: 350})`

//TestSuite.servo_interpret_job_get.constructor.set_state_and_resume({suites: [TestSuite.servo_interpret_job_get]})