import net from "net"
let ns = new net.Socket()

var status_only  =  "1 -1 1688585592515 undefined g;"
var joints_off_0 =  "1 0 1688585592700 undefined a 36000 72000 0 0 0;"
var joints_all_0 =  "1 0 1688585592700 undefined a 0 0 0 0 0;"

ns.on("connect",
    () => {
        console.log("ns.on connect")

        ns.write(joints_off_0)
        ns.write(joints_all_0)

        //ns.removeAllListeners()
        //ns.end()
        //ns.destroy()
    })

ns.connect(50000, "127.0.0.1")
