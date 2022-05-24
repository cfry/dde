import path from 'path'

const __dirname = path.dirname(import.meta.url).replace(/^file:\/\//, '')
//console.log("__dirname: " + __dirname)

const PROTO_PATH = __dirname + '/helloworld.proto';
//console.log("PROTO_PATH: " + PROTO_PATH)

import minimist from 'minimist'
//console.log("minimist: " + String(minimist).substring(0, 100))

import grpc        from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
var hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

function main() {
    var argv = minimist(process.argv.slice(2), {
        string: 'target'
    });
    var target;
    if (argv.target) {
        target = argv.target;
    } else {
        target = 'localhost:50051';
    }
    var client = new hello_proto.Greeter(target,
        grpc.credentials.createInsecure());
    var user;
    if (argv._.length > 0) {
        user = argv._[0];
    } else {
        user = 'world';
    }
    client.sayHello({name: user}, function(err, response) {
        console.log('Greeting:', response.message);
    });
}

main();