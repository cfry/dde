//Only used in the Job Engine

// GRPC doc: https://grpc.io/docs/languages/node/basics/
//see ready_je.js which sets these 2 as global vars.
//var grpc = require('@grpc/grpc-js');
//var protoLoader = require('@grpc/proto-loader');
import path from 'path'

class GrpcServer {
    static DDE4_PATH = process.cwd() //to dde4, ie the folder containing dde/build/
    static PROTO_PATH  //"/Users/Fry/WebstormProjects/dde4/dde/third_party/helloworld.proto"
                        //__dirname + '/../../protos/helloworld.proto';

    static packageDefinition

    static hello_proto

    static init_packageDefinition(){
        this.packageDefinition = protoLoader.loadSync(
            this.PROTO_PATH,
            {
                keepCase: true,
                longs:    String,
                enums:    String,
                defaults: true,
                oneofs:   true
            });
        this.hello_proto = grpc.loadPackageDefinition(this.packageDefinition).helloworld;
        //console.log("packageDefinition: " + JSON.stringify(this.packageDefinition)) //  big JSON obj, but still, a JSON obj that we COULD stick in-line without a file
        // console.log("_dirname: " + _dirname) //both _dirname and __dirname are unbound,
        // contrary to https://flaviocopes.com/node-get-current-folder/
        //console.log("process.cwd(): " + process.cwd())
        //console.log("build_path: " + this.build_path)
    }


    /*Implements the SayHello RPC method.*/
    static sayHello(call, callback) {
        console.log("top of sayHello") //prints out in je browser out pane whenever a message comes to the server
        let passed_in_string = call.request.name //on command line.
          // EX cmd line: node greeter_client.mjs "FRY YO"
          //then passed_in_string will be "FRY YO"  (without the double quotes).
          //default is "world"
        console.log(JSON.stringify(call))
        let instr
        let mess
        try {
            instr = eval(passed_in_string)
            console.log("evaled: " + passed_in_string + " to: " + instr)
            GrpcServer.define_wait_for_instruction_maybe() //can't use "this" in sayHello.
            if(!Job.wait_for_instruction.is_active()){
                Job.wait_for_instruction.start({initial_instruction: instr})
                console.log("Started: Job.wait_for_instruction")
            }
            else {
                Job.insert_instruction(instr,
                                       {job:    "wait_for_instruction",
                                        offset: "end"
                                       })
                console.log("Inserted Instruction: passed_in_string: " + passed_in_string)
            }
            mess = "Running Instruction: " + passed_in_string + "\nstatus: [" +
                    Dexter.dexter0.robot_status + "]"
        }
        catch(err) {
            console.log("Caught error: " + err.message)
            mess = "Hello " + passed_in_string
        }
        callback(null, {message: mess}) //you can have at most 1 call
            //to the callback. If there's a 2nd one, even the first one won't show in client,
            //and client will hang.
    }

    static define_wait_for_instruction_maybe(callback) {
        if(!Job.wait_for_instruction) {
            Dexter.dexter0.simulate = true
            new Job({
                name: "wait_for_instruction",
                when_do_list_done: "wait",
                inter_do_item_dur: 0.1,
                do_list: [
                    IO.out("Job.wait_for_instruction is waiting for an instruction.", "green")
                ]
            })
            console.log("Defined: Job.wait_for_instruction")
        }
    }

    static handleDexterInstruction(call, callback) {
        console.log("top of handleDexterInstruction") //prints out in je browser out pane whenever a message comes to the server
        let passed_in_string = call.request.name //on command line.
        // EX cmd line: node greeter_client.js "FRY YO"
        //then passed_in_string will be "FRY YO"  (without the double quotes).
        //default is "world"
        console.log(JSON.stringify(call))
        callback(null, {message: 'DexIns reply: ' + passed_in_string});
    }

    /* Starts an RPC server that receives requests for the Greeter service at the sample server port */
    static init() {
        console.log("top of GrpcServer.init")
        out("OUT: top of GrpcServer.init")
        let last_slash = this.DDE4_PATH.lastIndexOf("/")
        //this.DDE_PATH      = this.DDE4_PATH + "/dde" //path.dirname(this.BUILD_PATH) //ie stuff/dde" no slash on end
        //this.DDE_PATH      = this.DDE4_PATH.substring(0, last_slash) //+ "/www/dde"
        if(this.DDE4_PATH.endsWith("/dde/build")) {
            this.DDE4_PATH = this.DDE4_PATH.substring(0, this.DDE4_PATH.length - ("/dde/build".length))
        }
        this.PROTO_PATH    = path.join(this.DDE4_PATH, "dde", "third_party", "helloworld.proto")
        console.log("DDE4_PATH: "  + this.DDE4_PATH)
        //console.log("DDE_PATH: "   + this.DDE_PATH)
        console.log("PROTO_PATH: " + this.PROTO_PATH)
        this.init_packageDefinition()
        console.log("after init_packageDefinition")
        try {
            let gserver = new grpc.Server();
            console.log("after new grpc.Server with: " + gserver)
            gserver.addService(GrpcServer.hello_proto.Greeter.service, {sayHello: GrpcServer.sayHello});
            gserver.addService(GrpcServer.hello_proto.DexterInstruction.service, {handleDexterInstruction: GrpcServer.handleDexterInstruction});

            gserver.bindAsync('127.0.0.1:50051', //'0.0.0.0:50051',
                                   grpc.ServerCredentials.createInsecure(),
                           (err, port) => {
                                      out("grpc.Server init just before start with err: " + err + " port: " + port)
                                      if(err) {
                                          out("err.message: " + err.message)
                                      }
                                      out("gserver: " + gserver)
                                      try {
                                          gserver.start() //this line errors *sometimes* with "Error: server must be bound in order to start"
                                      }
                                      catch(err){
                                          out("grpc.Server init catch of err: " + err.message)
                                      }
                                      out("grpc init just after start")
            })
        }
        catch(err){
            console.log("GrpcServer.init errored with: " + err.message)
            out("GrpcServer.init errored with: " + err.message)
        }
        console.log("bottom of GrpcServer.init")
    }
}

globalThis.GrpcServer = GrpcServer

//GrpcServer.init();